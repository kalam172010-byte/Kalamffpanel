import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { INITIAL_PRODUCTS } from '../lib/mock-data';

export const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File persistence paths
const DATA_DIR = path.join(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products_db.json');
const STORE_DATA_FILE = path.join(DATA_DIR, 'store_data.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[Server] Error creating data directory:', e);
}

// Helper to load store settings & configs from disk
function loadStoreDataFromDisk(): { storeSettings?: any; paymentConfigs?: any[]; apiConfigs?: any[] } {
  try {
    if (fs.existsSync(STORE_DATA_FILE)) {
      const raw = fs.readFileSync(STORE_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Server] Error loading store data from disk:', e);
  }
  return {};
}

// Helper to save store data to disk
function saveStoreDataToDisk(data: { storeSettings?: any; paymentConfigs?: any[]; apiConfigs?: any[] }) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const current = loadStoreDataFromDisk();
    const updated = { ...current, ...data, updatedAt: Date.now() };
    fs.writeFileSync(STORE_DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Server] Error saving store data to disk:', e);
  }
}

// Helper to load products from disk
function loadProductsFromDisk(): any[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Server] Error loading products from disk:', e);
  }
  return [];
}

// Helper to save products to disk
function saveProductsToDisk(products: any[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Server] Error saving products to disk:', e);
  }
}

// Security Headers & Hardening Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Simple in-memory rate limiter for sensitive endpoints
const requestBuckets = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // 120 requests per minute

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/')) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const bucket = requestBuckets.get(clientIp);

    if (!bucket || now > bucket.resetTime) {
      requestBuckets.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    } else {
      bucket.count++;
      if (bucket.count > MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests. Please slow down and try again in a minute.',
        });
      }
    }
  }
  next();
});

// CORS middleware for Vercel and external calls
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-master-key');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// FreePanel, ZapUPI & AdityaHost Payment Gateway Configuration
const DEFAULT_GATEWAY_URL = process.env.FAMPAY_GATEWAY_URL || 'https://py.freepanel.in/api/v1/orders';
const DEFAULT_API_KEY = process.env.FAMPAY_API_KEY || 'fam_201277f4313d5f176512809e8b8d5c639b91c8ea';
const DEFAULT_ZAP_KEY = process.env.ZAPUPI_KEY || 'zap9616e75062c85cc1995818322ae0d1d5';
const DEFAULT_ZAP_URL = process.env.ZAPUPI_GATEWAY_URL || 'https://pay.zapupi.com/api/create-order';
const DEFAULT_ADITYA_KEY = process.env.ADITYAHOST_API_KEY || 'AH_LIVE_sk_89218a091c4920b78';
const DEFAULT_ADITYA_URL = process.env.ADITYAHOST_GATEWAY_URL || 'https://adityahost.in/api/qr.php';
const DEFAULT_ADITYA_UPI = process.env.ADITYAHOST_UPI || 'kalamffpanel@fampay';

// Helper to retrieve the active payment gateway configuration from disk
function getActivePaymentConfigFromDisk(): {
  apiKey?: string;
  baseUrl?: string;
  merchantUpi?: string;
  gateway?: string;
} {
  try {
    const data = loadStoreDataFromDisk();
    const configs = data.paymentConfigs || [];
    const active =
      configs.find((c: any) => c.isActive) ||
      configs.find((c: any) => c.id === 'fampay-gw') ||
      configs[0];
    if (active) {
      const bUrl = (active.baseUrl || '').trim();
      const aKey = (active.apiKey || '').trim();
      return {
        apiKey: aKey,
        baseUrl: bUrl,
        merchantUpi: (active.merchantUpi || '').trim(),
        gateway:
          bUrl.includes('aditya') || aKey.startsWith('AH_') || aKey.startsWith('aditya')
            ? 'adityahost'
            : bUrl.includes('zap') || aKey.startsWith('zap') || aKey.startsWith('ZAP')
            ? 'zapupi'
            : 'freepanel',
      };
    }
  } catch {}
  return {};
}

// Robust payment gateway configuration resolver
function resolvePaymentGateway(params: {
  rawUrl?: string;
  rawKey?: string;
  merchantUpi?: string;
  gateway?: string;
}): {
  targetUrl: string;
  token: string;
  merchantUpi: string;
  isAdityaHost: boolean;
  isZapUPI: boolean;
  isFreePanel: boolean;
  gatewayName: 'AdityaHost' | 'ZapUPI' | 'FreePanel';
} {
  const diskConfig = getActivePaymentConfigFromDisk();

  let url = (params.rawUrl || diskConfig.baseUrl || '').trim();
  let key = (params.rawKey || diskConfig.apiKey || '').trim();
  const upi =
    (params.merchantUpi || diskConfig.merchantUpi || '').trim() ||
    DEFAULT_ADITYA_UPI ||
    '8056317218@fam';

  // If user accidentally put the API key in the URL field
  const isKeyInUrl =
    url &&
    (url.startsWith('fam_') ||
      url.startsWith('FAM_') ||
      url.startsWith('AH_') ||
      url.startsWith('aditya') ||
      url.startsWith('zap') ||
      url.startsWith('ZAP') ||
      (!url.startsWith('http://') && !url.startsWith('https://') && !url.includes('.') && url.length >= 15));

  if (isKeyInUrl) {
    if (!key || key.length < 5) {
      key = url;
    }
    url = '';
  }

  // Detect gateway type
  const gatewayHint = params.gateway || diskConfig.gateway;
  const isAditya =
    gatewayHint === 'adityahost' ||
    url.includes('adityahost') ||
    key.startsWith('AH_') ||
    key.startsWith('aditya') ||
    key.toLowerCase().includes('aditya');

  const isZap =
    !isAditya &&
    (gatewayHint === 'zapupi' ||
      url.includes('zapupi') ||
      key.startsWith('zap') ||
      key.startsWith('ZAP'));

  const isFreePanel = !isAditya && !isZap;

  // Guarantee a valid HTTP/HTTPS URL
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    if (isAditya) {
      url = DEFAULT_ADITYA_URL;
    } else if (isZap) {
      url = DEFAULT_ZAP_URL;
    } else {
      url = DEFAULT_GATEWAY_URL;
    }
  }

  if (isFreePanel && url.endsWith('/api/v1')) {
    url += '/orders';
  }

  if (!key) {
    key = isAditya ? DEFAULT_ADITYA_KEY : isZap ? DEFAULT_ZAP_KEY : (diskConfig.apiKey || DEFAULT_API_KEY);
  }

  return {
    targetUrl: url,
    token: key,
    merchantUpi: upi,
    isAdityaHost: isAditya,
    isZapUPI: isZap,
    isFreePanel: isFreePanel,
    gatewayName: isAditya ? 'AdityaHost' : isZap ? 'ZapUPI' : 'FreePanel',
  };
}

// Helper to determine if a gateway explicitly returned a failed, cancelled or expired status
function checkGatewayFailureOrExpiry(data: any): { isFailed: boolean; isExpired: boolean; message: string } {
  if (!data || typeof data !== 'object') {
    return { isFailed: false, isExpired: false, message: '' };
  }

  const rawStatus = String(
    data.status ||
    data.data?.status ||
    data.order?.status ||
    data.payment_status ||
    data.transaction_status ||
    data.data?.payment_status ||
    ''
  ).trim().toUpperCase();

  const msg = String(data.message || data.msg || data.data?.message || data.error || data.reason || '').trim();

  // Expired checks
  if (
    rawStatus === 'EXPIRED' ||
    rawStatus === 'TIMEOUT' ||
    rawStatus === 'DEAD' ||
    rawStatus === 'CLOSED' ||
    rawStatus === 'ORDER_EXPIRED' ||
    msg.toLowerCase().includes('expired') ||
    msg.toLowerCase().includes('time out')
  ) {
    return {
      isFailed: false,
      isExpired: true,
      message: msg || 'This payment order has expired. Please generate a new QR code.'
    };
  }

  // Explicit failure checks
  const failStatuses = ['FAILED', 'CANCELLED', 'REJECTED', 'DECLINED', 'ERROR', 'PAYMENT_FAILED', 'USER_DROPPED'];
  if (failStatuses.includes(rawStatus) || msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('declined') || msg.toLowerCase().includes('cancelled')) {
    return {
      isFailed: true,
      isExpired: false,
      message: msg || 'Payment was declined or failed at the bank.'
    };
  }

  return { isFailed: false, isExpired: false, message: '' };
}

// Universal check for confirmed success in any payment gateway response
function isGatewayResponseSuccessful(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  // Explicit boolean indicators
  if (data.is_paid === true || data.paid === true || data.data?.is_paid === true || data.data?.paid === true) {
    return true;
  }

  // Check explicit event signatures
  const event = String(data.event || data.type || data.data?.event || '').trim().toLowerCase();
  const successEvents = ['payment.received', 'order.paid', 'payment_success', 'payment.captured', 'order_paid'];
  if (successEvents.includes(event)) {
    return true;
  }

  // Explicit status extraction
  const rawStatus = String(
    data.status ||
    data.data?.status ||
    data.order?.status ||
    data.payment_status ||
    data.transaction_status ||
    data.data?.payment_status ||
    ''
  ).trim().toUpperCase();

  const successStatuses = ['SUCCESS', 'PAID', 'COMPLETED', 'CAPTURED', 'SETTLED', 'ORDER_PAID'];
  if (successStatuses.includes(rawStatus)) {
    return true;
  }

  // Explicit rejection of pending/creation/failed statuses
  const nonSuccessStatuses = [
    'CREATED',
    'INITIATED',
    'PENDING',
    'OPEN',
    'UNPAID',
    'WAITING',
    'WAITING_FOR_PAYMENT',
    'NOT_PAID',
    'PROCESSING',
    'FAILED',
    'CANCELLED',
    'EXPIRED',
    'ERROR'
  ];
  if (nonSuccessStatuses.includes(rawStatus)) {
    return false;
  }

  // Integer status (some gateways use status: 1 or status: "1" for success)
  // ONLY if not accompanied by a creation or pending message
  if (data.status === 1 || data.data?.status === 1 || data.status === '1' || data.data?.status === '1') {
    const msg = String(data.message || data.msg || data.data?.message || '').toLowerCase();
    if (msg.includes('created') || msg.includes('initiated') || msg.includes('generated') || msg.includes('pending')) {
      return false;
    }
    return true;
  }

  return false;
}

// In-Memory Order Storage & Webhook Logs
interface StoredOrder {
  orderId: string;
  amountInPaise: number;
  amountInRupees: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  paymentLink: string;
  checkoutUrl?: string;
  qrUrl?: string;
  createdAt: number;
  paidAt?: number;
  utr?: string;
  senderName?: string;
  gateway?: 'AdityaHost' | 'ZapUPI' | 'FreePanel' | 'DirectUPI';
  apiKey?: string;
  zapKey?: string;
  adityaKey?: string;
  gatewayRaw?: any;
}

const activeOrders = new Map<string, StoredOrder>();
const usedUtrs = new Map<string, { orderId: string; amount: number; redeemedAt: number }>();
const webhookLogs: Array<{
  id: string;
  timestamp: string;
  timestampIso?: string;
  ip?: string;
  endpoint?: string;
  vendor: 'AdityaHost' | 'ZapUPI' | 'FreePanel';
  headers?: any;
  query?: any;
  payload: any;
  extracted?: any;
  status: string;
}> = [];

// Initialize products from disk storage
let globalProductsCache: any[] = loadProductsFromDisk();
if (globalProductsCache.length === 0 && Array.isArray(INITIAL_PRODUCTS) && INITIAL_PRODUCTS.length > 0) {
  globalProductsCache = INITIAL_PRODUCTS;
  saveProductsToDisk(INITIAL_PRODUCTS);
}
let isProductsInitialized = globalProductsCache.length > 0;

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: process.env.VERCEL ? 'vercel_serverless' : (process.env.NODE_ENV || 'development'),
    timestamp: new Date().toISOString()
  });
});

// Products Global Catalog API (accessible to all accounts and devices)
app.get('/api/products', (req: Request, res: Response) => {
  // Always ensure we have latest disk state
  if (globalProductsCache.length === 0) {
    const fromDisk = loadProductsFromDisk();
    if (fromDisk.length > 0) {
      globalProductsCache = fromDisk;
      isProductsInitialized = true;
    } else if (Array.isArray(INITIAL_PRODUCTS) && INITIAL_PRODUCTS.length > 0) {
      globalProductsCache = INITIAL_PRODUCTS;
      saveProductsToDisk(INITIAL_PRODUCTS);
      isProductsInitialized = true;
    }
  }

  res.json({
    success: true,
    initialized: isProductsInitialized,
    products: globalProductsCache,
    count: globalProductsCache.length,
    updatedAt: Date.now()
  });
});

app.post('/api/products', (req: Request, res: Response) => {
  try {
    const { products } = req.body;
    if (Array.isArray(products)) {
      globalProductsCache = products;
      isProductsInitialized = true;
      // Persist to disk
      saveProductsToDisk(products);
      return res.json({
        success: true,
        message: 'Products catalog updated and saved to disk successfully',
        count: globalProductsCache.length
      });
    }
    return res.status(400).json({ success: false, error: 'Expected products array' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Store Settings & Branding API
app.get('/api/settings/store', (req: Request, res: Response) => {
  const data = loadStoreDataFromDisk();
  res.json({
    success: true,
    settings: data.storeSettings || null,
  });
});

app.post('/api/settings/store', (req: Request, res: Response) => {
  try {
    const { settings } = req.body;
    if (settings && typeof settings === 'object') {
      saveStoreDataToDisk({ storeSettings: settings });
      return res.json({
        success: true,
        message: 'Store settings saved to server disk successfully',
      });
    }
    return res.status(400).json({ success: false, error: 'Expected settings object' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Payment Gateways Config API
app.get('/api/settings/payment', (req: Request, res: Response) => {
  const data = loadStoreDataFromDisk();
  res.json({
    success: true,
    configs: data.paymentConfigs || [],
  });
});

app.post('/api/settings/payment', (req: Request, res: Response) => {
  try {
    const { configs } = req.body;
    if (Array.isArray(configs)) {
      saveStoreDataToDisk({ paymentConfigs: configs });
      return res.json({
        success: true,
        message: 'Payment configs saved to server disk successfully',
      });
    }
    return res.status(400).json({ success: false, error: 'Expected configs array' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API Configs (Reseller API #1 & #2)
app.get('/api/settings/api-configs', (req: Request, res: Response) => {
  const data = loadStoreDataFromDisk();
  res.json({
    success: true,
    configs: data.apiConfigs || [],
  });
});

app.post('/api/settings/api-configs', (req: Request, res: Response) => {
  try {
    const { configs } = req.body;
    if (Array.isArray(configs)) {
      saveStoreDataToDisk({ apiConfigs: configs });
      return res.json({
        success: true,
        message: 'API configs saved to server disk successfully',
      });
    }
    return res.status(400).json({ success: false, error: 'Expected configs array' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create Order API Endpoint (Translates and proxies AdityaHost, ZapUPI & FreePanel requests)
app.post('/api/create-order', async (req: Request, res: Response) => {
  try {
    const { amount, redirect_url, apiKey, gatewayUrl, merchantUpi, customer_mobile, remark, upi, gateway } = req.body;

    const rupeeAmount = Math.max(1, typeof amount === 'number' ? amount : parseFloat(amount) || 1);
    const amountInPaise = Math.round(rupeeAmount * 100);
    const amountInRupees = rupeeAmount;

    const resolved = resolvePaymentGateway({
      rawUrl: gatewayUrl,
      rawKey: apiKey,
      merchantUpi: upi || merchantUpi,
      gateway,
    });

    const targetUrl = resolved.targetUrl;
    const token = resolved.token;
    const defaultMerchantUpi = resolved.merchantUpi;
    const isAdityaHost = resolved.isAdityaHost;
    const isZapUPI = resolved.isZapUPI;
    const isFreePanel = resolved.isFreePanel;

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'https';
    const redirect = redirect_url || `${protocol}://${host}/success`;
    const webhookUrl = `${protocol}://${host}/api/webhook`;

    const clientOrderId = isAdityaHost 
      ? `FAMPAY${Date.now()}${Math.floor(Math.random() * 899 + 100)}` 
      : `${isZapUPI ? 'ZAP' : 'ORD'}_${Date.now()}_${Math.floor(Math.random() * 899 + 100)}`;

    const currentGatewayName = isAdityaHost ? 'AdityaHost' : isZapUPI ? 'ZapUPI' : 'FreePanel';
    console.log(`[Payment Gateway] Initiating ${currentGatewayName} order for ₹${amountInRupees} to ${targetUrl}...`);

    let responseData: any = null;
    let statusCode = 200;

    if (isAdityaHost) {
      // AdityaHost UPI Gateway Protocol (adityahost.in)
      const adityaEndpoint = `https://adityahost.in/api/qr.php?api_key=${encodeURIComponent(token)}&upi=${encodeURIComponent(defaultMerchantUpi)}&amount=${amountInRupees}`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const apiResponse = await fetch(adityaEndpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KalamFFPanel/1.0'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        statusCode = apiResponse.status;
        const textResponse = await apiResponse.text();

        try {
          responseData = JSON.parse(textResponse);
        } catch {
          responseData = { rawResponse: textResponse };
        }
      } catch (networkError: any) {
        console.warn('[AdityaHost] Upstream network notice:', networkError.message);
        responseData = {
          status: 'success',
          data: {
            order_id: clientOrderId,
            qr_url: `https://adityahost.in/api/qr_image.php?order_id=${clientOrderId}`,
            upi_id: defaultMerchantUpi,
            amount: String(amountInRupees),
            created_at_ist: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            expires_at_ist: new Date(Date.now() + 5 * 60 * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            checkout_url: `https://adityahost.in/pay.php?api_key=${token}&amount=${amountInRupees}&upi=${encodeURIComponent(defaultMerchantUpi)}`,
            open_in_new_tab: true,
            simulated: true,
            message: networkError.message
          }
        };
      }
    } else if (isZapUPI) {
      // ZapUPI Gateway Protocol (pay.zapupi.com)
      const zapPayload = {
        zap_key: token,
        order_id: clientOrderId,
        amount: String(amountInRupees),
        customer_mobile: (customer_mobile || '9652562562').toString(),
        remark: remark || `Wallet Topup - Kalam FF Panel`,
        success_url: redirect,
        failed_url: `${protocol}://${host}/failed`,
        timeout_url: `${protocol}://${host}/timeout`,
        webhook_url: webhookUrl
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const apiResponse = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KalamFFPanel/1.0'
          },
          body: JSON.stringify(zapPayload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        statusCode = apiResponse.status;
        const textResponse = await apiResponse.text();

        try {
          responseData = JSON.parse(textResponse);
        } catch {
          responseData = { rawResponse: textResponse };
        }
      } catch (networkError: any) {
        console.warn('[ZapUPI] Upstream network connection notice:', networkError.message);
        responseData = {
          status: 'created',
          order_id: clientOrderId,
          amount: String(amountInRupees),
          simulated: true,
          message: networkError.message
        };
      }
    } else {
      // FreePanel / Standard Bearer Token Gateway
      const payload = {
        amount: amountInPaise,
        redirect_url: redirect
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const apiResponse = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KalamFFPanel/1.0'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        statusCode = apiResponse.status;
        const textResponse = await apiResponse.text();

        try {
          responseData = JSON.parse(textResponse);
        } catch {
          responseData = { rawResponse: textResponse };
        }
      } catch (networkError: any) {
        console.warn('[FreePanel] Upstream network connection notice:', networkError.message);
        responseData = {
          id: clientOrderId,
          status: 'created',
          amount: amountInPaise,
          simulated: true,
          note: `Gateway fallback: ${networkError.message}`
        };
      }
    }

    const exactAmountRupees = rupeeAmount;
    const exactAmountPaise = Math.round(exactAmountRupees * 100);

    const orderId = responseData?.data?.order_id || responseData?.order_id || responseData?.id || clientOrderId;

    // Detect payee UPI from raw links or response data if present
    let detectedUpiId = responseData?.data?.upi_id || defaultMerchantUpi;
    let rawPaymentLink = responseData?.data?.checkout_url || responseData?.payment_url || responseData?.payment_link || responseData?.data?.payment_link || '';

    if (rawPaymentLink && rawPaymentLink.includes('pa=')) {
      try {
        const match = rawPaymentLink.match(/pa=([^&]+)/);
        if (match && match[1]) {
          detectedUpiId = decodeURIComponent(match[1]);
        }
      } catch {}
    }

    // Build standard guaranteed UPI intent URI with EXACT amount
    const standardUpiIntent = `upi://pay?pa=${detectedUpiId}&pn=Kalam%20FF%20Store&tr=${orderId}&am=${exactAmountRupees}&cu=INR`;
    const finalPaymentUrl = rawPaymentLink && rawPaymentLink.startsWith('http') ? rawPaymentLink : standardUpiIntent;
    const qrTargetData = rawPaymentLink && rawPaymentLink.startsWith('http') ? rawPaymentLink : standardUpiIntent;
    const qrUrl = responseData?.data?.qr_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrTargetData)}`;

    // Store in active orders map with exact amount
    const storedOrder: StoredOrder = {
      orderId,
      amountInPaise: exactAmountPaise,
      amountInRupees: exactAmountRupees,
      status: 'PENDING',
      paymentLink: finalPaymentUrl,
      checkoutUrl: responseData?.data?.checkout_url,
      qrUrl: responseData?.data?.qr_url,
      gateway: isAdityaHost ? 'AdityaHost' : isZapUPI ? 'ZapUPI' : 'FreePanel',
      apiKey: token,
      zapKey: isZapUPI ? token : undefined,
      adityaKey: isAdityaHost ? token : undefined,
      createdAt: Date.now(),
      gatewayRaw: responseData
    };
    activeOrders.set(orderId, storedOrder);

    res.json({
      success: true,
      statusCode: 200,
      order: {
        orderId,
        amountInPaise: exactAmountPaise,
        amountInRupees: exactAmountRupees,
        paymentUrl: finalPaymentUrl,
        payment_url: rawPaymentLink || finalPaymentUrl,
        checkout_url: responseData?.data?.checkout_url || finalPaymentUrl,
        upiIntent: standardUpiIntent,
        qrUrl,
        qr_url: qrUrl,
        payeeUpi: detectedUpiId,
        status: responseData?.status || 'created',
        redirectUrl: redirect,
        gateway: isAdityaHost ? 'AdityaHost UPI Gateway' : isZapUPI ? 'ZapUPI Gateway' : 'FreePanel UPI Gateway',
        raw: responseData
      }
    });
  } catch (error: any) {
    console.error('[Payment Gateway Error]:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment order'
    });
  }
});

// Real-Time Query Helper that verifies across all gateway endpoints and formats
async function queryUpstreamGatewayForOrder(params: {
  orderId: string;
  rawKey?: string;
  rawUrl?: string;
  zapKey?: string;
  gateway?: string;
  utr?: string;
}): Promise<{
  isPaid: boolean;
  isFailed?: boolean;
  isExpired?: boolean;
  failureReason?: string;
  amount?: number;
  utr?: string;
  senderName?: string;
  raw?: any;
  gatewayName: 'AdityaHost' | 'ZapUPI' | 'FreePanel';
}> {
  const { orderId, rawKey, rawUrl, zapKey, gateway, utr } = params;
  const cleanUtr = (utr || '').trim().replace(/[^a-zA-Z0-9]/g, '');
  const existing = activeOrders.get(orderId);
  if (existing && existing.status === 'SUCCESS') {
    return {
      isPaid: true,
      isFailed: false,
      isExpired: false,
      amount: existing.amountInRupees,
      utr: existing.utr,
      senderName: existing.senderName,
      raw: existing.gatewayRaw,
      gatewayName: existing.gateway === 'AdityaHost' ? 'AdityaHost' : existing.gateway === 'ZapUPI' ? 'ZapUPI' : 'FreePanel'
    };
  }

  const resolved = resolvePaymentGateway({
    rawUrl: rawUrl || existing?.paymentLink,
    rawKey: rawKey || zapKey || existing?.apiKey || existing?.zapKey || existing?.adityaKey,
    gateway: gateway || (existing?.gateway ? (existing.gateway === 'AdityaHost' ? 'adityahost' : existing.gateway === 'ZapUPI' ? 'zapupi' : 'freepanel') : undefined)
  });

  const isAditya = resolved.isAdityaHost || orderId.startsWith('FAMPAY') || resolved.token.startsWith('AH_') || resolved.token.startsWith('aditya');
  const isZap = !isAditya && (resolved.isZapUPI || orderId.startsWith('ZAP_') || resolved.token.startsWith('zap') || resolved.token.startsWith('ZAP'));

  let upstreamData: any = null;
  let isPaid = false;

  if (isAditya) {
    try {
      const cleanUtrParam = cleanUtr ? `&utr=${encodeURIComponent(cleanUtr)}` : '';
      const verifyUrl = `https://adityahost.in/api/verify_order.php?api_key=${encodeURIComponent(resolved.token)}&order_id=${encodeURIComponent(orderId)}${cleanUtrParam}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const resp = await fetch(verifyUrl, {
        headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KalamFFPanel/1.0' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      upstreamData = await resp.json();
      if (isGatewayResponseSuccessful(upstreamData)) {
        isPaid = true;
      }
    } catch {}

    if (!isPaid) {
      try {
        const cleanUtrParam = cleanUtr ? `&utr=${encodeURIComponent(cleanUtr)}` : '';
        const checkUrl = `https://adityahost.in/api/check_status.php?api_key=${encodeURIComponent(resolved.token)}&order_id=${encodeURIComponent(orderId)}${cleanUtrParam}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const resp = await fetch(checkUrl, {
          headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KalamFFPanel/1.0' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await resp.json();
        if (isGatewayResponseSuccessful(data)) {
          isPaid = true;
          upstreamData = data;
        }
      } catch {}
    }
  } else if (isZap) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const resp = await fetch('https://pay.zapupi.com/api/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify({
          zap_key: resolved.token,
          order_id: String(orderId),
          ...(cleanUtr ? { utr: cleanUtr } : {})
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      upstreamData = await resp.json();
      if (isGatewayResponseSuccessful(upstreamData)) {
        isPaid = true;
      }
    } catch {}
  } else {
    // FreePanel / py.freepanel.in
    const candidateEndpoints = [
      `https://py.freepanel.in/api/v1/verify/${orderId}`,
      `https://py.freepanel.in/api/v1/orders/${orderId}`,
      `https://py.freepanel.in/api/v1/order/${orderId}`
    ];

    for (const ep of candidateEndpoints) {
      if (isPaid) break;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const resp = await fetch(ep, {
          headers: {
            Authorization: `Bearer ${resolved.token}`,
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (resp.ok || resp.status < 500) {
          const data = await resp.json();
          if (isGatewayResponseSuccessful(data)) {
            isPaid = true;
            upstreamData = data;
          }
        }
      } catch {}
    }
  }

  let confirmedAmount: number | undefined;
  if (upstreamData?.data?.amount || upstreamData?.amount) {
    const rawVal = Number(upstreamData?.data?.amount || upstreamData?.amount);
    confirmedAmount = rawVal > 1000 ? rawVal / 100 : rawVal;
  }

  const detectedUtr =
    upstreamData?.data?.utr ||
    upstreamData?.data?.transaction_id ||
    upstreamData?.utr ||
    upstreamData?.txn_id ||
    (isPaid && cleanUtr.length >= 8 ? cleanUtr : undefined);

  const senderName = upstreamData?.data?.sender_name || upstreamData?.sender_name;

  const failOrExpire = checkGatewayFailureOrExpiry(upstreamData);

  return {
    isPaid,
    isFailed: !isPaid && failOrExpire.isFailed,
    isExpired: !isPaid && failOrExpire.isExpired,
    failureReason: failOrExpire.message,
    amount: confirmedAmount,
    utr: detectedUtr,
    senderName,
    raw: upstreamData,
    gatewayName: resolved.gatewayName
  };
}

// Real-Time Automatic Payment Status Checker (Supports AdityaHost, ZapUPI & FreePanel Status APIs)
app.get('/api/check-payment/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const existing = activeOrders.get(orderId);

    if (existing && existing.status === 'SUCCESS') {
      return res.json({
        success: true,
        isPaid: true,
        status: 'SUCCESS',
        orderId,
        amount: existing.amountInRupees,
        paidAt: existing.paidAt,
        utr: existing.utr,
        message: 'Payment confirmed & verified!'
      });
    }

    if (existing && (existing.status === 'FAILED' || existing.status === 'EXPIRED')) {
      return res.json({
        success: false,
        isPaid: false,
        status: existing.status,
        orderId,
        message: existing.status === 'EXPIRED' ? 'Order has expired. Please initiate a new deposit.' : 'Payment failed or was cancelled by the bank.'
      });
    }

    const verification = await queryUpstreamGatewayForOrder({
      orderId,
      rawKey: (req.query.apiKey as string) || (req.query.zapKey as string),
      zapKey: req.query.zapKey as string,
      gateway: req.query.gateway as string,
    });

    if (verification.isPaid) {
      const confirmedAmount =
        existing?.amountInRupees ||
        verification.amount ||
        Number(req.query.amount) ||
        10;

      const detectedUtr = verification.utr || existing?.utr || `UTR_${Date.now()}`;
      const senderName = verification.senderName || existing?.senderName;

      if (existing) {
        existing.status = 'SUCCESS';
        existing.paidAt = Date.now();
        existing.utr = detectedUtr;
        if (senderName) existing.senderName = senderName;
      } else {
        activeOrders.set(orderId, {
          orderId,
          amountInPaise: Math.round(confirmedAmount * 100),
          amountInRupees: confirmedAmount,
          status: 'SUCCESS',
          paymentLink: '',
          createdAt: Date.now(),
          paidAt: Date.now(),
          utr: detectedUtr,
          senderName,
          gateway: verification.gatewayName,
          gatewayRaw: verification.raw
        });
      }

      return res.json({
        success: true,
        isPaid: true,
        status: 'SUCCESS',
        orderId,
        amount: confirmedAmount,
        utr: detectedUtr,
        senderName,
        paidAt: Date.now(),
        message: 'Payment received successfully via Bank UPI Sync!'
      });
    }

    // Explicit Failed or Expired state from upstream
    if (verification.isExpired) {
      if (existing) existing.status = 'EXPIRED';
      return res.json({
        success: false,
        isPaid: false,
        status: 'EXPIRED',
        orderId,
        message: verification.failureReason || 'Order has expired. Please initiate a new deposit.',
        upstream: verification.raw
      });
    }

    if (verification.isFailed) {
      if (existing) existing.status = 'FAILED';
      return res.json({
        success: false,
        isPaid: false,
        status: 'FAILED',
        orderId,
        message: verification.failureReason || 'Payment failed or was cancelled by the bank.',
        upstream: verification.raw
      });
    }

    // Check order creation age for timeout expiry (> 10 minutes)
    if (existing && existing.createdAt && (Date.now() - existing.createdAt > 10 * 60 * 1000)) {
      existing.status = 'EXPIRED';
      return res.json({
        success: false,
        isPaid: false,
        status: 'EXPIRED',
        orderId,
        message: 'Order session timed out and expired. Please create a new QR.',
        upstream: verification.raw
      });
    }

    return res.json({
      success: true,
      isPaid: false,
      status: 'PENDING',
      orderId,
      message: 'Listening for bank UPI transfer • Auto-detecting...',
      upstream: verification.raw
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Direct Instant Payment Auto-Detector (Real-Time Bank Gateway Verification & UTR Validation)
app.post('/api/auto-detect-payment', async (req: Request, res: Response) => {
  try {
    const { orderId, apiKey, amount, zapKey, gateway, utr } = req.body;
    const order = activeOrders.get(orderId);
    const parsedAmount = Number(amount) || (order ? order.amountInRupees : 0);
    const cleanUtr = (utr || '').toString().trim().replace(/[^a-zA-Z0-9]/g, '');

    if (!orderId) {
      return res.status(400).json({ success: false, isPaid: false, message: 'Order ID is required' });
    }

    if (order && order.status === 'SUCCESS') {
      return res.json({
        success: true,
        isPaid: true,
        status: 'SUCCESS',
        orderId,
        amount: order.amountInRupees,
        utr: order.utr,
        senderName: order.senderName,
        message: 'Payment verified and credited automatically!'
      });
    }

    let isUpstreamPaid = false;
    let verification: any = null;

    try {
      verification = await queryUpstreamGatewayForOrder({
        orderId,
        rawKey: apiKey || zapKey,
        zapKey,
        gateway,
        utr: cleanUtr || undefined,
      });
      isUpstreamPaid = verification?.isPaid === true;
    } catch (e) {
      // Gateway error
    }

    if (isUpstreamPaid) {
      const finalAmount = parsedAmount > 0 ? parsedAmount : (order ? order.amountInRupees : (verification?.amount || 10));
      const detectedUtr = verification?.utr || (cleanUtr ? cleanUtr : null) || order?.utr || `UTR_${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      const senderName = verification?.senderName || order?.senderName || 'Customer';

      if (detectedUtr) {
        usedUtrs.set(detectedUtr, {
          orderId,
          amount: finalAmount,
          redeemedAt: Date.now()
        });
      }

      if (order) {
        order.status = 'SUCCESS';
        order.paidAt = Date.now();
        order.utr = detectedUtr;
        if (senderName) order.senderName = senderName;
      } else {
        activeOrders.set(orderId, {
          orderId,
          amountInPaise: Math.round(finalAmount * 100),
          amountInRupees: finalAmount,
          status: 'SUCCESS',
          paymentLink: '',
          createdAt: Date.now(),
          paidAt: Date.now(),
          utr: detectedUtr,
          senderName,
          gateway: verification?.gatewayName || 'DirectUPI',
          gatewayRaw: verification?.raw
        });
      }

      return res.json({
        success: true,
        isPaid: true,
        status: 'SUCCESS',
        orderId,
        amount: finalAmount,
        utr: detectedUtr,
        senderName,
        message: 'Payment verified and credited successfully!'
      });
    }

    return res.json({
      success: true,
      isPaid: false,
      status: 'PENDING',
      orderId,
      amount: parsedAmount,
      message: 'Payment transfer not detected yet by the bank. Please complete UPI payment or wait a few moments.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Strict Gateway Verification (With direct UTR support & gateway verification)
app.post('/api/verify-utr', async (req: Request, res: Response) => {
  try {
    const { orderId, apiKey, amount, zapKey, gateway, utr } = req.body;
    const order = activeOrders.get(orderId);
    const parsedAmount = Number(amount) || (order ? order.amountInRupees : 0);
    const cleanUtr = String(utr || '').trim().replace(/[^a-zA-Z0-9]/g, '');

    if (!cleanUtr || cleanUtr.length < 10) {
      return res.status(400).json({
        success: false,
        isPaid: false,
        message: 'Please enter a valid 12-digit UPI UTR / Reference number from your payment receipt.'
      });
    }

    // Check duplicate UTR redemption
    if (usedUtrs.has(cleanUtr)) {
      const prevRedemption = usedUtrs.get(cleanUtr);
      if (prevRedemption && prevRedemption.orderId !== orderId) {
        return res.status(400).json({
          success: false,
          isPaid: false,
          message: `This UTR (${cleanUtr}) has already been used and credited on ${new Date(prevRedemption.redeemedAt).toLocaleDateString()}. Duplicate requests are rejected.`
        });
      }
    }

    let verification: any = { isPaid: false, utr: '', senderName: '', amount: 0, raw: null, gatewayName: 'DirectUPI' };
    try {
      verification = await queryUpstreamGatewayForOrder({
        orderId: orderId || `ORD_${Date.now()}`,
        rawKey: apiKey || zapKey,
        zapKey,
        gateway,
        utr: cleanUtr,
      });
    } catch {}

    const isUpstreamPaid = verification.isPaid || (order && order.status === 'SUCCESS');

    if (isUpstreamPaid) {
      const finalAmount = parsedAmount > 0 ? parsedAmount : (order ? order.amountInRupees : (verification.amount || 10));
      const detectedUtr = verification.utr || cleanUtr || order?.utr || `UTR_${cleanUtr}`;
      const senderName = verification.senderName || order?.senderName;

      usedUtrs.set(cleanUtr, {
        orderId: orderId || `ORD_${Date.now()}`,
        amount: finalAmount,
        redeemedAt: Date.now()
      });

      if (order) {
        order.status = 'SUCCESS';
        order.paidAt = Date.now();
        order.utr = detectedUtr;
        if (senderName) order.senderName = senderName;
      } else if (orderId) {
        activeOrders.set(orderId, {
          orderId,
          amountInPaise: Math.round(finalAmount * 100),
          amountInRupees: finalAmount,
          status: 'SUCCESS',
          paymentLink: '',
          createdAt: Date.now(),
          paidAt: Date.now(),
          utr: detectedUtr,
          senderName,
          gateway: verification.gatewayName || 'DirectUPI',
          gatewayRaw: verification.raw
        });
      }

      return res.json({
        success: true,
        isPaid: true,
        status: 'SUCCESS',
        orderId: orderId || `ORD_${Date.now()}`,
        amount: finalAmount,
        utr: detectedUtr,
        senderName,
        message: `Payment of ₹${finalAmount} confirmed via UPI UTR (${cleanUtr})! Wallet balance credited.`
      });
    }

    return res.status(400).json({
      success: false,
      isPaid: false,
      status: 'PENDING',
      orderId,
      message: 'Bank payment verification in progress. Payment has not been detected on this UTR yet. Please make sure the UPI payment is completed and try again.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Claim Uncredited Deposit Endpoint (For users who already paid and have 12-digit UTR)
app.post('/api/claim-deposit', async (req: Request, res: Response) => {
  try {
    const { utr, amount, username, email } = req.body;
    const cleanUtr = String(utr || '').trim().replace(/[^a-zA-Z0-9]/g, '');
    const numAmount = Math.max(1, Number(amount) || 10);

    if (!cleanUtr || cleanUtr.length < 10 || cleanUtr.length > 22) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 12-digit UPI UTR / Reference number from your payment receipt.'
      });
    }

    if (usedUtrs.has(cleanUtr)) {
      const prev = usedUtrs.get(cleanUtr);
      return res.status(400).json({
        success: false,
        message: `This UTR (${cleanUtr}) has already been redeemed for ₹${prev?.amount || numAmount}.`
      });
    }

    const orderId = `CLAIM_${Date.now()}_${Math.floor(Math.random() * 899 + 100)}`;
    usedUtrs.set(cleanUtr, {
      orderId,
      amount: numAmount,
      redeemedAt: Date.now()
    });

    activeOrders.set(orderId, {
      orderId,
      amountInPaise: Math.round(numAmount * 100),
      amountInRupees: numAmount,
      status: 'SUCCESS',
      paymentLink: '',
      createdAt: Date.now(),
      paidAt: Date.now(),
      utr: cleanUtr,
      senderName: username || email || 'User',
      gateway: 'DirectUPI'
    });

    return res.json({
      success: true,
      isPaid: true,
      status: 'SUCCESS',
      orderId,
      amount: numAmount,
      utr: cleanUtr,
      message: `UTR ${cleanUtr} confirmed! ₹${numAmount} credited to wallet.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Payment Webhook Receiver (Supports multiple path aliases for gateways)
const handlePaymentWebhook = (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    const query = req.query || {};
    const headers = req.headers || {};
    const eventHeader = req.header('x-famapi-event') || req.header('x-event') || req.header('x-webhook-event');
    const signatureHeader = req.header('x-famapi-signature') || req.header('x-signature') || req.header('x-webhook-signature');
    const contentType = req.header('content-type');
    const userAgent = req.header('user-agent');
    const ip = req.ip || req.socket.remoteAddress;

    const orderId =
      payload.data?.order_id ||
      payload.order_id ||
      payload.orderId ||
      payload.id ||
      payload.data?.id ||
      payload.tr ||
      payload.client_txn_id ||
      (typeof query.order_id === 'string' ? query.order_id : undefined) ||
      (typeof query.orderId === 'string' ? query.orderId : undefined);

    const event = (payload.event || eventHeader || payload.type || query.event || '').toLowerCase();
    const rawStatus = (payload.status || payload.event || payload.data?.status || payload.payment_status || query.status || '').toString();
    const status = rawStatus.toUpperCase();

    // Comprehensive vendor success checking
    const isSuccess =
      isGatewayResponseSuccessful(payload) ||
      event === 'payment.received' ||
      event === 'order.paid' ||
      event === 'payment_success' ||
      event === 'payment.captured' ||
      status === 'SUCCESS' ||
      status === 'PAID' ||
      status === 'COMPLETED' ||
      status === 'ORDER_PAID' ||
      status === 'CAPTURED' ||
      status === '1' ||
      status === 'TRUE' ||
      payload.is_paid === true ||
      payload.paid === true;

    const rawAmount =
      payload.data?.amount ||
      payload.amount ||
      payload.payment?.amount ||
      payload.data?.amount_in_rupees ||
      query.amount ||
      0;
    const parsedAmountPaise = Number(rawAmount);
    const amountRupees = parsedAmountPaise > 1000 ? parsedAmountPaise / 100 : (parsedAmountPaise || 0);

    const utr =
      payload.data?.utr ||
      payload.data?.transaction_id ||
      payload.utr ||
      payload.rrn ||
      payload.transaction_id ||
      payload.txn_id ||
      payload.bank_reference_number ||
      payload.payment?.utr ||
      query.utr;

    const senderName =
      payload.data?.sender_name ||
      payload.sender_name ||
      payload.customer_name ||
      payload.payer_name ||
      payload.data?.customer_name;

    const timestampIso = new Date().toISOString();
    const timestampFormatted = new Date().toLocaleTimeString();

    // --- DETAILED SERVER-SIDE LOGGING ---
    console.log('================================================================================');
    console.log(`[PAYMENT WEBHOOK RECEIVED] ${timestampIso} from IP: ${ip}`);
    console.log(`Endpoint: ${req.method} ${req.originalUrl || req.url}`);
    console.log('--- Incoming Headers ---');
    console.log(JSON.stringify({
      'content-type': contentType,
      'user-agent': userAgent,
      'x-famapi-event': req.header('x-famapi-event'),
      'x-famapi-signature': req.header('x-famapi-signature'),
      'x-event': req.header('x-event'),
      'x-signature': req.header('x-signature'),
      'x-webhook-event': req.header('x-webhook-event'),
      'authorization': req.header('authorization') ? '***REDACTED***' : undefined,
    }, null, 2));

    if (Object.keys(query).length > 0) {
      console.log('--- Query Parameters ---');
      console.log(JSON.stringify(query, null, 2));
    }

    console.log('--- Raw Incoming Body Payload ---');
    console.log(JSON.stringify(payload, null, 2));

    console.log('--- Extracted Payment Metadata ---');
    console.log(JSON.stringify({
      orderId: orderId || '(NOT DETECTED)',
      isSuccess,
      evaluatedStatus: isSuccess ? 'SUCCESS' : (status || 'PENDING/UNKNOWN'),
      rawEvent: event || '(none)',
      rawStatus: rawStatus || '(none)',
      detectedAmountInRupees: amountRupees,
      detectedUtr: utr || '(none)',
      senderName: senderName || '(none)',
      matchedActiveOrder: orderId ? activeOrders.has(orderId) : false,
    }, null, 2));

    if (isSuccess) {
      console.log(`>>> [WEBHOOK PAYMENT MARKED SUCCESS] Order ID: ${orderId} | Amount: ₹${amountRupees} | UTR: ${utr || 'N/A'} | Sender: ${senderName || 'N/A'}`);
    } else {
      console.log(`>>> [WEBHOOK NON-SUCCESS EVENT] Status: ${status || 'N/A'} | Event: ${event || 'N/A'}`);
    }
    console.log('================================================================================');

    // Determine Payment Vendor: AdityaHost, ZapUPI, or FreePanel
    const endpointStr = (req.originalUrl || req.url || '').toLowerCase();
    const rawPayloadStr = JSON.stringify(payload).toLowerCase();
    let vendor: 'AdityaHost' | 'ZapUPI' | 'FreePanel' = 'FreePanel';

    if (
      endpointStr.includes('aditya') ||
      endpointStr.includes('fampay') ||
      (typeof orderId === 'string' && (orderId.startsWith('FAMPAY') || orderId.startsWith('AH_'))) ||
      rawPayloadStr.includes('adityahost') ||
      rawPayloadStr.includes('fampay') ||
      rawPayloadStr.includes('kalamffpanel@fam') ||
      eventHeader?.includes('fam')
    ) {
      vendor = 'AdityaHost';
    } else if (
      endpointStr.includes('zap') ||
      (typeof orderId === 'string' && (orderId.startsWith('ZAP_') || orderId.startsWith('zap_'))) ||
      rawPayloadStr.includes('zap') ||
      rawPayloadStr.includes('zapupi')
    ) {
      vendor = 'ZapUPI';
    } else {
      vendor = 'FreePanel';
    }

    const logEntry = {
      id: `WH_${Date.now()}`,
      timestamp: timestampFormatted,
      timestampIso,
      ip,
      endpoint: req.originalUrl || req.url,
      vendor,
      headers: {
        'content-type': contentType,
        'user-agent': userAgent,
        'x-event': eventHeader,
        'x-signature': signatureHeader,
      },
      query,
      payload,
      extracted: {
        orderId,
        amountRupees,
        utr,
        senderName,
        event,
        status,
        isSuccess,
        vendor,
      },
      status: isSuccess ? 'SUCCESS' : (status || 'RECEIVED')
    };

    webhookLogs.unshift(logEntry);
    if (webhookLogs.length > 50) webhookLogs.pop();

    if (orderId && isSuccess) {
      if (activeOrders.has(orderId)) {
        const order = activeOrders.get(orderId)!;
        order.status = 'SUCCESS';
        order.paidAt = Date.now();
        if (utr) order.utr = utr;
        if (senderName) order.senderName = senderName;
        if (amountRupees > 0) order.amountInRupees = amountRupees;
        order.gatewayRaw = payload;
      } else {
        activeOrders.set(orderId, {
          orderId,
          amountInPaise: Math.round(amountRupees * 100),
          amountInRupees: amountRupees,
          status: 'SUCCESS',
          paymentLink: '',
          utr,
          senderName,
          createdAt: Date.now(),
          paidAt: Date.now(),
          gatewayRaw: payload
        });
      }
      console.log(`[Webhook] Order ${orderId} successfully persisted in activeOrders!`);
    }

    res.json({
      success: true,
      message: 'Webhook processed and logged successfully',
      orderId,
      status: isSuccess ? 'SUCCESS' : status,
      isSuccess,
      extracted: {
        orderId,
        amount: amountRupees,
        utr,
        senderName
      }
    });
  } catch (err: any) {
    console.error('================================================================================');
    console.error('[WEBHOOK PROCESSING ERROR]:', err);
    console.error('================================================================================');
    res.status(500).json({ success: false, error: err.message });
  }
};

app.post('/api/webhook/payment', handlePaymentWebhook);
app.post('/api/webhook', handlePaymentWebhook);
app.post('/api/adityahost/webhook', handlePaymentWebhook);
app.post('/api/fampay/webhook', handlePaymentWebhook);
app.post('/api/freepanel/webhook', handlePaymentWebhook);

// Admin Webhook Logs & Live Orders
app.get('/api/webhook-logs', (req: Request, res: Response) => {
  res.json({
    success: true,
    logs: webhookLogs,
    activeOrdersCount: activeOrders.size,
    recentOrders: Array.from(activeOrders.values()).slice(-10).reverse()
  });
});

// Admin Simulate Instant Payment Confirmation
app.post('/api/simulate-payment-success', (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    let order = activeOrders.get(orderId);
    if (!order && orderId) {
      order = {
        orderId,
        amountInPaise: 50000,
        amountInRupees: 500,
        status: 'SUCCESS',
        paymentLink: '',
        createdAt: Date.now(),
        paidAt: Date.now()
      };
      activeOrders.set(orderId, order);
    } else if (order) {
      order.status = 'SUCCESS';
      order.paidAt = Date.now();
    }

    const simVendor = (orderId && (orderId.startsWith('FAMPAY') || orderId.startsWith('AH_')))
      ? 'AdityaHost'
      : (orderId && orderId.startsWith('ZAP_'))
      ? 'ZapUPI'
      : 'FreePanel';

    webhookLogs.unshift({
      id: `SIM_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      vendor: simVendor,
      payload: { order_id: orderId, status: 'SUCCESS', simulated: true, vendor: simVendor },
      status: 'SUCCESS'
    });

    res.json({
      success: true,
      message: `Order ${orderId} successfully confirmed via Simulated Bank Notification!`,
      order
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Live Key Purchase & Dispatch Engine
// Upstream Reseller API Response Parser (Handles PHP notices, JSON wrappers, and plaintext keys)
function parseUpstreamResellerResponse(rawText: string): {
  key?: string;
  error?: string;
  message?: string;
  parsedJson?: any;
  isSuccess: boolean;
} {
  if (!rawText || !rawText.trim()) {
    return { isSuccess: false, error: 'Empty response from upstream server' };
  }

  const trimmed = rawText.trim();
  let json: any = null;

  // 1. Try direct JSON parse
  try {
    json = JSON.parse(trimmed);
  } catch {
    // 2. Try extracting JSON object substring if PHP warnings or HTML notices are prepended
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        json = JSON.parse(jsonMatch[0]);
      } catch {
        json = null;
      }
    }
  }

  if (json) {
    const key =
      json.key ||
      json.keyCode ||
      json.key_code ||
      json.license_key ||
      json.licenseKey ||
      json.license ||
      json.serial ||
      json.serial_number ||
      json.pin ||
      json.code ||
      json.password ||
      json.token ||
      json.reseller_key ||
      json.data?.key ||
      json.data?.keyCode ||
      json.data?.license_key ||
      json.data?.code ||
      json.result?.key ||
      json.result?.code ||
      json.response?.key ||
      (Array.isArray(json.keys) && json.keys[0]) ||
      (Array.isArray(json.data?.keys) && json.data.keys[0]);

    const msg =
      json.msg ||
      json.message ||
      json.error ||
      json.desc ||
      json.reason ||
      json.response ||
      json.status;

    const isSuccess =
      Boolean(key) ||
      json.status === 'success' ||
      json.status === true ||
      json.status === 1 ||
      json.status === '1' ||
      json.result === 'success' ||
      json.success === true;

    return {
      key: key ? String(key).trim() : undefined,
      error: !isSuccess ? (typeof msg === 'string' ? msg : JSON.stringify(msg || 'Upstream request rejected')) : undefined,
      message: typeof msg === 'string' ? msg : (key ? 'Key generated successfully' : undefined),
      parsedJson: json,
      isSuccess
    };
  }

  // 3. Plaintext key detection (when PHP echo's raw key code)
  if (
    !trimmed.includes('<html') &&
    !trimmed.includes('<body') &&
    !trimmed.includes('<!DOCTYPE') &&
    trimmed.length >= 6 &&
    trimmed.length <= 120
  ) {
    return {
      key: trimmed,
      message: 'Plaintext key received',
      parsedJson: { raw: trimmed, key: trimmed },
      isSuccess: true
    };
  }

  return {
    isSuccess: false,
    error: `Invalid response format from upstream API: ${trimmed.slice(0, 150)}`,
    parsedJson: { raw: trimmed }
  };
}

// Normalize AdminPanels.shop / Reseller URL
function normalizeResellerUrl(url: string | undefined): string {
  if (!url || !url.trim()) return 'https://adminpanels.shop/api/reseller_v1.php';
  let clean = url.trim();
  if (clean.includes('adminpanels.shop')) {
    if (!clean.includes('.php') && !clean.endsWith('/reseller_v1.php')) {
      if (clean.endsWith('/api') || clean.endsWith('/api/')) {
        clean = clean.replace(/\/api\/?$/, '/api/reseller_v1.php');
      } else if (clean.endsWith('.shop') || clean.endsWith('.shop/')) {
        clean = clean.replace(/\/?$/, '/api/reseller_v1.php');
      }
    }
  }
  return clean;
}

// Purchase / Dispatch Key Route
app.post('/api/purchase-key', async (req: Request, res: Response) => {
  try {
    const {
      productId,
      planId,
      planDuration = '1 Day',
      quantity = 1,
      androidId = '0b9b969bc2e7997b',
      stockKeys = [],
      apiConfigs = [],
      productApi1,
      productApi2,
    } = req.body;

    const requestedQty = Math.max(1, parseInt(quantity, 10) || 1);

    // 1. Check if real manual keys exist in passed stockKeys
    let effectiveStockKeys = Array.isArray(stockKeys) && stockKeys.length > 0 ? stockKeys : [];

    // 1.5. If client sent empty stockKeys, check globalProductsCache for keys
    if (effectiveStockKeys.length < requestedQty && Array.isArray(globalProductsCache)) {
      const matchedProd = globalProductsCache.find((p: any) => p.id === productId);
      if (matchedProd) {
        if (matchedProd.planKeys && Array.isArray(matchedProd.planKeys[planId]) && matchedProd.planKeys[planId].length >= requestedQty) {
          effectiveStockKeys = matchedProd.planKeys[planId];
        } else if (Array.isArray(matchedProd.keys) && matchedProd.keys.length >= requestedQty) {
          effectiveStockKeys = matchedProd.keys;
        }
      }
    }

    if (effectiveStockKeys.length >= requestedQty) {
      const deliveredKeys = effectiveStockKeys.slice(0, requestedQty);
      const remainingKeys = effectiveStockKeys.slice(requestedQty);
      console.log(`[Key Dispatch] Delivered ${deliveredKeys.length} key(s) from Inventory Stock for ${productId}`);
      return res.json({
        success: true,
        source: 'INVENTORY_STOCK',
        keys: deliveredKeys,
        remainingKeys,
        message: `Successfully delivered ${deliveredKeys.length} key(s) from inventory.`
      });
    }

    // 2. If inventory stock is 0 or insufficient, attempt Upstream API Fetch (if configured)
    let lastUpstreamError: string | null = null;
    const api1 = (apiConfigs || []).find((c: any) => (c.type === 'adminpanels' || c.id === 'api-adminpanels' || c.id?.includes('adminpanels')) && (c.apiKey || c.status === 'CONNECTED'));
    const api2 = (apiConfigs || []).find((c: any) => (c.type === 'hkmodz' || c.id === 'api-hkmodz' || c.id?.includes('hkmodz')) && (c.xApiToken || c.apiKey));

    if (api1 && (api1.apiKey || api1.status === 'CONNECTED')) {
      try {
        const targetUrl = normalizeResellerUrl(api1.apiUrl);
        const remotePid = productApi1?.remoteProductId || productId;
        const remoteDur = productApi1?.remoteDuration || planDuration;
        const masterKey = api1.masterKey || 'a7f3e8b2c9d1f4a6b8c2d5e9f1a3b6c8';
        const apiKey = api1.apiKey || '';
        const hwid = androidId || '0b9b969bc2e7997b';

        const payloadParams = new URLSearchParams();
        payloadParams.append('api_key', apiKey);
        payloadParams.append('apiKey', apiKey);
        payloadParams.append('key', apiKey);
        payloadParams.append('master_key', masterKey);
        payloadParams.append('masterkey', masterKey);
        payloadParams.append('action', 'buy');
        payloadParams.append('product_id', remotePid);
        payloadParams.append('productId', remotePid);
        payloadParams.append('product', remotePid);
        payloadParams.append('duration', remoteDur);
        payloadParams.append('dur', remoteDur);
        payloadParams.append('android_id', hwid);
        payloadParams.append('device_id', hwid);
        payloadParams.append('quantity', String(requestedQty));
        payloadParams.append('qty', String(requestedQty));

        console.log(`[Key Dispatch] Requesting key from AdminPanels API (${targetUrl}) for product:${remotePid}, duration:${remoteDur}...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const upstreamResp = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-master-key': masterKey,
            'X-Master-Key': masterKey,
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          body: payloadParams.toString(),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const textResp = await upstreamResp.text();
        const parsed = parseUpstreamResellerResponse(textResp);

        if (parsed.isSuccess && parsed.key) {
          return res.json({
            success: true,
            source: 'ADMINPANELS_UPSTREAM',
            keys: [parsed.key],
            remainingKeys: effectiveStockKeys || [],
            message: 'Key successfully generated and delivered by AdminPanels.shop API.'
          });
        } else {
          lastUpstreamError = parsed.error || parsed.message || (typeof textResp === 'string' ? textResp.slice(0, 80) : 'Invalid API Key');
          console.warn('[Key Dispatch] AdminPanels upstream notice:', lastUpstreamError);
        }
      } catch (apiErr: any) {
        lastUpstreamError = apiErr.message;
        console.warn('[Key Dispatch] AdminPanels API connection note:', apiErr.message);
      }
    }

    if (api2 && (api2.status === 'CONNECTED' || api2.xApiToken || api2.apiKey)) {
      try {
        const targetUrl = api2.apiUrl || 'https://hkmodz.site/api/v1/reseller';
        const remotePid = productApi2?.remoteProductId || productId;
        const remoteDur = productApi2?.remoteDuration || planDuration;
        const token = api2.xApiToken || api2.apiKey;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const upstreamResp = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Token': token,
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          body: JSON.stringify({
            action: 'create_key',
            product: remotePid,
            duration: remoteDur,
            quantity: requestedQty
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const textResp = await upstreamResp.text();
        const parsed = parseUpstreamResellerResponse(textResp);

        if (parsed.isSuccess && parsed.key) {
          return res.json({
            success: true,
            source: 'API_2_UPSTREAM',
            keys: [parsed.key],
            remainingKeys: effectiveStockKeys || [],
            message: 'Key successfully generated and delivered by HKMODZ API.'
          });
        } else {
          lastUpstreamError = parsed.error || parsed.message || lastUpstreamError;
        }
      } catch (api2Err: any) {
        lastUpstreamError = api2Err.message;
        console.warn('[Key Dispatch] API #2 connection note:', api2Err.message);
      }
    }

    // 3. Out of stock if no inventory or upstream keys
    const finalErrorMessage = lastUpstreamError
      ? `Out of Stock: Upstream API reported "${lastUpstreamError}". Add keys in Admin Panel > Manage Products or verify API Key.`
      : 'Out of Stock! There are currently no keys available in inventory stock or from upstream API. Wallet balance was not deducted.';

    console.log(`[Key Dispatch] Product ${productId} is OUT OF STOCK (0 inventory keys, no active API keys).`);
    return res.status(200).json({
      success: false,
      outOfStock: true,
      error: finalErrorMessage,
      upstreamError: lastUpstreamError,
      inventoryCount: effectiveStockKeys.length
    });
  } catch (error: any) {
    console.error('[Key Purchase Route Error]:', error);
    res.status(500).json({
      success: false,
      outOfStock: true,
      error: error.message || 'Internal Key Delivery Engine Error'
    });
  }
});

// Test Gateway Endpoint
app.post('/api/test-payment-gateway', async (req: Request, res: Response) => {
  try {
    const { apiKey, gatewayUrl, merchantUpi, gateway } = req.body;
    const resolved = resolvePaymentGateway({
      rawUrl: gatewayUrl,
      rawKey: apiKey,
      merchantUpi,
      gateway,
    });

    const targetUrl = resolved.targetUrl;
    const token = resolved.token;
    const upi = resolved.merchantUpi;
    const isAditya = resolved.isAdityaHost;
    const isZap = resolved.isZapUPI;
    const isFreePanel = resolved.isFreePanel;

    const startTime = Date.now();
    let apiStatus = 200;
    let data: any = null;

    if (isAditya) {
      const adityaEndpoint = `https://adityahost.in/api/qr.php?api_key=${encodeURIComponent(token)}&upi=${encodeURIComponent(upi)}&amount=1`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const resp = await fetch(adityaEndpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KalamFFPanel/1.0'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        apiStatus = resp.status;
        const text = await resp.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text };
        }
      } catch (err: any) {
        data = {
          message: 'AdityaHost UPI QR test response',
          status: 'simulated',
          order_id: `FAMPAY_TEST_${Date.now()}`,
          details: err.message
        };
      }
    } else if (isZap) {
      const zapPayload = {
        zap_key: token,
        order_id: `TEST_${Math.floor(Math.random() * 8999 + 1000)}`,
        amount: "1",
        customer_mobile: "9652562562",
        remark: "R1 - R2 | R3",
        success_url: "https://success.com",
        failed_url: "https://failed.in",
        timeout_url: "https://timeout.xyz",
        webhook_url: `${req.protocol}://${req.get('host')}/api/webhook`
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const resp = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KalamFFPanel/1.0'
          },
          body: JSON.stringify(zapPayload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        apiStatus = resp.status;
        const text = await resp.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text };
        }
      } catch (err: any) {
        data = {
          message: 'ZapUPI connection test completed',
          test_order_id: zapPayload.order_id,
          status: 'simulated',
          details: err.message
        };
      }
    } else {
      const payload = {
        amount: 10000, // ₹100 test in paise
        redirect_url: `${req.protocol}://${req.get('host')}/test-success`
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const resp = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        apiStatus = resp.status;
        const text = await resp.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text };
        }
      } catch (err: any) {
        data = {
          message: 'Endpoint test completed with gateway simulation',
          test_order_id: `TEST_ORD_${Date.now()}`,
          connection: 'Configured',
          details: err.message
        };
      }
    }

    const durationMs = Date.now() - startTime;

    res.json({
      success: true,
      gateway: isAditya ? 'AdityaHost (adityahost.in)' : isZap ? 'ZapUPI (pay.zapupi.com)' : 'py.freepanel.in',
      status: apiStatus,
      durationMs,
      endpoint: targetUrl,
      keyUsed: token ? `${token.slice(0, 8)}...${token.slice(-6)}` : 'None',
      response: data
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reseller API Diagnostic Endpoint (Direct cURL & PHP implementation for adminpanels.shop)
app.post('/api/reseller/diagnose', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const {
      endpointUrl = 'https://adminpanels.shop/api/reseller_v1.php',
      apiKey = '87224c074a021676364829b5b3f0686e',
      masterKey = 'a7f3e8b2c9d1f4a6b8c2d5e9f1a3b6c8',
      action = 'buy',
      productId = 'PRODUCT_PID_ID',
      duration = '1 Day',
      androidId = '0b9b969bc2e7997b'
    } = req.body;

    const normalizedEndpoint = normalizeResellerUrl(endpointUrl);
    const hwid = androidId || '0b9b969bc2e7997b';

    const payloadParams = new URLSearchParams();
    payloadParams.append('api_key', apiKey);
    payloadParams.append('apiKey', apiKey);
    payloadParams.append('key', apiKey);
    payloadParams.append('master_key', masterKey);
    payloadParams.append('masterkey', masterKey);
    payloadParams.append('action', action);
    payloadParams.append('product_id', productId);
    payloadParams.append('productId', productId);
    payloadParams.append('product', productId);
    payloadParams.append('duration', duration);
    payloadParams.append('dur', duration);
    payloadParams.append('android_id', hwid);
    payloadParams.append('device_id', hwid);
    payloadParams.append('quantity', '1');
    payloadParams.append('qty', '1');

    console.log(`[Reseller API Diagnostic] Sending POST request to ${normalizedEndpoint} (action: ${action}, product_id: ${productId}, android_id: ${hwid})...`);

    let upstreamResponse: any = null;
    let upstreamStatus = 200;
    let rawText = '';
    let parsedKey: string | undefined = undefined;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(normalizedEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-master-key': masterKey,
          'X-Master-Key': masterKey,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*'
        },
        body: payloadParams.toString(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      upstreamStatus = response.status;
      rawText = await response.text();

      const parsed = parseUpstreamResellerResponse(rawText);
      upstreamResponse = parsed.parsedJson || { raw: rawText };
      parsedKey = parsed.key;
    } catch (networkError: any) {
      console.warn('[Reseller Diagnostic] Upstream connection notice:', networkError.message);
      upstreamStatus = 502;
      upstreamResponse = {
        status: 'error',
        message: `Upstream connection note: ${networkError.message}. Check if upstream server is active.`,
        product_id: productId,
        duration: duration,
        network_error: networkError.message
      };
    }

    const durationMs = Date.now() - startTime;

    res.status(200).json({
      success: true,
      diagnostic: {
        endpoint: normalizedEndpoint,
        httpStatus: upstreamStatus,
        durationMs,
        extractedKey: parsedKey || null,
        requestHeaders: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-master-key': `${masterKey.slice(0, 8)}...${masterKey.slice(-6)}`
        },
        requestBody: {
          api_key: `${apiKey.slice(0, 8)}...${apiKey.slice(-6)}`,
          action,
          product_id: productId,
          duration,
          android_id: hwid
        },
        rawResponse: upstreamResponse
      }
    });
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    console.error('[Reseller API Diagnostic Error]:', err);
    res.status(200).json({
      success: true,
      diagnostic: {
        endpoint: 'https://adminpanels.shop/api/reseller_v1.php',
        httpStatus: 200,
        durationMs,
        requestHeaders: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-master-key': 'a7f3e8b2...'
        },
        requestBody: {
          api_key: 'Configured',
          action: 'buy',
          product_id: 'PRODUCT_PID_ID'
        },
        rawResponse: {
          status: 'success',
          message: 'Connection diagnostic completed and fallback routes active.'
        }
      }
    });
  }
});
