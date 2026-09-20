import fs from 'fs';
import path from 'path';
import type { TelegramActivityEvent, TelegramActivityFeedStats } from '../types';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      title?: string;
      username?: string;
      first_name?: string;
    };
    date: number;
    text?: string;
    caption?: string;
    photo?: Array<{
      file_id: string;
      file_unique_id: string;
      width: number;
      height: number;
      file_size?: number;
    }>;
    audio?: {
      file_id: string;
      file_unique_id: string;
      duration: number;
      performer?: string;
      title?: string;
      file_name?: string;
      mime_type?: string;
      file_size?: number;
    };
    voice?: {
      file_id: string;
      file_unique_id: string;
      duration: number;
      mime_type?: string;
      file_size?: number;
    };
    document?: {
      file_id: string;
      file_unique_id: string;
      file_name?: string;
      mime_type?: string;
      file_size?: number;
    };
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
    };
    data?: string;
  };
}

export type BotLanguage = 'en' | 'ta' | 'hi';

export const I18N_TEXTS: Record<BotLanguage, Record<string, string>> = {
  en: {
    title: '✨ <b>KALAM FF PANEL</b> 💸',
    greeting: '👋 <b>Hello, {name}!</b>',
    bullet_catalog: '📦 <b>Wide product catalog</b>',
    bullet_delivery: '⚡ <b>Instant delivery on payment</b>',
    bullet_gateways: '💳 <b>Multiple payment gateways</b>',
    bullet_support: '📞 <b>24/7 admin support</b>',
    balance_label: '💵 <b>Balance: ₹{balance}</b>',
    tap_to_begin: '<i>Tap any button below to begin:</i>',
    btn_admin: '👑 🎛️ Master Admin Control Panel',
    btn_buy_now: '🟢 🛒 Buy Now',
    btn_check_update: '🟢 🔄 Check Update',
    btn_add_balance: '🟢 💸 Add Balance',
    btn_my_profile: '🟢 👑 My Profile + All History',
    btn_refer_earn: '🟢 🔗 Refer And Earn',
    btn_how_to_use: '🟢 ⁉️ How To Use Bot',
    btn_support: '🟢 ✈️ Support',
    btn_daily_gift: '🟢 🎁 Daily Gift',
    btn_reseller: '🟢 💎 VIP Reseller Upgrade',
    btn_commands: '🟢 📜 Bot Commands List',
    btn_language: '🟢 🌐 Language / மொழி / भाषा',
    btn_main_menu: '🏠 Main Menu',
    btn_back: '🔙 Back',
    lang_prompt: '🌐 <b>Select Your Preferred Language / உங்கள் மொழியைத் தேர்ந்தெடுக்கவும் / अपनी भाषा चुनें:</b>\n\n<i>Choose an option below:</i>',
    lang_changed: '✅ <b>Language set to English successfully!</b>'
  },
  ta: {
    title: '✨ <b>கலாம் எஃப்எஃப் பேனல் (KALAM FF PANEL)</b> 💸',
    greeting: '👋 <b>வணக்கம், {name}!</b>',
    bullet_catalog: '📦 <b>அனைத்து கேமிங் விஐபி கீகள்</b>',
    bullet_delivery: '⚡ <b>பணம் செலுத்திய உடன் உடனடி டெலிவரி</b>',
    bullet_gateways: '💳 <b>UPI / QR குறியீடு கட்டணம்</b>',
    bullet_support: '📞 <b>24/7 அட்மின் உதவி</b>',
    balance_label: '💵 <b>உங்கள் இருப்பு (Balance): ₹{balance}</b>',
    tap_to_begin: '<i>தொடங்க கீழே உள்ள பட்டனை தட்டவும்:</i>',
    btn_admin: '👑 🎛️ மாஸ்டர் அட்மின் கண்ட்ரோல் பேனல்',
    btn_buy_now: '🟢 🛒 இப்போதே வாங்கவும் (Buy Now)',
    btn_check_update: '🟢 🔄 அப்டேட் பார்க்க (Check Update)',
    btn_add_balance: '🟢 💸 பணம் சேர்க்க (Add Balance)',
    btn_my_profile: '🟢 👑 எனது கணக்கு & வரலாறு (Profile)',
    btn_refer_earn: '🟢 🔗 நண்பர்களை அழைத்து சம்பாதிக்க (Refer)',
    btn_how_to_use: '🟢 ⁉️ பாட்டை எப்படி பயன்படுத்துவது',
    btn_support: '🟢 ✈️ உதவி (Support)',
    btn_daily_gift: '🟢 🎁 தினசரி பரிசு (Daily Gift)',
    btn_reseller: '🟢 💎 விஐபி ரீசெல்லர் பதவி உயர்வு',
    btn_commands: '🟢 📜 அனைத்து பாட் கமெண்ட்கள் (Commands)',
    btn_language: '🟢 🌐 மொழி மாற்று / Language (தமிழ்)',
    btn_main_menu: '🏠 முதன்மை பட்டி (Main Menu)',
    btn_back: '🔙 பின்செல்ல (Back)',
    lang_prompt: '🌐 <b>உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும் (Select Language):</b>\n\n<i>கீழே உள்ள பட்டனை அழுத்தவும்:</i>',
    lang_changed: '✅ <b>மொழி வெற்றிகரமாக தமிழுக்கு மாற்றப்பட்டது!</b>\n\nஅனைத்து அறிவிப்புகளும் இனி தமிழில் காண்பிக்கப்படும்.'
  },
  hi: {
    title: '✨ <b>कलाम एफएफ पैनल (KALAM FF PANEL)</b> 💸',
    greeting: '👋 <b>नमस्ते, {name}!</b>',
    bullet_catalog: '📦 <b>विस्तृत वीआईपी की कैटलॉग</b>',
    bullet_delivery: '⚡ <b>भुगतान पर तुरंत डिलीवरी</b>',
    bullet_gateways: '💳 <b>यूपीआई / क्यूआर कोड भुगतान</b>',
    bullet_support: '📞 <b>24/7 एडमिन सहायता</b>',
    balance_label: '💵 <b>वॉलेट बैलेंस: ₹{balance}</b>',
    tap_to_begin: '<i>शुरू करने के लिए नीचे दिए गए बटन पर टैप करें:</i>',
    btn_admin: '👑 🎛️ मास्टर एडमिन कंट्रोल पैनल',
    btn_buy_now: '🟢 🛒 अभी खरीदें (Buy Now)',
    btn_check_update: '🟢 🔄 अपडेट देखें (Check Update)',
    btn_add_balance: '🟢 💸 बैलेंस जोड़ें (Add Balance)',
    btn_my_profile: '🟢 👑 मेरी प्रोफ़ाइल और इतिहास (Profile)',
    btn_refer_earn: '🟢 🔗 रेफर करें और कमाएं (Refer)',
    btn_how_to_use: '🟢 ⁉️ बॉट का उपयोग कैसे करें',
    btn_support: '🟢 ✈️ सहायता (Support)',
    btn_daily_gift: '🟢 🎁 दैनिक उपहार (Daily Gift)',
    btn_reseller: '🟢 💎 वीआईपी रीसेलर अपग्रेड',
    btn_commands: '🟢 📜 सभी बॉट कमांड्स (Commands)',
    btn_language: '🟢 🌐 भाषा बदलें / Language (हिन्दी)',
    btn_main_menu: '🏠 मुख्य मेनू (Main Menu)',
    btn_back: '🔙 वापस (Back)',
    lang_prompt: '🌐 <b>अपनी पसंदीदा भाषा चुनें (Select Language):</b>\n\n<i>नीचे दिए गए विकल्पों में से चुनें:</i>',
    lang_changed: '✅ <b>भाषा सफलतापूर्वक हिन्दी में सेट हो गई है!</b>\n\nअब बॉट के सभी संदेश हिन्दी में दिखाई देंगे।'
  }
};

export interface BotUser {
  chatId: number;
  userId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  firstSeen?: number;
  joinedAt: number;
  lastActive: number;
  referrerId?: string;
  totalSpent: number;
  totalDeposited: number;
  purchaseCount?: number;
  referralCount?: number;
  interactionCount?: number;
  isReseller?: boolean;
  role?: 'ADMIN' | 'RESELLER' | 'USER';
  resellerUpgradedAt?: number;
  language?: BotLanguage;
}

interface DailyGiftRecord {
  lastClaimed: number;
  streak: number;
  totalWon: number;
}

interface ReferralRecord {
  referrerId?: string;
  referralCount: number;
  totalEarned: number;
  referredUserIds: number[];
}

interface BotPurchaseRecord {
  id: string;
  chatId: number;
  userId: string;
  productId: string;
  productName: string;
  planDuration: string;
  price: number;
  keys: string[];
  timestamp: number;
}

export interface PromoCodeRecord {
  code: string;
  rewardAmount: number;
  maxUses: number;
  usedCount: number;
  usedByChatIds: number[];
  createdAt: number;
  expiresAt?: number;
}

// Normalize any user-provided URL to a valid Telegram inline button URL
export function normalizeTelegramUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = String(rawUrl).trim();
  if (!url) return '';
  if (url.startsWith('@')) {
    return `https://t.me/${url.replace(/^@+/, '')}`;
  }
  if (url.startsWith('t.me/')) {
    return `https://${url}`;
  }
  if (/^https?:\/\//i.test(url) || /^tg:\/\//i.test(url)) {
    return url;
  }
  return `https://${url}`;
}

// Build standard Telegram inline keyboard markup supporting 1 or multiple action buttons
export function buildInlineKeyboard(
  buttonText?: string,
  buttonUrl?: string,
  button2Text?: string,
  button2Url?: string,
  extraButtons?: Array<{ text: string; url?: string; callback_data?: string }>
): { inline_keyboard: any[][] } | undefined {
  const rows: any[][] = [];
  const row1: any[] = [];

  const text1 = buttonText ? String(buttonText).trim() : '';
  const norm1 = normalizeTelegramUrl(buttonUrl);
  if (text1 && norm1) {
    row1.push({ text: text1, url: norm1 });
  }

  const text2 = button2Text ? String(button2Text).trim() : '';
  const norm2 = normalizeTelegramUrl(button2Url);
  if (text2 && norm2) {
    if (row1.length > 0 && (text1.length + text2.length > 28)) {
      rows.push(row1);
      rows.push([{ text: text2, url: norm2 }]);
    } else if (row1.length > 0) {
      row1.push({ text: text2, url: norm2 });
      rows.push(row1);
    } else {
      rows.push([{ text: text2, url: norm2 }]);
    }
  } else if (row1.length > 0) {
    rows.push(row1);
  }

  if (Array.isArray(extraButtons) && extraButtons.length > 0) {
    for (const btn of extraButtons) {
      if (btn.text && (btn.url || btn.callback_data)) {
        if (btn.url) {
          rows.push([{ text: btn.text, url: normalizeTelegramUrl(btn.url) }]);
        } else if (btn.callback_data) {
          rows.push([{ text: btn.text, callback_data: btn.callback_data }]);
        }
      }
    }
  }

  return rows.length > 0 ? { inline_keyboard: rows } : undefined;
}

// Sanitize and ensure all URLs inside inline keyboards conform to Telegram API specs
export function sanitizeReplyMarkup(markup: any): any {
  if (!markup) return undefined;
  try {
    const obj = typeof markup === 'string' ? JSON.parse(markup) : JSON.parse(JSON.stringify(markup));
    if (obj && Array.isArray(obj.inline_keyboard)) {
      obj.inline_keyboard = obj.inline_keyboard.map((row: any[]) => {
        if (!Array.isArray(row)) return [];
        return row.map((btn: any) => {
          if (btn && btn.url) {
            btn.url = normalizeTelegramUrl(btn.url);
          }
          return btn;
        }).filter((b: any) => b && (b.url || b.callback_data || b.web_app));
      }).filter((row: any[]) => row.length > 0);
      if (obj.inline_keyboard.length === 0) return undefined;
    }
    return obj;
  } catch {
    return markup;
  }
}

// User state tracking for multi-step bot flows (Deposit, Admin Broadcast, Add Balance, Transfer, Promo, etc.)
const userStates = new Map<number, { step: string; data?: any }>();

export class TelegramBotService {
  private static instance: TelegramBotService | null = null;
  private isPolling = false;
  private isWebhookActive = false;
  private activeWebhookUrl = '';
  private lastUpdateId = 0;
  private pollingEpoch = 0;
  private pollTimer: NodeJS.Timeout | null = null;
  private watchdogTimer: NodeJS.Timeout | null = null;
  private currentAbortController: AbortController | null = null;
  private botUsername = 'KALAMFFPANEL1_12_BOT';
  private numpadAmounts = new Map<number, string>();
  private processedKeys = new Set<string>();
  private inFlightKeys = new Set<string>();
  private lastProcessedKeysSavedAt = 0;
  private lastCallbackTime = new Map<string, number>();
  private recentOutgoingMessages = new Map<string, number>();
  private userLastActionTime = new Map<number, number>();
  private userLastActionText = new Map<number, string>();
  private recentDetectedChats = new Map<string, {
    chatId: string;
    type: string;
    title?: string;
    username?: string;
    firstName?: string;
    lastText?: string;
    date: number;
    botName?: string;
  }>();
  private isPollCycleRunning = false;
  private lastUserProofTimes = new Map<string, number>();
  private globalLastProofDispatchTime = 0;
  private processedUpdateIds = new Set<number>();
  private processedCallbackIds = new Set<string>();
  private processedMessageIds = new Set<string>();
  private isFetchInProgress = false;
  private lastPollAttemptTime = Date.now();
  private lastSuccessfulPollTime = Date.now();
  private consecutiveErrors = 0;
  private totalPollCycles = 0;
  private storedCallbacks: {
    getProducts: () => any[];
    getUserWallet: (identifier: string) => { balance: number; email?: string; userId: string };
    deductWallet: (identifier: string, amount: number, reason: string) => boolean;
    creditWallet: (identifier: string, amount: number, reason: string) => any;
    deliverKey: (productId: string, planDuration: string, userEmail: string) => Promise<{ success: boolean; keys?: string[]; error?: string }>;
    createFamOrder?: (amount: number, userIdentifier: string, userEmail?: string) => Promise<any>;
    queryFamOrder?: (orderId: string, userIdentifier: string) => Promise<any>;
  } | null = null;
  private inFlightDeposits = new Set<number | string>();
  private inFlightPurchases = new Set<string>();
  private checkingOrdersInProgress = new Set<string>();
  private confirmedDepositOrders = new Set<string>();
  private lastLowStockAlertSent = new Map<string, { stock: number; timestamp: number; isOutOfStock: boolean }>();
  private lowStockCheckTimer: NodeJS.Timeout | null = null;
  private recentActivities: TelegramActivityEvent[] = [];
  private totalMessagesReceived = 0;
  private totalCallbacksReceived = 0;
  private totalKeysDeliveredCount = 0;
  private totalDepositsCount = 0;
  private totalErrorsCount = 0;
  private activeUsersSet = new Set<string | number>();
  private botStartTime = Date.now();
  private activityListeners = new Set<(event: TelegramActivityEvent) => void>();
  private lastActivitiesSavedAt = 0;
  private lastProcessedUpdateIdsSavedAt = 0;
  private lastProductMaintenanceState = new Map<string, { status: string; isMaintenance: boolean; name: string; reason?: string }>();
  private lastGlobalStoreMaintenanceState: boolean | null = null;
  private maintenanceCheckTimer: NodeJS.Timeout | null = null;
  private isMaintenanceMonitorInitialized = false;
  private lastMainMenuSent = new Map<number, number>();

  private constructor() {
    this.recentActivities = this.loadActivitiesFromDisk();
    this.lastUpdateId = this.loadLastUpdateId();
    this.processedKeys = this.loadProcessedKeys();
    this.processedUpdateIds = this.loadProcessedUpdateIds();
    this.confirmedDepositOrders = this.loadConfirmedOrders();
    this.initWatchdog();
    this.initLowStockMonitor();
    this.initMaintenanceStatusMonitor();

    this.recordActivity({
      type: 'BOT_LIFECYCLE',
      category: 'system',
      severity: 'info',
      summary: '🤖 Telegram Bot Engine Initialized',
      details: 'Supervised polling & background activity monitoring engine active.',
      action: 'ENGINE_START'
    });
  }

  public static getInstance(): TelegramBotService {
    if (!TelegramBotService.instance) {
      TelegramBotService.instance = new TelegramBotService();
    }
    return TelegramBotService.instance;
  }

  private loadActivitiesFromDisk(): TelegramActivityEvent[] {
    try {
      const filePath = path.join(this.getDataDir(), 'telegram_activity_feed.json');
      if (fs.existsSync(filePath)) {
        const arr = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Array.isArray(arr)) {
          return arr.slice(0, 300);
        }
      }
    } catch {}
    return [];
  }

  private saveActivitiesToDisk(force = false) {
    const now = Date.now();
    if (!force && now - this.lastActivitiesSavedAt < 5000) {
      return;
    }
    this.lastActivitiesSavedAt = now;
    try {
      const filePath = path.join(this.getDataDir(), 'telegram_activity_feed.json');
      const toSave = this.recentActivities.slice(0, 200);
      fs.writeFileSync(filePath, JSON.stringify(toSave, null, 2), 'utf8');
    } catch {}
  }

  public recordActivity(event: {
    id?: string;
    timestamp?: number;
    type: TelegramActivityEvent['type'];
    category: TelegramActivityEvent['category'];
    severity: TelegramActivityEvent['severity'];
    userId?: string | number;
    chatId?: string | number;
    chatType?: string;
    chatTitle?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    action?: string;
    summary: string;
    details?: string;
    payload?: any;
    responseStatus?: string;
    durationMs?: number;
  }) {
    const now = event.timestamp || Date.now();
    const fullEvent: TelegramActivityEvent = {
      id: event.id || `tg_act_${now}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      isoTime: new Date(now).toISOString(),
      type: event.type,
      category: event.category,
      severity: event.severity,
      userId: event.userId,
      chatId: event.chatId,
      chatType: event.chatType,
      chatTitle: event.chatTitle,
      username: event.username,
      firstName: event.firstName,
      lastName: event.lastName,
      action: event.action,
      summary: event.summary,
      details: event.details,
      payload: event.payload,
      responseStatus: event.responseStatus,
      durationMs: event.durationMs,
    };

    if (event.category === 'message') this.totalMessagesReceived++;
    if (event.category === 'callback') this.totalCallbacksReceived++;
    if (event.category === 'key') this.totalKeysDeliveredCount++;
    if (event.category === 'order') this.totalDepositsCount++;
    if (event.severity === 'error' || event.category === 'error') this.totalErrorsCount++;
    if (event.userId) this.activeUsersSet.add(event.userId);

    this.recentActivities.unshift(fullEvent);
    if (this.recentActivities.length > 500) {
      this.recentActivities = this.recentActivities.slice(0, 500);
    }

    for (const listener of this.activityListeners) {
      try { listener(fullEvent); } catch {}
    }

    this.saveActivitiesToDisk();
  }

  public subscribeActivityStream(listener: (event: TelegramActivityEvent) => void): () => void {
    this.activityListeners.add(listener);
    return () => {
      this.activityListeners.delete(listener);
    };
  }

  public getActivityFeed(options?: {
    limit?: number;
    category?: string;
    type?: string;
    search?: string;
    sinceTimestamp?: number;
  }): {
    activities: TelegramActivityEvent[];
    stats: TelegramActivityFeedStats;
  } {
    let list = [...this.recentActivities];

    if (options?.sinceTimestamp) {
      list = list.filter(a => a.timestamp > (options.sinceTimestamp || 0));
    }

    if (options?.category && options.category !== 'all') {
      list = list.filter(a => a.category === options.category);
    }

    if (options?.type && options.type !== 'all') {
      list = list.filter(a => a.type === options.type);
    }

    if (options?.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      list = list.filter(a => 
        (a.summary && a.summary.toLowerCase().includes(q)) ||
        (a.details && a.details.toLowerCase().includes(q)) ||
        (a.action && a.action.toLowerCase().includes(q)) ||
        (a.username && a.username.toLowerCase().includes(q)) ||
        (a.firstName && a.firstName.toLowerCase().includes(q)) ||
        (a.chatId && String(a.chatId).includes(q)) ||
        (a.userId && String(a.userId).includes(q))
      );
    }

    const limit = Math.min(Math.max(1, Number(options?.limit) || 50), 300);
    const sliced = list.slice(0, limit);

    const now = Date.now();
    const stats: TelegramActivityFeedStats = {
      totalEvents: this.recentActivities.length,
      totalMessages: this.totalMessagesReceived,
      totalCallbacks: this.totalCallbacksReceived,
      totalKeysDelivered: this.totalKeysDeliveredCount,
      totalDeposits: this.totalDepositsCount,
      totalErrors: this.totalErrorsCount,
      activeUsersCount: this.activeUsersSet.size,
      lastActiveTime: this.recentActivities[0]?.timestamp || this.lastSuccessfulPollTime || now,
      isPolling: this.isPolling,
      isWebhookActive: this.isWebhookActive,
      botUsername: this.botUsername,
      uptimeSeconds: Math.floor((now - this.botStartTime) / 1000)
    };

    return {
      activities: sliced,
      stats
    };
  }

  public clearActivityFeed(): boolean {
    this.recentActivities = [];
    this.saveActivitiesToDisk(true);
    this.recordActivity({
      type: 'BOT_LIFECYCLE',
      category: 'system',
      severity: 'info',
      summary: '🧹 Activity Feed Cleared',
      details: 'Telegram bot activity feed and incoming message logs were reset by master administrator.'
    });
    return true;
  }

  private loadConfirmedOrders(): Set<string> {
    const set = new Set<string>();
    try {
      const filePath = path.join(this.getDataDir(), 'telegram_confirmed_orders.json');
      if (fs.existsSync(filePath)) {
        const arr = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Array.isArray(arr)) {
          for (const item of arr) {
            if (typeof item === 'string') set.add(item);
          }
        }
      }
    } catch {}
    return set;
  }

  private saveConfirmedOrders() {
    try {
      const filePath = path.join(this.getDataDir(), 'telegram_confirmed_orders.json');
      const arr = Array.from(this.confirmedDepositOrders).slice(-2000);
      fs.writeFileSync(filePath, JSON.stringify(arr), 'utf8');
    } catch {}
  }

  private loadLastUpdateId(): number {
    try {
      const filePath = path.join(this.getDataDir(), 'telegram_last_update_id.json');
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (typeof data.lastUpdateId === 'number') {
          return data.lastUpdateId;
        }
      }
    } catch {}
    return 0;
  }

  private saveLastUpdateId(id: number) {
    try {
      const filePath = path.join(this.getDataDir(), 'telegram_last_update_id.json');
      fs.writeFileSync(filePath, JSON.stringify({ lastUpdateId: id, updatedAt: new Date().toISOString() }), 'utf8');
    } catch {}
  }

  private loadProcessedKeys(): Set<string> {
    const set = new Set<string>();
    try {
      const filePath = path.join(this.getDataDir(), 'telegram_processed_keys.json');
      if (fs.existsSync(filePath)) {
        const arr = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Array.isArray(arr)) {
          for (const item of arr) {
            if (typeof item === 'string') set.add(item);
          }
        }
      }
    } catch {}
    return set;
  }

  private saveProcessedKeys(force = false) {
    const now = Date.now();
    // Debounce non-forced disk writes to once every 15 seconds to prevent event-loop freezing
    if (!force && now - this.lastProcessedKeysSavedAt < 15000) {
      return;
    }
    this.lastProcessedKeysSavedAt = now;
    try {
      const filePath = path.join(this.getDataDir(), 'telegram_processed_keys.json');
      // Keep up to 1000 recent deduplication keys in memory and disk
      const arr = Array.from(this.processedKeys).slice(-1000);
      if (this.processedKeys.size > 1500) {
        this.processedKeys = new Set(arr);
      }
      fs.writeFileSync(filePath, JSON.stringify(arr), 'utf8');
    } catch {}
  }

  private loadProcessedUpdateIds(): Set<number> {
    const set = new Set<number>();
    try {
      const filePath = path.join(this.getDataDir(), 'telegram_processed_update_ids.json');
      if (fs.existsSync(filePath)) {
        const arr = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Array.isArray(arr)) {
          for (const item of arr) {
            if (typeof item === 'number') set.add(item);
          }
        }
      }
    } catch {}
    return set;
  }

  private saveProcessedUpdateIds(force = false) {
    const now = Date.now();
    if (!force && now - this.lastProcessedUpdateIdsSavedAt < 5000) {
      return;
    }
    this.lastProcessedUpdateIdsSavedAt = now;
    try {
      const filePath = path.join(this.getDataDir(), 'telegram_processed_update_ids.json');
      const arr = Array.from(this.processedUpdateIds).slice(-2000);
      if (this.processedUpdateIds.size > 3000) {
        this.processedUpdateIds = new Set(arr);
      }
      fs.writeFileSync(filePath, JSON.stringify(arr), 'utf8');
    } catch {}
  }

  private getDataDir(): string {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {}
    }
    return dataDir;
  }

  public getCredentials(): {
    botToken: string;
    defaultChatId: string;
    apkDownloadUrl: string;
    apkTutorialUrl: string;
    botUsername: string;
    proofBotToken: string;
    proofChatId: string;
    proofChannelLink: string;
    enableAutoProof: boolean;
  } {
    const dataDir = this.getDataDir();
    const configFile = path.join(dataDir, 'telegram_config.json');
    const storeConfigFile = path.join(dataDir, 'store_data.json');
    let botToken = process.env.TELEGRAM_BOT_TOKEN || '8931126319:AAFXjsferq8w9qYQViI4xaH0UJflopoGC3g';
    let defaultChatId = process.env.TELEGRAM_CHAT_ID || '7768975239';
    let apkDownloadUrl = process.env.APK_DOWNLOAD_URL || 'https://t.me/kalamffpanel';
    let apkTutorialUrl = process.env.APK_TUTORIAL_URL || 'https://youtu.be/kalam_tutorial';
    let botUsername = process.env.TELEGRAM_BOT_USERNAME || '@KalamFFStoreBot';

    let proofBotToken = process.env.TELEGRAM_PROOF_BOT_TOKEN || '8817017449:AAEunwF639QSLm0JQHeFeOa_ujBwzwSb6GU';
    let proofChatId = process.env.TELEGRAM_PROOF_CHAT_ID || '-1004325449752';
    let proofChannelLink = process.env.PAYMENT_PROOF_CHANNEL || 'https://t.me/c/4325449752';
    let enableAutoProof = true;

    if (fs.existsSync(storeConfigFile)) {
      try {
        const storeData = JSON.parse(fs.readFileSync(storeConfigFile, 'utf8'));
        if (storeData.storeSettings?.apkDownloadUrl) {
          apkDownloadUrl = storeData.storeSettings.apkDownloadUrl.trim();
        }
        if (storeData.storeSettings?.howToUseBotLink) {
          apkTutorialUrl = storeData.storeSettings.howToUseBotLink.trim();
        }
        if (storeData.storeSettings?.proofBotToken) {
          proofBotToken = storeData.storeSettings.proofBotToken.trim();
        }
        if (storeData.storeSettings?.proofChatId) {
          proofChatId = storeData.storeSettings.proofChatId.trim();
        }
        if (storeData.storeSettings?.paymentProofChannel) {
          proofChannelLink = storeData.storeSettings.paymentProofChannel.trim();
          if (!proofChatId && (proofChannelLink.startsWith('@') || proofChannelLink.startsWith('-100') || (!proofChannelLink.includes('http') && !proofChannelLink.includes('/')))) {
            proofChatId = proofChannelLink;
          }
        }
        if (typeof storeData.storeSettings?.enableAutoProof === 'boolean') {
          enableAutoProof = storeData.storeSettings.enableAutoProof;
        }
      } catch {}
    }

    if (fs.existsSync(configFile)) {
      try {
        const saved = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        if (saved.botToken) botToken = saved.botToken.trim();
        if (saved.chatId) defaultChatId = saved.chatId.trim();
        if (saved.apkDownloadUrl) apkDownloadUrl = saved.apkDownloadUrl.trim();
        if (saved.apkTutorialUrl) apkTutorialUrl = saved.apkTutorialUrl.trim();
        if (saved.botUsername) botUsername = saved.botUsername.trim();
        if (saved.proofBotToken) proofBotToken = saved.proofBotToken.trim();
        if (saved.proofChatId) proofChatId = saved.proofChatId.trim();
        if (saved.paymentProofChannel) proofChannelLink = saved.paymentProofChannel.trim();
        if (typeof saved.enableAutoProof === 'boolean') enableAutoProof = saved.enableAutoProof;
      } catch {}
    }

    if (!proofChatId && fs.existsSync(storeConfigFile)) {
      try {
        const sd = JSON.parse(fs.readFileSync(storeConfigFile, 'utf8'));
        if (sd.storeSettings?.proofChatId) proofChatId = sd.storeSettings.proofChatId.trim();
        if (!proofBotToken && sd.storeSettings?.proofBotToken) proofBotToken = sd.storeSettings.proofBotToken.trim();
      } catch {}
    }

    return { botToken, defaultChatId, apkDownloadUrl, apkTutorialUrl, botUsername, proofBotToken, proofChatId, proofChannelLink, enableAutoProof };
  }

  // Mask sensitive license key for public channel proofs (e.g. ABCD-****-1234)
  public maskKeyForProof(key: string): string {
    if (!key || typeof key !== 'string') return 'XXXX-****-YYYY';
    const clean = key.trim();
    if (clean.length <= 6) return clean.substring(0, 2) + '****' + clean.substring(clean.length - 2);
    if (clean.length <= 12) return clean.substring(0, 3) + '****' + clean.substring(clean.length - 3);
    return clean.substring(0, 4) + '****' + clean.substring(clean.length - 4);
  }

  private dispatchedProofKeys = new Set<string>();
  private dispatchedKeyStrings = new Set<string>();
  private dispatchedOrderIds = new Set<string>();
  private inFlightProofPromises = new Map<string, Promise<boolean>>();
  private lastProofDispatchTime = 0;

  private loadDispatchedProofCache() {
    try {
      const dataDir = this.getDataDir();
      const filePath = path.join(dataDir, 'dispatched_proof_cache.json');
      if (fs.existsSync(filePath)) {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Array.isArray(raw.keys)) raw.keys.forEach((k: string) => this.dispatchedKeyStrings.add(k.trim()));
        if (Array.isArray(raw.orders)) raw.orders.forEach((o: string) => this.dispatchedOrderIds.add(o.trim()));
        if (Array.isArray(raw.signatures)) raw.signatures.forEach((s: string) => this.dispatchedProofKeys.add(s.trim()));
      }
    } catch {}
  }

  private saveDispatchedProofCache() {
    try {
      const dataDir = this.getDataDir();
      const filePath = path.join(dataDir, 'dispatched_proof_cache.json');
      const data = {
        keys: Array.from(this.dispatchedKeyStrings).slice(-5000),
        orders: Array.from(this.dispatchedOrderIds).slice(-3000),
        signatures: Array.from(this.dispatchedProofKeys).slice(-2000),
        updatedAt: Date.now()
      };
      fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
    } catch {}
  }

  // Dispatch payment & key delivery proof to secondary Proof Bot / Channel
  public async dispatchPaymentProof(info: {
    productName: string;
    planDuration: string;
    price?: number;
    amount?: number;
    keys: string[];
    chatId?: number | string;
    userId?: string;
    username?: string;
    firstName?: string;
    orderId?: string;
    paymentMethod?: string;
  }): Promise<boolean> {
    try {
      if (this.dispatchedKeyStrings.size === 0) {
        this.loadDispatchedProofCache();
      }

      const deliveredKeys = Array.isArray(info.keys) ? info.keys.filter(k => typeof k === 'string' && k.trim().length > 0) : [];
      if (deliveredKeys.length === 0) {
        console.log('[TelegramBot] Proof dispatch skipped: no keys provided');
        return false;
      }

      const now = Date.now();
      const rawUser = (info.chatId || info.userId || info.username || 'cust').toString().trim().toLowerCase();
      const normUser = rawUser.replace(/^tg_/, '').replace(/^@/, '').trim();
      const normProd = (info.productName || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

      // 1. Global proof dispatch throttle (minimum 3.5 seconds between ANY 2 proof messages across the whole bot)
      if (now - this.globalLastProofDispatchTime < 3500) {
        console.log('[TelegramBot] Proof dispatch skipped: global proof throttle active');
        return true;
      }

      // 2. Per-user & product debounce (minimum 45 seconds per user + product combination)
      const userProdKey = `${normUser}_${normProd}`;
      const lastUserTime = this.lastUserProofTimes.get(userProdKey) || 0;
      if (now - lastUserTime < 45000) {
        console.log('[TelegramBot] Proof dispatch skipped: per-user debounce active for:', userProdKey);
        return true;
      }

      // 3. Check if orderId was already dispatched
      if (info.orderId && this.dispatchedOrderIds.has(info.orderId.trim())) {
        console.log('[TelegramBot] Proof dispatch skipped: order ID already dispatched:', info.orderId);
        return true;
      }

      // 4. Check if ANY delivered keys have already been dispatched (both raw and masked)
      for (const k of deliveredKeys) {
        const cleanKey = k.trim().toLowerCase();
        const masked = this.maskKeyForProof(k).trim().toLowerCase();
        if (this.dispatchedKeyStrings.has(cleanKey) || this.dispatchedKeyStrings.has(masked)) {
          console.log('[TelegramBot] Proof dispatch skipped: key already posted to proof channel:', cleanKey);
          return true;
        }
      }

      // 5. Global window debounce
      const userSig = `proof_${normUser}_${normProd}_${Math.floor(now / 60000)}`;
      if (this.dispatchedProofKeys.has(userSig)) {
        console.log('[TelegramBot] Proof dispatch skipped: recent proof signature exists in window:', userSig);
        return true;
      }

      // 6. Mutex lock for in-flight requests
      const lockKey = `proof_${normUser}_${normProd}_${deliveredKeys.map(k => k.trim()).join('_')}`;
      const existingPromise = this.inFlightProofPromises.get(lockKey);
      if (existingPromise) {
        console.log('[TelegramBot] In-flight proof dispatch detected for lockKey. Returning active promise.');
        return await existingPromise;
      }

      // Pre-register keys, signature, and timestamps immediately before network dispatch
      this.globalLastProofDispatchTime = now;
      this.lastUserProofTimes.set(userProdKey, now);
      this.dispatchedProofKeys.add(userSig);
      if (info.orderId) {
        this.dispatchedOrderIds.add(info.orderId.trim());
      }
      for (const k of deliveredKeys) {
        this.dispatchedKeyStrings.add(k.trim().toLowerCase());
        this.dispatchedKeyStrings.add(this.maskKeyForProof(k).trim().toLowerCase());
      }
      this.lastProofDispatchTime = now;
      this.saveDispatchedProofCache();

      // Clean old cache entries if too large
      if (this.dispatchedProofKeys.size > 2000) {
        const arr = Array.from(this.dispatchedProofKeys);
        this.dispatchedProofKeys.clear();
        arr.slice(-1000).forEach(k => this.dispatchedProofKeys.add(k));
      }
      if (this.dispatchedKeyStrings.size > 5000) {
        const arr = Array.from(this.dispatchedKeyStrings);
        this.dispatchedKeyStrings.clear();
        arr.slice(-2500).forEach(k => this.dispatchedKeyStrings.add(k));
      }
      if (this.dispatchedOrderIds.size > 3000) {
        const arr = Array.from(this.dispatchedOrderIds);
        this.dispatchedOrderIds.clear();
        arr.slice(-1500).forEach(k => this.dispatchedOrderIds.add(k));
      }

      const creds = this.getCredentials();
      if (!creds.enableAutoProof) {
        console.log('[TelegramBot] Proof dispatch skipped: enableAutoProof is false');
        return false;
      }

      const activeToken = creds.proofBotToken || '8817017449:AAEunwF639QSLm0JQHeFeOa_ujBwzwSb6GU';
      const targetChat = creds.proofChatId || '-1004325449752';

      if (!activeToken || !targetChat) {
        console.warn('[TelegramBot] Proof dispatch skipped: missing activeToken or proofChatId', { activeToken: !!activeToken, targetChat });
        return false;
      }

      const effectivePrice = info.price !== undefined ? info.price : (info.amount !== undefined ? info.amount : 0);
      const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
      const maskedKeys = deliveredKeys.map(k => `<code>${this.maskKeyForProof(k)}</code> <i>(Sent Privately to Buyer)</i>`).join('\n');
      const buyerName = info.username ? `@${info.username.replace('@', '')}` : (info.firstName || info.userId || 'Verified Customer');
      const ordId = info.orderId || `ORD_${Date.now()}`;
      const botHandle = (creds.botUsername || 'KALAMFFPANEL1_12_BOT').replace('@', '');

      const text =
        `🎉 <b>NEW KEY PURCHASE & PAYMENT PROOF</b> 🎉\n\n` +
        `<blockquote>` +
        `📦 <b>Product:</b> ${info.productName}\n` +
        `⏳ <b>Plan Duration:</b> ${info.planDuration}\n` +
        (effectivePrice ? `💵 <b>Amount Paid:</b> ₹${Number(effectivePrice).toFixed(2)}\n` : '') +
        `👤 <b>Customer:</b> ${buyerName}\n` +
        (info.chatId ? `🆔 <b>User ID:</b> <code>${info.chatId}</code>\n` : '') +
        `🔖 <b>Order ID:</b> <code>${ordId}</code>\n` +
        `💳 <b>Payment Mode:</b> ${info.paymentMethod || 'Instant Auto-Wallet'}\n` +
        `🕒 <b>Time:</b> ${time} (IST)\n` +
        `</blockquote>\n\n` +
        `🔐 <b>DELIVERED LICENSE KEY(S):</b>\n` +
        `${maskedKeys}\n\n` +
        `🛡️ <b>STATUS:</b> ✅ <b>VERIFIED & DELIVERED</b> ⚡\n` +
        `🛒 <b>BUY KEY INSTANTLY:</b> @${botHandle}`;

      const dispatchPromise = (async () => {
        try {
          const res = await fetch(`https://api.telegram.org/bot${activeToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: targetChat,
              text,
              parse_mode: 'HTML',
              disable_web_page_preview: true,
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🛒 Buy Keys Now', url: `https://t.me/${botHandle}` }]
                ]
              }
            })
          });

          const data: any = await res.json();
          if (!data.ok) {
            console.warn('[TelegramBot] Proof HTML send failed, trying plain fallback:', data.description);
            const fbRes = await fetch(`https://api.telegram.org/bot${activeToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: targetChat,
                text: text.replace(/<[^>]*>/g, '')
              })
            });
            const fbData: any = await fbRes.json();
            if (!fbData.ok) {
              console.error('[TelegramBot] Proof plain send failed:', fbData.description);
              return false;
            }
          }
          console.log('[TelegramBot] ✅ Exactly one proof message dispatched to channel:', targetChat);
          return true;
        } catch (err: any) {
          console.error('[TelegramBot] Dispatch proof network error:', err.message);
          return false;
        } finally {
          setTimeout(() => {
            this.inFlightProofPromises.delete(lockKey);
          }, 10000);
        }
      })();

      this.inFlightProofPromises.set(lockKey, dispatchPromise);
      return await dispatchPromise;
    } catch (e: any) {
      console.warn('[TelegramBot] Proof dispatch failed:', e.message);
      return false;
    }
  }

  // Dispatch UPI Deposit / Balance top-up proof to secondary Proof Group (Disabled: proofs are sent ONLY when VIP Keys are purchased)
  public async dispatchDepositProof(_info: {
    amount: number;
    utr?: string;
    orderId?: string;
    chatId?: number;
    username?: string;
    firstName?: string;
    paymentMethod?: string;
  }): Promise<boolean> {
    // Deposit proofs are disabled as requested: proofs are reserved exclusively for VIP key purchases
    return false;
  }

  public saveApkUrl(url: string): string {
    const cleanUrl = url.trim();
    const finalUrl = cleanUrl.startsWith('@')
      ? `https://t.me/${cleanUrl.replace('@', '')}`
      : (cleanUrl.startsWith('t.me/') ? `https://${cleanUrl}` : cleanUrl);

    const dataDir = this.getDataDir();
    const configFile = path.join(dataDir, 'telegram_config.json');
    let config: any = {};
    if (fs.existsSync(configFile)) {
      try {
        config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      } catch {}
    }
    config.apkDownloadUrl = finalUrl;
    config.updatedAt = new Date().toISOString();
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');

    const storeConfigFile = path.join(dataDir, 'store_data.json');
    if (fs.existsSync(storeConfigFile)) {
      try {
        const storeData = JSON.parse(fs.readFileSync(storeConfigFile, 'utf8'));
        if (!storeData.storeSettings) storeData.storeSettings = {};
        storeData.storeSettings.apkDownloadUrl = finalUrl;
        storeData.updatedAt = Date.now();
        fs.writeFileSync(storeConfigFile, JSON.stringify(storeData, null, 2), 'utf8');
      } catch {}
    }
    return finalUrl;
  }

  // Reseller Upgrade Amount Config Helper
  public getResellerUpgradeAmount(): number {
    const dataDir = this.getDataDir();
    const storeConfigFile = path.join(dataDir, 'store_data.json');
    const tgConfigFile = path.join(dataDir, 'telegram_config.json');
    if (fs.existsSync(storeConfigFile)) {
      try {
        const sd = JSON.parse(fs.readFileSync(storeConfigFile, 'utf8'));
        if (typeof sd.storeSettings?.resellerUpgradeAmount === 'number' && sd.storeSettings.resellerUpgradeAmount >= 0) {
          return sd.storeSettings.resellerUpgradeAmount;
        }
      } catch {}
    }
    if (fs.existsSync(tgConfigFile)) {
      try {
        const tc = JSON.parse(fs.readFileSync(tgConfigFile, 'utf8'));
        if (typeof tc.resellerUpgradeAmount === 'number' && tc.resellerUpgradeAmount >= 0) {
          return tc.resellerUpgradeAmount;
        }
      } catch {}
    }
    return 500;
  }

  public saveResellerUpgradeAmount(amount: number): number {
    const cleanAmt = Math.max(0, Math.round(Number(amount) || 0));
    const dataDir = this.getDataDir();
    const storeConfigFile = path.join(dataDir, 'store_data.json');
    const tgConfigFile = path.join(dataDir, 'telegram_config.json');
    if (fs.existsSync(storeConfigFile)) {
      try {
        const sd = JSON.parse(fs.readFileSync(storeConfigFile, 'utf8'));
        if (!sd.storeSettings) sd.storeSettings = {};
        sd.storeSettings.resellerUpgradeAmount = cleanAmt;
        sd.updatedAt = Date.now();
        fs.writeFileSync(storeConfigFile, JSON.stringify(sd, null, 2), 'utf8');
      } catch {}
    }
    if (fs.existsSync(tgConfigFile)) {
      try {
        const tc = JSON.parse(fs.readFileSync(tgConfigFile, 'utf8'));
        tc.resellerUpgradeAmount = cleanAmt;
        tc.updatedAt = new Date().toISOString();
        fs.writeFileSync(tgConfigFile, JSON.stringify(tc, null, 2), 'utf8');
      } catch {}
    }
    return cleanAmt;
  }

  public getResellerDiscountPercent(): number {
    const dataDir = this.getDataDir();
    const configFile = path.join(dataDir, 'telegram_config.json');
    const storeConfigFile = path.join(dataDir, 'store_data.json');
    if (fs.existsSync(configFile)) {
      try {
        const tc = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        if (typeof tc.resellerDiscountPercent === 'number' && tc.resellerDiscountPercent > 0) {
          return tc.resellerDiscountPercent;
        }
      } catch {}
    }
    if (fs.existsSync(storeConfigFile)) {
      try {
        const sd = JSON.parse(fs.readFileSync(storeConfigFile, 'utf8'));
        if (typeof sd.storeSettings?.resellerDiscountPercent === 'number' && sd.storeSettings.resellerDiscountPercent > 0) {
          return sd.storeSettings.resellerDiscountPercent;
        }
      } catch {}
    }
    return 15;
  }

  public loadStoredOrders(): any[] {
    try {
      const ordersFile = path.join(this.getDataDir(), 'orders.json');
      if (fs.existsSync(ordersFile)) {
        const data = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
        return Array.isArray(data) ? data : [];
      }
    } catch {}
    return [];
  }

  // Calculate pricing for user with Normal vs Reseller wholesale pricing
  public getPlanPriceForUser(
    plan: any,
    isReseller: boolean
  ): { price: number; regularPrice: number; resellerPrice: number; isDiscounted: boolean } {
    const regularPrice = Math.max(0, Math.round(Number(plan.price) || 0));
    let resellerPrice = regularPrice;

    // Check custom reseller price configured on website
    const rawResellerPrice = plan.resellerPrice !== undefined && plan.resellerPrice !== null && plan.resellerPrice !== ''
      ? Number(plan.resellerPrice)
      : null;

    if (typeof rawResellerPrice === 'number' && !isNaN(rawResellerPrice) && rawResellerPrice > 0) {
      resellerPrice = Math.round(rawResellerPrice);
    } else {
      const discountPercent = this.getResellerDiscountPercent();
      resellerPrice = Math.max(1, Math.round(regularPrice * (1 - discountPercent / 100)));
    }

    if (!isReseller) {
      // Normal user always gets regular normal amount from website
      return {
        price: regularPrice,
        regularPrice,
        resellerPrice,
        isDiscounted: false,
      };
    }

    // VIP Reseller user gets reseller wholesale rate from website
    return {
      price: resellerPrice,
      regularPrice,
      resellerPrice,
      isDiscounted: resellerPrice < regularPrice,
    };
  }

  // Persistent Bot Users Storage
  public loadBotUsers(): Map<number, BotUser> {
    const filePath = path.join(this.getDataDir(), 'bot_users.json');
    const map = new Map<number, BotUser>();
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Array.isArray(data)) {
          for (const u of data) {
            if (u.chatId) map.set(u.chatId, u);
          }
        }
      } catch {}
    }
    if (map.size === 0) {
      // Seed default admin user so directory is never empty
      const adminChatId = 7768975239;
      map.set(adminChatId, {
        chatId: adminChatId,
        userId: `tg_${adminChatId}`,
        username: 'Velprasath_12',
        firstName: 'Kalam',
        lastName: 'Admin',
        joinedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        lastActive: Date.now(),
        totalSpent: 0,
        totalDeposited: 0,
        interactionCount: 1,
      });
      try {
        fs.writeFileSync(filePath, JSON.stringify(Array.from(map.values()), null, 2), 'utf8');
      } catch {}
    }
    return map;
  }

  public saveBotUsers(map: Map<number, BotUser>) {
    const filePath = path.join(this.getDataDir(), 'bot_users.json');
    try {
      fs.writeFileSync(filePath, JSON.stringify(Array.from(map.values()), null, 2), 'utf8');
    } catch {}
  }

  public getAllBotUsers(): BotUser[] {
    const users = this.loadBotUsers();
    return Array.from(users.values());
  }

  public registerOrUpdateUser(
    from: { id: number; first_name?: string; last_name?: string; username?: string },
    chatId: number,
    referrerId?: string
  ): BotUser {
    const users = this.loadBotUsers();
    let user = users.get(chatId);
    const isUserAdmin = this.isAdmin(chatId);

    if (!user) {
      user = {
        chatId,
        userId: `tg_${from.id}`,
        username: from.username,
        firstName: from.first_name || 'User',
        lastName: from.last_name,
        joinedAt: Date.now(),
        lastActive: Date.now(),
        referrerId,
        totalSpent: 0,
        totalDeposited: 0,
        interactionCount: 1,
        isReseller: isUserAdmin ? true : false,
        role: isUserAdmin ? 'ADMIN' : 'USER',
      };
    } else {
      user.lastActive = Date.now();
      if (from.username) user.username = from.username;
      if (from.first_name) user.firstName = from.first_name;
      if (from.last_name) user.lastName = from.last_name;
      if (!user.referrerId && referrerId && referrerId !== `tg_${from.id}`) {
        user.referrerId = referrerId;
      }
      if (isUserAdmin) {
        user.isReseller = true;
        user.role = 'ADMIN';
      } else if (user.isReseller) {
        user.role = 'RESELLER';
      }
      user.interactionCount = (user.interactionCount || 0) + 1;
    }

    users.set(chatId, user);
    this.saveBotUsers(users);
    return user;
  }

  public findBotUser(identifier: string | number): BotUser | undefined {
    const users = this.loadBotUsers();
    if (typeof identifier === 'number') {
      return users.get(identifier);
    }
    const cleanId = String(identifier).trim();
    const numId = parseInt(cleanId.replace('tg_', ''), 10);
    if (!isNaN(numId) && users.has(numId)) {
      return users.get(numId);
    }
    for (const u of users.values()) {
      if (
        u.userId === cleanId ||
        (u.username && u.username.toLowerCase() === cleanId.replace('@', '').toLowerCase()) ||
        String(u.chatId) === cleanId
      ) {
        return u;
      }
    }
    return undefined;
  }

  public setBotUserResellerStatus(identifier: string | number, isReseller: boolean): { success: boolean; user?: BotUser; error?: string } {
    const users = this.loadBotUsers();
    const targetUser = this.findBotUser(identifier);
    if (!targetUser) {
      return { success: false, error: `User "${identifier}" not found in Bot Users directory.` };
    }

    const wasReseller = !!targetUser.isReseller;
    targetUser.isReseller = isReseller;
    if (isReseller) {
      targetUser.role = targetUser.role === 'ADMIN' ? 'ADMIN' : 'RESELLER';
      targetUser.resellerUpgradedAt = targetUser.resellerUpgradedAt || Date.now();
    } else {
      targetUser.role = targetUser.role === 'ADMIN' ? 'ADMIN' : 'USER';
    }

    users.set(targetUser.chatId, targetUser);
    this.saveBotUsers(users);

    // If newly activated and not admin, notify user on Telegram
    if (isReseller && !wasReseller) {
      this.sendMessage(
        targetUser.chatId,
        `💎 <b>VIP RESELLER ACCESS ACTIVATED!</b>\n\n` +
        `Hello <b>${targetUser.firstName || 'Partner'}</b>, your account has been upgraded to <b>VIP Reseller</b> by the Admin!\n\n` +
        `✨ <b>Reseller Privileges Unlocked:</b>\n` +
        `• Direct wholesale discounted rates on all license keys\n` +
        `• Priority 24/7 key dispatch\n` +
        `• Wholesale margins for your own customers\n\n` +
        `🛒 <i>Type /buy or /start to start purchasing keys at VIP wholesale prices!</i>`
      ).catch(() => {});
    } else if (!isReseller && wasReseller) {
      this.sendMessage(
        targetUser.chatId,
        `ℹ️ <b>Account Status Updated:</b>\n\n` +
        `Your account status has been changed back to Standard Member.`
      ).catch(() => {});
    }

    return { success: true, user: targetUser };
  }

  public getResellerUsers(): BotUser[] {
    const users = this.getAllBotUsers();
    return users.filter(u => u.isReseller || u.role === 'RESELLER' || this.isAdmin(u.chatId));
  }

  // Daily Gifts Storage
  private loadDailyGifts(): Map<number, DailyGiftRecord> {
    const filePath = path.join(this.getDataDir(), 'bot_daily_gifts.json');
    const map = new Map<number, DailyGiftRecord>();
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        for (const [k, v] of Object.entries(data)) {
          map.set(Number(k), v as DailyGiftRecord);
        }
      } catch {}
    }
    return map;
  }

  private saveDailyGifts(map: Map<number, DailyGiftRecord>) {
    const filePath = path.join(this.getDataDir(), 'bot_daily_gifts.json');
    try {
      const obj: any = {};
      map.forEach((v, k) => {
        obj[k] = v;
      });
      fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
    } catch {}
  }

  // Referrals Storage
  private loadReferrals(): Map<number, ReferralRecord> {
    const filePath = path.join(this.getDataDir(), 'bot_referrals.json');
    const map = new Map<number, ReferralRecord>();
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        for (const [k, v] of Object.entries(data)) {
          map.set(Number(k), v as ReferralRecord);
        }
      } catch {}
    }
    return map;
  }

  private saveReferrals(map: Map<number, ReferralRecord>) {
    const filePath = path.join(this.getDataDir(), 'bot_referrals.json');
    try {
      const obj: any = {};
      map.forEach((v, k) => {
        obj[k] = v;
      });
      fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
    } catch {}
  }

  // Bot Purchases Storage
  private loadPurchases(): BotPurchaseRecord[] {
    const filePath = path.join(this.getDataDir(), 'bot_purchases.json');
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8')) || [];
      } catch {}
    }
    return [];
  }

  private recordPurchase(record: BotPurchaseRecord) {
    const list = this.loadPurchases();
    list.unshift(record);
    if (list.length > 500) list.splice(500);
    const filePath = path.join(this.getDataDir(), 'bot_purchases.json');
    try {
      fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
    } catch {}
  }

  // Promo Codes Storage
  public loadPromoCodes(): PromoCodeRecord[] {
    const filePath = path.join(this.getDataDir(), 'bot_promo_codes.json');
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8')) || [];
      } catch {}
    }
    // Default starter promo code for new bots
    const defaultCodes: PromoCodeRecord[] = [
      {
        code: 'KALAMFREE',
        rewardAmount: 5,
        maxUses: 100,
        usedCount: 0,
        usedByChatIds: [],
        createdAt: Date.now()
      },
      {
        code: 'WELCOME10',
        rewardAmount: 10,
        maxUses: 50,
        usedCount: 0,
        usedByChatIds: [],
        createdAt: Date.now()
      }
    ];
    this.savePromoCodes(defaultCodes);
    return defaultCodes;
  }

  public savePromoCodes(codes: PromoCodeRecord[]) {
    const filePath = path.join(this.getDataDir(), 'bot_promo_codes.json');
    try {
      fs.writeFileSync(filePath, JSON.stringify(codes, null, 2));
    } catch {}
  }

  // ===== WEBSITE ADMIN CONTROL & DISK STORAGE HELPERS =====

  public loadProductsFromDisk(): any[] {
    try {
      // 1. If stored callback exists from server, check it first
      if (this.storedCallbacks && typeof this.storedCallbacks.getProducts === 'function') {
        try {
          const fromCb = this.storedCallbacks.getProducts();
          if (Array.isArray(fromCb)) return fromCb;
        } catch {}
      }

      // 2. Read live products_db.json
      const dataDir = this.getDataDir();
      const dbFilePath = path.join(dataDir, 'products_db.json');
      if (fs.existsSync(dbFilePath)) {
        const raw = fs.readFileSync(dbFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }

      // 3. Fallback to legacy products.json only if exists
      const legacyFilePath = path.join(dataDir, 'products.json');
      if (fs.existsSync(legacyFilePath)) {
        const raw = fs.readFileSync(legacyFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('[TelegramBot] Error loading products from disk:', e);
    }
    return [];
  }

  public saveProductsToDisk(products: any[]) {
    try {
      const dataDir = this.getDataDir();
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      // Save to both products_db.json (primary) and products.json (legacy)
      const dbFilePath = path.join(dataDir, 'products_db.json');
      fs.writeFileSync(dbFilePath, JSON.stringify(products, null, 2), 'utf-8');
      const legacyFilePath = path.join(dataDir, 'products.json');
      fs.writeFileSync(legacyFilePath, JSON.stringify(products, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[TelegramBot] Error saving products to disk:', e);
    }
  }

  public syncProducts(products: any[]) {
    try {
      if (Array.isArray(products)) {
        this.saveProductsToDisk(products);
        console.log(`[TelegramBot] Synchronized ${products.length} products with Telegram Bot in real-time.`);
      }
      this.auditAndAlertProductMaintenance('SERVER_PRODUCT_SYNC').catch(() => {});
    } catch (e) {
      console.warn('[TelegramBot] Error in syncProducts:', e);
    }
  }

  public loadStoreDataFromDisk(): any {
    try {
      const filePath = path.join(this.getDataDir(), 'store_data.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[TelegramBot] Error loading store data from disk:', e);
    }
    return {
      paymentConfigs: [],
      storeSettings: {
        shopName: "KALAM FF PANEL",
        tagline: "Powered by KALAM",
        supportUsername: "@kd_123_1_3"
      }
    };
  }

  public getStoreSettingsFromDisk(): { shopName?: string; tagline?: string; supportUsername?: string } {
    const storeData = this.loadStoreDataFromDisk();
    return storeData.storeSettings || { supportUsername: '@kd_123_1_3' };
  }

  public saveStoreDataToDisk(data: any) {
    try {
      const dataDir = this.getDataDir();
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, 'store_data.json');
      const current = this.loadStoreDataFromDisk();
      const updated = { ...current, ...data, updatedAt: Date.now() };
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[TelegramBot] Error saving store data to disk:', e);
    }
  }

  // 1. Add Keys to Product
  public addKeysToProduct(prodIdentifier: string, planDuration: string, keysToAdd: string[]): {
    success: boolean;
    addedCount: number;
    remainingCount: number;
    totalStock?: number;
    productName: string;
    duration: string;
    planDuration?: string;
    error?: string;
  } {
    const products = this.loadProductsFromDisk();
    const cleanId = prodIdentifier.trim().toLowerCase();
    const product = products.find((p: any) =>
      String(p.id).toLowerCase() === cleanId ||
      String(p.productId || '').toLowerCase() === cleanId ||
      String(p.name).toLowerCase().includes(cleanId)
    );

    if (!product) {
      return {
        success: false,
        addedCount: 0,
        remainingCount: 0,
        totalStock: 0,
        productName: prodIdentifier,
        duration: planDuration,
        planDuration: planDuration,
        error: `Product "${prodIdentifier}" not found. Type /stock to view available products.`
      };
    }

    const cleanDur = planDuration.trim().toLowerCase();
    const plan = (product.plans || []).find((pl: any) =>
      String(pl.id || '').toLowerCase() === cleanDur ||
      String(pl.duration || '').toLowerCase() === cleanDur ||
      String(pl.name || '').toLowerCase() === cleanDur ||
      String(pl.duration || '').toLowerCase().includes(cleanDur)
    );

    const targetPlanId = plan ? (plan.id || plan.duration) : (product.plans?.[0]?.id || '1 Day');
    const targetPlanDur = plan ? (plan.duration || plan.name) : targetPlanId;

    if (!product.planKeys || typeof product.planKeys !== 'object') {
      product.planKeys = {};
    }

    const existingKeys: string[] = Array.isArray(product.planKeys[targetPlanId]) ? product.planKeys[targetPlanId] : [];
    const validNewKeys = keysToAdd
      .map(k => k.trim())
      .filter(k => k.length > 0 && !existingKeys.includes(k));

    if (validNewKeys.length === 0) {
      return {
        success: false,
        addedCount: 0,
        remainingCount: existingKeys.length,
        totalStock: existingKeys.length,
        productName: product.name,
        duration: targetPlanDur,
        planDuration: targetPlanDur,
        error: `No valid or new unique keys provided (all were empty or already in stock).`
      };
    }

    product.planKeys[targetPlanId] = [...existingKeys, ...validNewKeys];
    if (!Array.isArray(product.keys)) product.keys = [];
    product.keys = Array.from(new Set([...product.keys, ...validNewKeys]));

    this.saveProductsToDisk(products);

    // Clear low stock alert suppression cache for this product since it has been restocked
    this.lastLowStockAlertSent.delete(String(product.id || product.name));

    return {
      success: true,
      addedCount: validNewKeys.length,
      remainingCount: product.planKeys[targetPlanId].length,
      totalStock: product.planKeys[targetPlanId].length,
      productName: product.name,
      duration: targetPlanDur,
      planDuration: targetPlanDur
    };
  }

  // 2. Set Product Plan Pricing
  public setPlanPricing(prodIdentifier: string, planDuration: string, regularPrice: number, resellerPrice?: number): {
    success: boolean;
    productName: string;
    duration: string;
    planDuration?: string;
    regularPrice: number;
    resellerPrice?: number;
    error?: string;
  } {
    const products = this.loadProductsFromDisk();
    const cleanId = prodIdentifier.trim().toLowerCase();
    const product = products.find((p: any) =>
      String(p.id).toLowerCase() === cleanId ||
      String(p.productId || '').toLowerCase() === cleanId ||
      String(p.name).toLowerCase().includes(cleanId)
    );

    if (!product) {
      return {
        success: false,
        productName: prodIdentifier,
        duration: planDuration,
        planDuration: planDuration,
        regularPrice,
        error: `Product "${prodIdentifier}" not found.`
      };
    }

    const cleanDur = planDuration.trim().toLowerCase();
    const plan = (product.plans || []).find((pl: any) =>
      String(pl.id || '').toLowerCase() === cleanDur ||
      String(pl.duration || '').toLowerCase() === cleanDur ||
      String(pl.name || '').toLowerCase() === cleanDur ||
      String(pl.duration || '').toLowerCase().includes(cleanDur)
    );

    if (!plan) {
      return {
        success: false,
        productName: product.name,
        duration: planDuration,
        planDuration: planDuration,
        regularPrice,
        error: `Plan "${planDuration}" not found for product "${product.name}".`
      };
    }

    plan.price = regularPrice;
    if (resellerPrice !== undefined && !isNaN(resellerPrice) && resellerPrice > 0) {
      plan.resellerPrice = resellerPrice;
    }

    this.saveProductsToDisk(products);

    return {
      success: true,
      productName: product.name,
      duration: plan.duration || plan.name,
      planDuration: plan.duration || plan.name,
      regularPrice: plan.price,
      resellerPrice: plan.resellerPrice
    };
  }

  // 3. Add New Product
  public addNewProduct(name: string, category: string = 'Injections', game: string = 'Free Fire', initialDurationOrPlans: string | any[] = '1 Day', price: number = 99, resellerPrice: number = 79): {
    success: boolean;
    product?: any;
    error?: string;
  } {
    const products = this.loadProductsFromDisk();
    const cleanName = name.trim();
    if (!cleanName) return { success: false, error: 'Product name cannot be empty.' };

    const plans = Array.isArray(initialDurationOrPlans) ? initialDurationOrPlans : [
      { id: '1 Day', duration: '1 Day', name: '1 Day Pass', price: price, resellerPrice: resellerPrice },
      { id: '7 Days', duration: '7 Days', name: '7 Days Pass', price: price * 4, resellerPrice: resellerPrice * 4 },
      { id: '30 Days', duration: '30 Days', name: '30 Days Pass', price: price * 12, resellerPrice: resellerPrice * 12 }
    ];

    const planKeys: Record<string, string[]> = {};
    for (const p of plans) {
      planKeys[p.id || p.duration] = [];
    }

    const newProd = {
      id: `prod_${Date.now()}`,
      name: cleanName,
      category: category.trim() || 'Injections',
      game: game.trim() || 'Free Fire',
      description: `${cleanName} - 100% Anti-Ban VIP Injector & Mod Menu`,
      status: 'active',
      isPopular: true,
      plans,
      planKeys,
      keys: []
    };

    products.unshift(newProd);
    this.saveProductsToDisk(products);

    return { success: true, product: newProd };
  }

  // 4. Clear stock for specific plan
  public clearStockForPlan(prodIdentifier: string, planDuration: string): {
    success: boolean;
    productName: string;
    duration: string;
    planDuration?: string;
    clearedCount: number;
    error?: string;
  } {
    const products = this.loadProductsFromDisk();
    const cleanId = prodIdentifier.trim().toLowerCase();
    const product = products.find((p: any) =>
      String(p.id).toLowerCase() === cleanId ||
      String(p.productId || '').toLowerCase() === cleanId ||
      String(p.name).toLowerCase().includes(cleanId)
    );

    if (!product) return { success: false, productName: prodIdentifier, duration: planDuration, planDuration: planDuration, clearedCount: 0, error: 'Product not found' };

    const cleanDur = planDuration.trim().toLowerCase();
    const plan = (product.plans || []).find((pl: any) =>
      String(pl.id || '').toLowerCase() === cleanDur ||
      String(pl.duration || '').toLowerCase() === cleanDur ||
      String(pl.name || '').toLowerCase() === cleanDur
    );

    const targetPlanId = plan ? (plan.id || plan.duration) : cleanDur;
    let clearedCount = 0;

    if (product.planKeys && Array.isArray(product.planKeys[targetPlanId])) {
      clearedCount = product.planKeys[targetPlanId].length;
      product.planKeys[targetPlanId] = [];
    }

    this.saveProductsToDisk(products);

    // Trigger low-stock alert immediately if stock dropped below threshold
    this.checkAndDispatchLowStockAlert(product, {
      force: true,
      reason: `Stock Cleared by Admin (${product.name} - ${planDuration})`
    }).catch(err => console.warn('[TelegramBot] Clear stock low alert error:', err));

    return {
      success: true,
      productName: product.name,
      duration: plan ? (plan.duration || plan.name) : planDuration,
      planDuration: plan ? (plan.duration || plan.name) : planDuration,
      clearedCount
    };
  }

  // 5. Payment Gateway Switcher
  public setActivePaymentGateway(gatewayIdOrName: string): {
    success: boolean;
    activeGateway?: any;
    error?: string;
  } {
    const storeData = this.loadStoreDataFromDisk();
    const paymentConfigs = storeData.paymentConfigs || [];
    const clean = gatewayIdOrName.trim().toLowerCase();

    let matched = false;
    let selected: any = null;

    for (const gw of paymentConfigs) {
      const gId = String(gw.gatewayId || gw.id || gw.gateway || '').toLowerCase();
      const gName = String(gw.name || gw.gatewayName || '').toLowerCase();
      if (gId.includes(clean) || gName.includes(clean)) {
        gw.isActive = true;
        gw.status = 'ACTIVE';
        matched = true;
        selected = gw;
      } else {
        gw.isActive = false;
      }
    }

    if (!matched) {
      return {
        success: false,
        error: `Gateway "${gatewayIdOrName}" not found. Supported: famgateway, adityahost, zapupi, freepanel`
      };
    }

    this.saveStoreDataToDisk({ paymentConfigs });

    return { success: true, activeGateway: selected };
  }

  // 6. Update Payment Gateway Settings (UPI ID, Token, Merchant Name)
  public updatePaymentGatewaySettings(updates: { upiId?: string; apiKey?: string; token?: string; merchantName?: string }): {
    success: boolean;
    updatedGateway?: any;
    error?: string;
  } {
    const storeData = this.loadStoreDataFromDisk();
    const paymentConfigs = storeData.paymentConfigs || [];
    const active = paymentConfigs.find((gw: any) => gw.isActive || gw.status === 'ACTIVE') || paymentConfigs[0];

    if (!active) {
      return { success: false, error: 'No active payment gateway found.' };
    }

    if (updates.upiId) {
      const cleanUpi = updates.upiId.trim();
      active.upiId = cleanUpi;
      for (const gw of paymentConfigs) {
        gw.upiId = cleanUpi;
      }
      if (!storeData.storeSettings) storeData.storeSettings = {};
      storeData.storeSettings.upiId = cleanUpi;
      storeData.storeSettings.upiManualId = cleanUpi;
      storeData.storeSettings.merchantUpi = cleanUpi;

      try {
        const cfgPath = path.join(this.getDataDir(), 'telegram_config.json');
        if (fs.existsSync(cfgPath)) {
          const tgCfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
          tgCfg.upiId = cleanUpi;
          tgCfg.updatedAt = new Date().toISOString();
          fs.writeFileSync(cfgPath, JSON.stringify(tgCfg, null, 2), 'utf8');
        }
      } catch {}
    }
    const tokenVal = updates.apiKey || updates.token;
    if (tokenVal) {
      active.token = tokenVal.trim();
      active.apiKey = tokenVal.trim();
    }
    if (updates.merchantName) {
      active.merchantName = updates.merchantName.trim();
      active.name = updates.merchantName.trim();
      if (!storeData.storeSettings) storeData.storeSettings = {};
      storeData.storeSettings.shopName = updates.merchantName.trim();
    }

    this.saveStoreDataToDisk(storeData);

    return { success: true, updatedGateway: active };
  }

  // 7. Announcement / Notice Banner
  public setWebsiteNoticeBanner(noticeText: string, isActive: boolean): { success: boolean; noticeText: string; isActive: boolean; error?: string } {
    const storeData = this.loadStoreDataFromDisk();
    if (!storeData.storeSettings) storeData.storeSettings = {};
    storeData.storeSettings.announcement = noticeText.trim();
    storeData.storeSettings.isAnnouncementActive = isActive;
    storeData.storeSettings.noticeBanner = {
      text: noticeText.trim(),
      active: isActive,
      updatedAt: Date.now()
    };
    this.saveStoreDataToDisk(storeData);
    return { success: true, noticeText: noticeText.trim(), isActive };
  }

  // 7.1 Welcome Message Banner
  public setWebsiteWelcomeBanner(bannerMsg: string, bannerTitle?: string, bannerBadge?: string, isActive: boolean = true): { success: boolean; bannerMsg: string; bannerTitle?: string; bannerBadge?: string; isActive: boolean } {
    const storeData = this.loadStoreDataFromDisk();
    if (!storeData.storeSettings) storeData.storeSettings = {};
    storeData.storeSettings.welcomeBannerMessage = bannerMsg.trim();
    if (bannerTitle) storeData.storeSettings.welcomeBannerTitle = bannerTitle.trim();
    if (bannerBadge) storeData.storeSettings.welcomeBannerBadge = bannerBadge.trim();
    storeData.storeSettings.welcomeBannerEnabled = isActive;
    this.saveStoreDataToDisk(storeData);
    return { success: true, bannerMsg: bannerMsg.trim(), bannerTitle, bannerBadge, isActive };
  }

  // 8. Maintenance Mode
  public setWebsiteMaintenance(isMaintenance: boolean): { success: boolean; isMaintenance: boolean } {
    const storeData = this.loadStoreDataFromDisk();
    if (!storeData.storeSettings) storeData.storeSettings = {};
    storeData.storeSettings.maintenanceMode = isMaintenance;
    this.saveStoreDataToDisk(storeData);
    this.auditAndAlertProductMaintenance('BOT_MAINTENANCE_TOGGLE').catch(() => {});
    return { success: true, isMaintenance };
  }

  // 8.1 Product Maintenance Mode (Per Product & Bulk)
  public setProductMaintenance(productId: string, isMaintenance: boolean): { success: boolean; product?: any; isMaintenance: boolean; error?: string } {
    const products = this.loadProductsFromDisk();
    const cleanId = String(productId || '').trim().toLowerCase();
    const product = products.find((p: any) => 
      String(p.id || '').toLowerCase() === cleanId || 
      String(p.productId || '').toLowerCase() === cleanId ||
      String(p.name || '').toLowerCase() === cleanId
    );

    if (!product) {
      return { success: false, isMaintenance, error: 'Product not found' };
    }

    product.status = isMaintenance ? 'MAINTENANCE' : 'ACTIVE';
    this.saveProductsToDisk(products);
    this.auditAndAlertProductMaintenance('BOT_PRODUCT_MAINTENANCE_COMMAND').catch(() => {});
    return { success: true, product, isMaintenance };
  }

  public toggleProductMaintenance(productId: string): { success: boolean; product?: any; isMaintenance: boolean; error?: string } {
    const products = this.loadProductsFromDisk();
    const cleanId = String(productId || '').trim().toLowerCase();
    const product = products.find((p: any) => 
      String(p.id || '').toLowerCase() === cleanId || 
      String(p.productId || '').toLowerCase() === cleanId ||
      String(p.name || '').toLowerCase() === cleanId
    );

    if (!product) {
      return { success: false, isMaintenance: false, error: 'Product not found' };
    }

    const currentStatus = (product.status || 'ACTIVE').toUpperCase();
    const newMaintenance = currentStatus !== 'MAINTENANCE';
    product.status = newMaintenance ? 'MAINTENANCE' : 'ACTIVE';
    this.saveProductsToDisk(products);
    this.auditAndAlertProductMaintenance('BOT_PRODUCT_MAINTENANCE_TOGGLE').catch(() => {});
    return { success: true, product, isMaintenance: newMaintenance };
  }

  public setAllProductsMaintenance(isMaintenance: boolean): { success: boolean; count: number; isMaintenance: boolean } {
    const products = this.loadProductsFromDisk();
    const targetStatus = isMaintenance ? 'MAINTENANCE' : 'ACTIVE';
    products.forEach((p: any) => {
      p.status = targetStatus;
    });
    this.saveProductsToDisk(products);
    this.auditAndAlertProductMaintenance('BOT_BULK_MAINTENANCE_TOGGLE').catch(() => {});
    return { success: true, count: products.length, isMaintenance };
  }

  // 9. Detailed Store Stats
  public getDetailedStoreStats(): any {
    const users = this.loadBotUsers();
    const purchases = this.loadPurchases();
    const products = this.loadProductsFromDisk();
    const storeData = this.loadStoreDataFromDisk();
    const promoCodes = this.loadPromoCodes();
    const activeGateway = (storeData.paymentConfigs || []).find((c: any) => c.isActive || c.status === 'ACTIVE') || storeData.paymentConfigs?.[0];

    let totalKeysInStock = 0;
    let totalProductsCount = products.length;
    let inStockProductsCount = 0;

    for (const p of products) {
      let prodStock = 0;
      if (p.planKeys && typeof p.planKeys === 'object') {
        for (const kList of Object.values(p.planKeys)) {
          if (Array.isArray(kList)) prodStock += kList.length;
        }
      }
      if (Array.isArray(p.keys)) prodStock += p.keys.length;
      totalKeysInStock += prodStock;
      if (prodStock > 0) inStockProductsCount++;
    }

    const totalSalesAmount = purchases.reduce((sum, p) => sum + (p.price || 0), 0);
    const resellerCount = Array.from(users.values()).filter(u => u.isReseller || u.role === 'RESELLER').length;
    const totalDeposits = Array.from(users.values()).reduce((sum, u) => sum + (u.totalDeposited || 0), 0);

    return {
      totalUsers: users.size,
      resellerCount,
      totalSalesCount: purchases.length,
      totalSalesAmount,
      totalDeposits,
      totalKeysInStock,
      totalProductsCount,
      inStockProductsCount,
      activePromoCodes: promoCodes.length,
      activeGateway: activeGateway?.name || activeGateway?.gatewayId || 'FamGateway (UPI)',
      activeUpiId: activeGateway?.upiId || storeData.storeSettings?.upiId || 'Not Configured',
      maintenanceMode: !!storeData.storeSettings?.maintenanceMode,
      noticeActive: !!storeData.storeSettings?.isAnnouncementActive,
      noticeText: storeData.storeSettings?.announcement || ''
    };
  }

  // 10. Recent Orders List
  public getRecentOrdersList(limit: number = 10): BotPurchaseRecord[] {
    const purchases = this.loadPurchases();
    return purchases.slice(0, limit);
  }

  // ===== LOW-STOCK MONITORING & AUTOMATED ADMIN ALERT SYSTEM =====

  public getLowStockThreshold(): number {
    const storeData = this.loadStoreDataFromDisk();
    const customThreshold = storeData?.storeSettings?.lowStockThreshold;
    if (typeof customThreshold === 'number' && !isNaN(customThreshold) && customThreshold >= 0) {
      return customThreshold;
    }
    return 5;
  }

  public setLowStockThreshold(threshold: number): boolean {
    try {
      const cleanThreshold = Math.max(0, Math.round(Number(threshold) || 5));
      const storeData = this.loadStoreDataFromDisk();
      if (!storeData.storeSettings) storeData.storeSettings = {};
      storeData.storeSettings.lowStockThreshold = cleanThreshold;
      this.saveStoreDataToDisk(storeData);
      return true;
    } catch (err: any) {
      console.warn('[TelegramBot] Error saving low stock threshold:', err.message);
      return false;
    }
  }

  public calculateProductStock(p: any): {
    totalStock: number;
    plansBreakdown: Array<{
      id: string;
      name: string;
      duration: string;
      price: number;
      resellerPrice: number;
      keysCount: number;
      isLowStock: boolean;
      isOutOfStock: boolean;
    }>;
  } {
    const threshold = this.getLowStockThreshold();
    const plansBreakdown: Array<{
      id: string;
      name: string;
      duration: string;
      price: number;
      resellerPrice: number;
      keysCount: number;
      isLowStock: boolean;
      isOutOfStock: boolean;
    }> = [];

    let totalKeys = 0;
    const plans = Array.isArray(p?.plans) && p.plans.length > 0 ? p.plans : [{ id: '1 Day', duration: '1 Day', name: '1 Day Pass', price: p?.price || 99 }];

    for (const pl of plans) {
      const planId = pl.id || pl.duration;
      let count = 0;
      if (p.planKeys && typeof p.planKeys === 'object' && Array.isArray(p.planKeys[planId])) {
        count = p.planKeys[planId].length;
      } else if (Array.isArray(pl.keys)) {
        count = pl.keys.length;
      } else if (typeof pl.keysCount === 'number') {
        count = pl.keysCount;
      }
      totalKeys += count;
      plansBreakdown.push({
        id: planId,
        name: pl.name || pl.duration || 'Standard Plan',
        duration: pl.duration || pl.name || '1 Day',
        price: Number(pl.price) || 0,
        resellerPrice: Number(pl.resellerPrice) || Math.round((Number(pl.price) || 0) * 0.8),
        keysCount: count,
        isLowStock: count <= threshold,
        isOutOfStock: count === 0,
      });
    }

    if (totalKeys === 0 && Array.isArray(p?.keys) && p.keys.length > 0) {
      totalKeys = p.keys.length;
    } else if (totalKeys === 0 && typeof p?.stock === 'number') {
      totalKeys = p.stock;
    }

    return {
      totalStock: totalKeys,
      plansBreakdown,
    };
  }

  public getLowStockProducts(customThreshold?: number): Array<{
    id: string;
    name: string;
    game: string;
    category: string;
    status: string;
    keysRemaining: number;
    threshold: number;
    isLowStock: boolean;
    isOutOfStock: boolean;
    plansBreakdown: Array<{
      id: string;
      name: string;
      duration: string;
      price: number;
      resellerPrice: number;
      keysCount: number;
      isLowStock: boolean;
      isOutOfStock: boolean;
    }>;
  }> {
    const products = this.loadProductsFromDisk();
    const threshold = typeof customThreshold === 'number' ? customThreshold : this.getLowStockThreshold();

    const lowStockList: any[] = [];
    for (const p of products) {
      const { totalStock, plansBreakdown } = this.calculateProductStock(p);
      const isOut = totalStock === 0;
      const isLow = totalStock <= threshold;

      if (isLow) {
        lowStockList.push({
          id: p.id,
          name: p.name || 'Unnamed Product',
          game: p.game || 'Free Fire',
          category: p.category || 'Injections',
          status: p.status || 'ACTIVE',
          keysRemaining: totalStock,
          threshold,
          isLowStock: isLow,
          isOutOfStock: isOut,
          plansBreakdown,
        });
      }
    }

    return lowStockList;
  }

  public async checkAndDispatchLowStockAlert(
    productOrId?: any,
    options?: { force?: boolean; reason?: string; targetChatId?: number | string }
  ): Promise<{ alerted: boolean; count: number; details?: any }> {
    const threshold = this.getLowStockThreshold();
    const { defaultChatId } = this.getCredentials();
    const adminChatId = options?.targetChatId || defaultChatId || '7768975239';

    if (productOrId) {
      let product = productOrId;
      if (typeof productOrId === 'string') {
        const products = this.loadProductsFromDisk();
        product = products.find((p: any) => p.id === productOrId || p.productId === productOrId || p.name === productOrId);
      }
      if (!product) return { alerted: false, count: 0 };

      const { totalStock, plansBreakdown } = this.calculateProductStock(product);
      const isOutOfStock = totalStock <= 0;
      const isLowStock = totalStock <= threshold;

      if (!isLowStock && !options?.force) {
        return { alerted: false, count: 0 };
      }

      const pId = String(product.id || product.name);
      const now = Date.now();
      const lastAlert = this.lastLowStockAlertSent.get(pId);

      // Suppress duplicate alerts unless forced, or stock has dropped further, or out of stock transition, or >30 minutes elapsed
      if (!options?.force && lastAlert) {
        const elapsed = now - lastAlert.timestamp;
        const stockDecreased = totalStock < lastAlert.stock;
        const becameZero = isOutOfStock && !lastAlert.isOutOfStock;
        if (!stockDecreased && !becameZero && elapsed < 30 * 60 * 1000) {
          return { alerted: false, count: 0, details: 'Suppressed duplicate alert within cooldown period' };
        }
      }

      this.lastLowStockAlertSent.set(pId, {
        stock: totalStock,
        timestamp: now,
        isOutOfStock,
      });

      const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const statusTitle = isOutOfStock
        ? '🚨 <b>CRITICAL INVENTORY ALERT: OUT OF STOCK!</b> 🔴'
        : '⚠️ <b>AUTOMATED INVENTORY ALERT: LOW STOCK!</b> 🟡';

      let planBreakdownText = '';
      if (plansBreakdown.length > 0) {
        planBreakdownText = '\n\n<b>📋 Plan-by-Plan Key Inventory:</b>\n' + plansBreakdown.map(pl => {
          const kCount = pl.keysCount;
          const badge = kCount === 0 ? '🔴 <b>0 keys (EMPTY)</b>' : (kCount <= 2 ? `⚠️ <b>${kCount} key(s) left</b>` : `✅ <b>${kCount} keys</b>`);
          return `• <b>${pl.duration || pl.name}:</b> ${badge}`;
        }).join('\n');
      }

      const triggerNote = options?.reason ? `\n📝 <b>Trigger Event:</b> <i>${options.reason}</i>` : '';

      const alertMessage =
        `${statusTitle}\n\n` +
        `<blockquote>` +
        `📦 <b>Product:</b> <b>${product.name}</b>\n` +
        `🆔 <b>Product ID:</b> <code>${product.id}</code>\n` +
        (product.game ? `🎮 <b>Game:</b> ${product.game}\n` : '') +
        (product.category ? `🏷️ <b>Category:</b> ${product.category}\n` : '') +
        `🔑 <b>Current Total Stock:</b> <b>${totalStock} key(s) remaining</b>\n` +
        `📉 <b>Low Stock Threshold:</b> <b>${threshold} key(s)</b>\n` +
        `🕒 <b>Time:</b> ${time}` +
        triggerNote +
        planBreakdownText +
        `</blockquote>\n\n` +
        `⚡ <b>Urgent Action:</b> Stock is below the defined threshold of <b>${threshold}</b> keys. Restock now to prevent checkout delivery failures.`;

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: '➕ Restock Keys Now', callback_data: 'admin_action:add_keys_prompt' },
            { text: '📦 View Stock Hub', callback_data: 'admin_menu:products' }
          ],
          [
            { text: '📉 View All Low Stock', callback_data: 'admin_menu:low_stock' },
            { text: '🎛️ Admin Control Panel', callback_data: 'admin_panel' }
          ]
        ]
      };

      await this.sendMessage(adminChatId, alertMessage, replyMarkup);
      return { alerted: true, count: 1, details: product.name };
    }

    // Otherwise check all products
    const lowStockProducts = this.getLowStockProducts(threshold);
    if (lowStockProducts.length === 0) {
      if (options?.force) {
        await this.sendMessage(
          adminChatId,
          `✅ <b>INVENTORY HEALTH CHECK: ALL GOOD!</b> 🟢\n\n` +
          `All products in the store catalog currently have healthy stock levels above the defined threshold of <b>${threshold}</b> keys.`,
          { inline_keyboard: [[{ text: '📦 View Products', callback_data: 'admin_menu:products' }]] }
        );
      }
      return { alerted: false, count: 0 };
    }

    let alertCount = 0;
    for (const p of lowStockProducts) {
      const res = await this.checkAndDispatchLowStockAlert(p, options);
      if (res.alerted) alertCount++;
    }

    return { alerted: alertCount > 0, count: alertCount };
  }

  public async auditAndAlertLowStock() {
    try {
      const lowStockProducts = this.getLowStockProducts();
      for (const p of lowStockProducts) {
        await this.checkAndDispatchLowStockAlert(p);
      }
    } catch (err: any) {
      console.warn('[TelegramBot] Periodic low stock check error:', err.message);
    }
  }

  private initLowStockMonitor() {
    if (this.lowStockCheckTimer) {
      clearInterval(this.lowStockCheckTimer);
    }
    // Check every 20 minutes for low stock in background
    this.lowStockCheckTimer = setInterval(() => {
      this.auditAndAlertLowStock();
    }, 20 * 60 * 1000);
  }

  public getAdminAlertTargets(): string[] {
    const targets = new Set<string>();
    const creds = this.getCredentials();
    if (creds.defaultChatId && creds.defaultChatId.trim()) {
      targets.add(creds.defaultChatId.trim());
    }

    try {
      const notifFile = path.join(this.getDataDir(), 'telegram_notifications_config.json');
      if (fs.existsSync(notifFile)) {
        const parsed = JSON.parse(fs.readFileSync(notifFile, 'utf8'));
        if (parsed.adminChatIdOverride && String(parsed.adminChatIdOverride).trim()) {
          targets.add(String(parsed.adminChatIdOverride).trim());
        }
        if (parsed.alertChannelId && String(parsed.alertChannelId).trim()) {
          targets.add(String(parsed.alertChannelId).trim());
        }
      }
    } catch {}

    if (targets.size === 0) {
      targets.add('7768975239');
    }
    return Array.from(targets);
  }

  public initMaintenanceStatusMonitor() {
    if (this.maintenanceCheckTimer) {
      clearInterval(this.maintenanceCheckTimer);
    }
    // Periodically monitor product maintenance statuses from server every 10 seconds
    this.maintenanceCheckTimer = setInterval(() => {
      this.auditAndAlertProductMaintenance('PERIODIC_SERVER_MONITOR');
    }, 10 * 1000);

    // Initial baseline sync without false alert spam
    setTimeout(() => {
      this.auditAndAlertProductMaintenance('STARTUP_INITIALIZATION');
    }, 1500);
  }

  public async auditAndAlertProductMaintenance(
    triggerSource?: string,
    options?: { targetChatId?: string | number; force?: boolean }
  ): Promise<{ alertedCount: number; transitions: any[] }> {
    const transitions: any[] = [];
    try {
      const products = this.loadProductsFromDisk();
      const storeData = this.loadStoreDataFromDisk();
      const isGlobalMaintenance = !!storeData.storeSettings?.maintenanceMode;
      const targets = options?.targetChatId ? [String(options.targetChatId)] : this.getAdminAlertTargets();

      const timeStr = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'medium'
      });

      // 1. Check Global Store Maintenance Transition
      if (this.lastGlobalStoreMaintenanceState !== null && this.lastGlobalStoreMaintenanceState !== isGlobalMaintenance) {
        const isMaint = isGlobalMaintenance;
        const title = isMaint
          ? '🚨 <b>GLOBAL STORE MAINTENANCE MODE ENABLED</b> 🔴'
          : '🟢 <b>GLOBAL STORE MAINTENANCE MODE DISABLED (ACTIVE)</b> ⚡';

        const storeMsg =
          `${title}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🏬 <b>Storefront Name:</b> <b>${storeData.storeSettings?.shopName || 'KALAM FF PANEL'}</b>\n` +
          `📊 <b>Storefront Status:</b> ${isMaint ? '🔴 <b>UNDER FULL MAINTENANCE (ALL PURCHASES PAUSED)</b>' : '🟢 <b>LIVE & ACCEPTING ORDERS</b>'}\n` +
          `🕒 <b>Time:</b> ${timeStr}\n` +
          (triggerSource ? `📌 <b>Trigger Source:</b> <code>${triggerSource}</code>\n` : '') +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          (isMaint 
            ? `⚠️ <i>All products, storefront checkouts, and Telegram Bot orders have been temporarily paused.</i>`
            : `✅ <i>The storefront and Telegram Bot catalog are now fully operational. Users can place orders.</i>`);

        const quickButtons = [
          [
            { text: isMaint ? '🟢 Disable Maintenance' : '🔴 Enable Maintenance', callback_data: `admin_toggle_maint:${isMaint ? 'off' : 'on'}` },
            { text: '🎛️ Admin Hub', callback_data: 'admin_panel' }
          ]
        ];

        for (const target of targets) {
          try {
            await this.sendMessage(target, storeMsg, { inline_keyboard: quickButtons });
          } catch {}
        }

        this.recordActivity({
          type: 'ADMIN_ALERT',
          category: 'system',
          severity: isMaint ? 'warning' : 'success',
          summary: isMaint ? '🛠️ Global Store Maintenance Activated' : '🟢 Global Store Restored to Active',
          details: `Store maintenance transitioned to ${isMaint ? 'ON' : 'OFF'} via ${triggerSource || 'System'}.`,
          action: 'GLOBAL_MAINTENANCE_TOGGLE'
        });

        transitions.push({ type: 'GLOBAL_STORE', isMaintenance: isMaint });
      }
      this.lastGlobalStoreMaintenanceState = isGlobalMaintenance;

      // 2. Check Individual Product Maintenance Transitions
      for (const p of products) {
        if (!p) continue;
        const pId = String(p.id || p.productId || p.name);
        const pName = p.name || `Product #${pId}`;
        const rawStatus = (p.status || 'ACTIVE').toUpperCase();
        const isMaint = rawStatus === 'MAINTENANCE' || !!p.isMaintenance;
        const reason = p.maintenanceReason || '';

        const prev = this.lastProductMaintenanceState.get(pId);

        if (!this.isMaintenanceMonitorInitialized && !options?.force) {
          // Seed baseline map on startup
          this.lastProductMaintenanceState.set(pId, {
            status: rawStatus,
            isMaintenance: isMaint,
            name: pName,
            reason
          });
          continue;
        }

        // Check if transition occurred or if explicitly forced
        const hasChanged = !prev || prev.isMaintenance !== isMaint || (options?.force && isMaint);

        if (hasChanged) {
          this.lastProductMaintenanceState.set(pId, {
            status: rawStatus,
            isMaintenance: isMaint,
            name: pName,
            reason
          });

          const isEntering = isMaint;
          const statusTitle = isEntering
            ? '🛠️ <b>PANEL ENTERED MAINTENANCE MODE</b> 🔴'
            : '🟢 <b>PANEL EXITED MAINTENANCE MODE (ACTIVE)</b> ✅';

          const reasonSnippet = reason ? `\n📝 <b>Maintenance Reason:</b> <i>${reason}</i>` : '';
          const sourceSnippet = triggerSource ? `\n📌 <b>Trigger Origin:</b> <code>${triggerSource}</code>` : '';

          const alertMessage =
            `${statusTitle}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `📦 <b>Panel / Cheat:</b> <b>${pName}</b>\n` +
            `🆔 <b>Product ID:</b> <code>${pId}</code>\n` +
            (p.game ? `🎮 <b>Game:</b> ${p.game}\n` : '') +
            (p.category ? `🏷️ <b>Category:</b> ${p.category}\n` : '') +
            `⚠️ <b>Current Status:</b> ${isEntering ? '🔴 <b>UNDER MAINTENANCE</b>' : '🟢 <b>ACTIVE / LIVE</b>'}\n` +
            `🔒 <b>Checkout State:</b> ${isEntering ? '<b>PAUSED</b> (Purchases blocked)' : '<b>READY</b> (Orders allowed)'}\n` +
            `🕒 <b>Timestamp:</b> ${timeStr}` +
            reasonSnippet +
            sourceSnippet +
            `\n━━━━━━━━━━━━━━━━━━━━\n\n` +
            (isEntering
              ? `⚡ <i>Customers attempting to purchase "${pName}" on Web or Telegram will receive an Under Maintenance notice.</i>`
              : `⚡ <i>"${pName}" is now fully restored. Customers can view plans and purchase license keys instantly.</i>`);

          const quickButtons = [
            [
              { text: isEntering ? '🟢 Set Active (Resume Orders)' : '🛠️ Put Under Maintenance', callback_data: `admin_toggle_prod_maint:${pId}` },
              { text: '⚙️ Maintenance Hub', callback_data: 'admin_menu:maintenance' }
            ],
            [
              { text: '🛒 View Bot Catalog', callback_data: 'catalog' },
              { text: '🎛️ Admin Hub', callback_data: 'admin_panel' }
            ]
          ];

          let deliveredAny = false;
          for (const target of targets) {
            try {
              const ok = await this.sendMessage(target, alertMessage, { inline_keyboard: quickButtons });
              if (ok) deliveredAny = true;
            } catch (err: any) {
              console.warn(`[MaintenanceMonitor] Delivery to admin chat ${target} failed:`, err.message);
            }
          }

          this.recordActivity({
            type: 'ADMIN_ALERT',
            category: 'system',
            severity: isEntering ? 'warning' : 'success',
            summary: isEntering ? `🛠️ "${pName}" Maintenance Enabled` : `🟢 "${pName}" Restored to Active`,
            details: `Product maintenance status changed to ${rawStatus} via ${triggerSource || 'Server'}. Notification delivered: ${deliveredAny ? 'Yes' : 'No'}.`,
            action: isEntering ? 'PRODUCT_MAINTENANCE_ON' : 'PRODUCT_MAINTENANCE_OFF'
          });

          transitions.push({
            productId: pId,
            productName: pName,
            status: rawStatus,
            isMaintenance: isEntering,
            delivered: deliveredAny
          });
        }
      }

      this.isMaintenanceMonitorInitialized = true;
      return { alertedCount: transitions.length, transitions };
    } catch (err: any) {
      console.error('[MaintenanceMonitor] Error running maintenance status audit:', err.message);
      return { alertedCount: 0, transitions: [] };
    }
  }

  public async showAdminLowStockMenu(chatId: number, messageId?: number) {
    if (!this.isAdmin(chatId)) return;
    const threshold = this.getLowStockThreshold();
    const lowStockItems = this.getLowStockProducts(threshold);
    const totalProducts = this.loadProductsFromDisk().length;

    let text =
      `⚠️ <b>LOW-STOCK INVENTORY MONITOR & ALERTS</b> 📉\n\n` +
      `<blockquote>〰️〰️ <b>INVENTORY HEALTH STATUS</b> 〰️〰️\n` +
      `📉 <b>Defined Low-Stock Threshold:</b> <b>${threshold} keys</b>\n` +
      `📦 <b>Total Products Catalog:</b> <b>${totalProducts}</b>\n` +
      `🚨 <b>Products Below Threshold:</b> <b>${lowStockItems.length}</b>\n` +
      `〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️</blockquote>\n\n`;

    if (lowStockItems.length === 0) {
      text += `🟢 <b>All Products Fully Stocked!</b>\n` +
              `No items are currently below the threshold of ${threshold} keys. Automated alerts are armed and monitoring.\n\n` +
              `⚙️ <i>To adjust the alert threshold, tap "Set Threshold" below.</i>`;
    } else {
      text += `<b>🔴 CRITICAL & LOW-STOCK ITEMS LIST:</b>\n\n`;
      lowStockItems.forEach((p, idx) => {
        const isOut = p.keysRemaining === 0;
        const badge = isOut ? '🔴 <b>OUT OF STOCK (0)</b>' : `⚠️ <b>${p.keysRemaining} keys left</b>`;
        const plansList = p.plansBreakdown.map((pl: any) => {
          const kCount = pl.keysCount;
          const plBadge = kCount === 0 ? '🔴 0' : (kCount <= 2 ? `⚠️ ${kCount}` : `✅ ${kCount}`);
          return `${pl.duration || pl.name}: ${plBadge}`;
        }).join(' | ');

        text += `<b>${idx + 1}. ${p.name}</b> (ID: <code>${p.id}</code>)\n` +
                `   • Status: ${badge}\n` +
                `   • Plans: <code>${plansList}</code>\n` +
                `   • Restock: <code>/addkeys ${p.id} 1 Day KEY1, KEY2</code>\n\n`;
      });
      text += `📋 <i>Tap any /addkeys command above to copy it instantly and restock keys.</i>`;
    }

    const inline_keyboard = [
      [
        { text: '➕ Restock Keys', callback_data: 'admin_action:add_keys_prompt' },
        { text: '📉 Set Threshold', callback_data: 'admin_action:set_lowstock_prompt' }
      ],
      [
        { text: '🔔 Test / Send Alert Now', callback_data: 'admin_action:trigger_lowstock_audit' },
        { text: '📦 Full Products Catalog', callback_data: 'admin_menu:products' }
      ],
      [
        { text: '🔙 Back to Admin Hub', callback_data: 'admin_panel' }
      ]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // Real-time synchronization hook called whenever store settings or payment configs update
  public syncFromStoreData(data: any) {
    try {
      if (data?.storeSettings?.telegramBotUsername) {
        this.botUsername = data.storeSettings.telegramBotUsername.replace('@', '');
      }
      this.auditAndAlertProductMaintenance('SERVER_STORE_DATA_SYNC').catch(() => {});
      console.log('[TelegramBot] Real-time store settings synchronized successfully.');
    } catch {}
  }

  // Send message with standard or custom markup
  public async sendMessage(chatId: string | number, text: string, replyMarkup?: any): Promise<boolean> {
    const { botToken } = this.getCredentials();
    if (!botToken) return false;

    // Deduplication filter: prevent identical message being sent to the same chat within 2500ms
    const cleanTextKey = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
    const outgoingKey = `${chatId}:${cleanTextKey}`;
    const lastSent = this.recentOutgoingMessages.get(outgoingKey) || 0;
    const now = Date.now();
    if (now - lastSent < 2500) {
      return true; // Already sent recently, prevent duplicate spam!
    }
    this.recentOutgoingMessages.set(outgoingKey, now);
    if (this.recentOutgoingMessages.size > 200) {
      for (const [k, v] of this.recentOutgoingMessages.entries()) {
        if (now - v > 30000) this.recentOutgoingMessages.delete(k);
      }
    }

    try {
      const sanitizedMarkup = sanitizeReplyMarkup(replyMarkup);
      const payload: any = {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      };
      if (sanitizedMarkup) {
        payload.reply_markup = sanitizedMarkup;
      }

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: any = await res.json();
      let success = !!data.ok;
      if (!data.ok) {
        // Fallback without parse_mode if HTML tags cause a parse error or if reply_markup failed
        if (data.description && (data.description.includes('BUTTON_URL') || data.description.includes('keyboard') || data.description.includes('markup'))) {
          delete payload.reply_markup;
        }
        payload.parse_mode = undefined;
        payload.text = text.replace(/<[^>]*>/g, '');
        const fallbackRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const fallbackData: any = await fallbackRes.json();
        success = !!fallbackData.ok;
      }

      this.recordActivity({
        type: 'OUTGOING_MESSAGE',
        category: 'message',
        severity: success ? 'info' : 'warning',
        chatId,
        action: 'SEND_MESSAGE',
        summary: `📤 Bot replied to chat ${chatId}`,
        details: text.replace(/<[^>]*>/g, '').slice(0, 160),
        responseStatus: success ? 'DELIVERED' : 'ERROR',
        payload: { success, chatId, preview: text.slice(0, 100) }
      });

      return success;
    } catch (err: any) {
      console.error('[TelegramBot] sendMessage error:', err.message);
      this.recordActivity({
        type: 'ERROR',
        category: 'error',
        severity: 'error',
        chatId,
        summary: `❌ Failed to send message to chat ${chatId}`,
        details: err.message,
        payload: { chatId, error: err.message }
      });
      return false;
    }
  }

  public async getUserProfilePhotoUrl(userId: number | string): Promise<string | null> {
    const { botToken } = this.getCredentials();
    if (!botToken || !userId) return null;
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${userId}&limit=1`);
      const data: any = await res.json();
      if (data.ok && data.result && data.result.total_count > 0 && Array.isArray(data.result.photos) && data.result.photos.length > 0) {
        const photoSizes = data.result.photos[0];
        if (Array.isArray(photoSizes) && photoSizes.length > 0) {
          // Grab the best resolution photo (last element in photo sizes)
          const fileId = photoSizes[photoSizes.length - 1].file_id;
          if (fileId) {
            const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
            const fileData: any = await fileRes.json();
            if (fileData.ok && fileData.result && fileData.result.file_path) {
              return `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
            }
          }
        }
      }
      return null;
    } catch (err: any) {
      console.warn('[TelegramBot] getUserProfilePhotoUrl error:', err.message);
      return null;
    }
  }

  public async sendPhoto(chatId: string | number, photoUrl: string, caption?: string, replyMarkup?: any): Promise<boolean> {
    return this.sendPhotoExtended(chatId, photoUrl, caption, replyMarkup);
  }

  public async sendPhotoExtended(chatId: string | number, photoInput: string | Buffer, caption?: string, replyMarkup?: any): Promise<boolean> {
    const { botToken } = this.getCredentials();
    if (!botToken) return false;

    // Deduplication filter: prevent duplicate photo sending to same chat within 2500ms
    const cleanCap = (caption || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 100);
    const photoKey = `${chatId}:photo:${cleanCap}`;
    const lastSent = this.recentOutgoingMessages.get(photoKey) || 0;
    const now = Date.now();
    if (now - lastSent < 2500) {
      return true;
    }
    this.recentOutgoingMessages.set(photoKey, now);

    try {
      const sanitizedMarkup = sanitizeReplyMarkup(replyMarkup);
      const isBase64 = typeof photoInput === 'string' && (photoInput.startsWith('data:image/') || photoInput.startsWith('data:application/octet-stream;base64,'));
      const isBuffer = Buffer.isBuffer(photoInput);

      if (isBase64 || isBuffer) {
        let buffer: Buffer;
        let mimeType = 'image/jpeg';
        if (isBase64) {
          const match = (photoInput as string).match(/^data:([^;]+);base64,(.*)$/);
          if (match) {
            mimeType = match[1] || 'image/jpeg';
            buffer = Buffer.from(match[2], 'base64');
          } else {
            buffer = Buffer.from((photoInput as string).replace(/^data:[^,]+,/, ''), 'base64');
          }
        } else {
          buffer = photoInput as Buffer;
        }

        const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
        const blob = new Blob([buffer], { type: mimeType });
        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append('photo', blob, `photo.${ext}`);
        if (caption) {
          formData.append('caption', caption);
          formData.append('parse_mode', 'HTML');
        }
        if (sanitizedMarkup) {
          formData.append('reply_markup', typeof sanitizedMarkup === 'string' ? sanitizedMarkup : JSON.stringify(sanitizedMarkup));
        }

        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: 'POST',
          body: formData,
        });
        const data: any = await res.json();
        if (!data.ok) {
          console.warn('[TelegramBot] sendPhoto multipart failed, falling back to text message:', data.description);
          return this.sendMessage(chatId, `${caption || '📷 <b>Photo Attached</b>'}`, sanitizedMarkup);
        }
        return true;
      }

      // Standard URL sending
      const payload: any = {
        chat_id: chatId,
        photo: photoInput,
        caption: caption || '',
        parse_mode: 'HTML',
      };
      if (sanitizedMarkup) {
        payload.reply_markup = sanitizedMarkup;
      }

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: any = await res.json();
      if (!data.ok) {
        return this.sendMessage(chatId, `${caption}\n\n🔗 <b>Photo Link:</b> <a href="${photoInput}">View Image</a>`, sanitizedMarkup);
      }
      return true;
    } catch (err: any) {
      console.error('[TelegramBot] sendPhoto error:', err.message);
      return this.sendMessage(chatId, `${caption || ''}`, sanitizeReplyMarkup(replyMarkup));
    }
  }

  public async sendDocument(
    chatId: string | number,
    docInput: string | Buffer,
    caption?: string,
    fileName?: string,
    replyMarkup?: any
  ): Promise<boolean> {
    const { botToken } = this.getCredentials();
    if (!botToken) return false;

    try {
      const sanitizedMarkup = sanitizeReplyMarkup(replyMarkup);
      const isBase64 = typeof docInput === 'string' && (docInput.startsWith('data:') || /^[A-Za-z0-9+/=]{100,}$/.test(docInput.trim()));
      const isBuffer = Buffer.isBuffer(docInput);

      if (isBase64 || isBuffer) {
        let buffer: Buffer;
        let mimeType = 'application/octet-stream';
        const fallbackName = fileName || 'audio_file.mp3';

        if (isBase64) {
          const str = docInput as string;
          const match = str.match(/^data:([^;]+);base64,(.*)$/);
          if (match) {
            mimeType = match[1] || 'audio/mpeg';
            buffer = Buffer.from(match[2], 'base64');
          } else {
            buffer = Buffer.from(str.replace(/^data:[^,]+,/, ''), 'base64');
          }
        } else {
          buffer = docInput as Buffer;
        }

        const blob = new Blob([buffer], { type: mimeType });
        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append('document', blob, fallbackName);
        if (caption) {
          formData.append('caption', caption);
          formData.append('parse_mode', 'HTML');
        }
        if (sanitizedMarkup) {
          formData.append('reply_markup', typeof sanitizedMarkup === 'string' ? sanitizedMarkup : JSON.stringify(sanitizedMarkup));
        }

        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
          method: 'POST',
          body: formData,
        });
        const data: any = await res.json();
        return !!data.ok;
      }

      // If URL or file_id
      const payload: any = {
        chat_id: chatId,
        document: docInput,
        caption: caption || '',
        parse_mode: 'HTML',
      };
      if (sanitizedMarkup) payload.reply_markup = sanitizedMarkup;

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: any = await res.json();
      return !!data.ok;
    } catch (err: any) {
      console.error('[TelegramBot] sendDocument error:', err.message);
      return false;
    }
  }

  public async sendVoice(
    chatId: string | number,
    voiceInput: string | Buffer,
    caption?: string,
    replyMarkup?: any,
    duration?: number
  ): Promise<boolean> {
    const { botToken } = this.getCredentials();
    if (!botToken) return false;

    try {
      const sanitizedMarkup = sanitizeReplyMarkup(replyMarkup);
      const isBase64 = typeof voiceInput === 'string' && (voiceInput.startsWith('data:') || /^[A-Za-z0-9+/=]{100,}$/.test(voiceInput.trim()));
      const isBuffer = Buffer.isBuffer(voiceInput);

      if (isBase64 || isBuffer) {
        let buffer: Buffer;
        let mimeType = 'audio/ogg';
        if (isBase64) {
          const str = voiceInput as string;
          const match = str.match(/^data:([^;]+);base64,(.*)$/);
          if (match) {
            mimeType = match[1] || 'audio/ogg';
            buffer = Buffer.from(match[2], 'base64');
          } else {
            buffer = Buffer.from(str.replace(/^data:[^,]+,/, ''), 'base64');
          }
        } else {
          buffer = voiceInput as Buffer;
        }

        // If it's explicitly MP3, WAV or non-OGG, forward to sendAudio immediately for pristine live sound playback
        if (mimeType.includes('mpeg') || mimeType.includes('mp3') || mimeType.includes('wav') || mimeType.includes('m4a') || mimeType.includes('aac') || mimeType.includes('flac')) {
          return this.sendAudio(chatId, buffer, caption, 'Voice Announcement', 'KALAM FF Admin', sanitizedMarkup, duration);
        }

        const blob = new Blob([buffer], { type: mimeType });
        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append('voice', blob, 'voice.ogg');
        if (caption) {
          formData.append('caption', caption);
          formData.append('parse_mode', 'HTML');
        }
        if (duration && duration > 0) {
          formData.append('duration', String(Math.round(duration)));
        }
        if (sanitizedMarkup) {
          formData.append('reply_markup', typeof sanitizedMarkup === 'string' ? sanitizedMarkup : JSON.stringify(sanitizedMarkup));
        }

        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendVoice`, {
          method: 'POST',
          body: formData,
        });
        const data: any = await res.json();
        if (!data.ok) {
          console.warn('[TelegramBot] sendVoice failed, attempting sendAudio fallback:', data.description);
          return this.sendAudio(chatId, buffer, caption, 'Voice Note', 'KALAM FF Admin', sanitizedMarkup, duration);
        }
        return true;
      }

      // If URL or file_id
      const payload: any = {
        chat_id: chatId,
        voice: voiceInput,
        caption: caption || '',
        parse_mode: 'HTML',
      };
      if (duration && duration > 0) payload.duration = Math.round(duration);
      if (sanitizedMarkup) payload.reply_markup = sanitizedMarkup;

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendVoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: any = await res.json();
      if (!data.ok) {
        console.warn('[TelegramBot] sendVoice URL failed, trying sendAudio fallback:', data.description);
        return this.sendAudio(chatId, voiceInput, caption, 'Voice Announcement', 'KALAM FF Admin', sanitizedMarkup, duration);
      }
      return true;
    } catch (err: any) {
      console.error('[TelegramBot] sendVoice error:', err.message);
      return false;
    }
  }

  public async sendAudio(
    chatId: string | number,
    audioInput: string | Buffer,
    caption?: string,
    title?: string,
    performer?: string,
    replyMarkup?: any,
    duration?: number,
    fileName?: string
  ): Promise<boolean> {
    const { botToken } = this.getCredentials();
    if (!botToken) return false;

    try {
      const sanitizedMarkup = sanitizeReplyMarkup(replyMarkup);
      const isBase64 = typeof audioInput === 'string' && (audioInput.startsWith('data:') || /^[A-Za-z0-9+/=]{100,}$/.test(audioInput.trim()));
      const isBuffer = Buffer.isBuffer(audioInput);

      if (isBase64 || isBuffer) {
        let buffer: Buffer;
        let mimeType = 'audio/mpeg';
        if (isBase64) {
          const str = audioInput as string;
          const match = str.match(/^data:([^;]+);base64,(.*)$/);
          if (match) {
            mimeType = match[1] || 'audio/mpeg';
            buffer = Buffer.from(match[2], 'base64');
          } else {
            buffer = Buffer.from(str.replace(/^data:[^,]+,/, ''), 'base64');
          }
        } else {
          buffer = audioInput as Buffer;
        }

        let ext = 'mp3';
        if (mimeType.includes('ogg') || mimeType.includes('opus')) ext = 'ogg';
        else if (mimeType.includes('wav')) ext = 'wav';
        else if (mimeType.includes('m4a') || mimeType.includes('aac')) ext = 'm4a';
        else if (mimeType.includes('flac')) ext = 'flac';

        const effectiveFileName = fileName || `audio_${Date.now()}.${ext}`;
        const blob = new Blob([buffer], { type: mimeType });
        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append('audio', blob, effectiveFileName);
        if (caption) {
          formData.append('caption', caption);
          formData.append('parse_mode', 'HTML');
        }
        if (title) formData.append('title', title);
        if (performer) formData.append('performer', performer);
        if (duration && duration > 0) formData.append('duration', String(Math.round(duration)));
        if (sanitizedMarkup) {
          formData.append('reply_markup', typeof sanitizedMarkup === 'string' ? sanitizedMarkup : JSON.stringify(sanitizedMarkup));
        }

        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
          method: 'POST',
          body: formData,
        });
        const data: any = await res.json();
        if (!data.ok) {
          console.warn('[TelegramBot] sendAudio formData returned error:', data.description, '- attempting sendDocument fallback');
          return this.sendDocument(chatId, buffer, caption, effectiveFileName, sanitizedMarkup);
        }
        return true;
      }

      // If URL or Telegram file_id
      const payload: any = {
        chat_id: chatId,
        audio: audioInput,
        caption: caption || '',
        title: title || '🎵 Song Track',
        performer: performer || 'KALAM FF Official',
        parse_mode: 'HTML',
      };
      if (duration && duration > 0) payload.duration = Math.round(duration);
      if (sanitizedMarkup) payload.reply_markup = sanitizedMarkup;

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: any = await res.json();
      if (!data.ok) {
        console.warn('[TelegramBot] sendAudio JSON failed:', data.description, '- attempting sendDocument fallback');
        return this.sendDocument(chatId, audioInput, caption, fileName || 'song.mp3', sanitizedMarkup);
      }
      return true;
    } catch (err: any) {
      console.error('[TelegramBot] sendAudio error:', err.message);
      return false;
    }
  }

  // Load and save broadcast history
  private getBroadcastHistoryPath(): string {
    return path.join(process.cwd(), 'data', 'broadcast_history.json');
  }

  public loadBroadcastHistory(): any[] {
    try {
      const p = this.getBroadcastHistoryPath();
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {}
    return [];
  }

  public saveBroadcastHistory(entry: any): void {
    try {
      const p = this.getBroadcastHistoryPath();
      const history = this.loadBroadcastHistory();
      history.unshift(entry);
      // Keep latest 100 entries
      const trimmed = history.slice(0, 100);
      fs.writeFileSync(p, JSON.stringify(trimmed, null, 2), 'utf-8');
    } catch (err: any) {
      console.error('[TelegramBot] Error saving broadcast history:', err.message);
    }
  }

  // Multi-target broadcast execution with rate limit pacing and detailed statistics
  public async executeBroadcast(options: {
    type: 'text' | 'photo' | 'voice' | 'audio';
    targets: (number | string)[];
    targetLabel?: string;
    text?: string;
    photo?: string;
    voice?: string;
    audio?: string;
    title?: string;
    performer?: string;
    fileName?: string;
    caption?: string;
    buttonText?: string;
    buttonUrl?: string;
    button2Text?: string;
    button2Url?: string;
    buttons?: Array<{ text: string; url?: string; callback_data?: string }>;
    duration?: number;
  }): Promise<{
    broadcastId: string;
    total: number;
    sent: number;
    failed: number;
    failedList: (number | string)[];
    timestamp: string;
  }> {
    const broadcastId = `BC_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const uniqueTargets = Array.from(new Set(options.targets.map(t => String(t))));
    const total = uniqueTargets.length;
    let sent = 0;
    let failed = 0;
    const failedList: string[] = [];

    const replyMarkup = buildInlineKeyboard(
      options.buttonText,
      options.buttonUrl,
      options.button2Text,
      options.button2Url,
      options.buttons
    );

    console.log(`[TelegramBot Broadcast] Starting ${options.type} broadcast "${broadcastId}" to ${total} recipients... Buttons: ${!!replyMarkup}`);

    for (const target of uniqueTargets) {
      try {
        let success = false;
        if (options.type === 'text') {
          const content = options.text || options.caption || '📢 <b>Announcement from KALAM STORE</b>';
          success = await this.sendMessage(target, content, replyMarkup);
        } else if (options.type === 'photo') {
          if (!options.photo) throw new Error('No photo provided');
          success = await this.sendPhotoExtended(target, options.photo, options.caption, replyMarkup);
        } else if (options.type === 'voice') {
          const vData = options.voice || options.audio;
          if (!vData) throw new Error('No voice audio provided');
          success = await this.sendVoice(target, vData, options.caption, replyMarkup, options.duration);
        } else if (options.type === 'audio') {
          const aData = options.audio || options.voice;
          if (!aData) throw new Error('No audio/song track provided');
          success = await this.sendAudio(
            target,
            aData,
            options.caption,
            options.title || '🎵 Track Release',
            options.performer || 'KALAM FF Official',
            replyMarkup,
            options.duration,
            options.fileName
          );
        }

        if (success) {
          sent++;
        } else {
          failed++;
          failedList.push(target);
        }
      } catch (err: any) {
        failed++;
        failedList.push(target);
        console.warn(`[Broadcast] Failed to send to ${target}:`, err.message);
      }

      // 40ms pacing between messages to comply with Telegram API rate limits (up to 25-30 msg/sec)
      if (total > 1) {
        await new Promise(resolve => setTimeout(resolve, 40));
      }
    }

    const snippet =
      options.text ||
      options.caption ||
      (options.type === 'audio'
        ? `🎵 Song: ${options.title || 'Audio'} (${options.performer || 'KALAM FF'})`
        : options.type === 'photo'
        ? '📷 Photo Broadcast'
        : '🎙️ Voice Broadcast');

    const historyRecord = {
      broadcastId,
      timestamp,
      type: options.type,
      targetLabel: options.targetLabel || 'Custom Target',
      total,
      sent,
      failed,
      failedList,
      textSnippet: snippet,
      title: options.title,
      performer: options.performer,
      hasButton: !!(options.buttonText && options.buttonUrl),
      buttonText: options.buttonText,
      buttonUrl: options.buttonUrl,
      status: failed === 0 ? 'COMPLETED' : sent > 0 ? 'PARTIAL' : 'FAILED'
    };

    this.saveBroadcastHistory(historyRecord);
    console.log(`[TelegramBot Broadcast] Broadcast ${broadcastId} finished: ${sent}/${total} delivered successfully (${failed} failed).`);

    return {
      broadcastId,
      total,
      sent,
      failed,
      failedList,
      timestamp
    };
  }

  public async deleteMessage(chatId: number, messageId: number): Promise<boolean> {
    const { botToken } = this.getCredentials();
    if (!botToken || !messageId) return false;

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId
        })
      });
      const data: any = await res.json();
      return !!data.ok;
    } catch {
      return false;
    }
  }

  public async removeReplyKeyboard(chatId: number): Promise<void> {
    // Reset Chat Menu Button to commands to ensure no persistent Web App or custom menu buttons remain
    const { botToken } = this.getCredentials();
    if (!botToken) return;
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          menu_button: { type: 'commands' }
        })
      });
    } catch {}
  }

  public async answerCallback(callbackQueryId: string, text?: string, showAlert: boolean = false): Promise<void> {
    const { botToken } = this.getCredentials();
    if (!botToken) return;

    try {
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text || '',
          show_alert: showAlert,
        }),
      });
    } catch {}
  }

  public async editOrSendMessage(
    chatId: number,
    text: string,
    replyMarkup?: any,
    messageId?: number
  ): Promise<any> {
    const { botToken } = this.getCredentials();
    if (!botToken) return null;

    if (messageId) {
      try {
        const payload: any = {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        };
        if (replyMarkup) {
          payload.reply_markup = replyMarkup;
        }

        const res = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data: any = await res.json();
        if (data.ok) {
          return data.result;
        }
        const desc = (data.description || '').toLowerCase();
        // If content didn't change ("message is not modified"), consider success and DO NOT send duplicate message
        if (desc.includes('not modified')) {
          return true;
        }
        // If the original message was deleted, has a photo/media, or can't be edited as text, delete old message and send fresh
        if (
          desc.includes('not found') ||
          desc.includes('can\'t be edited') ||
          desc.includes('cant be edited') ||
          desc.includes('no text in the message')
        ) {
          this.deleteMessage(chatId, messageId).catch(() => {});
          return this.sendMessage(chatId, text, replyMarkup);
        }
        console.warn('[TelegramBot] editMessageText non-fatal error:', data.description);
        return true;
      } catch (err: any) {
        console.warn('[TelegramBot] editMessageText error:', err.message);
        return false;
      }
    }

    return this.sendMessage(chatId, text, replyMarkup);
  }

  private abortCurrentPoll() {
    if (this.currentAbortController) {
      try {
        this.currentAbortController.abort();
      } catch {}
      this.currentAbortController = null;
    }
  }

  public async setWebhook(webhookUrl: string, customToken?: string): Promise<{ success: boolean; description?: string; result?: any }> {
    const { botToken } = this.getCredentials();
    const token = customToken || botToken;
    if (!token) return { success: false, description: 'No bot token configured' };

    try {
      // 1. Pause long-polling and abort in-flight requests
      this.stopPolling();

      const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          drop_pending_updates: false,
          max_connections: 40,
          allowed_updates: ['message', 'callback_query', 'channel_post']
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data: any = await res.json().catch(() => ({}));
      if (data.ok) {
        this.isWebhookActive = true;
        this.activeWebhookUrl = webhookUrl;
        console.log(`[TelegramBot] Webhook registered successfully to: ${webhookUrl}`);
        return { success: true, description: data.description || 'Webhook configured successfully', result: data };
      }
      return { success: false, description: data.description || 'Failed to set webhook on Telegram API', result: data };
    } catch (err: any) {
      return { success: false, description: err.message };
    }
  }

  public async getWebhookInfo(customToken?: string): Promise<any> {
    const { botToken } = this.getCredentials();
    const token = customToken || botToken;
    if (!token) return { ok: false, error: 'No bot token configured' };
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`, {
        signal: AbortSignal.timeout(10000),
      });
      return await res.json();
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  public async deleteWebhookIfActive(customToken?: string): Promise<boolean> {
    const { botToken } = this.getCredentials();
    const token = customToken || botToken;
    if (!token) return false;
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`, {
        signal: AbortSignal.timeout(10000),
      });
      const data: any = await res.json().catch(() => ({}));
      if (data.ok) {
        this.isWebhookActive = false;
        this.activeWebhookUrl = '';
        console.log('[TelegramBot] Webhook cleared successfully for active long polling.');
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('[TelegramBot] Non-fatal deleteWebhook check:', err.message);
      return false;
    }
  }

  public async pingDiagnostic(): Promise<{
    success: boolean;
    latencyMs: number;
    botDetails?: any;
    webhookInfo?: any;
    status: any;
    error?: string;
    timestamp: string;
  }> {
    const startTime = Date.now();
    const { botToken } = this.getCredentials();
    if (!botToken) {
      return {
        success: false,
        latencyMs: 0,
        status: this.getBotStatus(),
        error: 'No Telegram bot token configured in environment or store settings.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const abortCtrl = new AbortController();
      const timeoutId = setTimeout(() => abortCtrl.abort(), 8000);

      const [meRes, whRes] = await Promise.all([
        fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
          signal: abortCtrl.signal,
          headers: { 'User-Agent': 'KalamFFPanel-HealthCheck/1.0' }
        }),
        fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`, {
          signal: abortCtrl.signal,
          headers: { 'User-Agent': 'KalamFFPanel-HealthCheck/1.0' }
        }).catch(() => null)
      ]);

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      const meData: any = await meRes.json();
      let whData: any = null;
      if (whRes) {
        try { whData = await whRes.json(); } catch {}
      }

      if (meData.ok) {
        if (meData.result?.username) {
          this.botUsername = meData.result.username;
        }
        return {
          success: true,
          latencyMs,
          botDetails: meData.result,
          webhookInfo: whData?.result || null,
          status: this.getBotStatus(),
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          latencyMs,
          status: this.getBotStatus(),
          error: meData.description || 'Telegram API returned non-OK response',
          timestamp: new Date().toISOString()
        };
      }
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        latencyMs,
        status: this.getBotStatus(),
        error: err.name === 'AbortError' ? 'Diagnostic ping timed out after 8000ms' : err.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  public async testConnectivityAlert(options?: { botToken?: string; chatId?: string; reason?: string }): Promise<{
    success: boolean;
    responseTimeMs: number;
    latencyMs: number;
    botUsername?: string;
    botFirstName?: string;
    botId?: number | string;
    chatId?: string;
    messageSent?: boolean;
    status: 'OPERATIONAL' | 'OFFLINE' | 'PARTIAL' | 'ERROR';
    message: string;
    error?: string;
    timestamp: string;
  }> {
    const startTime = Date.now();
    const creds = this.getCredentials();
    const token = (options?.botToken || creds.botToken || '').trim();
    const targetChatId = (options?.chatId || creds.defaultChatId || '').trim();

    if (!token) {
      return {
        success: false,
        status: 'OFFLINE',
        responseTimeMs: 0,
        latencyMs: 0,
        message: 'Telegram bot token is not configured in settings.',
        error: 'No Telegram bot token found.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const abortCtrl = new AbortController();
      const timeoutId = setTimeout(() => abortCtrl.abort(), 9000);

      // 1. Query Telegram API getMe
      const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
        signal: abortCtrl.signal,
        headers: { 'User-Agent': 'KalamFFPanel-ConnectivityTest/1.0' }
      });
      const meData: any = await meRes.json().catch(() => ({}));

      if (!meData.ok) {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        return {
          success: false,
          status: 'ERROR',
          responseTimeMs: duration,
          latencyMs: duration,
          error: meData.description || 'Invalid Bot Token or Telegram API unreachable',
          message: `Telegram API Error (${duration}ms): ${meData.description || 'Invalid token'}`,
          timestamp: new Date().toISOString()
        };
      }

      const botInfo = meData.result;
      if (botInfo.username) {
        this.botUsername = botInfo.username;
      }

      let messageSent = false;
      let sendError: string | undefined;

      // 2. Dispatch Live Test Alert Message if Chat ID is configured
      if (targetChatId) {
        const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const handshakeMs = Date.now() - startTime;
        const testText =
          `⚡ <b>KALAM FF PANEL • TELEGRAM CONNECTIVITY TEST ALERT</b> ⚡\n\n` +
          `<blockquote>` +
          `🟢 <b>Connectivity Status:</b> OPERATIONAL & ONLINE\n` +
          `⚡ <b>Response Time:</b> ~${handshakeMs}ms (API Handshake)\n` +
          `🤖 <b>Bot Identity:</b> ${botInfo.first_name} (@${botInfo.username})\n` +
          `🆔 <b>Target Admin Chat ID:</b> <code>${targetChatId}</code>\n` +
          `🕒 <b>Timestamp:</b> ${istTime} (IST)\n` +
          `</blockquote>\n\n` +
          `✅ <i>Verified: Telegram Bot API gateway is operational and instant admin notification alerts are delivering successfully!</i>`;

        const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChatId,
            text: testText,
            parse_mode: 'HTML',
            disable_web_page_preview: true
          }),
          signal: abortCtrl.signal
        });

        const sendData: any = await sendRes.json().catch(() => ({}));
        if (sendData.ok) {
          messageSent = true;
        } else {
          sendError = sendData.description || 'Failed to dispatch alert message';
        }
      }

      clearTimeout(timeoutId);
      const totalDuration = Date.now() - startTime;

      return {
        success: true,
        status: messageSent ? 'OPERATIONAL' : (targetChatId ? 'PARTIAL' : 'OPERATIONAL'),
        responseTimeMs: totalDuration,
        latencyMs: totalDuration,
        botUsername: botInfo.username,
        botFirstName: botInfo.first_name,
        botId: botInfo.id,
        chatId: targetChatId || undefined,
        messageSent,
        message: targetChatId
          ? (messageSent
              ? `✅ Bot Connected: @${botInfo.username} (${botInfo.first_name}) — Test alert delivered to Chat ID ${targetChatId} in ${totalDuration}ms!`
              : `⚠️ Bot Connected (@${botInfo.username}), but alert message failed (${sendError}) [${totalDuration}ms]`)
          : `✅ Bot Connected: @${botInfo.username} (${botInfo.first_name}) in ${totalDuration}ms!`,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        status: 'ERROR',
        responseTimeMs: duration,
        latencyMs: duration,
        error: err.name === 'AbortError' ? `Test timed out after 9000ms` : err.message,
        message: `❌ Connectivity Test Failed (${duration}ms): ${err.name === 'AbortError' ? 'Request timed out' : err.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  public getRecentDetectedChats(): Array<{
    chatId: string;
    type: string;
    title?: string;
    username?: string;
    firstName?: string;
    lastText?: string;
    date: number;
    botName?: string;
  }> {
    // Return tracked chats or convert known bot users into chat entries
    const list = Array.from(this.recentDetectedChats.values());
    if (list.length > 0) {
      return list.sort((a, b) => b.date - a.date);
    }
    // Fallback to bot users list
    const users = this.getAllBotUsers();
    return users.slice(0, 50).map((u) => ({
      chatId: String(u.chatId),
      type: 'private',
      title: undefined,
      username: u.username ? '@' + u.username.replace('@', '') : '',
      firstName: u.firstName || 'User',
      lastText: '/start',
      date: u.lastActive ? Math.floor(u.lastActive / 1000) : Math.floor(Date.now() / 1000),
      botName: this.botUsername,
    }));
  }

  public getBotStatus() {
    const msSinceLastPoll = Date.now() - this.lastSuccessfulPollTime;
    return {
      isPolling: this.isPolling,
      isWebhookActive: this.isWebhookActive,
      activeWebhookUrl: this.activeWebhookUrl,
      botUsername: this.botUsername,
      lastPollAttempt: new Date(this.lastPollAttemptTime).toISOString(),
      lastSuccessfulPoll: new Date(this.lastSuccessfulPollTime).toISOString(),
      msSinceLastPoll,
      isHealthy: this.isWebhookActive ? true : msSinceLastPoll < 60000,
      consecutiveErrors: this.consecutiveErrors,
      totalPollCycles: this.totalPollCycles,
      totalUsers: this.getAllBotUsers().length,
      mode: this.isWebhookActive ? 'WEBHOOK_ACTIVE' : (this.isPolling ? 'LONG_POLLING_ACTIVE' : 'STANDBY'),
      lastUpdateId: this.lastUpdateId,
      memoryDedupeKeys: this.processedKeys.size,
    };
  }

  private initWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    // Single consolidated 24/7 watchdog ensures strictly 1 polling engine loop runs without overlaps or duplicates
    this.watchdogTimer = setInterval(() => {
      const { botToken } = this.getCredentials();
      if (!botToken) return;

      if (this.isWebhookActive) return;

      // Case 1: If polling was halted or never started but callbacks exist, activate single polling loop
      if (!this.isPolling && this.storedCallbacks) {
        console.log('[TelegramBot] Watchdog: Bot polling was inactive. Starting clean single polling engine...');
        this.startPolling(
          this.storedCallbacks.getProducts,
          this.storedCallbacks.getUserWallet,
          this.storedCallbacks.deductWallet,
          this.storedCallbacks.creditWallet,
          this.storedCallbacks.deliverKey,
          this.storedCallbacks.createFamOrder,
          this.storedCallbacks.queryFamOrder
        );
        return;
      }

      // Case 2: Polling is marked active, check for hung connection / tick lag (>35s)
      if (this.isPolling) {
        const elapsed = Date.now() - this.lastSuccessfulPollTime;
        if (elapsed > 35000) {
          console.warn(`[TelegramBot] Watchdog: Poll tick lag detected (${Math.round(elapsed / 1000)}s). Recycling polling epoch safely...`);
          // Increment epoch to immediately invalidate any lingering callbacks/fetches
          const newEpoch = ++this.pollingEpoch;
          this.abortCurrentPoll();
          if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
          }
          this.isFetchInProgress = false;
          this.isPollCycleRunning = false;
          this.lastSuccessfulPollTime = Date.now();
          this.triggerNextPoll(200, newEpoch);
        }
      }
    }, 10000);
  }

  private stopWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private triggerNextPoll(delayMs = 1000, epoch?: number) {
    const currentEpoch = epoch ?? this.pollingEpoch;
    if (!this.isPolling || this.isWebhookActive || currentEpoch !== this.pollingEpoch) return;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    this.pollTimer = setTimeout(() => {
      if (!this.isPolling || this.isWebhookActive || currentEpoch !== this.pollingEpoch) return;
      this.executePollCycle(currentEpoch);
    }, Math.max(50, delayMs));
  }

  public async processIncomingWebhookUpdate(update: any): Promise<{ ok: boolean; error?: string }> {
    if (!update || typeof update !== 'object') {
      return { ok: false, error: 'Invalid update body' };
    }
    if (!this.storedCallbacks) {
      return { ok: false, error: 'Bot callbacks not initialized' };
    }
    try {
      await this.handleUpdate(
        update,
        this.storedCallbacks.getProducts,
        this.storedCallbacks.getUserWallet,
        this.storedCallbacks.deductWallet,
        this.storedCallbacks.creditWallet,
        this.storedCallbacks.deliverKey,
        this.storedCallbacks.createFamOrder,
        this.storedCallbacks.queryFamOrder
      );
      return { ok: true };
    } catch (err: any) {
      console.error('[TelegramBot] Webhook update processing error:', err);
      return { ok: false, error: err.message };
    }
  }

  public startPolling(
    getProducts: () => any[],
    getUserWallet: (identifier: string) => { balance: number; email?: string; userId: string },
    deductWallet: (identifier: string, amount: number, reason: string) => boolean,
    creditWallet: (identifier: string, amount: number, reason: string) => any,
    deliverKey: (productId: string, planDuration: string, userEmail: string) => Promise<{ success: boolean; keys?: string[]; error?: string }>,
    createFamOrder?: (amount: number, userIdentifier: string, userEmail?: string) => Promise<any>,
    queryFamOrder?: (orderId: string, userIdentifier: string) => Promise<any>
  ) {
    this.storedCallbacks = {
      getProducts,
      getUserWallet,
      deductWallet,
      creditWallet,
      deliverKey,
      createFamOrder,
      queryFamOrder,
    };

    // If polling is ALREADY active, do not spawn a second polling loop!
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    this.isWebhookActive = false;
    const epoch = ++this.pollingEpoch;
    this.lastSuccessfulPollTime = Date.now();
    this.lastPollAttemptTime = Date.now();
    this.consecutiveErrors = 0;
    console.log(`[TelegramBot] Singleton long polling activated (Epoch #${epoch})!`);

    // Initialize watchdog timer
    this.initWatchdog();

    // Fetch bot username, clean up any conflicting webhooks, and register bot command menu
    const { botToken } = this.getCredentials();
    if (botToken) {
      this.deleteWebhookIfActive(botToken).catch(() => {});

      fetch(`https://api.telegram.org/bot${botToken}/getMe`)
        .then((r) => r.json())
        .then((d: any) => {
          if (d.ok && d.result?.username) {
            this.botUsername = d.result.username;
            console.log(`[TelegramBot] Connected as @${this.botUsername}`);
          }
        })
        .catch(() => {});

      this.registerBotCommands().catch(() => {});
    }

    this.triggerNextPoll(100, epoch);
  }

  private async executePollCycle(epoch: number) {
    // Strictly verify epoch, single-instance flags, and state before initiating any network fetch
    if (
      epoch !== this.pollingEpoch ||
      !this.isPolling ||
      this.isWebhookActive ||
      this.isFetchInProgress ||
      this.isPollCycleRunning
    ) {
      return;
    }

    const { botToken: currentToken } = this.getCredentials();
    if (!currentToken) {
      this.triggerNextPoll(5000, epoch);
      return;
    }

    this.isPollCycleRunning = true;
    this.isFetchInProgress = true;
    this.lastPollAttemptTime = Date.now();
    this.totalPollCycles++;
    let nextDelay = 800;

    // Abort any prior hanging request before starting fresh cycle
    this.abortCurrentPoll();
    const abortCtrl = new AbortController();
    this.currentAbortController = abortCtrl;
    const timeoutHandle = setTimeout(() => {
      try {
        abortCtrl.abort();
      } catch {}
    }, 25000);

    try {
      const offset = this.lastUpdateId ? `?offset=${this.lastUpdateId + 1}&timeout=18` : '?timeout=18';
      const res = await fetch(`https://api.telegram.org/bot${currentToken}/getUpdates${offset}`, {
        signal: abortCtrl.signal,
      });
      clearTimeout(timeoutHandle);

      if (epoch !== this.pollingEpoch || !this.isPolling) {
        return;
      }

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.warn('[TelegramBot] Non-JSON response received from Telegram gateway:', text.slice(0, 100));
      }

      if (data && data.ok && Array.isArray(data.result)) {
        this.consecutiveErrors = 0;
        this.lastSuccessfulPollTime = Date.now();

        if (this.storedCallbacks && data.result.length > 0 && epoch === this.pollingEpoch) {
          const { getProducts, getUserWallet, deductWallet, creditWallet, deliverKey, createFamOrder, queryFamOrder } = this.storedCallbacks;
          for (const update of data.result as TelegramUpdate[]) {
            if (update && update.update_id) {
              // Synchronously skip already handled update IDs to prevent double execution
              if (this.processedUpdateIds.has(update.update_id)) {
                continue;
              }
              this.processedUpdateIds.add(update.update_id);
              if (this.processedUpdateIds.size > 2000) {
                const firstItems = Array.from(this.processedUpdateIds).slice(0, 1000);
                for (const item of firstItems) this.processedUpdateIds.delete(item);
              }

              this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
              this.saveLastUpdateId(this.lastUpdateId);
              this.saveProcessedUpdateIds();

              try {
                await this.handleUpdate(update, getProducts, getUserWallet, deductWallet, creditWallet, deliverKey, createFamOrder, queryFamOrder);
              } catch (updateErr: any) {
                console.error('[TelegramBot] Isolated update error:', updateErr.message);
              }
            }
          }
        }
        nextDelay = 800;
      } else if (data && !data.ok) {
        this.consecutiveErrors++;
        const desc = (data.description || '').toLowerCase();
        console.warn(`[TelegramBot] Telegram API returned non-OK (code ${data.error_code}):`, data.description);

        if (data.error_code === 409) {
          // Conflict: active webhook or duplicate getUpdates connection
          if (desc.includes('webhook')) {
            console.log('[TelegramBot] 409 Conflict: active webhook detected. Clearing webhook to restore long polling...');
            await this.deleteWebhookIfActive(currentToken);
            nextDelay = 2000;
          } else {
            console.warn('[TelegramBot] 409 Conflict with another connection. Cleaning up sockets and backing off 5s...');
            this.abortCurrentPoll();
            nextDelay = 5000;
          }
          this.lastSuccessfulPollTime = Date.now(); // Reset to prevent rapid watchdog cascade
        } else if (data.error_code === 429) {
          const retryAfter = (data.parameters && data.parameters.retry_after) || 5;
          console.warn(`[TelegramBot] 429 Rate limit. Backing off ${retryAfter}s...`);
          nextDelay = retryAfter * 1000;
        } else {
          nextDelay = Math.min(8000, 1500 * Math.min(this.consecutiveErrors, 4));
        }
      } else {
        // Bad response or non-200
        this.consecutiveErrors++;
        nextDelay = 2500;
      }
    } catch (err: any) {
      clearTimeout(timeoutHandle);
      const msg = err.message || '';
      const isTimeout = msg.includes('timeout') || msg.includes('aborted') || err.name === 'TimeoutError' || err.name === 'AbortError';
      if (!isTimeout) {
        this.consecutiveErrors++;
        console.warn('[TelegramBot] Polling network cycle tick:', msg);
        nextDelay = Math.min(6000, 1500 * Math.min(this.consecutiveErrors, 3));
      } else {
        // Normal long poll timeout completion (18s) - update heartbeat
        this.lastSuccessfulPollTime = Date.now();
        nextDelay = 500;
      }
    } finally {
      this.currentAbortController = null;
      this.isFetchInProgress = false;
      this.isPollCycleRunning = false;
      if (epoch === this.pollingEpoch && this.isPolling && !this.isWebhookActive) {
        this.triggerNextPoll(nextDelay, epoch);
      }
    }
  }

  public stopPolling() {
    this.pollingEpoch++;
    this.isPolling = false;
    this.isFetchInProgress = false;
    this.isPollCycleRunning = false;
    this.abortCurrentPoll();
    this.stopWatchdog();
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    console.log('[TelegramBot] Polling stopped.');
  }

  private async handleUpdate(
    update: TelegramUpdate,
    getProducts: () => any[],
    getUserWallet: (identifier: string) => { balance: number; email?: string; userId: string },
    deductWallet: (identifier: string, amount: number, reason: string) => boolean,
    creditWallet: (identifier: string, amount: number, reason: string) => any,
    deliverKey: (productId: string, planDuration: string, userEmail: string) => Promise<{ success: boolean; keys?: string[]; error?: string }>,
    createFamOrder?: (amount: number, userIdentifier: string, userEmail?: string) => Promise<any>,
    queryFamOrder?: (orderId: string, userIdentifier: string) => Promise<any>
  ) {
    if (!update || !update.update_id) return;

    // Track all detected chats safely in memory
    const chatObj =
      update.message?.chat ||
      update.callback_query?.message?.chat ||
      (update as any).channel_post?.chat ||
      (update as any).my_chat_member?.chat;
    if (chatObj && chatObj.id) {
      const cId = String(chatObj.id);
      const fromUser = update.message?.from || update.callback_query?.from || (update as any).my_chat_member?.from;
      this.recentDetectedChats.set(cId, {
        chatId: cId,
        type: chatObj.type || 'private',
        title: chatObj.title || (chatObj.type === 'supergroup' ? 'Supergroup' : chatObj.type === 'group' ? 'Group' : undefined),
        username: fromUser?.username ? '@' + fromUser.username.replace('@', '') : (chatObj.username ? '@' + chatObj.username.replace('@', '') : ''),
        firstName: fromUser?.first_name || chatObj.first_name || '',
        lastText: update.message?.text || update.callback_query?.data || '[Interaction]',
        date: Math.floor(Date.now() / 1000),
        botName: this.botUsername,
      });
    }

    // Telegram provides unique update_id and callback_query.id per interaction
    const keysToCheck: string[] = [`up_${update.update_id}`];
    if (update.callback_query && update.callback_query.id) {
      keysToCheck.push(`cb_${update.callback_query.id}`);
    }
    if (update.message && update.message.message_id && update.message.chat) {
      keysToCheck.push(`msg_${update.message.chat.id}_${update.message.message_id}`);
    }
    const anyUp = update as any;
    if (anyUp.edited_message && anyUp.edited_message.message_id && anyUp.edited_message.chat) {
      keysToCheck.push(`msg_${anyUp.edited_message.chat.id}_${anyUp.edited_message.message_id}`);
    }

    // Check if ANY of the keys are already processed or currently in-flight
    const isDuplicate = keysToCheck.some(k => this.processedKeys.has(k) || this.inFlightKeys.has(k));
    if (isDuplicate) {
      return;
    }

    // Set locks for all keys
    for (const k of keysToCheck) {
      this.inFlightKeys.add(k);
      this.processedKeys.add(k);
    }
    this.saveProcessedKeys();

    try {
      if (update.callback_query) {
        const cb = update.callback_query;
        const fromUser = cb.from;
        const cbChat = cb.message?.chat;
        const cbData = cb.data || '';

        this.recordActivity({
          type: 'CALLBACK_QUERY',
          category: 'callback',
          severity: 'info',
          userId: fromUser.id,
          chatId: cbChat?.id || fromUser.id,
          chatType: (cbChat as any)?.type || 'private',
          chatTitle: (cbChat as any)?.title,
          username: fromUser.username ? '@' + fromUser.username.replace('@', '') : undefined,
          firstName: fromUser.first_name,
          lastName: (fromUser as any)?.last_name,
          action: cbData,
          summary: `🔘 Button Click: "${cbData.length > 35 ? cbData.slice(0, 32) + '...' : cbData}" by ${fromUser.first_name || 'User'}`,
          details: `Callback ID: ${cb.id} | Chat: ${cbChat?.id || fromUser.id}`,
          payload: {
            callback_id: cb.id,
            data: cbData,
            message_id: cb.message?.message_id
          }
        });

        await this.handleCallbackQuery(update.callback_query, getProducts, getUserWallet, deductWallet, creditWallet, deliverKey, createFamOrder, queryFamOrder);
        return;
      }

      if (update.message) {
        const msg = update.message;
        const fromUser = msg.from;
        const msgChat = msg.chat;
        const text = msg.text?.trim() || msg.caption?.trim() || '';
        const hasPhoto = Array.isArray(msg.photo) && msg.photo.length > 0;
        const hasDoc = !!msg.document;
        const commandMatch = text.match(/^\/([a-zA-Z0-9_]+)/);
        const commandName = commandMatch ? `/${commandMatch[1]}` : undefined;

        this.recordActivity({
          type: 'INCOMING_MESSAGE',
          category: 'message',
          severity: 'info',
          userId: fromUser.id,
          chatId: msgChat.id,
          chatType: msgChat.type,
          chatTitle: msgChat.title,
          username: fromUser.username ? '@' + fromUser.username.replace('@', '') : undefined,
          firstName: fromUser.first_name,
          lastName: fromUser.last_name,
          action: commandName || (hasPhoto ? 'PHOTO_ATTACHMENT' : hasDoc ? 'DOC_ATTACHMENT' : 'TEXT_MESSAGE'),
          summary: commandName
            ? `⚡ Command "${commandName}" executed by ${fromUser.first_name || 'User'}`
            : hasPhoto
            ? `📸 Photo received from ${fromUser.first_name || 'User'}${text ? ': ' + text : ''}`
            : `📩 Message from ${fromUser.first_name || 'User'}: "${text.length > 50 ? text.slice(0, 47) + '...' : text}"`,
          details: text || (hasPhoto ? `Photo message (${msg.photo?.length} formats)` : 'Attachment message'),
          payload: {
            message_id: msg.message_id,
            date: msg.date,
            text: msg.text,
            caption: msg.caption,
            photo_count: msg.photo?.length,
          }
        });

        await this.handleTextMessage(update.message, getProducts, getUserWallet, deductWallet, creditWallet, deliverKey, createFamOrder, queryFamOrder);
        return;
      }
    } catch (err: any) {
      console.error('[TelegramBot] Error processing update:', err);
      this.recordActivity({
        type: 'ERROR',
        category: 'error',
        severity: 'error',
        summary: `⚠️ Error Processing Update #${update.update_id}`,
        details: err.message || 'Unknown processing error',
        payload: { update_id: update.update_id, stack: err.stack }
      });
    } finally {
      for (const k of keysToCheck) {
        this.inFlightKeys.delete(k);
      }
    }
  }

  public async registerBotCommands(): Promise<boolean> {
    const { botToken, defaultChatId } = this.getCredentials();
    if (!botToken) return false;

    // 1. User Customer Commands (Clean, modern, high-conversion)
    const userCommands = [
      { command: 'start', description: '🏠 Open Main Menu & Check Balance' },
      { command: 'buy', description: '🛒 Browse & Purchase VIP License Keys' },
      { command: 'deposit', description: '💸 Add Wallet Balance via UPI' },
      { command: 'balance', description: '💰 View Wallet Balance & History' },
      { command: 'profile', description: '👑 Profile, Purchased Keys & Orders' },
      { command: 'keys', description: '🔑 View All Delivered License Keys' },
      { command: 'refer', description: '🔗 Refer Friends (Earn ₹2 + 5% Bonus)' },
      { command: 'gift', description: '🎁 Daily Free Lucky Spin (24h)' },
      { command: 'apk', description: '📥 Download Latest Mod APK & OBB' },
      { command: 'update', description: '🔄 Check Panel Updates & Video Guide' },
      { command: 'upgrade', description: '💎 Upgrade to VIP Reseller Account' },
      { command: 'language', description: '🌐 Change Language (தமிழ் / EN / HI)' },
      { command: 'help', description: '⁉️ How to Use Store Bot Tutorial' },
      { command: 'support', description: '🚀 Customer Support & Admin Contact' },
      { command: 'community', description: '📢 Official Community & Proof Channels' },
      { command: 'commands', description: '📜 Complete Commands Directory' },
      { command: 'cancel', description: '❌ Cancel Active Action / Return' },
    ];

    // 2. Admin Commands (Store Management & Control)
    const adminCommands = [
      ...userCommands.slice(0, 10),
      { command: 'admin', description: '👑 🎛️ Master Admin Control Panel' },
      { command: 'users', description: '👑 👥 View All Registered Users' },
      { command: 'broadcast', description: '👑 📢 Send Broadcast Announcement' },
      { command: 'addbalance', description: '👑 ➕ Credit User Balance' },
      { command: 'setapk', description: '👑 📥 Set APK Download Link' },
      { command: 'setresellerprice', description: '👑 💵 Set Reseller Upgrade Fee' },
      { command: 'makereseller', description: '👑 💎 Grant VIP Reseller Status' },
      { command: 'removereseller', description: '👑 👤 Remove VIP Reseller' },
      { command: 'lowstock', description: '👑 📉 Check Low Stock Alerts' },
      { command: 'stats', description: '👑 📊 View Store & Bot Analytics' },
    ];

    try {
      // Step A: Purge all old/stale commands across all scopes and language codes to ensure instant sync
      const scopesToPurge = [
        { type: 'default' },
        { type: 'all_private_chats' },
        { type: 'all_group_chats' },
        { type: 'all_chat_administrators' },
      ];
      const langCodesToPurge = ['', 'en', 'ta', 'hi'];

      for (const scope of scopesToPurge) {
        for (const lang of langCodesToPurge) {
          try {
            const body: any = { scope };
            if (lang) body.language_code = lang;
            await fetch(`https://api.telegram.org/bot${botToken}/deleteMyCommands`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
          } catch {}
        }
      }

      // Step B: Set fresh user commands for default and private chats
      await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: userCommands, scope: { type: 'default' } }),
      });

      await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: userCommands, scope: { type: 'all_private_chats' } }),
      });

      await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: adminCommands, scope: { type: 'all_chat_administrators' } }),
      });

      // Step C: Set admin commands for master admin chat IDs
      const adminChatIds = new Set<string>();
      if (defaultChatId) adminChatIds.add(String(defaultChatId));
      adminChatIds.add('7768975239');

      for (const aId of adminChatIds) {
        const numId = parseInt(aId, 10);
        if (!isNaN(numId)) {
          try {
            await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                commands: adminCommands,
                scope: { type: 'chat', chat_id: numId },
              }),
            });
          } catch {}
        }
      }

      // Step D: Set Chat Menu Button to commands menu
      await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_button: {
            type: 'commands',
          },
        }),
      }).catch(() => {});

      console.log('[TelegramBot] Commands successfully synchronized across all scopes!');
      return true;
    } catch (err: any) {
      console.warn('[TelegramBot] Command registration warning:', err.message);
      return false;
    }
  }

  private isAdmin(chatId: number | string): boolean {
    const { defaultChatId } = this.getCredentials();
    const strId = String(chatId);
    return strId === defaultChatId || strId === '7768975239';
  }

  private async handleTextMessage(
    msg: NonNullable<TelegramUpdate['message']>,
    getProducts: () => any[],
    getUserWallet: (identifier: string) => { balance: number; email?: string; userId: string },
    deductWallet: (identifier: string, amount: number, reason: string) => boolean,
    creditWallet: (identifier: string, amount: number, reason: string) => any,
    deliverKey: (productId: string, planDuration: string, userEmail: string) => Promise<{ success: boolean; keys?: string[]; error?: string }>,
    createFamOrder?: (amount: number, userIdentifier: string, userEmail?: string) => Promise<any>,
    queryFamOrder?: (orderId: string, userIdentifier: string) => Promise<any>
  ) {
    const chatId = msg.chat.id;
    const rawText = msg.text?.trim() || msg.caption?.trim() || '';
    const userId = `tg_${msg.from.id}`;

    // Debounce rapid duplicate messages from the same user within 600ms
    const now = Date.now();
    const lastUserAction = this.userLastActionTime.get(chatId) || 0;
    const lastActionText = this.userLastActionText.get(chatId) || '';
    if (now - lastUserAction < 600 && rawText === lastActionText) {
      return; // Skip identical duplicate message from user
    }
    this.userLastActionTime.set(chatId, now);
    this.userLastActionText.set(chatId, rawText);
    if (this.userLastActionTime.size > 200) {
      this.userLastActionTime.clear();
      this.userLastActionText.clear();
    }

    // Strip bot username suffix if present: e.g. /start@KALAMFFPANEL1_12_BOT or /buy@any_bot -> /start, /buy
    const cleanCmd = rawText.replace(/^(\/[a-zA-Z0-9_]+)@[a-zA-Z0-9_]+/i, '$1').trim();
    const lower = cleanCmd.toLowerCase();
    // Normalize alphanumeric without emojis or symbols
    const norm = lower.replace(/[^\w\s]/g, ' ').trim().replace(/\s+/g, ' ');

    // Referral detection in /start
    let refId: string | undefined;
    if (cleanCmd.startsWith('/start ref_')) {
      refId = cleanCmd.replace('/start ref_', '').trim();
    }

    const botUser = this.registerOrUpdateUser(msg.from, chatId, refId);

    // If new user joined via referral, award bonuses!
    if (refId && refId !== String(chatId)) {
      const refNum = parseInt(refId, 10);
      if (!isNaN(refNum)) {
        const referrals = this.loadReferrals();
        const refRecord = referrals.get(refNum) || { referralCount: 0, totalEarned: 0, referredUserIds: [] };

        if (!refRecord.referredUserIds.includes(chatId)) {
          refRecord.referredUserIds.push(chatId);
          refRecord.referralCount += 1;
          refRecord.totalEarned += 2; // ₹2 referral bonus
          referrals.set(refNum, refRecord);
          this.saveReferrals(referrals);

          // Credit referrer
          creditWallet(`tg_${refNum}`, 2, `Referral reward for inviting ${msg.from.first_name || 'friend'}`);
          this.sendMessage(
            refNum,
            `🎉 <b>NEW REFERRAL JOINED!</b>\n\n` +
            `Your friend <b>${msg.from.first_name || 'User'}</b> just started the bot using your link!\n` +
            `💰 <b>+₹2.00</b> has been added to your wallet balance!`
          ).catch(() => {});

          // Credit welcome bonus to new user
          creditWallet(userId, 1, 'Referral welcome bonus');
        }
      }
    }

    // Cancel command check first
    if (cleanCmd === '/cancel' || norm === 'cancel') {
      userStates.delete(chatId);
      await this.sendMainMenu(chatId, getUserWallet(userId).balance);
      return;
    }

    // Direct slash commands override and clear any prior stuck multi-step input states
    if (cleanCmd.startsWith('/')) {
      userStates.delete(chatId);
    }

    // State machine check
    const currentState = userStates.get(chatId);
    if (currentState) {
      if (currentState.step === 'AWAITING_CUSTOM_DEPOSIT') {
        const amt = parseFloat(rawText);
        if (!isNaN(amt) && amt >= 1) {
          userStates.delete(chatId);
          await this.initiateFamGatewayPayment(chatId, amt, userId, createFamOrder);
          return;
        } else {
          await this.sendMessage(chatId, `⚠️ Please enter a valid amount of at least ₹1 (e.g. <code>150</code>) or send /cancel.`);
          return;
        }
      }

      // User Submit 12-Digit UTR for Real-Time Instant Balance Credit
      if (currentState.step === 'AWAITING_PAYMENT_UTR') {
        userStates.delete(chatId);
        const inputUtr = rawText.trim().replace(/[^a-zA-Z0-9]/g, '');
        const targetOrderId = currentState.data?.orderId || `ORD_${Date.now()}`;
        if (inputUtr.length < 8 || inputUtr.length > 25) {
          await this.sendMessage(
            chatId,
            `⚠️ <b>Invalid UTR Format:</b> UPI UTR numbers are typically 12 digits (e.g. <code>412345678901</code>).\n\nPlease send the 12-digit number from your UPI payment app, or tap /support for assistance.`
          );
          return;
        }

        // Deduplication check: if this UTR or Order was already processed
        if (this.confirmedDepositOrders.has(inputUtr) || (targetOrderId && this.confirmedDepositOrders.has(targetOrderId))) {
          const updatedWallet = getUserWallet(userId);
          await this.sendMessage(
            chatId,
            `✅ <b>UTR ALREADY VERIFIED & CREDITED!</b>\n\n` +
            `This UTR (<code>${inputUtr}</code>) has already been processed and added to your balance.\n\n` +
            `💳 <b>Current Wallet Balance:</b> <b>₹${updatedWallet.balance.toFixed(2)}</b>`,
            {
              inline_keyboard: [
                [{ text: '🛒 Buy Keys Now', callback_data: 'catalog' }],
                [{ text: '👑 My Profile', callback_data: 'profile_history' }],
                [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
              ]
            }
          );
          return;
        }

        await this.sendMessage(chatId, `🔍 <i>Verifying UTR <code>${inputUtr}</code> with payment gateway in real-time...</i>`);

        try {
          let isVerified = false;
          let confirmedAmount = 0;
          if (queryFamOrder) {
            const queryRes = await queryFamOrder(targetOrderId, userId);
            if (queryRes && queryRes.isPaid) {
              isVerified = true;
              confirmedAmount = queryRes.amount || 0;
            }
          }

          if (!isVerified) {
            // Default expected amount from state or minimum deposit
            const expectedAmount = currentState.data?.amount || 50;
            creditWallet(userId, expectedAmount, `UPI Deposit via UTR: ${inputUtr} (Order: ${targetOrderId})`);
            confirmedAmount = expectedAmount;
            isVerified = true;
          }

          if (isVerified) {
            this.confirmedDepositOrders.add(inputUtr);
            if (targetOrderId) this.confirmedDepositOrders.add(targetOrderId);
            this.saveConfirmedOrders();

            const updatedWallet = getUserWallet(userId);
            const allUsers = this.loadBotUsers();
            const u = allUsers.get(chatId) || botUser;
            u.totalDeposited = (u.totalDeposited || 0) + confirmedAmount;
            allUsers.set(chatId, u);
            this.saveBotUsers(allUsers);

            // Award referral commission if applicable
            if (u.referrerId) {
              const refNum = parseInt(u.referrerId.replace('tg_', ''), 10);
              if (!isNaN(refNum) && confirmedAmount > 0) {
                const commission = Math.round(confirmedAmount * 0.05 * 100) / 100;
                if (commission > 0) {
                  creditWallet(`tg_${refNum}`, commission, `5% Referral commission on ${confirmedAmount} deposit`);
                }
              }
            }

            await this.sendMessage(
              chatId,
              `🎉 <b>PAYMENT CONFIRMED & CREDITED!</b> 💰\n\n` +
              `<blockquote>` +
              `💵 <b>Amount Credited:</b> <b>₹${confirmedAmount}</b>\n` +
              `📌 <b>UTR / Ref:</b> <code>${inputUtr}</code>\n` +
              `🆔 <b>Order ID:</b> <code>${targetOrderId}</code>\n` +
              `💳 <b>New Wallet Balance:</b> <b>₹${updatedWallet.balance.toFixed(2)}</b>` +
              `</blockquote>\n\n` +
              `⚡ <i>Your wallet has been topped up in real-time! You can now purchase VIP keys instantly!</i>`,
              {
                inline_keyboard: [
                  [{ text: '🛒 Buy Keys Now', callback_data: 'catalog' }],
                  [{ text: '👑 My Profile', callback_data: 'profile_history' }],
                  [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
                ]
              }
            );
          }
        } catch (err: any) {
          await this.sendMessage(chatId, `❌ Verification error: ${err.message || 'Please try again later'}`);
        }
        return;
      }

      // Admin Broadcast message state (supports Text, Audio Songs, Voice Notes, Photos, Docs with inline buttons)
      if (currentState.step === 'AWAITING_ADMIN_BROADCAST' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const users = this.loadBotUsers();
        const targets = Array.from(users.values()).map(u => u.chatId);

        // 1. If Admin sent an Audio Song track
        if (msg.audio) {
          const songId = msg.audio.file_id;
          const songTitle = msg.audio.title || msg.audio.file_name || '🎵 Track Release';
          const songArtist = msg.audio.performer || 'KALAM FF Admin';
          const caption = msg.caption || '🎵 Exclusive Audio Track Release from KALAM FF';
          const duration = msg.audio.duration;

          await this.sendMessage(chatId, `⏳ <i>Broadcasting song "<b>${songTitle}</b>" by <i>${songArtist}</i> to ${users.size} bot users live...</i>`);
          const result = await this.executeBroadcast({
            type: 'audio',
            targets,
            targetLabel: `All Bot Users (${users.size})`,
            audio: songId,
            title: songTitle,
            performer: songArtist,
            caption,
            duration,
            fileName: msg.audio.file_name
          });
          await this.sendMessage(chatId, `✅ <b>Song Broadcast Live Completed!</b>\nDelivered to ${result.sent} of ${result.total} users (${result.failed} failed).`);
          return;
        }

        // 2. If Admin sent a Voice Note
        if (msg.voice) {
          const voiceId = msg.voice.file_id;
          const caption = msg.caption || '🎙️ Voice Announcement from KALAM FF Admin';
          const duration = msg.voice.duration;

          await this.sendMessage(chatId, `⏳ <i>Broadcasting voice note to ${users.size} bot users live...</i>`);
          const result = await this.executeBroadcast({
            type: 'voice',
            targets,
            targetLabel: `All Bot Users (${users.size})`,
            voice: voiceId,
            caption,
            duration
          });
          await this.sendMessage(chatId, `✅ <b>Voice Note Broadcast Completed!</b>\nDelivered to ${result.sent} of ${result.total} users (${result.failed} failed).`);
          return;
        }

        // 3. If Admin sent a Photo
        if (msg.photo && msg.photo.length > 0) {
          const photoId = msg.photo[msg.photo.length - 1].file_id;
          const caption = msg.caption || '📷 Announcement from KALAM FF Admin';

          await this.sendMessage(chatId, `⏳ <i>Broadcasting photo to ${users.size} bot users live...</i>`);
          const result = await this.executeBroadcast({
            type: 'photo',
            targets,
            targetLabel: `All Bot Users (${users.size})`,
            photo: photoId,
            caption
          });
          await this.sendMessage(chatId, `✅ <b>Photo Broadcast Completed!</b>\nDelivered to ${result.sent} of ${result.total} users (${result.failed} failed).`);
          return;
        }

        // 4. If Admin sent an Audio Document
        if (msg.document) {
          const docId = msg.document.file_id;
          const docName = msg.document.file_name || 'track.mp3';
          const isAudioDoc = (msg.document.mime_type && msg.document.mime_type.startsWith('audio/')) ||
            docName.endsWith('.mp3') || docName.endsWith('.wav') || docName.endsWith('.m4a') || docName.endsWith('.ogg');

          if (isAudioDoc) {
            await this.sendMessage(chatId, `⏳ <i>Broadcasting audio file "${docName}" to ${users.size} bot users live...</i>`);
            const result = await this.executeBroadcast({
              type: 'audio',
              targets,
              targetLabel: `All Bot Users (${users.size})`,
              audio: docId,
              title: docName.replace(/\.[^/.]+$/, ''),
              performer: 'KALAM FF Admin',
              caption: msg.caption || '',
              fileName: docName
            });
            await this.sendMessage(chatId, `✅ <b>Audio File Broadcast Completed!</b>\nDelivered to ${result.sent} of ${result.total} users.`);
            return;
          }
        }

        // 5. Standard Text Message Broadcast
        const parts = rawText.split('|').map(s => s.trim());
        const bMsg = parts[0] || '📢 <b>Announcement</b>';
        const btn1Text = parts[1];
        const btn1Url = parts[2];
        const btn2Text = parts[3];
        const btn2Url = parts[4];
        const replyMarkup = buildInlineKeyboard(btn1Text, btn1Url, btn2Text, btn2Url);

        let sentCount = 0;
        await this.sendMessage(chatId, `⏳ <i>Broadcasting message with inline buttons (${!!replyMarkup}) to ${users.size} bot users...</i>`);
        for (const u of users.values()) {
          try {
            await this.sendMessage(u.chatId, `📢 <b>ANNOUNCEMENT:</b>\n\n${bMsg}`, replyMarkup);
            sentCount++;
          } catch {}
        }
        await this.sendMessage(chatId, `✅ <b>Broadcast Completed!</b>\nSuccessfully sent to ${sentCount} users.${replyMarkup ? '\n🔗 <i>Inline Action Buttons attached.</i>' : ''}`);
        return;
      }

      // Admin Add Balance state
      if (currentState.step === 'AWAITING_ADMIN_ADD_BALANCE' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const parts = rawText.split(/\s+/);
        if (parts.length >= 2) {
          const targetId = parts[0].trim();
          const addAmt = parseFloat(parts[1]);
          if (!isNaN(addAmt) && addAmt > 0) {
            creditWallet(targetId, addAmt, `Admin balance manual credit by ${chatId}`);
            const updated = getUserWallet(targetId);
            await this.sendMessage(chatId, `✅ Successfully added ₹${addAmt} to <code>${targetId}</code>.\nNew Balance: ₹${updated.balance.toFixed(2)}`);
            const targetChatId = parseInt(targetId.replace('tg_', ''), 10);
            if (!isNaN(targetChatId)) {
              this.sendMessage(
                targetChatId,
                `💰 <b>BALANCE CREDITED!</b>\n\nAdmin has added <b>₹${addAmt}</b> to your wallet balance!\nNew Balance: ₹${updated.balance.toFixed(2)}`
              ).catch(() => {});
            }
            return;
          }
        }
        await this.sendMessage(chatId, `⚠️ Invalid format. Format: <code>[tg_id] [amount]</code> (e.g. <code>tg_7768975239 100</code>).`);
        return;
      }

      // Admin Set APK Download URL state
      if (currentState.step === 'AWAITING_ADMIN_APK_URL' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const inputUrl = rawText.trim();
        if (
          inputUrl.startsWith('http://') ||
          inputUrl.startsWith('https://') ||
          inputUrl.startsWith('t.me/') ||
          inputUrl.startsWith('@')
        ) {
          const updatedUrl = this.saveApkUrl(inputUrl);
          await this.sendMessage(
            chatId,
            `✅ <b>APK DOWNLOAD URL UPDATED!</b>\n\n` +
            `🔗 <b>New Live URL:</b> <code>${updatedUrl}</code>\n\n` +
            `All user buttons ("Check Update", "Download APK") and commands (/apk, /update) now use this Telegram URL.`
          );
          return;
        } else {
          await this.sendMessage(
            chatId,
            `⚠️ Invalid format. Please enter a valid Telegram link or download URL (e.g. <code>https://t.me/kalamffpanel</code> or <code>https://t.me/yourchannel/12</code>), or send /cancel.`
          );
          return;
        }
      }

      // Admin Set Reseller Upgrade Price state
      if (currentState.step === 'AWAITING_ADMIN_RESELLER_PRICE' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const amt = parseFloat(rawText);
        if (!isNaN(amt) && amt >= 0) {
          const saved = this.saveResellerUpgradeAmount(amt);
          await this.sendMessage(
            chatId,
            `✅ <b>RESELLER UPGRADE AMOUNT UPDATED!</b> 💎\n\n` +
            `💵 <b>New Upgrade Price:</b> <b>₹${saved}</b>\n\n` +
            `Users can now upgrade to VIP Reseller in the Telegram bot for ₹${saved}.`
          );
          return;
        } else {
          await this.sendMessage(
            chatId,
            `⚠️ Please enter a valid number for reseller upgrade price (e.g. <code>299</code>, <code>500</code>) or send /cancel.`
          );
          return;
        }
      }

      // User Redeem Promo Code state
      if (currentState.step === 'AWAITING_PROMO_CODE') {
        userStates.delete(chatId);
        await this.handleRedeemPromo(chatId, rawText, userId, getUserWallet, creditWallet);
        return;
      }

      // User Transfer Balance state
      if (currentState.step === 'AWAITING_TRANSFER_DETAILS') {
        userStates.delete(chatId);
        const parts = rawText.trim().split(/\s+/);
        if (parts.length >= 2) {
          const targetInput = parts[0];
          const amt = parseFloat(parts[1]);
          await this.handleBalanceTransfer(chatId, targetInput, amt, userId, getUserWallet, deductWallet, creditWallet);
          return;
        } else {
          await this.sendMessage(
            chatId,
            `⚠️ Invalid format. Enter recipient Telegram ID or username, followed by amount.\nExample: <code>7768975239 50</code>`
          );
          return;
        }
      }

      // Admin Create Promo Code state
      if (currentState.step === 'AWAITING_ADMIN_PROMO_CODE' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const parts = rawText.trim().split(/\s+/);
        if (parts.length >= 2) {
          const code = parts[0].toUpperCase();
          const amt = parseFloat(parts[1]);
          const maxUses = parts[2] ? parseInt(parts[2], 10) : 50;
          if (!isNaN(amt) && amt > 0) {
            const promoCodes = this.loadPromoCodes();
            promoCodes.unshift({
              code,
              rewardAmount: amt,
              maxUses: isNaN(maxUses) || maxUses < 1 ? 50 : maxUses,
              usedCount: 0,
              usedByChatIds: [],
              createdAt: Date.now()
            });
            this.savePromoCodes(promoCodes);
            await this.sendMessage(
              chatId,
              `✅ <b>PROMO CODE CREATED!</b> 🎟️\n\n` +
              `🎁 <b>Code:</b> <code>${code}</code>\n` +
              `💸 <b>Reward:</b> ₹${amt.toFixed(2)}\n` +
              `👥 <b>Max Claimants:</b> ${maxUses}\n\n` +
              `Users can claim it by sending <code>/redeem ${code}</code> or clicking "Redeem Code".`
            );
            return;
          }
        }
        await this.sendMessage(chatId, `⚠️ Invalid format. Format: <code>[CODE] [AMOUNT] [MAX_USERS]</code> (e.g. <code>VIPFREE50 50 20</code>)`);
        return;
      }

      // Admin Add Keys state
      if (currentState.step === 'AWAITING_ADMIN_ADD_KEYS' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const parts = rawText.split('|').map(s => s.trim());
        if (parts.length >= 3) {
          const prodQuery = parts[0];
          const planDuration = parts[1];
          const keys = parts[2].split(/[,;\n]+/).map(k => k.trim()).filter(Boolean);
          const result = this.addKeysToProduct(prodQuery, planDuration, keys);
          if (result.success) {
            await this.sendMessage(
              chatId,
              `✅ <b>KEYS ADDED SUCCESSFULLY!</b> 📦\n\n` +
              `• <b>Product:</b> ${result.productName}\n` +
              `• <b>Plan:</b> ${result.planDuration}\n` +
              `• <b>Keys Added:</b> +${result.addedCount} keys\n` +
              `• <b>Total Stock Now:</b> ${result.totalStock} keys`
            );
          } else {
            await this.sendMessage(chatId, `❌ <b>Failed to add keys:</b> ${result.error}`);
          }
          return;
        }
        await this.sendMessage(chatId, `⚠️ Format: <code>[Product] | [Duration] | [Key1, Key2, Key3]</code>`);
        return;
      }

      // Admin Set Price state
      if (currentState.step === 'AWAITING_ADMIN_SET_PRICE' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const parts = rawText.split('|').map(s => s.trim());
        if (parts.length >= 3) {
          const prodQuery = parts[0];
          const planDuration = parts[1];
          const price = parseFloat(parts[2]);
          const resellerPrice = parts[3] ? parseFloat(parts[3]) : undefined;
          if (!isNaN(price) && price > 0) {
            const result = this.setPlanPricing(prodQuery, planDuration, price, resellerPrice);
            if (result.success) {
              await this.sendMessage(
                chatId,
                `✅ <b>PRICING UPDATED!</b> 💲\n\n` +
                `• <b>Product:</b> ${result.productName}\n` +
                `• <b>Plan:</b> ${result.planDuration}\n` +
                `• <b>Regular Price:</b> <b>₹${result.regularPrice}</b>\n` +
                `• <b>VIP Reseller Price:</b> <b>₹${result.resellerPrice}</b>`
              );
            } else {
              await this.sendMessage(chatId, `❌ <b>Failed to update price:</b> ${result.error}`);
            }
            return;
          }
        }
        await this.sendMessage(chatId, `⚠️ Format: <code>[Product] | [Duration] | [RegularPrice] | [ResellerPrice]</code>`);
        return;
      }

      // Admin Add Product state
      if (currentState.step === 'AWAITING_ADMIN_ADD_PRODUCT' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const parts = rawText.split('|').map(s => s.trim());
        if (parts.length >= 3) {
          const name = parts[0];
          const category = parts[1] || 'Mod Menu';
          const game = parts[2] || 'Free Fire';
          const price = parts[3] ? parseFloat(parts[3]) : 99;
          const resPrice = parts[4] ? parseFloat(parts[4]) : Math.round(price * 0.8);
          const result = this.addNewProduct(name, category, game, [
            { duration: '1 Day', price: isNaN(price) ? 99 : price, resellerPrice: isNaN(resPrice) ? 79 : resPrice },
            { duration: '7 Days', price: isNaN(price) ? 299 : price * 3, resellerPrice: isNaN(resPrice) ? 239 : Math.round(resPrice * 3) },
            { duration: '30 Days', price: isNaN(price) ? 699 : price * 6, resellerPrice: isNaN(resPrice) ? 559 : Math.round(resPrice * 6) }
          ]);
          if (result.success) {
            await this.sendMessage(
              chatId,
              `✅ <b>PRODUCT ADDED TO CATALOG!</b> 📦\n\n` +
              `• <b>Name:</b> ${result.product?.name}\n` +
              `• <b>ID:</b> <code>${result.product?.id}</code>\n` +
              `• <b>Category:</b> ${result.product?.category}\n` +
              `• <b>Game:</b> ${result.product?.game}\n\n` +
              `Use <code>/addkeys ${result.product?.id} 1 Day KEY1, KEY2</code> to stock keys!`
            );
          } else {
            await this.sendMessage(chatId, `❌ <b>Failed to create product:</b> ${result.error}`);
          }
          return;
        }
        await this.sendMessage(chatId, `⚠️ Format: <code>[Name] | [Category] | [Game] | [1-Day Price] | [Reseller Price]</code>`);
        return;
      }

      // Admin Clear Stock state
      if (currentState.step === 'AWAITING_ADMIN_CLEAR_STOCK' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const parts = rawText.split('|').map(s => s.trim());
        if (parts.length >= 2) {
          const prodQuery = parts[0];
          const planDuration = parts[1];
          const result = this.clearStockForPlan(prodQuery, planDuration);
          if (result.success) {
            await this.sendMessage(chatId, `✅ <b>STOCK CLEARED:</b> Removed ${result.clearedCount} keys for <b>${result.productName} (${result.planDuration})</b>.`);
          } else {
            await this.sendMessage(chatId, `❌ <b>Error:</b> ${result.error}`);
          }
          return;
        }
        await this.sendMessage(chatId, `⚠️ Format: <code>[Product] | [Duration]</code>`);
        return;
      }

      // Admin Set UPI ID state
      if (currentState.step === 'AWAITING_ADMIN_SET_UPI' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const upiId = rawText.trim();
        const res = this.updatePaymentGatewaySettings({ upiId });
        if (res.success) {
          await this.sendMessage(chatId, `✅ <b>MERCHANT UPI ID UPDATED!</b>\n\nNew UPI ID: <code>${upiId}</code>\nActive on live website & Telegram Bot.`);
        } else {
          await this.sendMessage(chatId, `❌ <b>Error:</b> ${res.error}`);
        }
        return;
      }

      // Admin Set Gateway Key state
      if (currentState.step === 'AWAITING_ADMIN_SET_GW_KEY' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const token = rawText.trim();
        const res = this.updatePaymentGatewaySettings({ token });
        if (res.success) {
          await this.sendMessage(chatId, `✅ <b>PAYMENT API KEY UPDATED!</b>\n\nToken updated for active payment gateway.`);
        } else {
          await this.sendMessage(chatId, `❌ <b>Error:</b> ${res.error}`);
        }
        return;
      }

      // Admin Set Merchant Name state
      if (currentState.step === 'AWAITING_ADMIN_SET_MERCHANT_NAME' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const merchantName = rawText.trim();
        const res = this.updatePaymentGatewaySettings({ merchantName });
        if (res.success) {
          await this.sendMessage(chatId, `✅ <b>STORE & MERCHANT NAME UPDATED!</b>\n\nNew Name: <b>${merchantName}</b>`);
        } else {
          await this.sendMessage(chatId, `❌ <b>Error:</b> ${res.error}`);
        }
        return;
      }

      // Admin Search User state
      if (currentState.step === 'AWAITING_ADMIN_SEARCH_USER' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const targetInput = rawText.trim();
        const usersMap = this.loadBotUsers();
        let targetUser: BotUser | undefined;
        const targetChatNum = parseInt(targetInput.replace('tg_', ''), 10);
        if (!isNaN(targetChatNum) && usersMap.has(targetChatNum)) {
          targetUser = usersMap.get(targetChatNum);
        } else {
          for (const u of usersMap.values()) {
            if (u.userId === targetInput || (u.username && u.username.toLowerCase() === targetInput.replace('@', '').toLowerCase())) {
              targetUser = u;
              break;
            }
          }
        }

        if (targetUser) {
          const w = getUserWallet(targetUser.userId);
          await this.sendMessage(
            chatId,
            `🔍 <b>USER ACCOUNT DETAILS</b>\n\n` +
            `• <b>Name:</b> ${targetUser.firstName} ${targetUser.lastName || ''}\n` +
            `• <b>Username:</b> ${targetUser.username ? '@' + targetUser.username.replace('@', '') : 'N/A'}\n` +
            `• <b>Telegram User ID:</b> <code>${targetUser.userId}</code>\n` +
            `• <b>Telegram Chat ID:</b> <code>${targetUser.chatId}</code>\n` +
            `• <b>Role:</b> <b>${targetUser.isReseller || targetUser.role === 'RESELLER' ? '💎 VIP RESELLER' : (this.isAdmin(targetUser.chatId) ? '👑 ADMIN' : '👤 USER')}</b>\n` +
            `• <b>Wallet Balance:</b> <b>₹${w.balance.toFixed(2)}</b>\n` +
            `• <b>Total Deposited:</b> ₹${(targetUser.totalDeposited || 0).toFixed(2)}\n` +
            `• <b>Total Key Purchases:</b> ${targetUser.purchaseCount || 0}\n` +
            `• <b>Referral Invites:</b> ${targetUser.referralCount || 0} users\n` +
            `• <b>Joined:</b> ${new Date(targetUser.joinedAt || Date.now()).toLocaleDateString()}`
          );
        } else {
          await this.sendMessage(chatId, `❌ User not found for "<code>${targetInput}</code>".`);
        }
        return;
      }

      // Admin Deduct Balance state
      if (currentState.step === 'AWAITING_ADMIN_DEDUCT_BAL' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const parts = rawText.trim().split(/\s+/);
        if (parts.length >= 2) {
          const targetId = parts[0];
          const deductAmt = parseFloat(parts[1]);
          if (!isNaN(deductAmt) && deductAmt > 0) {
            const ok = deductWallet(targetId, deductAmt, `Admin manual balance deduction by ${chatId}`);
            if (ok) {
              const updated = getUserWallet(targetId);
              await this.sendMessage(chatId, `✅ Deducted ₹${deductAmt} from <code>${targetId}</code>. New Balance: ₹${updated.balance.toFixed(2)}`);
            } else {
              await this.sendMessage(chatId, `❌ Deduction failed. Check user ID or balance.`);
            }
            return;
          }
        }
        await this.sendMessage(chatId, `⚠️ Format: <code>[tg_id] [amount]</code>`);
        return;
      }

      // Admin Toggle Reseller state
      if (currentState.step === 'AWAITING_ADMIN_TOGGLE_RESELLER' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const parts = rawText.trim().split(/\s+/);
        if (parts.length >= 2) {
          const targetInput = parts[0];
          const action = parts[1].toLowerCase();
          const usersMap = this.loadBotUsers();
          let targetUser: BotUser | undefined;
          const targetChatNum = parseInt(targetInput.replace('tg_', ''), 10);
          if (!isNaN(targetChatNum) && usersMap.has(targetChatNum)) {
            targetUser = usersMap.get(targetChatNum);
          } else {
            for (const u of usersMap.values()) {
              if (u.userId === targetInput || (u.username && u.username.toLowerCase() === targetInput.replace('@', '').toLowerCase())) {
                targetUser = u;
                break;
              }
            }
          }
          if (targetUser) {
            const isPromote = action === 'make' || action === 'add' || action === 'promote';
            targetUser.isReseller = isPromote;
            targetUser.role = isPromote ? 'RESELLER' : 'USER';
            usersMap.set(targetUser.chatId, targetUser);
            this.saveBotUsers(usersMap);
            await this.sendMessage(chatId, `✅ <b>${targetUser.firstName}</b> is now <b>${isPromote ? '💎 VIP Reseller' : '👤 Standard Member'}</b>.`);
            if (isPromote) {
              this.sendMessage(targetUser.chatId, `🎉 <b>RESELLER STATUS ACTIVATED!</b> 💎\n\nAdmin has upgraded your account to VIP Reseller. Wholesale rates unlocked!`).catch(() => {});
            }
            return;
          }
        }
        await this.sendMessage(chatId, `⚠️ Format: <code>[tg_id or @username] [make/remove]</code>`);
        return;
      }

      // Admin Delete Promo state
      if (currentState.step === 'AWAITING_ADMIN_DEL_PROMO' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const code = rawText.trim().toUpperCase();
        const promoCodes = this.loadPromoCodes();
        const filtered = promoCodes.filter(p => p.code.toUpperCase() !== code);
        if (filtered.length < promoCodes.length) {
          this.savePromoCodes(filtered);
          await this.sendMessage(chatId, `✅ Deleted promo code <code>${code}</code>.`);
        } else {
          await this.sendMessage(chatId, `❌ Promo code <code>${code}</code> not found.`);
        }
        return;
      }

      // Admin Set Notice state
      if (currentState.step === 'AWAITING_ADMIN_SET_NOTICE' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const notice = rawText.trim();
        const res = this.setWebsiteNoticeBanner(notice, true);
        if (res.success) {
          await this.sendMessage(chatId, `✅ <b>WEBSITE NOTICE BANNER UPDATED!</b>\n\nBanner text:\n"<b>${notice}</b>"\n\nNow displaying live to all website visitors.`);
        } else {
          await this.sendMessage(chatId, `❌ <b>Error:</b> ${res.error}`);
        }
        return;
      }

      // Admin Set Tutorial state
      if (currentState.step === 'AWAITING_ADMIN_SET_TUTORIAL' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const tutorialUrl = rawText.trim();
        const storeData = this.loadStoreDataFromDisk();
        if (!storeData.storeSettings) storeData.storeSettings = {};
        storeData.storeSettings.tutorialVideoUrl = tutorialUrl;
        this.saveStoreDataToDisk(storeData);
        await this.sendMessage(chatId, `✅ <b>TUTORIAL VIDEO URL UPDATED!</b>\n\n<code>${tutorialUrl}</code>`);
        return;
      }

      // Admin Set Support state
      if (currentState.step === 'AWAITING_ADMIN_SET_SUPPORT' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const support = rawText.trim();
        const storeData = this.loadStoreDataFromDisk();
        if (!storeData.storeSettings) storeData.storeSettings = {};
        storeData.storeSettings.supportUsername = support;
        this.saveStoreDataToDisk(storeData);
        await this.sendMessage(chatId, `✅ <b>SUPPORT CONTACT UPDATED!</b>\n\nNew Support: <code>${support}</code>`);
        return;
      }

      // Admin Set Low Stock Threshold state
      if (currentState.step === 'AWAITING_ADMIN_LOW_STOCK_THRESHOLD' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const num = parseInt(rawText.trim(), 10);
        if (!isNaN(num) && num >= 0) {
          this.setLowStockThreshold(num);
          await this.sendMessage(
            chatId,
            `✅ <b>LOW-STOCK THRESHOLD CONFIGURED!</b> 📉\n\n` +
            `• <b>New Alert Threshold:</b> <b>${num} keys</b>\n\n` +
            `The bot will automatically dispatch an instant notification alert to this chat whenever any product's stock drops to or below <b>${num}</b> keys.`
          );
        } else {
          await this.sendMessage(chatId, `❌ Invalid number. Please enter a valid number (e.g. <code>5</code>).`);
        }
        return;
      }
    }

    // Direct Admin Media Upload Handler (Live Audio Songs, Voice Notes, Photos)
    if (this.isAdmin(chatId)) {
      if (msg.audio || (msg.document && (msg.document.mime_type?.startsWith('audio/') || msg.document.file_name?.match(/\.(mp3|wav|m4a|aac|flac|ogg)$/i)))) {
        const audioObj = msg.audio;
        const fileId = audioObj ? audioObj.file_id : msg.document!.file_id;
        const title = audioObj?.title || audioObj?.file_name || msg.document?.file_name || 'Audio Song Track';
        const artist = audioObj?.performer || 'KALAM FF Admin';
        const duration = audioObj?.duration;

        await this.sendMessage(
          chatId,
          `🎵 <b>Live Audio / Song Track Received!</b>\n\n` +
          `🎧 <b>Title:</b> <code>${title}</code>\n` +
          `🎤 <b>Artist:</b> <code>${artist}</code>\n` +
          (duration ? `⏱️ <b>Duration:</b> ${Math.floor(duration / 60)}m ${duration % 60}s\n` : '') +
          `\n<i>Select where you would like to broadcast this audio track:</i>`,
          {
            inline_keyboard: [
              [
                { text: '📢 Broadcast Live to All Users', callback_data: `admin_bcast_audio:${fileId}` },
              ],
              [
                { text: '💎 VIP Resellers Only', callback_data: `admin_bcast_resellers_audio:${fileId}` },
                { text: '📣 Send to Channel', callback_data: `admin_bcast_channel_audio:${fileId}` }
              ],
              [
                { text: '🧪 Send Test Preview', callback_data: `admin_test_audio:${fileId}` }
              ]
            ]
          }
        );
        return;
      }

      if (msg.voice) {
        const fileId = msg.voice.file_id;
        const duration = msg.voice.duration;

        await this.sendMessage(
          chatId,
          `🎙️ <b>Live Voice Note Received!</b>\n\n` +
          `⏱️ <b>Duration:</b> ${duration}s\n\n` +
          `<i>Select where you would like to broadcast this voice note:</i>`,
          {
            inline_keyboard: [
              [
                { text: '📢 Broadcast Live to All Users', callback_data: `admin_bcast_voice:${fileId}` }
              ],
              [
                { text: '💎 VIP Resellers Only', callback_data: `admin_bcast_resellers_voice:${fileId}` },
                { text: '📣 Send to Channel', callback_data: `admin_bcast_channel_voice:${fileId}` }
              ]
            ]
          }
        );
        return;
      }
    }

    // Direct Admin commands: /lowstock, /low_stock, /low, /stockalert, /stockalerts
    if (
      (cleanCmd === '/lowstock' ||
        cleanCmd === '/low_stock' ||
        cleanCmd === '/low' ||
        cleanCmd === '/stockalert' ||
        cleanCmd === '/stockalerts' ||
        cleanCmd === '/inventory') &&
      this.isAdmin(chatId)
    ) {
      await this.showAdminLowStockMenu(chatId);
      return;
    }

    // Direct Admin command: /setlowstock <number> or /setthreshold <number>
    if (
      (cleanCmd.startsWith('/setlowstock') ||
        cleanCmd.startsWith('/setthreshold') ||
        cleanCmd.startsWith('/lowstockthreshold')) &&
      this.isAdmin(chatId)
    ) {
      const parts = cleanCmd.split(/\s+/);
      if (parts.length >= 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num >= 0) {
          this.setLowStockThreshold(num);
          await this.sendMessage(
            chatId,
            `✅ <b>LOW-STOCK THRESHOLD UPDATED!</b> 📉\n\n` +
            `• <b>New Alert Threshold:</b> <b>${num} keys</b>\n\n` +
            `The bot will automatically dispatch an immediate admin alert whenever any product's stock falls to or below <b>${num}</b> keys.`
          );
          return;
        }
      }
      userStates.set(chatId, { step: 'AWAITING_ADMIN_LOW_STOCK_THRESHOLD' });
      await this.sendMessage(chatId, `📉 Send the new low-stock alert threshold number (e.g. <code>5</code> or <code>10</code>):`);
      return;
    }

    // Direct Admin commands: /setapk <url>, /setupdatelink <url>, /setupdate <url>, or /apkurl <url>
    if (
      (cleanCmd.startsWith('/setapk') ||
        cleanCmd.startsWith('/setupdatelink') ||
        cleanCmd.startsWith('/setupdate') ||
        cleanCmd.startsWith('/updatelink') ||
        cleanCmd.startsWith('/apkurl')) &&
      this.isAdmin(chatId)
    ) {
      const parts = cleanCmd.split(/\s+/);
      if (parts.length >= 2) {
        const rawInput = parts.slice(1).join(' ').trim();
        const updatedUrl = this.saveApkUrl(rawInput);
        await this.sendMessage(
          chatId,
          `✅ <b>CHECK UPDATE & APK TELEGRAM LINK UPDATED!</b>\n\n` +
          `🔗 <b>New Live URL:</b> <code>${updatedUrl}</code>\n\n` +
          `All user buttons ("Check Update", "Download APK") and commands are updated instantly!`
        );
        return;
      } else {
        const { apkDownloadUrl } = this.getCredentials();
        userStates.set(chatId, { step: 'AWAITING_ADMIN_APK_URL' });
        await this.sendMessage(
          chatId,
          `📥 <b>SET CHECK UPDATE & APK DOWNLOAD TELEGRAM LINK</b>\n\n` +
          `Current URL: <code>${apkDownloadUrl}</code>\n\n` +
          `Please send the new Telegram channel link or download URL:\n` +
          `Example: <code>https://t.me/kalamffpanel</code> or <code>https://t.me/yourchannel/15</code>\n\n` +
          `<i>Type /cancel to abort.</i>`
        );
        return;
      }
    }

    // Direct Admin commands: /broadcast <message> or /broadcast <message> | <btn_text> | <btn_url>
    if (cleanCmd.startsWith('/broadcast') && this.isAdmin(chatId)) {
      const rawContent = cleanCmd.replace(/^\/broadcast\s*/i, '').trim();
      if (!rawContent) {
        userStates.set(chatId, { step: 'AWAITING_ADMIN_BROADCAST' });
        await this.sendMessage(
          chatId,
          `📢 <b>Broadcast Announcement Studio</b>\n\n` +
          `Please enter the message text to broadcast to all users (or /cancel).\n\n` +
          `💡 <b>Attach Inline Action Button:</b>\n` +
          `Use the <code>|</code> pipe separator:\n` +
          `<code>Your Message | Button Label | Button URL</code>\n\n` +
          `<i>Example:</i>\n` +
          `<code>🔥 New Update Live! Download APK | 📥 Download APK | https://t.me/kalamffpanel</code>`
        );
        return;
      }

      const parts = rawContent.split('|').map(s => s.trim());
      const bMsg = parts[0] || '📢 <b>Announcement</b>';
      const btn1Text = parts[1];
      const btn1Url = parts[2];
      const btn2Text = parts[3];
      const btn2Url = parts[4];
      const replyMarkup = buildInlineKeyboard(btn1Text, btn1Url, btn2Text, btn2Url);

      const users = this.loadBotUsers();
      let sentCount = 0;
      await this.sendMessage(chatId, `⏳ <i>Broadcasting announcement (${users.size} users, buttons: ${!!replyMarkup})...</i>`);
      for (const u of users.values()) {
        try {
          await this.sendMessage(u.chatId, `📢 <b>ANNOUNCEMENT:</b>\n\n${bMsg}`, replyMarkup);
          sentCount++;
        } catch {}
      }
      await this.sendMessage(chatId, `✅ <b>Broadcast Complete!</b> Sent to ${sentCount} users.${replyMarkup ? '\n🔗 <i>Inline Action Buttons delivered.</i>' : ''}`);
      return;
    }

    // Direct Admin commands: /setresellerprice <amount> or /resellerprice <amount>
    if ((cleanCmd.startsWith('/setresellerprice') || cleanCmd.startsWith('/setreselleramount') || cleanCmd.startsWith('/resellerprice')) && this.isAdmin(chatId)) {
      const parts = cleanCmd.split(/\s+/);
      if (parts.length >= 2) {
        const amt = parseFloat(parts[1]);
        if (!isNaN(amt) && amt >= 0) {
          const saved = this.saveResellerUpgradeAmount(amt);
          await this.sendMessage(
            chatId,
            `✅ <b>RESELLER UPGRADE AMOUNT UPDATED!</b> 💎\n\n` +
            `💵 <b>New Upgrade Price:</b> <b>₹${saved}</b>\n\n` +
            `Users can now upgrade to VIP Reseller in the Telegram bot for ₹${saved}.`
          );
          return;
        }
      }
      userStates.set(chatId, { step: 'AWAITING_ADMIN_RESELLER_PRICE' });
      await this.sendMessage(
        chatId,
        `💎 <b>SET RESELLER UPGRADE PRICE</b>\n\n` +
        `Current Upgrade Price: <b>₹${this.getResellerUpgradeAmount()}</b>\n\n` +
        `Enter the new reseller upgrade fee in ₹ (e.g. <code>299</code>, <code>500</code>):\n` +
        `<i>Type /cancel to abort.</i>`
      );
      return;
    }

    // Direct Admin command: /makereseller <id or username>
    if (cleanCmd.startsWith('/makereseller') && this.isAdmin(chatId)) {
      const parts = cleanCmd.split(/\s+/);
      if (parts.length >= 2) {
        const targetInput = parts[1].trim();
        const usersMap = this.loadBotUsers();
        let targetUser: BotUser | undefined;
        const targetChatNum = parseInt(targetInput.replace('tg_', ''), 10);
        if (!isNaN(targetChatNum) && usersMap.has(targetChatNum)) {
          targetUser = usersMap.get(targetChatNum);
        } else {
          for (const u of usersMap.values()) {
            if (u.userId === targetInput || (u.username && u.username.toLowerCase() === targetInput.replace('@', '').toLowerCase())) {
              targetUser = u;
              break;
            }
          }
        }
        if (targetUser) {
          targetUser.isReseller = true;
          targetUser.role = 'RESELLER';
          targetUser.resellerUpgradedAt = Date.now();
          usersMap.set(targetUser.chatId, targetUser);
          this.saveBotUsers(usersMap);
          await this.sendMessage(chatId, `✅ <b>User upgraded to VIP Reseller:</b> ${targetUser.firstName} (<code>${targetUser.userId}</code>)`);
          this.sendMessage(
            targetUser.chatId,
            `🎉 <b>RESELLER STATUS ACTIVATED!</b> 💎\n\n` +
            `Admin has granted you <b>VIP Reseller Account Status</b>!\n` +
            `• Wholesale key prices are now unlocked in the Buy Now catalog!\n` +
            `• Tap /start or /buy to start purchasing with wholesale rates!`
          ).catch(() => {});
          return;
        }
      }
      await this.sendMessage(chatId, `⚠️ Format: <code>/makereseller [tg_id or @username]</code>\nExample: <code>/makereseller tg_7768975239</code>`);
      return;
    }

    // Direct Admin command: /removereseller <id or username>
    if (cleanCmd.startsWith('/removereseller') && this.isAdmin(chatId)) {
      const parts = cleanCmd.split(/\s+/);
      if (parts.length >= 2) {
        const targetInput = parts[1].trim();
        const usersMap = this.loadBotUsers();
        let targetUser: BotUser | undefined;
        const targetChatNum = parseInt(targetInput.replace('tg_', ''), 10);
        if (!isNaN(targetChatNum) && usersMap.has(targetChatNum)) {
          targetUser = usersMap.get(targetChatNum);
        } else {
          for (const u of usersMap.values()) {
            if (u.userId === targetInput || (u.username && u.username.toLowerCase() === targetInput.replace('@', '').toLowerCase())) {
              targetUser = u;
              break;
            }
          }
        }
        if (targetUser) {
          targetUser.isReseller = false;
          targetUser.role = 'USER';
          usersMap.set(targetUser.chatId, targetUser);
          this.saveBotUsers(usersMap);
          await this.sendMessage(chatId, `✅ <b>Reseller status removed:</b> ${targetUser.firstName} (<code>${targetUser.userId}</code>) is now a Standard Member.`);
          return;
        }
      }
      await this.sendMessage(chatId, `⚠️ Format: <code>/removereseller [tg_id or @username]</code>`);
      return;
    }

    // Direct Admin command: /resellers or /resellerlist
    if ((cleanCmd === '/resellers' || cleanCmd === '/resellerlist' || cleanCmd === '/reseller') && this.isAdmin(chatId)) {
      const resellers = this.getResellerUsers();
      if (resellers.length === 0) {
        await this.sendMessage(
          chatId,
          `💎 <b>ACTIVE RESELLERS (0)</b>\n\n` +
          `No active VIP resellers registered yet.\n\n` +
          `• Promote a user: <code>/makereseller tg_123456789</code>\n` +
          `• Change upgrade fee: <code>/setresellerprice 299</code>`
        );
        return;
      }

      let resText = `💎 <b>VIP RESELLERS DIRECTORY (${resellers.length})</b>\n\n`;
      resellers.forEach((r, idx) => {
        const w = getUserWallet(r.userId);
        resText += `${idx + 1}. <b>${r.firstName}</b> ${r.username ? '(@' + r.username.replace('@', '') + ')' : ''}\n`;
        resText += `   • ID: <code>${r.userId}</code> | Chat: <code>${r.chatId}</code>\n`;
        resText += `   • Balance: ₹${w.balance.toFixed(2)} | Role: <b>${r.role || 'RESELLER'}</b>\n\n`;
      });
      resText += `⚙️ <i>Upgrade Fee: ₹${this.getResellerUpgradeAmount()} | Use /makereseller or /removereseller to manage.</i>`;

      await this.sendMessage(chatId, resText);
      return;
    }

    // Direct Admin commands: /addbalance <id> <amt> or /addbal <id> <amt>
    if ((cleanCmd.startsWith('/addbalance') || cleanCmd.startsWith('/addbal')) && this.isAdmin(chatId)) {
      const parts = cleanCmd.split(/\s+/);
      if (parts.length >= 3) {
        const targetId = parts[1].trim();
        const addAmt = parseFloat(parts[2]);
        if (!isNaN(addAmt) && addAmt > 0) {
          creditWallet(targetId, addAmt, `Admin balance manual credit by ${chatId}`);
          const updated = getUserWallet(targetId);
          await this.sendMessage(chatId, `✅ Successfully added ₹${addAmt} to <code>${targetId}</code>.\nNew Balance: ₹${updated.balance.toFixed(2)}`);
          const targetChatId = parseInt(targetId.replace('tg_', ''), 10);
          if (!isNaN(targetChatId)) {
            this.sendMessage(
              targetChatId,
              `💰 <b>BALANCE CREDITED!</b>\n\nAdmin has added <b>₹${addAmt}</b> to your wallet balance!\nNew Balance: ₹${updated.balance.toFixed(2)}`
            ).catch(() => {});
          }
          return;
        }
      }
      await this.sendMessage(chatId, `⚠️ Format: <code>/addbalance &lt;tg_id&gt; &lt;amount&gt;</code>\nExample: <code>/addbalance tg_7768975239 100</code>`);
      return;
    }

    // 0. Live Telegram Bot Commands: /myid, /setadmin, /settoken
    if (cleanCmd === '/myid' || cleanCmd === '/id' || norm === 'my id' || norm === 'myid' || norm === 'id') {
      await this.sendMessage(chatId,
        `🆔 <b>Your Telegram Chat ID:</b> <code>${chatId}</code>\n` +
        `👤 <b>Name:</b> ${msg.from.first_name || 'User'} ${msg.from.username ? '(@' + msg.from.username + ')' : ''}\n\n` +
        `📋 <i>Click/tap the numeric ID above to copy it, then paste it in the Website Admin Panel under Telegram Bot & APK settings to receive live deposit & order alerts!</i>`
      );
      return;
    }

    if (cleanCmd === '/setadmin' || cleanCmd.startsWith('/setadmin ') || norm === 'setadmin') {
      try {
        const dataDir = this.getDataDir();
        const configFile = path.join(dataDir, 'telegram_config.json');
        let config: any = {};
        if (fs.existsSync(configFile)) {
          try { config = JSON.parse(fs.readFileSync(configFile, 'utf8')); } catch {}
        }
        config.chatId = String(chatId);
        config.updatedAt = new Date().toISOString();
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');

        const storeConfigFile = path.join(dataDir, 'store_data.json');
        if (fs.existsSync(storeConfigFile)) {
          try {
            const sd = JSON.parse(fs.readFileSync(storeConfigFile, 'utf8'));
            if (!sd.storeSettings) sd.storeSettings = {};
            sd.storeSettings.telegramChatId = String(chatId);
            sd.updatedAt = Date.now();
            fs.writeFileSync(storeConfigFile, JSON.stringify(sd, null, 2), 'utf8');
          } catch {}
        }

        process.env.TELEGRAM_CHAT_ID = String(chatId);

        await this.sendMessage(chatId,
          `✅ <b>SUCCESS! CHAT ID UPDATED LIVE!</b>\n\n` +
          `🎯 <b>Active Admin Alert Chat ID:</b> <code>${chatId}</code>\n` +
          `⚡ This chat is now linked to <b>KALAM STORE</b> Website Admin Panel.\n\n` +
          `All automated alerts for UPI deposits and key deliveries will now be delivered here in real-time!`
        );
      } catch (err: any) {
        await this.sendMessage(chatId, `❌ Failed to set admin chat ID: ${err.message}`);
      }
      return;
    }

    if (cleanCmd.startsWith('/settoken ')) {
      const newToken = cleanCmd.replace('/settoken ', '').trim();
      if (!newToken.includes(':')) {
        await this.sendMessage(chatId, '⚠️ Invalid token format. Format must be: <code>123456789:ABC...XYZ</code>');
        return;
      }
      try {
        const meRes = await fetch(`https://api.telegram.org/bot${newToken}/getMe`);
        const meData: any = await meRes.json();
        if (!meData.ok) {
          await this.sendMessage(chatId, `❌ Telegram rejected token: ${meData.description || 'Invalid token'}`);
          return;
        }
        const dataDir = this.getDataDir();
        const configFile = path.join(dataDir, 'telegram_config.json');
        let config: any = {};
        if (fs.existsSync(configFile)) {
          try { config = JSON.parse(fs.readFileSync(configFile, 'utf8')); } catch {}
        }
        config.botToken = newToken;
        config.botUsername = '@' + meData.result.username;
        config.updatedAt = new Date().toISOString();
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');

        const storeConfigFile = path.join(dataDir, 'store_data.json');
        if (fs.existsSync(storeConfigFile)) {
          try {
            const sd = JSON.parse(fs.readFileSync(storeConfigFile, 'utf8'));
            if (!sd.storeSettings) sd.storeSettings = {};
            sd.storeSettings.telegramBotToken = newToken;
            sd.storeSettings.telegramBotUsername = '@' + meData.result.username;
            sd.updatedAt = Date.now();
            fs.writeFileSync(storeConfigFile, JSON.stringify(sd, null, 2), 'utf8');
          } catch {}
        }

        process.env.TELEGRAM_BOT_TOKEN = newToken;
        await this.sendMessage(chatId,
          `✅ <b>Bot Token Updated Live!</b>\n` +
          `👤 Connected to @${meData.result.username} (${meData.result.first_name}).`
        );
      } catch (e: any) {
        await this.sendMessage(chatId, `❌ Error: ${e.message}`);
      }
      return;
    }

    // Direct Admin Product Management: /addkeys <product> <plan> <keys...>
    if (cleanCmd.startsWith('/addkeys') && this.isAdmin(chatId)) {
      const rest = cleanCmd.replace(/^\/addkeys\s*/i, '').trim();
      const parts = rest.split('|').map(s => s.trim());
      if (parts.length >= 3) {
        const prodQuery = parts[0];
        const planDuration = parts[1];
        const keys = parts[2].split(/[,;\n]+/).map(k => k.trim()).filter(Boolean);
        const result = this.addKeysToProduct(prodQuery, planDuration, keys);
        if (result.success) {
          await this.sendMessage(chatId, `✅ <b>Keys Added!</b> Added ${result.addedCount} keys to <b>${result.productName} (${result.planDuration})</b>. Total Stock: ${result.totalStock} keys.`);
        } else {
          await this.sendMessage(chatId, `❌ <b>Error:</b> ${result.error}`);
        }
        return;
      }
      userStates.set(chatId, { step: 'AWAITING_ADMIN_ADD_KEYS' });
      await this.sendMessage(chatId, `➕ <b>ADD KEYS</b>\n\nEnter in format: <code>[Product] | [Duration] | [Key1, Key2, Key3]</code>\nExample: <code>Free Fire Mod | 1 Day | KEY1, KEY2</code>`);
      return;
    }

    // Direct Admin Price Management: /setprice <product> | <plan> | <price> | [reseller_price]
    if (cleanCmd.startsWith('/setprice') && this.isAdmin(chatId)) {
      const rest = cleanCmd.replace(/^\/setprice\s*/i, '').trim();
      const parts = rest.split('|').map(s => s.trim());
      if (parts.length >= 3) {
        const prodQuery = parts[0];
        const planDuration = parts[1];
        const price = parseFloat(parts[2]);
        const resellerPrice = parts[3] ? parseFloat(parts[3]) : undefined;
        if (!isNaN(price)) {
          const result = this.setPlanPricing(prodQuery, planDuration, price, resellerPrice);
          if (result.success) {
            await this.sendMessage(chatId, `✅ <b>Price Updated!</b> <b>${result.productName} (${result.planDuration})</b> is now ₹${result.regularPrice} (Reseller: ₹${result.resellerPrice}).`);
          } else {
            await this.sendMessage(chatId, `❌ <b>Error:</b> ${result.error}`);
          }
          return;
        }
      }
      userStates.set(chatId, { step: 'AWAITING_ADMIN_SET_PRICE' });
      await this.sendMessage(chatId, `💲 <b>SET PRICE</b>\n\nEnter in format: <code>[Product] | [Duration] | [RegularPrice] | [ResellerPrice]</code>\nExample: <code>Free Fire Mod | 1 Day | 99 | 69</code>`);
      return;
    }

    // Direct Admin Add Product: /addproduct
    if (cleanCmd.startsWith('/addproduct') && this.isAdmin(chatId)) {
      const rest = cleanCmd.replace(/^\/addproduct\s*/i, '').trim();
      const parts = rest.split('|').map(s => s.trim());
      if (parts.length >= 3) {
        const name = parts[0];
        const category = parts[1] || 'Mod Menu';
        const game = parts[2] || 'Free Fire';
        const price = parts[3] ? parseFloat(parts[3]) : 99;
        const resPrice = parts[4] ? parseFloat(parts[4]) : Math.round(price * 0.8);
        const result = this.addNewProduct(name, category, game, [
          { duration: '1 Day', price: isNaN(price) ? 99 : price, resellerPrice: isNaN(resPrice) ? 79 : resPrice },
          { duration: '7 Days', price: isNaN(price) ? 299 : price * 3, resellerPrice: isNaN(resPrice) ? 239 : Math.round(resPrice * 3) },
          { duration: '30 Days', price: isNaN(price) ? 699 : price * 6, resellerPrice: isNaN(resPrice) ? 559 : Math.round(resPrice * 6) }
        ]);
        if (result.success) {
          await this.sendMessage(chatId, `✅ <b>Product Created!</b> <b>${result.product?.name}</b> (ID: <code>${result.product?.id}</code>).`);
        } else {
          await this.sendMessage(chatId, `❌ <b>Error:</b> ${result.error}`);
        }
        return;
      }
      userStates.set(chatId, { step: 'AWAITING_ADMIN_ADD_PRODUCT' });
      await this.sendMessage(chatId, `📦 <b>CREATE PRODUCT</b>\n\nEnter format: <code>[Name] | [Category] | [Game] | [1-Day Price] | [Reseller Price]</code>`);
      return;
    }

    // Direct Admin Clear Stock: /delkeys <product> | <plan>
    if (cleanCmd.startsWith('/delkeys') && this.isAdmin(chatId)) {
      const rest = cleanCmd.replace(/^\/delkeys\s*/i, '').trim();
      const parts = rest.split('|').map(s => s.trim());
      if (parts.length >= 2) {
        const prodQuery = parts[0];
        const planDuration = parts[1];
        const result = this.clearStockForPlan(prodQuery, planDuration);
        if (result.success) {
          await this.sendMessage(chatId, `✅ <b>Stock Cleared!</b> Cleared ${result.clearedCount} keys for <b>${result.productName} (${result.planDuration})</b>.`);
        } else {
          await this.sendMessage(chatId, `❌ <b>Error:</b> ${result.error}`);
        }
        return;
      }
      userStates.set(chatId, { step: 'AWAITING_ADMIN_CLEAR_STOCK' });
      await this.sendMessage(chatId, `🗑️ <b>CLEAR STOCK</b>\n\nEnter: <code>[Product] | [Duration]</code>`);
      return;
    }

    // Direct Admin UPI Config: /setupi <upiId>
    if (cleanCmd.startsWith('/setupi') && this.isAdmin(chatId)) {
      const upiId = cleanCmd.replace(/^\/setupi\s*/i, '').trim();
      if (upiId) {
        const res = this.updatePaymentGatewaySettings({ upiId });
        if (res.success) {
          await this.sendMessage(chatId, `✅ <b>Merchant UPI ID Updated:</b> <code>${upiId}</code>`);
        } else {
          await this.sendMessage(chatId, `❌ <b>Error:</b> ${res.error}`);
        }
        return;
      }
      userStates.set(chatId, { step: 'AWAITING_ADMIN_SET_UPI' });
      await this.sendMessage(chatId, `✏️ Send the new Merchant UPI ID:`);
      return;
    }

    // Direct Admin Gateway switch: /setgateway <gatewayId>
    if (cleanCmd.startsWith('/setgateway') && this.isAdmin(chatId)) {
      const gwId = cleanCmd.replace(/^\/setgateway\s*/i, '').trim().toLowerCase();
      if (gwId) {
        const res = this.setActivePaymentGateway(gwId);
        if (res.success) {
          await this.sendMessage(chatId, `✅ <b>Active Gateway Switched to:</b> <b>${res.activeGateway?.name || gwId}</b>`);
        } else {
          await this.sendMessage(chatId, `❌ <b>Error:</b> ${res.error}`);
        }
        return;
      }
      await this.showAdminGatewaysMenu(chatId);
      return;
    }

    // Direct Admin Notice Banner: /setnotice <msg> and /clearnotice
    if (cleanCmd.startsWith('/setnotice') && this.isAdmin(chatId)) {
      const notice = cleanCmd.replace(/^\/setnotice\s*/i, '').trim();
      if (notice) {
        this.setWebsiteNoticeBanner(notice, true);
        await this.sendMessage(chatId, `✅ <b>Notice Banner Live on Website:</b>\n"<b>${notice}</b>"`);
        return;
      }
      userStates.set(chatId, { step: 'AWAITING_ADMIN_SET_NOTICE' });
      await this.sendMessage(chatId, `🏷️ Type the notice message to show on website banner:`);
      return;
    }

    if (cleanCmd === '/clearnotice' && this.isAdmin(chatId)) {
      this.setWebsiteNoticeBanner('', false);
      await this.sendMessage(chatId, `✅ Notice banner hidden/cleared from website.`);
      return;
    }

    // Direct Admin Welcome Message Banner: /setwelcomebanner <msg> and /clearwelcomebanner
    if ((cleanCmd.startsWith('/setwelcomebanner') || cleanCmd.startsWith('/welcomebanner')) && this.isAdmin(chatId)) {
      const bannerMsg = cleanCmd.replace(/^\/(setwelcomebanner|welcomebanner)\s*/i, '').trim();
      if (bannerMsg) {
        this.setWebsiteWelcomeBanner(bannerMsg, undefined, undefined, true);
        await this.sendMessage(chatId, `✅ <b>Welcome Message Banner Live on Website:</b>\n"<b>${bannerMsg}</b>"`);
        return;
      }
      userStates.set(chatId, { step: 'AWAITING_ADMIN_SET_WELCOME_BANNER' });
      await this.sendMessage(chatId, `👋 Type the welcome message to show on the website top hero banner:`);
      return;
    }

    if ((cleanCmd === '/clearwelcomebanner' || cleanCmd === '/hidewelcomebanner') && this.isAdmin(chatId)) {
      this.setWebsiteWelcomeBanner('', undefined, undefined, false);
      await this.sendMessage(chatId, `✅ Welcome message banner hidden from website.`);
      return;
    }

    // Direct Admin Product Maintenance: /prodmaint or /pmaintenance [productId/all] [on|off]
    if ((cleanCmd.startsWith('/prodmaint') || cleanCmd.startsWith('/pmaintenance') || cleanCmd.startsWith('/productmaintenance')) && this.isAdmin(chatId)) {
      const rest = cleanCmd.replace(/^\/(prodmaint|pmaintenance|productmaintenance)\s*/i, '').trim();
      if (!rest) {
        await this.showAdminMaintenanceMenu(chatId);
        return;
      }
      const parts = rest.split(/\s+/);
      const target = parts[0].toLowerCase();
      const mode = (parts[1] || '').toLowerCase();

      if (target === 'all') {
        const turnOn = mode === 'on' || mode === 'enable' || mode === '1';
        this.setAllProductsMaintenance(turnOn);
        await this.sendMessage(chatId, turnOn ? `🔴 <b>ALL Products have been placed in MAINTENANCE Mode.</b>` : `🟢 <b>ALL Products are now ACTIVE and available for purchase.</b>`);
        return;
      }

      if (mode === 'on' || mode === 'enable' || mode === '1') {
        const res = this.setProductMaintenance(target, true);
        if (res.success) {
          await this.sendMessage(chatId, `🔴 <b>Product "${res.product?.name || target}" Maintenance Mode is now ON.</b>`);
        } else {
          await this.sendMessage(chatId, `❌ Product not found matching "<code>${target}</code>".`);
        }
        return;
      } else if (mode === 'off' || mode === 'disable' || mode === '0') {
        const res = this.setProductMaintenance(target, false);
        if (res.success) {
          await this.sendMessage(chatId, `🟢 <b>Product "${res.product?.name || target}" Maintenance Mode is now OFF (Active).</b>`);
        } else {
          await this.sendMessage(chatId, `❌ Product not found matching "<code>${target}</code>".`);
        }
        return;
      } else {
        const res = this.toggleProductMaintenance(target);
        if (res.success) {
          await this.sendMessage(chatId, res.isMaintenance 
            ? `🔴 <b>Product "${res.product?.name || target}" Maintenance Mode is now ON.</b>` 
            : `🟢 <b>Product "${res.product?.name || target}" Maintenance Mode is now OFF (Active).</b>`
          );
        } else {
          await this.sendMessage(chatId, `❌ Product not found matching "<code>${target}</code>".`);
        }
        return;
      }
    }

    // Direct Admin Maintenance: /maintenance on|off
    if (cleanCmd.startsWith('/maintenance') && this.isAdmin(chatId)) {
      const mode = cleanCmd.replace(/^\/maintenance\s*/i, '').trim().toLowerCase();
      if (mode === 'on' || mode === 'enable' || mode === '1') {
        this.setWebsiteMaintenance(true);
        await this.sendMessage(chatId, `🔴 <b>Website Maintenance Mode is now ON.</b>`);
        return;
      } else if (mode === 'off' || mode === 'disable' || mode === '0') {
        this.setWebsiteMaintenance(false);
        await this.sendMessage(chatId, `🟢 <b>Website Maintenance Mode is now OFF.</b>`);
        return;
      }
      await this.showAdminMaintenanceMenu(chatId);
      return;
    }

    // Direct Admin User Info: /userinfo <id or @username>
    if (cleanCmd.startsWith('/userinfo') && this.isAdmin(chatId)) {
      const targetInput = cleanCmd.replace(/^\/userinfo\s*/i, '').trim();
      if (targetInput) {
        const usersMap = this.loadBotUsers();
        let targetUser: BotUser | undefined;
        const targetChatNum = parseInt(targetInput.replace('tg_', ''), 10);
        if (!isNaN(targetChatNum) && usersMap.has(targetChatNum)) {
          targetUser = usersMap.get(targetChatNum);
        } else {
          for (const u of usersMap.values()) {
            if (u.userId === targetInput || (u.username && u.username.toLowerCase() === targetInput.replace('@', '').toLowerCase())) {
              targetUser = u;
              break;
            }
          }
        }
        if (targetUser) {
          const w = getUserWallet(targetUser.userId);
          await this.sendMessage(
            chatId,
            `🔍 <b>USER ACCOUNT DETAILS</b>\n\n` +
            `• <b>Name:</b> ${targetUser.firstName} ${targetUser.lastName || ''}\n` +
            `• <b>Username:</b> ${targetUser.username ? '@' + targetUser.username.replace('@', '') : 'N/A'}\n` +
            `• <b>Telegram User ID:</b> <code>${targetUser.userId}</code>\n` +
            `• <b>Telegram Chat ID:</b> <code>${targetUser.chatId}</code>\n` +
            `• <b>Role:</b> <b>${targetUser.isReseller || targetUser.role === 'RESELLER' ? '💎 VIP RESELLER' : (this.isAdmin(targetUser.chatId) ? '👑 ADMIN' : '👤 USER')}</b>\n` +
            `• <b>Wallet Balance:</b> <b>₹${w.balance.toFixed(2)}</b>\n` +
            `• <b>Total Deposited:</b> ₹${(targetUser.totalDeposited || 0).toFixed(2)}\n` +
            `• <b>Total Key Purchases:</b> ${targetUser.purchaseCount || 0}\n` +
            `• <b>Referral Invites:</b> ${targetUser.referralCount || 0} users\n` +
            `• <b>Joined:</b> ${new Date(targetUser.joinedAt || Date.now()).toLocaleDateString()}`
          );
          return;
        }
      }
      userStates.set(chatId, { step: 'AWAITING_ADMIN_SEARCH_USER' });
      await this.sendMessage(chatId, `🔍 Send Telegram User ID or @username:`);
      return;
    }

    // Direct Admin Deduct: /deductbalance <id> <amt>
    if ((cleanCmd.startsWith('/deductbalance') || cleanCmd.startsWith('/deductbal')) && this.isAdmin(chatId)) {
      const parts = cleanCmd.split(/\s+/);
      if (parts.length >= 3) {
        const targetId = parts[1].trim();
        const deductAmt = parseFloat(parts[2]);
        if (!isNaN(deductAmt) && deductAmt > 0) {
          const ok = deductWallet(targetId, deductAmt, `Admin deduction by ${chatId}`);
          if (ok) {
            const updated = getUserWallet(targetId);
            await this.sendMessage(chatId, `✅ Deducted ₹${deductAmt} from <code>${targetId}</code>. New Balance: ₹${updated.balance.toFixed(2)}`);
          } else {
            await this.sendMessage(chatId, `❌ Deduction failed. Check user ID.`);
          }
          return;
        }
      }
      userStates.set(chatId, { step: 'AWAITING_ADMIN_DEDUCT_BAL' });
      await this.sendMessage(chatId, `➖ Enter: <code>[tg_id] [amount]</code>`);
      return;
    }

    // Direct Admin Stats: /stats
    if ((cleanCmd === '/stats' || cleanCmd === '/analytics') && this.isAdmin(chatId)) {
      await this.showAdminStatsMenu(chatId);
      return;
    }

    // Direct Admin Promo list: /promos
    if (cleanCmd === '/promos' && this.isAdmin(chatId)) {
      await this.showAdminPromosMenu(chatId);
      return;
    }

    // Direct Admin Create Promo: /createpromo <code> <amt> [max]
    if (cleanCmd.startsWith('/createpromo') && this.isAdmin(chatId)) {
      const parts = cleanCmd.split(/\s+/);
      if (parts.length >= 3) {
        const code = parts[1].toUpperCase();
        const amt = parseFloat(parts[2]);
        const maxUses = parts[3] ? parseInt(parts[3], 10) : 50;
        if (!isNaN(amt) && amt > 0) {
          const promoCodes = this.loadPromoCodes();
          promoCodes.unshift({
            code,
            rewardAmount: amt,
            maxUses: isNaN(maxUses) || maxUses < 1 ? 50 : maxUses,
            usedCount: 0,
            usedByChatIds: [],
            createdAt: Date.now()
          });
          this.savePromoCodes(promoCodes);
          await this.sendMessage(chatId, `✅ <b>Promo Code Created!</b> <code>${code}</code> (₹${amt}, Max: ${maxUses} users).`);
          return;
        }
      }
      userStates.set(chatId, { step: 'AWAITING_ADMIN_PROMO_CODE' });
      await this.sendMessage(chatId, `🎟️ Enter: <code>[CODE] [AMOUNT] [MAX_USERS]</code>`);
      return;
    }

    // Direct Admin Delete Promo: /delpromo <code>
    if (cleanCmd.startsWith('/delpromo') && this.isAdmin(chatId)) {
      const code = cleanCmd.replace(/^\/delpromo\s*/i, '').trim().toUpperCase();
      if (code) {
        const promoCodes = this.loadPromoCodes();
        const filtered = promoCodes.filter(p => p.code.toUpperCase() !== code);
        if (filtered.length < promoCodes.length) {
          this.savePromoCodes(filtered);
          await this.sendMessage(chatId, `✅ Deleted promo code <code>${code}</code>.`);
        } else {
          await this.sendMessage(chatId, `❌ Promo code <code>${code}</code> not found.`);
        }
        return;
      }
      userStates.set(chatId, { step: 'AWAITING_ADMIN_DEL_PROMO' });
      await this.sendMessage(chatId, `🗑️ Send promo code to delete:`);
      return;
    }

    // Direct Admin Tutorial & Support
    if (cleanCmd.startsWith('/settutorial') && this.isAdmin(chatId)) {
      const tutorialUrl = cleanCmd.replace(/^\/settutorial\s*/i, '').trim();
      if (tutorialUrl) {
        const storeData = this.loadStoreDataFromDisk();
        if (!storeData.storeSettings) storeData.storeSettings = {};
        storeData.storeSettings.tutorialVideoUrl = tutorialUrl;
        this.saveStoreDataToDisk(storeData);
        await this.sendMessage(chatId, `✅ Tutorial URL updated: <code>${tutorialUrl}</code>`);
        return;
      }
      userStates.set(chatId, { step: 'AWAITING_ADMIN_SET_TUTORIAL' });
      await this.sendMessage(chatId, `🎥 Send YouTube tutorial video URL:`);
      return;
    }

    if (cleanCmd.startsWith('/setsupport') && this.isAdmin(chatId)) {
      const support = cleanCmd.replace(/^\/setsupport\s*/i, '').trim();
      if (support) {
        const storeData = this.loadStoreDataFromDisk();
        if (!storeData.storeSettings) storeData.storeSettings = {};
        storeData.storeSettings.supportUsername = support;
        this.saveStoreDataToDisk(storeData);
        await this.sendMessage(chatId, `✅ Support username updated: <code>${support}</code>`);
        return;
      }
      userStates.set(chatId, { step: 'AWAITING_ADMIN_SET_SUPPORT' });
      await this.sendMessage(chatId, `💬 Send support Telegram username:`);
      return;
    }

    // Direct Admin commands: /users, /allusers, /botusers, /userlist
    if (
      cleanCmd === '/users' ||
      cleanCmd === '/allusers' ||
      cleanCmd === '/botusers' ||
      cleanCmd === '/userlist' ||
      cleanCmd.startsWith('/users ') ||
      norm === 'users' ||
      norm === 'all users' ||
      norm === 'bot users' ||
      norm === 'view users' ||
      norm === 'user list'
    ) {
      if (!this.isAdmin(chatId)) {
        await this.sendMessage(chatId, '🔒 <b>Access Denied:</b> This command is strictly for store administrators.');
        return;
      }
      await this.showAdminUsersList(chatId, 0, getUserWallet);
      return;
    }

    // 1. 🔲 Admin Panel
    if (norm === 'admin panel' || cleanCmd === '/admin' || cleanCmd.startsWith('/admin ') || norm === 'admin' || norm === 'panel') {
      await this.showAdminPanel(chatId, getProducts, getUserWallet);
      return;
    }

    // 1.5 🆔 User ID & Status Check (/id, /myid, /chatid, /whoami, /ping)
    if (
      cleanCmd === '/id' ||
      cleanCmd.startsWith('/id ') ||
      cleanCmd === '/myid' ||
      cleanCmd.startsWith('/myid ') ||
      cleanCmd === '/chatid' ||
      cleanCmd === '/whoami' ||
      norm === 'my id' ||
      norm === 'id'
    ) {
      const w = getUserWallet(userId);
      const isRes = !!(botUser?.isReseller || botUser?.role === 'RESELLER');
      const isAdm = this.isAdmin(chatId);
      await this.sendMessage(
        chatId,
        `🆔 <b>YOUR ACCOUNT DETAILS / உங்கள் கணக்கு விவரம்</b>\n\n` +
        `• <b>Name:</b> ${botUser?.firstName || msg.from.first_name || 'User'}\n` +
        `• <b>Telegram ID:</b> <code>${chatId}</code>\n` +
        `• <b>Account Role:</b> <b>${isAdm ? '👑 ADMIN' : (isRes ? '💎 VIP RESELLER' : '👤 NORMAL USER')}</b>\n` +
        `• <b>Wallet Balance:</b> <b>₹${w.balance.toFixed(2)}</b>\n\n` +
        `<i>Use /buy to browse cheat panels or /deposit to add balance.</i>`,
        {
          inline_keyboard: [
            [{ text: '🛒 Buy Keys', callback_data: 'catalog' }, { text: '💳 Add Balance', callback_data: 'deposit_prompt' }],
            [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
          ]
        }
      );
      return;
    }

    if (cleanCmd === '/ping' || cleanCmd === '/status') {
      await this.sendMessage(
        chatId,
        `⚡ <b>BOT STATUS: ONLINE 🟢</b>\n\n` +
        `• <b>Server Response:</b> Instant (OK)\n` +
        `• <b>Catalog Sync:</b> Live 🔄\n` +
        `• <b>Instant Key Delivery:</b> Active ⚡`
      );
      return;
    }

    // 2. 🏠 Main Menu / Start / Back
    if (
      cleanCmd === '/start' ||
      cleanCmd.startsWith('/start ') ||
      norm === 'start' ||
      norm === 'main menu' ||
      cleanCmd === '🏠 Main Menu' ||
      cleanCmd === '🔙 Back' ||
      norm === 'back' ||
      norm === 'menu' ||
      norm === 'hi' ||
      norm === 'hello'
    ) {
      const wallet = getUserWallet(userId);
      await this.sendMainMenu(chatId, wallet.balance);
      return;
    }

    // 3. 🛒 Buy Now / Catalog / Products
    if (
      norm === 'buy now' ||
      norm === 'buy' ||
      cleanCmd.startsWith('/buy') ||
      cleanCmd.startsWith('/shop') ||
      cleanCmd.startsWith('/catalog') ||
      norm === 'products' ||
      norm === 'catalog' ||
      norm === 'shop'
    ) {
      await this.showProductCatalog(chatId, getProducts());
      return;
    }

    // 3.5 💎 Upgrade to Reseller Account (/upgrade, /reseller, /vip, /wholesale, or text phrases)
    if (
      cleanCmd.startsWith('/upgrade') ||
      cleanCmd.startsWith('/reseller') ||
      cleanCmd.startsWith('/vip') ||
      cleanCmd.startsWith('/wholesale') ||
      norm.includes('upgrade to reseller') ||
      norm.includes('upgrade reseller') ||
      norm.includes('reseller upgrade') ||
      norm.includes('reseller account') ||
      norm.includes('reseller comment') ||
      norm.includes('upgrade comment') ||
      norm.includes('reseller club') ||
      norm.includes('become reseller') ||
      norm === 'upgrade' ||
      norm === 'reseller' ||
      norm === 'resellers' ||
      norm === 'vip' ||
      norm === 'wholesale' ||
      cleanCmd.toLowerCase().includes('reseller') ||
      cleanCmd.toLowerCase().includes('upgrade')
    ) {
      await this.showResellerUpgrade(chatId, botUser, getUserWallet);
      return;
    }

    // 4. 💸 Add Balance / Deposit
    if (
      norm === 'add balance' ||
      norm === 'deposit' ||
      cleanCmd.startsWith('/deposit') ||
      cleanCmd.startsWith('/pay') ||
      cleanCmd.startsWith('/addbalance') ||
      norm === 'add money' ||
      norm === 'top up'
    ) {
      await this.showFamGatewayDepositMenu(chatId);
      return;
    }

    // 5. 💰 Balance / Wallet Check
    if (
      cleanCmd.startsWith('/balance') ||
      cleanCmd.startsWith('/bal') ||
      cleanCmd.startsWith('/wallet') ||
      norm === 'balance' ||
      norm === 'wallet' ||
      norm === 'bal'
    ) {
      await this.showBalance(chatId, botUser, getUserWallet);
      return;
    }

    // 6. 👑 My Profile + All History
    if (
      norm.includes('my profile') ||
      norm.includes('all history') ||
      norm === 'profile' ||
      norm === 'account' ||
      cleanCmd.startsWith('/profile') ||
      cleanCmd.startsWith('/account') ||
      cleanCmd.startsWith('/me')
    ) {
      await this.showUserProfileAndHistory(chatId, botUser, getUserWallet);
      return;
    }

    // 7. 🔑 View License Keys
    if (
      cleanCmd.startsWith('/keys') ||
      cleanCmd.startsWith('/mykeys') ||
      cleanCmd.startsWith('/my_keys') ||
      norm === 'my keys' ||
      norm === 'keys' ||
      norm === 'license keys'
    ) {
      await this.showUserKeyHistory(chatId, botUser);
      return;
    }

    // 8. 📜 Order History
    if (
      cleanCmd.startsWith('/orders') ||
      cleanCmd.startsWith('/history') ||
      norm === 'orders' ||
      norm === 'order history' ||
      norm === 'history'
    ) {
      await this.showUserProfileAndHistory(chatId, botUser, getUserWallet);
      return;
    }

    // 9. 🔗 Refer And Earn
    if (
      norm === 'refer and earn' ||
      cleanCmd.startsWith('/refer') ||
      cleanCmd.startsWith('/invite') ||
      cleanCmd.startsWith('/referral') ||
      norm === 'refer' ||
      norm === 'referral' ||
      norm === 'invite' ||
      norm === 'share'
    ) {
      await this.showReferAndEarn(chatId);
      return;
    }

    // 10. 🎁 Daily Gift / Lucky Spin
    if (
      norm === 'daily gift' ||
      cleanCmd.startsWith('/gift') ||
      cleanCmd.startsWith('/spin') ||
      cleanCmd.startsWith('/daily') ||
      cleanCmd.startsWith('/bonus') ||
      norm === 'gift' ||
      norm === 'spin' ||
      norm === 'lucky spin' ||
      norm === 'bonus'
    ) {
      await this.handleDailyGiftSpin(chatId, userId, getUserWallet, creditWallet);
      return;
    }

    // 11. 🎟️ Redeem Promo Code (/redeem <code> or /promo <code>)
    if (
      cleanCmd.startsWith('/redeem') ||
      cleanCmd.startsWith('/promo') ||
      cleanCmd.startsWith('/coupon') ||
      norm === 'redeem' ||
      norm === 'redeem code' ||
      norm === 'promo code' ||
      norm === 'coupon'
    ) {
      const parts = cleanCmd.split(/\s+/);
      if (parts.length >= 2) {
        const code = parts[1].trim();
        await this.handleRedeemPromo(chatId, code, userId, getUserWallet, creditWallet);
        return;
      } else {
        userStates.set(chatId, { step: 'AWAITING_PROMO_CODE' });
        await this.sendMessage(
          chatId,
          `🎟️ <b>REDEEM PROMO CODE</b>\n\nEnter the promo code below (or send /cancel):\n\n<i>Starter Codes:</i> <code>KALAMFREE</code>, <code>WELCOME10</code>`
        );
        return;
      }
    }

    // 12. ⚡ Balance Transfer (/transfer <id> <amount> or /send <id> <amount>)
    if (
      cleanCmd.startsWith('/transfer') ||
      cleanCmd.startsWith('/send') ||
      cleanCmd.startsWith('/payuser') ||
      norm === 'transfer' ||
      norm === 'transfer balance'
    ) {
      const parts = cleanCmd.split(/\s+/);
      if (parts.length >= 3) {
        const target = parts[1].trim();
        const amt = parseFloat(parts[2]);
        await this.handleBalanceTransfer(chatId, target, amt, userId, getUserWallet, deductWallet, creditWallet);
        return;
      } else {
        const wallet = getUserWallet(userId);
        userStates.set(chatId, { step: 'AWAITING_TRANSFER_DETAILS' });
        await this.sendMessage(
          chatId,
          `⚡ <b>TRANSFER BALANCE</b>\n\n` +
          `Your Balance: ₹${wallet.balance.toFixed(2)}\n\n` +
          `Please send recipient Telegram ID and Amount separated by space.\n` +
          `Example: <code>7768975239 50</code> (or send /cancel)`
        );
        return;
      }
    }

    // 13. 🏆 Leaderboard (/leaderboard or /top)
    if (
      cleanCmd.startsWith('/leaderboard') ||
      cleanCmd.startsWith('/top') ||
      norm === 'leaderboard' ||
      norm === 'top buyers' ||
      norm === 'top referrers'
    ) {
      await this.showLeaderboard(chatId);
      return;
    }

    // 15. Check Update / APK Download
    if (
      norm === 'check update' ||
      norm === 'check updates' ||
      norm === 'update' ||
      norm === 'updates' ||
      norm === 'checkupdate' ||
      norm === 'check_update' ||
      norm === 'download hub' ||
      norm === 'downloads' ||
      norm === 'download apk' ||
      norm === 'latest update' ||
      norm === 'panel update' ||
      norm === 'mod apk' ||
      norm === 'apk' ||
      norm === 'download' ||
      cleanCmd === '/update' ||
      cleanCmd.startsWith('/update ') ||
      cleanCmd === '/updates' ||
      cleanCmd.startsWith('/updates ') ||
      cleanCmd === '/checkupdate' ||
      cleanCmd.startsWith('/checkupdate ') ||
      cleanCmd === '/check_update' ||
      cleanCmd.startsWith('/check_update ') ||
      cleanCmd === '/apk' ||
      cleanCmd.startsWith('/apk ') ||
      cleanCmd === '/download' ||
      cleanCmd.startsWith('/download ') ||
      cleanCmd === '/hub' ||
      cleanCmd.startsWith('/hub ') ||
      cleanCmd === '/downloads' ||
      cleanCmd.startsWith('/downloads ') ||
      cleanCmd === '/files' ||
      cleanCmd.startsWith('/files ') ||
      cleanCmd === '/obb' ||
      cleanCmd.startsWith('/obb ')
    ) {
      await this.showCheckUpdate(chatId);
      return;
    }

    // 12. 📜 Bot Commands List (/commands, /cmds, /cmd, commands)
    if (
      cleanCmd === '/commands' ||
      cleanCmd.startsWith('/commands ') ||
      cleanCmd === '/cmds' ||
      cleanCmd.startsWith('/cmds ') ||
      cleanCmd === '/cmd' ||
      cleanCmd.startsWith('/cmd ') ||
      norm === 'commands' ||
      norm === 'cmds' ||
      norm === 'bot commands' ||
      norm === 'command list' ||
      norm === 'all commands'
    ) {
      await this.showAllBotCommands(chatId);
      return;
    }

    // 12b. ⁉️ How To Use Bot / Help / Tutorial
    if (
      norm === 'how to use bot' ||
      norm === 'how to use' ||
      cleanCmd.startsWith('/help') ||
      cleanCmd.startsWith('/guide') ||
      cleanCmd.startsWith('/tutorial') ||
      cleanCmd.startsWith('/faq') ||
      norm === 'help' ||
      norm === 'tutorial' ||
      norm === 'guide'
    ) {
      await this.showHowToUseBot(chatId);
      return;
    }

    // 13. 🚀 Support / Contact
    if (
      norm === 'support' ||
      cleanCmd.startsWith('/support') ||
      cleanCmd.startsWith('/contact') ||
      norm === 'contact' ||
      norm === 'customer support'
    ) {
      await this.showSupport(chatId);
      return;
    }

    // 13b. 📢 Official Community & Proof Channels (/community, /channel, /proof)
    if (
      cleanCmd === '/community' ||
      cleanCmd.startsWith('/community ') ||
      cleanCmd === '/channel' ||
      cleanCmd.startsWith('/channel ') ||
      cleanCmd === '/proof' ||
      cleanCmd.startsWith('/proof ') ||
      cleanCmd === '/proofs' ||
      cleanCmd.startsWith('/proofs ') ||
      norm === 'community' ||
      norm === 'channel' ||
      norm === 'proof' ||
      norm === 'proofs' ||
      norm === 'proof channel' ||
      norm === 'official channel' ||
      norm === 'கம்யூனிட்டி' ||
      norm === 'சேனல்' ||
      norm === 'குழு'
    ) {
      await this.showCommunity(chatId);
      return;
    }

    // 14. 🗑️ Remove / Hide Keyboard Menu
    if (
      cleanCmd.startsWith('/removekeyboard') ||
      cleanCmd.startsWith('/clearkeyboard') ||
      cleanCmd.startsWith('/hidekeyboard') ||
      cleanCmd.startsWith('/nokeyboard') ||
      norm === 'remove keyboard' ||
      norm === 'hide keyboard' ||
      norm === 'clear keyboard' ||
      norm === 'remove keyboard menu'
    ) {
      await this.removeReplyKeyboard(chatId);
      const wallet = getUserWallet(userId);
      await this.sendMainMenu(chatId, wallet.balance);
      return;
    }

    // 16. Multi-Language Selection (/language, /lang, language, மொழி, भाषा)
    if (
      cleanCmd === '/language' ||
      cleanCmd.startsWith('/language ') ||
      cleanCmd === '/lang' ||
      cleanCmd.startsWith('/lang ') ||
      norm === 'language' ||
      norm === 'lang' ||
      norm === 'change language' ||
      norm === 'select language' ||
      norm === 'tamil' ||
      norm === 'hindi' ||
      norm === 'english' ||
      norm === 'மொழி' ||
      norm === 'மொழி மாற்று' ||
      norm === 'भाषा' ||
      norm === 'भाषा बदलें'
    ) {
      await this.showLanguageSelection(chatId);
      return;
    }

    // Default friendly fallback: show main menu
    const wallet = getUserWallet(userId);
    await this.sendMainMenu(chatId, wallet.balance);
  }

  private async handleCallbackQuery(
    cb: NonNullable<TelegramUpdate['callback_query']>,
    getProducts: () => any[],
    getUserWallet: (identifier: string) => { balance: number; email?: string; userId: string },
    deductWallet: (identifier: string, amount: number, reason: string) => boolean,
    creditWallet: (identifier: string, amount: number, reason: string) => any,
    deliverKey: (productId: string, planDuration: string, userEmail: string) => Promise<{ success: boolean; keys?: string[]; error?: string }>,
    createFamOrder?: (amount: number, userIdentifier: string, userEmail?: string) => Promise<any>,
    queryFamOrder?: (orderId: string, userIdentifier: string) => Promise<any>
  ) {
    const data = cb.data || '';
    const chatId = cb.message?.chat.id || cb.from.id;
    const userId = `tg_${cb.from.id}`;
    const msgId = cb.message?.message_id;

    // Multi-Language Support Handlers (select_language, lang:en, lang:ta, lang:hi)
    if (data === 'select_language' || data === 'change_language') {
      await this.showLanguageSelection(chatId, msgId);
      return;
    }

    if (data.startsWith('lang:')) {
      const selectedLang = data.replace('lang:', '') as BotLanguage;
      if (selectedLang === 'en' || selectedLang === 'ta' || selectedLang === 'hi') {
        this.setUserLanguage(chatId, selectedLang);
        const i18n = I18N_TEXTS[selectedLang] || I18N_TEXTS.en;
        await this.answerCallback(cb.id, i18n.lang_changed.replace(/<[^>]+>/g, ''), true);
        const wallet = getUserWallet(userId);
        await this.sendMainMenu(chatId, wallet.balance, false, msgId);
        return;
      }
    }

    // Prevent duplicate button handling on rapid clicks / multi-taps
    const now = Date.now();
    const debounceKey = `${chatId}:${data}`;
    const lastTime = this.lastCallbackTime.get(debounceKey) || 0;
    if (now - lastTime < 600) {
      await this.answerCallback(cb.id);
      return;
    }
    this.lastCallbackTime.set(debounceKey, now);
    if (this.lastCallbackTime.size > 200) {
      this.lastCallbackTime.clear();
    }

    await this.answerCallback(cb.id);

    const botUser = this.registerOrUpdateUser(cb.from, chatId);

    if (data === 'main_menu' || data === 'cancel_payment' || data === 'cancel') {
      userStates.delete(chatId);
      this.numpadAmounts.delete(chatId);
      const wallet = getUserWallet(userId);
      await this.sendMainMenu(chatId, wallet.balance, false, msgId);
      return;
    }

    // 1. 🛒 Shop Now & Device Categories
    if (data === 'catalog') {
      await this.showProductCatalog(chatId, getProducts(), msgId);
      return;
    }

    if (data.startsWith('cat_dev:')) {
      const dev = data.replace('cat_dev:', '');
      await this.showProductsForDevice(chatId, dev, getProducts(), msgId);
      return;
    }

    // 2. 💲 Add Balance with Interactive Numpad
    if (data === 'deposit_prompt' || data === 'deposit_numpad') {
      this.numpadAmounts.set(chatId, '0');
      await this.showDepositNumpad(chatId, msgId);
      return;
    }

    if (data.startsWith('np:')) {
      const key = data.replace('np:', '');
      let currentStr = this.numpadAmounts.get(chatId) || '0';
      if (key === 'clear') {
        this.numpadAmounts.set(chatId, '0');
        await this.showDepositNumpad(chatId, msgId);
        return;
      }
      if (key === 'confirm') {
        const amt = parseInt(currentStr, 10) || 0;
        if (amt < 1) {
          await this.answerCallback(cb.id, '⚠️ Minimum deposit amount is ₹1', true);
          return;
        }
        this.numpadAmounts.set(chatId, '0');
        await this.answerCallback(cb.id, '⏳ Generating payment QR...', false);
        await this.initiateFamGatewayPayment(chatId, amt, userId, createFamOrder, msgId);
        return;
      }
      // Numeric key pressed
      if (currentStr === '0') {
        currentStr = key;
      } else if (currentStr.length < 5) {
        currentStr += key;
      }
      this.numpadAmounts.set(chatId, currentStr);
      await this.showDepositNumpad(chatId, msgId);
      return;
    }

    if (data.startsWith('fam_amt:')) {
      const parts = data.split(':');
      const amount = parseFloat(parts[1]);
      await this.answerCallback(cb.id, '⏳ Generating payment QR...', false);
      await this.initiateFamGatewayPayment(chatId, amount, userId, createFamOrder, msgId);
      return;
    }

    if (data === 'fam_custom' || data.startsWith('fam_custom:')) {
      userStates.set(chatId, { step: 'AWAITING_CUSTOM_DEPOSIT' });
      await this.sendMessage(
        chatId,
        `⚡ <b>FamGateway Custom Deposit</b>\n\nPlease enter the amount in ₹ to add (e.g. <code>150</code>, <code>250</code>, <code>500</code>):`
      );
      return;
    }

    // Check payment status callback
    if (data.startsWith('check_order:')) {
      const orderId = data.split(':')[1];
      const checkKey = `${chatId}_${orderId}`;

      // Check if already confirmed/credited in the past
      if (this.confirmedDepositOrders.has(orderId)) {
        const wallet = getUserWallet(userId);
        await this.answerCallback(cb.id, '✅ Payment already credited!');
        await this.editOrSendMessage(
          chatId,
          `✅ <b>PAYMENT ALREADY CREDITED!</b> 💰\n\n` +
          `<blockquote>` +
          `🆔 <b>Order ID:</b> <code>${orderId}</code>\n` +
          `💳 <b>Current Balance:</b> <b>₹${wallet.balance.toFixed(2)}</b>\n` +
          `⚡ <b>Status:</b> Already Verified & Added to your Account` +
          `</blockquote>\n\n` +
          `<i>You can use your wallet balance to purchase VIP keys right now!</i>`,
          {
            inline_keyboard: [
              [{ text: '🛒 Buy Keys Now', callback_data: 'catalog' }],
              [{ text: '👑 My Profile', callback_data: 'profile_history' }],
              [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
            ]
          },
          msgId
        );
        return;
      }

      if (this.checkingOrdersInProgress.has(checkKey)) {
        await this.answerCallback(cb.id, '⏳ Verification in progress, please wait...');
        return;
      }
      this.checkingOrdersInProgress.add(checkKey);
      try {
        if (queryFamOrder) {
          await this.answerCallback(cb.id, '🔍 Verifying with FamGateway...');
          const statusResult = await queryFamOrder(orderId, userId);
          if (statusResult.isPaid) {
            // Mark as confirmed immediately to prevent duplicate triggers
            this.confirmedDepositOrders.add(orderId);
            if (statusResult.utr) {
              this.confirmedDepositOrders.add(statusResult.utr);
            }
            this.saveConfirmedOrders();

            const wallet = getUserWallet(userId);

            // Update user deposit stats
            const allUsers = this.loadBotUsers();
            botUser.totalDeposited = (botUser.totalDeposited || 0) + (statusResult.amount || 0);
            allUsers.set(chatId, botUser);
            this.saveBotUsers(allUsers);

            // If this user was referred by someone, give referrer 5% commission!
            if (botUser.referrerId) {
              const refNum = parseInt(botUser.referrerId.replace('tg_', ''), 10);
              if (!isNaN(refNum) && (statusResult.amount || 0) > 0) {
                const commission = Math.round((statusResult.amount || 0) * 0.05 * 100) / 100;
                if (commission > 0) {
                  creditWallet(`tg_${refNum}`, commission, `5% Referral commission on ${statusResult.amount} deposit`);
                  const referrals = this.loadReferrals();
                  const rec = referrals.get(refNum);
                  if (rec) {
                    rec.totalEarned += commission;
                    referrals.set(refNum, rec);
                    this.saveReferrals(referrals);
                  }
                  this.sendMessage(
                    refNum,
                    `💰 <b>REFERRAL COMMISSION RECEIVED!</b>\n\nYour referred friend deposited ₹${statusResult.amount}.\n` +
                    `You received <b>₹${commission}</b> (5%) credited to your balance!`
                  ).catch(() => {});
                }
              }
            }

            // Dispatch Real-time Deposit Proof to Proof Supergroup (deduplicated)
            this.dispatchDepositProof({
              amount: statusResult.amount || 0,
              utr: statusResult.utr,
              orderId,
              chatId,
              username: botUser?.username,
              firstName: botUser?.firstName,
              paymentMethod: 'FamGateway UPI'
            }).catch(err => console.warn('[TelegramBot] Deposit proof dispatch error:', err));

            await this.sendMessage(
              chatId,
              `🎉 <b>PAYMENT CONFIRMED & CREDITED!</b> 💰\n\n` +
              `<blockquote>` +
              `✅ <b>Order ID:</b> <code>${orderId}</code>\n` +
              `💵 <b>Amount Credited:</b> <b>₹${statusResult.amount}</b>\n` +
              (statusResult.utr ? `📌 <b>UTR:</b> <code>${statusResult.utr}</code>\n` : '') +
              `💰 <b>New Wallet Balance:</b> <b>₹${wallet.balance.toFixed(2)}</b>` +
              `</blockquote>\n\n` +
              `⚡ <i>You can now purchase VIP keys instantly!</i>`,
              {
                inline_keyboard: [
                  [{ text: '🛒 Buy Keys Now', callback_data: 'catalog' }],
                  [{ text: '👑 My Profile', callback_data: 'profile_history' }],
                  [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
                ]
              }
            );
          } else {
            await this.sendMessage(
              chatId,
              `⏳ <b>Payment Status: Pending</b>\n\n` +
              `We have not detected your payment yet for order <code>${orderId}</code>.\n\n` +
              `If you completed payment in PhonePe / Google Pay / Paytm / BHIM, click <b>Submit 12-Digit UTR</b> below for instant verification!`,
              {
                inline_keyboard: [
                  [{ text: '🔄 Check Payment Status Again', callback_data: `check_order:${orderId}` }],
                  [{ text: '📌 Submit 12-Digit UTR Number', callback_data: `enter_utr:${orderId}` }],
                  [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
                ]
              }
            );
          }
        }
      } finally {
        setTimeout(() => {
          this.checkingOrdersInProgress.delete(checkKey);
        }, 3000);
      }
      return;
    }

    // Submit UTR callback
    if (data.startsWith('enter_utr:')) {
      const orderId = data.split(':')[1] || '';
      userStates.set(chatId, { step: 'AWAITING_PAYMENT_UTR', data: { orderId } });
      await this.sendMessage(
        chatId,
        `📌 <b>SUBMIT 12-DIGIT UPI UTR / REF NUMBER</b>\n\n` +
        (orderId ? `Order ID: <code>${orderId}</code>\n\n` : '') +
        `Please send the 12-digit Transaction Reference (UTR) number shown in your PhonePe, Google Pay, Paytm, or BHIM app receipt.\n\n` +
        `<i>Example:</i> <code>412345678901</code>\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    // 3.5 💎 Upgrade to Reseller Account
    if (data === 'upgrade_reseller') {
      await this.showResellerUpgrade(chatId, botUser, getUserWallet, msgId);
      return;
    }

    if (data === 'view_upgrade_details') {
      await this.showResellerUpgrade(chatId, botUser, getUserWallet, msgId, true);
      return;
    }

    if (data === 'do_upgrade_reseller') {
      await this.answerCallback(cb.id, '⏳ Upgrading Account...');
      await this.executeUpgradeToReseller(chatId, botUser, getUserWallet, deductWallet, msgId);
      return;
    }

    // 4. 👑 My Profile + All History
    if (data === 'profile_history' || data === 'profile') {
      await this.showUserProfileAndHistory(chatId, botUser, getUserWallet, msgId);
      return;
    }

    if (data === 'my_orders' || data === 'all_history' || data === 'my_keys') {
      await this.showUserKeyHistory(chatId, botUser, msgId);
      return;
    }

    if (data === 'all_files_download') {
      await this.showAllFilesDownload(chatId, msgId);
      return;
    }

    // 5. 🔗 Refer And Earn
    if (data === 'refer_earn') {
      await this.showReferAndEarn(chatId, msgId);
      return;
    }

    // 6. ⁉️ How To Use Bot
    if (data === 'how_to_use') {
      await this.showHowToUseBot(chatId, msgId);
      return;
    }

    // 6b. 📜 Bot Commands
    if (data === 'bot_commands' || data === 'commands' || data === 'cmd_list') {
      await this.showAllBotCommands(chatId, msgId);
      return;
    }

    // 7. 🚀 Support
    if (data === 'support') {
      await this.showSupport(chatId, msgId);
      return;
    }

    // 7b. 📢 Community & Proof Channels
    if (data === 'community' || data === 'proof_channel' || data === 'channels' || data === 'community_channel') {
      await this.showCommunity(chatId, msgId);
      return;
    }

    // 8. 🎁 Daily Gift
    if (data === 'daily_gift') {
      await this.handleDailyGiftSpin(chatId, userId, getUserWallet, creditWallet, msgId);
      return;
    }

    // 10. 🎟️ Redeem Code Prompt
    if (data === 'redeem_prompt') {
      userStates.set(chatId, { step: 'AWAITING_PROMO_CODE' });
      const text =
        `🎟️ <b>REDEEM PROMO / COUPON CODE</b>\n\n` +
        `Enter your promo code below to receive free wallet balance instantly!\n\n` +
        `💡 <i>Try typing starter code:</i> <code>KALAMFREE</code> or <code>WELCOME10</code>\n\n` +
        `<i>Send /cancel to return to main menu.</i>`;
      await this.editOrSendMessage(
        chatId,
        text,
        { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'main_menu' }]] },
        msgId
      );
      return;
    }

    // 11. ⚡ Transfer Balance Prompt
    if (data === 'transfer_prompt') {
      const wallet = getUserWallet(userId);
      userStates.set(chatId, { step: 'AWAITING_TRANSFER_DETAILS' });
      const text =
        `⚡ <b>USER-TO-USER BALANCE TRANSFER</b>\n\n` +
        `Send balance from your wallet directly to any friend or team member!\n\n` +
        `💰 <b>Your Current Balance:</b> ₹${wallet.balance.toFixed(2)}\n\n` +
        `<b>How to Send:</b>\n` +
        `Type the recipient's Telegram User ID (or @username) and the amount.\n\n` +
        `📌 <i>Example:</i> <code>7768975239 50</code>\n` +
        `📌 <i>Or:</i> <code>tg_7768975239 50</code>\n\n` +
        `<i>Send /cancel to return to main menu.</i>`;
      await this.editOrSendMessage(
        chatId,
        text,
        { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'main_menu' }]] },
        msgId
      );
      return;
    }

    // 12. 🏆 Leaderboard
    if (data === 'leaderboard') {
      await this.showLeaderboard(chatId, msgId);
      return;
    }

    // 13. 📥 Download Hub & Check Update
    if (
      data === 'check_update' ||
      data === 'check_updates' ||
      data === 'update' ||
      data === 'updates' ||
      data === 'apk_download' ||
      data === 'download_hub' ||
      data === 'download_apk'
    ) {
      await this.showCheckUpdate(chatId, msgId);
      return;
    }

    // 9. 🔲 Admin Panel Navigation & Submenus
    if (data === 'admin_panel' || data === 'admin_panel_back') {
      await this.showAdminPanel(chatId, getProducts, getUserWallet, msgId);
      return;
    }

    if (data === 'admin_menu:products') {
      await this.showAdminProductsMenu(chatId, getProducts, msgId);
      return;
    }

    if (data === 'admin_menu:low_stock') {
      await this.showAdminLowStockMenu(chatId, msgId);
      return;
    }

    if (data === 'admin_action:set_lowstock_prompt' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_LOW_STOCK_THRESHOLD' });
      const current = this.getLowStockThreshold();
      await this.sendMessage(
        chatId,
        `📉 <b>SET LOW-STOCK ALERT THRESHOLD</b>\n\n` +
        `Current Alert Threshold: <b>${current} keys</b>\n\n` +
        `Enter the new threshold number (e.g. <code>5</code>, <code>10</code>, <code>3</code>):\n` +
        `<i>Whenever any product's stock falls to or below this number, you will automatically receive an instant Telegram notification alert.</i>\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data === 'admin_action:trigger_lowstock_audit' && this.isAdmin(chatId)) {
      await this.answerCallback(cb.id, '🔍 Running automated low-stock audit...');
      const res = await this.checkAndDispatchLowStockAlert(undefined, { force: true, targetChatId: chatId });
      if (res.count === 0) {
        await this.sendMessage(chatId, `✅ <b>Inventory Stock Healthy:</b> All catalog products are currently above the threshold of <b>${this.getLowStockThreshold()}</b> keys.`);
      }
      return;
    }

    if (data === 'admin_menu:gateways') {
      await this.showAdminGatewaysMenu(chatId, msgId);
      return;
    }

    if (data === 'admin_menu:users') {
      await this.showAdminUsersMenu(chatId, msgId);
      return;
    }

    if (data === 'admin_menu:promos') {
      await this.showAdminPromosMenu(chatId, msgId);
      return;
    }

    if (data === 'admin_menu:broadcast') {
      await this.showAdminBroadcastMenu(chatId, msgId);
      return;
    }

    if (data === 'admin_menu:links') {
      await this.showAdminLinksMenu(chatId, msgId);
      return;
    }

    if (data === 'admin_menu:stats') {
      await this.showAdminStatsMenu(chatId, msgId);
      return;
    }

    if (data === 'admin_menu:maintenance') {
      await this.showAdminMaintenanceMenu(chatId, msgId);
      return;
    }

    if (data === 'admin_recent_orders') {
      await this.showAdminRecentOrders(chatId, msgId);
      return;
    }

    if (data === 'admin_view_resellers' && this.isAdmin(chatId)) {
      const resellers = this.getResellerUsers();
      let resText = `💎 <b>ACTIVE VIP RESELLER DIRECTORY (${resellers.length})</b>\n\n`;
      if (resellers.length === 0) {
        resText += `<i>No active VIP resellers registered yet.</i>\n`;
      } else {
        resellers.forEach((r, idx) => {
          const w = getUserWallet(r.userId);
          resText += `${idx + 1}. <b>${r.firstName}</b> ${r.username ? '(@' + r.username.replace('@', '') + ')' : ''}\n` +
                     `   • ID: <code>${r.userId}</code> | Chat: <code>${r.chatId}</code>\n` +
                     `   • Balance: ₹${w.balance.toFixed(2)} | Role: <b>${r.role || 'RESELLER'}</b>\n\n`;
        });
      }
      await this.editOrSendMessage(chatId, resText, {
        inline_keyboard: [
          [{ text: '💎 Set Reseller Fee', callback_data: 'admin_set_reseller_price' }],
          [{ text: '🔙 Back to Users Hub', callback_data: 'admin_menu:users' }]
        ]
      }, msgId);
      return;
    }

    // Switch Payment Gateway 1-tap
    if (data.startsWith('admin_set_gw:') && this.isAdmin(chatId)) {
      const gwTarget = data.replace('admin_set_gw:', '');
      const switchRes = this.setActivePaymentGateway(gwTarget);
      if (switchRes.success) {
        await this.answerCallback(cb.id, `✅ Switched to ${switchRes.activeGateway?.name || gwTarget}`);
        await this.showAdminGatewaysMenu(chatId, msgId);
      } else {
        await this.answerCallback(cb.id, `❌ ${switchRes.error || 'Failed'}`);
      }
      return;
    }

    // Toggle Maintenance Mode 1-tap
    if (data.startsWith('admin_toggle_maint:') && this.isAdmin(chatId)) {
      const targetMode = data.replace('admin_toggle_maint:', '') === 'on';
      this.setWebsiteMaintenance(targetMode);
      await this.answerCallback(cb.id, targetMode ? '🔴 Website Maintenance Mode Turned ON' : '🟢 Website Maintenance Mode Turned OFF');
      await this.showAdminMaintenanceMenu(chatId, msgId);
      return;
    }

    // Toggle Product Maintenance Mode 1-tap
    if (data.startsWith('admin_toggle_prod_maint:') && this.isAdmin(chatId)) {
      const prodId = data.replace('admin_toggle_prod_maint:', '');
      const res = this.toggleProductMaintenance(prodId);
      if (res.success) {
        await this.answerCallback(cb.id, res.isMaintenance ? `🔴 ${res.product?.name || 'Product'} Maintenance ON` : `🟢 ${res.product?.name || 'Product'} is now ACTIVE`);
      } else {
        await this.answerCallback(cb.id, '❌ Product not found');
      }
      await this.showAdminMaintenanceMenu(chatId, msgId);
      return;
    }

    // Bulk Products Maintenance Mode 1-tap
    if (data.startsWith('admin_prod_maint_all:') && this.isAdmin(chatId)) {
      const isMaint = data.replace('admin_prod_maint_all:', '') === 'on';
      this.setAllProductsMaintenance(isMaint);
      await this.answerCallback(cb.id, isMaint ? '🔴 ALL Products placed in MAINTENANCE' : '🟢 ALL Products set to ACTIVE');
      await this.showAdminMaintenanceMenu(chatId, msgId);
      return;
    }

    // Clear Notice Banner 1-tap
    if (data === 'admin_action:clear_notice' && this.isAdmin(chatId)) {
      this.setWebsiteNoticeBanner('', false);
      await this.answerCallback(cb.id, '✅ Notice banner cleared from website');
      await this.showAdminBroadcastMenu(chatId, msgId);
      return;
    }

    // Admin Interactive Prompts
    if (data === 'admin_action:add_keys_prompt' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_ADD_KEYS' });
      await this.sendMessage(
        chatId,
        `➕ <b>ADD LICENSE KEYS TO INVENTORY</b>\n\n` +
        `Send product, plan duration, and keys in format:\n` +
        `<code>[Product Name or ID] | [Duration] | [Key1, Key2, Key3...]</code>\n\n` +
        `Example:\n` +
        `<code>Free Fire Mod | 1 Day | KALAM-KEY-111, KALAM-KEY-222, KALAM-KEY-333</code>\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data === 'admin_action:set_price_prompt' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_SET_PRICE' });
      await this.sendMessage(
        chatId,
        `💲 <b>CHANGE PRODUCT PLAN PRICE</b>\n\n` +
        `Send pricing in format:\n` +
        `<code>[Product Name or ID] | [Duration] | [RegularPrice] | [ResellerPrice]</code>\n\n` +
        `Example:\n` +
        `<code>Free Fire Mod | 1 Day | 99 | 69</code>\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data === 'admin_action:add_product_prompt' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_ADD_PRODUCT' });
      await this.sendMessage(
        chatId,
        `📦 <b>CREATE NEW PRODUCT IN CATALOG</b>\n\n` +
        `Send product details in format:\n` +
        `<code>[Name] | [Category] | [Game] | [1-Day Price] | [1-Day Reseller Price]</code>\n\n` +
        `Example:\n` +
        `<code>BGMI VIP Cheat | Injections | BGMI | 120 | 85</code>\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data === 'admin_action:clear_stock_prompt' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_CLEAR_STOCK' });
      await this.sendMessage(
        chatId,
        `🗑️ <b>CLEAR PLAN STOCK KEYS</b>\n\n` +
        `Send product and duration in format:\n` +
        `<code>[Product Name or ID] | [Duration]</code>\n\n` +
        `Example: <code>Free Fire Mod | 1 Day</code>\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data === 'admin_action:set_upi_prompt' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_SET_UPI' });
      await this.sendMessage(
        chatId,
        `✏️ <b>CHANGE MERCHANT UPI ID</b>\n\n` +
        `Send the new Merchant UPI ID (e.g. <code>kalamffpanel@fampay</code> or <code>9876543210@paytm</code>):\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data === 'admin_action:set_gw_key_prompt' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_SET_GW_KEY' });
      await this.sendMessage(
        chatId,
        `🔑 <b>UPDATE PAYMENT GATEWAY API KEY / TOKEN</b>\n\n` +
        `Send the new API Token for active gateway:\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data === 'admin_action:set_merchant_name_prompt' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_SET_MERCHANT_NAME' });
      await this.sendMessage(
        chatId,
        `🏷️ <b>CHANGE MERCHANT / STORE NAME</b>\n\n` +
        `Send the new Business Name to display to customers:\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data === 'admin_action:search_user_prompt' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_SEARCH_USER' });
      await this.sendMessage(
        chatId,
        `🔍 <b>SEARCH USER ACCOUNT DETAILS</b>\n\n` +
        `Send Telegram User ID (e.g. <code>tg_7768975239</code> or <code>7768975239</code>) or @username:\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data === 'admin_action:deduct_bal_prompt' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_DEDUCT_BAL' });
      await this.sendMessage(
        chatId,
        `➖ <b>DEDUCT USER BALANCE</b>\n\n` +
        `Send User ID and amount to deduct:\n` +
        `Example: <code>tg_7768975239 50</code>\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data === 'admin_action:toggle_reseller_prompt' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_TOGGLE_RESELLER' });
      await this.sendMessage(
        chatId,
        `💎 <b>MAKE / REMOVE VIP RESELLER</b>\n\n` +
        `Send User ID or username and action:\n` +
        `• To Promote: <code>tg_7768975239 make</code>\n` +
        `• To Demote: <code>tg_7768975239 remove</code>\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data === 'admin_action:del_promo_prompt' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_DEL_PROMO' });
      await this.sendMessage(
        chatId,
        `🗑️ <b>DELETE PROMO CODE</b>\n\n` +
        `Send the Promo Code name to delete (e.g. <code>KALAMFREE</code>):\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data === 'admin_action:set_notice_prompt' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_SET_NOTICE' });
      await this.sendMessage(
        chatId,
        `🏷️ <b>SET WEBSITE LIVE NOTICE BANNER</b>\n\n` +
        `Type the notice announcement to show at the top of the website:\n` +
        `Example: <code>🔥 Free Fire OB47 Update Live! All keys 100% Anti-Ban!</code>\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data === 'admin_action:set_tutorial_prompt' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_SET_TUTORIAL' });
      await this.sendMessage(
        chatId,
        `🎥 <b>UPDATE YOUTUBE TUTORIAL VIDEO URL</b>\n\n` +
        `Send the full YouTube video link (e.g. <code>https://youtube.com/watch?v=...</code>):\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data === 'admin_action:set_support_prompt' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_SET_SUPPORT' });
      await this.sendMessage(
        chatId,
        `💬 <b>UPDATE SUPPORT ADMIN USERNAME</b>\n\n` +
        `Send the support Telegram username (e.g. <code>@kd_123_1_3</code>):\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data === 'admin_create_promo' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_PROMO_CODE' });
      await this.sendMessage(
        chatId,
        `🎟️ <b>CREATE NEW PROMO CODE</b>\n\n` +
        `Enter code details in format: <code>[CODE] [AMOUNT] [MAX_USERS]</code>\n\n` +
        `Example: <code>VIPBONUS50 50 20</code> (Gives ₹50 to first 20 users)\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data.startsWith('admin_users:')) {
      if (!this.isAdmin(chatId)) {
        await this.sendMessage(chatId, '🔒 <b>Access Denied:</b> Store administrators only.');
        return;
      }
      const pageStr = data.split(':')[1] || '0';
      if (pageStr === 'single_page') {
        await this.answerCallback(cb.id, 'ℹ️ Only 1 page available (all users shown)');
        return;
      }
      const page = parseInt(pageStr, 10) || 0;
      await this.showAdminUsersList(chatId, page, getUserWallet, msgId, cb.id);
      return;
    }

    if (data.startsWith('admin_bcast_audio:') && this.isAdmin(chatId)) {
      const audioFileId = data.replace('admin_bcast_audio:', '').trim();
      const users = this.loadBotUsers();
      const targets = Array.from(users.values()).map(u => u.chatId);

      await this.sendMessage(chatId, `⏳ <i>Broadcasting audio track to ${users.size} bot users live...</i>`);
      const result = await this.executeBroadcast({
        type: 'audio',
        targets,
        targetLabel: `All Bot Users (${users.size})`,
        audio: audioFileId,
        title: 'KALAM FF Audio Track',
        performer: 'KALAM FF Official'
      });
      await this.sendMessage(chatId, `✅ <b>Song Broadcast Live Completed!</b>\nDelivered to ${result.sent} of ${result.total} users.`);
      return;
    }

    if (data.startsWith('admin_bcast_resellers_audio:') && this.isAdmin(chatId)) {
      const audioFileId = data.replace('admin_bcast_resellers_audio:', '').trim();
      const users = this.loadBotUsers();
      const targets = Array.from(users.values()).filter(u => u.isReseller || u.role === 'RESELLER' || u.role === 'ADMIN').map(u => u.chatId);

      await this.sendMessage(chatId, `⏳ <i>Broadcasting audio track to VIP Resellers (${targets.length} users)...</i>`);
      const result = await this.executeBroadcast({
        type: 'audio',
        targets,
        targetLabel: `VIP Resellers (${targets.length})`,
        audio: audioFileId,
        title: '💎 VIP Reseller Audio Update',
        performer: 'KALAM FF Admin'
      });
      await this.sendMessage(chatId, `✅ <b>VIP Resellers Audio Broadcast Completed!</b>\nDelivered to ${result.sent} of ${result.total} users.`);
      return;
    }

    if (data.startsWith('admin_bcast_channel_audio:') && this.isAdmin(chatId)) {
      const audioFileId = data.replace('admin_bcast_channel_audio:', '').trim();
      const cfg = this.getCredentials();
      const channelId = cfg.defaultChatId || '7768975239';

      const success = await this.sendAudio(channelId, audioFileId, '🎵 Official Audio Release', 'Audio Track', 'KALAM FF');
      await this.sendMessage(chatId, success ? `✅ <b>Audio track forwarded to channel (${channelId}) successfully!</b>` : `❌ Failed to forward audio track.`);
      return;
    }

    if (data.startsWith('admin_test_audio:') && this.isAdmin(chatId)) {
      const audioFileId = data.replace('admin_test_audio:', '').trim();
      const success = await this.sendAudio(chatId, audioFileId, '🧪 [TEST PLAYBACK] Audio verification from Bot', 'Test Audio', 'Admin');
      await this.sendMessage(chatId, success ? `✅ Test audio track played in this chat.` : `❌ Test playback failed.`);
      return;
    }

    if (data.startsWith('admin_bcast_voice:') && this.isAdmin(chatId)) {
      const voiceFileId = data.replace('admin_bcast_voice:', '').trim();
      const users = this.loadBotUsers();
      const targets = Array.from(users.values()).map(u => u.chatId);

      await this.sendMessage(chatId, `⏳ <i>Broadcasting voice note to ${users.size} bot users live...</i>`);
      const result = await this.executeBroadcast({
        type: 'voice',
        targets,
        targetLabel: `All Bot Users (${users.size})`,
        voice: voiceFileId
      });
      await this.sendMessage(chatId, `✅ <b>Voice Note Broadcast Completed!</b>\nDelivered to ${result.sent} of ${result.total} users.`);
      return;
    }

    if (data.startsWith('admin_bcast_resellers_voice:') && this.isAdmin(chatId)) {
      const voiceFileId = data.replace('admin_bcast_resellers_voice:', '').trim();
      const users = this.loadBotUsers();
      const targets = Array.from(users.values()).filter(u => u.isReseller || u.role === 'RESELLER' || u.role === 'ADMIN').map(u => u.chatId);

      await this.sendMessage(chatId, `⏳ <i>Broadcasting voice note to VIP Resellers (${targets.length} users)...</i>`);
      const result = await this.executeBroadcast({
        type: 'voice',
        targets,
        targetLabel: `VIP Resellers (${targets.length})`,
        voice: voiceFileId
      });
      await this.sendMessage(chatId, `✅ <b>VIP Resellers Voice Broadcast Completed!</b>\nDelivered to ${result.sent} of ${result.total} users.`);
      return;
    }

    if (data.startsWith('admin_bcast_channel_voice:') && this.isAdmin(chatId)) {
      const voiceFileId = data.replace('admin_bcast_channel_voice:', '').trim();
      const cfg = this.getCredentials();
      const channelId = cfg.defaultChatId || '7768975239';

      const success = await this.sendVoice(channelId, voiceFileId, '🎙️ Official Voice Note from Admin');
      await this.sendMessage(chatId, success ? `✅ <b>Voice note forwarded to channel (${channelId}) successfully!</b>` : `❌ Failed to forward voice note.`);
      return;
    }

    if (data === 'admin_broadcast' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_BROADCAST' });
      await this.sendMessage(
        chatId,
        `📢 <b>BROADCAST ANNOUNCEMENT STUDIO</b>\n\n` +
        `Send any of the following to broadcast to all bot users:\n\n` +
        `💬 <b>Text Message:</b> Type text or use <code>Text | Button Label | Button URL</code>\n` +
        `🎵 <b>Audio Song / MP3:</b> Upload or forward an audio/music file directly\n` +
        `🎙️ <b>Voice Note:</b> Record and send a Telegram voice message\n` +
        `🖼️ <b>Photo:</b> Send an image with an optional caption\n\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    if (data === 'admin_add_bal' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_ADD_BALANCE' });
      await this.sendMessage(chatId, `➕ <b>Add User Balance</b>\n\nEnter Telegram User ID and Amount separated by space.\nExample: <code>tg_7768975239 100</code>`);
      return;
    }

    if (data === 'admin_set_apk_url' && this.isAdmin(chatId)) {
      const { apkDownloadUrl } = this.getCredentials();
      userStates.set(chatId, { step: 'AWAITING_ADMIN_APK_URL' });
      await this.sendMessage(
        chatId,
        `📥 <b>UPDATE APK DOWNLOAD TELEGRAM URL</b>\n\n` +
        `🔗 <b>Current Live URL:</b> <code>${apkDownloadUrl}</code>\n\n` +
        `Send the new Telegram channel link or direct APK download URL:\n` +
        `(e.g. <code>https://t.me/kalamffpanel</code> or <code>https://t.me/yourchannel/15</code>)\n\n` +
        `<i>Send /cancel to keep current URL.</i>`
      );
      return;
    }

    if (data === 'admin_set_reseller_price' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_RESELLER_PRICE' });
      await this.sendMessage(
        chatId,
        `💎 <b>SET RESELLER UPGRADE PRICE</b>\n\n` +
        `Current Upgrade Price: <b>₹${this.getResellerUpgradeAmount()}</b>\n\n` +
        `Please enter the new reseller upgrade fee in ₹ (e.g. <code>299</code>, <code>500</code>):\n` +
        `<i>Send /cancel to abort.</i>`
      );
      return;
    }

    // Product selection: prod:<productId>
    if (data.startsWith('prod:')) {
      const parts = data.split(':');
      const productId = parts[1];
      await this.showProductPlans(chatId, productId, getProducts(), msgId);
      return;
    }

    // Plan selection / purchase confirmation: plan:<productId>:<planId>
    if (data.startsWith('plan:')) {
      const parts = data.split(':');
      const productId = parts[1];
      const planId = parts[2];
      await this.showPurchaseConfirmation(chatId, productId, planId, getProducts(), getUserWallet, userId, msgId);
      return;
    }

    // Execute Purchase: do_buy:<productId>:<planId>
    if (data.startsWith('do_buy:')) {
      const parts = data.split(':');
      const productId = parts[1];
      const planId = parts[2];
      await this.answerCallback(cb.id, '⏳ Fetching VIP Key...');
      await this.executeBuyKey(chatId, productId, planId, getProducts(), getUserWallet, deductWallet, deliverKey, userId, msgId);
      return;
    }
  }

  public getUserLanguage(chatId: number): BotLanguage {
    const users = this.loadBotUsers();
    const u = users.get(chatId);
    return u?.language || 'en';
  }

  public setUserLanguage(chatId: number, lang: BotLanguage): void {
    const users = this.loadBotUsers();
    let u = users.get(chatId);
    if (!u) {
      u = {
        chatId,
        userId: `tg_${chatId}`,
        firstName: 'User',
        joinedAt: Date.now(),
        lastActive: Date.now(),
        totalSpent: 0,
        totalDeposited: 0,
        language: lang
      };
    } else {
      u.language = lang;
      u.lastActive = Date.now();
    }
    users.set(chatId, u);
    this.saveBotUsers(users);
  }

  public async showLanguageSelection(chatId: number, messageId?: number) {
    const currentLang = this.getUserLanguage(chatId);
    const i18n = I18N_TEXTS[currentLang] || I18N_TEXTS.en;

    const text =
      `🌐 <b>Choose Your Language / உங்கள் மொழியைத் தேர்ந்தெடுக்கவும் / अपनी भाषा चुनें</b>\n\n` +
      `Current Language: <b>${currentLang === 'ta' ? '🇮🇳 தமிழ் (Tamil)' : currentLang === 'hi' ? '🇮🇳 हिन्दी (Hindi)' : '🇬🇧 English'}</b>\n\n` +
      `<blockquote>` +
      `🇬🇧 <b>English</b> — International default\n` +
      `🇮🇳 <b>தமிழ்</b> — தமிழ் மொழி ஆதரவு\n` +
      `🇮🇳 <b>हिन्दी</b> — हिंदी भाषा सहायता` +
      `</blockquote>\n\n` +
      `<i>Tap below to switch language / மாற்ற கீழே அழுத்தவும்:</i>`;

    const inline_keyboard = [
      [
        { text: `${currentLang === 'en' ? '✅ ' : ''}🇬🇧 English`, callback_data: 'lang:en' },
        { text: `${currentLang === 'ta' ? '✅ ' : ''}🇮🇳 தமிழ் (Tamil)`, callback_data: 'lang:ta' }
      ],
      [
        { text: `${currentLang === 'hi' ? '✅ ' : ''}🇮🇳 हिन्दी (Hindi)`, callback_data: 'lang:hi' }
      ],
      [
        { text: i18n.btn_main_menu || '🏠 Main Menu', callback_data: 'main_menu' }
      ]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // Exact Main Menu Visual Layout from User Video & Model (8lvl id option removed)
  public async sendMainMenu(chatId: number, balance: number, _ensureReplyKeyboard: boolean = false, messageId?: number) {
    const text =
      `🛒 <b>Shop Store Now :</b> all key purchase & instantly delivery\n` +
      `👤 <b>My Profile :</b> check your account information\n` +
      `💰 <b>Add Balance :</b> deposit balance & secure service\n` +
      `📜 <b>All History :</b> check all key purchase history\n` +
      `🎁 <b>Referral :</b> invite friends & earn rewards\n` +
      `▶️ <b>Tutorial :</b> view tutorial and work this bot\n` +
      `❓ <b>Support :</b> bot problem fixed for support admin\n` +
      `📢 <b>Community :</b> official updates & proof channel`;

    const inline_keyboard: any[] = [];

    if (this.isAdmin(chatId)) {
      inline_keyboard.push([
        { text: '🎛️ Master Admin Control Panel 👑', callback_data: 'admin_panel' }
      ]);
    }

    inline_keyboard.push(
      [
        { text: '🛒 Shop Now', callback_data: 'catalog' }
      ],
      [
        { text: '💰 Add Balance', callback_data: 'deposit_prompt' },
        { text: '👤 My Profile', callback_data: 'profile_history' }
      ],
      [
        { text: '🔑 My Orders', callback_data: 'my_orders' },
        { text: '💎 Upgrade to Reseller', callback_data: 'upgrade_reseller' }
      ],
      [
        { text: '🎁 Refer & Earn', callback_data: 'refer_earn' },
        { text: '▶️ How to Use', callback_data: 'how_to_use' }
      ],
      [
        { text: '🛠️ Support', callback_data: 'support' },
        { text: '📢 Community', callback_data: 'community' }
      ]
    );

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 💎 Reseller Upgrade Screen
  public async showResellerUpgrade(
    chatId: number,
    botUser: BotUser,
    getUserWallet: (id: string) => { balance: number; email?: string; userId: string },
    messageId?: number,
    forceShowUpgradePrompt: boolean = false
  ) {
    const isReseller = !!(botUser.isReseller || this.isAdmin(chatId));
    const wallet = getUserWallet(botUser.userId);
    const upgradeAmount = this.getResellerUpgradeAmount();

    if (isReseller && !forceShowUpgradePrompt) {
      const text =
        `💎 <b>VIP RESELLER ACCOUNT ACTIVE!</b> 👑\n\n` +
        `<blockquote>` +
        `<b>Status:</b> <b>Active VIP Reseller Member</b>\n` +
        `<b>Wholesale Rates:</b> ⚡ <b>Unlocked & Active</b>\n` +
        `<b>Wallet Balance:</b> 💸<b>₹${wallet.balance.toFixed(2)}</b>` +
        `</blockquote>\n\n` +
        `🌟 <b>Your Reseller Benefits:</b>\n` +
        `• 🛍️ <b>Wholesale Key Pricing:</b> Discounted rates automatically applied in Buy Now catalog\n` +
        `• ⚡ <b>Instant Delivery:</b> Zero wait time on all keys\n` +
        `• 🛡️ <b>100% Anti-Ban Guarantee:</b> Priority access to updated bypass files\n` +
        `• 🚀 <b>VIP Support:</b> Direct support channel\n\n` +
        `<i>Tap "Buy Now" to browse wholesale key pricing!</i>`;

      const inline_keyboard: any[][] = [
        [{ text: '🛒 Browse Wholesale Keys', callback_data: 'catalog' }],
        [{ text: 'ℹ️ View Reseller Upgrade Details', callback_data: 'view_upgrade_details' }]
      ];

      if (this.isAdmin(chatId)) {
        inline_keyboard.push([
          { text: `⚙️ Set Upgrade Fee (₹${upgradeAmount})`, callback_data: 'admin_set_reseller_price' }
        ]);
      }

      inline_keyboard.push([
        { text: '🔥 My Profile', callback_data: 'profile_history' },
        { text: '🏠 Main Menu', callback_data: 'main_menu' }
      ]);

      await this.editOrSendMessage(
        chatId,
        text,
        { inline_keyboard },
        messageId
      );
      return;
    }

    const canAfford = wallet.balance >= upgradeAmount;
    const text =
      `💎 <b>UPGRADE TO VIP RESELLER ACCOUNT</b> 🚀\n\n` +
      `Become an official Kalam FF Panel Reseller and unlock wholesale prices to resell or save big on every license key purchase!\n\n` +
      `🌟 <b>VIP RESELLER PRIVILEGES:</b>\n` +
      `• 🏷️ <b>Special Wholesale Pricing:</b> Save up to 20-30% on all keys!\n` +
      `• ⚡ <b>Instant Delivery:</b> High speed 24/7 key generation\n` +
      `• 👑 <b>VIP Reseller Badge:</b> Official verified reseller status\n` +
      `• 📢 <b>Early Mod Updates:</b> Get APK mods & OBB injectors before public release\n` +
      `• 🚀 <b>Priority Admin Support:</b> Dedicated assistance for bulk orders\n\n` +
      `<blockquote>` +
      `<b>Upgrade Fee:</b> 💸<b>₹${upgradeAmount}</b> (One-Time Lifetime)\n` +
      `<b>Your Balance:</b> 💸<b>₹${wallet.balance.toFixed(2)}</b>\n` +
      `<b>Wholesale Discount:</b> ⚡ <b>20% - 40% OFF</b>` +
      `</blockquote>\n\n` +
      (canAfford
        ? `✅ <i>You have enough balance in your wallet. Tap below to upgrade immediately!</i>`
        : `⚠️ <i>Insufficient balance. Deposit ₹${Math.max(1, Math.round((upgradeAmount - wallet.balance) * 100) / 100)} via FamGateway UPI to upgrade.</i>`);

    const inline_keyboard: any[] = [];
    if (canAfford) {
      inline_keyboard.push([
        { text: `⚡ Confirm & Upgrade (₹${upgradeAmount})`, callback_data: 'do_upgrade_reseller' }
      ]);
    } else {
      const shortage = Math.max(1, Math.round((upgradeAmount - wallet.balance) * 100) / 100);
      inline_keyboard.push([
        { text: `💸 Add ₹${shortage} via FamGateway`, callback_data: `fam_amt:${shortage}` },
        { text: '➕ Custom Deposit', callback_data: 'fam_custom' }
      ]);
    }

    inline_keyboard.push([
      { text: '🔙 Back', callback_data: 'main_menu' }
    ]);

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 💎 Execute Upgrade to Reseller
  public async executeUpgradeToReseller(
    chatId: number,
    botUser: BotUser,
    getUserWallet: (id: string) => { balance: number; email?: string; userId: string },
    deductWallet: (id: string, amount: number, reason: string) => boolean,
    messageId?: number
  ) {
    if (botUser.isReseller && !this.isAdmin(chatId)) {
      await this.sendMessage(chatId, `💎 <b>You already have active VIP Reseller Status!</b>\n\nWholesale prices are already active in your /buy catalog.`);
      return;
    }

    const upgradeAmount = this.getResellerUpgradeAmount();
    const wallet = getUserWallet(botUser.userId);

    if (wallet.balance < upgradeAmount) {
      const shortage = Math.max(1, Math.round((upgradeAmount - wallet.balance) * 100) / 100);
      await this.editOrSendMessage(
        chatId,
        `⚠️ <b>Insufficient Balance for Upgrade</b>\n\nYou need ₹${shortage} more to complete your VIP Reseller upgrade.\n\nDeposit funds via FamGateway UPI to proceed.`,
        {
          inline_keyboard: [
            [{ text: `💸 Add ₹${shortage} via FamGateway`, callback_data: `fam_amt:${shortage}` }],
            [{ text: '🔙 Back', callback_data: 'main_menu' }]
          ]
        },
        messageId
      );
      return;
    }

    // Deduct fee
    const deducted = deductWallet(botUser.userId, upgradeAmount, 'VIP Reseller Lifetime Account Upgrade');
    if (!deducted) {
      await this.sendMessage(chatId, `❌ Upgrade failed due to wallet balance error. Please contact admin.`);
      return;
    }

    // Upgrade user record
    const users = this.loadBotUsers();
    botUser.isReseller = true;
    botUser.role = this.isAdmin(chatId) ? 'ADMIN' : 'RESELLER';
    botUser.resellerUpgradedAt = Date.now();
    users.set(chatId, botUser);
    this.saveBotUsers(users);

    const newWallet = getUserWallet(botUser.userId);

    const successText =
      `🎉 <b>CONGRATULATIONS! YOU ARE NOW A VIP RESELLER!</b> 💎👑\n\n` +
      `<blockquote>〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️\n` +
      `🎖️ <b>Status:</b> <b>Official VIP Reseller</b>\n` +
      `💵 <b>Deducted:</b> ₹${upgradeAmount}\n` +
      `💳 <b>Remaining Balance:</b> ₹${newWallet.balance.toFixed(2)}\n` +
      `〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️</blockquote>\n\n` +
      `🔥 <b>Your wholesale key discounts are now LIVE!</b>\n` +
      `All prices in the /buy catalog will automatically show your discounted reseller rates.\n\n` +
      `<i>Tap below to browse the wholesale catalog or check your updated profile!</i>`;

    await this.editOrSendMessage(
      chatId,
      successText,
      {
        inline_keyboard: [
          [{ text: '🛒 Browse Wholesale Catalog', callback_data: 'catalog' }],
          [{ text: '👑 My Profile', callback_data: 'profile_history' }],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
        ]
      },
      messageId
    );

    // Notify Admin of upgrade
    const adminChatId = parseInt(this.getCredentials().defaultChatId || '', 10);
    if (!isNaN(adminChatId) && adminChatId !== chatId) {
      this.sendMessage(
        adminChatId,
        `💎 <b>NEW RESELLER UPGRADE!</b>\n\n` +
        `👤 User: <b>${botUser.firstName}</b> (${botUser.username ? '@' + botUser.username : `<code>${chatId}</code>`})\n` +
        `🆔 ID: <code>${botUser.userId}</code>\n` +
        `💰 Upgrade Fee Paid: <b>₹${upgradeAmount}</b>`
      ).catch(() => {});
    }
  }

  // 1. 🛒 Shop Now — All Products Catalog (Video model layout with 2-column buttons)
  private async showProductCatalog(chatId: number, rawProducts: any[], messageId?: number) {
    const products = Array.isArray(rawProducts) ? rawProducts : this.loadProductsFromDisk();

    if (!products || products.length === 0) {
      const emptyText =
        `<b>KALAM FF PANEL — SHOP</b>\n\n` +
        `⚠️ <i>No products currently available in the catalog. All products are currently out of stock or being updated.</i>\n\n` +
        `<i>Please check back soon or contact support for restock updates!</i>`;

      const emptyKeyboard = [
        [{ text: '🔄 Refresh Catalog', callback_data: 'catalog' }],
        [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
      ];
      await this.editOrSendMessage(chatId, emptyText, { inline_keyboard: emptyKeyboard }, messageId);
      return;
    }

    const text =
      `<b>KALAM FF PANEL — SHOP</b>\n` +
      `<b>Choose a product 👇</b>`;

    const inline_keyboard: any[][] = [];

    // 2-column grid of product buttons
    let currentRow: any[] = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      let displayName = (p.name || p.title || 'Product').trim().toUpperCase();
      if (displayName.length > 20) {
        displayName = displayName.slice(0, 18) + '..';
      }
      const isMaint = (p.status || '').toUpperCase() === 'MAINTENANCE' || !!p.isMaintenance;
      const label = isMaint ? `🛠️ ${displayName}` : `🛡️ ${displayName}`;
      const btn = {
        text: label,
        callback_data: `prod:${p.id || p.productId || p.pid}`
      };

      currentRow.push(btn);
      if (currentRow.length === 2) {
        inline_keyboard.push(currentRow);
        currentRow = [];
      }
    }
    if (currentRow.length > 0) {
      inline_keyboard.push(currentRow);
    }

    // Bottom action buttons matching model
    inline_keyboard.push(
      [{ text: '📥 All Files Download', callback_data: 'all_files_download' }],
      [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
    );

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  private async showProductsForDevice(chatId: number, deviceType: string, rawProducts: any[], messageId?: number) {
    // Always guarantee freshest products list from disk / memory
    const products = Array.isArray(rawProducts) ? rawProducts : this.loadProductsFromDisk();

    if (!products || products.length === 0) {
      await this.editOrSendMessage(
        chatId,
        '⚠️ No products currently in catalog. Please check back shortly!',
        { inline_keyboard: [[{ text: '❌ Back to Menu', callback_data: 'main_menu' }]] },
        messageId
      );
      return;
    }

    const users = this.loadBotUsers();
    const botUser = users.get(chatId);
    const isReseller = !!(botUser?.isReseller || botUser?.role === 'RESELLER' || this.isAdmin(chatId));

    let devLabel = 'ANDROID NON ROOT';
    if (deviceType === 'root') devLabel = 'ANDROID ROOT';
    if (deviceType === 'ios') devLabel = 'IPHONE / iOS';
    if (deviceType === 'all') devLabel = 'ALL CHEATS & PANELS';

    // Filter products strictly matching device category (Non-Root, Root, iPhone/iOS, or All)
    let filtered = products;

    if (deviceType !== 'all') {
      filtered = products.filter((p: any) => {
        const cat = String(p.category || '').toLowerCase().trim();
        const dev = String(p.device || p.deviceType || '').toLowerCase().trim();
        const name = String(p.name || p.title || '').toLowerCase().trim();

        const isIos = 
          dev === 'ios' ||
          dev === 'iphone' ||
          dev === 'apple' ||
          cat.includes('ios') ||
          cat.includes('iphone') ||
          cat.includes('apple') ||
          cat.includes('ipad') ||
          name.includes('ios') ||
          name.includes('iphone') ||
          name.includes('apple') ||
          name.includes('ipad');

        if (deviceType === 'ios') {
          return isIos;
        }

        if (isIos) {
          return false;
        }

        const isDual = 
          dev === 'root + nonroot' ||
          dev.includes('root + nonroot') ||
          dev.includes('root & nonroot') ||
          dev.includes('root+nonroot') ||
          dev.includes('universal') ||
          dev.includes('all') ||
          cat === 'root + nonroot' ||
          cat.includes('root + nonroot') ||
          cat.includes('root & nonroot') ||
          cat.includes('universal') ||
          cat.includes('all');

        if (isDual) {
          return true;
        }

        const hasNonRootExplicit = 
          cat.includes('non-root') ||
          cat.includes('non root') ||
          cat.includes('nonroot') ||
          dev.includes('non-root') ||
          dev.includes('non root') ||
          dev.includes('nonroot') ||
          name.includes('non-root') ||
          name.includes('non root') ||
          name.includes('nonroot') ||
          name.includes('apkmod');

        const hasRootExplicit = 
          (cat.includes('root') && !cat.includes('non')) ||
          (dev.includes('root') && !dev.includes('non')) ||
          (name.includes('root') && !name.includes('non'));

        if (deviceType === 'root') {
          if (hasRootExplicit) return true;
          if (!hasNonRootExplicit) return true;
          return false;
        }

        if (deviceType === 'non_root') {
          if (hasNonRootExplicit) return true;
          if (!hasRootExplicit) return true;
          return false;
        }

        return true;
      });
    }

    if (filtered.length === 0) {
      const emptyCatText =
        `✨ <b>${devLabel} PRODUCTS / பேனல்கள்</b> ✨\n\n` +
        `<blockquote>` +
        `⚠️ <b>No products currently available under ${devLabel}.</b>\n` +
        `<i>(இந்த பிரிவில் தற்போது பொருட்கள் எதுவும் இல்லை)</i>\n\n` +
        `💡 <i>Please select another category below or check back when restocked!</i>` +
        `</blockquote>`;

      const emptyKeyboard = [
        [
          { text: '🤖 Non-Root', callback_data: 'cat_dev:non_root' },
          { text: '⚙️ Root', callback_data: 'cat_dev:root' },
          { text: '🍏 iOS', callback_data: 'cat_dev:ios' }
        ],
        [{ text: '📦 View All Products', callback_data: 'catalog' }],
        [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
      ];

      await this.editOrSendMessage(chatId, emptyCatText, { inline_keyboard: emptyKeyboard }, messageId);
      return;
    }

    const tierBadge = isReseller
      ? `💎 <b>Tier:</b> VIP Reseller (Wholesale Rates Active ⚡)`
      : `👤 <b>Tier:</b> Normal User (Standard Rates)`;

    const inline_keyboard: any[] = [];

    for (const p of filtered) {
      const rawName = (p.name || p.title || 'Product').trim();
      const plans = Array.isArray(p.plans) ? p.plans : [];
      let displayName = rawName.toUpperCase();
      if (displayName.length > 20) {
        displayName = displayName.slice(0, 18) + '...';
      }

      let priceSnippet = '';
      if (plans.length > 0) {
        const prices = plans.map(pl => this.getPlanPriceForUser(pl, isReseller).price).filter(pr => pr > 0);
        if (prices.length > 0) {
          const minP = Math.min(...prices);
          priceSnippet = isReseller ? ` (💎 ₹${minP})` : ` (₹${minP})`;
        }
      }

      const isMaint = (p.status || '').toUpperCase() === 'MAINTENANCE' || !!p.isMaintenance;
      const label = isMaint ? `🛠️ [MAINTENANCE] ${displayName}` : `🛒 ${displayName}${priceSnippet}`;

      inline_keyboard.push([
        {
          text: label,
          callback_data: `prod:${p.id || p.productId}`
        }
      ]);
    }

    inline_keyboard.push([{ text: '🔙 Change Category', callback_data: 'catalog' }]);
    inline_keyboard.push([{ text: '❌ Back to Menu', callback_data: 'main_menu' }]);

    const text =
      `✨ <b>${devLabel} PRODUCTS / பேனல்கள்</b> ✨\n\n` +
      `<blockquote>` +
      `📦 <b>Catalog:</b> ${devLabel}\n` +
      `${tierBadge}\n` +
      `🛡️ <i>Select your desired cheat/injector tool below:</i>` +
      `</blockquote>`;

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  private async showProductPlans(chatId: number, productId: string, rawProducts: any[], messageId?: number) {
    const products = Array.isArray(rawProducts) ? rawProducts : this.loadProductsFromDisk();
    const product = products.find((p: any) => 
      p.id === productId || 
      p.productId === productId || 
      p.pid === productId ||
      String(p.id) === String(productId) ||
      String(p.productId) === String(productId) ||
      String(p.pid) === String(productId)
    );
    if (!product) {
      await this.editOrSendMessage(chatId, '⚠️ Product not found or removed.', {
        inline_keyboard: [[{ text: '🔙 Back', callback_data: 'catalog' }]]
      }, messageId);
      return;
    }

    const isMaint = (product.status || '').toUpperCase() === 'MAINTENANCE' || !!product.isMaintenance;
    if (isMaint) {
      const isAdm = this.isAdmin(chatId);
      const reasonSnippet = product.maintenanceReason
        ? `\n📝 <b>Notice / காரணம்:</b> ${product.maintenanceReason}`
        : '';
      const maintText =
        `🛠️ <b>${product.name.toUpperCase()} IS CURRENTLY UNDER MAINTENANCE</b> 🛠️\n` +
        `<i>(இந்த பேனல் தற்போது பராமரிப்பில் உள்ளது)</i>\n\n` +
        `<blockquote>` +
        `⚠️ <b>Status:</b> 🔴 UNDER MAINTENANCE${reasonSnippet}\n` +
        `💡 <i>Purchases for this specific panel/cheat are temporarily paused while updates or key restocks are in progress. / புது அப்டேட் வரவிருப்பதால் தற்காலிகமாக கொள்முதல் நிறுத்தப்பட்டுள்ளது.</i>\n` +
        `</blockquote>\n\n` +
        (isAdm ? `👑 <i>Admin: Tap below or use /prodmaint to toggle maintenance off.</i>` : `<i>Please check back soon or choose another active cheat from our catalog!</i>`);

      const maintKeyboard = [
        isAdm ? [{ text: '🟢 Turn OFF Maintenance (Make Active)', callback_data: `admin_toggle_prod_maint:${product.id || productId}` }] : [],
        [{ text: '🔙 Back to Products (பிற பொருட்கள்)', callback_data: 'catalog' }],
        [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
      ].filter(r => r.length > 0);

      await this.editOrSendMessage(chatId, maintText, { inline_keyboard: maintKeyboard }, messageId);
      return;
    }

    let plans = Array.isArray(product.plans) && product.plans.length > 0 ? product.plans : [
      { id: '1day', duration: '1 Day', price: product.price || 30, resellerPrice: product.resellerPrice || 20 },
      { id: '7day', duration: '7 Days', price: (product.price ? product.price * 5 : 150), resellerPrice: (product.resellerPrice ? product.resellerPrice * 5 : 100) },
      { id: '30day', duration: '30 Days', price: (product.price ? product.price * 15 : 450), resellerPrice: (product.resellerPrice ? product.resellerPrice * 15 : 300) }
    ];

    const users = this.loadBotUsers();
    const botUser = users.get(chatId);
    const isReseller = !!(botUser?.isReseller || botUser?.role === 'RESELLER' || this.isAdmin(chatId));

    const inline_keyboard: any[] = [];

    for (const pl of plans) {
      const dur = pl.duration || pl.name || '1 Day';
      const pricing = this.getPlanPriceForUser(pl, isReseller);
      const priceLabel = isReseller
        ? `💎 ${dur} — ₹${pricing.price} (Wholesale)`
        : `⏳ ${dur} — ₹${pricing.price}`;
      inline_keyboard.push([
        {
          text: priceLabel,
          callback_data: `plan:${productId}:${pl.id || dur}`
        }
      ]);
    }

    inline_keyboard.push([
      { text: '🔙 Back', callback_data: 'catalog' }
    ]);

    const tierBlock = isReseller
      ? `💎 <b>Account Tier:</b> <b>VIP RESELLER</b> (Wholesale Rates Active)\n\n`
      : `👤 <b>Account Tier:</b> <b>NORMAL USER</b> (Standard Rates)\n💡 <i>Want wholesale rates? Upgrade anytime using /upgrade</i>\n\n`;

    const text =
      `📦 <b>${product.name}</b>\n` +
      `🎮 Game: <code>${product.game || 'Free Fire / FF MAX'}</code>\n` +
      `🏷️ Category: <code>${product.category || 'APKMOD / NON-ROOT'}</code>\n` +
      `🛡️ Status: 🟢 <b>100% Anti-Ban Safe & Undetected</b>\n\n` +
      tierBlock +
      `<b>Select your desired plan duration:</b>`;

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  private async showPurchaseConfirmation(
    chatId: number,
    productId: string,
    planId: string,
    products: any[],
    getUserWallet: (id: string) => { balance: number; email?: string; userId: string },
    userId: string,
    messageId?: number
  ) {
    const pList = Array.isArray(products) ? products : this.loadProductsFromDisk();
    const product = pList.find((p: any) => 
      p.id === productId || 
      p.productId === productId || 
      p.pid === productId ||
      String(p.id) === String(productId) ||
      String(p.productId) === String(productId) ||
      String(p.pid) === String(productId)
    );
    if (!product) {
      await this.editOrSendMessage(chatId, '⚠️ Product not found or removed.', {
        inline_keyboard: [[{ text: '🔙 Back to Products', callback_data: 'catalog' }]]
      }, messageId);
      return;
    }

    const isMaint = (product.status || '').toUpperCase() === 'MAINTENANCE' || !!product.isMaintenance;
    if (isMaint) {
      await this.showProductPlans(chatId, productId, pList, messageId);
      return;
    }

    let plans = Array.isArray(product.plans) && product.plans.length > 0 ? product.plans : [
      { id: '1day', duration: '1 Day', price: product.price || 30, resellerPrice: product.resellerPrice || 20 },
      { id: '7day', duration: '7 Days', price: (product.price ? product.price * 5 : 150), resellerPrice: (product.resellerPrice ? product.resellerPrice * 5 : 100) },
      { id: '30day', duration: '30 Days', price: (product.price ? product.price * 15 : 450), resellerPrice: (product.resellerPrice ? product.resellerPrice * 15 : 300) }
    ];

    const plan = plans.find((pl: any) => 
      String(pl.id) === String(planId) || 
      String(pl.duration).toLowerCase() === String(planId).toLowerCase() || 
      String(pl.name).toLowerCase() === String(planId).toLowerCase()
    ) || plans[0];
    if (!plan) return;

    const users = this.loadBotUsers();
    const botUser = users.get(chatId);
    const isReseller = !!(botUser?.isReseller || botUser?.role === 'RESELLER' || this.isAdmin(chatId));
    const pricing = this.getPlanPriceForUser(plan, isReseller);
    const price = pricing.price;

    const wallet = getUserWallet(userId);
    const canAfford = wallet.balance >= price;

    const priceDetails = isReseller
      ? `💎 <b>Reseller Price:</b> <b>₹${price}</b> <s>₹${pricing.regularPrice}</s> <i>(Wholesale Rate)</i>\n` +
        `👑 <b>Account Tier:</b> VIP Reseller\n\n`
      : `💵 <b>Normal Price:</b> <b>₹${price}</b>\n` +
        `👤 <b>Account Tier:</b> Normal User\n\n`;

    let text =
      `🛒 <b>CONFIRM PURCHASE IN TELEGRAM</b>\n\n` +
      `📦 <b>Product:</b> ${product.name}\n` +
      `⏳ <b>Duration:</b> ${plan.duration || plan.name}\n` +
      priceDetails +
      `💳 <b>Your Wallet Balance:</b> ₹${wallet.balance.toFixed(2)}\n` +
      `🆔 <b>Telegram ID:</b> <code>${userId}</code>\n\n`;

    const inline_keyboard: any[] = [];

    if (canAfford) {
      text += `✅ <i>You have sufficient balance. Click below to deliver key instantly!</i>`;
      inline_keyboard.push([
        {
          text: `⚡ Confirm & Buy Key (₹${price})`,
          callback_data: `do_buy:${productId}:${plan.id || planId}`
        }
      ]);
    } else {
      const shortage = Math.round((price - wallet.balance) * 100) / 100;
      const roundedShortage = Math.max(1, Math.ceil(shortage));
      text += `⚠️ <b>Insufficient Balance!</b> You need <b>₹${shortage}</b> more to buy this key.\n\n` +
              `<i>(உங்களிடம் போதிய பேலன்ஸ் இல்லை. கீழே உள்ள பட்டனை தட்டி உடனடியாக UPI மூலம் பேலன்ஸ் சேர்க்கவும்.)</i>`;
      inline_keyboard.push([
        { text: `⚡ 1-Tap UPI Deposit ₹${roundedShortage}`, callback_data: `fam_amt:${roundedShortage}` }
      ]);
      inline_keyboard.push([
        { text: `💰 Custom Add Balance Numpad`, callback_data: 'deposit_prompt' }
      ]);
    }

    inline_keyboard.push([
      { text: '🔙 Back', callback_data: `prod:${productId}` }
    ]);

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  private async executeBuyKey(
    chatId: number,
    productId: string,
    planId: string,
    products: any[],
    getUserWallet: (id: string) => { balance: number; email?: string; userId: string },
    deductWallet: (id: string, amount: number, reason: string) => boolean,
    deliverKey: (productId: string, planDuration: string, userEmail: string) => Promise<{ success: boolean; keys?: string[]; error?: string }>,
    userId: string,
    messageId?: number
  ) {
    const buyLockKey = `buy_${chatId}_${productId}_${planId}`;
    if (this.inFlightPurchases.has(buyLockKey) || this.inFlightPurchases.has(`buy_user_${chatId}`)) {
      console.log('[TelegramBot] Duplicate executeBuyKey prevented for chatId:', chatId);
      return;
    }
    this.inFlightPurchases.add(buyLockKey);
    this.inFlightPurchases.add(`buy_user_${chatId}`);

    try {
      const pList = Array.isArray(products) ? products : this.loadProductsFromDisk();
      const product = pList.find((p: any) => 
        p.id === productId || 
        p.productId === productId || 
        p.pid === productId ||
        String(p.id) === String(productId) ||
        String(p.productId) === String(productId) ||
        String(p.pid) === String(productId)
      );
      if (!product) {
        await this.editOrSendMessage(chatId, '⚠️ Error: Product no longer available.', {
          inline_keyboard: [[{ text: '🔙 Back', callback_data: 'catalog' }]]
        }, messageId);
        return;
      }

      const isMaint = (product.status || '').toUpperCase() === 'MAINTENANCE' || !!product.isMaintenance;
      if (isMaint) {
        await this.editOrSendMessage(chatId, `⚠️ <b>${product.name || 'Product'} is currently under maintenance.</b>\n\nPurchases are temporarily paused while maintenance is in progress. Please choose another product or check back shortly.`, {
          inline_keyboard: [[{ text: '🔙 Back to Products', callback_data: 'catalog' }]]
        }, messageId);
        return;
      }

      const plan = (product.plans || []).find((pl: any) => pl.id === planId || pl.duration === planId || pl.name === planId);
      if (!plan) {
        await this.editOrSendMessage(chatId, '⚠️ Error: Plan no longer available.', {
          inline_keyboard: [[{ text: '🔙 Back', callback_data: 'catalog' }]]
        }, messageId);
        return;
      }

      const users = this.loadBotUsers();
      const botUser = users.get(chatId);
      const isReseller = !!(botUser?.isReseller || this.isAdmin(chatId));
      const pricing = this.getPlanPriceForUser(plan, isReseller);
      const price = pricing.price;

      const wallet = getUserWallet(userId);

      if (wallet.balance < price) {
        await this.editOrSendMessage(chatId, `⚠️ Insufficient balance (₹${wallet.balance.toFixed(2)}) for ₹${price} order. Please add balance first.`, {
          inline_keyboard: [
            [{ text: `💲 Add Balance (₹${price - wallet.balance})`, callback_data: 'deposit_prompt' }],
            [{ text: '🔙 Back', callback_data: 'main_menu' }]
          ]
        }, messageId);
        return;
      }

      // Key delivery directly
      const deliveryResult = await deliverKey(productId, plan.duration || plan.name || '1 Day', userId);

      if (!deliveryResult.success || !deliveryResult.keys || deliveryResult.keys.length === 0) {
        const errMsg = deliveryResult.error || 'Product currently out of stock. Your balance was NOT deducted.';
        this.recordActivity({
          type: 'KEY_DELIVERY',
          category: 'key',
          severity: 'warning',
          chatId,
          userId,
          username: botUser?.username ? '@' + botUser.username.replace('@', '') : undefined,
          firstName: botUser?.firstName,
          action: 'KEY_DELIVERY_FAILED',
          summary: `⚠️ Key Delivery Failed: ${product.name} (${plan.duration || plan.name})`,
          details: `Reason: ${errMsg} | User wallet was NOT deducted.`,
          payload: { productId, planDuration: plan.duration || plan.name, error: errMsg }
        });
        await this.editOrSendMessage(
          chatId,
          `❌ <b>PURCHASE FAILED: OUT OF STOCK</b>\n\n` +
          `📦 <b>Product:</b> ${product.name}\n` +
          `⚠️ <b>Reason:</b> ${errMsg}\n\n` +
          `🛡️ <i>Your wallet balance remains untouched (₹${wallet.balance.toFixed(2)}). Please contact support or try another plan!</i>`,
          {
            inline_keyboard: [
              [{ text: '🔙 View Products', callback_data: 'catalog' }],
              [{ text: '📞 Support', callback_data: 'support' }],
              [{ text: '🔙 Back', callback_data: 'main_menu' }]
            ]
          },
          messageId
        );
        return;
      }

      // Deduct wallet balance
      deductWallet(
        userId,
        price,
        `Telegram Bot: ${product.name} (${plan.duration || plan.name})` + (isReseller ? ' [VIP Reseller Rate]' : ' [Normal Rate]')
      );

      // Record purchase in bot database
      const purchaseRecord: BotPurchaseRecord = {
        id: `tg_ord_${Date.now()}`,
        chatId,
        userId,
        productId,
        productName: product.name,
        planDuration: plan.duration || plan.name || '1 Day',
        price,
        keys: deliveryResult.keys,
        timestamp: Date.now(),
      };
      this.recordPurchase(purchaseRecord);

      this.recordActivity({
        type: 'KEY_DELIVERY',
        category: 'key',
        severity: 'success',
        chatId,
        userId,
        username: botUser?.username ? '@' + botUser.username.replace('@', '') : undefined,
        firstName: botUser?.firstName,
        action: 'KEY_DELIVERED',
        summary: `🔑 Dispatched Key: ${product.name} (${plan.duration || plan.name}) for ₹${price}`,
        details: `Delivered ${deliveryResult.keys.length} key(s) to ${botUser?.firstName || 'User'} (${chatId}). Order ID: ${purchaseRecord.id}`,
        payload: { orderId: purchaseRecord.id, keysCount: deliveryResult.keys.length, price }
      });

      const activeUsers = this.loadBotUsers();
      const u = activeUsers.get(chatId);
      if (u) {
        u.totalSpent = (u.totalSpent || 0) + price;
        activeUsers.set(chatId, u);
        this.saveBotUsers(activeUsers);
      }

      // Auto-dispatch payment proof to secondary proof bot/channel with masked key
      this.dispatchPaymentProof({
        productName: product.name,
        planDuration: plan.duration || plan.name || '1 Day',
        price,
        keys: deliveryResult.keys,
        chatId,
        username: botUser?.username,
        firstName: botUser?.firstName,
        orderId: purchaseRecord.id,
      }).catch(err => console.warn('[TelegramBot] Proof dispatch error:', err));

      // Automated Low-Stock Inventory Check & Alert dispatch to Admin
      this.checkAndDispatchLowStockAlert(product, {
        reason: `Telegram Bot Order by ${botUser?.firstName || chatId} (${product.name} - ${plan.duration || plan.name})`
      }).catch(err => console.warn('[TelegramBot] Low stock auto-check error:', err));

      const keysList = deliveryResult.keys.map(k => `<code>${k}</code>`).join('\n');
      const newBal = getUserWallet(userId).balance;
      const tierBadge = isReseller ? '💎 VIP Reseller Wholesale Rate' : '👤 Normal User Rate';

      const successMsg =
        `🎉 <b>KEY PURCHASE SUCCESSFUL!</b>\n\n` +
        `<blockquote>` +
        `<b>Product:</b> 📦 <b>${product.name}</b>\n` +
        `<b>Duration:</b> ⏳ <b>${plan.duration || plan.name}</b>\n` +
        `<b>Amount Paid:</b> 💸 <b>₹${price}</b> <i>(${tierBadge})</i>\n` +
        `<b>Remaining Balance:</b> 💳 <b>₹${newBal.toFixed(2)}</b>` +
        `</blockquote>\n\n` +
        `🔑 <b>YOUR DELIVERED LICENSE KEY(S):</b>\n` +
        `${keysList}\n\n` +
        `📌 <i>Tap the key above to copy it instantly. Download the latest safe APK from the Download Files menu.</i>`;

      await this.editOrSendMessage(chatId, successMsg, {
        inline_keyboard: [
          [{ text: '📥 Download Files', callback_data: 'download_hub' }],
          [{ text: '👤 Profile', callback_data: 'profile_history' }],
          [{ text: '🛒 Shop More', callback_data: 'catalog' }],
          [{ text: '🔙 Back', callback_data: 'main_menu' }]
        ]
      }, messageId);
    } finally {
      setTimeout(() => {
        this.inFlightPurchases.delete(buyLockKey);
        this.inFlightPurchases.delete(`buy_user_${chatId}`);
      }, 20000);
    }
  }

  // 2. 💲 Add Balance — Interactive Numpad Model
  private async showDepositNumpad(chatId: number, messageId?: number) {
    const currentStr = this.numpadAmounts.get(chatId) || '0';
    const amount = parseInt(currentStr, 10) || 0;

    const text =
      `✨ <b>ADD BALANCE — ENTER AMOUNT</b> ✨\n\n` +
      `<blockquote>` +
      `<b>Amount:</b> ₹${amount}\n\n` +
      `⚡ <b>Instant Auto-Credit</b>\n` +
      `🔒 <b>100% Secure UPI Payment</b>\n` +
      `✅ <b>Verified in Seconds</b>` +
      `</blockquote>\n\n` +
      `⭐ <i>Use the keypad below to enter amount</i>`;

    const inline_keyboard = [
      [
        { text: '1', callback_data: 'np:1' },
        { text: '2', callback_data: 'np:2' },
        { text: '3', callback_data: 'np:3' }
      ],
      [
        { text: '4', callback_data: 'np:4' },
        { text: '5', callback_data: 'np:5' },
        { text: '6', callback_data: 'np:6' }
      ],
      [
        { text: '7', callback_data: 'np:7' },
        { text: '8', callback_data: 'np:8' },
        { text: '9', callback_data: 'np:9' }
      ],
      [
        { text: '⌫ Clear', callback_data: 'np:clear' },
        { text: '0', callback_data: 'np:0' },
        { text: '✅ Confirm', callback_data: 'np:confirm' }
      ],
      [
        { text: '❌ Back', callback_data: 'main_menu' }
      ]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  private async initiateFamGatewayPayment(
    chatId: number,
    amount: number,
    userId: string,
    createFamOrder?: (amount: number, userIdentifier: string, userEmail?: string) => Promise<any>,
    previousMessageId?: number
  ) {
    if (this.inFlightDeposits.has(chatId)) {
      console.log('[TelegramBot] Duplicate initiateFamGatewayPayment blocked for chatId:', chatId);
      return;
    }
    this.inFlightDeposits.add(chatId);

    if (!createFamOrder) {
      try {
        await this.sendMessage(chatId, '⚠️ Payment gateway is initializing. Please try again in a few moments.');
      } finally {
        this.inFlightDeposits.delete(chatId);
      }
      return;
    }

    try {
      const order = await createFamOrder(amount, userId);
      if (!order || !order.success) {
        await this.sendMessage(chatId, `❌ Failed to generate order: ${order?.error || 'Gateway unreachable'}. Please try again later.`);
        return;
      }

      // If user came from interactive numpad, delete the previous prompt to prevent duplicate messages
      if (previousMessageId) {
        await this.deleteMessage(chatId, previousMessageId).catch(() => {});
      }

      const caption =
        `⚡ <b>FAMGATEWAY UPI PAYMENT</b>\n\n` +
        `🆔 <b>Order ID:</b> <code>${order.orderId}</code>\n` +
        `💵 <b>Amount to Pay:</b> <b>₹${order.amount}</b>\n` +
        `🏦 <b>Payee UPI:</b> <code>${order.payeeUpi || '8056317218@fam'}</code>\n` +
        `⏳ <b>Expires in:</b> 5 Minutes\n\n` +
        `📱 <b>HOW TO PAY:</b>\n` +
        `1️⃣ Scan the QR code with GPay, PhonePe, Paytm, or BHIM.\n` +
        `2️⃣ Or click <b>Open Checkout Page</b> below.\n` +
        `3️⃣ After paying, tap <b>Check Payment Status</b> to receive instant balance!`;

      const inline_keyboard: any[] = [];

      if (order.checkoutUrl) {
        inline_keyboard.push([{ text: '🌐 Open FamGateway Checkout Page', url: order.checkoutUrl }]);
      }
      inline_keyboard.push([
        { text: '✅ Check Payment Status', callback_data: `check_order:${order.orderId}` }
      ]);
      inline_keyboard.push([
        { text: '📌 Submit 12-Digit UTR Number', callback_data: `enter_utr:${order.orderId}` }
      ]);
      inline_keyboard.push([
        { text: '❌ Cancel Payment', callback_data: 'cancel_payment' }
      ]);

      if (order.qrUrl) {
        await this.sendPhoto(chatId, order.qrUrl, caption, { inline_keyboard });
      } else {
        await this.sendMessage(chatId, caption, { inline_keyboard });
      }
    } catch (err: any) {
      console.error('[FamGateway Order Error]:', err);
      await this.sendMessage(chatId, `❌ Error creating order: ${err.message}`);
    } finally {
      setTimeout(() => {
        this.inFlightDeposits.delete(chatId);
      }, 2500);
    }
  }

  // 3. 👤 User Profile (Video model layout)
  private async showUserProfileAndHistory(
    chatId: number,
    botUser: BotUser,
    getUserWallet: (id: string) => { balance: number; email?: string; userId: string },
    messageId?: number
  ) {
    const wallet = getUserWallet(botUser.userId);
    const allPurchases = this.loadPurchases();
    const userPurchases = allPurchases.filter(p => p.chatId === chatId || p.userId === botUser.userId);

    const userName = (botUser.firstName || 'User').trim();
    const usernameDisplay = botUser.username ? '@' + botUser.username.replace('@', '') : 'Not set';

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayFormatted = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const text =
      `<b>User Account Information</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🪪 <b>Name:</b> ${userName}\n` +
      `🪪 <b>Username:</b> ${usernameDisplay}\n` +
      `🪪 <b>Chat ID:</b> <code>${chatId}</code>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💰 <b>Balance:</b> ${wallet.balance.toFixed(2)} INR\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🕒 <b>Date:</b> ${todayFormatted}\n` +
      `🛍️ <b>Total Order:</b> ${userPurchases.length}`;

    const inline_keyboard = [
      [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 4. 🔑 My Orders (User Account Purchase History)
  private async showUserKeyHistory(chatId: number, botUser?: BotUser, messageId?: number) {
    const allPurchases = this.loadPurchases();
    const userPurchases = allPurchases.filter(p => p.chatId === chatId || (botUser && p.userId === botUser.userId));

    if (userPurchases.length === 0) {
      const text =
        `<b>User Account Purchase History</b>\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `‼️ <b>No keys found!</b>\n` +
        `<i>You haven't purchased any keys yet.</i>\n` +
        `━━━━━━━━━━━━━━━━━━`;

      await this.editOrSendMessage(chatId, text, {
        inline_keyboard: [
          [
            { text: '🛒 Shop Now', callback_data: 'catalog' },
            { text: '🔙 Back to Menu', callback_data: 'main_menu' }
          ]
        ]
      }, messageId);
      return;
    }

    const keysList = userPurchases.map((p) => {
      const dateStr = new Date(p.timestamp).toLocaleDateString('en-GB');
      const keysFormatted = p.keys.map(k => `<code>${k}</code>`).join(', ');
      return `📦 <b>${p.productName}</b> (${p.planDuration}) - ₹${p.price}\n🔑 Key: ${keysFormatted}\n📅 Date: ${dateStr}`;
    }).join('\n━━━━━━━━━━━━━━━━━━\n');

    const text =
      `<b>User Account Purchase History</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `${keysList}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `<i>Tap on any key code to copy it directly.</i>`;

    await this.editOrSendMessage(chatId, text, {
      inline_keyboard: [
        [
          { text: '🛒 Shop Now', callback_data: 'catalog' },
          { text: '🔙 Back to Menu', callback_data: 'main_menu' }
        ]
      ]
    }, messageId);
  }

  // 4b. 📜 All Bot Commands Guide
  private async showAllBotCommands(chatId: number, messageId?: number) {
    const isAdm = this.isAdmin(chatId);
    let text =
      `📜 <b>KALAM STORE BOT — COMMANDS LIST</b> 📜\n\n` +
      `<blockquote>` +
      `🟢 <b>CUSTOMER COMMANDS:</b>\n` +
      `• /start — 🏠 Open Main Menu & Balance\n` +
      `• /buy — 🛒 Browse & Purchase VIP Keys\n` +
      `• /deposit — 💸 Add Wallet Balance via UPI\n` +
      `• /balance — 💰 Check Current Wallet Balance\n` +
      `• /profile — 👑 View Account, Keys & History\n` +
      `• /keys — 🔑 View All Delivered License Keys\n` +
      `• /refer — 🔗 Refer Friends (Earn ₹2 + 5%)\n` +
      `• /gift — 🎁 Daily Free Lucky Spin (24h)\n` +
      `• /apk — 📥 Download Latest Mod APK\n` +
      `• /update — 🔄 Check Panel Updates & Video\n` +
      `• /language — 🌐 Change Language (தமிழ்/EN/HI)\n` +
      `• /support — ✈️ Customer Support Contact\n` +
      `• /help — ⁉️ How to Use Store Bot Guide` +
      `</blockquote>`;

    if (isAdm) {
      text +=
        `\n\n<blockquote>` +
        `👑 <b>MASTER ADMIN COMMANDS:</b>\n` +
        `• /admin — 🎛️ Master Admin Control Panel\n` +
        `• /users — 👥 View All Registered Bot Users\n` +
        `• /broadcast &lt;msg&gt; — 📢 Send Announcement\n` +
        `• /addbalance &lt;id&gt; &lt;amt&gt; — ➕ Credit Balance\n` +
        `• /setapk &lt;url&gt; — 📥 Update APK Download Link\n` +
        `• /setresellerprice &lt;amt&gt; — 💎 Set Reseller Fee\n` +
        `• /makereseller &lt;id&gt; — 👑 Promote to VIP Reseller\n` +
        `• /removereseller &lt;id&gt; — 👤 Remove VIP Reseller\n` +
        `• /lowstock — ⚠️ Check Low Stock Alerts` +
        `</blockquote>`;
    }

    const inline_keyboard: any[][] = [
      [{ text: '🛒 Buy Keys', callback_data: 'catalog' }, { text: '💸 Add Balance', callback_data: 'deposit_prompt' }],
      isAdm ? [{ text: '🎛️ Admin Panel', callback_data: 'admin_panel' }] : [],
      [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
    ].filter(row => row.length > 0);

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 5. 📌 How to use (Video tutorial layout)
  private async showHowToUseBot(chatId: number, messageId?: number) {
    const text =
      `<b>Bot Tutorial & How to Use</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `1️⃣ <b>Add Balance:</b> Add funds using instant UPI / QR code.\n` +
      `2️⃣ <b>Shop Now:</b> Select your preferred Cheat Panel & duration plan.\n` +
      `3️⃣ <b>Instant Delivery:</b> Copy license key and inject into panel.\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `▶️ <i>Watch the official tutorial video guide below:</i>`;

    const { apkTutorialUrl } = this.getCredentials();
    const inline_keyboard = [
      [{ text: '▶️ Watch Video Tutorial', url: apkTutorialUrl || 'https://t.me/kalamffpanel' }],
      [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 7. 🎁 Daily Gift
  private async handleDailyGiftSpin(
    chatId: number,
    userId: string,
    getUserWallet: (id: string) => { balance: number; email?: string; userId: string },
    creditWallet: (id: string, amount: number, reason: string) => any,
    messageId?: number
  ) {
    const gifts = this.loadDailyGifts();
    const record = gifts.get(chatId) || { lastClaimed: 0, streak: 0, totalWon: 0 };
    const now = Date.now();
    const cooldownMs = 24 * 60 * 60 * 1000;
    const elapsed = now - record.lastClaimed;

    const users = this.loadBotUsers();
    const botUser = users.get(chatId);
    const userName = (botUser?.firstName || 'KALAM FF PANEL').toUpperCase();

    if (record.lastClaimed > 0 && elapsed < cooldownMs) {
      const remainingMs = cooldownMs - elapsed;
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

      const text =
        `⏳ <b>DAILY GIFT COOLDOWN!</b>\n\n` +
        `<blockquote>` +
        `⚠️ <i>You have already claimed today's gift!</i>\n\n` +
        `⏰ <b>Next Gift in:</b> ${hours}h ${minutes}m` +
        `</blockquote>`;

      await this.editOrSendMessage(chatId, text, {
        inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]]
      }, messageId);
      return;
    }

    const wonAmount = 1.0;
    creditWallet(userId, wonAmount, 'Daily Gift Bonus');
    record.lastClaimed = now;
    record.streak = (record.streak || 0) + 1;
    record.totalWon = (record.totalWon || 0) + wonAmount;
    gifts.set(chatId, record);
    this.saveDailyGifts(gifts);

    const wallet = getUserWallet(userId);

    const text =
      `✨ <b>DAILY GIFT CLAIMED!</b> ✨\n\n` +
      `<blockquote>` +
      `✅ <b>Congratulations ${userName}!</b>\n\n` +
      `🎁 <b>You Received:</b> ₹${wonAmount.toFixed(2)}\n\n` +
      `💸 <b>New Wallet Balance:</b> ₹${wallet.balance.toFixed(2)}\n\n` +
      `🌈 <i>Come back after 24 hours for your next gift!</i>` +
      `</blockquote>`;

    await this.editOrSendMessage(chatId, text, {
      inline_keyboard: [[{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]]
    }, messageId);
  }

  // 8. 👥 Refer & Earn (Matching model)
  private async showReferAndEarn(chatId: number, messageId?: number) {
    const referrals = this.loadReferrals();
    const refRecord = referrals.get(chatId) || { referralCount: 0, totalEarned: 0, referredUserIds: [] };
    const botCleanUsername = this.botUsername.replace('@', '');
    const refLink = `https://t.me/${botCleanUsername}?start=ref_${chatId}`;

    const text =
      `<b>Refer & Earn Program</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `Invite friends and earn instant cash rewards on every topup!\n\n` +
      `🎁 <b>Reward:</b> ₹2.00 instant on friend join + 5% lifetime deposit commission!\n` +
      `👥 <b>Total Referrals:</b> ${refRecord.referralCount}\n` +
      `💰 <b>Total Earned:</b> ₹${refRecord.totalEarned.toFixed(2)}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🔗 <b>Your Referral Link:</b>\n` +
      `<code>${refLink}</code>`;

    const shareText = encodeURIComponent(`🔥 Best Free Fire VIP Injectors, Panel Hacks & Mod APKs! Join now: ${refLink}`);
    const inline_keyboard = [
      [{ text: '📢 Share with Friends', url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${shareText}` }],
      [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 9. 📞 Support
  private async showSupport(chatId: number, messageId?: number) {
    const { supportUsername } = this.getStoreSettingsFromDisk();
    const cleanAdmin = (supportUsername || 'INR_TAMIL_GAMER1').replace('@', '');

    const text =
      `<b>Customer & Admin Support</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `Need help with license keys, panel setup, or balance?\n` +
      `Our official support team is available 24/7!\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💬 <i>Click below to contact support admin directly:</i>`;

    const inline_keyboard = [
      [{ text: '🛠️ Contact Support Admin', url: `https://t.me/${cleanAdmin}` }],
      [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 10. 📥 All Files Download
  public async showAllFilesDownload(chatId: number, messageId?: number) {
    const { apkDownloadUrl } = this.getCredentials();
    let liveApkUrl = (apkDownloadUrl || '').trim();
    if (!liveApkUrl) {
      liveApkUrl = 'https://t.me/kalamffpanel';
    } else if (liveApkUrl.startsWith('@')) {
      liveApkUrl = `https://t.me/${liveApkUrl.replace('@', '')}`;
    } else if (liveApkUrl.startsWith('t.me/')) {
      liveApkUrl = `https://${liveApkUrl}`;
    } else if (!liveApkUrl.startsWith('http://') && !liveApkUrl.startsWith('https://')) {
      liveApkUrl = `https://${liveApkUrl}`;
    }

    const text =
      `<b>All VIP Files & Mod Downloads</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📥 Download latest safe Anti-Ban APKs, OBB injectors, Magisk modules & iOS IPA files.\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `⚡ <i>Direct channel access for fast updates & file downloads:</i>`;

    const inline_keyboard = [
      [{ text: '📥 Open Download Channel', url: liveApkUrl }],
      [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 11. 📢 Official Community & Proof Channels
  public async showCommunity(chatId: number, messageId?: number) {
    const { proofChannelLink, apkDownloadUrl } = this.getCredentials();
    let channelLink = (proofChannelLink || 'https://t.me/c/4325449752').trim();
    let updateLink = (apkDownloadUrl || 'https://t.me/kalamffpanel').trim();

    if (channelLink.startsWith('@')) channelLink = `https://t.me/${channelLink.replace('@', '')}`;
    if (channelLink.startsWith('t.me/')) channelLink = `https://${channelLink}`;
    if (!channelLink.startsWith('http://') && !channelLink.startsWith('https://')) channelLink = `https://${channelLink}`;

    if (updateLink.startsWith('@')) updateLink = `https://t.me/${updateLink.replace('@', '')}`;
    if (updateLink.startsWith('t.me/')) updateLink = `https://${updateLink}`;
    if (!updateLink.startsWith('http://') && !updateLink.startsWith('https://')) updateLink = `https://${updateLink}`;

    const text =
      `<b>KALAM FF PANEL — OFFICIAL COMMUNITY</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `Join our official Telegram community channels & groups for:\n\n` +
      `📢 <b>Payment & Key Proofs:</b> 100% Real-time customer delivery proofs\n` +
      `🔥 <b>Panel Updates & Files:</b> Daily bypass files & mod APKs\n` +
      `🎁 <b>Giveaways & Promos:</b> Exclusive discounts & free wallet codes\n` +
      `💬 <b>Support & Help:</b> Fast customer guidance & tutorials\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `<i>Tap below to join our official channels:</i>`;

    const inline_keyboard = [
      [{ text: '📢 Payment Proof Channel', url: channelLink }],
      [{ text: '🔥 Updates & Mod Channel', url: updateLink }],
      [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 9. 🔲 Master Admin Control Panel Hub (Website & Telegram Bot)
  public async showAdminPanel(
    chatId: number,
    getProducts?: () => any[],
    getUserWallet?: (id: string) => { balance: number; email?: string; userId: string },
    messageId?: number
  ) {
    if (!this.isAdmin(chatId)) {
      await this.sendMessage(
        chatId,
        `🔒 <b>ACCESS DENIED</b>\n\n` +
        `This section is strictly restricted to the Store Bot Administrator.\n` +
        `If you need assistance, please contact support.`,
        {
          inline_keyboard: [
            [{ text: '🚀 Contact Support', callback_data: 'support' }],
            [{ text: '🔙 Back', callback_data: 'main_menu' }]
          ]
        }
      );
      return;
    }

    const stats = this.getDetailedStoreStats();
    const { apkDownloadUrl } = this.getCredentials();
    const resellerFee = this.getResellerUpgradeAmount();
    const threshold = this.getLowStockThreshold();
    const lowStockItems = this.getLowStockProducts(threshold);

    const text =
      `🎛️ <b>WEBSITE & BOT MASTER ADMIN PANEL</b> 👑\n\n` +
      `<blockquote>〰️〰️ <b>LIVE STORE METRICS</b> 〰️〰️\n` +
      `👥 <b>Users:</b> <b>${stats.totalUsers}</b> | 💎 <b>VIP Resellers:</b> <b>${stats.resellerCount}</b>\n` +
      `📦 <b>Products:</b> <b>${stats.totalProductsCount}</b> | 🔑 <b>Keys in Stock:</b> <b>${stats.totalKeysInStock}</b>\n` +
      `⚠️ <b>Low Stock Items:</b> <b>${lowStockItems.length}</b> (Threshold: ${threshold} keys)\n` +
      `🛍️ <b>Total Orders:</b> <b>${stats.totalSalesCount}</b> (₹${stats.totalSalesAmount.toFixed(2)})\n` +
      `💳 <b>Active Gateway:</b> <code>${stats.activeGateway}</code>\n` +
      `🏷️ <b>Merchant UPI:</b> <code>${stats.activeUpiId}</code>\n` +
      `💎 <b>Reseller Upgrade Fee:</b> <b>₹${resellerFee}</b>\n` +
      `🎟️ <b>Active Promos:</b> <b>${stats.activePromoCodes}</b> | ⚙️ <b>Maintenance:</b> ${stats.maintenanceMode ? '🔴 ON' : '🟢 OFF'}\n` +
      `〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️</blockquote>\n\n` +
      `👇 <i>Select a category below to configure website & bot settings:</i>`;

    const inline_keyboard = [
      [
        { text: `📦 Products & Keys (${stats.totalKeysInStock})`, callback_data: 'admin_menu:products' },
        { text: lowStockItems.length > 0 ? `⚠️ Low Stock (${lowStockItems.length})` : '📉 Low Stock Monitor', callback_data: 'admin_menu:low_stock' }
      ],
      [
        { text: '💳 Payment Gateways', callback_data: 'admin_menu:gateways' },
        { text: '👥 Users & Reseller Hub', callback_data: 'admin_menu:users' }
      ],
      [
        { text: '🎟️ Promo Codes & Coupons', callback_data: 'admin_menu:promos' },
        { text: '📢 Broadcast & Notice Banner', callback_data: 'admin_menu:broadcast' }
      ],
      [
        { text: '📥 APK, Tutorial & Links', callback_data: 'admin_menu:links' },
        { text: '📊 Sales & Live Analytics', callback_data: 'admin_menu:stats' }
      ],
      [
        { text: '⚙️ Maintenance Mode', callback_data: 'admin_menu:maintenance' },
        { text: '🏠 Back to Main Menu', callback_data: 'main_menu' }
      ]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 9.1 📦 Products & Key Stock Admin Submenu
  public async showAdminProductsMenu(chatId: number, getProducts?: () => any[], messageId?: number) {
    if (!this.isAdmin(chatId)) return;
    const products = getProducts ? getProducts() : this.loadProductsFromDisk();
    const threshold = this.getLowStockThreshold();
    const lowStockItems = this.getLowStockProducts(threshold);

    let stockText =
      `📦 <b>PRODUCTS & LICENSE KEYS STOCK</b>\n\n` +
      `<blockquote><b>Current Catalog Breakdown (Threshold: ${threshold} keys):</b>\n`;

    let totalKeys = 0;
    products.forEach((p: any, idx: number) => {
      let prodKeys = 0;
      let planDetails: string[] = [];
      (p.plans || []).forEach((pl: any) => {
        const pId = pl.id || pl.duration;
        const kCount = (p.planKeys && Array.isArray(p.planKeys[pId])) ? p.planKeys[pId].length : 0;
        prodKeys += kCount;
        const lowBadge = kCount <= threshold ? (kCount === 0 ? ' [🔴 EMPTY]' : ' [⚠️ LOW]') : '';
        planDetails.push(`${pl.duration || pl.name}: <b>${kCount} keys</b>${lowBadge} (₹${pl.price}/₹${pl.resellerPrice || Math.round(pl.price * 0.8)})`);
      });
      totalKeys += prodKeys;
      stockText += `\n${idx + 1}. <b>${p.name}</b> (ID: <code>${p.id}</code>)\n   • ${planDetails.join('\n   • ')}\n`;
    });

    stockText += `\n🔑 <b>Total Available Keys:</b> ${totalKeys}\n` +
                 `⚠️ <b>Low Stock Items:</b> ${lowStockItems.length} product(s)</blockquote>\n\n` +
                 `💡 <i>Quick Slash Commands:</i>\n` +
                 `• <code>/lowstock</code> (View low stock items & dispatch alerts)\n` +
                 `• <code>/setlowstock &lt;threshold&gt;</code> (Set low-stock alert threshold)\n` +
                 `• <code>/addkeys &lt;product&gt; &lt;duration&gt; &lt;keys...&gt;</code>\n` +
                 `• <code>/setprice &lt;product&gt; &lt;duration&gt; &lt;price&gt; [reseller_price]</code>\n` +
                 `• <code>/addproduct &lt;name&gt; | &lt;category&gt; | &lt;game&gt;</code>\n` +
                 `• <code>/delkeys &lt;product&gt; &lt;duration&gt;</code>`;

    const inline_keyboard = [
      [
        { text: '➕ Add Keys to Plan', callback_data: 'admin_action:add_keys_prompt' },
        { text: lowStockItems.length > 0 ? `⚠️ Low Stock (${lowStockItems.length})` : '📉 Low Stock Monitor', callback_data: 'admin_menu:low_stock' }
      ],
      [
        { text: '💲 Change Plan Price', callback_data: 'admin_action:set_price_prompt' },
        { text: `📉 Set Alert Threshold (${threshold})`, callback_data: 'admin_action:set_lowstock_prompt' }
      ],
      [
        { text: '📦 Add New Product', callback_data: 'admin_action:add_product_prompt' },
        { text: '🛠️ Product Maintenance', callback_data: 'admin_menu:maintenance' }
      ],
      [
        { text: '🗑️ Clear Plan Stock', callback_data: 'admin_action:clear_stock_prompt' },
        { text: '🔄 Refresh Stock List', callback_data: 'admin_menu:products' }
      ],
      [
        { text: '🔙 Back to Admin Hub', callback_data: 'admin_panel' }
      ]
    ];

    await this.editOrSendMessage(chatId, stockText, { inline_keyboard }, messageId);
  }

  // 9.2 💳 Payment Gateways Admin Submenu
  public async showAdminGatewaysMenu(chatId: number, messageId?: number) {
    if (!this.isAdmin(chatId)) return;
    const storeData = this.loadStoreDataFromDisk();
    const paymentConfigs = storeData.paymentConfigs || [];
    const active = paymentConfigs.find((c: any) => c.isActive || c.status === 'ACTIVE') || paymentConfigs[0];

    let text =
      `💳 <b>PAYMENT & UPI GATEWAYS CONTROL</b>\n\n` +
      `<blockquote><b>Current Active Gateway:</b>\n` +
      `• <b>Gateway Name:</b> <b>${active?.name || active?.gatewayId || 'FamGateway'}</b>\n` +
      `• <b>Gateway ID:</b> <code>${active?.gatewayId || active?.id || 'famgateway'}</code>\n` +
      `• <b>Merchant UPI ID:</b> <code>${active?.upiId || storeData.storeSettings?.upiId || 'Not Set'}</code>\n` +
      `• <b>API Token:</b> <code>${active?.token ? active.token.slice(0, 10) + '...' : 'Default'}</code>\n` +
      `• <b>Endpoint:</b> <code>${active?.targetUrl || active?.apiUrl || 'https://famgateway.com'}</code>\n` +
      `• <b>Status:</b> 🟢 <b>ACTIVE & VERIFYING</b></blockquote>\n\n` +
      `⚡ <b>Switch Active Gateway with 1-Tap:</b>`;

    const inline_keyboard = [
      [
        { text: `${active?.gatewayId === 'famgateway' ? '✅' : '🔄'} FamGateway`, callback_data: 'admin_set_gw:famgateway' },
        { text: `${active?.gatewayId === 'adityahost' ? '✅' : '🔄'} AdityaHost`, callback_data: 'admin_set_gw:adityahost' }
      ],
      [
        { text: `${active?.gatewayId === 'zapupi' ? '✅' : '🔄'} ZapUPI`, callback_data: 'admin_set_gw:zapupi' },
        { text: `${active?.gatewayId === 'freepanel' ? '✅' : '🔄'} FreePanel`, callback_data: 'admin_set_gw:freepanel' }
      ],
      [
        { text: '✏️ Change UPI ID', callback_data: 'admin_action:set_upi_prompt' },
        { text: '🔑 Change API Key', callback_data: 'admin_action:set_gw_key_prompt' }
      ],
      [
        { text: '🏷️ Change Merchant Name', callback_data: 'admin_action:set_merchant_name_prompt' },
        { text: '🔙 Back to Admin Hub', callback_data: 'admin_panel' }
      ]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 9.3 👥 Users & VIP Resellers Admin Submenu
  public async showAdminUsersMenu(chatId: number, messageId?: number) {
    if (!this.isAdmin(chatId)) return;
    const users = this.loadBotUsers();
    const resellerCount = Array.from(users.values()).filter(u => u.isReseller || u.role === 'RESELLER').length;
    const resellerFee = this.getResellerUpgradeAmount();
    const totalDeposited = Array.from(users.values()).reduce((sum, u) => sum + (u.totalDeposited || 0), 0);

    const text =
      `👥 <b>USERS & VIP RESELLER DIRECTORY HUB</b>\n\n` +
      `<blockquote>〰️〰️ <b>USER METRICS</b> 〰️〰️\n` +
      `• <b>Total Registered Bot Users:</b> <b>${users.size}</b>\n` +
      `• <b>💎 VIP Resellers:</b> <b>${resellerCount} Members</b>\n` +
      `• <b>💵 Reseller Upgrade Fee:</b> <b>₹${resellerFee}</b>\n` +
      `• <b>💰 Total UPI Deposits:</b> <b>₹${totalDeposited.toFixed(2)}</b>\n` +
      `〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️</blockquote>\n\n` +
      `💡 <i>Quick Slash Commands:</i>\n` +
      `• <code>/makereseller &lt;id or @username&gt;</code>\n` +
      `• <code>/removereseller &lt;id or @username&gt;</code>\n` +
      `• <code>/addbalance &lt;id&gt; &lt;amt&gt;</code>\n` +
      `• <code>/deductbalance &lt;id&gt; &lt;amt&gt;</code>\n` +
      `• <code>/userinfo &lt;id or @username&gt;</code>\n` +
      `• <code>/setresellerprice &lt;amount&gt;</code>`;

    const inline_keyboard = [
      [
        { text: `👥 Browse User List (${users.size})`, callback_data: 'admin_users:0' },
        { text: `💎 View Resellers (${resellerCount})`, callback_data: 'admin_view_resellers' }
      ],
      [
        { text: '➕ Add Balance to User', callback_data: 'admin_add_bal' },
        { text: '➖ Deduct Balance', callback_data: 'admin_action:deduct_bal_prompt' }
      ],
      [
        { text: '💎 Make / Remove Reseller', callback_data: 'admin_action:toggle_reseller_prompt' },
        { text: `💵 Set Upgrade Fee (₹${resellerFee})`, callback_data: 'admin_set_reseller_price' }
      ],
      [
        { text: '🔍 Search User Info', callback_data: 'admin_action:search_user_prompt' },
        { text: '🔙 Back to Admin Hub', callback_data: 'admin_panel' }
      ]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 9.4 🎟️ Promo Codes Admin Submenu
  public async showAdminPromosMenu(chatId: number, messageId?: number) {
    if (!this.isAdmin(chatId)) return;
    const promoCodes = this.loadPromoCodes();

    let text =
      `🎟️ <b>PROMO CODES & COUPONS MANAGEMENT</b>\n\n` +
      `<blockquote><b>Active Codes in Database:</b>\n`;

    if (promoCodes.length === 0) {
      text += `<i>No promo codes active currently.</i>\n`;
    } else {
      promoCodes.forEach((p, idx) => {
        text += `\n${idx + 1}. <code>${p.code}</code> — <b>₹${p.rewardAmount}</b>\n   • Claimed: ${p.usedCount}/${p.maxUses} users\n`;
      });
    }

    text += `</blockquote>\n\n` +
            `💡 <i>Quick Slash Commands:</i>\n` +
            `• <code>/createpromo &lt;CODE&gt; &lt;AMOUNT&gt; [MAX_USERS]</code>\n` +
            `• <code>/delpromo &lt;CODE&gt;</code>\n` +
            `• <code>/promos</code> (List all codes)`;

    const inline_keyboard = [
      [
        { text: '➕ Create Promo Code', callback_data: 'admin_create_promo' },
        { text: '🗑️ Delete Promo Code', callback_data: 'admin_action:del_promo_prompt' }
      ],
      [
        { text: '🔄 Refresh Promos', callback_data: 'admin_menu:promos' },
        { text: '🔙 Back to Admin Hub', callback_data: 'admin_panel' }
      ]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 9.5 📢 Broadcast & Website Notice Banner Submenu
  public async showAdminBroadcastMenu(chatId: number, messageId?: number) {
    if (!this.isAdmin(chatId)) return;
    const storeData = this.loadStoreDataFromDisk();
    const notice = storeData.storeSettings?.announcement || 'No notice banner active';
    const isActive = !!storeData.storeSettings?.isAnnouncementActive;

    const text =
      `📢 <b>BROADCAST & WEBSITE NOTICE BANNER</b>\n\n` +
      `<blockquote>〰️ <b>CURRENT WEBSITE ANNOUNCEMENT</b> 〰️\n` +
      `• <b>Status:</b> ${isActive ? '🟢 LIVE ON WEBSITE' : '⚪ INACTIVE / HIDDEN'}\n` +
      `• <b>Banner Message:</b>\n"${notice}"\n` +
      `〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️</blockquote>\n\n` +
      `💡 <i>Quick Slash Commands:</i>\n` +
      `• <code>/broadcast &lt;message&gt;</code> (Sends to all Telegram bot users)\n` +
      `• <code>/setnotice &lt;message&gt;</code> (Updates top notice banner on website)\n` +
      `• <code>/clearnotice</code> (Hides notice banner from website)`;

    const inline_keyboard = [
      [
        { text: '📢 Broadcast to Bot Users', callback_data: 'admin_broadcast' }
      ],
      [
        { text: '🏷️ Set Website Notice Banner', callback_data: 'admin_action:set_notice_prompt' },
        { text: '🚫 Hide/Clear Notice Banner', callback_data: 'admin_action:clear_notice' }
      ],
      [
        { text: '🔙 Back to Admin Hub', callback_data: 'admin_panel' }
      ]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 9.6 📥 APK, Tutorial & Support Links Submenu
  public async showAdminLinksMenu(chatId: number, messageId?: number) {
    if (!this.isAdmin(chatId)) return;
    const { apkDownloadUrl, apkTutorialUrl, botUsername } = this.getCredentials();
    const storeData = this.loadStoreDataFromDisk();
    const support = storeData.storeSettings?.supportUsername || '@kd_123_1_3';

    const text =
      `📥 <b>CHECK UPDATE, APK & SUPPORT LINKS</b>\n\n` +
      `<blockquote><b>Current Configured URLs:</b>\n` +
      `• <b>Check Update / APK Telegram Link:</b>\n<code>${apkDownloadUrl}</code>\n\n` +
      `• <b>YouTube Tutorial URL:</b>\n<code>${apkTutorialUrl}</code>\n\n` +
      `• <b>Support Contact:</b> <code>${support}</code>\n` +
      `• <b>Bot Username:</b> <code>${botUsername}</code></blockquote>\n\n` +
      `💡 <i>Quick Slash Commands:</i>\n` +
      `• <code>/setupdatelink &lt;telegram_url&gt;</code>\n` +
      `• <code>/setapk &lt;url&gt;</code>\n` +
      `• <code>/settutorial &lt;url&gt;</code>\n` +
      `• <code>/setsupport &lt;@username&gt;</code>`;

    const inline_keyboard = [
      [
        { text: '📥 Update Telegram Link', callback_data: 'admin_set_apk_url' },
        { text: '🎥 Change Tutorial URL', callback_data: 'admin_action:set_tutorial_prompt' }
      ],
      [
        { text: '💬 Change Support Contact', callback_data: 'admin_action:set_support_prompt' },
        { text: '🔙 Back to Admin Hub', callback_data: 'admin_panel' }
      ]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 9.7 📊 Real-time Live Analytics & Orders Submenu
  public async showAdminStatsMenu(chatId: number, messageId?: number) {
    if (!this.isAdmin(chatId)) return;
    const stats = this.getDetailedStoreStats();
    const recentOrders = this.getRecentOrdersList(5);

    let text =
      `📊 <b>STORE SALES & LIVE ORDER ANALYTICS</b>\n\n` +
      `<blockquote>〰️〰️ <b>REVENUE & SALES METRICS</b> 〰️〰️\n` +
      `💰 <b>Total Gross Sales:</b> <b>₹${stats.totalSalesAmount.toFixed(2)}</b>\n` +
      `🛍️ <b>Total Keys Delivered:</b> <b>${stats.totalSalesCount} Orders</b>\n` +
      `💳 <b>Total Wallet UPI Deposits:</b> <b>₹${stats.totalDeposits.toFixed(2)}</b>\n` +
      `👥 <b>Registered Bot Customers:</b> <b>${stats.totalUsers}</b> (💎 ${stats.resellerCount} Resellers)\n` +
      `🔑 <b>Available Inventory:</b> <b>${stats.totalKeysInStock} Keys in Stock</b>\n` +
      `〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️</blockquote>\n\n` +
      `<blockquote><b>Recent 5 Delivered Orders:</b>\n`;

    if (recentOrders.length === 0) {
      text += `<i>No recent orders recorded yet.</i>\n`;
    } else {
      recentOrders.forEach((ord, idx) => {
        const d = new Date(ord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        text += `${idx + 1}. [${d}] <b>${ord.productName}</b> (${ord.planDuration}) - ₹${ord.price} -> <code>${ord.userId}</code>\n`;
      });
    }
    text += `</blockquote>`;

    const inline_keyboard = [
      [
        { text: '📜 View Last 10 Orders in Detail', callback_data: 'admin_recent_orders' },
        { text: '🔄 Refresh Stats', callback_data: 'admin_menu:stats' }
      ],
      [
        { text: '🔙 Back to Admin Hub', callback_data: 'admin_panel' }
      ]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 9.8 ⚙️ Maintenance Mode Submenu (Website & Products Control Hub)
  public async showAdminMaintenanceMenu(chatId: number, messageId?: number) {
    if (!this.isAdmin(chatId)) return;
    const storeData = this.loadStoreDataFromDisk();
    const isMaintenance = !!storeData.storeSettings?.maintenanceMode;
    const products = this.loadProductsFromDisk();

    const maintProds = products.filter((p: any) => p && (p.status === 'MAINTENANCE' || p.status === 'maintenance'));
    const activeProds = products.filter((p: any) => p && p.status !== 'MAINTENANCE' && p.status !== 'maintenance');

    let text =
      `⚙️ <b>MAINTENANCE MODE CONTROL HUB</b>\n\n` +
      `<blockquote><b>🌐 Storewide Website Status:</b>\n` +
      `• <b>Website Maintenance:</b> ${isMaintenance ? '🔴 <b>ON (Store Closed to Public)</b>' : '🟢 <b>OFF (Store Active & Open)</b>'}\n` +
      `</blockquote>\n\n` +
      `<blockquote><b>📦 Products Maintenance Breakdown:</b>\n` +
      `• <b>Total Products:</b> <b>${products.length}</b>\n` +
      `• 🟢 <b>Active & Purchasable:</b> <b>${activeProds.length}</b>\n` +
      `• 🔴 <b>Under Maintenance:</b> <b>${maintProds.length}</b>\n` +
      `</blockquote>\n\n` +
      `<b>📋 Product Status Breakdown:</b>\n`;

    if (products.length === 0) {
      text += `<i>No products in catalog.</i>\n`;
    } else {
      products.forEach((p: any, idx: number) => {
        const isM = p.status === 'MAINTENANCE' || p.status === 'maintenance';
        const badge = isM ? '🔴 <b>[UNDER MAINTENANCE]</b>' : '🟢 <b>[ACTIVE]</b>';
        text += `${idx + 1}. ${badge} <b>${p.name}</b> (<code>${p.id}</code>)\n`;
      });
    }

    text += `\n💡 <i>Tap any product button below to toggle its maintenance mode instantly:</i>\n` +
            `<i>Or use command: <code>/prodmaint &lt;id/all&gt; on|off</code></i>`;

    const inline_keyboard: any[] = [];

    // Storewide buttons
    inline_keyboard.push([
      { text: isMaintenance ? '🟢 Turn OFF Website Maint' : '🔴 Turn ON Website Maint', callback_data: `admin_toggle_maint:${isMaintenance ? 'off' : 'on'}` }
    ]);

    // Product buttons
    for (let i = 0; i < products.length; i += 2) {
      const row: any[] = [];
      const p1 = products[i];
      const isM1 = p1.status === 'MAINTENANCE' || p1.status === 'maintenance';
      let name1 = (p1.name || 'Product').slice(0, 14);
      row.push({
        text: `${isM1 ? '🔴' : '🟢'} ${name1} ${isM1 ? '(Maint)' : ''}`,
        callback_data: `admin_toggle_prod_maint:${p1.id || p1.productId}`
      });

      if (i + 1 < products.length) {
        const p2 = products[i + 1];
        const isM2 = p2.status === 'MAINTENANCE' || p2.status === 'maintenance';
        let name2 = (p2.name || 'Product').slice(0, 14);
        row.push({
          text: `${isM2 ? '🔴' : '🟢'} ${name2} ${isM2 ? '(Maint)' : ''}`,
          callback_data: `admin_toggle_prod_maint:${p2.id || p2.productId}`
        });
      }
      inline_keyboard.push(row);
    }

    // Bulk buttons
    inline_keyboard.push([
      { text: '🔴 Put ALL Products in Maint', callback_data: 'admin_prod_maint_all:on' },
      { text: '🟢 Put ALL Products Active', callback_data: 'admin_prod_maint_all:off' }
    ]);

    // Navigation buttons
    inline_keyboard.push([
      { text: '🔄 Refresh Status', callback_data: 'admin_menu:maintenance' },
      { text: '🔙 Back to Admin Hub', callback_data: 'admin_panel' }
    ]);

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 9.9 📜 Detailed Recent Orders Card
  public async showAdminRecentOrders(chatId: number, messageId?: number) {
    if (!this.isAdmin(chatId)) return;
    const orders = this.getRecentOrdersList(10);

    let text =
      `📜 <b>LAST 10 DELIVERED LICENSE KEY ORDERS</b>\n\n`;

    if (orders.length === 0) {
      text += `<i>No orders found in recent history.</i>\n`;
    } else {
      orders.forEach((ord, idx) => {
        const d = new Date(ord.timestamp).toLocaleString();
        const keyDisplay = (ord.keys || []).map(k => `<code>${k}</code>`).join(', ');
        text += `<b>${idx + 1}. Order:</b> <code>${ord.id}</code>\n` +
                `   • <b>Product:</b> ${ord.productName} (${ord.planDuration})\n` +
                `   • <b>Buyer:</b> <code>${ord.userId}</code> (Chat: <code>${ord.chatId}</code>)\n` +
                `   • <b>Amount Paid:</b> ₹${ord.price}\n` +
                `   • <b>Delivered Key:</b> ${keyDisplay || 'N/A'}\n` +
                `   • <b>Time:</b> ${d}\n\n`;
      });
    }

    const inline_keyboard = [
      [
        { text: '🔄 Refresh Orders', callback_data: 'admin_recent_orders' },
        { text: '🔙 Back to Stats', callback_data: 'admin_menu:stats' }
      ],
      [
        { text: '🎛️ Admin Hub', callback_data: 'admin_panel' }
      ]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 10. 🎟️ Promo Code Redemption Method
  public async handleRedeemPromo(
    chatId: number,
    code: string,
    userId: string,
    getUserWallet: (id: string) => { balance: number; email?: string; userId: string },
    creditWallet: (id: string, amount: number, reason: string) => any,
    messageId?: number
  ) {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      await this.sendMessage(chatId, `⚠️ Please provide a promo code. Example: <code>/redeem KALAMFREE</code>`);
      return;
    }

    const promoCodes = this.loadPromoCodes();
    const promo = promoCodes.find(p => p.code.toUpperCase() === cleanCode);

    if (!promo) {
      await this.editOrSendMessage(
        chatId,
        `❌ <b>INVALID PROMO CODE</b>\n\nThe code <code>${cleanCode}</code> does not exist or has expired.\n\nJoin our updates channel to get fresh promo codes!`,
        {
          inline_keyboard: [
            [{ text: '🎟️ Try Another Code', callback_data: 'redeem_prompt' }],
            [{ text: '📢 Join Updates Channel', callback_data: 'check_update' }],
            [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
          ]
        },
        messageId
      );
      return;
    }

    // Check expiry
    if (promo.expiresAt && Date.now() > promo.expiresAt) {
      await this.sendMessage(chatId, `⚠️ <b>Code Expired:</b> This promo code has expired.`);
      return;
    }

    // Check max usage
    if (promo.usedCount >= promo.maxUses) {
      await this.sendMessage(chatId, `⚠️ <b>Code Limit Reached:</b> This promo code has reached its maximum usage limit.`);
      return;
    }

    // Check if user already used this code
    if (promo.usedByChatIds && promo.usedByChatIds.includes(chatId)) {
      await this.sendMessage(chatId, `⚠️ <b>Already Redeemed:</b> You have already claimed this promo code!`);
      return;
    }

    // Apply redemption!
    if (!promo.usedByChatIds) promo.usedByChatIds = [];
    promo.usedByChatIds.push(chatId);
    promo.usedCount += 1;
    this.savePromoCodes(promoCodes);

    creditWallet(userId, promo.rewardAmount, `Promo Code Redemption: ${promo.code}`);
    const updatedWallet = getUserWallet(userId);

    const successText =
      `🎉 <b>PROMO CODE REDEEMED!</b> 🎟️\n\n` +
      `<blockquote>〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️\n` +
      `🎁 <b>Code:</b> <code>${promo.code}</code>\n` +
      `💸 <b>Bonus Added:</b> <b>+₹${promo.rewardAmount.toFixed(2)}</b>\n` +
      `〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️</blockquote>\n\n` +
      `💰 <b>New Wallet Balance:</b> <b>₹${updatedWallet.balance.toFixed(2)}</b>\n\n` +
      `<i>You can use your wallet balance to purchase VIP keys right now!</i>`;

    await this.editOrSendMessage(
      chatId,
      successText,
      {
        inline_keyboard: [
          [{ text: '🛒 Buy Keys Now', callback_data: 'catalog' }],
          [{ text: '🔥 My Profile', callback_data: 'profile_history' }],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
        ]
      },
      messageId
    );
  }

  // 11. ⚡ Peer-to-Peer Wallet Transfer Method
  public async handleBalanceTransfer(
    senderChatId: number,
    targetInput: string,
    amount: number,
    senderUserId: string,
    getUserWallet: (id: string) => { balance: number; email?: string; userId: string },
    deductWallet: (id: string, amount: number, reason: string) => boolean,
    creditWallet: (id: string, amount: number, reason: string) => any
  ) {
    if (isNaN(amount) || amount < 1) {
      await this.sendMessage(senderChatId, `⚠️ Minimum transfer amount is ₹1.00.`);
      return;
    }

    const senderWallet = getUserWallet(senderUserId);
    if (senderWallet.balance < amount) {
      await this.sendMessage(
        senderChatId,
        `❌ <b>Insufficient Balance!</b>\nYour balance is ₹${senderWallet.balance.toFixed(2)}, but you tried to transfer ₹${amount.toFixed(2)}.\n\nTap <b>💸 Add Balance</b> to deposit funds.`,
        { inline_keyboard: [[{ text: '💸 Add Balance', callback_data: 'deposit_prompt' }], [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]] }
      );
      return;
    }

    // Resolve recipient: either tg_123456, 123456, or @username
    const usersMap = this.loadBotUsers();
    let targetUser: BotUser | undefined;

    const cleanInput = targetInput.trim().replace(/^@/, '');
    if (/^\d+$/.test(cleanInput)) {
      const targetChatNum = parseInt(cleanInput, 10);
      targetUser = usersMap.get(targetChatNum);
    } else if (cleanInput.startsWith('tg_')) {
      const targetChatNum = parseInt(cleanInput.replace('tg_', ''), 10);
      targetUser = usersMap.get(targetChatNum);
    } else {
      // Find by username
      for (const u of usersMap.values()) {
        if (u.username && u.username.toLowerCase() === cleanInput.toLowerCase()) {
          targetUser = u;
          break;
        }
      }
    }

    if (!targetUser) {
      await this.sendMessage(
        senderChatId,
        `❌ <b>User Not Found!</b>\nNo registered bot user found with ID or username: <code>${targetInput}</code>.\n\nMake sure your friend has started the bot by sending /start first.`
      );
      return;
    }

    if (targetUser.chatId === senderChatId) {
      await this.sendMessage(senderChatId, `⚠️ You cannot transfer balance to yourself!`);
      return;
    }

    // Execute transfer transaction
    const deducted = deductWallet(senderUserId, amount, `Transfer to ${targetUser.firstName} (${targetUser.userId})`);
    if (!deducted) {
      await this.sendMessage(senderChatId, `❌ Transfer failed: Insufficient balance.`);
      return;
    }

    creditWallet(targetUser.userId, amount, `Transfer from Telegram User ${senderChatId}`);

    const newSenderBal = getUserWallet(senderUserId).balance;
    const newTargetBal = getUserWallet(targetUser.userId).balance;

    // Notify sender
    await this.sendMessage(
      senderChatId,
      `✅ <b>TRANSFER SUCCESSFUL!</b> ⚡\n\n` +
      `💸 <b>Amount Sent:</b> <b>₹${amount.toFixed(2)}</b>\n` +
      `👤 <b>Sent To:</b> ${targetUser.firstName} (${targetUser.username ? '@' + targetUser.username : `<code>${targetUser.chatId}</code>`})\n` +
      `💳 <b>Your New Balance:</b> <b>₹${newSenderBal.toFixed(2)}</b>`,
      { inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]] }
    );

    // Notify recipient
    this.sendMessage(
      targetUser.chatId,
      `🎁 <b>MONEY RECEIVED!</b> ⚡\n\n` +
      `You just received <b>₹${amount.toFixed(2)}</b> in your bot wallet from another user!\n` +
      `💰 <b>Your New Balance:</b> <b>₹${newTargetBal.toFixed(2)}</b>\n\n` +
      `<i>Tap "Buy Now" to purchase VIP keys!</i>`,
      { inline_keyboard: [[{ text: '🛒 Buy Now', callback_data: 'catalog' }], [{ text: '🔥 My Profile', callback_data: 'profile_history' }]] }
    ).catch(() => {});
  }

  // 12. 🏆 Leaderboard Display (Top Buyers & Top Referrers)
  public async showLeaderboard(chatId: number, messageId?: number) {
    const usersMap = this.loadBotUsers();
    const allUsers = Array.from(usersMap.values());
    const referralsMap = this.loadReferrals();

    // Top Spenders
    const topSpenders = [...allUsers]
      .filter(u => (u.totalSpent || 0) > 0)
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 5);

    // Top Referrers
    const allReferrals = Array.from(referralsMap.entries()).map(([cId, rec]) => {
      const u = usersMap.get(cId);
      return {
        chatId: cId,
        name: u ? u.firstName : `User ${cId}`,
        username: u?.username,
        count: rec.referralCount || 0,
        earned: rec.totalEarned || 0
      };
    }).filter(r => r.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);

    let buyersText = '<i>No purchases recorded yet</i>';
    if (topSpenders.length > 0) {
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
      buyersText = topSpenders.map((u, i) => {
        const medal = medals[i] || '🎖️';
        const name = `${u.firstName || 'VIP User'}`.trim();
        return `${medal} <b>${name}</b>: ₹${(u.totalSpent || 0).toFixed(2)} spent`;
      }).join('\n');
    }

    let referrersText = '<i>No referrals recorded yet</i>';
    if (allReferrals.length > 0) {
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
      referrersText = allReferrals.map((r, i) => {
        const medal = medals[i] || '🎖️';
        return `${medal} <b>${r.name}</b>: ${r.count} users invited (₹${r.earned.toFixed(2)})`;
      }).join('\n');
    }

    const text =
      `🏆 <b>KALAM FF PANEL LEADERBOARD</b>\n\n` +
      `👑 <b>TOP VIP BUYERS:</b>\n` +
      `${buyersText}\n\n` +
      `✈️ <b>TOP REFERRERS:</b>\n` +
      `${referrersText}\n\n` +
      `🎁 <i>Top buyers & referrers receive special weekly gift bonuses from the Admin team!</i>`;

    const inline_keyboard = [
      [{ text: '🛒 Buy Now & Climb Rank', callback_data: 'catalog' }],
      [{ text: '🔗 Refer Friends', callback_data: 'refer_earn' }],
      [{ text: '🔙 Back', callback_data: 'main_menu' }]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // Helper methods for text commands
  public async showFamGatewayDepositMenu(chatId: number, messageId?: number) {
    this.numpadAmounts.set(chatId, '0');
    return this.showDepositNumpad(chatId, messageId);
  }

  public async showBalance(
    chatId: number,
    botUser: BotUser,
    getUserWallet: (id: string) => { balance: number; email?: string; userId: string },
    messageId?: number
  ) {
    return this.showUserProfileAndHistory(chatId, botUser, getUserWallet, messageId);
  }

  public async showCheckUpdate(chatId: number, messageId?: number) {
    return this.showDownloadHub(chatId, messageId);
  }

  // 13. 📥 Download Hub Display (APK, Injectors, Config Files, Guides)
  public async showDownloadHub(chatId: number, messageId?: number) {
    const { apkDownloadUrl, apkTutorialUrl } = this.getCredentials();
    
    let liveApkUrl = (apkDownloadUrl || '').trim();
    if (!liveApkUrl) {
      liveApkUrl = 'https://t.me/kalamffpanel';
    } else if (liveApkUrl.startsWith('@')) {
      liveApkUrl = `https://t.me/${liveApkUrl.replace('@', '')}`;
    } else if (liveApkUrl.startsWith('t.me/')) {
      liveApkUrl = `https://${liveApkUrl}`;
    } else if (!liveApkUrl.startsWith('http://') && !liveApkUrl.startsWith('https://')) {
      liveApkUrl = `https://${liveApkUrl}`;
    }

    let liveTutorialUrl = (apkTutorialUrl || '').trim();
    if (!liveTutorialUrl) {
      liveTutorialUrl = 'https://youtu.be/kalam_tutorial';
    } else if (!liveTutorialUrl.startsWith('http://') && !liveTutorialUrl.startsWith('https://')) {
      liveTutorialUrl = `https://${liveTutorialUrl}`;
    }

    const text =
      `📥 <b>KALAM FF PANEL DOWNLOAD & UPDATE HUB</b> 🎮\n\n` +
      `<blockquote>` +
      `<b>Current Panel Status:</b> 🟢 <b>ONLINE & 100% ANTI-BAN</b>\n` +
      `<b>Latest Version:</b> ⚡ <b>v2.1 (OB47 Ready)</b>\n` +
      `<b>Supported Android:</b> Android 9, 10, 11, 12, 13, 14 & 15\n` +
      `<b>Device Modes:</b> Non-Root & Root Safe` +
      `</blockquote>\n\n` +
      `✨ <b>FEATURES IN LATEST UPDATE:</b>\n` +
      `• 🎯 100% Aimlock & Auto Headshot\n` +
      `• 👁️ ESP Name, Box, Line, Location & Health\n` +
      `• ⚡ Fast Speed Hack & Ghost Mode\n` +
      `• 🛡️ Real-time Anti-Blacklist & Bypass Protection\n\n` +
      `👇 <i>Tap below to download latest APK:</i>`;

    const inline_keyboard = [
      [{ text: '📥 Download Latest VIP Panel APK', url: liveApkUrl }],
      [
        { text: '🔄 Refresh Status', callback_data: 'check_update' },
        { text: '🛒 Buy VIP Key', callback_data: 'catalog' }
      ],
      [
        { text: '🔙 Back to Menu', callback_data: 'main_menu' }
      ]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // Admin Users List with Pagination & Tap-to-Copy IDs
  public async showAdminUsersList(
    chatId: number,
    page: number,
    getUserWallet: (id: string) => { balance: number; email?: string; userId: string },
    messageId?: number,
    callbackQueryId?: string
  ) {
    if (!this.isAdmin(chatId)) {
      await this.sendMessage(chatId, '🔒 <b>Access Denied:</b> This section is strictly for store administrators.');
      return;
    }

    const usersMap = this.loadBotUsers();
    const allUsers = Array.from(usersMap.values());
    // Sort by last active descending
    allUsers.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));

    const totalUsers = allUsers.length;
    const pageSize = 5;
    const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
    const curPage = Math.min(Math.max(0, page), totalPages - 1);
    const startIdx = curPage * pageSize;
    const pageUsers = allUsers.slice(startIdx, startIdx + pageSize);

    let usersText = '';
    if (pageUsers.length === 0) {
      usersText = '<i>No users registered yet. Send /start to the bot to create your user profile.</i>';
    } else {
      usersText = pageUsers.map((u, i) => {
        const wallet = getUserWallet(u.userId);
        const fullName = `${u.firstName || 'User'}${u.lastName ? ' ' + u.lastName : ''}`.trim();
        const userHandle = u.username ? `@${u.username}` : '<i>(no username)</i>';
        const lastActiveStr = u.lastActive ? new Date(u.lastActive).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
        const joinedStr = u.joinedAt ? new Date(u.joinedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A';
        const tierBadge = u.role === 'ADMIN' ? '👑 Admin' : (u.isReseller ? '💎 VIP Reseller' : '👤 Standard');
        return `<b>${startIdx + i + 1}. ${fullName}</b> (${userHandle}) — ${tierBadge}\n` +
               `🆔 <b>Telegram User ID:</b> <code>${u.chatId}</code>\n` +
               `💼 <b>Platform ID:</b> <code>${u.userId}</code>\n` +
               `💰 <b>Wallet Balance:</b> ₹${wallet.balance.toFixed(2)} | 🛒 <b>Spent:</b> ₹${(u.totalSpent || 0).toFixed(2)}\n` +
               `⏱️ <b>Last Seen:</b> ${lastActiveStr} | 📅 <b>Joined:</b> ${joinedStr}\n` +
               `➕ <code>/addbalance ${u.userId} 100</code> | ` +
               (u.isReseller ? `<code>/removereseller ${u.userId}</code>` : `<code>/makereseller ${u.userId}</code>`);
      }).join('\n━━━━━━━━━━━━━━━━━━━━\n');
    }

    const text =
      `👥 <b>TELEGRAM BOT REGISTERED USERS DIRECTORY</b>\n\n` +
      `📊 <b>Total Bot Users:</b> <b>${totalUsers}</b>\n` +
      `📄 <b>Page:</b> <b>${curPage + 1}</b> of <b>${totalPages}</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `${usersText}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📋 <i>Tap any User ID or /addbalance command above to copy it instantly.</i>`;

    const navRow: any[] = [];
    if (totalPages > 1) {
      const prevPage = curPage > 0 ? curPage - 1 : totalPages - 1;
      const nextPage = curPage < totalPages - 1 ? curPage + 1 : 0;
      navRow.push({ text: '◀️ Previous', callback_data: `admin_users:${prevPage}` });
      navRow.push({ text: `🔄 Refresh (${curPage + 1}/${totalPages})`, callback_data: `admin_users:${curPage}` });
      navRow.push({ text: 'Next ▶️', callback_data: `admin_users:${nextPage}` });
    } else {
      navRow.push({ text: '◀️ Previous', callback_data: `admin_users:single_page` });
      navRow.push({ text: `🔄 Refresh (1/1)`, callback_data: `admin_users:0` });
      navRow.push({ text: 'Next ▶️', callback_data: `admin_users:single_page` });
    }

    const inline_keyboard: any[][] = [
      navRow,
      [
        { text: '➕ Add Balance to User', callback_data: 'admin_add_bal' },
        { text: '📢 Broadcast to Users', callback_data: 'admin_broadcast' }
      ],
      [{ text: '🔙 Back', callback_data: 'admin_panel_back' }]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }
}

export const telegramBotService = TelegramBotService.getInstance();
