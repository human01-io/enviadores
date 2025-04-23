// Centralized authentication logic
export const getCurrentRole = (): string | null => {
    return localStorage.getItem('user_role');
  };
  
  export const isAuthenticated = (): boolean => {
    return !!getCurrentRole();
  };
  
  export const logout = (): void => {
    localStorage.removeItem('user_role');
    // Add any other cleanup here
  };