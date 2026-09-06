import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { INITIAL_API_CONFIGS } from '../lib/mock-data';

export interface PlanInventoryDetail {
  planId: string;
  duration: string;
  price: number;
  manualStockCount: number;
  status: 'IN_STOCK_MANUAL' | 'IN_STOCK_LIVE_API' | 'OUT_OF_STOCK';
}

export interface UpstreamProductMapping {
  isMapped: boolean;
  remoteProductId?: string;
  remoteDuration?: string;
  upstreamType: 'adminpanels' | 'hkmodz';
  upstreamName: string;
  upstreamStatus: 'CONNECTED' | 'DISCONNECTED' | 'UNCONFIGURED';
  hasValidCredentials: boolean;
  isOperationallyReady: boolean;
  issues: string[];
}

export interface ProductInventoryDiagnostic {
  productId: string;
  name: string;
  game: string;
  status: 'ACTIVE' | 'INACTIVE';
  category: string;
  totalManualKeys: number;
  plansCount: number;
  plans: PlanInventoryDetail[];
  upstreamApi1: UpstreamProductMapping;
  upstreamApi2: UpstreamProductMapping;
  overallStockState: 'IN_STOCK_MANUAL' | 'IN_STOCK_LIVE_API' | 'OUT_OF_STOCK';
  isOutOfStock: boolean;
  outOfStockReasons: string[];
  actionableRecommendations: string[];
}

export interface InventoryDiagnosticsReport {
  timestamp: string;
  summary: {
    totalProducts: number;
    inStockManualCount: number;
    inStockLiveApiCount: number;
    outOfStockCount: number;
    totalManualKeysInInventory: number;
    activeProductsCount: number;
  };
  cacheDiagnostics: {
    globalProductsCacheCount: number;
    diskProductsCount: number;
    isCacheInSyncWithDisk: boolean;
    storagePath: string;
  };
  upstreamApiStatuses: {
    api1: {
      id: string;
      name: string;
      type: string;
      apiUrl: string;
      status: string;
      hasApiKey: boolean;
      isPlaceholderKey: boolean;
      isOperationallyReady: boolean;
      pingResult?: {
        tested: boolean;
        httpStatus?: number;
        ok?: boolean;
        latencyMs?: number;
        message?: string;
      };
    };
    api2: {
      id: string;
      name: string;
      type: string;
      apiUrl: string;
      status: string;
      hasToken: boolean;
      isPlaceholderToken: boolean;
      isOperationallyReady: boolean;
      pingResult?: {
        tested: boolean;
        httpStatus?: number;
        ok?: boolean;
        latencyMs?: number;
        message?: string;
      };
    };
  };
  products: ProductInventoryDiagnostic[];
}

const isPlaceholderKey = (k?: string) => {
  if (!k) return true;
  const t = String(k).trim();
  return t === '' || t === 'YOUR_API_KEY' || t === 'EMPTY' || t === '87224c074a021676364829b5b3f0686e';
};

const isPlaceholderToken = (tok?: string) => {
  if (!tok) return true;
  const t = String(tok).trim();
  return t === '' || t === 'YOUR_API_KEY' || t === 'EMPTY' || t.startsWith('HK_REST_');
};

export async function generateInventoryDiagnostics(
  globalProductsCache: any[],
  loadProductsFromDisk: () => any[],
  loadStoreDataFromDisk: () => any,
  testUpstream = false
): Promise<InventoryDiagnosticsReport> {
  const diskProducts = loadProductsFromDisk();
  const storeData = loadStoreDataFromDisk();
  const storedApiConfigs = Array.isArray(storeData.apiConfigs) && storeData.apiConfigs.length > 0
    ? storeData.apiConfigs
    : INITIAL_API_CONFIGS;

  // Resolve API 1 config (AdminPanels)
  const rawApi1 = storedApiConfigs.find((c: any) =>
    c.type === 'adminpanels' || c.id === 'api-1' || c.id === 'api-adminpanels' || c.id?.includes('adminpanels')
  ) || INITIAL_API_CONFIGS[0];

  // Resolve API 2 config (HKMODZ)
  const rawApi2 = storedApiConfigs.find((c: any) =>
    c.type === 'hkmodz' || c.id === 'api-2' || c.id === 'api-hkmodz' || c.id?.includes('hkmodz')
  ) || INITIAL_API_CONFIGS[1];

  const api1Status = rawApi1?.status || 'DISCONNECTED';
  const api1ApiKey = rawApi1?.apiKey || '';
  const api1IsPlaceholder = isPlaceholderKey(api1ApiKey);
  const api1Operational = api1Status === 'CONNECTED' && !api1IsPlaceholder && !!rawApi1?.apiUrl;

  const api2Status = rawApi2?.status || 'DISCONNECTED';
  const api2Token = rawApi2?.xApiToken || rawApi2?.apiKey || '';
  const api2IsPlaceholder = isPlaceholderToken(api2Token);
  const api2Operational = api2Status === 'CONNECTED' &&
    !api2IsPlaceholder &&
    !!rawApi2?.apiUrl &&
    !rawApi2.apiUrl.includes('hkmodz.site');

  let api1Ping: any = { tested: false };
  let api2Ping: any = { tested: false };

  if (testUpstream && rawApi1?.apiUrl) {
    const tStart = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(rawApi1.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Kalam-Inventory-Diagnostic/1.0'
        },
        body: 'action=ping',
        signal: controller.signal
      });
      clearTimeout(timer);
      api1Ping = {
        tested: true,
        httpStatus: res.status,
        ok: res.ok,
        latencyMs: Date.now() - tStart,
        message: `HTTP ${res.status} ${res.statusText}`
      };
    } catch (e: any) {
      api1Ping = {
        tested: true,
        ok: false,
        latencyMs: Date.now() - tStart,
        message: e.message || 'Connection error'
      };
    }
  }

  // Evaluate products from globalProductsCache (or fallback to disk)
  const effectiveProducts = (Array.isArray(globalProductsCache) && globalProductsCache.length > 0)
    ? globalProductsCache
    : diskProducts;

  let inStockManualTotal = 0;
  let inStockApiTotal = 0;
  let outOfStockTotal = 0;
  let totalKeysCount = 0;

  const evaluatedProducts: ProductInventoryDiagnostic[] = effectiveProducts.map((p: any) => {
    // 1. Manual inventory
    const manualKeys: string[] = Array.isArray(p.keys) ? p.keys : [];
    const planKeysMap: Record<string, string[]> = (p.planKeys && typeof p.planKeys === 'object') ? p.planKeys : {};
    
    // Sum keys across plans or root keys
    let productManualKeySum = manualKeys.length;
    const plansList = Array.isArray(p.plans) ? p.plans : [];

    plansList.forEach((plan: any) => {
      const planKeysArr = planKeysMap[plan.id];
      if (Array.isArray(planKeysArr)) {
        productManualKeySum = Math.max(productManualKeySum, planKeysArr.length);
      }
    });

    totalKeysCount += productManualKeySum;

    // 2. Upstream API 1 mapping analysis
    const api1Restock = p.api1Restock || p.api1;
    const api1RemotePid = api1Restock?.remoteProductId || (p.remoteProductId && p.apiChoice !== 'api2' ? p.remoteProductId : undefined);
    const api1RemoteDur = api1Restock?.remoteDuration;
    const api1IsMapped = !!(api1RemotePid && String(api1RemotePid).trim() !== '');

    const api1Issues: string[] = [];
    if (!api1IsMapped) {
      api1Issues.push('No Remote Product ID assigned in product settings.');
    }
    if (api1Status !== 'CONNECTED') {
      api1Issues.push(`Upstream API 1 server status is '${api1Status}' in API Settings.`);
    }
    if (api1IsPlaceholder) {
      api1Issues.push('Upstream API 1 is using a default placeholder API key (needs live provider key).');
    }

    const api1CanDeliver = api1IsMapped && api1Operational;

    // 3. Upstream API 2 mapping analysis
    const api2Restock = p.api2Restock || p.api2;
    const api2RemotePid = api2Restock?.remoteProductId || (p.remoteProductId && p.apiChoice === 'api2' ? p.remoteProductId : undefined);
    const api2RemoteDur = api2Restock?.remoteDuration;
    const api2IsMapped = !!(api2RemotePid && String(api2RemotePid).trim() !== '');

    const api2Issues: string[] = [];
    if (!api2IsMapped) {
      api2Issues.push('No Remote Product ID assigned in product settings.');
    }
    if (api2Status !== 'CONNECTED') {
      api2Issues.push(`Upstream API 2 server status is '${api2Status}' in API Settings.`);
    }
    if (api2IsPlaceholder) {
      api2Issues.push('Upstream API 2 token is missing or placeholder.');
    }
    if (rawApi2?.apiUrl?.includes('hkmodz.site')) {
      api2Issues.push('Upstream API 2 uses deprecated hkmodz.site domain; must use valid custom reseller panel endpoint.');
    }

    const api2CanDeliver = api2IsMapped && api2Operational;

    // 4. Plans breakdown
    const plansDetail: PlanInventoryDetail[] = plansList.map((plan: any) => {
      const pKeys = Array.isArray(planKeysMap[plan.id]) ? planKeysMap[plan.id] : manualKeys;
      const pStock = pKeys.length;

      let pStatus: 'IN_STOCK_MANUAL' | 'IN_STOCK_LIVE_API' | 'OUT_OF_STOCK' = 'OUT_OF_STOCK';
      if (pStock > 0) {
        pStatus = 'IN_STOCK_MANUAL';
      } else if (api1CanDeliver || api2CanDeliver || api1IsMapped || api2IsMapped) {
        pStatus = 'IN_STOCK_LIVE_API';
      }

      return {
        planId: plan.id,
        duration: plan.duration || 'Unknown Duration',
        price: Number(plan.price) || 0,
        manualStockCount: pStock,
        status: pStatus
      };
    });

    // 5. Overall Stock State
    let overallStock: 'IN_STOCK_MANUAL' | 'IN_STOCK_LIVE_API' | 'OUT_OF_STOCK' = 'OUT_OF_STOCK';
    if (productManualKeySum > 0) {
      overallStock = 'IN_STOCK_MANUAL';
      inStockManualTotal++;
    } else if (api1IsMapped || api2IsMapped) {
      // Storefront checks if remoteProductId is defined
      overallStock = 'IN_STOCK_LIVE_API';
      inStockApiTotal++;
    } else {
      overallStock = 'OUT_OF_STOCK';
      outOfStockTotal++;
    }

    const isOos = overallStock === 'OUT_OF_STOCK';

    // 6. Reasons construction
    const reasons: string[] = [];
    const recommendations: string[] = [];

    if (p.status === 'INACTIVE' || p.status === 'inactive') {
      reasons.push('Product is set to INACTIVE in catalog.');
      recommendations.push('Enable product status to ACTIVE in Admin Panel > Products.');
    }

    if (productManualKeySum === 0) {
      reasons.push('Manual Inventory: 0 serial keys available (manual stock is empty).');
    } else {
      reasons.push(`Manual Inventory: ${productManualKeySum} keys available in stock.`);
    }

    if (!api1IsMapped && !api2IsMapped) {
      reasons.push('Upstream Restock: No Remote Product ID mapped for either API 1 (AdminPanels) or API 2 (HKMODZ).');
    } else {
      if (api1IsMapped) {
        reasons.push(`Upstream API 1 mapped: Remote Product ID '${api1RemotePid}' (Status: ${api1Status}).`);
      }
      if (api2IsMapped) {
        reasons.push(`Upstream API 2 mapped: Remote Product ID '${api2RemotePid}' (Status: ${api2Status}).`);
      }
    }

    if (isOos) {
      reasons.push('Automated Protection: Store disables purchase buttons when neither manual keys nor upstream remote product IDs exist.');
      recommendations.push(`Option A (Manual Stock): Open Admin Panel > Keys / Stock > Select '${p.name}' > Paste license keys.`);
      recommendations.push(`Option B (API Restock): Open Admin Panel > Products > Edit '${p.name}' > Enter Remote Product ID for API 1 or API 2.`);
    }

    return {
      productId: p.id,
      name: p.name || 'Unnamed Product',
      game: p.game || 'FREEFIRE',
      status: p.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      category: p.category || 'General',
      totalManualKeys: productManualKeySum,
      plansCount: plansList.length,
      plans: plansDetail,
      upstreamApi1: {
        isMapped: api1IsMapped,
        remoteProductId: api1RemotePid,
        remoteDuration: api1RemoteDur,
        upstreamType: 'adminpanels',
        upstreamName: rawApi1?.name || 'AdminPanels.shop',
        upstreamStatus: api1Status,
        hasValidCredentials: !api1IsPlaceholder,
        isOperationallyReady: api1Operational,
        issues: api1Issues
      },
      upstreamApi2: {
        isMapped: api2IsMapped,
        remoteProductId: api2RemotePid,
        remoteDuration: api2RemoteDur,
        upstreamType: 'hkmodz',
        upstreamName: rawApi2?.name || 'HK MODZ / Custom',
        upstreamStatus: api2Status,
        hasValidCredentials: !api2IsPlaceholder,
        isOperationallyReady: api2Operational,
        issues: api2Issues
      },
      overallStockState: overallStock,
      isOutOfStock: isOos,
      outOfStockReasons: reasons,
      actionableRecommendations: recommendations
    };
  });

  const DATA_DIR = path.join(process.cwd(), 'data');
  const PRODUCTS_FILE = path.join(DATA_DIR, 'products_db.json');

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalProducts: evaluatedProducts.length,
      inStockManualCount: inStockManualTotal,
      inStockLiveApiCount: inStockApiTotal,
      outOfStockCount: outOfStockTotal,
      totalManualKeysInInventory: totalKeysCount,
      activeProductsCount: evaluatedProducts.filter(p => p.status === 'ACTIVE').length
    },
    cacheDiagnostics: {
      globalProductsCacheCount: globalProductsCache.length,
      diskProductsCount: diskProducts.length,
      isCacheInSyncWithDisk: globalProductsCache.length === diskProducts.length,
      storagePath: PRODUCTS_FILE
    },
    upstreamApiStatuses: {
      api1: {
        id: rawApi1?.id || 'api-1',
        name: rawApi1?.name || 'AdminPanels.shop',
        type: rawApi1?.type || 'adminpanels',
        apiUrl: rawApi1?.apiUrl || '',
        status: api1Status,
        hasApiKey: !!api1ApiKey,
        isPlaceholderKey: api1IsPlaceholder,
        isOperationallyReady: api1Operational,
        pingResult: api1Ping
      },
      api2: {
        id: rawApi2?.id || 'api-2',
        name: rawApi2?.name || 'HK MODZ / Custom',
        type: rawApi2?.type || 'hkmodz',
        apiUrl: rawApi2?.apiUrl || '',
        status: api2Status,
        hasToken: !!api2Token,
        isPlaceholderToken: api2IsPlaceholder,
        isOperationallyReady: api2Operational,
        pingResult: api2Ping
      }
    },
    products: evaluatedProducts
  };
}

export function renderInventoryDiagnosticsHtml(report: InventoryDiagnosticsReport): string {
  const s = report.summary;
  const c = report.cacheDiagnostics;
  const apis = report.upstreamApiStatuses;

  const productRows = report.products.map(p => {
    const oosBadge = p.isOutOfStock
      ? '<span class="badge badge-oos">OUT OF STOCK</span>'
      : p.overallStockState === 'IN_STOCK_MANUAL'
        ? `<span class="badge badge-manual">${p.totalManualKeys} IN STOCK (MANUAL)</span>`
        : '<span class="badge badge-api">LIVE API DELIVERY</span>';

    const api1Badge = p.upstreamApi1.isMapped
      ? `<span class="tag tag-ok">API 1 Mapped: ${p.upstreamApi1.remoteProductId}</span>`
      : '<span class="tag tag-dim">API 1 Unmapped</span>';

    const api2Badge = p.upstreamApi2.isMapped
      ? `<span class="tag tag-ok">API 2 Mapped: ${p.upstreamApi2.remoteProductId}</span>`
      : '<span class="tag tag-dim">API 2 Unmapped</span>';

    const plansHtml = p.plans.map(pl => `
      <div class="plan-pill">
        <span class="plan-dur">${pl.duration}</span>
        <span class="plan-price">₹${pl.price}</span>
        <span class="plan-stock ${pl.manualStockCount > 0 ? 'stock-ok' : 'stock-zero'}">${pl.manualStockCount} keys</span>
      </div>
    `).join('');

    const reasonsHtml = p.outOfStockReasons.map(r => `<li>${r}</li>`).join('');
    const recsHtml = p.actionableRecommendations.map(r => `<li>${r}</li>`).join('');

    return `
      <div class="product-card ${p.isOutOfStock ? 'card-oos' : 'card-ok'}">
        <div class="card-header">
          <div class="card-title-group">
            <span class="game-tag">${p.game}</span>
            <h3 class="product-name">${p.name}</h3>
            <span class="product-id">ID: ${p.productId}</span>
          </div>
          <div class="card-status-group">
            ${oosBadge}
          </div>
        </div>

        <div class="card-body">
          <div class="section-title">Duration Plans & Stock Levels</div>
          <div class="plans-grid">${plansHtml}</div>

          <div class="section-title mt-3">Upstream Cross-Reference</div>
          <div class="tags-row">
            ${api1Badge}
            ${api2Badge}
          </div>

          <div class="reasons-box ${p.isOutOfStock ? 'box-oos' : 'box-ok'}">
            <div class="reasons-title">Stock Status Analysis & Reasons:</div>
            <ul class="reasons-list">${reasonsHtml}</ul>
            ${p.actionableRecommendations.length > 0 ? `
              <div class="recs-title">How to Resolve Out-of-Stock:</div>
              <ul class="recs-list">${recsHtml}</ul>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <title>Inventory & Stock Diagnostics — KALAM FF PANEL</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #07070c;
      --card-bg: #0d0d16;
      --border: rgba(255, 255, 255, 0.08);
      --cyan: #00e5ff;
      --rose: #f43f5e;
      --emerald: #10b981;
      --yellow: #eab308;
      --text: #f8fafc;
      --text-dim: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Inter', sans-serif;
      padding: 16px;
      line-height: 1.5;
    }
    .container {
      max-width: 1040px;
      margin: 0 auto;
    }
    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 20px;
    }
    .header-left h1 {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-left p {
      font-size: 12px;
      color: var(--text-dim);
      margin-top: 2px;
    }
    .header-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .btn {
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }
    .btn-cyan {
      background: rgba(0, 229, 255, 0.15);
      border-color: rgba(0, 229, 255, 0.4);
      color: var(--cyan);
    }
    .btn-cyan:hover { background: rgba(0, 229, 255, 0.25); }
    .btn-purple {
      background: rgba(139, 92, 246, 0.15);
      border-color: rgba(139, 92, 246, 0.4);
      color: #c084fc;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-box {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 14px;
    }
    .stat-num {
      font-size: 24px;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
    }
    .stat-label {
      font-size: 11px;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .color-oos { color: var(--rose); }
    .color-manual { color: var(--emerald); }
    .color-api { color: var(--cyan); }
    .color-yellow { color: var(--yellow); }

    .upstream-panel {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 24px;
    }
    .upstream-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 12px;
      margin-top: 10px;
    }
    .api-card {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
    }
    .api-card-title {
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .api-card-detail {
      font-size: 11px;
      color: var(--text-dim);
      font-family: 'JetBrains Mono', monospace;
      margin-top: 6px;
      word-break: break-all;
    }

    .products-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .products-header h2 {
      font-size: 16px;
      font-weight: 700;
    }

    .product-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 14px;
      transition: border-color 0.2s;
    }
    .card-oos { border-color: rgba(244, 63, 94, 0.3); }
    .card-ok { border-color: rgba(16, 185, 129, 0.3); }

    .card-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
    }
    .card-title-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .game-tag {
      font-size: 9px;
      font-weight: 800;
      color: var(--cyan);
      background: rgba(0, 229, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      align-self: flex-start;
      text-transform: uppercase;
    }
    .product-name {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }
    .product-id {
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-dim);
    }
    .badge {
      font-size: 10px;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 6px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      display: inline-block;
    }
    .badge-oos {
      background: rgba(244, 63, 94, 0.15);
      color: var(--rose);
      border: 1px solid rgba(244, 63, 94, 0.4);
    }
    .badge-manual {
      background: rgba(16, 185, 129, 0.15);
      color: var(--emerald);
      border: 1px solid rgba(16, 185, 129, 0.4);
    }
    .badge-api {
      background: rgba(0, 229, 255, 0.15);
      color: var(--cyan);
      border: 1px solid rgba(0, 229, 255, 0.4);
    }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 12px;
      margin-bottom: 6px;
    }
    .mt-3 { margin-top: 12px; }

    .plans-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .plan-pill {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'JetBrains Mono', monospace;
    }
    .plan-dur { color: #fff; font-weight: 600; }
    .plan-price { color: var(--yellow); }
    .plan-stock { font-size: 10px; font-weight: 700; }
    .stock-ok { color: var(--emerald); }
    .stock-zero { color: var(--rose); }

    .tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .tag {
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
    }
    .tag-ok {
      background: rgba(0, 229, 255, 0.1);
      color: var(--cyan);
      border: 1px solid rgba(0, 229, 255, 0.3);
    }
    .tag-dim {
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-dim);
      border: 1px solid var(--border);
    }

    .reasons-box {
      margin-top: 12px;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 12px;
    }
    .box-oos {
      background: rgba(244, 63, 94, 0.06);
      border: 1px solid rgba(244, 63, 94, 0.25);
    }
    .box-ok {
      background: rgba(16, 185, 129, 0.06);
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .reasons-title {
      font-weight: 700;
      margin-bottom: 4px;
      color: #fff;
    }
    .reasons-list, .recs-list {
      padding-left: 18px;
      color: #cbd5e1;
    }
    .reasons-list li, .recs-list li {
      margin-bottom: 3px;
    }
    .recs-title {
      font-weight: 700;
      color: var(--yellow);
      margin-top: 8px;
      margin-bottom: 4px;
    }
    .recs-list {
      color: #fde047;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-left">
        <h1>⚡ Inventory & Stock Diagnostics</h1>
        <p>Real-time cross-reference between globalProductsCache and Upstream Restock APIs</p>
      </div>
      <div class="header-actions">
        <a href="?format=html&test_upstream=true" class="btn btn-cyan">⟳ Test Upstream & Refresh</a>
        <a href="/api/inventory/diagnostics" target="_blank" class="btn btn-purple">{ } JSON API</a>
      </div>
    </header>

    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-num">${s.totalProducts}</div>
        <div class="stat-label">Total Catalog Products</div>
      </div>
      <div class="stat-box">
        <div class="stat-num color-oos">${s.outOfStockCount}</div>
        <div class="stat-label">Out of Stock Products</div>
      </div>
      <div class="stat-box">
        <div class="stat-num color-manual">${s.inStockManualCount}</div>
        <div class="stat-label">In Stock (Manual Keys)</div>
      </div>
      <div class="stat-box">
        <div class="stat-num color-api">${s.inStockLiveApiCount}</div>
        <div class="stat-label">In Stock (Live API)</div>
      </div>
      <div class="stat-box">
        <div class="stat-num color-yellow">${s.totalManualKeysInInventory}</div>
        <div class="stat-label">Manual Keys Loaded</div>
      </div>
    </div>

    <div class="upstream-panel">
      <div class="section-title" style="margin-top:0">Upstream Restock API Gateway Statuses</div>
      <div class="upstream-grid">
        <div class="api-card">
          <div class="api-card-title">
            <span>${apis.api1.name}</span>
            <span class="badge ${apis.api1.status === 'CONNECTED' ? 'badge-manual' : 'badge-oos'}">${apis.api1.status}</span>
          </div>
          <div class="api-card-detail">Type: ${apis.api1.type}</div>
          <div class="api-card-detail">URL: ${apis.api1.apiUrl || 'None'}</div>
          <div class="api-card-detail">API Key: ${apis.api1.isPlaceholderKey ? '<span style="color:var(--rose)">Placeholder / Unconfigured</span>' : '<span style="color:var(--emerald)">Configured</span>'}</div>
          <div class="api-card-detail">Ready: ${apis.api1.isOperationallyReady ? '<span style="color:var(--emerald)">YES</span>' : '<span style="color:var(--rose)">NO</span>'}</div>
          ${apis.api1.pingResult?.tested ? `<div class="api-card-detail" style="margin-top:4px;color:var(--cyan)">Ping: ${apis.api1.pingResult.message} (${apis.api1.pingResult.latencyMs}ms)</div>` : ''}
        </div>

        <div class="api-card">
          <div class="api-card-title">
            <span>${apis.api2.name}</span>
            <span class="badge ${apis.api2.status === 'CONNECTED' ? 'badge-manual' : 'badge-oos'}">${apis.api2.status}</span>
          </div>
          <div class="api-card-detail">Type: ${apis.api2.type}</div>
          <div class="api-card-detail">URL: ${apis.api2.apiUrl || 'None'}</div>
          <div class="api-card-detail">Token: ${apis.api2.isPlaceholderToken ? '<span style="color:var(--rose)">Placeholder / Empty</span>' : '<span style="color:var(--emerald)">Configured</span>'}</div>
          <div class="api-card-detail">Ready: ${apis.api2.isOperationallyReady ? '<span style="color:var(--emerald)">YES</span>' : '<span style="color:var(--rose)">NO</span>'}</div>
          ${apis.api2.pingResult?.tested ? `<div class="api-card-detail" style="margin-top:4px;color:var(--cyan)">Ping: ${apis.api2.pingResult.message}</div>` : ''}
        </div>
      </div>
      <div style="font-size:11px;color:var(--text-dim);margin-top:10px;font-family:'JetBrains Mono',monospace">
        Memory Cache: ${c.globalProductsCacheCount} products | Disk Storage: ${c.diskProductsCount} products | In Sync: ${c.isCacheInSyncWithDisk ? 'YES' : 'NO'}
      </div>
    </div>

    <div class="products-header">
      <h2>Products Inventory & 'Out of Stock' Reasons (${report.products.length})</h2>
    </div>

    ${productRows}
  </div>
</body>
</html>`;
}
