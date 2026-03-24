import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastContainer: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#10192b',
          color: '#ededed',
          border: '1px solid #232e47',
          borderRadius: '12px',
          boxShadow: '0 4px 32px 0 rgba(11, 19, 32, 0.10)',
        },
        success: {
          iconTheme: {
            primary: '#FBBF77',
            secondary: '#10192b',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#10192b',
          },
        },
        loading: {
          iconTheme: {
            primary: '#FBBF77',
            secondary: '#10192b',
          },
        },
      }}
    />
  );
};

export default ToastContainer; 