// Improved authUtils.ts
// Centralized authentication logic

// Check for recent login redirect to prevent loops
const wasRecentlyRedirected = (): boolean => {
  const redirectFlag = sessionStorage.getItem('login_redirect');
  const redirectTime = sessionStorage.getItem('login_redirect_time');
  
  if (redirectFlag === 'true' && redirectTime) {
    const timestamp = parseInt(redirectTime, 10);
    const now = Date.now();
    
    // If redirected in the last 5 seconds, consider it valid
    if (now - timestamp < 5000) {
      return true;
    }
  }
  
  return false;
};

export const getCurrentRole = (): string | null => {
  // If we were just redirected after login, trust localStorage
  if (wasRecentlyRedirected()) {
    const localRole = localStorage.getItem('user_role');
    if (localRole) return localRole;
  }
  
  // Check localStorage first
  const localRole = localStorage.getItem('user_role');
  if (localRole) return localRole;
  
  // Then check cookies
  try {
    const cookies = document.cookie.split(';')
      .map(cookie => cookie.trim());
    const roleCookie = cookies
      .find(cookie => cookie.startsWith('user_role='));
      
    if (roleCookie) {
      const role = roleCookie.split('=')[1];
      if (role) {
        // Sync to localStorage
        localStorage.setItem('user_role', role);
        return role;
      }
    }
  } catch (error) {
    console.error('Error parsing cookies:', error);
  }
  
  return null;
};

export const isAuthenticated = (): boolean => {
  // If we were just redirected after login, consider authenticated
  if (wasRecentlyRedirected()) {
    return true;
  }
  
  // Don't consider authenticated if just logged out
  const logoutTimestamp = sessionStorage.getItem('logged_out_at');
  if (logoutTimestamp) {
    const logoutTime = parseInt(logoutTimestamp, 10);
    const currentTime = Date.now();
    
    // If logged out within the last 5 seconds, consider not authenticated
    if (currentTime - logoutTime < 5000) {
      return false;
    }
  }
  
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('logout')) {
    return false;
  }

  // Check localStorage
  const role = localStorage.getItem('user_role');
  const token = localStorage.getItem('auth_token');
  
  if (role && token) {
    return true;
  }
  
  // Check cookies
  try {
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const authCookie = cookies.find(cookie => cookie.startsWith('auth_token='));
    const roleCookie = cookies.find(cookie => cookie.startsWith('user_role='));
    
    if (authCookie && roleCookie) {
      const authToken = authCookie.split('=')[1];
      const roleValue = roleCookie.split('=')[1];
      
      // If found in cookies but not localStorage, synchronize
      if (!role && roleValue) {
        localStorage.setItem('user_role', roleValue);
      }
      
      if (!token && authToken) {
        localStorage.setItem('auth_token', authToken);
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error checking cookies:', error);
  }
  
  return false;
};
  
export const logout = async (): Promise<void> => {
  // Mark logout in sessionStorage before doing anything else
  sessionStorage.setItem('logged_out_at', Date.now().toString());
  
  // First call the server-side logout endpoint to clear cookies
  try {
    const response = await fetch('https://enviadores.com.mx/api/logout.php', {
      method: 'POST',
      credentials: 'include', // Important for cookies
      cache: 'no-store', // Prevent caching
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('Logout response:', response.status);
  } catch (error) {
    console.error('Error during logout:', error);
    // Continue with local logout even if server request fails
  }

  // Clear localStorage completely
  localStorage.clear();
  
  // Clear cookies on client side as a backup
  const cookies = document.cookie.split(';').map(c => c.trim());
  cookies.forEach(cookie => {
    const cookieName = cookie.split('=')[0];
    // Clear the cookie with multiple domain patterns to ensure it's removed
    document.cookie = `${cookieName}=; domain=.enviadores.com.mx; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=Lax`;
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
  
  // Clear specific cookies to be absolutely certain
  document.cookie = "auth_token=; domain=.enviadores.com.mx; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=Lax";
  document.cookie = "user_role=; domain=.enviadores.com.mx; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=Lax";
  
  // Small delay to ensure everything is cleared
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Perform a clean redirect to login page
  if (import.meta.env.PROD) {
    // Add a cache-busting parameter to prevent browser caching
    window.location.href = 'https://login.enviadores.com.mx?logout=' + Date.now();
  } else {
    window.location.href = '/login?logout=' + Date.now();
  }
};