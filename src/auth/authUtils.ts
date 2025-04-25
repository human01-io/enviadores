// Centralized authentication logic
export const getCurrentRole = (): string | null => {
  // Check localStorage first
  const localRole = localStorage.getItem('user_role');
  if (localRole) return localRole;
  
  // Then check cookies
  const cookies = document.cookie.split(';')
    .map(cookie => cookie.trim());
  const roleCookie = cookies
    .find(cookie => cookie.startsWith('user_role='));
    
  return roleCookie ? 
    roleCookie.split('=')[1] : null;
};

export const isAuthenticated = (): boolean => {
  console.log("Checking auth on:", window.location.href);
  console.log("Document cookie:", document.cookie);
  console.log("localStorage user_role:", localStorage.getItem('user_role'));
  
  // If URL has logout parameter, ALWAYS return false
  if (window.location.search.includes('logout')) {
    console.log("Logout parameter detected, returning false");
    return false;
  }
  
  return !!getCurrentRole();
};
  
export const logout = async (): Promise<void> => {
  // First call the server-side logout endpoint to clear cookies
  try {
    await fetch('https://enviadores.com.mx/api/logout.php', {
      method: 'POST',
      credentials: 'include', // Important for cookies
    });
  } catch (error) {
    console.error('Error during logout:', error);
    // Continue with local logout even if server request fails
  }

  // Clear localStorage
  localStorage.removeItem('user_role');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('username');
  localStorage.removeItem('user_id');
  localStorage.removeItem('auth_token_expiry');
  // Add any other items you might have stored
  
  // Clear cookies on client side as a backup
  // Try multiple domain variations to ensure all cookies are cleared
  const domains = [
    '.enviadores.com.mx',  // Main domain with dot prefix
    'enviadores.com.mx',   // Main domain without dot
    'app.enviadores.com.mx',
    'login.enviadores.com.mx'
  ];
  
  const paths = ['/', '/dashboard', '/login',  ''];
  
  const cookiesToClear = ['auth_token', 'user_role'];
  
  // Thorough cookie clearing
  for (const domain of domains) {
    for (const path of paths) {
      for (const cookieName of cookiesToClear) {
        document.cookie = `${cookieName}=; domain=${domain}; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`;
      }
    }
  }
  
  console.log("After logout - cookies:", document.cookie);
  
  // Perform a clean redirect to login page
  if (import.meta.env.PROD) {
    // Add a cache-busting parameter to prevent browser caching
    window.location.href = 'https://login.enviadores.com.mx?logout=' + Date.now();
  } else {
    window.location.href = '/login?logout=' + Date.now();
  }
};