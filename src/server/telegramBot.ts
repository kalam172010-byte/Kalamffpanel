import fs from 'fs';
import path from 'path';

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

// User state tracking for multi-step bot flows (Deposit, Admin Broadcast, Add Balance, Transfer, Promo, etc.)
const userStates = new Map<number, { step: string; data?: any }>();

export class TelegramBotService {
  private static instance: TelegramBotService | null = null;
  private isPolling = false;
  private isWebhookActive = false;
  private activeWebhookUrl = '';
  private lastUpdateId = 0;
  private pollTimer: NodeJS.Timeout | null = null;
  private watchdogTimer: NodeJS.Timeout | null = null;
  private supervisorTimer: NodeJS.Timeout | null = null;
  private currentAbortController: AbortController | null = null;
  private botUsername = 'KALAMFFPANELWEBSITE_BOT';
  private numpadAmounts = new Map<number, string>();
  private processedKeys = new Set<string>();
  private inFlightKeys = new Set<string>();
  private lastProcessedKeysSavedAt = 0;
  private lastCallbackTime = new Map<string, number>();
  private recentOutgoingMessages = new Map<string, number>();
  private userLastActionTime = new Map<number, number>();
  private userLastActionText = new Map<number, string>();
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

  private constructor() {
    this.lastUpdateId = this.loadLastUpdateId();
    this.processedKeys = this.loadProcessedKeys();
    this.initSupervisor();
  }

  public static getInstance(): TelegramBotService {
    if (!TelegramBotService.instance) {
      TelegramBotService.instance = new TelegramBotService();
    }
    return TelegramBotService.instance;
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

  private getDataDir(): string {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {}
    }
    return dataDir;
  }

  private getCredentials(): {
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
    let botToken = process.env.TELEGRAM_BOT_TOKEN || '8990109048:AAEin2WyZl3pGdKXrPSQftMn8-Yh1g0Gop8';
    let defaultChatId = process.env.TELEGRAM_CHAT_ID || '7768975239';
    let apkDownloadUrl = process.env.APK_DOWNLOAD_URL || 'https://t.me/kalamffpanel';
    let apkTutorialUrl = process.env.APK_TUTORIAL_URL || 'https://youtu.be/kalam_tutorial';
    let botUsername = process.env.TELEGRAM_BOT_USERNAME || '@KalamFFStoreBot';

    let proofBotToken = process.env.TELEGRAM_PROOF_BOT_TOKEN || '';
    let proofChatId = process.env.TELEGRAM_PROOF_CHAT_ID || '';
    let proofChannelLink = process.env.PAYMENT_PROOF_CHANNEL || '';
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

  // Dispatch payment & key delivery proof to secondary Proof Bot / Channel
  public async dispatchPaymentProof(info: {
    productName: string;
    planDuration: string;
    price: number;
    keys: string[];
    chatId?: number;
    username?: string;
    firstName?: string;
    orderId?: string;
  }): Promise<boolean> {
    try {
      const creds = this.getCredentials();
      if (!creds.enableAutoProof) return false;

      const activeToken = creds.proofBotToken || creds.botToken;
      const targetChat = creds.proofChatId;

      if (!activeToken || !targetChat) {
        return false;
      }

      const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
      const maskedKeys = info.keys.map(k => `<code>${this.maskKeyForProof(k)}</code> <i>(Sent Privately to Buyer)</i>`).join('\n');
      const buyerName = info.username ? `@${info.username.replace('@', '')}` : (info.firstName || 'Verified Customer');
      const ordId = info.orderId || `TG_ORD_${Date.now()}`;
      const botHandle = (creds.botUsername || 'kalam_store_bot').replace('@', '');

      const text =
        `🎉 <b>NEW KEY PURCHASE & PAYMENT PROOF</b> 🎉\n\n` +
        `<blockquote>` +
        `📦 <b>Product:</b> ${info.productName}\n` +
        `⏳ <b>Plan Duration:</b> ${info.planDuration}\n` +
        `💵 <b>Amount Paid:</b> ₹${Number(info.price).toFixed(2)}\n` +
        `👤 <b>Customer:</b> ${buyerName}\n` +
        (info.chatId ? `🆔 <b>User ID:</b> <code>${info.chatId}</code>\n` : '') +
        `🔖 <b>Order ID:</b> <code>${ordId}</code>\n` +
        `💳 <b>Payment Mode:</b> Instant Auto-Wallet\n` +
        `🕒 <b>Time:</b> ${time} (IST)\n` +
        `</blockquote>\n\n` +
        `🔐 <b>DELIVERED LICENSE KEY(S):</b>\n` +
        `${maskedKeys}\n\n` +
        `🛡️ <b>STATUS:</b> ✅ <b>VERIFIED & DELIVERED</b> ⚡\n` +
        `🛒 <b>BUY KEY INSTANTLY:</b> @${botHandle}`;

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
        await fetch(`https://api.telegram.org/bot${activeToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChat,
            text: text.replace(/<[^>]*>/g, '')
          })
        });
      }
      return true;
    } catch (e: any) {
      console.warn('[TelegramBot] Proof dispatch failed:', e.message);
      return false;
    }
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

  // Calculate pricing for user with Reseller wholesale discount
  public getPlanPriceForUser(plan: any, isReseller: boolean): { price: number; regularPrice: number; isDiscounted: boolean } {
    const regularPrice = Number(plan.price) || 0;
    if (!isReseller) {
      return { price: regularPrice, regularPrice, isDiscounted: false };
    }
    if (typeof plan.resellerPrice === 'number' && plan.resellerPrice > 0) {
      return { price: plan.resellerPrice, regularPrice, isDiscounted: plan.resellerPrice < regularPrice };
    }
    // Default 15% wholesale reseller discount if no specific plan reseller price set
    const discounted = Math.max(1, Math.round(regularPrice * 0.85));
    return { price: discounted, regularPrice, isDiscounted: discounted < regularPrice };
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
      const filePath = path.join(this.getDataDir(), 'products.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
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
      const filePath = path.join(dataDir, 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[TelegramBot] Error saving products to disk:', e);
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
      active.upiId = updates.upiId.trim();
      if (!storeData.storeSettings) storeData.storeSettings = {};
      storeData.storeSettings.upiId = updates.upiId.trim();
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

  // 8. Maintenance Mode
  public setWebsiteMaintenance(isMaintenance: boolean): { success: boolean; isMaintenance: boolean } {
    const storeData = this.loadStoreDataFromDisk();
    if (!storeData.storeSettings) storeData.storeSettings = {};
    storeData.storeSettings.maintenanceMode = isMaintenance;
    this.saveStoreDataToDisk(storeData);
    return { success: true, isMaintenance };
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

  // Send message with standard or custom markup
  public async sendMessage(chatId: string | number, text: string, replyMarkup?: any): Promise<boolean> {
    const { botToken } = this.getCredentials();
    if (!botToken) return false;

    // Deduplication filter: prevent identical message being sent to the same chat within 1200ms
    const outgoingKey = `${chatId}:${text.trim().slice(0, 100)}`;
    const lastSent = this.recentOutgoingMessages.get(outgoingKey) || 0;
    const now = Date.now();
    if (now - lastSent < 1200) {
      return true; // Already sent recently, prevent duplicate spam!
    }
    this.recentOutgoingMessages.set(outgoingKey, now);
    if (this.recentOutgoingMessages.size > 200) {
      this.recentOutgoingMessages.clear();
    }

    try {
      const payload: any = {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      };
      if (replyMarkup) payload.reply_markup = replyMarkup;

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: any = await res.json();
      if (!data.ok) {
        // Fallback without parse_mode if HTML tags cause a parse error
        payload.parse_mode = undefined;
        payload.text = text.replace(/<[^>]*>/g, '');
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      return true;
    } catch (err: any) {
      console.error('[TelegramBot] sendMessage error:', err.message);
      return false;
    }
  }

  public async sendPhoto(chatId: string | number, photoUrl: string, caption?: string, replyMarkup?: any): Promise<boolean> {
    const { botToken } = this.getCredentials();
    if (!botToken) return false;

    try {
      const payload: any = {
        chat_id: chatId,
        photo: photoUrl,
        caption: caption || '',
        parse_mode: 'HTML',
      };
      if (replyMarkup) payload.reply_markup = replyMarkup;

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: any = await res.json();
      if (!data.ok) {
        return this.sendMessage(chatId, `${caption}\n\n🔗 <b>Payment QR Link:</b> <a href="${photoUrl}">View QR Code</a>`, replyMarkup);
      }
      return true;
    } catch (err: any) {
      console.error('[TelegramBot] sendPhoto error:', err.message);
      return this.sendMessage(chatId, `${caption}\n\n🔗 <b>Payment QR Link:</b> <a href="${photoUrl}">View QR Code</a>`, replyMarkup);
    }
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
        // If content didn't change ("message is not modified"), consider success
        if (data.description && data.description.includes('message is not modified')) {
          return true;
        }
        // If the original message was deleted or can't be edited, only then send a fresh message
        if (data.description && (data.description.includes('message to edit not found') || data.description.includes('message can\'t be edited'))) {
          return this.sendMessage(chatId, text, replyMarkup);
        }
        console.warn('[TelegramBot] editMessageText non-fatal error:', data.description);
        // Do NOT send a duplicate message for transient errors or duplicate clicks
        return false;
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
    }
    this.watchdogTimer = setInterval(() => {
      if (!this.isPolling || this.isWebhookActive) return;
      const now = Date.now();
      const elapsed = now - this.lastSuccessfulPollTime;

      // If no successful poll in the last 25 seconds or fetch has hung, auto-recover immediately
      if (elapsed > 25000) {
        console.warn(`[TelegramBot] Watchdog: Polling idle (${Math.round(elapsed / 1000)}s). Aborting stale sockets and auto-recovering...`);
        this.abortCurrentPoll();
        if (this.pollTimer) {
          clearTimeout(this.pollTimer);
          this.pollTimer = null;
        }
        this.isFetchInProgress = false;
        this.lastSuccessfulPollTime = Date.now();
        this.triggerNextPoll(100);
      }
    }, 8000);
  }

  private initSupervisor() {
    if (this.supervisorTimer) {
      clearInterval(this.supervisorTimer);
    }
    // 24/7 Supervisor ensures the bot never dies regardless of idle pauses or transient errors
    this.supervisorTimer = setInterval(() => {
      const { botToken } = this.getCredentials();
      if (!botToken) return;

      if (!this.isWebhookActive) {
        // If polling was unexpectedly halted but callbacks are stored, auto-resurrect polling
        if (!this.isPolling && this.storedCallbacks) {
          console.log('[TelegramBot] Supervisor: Bot polling was inactive. Auto-recovering polling engine...');
          this.startPolling(
            this.storedCallbacks.getProducts,
            this.storedCallbacks.getUserWallet,
            this.storedCallbacks.deductWallet,
            this.storedCallbacks.creditWallet,
            this.storedCallbacks.deliverKey,
            this.storedCallbacks.createFamOrder,
            this.storedCallbacks.queryFamOrder
          );
        } else if (this.isPolling) {
          const elapsed = Date.now() - this.lastSuccessfulPollTime;
          if (elapsed > 30000) {
            console.warn(`[TelegramBot] Supervisor: Tick lag detected (${Math.round(elapsed / 1000)}s). Forcing clean polling cycle...`);
            this.abortCurrentPoll();
            this.isFetchInProgress = false;
            if (this.pollTimer) {
              clearTimeout(this.pollTimer);
              this.pollTimer = null;
            }
            this.lastSuccessfulPollTime = Date.now();
            this.triggerNextPoll(100);
          }
        }
      }
    }, 15000);
  }

  private stopWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private triggerNextPoll(delayMs = 1000) {
    if (!this.isPolling || this.isWebhookActive) return;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
    this.pollTimer = setTimeout(() => {
      this.executePollCycle();
    }, Math.max(100, delayMs));
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

    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    this.isWebhookActive = false;
    this.lastSuccessfulPollTime = Date.now();
    this.lastPollAttemptTime = Date.now();
    this.consecutiveErrors = 0;
    console.log('[TelegramBot] Long polling engine activated with 24/7 supervisor & abort-controller watchdog!');

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

    this.triggerNextPoll(100);
  }

  private async executePollCycle() {
    if (!this.isPolling || this.isWebhookActive) return;
    if (this.isFetchInProgress) return;

    const { botToken: currentToken } = this.getCredentials();
    if (!currentToken) {
      this.triggerNextPoll(5000);
      return;
    }

    this.isFetchInProgress = true;
    this.lastPollAttemptTime = Date.now();
    this.totalPollCycles++;
    let nextDelay = 1000;

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

        if (this.storedCallbacks && data.result.length > 0) {
          const { getProducts, getUserWallet, deductWallet, creditWallet, deliverKey, createFamOrder, queryFamOrder } = this.storedCallbacks;
          for (const update of data.result as TelegramUpdate[]) {
            if (update && update.update_id) {
              this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
              this.saveLastUpdateId(this.lastUpdateId);
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
      this.triggerNextPoll(nextDelay);
    }
  }

  public stopPolling() {
    this.isPolling = false;
    this.isFetchInProgress = false;
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

    // Construct a specific deduplication key for this event
    let dedupeKey = `up_${update.update_id}`;
    if (update.callback_query && update.callback_query.id) {
      dedupeKey = `cb_${update.callback_query.id}`;
    } else if (update.message && update.message.chat && update.message.message_id) {
      dedupeKey = `msg_${update.message.chat.id}_${update.message.message_id}`;
    }

    // Check if already processed or currently in-flight
    if (this.processedKeys.has(dedupeKey) || this.inFlightKeys.has(dedupeKey)) {
      return;
    }

    // Set lock
    this.inFlightKeys.add(dedupeKey);
    this.processedKeys.add(dedupeKey);
    this.saveProcessedKeys();

    try {
      if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query, getProducts, getUserWallet, deductWallet, creditWallet, deliverKey, createFamOrder, queryFamOrder);
        return;
      }

      if (update.message && update.message.text) {
        await this.handleTextMessage(update.message, getProducts, getUserWallet, deductWallet, creditWallet, deliverKey, createFamOrder, queryFamOrder);
        return;
      }
    } catch (err: any) {
      console.error('[TelegramBot] Error processing update:', err);
    } finally {
      this.inFlightKeys.delete(dedupeKey);
    }
  }

  public async registerBotCommands(): Promise<boolean> {
    const { botToken } = this.getCredentials();
    if (!botToken) return false;

    const commands = [
      { command: 'start', description: '🏠 Open Main Menu & Check Balance' },
      { command: 'buy', description: '🛒 Browse & Purchase VIP License Keys' },
      { command: 'upgrade', description: '💎 Upgrade to VIP Reseller Account' },
      { command: 'reseller', description: '💎 VIP Reseller Status & Wholesale Pricing' },
      { command: 'deposit', description: '💸 Add Wallet Balance via FamGateway UPI' },
      { command: 'balance', description: '💰 View Your Current Wallet Balance' },
      { command: 'profile', description: '👑 Profile, Wallet & Delivered Keys' },
      { command: 'keys', description: '🔑 View All Delivered License Keys' },
      { command: 'refer', description: '🔗 Refer & Earn (₹2/friend + 5% deposit)' },
      { command: 'gift', description: '🎁 Daily Gift Free Lucky Spin (24h)' },
      { command: 'apk', description: '📥 Download Latest Mod APK & Tutorial' },
      { command: 'update', description: '📱 Check Panel Updates, APK & Video' },
      { command: 'help', description: '⁉️ How to Use Store Bot Tutorial' },
      { command: 'support', description: '🚀 Customer Support & Admin Contact' },
      { command: 'admin', description: '🔲 Admin Control Panel' },
      { command: 'users', description: '👥 (Admin) View All Registered Bot Users' },
      { command: 'setresellerprice', description: '💵 (Admin) Set Reseller Upgrade Fee' },
      { command: 'makereseller', description: '👑 (Admin) Grant VIP Reseller to User' },
      { command: 'removereseller', description: '👤 (Admin) Remove Reseller Status' },
      { command: 'setapk', description: '📥 (Admin) Set APK Download URL' },
    ];

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands }),
      });
      const data: any = await res.json();

      // Configure Telegram Chat Menu Button to automatically launch the Mini App
      const appUrl = process.env.APP_URL || 'https://ais-dev-gwn7e34dd4vbugmipzzvvo-128464619421.asia-east1.run.app';
      fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_button: {
            type: 'web_app',
            text: '🛒 Open Store',
            web_app: {
              url: `${appUrl}/tg-app`
            }
          }
        })
      }).catch(() => {});

      return !!data.ok;
    } catch {
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
    const rawText = msg.text?.trim() || '';
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

    // Strip bot username suffix if present: e.g. /start@KALAMFFPANELWEBSITE_BOT -> /start
    const cleanCmd = rawText.replace(/@[a-zA-Z0-9_]+bot\b/i, '').trim();
    const lower = cleanCmd.toLowerCase();
    // Normalize alphanumeric without emojis or symbols
    const norm = lower.replace(/[^\w\s+]/g, '').trim().replace(/\s+/g, ' ');

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

      // Admin Broadcast message state
      if (currentState.step === 'AWAITING_ADMIN_BROADCAST' && this.isAdmin(chatId)) {
        userStates.delete(chatId);
        const users = this.loadBotUsers();
        let sentCount = 0;
        await this.sendMessage(chatId, `⏳ <i>Broadcasting message to ${users.size} bot users...</i>`);
        for (const u of users.values()) {
          try {
            await this.sendMessage(u.chatId, `📢 <b>ANNOUNCEMENT:</b>\n\n${rawText}`);
            sentCount++;
          } catch {}
        }
        await this.sendMessage(chatId, `✅ <b>Broadcast Completed!</b>\nSuccessfully sent to ${sentCount} users.`);
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
    }

    // Direct Admin commands: /setapk <url> or /apkurl <url>
    if ((cleanCmd.startsWith('/setapk') || cleanCmd.startsWith('/apkurl')) && this.isAdmin(chatId)) {
      const parts = cleanCmd.split(/\s+/);
      if (parts.length >= 2) {
        const rawInput = parts.slice(1).join(' ').trim();
        const updatedUrl = this.saveApkUrl(rawInput);
        await this.sendMessage(
          chatId,
          `✅ <b>APK DOWNLOAD URL UPDATED!</b>\n\n` +
          `🔗 <b>New Live URL:</b> <code>${updatedUrl}</code>\n\n` +
          `All user buttons ("Check Update", "Download APK") and commands are updated instantly!`
        );
        return;
      } else {
        const { apkDownloadUrl } = this.getCredentials();
        userStates.set(chatId, { step: 'AWAITING_ADMIN_APK_URL' });
        await this.sendMessage(
          chatId,
          `📥 <b>SET APK DOWNLOAD TELEGRAM URL</b>\n\n` +
          `Current URL: <code>${apkDownloadUrl}</code>\n\n` +
          `Please send the new Telegram channel link or APK download URL:\n` +
          `Example: <code>https://t.me/kalamffpanel</code> or <code>https://t.me/yourchannel/15</code>\n\n` +
          `<i>Type /cancel to abort.</i>`
        );
        return;
      }
    }

    // Direct Admin commands: /broadcast <message>
    if (cleanCmd.startsWith('/broadcast') && this.isAdmin(chatId)) {
      const bMsg = cleanCmd.replace(/^\/broadcast\s*/i, '').trim();
      if (!bMsg) {
        userStates.set(chatId, { step: 'AWAITING_ADMIN_BROADCAST' });
        await this.sendMessage(chatId, `📢 <b>Broadcast Announcement</b>\n\nPlease enter the message text to broadcast to all users (or /cancel):`);
        return;
      }
      const users = this.loadBotUsers();
      let sentCount = 0;
      await this.sendMessage(chatId, `⏳ <i>Broadcasting announcement to ${users.size} users...</i>`);
      for (const u of users.values()) {
        try {
          await this.sendMessage(u.chatId, `📢 <b>ANNOUNCEMENT:</b>\n\n${bMsg}`);
          sentCount++;
        } catch {}
      }
      await this.sendMessage(chatId, `✅ <b>Broadcast Complete!</b> Sent to ${sentCount} users.`);
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
      norm === 'my profile all history' ||
      norm === 'my profile' ||
      cleanCmd.startsWith('/profile') ||
      cleanCmd.startsWith('/account') ||
      cleanCmd.startsWith('/me') ||
      norm === 'profile' ||
      norm === 'account'
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

    // 14. 📥 Download Hub / APK / Files (/hub, /downloads, /obb)
    if (
      cleanCmd.startsWith('/hub') ||
      cleanCmd.startsWith('/downloads') ||
      cleanCmd.startsWith('/files') ||
      cleanCmd.startsWith('/obb') ||
      norm === 'download hub' ||
      norm === 'downloads'
    ) {
      await this.showDownloadHub(chatId);
      return;
    }

    // 15. Check Update / APK Download
    if (
      norm === 'check update' ||
      norm === 'update' ||
      cleanCmd.startsWith('/update') ||
      cleanCmd.startsWith('/apk') ||
      cleanCmd.startsWith('/download') ||
      norm === 'apk' ||
      norm === 'download'
    ) {
      await this.showCheckUpdate(chatId);
      return;
    }

    // 12. ⁉️ How To Use Bot / Help / Tutorial
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

    if (data === 'main_menu') {
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
        await this.initiateFamGatewayPayment(chatId, amt, userId, createFamOrder);
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
      await this.initiateFamGatewayPayment(chatId, amount, userId, createFamOrder);
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
      if (queryFamOrder) {
        await this.answerCallback(cb.id, '🔍 Verifying with FamGateway...');
        const statusResult = await queryFamOrder(orderId, userId);
        if (statusResult.isPaid) {
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

          await this.sendMessage(
            chatId,
            `🎉 <b>PAYMENT CONFIRMED & CREDITED!</b>\n\n` +
            `✅ <b>Order ID:</b> <code>${orderId}</code>\n` +
            `💵 <b>Amount Credited:</b> ₹${statusResult.amount}\n` +
            (statusResult.utr ? `📌 <b>UTR:</b> <code>${statusResult.utr}</code>\n` : '') +
            `💰 <b>New Wallet Balance:</b> ₹${wallet.balance.toFixed(2)}\n\n` +
            `<i>You can now purchase keys instantly!</i>`,
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
            `If you just completed payment in PhonePe/GooglePay/Paytm, please wait 5-10 seconds and tap <b>Check Payment Status</b> again.`,
            {
              inline_keyboard: [
                [{ text: '🔄 Check Payment Status Again', callback_data: `check_order:${orderId}` }],
                [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
              ]
            }
          );
        }
      }
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
    if (data === 'profile_history') {
      await this.showUserProfileAndHistory(chatId, botUser, getUserWallet, msgId);
      return;
    }

    if (data === 'my_keys') {
      await this.showUserKeyHistory(chatId, botUser, msgId);
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

    // 7. 🚀 Support
    if (data === 'support') {
      await this.showSupport(chatId, msgId);
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

    // 13. 📥 Download Hub
    if (data === 'download_hub') {
      await this.showDownloadHub(chatId, msgId);
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
      await this.answerCallback(cb.id, targetMode ? '🔴 Maintenance Mode Turned ON' : '🟢 Maintenance Mode Turned OFF');
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

    if (data === 'admin_broadcast' && this.isAdmin(chatId)) {
      userStates.set(chatId, { step: 'AWAITING_ADMIN_BROADCAST' });
      await this.sendMessage(chatId, `📢 <b>Broadcast Announcement</b>\n\nPlease type the message you want to broadcast to all bot users (or send /cancel):`);
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

  // Exact Main Menu Visual Layout from User Video & Screenshot (KALAM FF PANEL)
  public async sendMainMenu(chatId: number, balance: number, _ensureReplyKeyboard: boolean = false, messageId?: number) {
    const users = this.loadBotUsers();
    const botUser = users.get(chatId);
    const userName = (botUser?.firstName || 'KALAM FF PANEL').toUpperCase();

    const text =
      `✨ <b>KALAM FF PANEL</b> 💸\n\n` +
      `👋 <b>Hello, ${userName}!</b>\n\n` +
      `<blockquote>` +
      `📦 <b>Wide product catalog</b>\n` +
      `⚡ <b>Instant delivery on payment</b>\n` +
      `💳 <b>Multiple payment gateways</b>\n` +
      `📞 <b>24/7 admin support</b>\n\n` +
      `💵 <b>Balance: ₹${balance.toFixed(2)}</b>` +
      `</blockquote>\n\n` +
      `<i>Tap any button below to begin:</i>`;

    const inline_keyboard: any[] = [];

    if (this.isAdmin(chatId)) {
      inline_keyboard.push([
        { text: '🎛️ Master Admin Control Panel 👑', callback_data: 'admin_panel' }
      ]);
    }

    const { apkDownloadUrl } = this.getCredentials();
    const paymentProofsUrl = 'https://t.me/INRADMINPANELVIP';
    const appUrl = process.env.APP_URL || 'https://ais-dev-gwn7e34dd4vbugmipzzvvo-128464619421.asia-east1.run.app';

    inline_keyboard.push(
      [
        { text: '🛒 Buy Now', callback_data: 'catalog' }
      ],
      [
        { text: 'Check Update', callback_data: 'check_update' },
        { text: '💸 Add Balance', callback_data: 'deposit_prompt' }
      ],
      [
        { text: '👑 My Profile + All History', callback_data: 'profile_history' }
      ],
      [
        { text: '🔗 Refer And Earn', callback_data: 'refer_earn' },
        { text: '⁉️ How To Use Bot', callback_data: 'how_to_use' }
      ],
      [
        { text: '✈️ Support', callback_data: 'support' },
        { text: '🎁 Daily Gift', callback_data: 'daily_gift' }
      ],
      [
        { text: '💎 VIP Reseller Upgrade', callback_data: 'upgrade_reseller' }
      ]
    );

    if (!messageId || _ensureReplyKeyboard) {
      const reply_keyboard = [
        [{ text: '🛒 Buy Now' }],
        [{ text: 'Check Update' }, { text: '💸 Add Balance' }],
        [{ text: '👑 My Profile + All History' }],
        [{ text: '🔗 Refer And Earn' }, { text: '⁉️ How To Use Bot' }],
        [{ text: '✈️ Support' }, { text: '🎁 Daily Gift' }]
      ];
      if (this.isAdmin(chatId)) {
        reply_keyboard.push([{ text: '🔲 Admin Panel' }]);
      }
      this.sendMessage(chatId, `👇 <b>Menu Active:</b>`, {
        keyboard: reply_keyboard,
        resize_keyboard: true,
        is_persistent: true
      }).catch(() => {});
    }

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

  // 1. 🛒 Shop Now — Select Device Type
  private async showProductCatalog(chatId: number, _products: any[], messageId?: number) {
    const users = this.loadBotUsers();
    const botUser = users.get(chatId);
    const userName = (botUser?.firstName || 'KALAM FF PANEL').toUpperCase();

    const text =
      `✨ <b>SELECT YOUR DEVICE TYPE</b> ✨\n\n` +
      `<blockquote>` +
      `👋 <b>YOO ${userName}!</b>\n` +
      `<i>Choose a device type to see matching products, plans and live pricing.</i>` +
      `</blockquote>`;

    const inline_keyboard = [
      [{ text: '🤖 ANDROID NON ROOT', callback_data: 'cat_dev:non_root' }],
      [{ text: '⚙️ ANDROID ROOT', callback_data: 'cat_dev:root' }],
      [{ text: '🍏 IPHONE', callback_data: 'cat_dev:ios' }],
      [{ text: '❌ Back to Menu', callback_data: 'main_menu' }]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  private async showProductsForDevice(chatId: number, deviceType: string, products: any[], messageId?: number) {
    if (!products || products.length === 0) {
      await this.editOrSendMessage(
        chatId,
        '⚠️ No products currently in catalog. Please check back shortly!',
        { inline_keyboard: [[{ text: '❌ Back to Menu', callback_data: 'main_menu' }]] },
        messageId
      );
      return;
    }

    let devLabel = 'ANDROID NON ROOT';
    if (deviceType === 'root') devLabel = 'ANDROID ROOT';
    if (deviceType === 'ios') devLabel = 'IPHONE';

    // Filter products if matching category/name or show all
    const filtered = products.filter((p: any) => {
      const cat = ((p.category || '') + ' ' + (p.name || '')).toLowerCase();
      if (deviceType === 'non_root') return !cat.includes('root') || cat.includes('non root') || cat.includes('nonroot');
      if (deviceType === 'root') return cat.includes('root') && !cat.includes('non');
      if (deviceType === 'ios') return cat.includes('ios') || cat.includes('iphone') || cat.includes('apple');
      return true;
    });

    const displayList = filtered.length > 0 ? filtered : products;

    const inline_keyboard: any[] = [];

    for (const p of displayList) {
      const rawName = (p.name || p.title || 'Product').trim();
      const plans = Array.isArray(p.plans) ? p.plans : [];
      const planCount = plans.length;
      let displayName = rawName.toUpperCase();
      if (displayName.length > 22) {
        displayName = displayName.slice(0, 20) + '...';
      }
      const label = `🛒 ${displayName} (${planCount} plans)`;

      inline_keyboard.push([
        {
          text: label,
          callback_data: `prod:${p.id || p.productId}`
        }
      ]);
    }

    inline_keyboard.push([{ text: '🔙 Change Device', callback_data: 'catalog' }]);
    inline_keyboard.push([{ text: '❌ Back to Menu', callback_data: 'main_menu' }]);

    const text =
      `✨ <b>${devLabel} PRODUCTS</b> ✨\n\n` +
      `<blockquote>` +
      `📦 <b>Catalog:</b> ${devLabel}\n` +
      `🛡️ <i>Select your desired cheat/injector tool below:</i>` +
      `</blockquote>`;

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  private async showProductPlans(chatId: number, productId: string, products: any[], messageId?: number) {
    const product = products.find((p: any) => p.id === productId || p.productId === productId);
    if (!product) {
      await this.editOrSendMessage(chatId, '⚠️ Product not found.', {
        inline_keyboard: [[{ text: '🔙 Back', callback_data: 'catalog' }]]
      }, messageId);
      return;
    }

    const plans = Array.isArray(product.plans) ? product.plans : [];
    if (plans.length === 0) {
      await this.editOrSendMessage(chatId, `⚠️ No active pricing plans found for ${product.name}.`, {
        inline_keyboard: [[{ text: '🔙 Back', callback_data: 'catalog' }]]
      }, messageId);
      return;
    }

    const users = this.loadBotUsers();
    const botUser = users.get(chatId);
    const isReseller = !!(botUser?.isReseller || this.isAdmin(chatId));

    const inline_keyboard: any[] = [];

    for (const pl of plans) {
      const dur = pl.duration || pl.name || '1 Day';
      const pricing = this.getPlanPriceForUser(pl, isReseller);
      const priceLabel = isReseller && pricing.isDiscounted
        ? `⏳ ${dur} — 💎 ₹${pricing.price} (Wholesale)`
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

    const text =
      `📦 <b>${product.name}</b>\n` +
      `🎮 Game: <code>${product.game || 'Free Fire / FF MAX'}</code>\n` +
      `🏷️ Category: <code>${product.category || 'APKMOD / NON-ROOT'}</code>\n` +
      `🛡️ Status: 🟢 <b>100% Anti-Ban Safe & Undetected</b>\n` +
      (isReseller ? `💎 <i>VIP Reseller Wholesale Pricing Active</i>\n\n` : `\n`) +
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
    const product = products.find((p: any) => p.id === productId || p.productId === productId);
    if (!product) return;

    const plan = (product.plans || []).find((pl: any) => pl.id === planId || pl.duration === planId || pl.name === planId);
    if (!plan) return;

    const users = this.loadBotUsers();
    const botUser = users.get(chatId);
    const isReseller = !!(botUser?.isReseller || this.isAdmin(chatId));
    const pricing = this.getPlanPriceForUser(plan, isReseller);
    const price = pricing.price;

    const wallet = getUserWallet(userId);
    const canAfford = wallet.balance >= price;

    let text =
      `🛒 <b>CONFIRM PURCHASE IN TELEGRAM</b>\n\n` +
      `📦 <b>Product:</b> ${product.name}\n` +
      `⏳ <b>Duration:</b> ${plan.duration || plan.name}\n` +
      `💵 <b>Price:</b> ₹${price}` + (pricing.isDiscounted ? ` 💎 (VIP Reseller Wholesale Rate - Regular ₹${pricing.regularPrice})` : '') + `\n\n` +
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
      text += `⚠️ <b>Insufficient Balance!</b> You need ₹${shortage} more to buy this key.\n\n` +
              `<i>Add balance via UPI to proceed.</i>`;
      inline_keyboard.push([
        { text: `💲 Add Balance (₹${shortage})`, callback_data: 'deposit_prompt' }
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
    const product = products.find((p: any) => p.id === productId || p.productId === productId);
    if (!product) {
      await this.editOrSendMessage(chatId, '⚠️ Error: Product no longer available.', {
        inline_keyboard: [[{ text: '🔙 Back', callback_data: 'catalog' }]]
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
      `Telegram Bot: ${product.name} (${plan.duration || plan.name})` + (isReseller ? ' [VIP Reseller Rate]' : '')
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

    const keysList = deliveryResult.keys.map(k => `<code>${k}</code>`).join('\n');
    const newBal = getUserWallet(userId).balance;

    const successMsg =
      `🎉 <b>KEY PURCHASE SUCCESSFUL!</b>\n\n` +
      `<blockquote>` +
      `<b>Product:</b> 📦 <b>${product.name}</b>\n` +
      `<b>Duration:</b> ⏳ <b>${plan.duration || plan.name}</b>\n` +
      `<b>Amount Paid:</b> 💸<b>₹${price}</b>\n` +
      `<b>Remaining Balance:</b> 💳<b>₹${newBal.toFixed(2)}</b>` +
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
    createFamOrder?: (amount: number, userIdentifier: string, userEmail?: string) => Promise<any>
  ) {
    if (!createFamOrder) {
      await this.sendMessage(chatId, '⚠️ Payment gateway is initializing. Please try again in a few moments.');
      return;
    }

    try {
      const order = await createFamOrder(amount, userId);
      if (!order || !order.success) {
        await this.sendMessage(chatId, `❌ Failed to generate order: ${order?.error || 'Gateway unreachable'}. Please try again later.`);
        return;
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
        { text: '❌ Cancel / Back', callback_data: 'main_menu' }
      ]);

      if (order.qrUrl) {
        await this.sendPhoto(chatId, order.qrUrl, caption, { inline_keyboard });
      } else {
        await this.sendMessage(chatId, caption, { inline_keyboard });
      }
    } catch (err: any) {
      console.error('[FamGateway Order Error]:', err);
      await this.sendMessage(chatId, `❌ Error creating order: ${err.message}`);
    }
  }

  // 3. 👤 User Profile (Video layout)
  private async showUserProfileAndHistory(
    chatId: number,
    botUser: BotUser,
    getUserWallet: (id: string) => { balance: number; email?: string; userId: string },
    messageId?: number
  ) {
    const wallet = getUserWallet(botUser.userId);
    const allPurchases = this.loadPurchases();
    const userPurchases = allPurchases.filter(p => p.chatId === chatId || p.userId === botUser.userId);

    const isReseller = !!(botUser.isReseller || this.isAdmin(chatId));
    const roleText = isReseller ? '💎 VIP Reseller' : (this.isAdmin(chatId) ? '👑 Administrator' : 'Regular User');
    const joinedDate = botUser.firstSeen ? new Date(botUser.firstSeen).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '08 Sept 2026';
    const userName = (botUser.firstName || 'KALAM FF PANEL').toUpperCase();
    const usernameDisplay = botUser.username ? '@' + botUser.username.replace('@', '') : 'Not set';

    const text =
      `✨ <b>USER PROFILE</b> ✨\n\n` +
      `<blockquote>` +
      `🆔 <b>ID:</b> <code>${chatId}</code>\n` +
      `👤 <b>Name:</b> ${userName}\n` +
      `💎 <b>Username:</b> ${usernameDisplay}\n` +
      `📅 <b>Joined:</b> ${joinedDate}\n` +
      `👑 <b>Account Type:</b> ${roleText}\n\n` +
      `💵 <b>Balance:</b> ₹${wallet.balance.toFixed(2)}\n` +
      `💳 <b>Spent:</b> ₹${(botUser.totalSpent || 0).toFixed(2)}\n` +
      `🔑 <b>Keys:</b> ${userPurchases.length}` +
      `</blockquote>\n\n` +
      `<i>Profile photo fetched from Telegram.</i>`;

    const inline_keyboard = [
      [
        { text: '🔑 My Keys', callback_data: 'my_keys' },
        { text: '💲 Add Fund', callback_data: 'deposit_prompt' }
      ],
      [{ text: '❌ Back', callback_data: 'main_menu' }]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 4. 🔑 My Keys
  private async showUserKeyHistory(chatId: number, botUser?: BotUser, messageId?: number) {
    const allPurchases = this.loadPurchases();
    const userPurchases = allPurchases.filter(p => p.chatId === chatId || (botUser && p.userId === botUser.userId));

    if (userPurchases.length === 0) {
      const text =
        `<blockquote>` +
        `‼️ <b>No keys found!</b>\n` +
        `<i>You haven't purchased anything yet.</i>` +
        `</blockquote>`;

      await this.editOrSendMessage(chatId, text, {
        inline_keyboard: [
          [
            { text: '🛒 Shop Now', callback_data: 'catalog' },
            { text: '❌ Back', callback_data: 'main_menu' }
          ]
        ]
      }, messageId);
      return;
    }

    const keysList = userPurchases.map((p, idx) => {
      const dateStr = new Date(p.timestamp).toLocaleDateString('en-GB');
      const keysFormatted = p.keys.map(k => `<code>${k}</code>`).join(', ');
      return `• <b>${p.productName}</b> (${p.planDuration}) - ₹${p.price}\n  Key: ${keysFormatted} (${dateStr})`;
    }).join('\n\n');

    const text =
      `🔑 <b>YOUR PURCHASED KEYS</b>\n\n` +
      `<blockquote>` +
      `${keysList}` +
      `</blockquote>\n\n` +
      `<i>Tap on any key code to copy it directly.</i>`;

    await this.editOrSendMessage(chatId, text, {
      inline_keyboard: [
        [
          { text: '🛒 Shop Now', callback_data: 'catalog' },
          { text: '❌ Back', callback_data: 'main_menu' }
        ]
      ]
    }, messageId);
  }

  // 5. 📌 How to use
  private async showHowToUseBot(chatId: number, messageId?: number) {
    const text =
      `✨ <b>HOW TO USE THE BOT</b> ✨\n\n` +
      `<blockquote>` +
      `<b>Follow these simple steps:</b>\n\n` +
      `1. 💳 Add balance to your wallet first.\n` +
      `2. 📦 Go to products section and pick your plan.\n` +
      `3. 🔑 Click buy and copy your instant key!\n\n` +
      `<i>Watch the detailed video tutorial below for full guide!</i>` +
      `</blockquote>`;

    const { apkTutorialUrl } = this.getCredentials();
    const inline_keyboard = [
      [{ text: '🎬 Watch Video Guide', url: apkTutorialUrl || 'https://youtu.be/kalam_tutorial' }],
      [{ text: '❌ Back', callback_data: 'main_menu' }]
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
        inline_keyboard: [[{ text: '❌ Back to Menu', callback_data: 'main_menu' }]]
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
      inline_keyboard: [[{ text: '❌ Back to Menu', callback_data: 'main_menu' }]]
    }, messageId);
  }

  // 8. 👥 Refer & Earn
  private async showReferAndEarn(chatId: number, messageId?: number) {
    const referrals = this.loadReferrals();
    const refRecord = referrals.get(chatId) || { referralCount: 0, totalEarned: 0, referredUserIds: [] };
    const refLink = `https://t.me/${this.botUsername.replace('@', '')}?start=ref${chatId}`;

    const text =
      `✨ <b>REFER & EARN</b> ✨\n\n` +
      `<blockquote>` +
      `<b>Invite friends & earn rewards:</b>\n\n` +
      `• ₹2.00 — when friend adds balance first time\n` +
      `• ₹2.00 — when friend makes first purchase\n\n` +
      `👥 <b>Total Referrals:</b> ${refRecord.referralCount}\n` +
      `💰 <b>Total Earned:</b> ₹${refRecord.totalEarned.toFixed(2)}\n\n` +
      `🔗 <b>Your Referral Link:</b>\n` +
      `<code>${refLink}</code>` +
      `</blockquote>`;

    const shareText = encodeURIComponent(`🔥 Best Free Fire VIP Injectors, Panel Hacks & Mod APKs! Join and get free welcome balance: ${refLink}`);
    const inline_keyboard = [
      [{ text: '🍏 📲 Share Link', url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${shareText}` }],
      [{ text: '❌ Back to Menu', callback_data: 'main_menu' }]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 9. 📞 Support
  private async showSupport(chatId: number, messageId?: number) {
    const text =
      `✨ <b>CUSTOMER SUPPORT CENTER</b> ✨\n\n` +
      `<blockquote>` +
      `<i>Welcome to our 24/7 support desk.</i>\n` +
      `<i>Facing any issues with keys or payments? Contact us!</i>\n\n` +
      `<b>Click the button below to get admin link.</b>` +
      `</blockquote>`;

    const { supportUsername } = this.getStoreSettingsFromDisk();
    const cleanAdmin = (supportUsername || 'INR_TAMIL_GAMER1').replace('@', '');

    const inline_keyboard = [
      [{ text: '💬 Contact Admin', url: `https://t.me/${cleanAdmin}` }],
      [{ text: '❌ Back', callback_data: 'main_menu' }]
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

    const text =
      `🎛️ <b>WEBSITE & BOT MASTER ADMIN PANEL</b> 👑\n\n` +
      `<blockquote>〰️〰️ <b>LIVE STORE METRICS</b> 〰️〰️\n` +
      `👥 <b>Users:</b> <b>${stats.totalUsers}</b> | 💎 <b>VIP Resellers:</b> <b>${stats.resellerCount}</b>\n` +
      `📦 <b>Products:</b> <b>${stats.totalProductsCount}</b> | 🔑 <b>Keys in Stock:</b> <b>${stats.totalKeysInStock}</b>\n` +
      `🛍️ <b>Total Orders:</b> <b>${stats.totalSalesCount}</b> (₹${stats.totalSalesAmount.toFixed(2)})\n` +
      `💳 <b>Active Gateway:</b> <code>${stats.activeGateway}</code>\n` +
      `🏷️ <b>Merchant UPI:</b> <code>${stats.activeUpiId}</code>\n` +
      `💎 <b>Reseller Upgrade Fee:</b> <b>₹${resellerFee}</b>\n` +
      `🎟️ <b>Active Promos:</b> <b>${stats.activePromoCodes}</b> | ⚙️ <b>Maintenance:</b> ${stats.maintenanceMode ? '🔴 ON' : '🟢 OFF'}\n` +
      `〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️</blockquote>\n\n` +
      `👇 <i>Select a category below to configure website & bot settings:</i>`;

    const inline_keyboard = [
      [
        { text: '📦 Products & Keys Stock', callback_data: 'admin_menu:products' },
        { text: '💳 Payment Gateways', callback_data: 'admin_menu:gateways' }
      ],
      [
        { text: '👥 Users & Reseller Hub', callback_data: 'admin_menu:users' },
        { text: '🎟️ Promo Codes & Coupons', callback_data: 'admin_menu:promos' }
      ],
      [
        { text: '📢 Broadcast & Notice Banner', callback_data: 'admin_menu:broadcast' },
        { text: '📥 APK, Tutorial & Links', callback_data: 'admin_menu:links' }
      ],
      [
        { text: '📊 Sales & Order History', callback_data: 'admin_menu:stats' },
        { text: '⚙️ Maintenance Mode', callback_data: 'admin_menu:maintenance' }
      ],
      [
        { text: '🏠 Back to Main Menu', callback_data: 'main_menu' }
      ]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 9.1 📦 Products & Key Stock Admin Submenu
  public async showAdminProductsMenu(chatId: number, getProducts?: () => any[], messageId?: number) {
    if (!this.isAdmin(chatId)) return;
    const products = getProducts ? getProducts() : this.loadProductsFromDisk();

    let stockText =
      `📦 <b>PRODUCTS & LICENSE KEYS STOCK</b>\n\n` +
      `<blockquote><b>Current Catalog Breakdown:</b>\n`;

    let totalKeys = 0;
    products.forEach((p: any, idx: number) => {
      let prodKeys = 0;
      let planDetails: string[] = [];
      (p.plans || []).forEach((pl: any) => {
        const pId = pl.id || pl.duration;
        const kCount = (p.planKeys && Array.isArray(p.planKeys[pId])) ? p.planKeys[pId].length : 0;
        prodKeys += kCount;
        planDetails.push(`${pl.duration || pl.name}: <b>${kCount} keys</b> (₹${pl.price}/₹${pl.resellerPrice || Math.round(pl.price * 0.8)})`);
      });
      totalKeys += prodKeys;
      stockText += `\n${idx + 1}. <b>${p.name}</b> (ID: <code>${p.id}</code>)\n   • ${planDetails.join('\n   • ')}\n`;
    });

    stockText += `\n🔑 <b>Total Available Keys:</b> ${totalKeys}</blockquote>\n\n` +
                 `💡 <i>Quick Slash Commands:</i>\n` +
                 `• <code>/addkeys &lt;product&gt; &lt;duration&gt; &lt;keys...&gt;</code>\n` +
                 `• <code>/setprice &lt;product&gt; &lt;duration&gt; &lt;price&gt; [reseller_price]</code>\n` +
                 `• <code>/addproduct &lt;name&gt; | &lt;category&gt; | &lt;game&gt;</code>\n` +
                 `• <code>/delkeys &lt;product&gt; &lt;duration&gt;</code>`;

    const inline_keyboard = [
      [
        { text: '➕ Add Keys to Plan', callback_data: 'admin_action:add_keys_prompt' },
        { text: '💲 Change Plan Price', callback_data: 'admin_action:set_price_prompt' }
      ],
      [
        { text: '📦 Add New Product', callback_data: 'admin_action:add_product_prompt' },
        { text: '🗑️ Clear Plan Stock', callback_data: 'admin_action:clear_stock_prompt' }
      ],
      [
        { text: '🔄 Refresh Stock List', callback_data: 'admin_menu:products' },
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
      `📥 <b>APK, TUTORIAL & SUPPORT LINKS</b>\n\n` +
      `<blockquote><b>Current Configured URLs:</b>\n` +
      `• <b>APK Download URL:</b>\n<code>${apkDownloadUrl}</code>\n\n` +
      `• <b>YouTube Tutorial URL:</b>\n<code>${apkTutorialUrl}</code>\n\n` +
      `• <b>Support Contact:</b> <code>${support}</code>\n` +
      `• <b>Bot Username:</b> <code>${botUsername}</code></blockquote>\n\n` +
      `💡 <i>Quick Slash Commands:</i>\n` +
      `• <code>/setapk &lt;url&gt;</code>\n` +
      `• <code>/settutorial &lt;url&gt;</code>\n` +
      `• <code>/setsupport &lt;@username&gt;</code>`;

    const inline_keyboard = [
      [
        { text: '📥 Change APK URL', callback_data: 'admin_set_apk_url' },
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

  // 9.8 ⚙️ Maintenance Mode Submenu
  public async showAdminMaintenanceMenu(chatId: number, messageId?: number) {
    if (!this.isAdmin(chatId)) return;
    const storeData = this.loadStoreDataFromDisk();
    const isMaintenance = !!storeData.storeSettings?.maintenanceMode;

    const text =
      `⚙️ <b>WEBSITE MAINTENANCE MODE</b>\n\n` +
      `<blockquote><b>Current Status:</b>\n` +
      `• <b>Maintenance Mode:</b> ${isMaintenance ? '🔴 <b>ACTIVE (Website Closed)</b>' : '🟢 <b>OFF (Website Open & Running)</b>'}\n` +
      `</blockquote>\n\n` +
      `When maintenance mode is ON, visitors to the website see a maintenance notice while store admins can still access and manage everything.\n\n` +
      `💡 <i>Toggle status below:</i>`;

    const inline_keyboard = [
      [
        { text: '🔴 Turn ON Maintenance', callback_data: 'admin_toggle_maint:on' },
        { text: '🟢 Turn OFF Maintenance', callback_data: 'admin_toggle_maint:off' }
      ],
      [
        { text: '🔙 Back to Admin Hub', callback_data: 'admin_panel' }
      ]
    ];

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
    const liveApkUrl = apkDownloadUrl && apkDownloadUrl.startsWith('http') ? apkDownloadUrl : 'https://t.me/kalamffpanel';

    const text =
      `📥 <b>KALAM FF PANEL DOWNLOAD HUB</b> 🎮\n\n` +
      `Get the latest safe APKs, OBB injectors, anti-ban config files, and setup tutorials:\n\n` +
      `📱 <b>1. Main VIP Panel APK:</b>\n` +
      `• Version: Latest Anti-Ban v2.1\n` +
      `• Features: Aimbot, Auto Headshot, ESP Line/Box, Fast Run\n` +
      `• Status: 🟢 <b>100% Safe & Tested</b>\n\n` +
      `🛡️ <b>2. Virtual Space & 64-bit Injector:</b>\n` +
      `• Supports Android 9, 10, 11, 12, 13, 14 & 15\n` +
      `• Non-Root & Root Safe\n\n` +
      `🎥 <b>3. Setup & Key Activation Video:</b>\n` +
      `• Step-by-step video guide for instant login without errors\n\n` +
      `👇 <i>Select a download link below:</i>`;

    const inline_keyboard = [
      [{ text: '📥 Download VIP Panel APK', url: liveApkUrl }],
      [{ text: '🛡️ Download Virtual / Injector', url: liveApkUrl }],
      [{ text: '🎥 Watch Setup Video Tutorial', url: apkTutorialUrl }],
      [
        { text: '🛒 Buy VIP Key', callback_data: 'catalog' },
        { text: '🔙 Back', callback_data: 'main_menu' }
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
