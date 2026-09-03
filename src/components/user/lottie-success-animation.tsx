import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface LottieSuccessAnimationProps {
  amount: number;
  orderId?: string;
  utr?: string;
  onDone?: () => void;
  title?: string;
  subtitle?: string;
}

export const LottieSuccessAnimation: React.FC<LottieSuccessAnimationProps> = ({
  amount,
  orderId,
  utr,
  onDone,
  title = 'Deposit Successful!',
  subtitle = 'Funds have been credited instantly to your wallet balance.',
}) => {
  // 14 celebratory radial particles with dynamic angles, velocities, and radiant colors
  const burstParticles = [
    { angle: 0, dist: 56, color: '#10b981', size: 6, delay: 0.12 },
    { angle: 26, dist: 64, color: '#00e5ff', size: 5, delay: 0.18 },
    { angle: 52, dist: 52, color: '#fbbf24', size: 7, delay: 0.15 },
    { angle: 78, dist: 62, color: '#34d399', size: 5, delay: 0.22 },
    { angle: 104, dist: 54, color: '#a855f7', size: 6, delay: 0.14 },
    { angle: 130, dist: 66, color: '#38bdf8', size: 5, delay: 0.24 },
    { angle: 156, dist: 58, color: '#10b981', size: 7, delay: 0.16 },
    { angle: 182, dist: 62, color: '#f59e0b', size: 5, delay: 0.2 },
    { angle: 208, dist: 52, color: '#06b6d4', size: 6, delay: 0.17 },
    { angle: 234, dist: 64, color: '#34d399', size: 5, delay: 0.23 },
    { angle: 260, dist: 56, color: '#c084fc', size: 7, delay: 0.19 },
    { angle: 286, dist: 60, color: '#00e5ff', size: 5, delay: 0.15 },
    { angle: 312, dist: 54, color: '#10b981', size: 6, delay: 0.21 },
    { angle: 338, dist: 65, color: '#eab308', size: 5, delay: 0.18 },
  ];

  return (
    <div className="py-2 text-center space-y-4 relative overflow-hidden">
      {/* Background ambient radial glow layers */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-cyan-500/25 rounded-full blur-2xl pointer-events-none" />

      {/* Center Lottie-Style SVG Checkmark & Particle Blast */}
      <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
        {/* Shockwave Radar Expanding Rings */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0.85 }}
          animate={{ scale: [0.6, 1.85], opacity: [0.85, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full border-2 border-emerald-400/60 pointer-events-none"
        />
        <motion.div
          initial={{ scale: 0.6, opacity: 0.65 }}
          animate={{ scale: [0.6, 2.3], opacity: [0.65, 0] }}
          transition={{ duration: 1.5, delay: 0.35, repeat: Infinity, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full border border-cyan-400/50 pointer-events-none"
        />

        {/* Burst Particles Spreading Radially */}
        {burstParticles.map((p, i) => {
          const rad = (p.angle * Math.PI) / 180;
          const targetX = Math.cos(rad) * p.dist;
          const targetY = Math.sin(rad) * p.dist;
          return (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{
                x: [0, targetX],
                y: [0, targetY],
                scale: [0, 1.35, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 0.85,
                delay: p.delay,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                backgroundColor: p.color,
                width: p.size,
                height: p.size,
                boxShadow: `0 0 10px ${p.color}`,
              }}
              className="absolute rounded-full pointer-events-none"
            />
          );
        })}

        {/* Twinkling Accent Sparkle Stars */}
        <motion.div
          initial={{ scale: 0, rotate: -45, opacity: 0 }}
          animate={{ scale: [0, 1.1, 0.9], rotate: [0, 90, 180], opacity: [0, 1, 0.95] }}
          transition={{ duration: 1.3, delay: 0.25, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute -top-1 -right-1 text-amber-300 pointer-events-none z-20"
        >
          <Sparkles className="w-5 h-5 drop-shadow-[0_0_10px_rgba(252,211,77,0.9)]" />
        </motion.div>
        <motion.div
          initial={{ scale: 0, rotate: 45, opacity: 0 }}
          animate={{ scale: [0, 1, 0.8], rotate: [0, -90, -180], opacity: [0, 1, 0.85] }}
          transition={{ duration: 1.5, delay: 0.4, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute -bottom-1 -left-1 text-cyan-300 pointer-events-none z-20"
        >
          <Sparkles className="w-4 h-4 drop-shadow-[0_0_10px_rgba(6,182,212,0.9)]" />
        </motion.div>

        {/* Main Animated SVG Checkmark Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.05 }}
          className="relative z-10 w-20 h-20"
        >
          <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-[0_0_26px_rgba(16,185,129,0.55)]">
            <defs>
              <linearGradient id="lottieRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="45%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#00e5ff" />
              </linearGradient>
              <linearGradient id="lottieDiscGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#064e3b" />
                <stop offset="100%" stopColor="#022c22" />
              </linearGradient>
            </defs>

            {/* Inner background disc */}
            <motion.circle
              cx="40"
              cy="40"
              r="35"
              fill="url(#lottieDiscGrad)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            />

            {/* Glowing Border Ring that draws itself */}
            <motion.circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke="url(#lottieRingGrad)"
              strokeWidth="3.8"
              strokeLinecap="round"
              strokeDasharray="220"
              initial={{ strokeDashoffset: 220, rotate: -90 }}
              animate={{ strokeDashoffset: 0, rotate: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: '40px 40px' }}
            />

            {/* Animated Lottie Drawing Checkmark Path */}
            <motion.path
              d="M26 41 L35 50 L54 31"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 0.45,
                delay: 0.32,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          </svg>
        </motion.div>
      </div>

      {/* Celebration Header and Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.4 }}
        className="space-y-1"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 mb-1 shadow-[0_0_14px_rgba(16,185,129,0.25)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Payment Detected &amp; Verified</span>
        </div>
        <h4 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300">
          {title}
        </h4>
        <p className="text-xs text-gray-300 max-w-xs mx-auto">
          {subtitle}
        </p>
      </motion.div>

      {/* Highlighted Credited Amount Card with Dynamic Shimmer Border */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.42, type: 'spring', stiffness: 300, damping: 22 }}
        className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-black/85 to-cyan-950/70 border border-emerald-500/40 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.25)]"
      >
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
        <div className="flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
              Credited Balance
            </span>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1">
              <span className="text-emerald-400">₹</span>
              <span>{amount}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              100% Added
            </span>
          </div>
        </div>

        {(orderId || utr) && (
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <span className="truncate max-w-[190px]">Ref: {orderId || utr}</span>
            <span className="text-emerald-400 font-sans font-semibold shrink-0">0% Extra Fee</span>
          </div>
        )}
      </motion.div>

      {/* Auto-redirect progress bar & Done action button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="pt-1 space-y-2.5"
      >
        <div className="space-y-1 text-center">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3.2, ease: 'linear' }}
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 rounded-full"
            />
          </div>
          <span className="text-[10px] text-gray-400 block font-mono">
            Returning to dashboard in 3s...
          </span>
        </div>

        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-white/10"
          >
            <span>Done</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </motion.div>
    </div>
  );
};
