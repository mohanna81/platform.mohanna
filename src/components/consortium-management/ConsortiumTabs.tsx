import React from 'react';

export type ConsortiumTab = 'Active Consortiums' | 'Closed Consortiums' | 'Organizations' | 'Users';

interface ConsortiumTabsProps {
  activeTab: ConsortiumTab;
  onTabChange: (tab: ConsortiumTab) => void;
}

const tabs: ConsortiumTab[] = [
  'Active Consortiums',
  'Closed Consortiums',
  'Organizations',
  'Users',
];

const ConsortiumTabs: React.FC<ConsortiumTabsProps> = ({ activeTab, onTabChange }) => (
  <div className="mb-6">
    {/* Search Bar */}
    <div className="mb-4">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6z"/></svg>
        </span>
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-200 bg-white text-gray-800"
        />
      </div>
    </div>
    {/* Tabs */}
    <div className="flex flex-wrap gap-1 sm:gap-2 rounded bg-gray-100 p-1">
      {tabs.map(tab => (
        <button
          key={tab}
          className={`flex-1 min-w-0 px-2 sm:px-4 py-2 rounded font-medium transition cursor-pointer truncate text-xs md:text-sm ${
            activeTab === tab
              ? 'font-bold text-gray-800 bg-white shadow border border-gray-200 z-10'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => onTabChange(tab)}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  </div>
);

export default ConsortiumTabs; 