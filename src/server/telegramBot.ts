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
  joinedAt: number;
  lastActive: number;
  referrerId?: string;
  totalSpent: number;
  totalDeposited: number;
  interactionCount?: number;
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

// User state tracking for multi-step bot flows (Deposit, Admin Broadcast, Add Balance)
const userStates = new Map<number, { step: string; data?: any }>();

export class TelegramBotService {
  private static instance: TelegramBotService | null = null;
  private isPolling = false;
  private lastUpdateId = 0;
  private pollTimer: NodeJS.Timeout | null = null;
  private watchdogTimer: NodeJS.Timeout | null = null;
  private botUsername = 'KALAMFFPANELWEBSITE_BOT';
  private processedKeys = new Set<string>();
  private inFlightKeys = new Set<string>();
  private lastCallbackTime = new Map<string, number>();
  private isFetchInProgress = false;
  private lastPollAttemptTime = Date.now();
  private lastSuccessfulPollTime = Date.now();
  private consecutiveErrors = 0;
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

  private saveProcessedKeys() {
    try {
      const filePath = path.join(this.getDataDir(), 'telegram_processed_keys.json');
      // Keep up to 2500 recent deduplication keys
      const arr = Array.from(this.processedKeys).slice(-2500);
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

  private getCredentials(): { botToken: string; defaultChatId: string; apkDownloadUrl: string; apkTutorialUrl: string } {
    const dataDir = this.getDataDir();
    const configFile = path.join(dataDir, 'telegram_config.json');
    const storeConfigFile = path.join(dataDir, 'store_data.json');
    let botToken = process.env.TELEGRAM_BOT_TOKEN || '8990109048:AAEin2WyZl3pGdKXrPSQftMn8-Yh1g0Gop8';
    let defaultChatId = process.env.TELEGRAM_CHAT_ID || '7768975239';
    let apkDownloadUrl = process.env.APK_DOWNLOAD_URL || 'https://t.me/kalamffpanel';
    let apkTutorialUrl = process.env.APK_TUTORIAL_URL || 'https://youtu.be/kalam_tutorial';

    if (fs.existsSync(storeConfigFile)) {
      try {
        const storeData = JSON.parse(fs.readFileSync(storeConfigFile, 'utf8'));
        if (storeData.storeSettings?.apkDownloadUrl) {
          apkDownloadUrl = storeData.storeSettings.apkDownloadUrl.trim();
        }
        if (storeData.storeSettings?.howToUseBotLink) {
          apkTutorialUrl = storeData.storeSettings.howToUseBotLink.trim();
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
      } catch {}
    }

    return { botToken, defaultChatId, apkDownloadUrl, apkTutorialUrl };
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
      };
    } else {
      user.lastActive = Date.now();
      if (from.username) user.username = from.username;
      if (from.first_name) user.firstName = from.first_name;
      if (from.last_name) user.lastName = from.last_name;
      if (!user.referrerId && referrerId && referrerId !== `tg_${from.id}`) {
        user.referrerId = referrerId;
      }
      user.interactionCount = (user.interactionCount || 0) + 1;
    }

    users.set(chatId, user);
    this.saveBotUsers(users);
    return user;
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

  // Send message with standard or custom markup
  public async sendMessage(chatId: string | number, text: string, replyMarkup?: any): Promise<boolean> {
    const { botToken } = this.getCredentials();
    if (!botToken) return false;

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

  public async answerCallback(callbackQueryId: string, text?: string): Promise<void> {
    const { botToken } = this.getCredentials();
    if (!botToken) return;

    try {
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text || '',
          show_alert: false,
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
        console.log('[TelegramBot] Webhook cleared successfully for active long polling.');
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('[TelegramBot] Non-fatal deleteWebhook check:', err.message);
      return false;
    }
  }

  public getBotStatus() {
    return {
      isPolling: this.isPolling,
      botUsername: this.botUsername,
      lastPollAttempt: new Date(this.lastPollAttemptTime).toISOString(),
      lastSuccessfulPoll: new Date(this.lastSuccessfulPollTime).toISOString(),
      msSinceLastPoll: Date.now() - this.lastSuccessfulPollTime,
      isHealthy: Date.now() - this.lastSuccessfulPollTime < 60000,
      consecutiveErrors: this.consecutiveErrors,
      totalUsers: this.getAllBotUsers().length,
      mode: this.isPolling ? 'LONG_POLLING_ACTIVE' : 'STANDBY',
    };
  }

  private initWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
    }
    this.watchdogTimer = setInterval(() => {
      if (!this.isPolling) return;
      const now = Date.now();
      const elapsed = now - this.lastSuccessfulPollTime;

      // If no successful poll in the last 60 seconds or fetch has hung, auto-recover
      if (elapsed > 60000) {
        console.warn(`[TelegramBot] Watchdog: Polling appears inactive (${Math.round(elapsed / 1000)}s since last tick). Auto-recovering polling loop...`);
        if (this.pollTimer) {
          clearTimeout(this.pollTimer);
          this.pollTimer = null;
        }
        this.isFetchInProgress = false;
        this.lastSuccessfulPollTime = Date.now();
        this.triggerNextPoll(500);
      }
    }, 15000);
  }

  private stopWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private triggerNextPoll(delayMs = 1200) {
    if (!this.isPolling) return;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
    this.pollTimer = setTimeout(() => {
      this.executePollCycle();
    }, Math.max(200, delayMs));
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
      console.log('[TelegramBot] Polling already active, callbacks updated.');
      return;
    }

    this.isPolling = true;
    this.lastSuccessfulPollTime = Date.now();
    this.lastPollAttemptTime = Date.now();
    this.consecutiveErrors = 0;
    console.log('[TelegramBot] Long polling service activated with 24/7 self-healing watchdog!');

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
    if (!this.isPolling) return;
    if (this.isFetchInProgress) return;

    const { botToken: currentToken } = this.getCredentials();
    if (!currentToken) {
      this.triggerNextPoll(5000);
      return;
    }

    this.isFetchInProgress = true;
    this.lastPollAttemptTime = Date.now();
    let nextDelay = 1200;

    try {
      const offset = this.lastUpdateId ? `?offset=${this.lastUpdateId + 1}&timeout=18` : '?timeout=18';
      const res = await fetch(`https://api.telegram.org/bot${currentToken}/getUpdates${offset}`, {
        signal: AbortSignal.timeout(24000),
      });

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

        if (this.storedCallbacks) {
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
        nextDelay = 1000;
      } else if (data && !data.ok) {
        this.consecutiveErrors++;
        const desc = (data.description || '').toLowerCase();
        console.warn(`[TelegramBot] Telegram API returned non-OK (code ${data.error_code}):`, data.description);

        if (data.error_code === 409) {
          // Conflict: active webhook or another instance running
          if (desc.includes('webhook')) {
            console.log('[TelegramBot] 409 Conflict detected with active webhook. Auto-deleting webhook to restore polling...');
            await this.deleteWebhookIfActive(currentToken);
            nextDelay = 2000;
          } else {
            console.warn('[TelegramBot] 409 Conflict with another bot session. Backing off 4s...');
            nextDelay = 4000;
          }
        } else if (data.error_code === 429) {
          const retryAfter = (data.parameters && data.parameters.retry_after) || 5;
          console.warn(`[TelegramBot] 429 Rate limit. Backing off ${retryAfter}s...`);
          nextDelay = retryAfter * 1000;
        } else {
          nextDelay = Math.min(10000, 1500 * Math.pow(1.5, Math.min(this.consecutiveErrors, 4)));
        }
      } else {
        // HTTP error or bad response
        this.consecutiveErrors++;
        nextDelay = 3000;
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (!msg.includes('timeout') && !msg.includes('aborted')) {
        this.consecutiveErrors++;
        console.warn('[TelegramBot] Polling network cycle tick:', msg);
        nextDelay = Math.min(8000, 2000 * Math.min(this.consecutiveErrors, 4));
      } else {
        // Normal long poll timeout completion
        this.lastSuccessfulPollTime = Date.now();
        nextDelay = 800;
      }
    } finally {
      this.isFetchInProgress = false;
      this.triggerNextPoll(nextDelay);
    }
  }

  public stopPolling() {
    this.isPolling = false;
    this.isFetchInProgress = false;
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
      { command: 'users', description: '👥 (Admin) View All Registered Bot Users (IDs & Names)' },
      { command: 'setapk', description: '📥 (Admin) Set APK Download URL' },
    ];

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands }),
      });
      const data: any = await res.json();
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

    // 11. Check Update / APK Download
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

    // 1. 🛒 Buy Now
    if (data === 'catalog') {
      await this.showProductCatalog(chatId, getProducts(), msgId);
      return;
    }

    // 2. Check Update
    if (data === 'check_update') {
      await this.showCheckUpdate(chatId, msgId);
      return;
    }

    // 3. 💸 Add Balance
    if (data === 'deposit_prompt') {
      await this.showFamGatewayDepositMenu(chatId, msgId);
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

    // 9. 🔲 Admin Panel
    if (data === 'admin_panel' || data === 'admin_panel_back') {
      await this.showAdminPanel(chatId, getProducts, getUserWallet, msgId);
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

  // Exact Main Menu Visual Layout from User Screenshot & Video
  public async sendMainMenu(chatId: number, balance: number, _ensureReplyKeyboard: boolean = false, messageId?: number) {
    const text =
      `✨ Secure Auto Add Payment System 💸\n` +
      `- My Profile + All History : Check Your Account Information + All History\n` +
      `✈️ Refer And Earn : Share Refer Link & Earn Money\n` +
      `⁉️ How To Use Bot : View Tutorial And Work This Bot\n` +
      `🚀 Support : Bot Problem Fixed For Support Admin\n` +
      `🎁 Daily Gift : Free Spin and win random balance daily, Only one spin every 24 hours.\n\n` +
      `<blockquote>〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️\n` +
      `💸 <b>Your Balance:</b> 💸₹${balance.toFixed(2)}\n` +
      `〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️</blockquote>\n\n` +
      `👇 <b>Select an option from the menu below:</b>`;

    const inline_keyboard = [
      [{ text: '🛒 Buy Now', callback_data: 'catalog' }],
      [
        { text: 'Check Update', callback_data: 'check_update' },
        { text: '💸 Add Balance', callback_data: 'deposit_prompt' }
      ],
      [{ text: '🔥 My Profile + All History', callback_data: 'profile_history' }],
      [
        { text: '🔗 Refer And Earn', callback_data: 'refer_earn' },
        { text: '🎁 How To Use Bot', callback_data: 'how_to_use' }
      ],
      [
        { text: '🚀 Support', callback_data: 'support' },
        { text: '🎁 Daily Gift', callback_data: 'daily_gift' }
      ]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 1. 🛒 Buy Now Catalog matching the video model
  private async showProductCatalog(chatId: number, products: any[], messageId?: number) {
    if (!products || products.length === 0) {
      await this.editOrSendMessage(
        chatId,
        '⚠️ No products currently in catalog. Please check back shortly!',
        { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'main_menu' }]] },
        messageId
      );
      return;
    }

    const inline_keyboard: any[] = [];

    for (const p of products) {
      const rawName = (p.name || p.title || 'Product').trim();
      const plans = Array.isArray(p.plans) ? p.plans : [];
      const planCount = plans.length;
      let displayName = rawName.toUpperCase();
      if (displayName.length > 20) {
        displayName = displayName.slice(0, 18) + '...';
      }
      const label = `🛒 ${displayName} (${planCount} plans)`;

      inline_keyboard.push([
        {
          text: label,
          callback_data: `prod:${p.id || p.productId}`
        }
      ]);
    }

    inline_keyboard.push([{ text: '🔙 Back', callback_data: 'main_menu' }]);

    const text =
      `🛒 <b>SELECT A PRODUCT TO BUY:</b>\n\n` +
      `Choose from our safe, anti-ban panel hacks and injector tools below:`;

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

    const inline_keyboard: any[] = [];

    for (const pl of plans) {
      const dur = pl.duration || pl.name || '1 Day';
      const price = Number(pl.price) || 0;
      inline_keyboard.push([
        {
          text: `⏳ ${dur} — ₹${price}`,
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
      `🛡️ Status: 🟢 <b>100% Anti-Ban Safe & Undetected</b>\n\n` +
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

    const wallet = getUserWallet(userId);
    const price = Number(plan.price) || 0;
    const canAfford = wallet.balance >= price;

    let text =
      `🛒 <b>CONFIRM PURCHASE IN TELEGRAM</b>\n\n` +
      `📦 <b>Product:</b> ${product.name}\n` +
      `⏳ <b>Duration:</b> ${plan.duration || plan.name}\n` +
      `💵 <b>Price:</b> ₹${price}\n\n` +
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
              `<i>Add balance via FamGateway UPI to proceed.</i>`;
      inline_keyboard.push([
        { text: `💸 Add ₹${shortage} via FamGateway`, callback_data: `fam_amt:${shortage}` },
        { text: '➕ Custom Deposit', callback_data: 'fam_custom' }
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

    const price = Number(plan.price) || 0;
    const wallet = getUserWallet(userId);

    if (wallet.balance < price) {
      await this.editOrSendMessage(chatId, `⚠️ Insufficient balance (₹${wallet.balance.toFixed(2)}) for ₹${price} order. Please add balance first.`, {
        inline_keyboard: [
          [{ text: `💸 Add ₹${price - wallet.balance} via FamGateway`, callback_data: `fam_amt:${price - wallet.balance}` }],
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
            [{ text: '🚀 Support', callback_data: 'support' }],
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
      `Telegram Bot: ${product.name} (${plan.duration || plan.name})`
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

    const users = this.loadBotUsers();
    const u = users.get(chatId);
    if (u) {
      u.totalSpent += price;
      users.set(chatId, u);
      this.saveBotUsers(users);
    }

    const keysList = deliveryResult.keys.map(k => `<code>${k}</code>`).join('\n');
    const newBal = getUserWallet(userId).balance;

    const { apkDownloadUrl, apkTutorialUrl } = this.getCredentials();
    const successMsg =
      `🎉 <b>KEY PURCHASE SUCCESSFUL!</b>\n\n` +
      `📦 <b>Product:</b> ${product.name}\n` +
      `⏳ <b>Duration:</b> ${plan.duration || plan.name}\n` +
      `💵 <b>Amount Paid:</b> ₹${price}\n` +
      `💳 <b>Remaining Balance:</b> ₹${newBal.toFixed(2)}\n\n` +
      `🔑 <b>YOUR DELIVERED LICENSE KEY(S):</b>\n` +
      `${keysList}\n\n` +
      `📌 <i>Tap the key above to copy it instantly. Download the latest safe APK from Telegram or "Check Update".</i>`;

    await this.editOrSendMessage(chatId, successMsg, {
      inline_keyboard: [
        [{ text: '📥 Download APK on Telegram', url: apkDownloadUrl }],
        [{ text: 'Check Update & APK', callback_data: 'check_update' }],
        [{ text: '👑 My Profile + All History', callback_data: 'profile_history' }],
        [{ text: '🛒 Buy Another Key', callback_data: 'catalog' }],
        [{ text: '🔙 Back', callback_data: 'main_menu' }]
      ]
    }, messageId);
  }

  // 2. Check Update Menu (matching the video model)
  private async showCheckUpdate(chatId: number, messageId?: number) {
    const { apkDownloadUrl } = this.getCredentials();
    const targetUrl = apkDownloadUrl && apkDownloadUrl.startsWith('http') ? apkDownloadUrl : 'https://t.me/kalamffpanel';

    const text =
      `📢 <b>Follow our updates channel:</b>\n\n` +
      `✈️ <b>Telegram</b>\n` +
      `<b>Banti Bhaiya All Update</b>\n` +
      `🙏 FOCUS ON LAWDA LAHSUN\n` +
      `Owner :- @BANTIBHAIYA69\n` +
      `Main Tg:- @SHIVAMBABYUP51\n\n` +
      `🛡️ <i>Join our updates channel for latest APKs, video guides, and announcements!</i>`;

    const inline_keyboard = [
      [{ text: 'VIEW CHANNEL', url: targetUrl }],
      [{ text: '🔙 Back', callback_data: 'main_menu' }]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 3. 💸 Add Balance (FamGateway)
  private async showFamGatewayDepositMenu(chatId: number, messageId?: number) {
    const text =
      `⚡ <b>DEPOSIT VIA FAMGATEWAY UPI</b>\n\n` +
      `• Instant automated UPI payments with direct wallet balance credit.\n` +
      `• Works with Google Pay, PhonePe, Paytm, BHIM & Cred.\n` +
      `• Funds credited instantly to your Telegram wallet!\n\n` +
      `<b>Select an amount to deposit:</b>`;

    const inline_keyboard = [
      [
        { text: '₹20', callback_data: 'fam_amt:20' },
        { text: '₹50', callback_data: 'fam_amt:50' },
        { text: '₹100', callback_data: 'fam_amt:100' }
      ],
      [
        { text: '₹200', callback_data: 'fam_amt:200' },
        { text: '₹500', callback_data: 'fam_amt:500' },
        { text: '₹1000', callback_data: 'fam_amt:1000' }
      ],
      [
        { text: '✏️ Enter Custom Amount', callback_data: 'fam_custom' }
      ],
      [
        { text: '🔙 Back', callback_data: 'main_menu' }
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
        { text: '🔙 Cancel / Main Menu', callback_data: 'main_menu' }
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

  // Balance & Wallet Fast Display
  private async showBalance(
    chatId: number,
    botUser: BotUser,
    getUserWallet: (id: string) => { balance: number; email?: string; userId: string },
    messageId?: number
  ) {
    const wallet = getUserWallet(botUser.userId);
    const text =
      `💰 <b>YOUR WALLET BALANCE</b>\n\n` +
      `<blockquote>〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️\n` +
      `💸 <b>Current Balance:</b> <b>₹${wallet.balance.toFixed(2)}</b>\n` +
      `〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️</blockquote>\n\n` +
      `🆔 <b>Telegram ID:</b> <code>${botUser.userId}</code>\n\n` +
      `<i>Need more funds to purchase VIP keys? Top up instantly below:</i>`;

    const inline_keyboard = [
      [{ text: '💸 Add Balance (FamGateway)', callback_data: 'deposit_prompt' }],
      [{ text: '🛒 Buy Now', callback_data: 'catalog' }],
      [{ text: '🔥 My Profile + History', callback_data: 'profile_history' }],
      [{ text: '🔙 Back', callback_data: 'main_menu' }]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 4. 🔥 My Profile + All History
  private async showUserProfileAndHistory(
    chatId: number,
    botUser: BotUser,
    getUserWallet: (id: string) => { balance: number; email?: string; userId: string },
    messageId?: number
  ) {
    const wallet = getUserWallet(botUser.userId);

    const gifts = this.loadDailyGifts();
    const giftRecord = gifts.get(chatId) || { lastClaimed: 0, streak: 0, totalWon: 0 };

    const referrals = this.loadReferrals();
    const refRecord = referrals.get(chatId) || { referralCount: 0, totalEarned: 0, referredUserIds: [] };

    // Load recent purchases
    const allPurchases = this.loadPurchases();
    const userPurchases = allPurchases.filter(p => p.chatId === chatId || p.userId === botUser.userId).slice(0, 3);

    let purchaseHistoryText = '<i>No keys purchased yet</i>';
    if (userPurchases.length > 0) {
      purchaseHistoryText = userPurchases.map(p => {
        const d = new Date(p.timestamp).toLocaleDateString();
        const kStr = p.keys.map(k => `<code>${k}</code>`).join(', ');
        return `• <b>${p.productName}</b> (${p.planDuration}) - ₹${p.price}\n  Key: ${kStr} (${d})`;
      }).join('\n');
    }

    const text =
      `🔥 <b>MY PROFILE & ORDER HISTORY</b>\n\n` +
      `👤 <b>Telegram User:</b> ${botUser.firstName} ${botUser.username ? '(@' + botUser.username + ')' : ''}\n` +
      `🆔 <b>Telegram ID:</b> <code>${botUser.userId}</code>\n` +
      `💰 <b>Current Balance:</b> <b>₹${wallet.balance.toFixed(2)}</b>\n\n` +
      `🎁 <b>Daily Gifts Won:</b> ₹${giftRecord.totalWon.toFixed(2)} (${giftRecord.streak} streak days)\n` +
      `👥 <b>Total Referrals:</b> ${refRecord.referralCount} Users (Earned: ₹${refRecord.totalEarned.toFixed(2)})\n\n` +
      `📜 <b>RECENT DELIVERED KEYS:</b>\n` +
      `${purchaseHistoryText}`;

    const inline_keyboard = [
      [{ text: '🔑 View All My Keys', callback_data: 'my_keys' }],
      [
        { text: '💸 Add Balance', callback_data: 'deposit_prompt' },
        { text: '🛒 Buy Now', callback_data: 'catalog' }
      ],
      [{ text: '🔙 Back', callback_data: 'main_menu' }]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  private async showUserKeyHistory(chatId: number, botUser: BotUser, messageId?: number) {
    const allPurchases = this.loadPurchases();
    const userPurchases = allPurchases.filter(p => p.chatId === chatId || p.userId === botUser.userId);

    if (userPurchases.length === 0) {
      await this.editOrSendMessage(chatId, '📦 <b>No License Keys Found!</b>\nYou have not bought any keys yet. Tap "Buy Now" to make your first purchase.', {
        inline_keyboard: [
          [{ text: '🛒 Buy Now', callback_data: 'catalog' }],
          [{ text: '🔙 Back', callback_data: 'profile_history' }]
        ]
      }, messageId);
      return;
    }

    const keysList = userPurchases.map((p, idx) => {
      const dateStr = new Date(p.timestamp).toLocaleString();
      const keysFormatted = p.keys.map(k => `<code>${k}</code>`).join('\n');
      return `<b>${idx + 1}. ${p.productName}</b> (${p.planDuration})\n` +
             `💵 Paid: ₹${p.price} | 📅 ${dateStr}\n` +
             `🔑 Key(s):\n${keysFormatted}`;
    }).join('\n\n');

    const text =
      `🔑 <b>YOUR DELIVERED LICENSE KEYS</b>\n\n` +
      `${keysList}\n\n` +
      `<i>Tap on any key code to copy it directly.</i>`;

    await this.editOrSendMessage(chatId, text, {
      inline_keyboard: [
        [{ text: '🛒 Buy Another Key', callback_data: 'catalog' }],
        [{ text: '🔙 Back', callback_data: 'profile_history' }]
      ]
    }, messageId);
  }

  // 5. 🔗 Refer And Earn
  private async showReferAndEarn(chatId: number, messageId?: number) {
    const referrals = this.loadReferrals();
    const refRecord = referrals.get(chatId) || { referralCount: 0, totalEarned: 0, referredUserIds: [] };
    const refLink = `https://t.me/${this.botUsername}?start=ref_${chatId}`;
    const shareText = encodeURIComponent(`🔥 Best Free Fire VIP Injectors, Panel Hacks & Mod APKs! Join and get free welcome balance: ${refLink}`);

    const text =
      `🔗 <b>REFER AND EARN REAL CASH!</b>\n\n` +
      `Share your personal referral link with your friends or gaming groups and earn money directly in your wallet!\n\n` +
      `🎁 <b>REFERRAL BENEFITS:</b>\n` +
      `• <b>Instant Bonus:</b> Earn <b>₹2.00</b> for every friend who joins!\n` +
      `• <b>Deposit Commission:</b> Earn <b>5% lifetime commission</b> on all deposits made by your friends!\n` +
      `• <b>Friend Bonus:</b> Your invited friend receives <b>₹1.00</b> free welcome balance!\n\n` +
      `👥 <b>Your Referrals:</b> <b>${refRecord.referralCount} Users</b>\n` +
      `💰 <b>Total Referral Earnings:</b> <b>₹${refRecord.totalEarned.toFixed(2)}</b>\n\n` +
      `🔗 <b>YOUR UNIQUE INVITE LINK:</b>\n` +
      `<code>${refLink}</code>\n\n` +
      `<i>Tap the link above to copy it or click Share below!</i>`;

    const inline_keyboard = [
      [{ text: '📲 Share to Friends & Groups', url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${shareText}` }],
      [
        { text: '💸 Add Balance', callback_data: 'deposit_prompt' },
        { text: '🔙 Back', callback_data: 'main_menu' }
      ]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 6. ⁉️ How To Use Bot
  private async showHowToUseBot(chatId: number, messageId?: number) {
    const text =
      `⁉️ <b>HOW TO USE THE STORE BOT</b>\n\n` +
      `Follow these simple steps to buy and activate your Free Fire keys:\n\n` +
      `1️⃣ <b>Add Balance to Your Wallet:</b>\n` +
      `• Tap <b>💸 Add Balance</b> in the menu.\n` +
      `• Pick an amount (₹20, ₹50, ₹100, etc.) or enter custom amount.\n` +
      `• Scan the FamGateway dynamic QR code via Google Pay, PhonePe, Paytm, or BHIM.\n` +
      `• Tap <b>Check Payment Status</b>. Funds are credited instantly!\n\n` +
      `2️⃣ <b>Buy License Key:</b>\n` +
      `• Tap <b>🛒 Buy Now</b> to view all available products.\n` +
      `• Pick your mod and desired duration (1 Day, 7 Days, 30 Days).\n` +
      `• Click <b>Confirm & Buy Key</b>. Your key is delivered immediately in this chat!\n\n` +
      `3️⃣ <b>Download APK & Setup:</b>\n` +
      `• Tap <b>Check Update</b> to get the latest anti-ban APK and setup video.\n` +
      `• Open the APK, enter your delivered license key, and activate cheats safely.\n\n` +
      `4️⃣ <b>Free Daily Gift:</b>\n` +
      `• Tap <b>🎁 Daily Gift</b> once every 24 hours to win free wallet balance!`;

    const inline_keyboard = [
      [{ text: '🛒 Buy Now', callback_data: 'catalog' }],
      [
        { text: '💸 Add Balance', callback_data: 'deposit_prompt' },
        { text: 'Check Update & Video', callback_data: 'check_update' }
      ],
      [{ text: '🔙 Back', callback_data: 'main_menu' }]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 7. 🚀 Support
  private async showSupport(chatId: number, messageId?: number) {
    const text =
      `🚀 <b>CUSTOMER SUPPORT & HELP DESK</b>\n\n` +
      `Need help with a payment, key activation, or APK setup? Our support team is here for you!\n\n` +
      `👨‍💻 <b>Support Admin:</b> @Velprasath_12\n` +
      `📢 <b>Official Updates Channel:</b> <a href="https://t.me/kalamffpanel">Join Kalam Updates Channel</a>\n` +
      `⏱️ <b>Working Hours:</b> 24/7 Fast Support\n` +
      `🛡️ <b>Guarantee:</b> 100% Working Keys & Safe Downloads\n\n` +
      `<i>Tap below to contact support admin directly:</i>`;

    const inline_keyboard = [
      [{ text: '💬 Contact Support Admin', url: 'https://t.me/Velprasath_12' }],
      [{ text: '📢 Join Official Channel', url: 'https://t.me/kalamffpanel' }],
      [{ text: '🔙 Back', callback_data: 'main_menu' }]
    ];

    await this.editOrSendMessage(chatId, text, { inline_keyboard }, messageId);
  }

  // 8. 🎁 Daily Gift (Free Spin Wheel)
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

    if (record.lastClaimed > 0 && elapsed < cooldownMs) {
      const remainingMs = cooldownMs - elapsed;
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

      const wallet = getUserWallet(userId);
      const text =
        `⏳ <b>DAILY GIFT COOLDOWN!</b>\n\n` +
        `You have already spun the daily wheel today.\n\n` +
        `⏰ <b>Next Free Spin available in:</b>\n` +
        `<b>${hours} Hours, ${minutes} Minutes, ${seconds} Seconds</b>\n\n` +
        `💰 <b>Your Current Balance:</b> ₹${wallet.balance.toFixed(2)}\n\n` +
        `<i>Come back tomorrow to spin again for free balance!</i>`;

      await this.editOrSendMessage(chatId, text, {
        inline_keyboard: [
          [{ text: '🛒 Buy Now', callback_data: 'catalog' }],
          [{ text: '🔥 My Profile', callback_data: 'profile_history' }],
          [{ text: '🔙 Back', callback_data: 'main_menu' }]
        ]
      }, messageId);
      return;
    }

    // Eligible for spin! Random prize between ₹0.50 and ₹5.00
    const prizes = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 5.0];
    const prize = prizes[Math.floor(Math.random() * prizes.length)];

    // Update streak: if claimed within 48 hours, increase streak; else reset to 1
    if (elapsed < 48 * 60 * 60 * 1000) {
      record.streak += 1;
    } else {
      record.streak = 1;
    }
    record.lastClaimed = now;
    record.totalWon += prize;
    gifts.set(chatId, record);
    this.saveDailyGifts(gifts);

    // Credit user's wallet
    creditWallet(userId, prize, `Daily Gift Lucky Spin (Streak: ${record.streak})`);
    const newWallet = getUserWallet(userId);

    const text =
      `🎁 <b>DAILY GIFT LUCKY SPIN!</b> 🎰\n\n` +
      `<blockquote>〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️\n` +
      `🎉 <b>CONGRATULATIONS!</b>\n` +
      `You won: <b>💸 ₹${prize.toFixed(2)}</b>\n` +
      `〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️</blockquote>\n\n` +
      `💰 <i>The bonus has been added directly to your wallet!</i>\n` +
      `💳 <b>New Wallet Balance:</b> <b>₹${newWallet.balance.toFixed(2)}</b>\n` +
      `🔥 <b>Current Streak:</b> ${record.streak} Days\n\n` +
      `⏰ <i>Come back in 24 hours for your next free spin!</i>`;

    await this.editOrSendMessage(chatId, text, {
      inline_keyboard: [
        [{ text: '🛒 Buy Keys Now', callback_data: 'catalog' }],
        [{ text: '🔥 My Profile', callback_data: 'profile_history' }],
        [{ text: '🔙 Back', callback_data: 'main_menu' }]
      ]
    }, messageId);
  }

  // 9. 🔲 Admin Panel
  private async showAdminPanel(
    chatId: number,
    getProducts: () => any[],
    getUserWallet: (id: string) => { balance: number; email?: string; userId: string },
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

    const users = this.loadBotUsers();
    const purchases = this.loadPurchases();
    const products = getProducts();

    let totalKeysInStock = 0;
    for (const p of products) {
      if (p.planKeys && typeof p.planKeys === 'object') {
        for (const kList of Object.values(p.planKeys)) {
          if (Array.isArray(kList)) totalKeysInStock += kList.length;
        }
      }
      if (Array.isArray(p.keys)) {
        totalKeysInStock += p.keys.length;
      }
    }

    const totalSalesAmount = purchases.reduce((sum, p) => sum + (p.price || 0), 0);
    const { apkDownloadUrl } = this.getCredentials();

    const text =
      `🔲 <b>KALAM STORE BOT ADMIN PANEL</b>\n\n` +
      `📊 <b>STORE STATISTICS:</b>\n` +
      `• <b>Total Registered Bot Users:</b> ${users.size}\n` +
      `• <b>Total Key Sales via Bot:</b> ${purchases.length} (₹${totalSalesAmount.toFixed(2)})\n` +
      `• <b>Total Keys in Stock:</b> ${totalKeysInStock} Keys\n` +
      `• <b>Active Products Catalog:</b> ${products.length} Products\n` +
      `• 📥 <b>Live APK URL:</b> <code>${apkDownloadUrl}</code>\n\n` +
      `<i>Choose an administrative action below:</i>`;

    const inline_keyboard = [
      [{ text: `👥 View All Users (${users.size} Registered)`, callback_data: 'admin_users:0' }],
      [{ text: '📥 Change APK Download URL', callback_data: 'admin_set_apk_url' }],
      [{ text: '📢 Broadcast Announcement', callback_data: 'admin_broadcast' }],
      [{ text: '➕ Add Balance to User', callback_data: 'admin_add_bal' }],
      [{ text: '📦 View Stock Diagnostics', callback_data: 'catalog' }],
      [{ text: '🔙 Back', callback_data: 'main_menu' }]
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
        return `<b>${startIdx + i + 1}. ${fullName}</b> (${userHandle})\n` +
               `🆔 <b>Telegram User ID:</b> <code>${u.chatId}</code>\n` +
               `💼 <b>Platform ID:</b> <code>${u.userId}</code>\n` +
               `💰 <b>Wallet Balance:</b> ₹${wallet.balance.toFixed(2)} | 🛒 <b>Spent:</b> ₹${(u.totalSpent || 0).toFixed(2)}\n` +
               `⏱️ <b>Last Seen:</b> ${lastActiveStr} | 📅 <b>Joined:</b> ${joinedStr}\n` +
               `➕ <code>/addbalance ${u.userId} 100</code>`;
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
