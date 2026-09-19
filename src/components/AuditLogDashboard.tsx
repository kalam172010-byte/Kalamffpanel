import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  ShieldAlert,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Filter,
  PlusCircle,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  User,
  Wallet,
  Star,
  ShoppingCart,
  Shield,
  Layers,
  Calendar,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  Trash2
} from 'lucide-react';

export type AuditCategory =
  | 'ALL'
  | 'BALANCE_ADJUSTMENT'
  | 'RESELLER_UPGRADE'
  | 'KEY_PURCHASE'
  | 'DEPOSIT_CREDIT'
  | 'SECURITY_EVENT'
  | 'SYSTEM_CONFIG';

export type AuditSeverity = 'ALL' | 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export interface AuditTargetUser {
  userId?: string;
  chatId?: number | string;
  username?: string;
  fullName?: string;
  email?: string;
}

export interface AuditLogEvent {
  id: string;
  timestamp: number;
  category: string;
  action: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  actor: string;
  actorType: 'ADMIN' | 'SYSTEM' | 'USER';
  targetUser?: AuditTargetUser;
  summary: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

interface AuditStats {
  totalEvents: number;
  eventsLast24h: number;
  balanceAdjustmentsCount: number;
  totalBalanceVolume: number;
  resellerUpgradesCount: number;
  keyPurchasesCount: number;
  totalPurchasesVolume: number;
  depositsCount: number;
  totalDepositsVolume: number;
  categoryCounts: Record<string, number>;
}

export const AuditLogDashboard: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEvent[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory>('ALL');
  const [severityFilter, setSeverityFilter] = useState<AuditSeverity>('ALL');
  const [actorTypeFilter, setActorTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  // Sorting
  const [sortField, setSortField] = useState<'timestamp' | 'category' | 'severity' | 'actor'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Selected event for detail drawer
  const [selectedEvent, setSelectedEvent] = useState<AuditLogEvent | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Manual Log Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteCategory, setNoteCategory] = useState<string>('SECURITY_EVENT');
  const [noteSummary, setNoteSummary] = useState('');
  const [noteTarget, setNoteTarget] = useState('');
  const [noteDetails, setNoteDetails] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLogs = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      let startDate: number | undefined = undefined;
      const now = Date.now();
      if (dateRange === 'TODAY') {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        startDate = d.getTime();
      } else if (dateRange === 'WEEK') {
        startDate = now - 7 * 24 * 60 * 60 * 1000;
      } else if (dateRange === 'MONTH') {
        startDate = now - 30 * 24 * 60 * 60 * 1000;
      }

      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (severityFilter !== 'ALL') params.append('severity', severityFilter);
      if (actorTypeFilter !== 'ALL') params.append('actorType', actorTypeFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (startDate) params.append('startDate', String(startDate));
      params.append('page', String(page));
      params.append('limit', String(pageSize));
      params.append('sortDirection', sortDirection);

      const [logsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/audit-logs?${params.toString()}`),
        fetch('/api/admin/audit-logs/stats'),
      ]);

      const logsData = await logsRes.json();
      const statsData = await statsRes.json();

      if (logsData.success) {
        setLogs(logsData.logs || []);
        setTotalCount(logsData.total || 0);
        setTotalPages(logsData.totalPages || 1);
      }

      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to fetch audit records.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [categoryFilter, severityFilter, actorTypeFilter, dateRange, page, pageSize, sortDirection]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(true);
  };

  const handleSort = (field: 'timestamp' | 'category' | 'severity' | 'actor') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setPage(1);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateManualNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteSummary.trim()) return;

    try {
      setSubmittingNote(true);
      let parsedDetails = {};
      if (noteDetails.trim()) {
        try {
          parsedDetails = JSON.parse(noteDetails);
        } catch {
          parsedDetails = { rawText: noteDetails.trim() };
        }
      }

      const res = await fetch('/api/admin/audit-logs/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: noteCategory,
          action: 'MANUAL_ADMIN_NOTE',
          severity: 'INFO',
          actor: 'Admin Reviewer',
          targetUser: noteTarget.trim() ? { username: noteTarget.trim(), fullName: noteTarget.trim() } : undefined,
          summary: noteSummary.trim(),
          details: parsedDetails,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Administrative audit note recorded successfully.' });
        setIsNoteModalOpen(false);
        setNoteSummary('');
        setNoteTarget('');
        setNoteDetails('');
        fetchLogs(true);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to record audit note.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving audit note.' });
    } finally {
      setSubmittingNote(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/admin/audit-logs/export', '_blank');
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kalam_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'BALANCE_ADJUSTMENT':
        return {
          icon: <Wallet className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Balance Adjust',
          className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        };
      case 'RESELLER_UPGRADE':
        return {
          icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />,
          label: 'Reseller Role',
          className: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        };
      case 'KEY_PURCHASE':
        return {
          icon: <ShoppingCart className="w-3.5 h-3.5 text-cyan-400" />,
          label: 'Key Purchase',
          className: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
        };
      case 'DEPOSIT_CREDIT':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />,
          label: 'UPI Deposit',
          className: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
        };
      case 'SECURITY_EVENT':
        return {
          icon: <Shield className="w-3.5 h-3.5 text-purple-400" />,
          label: 'Security Event',
          className: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
        };
      case 'SYSTEM_CONFIG':
        return {
          icon: <Layers className="w-3.5 h-3.5 text-rose-400" />,
          label: 'System Config',
          className: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
        };
      default:
        return {
          icon: <Activity className="w-3.5 h-3.5 text-gray-400" />,
          label: category,
          className: 'bg-white/5 text-gray-300 border-white/10',
        };
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
          label: 'Critical',
          className: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        };
      case 'WARNING':
        return {
          dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
          label: 'Warning',
          className: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        };
      case 'SUCCESS':
        return {
          dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
          label: 'Success',
          className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        };
      default:
        return {
          dot: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]',
          label: 'Info',
          className: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        };
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatExactDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
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
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-wide">
                  Administrative Audit & Accountability Log
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {totalCount} Total Records
                </span>
              </div>
              <p className="text-gray-400 text-xs mt-1">
                Immutable record of user balance adjustments, VIP reseller status transitions, key purchase history, and administrative actions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-950/40"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record Audit Note</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Download CSV report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => fetchLogs(true)}
              disabled={refreshing}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Aggregate Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#121222] border border-white/5 p-4 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Audit Events</span>
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1.5">{stats.totalEvents}</div>
            <div className="text-[10px] text-cyan-400 mt-0.5">+{stats.eventsLast24h} in last 24h</div>
          </div>

          <div className="bg-[#121222] border border-emerald-500/20 p-4 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Balance Adjustments</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1.5">
              {stats.balanceAdjustmentsCount}
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">
              Net: ₹{stats.totalBalanceVolume.toLocaleString()}
            </div>
          </div>

          <div className="bg-[#121222] border border-amber-500/20 p-4 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Reseller Changes</span>
              <Star className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1.5">
              {stats.resellerUpgradesCount}
            </div>
            <div className="text-[10px] text-amber-500/80 mt-0.5">VIP role promotions & downgrades</div>
          </div>

          <div className="bg-[#121222] border border-blue-500/20 p-4 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Key Purchases</span>
              <ShoppingCart className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400 mt-1.5">
              {stats.keyPurchasesCount}
            </div>
            <div className="text-[10px] text-blue-500/80 mt-0.5">
              Volume: ₹{stats.totalPurchasesVolume.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Main Filter & Table Card */}
      <div className="bg-[#121222] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
        {/* Category Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/5">
          {[
            { id: 'ALL', label: 'All Audit Records' },
            { id: 'BALANCE_ADJUSTMENT', label: '💰 Balance Adjustments' },
            { id: 'RESELLER_UPGRADE', label: '⭐ Reseller Upgrades' },
            { id: 'KEY_PURCHASE', label: '🛒 Key Purchases' },
            { id: 'DEPOSIT_CREDIT', label: '📥 UPI Deposits' },
            { id: 'SECURITY_EVENT', label: '🛡️ Security Events' },
            { id: 'SYSTEM_CONFIG', label: '⚙️ System Config' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setCategoryFilter(tab.id as any);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Secondary Filter Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, order ID, product, reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b0b14] border border-white/10 rounded-xl pl-10 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={e => {
                setSeverityFilter(e.target.value as any);
                setPage(1);
              }}
              className="bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">🚨 Critical</option>
              <option value="WARNING">⚠️ Warning</option>
              <option value="SUCCESS">✅ Success</option>
              <option value="INFO">ℹ️ Info</option>
            </select>

            {/* Actor Filter */}
            <select
              value={actorTypeFilter}
              onChange={e => {
                setActorTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
            >
              <option value="ALL">All Actors</option>
              <option value="ADMIN">👑 Admin Actions</option>
              <option value="SYSTEM">🤖 System Automated</option>
              <option value="USER">👤 User Actions</option>
            </select>

            {/* Date Range Shortcuts */}
            <div className="flex items-center bg-[#0b0b14] border border-white/10 rounded-xl p-0.5">
              {[
                { id: 'ALL', label: 'All Time' },
                { id: 'TODAY', label: 'Today' },
                { id: 'WEEK', label: '7D' },
                { id: 'MONTH', label: '30D' },
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => {
                    setDateRange(d.id as any);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    dateRange === d.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0b0b14]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141428] text-gray-400 uppercase font-black tracking-wider text-[10px] border-b border-white/5 select-none">
              <tr>
                <th
                  onClick={() => handleSort('timestamp')}
                  className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Timestamp</span>
                    {sortField === 'timestamp' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>

                <th className="px-4 py-3.5">Category & Action</th>
                <th className="px-4 py-3.5 hidden sm:table-cell">Actor</th>
                <th className="px-4 py-3.5">Target Customer</th>
                <th className="px-4 py-3.5">Summary & Financial Details</th>
                <th className="px-4 py-3.5 text-right">Details</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-gray-400 space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
                    <div className="font-bold">Loading Audit Log Trail...</div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-gray-400 space-y-2">
                    <ShieldAlert className="w-8 h-8 mx-auto opacity-40" />
                    <div className="font-bold text-white">No audit records match your filters</div>
                    <p className="text-xs text-gray-500">Try clearing your search terms or expanding the date range.</p>
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const cat = getCategoryBadge(log.category);
                  const sev = getSeverityBadge(log.severity);
                  const isExpanded = expandedRowId === log.id;
                  const isCredit = log.category === 'BALANCE_ADJUSTMENT' && (log.details?.amount > 0 || log.action === 'MANUAL_BALANCE_CREDIT');
                  const isDebit = log.category === 'BALANCE_ADJUSTMENT' && (log.details?.amount < 0 || log.action === 'MANUAL_BALANCE_DEBIT');

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${
                          isExpanded ? 'bg-white/[0.03]' : ''
                        }`}
                        onClick={() => setExpandedRowId(isExpanded ? null : log.id)}
                      >
                        {/* Timestamp */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${sev.dot} flex-shrink-0`} />
                            <div>
                              <div className="text-gray-300 font-semibold" title={formatExactDate(log.timestamp)}>
                                {formatRelativeTime(log.timestamp)}
                              </div>
                              <div className="text-[10px] text-gray-500 font-mono">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category & Action Badge */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border flex items-center gap-1 uppercase tracking-wider ${cat.className}`}>
                              {cat.icon}
                              <span>{cat.label}</span>
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono hidden md:inline">
                              {log.action}
                            </span>
                          </div>
                        </td>

                        {/* Actor */}
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.actorType === 'ADMIN'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : log.actorType === 'SYSTEM'
                              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                              : 'bg-white/5 text-gray-300 border border-white/10'
                          }`}>
                            {log.actor}
                          </span>
                        </td>

                        {/* Target User */}
                        <td className="px-4 py-3.5">
                          {log.targetUser ? (
                            <div>
                              <div className="font-bold text-white truncate max-w-[150px]">
                                {log.targetUser.fullName || log.targetUser.username || log.targetUser.userId || 'User'}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                                {log.targetUser.username && <span>@{log.targetUser.username}</span>}
                                {log.targetUser.chatId && <span>ID: {log.targetUser.chatId}</span>}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Summary & Impact */}
                        <td className="px-4 py-3.5">
                          <div className="text-gray-200 text-xs">
                            {log.summary}
                          </div>
                          {log.details && (
                            <div className="flex items-center gap-2 mt-1 text-[11px] flex-wrap">
                              {typeof log.details.amount === 'number' && (
                                <span className={`font-mono font-bold ${
                                  isCredit ? 'text-emerald-400' : isDebit ? 'text-rose-400' : 'text-cyan-400'
                                }`}>
                                  {log.details.amount > 0 ? `+₹${log.details.amount}` : `₹${log.details.amount}`}
                                </span>
                              )}
                              {log.details.amountPaid && (
                                <span className="font-mono font-bold text-cyan-400">
                                  ₹{log.details.amountPaid}
                                </span>
                              )}
                              {log.details.orderId && (
                                <span className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-[10px] text-gray-400">
                                  Ref: {log.details.orderId}
                                </span>
                              )}
                              {log.details.reason && (
                                <span className="text-gray-500 text-[10px] italic truncate max-w-[180px]">
                                  "{log.details.reason}"
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedEvent(log);
                            }}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-300 border border-white/10 transition-colors"
                            title="Inspect full audit details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Row Preview */}
                      {isExpanded && (
                        <tr className="bg-[#0d0d1a] border-y border-white/5">
                          <td colSpan={6} className="p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                                <Info className="w-4 h-4 text-cyan-400" />
                                <span>Event ID: <span className="font-mono text-cyan-300">{log.id}</span></span>
                              </div>
                              <button
                                onClick={() => handleCopy(JSON.stringify(log, null, 2), log.id)}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-mono flex items-center gap-1 transition-colors"
                              >
                                {copiedKey === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedKey === log.id ? 'Copied' : 'Copy JSON'}</span>
                              </button>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                              {/* Metadata */}
                              <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1.5">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Metadata</span>
                                <div><span className="text-gray-400">Timestamp:</span> <span className="text-white font-mono">{formatExactDate(log.timestamp)}</span></div>
                                <div><span className="text-gray-400">Actor:</span> <span className="text-white font-bold">{log.actor}</span> ({log.actorType})</div>
                                {log.ipAddress && <div><span className="text-gray-400">IP Origin:</span> <span className="text-cyan-400 font-mono">{log.ipAddress}</span></div>}
                              </div>

                              {/* Target User */}
                              <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1.5">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Target User Information</span>
                                {log.targetUser ? (
                                  <>
                                    <div><span className="text-gray-400">Name:</span> <span className="text-white font-bold">{log.targetUser.fullName || 'N/A'}</span></div>
                                    <div><span className="text-gray-400">Telegram:</span> <span className="text-cyan-400 font-mono">@{log.targetUser.username || 'N/A'}</span></div>
                                    <div><span className="text-gray-400">Chat / User ID:</span> <span className="text-white font-mono">{log.targetUser.chatId || log.targetUser.userId || 'N/A'}</span></div>
                                  </>
                                ) : (
                                  <div className="text-gray-500 italic">No specific user targeted</div>
                                )}
                              </div>

                              {/* Keys Delivered or Specific Details */}
                              <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1.5">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Action Payload</span>
                                {log.details?.keysDelivered && log.details.keysDelivered.length > 0 ? (
                                  <div className="space-y-1">
                                    <span className="text-gray-400">License Keys:</span>
                                    {log.details.keysDelivered.map((k: string, i: number) => (
                                      <div key={i} className="font-mono text-emerald-400 text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center justify-between">
                                        <span>{k}</span>
                                        <button
                                          onClick={() => handleCopy(k, `k_${i}`)}
                                          className="text-gray-400 hover:text-white"
                                        >
                                          {copiedKey === `k_${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <pre className="text-[10px] text-gray-400 font-mono overflow-x-auto max-h-24">
                                    {JSON.stringify(log.details || {}, null, 2)}
                                  </pre>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-gray-400">
            Showing <span className="text-white font-bold">{logs.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="text-white font-bold">{Math.min(page * pageSize, totalCount)}</span> of{' '}
            <span className="text-white font-bold">{totalCount}</span> filtered audit logs
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-[#0b0b14] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none"
            >
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>

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

      {/* Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121226] border border-cyan-500/40 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Audit Event Inspection
                  </h3>
                  <p className="text-[11px] font-mono text-cyan-400">
                    {selectedEvent.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Summary Box */}
              <div className="bg-[#0b0b14] border border-white/10 p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Summary</span>
                <p className="text-sm font-bold text-white">{selectedEvent.summary}</p>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-gray-400">Timestamp:</span>
                  <span className="text-white font-mono">{formatExactDate(selectedEvent.timestamp)}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-400">Actor:</span>
                  <span className="text-amber-300 font-bold">{selectedEvent.actor}</span>
                </div>
              </div>

              {/* Target User */}
              {selectedEvent.targetUser && (
                <div className="bg-[#0b0b14] border border-white/10 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Target Customer</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-gray-400">Full Name:</span> <span className="text-white font-bold">{selectedEvent.targetUser.fullName || 'N/A'}</span></div>
                    <div><span className="text-gray-400">Username:</span> <span className="text-cyan-400 font-mono">@{selectedEvent.targetUser.username || 'N/A'}</span></div>
                    <div><span className="text-gray-400">Chat ID:</span> <span className="text-white font-mono">{selectedEvent.targetUser.chatId || 'N/A'}</span></div>
                    <div><span className="text-gray-400">User ID:</span> <span className="text-white font-mono">{selectedEvent.targetUser.userId || 'N/A'}</span></div>
                  </div>
                </div>
              )}

              {/* Raw Payload JSON */}
              <div className="bg-[#0b0b14] border border-white/10 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Raw Event Payload</span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedEvent, null, 2), 'modal_json')}
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copiedKey === 'modal_json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'modal_json' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-gray-300 overflow-x-auto bg-black/40 p-3 rounded-lg border border-white/5 max-h-60">
                  {JSON.stringify(selectedEvent, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Audit Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121226] border border-cyan-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Record Manual Audit Note
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Log an administrative event, moderation note, or verification record.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualNote} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Category
                </label>
                <select
                  value={noteCategory}
                  onChange={e => setNoteCategory(e.target.value)}
                  className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="SECURITY_EVENT">🛡️ Security / Admin Action</option>
                  <option value="BALANCE_ADJUSTMENT">💰 Balance / Financial Review</option>
                  <option value="RESELLER_UPGRADE">⭐ Reseller Moderation</option>
                  <option value="SYSTEM_CONFIG">⚙️ System Configuration Note</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Summary Note / Audit Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified payment dispute with user @kalam_gamer"
                  value={noteSummary}
                  onChange={e => setNoteSummary(e.target.value)}
                  className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Target Customer / Identifier (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. @kalam_gamer or Chat ID 8941209"
                  value={noteTarget}
                  onChange={e => setNoteTarget(e.target.value)}
                  className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Additional Details (Optional JSON or text)
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional details, dispute links, or ticket numbers..."
                  value={noteDetails}
                  onChange={e => setNoteDetails(e.target.value)}
                  className="w-full bg-[#0b0b14] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNote || !noteSummary.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-950/40"
                >
                  {submittingNote ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{submittingNote ? 'Saving...' : 'Record Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
