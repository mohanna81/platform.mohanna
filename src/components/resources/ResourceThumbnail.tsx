import React from 'react';
import Image from 'next/image';

interface ResourceThumbnailProps {
  resourceType: string;
  thumbnailUrl?: string;
  fileUrl?: string;
  title: string;
  className?: string;
}

const ResourceThumbnail: React.FC<ResourceThumbnailProps> = ({
  resourceType,
  thumbnailUrl,
  fileUrl,
  title,
  className = ''
}) => {
  // Default thumbnail dimensions
  const defaultClasses = "w-full h-48 object-cover rounded-lg bg-gray-100 flex items-center justify-center";
  const combinedClasses = `${defaultClasses} ${className}`;

  // Function to get default icon based on resource type
  const getDefaultIcon = (type: string) => {
    const iconClasses = "w-16 h-16 text-black";
    
    switch (type) {
      case 'Document':
        return (
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7V3a1 1 0 011-1h8a1 1 0 011 1v4M7 7h10M7 7v10a1 1 0 001 1h8a1 1 0 001-1V7M7 7H5a1 1 0 00-1 1v10a1 1 0 001 1h2m0 0v4a1 1 0 001 1h8a1 1 0 001-1v-4m-10 0h10" />
            </svg>
          </div>
        );
      case 'Image':
        return (
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path strokeWidth="2" d="M21 15l-5-5-4 4-7 7" />
            </svg>
          </div>
        );
      case 'Video Link':
        return (
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" />
              <polygon points="10,9 16,12 10,15" fill="currentColor" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
            <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
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

  // Handle different scenarios
  if (thumbnailUrl) {
    // Custom thumbnail provided
    return (
      <Image
        src={thumbnailUrl}
        alt={`Thumbnail for ${title}`}
        className={combinedClasses}
        width={400}
        height={192}
        onError={(e) => {
          // Fallback to default icon if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }

  if (resourceType === 'Image' && fileUrl) {
    // For images, use the file URL as thumbnail
    return (
      <div className="relative">
        <Image
          src={fileUrl}
          alt={`Thumbnail for ${title}`}
          className={combinedClasses}
          width={400}
          height={192}
          onError={(e) => {
            // Fallback to default icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden absolute inset-0 flex items-center justify-center">
          {getDefaultIcon(resourceType)}
        </div>
      </div>
    );
  }

  if (resourceType === 'Video Link' && fileUrl) {
    // For videos, try to generate thumbnail from URL
    const videoThumbnail = getYouTubeThumbnail(fileUrl) || getVimeoThumbnail(fileUrl);
    
    if (videoThumbnail) {
      return (
        <div className="relative">
          <Image
            src={videoThumbnail}
            alt={`Video thumbnail for ${title}`}
            className={combinedClasses}
            width={400}
            height={192}
            onError={(e) => {
              // Fallback to default icon if thumbnail fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden absolute inset-0 flex items-center justify-center">
            {getDefaultIcon(resourceType)}
          </div>
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black bg-opacity-50 rounded-full p-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="8,5 19,12 8,19" />
              </svg>
            </div>
          </div>
        </div>
      );
    }
  }

  // Default fallback - show icon
  return (
    <div className={combinedClasses}>
      {getDefaultIcon(resourceType)}
    </div>
  );
};

export default ResourceThumbnail; 