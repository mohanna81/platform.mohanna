"use client";
import ConsortiumManagementHeader from '@/components/consortium-management/ConsortiumManagementHeader';

import AddOrganizationModal from '@/components/consortium-management/AddOrganizationModal';
import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ConsortiumTabs, { ConsortiumTab } from '@/components/consortium-management/ConsortiumTabs';
import AddOrganizationToConsortium from '@/components/consortium-management/AddOrganizationToConsortium';
import OrganizationList from '@/components/consortium-management/OrganizationList';
import ActiveConsortiumsTable from '@/components/consortium-management/ActiveConsortiumsTable';
import AddConsortiumModal from '@/components/consortium-management/AddConsortiumModal';
import EditOrganizationModal from '@/components/consortium-management/EditOrganizationModal';
import AddUserModal from '@/components/consortium-management/AddUserModal';
import UsersTable from '@/components/consortium-management/UsersTable';
import Layout from '@/components/common/Layout';
import { consortiaService, CreateConsortiumRequest, userService, CreateUserRequest, organizationsService, Organization } from '@/lib/api';
import { showToast } from '@/lib/utils/toast';
import { useAuth } from '@/lib/auth/AuthContext';
import { fetchConsortiaByRole } from '@/lib/api/services/consortia';
import { fetchOrganizationsByRole } from '@/lib/api/services/organizations';

function ConsortiumManagementContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  // Debug: Check localStorage directly
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('localStorage authUserRole:', localStorage.getItem('authUserRole'));
      console.log('localStorage authUser:', localStorage.getItem('authUser'));
    }
  }, []);
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ConsortiumTab>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'Users' || tabParam === 'Organizations' || tabParam === 'Active Consortiums' || tabParam === 'Closed Consortiums') {
      return tabParam as ConsortiumTab;
    }
    return 'Active Consortiums';
  });
  const [showAddConsortiumModal, setShowAddConsortiumModal] = useState(false);
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [consortiumOptions, setConsortiumOptions] = useState<{ value: string; label: string }[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch organizations first
        if (user) {
          const organizations = await fetchOrganizationsByRole(user);
          console.log('ConsortiumManagementPage - Organizations fetched for user:', user.role, organizations);
          const orgOptions = organizations.map((organization: { id?: string; _id?: string; name: string }) => ({
            value: organization.id || organization._id || '',
            label: organization.name,
          }));
          setOrganizationOptions(orgOptions);
          console.log('ConsortiumManagementPage - Organization options set:', orgOptions);
        }

        // Fetch consortia based on user role
        if (user) {
          const consortia = await fetchConsortiaByRole(user);
          console.log('Consortia fetched successfully:', consortia);
          setConsortiumOptions(
            consortia.map((consortium: { id?: string; _id?: string; name: string }) => ({
              value: consortium.id || consortium._id || '',
              label: consortium.name,
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
  }, [refreshKey, user]);

  // Get role options based on current user's role
  const roleOptions = useMemo(() => {
    if (!user) return [];

    const allRoles = [
      { value: 'Super_user', label: 'Super User' },
      { value: 'Admin', label: 'Admin' },
      { value: 'Facilitator', label: 'Facilitator' },
      { value: 'Organization User', label: 'Organization User' },
    ];

    switch (user.role) {
      case 'Super_user':
        // Super user can add all roles
        return allRoles;
      case 'Admin':
        // Admin can add all roles except Super_user
        return allRoles.filter(role => role.value !== 'Super_user');
      case 'Facilitator':
        // Facilitator can only add organization user
        return allRoles.filter(role => role.value === 'Organization User');
      case 'Organization User':
        // Organization user cannot add any users
        return [];
      default:
        return [];
    }
  }, [user]);

  // Check if current user can add users
  // Only Super_user and Admin can add users (Facilitator now has same view as Organization User)
  const canAddUser = useMemo(() => {
    if (!user) return false;
    console.log('Current user role:', user.role);
    console.log('User object:', user);
    const canAdd = user.role === 'Super_user' || user.role === 'Admin';
    console.log('Can add user:', canAdd);
    return canAdd;
  }, [user]);

  // Check if current user can add consortia
  const canAddConsortium = useMemo(() => {
    if (!user) return false;
    const canAdd = user.role === 'Super_user' || user.role === 'Admin';
    console.log('Can add consortium:', canAdd);
    return canAdd;
  }, [user]);

  // Check if current user can add organizations
  const canAddOrganization = useMemo(() => {
    if (!user) return false;
    const canAdd = user.role === 'Super_user' || user.role === 'Admin';
    console.log('Can add organization:', canAdd);
    return canAdd;
  }, [user]);

  const handleOpenAddOrg = () => setShowAddOrgModal(true);
  const handleCloseAddOrg = () => setShowAddOrgModal(false);
  const handleOpenAddConsortium = () => setShowAddConsortiumModal(true);
  const handleCloseAddConsortium = () => setShowAddConsortiumModal(false);
  const handleOpenEditOrg = async (organization: Organization) => {
    // Fetch latest organization data
    const response = await organizationsService.getOrganizationById(organization._id || organization.id);
    if (response.success && response.data) {
      setSelectedOrganization(response.data.data);
      setShowEditOrgModal(true);
    } else {
      showToast.error('Failed to fetch organization data');
    }
  };
  const handleCloseEditOrg = () => {
    setShowEditOrgModal(false);
    setSelectedOrganization(null);
  };
  const handleCreateOrg = async (data: { name: string; description: string; contact_email: string; consortiumIds: string[] }) => {
    try {
      // Validate required fields
      if (!data.name.trim()) {
        showToast.error('Organization name is required');
        return;
      }
      if (!data.contact_email.trim()) {
        showToast.error('Organization email is required');
        return;
      }
      if (!data.consortiumIds || data.consortiumIds.length === 0) {
        showToast.error('At least one consortium is required');
        return;
      }
      
      // Create organization with the first consortium as the primary one
      const organizationData = {
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        contact_email: data.contact_email.trim(),
        consortiumId: data.consortiumIds[0], // Use first consortium as primary
      };
      
      const response = await organizationsService.createOrganization(organizationData);
      if (response.success) {
        // After creating the organization, add it to all selected consortia
        const createdOrganization = response.data?.data;
        if (createdOrganization) {
          let successCount = 0;
          let failureCount = 0;
          
          // Add to all selected consortia
          for (const consortiumId of data.consortiumIds) {
            try {
              const addToConsortiumResponse = await consortiaService.addOrganizationToConsortium({
                organizationId: createdOrganization._id || createdOrganization.id,
                consortiumId: consortiumId,
              });
              
              if (addToConsortiumResponse.success) {
                successCount++;
              } else {
                failureCount++;
                console.error(`Failed to add organization to consortium ${consortiumId}:`, addToConsortiumResponse.error);
              }
            } catch (error) {
              failureCount++;
              console.error(`Error adding organization to consortium ${consortiumId}:`, error);
            }
          }
          
          if (failureCount === 0) {
            showToast.success(`Organization created and added to ${successCount} consortium(s) successfully!`);
          } else if (successCount > 0) {
            showToast.success(`Organization created successfully! Added to ${successCount} consortium(s), failed to add to ${failureCount} consortium(s)`);
          } else {
            showToast.success('Organization created successfully, but failed to add to any consortium');
          }
        } else {
          showToast.success('Organization created successfully, but failed to add to consortium - organization data not found');
        }
        setShowAddOrgModal(false);
        setRefreshKey(prev => prev + 1);
      } else {
        showToast.error(response.error || 'Failed to create organization');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      showToast.error('An unexpected error occurred while creating the organization');
    }
  };
  const handleCreateConsortium = async (data: { name: string; startDate: string; endDate: string; description: string }) => {
    try {
      // Validate required fields
      if (!data.name.trim()) {
        showToast.error('Consortium name is required');
        return;
      }

      if (!data.startDate || !data.endDate) {
        showToast.error('Start date and end date are required');
        return;
      }

      // Validate date range
      if (new Date(data.startDate) >= new Date(data.endDate)) {
        showToast.error('End date must be after start date');
        return;
      }

      const consortiumData: CreateConsortiumRequest = {
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        start_date: data.startDate,
        end_date: data.endDate,
        status: 'Active',
      };

      const response = await consortiaService.createConsortium(consortiumData);
      
      if (response.success) {
        showToast.success('Consortium created successfully!');
        setShowAddConsortiumModal(false);
        // Refresh the consortia list
        setRefreshKey(prev => prev + 1);
      } else {
        showToast.error(response.error || 'Failed to create consortium');
      }
    } catch (error) {
      console.error('Error creating consortium:', error);
      showToast.error('An unexpected error occurred while creating the consortium');
    }
  };
  const handleOpenAddUser = () => {
    if (!canAddUser) {
      showToast.error('You do not have permission to add users');
      return;
    }
    setShowAddUserModal(true);
  };
  const handleCloseAddUser = () => setShowAddUserModal(false);
  const handleEditOrgSubmit = async (data: { name: string; description: string; contact_email: string; consortiumIds: string[] }) => {
    if (!selectedOrganization) {
      showToast.error('No organization selected for editing');
      return;
    }
    try {
      // Validate required fields
      if (!data.name.trim()) {
        showToast.error('Organization name is required');
        return;
      }
      if (!data.contact_email.trim()) {
        showToast.error('Organization email is required');
        return;
      }
      if (!data.consortiumIds || data.consortiumIds.length === 0) {
        showToast.error('At least one consortium is required');
        return;
      }
      
      // Update organization with the first consortium as the primary one
      const organizationData = {
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        contact_email: data.contact_email.trim(),
        consortiumId: data.consortiumIds[0], // Use first consortium as primary
      };
      
      const response = await organizationsService.updateOrganization(
        selectedOrganization._id || selectedOrganization.id,
        organizationData
      );
      if (response.success) {
        // After updating the organization, ensure it's added to all selected consortia
        let successCount = 0;
        let failureCount = 0;
        
        // Add to all selected consortia
        for (const consortiumId of data.consortiumIds) {
          try {
            const addToConsortiumResponse = await consortiaService.addOrganizationToConsortium({
              organizationId: selectedOrganization._id || selectedOrganization.id,
              consortiumId: consortiumId,
            });
            
            if (addToConsortiumResponse.success) {
              successCount++;
            } else {
              failureCount++;
              console.error(`Failed to add organization to consortium ${consortiumId}:`, addToConsortiumResponse.error);
            }
          } catch (error) {
            failureCount++;
            console.error(`Error adding organization to consortium ${consortiumId}:`, error);
          }
        }
        
        if (failureCount === 0) {
          showToast.success(`Organization updated and added to ${successCount} consortium(s) successfully!`);
        } else if (successCount > 0) {
          showToast.success(`Organization updated successfully! Added to ${successCount} consortium(s), failed to add to ${failureCount} consortium(s)`);
        } else {
          showToast.success('Organization updated successfully, but failed to add to any consortium');
        }
        setShowEditOrgModal(false);
        setSelectedOrganization(null);
        setRefreshKey(prev => prev + 1);
      } else {
        showToast.error(response.error || 'Failed to update organization');
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      showToast.error('An unexpected error occurred while updating the organization');
    }
  };
  const handleAddUserSubmit = async (data: { name: string; email: string; password: string; role: string; organizations: string[]; consortia: string[] }) => {
    try {
      // Validate password
      if (!data.password.trim()) {
        showToast.error('Password is required');
        return;
      }
      
      // Validate that at least one organization and consortium is selected
      if (!data.organizations || data.organizations.length === 0) {
        showToast.error('At least one organization is required');
        return;
      }
      
      if (!data.consortia || data.consortia.length === 0) {
        showToast.error('At least one consortium is required');
        return;
      }
      
      // Map AddUserModal data to CreateUserRequest
      const userData: CreateUserRequest = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        organizations: data.organizations,
        consortia: data.consortia,
      };
      const response = await userService.createUser(userData);
      if (response.success) {
        showToast.success('User created successfully!');
        setShowAddUserModal(false);
        setRefreshKey(prev => prev + 1); // Optionally refresh user/org list
      } else {
        showToast.error(response.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showToast.error('An unexpected error occurred while creating the user');
    }
  };

  return (
    <Layout>
    <div className="p-4 sm:p-8 md:p-12">
      <ConsortiumManagementHeader onNewConsortium={handleOpenAddConsortium} onNewOrganization={handleOpenAddOrg} onNewUser={handleOpenAddUser} canAddUser={canAddUser} canAddConsortium={canAddConsortium} canAddOrganization={canAddOrganization} />
      <ConsortiumTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'Active Consortiums' && <ActiveConsortiumsTable key={refreshKey} refreshKey={refreshKey} />}
      {activeTab === 'Organizations' && (
        <>
          <AddOrganizationToConsortium 
            refreshKey={refreshKey} 
            onSuccess={() => setRefreshKey(prev => prev + 1)} 
          />
          <OrganizationList onEdit={handleOpenEditOrg} refreshKey={refreshKey} />
        </>
      )}
      {activeTab === 'Users' && <UsersTable key={refreshKey} refreshKey={refreshKey} />}
      <AddOrganizationModal 
        isOpen={showAddOrgModal} 
        onClose={handleCloseAddOrg} 
        onSubmit={handleCreateOrg} 
        consortiumOptions={consortiumOptions}
      />
      <AddConsortiumModal isOpen={showAddConsortiumModal} onClose={handleCloseAddConsortium} onSubmit={handleCreateConsortium} />
      <EditOrganizationModal
        isOpen={showEditOrgModal}
        onClose={handleCloseEditOrg}
        onSubmit={handleEditOrgSubmit}
        initialData={selectedOrganization ? {
          name: selectedOrganization.name,
          contact_email: selectedOrganization.contact_email || selectedOrganization.email || '',
          description: selectedOrganization.description || '',
          consortiumIds: Array.isArray(selectedOrganization.consortia) && selectedOrganization.consortia.length > 0
            ? selectedOrganization.consortia.map(consortium => consortium._id || consortium.id || '').filter(Boolean)
            : [],
        } : {
          name: '',
          contact_email: '',
          description: '',
          consortiumIds: [],
        }}
        consortiumOptions={consortiumOptions}
      />
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={handleCloseAddUser}
        onSubmit={handleAddUserSubmit}
        roleOptions={roleOptions}
        organizationOptions={organizationOptions}
        consortiumOptions={consortiumOptions}
      />
    </div>
    </Layout>
  );
}

export default function ConsortiumManagementPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConsortiumManagementContent />
    </Suspense>
  );
} 