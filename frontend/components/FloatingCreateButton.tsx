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
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-black/20 backdrop-blur-lg border-2 border-gray-600 hover:border-cyan-500 disabled:border-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <Plus className="w-8 h-8" strokeWidth={3} />
    </motion.button>
  );
}
