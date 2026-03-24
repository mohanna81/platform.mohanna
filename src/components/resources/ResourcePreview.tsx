import React, { useState } from 'react';
import Image from 'next/image';

interface ResourcePreviewProps {
  resourceType: string;
  thumbnailUrl?: string;
  fileUrl?: string;
  title: string;
  className?: string;
}

const ResourcePreview: React.FC<ResourcePreviewProps> = ({
  resourceType,
  thumbnailUrl,
  fileUrl,
  title,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Default preview dimensions
  const defaultClasses = "w-full h-64 object-cover rounded-lg bg-gray-100 flex items-center justify-center";
  const combinedClasses = `${defaultClasses} ${className}`;

  // Function to get file extension
  const getFileExtension = (url: string) => {
    const match = url.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : '';
  };

  // Function to get document preview
  const getDocumentPreview = (url: string) => {
    const extension = getFileExtension(url);
    const iconClasses = "w-20 h-20";
    
    switch (extension) {
      case 'pdf':
        return (
          <div className="text-center">
            <div className="bg-red-100 rounded-lg p-4 border border-red-200">
              <svg className={`${iconClasses} text-red-600`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mt-3 font-medium">PDF Document</p>
            <p className="text-xs text-gray-400 mt-1">Click to view in browser</p>
          </div>
        );
      case 'doc':
      case 'docx':
        return (
          <div className="text-center">
            <div className="bg-blue-100 rounded-lg p-4 border border-blue-200">
              <svg className={`${iconClasses} text-blue-600`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mt-3 font-medium">Word Document</p>
            <p className="text-xs text-gray-400 mt-1">Click to download</p>
          </div>
        );
      case 'xls':
      case 'xlsx':
        return (
          <div className="text-center">
            <div className="bg-green-100 rounded-lg p-4 border border-green-200">
              <svg className={`${iconClasses} text-green-600`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mt-3 font-medium">Excel Spreadsheet</p>
            <p className="text-xs text-gray-400 mt-1">Click to download</p>
          </div>
        );
      case 'ppt':
      case 'pptx':
        return (
          <div className="text-center">
            <div className="bg-orange-100 rounded-lg p-4 border border-orange-200">
              <svg className={`${iconClasses} text-orange-600`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mt-3 font-medium">PowerPoint Presentation</p>
            <p className="text-xs text-gray-400 mt-1">Click to download</p>
          </div>
        );
      case 'txt':
        return (
          <div className="text-center">
            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
              <svg className={`${iconClasses} text-gray-600`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mt-3 font-medium">Text Document</p>
            <p className="text-xs text-gray-400 mt-1">Click to view</p>
          </div>
        );
      default:
        return (
          <div className="text-center">
            <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
              <svg className={`${iconClasses} text-gray-600`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mt-3 font-medium">Document</p>
            <p className="text-xs text-gray-400 mt-1">Click to download</p>
          </div>
        );
    }
  };

  // Function to generate YouTube thumbnail from URL
  const getYouTubeThumbnail = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId[1]}/maxresdefault.jpg`;
    }
    return null;
  };

  // Function to generate Vimeo thumbnail from URL
  const getVimeoThumbnail = (url: string) => {
    const videoId = url.match(/vimeo\.com\/(\d+)/i);
    if (videoId) {
      // Note: Vimeo requires API call for thumbnails, this is a placeholder
      return null;
    }
    return null;
  };

  // Handle different resource types
  if (resourceType === 'Document' && fileUrl) {
    return (
      <div className={combinedClasses}>
        {getDocumentPreview(fileUrl)}
      </div>
    );
  }

  if (resourceType === 'Image' && fileUrl && !imageError) {
    return (
      <div className="relative">
        <Image
          src={fileUrl}
          alt={`Preview of ${title}`}
          className={combinedClasses}
          width={600}
          height={256}
          onError={() => setImageError(true)}
        />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          Image Preview
        </div>
      </div>
    );
  }

  if (resourceType === 'Video Link' && fileUrl) {
    const videoThumbnail = getYouTubeThumbnail(fileUrl) || getVimeoThumbnail(fileUrl);
    
    if (videoThumbnail && !videoError) {
      return (
        <div className="relative">
          <Image
            src={videoThumbnail}
            alt={`Video preview for ${title}`}
            className={combinedClasses}
            width={600}
            height={256}
            onError={() => setVideoError(true)}
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black bg-opacity-50 rounded-full p-4 hover:bg-opacity-70 transition-all duration-200">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="8,5 19,12 8,19" />
              </svg>
            </div>
          </div>
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            Video Preview
          </div>
        </div>
      );
    }
  }

  // Fallback for any type without proper preview
  if (thumbnailUrl && !imageError) {
    return (
      <div className="relative">
        <Image
          src={thumbnailUrl}
          alt={`Preview for ${title}`}
          className={combinedClasses}
          width={600}
          height={256}
          onError={() => setImageError(true)}
        />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          Preview
        </div>
      </div>
    );
  }

  // Default fallback - show generic preview
  return (
    <div className={combinedClasses}>
      <div className="text-center">
        <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
          <svg className="w-20 h-20 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600 mt-3 font-medium">{resourceType}</p>
        <p className="text-xs text-gray-400 mt-1">Click to access</p>
      </div>
    </div>
  );
};

export default ResourcePreview;
