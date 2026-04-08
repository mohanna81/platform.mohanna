"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, InputField, Button } from '@/components/common';
import Layout from '@/components/common/Layout';
import { userService, User } from '@/lib/api/services/auth';

// Interface for the API response structure
interface UserResponse {
  message: string;
  success: boolean;
  user: User;
}
import { showToast } from '@/lib/utils/toast';

export default function ProfilePage() {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const userId = typeof window !== 'undefined' ? localStorage.getItem('authUserId') : null;
        if (!userId) throw new Error('User ID not found');
        const res = await userService.getUserById(userId);
        if (res.success && res.data) {
          // Handle the nested user data structure from the API response
          const responseData = res.data as UserResponse;
          const userData = responseData.user || responseData as unknown as User;
          setProfile(userData);
          setName(userData.name || '');
        } else {
          setError(res.error || 'Failed to load profile');
        }
      } catch (e: unknown) {
        setError((e as Error).message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast.error('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      showToast.success(`Image selected: ${file.name}`);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        showToast.error('Failed to read image file');
      };
      reader.readAsDataURL(file);
    } else {
    }
  };

  const handleImageClick = () => {
    const fileInput = document.getElementById('profile-image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    } else {
      console.error('File input not found');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('authUserId') : null;
      if (!userId) throw new Error('User ID not found');
      
      const updateData: { password?: string; name?: string; profilePhoto?: string } = {};
      if (password) updateData.password = password;
      if (name && name !== profile.name) updateData.name = name;
      
      // Include image as base64 if selected
      if (selectedImage && imagePreview) {
        updateData.profilePhoto = imagePreview;
      }
      
      
      const res = await userService.updateProfile(userId, updateData);
      if (res.success) {
        showToast.success('Profile updated successfully');
        setPassword('');
        // Update the profile state with new data
        if (name && name !== profile.name) {
          setProfile({ ...profile, name });
        }
        if (selectedImage && imagePreview) {
          setProfile({ ...profile, profilePhoto: imagePreview });
        }
        // Clear image selection after successful update
        setSelectedImage(null);
        setImagePreview(null);
      } else {
        setError(res.error || 'Failed to update profile');
      }
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Profile">
        <div className="max-w-xl mx-auto mt-10 text-center text-black">Loading...</div>
      </Layout>
    );
  }
  if (error) {
    return (
      <Layout title="Profile">
        <div className="max-w-xl mx-auto mt-10 text-center text-red-600">{error}</div>
      </Layout>
    );
  }
  if (!profile) return null;

  // Attempt to split name into first/last for display
  const [firstName, ...lastNameArr] = (profile.name || '').split(' ');
  const lastName = lastNameArr.join(' ');

  return (
    <Layout title="Profile">
      <div className="max-w-xl mx-auto mt-10">
        <Card className="p-8 bg-white text-black">
          <h2 className="text-2xl font-bold mb-6 text-black">Profile</h2>
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="profile-image-upload"
                name="profile-image"
              />
              <div
                onClick={handleImageClick}
                className="block w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl relative z-10"
              >
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Profile Preview"
                    fill
                    className="rounded-full object-cover"
                  />
                ) : profile.profilePhoto && profile.profilePhoto.startsWith('data:image') ? (
                  <Image
                    src={profile.profilePhoto}
                    alt="Profile"
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  profile.name ? profile.name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center pointer-events-none">
                <div className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Change Photo
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleImageClick}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Click here to upload image
            </button>
            <div className="font-semibold text-lg text-black">{firstName} {lastName}</div>
            <div className="text-sm text-gray-700">{profile.email}</div>
            {selectedImage && (
              <div className="text-xs text-green-600 mt-1">
                ✓ Image selected: {selectedImage.name} ({Math.round(selectedImage.size / 1024)}KB)
              </div>
            )}
            {imagePreview && (
              <div className="text-xs text-blue-600 mt-1">
                ✓ Preview ready ({Math.round(imagePreview.length / 1024)}KB base64)
              </div>
            )}
          </div>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label="Full Name" 
                  value={name} 
                  onChange={setName}
                  size="md"
                  helperText="Your display name"
                  placeholder="Enter your full name"
                />
                <InputField 
                  label="Email Address" 
                  type="email"
                  value={profile.email || ''} 
                  disabled 
                  size="md"
                  helperText="Your login email"
                />
              </div>
            </div>

            {/* Account Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label="Role" 
                  value={profile.role || ''} 
                  disabled 
                  size="md"
                  helperText="Your current role"
                />
                <InputField 
                  label="Status" 
                  value={profile.status || ''} 
                  disabled 
                  size="md"
                  helperText="Account status"
                />
              </div>
              <InputField 
                label="Member Since" 
                value={new Date(profile.createdAt || '').toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} 
                disabled 
                size="md"
                helperText="When you joined the platform"
              />
            </div>

            {/* Password Change Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Change Password</h3>
              <InputField 
                label="New Password" 
                type="password" 
                value={password} 
                onChange={setPassword} 
                size="md"
                placeholder="Enter your new password (optional)"
                helperText="Leave blank to keep current password"
                fullWidth
              />
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                variant="primary" 
                loading={saving} 
                disabled={saving || (name === profile.name && !password.trim() && !selectedImage)} 
                fullWidth
              >
                {saving ? 'Updating Profile...' : 'Update Profile'}
              </Button>
            </div>
            
            {error && (
              <div className="text-red-600 text-sm mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}
          </form>
        </Card>
      </div>
    </Layout>
  );
} 