// Export API configuration
export * from './config';

// Export API client
export * from './client';

// Export API services
export * from './services/auth';
export * from './services/consortia';
export * from './services/organizations';
export * from './services/actionitems';
export * from './services/dashboard';
export * from './services/adminDashboard';

// Re-export commonly used types
export type { ApiResponse, ApiError } from './client';
export type { LoginCredentials, LoginResponse, AuthUser } from './services/auth';
export type { 
  CreateConsortiumRequest, 
  Consortium, 
  CreateConsortiumResponse, 
  ConsortiaListResponse 
} from './services/consortia';
export type {
  Organization,
  CreateOrganizationRequest,
  CreateOrganizationResponse,
  OrganizationsListResponse
} from './services/organizations'; 

export type { CreateUserRequest, CreateUserResponse, User, UsersListResponse } from './services/auth'; 
export type { CreateActionItemRequest, CreateActionItemResponse } from './services/actionitems';
export type { DashboardStats, DashboardResponse, Risk, ActionItem, Meeting } from './services/dashboard'; 