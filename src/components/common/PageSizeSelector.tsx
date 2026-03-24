import React from 'react';

interface PageSizeSelectorProps {
  currentSize: number;
  onSizeChange: (size: number) => void;
  options?: number[];
  className?: string;
}

const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  currentSize,
  onSizeChange,
  options = [5, 10, 20, 50],
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-black">Show:</span>
      <select
        value={currentSize}
        onChange={(e) => onSizeChange(Number(e.target.value))}
        className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#FBBF77] focus:border-transparent text-black"
      >
        {options.map((size) => (
          <option key={size} value={size} className="text-black">
            {size}
          </option>
        ))}
      </select>
      <span className="text-sm text-black">per page</span>
    </div>
  );
};

export default PageSizeSelector; 