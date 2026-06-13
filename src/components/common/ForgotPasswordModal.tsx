import React, { useState } from 'react';
import Modal from './Modal';
import InputField from './InputField';
import Button from './Button';

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
      if (onSubmit) {
        await onSubmit(email);
      }
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
        <div className="text-center py-6">
          <div className="text-brand-blue text-lg font-semibold mb-2">Check your email</div>
          <div className="text-gray-700 mb-4">If an account exists for <span className="font-medium">{email}</span>, you will receive password reset instructions shortly.</div>
          <Button variant="primary" fullWidth onClick={handleClose}>Close</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="text-gray-700 text-sm mb-2">Enter your email address and we’ll send you instructions to reset your password.</div>
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="name@organization.com"
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
            Send Reset Link
          </Button>
        </form>
      )}
    </Modal>
  );
};

export default ForgotPasswordModal; 