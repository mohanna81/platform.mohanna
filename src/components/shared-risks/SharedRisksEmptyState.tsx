import React from 'react';

const SharedRisksEmptyState: React.FC = () => (
  <div className="w-full min-h-[150px] flex flex-col items-center justify-center border border-[#e5eaf1] rounded-xl bg-white text-center py-12">
    <div className="text-2xl font-semibold text-[#0b1320] mb-2">No risks found</div>
    <div className="text-lg text-[#7b849b]">No risks match your current filters.</div>
  </div>
);

export default SharedRisksEmptyState; 