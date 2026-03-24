'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, InputField, Card } from '@/components/common';
import { useAuth } from '@/lib/auth/AuthContext';
import { showToast } from '@/lib/utils/toast';
import ForgotPasswordModal from '@/components/common/ForgotPasswordModal';
import OtpVerificationModal from '@/components/common/OtpVerificationModal';
import ResetPasswordModal from '@/components/common/ResetPasswordModal';
import { userService } from '@/lib/api/services/auth';
import Image from 'next/image';

export default function LoginPage() {
  const { login, loading, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      showToast.error('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        showToast.success('Login successful! Redirecting...');
        // User will be redirected by useEffect
      } else {
        showToast.error(result.message || 'Login failed. Please check your credentials.');
      }
    } catch {
      showToast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for forgot password modal submit (send OTP to email)
  const handleForgotSubmit = async (email: string) => {
    const res = await userService.forgotPassword({ email });
    if (res.success) {
      showToast.success(res.message || 'OTP sent to your email');
      setForgotEmail(email);
      setForgotOpen(false);
      setOtpOpen(true);
    } else {
      showToast.error(res.message || 'Failed to send OTP');
      throw new Error(res.message || 'Failed to send OTP');
    }
  };

  // Handler for OTP modal submit (simulate API, then open reset modal)
  const handleOtpSubmit = async (otp: string) => {
    if (!forgotEmail) return;
    const res = await userService.verifyOtp({ email: forgotEmail, otp });
    if (res.success) {
      showToast.success(res.message || 'OTP verified successfully');
      setOtpOpen(false);
      setResetOpen(true);
    } else {
      showToast.error(res.message || 'OTP verification failed');
      throw new Error(res.message || 'OTP verification failed');
    }
  };

  // Handler for reset password modal submit (simulate API, then close all)
  const handleResetSubmit = async (password: string) => {
    if (!forgotEmail) return;
    const res = await userService.updatePassword({ email: forgotEmail, password });
    if (res.success) {
      showToast.success(res.message || 'Password reset successfully');
      setResetOpen(false);
      setForgotEmail('');
    } else {
      showToast.error(res.message || 'Failed to reset password');
      throw new Error(res.message || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brand-gradient-from to-brand-gradient-to dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-col items-center mb-6">
        {/* Logo with text */}
        <div className="mb-4">
          <Image 
            src="/Images/logo.png" 
            alt="Risk Sharing Platform Logo" 
            width={280} 
            height={100}
            priority
            className="drop-shadow-lg"
          />
        </div>
      </div>
             <Card className="w-full max-w-md bg-brand-bg dark:bg-gray-800 text-black shadow-brand dark:shadow-xl rounded-xl border border-brand-border dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="text-center mt-6">
                         <h2 className="text-2xl font-bold mb-1 text-black">Risk Sharing Platform</h2>
                         <p className="text-black text-base">Access the Risk Sharing Platform</p>
          </div>
          <div className="px-6 flex flex-col gap-4">
            <InputField
              label="Email"
              placeholder="name@organization.com"
              value={email}
              onChange={setEmail}
              type="email"
              required
            />
            <InputField
              label="Password"
              placeholder=""
              value={password}
              onChange={setPassword}
              type="password"
              required
            />
                         <button
               type="button"
               className="text-xs text-black text-left mt-1 hover:underline focus:outline-none transition-colors"
               onClick={() => setForgotOpen(true)}
             >
               Forgot password?
             </button>
          </div>
          <div className="px-6 pb-6">
                         <Button
               type="submit"
               variant="primary"
               className="bg-brand-peach text-black hover:bg-brand-peach-dark w-full dark:bg-brand-peach dark:text-black dark:hover:bg-brand-peach-dark"
               fullWidth
               disabled={isSubmitting || loading}
             >
              <span className="flex items-center gap-2">
                {isSubmitting || loading ? 'Signing in...' : 'Sign in'}
              </span>
            </Button>
          </div>
        </form>
        <ForgotPasswordModal
          isOpen={forgotOpen}
          onClose={() => setForgotOpen(false)}
          onSubmit={handleForgotSubmit}
        />
        <OtpVerificationModal
          isOpen={otpOpen}
          onClose={() => setOtpOpen(false)}
          onSubmit={handleOtpSubmit}
          email={forgotEmail}
        />
        <ResetPasswordModal
          isOpen={resetOpen}
          onClose={() => setResetOpen(false)}
          onSubmit={handleResetSubmit}
        />
        <div className="text-center text-xs text-black pb-4">Secure platform for humanitarian risk management</div>
      </Card>
    </div>
  );
}
