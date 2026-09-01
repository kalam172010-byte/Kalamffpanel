import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, PlusCircle, ArrowUpRight } from 'lucide-react';
import { GlassCard } from '../shared/glass-card';
import { formatCurrency } from '../../lib/utils';

interface BalanceCardProps {
  balance: number;
  onDepositClick?: () => void;
  currencySymbol?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  onDepositClick,
  currencySymbol = '₹'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(balance.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="user-balance-card"
      className="p-5 rounded-2xl border border-[#ff0080]/40 bg-gradient-to-br from-[#181226] via-[#161626] to-[#12121f] shadow-[0_0_25px_rgba(255,0,128,0.15)] relative overflow-hidden"
    >
      {/* Top subtle highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff0080]/30 to-transparent pointer-events-none" />
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
              TOTAL CURRENT BALANCE
            </span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#ff0080]/20 text-[#ff0080] border border-[#ff0080]/30">
              LIVE
            </span>
          </div>
          
          <div className="mt-2 flex items-baseline gap-2">
            <motion.h1
              key={balance}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="text-4xl font-extrabold text-[#ff0080] text-glow-pink tracking-tight font-sans"
            >
              {formatCurrency(balance, currencySymbol)}
            </motion.h1>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <motion.button
            id="copy-balance-btn"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleCopy}
            title="Copy Balance"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <Copy className="w-4 h-4 text-gray-400 hover:text-[#ff0080]" />
            )}
          </motion.button>

          {onDepositClick && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDepositClick}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ff0080]/20 hover:bg-[#ff0080]/30 border border-[#ff0080]/40 text-[#ff0080] text-xs font-semibold shadow-[0_0_15px_rgba(255,0,128,0.2)] transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Cash</span>
              <ArrowUpRight className="w-3 h-3" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

