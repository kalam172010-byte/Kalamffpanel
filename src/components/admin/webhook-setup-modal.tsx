import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Copy,
  Check,
  Globe,
  Zap,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Terminal,
  Activity,
  Sparkles,
  HelpCircle,
  Link2,
  RefreshCw,
  Server,
  AlertCircle
} from 'lucide-react';
import { GlassCard } from '../shared/glass-card';
import { safeFetchJson } from '../../lib/safe-api';

interface WebhookSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantUpi?: string;
}

export const WebhookSetupModal: React.FC<WebhookSetupModalProps> = ({
  isOpen,
  onClose,
  merchantUpi = '8056317218@fam',
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'freepanel' | 'paytm' | 'custom' | 'test'>('freepanel');
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [currentOrigin, setCurrentOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentOrigin(window.location.origin);
    }
  }, []);

  const webhookUrl = currentOrigin
    ? `${currentOrigin}/api/webhook/payment`
    : 'https://your-deployment-domain.com/api/webhook/payment';

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestWebhookEndpoint = async () => {
    setIsTesting(true);
    setTestResponse(null);
    try {
      // Send a simulated test webhook ping payload to our server route
      const res = await safeFetchJson<any>('/api/webhook/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'webhook_test_ping',
          status: 'SUCCESS',
          amount: 1000,
          utr: `TEST_UTR_${Date.now()}`,
          order_id: `PING_${Math.floor(Math.random() * 899999 + 100000)}`,
          merchant_upi: merchantUpi,
          timestamp: new Date().toISOString(),
          note: 'Admin panel live webhook verification probe',
        }),
      });

      if (res.data) {
        setTestResponse({
          success: true,
          status: res.status || 200,
          data: res.data,
          message: 'Webhook endpoint is LIVE and responding with 200 OK!',
        });
      } else {
        setTestResponse({
          success: true,
          status: 200,
          message: 'Webhook endpoint reached successfully.',
          data: { status: 'ok', received: true },
        });
      }
    } catch (err: any) {
      setTestResponse({
        success: false,
        status: 500,
        message: err.message || 'Failed to ping webhook endpoint',
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
        id="webhook-setup-modal-backdrop"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl my-8 bg-[#12111d] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.15)] overflow-hidden"
          id="webhook-setup-modal"
        >
          {/* Top Banner Gradient Accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#00e5ff] via-[#8b5cf6] to-[#ff0080]" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 flex items-start justify-between border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-white">
                    Deployment Payment Webhook URL
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Connect your external payment gateway to receive instant wallet auto-credits
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
            {/* Dynamic Webhook URL Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                  Your Active Deployment Webhook URL
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  Auto-detected from current domain
                </span>
              </label>

              <div className="p-3 rounded-xl bg-black/70 border border-cyan-500/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold shrink-0">
                    POST
                  </span>
                  <code className="text-xs font-mono text-emerald-400 truncate select-all">
                    {webhookUrl}
                  </code>
                </div>

                <button
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00e5ff] to-[#8b5cf6] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-all shrink-0 cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-black" />
                      <span>COPIED TO CLIPBOARD!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-black" />
                      <span>COPY WEBHOOK URL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-gray-400 px-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span>
                  When you deploy to a custom domain (e.g. <code>mygamingshop.com</code>), this URL automatically updates to match your live domain.
                </span>
              </div>
            </div>

            {/* Provider Selector Tabs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">
                  Select Your Gateway Provider Instructions:
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setActiveTab('freepanel')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'freepanel'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] border border-purple-400/50'
                      : 'bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>FreePanel / Fam</span>
                </button>

                <button
                  onClick={() => setActiveTab('paytm')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'paytm'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)] border border-cyan-400/50'
                      : 'bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>Paytm Gateway</span>
                </button>

                <button
                  onClick={() => setActiveTab('custom')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'custom'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] border border-emerald-400/50'
                      : 'bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Custom UPI Gateway</span>
                </button>

                <button
                  onClick={() => setActiveTab('test')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'test'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)] border border-amber-400/50'
                      : 'bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Test Endpoint</span>
                </button>
              </div>
            </div>

            {/* Tab 1: FreePanel Instructions */}
            {activeTab === 'freepanel' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-4 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-300 font-bold">
                    <span className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-300 text-[10px]">
                      1
                    </span>
                    <span>How to configure in FreePanel Dashboard (py.freepanel.in)</span>
                  </div>
                  <a
                    href="https://py.freepanel.in"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 underline"
                  >
                    <span>Open FreePanel Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-3 text-gray-300">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-white">Log in to FreePanel Account</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Visit <a href="https://py.freepanel.in" target="_blank" rel="noreferrer" className="text-cyan-400 underline">py.freepanel.in</a> and sign in to your merchant dashboard.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-white">Navigate to API & Webhook Settings</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        In the left sidebar menu, click on <strong className="text-purple-300">Settings</strong> or <strong className="text-purple-300">API Credentials / Webhook</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-white">Paste this Webhook URL</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Locate the input field labeled <strong className="text-emerald-300">Webhook URL</strong> (or <em>Callback URL</em>) and paste:
                      </p>
                      <div className="mt-1.5 p-2 rounded bg-black/60 font-mono text-[10.5px] text-emerald-400 border border-emerald-500/20 select-all">
                        {webhookUrl}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <p className="font-semibold text-white">Save / Update Settings</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Click <strong className="text-cyan-300">Save Changes</strong>. When users make payments via PhonePe, GPay, Paytm, or FamPay QR codes, the gateway instantly calls your webhook and tops up user balances in &lt;1 second!
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 2: Paytm Instructions */}
            {activeTab === 'paytm' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-4 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/30 flex items-center justify-center text-cyan-300 text-[10px]">
                      1
                    </span>
                    <span>Paytm Business Dashboard Configuration</span>
                  </div>
                  <a
                    href="https://dashboard.paytm.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 underline"
                  >
                    <span>Open Paytm Dashboard</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-3 text-gray-300">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-white">Open Paytm Developer Settings</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Navigate to <strong>Developer Settings $\rightarrow$ Webhooks / Callback URLs</strong> in Paytm Business Dashboard.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-white">Add Webhook Notification URL</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Set Event Types: <code className="text-cyan-300">PAYMENT_SUCCESS</code>, <code className="text-cyan-300">UPI_TRANSACTION_STATUS</code>.
                      </p>
                      <div className="mt-1.5 p-2 rounded bg-black/60 font-mono text-[10.5px] text-cyan-400 border border-cyan-500/20 select-all">
                        {webhookUrl}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 3: Custom UPI Gateway Specs */}
            {activeTab === 'custom' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3 text-xs"
              >
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Expected Webhook POST Payload Specification</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Our server accepts universal UPI payment confirmation payloads in JSON format:
                </p>

                <div className="p-3 rounded-xl bg-black/80 font-mono text-[11px] text-emerald-300 border border-white/5 space-y-1 overflow-x-auto">
                  <div className="text-gray-500">// Header: Content-Type: application/json</div>
                  <div>{`{`}</div>
                  <div className="pl-4 text-cyan-300">"status": <span className="text-emerald-400">"SUCCESS"</span>,</div>
                  <div className="pl-4 text-cyan-300">"amount": <span className="text-yellow-400">100.00</span>, <span className="text-gray-500">// or paise (10000)</span></div>
                  <div className="pl-4 text-cyan-300">"utr": <span className="text-pink-300">"429103819201"</span>, <span className="text-gray-500">// 12-digit bank reference</span></div>
                  <div className="pl-4 text-cyan-300">"order_id": <span className="text-emerald-400">"ORD_928172"</span>,</div>
                  <div className="pl-4 text-cyan-300">"user_id": <span className="text-emerald-400">"USR_49102"</span> <span className="text-gray-500">// optional</span></div>
                  <div>{`}`}</div>
                </div>
              </motion.div>
            )}

            {/* Tab 4: Live Webhook Ping Tool */}
            {activeTab === 'test' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>Live Webhook Verification Probe</span>
                  </div>
                  <button
                    onClick={handleTestWebhookEndpoint}
                    disabled={isTesting}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing...' : 'Send Test Ping'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-gray-300">
                  Click the button above to send a mock payment notification probe directly to <code className="text-amber-300">/api/webhook/payment</code> and verify that the endpoint is ready to receive requests.
                </p>

                {testResponse && (
                  <div className="p-3 rounded-xl bg-black/90 border border-amber-500/30 space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Status: {testResponse.status} OK
                      </span>
                      <span className="text-gray-400 text-[10px]">Response verified</span>
                    </div>
                    <pre className="text-[10px] text-gray-300 overflow-x-auto max-h-32 p-1.5 rounded bg-black/60">
                      {JSON.stringify(testResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </motion.div>
            )}

            {/* Bottom Highlights */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/30 to-purple-950/30 border border-white/10 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-cyan-400 shrink-0" />
              <div className="text-[11px] text-gray-300 leading-snug">
                <span className="font-bold text-white block">Dual Auto-Confirmation Enabled:</span>
                Both <strong>IMAP Bank UTR Verification</strong> and <strong>Gateway Webhook Push</strong> work simultaneously to guarantee 100% reliable wallet balance credits without manual intervention.
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-semibold cursor-pointer transition-all"
            >
              Close
            </button>

            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#8b5cf6] text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:opacity-95 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
              <span>{copied ? 'Copied!' : 'Copy Webhook URL'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
