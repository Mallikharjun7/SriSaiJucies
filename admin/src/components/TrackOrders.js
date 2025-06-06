import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import './TrackOrders.css';

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
};

const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};

const TrackOrders = () => {
    const API_URL = process.env.REACT_APP_API_URL || 'https://srisaijucies-backend.onrender.com';
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [groupedOrders, setGroupedOrders] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [dateFilter, setDateFilter] = useState({
        startDate: '',
        endDate: ''
    });
    const [statusFilter, setStatusFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
            navigate('/');
            return;
        }

        const socket = io(`${API_URL}`, {
            auth: {
                token: adminToken
            }
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            if (err.message.includes('Authentication error')) {
                localStorage.removeItem('adminToken');
                navigate('/');
            }
        });

        // Remove joinAdmin emit - server auto joins admin room based on token
        // socket.emit('joinAdmin');

        socket.on('orderStatusUpdate', ({ orderId, status }) => {
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order._id === orderId ? { ...order, orderStatus: status } : order
                )
            );
            setSuccess('Order status updated in real-time');
            setTimeout(() => setSuccess(''), 3000);
        });

        return () => {
            socket.disconnect();
        };
    }, [navigate]);

    const fetchOrders = async () => {
        try {
            const adminToken = localStorage.getItem('adminToken');
            if (!adminToken) {
                navigate('/');
                return;
            }

            const response = await axios.get(`${API_URL}/api/admin/orders`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            setOrders(response.data);
            setError('');
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('adminToken');
                navigate('/');
            } else {
                setError('Failed to fetch orders');
            }
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [navigate]);

    useEffect(() => {
        if (dateFilter.startDate && dateFilter.endDate) {
            const filtered = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                const start = new Date(dateFilter.startDate);
                const end = new Date(dateFilter.endDate);
                end.setHours(23, 59, 59, 999);
                return orderDate >= start && orderDate <= end;
            });
            setFilteredOrders(filtered);
        } else {
            // If no date filter is set, show today's orders with status filter
            const todayOrders = orders.filter(order => {
                const isTodayOrder = isToday(order.createdAt);
                if (statusFilter === 'all') return isTodayOrder;
                return isTodayOrder && order.orderStatus === statusFilter;
            });
            setFilteredOrders(todayOrders);
        }
    }, [orders, dateFilter, statusFilter]);

    useEffect(() => {
        // Group orders by date
        const grouped = filteredOrders.reduce((acc, order) => {
            const date = formatDate(order.createdAt);
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(order);
            return acc;
        }, {});

        // Sort dates in descending order (newest first)
        const sortedDates = Object.keys(grouped).sort((a, b) => 
            new Date(b) - new Date(a)
        );

        // Create new object with sorted dates
        const sortedGrouped = {};
        sortedDates.forEach(date => {
            sortedGrouped[date] = grouped[date];
        });

        setGroupedOrders(sortedGrouped);
    }, [filteredOrders]);

    const handleDateFilterChange = (e) => {
        const { name, value } = e.target;
        setDateFilter(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
    };

    const clearFilters = () => {
        setDateFilter({
            startDate: '',
            endDate: ''
        });
        setStatusFilter('all');
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const adminToken = localStorage.getItem('adminToken');
            if (!adminToken) {
                navigate('/');
                return;
            }

            await axios.put(`${API_URL}/api/admin/orders/${orderId}/status`,
                { orderStatus: newStatus },
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                }
            );
            setSuccess('Order status updated successfully');
            setError('');
            // No need to fetchOrders here since socket will update state
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('adminToken');
                navigate('/');
            } else {
                setError('Failed to update order status');
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'processing':
                return 'bg-yellow-100 text-yellow-800';
            case 'shipped':
                return 'bg-blue-100 text-blue-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
                <h1 className="text-2xl font-semibold text-gray-900 mb-6">Track Orders</h1>

                {error && (
                    <div className="error-message mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-message mb-4">
                        {success}
                    </div>
                )}

                <div className="filters-container">
                    <div className="date-filter-container">
                        <div className="date-filter-header">
                            <h3 className="filter-title">Filter Orders by Date</h3>
                            <p className="filter-subtitle">
                                {!dateFilter.startDate && !dateFilter.endDate 
                                    ? "Currently showing today's orders" 
                                    : "Showing filtered orders"}
                            </p>
                        </div>
                        <div className="date-filter-inputs">
                            <div className="date-input-group">
                                <label htmlFor="startDate">Start Date:</label>
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={dateFilter.startDate}
                                    onChange={handleDateFilterChange}
                                    className="date-input"
                                />
                            </div>
                            <div className="date-input-group">
                                <label htmlFor="endDate">End Date:</label>
                                <input
                                    type="date"
                                    id="endDate"
                                    name="endDate"
                                    value={dateFilter.endDate}
                                    onChange={handleDateFilterChange}
                                    className="date-input"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={clearFilters}
                        className="clear-filter-btn"
                    >
                        Show All Orders
                    </button>
                </div>

                <div className="orders-container">
                    {Object.entries(groupedOrders).map(([date, dateOrders]) => (
                        <div key={date} className="date-group">
                            <div className="date-header-container">
                                <h2 className="date-header">
                                    {isToday(new Date(dateOrders[0].createdAt)) ? "Today's Orders" : date}
                                </h2>
                                {isToday(new Date(dateOrders[0].createdAt)) && (
                                    <div className="status-filter-buttons">
                                        <button
                                            className={`status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                                            onClick={() => setStatusFilter('all')}
                                        >
                                            All
                                        </button>
                                        <button
                                            className={`status-filter-btn ${statusFilter === 'processing' ? 'active' : ''}`}
                                            onClick={() => setStatusFilter('processing')}
                                        >
                                            Processing
                                        </button>
                                        <button
                                            className={`status-filter-btn ${statusFilter === 'delivered' ? 'active' : ''}`}
                                            onClick={() => setStatusFilter('delivered')}
                                        >
                                            Delivered
                                        </button>
                                        <button
                                            className={`status-filter-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
                                            onClick={() => setStatusFilter('cancelled')}
                                        >
                                            Cancelled
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="orders-row">
                                {dateOrders.map((order) => (
                                    <div key={order._id} className="order-card">
                                        <div className="order-header">
                                            <h3 className="order-id">Order #{order._id.slice(-6)}</h3>
                                            <span className={`status-badge ${getStatusColor(order.orderStatus)}`}>
                                                {order.orderStatus}
                                            </span>
                                        </div>

                                        <div className="order-details">
                                            <div className="customer-info">
                                                <h4 className="section-title">Customer Details</h4>
                                                <p><strong>Name:</strong> {order.shippingDetails.fullName}</p>
                                                <p><strong>Email:</strong> {order.shippingDetails.email}</p>
                                                <p><strong>Phone:</strong> {order.shippingDetails.phone}</p>
                                                <p><strong>Address:</strong> {order.shippingDetails.address}, {order.shippingDetails.city}, {order.shippingDetails.state} {order.shippingDetails.zipCode}</p>
                                            </div>

                                            <div className="order-items">
                                                <h4 className="section-title">Order Items</h4>
                                                {order.items.map((item, index) => (
                                                    <div key={index} className="order-item">
                                                        <img src={item.imageUrl} alt={item.name} className="item-image" />
                                                        <div className="item-details">
                                                            <p className="item-name">{item.name}</p>
                                                            <p className="item-quantity">Quantity: {item.quantity}</p>
                                                            <p className="item-price">${item.price}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="order-summary">
                                                <h4 className="section-title">Order Summary</h4>
                                                <p><strong>Total Amount:</strong> ${order.totalAmount}</p>
                                                <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                                                <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
                                                <p><strong>Order Time:</strong> {new Date(order.createdAt).toLocaleTimeString()}</p>
                                            </div>

                                            <div className="status-update">
                                                <h4 className="section-title">Update Status</h4>
                                                <select
                                                    value={order.orderStatus}
                                                    onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                                    className="status-select"
                                                >
                                                    <option value="processing">Processing</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrackOrders;
