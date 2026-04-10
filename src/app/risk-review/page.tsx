"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRef } from "react";
import Layout from '@/components/common/Layout';
import Dropdown from '@/components/common/Dropdown';
import InputField from '@/components/common/InputField';
import EditRiskModal from '@/components/risk-review/EditRiskModal';
import ChangeRiskStatusModal from '@/components/risk-review/ChangeRiskStatusModal';
import RiskCard from '@/components/risk-review/RiskCard';
import { risksService, Risk as BaseRisk } from '@/lib/api/services/risks';
import { fetchConsortiaByRole } from '@/lib/api/services/consortia';
import { fetchOrganizationsByRole, organizationsService } from '@/lib/api/services/organizations';
import { showToast } from '@/lib/utils/toast';
import { useAuth } from '@/lib/auth/AuthContext';
import { getRoleLevel } from '@/lib/utils/roleHierarchy';
import RotatingMessageLoader from '@/components/common/RotatingMessageLoader';
import AccessRestricted from '@/components/risk-review/AccessRestricted';

// Extend Risk type to include additional fields
interface Risk extends BaseRisk {
  preventiveMeasures?: string;
  reactiveMeasures?: string;
  triggerStatus?: string;
}

const CONSORTIUMS = [
  { value: '', label: 'All Consortiums' },
  { value: 'health', label: 'Health Consortium' },
];
const STATUSES = [
  { value: '', label: 'All' },
  { value: 'operational', label: 'Operational' },
];

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'safety', label: 'Safety' },
  { value: 'security', label: 'Security' },
  { value: 'fiduciary', label: 'Fiduciary' },
  { value: 'legal_compliance', label: 'Legal / Compliance' },
  { value: 'operational', label: 'Operational' },
  { value: 'reputational', label: 'Reputational' },
  { value: 'information', label: 'Information' },
  { value: 'ethical', label: 'Ethical' },
];

const STATUS_OPTIONS = [
  { value: 'Approved', label: 'Approve' },
  { value: 'Rejected', label: 'Reject' },
  { value: 'Pending', label: 'Mark as Pending' },
  { value: 'Closed', label: 'Close Risk' },
];

export default function RiskReviewPage() {
  const { user } = useAuth();
  
  const [allPendingRisks, setAllPendingRisks] = useState<Risk[]>([]);
  const [allApprovedRisks, setAllApprovedRisks] = useState<Risk[]>([]);
  const [allRejectedRisks, setAllRejectedRisks] = useState<Risk[]>([]);
  const [activeTab, setActiveTab] = useState('Pending Review');
  const [consortium, setConsortium] = useState(CONSORTIUMS[0].value);
  const [status, setStatus] = useState(STATUSES[0].value);
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [organization, setOrganization] = useState('');
  const [search, setSearch] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [loadingState, setLoadingState] = useState({
    pendingRisks: true,
    approvedRisks: true,
    rejectedRisks: true,
    consortia: true,
    organizations: true,
  });
  const [selectedRiskId, setSelectedRiskId] = useState<string>('');
  const [selectedRiskForStatus, setSelectedRiskForStatus] = useState<string>('');
  const [organizations, setOrganizations] = useState<Array<{ value: string; label: string }>>([]);
  const [consortia, setConsortia] = useState<Array<{ value: string; label: string }>>([]);
  const [organizationNamesCache, setOrganizationNamesCache] = useState<Record<string, string>>({});
  const isInitialLoad = useRef(true);
  
  const isFullyLoaded = !loadingState.pendingRisks && !loadingState.approvedRisks && !loadingState.rejectedRisks && !loadingState.consortia && !loadingState.organizations;
  
  // Check if user has access to risk review (Facilitator level or higher)
  const hasRiskReviewAccess = user && getRoleLevel(user.role) >= 2;
  
  // Check if user is Admin or Super user (they should see everything)
  const isAdminOrSuper = user && (user.role === 'Admin' || user.role === 'Super_user');
  
  // Filter function to apply all filters
  const filterRisks = useCallback((risks: Risk[]) => {
    return risks.filter(risk => {
      // Admins and Super users can see all risks regardless of consortium/organization restrictions
      if (isAdminOrSuper) {
        // Only apply consortium filter if a specific consortium is selected
        if (consortium && consortium !== '') {
          const riskConsortiumIds = Array.isArray(risk.consortium) 
            ? risk.consortium.map(c => typeof c === 'object' ? c._id : c)
            : [];
          if (riskConsortiumIds.length === 0) {
            return false;
          }
          if (!riskConsortiumIds.includes(consortium)) {
            return false;
          }
        }
        // Skip organization filter for Admins and Super users
      } else {
        // Regular users (Facilitator, Organization User) - apply consortium restrictions
        if (consortium && consortium !== '') {
          // Specific consortium selected - filter by that consortium
          const riskConsortiumIds = Array.isArray(risk.consortium) 
            ? risk.consortium.map(c => typeof c === 'object' ? c._id : c)
            : [];
          // If risk has no consortium data and we're filtering by a specific consortium, exclude it
          if (riskConsortiumIds.length === 0) {
            return false;
          }
          if (!riskConsortiumIds.includes(consortium)) {
            return false;
          }
        } else {
          // "All Consortiums" selected - filter to show only risks from available consortiums
          // Only apply if consortia have loaded
          if (consortia.length > 1) { // > 1 because we always have "All Consortiums" option
            const availableConsortiumIds = consortia
              .filter(c => c.value !== '') // Exclude the "All Consortiums" option
              .map(c => c.value);
            const riskConsortiumIds = Array.isArray(risk.consortium) 
              ? risk.consortium.map(c => typeof c === 'object' ? c._id : c)
              : [];
            const hasAvailableConsortium = riskConsortiumIds.some(id => 
              availableConsortiumIds.includes(id)
            );
            if (!hasAvailableConsortium) {
              return false;
            }
          }
          // If consortia haven't loaded yet, show all risks temporarily
        }
      }

      // Filter by category
      if (category && category !== '') {
        if (risk.category !== category) {
          return false;
        }
      }

      // Filter by organization (skip for Admins and Super users)
      if (!isAdminOrSuper && organization && organization !== '') {
        // Check if risk has the selected organization in orgRoles
        const hasOrganization = risk.orgRoles?.some(orgRole => {
          // Add defensive checks for orgRole structure
          if (!orgRole || typeof orgRole !== 'object') return false;
          if (!orgRole.organization || typeof orgRole.organization !== 'object') return false;
          return orgRole.organization._id === organization;
        });
        if (!hasOrganization) {
          return false;
        }
      }

      // Filter by search
      if (search && search.trim() !== '') {
        const searchLower = search.toLowerCase();
        const searchableFields = [
          risk.title,
          risk.statement,
          risk.category,
          risk.triggerIndicator,
          risk.mitigationMeasures,
          risk.preventiveMeasures,
          risk.reactiveMeasures,
          // Search in consortium names
          Array.isArray(risk.consortium) 
            ? risk.consortium.map(c => typeof c === 'object' ? c.name : c).join(' ')
            : '',
          // Search in organization names - with defensive checks
          risk.orgRoles?.map(orgRole => {
            if (!orgRole || typeof orgRole !== 'object') return '';
            if (!orgRole.organization || typeof orgRole.organization !== 'object') return '';
            return orgRole.organization.name || '';
          }).join(' ') || ''
        ];
        
        const hasMatch = searchableFields.some(field => 
          field && field.toLowerCase().includes(searchLower)
        );
        if (!hasMatch) {
          return false;
        }
      }

      return true;
    });
  }, [consortium, category, organization, search, isAdminOrSuper, consortia]);

  // Apply filters to all risk arrays
  const pendingRisks = useMemo(() => filterRisks(allPendingRisks), [allPendingRisks, filterRisks]);
  const approvedRisks = useMemo(() => filterRisks(allApprovedRisks), [allApprovedRisks, filterRisks]);
  const rejectedRisks = useMemo(() => filterRisks(allRejectedRisks), [allRejectedRisks, filterRisks]);

  // Fetch organizations and consortia based on user role
  const fetchFilterData = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, consortia: true, organizations: true }));
    try {
      
      // Fetch organizations
      const orgsData = await fetchOrganizationsByRole(user);
      const orgOptions = [
        { value: '', label: 'All Organizations' },
        ...orgsData.map(org => ({
          value: org._id || org.id || '',
          label: org.name || 'Unknown Organization'
        }))
      ];
      setOrganizations(orgOptions);
      setLoadingState(prev => ({ ...prev, organizations: false }));

      // Fetch consortia
      const consortiaData = await fetchConsortiaByRole(user);
      const consortiaOptions = [
        { value: '', label: 'All Consortiums' },
        ...consortiaData.map(consortium => ({
          value: consortium._id || consortium.id || '',
          label: consortium.name || 'Unknown Consortium'
        }))
      ];
      setConsortia(consortiaOptions);
      setLoadingState(prev => ({ ...prev, consortia: false }));
    } catch (error) {
      console.error('Error fetching filter data:', error);
      setOrganizations([{ value: '', label: 'All Organizations' }]);
      setConsortia([{ value: '', label: 'All Consortiums' }]);
      showToast.error('Failed to load filter options');
      setLoadingState(prev => ({ ...prev, consortia: false, organizations: false }));
    }
  }, [user, isAdminOrSuper]);

  useEffect(() => {
    if (user) {
      fetchFilterData();
    }
  }, [user, fetchFilterData]);

  // Fetch organization names for all risks when they load
  useEffect(() => {
    const fetchAllOrganizationNames = async () => {
      const allRisks = [...allPendingRisks, ...allApprovedRisks, ...allRejectedRisks];
      const orgIdsToFetch = new Set<string>();
      
      // Collect all unique organization IDs from risk creators
      allRisks.forEach(risk => {
        if (risk.createdBy?.organizations) {
          risk.createdBy.organizations.forEach(orgId => {
            if (!organizationNamesCache[orgId]) {
              orgIdsToFetch.add(orgId);
            }
          });
        }
      });
      
      // Fetch organization names for uncached IDs
      for (const orgId of orgIdsToFetch) {
        try {
          const response = await organizationsService.getOrganizationById(orgId);
          if (response?.data?.data?.name) {
            setOrganizationNamesCache(prev => ({ ...prev, [orgId]: response.data!.data!.name }));
          }
        } catch (error) {
          console.error(`Error fetching organization name for ID ${orgId}:`, error);
        }
      }
    };
    
    if (allPendingRisks.length > 0 || allApprovedRisks.length > 0 || allRejectedRisks.length > 0) {
      fetchAllOrganizationNames();
    }
  }, [allPendingRisks, allApprovedRisks, allRejectedRisks, organizationNamesCache]);

  // Dynamically set tab counts
  const tabCounts = {
    'Pending Review': pendingRisks.length,
    'Approved': approvedRisks.length,
    'Rejected': rejectedRisks.length,
  };

  const TABS = [
    { label: 'Pending Review', count: tabCounts['Pending Review'] },
    { label: 'Approved', count: tabCounts['Approved'] },
    { label: 'Rejected', count: tabCounts['Rejected'] },
  ];

  const handleToggleTrigger = async (riskId: string, isCurrentlyTriggered: boolean) => {
    const newStatus = isCurrentlyTriggered ? 'Not Triggered' : 'Triggered';
    try {
      await risksService.updateRisk(riskId, { triggerStatus: newStatus } as unknown as Partial<Risk>);
      showToast.success(`Risk ${newStatus.toLowerCase()} successfully`);
      refetchAllRisks();
    } catch (error) {
      console.error('Error toggling trigger status:', error);
      showToast.error('Failed to update trigger status');
    }
  };

  // Refetch all risks for all tabs
  const refetchAllRisks = () => {
    setLoadingState(prev => ({ ...prev, pendingRisks: true, approvedRisks: true, rejectedRisks: true }));
    Promise.all([
      risksService.getRisksByStatus('Pending'),
      risksService.getRisksByStatus('Approved'),
      risksService.getRisksByStatus('Rejected'),
    ]).then(([pendingRes, approvedRes, rejectedRes]) => {
      if (pendingRes.data?.success && pendingRes.data?.data && Array.isArray(pendingRes.data.data)) {
        setAllPendingRisks(pendingRes.data.data);
      } else {
        setAllPendingRisks([]);
      }
      setLoadingState(prev => ({ ...prev, pendingRisks: false }));
      
      if (approvedRes.data?.success && approvedRes.data?.data && Array.isArray(approvedRes.data.data)) {
        setAllApprovedRisks(approvedRes.data.data);
      } else {
        setAllApprovedRisks([]);
      }
      setLoadingState(prev => ({ ...prev, approvedRisks: false }));
      
      if (rejectedRes.data?.success && rejectedRes.data?.data && Array.isArray(rejectedRes.data.data)) {
        setAllRejectedRisks(rejectedRes.data.data);
      } else {
        setAllRejectedRisks([]);
      }
      setLoadingState(prev => ({ ...prev, rejectedRisks: false }));
    }).catch((error) => {
      console.error('Error fetching risks:', error);
      setAllPendingRisks([]);
      setAllApprovedRisks([]);
      setAllRejectedRisks([]);
      showToast.error('Failed to refresh risks data');
      setLoadingState(prev => ({ ...prev, pendingRisks: false, approvedRisks: false, rejectedRisks: false }));
    });
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoadingState(prev => ({ ...prev, pendingRisks: true, approvedRisks: true, rejectedRisks: true }));
      
      try {
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          risksService.getRisksByStatus('Pending'),
          risksService.getRisksByStatus('Approved'),
          risksService.getRisksByStatus('Rejected'),
        ]);
        
        if (pendingRes.data?.success && pendingRes.data?.data && Array.isArray(pendingRes.data.data)) {
          setAllPendingRisks(pendingRes.data.data);
        } else {
          setAllPendingRisks([]);
        }
        setLoadingState(prev => ({ ...prev, pendingRisks: false }));
        
        if (approvedRes.data?.success && approvedRes.data?.data && Array.isArray(approvedRes.data.data)) {
          setAllApprovedRisks(approvedRes.data.data);
        } else {
          setAllApprovedRisks([]);
        }
        setLoadingState(prev => ({ ...prev, approvedRisks: false }));
        
        if (rejectedRes.data?.success && rejectedRes.data?.data && Array.isArray(rejectedRes.data.data)) {
          setAllRejectedRisks(rejectedRes.data.data);
        } else {
          setAllRejectedRisks([]);
        }
        setLoadingState(prev => ({ ...prev, rejectedRisks: false }));
        
        if (isInitialLoad.current) {
          showToast.success('Risk review data loaded successfully');
          isInitialLoad.current = false;
        }
      } catch (error) {
        console.error('Error fetching risks:', error);
        setAllPendingRisks([]);
        setAllApprovedRisks([]);
        setAllRejectedRisks([]);
        showToast.error('Failed to load risk review data');
        setLoadingState(prev => ({ ...prev, pendingRisks: false, approvedRisks: false, rejectedRisks: false }));
      }
    };
    
    loadAllData();
  }, []);

  const handleEditRisk = (riskId: string) => {
    setSelectedRiskId(riskId);
    setEditModalOpen(true);
  };

  const handleChangeStatus = (riskId: string) => {
    setSelectedRiskForStatus(riskId);
    setStatusModalOpen(true);
  };

  // Helper function to render consortium names
  const renderConsortiumNames = (consortium: unknown) => {
    if (!Array.isArray(consortium)) return '';
    return consortium.map((c: { name?: string } | string) => 
      typeof c === 'object' && c !== null && 'name' in c ? c.name : String(c)
    ).join(', ');
  };



  // Helper function to render organization names from the risk creator
  // This shows the organization(s) that the risk creator belongs to
  const renderOrganizationNames = (risk: Risk) => {
    if (!risk.createdBy?.organizations || !Array.isArray(risk.createdBy.organizations) || risk.createdBy.organizations.length === 0) {
      return 'No Organization';
    }
    
    
    // Get organization IDs from the risk creator
    const organizationIds = risk.createdBy.organizations;
    
    // Use cached names if available, otherwise show IDs temporarily
    const displayNames = organizationIds.map(orgId => organizationNamesCache[orgId] || orgId);
    
    if (organizationIds.length === 1) {
      return displayNames[0];
    } else {
      return displayNames.join(', ');
    }
    
    // TODO: In the future, fetch organization names by ID to show actual names instead of IDs
    // This would require an API call to get organization details or storing organization names in the risk data
  };



  // If user doesn't have access, show access restricted component
  if (!hasRiskReviewAccess) {
    return (
      <Layout>
        <AccessRestricted />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen px-2 sm:px-3 md:px-4 max-w-screen-xl mx-auto py-6">
        {/* Header and Filters Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 w-full">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-black flex-shrink-0">Risk Review</h1>
            {isAdminOrSuper && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                </svg>
                <span className="font-medium">Admin Access - Viewing all risks across all consortiums and organizations</span>
              </div>
            )}
          </div>
          <div className="flex flex-row flex-wrap gap-2 md:gap-3 w-full md:w-auto md:justify-end items-center">
            <Dropdown options={consortia} value={consortium} onChange={setConsortium} size="md" className="min-w-[160px] md:min-w-[180px] bg-white" />
            <Dropdown options={CATEGORIES} value={category} onChange={setCategory} size="md" className="min-w-[140px] md:min-w-[160px] bg-white" />
            <Dropdown options={STATUSES} value={status} onChange={setStatus} size="md" className="min-w-[100px] md:min-w-[120px] bg-white" />
            <Dropdown options={organizations} value={organization} onChange={setOrganization} size="md" className="min-w-[160px] md:min-w-[180px] bg-white" />
            <div className="relative w-full md:w-[220px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6z"/></svg>
              </span>
              <InputField
                placeholder="Search risks..."
                value={search}
                onChange={setSearch}
                size="md"
                className="w-full pl-10 bg-white"
              />
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="w-full overflow-x-auto mb-6">
          <div className="flex flex-nowrap gap-2 rounded-lg bg-gray-100 p-1">
            {TABS.map(tab => (
              <button
                key={tab.label}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm sm:text-base transition-colors duration-150 focus:outline-none text-center cursor-pointer whitespace-nowrap ${
                  activeTab === tab.label
                    ? 'bg-white text-[#0b1320] shadow border border-gray-200 z-10'
                    : 'text-[#7b849b] hover:bg-white'
                }`}
                onClick={() => setActiveTab(tab.label)}
                type="button"
              >
                {tab.label}
                {isFullyLoaded && (
                  <span className="ml-1 bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        {/* Risk Cards */}
        {!isFullyLoaded ? (
          <RotatingMessageLoader
            title="Loading Risk Review"
            messages={[
              'Preparing your risk insights…',
              'Analyzing risks across partners…',
              'Strengthening collaboration through risk sharing…',
              'Organizing risk review data…',
              'Gathering consortium information…',
              'Loading organization data…'
            ]}
          />
        ) : (
          <div className="space-y-4">
            {activeTab === 'Pending Review' && (
            pendingRisks.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl min-h-[200px] flex flex-col items-center justify-center text-gray-500">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium">No pending risks found</p>
                  <p className="text-sm text-gray-400">All risks have been reviewed</p>
                </div>
              ) : (
                pendingRisks.map((risk) => (
                  <RiskCard
                    key={risk._id}
                    risk={risk}
                    status="pending"
                    onToggleTrigger={handleToggleTrigger}
                    onEditRisk={handleEditRisk}
                    onChangeStatus={handleChangeStatus}
                    renderConsortiumNames={renderConsortiumNames}
                    renderOrganizationNames={renderOrganizationNames}
                    organizationNamesCache={organizationNamesCache}
                  />
                ))
          )
        )}
        {activeTab === 'Approved' && (
              approvedRisks.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl min-h-[200px] flex flex-col items-center justify-center text-gray-500">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg font-medium">No approved risks found</p>
                  <p className="text-sm text-gray-400">No risks have been approved yet</p>
            </div>
          ) : (
                approvedRisks.map((risk) => (
                  <RiskCard
                    key={risk._id}
                    risk={risk}
                    status="approved"
                    onToggleTrigger={handleToggleTrigger}
                    onEditRisk={handleEditRisk}
                    onChangeStatus={handleChangeStatus}
                    renderConsortiumNames={renderConsortiumNames}
                    renderOrganizationNames={renderOrganizationNames}
                    organizationNamesCache={organizationNamesCache}
                  />
                ))
          )
        )}
        {activeTab === 'Rejected' && (
              rejectedRisks.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl min-h-[200px] flex flex-col items-center justify-center text-gray-500">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg font-medium">No rejected risks found</p>
                  <p className="text-sm text-gray-400">No risks have been rejected</p>
            </div>
          ) : (
                rejectedRisks.map((risk) => (
                  <RiskCard
                    key={risk._id}
                    risk={risk}
                    status="rejected"
                    onToggleTrigger={handleToggleTrigger}
                    onEditRisk={handleEditRisk}
                    onChangeStatus={handleChangeStatus}
                    renderConsortiumNames={renderConsortiumNames}
                    renderOrganizationNames={renderOrganizationNames}
                    organizationNamesCache={organizationNamesCache}
                  />
                ))
              )
                          )}
                        </div>
        )}

        <EditRiskModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedRiskId('');
          }}
          onSubmit={() => setEditModalOpen(false)}
          riskId={selectedRiskId}
          onUpdated={refetchAllRisks}
        />
        <ChangeRiskStatusModal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          onSubmit={() => setStatusModalOpen(false)}
          riskId={selectedRiskForStatus}
          statusOptions={STATUS_OPTIONS}
          onUpdated={refetchAllRisks}
        />
      </div>
    </Layout>
  );
} 