import React from 'react';
import { Users, Coins, ArrowDownCircle, PackageCheck } from 'lucide-react';
import { GlassCard } from '../shared/glass-card';
import { formatCurrency } from '../../lib/utils';

interface ResellerStatsProps {
  totalResellers: number;
  totalBalance: number;
  depositedToday: number;
  soldToday: number;
}

export const ResellerStatsGrid: React.FC<ResellerStatsProps> = ({
  totalResellers,
  totalBalance,
  depositedToday,
  soldToday,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2.5" id="reseller-stats-grid">
      {/* Card 1: Total Resellers */}
      <GlassCard glow="gold" className="p-3 bg-[#161622]/95 border-yellow-500/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Total Resellers
          </span>
          <div className="w-6 h-6 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
            <Users className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-extrabold text-yellow-400 font-sans">
            {totalResellers}
          </span>
        </div>
        <span className="text-[9px] text-gray-400 font-medium">Verified partners</span>
      </GlassCard>

      {/* Card 2: Total Reseller Balance */}
      <GlassCard glow="gold" className="p-3 bg-[#161622]/95 border-yellow-500/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Reseller Balance
          </span>
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
            <Coins className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xl font-extrabold text-amber-300 font-sans truncate block">
            {formatCurrency(totalBalance)}
          </span>
        </div>
        <span className="text-[9px] text-gray-400 font-medium">Partner wallets</span>
      </GlassCard>

      {/* Card 3: Deposited Today */}
      <GlassCard glow="green" className="p-3 bg-[#161622]/95 border-emerald-500/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Deposited Today
          </span>
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ArrowDownCircle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xl font-extrabold text-emerald-400 font-sans truncate block">
            {formatCurrency(depositedToday)}
          </span>
        </div>
        <span className="text-[9px] text-gray-400 font-medium">Top-up volume</span>
      </GlassCard>

      {/* Card 4: Sold Today (All) */}
      <GlassCard glow="cyan" className="p-3 bg-[#161622]/95 border-[#00e5ff]/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Sold Today (All)
          </span>
          <div className="w-6 h-6 rounded-lg bg-[#00e5ff]/20 text-[#00e5ff] flex items-center justify-center">
            <PackageCheck className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-extrabold text-[#00e5ff] font-sans">
            {soldToday}
          </span>
        </div>
        <span className="text-[9px] text-gray-400 font-medium">Keys generated</span>
      </GlassCard>
    </div>
  );
};
