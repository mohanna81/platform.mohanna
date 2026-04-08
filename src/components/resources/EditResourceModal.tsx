import React, { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import InputField from '@/components/common/InputField';
import TextArea from '@/components/common/TextArea';
import Dropdown from '@/components/common/Dropdown';
import Button from '@/components/common/Button';
import { resourcesService, Resource, UpdateResourceRequest } from '@/lib/api/services/resources';
import { showToast } from '@/lib/utils/toast';
import { API_CONFIG } from '@/lib/api/config';
import { cookieUtils, AUTH_COOKIES } from '@/lib/utils/cookies';

export type ResourceType = 'Document' | 'Image' | 'Video Link';

interface EditResourceModalProps {
  open: boolean;
  onClose: () => void;
  resource: Resource | null;
  onResourceUpdated?: (updatedResource: Resource) => void;
}

// Helper to upload files as base64
async function uploadFileBase64(file: File): Promise<string> {
  // Convert file to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  
  // Get auth token from cookies
  const token = cookieUtils.getCookie(AUTH_COOKIES.TOKEN);
  
  // Determine if this is a video file
  const isVideo = file.type.startsWith('video/');
  
  // Use different endpoints based on file type
  const uploadUrl = isVideo 
    ? `${API_CONFIG.BASE_URL}/upload-media`
    : `${API_CONFIG.BASE_URL}/upload-file`;
  
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  
  // Prepare request body based on file type
  const requestBody = isVideo 
    ? { mediaType: 'video', file: base64 }
    : { file: base64 };
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Upload error response:', errorData);
    throw new Error(errorData.message || `File upload failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.fileUrl || data.url;
}

const resourceTypeOptions = [
  { value: 'Document', label: 'Document' },
  { value: 'Image', label: 'Image' },
  { value: 'Video Link', label: 'Video' },
];

const EditResourceModal: React.FC<EditResourceModalProps> = ({ 
  open, 
  onClose, 
  resource, 
  onResourceUpdated 
}) => {
  const [form, setForm] = useState<UpdateResourceRequest>({
    title: '',
    description: '',
    source: '',
    resourceType: 'Document',
    fileUrl: '',
    thumbnailUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [videoInputType, setVideoInputType] = useState<'file' | 'link'>('link');

  // Initialize form when resource changes
  useEffect(() => {
    if (resource) {
      setForm({
        title: resource.title,
        description: resource.description,
        source: resource.source,
        resourceType: resource.resourceType as ResourceType,
        fileUrl: resource.fileUrl,
        thumbnailUrl: resource.thumbnailUrl || '',
      });
      
      // Reset file selection
      setSelectedFile(null);
      setFileName('');
      
      // Set video input type based on current resource
      if (resource.resourceType === 'Video Link') {
        // If it's a video and has a file URL that looks like a file (not a link), default to file
        const isFileUrl = resource.fileUrl && !resource.fileUrl.startsWith('http');
        setVideoInputType(isFileUrl ? 'file' : 'link');
      }
    }
  }, [resource]);

  function handleChange(field: keyof UpdateResourceRequest, value: string | ResourceType) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setFileName(file ? file.name : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource) return;

    setSubmitting(true);
    let fileUrl = form.fileUrl;
    
    try {
      // Handle file upload if a new file is selected
      if (selectedFile) {
        const fileType = form.resourceType === 'Image' ? 'image' : form.resourceType === 'Video Link' ? 'video' : 'document';
        showToast.loading(`Uploading ${fileType}...`);
        fileUrl = await uploadFileBase64(selectedFile);
        showToast.success(`${fileType} uploaded successfully!`);
      } else if (form.resourceType === 'Video Link' && videoInputType === 'link') {
        // For video links, use the URL directly
        fileUrl = form.fileUrl;
      }

      // Prepare the update data
      const updateData = {
        ...form,
        fileUrl,
      };

      const response = await resourcesService.updateResource(resource._id, updateData);
      
      if (response.success) {
        showToast.success('Resource updated successfully!');
        onClose();
        
        // Reset file selection
        setSelectedFile(null);
        setFileName('');
        
        // Call callback with updated resource
        if (onResourceUpdated) {
          const updatedResource = { ...resource, ...updateData };
          onResourceUpdated(updatedResource as Resource);
        }
      } else {
        showToast.error(response.error || 'Failed to update resource');
      }
    } catch (error) {
      console.error('Error updating resource:', error);
      showToast.error(error instanceof Error ? error.message : 'Failed to update resource');
    } finally {
      setSubmitting(false);
    }
  };

  if (!resource) return null;

  return (
    <Modal isOpen={open} onClose={onClose} title="Edit Resource">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Title"
          value={form.title}
          onChange={(v) => handleChange('title', v)}
          type="text"
          required
          fullWidth
        />
        
        <TextArea
          label="Description"
          value={form.description}
          onChange={(v) => handleChange('description', v)}
          required
          fullWidth
        />
        
        <Dropdown
          label="Resource Type"
          value={form.resourceType}
          onChange={(v) => handleChange('resourceType', v as ResourceType)}
          options={resourceTypeOptions}
          required
          fullWidth
        />
        
        <InputField
          label="Source"
          value={form.source}
          onChange={(v) => handleChange('source', v)}
          type="text"
          required
          fullWidth
        />
        
        {/* File Upload Section */}
        {(form.resourceType === 'Document' || form.resourceType === 'Image') && (
          <div>
            <label className="block text-sm font-medium text-black mb-1">Upload New {form.resourceType}</label>
            <div className="flex items-center gap-3">
              <input
                id="edit-resource-file-input"
                type="file"
                accept={form.resourceType === 'Document' ? '.pdf,.doc,.docx,.xls,.xlsx,.csv' : 'image/*'}
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('edit-resource-file-input')?.click()}
              >
                Choose File
              </Button>
              <span className="text-sm text-gray-700 truncate max-w-xs">{fileName || 'No file chosen'}</span>
            </div>
            {!selectedFile && (
              <div className="mt-2">
                <InputField
                  label="Current File URL"
                  value={form.fileUrl}
                  onChange={(v) => handleChange('fileUrl', v)}
                  type="url"
                  fullWidth
                  placeholder="https://..."
                  helperText="Or update the file URL directly"
                />
              </div>
            )}
          </div>
        )}
        
        {form.resourceType === 'Video Link' && (
          <div className="space-y-2">
            <div className="flex gap-4 items-center">
              <label className="font-medium text-black">Video Input:</label>
              <label className="flex items-center gap-1 text-black">
                <input
                  type="radio"
                  name="videoInputType"
                  value="file"
                  checked={videoInputType === 'file'}
                  onChange={() => setVideoInputType('file')}
                />
                Upload File
              </label>
              <label className="flex items-center gap-1 text-black">
                <input
                  type="radio"
                  name="videoInputType"
                  value="link"
                  checked={videoInputType === 'link'}
                  onChange={() => setVideoInputType('link')}
                />
                Insert Link
              </label>
            </div>
            {videoInputType === 'file' ? (
              <div>
                <label className="block text-sm font-medium text-black mb-1">Upload Video File</label>
                <div className="flex items-center gap-3">
                  <input
                    id="edit-video-file-input"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('edit-video-file-input')?.click()}
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-gray-700 truncate max-w-xs">{fileName || 'No file chosen'}</span>
                </div>
              </div>
            ) : (
              <InputField
                label="Video URL"
                value={form.fileUrl}
                onChange={(v) => handleChange('fileUrl', v)}
                type="url"
                fullWidth
                placeholder="https://..."
              />
            )}
          </div>
        )}
        
        <InputField
          label="Thumbnail URL (Optional)"
          value={form.thumbnailUrl}
          onChange={(v) => handleChange('thumbnailUrl', v)}
          type="url"
          fullWidth
          placeholder="https://example.com/thumbnail.jpg"
          helperText="Provide a custom thumbnail image URL. If not provided, a default icon will be used."
        />
        
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Update Resource
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditResourceModal; 