'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  disabled?: boolean;
}

export default function FloatingActionButton({
  onClick,
  icon,
  label = 'Create Post',
  disabled = false
}: FloatingActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20
      }}
      className="fixed bottom-8 right-8 z-40 group"
      aria-label={label}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
      
      {/* Main button */}
      <div className="relative w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-full shadow-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        {/* Pulse animation */}
        <motion.div
          className="absolute inset-0 bg-white rounded-full opacity-25"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.25, 0, 0.25]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        
        {/* Icon */}
        <motion.div
          animate={{ rotate: [0, 90, 0] }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut'
          }}
        >
          {icon || <Plus className="w-8 h-8 text-white" strokeWidth={3} />}
        </motion.div>
      </div>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        whileHover={{ opacity: 1, x: 0 }}
        className="absolute right-20 top-1/2 -translate-y-1/2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg shadow-xl border border-gray-700 whitespace-nowrap pointer-events-none"
      >
        {label}
        
        {/* Arrow */}
        <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-900 border-r border-t border-gray-700 transform rotate-45" />
      </motion.div>
    </motion.button>
  );
}
