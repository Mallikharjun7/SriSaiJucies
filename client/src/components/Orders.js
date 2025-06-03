// --- Orders.js ---
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { FaShoppingBag, FaMoneyBillWave, FaCreditCard, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { checkSessionExpiration, setupAxiosInterceptors } from '../utils/sessionManager';
import './Orders.css';

const socket = io('http://localhost:5000', { autoConnect: false });

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' }
  });

  // Setup axios interceptors
  setupAxiosInterceptors(api, navigate);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      if (!response?.data) throw new Error('No data received from server');

      const validatedOrders = response.data.map(order => ({
        ...order,
        status: order.orderStatus || 'pending',        // corrected property name
        paymentStatus: order.paymentStatus || 'pending',
        createdAt: order.createdAt || new Date().toISOString(),
        items: order.items || [],
        totalAmount: order.totalAmount || 0
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setOrders(validatedOrders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (checkSessionExpiration()) {
      navigate('/login');
      return;
    }

    socket.connect();

    // Get userId from localStorage (must be saved during login)
    const userId = localStorage.getItem('userId');
    if (userId) {
      socket.emit('joinRoom', userId); // <-- Join user-specific room here
    }

    fetchOrders();

    // Listen for order status updates
    socket.on('orderStatusUpdate', (updatedOrder) => {
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === updatedOrder.orderId
            ? { ...order, status: updatedOrder.status }
            : order
        )
      );
      toast.info(`Order #${updatedOrder.orderId.slice(-6)} status updated to ${updatedOrder.status}`);
    });

    return () => {
      socket.off('orderStatusUpdate');
      socket.disconnect();
    };
  }, [navigate]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { bg: 'warning', text: 'Pending' },
      'processing': { bg: 'info', text: 'Processing' },
      'shipped': { bg: 'primary', text: 'Shipped' },
      'delivered': { bg: 'success', text: 'Delivered' },
      'cancelled': { bg: 'danger', text: 'Cancelled' },
      'completed': { bg: 'success', text: 'Completed' }
    };

    const config = statusConfig[status] || { bg: 'secondary', text: status };
    return (
      <Badge bg={config.bg} className="status-badge">
        {config.text}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus, paymentMethod) => {
    let bg = 'warning';
    let text = 'Pending';

    if (paymentMethod === 'online' && paymentStatus === 'Payment Done') {
      bg = 'success';
      text = 'Payment Done';
    } else if (paymentMethod === 'cod') {
      bg = 'info';
      text = 'Cash on Delivery';
    }

    return (
      <Badge bg={bg} className="status-badge">
        {text}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) return <div className="orders-loading"><Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner></div>;
  if (error) return <div className="orders-error">{error}</div>;

  return (
    <Container className="orders-container">
      <h2 className="text-center mb-4">Your Orders</h2>
      {orders.length === 0 ? (
        <div className="empty-orders">
          <div className="empty-orders-icon">
            <FaShoppingBag />
          </div>
          <h3>No Orders Yet</h3>
          <p>Looks like you haven't placed any orders yet.</p>
          <button 
            className="start-shopping"
            onClick={() => navigate('/menu')}
          >
            Start Shopping
            <FaArrowRight className="arrow-icon" />
          </button>
        </div>
      ) : (
        <Row>
          {orders.map(order => (
            <Col key={order._id} md={6} lg={4} className="mb-4">
              <Card className="order-card h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">Order #{order._id?.slice(-6)}</h5>
                    <small className="text-muted">{formatDate(order.createdAt)}</small>
                  </div>
                  <div className="d-flex gap-2">
                    {getPaymentStatusBadge(order.paymentStatus, order.paymentMethod)}
                    {getStatusBadge(order.status)}
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="order-items flex-grow-1">
                    {order.items?.map(item => (
                      <div key={item._id} className="order-item">
                        <div className="item-details">
                          <h6>{item.name || 'Unknown Item'}</h6>
                          <p>Quantity: {item.quantity || 0}</p>
                          <p>Price: {formatPrice(item.price || 0)}</p>
                        </div>
                      </div>
                    )) || <p>No items in this order</p>}
                  </div>
                  <hr />
                  <div className="order-summary">
                    <div className="payment-method">
                      {order.paymentMethod === 'online' ? <FaCreditCard className="me-2" /> : <FaMoneyBillWave className="me-2" />}
                      {order.paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}
                    </div>
                    <div className="total-amount">
                      <h5>Total: {formatPrice(order.totalAmount || 0)}</h5>
                    </div>
                  </div>
                </Card.Body>
                <Card.Footer>
                  <div className="shipping-address">
                    <h6>Shipping Address:</h6>
                    <p className="mb-1">{order.shippingDetails?.fullName || 'N/A'}</p>
                    <p className="mb-1">{order.shippingDetails?.address || 'N/A'}</p>
                    <p className="mb-1">{order.shippingDetails?.city || 'N/A'}, {order.shippingDetails?.state || 'N/A'} {order.shippingDetails?.zipCode || 'N/A'}</p>
                    <p className="mb-0">Phone: {order.shippingDetails?.phone || 'N/A'}</p>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Orders;
