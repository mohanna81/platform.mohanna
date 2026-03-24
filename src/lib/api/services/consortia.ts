import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { Organization } from './organizations';
import { AuthUser } from '@/lib/auth/AuthContext';

// Types for consortia
export interface CreateConsortiumRequest {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: 'Active' | 'Inactive' | 'Draft';
  organizations?: string[];
  Facilitators?: string[];
}

export interface AddOrganizationToConsortiumRequest {
  organizationId: string;
  consortiumId: string;
}

export interface Consortium {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: 'Active' | 'Inactive' | 'Draft';
  organizations: (string | Organization)[]; // Can be string[] or Organization[] depending on API response
  Facilitators?: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsortiumResponse {
  message: string;
  success: boolean;
  data: Consortium;
}

export interface ConsortiaListResponse {
  message: string;
  success: boolean;
  data: Consortium[];
}

// Consortia service
export const consortiaService = {
  // Create a new consortium
  async createConsortium(consortiumData: CreateConsortiumRequest) {
    return apiClient.post<CreateConsortiumResponse>(
      API_ENDPOINTS.CONSORTIA.CREATE,
      consortiumData
    );
  },

  // Get all consortia
  async getConsortia() {
    return apiClient.get<ConsortiaListResponse>(API_ENDPOINTS.CONSORTIA.LIST);
  },

  // Get a user's consortium
  async getUserConsortium(userId: string) {
    const endpoint = API_ENDPOINTS.USERS.CONSORTIA.replace(':userId', userId);
    return apiClient.get<ConsortiaListResponse>(endpoint);
  },

  // Get a specific consortium by ID (GET /consortia/:id)
  async getConsortiumById(id: string) {
    const endpoint = `/consortia/${id}`;
    return apiClient.get<CreateConsortiumResponse>(endpoint);
  },

  // Patch a specific consortium by ID (PATCH /consortia/:id)
  async patchConsortiumById(id: string, data: Partial<CreateConsortiumRequest>) {
    const endpoint = `/consortia/${id}`;
    return apiClient.patch<CreateConsortiumResponse>(endpoint, data);
  },

  // (Legacy) Get a specific consortium by ID using config endpoint
  async getConsortium(id: string) {
    const endpoint = API_ENDPOINTS.CONSORTIA.GET.replace(':id', id);
    return apiClient.get<CreateConsortiumResponse>(endpoint);
  },

  // Update a consortium
  async updateConsortium(id: string, consortiumData: Partial<CreateConsortiumRequest>) {
    const endpoint = API_ENDPOINTS.CONSORTIA.UPDATE.replace(':id', id);
    return apiClient.put<CreateConsortiumResponse>(endpoint, consortiumData);
  },

  // Delete a consortium
  async deleteConsortium(id: string) {
    const endpoint = API_ENDPOINTS.CONSORTIA.DELETE.replace(':id', id);
    return apiClient.delete<{ message: string; success: boolean }>(endpoint);
  },

  // Add organization to consortium
  async addOrganizationToConsortium(data: AddOrganizationToConsortiumRequest) {
    return apiClient.post<{ message: string; success: boolean; data?: Consortium }>(
      API_ENDPOINTS.CONSORTIA.ADD_ORGANIZATION,
      data
    );
  },
};

export async function fetchConsortiaByRole(user: AuthUser | null) {
  console.log('fetchConsortiaByRole - Called with user:', user);
  if (!user) {
    console.log('fetchConsortiaByRole - No user provided, returning empty array');
    return [];
  }
  
  console.log('fetchConsortiaByRole - User role:', user.role);
  console.log('fetchConsortiaByRole - User ID:', user.id);
  
  if ((user.role === 'Facilitator' || user.role === 'Organization User') && user.id) {
    console.log('fetchConsortiaByRole - Using user-specific endpoint for role:', user.role);
    const response = await consortiaService.getUserConsortium(user.id);
    const data = response.data?.data;
    if (response.success && data && typeof data === 'object' && !Array.isArray(data) && 'consortia' in data) {
      const consortia = (data as { consortia: Consortium[] }).consortia || [];
      console.log('fetchConsortiaByRole - User consortiums fetched:', consortia);
      return consortia;
    }
    console.log('fetchConsortiaByRole - No user consortiums found, returning empty array');
    return [];
  } else {
    console.log('fetchConsortiaByRole - Using general endpoint for role:', user.role);
    const response = await consortiaService.getConsortia();
    if (response.success && Array.isArray(response.data?.data)) {
      const consortia = response.data.data;
      console.log('fetchConsortiaByRole - All consortiums fetched:', consortia);
      return consortia;
    }
    console.log('fetchConsortiaByRole - No consortiums found, returning empty array');
    return [];
  }
} 