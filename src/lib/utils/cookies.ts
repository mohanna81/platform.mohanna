// Cookie utility functions
export const cookieUtils = {
  // Set a cookie with secure defaults
  setCookie(name: string, value: string, days: number = 7): void {
    if (typeof window === 'undefined') return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    
    const cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    
    // Add secure flag in production
    if (process.env.NODE_ENV === 'production') {
      document.cookie = cookie + ';Secure';
    } else {
      document.cookie = cookie;
    }
  },

  // Get a cookie value
  getCookie(name: string): string | null {
    if (typeof window === 'undefined') return null;
    
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  // Delete a cookie
  deleteCookie(name: string): void {
    if (typeof window === 'undefined') return;
    
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  },

  // Simple token validation (basic check)
  isTokenValid(token: string): boolean {
    return Boolean(token && token.length > 0);
  }
};

// Auth cookie names
export const AUTH_COOKIES = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  REFRESH_TOKEN: 'refresh_token'
} as const; 