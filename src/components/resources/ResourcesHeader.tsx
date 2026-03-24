import React from 'react';
import InputField from '../common/InputField';
import Button from '../common/Button';

interface ResourcesHeaderProps {
  search: string;
  onSearchChange: (v: string) => void;
  showAddResourceButton?: boolean;
  onAddResource?: () => void;
}

const ResourcesHeader: React.FC<ResourcesHeaderProps> = ({ search, onSearchChange, showAddResourceButton, onAddResource }) => (
  <div className="flex flex-col gap-4 mb-8 w-full sm:flex-row sm:items-center sm:justify-between">
    <h1 className="text-3xl sm:text-4xl font-bold text-[#0b1320] w-full sm:w-auto text-center sm:text-left">Resources</h1>
    <div className="flex flex-col gap-2 w-full sm:flex-row sm:gap-2 sm:w-auto sm:items-center sm:justify-end">
      <div className="relative w-full sm:w-80">
        <InputField
          placeholder="Search resources..."
          value={search}
          onChange={onSearchChange}
          size="md"
          className="pl-10"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
        </span>
      </div>
      {showAddResourceButton && (
        <Button variant="primary" size="md" onClick={onAddResource} className="w-full sm:w-auto">
          + Add Resource
        </Button>
      )}
    </div>
  </div>
);

export default ResourcesHeader; 