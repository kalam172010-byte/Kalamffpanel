import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Menu, Play, MessageCircle, User, ShieldCheck, LogIn, Megaphone, AlertTriangle } from 'lucide-react';
import { UserSidebar, UserNavTab } from './user-sidebar';
import { FloatingSupport } from '../shared/floating-support';
import { StoreSettings, AuthUser } from '../../types';
import { StoreLogo } from '../shared/store-logo';

interface UserLayoutProps {
  children: React.ReactNode;
  activeTab: UserNavTab;
  onSelectTab: (tab: UserNavTab) => void;
  onOpenHowToDeposit: () => void;
  onOpenSupport: () => void;
  onOpenProfile: () => void;
  onSwitchToAdmin: () => void;
  storeSettings: StoreSettings;
  currentUser?: AuthUser | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}

export const UserLayout: React.FC<UserLayoutProps> = ({
  children,
  activeTab,
  onSelectTab,
  onOpenHowToDeposit,
  onOpenSupport,
  onOpenProfile,
  onSwitchToAdmin,
  storeSettings,
  currentUser,
  onOpenAuthModal,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMasterAdmin = Boolean(
    currentUser &&
      (currentUser.email?.trim().toLowerCase() === 'kalam172010@gmail.com' ||
       currentUser.email?.trim().toLowerCase() === 'kalam2000abc@gmail.com' ||
       currentUser.role === 'ADMIN')
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-start selection:bg-[#ff0080]/30 selection:text-white">
      {/* Mobile Shell Container (Max width md centered) */}
      <div className="w-full max-w-md min-h-screen bg-[#0a0a0f] flex flex-col relative border-x border-white/5 shadow-[0_0_60px_rgba(0,0,0,0.8)] pb-20">
        {/* Top Header / Store Status Banner */}
        <div className="bg-[#10101a] border-b border-white/10 px-3 py-1.5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-gray-300">
            <StoreLogo
              logoUrl={storeSettings?.logoUrl}
              alt="Logo"
              className="w-5 h-5 rounded-md object-cover border border-[#8b5cf6]/50 shadow-[0_0_8px_rgba(139,92,246,0.4)]"
            />
            <span className="font-bold text-white uppercase text-[10px] tracking-wide flex items-center gap-1.5">
              <span>{storeSettings?.shopName || 'KALAM FF PANEL'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </span>
          </div>
          {isMasterAdmin ? (
            <button
              onClick={onSwitchToAdmin}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/40 text-yellow-400 font-bold text-[10px] shadow-[0_0_10px_rgba(234,179,8,0.2)] transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3 text-yellow-400" />
              <span>Admin Panel</span>
            </button>
          ) : (
            <span className="text-[10px] text-emerald-400/90 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>ONLINE 24/7</span>
            </span>
          )}
        </div>

        {/* Top Navigation Bar */}
        <header
          id="user-top-navbar"
          className="sticky top-0 z-30 bg-[#0c0c14] border-b border-white/10 px-4 py-3 flex items-center justify-between gap-2 shadow-md"
        >
          {/* Left: Hamburger Icon */}
          <motion.button
            id="user-hamburger-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-200 hover:text-white transition-colors cursor-pointer"
            aria-label="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </motion.button>

          {/* Center: Red rounded pill button "HOW TO DEPOSIT?" with Play icon inside */}
          <motion.button
            id="how-to-deposit-pill-btn"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenHowToDeposit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-[11px] tracking-wide shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-400/40 cursor-pointer transition-all uppercase"
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
              <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
            </span>
            <span>HOW TO DEPOSIT?</span>
          </motion.button>

          {/* Right: Two circular icon buttons */}
          <div className="flex items-center gap-2">
            {/* Help/Chat icon in cyan border */}
            <motion.button
              id="help-chat-btn"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onOpenSupport}
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-[#00e5ff]/10 border border-[#00e5ff]/50 text-[#00e5ff] flex items-center justify-center shadow-[0_0_12px_rgba(0,229,255,0.25)] transition-colors cursor-pointer"
              aria-label="Help & Support"
            >
              <MessageCircle className="w-4 h-4" />
            </motion.button>

            {/* User profile avatar or Login button */}
            {currentUser ? (
              <motion.button
                id="user-avatar-btn"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={onOpenProfile}
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#161622] via-[#8b5cf6] to-[#00e5ff] p-[1.5px] ring-2 ring-[#00e5ff]/70 shadow-[0_0_12px_rgba(0,229,255,0.3)] flex items-center justify-center cursor-pointer"
                aria-label="Profile"
                title={`Logged in as ${currentUser.email}`}
              >
                <div className="w-full h-full rounded-full bg-[#161622] flex items-center justify-center font-bold text-[11px] text-[#00e5ff]">
                  {currentUser.name.slice(0, 1).toUpperCase()}
                </div>
              </motion.button>
            ) : (
              <motion.button
                id="login-btn-top"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenAuthModal}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00e5ff]/20 to-[#8b5cf6]/20 hover:from-[#00e5ff]/30 hover:to-[#8b5cf6]/30 border border-[#00e5ff]/40 text-[#00e5ff] text-[11px] font-bold shadow-[0_0_10px_rgba(0,229,255,0.2)] cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </motion.button>
            )}
          </div>
        </header>

        {/* Live Announcement Marquee Banner (configured manually in Store Settings) */}
        {storeSettings?.announcementEnabled && storeSettings?.announcementText && (
          <div className="bg-gradient-to-r from-[#00e5ff]/20 via-[#8b5cf6]/25 to-[#ff0080]/20 border-b border-[#00e5ff]/30 px-3 py-1.5 flex items-center gap-2 overflow-hidden shadow-[0_0_15px_rgba(0,229,255,0.15)]">
            <div className="shrink-0 flex items-center gap-1 text-[#00e5ff] text-[10px] font-black uppercase tracking-wider bg-black/40 px-1.5 py-0.5 rounded border border-[#00e5ff]/40">
              <Megaphone className="w-3 h-3 animate-bounce" />
              <span>NOTICE</span>
            </div>
            <div className="text-[11px] text-white font-medium truncate">
              {storeSettings.announcementText}
            </div>
          </div>
        )}

        {/* Store Maintenance Notice (if enabled in Store Settings) */}
        {storeSettings?.maintenanceMode && (
          <div className="bg-red-950/80 border-b border-red-600/50 px-3 py-2 flex items-center justify-between gap-2 text-red-200 text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Store is currently undergoing routine maintenance.</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-600/30 text-red-300 font-mono font-bold border border-red-500/40">
              MAINTENANCE
            </span>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 space-y-4">{children}</main>

        {/* User Sidebar Sheet */}
        <UserSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          onSwitchToAdmin={onSwitchToAdmin}
          currentUser={currentUser}
          storeSettings={storeSettings}
          onOpenAuthModal={onOpenAuthModal}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
};

