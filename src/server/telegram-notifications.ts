import fs from 'fs';
import path from 'path';
import { TelegramNotificationSettings, TelegramNotificationTypeMeta } from '../types';
import { telegramBotService } from './telegramBot';

const DATA_DIR = path.join(process.cwd(), 'data');
const NOTIFICATION_CONFIG_FILE = path.join(DATA_DIR, 'telegram_notifications_config.json');

export const NOTIFICATION_TYPE_DEFINITIONS: TelegramNotificationTypeMeta[] = [
  // Users & Resellers
  {
    id: 'newRegistration',
    key: 'newRegistration',
    title: 'New User Registration',
    description: 'Alert when a new customer registers on the web storefront or initiates the Telegram bot.',
    category: 'users',
    icon: '👤',
    defaultEnabled: true,
    samplePayload: 'User "Kalam_Gamer" (ID: 9847120) registered via Telegram referral.'
  },
  {
    id: 'resellerUpgrade',
    key: 'resellerUpgrade',
    title: 'VIP Reseller Upgrade',
    description: 'Instant notification when a user is promoted or purchases a VIP Reseller subscription.',
    category: 'users',
    icon: '⭐',
    defaultEnabled: true,
    samplePayload: 'User "GamerPro99" upgraded to VIP Reseller status (Paid ₹499).'
  },
  {
    id: 'userLogin',
    key: 'userLogin',
    title: 'Admin / User Login Alert',
    description: 'Security notification on successful staff or admin dashboard authentications.',
    category: 'security',
    icon: '🔐',
    defaultEnabled: false,
    samplePayload: 'Admin login detected from IP 103.24.112.98 at 01:45 PM.'
  },
  {
    id: 'passwordReset',
    key: 'passwordReset',
    title: 'Password / PIN Reset Request',
    description: 'Alert on credential recovery or password change attempts.',
    category: 'security',
    icon: '🛡️',
    defaultEnabled: true,
    samplePayload: 'Security recovery request for user "kalam172010@gmail.com".'
  },

  // Orders & Financials
  {
    id: 'newOrder',
    key: 'newOrder',
    title: 'New License Key Order',
    description: 'Instant notification whenever a user buys a key on Web or Telegram with order details.',
    category: 'orders',
    icon: '🛒',
    defaultEnabled: true,
    samplePayload: 'Order #ORD-84920: FF VIP PRO MAX (1 Day) purchased for ₹120.'
  },
  {
    id: 'upiDepositPending',
    key: 'upiDepositPending',
    title: 'New UPI Deposit / UTR Submitted',
    description: 'Alert when a user submits a UPI UTR reference number requiring verification.',
    category: 'orders',
    icon: '📥',
    defaultEnabled: true,
    samplePayload: 'New deposit request of ₹500 (UTR: 428910382910) by user "Rahul99".'
  },
  {
    id: 'upiDepositApproved',
    key: 'upiDepositApproved',
    title: 'UPI Deposit Auto-Approved',
    description: 'Alert when automated payment gateway verifies UTR and credits user wallet.',
    category: 'orders',
    icon: '✅',
    defaultEnabled: true,
    samplePayload: 'Auto-Verified: ₹250 credited to wallet of @TamilGamer_07.'
  },
  {
    id: 'upiDepositFailed',
    key: 'upiDepositFailed',
    title: 'Invalid / Rejected UTR Deposit',
    description: 'Warning when a fake or duplicate UTR number submission is rejected.',
    category: 'orders',
    icon: '❌',
    defaultEnabled: true,
    samplePayload: 'Rejected: Duplicate UTR 428910382910 submitted by user 89412.'
  },
  {
    id: 'walletManualAdjustment',
    key: 'walletManualAdjustment',
    title: 'Manual Wallet Credit / Debit',
    description: 'Audit notification when admin adjusts a user wallet balance from the admin panel.',
    category: 'orders',
    icon: '💰',
    defaultEnabled: true,
    samplePayload: 'Admin credited ₹500 to user "Senthil_FF" (Reason: Promotional grant).'
  },
  {
    id: 'dailySpinReward',
    key: 'dailySpinReward',
    title: 'Lucky Daily Spin Claimed',
    description: 'Notice when a customer claims their daily wheel spin wallet bonus.',
    category: 'orders',
    icon: '🎡',
    defaultEnabled: false,
    samplePayload: 'User "Vijay7" won ₹10 bonus from Daily Lucky Spin.'
  },
  {
    id: 'referralBonusClaimed',
    key: 'referralBonusClaimed',
    title: 'Referral Commission Earned',
    description: 'Alert when an affiliate earns a commission from their invited user purchase.',
    category: 'orders',
    icon: '🎁',
    defaultEnabled: true,
    samplePayload: 'Referral Reward: ₹25 credited to "TamilLeader" for invitee purchase.'
  },

  // Inventory & Stock
  {
    id: 'lowStockAlert',
    key: 'lowStockAlert',
    title: 'Low Key Stock Warning',
    description: 'Triggered when available license keys for any product fall below the configured threshold.',
    category: 'inventory',
    icon: '⚠️',
    defaultEnabled: true,
    samplePayload: 'Warning: "FF BRUTAL VIP (7 Days)" has only 2 keys remaining!'
  },
  {
    id: 'outOfStockAlert',
    key: 'outOfStockAlert',
    title: 'Out of Stock (Zero Keys)',
    description: 'Emergency alert when a product reaches 0 keys and sales are blocked.',
    category: 'inventory',
    icon: '🚫',
    defaultEnabled: true,
    samplePayload: 'CRITICAL: "KALAM VIP PANEL (30 Days)" is now OUT OF STOCK (0 keys)!'
  },
  {
    id: 'supplierAutoRestock',
    key: 'supplierAutoRestock',
    title: 'Upstream Auto-Restock Triggered',
    description: 'Notification when the automatic background restock sync fetches keys from upstream reseller API.',
    category: 'inventory',
    icon: '🔄',
    defaultEnabled: true,
    samplePayload: 'Auto-Restock: 25 keys added to "HK MODS" from AdminPanels reseller API.'
  },
  {
    id: 'manualStockAddition',
    key: 'manualStockAddition',
    title: 'Manual Stock Added by Admin',
    description: 'Notification when admin pastes keys into stock manager.',
    category: 'inventory',
    icon: '📦',
    defaultEnabled: false,
    samplePayload: 'Admin added 50 keys to "FF ESP HACK (1 Day)".'
  },

  // System & Upstream
  {
    id: 'upstreamApiError',
    key: 'upstreamApiError',
    title: 'Upstream Reseller API Outage / Error',
    description: 'Instant alert if upstream provider API fails, times out, or returns bad balance.',
    category: 'system',
    icon: '📡',
    defaultEnabled: true,
    samplePayload: 'Upstream Error: AdminPanels API timeout after 3 retries (504 Gateway Timeout).'
  },
  {
    id: 'botLifecycleStatus',
    key: 'botLifecycleStatus',
    title: 'Bot Online / Recovery Status',
    description: 'Alert when Telegram bot server boots, reconnects, or recovers polling loop.',
    category: 'system',
    icon: '🤖',
    defaultEnabled: true,
    samplePayload: 'Telegram Bot Gateway is ONLINE and polling updates successfully.'
  },
  {
    id: 'broadcastCompleted',
    key: 'broadcastCompleted',
    title: 'Broadcast Dispatch Summary',
    description: 'Summary report sent upon completing a mass Telegram user broadcast.',
    category: 'system',
    icon: '📢',
    defaultEnabled: true,
    samplePayload: 'Broadcast Finished: Delivered to 1,248 users (12 failed) in 4.2s.'
  },
  {
    id: 'highFailureRateAlert',
    key: 'highFailureRateAlert',
    title: 'High API Failure Rate SLA Warning',
    description: 'Triggered if API failure rate exceeds the configured percentage in rolling window.',
    category: 'system',
    icon: '🚨',
    defaultEnabled: true,
    samplePayload: 'High Failure Rate: 25% of recent upstream requests failed in last 15 min.'
  }
];

export const DEFAULT_TELEGRAM_NOTIFICATION_SETTINGS: TelegramNotificationSettings = {
  masterNotificationsEnabled: true,
  adminChatIdOverride: '',
  alertChannelId: '',
  soundEnabledGlobally: true,
  types: {
    newRegistration: true,
    resellerUpgrade: true,
    userLogin: false,
    passwordReset: true,
    newOrder: true,
    upiDepositPending: true,
    upiDepositApproved: true,
    upiDepositFailed: true,
    walletManualAdjustment: true,
    dailySpinReward: false,
    referralBonusClaimed: true,
    lowStockAlert: true,
    outOfStockAlert: true,
    supplierAutoRestock: true,
    manualStockAddition: false,
    upstreamApiError: true,
    botLifecycleStatus: true,
    broadcastCompleted: true,
    highFailureRateAlert: true,
  },
  lowStockThreshold: 5,
  highFailureRateThresholdPercent: 20,
  minDepositNotificationAmount: 1,
  includeUserBalanceInAlerts: true,
  includeIpAddress: true,
  includeQuickActionButtons: true,
  quietHoursEnabled: false,
  quietHoursStart: '23:00',
  quietHoursEnd: '07:00',
  lastUpdated: new Date().toISOString(),
};

class TelegramNotificationManager {
  private settings: TelegramNotificationSettings;

  constructor() {
    this.settings = this.loadSettings();
  }

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {}
    }
  }

  private loadSettings(): TelegramNotificationSettings {
    this.ensureDir();
    try {
      if (fs.existsSync(NOTIFICATION_CONFIG_FILE)) {
        const raw = fs.readFileSync(NOTIFICATION_CONFIG_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_TELEGRAM_NOTIFICATION_SETTINGS,
          ...parsed,
          types: {
            ...DEFAULT_TELEGRAM_NOTIFICATION_SETTINGS.types,
            ...(parsed.types || {}),
          }
        };
      }
    } catch (err: any) {
      console.warn('[TelegramNotifications] Warning loading notification config:', err.message);
    }
    return { ...DEFAULT_TELEGRAM_NOTIFICATION_SETTINGS };
  }

  public getSettings(): TelegramNotificationSettings {
    return { ...this.settings };
  }

  public getDefinitions(): TelegramNotificationTypeMeta[] {
    return NOTIFICATION_TYPE_DEFINITIONS;
  }

  public updateSettings(partial: Partial<TelegramNotificationSettings>): TelegramNotificationSettings {
    this.settings = {
      ...this.settings,
      ...partial,
      types: {
        ...this.settings.types,
        ...(partial.types || {}),
      },
      lastUpdated: new Date().toISOString(),
    };

    this.saveSettings();
    console.log('[TelegramNotifications] Notification preferences saved to disk.');
    return this.settings;
  }

  public toggleType(typeKey: keyof TelegramNotificationSettings['types'], enabled?: boolean): TelegramNotificationSettings {
    const currentVal = this.settings.types[typeKey] ?? true;
    const newVal = enabled !== undefined ? enabled : !currentVal;
    
    this.settings.types[typeKey] = newVal;
    this.settings.lastUpdated = new Date().toISOString();
    this.saveSettings();
    return this.settings;
  }

  private saveSettings() {
    this.ensureDir();
    try {
      fs.writeFileSync(NOTIFICATION_CONFIG_FILE, JSON.stringify(this.settings, null, 2), 'utf8');
    } catch (err: any) {
      console.error('[TelegramNotifications] Error writing notification config to disk:', err.message);
    }
  }

  public isTypeEnabled(typeKey: keyof TelegramNotificationSettings['types']): boolean {
    if (!this.settings.masterNotificationsEnabled) return false;
    return !!this.settings.types[typeKey];
  }

  private isInQuietHours(): boolean {
    if (!this.settings.quietHoursEnabled) return false;
    try {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const [startH, startM] = (this.settings.quietHoursStart || '23:00').split(':').map(Number);
      const [endH, endM] = (this.settings.quietHoursEnd || '07:00').split(':').map(Number);
      
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes <= endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
      } else {
        // Over midnight
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
      }
    } catch {
      return false;
    }
  }

  public async dispatchNotification(
    typeKey: keyof TelegramNotificationSettings['types'],
    title: string,
    messageHtml: string,
    options?: {
      quickButtons?: { text: string; url?: string; callback_data?: string }[][];
      ignoreQuietHours?: boolean;
    }
  ): Promise<{ delivered: boolean; reason?: string }> {
    if (!this.settings.masterNotificationsEnabled) {
      return { delivered: false, reason: 'Master notifications disabled' };
    }

    if (!this.isTypeEnabled(typeKey)) {
      return { delivered: false, reason: `Notification type "${typeKey}" is toggled OFF` };
    }

    if (!options?.ignoreQuietHours && this.isInQuietHours()) {
      return { delivered: false, reason: 'Quiet hours active' };
    }

    // Determine target chats
    const targets: string[] = [];
    if (this.settings.adminChatIdOverride && this.settings.adminChatIdOverride.trim()) {
      targets.push(this.settings.adminChatIdOverride.trim());
    } else {
      // Use bot default admin chat ID
      const cfg = telegramBotService.getCredentials();
      if (cfg.defaultChatId) targets.push(cfg.defaultChatId);
    }

    if (this.settings.alertChannelId && this.settings.alertChannelId.trim()) {
      const ch = this.settings.alertChannelId.trim();
      if (!targets.includes(ch)) targets.push(ch);
    }

    if (targets.length === 0) {
      return { delivered: false, reason: 'No destination Telegram chatId configured' };
    }

    const fullMessage = `${messageHtml}\n\n<i>⚙️ Notification managed by KALAM FF Admin Panel</i>`;

    const replyMarkup = (this.settings.includeQuickActionButtons && options?.quickButtons && options.quickButtons.length > 0)
      ? { inline_keyboard: options.quickButtons }
      : undefined;

    let anyDelivered = false;
    for (const target of targets) {
      try {
        const ok = await telegramBotService.sendMessage(target, fullMessage, replyMarkup);
        if (ok) anyDelivered = true;
      } catch (err: any) {
        console.warn(`[TelegramNotifications] Delivery failed to ${target}:`, err.message);
      }
    }

    return { delivered: anyDelivered };
  }

  public async sendTestNotification(
    typeKey: keyof TelegramNotificationSettings['types'],
    targetChatIdOverride?: string
  ): Promise<{ success: boolean; message: string; payloadSent: string; deliveredTo: string }> {
    const meta = NOTIFICATION_TYPE_DEFINITIONS.find(d => d.key === typeKey) || {
      title: typeKey,
      icon: '🔔',
      description: 'System Notification Alert',
      samplePayload: 'Sample test payload event for KALAM FF PANEL.'
    };

    const cfg = telegramBotService.getCredentials();
    const targetChat = targetChatIdOverride || this.settings.adminChatIdOverride || cfg.defaultChatId;

    if (!targetChat) {
      throw new Error('No Telegram Chat ID configured. Please configure your Admin Chat ID first.');
    }

    const testTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    let sampleBody = `<b>${meta.icon} TEST NOTIFICATION: ${meta.title}</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `📌 <b>Status:</b> Sample Simulation Event\n` +
      `🕒 <b>Time:</b> ${testTime}\n` +
      `📝 <b>Payload Details:</b>\n<i>${meta.samplePayload || 'Diagnostic simulation event verified.'}</i>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `✅ <i>Verified: Telegram Notification Pipeline for type <code>${typeKey}</code> is working perfectly!</i>`;

    const quickButtons = [
      [
        { text: '📊 Open Admin Panel', url: 'https://kalamffpanel.com' },
        { text: '🔔 Manage Toggles', callback_data: 'admin_menu:settings' }
      ]
    ];

    const replyMarkup = this.settings.includeQuickActionButtons ? { inline_keyboard: quickButtons } : undefined;

    const ok = await telegramBotService.sendMessage(targetChat, sampleBody, replyMarkup);

    if (ok) {
      return {
        success: true,
        message: `Test notification for "${meta.title}" delivered successfully to chat ${targetChat}!`,
        payloadSent: sampleBody,
        deliveredTo: String(targetChat),
      };
    } else {
      throw new Error(`Failed to deliver message via Telegram Bot API to chatId: ${targetChat}. Please verify bot token and chat permissions.`);
    }
  }
}

export const telegramNotificationManager = new TelegramNotificationManager();
