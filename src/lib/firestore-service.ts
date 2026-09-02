import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocs,
} from './firebase';
import {
  AuthUser,
  ResellerUser,
  Product,
  ProductLink,
  ApiConfig,
  PaymentGatewayConfig,
  StoreSettings,
  PurchasedKey,
  TransactionRecord,
  StoreActivityNotification,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_PRODUCT_LINKS,
  INITIAL_RESELLERS,
  INITIAL_STORE_SETTINGS,
  INITIAL_API_CONFIGS,
  INITIAL_PAYMENT_CONFIGS,
  INITIAL_TRANSACTIONS,
  INITIAL_USER_KEYS,
} from './mock-data';
import { safeFetchJson } from './safe-api';

/* ==================== USERS & RESELLERS FIRESTORE SYNC ==================== */

/**
 * Real-time listener for all users / resellers in Firestore
 */
export function subscribeToUsers(
  onUpdate: (users: ResellerUser[]) => void,
  onError?: (error: any) => void
) {
  try {
    const usersCol = collection(db, 'users');
    return onSnapshot(
      usersCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const userList: ResellerUser[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            userList.push({
              id: docSnap.id,
              name: data.name || data.displayName || 'User',
              username: data.username || (data.email ? data.email.split('@')[0] : 'user'),
              email: data.email || '',
              phone: data.phone || '',
              walletBalance: typeof data.walletBalance === 'number' ? data.walletBalance : 0,
              isReseller: Boolean(data.isReseller || data.role === 'RESELLER'),
              role: data.role || (data.isReseller ? 'RESELLER' : 'USER'),
              status: data.status || 'ACTIVE',
              joinedDate: data.joinedDate || 'Recently',
              totalKeysSold: data.totalKeysSold || 0,
              totalSpent: data.totalSpent || 0,
              depositedToday: data.depositedToday || 0,
              notes: data.notes || '',
              customDiscountPercent: data.customDiscountPercent || 0,
            });
          });
          onUpdate(userList);
        } else {
          // If Firestore is empty initially, populate with initial default list
          onUpdate(INITIAL_RESELLERS);
          // Seed the initial users to Firestore in the background
          seedInitialUsers(INITIAL_RESELLERS);
        }
      },
      (error) => {
        console.warn('[Firestore] subscribeToUsers warning:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] subscribeToUsers catch error:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Fetch all users once directly from Firestore
 */
export async function fetchUsersFromFirestore(): Promise<ResellerUser[]> {
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    if (!snapshot.empty) {
      const userList: ResellerUser[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        userList.push({
          id: docSnap.id,
          name: data.name || data.displayName || 'User',
          username: data.username || (data.email ? data.email.split('@')[0] : 'user'),
          email: data.email || '',
          phone: data.phone || '',
          walletBalance: typeof data.walletBalance === 'number' ? data.walletBalance : 0,
          isReseller: Boolean(data.isReseller || data.role === 'RESELLER'),
          role: data.role || (data.isReseller ? 'RESELLER' : 'USER'),
          status: data.status || 'ACTIVE',
          joinedDate: data.joinedDate || 'Recently',
          totalKeysSold: data.totalKeysSold || 0,
          totalSpent: data.totalSpent || 0,
          depositedToday: data.depositedToday || 0,
          notes: data.notes || '',
          customDiscountPercent: data.customDiscountPercent || 0,
        });
      });
      return userList;
    }
  } catch (err) {
    console.warn('[Firestore] Error fetching users once:', err);
  }
  return [];
}

/**
 * Seed initial users if Firestore collection is blank
 */
async function seedInitialUsers(users: ResellerUser[]) {
  try {
    for (const u of users) {
      const userRef = doc(db, 'users', u.id);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          ...u,
          createdAt: Date.now(),
        });
      }
    }
  } catch (e) {
    console.warn('[Firestore] Seed users note:', e);
  }
}

/**
 * Save / Update a user or reseller in Firestore
 */
export async function saveUserToFirestore(user: ResellerUser | (Partial<ResellerUser> & { id: string })) {
  if (!user || !user.id) return false;

  const safeUser = toFirestoreSafe(user);

  // Always update local cache for immediate durability
  try {
    const raw = localStorage.getItem('kalam_users_db');
    const list: ResellerUser[] = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...safeUser } as ResellerUser;
    } else {
      list.unshift(safeUser as ResellerUser);
    }
    localStorage.setItem('kalam_users_db', JSON.stringify(list));
  } catch {}

  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      ...safeUser,
      updatedAt: Date.now(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] User saved locally. Cloud sync notice:', err);
    return true; // Local update succeeded
  }
}

/**
 * Delete a user from Firestore
 */
export async function deleteUserFromFirestore(userId: string) {
  try {
    const raw = localStorage.getItem('kalam_users_db');
    if (raw) {
      const list: ResellerUser[] = JSON.parse(raw);
      const filtered = list.filter((u) => u.id !== userId);
      localStorage.setItem('kalam_users_db', JSON.stringify(filtered));
    }
  } catch {}

  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    return true;
  } catch (err) {
    console.warn('[Firestore] Delete user notice:', err);
    return true;
  }
}

/* ==================== TRANSACTIONS FIRESTORE SYNC ==================== */

/**
 * Real-time listener for user transactions
 */
export function subscribeToUserTransactions(
  userId: string,
  onUpdate: (txns: TransactionRecord[]) => void
) {
  try {
    const txnDocRef = doc(db, 'transactions', userId);
    return onSnapshot(
      txnDocRef,
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data()?.records)) {
          onUpdate(snap.data()?.records);
        } else {
          try {
            const local = localStorage.getItem(`kalam_txns_${userId}`);
            if (local) {
              const parsed = JSON.parse(local);
              if (Array.isArray(parsed) && parsed.length > 0) {
                onUpdate(parsed);
                setDoc(txnDocRef, { records: parsed, updatedAt: Date.now() }, { merge: true }).catch(() => {});
                return;
              }
            }
          } catch {}
          onUpdate(INITIAL_TRANSACTIONS);
        }
      },
      (err) => {
        console.warn('[Firestore] User transactions listener note:', err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Save user transactions to Firestore
 */
export async function saveTransactionsToFirestore(userId: string, txns: TransactionRecord[]) {
  try {
    const safeTxns = toFirestoreSafe(txns);
    const txnDocRef = doc(db, 'transactions', userId);
    await setDoc(txnDocRef, { records: safeTxns, updatedAt: Date.now() }, { merge: true });
    try {
      localStorage.setItem(`kalam_txns_${userId}`, JSON.stringify(safeTxns));
    } catch {}
    return true;
  } catch (e) {
    console.warn('[Firestore] saveTransactionsToFirestore error:', e);
    return false;
  }
}

/* ==================== PURCHASED KEYS FIRESTORE SYNC ==================== */

/**
 * Real-time listener for user purchased keys
 */
export function subscribeToUserPurchasedKeys(
  userId: string,
  onUpdate: (keys: PurchasedKey[]) => void
) {
  try {
    const keyDocRef = doc(db, 'purchased_keys', userId);
    return onSnapshot(
      keyDocRef,
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data()?.keys)) {
          onUpdate(snap.data()?.keys);
        } else {
          try {
            const local = localStorage.getItem(`kalam_keys_${userId}`);
            if (local) {
              const parsed = JSON.parse(local);
              if (Array.isArray(parsed) && parsed.length > 0) {
                onUpdate(parsed);
                setDoc(keyDocRef, { keys: parsed, updatedAt: Date.now() }, { merge: true }).catch(() => {});
                return;
              }
            }
          } catch {}
          onUpdate(INITIAL_USER_KEYS);
        }
      },
      (err) => {
        console.warn('[Firestore] User keys listener note:', err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Save user purchased keys to Firestore
 */
export async function savePurchasedKeysToFirestore(userId: string, keys: PurchasedKey[]) {
  try {
    const safeKeys = toFirestoreSafe(keys);
    const keyDocRef = doc(db, 'purchased_keys', userId);
    await setDoc(keyDocRef, { keys: safeKeys, updatedAt: Date.now() }, { merge: true });
    try {
      localStorage.setItem(`kalam_keys_${userId}`, JSON.stringify(safeKeys));
    } catch {}
    return true;
  } catch (e) {
    console.warn('[Firestore] savePurchasedKeysToFirestore error:', e);
    return false;
  }
}

/**
 * Sync logged-in Auth User to Firestore database
 */
export async function syncAuthUserToFirestore(authUser: AuthUser): Promise<ResellerUser> {
  try {
    const userRef = doc(db, 'users', authUser.id);
    const snap = await getDoc(userRef);
    const cleanEmail = (authUser.email || '').trim().toLowerCase();
    const isAdmin = cleanEmail === 'kalam172010@gmail.com' || cleanEmail === 'kalam2000abc@gmail.com' || authUser.role === 'ADMIN';

    if (snap.exists()) {
      const data = snap.data();
      const updatedUser: ResellerUser = {
        id: authUser.id,
        name: authUser.name || data.name || 'User',
        username: authUser.username || data.username || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: data.phone || '',
        walletBalance: typeof data.walletBalance === 'number' ? data.walletBalance : (isAdmin ? 290011.65 : 0),
        isReseller: Boolean(data.isReseller || data.role === 'RESELLER'),
        role: isAdmin ? 'ADMIN' : (data.role || 'USER'),
        status: data.status || 'ACTIVE',
        joinedDate: data.joinedDate || authUser.joinedDate || new Date().toLocaleDateString(),
        totalKeysSold: data.totalKeysSold || 0,
        totalSpent: data.totalSpent || 0,
        depositedToday: data.depositedToday || 0,
        notes: data.notes || '',
        customDiscountPercent: data.customDiscountPercent || 0,
      };
      await setDoc(userRef, { ...updatedUser, lastLoginAt: Date.now() }, { merge: true });
      return updatedUser;
    } else {
      const newUser: ResellerUser = {
        id: authUser.id,
        name: authUser.name || (isAdmin ? 'KALAM FF (OWNER)' : cleanEmail.split('@')[0]),
        username: authUser.username || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: '',
        walletBalance: isAdmin ? 290011.65 : (authUser.walletBalance || 0),
        isReseller: false,
        role: isAdmin ? 'ADMIN' : (authUser.role || 'USER'),
        status: 'ACTIVE',
        joinedDate: authUser.joinedDate || new Date().toLocaleDateString(),
        totalKeysSold: 0,
        totalSpent: 0,
        depositedToday: 0,
        notes: isAdmin ? 'Master Administrator' : 'Self-registered user',
        customDiscountPercent: 0,
      };
      await setDoc(userRef, { ...newUser, createdAt: Date.now() });
      return newUser;
    }
  } catch (err) {
    console.error('[Firestore] Error syncing auth user:', err);
    return {
      id: authUser.id,
      name: authUser.name,
      username: authUser.username,
      email: authUser.email,
      walletBalance: authUser.walletBalance || 0,
      depositedToday: 0,
      soldToday: 0,
      isReseller: authUser.role === 'RESELLER',
      role: authUser.role,
      status: 'ACTIVE',
      joinedDate: authUser.joinedDate,
      totalKeysSold: 0,
      totalSpent: 0,
    };
  }
}

/* ==================== STORE SETTINGS & CONFIGS SYNC ==================== */

/**
 * Subscribe to Store Settings in Firestore
 */
export function subscribeToStoreSettings(
  onUpdate: (settings: StoreSettings) => void
) {
  try {
    const settingsRef = doc(db, 'settings', 'store_settings');
    return onSnapshot(
      settingsRef,
      (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data() as StoreSettings;
          if (cloudData && typeof cloudData === 'object' && cloudData.shopName) {
            onUpdate(cloudData);
            try {
              localStorage.setItem('kalam_store_settings_db', JSON.stringify(cloudData));
            } catch {}
          }
        } else {
          // If Firestore is empty, see if we have local settings to initialize
          let currentLocal = INITIAL_STORE_SETTINGS;
          try {
            const saved = localStorage.getItem('kalam_store_settings_db');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed && typeof parsed === 'object' && parsed.shopName) {
                currentLocal = parsed;
              }
            }
          } catch {}
          onUpdate(currentLocal);
          setDoc(settingsRef, currentLocal, { merge: true }).catch(() => {});
        }
      },
      (err) => {
        console.warn('[Firestore] Settings listener note:', err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Save Store Settings to Firestore
 */
export async function saveStoreSettingsToFirestore(settings: StoreSettings) {
  try {
    const safeData = toFirestoreSafe(settings);
    const settingsRef = doc(db, 'settings', 'store_settings');
    await setDoc(settingsRef, safeData, { merge: true });
    try {
      localStorage.setItem('kalam_store_settings_db', JSON.stringify(safeData));
    } catch {}
    // Also sync to backend
    safeFetchJson('/api/settings/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: safeData }),
    }).catch(() => {});
    return true;
  } catch (e) {
    console.warn('[Firestore] saveStoreSettingsToFirestore error:', e);
    return false;
  }
}

/**
 * Subscribe to API Configs (Reseller API #1 and #2) in Firestore
 */
export function subscribeToApiConfigs(
  onUpdate: (configs: ApiConfig[]) => void
) {
  try {
    const apiRef = doc(db, 'settings', 'api_configs');
    return onSnapshot(
      apiRef,
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data().configs)) {
          onUpdate(snap.data().configs);
        } else {
          onUpdate(INITIAL_API_CONFIGS);
          setDoc(apiRef, toFirestoreSafe({ configs: INITIAL_API_CONFIGS }), { merge: true }).catch(() => {});
        }
      },
      (err) => {
        console.warn('[Firestore] API Configs listener note:', err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Save API Configs to Firestore
 */
export async function saveApiConfigsToFirestore(configs: ApiConfig[]) {
  try {
    const safeData = toFirestoreSafe(configs);
    const apiRef = doc(db, 'settings', 'api_configs');
    await setDoc(apiRef, { configs: safeData, updatedAt: Date.now() }, { merge: true });
    try {
      localStorage.setItem('kalam_api_configs_db', JSON.stringify(safeData));
    } catch {}
    // Also sync to backend
    safeFetchJson('/api/settings/api-configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configs: safeData }),
    }).catch(() => {});
    return true;
  } catch (e) {
    console.warn('[Firestore] saveApiConfigsToFirestore error:', e);
    return false;
  }
}

/**
 * Subscribe to Payment Configs in Firestore
 */
export function subscribeToPaymentConfigs(
  onUpdate: (configs: PaymentGatewayConfig[]) => void
) {
  try {
    const payRef = doc(db, 'settings', 'payment_configs');
    return onSnapshot(
      payRef,
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data().configs)) {
          onUpdate(snap.data().configs);
        } else {
          onUpdate(INITIAL_PAYMENT_CONFIGS);
          setDoc(payRef, toFirestoreSafe({ configs: INITIAL_PAYMENT_CONFIGS }), { merge: true }).catch(() => {});
        }
      },
      (err) => {
        console.warn('[Firestore] Payment Configs listener note:', err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Save Payment Configs to Firestore
 */
export async function savePaymentConfigsToFirestore(configs: PaymentGatewayConfig[]) {
  try {
    const safeData = toFirestoreSafe(configs);
    const payRef = doc(db, 'settings', 'payment_configs');
    await setDoc(payRef, { configs: safeData, updatedAt: Date.now() }, { merge: true });
    try {
      localStorage.setItem('kalam_payment_configs_db', JSON.stringify(safeData));
    } catch {}
    // Also sync to backend
    safeFetchJson('/api/settings/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configs: safeData }),
    }).catch(() => {});
    return true;
  } catch (e) {
    console.warn('[Firestore] savePaymentConfigsToFirestore error:', e);
    return false;
  }
}

/**
 * Ensure objects are 100% Firestore-safe by stripping undefined fields
 */
function toFirestoreSafe<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Sanitize product objects
 */
function sanitizeProducts(prods: any[]): Product[] {
  if (!Array.isArray(prods)) return [];
  return prods.filter(
    (p) => p && typeof p === 'object' && p.id && typeof p.name === 'string' && p.name.trim().length > 0
  );
}

function sanitizeProductLinks(links: any[]): ProductLink[] {
  if (!Array.isArray(links)) return [];
  return links.filter(
    (l) => l && typeof l === 'object' && l.id && typeof l.name === 'string'
  );
}

/**
 * Subscribe to Products in Firestore & Global API with Full Cloud & Server Durability
 */
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void
) {
  let hasDelivered = false;

  // 1. Instantly deliver local products from localStorage if available
  try {
    const local = localStorage.getItem('kalam_products_db');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleanLocal = sanitizeProducts(parsed);
        if (cleanLocal.length > 0) {
          onUpdate(cleanLocal);
          hasDelivered = true;
        }
      }
    }
  } catch {}

  // Fallback to INITIAL_PRODUCTS immediately if local storage is blank so UI is never empty
  if (!hasDelivered && INITIAL_PRODUCTS.length > 0) {
    onUpdate(INITIAL_PRODUCTS);
    try {
      localStorage.setItem('kalam_products_db', JSON.stringify(INITIAL_PRODUCTS));
    } catch {}
  }

  // 2. Fetch from Server Disk Storage API (/api/products) immediately
  safeFetchJson<{ success: boolean; products: Product[]; initialized?: boolean }>('/api/products')
    .then((res) => {
      if (res.data?.success && Array.isArray(res.data.products) && res.data.products.length > 0) {
        const serverList = sanitizeProducts(res.data.products);
        if (serverList.length > 0) {
          onUpdate(serverList);
          try {
            localStorage.setItem('kalam_products_db', JSON.stringify(serverList));
            localStorage.setItem('kalam_products_initialized', 'true');
          } catch {}

          // Ensure Firestore also has these products if Firestore was blank
          const prodRef = doc(db, 'settings', 'products_catalog');
          getDoc(prodRef).then((snap) => {
            if (!snap.exists() || !Array.isArray(snap.data()?.products) || snap.data()?.products.length === 0) {
              setDoc(prodRef, toFirestoreSafe({ products: serverList, initialized: true, updatedAt: Date.now() }), { merge: true }).catch(() => {});
            }
          }).catch(() => {});
        }
      }
    })
    .catch(() => {});

  // 3. Real-time Firestore listener on catalog document
  try {
    const prodRef = doc(db, 'settings', 'products_catalog');
    return onSnapshot(
      prodRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.products)) {
            const cleanList = sanitizeProducts(data.products);
            if (cleanList.length > 0) {
              onUpdate(cleanList);
              try {
                localStorage.setItem('kalam_products_db', JSON.stringify(cleanList));
                localStorage.setItem('kalam_products_initialized', 'true');
              } catch {}
              // Sync with backend server disk
              safeFetchJson('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: cleanList }),
              }).catch(() => {});
              return;
            }
          }
        }

        // If Firestore catalog document does not exist or was empty, check individual products collection in Firestore
        try {
          const colSnap = await getDocs(collection(db, 'products'));
          if (!colSnap.empty) {
            const indList: Product[] = [];
            colSnap.forEach((d) => {
              const pData = d.data() as Product;
              if (pData && pData.id) indList.push(pData);
            });
            const cleanInd = sanitizeProducts(indList);
            if (cleanInd.length > 0) {
              onUpdate(cleanInd);
              try {
                localStorage.setItem('kalam_products_db', JSON.stringify(cleanInd));
              } catch {}
              setDoc(prodRef, toFirestoreSafe({ products: cleanInd, initialized: true, updatedAt: Date.now() }), { merge: true }).catch(() => {});
              safeFetchJson('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: cleanInd }),
              }).catch(() => {});
              return;
            }
          }
        } catch {}

        // Fallback: seed INITIAL_PRODUCTS to Firestore so database is populated
        if (INITIAL_PRODUCTS.length > 0) {
          onUpdate(INITIAL_PRODUCTS);
          try {
            localStorage.setItem('kalam_products_db', JSON.stringify(INITIAL_PRODUCTS));
          } catch {}
          setDoc(prodRef, toFirestoreSafe({ products: INITIAL_PRODUCTS, initialized: true, updatedAt: Date.now() }), { merge: true }).catch(() => {});
          safeFetchJson('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: INITIAL_PRODUCTS }),
          }).catch(() => {});
        }
      },
      (err) => {
        console.warn('[Firestore] Products catalog listener note:', err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Save Products catalog to Firestore (both settings document and individual product documents)
 */
export async function saveProductsToFirestore(products: Product[]) {
  if (!Array.isArray(products)) return false;
  const cleanList = sanitizeProducts(products);
  const safeList = toFirestoreSafe(cleanList);

  try {
    localStorage.setItem('kalam_products_db', JSON.stringify(safeList));
    localStorage.setItem('kalam_products_initialized', 'true');
  } catch {}

  // Sync with backend API
  safeFetchJson('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products: safeList }),
  }).catch(() => {});

  try {
    // 1. Save to main catalog doc
    const prodRef = doc(db, 'settings', 'products_catalog');
    await setDoc(prodRef, toFirestoreSafe({ products: safeList, initialized: true, updatedAt: Date.now() }), { merge: true });

    // 2. Also persist each product document individually for database redundancy
    for (const p of safeList) {
      if (p?.id) {
        const itemRef = doc(db, 'products', p.id);
        setDoc(itemRef, toFirestoreSafe({ ...p, updatedAt: Date.now() }), { merge: true }).catch(() => {});
      }
    }
    return true;
  } catch (e) {
    console.warn('[Firestore] saveProductsToFirestore error:', e);
    return false;
  }
}

/**
 * Delete a product from Firestore
 */
export async function deleteProductFromFirestore(productId: string) {
  try {
    const itemRef = doc(db, 'products', productId);
    await deleteDoc(itemRef);
  } catch (e) {
    console.warn('[Firestore] deleteProductFromFirestore error:', e);
  }
}

/* ==================== PRODUCT LINKS FIRESTORE SYNC ==================== */

/**
 * Subscribe to Product Links in Firestore
 */
export function subscribeToProductLinks(
  onUpdate: (links: ProductLink[]) => void
) {
  try {
    const linksRef = doc(db, 'settings', 'product_links');
    return onSnapshot(
      linksRef,
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data()?.links)) {
          const cleanLinks = sanitizeProductLinks(snap.data()?.links);
          onUpdate(cleanLinks);
          try {
            localStorage.setItem('kalam_product_links_db', JSON.stringify(cleanLinks));
          } catch {}
        } else {
          try {
            const saved = localStorage.getItem('kalam_product_links_db');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                const cleanLinks = sanitizeProductLinks(parsed);
                onUpdate(cleanLinks);
                setDoc(linksRef, { links: cleanLinks, updatedAt: Date.now() }, { merge: true }).catch(() => {});
                return;
              }
            }
          } catch {}
          onUpdate([]);
        }
      },
      (err) => {
        console.warn('[Firestore] Product links listener note:', err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Save Product Links to Firestore
 */
export async function saveProductLinksToFirestore(links: ProductLink[]) {
  const cleanLinks = sanitizeProductLinks(links);
  const safeLinks = toFirestoreSafe(cleanLinks);
  try {
    localStorage.setItem('kalam_product_links_db', JSON.stringify(safeLinks));
  } catch {}

  try {
    const linksRef = doc(db, 'settings', 'product_links');
    await setDoc(linksRef, { links: safeLinks, updatedAt: Date.now() }, { merge: true });
    return true;
  } catch (e) {
    console.warn('[Firestore] saveProductLinksToFirestore error:', e);
    return false;
  }
}

/* ==================== REAL-TIME STORE ACTIVITIES & ADMIN NOTIFICATIONS ==================== */

/**
 * Publish a real-time store activity (Deposit, Key Purchase, Top-up)
 */
export async function publishStoreActivity(activity: Partial<StoreActivityNotification> & {
  type: 'DEPOSIT' | 'PURCHASE' | 'TOPUP' | 'REFUND';
  title: string;
  amount: number;
  userName: string;
}): Promise<boolean> {
  const fullActivity: StoreActivityNotification = {
    id: activity.id || `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: activity.type,
    title: activity.title,
    message: activity.message || `${activity.title} - ₹${activity.amount}`,
    amount: activity.amount,
    userName: activity.userName,
    userEmail: activity.userEmail || '',
    productName: activity.productName || '',
    planDuration: activity.planDuration || '',
    quantity: activity.quantity || 1,
    timestamp: activity.timestamp || Date.now(),
    createdAtStr: activity.createdAtStr || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    read: false,
  };

  const safeActivity = toFirestoreSafe(fullActivity);

  // 1. Broadcast locally via localStorage & CustomEvent for instant cross-tab sync
  try {
    const saved = localStorage.getItem('kalam_recent_activities');
    const existing = saved ? JSON.parse(saved) : [];
    const updated = [safeActivity, ...existing.filter((a: any) => a.id !== safeActivity.id).slice(0, 49)];
    localStorage.setItem('kalam_recent_activities', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('kalam_store_activity', { detail: safeActivity }));
  } catch {}

  // 2. Persist to Firestore live activities doc and activities collection
  try {
    const liveRef = doc(db, 'settings', 'live_activities');
    await setDoc(
      liveRef,
      {
        latestActivity: safeActivity,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    const actRef = doc(db, 'activities', safeActivity.id);
    await setDoc(actRef, safeActivity, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] publishStoreActivity error:', err);
    return false;
  }
}

/**
 * Subscribe to real-time store activities for Admin Panel with sound chime & toast triggers
 */
export function subscribeToStoreActivities(
  onNewActivity: (activity: StoreActivityNotification) => void,
  onHistoryLoaded?: (activities: StoreActivityNotification[]) => void
) {
  let isInitialLoad = true;
  const sessionStartTime = Date.now() - 4000;
  const seenIds = new Set<string>();

  // 1. Load existing historical activities from localStorage
  try {
    const saved = localStorage.getItem('kalam_recent_activities');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach((a) => {
          if (a?.id) seenIds.add(a.id);
        });
        if (onHistoryLoaded) onHistoryLoaded(parsed);
      }
    }
  } catch {}

  // 2. Listen to browser window custom events (immediate local / cross-tab response)
  const handleLocalEvent = (e: any) => {
    if (e.detail && e.detail.id) {
      const act = e.detail as StoreActivityNotification;
      if (!seenIds.has(act.id)) {
        seenIds.add(act.id);
        onNewActivity(act);
      }
    }
  };
  window.addEventListener('kalam_store_activity', handleLocalEvent);

  // 3. Real-time Firestore snapshot listener on live activities doc
  try {
    const liveRef = doc(db, 'settings', 'live_activities');
    const unsub = onSnapshot(
      liveRef,
      (snap) => {
        if (isInitialLoad) {
          isInitialLoad = false;
          // Capture current active id so it doesn't ring retroactively
          if (snap.exists()) {
            const data = snap.data();
            const act = data?.latestActivity as StoreActivityNotification | undefined;
            if (act?.id) seenIds.add(act.id);
          }
          return;
        }

        if (snap.exists()) {
          const data = snap.data();
          const activity = data?.latestActivity as StoreActivityNotification | undefined;
          if (
            activity &&
            activity.id &&
            !seenIds.has(activity.id) &&
            activity.timestamp &&
            activity.timestamp >= sessionStartTime
          ) {
            seenIds.add(activity.id);
            onNewActivity(activity);
          }
        }
      },
      (err) => {
        console.warn('[Firestore] Live activities listener note:', err);
      }
    );

    return () => {
      window.removeEventListener('kalam_store_activity', handleLocalEvent);
      unsub();
    };
  } catch {
    return () => {
      window.removeEventListener('kalam_store_activity', handleLocalEvent);
    };
  }
}

