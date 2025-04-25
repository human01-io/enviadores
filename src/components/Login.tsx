import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated as checkAuth } from '../auth/authUtils'; // Renamed import to avoid conflict

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Check if user is already authenticated
// Modified Login.tsx useEffect
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check for explicit logout parameter
  if (urlParams.has('logout')) {
    // Just logged out, ensure we don't redirect immediately
    console.log("Logged out, staying on login page");
    
    // Clear any lingering authentication state
    localStorage.clear();
    sessionStorage.removeItem('logged_out_at');
    
    // Don't check authentication or redirect
    return;
  }
  
  // Get the logout timestamp from sessionStorage
  const logoutTimestamp = sessionStorage.getItem('logged_out_at');
  if (logoutTimestamp) {
    const logoutTime = parseInt(logoutTimestamp, 10);
    const currentTime = Date.now();
    
    // If logged out within the last 3 seconds, stay on login page
    if (currentTime - logoutTime < 3000) {
      console.log("Recent logout detected, staying on login page");
      return;
    }
    
    // Clear the logout timestamp
    sessionStorage.removeItem('logged_out_at');
  }

  // First check localStorage
  if (checkAuth()) {
    redirectToDashboard();
    return;
  }
  
  // Then check cookies - but be more careful with them
  try {
    const cookies = document.cookie.split(';').map(c => c.trim());
    const authCookie = cookies.find(c => c.startsWith('auth_token='));
    const roleCookie = cookies.find(c => c.startsWith('user_role='));
    
    // Only redirect if we have both required cookies with valid values
    if (authCookie && roleCookie) {
      const authToken = authCookie.split('=')[1];
      const role = roleCookie.split('=')[1];
      
      // Only proceed if cookies actually have values
      if (authToken && role && authToken.length > 10) {
        // If auth cookies exist, store them in localStorage for consistency
        localStorage.setItem('user_role', role);
        localStorage.setItem('auth_token', authToken);
        redirectToDashboard();
      }
    }
  } catch (error) {
    console.error('Error checking auth cookies:', error);
  }
}, [navigate]);
  
  const redirectToDashboard = () => {
    if (import.meta.env.PROD) {
      window.location.href = 'https://app.enviadores.com.mx';
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setIsLoading(true); // Add loading state to show feedback to user
    
    try {
      const response = await fetch('https://enviadores.com.mx/api/login.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: email, // Can be email, username, or phone
          password: password
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
  
      // Store token securely
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        
        // Optional: Store token expiration time
        const expiresAt = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours from now
        localStorage.setItem('auth_token_expiry', expiresAt.toString());
      } else {
        throw new Error('No authentication token received');
      }
      
      // Store user info
      if (data.user) {
        if (data.user.role) {
          localStorage.setItem('user_role', data.user.role);
        }
        // Store other useful user data
        if (data.user.username) {
          localStorage.setItem('username', data.user.username);
        }
        if (data.user.id) {
          localStorage.setItem('user_id', data.user.id.toString());
        }
      }
  
      // Redirect
      if (import.meta.env.PROD) {
        window.location.href = 'https://app.enviadores.com.mx';
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Centro de Envíos</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isLoading}
            required
            autoComplete="username"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isLoading}
            required
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
          disabled={isLoading}
        >
          Iniciar sesión
        </button>
      </form>
    </div>
  );
}