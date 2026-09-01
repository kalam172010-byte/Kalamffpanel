import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  X,
  CreditCard,
  KeyRound,
  DollarSign,
  TrendingUp,
  Clock,
  Music,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { StoreActivityNotification } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { playNotificationSound } from '../../lib/sound';

interface AdminActivityNotifierProps {
  activities: StoreActivityNotification[];
  unreadCount: number;
  soundMuted: boolean;
  onToggleSound: () => void;
  onClearActivities?: () => void;
  onSelectActivity?: (activity: StoreActivityNotification) => void;
  activeToast: StoreActivityNotification | null;
  onDismissToast: () => void;
}

export const AdminActivityNotifier: React.FC<AdminActivityNotifierProps> = ({
  activities,
  unreadCount,
  soundMuted,
  onToggleSound,
  onClearActivities,
  onSelectActivity,
  activeToast,
  onDismissToast,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'DEPOSIT' | 'PURCHASE'>('ALL');
  const [testChimePlaying, setTestChimePlaying] = useState<'deposit' | 'purchase' | null>(null);

  const filteredActivities = (activities || []).filter((act) => {
    if (filter === 'DEPOSIT') return act.type === 'DEPOSIT' || act.type === 'TOPUP';
    if (filter === 'PURCHASE') return act.type === 'PURCHASE';
    return true;
  });

  const handleTestSound = (type: 'deposit' | 'purchase') => {
    setTestChimePlaying(type);
    playNotificationSound(type);
    setTimeout(() => setTestChimePlaying(null), 800);
  };

  return (
    <>
      {/* ==================== REAL-TIME FLOATING TOAST POPUP ==================== */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-3 pointer-events-none">
        <AnimatePresence>
          {activeToast && (
            <motion.div
              key={activeToast.id}
              initial={{ opacity: 0, y: -25, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`pointer-events-auto w-full p-3.5 rounded-2xl backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] border flex items-start gap-3 ${
                activeToast.type === 'DEPOSIT' || activeToast.type === 'TOPUP'
                  ? 'bg-[#0e2118]/95 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
                  : 'bg-[#18152e]/95 border-cyan-500/50 shadow-[0_0_30px_rgba(0,229,255,0.35)]'
              }`}
            >
              {/* Type Badge Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  activeToast.type === 'DEPOSIT' || activeToast.type === 'TOPUP'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                }`}
              >
                {activeToast.type === 'DEPOSIT' || activeToast.type === 'TOPUP' ? (
                  <DollarSign className="w-5 h-5 animate-bounce" />
                ) : (
                  <KeyRound className="w-5 h-5 animate-pulse" />
                )}
              </div>

              {/* Toast Message & Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        activeToast.type === 'DEPOSIT' || activeToast.type === 'TOPUP'
                          ? 'bg-emerald-500 text-black'
                          : 'bg-cyan-400 text-black'
                      }`}
                    >
                      {activeToast.type === 'DEPOSIT'
                        ? 'NEW DEPOSIT'
                        : activeToast.type === 'TOPUP'
                        ? 'WALLET TOP-UP'
                        : 'NEW PURCHASE'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      <span>Just now</span>
                    </span>
                  </div>

                  <button
                    onClick={onDismissToast}
                    className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    aria-label="Dismiss toast"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs font-black text-white truncate">{activeToast.title}</div>
                <p className="text-[11px] text-gray-300 line-clamp-2 leading-relaxed">
                  {activeToast.message}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="font-mono font-bold text-emerald-400">
                    {formatCurrency(activeToast.amount)}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    User: @{activeToast.userName}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ==================== HEADER CONTROLS (SOUND + BELL) ==================== */}
      <div className="flex items-center gap-1.5">
        {/* Sound Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onToggleSound}
          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
            soundMuted
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
          }`}
          title={soundMuted ? 'Notification Sound is MUTED. Click to enable sound.' : 'Notification Sound is ACTIVE. Click to mute.'}
          aria-label="Toggle notification sound"
        >
          {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </motion.button>

        {/* Real-time Notification Bell */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen(!isOpen)}
            className={`relative w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isOpen
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : unreadCount > 0
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.25)]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-white'
            }`}
            title="Real-Time Store Activity Stream"
            aria-label="View store notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#ff0080] text-white text-[9px] font-black flex items-center justify-center animate-pulse border border-black shadow-[0_0_8px_rgba(255,0,128,0.6)]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>

          {/* ==================== NOTIFICATIONS DROPDOWN PANEL ==================== */}
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop closer */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsOpen(false)}
                />

                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 bg-[#141422]/98 backdrop-blur-2xl border border-cyan-500/40 rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          <span>Live Store Activities</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </h3>
                        <span className="text-[10px] text-gray-400">Real-time deposit & purchase stream</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Audio Controls & Sound Testing */}
                  <div className="p-2.5 rounded-2xl bg-black/50 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[11px] font-bold text-gray-200">Notification Chime</span>
                      </div>
                      <button
                        onClick={onToggleSound}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                          soundMuted
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {soundMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        <span>{soundMuted ? 'Muted' : 'Active'}</span>
                      </button>
                    </div>

                    {/* Test Sound Buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/5 text-[10px]">
                      <button
                        onClick={() => handleTestSound('deposit')}
                        disabled={testChimePlaying !== null}
                        className={`py-1.5 px-2 rounded-xl border flex items-center justify-center gap-1 font-bold cursor-pointer transition-all ${
                          testChimePlaying === 'deposit'
                            ? 'bg-emerald-500 text-black border-emerald-400'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-emerald-300'
                        }`}
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Test Deposit Chime</span>
                      </button>

                      <button
                        onClick={() => handleTestSound('purchase')}
                        disabled={testChimePlaying !== null}
                        className={`py-1.5 px-2 rounded-xl border flex items-center justify-center gap-1 font-bold cursor-pointer transition-all ${
                          testChimePlaying === 'purchase'
                            ? 'bg-cyan-400 text-black border-cyan-300'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-cyan-300'
                        }`}
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Test Purchase Chime</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setFilter('ALL')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          filter === 'ALL'
                            ? 'bg-cyan-500 text-black'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        All ({activities.length})
                      </button>
                      <button
                        onClick={() => setFilter('DEPOSIT')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          filter === 'DEPOSIT'
                            ? 'bg-emerald-500 text-black'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        Deposits
                      </button>
                      <button
                        onClick={() => setFilter('PURCHASE')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          filter === 'PURCHASE'
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        Purchases
                      </button>
                    </div>

                    {activities.length > 0 && onClearActivities && (
                      <button
                        onClick={onClearActivities}
                        className="text-[10px] text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Activities List */}
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {filteredActivities.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 space-y-1">
                        <Bell className="w-6 h-6 mx-auto text-gray-600" />
                        <div className="text-xs font-bold text-gray-300">No store activities yet</div>
                        <p className="text-[10px] text-gray-500">
                          Incoming deposits and key purchases will ring here in real-time.
                        </p>
                      </div>
                    ) : (
                      filteredActivities.map((act) => (
                        <div
                          key={act.id}
                          onClick={() => {
                            if (onSelectActivity) onSelectActivity(act);
                            setIsOpen(false);
                          }}
                          className={`p-2.5 rounded-2xl border transition-all cursor-pointer text-xs space-y-1 ${
                            act.type === 'DEPOSIT' || act.type === 'TOPUP'
                              ? 'bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-500/20 hover:border-emerald-500/40'
                              : 'bg-cyan-950/20 hover:bg-cyan-950/40 border-cyan-500/20 hover:border-cyan-500/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-1 py-0.5 rounded text-[8.5px] font-black uppercase ${
                                  act.type === 'DEPOSIT' || act.type === 'TOPUP'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                }`}
                              >
                                {act.type}
                              </span>
                              <span className="font-bold text-white truncate max-w-[150px]">
                                {act.title}
                              </span>
                            </div>
                            <span className="text-[9.5px] text-gray-400 font-mono">
                              {act.createdAtStr || 'Just now'}
                            </span>
                          </div>

                          <div className="text-[11px] text-gray-300 leading-snug">
                            {act.message}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                            <span className="font-mono font-bold text-emerald-400">
                              {formatCurrency(act.amount)}
                            </span>
                            <span className="text-gray-400 font-mono">
                              @{act.userName}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};
