import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  Zap,
  Crown,
  ArrowLeft,
  Store,
  LogOut,
  Mail,
  Search,
  X,
  Box,
  Users,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Shield,
  Tag,
} from 'lucide-react';
import { AdminSidebar, AdminNavTab } from './admin-sidebar';
import { StoreSettings, AuthUser, Product, ResellerUser, StoreActivityNotification } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { StoreLogo } from '../shared/store-logo';
import { AdminActivityNotifier } from './admin-activity-notifier';
import { deduplicateUsers } from '../../lib/firestore-service';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: AdminNavTab;
  onSelectTab: (tab: AdminNavTab) => void;
  onSwitchToUser: () => void;
  storeSettings: StoreSettings;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  products?: Product[];
  users?: ResellerUser[];
  activities?: StoreActivityNotification[];
  unreadActivityCount?: number;
  soundMuted?: boolean;
  onToggleSound?: () => void;
  onClearActivities?: () => void;
  activeToast?: StoreActivityNotification | null;
  onDismissToast?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab,
  onSelectTab,
  onSwitchToUser,
  storeSettings,
  currentUser,
  onLogout,
  products = [],
  users = [],
  activities = [],
  unreadActivityCount = 0,
  soundMuted = false,
  onToggleSound = () => {},
  onClearActivities,
  activeToast = null,
  onDismissToast = () => {},
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products matching query
  const matchedProducts = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
          p.plans.some((pl) => pl.duration.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 4)
    : [];

  // Filter users matching query
  const matchedUsers = searchQuery.trim()
    ? deduplicateUsers(users || []).filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.phone && u.phone.includes(searchQuery)) ||
          u.id.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  // Quick navigation tab suggestions
  const adminNavSuggestions = searchQuery.trim()
    ? [
        { id: 'user_management', label: 'User Management', keywords: ['user', 'users', 'reseller', 'account', 'customer', 'balance'] },
        { id: 'products', label: 'Manage Products', keywords: ['product', 'products', 'game', 'pubg', 'bgmi', 'catalog'] },
        { id: 'id_stock', label: 'ID Stock', keywords: ['id', 'stock', 'license', 'key', 'inventory'] },
        { id: 'upi_payment', label: 'UPI Gateways', keywords: ['upi', 'qr', 'payment', 'gateway', 'qr code'] },
        { id: 'api_setup', label: 'API Setup', keywords: ['api', 'restock', 'cron', 'endpoint', 'server'] },
        { id: 'api_diagnostic', label: 'API Diagnostic', keywords: ['diagnostic', 'test', 'ping', 'latency', 'debug'] },
        { id: 'store_settings', label: 'Store Settings', keywords: ['setting', 'settings', 'config', 'support', 'upi id'] },
      ].filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords.some((k) => k.includes(searchQuery.toLowerCase()))
      ).slice(0, 3)
    : [];

  const totalResultsCount = matchedProducts.length + matchedUsers.length + adminNavSuggestions.length;

  const handleSelectProduct = (product: Product) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    onSelectTab('products');
  };

  const handleSelectUser = (user: ResellerUser) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    onSelectTab('user_management');
  };

  const handleSelectNav = (tab: AdminNavTab) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    onSelectTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-start selection:bg-[#00e5ff]/30 selection:text-white">
      {/* Mobile Shell Container */}
      <div className="w-full max-w-md min-h-screen bg-[#0a0a0f] flex flex-col relative border-x border-white/5 shadow-[0_0_60px_rgba(0,0,0,0.8)] pb-16">
        {/* Top Switcher Banner */}
        <div className="bg-gradient-to-r from-[#161622] via-[#1b2238] to-[#161622] border-b border-white/10 px-3 py-1.5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-gray-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-white uppercase text-[10px] tracking-wide">
              ADMIN CONTROL MODE
            </span>
          </div>
          <button
            onClick={onSwitchToUser}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ff0080]/15 hover:bg-[#ff0080]/25 border border-[#ff0080]/40 text-[#ff0080] font-bold text-[10px] shadow-[0_0_10px_rgba(255,0,128,0.2)] transition-all cursor-pointer"
          >
            <Store className="w-3 h-3 text-[#ff0080]" />
            <span>Switch to User Store</span>
          </button>
        </div>

        {/* Admin Top Header & Search Bar */}
        <header
          id="admin-top-navbar"
          ref={searchContainerRef}
          className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10 px-3.5 py-2.5 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            {/* Left: Hamburger button */}
            <motion.button
              id="admin-hamburger-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-200 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Open Admin Menu"
            >
              <Menu className="w-4 h-4" />
            </motion.button>

            {/* Center: Lightning bolt icon + "Bot Control Center" */}
            <div
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <StoreLogo
                logoUrl={storeSettings?.logoUrl}
                alt={storeSettings?.shopName || 'KALAM FF PANEL'}
                className="w-7 h-7 rounded-lg object-cover border border-[#8b5cf6]/50 shadow-[0_0_12px_rgba(139,92,246,0.4)]"
              />
              <h1 className="text-xs font-black tracking-tight">
                <span className="text-[#00e5ff] text-glow-cyan">Bot Control</span>{' '}
                <span className="text-yellow-400">Center</span>
              </h1>
            </div>

            {/* Right: Sound toggle + Live Notification Bell + Crown avatar button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <AdminActivityNotifier
                activities={activities}
                unreadCount={unreadActivityCount}
                soundMuted={soundMuted}
                onToggleSound={onToggleSound}
                onClearActivities={onClearActivities}
                onSelectActivity={(act) => {
                  if (act.type === 'DEPOSIT' || act.type === 'TOPUP') {
                    onSelectTab('user_management');
                  } else {
                    onSelectTab('products');
                  }
                }}
                activeToast={activeToast}
                onDismissToast={onDismissToast}
              />

              <motion.button
                id="admin-crown-avatar-btn"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onSelectTab('profile')}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500/30 to-amber-500/20 border border-yellow-500/50 text-yellow-400 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.25)] cursor-pointer shrink-0"
                aria-label="Master Admin Profile"
                title="Master Admin Profile"
              >
                <Crown className="w-3.5 h-3.5 fill-yellow-400/40" />
              </motion.button>
            </div>
          </div>

          {/* Quick Global Search Input in Top Navbar */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-3.5 h-3.5 text-cyan-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                id="admin-global-search-input"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Quick search products, users, stock, APIs..."
                className="w-full pl-8.5 pr-8 py-1.5 rounded-xl bg-black/60 border border-cyan-500/30 hover:border-cyan-400/60 focus:border-cyan-400 text-xs text-white placeholder-gray-400 focus:outline-none transition-all shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)] font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-2.5 p-0.5 text-gray-400 hover:text-white rounded transition-colors"
                  aria-label="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Results Overlay */}
            <AnimatePresence>
              {isSearchOpen && searchQuery.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#141420] border border-cyan-500/40 rounded-2xl p-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.9)] max-h-80 overflow-y-auto space-y-2.5 backdrop-blur-2xl"
                >
                  {totalResultsCount === 0 ? (
                    <div className="py-4 text-center text-gray-400 space-y-1">
                      <Search className="w-5 h-5 mx-auto text-gray-600" />
                      <div className="text-xs font-bold text-gray-300">No matching items found</div>
                      <p className="text-[10px] text-gray-400">
                        Try searching for a product name, customer email, or admin section
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Products Match Section */}
                      {matchedProducts.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-1.5 mb-1">
                            <span className="flex items-center gap-1">
                              <Box className="w-3 h-3" /> Products ({matchedProducts.length})
                            </span>
                            <span className="text-gray-400 font-mono text-[9px]">Click to view</span>
                          </div>
                          <div className="space-y-1">
                            {matchedProducts.map((prod) => (
                              <button
                                key={prod.id}
                                onClick={() => handleSelectProduct(prod)}
                                className="w-full p-2 rounded-xl bg-white/5 hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-500/30 flex items-center justify-between text-left transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center text-xs overflow-hidden shrink-0">
                                    {prod.imageUrl ? (
                                      <img
                                        src={prod.imageUrl}
                                        alt={prod.name}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <Box className="w-3.5 h-3.5 text-cyan-400" />
                                    )}
                                  </div>
                                  <div className="truncate">
                                    <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                                      {prod.name}
                                    </div>
                                    <div className="text-[10px] text-gray-400 truncate flex items-center gap-1.5">
                                      <span>{prod.category}</span>
                                      <span>•</span>
                                      <span>{prod.plans.length} plans</span>
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-400 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Users Match Section */}
                      {matchedUsers.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-pink-400 px-1.5 mb-1">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> Users & Resellers ({matchedUsers.length})
                            </span>
                            <span className="text-gray-400 font-mono text-[9px]">Click to manage</span>
                          </div>
                          <div className="space-y-1">
                            {matchedUsers.map((u, idx) => (
                              <button
                                key={`${u.id || 'user'}_${idx}`}
                                onClick={() => handleSelectUser(u)}
                                className="w-full p-2 rounded-xl bg-white/5 hover:bg-pink-500/15 border border-white/5 hover:border-pink-500/30 flex items-center justify-between text-left transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-pink-500/30 to-purple-600/30 border border-pink-500/30 flex items-center justify-center text-xs font-black text-white shrink-0">
                                    {(u.name || 'U').slice(0, 1)}
                                  </div>
                                  <div className="truncate">
                                    <div className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors truncate flex items-center gap-1.5">
                                      <span>{u.name}</span>
                                      {u.isReseller && (
                                        <span className="text-[8px] px-1 py-0.2 rounded bg-purple-500/30 text-purple-300 font-bold border border-purple-500/40">
                                          RESELLER
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-mono truncate">
                                      {u.email}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-[10px] font-bold text-amber-300 font-mono">
                                    {formatCurrency(u.walletBalance || 0)}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Navigation Suggestions Section */}
                      {adminNavSuggestions.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 px-1.5 mb-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Quick Admin Sections
                          </div>
                          <div className="space-y-1">
                            {adminNavSuggestions.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleSelectNav(item.id as AdminNavTab)}
                                className="w-full p-2 rounded-xl bg-white/5 hover:bg-purple-500/15 border border-white/5 hover:border-purple-500/30 flex items-center justify-between text-left transition-all cursor-pointer group"
                              >
                                <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                                  {item.label}
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-400 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Admin Navigation Quick Tabs Carousel */}
        <div className="bg-[#161622]/60 border-b border-white/5 px-3 py-2 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'user_management', label: '👥 User Manager' },
            { id: 'api_diagnostic', label: '⚡ API Diagnostic' },
            { id: 'products', label: 'Products' },
            { id: 'id_stock', label: 'ID Stock' },
            { id: 'product_links', label: 'Links' },
            { id: 'api_setup', label: 'API Setup' },
            { id: 'upi_payment', label: 'UPI Gateways' },
            { id: 'store_settings', label: 'Store Settings' },
            { id: 'resellers', label: 'Resellers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as AdminNavTab)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/50 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                  : 'text-gray-400 hover:text-white bg-white/5 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 space-y-4">{children}</main>

        {/* Admin Sidebar Sheet */}
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          onSwitchToUser={onSwitchToUser}
          currentUser={currentUser}
          storeSettings={storeSettings}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
};
