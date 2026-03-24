import React from 'react';

const tabs = [
  { label: 'All Actions' },
  { label: 'In Progress' },
  { label: 'At Risk' },
  { label: 'Complete' },
];

interface ActionItemsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ActionItemsTabs: React.FC<ActionItemsTabsProps> = ({ activeTab, onTabChange }) => (
  <div className="flex flex-col sm:flex-row gap-2 sm:gap-1 mb-8 w-full">
    {tabs.map((tab) => (
      <button
        key={tab.label}
        className={`w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors duration-150 focus:outline-none text-center cursor-pointer ${
          activeTab === tab.label
            ? 'bg-[#f5f7fa] text-[#0b1320] shadow-sm'
            : 'text-[#7b849b] hover:bg-[#f5f7fa]'
        }`}
        onClick={() => onTabChange(tab.label)}
        type="button"
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default ActionItemsTabs; 