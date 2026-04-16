'use client';
import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className = '',
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl w-full',
    full: 'max-w-full',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity" />

      {/* Modal */}
      <div className={`relative flex flex-col w-full max-h-[92vh] sm:max-h-[88vh] rounded-xl bg-white text-left shadow-xl transition-all mx-0 sm:mx-4 md:mx-0 ${sizeClasses[size]} ${className}`}>
        {/* Header — never scrolls */}
        {(title || showCloseButton) && (
          <div className="flex flex-shrink-0 items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            {title && (
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate pr-2">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content — single scroll zone */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 pb-6 sm:pb-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal; 