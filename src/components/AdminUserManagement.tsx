import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Shield,
  ShieldCheck,
  Star,
  Wallet,
  Clock,
  RefreshCw,
  Send,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  ExternalLink,
  MessageSquare,
  DollarSign,
  Crown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  X
} from 'lucide-react';
import { BotUser, Role } from '../types';

interface ExtendedBotUser {
  chatId: number;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  balance: number;
  totalSpent: number;
  totalDeposited: number;
  joinedAt: number;
  lastActive: number;
  interactionCount: number;
  referrerId: string | null;
  isReseller: boolean;
  role: Role;
  resellerUpgradedAt: number | null;
}

type SortField = 'fullName' | 'balance' | 'role' | 'lastActive' | 'totalSpent' | 'joinedAt';
type SortDirection = 'asc' | 'desc';

export const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<ExtendedBotUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'RESELLER' | 'USER' | 'ADMIN'>('ALL');
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('lastActive');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Toggling status tracking
  const [togglingUserId, setTogglingUserId] = useState<number | string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Direct Message Modal
  const [messageModalUser, setMessageModalUser] = useState<ExtendedBotUser | null>(null);
  const [directMessageText, setDirectMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Add Balance Modal
  const [balanceModalUser, setBalanceModalUser] = useState<ExtendedBotUser | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('Manual Admin Credit');
  const [updatingBalance, setUpdatingBalance] = useState(false);

  const fetchUsers = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await fetch('/api/admin/telegram/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to retrieve bot users directory.' });
      }
    } catch (err: any) {
      console.error('Error fetching bot users:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Network error fetching bot users.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleReseller = async (user: ExtendedBotUser) => {
    const targetStatus = !user.isReseller;
    setTogglingUserId(user.chatId);

    // Optimistic UI update
    setUsers(prev =>
      prev.map(u =>
        u.chatId === user.chatId
          ? {
              ...u,
              isReseller: targetStatus,
              role: targetStatus ? 'RESELLER' : 'USER',
              resellerUpgradedAt: targetStatus ? Date.now() : u.resellerUpgradedAt,
            }
          : u
      )
    );

    try {
      const res = await fetch('/api/admin/telegram/users/set-reseller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: user.chatId,
          isReseller: targetStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `✅ ${user.firstName || 'User'} is now ${targetStatus ? 'a VIP Reseller' : 'a Standard Member'}!`,
        });
      } else {
        // Rollback optimistic update
        fetchUsers();
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update reseller status.' });
      }
    } catch (err: any) {
      fetchUsers();
      setStatusMessage({ type: 'error', text: err.message || 'Error updating reseller status.' });
    } finally {
      setTogglingUserId(null);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageModalUser || !directMessageText.trim()) return;

    try {
      setSendingMessage(true);
      const res = await fetch('/api/admin/telegram/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: messageModalUser.chatId,
          message: directMessageText.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Message delivered directly to ${messageModalUser.firstName}'s Telegram!`,
        });
        setMessageModalUser(null);
        setDirectMessageText('');
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to deliver message via Telegram.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error sending direct message.' });
    } finally {
      setSendingMessage(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModalUser) return;
    const amt = parseFloat(balanceAmount);
    if (isNaN(amt) || amt === 0) {
      alert('Please enter a valid non-zero amount');
      return;
    }

    try {
      setUpdatingBalance(true);
      const res = await fetch('/api/admin/telegram/users/add-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: balanceModalUser.userId,
          chatId: balanceModalUser.chatId,
          amount: amt,
          reason: balanceReason.trim() || 'Admin Adjustment',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Successfully adjusted ₹${amt > 0 ? '+' : ''}${amt} for ${balanceModalUser.firstName}. New Balance: ₹${data.newBalance ?? (balanceModalUser.balance + amt)}`,
        });
        setBalanceModalUser(null);
        setBalanceAmount('');
        fetchUsers(true);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to adjust user wallet.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error adjusting balance.' });
    } finally {
      setUpdatingBalance(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setPage(1);
  };

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Role filter
      if (roleFilter === 'RESELLER' && !u.isReseller && u.role !== 'RESELLER') return false;
      if (roleFilter === 'USER' && (u.isReseller || u.role === 'ADMIN' || u.role === 'RESELLER')) return false;
      if (roleFilter === 'ADMIN' && u.role !== 'ADMIN') return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = (u.fullName || '').toLowerCase().includes(q);
        const matchesUser = (u.username || '').toLowerCase().includes(q);
        const matchesChatId = String(u.chatId).includes(q);
        const matchesUserId = (u.userId || '').toLowerCase().includes(q);
        return matchesName || matchesUser || matchesChatId || matchesUserId;
      }

      return true;
    });
  }, [users, roleFilter, search]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortField) {
        case 'fullName':
          valA = (a.fullName || a.username || '').toLowerCase();
          valB = (b.fullName || b.username || '').toLowerCase();
          break;
        case 'balance':
          valA = a.balance || 0;
          valB = b.balance || 0;
          break;
        case 'role':
          valA = a.role === 'ADMIN' ? 3 : a.isReseller ? 2 : 1;
          valB = b.role === 'ADMIN' ? 3 : b.isReseller ? 2 : 1;
          break;
        case 'lastActive':
          valA = a.lastActive || 0;
          valB = b.lastActive || 0;
          break;
        case 'totalSpent':
          valA = a.totalSpent || 0;
          valB = b.totalSpent || 0;
          break;
        case 'joinedAt':
          valA = a.joinedAt || 0;
          valB = b.joinedAt || 0;
          break;
        default:
          valA = a.lastActive || 0;
          valB = b.lastActive || 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, page, pageSize]);

  // Aggregate metrics
  const totalUsersCount = users.length;
  const resellerCount = users.filter(u => u.isReseller || u.role === 'RESELLER' || u.role === 'ADMIN').length;
  const totalBalancesSum = users.reduce((acc, u) => acc + (u.balance || 0), 0);
  const activeTodayCount = users.filter(u => {
    if (!u.lastActive) return false;
    const diffHours = (Date.now() - u.lastActive) / (1000 * 60 * 60);
    return diffHours <= 24;
  }).length;

  const formatRelativeTime = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diffSeconds = Math.floor((now - timestamp) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;

    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatExactDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#141428] via-[#171736] to-[#121226] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-wide">
                  Admin Bot User Management
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {totalUsersCount} Registered
                </span>
              </div>
              <p className="text-gray-400 text-xs mt-1">
                Monitor customer balances, toggle VIP Reseller privileges, sort users by activity, and send direct Telegram messages.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="px-4 py-2 rounded-xl text-xs font-black bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Directory'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            : statusMessage.type === 'error'
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
        }`}>
          {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          {statusMessage.type === 'info' && <Info className="w-4 h-4 flex-shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#121222] border border-white/5 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">{totalUsersCount}</div>
          <div className="text-[10px] text-cyan-400 mt-0.5">Telegram bot community</div>
        </div>

        <div className="bg-[#121222] border border-amber-500/20 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">VIP Resellers</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1.5">{resellerCount}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">Wholesale discount tier</div>
        </div>

        <div className="bg-[#121222] border border-emerald-500/20 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Balances</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1.5">₹{totalBalancesSum.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Customer wallet liabilities</div>
        </div>

        <div className="bg-[#121222] border border-blue-500/20 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active (24h)</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-1.5">{activeTodayCount}</div>
          <div className="text-[10px] text-blue-500/80 mt-0.5">Recent interactions</div>
        </div>
      </div>

      {/* Search, Filters, and Table Container */}
      <div className="bg-[#121222] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
        {/* Toolbar: Search, Role Filter, Page Size */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, @username, or chatId..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#0b0b14] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: `All (${users.length})` },
              { id: 'RESELLER', label: `Resellers (${resellerCount})` },
              { id: 'USER', label: `Standard (${users.length - resellerCount})` },
              { id: 'ADMIN', label: 'Admins' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setRoleFilter(tab.id as any);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  roleFilter === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0b0b14]">
          <table className="w-full text-left text-xs">
            {/* Table Header with Sort Buttons */}
            <thead className="bg-[#141428] text-gray-400 uppercase font-black tracking-wider text-[10px] border-b border-white/5 select-none">
              <tr>
                <th
                  onClick={() => handleSort('fullName')}
                  className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>User / Identity</span>
                    {sortField === 'fullName' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('role')}
                  className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Role</span>
                    {sortField === 'role' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('balance')}
                  className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Wallet Balance</span>
                    {sortField === 'balance' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('totalSpent')}
                  className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors hidden sm:table-cell"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Total Spent</span>
                    {sortField === 'totalSpent' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('lastActive')}
                  className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Last Active</span>
                    {sortField === 'lastActive' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('joinedAt')}
                  className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors hidden lg:table-cell"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Joined Date</span>
                    {sortField === 'joinedAt' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>

                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-white/5">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
                    <div className="font-bold">Loading Bot Users Directory...</div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 space-y-2">
                    <Users className="w-8 h-8 mx-auto opacity-40" />
                    <div className="font-bold text-white">No bot users found</div>
                    <p className="text-xs text-gray-500">Try adjusting your search terms or role filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map(u => {
                  const isToggling = togglingUserId === u.chatId;
                  const isResellerTier = u.isReseller || u.role === 'RESELLER';
                  const isAdminTier = u.role === 'ADMIN';

                  return (
                    <tr
                      key={u.chatId}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* User Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {/* Avatar Circle */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs uppercase flex-shrink-0 ${
                            isAdminTier
                              ? 'bg-gradient-to-br from-amber-500/30 to-purple-500/30 text-amber-300 border border-amber-500/50'
                              : isResellerTier
                              ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-500/50'
                              : 'bg-white/5 text-gray-300 border border-white/10'
                          }`}>
                            {(u.firstName || 'U')[0]}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-white truncate max-w-[140px] sm:max-w-[180px]">
                                {u.fullName || u.firstName || 'Anonymous Gamer'}
                              </span>
                              {isAdminTier && (
                                <span title="Admin"><Crown className="w-3.5 h-3.5 text-amber-400" /></span>
                              )}
                              {isResellerTier && !isAdminTier && (
                                <span title="VIP Reseller"><Star className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" /></span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                              {u.username ? (
                                <span className="text-cyan-400/90 font-mono">@{u.username}</span>
                              ) : (
                                <span className="font-mono text-gray-500">ID: {u.chatId}</span>
                              )}
                              <span className="text-gray-600 hidden sm:inline">•</span>
                              <span className="text-gray-500 font-mono hidden sm:inline">{u.userId}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-3.5">
                        {isAdminTier ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-purple-500/20 to-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider inline-flex items-center gap-1">
                            <Shield className="w-3 h-3 text-amber-400" /> Admin
                          </span>
                        ) : isResellerTier ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider inline-flex items-center gap-1">
                            <Star className="w-3 h-3 fill-cyan-300" /> VIP Reseller
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/5 text-gray-400 border border-white/10 uppercase tracking-wider">
                            Standard User
                          </span>
                        )}
                      </td>

                      {/* Balance & Quick Edit */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-black text-sm ${
                            u.balance > 0 ? 'text-emerald-400' : 'text-gray-400'
                          }`}>
                            ₹{u.balance.toLocaleString()}
                          </span>
                          <button
                            onClick={() => setBalanceModalUser(u)}
                            className="p-1 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="Adjust wallet balance"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Total Spent */}
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className="font-mono text-gray-300">
                          ₹{(u.totalSpent || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Last Active */}
                      <td className="px-4 py-3.5">
                        <div className="text-gray-300 font-medium" title={formatExactDate(u.lastActive)}>
                          {formatRelativeTime(u.lastActive)}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {u.interactionCount || 1} hits
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-gray-400 font-mono text-[11px]">
                          {formatExactDate(u.joinedAt)}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Reseller Button */}
                          <button
                            onClick={() => handleToggleReseller(u)}
                            disabled={isToggling || isAdminTier}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-40 ${
                              isResellerTier
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}
                            title={
                              isAdminTier
                                ? 'Admin role is managed via Master Security'
                                : isResellerTier
                                ? 'Demote to Standard User'
                                : 'Promote to VIP Reseller'
                            }
                          >
                            {isToggling ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : isResellerTier ? (
                              <UserX className="w-3 h-3 text-amber-400" />
                            ) : (
                              <UserCheck className="w-3 h-3 text-cyan-400" />
                            )}
                            <span className="hidden md:inline">
                              {isResellerTier ? 'Revoke Reseller' : 'Make Reseller'}
                            </span>
                          </button>

                          {/* Direct Message */}
                          <button
                            onClick={() => {
                              setMessageModalUser(u);
                              setDirectMessageText('');
                            }}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
                            title={`Send direct Telegram message to ${u.firstName}`}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Summary Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-gray-400">
            Showing <span className="text-white font-bold">{sortedUsers.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="text-white font-bold">{Math.min(page * pageSize, sortedUsers.length)}</span> of{' '}
            <span className="text-white font-bold">{sortedUsers.length}</span> filtered users
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-gray-400 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Direct Message via Telegram */}
      {messageModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121226] border border-cyan-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Direct Telegram Message
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    To: <span className="text-white font-bold">{messageModalUser.fullName}</span> (Chat ID: {messageModalUser.chatId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMessageModalUser(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendDirectMessage} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Message Body (HTML formatting supported)
                </label>
                <textarea
                  rows={4}
                  value={directMessageText}
                  onChange={e => setDirectMessageText(e.target.value)}
                  placeholder="Hello! Here is an update regarding your KALAM STORE account or custom discount..."
                  className="w-full bg-[#0b0b14] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMessageModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage || !directMessageText.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-950/40"
                >
                  {sendingMessage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{sendingMessage ? 'Sending...' : 'Send to Telegram'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Wallet Balance */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121226] border border-emerald-500/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Adjust User Balance
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    User: <span className="text-white font-bold">{balanceModalUser.fullName}</span> (Current: ₹{balanceModalUser.balance})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBalanceModalUser(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBalance} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Adjustment Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 500 (or -100 to deduct)"
                  value={balanceAmount}
                  onChange={e => setBalanceAmount(e.target.value)}
                  className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                  required
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Positive values add to wallet; negative values deduct.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Audit Reason / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manual UPI Payment Credit, VIP Reward"
                  value={balanceReason}
                  onChange={e => setBalanceReason(e.target.value)}
                  className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingBalance || !balanceAmount}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  {updatingBalance ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{updatingBalance ? 'Updating...' : 'Confirm Adjustment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
