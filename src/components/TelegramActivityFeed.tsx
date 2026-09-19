import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Radio,
  RefreshCw,
  Trash2,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Key,
  CreditCard,
  Sliders,
  Send,
  User,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Shield,
  Bot,
  Hash,
  Terminal,
  Layers,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import type { TelegramActivityEvent, TelegramActivityFeedStats } from '../types';

interface TelegramActivityFeedProps {
  className?: string;
  autoRefreshInterval?: number;
  onSendDirectMessage?: (chatId: string | number, text: string) => void;
}

export const TelegramActivityFeed: React.FC<TelegramActivityFeedProps> = ({
  className = '',
  autoRefreshInterval = 3000,
}) => {
  const [activities, setActivities] = useState<TelegramActivityEvent[]>([]);
  const [stats, setStats] = useState<TelegramActivityFeedStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  
  // Auto-refresh settings
  const [refreshInterval, setRefreshInterval] = useState<number>(autoRefreshInterval);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  
  // UI States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [testSending, setTestSending] = useState<boolean>(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  
  // Direct Message Modal
  const [replyModalOpen, setReplyModalOpen] = useState<boolean>(false);
  const [replyTargetChatId, setReplyTargetChatId] = useState<string>('');
  const [replyTargetName, setReplyTargetName] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  const [replySending, setReplySending] = useState<boolean>(false);
  const [replyResult, setReplyResult] = useState<{ success: boolean; message: string } | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch activities from REST endpoint
  const fetchFeed = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '80');
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/telegram/activity-feed?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load feed`);
      const data = await res.json();
      
      if (data.success) {
        setActivities(data.activities || []);
        if (data.stats) setStats(data.stats);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch activity feed');
      }
    } catch (err: any) {
      console.error('[TelegramActivityFeed] Fetch error:', err);
      setError(err.message || 'Error fetching activity stream');
    } finally {
      setIsLoading(false);
      if (manual) setIsRefreshing(false);
    }
  }, [selectedCategory, searchQuery]);

  // Set up real-time SSE stream or periodic fallback polling
  useEffect(() => {
    let sseActive = false;

    if (isLiveStreaming && typeof EventSource !== 'undefined') {
      try {
        const sse = new EventSource('/api/admin/telegram/activity-stream');
        eventSourceRef.current = sse;

        sse.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'INITIAL_BATCH') {
              if (Array.isArray(data.activities)) setActivities(data.activities);
              if (data.stats) setStats(data.stats);
              setIsLoading(false);
            } else if (data.type === 'NEW_ACTIVITY' && data.event) {
              setActivities((prev) => {
                const exists = prev.some((a) => a.id === data.event.id);
                if (exists) return prev;
                return [data.event, ...prev].slice(0, 150);
              });
              setStats((prev) => {
                if (!prev) return prev;
                const cat = data.event.category;
                return {
                  ...prev,
                  totalEvents: prev.totalEvents + 1,
                  totalMessages: cat === 'message' ? prev.totalMessages + 1 : prev.totalMessages,
                  totalCallbacks: cat === 'callback' ? prev.totalCallbacks + 1 : prev.totalCallbacks,
                  totalKeysDelivered: cat === 'key' ? prev.totalKeysDelivered + 1 : prev.totalKeysDelivered,
                  totalDeposits: cat === 'order' ? prev.totalDeposits + 1 : prev.totalDeposits,
                  totalErrors: data.event.severity === 'error' ? prev.totalErrors + 1 : prev.totalErrors,
                  lastActiveTime: Date.now(),
                };
              });
            }
          } catch (e) {
            console.error('[TelegramActivityFeed] Stream parse error:', e);
          }
        };

        sse.onerror = () => {
          // SSE reconnects automatically, but trigger REST fallback if closed
          fetchFeed(false);
        };

        sseActive = true;
      } catch (err) {
        console.warn('[TelegramActivityFeed] SSE unavailable, falling back to polling:', err);
      }
    }

    // Polling fallback or explicit interval
    if (!sseActive || refreshInterval > 0) {
      fetchFeed(false);
      if (refreshInterval > 0) {
        pollTimerRef.current = setInterval(() => {
          fetchFeed(false);
        }, refreshInterval);
      }
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [fetchFeed, isLiveStreaming, refreshInterval]);

  // Clear feed
  const handleClearFeed = async () => {
    if (!window.confirm('Clear all logged Telegram activities from memory?')) return;
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/admin/telegram/clear-activity-feed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActivities([]);
        fetchFeed(false);
      }
    } catch (e: any) {
      alert('Failed to clear feed: ' + e.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Trigger test diagnostic event
  const handleTriggerTestEvent = async () => {
    setTestSending(true);
    setTestSuccess(null);
    try {
      const res = await fetch('/api/admin/telegram/test-activity-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ details: 'Diagnostic Ping from Live Feed Admin Bar' }),
      });
      const data = await res.json();
      if (data.success) {
        setTestSuccess('Test activity generated!');
        setTimeout(() => setTestSuccess(null), 3000);
        fetchFeed(false);
      }
    } catch (e: any) {
      alert('Test failed: ' + e.message);
    } finally {
      setTestSending(false);
    }
  };

  // Export logs as JSON file
  const handleExportLogs = () => {
    const jsonStr = JSON.stringify(activities, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telegram_bot_activities_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy text to clipboard helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open direct reply modal
  const handleOpenReplyModal = (chatId: string | number, name?: string) => {
    setReplyTargetChatId(String(chatId));
    setReplyTargetName(name || `Chat ${chatId}`);
    setReplyText('');
    setReplyResult(null);
    setReplyModalOpen(true);
  };

  // Send direct reply to user via Telegram
  const handleSendDirectReply = async () => {
    if (!replyText.trim() || !replyTargetChatId) return;
    setReplySending(true);
    setReplyResult(null);
    try {
      const res = await fetch('/api/admin/telegram/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: replyTargetChatId,
          text: replyText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyResult({ success: true, message: `Message delivered to ${replyTargetName}!` });
        setReplyText('');
        fetchFeed(false);
        setTimeout(() => setReplyModalOpen(false), 1800);
      } else {
        setReplyResult({ success: false, message: data.error || 'Delivery failed' });
      }
    } catch (err: any) {
      setReplyResult({ success: false, message: err.message || 'Network error' });
    } finally {
      setReplySending(false);
    }
  };

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    if (selectedCategory !== 'all' && act.category !== selectedCategory) return false;
    if (selectedSeverity !== 'all' && act.severity !== selectedSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSummary = act.summary?.toLowerCase().includes(q);
      const matchDetails = act.details?.toLowerCase().includes(q);
      const matchAction = act.action?.toLowerCase().includes(q);
      const matchUser = act.username?.toLowerCase().includes(q) || act.firstName?.toLowerCase().includes(q);
      const matchChatId = act.chatId && String(act.chatId).includes(q);
      const matchUserId = act.userId && String(act.userId).includes(q);
      return matchSummary || matchDetails || matchAction || matchUser || matchChatId || matchUserId;
    }
    return true;
  });

  const getCategoryBadge = (category: string, type: string) => {
    switch (category) {
      case 'message':
        return {
          icon: <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />,
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
          label: type === 'OUTGOING_MESSAGE' ? 'Bot Response' : 'Incoming Msg',
        };
      case 'callback':
        return {
          icon: <Sliders className="w-3.5 h-3.5 text-purple-400" />,
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          label: 'Button Click',
        };
      case 'key':
        return {
          icon: <Key className="w-3.5 h-3.5 text-emerald-400" />,
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          label: 'Key Delivered',
        };
      case 'order':
        return {
          icon: <CreditCard className="w-3.5 h-3.5 text-amber-400" />,
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          label: 'Deposit / Order',
        };
      case 'error':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          label: 'Error',
        };
      default:
        return {
          icon: <Bot className="w-3.5 h-3.5 text-blue-400" />,
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          label: 'System',
        };
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const elapsed = Math.floor((Date.now() - timestamp) / 1000);
    if (elapsed < 5) return 'Just now';
    if (elapsed < 60) return `${elapsed}s ago`;
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`;
    if (elapsed < 86400) return `${Math.floor(elapsed / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      id="telegram-bot-activity-feed"
      className={`relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#0d0d16]/95 p-4 sm:p-6 shadow-2xl backdrop-blur-xl ${className}`}
    >
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-60 w-60 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-purple-500/10 blur-3xl" />

      {/* Top Header Bar */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.25)] shrink-0">
            <Radio className="h-6 w-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                <span>🤖 Telegram Bot Live Activity & Message Feed</span>
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                LIVE STREAM ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Real-time feed of incoming user messages, button clicks, key dispatches, and diagnostics
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Interval Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/50 px-2.5 py-1 text-xs">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400 text-[11px]">Stream:</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
            >
              <option value={2000} className="bg-zinc-900 text-white">2s (Fast)</option>
              <option value={4000} className="bg-zinc-900 text-white">4s (Normal)</option>
              <option value={10000} className="bg-zinc-900 text-white">10s</option>
              <option value={0} className="bg-zinc-900 text-white">Pause Stream</option>
            </select>
          </div>

          {/* Refresh Now Button */}
          <button
            type="button"
            onClick={() => fetchFeed(true)}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Feed Now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Test Event Button */}
          <button
            type="button"
            onClick={handleTriggerTestEvent}
            disabled={testSending}
            className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Send Test Activity"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">{testSending ? 'Sending...' : 'Test Event'}</span>
          </button>

          {/* Export JSON Button */}
          <button
            type="button"
            onClick={handleExportLogs}
            disabled={activities.length === 0}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
            title="Export Logs as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Clear Feed Button */}
          <button
            type="button"
            onClick={handleClearFeed}
            disabled={activities.length === 0}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
            title="Clear Feed Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Test Success Feedback */}
      {testSuccess && (
        <div className="mt-3 p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400" />
          <span>{testSuccess}</span>
        </div>
      )}

      {/* Real-Time Stats Overview Cards */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="rounded-xl border border-cyan-500/20 bg-black/40 p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Updates</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-xl font-black text-white font-mono">
            {stats?.totalEvents ?? activities.length}
          </div>
          <span className="text-[10px] text-gray-500">Live feed buffered</span>
        </div>

        <div className="rounded-xl border border-sky-500/20 bg-black/40 p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Messages</span>
            <MessageSquare className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-xl font-black text-sky-300 font-mono">
            {stats?.totalMessages ?? activities.filter((a) => a.category === 'message').length}
          </div>
          <span className="text-[10px] text-gray-500">Incoming text & chats</span>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-black/40 p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Buttons</span>
            <Sliders className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-xl font-black text-purple-300 font-mono">
            {stats?.totalCallbacks ?? activities.filter((a) => a.category === 'callback').length}
          </div>
          <span className="text-[10px] text-gray-500">Inline callback clicks</span>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-black/40 p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Dispatched</span>
            <Key className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-black text-emerald-300 font-mono">
            {stats?.totalKeysDelivered ?? activities.filter((a) => a.category === 'key').length}
          </div>
          <span className="text-[10px] text-gray-500">Keys delivered via bot</span>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-black/40 p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Active Users</span>
            <User className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-xl font-black text-amber-300 font-mono">
            {stats?.activeUsersCount ?? new Set(activities.map((a) => a.chatId).filter(Boolean)).size}
          </div>
          <span className="text-[10px] text-gray-500">Connected chat users</span>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-black/40 p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Errors</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className={`mt-2 text-xl font-black font-mono ${(stats?.totalErrors || 0) > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
            {stats?.totalErrors ?? activities.filter((a) => a.severity === 'error').length}
          </div>
          <span className="text-[10px] text-gray-500">Handled gracefully</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-black/30 p-2.5 rounded-xl border border-white/5">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Activities', count: activities.length },
            { id: 'message', label: '📩 Messages', count: activities.filter((a) => a.category === 'message').length },
            { id: 'callback', label: '🔘 Buttons', count: activities.filter((a) => a.category === 'callback').length },
            { id: 'key', label: '🔑 Keys', count: activities.filter((a) => a.category === 'key').length },
            { id: 'order', label: '💳 Deposits', count: activities.filter((a) => a.category === 'order').length },
            { id: 'error', label: '⚠️ Errors', count: activities.filter((a) => a.severity === 'error').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                selectedCategory === tab.id
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  selectedCategory === tab.id ? 'bg-black/20 text-black' : 'bg-black/40 text-gray-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search user, chat, command, text..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white placeholder-gray-500 text-xs focus:border-cyan-400 focus:outline-none font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Activity List Container */}
      <div className="mt-4">
        {isLoading && activities.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-sm font-semibold">Connecting to Telegram live activity stream...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-black/30 border border-dashed border-white/10 flex flex-col items-center justify-center gap-2">
            <MessageSquare className="w-8 h-8 text-gray-600" />
            <p className="text-sm font-bold text-gray-300">No matching activities found</p>
            <p className="text-xs text-gray-500">
              {searchQuery
                ? 'Try a different search keyword or category filter'
                : 'Send a message or click a button in your Telegram bot to see live activities appear!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredActivities.map((act) => {
              const badge = getCategoryBadge(act.category, act.type);
              const isExpanded = expandedEventId === act.id;

              return (
                <div
                  key={act.id}
                  className={`group relative rounded-xl border transition-all p-3.5 sm:p-4 ${
                    act.severity === 'error'
                      ? 'border-rose-500/30 bg-rose-950/20 hover:border-rose-500/50'
                      : act.category === 'key'
                      ? 'border-emerald-500/30 bg-emerald-950/15 hover:border-emerald-500/50'
                      : act.category === 'order'
                      ? 'border-amber-500/30 bg-amber-950/15 hover:border-amber-500/50'
                      : 'border-white/5 bg-black/40 hover:border-cyan-500/30 hover:bg-black/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                    {/* Left: Icon + Type Badge + Summary */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Icon */}
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/50 shrink-0">
                        {badge.icon}
                      </div>

                      {/* Info & Content */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.bg}`}
                          >
                            {badge.label}
                          </span>

                          {act.action && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-mono font-bold text-cyan-300">
                              {act.action}
                            </span>
                          )}

                          {act.chatType && act.chatType !== 'private' && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-mono text-purple-300">
                              {act.chatType}
                            </span>
                          )}

                          <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-gray-500" />
                            {formatRelativeTime(act.timestamp)}
                          </span>
                        </div>

                        {/* Summary & Text */}
                        <p className="text-xs sm:text-sm font-semibold text-white break-words">
                          {act.summary}
                        </p>

                        {/* Details snippet */}
                        {act.details && act.details !== act.summary && (
                          <p className="text-xs text-gray-400 font-mono bg-black/40 p-2 rounded-lg border border-white/5 break-words">
                            {act.details}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: User / Chat Details + Actions */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                      {/* User Badge */}
                      {(act.firstName || act.username || act.chatId) && (
                        <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg border border-white/10 text-xs">
                          <User className="w-3.5 h-3.5 text-cyan-400" />
                          <div className="flex flex-col text-right">
                            <span className="font-bold text-white text-[11px] truncate max-w-[120px]">
                              {act.firstName || act.username || 'User'}
                            </span>
                            {act.chatId && (
                              <button
                                type="button"
                                onClick={() => handleCopy(String(act.chatId), `chat_${act.id}`)}
                                className="text-[10px] text-gray-400 font-mono hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
                                title="Click to copy Chat ID"
                              >
                                <span>ID: {act.chatId}</span>
                                {copiedId === `chat_${act.id}` ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 text-gray-500" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {act.chatId && (
                          <button
                            type="button"
                            onClick={() => handleOpenReplyModal(act.chatId!, act.firstName || act.username)}
                            className="px-2 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Direct Reply to Chat"
                          >
                            <Send className="w-3 h-3" />
                            <span>Reply</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setExpandedEventId(isExpanded ? null : act.id)}
                          className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                          title="View JSON Payload"
                        >
                          <Terminal className="w-3 h-3 text-purple-400" />
                          <span>{isExpanded ? 'Hide JSON' : 'JSON'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded JSON Inspector */}
                  {isExpanded && (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <div className="flex items-center justify-between pb-1 text-[11px] text-gray-400 font-mono">
                        <span>Event Payload & Metadata:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(JSON.stringify(act, null, 2), `json_${act.id}`)}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === `json_${act.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy JSON</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 rounded-lg bg-black/80 border border-white/10 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-48 selection:bg-cyan-500/30">
                        {JSON.stringify(act, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Direct Reply Modal */}
      {replyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-cyan-500/40 bg-[#12121e] p-5 shadow-2xl shadow-cyan-950/40 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Direct Reply to {replyTargetName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setReplyModalOpen(false)}
                className="text-gray-400 hover:text-white text-xs font-bold px-2 py-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                <span>Target Chat ID:</span>
                <span className="font-mono text-cyan-400">{replyTargetChatId}</span>
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply or notification to send to this user via Telegram..."
                rows={4}
                className="w-full p-3 rounded-xl bg-black/70 border border-cyan-500/30 text-white text-xs placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {replyResult && (
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                  replyResult.success
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                {replyResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>{replyResult.message}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReplyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendDirectReply}
                disabled={replySending || !replyText.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-xs font-extrabold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-cyan-500/20"
              >
                <Send className="w-3.5 h-3.5 text-black" />
                <span>{replySending ? 'Sending...' : 'Send to Telegram'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TelegramActivityFeed;
