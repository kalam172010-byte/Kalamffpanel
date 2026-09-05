import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Check,
  AlertCircle,
  X,
  Sparkles,
  LogIn,
  UserPlus,
  ArrowLeft,
  Smartphone,
  Gift
} from 'lucide-react';
import { GlassCard } from '../shared/glass-card';
import { StoreLogo } from '../shared/store-logo';
import { AuthUser, StoreSettings } from '../../types';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from '../../lib/firebase';

export type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onLoginSuccess: (user: AuthUser) => void;
  storeSettings?: StoreSettings;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'LOGIN',
  onLoginSuccess,
  storeSettings,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset form on open / mode change
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const validateEmail = (mail: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Please enter both email and password.');
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

      if (cleanPassword === configuredAdminPassword || cleanPassword === 'kalam@172010') {
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

      let adminJoined = 'Jan 15, 2024';
      try {
        const storedUsersRaw = localStorage.getItem('kalam_users_db');
        if (storedUsersRaw) {
          const storedUsers: any[] = JSON.parse(storedUsersRaw);
          const found = storedUsers.find(
            (u) => (u.email && u.email.toLowerCase() === cleanEmail) || u.role === 'ADMIN'
          );
          if (found && found.joinedDate && !found.joinedDate.toLowerCase().includes('today')) {
            adminJoined = found.joinedDate;
          }
        }
        const cachedAuth = localStorage.getItem('kalam_auth_user');
        if (cachedAuth) {
          const parsed = JSON.parse(cachedAuth);
          if (parsed && parsed.joinedDate && !parsed.joinedDate.toLowerCase().includes('today')) {
            adminJoined = parsed.joinedDate;
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
        joinedDate: adminJoined,
      };

      if (rememberMe) {
        try {
          localStorage.setItem('kalam_auth_user', JSON.stringify(authenticatedUser));
        } catch {}
      }

      setSuccessMsg('Master Admin Verified! Welcome back.');
      setTimeout(() => {
        onLoginSuccess(authenticatedUser);
        onClose();
      }, 500);
      setIsLoading(false);
      return;
    }

    // Standard User / Reseller login via Firebase
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const fbUser = userCredential.user;

      let existingBalance = 0;
      let existingName = fbUser.displayName || cleanEmail.split('@')[0];
      let existingUsername = cleanEmail.split('@')[0];
      let existingRole: 'ADMIN' | 'USER' | 'RESELLER' = 'USER';

      // Always retrieve the permanent account registration date from Firebase Auth metadata
      let existingJoined = fbUser.metadata?.creationTime
        ? new Date(fbUser.metadata.creationTime).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '';

      try {
        const storedUsersRaw = localStorage.getItem('kalam_users_db');
        if (storedUsersRaw) {
          const storedUsers: any[] = JSON.parse(storedUsersRaw);
          const found = storedUsers.find(
            (u) => (u.email && u.email.toLowerCase() === cleanEmail) || (u.username && u.username.toLowerCase() === cleanEmail)
          );
          if (found) {
            existingBalance = typeof found.walletBalance === 'number' ? found.walletBalance : existingBalance;
            existingName = found.name || existingName;
            existingUsername = found.username || existingUsername;
            if (found.isReseller || found.role === 'RESELLER') existingRole = 'RESELLER';
            if (!existingJoined && found.joinedDate && !found.joinedDate.toLowerCase().includes('today')) {
              existingJoined = found.joinedDate;
            }
          }
        }
      } catch {}

      if (!existingJoined) {
        existingJoined = new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }

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

      if (rememberMe) {
        try {
          localStorage.setItem('kalam_auth_user', JSON.stringify(authenticatedUser));
        } catch {}
      }

      setSuccessMsg('Sign-In Verified! Welcome back.');
      setTimeout(() => {
        onLoginSuccess(authenticatedUser);
        onClose();
      }, 500);
    } catch (fbErr: any) {
      if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
        setErrorMsg('Invalid email or password. Please check your credentials or register a new account.');
      } else {
        setErrorMsg(fbErr.message || 'Firebase sign-in failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanUsername = (username || cleanName).trim().toLowerCase().replace(/\s+/g, '_');
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword || !cleanName) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
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

      // New user always starts with 0.00 balance; balance increases only upon deposit/payment
      let initialWalletBalance = 0;
      try {
        const storedUsersRaw = localStorage.getItem('kalam_users_db');
        if (storedUsersRaw) {
          const storedUsers: any[] = JSON.parse(storedUsersRaw);
          const found = storedUsers.find(
            (u) => (u.email && u.email.toLowerCase() === cleanEmail) || (u.id === cleanEmail)
          );
          if (found && typeof found.walletBalance === 'number') {
            initialWalletBalance = found.walletBalance;
          }
        }
      } catch {}

      const newUser: AuthUser = {
        id: fbUid || `USR_${Date.now().toString().slice(-6)}`,
        email: cleanEmail,
        name: cleanName,
        username: cleanUsername || `user_${Date.now().toString().slice(-4)}`,
        role: 'USER',
        walletBalance: initialWalletBalance,
        joinedDate: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };

      if (rememberMe) {
        try {
          localStorage.setItem('kalam_auth_user', JSON.stringify(newUser));
        } catch {}
      }

      setSuccessMsg('Account created successfully! Welcome aboard.');
      setTimeout(() => {
        onLoginSuccess(newUser);
        onClose();
      }, 700);
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

      const configuredAdminEmail = (storeSettings?.adminEmail || 'kalam172010@gmail.com').trim().toLowerCase();
      const isAdminEmail = gEmail === 'kalam172010@gmail.com' || gEmail === 'kalam2000abc@gmail.com' || gEmail === configuredAdminEmail;

      if (isAdminEmail) {
        setErrorMsg('Admin Security: Please log in using your Admin Email & Password.');
        setIsGoogleLoading(false);
        return;
      }

      let userBalance = 0;
      let userRole: 'ADMIN' | 'USER' | 'RESELLER' = 'USER';

      // Permanent Account Creation Date from Firebase Auth metadata
      let existingJoined = user.metadata?.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '';

      // Check existing database records for this user
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
            if (!existingJoined && found.joinedDate && !found.joinedDate.toLowerCase().includes('today')) {
              existingJoined = found.joinedDate;
            }
          }
        }
      } catch {}

      if (!existingJoined) {
        existingJoined = new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }

      const authUser: AuthUser = {
        id: gUid,
        email: gEmail,
        name: gDisplayName,
        username: gEmail.split('@')[0] || `user_${Date.now().toString().slice(-4)}`,
        role: userRole,
        walletBalance: userBalance,
        joinedDate: existingJoined,
        avatarUrl: gPhoto || undefined,
      };

      if (rememberMe) {
        try {
          localStorage.setItem('kalam_auth_user', JSON.stringify(authUser));
        } catch {}
      }

      setSuccessMsg(`Welcome, ${authUser.name}!`);
      setTimeout(() => {
        onLoginSuccess(authUser);
        onClose();
      }, 500);
    } catch (popupErr: any) {
      console.warn('Google sign-in status:', popupErr);
      if (
        popupErr.code === 'auth/popup-closed-by-user' ||
        popupErr.code === 'auth/cancelled-popup-request'
      ) {
        setErrorMsg('Google sign-in popup was closed. Please try again.');
      } else if (popupErr.code === 'auth/popup-blocked') {
        setErrorMsg('Popup was blocked by your browser. Please allow popups or sign in with Email/Password.');
      } else if (popupErr.message) {
        setErrorMsg(popupErr.message);
      } else {
        setErrorMsg('Google sign-in was not completed. Please try again or use Email login.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      setErrorMsg('Please enter a valid registered email address.');
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccessMsg(`✓ Firebase reset email sent to ${cleanEmail}! Please check your Inbox and Spam/Junk folder.`);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setErrorMsg(`No Firebase account found for ${cleanEmail}. Please create an account or sign in with Google.`);
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg('Too many reset attempts. Please try again shortly.');
      } else {
        setErrorMsg(err.message || 'Unable to send reset email.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative z-50 w-full max-w-md"
          >
          <GlassCard
            glow="cyan"
            className="p-5 bg-[#12121c]/98 border border-white/15 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.25)] relative overflow-hidden"
          >
            {/* Ambient Background Gradient */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00e5ff]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#ff0080]/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00e5ff] via-[#8b5cf6] to-[#ff0080] p-[1.5px] shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                  <StoreLogo
                    logoUrl={storeSettings?.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-[10px]"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {mode === 'LOGIN'
                      ? 'Sign In to Account'
                      : mode === 'REGISTER'
                      ? 'Create New Account'
                      : 'Reset Password'}
                  </h3>
                  <span className="text-[10px] text-gray-400 block font-mono">
                    {storeSettings?.shopName || 'KALAM FF PANEL'} • Secure Auth
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Mode Switcher (Login vs Register) */}
            {mode !== 'FORGOT_PASSWORD' && (
              <div className="grid grid-cols-2 p-1 bg-black/50 rounded-xl border border-white/5 mt-4 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'LOGIN'
                      ? 'bg-gradient-to-r from-[#00e5ff]/20 to-[#8b5cf6]/20 text-[#00e5ff] border border-[#00e5ff]/40 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('REGISTER');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'REGISTER'
                      ? 'bg-gradient-to-r from-[#ff0080]/20 to-[#8b5cf6]/20 text-[#ff0080] border border-[#ff0080]/40 shadow-[0_0_10px_rgba(255,0,128,0.2)]'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}

            {/* Error & Success Alerts */}
            <div className="mt-3 relative z-10">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-[11px] leading-tight">{errorMsg}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px] leading-tight">{successMsg}</span>
                </motion.div>
              )}
            </div>

            {/* FORM BODY */}
            <div className="mt-4 relative z-10">
              {/* ===================== LOGIN FORM ===================== */}
              {mode === 'LOGIN' && (
                <form onSubmit={handleLogin} className="space-y-3.5">
                  {/* Email Input */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#00e5ff]" />
                      <span>Email Address</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-black/60 border border-white/10 focus:border-[#00e5ff] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#00e5ff]" />
                        <span>Password</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('FORGOT_PASSWORD');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-[10px] text-[#00e5ff] hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-black/60 border border-white/10 focus:border-[#00e5ff] rounded-xl px-3 py-2.5 pr-10 text-xs text-white placeholder:text-gray-500 focus:outline-none transition-colors"
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

                  {/* Remember Me */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 text-gray-400 cursor-pointer select-none text-[11px]">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded bg-black/60 border-white/20 text-[#00e5ff] focus:ring-0 focus:ring-offset-0"
                      />
                      <span>Remember login session</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff] via-[#8b5cf6] to-[#ff0080] text-white font-bold text-xs shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </motion.button>

                  {/* Google Auth */}
                  <div className="relative flex items-center justify-center my-1.5">
                    <div className="border-t border-white/10 w-full" />
                    <span className="bg-[#12121c] px-2 text-[9px] text-gray-400 uppercase font-semibold">
                      Or
                    </span>
                    <div className="border-t border-white/10 w-full" />
                  </div>

                  <motion.button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isGoogleLoading ? (
                      <span className="text-[11px]">Connecting...</span>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                        <span className="text-[11px]">Sign in with Google</span>
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {/* ===================== REGISTER FORM ===================== */}
              {mode === 'REGISTER' && (
                <form onSubmit={handleRegister} className="space-y-3">
                  {/* Full Name */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#ff0080]" />
                      <span>Full Name / Display Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Kalam FF"
                      className="w-full bg-black/60 border border-white/10 focus:border-[#ff0080] rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#ff0080]" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-black/60 border border-white/10 focus:border-[#ff0080] rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-300 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#ff0080]" />
                        <span>Password</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 6 chars"
                          className="w-full bg-black/60 border border-white/10 focus:border-[#ff0080] rounded-xl px-2.5 py-2 pr-7 text-xs text-white placeholder:text-gray-500 focus:outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-300 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#ff0080]" />
                        <span>Confirm</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter"
                          className="w-full bg-black/60 border border-white/10 focus:border-[#ff0080] rounded-xl px-2.5 py-2 pr-7 text-xs text-white placeholder:text-gray-500 focus:outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Referral Code (Optional) */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Gift className="w-3 h-3 text-yellow-400" />
                      <span>Referral / Invite Code (Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      placeholder="e.g. VIP2026"
                      className="w-full bg-black/60 border border-white/10 focus:border-yellow-400 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none transition-colors uppercase font-mono"
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ff0080] via-[#8b5cf6] to-[#00e5ff] text-white font-bold text-xs shadow-[0_0_20px_rgba(255,0,128,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 mt-2"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Create Free Account</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {/* ===================== FORGOT PASSWORD FORM ===================== */}
              {mode === 'FORGOT_PASSWORD' && (
                <form onSubmit={handleForgotPassword} className="space-y-3.5">
                  <div className="text-left space-y-1">
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Enter your registered account email. We will send a secure password reset link to recover access.
                    </p>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Registered Email</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-black/60 border border-white/10 focus:border-yellow-400 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Send Reset Link</span>
                      </>
                    )}
                  </motion.button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('LOGIN');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
