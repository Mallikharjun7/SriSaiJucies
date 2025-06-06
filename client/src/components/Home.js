import React, { useState, useEffect } from 'react';
import { FaStar, FaClock, FaLeaf } from 'react-icons/fa';
import axios from 'axios';
import './Home.css';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'https://srisaijucies-backend.onrender.com';
  const [specialItems, setSpecialItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSpecialItems();
  }, []);

  const fetchSpecialItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/items`);
      const specialItems = response.data.filter(item => item.isSpecial === true);
      setSpecialItems(specialItems);
      setError('');
    } catch (err) {
      setError('Failed to load special items. Please try again later.');
      console.error('Error fetching special items:', err);
    } finally {
      setLoading(false);
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
    return <span className={`category-badge ${variants[category]}`}>{category}</span>;
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Sri Sai Juices</h1>
          <p>Experience the perfect blend of nature's finest fruits, crafted with love and served with passion</p>
          <button className="hero-button" onClick={() => navigate('/menu')}>
            Explore Our Menu
          </button>
        </div>
      </div>

      {/* Special Items Section */}
      <div className="special-items-section">
        <h2 className="section-title">
          Today's Special Items
        </h2>
        
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : error ? (
          <div className="error-message">
            {error}
          </div>
        ) : specialItems.length === 0 ? (
          <div className="no-items-message">
            No special items available at the moment.
          </div>
        ) : (
          <div className="special-items-grid">
            {specialItems.map((item) => (
              <div key={item._id} className="special-item-card">
                <div className="special-tag">Special</div>
                <img
                  src={item.imageUrl}
                  className="special-item-image"
                  alt={item.name}
                />
                <div className="card-content">
                  <div className="card-header">
                    <h3 className="item-title">{item.name}</h3>
                    <div className="item-info">
                      <span className={`stock-status ${item.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                        {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                      <span className="price">{formatPrice(item.price)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="features-container">
          <div className="feature-item">
            <FaClock className="feature-icon" />
            <h3>Quick Service</h3>
            <p>Get your fresh juice in minutes</p>
          </div>
          <div className="feature-item">
            <FaLeaf className="feature-icon" />
            <h3>100% Natural</h3>
            <p>No artificial ingredients</p>
          </div>
          <div className="feature-item">
            <FaStar className="feature-icon" />
            <h3>Premium Quality</h3>
            <p>Best ingredients for the best taste</p>
          </div>
        </div>
      </div>

      {/* Add Footer */}
      <footer className="simple-footer-org">
        <div className="footer-content">
          <div className="footer-logo">Sri Sai Juices</div>
          <div className="footer-links">
            <a href="/about" className="footer-link">About Us</a>
            <a href="/contact" className="footer-link">Contact</a>
            <a href="/privacy" className="footer-link">Privacy Policy</a>
            <a href="/terms" className="footer-link">Terms of Service</a>
          </div>
          <div className="footer-copyright">
            © {new Date().getFullYear()} Fruit Juice. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 