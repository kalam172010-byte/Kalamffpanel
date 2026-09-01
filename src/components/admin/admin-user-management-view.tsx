import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  Plus,
  Crown,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  CheckCircle2,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Edit3,
  Trash2,
  MoreVertical,
  KeyRound,
  Download,
  Upload,
  RefreshCw,
  X,
  Phone,
  Mail,
  User,
  History,
  Check,
  Sparkles,
  ExternalLink,
  Coins,
  FileText
} from 'lucide-react';
import { GlassCard } from '../shared/glass-card';
import { formatCurrency } from '../../lib/utils';
import { AuthUser, ResellerUser, PurchasedKey, TransactionRecord } from '../../types';

interface AdminUserManagementViewProps {
  users: ResellerUser[];
  onAddUser: (newUser: Omit<ResellerUser, 'id'> & { id?: string }) => void;
  onUpdateUser: (updatedUser: ResellerUser) => void;
  onDeleteUser: (userId: string) => void;
  onAdjustBalance: (userIdOrEmail: string, amount: number, type: 'ADD' | 'MINUS', note?: string) => void;
  onToggleStatus: (userId: string, status: 'ACTIVE' | 'WARNING' | 'INACTIVE' | 'BLOCKED') => void;
  onPromoteRole: (userId: string, role: 'USER' | 'RESELLER' | 'ADMIN') => void;
  onRefreshUsers?: () => void;
  currentUser?: AuthUser | null;
  userKeys?: PurchasedKey[];
  transactions?: TransactionRecord[];
}

export const AdminUserManagementView: React.FC<AdminUserManagementViewProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAdjustBalance,
  onToggleStatus,
  onPromoteRole,
  onRefreshUsers,
  currentUser,
  userKeys = [],
  transactions = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'RESELLER' | 'USER' | 'ADMIN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED' | 'WARNING' | 'NON_ZERO'>('ALL');
  const [sortBy, setSortBy] = useState<'balance_desc' | 'balance_asc' | 'keys_desc' | 'recent' | 'name'>('balance_desc');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ResellerUser | null>(null);
  const [inspectingUser, setInspectingUser] = useState<ResellerUser | null>(null);
  const [balanceUser, setBalanceUser] = useState<{ user: ResellerUser; type: 'ADD' | 'MINUS' } | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<ResellerUser | null>(null);

  // Quick balance form state
  const [adjustAmount, setAdjustAmount] = useState<string>('100');
  const [adjustNote, setAdjustNote] = useState<string>('');

  // Add User Form State
  const [newFormData, setNewFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    role: 'USER' as 'USER' | 'RESELLER' | 'ADMIN',
    initialBalance: '0',
    status: 'ACTIVE' as 'ACTIVE' | 'WARNING' | 'INACTIVE' | 'BLOCKED',
    notes: '',
  });

  // Filter & Search Logic
  const filteredUsers = (users || [])
    .filter((u) => {
      const matchSearch =
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.id || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      const isReseller = Boolean(u.isReseller || u.role === 'RESELLER');
      const isAdmin = u.role === 'ADMIN' || u.email?.toLowerCase() === 'kalam172010@gmail.com';
      const uStatus = u.status || 'ACTIVE';

      // Role Filter
      if (roleFilter === 'RESELLER' && !isReseller) return false;
      if (roleFilter === 'USER' && (isReseller || isAdmin)) return false;
      if (roleFilter === 'ADMIN' && !isAdmin) return false;

      // Status Filter
      if (statusFilter === 'ACTIVE' && uStatus !== 'ACTIVE') return false;
      if (statusFilter === 'BLOCKED' && uStatus !== 'BLOCKED' && uStatus !== 'INACTIVE') return false;
      if (statusFilter === 'WARNING' && uStatus !== 'WARNING') return false;
      if (statusFilter === 'NON_ZERO' && (u.walletBalance || 0) <= 0) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'balance_desc') return (b.walletBalance || 0) - (a.walletBalance || 0);
      if (sortBy === 'balance_asc') return (a.walletBalance || 0) - (b.walletBalance || 0);
      if (sortBy === 'keys_desc') return (b.totalKeysSold || 0) - (a.totalKeysSold || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

  // Summary Metrics
  const totalUsersCount = (users || []).length;
  const totalResellersCount = (users || []).filter((u) => u.isReseller || u.role === 'RESELLER').length;
  const totalVaultBalance = (users || []).reduce((acc, u) => acc + (u.walletBalance || 0), 0);
  const totalBlockedCount = (users || []).filter((u) => u.status === 'BLOCKED' || u.status === 'INACTIVE').length;
  const totalKeysDelivered = (users || []).reduce((acc, u) => acc + (u.totalKeysSold || 0), 0);

  const quickAmounts = [50, 100, 200, 500, 1000, 2000, 5000];

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormData.name.trim() || !newFormData.email.trim()) return;

    const cleanEmail = newFormData.email.trim().toLowerCase();
    const cleanUsername = newFormData.username.trim() || cleanEmail.split('@')[0];
    const initialBal = parseFloat(newFormData.initialBalance) || 0;

    onAddUser({
      name: newFormData.name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      phone: newFormData.phone.trim(),
      walletBalance: initialBal,
      depositedToday: initialBal > 0 ? initialBal : 0,
      soldToday: 0,
      totalKeysSold: 0,
      isReseller: newFormData.role === 'RESELLER',
      role: newFormData.role,
      joinedDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      status: newFormData.status,
      notes: newFormData.notes.trim(),
    });

    setIsAddUserOpen(false);
    setNewFormData({
      name: '',
      username: '',
      email: '',
      phone: '',
      role: 'USER',
      initialBalance: '0',
      status: 'ACTIVE',
      notes: '',
    });
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    onUpdateUser(editingUser);
    setEditingUser(null);
  };

  const handleExportUsers = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(users, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kalam_users_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-5" id="admin-user-management-system">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff0080] to-[#8b5cf6] flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,0,128,0.4)]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                <span>User Management System</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  {filteredUsers.length} Records
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Full control over registered accounts, reseller authorizations, and wallet balances
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {onRefreshUsers && (
            <button
              onClick={() => {
                setIsRefreshing(true);
                onRefreshUsers();
                setTimeout(() => setIsRefreshing(false), 800);
              }}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              title="Sync latest user accounts from Firestore cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Cloud</span>
            </button>
          )}

          <button
            onClick={handleExportUsers}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            title="Export Users to JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => setIsAddUserOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff0080] via-[#8b5cf6] to-[#00e5ff] hover:opacity-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,0,128,0.4)] cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Accounts */}
        <GlassCard glow="cyan" className="p-3.5 bg-[#161622]/90 border-cyan-500/20">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">{totalUsersCount}</div>
          <div className="text-[10px] text-cyan-400/80 mt-0.5">Accounts registered</div>
        </GlassCard>

        {/* Resellers / VIPs */}
        <GlassCard glow="purple" className="p-3.5 bg-[#161622]/90 border-purple-500/20">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Resellers</span>
            <Crown className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-300 font-mono">{totalResellersCount}</div>
          <div className="text-[10px] text-purple-400/80 mt-0.5">Verified wholesale partners</div>
        </GlassCard>

        {/* Total Vault Balance */}
        <GlassCard glow="gold" className="p-3.5 bg-[#161622]/90 border-amber-500/20">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total User Vault</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-300 font-mono">
            {formatCurrency(totalVaultBalance)}
          </div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">Sum of all wallets</div>
        </GlassCard>

        {/* Keys Delivered */}
        <GlassCard glow="green" className="p-3.5 bg-[#161622]/90 border-emerald-500/20">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Keys Delivered</span>
            <KeyRound className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-300 font-mono">{totalKeysDelivered}</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">{totalBlockedCount} suspended accounts</div>
        </GlassCard>
      </div>

      {/* Search & Filter Toolbar */}
      <GlassCard glow="none" className="p-3 bg-[#12121a]/95 border-white/10 space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user by name, email, @username, phone, or ID..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-gray-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-black/70 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer font-mono"
            >
              <option value="balance_desc">Balance: Highest First</option>
              <option value="balance_asc">Balance: Lowest First</option>
              <option value="keys_desc">Keys Sold: Most</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
          {/* Role Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Role:</span>
            {(['ALL', 'RESELLER', 'USER', 'ADMIN'] as const).map((rf) => (
              <button
                key={rf}
                onClick={() => setRoleFilter(rf)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  roleFilter === rf
                    ? 'bg-gradient-to-r from-[#ff0080] to-[#8b5cf6] text-white shadow-[0_0_12px_rgba(255,0,128,0.4)]'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {rf}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Status:</span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'BLOCKED', label: 'Blocked' },
              { id: 'NON_ZERO', label: '₹ > 0 Balance' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold'
                    : 'bg-black/40 border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Users Data Grid & List */}
      <div className="space-y-2.5">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center bg-[#161622]/60 rounded-2xl border border-white/10 space-y-2">
            <Users className="w-8 h-8 text-gray-600 mx-auto" />
            <div className="text-sm font-bold text-gray-300">No users found matching your filters</div>
            <p className="text-xs text-gray-500">Try changing your search query or reset the filter filters.</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold cursor-pointer"
              >
                Reset All Filters
              </button>
              {onRefreshUsers && (
                <button
                  onClick={onRefreshUsers}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sync Cloud Users</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isUserAdmin =
              user.role === 'ADMIN' ||
              user.email?.toLowerCase() === 'kalam172010@gmail.com';
            const isSelf = currentUser?.email && user.email && currentUser.email.toLowerCase() === user.email.toLowerCase();
            const isBlocked = user.status === 'BLOCKED' || user.status === 'INACTIVE';

            return (
              <div
                key={user.id}
                className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                  isBlocked
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : isUserAdmin
                    ? 'bg-[#161626] border-amber-500/40 shadow-[0_0_20px_rgba(234,179,8,0.1)]'
                    : user.isReseller
                    ? 'bg-[#151522] border-purple-500/30'
                    : 'bg-[#12121b] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left: User Identity Info */}
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm uppercase ${
                          isUserAdmin
                            ? 'bg-gradient-to-br from-amber-500 to-yellow-600 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                            : user.isReseller
                            ? 'bg-gradient-to-br from-[#ff0080] to-[#8b5cf6] text-white shadow-[0_0_15px_rgba(255,0,128,0.3)]'
                            : 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-300'
                        }`}
                      >
                        {(user.name || 'U').slice(0, 2)}
                      </div>
                      {/* Status Dot */}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#12121b] ${
                          isBlocked ? 'bg-rose-500' : 'bg-emerald-400'
                        }`}
                        title={isBlocked ? 'Blocked Account' : 'Active Account'}
                      />
                    </div>

                    {/* Meta Details */}
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-extrabold text-white text-sm truncate">{user.name}</span>
                        {isSelf && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                            YOU
                          </span>
                        )}

                        {/* Role Badges */}
                        {isUserAdmin ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5 text-amber-400" /> MASTER ADMIN
                          </span>
                        ) : user.isReseller ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-purple-400" /> RESELLER
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-gray-400 font-mono">
                            USER
                          </span>
                        )}

                        {/* Status Badge */}
                        {isBlocked && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 flex items-center gap-1">
                            <Ban className="w-2.5 h-2.5" /> SUSPENDED
                          </span>
                        )}
                      </div>

                      {/* Sub row: Email, username, phone */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
                        <span className="font-mono text-cyan-300/90 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-cyan-400" />
                          {user.email || 'No email'}
                        </span>
                        <span className="font-mono text-gray-400">@{user.username || 'user'}</span>
                        {user.phone && (
                          <span className="font-mono text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            {user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Wallet Stats & Operations */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
                    {/* Wallet Box */}
                    <div className="flex items-center gap-3 bg-black/50 px-3 py-1.5 rounded-xl border border-white/10">
                      <div>
                        <div className="text-[9px] uppercase font-mono text-gray-400">Wallet Balance</div>
                        <div className="text-base font-black text-amber-300 font-mono">
                          {formatCurrency(user.walletBalance || 0)}
                        </div>
                      </div>

                      {/* Quick Add / Minus Balance Buttons */}
                      <div className="flex items-center gap-1 pl-2 border-l border-white/10">
                        <button
                          onClick={() => {
                            setBalanceUser({ user, type: 'ADD' });
                            setAdjustAmount('100');
                            setAdjustNote('Admin credit top-up');
                          }}
                          className="w-7 h-7 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-black text-xs cursor-pointer transition-all"
                          title="Add Money to Wallet (+)"
                        >
                          +
                        </button>
                        <button
                          onClick={() => {
                            setBalanceUser({ user, type: 'MINUS' });
                            setAdjustAmount('50');
                            setAdjustNote('Admin balance adjustment');
                          }}
                          className="w-7 h-7 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 flex items-center justify-center font-black text-xs cursor-pointer transition-all"
                          title="Deduct Money from Wallet (-)"
                        >
                          −
                        </button>
                      </div>
                    </div>

                    {/* Key stats pill */}
                    <div className="hidden sm:block text-right pr-2">
                      <div className="text-[10px] text-gray-400 uppercase font-mono">Keys Sold</div>
                      <div className="text-xs font-bold text-white font-mono">
                        {user.totalKeysSold || 0} Keys
                      </div>
                    </div>

                    {/* Action Buttons Group */}
                    <div className="flex items-center gap-1.5">
                      {/* View Dossier / Inspect */}
                      <button
                        onClick={() => setInspectingUser(user)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white cursor-pointer transition-all"
                        title="View Full User Profile & Purchase History"
                      >
                        <FileText className="w-4 h-4 text-cyan-400" />
                      </button>

                      {/* Edit Profile */}
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white cursor-pointer transition-all"
                        title="Edit User Information"
                      >
                        <Edit3 className="w-4 h-4 text-yellow-400" />
                      </button>

                      {/* Toggle Block / Unblock */}
                      <button
                        onClick={() =>
                          onToggleStatus(user.id, isBlocked ? 'ACTIVE' : 'BLOCKED')
                        }
                        className={`p-2 rounded-xl border cursor-pointer transition-all ${
                          isBlocked
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                            : 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                        }`}
                        title={isBlocked ? 'Unblock & Activate Account' : 'Block & Suspend Account'}
                      >
                        {isBlocked ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>

                      {/* Role Toggle (Promote to Reseller / Revert to User) */}
                      {!isUserAdmin && (
                        <button
                          onClick={() =>
                            onPromoteRole(
                              user.id,
                              user.isReseller || user.role === 'RESELLER' ? 'USER' : 'RESELLER'
                            )
                          }
                          className={`p-2 rounded-xl border cursor-pointer transition-all ${
                            user.isReseller
                              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:text-purple-300 hover:border-purple-500/30'
                          }`}
                          title={
                            user.isReseller
                              ? 'Demote from Reseller to User'
                              : 'Promote to Official Reseller Partner'
                          }
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete Account Button */}
                      {!isSelf && !isUserAdmin && (
                        <button
                          onClick={() => setDeleteConfirmUser(user)}
                          className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/20 text-rose-400 cursor-pointer transition-all"
                          title="Delete User Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. ADD NEW USER MODAL                                     */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isAddUserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddUserOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-[#14141e] border border-cyan-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,229,255,0.25)] space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-black font-black">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Create New User Account</h3>
                    <p className="text-[11px] text-gray-400">Register new member or reseller manually</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddUserOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Full Name / Display Name *</label>
                  <input
                    type="text"
                    required
                    value={newFormData.name}
                    onChange={(e) => setNewFormData({ ...newFormData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Email & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={newFormData.email}
                      onChange={(e) => setNewFormData({ ...newFormData, email: e.target.value })}
                      placeholder="user@example.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Username (@)</label>
                    <input
                      type="text"
                      value={newFormData.username}
                      onChange={(e) => setNewFormData({ ...newFormData, username: e.target.value })}
                      placeholder="e.g. rahul_vip"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Phone & Initial Balance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={newFormData.phone}
                      onChange={(e) => setNewFormData({ ...newFormData, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Initial Wallet Balance (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={newFormData.initialBalance}
                      onChange={(e) => setNewFormData({ ...newFormData, initialBalance: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-amber-300 font-bold text-xs font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Role & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Account Role</label>
                    <select
                      value={newFormData.role}
                      onChange={(e) => setNewFormData({ ...newFormData, role: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="USER">Regular User</option>
                      <option value="RESELLER">Reseller Partner (VIP)</option>
                      <option value="ADMIN">Sub-Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Initial Status</label>
                    <select
                      value={newFormData.status}
                      onChange={(e) => setNewFormData({ ...newFormData, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE (Normal Access)</option>
                      <option value="WARNING">WARNING (Under Review)</option>
                      <option value="BLOCKED">BLOCKED (Suspended)</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Admin Internal Note (Optional)</label>
                  <textarea
                    rows={2}
                    value={newFormData.notes}
                    onChange={(e) => setNewFormData({ ...newFormData, notes: e.target.value })}
                    placeholder="e.g. VIP reseller from Telegram channel #4"
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-[#8b5cf6] text-black font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,229,255,0.4)] cursor-pointer"
                  >
                    Save & Create Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 2. EDIT USER DETAILS MODAL                                */}
      {/* ========================================================= */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-[#14141e] border border-yellow-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(234,179,8,0.25)] space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Edit User Profile</h3>
                    <p className="text-[11px] text-gray-400 font-mono">{editingUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditUser} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Username</label>
                    <input
                      type="text"
                      value={editingUser.username}
                      onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      placeholder="+91..."
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Account Role</label>
                    <select
                      value={editingUser.isReseller ? 'RESELLER' : (editingUser.role || 'USER')}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setEditingUser({
                          ...editingUser,
                          role: val,
                          isReseller: val === 'RESELLER',
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-yellow-400 cursor-pointer"
                    >
                      <option value="USER">Regular Customer</option>
                      <option value="RESELLER">Reseller Partner</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Account Status</label>
                    <select
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-yellow-400 cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE (Normal Access)</option>
                      <option value="WARNING">WARNING</option>
                      <option value="BLOCKED">BLOCKED (Access Denied)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">Direct Wallet Balance (₹)</label>
                    <input
                      type="number"
                      step="any"
                      value={editingUser.walletBalance}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, walletBalance: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-amber-300 font-bold text-xs font-mono focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={editingUser.notes || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, notes: e.target.value })}
                    placeholder="Admin remarks about this user..."
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase shadow-[0_0_20px_rgba(234,179,8,0.4)] cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 3. QUICK WALLET BALANCE ADJUSTMENT MODAL                  */}
      {/* ========================================================= */}
      <AnimatePresence>
        {balanceUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBalanceUser(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1, y: 0 }}
              className="relative w-full max-w-md bg-[#14141e] border border-amber-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(234,179,8,0.25)] space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                      balanceUser.type === 'ADD'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {balanceUser.type === 'ADD' ? '+' : '−'}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      {balanceUser.type === 'ADD' ? 'Credit Wallet Balance (+)' : 'Deduct Wallet Balance (−)'}
                    </h3>
                    <p className="text-[11px] text-gray-400 font-mono">
                      Target: {balanceUser.user.name} ({balanceUser.user.email})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBalanceUser(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current balance card */}
              <div className="p-3 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-mono">Current Balance</span>
                  <div className="text-base font-black text-amber-300 font-mono">
                    {formatCurrency(balanceUser.user.walletBalance || 0)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-mono">After Operation</span>
                  <div className="text-base font-black text-white font-mono">
                    {formatCurrency(
                      balanceUser.type === 'ADD'
                        ? (balanceUser.user.walletBalance || 0) + (parseFloat(adjustAmount) || 0)
                        : Math.max(0, (balanceUser.user.walletBalance || 0) - (parseFloat(adjustAmount) || 0))
                    )}
                  </div>
                </div>
              </div>

              {/* Quick chip buttons */}
              <div>
                <label className="text-[11px] font-bold text-gray-400 block mb-1.5">Quick Select Amount (₹)</label>
                <div className="flex flex-wrap gap-1.5">
                  {quickAmounts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAdjustAmount(q.toString())}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                        adjustAmount === q.toString()
                          ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(234,179,8,0.4)]'
                          : 'bg-black/50 border border-white/10 text-gray-300 hover:text-white'
                      }`}
                    >
                      ₹{q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual input */}
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Custom Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-amber-300 font-bold text-base font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Note / reason */}
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Reason / Reference Note</label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="e.g. Deposit top-up / UPI manual credit"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceUser(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const amt = parseFloat(adjustAmount);
                    if (!amt || amt <= 0) return;
                    onAdjustBalance(balanceUser.user.id, amt, balanceUser.type, adjustNote);
                    setBalanceUser(null);
                  }}
                  className={`px-5 py-2 rounded-xl text-black font-black text-xs uppercase cursor-pointer transition-all ${
                    balanceUser.type === 'ADD'
                      ? 'bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                      : 'bg-rose-400 hover:bg-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                  }`}
                >
                  Confirm {balanceUser.type === 'ADD' ? 'Credit' : 'Deduction'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 4. USER DOSSIER & KEYS HISTORY INSPECT MODAL             */}
      {/* ========================================================= */}
      <AnimatePresence>
        {inspectingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectingUser(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1, y: 0 }}
              className="relative w-full max-w-lg bg-[#14141e] border border-cyan-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,229,255,0.25)] space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">{inspectingUser.name}</h3>
                    <p className="text-[11px] text-gray-400 font-mono">{inspectingUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectingUser(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                  <span className="text-[10px] text-gray-400 uppercase font-mono block">Wallet Balance</span>
                  <span className="text-sm font-black text-amber-300 font-mono">
                    {formatCurrency(inspectingUser.walletBalance || 0)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                  <span className="text-[10px] text-gray-400 uppercase font-mono block">Account Role</span>
                  <span className="text-xs font-bold text-white uppercase">
                    {inspectingUser.role || (inspectingUser.isReseller ? 'RESELLER' : 'USER')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                  <span className="text-[10px] text-gray-400 uppercase font-mono block">Joined Date</span>
                  <span className="text-xs font-mono text-gray-300">{inspectingUser.joinedDate || 'Recent'}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                  <span className="text-[10px] text-gray-400 uppercase font-mono block">Keys Purchased</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{inspectingUser.totalKeysSold || 0} Keys</span>
                </div>
              </div>

              {/* Phone / Contact */}
              {inspectingUser.phone && (
                <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone:
                  </span>
                  <span className="font-mono text-white font-bold">{inspectingUser.phone}</span>
                </div>
              )}

              {/* Notes */}
              {inspectingUser.notes && (
                <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs">
                  <span className="text-[10px] text-yellow-400 uppercase font-mono block mb-0.5">Admin Note</span>
                  <p className="text-gray-300">{inspectingUser.notes}</p>
                </div>
              )}

              {/* Action buttons inside dossier */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = inspectingUser;
                    setInspectingUser(null);
                    setEditingUser(target);
                  }}
                  className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30 text-xs font-bold cursor-pointer"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingUser(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 5. DELETE USER CONFIRMATION MODAL                         */}
      {/* ========================================================= */}
      <AnimatePresence>
        {deleteConfirmUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmUser(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1, y: 0 }}
              className="relative w-full max-w-sm bg-[#16141a] border border-rose-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(244,63,94,0.3)] text-center space-y-4"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-white">Delete User Account?</h3>
                <p className="text-xs text-gray-400">
                  Are you sure you want to permanently remove{' '}
                  <span className="text-white font-bold">{deleteConfirmUser.name}</span> (
                  <span className="font-mono text-rose-300">{deleteConfirmUser.email}</span>)?
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-left text-xs space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Current Wallet Balance:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {formatCurrency(deleteConfirmUser.walletBalance || 0)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmUser(null)}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteUser(deleteConfirmUser.id);
                    setDeleteConfirmUser(null);
                  }}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase shadow-[0_0_20px_rgba(244,63,94,0.4)] cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
