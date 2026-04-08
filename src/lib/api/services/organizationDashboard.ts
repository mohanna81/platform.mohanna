import { apiClient } from '../client';
import { API_ENDPOINTS, API_CONFIG } from '../config';

export interface OrganizationUserDashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    organizations: Array<{
      _id: string;
      name: string;
      description: string;
      contact_email: string;
      status: string;
      consortia: string[];
      createdBy: string;
      createdAt: string;
      updatedAt: string;
      __v: number;
    }>;
    consortia: Array<{
      _id: string;
      name: string;
      start_date: string;
      end_date: string;
      description: string;
      status: string;
      organizations: string[];
      createdAt: string;
      updatedAt: string;
      __v: number;
    }>;
  };
  summary: {
    draftRisks: number;
    sharedRisks: number;
    upcomingMeetings: number;
    actionItems: number;
    totalRisks: number;
    totalMeetings: number;
    totalActionItems: number;
  };
  riskStatusBreakdown: Array<{
    _id: string;
    count: number;
  }>;
  actionItemStatusBreakdown: Array<{
    _id: string;
    count: number;
  }>;
  recentActivity: {
    risks: number;
    meetings: number;
    actionItems: number;
  };
  details: {
    draftRisks: Array<{
      _id: string;
      title: string;
      category: string;
      consortium: Array<{
        _id: string;
        name: string;
      }>;
      organization: Array<{
        _id: string;
        name: string;
      }>;
      statement: string;
      likelihood: string;
      severity: string;
      triggerIndicator: string;
      mitigationMeasures: string;
      preventiveMeasures?: string;
      reactiveMeasures?: string;
      status: string;
      triggerStatus: string;
      orgRoles: Array<{
        organization: string;
        role: string;
        _id: string;
      }>;
      code: string;
      createdBy: {
        _id: string;
        name: string;
        email: string;
        id: string;
      };
      createdAt: string;
      updatedAt: string;
      __v: number;
    }>;
    sharedRisks: Array<{
      _id: string;
      title: string;
      category: string;
      consortium: Array<{
        _id: string;
        name: string;
      }>;
      organization: Array<{
        _id: string;
        name: string;
      }>;
      statement: string;
      likelihood: string;
      severity: string;
      triggerIndicator: string;
      mitigationMeasures: string;
      preventiveMeasures?: string;
      reactiveMeasures?: string;
      status: string;
      triggerStatus: string;
      orgRoles: Array<{
        organization: string;
        role: string;
        _id: string;
      }>;
      code: string;
      createdBy: {
        _id: string;
        name: string;
        email: string;
        id: string;
      };
      createdAt: string;
      updatedAt: string;
      __v: number;
    }>;
    upcomingMeetings: Array<{
      _id: string;
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      location: string;
      agenda: string;
      consortium: Array<{
        _id: string;
        name: string;
      }>;
      organization: Array<{
        _id: string;
        name: string;
      }>;
      meetingType: string;
      meetingLink: string;
      attendees: Array<{
        _id: string;
        name: string;
        email: string;
        id: string;
      }>;
      status: string;
      timezone: string;
      createdBy: {
        _id: string;
        name: string;
        email: string;
        id: string;
      };
      actionItems: unknown[];
      createdAt: string;
      updatedAt: string;
      __v: number;
    }>;
    actionItems: Array<{
      _id: string;
      title: string;
      description: string;
      consortium: Array<{
        _id: string;
        name: string;
      }>;
      organization: Array<{
        _id: string;
        name: string;
      }>;
      organizationUser: unknown[];
      assignTo: string;
      assignToModel: string;
      assignToUser?: string;
      assignToUserModel?: string;
      implementationDate: string;
      status: string;
      createdBy: {
        _id: string;
        name: string;
        email: string;
        id: string;
      };
      createdAt: string;
      updatedAt: string;
      __v: number;
    }>;
  };
}

export interface OrganizationUserDashboardSummary {
  draftRisks: number;
  sharedRisks: number;
  upcomingMeetings: number;
  actionItems: number;
  totalRisks: number;
  totalMeetings: number;
  totalActionItems: number;
}

export interface OrganizationUserDashboardResponse {
  success: boolean;
  message: string;
  data: OrganizationUserDashboardData;
}

export interface OrganizationUserDashboardSummaryResponse {
  success: boolean;
  message: string;
  data: OrganizationUserDashboardSummary;
}

// Simple cache for last successful response (5 minutes)
let lastSuccessfulResponse: OrganizationUserDashboardResponse | null = null;
let lastResponseTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const organizationUserDashboardService = {
  /**
   * Get complete organization user dashboard data including all metrics and detailed lists
   */
  async getFullOrganizationUserDashboard(organizationUserId: string, retryCount = 0): Promise<OrganizationUserDashboardResponse> {
    const endpoint = API_ENDPOINTS.ORGANIZATION_USER_DASHBOARD.FULL.replace(':organizationUserId', organizationUserId);
    
    // Check if we have the base URL configured
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5900';
    const fullUrl = `${baseUrl}/api/v1${endpoint}`;
    
    try {
      const startTime = Date.now();
      
      const response = await apiClient.get(endpoint);
      const duration = Date.now() - startTime;
      
      // Check if the API call failed (e.g., timeout, network error)
      if (response.success === false) {
        const errorMessage = response.error || 'Unknown error';
        console.error('API call failed:', errorMessage);
        
        // Create a custom error that preserves the original error type
        const error = new Error(`API call failed: ${errorMessage}`);
        (error as Error & { originalError?: string; isTimeout?: boolean }).originalError = errorMessage;
        (error as Error & { originalError?: string; isTimeout?: boolean }).isTimeout = errorMessage.includes('timeout');
        throw error;
      }
      
      if (!response.data) {
        console.error('API client returned response without data property:', response);
        throw new Error('API client returned invalid response structure');
      }
      
      // Cache successful response
      lastSuccessfulResponse = response.data as OrganizationUserDashboardResponse;
      lastResponseTime = Date.now();
      
      return response.data as OrganizationUserDashboardResponse;
    } catch (error) {
      console.error('Error in organizationUserDashboardService.getFullOrganizationUserDashboard:', error);
      
      // Retry logic for timeout errors (up to 2 retries with exponential backoff)
      if (retryCount < 2 && error instanceof Error && (error as Error & { isTimeout?: boolean }).isTimeout) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getFullOrganizationUserDashboard(organizationUserId, retryCount + 1);
      }
      
      // If all retries failed, try to return cached data if available and fresh
      if (lastSuccessfulResponse && (Date.now() - lastResponseTime) < CACHE_DURATION) {
        return lastSuccessfulResponse;
      }
      
      throw error;
    }
  },

  /**
   * Get quick organization user dashboard summary with just the essential counts
   */
  async getOrganizationUserDashboardSummary(organizationUserId: string): Promise<OrganizationUserDashboardSummaryResponse> {
    const endpoint = API_ENDPOINTS.ORGANIZATION_USER_DASHBOARD.SUMMARY.replace(':organizationUserId', organizationUserId);
    const response = await apiClient.get(endpoint);
    return response.data as OrganizationUserDashboardSummaryResponse;
  },

  /**
   * Clear the cached organization user dashboard data
   */
  clearCache(): void {
    lastSuccessfulResponse = null;
    lastResponseTime = 0;
  }
};
