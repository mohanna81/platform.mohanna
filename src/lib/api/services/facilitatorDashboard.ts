import { apiClient } from '../client';
import { API_ENDPOINTS, API_CONFIG } from '../config';

export interface FacilitatorDashboardData {
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
    atRiskItems: number;
    pendingReview: number;
    upcomingMeetings: number;
    assignedActionItems: number;
    highPriorityRisks: number;
    triggeredRisks: number;
    totalRisks: number;
    totalMeetings: number;
    totalActionItems: number;
    overdueActionItems: number;
    thisWeekMeetings: number;
    physicalMeetings: number;
    virtualMeetings: number;
  };
  riskStatusBreakdown: Array<{
    _id: string;
    count: number;
  }>;
  actionItemStatusBreakdown: Array<{
    _id: string;
    count: number;
  }>;
  meetingTypeBreakdown: Array<{
    _id: string;
    count: number;
  }>;
  recentActivity: {
    risks: number;
    meetings: number;
    actionItems: number;
  };
  details: {
    atRiskItems: Array<{
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
      implementationDate: string;
      status: string;
      createdBy: {
        _id: string;
        name: string;
        email: string;
        id: string;
      };
      comments: unknown[];
      createdAt: string;
      updatedAt: string;
      __v: number;
    }>;
    pendingReviewRisks: Array<{
      _id: string;
      title: string;
      category: string;
      consortium: Array<{
        _id: string;
        name: string;
      }>;
      organization: unknown[];
      statement: string;
      likelihood: string;
      severity: string;
      triggerIndicator: string;
      mitigationMeasures: string;
      preventiveMeasures: string;
      reactiveMeasures: string;
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
    assignedActionItems: unknown[];
    highPriorityRisks: Array<{
      _id: string;
      title: string;
      category: string;
      consortium: Array<{
        _id: string;
        name: string;
      }>;
      organization: unknown[];
      statement: string;
      likelihood: string;
      severity: string;
      triggerIndicator: string;
      mitigationMeasures: string;
      preventiveMeasures: string;
      reactiveMeasures: string;
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
    triggeredRisks: Array<{
      _id: string;
      title: string;
      category: string;
      consortium: Array<{
        _id: string;
        name: string;
      }>;
      organization: unknown[];
      statement: string;
      likelihood: string;
      severity: string;
      triggerIndicator: string;
      mitigationMeasures: string;
      preventiveMeasures: string;
      reactiveMeasures: string;
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
  };
}

export interface FacilitatorDashboardSummary {
  atRiskItems: number;
  pendingReview: number;
  upcomingMeetings: number;
  assignedActionItems: number;
  highPriorityRisks: number;
  triggeredRisks: number;
  totalRisks: number;
  totalMeetings: number;
  totalActionItems: number;
  overdueActionItems: number;
  thisWeekMeetings: number;
  physicalMeetings: number;
  virtualMeetings: number;
}

export interface FacilitatorDashboardResponse {
  success: boolean;
  message: string;
  data: FacilitatorDashboardData;
}

export interface FacilitatorDashboardSummaryResponse {
  success: boolean;
  message: string;
  data: FacilitatorDashboardSummary;
}

// Simple cache for last successful response (5 minutes)
let lastSuccessfulResponse: FacilitatorDashboardResponse | null = null;
let lastResponseTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const facilitatorDashboardService = {
  /**
   * Get complete facilitator dashboard data including all metrics and detailed lists
   */
  async getFullFacilitatorDashboard(facilitatorUserId: string, retryCount = 0): Promise<FacilitatorDashboardResponse> {
    const endpoint = API_ENDPOINTS.FACILITATOR_DASHBOARD.FULL.replace(':facilitatorId', facilitatorUserId);
    
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
      lastSuccessfulResponse = response.data as FacilitatorDashboardResponse;
      lastResponseTime = Date.now();
      
      return response.data as FacilitatorDashboardResponse;
    } catch (error) {
      console.error('Error in facilitatorDashboardService.getFullFacilitatorDashboard:', error);
      
      // Retry logic for timeout errors (up to 2 retries with exponential backoff)
      if (retryCount < 2 && error instanceof Error && (error as Error & { isTimeout?: boolean }).isTimeout) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.getFullFacilitatorDashboard(facilitatorUserId, retryCount + 1);
      }
      
      // If all retries failed, try to return cached data if available and fresh
      if (lastSuccessfulResponse && (Date.now() - lastResponseTime) < CACHE_DURATION) {
        return lastSuccessfulResponse;
      }
      
      throw error;
    }
  },

  /**
   * Get quick facilitator dashboard summary with just the essential counts
   */
  async getFacilitatorDashboardSummary(facilitatorUserId: string): Promise<FacilitatorDashboardSummaryResponse> {
    const endpoint = API_ENDPOINTS.FACILITATOR_DASHBOARD.SUMMARY.replace(':facilitatorId', facilitatorUserId);
    const response = await apiClient.get(endpoint);
    return response.data as FacilitatorDashboardSummaryResponse;
  },

  /**
   * Clear the cached facilitator dashboard data
   */
  clearCache(): void {
    lastSuccessfulResponse = null;
    lastResponseTime = 0;
  }
};
