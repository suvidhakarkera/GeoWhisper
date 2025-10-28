'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Sparkles, Menu, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-black/60 backdrop-blur-xl z-50 border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <motion.div 
              className="flex items-center gap-3 cursor-pointer group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/30 rounded-lg blur-md group-hover:blur-lg transition-all"></div>
                <MapPin className="w-7 h-7 text-cyan-400 relative z-10" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  GeoWhisper
                </span>
                <div className="flex items-center gap-1.5 -mt-1">
                  <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></div>
                  <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">Beta</span>
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/hot-zones">Hot Zones</NavLink>
            <NavLink href="/my-posts">My Posts</NavLink>
            <NavLink href="/profile">Profile</NavLink>
            
            {/* AI Status Indicator */}
            <div className="ml-4 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">AI Active</span>
            </div>
          </div>

          {/* Right Section: Auth + Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Auth Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/signin">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2.5 text-sm font-bold text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </motion.button>
              </Link>
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-cyan-500/20 overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    Get Started
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </motion.button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-cyan-400" />
              ) : (
                <Menu className="w-6 h-6 text-cyan-400" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="flex flex-col gap-2 pt-6 pb-4 border-t border-gray-800 mt-4">
                <MobileNavLink href="/" onClick={() => setMobileMenuOpen(false)}>
                  Home
                </MobileNavLink>
                <MobileNavLink href="/hot-zones" onClick={() => setMobileMenuOpen(false)}>
                  Hot Zones
                </MobileNavLink>
                <MobileNavLink href="/my-posts" onClick={() => setMobileMenuOpen(false)}>
                  My Posts
                </MobileNavLink>
                <MobileNavLink href="/profile" onClick={() => setMobileMenuOpen(false)}>
                  Profile
                </MobileNavLink>
                
                {/* AI Status - Mobile */}
                <div className="flex items-center gap-2 px-4 py-3 mt-2 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">AI Active</span>
                </div>

                {/* Auth Buttons - Mobile */}
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-800">
                  <Link href="/signin" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-3 text-sm font-bold text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all border border-gray-700">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-cyan-500/20">
                      Get Started
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <motion.span
        className="relative px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 group-hover:w-3/4 transition-all duration-300"></span>
      </motion.span>
    </Link>
  );
}

function MobileNavLink({ 
  href, 
  children, 
  onClick 
}: { 
  href: string; 
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link href={href} onClick={onClick}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="px-4 py-3 text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all cursor-pointer flex items-center justify-between group"
      >
        {children}
        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
      </motion.div>
    </Link>
  );
}
