'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/common';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStatsGrid from '@/components/dashboard/DashboardStatsGrid';
import Layout from '@/components/common/Layout';
import { actionItemsService } from '@/lib/api/services/actionitems';
import { useAuth } from '@/lib/auth/AuthContext';
import { roleHelpers } from '@/lib/utils/authStorage';

import type { ActionItem } from '@/lib/api/services/actionitems';

export default function DashboardPage() {
  const { loading: authLoading } = useAuth();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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
    if (isUpdatingStatus) return false;
    
    setIsUpdatingStatus(true);
    
    try {
      // Items that are exactly 2 days before deadline
      const itemsToUpdate = items.filter(shouldBeAtRisk);
      // Items that are overdue (past implementation date)
      const overdueItems = items.filter(isOverdue);
      
      const allItemsToUpdate = [...itemsToUpdate, ...overdueItems];
      
      for (const item of allItemsToUpdate) {
        try {
          await actionItemsService.updateActionItem(item._id, {
            status: 'At Risk'
          });
        } catch (error) {
          console.error(`Dashboard: Failed to update action item ${item._id} to At Risk:`, error);
        }
      }
      
      // If any items were updated, show a toast notification
      if (allItemsToUpdate.length > 0) {
        // showToast.success(`${allItemsToUpdate.length} action item(s) automatically marked as "At Risk"`);
        return true;
      }
      return false;
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [isUpdatingStatus]);

  // Set up periodic check for action items that need to be marked as "At Risk"
  // Note: For facilitators and organization users, this is handled by the dedicated dashboard APIs
  useEffect(() => {
    if (authLoading) return;

    // Skip this check for facilitators and organization users since the new APIs handle status updates
    if (roleHelpers.isFacilitator() || roleHelpers.isOrganization()) {
      return;
    }

    const checkAtRiskItems = async () => {
      try {
        // Fetch all action items to check for status updates
        const res = await actionItemsService.getActionItems();
        if (res.success && res.data?.data) {
          await updateAtRiskItems(res.data.data);
        }
      } catch (error) {
        console.error('Dashboard: Error checking action items for status updates:', error);
      }
    };

    // Check immediately when component mounts
    checkAtRiskItems();

    // Check every hour for items that need status updates
    const interval = setInterval(checkAtRiskItems, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [authLoading, updateAtRiskItems]);

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen px-2 sm:px-3 md:px-4 max-w-screen-xl mx-auto py-6">
          <DashboardHeader />
          <DashboardStatsGrid />
        </div>
      </Layout>
    </ProtectedRoute>
  );
} 