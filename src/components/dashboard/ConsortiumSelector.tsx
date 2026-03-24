'use client';

import React, { useEffect, useState } from 'react';
import Dropdown from '@/components/common/Dropdown';
import { fetchConsortiaByRole } from '@/lib/api/services/consortia';
import { useAuth } from '@/lib/auth/AuthContext';
import { useConsortium } from '@/lib/context/ConsortiumContext';

interface ConsortiumSelectorProps {
  onConsortiumChange?: (consortiumId: string) => void;
  className?: string;
}

const ConsortiumSelector: React.FC<ConsortiumSelectorProps> = ({ 
  onConsortiumChange,
  className = ''
}) => {
  const { user } = useAuth();
  const { selectedConsortium, setSelectedConsortium, shouldShowConsortiumSelector } = useConsortium();
  const [consortia, setConsortia] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shouldShowConsortiumSelector && user) {
      const fetchConsortia = async () => {
        setLoading(true);
        try {
          const consortiaData = await fetchConsortiaByRole(user);
          setConsortia(consortiaData);
          
          // Set the first consortium as default if available and no consortium is selected
          if (consortiaData.length > 0 && !selectedConsortium) {
            const firstConsortium = consortiaData[0]._id;
            setSelectedConsortium(firstConsortium);
            onConsortiumChange?.(firstConsortium);
          }
        } catch (error) {
          console.error('Error fetching consortiums:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchConsortia();
    }
  }, [shouldShowConsortiumSelector, user, onConsortiumChange, selectedConsortium, setSelectedConsortium]);

  const handleConsortiumChange = (consortiumId: string) => {
    setSelectedConsortium(consortiumId);
    onConsortiumChange?.(consortiumId);
  };

  // Don't render anything if user should not see consortium selector
  if (!shouldShowConsortiumSelector) {
    return null;
  }

  // Don't render if no consortiums available
  if (consortia.length === 0) {
    return null;
  }

  const consortiumOptions = [
    { value: '', label: 'Select Consortium' },
    ...consortia.map(c => ({ value: c._id, label: c.name }))
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Dropdown
        options={consortiumOptions}
        value={selectedConsortium}
        onChange={handleConsortiumChange}
        size="sm"
        className="min-w-[180px] bg-white"
        disabled={loading}
      />
    </div>
  );
};

export default ConsortiumSelector; 