import React, { useState, useEffect } from 'react';
import Loader from './Loader';

interface RotatingMessageLoaderProps {
  title?: string;
  messages?: string[];
  className?: string;
  messageInterval?: number; // milliseconds between message changes
}

const defaultMessages = [
  'Preparing your risk insights…',
  'Analyzing risks across partners…',
  'Strengthening collaboration through risk sharing…',
  'Organizing risk insights…',
  'Gathering consortium data…',
  'Building your risk overview…'
];

const RotatingMessageLoader: React.FC<RotatingMessageLoaderProps> = ({ 
  title = 'Loading',
  messages = defaultMessages,
  className = '',
  messageInterval = 2500
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, messageInterval);

    return () => clearInterval(interval);
  }, [messages.length, messageInterval]);

  return (
    <div className={`min-h-[400px] flex flex-col items-center justify-center p-8 ${className}`}>
      {/* Loading Spinner */}
      <div className="mb-6">
        <Loader size="lg" />
      </div>
      
      {/* Title */}
      <div className="text-center space-y-4 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
        </h3>
        
        {/* Rotating Message with smooth fade transition */}
        <div className="relative h-12 flex items-center justify-center">
          <p 
            key={currentMessageIndex}
            className="text-sm text-gray-600 animate-fadeIn absolute"
          >
            {messages[currentMessageIndex]}
          </p>
        </div>
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {messages.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentMessageIndex 
                  ? 'w-8 bg-[#FBBF77]' 
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RotatingMessageLoader;
