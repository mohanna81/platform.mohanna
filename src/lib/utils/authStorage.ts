import { cookieUtils, AUTH_COOKIES } from './cookies';
import { AuthUser } from '@/lib/auth/AuthContext';

// Auth storage utility functions
export const authStorage = {
  // Get user ID from localStorage (fastest access)
  getUserId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authUserId');
  },

  // Get user role from localStorage (fastest access)
  getUserRole(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authUserRole');
  },

  // Get full user data from localStorage
  getUserData(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('authUser');
    return userData ? JSON.parse(userData) : null;
  },

  // Get token from cookies
  getToken(): string | null {
    return cookieUtils.getCookie(AUTH_COOKIES.TOKEN);
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token ? cookieUtils.isTokenValid(token) : false;
  },

  // Check if user has specific role
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  },

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  },

  // Get all stored auth data
  getAllAuthData() {
    return {
      userId: this.getUserId(),
      userRole: this.getUserRole(),
      userData: this.getUserData(),
      token: this.getToken(),
      isAuthenticated: this.isAuthenticated()
    };
  },

  // Clear all auth data
  clearAll(): void {
    // Clear cookies
    cookieUtils.deleteCookie(AUTH_COOKIES.TOKEN);
    cookieUtils.deleteCookie(AUTH_COOKIES.USER);
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authUserId');
      localStorage.removeItem('authUserRole');
    }
  }
};

// Role constants for easy access
export const USER_ROLES = {
  Super_user: 'Super_user',
  Admin: 'Admin',
  ORGANIZATION: 'Organization User',
  Facilitator: 'Facilitator'
} as const;

// Role-based helper functions
export const roleHelpers = {
  // Check if user is super Admin
  isSuperUser(): boolean {
    return authStorage.hasRole(USER_ROLES.Super_user);
  },

  // Check if user is Admin
  isAdmin(): boolean {
    return authStorage.hasRole(USER_ROLES.Admin);
  },

  // Check if user is organization user
  isOrganization(): boolean {
    return authStorage.hasRole(USER_ROLES.ORGANIZATION);
  },

  // Check if user is Facilitator
  isFacilitator(): boolean {
    return authStorage.hasRole(USER_ROLES.Facilitator);
  },

  // Check if user has Admin privileges (super user or Admin)
  hasAdminPrivileges(): boolean {
    return authStorage.hasAnyRole([USER_ROLES.Super_user, USER_ROLES.Admin]);
  }
}; 