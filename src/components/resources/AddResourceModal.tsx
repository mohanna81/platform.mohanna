import React, { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import InputField from '@/components/common/InputField';
import TextArea from '@/components/common/TextArea';
import Dropdown from '@/components/common/Dropdown';
import Button from '@/components/common/Button';
import { resourcesService } from '@/lib/api/services/resources';
import { showToast } from '@/lib/utils/toast';
import { API_CONFIG } from '@/lib/api/config';
import { cookieUtils, AUTH_COOKIES } from '@/lib/utils/cookies';

export type ResourceType = 'Document' | 'Image' | 'Video Link';

interface AddResourceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: AddResourceFormData) => void;
}

export interface AddResourceFormData {
  title: string;
  description: string;
  type: ResourceType;
  file?: File | null;
  videoUrl?: string;
  source?: string;
  videoInputType?: 'file' | 'link';
  thumbnailUrl?: string; // Optional thumbnail URL
}

const resourceTypeOptions = [
  { value: 'Document', label: 'Document' },
  { value: 'Image', label: 'Image' },
  { value: 'Video Link', label: 'Video' },
];

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

const AddResourceModal: React.FC<AddResourceModalProps> = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState<AddResourceFormData>({
    title: '',
    description: '',
    type: 'Document',
    file: undefined,
    videoUrl: '',
    source: '',
    videoInputType: 'link',
    thumbnailUrl: '', // Add thumbnail URL field
  });
  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  // Reset form to initial state
  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      type: 'Document',
      file: undefined,
      videoUrl: '',
      source: '',
      videoInputType: 'link',
      thumbnailUrl: '',
    });
    setSubmitting(false);
    setFileName("");
  };

  function handleChange(field: 'title' | 'description' | 'videoUrl', value: string): void;
  function handleChange(field: 'type', value: ResourceType): void;
  function handleChange(field: 'file', value: File | null): void;
  function handleChange(field: 'source', value: string): void;
  function handleChange(field: 'videoInputType', value: 'file' | 'link'): void;
  function handleChange(field: 'thumbnailUrl', value: string): void; // Add handler for thumbnailUrl
  function handleChange(field: keyof AddResourceFormData, value: string | ResourceType | File | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, file }));
    setFileName(file ? file.name : "");
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    let fileUrl = '';
    
    try {
      if (form.file) {
        // Use unified file upload endpoint for all file types
        const fileType = form.type === 'Image' ? 'image' : form.type === 'Video Link' ? 'video' : 'document';
        showToast.loading(`Uploading ${fileType}...`);
        fileUrl = await uploadFileBase64(form.file);
        showToast.success(`${fileType} uploaded successfully!`);
      } else if (form.type === 'Video Link' && form.videoInputType === 'link') {
        // For video links, use the URL directly
        fileUrl = form.videoUrl || '';
      } else {
        throw new Error('Please select a file or provide a video URL');
      }

      // Prepare the resource data
      const resourceData = {
        title: form.title,
        description: form.description,
        source: form.source || '',
        resourceType: form.type,
        fileUrl,
        thumbnailUrl: form.thumbnailUrl || '',
        createdBy: '6870be2d200ac8851e94bce9',
        organization: ['686e45ca5fa9a84b5b4d42fc'],
        consortium: ['686e45ca5fa9a84b5b4d42fc'],
      };

      // Create the resource
      const response = await resourcesService.createResource(resourceData);
      
      if (response.success) {
        showToast.success('Resource created successfully!');
        onClose();
        // Reset form
        setForm({
          title: '',
          description: '',
          type: 'Document',
          file: undefined,
          videoUrl: '',
          source: '',
          videoInputType: 'link',
          thumbnailUrl: '',
        });
        setFileName('');
        // Call onSubmit callback if provided
        if (onSubmit) {
          onSubmit(form);
        }
      } else {
        showToast.error(response.error || 'Failed to create resource');
      }
    } catch (error) {
      console.error('Error creating resource:', error);
      showToast.error(error instanceof Error ? error.message : 'Failed to create resource');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Add Resource" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Title"
          value={form.title}
          onChange={(v) => handleChange('title', v)}
          required
          fullWidth
        />
        <TextArea
          label="Description"
          value={form.description}
          onChange={(v) => handleChange('description', v)}
          required
          fullWidth
          rows={3}
        />
        <InputField
          label="Source"
          value={form.source}
          onChange={(v) => handleChange('source', v)}
          type="text"
          required
          fullWidth
        />
        {/* <InputField
          label="Thumbnail URL (Optional)"
          value={form.thumbnailUrl}
          onChange={(v) => handleChange('thumbnailUrl', v)}
          type="url"
          fullWidth
          placeholder="https://example.com/thumbnail.jpg"
          helperText="Provide a custom thumbnail image URL. If not provided, a default icon will be used."
        /> */}
        <Dropdown
          label="Resource Type"
          options={resourceTypeOptions}
          value={form.type}
          onChange={(v) => handleChange('type', v as ResourceType)}
          required
          fullWidth
        />
        {(form.type === 'Document' || form.type === 'Image') && (
          <div>
            <label className="block text-sm font-medium text-black mb-1">Upload {form.type}</label>
            <div className="flex items-center gap-3">
              <input
                id="resource-file-input"
                type="file"
                accept={form.type === 'Document' ? '.pdf,.doc,.docx,.xls,.xlsx,.csv' : 'image/*'}
                onChange={handleFileChange}
                required
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('resource-file-input')?.click()}
              >
                Choose File
              </Button>
              <span className="text-sm text-gray-700 truncate max-w-xs">{fileName || 'No file chosen'}</span>
            </div>
          </div>
        )}
        {form.type === 'Video Link' && (
          <div className="space-y-2">
            <div className="flex gap-4 items-center">
              <label className="font-medium text-black">Video Input:</label>
              <label className="flex items-center gap-1 text-black">
                <input
                  type="radio"
                  name="videoInputType"
                  value="file"
                  checked={form.videoInputType === 'file'}
                  onChange={() => handleChange('videoInputType', 'file')}
                />
                Upload File
              </label>
              <label className="flex items-center gap-1 text-black">
                <input
                  type="radio"
                  name="videoInputType"
                  value="link"
                  checked={form.videoInputType === 'link'}
                  onChange={() => handleChange('videoInputType', 'link')}
                />
                Insert Link
              </label>
            </div>
            {form.videoInputType === 'file' ? (
              <div>
                <label className="block text-sm font-medium text-black mb-1">Upload Video File</label>
                <div className="flex items-center gap-3">
                  <input
                    id="video-file-input"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    required={form.type === 'Video Link' && form.videoInputType === 'file'}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('video-file-input')?.click()}
                  >
                    Choose File
                  </Button>
                  <span className="text-sm text-gray-700 truncate max-w-xs">{fileName || 'No file chosen'}</span>
                </div>
              </div>
            ) : (
              <InputField
                label="Video URL"
                value={form.videoUrl}
                onChange={(v) => handleChange('videoUrl', v)}
                type="url"
                required={form.type === 'Video Link' && form.videoInputType === 'link'}
                fullWidth
                placeholder="https://..."
              />
            )}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting} className="text-black">
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Add Resource
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddResourceModal; 