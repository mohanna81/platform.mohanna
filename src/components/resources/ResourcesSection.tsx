import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resourcesService, Resource } from '@/lib/api/services/resources';
import { showToast } from '@/lib/utils/toast';
import ResourceThumbnail from './ResourceThumbnail';
import EditResourceModal from './EditResourceModal';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Loader from '@/components/common/Loader';
import { useAuth } from '@/lib/auth/AuthContext';

type TabName = 'All Resources' | 'Documents' | 'Videos' | 'Images';

const sectionTitles: Record<TabName, string> = {
  'All Resources': 'All Resources',
  'Documents': 'Documents & Publications',
  'Videos': 'Videos & Webinars',
  'Images': 'Images',
};

const sectionSubtitles: Record<TabName, string> = {
  'All Resources': 'Curated collection of resources on consortium risk management',
  'Documents': 'Curated collection of resources on consortium risk management',
  'Videos': 'Video resources on consortium risk management',
  'Images': 'Image resources on consortium risk management',
};

interface ResourcesSectionProps {
  activeTab: TabName;
  search?: string;
  onRefreshRef?: React.MutableRefObject<(() => void) | null>;
}

const ResourcesSection: React.FC<ResourcesSectionProps> = ({ activeTab, search = '', onRefreshRef }) => {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  // Check if user can edit/delete resources
  const canEditResources = user && (user.role === 'Super_user' || user.role === 'Admin');

  // Function to fetch resources
  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await resourcesService.getResources();
      if (res.success && Array.isArray(res.data)) {
        setResources(res.data);
      } else {
        setResources([]);
        showToast.error('Failed to fetch resources');
      }
    } catch {
      setResources([]);
      showToast.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchResources();
  }, []);

  // Expose refresh function via ref
  useEffect(() => {
    if (onRefreshRef) {
      onRefreshRef.current = fetchResources;
    }
  }, [onRefreshRef]);

  // Tab filtering
  let filteredResources: Resource[] = Array.isArray(resources) ? resources : [];
  if (activeTab === 'Documents') {
    filteredResources = filteredResources.filter((r) => r.resourceType === 'Document');
  } else if (activeTab === 'Videos') {
    filteredResources = filteredResources.filter((r) => r.resourceType === 'Video Link');
  } else if (activeTab === 'Images') {
    filteredResources = filteredResources.filter((r) => r.resourceType === 'Image');
  }

  // Search filtering
  if (search.trim()) {
    const lower = search.trim().toLowerCase();
    filteredResources = filteredResources.filter(
      (r) => r.title.toLowerCase().includes(lower) || r.description.toLowerCase().includes(lower)
    );
  }

  // Icon by type
  const getIcon = (type: string) => {
    if (type === 'Document') {
      return (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7V3a1 1 0 011-1h8a1 1 0 011 1v4M7 7h10M7 7v10a1 1 0 001 1h8a1 1 0 001-1V7M7 7H5a1 1 0 00-1 1v10a1 1 0 001 1h2m0 0v4a1 1 0 001 1h8a1 1 0 001-1v-4m-10 0h10" />
        </svg>
      );
    } else if (type === 'Image') {
      return (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path strokeWidth="2" d="M21 15l-5-5-4 4-7 7" />
        </svg>
      );
    } else if (type === 'Video Link') {
      return (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" />
          <polygon points="10,9 16,12 10,15" fill="currentColor" />
        </svg>
      );
    }
    return null;
  };

  const handleEditResource = (resource: Resource) => {
    setSelectedResource(resource);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (resource: Resource) => {
    setResourceToDelete(resource);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resourceToDelete) return;

    setDeleting(true);
    try {
      const response = await resourcesService.deleteResource(resourceToDelete._id);
      
      if (response.success) {
        showToast.success('Resource deleted successfully!');
        // Remove the resource from the list
        setResources(prev => prev.filter(r => r._id !== resourceToDelete._id));
      } else {
        showToast.error(response.error || 'Failed to delete resource');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      showToast.error(error instanceof Error ? error.message : 'Failed to delete resource');
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setResourceToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setResourceToDelete(null);
  };

  const handleResourceUpdated = (updatedResource: Resource) => {
    // Update the resource in the list
    setResources(prev => prev.map(r => r._id === updatedResource._id ? updatedResource : r));
  };

  const handleResourceClick = (resource: Resource) => {
    router.push(`/resources/${resource._id}`);
  };

  return (
    <div className="bg-white border border-[#e5eaf1] rounded-xl p-4 sm:p-8">
      <div className="text-2xl font-bold text-[#0b1320] mb-1">{sectionTitles[activeTab]}</div>
      <div className="text-base text-[#7b849b] mb-6">{sectionSubtitles[activeTab]}</div>
      {loading ? (
        <div className="py-12">
          <Loader size="lg" variant="default" />
          <p className="text-center text-gray-500 mt-4">Loading resources...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.length === 0 ? (
            <div className="col-span-full text-center text-gray-400">No resources found.</div>
          ) : (
            filteredResources.map((item) => (
              <div 
                key={item._id} 
                className="bg-white border border-[#e5eaf1] rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={() => handleResourceClick(item)}
              >
                {/* Thumbnail */}
                <div className="relative">
                  <ResourceThumbnail
                    resourceType={item.resourceType}
                    thumbnailUrl={item.thumbnailUrl}
                    fileUrl={item.fileUrl}
                    title={item.title}
                  />
                  {/* Resource type badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getIcon(item.resourceType)}
                      <span className="ml-1">{item.resourceType}</span>
                    </span>
                  </div>
                  
                  {/* Admin actions */}
                  {canEditResources && (
                    <div className="absolute top-3 right-3 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditResource(item);
                        }}
                        className="p-1 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors cursor-pointer"
                        title="Edit Resource"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(item);
                        }}
                        className="p-1 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Resource"
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4">
                  {/* Title */}
                  <h3 className="font-bold text-[#0b1320] text-base mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-[#222b3a] text-sm mb-3 line-clamp-3 group-hover:text-blue-600 transition-colors">
                    {item.description}
                  </p>
                  
                  {/* Meta information */}
                  <div className="flex flex-wrap gap-2 mb-4 text-xs text-[#7b849b]">
                    {item.source && <span>Source: {item.source}</span>}
                  </div>
                  
                  {/* View Details Hint */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Click to view details
                    </span>
                  </div>
                  
                  {/* Action Button */}
                  <a 
                    href={item.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block w-full border border-[#e5eaf1] rounded-lg px-4 py-2 text-[#0b1320] font-medium flex items-center justify-center gap-2 hover:bg-[#f5f7fa] transition-colors duration-200"
                    onClick={(e) => e.stopPropagation()}
                    title="Opens in new tab"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {item.resourceType === 'Video Link' ? 'Watch Video' : 'Access Resource'}
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Edit Resource Modal */}
      <EditResourceModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedResource(null);
        }}
        resource={selectedResource}
        onResourceUpdated={handleResourceUpdated}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the resource "${resourceToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default ResourcesSection; 