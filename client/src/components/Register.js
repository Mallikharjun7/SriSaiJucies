import React, { useState } from 'react';
import { Form, Button, Container, Card, Alert, Spinner } from 'react-bootstrap';
import { FaPhone, FaLock, FaUserPlus } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [phoneNumber, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Phone number validation
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  // Password validation
  const validatePassword = (pass) => {
    return pass.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      const errorMessage = 'Please enter a valid 10-digit phone number';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    // Validate password length
    if (!validatePassword(password)) {
      const errorMessage = 'Password must be at least 6 characters long';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      const errorMessage = 'Passwords do not match';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);
    // Show loading toast
    const loadingToast = toast.loading('Registering...', {
      position: "top-center",
    });

    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        phoneNumber,
        password
      });

      if (response.data.message) {
        // Update loading toast to success
        toast.update(loadingToast, {
          render: 'Registration successful!',
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });

        // Show success message and redirect to login
        setTimeout(() => {
          toast.success('Please login with your credentials', {
            position: "top-center",
            autoClose: 3000,
          });
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      // Update loading toast to error
      toast.update(loadingToast, {
        render: err.response?.data?.message || 'Failed to register. Please try again.',
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });

      const errorMessage = err.response?.data?.message || 'Failed to register. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Card className="p-4 shadow" style={{ maxWidth: '400px', width: '100%' }}>
        <Card.Body>
          <h2 className="text-center mb-4">
            <FaUserPlus className="me-2" />
            Register
          </h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>
                <FaPhone className="me-2" />
                Phone Number
              </Form.Label>
              <Form.Control
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={phoneNumber}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
                pattern="[0-9]{10}"
                maxLength={10}
              />
              <Form.Text className="text-muted">
                Please enter a 10-digit phone number
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FaLock className="me-2" />
                Password
              </Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              <Form.Text className="text-muted">
                Password must be at least 6 characters long
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <FaLock className="me-2" />
                Confirm Password
              </Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mb-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </Button>
            
            <div className="text-center">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="text-decoration-none">
                  Login here
                </Link>
              </p>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Register; 