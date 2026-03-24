import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import { facilitatorDashboardService } from './facilitatorDashboard';
import { organizationUserDashboardService } from './organizationDashboard';
import { adminDashboardService } from './adminDashboard';
import type { Meeting } from './meetings';

// Re-export Meeting type for use in index.ts
export type { Meeting };

export interface Risk {
  _id: string;
  title: string;
  category: string;
  consortium: string[];
  organization: string[];
  statement: string;
  likelihood: string;
  severity: string;
  triggerIndicator: string;
  mitigationMeasures: string;
  preventiveMeasures?: string;
  reactiveMeasures?: string;
  status: string;
  triggerStatus: string;
  orgRoles: Array<{ organization: { _id: string; name: string; type?: string; ref?: string }; role: string }>;
  code: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ActionItem {
  _id: string;
  title: string;
  description: string;
  consortium: string | { _id: string; name: string } | Array<string | { _id: string; name: string }>;
  organization: Array<string | { _id: string; name: string }>;
  organizationUser: Array<string | { _id: string; name: string }>;
  assignTo: string | { _id: string; name: string };
  assignToModel: string;
  assignToUser?: string | { _id: string; name: string };
  assignToUserModel?: string;
  implementationDate: string;
  status: string;
  createdBy: string | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
  __v: number;
}



export interface DashboardStats {
  myRisks: {
    count: number;
    items: Risk[];
  };
  sharedRisks: {
    count: number;
    items: Risk[];
  };
  pendingActionItems: {
    count: number;
    items: ActionItem[];
  };
}

// Facilitator-specific dashboard stats
export interface FacilitatorDashboardStats extends DashboardStats {
  consortiumRisks: {
    count: number;
    items: Risk[];
  };
  risksRequiringReview: {
    count: number;
    items: Risk[];
  };
  facilitationActions: {
    count: number;
    items: ActionItem[];
  };

  // Additional facilitator-specific metrics
  highPriorityRisks: {
    count: number;
    items: Risk[];
  };
  triggeredRisks: {
    count: number;
    items: Risk[];
  };
  overdueActionItems: {
    count: number;
    items: ActionItem[];
  };
  upcomingMeetings?: {
    count: number;
    items: Meeting[];
  };
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardStats;
}

export interface FacilitatorDashboardResponse {
  success: boolean;
  data: FacilitatorDashboardStats;
}

// Interface for the new facilitator dashboard API response
interface FacilitatorDashboardApiResponse {
  data: {
    details: {
      pendingReviewRisks: Array<{
        _id: string;
        title: string;
        category: string;
        consortium: Array<{ _id: string; name: string }>;
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
        orgRoles: Array<{ organization: string; role: string; _id: string }>;
        code: string;
        createdBy: { _id: string; name: string; email: string; id: string };
        createdAt: string;
        updatedAt: string;
        __v: number;
      }>;
      highPriorityRisks: Array<{
        _id: string;
        title: string;
        category: string;
        consortium: Array<{ _id: string; name: string }>;
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
        orgRoles: Array<{ organization: string; role: string; _id: string }>;
        code: string;
        createdBy: { _id: string; name: string; email: string; id: string };
        createdAt: string;
        updatedAt: string;
        __v: number;
      }>;
      triggeredRisks: Array<{
        _id: string;
        title: string;
        category: string;
        consortium: Array<{ _id: string; name: string }>;
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
        orgRoles: Array<{ organization: string; role: string; _id: string }>;
        code: string;
        createdBy: { _id: string; name: string; email: string; id: string };
        createdAt: string;
        updatedAt: string;
        __v: number;
      }>;

      assignedActionItems: unknown[];
      atRiskItems: Array<{
        _id: string;
        title: string;
        description: string;
        consortium: Array<{ _id: string; name: string }>;
        organization: Array<{ _id: string; name: string }>;
        organizationUser: unknown[];
        assignTo: string;
        assignToModel: string;
        assignToUser?: string;
        assignToUserModel?: string;
        implementationDate: string;
        status: string;
        createdBy: { _id: string; name: string; email: string; id: string };
        createdAt: string;
        updatedAt: string;
        __v: number;
      }>;
    };
    summary: {
      pendingReview: number;
      highPriorityRisks: number;
      triggeredRisks: number;

      assignedActionItems: number;
      atRiskItems: number;
    };
  };
}



// Helper function to map new facilitator dashboard API response to existing interface
const mapFacilitatorDashboardResponse = (apiResponse: FacilitatorDashboardApiResponse): FacilitatorDashboardStats => {
  const data = apiResponse.data;
  
  // Helper function to convert API risk data to expected Risk type
  const convertToRisk = (apiRisk: {
    _id: string;
    title: string;
    category: string;
    consortium: Array<{ _id: string; name: string }>;
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
    orgRoles: Array<{ organization: string; role: string; _id: string }>;
    code: string;
    createdBy: { _id: string; name: string; email: string; id: string };
    createdAt: string;
    updatedAt: string;
    __v: number;
  }): Risk => ({
    _id: apiRisk._id,
    title: apiRisk.title,
    category: apiRisk.category,
    consortium: apiRisk.consortium.map(c => c._id),
    organization: Array.isArray(apiRisk.organization) ? apiRisk.organization.map((o: unknown) => typeof o === 'string' ? o : (o as { _id: string })._id) : [],
    statement: apiRisk.statement,
    likelihood: apiRisk.likelihood,
    severity: apiRisk.severity,
    triggerIndicator: apiRisk.triggerIndicator,
    mitigationMeasures: apiRisk.mitigationMeasures,
    preventiveMeasures: apiRisk.preventiveMeasures,
    reactiveMeasures: apiRisk.reactiveMeasures,
    status: apiRisk.status,
    triggerStatus: apiRisk.triggerStatus,
    orgRoles: apiRisk.orgRoles.map(role => ({
      organization: { _id: role.organization, name: '', type: undefined, ref: undefined },
      role: role.role
    })),
    code: apiRisk.code,
    createdBy: apiRisk.createdBy._id,
    createdAt: apiRisk.createdAt,
    updatedAt: apiRisk.updatedAt,
    __v: apiRisk.__v
  });



  // Helper function to convert API action item data to expected ActionItem type
  const convertToActionItem = (apiActionItem: {
    _id: string;
    title: string;
    description: string;
    consortium: Array<{ _id: string; name: string }>;
    organization: Array<{ _id: string; name: string }>;
    organizationUser: unknown[];
    assignTo: string;
    assignToModel: string;
    assignToUser?: string;
    assignToUserModel?: string;
    implementationDate: string;
    status: string;
    createdBy: { _id: string; name: string; email: string; id: string };
    createdAt: string;
    updatedAt: string;
    __v: number;
  }): ActionItem => ({
    _id: apiActionItem._id,
    title: apiActionItem.title,
    description: apiActionItem.description,
    consortium: apiActionItem.consortium.map(c => c._id),
    organization: apiActionItem.organization.map(o => o._id),
    organizationUser: Array.isArray(apiActionItem.organizationUser) ? apiActionItem.organizationUser.map((u: unknown) => typeof u === 'string' ? u : (u as { _id: string })._id) : [],
    assignTo: apiActionItem.assignTo,
    assignToModel: apiActionItem.assignToModel,
    assignToUser: apiActionItem.assignToUser || '',
    assignToUserModel: apiActionItem.assignToUserModel || 'User',
    implementationDate: apiActionItem.implementationDate,
    status: apiActionItem.status,
    createdBy: apiActionItem.createdBy._id,
    createdAt: apiActionItem.createdAt,
    updatedAt: apiActionItem.updatedAt,
    __v: apiActionItem.__v
  });
  
  return {
    myRisks: { count: 0, items: [] }, // Facilitators don't have personal risks
    sharedRisks: {
      count: data.summary.pendingReview + data.summary.highPriorityRisks + data.summary.triggeredRisks,
      items: [
        ...data.details.pendingReviewRisks.map(convertToRisk),
        ...data.details.highPriorityRisks.map(convertToRisk),
        ...data.details.triggeredRisks.map(convertToRisk)
      ]
    },

    pendingActionItems: {
      count: data.summary.assignedActionItems,
      items: (data.details.assignedActionItems as Array<{
        _id: string;
        title: string;
        description: string;
        consortium: Array<{ _id: string; name: string }>;
        organization: Array<{ _id: string; name: string }>;
        organizationUser: unknown[];
        assignTo: string;
        assignToModel: string;
        assignToUser?: string;
        assignToUserModel?: string;
        implementationDate: string;
        status: string;
        createdBy: { _id: string; name: string; email: string; id: string };
        createdAt: string;
        updatedAt: string;
        __v: number;
      }>).map(convertToActionItem)
    },
    consortiumRisks: {
      count: data.summary.pendingReview + data.summary.highPriorityRisks + data.summary.triggeredRisks,
      items: [
        ...data.details.pendingReviewRisks.map(convertToRisk),
        ...data.details.highPriorityRisks.map(convertToRisk),
        ...data.details.triggeredRisks.map(convertToRisk)
      ]
    },
    risksRequiringReview: {
      count: data.summary.pendingReview,
      items: data.details.pendingReviewRisks.map(convertToRisk)
    },
    facilitationActions: {
      count: data.summary.assignedActionItems,
      items: (data.details.assignedActionItems as Array<{
        _id: string;
        title: string;
        description: string;
        consortium: Array<{ _id: string; name: string }>;
        organization: Array<{ _id: string; name: string }>;
        organizationUser: unknown[];
        assignTo: string;
        assignToModel: string;
        assignToUser?: string;
        assignToUserModel?: string;
        implementationDate: string;
        status: string;
        createdBy: { _id: string; name: string; email: string; id: string };
        createdAt: string;
        updatedAt: string;
        __v: number;
      }>).map(convertToActionItem)
    },

    highPriorityRisks: {
      count: data.summary.highPriorityRisks,
      items: data.details.highPriorityRisks.map(convertToRisk)
    },
    triggeredRisks: {
      count: data.summary.triggeredRisks,
      items: data.details.triggeredRisks.map(convertToRisk)
    },
    overdueActionItems: {
      count: data.summary.atRiskItems,
      items: data.details.atRiskItems.map(convertToActionItem)
    }
  };
};

// Helper function to map new organization user dashboard API response to existing interface
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapOrganizationUserDashboardResponse = (apiResponse: any): DashboardStats => {
  const data = apiResponse.data;
  
  return {
    myRisks: {
      count: data.summary.draftRisks || 0,
      items: []
    },
    sharedRisks: {
      count: data.summary.sharedRisks || 0,
      items: []
    },

    pendingActionItems: {
      count: data.summary.actionItems || 0,
      items: []
    }
  };
};

export const dashboardService = {
  async getDashboardStats(consortiumId?: string, userId?: string): Promise<DashboardResponse> {
    const payload = {
      consortiumId: consortiumId || '',
      userId: userId || ''
    };
    
    const response = await apiClient.post(API_ENDPOINTS.DASHBOARD.STATS, payload);
    return response.data as DashboardResponse;
  },

  async getAdminDashboardStats(adminId: string): Promise<import('./adminDashboard').AdminDashboardResponse> {
    if (!adminId) {
      throw new Error('Admin ID is required for admin dashboard');
    }
    
    // Use the dedicated admin dashboard API
    const response = await adminDashboardService.getFullAdminDashboard(adminId);
    return response;
  },

  // Note: This method is deprecated for facilitators. Use facilitatorDashboardService.getFullFacilitatorDashboard() instead.
  async getFacilitatorDashboardStats(currentUserId?: string): Promise<FacilitatorDashboardResponse> {
    console.warn('getFacilitatorDashboardStats is deprecated. Use facilitatorDashboardService.getFullFacilitatorDashboard() instead.');
    
    if (!currentUserId) {
      throw new Error('User ID is required for facilitator dashboard');
    }
    
    // For facilitators, always use the new dedicated API
    const response = await facilitatorDashboardService.getFullFacilitatorDashboard(currentUserId);
    
    // Map the new API response to the existing interface
    const mappedStats = mapFacilitatorDashboardResponse(response);
    
    return {
      success: true,
      data: mappedStats
    };
  },

  // Note: This method is deprecated for organization users. Use organizationUserDashboardService.getFullOrganizationUserDashboard() instead.
  async getOrganizationUserDashboardStats(currentUserId?: string): Promise<DashboardResponse> {
    console.warn('getOrganizationUserDashboardStats is deprecated. Use organizationUserDashboardService.getFullOrganizationUserDashboard() instead.');
    
    if (!currentUserId) {
      throw new Error('User ID is required for organization user dashboard');
    }
    
    // For organization users, always use the new dedicated API
    const response = await organizationUserDashboardService.getFullOrganizationUserDashboard(currentUserId);
    
    // Map the new API response to the existing interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedStats = mapOrganizationUserDashboardResponse(response as any);
    
    return {
      success: true,
      data: mappedStats
    };
  },
}; 