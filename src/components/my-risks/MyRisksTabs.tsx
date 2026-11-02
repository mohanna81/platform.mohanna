"use client";
import React from 'react';

export const RISK_TABS = ['All Risks', 'Draft', 'Under Review', 'Shared', 'Rejected'];
export const MITIGATION_TAB = 'My Mitigations';

interface MyRisksTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showMitigationsTab?: boolean;
}

const MyRisksTabs = ({ activeTab, setActiveTab, showMitigationsTab = false }: MyRisksTabsProps) => {
  const tabs = showMitigationsTab ? [...RISK_TABS, MITIGATION_TAB] : RISK_TABS;

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
            } ${tab === MITIGATION_TAB ? 'flex items-center justify-center gap-1.5' : ''}`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab === MITIGATION_TAB && (
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )}
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MyRisksTabs;
