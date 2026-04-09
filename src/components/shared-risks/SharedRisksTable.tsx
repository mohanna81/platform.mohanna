import React, { useState } from 'react';
import { Risk, Consortium } from '@/lib/api/services/risks';
import Button from '@/components/common/Button';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Modal from '@/components/common/Modal';
import { showToast } from '@/lib/utils/toast';
import { exportSingleRiskToExcel } from '@/lib/utils/exportExcel';

interface SharedRisksTableProps {
  risks: Risk[];
  onRiskDeleted?: () => void;
}

const SharedRisksTable: React.FC<SharedRisksTableProps> = ({ risks, onRiskDeleted }) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [riskToDelete, setRiskToDelete] = useState<Risk | null>(null);
  const [deleting, setDeleting] = useState(false);
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewRisk(risk)}
                              className="text-xs sm:text-sm"
                            >
                              View
                            </Button>
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
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewRisk(risk)}
                    className="w-full"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* View Risk Modal */}
      {selectedRisk && (
        <Modal isOpen={viewModalOpen} onClose={handleCloseViewModal} title="Risk Details" size="xl" showCloseButton>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { exportSingleRiskToExcel(selectedRisk); showToast.success('Risk exported to Excel'); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
              </svg>
              Download Excel
            </button>
          </div>
          <div className="space-y-6 text-black max-h-[70vh] overflow-y-auto pr-2">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Risk Title</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedRisk.title || 'Not specified'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Risk Code</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedRisk.code || 'Not specified'}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Risk Statement</h3>
              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedRisk.statement || 'Not specified'}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Category</h3>
              <span className="bg-white border border-gray-300 text-black px-3 py-1 rounded-full text-sm font-semibold">
                {selectedRisk.category || 'Not specified'}
              </span>
            </div>
            
            {/* Risk Assessment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Likelihood</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLikelihoodColor(selectedRisk.likelihood || '0')}`}>
                  {getLikelihoodLabel(selectedRisk.likelihood || '')} ({selectedRisk.likelihood || '0'})
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Severity</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(selectedRisk.severity || '0')}`}>
                  {getSeverityLabel(selectedRisk.severity || '')} ({selectedRisk.severity || '0'})
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Risk Ranking</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskRankingColor(calculateRiskRanking(selectedRisk.likelihood || '0', selectedRisk.severity || '0'))}`}>
                  {calculateRiskRanking(selectedRisk.likelihood || '0', selectedRisk.severity || '0')}
                </span>
              </div>
            </div>
            
            {/* Trigger Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Trigger Indicator</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedRisk.triggerIndicator || 'Not specified'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Trigger Status</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedRisk.triggerStatus === 'Triggered' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedRisk.triggerStatus || 'Not triggered'}
                </span>
              </div>
            </div>
            
            {/* Risk Status */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Risk Status</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                selectedRisk.status === 'Approved' 
                  ? 'bg-green-100 text-green-800' 
                  : selectedRisk.status === 'Pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {selectedRisk.status || 'Not specified'}
              </span>
            </div>
            
            {/* Measures */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Mitigation Measures</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedRisk.mitigationMeasures || 'Not specified'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Preventive Measures</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedRisk.preventiveMeasures || 'Not specified'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Reactive Measures</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedRisk.reactiveMeasures || 'Not specified'}</p>
              </div>
            </div>
            
            {/* Consortium Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Consortium</h3>
              <div className="space-y-2">
                {Array.isArray(selectedRisk.consortium) && selectedRisk.consortium.length > 0 ? (
                  selectedRisk.consortium.map((consortium: Consortium, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-gray-800">{consortium.name || 'Not specified'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No consortium information available</p>
                )}
              </div>
            </div>
            

            
            {/* Organization Roles */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Organization Roles</h3>
              <div className="space-y-2">
                {renderOrganizationRoles(selectedRisk.orgRoles)}
              </div>
            </div>
            

            
            {/* Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Created At</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {selectedRisk.createdAt ? new Date(selectedRisk.createdAt).toLocaleString() : 'Not specified'}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Last Updated</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {selectedRisk.updatedAt ? new Date(selectedRisk.updatedAt).toLocaleString() : 'Not specified'}
                </p>
              </div>
            </div>
            

          </div>
        </Modal>
      )}
      
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