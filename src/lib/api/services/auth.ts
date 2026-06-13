import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';

// Types for authentication
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  success: boolean;
  data: {
    _id: string;
    id: string;
    profilePhoto: string;
    name: string;
    email: string;
    status: string;
    role: string;
    organizations: string[];
    consortia: string[];
    createdAt: string;
    updatedAt: string;
    token: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'superAdmin' | 'Admin' | 'Organization User' | 'Facilitator';
  organizationId?: string;
}

// Types for user creation
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
  organizations?: string[];
  consortia?: string[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  organizations?: string[];
  consortia?: string[];
  status?: string;
}

export interface CreateUserResponse {
  message: string;
  success: boolean;
  data?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    organizationId?: string;
    consortiumId?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface UpdateUserResponse {
  message: string;
  success: boolean;
  data?: User;
}

// Types for user listing
export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: string;
  profilePhoto?: string;
  status: string;
  organizations: string[];
  consortia: string[];
  createdAt: string;
  updatedAt: string;
  otp?: string;
  otpCreatedAt?: string;
}

export interface UsersListResponse {
  message: string;
  success: boolean;
  data: User[];
}

// Types for OTP verification
export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
  success: boolean;
}

// Types for forgot password and update password
export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  success: boolean;
}

export interface UpdatePasswordRequest {
  email: string;
  password: string;
}

export interface UpdatePasswordResponse {
  message: string;
  success: boolean;
}

// Authentication service
export const authService = {
  // Login user
  async login(credentials: LoginCredentials) {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
      false // Don't include auth header for login
    );

    if (response.success && response.data) {
      // Store the token
      apiClient.setToken(response.data.data.token);
    }

    return response;
  },

  // Logout user
  async logout() {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local token
      apiClient.clearToken();
    }
  },

  // Verify token
  async verifyToken() {
    return apiClient.get<AuthUser>(API_ENDPOINTS.AUTH.VERIFY);
  },

  // Refresh token
  async refreshToken() {
    const response = await apiClient.post<{ token: string }>(
      API_ENDPOINTS.AUTH.REFRESH,
      undefined,
      false
    );

    if (response.success && response.data) {
      apiClient.setToken(response.data.token);
    }

    return response;
  },

  // Get current user profile
  async getProfile() {
    return apiClient.get<AuthUser>(API_ENDPOINTS.USERS.PROFILE);
  },
};

export const userService = {
  async createUser(userData: CreateUserRequest) {
    return apiClient.post<CreateUserResponse>(
      API_ENDPOINTS.USERS.CREATE,
      userData
    );
  },

  async updateUser(id: string, userData: UpdateUserRequest) {
    return apiClient.patch<UpdateUserResponse>(
      `/users/${id}`,
      userData
    );
  },

  async getUsers() {
    const response = await apiClient.get<User[]>(API_ENDPOINTS.USERS.LIST);
    // Transform the response to match expected format
    return {
      success: true,
      data: response.data || [],
      error: response.error
    };
  },

  async updateProfile(id: string, data: object) {
    return apiClient.patch(`/users/${id}`, data);
  },

  async getUserById(id: string) {
    return apiClient.get(`/users/${id}`);
  },

  async verifyOtp(data: VerifyOtpRequest) {
    return apiClient.post<VerifyOtpResponse>(API_ENDPOINTS.USERS.VERIFY_OTP, data);
  },

  async forgotPassword(data: ForgotPasswordRequest) {
    return apiClient.post<ForgotPasswordResponse>(API_ENDPOINTS.USERS.FORGOT_PASSWORD, data);
  },

  async updatePassword(data: UpdatePasswordRequest) {
    return apiClient.post<UpdatePasswordResponse>(API_ENDPOINTS.USERS.UPDATE_PASSWORD, data);
  },

  async deleteUser(id: string) {
    return apiClient.delete(`/users/${id}`);
  },
}; 