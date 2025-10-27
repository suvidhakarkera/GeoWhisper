'use client';
import Link from 'next/link';
import { Moon, Sun, MapPin } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b-2 border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-black dark:bg-white">
              <MapPin className="w-5 h-5 text-white dark:text-black" />
            </div>
            <span className="text-xl font-bold text-black dark:text-white">
              GeoWhisper
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {['Features', 'How it Works', 'Agents', 'Contact'].map((item) => (
              <Button
                key={item}
                variant="ghost"
                className="text-sm"
              >
                {item}
              </Button>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            <Button 
              variant="ghost"
              asChild
              className="hidden sm:inline-flex"
            >
              <Link href="/auth/login">
                Sign In
              </Link>
            </Button>
            
            <Button asChild>
              <Link href="/auth/signup">
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}