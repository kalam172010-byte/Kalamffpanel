import React from 'react';
import { motion } from 'motion/react';
import { Wallet, ShoppingCart, Key, Clock, Gift, User, LucideIcon, Sparkles, Tag } from 'lucide-react';
import { cn } from '../../lib/utils';
import { playPopSound } from '../../lib/sound-fx';

export type QuickActionKey =
  | 'DEPOSIT'
  | 'BUY_KEYS'
  | 'MY_KEYS'
  | 'REFERRAL'
  | 'HISTORY'
  | 'PROFILE';

interface QuickActionItem {
  id: QuickActionKey;
  label: string;
  icon: LucideIcon;
  borderColor: string;
  glowShadow: string;
  iconColor: string;
  iconBg: string;
  badge?: string;
}

const ACTION_ITEMS: QuickActionItem[] = [
  {
    id: 'DEPOSIT',
    label: 'DEPOSIT',
    icon: Wallet,
    borderColor: 'border-[#00e5ff]/40 hover:border-[#00e5ff]',
    glowShadow: 'hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]',
    iconColor: 'text-[#00e5ff]',
    iconBg: 'bg-[#00e5ff]/15',
  },
  {
    id: 'BUY_KEYS',
    label: 'BUY KEYS',
    icon: ShoppingCart,
    borderColor: 'border-[#ff0080]/40 hover:border-[#ff0080]',
    glowShadow: 'hover:shadow-[0_0_20px_rgba(255,0,128,0.3)]',
    iconColor: 'text-[#ff0080]',
    iconBg: 'bg-[#ff0080]/15',
  },
  {
    id: 'MY_KEYS',
    label: 'MY KEYS',
    icon: Key,
    borderColor: 'border-orange-500/40 hover:border-orange-500',
    glowShadow: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]',
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/15',
  },
  {
    id: 'REFERRAL',
    label: 'REFERRAL',
    icon: Gift,
    borderColor: 'border-emerald-500/40 hover:border-emerald-500',
    glowShadow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
  },
  {
    id: 'HISTORY',
    label: 'HISTORY',
    icon: Clock,
    borderColor: 'border-purple-500/40 hover:border-purple-500',
    glowShadow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/15',
  },
  {
    id: 'PROFILE',
    label: 'PROFILE',
    icon: User,
    borderColor: 'border-[#8b5cf6]/40 hover:border-[#8b5cf6]',
    glowShadow: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]',
    iconColor: 'text-[#8b5cf6]',
    iconBg: 'bg-[#8b5cf6]/15',
  },
];

interface QuickActionsGridProps {
  onActionClick: (action: QuickActionKey) => void;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ onActionClick }) => {
  return (
    <div id="quick-actions-grid" className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
      {ACTION_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            id={`quick-action-${item.id.toLowerCase()}`}
            onClick={() => {
              playPopSound();
              onActionClick(item.id);
            }}
            className={cn(
              'relative flex flex-col items-center justify-center p-3 rounded-2xl bg-[#161626] border transition-all duration-200 cursor-pointer aspect-square group shadow-lg overflow-hidden active:scale-95 hover:scale-[1.02] hover:-translate-y-0.5',
              item.borderColor,
              item.glowShadow
            )}
          >
            {item.badge && (
              <span className="absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded text-[8.5px] font-black bg-gradient-to-r from-amber-400 to-rose-500 text-black shadow-sm uppercase tracking-tight">
                {item.badge}
              </span>
            )}
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-110',
                item.iconBg
              )}
            >
              <Icon className={cn('w-5 h-5', item.iconColor)} />
            </div>

            <span className="text-[11px] font-bold text-gray-200 tracking-wider group-hover:text-white uppercase">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
