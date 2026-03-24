import React from 'react';

interface SharedRisksViewToggleProps {
  value: 'cards' | 'table';
  onChange: (value: 'cards' | 'table') => void;
}

const SharedRisksViewToggle: React.FC<SharedRisksViewToggleProps> = ({ value, onChange }) => {
  return (
    <div className="flex bg-[#f5f7fa] rounded-xl p-1 gap-1 w-fit ml-auto mb-8">
      <button
        className={`px-4 py-2 rounded-lg font-medium text-base transition-colors duration-150 ${
          value === 'cards'
            ? 'bg-white text-[#0b1320] shadow-sm'
            : 'text-[#0b1320]/60 hover:bg-white/70'
        }`}
        onClick={() => onChange('cards')}
        type="button"
      >
        Cards
      </button>
      <button
        className={`px-4 py-2 rounded-lg font-medium text-base transition-colors duration-150 ${
          value === 'table'
            ? 'bg-white text-[#0b1320] shadow-sm'
            : 'text-[#0b1320]/60 hover:bg-white/70'
        }`}
        onClick={() => onChange('table')}
        type="button"
      >
        Table
      </button>
    </div>
  );
};

export default SharedRisksViewToggle; 