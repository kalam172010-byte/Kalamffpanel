import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  KeyRound,
  Users,
  ScrollText,
  Ticket,
  ArrowUpCircle,
  Coins,
  Megaphone,
  UserCircle,
  Plus,
  Trash2,
  Send,
  Check,
  Search,
  Copy,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Mail,
  Crown,
  LogOut,
  Lock,
  Zap,
  Box,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Key,
  Globe,
  Database,
  Calendar,
  Download,
  FileText,
  CheckCheck,
  Filter,
} from 'lucide-react';
import { GlassCard } from '../shared/glass-card';
import { formatCurrency } from '../../lib/utils';
import { AuthUser, StoreSettings, ResellerUser, Product, ApiConfig, PlanPricing, PurchasedKey } from '../../types';
import { deduplicateUsers } from '../../lib/firestore-service';
import { exportSoldKeysToPdf } from '../../lib/pdf-export';

interface AdminIdStockViewProps {
  products?: Product[];
  apiConfigs?: ApiConfig[];
  onUpdateProductKeys?: (productId: string, planId: string, keys: string[]) => void;
}

export const AdminIdStockView: React.FC<AdminIdStockViewProps> = ({
  products = [],
  apiConfigs = [],
  onUpdateProductKeys,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('all');
  const [isAddKeyModalOpen, setIsAddKeyModalOpen] = useState(false);
  const [keyInputText, setKeyInputText] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0] || null;

  // Calculate real stock counts for selected product
  const getPlanStock = (prod: Product, planId: string): string[] => {
    if (prod.planKeys && prod.planKeys[planId]) {
      return prod.planKeys[planId];
    }
    return prod.keys || [];
  };

  const totalStockCount = products.reduce((acc, p) => acc + (p.keys?.length || 0), 0);
  const outOfStockProducts = products.filter(
    (p) => (p.keys?.length || 0) === 0 && !p.api1Restock?.remoteProductId && !p.api2Restock?.remoteProductId
  );

  const handleCopy = (k: string) => {
    navigator.clipboard.writeText(k);
    setCopiedKey(k);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddKeys = () => {
    if (!activeProduct || !keyInputText.trim()) return;
    const newKeys = keyInputText
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (newKeys.length === 0) return;

    if (onUpdateProductKeys) {
      const currentKeys = getPlanStock(activeProduct, selectedPlanId);
      const combined = [...newKeys, ...currentKeys];
      onUpdateProductKeys(activeProduct.id, selectedPlanId, combined);
    }

    setFeedbackMsg(`Successfully added ${newKeys.length} real key(s) to ${activeProduct.name}!`);
    setKeyInputText('');
    setIsAddKeyModalOpen(false);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleDeleteKey = (keyToDelete: string) => {
    if (!activeProduct || !onUpdateProductKeys) return;
    const currentKeys = getPlanStock(activeProduct, selectedPlanId);
    const updated = currentKeys.filter((k) => k !== keyToDelete);
    onUpdateProductKeys(activeProduct.id, selectedPlanId, updated);
  };

  const handleClearAllKeys = () => {
    if (!activeProduct || !onUpdateProductKeys) return;
    if (confirm(`Are you sure you want to clear all keys for ${activeProduct.name}?`)) {
      onUpdateProductKeys(activeProduct.id, selectedPlanId, []);
      setFeedbackMsg(`Cleared all inventory keys for ${activeProduct.name}. Status is now OUT OF STOCK.`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const currentAvailableKeys = activeProduct ? getPlanStock(activeProduct, selectedPlanId) : [];
  const filteredKeys = currentAvailableKeys.filter((k) =>
    k.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isProductOutOfStock =
    currentAvailableKeys.length === 0 &&
    !activeProduct?.api1Restock?.remoteProductId &&
    !activeProduct?.api2Restock?.remoteProductId;

  return (
    <div className="space-y-4" id="admin-id-stock-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-0.5">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <span>ID Stock & Real Key Inventory</span>
          </h2>
          <p className="text-[11px] text-gray-400">
            Strict real key delivery: only upstream API keys or manual inventory keys are dispensed. Zero fake keys.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddKeyModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(0,229,255,0.4)] flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add / Restock Keys</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GlassCard glow="cyan" className="p-3.5 bg-[#161622]/95 border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Total Stored Keys</span>
            <span className="text-lg font-black text-white font-mono">{totalStockCount}</span>
          </div>
        </GlassCard>

        <GlassCard glow="purple" className="p-3.5 bg-[#161622]/95 border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Connected APIs</span>
            <span className="text-lg font-black text-white font-mono">
              {apiConfigs.filter((c) => c.status === 'CONNECTED' || c.apiKey).length} Active
            </span>
          </div>
        </GlassCard>

        <GlassCard glow="pink" className="p-3.5 bg-[#161622]/95 border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Out of Stock Catalog</span>
            <span className="text-lg font-black text-rose-400 font-mono">
              {outOfStockProducts.length} Items
            </span>
          </div>
        </GlassCard>
      </div>

      {feedbackMsg && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </motion.div>
      )}

      {/* Main Stock Control Card */}
      <GlassCard glow="cyan" className="p-4 bg-[#161622]/95 border-white/10 space-y-4">
        {/* Product selector tabs */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Select Product Pool</label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {products.map((p) => {
              const count = p.keys?.length || 0;
              const isSelected = activeProduct?.id === p.id;
              const hasApi = Boolean(p.api1Restock?.remoteProductId || p.api2Restock?.remoteProductId);

              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProductId(p.id);
                    setSelectedPlanId('all');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                      : 'bg-black/40 text-gray-400 border-white/5 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>{p.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                      count > 0
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : hasApi
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {count > 0 ? `${count} In Stock` : hasApi ? 'API Restock' : 'OUT OF STOCK'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {activeProduct && (
          <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{activeProduct.name}</h3>
                  <span className="text-[10px] text-gray-400 font-mono">({activeProduct.category})</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px]">
                  <span className="text-gray-400">Inventory Status:</span>
                  {currentAvailableKeys.length > 0 ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {currentAvailableKeys.length} Real Keys in ID Pool
                    </span>
                  ) : activeProduct.api1Restock?.remoteProductId || activeProduct.api2Restock?.remoteProductId ? (
                    <span className="text-purple-400 font-bold flex items-center gap-1 font-mono">
                      <Zap className="w-3.5 h-3.5" />
                      Live External API Dispatch Active
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1 font-mono bg-rose-500/10 px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3" />
                      0 Keys Available — Strictly OUT OF STOCK
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddKeyModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Keys</span>
                </button>
                {currentAvailableKeys.length > 0 && (
                  <button
                    onClick={handleClearAllKeys}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Stock</span>
                  </button>
                )}
              </div>
            </div>

            {/* Search Keys & List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search loaded activation keys in pool..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-mono shrink-0">
                  Showing {filteredKeys.length} of {currentAvailableKeys.length}
                </span>
              </div>

              {filteredKeys.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {filteredKeys.map((k, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between gap-2 font-mono text-xs text-white"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] text-gray-500 font-bold">#{idx + 1}</span>
                        <span className="text-cyan-300 font-semibold truncate select-all">{k}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleCopy(k)}
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                          title="Copy Key"
                        >
                          {copiedKey === k ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteKey(k)}
                          className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                          title="Delete Key from Pool"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <Database className="w-6 h-6 text-gray-500 mx-auto" />
                  <h4 className="text-xs font-bold text-gray-300">
                    {currentAvailableKeys.length === 0 ? 'No Keys in Local Stock Pool' : 'No Keys Match Your Search'}
                  </h4>
                  <p className="text-[10px] text-gray-400 max-w-sm mx-auto">
                    {currentAvailableKeys.length === 0
                      ? 'When a customer purchases this product, keys are fetched real-time from upstream API. If API is offline or returns no key, status strictly defaults to OUT OF STOCK.'
                      : 'Try typing a different key code.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Add Keys Modal */}
      <AnimatePresence>
        {isAddKeyModalOpen && activeProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddKeyModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-50 w-full max-w-md bg-[#161622] border border-cyan-500/40 rounded-3xl p-5 shadow-[0_0_35px_rgba(0,229,255,0.2)] text-white space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Import Real Activation Keys</h3>
                    <span className="text-[10px] text-gray-400">Target Product: {activeProduct.name}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddKeyModalOpen(false)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <Trash2 className="w-4 h-4 rotate-45" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <label className="text-[10px] text-gray-300 block font-semibold">
                  Paste Real Keys (One Key per line)
                </label>
                <textarea
                  value={keyInputText}
                  onChange={(e) => setKeyInputText(e.target.value)}
                  placeholder={`KLM-VIP-991823-XYZ\nKLM-VIP-881290-ABC\nKLM-VIP-773819-DEF`}
                  rows={6}
                  className="w-full p-3 rounded-2xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                />
                <span className="text-[10px] text-gray-400 block">
                  Each line will be added as 1 available key in the inventory pool. Customers will receive these keys upon order confirmation.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => setIsAddKeyModalOpen(false)}
                  className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddKeys}
                  disabled={!keyInputText.trim()}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(0,229,255,0.4)] disabled:opacity-50 cursor-pointer"
                >
                  Add to Inventory
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface AdminMembersWalletsViewProps {
  users: ResellerUser[];
  onAdjustBalance: (userId: string, amount: number, type: 'ADD' | 'MINUS', note?: string) => void;
  currentUser?: AuthUser | null;
}

export const AdminMembersWalletsView: React.FC<AdminMembersWalletsViewProps> = ({
  users,
  onAdjustBalance,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'RESELLERS' | 'STANDARD' | 'NON_ZERO'>('ALL');
  
  // Modal state for Add/Minus
  const [selectedUser, setSelectedUser] = useState<ResellerUser | null>(null);
  const [adjustType, setAdjustType] = useState<'ADD' | 'MINUS'>('ADD');
  const [adjustAmount, setAdjustAmount] = useState<string>('100');
  const [adjustNote, setAdjustNote] = useState<string>('');
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);

  const quickAmounts = [20, 50, 100, 250, 500, 1000, 2000, 5000];

  const safeUsers = useMemo(() => deduplicateUsers(users || []), [users]);

  const filteredUsers = safeUsers.filter((u) => {
    const matchSearch =
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (filterType === 'RESELLERS') return Boolean(u.isReseller || u.role === 'RESELLER');
    if (filterType === 'STANDARD') return !u.isReseller && u.role !== 'RESELLER';
    if (filterType === 'NON_ZERO') return (u.walletBalance || 0) > 0;
    return true;
  });

  const totalVaultBalance = safeUsers.reduce((acc, u) => acc + (u.walletBalance || 0), 0);
  const usersWithBalanceCount = safeUsers.filter((u) => (u.walletBalance || 0) > 0).length;

  const handleOpenAdjust = (user: ResellerUser, type: 'ADD' | 'MINUS') => {
    setSelectedUser(user);
    setAdjustType(type);
    setAdjustAmount('100');
    setAdjustNote(type === 'ADD' ? 'Admin Deposit / Top-up' : 'Admin Balance Adjustment / Deduction');
    setIsSuccessFeedback(false);
  };

  const handleConfirmAdjust = () => {
    if (!selectedUser) return;
    const numAmount = parseFloat(adjustAmount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    onAdjustBalance(selectedUser.id, numAmount, adjustType, adjustNote);
    setIsSuccessFeedback(true);
    setTimeout(() => {
      setIsSuccessFeedback(false);
      setSelectedUser(null);
    }, 1200);
  };

  const calculatePreviewBalance = () => {
    if (!selectedUser) return 0;
    const numAmount = parseFloat(adjustAmount) || 0;
    if (adjustType === 'ADD') {
      return (selectedUser.walletBalance || 0) + numAmount;
    }
    return Math.max(0, (selectedUser.walletBalance || 0) - numAmount);
  };

  return (
    <div className="space-y-4" id="admin-members-wallets-view">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#8b5cf6]" />
            <span>Members & Wallets (Money Management)</span>
          </h2>
          <span className="text-[11px] text-gray-400">
            Add or minus user wallet balances, manage deposits & manual credits
          </span>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <GlassCard glow="purple" className="p-3 bg-[#161622]/95 border-white/10">
          <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">
            Total System Balance
          </span>
          <span className="text-lg font-black text-emerald-400 font-mono">
            {formatCurrency(totalVaultBalance)}
          </span>
          <span className="text-[9px] text-gray-400 block mt-0.5">Across all registered users</span>
        </GlassCard>

        <GlassCard glow="cyan" className="p-3 bg-[#161622]/95 border-white/10">
          <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">
            Total Members
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-[#00e5ff]">{users.length} Users</span>
            <span className="text-[10px] text-emerald-400 font-bold">{usersWithBalanceCount} active</span>
          </div>
          <span className="text-[9px] text-gray-400 block mt-0.5">Live store user database</span>
        </GlassCard>

        <GlassCard glow="gold" className="p-3 bg-[#161622]/95 border-white/10 col-span-2 sm:col-span-1">
          <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">
            Quick Balance Actions
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
              + Credit
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">
              - Debit (Minus)
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Main Members Card */}
      <GlassCard glow="purple" className="p-4 bg-[#161622]/95 border-white/10 space-y-3.5">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user by Name, Email, or @username..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-[#8b5cf6] focus:outline-none text-white text-xs"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-[#8b5cf6] text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setFilterType('RESELLERS')}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterType === 'RESELLERS'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Resellers
            </button>
            <button
              onClick={() => setFilterType('NON_ZERO')}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterType === 'NON_ZERO'
                  ? 'bg-emerald-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              With Balance
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-2.5">
          {filteredUsers.map((u, idx) => {
            const isCurrent = Boolean(
              currentUser?.email &&
                u.email &&
                currentUser.email.toLowerCase() === u.email.toLowerCase()
            );
            return (
              <div
                key={`${u.id || 'user'}_${idx}`}
                className="p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                {/* User Info */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8b5cf6]/30 to-[#00e5ff]/20 border border-[#8b5cf6]/40 flex items-center justify-center font-bold text-white uppercase text-xs shrink-0">
                    {(u.name || 'U').slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{u.name}</span>
                      {u.isReseller && (
                        <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[9px] font-bold">
                          VIP RESELLER
                        </span>
                      )}
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold">
                          YOU (ADMIN)
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-gray-400 mt-0.5">
                      <span className="font-mono">{u.email}</span>
                      <span>•</span>
                      <span className="text-[#00e5ff] font-mono">@{u.username}</span>
                      {u.joinedDate && (
                        <>
                          <span>•</span>
                          <span className="text-gray-400 flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-cyan-400" />
                            <span>Registered: {u.joinedDate}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Balance & Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-white/5 sm:border-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-semibold">
                      Wallet Balance
                    </span>
                    <span className="text-base font-black font-mono text-emerald-400">
                      {formatCurrency(u.walletBalance || 0)}
                    </span>
                  </div>

                  {/* Add (+) & Minus (-) Option Buttons */}
                  <div className="flex items-center gap-1.5">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenAdjust(u, 'ADD')}
                      className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] shadow-[0_0_10px_rgba(16,185,129,0.3)] flex items-center gap-1 cursor-pointer transition-all"
                      title="Add Money to User"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Money</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenAdjust(u, 'MINUS')}
                      className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-[11px] shadow-[0_0_10px_rgba(244,63,94,0.3)] flex items-center gap-1 cursor-pointer transition-all"
                      title="Minus (Deduct) Money from User"
                    >
                      <span className="font-mono text-sm leading-none font-bold">−</span>
                      <span>Minus Money</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="py-8 text-center text-xs text-gray-400 space-y-1">
              <Users className="w-6 h-6 mx-auto text-gray-600" />
              <p>No matching users found.</p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* ==================== ADD / MINUS MONEY MODAL ==================== */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className={`relative z-50 w-full max-w-sm bg-[#161622] border ${
              adjustType === 'ADD' ? 'border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.25)]' : 'border-rose-500/40 shadow-[0_0_40px_rgba(244,63,94,0.25)]'
            } rounded-3xl p-5 text-white space-y-4`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                    adjustType === 'ADD'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {adjustType === 'ADD' ? '+' : '−'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {adjustType === 'ADD' ? 'Add User Money (Credit)' : 'Minus User Money (Debit)'}
                  </h3>
                  <span className="text-[10px] text-gray-400">Admin Wallet Balance Control</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target User Info Card */}
            <div className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{selectedUser.name}</span>
                <span className="text-[10px] font-mono text-cyan-400">@{selectedUser.username}</span>
              </div>
              <div className="text-[10px] text-gray-400 font-mono truncate">{selectedUser.email}</div>
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                <span className="text-gray-400">Current Balance:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {formatCurrency(selectedUser.walletBalance || 0)}
                </span>
              </div>
            </div>

            {/* Mode Switcher Pills (Add vs Minus) */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/60 border border-white/10">
              <button
                type="button"
                onClick={() => setAdjustType('ADD')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  adjustType === 'ADD'
                    ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Money (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setAdjustType('MINUS')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  adjustType === 'MINUS'
                    ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="font-mono text-sm leading-none font-bold">−</span>
                <span>Minus Money (−)</span>
              </button>
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-300 block">
                {adjustType === 'ADD' ? 'Amount to Credit (₹)' : 'Amount to Deduct / Minus (₹)'}
              </label>
              <div className="relative">
                <span
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold ${
                    adjustType === 'ADD' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="100"
                  className={`w-full pl-8 pr-4 py-2.5 rounded-xl bg-black/60 border ${
                    adjustType === 'ADD' ? 'focus:border-emerald-400' : 'focus:border-rose-400'
                  } border-white/10 focus:outline-none text-xl font-bold text-white font-mono`}
                />
              </div>
            </div>

            {/* Quick Amount Pills */}
            <div className="grid grid-cols-4 gap-1.5">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAdjustAmount(amt.toString())}
                  className="py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-bold text-gray-300 cursor-pointer"
                >
                  {adjustType === 'ADD' ? `+₹${amt}` : `-₹${amt}`}
                </button>
              ))}
            </div>

            {/* Reason / Remarks Note */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 block">
                Reason / Note for Record
              </label>
              <input
                type="text"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="e.g. Manual UPI payment / Refund / Penalty / Cashback"
                className="w-full px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder:text-gray-600 focus:outline-none"
              />
            </div>

            {/* Live Calculation Preview Banner */}
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                adjustType === 'ADD'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
              }`}
            >
              <span>Resulting Balance Preview:</span>
              <span className="font-mono font-black text-sm text-white">
                {formatCurrency(calculatePreviewBalance())}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirmAdjust}
                className={`py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                  adjustType === 'ADD'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-rose-500/30'
                }`}
              >
                {isSuccessFeedback ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Balance Updated!</span>
                  </>
                ) : (
                  <>
                    {adjustType === 'ADD' ? <Plus className="w-4 h-4" /> : <span className="text-sm font-bold font-mono">−</span>}
                    <span>{adjustType === 'ADD' ? 'Confirm Add Money' : 'Confirm Minus Money'}</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

interface AdminSoldKeysViewProps {
  soldKeys?: PurchasedKey[];
  storeSettings?: StoreSettings;
  onSeedSampleKeys?: (sampleKeys: any) => void;
}

export const AdminSoldKeysView: React.FC<AdminSoldKeysViewProps> = ({
  soldKeys = [],
  storeSettings,
  onSeedSampleKeys,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduct, setFilterProduct] = useState('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const productOptions = useMemo(() => {
    const set = new Set<string>();
    soldKeys.forEach((k) => {
      if (k.productName) set.add(k.productName);
    });
    return Array.from(set);
  }, [soldKeys]);

  const filteredKeys = useMemo(() => {
    return soldKeys.filter((k) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (k.productName && k.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (k.keyCode && k.keyCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (k.invoiceNumber && k.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (k.planName && k.planName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesProduct = filterProduct === 'ALL' || k.productName === filterProduct;

      return matchesSearch && matchesProduct;
    });
  }, [soldKeys, searchTerm, filterProduct]);

  const totalRevenue = useMemo(() => {
    return filteredKeys.reduce((acc, k) => acc + (k.price || 0), 0);
  }, [filteredKeys]);

  const handleExportPdf = () => {
    if (filteredKeys.length === 0) {
      setExportFeedback('No keys to export.');
      setTimeout(() => setExportFeedback(null), 3000);
      return;
    }

    try {
      setIsExporting(true);
      const res = exportSoldKeysToPdf({
        soldKeys: filteredKeys,
        storeSettings,
        filterLabel: filterProduct !== 'ALL' ? filterProduct : undefined,
      });
      setExportFeedback(`Exported ${res.count} keys to ${res.filename}`);
      setTimeout(() => setExportFeedback(null), 4000);
    } catch (err: any) {
      setExportFeedback(`Export error: ${err.message}`);
      setTimeout(() => setExportFeedback(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4" id="admin-sold-keys-view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-emerald-400" />
            <span>Sold Key Live History ({soldKeys.length})</span>
          </h2>
          <span className="text-[11px] text-gray-400">Real-time stream of all keys generated by bot and users</span>
        </div>

        <div className="flex items-center gap-2">
          {soldKeys.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExportPdf}
              disabled={isExporting || filteredKeys.length === 0}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {isExporting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Export to PDF ({filteredKeys.length})</span>
            </motion.button>
          )}
        </div>
      </div>

      {exportFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{exportFeedback}</span>
        </motion.div>
      )}

      {/* Revenue & Filter Bar */}
      {soldKeys.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search key code, product, invoice..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-emerald-400 focus:outline-none text-white text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:border-emerald-400 focus:outline-none"
            >
              <option value="ALL">All Products ({soldKeys.length})</option>
              {productOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {soldKeys.length === 0 ? (
        <GlassCard className="p-8 text-center space-y-3 bg-[#161622]/90 border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <ScrollText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Sold Keys Yet</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            When users or resellers purchase keys, their live delivery and license codes will stream here in real time.
          </p>
        </GlassCard>
      ) : filteredKeys.length === 0 ? (
        <GlassCard className="p-6 text-center space-y-2 bg-[#161622]/90 border-white/10">
          <p className="text-xs text-gray-400">No sold keys match your search or filter.</p>
        </GlassCard>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>Showing {filteredKeys.length} of {soldKeys.length} keys</span>
            <span className="text-emerald-400 font-mono font-bold">Total Sales: ₹{totalRevenue.toFixed(2)}</span>
          </div>

          {filteredKeys.map((k) => (
            <GlassCard key={k.id} glow="green" className="p-4 bg-[#161622]/95 border-white/10 space-y-2.5">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-white font-extrabold">{k.productName} ({k.planName})</span>
                  <span className="text-emerald-400 font-mono">₹{k.price?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="text-xs font-mono text-[#00e5ff] font-bold select-all tracking-wide bg-cyan-950/30 px-2.5 py-1.5 rounded-lg border border-cyan-500/30">
                  {k.keyCode}
                </div>
                <div className="text-[10px] text-gray-400 flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="font-mono text-gray-300">Invoice: {k.invoiceNumber || 'N/A'}</span>
                  <span>{k.purchaseDate || 'Just now'}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminCouponManagerView: React.FC = () => {
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [created, setCreated] = useState(false);

  return (
    <div className="space-y-4" id="admin-coupon-view">
      <div>
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Ticket className="w-4 h-4 text-yellow-400" />
          <span>Coupon Manager</span>
        </h2>
        <span className="text-[11px] text-gray-400">Create discount coupons for storefront checkouts</span>
      </div>

      <GlassCard glow="gold" className="p-4 bg-[#161622]/95 border-white/10 space-y-3 text-xs">
        <div>
          <label className="block text-gray-300 font-semibold mb-1">Coupon Code</label>
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="e.g. KALAM50 or VIP2026"
            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-yellow-400 text-white font-mono uppercase"
          />
        </div>
        <div>
          <label className="block text-gray-300 font-semibold mb-1">Discount (%)</label>
          <input
            type="number"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-yellow-400 text-white font-bold"
          />
        </div>

        <button
          onClick={() => {
            if (couponCode) {
              setCreated(true);
              setTimeout(() => setCreated(false), 2000);
            }
          }}
          className="w-full py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs shadow-lg cursor-pointer"
        >
          {created ? 'Coupon Created!' : '+ Create Coupon'}
        </button>
      </GlassCard>
    </div>
  );
};

export const AdminBroadcastView: React.FC = () => {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div className="space-y-4" id="admin-broadcast-view">
      <div>
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-[#ff0080]" />
          <span>Broadcast Message</span>
        </h2>
        <span className="text-[11px] text-gray-400">Push instantaneous announcement to all 4,800+ registered users</span>
      </div>

      <GlassCard glow="pink" className="p-4 bg-[#161622]/95 border-white/10 space-y-3 text-xs">
        <div>
          <label className="block text-gray-300 font-semibold mb-1">Broadcast Message</label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message with store announcement or notification details..."
            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-[#ff0080] text-white"
          />
        </div>

        <button
          onClick={() => {
            if (message) {
              setSent(true);
              setTimeout(() => {
                setMessage('');
                setSent(false);
              }, 2500);
            }
          }}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ff0080] to-[#8b5cf6] text-white font-extrabold text-xs shadow-[0_0_20px_rgba(255,0,128,0.4)] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{sent ? 'Sent to all users!' : 'Send Broadcast to All Users'}</span>
        </button>
      </GlassCard>
    </div>
  );
};

export const AdminBinanceView: React.FC = () => {
  return (
    <div className="space-y-4" id="admin-binance-view">
      <div>
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>Binance & Crypto Wallet</span>
        </h2>
        <span className="text-[11px] text-gray-400">Accept USDT (TRC20 / BEP20) auto deposits</span>
      </div>

      <GlassCard glow="gold" className="p-4 bg-[#161622]/95 border-white/10 space-y-3 text-xs">
        <div>
          <label className="text-[10px] text-gray-400 block mb-1 font-semibold">USDT TRC20 Address</label>
          <input
            type="text"
            readOnly
            value="TXd9821h9bKa1082Kalam991823HLa9921"
            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-amber-300 font-mono text-[11px]"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 block mb-1 font-semibold">1 USDT to INR Exchange Rate</label>
          <input
            type="number"
            defaultValue={92.5}
            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-bold"
          />
        </div>
      </GlassCard>
    </div>
  );
};

/* ==================== ADMIN TOPUPS / MONEY MANAGEMENT VIEW ==================== */
interface AdminTopupsViewProps {
  users: ResellerUser[];
  onAdjustBalance: (userId: string, amount: number, type: 'ADD' | 'MINUS', note?: string) => void;
}

export const AdminTopupsView: React.FC<AdminTopupsViewProps> = ({
  users,
  onAdjustBalance,
}) => {
  const [inputMode, setInputMode] = useState<'SELECT' | 'EMAIL'>('SELECT');
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'ADD' | 'MINUS'>('ADD');
  const [amount, setAmount] = useState<string>('500');
  const [note, setNote] = useState<string>('Manual Admin Credit / Top-up');
  const [isSuccess, setIsSuccess] = useState(false);

  // Match selected or custom user
  const foundUserByEmail = customEmail.trim()
    ? (users || []).find((u) => u.email && u.email.toLowerCase() === customEmail.trim().toLowerCase())
    : null;

  const defaultFallbackUser: ResellerUser = {
    id: 'usr_default',
    email: 'kalam172010@gmail.com',
    name: 'KALAM (OWNER)',
    username: 'kalam_owner',
    walletBalance: 0,
    depositedToday: 0,
    soldToday: 0,
    totalKeysSold: 0,
    isReseller: true,
    joinedDate: 'Today',
    status: 'ACTIVE' as const,
  };

  const activeUser = inputMode === 'SELECT'
    ? ((users || []).find((u) => u.id === selectedUserId) || (users && users[0]) || defaultFallbackUser)
    : (foundUserByEmail || {
        id: customEmail.trim() || 'new-user',
        email: customEmail.trim() || 'custom@user.com',
        name: customEmail.trim() ? customEmail.split('@')[0].toUpperCase() : 'Custom User',
        username: customEmail.trim() ? customEmail.split('@')[0] : 'custom_user',
        walletBalance: 0,
        depositedToday: 0,
        soldToday: 0,
        totalKeysSold: 0,
        isReseller: false,
        joinedDate: 'Today',
        status: 'ACTIVE' as const,
      });

  const quickAmounts = [50, 100, 250, 500, 1000, 2000, 5000];

  const handleApply = () => {
    const targetIdentifier = inputMode === 'SELECT' ? activeUser.id : (customEmail.trim() || activeUser.email);
    if (!targetIdentifier) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    onAdjustBalance(targetIdentifier, numAmount, adjustType, note);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2500);
  };

  const previewBalance = () => {
    const curBal = activeUser?.walletBalance || 0;
    const num = parseFloat(amount) || 0;
    if (adjustType === 'ADD') {
      return curBal + num;
    }
    return Math.max(0, curBal - num);
  };

  return (
    <div className="space-y-4" id="admin-topups-view">
      <div>
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
          <span>Manual User Balance Adjustment (Add & Minus Money)</span>
        </h2>
        <span className="text-[11px] text-gray-400">
          Directly credit (+ add) or debit (− minus) any user or your own email wallet balance
        </span>
      </div>

      <GlassCard glow="cyan" className="p-4 bg-[#161622]/95 border-white/10 space-y-4 text-xs">
        {/* Method Toggle: Select Member vs Type Custom Email */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <span className="text-gray-300 font-semibold text-xs">Target Member Selection:</span>
          <div className="flex rounded-xl bg-black/60 p-1 border border-white/10 text-[11px]">
            <button
              type="button"
              onClick={() => setInputMode('SELECT')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                inputMode === 'SELECT'
                  ? 'bg-[#00e5ff] text-black shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Select List
            </button>
            <button
              type="button"
              onClick={() => setInputMode('EMAIL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                inputMode === 'EMAIL'
                  ? 'bg-[#00e5ff] text-black shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Type Email ID
            </button>
          </div>
        </div>

        {/* Input Controls */}
        {inputMode === 'SELECT' ? (
          <div>
            <label className="text-gray-300 font-semibold block mb-1.5">
              Select Registered Member Account
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#00e5ff] text-white font-medium focus:outline-none"
            >
              {deduplicateUsers(users || []).map((u, idx) => (
                <option key={`${u.id || 'user'}_${idx}`} value={u.id} className="bg-[#161622] text-white">
                  {u.name} ({u.email}) — Balance: ₹{(u.walletBalance || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-gray-300 font-semibold block">
              Enter User or Admin Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="e.g. user@gmail.com or customer@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-[#00e5ff] text-white font-mono text-xs focus:outline-none"
              />
            </div>
            {customEmail.trim() && (
              <div className="text-[10px] text-gray-400 flex items-center justify-between px-1">
                <span>
                  {foundUserByEmail
                    ? `✓ Existing Member: ${foundUserByEmail.name}`
                    : '✦ New User Account (will be created & credited)'}
                </span>
                <span className="font-mono text-[#00e5ff] font-bold">
                  Current: ₹{(activeUser?.walletBalance || 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Selected User Balance Card */}
        {activeUser && (
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold">
                Current Wallet Balance for
              </span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{activeUser.name}</span>
                <span className="text-[10px] font-normal text-gray-400 font-mono">({activeUser.email})</span>
              </span>
            </div>
            <span className="text-lg font-black font-mono text-emerald-400">
              {formatCurrency(activeUser.walletBalance || 0)}
            </span>
          </div>
        )}

        {/* Mode Selector: Add Money (+) vs Minus Money (-) */}
        <div className="space-y-1">
          <label className="text-gray-300 font-semibold block">Select Operation Type</label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/60 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setAdjustType('ADD');
                setNote('Manual Admin Credit / Top-up');
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                adjustType === 'ADD'
                  ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Money (Credit)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAdjustType('MINUS');
                setNote('Manual Balance Deduction / Minus');
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                adjustType === 'MINUS'
                  ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="font-mono text-sm leading-none font-bold">−</span>
              <span>− Minus Money (Debit)</span>
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-1.5">
          <label className="text-gray-300 font-semibold block">
            {adjustType === 'ADD' ? 'Amount to Add (₹)' : 'Amount to Minus / Deduct (₹)'}
          </label>
          <div className="relative">
            <span
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold ${
                adjustType === 'ADD' ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ₹
            </span>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              className={`w-full pl-8 pr-4 py-2.5 rounded-xl bg-black/60 border ${
                adjustType === 'ADD' ? 'focus:border-emerald-400' : 'focus:border-rose-400'
              } border-white/10 focus:outline-none text-xl font-bold text-white font-mono`}
            />
          </div>
        </div>

        {/* Quick Amount Pills */}
        <div className="grid grid-cols-4 gap-1.5">
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setAmount(amt.toString())}
              className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-bold text-gray-300 cursor-pointer"
            >
              {adjustType === 'ADD' ? `+₹${amt}` : `-₹${amt}`}
            </button>
          ))}
        </div>

        {/* Note / Remarks */}
        <div className="space-y-1">
          <label className="text-gray-300 font-semibold block">Reason / Audit Remark</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Manual UPI payment / Cash deposit / Refund adjustment"
            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none"
          />
        </div>

        {/* Preview Calculation Box */}
        <div
          className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
            adjustType === 'ADD'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
          }`}
        >
          <div>
            <span className="block font-semibold">Resulting Wallet Balance:</span>
            <span className="text-[10px] opacity-80">
              {adjustType === 'ADD'
                ? `₹${(activeUser?.walletBalance || 0).toFixed(2)} + ₹${parseFloat(amount) || 0}`
                : `₹${(activeUser?.walletBalance || 0).toFixed(2)} − ₹${parseFloat(amount) || 0}`}
            </span>
          </div>
          <span className="text-lg font-black font-mono text-white">
            {formatCurrency(previewBalance())}
          </span>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleApply}
          className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all ${
            adjustType === 'ADD'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-emerald-500/40'
              : 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-rose-500/40'
          }`}
        >
          {isSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Balance Successfully Updated for {activeUser.email}!</span>
            </>
          ) : (
            <>
              {adjustType === 'ADD' ? <Plus className="w-4 h-4" /> : <span className="font-mono text-base font-bold">−</span>}
              <span>{adjustType === 'ADD' ? `Credit Money to ${activeUser.email} (+)` : `Minus Money from ${activeUser.email} (−)`}</span>
            </>
          )}
        </motion.button>
      </GlassCard>
    </div>
  );
};


/* ==================== 14. ADMIN PROFILE VIEW ==================== */
interface AdminProfileViewProps {
  currentUser?: AuthUser | null;
  storeSettings?: StoreSettings;
  onLogout?: () => void;
  onSwitchToUser?: () => void;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  currentUser,
  storeSettings,
  onLogout,
  onSwitchToUser,
}) => {
  const adminEmail = currentUser?.email || 'kalam172010@gmail.com';
  const adminName = currentUser?.name || 'KALAM MASTER ADMIN';

  return (
    <div className="space-y-4" id="admin-profile-view">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span>Master Admin Profile</span>
          </h2>
          <span className="text-[11px] text-gray-400">Authenticated Admin Session & Privileges</span>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-[11px] font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      <GlassCard glow="gold" className="p-4 bg-[#161622]/95 border-amber-500/30 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 via-amber-500 to-orange-500 p-[2px] shadow-[0_0_20px_rgba(234,179,8,0.3)]">
            <div className="w-full h-full bg-[#0a0a0f] rounded-[14px] flex items-center justify-center font-black text-lg text-yellow-400">
              <Crown className="w-6 h-6 fill-yellow-400/40" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white truncate">{adminName}</h3>
              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 uppercase">
                MASTER ADMIN
              </span>
            </div>
            <span className="text-xs text-[#00e5ff] font-mono flex items-center gap-1 truncate">
              <Mail className="w-3 h-3 text-[#00e5ff]" />
              <span>{adminEmail}</span>
            </span>
            <span className="text-[10px] text-gray-400 block font-mono">
              Role: System Administrator • Owner
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] text-gray-400 block">Access Level</span>
            <span className="font-bold text-yellow-400 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Full Root Access</span>
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] text-gray-400 block">Store Name</span>
            <span className="font-bold text-[#00e5ff] truncate block mt-0.5">
              {storeSettings?.shopName || 'KALAM FF PANEL'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-gray-400 block">Register Date</span>
            <span className="font-bold text-amber-400 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentUser?.joinedDate || 'Founding Admin'}</span>
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-yellow-300 font-bold text-[11px]">
            <Lock className="w-3.5 h-3.5" />
            <span>Admin Email Lock Enforced</span>
          </div>
          <p className="text-[10px] text-gray-300">
            The Bot Control Center is securely protected and restricted to <strong className="text-white font-mono">{adminEmail}</strong>.
          </p>
        </div>

        {onSwitchToUser && (
          <button
            onClick={onSwitchToUser}
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            ← Return to User Store
          </button>
        )}
      </GlassCard>
    </div>
  );
};
