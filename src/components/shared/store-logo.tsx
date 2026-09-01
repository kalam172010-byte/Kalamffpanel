import React, { useState } from 'react';

interface StoreLogoProps {
  className?: string;
  logoUrl?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StoreLogo: React.FC<StoreLogoProps> = ({
  className = 'w-8 h-8 rounded-xl',
  logoUrl,
  alt = 'KALAM FF PANEL',
}) => {
  const [hasError, setHasError] = useState(false);

  // If user provided a custom logo URL and no error occurred yet
  const src = !hasError && logoUrl ? logoUrl : !hasError ? '/logo.svg' : null;

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${className} object-cover`}
        onError={() => setHasError(true)}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Pure SVG Fallback Shield if image fails to load
  return (
    <div className={`${className} bg-gradient-to-tr from-[#0a0a14] via-[#161329] to-[#1a0f2e] border border-[#8b5cf6]/50 p-1 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.4)]`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="fallbackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ff0080" />
          </linearGradient>
        </defs>
        <polygon points="50,5 92,22 80,75 50,95 20,75 8,22" fill="#121124" stroke="url(#fallbackGrad)" strokeWidth="3" />
        <path d="M 38,28 L 48,28 L 48,72 L 38,72 Z" fill="url(#fallbackGrad)" />
        <path d="M 48,50 L 68,28 L 78,28 L 56,53 L 80,72 L 70,72 L 48,54 Z" fill="url(#fallbackGrad)" />
        <circle cx="50" cy="50" r="2" fill="#00e5ff" />
      </svg>
    </div>
  );
};
