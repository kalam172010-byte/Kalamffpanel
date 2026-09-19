import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Server,
  Layers,
  Search,
  Filter,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  Send,
  Key,
  ShieldCheck,
  Cpu,
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Timer,
  CheckCheck,
} from 'lucide-react';
import type { UpstreamLogEntry, UpstreamLogStats } from '../types';

interface UpstreamPerformanceDashboardProps {
  className?: string;
  autoRefreshInterval?: number;
}

export const UpstreamPerformanceDashboard: React.FC<UpstreamPerformanceDashboardProps> = ({
  className = '',
  autoRefreshInterval = 5000,
}) => {
  // State for data
  const [logs, setLogs] = useState<UpstreamLogEntry[]>([]);
  const [stats, setStats] = useState<UpstreamLogStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sampleLimit, setSampleLimit] = useState<number>(30);
  const [refreshInterval, setRefreshInterval] = useState<number>(autoRefreshInterval);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'latency' | 'providers' | 'logs'>('overview');

  // Ping Test States
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingProvider, setPingProvider] = useState<'adminpanels' | 'custom_api2'>('adminpanels');
  const [pingSuccessMsg, setPingSuccessMsg] = useState<string | null>(null);
  const [pingErrorMsg, setPingErrorMsg] = useState<string | null>(null);

  // Inspection Modal/Drawer
  const [selectedLog, setSelectedLog] = useState<UpstreamLogEntry | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Stats and Logs
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/upstream-logs?limit=100`),
        fetch(`/api/admin/upstream-logs/stats`),
      ]);

      if (!logsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch upstream API performance data');
      }

      const logsData = await logsRes.json();
      const statsData = await statsRes.json();

      if (logsData && Array.isArray(logsData.logs)) {
        setLogs(logsData.logs);
      }
      if (statsData) {
        setStats(statsData);
      }
      setError(null);
    } catch (err: any) {
      console.error('[UpstreamDashboard] Fetch error:', err);
      if (!isSilent) setError(err.message || 'Error loading upstream performance metrics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Polling Effect
  useEffect(() => {
    fetchData();

    if (refreshInterval > 0 && isLiveActive) {
      timerRef.current = setInterval(() => {
        fetchData(true);
      }, refreshInterval);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchData, refreshInterval, isLiveActive]);

  // Handle Instant Ping Test
  const handleTriggerPing = async () => {
    setIsPinging(true);
    setPingSuccessMsg(null);
    setPingErrorMsg(null);
    try {
      const res = await fetch('/api/admin/upstream-logs/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: pingProvider,
          action: 'ping_test',
          product: 'FREE_FIRE_DIAGNOSTIC_SAMPLE',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPingSuccessMsg(`✓ Ping successful: ${data.latencyMs || 210}ms (${pingProvider.toUpperCase()})`);
        fetchData(true);
      } else {
        setPingErrorMsg(`Ping completed with error: ${data.error || 'Check provider configuration'}`);
        fetchData(true);
      }
    } catch (err: any) {
      setPingErrorMsg(`Network failed during ping test: ${err.message}`);
    } finally {
      setIsPinging(false);
      setTimeout(() => {
        setPingSuccessMsg(null);
        setPingErrorMsg(null);
      }, 5000);
    }
  };

  // Handle Clear Logs
  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all upstream performance logs? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/upstream-logs/clear', { method: 'POST' });
      if (res.ok) {
        setLogs([]);
        fetchData();
      }
    } catch (err) {
      alert('Failed to clear logs.');
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Provider filter
      if (selectedProvider !== 'all') {
        if (selectedProvider === 'adminpanels' && log.providerType !== 'adminpanels') return false;
        if (selectedProvider === 'custom_api2' && log.providerType !== 'custom_api2') return false;
        if (selectedProvider === 'other' && log.providerType !== 'diagnostic' && log.providerType !== 'other' && log.providerType !== 'product_sync') return false;
      }
      // Status filter
      if (selectedStatusFilter === 'success' && !log.success) return false;
      if (selectedStatusFilter === 'error' && log.success) return false;
      if (selectedStatusFilter === 'delivered' && !log.deliveredKey) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesApi = log.apiName?.toLowerCase().includes(q);
        const matchesContext = log.callerContext?.toLowerCase().includes(q);
        const matchesUrl = log.url?.toLowerCase().includes(q);
        const matchesKey = log.deliveredKey?.toLowerCase().includes(q);
        const matchesError = log.errorMessage?.toLowerCase().includes(q);
        const matchesStatus = String(log.responseStatus).includes(q);
        return matchesApi || matchesContext || matchesUrl || matchesKey || matchesError || matchesStatus;
      }

      return true;
    });
  }, [logs, selectedProvider, selectedStatusFilter, searchQuery]);

  // Derived Performance Metrics
  const metrics = useMemo(() => {
    const total = logs.length;
    if (total === 0) {
      return {
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        p95Latency: 0,
        successRate: 100,
        errorRate: 0,
        deliveredCount: 0,
        todayCount: 0,
      };
    }

    const latencies = logs.map((l) => l.latencyMs || 0).sort((a, b) => a - b);
    const sumLatency = latencies.reduce((acc, curr) => acc + curr, 0);
    const avgLatency = Math.round(sumLatency / total);
    const minLatency = latencies[0] || 0;
    const maxLatency = latencies[latencies.length - 1] || 0;
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Index] || maxLatency;

    const successes = logs.filter((l) => l.success).length;
    const successRate = Math.round((successes / total) * 1000) / 10;
    const errorRate = Math.round(((total - successes) / total) * 1000) / 10;
    const deliveredCount = logs.filter((l) => !!l.deliveredKey).length;

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = logs.filter((l) => l.timestamp?.startsWith(todayStr)).length;

    return {
      avgLatency,
      minLatency,
      maxLatency,
      p95Latency,
      successRate,
      errorRate,
      deliveredCount,
      todayCount,
    };
  }, [logs]);

  // Chart 1: Latency Timeline Data (Chronological for Chart)
  const latencyChartData = useMemo(() => {
    const sliceLogs = [...logs].reverse().slice(-sampleLimit);
    return sliceLogs.map((item, idx) => {
      const timeStr = item.formattedTime ? item.formattedTime.split(',')[1]?.trim() || item.formattedTime : `#${idx + 1}`;
      const shortTime = timeStr.length > 11 ? timeStr.slice(0, 8) : timeStr;
      return {
        index: idx + 1,
        time: shortTime,
        latency: item.latencyMs || 0,
        status: item.responseStatus || (item.success ? 200 : 500),
        success: item.success,
        api: item.apiName || item.providerType,
        context: item.callerContext || 'Request',
        delivered: !!item.deliveredKey,
      };
    });
  }, [logs, sampleLimit]);

  // Chart 2: Provider Breakdown Data
  const providerChartData = useMemo(() => {
    const providerMap: Record<string, { total: number; success: number; failed: number; totalLatency: number }> = {};

    logs.forEach((log) => {
      const name = log.apiName || (log.providerType === 'adminpanels' ? 'AdminPanels.shop' : log.providerType === 'custom_api2' ? 'HK MODZ API' : 'Direct Gateway');
      if (!providerMap[name]) {
        providerMap[name] = { total: 0, success: 0, failed: 0, totalLatency: 0 };
      }
      providerMap[name].total += 1;
      if (log.success) {
        providerMap[name].success += 1;
      } else {
        providerMap[name].failed += 1;
      }
      providerMap[name].totalLatency += log.latencyMs || 0;
    });

    return Object.entries(providerMap).map(([provider, d]) => ({
      provider: provider.length > 18 ? provider.slice(0, 16) + '...' : provider,
      fullProvider: provider,
      success: d.success,
      failed: d.failed,
      total: d.total,
      avgLatency: d.total > 0 ? Math.round(d.totalLatency / d.total) : 0,
      successRate: d.total > 0 ? Math.round((d.success / d.total) * 100) : 100,
    }));
  }, [logs]);

  // Chart 3: HTTP Status Code Distribution
  const statusPieData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    logs.forEach((l) => {
      let code = l.responseStatus ? String(l.responseStatus) : l.success ? '200' : '500';
      if (code === '0' || l.networkError) code = 'Timeout / Net Err';
      statusCounts[code] = (statusCounts[code] || 0) + 1;
    });

    const colors: Record<string, string> = {
      '200': '#10b981', // Emerald
      '201': '#06b6d4', // Cyan
      '400': '#f59e0b', // Amber
      '401': '#fbbf24', // Yellow
      '403': '#f97316', // Orange
      '404': '#ea580c', // Orange-red
      '500': '#ef4444', // Red
      '502': '#f43f5e', // Rose
      'Timeout / Net Err': '#a855f7', // Purple
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status === '200' ? '200 OK' : status,
      value: count,
      color: colors[status] || '#8b5cf6',
    }));
  }, [logs]);

  // Chart 4: Latency Tiers Distribution
  const latencyTiersData = useMemo(() => {
    const tiers = [
      { name: '< 250ms (Ultra)', count: 0, fill: '#10b981' },
      { name: '250-500ms (Fast)', count: 0, fill: '#06b6d4' },
      { name: '500-1000ms (Mid)', count: 0, fill: '#f59e0b' },
      { name: '1000-2000ms (Slow)', count: 0, fill: '#f97316' },
      { name: '> 2000ms (High)', count: 0, fill: '#ef4444' },
    ];

    logs.forEach((l) => {
      const ms = l.latencyMs || 0;
      if (ms < 250) tiers[0].count++;
      else if (ms < 500) tiers[1].count++;
      else if (ms < 1000) tiers[2].count++;
      else if (ms < 2000) tiers[3].count++;
      else tiers[4].count++;
    });

    return tiers;
  }, [logs]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copySectionToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div
      id="upstream-performance-dashboard"
      className={`space-y-4 text-white font-sans ${className}`}
    >
      {/* 1. Header & Live Controller */}
      <div className="bg-[#12121e] border border-white/10 p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                  <span>Upstream API Performance & Latency Analytics</span>
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-bold">
                  <span className={`w-1.5 h-1.5 rounded-full ${isLiveActive ? 'bg-emerald-400 animate-ping' : 'bg-gray-400'}`} />
                  {isLiveActive ? 'LIVE TELEMETRY' : 'PAUSED'}
                </span>
              </div>
              <p className="text-xs text-gray-300 font-medium">
                Real-time latency tracking, HTTP status distribution, and success rates for reseller API endpoints.
              </p>
            </div>
          </div>
        </div>

        {/* Live Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Refresh interval selector */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs">
            <Timer className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={refreshInterval}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRefreshInterval(val);
                setIsLiveActive(val > 0);
              }}
              className="bg-transparent text-gray-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value={2000} className="bg-[#181828] text-white">2s Stream</option>
              <option value={5000} className="bg-[#181828] text-white">5s Live</option>
              <option value={10000} className="bg-[#181828] text-white">10s Interval</option>
              <option value={30000} className="bg-[#181828] text-white">30s Interval</option>
              <option value={0} className="bg-[#181828] text-white">Manual Only</option>
            </select>
          </div>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() => fetchData()}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            title="Refresh Performance Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>

          {/* Export button */}
          <a
            href="/api/admin/upstream-logs/export?format=json"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            title="Export full log data"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Logs</span>
          </a>

          {/* Clear Logs */}
          <button
            type="button"
            onClick={handleClearLogs}
            className="px-2.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            title="Clear all recorded metrics"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Average Latency */}
        <div className="bg-[#12121e] border border-white/10 p-3.5 rounded-xl space-y-1.5 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Latency</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-black font-mono ${
                metrics.avgLatency < 400
                  ? 'text-emerald-400'
                  : metrics.avgLatency < 800
                  ? 'text-yellow-400'
                  : 'text-rose-400'
              }`}
            >
              {metrics.avgLatency}
            </span>
            <span className="text-xs text-gray-400 font-mono">ms</span>
          </div>
          <div className="text-[10px] text-gray-400 flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                metrics.avgLatency < 400 ? 'bg-emerald-400' : 'bg-yellow-400'
              }`}
            />
            {metrics.avgLatency < 400 ? 'Optimal response time' : 'Moderate latency'}
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-[#12121e] border border-white/10 p-3.5 rounded-xl space-y-1.5 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Success Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-black font-mono ${
                metrics.successRate >= 95
                  ? 'text-emerald-400'
                  : metrics.successRate >= 85
                  ? 'text-yellow-400'
                  : 'text-rose-400'
              }`}
            >
              {metrics.successRate}%
            </span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.successRate >= 95 ? 'bg-emerald-400' : 'bg-yellow-400'
              }`}
              style={{ width: `${Math.min(100, metrics.successRate)}%` }}
            />
          </div>
        </div>

        {/* Total Requests */}
        <div className="bg-[#12121e] border border-white/10 p-3.5 rounded-xl space-y-1.5 shadow-md">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Calls</span>
            <Server className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {logs.length}
          </div>
          <div className="text-[10px] text-gray-400">
            Today: <span className="text-white font-bold">{metrics.todayCount}</span> reqs
          </div>
        </div>

        {/* Delivered Keys */}
        <div className="bg-[#12121e] border border-white/10 p-3.5 rounded-xl space-y-1.5 shadow-md">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Keys Delivered</span>
            <Key className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-300">
            {metrics.deliveredCount}
          </div>
          <div className="text-[10px] text-gray-400">
            Via upstream API
          </div>
        </div>

        {/* P95 Latency */}
        <div className="bg-[#12121e] border border-white/10 p-3.5 rounded-xl space-y-1.5 shadow-md">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">P95 / Max</span>
            <Zap className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black font-mono text-purple-300">
              {metrics.p95Latency}
            </span>
            <span className="text-xs text-gray-400 font-mono">ms</span>
          </div>
          <div className="text-[10px] text-gray-400">
            Min: <span className="text-white font-mono">{metrics.minLatency}ms</span> | Max: <span className="text-white font-mono">{metrics.maxLatency}ms</span>
          </div>
        </div>

        {/* Errors & Failures */}
        <div className="bg-[#12121e] border border-white/10 p-3.5 rounded-xl space-y-1.5 shadow-md">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Error Rate</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-black font-mono ${
                metrics.errorRate > 5 ? 'text-rose-400' : 'text-gray-300'
              }`}
            >
              {metrics.errorRate}%
            </span>
          </div>
          <div className="text-[10px] text-gray-400 truncate">
            {stats?.lastError ? `Err: ${stats.lastError.slice(0, 18)}...` : 'Zero errors detected'}
          </div>
        </div>
      </div>

      {/* 3. Instant Diagnostics Ping Bar */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-[#121226] to-blue-950/60 border border-cyan-500/30 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>⚡ Immediate Upstream Latency Ping Test</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 uppercase">
                Diagnostic
              </span>
            </div>
            <p className="text-[11px] text-gray-300">
              Send a test probe to measure real round-trip network response latency and record live graph metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={pingProvider}
            onChange={(e) => setPingProvider(e.target.value as any)}
            className="bg-[#18182c] border border-white/20 text-xs text-gray-200 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-cyan-400"
          >
            <option value="adminpanels">AdminPanels API (Primary)</option>
            <option value="custom_api2">HK MODZ / API #2</option>
          </select>

          <button
            type="button"
            onClick={handleTriggerPing}
            disabled={isPinging}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer transition-all disabled:opacity-60"
          >
            {isPinging ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                <span>Pinging...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-black" />
                <span>Test Ping Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Ping feedback alert */}
      {pingSuccessMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-200 shadow-md animate-fadeIn">
          <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{pingSuccessMsg}</span>
        </div>
      )}
      {pingErrorMsg && (
        <div className="bg-rose-950/80 border border-rose-500/50 p-3 rounded-xl flex items-center gap-2 text-xs text-rose-200 shadow-md animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{pingErrorMsg}</span>
        </div>
      )}

      {/* 4. Navigation View Tabs */}
      <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>📈 Response Time & Latency Timeline</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('providers')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'providers'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>🏢 Provider Comparison & Status Codes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>📡 Request Stream & Inspector ({filteredLogs.length})</span>
        </button>
      </div>

      {/* 5. TAB 1: Real-Time Latency Timeline (Recharts Area/Line Chart) */}
      {(activeTab === 'overview' || activeTab === 'latency') && (
        <div className="space-y-4">
          <div className="bg-[#12121e] border border-white/10 p-4 sm:p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Upstream API Response Latency Trend (ms)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {sampleLimit} SAMPLES
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Chronological millisecond round-trip response duration for key delivery & stock sync operations.
                </p>
              </div>

              {/* Sample Limit Selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-400 font-semibold">View window:</span>
                {[15, 30, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSampleLimit(num)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                      sampleLimit === num
                        ? 'bg-cyan-500 text-black shadow-md'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-72 w-full pt-2">
              {latencyChartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                  <Activity className="w-8 h-8 text-gray-600 animate-pulse" />
                  <p className="text-xs font-semibold">No performance metrics recorded yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={latencyChartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="latencyErrorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                      dataKey="time"
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#ffffff20' }}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: '#ffffff20' }}
                      unit="ms"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#18182c] border border-cyan-400/50 p-3 rounded-xl shadow-2xl space-y-1 text-xs text-white">
                              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1 font-bold">
                                <span className="text-cyan-300">{data.api}</span>
                                <span className={data.success ? 'text-emerald-400' : 'text-rose-400'}>
                                  HTTP {data.status}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3 pt-1">
                                <span className="text-gray-400">Response Time:</span>
                                <span className="font-mono font-bold text-white text-sm">
                                  {data.latency} ms
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-gray-400">Context:</span>
                                <span className="text-gray-300 font-medium truncate max-w-[150px]">
                                  {data.context}
                                </span>
                              </div>
                              {data.delivered && (
                                <div className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 mt-1">
                                  <Key className="w-2.5 h-2.5" /> License Key Delivered
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* Reference Benchmarks */}
                    <ReferenceLine
                      y={400}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      label={{
                        value: 'SLA Benchmark (400ms)',
                        fill: '#10b981',
                        fontSize: 10,
                        position: 'insideTopRight',
                      }}
                    />
                    <ReferenceLine
                      y={1000}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{
                        value: 'High Latency (1000ms)',
                        fill: '#ef4444',
                        fontSize: 10,
                        position: 'insideTopRight',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="latency"
                      stroke="#00e5ff"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#latencyGradient)"
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle
                            key={props.key || `${cx}-${cy}`}
                            cx={cx}
                            cy={cy}
                            r={payload.success ? 3.5 : 5}
                            fill={payload.success ? '#00e5ff' : '#ef4444'}
                            stroke={payload.success ? '#0a0a14' : '#fff'}
                            strokeWidth={1.5}
                          />
                        );
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Performance Tier Histogram & Insight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/10">
              {/* Latency Tiers Distribution */}
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                  <span>⚡ Latency Distribution Tiers</span>
                  <span className="text-[10px] text-gray-400 font-mono">Total {logs.length} reqs</span>
                </div>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={latencyTiersData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 9 }} tickLine={false} />
                      <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 9 }} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18182c', borderColor: '#4ade80', borderRadius: '8px', fontSize: '11px' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {latencyTiersData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Health Analysis Card */}
              <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col justify-between space-y-2">
                <div className="text-xs font-bold text-gray-300 flex items-center justify-between">
                  <span>🛡️ SLA Compliance & System Health</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-black ${
                      metrics.avgLatency < 500 && metrics.successRate > 95
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                    }`}
                  >
                    {metrics.avgLatency < 500 && metrics.successRate > 95 ? 'HEALTH: OPTIMAL' : 'HEALTH: MONITOR'}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-gray-300">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400">Fastest recorded response:</span>
                    <span className="font-mono text-emerald-400 font-bold">{metrics.minLatency} ms</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400">95th Percentile (P95):</span>
                    <span className="font-mono text-cyan-300 font-bold">{metrics.p95Latency} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">License delivery reliability:</span>
                    <span className="font-mono text-emerald-300 font-bold">
                      {metrics.successRate}% Success
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-gray-400 bg-white/5 p-2 rounded-lg">
                  💡 Tip: Response times under 400ms guarantee instant sub-second key dispatch for website buyers.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 2: Providers Breakdown & HTTP Status Codes */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Provider Performance Bar Chart */}
          <div className="bg-[#12121e] border border-white/10 p-4 sm:p-5 rounded-2xl shadow-xl space-y-3">
            <div className="border-b border-white/10 pb-2">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>Reseller Provider Success vs Failure</span>
              </h3>
              <p className="text-xs text-gray-400">
                Comparison of total requests and successful deliveries across configured API providers.
              </p>
            </div>

            <div className="h-64 w-full">
              {providerChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">
                  No provider data recorded.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={providerChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="provider" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 10 }} tickLine={false} />
                    <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 10 }} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-[#18182c] border border-cyan-400/50 p-3 rounded-xl shadow-xl text-xs space-y-1 text-white">
                              <div className="font-bold text-cyan-300 border-b border-white/10 pb-1">{d.fullProvider}</div>
                              <div className="flex justify-between gap-4"><span className="text-gray-400">Successful:</span><span className="font-bold text-emerald-400">{d.success}</span></div>
                              <div className="flex justify-between gap-4"><span className="text-gray-400">Failed:</span><span className="font-bold text-rose-400">{d.failed}</span></div>
                              <div className="flex justify-between gap-4"><span className="text-gray-400">Success Rate:</span><span className="font-bold text-white">{d.successRate}%</span></div>
                              <div className="flex justify-between gap-4"><span className="text-gray-400">Avg Latency:</span><span className="font-bold text-yellow-400 font-mono">{d.avgLatency}ms</span></div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="success" name="Successful Requests" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="failed" name="Failed / Network Error" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Provider stats list */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              {providerChartData.map((p) => (
                <div key={p.fullProvider} className="flex items-center justify-between p-2 rounded-xl bg-white/5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="font-bold text-white">{p.fullProvider}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-emerald-400 font-bold">{p.successRate}% OK</span>
                    <span className="text-gray-400">{p.avgLatency} ms</span>
                    <span className="text-gray-300 font-bold">({p.total} calls)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HTTP Status Code Donut Chart */}
          <div className="bg-[#12121e] border border-white/10 p-4 sm:p-5 rounded-2xl shadow-xl space-y-3">
            <div className="border-b border-white/10 pb-2">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>HTTP Response Status Codes Distribution</span>
              </h3>
              <p className="text-xs text-gray-400">
                Breakdown of 200 OK successes vs 400 bad requests and 500 server errors.
              </p>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              {statusPieData.length === 0 ? (
                <div className="text-xs text-gray-500">No status codes logged.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          const total = logs.length || 1;
                          const pct = Math.round((d.value / total) * 100);
                          return (
                            <div className="bg-[#18182c] border border-white/20 p-2.5 rounded-xl text-xs space-y-0.5 text-white">
                              <div className="font-bold" style={{ color: d.color }}>{d.name}</div>
                              <div>Count: <span className="font-bold">{d.value}</span> ({pct}%)</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Status explanation */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-0.5">
                <div className="font-bold text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 200 / 201 OK
                </div>
                <div className="text-[11px] text-gray-300">Keys successfully generated and delivered.</div>
              </div>
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-0.5">
                <div className="font-bold text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> 4xx / 5xx / Timeouts
                </div>
                <div className="text-[11px] text-gray-300">Invalid parameters, balance deficit, or provider downtime.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 3: Request Stream Table & Inspector */}
      {activeTab === 'logs' && (
        <div className="bg-[#12121e] border border-white/10 p-4 sm:p-5 rounded-2xl shadow-xl space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search API, status, key, url..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 w-48 sm:w-60"
                />
              </div>

              {/* Provider Filter */}
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="bg-[#18182c] border border-white/10 text-xs text-gray-300 rounded-xl px-2.5 py-1.5 font-semibold focus:outline-none"
              >
                <option value="all">All Providers</option>
                <option value="adminpanels">AdminPanels.shop</option>
                <option value="custom_api2">HK MODZ / API #2</option>
                <option value="other">Diagnostics & Other</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-[#18182c] border border-white/10 text-xs text-gray-300 rounded-xl px-2.5 py-1.5 font-semibold focus:outline-none"
              >
                <option value="all">All Outcomes</option>
                <option value="success">Success (200)</option>
                <option value="error">Errors & Retries</option>
                <option value="delivered">Key Delivered Only</option>
              </select>
            </div>

            <div className="text-xs font-mono text-gray-400">
              Showing <span className="text-cyan-300 font-bold">{filteredLogs.length}</span> of {logs.length} calls
            </div>
          </div>

          {/* Table of logs */}
          <div className="overflow-x-auto">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-gray-500 space-y-2">
                <Search className="w-8 h-8 mx-auto text-gray-600" />
                <p className="text-xs font-semibold">No upstream API logs match your filter.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 uppercase font-mono text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Provider</th>
                    <th className="py-2.5 px-3">Context & URL</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3">Delivered Key</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.slice(0, 50).map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full ${
                            log.success
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {log.success ? 'HTTP ' + (log.responseStatus || 200) : 'FAIL ' + (log.responseStatus || 500)}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-gray-400 font-mono text-[11px]">
                        {log.formattedTime ? log.formattedTime.split(',')[1]?.trim() || log.formattedTime : log.timestamp?.slice(11, 19)}
                      </td>

                      {/* Provider */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {log.apiName || log.providerType}
                        </span>
                      </td>

                      {/* Context & Endpoint */}
                      <td className="py-2.5 px-3">
                        <div className="space-y-0.5 max-w-xs truncate">
                          <div className="text-gray-300 font-semibold">{log.callerContext}</div>
                          <div className="text-[10px] text-gray-500 font-mono truncate">{log.url}</div>
                        </div>
                      </td>

                      {/* Latency */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            log.latencyMs < 400
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : log.latencyMs < 900
                              ? 'text-yellow-400 bg-yellow-500/10'
                              : 'text-rose-400 bg-rose-500/10'
                          }`}
                        >
                          {log.latencyMs} ms
                        </span>
                      </td>

                      {/* Key Delivered */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                        {log.deliveredKey ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 flex items-center gap-1 w-max">
                            <Key className="w-3 h-3 text-emerald-400" />
                            {log.deliveredKey.slice(0, 14)}...
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>

                      {/* Inspect Action */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-semibold text-[11px] border border-cyan-500/30 cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 8. Log Inspection Modal / Details Drawer */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-[#121224] border border-cyan-500/40 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>Upstream Call Inspector</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        selectedLog.success
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      HTTP {selectedLog.responseStatus} • {selectedLog.latencyMs}ms
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    ID: {selectedLog.id} • {selectedLog.formattedTime || selectedLog.timestamp}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                <div className="text-gray-400 text-[10px] uppercase font-bold">API Provider</div>
                <div className="font-bold text-white truncate">{selectedLog.apiName}</div>
              </div>
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                <div className="text-gray-400 text-[10px] uppercase font-bold">Method & Latency</div>
                <div className="font-bold font-mono text-cyan-300">
                  {selectedLog.method} • {selectedLog.latencyMs}ms
                </div>
              </div>
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                <div className="text-gray-400 text-[10px] uppercase font-bold">Caller Context</div>
                <div className="font-bold text-white truncate">{selectedLog.callerContext}</div>
              </div>
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                <div className="text-gray-400 text-[10px] uppercase font-bold">Attempts / Retries</div>
                <div className="font-bold font-mono text-purple-300">
                  {selectedLog.attempts} of {selectedLog.maxRetries || 3}
                </div>
              </div>
            </div>

            {/* Key Delivered Section */}
            {selectedLog.deliveredKey && (
              <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" /> Dispatched VIP License Key
                  </div>
                  <div className="font-mono text-sm font-black text-emerald-100 select-all">
                    {selectedLog.deliveredKey}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedLog.deliveredKey!, 'deliveredKey')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'deliveredKey' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'deliveredKey' ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
            )}

            {/* URL Endpoint */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase">Target Endpoint URL</div>
              <div className="bg-black/50 p-2 rounded-xl border border-white/10 font-mono text-xs text-gray-200 break-all select-all">
                {selectedLog.url}
              </div>
            </div>

            {/* Request Body */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Outgoing Request Payload</span>
                <button
                  type="button"
                  onClick={() => copySectionToClipboard(selectedLog.requestBodyRaw, 'req')}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedSection === 'req' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === 'req' ? 'Copied' : 'Copy Request'}</span>
                </button>
              </div>
              <pre className="bg-black/60 p-3 rounded-xl border border-white/10 font-mono text-[11px] text-cyan-200 overflow-x-auto max-h-40 select-all">
                {selectedLog.requestBodyRaw || 'None (GET Request)'}
              </pre>
            </div>

            {/* Response Body */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Upstream Response Payload</span>
                <button
                  type="button"
                  onClick={() => copySectionToClipboard(selectedLog.responseBodyRaw, 'res')}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedSection === 'res' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === 'res' ? 'Copied' : 'Copy Response'}</span>
                </button>
              </div>
              <pre
                className={`p-3 rounded-xl border font-mono text-[11px] overflow-x-auto max-h-48 select-all ${
                  selectedLog.success
                    ? 'bg-black/60 border-white/10 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                }`}
              >
                {selectedLog.responseBodyRaw || 'Empty response'}
              </pre>
            </div>

            {/* Error Message if any */}
            {selectedLog.errorMessage && (
              <div className="bg-rose-950/60 border border-rose-500/40 p-3 rounded-xl text-xs text-rose-200 space-y-1">
                <div className="font-bold flex items-center gap-1 text-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5" /> Error Diagnostic
                </div>
                <div className="font-mono">{selectedLog.errorMessage}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default UpstreamPerformanceDashboard;
