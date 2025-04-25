import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getCurrentRole } from '../auth/authUtils';

export function useAuth(redirectIfUnauthenticated = false) {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  useEffect(() => {
    if (redirectIfUnauthenticated && !authenticated) {
      if (import.meta.env.PROD) {
        window.location.href = 'https://login.enviadores.com.mx';
      } else {
        navigate('/login');
      }
    }
  }, [authenticated, navigate, redirectIfUnauthenticated]);

  return {
    isAuthenticated: authenticated,
    role: getCurrentRole(),
  };
}