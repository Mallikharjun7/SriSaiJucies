import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Form } from 'react-bootstrap';
import { FaSearch, FaShoppingCart, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Menu.css';

const Menu = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const navigate = useNavigate();

  // Create axios instance with auth header
  const api = axios.create({
    baseURL: 'https://srisaijucies-backend.onrender.com/api',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('https://srisaijucies-backend.onrender.com/api/items');
      setItems(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load menu items. Please try again later.');
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (item) => {
    try {
      const response = await api.post('/cart/add', {
        name: item.name,
        imageUrl: item.imageUrl,
        price: item.price,
        quantity: 1
      });
      
      toast.success(
        <div className="toast-success">
          <div className="toast-content">
            <h6>Added to Cart!</h6>
          </div>
        </div>
      );
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error(
          <div className="toast-error">
            <div className="toast-content">
              <h6>Login Required</h6>
              <p>Please login to add items to cart</p>
            </div>
          </div>
        );
        navigate('/login');
      } else {
        toast.error(
          <div className="toast-error">
            <div className="toast-content">
              <h6>Error</h6>
              <p>Failed to add item to cart</p>
            </div>
          </div>
        );
        console.error('Error adding to cart:', err);
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getCategoryBadge = (category) => {
    const variants = {
      'Juice': 'primary',
      'Milkshake': 'info',
      'Smoothie': 'success'
    };
    return <Badge bg={variants[category]}>{category}</Badge>;
  };

  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'date':
          comparison = new Date(b.createdAt) - new Date(a.createdAt);
          break;
        default:
          comparison = 0;
      }
      return comparison;
    });
  };

  const filteredItems = sortItems(items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }));

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="text-center mb-4">Our Menu</h2>

      {/* Search Bar */}
      <Row className="mb-4">
        <Col md={12}>
          <div className="search-container">
            <FaSearch className="search-icon" />
            <Form.Control
              type="text"
              placeholder="Search items by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="searchinput"
            />
          </div>
        </Col>
      </Row>

      {/* Filter Options */}
      <Row className="mb-4">
        <Col md={12}>
          <div className="filter-container">
            <div className="filter-group">
              <label>Sort By:</label>
              <Form.Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="date">Date Added</option>
              </Form.Select>
            </div>
            <div className="filter-group">
              <label>Category:</label>
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                <option value="Juice">Juices</option>
                <option value="Smoothie">Smoothies</option>
                <option value="Milkshake">Milkshakes</option>
              </Form.Select>
            </div>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {filteredItems.length === 0 ? (
        <Alert variant="info" className="text-center">
          No items found matching your criteria.
        </Alert>
      ) : (
        <Row>
          {filteredItems.map((item) => (
            <Col key={item._id} md={4} className="mb-4">
              <Card className="h-100 menu-item-card">
                <div className="image-container">
                  <Card.Img
                    variant="top"
                    src={item.imageUrl}
                    className="menu-item-image"
                    alt={item.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/350x200?text=No+Image';
                    }}
                  />
                </div>
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="mb-0 text-truncate" style={{ maxWidth: '70%' }}>{item.name}</Card.Title>
                    {getCategoryBadge(item.category)}
                  </div>
                  <Card.Text className="text-muted mb-3">
                    {item.category} • {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </Card.Text>
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <span className="price">{formatPrice(item.price)}</span>
                    <Button
                      size="sm"
                      className="addToCart"
                      onClick={() => handleAddToCart(item)}
                      disabled={item.stock === 0}
                    >
                      <FaShoppingCart className="me-2" />
                      Add to Cart
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Menu; 