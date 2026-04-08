import React from 'react';
import Dropdown from '../common/Dropdown';
import InputField from '../common/InputField';
import { Consortium } from '@/lib/api/services/consortia';
import { Organization } from '@/lib/api/services/organizations';

export type SharedRisksFilters = {
  consortium: string;
  category: string;
  organization: string;
  status: string;
  search: string;
};

const SharedRisksHeader: React.FC<{
  filters: SharedRisksFilters;
  onFilterChange: (filters: SharedRisksFilters) => void;
  consortiums: Consortium[];
  organizations: Organization[];
}> = ({ filters, onFilterChange, consortiums, organizations }) => {
  const hasActiveFilters = filters.consortium || filters.category || filters.organization || filters.status || filters.search;

  const clearAllFilters = () => {
    onFilterChange({
      consortium: "",
      category: "",
      organization: "",
      status: "",
      search: "",
    });
  };


  // Create dynamic options from API data
  const consortiumOptions = [
    { value: '', label: 'All Consortiums' },
    ...consortiums.map((consortium: Consortium) => ({
      value: consortium._id,
      label: consortium.name
    }))
  ];

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

  const orgOptions = [
    { value: '', label: 'All Organizations' },
    ...organizations.map((org: Organization) => ({
      value: org._id,
      label: org.name
    }))
  ];

  const statusOptions = [
    { value: '', label: 'All Risks' },
    { value: 'triggered', label: 'Triggered Risks' },
  ];
  return (
    <div className="mb-6 md:mb-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0b1320] mb-4 md:mb-8">Shared Risks</h1>
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 md:gap-4 items-stretch sm:items-center">
        <Dropdown
          options={consortiumOptions}
          value={filters.consortium}
          onChange={v => onFilterChange({ ...filters, consortium: v })}
          size="md"
          className="font-semibold w-full sm:w-auto sm:min-w-[200px]"
        />
        <Dropdown
          options={categoryOptions}
          value={filters.category}
          onChange={v => {
            onFilterChange({ ...filters, category: v });
          }}
          size="md"
          className="w-full sm:w-auto sm:min-w-[220px]"
        />
        <Dropdown
          options={orgOptions}
          value={filters.organization}
          onChange={v => onFilterChange({ ...filters, organization: v })}
          size="md"
          className="w-full sm:w-auto sm:min-w-[220px]"
        />
        <Dropdown
          options={statusOptions}
          value={filters.status}
          onChange={v => onFilterChange({ ...filters, status: v })}
          size="md"
          className="w-full sm:w-auto sm:min-w-[180px]"
        />
        <div className="relative w-full sm:flex-1 sm:min-w-[260px]">
          <InputField
            placeholder="Search risks..."
            value={filters.search}
            onChange={v => onFilterChange({ ...filters, search: v })}
            size="md"
            className="pl-10 w-full"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
          </span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        )}

      </div>
    </div>
  );
};

export default SharedRisksHeader; 