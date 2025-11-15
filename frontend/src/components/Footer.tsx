'use client';

import { motion } from 'framer-motion';
import { Github, MapPin, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface FooterProps {
  hideOnMobile?: boolean;
}

export default function Footer({ hideOnMobile = true }: FooterProps) {
  return (
    <footer className={`relative border-t border-gray-800/50 bg-gradient-to-b from-black to-gray-900/50 mt-16 ${hideOnMobile ? 'hidden md:block' : ''}`}>
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 gap-8 mb-6">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link href="/">
              <div className="flex items-center gap-3 mb-4 group cursor-pointer">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/30 rounded-lg blur-md group-hover:blur-lg transition-all"></div>
                  <MapPin className="w-8 h-8 text-cyan-400 relative z-10" strokeWidth={2.5} />
                </div>
                <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  GeoWhisper
                </span>
              </div>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Hyperlocal AI-powered communities.<br />
              <span className="flex flex-col mt-1 gap-1 ml-2">
                <span>Your Voice</span>
                <span>Your Location</span>
                <span>Your Neighborhood</span>
              </span>
            </p>
            
          </div>

          {/* Right Column - Features and Social Links */}
          <div className="flex flex-col justify-end gap-4 items-start md:items-end">
            {/* Product Links */}
            <div className="w-full">
              <ul className="flex flex-row flex-wrap gap-4 sm:gap-6 justify-start md:justify-end">
                <FooterLink href="/">Home</FooterLink>
                <FooterLink href="/nearby">Nearby</FooterLink>
                <FooterLink href="/my-posts">My Posts</FooterLink>
                <FooterLink href="/maps">Maps</FooterLink>
              </ul>
            </div>
            
            {/* Social Links */}
            <div className="flex justify-start md:justify-end w-full">
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-xs sm:text-sm text-gray-500">Follow us:</span>
                <SocialIcon 
                  href="https://github.com/Sankirthan-R/GeoWhisper" 
                  icon={<Github className="w-5 h-5" />}
                  label="GitHub"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800/50 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span>© 2025 GeoWhisper. All rights reserved.</span>
              
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href}>
        <motion.span 
          className="text-sm text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer inline-flex items-center gap-1 group"
          whileHover={{ x: 2 }}
        >
          {children}
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.span>
      </Link>
    </li>
  );
}

function SocialIcon({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2.5 rounded-lg text-gray-400 hover:text-cyan-400 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-800 hover:border-cyan-500/50 transition-all"
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      aria-label={label}
    >
      {icon}
    </motion.a>
  );
}
