"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRef } from "react";
import SharedRisksHeader, { SharedRisksFilters } from "@/components/shared-risks/SharedRisksHeader";
import SharedRisksTable from "@/components/shared-risks/SharedRisksTable";
import Layout from '@/components/common/Layout';
import Pagination from '@/components/common/Pagination';
import PageSizeSelector from '@/components/common/PageSizeSelector';
import RotatingMessageLoader from '@/components/common/RotatingMessageLoader';
import { risksService, Risk } from '@/lib/api/services/risks';
import { Consortium } from '@/lib/api/services/consortia';
import { Organization } from '@/lib/api/services/organizations';
import { showToast } from '@/lib/utils/toast';
import { fetchConsortiaByRole } from '@/lib/api/services/consortia';
import { useAuth } from '@/lib/auth/AuthContext';
import { fetchOrganizationsByRole } from '@/lib/api/services/organizations';

const initialFilters: SharedRisksFilters = {
  consortium: "",
  category: "",
  organization: "",
  status: "",
  search: "",
};

interface LoadingState {
  risks: boolean;
  consortiums: boolean;
  organizations: boolean;
}

export default function SharedRisksPage() {
  const [filters, setFilters] = useState<SharedRisksFilters>(initialFilters);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    risks: true,
    consortiums: true,
    organizations: true,
  });
  const [consortiums, setConsortiums] = useState<Consortium[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const isInitialLoad = useRef(true);
  const { user } = useAuth();

  const isFullyLoaded = !loadingState.risks && !loadingState.consortiums && !loadingState.organizations;

  const fetchApprovedRisks = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, risks: true }));
    try {
      const response = await risksService.getRisksByStatus('Approved');
      if (response.data?.success && response.data?.data && Array.isArray(response.data.data)) {
        setRisks(response.data.data);
        const uniqueCategories = [...new Set(response.data.data.map(risk => risk.category).filter(Boolean))];
      } else {
        setRisks([]);
        console.warn('No risks data received or invalid format');
      }
    } catch (error) {
      console.error('Error fetching approved risks:', error);
      setRisks([]);
      showToast.error('Failed to load shared risks');
    } finally {
      setLoadingState(prev => ({ ...prev, risks: false }));
    }
  }, []);

  const fetchConsortiums = useCallback(async () => {
    if (!user) {
      setLoadingState(prev => ({ ...prev, consortiums: false }));
      return;
    }
    
    setLoadingState(prev => ({ ...prev, consortiums: true }));
    try {
      const consortia = await fetchConsortiaByRole(user);
      
      if (Array.isArray(consortia)) {
        setConsortiums(consortia);
      } else {
        setConsortiums([]);
        console.warn('Consortiums fetch returned non-array:', consortia);
      }
    } catch (error) {
      console.error('Error fetching consortiums:', error);
      setConsortiums([]);
      showToast.error('Failed to load consortiums');
    } finally {
      setLoadingState(prev => ({ ...prev, consortiums: false }));
    }
  }, [user]);

  const fetchOrganizations = useCallback(async () => {
    if (!user) {
      setLoadingState(prev => ({ ...prev, organizations: false }));
      return;
    }
    
    setLoadingState(prev => ({ ...prev, organizations: true }));
    try {
      const organizations = await fetchOrganizationsByRole(user);
      
      if (Array.isArray(organizations)) {
        setOrganizations(organizations);
      } else {
        setOrganizations([]);
        console.warn('Organizations fetch returned non-array:', organizations);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
      showToast.error('Failed to load organizations');
    } finally {
      setLoadingState(prev => ({ ...prev, organizations: false }));
    }
  }, [user]);

  // Fetch all data on component mount
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        fetchApprovedRisks(),
        fetchConsortiums(),
        fetchOrganizations(),
      ]);
      
      if (isInitialLoad.current) {
        showToast.success('Successfully loaded shared risks');
        isInitialLoad.current = false;
      }
    };

    loadAllData();
  }, [fetchApprovedRisks, fetchConsortiums, fetchOrganizations]);

  // Debug: Log when data is fully loaded
  useEffect(() => {
    if (isFullyLoaded) {
      console.log('All data loaded - Final state:', {
        risks: risks.length,
        consortiums: consortiums.length,
        organizations: organizations.length,
        userRole: user?.role
      });
      
      // Warn if Organization User has no consortiums
      if (user?.role === 'Organization User' && consortiums.length === 0) {
        console.warn('Organization User has no consortiums loaded - this may filter out all risks');
      }
    }
  }, [isFullyLoaded, risks.length, consortiums.length, organizations.length, user?.role]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Filter risks based on current filters
  const filteredRisks = risks.filter(risk => {
    // Search filter
    if (filters.search && !risk.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Category filter - only apply if a specific category is selected
    if (filters.category && filters.category.trim() !== '') {
      // Explicit check for category match (case-insensitive)
      const riskCategory = (risk.category || '').toLowerCase();
      const filterCategory = filters.category.trim().toLowerCase();
      
      if (riskCategory !== filterCategory) {
        console.log('Risk filtered out by category:', { 
          riskTitle: risk.title, 
          riskCategory: risk.category || '', 
          filterCategory: filters.category,
          riskCategoryLower: riskCategory,
          filterCategoryLower: filterCategory
        });
        return false;
      }
    }
    
    // Status filter (triggered vs all risks)
    if (filters.status === 'triggered' && risk.triggerStatus !== 'Triggered') {
      return false;
    }
    
    // Consortium filter - only apply if consortiums have loaded
    if (filters.consortium && filters.consortium.trim() !== '') {
      // Specific consortium selected - filter by that consortium
      const hasConsortium = Array.isArray(risk.consortium) && 
        risk.consortium.some(c => c._id === filters.consortium);
      if (!hasConsortium) {
        return false;
      }
    } else if (consortiums.length > 0) {
      // "All Consortiums" selected AND consortiums have loaded
      // Filter to show only risks from available consortiums
      const availableConsortiumIds = consortiums.map(c => c._id);
      const hasAvailableConsortium = Array.isArray(risk.consortium) && 
        risk.consortium.some(c => availableConsortiumIds.includes(c._id));
      if (!hasAvailableConsortium) {
        return false;
      }
    }
    // If consortiums haven't loaded yet (length === 0), show all risks temporarily
    
    // Organization filter
    if (filters.organization && filters.organization.trim() !== '') {
      const hasOrganization = Array.isArray(risk.organization) && 
        risk.organization.some(org => org._id === filters.organization);
      if (!hasOrganization) {
        return false;
      }
    }
    
    return true;
  });

  // Calculate pagination
  const totalItems = filteredRisks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRisks = filteredRisks.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  return (
    <Layout>
      <div className="space-y-6">
        <SharedRisksHeader 
          filters={filters} 
          onFilterChange={setFilters}
          consortiums={consortiums}
          organizations={organizations}
        />
        
        <div className="bg-white rounded-xl border border-gray-200">
          {!isFullyLoaded ? (
            <RotatingMessageLoader
              title="Loading Shared Risks"
              messages={[
                'Preparing your risk insights…',
                'Analyzing risks across partners…',
                'Strengthening collaboration through risk sharing…',
                'Organizing shared risk data…',
                'Building consortium connections…',
                'Gathering organization details…'
              ]}
            />
          ) : (
            <>
              <SharedRisksTable 
                risks={paginatedRisks} 
                onRiskDeleted={fetchApprovedRisks}
              />
              
              {/* Pagination Controls */}
              {totalItems > 0 && (
                <div className="border-t border-gray-200 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <PageSizeSelector
                      currentSize={itemsPerPage}
                      onSizeChange={handlePageSizeChange}
                      options={[5, 10, 20, 50]}
                    />
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
} 