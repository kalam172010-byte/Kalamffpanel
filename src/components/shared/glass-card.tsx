import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '../../lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  glow?: 'pink' | 'cyan' | 'purple' | 'gold' | 'green' | 'none';
  variant?: 'solid' | 'glass' | 'subtle';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  glow = 'none',
  variant = 'glass',
  ...props
}) => {
  const glowClasses = {
    none: 'border-white/10 hover:border-white/20',
    pink: 'border-[#ff0080]/30 shadow-[0_0_20px_rgba(255,0,128,0.15)] hover:border-[#ff0080]/50 hover:shadow-[0_0_25px_rgba(255,0,128,0.25)]',
    cyan: 'border-[#00e5ff]/30 shadow-[0_0_20px_rgba(0,229,255,0.15)] hover:border-[#00e5ff]/50 hover:shadow-[0_0_25px_rgba(0,229,255,0.25)]',
    purple: 'border-[#8b5cf6]/30 shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:border-[#8b5cf6]/50 hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]',
    gold: 'border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:border-yellow-400/50 hover:shadow-[0_0_25px_rgba(234,179,8,0.25)]',
    green: 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-emerald-400/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]',
  };

  const variantClasses = {
    glass: 'bg-[#161622] border',
    solid: 'bg-[#161622] border',
    subtle: 'bg-[#12121e] border',
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-4 relative overflow-hidden transition-colors duration-200',
        variantClasses[variant],
        glowClasses[glow],
        className
      )}
      {...(props as any)}
    >
      {/* Subtle top glare effect */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
