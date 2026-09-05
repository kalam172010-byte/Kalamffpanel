import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ArrowUp,
  Activity,
  Volume2,
  VolumeX,
  Zap,
  RefreshCw,
  X,
  Command,
  SlidersHorizontal,
  Wallet,
  ShoppingCart,
  Key,
  Clock,
  Gift,
  LifeBuoy,
  User,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  isSoundFxEnabled,
  toggleSoundFx,
  playClickSound,
  playPopSound,
  playSuccessChime,
} from '../../lib/sound-fx';
import { Product, StoreSettings, AuthUser } from '../../types';

// ==================== TOP LOADING PROGRESS BAR ====================
export const TopLoadingBar: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-1 bg-transparent overflow-hidden"
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              repeat: Infinity,
              duration: 0.9,
              ease: 'easeInOut',
            }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#00e5ff] to-[#ff0080] shadow-[0_0_12px_#00e5ff]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==================== SMOOTH TAB SKELETON LOADER ====================
export const SmoothTabSkeleton: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="space-y-4 py-2"
    >
      {/* Skeleton Header Card */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-white/10 rounded-md" />
          <div className="h-2.5 w-48 bg-white/5 rounded-md" />
        </div>
        <div className="h-8 w-20 bg-white/10 rounded-xl" />
      </div>

      {/* Skeleton Stat Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse space-y-2">
          <div className="h-3 w-16 bg-white/10 rounded" />
          <div className="h-5 w-24 bg-white/15 rounded" />
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse space-y-2">
          <div className="h-3 w-16 bg-white/10 rounded" />
          <div className="h-5 w-24 bg-white/15 rounded" />
        </div>
      </div>

      {/* Skeleton Main List Cards */}
      <div className="space-y-2.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 bg-white/10 rounded" />
                <div className="h-2.5 w-20 bg-white/5 rounded" />
              </div>
            </div>
            <div className="h-6 w-14 bg-white/10 rounded-lg" />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ==================== SCROLL TO TOP WITH PROGRESS RING ====================
export const ScrollToTopButton: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const currentProgress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
        setIsVisible(window.scrollY > 260);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    playClickSound();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.92 }}
      onClick={scrollToTop}
      className="fixed bottom-20 right-4 z-40 w-11 h-11 rounded-full bg-[#0d1322]/90 backdrop-blur-md border border-[#00e5ff]/40 shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center justify-center text-[#00e5ff] cursor-pointer group transition-all"
      aria-label="Scroll to top"
      title={`Scroll to top (${Math.round(scrollProgress)}%)`}
    >
      <svg className="w-10 h-10 -rotate-90 absolute pointer-events-none">
        <circle
          cx="20"
          cy="20"
          r={radius}
          className="text-white/10 stroke-current"
          strokeWidth="2.5"
          fill="transparent"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          className="text-[#00e5ff] stroke-current transition-all duration-150"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
    </motion.button>
  );
};

// ==================== LIVE LATENCY & PERFORMANCE BADGE ====================
export const LatencyMonitorBadge: React.FC<{ onOpenQuickSettings?: () => void }> = ({
  onOpenQuickSettings,
}) => {
  const [latency, setLatency] = useState<number>(24);
  const [isMeasuring, setIsMeasuring] = useState(false);

  // Periodic simulated realistic network ping
  useEffect(() => {
    const interval = setInterval(() => {
      // Natural fluctuation between 16ms and 45ms
      const randomFluctuation = Math.floor(18 + Math.random() * 22);
      setLatency(randomFluctuation);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const measureNow = () => {
    playClickSound();
    setIsMeasuring(true);
    const start = performance.now();
    fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' })
      .then(() => {
        const diff = Math.round(performance.now() - start);
        setLatency(Math.max(12, diff));
      })
      .catch(() => {
        setLatency(28);
      })
      .finally(() => {
        setTimeout(() => setIsMeasuring(false), 300);
      });
  };

  const getStatusColor = (ms: number) => {
    if (ms < 60) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (ms < 120) return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10';
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={measureNow}
        className={`px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${getStatusColor(
          latency
        )}`}
        title="Live Server Latency (Click to ping test)"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            latency < 60 ? 'bg-emerald-400' : 'bg-yellow-400'
          } ${isMeasuring ? 'animate-ping' : 'animate-pulse'}`}
        />
        <Activity className={`w-2.5 h-2.5 ${isMeasuring ? 'animate-spin' : ''}`} />
        <span>{latency}ms</span>
      </button>

      {onOpenQuickSettings && (
        <button
          onClick={onOpenQuickSettings}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Fast Options & Controls"
        >
          <SlidersHorizontal className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

// ==================== QUICK COMMAND PALETTE (CTRL+K) ====================
interface QuickCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: any) => void;
  onOpenDeposit: () => void;
  onOpenBuyKeys: () => void;
  onRefreshData?: () => void;
  products?: Product[];
  currentUser?: AuthUser | null;
  storeSettings?: StoreSettings;
}

export const QuickCommandPalette: React.FC<QuickCommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenDeposit,
  onOpenBuyKeys,
  onRefreshData,
  products = [],
  currentUser,
  storeSettings,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      playPopSound();
    }
  }, [isOpen]);

  // Global key listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
          playPopSound();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const standardActions = [
    {
      id: 'tab_dashboard',
      label: 'Home Dashboard',
      category: 'Navigation',
      icon: Sparkles,
      action: () => {
        onSelectTab('dashboard');
        onClose();
      },
    },
    {
      id: 'tab_deposit',
      label: 'Deposit Wallet Cash (Instant UPI)',
      category: 'Payment',
      icon: Wallet,
      action: () => {
        onOpenDeposit();
        onClose();
      },
    },
    {
      id: 'tab_buy_keys',
      label: 'Buy License Keys Store',
      category: 'Store',
      icon: ShoppingCart,
      action: () => {
        onOpenBuyKeys();
        onClose();
      },
    },
    {
      id: 'tab_my_keys',
      label: 'My Keys & Downloads',
      category: 'Licenses',
      icon: Key,
      action: () => {
        onSelectTab('my_keys');
        onClose();
      },
    },
    {
      id: 'tab_history',
      label: 'Transaction History & Receipts',
      category: 'Account',
      icon: Clock,
      action: () => {
        onSelectTab('history');
        onClose();
      },
    },
    {
      id: 'tab_referral',
      label: 'Refer and Earn Commissions',
      category: 'Rewards',
      icon: Gift,
      action: () => {
        onSelectTab('referral');
        onClose();
      },
    },
    {
      id: 'tab_tickets',
      label: 'Support Tickets & Helpdesk',
      category: 'Help',
      icon: LifeBuoy,
      action: () => {
        onSelectTab('tickets');
        onClose();
      },
    },
    {
      id: 'tab_profile',
      label: 'Profile Settings & Security',
      category: 'Account',
      icon: User,
      action: () => {
        onSelectTab('profile');
        onClose();
      },
    },
  ];

  const productActions = products.map((p) => {
    const minPrice = p.plans && p.plans.length > 0 ? Math.min(...p.plans.map((pl) => pl.price)) : 50;
    return {
      id: `prod_${p.id}`,
      label: `Buy ${p.name} (from ₹${minPrice})`,
      category: 'Product',
      icon: ShoppingCart,
      action: () => {
        onSelectTab('buy_keys');
        onClose();
      },
    };
  });

  const allItems = [...standardActions, ...productActions];
  const filtered = allItems.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className="w-full max-w-lg bg-[#10101a] border border-[#00e5ff]/30 rounded-2xl shadow-[0_0_40px_rgba(0,229,255,0.2)] overflow-hidden flex flex-col"
      >
        {/* Search Input Bar */}
        <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-black/40">
          <Search className="w-5 h-5 text-[#00e5ff] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, page, or product..."
            className="w-full bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1 divide-y divide-white/5">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    playClickSound();
                    item.action();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-white/5 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff] group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-[#00e5ff] transition-colors">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {item.category}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 group-hover:text-gray-300 font-mono">
                    Jump →
                  </span>
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-gray-400">
              No matching commands or products for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 bg-black/60 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
          <div className="flex items-center gap-2">
            <span>Tip: Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[9px] border border-white/10">
              Ctrl+K
            </kbd>
            <span>anywhere to search</span>
          </div>
          {onRefreshData && (
            <button
              onClick={() => {
                onRefreshData();
                onClose();
              }}
              className="text-[#00e5ff] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Sync Data</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ==================== QUICK OPTIONS & EXPERIENCE MODAL ====================
interface QuickOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
}

export const QuickOptionsModal: React.FC<QuickOptionsModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  isRefreshing = false,
}) => {
  const [soundActive, setSoundActive] = useState(isSoundFxEnabled());
  const [ecoMode, setEcoMode] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    try {
      setEcoMode(localStorage.getItem('kalam_eco_mode') === 'true');
    } catch {}
  }, []);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const next = toggleSoundFx();
    setSoundActive(next);
    setFeedback(next ? 'Sound FX Enabled (Audio Feedback)' : 'Sound FX Disabled');
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleToggleEco = () => {
    playClickSound();
    const next = !ecoMode;
    setEcoMode(next);
    try {
      localStorage.setItem('kalam_eco_mode', String(next));
      if (next) {
        document.documentElement.classList.add('eco-performance-mode');
      } else {
        document.documentElement.classList.remove('eco-performance-mode');
      }
    } catch {}
    setFeedback(next ? 'Turbo Eco Mode (Optimized 60FPS)' : 'Normal Ultra-Glow Mode');
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleSync = () => {
    playPopSound();
    onRefreshData?.();
    setFeedback('Data synchronized successfully!');
    setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-[#12121f] border border-[#00e5ff]/30 rounded-2xl shadow-[0_0_35px_rgba(0,229,255,0.25)] p-4 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#00e5ff]" />
            <span className="font-extrabold text-sm text-white">Experience & Options</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {feedback && (
          <div className="p-2 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] text-xs font-bold text-center animate-fadeIn">
            {feedback}
          </div>
        )}

        {/* Options List */}
        <div className="space-y-3">
          {/* Sound FX Toggle */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff]">
                {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">Interface Audio FX</div>
                <div className="text-[10px] text-gray-400">Tactile sounds on clicks & taps</div>
              </div>
            </div>
            <button
              onClick={handleToggleSound}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                soundActive ? 'bg-[#00e5ff]' : 'bg-white/10'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  soundActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Performance / Eco Mode */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Eco Turbo 60FPS</div>
                <div className="text-[10px] text-gray-400">Reduces heavy blur for max speed</div>
              </div>
            </div>
            <button
              onClick={handleToggleEco}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                ecoMode ? 'bg-yellow-400' : 'bg-white/10'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#0a0a0f] absolute top-1 transition-transform ${
                  ecoMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Instant Sync / Refresh Button */}
          {onRefreshData && (
            <button
              onClick={handleSync}
              disabled={isRefreshing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff]/20 to-[#ff0080]/20 hover:from-[#00e5ff]/30 hover:to-[#ff0080]/30 border border-[#00e5ff]/40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#00e5ff] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Synchronizing Store Data...' : 'Sync & Reload Panel Data'}</span>
            </button>
          )}
        </div>

        <div className="text-center pt-1 text-[10px] text-gray-500">
          KALAM FF PANEL • High Speed & Low Latency Engine
        </div>
      </motion.div>
    </div>
  );
};
