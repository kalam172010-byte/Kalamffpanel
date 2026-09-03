import React, { useState, useEffect } from 'react';

export interface StoreLogoProps {
  className?: string;
  logoUrl?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'rounded' | 'square';
  glowColor?: 'cyan' | 'purple' | 'gold' | 'emerald' | 'pink';
}

export const StoreLogo: React.FC<StoreLogoProps> = ({
  className = 'w-8 h-8',
  logoUrl,
  alt = 'KALAM FF PANEL',
  size,
  shape,
  glowColor,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error when logoUrl changes so newly uploaded/edited logos appear immediately
  useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  // Size classes if requested
  const sizeClass = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : size === 'md' ? 'w-9 h-9' : '';

  // Shape classes
  const shapeClass = shape === 'circle' ? 'rounded-full' : shape === 'square' ? 'rounded-lg' : shape === 'rounded' ? 'rounded-2xl' : '';

  // Glow shadow classes
  const glowClass =
    glowColor === 'cyan'
      ? 'shadow-[0_0_12px_rgba(0,229,255,0.4)] border border-[#00e5ff]/50'
      : glowColor === 'gold'
      ? 'shadow-[0_0_12px_rgba(234,179,8,0.4)] border border-yellow-500/50'
      : glowColor === 'emerald'
      ? 'shadow-[0_0_12px_rgba(16,185,129,0.4)] border border-emerald-500/50'
      : glowColor === 'pink'
      ? 'shadow-[0_0_12px_rgba(244,63,94,0.4)] border border-rose-500/50'
      : glowColor === 'purple'
      ? 'shadow-[0_0_12px_rgba(168,85,247,0.4)] border border-purple-500/50'
      : '';

  const combinedClass = `${sizeClass} ${shapeClass} ${glowClass} ${className}`.trim();

  // If user provided a custom logo URL and no error occurred yet
  const src = !hasError && logoUrl ? logoUrl : !hasError ? '/logo.svg' : null;

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${combinedClass} object-cover shrink-0`}
        onError={() => setHasError(true)}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Pure SVG Fallback Shield if image fails to load
  return (
    <div
      className={`${combinedClass} bg-gradient-to-tr from-[#0a0a14] via-[#161329] to-[#1a0f2e] border border-[#8b5cf6]/50 p-1 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.4)]`}
    >
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
