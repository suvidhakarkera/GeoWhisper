import React from 'react';

interface TowerIconProps {
  className?: string;
  size?: number;
}

export const TowerIcon: React.FC<TowerIconProps> = ({ className = '', size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Water Tower with crossed support beams */}
      <g>
        {/* Roof/Top cap (rounded triangle) */}
        <path d="M 256 40 Q 230 40 210 55 L 140 110 Q 130 118 140 120 L 370 120 Q 380 118 370 110 L 300 55 Q 280 40 256 40 Z" />
        
        {/* Main water tank body */}
        <path d="M 140 120 L 140 135 Q 140 260 165 260 L 345 260 Q 370 260 370 135 L 370 120 Z" />
        
        {/* Tank bottom section with pentagon cutout */}
        <path d="M 165 260 L 140 320 L 195 380 L 195 260 Z" />
        <path d="M 345 260 L 370 320 L 315 380 L 315 260 Z" />
        
        {/* Pentagon window/opening in center */}
        <path d="M 195 260 L 256 310 L 315 260 L 315 320 L 256 360 L 195 320 Z" fill="#fff" opacity="0.3" />
        
        {/* Left support leg */}
        <path d="M 140 320 L 120 480 L 150 480 L 195 380 Z" />
        
        {/* Right support leg */}
        <path d="M 370 320 L 390 480 L 360 480 L 315 380 Z" />
        
        {/* Cross support beams (X pattern) */}
        {/* Left to right diagonal */}
        <path d="M 150 380 L 360 480 L 375 470 L 165 370 Z" />
        
        {/* Right to left diagonal */}
        <path d="M 360 380 L 150 480 L 135 470 L 345 370 Z" />
        
        {/* Base platform */}
        <rect x="60" y="475" width="392" height="30" rx="15" />
      </g>
    </svg>
  );
};
