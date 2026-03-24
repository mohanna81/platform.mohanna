import React, { useState } from 'react';
import Modal from './Modal';
import InputField from './InputField';
import Button from './Button';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (password: string) => Promise<void> | void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      if (onSubmit) {
        await onSubmit(password);
      }
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
    setError(null);
    setLoading(false);
    setSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reset Password" size="sm">
      {success ? (
        <div className="text-center py-6">
          <div className="text-brand-blue text-lg font-semibold mb-2">Password Reset Successful</div>
          <div className="text-gray-700 mb-4">You can now sign in with your new password.</div>
          <Button variant="primary" fullWidth onClick={handleClose}>Close</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <InputField
            label="New Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter new password"
            required
          />
          <InputField
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm new password"
            required
          />
          {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            Reset Password
          </Button>
        </form>
      )}
    </Modal>
  );
};

export default ResetPasswordModal; 