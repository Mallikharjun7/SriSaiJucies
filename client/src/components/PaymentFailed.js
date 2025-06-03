import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button } from 'react-bootstrap';
import { FaTimesCircle } from 'react-icons/fa';

const PaymentFailed = () => {
  const navigate = useNavigate();

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="text-center p-4 shadow" style={{ maxWidth: '500px' }}>
        <Card.Body>
          <FaTimesCircle size={80} className="text-danger mb-4" />
          <Card.Title className="h2 mb-4">Payment Failed</Card.Title>
          <Card.Text className="mb-4">
            We're sorry, but your payment could not be processed.
            Please check your payment details and try again.
          </Card.Text>
          <div className="d-grid gap-2">
            <Button variant="danger" onClick={() => navigate('/checkout')}>
              Try Again
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate('/cart')}>
              Back to Cart
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PaymentFailed; 