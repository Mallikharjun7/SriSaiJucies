import React, { useState } from 'react';
import { Navbar, Nav, Container, Offcanvas, Button } from 'react-bootstrap';
import { FaHome, FaUtensils, FaShoppingCart, FaClipboardList, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const NavigationBar = () => {
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('token');

  const handleCloseProfile = () => setShowProfile(false);
  const handleShowProfile = () => setShowProfile(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  return (
    <>
      <Navbar bg="light" expand="lg" className="custom-navbar">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold brand-name">
            Sri Sai Juices
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/" className="d-flex align-items-center gap-1">
                <FaHome /> Home
              </Nav.Link>
              <Nav.Link as={Link} to="/menu" className="d-flex align-items-center gap-1">
                <FaUtensils /> Menu
              </Nav.Link>
              {isLoggedIn ? (
                <>
                  <Nav.Link as={Link} to="/cart" className="d-flex align-items-center gap-1">
                    <FaShoppingCart /> Cart
                  </Nav.Link>
                  <Nav.Link as={Link} to="/orders" className="d-flex align-items-center gap-1">
                    <FaClipboardList /> Orders
                  </Nav.Link>
                  <Nav.Link onClick={handleShowProfile} className="d-flex align-items-center gap-1">
                    <FaUser /> Profile
                  </Nav.Link>
                </>
              ) : (
                <Nav.Link as={Link} to="/login" className="d-flex align-items-center gap-1">
                  <FaUser /> Login
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Offcanvas show={showProfile} onHide={handleCloseProfile} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Profile</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="text-center mb-4">
            <div className="rounded-circle bg-light p-4 d-inline-block mb-3">
              <FaUser size={40} />
            </div>
            <h5>{localStorage.getItem('userPhone')}</h5>
          </div>
          <div className="list-group">
            <button className="list-group-item list-group-item-action">Edit Profile</button>
            <button className="list-group-item list-group-item-action">Order History</button>
            <button className="list-group-item list-group-item-action">Settings</button>
            <button 
              className="list-group-item list-group-item-action text-danger d-flex align-items-center gap-2"
              onClick={handleLogout}
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default NavigationBar; 