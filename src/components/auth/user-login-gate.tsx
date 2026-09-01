import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  KeyRound,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Gift,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AuthUser, StoreSettings } from '../../types';
import { StoreLogo } from '../shared/store-logo';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from '../../lib/firebase';

interface UserLoginGateProps {
  onLoginSuccess: (user: AuthUser) => void;
  onExploreAsGuest?: () => void;
  storeSettings?: StoreSettings;
}

export type AuthScreenMode = 'LOGIN' | 'REGISTER' | 'FORGOT';

export const UserLoginGate: React.FC<UserLoginGateProps> = ({
  onLoginSuccess,
  onExploreAsGuest,
  storeSettings,
}) => {
  const [mode, setMode] = useState<AuthScreenMode>('LOGIN');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [detectedReferrer, setDetectedReferrer] = useState<string | null>(null);

  // Read referral query param from website URL on mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref') || urlParams.get('referral') || urlParams.get('r');
      if (ref && ref.trim()) {
        const cleanRef = ref.trim();
        setReferralCode(cleanRef);
        setDetectedReferrer(cleanRef);
        localStorage.setItem('kalam_referred_by', cleanRef);
        // Switch to register screen if arriving with referral link
        setMode('REGISTER');
      } else {
        const savedRef = localStorage.getItem('kalam_referred_by');
        if (savedRef && savedRef.trim()) {
          setReferralCode(savedRef.trim());
          setDetectedReferrer(savedRef.trim());
        }
      }
    } catch {}
  }, []);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validateEmail = (mail: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (cleanPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);

    const configuredAdminEmail = (storeSettings?.adminEmail || 'kalam172010@gmail.com').trim().toLowerCase();
    const configuredAdminPassword = (storeSettings?.adminPassword || 'kalam@172010').trim();
    const isAdminEmail = cleanEmail === configuredAdminEmail || cleanEmail === 'kalam172010@gmail.com' || cleanEmail === 'kalam2000abc@gmail.com';

    // If attempting Admin login, strictly verify matching password
    if (isAdminEmail) {
      let isVerified = false;

      if (cleanPassword === configuredAdminPassword) {
        isVerified = true;
      } else {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          if (userCredential.user) {
            isVerified = true;
          }
        } catch {
          // Firebase failed
        }
      }

      if (!isVerified) {
        setErrorMsg('Invalid Admin Password! Please enter the exact password configured in the Admin Panel.');
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
      } catch {}

      const authenticatedUser: AuthUser = {
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
        localStorage.setItem('kalam_auth_user', JSON.stringify(authenticatedUser));
      } catch {}

      setSuccessMsg('Master Admin Verified! Entering Panel...');
      setTimeout(() => {
        onLoginSuccess(authenticatedUser);
      }, 500);
      setIsLoading(false);
      return;
    }

    // Standard User / Reseller login via Firebase
    try {
      // 1. Try Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const fbUser = userCredential.user;

      let existingBalance = 0;
      let existingName = fbUser.displayName || cleanEmail.split('@')[0];
      let existingUsername = cleanEmail.split('@')[0];
      let existingRole: 'ADMIN' | 'USER' | 'RESELLER' = 'USER';
      let existingJoined = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      try {
        const storedUsersRaw = localStorage.getItem('kalam_users_db');
        if (storedUsersRaw) {
          const storedUsers: any[] = JSON.parse(storedUsersRaw);
          const found = storedUsers.find(
            (u) =>
              (u.email && u.email.toLowerCase() === cleanEmail) ||
              (u.username && u.username.toLowerCase() === cleanEmail)
          );
          if (found) {
            existingBalance =
              typeof found.walletBalance === 'number'
                ? found.walletBalance
                : existingBalance;
            existingName = found.name || existingName;
            existingUsername = found.username || existingUsername;
            if (found.isReseller || found.role === 'RESELLER') existingRole = 'RESELLER';
            if (found.joinedDate) existingJoined = found.joinedDate;
          }
        }
      } catch {}

      const authenticatedUser: AuthUser = {
        id: fbUser.uid || `USR_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: cleanEmail,
        name: existingName,
        username: existingUsername,
        role: existingRole,
        walletBalance: existingBalance,
        joinedDate: existingJoined,
        avatarUrl: fbUser.photoURL || undefined,
      };

      try {
        localStorage.setItem('kalam_auth_user', JSON.stringify(authenticatedUser));
      } catch {}

      setSuccessMsg('Sign-In Verified! Entering Panel...');
      setTimeout(() => {
        onLoginSuccess(authenticatedUser);
      }, 500);
    } catch (fbErr: any) {
      if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
        setErrorMsg('Invalid email or password. Please check your credentials or register.');
      } else {
        setErrorMsg(fbErr.message || 'Firebase login failed. Please check credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanEmail || !cleanPassword || !cleanName) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (cleanPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create User in Firebase Auth
      let fbUid = '';
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        if (userCredential.user) {
          fbUid = userCredential.user.uid;
          await updateProfile(userCredential.user, {
            displayName: cleanName,
          });
        }
      } catch (fbCreateErr: any) {
        console.warn('Firebase register notice:', fbCreateErr.message);
      }

      // New users strictly start at 0.00 wallet balance until they deposit
      let initialWalletBalance = 0;

      try {
        const storedUsersRaw = localStorage.getItem('kalam_users_db');
        if (storedUsersRaw) {
          const storedUsers: any[] = JSON.parse(storedUsersRaw);
          const found = storedUsers.find(
            (u) =>
              (u.email && u.email.toLowerCase() === cleanEmail) ||
              (u.username && u.username.toLowerCase() === cleanUsername)
          );
          if (found && typeof found.walletBalance === 'number') {
            initialWalletBalance = found.walletBalance;
          }
        }
      } catch {}

      const cleanReferral = (referralCode || localStorage.getItem('kalam_referred_by') || '').trim();

      const newUser: AuthUser = {
        id: fbUid || `USR_${Date.now().toString().slice(-6)}`,
        email: cleanEmail,
        name: cleanName,
        username: cleanUsername || `user_${Date.now().toString().slice(-4)}`,
        role: cleanEmail === 'kalam172010@gmail.com' ? 'ADMIN' : 'USER',
        walletBalance: initialWalletBalance,
        joinedDate: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        referralCode: cleanUsername || `user_${Date.now().toString().slice(-4)}`,
        referredBy: cleanReferral || undefined,
        referralEarnings: 0,
      };

      try {
        localStorage.setItem('kalam_auth_user', JSON.stringify(newUser));

        const storedUsersRaw = localStorage.getItem('kalam_users_db');
        const existingUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

        // Check if referrer exists and update their referral count
        if (cleanReferral) {
          const referrerIdx = existingUsers.findIndex(
            (u: any) =>
              u.username?.toLowerCase() === cleanReferral.toLowerCase() ||
              u.referralCode?.toLowerCase() === cleanReferral.toLowerCase() ||
              u.id?.toLowerCase() === cleanReferral.toLowerCase()
          );
          if (referrerIdx >= 0) {
            existingUsers[referrerIdx].totalReferrals = (existingUsers[referrerIdx].totalReferrals || 0) + 1;
          }
        }

        if (!existingUsers.some((u: any) => u.email === cleanEmail)) {
          existingUsers.push({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            username: newUser.username,
            walletBalance: newUser.walletBalance,
            depositedToday: 0,
            soldToday: 0,
            totalKeysSold: 0,
            isReseller: false,
            joinedDate: newUser.joinedDate,
            status: 'ACTIVE',
            referralCode: newUser.referralCode,
            referredBy: newUser.referredBy,
            referralEarnings: 0,
            totalReferrals: 0,
          });
          localStorage.setItem('kalam_users_db', JSON.stringify(existingUsers));
        }
      } catch {}

      setSuccessMsg('Firebase Account Created! Logging in...');
      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const gEmail = user.email ? user.email.toLowerCase().trim() : '';
      const gDisplayName = user.displayName || gEmail.split('@')[0] || 'User';
      const gUid = user.uid || `GOOGLE_${Date.now()}`;
      const gPhoto = user.photoURL || '';

      if (!gEmail) {
        throw new Error('Google sign-in did not return an email address.');
      }

      // STRICT ADMIN CHECK: ONLY authorized admin emails
      const isAdmin = gEmail === 'kalam172010@gmail.com' || gEmail === 'kalam2000abc@gmail.com';

      // Check for existing wallet balance in local storage/db if any
      let userBalance = isAdmin ? 290011.65 : 0;
      let userRole: 'ADMIN' | 'USER' | 'RESELLER' = isAdmin ? 'ADMIN' : 'USER';
      let existingJoined = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      try {
        const storedUsersRaw = localStorage.getItem('kalam_users_db');
        if (storedUsersRaw) {
          const storedUsers: any[] = JSON.parse(storedUsersRaw);
          const found = storedUsers.find(
            (u) => u.email && u.email.toLowerCase() === gEmail
          );
          if (found) {
            if (typeof found.walletBalance === 'number') {
              userBalance = found.walletBalance;
            }
            if (found.isReseller || found.role === 'RESELLER') {
              userRole = 'RESELLER';
            }
            if (found.joinedDate) {
              existingJoined = found.joinedDate;
            }
          }
        }
      } catch {}

      const cleanReferral = (referralCode || localStorage.getItem('kalam_referred_by') || '').trim();

      const authUser: AuthUser = {
        id: gUid,
        email: gEmail,
        name: isAdmin ? 'KALAM FF (OWNER)' : gDisplayName,
        username: gEmail.split('@')[0] || `user_${Date.now().toString().slice(-4)}`,
        role: isAdmin ? 'ADMIN' : userRole,
        walletBalance: userBalance,
        joinedDate: existingJoined,
        avatarUrl: gPhoto || undefined,
        referralCode: gEmail.split('@')[0] || `user_${Date.now().toString().slice(-4)}`,
        referredBy: cleanReferral || undefined,
        referralEarnings: 0,
      };

      try {
        localStorage.setItem('kalam_auth_user', JSON.stringify(authUser));

        // Save to users db if not exists
        const storedUsersRaw = localStorage.getItem('kalam_users_db');
        const existingUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

        // Check if referrer exists and update their referral count
        if (cleanReferral && !existingUsers.some((u: any) => u.email === gEmail)) {
          const referrerIdx = existingUsers.findIndex(
            (u: any) =>
              u.username?.toLowerCase() === cleanReferral.toLowerCase() ||
              u.referralCode?.toLowerCase() === cleanReferral.toLowerCase() ||
              u.id?.toLowerCase() === cleanReferral.toLowerCase()
          );
          if (referrerIdx >= 0) {
            existingUsers[referrerIdx].totalReferrals = (existingUsers[referrerIdx].totalReferrals || 0) + 1;
          }
        }

        if (!existingUsers.some((u: any) => u.email === gEmail)) {
          existingUsers.push({
            id: authUser.id,
            name: authUser.name,
            email: authUser.email,
            username: authUser.username,
            walletBalance: authUser.walletBalance,
            depositedToday: 0,
            soldToday: 0,
            totalKeysSold: 0,
            isReseller: false,
            joinedDate: authUser.joinedDate,
            status: 'ACTIVE',
            referralCode: authUser.referralCode,
            referredBy: authUser.referredBy,
            referralEarnings: 0,
            totalReferrals: 0,
          });
          localStorage.setItem('kalam_users_db', JSON.stringify(existingUsers));
        }
      } catch {}

      setSuccessMsg(`Welcome, ${authUser.name}! Redirecting...`);
      setTimeout(() => {
        onLoginSuccess(authUser);
      }, 500);
    } catch (popupErr: any) {
      console.warn('Google sign-in notice:', popupErr);
      if (
        popupErr.code === 'auth/popup-closed-by-user' ||
        popupErr.code === 'auth/cancelled-popup-request'
      ) {
        setErrorMsg('Google sign-in popup was closed. Please try again.');
      } else if (popupErr.code === 'auth/popup-blocked') {
        setErrorMsg('Popup was blocked by your browser. Please allow popups or use Email/Password.');
      } else if (popupErr.message) {
        setErrorMsg(popupErr.message);
      } else {
        setErrorMsg('Google sign-in could not be completed. Please try again or use Email login.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070c] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[450px] h-[450px] rounded-full bg-cyan-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[450px] h-[450px] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-rose-600/10 blur-[140px] pointer-events-none" />

      {/* Main Container Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-[#10101c]/95 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative z-10"
      >
        {/* Top Logo & Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center justify-center p-1 rounded-3xl bg-gradient-to-tr from-[#00e5ff] via-[#8b5cf6] to-[#ff0080] shadow-[0_0_35px_rgba(139,92,246,0.6)]">
            <StoreLogo
              logoUrl={storeSettings?.logoUrl}
              alt="KALAM FF PANEL Logo"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover"
            />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>{storeSettings?.shopName || 'KALAM FF VIP PANEL'}</span>
            </h1>
            <p className="text-xs text-gray-300 font-medium mt-0.5">
              Login first to access your wallet, digital keys & store options
            </p>
          </div>
        </div>

        {/* Tab Switcher: Login / Register */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/60 border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'LOGIN'
                ? 'bg-gradient-to-r from-[#00e5ff] to-[#8b5cf6] text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'REGISTER'
                ? 'bg-gradient-to-r from-[#00e5ff] to-[#8b5cf6] text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Feedback Messages */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center gap-2 text-xs text-red-300"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center gap-2 text-xs text-emerald-300"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LOGIN FORM */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#00e5ff]" />
                <span>Email Address / Gmail</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user@gmail.com or name@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#00e5ff] text-white text-xs placeholder:text-gray-500 focus:outline-none transition-colors font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#00e5ff]" />
                  <span>Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMode('FORGOT')}
                  className="text-[11px] text-[#00e5ff] hover:underline cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#00e5ff] text-white text-xs placeholder:text-gray-500 focus:outline-none transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00e5ff] via-[#8b5cf6] to-[#ff0080] text-black font-extrabold text-xs tracking-wide uppercase shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifying Account...</span>
              ) : (
                <>
                  <span>Sign In & Unlock All Options</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            {/* Google Sign In with Firebase */}
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#10101c] px-3 text-[10px] text-gray-400 uppercase font-semibold">
                Or Continue With
              </span>
              <div className="border-t border-white/10 w-full" />
            </div>

            <motion.button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <span>Connecting to Google...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google (Firebase)</span>
                </>
              )}
            </motion.button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#00e5ff]" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kalam FreeFire"
                className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#00e5ff] text-white text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="kalam_ff"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#00e5ff] text-white text-xs focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Gift className="w-3 h-3 text-pink-400" />
                    <span>Referral Code</span>
                  </span>
                  {detectedReferrer && (
                    <span className="text-[10px] text-emerald-400 font-bold">✓ Applied</span>
                  )}
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="e.g. KALAM"
                  className={`w-full px-3.5 py-2 rounded-xl bg-black/60 border ${
                    detectedReferrer ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300' : 'border-white/10 focus:border-[#00e5ff] text-white'
                  } text-xs focus:outline-none font-mono`}
                />
              </div>
            </div>

            {detectedReferrer && (
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-950/60 to-pink-950/60 border border-purple-500/30 flex items-center gap-2 text-[11px] text-pink-300">
                <Gift className="w-3.5 h-3.5 shrink-0 text-pink-400" />
                <span>Invited by <strong className="text-white font-mono">@{detectedReferrer}</strong> • You get instant access & bonus</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#00e5ff]" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#00e5ff] text-white text-xs focus:outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#00e5ff] text-white text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Confirm</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat pass"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-[#00e5ff] text-white text-xs focus:outline-none"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00e5ff] via-[#8b5cf6] to-[#ff0080] text-black font-extrabold text-xs tracking-wide uppercase shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account & Start</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'FORGOT' && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <KeyRound className="w-8 h-8 text-[#00e5ff] mx-auto" />
              <h3 className="text-sm font-bold text-white">Reset Account Password</h3>
              <p className="text-[11px] text-gray-400">
                Enter your registered email address to receive password reset instructions.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Registered Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#00e5ff] text-white text-xs focus:outline-none font-mono"
              />
            </div>

            <motion.button
              type="button"
              disabled={isLoading}
              onClick={async () => {
                const cleanEmail = email.trim().toLowerCase();
                setErrorMsg(null);
                setSuccessMsg(null);
                if (!cleanEmail) {
                  setErrorMsg('Please enter your email address.');
                  return;
                }
                setIsLoading(true);
                try {
                  await sendPasswordResetEmail(auth, cleanEmail);
                  setSuccessMsg(`✓ Firebase reset email sent to ${cleanEmail}! Please check your Inbox and Spam/Junk folder.`);
                } catch (err: any) {
                  console.error('Password reset error:', err);
                  if (err.code === 'auth/user-not-found') {
                    setErrorMsg(`No Firebase account found for ${cleanEmail}. Please use "Create Account" or "Sign in with Google" first.`);
                  } else if (err.code === 'auth/invalid-email') {
                    setErrorMsg('Please enter a valid email address.');
                  } else if (err.code === 'auth/too-many-requests') {
                    setErrorMsg('Too many reset attempts. Please wait a few moments and try again.');
                  } else {
                    setErrorMsg(err.message || 'Unable to send reset email. Verify your email is registered in Firebase.');
                  }
                } finally {
                  setIsLoading(false);
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 rounded-xl bg-[#00e5ff] text-black font-bold text-xs uppercase shadow-[0_0_15px_rgba(0,229,255,0.4)] cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Sending Reset Email...' : 'Send Reset Link'}
            </motion.button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* Guest Preview Option */}
        {onExploreAsGuest && (
          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={onExploreAsGuest}
              className="text-[11px] text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            >
              Explore Store Catalog as Guest →
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
