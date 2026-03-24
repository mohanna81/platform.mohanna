import React from 'react';
import Button from '../common/Button';
import { useRouter } from 'next/navigation';

const AccessRestricted: React.FC = () => {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold text-[#0b1320] mb-4 text-center">Access Restricted</h1>
      <p className="text-lg text-[#222b3a] mb-6 text-center">You don&apos;t have permission to access this page.</p>
      <Button
        variant="primary"
        size="lg"
        className="bg-[#FBBF77]/60 text-[#0b1320] font-medium px-8 py-3 rounded-lg shadow-none hover:bg-[#FBBF77] focus:ring-0"
        onClick={() => router.push('/my-risks')}
      >
        Go to My Risks
      </Button>
    </div>
  );
};

export default AccessRestricted; 