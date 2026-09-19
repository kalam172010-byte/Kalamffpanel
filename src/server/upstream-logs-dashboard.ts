import { upstreamLogger } from './upstream-logger';
import type { UpstreamLogEntry, UpstreamLogStats } from '../types';

export function renderUpstreamLogsDashboardHtml(initialSearch: string = '', initialStatus: string = 'ALL'): string {
  const stats = upstreamLogger.getStats();
  const logsResult = upstreamLogger.getLogs({ limit: 100, search: initialSearch, status: initialStatus });
  const logs = logsResult.logs;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <title>Upstream API Request Logs — KALAM FF PANEL</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #07070c;
      --panel-bg: #0e0e18;
      --card-bg: #131322;
      --card-hover: #18182d;
      --border: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(0, 229, 255, 0.3);
      --cyan: #00e5ff;
      --cyan-glow: rgba(0, 229, 255, 0.15);
      --emerald: #10b981;
      --emerald-glow: rgba(16, 185, 129, 0.15);
      --rose: #f43f5e;
      --rose-glow: rgba(244, 63, 94, 0.15);
      --amber: #fbbf24;
      --purple: #a855f7;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --font-main: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-main);
      min-height: 100vh;
      padding: 24px 20px 80px 20px;
      line-height: 1.5;
      background-image: 
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 229, 255, 0.07), transparent),
        radial-gradient(ellipse 60% 40% at 85% 15%, rgba(168, 85, 247, 0.05), transparent);
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Top Navigation */
    .nav-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 20px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--border);
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #00e5ff 0%, #0077b6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
    }

    .brand-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(to right, #fff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-subtitle {
      font-size: 12px;
      color: var(--text-dim);
      display: block;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .nav-link {
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      text-decoration: none;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .nav-link:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .nav-link.active {
      color: var(--cyan);
      background: var(--cyan-glow);
      border-color: var(--cyan);
    }

    /* Header Banner */
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 24px;
    }

    .header-text h1 {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
      color: #fff;
    }

    .header-text p {
      color: var(--text-muted);
      font-size: 14px;
      max-width: 680px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: none;
      transition: all 0.2s ease;
      font-family: var(--font-main);
    }

    .btn:active {
      transform: scale(0.98);
    }

    .btn-cyan {
      background: var(--cyan);
      color: #07070c;
      box-shadow: 0 0 20px rgba(0, 229, 255, 0.35);
    }
    .btn-cyan:hover {
      background: #33ebff;
      box-shadow: 0 0 25px rgba(0, 229, 255, 0.5);
    }

    .btn-emerald {
      background: var(--emerald);
      color: #07070c;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
    }
    .btn-emerald:hover {
      background: #34d399;
    }

    .btn-dark {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-dark:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .btn-danger {
      background: rgba(244, 63, 94, 0.12);
      color: var(--rose);
      border: 1px solid rgba(244, 63, 94, 0.3);
    }
    .btn-danger:hover {
      background: rgba(244, 63, 94, 0.25);
    }

    /* Stats KPI Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }

    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px 20px;
      position: relative;
      overflow: hidden;
      transition: border-color 0.2s;
    }

    .stat-card:hover {
      border-color: rgba(255, 255, 255, 0.15);
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
    }

    .stat-card.c-cyan::before { background: var(--cyan); }
    .stat-card.c-emerald::before { background: var(--emerald); }
    .stat-card.c-rose::before { background: var(--rose); }
    .stat-card.c-amber::before { background: var(--amber); }
    .stat-card.c-purple::before { background: var(--purple); }

    .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
      color: var(--text-dim);
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-val {
      font-size: 28px;
      font-weight: 800;
      font-family: var(--font-mono);
      letter-spacing: -0.03em;
      color: #fff;
    }

    .stat-val.c-cyan { color: var(--cyan); }
    .stat-val.c-emerald { color: var(--emerald); }
    .stat-val.c-rose { color: var(--rose); }
    .stat-val.c-amber { color: var(--amber); }
    .stat-val.c-purple { color: var(--purple); }

    .stat-sub {
      font-size: 12px;
      color: var(--text-dim);
      margin-top: 4px;
    }

    /* Live Test Simulation Box */
    .test-box {
      background: linear-gradient(145deg, #0e0e1a 0%, #151528 100%);
      border: 1px solid rgba(0, 229, 255, 0.2);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }

    .test-box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      cursor: pointer;
    }

    .test-box-title {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .test-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
      align-items: flex-end;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
    }

    .form-input, .form-select {
      background: #090912;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 10px 12px;
      color: #fff;
      font-size: 13px;
      font-family: var(--font-mono);
      outline: none;
      transition: border-color 0.2s;
    }

    .form-input:focus, .form-select:focus {
      border-color: var(--cyan);
      box-shadow: 0 0 10px rgba(0, 229, 255, 0.2);
    }

    /* Filters Bar */
    .filters-section {
      background: var(--panel-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px 20px;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .search-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .search-input-wrap {
      flex: 1;
      min-width: 280px;
      position: relative;
    }

    .search-input {
      width: 100%;
      background: #07070d;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 16px 10px 38px;
      color: #fff;
      font-size: 14px;
      font-family: var(--font-main);
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      border-color: var(--cyan);
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-dim);
      pointer-events: none;
    }

    .filter-pills-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .filter-group-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-dim);
      margin-right: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .pill {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .pill:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    .pill.active {
      background: var(--cyan);
      color: #07070c;
      border-color: var(--cyan);
      font-weight: 700;
      box-shadow: 0 0 12px rgba(0, 229, 255, 0.35);
    }

    .pill.active.pill-emerald {
      background: var(--emerald);
      color: #07070c;
      border-color: var(--emerald);
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
    }

    .pill.active.pill-rose {
      background: var(--rose);
      color: #fff;
      border-color: var(--rose);
      box-shadow: 0 0 12px rgba(244, 63, 94, 0.35);
    }

    /* Logs Table / Cards */
    .logs-container {
      background: var(--panel-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
    }

    .logs-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.01);
    }

    .logs-title {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }

    .logs-count {
      font-size: 12px;
      color: var(--text-dim);
      font-family: var(--font-mono);
    }

    .log-item {
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;
    }

    .log-item:last-child {
      border-bottom: none;
    }

    .log-item:hover {
      background: var(--card-hover);
    }

    .log-row-summary {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      cursor: pointer;
      user-select: none;
    }

    .log-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
      min-width: 0;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      font-family: var(--font-mono);
      white-space: nowrap;
      shrink: 0;
    }

    .status-badge.status-200 {
      background: var(--emerald-glow);
      color: var(--emerald);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .status-badge.status-4xx {
      background: rgba(251, 191, 36, 0.1);
      color: var(--amber);
      border: 1px solid rgba(251, 191, 36, 0.3);
    }

    .status-badge.status-5xx, .status-badge.status-fail {
      background: var(--rose-glow);
      color: var(--rose);
      border: 1px solid rgba(244, 63, 94, 0.3);
    }

    .log-main-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .log-title-line {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .log-api-name {
      font-weight: 700;
      font-size: 14px;
      color: #fff;
    }

    .tag {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text-muted);
    }

    .tag-context {
      background: rgba(0, 229, 255, 0.08);
      color: var(--cyan);
      border-color: rgba(0, 229, 255, 0.2);
    }

    .tag-key {
      background: rgba(16, 185, 129, 0.1);
      color: var(--emerald);
      border-color: rgba(16, 185, 129, 0.3);
      font-family: var(--font-mono);
    }

    .log-url {
      font-size: 12px;
      font-family: var(--font-mono);
      color: var(--text-dim);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 600px;
    }

    .log-right {
      display: flex;
      align-items: center;
      gap: 20px;
      shrink: 0;
    }

    .log-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      font-size: 12px;
    }

    .log-time {
      color: var(--text-muted);
      font-weight: 600;
    }

    .log-latency {
      font-family: var(--font-mono);
      color: var(--cyan);
      font-size: 11px;
    }

    .expand-chevron {
      color: var(--text-dim);
      font-size: 16px;
      transition: transform 0.2s;
    }

    .log-item.expanded .expand-chevron {
      transform: rotate(180deg);
      color: var(--cyan);
    }

    /* Expanded Details Drawer */
    .log-details-panel {
      display: none;
      padding: 0 20px 20px 20px;
      background: #090912;
      border-top: 1px dashed var(--border);
    }

    .log-item.expanded .log-details-panel {
      display: block;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .code-block-card {
      background: #050508;
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }

    .code-header {
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .code-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-copy {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border);
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-copy:hover {
      background: var(--cyan);
      color: #07070c;
      border-color: var(--cyan);
    }

    pre.code-content {
      padding: 14px;
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.6;
      color: #cbd5e1;
      overflow-x: auto;
      max-height: 320px;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .analysis-box {
      background: rgba(0, 229, 255, 0.03);
      border: 1px solid rgba(0, 229, 255, 0.15);
      border-radius: 12px;
      padding: 16px;
      margin-top: 16px;
    }

    .analysis-box.analysis-error {
      background: rgba(244, 63, 94, 0.04);
      border-color: rgba(244, 63, 94, 0.25);
    }

    .analysis-title {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .analysis-desc {
      font-size: 13px;
      color: var(--text-muted);
    }

    /* Empty state */
    .empty-state {
      padding: 60px 20px;
      text-align: center;
      color: var(--text-dim);
    }

    .empty-icon {
      font-size: 40px;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    /* Auto-refresh indicator */
    .refresh-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--emerald);
      font-weight: 600;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--emerald);
      box-shadow: 0 0 8px var(--emerald);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }

    @media (max-width: 768px) {
      body { padding: 16px 12px; }
      .header-section { flex-direction: column; }
      .log-row-summary { flex-direction: column; align-items: flex-start; }
      .log-right { width: 100%; justify-content: space-between; margin-top: 8px; }
      .details-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Navigation Bar -->
    <div class="nav-bar">
      <div class="nav-brand">
        <div class="brand-icon">📡</div>
        <div>
          <span class="brand-title">KALAM FF PANEL</span>
          <span class="brand-subtitle">Upstream Gateway & Supplier Debug Center</span>
        </div>
      </div>
      <div class="nav-links">
        <a href="/" class="nav-link">🏠 Storefront</a>
        <a href="/diagnostics/inventory?format=html" class="nav-link">⚡ Inventory Diagnostics</a>
        <a href="/admin/bot-health" class="nav-link">🤖 Bot Health</a>
        <a href="/admin/upstream-logs" class="nav-link active">📡 Upstream API Logs</a>
        <span class="refresh-badge">
          <span class="pulse-dot"></span>
          Live Monitoring Active
        </span>
      </div>
    </div>

    <!-- Header Section -->
    <div class="header-section">
      <div class="header-text">
        <h1>📡 Upstream API Request Logs</h1>
        <p>Live, real-time inspection of all outbound license key requests sent to supplier providers (AdminPanels, Custom Reseller API #2, HKMODZ). Inspect full payload parameters, timestamps, HTTP status codes, latency, and raw response bodies.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-cyan" onclick="toggleTestPanel()">🧪 Test Upstream API</button>
        <a href="/api/admin/upstream-logs/export?format=json" target="_blank" class="btn btn-dark">📥 Export JSON</a>
        <a href="/api/admin/upstream-logs/export?format=csv" target="_blank" class="btn btn-dark">📊 Export CSV</a>
        <button class="btn btn-danger" onclick="clearLogs()">🗑️ Clear Logs</button>
        <button class="btn btn-emerald" onclick="location.reload()">⟳ Refresh</button>
      </div>
    </div>

    <!-- Stats KPI Grid -->
    <div class="stats-grid">
      <div class="stat-card c-cyan">
        <div class="stat-label">
          <span>Total Requests</span>
          <span>📡</span>
        </div>
        <div class="stat-val c-cyan" id="stat-total">${stats.totalRequests}</div>
        <div class="stat-sub">${stats.todayRequestsCount} requests processed today</div>
      </div>

      <div class="stat-card c-emerald">
        <div class="stat-label">
          <span>Success Rate</span>
          <span>⚡</span>
        </div>
        <div class="stat-val c-emerald" id="stat-rate">${stats.successRatePercent}%</div>
        <div class="stat-sub">${stats.successCount} successful / ${stats.failCount} failed</div>
      </div>

      <div class="stat-card c-purple">
        <div class="stat-label">
          <span>Keys Delivered</span>
          <span>🔑</span>
        </div>
        <div class="stat-val c-purple" id="stat-keys">${stats.deliveredKeysCount}</div>
        <div class="stat-sub">Directly generated via Upstream API</div>
      </div>

      <div class="stat-card c-amber">
        <div class="stat-label">
          <span>Average Latency</span>
          <span>⏱️</span>
        </div>
        <div class="stat-val c-amber" id="stat-lat">${stats.avgLatencyMs} ms</div>
        <div class="stat-sub">Network round-trip response time</div>
      </div>

      <div class="stat-card c-rose">
        <div class="stat-label">
          <span>Failures / Retries</span>
          <span>⚠️</span>
        </div>
        <div class="stat-val c-rose" id="stat-fails">${stats.failCount}</div>
        <div class="stat-sub">${stats.lastError ? `Last error: ${stats.lastError.slice(0, 32)}...` : 'All upstream systems nominal'}</div>
      </div>
    </div>

    <!-- Live Test Simulation Panel (Collapsible) -->
    <div class="test-box" id="test-panel" style="display: none;">
      <div class="test-box-header" onclick="toggleTestPanel()">
        <div class="test-box-title">
          <span>🧪 Live Upstream API Diagnostic Tester</span>
        </div>
        <span style="font-size: 13px; color: var(--cyan);">✕ Close Panel</span>
      </div>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">Trigger an immediate live API test request to your configured upstream providers or a custom URL to test credentials and view the full request body and response logs in real time.</p>
      <form id="test-form" onsubmit="submitTestRequest(event)" class="test-form">
        <div class="form-group">
          <label class="form-label">Target Provider / Endpoint</label>
          <select id="test-provider" class="form-select" onchange="handleProviderChange()">
            <option value="adminpanels">AdminPanels API (Default API #1)</option>
            <option value="custom_api2">API #2 (Custom / HKMODZ Reseller)</option>
            <option value="custom_url">Custom Test URL...</option>
          </select>
        </div>

        <div class="form-group" id="group-custom-url" style="display: none;">
          <label class="form-label">Custom Endpoint URL</label>
          <input type="text" id="test-url" class="form-input" placeholder="https://api.example.com/buy" />
        </div>

        <div class="form-group">
          <label class="form-label">Remote Product ID</label>
          <input type="text" id="test-pid" class="form-input" value="FF_VIP_PRO_MAX" required />
        </div>

        <div class="form-group">
          <label class="form-label">Plan Duration</label>
          <select id="test-dur" class="form-select">
            <option value="1 Day">1 Day</option>
            <option value="7 Days">7 Days</option>
            <option value="30 Days">30 Days</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Quantity</label>
          <input type="number" id="test-qty" class="form-input" value="1" min="1" max="10" />
        </div>

        <div class="form-group">
          <button type="submit" id="test-btn" class="btn btn-cyan" style="width: 100%; justify-content: center;">
            🚀 Dispatch Test Request
          </button>
        </div>
      </form>
      <div id="test-result-box" style="margin-top: 14px; display: none;"></div>
    </div>

    <!-- Filters & Search Section -->
    <div class="filters-section">
      <div class="search-row">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            id="search-input" 
            class="search-input" 
            placeholder="Search logs by Product ID, URL, Request Body, Response Text, Delivered Key, or Error..." 
            value="${initialSearch}"
            oninput="handleSearch(this.value)"
          />
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-dark" onclick="resetFilters()">↺ Reset Filters</button>
        </div>
      </div>

      <div class="filter-pills-group">
        <span class="filter-group-label">Status:</span>
        <button class="pill ${initialStatus === 'ALL' ? 'active' : ''}" onclick="setStatusFilter('ALL')">All Logs</button>
        <button class="pill pill-emerald ${initialStatus === 'SUCCESS' ? 'active' : ''}" onclick="setStatusFilter('SUCCESS')">🟢 200 OK / Success</button>
        <button class="pill pill-rose ${initialStatus === 'FAILED' ? 'active' : ''}" onclick="setStatusFilter('FAILED')">🔴 Failed / Errors</button>
        <button class="pill ${initialStatus === '4XX' ? 'active' : ''}" onclick="setStatusFilter('4XX')">🟡 4xx Bad Request</button>
        <button class="pill ${initialStatus === '5XX' ? 'active' : ''}" onclick="setStatusFilter('5XX')">🟣 5xx Gateway Glitch</button>
        <button class="pill ${initialStatus === 'TIMEOUT' ? 'active' : ''}" onclick="setStatusFilter('TIMEOUT')">⏱️ Network Timeout</button>
      </div>

      <div class="filter-pills-group">
        <span class="filter-group-label">Context:</span>
        <button class="pill active" onclick="setContextFilter('ALL')">All Contexts</button>
        <button class="pill" onclick="setContextFilter('Web Store')">🛒 Web Store</button>
        <button class="pill" onclick="setContextFilter('Telegram')">🤖 Telegram Bot</button>
        <button class="pill" onclick="setContextFilter('Restock')">🔄 Auto Restock</button>
        <button class="pill" onclick="setContextFilter('Diagnostic')">🛠️ Diagnostic Test</button>
      </div>
    </div>

    <!-- Logs Container -->
    <div class="logs-container">
      <div class="logs-header">
        <div class="logs-title">📋 Upstream Key Request History</div>
        <div class="logs-count">Showing <span id="count-visible">${logs.length}</span> of <span id="count-total">${stats.totalRequests}</span> recorded entries</div>
      </div>

      <div id="logs-list">
        ${renderLogsRows(logs)}
      </div>
    </div>
  </div>

  <script>
    let currentSearch = '${initialSearch}';
    let currentStatus = '${initialStatus}';
    let currentContext = 'ALL';
    let currentProvider = 'ALL';
    let autoRefreshInterval = null;

    function toggleTestPanel() {
      const panel = document.getElementById('test-panel');
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      if (panel.style.display === 'block') {
        panel.scrollIntoView({ behavior: 'smooth' });
      }
    }

    function handleProviderChange() {
      const sel = document.getElementById('test-provider').value;
      const customUrlGroup = document.getElementById('group-custom-url');
      if (sel === 'custom_url') {
        customUrlGroup.style.display = 'flex';
      } else {
        customUrlGroup.style.display = 'none';
      }
    }

    async function submitTestRequest(e) {
      e.preventDefault();
      const btn = document.getElementById('test-btn');
      const resultBox = document.getElementById('test-result-box');
      btn.disabled = true;
      btn.innerText = '⏳ Dispatching...';
      resultBox.style.display = 'block';
      resultBox.innerHTML = '<div style="padding: 12px; background: rgba(0,229,255,0.08); border-radius: 8px; color: var(--cyan);">Connecting to Upstream Gateway...</div>';

      try {
        const provider = document.getElementById('test-provider').value;
        const customUrl = document.getElementById('test-url').value;
        const productId = document.getElementById('test-pid').value;
        const duration = document.getElementById('test-dur').value;
        const quantity = parseInt(document.getElementById('test-qty').value) || 1;

        const res = await fetch('/api/admin/upstream-logs/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, customUrl, productId, duration, quantity })
        });

        const data = await res.json();
        if (data.success) {
          resultBox.innerHTML = \`
            <div style="padding: 14px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 10px; color: var(--emerald);">
              <strong>✅ Upstream Test Successful!</strong><br/>
              HTTP Status: <b>\${data.log.responseStatus}</b> | Latency: <b>\${data.log.latencyMs}ms</b><br/>
              \${data.log.deliveredKey ? \`Generated Key: <code style="background: #000; padding: 2px 6px; border-radius: 4px; color: #fff;">\${data.log.deliveredKey}</code>\` : 'No key parsed, but request returned status 200.'}
            </div>
          \`;
        } else {
          resultBox.innerHTML = \`
            <div style="padding: 14px; background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.3); border-radius: 10px; color: var(--rose);">
              <strong>⚠️ Upstream Request Failed:</strong> \${data.error || 'Unknown error'}<br/>
              HTTP Status: <b>\${data.log?.responseStatus || 'None'}</b> | Latency: <b>\${data.log?.latencyMs || 0}ms</b>
            </div>
          \`;
        }

        // Refresh logs list
        fetchLogs();
      } catch (err) {
        resultBox.innerHTML = '<div style="padding: 12px; background: rgba(244,63,94,0.1); border-radius: 8px; color: var(--rose);">Network test error: ' + err.message + '</div>';
      } finally {
        btn.disabled = false;
        btn.innerText = '🚀 Dispatch Test Request';
      }
    }

    function toggleLogExpand(element) {
      const item = element.closest('.log-item');
      item.classList.toggle('expanded');
    }

    function copyToClipboard(text, btnElement) {
      navigator.clipboard.writeText(text).then(() => {
        const oldText = btnElement.innerText;
        btnElement.innerText = '✅ Copied!';
        btnElement.style.color = 'var(--emerald)';
        setTimeout(() => {
          btnElement.innerText = oldText;
          btnElement.style.color = '';
        }, 2000);
      });
    }

    let searchTimeout = null;
    function handleSearch(val) {
      currentSearch = val;
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        fetchLogs();
      }, 250);
    }

    function setStatusFilter(status) {
      currentStatus = status;
      document.querySelectorAll('.filter-pills-group:nth-child(2) .pill').forEach(el => el.classList.remove('active'));
      event.target.classList.add('active');
      fetchLogs();
    }

    function setContextFilter(context) {
      currentContext = context;
      document.querySelectorAll('.filter-pills-group:nth-child(3) .pill').forEach(el => el.classList.remove('active'));
      event.target.classList.add('active');
      fetchLogs();
    }

    function resetFilters() {
      currentSearch = '';
      currentStatus = 'ALL';
      currentContext = 'ALL';
      document.getElementById('search-input').value = '';
      document.querySelectorAll('.pill').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.filter-pills-group .pill:first-of-type').forEach(el => el.classList.add('active'));
      fetchLogs();
    }

    async function clearLogs() {
      if (!confirm('Are you sure you want to clear all Upstream API request logs?')) return;
      try {
        await fetch('/api/admin/upstream-logs/clear', { method: 'POST' });
        fetchLogs();
      } catch (e) {
        alert('Failed to clear logs: ' + e.message);
      }
    }

    async function fetchLogs() {
      try {
        const query = new URLSearchParams({
          search: currentSearch,
          status: currentStatus,
          context: currentContext,
          limit: '100'
        });

        const [logsRes, statsRes] = await Promise.all([
          fetch('/api/admin/upstream-logs?' + query.toString()),
          fetch('/api/admin/upstream-logs/stats')
        ]);

        const logsData = await logsRes.json();
        const statsData = await statsRes.json();

        // Update stats KPI
        if (statsData.success && statsData.stats) {
          const s = statsData.stats;
          document.getElementById('stat-total').innerText = s.totalRequests;
          document.getElementById('stat-rate').innerText = s.successRatePercent + '%';
          document.getElementById('stat-keys').innerText = s.deliveredKeysCount;
          document.getElementById('stat-lat').innerText = s.avgLatencyMs + ' ms';
          document.getElementById('stat-fails').innerText = s.failCount;
          document.getElementById('count-total').innerText = s.totalRequests;
        }

        // Render logs
        if (logsData.success && Array.isArray(logsData.logs)) {
          document.getElementById('count-visible').innerText = logsData.logs.length;
          document.getElementById('logs-list').innerHTML = renderLogsHtml(logsData.logs);
        }
      } catch (err) {
        console.warn('[UpstreamLogs] Fetch error:', err);
      }
    }

    function renderLogsHtml(logs) {
      if (!logs || logs.length === 0) {
        return '<div class="empty-state"><div class="empty-icon">📭</div><h3>No Upstream API Logs Match Your Filter</h3><p style="margin-top:4px;">Try searching for a different term or reset filters.</p></div>';
      }

      return logs.map(l => {
        const statusClass = l.success && l.responseStatus === 200 ? 'status-200' : (l.responseStatus >= 400 && l.responseStatus < 500 ? 'status-4xx' : 'status-fail');
        const statusText = l.responseStatus ? \`HTTP \${l.responseStatus}\` : 'NETWORK ERR';
        const formattedJson = (str) => {
          try {
            return JSON.stringify(typeof str === 'object' ? str : JSON.parse(str), null, 2);
          } catch {
            return str || '(empty)';
          }
        };

        const keyBadge = l.deliveredKey ? \`<span class="tag tag-key">🔑 \${l.deliveredKey}</span>\` : '';
        const pidBadge = l.productInfo?.productId ? \`<span class="tag">📦 \${l.productInfo.productId}</span>\` : '';

        return \`
          <div class="log-item" id="\${l.id}">
            <div class="log-row-summary" onclick="toggleLogExpand(this)">
              <div class="log-left">
                <span class="status-badge \${statusClass}">
                  \${l.success ? '✓' : '✗'} \${statusText}
                </span>
                <div class="log-main-info">
                  <div class="log-title-line">
                    <span class="log-api-name">\${l.apiName}</span>
                    <span class="tag tag-context">\${l.callerContext}</span>
                    \${pidBadge}
                    \${keyBadge}
                  </div>
                  <div class="log-url">\${l.method} \${l.url}</div>
                </div>
              </div>
              <div class="log-right">
                <div class="log-meta">
                  <span class="log-time">\${l.formattedTime || l.timestamp}</span>
                  <span class="log-latency">\${l.latencyMs}ms (\${l.attempts || 1} att)</span>
                </div>
                <span class="expand-chevron">▼</span>
              </div>
            </div>

            <div class="log-details-panel">
              <div class="details-grid">
                <!-- Request Box -->
                <div class="code-block-card">
                  <div class="code-header">
                    <div class="code-title">
                      <span>📤 Request Payload (Body)</span>
                    </div>
                    <button class="btn-copy" onclick="copyToClipboard(decodeURIComponent('\${encodeURIComponent(l.requestBodyRaw || '')}'), this)">
                      📋 Copy Body
                    </button>
                  </div>
                  <pre class="code-content">\${formattedJson(l.requestBodyParsed || l.requestBodyRaw)}</pre>
                </div>

                <!-- Response Box -->
                <div class="code-block-card">
                  <div class="code-header">
                    <div class="code-title">
                      <span>📥 Supplier Response (Body)</span>
                    </div>
                    <button class="btn-copy" onclick="copyToClipboard(decodeURIComponent('\${encodeURIComponent(l.responseBodyRaw || '')}'), this)">
                      📋 Copy Response
                    </button>
                  </div>
                  <pre class="code-content">\${formattedJson(l.responseBodyParsed || l.responseBodyRaw)}</pre>
                </div>
              </div>

              <!-- Root Cause & Diagnostic Breakdown -->
              <div class="analysis-box \${l.success ? '' : 'analysis-error'}">
                <div class="analysis-title">
                  <span>\${l.success ? '✅ Execution Summary' : '⚠️ Root Cause & Debug Recommendation'}</span>
                </div>
                <div class="analysis-desc">
                  \${l.success 
                    ? \`Request completed successfully in \${l.latencyMs}ms. Upstream provider validated credentials and returned valid license key payload.\`
                    : \`<b>Failure Reason:</b> \${l.errorMessage || l.networkError || 'Upstream provider returned an error response.'}<br/><br/><b>Debugging Tip:</b> Verify your remote Product ID mapping in Manage Products and ensure your API Master Key in API Settings is active.\`
                  }
                </div>
              </div>
            </div>
          </div>
        \`;
      }).join('');
    }

    // Auto-refresh logs every 8 seconds
    setInterval(() => {
      fetchLogs();
    }, 8000);
  </script>
</body>
</html>`;
}

function renderLogsRows(logs: UpstreamLogEntry[]): string {
  if (!logs || logs.length === 0) {
    return `<div class="empty-state"><div class="empty-icon">📭</div><h3>No Upstream API Logs Found</h3><p style="margin-top:4px;">When keys are dispatched via upstream APIs, full request bodies and responses will appear here.</p></div>`;
  }

  return logs.map(l => {
    const statusClass = l.success && l.responseStatus === 200 ? 'status-200' : (l.responseStatus >= 400 && l.responseStatus < 500 ? 'status-4xx' : 'status-fail');
    const statusText = l.responseStatus ? `HTTP ${l.responseStatus}` : 'NETWORK ERR';
    const formattedJson = (str: any) => {
      try {
        return JSON.stringify(typeof str === 'object' ? str : JSON.parse(str), null, 2);
      } catch {
        return str || '(empty)';
      }
    };

    const keyBadge = l.deliveredKey ? `<span class="tag tag-key">🔑 ${l.deliveredKey}</span>` : '';
    const pidBadge = l.productInfo?.productId ? `<span class="tag">📦 ${l.productInfo.productId}</span>` : '';

    return `
      <div class="log-item" id="${l.id}">
        <div class="log-row-summary" onclick="toggleLogExpand(this)">
          <div class="log-left">
            <span class="status-badge ${statusClass}">
              ${l.success ? '✓' : '✗'} ${statusText}
            </span>
            <div class="log-main-info">
              <div class="log-title-line">
                <span class="log-api-name">${l.apiName}</span>
                <span class="tag tag-context">${l.callerContext}</span>
                ${pidBadge}
                ${keyBadge}
              </div>
              <div class="log-url">${l.method} ${l.url}</div>
            </div>
          </div>
          <div class="log-right">
            <div class="log-meta">
              <span class="log-time">${l.formattedTime || l.timestamp}</span>
              <span class="log-latency">${l.latencyMs}ms (${l.attempts || 1} att)</span>
            </div>
            <span class="expand-chevron">▼</span>
          </div>
        </div>

        <div class="log-details-panel">
          <div class="details-grid">
            <!-- Request Box -->
            <div class="code-block-card">
              <div class="code-header">
                <div class="code-title">
                  <span>📤 Request Payload (Body)</span>
                </div>
                <button class="btn-copy" onclick="copyToClipboard(decodeURIComponent('${encodeURIComponent(l.requestBodyRaw || '')}'), this)">
                  📋 Copy Body
                </button>
              </div>
              <pre class="code-content">${escapeHtml(formattedJson(l.requestBodyParsed || l.requestBodyRaw))}</pre>
            </div>

            <!-- Response Box -->
            <div class="code-block-card">
              <div class="code-header">
                <div class="code-title">
                  <span>📥 Supplier Response (Body)</span>
                </div>
                <button class="btn-copy" onclick="copyToClipboard(decodeURIComponent('${encodeURIComponent(l.responseBodyRaw || '')}'), this)">
                  📋 Copy Response
                </button>
              </div>
              <pre class="code-content">${escapeHtml(formattedJson(l.responseBodyParsed || l.responseBodyRaw))}</pre>
            </div>
          </div>

          <!-- Root Cause & Diagnostic Breakdown -->
          <div class="analysis-box ${l.success ? '' : 'analysis-error'}">
            <div class="analysis-title">
              <span>${l.success ? '✅ Execution Summary' : '⚠️ Root Cause & Debug Recommendation'}</span>
            </div>
            <div class="analysis-desc">
              ${l.success 
                ? `Request completed successfully in ${l.latencyMs}ms. Upstream provider validated credentials and returned valid license key payload.`
                : `<b>Failure Reason:</b> ${escapeHtml(l.errorMessage || l.networkError || 'Upstream provider returned an error response.')}<br/><br/><b>Debugging Tip:</b> Verify your remote Product ID mapping in Manage Products and ensure your API Master Key in API Settings is active.`
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
