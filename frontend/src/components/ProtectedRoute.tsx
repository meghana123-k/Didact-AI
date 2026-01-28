
import React from 'react';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
  fallback: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAuthenticated, children, fallback }) => {
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
