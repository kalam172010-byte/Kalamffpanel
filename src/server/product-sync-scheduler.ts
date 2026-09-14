import fs from 'fs';
import path from 'path';

export interface UpstreamSyncConfig {
  enabled: boolean;
  apiUrl?: string;
  apiKey?: string;
  syncIntervalHours?: number; // default 6 hours
  autoAddMissingProducts?: boolean;
  autoUpdatePricing?: boolean;
  autoSyncStockKeys?: boolean;
  minPriceFloor?: number;
}

export interface SyncExecutionLog {
  timestamp: string;
  timestampMs: number;
  trigger: 'SCHEDULED' | 'MANUAL' | 'STARTUP';
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED' | 'PARTIAL';
  sourceUrl?: string;
  productsUpdated: number;
  keysSynced: number;
  pricesUpdated: number;
  durationMs: number;
  details: string[];
  error?: string;
}

export interface SchedulerState {
  isRunning: boolean;
  intervalHours: number;
  lastRunAt: string | null;
  lastRunTimestamp: number | null;
  nextRunAt: string | null;
  nextRunTimestamp: number | null;
  lastStatus: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'SKIPPED' | 'FAILED' | 'PARTIAL';
  lastLog: SyncExecutionLog | null;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  configuredEndpoint: string | null;
  isApiConfigured: boolean;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const SCHEDULER_CONFIG_FILE = path.join(DATA_DIR, 'product_sync_config.json');
const SCHEDULER_LOGS_FILE = path.join(DATA_DIR, 'product_sync_logs.json');

export class ProductSyncScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isExecuting: boolean = false;
  private intervalMs: number = 6 * 60 * 60 * 1000; // 6 hours default
  private logs: SyncExecutionLog[] = [];
  private lastRunTimestamp: number | null = null;
  private totalRuns: number = 0;
  private successfulRuns: number = 0;
  private failedRuns: number = 0;

  // Callbacks injected from server/app.ts
  private getProductsCallback: (() => any[]) | null = null;
  private saveProductsCallback: ((products: any[]) => void) | null = null;
  private getStoreDataCallback: (() => any) | null = null;

  constructor() {
    this.ensureDataDir();
    this.loadLogs();
  }

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch {}
  }

  private loadLogs() {
    try {
      if (fs.existsSync(SCHEDULER_LOGS_FILE)) {
        const raw = fs.readFileSync(SCHEDULER_LOGS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.logs = parsed.slice(-50); // Keep last 50 logs
          if (this.logs.length > 0) {
            const last = this.logs[this.logs.length - 1];
            this.lastRunTimestamp = last.timestampMs;
          }
        }
      }
    } catch (e) {
      console.warn('[ProductSyncScheduler] Error reading logs:', e);
    }
  }

  private saveLogs() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(SCHEDULER_LOGS_FILE, JSON.stringify(this.logs.slice(-50), null, 2), 'utf-8');
    } catch (e) {
      console.warn('[ProductSyncScheduler] Error writing logs:', e);
    }
  }

  public getSyncConfig(): UpstreamSyncConfig {
    try {
      if (fs.existsSync(SCHEDULER_CONFIG_FILE)) {
        const raw = fs.readFileSync(SCHEDULER_CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            enabled: parsed.enabled !== false,
            apiUrl: parsed.apiUrl || process.env.UPSTREAM_WEBSITE_URL || '',
            apiKey: parsed.apiKey || process.env.UPSTREAM_API_KEY || '',
            syncIntervalHours: Number(parsed.syncIntervalHours) || 6,
            autoAddMissingProducts: parsed.autoAddMissingProducts !== false,
            autoUpdatePricing: parsed.autoUpdatePricing !== false,
            autoSyncStockKeys: parsed.autoSyncStockKeys !== false,
            minPriceFloor: Number(parsed.minPriceFloor) || 0
          };
        }
      }
    } catch {}

    // Fallback check from store_data.json / environment
    let fallbackUrl = process.env.UPSTREAM_WEBSITE_URL || '';
    let fallbackKey = process.env.UPSTREAM_API_KEY || '';

    if (this.getStoreDataCallback) {
      try {
        const storeData = this.getStoreDataCallback();
        const apiConfigs = storeData?.apiConfigs || [];
        const activeApi = apiConfigs.find((a: any) => a && (a.status === 'CONNECTED' || a.apiKey || a.apiUrl));
        if (activeApi) {
          if (!fallbackUrl) fallbackUrl = activeApi.apiUrl || '';
          if (!fallbackKey) fallbackKey = activeApi.apiKey || activeApi.xApiToken || '';
        }
      } catch {}
    }

    return {
      enabled: true,
      apiUrl: fallbackUrl,
      apiKey: fallbackKey,
      syncIntervalHours: 6,
      autoAddMissingProducts: true,
      autoUpdatePricing: true,
      autoSyncStockKeys: true,
      minPriceFloor: 0
    };
  }

  public saveSyncConfig(config: Partial<UpstreamSyncConfig>) {
    try {
      this.ensureDataDir();
      const current = this.getSyncConfig();
      const updated: UpstreamSyncConfig = {
        ...current,
        ...config,
        syncIntervalHours: Math.max(1, Number(config.syncIntervalHours) || current.syncIntervalHours || 6)
      };
      fs.writeFileSync(SCHEDULER_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
      
      // Update interval timer
      this.intervalMs = (updated.syncIntervalHours || 6) * 60 * 60 * 1000;
      this.restartInterval();
      return updated;
    } catch (e) {
      console.warn('[ProductSyncScheduler] Error saving sync config:', e);
      throw e;
    }
  }

  public init(
    getProducts: () => any[],
    saveProducts: (products: any[]) => void,
    getStoreData: () => any
  ) {
    this.getProductsCallback = getProducts;
    this.saveProductsCallback = saveProducts;
    this.getStoreDataCallback = getStoreData;

    const config = this.getSyncConfig();
    this.intervalMs = (config.syncIntervalHours || 6) * 60 * 60 * 1000;

    console.log(`[ProductSyncScheduler] Initialized 6-hour upstream sync scheduler (Interval: ${config.syncIntervalHours || 6}h)`);

    // Start background interval
    this.startInterval();

    // Run an initial non-blocking check shortly after server boot (15 seconds delay)
    setTimeout(() => {
      this.executeSync('STARTUP').catch(err => {
        console.warn('[ProductSyncScheduler] Initial startup check notice:', err?.message || err);
      });
    }, 15000);
  }

  private startInterval() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => {
      this.executeSync('SCHEDULED').catch(err => {
        console.error('[ProductSyncScheduler] Scheduled execution error:', err);
      });
    }, this.intervalMs);
  }

  private restartInterval() {
    this.startInterval();
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Resolves the active upstream endpoint and credentials
   */
  private resolveUpstreamEndpoint(): { apiUrl: string; apiKey: string; source: string } | null {
    const config = this.getSyncConfig();
    if (config.apiUrl && config.apiUrl.trim()) {
      return {
        apiUrl: config.apiUrl.trim(),
        apiKey: (config.apiKey || '').trim(),
        source: 'SYNC_CONFIG'
      };
    }

    if (process.env.UPSTREAM_WEBSITE_URL) {
      return {
        apiUrl: process.env.UPSTREAM_WEBSITE_URL.trim(),
        apiKey: (process.env.UPSTREAM_API_KEY || '').trim(),
        source: 'ENV'
      };
    }

    if (this.getStoreDataCallback) {
      try {
        const storeData = this.getStoreDataCallback();
        const apiConfigs = storeData?.apiConfigs || [];
        const activeApi = apiConfigs.find(
          (a: any) => a && (a.status === 'CONNECTED' || a.apiKey) && a.apiUrl && !a.apiUrl.includes('EMPTY')
        );
        if (activeApi && activeApi.apiUrl) {
          return {
            apiUrl: activeApi.apiUrl.trim(),
            apiKey: (activeApi.apiKey || activeApi.xApiToken || '').trim(),
            source: 'STORE_API_CONFIGS'
          };
        }
      } catch {}
    }

    return null;
  }

  /**
   * Main sync engine: fetches external product keys, stock, and pricing from configured upstream Admin API
   */
  public async executeSync(trigger: 'SCHEDULED' | 'MANUAL' | 'STARTUP' = 'MANUAL'): Promise<SyncExecutionLog> {
    if (this.isExecuting) {
      return {
        timestamp: new Date().toISOString(),
        timestampMs: Date.now(),
        trigger,
        status: 'SKIPPED',
        productsUpdated: 0,
        keysSynced: 0,
        pricesUpdated: 0,
        durationMs: 0,
        details: ['Sync operation already in progress, skipped duplicate execution.']
      };
    }

    const startTime = Date.now();
    this.isExecuting = true;
    this.totalRuns++;

    const log: SyncExecutionLog = {
      timestamp: new Date().toISOString(),
      timestampMs: startTime,
      trigger,
      status: 'SUCCESS',
      productsUpdated: 0,
      keysSynced: 0,
      pricesUpdated: 0,
      durationMs: 0,
      details: []
    };

    try {
      const config = this.getSyncConfig();
      if (!config.enabled) {
        log.status = 'SKIPPED';
        log.details.push('Sync is disabled in settings.');
        this.recordLog(log, startTime);
        return log;
      }

      const upstream = this.resolveUpstreamEndpoint();
      if (!upstream || !upstream.apiUrl) {
        log.status = 'SKIPPED';
        log.details.push('No external Admin API endpoint configured. Set UPSTREAM_WEBSITE_URL or configure in Admin Settings.');
        this.recordLog(log, startTime);
        return log;
      }

      log.sourceUrl = upstream.apiUrl;
      log.details.push(`Connecting to external Admin API: ${upstream.apiUrl} (Source: ${upstream.source})`);

      // Determine product sync endpoints to poll
      const endpointsToTry: string[] = [];
      const base = upstream.apiUrl.replace(/\/+$/, '');

      if (base.endsWith('/api/v1/products') || base.endsWith('/api/products')) {
        endpointsToTry.push(base);
      } else if (base.includes('reseller')) {
        endpointsToTry.push(base);
        endpointsToTry.push(`${base}?action=get_products`);
        endpointsToTry.push(`${base}?action=products`);
      } else {
        endpointsToTry.push(`${base}/api/v1/products`);
        endpointsToTry.push(`${base}/api/products`);
        endpointsToTry.push(`${base}/api/admin/products`);
        endpointsToTry.push(`${base}/api/reseller/products`);
      }

      let upstreamData: any = null;
      let usedEndpoint: string = '';
      let fetchError: any = null;

      for (const ep of endpointsToTry) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const headers: Record<string, string> = {
            'Accept': 'application/json',
            'User-Agent': 'KalamFFPanel-ProductSyncScheduler/1.0'
          };
          if (upstream.apiKey) {
            headers['Authorization'] = `Bearer ${upstream.apiKey}`;
            headers['X-Api-Key'] = upstream.apiKey;
            headers['x-master-key'] = upstream.apiKey;
          }

          const resp = await fetch(ep, {
            method: 'GET',
            headers,
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (resp.ok) {
            try {
              const json = await resp.json();
              if (json && (Array.isArray(json.products) || Array.isArray(json) || Array.isArray(json.data))) {
                upstreamData = json;
                usedEndpoint = ep;
                break;
              }
            } catch (jsonErr: any) {
              fetchError = jsonErr;
            }
          }
        } catch (e: any) {
          fetchError = e;
        }
      }

      if (!upstreamData) {
        log.status = 'FAILED';
        log.error = `Could not retrieve products from external API endpoints (${endpointsToTry.join(', ')}): ${fetchError?.message || 'Invalid response format'}`;
        log.details.push(log.error);
        this.failedRuns++;
        this.recordLog(log, startTime);
        return log;
      }

      log.details.push(`Successfully fetched remote catalog from ${usedEndpoint}`);

      // Extract raw products array from remote response
      const remoteProductsRaw: any[] = Array.isArray(upstreamData.products)
        ? upstreamData.products
        : Array.isArray(upstreamData.data)
        ? upstreamData.data
        : Array.isArray(upstreamData)
        ? upstreamData
        : [];

      if (remoteProductsRaw.length === 0) {
        log.status = 'SKIPPED';
        log.details.push('Remote API returned 0 products to sync.');
        this.recordLog(log, startTime);
        return log;
      }

      // Load local current catalog
      const localProducts: any[] = this.getProductsCallback ? this.getProductsCallback() : [];
      let updatedCount = 0;
      let syncedKeysCount = 0;
      let pricesUpdatedCount = 0;

      for (const remote of remoteProductsRaw) {
        if (!remote || typeof remote !== 'object') continue;
        const remotePid = remote.id || remote.productId || remote.pid;
        const remoteName = remote.name || remote.title || '';

        // Match local product by ID, PID, or name
        let matchedLocal = localProducts.find((p: any) => 
          (p.id && remotePid && p.id.toLowerCase() === String(remotePid).toLowerCase()) ||
          (p.pid && remotePid && p.pid.toLowerCase() === String(remotePid).toLowerCase()) ||
          (p.name && remoteName && p.name.toLowerCase().trim() === remoteName.toLowerCase().trim())
        );

        if (!matchedLocal && config.autoAddMissingProducts) {
          // Add new product from remote catalog
          const newProduct: any = {
            id: remotePid || `prod_sync_${Date.now()}_${Math.floor(Math.random() * 899 + 100)}`,
            pid: remotePid,
            productId: remotePid,
            name: remoteName || 'New Synced Product',
            game: remote.game || 'Free Fire',
            category: remote.category || 'VIP PANEL',
            description: remote.description || 'Auto-synced from upstream provider catalog.',
            status: remote.status || 'ACTIVE',
            features: remote.features || ['Anti-Ban Protected', 'Auto-Synced Pricing', 'High Performance'],
            bannerUrl: remote.bannerUrl || remote.image || '',
            iconUrl: remote.iconUrl || '',
            downloadLink: remote.downloadLink || remote.apkUrl || '',
            plans: Array.isArray(remote.plans) ? remote.plans : [
              { id: 'p_1d', duration: '1 Day', price: 40, stock: 10 },
              { id: 'p_7d', duration: '7 Days', price: 180, stock: 10 },
              { id: 'p_30d', duration: '30 Days', price: 450, stock: 10 }
            ],
            planKeys: remote.planKeys || {},
            keys: Array.isArray(remote.keys) ? remote.keys : [],
            updatedAt: Date.now()
          };
          localProducts.push(newProduct);
          matchedLocal = newProduct;
          updatedCount++;
          log.details.push(`Added new product from upstream: "${newProduct.name}" (ID: ${newProduct.id})`);
        }

        if (matchedLocal) {
          let hasModifications = false;

          // 1. Sync Pricing & Plans
          if (config.autoUpdatePricing && Array.isArray(remote.plans) && remote.plans.length > 0) {
            if (!Array.isArray(matchedLocal.plans)) {
              matchedLocal.plans = [];
            }

            for (const rPlan of remote.plans) {
              const rDur = String(rPlan.duration || rPlan.name || '').trim();
              const rPrice = Number(rPlan.price || rPlan.amount || 0);

              if (rDur && rPrice > 0) {
                const effectivePrice = Math.max(rPrice, config.minPriceFloor || 0);
                const localPlan = matchedLocal.plans.find((lp: any) => 
                  String(lp.duration || lp.name || '').toLowerCase() === rDur.toLowerCase()
                );

                if (localPlan) {
                  if (localPlan.price !== effectivePrice) {
                    localPlan.price = effectivePrice;
                    hasModifications = true;
                    pricesUpdatedCount++;
                  }
                  if (rPlan.resellerPrice && localPlan.resellerPrice !== Number(rPlan.resellerPrice)) {
                    localPlan.resellerPrice = Number(rPlan.resellerPrice);
                    hasModifications = true;
                  }
                } else {
                  matchedLocal.plans.push({
                    id: rPlan.id || `plan_${Date.now()}_${Math.floor(Math.random() * 89 + 10)}`,
                    duration: rDur,
                    price: effectivePrice,
                    resellerPrice: rPlan.resellerPrice ? Number(rPlan.resellerPrice) : undefined
                  });
                  hasModifications = true;
                  pricesUpdatedCount++;
                }
              }
            }
          }

          // 2. Sync Stock Keys (if available in remote payload)
          if (config.autoSyncStockKeys) {
            // General keys array
            if (Array.isArray(remote.keys) && remote.keys.length > 0) {
              const currentKeys: string[] = Array.isArray(matchedLocal.keys) ? matchedLocal.keys : [];
              const newKeys = remote.keys.filter((k: string) => typeof k === 'string' && k.trim() && !currentKeys.includes(k.trim()));
              if (newKeys.length > 0) {
                matchedLocal.keys = [...currentKeys, ...newKeys];
                syncedKeysCount += newKeys.length;
                hasModifications = true;
              }
            }

            // Plan-specific keys mapping
            if (remote.planKeys && typeof remote.planKeys === 'object') {
              if (!matchedLocal.planKeys || typeof matchedLocal.planKeys !== 'object') {
                matchedLocal.planKeys = {};
              }
              for (const [planIdOrDur, remoteKeyList] of Object.entries(remote.planKeys)) {
                if (Array.isArray(remoteKeyList) && remoteKeyList.length > 0) {
                  const existingList: string[] = Array.isArray((matchedLocal.planKeys as any)[planIdOrDur])
                    ? (matchedLocal.planKeys as any)[planIdOrDur]
                    : [];
                  const newKeys = remoteKeyList.filter((k: string) => typeof k === 'string' && k.trim() && !existingList.includes(k.trim()));
                  if (newKeys.length > 0) {
                    (matchedLocal.planKeys as any)[planIdOrDur] = [...existingList, ...newKeys];
                    syncedKeysCount += newKeys.length;
                    hasModifications = true;
                  }
                }
              }
            }
          }

          if (hasModifications) {
            matchedLocal.updatedAt = Date.now();
            updatedCount++;
          }
        }
      }

      // Save updated catalog to disk
      if (updatedCount > 0 || syncedKeysCount > 0 || pricesUpdatedCount > 0) {
        if (this.saveProductsCallback) {
          this.saveProductsCallback(localProducts);
        }
      }

      log.productsUpdated = updatedCount;
      log.keysSynced = syncedKeysCount;
      log.pricesUpdated = pricesUpdatedCount;
      log.status = 'SUCCESS';
      log.details.push(`Sync completed successfully. ${updatedCount} products checked/updated, ${pricesUpdatedCount} plan prices synchronized, ${syncedKeysCount} new stock keys imported.`);

      this.successfulRuns++;
      this.lastRunTimestamp = Date.now();
      this.recordLog(log, startTime);

      console.log(`[ProductSyncScheduler] Sync finished (${trigger}): ${updatedCount} products updated, ${pricesUpdatedCount} prices synced, ${syncedKeysCount} keys imported in ${log.durationMs}ms`);

      return log;
    } catch (err: any) {
      log.status = 'FAILED';
      log.error = err.message || 'Unexpected sync failure';
      log.details.push(`Fatal sync exception: ${log.error}`);
      this.failedRuns++;
      this.recordLog(log, startTime);
      console.error('[ProductSyncScheduler] Sync error:', err);
      return log;
    } finally {
      this.isExecuting = false;
    }
  }

  private recordLog(log: SyncExecutionLog, startTime: number) {
    log.durationMs = Date.now() - startTime;
    this.logs.push(log);
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50);
    }
    this.saveLogs();
  }

  public getSchedulerState(): SchedulerState {
    const config = this.getSyncConfig();
    const lastLog = this.logs.length > 0 ? this.logs[this.logs.length - 1] : null;
    const intervalHours = config.syncIntervalHours || 6;
    const intervalMs = intervalHours * 60 * 60 * 1000;

    const nextRunTimestamp = this.lastRunTimestamp ? this.lastRunTimestamp + intervalMs : Date.now() + intervalMs;
    const upstream = this.resolveUpstreamEndpoint();

    return {
      isRunning: Boolean(this.timer) && config.enabled,
      intervalHours,
      lastRunAt: this.lastRunTimestamp ? new Date(this.lastRunTimestamp).toISOString() : null,
      lastRunTimestamp: this.lastRunTimestamp,
      nextRunAt: new Date(nextRunTimestamp).toISOString(),
      nextRunTimestamp,
      lastStatus: this.isExecuting ? 'RUNNING' : (lastLog ? lastLog.status : 'IDLE'),
      lastLog,
      totalRuns: this.totalRuns,
      successfulRuns: this.successfulRuns,
      failedRuns: this.failedRuns,
      configuredEndpoint: upstream?.apiUrl || null,
      isApiConfigured: Boolean(upstream?.apiUrl)
    };
  }

  public getLogs(): SyncExecutionLog[] {
    return [...this.logs].reverse();
  }
}

export const productSyncScheduler = new ProductSyncScheduler();
