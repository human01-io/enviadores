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

// Improved isAuthenticated function with post-logout check
export const isAuthenticated = (): boolean => {
  // 1. Don't consider authenticated if recently logged out
  const logoutTimestamp = sessionStorage.getItem('logged_out_at');
  if (logoutTimestamp) {
    const logoutTime = parseInt(logoutTimestamp, 10);
    const currentTime = Date.now();
    
    // If logged out within the last 5 seconds, consider not authenticated
    if (currentTime - logoutTime < 5000) {
      console.log("Recent logout detected, returning not authenticated");
      return false;
    }
  }
  
  // 2. Check if logout parameter is in URL (just logged out)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('logout')) {
    console.log("Logout parameter detected in URL, returning not authenticated");
    return false;
  }

  // 3. First check localStorage (more reliable)
  const localRole = localStorage.getItem('user_role');
  if (localRole) {
    const token = localStorage.getItem('auth_token');
    // If we have role but no token, it's inconsistent - consider not authenticated
    if (!token) {
      console.log("Role found but no token in localStorage - clearing inconsistent state");
      localStorage.removeItem('user_role');
      return false;
    }
    return true;
  }
  
  // 4. Then check cookies more carefully
  try {
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const roleCookie = cookies.find(cookie => cookie.startsWith('user_role='));
    
    if (roleCookie) {
      const role = roleCookie.split('=')[1];
      // Only consider valid if role has actual content
      if (role && role.length > 0) {
        const authCookie = cookies.find(cookie => cookie.startsWith('auth_token='));
        // Need both for valid authentication
        if (authCookie && authCookie.split('=')[1]?.length > 10) {
          return true;
        }
      }
    }
  } catch (error) {
    console.error("Error checking auth cookies:", error);
  }
  
  return false;
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

  localStorage.clear(); // Clear all localStorage items to be safe
  
  const cookies = document.cookie.split(';').map(c => c.trim());
  cookies.forEach(cookie => {
    const cookieName = cookie.split('=')[0];
    // Clear the cookie with multiple domain patterns to ensure it's removed
    document.cookie = `${cookieName}=; domain=.enviadores.com.mx; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=Lax`;
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
  
   // Ensure client state indicates logged out
   sessionStorage.setItem('logged_out_at', Date.now().toString());
  
  // Perform a clean redirect to login page
  if (import.meta.env.PROD) {
    // Add a cache-busting parameter to prevent browser caching
    window.location.href = 'https://login.enviadores.com.mx?logout=' + Date.now();
  } else {
    window.location.href = '/login?logout=' + Date.now();
  }
};