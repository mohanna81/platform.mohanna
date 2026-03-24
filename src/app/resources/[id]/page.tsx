"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { resourcesService, Resource } from '@/lib/api/services/resources';
import { showToast } from '@/lib/utils/toast';
import Layout from '@/components/common/Layout';
import Loader from '@/components/common/Loader';
import ResourcePreview from '@/components/resources/ResourcePreview';

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);

  const resourceId = params.id as string;

  useEffect(() => {
    const fetchResource = async () => {
      if (!resourceId) return;
      
      setLoading(true);
      try {
        const res = await resourcesService.getResources();
        if (res.success && Array.isArray(res.data)) {
          const foundResource = res.data.find(r => r._id === resourceId);
          if (foundResource) {
            setResource(foundResource);
          } else {
            showToast.error('Resource not found');
            router.push('/resources');
          }
        } else {
          showToast.error('Failed to fetch resource');
          router.push('/resources');
        }
      } catch  {
        showToast.error('Failed to fetch resource');
        router.push('/resources');
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, [resourceId, router]);

  const handleBackToResources = () => {
    router.push('/resources');
  };

  const handleOpenResource = () => {
    if (resource?.fileUrl) {
      window.open(resource.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getIcon = (type: string) => {
    if (type === 'Document') {
      return (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7V3a1 1 0 011-1h8a1 1 0 011 1v4M7 7h10M7 7v10a1 1 0 001 1h8a1 1 0 001-1V7M7 7H5a1 1 0 00-1 1v10a1 1 0 001 1h2m0 0v4a1 1 0 001 1h8a1 1 0 001-1v-4m-10 0h10" />
        </svg>
      );
    } else if (type === 'Image') {
      return (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path strokeWidth="2" d="M21 15l-5-5-4 4-7 7" />
        </svg>
      );
    } else if (type === 'Video Link') {
      return (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" />
          <polygon points="10,9 16,12 10,15" fill="currentColor" />
        </svg>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4 sm:p-8 md:p-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader size="lg" variant="default" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!resource) {
    return (
      <Layout>
        <div className="p-4 sm:p-8 md:p-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Resource Not Found</h1>
            <button
              onClick={handleBackToResources}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Resources
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 md:p-4">
        {/* Back Button */}
        <button
          onClick={handleBackToResources}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Resources
        </button>

        <div className="bg-white border border-[#e5eaf1] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-[#e5eaf1]">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {getIcon(resource.resourceType)}
                    <span className="ml-2">{resource.resourceType}</span>
                  </span>
                  {resource.source && (
                    <span className="text-sm text-gray-500">Source: {resource.source}</span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-[#0b1320] mb-2">{resource.title}</h1>
                <p className="text-sm text-gray-500">
                  Created on {new Date(resource.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             {/* Preview */}
               <div>
                 <h3 className="text-lg font-semibold text-[#0b1320] mb-4">Preview</h3>
                 <div className="border border-[#e5eaf1] rounded-lg overflow-hidden">
                   <ResourcePreview
                     resourceType={resource.resourceType}
                     thumbnailUrl={resource.thumbnailUrl}
                     fileUrl={resource.fileUrl}
                     title={resource.title}
                     className="h-64"
                   />
                 </div>
               </div>

              {/* Details */}
              <div>
                <h3 className="text-lg font-semibold text-[#0b1320] mb-4">Description</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-[#222b3a] leading-relaxed whitespace-pre-wrap">
                    {resource.description}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleOpenResource}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {resource.resourceType === 'Video Link' ? 'Watch Video' : 'Open Resource'}
                  </button>
                  
                  <button
                    onClick={handleBackToResources}
                    className="w-full border border-[#e5eaf1] text-[#0b1320] py-3 px-4 rounded-lg font-medium hover:bg-[#f5f7fa] transition-colors"
                  >
                    Back to Resources
                  </button>
                </div>

                {/* Additional Info */}
                <div className="mt-6 pt-6 border-t border-[#e5eaf1]">
                  <h4 className="text-sm font-medium text-[#0b1320] mb-2">Resource Information</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium">{resource.resourceType}</span>
                    </div>
                    {resource.source && (
                      <div className="flex justify-between">
                        <span>Source:</span>
                        <span className="font-medium">{resource.source}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span className="font-medium">
                        {new Date(resource.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span className="font-medium">
                        {new Date(resource.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
