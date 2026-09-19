import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { telegramBotService } from './telegramBot';
import { upstreamLogger } from './upstream-logger';

export interface SupplierRestockConfig {
  enabled: boolean;
  webhookSecretToken: string;
  lowStockThreshold: number; // e.g., 3 keys
  autoRefillEnabled: boolean;
  outboundSupplierApiUrl?: string;
  outboundSupplierApiKey?: string;
  outboundRefillBatchCount?: number; // e.g. 5 keys per order
  notifyTelegramOnRestock: boolean;
  notifyTelegramOnLowStock: boolean;
}

export interface SupplierRestockLog {
  id: string;
  timestamp: string;
  timestampMs: number;
  type: 'INBOUND_WEBHOOK' | 'OUTBOUND_AUTO_REFILL' | 'SIMULATION';
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  productId: string;
  productName: string;
  planName?: string;
  keysCountAdded: number;
  keysSample: string[];
  currentTotalStock: number;
  sourceIp?: string;
  supplierName?: string;
  message: string;
  error?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'supplier_restock_config.json');
const LOGS_FILE = path.join(DATA_DIR, 'supplier_restock_logs.json');

export class SupplierRestockService {
  private config: SupplierRestockConfig = {
    enabled: true,
    webhookSecretToken: 'KALAM_SUPPLIER_' + crypto.randomBytes(4).toString('hex').toUpperCase(),
    lowStockThreshold: 3,
    autoRefillEnabled: false,
    outboundSupplierApiUrl: '',
    outboundSupplierApiKey: '',
    outboundRefillBatchCount: 5,
    notifyTelegramOnRestock: true,
    notifyTelegramOnLowStock: true,
  };

  private logs: SupplierRestockLog[] = [];
  private getProductsCallback: (() => any[]) | null = null;
  private saveProductsCallback: ((products: any[]) => void) | null = null;
  private lastAutoRefillTriggerTime: Map<string, number> = new Map();

  constructor() {
    this.ensureDataDir();
    this.loadConfig();
    this.loadLogs();
  }

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch {}
  }

  public registerCallbacks(
    getProducts: () => any[],
    saveProducts: (products: any[]) => void
  ) {
    this.getProductsCallback = getProducts;
    this.saveProductsCallback = saveProducts;
  }

  private loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.config = {
            ...this.config,
            ...parsed,
          };
        }
      } else {
        this.saveConfig(this.config);
      }
    } catch (e) {
      console.warn('[SupplierRestock] Error reading config:', e);
    }
  }

  public saveConfig(newConfig: Partial<SupplierRestockConfig>): SupplierRestockConfig {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    try {
      this.ensureDataDir();
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf8');
    } catch (e) {
      console.warn('[SupplierRestock] Error saving config:', e);
    }
    return this.config;
  }

  public getConfig(): SupplierRestockConfig {
    return { ...this.config };
  }

  private loadLogs() {
    try {
      if (fs.existsSync(LOGS_FILE)) {
        const raw = fs.readFileSync(LOGS_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.logs = parsed.slice(-100);
        }
      }
    } catch (e) {
      console.warn('[SupplierRestock] Error reading logs:', e);
    }
  }

  private saveLogs() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(LOGS_FILE, JSON.stringify(this.logs.slice(-100), null, 2), 'utf8');
    } catch (e) {
      console.warn('[SupplierRestock] Error saving logs:', e);
    }
  }

  public getLogs(): SupplierRestockLog[] {
    return [...this.logs].reverse();
  }

  public addLog(log: Omit<SupplierRestockLog, 'id' | 'timestamp' | 'timestampMs'>): SupplierRestockLog {
    const fullLog: SupplierRestockLog = {
      id: `SR_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      ...log,
    };
    this.logs.push(fullLog);
    this.saveLogs();
    return fullLog;
  }

  // Handle incoming webhook from external supplier API
  public async handleInboundWebhook(req: Request, res: Response) {
    if (!this.config.enabled) {
      return res.status(403).json({
        success: false,
        error: 'Supplier Auto-Restock Webhook is disabled in Admin Settings.',
      });
    }

    const authHeader = req.headers['authorization'] || req.headers['x-api-key'] || req.headers['x-supplier-token'] || req.query.token || req.query.secret;
    const expectedToken = this.config.webhookSecretToken;

    // Validate token if configured
    if (expectedToken && expectedToken.trim().length > 0) {
      const incomingToken = String(authHeader || req.body?.secretToken || req.body?.secret || req.body?.token || '').replace(/^Bearer\s+/i, '').trim();
      if (incomingToken !== expectedToken.trim()) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized. Invalid supplier webhook secret token.',
        });
      }
    }

    const payload = req.body || {};
    const sourceIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');

    try {
      const result = await this.processRestockPayload(payload, 'INBOUND_WEBHOOK', sourceIp);
      return res.json({
        success: true,
        message: result.message,
        details: result,
      });
    } catch (err: any) {
      this.addLog({
        type: 'INBOUND_WEBHOOK',
        status: 'FAILED',
        productId: payload.productId || 'UNKNOWN',
        productName: payload.productName || 'UNKNOWN',
        keysCountAdded: 0,
        keysSample: [],
        currentTotalStock: 0,
        sourceIp,
        message: 'Failed to process restock webhook',
        error: err.message,
      });
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  // Core Key Restock Processor
  public async processRestockPayload(
    payload: any,
    type: 'INBOUND_WEBHOOK' | 'OUTBOUND_AUTO_REFILL' | 'SIMULATION',
    sourceIp?: string
  ): Promise<{
    success: boolean;
    productId: string;
    productName: string;
    planName?: string;
    addedCount: number;
    newTotalStock: number;
    message: string;
  }> {
    if (!this.getProductsCallback || !this.saveProductsCallback) {
      throw new Error('Product storage service not initialized');
    }

    // Extract keys from payload (supports array, newline string, comma string)
    let rawKeys: string[] = [];
    if (Array.isArray(payload.keys)) {
      rawKeys = payload.keys.map((k: any) => String(k).trim()).filter(Boolean);
    } else if (typeof payload.keys === 'string') {
      rawKeys = payload.keys.split(/[\r\n,]+/).map((k: string) => k.trim()).filter(Boolean);
    } else if (typeof payload.key === 'string' && payload.key.trim()) {
      rawKeys = [payload.key.trim()];
    } else if (Array.isArray(payload.data)) {
      rawKeys = payload.data.map((k: any) => String(k.key || k.license || k).trim()).filter(Boolean);
    }

    if (rawKeys.length === 0) {
      throw new Error('No valid license keys found in payload (expected "keys" array or newline string)');
    }

    const products = this.getProductsCallback();
    if (!products || products.length === 0) {
      throw new Error('No products registered in store database');
    }

    // Identify target product
    const targetQuery = String(payload.productId || payload.id || payload.productName || payload.product || payload.name || '').trim().toLowerCase();
    let targetProduct = products.find((p: any) => 
      String(p.id).toLowerCase() === targetQuery || 
      String(p.name).toLowerCase() === targetQuery ||
      String(p.name).toLowerCase().includes(targetQuery)
    );

    // Fallback: If target query not provided or not found, match first active product or create one
    if (!targetProduct) {
      if (products.length > 0) {
        targetProduct = products[0];
      } else {
        throw new Error(`Target product "${targetQuery}" not found`);
      }
    }

    // Clean and deduplicate keys against target product's existing stock
    const existingKeysSet = new Set<string>();
    if (Array.isArray(targetProduct.keys)) {
      targetProduct.keys.forEach((k: string) => existingKeysSet.add(k.trim()));
    }
    if (targetProduct.planKeys && typeof targetProduct.planKeys === 'object') {
      Object.values(targetProduct.planKeys).forEach((arr: any) => {
        if (Array.isArray(arr)) {
          arr.forEach((k: string) => existingKeysSet.add(k.trim()));
        }
      });
    }

    const uniqueNewKeys = rawKeys.filter((k) => !existingKeysSet.has(k));
    if (uniqueNewKeys.length === 0) {
      throw new Error(`All ${rawKeys.length} keys provided are already present in inventory (duplicates skipped)`);
    }

    // Target plan allocation if specified
    const planName = payload.plan || payload.duration || payload.planName;
    if (planName && typeof planName === 'string') {
      if (!targetProduct.planKeys) targetProduct.planKeys = {};
      if (!Array.isArray(targetProduct.planKeys[planName])) {
        targetProduct.planKeys[planName] = [];
      }
      targetProduct.planKeys[planName].push(...uniqueNewKeys);
    } else {
      if (!Array.isArray(targetProduct.keys)) targetProduct.keys = [];
      targetProduct.keys.push(...uniqueNewKeys);
    }

    // Recalculate total available stock
    let totalStock = Array.isArray(targetProduct.keys) ? targetProduct.keys.length : 0;
    if (targetProduct.planKeys && typeof targetProduct.planKeys === 'object') {
      for (const list of Object.values(targetProduct.planKeys)) {
        if (Array.isArray(list)) totalStock += list.length;
      }
    }
    targetProduct.stock = totalStock;

    // Save updated products to disk
    this.saveProductsCallback(products);

    // Log the successful restock
    const sample = uniqueNewKeys.slice(0, 3).map((k) => k.slice(0, 6) + '****' + k.slice(-4));
    this.addLog({
      type,
      status: 'SUCCESS',
      productId: targetProduct.id,
      productName: targetProduct.name,
      planName: planName || undefined,
      keysCountAdded: uniqueNewKeys.length,
      keysSample: sample,
      currentTotalStock: totalStock,
      sourceIp: sourceIp || 'internal',
      supplierName: payload.supplierName || 'Auto-Supplier API',
      message: `Successfully added ${uniqueNewKeys.length} keys to ${targetProduct.name}`,
    });

    // Notify Telegram Bot Admin
    if (this.config.notifyTelegramOnRestock) {
      this.sendTelegramRestockNotification(targetProduct.name, uniqueNewKeys.length, totalStock, planName).catch(() => {});
    }

    return {
      success: true,
      productId: targetProduct.id,
      productName: targetProduct.name,
      planName,
      addedCount: uniqueNewKeys.length,
      newTotalStock: totalStock,
      message: `Added +${uniqueNewKeys.length} keys to "${targetProduct.name}". Total available stock: ${totalStock}`,
    };
  }

  // Telegram Restock Alert
  private async sendTelegramRestockNotification(
    productName: string,
    addedCount: number,
    newTotalStock: number,
    planName?: string
  ) {
    try {
      const msg = 
        `⚡ <b>SUPPLIER AUTO-RESTOCK RECEIVED!</b>\n\n` +
        `📦 <b>Product:</b> <code>${productName}</code>\n` +
        (planName ? `⏱️ <b>Plan:</b> ${planName}\n` : '') +
        `🔑 <b>Keys Credited:</b> <b>+${addedCount} Keys</b>\n` +
        `📊 <b>Live Total Stock:</b> <b>${newTotalStock} Available</b>\n\n` +
        `✅ <i>Automated Supplier Webhook Sync Completed!</i>`;

      // Dispatch to admin chat
      const adminChatId = 7768975239;
      await telegramBotService.sendMessage(adminChatId, msg);
    } catch (e: any) {
      console.warn('[SupplierRestock] Telegram restock alert failed:', e.message);
    }
  }

  // Check product stock and auto-refill if below threshold
  public async checkLowStockAndAutoRefill(productId: string) {
    if (!this.config.autoRefillEnabled || !this.config.outboundSupplierApiUrl) {
      return;
    }

    const lastTrigger = this.lastAutoRefillTriggerTime.get(productId) || 0;
    const now = Date.now();
    // Debounce to prevent multiple outbound requests within 3 minutes for same product
    if (now - lastTrigger < 3 * 60 * 1000) {
      return;
    }

    if (!this.getProductsCallback) return;
    const products = this.getProductsCallback();
    const product = products.find((p: any) => p.id === productId);
    if (!product) return;

    let availableStock = Array.isArray(product.keys) ? product.keys.length : 0;
    if (product.planKeys && typeof product.planKeys === 'object') {
      for (const list of Object.values(product.planKeys)) {
        if (Array.isArray(list)) availableStock += list.length;
      }
    }

    if (availableStock <= this.config.lowStockThreshold) {
      console.log(`[SupplierRestock] Product "${product.name}" is low stock (${availableStock} remaining <= threshold ${this.config.lowStockThreshold}). Triggering supplier auto-refill...`);
      this.lastAutoRefillTriggerTime.set(productId, now);

      try {
        const batchCount = this.config.outboundRefillBatchCount || 5;
        const requestPayload = {
          action: 'REFILL_STOCK',
          productId: product.id,
          productName: product.name,
          quantity: batchCount,
          callbackWebhook: '/api/webhook/supplier-restock',
          secretToken: this.config.webhookSecretToken,
        };
        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(this.config.outboundSupplierApiKey ? { 'Authorization': `Bearer ${this.config.outboundSupplierApiKey}` } : {})
        };

        const startTime = Date.now();
        const res = await fetch(this.config.outboundSupplierApiUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestPayload)
        });

        const latencyMs = Date.now() - startTime;
        const rawText = await res.text();
        let data: any = {};
        try {
          data = JSON.parse(rawText);
        } catch {}

        const deliveredKey = data.keys && Array.isArray(data.keys) ? data.keys.join(', ') : undefined;

        upstreamLogger.recordLog({
          apiName: 'Supplier Restock API',
          providerType: 'supplier_restock',
          callerContext: 'Supplier Auto-Refill Engine',
          url: this.config.outboundSupplierApiUrl,
          method: 'POST',
          requestHeaders,
          requestBodyRaw: JSON.stringify(requestPayload, null, 2),
          requestBodyParsed: requestPayload,
          responseStatus: res.status,
          responseBodyRaw: rawText,
          responseBodyParsed: data,
          success: res.ok,
          latencyMs,
          attempts: 1,
          deliveredKey,
          productInfo: {
            productId: product.id,
            productName: product.name,
            quantity: batchCount
          },
          errorMessage: !res.ok ? (data.message || data.error || `HTTP ${res.status}`) : undefined
        });

        if (data.keys && Array.isArray(data.keys)) {
          // Immediately process returned keys if synchronous
          await this.processRestockPayload(data, 'OUTBOUND_AUTO_REFILL');
        } else {
          this.addLog({
            type: 'OUTBOUND_AUTO_REFILL',
            status: 'SUCCESS',
            productId: product.id,
            productName: product.name,
            keysCountAdded: 0,
            keysSample: [],
            currentTotalStock: availableStock,
            message: `Outbound restock request sent to supplier API (${this.config.outboundSupplierApiUrl}) for ${batchCount} keys.`,
          });
        }
      } catch (err: any) {
        console.warn('[SupplierRestock] Outbound auto-refill request failed:', err.message);
        upstreamLogger.recordLog({
          apiName: 'Supplier Restock API',
          providerType: 'supplier_restock',
          callerContext: 'Supplier Auto-Refill Engine',
          url: this.config.outboundSupplierApiUrl || 'Supplier Endpoint',
          method: 'POST',
          responseStatus: 0,
          responseBodyRaw: '',
          success: false,
          latencyMs: 0,
          attempts: 1,
          productInfo: {
            productId: product.id,
            productName: product.name
          },
          errorMessage: err.message,
          networkError: err.message
        });

        this.addLog({
          type: 'OUTBOUND_AUTO_REFILL',
          status: 'FAILED',
          productId: product.id,
          productName: product.name,
          keysCountAdded: 0,
          keysSample: [],
          currentTotalStock: availableStock,
          message: 'Outbound supplier API request failed',
          error: err.message,
        });
      }
    }
  }
}

export const supplierRestockService = new SupplierRestockService();
