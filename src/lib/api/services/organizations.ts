import { apiClient } from '../client';
import { AuthUser } from '@/lib/auth/AuthContext';
import { consortiaService, Consortium, fetchConsortiaByRole } from './consortia';

// Types for organizations
export interface Organization {
  _id: string;
  id: string;
  name: string;
  description?: string;
  email: string;
  status: 'Active' | 'Inactive' | 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  users?: number;
  contact_email?: string;
  consortiumId?: string;
  consortia?: Array<{
    _id?: string;
    id?: string;
    name?: string;
    [key: string]: unknown;
  }>;
  createdBy?: string | {
    _id: string;
    name: string;
    email: string;
    id: string;
  };
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  contact_email: string;
  consortiumId: string;
}

export interface CreateOrganizationResponse {
  message: string;
  success: boolean;
  data: Organization;
}

export interface OrganizationsListResponse {
  message: string;
  success: boolean;
  data: Organization[];
}

// Organizations service
export const organizationsService = {
  // Get all organizations
  async getOrganizations() {
    return apiClient.get<OrganizationsListResponse>('/organizations');
  },

  // Get a specific organization by ID
  async getOrganizationById(id: string) {
    const endpoint = `/organizations/${id}`;
    return apiClient.get<CreateOrganizationResponse>(endpoint);
  },

  // Create a new organization
  async createOrganization(organizationData: CreateOrganizationRequest) {
    return apiClient.post<CreateOrganizationResponse>(
      '/organizations/create',
      organizationData
    );
  },

  // Update an organization
  async updateOrganization(id: string, organizationData: Partial<CreateOrganizationRequest>) {
    const endpoint = `/organizations/${id}`;
    return apiClient.patch<CreateOrganizationResponse>(endpoint, organizationData);
  },

  // Delete an organization
  async deleteOrganization(id: string) {
    const endpoint = `/organizations/${id}`;
    return apiClient.delete<{ message: string; success: boolean }>(endpoint);
  },
};

export async function fetchOrganizationsByRole(user: AuthUser | null) {
  if (!user) {
    return [];
  }
  
  
  if (user.role === 'Facilitator' && user.id) {
    
    const facilitatorOrganizations: Organization[] = [];
    const seenOrganizationIds = new Set<string>();
    
    // API Call 1: Get all organizations and check createdBy
    const allOrganizationsResponse = await organizationsService.getOrganizations();
    if (allOrganizationsResponse.success && Array.isArray(allOrganizationsResponse.data?.data)) {
      const allOrganizations = allOrganizationsResponse.data.data;
      
      // Get all consortia to check facilitator assignment
      const consortiaResponse = await consortiaService.getConsortia();
      if (consortiaResponse.success && Array.isArray(consortiaResponse.data?.data)) {
        const allConsortia = consortiaResponse.data.data;
        
        // Filter organizations based on facilitator being the creator
        allOrganizations.forEach((organization: Organization) => {
          // Check if facilitator created this organization directly
          let isOrganizationCreator = false;
          if (organization.createdBy) {
            if (typeof organization.createdBy === 'string') {
              isOrganizationCreator = organization.createdBy === user.id;
            } else if (typeof organization.createdBy === 'object' && organization.createdBy !== null) {
              isOrganizationCreator = organization.createdBy._id === user.id || organization.createdBy.id === user.id;
            }
          }
          
          // Find consortiums that contain this organization
          const relevantConsortia = allConsortia.filter((consortium: Consortium) => {
            if (consortium.organizations && Array.isArray(consortium.organizations)) {
              return consortium.organizations.some((org: string | Organization) => {
                if (typeof org === 'string') {
                  return org === organization._id || org === organization.id;
                } else if (typeof org === 'object' && org !== null) {
                  return org._id === organization._id || org.id === organization.id;
                }
                return false;
              });
            }
            return false;
          });
          
          // Check if facilitator created any of these consortiums
          const isConsortiumCreator = relevantConsortia.some((consortium: Consortium) => {
            const createdByMatch = consortium.createdBy === user.id;
            console.log(`fetchOrganizationsByRole - Consortium ${consortium.name}:`, {
              consortiumId: consortium._id || consortium.id,
              createdBy: consortium.createdBy,
              userID: user.id,
              isCreator: createdByMatch
            });
            return createdByMatch;
          });
          
          // Include organization if facilitator created either the organization or the consortium
          if (isOrganizationCreator || isConsortiumCreator) {
            const orgId = organization._id || organization.id;
            if (!seenOrganizationIds.has(orgId)) {
              facilitatorOrganizations.push(organization);
              seenOrganizationIds.add(orgId);
            }
          } else {
          }
        });
      }
    }
    
    // API Call 2: Get user-specific organizations using user ID endpoint
    const userConsortiaResponse = await consortiaService.getUserConsortium(user.id);
    const userData = userConsortiaResponse.data?.data;
    if (userConsortiaResponse.success && userData && typeof userData === 'object' && !Array.isArray(userData) && 'consortia' in userData) {
      const userConsortia = (userData as { consortia: Consortium[] }).consortia || [];
      
      // Extract organizations from user's consortiums
      userConsortia.forEach((consortium: Consortium) => {
        if (consortium.organizations && Array.isArray(consortium.organizations)) {
          consortium.organizations.forEach((org: string | Organization) => {
            if (typeof org === 'object' && org !== null) {
              const orgId = org._id || org.id;
              if (!seenOrganizationIds.has(orgId)) {
                facilitatorOrganizations.push(org);
                seenOrganizationIds.add(orgId);
              }
            }
          });
        }
      });
    }
    
    return facilitatorOrganizations;
  } else if (user.role === 'Organization User' && user.id) {
    // Use the same endpoint as consortiums to get user's consortiums and extract organizations
    const response = await consortiaService.getUserConsortium(user.id);
    const data = response.data?.data;
    if (response.success && data && typeof data === 'object' && !Array.isArray(data) && 'consortia' in data) {
      const userConsortia = (data as { consortia: Consortium[] }).consortia || [];
      
      // Extract organizations from consortiums
      const organizations: Organization[] = [];
      userConsortia.forEach((consortium: Consortium) => {
        if (consortium.organizations && Array.isArray(consortium.organizations)) {
          consortium.organizations.forEach((org: string | Organization) => {
            // Handle both string IDs and Organization objects
            if (typeof org === 'string') {
              // If it's a string ID, we can't add it to the organizations list
              // since we don't have the full organization data
            } else if (typeof org === 'object' && org !== null) {
              // Check if organization is already in the list to avoid duplicates
              const exists = organizations.find(existing => existing._id === org._id || existing.id === org.id);
              if (!exists) {
                organizations.push(org);
              }
            }
          });
        }
      });
      
      return organizations;
    }
    return [];
  } else {
    const response = await organizationsService.getOrganizations();
    if (response.success && Array.isArray(response.data?.data)) {
      const organizations = response.data.data;
      return organizations;
    }
    return [];
  }
}

// New function to get organizations filtered by consortium IDs
export async function fetchOrganizationsByConsortia(consortiumIds: string[], user: AuthUser | null): Promise<Organization[]> {
  if (!consortiumIds.length || !user) {
    return [];
  }

  try {
    // Get all consortia that the user has access to
    const allConsortia = await fetchConsortiaByRole(user);
    
    // Filter consortia by the provided consortium IDs
    const filteredConsortia = allConsortia.filter((consortium: Consortium) => 
      consortiumIds.includes(consortium._id || consortium.id || '')
    );

    // Extract organizations from the selected consortiums
    const organizations: Organization[] = [];
    filteredConsortia.forEach((consortium: Consortium) => {
      if (consortium.organizations && Array.isArray(consortium.organizations)) {
        consortium.organizations.forEach((org: string | Organization) => {
          if (typeof org === 'object' && org !== null) {
            // Check if organization is already in the list to avoid duplicates
            const exists = organizations.find(existing => 
              existing._id === org._id || existing.id === org.id
            );
            if (!exists) {
              organizations.push(org);
            }
          }
        });
      }
    });

    return organizations;
  } catch (error) {
    console.error('Error fetching organizations by consortium:', error);
    return [];
  }
} 