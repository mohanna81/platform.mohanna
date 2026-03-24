import { apiClient } from '../client';

export interface CreateResourceRequest {
  title: string;
  description: string;
  source: string;
  resourceType: string;
  fileUrl: string;
  thumbnailUrl?: string; // Optional thumbnail URL
  createdBy: string;
  organization: string[];
  consortium: string[];
}

export interface CreateResourceResponse {
  message: string;
  success: boolean;
  data?: unknown;
}

export interface Resource {
  _id: string;
  title: string;
  description: string;
  source: string;
  resourceType: string;
  fileUrl: string;
  thumbnailUrl?: string; // Optional thumbnail URL
  createdBy: string;
  organization: string[];
  consortium: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface GetResourcesResponse {
  message: string;
  success: boolean;
  data: Resource[];
}

export interface UpdateResourceRequest {
  title?: string;
  description?: string;
  source?: string;
  resourceType?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  organization?: string[];
  consortium?: string[];
}

export interface DeleteResourceResponse {
  message: string;
  success: boolean;
}

export const resourcesService = {
  async createResource(resourceData: CreateResourceRequest) {
    return apiClient.post<CreateResourceResponse>(
      '/resources/create',
      resourceData
    );
  },
  async getResources() {
    const response = await apiClient.get<GetResourcesResponse>('/resources');
    return {
      success: response.success && response.data?.success,
      data: response.data?.data || [],
      error: response.error || response.data?.message
    };
  },

  // Update a resource
  async updateResource(id: string, resourceData: UpdateResourceRequest) {
    return apiClient.patch<CreateResourceResponse>(
      `/resources/${id}`,
      resourceData
    );
  },

  // Delete a resource
  async deleteResource(id: string) {
    return apiClient.delete<DeleteResourceResponse>(`/resources/${id}`);
  },
}; 