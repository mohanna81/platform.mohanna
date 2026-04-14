import React, { useState } from 'react';
import { Risk, Consortium } from '@/lib/api/services/risks';
import Button from '@/components/common/Button';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Modal from '@/components/common/Modal';
import TextArea from '@/components/common/TextArea';
import { showToast } from '@/lib/utils/toast';
import { exportSingleRiskToExcel } from '@/lib/utils/exportExcel';
import { useAuth } from '@/lib/auth/AuthContext';

interface SharedRisksTableProps {
  risks: Risk[];
  onRiskDeleted?: () => void;
}

const SharedRisksTable: React.FC<SharedRisksTableProps> = ({ risks, onRiskDeleted }) => {
  const { user } = useAuth();
  const canCloseRisk = user?.role === 'Facilitator' || user?.role === 'Admin' || user?.role === 'Super_user';

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [riskToDelete, setRiskToDelete] = useState<Risk | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [riskToClose, setRiskToClose] = useState<Risk | null>(null);
  const [closingComment, setClosingComment] = useState('');
  const [mitigationSuccess, setMitigationSuccess] = useState(0);
  const [closing, setClosing] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const handleDeleteConfirm = async () => {
    if (!riskToDelete) return;
    
    setDeleting(true);
    try {
      // Import the risksService here to avoid circular dependency
      const { risksService } = await import('@/lib/api/services/risks');
      await risksService.deleteRisk(riskToDelete._id);
      
      setDeleteModalOpen(false);
      setRiskToDelete(null);
      showToast.success(`Risk "${riskToDelete.title}" deleted successfully`);
      if (onRiskDeleted) {
        onRiskDeleted();
      }
    } catch (error) {
      console.error('Error deleting risk:', error);
      showToast.error('Failed to delete risk');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setRiskToDelete(null);
  };

  const handleCloseRisk = (risk: Risk) => {
    setRiskToClose(risk);
    setClosingComment('');
    setMitigationSuccess(0);
    setCloseModalOpen(true);
  };

  const handleCloseRiskConfirm = async () => {
    if (!riskToClose) return;
    if (!closingComment.trim()) {
      showToast.error('Please enter a closing comment');
      return;
    }
    if (mitigationSuccess === 0) {
      showToast.error('Please select a mitigation success rating');
      return;
    }
    setClosing(true);
    try {
      const { risksService } = await import('@/lib/api/services/risks');
      const response = await risksService.updateRisk(riskToClose._id, {
        status: 'Closed',
        closingComment: closingComment.trim(),
        mitigationSuccess,
      });
      if (response.success) {
        showToast.success(`Risk "${riskToClose.title}" has been closed`);
        setCloseModalOpen(false);
        setRiskToClose(null);
        setClosingComment('');
        setMitigationSuccess(0);
        if (onRiskDeleted) onRiskDeleted();
      } else {
        showToast.error(response.error || 'Failed to close risk');
      }
    } catch {
      showToast.error('Failed to close risk');
    } finally {
      setClosing(false);
    }
  };

  const handleCloseRiskCancel = () => {
    setCloseModalOpen(false);
    setRiskToClose(null);
    setClosingComment('');
    setMitigationSuccess(0);
  };

  const handleViewRisk = (risk: Risk) => {
    setSelectedRisk(risk);
    setViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedRisk(null);
  };

  // Helper function to render consortium names
  const renderConsortiumNames = (consortium: unknown) => {
    if (!Array.isArray(consortium)) return '';
    return consortium.map((c: { name?: string } | string) => 
      typeof c === 'object' && c !== null && 'name' in c ? c.name : String(c)
    ).join(', ');
  };

  // Helper function to render organization roles
  const renderOrganizationRoles = (orgRoles: unknown) => {
    if (!Array.isArray(orgRoles) || orgRoles.length === 0) {
      return <span className="text-gray-500">No roles assigned</span>;
    }

    // Filter out organizations that don't have a defined role
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
      return <span className="text-gray-500">No organizations with defined roles</span>;
    }

    return organizationsWithRoles.map((roleObj: { role: string; organization: { name?: string; _id?: string } }, idx: number) => {
      const roleString = roleObj.role;
      const orgName = roleObj.organization?.name;
      
      if (orgName && roleString) {
        return (
          <div key={roleObj.organization?._id || idx} className="text-sm">
            <span className="font-semibold text-black">
              {orgName}:
            </span>
            <span className="text-black ml-1">
              {roleString}
            </span>
          </div>
        );
      }
      return null;
    }).filter(Boolean);
  };

  // Helper function to render mitigation measures with truncation
  const renderMitigationMeasures = (mitigation: string, risk: Risk) => {
    const maxLength = 100;
    const isTruncated = mitigation.length > maxLength;
    const truncatedText = isTruncated ? mitigation.substring(0, maxLength) + '...' : mitigation;

    return (
      <div className="space-y-2">
        <div className="text-sm">
          <span className="font-semibold text-black">Mitigation:</span>
          <span className="text-black ml-1">
            {truncatedText}
          </span>
        </div>
        {isTruncated && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewRisk(risk)}
            className="text-xs"
          >
            View More
          </Button>
        )}
      </div>
    );
  };

  // Helper function to calculate risk ranking
  const calculateRiskRanking = (likelihood: string, severity: string) => {
    const likelihoodNum = parseInt(likelihood) || 0;
    const severityNum = parseInt(severity) || 0;
    return likelihoodNum * severityNum;
  };

  // Helper function to get likelihood color
  const getLikelihoodColor = (likelihood: string) => {
    const num = parseInt(likelihood) || 0;
    if (num >= 4) return 'bg-red-100 text-red-800';
    if (num >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // Helper function to get severity color
  const getSeverityColor = (severity: string) => {
    const num = parseInt(severity) || 0;
    if (num >= 4) return 'bg-red-100 text-red-800';
    if (num >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // Helper function to get likelihood label
  const getLikelihoodLabel = (likelihood: string) => {
    const likelihoodLabels: { [key: string]: string } = {
      '1': 'Rare',
      '2': 'Unlikely',
      '3': 'Possible',
      '4': 'Likely',
      '5': 'Almost Certain'
    };
    return likelihoodLabels[likelihood] || 'Not specified';
  };
  
  // Helper function to get severity label
  const getSeverityLabel = (severity: string) => {
    const severityLabels: { [key: string]: string } = {
      '1': 'Insignificant',
      '2': 'Minor',
      '3': 'Moderate',
      '4': 'Major',
      '5': 'Critical'
    };
    return severityLabels[severity] || 'Not specified';
  };

  // Helper function to get risk ranking color
  const getRiskRankingColor = (ranking: number) => {
    if (ranking >= 15) return 'bg-red-100 text-red-800';
    if (ranking >= 8) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (risks.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl min-h-[200px] flex items-center justify-center text-gray-500 text-lg">
        No shared risks found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-end px-2 sm:px-0">
        <div className="flex bg-gray-100 rounded-lg p-1 text-xs sm:text-sm">
          <button
            onClick={() => setViewMode('table')}
            className={`px-2 sm:px-3 py-1 rounded font-medium transition cursor-pointer ${
              viewMode === 'table' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="hidden sm:inline">Table View</span>
            <span className="sm:hidden">Table</span>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-2 sm:px-3 py-1 rounded font-medium transition cursor-pointer ${
              viewMode === 'cards' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="hidden sm:inline">Card View</span>
            <span className="sm:hidden">Cards</span>
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Risk</th>
                      <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Category</th>
                      <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Likelihood</th>
                      <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Severity</th>
                      <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Risk Ranking</th>
                      <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Consortium</th>
                      <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Mitigation</th>
                      <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Status</th>
                      <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {risks.map((risk) => {
                      const isTriggered = risk.triggerStatus === 'Triggered';
                      const riskRanking = calculateRiskRanking(risk.likelihood || '0', risk.severity || '0');
                      return (
                        <tr key={risk._id} className={`hover:bg-gray-50 ${isTriggered ? 'bg-[#FFF5F2] border-l-4 border-[#FBBF77]' : ''}`}>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="max-w-[200px]">
                              <div className="font-semibold text-black text-xs sm:text-sm truncate">{risk.title}</div>
                              <div className="text-xs text-gray-500">{risk.createdAt?.slice(0, 10)}</div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className="bg-white border border-gray-300 text-black px-2 py-1 rounded-full text-xs font-semibold">
                              {risk.category}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getLikelihoodColor(risk.likelihood || '0')}`}>
                              {getLikelihoodLabel(risk.likelihood || '')}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(risk.severity || '0')}`}>
                              {getSeverityLabel(risk.severity || '')}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskRankingColor(riskRanking)}`}>
                              {riskRanking}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="max-w-[150px] text-black text-xs sm:text-sm truncate">
                              {renderConsortiumNames(risk.consortium)}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="max-w-[200px]">
                              {renderMitigationMeasures(risk.mitigationMeasures || '', risk)}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            {isTriggered ? (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit">
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                                <span className="hidden sm:inline">TRIGGERED</span>
                                <span className="sm:hidden">⚠️</span>
                              </span>
                            ) : (
                              <span className="text-gray-600 text-xs sm:text-sm">
                                <span className="hidden sm:inline">Not triggered</span>
                                <span className="sm:hidden">-</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleViewRisk(risk)} className="text-xs sm:text-sm">
                                View
                              </Button>
                              {canCloseRisk && (
                                <Button variant="outline" size="sm" onClick={() => handleCloseRisk(risk)} className="text-xs sm:text-sm border-gray-400 text-gray-600">
                                  Close Risk
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {risks.map((risk) => {
            const isTriggered = risk.triggerStatus === 'Triggered';
            const riskRanking = calculateRiskRanking(risk.likelihood || '0', risk.severity || '0');
            return (
              <div key={risk._id} className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm ${isTriggered ? 'border-[#FBBF77] bg-[#FFF5F2]' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-black">{risk.title}</h3>
                  {isTriggered && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                      TRIGGERED
                    </span>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    Created: {risk.createdAt?.slice(0, 10)}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-white border border-gray-300 text-black px-2 py-1 rounded-full text-xs font-semibold">
                      {risk.category}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getLikelihoodColor(risk.likelihood || '0')}`}>
                      Likelihood: {getLikelihoodLabel(risk.likelihood || '')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(risk.severity || '0')}`}>
                      Severity: {getSeverityLabel(risk.severity || '')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskRankingColor(riskRanking)}`}>
                      Risk: {riskRanking}
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-semibold text-black">Consortium:</span>
                    <span className="text-black ml-1">{renderConsortiumNames(risk.consortium)}</span>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-semibold text-black">Mitigation:</span>
                    <div className="text-black mt-1">
                      {(risk.mitigationMeasures || '').substring(0, 100)}
                      {(risk.mitigationMeasures || '').length > 100 && '...'}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewRisk(risk)} className="flex-1">
                      View Details
                    </Button>
                    {canCloseRisk && (
                      <Button variant="outline" size="sm" onClick={() => handleCloseRisk(risk)} className="flex-1 border-gray-400 text-gray-600">
                        Close Risk
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* View Risk Modal */}
      {selectedRisk && (
        <Modal isOpen={viewModalOpen} onClose={handleCloseViewModal} title="Risk Details" size="xl" showCloseButton>
          <div className="space-y-0 text-gray-900">

            {/* Top bar: meta + export */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                {/* Status badge */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedRisk.status === 'Approved' ? 'bg-green-100 text-green-700' :
                  selectedRisk.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                  selectedRisk.status === 'Closed' ? 'bg-gray-100 text-gray-600' :
                  'bg-red-100 text-red-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    selectedRisk.status === 'Approved' ? 'bg-green-500' :
                    selectedRisk.status === 'Pending' ? 'bg-amber-500' :
                    selectedRisk.status === 'Closed' ? 'bg-gray-400' : 'bg-red-500'
                  }`} />
                  {selectedRisk.status || 'Unknown'}
                </span>
                {/* Category */}
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#2a9d8f]/10 text-[#2a9d8f] border border-[#2a9d8f]/20 capitalize">
                  {selectedRisk.category || 'Uncategorized'}
                </span>
                {/* Risk Code */}
                {selectedRisk.code && (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-gray-100 text-gray-600">
                    {selectedRisk.code}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { exportSingleRiskToExcel(selectedRisk); showToast.success('Risk exported'); }}
                className="border-green-200 text-green-700 hover:bg-green-50 gap-1.5"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                </svg>
                Export
              </Button>
            </div>

            {/* Title + statement */}
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900 mb-3">{selectedRisk.title}</h2>
              {selectedRisk.statement && (
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 border-l-4 border-[#2a9d8f] px-4 py-3 rounded-r-lg">
                  {selectedRisk.statement}
                </p>
              )}
            </div>

            {/* Risk Assessment row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                {
                  label: 'Likelihood',
                  badge: `${getLikelihoodLabel(selectedRisk.likelihood || '')} (${selectedRisk.likelihood || '0'})`,
                  color: getLikelihoodColor(selectedRisk.likelihood || '0'),
                },
                {
                  label: 'Severity',
                  badge: `${getSeverityLabel(selectedRisk.severity || '')} (${selectedRisk.severity || '0'})`,
                  color: getSeverityColor(selectedRisk.severity || '0'),
                },
                {
                  label: 'Risk Ranking',
                  badge: String(calculateRiskRanking(selectedRisk.likelihood || '0', selectedRisk.severity || '0')),
                  color: getRiskRankingColor(calculateRiskRanking(selectedRisk.likelihood || '0', selectedRisk.severity || '0')),
                },
              ].map(({ label, badge, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>{badge}</span>
                </div>
              ))}
            </div>

            {/* Trigger row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Trigger Indicator</p>
                <p className="text-sm text-gray-700">{selectedRisk.triggerIndicator || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Trigger Status</p>
                <span className={`self-start px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedRisk.triggerStatus === 'Triggered' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {selectedRisk.triggerStatus || 'Not Triggered'}
                </span>
              </div>
            </div>

            {/* Measures */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Response Measures</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: 'Mitigation', value: selectedRisk.mitigationMeasures, icon: '🛡️' },
                  { label: 'Preventive', value: selectedRisk.preventiveMeasures, icon: '🔒' },
                  { label: 'Reactive', value: selectedRisk.reactiveMeasures, icon: '⚡' },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2">{icon} {label}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Consortium + Org Roles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Consortium</p>
                {Array.isArray(selectedRisk.consortium) && selectedRisk.consortium.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRisk.consortium.map((c: Consortium, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium">
                        {c.name || '—'}
                      </span>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400 italic">No consortium</p>}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Organization Roles</p>
                <div className="space-y-1">{renderOrganizationRoles(selectedRisk.orgRoles)}</div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
              <span>Created: <span className="text-gray-600 font-medium">{selectedRisk.createdAt ? new Date(selectedRisk.createdAt).toLocaleString() : '—'}</span></span>
              <span>Updated: <span className="text-gray-600 font-medium">{selectedRisk.updatedAt ? new Date(selectedRisk.updatedAt).toLocaleString() : '—'}</span></span>
            </div>

          </div>
        </Modal>
      )}
      
      <Modal isOpen={closeModalOpen} onClose={handleCloseRiskCancel} title="Close Risk" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            You are about to close <span className="font-semibold text-gray-900">{riskToClose?.title}</span>. It will be moved to Closed Risks and removed from the active register.
          </p>
          <TextArea
            label={<>Closing Comment <span className="text-red-500">*</span></>}
            rows={4}
            value={closingComment}
            onChange={setClosingComment}
            placeholder="Explain why this risk is being closed..."
            fullWidth
            disabled={closing}
          />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Mitigation Success <span className="text-red-500">*</span>
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => !closing && setMitigationSuccess(star)}
                  className="focus:outline-none transition-transform hover:scale-110 disabled:cursor-not-allowed"
                  disabled={closing}
                  title={['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'][star]}
                >
                  <svg
                    className={`w-8 h-8 ${star <= mitigationSuccess ? 'text-amber-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
              {mitigationSuccess > 0 && (
                <span className="ml-2 text-sm text-gray-500">
                  {['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'][mitigationSuccess]}
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={handleCloseRiskCancel} disabled={closing} className="border-gray-300 text-gray-700">
              Cancel
            </Button>
            <Button variant="secondary" size="sm" onClick={handleCloseRiskConfirm} disabled={closing || !closingComment.trim() || mitigationSuccess === 0} loading={closing} className="bg-[#2a9d8f] text-white hover:bg-[#238a7e]">
              Close Risk
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Risk"
        message={`Are you sure you want to delete the risk "${riskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default SharedRisksTable; 