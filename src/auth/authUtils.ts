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
  // Add any other items you might have stored
  
  // Clear cookies on client side as a backup
  document.cookie = "auth_token=; domain=.enviadores.com.mx; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "user_role=; domain=.enviadores.com.mx; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  
  // Perform a clean redirect to login page
  if (import.meta.env.PROD) {
    // Add a cache-busting parameter to prevent browser caching
    window.location.href = 'https://login.enviadores.com.mx?logout=' + Date.now();
  } else {
    window.location.href = '/login?logout=' + Date.now();
  }
};