"use client";
import { useState, useEffect, useCallback } from "react";
import Layout from '@/components/common/Layout';
import Pagination from '@/components/common/Pagination';
import PageSizeSelector from '@/components/common/PageSizeSelector';
import RotatingMessageLoader from '@/components/common/RotatingMessageLoader';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InputField from '@/components/common/InputField';
import { risksService, Risk, Consortium } from '@/lib/api/services/risks';
import { showToast } from '@/lib/utils/toast';
import { useAuth } from '@/lib/auth/AuthContext';
import { exportRisksToExcel, exportSingleRiskToExcel } from '@/lib/utils/exportExcel';

export default function ClosedRisksPage() {
  const { user } = useAuth();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);

  const canReopen = user?.role === 'Facilitator' || user?.role === 'Admin' || user?.role === 'Super_user';

  const fetchClosedRisks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await risksService.getRisksByStatus('Closed');
      if (response.data?.success && Array.isArray(response.data?.data)) {
        setRisks(response.data.data);
      } else {
        setRisks([]);
      }
    } catch {
      showToast.error('Failed to load closed risks');
      setRisks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClosedRisks();
  }, [fetchClosedRisks]);

  useEffect(() => { setCurrentPage(1); }, [search]);

  const filteredRisks = risks.filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = filteredRisks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedRisks = filteredRisks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleReopen = async (risk: Risk) => {
    try {
      const response = await risksService.updateRisk(risk._id, { status: 'Approved' });
      if (response.success) {
        showToast.success(`"${risk.title}" has been reopened`);
        fetchClosedRisks();
      } else {
        showToast.error(response.error || 'Failed to reopen risk');
      }
    } catch {
      showToast.error('Failed to reopen risk');
    }
  };

  const renderConsortiumNames = (consortium: unknown) => {
    if (!Array.isArray(consortium)) return '—';
    return consortium.map((c: { name?: string } | string) =>
      typeof c === 'object' && c !== null && 'name' in c ? c.name : String(c)
    ).join(', ');
  };

  const getLikelihoodLabel = (v: string) => ({ '1': 'Rare', '2': 'Unlikely', '3': 'Possible', '4': 'Likely', '5': 'Almost Certain' }[v] || v || '—');
  const getSeverityLabel = (v: string) => ({ '1': 'Insignificant', '2': 'Minor', '3': 'Moderate', '4': 'Major', '5': 'Critical' }[v] || v || '—');
  const calcRanking = (l: string, s: string) => (parseInt(l) || 0) * (parseInt(s) || 0);
  const rankColor = (n: number) => n >= 15 ? 'bg-red-100 text-red-800' : n >= 8 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Closed Risks</h1>
            <p className="text-sm text-gray-500 mt-1">Risks that have been closed and removed from the active register</p>
          </div>
          <div className="flex items-center gap-3">
            {filteredRisks.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => { exportRisksToExcel(filteredRisks); showToast.success(`Exported ${filteredRisks.length} risk(s)`); }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Download Excel
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="max-w-sm">
          <InputField
            placeholder="Search closed risks..."
            value={search}
            onChange={setSearch}
            fullWidth
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200">
          {loading ? (
            <RotatingMessageLoader
              title="Loading Closed Risks"
              messages={['Fetching closed risks…', 'Organising data…']}
            />
          ) : filteredRisks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mb-3 opacity-40">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">No closed risks found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">Risk</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">Likelihood</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">Severity</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">Risk Ranking</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">Consortium</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {paginatedRisks.map(risk => {
                      const ranking = calcRanking(risk.likelihood || '0', risk.severity || '0');
                      return (
                        <tr key={risk._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900 text-sm">{risk.title}</div>
                            <div className="text-xs text-gray-400">{risk.createdAt?.slice(0, 10)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="border border-gray-300 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">
                              {risk.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {getLikelihoodLabel(risk.likelihood || '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {getSeverityLabel(risk.severity || '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rankColor(ranking)}`}>
                              {ranking}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-[160px] truncate">
                            {renderConsortiumNames(risk.consortium)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setSelectedRisk(risk); setViewModalOpen(true); }}
                              >
                                View
                              </Button>
                              {canReopen && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReopen(risk)}
                                  className="border-[#2a9d8f] text-[#2a9d8f] hover:bg-[#2a9d8f]/10"
                                >
                                  Reopen
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

              {totalItems > 0 && (
                <div className="border-t border-gray-200 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <PageSizeSelector currentSize={itemsPerPage} onSizeChange={s => { setItemsPerPage(s); setCurrentPage(1); }} options={[5, 10, 20, 50]} />
                    <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Modal */}
      {selectedRisk && (
        <Modal isOpen={viewModalOpen} onClose={() => { setViewModalOpen(false); setSelectedRisk(null); }} title="Risk Details" size="xl" showCloseButton>
          <div className="flex justify-end mb-4">
            <Button
              variant="primary"
              size="sm"
              onClick={() => { exportSingleRiskToExcel(selectedRisk); showToast.success('Risk exported to Excel'); }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Download Excel
            </Button>
          </div>
          <div className="space-y-6 text-black">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Risk Title</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedRisk.title}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Risk Code</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedRisk.code || '—'}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Risk Statement</h3>
              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedRisk.statement || '—'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Category</h3>
              <span className="border border-gray-300 text-black px-3 py-1 rounded-full text-sm font-semibold">{selectedRisk.category}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Likelihood</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{getLikelihoodLabel(selectedRisk.likelihood || '')} ({selectedRisk.likelihood || '0'})</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Severity</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{getSeverityLabel(selectedRisk.severity || '')} ({selectedRisk.severity || '0'})</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Risk Ranking</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${rankColor(calcRanking(selectedRisk.likelihood || '0', selectedRisk.severity || '0'))}`}>
                  {calcRanking(selectedRisk.likelihood || '0', selectedRisk.severity || '0')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">Closed</span>
              </div>
              {selectedRisk.closingComment && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Closing Comment</h3>
                  <p className="text-gray-800 bg-amber-50 border border-amber-100 p-3 rounded-lg whitespace-pre-wrap">{selectedRisk.closingComment}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Mitigation Measures</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedRisk.mitigationMeasures || '—'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Preventive Measures</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedRisk.preventiveMeasures || '—'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Reactive Measures</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedRisk.reactiveMeasures || '—'}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Consortium</h3>
              <div className="space-y-2">
                {Array.isArray(selectedRisk.consortium) && selectedRisk.consortium.length > 0
                  ? selectedRisk.consortium.map((c: Consortium, i: number) => (
                      <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-gray-800">{c.name || '—'}</p>
                      </div>
                    ))
                  : <p className="text-gray-500 italic">No consortium information</p>
                }
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Created At</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedRisk.createdAt ? new Date(selectedRisk.createdAt).toLocaleString() : '—'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Last Updated</h3>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedRisk.updatedAt ? new Date(selectedRisk.updatedAt).toLocaleString() : '—'}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
