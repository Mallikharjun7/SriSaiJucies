import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('adminToken');
            if (token) {
                try {
                    const response = await api.get('/verify');
                    setAdmin({ phoneNumber: response.data.phoneNumber });
                } catch (error) {
                    localStorage.removeItem('adminToken');
                    setAdmin(null);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (phoneNumber, password) => {
        try {
            const response = await api.post('/login', { phoneNumber, password });
            const data = response.data;
            localStorage.setItem('adminToken', data.token);
            setAdmin({ phoneNumber: data.admin.phoneNumber });
            return data;
        } catch (error) {
            throw error.response?.data || { message: 'An error occurred' };
        }
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        setAdmin(null);
    };

    return (
        <AuthContext.Provider value={{ admin, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 