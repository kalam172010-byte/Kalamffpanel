import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wallet, Copy, Check, PlusCircle, ArrowUpRight, Shield } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface BalanceCardProps {
  balance: number;
  onDepositClick?: () => void;
  currencySymbol?: string;
  safetyNoticeText?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  onDepositClick,
  currencySymbol = '₹',
  safetyNoticeText = 'Keep 500+ balance for account safety.'
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'EN' | 'HI'>('EN');
  const [activeSlide, setActiveSlide] = useState(0);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(balance.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const slides = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="space-y-4">
      {/* 1. HERO "YOUR CURRENT BALANCE" CARD WITH NEON RED/PINK GLOW */}
      <motion.div
        id="user-balance-card"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        onClick={onDepositClick}
        className="p-6 sm:p-7 rounded-3xl border-2 border-[#ff0055] bg-gradient-to-b from-[#15091a] via-[#0d0714] to-[#0a0510] shadow-[0_0_35px_rgba(255,0,85,0.5),inset_0_0_20px_rgba(255,0,85,0.12)] relative overflow-hidden cursor-pointer group"
      >
        {/* Top subtle highlight reflection */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#ff0055]/50 to-transparent pointer-events-none" />

        {/* Top Right: Wallet Icon & Quick Copy Button */}
        <div className="absolute top-5 sm:top-6 right-5 sm:right-6 flex items-center gap-2 z-10">
          <motion.button
            id="copy-balance-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            title="Copy exact balance"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all opacity-70 group-hover:opacity-100"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </motion.button>
          
          <div className="p-1 text-[#ff0055]/85 group-hover:text-[#ff0055] transition-colors">
            <Wallet className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
          </div>
        </div>

        {/* Card Body: Centered Label & Amount */}
        <div className="text-center py-3 sm:py-4 space-y-3">
          <h2 className="text-xs sm:text-sm font-bold tracking-[0.18em] text-gray-300 uppercase select-none">
            YOUR CURRENT BALANCE
          </h2>

          <div className="flex items-center justify-center">
            <h1
              id="user-current-balance-display"
              className="text-5xl sm:text-6xl font-black text-[#ff0055] tracking-tight font-sans drop-shadow-[0_0_25px_rgba(255,0,85,0.8)] select-all"
            >
              {formatCurrency(balance, currencySymbol)}
            </h1>
          </div>

          {/* Micro Action Helper */}
          <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-gray-400">
            <span className="inline-flex items-center gap-1 text-[#ff0055] font-semibold">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tap to Deposit / Add Cash</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. CAROUSEL INDICATOR CAPSULE WITH CYAN GLOWING BORDER */}
      <div
        id="dashboard-carousel-indicator-bar"
        className="rounded-2xl border-2 border-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.45)] bg-[#04151b]/90 py-3 px-5 flex items-center justify-center gap-2 sm:gap-2.5 overflow-hidden"
      >
        {slides.map((index) => {
          const isActive = activeSlide === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setActiveSlide(index)}
              className={`h-2 sm:h-2.5 rounded-sm transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'w-5 sm:w-6 bg-[#00e5ff] shadow-[0_0_12px_#00e5ff]'
                  : 'w-6 sm:w-8 bg-white/20 hover:bg-white/35'
              }`}
              title={`Slide ${index + 1}`}
              aria-label={`Slide ${index + 1}`}
            />
          );
        })}
      </div>

      {/* 3. ACCOUNT SAFETY BAR WITH SHIELD ICON & EN/HI LANGUAGE TOGGLE */}
      <div
        id="dashboard-account-safety-card"
        className="rounded-2xl border-2 border-[#6366f1]/50 shadow-[0_0_20px_rgba(99,102,241,0.3)] bg-[#0c091d]/95 p-3.5 sm:p-4 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
            {selectedLang === 'HI' ? 'खाता सुरक्षा के लिए 500+ बैलेंस बनाए रखें।' : safetyNoticeText}
          </span>
        </div>

        {/* Language Switcher Buttons [EN] [HI] */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedLang('EN')}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
              selectedLang === 'EN'
                ? 'bg-[#6366f1] text-white shadow-[0_0_12px_rgba(99,102,241,0.6)]'
                : 'bg-white/10 hover:bg-white/15 text-gray-300 border border-white/10'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setSelectedLang('HI')}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
              selectedLang === 'HI'
                ? 'bg-[#6366f1] text-white shadow-[0_0_12px_rgba(99,102,241,0.6)]'
                : 'bg-white/10 hover:bg-white/15 text-gray-300 border border-white/10'
            }`}
          >
            HI
          </button>
        </div>
      </div>
    </div>
  );
};


