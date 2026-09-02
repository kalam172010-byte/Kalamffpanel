import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ArrowRight,
  Store,
  AlertTriangle,
  Sparkles,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { GlassCard } from '../shared/glass-card';
import { StoreLogo } from '../shared/store-logo';
import { AuthUser, StoreSettings } from '../../types';
import { auth, signInWithEmailAndPassword } from '../../lib/firebase';

interface AdminLoginGateProps {
  onAdminLoginSuccess: (user: AuthUser) => void;
  onReturnToStore: () => void;
  storeSettings?: StoreSettings;
  currentEmail?: string;
}

export const ADMIN_AUTHORIZED_EMAILS = [
  'kalam172010@gmail.com',
  'kalam2000abc@gmail.com',
];

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({
  onAdminLoginSuccess,
  onReturnToStore,
  storeSettings,
  currentEmail,
}) => {
  const configuredAdminEmail = (storeSettings?.adminEmail || 'kalam172010@gmail.com').trim().toLowerCase();
  const configuredAdminPassword = (storeSettings?.adminPassword || 'kalam@172010').trim();

  const authorizedEmails = Array.from(
    new Set([configuredAdminEmail, ...ADMIN_AUTHORIZED_EMAILS])
  );

  const [email, setEmail] = useState(currentEmail || configuredAdminEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Email and password are required.');
      return;
    }

    // STRICT OWNER CHECK
    const isAuthorizedAdmin = authorizedEmails.includes(cleanEmail);

    if (!isAuthorizedAdmin) {
      setErrorMsg(
        `Access Denied. Email '${cleanEmail}' is not registered as an authorized administrator.`
      );
      return;
    }

    if (cleanPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);

    try {
      let isVerified = false;

      // Check 1: Direct Master Password configured in Store Settings or standard master passwords
      if (
        cleanPassword === configuredAdminPassword ||
        cleanPassword === 'kalam@172010' ||
        cleanPassword === 'admin123' ||
        cleanPassword === 'kalam172010' ||
        cleanPassword === 'admin'
      ) {
        isVerified = true;
      } else {
        // Check 2: Try Firebase Authentication
        try {
          const userCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          if (userCred.user) {
            isVerified = true;
          }
        } catch {
          // Firebase signin failed
        }
      }

      if (!isVerified) {
        setErrorMsg('Invalid Admin Password! Please enter the exact password configured in your Store Settings / Admin Panel.');
        setIsLoading(false);
        return;
      }

      // Fetch admin balance from storage if present
      let adminBalance = 290011.65;
      try {
        const storedUsersRaw = localStorage.getItem('kalam_users_db');
        if (storedUsersRaw) {
          const storedUsers: any[] = JSON.parse(storedUsersRaw);
          const found = storedUsers.find(
            (u) => u.email && u.email.toLowerCase() === cleanEmail
          );
          if (found && typeof found.walletBalance === 'number') {
            adminBalance = found.walletBalance;
          }
        }
      } catch {
        // ignore
      }

      const adminUser: AuthUser = {
        id: 'USR_172010_ADMIN',
        email: cleanEmail,
        name: 'KALAM MASTER ADMIN',
        username: 'kalam_admin',
        role: 'ADMIN',
        walletBalance: adminBalance,
        joinedDate: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };

      try {
        localStorage.setItem('kalam_auth_user', JSON.stringify(adminUser));
      } catch {}

      setSuccessMsg('Admin Credentials Verified! Opening Control Center...');
      setTimeout(() => {
        onAdminLoginSuccess(adminUser);
      }, 700);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070c] text-white flex flex-col items-center justify-center p-4 selection:bg-yellow-500/30">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00e5ff]/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="w-full max-w-md relative z-10 space-y-4"
      >
        {/* Top Header Card */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-1 rounded-3xl bg-gradient-to-tr from-yellow-500 via-amber-500 to-orange-500 shadow-[0_0_35px_rgba(234,179,8,0.4)]">
            <StoreLogo
              logoUrl={storeSettings?.logoUrl}
              alt="KALAM FF PANEL Logo"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover"
            />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Admin Access Restricted
          </h1>
          <p className="text-xs text-amber-300/90 font-medium max-w-xs mx-auto">
            Please sign in with your authorized administrator email to access the control panel
          </p>
        </div>

        <GlassCard
          glow="gold"
          className="p-5 bg-[#10101a]/95 border-amber-500/30 rounded-2xl shadow-[0_0_40px_rgba(234,179,8,0.2)] space-y-4"
        >
          {/* Owner Notice Badge */}
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-left">
            <KeyRound className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] w-full">
              <span className="font-bold text-yellow-300 block">Master Admin Login</span>
              <p className="text-gray-300 font-mono text-[10px]">
                Authorized Administrator Credentials Required
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {authorizedEmails.map((authMail) => (
                  <button
                    key={authMail}
                    type="button"
                    onClick={() => {
                      setEmail(authMail);
                      setPassword('kalam@172010');
                    }}
                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono cursor-pointer transition-all ${
                      email.toLowerCase() === authMail.toLowerCase()
                        ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 font-bold'
                        : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {authMail}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setEmail('kalam172010@gmail.com');
                    setPassword('kalam@172010');
                  }}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Auto-Fill Credentials</span>
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2 text-left"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-tight">{errorMsg}</span>
            </motion.div>
          )}

          {/* Success Message */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 text-left"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-semibold">{successMsg}</span>
            </motion.div>
          )}

          {/* Admin Login Form */}
          <form onSubmit={handleAdminSubmit} className="space-y-3.5 text-left">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-yellow-400" />
                <span>Admin Email Address</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-black/60 border border-white/15 focus:border-yellow-400 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-yellow-400" />
                <span>Admin Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-black/60 border border-white/15 focus:border-yellow-400 rounded-xl px-3 py-2.5 pr-10 text-xs text-white placeholder:text-gray-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-black font-extrabold text-xs shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Unlock Admin Panel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </motion.button>
          </form>
        </GlassCard>

        {/* Back to User Store Button */}
        <div className="text-center">
          <button
            onClick={onReturnToStore}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <Store className="w-4 h-4 text-[#00e5ff]" />
            <span>Return to User Store</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
