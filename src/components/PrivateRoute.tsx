import { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PrivateRouteProps {
  children: ReactElement;
  requiredRole?: string;
}

export function PrivateRoute({ children, requiredRole }: PrivateRouteProps) {
  const { isAuthenticated, role } = useAuth(true);

  if (!isAuthenticated) {
    return null; // The hook will handle the redirect
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}