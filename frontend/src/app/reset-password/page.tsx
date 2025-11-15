'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/config/firebase';

// Create a separate component for the reset password form
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{newPassword?: string; confirmPassword?: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    // Get the reset code from URL parameters
    const code = searchParams.get('oobCode');
    
    if (!code) {
      setApiError('Invalid or missing reset code. Please request a new password reset link.');
      setIsVerifying(false);
      return;
    }

    // Verify the reset code is valid
    const verifyCode = async () => {
      try {
        if (!auth) {
          throw new Error('Firebase authentication is not configured.');
        }

        // Verify the password reset code
        const email = await verifyPasswordResetCode(auth, code);
        setUserEmail(email);
        setOobCode(code);
        setIsVerifying(false);
      } catch (error: any) {
        console.error('Code verification error:', error);
        
        if (error.code === 'auth/expired-action-code') {
          setApiError('This password reset link has expired. Please request a new one.');
        } else if (error.code === 'auth/invalid-action-code') {
          setApiError('This password reset link is invalid or has already been used.');
        } else {
          setApiError('Failed to verify reset link. Please request a new one.');
        }
        setIsVerifying(false);
      }
    };

    verifyCode();
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: {newPassword?: string; confirmPassword?: string} = {};
    
    if (!newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    } else if (newPassword.length > 128) {
      newErrors.newPassword = 'Password must be less than 128 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    
    if (!validateForm()) {
      return;
    }

    if (!oobCode) {
      setApiError('Invalid reset code. Please request a new password reset link.');
      return;
    }

    setIsLoading(true);

    try {
      if (!auth) {
        throw new Error('Firebase authentication is not configured.');
      }

      // Confirm the password reset with the new password
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      setIsSuccess(true);
      
      // Redirect to sign in page after 3 seconds
      setTimeout(() => {
        router.push('/signin');
      }, 3000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Handle specific Firebase error codes
      if (error.code === 'auth/expired-action-code') {
        setApiError('This password reset link has expired. Please request a new one.');
      } else if (error.code === 'auth/invalid-action-code') {
        setApiError('This password reset link is invalid or has already been used.');
      } else if (error.code === 'auth/weak-password') {
        setApiError('Password is too weak. Please choose a stronger password.');
      } else if (error.message) {
        setApiError(error.message);
      } else {
        setApiError('Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while verifying the code
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Show error if code verification failed
  if (apiError && !oobCode) {
    return (
      <div className="min-h-screen bg-black text-white transition-colors duration-300">
        <Navbar />

        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg md:max-w-xl lg:max-w-2xl"
          >
            <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-6 sm:p-8 lg:p-10 shadow-2xl text-center">
              <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/50 mb-6">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-[#F2F3F5]">
                Invalid Reset Link
              </h1>
              <p className="text-gray-400 mb-8">
                {apiError}
              </p>

              <div className="space-y-3">
                <Link href="/forgot-password" className="block">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-black border-2 border-gray-600 hover:bg-[#BDE0FE]/10 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-[#7B3FBF]/10"
                  >
                    Request New Reset Link
                  </motion.button>
                </Link>
                
                <Link href="/signin" className="block">
                  <button className="w-full text-cyan-400 hover:text-cyan-300 py-2 text-sm font-medium transition-colors">
                    Back to Sign In
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        <Footer />
      </div>
    );
  }

  // Show success message
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black text-white transition-colors duration-300">
        <Navbar />

        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg md:max-w-xl lg:max-w-2xl"
          >
            <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-6 sm:p-8 lg:p-10 shadow-2xl text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500/50">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
              </motion.div>

              <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-[#F2F3F5]">
                Password Reset Successful!
              </h1>
              <p className="text-gray-400 mb-8">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>

              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-300">
                  Redirecting to sign in page in a few seconds...
                </p>
              </div>

              <Link href="/signin" className="block">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-black border-2 border-gray-600 hover:bg-[#BDE0FE]/10 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-[#7B3FBF]/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Go to Sign In
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>

        <Footer />
      </div>
    );
  }

  // Show password reset form
  return (
    <div className="min-h-screen bg-black text-white transition-colors duration-300">
      <Navbar />

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg md:max-w-xl lg:max-w-2xl"
        >
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            <h1 className="text-4xl font-bold mb-3 text-[#F2F3F5]">
              Reset Your Password
            </h1>
            <p className="text-gray-400">
              Enter your new password below
            </p>
            {userEmail && (
              <p className="text-cyan-400 text-sm mt-2">
                For account: {userEmail}
              </p>
            )}
          </div>

          {/* Reset Password Form */}
          <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-6 sm:p-8 lg:p-10 shadow-2xl">
            {/* API Error Message */}
            {apiError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{apiError}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
              {/* New Password Input */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-11 pr-12 py-3 bg-black border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-red-400 text-sm mt-1">{errors.newPassword}</p>}
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-11 pr-12 py-3 bg-black border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Info Box */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                <p className="text-sm text-gray-300">
                  Make sure your new password is strong and unique. Avoid using easily guessable information.
                </p>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="w-full bg-black border-2 border-gray-600 hover:bg-[#BDE0FE]/10 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-[#7B3FBF]/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    Change Password
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Back to Sign In Link */}
            <div className="text-center mt-6 sm:mt-8 lg:mt-10">
              <Link href="/signin">
                <button className="text-sm text-gray-400 hover:text-cyan-400 font-medium inline-flex items-center gap-2 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

// Main component with Suspense wrapper
export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
