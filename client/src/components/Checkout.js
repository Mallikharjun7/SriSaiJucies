import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaCreditCard, FaPaypal, FaLock, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './Checkout.css';

// Initialize Stripe with error handling
let stripePromise;
try {
  const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error('Stripe publishable key is missing');
  }
  stripePromise = loadStripe(publishableKey);
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
}

const Checkout = () => {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [cardError, setCardError] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Configure axios with base URL and auth token
  const api = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    // Calculate delivery charge when payment method or cart items change
    if (paymentMethod === 'cod' && totalAmount < 200) {
      // Calculate total quantity of all items
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const charge = totalQuantity * 10; // ₹10 per quantity
      setDeliveryCharge(charge);
    } else {
      setDeliveryCharge(0);
    }
  }, [paymentMethod, cartItems, totalAmount]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/cart');
      const cart = response.data;
      setCartItems(cart.items || []);
      setTotalAmount(cart.totalAmount || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to fetch cart items');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePayment = async () => {
    try {
      if (!stripe || !elements) {
        toast.error('Payment system is not properly configured. Please try again later.');
        return;
      }

      setProcessing(true);
      setCardError(null);

      // Convert amount to paise (multiply by 100) and ensure it's an integer
      const amountInPaise = Math.round(totalAmount * 100);

      // Create payment intent
      const { data } = await api.post('/api/payments/create-payment-intent', {
        amount: amountInPaise,
        currency: 'inr',
        metadata: {
          orderId: Date.now().toString(),
          customerName: formData.fullName,
          customerEmail: formData.email
        }
      });

      // Extract client secret from response
      const clientSecret = data.clientSecret;
      if (!clientSecret) {
        throw new Error('No client secret received from server');
      }

      // Confirm the payment with the client secret string
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: {
              line1: formData.address,
              city: formData.city,
              state: formData.state,
              postal_code: formData.zipCode,
              country: 'IN'
            }
          }
        }
      });

      if (error) {
        setCardError(error.message);
        toast.error(error.message);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Create order with payment details
        const orderData = {
          items: cartItems,
          totalAmount,
          shippingDetails: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode
          },
          paymentMethod: 'online',
          paymentStatus: 'Payment Done',
          paymentDetails: {
            paymentIntentId: paymentIntent.id,
            status: 'Payment Done',
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            created: paymentIntent.created
          },
          orderStatus: 'completed'
        };

        // Create order in your database
        await api.post('/api/orders', orderData);
        
        // Clear the cart
        await api.delete('/api/cart/clear');
        
        toast.success('Payment successful and order placed!');
        navigate('/checkout/success');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      navigate('/checkout/failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Only handle COD orders here
    if (paymentMethod === 'online') {
      return;
    }

    try {
      const finalAmount = totalAmount + deliveryCharge;
      
      const orderData = {
        items: cartItems,
        totalAmount: finalAmount,
        deliveryCharge,
        shippingDetails: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        paymentMethod: 'cod',
        paymentStatus: 'Pending',
        paymentDetails: {
          status: 'Pending',
          amount: finalAmount,
          currency: 'INR',
          created: new Date().toISOString()
        }
      };

      // Send order to backend
      await api.post('/api/orders', orderData);
      
      // Clear cart after successful order
      await api.delete('/api/cart/clear');
      
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      console.error('Error placing order:', err);
      toast.error('Failed to place order. Please try again.');
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

  if (loading) {
    return <div className="checkout-loading">Loading...</div>;
  }

  if (error) {
    return <div className="checkout-error">{error}</div>;
  }

  return (
    <Container className="checkout-container">
      <h2 className="text-center mb-4">Checkout</h2>
      
      <Row>
        {/* Order Summary */}
        <Col md={4}>
          <Card className="order-summary">
            <Card.Header>
              <h4>Order Summary</h4>
            </Card.Header>
            <Card.Body>
              {cartItems.map((item) => (
                <div key={item._id} className="order-item">
                  <div className="item-details">
                    <h6>{item.name}</h6>
                    <p>Quantity: {item.quantity}</p>
                    <p>Price: {formatPrice(item.price)}</p>
                  </div>
                </div>
              ))}
              <hr />
              <div className="price-breakdown">
                <p>Subtotal: {formatPrice(totalAmount)}</p>
                {paymentMethod === 'cod' && totalAmount < 200 && (
                  <p>Delivery Charge: {formatPrice(deliveryCharge)}</p>
                )}
                <h5>Total Amount: {formatPrice(paymentMethod === 'cod' ? totalAmount + deliveryCharge : totalAmount)}</h5>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Checkout Form */}
        <Col md={8}>
          <Form onSubmit={handleSubmit}>
            {/* Shipping Information */}
            <Card className="mb-4">
              <Card.Header>
                <h4>Shipping Information</h4>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>ZIP Code</Form.Label>
                      <Form.Control
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Payment Information */}
            <Card className="mb-4">
              <Card.Header>
                <h4>Payment Method</h4>
              </Card.Header>
              <Card.Body>
                <div className="payment-options">
                  <div 
                    className={`payment-option ${paymentMethod === 'online' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('online')}
                  >
                    <Form.Check
                      type="radio"
                      id="online"
                      label={
                        <span>
                          <FaCreditCard className="me-2" />
                          Online Payment
                        </span>
                      }
                      name="paymentMethod"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                    />
                  </div>
                  <div 
                    className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <Form.Check
                      type="radio"
                      id="cod"
                      label={
                        <span>
                          <FaPaypal className="me-2" />
                          Cash on Delivery
                        </span>
                      }
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                    />
                  </div>
                </div>

                {paymentMethod === 'online' && (
                  <div className="card-details mt-3">
                    <div className="test-card-info mb-3">
                      <Alert variant="info">
                        <h5>Test Card Information</h5>
                        <p>Card Number: 4242 4242 4242 4242</p>
                        <p>Expiry: Any future date (e.g., 12/34)</p>
                        <p>CVC: Any 3 digits (e.g., 123)</p>
                        <p>Postal Code: Any 5 digits</p>
                      </Alert>
                    </div>
                    <div className="stripe-card-element mb-3">
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: '#424770',
                              '::placeholder': {
                                color: '#aab7c4',
                              },
                            },
                            invalid: {
                              color: '#9e2146',
                            },
                          },
                        }}
                      />
                    </div>
                    {cardError && (
                      <div className="card-error mb-3">
                        <Alert variant="danger">{cardError}</Alert>
                      </div>
                    )}
                    <div className="d-grid gap-2">
                      <Button 
                        variant="success" 
                        size="lg" 
                        className="pay-now-btn"
                        onClick={handlePayment}
                        disabled={!stripe || processing}
                      >
                        {processing ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <FaCreditCard className="me-2" />
                            Pay Now {formatPrice(totalAmount)}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <>
                    <Alert variant="info" className="mt-3 cod-info">
                      <h5>Cash on Delivery Information</h5>
                      <p>You will pay the total amount of {formatPrice(totalAmount + deliveryCharge)} when your order is delivered.</p>
                      {totalAmount < 200 ? (
                        <p>Delivery charge of ₹10 per quantity has been added to your bill.</p>
                      ) : (
                        <p>No delivery charges for orders above ₹200!</p>
                      )}
                      <p>Please ensure you have the exact amount ready for the delivery person.</p>
                    </Alert>
                    <div className="d-grid gap-2 mt-3">
                      <Button 
                        variant="success" 
                        size="lg" 
                        type="submit"
                        className="place-order-btn"
                      >
                        <FaLock className="me-2" />
                        Place Order
                      </Button>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Checkout; 