'use client';

import React, { useState } from 'react';
import {
  Button,
  InputField,
  Dropdown,
  TextArea,
  Checkbox,
  RadioGroup,
  Card,
  Modal
} from '@/components/common';

export default function ComponentsDemo() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    message: '',
    newsletter: false,
    notification: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const dropdownOptions = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'billing', label: 'Billing Question' },
    { value: 'other', label: 'Other' },
  ];

  const radioOptions = [
    { value: 'email', label: 'Email notifications' },
    { value: 'sms', label: 'SMS notifications' },
    { value: 'both', label: 'Both email and SMS' },
    { value: 'none', label: 'No notifications' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reusable Components Demo
          </h1>
          <p className="text-gray-600">
            A showcase of all the reusable components in the common folder
          </p>
        </div>

        {/* Button Components */}
        <Card title="Button Components" className="mb-8">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small Button</Button>
              <Button size="md">Medium Button</Button>
              <Button size="lg">Large Button</Button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button loading>Loading Button</Button>
              <Button disabled>Disabled Button</Button>
              <Button fullWidth>Full Width Button</Button>
            </div>
          </div>
        </Card>

        {/* Form Components */}
        <Card title="Form Components" className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              required
            />
            
            <InputField
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              required
              helperText="We'll never share your email"
            />
            
            <Dropdown
              label="Category"
              placeholder="Select a category"
              options={dropdownOptions}
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              required
            />
            
            <InputField
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone number"
              size="md"
            />
          </div>
          
          <div className="mt-6">
            <TextArea
              label="Message"
              placeholder="Enter your message"
              value={formData.message}
              onChange={(value) => setFormData({ ...formData, message: value })}
              rows={4}
              maxLength={500}
              helperText="Maximum 500 characters"
            />
          </div>
          
          <div className="mt-6 space-y-4">
            <Checkbox
              label="Subscribe to newsletter"
              checked={formData.newsletter}
              onChange={(checked) => setFormData({ ...formData, newsletter: checked })}
            />
            
            <RadioGroup
              label="Notification Preferences"
              options={radioOptions}
              value={formData.notification}
              onChange={(value) => setFormData({ ...formData, notification: value })}
            />
          </div>
        </Card>

        {/* Modal Demo */}
        <Card title="Modal Component" className="mb-8">
          <div className="space-y-4">
            <Button onClick={() => setIsModalOpen(true)}>
              Open Modal
            </Button>
            
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Example Modal"
              size="md"
            >
              <div className="space-y-4">
                <p className="text-gray-600">
                  This is an example modal component. You can put any content here.
                </p>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsModalOpen(false)}>
                    Confirm
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        </Card>

        {/* Error States */}
        <Card title="Error States" className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Email"
              type="email"
              placeholder="Enter your email"
              error="Please enter a valid email address"
            />
            
            <Dropdown
              label="Category"
              placeholder="Select a category"
              options={dropdownOptions}
              error="Please select a category"
            />
            
            <TextArea
              label="Message"
              placeholder="Enter your message"
              error="Message is required"
            />
            
            <Checkbox
              label="Accept terms and conditions"
              error="You must accept the terms and conditions"
            />
          </div>
        </Card>

        {/* Different Sizes */}
        <Card title="Component Sizes" className="mb-8">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Small Size</h4>
              <div className="flex flex-wrap gap-4">
                <InputField
                  placeholder="Small input"
                  size="sm"
                />
                <Button size="sm">Small Button</Button>
                <Dropdown
                  placeholder="Small dropdown"
                  options={dropdownOptions}
                  size="sm"
                />
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Large Size</h4>
              <div className="flex flex-wrap gap-4">
                <InputField
                  placeholder="Large input"
                  size="lg"
                />
                <Button size="lg">Large Button</Button>
                <Dropdown
                  placeholder="Large dropdown"
                  options={dropdownOptions}
                  size="lg"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 