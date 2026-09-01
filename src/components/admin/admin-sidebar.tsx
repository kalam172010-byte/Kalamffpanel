import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  LayoutDashboard,
  Box,
  KeyRound,
  Link2,
  Plug,
  CreditCard,
  Settings,
  Users,
  UserCog,
  ScrollText,
  Handshake,
  Ticket,
  ArrowUpCircle,
  Coins,
  Megaphone,
  UserCircle,
  ExternalLink,
  Zap,
  Mail,
  Crown,
  LogOut,
  Activity,
  Sparkles
} from 'lucide-react';
import { AuthUser, StoreSettings } from '../../types';
import { StoreLogo } from '../shared/store-logo';

export type AdminNavTab =
  | 'dashboard'
  | 'user_management'
  | 'products'
  | 'id_stock'
  | 'product_links'
  | 'api_setup'
  | 'api_diagnostic'
  | 'upi_payment'
  | 'store_settings'
  | 'members_wallets'
  | 'sold_keys'
  | 'resellers'
  | 'coupons'
  | 'topups'
  | 'binance'
  | 'broadcast'
  | 'profile';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AdminNavTab;
  onSelectTab: (tab: AdminNavTab) => void;
  onSwitchToUser?: () => void;
  currentUser?: AuthUser | null;
  storeSettings?: StoreSettings;
  onLogout?: () => void;
}

const ADMIN_MENU_ITEMS: { id: AdminNavTab; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'user_management', label: 'User Management', icon: UserCog },
  { id: 'products', label: 'Manage Product', icon: Box },
  { id: 'id_stock', label: 'ID Stock', icon: KeyRound },
  { id: 'product_links', label: 'Product Links', icon: Link2 },
  { id: 'api_setup', label: 'Key Delivery API Setup', icon: Plug },
  { id: 'api_diagnostic', label: 'API Test Diagnostic', icon: Activity },
  { id: 'upi_payment', label: 'UPI & Payment Gateway', icon: CreditCard },
  { id: 'store_settings', label: 'Store Settings', icon: Settings },
  { id: 'members_wallets', label: 'Members & Wallets', icon: Users },
  { id: 'sold_keys', label: 'Sold Key Live History', icon: ScrollText },
  { id: 'resellers', label: 'Resellers', icon: Handshake },
  { id: 'coupons', label: 'Coupon Manager', icon: Ticket },
  { id: 'topups', label: 'Top-ups', icon: ArrowUpCircle },
  { id: 'binance', label: 'Binance Wallet', icon: Coins },
  { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
  { id: 'profile', label: 'My Profile', icon: UserCircle },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onSwitchToUser,
  currentUser,
  storeSettings,
  onLogout,
}) => {
  const adminEmail = currentUser?.email || 'kalam172010@gmail.com';
  const adminName = currentUser?.name || 'KALAM MASTER ADMIN';

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

          {/* Drawer */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0a0a0f] border-r border-white/10 p-5 flex flex-col justify-between shadow-[0_0_50px_rgba(0,229,255,0.2)] overflow-y-auto"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00e5ff] via-[#8b5cf6] to-yellow-400 p-[1.5px] shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                    <StoreLogo
                      logoUrl={storeSettings?.logoUrl}
                      alt={storeSettings?.shopName || 'KALAM FF PANEL'}
                      className="w-full h-full object-cover rounded-[10px]"
                    />
                  </div>
                  <div>
                    <h2 className="text-xs font-black tracking-wider text-white">
                      <span className="text-[#00e5ff]">Bot Control</span>{' '}
                      <span className="text-yellow-400">Center</span>
                    </h2>
                    <span className="text-[9px] text-gray-400 uppercase font-mono">Master Panel</span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Admin Identity Card */}
              <div className="mt-3 p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 shrink-0">
                  <Crown className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-white block truncate">{adminName}</span>
                  <span className="text-[9px] text-[#00e5ff] font-mono block truncate flex items-center gap-1">
                    <Mail className="w-2.5 h-2.5" />
                    <span>{adminEmail}</span>
                  </span>
                </div>
              </div>

              {/* Navigation List */}
              <div className="mt-3 space-y-1">
                {ADMIN_MENU_ITEMS.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-white/10 text-[#00e5ff] border-l-4 border-[#00e5ff] font-bold shadow-[inset_0_0_15px_rgba(0,229,255,0.15)]'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#00e5ff]' : 'text-gray-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions: Switch & Logout */}
            <div className="space-y-2 pt-4 border-t border-white/10 mt-6">
              {onSwitchToUser && (
                <button
                  onClick={() => {
                    onClose();
                    onSwitchToUser();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#ff0080]/20 to-[#8b5cf6]/20 border border-[#ff0080]/30 hover:border-[#ff0080]/60 shadow-[0_0_15px_rgba(255,0,128,0.2)] transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-[#ff0080]" />
                    <span>User Panel Store</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ff0080]/30 text-[#ff0080] font-mono">
                    VIEW
                  </span>
                </button>
              )}

              {onLogout && (
                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out Admin</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
