"use client";
import React from 'react';

export const tabs = ['All Risks', 'Draft', 'Under Review', 'Shared', 'Rejected'];

const MyRisksTabs = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) => {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-1 sm:gap-2 rounded bg-gray-100 p-1">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`flex-1 min-w-0 px-2 sm:px-4 py-2 rounded font-medium transition cursor-pointer truncate text-xs md:text-sm ${
              activeTab === tab
                ? 'font-bold text-gray-800 bg-white shadow border border-gray-200 z-10'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MyRisksTabs; 