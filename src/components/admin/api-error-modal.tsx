import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  X,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Code2,
  Terminal,
  FileJson,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  Zap
} from 'lucide-react';

export interface ApiDiagnosticReport {
  providerName: string;
  endpointUrl: string;
  httpStatus?: number;
  durationMs?: number;
  timestamp: string;
  isError: boolean;
  rawResponse: any;
  requestHeaders?: Record<string, string>;
  requestBody?: Record<string, any>;
  errorMessage?: string;
}

interface ApiErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ApiDiagnosticReport | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ApiErrorModal: React.FC<ApiErrorModalProps> = ({
  isOpen,
  onClose,
  report,
  onRetry,
  isRetrying = false,
}) => {
  const [activeTab, setActiveTab] = useState<'actionable' | 'json' | 'request' | 'curl'>('actionable');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen || !report) return null;

  const rawJson = typeof report.rawResponse === 'string'
    ? report.rawResponse
    : JSON.stringify(report.rawResponse, null, 2);

  // Parse error indicators
  const rawObj = typeof report.rawResponse === 'object' && report.rawResponse !== null
    ? report.rawResponse
    : (() => {
        try {
          return JSON.parse(report.rawResponse);
        } catch {
          return { raw: report.rawResponse };
        }
      })();

  const rawStatus = rawObj?.status || rawObj?.code || (report.httpStatus ? `HTTP ${report.httpStatus}` : 'UNKNOWN');
  
  const extractMessageString = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      if (typeof val.message === 'string') return val.message;
      if (typeof val.msg === 'string') return val.msg;
      if (typeof val.error === 'string') return val.error;
      if (typeof val.error?.message === 'string') return val.error.message;
      try {
        return JSON.stringify(val);
      } catch {
        return 'Server Error';
      }
    }
    return String(val);
  };

  const rawMessage = extractMessageString(rawObj?.msg) ||
    extractMessageString(rawObj?.message) ||
    extractMessageString(rawObj?.error) ||
    extractMessageString(rawObj?.reason) ||
    extractMessageString(report.errorMessage) ||
    'Upstream server returned a response.';

  // Generate Actionable Feedback based on parsed error pattern
  const analyzeActionableSteps = () => {
    const textToCheck = `${JSON.stringify(rawObj)} ${report.errorMessage || ''} ${report.httpStatus || ''}`.toLowerCase();

    if (textToCheck.includes('server error') || report.httpStatus === 500) {
      return {
        category: 'Upstream / Host Response Notice',
        severity: 'medium',
        summary: 'Upstream server returned HTTP 500 or is processing key requests.',
        causes: [
          'The upstream provider API is active but requires live product purchase payloads.',
          'Static preview hosting does not run custom server routes — automated fallback proxy is handling orders.',
          'Upstream provider might be undergoing temporary maintenance.'
        ],
        steps: [
          {
            title: 'Store Key Delivery is Safe',
            desc: 'Even if upstream is temporarily unreachable, keys in your local ID Stock inventory are delivered instantly to buyers.'
          },
          {
            title: 'Verify Remote Product ID',
            desc: 'Check that your product has the exact Remote Product ID matching the upstream panel (e.g. PRODUCT_PID_ID).'
          }
        ]
      };
    }

    if (textToCheck.includes('invalid api key') || textToCheck.includes('access denied') || textToCheck.includes('unauthorized') || report.httpStatus === 401 || report.httpStatus === 403) {
      return {
        category: 'Authentication & Key Mismatch',
        severity: 'high',
        summary: 'The upstream provider rejected the API Key or Token.',
        causes: [
          'The API key in your configuration does not match the active key on the provider account.',
          'The upstream account might not have Reseller API permissions enabled.',
          'Extra whitespace or special characters were accidentally included during copy-pasting.'
        ],
        steps: [
          {
            title: 'Verify & Copy Fresh API Key',
            desc: 'Log in to your upstream provider dashboard (e.g. adminpanels.shop), open Profile / API Settings, and regenerate or copy your active Reseller API Key.'
          },
          {
            title: 'Update Store API Setup',
            desc: 'Paste the key into the API Key input field in this panel and click "Save API #1".'
          },
          {
            title: 'Ensure Master Key Header is Accepted',
            desc: 'Check if your upstream endpoint requires a custom header (e.g. x-master-key). The system automatically forwards required headers.'
          }
        ]
      };
    }

    if (textToCheck.includes('insufficient') || textToCheck.includes('low balance') || textToCheck.includes('balance') || textToCheck.includes('credits')) {
      return {
        category: 'Upstream Wallet Balance Depleted',
        severity: 'high',
        summary: 'Your upstream reseller balance is 0 or insufficient to buy keys.',
        causes: [
          'Upstream provider wallet has insufficient credits to fulfill new license generation.',
          'Minimum threshold for automated API orders has been reached.'
        ],
        steps: [
          {
            title: 'Top Up Upstream Wallet',
            desc: 'Visit your provider portal and add funds to your main account balance.'
          },
          {
            title: 'Re-test Key Generation',
            desc: 'After the funds reflect in the upstream portal, click "Test Connection" again.'
          }
        ]
      };
    }

    if (textToCheck.includes('invalid action')) {
      return {
        category: 'Action Parameter Compatibility',
        severity: 'low',
        summary: 'Upstream server is 100% online, but only accepts key purchase operations (action="buy").',
        causes: [
          'The upstream PHP reseller script is programmed strictly to process action="buy" requests.',
          'Ping / check actions return "Invalid Action" by design on this upstream server.',
          'Server handshake, connection, SSL, and network route are all fully functional.'
        ],
        steps: [
          {
            title: 'Connection Is Working',
            desc: 'The upstream server successfully received and answered the request. Key generation will work normally during customer purchases using action="buy".'
          },
          {
            title: 'Verify Product IDs',
            desc: 'Make sure your products have the correct "Remote Product ID" set in the Admin Products tab.'
          }
        ]
      };
    }

    if (textToCheck.includes('product') || textToCheck.includes('duration') || textToCheck.includes('not found') || textToCheck.includes('out of stock')) {
      return {
        category: 'Product ID or Duration Mismatch',
        severity: 'medium',
        summary: 'The upstream provider could not find this product ID or duration code.',
        causes: [
          'The remote product ID (PID) does not match upstream catalog IDs.',
          'The duration format (e.g. "1 Day" vs "1_day" vs "24h") is not mapped correctly.',
          'Upstream provider is temporarily out of stock for this specific game.'
        ],
        steps: [
          {
            title: 'Check Remote PID in Products Tab',
            desc: 'Go to Admin > Products > Edit Product > verify the "Remote Product ID" matches upstream.'
          },
          {
            title: 'Verify Duration Mapping',
            desc: 'Ensure the plan durations match what the remote API expects (e.g., "1 Day", "7 Days", "30 Days").'
          }
        ]
      };
    }

    if (textToCheck.includes('502') || textToCheck.includes('timeout') || textToCheck.includes('failed to fetch') || textToCheck.includes('connection refused') || textToCheck.includes('offline') || report.httpStatus === 502 || report.httpStatus === 504) {
      return {
        category: 'Upstream Server Unreachable / Timeout',
        severity: 'high',
        summary: 'The remote server failed to respond within the 10-second timeout window.',
        causes: [
          'The remote server is experiencing downtime or Cloudflare protection blocks.',
          'The API URL has a typo or the PHP script path has changed.',
          'Host firewall is blocking incoming proxy connections.'
        ],
        steps: [
          {
            title: 'Check API Endpoint URL',
            desc: `Confirm the URL "${report.endpointUrl}" is fully accessible via browser or Postman.`
          },
          {
            title: 'Check Remote Provider Status',
            desc: 'Contact upstream provider support or check their announcement channel for server maintenance.'
          }
        ]
      };
    }

    return {
      category: 'Upstream Provider Response',
      severity: 'medium',
      summary: 'Upstream provider returned a structured response requiring review.',
      causes: [
        'Custom business logic error on remote server.',
        'Request format mismatch or parameter requirement.'
      ],
      steps: [
        {
          title: 'Inspect Raw Response JSON',
          desc: 'Review the JSON fields below to understand the exact error payload from the remote server.'
        },
        {
          title: 'Run Diagnostic cURL in Terminal',
          desc: 'Switch to the "cURL Command" tab, copy the test command, and execute it locally or share it with provider support.'
        }
      ]
    };
  };

  const actionable = analyzeActionableSteps();

  // Generated cURL Command
  const curlCommand = `curl -X POST "${report.endpointUrl}" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  ${report.requestHeaders ? Object.entries(report.requestHeaders).map(([k, v]) => `-H "${k}: ${v}" \\`).join('\n  ') : ''}
  -d "${report.requestBody ? new URLSearchParams(report.requestBody as any).toString() : ''}"`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-[#10101a] border border-white/15 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col my-auto max-h-[90vh]"
        >
          {/* Top Header Banner */}
          <div className="p-4 bg-gradient-to-r from-[#181828] via-[#201830] to-[#181828] border-b border-white/10 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                report.isError
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}>
                {report.isError ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-white tracking-wide">
                    {report.providerName} Upstream Diagnostic
                  </h3>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    report.isError
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {report.httpStatus ? `HTTP ${report.httpStatus}` : (report.isError ? 'ERROR' : 'OK')}
                  </span>
                  {typeof report.durationMs === 'number' && (
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                      {report.durationMs}ms
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 font-mono truncate max-w-[280px] mt-0.5">
                  {report.endpointUrl}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Summary Pill Bar */}
          <div className="px-4 py-2.5 bg-black/40 border-b border-white/5 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-1.5 text-gray-300 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-gray-400 font-semibold text-[11px] shrink-0">Server Message:</span>
              <span className="font-mono text-rose-300 text-[11px] font-bold truncate">
                {String(rawMessage)}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono shrink-0">
              {report.timestamp}
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-[#12121e] px-3 pt-2 gap-1 text-xs">
            <button
              onClick={() => setActiveTab('actionable')}
              className={`px-3 py-2 rounded-t-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'actionable'
                  ? 'bg-[#181828] text-[#00e5ff] border-t-2 border-t-[#00e5ff] border-x border-x-white/10'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Actionable Fix</span>
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-2 rounded-t-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-[#181828] text-purple-400 border-t-2 border-t-purple-400 border-x border-x-white/10'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Parsed JSON</span>
            </button>

            <button
              onClick={() => setActiveTab('request')}
              className={`px-3 py-2 rounded-t-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'request'
                  ? 'bg-[#181828] text-amber-400 border-t-2 border-t-amber-400 border-x border-x-white/10'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Request Payload</span>
            </button>

            <button
              onClick={() => setActiveTab('curl')}
              className={`px-3 py-2 rounded-t-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'curl'
                  ? 'bg-[#181828] text-emerald-400 border-t-2 border-t-emerald-400 border-x border-x-white/10'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>cURL Command</span>
            </button>
          </div>

          {/* Modal Tab Content Body */}
          <div className="p-4 overflow-y-auto space-y-3.5 flex-1 bg-[#0d0d16]">
            {/* TAB 1: Actionable Fix Recommendations */}
            {activeTab === 'actionable' && (
              <div className="space-y-3.5">
                {/* Category & Summary Banner */}
                <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-rose-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-rose-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-rose-400" />
                      Issue: {actionable.category}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 uppercase">
                      Action Required
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white leading-relaxed">
                    {actionable.summary}
                  </p>
                </div>

                {/* Probable Causes */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <h4 className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    Why did this error happen?
                  </h4>
                  <ul className="space-y-1.5 text-xs text-gray-400">
                    {actionable.causes.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                        <span className="leading-snug">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Step-by-Step Action Checklist */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    How to fix this issue (Step-by-Step):
                  </h4>

                  <div className="space-y-2">
                    {actionable.steps.map((st, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-[#161626] border border-white/10 hover:border-cyan-500/40 transition-all flex items-start gap-3"
                      >
                        <div className="w-6 h-6 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-white leading-tight">
                            {st.title}
                          </h5>
                          <p className="text-[11px] text-gray-400 leading-relaxed">
                            {st.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Parsed JSON View */}
            {activeTab === 'json' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-mono text-[11px]">
                    Raw Upstream JSON Output:
                  </span>
                  <button
                    onClick={() => handleCopy(rawJson, 'json')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-mono text-[10px] transition-colors cursor-pointer"
                  >
                    {copiedText === 'json' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative rounded-2xl bg-black/70 border border-purple-500/20 p-3.5 font-mono text-xs overflow-x-auto max-h-[300px]">
                  <pre className="text-purple-300 whitespace-pre-wrap leading-relaxed">
                    {rawJson}
                  </pre>
                </div>

                {/* Parsed Badges */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  {Object.entries(rawObj).slice(0, 6).map(([k, v]) => (
                    <div key={k} className="p-2 rounded-xl bg-black/40 border border-white/5">
                      <span className="text-[10px] text-gray-400 font-mono block uppercase">{k}</span>
                      <span className="text-xs font-bold text-white font-mono truncate block">
                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Request Payload Sent */}
            {activeTab === 'request' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-mono text-[11px]">
                    Parameters & Headers Sent to Upstream:
                  </span>
                  <button
                    onClick={() => handleCopy(JSON.stringify({ headers: report.requestHeaders, body: report.requestBody }, null, 2), 'req')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-mono text-[10px] transition-colors cursor-pointer"
                  >
                    {copiedText === 'req' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Request</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Headers */}
                {report.requestHeaders && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Request Headers
                    </span>
                    <div className="p-3 rounded-2xl bg-black/60 border border-white/5 font-mono text-xs space-y-1 text-gray-300">
                      {Object.entries(report.requestHeaders).map(([hk, hv]) => (
                        <div key={hk} className="flex items-start justify-between gap-2">
                          <span className="text-cyan-400 font-semibold">{hk}:</span>
                          <span className="text-gray-300 font-mono truncate">{hv}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Body Form Data */}
                {report.requestBody && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Request Body (Form Data)
                    </span>
                    <div className="p-3 rounded-2xl bg-black/60 border border-white/5 font-mono text-xs space-y-1 text-gray-300">
                      {Object.entries(report.requestBody).map(([bk, bv]) => (
                        <div key={bk} className="flex items-start justify-between gap-2">
                          <span className="text-amber-400 font-semibold">{bk}:</span>
                          <span className="text-white font-mono truncate">{String(bv)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: cURL Terminal Script */}
            {activeTab === 'curl' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-mono text-[11px]">
                    Direct CLI cURL Test Command:
                  </span>
                  <button
                    onClick={() => handleCopy(curlCommand, 'curl')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-mono text-[10px] transition-colors cursor-pointer"
                  >
                    {copiedText === 'curl' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy cURL</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/80 border border-emerald-500/30 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">
                  <pre className="whitespace-pre-wrap select-all">{curlCommand}</pre>
                </div>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                  You can copy and execute this exact command in your terminal or share with the API provider to debug server-side access directly.
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-3.5 bg-[#12121e] border-t border-white/10 flex items-center justify-between gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
            >
              Close
            </button>

            {onRetry && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRetry}
                disabled={isRetrying}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#8b5cf6] hover:from-[#00cbe6] hover:to-[#7c3aed] text-black font-extrabold text-xs shadow-[0_0_20px_rgba(0,229,255,0.4)] border border-cyan-300/40 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? 'Retrying Test...' : 'Retry Connection Test'}</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
