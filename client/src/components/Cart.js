import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaArrowRight } from 'react-icons/fa';
import './Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Configure axios with base URL and auth token
  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      baseURL: 'http://localhost:5000',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
  };

  // Fetch cart items
  const fetchCart = async () => {
    try {
      setLoading(true);
      const config = getAuthConfig();
      const response = await axios.get('/api/cart', config);
      // Handle the nested cart structure
      const cart = response.data;
      setCartItems(cart.items || []);
      setTotalAmount(cart.totalAmount || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching cart:', err);
      if (err.message === 'No authentication token found' || err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.setItem('redirectPath', '/cart');
        navigate('/login');
        return;
      }
      setError('Failed to fetch cart items');
      setCartItems([]);
      setTotalAmount(0);
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (item) => {
    try {
      const config = getAuthConfig();
      await axios.post('/api/cart/add', {
        name: item.name,
        imageUrl: item.imageUrl,
        price: item.price,
        quantity: 1
      }, config);
      fetchCart();
      toast.success('Item added to cart');
    } catch (err) {
      console.error('Error adding to cart:', err);
      if (err.message === 'No authentication token found' || err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.setItem('redirectPath', '/cart');
        navigate('/login');
        return;
      }
      toast.error('Failed to add item to cart');
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    try {
      const config = getAuthConfig();
      await axios.delete(`/api/cart/remove/${itemId}`, config);
      fetchCart();
      toast.success('Item removed from cart');
    } catch (err) {
      console.error('Error removing from cart:', err);
      if (err.message === 'No authentication token found' || err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.setItem('redirectPath', '/cart');
        navigate('/login');
        return;
      }
      toast.error('Failed to remove item from cart');
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      const config = getAuthConfig();
      await axios.put(`/api/cart/update/${itemId}`, {
        quantity: newQuantity
      }, config);
      fetchCart();
    } catch (err) {
      console.error('Error updating quantity:', err);
      if (err.message === 'No authentication token found' || err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.setItem('redirectPath', '/cart');
        navigate('/login');
        return;
      }
      toast.error('Failed to update quantity');
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      const config = getAuthConfig();
      await axios.delete('/api/cart/clear', config);
      fetchCart();
      toast.success('Cart cleared successfully');
    } catch (err) {
      console.error('Error clearing cart:', err);
      if (err.message === 'No authentication token found' || err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.setItem('redirectPath', '/cart');
        navigate('/login');
        return;
      }
      toast.error('Failed to clear cart');
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

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading) {
    return <div className="cart-loading">Loading cart...</div>;
  }

  if (error) {
    return <div className="cart-error">{error}</div>;
  }

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>
      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">
            <FaShoppingCart />
          </div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any items to your cart yet.</p>
          <button 
            className="continue-shopping"
            onClick={() => navigate('/menu')}
          >
            Continue Shopping
            <FaArrowRight className="arrow-icon" />
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item._id} className="cart-item">
                <div className="item-image-container">
                  <img src={item.imageUrl} alt={item.name} className="item-image" />
                  <div className="quantity-controls">
                    <button 
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="item-details">
                  <h3 className="item-name">{item.name}</h3>
                  <p className="item-price">Price: {formatPrice(item.price)}</p>
                  <button 
                    className="remove-button"
                    onClick={() => removeFromCart(item._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>Total Amount: {formatPrice(totalAmount)}</h3>
            <div className="cart-actions">
              <button className="clear-cart" onClick={clearCart}>
                Clear Cart
              </button>
              <button 
                className="checkout-button"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart; 