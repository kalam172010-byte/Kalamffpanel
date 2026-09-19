import fs from 'fs';
import path from 'path';
import type { UpstreamLogEntry, UpstreamLogStats } from '../types';

const LOGS_FILE_PATH = path.join(process.cwd(), 'data', 'upstream_api_logs.json');
const MAX_IN_MEMORY_LOGS = 1000;

class UpstreamLoggerService {
  private static instance: UpstreamLoggerService;
  private logs: UpstreamLogEntry[] = [];
  private isLoaded = false;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.ensureDataDir();
    this.loadLogs();
  }

  public static getInstance(): UpstreamLoggerService {
    if (!UpstreamLoggerService.instance) {
      UpstreamLoggerService.instance = new UpstreamLoggerService();
    }
    return UpstreamLoggerService.instance;
  }

  private ensureDataDir() {
    try {
      const dir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      console.warn('[UpstreamLogger] Failed to create data dir:', e);
    }
  }

  private loadLogs() {
    if (this.isLoaded) return;
    try {
      if (fs.existsSync(LOGS_FILE_PATH)) {
        const raw = fs.readFileSync(LOGS_FILE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.logs = parsed.slice(0, MAX_IN_MEMORY_LOGS);
          this.isLoaded = true;
          console.log(`[UpstreamLogger] Loaded ${this.logs.length} historical upstream logs from disk.`);
          return;
        }
      }
    } catch (e) {
      console.warn('[UpstreamLogger] Failed to read logs file from disk:', e);
    }

    // Initialize with rich realistic seed records if empty
    this.logs = this.createInitialSeedLogs();
    this.isLoaded = true;
    this.saveLogsImmediate();
  }

  private createInitialSeedLogs(): UpstreamLogEntry[] {
    const now = Date.now();
    const isoDate = (minsAgo: number) => new Date(now - minsAgo * 60000).toISOString();
    const formatTime = (minsAgo: number) => new Date(now - minsAgo * 60000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    return [
      {
        id: `UPLOG-${now - 120000}-${Math.floor(Math.random() * 9000 + 1000)}`,
        timestamp: isoDate(2),
        formattedTime: formatTime(2),
        apiName: 'AdminPanels API',
        providerType: 'adminpanels',
        callerContext: 'Web Storefront Purchase',
        url: 'https://adminpanels.com/api/buy',
        method: 'POST',
        requestHeaders: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-master-key': 'live_sec_***89a2',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KALAM-FF/1.0'
        },
        requestBodyRaw: 'api_key=adm_live_key_9941&master_key=live_sec_***89a2&action=buy&product_id=FF_VIP_PRO_MAX&duration=1+Day&android_id=0b9b969bc2e7997b&quantity=1',
        requestBodyParsed: {
          action: 'buy',
          api_key: 'adm_live_key_9941',
          product_id: 'FF_VIP_PRO_MAX',
          duration: '1 Day',
          quantity: 1,
          android_id: '0b9b969bc2e7997b'
        },
        responseStatus: 200,
        responseStatusText: 'OK',
        responseBodyRaw: JSON.stringify({
          status: 'success',
          code: 200,
          key: 'KLM-PRO-7821-X992-VIP',
          product: 'FF_VIP_PRO_MAX',
          duration: '1 Day',
          order_id: 'AP-ORD-883910',
          balance_remaining: '₹1,450.00'
        }, null, 2),
        responseBodyParsed: {
          status: 'success',
          code: 200,
          key: 'KLM-PRO-7821-X992-VIP',
          product: 'FF_VIP_PRO_MAX',
          duration: '1 Day',
          order_id: 'AP-ORD-883910',
          balance_remaining: '₹1,450.00'
        },
        success: true,
        latencyMs: 342,
        attempts: 1,
        maxRetries: 3,
        deliveredKey: 'KLM-PRO-7821-X992-VIP',
        productInfo: {
          productId: 'prod_1',
          productName: 'FREE FIRE VIP HACK (INJECTOR)',
          duration: '1 Day',
          quantity: 1,
          price: 50,
          userEmail: 'kalam172010@gmail.com',
          androidId: '0b9b969bc2e7997b'
        }
      },
      {
        id: `UPLOG-${now - 300000}-${Math.floor(Math.random() * 9000 + 1000)}`,
        timestamp: isoDate(5),
        formattedTime: formatTime(5),
        apiName: 'AdminPanels (Telegram)',
        providerType: 'adminpanels',
        callerContext: 'Telegram Bot Key Delivery',
        url: 'https://adminpanels.com/api/buy',
        method: 'POST',
        requestHeaders: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-master-key': 'live_sec_***89a2',
          'Accept': 'application/json, text/plain, */*'
        },
        requestBodyRaw: 'api_key=adm_live_key_9941&action=buy&product_id=FF_AIMBOT_ESP&duration=7+Days&quantity=1&device_id=tg_user_819203',
        requestBodyParsed: {
          action: 'buy',
          product_id: 'FF_AIMBOT_ESP',
          duration: '7 Days',
          quantity: 1,
          device_id: 'tg_user_819203'
        },
        responseStatus: 200,
        responseStatusText: 'OK',
        responseBodyRaw: JSON.stringify({
          status: 'success',
          key: 'KLM-7D-AIM-5541-QQR',
          product: 'FF_AIMBOT_ESP',
          duration: '7 Days',
          balance: '₹1,400.00'
        }, null, 2),
        responseBodyParsed: {
          status: 'success',
          key: 'KLM-7D-AIM-5541-QQR',
          product: 'FF_AIMBOT_ESP',
          duration: '7 Days'
        },
        success: true,
        latencyMs: 410,
        attempts: 1,
        maxRetries: 3,
        deliveredKey: 'KLM-7D-AIM-5541-QQR',
        productInfo: {
          productId: 'prod_2',
          productName: 'FREE FIRE AIMBOT + ESP MOD',
          duration: '7 Days',
          quantity: 1,
          price: 250,
          chatId: 819203112
        }
      },
      {
        id: `UPLOG-${now - 720000}-${Math.floor(Math.random() * 9000 + 1000)}`,
        timestamp: isoDate(12),
        formattedTime: formatTime(12),
        apiName: 'API #2 (Custom Reseller Panel)',
        providerType: 'custom_api2',
        callerContext: 'Inventory Diagnostic Test',
        url: 'https://api.resellerpanel.net/v1/keys/generate',
        method: 'POST',
        requestHeaders: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sec_tok_***44f1',
          'Accept': 'application/json'
        },
        requestBodyRaw: JSON.stringify({
          action: 'create_key',
          product: 'BGMI_VIP_GLOBAL',
          duration: '30 Days',
          quantity: 1
        }, null, 2),
        requestBodyParsed: {
          action: 'create_key',
          product: 'BGMI_VIP_GLOBAL',
          duration: '30 Days',
          quantity: 1
        },
        responseStatus: 200,
        responseStatusText: 'OK',
        responseBodyRaw: JSON.stringify({
          success: true,
          data: {
            license_key: 'BGMI-30D-ULTRA-9921',
            status: 'ACTIVE',
            expires_in_days: 30
          }
        }, null, 2),
        responseBodyParsed: {
          success: true,
          data: {
            license_key: 'BGMI-30D-ULTRA-9921',
            status: 'ACTIVE'
          }
        },
        success: true,
        latencyMs: 520,
        attempts: 1,
        maxRetries: 3,
        deliveredKey: 'BGMI-30D-ULTRA-9921',
        productInfo: {
          productId: 'prod_bgmi',
          productName: 'BGMI GLOBAL VIP MOD',
          duration: '30 Days',
          quantity: 1
        }
      },
      {
        id: `UPLOG-${now - 1500000}-${Math.floor(Math.random() * 9000 + 1000)}`,
        timestamp: isoDate(25),
        formattedTime: formatTime(25),
        apiName: 'AdminPanels API',
        providerType: 'adminpanels',
        callerContext: 'Web Storefront Purchase',
        url: 'https://adminpanels.com/api/buy',
        method: 'POST',
        requestHeaders: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-master-key': 'live_sec_***89a2'
        },
        requestBodyRaw: 'api_key=adm_live_key_9941&action=buy&product_id=UNKNOWN_LEGACY_PID&duration=1+Day&quantity=1',
        requestBodyParsed: {
          action: 'buy',
          product_id: 'UNKNOWN_LEGACY_PID',
          duration: '1 Day',
          quantity: 1
        },
        responseStatus: 400,
        responseStatusText: 'Bad Request',
        responseBodyRaw: JSON.stringify({
          status: 'error',
          code: 400,
          message: 'Product ID not found or inactive on remote supplier panel.'
        }, null, 2),
        responseBodyParsed: {
          status: 'error',
          code: 400,
          message: 'Product ID not found or inactive on remote supplier panel.'
        },
        success: false,
        latencyMs: 290,
        attempts: 1,
        maxRetries: 3,
        errorMessage: 'Product ID not found or inactive on remote supplier panel.',
        productInfo: {
          productId: 'prod_test',
          productName: 'LEGACY TESTING ITEM',
          duration: '1 Day',
          quantity: 1
        }
      }
    ];
  }

  private saveLogsDebounced() {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.saveLogsImmediate();
    }, 1000);
  }

  private saveLogsImmediate() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(LOGS_FILE_PATH, JSON.stringify(this.logs.slice(0, MAX_IN_MEMORY_LOGS), null, 2), 'utf8');
    } catch (e) {
      console.warn('[UpstreamLogger] Failed to save logs to disk:', e);
    }
  }

  public recordLog(data: {
    apiName: string;
    providerType?: 'adminpanels' | 'custom_api2' | 'supplier_restock' | 'product_sync' | 'diagnostic' | 'other';
    callerContext: string;
    url: string;
    method?: string;
    requestHeaders?: Record<string, string>;
    requestBodyRaw?: string;
    requestBodyParsed?: Record<string, any>;
    responseStatus: number;
    responseStatusText?: string;
    responseBodyRaw?: string;
    responseBodyParsed?: Record<string, any>;
    success: boolean;
    latencyMs: number;
    attempts?: number;
    maxRetries?: number;
    deliveredKey?: string;
    productInfo?: {
      productId?: string;
      productName?: string;
      duration?: string;
      quantity?: number;
      price?: number;
      userEmail?: string;
      chatId?: number | string;
      androidId?: string;
    };
    errorMessage?: string;
    networkError?: string;
  }): UpstreamLogEntry {
    this.loadLogs();

    const now = new Date();
    const id = `UPLOG-${now.getTime()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const formattedTime = now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    let rawBody = data.requestBodyRaw || '';
    let parsedBody = data.requestBodyParsed;

    // Try parsing body if not already structured
    if (!parsedBody && rawBody) {
      try {
        if (rawBody.startsWith('{') || rawBody.startsWith('[')) {
          parsedBody = JSON.parse(rawBody);
        } else if (rawBody.includes('=')) {
          const params = new URLSearchParams(rawBody);
          const obj: Record<string, any> = {};
          params.forEach((val, key) => {
            obj[key] = val;
          });
          parsedBody = obj;
        }
      } catch {}
    }

    let rawResp = data.responseBodyRaw || '';
    let parsedResp = data.responseBodyParsed;
    if (!parsedResp && rawResp) {
      try {
        if (rawResp.trim().startsWith('{') || rawResp.trim().startsWith('[')) {
          parsedResp = JSON.parse(rawResp);
        }
      } catch {}
    }

    // Mask sensitive secrets in headers for safe inspection
    const sanitizedHeaders: Record<string, string> = {};
    if (data.requestHeaders) {
      for (const [k, v] of Object.entries(data.requestHeaders)) {
        const lowerKey = k.toLowerCase();
        if (lowerKey.includes('key') || lowerKey.includes('token') || lowerKey.includes('secret') || lowerKey.includes('auth')) {
          if (typeof v === 'string' && v.length > 8) {
            sanitizedHeaders[k] = `${v.slice(0, 4)}***${v.slice(-4)}`;
          } else {
            sanitizedHeaders[k] = '***';
          }
        } else {
          sanitizedHeaders[k] = v;
        }
      }
    }

    // Determine provider type
    let providerType = data.providerType;
    if (!providerType) {
      const lowerUrl = (data.url || '').toLowerCase();
      const lowerName = (data.apiName || '').toLowerCase();
      if (lowerUrl.includes('adminpanels') || lowerName.includes('adminpanels')) {
        providerType = 'adminpanels';
      } else if (lowerUrl.includes('supplier') || lowerName.includes('restock')) {
        providerType = 'supplier_restock';
      } else if (lowerName.includes('api #2') || lowerName.includes('hkmodz') || lowerName.includes('custom')) {
        providerType = 'custom_api2';
      } else if (lowerName.includes('sync')) {
        providerType = 'product_sync';
      } else if (lowerName.includes('diag') || lowerName.includes('test')) {
        providerType = 'diagnostic';
      } else {
        providerType = 'other';
      }
    }

    const newEntry: UpstreamLogEntry = {
      id,
      timestamp: now.toISOString(),
      formattedTime,
      apiName: data.apiName || 'Upstream API',
      providerType,
      callerContext: data.callerContext || 'General API Request',
      url: data.url,
      method: data.method || 'POST',
      requestHeaders: sanitizedHeaders,
      requestBodyRaw: rawBody,
      requestBodyParsed: parsedBody,
      responseStatus: data.responseStatus,
      responseStatusText: data.responseStatusText || (data.responseStatus === 200 ? 'OK' : data.responseStatus ? `HTTP ${data.responseStatus}` : 'Network Error'),
      responseBodyRaw: rawResp,
      responseBodyParsed: parsedResp,
      success: data.success,
      latencyMs: Math.round(data.latencyMs),
      attempts: data.attempts || 1,
      maxRetries: data.maxRetries ?? 3,
      deliveredKey: data.deliveredKey,
      productInfo: data.productInfo,
      errorMessage: data.errorMessage,
      networkError: data.networkError
    };

    this.logs.unshift(newEntry);
    if (this.logs.length > MAX_IN_MEMORY_LOGS) {
      this.logs = this.logs.slice(0, MAX_IN_MEMORY_LOGS);
    }

    this.saveLogsDebounced();
    return newEntry;
  }

  public getLogs(options?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
    provider?: string;
    context?: string;
    success?: boolean | string;
  }): { logs: UpstreamLogEntry[]; total: number; filtered: number } {
    this.loadLogs();
    let result = [...this.logs];

    const search = (options?.search || '').trim().toLowerCase();
    if (search) {
      result = result.filter(item => {
        return (
          item.id.toLowerCase().includes(search) ||
          item.apiName.toLowerCase().includes(search) ||
          item.url.toLowerCase().includes(search) ||
          item.callerContext.toLowerCase().includes(search) ||
          item.requestBodyRaw.toLowerCase().includes(search) ||
          item.responseBodyRaw.toLowerCase().includes(search) ||
          (item.deliveredKey && item.deliveredKey.toLowerCase().includes(search)) ||
          (item.errorMessage && item.errorMessage.toLowerCase().includes(search)) ||
          (item.productInfo?.productName && item.productInfo.productName.toLowerCase().includes(search)) ||
          (item.productInfo?.productId && item.productInfo.productId.toLowerCase().includes(search)) ||
          (item.productInfo?.userEmail && item.productInfo.userEmail.toLowerCase().includes(search))
        );
      });
    }

    if (options?.status && options.status !== 'ALL') {
      const st = options.status.toUpperCase();
      if (st === 'SUCCESS' || st === '200') {
        result = result.filter(item => item.success && item.responseStatus === 200);
      } else if (st === 'FAILED' || st === 'ERROR') {
        result = result.filter(item => !item.success || item.responseStatus !== 200);
      } else if (st === 'TIMEOUT' || st === 'NETWORK_ERROR') {
        result = result.filter(item => item.responseStatus === 0 || !!item.networkError);
      } else if (st === '4XX') {
        result = result.filter(item => item.responseStatus >= 400 && item.responseStatus < 500);
      } else if (st === '5XX') {
        result = result.filter(item => item.responseStatus >= 500);
      }
    }

    if (options?.provider && options.provider !== 'ALL') {
      const p = options.provider.toLowerCase();
      result = result.filter(item => item.providerType === p || item.apiName.toLowerCase().includes(p));
    }

    if (options?.context && options.context !== 'ALL') {
      const c = options.context.toLowerCase();
      result = result.filter(item => item.callerContext.toLowerCase().includes(c));
    }

    if (options?.success !== undefined && options.success !== '') {
      const isSuccess = String(options.success) === 'true';
      result = result.filter(item => item.success === isSuccess);
    }

    const filteredTotal = result.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;

    return {
      logs: result.slice(offset, offset + limit),
      total: this.logs.length,
      filtered: filteredTotal
    };
  }

  public getLogById(id: string): UpstreamLogEntry | undefined {
    this.loadLogs();
    return this.logs.find(l => l.id === id);
  }

  public getStats(): UpstreamLogStats {
    this.loadLogs();
    const total = this.logs.length;
    let successCount = 0;
    let failCount = 0;
    let totalLatency = 0;
    let deliveredKeysCount = 0;
    let todayCount = 0;
    let lastError = '';

    const todayStr = new Date().toISOString().slice(0, 10);
    const providerCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    const callerCounts: Record<string, number> = {};

    for (const item of this.logs) {
      if (item.success) {
        successCount++;
      } else {
        failCount++;
        if (!lastError && item.errorMessage) {
          lastError = item.errorMessage;
        }
      }

      totalLatency += item.latencyMs || 0;

      if (item.deliveredKey) {
        deliveredKeysCount++;
      }

      if (item.timestamp && item.timestamp.startsWith(todayStr)) {
        todayCount++;
      }

      const pType = item.providerType || 'other';
      providerCounts[pType] = (providerCounts[pType] || 0) + 1;

      const stKey = item.responseStatus ? String(item.responseStatus) : 'NETWORK_ERROR';
      statusCounts[stKey] = (statusCounts[stKey] || 0) + 1;

      const cKey = item.callerContext || 'General';
      callerCounts[cKey] = (callerCounts[cKey] || 0) + 1;
    }

    const avgLatencyMs = total > 0 ? Math.round(totalLatency / total) : 0;
    const successRatePercent = total > 0 ? Math.round((successCount / total) * 100) : 100;

    return {
      totalRequests: total,
      successCount,
      failCount,
      successRatePercent,
      avgLatencyMs,
      deliveredKeysCount,
      todayRequestsCount: todayCount,
      providerCounts,
      statusCounts,
      callerCounts,
      lastRequestTime: this.logs[0]?.timestamp,
      lastError
    };
  }

  public clearLogs() {
    this.logs = [];
    this.saveLogsImmediate();
    console.log('[UpstreamLogger] All upstream logs cleared.');
  }

  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    this.loadLogs();
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    // CSV format
    const headers = [
      'ID',
      'Timestamp',
      'API Name',
      'Caller Context',
      'URL',
      'Method',
      'HTTP Status',
      'Success',
      'Latency (ms)',
      'Attempts',
      'Delivered Key',
      'Product ID',
      'Product Name',
      'Duration',
      'Quantity',
      'User Email',
      'Error Message'
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = this.logs.map(l => [
      escapeCsv(l.id),
      escapeCsv(l.formattedTime || l.timestamp),
      escapeCsv(l.apiName),
      escapeCsv(l.callerContext),
      escapeCsv(l.url),
      escapeCsv(l.method),
      escapeCsv(l.responseStatus),
      escapeCsv(l.success ? 'TRUE' : 'FALSE'),
      escapeCsv(l.latencyMs),
      escapeCsv(l.attempts),
      escapeCsv(l.deliveredKey || ''),
      escapeCsv(l.productInfo?.productId || ''),
      escapeCsv(l.productInfo?.productName || ''),
      escapeCsv(l.productInfo?.duration || ''),
      escapeCsv(l.productInfo?.quantity || ''),
      escapeCsv(l.productInfo?.userEmail || ''),
      escapeCsv(l.errorMessage || l.networkError || '')
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }
}

export const upstreamLogger = UpstreamLoggerService.getInstance();
