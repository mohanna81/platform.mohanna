import React, { useState } from 'react';
import Modal from './Modal';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (email: string) => Promise<void> | void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      if (onSubmit) await onSubmit(email);
      setSubmitted(true);
    } catch {
      setError('Failed to send reset instructions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSubmitted(false);
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Forgot Password" size="sm">
      {submitted ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#e6f4f2' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#2a9d8f" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: '#0d1b35' }}>Check your email</p>
          <p className="text-sm text-gray-500 mb-6">
            If an account exists for <span className="font-medium text-gray-700">{email}</span>, you will receive OTP instructions shortly.
          </p>
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all"
            style={{ backgroundColor: '#2a9d8f' }}
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            Enter your email address and we'll send you an OTP to reset your password.
          </p>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0d1b35' }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@organization.com"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#2a9d8f] focus:ring-2 focus:ring-[#2a9d8f]/20"
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#2a9d8f' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Sending...
              </span>
            ) : 'Send OTP'}
          </button>
        </form>
      )}
    </Modal>
  );
};

export default ForgotPasswordModal;
