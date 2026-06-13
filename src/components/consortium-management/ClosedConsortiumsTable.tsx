import React, { useEffect, useState, useCallback } from 'react';
import { fetchConsortiaByRole, Consortium } from '@/lib/api/services/consortia';
import Link from 'next/link';
import EditConsortiumModal from './EditConsortiumModal';
import Loader from '../common/Loader';
import Pagination from '../common/Pagination';
import PageSizeSelector from '../common/PageSizeSelector';
import { useAuth } from '@/lib/auth/AuthContext';
import { normalizeRole } from '@/lib/utils/roleHierarchy';

interface ClosedConsortiaTableProps {
  refreshKey?: number;
}

const ClosedConsortiaTable = ({ refreshKey }: ClosedConsortiaTableProps) => {
  const { user } = useAuth();
  const [consortia, setConsortia] = useState<Consortium[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingConsortiumId, setEditingConsortiumId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const fetchConsortia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user) {
        setConsortia([]);
        return;
      }
      const all = await fetchConsortiaByRole(user);
      setConsortia(all.filter((c: Consortium) => c.status === 'Closed'));
    } catch {
      setError('An unexpected error occurred');
      setConsortia([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConsortia();
      setCurrentPage(1);
    }
  }, [user, refreshKey, fetchConsortia]);

  const consortiaArray = Array.isArray(consortia) ? consortia : [];
  const filteredConsortia = search.trim()
    ? consortiaArray.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))
    : consortiaArray;
  const totalPages = Math.ceil(filteredConsortia.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentConsortia = filteredConsortia.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="py-12">
        <Loader size="lg" variant="default" />
        <p className="text-center text-gray-500 mt-4">Loading closed consortia...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-2 sm:p-4 mt-6 overflow-x-auto">
      <div className="mb-4 px-2">
        <input
          type="text"
          placeholder="Search closed consortia..."
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full sm:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a9d8f]/40"
        />
      </div>
      <table className="w-full min-w-[600px] text-left">
        <thead>
          <tr className="text-gray-500 text-xs md:text-sm">
            <th className="font-medium py-2 px-2">Name</th>
            <th className="font-medium py-2 px-2">Status</th>
            <th className="font-medium py-2 px-2">Created</th>
            <th className="font-medium py-2 px-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {error ? (
            <tr><td colSpan={4} className="py-6 text-center text-red-500">{error}</td></tr>
          ) : filteredConsortia.length === 0 ? (
            <tr><td colSpan={4} className="py-6 text-center text-gray-400">No closed consortia found.</td></tr>
          ) : (
            currentConsortia.map((c) => (
              <tr key={c._id || c.id || c.name} className="border-t last:border-b hover:bg-gray-50">
                <td className="py-3 px-2 font-semibold text-gray-900">{c.name}</td>
                <td className="py-3 px-2">
                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-200 text-gray-700">
                    Closed
                  </span>
                </td>
                <td className="py-3 px-2 text-gray-700">
                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}
                </td>
                <td className="py-3 px-2 text-right flex items-center gap-4 justify-end">
                  <Link href={`/consortiums/${c._id || c.id}`}>
                    <button className="flex items-center gap-1 text-gray-700 hover:text-black text-sm font-medium cursor-pointer">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 12h8m0 0l-3-3m3 3l-3 3"/></svg>
                      View Details
                    </button>
                  </Link>
                  {user && (normalizeRole(user.role) === 'Super_user' || normalizeRole(user.role) === 'Admin') && (
                    <button
                      className="flex items-center gap-1 text-gray-700 hover:text-black text-sm font-medium cursor-pointer"
                      onClick={() => {
                        const id = c._id || c.id;
                        if (id) { setEditingConsortiumId(id); setShowEditModal(true); }
                      }}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 20h9"/><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5Z"/></svg>
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {filteredConsortia.length > 0 && (
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <PageSizeSelector currentSize={itemsPerPage} onSizeChange={(s) => { setItemsPerPage(s); setCurrentPage(1); }} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredConsortia.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {editingConsortiumId && (
        <EditConsortiumModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditingConsortiumId(null); }}
          consortiumId={editingConsortiumId}
          onUpdated={fetchConsortia}
        />
      )}
    </div>
  );
};

export default ClosedConsortiaTable;
