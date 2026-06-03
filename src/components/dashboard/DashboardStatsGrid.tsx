import React from 'react';
import { Shield, Users, Calendar, CheckSquare, AlertTriangle, Clock, BarChart3, Activity, Target, Eye, RefreshCw, Plus, Settings, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { dashboardService, DashboardStats, FacilitatorDashboardStats, Risk, ActionItem, adminDashboardService, AdminDashboardStats } from '@/lib/api';
import { risksService } from '@/lib/api/services/risks';
import { actionItemsService } from '@/lib/api/services/actionitems';
import { meetingsService } from '@/lib/api/services/meetings';
import { fetchConsortiaByRole } from '@/lib/api/services/consortia';
import { userService } from '@/lib/api/services/auth';
import { facilitatorDashboardService, FacilitatorDashboardResponse } from '@/lib/api/services/facilitatorDashboard';
import { showToast } from '@/lib/utils/toast';
import { roleHelpers } from '@/lib/utils/authStorage';
import Loader from '@/components/common/Loader';
import { useAuth } from '@/lib/auth/AuthContext';
import { useConsortium } from '@/lib/context/ConsortiumContext';

// Type for API risk data that needs conversion
interface ApiRiskData {
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
}



// Type for API action item data that needs conversion
interface ApiActionItemData {
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
}

// Type for additional dashboard data
interface AdditionalDashboardData {
  atRiskItems?: number;
  pendingReview?: number;

  assignedActionItems?: number;
  highPriorityRisks?: number;
  triggeredRisks?: number;
  totalRisks?: number;
  totalMeetings?: number;
  totalActionItems?: number;
  overdueActionItems?: number;
  upcomingMeetings?: number;
  thisWeekMeetings?: number;
  physicalMeetings?: number;
  virtualMeetings?: number;
}

// Extended types for stats with additional data
interface DashboardStatsWithAdditional extends DashboardStats {
  additionalData?: AdditionalDashboardData;
}

interface FacilitatorDashboardStatsWithAdditional extends FacilitatorDashboardStats {
  additionalData?: AdditionalDashboardData;
}

interface AdminDashboardStatsWithAdditional extends AdminDashboardStats {
  additionalData?: AdditionalDashboardData;
}

const getEntityId = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (typeof value._id === 'string') return value._id;
    if (typeof value.id === 'string') return value.id;
  }
  return '';
};

const DashboardStatsGrid = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedConsortium } = useConsortium();
  const [stats, setStats] = React.useState<DashboardStatsWithAdditional | FacilitatorDashboardStatsWithAdditional | AdminDashboardStatsWithAdditional>({
    myRisks: { count: 0, items: [] },
    sharedRisks: { count: 0, items: [] },
    pendingActionItems: { count: 0, items: [] }
  });
  const [loading, setLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date());

  const hasAdminPrivileges = roleHelpers.hasAdminPrivileges();
  const isFacilitator = roleHelpers.isFacilitator();

  const fetchDashboardStats = React.useCallback(async () => {
    try {
      setLoading(true);
      
      let response: { success: boolean; data: DashboardStatsWithAdditional | FacilitatorDashboardStatsWithAdditional };
      
      // Use facilitator-specific endpoint for facilitators
      if (isFacilitator) {
        
        if (!user?.id) {
          console.warn('No user ID found for facilitator, showing empty action items');
          return;
        }
        
        // Use individual page APIs instead of centralized facilitator dashboard API
        
        try {
          // Fetch data from individual page APIs in parallel, including user's consortia and meetings
          const [
            pendingRisksResponse,
            approvedRisksResponse,
            rejectedRisksResponse,
            actionItemsResponse,
            meetingsResponse,
            userProfileResponse
          ] = await Promise.all([
            risksService.getRisksByStatus('Pending'),
            risksService.getRisksByStatus('Approved'),
            risksService.getRisksByStatus('Rejected'),
            actionItemsService.getActionItems(),
            meetingsService.getAttendeeMeetings(user.id), // For Upcoming Meetings
            userService.getUserById(user.id) // Get user's consortia IDs (same as action items page)
          ]);

          console.log('Individual API responses for facilitator:', { 
            pendingRisksResponse, 
            approvedRisksResponse, 
            rejectedRisksResponse, 
            actionItemsResponse,
            meetingsResponse,
            userProfileResponse
          });

          // Extract user consortia IDs (same approach as action items page)
          let userConsortiaIds: string[] = [];
          if (userProfileResponse.success && userProfileResponse.data) {
            const userData = userProfileResponse.data as { consortia?: string[]; user?: { consortia?: string[] } };
            userConsortiaIds = userData.consortia || userData.user?.consortia || [];
          }

          // Process Pending Risks (risks requiring review) - filter for facilitator's consortium
          let pendingRisks: any[] = [];
          if (pendingRisksResponse.data?.success && pendingRisksResponse.data?.data) {
            pendingRisks = pendingRisksResponse.data.data.filter((risk: any) => {
              // Filter risks by facilitator's accessible consortiums (using consortia IDs from user profile)
              const riskConsortiumIds = Array.isArray(risk.consortium) 
                ? risk.consortium.map((c: any) => getEntityId(c)).filter(Boolean)
                : [];
              const hasAvailableConsortium = riskConsortiumIds.some((id: string) => 
                userConsortiaIds.includes(id)
              );
              return hasAvailableConsortium;
            });
          }

          // Process Approved Risks (shared risks) - filter for facilitator's consortium
          let approvedRisks: any[] = [];
          if (approvedRisksResponse.data?.success && approvedRisksResponse.data?.data) {
            approvedRisks = approvedRisksResponse.data.data.filter((risk: any) => {
              // Filter risks by facilitator's accessible consortiums (using consortia IDs from user profile)
              const riskConsortiumIds = Array.isArray(risk.consortium) 
                ? risk.consortium.map((c: any) => getEntityId(c)).filter(Boolean)
                : [];
              const hasAvailableConsortium = riskConsortiumIds.some((id: string) => 
                userConsortiaIds.includes(id)
              );
              return hasAvailableConsortium;
            });
          }

          // Process Rejected Risks (rejected risks) - filter for facilitator's consortium
          let rejectedRisks: any[] = [];
          if (rejectedRisksResponse.data?.success && rejectedRisksResponse.data?.data) {
            rejectedRisks = rejectedRisksResponse.data.data.filter((risk: any) => {
              // Filter risks by facilitator's accessible consortiums (using consortia IDs from user profile)
              const riskConsortiumIds = Array.isArray(risk.consortium) 
                ? risk.consortium.map((c: any) => getEntityId(c)).filter(Boolean)
                : [];
              const hasAvailableConsortium = riskConsortiumIds.some((id: string) => 
                userConsortiaIds.includes(id)
              );
              return hasAvailableConsortium;
            });
          }

          // Process Action Items (for facilitator-assigned items)
          let allActionItems: any[] = [];
          if (actionItemsResponse.success && actionItemsResponse.data?.data) {
            allActionItems = actionItemsResponse.data.data;
          }

          // Filter action items for facilitator (exact same logic as Action Items page)
          const facilitatorActionItems = allActionItems.filter((item: any) => {
            const userId = user.id;
            const userOrganizationId = user.organizationId;

            // For facilitators, check consortium first (but don't return early - continue to other checks)
            let isInConsortium = false;
            if (Array.isArray(item.consortium)) {
              const itemConsortiumIds = item.consortium.map((c: any) => getEntityId(c)).filter(Boolean);
              isInConsortium = itemConsortiumIds.some((consortiumId: string) => userConsortiaIds.includes(consortiumId));
            } else if (typeof item.consortium === 'object' && item.consortium !== null) {
              const consortiumId = getEntityId(item.consortium);
              isInConsortium = userConsortiaIds.includes(consortiumId);
          } else {
              isInConsortium = userConsortiaIds.includes(item.consortium as string);
            }

            if (isInConsortium) return true;

            // Check if user is directly assigned to this action item (new structure)
            if (item.assignToModel === 'User') {
              const assignedUserId = typeof item.assignTo === 'object' 
                ? getEntityId(item.assignTo)
                : item.assignTo;
              if (assignedUserId === userId) {
                return true;
              }
            }

            // Check if user's organization is assigned to this action item (new structure)
            if (item.assignToModel === 'Organization') {
              const assignedOrgId = typeof item.assignTo === 'object' 
                ? getEntityId(item.assignTo)
                : item.assignTo;
              if (userOrganizationId && userOrganizationId === assignedOrgId) {
                return true;
              }
            }

            // Legacy check for assignToUser (for backward compatibility)
            if (item.assignToUser) {
              const assignedUserId = typeof item.assignToUser === 'object' 
                ? getEntityId(item.assignToUser)
                : item.assignToUser;
              if (assignedUserId === userId) {
                return true;
              }
            }

            // Check if user is in the organizationUser array
            if (item.organizationUser && Array.isArray(item.organizationUser)) {
              const orgUserIds = item.organizationUser.map((orgUser: any) => getEntityId(orgUser)).filter(Boolean);
              if (orgUserIds.includes(userId)) {
                return true;
              }
            }

            // Check if user's organization is in the organization array
            if (item.organization && Array.isArray(item.organization)) {
              const orgIds = item.organization.map((org: any) => getEntityId(org)).filter(Boolean);
              if (userOrganizationId && orgIds.includes(userOrganizationId)) {
                return true;
              }
            }

            return false;
          });

          // Process Upcoming Meetings (filter for future meetings only)
          let upcomingMeetings: any[] = [];
          if (meetingsResponse.success && meetingsResponse.data?.data) {
            const currentDate = new Date();
            upcomingMeetings = meetingsResponse.data.data.filter((meeting: any) => {
              // Only include scheduled meetings that are in the future
              if (meeting.status !== 'Scheduled') return false;
              
              const meetingDate = new Date(meeting.date);
              return meetingDate > currentDate;
            });
          }

          console.log('Filtered data counts for facilitator:', {
            userConsortiaIds: userConsortiaIds,
            userId: user.id,
            userOrganizationId: user.organizationId,
            pendingRisks: pendingRisks.length,
            approvedRisks: approvedRisks.length,
            rejectedRisks: rejectedRisks.length,
            upcomingMeetings: upcomingMeetings.length,
            totalMeetingsFromAPI: meetingsResponse.data?.data?.length || 0,
            facilitatorActionItems: facilitatorActionItems.length,
            totalActionItems: allActionItems.length,
            usingCompleteActionItemsPageLogic: true
          });

          // Debug: Show sample of filtered action items
          console.log('Sample filtered action items for facilitator:', facilitatorActionItems.slice(0, 3).map(item => ({
            id: item._id,
            title: item.title,
            consortium: item.consortium,
            assignToModel: item.assignToModel,
            assignTo: item.assignTo,
            organizationUser: item.organizationUser,
            organization: item.organization
          })));

          // Debug: Show sample of all action items for comparison
          console.log('Sample all action items:', allActionItems.slice(0, 3).map(item => ({
            id: item._id,
            title: item.title,
            consortium: item.consortium,
            assignToModel: item.assignToModel,
            assignTo: item.assignTo,
            organizationUser: item.organizationUser,
            organization: item.organization
          })));

          // Calculate high priority risks (likelihood * severity >= 10)
          const allRisks = [...pendingRisks, ...approvedRisks, ...rejectedRisks];
          const highPriorityRisks = allRisks.filter((risk: any) => {
            const likelihood = parseInt(risk.likelihood) || 0;
            const severity = parseInt(risk.severity) || 0;
            return likelihood * severity >= 10;
          });

          // Calculate triggered risks
          const triggeredRisks = allRisks.filter((risk: any) => 
            risk.triggerStatus === 'Triggered'
          );

          // Calculate overdue action items
          const overdueActionItems = allActionItems.filter((item: any) => {
            if (item.status === 'Complete') return false;
            if (!item.implementationDate) return false;
            
            const today = new Date();
            const deadline = new Date(item.implementationDate);
            const diffTime = deadline.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return diffDays < 0; // Overdue
          });

          // Convert API data to dashboard format
          const convertRisk = (apiRisk: any) => ({
            _id: apiRisk._id,
            title: apiRisk.title,
            category: apiRisk.category,
            consortium: Array.isArray(apiRisk.consortium) ? apiRisk.consortium.map((c: any) => getEntityId(c)).filter(Boolean) : [],
            organization: Array.isArray(apiRisk.organization) ? apiRisk.organization.map((o: any) => getEntityId(o)).filter(Boolean) : [],
            statement: apiRisk.statement,
            likelihood: apiRisk.likelihood,
            severity: apiRisk.severity,
            triggerIndicator: apiRisk.triggerIndicator,
            mitigationMeasures: apiRisk.mitigationMeasures,
            preventiveMeasures: apiRisk.preventiveMeasures,
            reactiveMeasures: apiRisk.reactiveMeasures,
            status: apiRisk.status,
            triggerStatus: apiRisk.triggerStatus,
            orgRoles: apiRisk.orgRoles || [],
            code: apiRisk.code,
            createdBy: typeof apiRisk.createdBy === 'string' ? apiRisk.createdBy : apiRisk.createdBy?._id || '',
            createdAt: apiRisk.createdAt,
            updatedAt: apiRisk.updatedAt,
            __v: apiRisk.__v || 0
          });

          const convertActionItem = (apiActionItem: any) => ({
            _id: apiActionItem._id,
            title: apiActionItem.title,
            description: apiActionItem.description,
            consortium: Array.isArray(apiActionItem.consortium) ? apiActionItem.consortium.map((c: any) => getEntityId(c)).filter(Boolean) : [getEntityId(apiActionItem.consortium)].filter(Boolean),
            organization: Array.isArray(apiActionItem.organization) ? apiActionItem.organization.map((o: any) => getEntityId(o)).filter(Boolean) : [],
            organizationUser: Array.isArray(apiActionItem.organizationUser) ? apiActionItem.organizationUser.map((u: any) => getEntityId(u)).filter(Boolean) : [],
            assignTo: getEntityId(apiActionItem.assignTo),
            assignToModel: apiActionItem.assignToModel,
            implementationDate: apiActionItem.implementationDate,
            status: apiActionItem.status,
            createdBy: typeof apiActionItem.createdBy === 'string' ? apiActionItem.createdBy : apiActionItem.createdBy?._id || '',
            createdAt: apiActionItem.createdAt,
            updatedAt: apiActionItem.updatedAt,
            __v: apiActionItem.__v || 0
          });

          // Convert upcoming meetings to dashboard format
          const convertedUpcomingMeetings = upcomingMeetings.map((apiMeeting: any) => ({
            _id: apiMeeting._id,
            title: apiMeeting.title,
            date: apiMeeting.date,
            startTime: apiMeeting.startTime,
            endTime: apiMeeting.endTime,
            meetingType: apiMeeting.meetingType,
            location: apiMeeting.location,
            meetingLink: apiMeeting.meetingLink,
            agenda: apiMeeting.agenda || '',
            status: apiMeeting.status,
            consortium: Array.isArray(apiMeeting.consortium) ? apiMeeting.consortium.map((c: any) => getEntityId(c)).filter(Boolean) : [getEntityId(apiMeeting.consortium)].filter(Boolean),
            organization: Array.isArray(apiMeeting.organization) ? apiMeeting.organization.map((o: any) => getEntityId(o)).filter(Boolean) : [],
            attendees: Array.isArray(apiMeeting.attendees) ? apiMeeting.attendees.map((a: any) => getEntityId(a)).filter(Boolean) : [],
            actionItems: Array.isArray(apiMeeting.actionItems) ? apiMeeting.actionItems : [],
            createdBy: typeof apiMeeting.createdBy === 'string' ? apiMeeting.createdBy : apiMeeting.createdBy?._id || '',
            createdAt: apiMeeting.createdAt,
            updatedAt: apiMeeting.updatedAt,
            __v: apiMeeting.__v || 0
          }));

          // Create facilitator dashboard data
          const mappedData: FacilitatorDashboardStatsWithAdditional = {
            myRisks: { count: 0, items: [] }, // Facilitators don't have "my risks"
            sharedRisks: {
              count: approvedRisks.length,
              items: approvedRisks.map(convertRisk)
            },
            pendingActionItems: {
              count: facilitatorActionItems.length,
              items: facilitatorActionItems.map(convertActionItem)
            },
            consortiumRisks: {
              count: allRisks.length,
              items: allRisks.map(convertRisk)
            },
            risksRequiringReview: {
              count: pendingRisks.length,
              items: pendingRisks.map(convertRisk)
            },
            facilitationActions: {
              count: facilitatorActionItems.length,
              items: facilitatorActionItems.map(convertActionItem)
            },
            highPriorityRisks: {
              count: highPriorityRisks.length,
              items: highPriorityRisks.map(convertRisk)
            },
            triggeredRisks: {
              count: triggeredRisks.length,
              items: triggeredRisks.map(convertRisk)
            },
            overdueActionItems: {
              count: overdueActionItems.length,
              items: overdueActionItems.map(convertActionItem)
            },
            upcomingMeetings: {
              count: upcomingMeetings.length,
              items: convertedUpcomingMeetings
            }
          };
        
          // Add additional data for enhanced dashboard features
        const additionalData = {
            atRiskItems: overdueActionItems.length,
            pendingReview: pendingRisks.length,
            assignedActionItems: facilitatorActionItems.length,
            upcomingMeetings: upcomingMeetings.length,
            highPriorityRisks: highPriorityRisks.length,
            triggeredRisks: triggeredRisks.length,
            totalRisks: allRisks.length,
            totalActionItems: allActionItems.length
          };

        (mappedData as FacilitatorDashboardStatsWithAdditional).additionalData = additionalData;
        
          response = {
            success: true,
            data: mappedData
          };

        } catch (error) {
          console.error('Error fetching facilitator data from individual APIs:', error);
          showToast.error('Failed to load dashboard data');
          
          response = {
            success: false,
            data: {
            myRisks: { count: 0, items: [] },
            sharedRisks: { count: 0, items: [] },
            pendingActionItems: { count: 0, items: [] },
            consortiumRisks: { count: 0, items: [] },
            risksRequiringReview: { count: 0, items: [] },
            facilitationActions: { count: 0, items: [] },
            highPriorityRisks: { count: 0, items: [] },
            triggeredRisks: { count: 0, items: [] },
            overdueActionItems: { count: 0, items: [] }
            } as FacilitatorDashboardStats
          };
        }
        
        

      } else if (roleHelpers.isOrganization()) {
        // Use organization user-specific endpoint for organization users
        
        if (!user?.id) {
          console.warn('No user ID found for organization user, showing empty dashboard');
          return;
        }
        
        // Use individual page APIs instead of centralized dashboard API
        
        try {
          // Fetch data from individual page APIs in parallel, including user's consortia and meetings
          const [myRisksResponse, sharedRisksResponse, actionItemsResponse, meetingsResponse, userConsortia] = await Promise.all([
            risksService.getRisks(), // For My Risks
            risksService.getRisksByStatus('Approved'), // For Shared Risks (same as shared risks page)
            actionItemsService.getActionItems(),
            meetingsService.getAttendeeMeetings(user.id), // For Upcoming Meetings
            fetchConsortiaByRole(user) // Get user's consortia for shared risks filtering
          ]);

          
          // Process My Risks (filter for user's own risks)
          let myRisks: any[] = [];
          if (myRisksResponse.success && myRisksResponse.data?.data) {
            myRisks = myRisksResponse.data.data.filter((risk: any) => 
              risk.createdBy?._id === user.id || risk.createdBy === user.id
            );
          }

          // Process Shared Risks using the same logic as the shared risks page
          const consortiums = Array.isArray(userConsortia) ? userConsortia : [];
          let sharedRisks: any[] = [];
          if (sharedRisksResponse.success && sharedRisksResponse.data?.data) {
            const approvedRisks = sharedRisksResponse.data.data;
            
            sharedRisks = approvedRisks.filter((risk: any) => {
              // Filter to show only risks from available consortiums (exact same logic as shared risks page)
              const availableConsortiumIds = consortiums.map((c: any) => getEntityId(c)).filter(Boolean);
              const hasAvailableConsortium = Array.isArray(risk.consortium) && 
                risk.consortium.some((c: any) => {
                  const riskConsortiumId = getEntityId(c);
                  return !!riskConsortiumId && availableConsortiumIds.includes(riskConsortiumId);
                });
              
              // Debug logging for each risk
              if (!hasAvailableConsortium) {
                console.log('Risk filtered out by consortium filter:', {
                  riskId: risk._id,
                  riskTitle: risk.title,
                  riskConsortiums: risk.consortium?.map((c: any) => ({ id: getEntityId(c), name: c?.name || 'Unknown' })) || [],
                  availableConsortiumIds,
                  hasAvailableConsortium
                });
              }
              
              return hasAvailableConsortium;
            });
          }

          // Process Action Items (filter exactly like Action Items page)
          let userActionItems: any[] = [];
          if (actionItemsResponse.success && actionItemsResponse.data?.data) {
            userActionItems = actionItemsResponse.data.data.filter((item: any) => {
              // Use the same filtering logic as the Action Items page
              
              // Check if user is directly assigned to this action item
              if (item.assignToModel === 'User') {
                const assignedUserId = typeof item.assignTo === 'object' 
                  ? getEntityId(item.assignTo)
                  : item.assignTo;
                if (assignedUserId === user.id) {
                  return true;
                }
              }

              // Check if user's organization is assigned to this action item
              if (item.assignToModel === 'Organization') {
                if (Array.isArray(item.organization)) {
                  const orgIds = item.organization.map((org: any) => getEntityId(org)).filter(Boolean);
                  // Check if user's organization is in the assigned organizations
                  return orgIds.some((orgId: string) => {
                    // We need to check if this organization matches the user's organization
                    // This would need user's organization info which we should get from user context
                    return user.organizationId === orgId;
                  });
                }
              }

              // Check if user is in organizationUser list (fallback for legacy structure)
              if (Array.isArray(item.organizationUser)) {
                return item.organizationUser.some((orgUser: any) => {
                  if (typeof orgUser === 'string') return orgUser === user.id;
                  return orgUser?._id === user.id;
                });
              }

              return false;
            });
          }

          // Process Upcoming Meetings (filter for future meetings only)
          let upcomingMeetings: any[] = [];
          if (meetingsResponse.success && meetingsResponse.data?.data) {
            const currentDate = new Date();
            upcomingMeetings = meetingsResponse.data.data.filter((meeting: any) => {
              // Only include scheduled meetings that are in the future
              if (meeting.status !== 'Scheduled') return false;
              
              const meetingDate = new Date(meeting.date);
              return meetingDate > currentDate;
            });
          }

          // Convert API data to dashboard format
          const convertedMyRisks = myRisks.map((apiRisk: any) => ({
              _id: apiRisk._id,
              title: apiRisk.title,
              category: apiRisk.category,
            consortium: Array.isArray(apiRisk.consortium) ? apiRisk.consortium.map((c: any) => getEntityId(c)).filter(Boolean) : [],
            organization: Array.isArray(apiRisk.organization) ? apiRisk.organization.map((o: any) => getEntityId(o)).filter(Boolean) : [],
              statement: apiRisk.statement,
              likelihood: apiRisk.likelihood,
              severity: apiRisk.severity,
              triggerIndicator: apiRisk.triggerIndicator,
              mitigationMeasures: apiRisk.mitigationMeasures,
            preventiveMeasures: apiRisk.preventiveMeasures,
            reactiveMeasures: apiRisk.reactiveMeasures,
              status: apiRisk.status,
              triggerStatus: apiRisk.triggerStatus,
            orgRoles: apiRisk.orgRoles || [],
              code: apiRisk.code,
            createdBy: typeof apiRisk.createdBy === 'string' ? apiRisk.createdBy : apiRisk.createdBy?._id || '',
              createdAt: apiRisk.createdAt,
              updatedAt: apiRisk.updatedAt,
            __v: apiRisk.__v || 0
          }));

          const convertedSharedRisks = sharedRisks.map((apiRisk: any) => ({
              _id: apiRisk._id,
              title: apiRisk.title,
              category: apiRisk.category,
            consortium: Array.isArray(apiRisk.consortium) ? apiRisk.consortium.map((c: any) => getEntityId(c)).filter(Boolean) : [],
            organization: Array.isArray(apiRisk.organization) ? apiRisk.organization.map((o: any) => getEntityId(o)).filter(Boolean) : [],
              statement: apiRisk.statement,
              likelihood: apiRisk.likelihood,
              severity: apiRisk.severity,
              triggerIndicator: apiRisk.triggerIndicator,
              mitigationMeasures: apiRisk.mitigationMeasures,
            preventiveMeasures: apiRisk.preventiveMeasures,
            reactiveMeasures: apiRisk.reactiveMeasures,
              status: apiRisk.status,
              triggerStatus: apiRisk.triggerStatus,
            orgRoles: apiRisk.orgRoles || [],
              code: apiRisk.code,
            createdBy: typeof apiRisk.createdBy === 'string' ? apiRisk.createdBy : apiRisk.createdBy?._id || '',
              createdAt: apiRisk.createdAt,
              updatedAt: apiRisk.updatedAt,
            __v: apiRisk.__v || 0
          }));

          const convertedActionItems = userActionItems.map((apiActionItem: any) => ({
              _id: apiActionItem._id,
              title: apiActionItem.title,
              description: apiActionItem.description,
            consortium: Array.isArray(apiActionItem.consortium) ? apiActionItem.consortium.map((c: any) => getEntityId(c)).filter(Boolean) : [getEntityId(apiActionItem.consortium)].filter(Boolean),
            organization: Array.isArray(apiActionItem.organization) ? apiActionItem.organization.map((o: any) => getEntityId(o)).filter(Boolean) : [],
            organizationUser: Array.isArray(apiActionItem.organizationUser) ? apiActionItem.organizationUser.map((u: any) => getEntityId(u)).filter(Boolean) : [],
            assignTo: getEntityId(apiActionItem.assignTo),
              assignToModel: apiActionItem.assignToModel,
              implementationDate: apiActionItem.implementationDate,
              status: apiActionItem.status,
            createdBy: typeof apiActionItem.createdBy === 'string' ? apiActionItem.createdBy : apiActionItem.createdBy?._id || '',
              createdAt: apiActionItem.createdAt,
              updatedAt: apiActionItem.updatedAt,
            __v: apiActionItem.__v || 0
          }));

          // Create dashboard data
          const mappedData: DashboardStatsWithAdditional = {
            myRisks: {
              count: convertedMyRisks.length,
              items: convertedMyRisks
            },
            sharedRisks: {
              count: convertedSharedRisks.length,
              items: convertedSharedRisks
            },
            pendingActionItems: {
              count: convertedActionItems.length,
              items: convertedActionItems
            }
          };

          // Add additional data for enhanced dashboard features
        const additionalData = {
            totalRisks: myRisks.length, // Only show user's own risks, not shared risks
            totalActionItems: userActionItems.length,
            upcomingMeetings: upcomingMeetings.length
        };
        
        (mappedData as DashboardStatsWithAdditional).additionalData = additionalData;
        
        response = {
            success: true,
          data: mappedData
        };
        
                    console.log('Filtered data counts for organization user:', {
            totalMyRisksFromAPI: myRisksResponse.data?.data?.length || 0,
            totalApprovedRisksFromAPI: sharedRisksResponse.data?.data?.length || 0,
            totalMeetingsFromAPI: meetingsResponse.data?.data?.length || 0,
            myRisks: myRisks.length,
            sharedRisks: sharedRisks.length,
            upcomingMeetings: upcomingMeetings.length,
            totalRisksForCard: myRisks.length, // Only showing user's own risks in Total Risks
            userActionItems: userActionItems.length,
            userId: user.id,
            userConsortia: consortiums.length
          });

          // Log sample of risks to debug filtering
          console.log('Sample myRisks:', myRisks.slice(0, 3).map(r => ({
            id: r._id,
            title: r.title,
            status: r.status,
            createdBy: r.createdBy
          })));
          console.log('Sample sharedRisks:', sharedRisks.slice(0, 3).map(r => ({
            id: r._id,
            title: r.title,
            status: r.status,
            consortium: r.consortium
          })));

          // Debug consortium filtering
          console.log('User consortium info:', {
            userId: user.id,
            userConsortia: consortiums.map((c: any) => ({ id: getEntityId(c), name: c?.name || 'Unknown' })),
            hasConsortia: consortiums.length > 0
          });

          // Count how many approved risks are filtered out by consortium
          const allApprovedRisks = sharedRisksResponse.data?.data || [];

          console.log('Shared risks filtering breakdown (exact same logic as shared risks page):', {
            totalApprovedRisks: allApprovedRisks.length,
            sharedRisksAfterConsortiumFilter: sharedRisks.length,
            filteredOutByConsortium: allApprovedRisks.length - sharedRisks.length,
            note: 'Shared risks includes ALL approved risks from user consortiums (including user own risks)'
          });

        } catch (error) {
          console.error('Error fetching organization user data from individual APIs:', error);
          showToast.error('Failed to load dashboard data');
          
          response = {
            success: false,
            data: {
              myRisks: { count: 0, items: [] },
              sharedRisks: { count: 0, items: [] },
              pendingActionItems: { count: 0, items: [] }
            } as DashboardStats
          };
        }

      } else if (hasAdminPrivileges) {
        // For admin/super users, use the dedicated admin dashboard API
        
        if (!user?.id) {
          console.warn('No user ID found for admin, showing empty dashboard');
          return;
        }
        
        try {
          const adminResponse = await dashboardService.getAdminDashboardStats(user.id);
          
          // Map admin dashboard response to a compatible format
          const mappedAdminData: AdminDashboardStatsWithAdditional = {
            systemOverview: adminResponse.data.systemOverview,
            pendingReviewRisks: adminResponse.data.pendingReviewRisks,
            highPriorityRisks: adminResponse.data.highPriorityRisks,
            triggeredRisks: adminResponse.data.triggeredRisks,
            overdueActionItems: adminResponse.data.overdueActionItems,
            activeConsortia: adminResponse.data.activeConsortia,
            inactiveConsortia: adminResponse.data.inactiveConsortia,
            recentUsers: adminResponse.data.recentUsers,
            recentRisks: adminResponse.data.recentRisks,
            recentMeetings: adminResponse.data.recentMeetings,
            recentActionItems: adminResponse.data.recentActionItems
          };
          
          response = {
            success: adminResponse.success,
            data: mappedAdminData
          } as any; // Type assertion to avoid complex union type issues
        } catch (apiError) {
          console.error('Error calling admin dashboard API:', apiError);
          const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
          
          showToast.error(`Admin dashboard unavailable: ${errorMessage}`);
          
          // Return empty data instead of crashing
          response = {
            success: false,
            data: {
              summary: {
                totalUsers: 0,
                totalConsortia: 0,
                totalOrganizations: 0,
                totalRisks: 0,
                totalMeetings: 0,
                totalActionItems: 0,
                pendingReviewRisks: 0,
                highPriorityRisks: 0,
                triggeredRisks: 0,
                overdueActionItems: 0,
                activeConsortia: 0,
                inactiveConsortia: 0,
                thisWeekMeetings: 0,
                thisMonthMeetings: 0
              },
              details: {
                recentUsers: [],
                recentConsortia: [],
                recentRisks: [],
                recentMeetings: [],
                recentActionItems: [],
                systemMetrics: {
                  totalStorage: 0,
                  activeSessions: 0,
                  apiRequests: 0,
                  errorRate: 0,
                  uptime: 0
                }
              }
            } as any
          };
          return;
        }
      } else {
        // For regular users, pass consortium ID if selected, otherwise empty string for all consortiums
        const consortiumId = selectedConsortium;
        response = await dashboardService.getDashboardStats(consortiumId, user?.id);
      }
      
      if (response.success && response.data) {
        setStats(response.data as DashboardStatsWithAdditional | FacilitatorDashboardStatsWithAdditional | AdminDashboardStatsWithAdditional);
        setLastUpdated(new Date());
        
        // Log role-specific metrics for debugging
        if (isFacilitator) {
          const facilitatorStats = response.data as FacilitatorDashboardStats;
          console.log('Facilitator metrics:', {
            highPriorityRisks: facilitatorStats.highPriorityRisks?.count || 0,
            triggeredRisks: facilitatorStats.triggeredRisks?.count || 0,
            risksRequiringReview: facilitatorStats.risksRequiringReview?.count || 0,
            overdueActionItems: facilitatorStats.overdueActionItems?.count || 0,
            totalSharedRisks: facilitatorStats.sharedRisks.count,
            totalActionItems: facilitatorStats.pendingActionItems.count,
            assignedActionItems: facilitatorStats.pendingActionItems.count,
            actionItemsDetails: facilitatorStats.pendingActionItems.items.map(item => ({
              id: item._id,
              title: item.title,
              assignToModel: item.assignToModel,
              assignTo: item.assignTo
            }))
          });
        } else if (hasAdminPrivileges) {
          const adminStats = response.data as any;
          console.log('Admin metrics:', {
            totalUsers: adminStats.systemOverview?.totalUsers || 0,
            totalConsortia: adminStats.systemOverview?.totalConsortia || 0,
            totalOrganizations: adminStats.systemOverview?.totalOrganizations || 0,
            totalRisks: adminStats.systemOverview?.totalRisks || 0,
            totalMeetings: adminStats.systemOverview?.totalMeetings || 0,
            totalActionItems: adminStats.systemOverview?.totalActionItems || 0,
            pendingReviewRisks: adminStats.pendingReviewRisks || 0,
            highPriorityRisks: adminStats.highPriorityRisks || 0,
            triggeredRisks: adminStats.triggeredRisks || 0,
            overdueActionItems: adminStats.overdueActionItems || 0
          });
        }
      } else {
        showToast.error('Failed to load dashboard statistics');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      showToast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, [isFacilitator, hasAdminPrivileges, selectedConsortium, user]);

  React.useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (loading) {
    return (
      <div className="py-12">
        <Loader size="lg" variant="default" />
        <p className="text-center text-gray-500 mt-4">Loading dashboard stats...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header with refresh and export */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">
            {isFacilitator ? 'Facilitator Dashboard' : 
             roleHelpers.isOrganization() ? 'Organization Dashboard' : 'Dashboard Overview'}
          </h2>
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardStats}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* My Risks - Hidden for Facilitators, Organization Users, and Admin Users */}
        {!isFacilitator && !roleHelpers.isOrganization() && !hasAdminPrivileges && (
          <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 p-6 flex flex-col items-start min-h-[160px] border border-orange-200">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="font-semibold text-lg text-gray-900">My Risks</span>
              <Shield className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-3xl font-bold mb-1 text-orange-600">
              {hasAdminPrivileges ? 0 : (stats as any).myRisks?.count || 0}
            </div>
            <div className="text-gray-600 text-sm mb-4">Risks registered by your organization</div>
            <button
              className="bg-white rounded-lg px-4 py-2 font-semibold text-gray-900 border border-orange-200 mt-auto cursor-pointer hover:bg-orange-50 transition-colors"
              onClick={() => router.push('/my-risks')}
            >
              View Risks
            </button>
          </div>
        )}

        {/* Admin Overview - Only for Admin Users */}
        {hasAdminPrivileges && (
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 flex flex-col items-start min-h-[160px] border border-indigo-200">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="font-semibold text-lg text-gray-900">Total Users</span>
              <Users className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="text-3xl font-bold mb-1 text-indigo-600">
              {(stats as any).systemOverview?.totalUsers || 0}
            </div>
            <div className="text-gray-600 text-sm mb-4">All registered users in the system</div>
            <button
              className="bg-white rounded-lg px-4 py-2 font-semibold text-gray-900 border border-indigo-200 mt-auto cursor-pointer hover:bg-indigo-50 transition-colors"
              onClick={() => router.push('/consortium-management')}
            >
              Manage Users
            </button>
          </div>
        )}

        {/* Facilitator Overview - Only for Facilitators */}
        {isFacilitator && (
          <>
            {/* Overdue Action Items */}
            <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100 p-6 flex flex-col items-start min-h-[160px] border border-red-200">
              <div className="flex items-center justify-between w-full mb-3">
                <span className="font-semibold text-lg text-gray-900">Overdue Action Items</span>
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="text-3xl font-bold mb-1 text-red-600">
                {hasAdminPrivileges 
                  ? (stats as any).overdueActionItems || 0
                  : (stats as FacilitatorDashboardStatsWithAdditional).additionalData?.overdueActionItems || 
                    (stats as any).pendingActionItems?.items?.filter((item: any) => {
                   if (item.status === 'Complete') return false;
                   if (!item.implementationDate) return false;
                   const today = new Date();
                   const deadline = new Date(item.implementationDate);
                   const diffTime = deadline.getTime() - today.getTime();
                   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                   return diffDays < 0;
                    }).length || 0
                }
              </div>
              <div className="text-gray-600 text-sm mb-4">Action items past their implementation date</div>
              <button
                className="bg-white rounded-lg px-4 py-2 font-semibold text-gray-900 border border-red-200 mt-auto cursor-pointer hover:bg-red-50 transition-colors"
                onClick={() => router.push('/action-items?filter=overdue')}
              >
                View Overdue
              </button>
            </div>

            {/* Risks Requiring Review */}
            <div className="rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 flex flex-col items-start min-h-[160px] border border-yellow-200">
              <div className="flex items-center justify-between w-full mb-3">
                <span className="font-semibold text-lg text-gray-900">Needs Review</span>
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold mb-1 text-yellow-600">
                {hasAdminPrivileges 
                  ? (stats as any).pendingReviewRisks || 0
                  : (stats as FacilitatorDashboardStatsWithAdditional).additionalData?.pendingReview || 
                 (stats as FacilitatorDashboardStats).risksRequiringReview?.count || 
                    (stats as any).sharedRisks?.items?.filter((r: any) => r.status === 'Pending').length || 0
                }
              </div>
              <div className="text-gray-600 text-sm mb-4">Risks requiring facilitator review</div>
              <button
                className="bg-white rounded-lg px-4 py-2 font-semibold text-gray-900 border border-yellow-200 mt-auto cursor-pointer hover:bg-yellow-50 transition-colors"
                onClick={() => router.push('/risk-review')}
              >
                Review Now
              </button>
            </div>
          </>
        )}

        {/* My Risks - Only for Organization Users */}
        {roleHelpers.isOrganization() && (
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 flex flex-col items-start min-h-[160px] border border-indigo-200">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="font-semibold text-lg text-gray-900">My Risks</span>
              <Shield className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="text-3xl font-bold mb-1 text-indigo-600">
              {hasAdminPrivileges 
                ? (stats as any).systemOverview?.totalRisks || 0
                : (stats as DashboardStatsWithAdditional).additionalData?.totalRisks || (stats as any).myRisks?.count + (stats as any).sharedRisks?.count || 0
              }
            </div>
            <div className="text-gray-600 text-sm mb-4">Your organization's registered risks</div>
            <button
              className="bg-white rounded-lg px-4 py-2 font-semibold text-gray-900 border border-indigo-200 mt-auto cursor-pointer hover:bg-indigo-50 transition-colors"
              onClick={() => router.push('/my-risks')}
            >
              View My Risks
            </button>
          </div>
        )}

        {/* Shared Risks - Hidden for Facilitators and Admin Users */}
        {!isFacilitator && !hasAdminPrivileges && (
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 flex flex-col items-start min-h-[160px] border border-blue-200">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="font-semibold text-lg text-gray-900">Shared Risks</span>
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-3xl font-bold mb-1 text-blue-600">
              {hasAdminPrivileges ? 0 : (stats as any).sharedRisks?.count || 0}
            </div>
            <div className="text-gray-600 text-sm mb-4">Risks shared across consortiums</div>
            <button
              className="bg-white rounded-lg px-4 py-2 font-semibold text-gray-900 border border-blue-200 mt-auto cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => router.push('/shared-risks')}
            >
              View Shared Risks
            </button>
          </div>
        )}

        {/* Admin Organizations Overview - Only for Admin Users */}
        {hasAdminPrivileges && (
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 flex flex-col items-start min-h-[160px] border border-purple-200">
          <div className="flex items-center justify-between w-full mb-3">
              <span className="font-semibold text-lg text-gray-900">Total Organizations</span>
              <Users className="w-6 h-6 text-purple-500" />
          </div>
          <div className="text-3xl font-bold mb-1 text-purple-600">
              {(stats as any).systemOverview?.totalOrganizations || 0}
          </div>
            <div className="text-gray-600 text-sm mb-4">All organizations in the system</div>
          <button
            className="bg-white rounded-lg px-4 py-2 font-semibold text-gray-900 border border-purple-200 mt-auto cursor-pointer hover:bg-purple-50 transition-colors"
              onClick={() => router.push('/consortium-management')}
          >
              Manage Organizations
          </button>
        </div>
        )}

        {/* Meetings section hidden per user request */}

        {/* Action Items */}
        <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-6 flex flex-col items-start min-h-[160px] border border-green-200">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="font-semibold text-lg text-gray-900">
              {hasAdminPrivileges ? 'Total Action Items' :
               roleHelpers.isOrganization() ? 'Total Action Items' : isFacilitator ? 'Upcoming Meetings' : 'Action Items'}
            </span>
            {hasAdminPrivileges || roleHelpers.isOrganization() || !isFacilitator ? (
            <CheckSquare className="w-6 h-6 text-green-500" />
            ) : (
              <Calendar className="w-6 h-6 text-blue-500" />
            )}
          </div>
          <div className="text-3xl font-bold mb-1 text-green-600">
            {hasAdminPrivileges 
              ? (stats as any).systemOverview?.totalActionItems || 0
              : roleHelpers.isOrganization() 
                ? (stats as DashboardStatsWithAdditional).additionalData?.totalActionItems || (stats as any).pendingActionItems?.count || 0
              : isFacilitator 
                  ? (stats as FacilitatorDashboardStatsWithAdditional).additionalData?.upcomingMeetings || 0
                  : (stats as any).pendingActionItems?.count || 0
            }
          </div>
          <div className="text-gray-600 text-sm mb-4">
            {hasAdminPrivileges 
              ? 'All action items in the system' 
              : roleHelpers.isOrganization() 
              ? 'All consortium action items' 
              : isFacilitator ? 'Meetings scheduled for the future' : 'Pending action items assigned to you'
            }
          </div>
          <button
            className="bg-white rounded-lg px-4 py-2 font-semibold text-gray-900 border border-green-200 mt-auto cursor-pointer hover:bg-green-50 transition-colors"
            onClick={() => router.push(isFacilitator ? '/meetings' : '/action-items')}
          >
            {isFacilitator ? 'View Meetings' : 'View Actions'}
          </button>
        </div>
      </div>

      {/* Role-based Content */}
      {hasAdminPrivileges ? (
        <AdminDashboardContent stats={stats as DashboardStats} />
      ) : isFacilitator ? (
        <FacilitatorDashboardContent stats={stats as FacilitatorDashboardStats} />
      ) : roleHelpers.isOrganization() ? (
        <OrganizationDashboardContent stats={stats as DashboardStats} />
      ) : (
        <UserDashboardContent stats={stats as DashboardStats} userRole={null} />
      )}
    </>
  );
};

// Admin Dashboard Content
const AdminDashboardContent = ({ stats }: { stats: any }) => {
  const router = useRouter();

  // Calculate analytics for admin dashboard
  const totalRisks = stats.systemOverview?.totalRisks || 0;
  const totalUsers = stats.systemOverview?.totalUsers || 0;
  const totalConsortia = stats.systemOverview?.totalConsortia || 0;
  const totalOrganizations = stats.systemOverview?.totalOrganizations || 0;
  const pendingReviewRisks = stats.pendingReviewRisks || 0;
  const highPriorityRisks = stats.highPriorityRisks || 0;
  const triggeredRisks = stats.triggeredRisks || 0;
  const overdueActionItems = stats.overdueActionItems || 0;

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => router.push('/my-risks?action=new')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">Add New Risk</span>
        </button>
        <button
          onClick={() => router.push('/action-items?action=new')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5 text-green-600" />
          <span className="font-medium text-gray-900">Create Action Item</span>
        </button>
        <button
          onClick={() => router.push('/meetings?action=new')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-gray-900">Schedule Meeting</span>
        </button>
        <button
          onClick={() => router.push('/consortium-management')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Settings className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">Manage Consortiums</span>
        </button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Analytics */}
        <div className="rounded-xl border border-gray-200 p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Risk Analytics</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Risks</span>
              <span className="font-semibold text-gray-900">{totalRisks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">High Priority</span>
              <span className="font-semibold text-red-600">{highPriorityRisks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Triggered Risks</span>
              <span className="font-semibold text-orange-600">{triggeredRisks}</span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">High Priority</span>
                <span className="font-medium text-red-600">{highPriorityRisks}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Triggered</span>
                <span className="font-medium text-orange-600">{triggeredRisks}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Pending Review</span>
                <span className="font-medium text-yellow-600">{pendingReviewRisks}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Items Analytics */}
        <div className="rounded-xl border border-gray-200 p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Action Items Analytics</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Action Items</span>
              <span className="font-semibold text-gray-900">{stats.systemOverview?.totalActionItems || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Overdue</span>
              <span className="font-semibold text-red-600">{overdueActionItems}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">{(stats.systemOverview?.totalActionItems || 0) - overdueActionItems}</span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="text-sm text-gray-600 mb-2">Action Item Summary</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Overdue</span>
                  <span className="text-xs font-medium">{overdueActionItems}</span>
                  </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Active</span>
                  <span className="text-xs font-medium">{(stats.systemOverview?.totalActionItems || 0) - overdueActionItems}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="rounded-xl border border-gray-200 p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Users</span>
              <span className="font-semibold text-gray-900">{totalUsers}</span>
              </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Consortia</span>
              <span className="font-semibold text-gray-900">{totalConsortia}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Organizations</span>
              <span className="font-semibold text-gray-900">{totalOrganizations}</span>
            </div>
          </div>
        </div>
      </div>

      {/* High Priority Risks Summary */}
      <div className="rounded-xl border border-gray-200 p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Risk Summary</h3>
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex-1">
              <h4 className="font-medium text-gray-900">High Priority Risks</h4>
                <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-600">Requires immediate attention</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                {highPriorityRisks} risks
                  </span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Triggered Risks</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-600">Active risk events</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">
                {triggeredRisks} risks
                </span>
              </div>
            </div>
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Pending Review</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-600">Awaiting facilitator review</span>
            </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                {pendingReviewRisks} risks
              </span>
            </div>
          </div>
        </div>
        <button
          className="w-full mt-4 bg-red-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-red-700 transition-colors cursor-pointer"
          onClick={() => router.push('/shared-risks')}
        >
          View All Risks
        </button>
      </div>

      {/* Action Items Summary */}
      <div className="rounded-xl border border-gray-200 p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Action Items Summary</h3>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 mb-1">Overdue Action Items</h4>
              <p className="text-sm text-gray-600 mb-2">Action items past their implementation date</p>
            </div>
            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
              <span className="px-3 py-1 text-xs font-medium rounded-full border border-red-200 text-red-700">
                {overdueActionItems} items
                  </span>
                </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 mb-1">Active Action Items</h4>
              <p className="text-sm text-gray-600 mb-2">Action items currently in progress</p>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
              <span className="px-3 py-1 text-xs font-medium rounded-full border border-blue-200 text-blue-700">
                {(stats.systemOverview?.totalActionItems || 0) - overdueActionItems} items
                </span>
              </div>
            </div>
        </div>
        <button
          className="w-full mt-4 bg-gray-900 text-white rounded-lg px-4 py-2 font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
          onClick={() => router.push('/action-items')}
        >
          View All Action Items
        </button>
      </div>


    </div>
  );
};

// Facilitator Dashboard Content
const FacilitatorDashboardContent = ({ stats }: { stats: FacilitatorDashboardStats }) => {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Quick Actions for Facilitators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => router.push('/shared-risks')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Users className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">Review Consortium Risks</span>
        </button>
        <button
          onClick={() => router.push('/meetings?action=new')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-gray-900">Schedule Review Meeting</span>
        </button>
        <button
          onClick={() => router.push('/action-items?action=new')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5 text-green-600" />
          <span className="font-medium text-gray-900">Create Follow-up Action</span>
        </button>
      </div>

      {/* Facilitator Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Overview */}

        {/* Action Items Overview */}
      

        {/* Meeting Overview section hidden per user request */}
      </div>

      {/* Detailed Overviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Priority & Triggered Risks */}
        <div className="rounded-xl border border-gray-200 p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Critical Risks Requiring Attention</h3>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="space-y-3">
            {/* Show high priority risks first */}
            {(stats as FacilitatorDashboardStats).highPriorityRisks?.items.slice(0, 3).map((risk) => (
              <div key={risk._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-red-50 rounded-lg border border-red-100 gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">{risk.title}</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 sm:mt-1">
                    <span className="text-xs text-gray-600">{risk.category}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(risk.status)} w-fit`}>
                      {risk.status}
                    </span>
                    {risk.triggerStatus === 'Triggered' && (
                      <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700 w-fit">
                        Triggered
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <span className={`px-2 py-1 text-xs rounded-full ${getRiskPriority(risk.likelihood, risk.severity).bg} ${getRiskPriority(risk.likelihood, risk.severity).color} whitespace-nowrap`}>
                    {getRiskPriority(risk.likelihood, risk.severity).label}
                  </span>
                  <button 
                    className="p-1.5 sm:p-2 hover:bg-red-200 rounded cursor-pointer transition-colors"
                    title="View risk details"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/shared-risks?id=${risk._id}`);
                    }}
                  >
                    <Eye className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
            {/* Show triggered risks if no high priority risks */}
            {(stats as FacilitatorDashboardStats).highPriorityRisks?.items.length === 0 && 
             (stats as FacilitatorDashboardStats).triggeredRisks?.items.slice(0, 3).map((risk) => (
              <div key={risk._id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-100 gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">{risk.title}</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 sm:mt-1">
                    <span className="text-xs text-gray-600">{risk.category}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(risk.status)} w-fit`}>
                      {risk.status}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700 w-fit">
                      Triggered
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <span className={`px-2 py-1 text-xs rounded-full ${getRiskPriority(risk.likelihood, risk.severity).bg} ${getRiskPriority(risk.likelihood, risk.severity).color} whitespace-nowrap`}>
                    {getRiskPriority(risk.likelihood, risk.severity).label}
                  </span>
                  <button 
                    className="p-1.5 sm:p-2 hover:bg-orange-200 rounded cursor-pointer transition-colors"
                    title="View risk details"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/shared-risks?id=${risk._id}`);
                    }}
                  >
                    <Eye className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
            {((stats as FacilitatorDashboardStats).highPriorityRisks?.items.length === 0 && 
              (stats as FacilitatorDashboardStats).triggeredRisks?.items.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No critical risks found</p>
              </div>
            )}
          </div>
          <button
            className="w-full mt-4 bg-red-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-red-700 transition-colors cursor-pointer"
            onClick={() => router.push('/shared-risks?filter=critical')}
          >
            View All Critical Risks
          </button>
        </div>

                  {/* Upcoming Meetings Details */}
          <div className="rounded-xl border border-gray-200 p-4 sm:p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Upcoming Meetings</h3>
              <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
            </div>
            <div className="space-y-3">
              {/* Show upcoming meetings */}
              {((stats as FacilitatorDashboardStatsWithAdditional).upcomingMeetings?.items?.length || 0) > 0 ? (
                // Show first 3 upcoming meetings
                (stats as FacilitatorDashboardStatsWithAdditional).upcomingMeetings?.items.slice(0, 3).map((meeting: any) => (
                  <div key={meeting._id} className="group flex flex-col sm:flex-row sm:items-start sm:justify-between p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors gap-3 sm:gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base break-words">{meeting.title}</h4>
                      <div className="text-xs sm:text-sm text-gray-600 mb-2 break-words">
                        {meeting.meetingType}
                        {(meeting.location || meeting.meetingLink) && ' • '}
                        {meeting.meetingLink ? (
                          <a 
                            href={meeting.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {meeting.location || 'Virtual'}
                          </a>
                        ) : meeting.location ? (
                          meeting.location
                        ) : (
                          'Location TBD'
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-blue-600 font-medium">
                          {new Date(meeting.date).toLocaleDateString()} at {meeting.startTime}
                        </span>
                        {meeting.meetingType === 'Virtual' && (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded font-medium">
                            Virtual
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 sm:ml-3 flex-shrink-0">
                      <span className="px-3 py-1 text-xs font-medium rounded-full border border-blue-200 text-blue-700 whitespace-nowrap">
                        {meeting.status}
                      </span>
                      <button 
                        className="p-2 hover:bg-blue-200 rounded-lg transition-colors cursor-pointer sm:opacity-0 sm:group-hover:opacity-100"
                        title="View meeting"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/meetings');
                        }}
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                // Show when no upcoming meetings
                <div className="text-center py-6 sm:py-8 text-gray-500">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm sm:text-base">No upcoming meetings scheduled</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>
            <button
              className="w-full mt-4 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm sm:text-base font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
              onClick={() => router.push('/meetings')}
            >
              View All Meetings
            </button>
          </div>
         
        </div>

      {/* Upcoming Meetings section removed per user request */}


    </div>
  );
};

// Organization Dashboard Content
const OrganizationDashboardContent = ({ stats }: { stats: DashboardStats }) => {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Quick Actions for Organization Users */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => router.push('/my-risks?action=new')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5 text-orange-600" />
          <span className="font-medium text-gray-900">Create Risk</span>
        </button>
        <button
          onClick={() => router.push('/resources')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">View Resources</span>
        </button>
        <button
          onClick={() => router.push('/meetings')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Calendar className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-gray-900">View Meetings</span>
        </button>
        <button
          onClick={() => router.push('/action-items')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <CheckSquare className="w-5 h-5 text-green-600" />
          <span className="font-medium text-gray-900">View Action Items</span>
        </button>
      </div>

      {/* Basic Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Meetings Overview */}
        <div className="rounded-xl border border-gray-200 p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Meetings</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {(stats as DashboardStatsWithAdditional).additionalData?.upcomingMeetings ? (
              // Show message when there are upcoming meetings
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">
                  You have {(stats as DashboardStatsWithAdditional).additionalData?.upcomingMeetings} upcoming meetings
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Check your calendar for details
                </p>
                </div>
            ) : (
              // Show message when no upcoming meetings
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No upcoming meetings</p>
                <p className="text-sm text-gray-400 mt-1">
                  You're all caught up!
                </p>
              </div>
            )}
          </div>
          <button
            className="w-full mt-4 bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            onClick={() => router.push('/meetings')}
          >
            View All Meetings
          </button>
        </div>

        {/* Shared Risks Overview */}
        <div className="rounded-xl border border-gray-200 p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Shared Consortium Risks</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats.sharedRisks.items.slice(0, 3).map((risk) => (
              <div key={risk._id} className="group flex items-start justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer border border-transparent hover:border-blue-200">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{risk.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{risk.category}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(risk.status)} transition-colors`}>
                    {risk.status}
                  </span>
                </div>
              </div>
            ))}
            {stats.sharedRisks.items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No shared risks found</p>
              </div>
            )}
          </div>
          <button
            className="w-full mt-4 bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            onClick={() => router.push('/shared-risks')}
          >
            View All Shared Risks
          </button>
        </div>
      </div>

      {/* Action Items Overview */}
      {stats.pendingActionItems.count > 0 && (
        <div className="rounded-xl border border-gray-200 p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">My Action Items</h3>
            <CheckSquare className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats.pendingActionItems.items.slice(0, 5).map((item) => (
              <div key={item._id} className="group flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-gray-200">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1 truncate">{item.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">
                      Due: {new Date(item.implementationDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.status)} transition-colors`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            className="w-full mt-4 bg-green-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-green-700 transition-colors cursor-pointer"
            onClick={() => router.push('/action-items')}
          >
            View All Action Items
          </button>
        </div>
      )}

      {/* Upcoming Meetings section removed per user request */}
    </div>
  );
};

// User Dashboard Content
const UserDashboardContent = ({ stats }: { stats: DashboardStats; userRole: string | null }) => {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* My Recent Risks */}
      <div className="rounded-xl border border-gray-200 p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">My Recent Risks</h3>
          <Shield className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {stats.myRisks.items.slice(0, 3).map((risk) => (
            <div key={risk._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 truncate">{risk.title}</h4>
                <p className="text-sm text-gray-600">{risk.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(risk.status)}`}>
                  {risk.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button
          className="w-full mt-4 bg-gray-900 text-white rounded-lg px-4 py-2 font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
          onClick={() => router.push('/my-risks')}
        >
          View All My Risks
        </button>
      </div>

      {/* My Action Items */}
      <div className="rounded-xl border border-gray-200 p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">My Action Items</h3>
          <CheckSquare className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {stats.pendingActionItems.items.slice(0, 3).map((item) => (
            <div key={item._id} className="group flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-gray-200">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 mb-1 truncate">{item.title}</h4>
                <p className="text-sm text-gray-600 mb-2 leading-relaxed overflow-hidden" style={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>{item.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">
                    Due: {new Date(item.implementationDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.status)} transition-colors`}>
                  {item.status}
                </span>
                <button 
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                  title="More options"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          className="w-full mt-4 bg-gray-900 text-white rounded-lg px-4 py-2 font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
          onClick={() => router.push('/action-items')}
        >
          View All My Actions
        </button>
      </div>
    </div>
  );
};

// Helper functions
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'text-green-700 bg-green-100 border-green-200';
    case 'pending':
      return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    case 'draft':
      return 'text-gray-700 bg-gray-100 border-gray-200';
    case 'at risk':
      return 'text-red-700 bg-red-100 border-red-200 font-semibold';
    case 'in progress':
      return 'text-blue-700 bg-blue-100 border-blue-200';
    case 'complete':
      return 'text-green-700 bg-green-100 border-green-200';
    default:
      return 'text-gray-700 bg-gray-100 border-gray-200';
  }
};

const getRiskPriority = (likelihood: string, severity: string) => {
  const likelihoodNum = parseInt(likelihood);
  const severityNum = parseInt(severity);
  const priority = likelihoodNum * severityNum;
  
  if (priority >= 15) return { color: 'text-red-600', bg: 'bg-red-100', label: 'Critical' };
  if (priority >= 10) return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'High' };
  if (priority >= 6) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Medium' };
  return { color: 'text-green-600', bg: 'bg-green-100', label: 'Low' };
};

const calculateRiskStatusBreakdown = (risks: Array<{ status: string }>) => {
  return risks.reduce((acc, risk) => {
    const status = risk.status.toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { approved: 0, pending: 0, draft: 0 } as Record<string, number>);
};

const calculateRiskCategoryBreakdown = (risks: Array<{ category: string }>) => {
  return risks.reduce((acc, risk) => {
    const category = risk.category.toLowerCase();
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

const calculateActionItemStatusBreakdown = (actionItems: Array<{ status: string }>) => {
  return actionItems.reduce((acc, item) => {
    const status = item.status.toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { draft: 0, 'at risk': 0 } as Record<string, number>);
};

export default DashboardStatsGrid; 