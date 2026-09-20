import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  Zap,
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Activity,
  ArrowRightLeft,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Info
} from 'lucide-react';

export interface TelegramModeData {
  mode: 'LONG_POLLING' | 'WEBHOOK';
  isPolling: boolean;
  isWebhookActive: boolean;
  activeWebhookUrl: string;
  defaultWebhookUrl: string;
  botUsername: string;
  isHealthy: boolean;
  msSinceLastPoll: number;
  totalPollCycles: number;
  consecutiveErrors: number;
  lastSuccessfulPoll: string;
  timestamp: string;
}

interface TelegramModeControlProps {
  className?: string;
  onNotification?: (msg: string) => void;
}

export const TelegramModeControl: React.FC<TelegramModeControlProps> = ({
  className = '',
  onNotification
}) => {
  const [data, setData] = useState<TelegramModeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [switching, setSwitching] = useState<boolean>(false);
  const [customWebhookUrl, setCustomWebhookUrl] = useState<string>('');
  const [statusFeedback, setStatusFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [webhookInfo, setWebhookInfo] = useState<any | null>(null);
  const [loadingWebhookInfo, setLoadingWebhookInfo] = useState<boolean>(false);
  const [restartingPolling, setRestartingPolling] = useState<boolean>(false);

  const fetchModeStatus = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch('/api/telegram/mode');
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (!customWebhookUrl && json.defaultWebhookUrl) {
          setCustomWebhookUrl(json.activeWebhookUrl || json.defaultWebhookUrl);
        }
      }
    } catch (err: any) {
      console.error('[TelegramModeControl] Fetch error:', err);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [customWebhookUrl]);

  useEffect(() => {
    fetchModeStatus();
    const timer = setInterval(() => {
      fetchModeStatus(true);
    }, 8000);
    return () => clearInterval(timer);
  }, [fetchModeStatus]);

  const handleSwitchMode = async (targetMode: 'LONG_POLLING' | 'WEBHOOK') => {
    setSwitching(true);
    setStatusFeedback(null);
    try {
      const payload: any = {
        mode: targetMode,
      };
      if (targetMode === 'WEBHOOK') {
        payload.webhookUrl = customWebhookUrl.trim() || data?.defaultWebhookUrl;
      }

      const res = await fetch('/api/telegram/set-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        setStatusFeedback({
          ok: true,
          msg: `✅ Successfully switched to ${targetMode === 'WEBHOOK' ? 'Webhook Push' : 'Long Polling'} mode!`
        });
        if (onNotification) {
          onNotification(`Telegram bot switched to ${targetMode === 'WEBHOOK' ? 'Webhook' : 'Long Polling'} mode!`);
        }
        await fetchModeStatus(true);
      } else {
        setStatusFeedback({
          ok: false,
          msg: `❌ ${json.error || 'Failed to switch Telegram mode'}`
        });
      }
    } catch (err: any) {
      setStatusFeedback({
        ok: false,
        msg: `❌ Network error: ${err.message || 'Failed to connect to mode switch endpoint'}`
      });
    } finally {
      setSwitching(false);
    }
  };

  const handleRestartPolling = async () => {
    setRestartingPolling(true);
    setStatusFeedback(null);
    try {
      const res = await fetch('/api/telegram/restart', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setStatusFeedback({
          ok: true,
          msg: '⚡ Long Polling loop cleanly restarted with fresh single-instance watchdog!'
        });
        await fetchModeStatus(true);
      } else {
        setStatusFeedback({
          ok: false,
          msg: `❌ ${json.error || 'Failed to restart polling'}`
        });
      }
    } catch (err: any) {
      setStatusFeedback({
        ok: false,
        msg: `❌ Error: ${err.message}`
      });
    } finally {
      setRestartingPolling(false);
    }
  };

  const handleQueryWebhookInfo = async () => {
    setLoadingWebhookInfo(true);
    try {
      const res = await fetch('/api/telegram/webhook-info');
      const json = await res.json();
      if (json.success) {
        setWebhookInfo(json.telegramWebhookInfo);
      } else {
        setWebhookInfo({ error: json.error || 'Failed to retrieve webhook info' });
      }
    } catch (err: any) {
      setWebhookInfo({ error: err.message });
    } finally {
      setLoadingWebhookInfo(false);
    }
  };

  const isWebhookActive = data?.isWebhookActive ?? false;
  const currentMode = isWebhookActive ? 'WEBHOOK' : 'LONG_POLLING';

  return (
    <div
      id="telegram-mode-toggle-panel"
      className={`rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-[#131322] to-[#0d0d18] p-4 sm:p-6 shadow-2xl shadow-cyan-950/20 space-y-5 ${className}`}
    >
      {/* Header & Status Indicator Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.25)]">
            <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Telegram Delivery Mode & Engine Toggle
              </h3>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Switch between persistent <strong>Long Polling</strong> socket loop and serverless <strong>Webhook Push</strong>.
            </p>
          </div>
        </div>

        {/* Live Active Mode Indicator Badge */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Detecting Mode...</span>
            </div>
          ) : isWebhookActive ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.25)]">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>ACTIVE: Webhook Push (HTTPS)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>ACTIVE: Long Polling Loop (24/7)</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => fetchModeStatus(false)}
            disabled={loading}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Mode Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {statusFeedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 border ${
            statusFeedback.ok
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusFeedback.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span className="font-mono">{statusFeedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
            className="text-gray-400 hover:text-white px-2 py-0.5 rounded cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Two-Card Mode Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1: Long Polling */}
        <div
          onClick={() => !switching && currentMode !== 'LONG_POLLING' && handleSwitchMode('LONG_POLLING')}
          className={`relative rounded-xl p-4.5 border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
            !isWebhookActive
              ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
              : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-black/60'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${!isWebhookActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400'}`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>⚡ Long Polling Engine</span>
                    {!isWebhookActive && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        CURRENT
                      </span>
                    )}
                  </h4>
                  <span className="text-[11px] text-gray-400">Zero-Config Persistent Loop</span>
                </div>
              </div>

              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${!isWebhookActive ? 'border-emerald-400 bg-emerald-500 text-black' : 'border-gray-600'}`}>
                {!isWebhookActive && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Bot continuously fetches updates via Telegram <code className="text-cyan-300 font-mono text-[11px]">getUpdates</code>. Perfect for development, local servers, and environments without public domain certificates.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] font-mono text-gray-400">
              <div className="bg-black/50 p-2 rounded-lg border border-white/5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>24/7 Watchdog Guard</span>
              </div>
              <div className="bg-black/50 p-2 rounded-lg border border-white/5 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Single-Epoch Lock</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            {!isWebhookActive ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRestartPolling();
                }}
                disabled={restartingPolling}
                className="w-full py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${restartingPolling ? 'animate-spin' : ''}`} />
                <span>{restartingPolling ? 'Restarting Polling...' : 'Restart Polling Engine'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwitchMode('LONG_POLLING');
                }}
                disabled={switching}
                className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/50 disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{switching ? 'Activating...' : 'Switch to Long Polling'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Option 2: Webhook Mode */}
        <div
          onClick={() => !switching && currentMode !== 'WEBHOOK' && handleSwitchMode('WEBHOOK')}
          className={`relative rounded-xl p-4.5 border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
            isWebhookActive
              ? 'bg-purple-950/20 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/30'
              : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-black/60'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${isWebhookActive ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400'}`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>🔗 Webhook Push Mode</span>
                    {isWebhookActive && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        CURRENT
                      </span>
                    )}
                  </h4>
                  <span className="text-[11px] text-gray-400">Event-Driven HTTPS Push</span>
                </div>
              </div>

              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isWebhookActive ? 'border-purple-400 bg-purple-500 text-black' : 'border-gray-600'}`}>
                {isWebhookActive && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Telegram immediately dispatches JSON events to your public webhook endpoint <code className="text-purple-300 font-mono text-[11px]">/api/telegram/webhook</code>. Minimal latency and zero idle polling overhead.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] font-mono text-gray-400">
              <div className="bg-black/50 p-2 rounded-lg border border-white/5 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Instant Push Delivery</span>
              </div>
              <div className="bg-black/50 p-2 rounded-lg border border-white/5 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Zero CPU Idle</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            {isWebhookActive ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQueryWebhookInfo();
                }}
                disabled={loadingWebhookInfo}
                className="w-full py-2 px-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Info className={`w-3.5 h-3.5 ${loadingWebhookInfo ? 'animate-spin' : ''}`} />
                <span>{loadingWebhookInfo ? 'Querying Telegram...' : 'Verify Webhook Status'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwitchMode('WEBHOOK');
                }}
                disabled={switching}
                className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-purple-950/50 disabled:opacity-50"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{switching ? 'Registering Webhook...' : 'Switch to Webhook'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Webhook URL Configuration & Telegram Info */}
      <div className="bg-black/50 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Webhook Endpoint URL</span>
          </label>
          {data?.defaultWebhookUrl && (
            <button
              type="button"
              onClick={() => setCustomWebhookUrl(data.defaultWebhookUrl)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Auto-Fill Current App URL</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={customWebhookUrl}
            onChange={(e) => setCustomWebhookUrl(e.target.value)}
            placeholder={data?.defaultWebhookUrl || 'https://your-domain.com/api/telegram/webhook'}
            className="w-full px-3 py-2 rounded-lg bg-black/70 border border-cyan-500/30 focus:border-cyan-400 focus:outline-none text-white font-mono text-xs shadow-inner"
          />
          <button
            type="button"
            onClick={() => handleSwitchMode('WEBHOOK')}
            disabled={switching || !customWebhookUrl.trim()}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Set & Update Webhook</span>
          </button>
        </div>

        {/* Live Diagnostics Details */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono border-t border-white/5">
            <div className="bg-white/5 p-2 rounded-lg">
              <span className="text-gray-400 block text-[9px] uppercase">Delivery Mode</span>
              <span className={`font-bold ${isWebhookActive ? 'text-purple-300' : 'text-emerald-300'}`}>
                {isWebhookActive ? 'Webhook Push' : 'Long Polling'}
              </span>
            </div>
            <div className="bg-white/5 p-2 rounded-lg">
              <span className="text-gray-400 block text-[9px] uppercase">Bot Engine</span>
              <span className="text-cyan-300 font-bold">@{data.botUsername ? data.botUsername.replace('@', '') : 'KALAM_BOT'}</span>
            </div>
            <div className="bg-white/5 p-2 rounded-lg">
              <span className="text-gray-400 block text-[9px] uppercase">Poll Cycles</span>
              <span className="text-white font-bold">{data.totalPollCycles.toLocaleString()}</span>
            </div>
            <div className="bg-white/5 p-2 rounded-lg">
              <span className="text-gray-400 block text-[9px] uppercase">Health Status</span>
              <span className={`font-bold ${data.isHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
                {data.isHealthy ? '● 100% Active' : '○ Checking'}
              </span>
            </div>
          </div>
        )}

        {/* Telegram getWebhookInfo Details */}
        {webhookInfo && (
          <div className="mt-3 p-3 rounded-lg bg-purple-950/20 border border-purple-500/30 text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between text-purple-300 font-bold">
              <span>📡 Telegram Webhook Status from Server:</span>
              <button
                type="button"
                onClick={() => setWebhookInfo(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="text-[11px] text-gray-300 space-y-1">
              <div><strong>Webhook URL:</strong> {webhookInfo.url || '(none - Polling Active)'}</div>
              <div><strong>Pending Updates:</strong> {webhookInfo.pending_update_count ?? 0}</div>
              {webhookInfo.last_error_message && (
                <div className="text-rose-400"><strong>Last Error:</strong> {webhookInfo.last_error_message}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
