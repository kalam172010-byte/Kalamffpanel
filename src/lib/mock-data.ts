import {
  UserStats,
  TopSeller,
  Product,
  ProductLink,
  ApiConfig,
  PaymentGatewayConfig,
  StoreSettings,
  ResellerUser,
  PurchasedKey,
  TransactionRecord
} from '../types';

export const USER_STATS: UserStats = {
  balance: 0.00,
  todaySalesU: 0,
  todaySalesMe: 0,
  monthlySalesU: 0,
  monthlySalesMe: 0
};

export const TOP_SELLERS: TopSeller[] = [
  { rank: 1, username: "@9918595291", salesCount: 842, reward: "₹5,000 Bonus", badge: "🥇 Diamond" },
  { rank: 2, username: "@DARKCONFIG", salesCount: 620, reward: "₹3,000 Bonus", badge: "🥈 Platinum" },
  { rank: 3, username: "@users123L", salesCount: 489, reward: "₹1,500 Bonus", badge: "🥉 Gold" },
  { rank: 4, username: "@FFH4XJODVIP108", salesCount: 310, reward: "₹1,000 Bonus", badge: "⭐ Silver" },
  { rank: 5, username: "@bantibhaiya69", salesCount: 195, reward: "₹500 Bonus", badge: "🔥 Bronze" }
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_PRODUCT_LINKS: ProductLink[] = [];

export const INITIAL_API_CONFIGS: ApiConfig[] = [
  {
    id: "api-1",
    name: "Primary Reseller API (AdminPanels.shop)",
    type: "adminpanels",
    apiUrl: "https://adminpanels.shop/api/reseller_v1.php",
    apiKey: "87224c074a021676364829b5b3f0686e",
    masterKey: "a7f3e8b2c9d1f4a6b8c2d5e9f1a3b6c8",
    status: "CONNECTED",
    lastTested: "Just now"
  },
  {
    id: "api-2",
    name: "API #2 — HK MODZ",
    subtitle: "(resellerpanelhk.shop)",
    type: "hkmodz",
    apiUrl: "",
    xApiToken: "",
    status: "DISCONNECTED",
    lastTested: "Not configured"
  }
];

export const INITIAL_PAYMENT_CONFIGS: PaymentGatewayConfig[] = [
  {
    id: "famgateway-gw",
    name: "FamGateway (famgateway.in)",
    isActive: true,
    apiKey: "fam_a9527c6c2dd4d26ad5223cfc3c4c5fa9289b574e",
    apiKey2: "",
    baseUrl: "https://famgateway.in/api/create-order.php",
    isLockedUrl: false,
    upiId: "kalamffpanel@fampay",
    merchantName: "KALAM FF PANEL"
  },
  {
    id: "adityahost-gw",
    name: "AdityaHost UPI Gateway (adityahost.in)",
    isActive: false,
    apiKey: "AH_LIVE_sk_89218a091c4920b78",
    apiKey2: "",
    baseUrl: "https://adityahost.in/api/qr.php",
    isLockedUrl: false,
    upiId: "kalamffpanel@fampay",
    merchantName: "KALAM FF PANEL"
  },
  {
    id: "zapupi-gw",
    name: "ZapUPI Gateway (pay.zapupi.com)",
    isActive: false,
    apiKey: "zap9616e75062c85cc1995818322ae0d1d5",
    apiKey2: "",
    baseUrl: "https://pay.zapupi.com/api/create-order",
    isLockedUrl: false,
    upiId: "kalamffpanel@fampay",
    merchantName: "KALAM FF PANEL"
  },
  {
    id: "fampay-gw",
    name: "FreePanel UPI Gateway (py.freepanel.in)",
    isActive: false,
    apiKey: "FAM_LIVE_sk_I5ZSp9Qxv4pG7Q44dwC7fWBCR8U1zm9U",
    apiKey2: "",
    baseUrl: "https://py.freepanel.in/api/v1/orders",
    isLockedUrl: false,
    upiId: "kalamffpanel@fampay",
    merchantName: "KALAM FF PANEL"
  },
  {
    id: "paytm-gw",
    name: "Paytm Gateway (Business UPI)",
    isActive: false,
    apiKey: "PTM_99218274619472619A",
    apiKey2: "SEC_KEY_PTM_0918284",
    baseUrl: "https://securegw.paytm.in/theia/api/v1/initiateTransaction",
    isLockedUrl: true,
    upiId: "paytmqr.kalam@paytm",
    merchantName: "KALAM PAYTM MERCHANT"
  }
];

export const INITIAL_STORE_SETTINGS: StoreSettings = {
  shopName: "KALAM FF PANEL",
  tagline: "Powered by KALAM",
  logoUrl: "/logo.svg",
  supportUsername: "@kd_123_1_3",
  paymentProofChannel: "https://t.me/yourchannel",
  howToUseBotLink: "https://t.me/yourchannel/3",
  minDeposit: 1,
  depositBonusPercent: 0,
  referralBonusPercent: 10,
  currencySymbol: "₹",
  enableUtrInput: true,
  adminEmail: "kalam172010@gmail.com",
  adminPassword: "kalam@172010"
};

export const INITIAL_RESELLERS: ResellerUser[] = [
  {
    id: "res-1",
    email: "kalam172010@gmail.com",
    name: "KALAM FF PANEL",
    username: "kalam172010",
    walletBalance: 290011.65,
    depositedToday: 15400.00,
    soldToday: 42,
    totalKeysSold: 1890,
    isReseller: true,
    joinedDate: "2024-01-15",
    status: "ACTIVE"
  },
  {
    id: "res-2",
    email: "theja.gamer@gmail.com",
    name: "Theja",
    username: "theja_gamer",
    walletBalance: 0.00,
    depositedToday: 0.00,
    soldToday: 0,
    totalKeysSold: 12,
    isReseller: false,
    joinedDate: "2024-02-10",
    status: "INACTIVE"
  },
  {
    id: "res-3",
    email: "kamaraj.k@gmail.com",
    name: "KAMARAJ",
    username: "kamaraj.k",
    walletBalance: 0.00,
    depositedToday: 0.00,
    soldToday: 0,
    totalKeysSold: 0,
    isReseller: false,
    joinedDate: "2024-03-01",
    status: "ACTIVE"
  }
];

export const INITIAL_USER_KEYS: PurchasedKey[] = [];

export const INITIAL_TRANSACTIONS: TransactionRecord[] = [];

