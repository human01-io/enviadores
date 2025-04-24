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
    localStorage.removeItem('user_role');
    // Add any other cleanup here
  };