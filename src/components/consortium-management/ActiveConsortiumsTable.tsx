import React, { useEffect, useState, useCallback } from 'react';
import { fetchConsortiaByRole, Consortium } from '@/lib/api/services/consortia';
import Link from 'next/link';
import EditConsortiumModal from './EditConsortiumModal';
import Loader from '../common/Loader';
import Pagination from '../common/Pagination';
import PageSizeSelector from '../common/PageSizeSelector';
import { useAuth } from '@/lib/auth/AuthContext';
import { normalizeRole } from '@/lib/utils/roleHierarchy';

interface ActiveConsortiumsTableProps {
  refreshKey?: number;
}

const ActiveConsortiumsTable = ({ refreshKey }: ActiveConsortiumsTableProps) => {
  const { user } = useAuth();
  const [consortiums, setConsortiums] = useState<Consortium[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingConsortiumId, setEditingConsortiumId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchConsortia = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    console.log('Current user:', user);
    console.log('User role:', user?.role);
    console.log('User ID:', user?.id);
    
    try {
      if (!user) {
        setConsortiums([]);
        return;
      }
      
      const consortiaData = await fetchConsortiaByRole(user);
      console.log('Fetched consortiums:', consortiaData);
      setConsortiums(consortiaData);
    } catch (error) {
      console.error('Error fetching consortia:', error);
      setError('An unexpected error occurred');
      setConsortiums([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('useEffect triggered - user changed:', user);
    if (user) {
    fetchConsortia();
    setCurrentPage(1); // Reset to first page when refreshing
    }
  }, [user, refreshKey, fetchConsortia]);

  // Calculate pagination - ensure consortiums is always an array
  const consortiaArray = Array.isArray(consortiums) ? consortiums : [];
  const totalPages = Math.ceil(consortiaArray.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentConsortiums = consortiaArray.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  if (loading) {
    return (
      <div className="py-12">
        <Loader size="lg" variant="default" />
        <p className="text-center text-gray-500 mt-4">Loading consortiums...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-2 sm:p-4 mt-6 overflow-x-auto">
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
          ) : consortiaArray.length === 0 ? (
            <tr><td colSpan={4} className="py-6 text-center text-gray-400">No consortia found.</td></tr>
          ) : (
            currentConsortiums.map((c) => (
              <tr key={c._id || c.id || c.name} className="border-t last:border-b hover:bg-gray-50">
                <td className="py-3 px-2 font-semibold text-gray-900">{c.name}</td>
                <td className="py-3 px-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    c.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : c.status === 'Inactive'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="py-3 px-2 text-gray-700">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
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
                        const consortiumId = c._id || c.id;
                        if (consortiumId) {
                          setEditingConsortiumId(consortiumId);
                          setShowEditModal(true);
                        }
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
      
      {/* Pagination */}
      {consortiaArray.length > 0 && (
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <PageSizeSelector
              currentSize={itemsPerPage}
              onSizeChange={handlePageSizeChange}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={consortiaArray.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
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

export default ActiveConsortiumsTable; 