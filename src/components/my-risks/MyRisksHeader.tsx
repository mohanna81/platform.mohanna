import React from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getRoleLevel } from '@/lib/utils/roleHierarchy';

interface MyRisksHeaderProps {
  onNewRisk?: () => void;
}

const MyRisksHeader: React.FC<MyRisksHeaderProps> = ({ onNewRisk }) => {
  const router = useRouter();
  const { user } = useAuth();
  
  // Check if user has access to risk review (Facilitator level or higher)
  const hasRiskReviewAccess = user && getRoleLevel(user.role) >= 2;
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Organization&apos;s Risks</h1>
      <div className="flex gap-2">
        {hasRiskReviewAccess && (
          <button
            className="border border-gray-200 rounded-lg px-5 py-2 font-semibold text-gray-900 bg-white hover:bg-gray-50 cursor-pointer"
            onClick={() => router.push('/risk-review')}
          >
            Switch to Risk Review
          </button>
        )}
        <button
          className="bg-orange-100 hover:bg-orange-200 text-gray-900 font-semibold rounded-lg px-5 py-2 flex items-center gap-2 cursor-pointer"
          onClick={onNewRisk}
        >
          <Plus className="w-5 h-5" />
          New Risk
        </button>
      </div>
    </div>
  );
};

export default MyRisksHeader; 