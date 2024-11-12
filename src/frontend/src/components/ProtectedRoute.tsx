// src/frontend/src/components/ProtectedRoute.tsx

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn, isAdmin } = useContext(AuthContext);

  if (!isLoggedIn) {
    // Redirect to login page if not logged in
    alert('You must be logged in to view this page.');
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    // Redirect to home page if not an admin
    alert('You must be an admin to view this page.');
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;