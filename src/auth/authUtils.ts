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
  
export const logout = (): void => {
  // Clear localStorage
  localStorage.removeItem('user_role');
  localStorage.removeItem('auth_token');
  
  // Also clear cookies (important for cross-subdomain auth)
  document.cookie = "auth_token=; domain=.enviadores.com.mx; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "user_role=; domain=.enviadores.com.mx; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  
  // Add any other cleanup here
};