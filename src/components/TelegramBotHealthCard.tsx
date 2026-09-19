import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Bot,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Radio,
  ExternalLink,
  ShieldCheck,
  Server,
  Users,
  Clock,
  Code2,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Wifi,
  WifiOff,
  Link,
  Save,
  DownloadCloud,
  UploadCloud,
  FileJson,
  Shield
} from 'lucide-react';
import type { TelegramBotHealthStatus, TelegramDiagnosticResult } from '../types';
import { TelegramActivityFeed } from './TelegramActivityFeed';

interface TelegramBotHealthCardProps {
  className?: string;
  autoRefreshIntervalMs?: number;
  onStatusChange?: (status: TelegramBotHealthStatus) => void;
}

export const TelegramBotHealthCard: React.FC<TelegramBotHealthCardProps> = ({
  className = '',
  autoRefreshIntervalMs = 5000,
  onStatusChange,
}) => {
  const [status, setStatus] = useState<TelegramBotHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [isTestingConnectivity, setIsTestingConnectivity] = useState<boolean>(false);
  const [connectivityResult, setConnectivityResult] = useState<{
    success: boolean;
    responseTimeMs: number;
    latencyMs?: number;
    status: string;
    botUsername?: string;
    botFirstName?: string;
    messageSent?: boolean;
    chatId?: string;
    message: string;
    timestamp: string;
  } | null>(null);
  const [isRecycling, setIsRecycling] = useState<boolean>(false);
  const [lastPingResult, setLastPingResult] = useState<TelegramDiagnosticResult | null>(null);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState<boolean>(true);
  const [showRawDetails, setShowRawDetails] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Check Update Telegram Link state
  const [updateTelegramUrl, setUpdateTelegramUrl] = useState<string>('https://t.me/kalamffpanel');
  const [isSavingUrl, setIsSavingUrl] = useState<boolean>(false);
  const [urlSaveSuccess, setUrlSaveSuccess] = useState<boolean>(false);
  const [urlSaveError, setUrlSaveError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Backup & Restore state
  const [isDownloadingBackup, setIsDownloadingBackup] = useState<boolean>(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState<boolean>(false);
  const [backupMessage, setBackupMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fetch initial Telegram bot config including Check Update / APK URL
  const fetchTelegramConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/telegram-config');
      if (res.ok) {
        const data = await res.json();
        if (data.apkDownloadUrl) {
          setUpdateTelegramUrl(data.apkDownloadUrl);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchTelegramConfig();
  }, [fetchTelegramConfig]);

  const handleSaveUpdateUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!updateTelegramUrl.trim()) {
      setUrlSaveError('Please enter a valid Telegram link or channel URL');
      return;
    }

    setIsSavingUrl(true);
    setUrlSaveError(null);
    setUrlSaveSuccess(false);

    try {
      const trimmed = updateTelegramUrl.trim();
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apkDownloadUrl: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save Check Update Telegram link');
      }

      // Also ensure /api/admin/apk-download-url is updated
      await fetch('/api/admin/apk-download-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apkDownloadUrl: trimmed }),
      }).catch(() => {});

      setUrlSaveSuccess(true);
      setTimeout(() => setUrlSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('[TelegramBotHealthCard] Save error:', err);
      setUrlSaveError(err.message || 'Failed to update link');
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleCopyUpdateUrl = () => {
    navigator.clipboard.writeText(updateTelegramUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Download telegram_config.json backup
  const handleDownloadBackup = async () => {
    setIsDownloadingBackup(true);
    setBackupMessage(null);
    try {
      const res = await fetch('/api/admin/telegram/backup');
      if (!res.ok) throw new Error(`Download failed with HTTP ${res.status}`);
      
      const blob = await res.blob();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `telegram_config_${timestamp}.json`;
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setBackupMessage({
        type: 'success',
        text: `✅ telegram_config.json downloaded successfully (${filename})`
      });
      setTimeout(() => setBackupMessage(null), 5000);
    } catch (err: any) {
      console.error('[TelegramBotHealthCard] Backup error:', err);
      setBackupMessage({
        type: 'error',
        text: `❌ Failed to download backup: ${err.message}`
      });
    } finally {
      setIsDownloadingBackup(false);
    }
  };

  // Upload & Restore telegram_config.json backup
  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoringBackup(true);
    setBackupMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          throw new Error('Selected file is not valid JSON. Please upload a valid telegram_config.json backup.');
        }

        const res = await fetch('/api/admin/telegram/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to restore configuration');
        }

        setBackupMessage({
          type: 'success',
          text: `✅ telegram_config.json restored successfully! (Restored ${data.restoredKeysCount || 'all'} settings)`
        });
        setTimeout(() => setBackupMessage(null), 6000);

        // Refresh health and config
        await fetchTelegramConfig();
        await fetchHealthStatus(true);
      } catch (err: any) {
        console.error('[TelegramBotHealthCard] Restore error:', err);
        setBackupMessage({
          type: 'error',
          text: `❌ Restore failed: ${err.message}`
        });
      } finally {
        setIsRestoringBackup(false);
        // Reset file input value so user can upload same file again if needed
        e.target.value = '';
      }
    };

    reader.onerror = () => {
      setIsRestoringBackup(false);
      setBackupMessage({
        type: 'error',
        text: '❌ Could not read the selected backup file.'
      });
    };

    reader.readAsText(file);
  };

  // Fetch bot health telemetry from backend
  const fetchHealthStatus = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/telegram-health');
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data: TelegramBotHealthStatus = await res.json();
      setStatus(data);
      setLastRefreshedAt(new Date());
      if (onStatusChange) {
        onStatusChange(data);
      }
    } catch (err: any) {
      console.error('[TelegramBotHealthCard] Error fetching status:', err);
      setErrorMessage(err.message || 'Failed to fetch Telegram bot health');
    } finally {
      setIsLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, [onStatusChange]);

  // Initial fetch and auto-refresh timer
  useEffect(() => {
    fetchHealthStatus(false);

    if (!isAutoRefreshEnabled) return;
    const interval = setInterval(() => {
      fetchHealthStatus(false);
    }, autoRefreshIntervalMs);

    return () => clearInterval(interval);
  }, [fetchHealthStatus, isAutoRefreshEnabled, autoRefreshIntervalMs]);

  // Execute diagnostic test ping
  const handleDiagnosticPing = async () => {
    setIsPinging(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/telegram-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data: TelegramDiagnosticResult = await res.json();
      setLastPingResult(data);
      if (data.status) {
        setStatus(data.status);
      }
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.error('[TelegramBotHealthCard] Ping error:', err);
      setErrorMessage(err.message || 'Diagnostic ping failed');
    } finally {
      setIsPinging(false);
    }
  };

  // Execute active connectivity test alert
  const handleTestConnectivityAlert = async () => {
    setIsTestingConnectivity(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/telegram/test-connectivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setConnectivityResult(data);
      if (data.status) {
        await fetchHealthStatus(false);
      }
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.error('[TelegramBotHealthCard] Connectivity alert error:', err);
      setErrorMessage(err.message || 'Connectivity test alert failed');
    } finally {
      setIsTestingConnectivity(false);
    }
  };

  // Recycle and restart polling socket
  const handleRecyclePolling = async () => {
    setIsRecycling(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/telegram-restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.status) {
        setStatus(data.status);
      }
      await fetchHealthStatus(false);
    } catch (err: any) {
      console.error('[TelegramBotHealthCard] Restart error:', err);
      setErrorMessage(err.message || 'Failed to restart polling engine');
    } finally {
      setIsRecycling(false);
    }
  };

  const handleCopyRaw = () => {
    const payload = JSON.stringify({ status, lastPingResult }, null, 2);
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHealthy = status ? status.isHealthy : false;
  const msSinceLast = status ? status.msSinceLastPoll : 0;
  const isLagging = msSinceLast > 25000 && !status?.isWebhookActive;

  return (
    <div
      id="telegram-bot-health-card"
      className={`relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/90 p-5 md:p-6 shadow-2xl backdrop-blur-xl ${className}`}
    >
      {/* Background ambient glow */}
      <div
        className={`pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full blur-3xl opacity-20 transition-all duration-700 ${
          isHealthy && !isLagging
            ? 'bg-emerald-500'
            : isLagging
            ? 'bg-amber-500'
            : 'bg-rose-500'
        }`}
      />

      {/* Header Section */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-purple-600/10 text-pink-400 shadow-inner">
            <Bot className="h-6 w-6 text-pink-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-bold tracking-tight text-white">
                Telegram Bot Remote Hub
              </h3>
              {status?.botUsername && (
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400">
                  @{status.botUsername.replace('@', '')}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Live server-side socket health, poll latency & real-time webhook status
            </p>
          </div>
        </div>

        {/* Status Indicators & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Health Badge */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider border shadow-sm ${
              isLoading
                ? 'border-zinc-700 bg-zinc-800/60 text-zinc-400'
                : isHealthy && !isLagging
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-emerald-950/20'
                : isLagging
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isLoading
                  ? 'bg-zinc-500'
                  : isHealthy && !isLagging
                  ? 'bg-emerald-400 animate-ping'
                  : isLagging
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-400'
              }`}
            />
            <span>
              {isLoading
                ? 'Connecting...'
                : isHealthy && !isLagging
                ? 'Operational 24/7'
                : isLagging
                ? 'Re-energizing'
                : 'Offline / Stalled'}
            </span>
          </div>

          {/* Mode Pill */}
          <span className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-zinc-300">
            {status?.isWebhookActive ? '⚡ Webhook Active' : '🔄 Long-Polling (10s)'}
          </span>

          {/* Refresh Button */}
          <button
            id="refresh-bot-health-btn"
            onClick={() => fetchHealthStatus(true)}
            disabled={isRefreshing}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
            title="Refresh Health Telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-pink-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Telemetry Metrics Grid */}
      <div className="relative z-10 mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Latency / Elapsed */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3.5 transition-colors hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Poll Latency</span>
            <Activity className="h-3.5 w-3.5 text-pink-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span
              className={`text-lg font-bold font-mono ${
                msSinceLast < 15000
                  ? 'text-emerald-400'
                  : msSinceLast < 30000
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {status ? `${(msSinceLast / 1000).toFixed(1)}s` : '--'}
            </span>
            <span className="text-[10px] text-zinc-500">since last tick</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 flex items-center gap-1">
            <Clock className="h-3 w-3 text-zinc-600" />
            <span>Target: &lt; 15s</span>
          </div>
        </div>

        {/* Webhook Status */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3.5 transition-colors hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Delivery Mode</span>
            {status?.isWebhookActive ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Radio className="h-3.5 w-3.5 text-purple-400" />
            )}
          </div>
          <div className="mt-1.5 text-sm font-bold text-white truncate">
            {status?.isWebhookActive ? 'Webhook Push' : 'Adaptive Polling'}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 truncate" title={status?.activeWebhookUrl || 'Direct Telegram API'}>
            {status?.isWebhookActive ? (status.activeWebhookUrl || 'Configured') : 'Timeout: 10s • Offset tracked'}
          </div>
        </div>

        {/* Total Poll Cycles */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3.5 transition-colors hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Poll Cycles</span>
            <Server className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="mt-1.5 text-lg font-bold font-mono text-sky-300">
            {status ? status.totalPollCycles.toLocaleString() : '--'}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            <span>Errors: {status ? status.consecutiveErrors : 0}</span>
          </div>
        </div>

        {/* Registered Bot Users */}
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3.5 transition-colors hover:border-zinc-700">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Bot Customers</span>
            <Users className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="mt-1.5 text-lg font-bold font-mono text-amber-300">
            {status ? status.totalUsers.toLocaleString() : '--'}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 truncate">
            Memory keys: {status ? status.memoryDedupeKeys : 0}
          </div>
        </div>
      </div>

      {/* Action Toolbar & Diagnostic Ping */}
      <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Test Telegram Connectivity Alert Button */}
          <button
            id="telegram-test-connectivity-btn"
            onClick={handleTestConnectivityAlert}
            disabled={isTestingConnectivity}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            <Zap className={`h-3.5 w-3.5 ${isTestingConnectivity ? 'animate-spin' : ''}`} />
            <span>{isTestingConnectivity ? 'Testing Connectivity...' : '⚡ Test Telegram Connectivity'}</span>
          </button>

          {/* Diagnostic Ping Button */}
          <button
            id="telegram-diagnostic-ping-btn"
            onClick={handleDiagnosticPing}
            disabled={isPinging}
            className="inline-flex items-center gap-2 rounded-lg border border-pink-500/30 bg-pink-500/10 px-3 py-2 text-xs font-semibold text-pink-300 transition-all hover:bg-pink-500/20 active:scale-95 disabled:opacity-50"
          >
            <Activity className={`h-3.5 w-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Pinging...' : 'Quick Socket Ping'}</span>
          </button>

          {/* Recycle Socket */}
          <button
            id="telegram-recycle-socket-btn"
            onClick={handleRecyclePolling}
            disabled={isRecycling}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isRecycling ? 'animate-spin text-pink-400' : ''}`} />
            <span>{isRecycling ? 'Recycling...' : 'Recycle Socket'}</span>
          </button>

          {/* Open Bot */}
          {status?.botUsername && (
            <a
              href={`https://t.me/${status.botUsername.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-sky-400 transition-colors hover:bg-zinc-800"
            >
              <span>Open in Telegram</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Auto-Refresh Toggle */}
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isAutoRefreshEnabled}
              onChange={(e) => setIsAutoRefreshEnabled(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-800 text-pink-500 focus:ring-pink-500/30"
            />
            <span>Auto-refresh (5s)</span>
          </label>
        </div>
      </div>

      {/* Connectivity Alert Test Result Banner */}
      {connectivityResult && (
        <div
          id="telegram-connectivity-result-banner"
          className={`relative z-10 mt-3 rounded-xl border p-3.5 transition-all ${
            connectivityResult.success
              ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-200'
              : 'border-rose-500/40 bg-rose-950/30 text-rose-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {connectivityResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <span className="text-xs font-bold">
                {connectivityResult.success
                  ? 'Telegram Connectivity Alert Test: PASSED'
                  : 'Telegram Connectivity Alert Test: FAILED'}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                  connectivityResult.success
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                ● Status: {connectivityResult.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-cyan-500/20 px-2.5 py-0.5 text-xs font-mono font-bold text-cyan-300 border border-cyan-500/30">
                ⚡ Response Time: {connectivityResult.responseTimeMs || connectivityResult.latencyMs || 0}ms
              </span>
              <button
                type="button"
                onClick={() => setConnectivityResult(null)}
                className="rounded px-1.5 py-0.5 text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-zinc-300 font-mono">
            {connectivityResult.message}
          </p>
        </div>
      )}

      {/* Diagnostic Result Banner (if test performed) */}
      {lastPingResult && (
        <div className="relative z-10 mt-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 transition-all">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-emerald-300">
                Telegram Gateway Responded Successfully
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-400 font-bold">
                ⚡ Roundtrip: {lastPingResult.latencyMs}ms
              </span>
              <span className="text-zinc-400">
                Bot ID: <code>{lastPingResult.botDetails?.id || 'Connected'}</code>
              </span>
            </div>
          </div>
          {lastPingResult.webhookInfo?.url && (
            <div className="mt-2 text-[11px] text-zinc-400">
              🔗 Registered Webhook: <code className="text-sky-300">{lastPingResult.webhookInfo.url}</code>
            </div>
          )}
        </div>
      )}

      {/* Check Update / APK Download Telegram Link Management */}
      <div
        id="telegram-update-link-section"
        className="relative z-10 mt-4 rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-950/20 via-zinc-900/60 to-purple-950/20 p-4 shadow-lg"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-pink-500/30 bg-pink-500/10 text-pink-400">
              <DownloadCloud className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Check Update & APK Download Telegram Link
              </h4>
              <p className="text-[11px] text-zinc-400">
                Live Telegram link opened by bot buttons ("Check Update", "Download APK", /apk, /update)
              </p>
            </div>
          </div>
          {updateTelegramUrl && (
            <div className="flex items-center gap-1.5">
              <a
                href={updateTelegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/90 px-2.5 py-1 text-[11px] font-medium text-sky-400 hover:bg-zinc-700 transition-colors"
              >
                <span>Test Link</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={handleCopyUpdateUrl}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/90 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                {copiedUrl ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveUpdateUrl} className="mt-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <Link className="h-4 w-4" />
              </div>
              <input
                id="telegram-update-link-input"
                type="text"
                value={updateTelegramUrl}
                onChange={(e) => setUpdateTelegramUrl(e.target.value)}
                placeholder="https://t.me/kalamffpanel or https://t.me/yourchannel/12"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900/90 pl-9 pr-3 py-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500/50"
              />
            </div>
            <button
              id="save-telegram-update-link-btn"
              type="submit"
              disabled={isSavingUrl}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-pink-500/20 hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all"
            >
              <Save className={`h-3.5 w-3.5 ${isSavingUrl ? 'animate-spin' : ''}`} />
              <span>{isSavingUrl ? 'Saving...' : 'Save Link'}</span>
            </button>
          </div>

          {urlSaveSuccess && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Check Update Telegram Link saved & synced to live bot instantly!</span>
            </div>
          )}

          {urlSaveError && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{urlSaveError}</span>
            </div>
          )}
        </form>
      </div>

      {/* Telegram Configuration Backup & Restore Section */}
      <div
        id="telegram-config-backup-section"
        className="relative z-10 mt-4 rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-950/20 via-zinc-900/60 to-blue-950/20 p-4 shadow-lg"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-400">
              <FileJson className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Bot Configuration Backup & Restore
              </h4>
              <p className="text-[11px] text-zinc-400">
                Secure management of <code className="text-sky-300">telegram_config.json</code> with live hot-reload
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800/90 border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 font-mono">
              <Shield className="h-3 w-3 text-sky-400" />
              <span>Safety Auto-Bak Enabled</span>
            </span>
          </div>
        </div>

        <div className="mt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Download Backup Button */}
          <button
            id="download-telegram-backup-btn"
            type="button"
            onClick={handleDownloadBackup}
            disabled={isDownloadingBackup}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700 px-3.5 py-2 text-xs font-semibold text-sky-300 shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <DownloadCloud className={`h-4 w-4 ${isDownloadingBackup ? 'animate-bounce' : ''}`} />
            <span>{isDownloadingBackup ? 'Downloading...' : 'Download Backup (.json)'}</span>
          </button>

          {/* Upload / Restore Backup Button */}
          <label
            id="restore-telegram-backup-btn"
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-sky-500/20 cursor-pointer transition-all active:scale-95 ${
              isRestoringBackup ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <UploadCloud className={`h-4 w-4 ${isRestoringBackup ? 'animate-spin' : ''}`} />
            <span>{isRestoringBackup ? 'Restoring & Applying...' : 'Upload & Restore Backup'}</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleRestoreBackup}
              disabled={isRestoringBackup}
              className="hidden"
            />
          </label>
        </div>

        {/* Status Message */}
        {backupMessage && (
          <div
            className={`mt-2.5 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium border ${
              backupMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}
          >
            {backupMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span className="flex-1">{backupMessage.text}</span>
            <button
              type="button"
              onClick={() => setBackupMessage(null)}
              className="text-zinc-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Raw Diagnostic Accordion */}
      <div className="relative z-10 mt-3 border-t border-zinc-800/60 pt-3">
        <button
          onClick={() => setShowRawDetails(!showRawDetails)}
          className="flex w-full items-center justify-between text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <span className="flex items-center gap-1.5">
            <Code2 className="h-3.5 w-3.5 text-zinc-500" />
            <span>Inspect Raw Telemetry & Diagnostic Data</span>
          </span>
          {showRawDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showRawDetails && (
          <div className="mt-2 relative">
            <button
              onClick={handleCopyRaw}
              className="absolute top-2 right-2 flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
            <pre className="max-h-56 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-300">
              {JSON.stringify({ status, lastPingResult, lastRefreshedAt }, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Live Feed of Telegram Bot Activities & Incoming Messages */}
      <div className="relative z-10 mt-5 border-t border-zinc-800/80 pt-5">
        <TelegramActivityFeed />
      </div>
    </div>
  );
};
