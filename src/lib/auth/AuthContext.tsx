'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authService } from '@/lib/api';
import { cookieUtils, AUTH_COOKIES } from '@/lib/utils/cookies';
import { authStorage } from '@/lib/utils/authStorage';

export type UserRole = 'Super_user' | 'Admin' | 'Organization User' | 'Facilitator';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  organizationId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize user from cookies and localStorage on mount
  useEffect(() => {
    const token = cookieUtils.getCookie(AUTH_COOKIES.TOKEN);
    const userData = cookieUtils.getCookie(AUTH_COOKIES.USER);
    
    // Try to get user data from localStorage as fallback
    const localStorageUser = typeof window !== 'undefined' ? localStorage.getItem('authUser') : null;
    
    if (token && cookieUtils.isTokenValid(token)) {
      try {
        let parsedUser: AuthUser;
        
        if (userData) {
          parsedUser = JSON.parse(userData);
        } else if (localStorageUser) {
          parsedUser = JSON.parse(localStorageUser);
        } else {
          throw new Error('No user data found');
        }
        
        setUser(parsedUser);
      } catch {
        // Invalid user data, clear everything
        cookieUtils.deleteCookie(AUTH_COOKIES.TOKEN);
        cookieUtils.deleteCookie(AUTH_COOKIES.USER);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authUser');
          localStorage.removeItem('authUserId');
          localStorage.removeItem('authUserRole');
        }
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const response = await authService.login({ email, password });
      
      if (response.success && response.data) {
        const userData = response.data.data;
        const authUser: AuthUser = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role as UserRole,
          organizationId: undefined // Add if available in your response
        };
        
        // Store in cookies (7 days)
        cookieUtils.setCookie(AUTH_COOKIES.TOKEN, userData.token, 7);
        cookieUtils.setCookie(AUTH_COOKIES.USER, JSON.stringify(authUser), 7);
        
        // Store in localStorage for easy access
        if (typeof window !== 'undefined') {
          localStorage.setItem('authUser', JSON.stringify(authUser));
          localStorage.setItem('authUserId', userData.id);
          localStorage.setItem('authUserRole', userData.role);
        }
        
        setUser(authUser);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { 
          success: false, 
          message: response.error || response.message || 'Login failed. Please check your credentials.' 
        };
      }
    } catch {
      setLoading(false);
      return { 
        success: false, 
        message: 'Network error. Please check your connection and try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      console.warn('Logout error');
    } finally {
      setUser(null);
      // Clear all auth data
      authStorage.clearAll();
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}; 