import React from 'react';
import Loader from './Loader';

interface PageLoaderProps {
  message?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-brand-input rounded-xl p-8 shadow-brand border border-brand-border">
        <div className="flex flex-col items-center space-y-4">
          <Loader size="lg" />
          <p className="text-brand-blue text-sm font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default PageLoader; 