import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, ShoppingBag, Calendar } from 'lucide-react';
import { GlassCard } from '../shared/glass-card';

interface SafetyBannerProps {
  language?: string;
  onLanguageChange?: (lang: any) => void;
  currencySymbol?: string;
}

export const SafetyBannerCard: React.FC<SafetyBannerProps> = ({
  currencySymbol = '₹',
}) => {
  return (
    <GlassCard
      id="safety-banner-card"
      glow="purple"
      className="p-3.5 bg-gradient-to-r from-[#1b1531] via-[#161622] to-[#121b2b] border-[#8b5cf6]/30 flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#8b5cf6] shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <p className="text-xs text-gray-200 font-medium truncate">
          Maintain {currencySymbol}500+ wallet balance for uninterrupted auto-purchase security.
        </p>
      </div>

      <div className="flex items-center gap-1.5 bg-[#8b5cf6]/10 px-2.5 py-1 rounded-xl border border-[#8b5cf6]/30 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="text-[10px] font-bold text-[#c4b5fd]">PROTECTED</span>
      </div>
    </GlassCard>
  );
};

interface StatsRowProps {
  todaySalesTotal?: number;
  todaySalesU: number;
  todaySalesMe: number;
  monthlySalesTotal?: number;
  monthlySalesU: number;
  monthlySalesMe: number;
}

export const StatsRow: React.FC<StatsRowProps> = ({
  todaySalesTotal = 0,
  todaySalesU,
  todaySalesMe,
  monthlySalesTotal = 0,
  monthlySalesU,
  monthlySalesMe
}) => {
  return (
    <div className="grid grid-cols-2 gap-3" id="sales-stats-row">
      {/* Today Sales */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#141424] to-[#16162a] border border-cyan-500/30 shadow-[0_0_20px_rgba(0,229,255,0.12)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-cyan-400 tracking-wider uppercase">
            TODAY SALES
          </span>
          <ShoppingBag className="w-3.5 h-3.5 text-cyan-400/70" />
        </div>

        <div className="my-2">
          <span className="text-3xl font-black text-white tracking-tight font-sans">
            {todaySalesTotal}
          </span>
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-semibold">
          <span className="text-cyan-400 flex items-center gap-1">
            <span className="text-[10px] text-gray-400 font-normal">U:</span> {todaySalesU}
          </span>
          <span className="text-purple-400 flex items-center gap-1">
            <span className="text-[10px] text-gray-400 font-normal">Me:</span> {todaySalesMe}
          </span>
        </div>
      </div>

      {/* Monthly Sales */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#141424] to-[#1c142e] border border-purple-500/30 shadow-[0_0_20px_rgba(139,92,246,0.12)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-purple-400 tracking-wider uppercase">
            MONTHLY SALES
          </span>
          <Calendar className="w-3.5 h-3.5 text-purple-400/70" />
        </div>

        <div className="my-2">
          <span className="text-3xl font-black text-white tracking-tight font-sans">
            {monthlySalesTotal}
          </span>
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-semibold">
          <span className="text-cyan-400 flex items-center gap-1">
            <span className="text-[10px] text-gray-400 font-normal">U:</span> {monthlySalesU}
          </span>
          <span className="text-purple-400 flex items-center gap-1">
            <span className="text-[10px] text-gray-400 font-normal">Me:</span> {monthlySalesMe}
          </span>
        </div>
      </div>
    </div>
  );
};
