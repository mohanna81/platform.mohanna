import React from 'react';
import Dropdown from '../common/Dropdown';
import InputField from '../common/InputField';
import { Plus } from 'lucide-react';

interface ActionItemsHeaderProps {
  consortium: string;
  onConsortiumChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  onAssignAction?: () => void;
  consortiumOptions: { value: string; label: string }[];
}

const ActionItemsHeader: React.FC<ActionItemsHeaderProps> = ({
  consortium,
  onConsortiumChange,
  search,
  onSearchChange,
  onAssignAction,
  consortiumOptions,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 w-full">
    <h1 className="text-4xl font-bold text-[#0b1320]">Action Items</h1>
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center w-full sm:w-auto">
      <Dropdown
        options={consortiumOptions}
        value={consortium}
        onChange={onConsortiumChange}
        size="md"
        className="min-w-[160px]"
      />
      <div className="relative w-full sm:w-64">
        <InputField
          placeholder="Search actions..."
          value={search}
          onChange={onSearchChange}
          size="md"
          className="pl-10"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
        </span>
      </div>
      {onAssignAction && (
        <button
          className="bg-[#FBBF77]/60 text-[#0b1320] font-medium px-6 py-2 rounded-lg shadow-none hover:bg-[#FBBF77] focus:ring-0 flex items-center gap-2 whitespace-nowrap"
          onClick={onAssignAction}
          type="button"
        >
          <Plus className="w-5 h-5" /> Assign Action
        </button>
      )}
    </div>
  </div>
);

export default ActionItemsHeader; 