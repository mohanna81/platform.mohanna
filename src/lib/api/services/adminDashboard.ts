import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';

// Admin Dashboard API Response Types based on actual API structure
export interface AdminInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface SystemOverview {
  totalUsers: number;
  totalOrganizations: number;
  totalConsortia: number;
  totalRisks: number;
  totalMeetings: number;
  totalActionItems: number;
}

export interface UsersByRole {
  _id: string;
  count: number;
  users: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  }>;
}

export interface RiskBreakdown {
  _id: string;
  count: number;
}

export interface AdminDashboardApiResponse {
  success: boolean;
  message?: string;
  data: {
    admin: AdminInfo;
    systemOverview: SystemOverview;
    users: {
      byRole: UsersByRole[];
      byOrganization: Array<{
        _id: string[];
        count: number;
        users: Array<{
          name: string;
          email: string;
          role: string;
          status: string;
        }>;
      }>;
      byConsortium: Array<{
        _id: string[];
        count: number;
        users: Array<{
          name: string;
          email: string;
          role: string;
          status: string;
        }>;
      }>;
    };
    organizations: {
      all: Array<{
        _id: string;
        name: string;
        description: string;
        status: string;
        consortia: Array<{
          _id: string;
          name: string;
          status: string;
        }>;
      }>;
      statusBreakdown: RiskBreakdown[];
    };
    consortia: {
      all: Array<{
        _id: string;
        name: string;
        status: string;
        organizations: Array<{
          _id: string;
          name: string;
          status: string;
        }>;
      }>;
      statusBreakdown: RiskBreakdown[];
    };
    risks: {
      all: Array<{
        _id: string;
        title: string;
        category: string;
        status: string;
        triggerStatus: string;
        likelihood: string;
        severity: string;
      }>;
      statusBreakdown: RiskBreakdown[];
      highPriority: Array<{
        _id: string;
        title: string;
        category: string;
        status: string;
        likelihood: string;
        severity: string;
      }>;
      triggered: Array<{
        _id: string;
        title: string;
        category: string;
        status: string;
        triggerStatus: string;
      }>;
    };
    meetings: {
      all: Array<{
        _id: string;
        title: string;
        date: string;
        status: string;
        meetingType: string;
      }>;
      typeBreakdown: RiskBreakdown[];
      upcoming: Array<{
        _id: string;
        title: string;
        date: string;
        status: string;
      }>;
    };
    actionItems: {
      all: Array<{
        _id: string;
        title: string;
        status: string;
        implementationDate: string;
      }>;
      statusBreakdown: RiskBreakdown[];
      overdue: Array<{
        _id: string;
        title: string;
        status: string;
        implementationDate: string;
      }>;
    };
    breakdowns: {
      riskStatus: RiskBreakdown[];
      actionItemStatus: RiskBreakdown[];
      meetingType: RiskBreakdown[];
      organizationStatus: RiskBreakdown[];
      consortiumStatus: RiskBreakdown[];
    };
    recentActivity: {
      users: number;
      organizations: number;
      consortia: number;
      risks: number;
      meetings: number;
      actionItems: number;
    };
  };
}

// Recent data types
export interface RecentRisk {
  _id: string;
  title: string;
  category: string;
  status: string;
  triggerStatus: string;
  likelihood: string;
  severity: string;
}

export interface RecentMeeting {
  _id: string;
  title: string;
  date: string;
  status: string;
}

export interface RecentActionItem {
  _id: string;
  title: string;
  status: string;
  implementationDate: string;
}

// Simplified interface for dashboard stats grid compatibility
export interface AdminDashboardStats {
  systemOverview: SystemOverview;
  pendingReviewRisks: number;
  highPriorityRisks: number;
  triggeredRisks: number;
  overdueActionItems: number;
  activeConsortia: number;
  inactiveConsortia: number;
  recentUsers: UsersByRole[];
  recentRisks: RecentRisk[];
  recentMeetings: RecentMeeting[];
  recentActionItems: RecentActionItem[];
}

export interface AdminDashboardResponse {
  success: boolean;
  message?: string;
  data: AdminDashboardStats;
}

// Admin Dashboard Service
export const adminDashboardService = {
  /**
   * Get full admin dashboard statistics
   * @param adminId - The admin user ID
   * @returns Promise<AdminDashboardResponse>
   */
  async getFullAdminDashboard(adminId: string): Promise<AdminDashboardResponse> {
    try {
      const response = await apiClient.get<AdminDashboardApiResponse>(API_ENDPOINTS.ADMIN_DASHBOARD.FULL.replace(':adminId', adminId));
      
      if (!response.data) {
        throw new Error('Admin dashboard API returned no data');
      }

      const apiData = response.data.data;

      // Calculate derived metrics from the API data
      const pendingReviewRisks = apiData.breakdowns.riskStatus.find((status: RiskBreakdown) => status._id === 'Pending')?.count || 0;
      const highPriorityRisks = apiData.risks.highPriority?.length || 0;
      const triggeredRisks = apiData.risks.triggered?.length || 0;
      const overdueActionItems = apiData.actionItems.overdue?.length || 0;
      const activeConsortia = apiData.breakdowns.consortiumStatus.find((status: RiskBreakdown) => status._id === 'Active')?.count || 0;
      const inactiveConsortia = apiData.systemOverview.totalConsortia - activeConsortia;

      // Map the API response to our simplified interface
      const mappedData: AdminDashboardStats = {
        systemOverview: apiData.systemOverview,
        pendingReviewRisks,
        highPriorityRisks,
        triggeredRisks,
        overdueActionItems,
        activeConsortia,
        inactiveConsortia,
        recentUsers: apiData.users.byRole,
        recentRisks: apiData.risks.all.slice(0, 10), // Latest 10 risks
        recentMeetings: apiData.meetings.upcoming.slice(0, 10), // Next 10 meetings
        recentActionItems: apiData.actionItems.all.slice(0, 10) // Latest 10 action items
      };

      return {
        success: response.data.success,
        message: response.data.message,
        data: mappedData
      };
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      throw error;
    }
  },

  /**
   * Get admin dashboard summary only
   * @param adminId - The admin user ID
   * @returns Promise<AdminDashboardResponse>
   */
  async getAdminDashboardSummary(adminId: string): Promise<AdminDashboardResponse> {
    try {
      // For now, use the same endpoint as the full dashboard
      // In the future, you might have a separate summary endpoint
      return await this.getFullAdminDashboard(adminId);
    } catch (error) {
      console.error('Error fetching admin dashboard summary:', error);
      throw error;
    }
  }
};