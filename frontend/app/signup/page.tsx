'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Chrome, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FcGoogle } from 'react-icons/fc';
import { authService } from '@/services/authService';
import type { AuthResponse } from '@/types/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/config/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useUser, type UserData } from '@/contexts/UserContext';

export default function SignUp() {
  const router = useRouter();
  const { login } = useUser();
  const [firstname, setFirstName] = useState('');
  const [lastname, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{name?: string; email?: string; password?: string; confirmPassword?: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const validateForm = () => {
    const newErrors: {name?: string; email?: string; password?: string; confirmPassword?: string} = {};
    if (!firstname.trim()) newErrors.name = 'First name is required';
    if (!lastname.trim()) newErrors.name = 'Last name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (getPasswordStrength(password) < 3) newErrors.password = 'Password is too weak';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    
    if (!validateForm()) {
      return;
    }

    // Check if Firebase is configured
    if (!isFirebaseConfigured() || !auth) {
      setApiError('Firebase authentication is not configured. Please contact the administrator.');
      return;
    }

    setIsLoading(true);

    try {
      // Create username from firstname and lastname
      const username = `${firstname.toLowerCase()}_${lastname.toLowerCase()}`;
      
      // First, create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the user's display name in Firebase
      await updateProfile(user, {
        displayName: username
      });

      // Get Firebase ID token
      const idToken = await user.getIdToken();

      // Now send the user data to backend to create profile
      const response: AuthResponse = await authService.signUp({
        email,
        password, // Backend will ignore this, but keeping for DTO compatibility
        username,
      });

      // Always remember new users
      localStorage.setItem('rememberMe', 'true');

      // Prepare user data for context
      const userData: UserData = {
        firebaseUid: response.firebaseUid,
        email: response.email,
        username: response.username,
        createdAt: response.userData?.createdAt,
        totalPosts: response.userData?.totalPosts || 0,
        totalReactions: response.userData?.totalReactions || 0,
        zonesVisited: response.userData?.zonesVisited || 0,
      };

      // Use context to store user data with the ID token
      login(idToken, userData);

      // Redirect to home or dashboard - use window.location for hard refresh
      window.location.href = '/';
    } catch (error: any) {
      // Handle Firebase authentication errors
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setApiError('This email is already registered. Please sign in instead.');
            break;
          case 'auth/invalid-email':
            setApiError('Invalid email address. Please check and try again.');
            break;
          case 'auth/weak-password':
            setApiError('Password is too weak. Please use a stronger password.');
            break;
          case 'auth/operation-not-allowed':
            setApiError('Email/password sign up is not enabled. Please contact support.');
            break;
          default:
            setApiError(error.message || 'Sign up failed. Please try again.');
        }
      } else if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setApiError('');

    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      setApiError('Google Sign-Up is not configured. Please contact the administrator.');
      return;
    }

    if (!auth || !googleProvider) {
      setApiError('Google Sign-Up is not available. Please try again later.');
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

      // Always remember new users
      localStorage.setItem('rememberMe', 'true');

      // Prepare user data for context
      const userData: UserData = {
        firebaseUid: response.firebaseUid,
        email: response.email,
        username: response.username,
        createdAt: response.userData?.createdAt,
        totalPosts: response.userData?.totalPosts || 0,
        totalReactions: response.userData?.totalReactions || 0,
        zonesVisited: response.userData?.zonesVisited || 0,
      };

      // Use context to store user data
      login(response.idToken, userData);

      // Redirect to home - use window.location for hard refresh
      window.location.href = '/';
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        setApiError('Sign-up cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setApiError('Popup blocked. Please allow popups for this site.');
      } else if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('Google sign-up failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <div className="min-h-screen bg-black text-white transition-colors duration-300">
      <Navbar />

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg md:max-w-xl lg:max-w-2xl"
        >
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            <h1 className="text-4xl font-bold mb-3 bg-[#FFFFE0]/1000 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-gray-400">
              Join the AI-powered GeoWhisper community
            </p>
          </div>

          {/* Sign Up Form */}
          <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-6 sm:p-8 lg:p-10 shadow-2xl">
            {/* API Error Message */}
            {apiError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{apiError}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
              {/* Name Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6"/>
               {/* First Name Input */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={firstname}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full pl-11 pr-4 py-3 bg-black border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                    required
                  />
                </div>
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Last Name Input */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={lastname}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full pl-11 pr-4 py-3 bg-black border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                    required
                  />
                </div>
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>
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
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Password strength:</span>
                      <span className={`text-xs font-medium ${passwordStrength >= 3 ? 'text-green-400' : 'text-red-400'}`}>
                        {strengthLabels[passwordStrength]}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${i < passwordStrength ? strengthColors[passwordStrength] : 'bg-gray-600'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
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
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 bg-black border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-white placeholder-gray-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && password && (
                  <div className="mt-1 flex items-center">
                    {password === confirmPassword ? (
                      <>
                        <Check className="w-4 h-4 text-green-400 mr-1" />
                        <span className="text-xs text-green-400">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-red-400 mr-1" />
                        <span className="text-xs text-red-400">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
                {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Terms and Conditions */}
              <div className="text-xs text-gray-400">
                By signing up, you agree to our{' '}
                <Link href="/terms">
                  <span className="text-cyan-400 hover:text-cyan-300 cursor-pointer">Terms of Service</span>
                </Link>{' '}
                and{' '}
                <Link href="/privacy">
                  <span className="text-cyan-400 hover:text-cyan-300 cursor-pointer">Privacy Policy</span>
                </Link>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="w-full bg-black hover:bg-[#BDE0FE]/10 border-2 border-gray-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
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

            {/* Google Sign Up */}
            <motion.button
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full bg-black border-2 border-gray-600 hover:bg-[#BDE0FE]/10 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing up...
                </>
              ) : (
                <>
                  <FcGoogle className="w-5 h-5" />
                  Sign up with Google
                </>
              )}
            </motion.button>

            {/* Sign In Link */}
            <div className="text-center mt-6 sm:mt-8 lg:mt-10">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link href="/signin">
                  <span className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer">
                    Sign in
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
