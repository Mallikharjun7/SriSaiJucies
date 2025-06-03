import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaList, FaClipboardList, FaBars, FaTimes } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
    const { admin, logout } = useAuth();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (!admin) return null;

    const menuItems = [
        { path: '/add-menu', label: 'Add Menu Items', icon: <FaPlus /> },
        { path: '/menu-items', label: 'Menu Items', icon: <FaList /> },
        { path: '/orders', label: 'Track Orders', icon: <FaClipboardList /> },
    ];

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <span className="navbar-title">Admin Panel</span>
                </Link>

                <button className="mobile-menu-btn" onClick={toggleMenu}>
                    {isMenuOpen ? <FaTimes className="mobile-menu-icon" /> : <FaBars className="mobile-menu-icon" />}
                </button>

                <div className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`navbar-link ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}

                    <div className="navbar-user">
                        <button onClick={logout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 