// --- Orders.js ---
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { FaShoppingBag, FaMoneyBillWave, FaCreditCard, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);

  // Configure axios with base URL and auth token
  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      baseURL: process.env.REACT_APP_API_URL || 'https://srisaijucies-backend.onrender.com',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
  };

  // Format amount to integer
  const formatAmount = (amount) => {
    return Math.round(amount);
  };

  // Format payment method display
  const formatPaymentMethod = (method, transactionId) => {
    if (!method) return 'Not specified';
    
    if (method === 'online' && transactionId) {
      return `Card ending in ${transactionId.slice(-4)}`;
    }
    
    return method.toUpperCase();
  };

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'https://srisaijucies-backend.onrender.com', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    // Socket connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      // Join user's room using userId
      const userId = localStorage.getItem('userId');
      if (userId) {
        newSocket.emit('joinUserRoom', userId);
        console.log('Joined user room:', userId);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Failed to connect to real-time updates');
    });

    // Listen for order status updates
    newSocket.on('orderStatusUpdate', (data) => {
      console.log('Received order status update:', data);
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => {
          if (order._id === data.orderId) {
            console.log('Updating order:', order._id, 'New status:', data.status);
            return { ...order, orderStatus: data.status };
          }
          return order;
        });
        console.log('Updated orders:', updatedOrders);
        return updatedOrders;
      });
      toast.info(`Order status updated to: ${data.status}`);
    });

    setSocket(newSocket);

    // Cleanup socket connection on unmount
    return () => {
      console.log('Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get('/api/orders', config);
      console.log('Fetched orders:', response.data);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.message === 'No authentication token found' || error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.setItem('redirectPath', '/orders');
        navigate('/login');
        return;
      }
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    // Default status if none provided
    const orderStatus = status || 'processing';
    console.log('Getting status badge for:', orderStatus);
    
    const statusConfig = {
      'processing': { variant: 'info', text: 'Processing' },
      'shipped': { variant: 'primary', text: 'Shipped' },
      'delivered': { variant: 'success', text: 'Delivered' },
      'cancelled': { variant: 'danger', text: 'Cancelled' }
    };

    const config = statusConfig[orderStatus.toLowerCase()] || { variant: 'secondary', text: orderStatus };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getPaymentStatusBadge = (status) => {
    // Default status if none provided
    const paymentStatus = status || 'pending';
    
    const statusConfig = {
      'pending': { variant: 'warning', text: 'Payment Pending' },
      'completed': { variant: 'success', text: 'Paid' },
      'failed': { variant: 'danger', text: 'Payment Failed' }
    };

    const config = statusConfig[paymentStatus.toLowerCase()] || { variant: 'secondary', text: paymentStatus };
    return <Badge bg={config.variant}>{config.text}</Badge>;
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

  if (loading) {
    return (
      <Container className="orders-container">
        <div className="loading-container">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  if (orders.length === 0) {
    return (
      <Container className="orders-container">
        <div className="no-orders">
          <FaShoppingBag size={48} />
          <h2>No Orders Yet</h2>
          <p>Start shopping to see your orders here</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="orders-container">
      <h2 className="orders-title">Your Orders</h2>
      <div className="orders-list">
        {orders.map((order) => (
          <Card key={order._id} className="order-card">
            <Card.Body>
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order._id.slice(-6)}</h3>
                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="status-badges">
                  <div className="status-item">
                    <span className="status-label">Order Status:</span>
                    {getStatusBadge(order.orderStatus)}
                  </div>
                  <div className="status-item">
                    <span className="status-label">Payment Status:</span>
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                </div>
              </div>
              
              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="order-item-image"
                    />
                    <div className="order-item-details">
                      <h4>{item.name}</h4>
                      <p>Quantity: {item.quantity}</p>
                      <p>Price: ₹{formatAmount(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <FaMoneyBillWave className="icon" />
                  <span>Total: ₹{formatAmount(order.totalAmount)}</span>
                </div>
                <div className="order-payment">
                  <FaCreditCard className="icon" />
                  <span>{formatPaymentMethod(order.paymentMethod, order.transactionId)}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>
    </Container>
  );
};

export default Orders;
