import { API_CONFIG, buildApiUrl } from './config';
import { cookieUtils, AUTH_COOKIES } from '@/lib/utils/cookies';

// Types for API responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// API Client class
class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Get auth token from cookies
  private getAuthToken(): string | null {
    return cookieUtils.getCookie(AUTH_COOKIES.TOKEN);
  }

  // Set auth token in cookies
  private setAuthToken(token: string): void {
    cookieUtils.setCookie(AUTH_COOKIES.TOKEN, token, 7);
  }

  // Remove auth token from cookies
  private removeAuthToken(): void {
    cookieUtils.deleteCookie(AUTH_COOKIES.TOKEN);
  }

  // Create headers for requests
  private createHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Handle API response
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    if (response.ok) {
      if (isJson) {
        const data = await response.json();
        return {
          success: true,
          data,
        };
      } else {
        const text = await response.text();
        return {
          success: true,
          data: text as T,
        };
      }
    } else {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Fallback to default error message
        }
      }

      // Handle authentication errors
      if (response.status === 401) {
        this.removeAuthToken();
        // Don't redirect automatically - let the component handle it
        // if (typeof window !== 'undefined') {
        //   window.location.href = '/';
        // }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = buildApiUrl(endpoint);
    const headers = this.createHeaders(includeAuth);

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  // GET request
  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, includeAuth);
  }

  // POST request
  async post<T>(endpoint: string, data?: unknown, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, includeAuth);
  }

  // PUT request
  async put<T>(endpoint: string, data?: unknown, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, includeAuth);
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: unknown, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, includeAuth);
  }

  // DELETE request
  async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' }, includeAuth);
  }

  // Set auth token (for login)
  setToken(token: string): void {
    this.setAuthToken(token);
  }

  // Clear auth token (for logout)
  clearToken(): void {
    this.removeAuthToken();
  }
}

// Export singleton instance
export const apiClient = new ApiClient(); 