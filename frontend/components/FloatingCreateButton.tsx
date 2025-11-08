'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface FloatingCreateButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function FloatingCreateButton({ onClick, disabled = false }: FloatingCreateButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-full shadow-2xl shadow-cyan-500/50 flex items-center justify-center transition-all duration-300"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <Plus className="w-8 h-8" strokeWidth={3} />
      
      {/* Pulsing ring effect */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 rounded-full bg-cyan-500"
          animate={{
            scale: [1, 1.5],
            opacity: [0.5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut'
          }}
        />
      )}
    </motion.button>
  );
}
