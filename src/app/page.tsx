'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  useEffect(() => {
    if (user) router.push('/dashboard');
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
      } else {
        showToast.error(result.message || 'Login failed. Please check your credentials.');
      }
    } catch {
      showToast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0d1b35 0%, #0f2d4a 60%, #0d3d3a 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #2a9d8f, transparent)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #FBBF77, transparent)' }} />
        <div className="absolute top-1/2 -right-16 w-64 h-64 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #2a9d8f, transparent)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <Image
            src="/Images/logo.png"
            alt="Risk Sharing Platform"
            width={260}
            height={90}
            priority
            className="brightness-0 invert"
          />
        </div>

        {/* Centre content */}
        <div className="relative z-10 flex flex-col gap-8">
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Transform<br />
              <span style={{ color: '#2a9d8f' }}>Humanitarian</span><br />
              Risk Management
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed max-w-sm">
              A unified platform for consortiums to collaborate, share, and manage risks effectively.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3">
            {[
              { icon: '🛡️', text: 'Shared Risk Register' },
              { icon: '🤝', text: 'Consortium Collaboration' },
              { icon: '📊', text: 'Real-time Risk Analytics' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ backgroundColor: 'rgba(42,157,143,0.2)' }}>
                  {icon}
                </div>
                <span className="text-blue-100 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer text */}
        <p className="relative z-10 text-blue-300 text-xs">
          © {new Date().getFullYear()} Risk Sharing Platform. Secure &amp; Trusted.
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Image src="/Images/logo.png" alt="Risk Sharing Platform" width={200} height={70} priority />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#0d1b35' }}>Welcome back</h2>
            <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
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

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold" style={{ color: '#0d1b35' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs font-medium hover:underline transition-colors"
                  style={{ color: '#2a9d8f' }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 text-gray-900 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#2a9d8f] focus:ring-2 focus:ring-[#2a9d8f]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{ background: isSubmitting || loading ? '#2a9d8f99' : 'linear-gradient(135deg, #2a9d8f 0%, #0f7a6e 100%)' }}
            >
              {isSubmitting || loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">Secure access</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              SSL Secured
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Data Protected
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
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
    </div>
  );
}
