import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaArrowRight } from 'react-icons/fa';
import { checkSessionExpiration, setupAxiosInterceptors } from '../utils/sessionManager';
import './Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Configure axios with base URL and auth token
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Setup axios interceptors
  setupAxiosInterceptors(api, navigate);

  // Fetch cart items
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      // Handle the nested cart structure
      const cart = response.data;
      setCartItems(cart.items || []);
      setTotalAmount(cart.totalAmount || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching cart:', err);
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
      await api.post('/cart/add', {
        name: item.name,
        imageUrl: item.imageUrl,
        price: item.price,
        quantity: 1
      });
      fetchCart();
      toast.success('Item added to cart');
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Failed to add item to cart');
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId, quantity) => {
    try {
      await api.put(`/cart/update/${itemId}`, { quantity });
      fetchCart();
      toast.success('Quantity updated');
    } catch (err) {
      console.error('Error updating quantity:', err);
      toast.error('Failed to update quantity');
    }
  };

  // Remove item from cart
  const removeItem = async (itemId) => {
    try {
      await api.delete(`/cart/remove/${itemId}`);
      fetchCart();
      toast.success('Item removed from cart');
    } catch (err) {
      console.error('Error removing item:', err);
      toast.error('Failed to remove item');
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setCartItems([]);
      setTotalAmount(0);
      toast.success('Cart cleared');
    } catch (err) {
      console.error('Error clearing cart:', err);
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
    if (checkSessionExpiration()) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [navigate]);

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
                    onClick={() => removeItem(item._id)}
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