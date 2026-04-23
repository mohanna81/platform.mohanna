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
        <Modal isOpen={viewModalOpen} onClose={() => { setViewModalOpen(false); setSelectedRisk(null); }} title="Risk Details" size="2xl" showCloseButton>
          <div className="space-y-4 text-gray-900">

            {/* Top bar: badges + export */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  Closed
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#2a9d8f]/10 text-[#2a9d8f] border border-[#2a9d8f]/20 capitalize">
                  {selectedRisk.category || 'Uncategorized'}
                </span>
                {selectedRisk.code && (
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-gray-100 text-gray-600">
                    {selectedRisk.code}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { exportSingleRiskToExcel(selectedRisk); showToast.success('Risk exported to Excel'); }}
                className="border-green-200 text-green-700 hover:bg-green-50 gap-1.5"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                </svg>
                Export
              </Button>
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold text-gray-900">{selectedRisk.title}</h2>

            {/* Risk Statement */}
            {selectedRisk.statement && (
              <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Risk Statement</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedRisk.statement}</p>
              </div>
            )}

            {/* Risk Assessment */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Likelihood',
                  badge: `${getLikelihoodLabel(selectedRisk.likelihood || '')} (${selectedRisk.likelihood || '0'})`,
                  color: selectedRisk.likelihood && parseInt(selectedRisk.likelihood) >= 4 ? 'bg-red-100 text-red-800' : parseInt(selectedRisk.likelihood || '0') >= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800',
                },
                {
                  label: 'Severity',
                  badge: `${getSeverityLabel(selectedRisk.severity || '')} (${selectedRisk.severity || '0'})`,
                  color: selectedRisk.severity && parseInt(selectedRisk.severity) >= 4 ? 'bg-red-100 text-red-800' : parseInt(selectedRisk.severity || '0') >= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800',
                },
                {
                  label: 'Risk Ranking',
                  badge: String(calcRanking(selectedRisk.likelihood || '0', selectedRisk.severity || '0')),
                  color: rankColor(calcRanking(selectedRisk.likelihood || '0', selectedRisk.severity || '0')),
                },
              ].map(({ label, badge, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>{badge}</span>
                </div>
              ))}
            </div>

            {/* Trigger Indicator */}
            <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Trigger Indicator</p>
              <p className="text-sm text-gray-700">{selectedRisk.triggerIndicator || '—'}</p>
            </div>

            {/* Trigger Status */}
            <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Trigger Status</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                selectedRisk.triggerStatus === 'Triggered' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${selectedRisk.triggerStatus === 'Triggered' ? 'bg-red-500' : 'bg-gray-400'}`} />
                {selectedRisk.triggerStatus || 'Not Triggered'}
              </span>
            </div>

            {/* Response Measures — each full width */}
            <div className="w-full">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Response Measures</p>
              <div className="space-y-3">
                {[
                  { label: 'Mitigation', value: selectedRisk.mitigationMeasures, icon: '🛡️', accent: 'border-l-green-400' },
                  { label: 'Preventive', value: selectedRisk.preventiveMeasures, icon: '🔒', accent: 'border-l-blue-400' },
                  { label: 'Reactive',  value: selectedRisk.reactiveMeasures,  icon: '⚡', accent: 'border-l-purple-400' },
                ].map(({ label, value, icon, accent }) => (
                  <div key={label} className={`w-full bg-gray-50 border border-gray-100 border-l-4 ${accent} rounded-xl p-4`}>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">{icon} {label}</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Consortium */}
            <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Consortium</p>
              {Array.isArray(selectedRisk.consortium) && selectedRisk.consortium.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedRisk.consortium.map((c: Consortium, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium">
                      {c.name || '—'}
                    </span>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400 italic">No consortium assigned</p>}
            </div>

            {/* Mitigation Success */}
            {(selectedRisk as Risk & { mitigationSuccess?: number }).mitigationSuccess != null && (
              <div className="w-full bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Mitigation Success</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg
                      key={star}
                      className={`w-6 h-6 ${star <= ((selectedRisk as Risk & { mitigationSuccess?: number }).mitigationSuccess ?? 0) ? 'text-amber-400' : 'text-gray-200'}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-sm text-gray-700 font-medium">
                    {['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'][(selectedRisk as Risk & { mitigationSuccess?: number }).mitigationSuccess ?? 0]}
                  </span>
                </div>
              </div>
            )}

            {/* Closing Remarks */}
            {selectedRisk.closingComment && (
              <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Closing Remarks</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedRisk.closingComment}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex flex-wrap gap-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
              <span>Created: <span className="text-gray-600 font-medium">{selectedRisk.createdAt ? new Date(selectedRisk.createdAt).toLocaleString() : '—'}</span></span>
              <span>Updated: <span className="text-gray-600 font-medium">{selectedRisk.updatedAt ? new Date(selectedRisk.updatedAt).toLocaleString() : '—'}</span></span>
            </div>

          </div>
        </Modal>
      )}
    </Layout>
  );
}
