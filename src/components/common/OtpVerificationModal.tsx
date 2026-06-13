import React, { useState } from 'react';
import Modal from './Modal';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (otp: string) => Promise<void> | void;
  email?: string;
}

const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({ isOpen, onClose, onSubmit, email }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      if (onSubmit) await onSubmit(otp);
    } catch {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    if (/^\d{0,6}$/.test(value)) setOtp(value);
  };

  const handleClose = () => {
    setOtp('');
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Verify OTP" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-gray-500">
          Enter the 6-digit OTP sent to{' '}
          <span className="font-medium text-gray-700">{email || 'your email'}</span>.
        </p>
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0d1b35' }}>
            One-Time Password
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={e => handleChange(e.target.value)}
            placeholder="123456"
            maxLength={6}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 text-sm text-center tracking-[0.4em] outline-none transition-all placeholder:text-gray-400 placeholder:tracking-normal focus:border-[#2a9d8f] focus:ring-2 focus:ring-[#2a9d8f]/20"
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
              Verifying...
            </span>
          ) : 'Verify OTP'}
        </button>
      </form>
    </Modal>
  );
};

export default OtpVerificationModal;
