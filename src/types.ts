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
  badge?: string;
}

export interface PlanPricing {
  id: string;
  duration: string; // e.g. "1 Day", "3 Days", "7 Days", "30 Days"
  price: number;
  resellerPrice?: number;
  keysCount?: number;
  remoteProductId?: string;
  remoteDuration?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string; // e.g. "NON-ROOT MOBILE", "ROOT MOBILE", "PC EMULATOR", "BOT SERVICES", "8 BALL POOL"
  game?: string; // e.g. "FREEFIRE", "8 BAAL POOL", "ALL GAMES"
  deviceType?: string; // e.g. "ROOT + NONROOT", "NON ROOT", "ROOT", "IOS", "ALL Systems"
  imageUrl?: string;
  videoUrl?: string;
  downloadUrl?: string;
  setupGuideUrl?: string;
  features?: string[];
  stock: number;
  status: 'ACTIVE' | 'DISABLED' | 'MAINTENANCE';
  channelLink?: string;
  description?: string;
  plans: PlanPricing[];
  keys: string[];
  planKeys?: Record<string, string[]>; // Map of planId -> array of real key strings
  api1Restock?: {
    remoteProductId: string;
    remoteDuration: string;
  };
  api2Restock?: {
    remoteProductId: string;
    remoteDuration: string;
  };
}

export interface IdStockItem {
  id: string;
  productId: string;
  planId?: string;
  keyCode: string;
  addedAt: string;
  status: 'AVAILABLE' | 'SOLD';
  soldTo?: string;
  soldAt?: string;
}

export interface ProductLink {
  id: string;
  productId: string;
  productName: string;
  status: 'ACTIVE' | 'DISABLED';
  directLink: string;
  websiteLink?: string;
  botLink?: string;
  customSlug?: string;
  game?: string;
  category?: string;
  createdAt?: string;
}

export interface ApiConfig {
  id: string;
  name: string;
  type: 'adminpanels' | 'hkmodz' | 'custom' | 'freepanel';
  subtitle?: string;
  apiUrl?: string;
  apiKey?: string;
  xApiToken?: string;
  masterKey?: string;
  authHeader?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONFIGURED';
  isActive?: boolean;
  lastTested?: string;
}

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  isActive: boolean;
  apiKey: string;
  apiKey2?: string;
  baseUrl: string;
  isLockedUrl: boolean;
  upiId?: string;
  merchantName?: string;
  status?: string;
  gatewayUrl?: string;
  merchantUpi?: string;
}

export interface StoreSettings {
  shopName: string;
  tagline: string;
  logoUrl?: string;
  supportUsername: string;
  supportLink?: string;
  telegramSupportUrl?: string;
  whatsappSupportNumber?: string;
  paymentProofChannel: string;
  howToUseBotLink: string;
  minDeposit: number;
  maxDeposit?: number;
  depositBonusPercent: number;
  referralBonusPercent: number;
  currencySymbol: string;
  adminEmail?: string;
  adminPassword?: string;
  upiId?: string;
  upiManualId?: string;
  merchantUpi?: string;
  upiMerchantName?: string;
  customQrUrl?: string;
  manualPaymentInstructions?: string;
  paymentGatewayMode?: 'FREEPANEL_AUTO' | 'DIRECT_UPI_QR' | 'BOTH';
  paymentFeePercent?: number;
  announcementText?: string;
  announcementEnabled?: boolean;
  maintenanceMode?: boolean;
  dailySpinEnabled?: boolean;
  enableUtrInput?: boolean;
  // Visual Logo & Theme Customization
  logoShape?: 'rounded' | 'circle' | 'square';
  logoGlowColor?: 'cyan' | 'purple' | 'gold' | 'emerald' | 'pink';
  logoSize?: 'sm' | 'md' | 'lg';
  themeAccent?: 'cyan' | 'purple' | 'gold' | 'emerald' | 'rose' | 'blue';
  storeNoticeBadge?: string;
  // User Storefront Section Visibility
  showHeroCard?: boolean;
  showTopSellers?: boolean;
  showQuickActions?: boolean;
  showDepositGuide?: boolean;
  showCatalogPreview?: boolean;
  discordSupportUrl?: string;
}

export interface ResellerUser {
  id: string;
  email: string;
  name: string;
  username: string;
  phone?: string;
  walletBalance: number;
  depositedToday: number;
  soldToday?: number;
  totalKeysSold: number;
  totalSpent?: number;
  customDiscountPercent?: number;
  isReseller: boolean;
  role?: 'USER' | 'RESELLER' | 'ADMIN';
  joinedDate: string;
  status: 'ACTIVE' | 'WARNING' | 'INACTIVE' | 'BLOCKED';
  lastLogin?: string;
  notes?: string;
  avatarUrl?: string;
  referralCode?: string;
  referredBy?: string;
  referralEarnings?: number;
  totalReferrals?: number;
}

export interface PurchasedKey {
  id: string;
  productName: string;
  planName: string;
  keyCode: string;
  purchaseDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  price: number;
  invoiceNumber?: string;
  orderId?: string;
  deviceType?: string;
  game?: string;
}

export interface PurchaseInvoice {
  invoiceNumber: string;
  orderId: string;
  date: string;
  buyerName: string;
  buyerUsername?: string;
  buyerEmail?: string;
  productName: string;
  category?: string;
  game?: string;
  deviceType?: string;
  planDuration: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: string;
  keys: string[];
  status: 'PAID' | 'DELIVERED';
  shopName: string;
  supportContact?: string;
}

export interface TransactionRecord {
  id: string;
  type: 'DEPOSIT' | 'KEY_PURCHASE' | 'REFERRAL_REWARD' | 'RESELLER_PAYOUT' | 'ADJUSTMENT';
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  date: string;
  method?: string;
  utrOrReference?: string;
  description?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
  role: 'USER' | 'RESELLER' | 'ADMIN';
  walletBalance: number;
  joinedDate: string;
  avatarUrl?: string;
  isReseller?: boolean;
  referralCode?: string;
  referredBy?: string;
  referralEarnings?: number;
  totalReferrals?: number;
}

export interface StoreActivityNotification {
  id: string;
  type: 'DEPOSIT' | 'PURCHASE' | 'TOPUP' | 'REFUND';
  title: string;
  message: string;
  amount: number;
  userName: string;
  userEmail?: string;
  productName?: string;
  planDuration?: string;
  quantity?: number;
  timestamp: number;
  createdAtStr: string;
  read?: boolean;
}

export interface DiscountCoupon {
  id: string;
  code: string;
  discountPercent: number;
  discountFlat?: number;
  minAmount?: number;
  maxUses?: number;
  usedCount?: number;
  description?: string;
  isActive: boolean;
  expiryDate?: string;
}
