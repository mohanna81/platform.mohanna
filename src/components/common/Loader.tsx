import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'pulse' | 'dots';
}

const Loader: React.FC<LoaderProps> = ({ 
  size = 'md', 
  className = '', 
  variant = 'default' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const renderDefaultLoader = () => (
    <div className={`${sizeClasses[size]} border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin`}></div>
  );

  const renderPulseLoader = () => (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} bg-emerald-500 rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.2s'
          }}
        />
      ))}
    </div>
  );

  const renderDotsLoader = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'} bg-emerald-500 rounded-full animate-bounce`}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.8s'
          }}
        />
      ))}
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'pulse':
        return renderPulseLoader();
      case 'dots':
        return renderDotsLoader();
      default:
        return renderDefaultLoader();
    }
  };

  return (
    <div className={`flex justify-center items-center ${className}`} role="status" aria-label="Loading">
      {renderLoader()}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Loader; 