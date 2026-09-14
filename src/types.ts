export type Role = 'ADMIN' | 'RESELLER' | 'USER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username?: string;
  role: Role;
  balance?: number;
  joinedDate?: string;
  createdAt?: string;
  status?: string;
}

export interface UserStats {
  balance: number;
  todaySalesU: number;
  todaySalesMe: number;
  monthlySalesU: number;
  monthlySalesMe: number;
}

export interface TopSeller {
  rank: number;
  username: string;
  salesCount: number;
  reward: string;
  badge: string;
}

export interface PlanPricing {
  id: string;
  pid?: string;
  productId?: string;
  duration: string;
  price: number;
  resellerPrice?: number;
  stock?: number;
  keys?: string[];
}

export interface Product {
  id: string;
  pid?: string;
  productId?: string;
  name: string;
  game: string;
  description?: string;
  features?: string[];
  bannerUrl?: string;
  iconUrl?: string;
  downloadLink?: string;
  status?: 'ACTIVE' | 'OUT_OF_STOCK' | 'MAINTENANCE';
  pricing?: PlanPricing[];
  plans?: PlanPricing[];
  planKeys?: Record<string, string[]>;
  keys?: string[];
  category?: string;
  isPopular?: boolean;
}

export interface ProductLink {
  id: string;
  title: string;
  url: string;
  category?: string;
  description?: string;
  badge?: string;
}

export interface ApiConfig {
  id: string;
  name: string;
  subtitle?: string;
  type: string;
  apiUrl: string;
  apiKey?: string;
  masterKey?: string;
  xApiToken?: string;
  status?: string;
  lastTested?: string;
}

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  isActive: boolean;
  apiKey: string;
  apiKey2?: string;
  baseUrl: string;
  isLockedUrl?: boolean;
  upiId: string;
  merchantName: string;
}

export interface StoreSettings {
  shopName: string;
  tagline: string;
  logoUrl: string;
  supportUsername: string;
  paymentProofChannel: string;
  howToUseBotLink: string;
  minDeposit: number;
  depositBonusPercent: number;
  referralBonusPercent: number;
  currencySymbol: string;
  enableUtrInput: boolean;
  adminEmail: string;
  adminPassword?: string;
  resellerUpgradeAmount?: number;
  resellerDiscountPercent?: number;
  apkDownloadUrl?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramBotUsername?: string;
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
  isReseller?: boolean;
  role?: Role;
  resellerUpgradedAt?: number;
}

export interface ResellerUser {
  id: string;
  email: string;
  name: string;
  username: string;
  walletBalance: number;
  depositedToday: number;
  soldToday: number;
  totalKeysSold: number;
  isReseller: boolean;
  joinedDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  role?: Role;
  avatarUrl?: string;
  mobileNumber?: string;
}

export interface PurchasedKey {
  id: string;
  orderId: string;
  productName: string;
  planDuration: string;
  keyString: string;
  purchaseDate: string;
  purchaseTimestamp?: number;
  durationHours?: number;
  expiryDate?: string;
  expiryTimestamp?: number;
  amount: number;
  status: 'VALID' | 'EXPIRED' | 'REVOKED';
  userId?: string;
  userName?: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  type: 'DEPOSIT' | 'PURCHASE' | 'REFUND' | 'BONUS';
  amount: number;
  currency?: string;
  date: string;
  timestamp?: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  description: string;
  utrNumber?: string;
  gateway?: string;
}

export interface DiscountCoupon {
  id: string;
  code: string;
  discountPercent: number;
  discountFlat: number;
  minAmount?: number;
  description?: string;
  isActive: boolean;
  usedCount?: number;
  createdAt?: string;
}

// External Website Connect API Key Model
export interface WebsiteApiKey {
  id: string;
  key: string;
  name: string;
  websiteUrl?: string;
  ownerEmail: string;
  permissions: ('read_balance' | 'read_products' | 'order_keys' | 'check_orders')[];
  webhookUrl?: string;
  webhookSecret?: string;
  rateLimitPerMinute: number;
  totalOrders: number;
  totalSpent: number;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

// External Upstream Website Config Model (connecting KALAM FF PANEL to upstream provider)
export interface UpstreamWebsiteConfig {
  id: string;
  name: string;
  websiteUrl: string;
  apiEndpoint: string;
  apiKey: string;
  authHeader: 'Bearer' | 'X-API-Key' | 'Token' | 'Custom';
  customHeaderName?: string;
  productMapping: Record<string, string>; // internal productId/plan -> upstream product/plan ID
  balanceCheckEndpoint?: string;
  balanceJsonPath?: string;
  keyExtractJsonPath?: string;
  isActive: boolean;
  lastPingStatus?: 'ONLINE' | 'OFFLINE' | 'UNTESTED';
  lastPingTime?: string;
  balance?: number;
}

export interface TelegramBotHealthStatus {
  success?: boolean;
  isHealthy: boolean;
  isPolling: boolean;
  isWebhookActive: boolean;
  activeWebhookUrl?: string;
  botUsername?: string;
  msSinceLastPoll: number;
  lastPollAttempt: string;
  lastSuccessfulPoll: string;
  consecutiveErrors: number;
  totalPollCycles: number;
  totalUsers: number;
  mode: 'WEBHOOK_ACTIVE' | 'LONG_POLLING_ACTIVE' | 'STANDBY';
  lastUpdateId: number;
  memoryDedupeKeys: number;
  timestamp?: string;
}

export interface TelegramDiagnosticResult {
  success: boolean;
  latencyMs: number;
  botDetails?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
    can_join_groups?: boolean;
    can_read_all_group_messages?: boolean;
    supports_inline_queries?: boolean;
  };
  webhookInfo?: {
    url?: string;
    has_custom_certificate?: boolean;
    pending_update_count?: number;
    last_error_date?: number;
    last_error_message?: string;
  };
  status: TelegramBotHealthStatus;
  error?: string;
  timestamp: string;
  serverTime?: string;
}
