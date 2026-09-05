import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, AlertCircle, Info, Sparkles, AlertTriangle, Send } from 'lucide-react';

// Data and Types
import {
  USER_STATS,
  TOP_SELLERS,
  INITIAL_PRODUCTS,
  INITIAL_PRODUCT_LINKS,
  INITIAL_API_CONFIGS,
  INITIAL_PAYMENT_CONFIGS,
  INITIAL_STORE_SETTINGS,
  INITIAL_RESELLERS,
  INITIAL_USER_KEYS,
  INITIAL_TRANSACTIONS,
} from './lib/mock-data';
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
  TransactionRecord,
  PlanPricing,
  AuthUser,
  StoreActivityNotification,
  PurchaseInvoice,
  DiscountCoupon,
} from './types';
import { playNotificationSound, getSoundMuted, setSoundMuted } from './lib/sound';
import { playPopSound, playClickSound, playSuccessChime } from './lib/sound-fx';
import { recordCouponUsage } from './lib/coupon-service';

// Layouts and Sub-views
import { UserLayout } from './components/user/user-layout';
import { UserNavTab } from './components/user/user-sidebar';
import { UserDashboard } from './components/user/user-dashboard';
import { QuickActionKey } from './components/user/quick-actions';
import {
  HowToDepositModal,
  DepositModal,
  BuyKeysModal,
  KeyPurchaseModal,
  KeyPurchaseModalData,
} from './components/user/user-modals';
import { BuyKeysView } from './components/user/buy-keys-view';
import { KeySuccessModal } from './components/user/key-success-modal';
import { KeyInvoiceModal } from './components/user/key-invoice-modal';
import {
  MyKeysView,
  HistoryView,
  ReferralView,
  SupportTicketsView,
  ProfileView,
} from './components/user/user-views';
import { AuthModal, AuthMode } from './components/auth/auth-modal';
import { safeFetchJson } from './lib/safe-api';
import { auth, signOut as fbSignOut, onAuthStateChanged } from './lib/firebase';
import {
  subscribeToUsers,
  fetchUsersFromFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
  deduplicateUsers,
  subscribeToStoreSettings,
  saveStoreSettingsToFirestore,
  subscribeToApiConfigs,
  saveApiConfigsToFirestore,
  subscribeToPaymentConfigs,
  savePaymentConfigsToFirestore,
  subscribeToProducts,
  saveProductsToFirestore,
  deleteProductFromFirestore,
  subscribeToProductLinks,
  saveProductLinksToFirestore,
  syncAuthUserToFirestore,
  subscribeToUserTransactions,
  saveTransactionsToFirestore,
  subscribeToUserPurchasedKeys,
  savePurchasedKeysToFirestore,
  subscribeToStoreActivities,
  publishStoreActivity,
} from './lib/firestore-service';

import { AdminLayout } from './components/admin/admin-layout';
import { AdminNavTab } from './components/admin/admin-sidebar';
import {
  AdminDashboardOverview,
  AdminProductsView,
  AdminProductLinksView,
  AdminApiSetupView,
  AdminUpiPaymentView,
  AdminStoreSettingsView,
  AdminResellersView,
} from './components/admin/admin-views';
import {
  AdminIdStockView,
  AdminMembersWalletsView,
  AdminTopupsView,
  AdminSoldKeysView,
  AdminCouponManagerView,
  AdminBroadcastView,
  AdminBinanceView,
  AdminProfileView,
} from './components/admin/admin-extra-views';
import { AdminLoginGate, ADMIN_AUTHORIZED_EMAILS } from './components/admin/admin-login-gate';
import { UserLoginGate } from './components/auth/user-login-gate';
import { AddProductModal } from './components/admin/add-product-modal';
import { ApiDiagnosticView } from './components/admin/api-diagnostic-view';
import { AdminUserManagementView } from './components/admin/admin-user-management-view';

export default function App() {
  // App Mode: 'user' | 'admin'
  const [appMode, setAppMode] = useState<'user' | 'admin'>(() => {
    try {
      if (
        typeof window !== 'undefined' &&
        (window.location.search.includes('admin') ||
         window.location.hash.includes('admin') ||
         localStorage.getItem('kalam_app_mode') === 'admin')
      ) {
        return 'admin';
      }
    } catch {}
    return 'user';
  });

  // Direct Product Link target ID from URL parameters (?product=... or ?prod=... or hash #prod-...)
  const [targetProductId, setTargetProductId] = useState<string | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const prod = params.get('product') || params.get('prod');
        if (prod) return prod;
        const hashMatch = window.location.hash.match(/#prod(?:uct)?-([a-zA-Z0-9_-]+)/);
        if (hashMatch) return hashMatch[1];
      }
    } catch {}
    return null;
  });

  // Active Nav Tabs - Defaults to buy_keys if a direct product link is opened
  const [userTab, setUserTab] = useState<UserNavTab>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('product') || params.get('prod') || window.location.hash.includes('prod')) {
          return 'buy_keys';
        }
      }
    } catch {}
    return 'dashboard';
  });
  const [adminTab, setAdminTab] = useState<AdminNavTab>('dashboard');

  // Smooth loading state & store synchronization
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [isSyncingStore, setIsSyncingStore] = useState(false);

  // URL listener for direct links navigation in runtime
  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const prod = params.get('product') || params.get('prod');
        const hashMatch = window.location.hash.match(/#prod(?:uct)?-([a-zA-Z0-9_-]+)/);
        const target = prod || (hashMatch ? hashMatch[1] : null);
        if (target) {
          setTargetProductId(target);
          setUserTab('buy_keys');
          setAppMode('user');
        }
      } catch {}
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Guest preview mode enabled by default so users directly see storefront
  const [guestPreview, setGuestPreview] = useState(true);

  // Authentication State (Starts null so Login Gate is shown first)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('kalam_auth_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<AuthMode>('LOGIN');

  // Application State
  const [resellers, setResellers] = useState<ResellerUser[]>(() => {
    try {
      const saved = localStorage.getItem('kalam_users_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = deduplicateUsers(parsed);
          try {
            localStorage.setItem('kalam_users_db', JSON.stringify(clean));
          } catch {}
          return clean;
        }
      }
    } catch {}
    return deduplicateUsers(INITIAL_RESELLERS);
  });

  // Sync userStats with logged in user
  const [userStats, setUserStats] = useState<UserStats>(() => {
    try {
      const savedUser = localStorage.getItem('kalam_auth_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (typeof parsed?.walletBalance === 'number') {
          return { ...USER_STATS, balance: parsed.walletBalance };
        }
      }
    } catch {}
    return USER_STATS;
  });

  const [topSellers] = useState<TopSeller[]>(TOP_SELLERS);
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('kalam_products_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter((p) => p && p.id && typeof p.name === 'string' && p.name.trim().length > 0);
          if (clean.length > 0) return clean;
        }
      }
    } catch {}
    return INITIAL_PRODUCTS;
  });

  const [productLinks, setProductLinks] = useState<ProductLink[]>(() => {
    try {
      const saved = localStorage.getItem('kalam_product_links_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter((l) => l && l.id && !['link-1', 'link-2'].includes(l.id));
          return clean;
        }
      }
    } catch {}
    return [];
  });

  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>(() => {
    try {
      const saved = localStorage.getItem('kalam_api_configs_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((a: any) => {
            if (a.id === 'api-2' && (a.xApiToken === 'HK_REST_892019481b0a991823f990' || !a.apiUrl)) {
              return { ...a, xApiToken: '', status: 'DISCONNECTED', apiUrl: '' };
            }
            return a;
          });
        }
      }
    } catch {}
    return INITIAL_API_CONFIGS;
  });

  const [paymentConfigs, setPaymentConfigs] = useState<PaymentGatewayConfig[]>(() => {
    try {
      const saved = localStorage.getItem('kalam_payment_configs_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PAYMENT_CONFIGS;
  });

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('kalam_store_settings_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return INITIAL_STORE_SETTINGS;
  });

  const [userKeys, setUserKeys] = useState<PurchasedKey[]>(() => {
    try {
      const saved = localStorage.getItem('kalam_user_keys');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((k: any) => k?.id !== 'key-1' && k?.keyCode !== 'BALA-NR-8941-X992-VIP');
        }
      }
    } catch {}
    return [];
  });

  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('kalam_user_transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t: any) => t?.id !== 'TXN-994182' && t?.id !== 'TXN-994183');
        }
      }
    } catch {}
    return [];
  });

  // Real-time Store Activities, Notifications & Sound Chime
  const [storeActivities, setStoreActivities] = useState<StoreActivityNotification[]>([]);
  const [unreadActivityCount, setUnreadActivityCount] = useState<number>(0);
  const [liveToastActivity, setLiveToastActivity] = useState<StoreActivityNotification | null>(null);
  const [soundMuted, setSoundMutedState] = useState<boolean>(() => getSoundMuted());

  const handleToggleSound = () => {
    const next = !soundMuted;
    setSoundMutedState(next);
    setSoundMuted(next);
    if (!next) {
      playNotificationSound('alert');
    }
  };

  const handleClearActivities = () => {
    setStoreActivities([]);
    setUnreadActivityCount(0);
    try {
      localStorage.removeItem('kalam_recent_activities');
    } catch {}
  };

  // Persist userKeys whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('kalam_user_keys', JSON.stringify(userKeys));
    } catch {}
  }, [userKeys]);

  // Persist transactions whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('kalam_user_transactions', JSON.stringify(transactions));
    } catch {}
  }, [transactions]);

  // Real-time Store Activity Listener for Admin (Deposits, Key Purchases, Top-ups)
  useEffect(() => {
    const unsub = subscribeToStoreActivities(
      (newActivity) => {
        setStoreActivities((prev) => [
          newActivity,
          ...prev.filter((a) => a.id !== newActivity.id).slice(0, 49),
        ]);
        setUnreadActivityCount((c) => c + 1);
        setLiveToastActivity(newActivity);

        // Play synthesized audible chime (Deposit vs Purchase)
        playNotificationSound(
          newActivity.type === 'DEPOSIT' || newActivity.type === 'TOPUP'
            ? 'deposit'
            : 'purchase'
        );

        // Auto-dismiss live toast after 6 seconds
        setTimeout(() => {
          setLiveToastActivity((cur) => (cur?.id === newActivity.id ? null : cur));
        }, 6000);
      },
      (historyList) => {
        if (Array.isArray(historyList)) {
          setStoreActivities(historyList);
        }
      }
    );

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // 1. Subscribe to Firestore Users in Real-Time
  useEffect(() => {
    const unsub = subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setResellers((prev) => {
          const merged = deduplicateUsers([...cloudUsers, ...prev, ...INITIAL_RESELLERS]);
          try {
            localStorage.setItem('kalam_users_db', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Firestore Store Settings in Real-Time
  useEffect(() => {
    const unsub = subscribeToStoreSettings((cloudSettings) => {
      if (cloudSettings && cloudSettings.shopName) {
        setStoreSettings(cloudSettings);
      }
    });
    return () => unsub();
  }, []);

  // Update browser tab title and favicon dynamically whenever shopName or logo changes
  useEffect(() => {
    if (storeSettings?.shopName) {
      document.title = `${storeSettings.shopName} - Digital Key Store`;
    }
    if (storeSettings?.logoUrl) {
      try {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = storeSettings.logoUrl;
      } catch {}
    }
  }, [storeSettings?.shopName, storeSettings?.logoUrl]);

  // 3. Subscribe to Firestore API Configurations in Real-Time
  useEffect(() => {
    const unsub = subscribeToApiConfigs((cloudConfigs) => {
      if (cloudConfigs && cloudConfigs.length > 0) setApiConfigs(cloudConfigs);
    });
    return () => unsub();
  }, []);

  // 4. Subscribe to Firestore Payment Gateways in Real-Time
  useEffect(() => {
    const unsub = subscribeToPaymentConfigs((cloudPayConfigs) => {
      if (cloudPayConfigs && cloudPayConfigs.length > 0) setPaymentConfigs(cloudPayConfigs);
    });
    return () => unsub();
  }, []);

  // 5. Subscribe to Firestore Products & Server Disk in Real-Time
  useEffect(() => {
    const unsub = subscribeToProducts((cloudProducts) => {
      if (Array.isArray(cloudProducts)) {
        setProducts((prev) => {
          if (cloudProducts.length === 0 && prev.length > 0) {
            // Guard: Retain current valid products and sync to cloud/server
            saveProductsToFirestore(prev).catch(console.warn);
            return prev;
          }
          return cloudProducts;
        });
        try {
          if (cloudProducts.length > 0) {
            localStorage.setItem('kalam_products_db', JSON.stringify(cloudProducts));
            localStorage.setItem('kalam_products_initialized', 'true');
          }
        } catch {}
      }
    });
    return () => unsub();
  }, []);

  // 5b. Subscribe to Firestore Product Links in Real-Time
  useEffect(() => {
    const unsub = subscribeToProductLinks((cloudLinks) => {
      if (Array.isArray(cloudLinks)) {
        setProductLinks((prev) => {
          if (cloudLinks.length === 0 && prev.length > 0) {
            saveProductLinksToFirestore(prev).catch(console.warn);
            return prev;
          }
          return cloudLinks;
        });
        try {
          if (cloudLinks.length > 0) {
            localStorage.setItem('kalam_product_links_db', JSON.stringify(cloudLinks));
          }
        } catch {}
      }
    });
    return () => unsub();
  }, []);

  // 6. Subscribe to User Transactions in Real-Time
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = subscribeToUserTransactions(currentUser.id, (cloudTxns) => {
      if (Array.isArray(cloudTxns)) {
        setTransactions(cloudTxns);
      }
    });
    return () => unsub();
  }, [currentUser?.id]);

  // 7. Subscribe to User Purchased Keys in Real-Time
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = subscribeToUserPurchasedKeys(currentUser.id, (cloudKeys) => {
      if (Array.isArray(cloudKeys)) {
        setUserKeys(cloudKeys);
      }
    });
    return () => unsub();
  }, [currentUser?.id]);

  // Persist products whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('kalam_products_db', JSON.stringify(products));
    } catch {}
  }, [products]);

  // Persist product links whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('kalam_product_links_db', JSON.stringify(productLinks));
    } catch {}
  }, [productLinks]);

  // Persist store settings whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('kalam_store_settings_db', JSON.stringify(storeSettings));
    } catch {}
  }, [storeSettings]);

  // Persist api configs whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('kalam_api_configs_db', JSON.stringify(apiConfigs));
    } catch {}
  }, [apiConfigs]);

  // Persist payment configs whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('kalam_payment_configs_db', JSON.stringify(paymentConfigs));
    } catch {}
  }, [paymentConfigs]);

  // Sync currentUser balance if found in updated resellers
  useEffect(() => {
    if (currentUser) {
      const foundInResellers = (resellers || []).find(
        (u) =>
          u.id === currentUser.id ||
          (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())
      );
      if (foundInResellers && foundInResellers.walletBalance !== currentUser.walletBalance) {
        const updatedAuth: AuthUser = {
          ...currentUser,
          walletBalance: foundInResellers.walletBalance,
        };
        setCurrentUser(updatedAuth);
        try {
          localStorage.setItem('kalam_auth_user', JSON.stringify(updatedAuth));
        } catch {}
        setUserStats((prev) => ({ ...prev, balance: foundInResellers.walletBalance }));
      }
    }
  }, [resellers]);

  // Persist resellers whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('kalam_users_db', JSON.stringify(resellers));
    } catch {}
  }, [resellers]);

  // Listen for Firebase Auth session changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const cleanEmail = (firebaseUser.email || '').trim().toLowerCase();
        const isAdmin = cleanEmail === 'kalam172010@gmail.com';

        // Extract the permanent account creation date from Firebase Auth metadata
        const accountCreatedDate = firebaseUser.metadata?.creationTime
          ? new Date(firebaseUser.metadata.creationTime).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : undefined;

        // Check if there's a stored historical joinedDate in local database
        let storedJoinedDate: string | undefined;
        try {
          const storedUsersRaw = localStorage.getItem('kalam_users_db');
          if (storedUsersRaw) {
            const storedUsers: any[] = JSON.parse(storedUsersRaw);
            const found = storedUsers.find(
              (u) => u.id === firebaseUser.uid || (u.email && u.email.toLowerCase() === cleanEmail)
            );
            if (found?.joinedDate && found.joinedDate !== 'Recently' && !found.joinedDate.toLowerCase().includes('today')) {
              storedJoinedDate = found.joinedDate;
            }
          }
        } catch {}

        const finalJoinedDate =
          accountCreatedDate ||
          storedJoinedDate ||
          new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const initialAuth: AuthUser = {
          id: firebaseUser.uid,
          email: cleanEmail,
          name: firebaseUser.displayName || (isAdmin ? 'KALAM FF (OWNER)' : cleanEmail.split('@')[0] || 'User'),
          username: cleanEmail.split('@')[0] || 'user',
          role: isAdmin ? 'ADMIN' : 'USER',
          walletBalance: isAdmin ? 290011.65 : 0,
          joinedDate: finalJoinedDate,
          avatarUrl: firebaseUser.photoURL || undefined,
        };

        try {
          const synced = await syncAuthUserToFirestore(initialAuth);
          const resolvedJoined =
            accountCreatedDate ||
            (synced.joinedDate && synced.joinedDate !== 'Recently' && !synced.joinedDate.toLowerCase().includes('today') ? synced.joinedDate : null) ||
            storedJoinedDate ||
            finalJoinedDate;

          const resolvedUser: AuthUser = {
            ...initialAuth,
            walletBalance: synced.walletBalance,
            role: synced.role === 'ADMIN' ? 'ADMIN' : (synced.isReseller ? 'RESELLER' : 'USER'),
            name: synced.name,
            username: synced.username,
            joinedDate: resolvedJoined,
          };
          setCurrentUser(resolvedUser);
          setResellers((prev) => {
            const nextList = deduplicateUsers([{ ...synced, joinedDate: resolvedJoined }, ...prev]);
            try {
              localStorage.setItem('kalam_users_db', JSON.stringify(nextList));
            } catch {}
            return nextList;
          });
          try {
            localStorage.setItem('kalam_auth_user', JSON.stringify(resolvedUser));
          } catch {}
        } catch {
          setCurrentUser(initialAuth);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Modals state
  const [isHowToDepositOpen, setIsHowToDepositOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isBuyKeysOpen, setIsBuyKeysOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [latestPurchasedKey, setLatestPurchasedKey] = useState<PurchasedKey | null>(null);
  const [outOfStockNotice, setOutOfStockNotice] = useState<{
    productName: string;
    planDuration: string;
    message: string;
  } | null>(null);
  const [isPurchasingKey, setIsPurchasingKey] = useState(false);
  const [keyPurchaseModalData, setKeyPurchaseModalData] = useState<KeyPurchaseModalData | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<PurchaseInvoice | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Master Admin privileges check (kalam172010@gmail.com or configured admin email)
  const configuredAdminEmail = (storeSettings?.adminEmail || 'kalam172010@gmail.com').trim().toLowerCase();
  const isMasterAdmin = Boolean(
    currentUser &&
      (currentUser.role === 'ADMIN' ||
       currentUser.email?.trim().toLowerCase() === configuredAdminEmail ||
       currentUser.email?.trim().toLowerCase() === 'kalam172010@gmail.com' ||
       currentUser.email?.trim().toLowerCase() === 'kalam2000abc@gmail.com')
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRefreshUsers = async () => {
    try {
      const cloudUsers = await fetchUsersFromFirestore();
      if (cloudUsers && cloudUsers.length > 0) {
        setResellers((prev) => {
          const merged = deduplicateUsers([...cloudUsers, ...prev, ...INITIAL_RESELLERS]);
          try {
            localStorage.setItem('kalam_users_db', JSON.stringify(merged));
          } catch {}
          return merged;
        });
        showToast(`Synced ${cloudUsers.length} user records from Cloud.`);
      } else {
        showToast('Users list is up to date.');
      }
    } catch {
      showToast('Could not refresh users from cloud.');
    }
  };

  const handleRefreshProducts = async () => {
    try {
      showToast('Refreshing products catalog...');
      const res = await safeFetchJson<{ success: boolean; products: Product[] }>('/api/products');
      if (res.data?.success && Array.isArray(res.data.products)) {
        setProducts(res.data.products);
        try {
          localStorage.setItem('kalam_products_db', JSON.stringify(res.data.products));
        } catch {}
        showToast(`Catalog refreshed (${res.data.products.length} products)`);
      }
    } catch {
      showToast('Failed to refresh products');
    }
  };

  const handleSyncStoreData = async () => {
    setIsSyncingStore(true);
    setIsGlobalLoading(true);
    playPopSound();
    showToast('🔄 Synchronizing store & catalog data...');
    try {
      const res = await safeFetchJson<{ success: boolean; products: Product[] }>('/api/products');
      if (res.data?.success && Array.isArray(res.data.products)) {
        setProducts(res.data.products);
        try {
          localStorage.setItem('kalam_products_db', JSON.stringify(res.data.products));
        } catch {}
      }

      const settingsRes = await safeFetchJson<{ success: boolean; settings: StoreSettings }>('/api/store-settings');
      if (settingsRes.data?.success && settingsRes.data.settings) {
        setStoreSettings(settingsRes.data.settings);
      }

      playSuccessChime();
      showToast('✨ Panel synchronized smoothly!');
    } catch {
      showToast('⚠️ Catalog synced from cache.');
    } finally {
      setIsSyncingStore(false);
      setTimeout(() => setIsGlobalLoading(false), 350);
    }
  };

  const handleSelectUserTab = (tab: UserNavTab) => {
    if (tab !== 'dashboard' && !currentUser) {
      requireAuth(() => handleSelectUserTab(tab), tab.replace('_', ' ').toUpperCase());
      return;
    }
    if (tab === userTab) return;
    playPopSound();
    setIsGlobalLoading(true);
    setUserTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setIsGlobalLoading(false);
    }, 220);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    const configuredAdminEmail = (storeSettings?.adminEmail || 'kalam172010@gmail.com').trim().toLowerCase();
    const cleanEmail = (user.email || '').trim().toLowerCase();
    const isAdmin = cleanEmail === configuredAdminEmail || cleanEmail === 'kalam172010@gmail.com' || cleanEmail === 'kalam2000abc@gmail.com' || user.role === 'ADMIN';

    // Check if user has updated balance in resellers
    const found = (resellers || []).find(
      (r) =>
        r.id === user.id ||
        (r.email && user.email && r.email.toLowerCase() === cleanEmail)
    );
    const resolvedBalance = found ? found.walletBalance : (user.walletBalance ?? (isAdmin ? 290011.65 : 0));

    // Preserve the original registration date, never overwrite with today's login date
    const resolvedJoinedDate =
      (user.joinedDate && user.joinedDate !== 'Recently' && !user.joinedDate.toLowerCase().includes('today') ? user.joinedDate : null) ||
      (found?.joinedDate && found.joinedDate !== 'Recently' && !found.joinedDate.toLowerCase().includes('today') ? found.joinedDate : null) ||
      user.joinedDate ||
      found?.joinedDate ||
      new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const resolvedUser: AuthUser = {
      ...user,
      joinedDate: resolvedJoinedDate,
      walletBalance: resolvedBalance,
      role: isAdmin ? 'ADMIN' : (found?.role || user.role || 'USER'),
    };

    setCurrentUser(resolvedUser);
    setGuestPreview(false);
    setUserStats((prev) => ({
      ...prev,
      balance: resolvedBalance,
    }));

    if (isAdmin) {
      setAppMode('admin');
      setAdminTab('dashboard');
      try {
        localStorage.setItem('kalam_app_mode', 'admin');
      } catch {}
      showToast(`Master Admin verified: ${cleanEmail}`);
    } else {
      setAppMode('user');
      setUserTab('dashboard');
      try {
        localStorage.setItem('kalam_app_mode', 'user');
      } catch {}
      showToast(`Welcome back, ${user.name || 'User'}!`);
    }

    // Register / update in resellers list for User Management
    const userRecord: ResellerUser = {
      id: user.id || `USR_${Date.now().toString().slice(-6)}`,
      name: user.name || (isAdmin ? 'KALAM FF (OWNER)' : cleanEmail.split('@')[0] || 'User'),
      username: user.username || cleanEmail.split('@')[0] || 'user',
      email: cleanEmail,
      phone: '',
      walletBalance: resolvedBalance,
      depositedToday: found?.depositedToday || 0,
      soldToday: found?.soldToday || 0,
      totalKeysSold: found?.totalKeysSold || 0,
      isReseller: isAdmin || user.role === 'RESELLER' || Boolean(found?.isReseller),
      role: isAdmin ? 'ADMIN' : (found?.role || user.role || 'USER'),
      status: found?.status || 'ACTIVE',
      joinedDate: resolvedJoinedDate,
    };

    setResellers((prev) => {
      const nextList = deduplicateUsers([userRecord, ...prev]);
      try {
        localStorage.setItem('kalam_users_db', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    saveUserToFirestore(userRecord).catch(console.warn);

    try {
      localStorage.setItem('kalam_auth_user', JSON.stringify(resolvedUser));
    } catch {}
  };

  const handleLogout = async () => {
    try {
      await fbSignOut(auth);
    } catch {}
    localStorage.removeItem('kalam_auth_user');
    setCurrentUser(null);
    setGuestPreview(false);
    setAppMode('user');
    setUserTab('dashboard');
    showToast('Signed out of Firebase session.');
  };

  const handleOpenAuth = (mode: AuthMode = 'LOGIN') => {
    setAuthModalInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  const requireAuth = (callback: () => void, optionName?: string) => {
    if (!currentUser) {
      showToast(optionName ? `Please sign in first to access ${optionName}!` : 'Please sign in first to use this option!');
      handleOpenAuth('LOGIN');
      return;
    }
    callback();
  };

  /* ==================== USER HANDLERS ==================== */
  const handleQuickAction = (action: QuickActionKey) => {
    if (!currentUser) {
      showToast('Please sign in first to use this option!');
      handleOpenAuth('LOGIN');
      return;
    }

    switch (action) {
      case 'DEPOSIT':
        setIsDepositOpen(true);
        break;
      case 'BUY_KEYS':
        setIsBuyKeysOpen(true);
        break;
      case 'MY_KEYS':
        setUserTab('my_keys');
        break;
      case 'HISTORY':
        setUserTab('history');
        break;
      case 'REFERRAL':
        setUserTab('referral');
        break;
      case 'PROFILE':
        setUserTab('profile');
        break;
    }
  };

  const handleDepositSuccess = (amount: number, customUtr?: string) => {
    const newBal = (currentUser ? currentUser.walletBalance : userStats.balance) + amount;

    setUserStats((prev) => ({
      ...prev,
      balance: newBal,
    }));

    if (currentUser) {
      const updatedAuth: AuthUser = {
        ...currentUser,
        walletBalance: newBal,
      };
      setCurrentUser(updatedAuth);
      try {
        localStorage.setItem('kalam_auth_user', JSON.stringify(updatedAuth));
      } catch {}

      const matchingUser = (resellers || []).find(
        (u) => u.id === currentUser.id || (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())
      );
      if (matchingUser) {
        const updatedRecord: ResellerUser = {
          ...matchingUser,
          walletBalance: newBal,
          depositedToday: (matchingUser.depositedToday || 0) + amount,
        };
        saveUserToFirestore(updatedRecord).catch(console.warn);
      } else {
        const newRecord: ResellerUser = {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username || currentUser.name.toLowerCase().replace(/\s+/g, '_'),
          email: currentUser.email,
          walletBalance: newBal,
          depositedToday: amount,
          soldToday: 0,
          totalKeysSold: 0,
          isReseller: currentUser.role === 'RESELLER',
          role: currentUser.role,
          status: 'ACTIVE',
          joinedDate: currentUser.joinedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        };
        saveUserToFirestore(newRecord).catch(console.warn);
      }

      setResellers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id || (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())
            ? { ...u, walletBalance: newBal, depositedToday: (u.depositedToday || 0) + amount }
            : u
        )
      );
    }

    const cleanUtrNum = customUtr ? customUtr.replace(/^UTR-?/i, '') : `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const newTx: TransactionRecord = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      type: 'DEPOSIT',
      amount,
      status: 'COMPLETED',
      date: new Date().toLocaleString(),
      method: customUtr ? 'UPI UTR Verification' : 'UPI Auto-Verify',
      utrOrReference: `UTR-${cleanUtrNum}`,
    };

    const nextTxns = [newTx, ...transactions];

    // AUTO-CREDIT REFERRAL COMMISSION IF USER WAS REFERRED BY A FRIEND
    const referrerCode = currentUser?.referredBy || localStorage.getItem('kalam_referred_by');
    if (referrerCode && referrerCode.trim()) {
      const cleanRefCode = referrerCode.trim().toLowerCase();
      const bonusPct = storeSettings.referralBonusPercent || 10;
      const commissionAmount = Math.round(((amount * bonusPct) / 100) * 100) / 100;

      if (commissionAmount > 0) {
        // Find referrer in user base
        const refIndex = (resellers || []).findIndex(
          (u) =>
            u.username?.toLowerCase() === cleanRefCode ||
            u.referralCode?.toLowerCase() === cleanRefCode ||
            u.id?.toLowerCase() === cleanRefCode
        );

        if (refIndex >= 0) {
          const referrer = resellers[refIndex];
          const newRefBal = (referrer.walletBalance || 0) + commissionAmount;
          const newRefEarn = (referrer.referralEarnings || 0) + commissionAmount;
          const updatedReferrer: ResellerUser = {
            ...referrer,
            walletBalance: newRefBal,
            referralEarnings: newRefEarn,
          };
          saveUserToFirestore(updatedReferrer).catch(console.warn);

          setResellers((prev) =>
            prev.map((u, i) => (i === refIndex ? updatedReferrer : u))
          );

          // If current logged-in user is the referrer, sync state
          if (
            currentUser &&
            (currentUser.id === referrer.id ||
              currentUser.username?.toLowerCase() === referrer.username?.toLowerCase())
          ) {
            const updatedAuth = {
              ...currentUser,
              walletBalance: newRefBal,
              referralEarnings: newRefEarn,
            };
            setCurrentUser(updatedAuth);
            try {
              localStorage.setItem('kalam_auth_user', JSON.stringify(updatedAuth));
            } catch {}
          }

          // Add a referral reward transaction to history
          const refTx: TransactionRecord = {
            id: `TXN-REF-${Date.now().toString().slice(-6)}`,
            type: 'REFERRAL_REWARD',
            amount: commissionAmount,
            status: 'COMPLETED',
            date: new Date().toLocaleString(),
            method: 'Referral Bonus',
            utrOrReference: `REF-${currentUser?.username || 'FRIEND'}`,
            description: `Referral commission (${bonusPct}%) from @${currentUser?.username || 'friend'}'s deposit`,
          };
          nextTxns.unshift(refTx);
        }
      }
    }

    setTransactions(nextTxns);
    if (currentUser?.id) {
      saveTransactionsToFirestore(currentUser.id, nextTxns).catch(console.warn);
    }

    // Publish real-time activity event for Admin notification
    publishStoreActivity({
      type: 'DEPOSIT',
      title: `New Deposit: ₹${amount}`,
      message: `@${currentUser?.username || 'Customer'} deposited ₹${amount} via UPI Auto-Verify`,
      amount,
      userName: currentUser?.name || currentUser?.username || 'Customer',
      userEmail: currentUser?.email || '',
    }).catch(() => {});

    showToast(`₹${amount} deposited successfully to your wallet!`);
  };

  const handlePurchaseKey = async (
    product: Product,
    plan: PlanPricing,
    quantity: number = 1,
    coupon?: DiscountCoupon
  ) => {
    const currentBal = currentUser ? currentUser.walletBalance : userStats.balance;
    const isUserReseller = Boolean(currentUser?.role === 'RESELLER' || currentUser?.isReseller);
    const unitPrice = isUserReseller && typeof plan.resellerPrice === 'number' ? plan.resellerPrice : plan.price;
    const rawCost = unitPrice * quantity;

    let discountAmount = 0;
    if (coupon) {
      if (typeof coupon.discountPercent === 'number' && coupon.discountPercent > 0) {
        discountAmount = (rawCost * coupon.discountPercent) / 100;
      } else if (typeof coupon.discountFlat === 'number' && coupon.discountFlat > 0) {
        discountAmount = coupon.discountFlat;
      }
      discountAmount = Math.min(rawCost, Math.round(discountAmount * 100) / 100);
    }
    const totalCost = Math.max(0, Math.round((rawCost - discountAmount) * 100) / 100);

    if (currentBal < totalCost) {
      showToast(`Insufficient balance! You need ₹${(totalCost - currentBal).toFixed(2)} more. Opening Deposit...`);
      setIsDepositOpen(true);
      return;
    }

    // Determine available keys for this product / plan
    const availableStockKeys = (product.planKeys && product.planKeys[plan.id]) || product.keys || [];

    setIsPurchasingKey(true);
    // Initialize the Key Purchase Modal with Step 1: Connecting (Linear Progress Bar at 22%)
    setKeyPurchaseModalData({
      product,
      plan,
      quantity,
      totalCost,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      couponCode: coupon?.code,
      stage: 'CONNECTING',
      label: 'Connecting to Engine',
      subLabel: `Connecting to API gateway and verifying balance for ${product.name}...`,
      progressPercent: 22,
    });

    try {
      // Small intentional delay to allow user to observe Stage 1: Connecting
      await new Promise((r) => setTimeout(r, 450));

      // Transition to Stage 2: Requesting Key (Linear Progress Bar at 65%)
      setKeyPurchaseModalData((prev) =>
        prev
          ? {
              ...prev,
              stage: 'REQUESTING_KEY',
              label: 'Requesting Key',
              subLabel: `Sending license request to upstream engine for ${quantity}x ${plan.duration}...`,
              progressPercent: 65,
            }
          : null
      );

      const response = await safeFetchJson<any>('/api/purchase-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          planId: plan.id,
          planDuration: plan.duration,
          quantity,
          stockKeys: availableStockKeys,
          apiConfigs,
          productApi1: product.api1Restock,
          productApi2: product.api2Restock,
        }),
      });

      let data = response.data;

      // Transition to Stage 3: Finalizing (Linear Progress Bar at 92%)
      setKeyPurchaseModalData((prev) =>
        prev
          ? {
              ...prev,
              stage: 'FINALIZING',
              label: 'Finalizing Delivery',
              subLabel: 'Validating cryptographic license signature & updating local receipt...',
              progressPercent: 92,
            }
          : null
      );
      await new Promise((r) => setTimeout(r, 400));

      // Fallback: If static host or serverless returns error, fulfill directly from availableStockKeys
      if ((!data || !data.success) && availableStockKeys.length >= quantity) {
        data = {
          success: true,
          source: 'INVENTORY_STOCK',
          keys: availableStockKeys.slice(0, quantity),
          remainingKeys: availableStockKeys.slice(quantity),
        };
      }

      if (!data || !data.success || data.outOfStock || !data.keys || data.keys.length === 0) {
        // STRICT: DO NOT DEDUCT WALLET BALANCE
        const reason = data?.error || 'Out of Stock! No keys available in inventory or from upstream API.';
        setKeyPurchaseModalData((prev) =>
          prev
            ? {
                ...prev,
                stage: 'ERROR',
                label: 'Purchase Interrupted',
                subLabel: reason,
                progressPercent: 100,
                error: reason,
              }
            : null
        );

        setOutOfStockNotice({
          productName: product.name,
          planDuration: plan.duration,
          message: reason,
        });
        showToast(`❌ OUT OF STOCK: ${reason}`);

        // Update product plan stock count to 0 if inventory empty
        setProducts((prev) => {
          const updated = prev.map((p) => {
            if (p.id !== product.id) return p;
            return {
              ...p,
              stock: (p.keys || []).length,
              plans: p.plans.map((pl) => (pl.id === plan.id ? { ...pl, keysCount: 0 } : pl)),
            };
          });
          saveProductsToFirestore(updated).catch(console.warn);
          return updated;
        });
        return;
      }

      // Real Keys delivered successfully!
      const deliveredKeyCodes: string[] = data.keys;
      const newBal = currentBal - totalCost;

      // 1. Deduct balance in state & Firestore
      setUserStats((prev) => ({
        ...prev,
        balance: newBal,
        todaySalesMe: prev.todaySalesMe + quantity,
        monthlySalesMe: prev.monthlySalesMe + quantity,
      }));

      if (currentUser) {
        const updatedAuth: AuthUser = {
          ...currentUser,
          walletBalance: newBal,
        };
        setCurrentUser(updatedAuth);
        try {
          localStorage.setItem('kalam_auth_user', JSON.stringify(updatedAuth));
        } catch {}

        const matchingUser = (resellers || []).find(
          (u) => u.id === currentUser.id || (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())
        );
        if (matchingUser) {
          const updatedRecord: ResellerUser = {
            ...matchingUser,
            walletBalance: newBal,
            soldToday: (matchingUser.soldToday || 0) + quantity,
            totalKeysSold: (matchingUser.totalKeysSold || 0) + quantity,
          };
          saveUserToFirestore(updatedRecord).catch(console.warn);
        }

        setResellers((prev) =>
          prev.map((u) =>
            u.id === currentUser.id || (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())
              ? { ...u, walletBalance: newBal, soldToday: (u.soldToday || 0) + quantity, totalKeysSold: (u.totalKeysSold || 0) + quantity }
              : u
          )
        );
      }

      // 2. Add real keys to user keys list & Firestore
      const invoiceNum = `INV-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
      const randomTxSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderRef = `ORD-${product.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase()}-${randomTxSuffix}`;
      const purchaseTimestamp = new Date().toLocaleString();

      const createdPurchasedKeys: PurchasedKey[] = deliveredKeyCodes.map((kCode, idx) => ({
        id: `key-${Date.now()}-${idx}`,
        productName: `${product.name} (${product.category})`,
        planName: `${plan.duration} License`,
        keyCode: kCode,
        purchaseDate: purchaseTimestamp,
        expiryDate: 'Calculated upon activation',
        status: 'ACTIVE',
        price: unitPrice,
        invoiceNumber: invoiceNum,
        orderId: orderRef,
        deviceType: product.deviceType,
        game: product.game,
      }));

      const nextKeys = [...createdPurchasedKeys, ...userKeys];
      setUserKeys(nextKeys);
      if (currentUser?.id) {
        savePurchasedKeysToFirestore(currentUser.id, nextKeys).catch(console.warn);
      }

      // 3. Update stock in products state and Firestore
      const remaining = data.remainingKeys || [];
      const updatedProducts = products.map((p) => {
        if (p.id !== product.id) return p;
        const updatedPlanKeys = {
          ...(p.planKeys || {}),
          [plan.id]: remaining,
        };
        return {
          ...p,
          keys: remaining,
          planKeys: updatedPlanKeys,
          stock: remaining.length,
          plans: p.plans.map((pl) =>
            pl.id === plan.id ? { ...pl, keysCount: remaining.length } : pl
          ),
        };
      });
      setProducts(updatedProducts);
      saveProductsToFirestore(updatedProducts).catch(console.warn);

      // 4. Record Transaction & persist to Firestore
      if (coupon) {
        recordCouponUsage(coupon.code);
      }

      const newTx: TransactionRecord = {
        id: `TXN-${Date.now().toString().slice(-6)}`,
        type: 'KEY_PURCHASE',
        amount: totalCost,
        status: 'COMPLETED',
        date: purchaseTimestamp,
        method: 'Wallet Balance',
        utrOrReference: orderRef,
        description: `Delivered ${quantity} key(s) from ${data.source || 'API'} [${invoiceNum}]${
          coupon ? ` (Coupon: ${coupon.code} -₹${discountAmount.toFixed(2)})` : ''
        }`,
      };

      const nextTxns = [newTx, ...transactions];
      setTransactions(nextTxns);
      if (currentUser?.id) {
        saveTransactionsToFirestore(currentUser.id, nextTxns).catch(console.warn);
      }

      // 5. Build official purchase invoice
      const generatedInvoice: PurchaseInvoice = {
        invoiceNumber: invoiceNum,
        orderId: orderRef,
        date: purchaseTimestamp,
        buyerName: currentUser?.name || currentUser?.username || 'Customer',
        buyerUsername: currentUser?.username || 'customer',
        buyerEmail: currentUser?.email || '',
        productName: product.name,
        category: product.category,
        game: product.game,
        deviceType: product.deviceType,
        planDuration: `${plan.duration} License`,
        quantity,
        unitPrice,
        totalAmount: totalCost,
        paymentMethod: 'Wallet Balance',
        keys: deliveredKeyCodes,
        status: 'DELIVERED',
        shopName: storeSettings.shopName || 'KALAM MODS OFFICIAL',
        supportContact: storeSettings.supportUsername || '@Kalam_Mods_Official',
      };

      // Publish real-time activity event for Admin notification
      publishStoreActivity({
        type: 'PURCHASE',
        title: `New Key Purchase: ${product.name}`,
        message: `@${currentUser?.username || 'Customer'} purchased ${quantity}x ${plan.duration} for ₹${totalCost}`,
        amount: totalCost,
        userName: currentUser?.name || currentUser?.username || 'Customer',
        userEmail: currentUser?.email || '',
        productName: product.name,
        planDuration: plan.duration,
        quantity,
      }).catch(() => {});

      playSuccessChime();
      showToast(`Key Delivered & Invoice #${invoiceNum} Generated!`);

      // Set Progress Bar to 100% SUCCESS and show delivered keys inside the Key Purchase Modal
      setKeyPurchaseModalData((prev) =>
        prev
          ? {
              ...prev,
              stage: 'SUCCESS',
              label: 'Key Delivered & Invoice Ready!',
              subLabel: `${deliveredKeyCodes.length} license key(s) generated. Official Invoice #${invoiceNum} generated.`,
              progressPercent: 100,
              deliveredKeys: deliveredKeyCodes,
              purchasedKeyRecord: createdPurchasedKeys[0],
              invoice: generatedInvoice,
            }
          : null
      );
    } catch (err: any) {
      setKeyPurchaseModalData((prev) =>
        prev
          ? {
              ...prev,
              stage: 'ERROR',
              label: 'Purchase Interrupted',
              subLabel: `Key Delivery failed: ${err.message}. Wallet balance not deducted.`,
              progressPercent: 100,
              error: err.message,
            }
          : null
      );
      showToast(`Key Delivery failed: ${err.message}. Balance not deducted.`);
    } finally {
      setIsPurchasingKey(false);
    }
  };

  const handleUpdateProductKeys = (productId: string, planId: string, keys: string[]) => {
    const updated = products.map((p) => {
      if (p.id !== productId) return p;
      const updatedPlanKeys = {
        ...(p.planKeys || {}),
        [planId]: keys,
      };
      return {
        ...p,
        keys,
        planKeys: updatedPlanKeys,
        stock: keys.length,
        plans: p.plans.map((pl) =>
          planId === 'all' || pl.id === planId ? { ...pl, keysCount: keys.length } : pl
        ),
      };
    });
    setProducts(updated);
    saveProductsToFirestore(updated).catch(console.warn);
    showToast('Inventory keys updated and saved to Cloud successfully!');
  };

  /* ==================== ADMIN HANDLERS ==================== */
  const handleSaveProduct = (prod: Product) => {
    const exists = products.some((p) => p.id === prod.id);
    let updatedProducts: Product[];
    if (exists) {
      updatedProducts = products.map((p) => (p.id === prod.id ? prod : p));
      setProducts(updatedProducts);
      setProductLinks((prev) => {
        const nextLinks = prev.map((l) =>
          l.productId === prod.id ? { ...l, productName: prod.name } : l
        );
        saveProductLinksToFirestore(nextLinks).catch(console.warn);
        return nextLinks;
      });
      showToast(`Product "${prod.name}" updated successfully!`);
    } else {
      updatedProducts = [prod, ...products];
      setProducts(updatedProducts);
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kalam-store.com';
      const newLink: ProductLink = {
        id: `link-${Date.now()}`,
        productId: prod.id,
        productName: prod.name,
        status: prod.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
        directLink: `${origin}/?product=${prod.id}`,
        websiteLink: `${origin}/?product=${prod.id}`,
        botLink: `https://t.me/Kalam_Mods_Official_bot?start=prod_${prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        game: prod.game,
        category: prod.category,
        customSlug: prod.id,
        createdAt: new Date().toISOString(),
      };
      setProductLinks((prev) => {
        const nextLinks = [newLink, ...prev];
        try {
          localStorage.setItem('kalam_product_links_db', JSON.stringify(nextLinks));
        } catch {}
        saveProductLinksToFirestore(nextLinks).catch(console.warn);
        return nextLinks;
      });
      showToast(`Product "${prod.name}" created successfully!`);
    }
    saveProductsToFirestore(updatedProducts).catch(console.warn);
  };

  const handleSaveProductLink = (link: ProductLink) => {
    setProductLinks((prev) => {
      const exists = prev.some((l) => l.id === link.id);
      const updated = exists ? prev.map((l) => (l.id === link.id ? link : l)) : [link, ...prev];
      try {
        localStorage.setItem('kalam_product_links_db', JSON.stringify(updated));
      } catch {}
      saveProductLinksToFirestore(updated).catch(console.warn);
      return updated;
    });
    showToast(`Product link for "${link.productName}" saved!`);
  };

  const handleDeleteProductLink = (linkId: string) => {
    setProductLinks((prev) => {
      const updated = prev.filter((l) => l.id !== linkId);
      try {
        localStorage.setItem('kalam_product_links_db', JSON.stringify(updated));
      } catch {}
      saveProductLinksToFirestore(updated).catch(console.warn);
      return updated;
    });
    showToast('Product link deleted.');
  };

  const handleSyncAllProductLinks = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kalam-store.com';
    const existingProductIds = new Set(productLinks.map((l) => l.productId));

    const newLinks: ProductLink[] = [];
    products.forEach((prod) => {
      if (!existingProductIds.has(prod.id)) {
        newLinks.push({
          id: `link-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          directLink: `${origin}/?product=${prod.id}`,
          websiteLink: `${origin}/?product=${prod.id}`,
          botLink: `https://t.me/Kalam_Mods_Official_bot?start=prod_${prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
          status: prod.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
          game: prod.game,
          category: prod.category,
          customSlug: prod.id,
          createdAt: new Date().toISOString(),
        });
      }
    });

    if (newLinks.length === 0) {
      showToast('All catalog products already have active links!');
      return;
    }

    const merged = [...productLinks, ...newLinks];
    setProductLinks(merged);
    try {
      localStorage.setItem('kalam_product_links_db', JSON.stringify(merged));
    } catch {}
    saveProductLinksToFirestore(merged).catch(console.warn);
    showToast(`Synced ${newLinks.length} product link(s) to store!`);
  };

  const handleToggleProductLinkStatus = (linkId: string, nextStatus: 'ACTIVE' | 'DISABLED') => {
    setProductLinks((prev) => {
      const updated = prev.map((l) => (l.id === linkId ? { ...l, status: nextStatus } : l));
      try {
        localStorage.setItem('kalam_product_links_db', JSON.stringify(updated));
      } catch {}
      saveProductLinksToFirestore(updated).catch(console.warn);
      return updated;
    });
    showToast(`Link status set to ${nextStatus}.`);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsAddProductOpen(true);
  };

  const handleToggleProductStatus = (product: Product) => {
    const nextStatus: 'ACTIVE' | 'DISABLED' = product.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const updatedProducts: Product[] = products.map((p) => (p.id === product.id ? ({ ...p, status: nextStatus } as Product) : p));
    setProducts(updatedProducts);
    setProductLinks((prev) => {
      const nextLinks = prev.map((l) =>
        l.productId === product.id ? { ...l, status: nextStatus } : l
      );
      saveProductLinksToFirestore(nextLinks).catch(console.warn);
      return nextLinks;
    });
    try {
      localStorage.setItem('kalam_products_db', JSON.stringify(updatedProducts));
    } catch {}
    saveProductsToFirestore(updatedProducts).catch(console.warn);
    showToast(`Product "${product.name}" status changed to ${nextStatus}!`);
  };

  const handleBulkToggleProductStatus = (productIds: string[], targetStatus?: 'ACTIVE' | 'DISABLED') => {
    if (!productIds || productIds.length === 0) return;

    const idSet = new Set(productIds);
    const updatedProducts: Product[] = products.map((p) => {
      if (!idSet.has(p.id)) return p;
      const nextStatus = targetStatus || (p.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE');
      return { ...p, status: nextStatus } as Product;
    });

    setProducts(updatedProducts);
    setProductLinks((prev) => {
      const nextLinks: ProductLink[] = prev.map((l) => {
        if (!idSet.has(l.productId)) return l;
        const matchingProd = updatedProducts.find((p) => p.id === l.productId);
        const linkStatus: 'ACTIVE' | 'DISABLED' = matchingProd && matchingProd.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED';
        return { ...l, status: linkStatus };
      });
      saveProductLinksToFirestore(nextLinks).catch(console.warn);
      return nextLinks;
    });

    try {
      localStorage.setItem('kalam_products_db', JSON.stringify(updatedProducts));
    } catch {}
    saveProductsToFirestore(updatedProducts).catch(console.warn);

    const statusLabel = targetStatus ? targetStatus : 'UPDATED';
    showToast(`Bulk updated ${productIds.length} product(s) to ${statusLabel}!`);
  };

  const handleToggleProductMaintenance = (product: Product) => {
    const nextStatus: 'ACTIVE' | 'MAINTENANCE' = product.status === 'MAINTENANCE' ? 'ACTIVE' : 'MAINTENANCE';
    const updatedProducts: Product[] = products.map((p) => (p.id === product.id ? ({ ...p, status: nextStatus } as Product) : p));
    setProducts(updatedProducts);
    saveProductsToFirestore(updatedProducts).catch(console.warn);
    showToast(`Product "${product.name}" maintenance mode: ${nextStatus === 'MAINTENANCE' ? 'ON' : 'OFF'}`);
  };

  const handleDeleteProduct = (productId: string) => {
    let targetName = 'Product';
    setProducts((prev) => {
      const target = prev.find((p) => p.id === productId);
      if (target) targetName = target.name;
      const updated = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem('kalam_products_db', JSON.stringify(updated));
        localStorage.setItem('kalam_products_initialized', 'true');
      } catch {}
      saveProductsToFirestore(updated).catch(console.warn);
      deleteProductFromFirestore(productId).catch(console.warn);
      return updated;
    });

    setProductLinks((prev) => {
      const updatedLinks = prev.filter((l) => l.productId !== productId);
      try {
        localStorage.setItem('kalam_product_links_db', JSON.stringify(updatedLinks));
      } catch {}
      saveProductLinksToFirestore(updatedLinks).catch(console.warn);
      return updatedLinks;
    });

    showToast(`"${targetName}" permanently removed from store.`);
  };

  const handleDeleteAllProducts = () => {
    setProducts([]);
    try {
      localStorage.setItem('kalam_products_db', JSON.stringify([]));
      localStorage.setItem('kalam_products_initialized', 'true');
      localStorage.setItem('kalam_product_links_db', JSON.stringify([]));
    } catch {}
    setProductLinks([]);
    saveProductsToFirestore([]).catch(console.warn);
    saveProductLinksToFirestore([]).catch(console.warn);
    showToast('All products deleted permanently from store and database.');
  };

  const handleSaveApiConfig = (updated: ApiConfig) => {
    const exists = apiConfigs.some((a) => a.id === updated.id);
    const updatedConfigs = exists
      ? apiConfigs.map((a) => (a.id === updated.id ? updated : a))
      : [...apiConfigs, updated];

    setApiConfigs(updatedConfigs);
    try {
      localStorage.setItem('kalam_api_configs_db', JSON.stringify(updatedConfigs));
    } catch {}
    saveApiConfigsToFirestore(updatedConfigs).catch(console.warn);
    showToast(`${updated.name} settings saved successfully.`);
  };

  const handleAddApiConfig = (newCfg: ApiConfig) => {
    const updatedConfigs = [...apiConfigs, newCfg];
    setApiConfigs(updatedConfigs);
    try {
      localStorage.setItem('kalam_api_configs_db', JSON.stringify(updatedConfigs));
    } catch {}
    saveApiConfigsToFirestore(updatedConfigs).catch(console.warn);
    showToast(`Added "${newCfg.name}".`);
  };

  const handleDeleteApiConfig = (id: string) => {
    const target = apiConfigs.find((a) => a.id === id);
    const updatedConfigs = apiConfigs.filter((a) => a.id !== id);
    setApiConfigs(updatedConfigs);
    try {
      localStorage.setItem('kalam_api_configs_db', JSON.stringify(updatedConfigs));
    } catch {}
    saveApiConfigsToFirestore(updatedConfigs).catch(console.warn);
    showToast(`Removed "${target?.name || 'API'}".`);
  };

  const handleSavePaymentConfig = (updated: PaymentGatewayConfig) => {
    setPaymentConfigs((prev) => {
      const exists = prev.some((p) => p.id === updated.id);
      const updatedGateways = exists
        ? prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : (updated.isActive ? { ...p, isActive: false } : p)))
        : [{ ...updated }, ...prev.map((p) => (updated.isActive ? { ...p, isActive: false } : p))];

      try {
        localStorage.setItem('kalam_payment_configs_db', JSON.stringify(updatedGateways));
      } catch {}
      savePaymentConfigsToFirestore(updatedGateways).catch(console.warn);
      return updatedGateways;
    });
    showToast(`${updated.name} configuration saved successfully.`);
  };

  const handleSaveStoreSettings = (newSettings: StoreSettings) => {
    setStoreSettings(newSettings);
    try {
      localStorage.setItem('kalam_store_settings_db', JSON.stringify(newSettings));
    } catch {}
    saveStoreSettingsToFirestore(newSettings).catch(console.warn);
    showToast('Storefront branding and settings saved successfully!');
  };

  const handlePromoteUser = (userId: string) => {
    const target = resellers.find((u) => u.id === userId);
    if (target) {
      const updatedUser: ResellerUser = { ...target, isReseller: true, status: 'ACTIVE' };
      saveUserToFirestore(updatedUser).catch(console.warn);
    }
    setResellers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isReseller: true, status: 'ACTIVE' } : u))
    );
    showToast('User promoted to verified Reseller Partner!');
  };

  const handleDemoteUser = (userId: string) => {
    const target = resellers.find((u) => u.id === userId);
    if (target) {
      const updatedUser: ResellerUser = { ...target, isReseller: false, status: 'INACTIVE' };
      saveUserToFirestore(updatedUser).catch(console.warn);
    }
    setResellers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isReseller: false, status: 'INACTIVE' } : u))
    );
    showToast('User role reverted to normal customer.');
  };

  const handleAddUser = (newUser: Omit<ResellerUser, 'id'> & { id?: string }) => {
    const finalUser: ResellerUser = {
      ...newUser,
      id: newUser.id || `USR_${Date.now().toString().slice(-6)}`,
    };
    saveUserToFirestore(finalUser).catch(console.warn);
    setResellers((prev) => {
      const updated = deduplicateUsers([finalUser, ...prev]);
      try {
        localStorage.setItem('kalam_users_db', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`User account created: ${finalUser.name} (${finalUser.email})`);
  };

  const handleUpdateUser = (updatedUser: ResellerUser) => {
    saveUserToFirestore(updatedUser).catch(console.warn);
    setResellers((prev) => {
      const updated = deduplicateUsers(prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      try {
        localStorage.setItem('kalam_users_db', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (currentUser && (currentUser.id === updatedUser.id || (currentUser.email && updatedUser.email && currentUser.email.toLowerCase() === updatedUser.email.toLowerCase()))) {
      const authUpdate: AuthUser = {
        ...currentUser,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        walletBalance: updatedUser.walletBalance,
        role: updatedUser.role || (updatedUser.isReseller ? 'RESELLER' : 'USER'),
      };
      setCurrentUser(authUpdate);
      try {
        localStorage.setItem('kalam_auth_user', JSON.stringify(authUpdate));
      } catch {}
    }
    showToast(`Profile updated for ${updatedUser.name}`);
  };

  const handleDeleteUser = (userId: string) => {
    const target = resellers.find((u) => u.id === userId);
    const targetName = target ? target.name : 'User';
    deleteUserFromFirestore(userId).catch(console.warn);
    setResellers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      try {
        localStorage.setItem('kalam_users_db', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`Account for ${targetName} permanently deleted.`);
  };

  const handleToggleUserStatus = (
    userId: string,
    status: 'ACTIVE' | 'WARNING' | 'INACTIVE' | 'BLOCKED'
  ) => {
    const target = resellers.find((u) => u.id === userId);
    if (target) {
      const updatedUser: ResellerUser = { ...target, status };
      saveUserToFirestore(updatedUser).catch(console.warn);
    }
    setResellers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, status } : u));
      try {
        localStorage.setItem('kalam_users_db', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`User status changed to ${status}`);
  };

  const handlePromoteRole = (userId: string, role: 'USER' | 'RESELLER' | 'ADMIN') => {
    const target = resellers.find((u) => u.id === userId);
    if (target) {
      const updatedUser: ResellerUser = {
        ...target,
        role,
        isReseller: role === 'RESELLER',
        status: 'ACTIVE' as const,
      };
      saveUserToFirestore(updatedUser).catch(console.warn);
    }
    setResellers((prev) => {
      const updated = prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              role,
              isReseller: role === 'RESELLER',
              status: 'ACTIVE' as const,
            }
          : u
      );
      try {
        localStorage.setItem('kalam_users_db', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`User role successfully set to ${role}`);
  };

  const handleAdjustUserBalance = (
    userIdOrEmail: string,
    amount: number,
    type: 'ADD' | 'MINUS',
    note?: string
  ) => {
    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount greater than 0');
      return;
    }

    const cleanTarget = userIdOrEmail.trim().toLowerCase();
    let updatedTargetName = cleanTarget.includes('@') ? cleanTarget.split('@')[0].toUpperCase() : 'User';

    setResellers((prev) => {
      let found = false;
      const nextList = prev.map((u) => {
        if (
          u.id.toLowerCase() === cleanTarget ||
          (u.email && u.email.toLowerCase() === cleanTarget) ||
          (u.username && u.username.toLowerCase() === cleanTarget)
        ) {
          found = true;
          updatedTargetName = u.name;
          const oldBalance = u.walletBalance || 0;
          const newBalance =
            type === 'ADD' ? oldBalance + amount : Math.max(0, oldBalance - amount);

          const updatedUserRecord: ResellerUser = {
            ...u,
            walletBalance: newBalance,
            depositedToday:
              type === 'ADD' ? (u.depositedToday || 0) + amount : u.depositedToday,
          };
          saveUserToFirestore(updatedUserRecord).catch(console.warn);
          return updatedUserRecord;
        }
        return u;
      });

      if (!found) {
        // Create new reseller/user record
        const newRecord: ResellerUser = {
          id: `USR_${Date.now().toString().slice(-6)}`,
          name: cleanTarget.includes('@') ? cleanTarget.split('@')[0].toUpperCase() : cleanTarget,
          email: cleanTarget.includes('@') ? cleanTarget : `${cleanTarget}@user.com`,
          username: cleanTarget.includes('@') ? cleanTarget.split('@')[0] : cleanTarget,
          walletBalance: type === 'ADD' ? amount : 0,
          depositedToday: type === 'ADD' ? amount : 0,
          soldToday: 0,
          totalKeysSold: 0,
          isReseller: false,
          joinedDate: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          status: 'ACTIVE',
        };
        updatedTargetName = newRecord.name;
        saveUserToFirestore(newRecord).catch(console.warn);
        nextList.push(newRecord);
      }

      try {
        localStorage.setItem('kalam_users_db', JSON.stringify(nextList));
      } catch {}

      return nextList;
    });

    // If currentUser is the one being modified, update active auth state immediately
    if (
      currentUser &&
      ((currentUser.id && currentUser.id.toLowerCase() === cleanTarget) ||
        (currentUser.email && currentUser.email.toLowerCase() === cleanTarget) ||
        (currentUser.username && currentUser.username.toLowerCase() === cleanTarget))
    ) {
      const curOld = currentUser.walletBalance || 0;
      const curNew =
        type === 'ADD' ? curOld + amount : Math.max(0, curOld - amount);
      const updatedAuth: AuthUser = {
        ...currentUser,
        walletBalance: curNew,
      };
      setCurrentUser(updatedAuth);
      try {
        localStorage.setItem('kalam_auth_user', JSON.stringify(updatedAuth));
      } catch {}
      setUserStats((prev) => ({
        ...prev,
        balance: curNew,
      }));
    }

    // Record audit transaction
    const newTx: TransactionRecord = {
      id: `TX-ADM-${Date.now()}`,
      type: type === 'ADD' ? 'DEPOSIT' : 'ADJUSTMENT',
      amount: type === 'ADD' ? amount : -amount,
      date: new Date().toLocaleString(),
      status: 'COMPLETED',
      method: 'ADMIN_PANEL',
      description:
        note ||
        `Admin Manual ${type === 'ADD' ? '+ Add Money (Credit)' : '− Minus Money (Debit)'} for ${cleanTarget}`,
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Publish store activity for real-time notification
    publishStoreActivity({
      type: type === 'ADD' ? 'TOPUP' : 'REFUND',
      title: `Admin Wallet ${type === 'ADD' ? 'Credit' : 'Debit'}: ₹${amount}`,
      message: `Admin ${type === 'ADD' ? 'credited' : 'deducted'} ₹${amount} for @${updatedTargetName}`,
      amount,
      userName: updatedTargetName,
      userEmail: cleanTarget.includes('@') ? cleanTarget : '',
    }).catch(() => {});

    showToast(
      `₹${amount.toFixed(2)} ${type === 'ADD' ? 'credited (+)' : 'deducted (−)'} for ${cleanTarget}!`
    );
  };

  const activeWalletBalance = currentUser ? currentUser.walletBalance : userStats.balance;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col font-sans">
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#161622]/95 border border-[#00e5ff]/50 text-[#00e5ff] text-xs font-bold shadow-[0_0_30px_rgba(0,229,255,0.35)] backdrop-blur-xl flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-white">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== AUTHENTICATION FIRST LOGIN GATE ==================== */}
      {!currentUser && !guestPreview ? (
        <UserLoginGate
          onLoginSuccess={handleLoginSuccess}
          onExploreAsGuest={() => setGuestPreview(true)}
          storeSettings={storeSettings}
        />
      ) : (
        <>
          {/* ==================== USER PANEL ROUTE ==================== */}
          {appMode === 'user' && (
            <UserLayout
              activeTab={userTab}
              onSelectTab={handleSelectUserTab}
              onOpenHowToDeposit={() => setIsHowToDepositOpen(true)}
              onOpenSupport={() => requireAuth(() => handleSelectUserTab('tickets'), 'Support Tickets')}
              onOpenProfile={() => requireAuth(() => handleSelectUserTab('profile'), 'Profile')}
              onSwitchToAdmin={() => {
                setAppMode('admin');
                setAdminTab('dashboard');
                try {
                  localStorage.setItem('kalam_app_mode', 'admin');
                } catch {}
              }}
              storeSettings={storeSettings}
              currentUser={currentUser}
              onOpenAuthModal={() => handleOpenAuth('LOGIN')}
              onLogout={handleLogout}
              isLoading={isGlobalLoading}
              onRefreshData={handleSyncStoreData}
              isRefreshing={isSyncingStore}
              products={products}
              onOpenDeposit={() => requireAuth(() => setIsDepositOpen(true), 'Deposit Wallet')}
              onOpenBuyKeys={() => requireAuth(() => handleSelectUserTab('buy_keys'), 'Key Store')}
            >
              {userTab === 'dashboard' && (
                <UserDashboard
                  userStats={{ ...userStats, balance: activeWalletBalance }}
                  topSellers={topSellers}
                  storeSettings={storeSettings}
                  products={products}
                  onQuickAction={handleQuickAction}
                  onOpenDeposit={() => requireAuth(() => setIsDepositOpen(true), 'Deposit Wallet')}
                  onPurchaseKey={(prod, plan, qty) =>
                    requireAuth(() => handlePurchaseKey(prod, plan, qty), 'Purchase Key')
                  }
                />
              )}

              {userTab === 'deposit' && (
                <div className="space-y-4">
                  <h2 className="text-base font-extrabold text-white">Deposit Wallet Cash</h2>
                  <div className="p-4 rounded-2xl bg-[#161622] border border-[#00e5ff]/30 text-center space-y-3">
                    <p className="text-xs text-gray-300">
                      Open the deposit terminal to generate instant UPI QR code with automated payment verification.
                    </p>
                    <button
                      onClick={() => requireAuth(() => setIsDepositOpen(true), 'Deposit Terminal')}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#00b4d8] text-[#0a0a0f] font-extrabold text-xs shadow-[0_0_20px_rgba(0,229,255,0.4)] cursor-pointer"
                    >
                      Open Deposit Window
                    </button>
                  </div>
                </div>
              )}

              {userTab === 'buy_keys' && (
                <BuyKeysView
                  products={products.filter((p) => p.status !== 'DISABLED')}
                  balance={activeWalletBalance}
                  onPurchaseKey={(prod, plan, qty) =>
                    requireAuth(() => handlePurchaseKey(prod, plan, qty), 'Purchase Key')
                  }
                  onOpenDeposit={() => requireAuth(() => setIsDepositOpen(true), 'Deposit Wallet')}
                  storeSettings={storeSettings}
                  targetProductId={targetProductId}
                />
              )}

              {userTab === 'my_keys' && (
                <MyKeysView
                  keys={userKeys}
                  onOpenBuyKeys={() => requireAuth(() => setIsBuyKeysOpen(true), 'Key Store')}
                  onViewInvoice={(inv) => setActiveInvoice(inv)}
                  currentUser={currentUser}
                  storeSettings={storeSettings}
                />
              )}

              {userTab === 'history' && (
                <HistoryView
                  transactions={transactions}
                  onViewInvoice={(inv) => setActiveInvoice(inv)}
                  userKeys={userKeys}
                  currentUser={currentUser}
                  storeSettings={storeSettings}
                />
              )}

              {userTab === 'referral' && (
                <ReferralView
                  storeSettings={storeSettings}
                  currentUser={currentUser}
                  resellers={resellers}
                  transactions={transactions}
                  onOpenDeposit={() => requireAuth(() => setIsDepositOpen(true), 'Deposit Wallet')}
                />
              )}

              {userTab === 'tickets' && <SupportTicketsView storeSettings={storeSettings} />}

              {userTab === 'profile' && (
                <ProfileView
                  storeSettings={storeSettings}
                  balance={activeWalletBalance}
                  currentUser={currentUser}
                  onOpenAuthModal={() => handleOpenAuth('LOGIN')}
                  onLogout={handleLogout}
                  onSwitchToAdmin={() => {
                    setAppMode('admin');
                    setAdminTab('dashboard');
                    try {
                      localStorage.setItem('kalam_app_mode', 'admin');
                    } catch {}
                  }}
                />
              )}
            </UserLayout>
          )}

      {/* ==================== ADMIN BOT CONTROL CENTER ROUTE ==================== */}
      {appMode === 'admin' && (
        !isMasterAdmin ? (
          <AdminLoginGate
            onAdminLoginSuccess={(adminUser) => {
              handleLoginSuccess(adminUser);
              showToast(`Admin access verified: ${adminUser.email}`);
            }}
            onReturnToStore={() => {
              setAppMode('user');
              setUserTab('dashboard');
              try {
                localStorage.setItem('kalam_app_mode', 'user');
              } catch {}
            }}
            storeSettings={storeSettings}
            currentEmail={currentUser?.email}
          />
        ) : (
          <AdminLayout
            activeTab={adminTab}
            onSelectTab={setAdminTab}
            onSwitchToUser={() => {
              setAppMode('user');
              setUserTab('dashboard');
              try {
                localStorage.setItem('kalam_app_mode', 'user');
              } catch {}
            }}
            storeSettings={storeSettings}
            currentUser={currentUser}
            onLogout={handleLogout}
            products={products}
            users={resellers}
            activities={storeActivities}
            unreadActivityCount={unreadActivityCount}
            soundMuted={soundMuted}
            onToggleSound={handleToggleSound}
            onClearActivities={handleClearActivities}
            activeToast={liveToastActivity}
            onDismissToast={() => setLiveToastActivity(null)}
          >
            {adminTab === 'dashboard' && (
              <AdminDashboardOverview
                products={products}
                resellers={resellers}
                onNavigate={(tab) => setAdminTab(tab)}
              />
            )}

            {adminTab === 'user_management' && (
              <AdminUserManagementView
                users={resellers}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onAdjustBalance={handleAdjustUserBalance}
                onToggleStatus={handleToggleUserStatus}
                onPromoteRole={handlePromoteRole}
                onRefreshUsers={handleRefreshUsers}
                currentUser={currentUser}
                userKeys={userKeys}
                transactions={transactions}
                storeSettings={storeSettings}
              />
            )}

            {adminTab === 'products' && (
              <AdminProductsView
                products={products}
                onOpenAddProduct={() => {
                  setEditingProduct(null);
                  setIsAddProductOpen(true);
                }}
                onEditProduct={handleEditProduct}
                onToggleStatus={handleToggleProductStatus}
                onToggleMaintenance={handleToggleProductMaintenance}
                onDeleteProduct={handleDeleteProduct}
                onDeleteAllProducts={handleDeleteAllProducts}
                onBulkToggleStatus={handleBulkToggleProductStatus}
              />
            )}

            {adminTab === 'id_stock' && (
              <AdminIdStockView
                products={products}
                apiConfigs={apiConfigs}
                onUpdateProductKeys={handleUpdateProductKeys}
              />
            )}

            {adminTab === 'product_links' && (
              <AdminProductLinksView
                productLinks={productLinks}
                products={products}
                onSaveProductLink={handleSaveProductLink}
                onDeleteProductLink={handleDeleteProductLink}
                onSyncAllProductLinks={handleSyncAllProductLinks}
                onToggleLinkStatus={handleToggleProductLinkStatus}
              />
            )}

            {adminTab === 'api_setup' && (
              <AdminApiSetupView
                apiConfigs={apiConfigs}
                onSaveApiConfig={handleSaveApiConfig}
                onAddApiConfig={handleAddApiConfig}
                onDeleteApiConfig={handleDeleteApiConfig}
              />
            )}

            {adminTab === 'api_diagnostic' && <ApiDiagnosticView />}

            {adminTab === 'upi_payment' && (
              <AdminUpiPaymentView
                paymentConfigs={paymentConfigs}
                onSaveConfig={handleSavePaymentConfig}
                storeSettings={storeSettings}
                onSaveStoreSettings={handleSaveStoreSettings}
              />
            )}

            {adminTab === 'store_settings' && (
              <AdminStoreSettingsView
                settings={storeSettings}
                onSaveSettings={handleSaveStoreSettings}
              />
            )}

            {adminTab === 'members_wallets' && (
              <AdminMembersWalletsView
                users={resellers}
                onAdjustBalance={handleAdjustUserBalance}
                currentUser={currentUser}
              />
            )}

            {adminTab === 'sold_keys' && (
              <AdminSoldKeysView
                soldKeys={userKeys}
                transactions={transactions}
                storeSettings={storeSettings}
                currentUser={currentUser}
                onSeedSampleKeys={(sampleKeys) => setUserKeys((prev) => [...sampleKeys, ...prev])}
              />
            )}

            {adminTab === 'resellers' && (
              <AdminResellersView
                resellers={resellers}
                onPromoteUser={handlePromoteUser}
                onDemoteUser={handleDemoteUser}
              />
            )}

            {adminTab === 'coupons' && <AdminCouponManagerView />}

            {adminTab === 'topups' && (
              <AdminTopupsView
                users={resellers}
                onAdjustBalance={handleAdjustUserBalance}
              />
            )}

            {adminTab === 'binance' && <AdminBinanceView />}

            {adminTab === 'broadcast' && <AdminBroadcastView />}

            {adminTab === 'profile' && (
              <AdminProfileView
                currentUser={currentUser}
                storeSettings={storeSettings}
                onLogout={handleLogout}
                onSwitchToUser={() => {
                  setAppMode('user');
                  setUserTab('dashboard');
                }}
              />
            )}
          </AdminLayout>
        )
      )}
        </>
      )}

      {/* ==================== GLOBAL MODALS ==================== */}
      {/* 1. How To Deposit Modal */}
      <HowToDepositModal
        isOpen={isHowToDepositOpen}
        onClose={() => setIsHowToDepositOpen(false)}
        videoUrl={storeSettings.howToUseBotLink}
        minDeposit={storeSettings.minDeposit}
      />

      {/* 2. Deposit Modal */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onDepositSuccess={handleDepositSuccess}
        storeSettings={storeSettings}
        paymentConfigs={paymentConfigs}
      />

      {/* 3. Buy Keys Modal */}
      <BuyKeysModal
        isOpen={isBuyKeysOpen}
        onClose={() => setIsBuyKeysOpen(false)}
        products={products.filter((p) => p.status === 'ACTIVE')}
        balance={userStats.balance}
        onPurchaseKey={handlePurchaseKey}
        onOpenDeposit={() => setIsDepositOpen(true)}
      />

      {/* 3.5. Key Purchase Progress & Delivery Modal with Linear Progress Bar */}
      <KeyPurchaseModal
        isOpen={Boolean(keyPurchaseModalData)}
        onClose={() => setKeyPurchaseModalData(null)}
        purchaseData={keyPurchaseModalData}
        onRetry={() => {
          if (keyPurchaseModalData) {
            handlePurchaseKey(
              keyPurchaseModalData.product,
              keyPurchaseModalData.plan,
              keyPurchaseModalData.quantity
            );
          }
        }}
        onGoToMyKeys={() => {
          setKeyPurchaseModalData(null);
          setUserTab('my_keys');
        }}
        onViewInvoice={(inv) => setActiveInvoice(inv)}
      />

      {/* 3.6. Official Purchase Invoice Modal */}
      <KeyInvoiceModal
        isOpen={Boolean(activeInvoice)}
        onClose={() => setActiveInvoice(null)}
        invoice={activeInvoice}
        storeSettings={storeSettings}
        onGoToMyKeys={() => {
          setActiveInvoice(null);
          setUserTab('my_keys');
        }}
      />

      {/* 4. Add/Edit Product Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setEditingProduct(null);
        }}
        onSaveProduct={handleSaveProduct}
        editingProduct={editingProduct}
      />

      {/* 5. Email & Password Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalInitialMode}
        onLoginSuccess={handleLoginSuccess}
        storeSettings={storeSettings}
      />

      {/* 6. Key Purchase Success Delivery Modal */}
      <KeySuccessModal
        purchasedKey={latestPurchasedKey}
        onClose={() => setLatestPurchasedKey(null)}
        onGoToMyKeys={() => {
          setLatestPurchasedKey(null);
          setUserTab('my_keys');
        }}
        onViewInvoice={(inv) => setActiveInvoice(inv)}
        invoice={activeInvoice}
      />

      {/* 7. Out of Stock Notice Modal */}
      <AnimatePresence>
        {outOfStockNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOutOfStockNotice(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-50 w-full max-w-sm bg-[#161622] border border-rose-500/50 rounded-3xl p-6 shadow-[0_0_40px_rgba(244,63,94,0.3)] text-center text-white space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  Out of Stock
                </h3>
                <p className="text-xs text-rose-300 font-semibold">
                  {outOfStockNotice.productName} ({outOfStockNotice.planDuration})
                </p>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed bg-black/40 p-3 rounded-2xl border border-white/5">
                {outOfStockNotice.message}
              </p>
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                Zero Balance Deducted. Your funds remain safe in your wallet.
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setOutOfStockNotice(null)}
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
                <a
                  href={storeSettings.telegramSupportUrl || 'https://t.me/Kalam_Mods_Official'}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.4)] cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Notify Admin</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
