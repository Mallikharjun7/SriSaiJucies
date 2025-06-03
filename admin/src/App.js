import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import AddMenuItem from './components/AddMenuItem';
import MenuItems from './components/MenuItems';
import TrackOrders from './components/TrackOrders';
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes = () => {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <Routes>
        <Route 
          path="/" 
          element={admin ? <Navigate to="/menu-items" /> : <Login />} 
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-menu"
          element={
            <ProtectedRoute>
              <AddMenuItem />
            </ProtectedRoute>
          }
        />
        <Route
          path="/menu-items"
          element={
            <ProtectedRoute>
              <MenuItems />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <TrackOrders />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;