'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Chrome, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FcGoogle } from 'react-icons/fc';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Handle sign in logic here
      console.log('Sign in:', { email, password, rememberMe });
    }
  };

  const handleGoogleSignIn = () => {
    // Handle Google sign in
    console.log('Google sign in');
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-black border-2 border-gray-600 hover:bg-[#BDE0FE]/10 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all  hover:shadow-[#7B3FBF]/10">
                Sign In
                < ArrowRight className="w-5 h-5" />
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-black border-2 border-gray-600 hover:bg-[#BDE0FE]/10 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-[#7B3FBF]/10"
            >
              <FcGoogle  className="w-5 h-5" />
              Sign in with Google
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
