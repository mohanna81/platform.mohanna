"use client";
import React, { useState, useCallback } from "react";
import ActionItemsTabs from "@/components/action-items/ActionItemsTabs";
import ActionItemCard from "@/components/action-items/ActionItemCard";
import ActionItemsHeader from "@/components/action-items/ActionItemsHeader";
import AssignActionModal from "@/components/action-items/AssignActionModal";
import Layout from "@/components/common/Layout";
import { actionItemsService } from '@/lib/api/services/actionitems';
import { showToast } from '@/lib/utils/toast';
import type { AssignActionFormData } from '@/components/action-items/AssignActionModal';
import type { CreateActionItemRequest } from '@/lib/api/services/actionitems';
import type { ActionItem } from '@/lib/api/services/actionitems';
import { Loader } from "@/components/common";
import DataLoadingProgress from '@/components/common/DataLoadingProgress';
import EditActionModal, { EditActionFormData } from '@/components/action-items/EditActionModal';
import { authStorage, roleHelpers } from '@/lib/utils/authStorage';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { USER_ROLES } from '@/lib/utils/authStorage';
import { userService, User } from '@/lib/api/services/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import { fetchConsortiaByRole, Consortium } from '@/lib/api/services/consortia';
import { fetchOrganizationsByRole, Organization, organizationsService } from '@/lib/api/services/organizations';
import type { UpdateActionItemRequest } from '@/lib/api/services/actionitems';


export default function ActionItemsPage() {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loadingState, setLoadingState] = useState({
    actionItems: true,
    userConsortia: true,
    consortia: true,
    organizations: true,
  });
  const [userConsortia, setUserConsortia] = useState<string[]>([]);
  const { user, loading: authLoading } = useAuth();
  
  const isFullyLoaded = !loadingState.actionItems && !loadingState.userConsortia && !loadingState.consortia && !loadingState.organizations;
  
  // Helper function to check if an item should be marked as "At Risk"
  const shouldBeAtRisk = (item: ActionItem): boolean => {
    if (item.status === 'Complete') return false;
    if (!item.implementationDate) return false;
    
    const today = new Date();
    const deadline = new Date(item.implementationDate);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Mark as "At Risk" if exactly 2 days before deadline and currently "In Progress"
    return item.status === 'In Progress' && diffDays === 2;
  };

  // Helper function to check if an item is overdue (past implementation date)
  const isOverdue = (item: ActionItem): boolean => {
    if (item.status === 'Complete') return false;
    if (!item.implementationDate) return false;
    
    const today = new Date();
    const deadline = new Date(item.implementationDate);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Item is overdue if it's past the implementation date
    return diffDays < 0;
  };

  // Function to update action items that should be marked as "At Risk"
  const updateAtRiskItems = useCallback(async (items: ActionItem[]) => {
    // Items that are exactly 2 days before deadline
    const itemsToUpdate = items.filter(shouldBeAtRisk);
    // Items that are overdue (past implementation date)
    const overdueItems = items.filter(isOverdue);
    
    const allItemsToUpdate = [...itemsToUpdate, ...overdueItems];
    
    if (allItemsToUpdate.length === 0) {
      return false;
    }
    
    // OPTIMIZATION: Update all items in parallel instead of sequentially
    const updatePromises = allItemsToUpdate.map(item => 
      actionItemsService.updateActionItem(item._id, {
        status: 'At Risk'
      }).then(() => {
        console.log(`Updated action item "${item.title}" to At Risk status`);
        return true;
      }).catch(error => {
        console.error(`Failed to update action item ${item._id} to At Risk:`, error);
        return false;
      })
    );
    
    try {
      await Promise.all(updatePromises);
      console.log(`Updated ${allItemsToUpdate.length} action items to At Risk status`);
      return true;
    } catch (error) {
      console.error('Error updating at-risk items:', error);
      return false;
    }
  }, []);

  // Function to fetch user's consortium IDs
  const fetchUserConsortia = useCallback(async () => {
    if (!user?.id) {
      setUserConsortia([]);
      setLoadingState(prev => ({ ...prev, userConsortia: false }));
      return;
    }
    
    setLoadingState(prev => ({ ...prev, userConsortia: true }));
    try {
      const userProfile = await userService.getUserById(user.id);
      if (userProfile.success && userProfile.data) {
        const userData = userProfile.data as { consortia?: string[]; user?: { consortia?: string[] } };
        const userConsortia = userData.consortia || userData.user?.consortia || [];
        setUserConsortia(userConsortia);
        console.log('User consortiums fetched:', userConsortia);
      } else {
        console.warn('Failed to fetch user consortiums:', userProfile);
        setUserConsortia([]);
      }
    } catch (error) {
      console.error('Error fetching user consortiums:', error);
      setUserConsortia([]);
      showToast.error('Failed to load user consortium data');
    } finally {
      setLoadingState(prev => ({ ...prev, userConsortia: false }));
    }
  }, [user?.id]);

  const fetchActionItems = useCallback(async () => {
    if (loadingState.userConsortia) {
      return;
    }

    setLoadingState(prev => ({ ...prev, actionItems: true }));
    try {
      const res = await actionItemsService.getActionItems();
      
      if (res.success && res.data?.data) {
        let filteredItems = res.data.data;
        
        // OPTIMIZATION: Update at-risk items in parallel, then update state directly
        // instead of fetching again
        const itemsToCheck = [...filteredItems];
        const needsRefresh = await updateAtRiskItems(itemsToCheck);
        
        // If items were updated, update the status in-memory instead of re-fetching
        if (needsRefresh) {
          filteredItems = filteredItems.map(item => {
            if ((shouldBeAtRisk(item) || isOverdue(item)) && item.status !== 'Complete') {
              return { ...item, status: 'At Risk' as const };
            }
            return item;
          });
        }
        
        // Apply client-side filtering for non-admin users
        if (!roleHelpers.hasAdminPrivileges()) {
          filteredItems = filterActionItemsByUser(filteredItems, user, userConsortia);
        }
        
        setActionItems(filteredItems);
      } else {
        setActionItems([]);
      }
    } catch (error) {
      console.error('Error fetching action items:', error);
      setActionItems([]);
      showToast.error('Failed to load action items');
    } finally {
      setLoadingState(prev => ({ ...prev, actionItems: false }));
    }
  }, [user, userConsortia, updateAtRiskItems, loadingState.userConsortia]);

  // Client-side filtering function for action items (memoized)
  const filterActionItemsByUser = useCallback((items: ActionItem[], currentUser: { id?: string; _id?: string; role?: string; organizationId?: string } | null, userConsortiaIds: string[]): ActionItem[] => {
    if (!currentUser || roleHelpers.hasAdminPrivileges()) {
      return items;
    }

    const userId = currentUser.id || currentUser._id;
    const userRole = currentUser.role;
    const userOrganizationId = currentUser.organizationId;

    if (!userId) {
      return [];
    }

    return items.filter(item => {
      // For facilitators, only show action items from their consortium
      if (userRole === USER_ROLES.Facilitator) {
        // Check if the action item's consortium is in the user's consortium list
        if (Array.isArray(item.consortium)) {
          const itemConsortiumIds = item.consortium.map((c) => 
            typeof c === 'object' && c !== null ? c._id : c
          );
          return itemConsortiumIds.some(consortiumId => userConsortiaIds.includes(consortiumId));
        } else if (typeof item.consortium === 'object' && item.consortium !== null) {
          const consortiumId = (item.consortium as { _id: string })._id;
          return userConsortiaIds.includes(consortiumId);
        } else {
          return userConsortiaIds.includes(item.consortium as string);
        }
      }

      // Check if user is directly assigned to this action item (new structure)
      if (item.assignToModel === 'User') {
        const assignedUserId = typeof item.assignTo === 'object' 
          ? item.assignTo._id 
          : item.assignTo;
        if (assignedUserId === userId) {
          return true;
        }
      }

      // Check if user's organization is assigned to this action item (new structure)
      if (item.assignToModel === 'Organization') {
        const assignedOrgId = typeof item.assignTo === 'object' 
          ? item.assignTo._id 
          : item.assignTo;
        if (userOrganizationId && userOrganizationId === assignedOrgId) {
          return true;
        }
      }

      // Legacy check for assignToUser (for backward compatibility)
      if (item.assignToUser) {
        const assignedUserId = typeof item.assignToUser === 'object' 
          ? item.assignToUser._id 
          : item.assignToUser;
        if (assignedUserId === userId) {
          return true;
        }
      }

      // Check if user is in the organizationUser array
      if (item.organizationUser && Array.isArray(item.organizationUser)) {
        const orgUserIds = item.organizationUser.map((orgUser: string | { _id: string; name: string }) => 
          typeof orgUser === 'object' ? orgUser._id : orgUser
        );
        if (orgUserIds.includes(userId)) {
          return true;
        }
      }

      // Check if user's organization is in the organization array
      if (item.organization && Array.isArray(item.organization)) {
        const orgIds = item.organization.map((org: string | { _id: string; name: string }) => 
          typeof org === 'object' ? org._id : org
        );
        if (userOrganizationId && orgIds.includes(userOrganizationId)) {
          return true;
        }
      }

      return false;
    });
  }, []);

  // Initialize data loading
  React.useEffect(() => {
    if (!authLoading && user) {
      fetchUserConsortia();
    } else if (!authLoading && !user) {
      setLoadingState(prev => ({ ...prev, userConsortia: false }));
    }
  }, [authLoading, user, fetchUserConsortia]);

  // Fetch action items when user consortium data is ready
  React.useEffect(() => {
    if (!loadingState.userConsortia) {
      fetchActionItems();
    }
  }, [fetchActionItems, loadingState.userConsortia]);

  // Set up periodic check for action items that need to be marked as "At Risk"
  React.useEffect(() => {
    const checkAtRiskItems = async () => {
      if (actionItems.length > 0) {
        const needsRefresh = await updateAtRiskItems(actionItems);
        if (needsRefresh) {
          fetchActionItems();
        }
      }
    };

    // Check every hour for items that need status updates
    const interval = setInterval(checkAtRiskItems, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [actionItems, updateAtRiskItems, fetchActionItems]);

  const [activeTab, setActiveTab] = useState("All Actions");
  const [consortium, setConsortium] = useState("");
  const [search, setSearch] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [consortiumOptions, setConsortiumOptions] = useState<{ value: string; label: string }[]>([]);
  const [orgOptions, setOrgOptions] = useState<{ value: string; label: string }[]>([]);
  const [userOptions, setUserOptions] = useState<{ value: string; label: string }[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ActionItem | null>(null);
  const statusOptions = [
    { value: 'In Progress', label: 'In Progress' },
    { value: 'At Risk', label: 'At Risk' },
    { value: 'Complete', label: 'Complete' },
  ];

  // Function to fetch users by consortium
  const fetchUsersByConsortium = useCallback(async (consortiumId: string) => {
    if (!consortiumId) {
      setUserOptions([]);
      return;
    }

    try {
      const usersRes = await userService.getUsers();
      if (usersRes.success && Array.isArray(usersRes.data)) {
        // Filter users who belong to the selected consortium
        const consortiumUsers = usersRes.data.filter((user: User) => {
          // Check if user's consortia array includes the selected consortium
          return user.consortia && Array.isArray(user.consortia) && user.consortia.includes(consortiumId);
        });

        const filteredUserOptions = consortiumUsers.map((u: User) => ({
          value: u.id || u._id,
          label: u.name,
        }));

        setUserOptions(filteredUserOptions);
        console.log('Users filtered by consortium:', consortiumId, filteredUserOptions);
      } else {
        console.warn('Failed to fetch users or invalid response format');
        setUserOptions([]);
      }
    } catch (error) {
      console.error('Error fetching users by consortium:', error);
      showToast.error('Failed to load users for selected consortium');
      setUserOptions([]);
    }
  }, []);

  // Function to clear user options when no consortium is selected
  const clearUserOptions = useCallback(() => {
    setUserOptions([]);
  }, []);

  React.useEffect(() => {
    async function fetchDropdownData() {
      if (!user || loadingState.userConsortia) return;
      
      try {
        // Parallel data fetching for better performance
        const [consortiaData, organizationsData] = await Promise.all([
          (async () => {
            setLoadingState(prev => ({ ...prev, consortia: true }));
            try {
              const consortia: Consortium[] = await fetchConsortiaByRole(user);
              return consortia.filter(isConsortium).map((c: Consortium) => ({
                value: c.id || c._id,
                label: c.name,
              }));
            } catch (error) {
              console.error('Error fetching consortia:', error);
              return [];
            } finally {
              setLoadingState(prev => ({ ...prev, consortia: false }));
            }
          })(),
          (async () => {
            setLoadingState(prev => ({ ...prev, organizations: true }));
            try {
              let organizations: Organization[] = [];
              // Try the role-based fetch first
              organizations = await fetchOrganizationsByRole(user);
              console.log('ActionItemsPage - Organizations fetched for user:', user.role, organizations);
              
              // If no organizations found, try getting all organizations
              if (!organizations || organizations.length === 0) {
                console.log('ActionItemsPage - No organizations found with role-based fetch, trying all organizations');
                const allOrgsResponse = await organizationsService.getOrganizations();
                if (allOrgsResponse.success && Array.isArray(allOrgsResponse.data?.data)) {
                  organizations = allOrgsResponse.data.data;
                  console.log('ActionItemsPage - All organizations fetched as fallback:', organizations);
                }
              }
              
              console.log('ActionItemsPage - Raw organizations data:', organizations);
              
              return organizations.map((o: Organization) => {
                const option = {
                  value: o._id || o.id,
                  label: o.name,
                };
                console.log('Creating org option:', option);
                return option;
              });
            } catch (error) {
              console.error('ActionItemsPage - Error fetching organizations:', error);
              return [];
            } finally {
              setLoadingState(prev => ({ ...prev, organizations: false }));
            }
          })(),
        ]);
        
        setConsortiumOptions(consortiaData);
        setOrgOptions(organizationsData);
        console.log('ActionItemsPage - Organization options set for AssignActionModal:', organizationsData);
        console.log('ActionItemsPage - Organization options values:', organizationsData.map(o => o.value));
        
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        showToast.error('Failed to load some dropdown options');
        setLoadingState(prev => ({ ...prev, consortia: false, organizations: false }));
      }
    }
    
    if (!loadingState.userConsortia) {
      fetchDropdownData();
    }
  }, [user, loadingState.userConsortia]);


  // Function to handle consortium change in modals
  const handleConsortiumChange = (consortiumId: string) => {
    if (consortiumId) {
      fetchUsersByConsortium(consortiumId);
    } else {
      clearUserOptions();
    }
  };

  // Function to handle consortium change for edit modal
  const handleEditConsortiumChange = (consortiumId: string) => {
    if (consortiumId) {
      fetchUsersByConsortium(consortiumId);
    } else {
      clearUserOptions();
    }
  };

  // OPTIMIZATION: Memoize filtered items to prevent unnecessary re-filtering
  const filteredItems = React.useMemo(() => {
    return actionItems
      .filter((item) => {
        // Handle different tab filters
        if (activeTab === 'All Actions') {
          return true;
        } else if (activeTab === 'In Progress') {
          return item.status === 'In Progress' || item.status === 'At Risk';
        } else {
          return item.status === activeTab;
        }
      })
      .filter((item) => {
        // Consortium filter
        if (consortium) {
          if (Array.isArray(item.consortium)) {
            return item.consortium.some((c) => (typeof c === 'object' && c !== null ? c._id === consortium : c === consortium));
          } else if (
            typeof item.consortium === 'object' &&
            item.consortium !== null &&
            '_id' in item.consortium &&
            typeof (item.consortium as { _id: string })._id === 'string'
          ) {
            return (item.consortium as { _id: string })._id === consortium;
          } else {
            return item.consortium === consortium;
          }
        }
        return true;
      })
      .filter((item) => {
        // Search filter (title, description, assignedTo)
        const lower = search.trim().toLowerCase();
        if (!lower) return true;
        const assignedTo = isNamedObject(item.assignTo) ? item.assignTo.name : (item.assignTo as string);
        return (
          (item.title || '').toLowerCase().includes(lower) ||
          (item.description || '').toLowerCase().includes(lower) ||
          (assignedTo || '').toLowerCase().includes(lower)
        );
      });
  }, [actionItems, activeTab, consortium, search]);

  const handleAssignAction = () => {
    setShowAssignModal(true);
  };
  const handleCloseAssignModal = () => setShowAssignModal(false);
  const handleSubmitAssign = async (form: AssignActionFormData) => {
    try {
      // Validate that a user is selected
      if (!form.assignToUser) {
        showToast.error('Please select a user to assign the action item to');
        return;
      }

      const payload: CreateActionItemRequest = {
        title: form.title,
        description: form.description,
        consortium: form.consortium,
        assignTo: form.assignToUser,
        assignToModel: 'User',
        organization: form.assignTo, // Include the selected organization
        implementationDate: form.date,
        status: 'In Progress',
        createdBy: authStorage.getUserId() || '',
      };

      const res = await actionItemsService.createActionItem(payload);
      if (res.success) {
        showToast.success('Action item created successfully');
        setShowAssignModal(false);
        fetchActionItems();
      } else {
        showToast.error(res.message || 'Failed to create action item');
      }
    } catch {
      showToast.error('An error occurred while creating the action item');
    }
  };

  const handleEdit = (item: ActionItem) => {
    console.log('Editing item:', item);
    console.log('Item assignTo:', item.assignTo);
    console.log('Item assignToModel:', item.assignToModel);
    console.log('Item organization:', item.organization);
    console.log('Current orgOptions:', orgOptions);
    
    // Calculate the assignTo value
    let assignToValue = '';
    if (item.assignToModel === 'User') {
      assignToValue = '';
    } else if (item.assignToModel === 'Organization') {
      assignToValue = getId(item.assignTo);
    } else if (item.organization && item.organization.length > 0) {
      assignToValue = getId(item.organization[0]);
    }
    
    console.log('Calculated assignTo value:', assignToValue);
    console.log('Available org option values:', orgOptions.map(o => o.value));
    console.log('Is assignTo value in org options?', orgOptions.some(o => o.value === assignToValue));
    
    setEditingItem(item);
    setEditModalOpen(true);
    
    // Fetch users for the consortium of the item being edited
    const itemConsortiumId = Array.isArray(item.consortium)
      ? (typeof item.consortium[0] === 'object' ? item.consortium[0]._id : item.consortium[0])
      : (typeof item.consortium === 'object' ? item.consortium._id : item.consortium);
    
    if (itemConsortiumId) {
      fetchUsersByConsortium(itemConsortiumId);
    }
  };

  const handleSubmitEdit = async (form: EditActionFormData) => {
    if (!editingItem) return;
    try {
      // Validate that a user is selected
      if (!form.assignToUser) {
        showToast.error('Please select a user to assign the action item to');
        return;
      }

      const payload: UpdateActionItemRequest = {
        title: form.title,
        description: form.description,
        consortium: form.consortium,
        assignTo: form.assignToUser,
        assignToModel: 'User',
        organization: form.assignTo, // Include the selected organization
        implementationDate: form.date,
        status: form.status,
      };
      
      const res = await actionItemsService.updateActionItem(editingItem._id, payload);
      if (res.success) {
        showToast.success('Action item updated successfully');
        setEditModalOpen(false);
        setEditingItem(null);
        fetchActionItems();
      } else {
        showToast.error(res.message || 'Failed to update action item');
      }
    } catch {
      showToast.error('An error occurred while updating the action item');
    }
  };

  const userId = user?.id || null;
  const userRole = user?.role;
  const canAssignOrEdit = userRole === USER_ROLES.Super_user || userRole === USER_ROLES.Admin || userRole === USER_ROLES.Facilitator;

  const handleDelete = async () => {
    if (!itemToDelete || !itemToDelete._id) return;
    if (typeof itemToDelete.createdBy === 'object' && itemToDelete.createdBy !== null) {
      if ((itemToDelete.createdBy as { _id: string })._id !== userId) {
        showToast.error('You can only delete action items you created.');
        setConfirmDeleteOpen(false);
        setItemToDelete(null);
        return;
      }
    } else if (itemToDelete.createdBy !== userId) {
      showToast.error('You can only delete action items you created.');
      setConfirmDeleteOpen(false);
      setItemToDelete(null);
      return;
    }
    try {
      const res = await actionItemsService.deleteActionItem(itemToDelete._id);
      if (res.success) {
        showToast.success('Action item deleted successfully');
        fetchActionItems();
      } else {
        showToast.error(res.message || 'Failed to delete action item');
      }
    } catch {
      showToast.error('An error occurred while deleting the action item');
    }
    setConfirmDeleteOpen(false);
    setItemToDelete(null);
  };

  function isNamedObject(val: unknown): val is { name: string } {
    return typeof val === 'object' && val !== null && 'name' in val && typeof (val as { name: unknown }).name === 'string';
  }

  function getId(val: unknown): string {
    if (typeof val === 'object' && val !== null && '_id' in val && typeof (val as { _id: unknown })._id === 'string') {
      return (val as { _id: string })._id;
    }
    return String(val || '');
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function isCreatedBy(item: ActionItem, userId: string | null) {
    if (!userId) return false;
    if (typeof item.createdBy === 'object' && item.createdBy !== null) {
      return (item.createdBy as { _id: string })._id === userId;
    }
    return item.createdBy === userId;
  }

  function isConsortium(val: unknown): val is { _id: string; name: string } {
    return typeof val === 'object' && val !== null && '_id' in val && 'name' in val;
  }

  // Helper function to calculate days remaining until implementation date
  const getDaysRemaining = (implementationDate: string): number => {
    if (!implementationDate) return 0;
    
    const today = new Date();
    const deadline = new Date(implementationDate);
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper function to get status with visual indicators
  const getStatusWithIndicators = (item: ActionItem) => {
    const daysRemaining = getDaysRemaining(item.implementationDate);
    
    // If item is complete, return the status as is
    if (item.status === 'Complete') {
      return { status: item.status, daysRemaining, isUrgent: false };
    }
    
    // If item is overdue (past implementation date)
    if (daysRemaining < 0) {
      return { status: 'At Risk', daysRemaining, isUrgent: true };
    }
    
    // If item is 2 days or less before deadline
    if (daysRemaining <= 2 && item.status === 'In Progress') {
      return { status: 'At Risk', daysRemaining, isUrgent: true };
    }
    
    return { status: item.status, daysRemaining, isUrgent: false };
  };

  // Show loading state while initial data is being loaded
  if (authLoading || !isFullyLoaded) {
    return (
      <Layout>
        <div className="p-4 sm:p-8 md:p-12">
          <DataLoadingProgress
            title="Loading Action Items"
            subtitle="Please wait while we load all data..."
            items={[
              { key: 'actionItems', label: 'Action Items', isLoading: loadingState.actionItems, count: actionItems.length },
              { key: 'userConsortia', label: 'User Consortia', isLoading: loadingState.userConsortia, count: userConsortia.length },
              { key: 'consortia', label: 'Consortia', isLoading: loadingState.consortia, count: consortiumOptions.length },
              { key: 'organizations', label: 'Organizations', isLoading: loadingState.organizations, count: orgOptions.length }
            ]}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 md:p-12">
        <ActionItemsHeader
          consortium={consortium}
          onConsortiumChange={setConsortium}
          search={search}
          onSearchChange={setSearch}
          consortiumOptions={[
            { value: '', label: 'All Consortiums' },
            ...consortiumOptions
          ]}
        />
        {!authLoading && canAssignOrEdit && (
          <div className="mb-4 flex justify-end">
            <Button variant="primary" size="md" onClick={handleAssignAction}>
              Assign Action
            </Button>
          </div>
        )}
        <ActionItemsTabs activeTab={activeTab} onTabChange={setActiveTab} />
        {loadingState.actionItems ? (
          <div className="text-center py-8 text-gray-500">
            <Loader />
            <p className="mt-2">Loading action items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No action items found.</div>
        ) : (
          filteredItems.map((item, idx) => {
            const statusInfo = getStatusWithIndicators(item);
            // For the "In Progress" tab, we show both In Progress and At Risk items
            // The ActionItemCard will display the appropriate status styling
            return (
            <ActionItemCard
              key={item._id}
              title={item.title}
              status={statusInfo.status as 'In Progress' | 'At Risk' | 'Complete'}
              id={(idx + 1).toString()}
              actionItemId={item._id}
              daysRemaining={statusInfo.daysRemaining}
              assignedTo={
                [
                  isNamedObject(item.assignTo) ? item.assignTo.name : String(item.assignTo || ''),
                  item.assignToUser ? (isNamedObject(item.assignToUser) ? item.assignToUser.name : String(item.assignToUser || '')) : undefined
                ].filter(Boolean).join(' / ')
              }
              consortium={Array.isArray(item.consortium)
                ? item.consortium.map((c) => {
                    if (isNamedObject(c)) {
                      return c.name;
                    } else if (typeof c === 'object' && c !== null) {
                      return String(c);
                    } else {
                      return String(c);
                    }
                  }).join(', ')
                : isNamedObject(item.consortium)
                  ? item.consortium.name
                  : String(item.consortium || '')}
              description={item.description}
              implementationDate={formatDate(item.implementationDate)}
              relatedRisk={(() => {
                if (typeof item.relatedRisk === 'object' && item.relatedRisk !== null) {
                  // Check if it has a title property (which is the correct property for risks)
                  if ('title' in item.relatedRisk && typeof item.relatedRisk.title === 'string') {
                    return item.relatedRisk.title;
                  }
                  // Fallback to name if title doesn't exist
                  if ('name' in item.relatedRisk && typeof item.relatedRisk.name === 'string') {
                    return item.relatedRisk.name;
                  }
                  // If neither exists, convert to string
                  return String(item.relatedRisk);
                }
                return String(item.relatedRisk || '');
              })()}
              onEdit={!authLoading && canAssignOrEdit ? () => handleEdit(item) : undefined}
              onDelete={!authLoading && isCreatedBy(item, userId) ? () => { setItemToDelete(item); setConfirmDeleteOpen(true); } : undefined}
            />
            );
          })
        )}
        <AssignActionModal
          isOpen={showAssignModal}
          onClose={handleCloseAssignModal}
          onSubmit={handleSubmitAssign}
          consortiumOptions={consortiumOptions}
          orgOptions={orgOptions}
          userOptions={userOptions}
          onConsortiumChange={handleConsortiumChange}
        />
        <EditActionModal
          isOpen={editModalOpen}
          onClose={() => { setEditModalOpen(false); setEditingItem(null); }}
          onSubmit={handleSubmitEdit}
          initialData={editingItem ? {
            title: editingItem.title,
            description: editingItem.description,
            consortium: Array.isArray(editingItem.consortium)
              ? getId(editingItem.consortium[0])
              : getId(editingItem.consortium),
            assignTo: (() => {
              if (editingItem.assignToModel === 'User') {
                return '';
              } else if (editingItem.assignToModel === 'Organization') {
                return getId(editingItem.assignTo);
              } else if (editingItem.organization && editingItem.organization.length > 0) {
                return getId(editingItem.organization[0]);
              } else {
                return '';
              }
            })(),
            assignToUser: editingItem.assignToModel === 'User' ? getId(editingItem.assignTo) : getId(editingItem.assignToUser || ''),
            date: formatDate(editingItem.implementationDate),
            status: editingItem.status,
          } : {
            title: '', description: '', consortium: '', assignTo: '', assignToUser: '', date: '', status: 'In Progress'
          }}
          consortiumOptions={consortiumOptions}
          orgOptions={orgOptions}
          userOptions={userOptions}
          statusOptions={statusOptions}
          onConsortiumChange={handleEditConsortiumChange}
        />
        <Modal isOpen={confirmDeleteOpen} onClose={() => { setConfirmDeleteOpen(false); setItemToDelete(null); }} title="Confirm Delete">
          <div className="py-4 text-black">Are you sure you want to delete this action item?</div>
          <div className="flex justify-end gap-2 mt-4">
            <button className="bg-white border border-gray-300 text-gray-700 font-medium px-6 py-2 rounded-lg hover:bg-gray-100 focus:ring-0 text-sm cursor-pointer" onClick={() => { setConfirmDeleteOpen(false); setItemToDelete(null); }}>Cancel</button>
            <button className="bg-red-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-red-700 focus:ring-0 text-sm cursor-pointer" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
} 