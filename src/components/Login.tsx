import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated as checkAuth } from '../auth/authUtils'; // Renamed import to avoid conflict

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginSuccess, setIsLoginSuccess] = useState(false);
  
  // Check if user is already authenticated
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('logout')) {
      // Just logged out, don't check authentication or redirect
      return;
    }
  
    // First check localStorage
    if (checkAuth()) {
      redirectToDashboard();
      return;
    }
    
    
  }, [navigate]);
  
  const redirectToDashboard = () => {
    // Set a flag in sessionStorage to indicate we're in login->redirect flow
    sessionStorage.setItem('login_redirect', 'true');
    
    // Add a slight delay to ensure cookies are properly set
    setTimeout(() => {
      if (import.meta.env.PROD) {
        window.location.href = 'https://app.enviadores.com.mx';
      } else {
        navigate('/dashboard');
      }
    }, 100);
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
  
      // Mark login as successful
      setIsLoginSuccess(true);
      
      // Add a short delay before redirect to ensure cookies are set
      setTimeout(() => {
        // Redirect
        if (import.meta.env.PROD) {
          window.location.href = 'https://app.enviadores.com.mx';
        } else {
          navigate('/dashboard');
        }
      }, 200);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoginSuccess(false);
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Centro de Envíos</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {isLoginSuccess && <p className="text-green-500 text-sm mb-4">Login successful, redirecting...</p>}
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
            disabled={isLoading || isLoginSuccess}
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
            disabled={isLoading || isLoginSuccess}
            required
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          className={`w-full ${isLoginSuccess ? 'bg-green-600' : 'bg-blue-600'} text-white p-2 rounded hover:bg-blue-700 transition-colors`}
          disabled={isLoading || isLoginSuccess}
        >
          {isLoading ? 'Procesando...' : isLoginSuccess ? 'Redirigiendo...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}