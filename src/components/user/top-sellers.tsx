import React from 'react';
import { motion } from 'motion/react';
import { Crown, Sparkles, Trophy } from 'lucide-react';
import { GlassCard } from '../shared/glass-card';
import { TopSeller } from '../../types';

interface TopSellersProps {
  topSellers: TopSeller[];
}

export const TopSellersSection: React.FC<TopSellersProps> = ({ topSellers }) => {
  return (
    <GlassCard
      id="top-sellers-section"
      glow="gold"
      className="p-4 border-yellow-500/30 bg-gradient-to-b from-[#1c1815]/90 via-[#161622]/90 to-[#161622]/90 overflow-hidden"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
            <Crown className="w-4 h-4 fill-yellow-400" />
          </div>
          <span className="text-xs font-extrabold tracking-wider text-yellow-400 uppercase flex items-center gap-1.5">
            5 TOP SELLERS <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
          </span>
        </div>
        <span className="text-[10px] text-gray-400 font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
          Leaderboard
        </span>
      </div>

      {/* Table Headers */}
      <div className="grid grid-cols-12 text-[10px] font-bold text-gray-400 uppercase py-2 px-1 border-b border-white/5 tracking-wider">
        <div className="col-span-2 text-center">RANK</div>
        <div className="col-span-6">USERNAME</div>
        <div className="col-span-4 text-right">REWARD</div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-white/5 text-xs">
        {topSellers.map((seller, idx) => {
          const rankColors: Record<number, { text: string; bg: string; border: string }> = {
            1: { text: 'text-yellow-400 font-extrabold', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
            2: { text: 'text-slate-300 font-bold', bg: 'bg-slate-300/10', border: 'border-slate-300/20' },
            3: { text: 'text-amber-600 font-bold', bg: 'bg-amber-600/10', border: 'border-amber-600/20' },
          };

          const rankStyle = rankColors[seller.rank] || { text: 'text-gray-400', bg: 'bg-white/5', border: 'border-transparent' };

          return (
            <motion.div
              key={seller.rank}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`grid grid-cols-12 items-center py-2.5 px-1 hover:bg-white/[0.04] transition-colors rounded-lg ${
                seller.rank === 1 ? 'bg-yellow-500/[0.04]' : ''
              }`}
            >
              <div className="col-span-2 flex justify-center">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono border ${rankStyle.text} ${rankStyle.bg} ${rankStyle.border}`}
                >
                  #{seller.rank}
                </span>
              </div>
              
              <div className="col-span-6 flex items-center gap-1.5 font-medium text-gray-200 truncate pr-1">
                <span className="truncate">{seller.username}</span>
                {seller.rank === 1 && <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
              </div>

              <div className="col-span-4 text-right">
                <span className="text-[11px] font-bold text-[#00e5ff] px-1.5 py-0.5 rounded bg-[#00e5ff]/10 border border-[#00e5ff]/20">
                  {seller.reward}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Purple Progress Bar at bottom */}
      <div className="mt-3 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium mb-1">
          <span>Weekly Season Progress</span>
          <span className="text-[#8b5cf6] font-bold">78%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-black/50 overflow-hidden p-[1px] border border-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '78%' }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#d946ef] shadow-[0_0_10px_rgba(139,92,246,0.8)]"
          />
        </div>
      </div>
    </GlassCard>
  );
};
