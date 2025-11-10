'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/config/firebase';

export default function ForgotPassword() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{email?: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  useEffect(() => {
    // Check authentication - if already logged in, redirect to profile
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    if (authToken) {
      // If already authenticated, redirect to profile instead
      router.push('/profile');
      return;
    }

    setIsAuthenticated(true);
  }, [router]);

  const validateForm = () => {
    const newErrors: {email?: string} = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Check if Firebase auth is initialized
      if (!auth) {
        throw new Error('Firebase authentication is not configured. Please check your Firebase setup.');
      }

      // Send password reset email using Firebase
      await sendPasswordResetEmail(auth, email, {
        // Configure the redirect URL for password reset
        // This URL will be opened when user clicks the link in the email
        url: `${window.location.origin}/signin`,
        handleCodeInApp: false,
      });
      
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Handle specific Firebase error codes
      if (error.code === 'auth/user-not-found') {
        setApiError('No account found with this email address.');
      } else if (error.code === 'auth/invalid-email') {
        setApiError('Invalid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        setApiError('Too many attempts. Please try again later.');
      } else if (error.message) {
        setApiError(error.message);
      } else {
        setApiError('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black text-white transition-colors duration-300">
        <Navbar />

        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-8 shadow-2xl text-center">
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

              <h1 className="text-3xl font-bold mb-3 text-[#F2F3F5]">
                Check Your Email
              </h1>
              <p className="text-gray-400 mb-6">
                We've sent a password reset link to
              </p>
              <p className="text-cyan-400 font-medium mb-8">
                {email}
              </p>
              
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-300">
                  Didn't receive the email? Check your spam folder or try again in a few minutes.
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/signin" className="block">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-black border-2 border-gray-600 hover:bg-[#BDE0FE]/10 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Sign In
                  </motion.button>
                </Link>
                
                <button
                  onClick={() => setIsSuccess(false)}
                  className="w-full text-cyan-400 hover:text-cyan-300 py-2 text-sm font-medium transition-colors"
                >
                  Try a different email
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <Footer />
      </div>
    );
  }

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
              Forgot Password?
            </h1>
            <p className="text-gray-400">
              No worries! Enter your email and we'll send you reset instructions
            </p>
          </div>

          {/* Forgot Password Form */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-6 sm:p-8 lg:p-10 shadow-2xl">
            {/* API Error Message */}
            {apiError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{apiError}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-black border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                    required
                  />
                </div>
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Info Box */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                <p className="text-sm text-gray-300">
                  We'll send you an email with a link to reset your password. The link will expire in 1 hour.
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
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
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

            {/* Sign Up Link */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <Link href="/signup">
                  <span className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer">
                    Sign up
                  </span>
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}