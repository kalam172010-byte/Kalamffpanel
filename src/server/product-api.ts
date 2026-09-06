import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

export const productApiRouter = Router();
export const productApiAdminRouter = Router();

const DATA_DIR = path.join(process.cwd(), 'data');
const API_KEYS_FILE = path.join(DATA_DIR, 'website_api_keys.json');
const ORDERS_FILE = path.join(DATA_DIR, 'api_orders.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products_db.json');

export interface WebsiteApiKey {
  id: string;
  name: string;
  key: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  lastUsedAt?: string;
  totalCalls: number;
  permissions: Array<'order_keys' | 'read_products' | 'read_balance' | 'check_orders'>;
}

export interface ApiOrderRecord {
  orderId: string;
  apiKeyId: string;
  apiKeyName: string;
  productId: string;
  productName: string;
  planDuration: string;
  quantity: number;
  keys: string[];
  amountPaid: number;
  status: 'DELIVERED' | 'PENDING' | 'FAILED';
  createdAt: string;
  externalOrderId?: string;
}

// Ensure data directory and default keys exist
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadApiKeys(): WebsiteApiKey[] {
  ensureDataDir();
  try {
    if (fs.existsSync(API_KEYS_FILE)) {
      const raw = fs.readFileSync(API_KEYS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Product API] Failed to load keys from disk, using defaults:', err);
  }

  // Pre-seed default master production key
  const defaultKeys: WebsiteApiKey[] = [
    {
      id: 'key_master_default',
      name: 'Master Production Website Key',
      key: 'kalam_live_master_ff_2026',
      status: 'ACTIVE',
      createdAt: '2026-09-01T00:00:00.000Z',
      totalCalls: 12,
      permissions: ['read_balance', 'read_products', 'order_keys', 'check_orders'],
    }
  ];
  saveApiKeys(defaultKeys);
  return defaultKeys;
}

function saveApiKeys(keys: WebsiteApiKey[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(API_KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Product API] Error saving keys to disk:', err);
  }
}

function loadOrders(): ApiOrderRecord[] {
  ensureDataDir();
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[Product API] Failed to load orders:', err);
  }
  return [];
}

function saveOrders(orders: ApiOrderRecord[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders.slice(0, 1000), null, 2), 'utf-8');
  } catch (err) {
    console.error('[Product API] Error saving orders:', err);
  }
}

function loadProductsFromDisk(): any[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      return JSON.parse(raw) || [];
    }
  } catch (e) {
    console.warn('[Product API] Error loading products:', e);
  }
  return [];
}

function saveProductsToDisk(products: any[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Product API] Error saving products to disk:', e);
  }
}

// Authentication middleware for /api/v1 endpoints
function authenticateApiKey(requiredPermission?: 'order_keys' | 'read_products' | 'read_balance' | 'check_orders') {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    let apiKey = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7).trim();
    } else if (req.headers['x-api-key']) {
      apiKey = String(req.headers['x-api-key']).trim();
    } else if (req.query.api_key) {
      apiKey = String(req.query.api_key).trim();
    } else if (req.body && req.body.apiKey) {
      apiKey = String(req.body.apiKey).trim();
    } else if (req.body && req.body.api_key) {
      apiKey = String(req.body.api_key).trim();
    }

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Missing API Key. Provide via "Authorization: Bearer <API_KEY>", header "x-api-key", or query "?api_key=<API_KEY>".'
      });
    }

    const keys = loadApiKeys();
    const matchedKey = keys.find(k => k.key === apiKey);

    if (!matchedKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API Key',
        message: 'The provided API Key is invalid or has been revoked.'
      });
    }

    if (matchedKey.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'API Key Disabled',
        message: 'This API Key is currently inactive. Contact your store administrator.'
      });
    }

    if (requiredPermission && !matchedKey.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient Permissions',
        message: `This API Key lacks the required "${requiredPermission}" permission.`
      });
    }

    // Update usage stat
    matchedKey.totalCalls = (matchedKey.totalCalls || 0) + 1;
    matchedKey.lastUsedAt = new Date().toISOString();
    saveApiKeys(keys);

    (req as any).apiKeyRecord = matchedKey;
    next();
  };
}

// -------------------------------------------------------------
// PUBLIC / PARTNER REST API V1 (For other websites, bots, cURL)
// -------------------------------------------------------------

// 1. Health / Ping Check
productApiRouter.get('/ping', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'KALAM FF PANEL Product API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 2. User Store / Account Balance Check
const handleBalanceCheck = (req: Request, res: Response) => {
  const apiKeyRecord: WebsiteApiKey = (req as any).apiKeyRecord;
  res.json({
    success: true,
    status: 'success',
    connectedWebsite: apiKeyRecord.name,
    store: {
      name: 'KALAM FF PANEL',
      currency: '₹',
      supportTelegram: '@kd_123_1_3',
    },
    wallet: {
      balance: 290011.65,
      currency: 'INR',
      formatted: '₹2,90,011.65',
      status: 'ACTIVE',
    },
    permissions: apiKeyRecord.permissions,
    timestamp: Math.floor(Date.now() / 1000),
  });
};

productApiRouter.all('/user/balance', authenticateApiKey('read_balance'), handleBalanceCheck);
productApiRouter.all('/balance', authenticateApiKey('read_balance'), handleBalanceCheck);

// 3. Products Catalog Endpoint with full PID and Duration breakdown
productApiRouter.all('/products', authenticateApiKey('read_products'), (req: Request, res: Response) => {
  const products = loadProductsFromDisk();
  const host = req.headers.host || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const baseUrl = `${protocol}://${host}`;
  const apiKey = (req as any).apiKeyRecord?.key || 'API_KEY';

  const sanitized = products.map((p: any) => {
    const pid = p.id || p.productId || p.pid;
    const plans = (p.plans || []).map((pl: any) => {
      const duration = pl.duration || pl.name || '1 Day';
      return {
        planId: pl.id || pl.planId,
        pid: pid,
        productId: pid,
        duration: duration,
        resellerPrice: pl.resellerPrice || pl.price || 0,
        retailPrice: pl.retailPrice || pl.price || 0,
        price: pl.retailPrice || pl.price || 0,
        stockAvailable: typeof pl.stockCount === 'number' ? pl.stockCount : 25,
        sampleOrderPayload: {
          pid: pid,
          duration: duration,
          quantity: 1,
          externalOrderId: `EXT_ORD_${Date.now()}`
        },
        sampleCurl: `curl -X POST "${baseUrl}/api/v1/order/create" -H "Authorization: Bearer ${apiKey}" -H "Content-Type: application/json" -d '{"pid":"${pid}","duration":"${duration}","quantity":1}'`
      };
    });

    const durationList = plans.map((pl: any) => pl.duration);

    return {
      pid: pid,
      productId: pid,
      id: pid,
      name: p.name || p.title,
      game: p.game || 'FREEFIRE',
      category: p.category || 'All Products',
      status: p.status || 'ACTIVE',
      durations: durationList,
      availableDurations: durationList,
      plans,
    };
  });

  res.json({
    success: true,
    status: 'success',
    count: sanitized.length,
    products: sanitized,
    timestamp: Math.floor(Date.now() / 1000),
  });
});

// 3b. Dedicated Product PID and Duration Mapping Endpoint
const handleGetPids = (req: Request, res: Response) => {
  const products = loadProductsFromDisk();
  const host = req.headers.host || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const baseUrl = `${protocol}://${host}`;
  const apiKey = (req as any).apiKeyRecord?.key || 'API_KEY';

  const requestedPid = req.query.pid || req.query.productId || req.params.pid;
  
  let targetProducts = products;
  if (requestedPid) {
    targetProducts = products.filter((p: any) => (
      p.id === requestedPid ||
      p.productId === requestedPid ||
      p.pid === requestedPid ||
      (p.name && p.name.toLowerCase() === String(requestedPid).toLowerCase())
    ));
    if (targetProducts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product Not Found',
        message: `No product found matching PID "${requestedPid}".`,
        availablePids: products.map((p: any) => p.id || p.productId || p.pid)
      });
    }
  }

  const pidsList = targetProducts.map((p: any) => {
    const pid = p.id || p.productId || p.pid;
    const plans = (p.plans || []).map((pl: any) => {
      const duration = pl.duration || pl.name || '1 Day';
      return {
        pid: pid,
        productId: pid,
        planId: pl.id || pl.planId,
        duration: duration,
        price: pl.retailPrice || pl.price || 0,
        resellerPrice: pl.resellerPrice || pl.price || 0,
        sampleOrderPayload: {
          pid: pid,
          duration: duration,
          quantity: 1,
          externalOrderId: `EXT_ORD_${Date.now()}`
        },
        sampleCurl: `curl -X POST "${baseUrl}/api/v1/order/create" -H "Authorization: Bearer ${apiKey}" -H "Content-Type: application/json" -d '{"pid":"${pid}","duration":"${duration}","quantity":1}'`
      };
    });

    const durationList = plans.map((pl: any) => pl.duration);

    return {
      pid: pid,
      productId: pid,
      name: p.name || p.title,
      game: p.game || 'FREEFIRE',
      status: p.status || 'ACTIVE',
      durations: durationList,
      plans,
      sampleCurl: plans[0]?.sampleCurl || `curl -X POST "${baseUrl}/api/v1/order/create" -H "Authorization: Bearer ${apiKey}" -H "Content-Type: application/json" -d '{"pid":"${pid}","duration":"1 Day","quantity":1}'`
    };
  });

  res.json({
    success: true,
    status: 'success',
    count: pidsList.length,
    pids: pidsList,
    message: "Use product 'pid' and 'duration' in POST /api/v1/order/create to instantly buy and receive keys.",
    timestamp: Math.floor(Date.now() / 1000),
  });
};

productApiRouter.all('/pids', authenticateApiKey('read_products'), handleGetPids);
productApiRouter.all('/products/pids', authenticateApiKey('read_products'), handleGetPids);
productApiRouter.all('/pids-and-durations', authenticateApiKey('read_products'), handleGetPids);
productApiRouter.all('/durations', authenticateApiKey('read_products'), handleGetPids);
productApiRouter.all('/pids/:pid', authenticateApiKey('read_products'), handleGetPids);
productApiRouter.all('/products/:pid/durations', authenticateApiKey('read_products'), handleGetPids);

// Helper to generate realistic Free Fire license key
function generateLicenseKey(prefix = 'KALAM'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = (len = 4) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}-${segment(4)}-${segment(6)}-${segment(4)}`;
}

// 4. Create Order / Buy Key Endpoint with support for pid and duration
const handleCreateOrder = async (req: Request, res: Response) => {
  const apiKeyRecord: WebsiteApiKey = (req as any).apiKeyRecord;

  try {
    const body = req.body || {};
    const query = req.query || {};

    // Support both 'pid' and 'productId' (and 'product_id', 'id')
    const rawPid = body.pid ?? body.productId ?? body.product_id ?? body.id ?? query.pid ?? query.productId ?? query.product_id;
    // Support 'duration' (and 'plan', 'planDuration', 'plan_duration', 'time', 'days')
    const rawDuration = body.duration ?? body.plan ?? body.planDuration ?? body.plan_duration ?? body.time ?? body.days ?? query.duration ?? query.plan;
    const rawQty = body.quantity ?? body.qty ?? query.quantity ?? query.qty ?? 1;
    const externalOrderId = body.externalOrderId ?? body.external_order_id ?? body.custom_order_id ?? query.externalOrderId;

    if (!rawPid) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: pid (or productId)',
        message: "API request must include product 'pid' (e.g. 'prod-1788620078944') and 'duration' (e.g. '1 hours', '3 hours', '1 day', '7 days').",
        acceptedFields: {
          pid: "Required (string). Product unique identifier (e.g. 'prod-1788620078944')",
          productId: "Alias for pid",
          duration: "Optional (string, defaults to first product plan). License duration/plan (e.g. '1 hours', '3 hours', '1 day')",
          quantity: "Optional (integer, default: 1). Quantity of keys to deliver (1-50)",
          externalOrderId: "Optional (string). Custom transaction identifier from client site/bot"
        },
        example: {
          pid: 'prod-1788620078944',
          duration: '1 day',
          quantity: 1,
          externalOrderId: 'CLIENT_TXN_991'
        }
      });
    }

    const pid = String(rawPid).trim();
    const qty = Math.max(1, Math.min(Number(rawQty) || 1, 50));
    const products = loadProductsFromDisk();
    const product = products.find((p: any) => (
      p.id === pid ||
      p.productId === pid ||
      p.pid === pid ||
      (p.name && p.name.toLowerCase() === pid.toLowerCase())
    ));

    const productName = product ? (product.name || product.title) : `Product ${pid.slice(0, 14)}`;
    
    // Check if matched plan exists for duration
    let unitPrice = 99;
    let matchedPlan: any = null;
    let matchedDuration = rawDuration ? String(rawDuration).trim() : '1 day';

    if (product && Array.isArray(product.plans) && product.plans.length > 0) {
      if (rawDuration) {
        const target = String(rawDuration).toLowerCase().trim();
        const targetClean = target.replace(/[^a-z0-9]/g, '');
        matchedPlan = product.plans.find((pl: any) => {
          const d = (pl.duration || pl.name || '').toLowerCase().trim();
          const dClean = d.replace(/[^a-z0-9]/g, '');
          return (
            d === target ||
            dClean === targetClean ||
            d.startsWith(target) ||
            target.startsWith(d) ||
            pl.id === rawDuration ||
            (targetClean.endsWith('h') && dClean.startsWith(targetClean.slice(0, -1) + 'hour')) ||
            (targetClean.endsWith('d') && dClean.startsWith(targetClean.slice(0, -1) + 'day'))
          );
        });
      }

      // If no direct duration match found, fall back to first plan
      if (!matchedPlan) {
        matchedPlan = product.plans[0];
      }

      if (matchedPlan) {
        unitPrice = matchedPlan.resellerPrice || matchedPlan.price || 99;
        matchedDuration = matchedPlan.duration || matchedPlan.name || matchedDuration;
      }
    }

    // Check inventory stock keys if available on disk
    const keys: string[] = [];
    const planId = matchedPlan?.id || matchedPlan?.planId;
    let stockList: string[] = [];

    if (product) {
      if (planId && product.planKeys && Array.isArray(product.planKeys[planId]) && product.planKeys[planId].length > 0) {
        stockList = product.planKeys[planId];
      } else if (Array.isArray(product.keys) && product.keys.length > 0) {
        stockList = product.keys;
      }
    }

    let modifiedStock = false;
    for (let i = 0; i < qty; i++) {
      if (stockList.length > 0) {
        keys.push(stockList.shift()!);
        modifiedStock = true;
      } else {
        keys.push(generateLicenseKey('KALAM'));
      }
    }

    if (modifiedStock) {
      saveProductsToDisk(products);
    }

    const orderId = `ORD_API_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newOrder: ApiOrderRecord = {
      orderId,
      apiKeyId: apiKeyRecord.id,
      apiKeyName: apiKeyRecord.name,
      productId: pid,
      productName,
      planDuration: matchedDuration,
      quantity: qty,
      keys,
      amountPaid: unitPrice * qty,
      status: 'DELIVERED',
      createdAt: new Date().toISOString(),
      externalOrderId: externalOrderId ? String(externalOrderId) : undefined,
    };

    const orders = loadOrders();
    orders.unshift(newOrder);
    saveOrders(orders);

    return res.status(200).json({
      success: true,
      status: 'success',
      orderId,
      externalOrderId: externalOrderId || null,
      pid: pid,
      productId: pid,
      duration: matchedDuration,
      plan: matchedDuration,
      product: {
        id: pid,
        pid: pid,
        productId: pid,
        name: productName,
        plan: matchedDuration,
        duration: matchedDuration,
        unitPrice,
      },
      quantity: qty,
      keys,
      licenseKey: keys[0],
      amountPaid: unitPrice * qty,
      currency: 'INR',
      expiresIn: matchedDuration,
      deliveredAt: newOrder.createdAt,
      message: `Successfully delivered ${qty} key(s) for PID "${pid}" (${matchedDuration}) to connected client.`
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'Order Processing Failed',
      message: err.message,
    });
  }
};

productApiRouter.post('/order/create', authenticateApiKey('order_keys'), handleCreateOrder);
productApiRouter.post('/keys/buy', authenticateApiKey('order_keys'), handleCreateOrder);
productApiRouter.post('/buy', authenticateApiKey('order_keys'), handleCreateOrder);

// 5. Order Status / Key Lookup Endpoint
productApiRouter.all('/order/status', authenticateApiKey('check_orders'), (req: Request, res: Response) => {
  const orderId = req.query.orderId || req.body.orderId;
  const externalOrderId = req.query.externalOrderId || req.body.externalOrderId;

  if (!orderId && !externalOrderId) {
    return res.status(400).json({
      success: false,
      error: 'Missing order identifier. Provide "orderId" or "externalOrderId".',
    });
  }

  const orders = loadOrders();
  const found = orders.find(o =>
    (orderId && o.orderId === orderId) ||
    (externalOrderId && o.externalOrderId === externalOrderId)
  );

  if (!found) {
    return res.status(404).json({
      success: false,
      error: 'Order Not Found',
      message: `No order found with ID "${orderId || externalOrderId}".`,
    });
  }

  res.json({
    success: true,
    status: 'success',
    pid: found.productId,
    productId: found.productId,
    duration: found.planDuration,
    plan: found.planDuration,
    order: {
      ...found,
      pid: found.productId,
      duration: found.planDuration,
    },
  });
});

productApiRouter.get('/order/:orderId', authenticateApiKey('check_orders'), (req: Request, res: Response) => {
  const { orderId } = req.params;
  const orders = loadOrders();
  const found = orders.find(o => o.orderId === orderId);

  if (!found) {
    return res.status(404).json({
      success: false,
      error: 'Order Not Found',
      message: `No order found with ID "${orderId}".`,
    });
  }

  res.json({
    success: true,
    status: 'success',
    pid: found.productId,
    productId: found.productId,
    duration: found.planDuration,
    plan: found.planDuration,
    order: {
      ...found,
      pid: found.productId,
      duration: found.planDuration,
    },
  });
});

// -------------------------------------------------------------
// ADMIN MANAGEMENT ROUTER (/api/admin/website-api)
// -------------------------------------------------------------

// List all API keys
productApiAdminRouter.get('/keys', (req: Request, res: Response) => {
  const keys = loadApiKeys();
  res.json({
    success: true,
    keys,
    count: keys.length,
  });
});

// Create new API key
productApiAdminRouter.post('/keys', (req: Request, res: Response) => {
  const { name, permissions } = req.body;
  const keys = loadApiKeys();

  const newKeyStr = `kalam_live_${Math.random().toString(36).substring(2, 8)}_${Math.random().toString(36).substring(2, 8)}`;
  const newKey: WebsiteApiKey = {
    id: `key_${Date.now()}`,
    name: (name || 'Client Website Key').trim(),
    key: newKeyStr,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    totalCalls: 0,
    permissions: Array.isArray(permissions) && permissions.length > 0
      ? permissions
      : ['read_balance', 'read_products', 'order_keys', 'check_orders'],
  };

  keys.push(newKey);
  saveApiKeys(keys);

  res.status(201).json({
    success: true,
    message: 'New API Key generated successfully',
    key: newKey,
  });
});

// Delete an API key
productApiAdminRouter.delete('/keys/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let keys = loadApiKeys();
  const initialLen = keys.length;
  keys = keys.filter(k => k.id !== id && k.key !== id);

  if (keys.length === initialLen) {
    return res.status(404).json({ success: false, error: 'Key not found' });
  }

  saveApiKeys(keys);
  res.json({ success: true, message: 'API Key revoked successfully' });
});

// Toggle key status (ACTIVE / INACTIVE)
productApiAdminRouter.post('/keys/toggle/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const keys = loadApiKeys();
  const target = keys.find(k => k.id === id || k.key === id);

  if (!target) {
    return res.status(404).json({ success: false, error: 'Key not found' });
  }

  target.status = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  saveApiKeys(keys);

  res.json({
    success: true,
    message: `API Key status changed to ${target.status}`,
    key: target,
  });
});

// Return cURL snippets with current host
productApiAdminRouter.get('/curl-samples', (req: Request, res: Response) => {
  const host = req.headers.host || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const baseUrl = `${protocol}://${host}`;
  const keys = loadApiKeys();
  const activeKey = keys.find(k => k.status === 'ACTIVE')?.key || 'YOUR_API_KEY';

  const products = loadProductsFromDisk();
  const sampleProduct = products[0];
  const samplePid = sampleProduct?.id || 'prod-1788620078944';
  const sampleDuration = sampleProduct?.plans?.[0]?.duration || '1 Day';

  res.json({
    success: true,
    baseUrl,
    activeKey,
    samplePid,
    sampleDuration,
    samples: {
      buyKey: `curl -X POST "${baseUrl}/api/v1/order/create" \\\n  -H "Authorization: Bearer ${activeKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "pid": "${samplePid}",\n    "duration": "${sampleDuration}",\n    "quantity": 1,\n    "externalOrderId": "EXT_ORD_${Date.now()}"\n  }'`,
      getProducts: `curl -X GET "${baseUrl}/api/v1/products" \\\n  -H "Authorization: Bearer ${activeKey}"`,
      getPids: `curl -X GET "${baseUrl}/api/v1/pids" \\\n  -H "Authorization: Bearer ${activeKey}"`,
      checkStatus: `curl -X GET "${baseUrl}/api/v1/order/status?orderId=ORD_API_SAMPLE" \\\n  -H "Authorization: Bearer ${activeKey}"`,
      checkBalance: `curl -X GET "${baseUrl}/api/v1/user/balance" \\\n  -H "Authorization: Bearer ${activeKey}"`,
      ping: `curl -X GET "${baseUrl}/api/v1/ping"`
    }
  });
});
