'use client';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-900/30 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 text-2xl">
              📍
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              GeoWhisper
            </span>
          </Link>
          
          <div className="flex items-center gap-2">
            {['Features', 'How it Works', 'Agents', 'Contact'].map((item) => (
              <button
                key={item}
                className="px-4 py-2 rounded-lg backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 hover:border-violet-400/50 text-sm font-medium"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            
            <Link 
              href="/auth/login"
              className="px-4 py-2 rounded-lg backdrop-blur-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/20 text-sm font-medium"
            >
              Get Started 
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}