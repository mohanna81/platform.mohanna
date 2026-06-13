import React, { useState } from 'react';
import Modal from './Modal';
import InputField from './InputField';
import Button from './Button';

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
      if (onSubmit) {
        await onSubmit(otp);
      }
    } catch {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    // Only allow numbers and max 6 digits
    if (/^\d{0,6}$/.test(value)) {
      setOtp(value);
    }
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
        <div className="text-gray-700 text-sm mb-2">
          Enter the 6-digit OTP sent to <span className="font-medium">{email || 'your email'}</span>.
        </div>
        <InputField
          label="OTP"
          type="text"
          value={otp}
          onChange={handleChange}
          placeholder="Enter OTP"
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
          Verify OTP
        </Button>
      </form>
    </Modal>
  );
};

export default OtpVerificationModal; 