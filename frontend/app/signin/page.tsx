'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Chrome, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FcGoogle } from 'react-icons/fc';
import { authService } from '@/services/authService';
import type { AuthResponse } from '@/types/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/config/firebase';
import { signInWithPopup } from 'firebase/auth';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
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
      const response: AuthResponse = await authService.signIn({
        email,
        password,
      });

      // Store auth data in localStorage
      if (rememberMe) {
        localStorage.setItem('authToken', response.idToken);
        localStorage.setItem('firebaseUid', response.firebaseUid);
        localStorage.setItem('userEmail', response.email);
        localStorage.setItem('username', response.username);
      } else {
        sessionStorage.setItem('authToken', response.idToken);
        sessionStorage.setItem('firebaseUid', response.firebaseUid);
        sessionStorage.setItem('userEmail', response.email);
        sessionStorage.setItem('username', response.username);
      }

      // Redirect to home or dashboard
      router.push('/');
    } catch (error) {
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setApiError('');

    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      setApiError('Google Sign-In is not configured. Please contact the administrator.');
      return;
    }

    if (!auth || !googleProvider) {
      setApiError('Google Sign-In is not available. Please try again later.');
      return;
    }

    setIsLoading(true);

    try {
      // Sign in with Google using Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Get Firebase ID token
      const idToken = await user.getIdToken();

      // Send token to backend for verification and user creation
      const response: AuthResponse = await authService.googleAuth({
        idToken,
      });

      // Store auth data
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('authToken', response.idToken);
      storage.setItem('firebaseUid', response.firebaseUid);
      storage.setItem('userEmail', response.email);
      storage.setItem('username', response.username);

      // Redirect to home
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        setApiError('Sign-in cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setApiError('Popup blocked. Please allow popups for this site.');
      } else if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('Google sign-in failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
            <h1 className="text-4xl font-bold mb-3  text-[#F2F3F5]">
              Welcome Back
            </h1>
            <p className="text-gray-400">
              Sign in to continue your AI-powered journey
            </p>
          </div>

          {/* Sign In Form */}
          <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-6 sm:p-8 lg:p-10 shadow-2xl">
            {/* API Error Message */}
            {apiError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{apiError}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
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

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 bg-black border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-cyan-500 bg-black border-gray-600 rounded focus:ring-cyan-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-300">Remember me</span>
                </label>
                <Link href="/forgot-password">
                  <span className="text-sm text-cyan-400 hover:text-cyan-300 cursor-pointer">
                    Forgot password?
                  </span>
                </Link>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="w-full bg-black border-2 border-gray-600 hover:bg-[#BDE0FE]/10 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-[#7B3FBF]/10 disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-6 sm:my-8 lg:my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-linear-to-br from-gray-900 to-gray-800 text-gray-400">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full bg-black border-2 border-gray-600 hover:bg-[#BDE0FE]/10 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-[#7B3FBF]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <FcGoogle className="w-5 h-5" />
                  Sign in with Google
                </>
              )}
            </motion.button>

            {/* Sign Up Link */}
            <div className="text-center mt-6 sm:mt-8 lg:mt-10">
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
