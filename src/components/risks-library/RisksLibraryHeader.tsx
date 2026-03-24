import React from 'react';
import InputField from '../common/InputField';
import Dropdown from '../common/Dropdown';
import Button from '../common/Button';

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'safety', label: 'Safety' },
  { value: 'security', label: 'Security' },
  { value: 'fiduciary', label: 'Fiduciary' },
  { value: 'legal_compliance', label: 'Legal / Compliance' },
  { value: 'operational', label: 'Operational' },
  { value: 'reputational', label: 'Reputational' },
  { value: 'information', label: 'Information' },
  { value: 'ethical', label: 'Ethical' },
];

const RisksLibraryHeader: React.FC<{
  search: string;
  onSearchChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
}> = ({ search, onSearchChange, category, onCategoryChange }) => {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between mb-8 gap-4">
        <h1 className="text-4xl font-bold text-[#0b1320]">Risks Library</h1>
        <Button
          variant="outline"
          size="md"
          className="flex items-center gap-2 border-[#e5eaf1] text-[#0b1320] px-6 py-2 rounded-lg shadow-none hover:bg-[#f5f7fa] focus:ring-0"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Export
        </Button>
      </div>
      <div className="flex flex-col gap-4 mb-4">
        <div className="relative w-full max-w-xs">
          <InputField
            placeholder="Search risks..."
            value={search}
            onChange={onSearchChange}
            size="md"
            className="pl-10"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
          </span>
        </div>
        <div className="w-full">
          <div className="w-full bg-[#f5f7fa] border border-[#e5eaf1] rounded-xl px-4 py-3 text-[#7b849b] text-base font-semibold">All Consortiums</div>
        </div>
        <div className="w-full max-w-xs">
          <Dropdown
            options={categoryOptions}
            value={category}
            onChange={onCategoryChange}
            size="md"
            className="min-w-[180px]"
          />
        </div>
      </div>
    </div>
  );
};

export default RisksLibraryHeader; 