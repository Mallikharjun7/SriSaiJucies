import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button } from 'react-bootstrap';
import { FaCheckCircle } from 'react-icons/fa';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="text-center p-4 shadow" style={{ maxWidth: '500px' }}>
        <Card.Body>
          <FaCheckCircle size={80} className="text-success mb-4" />
          <Card.Title className="h2 mb-4">Payment Successful!</Card.Title>
          <Card.Text className="mb-4">
            Thank you for your order. Your payment has been processed successfully.
            You will receive a confirmation email shortly.
          </Card.Text>
          <div className="d-grid gap-2">
            <Button variant="primary" onClick={() => navigate('/orders')}>
              View Orders
            </Button>
            <Button variant="outline-primary" onClick={() => navigate('/menu')}>
              Continue Shopping
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PaymentSuccess; 