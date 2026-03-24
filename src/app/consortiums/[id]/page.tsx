"use client";
import { useEffect, useState } from "react";
import Layout from "@/components/common/Layout";
import { consortiaService, Consortium } from "@/lib/api";
import { Organization } from "@/lib/api/services/organizations";
import { userService, User } from "@/lib/api/services/auth";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EditConsortiumModal from '@/components/consortium-management/EditConsortiumModal';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Loader from '@/components/common/Loader';
import { useAuth } from '@/lib/auth/AuthContext';
import { normalizeRole } from '@/lib/utils/roleHierarchy';

function isOrganization(obj: unknown): obj is Organization {
  return typeof obj === 'object' && obj !== null && '_id' in obj && 'name' in obj;
}

export default function ConsortiumDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [consortium, setConsortium] = useState<Consortium | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const [usersLoading, setUsersLoading] = useState(true);
  const [facilitators, setFacilitators] = useState<User[]>([]);
  const [organizationUsers, setOrganizationUsers] = useState<User[]>([]);

  // Check if user can edit/delete consortium
  const canEditConsortium = user && (normalizeRole(user.role) === 'Super_user' || normalizeRole(user.role) === 'Admin');
  const canDeleteConsortium = user && (normalizeRole(user.role) === 'Super_user' || normalizeRole(user.role) === 'Admin');

  // Helper function to check if user is a facilitator (excluding admins and super users)
  const isFacilitator = (user: User) => {
    return user.role === 'Facilitator';
  };

  // Helper function to check if user is an organization user
  const isOrganizationUser = (user: User) => {
    return user.role === 'Organization User' || user.role === 'organization';
  };

  const fetchConsortium = () => {
    if (!id) return;
    setLoading(true);
    consortiaService.getConsortiumById(id as string)
      .then((response) => {
        if (response.success && response.data) {
          setConsortium(response.data.data);
        } else {
          setError("Consortium not found");
        }
      })
      .catch(() => setError("Error fetching consortium"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConsortium();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!consortium) return;
    // Use organizations from consortium directly
    setOrganizations(Array.isArray(consortium.organizations) ? consortium.organizations.filter(isOrganization) : []);
  }, [consortium]);

  useEffect(() => {
    if (!consortium) return;
    setUsersLoading(true);
    userService.getUsers()
      .then((response) => {
        if (response.success && response.data) {
          const consortiumId = consortium._id || consortium.id;
          
          if (!consortiumId) {
            console.error('Consortium ID not found');
            return;
          }
          
          // Filter users who have this consortium in their consortia array
          const consortiumUsers = response.data.filter((user: User) => 
            (user.consortia || []).includes(consortiumId)
          );
          

          
          // Separate facilitators and organization users from consortium members
          const facilitatorUsers = consortiumUsers.filter(user => isFacilitator(user));
          const orgUsers = consortiumUsers.filter(user => isOrganizationUser(user));
          
          setFacilitators(facilitatorUsers);
          setOrganizationUsers(orgUsers);
        }
      })
      .finally(() => setUsersLoading(false));
  }, [organizations, consortium]);

  const handleDelete = async () => {
    if (!consortium) return;
    
    const consortiumId = consortium._id || consortium.id;
    if (!consortiumId) {
      setError("Invalid consortium ID");
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await consortiaService.deleteConsortium(consortiumId);
      if (response.success) {
        router.push('/consortiums');
      } else {
        setError("Failed to delete consortium");
      }
    } catch {
      setError("Error deleting consortium");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="p-8 flex justify-center items-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    </Layout>
  );
  
  if (error || !consortium) return (
    <Layout>
      <div className="p-8 text-center text-red-500">{error || "Not found"}</div>
    </Layout>
  );

  return (
    <Layout>
      <div className="px-4 py-8 sm:px-8 md:px-12 md:py-12">
        <Link href="/consortiums" className="text-sm text-gray-500 hover:text-black flex items-center mb-6">&larr; Back to Consortiums</Link>
        <div className="bg-white rounded-2xl shadow p-6 sm:p-10 w-full">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {consortium.name}
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-medium ml-2 align-middle">{consortium.status || 'Active'}</span>
            </h1>
            {canEditConsortium && (
              <div className="flex gap-2">
                <button className="p-2 rounded-lg border border-yellow-400 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-500 cursor-pointer transition" title="Edit" onClick={() => setShowEditModal(true)}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5Z"/></svg>
                </button>
                {canDeleteConsortium && (
                  <button 
                    className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition cursor-pointer" 
                    title="Delete" 
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12Z"/></svg>
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="text-gray-500 text-xs mb-4">ID: {consortium._id || consortium.id}</div>
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-1">Description</h2>
            <div className="text-gray-700 text-sm">{consortium.description || <span className="italic text-gray-400">No description</span>}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3h8v4"/><rect width="16" height="13" x="4" y="7" rx="2" stroke="currentColor" strokeWidth="2"/></svg> Duration</h3>
              <div className="text-gray-700 text-sm">
                <div>Start Date<br/><span className="font-bold">{consortium.start_date ? new Date(consortium.start_date).toLocaleString('default', { month: 'long', year: 'numeric' }) : '-'}</span></div>
                <div className="mt-2">End Date<br/><span className="font-bold">{consortium.end_date ? new Date(consortium.end_date).toLocaleString('default', { month: 'long', year: 'numeric' }) : (consortium.status === 'Active' ? 'Active' : '-')}</span></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14"/><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 3v4M8 3v4"/></svg> Organizations</h3>
              <div className="text-gray-700 text-sm">
                {organizations.length === 0 ? (
                  <span className="italic text-gray-400">No organizations</span>
                ) : (
                  <div className="flex flex-col gap-2">
                    {organizations.map((org: Organization) => (
                      <div key={org._id} className="flex items-center justify-between border rounded-lg px-3 py-2 bg-gray-50">
                        <div>
                          <div className="font-medium">{org.name}</div>
                        </div>
                        <button
                          className="flex items-center gap-1 border border-gray-300 rounded px-2 py-1 text-xs hover:bg-gray-100"
                          onClick={() => router.push('/consortium-management?tab=Users')}
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>
                          View Users
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg> Consortium Members</h3>
            <div className="text-gray-700 text-sm">
              {usersLoading ? (
                <div className="flex items-center gap-2"><Loader size="sm" /><span>Loading consortium members...</span></div>
              ) : organizationUsers.length === 0 ? (
                <span className="italic text-gray-400">No organization users in this consortium</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {organizationUsers.map((user: User) => (
                    <div key={user._id} className="border rounded px-2 py-1 bg-gray-50 text-xs">
                      {user.name} <span className="text-gray-400">({user.email})</span>
                      <span className="ml-1 text-xs text-blue-600 font-medium">({user.role})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg> Consortium Facilitators</h3>
            <div className="text-gray-700 text-sm">
              {usersLoading ? (
                <div className="flex items-center gap-2"><Loader size="sm" /><span>Loading consortium facilitators...</span></div>
              ) : facilitators.length === 0 ? (
                <span className="italic text-gray-400">No facilitators in this consortium</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {facilitators.map((fac: User) => (
                    <div key={fac._id} className="border rounded px-2 py-1 bg-gray-50 text-xs">
                      {fac.name} <span className="text-gray-400">({fac.email})</span>
                      <span className="ml-1 text-xs text-blue-600 font-medium">({fac.role})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-4 mt-6">
            <div className="text-gray-500 text-sm">Total Consortium Members: {organizationUsers.length + facilitators.length}</div>
            <button
              className="flex items-center gap-2 border border-yellow-400 bg-yellow-400 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-yellow-500 transition cursor-pointer"
              onClick={() => router.push(`/shared-risks?consortiumId=${consortium._id || consortium.id}`)}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>
              View Shared Risks
            </button>
          </div>
          <EditConsortiumModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            consortiumId={consortium._id || consortium.id || ''}
            onUpdated={fetchConsortium}
          />
          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDelete}
            title="Delete Consortium"
            message={`Are you sure you want to delete "${consortium.name}"? This action cannot be undone.`}
            confirmText="Delete Consortium"
            cancelText="Cancel"
            confirmVariant="danger"
            loading={isDeleting}
          />
        </div>
      </div>
    </Layout>
  );
} 