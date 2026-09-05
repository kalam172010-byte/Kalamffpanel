import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Play,
  Download,
  Key,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Zap,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Wallet,
  AlertCircle,
  X,
  Smartphone,
  Eye,
  Info,
  Settings,
  ShoppingCart,
  Video,
  Tv,
  RefreshCw,
  Ticket,
  Share2,
  Link2,
} from 'lucide-react';
import { Product, PlanPricing, StoreSettings, DiscountCoupon } from '../../types';
import { formatCurrency, getYouTubeEmbedUrl, isYouTubeUrl, getYouTubeThumbnailUrl } from '../../lib/utils';
import { validateCoupon } from '../../lib/coupon-service';

interface BuyKeysViewProps {
  products: Product[];
  balance: number;
  onPurchaseKey: (product: Product, plan: PlanPricing, quantity: number, coupon?: DiscountCoupon) => void;
  onOpenDeposit: () => void;
  storeSettings: StoreSettings;
  hideBalanceBar?: boolean;
  onRefreshProducts?: () => void;
  targetProductId?: string | null;
}

export const BuyKeysView: React.FC<BuyKeysViewProps> = ({
  products,
  balance,
  onPurchaseKey,
  onOpenDeposit,
  storeSettings,
  hideBalanceBar = false,
  onRefreshProducts,
  targetProductId,
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filters state (Defaults to ALL GAMES and ALL Systems so all admin products are visible)
  const [selectedGame, setSelectedGame] = useState<string>('ALL GAMES');
  const [selectedDevice, setSelectedDevice] = useState<string>('ALL Systems');

  // Expanded card accordions (map of productId -> boolean)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [copiedProductLinkId, setCopiedProductLinkId] = useState<string | null>(null);

  // Quantities map for each plan (planId -> number)
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Deep Link Handling: when targetProductId is passed or in URL, auto-select, expand, and scroll
  React.useEffect(() => {
    if (targetProductId && products.length > 0) {
      const cleanTarget = targetProductId.toLowerCase().trim();
      const match = products.find(
        (p) =>
          p.id.toLowerCase() === cleanTarget ||
          p.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') === cleanTarget ||
          p.name.toLowerCase().includes(cleanTarget)
      );

      if (match) {
        setSelectedGame('ALL GAMES');
        setSelectedDevice('ALL Systems');
        setSearchQuery('');
        setExpandedCards((prev) => ({ ...prev, [match.id]: true }));
        setHighlightedProductId(match.id);

        setTimeout(() => {
          const el = document.getElementById(`product-card-${match.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 350);

        const timer = setTimeout(() => {
          setHighlightedProductId(null);
        }, 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [targetProductId, products]);

  // Coupon / Promo Code state for checkout
  const [appliedCoupons, setAppliedCoupons] = useState<Record<string, DiscountCoupon>>({});
  const [couponInputs, setCouponInputs] = useState<Record<string, string>>({});
  const [couponMessages, setCouponMessages] = useState<Record<string, { text: string; isError: boolean }>>({});

  // Modals state
  const [activeVideoModal, setActiveVideoModal] = useState<{
    title: string;
    videoUrl?: string;
  } | null>(null);
  const [videoCopied, setVideoCopied] = useState(false);

  const [activeUpdateModal, setActiveUpdateModal] = useState<{
    product: Product;
  } | null>(null);

  const handleCopyVideoUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setVideoCopied(true);
    setTimeout(() => setVideoCopied(false), 2000);
  };

  const toggleAccordion = (productId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const getQuantity = (planId: string) => quantities[planId] || 1;

  const updateQuantity = (planId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[planId] || 1;
      const next = Math.max(1, Math.min(50, current + delta));
      return { ...prev, [planId]: next };
    });
  };

  const handleApplyCoupon = (product: Product) => {
    const code = (couponInputs[product.id] || '').trim();
    if (!code) {
      setCouponMessages((prev) => ({
        ...prev,
        [product.id]: { text: 'Please enter a coupon code', isError: true },
      }));
      return;
    }

    // Determine baseline price of the first plan to test validity
    const firstPlanPrice = product.plans && product.plans[0] ? product.plans[0].price : 50;
    const result = validateCoupon(code, firstPlanPrice);

    if (result.valid && result.coupon) {
      setAppliedCoupons((prev) => ({
        ...prev,
        [product.id]: result.coupon!,
      }));
      setCouponMessages((prev) => ({
        ...prev,
        [product.id]: { text: result.message, isError: false },
      }));
    } else {
      setCouponMessages((prev) => ({
        ...prev,
        [product.id]: { text: result.message, isError: true },
      }));
    }
  };

  const handleRemoveCoupon = (productId: string) => {
    setAppliedCoupons((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
    setCouponMessages((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  // Dynamic unique game list
  const availableGames = React.useMemo(() => {
    const set = new Set<string>(['ALL GAMES', 'FREEFIRE', '8 BAAL POOL']);
    products.forEach((p) => {
      if (p.game && p.game.trim()) {
        set.add(p.game.trim().toUpperCase());
      }
    });
    return Array.from(set);
  }, [products]);

  // Filter products based on search, game, and device filter
  const filteredProducts = products.filter((prod) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (prod.name || '').toLowerCase().includes(q);
      const matchCat = (prod.category || '').toLowerCase().includes(q);
      const matchGame = (prod.game || '').toLowerCase().includes(q);
      const matchFeatures = prod.features?.some((f) => f.toLowerCase().includes(q));
      if (!matchName && !matchCat && !matchGame && !matchFeatures) return false;
    }

    // 2. Games Filter
    if (selectedGame !== 'ALL GAMES') {
      const prodGame = (prod.game || '').toUpperCase();
      const prodName = (prod.name || '').toUpperCase();
      const prodCat = (prod.category || '').toUpperCase();

      if (selectedGame === 'FREEFIRE') {
        const isFF =
          prodGame.includes('FREEFIRE') ||
          prodGame.includes('FF') ||
          prodName.includes('FREEFIRE') ||
          prodName.includes('FF') ||
          prodCat.includes('FREEFIRE') ||
          prodCat.includes('FF') ||
          (!prodGame && !prodName.includes('8 BALL') && !prodName.includes('POOL'));
        if (!isFF) return false;
      } else if (selectedGame === '8 BAAL POOL' || selectedGame === '8 BALL POOL') {
        const is8Ball =
          prodGame.includes('8 BAAL') ||
          prodGame.includes('8 BALL') ||
          prodGame.includes('POOL') ||
          prodName.includes('8 BAAL') ||
          prodName.includes('8 BALL') ||
          prodName.includes('POOL') ||
          prodCat.includes('8 BALL');
        if (!is8Ball) return false;
      } else {
        const matchCustomGame =
          prodGame.includes(selectedGame) ||
          prodName.includes(selectedGame) ||
          prodCat.includes(selectedGame);
        if (!matchCustomGame) return false;
      }
    }

    // 3. Device Filter
    if (selectedDevice !== 'ALL Systems') {
      const prodDevice = (prod.deviceType || '').toUpperCase();
      const prodName = (prod.name || '').toUpperCase();
      const prodCat = (prod.category || '').toUpperCase();

      if (selectedDevice === 'ROOT + NONROOT') {
        const isAndroid =
          prodDevice.includes('NONROOT') ||
          prodDevice.includes('NON-ROOT') ||
          prodDevice.includes('ROOT') ||
          prodDevice.includes('ANDROID') ||
          prodName.includes('NONROOT') ||
          prodName.includes('NON-ROOT') ||
          prodCat.includes('NON-ROOT') ||
          (!prodDevice && !prodName.includes('IOS'));
        if (!isAndroid) return false;
      } else if (selectedDevice === 'IOS') {
        const isIos =
          prodDevice.includes('IOS') ||
          prodDevice.includes('IPHONE') ||
          prodDevice.includes('IPAD') ||
          prodName.includes('IOS') ||
          prodCat.includes('IOS');
        if (!isIos) return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-4 pb-12" id="buy-keys-storefront-view">
      {/* 1. Reseller Balance Bar */}
      {!hideBalanceBar && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#161622] via-[#1b2238] to-[#161622] border border-[#00e5ff]/30 shadow-[0_0_20px_rgba(0,229,255,0.15)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00e5ff]/15 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff]">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                RESELLER BALANCE:
              </span>
              <span className="text-lg font-black font-mono text-emerald-400 text-glow-cyan">
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
          <button
            onClick={onOpenDeposit}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>+ Add Funds</span>
          </button>
        </div>
      )}

      {/* 2. SEARCH PRODUCT */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-black text-cyan-400 tracking-wider">
          <span>&gt;&gt;</span>
          <span className="text-gray-200">SEARCH PRODUCT</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="TYPE PRODUCT OR ITEM NAME TO SEARCH..."
            className="w-full pl-4 pr-10 py-3 rounded-2xl bg-[#12121c] border border-cyan-500/30 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,229,255,0.25)] text-xs text-white placeholder-gray-500 outline-none transition-all"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cyan-400">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* 3. FILTER DASHBOARD */}
      <div className="p-3.5 rounded-2xl bg-[#12121c] border border-white/10 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-black text-cyan-400 tracking-wider">
          <span>&gt;&gt;</span>
          <span className="text-gray-200">FILTER DASHBOARD</span>
        </div>

        {/* Games Filter */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">
            GAMES FILTER
          </span>
          <div className="grid grid-cols-3 gap-2">
            {availableGames.map((gameName) => {
              const isSelected = selectedGame === gameName;
              return (
                <button
                  key={gameName}
                  onClick={() => setSelectedGame(gameName)}
                  className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer truncate ${
                    isSelected
                      ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                      : 'bg-black/40 text-gray-400 border border-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {gameName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Device Filter */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">
            DEVICE FILTER
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'ALL Systems', label: 'ALL Systems' },
              { id: 'ROOT + NONROOT', label: 'ROOT + NONROOT' },
              { id: 'IOS', label: 'IOS' },
            ].map((d) => {
              const isSelected = selectedDevice === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDevice(d.id)}
                  className={`py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer truncate ${
                    isSelected
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/70 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                      : 'bg-black/40 text-gray-400 border border-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. RESELLER STORE / PARTNER RATES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-black text-cyan-400 tracking-wider">
            <span>&gt;&gt;</span>
            <span className="text-gray-200">RESELLER STORE / PARTNER RATES</span>
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
          <span className="text-[10px] font-bold text-gray-400 font-mono">
            {filteredProducts.length} Items
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#12121c] border border-white/10 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Products Found</h4>
            <p className="text-xs text-gray-400">
              Try resetting filters or searching with a different term.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGame('ALL GAMES');
                  setSelectedDevice('ALL Systems');
                }}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer"
              >
                Reset Filters
              </button>
              {onRefreshProducts && (
                <button
                  onClick={onRefreshProducts}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reload Catalog</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isExpanded = Boolean(expandedCards[product.id]);
            const isService = product.category === 'BOT SERVICES';
            const isHighlighted = highlightedProductId === product.id;

            return (
              <motion.div
                key={product.id}
                id={`product-card-${product.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-3xl bg-[#12121c] border p-3.5 space-y-3 relative overflow-hidden transition-all duration-500 ${
                  isHighlighted
                    ? 'border-[#00e5ff] shadow-[0_0_40px_rgba(0,229,255,0.45)] ring-2 ring-[#00e5ff]/50'
                    : 'border-purple-500/40 shadow-[0_0_30px_rgba(139,92,246,0.15)]'
                }`}
              >
                {/* Deep Link Active Highlight Banner */}
                {isHighlighted && (
                  <div className="bg-gradient-to-r from-cyan-950 via-cyan-900/60 to-purple-950 border border-cyan-400/60 text-cyan-300 px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>DIRECT PRODUCT LINK TARGET</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-extrabold">Selected</span>
                  </div>
                )}

                {/* Banner / Media Container */}
                {(() => {
                  const coverImage =
                    product.imageUrl ||
                    (product.videoUrl && isYouTubeUrl(product.videoUrl)
                      ? getYouTubeThumbnailUrl(product.videoUrl, 'hq')
                      : null);
                  return (
                    <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-gradient-to-br from-indigo-950/80 via-[#0a0a0f] to-purple-950/80 border border-white/10 flex items-center justify-center group">
                      {coverImage && (
                        <img
                          src={coverImage}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#12121c] via-black/40 to-black/60" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-400/60 text-[9px] font-extrabold text-cyan-300 tracking-wider uppercase backdrop-blur-md">
                          {product.deviceType || 'ROOT + NONROOT'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-950/90 border border-purple-400/60 text-[9px] font-extrabold text-purple-300 tracking-wider uppercase backdrop-blur-md">
                          {product.game || 'FREEFIRE'}
                        </span>
                      </div>

                      {/* Stock Status Badge Top Right */}
                      <div className="absolute top-2.5 right-2.5 z-10">
                        {(product.keys || []).length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-[9px] font-extrabold text-emerald-300 tracking-wider uppercase backdrop-blur-md flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {(product.keys || []).length} In Stock
                          </span>
                        ) : product.api1Restock?.remoteProductId || product.api2Restock?.remoteProductId ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-950/90 border border-cyan-500/60 text-[9px] font-extrabold text-cyan-300 tracking-wider uppercase backdrop-blur-md flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 text-cyan-400" />
                            Live API Delivery
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-950/90 border border-rose-500/70 text-[9px] font-extrabold text-rose-300 tracking-wider uppercase backdrop-blur-md flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
                            OUT OF STOCK
                          </span>
                        )}
                      </div>

                      {/* Center Play Icon Button */}
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          setActiveVideoModal({
                            title: product.name,
                            videoUrl: product.videoUrl,
                          })
                        }
                        className="relative z-10 w-12 h-12 rounded-full bg-black/70 border-2 border-cyan-400 text-cyan-400 flex items-center justify-center shadow-[0_0_25px_rgba(0,229,255,0.7)] cursor-pointer backdrop-blur-md transition-all group-hover:border-white group-hover:text-white"
                        title="Watch Video Tutorial & Proof"
                      >
                        <Play className="w-5 h-5 ml-0.5 fill-cyan-400 group-hover:fill-white transition-colors" />
                      </motion.button>
                    </div>
                  );
                })()}

                {/* Product Title and Quick Share Link */}
                <div className="flex items-center justify-between pt-0.5 gap-2">
                  <div className="w-7" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white text-center flex-1">
                    {product.name}
                  </h3>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/?product=${product.id}`;
                      navigator.clipboard.writeText(url);
                      setCopiedProductLinkId(product.id);
                      setTimeout(() => setCopiedProductLinkId(null), 2000);
                    }}
                    title="Copy Direct Website Link"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-300 border border-white/5 hover:border-cyan-400/40 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedProductLinkId === product.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Feature Pills */}
                {product.features && product.features.length > 0 && (
                  <div className="space-y-1.5">
                    {product.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/40 flex items-center gap-2 text-xs font-extrabold text-cyan-300 shadow-sm"
                      >
                        <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30 shrink-0" />
                        <span className="truncate uppercase">{feat}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dual Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setActiveUpdateModal({ product })}
                    className="py-2.5 px-2 rounded-xl bg-black/50 hover:bg-white/5 border border-white/10 hover:border-cyan-400/40 text-[11px] font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>CHECK UPDATE FILE</span>
                  </button>

                  <button
                    onClick={() =>
                      setActiveVideoModal({
                        title: product.name,
                        videoUrl: product.videoUrl,
                      })
                    }
                    className="py-2.5 px-2 rounded-xl bg-black/50 hover:bg-white/5 border border-white/10 hover:border-purple-400/40 text-[11px] font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20" />
                    <span>CHECK VIDEO/FEEDBACK</span>
                  </button>
                </div>

                {/* Special service CTA vs Key Accordion */}
                {isService ? (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setActiveUpdateModal({ product })}
                        className="py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-[11px] font-bold text-purple-300 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>How to Setup / Use</span>
                      </button>
                      <button
                        onClick={() => toggleAccordion(product.id)}
                        className="py-2.5 rounded-xl bg-gradient-to-r from-[#ff0080] to-rose-600 hover:from-[#ff0080]/90 hover:to-rose-500 text-white font-extrabold text-[11px] shadow-[0_0_15px_rgba(255,0,128,0.4)] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Check Now Site</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Main Big Button: BUY RESELLER KEY */
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => toggleAccordion(product.id)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-700 hover:from-purple-600 hover:via-indigo-500 hover:to-purple-600 border border-purple-400/50 text-white font-black text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>BUY RESELLER KEY</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </motion.button>
                )}

                {/* Accordion Plan Rates List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-2.5 pt-2 border-t border-white/10"
                    >
                      {/* Coupon / Promo Code Input Box */}
                      <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 space-y-1.5">
                        {appliedCoupons[product.id] ? (
                          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs">
                            <div className="flex items-center gap-1.5 text-emerald-300">
                              <Ticket className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-mono font-bold tracking-wider">
                                {appliedCoupons[product.id].code}
                              </span>
                              <span className="text-[11px] text-emerald-200">
                                ({appliedCoupons[product.id].discountPercent > 0
                                  ? `${appliedCoupons[product.id].discountPercent}% OFF`
                                  : `₹${appliedCoupons[product.id].discountFlat} FLAT OFF`})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCoupon(product.id)}
                              className="text-gray-400 hover:text-rose-400 p-0.5 cursor-pointer transition-colors"
                              title="Remove coupon"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="relative flex-1">
                                <Ticket className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  value={couponInputs[product.id] || ''}
                                  onChange={(e) =>
                                    setCouponInputs((prev) => ({
                                      ...prev,
                                      [product.id]: e.target.value.toUpperCase(),
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleApplyCoupon(product);
                                    }
                                  }}
                                  placeholder="Have a promo code? e.g. KALAM50"
                                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-black/80 border border-white/10 text-white font-mono uppercase text-xs focus:border-yellow-400 focus:outline-none"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleApplyCoupon(product)}
                                className="px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 font-bold text-xs transition-colors cursor-pointer shrink-0"
                              >
                                Apply
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap px-1 text-[10px] text-gray-400">
                              <span>Hot Promos:</span>
                              {['KALAM50', 'VIP20', 'FREEFIRE'].map((promo) => (
                                <button
                                  key={promo}
                                  type="button"
                                  onClick={() => {
                                    setCouponInputs((prev) => ({ ...prev, [product.id]: promo }));
                                    const firstPlanPrice = product.plans && product.plans[0] ? product.plans[0].price : 50;
                                    const result = validateCoupon(promo, firstPlanPrice);
                                    if (result.valid && result.coupon) {
                                      setAppliedCoupons((prev) => ({ ...prev, [product.id]: result.coupon! }));
                                      setCouponMessages((prev) => ({ ...prev, [product.id]: { text: result.message, isError: false } }));
                                    }
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-yellow-500/20 text-yellow-300/90 hover:text-yellow-200 border border-white/10 hover:border-yellow-500/30 font-mono transition-colors cursor-pointer"
                                >
                                  {promo}
                                </button>
                              ))}
                            </div>
                            {couponMessages[product.id] && (
                              <p
                                className={`text-[10px] px-1 font-medium ${
                                  couponMessages[product.id].isError
                                    ? 'text-rose-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {couponMessages[product.id].text}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {(product.plans || []).map((plan) => {
                        const qty = getQuantity(plan.id);
                        const planPrice = typeof plan.price === 'number' ? plan.price : 0;
                        const totalPrice = planPrice * qty;

                        // Calculate discount if coupon is applied
                        const activeCoupon = appliedCoupons[product.id];
                        let planDiscount = 0;
                        if (activeCoupon) {
                          if (activeCoupon.discountPercent && activeCoupon.discountPercent > 0) {
                            planDiscount = (totalPrice * activeCoupon.discountPercent) / 100;
                          } else if (activeCoupon.discountFlat && activeCoupon.discountFlat > 0) {
                            planDiscount = activeCoupon.discountFlat;
                          }
                          planDiscount = Math.min(totalPrice, Math.round(planDiscount * 100) / 100);
                        }
                        const finalPlanPrice = Math.max(0, Math.round((totalPrice - planDiscount) * 100) / 100);

                        const planStockKeys = (product.planKeys && product.planKeys[plan.id]) || product.keys || [];
                        const hasStock = planStockKeys.length > 0;
                        const hasApi = Boolean(product.api1Restock?.remoteProductId || product.api2Restock?.remoteProductId);
                        const isOutOfStock = !hasStock && !hasApi;

                        return (
                          <div
                            key={plan.id}
                            className={`p-2.5 rounded-2xl bg-black/70 border flex items-center justify-between gap-2 shadow-inner transition-all ${
                              isOutOfStock ? 'border-rose-500/20 bg-rose-950/10' : 'border-white/10'
                            }`}
                          >
                            {/* Left: Duration & Price */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-gray-300 block">
                                  {plan.duration}
                                </span>
                                {hasStock ? (
                                  <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded">
                                    {planStockKeys.length} In Stock
                                  </span>
                                ) : hasApi ? (
                                  <span className="text-[9px] text-cyan-400 font-mono font-bold bg-cyan-500/10 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                    <Zap className="w-2.5 h-2.5" /> API Delivery
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-rose-400 font-mono font-bold bg-rose-500/20 px-1.5 py-0.2 rounded">
                                    Out of Stock
                                  </span>
                                )}
                              </div>
                              <div className="flex items-baseline gap-1.5">
                                {activeCoupon && planDiscount > 0 ? (
                                  <>
                                    <span className="text-xs text-gray-500 line-through font-mono">
                                      {storeSettings?.currencySymbol || '₹'}{totalPrice.toFixed(2)}
                                    </span>
                                    <span className="text-sm font-black text-emerald-400 font-mono">
                                      {storeSettings?.currencySymbol || '₹'}{finalPlanPrice.toFixed(2)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-sm font-black text-white font-mono">
                                    {storeSettings?.currencySymbol || '₹'}{totalPrice.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Center: Quantity Counter */}
                            <div className="flex items-center bg-[#1a1a28] rounded-xl border border-white/10 p-1">
                              <button
                                onClick={() => updateQuantity(plan.id, -1)}
                                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-xs font-bold text-gray-300 hover:text-white cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-7 text-center font-mono font-bold text-xs text-white">
                                {qty}
                              </span>
                              <button
                                onClick={() => updateQuantity(plan.id, 1)}
                                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-xs font-bold text-gray-300 hover:text-white cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            {/* Right: Buy Button */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onPurchaseKey(product, plan, qty, activeCoupon)}
                              className={`px-4 py-2 rounded-xl font-black text-xs uppercase shadow-[0_0_15px_rgba(139,92,246,0.5)] cursor-pointer transition-all shrink-0 ${
                                isOutOfStock
                                  ? 'bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                              }`}
                            >
                              {isOutOfStock ? 'OUT OF STOCK' : 'BUY'}
                            </motion.button>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ==================== VIDEO DEMO & FEEDBACK MODAL ==================== */}
      <AnimatePresence>
        {activeVideoModal && (() => {
          const ytEmbedUrl = getYouTubeEmbedUrl(activeVideoModal.videoUrl);
          const isYouTube = isYouTubeUrl(activeVideoModal.videoUrl);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveVideoModal(null)}
                className="fixed inset-0 bg-black/85 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`relative z-50 w-full ${
                  isYouTube ? 'max-w-lg' : 'max-w-sm'
                } bg-[#161622] border border-cyan-500/40 rounded-3xl p-4 sm:p-5 shadow-[0_0_40px_rgba(0,229,255,0.35)] text-white space-y-3.5 transition-all`}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
                      <Play className="w-4 h-4 fill-red-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white truncate max-w-[220px] sm:max-w-[280px]">
                        {activeVideoModal.title}
                      </h3>
                      <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                        {isYouTube ? '▶ Live YouTube Video Player' : 'Video Demo & Gameplay Proof'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveVideoModal(null)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Video Content: YouTube Player or Fallback Box */}
                {ytEmbedUrl ? (
                  <div className="relative rounded-2xl bg-black border border-cyan-500/30 overflow-hidden aspect-video shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                    <iframe
                      src={ytEmbedUrl}
                      title={`${activeVideoModal.title} Video Guide`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="relative rounded-2xl bg-black/70 border border-white/10 aspect-video flex flex-col items-center justify-center p-4 text-center overflow-hidden group">
                    <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.5)] group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 ml-0.5 fill-cyan-400" />
                    </div>
                    <span className="text-xs font-bold text-white mt-2">
                      100% Anti-Ban Gameplay Proof & Test
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Full headshot calibration with safe bypass
                    </span>
                  </div>
                )}

                {/* Video Info Note */}
                <div className="space-y-1.5 text-xs text-gray-300">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-bold text-emerald-400 block">
                        Verified Gameplay & Setup Guide
                      </span>
                      <p className="text-[10.5px] text-gray-300">
                        Watch gameplay proof, features test, and configuration steps for safe ranked matchmaking.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    {activeVideoModal.videoUrl && (
                      <button
                        onClick={() => handleCopyVideoUrl(activeVideoModal.videoUrl || '')}
                        className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        {videoCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    )}

                    {isYouTube && activeVideoModal.videoUrl ? (
                      <a
                        href={activeVideoModal.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <span>Open in YouTube</span>
                        <ExternalLink className="w-3 h-3 text-red-400" />
                      </a>
                    ) : (
                      <a
                        href={activeVideoModal.videoUrl || storeSettings.paymentProofChannel || 'https://t.me/Kalam_Mods_Official'}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <span>Open Video Link</span>
                        <ExternalLink className="w-3 h-3 text-cyan-400" />
                      </a>
                    )}
                  </div>

                  <a
                    href={storeSettings.paymentProofChannel || 'https://t.me/Kalam_Mods_Official'}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#00b4d8] text-black font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.4)] cursor-pointer"
                  >
                    <span>Join Telegram Proofs Channel</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ==================== UPDATE FILE & DOWNLOAD MODAL ==================== */}
      <AnimatePresence>
        {activeUpdateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveUpdateModal(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-50 w-full max-w-sm bg-[#161622] border border-purple-500/40 rounded-3xl p-5 shadow-[0_0_35px_rgba(139,92,246,0.3)] text-white space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white truncate max-w-[200px]">
                      {activeUpdateModal.product.name}
                    </h3>
                    <span className="text-[10px] text-purple-400">Latest APK & Config Files</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveUpdateModal(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Version & Info Card */}
              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Current Version:</span>
                  <span className="font-mono font-bold text-emerald-400">v2.4.8 (Latest)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Compatibility:</span>
                  <span className="font-bold text-cyan-300">Android 9 to 15 (Non-Root)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Active & Undetected
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1.5 text-xs text-gray-300">
                <span className="font-bold text-white text-[11px] block uppercase">
                  Installation Steps:
                </span>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-gray-300">
                  <li>Download the official APK file from the button below.</li>
                  <li>Install without uninstalling original game (direct injector overlay).</li>
                  <li>Enter your purchased key code and grant overlay permission.</li>
                </ol>
              </div>

              <a
                href={activeUpdateModal.product.downloadUrl || storeSettings.paymentProofChannel || 'https://t.me/Kalam_Mods_Official'}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.5)] cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Update APK File</span>
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
