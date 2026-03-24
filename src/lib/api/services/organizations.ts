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
  console.log('fetchOrganizationsByRole - Called with user:', user);
  if (!user) {
    console.log('fetchOrganizationsByRole - No user provided, returning empty array');
    return [];
  }
  
  console.log('fetchOrganizationsByRole - User role:', user.role);
  console.log('fetchOrganizationsByRole - User ID:', user.id);
  
  if (user.role === 'Facilitator' && user.id) {
    console.log('fetchOrganizationsByRole - Using facilitator-specific logic with two API calls');
    
    const facilitatorOrganizations: Organization[] = [];
    const seenOrganizationIds = new Set<string>();
    
    // API Call 1: Get all organizations and check createdBy
    console.log('fetchOrganizationsByRole - API Call 1: Getting all organizations to check createdBy');
    const allOrganizationsResponse = await organizationsService.getOrganizations();
    if (allOrganizationsResponse.success && Array.isArray(allOrganizationsResponse.data?.data)) {
      const allOrganizations = allOrganizationsResponse.data.data;
      console.log('fetchOrganizationsByRole - All organizations fetched:', allOrganizations);
      
      // Get all consortia to check facilitator assignment
      const consortiaResponse = await consortiaService.getConsortia();
      if (consortiaResponse.success && Array.isArray(consortiaResponse.data?.data)) {
        const allConsortia = consortiaResponse.data.data;
        console.log('fetchOrganizationsByRole - All consortia fetched for createdBy filtering:', allConsortia);
        
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
              console.log(`fetchOrganizationsByRole - Including organization: ${organization.name} (ID: ${orgId}) - Organization creator: ${isOrganizationCreator}, Consortium creator: ${isConsortiumCreator}`);
            }
          } else {
            console.log(`fetchOrganizationsByRole - Excluding organization: ${organization.name} (ID: ${organization._id || organization.id}) - Not created by facilitator`);
          }
        });
      }
    }
    
    // API Call 2: Get user-specific organizations using user ID endpoint
    console.log('fetchOrganizationsByRole - API Call 2: Getting user-specific organizations');
    const userConsortiaResponse = await consortiaService.getUserConsortium(user.id);
    const userData = userConsortiaResponse.data?.data;
    if (userConsortiaResponse.success && userData && typeof userData === 'object' && !Array.isArray(userData) && 'consortia' in userData) {
      const userConsortia = (userData as { consortia: Consortium[] }).consortia || [];
      console.log('fetchOrganizationsByRole - User consortiums from user endpoint:', userConsortia);
      
      // Extract organizations from user's consortiums
      userConsortia.forEach((consortium: Consortium) => {
        if (consortium.organizations && Array.isArray(consortium.organizations)) {
          consortium.organizations.forEach((org: string | Organization) => {
            if (typeof org === 'object' && org !== null) {
              const orgId = org._id || org.id;
              if (!seenOrganizationIds.has(orgId)) {
                facilitatorOrganizations.push(org);
                seenOrganizationIds.add(orgId);
                console.log(`fetchOrganizationsByRole - Including organization (user endpoint): ${org.name} (ID: ${orgId})`);
              }
            }
          });
        }
      });
    }
    
    console.log('fetchOrganizationsByRole - Final facilitator organizations:', facilitatorOrganizations);
    return facilitatorOrganizations;
  } else if (user.role === 'Organization User' && user.id) {
    console.log('fetchOrganizationsByRole - Using user-specific consortium endpoint for Organization User');
    // Use the same endpoint as consortiums to get user's consortiums and extract organizations
    const response = await consortiaService.getUserConsortium(user.id);
    const data = response.data?.data;
    if (response.success && data && typeof data === 'object' && !Array.isArray(data) && 'consortia' in data) {
      const userConsortia = (data as { consortia: Consortium[] }).consortia || [];
      console.log('fetchOrganizationsByRole - User consortiums:', userConsortia);
      
      // Extract organizations from consortiums
      const organizations: Organization[] = [];
      userConsortia.forEach((consortium: Consortium) => {
        if (consortium.organizations && Array.isArray(consortium.organizations)) {
          consortium.organizations.forEach((org: string | Organization) => {
            // Handle both string IDs and Organization objects
            if (typeof org === 'string') {
              // If it's a string ID, we can't add it to the organizations list
              // since we don't have the full organization data
              console.log('fetchOrganizationsByRole - Organization ID found:', org);
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
      
      console.log('fetchOrganizationsByRole - Extracted organizations:', organizations);
      return organizations;
    }
    console.log('fetchOrganizationsByRole - No user consortiums found, returning empty array');
    return [];
  } else {
    console.log('fetchOrganizationsByRole - Using general organizations endpoint for role:', user.role);
    const response = await organizationsService.getOrganizations();
    if (response.success && Array.isArray(response.data?.data)) {
      const organizations = response.data.data;
      console.log('fetchOrganizationsByRole - All organizations fetched:', organizations);
      return organizations;
    }
    console.log('fetchOrganizationsByRole - No organizations found, returning empty array');
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

    console.log('fetchOrganizationsByConsortia - Organizations for consortiums:', consortiumIds, organizations);
    return organizations;
  } catch (error) {
    console.error('Error fetching organizations by consortium:', error);
    return [];
  }
} 