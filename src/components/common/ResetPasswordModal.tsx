import React, { useState } from 'react';
import Modal from './Modal';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (password: string) => Promise<void> | void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password || !confirmPassword) {
      setError('Please fill in both fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      if (onSubmit) await onSubmit(password);
      setSuccess(true);
    } catch {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirm(false);
    setError(null);
    setLoading(false);
    setSuccess(false);
    onClose();
  };

  const EyeIcon = ({ open }: { open: boolean }) => open ? (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Password" size="sm">
      {success ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#e6f4f2' }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#2a9d8f" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: '#0d1b35' }}>Password Reset Successful</p>
          <p className="text-sm text-gray-500 mb-6">You can now sign in with your new password.</p>
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all"
            style={{ backgroundColor: '#2a9d8f' }}
          >
            Back to Sign in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-gray-500">Choose a strong password of at least 6 characters.</p>

          {/* New password */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0d1b35' }}>
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 text-gray-900 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#2a9d8f] focus:ring-2 focus:ring-[#2a9d8f]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0d1b35' }}>
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 text-gray-900 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#2a9d8f] focus:ring-2 focus:ring-[#2a9d8f]/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
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
                Resetting...
              </span>
            ) : 'Reset Password'}
          </button>
        </form>
      )}
    </Modal>
  );
};

export default ResetPasswordModal;
