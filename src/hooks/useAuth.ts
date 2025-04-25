import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getCurrentRole } from '../auth/authUtils';

export function useAuth(redirectIfUnauthenticated = false) {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = isAuthenticated();
      console.log("useAuth hook - Authentication check result:", isAuth);
      setAuthenticated(isAuth);
      setIsChecking(false);
      
      if (redirectIfUnauthenticated && !isAuth) {
        console.log("useAuth hook - Not authenticated, redirecting to login");
        if (import.meta.env.PROD) {
          // Add a timestamp to prevent caching issues
          window.location.href = `https://login.enviadores.com.mx?redirect=${Date.now()}`;
        } else {
          navigate('/login');
        }
      }
    };
    
    // Check auth immediately
    checkAuth();
    
    // Set up a recurring check every few seconds to catch cookie expiration
    // This helps prevent the user from staying on protected pages with expired auth
    const interval = setInterval(() => {
      const currentAuth = isAuthenticated();
      // Only redirect if auth status changed from true to false
      if (authenticated && !currentAuth && redirectIfUnauthenticated) {
        console.log("useAuth hook - Auth status changed, redirecting to login");
        if (import.meta.env.PROD) {
          window.location.href = `https://login.enviadores.com.mx?redirect=${Date.now()}&reason=expired`;
        } else {
          navigate('/login');
        }
      }
      setAuthenticated(currentAuth);
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [authenticated, navigate, redirectIfUnauthenticated]);

  return {
    isAuthenticated: authenticated,
    role: getCurrentRole(),
    isChecking
  };
}