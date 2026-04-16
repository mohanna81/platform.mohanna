"use client";
import React, { useState, useRef, useEffect } from "react";
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import MitigationTracker from '@/components/risk-review/MitigationTracker';
import { useAuth } from '@/lib/auth/AuthContext';

// Extended Risk type to include additional fields
interface Risk {
  _id: string;
  title: string;
  statement: string;
  category: string;
  triggerIndicator: string;
  triggerStatus?: string;
  consortium: unknown;
  createdAt?: string;
  createdBy?: {
    organizations?: string[];
  };
  orgRoles?: Array<{
    role: string;
    organization: {
      name?: string;
      _id?: string;
    };
  }>;
  mitigationMeasures?: string;
  preventiveMeasures?: string;
  reactiveMeasures?: string;
}

interface RiskCardProps {
  risk: any; // Use any to avoid type conflicts between different Risk definitions
  status: 'pending' | 'approved' | 'rejected' | 'closed';
  onToggleTrigger: (riskId: string, isCurrentlyTriggered: boolean) => void;
  onEditRisk: (riskId: string) => void;
  onChangeStatus: (riskId: string) => void;
  renderConsortiumNames: (consortium: unknown) => string;
  renderOrganizationNames: (risk: any) => string;
  organizationNamesCache: Record<string, string>;
}

// Helper function to render organization roles
const renderOrganizationRoles = (orgRoles: unknown) => {
  if (!Array.isArray(orgRoles) || orgRoles.length === 0) {
    return <li className="text-sm text-gray-500">No roles assigned</li>;
  }

  const organizationsWithRoles = orgRoles.filter((roleObj: { role?: string; organization?: { name?: string; _id?: string } }) => {
    return roleObj && 
           typeof roleObj === 'object' && 
           'role' in roleObj && 
           roleObj.role && 
           roleObj.role.trim() !== '' &&
           'organization' in roleObj && 
           roleObj.organization;
  });

  if (organizationsWithRoles.length === 0) {
    return <li className="text-sm text-gray-500">No organizations with defined roles</li>;
  }

  return organizationsWithRoles.map((roleObj: { role: string; organization: { name?: string; _id?: string } }, idx: number) => {
    const roleString = roleObj.role;
    const orgName = roleObj.organization?.name;
    
    if (orgName && roleString) {
      return (
        <li key={roleObj.organization?._id || idx} className="text-sm flex items-center gap-2 py-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
          <span className="font-medium text-gray-900">{orgName}:</span>
          <span className="text-gray-600">{roleString}</span>
        </li>
      );
    }
    return null;
  }).filter(Boolean);
};

// Status configuration
const statusConfig = {
  pending: {
    label: 'Pending',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-600'
  },
  approved: {
    label: 'Approved',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600'
  },
  rejected: {
    label: 'Rejected',
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600'
  },
  closed: {
    label: 'Closed',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    iconColor: 'text-gray-500'
  }
};

export default function RiskCard({
  risk,
  status,
  onToggleTrigger,
  onEditRisk,
  onChangeStatus,
  renderConsortiumNames,
  renderOrganizationNames,
}: RiskCardProps) {
  const { user } = useAuth();
  const isTriggered = risk.triggerStatus === 'Triggered';
  const statusInfo = statusConfig[status];
  const [showDetails, setShowDetails] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  // Derive the first consortium ID for tracking
  const firstConsortiumId: string | undefined = Array.isArray(risk.consortium) && risk.consortium.length > 0
    ? (typeof risk.consortium[0] === 'object' ? risk.consortium[0]._id : risk.consortium[0])
    : undefined;

  // Organisation users can update their own org's tracking
  const isOrgUser = user?.role === 'Organization User';
  const canUpdateTracking = isOrgUser && !!user?.organizationId && !!firstConsortiumId;

  // Show tracking for approved risks only — all roles can view, org users can update
  const showTracking = status === 'approved' &&
    (risk.mitigationMeasures || risk.preventiveMeasures || risk.reactiveMeasures);
  const detailsContainerRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const actionButtonsContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll to determine if buttons should be sticky
  useEffect(() => {
    if (!showDetails) {
      setIsSticky(false);
      return;
    }

    const handleScroll = () => {
      if (!detailsContainerRef.current || !buttonsRef.current || !actionButtonsContainerRef.current) return;

      const container = detailsContainerRef.current;
      const buttons = buttonsRef.current;
      const actionButtonsContainer = actionButtonsContainerRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const actionButtonsRect = actionButtonsContainer.getBoundingClientRect();
      
      // Check if we've scrolled past the action buttons container
      const shouldBeSticky = containerRect.top < 80 && actionButtonsRect.bottom > window.innerHeight;
      
      // Check if we've reached the bottom of the details
      const reachedBottom = actionButtonsRect.bottom <= window.innerHeight + 10;
      
      setIsSticky(shouldBeSticky && !reachedBottom);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, [showDetails]);

  return (
    <Card
      padding="none"
      shadow="sm"
      border
      className={`w-full transition-all duration-200 hover:shadow-md ${
        isTriggered 
          ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-red-100' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="p-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            {/* Title and Trigger Badge */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-3">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                {risk.title}
              </h2>
              {isTriggered && (
                <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1.5 rounded-full text-sm font-semibold border border-red-200">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  TRIGGERED
                </div>
              )}
            </div>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2-5V9a2 2 0 012-2h2a2 2 0 012 2v6.5M7 7h3v3H7z" />
                </svg>
                <span className="font-medium">{renderConsortiumNames(risk.consortium)}</span>
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z" />
                </svg>
                <span className="font-medium">{renderOrganizationNames(risk)}</span>
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{risk.createdAt?.slice(0, 10)}</span>
              </div>
            </div>

            {/* Risk Statement */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-800 leading-relaxed">{risk.statement}</p>
            </div>

            {/* Trigger Information */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Trigger Indicator</h4>
                  <p className="text-blue-800 text-sm leading-relaxed">{risk.triggerIndicator}</p>
                </div>
              </div>
            </div>

            {/* Triggered Alert */}
            {isTriggered && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-red-900 mb-1">Risk Triggered</h4>
                    <p className="text-red-800 text-sm">This risk has been triggered and requires immediate attention!</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status and Action Section */}
          <div className="flex flex-col items-start lg:items-end gap-3 lg:min-w-[200px]">
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}`}>
                <span className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${statusInfo.iconColor.replace('text-', 'bg-')}`}></div>
                  {statusInfo.label}
                </span>
              </span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200">
                {risk.category}
              </span>
            </div>

            {/* Trigger Action Button */}
            <div className="w-full lg:w-auto">
              {isTriggered ? (
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full lg:w-auto justify-center bg-red-600 hover:bg-red-700 text-white border-none"
                  onClick={() => onToggleTrigger(risk._id, isTriggered)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                  Deactivate
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full lg:w-auto justify-center border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => onToggleTrigger(risk._id, isTriggered)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Activate
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Footer Section */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          {/* Organization Roles */}
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Organization Roles
              </h4>
              <ul className="space-y-1">
                {renderOrganizationRoles(risk.orgRoles)}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row gap-3 lg:justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => setShowDetails(!showDetails)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showDetails ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
              {showDetails ? 'Hide Details' : 'View Details'}
            </Button>
          </div>
        </div>

        {/* Expanded Details Section */}
        {showDetails && (
          <div ref={detailsContainerRef} className="mt-6 border-t border-gray-200 pt-6">
            {/* Mitigation Measures */}
            {risk.mitigationMeasures && (
              <div className="mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Mitigation Measures
                  </h4>
                  <p className="text-green-800 text-sm leading-relaxed whitespace-pre-wrap">{risk.mitigationMeasures}</p>
                </div>
              </div>
            )}

            {/* Preventive Measures */}
            {risk.preventiveMeasures && (
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Preventive Measures
                  </h4>
                  <p className="text-blue-800 text-sm leading-relaxed whitespace-pre-wrap">{risk.preventiveMeasures}</p>
                </div>
              </div>
            )}

            {/* Reactive Measures */}
            {risk.reactiveMeasures && (
              <div className="mb-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Reactive Measures
                  </h4>
                  <p className="text-purple-800 text-sm leading-relaxed whitespace-pre-wrap">{risk.reactiveMeasures}</p>
                </div>
              </div>
            )}

            {/* Mitigation Tracking (approved risks only) */}
            {showTracking && (
              <div className="mb-6">
                <MitigationTracker
                  riskId={risk._id}
                  riskTitle={risk.title}
                  mitigationMeasures={risk.mitigationMeasures}
                  preventiveMeasures={risk.preventiveMeasures}
                  reactiveMeasures={risk.reactiveMeasures}
                  organizationId={user?.organizationId}
                  consortiumId={firstConsortiumId}
                  canUpdate={canUpdateTracking}
                />
              </div>
            )}

            {/* Closing Info (for closed risks) */}
            {status === 'closed' && (risk.closingComment || risk.mitigationSuccess) && (
              <div className="mb-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Closing Details
                  </h4>
                  {risk.mitigationSuccess && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Mitigation Success</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star: number) => (
                          <svg
                            key={star}
                            className={`w-5 h-5 ${star <= risk.mitigationSuccess ? 'text-amber-400' : 'text-gray-200'}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                        <span className="ml-2 text-sm text-gray-600 font-medium">
                          {['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'][risk.mitigationSuccess]}
                        </span>
                      </div>
                    </div>
                  )}
                  {risk.closingComment && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Remarks</p>
                      <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{risk.closingComment}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons Container - Original Position */}
            <div ref={actionButtonsContainerRef} className="flex flex-row gap-3 justify-end pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                size="md" 
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => onEditRisk(risk._id)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
              <Button 
                variant="primary" 
                size="md" 
                className="flex items-center gap-2"
                onClick={() => onChangeStatus(risk._id)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Change Risk Status
              </Button>
            </div>

            {/* Floating/Sticky Action Buttons */}
            {isSticky && (
              <div 
                ref={buttonsRef}
                className="fixed bottom-6 right-6 flex flex-row gap-3 z-50 animate-in slide-in-from-bottom-4 duration-200"
              >
                <Button 
                  variant="outline" 
                  size="md" 
                  className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 shadow-lg bg-white"
                  onClick={() => onEditRisk(risk._id)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Button>
                <Button 
                  variant="primary" 
                  size="md" 
                  className="flex items-center gap-2 shadow-lg"
                  onClick={() => onChangeStatus(risk._id)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Change Risk Status
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
