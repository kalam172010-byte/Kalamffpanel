import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  LayoutDashboard,
  Wallet,
  ShoppingCart,
  Key,
  Clock,
  Gift,
  LifeBuoy,
  User,
  ShieldCheck,
  LogOut,
  Zap,
  LogIn,
  Mail,
  Calendar,
  Sparkles
} from 'lucide-react';
import { AuthUser, StoreSettings } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { StoreLogo } from '../shared/store-logo';

export type UserNavTab =
  | 'dashboard'
  | 'deposit'
  | 'buy_keys'
  | 'my_keys'
  | 'history'
  | 'referral'
  | 'tickets'
  | 'profile';

interface UserSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: UserNavTab;
  onSelectTab: (tab: UserNavTab) => void;
  onSwitchToAdmin?: () => void;
  currentUser?: AuthUser | null;
  storeSettings?: StoreSettings;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}

const MENU_ITEMS: { id: UserNavTab; label: string; icon: any; badge?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'deposit', label: 'Deposit', icon: Wallet },
  { id: 'buy_keys', label: 'Buy Keys', icon: ShoppingCart },
  { id: 'my_keys', label: 'My Keys', icon: Key },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'referral', label: 'Refer And Earn Money', icon: Gift },
  { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy },
];

export const UserSidebar: React.FC<UserSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onSwitchToAdmin,
  currentUser,
  storeSettings,
  onOpenAuthModal,
  onLogout,
}) => {
  const configuredAdminEmail = (storeSettings?.adminEmail || 'kalam172010@gmail.com').trim().toLowerCase();
  const isMasterAdmin = Boolean(
    currentUser &&
      (currentUser.role === 'ADMIN' ||
       currentUser.email?.trim().toLowerCase() === configuredAdminEmail ||
       currentUser.email?.trim().toLowerCase() === 'kalam172010@gmail.com' ||
       currentUser.email?.trim().toLowerCase() === 'kalam2000abc@gmail.com')
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Drawer Sheet */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0a0a0f] border-r border-white/10 p-5 flex flex-col justify-between shadow-[0_0_50px_rgba(0,229,255,0.15)] overflow-y-auto"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00e5ff] via-[#8b5cf6] to-[#ff0080] p-[1.5px] shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                    <StoreLogo
                      logoUrl={storeSettings?.logoUrl}
                      alt={storeSettings?.shopName || 'KALAM FF PANEL'}
                      className="w-full h-full object-cover rounded-[10px]"
                    />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-[#00e5ff] text-glow-cyan tracking-wider uppercase">
                      {storeSettings?.shopName || 'KALAM FF PANEL'}
                    </h2>
                    <span className="text-[10px] text-gray-400 font-medium">{storeSettings?.tagline || 'Customer Portal v2.4'}</span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Navigation */}
              <div className="mt-4 space-y-1">
                {MENU_ITEMS.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white/10 text-white border-l-4 border-[#8b5cf6] shadow-[inset_0_0_15px_rgba(139,92,246,0.2)]'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#8b5cf6]' : 'text-gray-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-gradient-to-r from-amber-400 to-rose-500 text-black shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Settings Section */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <span className="text-[10px] font-extrabold text-[#00e5ff] tracking-wider uppercase px-3.5">
                  SETTINGS
                </span>

                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => {
                      onSelectTab('profile');
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'profile'
                        ? 'bg-white/10 text-white border-l-4 border-[#8b5cf6]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    <span>My Profile</span>
                  </button>

                  {isMasterAdmin && onSwitchToAdmin && (
                    <button
                      onClick={() => {
                        onClose();
                        onSwitchToAdmin();
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-yellow-300 bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-yellow-400" />
                        <span>Master Admin Panel</span>
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-500/30 font-mono text-yellow-300 font-black">
                        ADMIN
                      </span>
                    </button>
                  )}
                </div>
              </div>
              {/* User Account / Auth Section */}
              <div className="mt-4 pt-4 border-t border-white/10">
                {currentUser ? (
                  <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#00e5ff] to-[#8b5cf6] flex items-center justify-center font-bold text-white text-xs">
                        {currentUser.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-white block truncate">
                          {currentUser.name}
                        </span>
                        <span className="text-[9px] text-[#00e5ff] font-mono block truncate flex items-center gap-1">
                          <Mail className="w-2.5 h-2.5 text-[#00e5ff]" />
                          <span>{currentUser.email}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[10px]">
                      <span className="text-gray-400 font-medium">Balance:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatCurrency(currentUser.walletBalance || 0)}
                      </span>
                    </div>
                    {currentUser.joinedDate && (
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/5">
                        <span className="text-gray-400 font-medium flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-[#00e5ff]" />
                          <span>Joined:</span>
                        </span>
                        <span className="font-mono text-[#00e5ff] text-[10px]">
                          {currentUser.joinedDate}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenAuthModal) onOpenAuthModal();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#00e5ff]/20 to-[#8b5cf6]/20 hover:from-[#00e5ff]/30 hover:to-[#8b5cf6]/30 border border-[#00e5ff]/40 text-[#00e5ff] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Email & Password Login</span>
                  </button>
                )}
              </div>
            </div>

            {/* Logout / Login Footer */}
            <div className="pt-4 border-t border-white/10">
              {currentUser ? (
                <button
                  onClick={() => {
                    onClose();
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-[#ef4444] hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-[#ef4444]" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenAuthModal) onOpenAuthModal();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-[#00e5ff]" />
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
