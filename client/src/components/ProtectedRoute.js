import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children }) => {
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!token || !isLoggedIn) {
      toast.error('Please login to access this page');
      setShouldRedirect(true);
    }
  }, []);

  if (shouldRedirect) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
