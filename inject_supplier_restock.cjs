const fs = require('fs');
const esbuild = require('esbuild');

const supplierRestockComponentCode = `
const SupplierRestockManager = () => {
  const [config, setConfig] = q.useState({
    enabled: true,
    webhookSecretToken: 'KALAM_SUPPLIER_KEY',
    lowStockThreshold: 3,
    autoRefillEnabled: false,
    outboundSupplierApiUrl: '',
    outboundSupplierApiKey: '',
    outboundRefillBatchCount: 5,
    notifyTelegramOnRestock: true,
    notifyTelegramOnLowStock: true
  });
  const [webhookUrl, setWebhookUrl] = q.useState('');
  const [fallbackUrl, setFallbackUrl] = q.useState('');
  const [logs, setLogs] = q.useState([]);
  const [products, setProducts] = q.useState([]);
  const [selectedProductId, setSelectedProductId] = q.useState('');
  const [simulateCount, setSimulateCount] = q.useState(3);
  const [isLoading, setIsLoading] = q.useState(false);
  const [isSaving, setIsSaving] = q.useState(false);
  const [isSimulating, setIsSimulating] = q.useState(false);
  const [statusMsg, setStatusMsg] = q.useState(null);
  const [copiedField, setCopiedField] = q.useState(null);

  const fetchConfig = q.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/supplier-restock/config');
      if (res.ok) {
        const d = await res.json();
        if (d.config) setConfig(d.config);
        if (d.webhookUrl) setWebhookUrl(d.webhookUrl);
        if (d.fallbackWebhookUrl) setFallbackUrl(d.fallbackWebhookUrl);
      }
    } catch (e) {}
  }, []);

  const fetchLogs = q.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/supplier-restock/logs');
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d.logs)) setLogs(d.logs);
      }
    } catch (e) {}
    finally { setIsLoading(false); }
  }, []);

  const fetchProductsList = q.useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const d = await res.json();
        const list = Array.isArray(d) ? d : Array.isArray(d.products) ? d.products : [];
        setProducts(list);
        if (list.length > 0 && !selectedProductId) {
          setSelectedProductId(list[0].id);
        }
      }
    } catch (e) {}
  }, [selectedProductId]);

  q.useEffect(() => {
    fetchConfig();
    fetchLogs();
    fetchProductsList();
  }, [fetchConfig, fetchLogs, fetchProductsList]);

  const copyToClipboard = (text, fieldName) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {}
  };

  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/supplier-restock/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const d = await res.json();
      if (d.success) {
        setStatusMsg({ text: '✅ Supplier Restock Configuration Saved Successfully!', type: 'success' });
        if (d.config) setConfig(d.config);
      } else {
        setStatusMsg({ text: '❌ Failed to save: ' + (d.error || 'Server error'), type: 'error' });
      }
    } catch (err) {
      setStatusMsg({ text: '❌ ' + err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulateRestock = async () => {
    setIsSimulating(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/supplier-restock/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          count: Number(simulateCount) || 3
        })
      });
      const d = await res.json();
      if (d.success) {
        setStatusMsg({ text: '⚡ ' + d.message + ' (Telegram notification triggered!)', type: 'success' });
        fetchLogs();
        fetchProductsList();
      } else {
        setStatusMsg({ text: '❌ Simulation Failed: ' + (d.error || 'Check server logs'), type: 'error' });
      }
    } catch (err) {
      setStatusMsg({ text: '❌ ' + err.message, type: 'error' });
    } finally {
      setIsSimulating(false);
    }
  };

  const regenerateToken = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let token = 'KALAM_SUPPLIER_';
    for (let i = 0; i < 8; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
    setConfig(prev => ({ ...prev, webhookSecretToken: token }));
  };

  const activeWebhook = webhookUrl || (window.location.origin + '/api/webhook/supplier-restock');

  return r.jsxs("div", {
    className: "space-y-6 max-w-7xl mx-auto pb-12",
    children: [
      /* Header Banner */
      r.jsxs("div", {
        className: "relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#101924] to-[#0f172a] border border-emerald-500/30 p-5 sm:p-6 shadow-2xl",
        children: [
          r.jsxs("div", {
            className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10",
            children: [
              r.jsxs("div", {
                className: "space-y-1.5",
                children: [
                  r.jsxs("div", {
                    className: "flex items-center gap-2.5",
                    children: [
                      r.jsx("span", { className: "text-2xl", children: "⚡" }),
                      r.jsx("h2", { className: "text-xl sm:text-2xl font-black text-white tracking-wide", children: "Auto-Restock Supplier API Webhooks" }),
                      r.jsx("span", { className: "px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5", children: [
                        r.jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-pulse" }),
                        "LIVE WEBHOOK GATEWAY"
                      ] })
                    ]
                  }),
                  r.jsx("p", { className: "text-xs sm:text-sm text-gray-300 max-w-2xl", children: "Connect external key supplier APIs, panels, and webhooks to automatically refill stock keys in real-time with instant Telegram alerts." })
                ]
              }),
              r.jsxs("div", {
                className: "flex items-center gap-2 self-start md:self-auto",
                children: [
                  r.jsx("button", {
                    type: "button",
                    onClick: () => { fetchLogs(); fetchConfig(); fetchProductsList(); },
                    className: "px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/10 transition-colors flex items-center gap-1.5",
                    children: [r.jsx("span", { children: "🔄" }), "Refresh Logs"]
                  })
                ]
              })
            ]
          })
        ]
      }),

      /* Status Alert Banner */
      statusMsg && r.jsxs("div", {
        className: "p-4 rounded-xl text-sm font-medium border " + (statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/10 border-rose-500/40 text-rose-300'),
        children: [
          r.jsx("span", { className: "mr-2", children: statusMsg.type === 'success' ? '✨' : '⚠️' }),
          statusMsg.text
        ]
      }),

      /* Main Grid: Left Column (Webhook & Settings), Right Column (Simulator & Logs) */
      r.jsxs("div", {
        className: "grid grid-cols-1 lg:grid-cols-12 gap-6",
        children: [
          /* Left Column: Webhook Details & Restock Configuration */
          r.jsxs("div", {
            className: "lg:col-span-7 space-y-6",
            children: [
              /* Card 1: Inbound Webhook Credentials */
              r.jsxs("div", {
                className: "bg-[#10141f] border border-emerald-500/20 rounded-2xl p-5 shadow-xl space-y-4",
                children: [
                  r.jsxs("div", {
                    className: "flex items-center justify-between border-b border-white/5 pb-3",
                    children: [
                      r.jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [
                          r.jsx("span", { className: "text-lg", children: "📡" }),
                          r.jsx("h3", { className: "text-sm font-bold text-white uppercase tracking-wider", children: "Inbound Supplier Webhook Endpoint" })
                        ]
                      }),
                      r.jsx("span", { className: "text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30", children: "POST Endpoint" })
                    ]
                  }),

                  r.jsxs("div", {
                    className: "space-y-3",
                    children: [
                      /* Webhook URL Input */
                      r.jsxs("div", {
                        className: "space-y-1.5",
                        children: [
                          r.jsx("label", { className: "text-xs font-semibold text-gray-300 flex items-center justify-between", children: [
                            r.jsx("span", { children: "Supplier Webhook URL (Give this to your Supplier / API)" }),
                            copiedField === 'url' && r.jsx("span", { className: "text-emerald-400 text-[11px]", children: "✓ Copied URL!" })
                          ] }),
                          r.jsxs("div", {
                            className: "flex items-center gap-2",
                            children: [
                              r.jsx("input", {
                                type: "text",
                                readOnly: true,
                                value: activeWebhook,
                                className: "w-full bg-black/60 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none select-all"
                              }),
                              r.jsx("button", {
                                type: "button",
                                onClick: () => copyToClipboard(activeWebhook, 'url'),
                                className: "px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold whitespace-nowrap transition-colors",
                                children: copiedField === 'url' ? '✓ Copied' : '📋 Copy'
                              })
                            ]
                          })
                        ]
                      }),

                      /* Webhook Secret Token */
                      r.jsxs("div", {
                        className: "space-y-1.5",
                        children: [
                          r.jsx("label", { className: "text-xs font-semibold text-gray-300 flex items-center justify-between", children: [
                            r.jsx("span", { children: "Authorization Secret Token (Header: Authorization: Bearer <TOKEN>)" }),
                            copiedField === 'token' && r.jsx("span", { className: "text-emerald-400 text-[11px]", children: "✓ Copied Token!" })
                          ] }),
                          r.jsxs("div", {
                            className: "flex items-center gap-2",
                            children: [
                              r.jsx("input", {
                                type: "text",
                                value: config.webhookSecretToken,
                                onChange: (e) => setConfig({ ...config, webhookSecretToken: e.target.value }),
                                className: "w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-purple-300 focus:border-purple-500 focus:outline-none"
                              }),
                              r.jsx("button", {
                                type: "button",
                                onClick: () => copyToClipboard(config.webhookSecretToken, 'token'),
                                className: "px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold whitespace-nowrap transition-colors",
                                children: copiedField === 'token' ? '✓ Copied' : '📋 Copy'
                              }),
                              r.jsx("button", {
                                type: "button",
                                onClick: regenerateToken,
                                title: "Regenerate Random Secret Token",
                                className: "px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs transition-colors",
                                children: "🔄"
                              })
                            ]
                          })
                        ]
                      }),

                      /* Payload Documentation Snippet */
                      r.jsxs("div", {
                        className: "mt-2 bg-black/40 border border-white/5 rounded-xl p-3 space-y-1.5 text-[11px] text-gray-400 font-mono",
                        children: [
                          r.jsx("div", { className: "text-emerald-400 font-bold", children: "📝 Example JSON Payload Accepted by Webhook:" }),
                          r.jsx("pre", { className: "text-gray-300 bg-black/60 p-2.5 rounded-lg overflow-x-auto text-[10.5px] border border-white/5", children: \`{
  "productName": "DRIPCLIENT FF NONROOT",
  "keys": ["KEY-AAAA-1111", "KEY-BBBB-2222", "KEY-CCCC-3333"],
  "plan": "1 Day",
  "supplierName": "KeySupplier Partner"
}\` })
                        ]
                      })
                    ]
                  })
                ]
              }),

              /* Card 2: Restock Configuration & Low Stock Auto-Refill */
              r.jsxs("form", {
                onSubmit: handleSaveConfig,
                className: "bg-[#10141f] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4",
                children: [
                  r.jsxs("div", {
                    className: "flex items-center justify-between border-b border-white/5 pb-3",
                    children: [
                      r.jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [
                          r.jsx("span", { className: "text-lg", children: "⚙️" }),
                          r.jsx("h3", { className: "text-sm font-bold text-white uppercase tracking-wider", children: "Automation & Threshold Settings" })
                        ]
                      }),
                      r.jsx("span", { className: "text-[11px] text-gray-400 font-medium", children: "Global Configuration" })
                    ]
                  }),

                  r.jsxs("div", {
                    className: "space-y-4",
                    children: [
                      /* Master Webhook Toggle */
                      r.jsxs("div", {
                        className: "flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5",
                        children: [
                          r.jsxs("div", {
                            className: "space-y-0.5",
                            children: [
                              r.jsx("div", { className: "text-xs font-bold text-white", children: "Enable Inbound Webhook Restock" }),
                              r.jsx("div", { className: "text-[11px] text-gray-400", children: "Allow incoming HTTP POST requests from external key suppliers" })
                            ]
                          }),
                          r.jsx("input", {
                            type: "checkbox",
                            checked: config.enabled,
                            onChange: (e) => setConfig({ ...config, enabled: e.target.checked }),
                            className: "w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                          })
                        ]
                      }),

                      /* Low Stock Threshold & Batch Refill */
                      r.jsxs("div", {
                        className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                        children: [
                          r.jsxs("div", {
                            className: "space-y-1",
                            children: [
                              r.jsx("label", { className: "text-xs font-semibold text-gray-300", children: "Low Stock Alert Threshold" }),
                              r.jsx("input", {
                                type: "number",
                                min: 1,
                                max: 100,
                                value: config.lowStockThreshold,
                                onChange: (e) => setConfig({ ...config, lowStockThreshold: Number(e.target.value) || 3 }),
                                className: "w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                              }),
                              r.jsx("p", { className: "text-[10px] text-gray-500", children: "Trigger auto-refill when remaining stock <= this number" })
                            ]
                          }),
                          r.jsxs("div", {
                            className: "space-y-1",
                            children: [
                              r.jsx("label", { className: "text-xs font-semibold text-gray-300", children: "Auto-Refill Batch Quantity" }),
                              r.jsx("input", {
                                type: "number",
                                min: 1,
                                max: 100,
                                value: config.outboundRefillBatchCount || 5,
                                onChange: (e) => setConfig({ ...config, outboundRefillBatchCount: Number(e.target.value) || 5 }),
                                className: "w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                              }),
                              r.jsx("p", { className: "text-[10px] text-gray-500", children: "Number of keys to request from supplier per refill" })
                            ]
                          })
                        ]
                      }),

                      /* Outbound Auto-Refill API Section */
                      r.jsxs("div", {
                        className: "p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-3",
                        children: [
                          r.jsxs("div", {
                            className: "flex items-center justify-between",
                            children: [
                              r.jsxs("div", {
                                className: "space-y-0.5",
                                children: [
                                  r.jsx("div", { className: "text-xs font-bold text-purple-300 flex items-center gap-1.5", children: [
                                    r.jsx("span", { children: "🚀" }),
                                    "Outbound Supplier Auto-Refill Request"
                                  ] }),
                                  r.jsx("div", { className: "text-[10.5px] text-gray-400", children: "Automatically calls supplier API endpoint when stock drops below threshold" })
                                ]
                              }),
                              r.jsx("input", {
                                type: "checkbox",
                                checked: config.autoRefillEnabled,
                                onChange: (e) => setConfig({ ...config, autoRefillEnabled: e.target.checked }),
                                className: "w-5 h-5 accent-purple-500 rounded cursor-pointer"
                              })
                            ]
                          }),

                          config.autoRefillEnabled && r.jsxs("div", {
                            className: "space-y-2.5 pt-2 border-t border-white/5",
                            children: [
                              r.jsxs("div", {
                                className: "space-y-1",
                                children: [
                                  r.jsx("label", { className: "text-[11px] font-semibold text-gray-300", children: "Supplier API Endpoint URL" }),
                                  r.jsx("input", {
                                    type: "url",
                                    placeholder: "https://supplier-panel.com/api/v1/keys/generate",
                                    value: config.outboundSupplierApiUrl || '',
                                    onChange: (e) => setConfig({ ...config, outboundSupplierApiUrl: e.target.value }),
                                    className: "w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-purple-500 focus:outline-none"
                                  })
                                ]
                              }),
                              r.jsxs("div", {
                                className: "space-y-1",
                                children: [
                                  r.jsx("label", { className: "text-[11px] font-semibold text-gray-300", children: "Supplier API Key / Bearer Token" }),
                                  r.jsx("input", {
                                    type: "password",
                                    placeholder: "sk_live_...",
                                    value: config.outboundSupplierApiKey || '',
                                    onChange: (e) => setConfig({ ...config, outboundSupplierApiKey: e.target.value }),
                                    className: "w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-purple-500 focus:outline-none"
                                  })
                                ]
                              })
                            ]
                          })
                        ]
                      }),

                      /* Telegram Notifications Toggle */
                      r.jsxs("div", {
                        className: "flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5",
                        children: [
                          r.jsxs("div", {
                            className: "space-y-0.5",
                            children: [
                              r.jsx("div", { className: "text-xs font-bold text-white", children: "Telegram Admin Restock Alerts" }),
                              r.jsx("div", { className: "text-[11px] text-gray-400", children: "Send rich receipt card to Admin Telegram when restock occurs" })
                            ]
                          }),
                          r.jsx("input", {
                            type: "checkbox",
                            checked: config.notifyTelegramOnRestock,
                            onChange: (e) => setConfig({ ...config, notifyTelegramOnRestock: e.target.checked }),
                            className: "w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                          })
                        ]
                      }),

                      /* Save Button */
                      r.jsx("button", {
                        type: "submit",
                        disabled: isSaving,
                        className: "w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-950/50 transition-all active:scale-98 disabled:opacity-50",
                        children: isSaving ? "Saving Configuration..." : "💾 Save Restock Configuration"
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          /* Right Column: Webhook Simulator & Real-time Audit Logs */
          r.jsxs("div", {
            className: "lg:col-span-5 space-y-6",
            children: [
              /* Card 3: Interactive Simulation Tester */
              r.jsxs("div", {
                className: "bg-[#10141f] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4",
                children: [
                  r.jsxs("div", {
                    className: "flex items-center justify-between border-b border-white/5 pb-3",
                    children: [
                      r.jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [
                          r.jsx("span", { className: "text-lg", children: "🧪" }),
                          r.jsx("h3", { className: "text-sm font-bold text-white uppercase tracking-wider", children: "Live Restock Simulator" })
                        ]
                      }),
                      r.jsx("span", { className: "text-[11px] text-purple-400 font-mono", children: "Instant Test" })
                    ]
                  }),

                  r.jsxs("div", {
                    className: "space-y-3",
                    children: [
                      r.jsxs("div", {
                        className: "space-y-1",
                        children: [
                          r.jsx("label", { className: "text-xs font-semibold text-gray-300", children: "Select Product to Refill" }),
                          r.jsx("select", {
                            value: selectedProductId,
                            onChange: (e) => setSelectedProductId(e.target.value),
                            className: "w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none",
                            children: products.map(p => r.jsxs("option", { value: p.id, children: [p.name, " (Stock: ", p.stock || (p.keys ? p.keys.length : 0), ")"] }, p.id))
                          })
                        ]
                      }),

                      r.jsxs("div", {
                        className: "space-y-1",
                        children: [
                          r.jsx("label", { className: "text-xs font-semibold text-gray-300", children: "Number of Keys to Credit" }),
                          r.jsx("input", {
                            type: "number",
                            min: 1,
                            max: 50,
                            value: simulateCount,
                            onChange: (e) => setSimulateCount(Number(e.target.value) || 1),
                            className: "w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                          })
                        ]
                      }),

                      r.jsx("button", {
                        type: "button",
                        onClick: handleSimulateRestock,
                        disabled: isSimulating || !selectedProductId,
                        className: "w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black tracking-wide shadow-lg shadow-purple-950/50 transition-all active:scale-98 disabled:opacity-50",
                        children: isSimulating ? "⚡ Simulating Restock..." : "⚡ Simulate Restock Now"
                      })
                    ]
                  })
                ]
              }),

              /* Card 4: Webhook Audit & Delivery Logs */
              r.jsxs("div", {
                className: "bg-[#10141f] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3.5",
                children: [
                  r.jsxs("div", {
                    className: "flex items-center justify-between border-b border-white/5 pb-3",
                    children: [
                      r.jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [
                          r.jsx("span", { className: "text-lg", children: "📜" }),
                          r.jsxs("h3", { className: "text-sm font-bold text-white uppercase tracking-wider", children: ["Restock Audit Logs (", logs.length, ")"] })
                        ]
                      }),
                      r.jsx("button", {
                        type: "button",
                        onClick: fetchLogs,
                        className: "text-[11px] text-emerald-400 hover:underline font-semibold",
                        children: "Refresh"
                      })
                    ]
                  }),

                  isLoading ? r.jsx("div", { className: "py-8 text-center text-xs text-gray-500", children: "Loading audit logs..." })
                  : logs.length === 0 ? r.jsxs("div", {
                    className: "py-8 text-center space-y-2",
                    children: [
                      r.jsx("div", { className: "text-2xl", children: "📦" }),
                      r.jsx("div", { className: "text-xs font-semibold text-gray-400", children: "No restock events recorded yet" }),
                      r.jsx("div", { className: "text-[11px] text-gray-500", children: "Simulate a restock or send a webhook payload to view audit logs here." })
                    ]
                  })
                  : r.jsx("div", {
                    className: "space-y-2.5 max-h-[380px] overflow-y-auto pr-1",
                    children: logs.map(item => r.jsxs("div", {
                      className: "p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5",
                      children: [
                        r.jsxs("div", {
                          className: "flex items-center justify-between",
                          children: [
                            r.jsxs("div", {
                              className: "flex items-center gap-1.5",
                              children: [
                                r.jsx("span", { className: "text-xs", children: item.status === 'SUCCESS' ? '✅' : '❌' }),
                                r.jsx("span", { className: "text-xs font-bold text-white truncate max-w-[160px]", children: item.productName }),
                                r.jsxs("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 font-mono", children: ["+", item.keysCountAdded, " Keys"] })
                              ]
                            }),
                            r.jsx("span", { className: "text-[10px] text-gray-500 font-mono", children: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
                          ]
                        }),
                        r.jsxs("div", {
                          className: "flex items-center justify-between text-[10px] text-gray-400",
                          children: [
                            r.jsxs("span", { children: ["Source: ", r.jsx("b", { className: "text-gray-300", children: item.supplierName || item.sourceIp || 'Webhook' })] }),
                            r.jsxs("span", { children: ["Stock Now: ", r.jsx("b", { className: "text-emerald-400", children: item.currentTotalStock })] })
                          ]
                        })
                      ]
                    }, item.id))
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
};
`;

for (const filePath of ['public/assets/index-BvHT743v.js', 'dist/assets/index-BvHT743v.js']) {
  if (!fs.existsSync(filePath)) continue;
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Inject SupplierRestockManager Component definition
  if (!code.includes('const SupplierRestockManager =')) {
    code = supplierRestockComponentCode + '\n' + code;
    console.log(`[${filePath}] Injected SupplierRestockManager component.`);
  }

  // 2. Add Supplier Restock to Admin tabs list
  const oldTabsList = `{id:"broadcast",label:"📢 Telegram Broadcast",icon:af}`;
  const newTabsList = `{id:"supplier_restock",label:"⚡ Supplier Restock",icon:cw},{id:"broadcast",label:"📢 Telegram Broadcast",icon:af}`;
  if (code.includes(oldTabsList) && !code.includes('id:"supplier_restock"')) {
    code = code.replace(oldTabsList, newTabsList);
    console.log(`[${filePath}] Added supplier_restock to admin tabs.`);
  }

  // 3. Add to Quick Nav tabs
  const oldQuickNav = `{id:"broadcast",label:"📢 Broadcast"}`;
  const newQuickNav = `{id:"supplier_restock",label:"⚡ Restock Webhooks"},{id:"broadcast",label:"📢 Broadcast"}`;
  if (code.includes(oldQuickNav) && !code.includes('id:"supplier_restock",label:"⚡ Restock Webhooks"')) {
    code = code.replace(oldQuickNav, newQuickNav);
    console.log(`[${filePath}] Added supplier_restock to Quick Nav.`);
  }

  // 4. Render SupplierRestockManager on tab switch
  const oldTabRender = `l==="broadcast"&&r.jsx(hne,{})`;
  const newTabRender = `l==="supplier_restock"&&r.jsx(SupplierRestockManager,{})` + ',' + `l==="broadcast"&&r.jsx(hne,{})`;
  if (code.includes(oldTabRender) && !code.includes('SupplierRestockManager')) {
    code = code.replace(oldTabRender, newTabRender);
    console.log(`[${filePath}] Rendered SupplierRestockManager on tab selection.`);
  }

  // Validate syntax
  try {
    esbuild.transformSync(code, { loader: 'js' });
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`[${filePath}] VALIDATED & SAVED successfully!`);
  } catch (err) {
    console.error(`[${filePath}] Syntax validation failed:`, err);
    process.exit(1);
  }
}
