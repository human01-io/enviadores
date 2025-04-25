// Modified useAuth.ts
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getCurrentRole } from '../auth/authUtils';

export function useAuth(redirectIfUnauthenticated = false) {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  useEffect(() => {
    // Check if we're in a post-logout state
    const logoutTimestamp = sessionStorage.getItem('logged_out_at');
    const urlParams = new URLSearchParams(window.location.search);
    
    // Don't redirect if we just logged out
    if (logoutTimestamp || urlParams.has('logout')) {
      console.log("Recent logout detected in useAuth hook, not redirecting");
      return;
    }

    if (redirectIfUnauthenticated && !authenticated) {
      console.log("Not authenticated, redirecting to login");
      
      // Add a small delay to prevent immediate redirection loops
      const timer = setTimeout(() => {
        if (import.meta.env.PROD) {
          window.location.href = 'https://login.enviadores.com.mx';
        } else {
          navigate('/login');
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [authenticated, navigate, redirectIfUnauthenticated]);

  return {
    isAuthenticated: authenticated,
    role: getCurrentRole(),
  };
}