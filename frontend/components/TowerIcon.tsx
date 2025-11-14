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
      {/* Antenna/Signal Tower Icon */}
      <g>
        {/* Top circle (antenna ball) */}
        <circle cx="256" cy="180" r="45" />
        
        {/* Center vertical pole */}
        <rect x="230" y="180" width="52" height="240" rx="26" />
        
        {/* Base platform (rounded rectangle) */}
        <rect x="192" y="420" width="128" height="50" rx="25" />
        
        {/* Left outer wave arc */}
        <path 
          d="M 90 60 Q 40 180 90 300" 
          stroke="currentColor" 
          strokeWidth="40" 
          fill="none" 
          strokeLinecap="round" 
        />
        
        {/* Left inner wave arc */}
        <path 
          d="M 155 110 Q 125 180 155 250" 
          stroke="currentColor" 
          strokeWidth="38" 
          fill="none" 
          strokeLinecap="round" 
        />
        
        {/* Right inner wave arc */}
        <path 
          d="M 357 110 Q 387 180 357 250" 
          stroke="currentColor" 
          strokeWidth="38" 
          fill="none" 
          strokeLinecap="round" 
        />
        
        {/* Right outer wave arc */}
        <path 
          d="M 422 60 Q 472 180 422 300" 
          stroke="currentColor" 
          strokeWidth="40" 
          fill="none" 
          strokeLinecap="round" 
        />
      </g>
    </svg>
  );
};
