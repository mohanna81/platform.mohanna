import React from 'react';
import Loader from './Loader';

export interface LoadingItem {
  key: string;
  label: string;
  isLoading: boolean;
  count?: number;
}

interface DataLoadingProgressProps {
  items: LoadingItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

const DataLoadingProgress: React.FC<DataLoadingProgressProps> = ({ 
  items,
  title = 'Loading Data',
  subtitle = 'Please wait while we load all data...',
  className = ''
}) => {
  const allLoaded = items.every(item => !item.isLoading);
  const loadedCount = items.filter(item => !item.isLoading).length;
  const totalCount = items.length;
  const progressPercentage = (loadedCount / totalCount) * 100;

  return (
    <div className={`min-h-[400px] flex flex-col items-center justify-center p-8 ${className}`}>
      {/* Loading Spinner - Using consistent Loader component */}
      <div className="mb-6">
        <Loader size="lg" />
      </div>
      
      {/* Loading Text */}
      <div className="text-center space-y-3 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900">
          {allLoaded ? 'Loading Complete' : title}
        </h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              allLoaded ? 'bg-emerald-500' : 'bg-[#FBBF77]'
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        {/* Loading Progress Items */}
        <div className="mt-6 space-y-3 text-left min-w-[300px]">
          {items.map((item) => (
            <div key={item.key} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 font-medium">{item.label}</span>
              {item.isLoading ? (
                <span className="text-[#FBBF77] flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="animate-pulse">Loading...</span>
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1 font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Loaded {typeof item.count !== 'undefined' && `(${item.count})`}
                </span>
              )}
            </div>
          ))}
        </div>
        
        {/* Summary */}
        <div className="mt-4 text-xs text-gray-500">
          {loadedCount} of {totalCount} items loaded
        </div>
      </div>
    </div>
  );
};

export default DataLoadingProgress;
