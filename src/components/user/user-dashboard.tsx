import React from 'react';
import { motion } from 'motion/react';
import { BalanceCard } from './balance-card';
import { StatsRow } from './stat-card';
import { QuickActionsGrid, QuickActionKey } from './quick-actions';
import { UserStats, TopSeller, StoreSettings, Product, PlanPricing } from '../../types';
import { Key, ArrowRight, ShieldCheck, RefreshCw, Zap, ShoppingCart } from 'lucide-react';
import { StoreLogo } from '../shared/store-logo';

interface UserDashboardProps {
  userStats: UserStats;
  topSellers?: TopSeller[];
  storeSettings: StoreSettings;
  products?: Product[];
  onQuickAction: (action: QuickActionKey) => void;
  onOpenDeposit: () => void;
  onPurchaseKey?: (product: Product, plan: PlanPricing, quantity: number) => void;
  onRefreshProducts?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  userStats,
  storeSettings,
  products = [],
  onQuickAction,
  onOpenDeposit,
  onRefreshProducts,
}) => {
  const activeProducts = products.filter((p) => p.status !== 'DISABLED');
  const currency = storeSettings?.currencySymbol || '₹';

  return (
    <motion.div
      id="user-dashboard-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* 0. PROMINENT STORE BRANDING & IDENTITY HERO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#161622] via-[#1a1329] to-[#0f172a] border border-[#8b5cf6]/30 p-4 shadow-[0_0_25px_rgba(139,92,246,0.15)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00e5ff] via-[#8b5cf6] to-[#ff0080] p-[1.5px] shadow-[0_0_15px_rgba(0,229,255,0.4)] shrink-0">
              <StoreLogo
                logoUrl={storeSettings?.logoUrl}
                alt={storeSettings?.shopName || 'Store Logo'}
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black text-white tracking-wide truncate uppercase">
                  {storeSettings?.shopName || 'KALAM FF PANEL'}
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Active & Online" />
              </div>
              <p className="text-[11px] text-gray-400 truncate font-medium mt-0.5">
                {storeSettings?.tagline || 'Powered by KALAM • Instant 24/7 Delivery'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>100% Direct Credit</span>
            </span>
            <span className="text-[9px] text-gray-400 font-mono">
              Min: {currency}{storeSettings?.minDeposit || 1}
            </span>
          </div>
        </div>
      </div>

      {/* 1. HERO WALLET BALANCE CARD (Pink border glow) */}
      <BalanceCard
        balance={userStats.balance}
        onDepositClick={onOpenDeposit}
        currencySymbol={currency}
      />

      {/* 2. STATS ROW (Today Sales, Monthly Sales) */}
      <StatsRow
        todaySalesTotal={userStats.todaySalesU + userStats.todaySalesMe}
        todaySalesU={userStats.todaySalesU}
        todaySalesMe={userStats.todaySalesMe}
        monthlySalesTotal={userStats.monthlySalesU + userStats.monthlySalesMe}
        monthlySalesU={userStats.monthlySalesU}
        monthlySalesMe={userStats.monthlySalesMe}
      />

      {/* 4. QUICK ACTIONS GRID (3 cols, 2 rows) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
            QUICK ACTIONS
          </span>
          <span className="text-[10px] text-[#00e5ff] font-medium">Instant Bot Services</span>
        </div>
        <QuickActionsGrid onActionClick={onQuickAction} />
      </div>

      {/* 5. LIVE STORE PRODUCTS PREVIEW */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-black text-[#ff0080] tracking-wider">
            <span>&gt;&gt;</span>
            <span className="text-gray-200 uppercase">STORE PRODUCTS ({activeProducts.length})</span>
            {onRefreshProducts && (
              <button
                type="button"
                onClick={onRefreshProducts}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer"
                title="Refresh products catalog"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => onQuickAction('BUY_KEYS')}
            className="text-[11px] text-[#00e5ff] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {activeProducts.length === 0 ? (
          <div className="p-5 rounded-2xl bg-[#161622]/60 border border-purple-500/20 text-center space-y-2">
            <Key className="w-6 h-6 text-gray-500 mx-auto" />
            <p className="text-xs text-gray-400 font-medium">No active products listed in catalog yet</p>
            <p className="text-[10px] text-gray-500">Products created in Admin Panel will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeProducts.map((product) => {
              const minPrice = Math.min(...(product.plans?.map((p) => p.price) || [0]));
              const stockCount = (product.keys || []).length;
              const hasStock = stockCount > 0;
              const hasApi = Boolean(product.api1Restock?.remoteProductId || product.api2Restock?.remoteProductId);

              return (
                <div
                  key={product.id}
                  onClick={() => onQuickAction('BUY_KEYS')}
                  className="p-3 rounded-2xl bg-[#161622]/90 border border-purple-500/30 hover:border-cyan-400/60 shadow-[0_0_20px_rgba(139,92,246,0.15)] flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-900/60 to-cyan-900/60 border border-white/10 flex items-center justify-center text-cyan-300 font-bold shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Key className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate block">
                          {product.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-[9px] font-mono text-purple-300 border border-purple-400/30 shrink-0">
                          {product.game || 'FREEFIRE'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                        <span className="text-emerald-400 font-bold font-mono">
                          From {currency}{minPrice.toFixed(2)}
                        </span>
                        <span className="text-gray-500">•</span>
                        {hasStock ? (
                          <span className="text-emerald-400 font-medium">{stockCount} In Stock</span>
                        ) : hasApi ? (
                          <span className="text-cyan-400 font-medium flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" /> API Stock
                          </span>
                        ) : (
                          <span className="text-gray-400">Available</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAction('BUY_KEYS');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-[11px] shadow-[0_0_15px_rgba(139,92,246,0.4)] flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>Buy</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

