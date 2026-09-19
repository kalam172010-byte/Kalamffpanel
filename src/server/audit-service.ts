import fs from 'fs';
import path from 'path';

export type AuditCategory =
  | 'BALANCE_ADJUSTMENT'
  | 'RESELLER_UPGRADE'
  | 'KEY_PURCHASE'
  | 'DEPOSIT_CREDIT'
  | 'SECURITY_EVENT'
  | 'SYSTEM_CONFIG';

export type AuditSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
export type ActorType = 'ADMIN' | 'SYSTEM' | 'USER';

export interface AuditTargetUser {
  userId?: string;
  chatId?: number | string;
  username?: string;
  fullName?: string;
  email?: string;
}

export interface AuditLogEvent {
  id: string;
  timestamp: number;
  category: AuditCategory;
  action: string;
  severity: AuditSeverity;
  actor: string;
  actorType: ActorType;
  targetUser?: AuditTargetUser;
  summary: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export interface AuditLogFilterOptions {
  category?: string;
  severity?: string;
  search?: string;
  actorType?: string;
  startDate?: number;
  endDate?: number;
  page?: number;
  limit?: number;
  sortDirection?: 'asc' | 'desc';
}

export class AuditLogService {
  private dataDir: string;
  private logsFile: string;
  private logs: AuditLogEvent[] = [];
  private maxLogs: number = 5000;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || this.resolveDataDir();
    this.logsFile = path.join(this.dataDir, 'audit_logs.json');
    this.init();
  }

  private resolveDataDir(): string {
    const candidates = [
      path.join(process.cwd(), 'data'),
      path.join(process.cwd(), 'backend', 'data'),
      path.join(process.cwd(), 'server', 'data'),
      path.join('/tmp', 'kalam_data'),
    ];
    for (const c of candidates) {
      try {
        if (!fs.existsSync(c)) {
          fs.mkdirSync(c, { recursive: true });
        }
        return c;
      } catch {}
    }
    return process.cwd();
  }

  private init() {
    this.loadFromDisk();
    // Bootstrap from existing data if logs are empty
    if (this.logs.length === 0) {
      this.bootstrapFromExistingData();
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.logsFile)) {
        const raw = fs.readFileSync(this.logsFile, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.logs = parsed;
        }
      }
    } catch (err) {
      console.warn('[AuditLogService] Could not load audit_logs.json:', err);
      this.logs = [];
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.logsFile, JSON.stringify(this.logs.slice(0, this.maxLogs), null, 2), 'utf8');
    } catch (err) {
      console.warn('[AuditLogService] Could not save audit_logs.json:', err);
    }
  }

  /**
   * Bootstrap audit logs from existing historical data in wallets, api_orders, bot_users, and orders_db
   */
  private bootstrapFromExistingData() {
    console.log('[AuditLogService] Bootstrapping historical audit records from database files...');
    const bootstrapped: AuditLogEvent[] = [];

    // 1. Ingest historical wallet transactions
    try {
      const walletsPath = path.join(this.dataDir, 'wallets_db.json');
      if (fs.existsSync(walletsPath)) {
        const raw = fs.readFileSync(walletsPath, 'utf8');
        const wallets = JSON.parse(raw);
        if (Array.isArray(wallets)) {
          for (const w of wallets) {
            if (Array.isArray(w.history)) {
              for (const h of w.history) {
                const isDeposit = h.type === 'DEPOSIT';
                const isPurchase = h.type === 'DEDUCT';
                const isAdjust = h.type === 'ADJUST' || h.type === 'SYNC';

                const category: AuditCategory = isDeposit
                  ? 'DEPOSIT_CREDIT'
                  : isPurchase
                  ? 'KEY_PURCHASE'
                  : 'BALANCE_ADJUSTMENT';

                const severity: AuditSeverity = isDeposit
                  ? 'SUCCESS'
                  : isPurchase
                  ? 'INFO'
                  : h.amount >= 0
                  ? 'SUCCESS'
                  : 'WARNING';

                bootstrapped.push({
                  id: h.id || `AUDIT_WH_${h.timestamp || Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                  timestamp: h.timestamp || Date.now(),
                  category,
                  action: isDeposit
                    ? 'UPI_DEPOSIT_CREDIT'
                    : isPurchase
                    ? 'STORE_KEY_PURCHASE'
                    : 'WALLET_BALANCE_ADJUSTMENT',
                  severity,
                  actor: isAdjust ? 'Admin (System Sync)' : isDeposit ? 'UPI Gateway / User' : 'User Storefront',
                  actorType: isAdjust ? 'ADMIN' : 'USER',
                  targetUser: {
                    userId: w.userId,
                    email: w.email,
                  },
                  summary: `${isDeposit ? 'Deposit Credit' : isPurchase ? 'Storefront Purchase' : 'Balance Adjustment'} of ₹${Math.abs(h.amount)} (${h.reason || 'Standard'})`,
                  details: {
                    amount: h.amount,
                    balanceAfter: h.balanceAfter,
                    reason: h.reason,
                    type: h.type,
                  },
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('[AuditLogService] Error importing wallet history:', err);
    }

    // 2. Ingest API Orders
    try {
      const apiOrdersPath = path.join(this.dataDir, 'api_orders.json');
      if (fs.existsSync(apiOrdersPath)) {
        const raw = fs.readFileSync(apiOrdersPath, 'utf8');
        const orders = JSON.parse(raw);
        if (Array.isArray(orders)) {
          for (const ord of orders) {
            const time = ord.createdAt ? new Date(ord.createdAt).getTime() : Date.now();
            bootstrapped.push({
              id: `AUDIT_API_${ord.orderId || Math.random().toString(36).substring(2, 9)}`,
              timestamp: isNaN(time) ? Date.now() : time,
              category: 'KEY_PURCHASE',
              action: 'WEBSITE_API_KEY_DISPATCH',
              severity: 'SUCCESS',
              actor: ord.apiKeyName || 'Website API Key',
              actorType: 'SYSTEM',
              targetUser: {
                userId: ord.apiKeyId || 'API_CLIENT',
                fullName: ord.apiKeyName,
              },
              summary: `Purchased ${ord.quantity || 1}x ${ord.productName || 'License Key'} (${ord.planDuration || 'Standard'}) for ₹${ord.amountPaid || 0}`,
              details: {
                orderId: ord.orderId,
                productId: ord.productId,
                productName: ord.productName,
                planDuration: ord.planDuration,
                quantity: ord.quantity,
                amountPaid: ord.amountPaid,
                keysDelivered: ord.keys || [],
                status: ord.status,
              },
            });
          }
        }
      }
    } catch (err) {
      console.warn('[AuditLogService] Error importing api_orders:', err);
    }

    // 3. Ingest Bot Users Reseller promotions
    try {
      const botUsersPath = path.join(this.dataDir, 'bot_users.json');
      if (fs.existsSync(botUsersPath)) {
        const raw = fs.readFileSync(botUsersPath, 'utf8');
        const users = JSON.parse(raw);
        if (Array.isArray(users)) {
          for (const u of users) {
            if (u.isReseller || u.role === 'RESELLER') {
              bootstrapped.push({
                id: `AUDIT_RESELLER_${u.chatId}_${u.resellerUpgradedAt || u.joinedAt || Date.now()}`,
                timestamp: u.resellerUpgradedAt || u.joinedAt || Date.now() - 86400000,
                category: 'RESELLER_UPGRADE',
                action: 'VIP_RESELLER_PROMOTION',
                severity: 'SUCCESS',
                actor: 'Admin / System Promotion',
                actorType: 'ADMIN',
                targetUser: {
                  userId: u.userId,
                  chatId: u.chatId,
                  username: u.username,
                  fullName: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
                },
                summary: `User promoted to VIP Reseller Tier (Balance: ₹${u.balance || 0})`,
                details: {
                  chatId: u.chatId,
                  username: u.username,
                  role: u.role || 'RESELLER',
                  balance: u.balance,
                  totalSpent: u.totalSpent,
                },
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('[AuditLogService] Error importing bot users:', err);
    }

    // Sort descending by timestamp
    bootstrapped.sort((a, b) => b.timestamp - a.timestamp);
    this.logs = bootstrapped.slice(0, this.maxLogs);
    this.saveToDisk();
    console.log(`[AuditLogService] Initialized with ${this.logs.length} historical audit events.`);
  }

  /**
   * Record a generic audit log event
   */
  public logEvent(event: Omit<AuditLogEvent, 'id' | 'timestamp'>): AuditLogEvent {
    const newEvent: AuditLogEvent = {
      ...event,
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      timestamp: Date.now(),
    };

    this.logs.unshift(newEvent);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.saveToDisk();
    return newEvent;
  }

  /**
   * Specialized logger: Balance Adjustment
   */
  public logBalanceAdjustment(params: {
    targetUser: AuditTargetUser;
    amount: number;
    beforeBalance?: number;
    afterBalance?: number;
    reason: string;
    actor?: string;
    actorType?: ActorType;
    ipAddress?: string;
  }): AuditLogEvent {
    const isCredit = params.amount > 0;
    return this.logEvent({
      category: 'BALANCE_ADJUSTMENT',
      action: isCredit ? 'MANUAL_BALANCE_CREDIT' : 'MANUAL_BALANCE_DEBIT',
      severity: isCredit ? 'SUCCESS' : 'WARNING',
      actor: params.actor || 'Admin Panel',
      actorType: params.actorType || 'ADMIN',
      targetUser: params.targetUser,
      summary: `${isCredit ? 'Credited' : 'Debited'} ₹${Math.abs(params.amount)} to user ${params.targetUser.fullName || params.targetUser.username || params.targetUser.chatId} (Reason: ${params.reason})`,
      details: {
        amount: params.amount,
        beforeBalance: params.beforeBalance,
        afterBalance: params.afterBalance,
        reason: params.reason,
      },
      ipAddress: params.ipAddress,
    });
  }

  /**
   * Specialized logger: Reseller Status Change
   */
  public logResellerChange(params: {
    targetUser: AuditTargetUser;
    isReseller: boolean;
    previousRole?: string;
    newRole?: string;
    actor?: string;
    actorType?: ActorType;
    reason?: string;
    ipAddress?: string;
  }): AuditLogEvent {
    return this.logEvent({
      category: 'RESELLER_UPGRADE',
      action: params.isReseller ? 'VIP_RESELLER_PROMOTION' : 'VIP_RESELLER_REVOCATION',
      severity: params.isReseller ? 'SUCCESS' : 'WARNING',
      actor: params.actor || 'Admin Panel',
      actorType: params.actorType || 'ADMIN',
      targetUser: params.targetUser,
      summary: `${params.isReseller ? 'Promoted' : 'Demoted'} user ${params.targetUser.fullName || params.targetUser.username || params.targetUser.chatId} ${params.isReseller ? 'to VIP Reseller Tier' : 'to Standard Member Tier'}`,
      details: {
        isReseller: params.isReseller,
        previousRole: params.previousRole,
        newRole: params.newRole,
        reason: params.reason || (params.isReseller ? 'Admin VIP Grant' : 'Admin Role Downgrade'),
      },
      ipAddress: params.ipAddress,
    });
  }

  /**
   * Specialized logger: Key Purchase & Delivery
   */
  public logKeyPurchase(params: {
    targetUser: AuditTargetUser;
    orderId: string;
    productName: string;
    planDuration: string;
    amountPaid: number;
    quantity: number;
    keys: string[];
    gateway?: string;
    actor?: string;
  }): AuditLogEvent {
    return this.logEvent({
      category: 'KEY_PURCHASE',
      action: 'LICENSE_KEY_DELIVERED',
      severity: 'SUCCESS',
      actor: params.actor || 'Storefront System',
      actorType: 'SYSTEM',
      targetUser: params.targetUser,
      summary: `Delivered ${params.quantity}x ${params.productName} (${params.planDuration}) for ₹${params.amountPaid} to ${params.targetUser.fullName || params.targetUser.username || params.targetUser.chatId}`,
      details: {
        orderId: params.orderId,
        productName: params.productName,
        planDuration: params.planDuration,
        amountPaid: params.amountPaid,
        quantity: params.quantity,
        keysDelivered: params.keys,
        gateway: params.gateway || 'Wallet Balance',
      },
    });
  }

  /**
   * Specialized logger: Deposit / Payment Approved
   */
  public logDeposit(params: {
    targetUser: AuditTargetUser;
    amount: number;
    utr: string;
    gateway: string;
    beforeBalance?: number;
    afterBalance?: number;
    actor?: string;
  }): AuditLogEvent {
    return this.logEvent({
      category: 'DEPOSIT_CREDIT',
      action: 'UPI_DEPOSIT_VERIFIED',
      severity: 'SUCCESS',
      actor: params.actor || 'Payment Webhook',
      actorType: 'SYSTEM',
      targetUser: params.targetUser,
      summary: `Auto-verified UPI deposit of ₹${params.amount} (UTR: ${params.utr}) via ${params.gateway}`,
      details: {
        amount: params.amount,
        utr: params.utr,
        gateway: params.gateway,
        beforeBalance: params.beforeBalance,
        afterBalance: params.afterBalance,
      },
    });
  }

  /**
   * Query & Filter Audit Logs
   */
  public getLogs(options: AuditLogFilterOptions = {}): {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    logs: AuditLogEvent[];
  } {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(200, Math.max(1, options.limit || 25));
    const sortDir = options.sortDirection === 'asc' ? 'asc' : 'desc';

    let filtered = [...this.logs];

    // Filter by category
    if (options.category && options.category !== 'ALL') {
      filtered = filtered.filter(l => l.category === options.category);
    }

    // Filter by severity
    if (options.severity && options.severity !== 'ALL') {
      filtered = filtered.filter(l => l.severity === options.severity);
    }

    // Filter by actor type
    if (options.actorType && options.actorType !== 'ALL') {
      filtered = filtered.filter(l => l.actorType === options.actorType);
    }

    // Filter by date range
    if (options.startDate) {
      filtered = filtered.filter(l => l.timestamp >= options.startDate!);
    }
    if (options.endDate) {
      filtered = filtered.filter(l => l.timestamp <= options.endDate!);
    }

    // Filter by search keyword
    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter(l => {
        const matchSummary = (l.summary || '').toLowerCase().includes(q);
        const matchAction = (l.action || '').toLowerCase().includes(q);
        const matchActor = (l.actor || '').toLowerCase().includes(q);
        const matchId = (l.id || '').toLowerCase().includes(q);
        const matchUser =
          (l.targetUser?.fullName || '').toLowerCase().includes(q) ||
          (l.targetUser?.username || '').toLowerCase().includes(q) ||
          (l.targetUser?.userId || '').toLowerCase().includes(q) ||
          String(l.targetUser?.chatId || '').includes(q);

        const matchDetails = JSON.stringify(l.details || {}).toLowerCase().includes(q);

        return matchSummary || matchAction || matchActor || matchId || matchUser || matchDetails;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      return sortDir === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const paginatedLogs = filtered.slice(startIndex, startIndex + limit);

    return {
      total,
      page,
      limit,
      totalPages,
      logs: paginatedLogs,
    };
  }

  /**
   * Get Aggregate Audit Statistics
   */
  public getStats() {
    const totalEvents = this.logs.length;
    let balanceAdjustmentsCount = 0;
    let totalBalanceVolume = 0;
    let resellerUpgradesCount = 0;
    let keyPurchasesCount = 0;
    let totalPurchasesVolume = 0;
    let depositsCount = 0;
    let totalDepositsVolume = 0;

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    let eventsLast24h = 0;

    for (const l of this.logs) {
      if (l.timestamp >= oneDayAgo) eventsLast24h++;

      if (l.category === 'BALANCE_ADJUSTMENT') {
        balanceAdjustmentsCount++;
        const amt = l.details?.amount;
        if (typeof amt === 'number') totalBalanceVolume += amt;
      } else if (l.category === 'RESELLER_UPGRADE') {
        resellerUpgradesCount++;
      } else if (l.category === 'KEY_PURCHASE') {
        keyPurchasesCount++;
        const amt = l.details?.amountPaid;
        if (typeof amt === 'number') totalPurchasesVolume += amt;
      } else if (l.category === 'DEPOSIT_CREDIT') {
        depositsCount++;
        const amt = l.details?.amount;
        if (typeof amt === 'number') totalDepositsVolume += amt;
      }
    }

    return {
      totalEvents,
      eventsLast24h,
      balanceAdjustmentsCount,
      totalBalanceVolume,
      resellerUpgradesCount,
      keyPurchasesCount,
      totalPurchasesVolume,
      depositsCount,
      totalDepositsVolume,
      categoryCounts: {
        BALANCE_ADJUSTMENT: balanceAdjustmentsCount,
        RESELLER_UPGRADE: resellerUpgradesCount,
        KEY_PURCHASE: keyPurchasesCount,
        DEPOSIT_CREDIT: depositsCount,
        SECURITY_EVENT: this.logs.filter(l => l.category === 'SECURITY_EVENT').length,
        SYSTEM_CONFIG: this.logs.filter(l => l.category === 'SYSTEM_CONFIG').length,
      },
    };
  }

  /**
   * Export all logs as CSV
   */
  public exportCsv(): string {
    const headers = [
      'Event ID',
      'Timestamp (ISO)',
      'Date IST',
      'Category',
      'Action',
      'Severity',
      'Actor',
      'Actor Type',
      'Target User Name',
      'Target Username',
      'Target Chat ID / User ID',
      'Summary',
      'Amount (INR)',
      'Order ID / Ref',
      'Details JSON',
    ];

    const rows = this.logs.map(l => {
      const dt = new Date(l.timestamp);
      const amount = l.details?.amount ?? l.details?.amountPaid ?? '';
      const ref = l.details?.orderId ?? l.details?.utr ?? '';
      return [
        `"${l.id}"`,
        `"${dt.toISOString()}"`,
        `"${dt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}"`,
        `"${l.category}"`,
        `"${l.action}"`,
        `"${l.severity}"`,
        `"${(l.actor || '').replace(/"/g, '""')}"`,
        `"${l.actorType}"`,
        `"${(l.targetUser?.fullName || '').replace(/"/g, '""')}"`,
        `"${(l.targetUser?.username || '').replace(/"/g, '""')}"`,
        `"${l.targetUser?.chatId || l.targetUser?.userId || ''}"`,
        `"${(l.summary || '').replace(/"/g, '""')}"`,
        `"${amount}"`,
        `"${ref}"`,
        `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Clear or Prune Old Logs
   */
  public clearLogs(keepCount: number = 0): { removed: number; remaining: number } {
    const total = this.logs.length;
    if (keepCount <= 0) {
      this.logs = [];
    } else {
      this.logs = this.logs.slice(0, keepCount);
    }
    this.saveToDisk();
    return {
      removed: total - this.logs.length,
      remaining: this.logs.length,
    };
  }
}

export const auditLogService = new AuditLogService();
