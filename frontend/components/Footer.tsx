'use client';

import { motion } from 'framer-motion';
import { Github, Twitter, MessageCircle, MapPin, Heart, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative border-t border-gray-800/50 bg-gradient-to-b from-black to-gray-900/50 mt-32">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-12 mb-12">
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
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Hyperlocal AI-powered communities. Your voice, your location, your neighborhood.
            </p>
            
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Product</h3>
            <ul className="space-y-3">
              <FooterLink href="/features">Features</FooterLink>
              <FooterLink href="/hot-zones">Hot Zones</FooterLink>
              <FooterLink href="/pricing">Pricing</FooterLink>
              <FooterLink href="/roadmap">Roadmap</FooterLink>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Company</h3>
            <ul className="space-y-3">
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/blog">Blog</FooterLink>
              <FooterLink href="/careers">Careers</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/terms">Terms of Service</FooterLink>
              <FooterLink href="/cookies">Cookie Policy</FooterLink>
              <FooterLink href="/guidelines">Community Guidelines</FooterLink>
            </ul>
          </div>
        </div>

        {/* Social Links Section */}
        <div className="border-t border-gray-800/50 pt-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Follow us:</span>
              <div className="flex items-center gap-3">
                <SocialIcon 
                  href="https://github.com" 
                  icon={<Github className="w-5 h-5" />}
                  label="GitHub"
                />
                <SocialIcon 
                  href="https://twitter.com" 
                  icon={<Twitter className="w-5 h-5" />}
                  label="Twitter"
                />
                <SocialIcon 
                  href="https://discord.com" 
                  icon={<MessageCircle className="w-5 h-5" />}
                  label="Discord"
                />
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all w-64"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                Subscribe
                <ExternalLink className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800/50 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span>© 2025 GeoWhisper. All rights reserved.</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1">
                Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for local communities
              </span>
            </div>
            
            <div className="flex items-center gap-6 text-xs text-gray-500">
              <a href="#" className="hover:text-cyan-400 transition-colors">Status</a>
              <span>•</span>
              <a href="#" className="hover:text-cyan-400 transition-colors">API</a>
              <span>•</span>
              <a href="#" className="hover:text-cyan-400 transition-colors">Docs</a>
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
