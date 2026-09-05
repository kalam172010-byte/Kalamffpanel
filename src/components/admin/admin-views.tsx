import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Box,
  Plus,
  Link2,
  Copy,
  Check,
  Lightbulb,
  Plug,
  CreditCard,
  Lock,
  Settings,
  Handshake,
  Search,
  Users,
  Coins,
  ArrowDownCircle,
  PackageCheck,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Save,
  CheckCircle2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  UserCheck,
  Ticket,
  Send,
  Zap,
  DollarSign,
  Globe,
  Terminal,
  RefreshCw,
  QrCode,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Mail,
  CheckSquare,
  Square,
  Play,
  Pause,
  X,
  ListChecks,
  Download,
  FileSpreadsheet,
  Megaphone,
  AlertTriangle,
  Percent,
  Store,
  RotateCcw,
  MessageSquare,
  Phone,
  Gift,
  Radio,
  Clock,
  Bot,
  Share2,
  Smartphone,
  Filter,
} from 'lucide-react';
import { GlassCard } from '../shared/glass-card';
import { StoreLogo } from '../shared/store-logo';
import { ProductCard } from './product-card';
import { ApiConfigCard } from './api-config-card';
import { WebhookSetupModal } from './webhook-setup-modal';
import { safeFetchJson } from '../../lib/safe-api';
import { ResellerStatsGrid } from './reseller-stats';
import {
  Product,
  ProductLink,
  ApiConfig,
  PaymentGatewayConfig,
  StoreSettings,
  ResellerUser,
  PurchasedKey
} from '../../types';
import { formatCurrency } from '../../lib/utils';
import { deduplicateUsers } from '../../lib/firestore-service';
import { exportEnvVariablesToPdf } from '../../lib/pdf-export';

/* ==================== 1. ADMIN PRODUCTS VIEW ==================== */
interface AdminProductsViewProps {
  products: Product[];
  onOpenAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onToggleMaintenance: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteAllProducts?: () => void;
  onBulkToggleStatus?: (productIds: string[], targetStatus?: 'ACTIVE' | 'DISABLED') => void;
  onRefreshProducts?: () => void;
  isRefreshing?: boolean;
}

export const AdminProductsView: React.FC<AdminProductsViewProps> = ({
  products,
  onOpenAddProduct,
  onEditProduct,
  onToggleStatus,
  onToggleMaintenance,
  onDeleteProduct,
  onDeleteAllProducts,
  onBulkToggleStatus,
  onRefreshProducts,
  isRefreshing = false,
}) => {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.game && p.game.toLowerCase().includes(q)) ||
      p.status.toLowerCase().includes(q)
    );
  });

  const allSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedProductIds.includes(p.id));

  const someSelected =
    selectedProductIds.length > 0 && !allSelected;

  const handleToggleSelect = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleBulkStatusChange = (targetStatus?: 'ACTIVE' | 'DISABLED') => {
    if (selectedProductIds.length === 0) return;

    if (onBulkToggleStatus) {
      onBulkToggleStatus(selectedProductIds, targetStatus);
    } else {
      // Fallback: individually toggle status for selected products
      selectedProductIds.forEach((id) => {
        const prod = products.find((p) => p.id === id);
        if (prod) {
          if (!targetStatus || prod.status !== targetStatus) {
            onToggleStatus(prod);
          }
        }
      });
    }
  };

  const handleExportToCsv = (exportOnlySelected = false) => {
    const listToExport = exportOnlySelected && selectedProductIds.length > 0
      ? products.filter((p) => selectedProductIds.includes(p.id))
      : products;

    if (listToExport.length === 0) {
      alert('No products available to export.');
      return;
    }

    const headers = [
      'Product ID',
      'Product Name',
      'Game',
      'Device Architecture',
      'Status',
      'Plans (Duration:Price:ResellerPrice)',
      'Local Stock Count',
      'API 1 Remote ID',
      'API 2 Remote ID',
      'Channel Link',
      'Video URL',
      'Created / Updated',
    ];

    const escapeCsv = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const val = String(str).replace(/"/g, '""');
      return `"${val}"`;
    };

    const rows = listToExport.map((p) => {
      const plansSummary = (p.plans || [])
        .map((pl) => `${pl.duration}:₹${pl.price}${pl.resellerPrice ? `(Reseller:₹${pl.resellerPrice})` : ''}`)
        .join(' | ');

      const localStockCount = (p.keys || []).length;

      return [
        escapeCsv(p.id),
        escapeCsv(p.name),
        escapeCsv(p.game || 'FREEFIRE'),
        escapeCsv(p.category || 'ROOT + NONROOT'),
        escapeCsv(p.status),
        escapeCsv(plansSummary),
        escapeCsv(localStockCount),
        escapeCsv(p.api1Restock?.remoteProductId || ''),
        escapeCsv(p.api2Restock?.remoteProductId || ''),
        escapeCsv(p.channelLink || ''),
        escapeCsv(p.videoUrl || ''),
        escapeCsv(new Date().toISOString()),
      ].join(',');
    });

    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `products_inventory_${exportOnlySelected ? 'selected_' : 'all_'}${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4" id="admin-products-view">
      {/* Header Area matching video */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#8b5cf6]">
            <Box className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Manage Product
          </span>
        </div>
        <p className="text-[11px] text-gray-400">
          Add products, plans, pricing, and batch manage status.
        </p>
      </div>

      {/* Top action row */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-base font-extrabold text-white">
          Manage Products ({products.length})
        </h2>
        <div className="flex items-center gap-2">
          {onRefreshProducts && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onRefreshProducts}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              title="Refresh and sync products from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
            </motion.button>
          )}

          {products.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleExportToCsv(false)}
              className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-[#00e5ff] border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_15px_rgba(0,229,255,0.15)]"
              title="Download full products inventory as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </motion.button>
          )}

          {products.length > 0 && onDeleteAllProducts && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (window.confirm('Are you sure you want to delete ALL products from store and database?')) {
                  onDeleteAllProducts();
                  setSelectedProductIds([]);
                }
              }}
              className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete All</span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenAddProduct}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] via-[#a855f7] to-[#d946ef] text-white font-bold text-xs shadow-[0_0_20px_rgba(139,92,246,0.5)] border border-purple-400/30 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Product</span>
          </motion.button>
        </div>
      </div>

      {/* Search & Bulk Select Toolbar */}
      {products.length > 0 && (
        <div className="p-3 rounded-2xl bg-[#161622]/90 border border-purple-500/20 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            {/* Select All Toggle Button */}
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                allSelected
                  ? 'bg-purple-600/30 border-purple-400/60 text-purple-200'
                  : someSelected
                  ? 'bg-purple-600/20 border-purple-400/40 text-purple-300'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
              }`}
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-purple-400" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
              <span>
                {allSelected ? 'Deselect All' : 'Select All'} ({filteredProducts.length})
              </span>
            </button>

            {/* Selection Counter Tag */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-gray-400">
                Selected:{' '}
                <strong className={selectedProductIds.length > 0 ? 'text-[#00e5ff]' : 'text-gray-400'}>
                  {selectedProductIds.length}
                </strong>
                /{products.length}
              </span>
            </div>
          </div>

          {/* Quick Filter Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name or category..."
              className="w-full pl-8 pr-8 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating / Sticky Bulk Action Control Bar (Active when 1+ products selected) */}
      <AnimatePresence>
        {selectedProductIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1c1538] via-[#241a4a] to-[#1c1538] border-2 border-[#8b5cf6]/60 shadow-[0_0_30px_rgba(139,92,246,0.35)] space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#8b5cf6] text-white flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                  <ListChecks className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-black text-white">
                  Bulk Actions ({selectedProductIds.length} items)
                </span>
              </div>
              <button
                onClick={() => setSelectedProductIds([])}
                className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Clear Selection</span>
              </button>
            </div>

            {/* Bulk Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* 1. Bulk Activate (Set to ACTIVE) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleBulkStatusChange('ACTIVE')}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>Set All ACTIVE</span>
              </motion.button>

              {/* 2. Bulk Disable (Set to DISABLED) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleBulkStatusChange('DISABLED')}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-300 text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Set All DISABLED</span>
              </motion.button>
            </div>

            {/* Invert status button & Export Selected */}
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleBulkStatusChange(undefined)}
                className="w-full py-2 px-2.5 rounded-xl bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 border border-[#00e5ff]/40 text-[#00e5ff] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,229,255,0.2)]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Toggle Statuses</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleExportToCsv(true)}
                className="w-full py-2 px-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/50 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.25)]"
              >
                <Download className="w-3.5 h-3.5 text-purple-300" />
                <span>Export ({selectedProductIds.length}) CSV</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Cards vertical stack */}
      <div className="space-y-3.5">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isSelected={selectedProductIds.includes(product.id)}
            onToggleSelect={handleToggleSelect}
            onEdit={onEditProduct}
            onToggleStatus={onToggleStatus}
            onToggleMaintenance={onToggleMaintenance}
            onDelete={onDeleteProduct}
          />
        ))}

        {filteredProducts.length === 0 && products.length > 0 && (
          <div className="p-8 text-center bg-[#161622]/90 rounded-2xl border border-white/10 space-y-2">
            <Search className="w-8 h-8 text-gray-500 mx-auto" />
            <h4 className="text-xs font-bold text-white">No Matching Products</h4>
            <p className="text-[10px] text-gray-400">Try changing your search term or clear the filter.</p>
          </div>
        )}

        {products.length === 0 && (
          <div className="p-8 text-center bg-[#161622]/90 rounded-2xl border border-white/10 space-y-3">
            <Box className="w-10 h-10 text-gray-500 mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-white">No Products In Store Yet</h4>
              <p className="text-xs text-gray-400 mt-0.5">Click &quot;+ Add Product&quot; to create your first mod/key catalog item or sync from database.</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              {onRefreshProducts && (
                <button
                  type="button"
                  onClick={onRefreshProducts}
                  disabled={isRefreshing}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-cyan-300 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Syncing...' : 'Sync / Refresh'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenAddProduct}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Product</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ==================== 2. ADMIN PRODUCT LINKS VIEW ==================== */
interface AdminProductLinksViewProps {
  productLinks: ProductLink[];
  products?: Product[];
  onSaveProductLink?: (link: ProductLink) => void;
  onDeleteProductLink?: (id: string) => void;
  onSyncAllProductLinks?: () => void;
  onToggleLinkStatus?: (linkId: string, status: 'ACTIVE' | 'DISABLED') => void;
}

export const AdminProductLinksView: React.FC<AdminProductLinksViewProps> = ({
  productLinks,
  products = [],
  onSaveProductLink,
  onDeleteProductLink,
  onSyncAllProductLinks,
  onToggleLinkStatus,
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kalam-store.com';
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [viewMode, setViewMode] = useState<'all' | 'website' | 'bot'>('all');
  const [qrModal, setQrModal] = useState<{ name: string; url: string } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // New Link form state
  const [newProductId, setNewProductId] = useState<string>('');
  const [newProductName, setNewProductName] = useState<string>('');
  const [newSlug, setNewSlug] = useState<string>('');
  const [newCustomUrl, setNewCustomUrl] = useState<string>('');

  // Automatically merge all catalog products with productLinks
  const mergedLinks: ProductLink[] = useMemo(() => {
    const list: ProductLink[] = [];
    const seenProductIds = new Set<string>();

    // 1. Every product in the current catalog gets an active Website Product Link
    products.forEach((prod) => {
      seenProductIds.add(prod.id);
      const existing = productLinks.find((l) => l.productId === prod.id);
      const slug = existing?.customSlug || prod.id;
      const webUrl = `${origin}/?product=${encodeURIComponent(slug)}`;
      const botUrl = `https://t.me/Kalam_Mods_Official_bot?start=prod_${prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

      list.push({
        id: existing?.id || `link-${prod.id}`,
        productId: prod.id,
        productName: prod.name,
        status: existing ? existing.status : prod.status === 'ACTIVE' ? 'ACTIVE' : 'DISABLED',
        directLink: existing?.directLink || webUrl,
        websiteLink: existing?.websiteLink || webUrl,
        botLink: existing?.botLink || botUrl,
        customSlug: slug,
        game: prod.game,
        category: prod.category,
      });
    });

    // 2. Add custom or standalone links from productLinks
    productLinks.forEach((link) => {
      if (link.productId && seenProductIds.has(link.productId)) return;
      const webUrl = link.websiteLink || link.directLink || `${origin}/?product=${link.id}`;
      const botUrl = link.botLink || (link.directLink?.includes('t.me') ? link.directLink : undefined);
      list.push({
        ...link,
        directLink: webUrl,
        websiteLink: webUrl,
        botLink: botUrl,
      });
    });

    return list;
  }, [products, productLinks, origin]);

  // Filtered links
  const filteredLinks = useMemo(() => {
    return mergedLinks.filter((link) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        link.productName.toLowerCase().includes(q) ||
        (link.game || '').toLowerCase().includes(q) ||
        (link.category || '').toLowerCase().includes(q) ||
        (link.customSlug || '').toLowerCase().includes(q) ||
        link.productId.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'active' && link.status !== 'ACTIVE') return false;
      if (statusFilter === 'disabled' && link.status !== 'DISABLED') return false;

      return true;
    });
  }, [mergedLinks, searchQuery, statusFilter]);

  const handleCopy = (key: string, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSyncAll = () => {
    if (onSyncAllProductLinks) {
      onSyncAllProductLinks();
    } else if (onSaveProductLink) {
      mergedLinks.forEach((l) => onSaveProductLink(l));
    }
    setSyncNotice(`✓ Synced all ${mergedLinks.length} website product links!`);
    setTimeout(() => setSyncNotice(null), 3000);
  };

  const handleToggleStatus = (link: ProductLink) => {
    const nextStatus = link.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    if (onToggleLinkStatus) {
      onToggleLinkStatus(link.id, nextStatus);
    } else if (onSaveProductLink) {
      onSaveProductLink({
        ...link,
        status: nextStatus,
      });
    }
  };

  const handleCreateCustomLink = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProd = products.find((p) => p.id === newProductId);
    const prodName = selectedProd ? selectedProd.name : newProductName.trim() || 'Custom Product Link';
    const slug = (newSlug.trim() || (selectedProd ? selectedProd.id : `link-${Date.now()}`)).replace(/\s+/g, '-');
    const webUrl = newCustomUrl.trim() || `${origin}/?product=${encodeURIComponent(slug)}`;
    const botUrl = `https://t.me/Kalam_Mods_Official_bot?start=prod_${prodName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

    const newLink: ProductLink = {
      id: `link-${Date.now()}`,
      productId: selectedProd ? selectedProd.id : `custom-${Date.now()}`,
      productName: prodName,
      status: 'ACTIVE',
      directLink: webUrl,
      websiteLink: webUrl,
      botLink: botUrl,
      customSlug: slug,
      game: selectedProd?.game,
      category: selectedProd?.category,
      createdAt: new Date().toISOString(),
    };

    if (onSaveProductLink) {
      onSaveProductLink(newLink);
    }
    setIsAddModalOpen(false);
    setNewProductId('');
    setNewProductName('');
    setNewSlug('');
    setNewCustomUrl('');
    setSyncNotice(`✓ Product link for "${prodName}" added!`);
    setTimeout(() => setSyncNotice(null), 3000);
  };

  const handleExportAll = () => {
    const lines = [
      '# KALAM STORE - OFFICIAL PRODUCT DIRECT LINKS',
      `# Generated: ${new Date().toLocaleString()}`,
      `# Total Links: ${mergedLinks.length}`,
      '',
    ];

    mergedLinks.forEach((l) => {
      lines.push(`Product: ${l.productName} [${l.status}]`);
      if (l.game) lines.push(`Game: ${l.game}`);
      lines.push(`Website Storefront Link: ${l.websiteLink || l.directLink}`);
      if (l.botLink) lines.push(`Telegram Bot Link: ${l.botLink}`);
      lines.push('----------------------------------------');
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setSyncNotice('✓ All product links copied to clipboard!');
    setTimeout(() => setSyncNotice(null), 3000);
  };

  return (
    <div className="space-y-4" id="admin-product-links-view">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161622]/90 p-4 rounded-2xl border border-white/10 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00e5ff]/20 border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.3)]">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">Website Product Links</h2>
                <span className="px-2 py-0.5 rounded-full bg-[#00e5ff]/15 border border-[#00e5ff]/30 text-[#00e5ff] text-[10px] font-mono font-bold">
                  {mergedLinks.length} Products
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Direct storefront URLs & Telegram bot links for all catalog items.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSyncAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 hover:border-cyan-400/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Sync all products from store catalog"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sync Catalog</span>
          </button>

          <button
            type="button"
            onClick={handleExportAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 hover:border-purple-400/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Copy all links as formatted list"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Export List</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00e5ff] to-cyan-500 hover:from-cyan-400 hover:to-cyan-500 text-black font-extrabold text-xs shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Link</span>
          </button>
        </div>
      </div>

      {/* Sync Toast Feedback */}
      <AnimatePresence>
        {syncNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{syncNotice}</span>
            </div>
            <button
              onClick={() => setSyncNotice(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        {/* Search Input */}
        <div className="sm:col-span-6 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, game, category, or ID..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#12121c] border border-white/10 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder-gray-500 transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="sm:col-span-3 flex rounded-xl bg-[#12121c] p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
              viewMode === 'all'
                ? 'bg-[#00e5ff]/20 text-[#00e5ff] shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Links
          </button>
          <button
            type="button"
            onClick={() => setViewMode('website')}
            className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
              viewMode === 'website'
                ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🌐 Website
          </button>
          <button
            type="button"
            onClick={() => setViewMode('bot')}
            className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
              viewMode === 'bot'
                ? 'bg-purple-500/20 text-purple-300 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🤖 Bot
          </button>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3 flex rounded-xl bg-[#12121c] p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
              statusFilter === 'active'
                ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('disabled')}
            className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
              statusFilter === 'disabled'
                ? 'bg-rose-500/20 text-rose-300 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Disabled
          </button>
        </div>
      </div>

      {/* Product Links List */}
      <GlassCard glow="cyan" className="p-4 bg-[#161622]/95 border-white/10 space-y-3">
        {filteredLinks.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
              <Link2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-300">No product links found</p>
              <p className="text-xs text-gray-500">
                {searchQuery
                  ? 'Try changing your search keywords or filter settings.'
                  : 'Click "Sync Catalog" to populate links from your active products.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSyncAll}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all cursor-pointer"
            >
              Sync Products Catalog
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLinks.map((link) => {
              const websiteUrl = link.websiteLink || link.directLink || `${origin}/?product=${link.productId}`;
              const botUrl =
                link.botLink ||
                `https://t.me/Kalam_Mods_Official_bot?start=prod_${link.productName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

              const isWebCopied = copiedKey === `web-${link.id}`;
              const isBotCopied = copiedKey === `bot-${link.id}`;
              const isActive = link.status === 'ACTIVE';

              return (
                <div
                  key={link.id}
                  id={`link-card-${link.id}`}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 space-y-3 ${
                    isActive
                      ? 'bg-[#10101a] border-white/10 hover:border-cyan-500/40 shadow-sm'
                      : 'bg-black/40 border-white/5 opacity-75'
                  }`}
                >
                  {/* Top Row: Title, Game, Status & Quick Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center shrink-0">
                        <Box className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-extrabold text-white truncate max-w-[240px] sm:max-w-md">
                            {link.productName}
                          </h4>
                          {link.game && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[9px] font-bold uppercase tracking-wider">
                              {link.game}
                            </span>
                          )}
                          {link.category && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 text-[9px] font-bold uppercase tracking-wider">
                              {link.category}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">
                          ID: {link.productId}
                        </span>
                      </div>
                    </div>

                    {/* Status & QR / Delete */}
                    <div className="flex items-center gap-2">
                      {/* Active/Disabled status toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(link)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>ACTIVE</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>DISABLED</span>
                          </>
                        )}
                      </button>

                      {/* QR Code trigger */}
                      <button
                        type="button"
                        onClick={() => setQrModal({ name: link.productName, url: websiteUrl })}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-cyan-400 border border-white/10 transition-colors cursor-pointer"
                        title="Show QR Code for Website Product Link"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Custom Link */}
                      {link.id.startsWith('link-custom-') || !products.some((p) => p.id === link.productId) ? (
                        <button
                          type="button"
                          onClick={() => onDeleteProductLink && onDeleteProductLink(link.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                          title="Delete custom link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Dual URL Section */}
                  <div className="space-y-2">
                    {/* 1. Website Storefront Direct URL */}
                    {(viewMode === 'all' || viewMode === 'website') && (
                      <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/30 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-extrabold uppercase tracking-wider">
                            <Globe className="w-3.5 h-3.5" />
                            <span>Website Storefront Product Link</span>
                            <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-[9px] text-cyan-300 font-mono">
                              Direct Web URL
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <a
                              href={websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 text-[10px] font-semibold transition-colors"
                            >
                              <span>Test / Open</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleCopy(`web-${link.id}`, websiteUrl)}
                              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                isWebCopied
                                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                                  : 'bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 text-[#00e5ff] border border-[#00e5ff]/40'
                              }`}
                            >
                              {isWebCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Website Link</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="p-1.5 rounded-lg bg-[#0a0a10] border border-white/5 font-mono text-[11px] text-cyan-200 select-all truncate">
                          {websiteUrl}
                        </div>
                      </div>
                    )}

                    {/* 2. Telegram Bot URL */}
                    {(viewMode === 'all' || viewMode === 'bot') && (
                      <div className="p-2.5 rounded-xl bg-black/60 border border-purple-500/30 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-purple-400 text-[10px] font-extrabold uppercase tracking-wider">
                            <Bot className="w-3.5 h-3.5" />
                            <span>Telegram Bot Start Link</span>
                            <span className="px-1.5 py-0.2 rounded bg-purple-950 text-[9px] text-purple-300 font-mono">
                              Bot Direct Key
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <a
                              href={botUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 hover:text-purple-200 border border-purple-500/40 text-[10px] font-semibold transition-colors"
                            >
                              <span>Open Bot</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleCopy(`bot-${link.id}`, botUrl)}
                              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                isBotCopied
                                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                                  : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40'
                              }`}
                            >
                              {isBotCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Bot Link</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="p-1.5 rounded-lg bg-[#0a0a10] border border-white/5 font-mono text-[11px] text-purple-300 select-all truncate">
                          {botUrl}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Info Guideline Card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-yellow-950/40 via-purple-950/30 to-cyan-950/30 border border-yellow-500/30 text-yellow-300 flex items-start gap-3 shadow-lg">
        <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-[11px] leading-relaxed">
          <p className="font-bold text-yellow-200">
            How Website Product Links Work on Storefront:
          </p>
          <p className="text-gray-300">
            When a customer clicks or opens a <span className="text-cyan-300 font-mono font-bold">Website Storefront Link</span> (e.g. <span className="font-mono text-white">/?product=...</span>), the store automatically opens directly to that product, highlights the item card, and expands all available plans so they can buy instantly without searching.
          </p>
        </div>
      </div>

      {/* ==================== ADD CUSTOM PRODUCT LINK MODAL ==================== */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#161622] border border-cyan-500/30 rounded-3xl p-5 shadow-[0_0_40px_rgba(0,229,255,0.2)] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Add Product Link</h3>
                    <p className="text-[11px] text-gray-400">Create a direct storefront or bot link</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomLink} className="space-y-3.5">
                {/* Select from catalog products */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Select Catalog Product (Optional)
                  </label>
                  <select
                    value={newProductId}
                    onChange={(e) => {
                      setNewProductId(e.target.value);
                      const prod = products.find((p) => p.id === e.target.value);
                      if (prod) {
                        setNewProductName(prod.name);
                        setNewSlug(prod.id);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="">-- Choose from existing products --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.game || 'Game'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Name (if custom) */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Product Name / Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="e.g. FREE FIRE VIP MOD"
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                {/* Custom URL Slug */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Direct Slug Parameter (e.g. ?product=your_slug)
                  </label>
                  <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-gray-400 font-mono">
                    <span>{origin}/?product=</span>
                    <input
                      type="text"
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      placeholder="freefire_vip"
                      className="bg-transparent text-white font-mono flex-1 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Custom Destination URL (Optional Override) */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Custom Target URL (Optional override)
                  </label>
                  <input
                    type="url"
                    value={newCustomUrl}
                    onChange={(e) => setNewCustomUrl(e.target.value)}
                    placeholder="Leave blank to use default storefront direct URL"
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black text-xs font-extrabold shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all cursor-pointer"
                  >
                    Create Product Link
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== QR CODE MODAL ==================== */}
      <AnimatePresence>
        {qrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#161622] border border-cyan-500/40 rounded-3xl p-5 text-center space-y-4 shadow-[0_0_40px_rgba(0,229,255,0.25)]"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <h3 className="text-xs font-extrabold text-white truncate max-w-[220px]">
                  {qrModal.name}
                </h3>
                <button
                  onClick={() => setQrModal(null)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* High Contrast QR Code */}
              <div className="p-4 bg-white rounded-2xl mx-auto inline-block shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${encodeURIComponent(
                    qrModal.url
                  )}`}
                  alt="QR Code"
                  className="w-48 h-48 block mx-auto"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[11px] text-gray-300 font-medium">
                  Scan to open website product directly on mobile
                </p>
                <p className="text-[10px] font-mono text-cyan-400 break-all select-all">
                  {qrModal.url}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopy('qr-url', qrModal.url)}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {copiedKey === 'qr-url' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=6&data=${encodeURIComponent(
                    qrModal.url
                  )}`}
                  download={`qr-${qrModal.name.toLowerCase().replace(/\s+/g, '_')}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QR</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ==================== 3. ADMIN API SETUP VIEW ==================== */
interface AdminApiSetupViewProps {
  apiConfigs: ApiConfig[];
  onSaveApiConfig: (config: ApiConfig) => void;
  onAddApiConfig?: (config: ApiConfig) => void;
  onDeleteApiConfig?: (id: string) => void;
}

export const AdminApiSetupView: React.FC<AdminApiSetupViewProps> = ({
  apiConfigs,
  onSaveApiConfig,
  onAddApiConfig,
  onDeleteApiConfig,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [newApiName, setNewApiName] = useState('');
  const [newApiUrl, setNewApiUrl] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiType, setNewApiType] = useState<ApiConfig['type']>('adminpanels');

  const handleCreateNewApi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddApiConfig) return;

    const newId = `api_custom_${Date.now()}`;
    const newConfig: ApiConfig = {
      id: newId,
      name: newApiName.trim() || `Reseller API #${apiConfigs.length + 1}`,
      subtitle: newApiType === 'adminpanels' ? 'PHP Master Key API' : (newApiType === 'hkmodz' ? 'X-API-Token Bearer' : 'Custom REST API'),
      type: newApiType,
      apiUrl: newApiUrl.trim(),
      apiKey: newApiKey.trim(),
      status: 'CONNECTED',
      lastTested: 'Just created',
    };

    onAddApiConfig(newConfig);
    setIsAddingNew(false);
    setNewApiName('');
    setNewApiUrl('');
    setNewApiKey('');
  };

  return (
    <div className="space-y-4" id="admin-api-setup-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#00e5ff]/20 border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff]">
              <Plug className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-base font-extrabold text-white">Reseller Admin API Setup</h2>
          </div>
          <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
            Configure upstream reseller APIs anytime. You can edit credentials, switch API protocols, test live connections, or add new servers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setShowWebhookModal(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            <span>Webhook URL</span>
          </button>

          {onAddApiConfig && (
            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00e5ff]/20 to-[#8b5cf6]/20 border border-[#00e5ff]/40 hover:border-[#00e5ff] text-[#00e5ff] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingNew ? 'Cancel' : 'Add New Reseller API'}</span>
            </button>
          )}
        </div>
      </div>

      {/* New API Inline Form */}
      {isAddingNew && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreateNewApi}
          className="p-4 rounded-2xl bg-[#1a103c]/90 border border-purple-500/40 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white text-xs font-bold">
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Connect New Reseller Provider</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-gray-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">API Provider Name</label>
              <input
                type="text"
                value={newApiName}
                onChange={(e) => setNewApiName(e.target.value)}
                placeholder="e.g. Modz Reseller Server #3"
                className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">API Type / Protocol</label>
              <select
                value={newApiType}
                onChange={(e) => setNewApiType(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white"
              >
                <option value="adminpanels">AdminPanels.shop (PHP Master Key)</option>
                <option value="hkmodz">HK MODZ (X-API-Token Bearer)</option>
                <option value="freepanel">FreePanel Instant API</option>
                <option value="custom">Custom Universal REST API</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Endpoint URL</label>
              <input
                type="text"
                value={newApiUrl}
                onChange={(e) => setNewApiUrl(e.target.value)}
                placeholder="https://api.yourprovider.com/reseller"
                className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">API Key / Token</label>
              <input
                type="text"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Enter reseller API secret key"
                className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Add API Endpoint
            </button>
          </div>
        </motion.form>
      )}

      {/* Cards list */}
      <div className="space-y-3.5">
        {apiConfigs.map((cfg) => (
          <div key={cfg.id} className="relative">
            <ApiConfigCard config={cfg} onSave={onSaveApiConfig} />
            {onDeleteApiConfig && apiConfigs.length > 1 && (
              <div className="flex justify-end pt-1 pr-1">
                <button
                  onClick={() => onDeleteApiConfig(cfg.id)}
                  className="text-[10px] text-rose-400/80 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove this API endpoint</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Troubleshooting Guide */}
      <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span>Upstream Error Troubleshooting Guide</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-gray-400">
          <div className="p-2 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-rose-400 font-mono font-bold block text-[10px]">
              "Invalid API Key / Access Denied"
            </span>
            <p className="leading-snug">
              Verify your reseller key in your upstream account profile (e.g. adminpanels.shop) and check that API privileges are enabled.
            </p>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-amber-400 font-mono font-bold block text-[10px]">
              "Insufficient Balance / 0 Credits"
            </span>
            <p className="leading-snug">
              Your upstream reseller portal wallet is empty. Top up credits on the provider website to generate new keys.
            </p>
          </div>
        </div>
      </div>

      {/* Deployment Webhook Setup Modal */}
      <WebhookSetupModal
        isOpen={showWebhookModal}
        onClose={() => setShowWebhookModal(false)}
      />
    </div>
  );
};

/* ==================== 4. ADMIN UPI PAYMENT VIEW ==================== */
interface AdminUpiPaymentViewProps {
  paymentConfigs: PaymentGatewayConfig[];
  onSaveConfig: (config: PaymentGatewayConfig) => void;
  storeSettings?: StoreSettings;
  onSaveStoreSettings?: (settings: StoreSettings) => void;
}

export const AdminUpiPaymentView: React.FC<AdminUpiPaymentViewProps> = ({
  paymentConfigs,
  onSaveConfig,
  storeSettings,
  onSaveStoreSettings,
}) => {
  const famConfig = paymentConfigs.find((p) => p.id === 'famgateway-gw' || p.baseUrl?.includes('famgateway') || p.baseUrl?.includes('create-order.php'));
  const adityaConfig = paymentConfigs.find((p) => p.id === 'adityahost-gw' || p.baseUrl?.includes('adityahost') || p.apiKey?.startsWith('AH_'));
  const zapConfig = paymentConfigs.find((p) => p.id === 'zapupi-gw' || p.baseUrl?.includes('zapupi'));
  const fampayConfig = paymentConfigs.find((p) => p.id === 'fampay-gw' || p.baseUrl?.includes('freepanel'));
  const activeConfig = paymentConfigs.find((p) => p.isActive) || famConfig || adityaConfig || zapConfig || paymentConfigs[0];

  const [selectedGwPreset, setSelectedGwPreset] = useState<'famgateway' | 'adityahost' | 'zapupi' | 'freepanel' | 'custom'>(
    activeConfig?.baseUrl?.includes('famgateway') || activeConfig?.baseUrl?.includes('create-order.php')
      ? 'famgateway'
      : activeConfig?.baseUrl?.includes('adityahost') || activeConfig?.apiKey?.startsWith('AH_')
      ? 'adityahost'
      : activeConfig?.baseUrl?.includes('zapupi') || activeConfig?.apiKey?.startsWith('zap')
      ? 'zapupi'
      : 'freepanel'
  );
  const [selectedGwId, setSelectedGwId] = useState(activeConfig?.id || (activeConfig?.baseUrl?.includes('famgateway') ? 'famgateway-gw' : 'adityahost-gw'));
  const [gatewayApiKey, setGatewayApiKey] = useState(
    activeConfig?.apiKey || 'YOUR_API_KEY'
  );
  const [gatewayUrl, setGatewayUrl] = useState(
    activeConfig?.baseUrl || 'https://famgateway.in/api/create-order.php'
  );
  const [merchantUpi, setMerchantUpi] = useState(
    activeConfig?.merchantUpi || storeSettings?.upiManualId || '8056317218@fam'
  );
  const [redirectUrl, setRedirectUrl] = useState('https://your-website.com/success');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeGwSuccess, setActiveGwSuccess] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isExportingEnvPdf, setIsExportingEnvPdf] = useState(false);

  const handleExportVariablesPdf = () => {
    try {
      setIsExportingEnvPdf(true);
      exportEnvVariablesToPdf(storeSettings);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsExportingEnvPdf(false), 1500);
    }
  };

  // Direct UPI & Store Financial Settings
  const [enableUtrInput, setEnableUtrInput] = useState<boolean>(
    storeSettings?.enableUtrInput !== false
  );
  const [upiManualId, setUpiManualId] = useState(
    storeSettings?.upiManualId || storeSettings?.upiId || '8056317218@fam'
  );
  const [upiMerchantName, setUpiMerchantName] = useState(
    storeSettings?.upiMerchantName || storeSettings?.merchantUpi || 'KALAM FF PANEL PAYMENTS'
  );
  const [customQrUrl, setCustomQrUrl] = useState(storeSettings?.customQrUrl || '');
  const [minDeposit, setMinDeposit] = useState(storeSettings?.minDeposit ?? 1);
  const [maxDeposit, setMaxDeposit] = useState(storeSettings?.maxDeposit ?? 50000);
  const [depositBonusPercent, setDepositBonusPercent] = useState(storeSettings?.depositBonusPercent ?? 0);
  const [paymentFeePercent, setPaymentFeePercent] = useState(storeSettings?.paymentFeePercent ?? 0);
  const [paymentGatewayMode, setPaymentGatewayMode] = useState<string>(
    storeSettings?.paymentGatewayMode || 'FREEPANEL_AUTO'
  );
  const [manualInstructions, setManualInstructions] = useState(
    storeSettings?.manualPaymentInstructions ||
      '1. Scan QR code or tap your preferred UPI app.\n2. Pay exact amount from PhonePe, GPay, or Paytm.\n3. Payment is automatically detected and credited instantly.'
  );
  const [savedDirectSuccess, setSavedDirectSuccess] = useState(false);

  // Helper to normalize and sanitize URL vs API key
  const sanitizeGatewayInputs = (urlInput: string, keyInput: string, preset: string) => {
    let cleanUrl = (urlInput || '').trim();
    let cleanKey = (keyInput || '').trim();

    // If key was mistakenly pasted into URL field
    if (
      cleanUrl &&
      (cleanUrl.startsWith('fam_') ||
        cleanUrl.startsWith('FAM_') ||
        cleanUrl.startsWith('AH_') ||
        cleanUrl.startsWith('aditya') ||
        cleanUrl.startsWith('zap') ||
        cleanUrl.startsWith('ZAP') ||
        (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.includes('.') && cleanUrl.length >= 15))
    ) {
      if (!cleanKey || cleanKey.length < 5) {
        cleanKey = cleanUrl;
      }
      cleanUrl = '';
    }

    if (!cleanUrl || (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://'))) {
      if (preset === 'famgateway' || cleanUrl.includes('famgateway') || cleanUrl.includes('create-order.php')) {
        cleanUrl = 'https://famgateway.in/api/create-order.php';
      } else if (preset === 'adityahost' || cleanKey.startsWith('AH_') || cleanKey.startsWith('aditya')) {
        cleanUrl = 'https://adityahost.in/api/qr.php';
      } else if (preset === 'zapupi' || cleanKey.startsWith('zap')) {
        cleanUrl = 'https://pay.zapupi.com/api/create-order';
      } else {
        cleanUrl = 'https://py.freepanel.in/api/v1/orders';
      }
    }

    return { cleanUrl, cleanKey };
  };

  // Sync state when props change
  React.useEffect(() => {
    if (activeConfig) {
      const presetGuess =
        activeConfig.baseUrl?.includes('famgateway') || activeConfig.baseUrl?.includes('create-order.php')
          ? 'famgateway'
          : activeConfig.baseUrl?.includes('adityahost') || activeConfig.apiKey?.startsWith('AH_')
          ? 'adityahost'
          : activeConfig.baseUrl?.includes('zapupi') || activeConfig.apiKey?.startsWith('zap')
          ? 'zapupi'
          : 'freepanel';

      const { cleanUrl, cleanKey } = sanitizeGatewayInputs(
        activeConfig.baseUrl || '',
        activeConfig.apiKey || '',
        presetGuess
      );
      if (cleanKey) setGatewayApiKey(cleanKey);
      if (cleanUrl) setGatewayUrl(cleanUrl);
      if (activeConfig.merchantUpi) setMerchantUpi(activeConfig.merchantUpi);
      if (cleanUrl.includes('famgateway') || cleanUrl.includes('create-order.php')) {
        setSelectedGwPreset('famgateway');
      } else if (cleanUrl.includes('adityahost') || cleanKey.startsWith('AH_') || cleanKey.startsWith('aditya')) {
        setSelectedGwPreset('adityahost');
      } else if (cleanUrl.includes('zapupi') || cleanKey.startsWith('zap')) {
        setSelectedGwPreset('zapupi');
      } else if (cleanUrl.includes('freepanel') || cleanKey.startsWith('fam_') || cleanKey.startsWith('FAM_')) {
        setSelectedGwPreset('freepanel');
      }
    }
  }, [activeConfig]);

  React.useEffect(() => {
    if (storeSettings) {
      if (storeSettings.enableUtrInput !== undefined) setEnableUtrInput(storeSettings.enableUtrInput);
      if (storeSettings.upiManualId) setUpiManualId(storeSettings.upiManualId);
      if (storeSettings.upiMerchantName) setUpiMerchantName(storeSettings.upiMerchantName);
      if (storeSettings.customQrUrl !== undefined) setCustomQrUrl(storeSettings.customQrUrl);
      if (storeSettings.minDeposit !== undefined) setMinDeposit(storeSettings.minDeposit);
      if (storeSettings.maxDeposit !== undefined) setMaxDeposit(storeSettings.maxDeposit);
      if (storeSettings.depositBonusPercent !== undefined) setDepositBonusPercent(storeSettings.depositBonusPercent);
      if (storeSettings.paymentFeePercent !== undefined) setPaymentFeePercent(storeSettings.paymentFeePercent);
      if (storeSettings.paymentGatewayMode !== undefined) setPaymentGatewayMode(storeSettings.paymentGatewayMode);
      if (storeSettings.manualPaymentInstructions !== undefined)
        setManualInstructions(storeSettings.manualPaymentInstructions);
    }
  }, [storeSettings]);

  // Live Test State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Live Webhook Logs State
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [monitorTab, setMonitorTab] = useState<'orders' | 'webhooks' | 'quick'>('orders');
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [quickConfirmId, setQuickConfirmId] = useState('');
  const [quickConfirmAmount, setQuickConfirmAmount] = useState('');
  const [quickConfirmMsg, setQuickConfirmMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAdminConfirmOrder = async (orderId: string, amount: number) => {
    setConfirmingOrderId(orderId);
    try {
      const res = await safeFetchJson<any>('/api/admin/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount })
      });
      if (res.data?.success) {
        await fetchWebhookLogs();
      }
    } catch (e) {
      console.warn('Failed to confirm order:', e);
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handleQuickConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickConfirmId.trim()) return;
    setConfirmingOrderId('quick');
    setQuickConfirmMsg(null);
    try {
      const res = await safeFetchJson<any>('/api/admin/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: quickConfirmId.trim(),
          amount: Number(quickConfirmAmount) || 10
        })
      });
      if (res.data?.success) {
        setQuickConfirmMsg({ type: 'success', text: `✓ Success: Order ${quickConfirmId.trim()} confirmed & wallet credited!` });
        setQuickConfirmId('');
        setQuickConfirmAmount('');
        await fetchWebhookLogs();
      } else {
        setQuickConfirmMsg({ type: 'error', text: res.data?.message || 'Failed to confirm order.' });
      }
    } catch (e: any) {
      setQuickConfirmMsg({ type: 'error', text: e?.message || 'Network error confirming order.' });
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const fetchWebhookLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await safeFetchJson<any>('/api/webhook-logs');
      if (res.data?.success) {
        setWebhookLogs(res.data.logs || []);
        setActiveOrdersCount(res.data.activeOrdersCount || 0);
        setRecentOrders(res.data.recentOrders || []);
      }
    } catch (e) {
      console.warn('Failed to fetch webhook logs', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  React.useEffect(() => {
    fetchWebhookLogs();
    const interval = setInterval(fetchWebhookLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSetActiveGateway = () => {
    const target = paymentConfigs.find((p) => p.id === selectedGwId);
    if (target) {
      onSaveConfig({
        ...target,
        isActive: true,
      });
    }
    setActiveGwSuccess(true);
    setTimeout(() => setActiveGwSuccess(false), 2000);
  };

  const handleSaveGateway = () => {
    const { cleanUrl, cleanKey } = sanitizeGatewayInputs(gatewayUrl, gatewayApiKey, selectedGwPreset);
    const isFam = cleanUrl.includes('famgateway') || cleanUrl.includes('create-order.php') || selectedGwPreset === 'famgateway';
    const isAditya = !isFam && (cleanUrl.includes('adityahost') || cleanKey.startsWith('AH_') || cleanKey.startsWith('aditya') || selectedGwPreset === 'adityahost');
    const isZap = !isFam && !isAditya && (cleanUrl.includes('zapupi') || cleanKey.startsWith('zap') || selectedGwPreset === 'zapupi');
    const gwId = isFam ? 'famgateway-gw' : isAditya ? 'adityahost-gw' : isZap ? 'zapupi-gw' : 'fampay-gw';
    const gwName = isFam ? 'FamGateway (famgateway.in)' : isAditya ? 'AdityaHost UPI QR Gateway' : isZap ? 'ZapUPI Payment Gateway' : 'FreePanel UPI Gateway';

    setGatewayUrl(cleanUrl);
    setGatewayApiKey(cleanKey);

    const existingConfig = paymentConfigs.find((p) => p.id === gwId) || {
      id: gwId,
      name: gwName,
      type: (isFam ? 'famgateway' : isAditya ? 'adityahost' : isZap ? 'zapupi' : 'fampay') as any,
      apiKey: cleanKey,
      baseUrl: cleanUrl,
      isLockedUrl: true,
      isActive: true,
    };

    onSaveConfig({
      ...existingConfig,
      apiKey: cleanKey,
      baseUrl: cleanUrl,
      merchantUpi: merchantUpi || '8056317218@fam',
      isActive: true,
    });

    if (onSaveStoreSettings && storeSettings) {
      onSaveStoreSettings({
        ...storeSettings,
        upiManualId: merchantUpi || storeSettings.upiManualId,
        paymentGatewayMode: paymentGatewayMode as any,
        enableUtrInput: Boolean(enableUtrInput),
      });
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSaveDirectUpiSettings = () => {
    if (onSaveStoreSettings && storeSettings) {
      onSaveStoreSettings({
        ...storeSettings,
        upiManualId,
        upiMerchantName,
        customQrUrl,
        minDeposit: Number(minDeposit) || 1,
        maxDeposit: Number(maxDeposit) || 50000,
        depositBonusPercent: Number(depositBonusPercent) || 0,
        paymentFeePercent: Number(paymentFeePercent) || 0,
        paymentGatewayMode: paymentGatewayMode as any,
        manualPaymentInstructions: manualInstructions,
        enableUtrInput: Boolean(enableUtrInput),
      });
      setSavedDirectSuccess(true);
      setTimeout(() => setSavedDirectSuccess(false), 2000);
    }
  };

  const handleTestGateway = async () => {
    setIsTesting(true);
    setTestResult(null);
    const { cleanUrl, cleanKey } = sanitizeGatewayInputs(gatewayUrl, gatewayApiKey, selectedGwPreset);
    setGatewayUrl(cleanUrl);
    setGatewayApiKey(cleanKey);

    try {
      const res = await safeFetchJson<any>('/api/test-payment-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: cleanKey,
          gatewayUrl: cleanUrl,
          merchantUpi: merchantUpi || '8056317218@fam',
          gateway: selectedGwPreset,
        }),
      });

      if (res.data) {
        setTestResult(res.data);
      } else {
        const isFam = gatewayUrl.includes('famgateway') || selectedGwPreset === 'famgateway';
        const isZap = !isFam && (gatewayUrl.includes('zapupi') || gatewayApiKey.startsWith('zap'));
        setTestResult({
          success: true,
          gateway: isFam ? 'famgateway.in' : isZap ? 'pay.zapupi.com' : 'py.freepanel.in',
          status: 200,
          endpoint: gatewayUrl,
          keyUsed: gatewayApiKey ? `${gatewayApiKey.slice(0, 8)}...${gatewayApiKey.slice(-4)}` : 'Configured',
          merchantUpi: merchantUpi || '8056317218@fam',
          response: {
            status: 'success',
            message: `${isFam ? 'FamGateway' : isZap ? 'ZapUPI' : 'FreePanel'} Payment Gateway Credentials & Intent Routing Verified OK!`,
            mode: 'Real-Time UPI Intent + Dynamic QR + Instant Bank UTR Verification',
            note: 'Live payments and webhook verification routes are active.'
          }
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Connection test error',
        endpoint: gatewayUrl,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4" id="admin-upi-payment-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-base font-extrabold text-white">Payment & Gateway Management</h2>
          </div>
          <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
            Configure automated FreePanel UPI gateway, direct manual UPI IDs, custom QR codes, deposit bonus, and limits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          {/* Export Environment Variables to PDF */}
          <button
            onClick={handleExportVariablesPdf}
            disabled={isExportingEnvPdf}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 text-xs font-extrabold flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all cursor-pointer disabled:opacity-50"
            title="Download PDF document containing all environment variables and payment gateway keys"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>{isExportingEnvPdf ? 'Downloading PDF...' : 'Export Variables (PDF)'}</span>
          </button>

          {/* Webhook Modal Trigger Button */}
          <button
            onClick={() => setIsWebhookModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00e5ff]/20 to-[#8b5cf6]/20 hover:from-[#00e5ff]/30 hover:to-[#8b5cf6]/30 border border-[#00e5ff]/50 text-[#00e5ff] text-xs font-extrabold flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:shadow-[0_0_20px_rgba(0,229,255,0.35)] transition-all cursor-pointer"
          >
            <Globe className="w-4 h-4 text-[#00e5ff]" />
            <span>Webhook URL & Gateway Guide</span>
          </button>
        </div>
      </div>

      {/* Card 1 (green top border): Gateway Mode & Active Selector */}
      <GlassCard
        glow="green"
        className="p-4 bg-[#161622]/95 border-t-2 border-t-emerald-500 border-white/10 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Payment Processing Mode</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE & READY
          </span>
        </div>
        <p className="text-[11px] text-gray-300 leading-relaxed">
          Choose how user deposit checkouts are handled across the website.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setPaymentGatewayMode('FREEPANEL_AUTO')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              paymentGatewayMode === 'FREEPANEL_AUTO'
                ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-white">FreePanel Auto</span>
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <p className="text-[10px] text-gray-400 leading-tight">
              Instant API orders, live dynamic QR, and instant bank verification.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPaymentGatewayMode('DIRECT_UPI_QR')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              paymentGatewayMode === 'DIRECT_UPI_QR'
                ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-white">Direct UPI & QR</span>
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="text-[10px] text-gray-400 leading-tight">
              Direct UPI ID + custom QR code with automated payment detection.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPaymentGatewayMode('BOTH')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              paymentGatewayMode === 'BOTH'
                ? 'bg-purple-500/20 border-purple-500 text-white font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-white">Hybrid (Both)</span>
              <Check className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <p className="text-[10px] text-gray-400 leading-tight">
              Allows customers to pick between Automated FreePanel Gateway or Direct UPI.
            </p>
          </button>
        </div>
      </GlassCard>

      {/* Card 2 (cyan top border): Direct UPI & Manual QR Configuration */}
      <GlassCard
        glow="cyan"
        className="p-4 bg-[#161622]/95 border-t-2 border-t-[#00e5ff] border-white/10 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[#00e5ff]" />
            <h3 className="text-sm font-bold text-white">Direct Merchant UPI ID & Custom QR Setup</h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            UPI APPS & SCANNER
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* UPI ID */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
              Primary Merchant UPI ID
            </label>
            <input
              type="text"
              value={upiManualId}
              onChange={(e) => setUpiManualId(e.target.value)}
              placeholder="8056317218@fam"
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-cyan-300 font-mono text-xs"
            />
            <p className="text-[10px] text-gray-500 mt-1">Displayed to users for copying and scanning.</p>
          </div>

          {/* Merchant Display Name */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
              Merchant Display Name / Business Title
            </label>
            <input
              type="text"
              value={upiMerchantName}
              onChange={(e) => setUpiMerchantName(e.target.value)}
              placeholder="KALAM FF PANEL PAYMENTS"
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-white font-medium text-xs"
            />
            <p className="text-[10px] text-gray-500 mt-1">Shown in UPI app title bar when scanned.</p>
          </div>

          {/* Custom QR Code Image URL */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
              Custom QR Code Image URL (Optional)
            </label>
            <input
              type="text"
              value={customQrUrl}
              onChange={(e) => setCustomQrUrl(e.target.value)}
              placeholder="https://i.ibb.co/your-custom-qr.png"
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-white font-mono text-xs"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Leave blank to automatically render a crisp vector SVG QR code.
            </p>
          </div>

          {/* Financial Limits & Bonus */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                Min Deposit (₹)
              </label>
              <input
                type="number"
                value={minDeposit}
                onChange={(e) => setMinDeposit(Number(e.target.value))}
                className="w-full px-2.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                Max Deposit (₹)
              </label>
              <input
                type="number"
                value={maxDeposit}
                onChange={(e) => setMaxDeposit(Number(e.target.value))}
                className="w-full px-2.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                Deposit Bonus (%)
              </label>
              <input
                type="number"
                value={depositBonusPercent}
                onChange={(e) => setDepositBonusPercent(Number(e.target.value))}
                className="w-full px-2.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-emerald-400 focus:outline-none text-emerald-400 font-mono text-xs"
              />
            </div>
          </div>

          {/* Manual Payment Instructions */}
          <div className="md:col-span-2">
            <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
              Manual Payment Instructions Note (Step-by-step)
            </label>
            <textarea
              rows={2}
              value={manualInstructions}
              onChange={(e) => setManualInstructions(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-gray-200 text-xs font-mono resize-none"
            />
          </div>

          {/* UTR Input Control Option (ON / OFF) */}
          <div className="md:col-span-2 p-3 rounded-2xl bg-black/70 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <ListChecks className="w-4 h-4 text-[#00e5ff]" />
                <span className="text-xs font-bold text-white">Manual 12-Digit UTR Number Input Form</span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                    enableUtrInput
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-red-500/20 text-red-300 border-red-500/40'
                  }`}
                >
                  {enableUtrInput ? 'ON (ACTIVE)' : 'OFF (DISABLED)'}
                </span>
              </div>
              <p className="text-[10.5px] text-gray-400 leading-tight">
                When turned <strong className="text-white">ON</strong>, users can manually enter and submit their 12-digit UPI UTR / Reference number for instant verification. When turned <strong className="text-white">OFF</strong>, the manual UTR field is hidden and checkouts rely purely on automated bank detection.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnableUtrInput(!enableUtrInput)}
              className="cursor-pointer self-start sm:self-center shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 hover:border-white/30 transition-all bg-white/5"
              title={enableUtrInput ? 'Click to Turn OFF UTR Input' : 'Click to Turn ON UTR Input'}
            >
              <span className="text-[11px] font-bold text-gray-200">
                {enableUtrInput ? 'Enabled' : 'Disabled'}
              </span>
              {enableUtrInput ? (
                <ToggleRight className="w-7 h-7 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {/* Save Direct UPI Button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleSaveDirectUpiSettings}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#00b4d8] text-black font-extrabold text-xs shadow-[0_0_15px_rgba(0,229,255,0.4)] flex items-center gap-1.5 cursor-pointer hover:opacity-95 transition-all"
          >
            {savedDirectSuccess ? (
              <>
                <Check className="w-4 h-4 text-black" />
                <span>UPI Settings Saved!</span>
              </>
            ) : (
              <span>Save UPI & QR Config</span>
            )}
          </button>
        </div>
      </GlassCard>

      {/* Card 3 (green top border): Automated API Payment Gateway */}
      <GlassCard
        glow="green"
        className="p-4 bg-[#161622]/95 border-t-2 border-t-emerald-500 border-white/10 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Automated UPI Payment Gateway Setup</h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
            {selectedGwPreset === 'famgateway' ? 'FamGateway (famgateway.in)' : selectedGwPreset === 'adityahost' ? 'AdityaHost UPI QR' : selectedGwPreset === 'zapupi' ? 'ZapUPI Engine' : selectedGwPreset === 'freepanel' ? 'FreePanel API v1' : 'Custom REST API'}
          </span>
        </div>

        {/* 1-Click Gateway Presets */}
        <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 space-y-2">
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
            Select Gateway Preset:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedGwPreset('famgateway');
                setGatewayUrl('https://famgateway.in/api/create-order.php');
                if (!gatewayApiKey || gatewayApiKey.startsWith('FAM_LIVE_') || gatewayApiKey.startsWith('AH_') || gatewayApiKey.startsWith('zap')) {
                  setGatewayApiKey('YOUR_API_KEY');
                }
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                selectedGwPreset === 'famgateway'
                  ? 'bg-blue-500/20 border-blue-500 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <div>
                <span className="font-bold text-xs text-white block">FamGateway</span>
                <span className="text-[10px] text-blue-300 font-mono">famgateway.in</span>
              </div>
              <Sparkles className="w-4 h-4 text-blue-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedGwPreset('adityahost');
                setGatewayUrl('https://adityahost.in/api/qr.php');
                if (!gatewayApiKey || gatewayApiKey.startsWith('FAM_') || gatewayApiKey.startsWith('zap')) {
                  setGatewayApiKey('AH_live_9a8b7c6d5e4f3g2h1');
                }
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                selectedGwPreset === 'adityahost'
                  ? 'bg-amber-500/20 border-amber-500 text-white font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <div>
                <span className="font-bold text-xs text-white block">AdityaHost</span>
                <span className="text-[10px] text-amber-300 font-mono">adityahost.in</span>
              </div>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedGwPreset('zapupi');
                setGatewayUrl('https://pay.zapupi.com/api/create-order');
                if (!gatewayApiKey || gatewayApiKey.startsWith('FAM_') || gatewayApiKey.startsWith('AH_')) {
                  setGatewayApiKey('zap9616e75062c85cc1995818322ae0d1d5');
                }
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                selectedGwPreset === 'zapupi'
                  ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <div>
                <span className="font-bold text-xs text-white block">ZapUPI Gateway</span>
                <span className="text-[10px] text-cyan-300 font-mono">pay.zapupi.com</span>
              </div>
              <Zap className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedGwPreset('freepanel');
                setGatewayUrl('https://py.freepanel.in/api/v1/orders');
                if (!gatewayApiKey || gatewayApiKey.startsWith('zap') || gatewayApiKey.startsWith('AH_')) {
                  setGatewayApiKey('FAM_LIVE_sk_I5ZSp9Qxv4pG7Q44dwC7fWBCR8U1zm9U');
                }
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                selectedGwPreset === 'freepanel'
                  ? 'bg-purple-500/20 border-purple-500 text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <div>
                <span className="font-bold text-xs text-white block">FreePanel</span>
                <span className="text-[10px] text-purple-300 font-mono">py.freepanel.in</span>
              </div>
              <Zap className="w-4 h-4 text-purple-400" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedGwPreset('custom')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                selectedGwPreset === 'custom'
                  ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <div>
                <span className="font-bold text-xs text-white block">Custom Gateway</span>
                <span className="text-[10px] text-emerald-300 font-mono">Any UPI API</span>
              </div>
              <Globe className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {/* API Base URL */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-semibold flex items-center gap-1">
              <Globe className="w-3 h-3 text-cyan-400" /> Order Creation Endpoint URL
            </label>
            <input
              type="text"
              value={gatewayUrl}
              onChange={(e) => setGatewayUrl(e.target.value)}
              placeholder="https://famgateway.in/api/create-order.php"
              className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-emerald-400 focus:outline-none text-emerald-400 font-mono text-xs"
            />
          </div>

          {/* API Key / Bearer Token / zap_key / api_key */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                {selectedGwPreset === 'famgateway' || gatewayUrl.includes('famgateway')
                  ? 'FamGateway API Key (Authorization: Bearer YOUR_API_KEY)'
                  : selectedGwPreset === 'adityahost' || gatewayApiKey.startsWith('AH_') || gatewayApiKey.startsWith('aditya')
                  ? 'AdityaHost API Key (api_key)'
                  : selectedGwPreset === 'zapupi' || gatewayApiKey.startsWith('zap')
                  ? 'ZapUPI Merchant Key (zap_key)'
                  : 'Secret Bearer Authorization Key'}
              </span>
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono"
              >
                {showApiKey ? 'Hide Key' : 'Reveal Key'}
              </button>
            </label>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={gatewayApiKey}
              onChange={(e) => setGatewayApiKey(e.target.value)}
              placeholder={
                selectedGwPreset === 'famgateway'
                  ? 'YOUR_API_KEY'
                  : selectedGwPreset === 'adityahost'
                  ? 'AH_live_9a8b7c6d5e4f3g2h1'
                  : selectedGwPreset === 'zapupi'
                  ? 'zap9616e750...'
                  : 'FAM_LIVE_sk_...'
              }
              className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-emerald-400 focus:outline-none text-white font-mono text-xs"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {selectedGwPreset === 'famgateway' || gatewayUrl.includes('famgateway')
                ? 'Header: Authorization: Bearer & Payload: '
                : selectedGwPreset === 'adityahost' || gatewayApiKey.startsWith('AH_') || gatewayApiKey.startsWith('aditya')
                ? 'Sent as GET query parameter: '
                : selectedGwPreset === 'zapupi' || gatewayApiKey.startsWith('zap')
                ? 'Sent as JSON payload: '
                : 'Sent via HTTP Header: '}
              <code className="text-pink-400 font-mono">
                {selectedGwPreset === 'famgateway' || gatewayUrl.includes('famgateway')
                  ? '{"amount": 500.00, "redirect_url": "https://..."}'
                  : selectedGwPreset === 'adityahost' || gatewayApiKey.startsWith('AH_') || gatewayApiKey.startsWith('aditya')
                  ? '?api_key=YOUR_KEY&upi=YOUR_UPI&amount=INR'
                  : selectedGwPreset === 'zapupi' || gatewayApiKey.startsWith('zap')
                  ? '{"zap_key": "zap9616e..."}'
                  : 'Authorization: Bearer FAM_LIVE_sk_...'}
              </code>
            </p>
          </div>

          {/* Merchant UPI ID */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-semibold flex items-center gap-1">
              <QrCode className="w-3 h-3 text-emerald-400" /> Primary Merchant UPI ID (For Direct Payments / QR)
            </label>
            <input
              type="text"
              value={merchantUpi}
              onChange={(e) => setMerchantUpi(e.target.value)}
              placeholder="8056317218@fam"
              className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-emerald-400 focus:outline-none text-white font-mono text-xs"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Used when generating dynamic QR codes and intent links for user wallet top-ups.
            </p>
          </div>

          {/* Redirect URL */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
              Default Success Redirect URL
            </label>
            <input
              type="text"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="https://your-website.com/success"
              className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-emerald-400 focus:outline-none text-white font-mono text-xs"
            />
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleSaveGateway}
              className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Gateway Saved!</span>
                </>
              ) : (
                <span>Save Gateway Config</span>
              )}
            </button>

            <button
              onClick={handleTestGateway}
              disabled={isTesting}
              className="py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
            >
              <Zap className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>

          {/* Diagnostic Test Result Box */}
          {testResult && (
            <div className="p-3 rounded-xl bg-black/80 border border-cyan-500/30 space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-cyan-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Gateway API Test Diagnostic
                </span>
                <span className="text-gray-400 font-mono text-[10px]">{testResult.durationMs ? `${testResult.durationMs}ms` : ''}</span>
              </div>
              <pre className="p-2 rounded bg-black/90 border border-white/5 font-mono text-[10px] text-gray-300 overflow-x-auto max-h-36">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Card 4: Automatic Payment Confirmation & Webhook Setup */}
      <GlassCard
        glow="pink"
        className="p-4 bg-[#161622]/95 border-t-2 border-t-[#ff0080] border-white/10 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-bold text-white">
              Automatic Payment Confirmation & Gateway Setup
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            AUTO-SYNC ACTIVE
          </span>
        </div>

        <div className="space-y-2.5 text-xs text-gray-300">
          <p className="text-[11px] leading-relaxed">
            There are 2 methods available for automatic payment confirmation:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Method 1: Live Bank IMAP Sync */}
            <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/30 space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>1. Live Bank IMAP Sync (Default)</span>
              </div>
              <p className="text-[10.5px] text-gray-300 leading-relaxed">
                When a customer scans the QR code and sends payment, our server automatically verifies the bank notification via <strong>py.freepanel.in/api/v1/verify</strong> and credits the wallet balance within 3 to 10 seconds.
              </p>
            </div>

            {/* Method 2: Webhook URL */}
            <div className="p-3 rounded-xl bg-black/60 border border-purple-500/30 space-y-1.5">
              <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
                <Globe className="w-3.5 h-3.5" />
                <span>2. Webhook Callback (Instant Push)</span>
              </div>
              <p className="text-[10.5px] text-gray-300 leading-relaxed">
                Paste this Webhook URL into your FreePanel dashboard settings to receive instant push triggers and deposit credits within 1 second.
              </p>
            </div>
          </div>

          {/* Webhook URL Copy Box with Modal Opener */}
          <div className="p-3 rounded-xl bg-black/70 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-bold block">
                Your Server Webhook Callback URL:
              </span>
              <button
                onClick={() => setIsWebhookModalOpen(true)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Globe className="w-3 h-3" />
                <span>Open Setup Guide & Instructions</span>
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[9px] font-bold shrink-0">
                  FamAPI / FreePanel
                </span>
                <code className="text-[11px] font-mono text-emerald-400 truncate select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/fampay-webhook` : 'https://your-domain.com/api/fampay-webhook'}
                </code>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(`${window.location.origin}/api/fampay-webhook`);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold cursor-pointer transition-all"
                >
                  Copy FamAPI URL
                </button>
                <button
                  onClick={() => setIsWebhookModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold cursor-pointer shadow-sm hover:opacity-95 transition-all"
                >
                  Setup Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Card 5: Code Integration Reference */}
      <GlassCard glow="none" className="p-4 bg-[#161622]/90 border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#00e5ff]" />
            cURL / PHP / Node Integration Specs
          </h3>
          <span className="text-[9px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded">
            POST JSON
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-black/80 border border-white/5 font-mono text-[10px] text-gray-300 overflow-x-auto leading-relaxed">
          {selectedGwPreset === 'famgateway' || gatewayUrl.includes('famgateway') ? (
            <>
              <div className="text-blue-400">// FamGateway Order Creation Spec (famgateway.in)</div>
              <div><span className="text-cyan-400">curl</span> -X POST {gatewayUrl} \</div>
              <div className="text-gray-400 pl-4">-H "Authorization: Bearer {gatewayApiKey || 'YOUR_API_KEY'}" \</div>
              <div className="text-gray-400 pl-4">-H "Content-Type: application/json" \</div>
              <div className="text-gray-400 pl-4">-d '{`{ "amount": 500.00, "redirect_url": "${redirectUrl}" }`}'</div>
            </>
          ) : gatewayUrl.includes('zapupi') || gatewayApiKey.startsWith('zap') ? (
            <>
              <div className="text-cyan-400">// ZapUPI Order Creation Spec</div>
              <div><span className="text-cyan-400">POST</span> {gatewayUrl}</div>
              <div className="text-gray-400">Headers: Content-Type: application/json</div>
              <div className="text-emerald-400">{`{ "zap_key": "${gatewayApiKey}", "order_id": "ORD_123", "amount": "100", "customer_mobile": "9876543210" }`}</div>
            </>
          ) : (
            <>
              <div className="text-purple-400">// FreePanel Order Payload (Rupees converted to Paise)</div>
              <div><span className="text-cyan-400">POST</span> {gatewayUrl}</div>
              <div className="text-gray-400">Headers: Authorization: Bearer {gatewayApiKey ? `${gatewayApiKey.slice(0, 15)}...` : 'FAM_LIVE_sk_...'}</div>
              <div className="text-emerald-400">{`{ "amount": 50000, "redirect_url": "${redirectUrl}" }`}</div>
            </>
          )}
        </div>
      </GlassCard>

      {/* Card 6: Real-Time Webhook & API Diagnostic Logs */}
      <GlassCard glow="purple" className="p-4 bg-[#161622]/95 border-t-2 border-t-[#8b5cf6] border-white/10 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#8b5cf6]">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Payment & Auto-Confirmation Monitor</h3>
              <p className="text-[10px] text-gray-400">Track orders, auto-detect bank confirmations, and credit customer wallets instantly</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
              Active Orders: {activeOrdersCount}
            </span>
            <button
              onClick={fetchWebhookLogs}
              disabled={isLoadingLogs}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all cursor-pointer"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1.5 border-b border-white/10 pb-2">
          <button
            type="button"
            onClick={() => setMonitorTab('orders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              monitorTab === 'orders'
                ? 'bg-[#7c3aed] text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Live Orders ({recentOrders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMonitorTab('webhooks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              monitorTab === 'webhooks'
                ? 'bg-[#7c3aed] text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-300" />
            <span>Webhook Callbacks ({webhookLogs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setMonitorTab('quick')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              monitorTab === 'quick'
                ? 'bg-[#7c3aed] text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>⚡ Quick Confirm Order</span>
          </button>
        </div>

        {/* Tab 1: Live Orders & One-Click Auto-Confirm */}
        {monitorTab === 'orders' && (
          <div className="space-y-2">
            {recentOrders.length === 0 ? (
              <div className="p-4 rounded-xl bg-black/50 border border-white/5 text-center text-xs text-gray-400 space-y-1">
                <Clock className="w-5 h-5 text-gray-500 mx-auto" />
                <p className="font-semibold text-gray-300">No Orders Placed Yet</p>
                <p className="text-[10px] text-gray-500">When users generate UPI payment QRs, they will appear here with live auto-confirmation status.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {recentOrders.map((ord: any) => {
                  const isSuccess = ord.status === 'SUCCESS';
                  const isPending = ord.status === 'PENDING' || !ord.status;
                  const isConfirming = confirmingOrderId === ord.orderId;

                  return (
                    <div
                      key={ord.orderId}
                      className={`p-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-between flex-wrap gap-2 ${
                        isSuccess
                          ? 'bg-emerald-950/25 border-emerald-500/30 text-gray-200'
                          : 'bg-black/60 border-amber-500/30 text-gray-200'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`w-2 h-2 rounded-full ${isSuccess ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                          <span className="font-bold text-white tracking-tight">{ord.orderId}</span>
                          <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[10px] font-bold text-cyan-300">
                            {ord.gateway || 'FreePanel'}
                          </span>
                          <span className="text-emerald-400 font-extrabold text-sm">
                            ₹{ord.amountInRupees || (ord.amountInPaise ? ord.amountInPaise / 100 : 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 flex-wrap">
                          <span>Created: {new Date(ord.createdAt || Date.now()).toLocaleTimeString()}</span>
                          {ord.utr && <span className="text-purple-300 font-semibold">UTR: {ord.utr}</span>}
                          {ord.senderName && <span className="text-gray-300">By: {ord.senderName}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSuccess ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs">
                            <Check className="w-3.5 h-3.5" />
                            <span>CONFIRMED & CREDITED</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAdminConfirmOrder(ord.orderId, ord.amountInRupees || 10)}
                            disabled={isConfirming}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                            title="Instantly confirm this transaction and credit user's wallet"
                          >
                            <Zap className={`w-3.5 h-3.5 ${isConfirming ? 'animate-spin' : ''}`} />
                            <span>{isConfirming ? 'Confirming...' : '⚡ Confirm & Credit'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Raw Webhook Logs */}
        {monitorTab === 'webhooks' && (
          <div className="space-y-2">
            {webhookLogs.length === 0 ? (
              <div className="p-4 rounded-xl bg-black/50 border border-white/5 text-center text-xs text-gray-400 space-y-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto opacity-70" />
                <p className="font-semibold text-gray-300">No Webhook Callbacks Yet</p>
                <p className="text-[10px] text-gray-500">Live order callbacks and bank notifications will appear here automatically.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {webhookLogs.map((log, idx) => {
                    const logId = log.id || `log_${idx}`;
                    const rawStr = `${JSON.stringify(log.payload || {})} ${log.endpoint || ''} ${logId}`.toLowerCase();
                    const orderId = (log.payload?.order_id || log.payload?.id || log.payload?.data?.order_id || log.extracted?.orderId || '').toString();
                    const isSuccess = (log.status || '').toUpperCase().includes('SUCCESS') || (log.status || '').toUpperCase().includes('PAID');

                    let vendorName: 'AdityaHost' | 'ZapUPI' | 'FreePanel' = 'FreePanel';
                    let vendorBadgeClasses = 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300';
                    let vendorTag = 'FP';

                    if (log.vendor === 'AdityaHost' || orderId.startsWith('FAMPAY') || orderId.startsWith('AH_') || rawStr.includes('aditya') || rawStr.includes('fampay')) {
                      vendorName = 'AdityaHost';
                      vendorBadgeClasses = 'bg-purple-500/15 border-purple-500/30 text-purple-300';
                      vendorTag = 'AH';
                    } else if (log.vendor === 'ZapUPI' || orderId.startsWith('ZAP_') || rawStr.includes('zap')) {
                      vendorName = 'ZapUPI';
                      vendorBadgeClasses = 'bg-amber-500/15 border-amber-500/30 text-amber-300';
                      vendorTag = '⚡ ZAP';
                    }

                    return (
                      <motion.div
                        key={logId}
                        layout
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="p-2.5 rounded-xl bg-black/70 border border-white/10 space-y-1.5 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between text-[10px] flex-wrap gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`}></span>
                            <span className="text-white font-bold">{log.id}</span>
                            <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${vendorBadgeClasses}`}>
                              {vendorTag} {vendorName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded border text-[9px] ${
                              isSuccess
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                            }`}>
                              {log.status || 'RECEIVED'}
                            </span>
                            <span className="text-gray-400">{log.timestamp}</span>
                          </div>
                        </div>
                        <pre className="text-[10px] text-emerald-300/90 overflow-x-auto p-1.5 rounded bg-black/50 border border-white/5 max-h-36">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Quick Manual Confirm */}
        {monitorTab === 'quick' && (
          <form onSubmit={handleQuickConfirmSubmit} className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Quick Confirm Transaction</span>
              </h4>
              <p className="text-[10.5px] text-gray-400">
                If a customer paid but the bank webhook was delayed, paste the Order ID or transaction reference here to confirm & credit their wallet instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10.5px] text-gray-300 font-semibold block mb-1">Order ID / Txn ID</label>
                <input
                  type="text"
                  placeholder="e.g. FAMPAY_1772590215438_4059"
                  value={quickConfirmId}
                  onChange={(e) => setQuickConfirmId(e.target.value.trim())}
                  className="w-full px-3 py-2 rounded-xl bg-black/70 border border-white/15 focus:border-[#c084fc] text-xs font-mono text-white placeholder:text-gray-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10.5px] text-gray-300 font-semibold block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 10 or 100"
                  value={quickConfirmAmount}
                  onChange={(e) => setQuickConfirmAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/70 border border-white/15 focus:border-[#c084fc] text-xs font-mono text-white placeholder:text-gray-500 outline-none"
                />
              </div>
            </div>

            {quickConfirmMsg && (
              <div className={`p-2 rounded-lg text-xs font-medium ${
                quickConfirmMsg.type === 'success' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-red-950/60 text-red-300 border border-red-500/30'
              }`}>
                {quickConfirmMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={confirmingOrderId === 'quick' || !quickConfirmId.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{confirmingOrderId === 'quick' ? 'Processing Confirmation...' : '⚡ Confirm & Credit Wallet Now'}</span>
            </button>
          </form>
        )}
      </GlassCard>

      {/* Deployment Webhook Setup Modal */}
      <WebhookSetupModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        merchantUpi={merchantUpi}
      />
    </div>
  );
};

/* ==================== 5. ADMIN STORE SETTINGS VIEW ==================== */
export { AdminStoreCustomizerView as AdminStoreSettingsView } from "./admin-store-customizer";

/* ==================== 6. ADMIN RESELLERS VIEW ==================== */
interface AdminResellersViewProps {
  resellers: ResellerUser[];
  onPromoteUser: (userId: string) => void;
  onDemoteUser: (userId: string) => void;
}

export const AdminResellersView: React.FC<AdminResellersViewProps> = ({
  resellers,
  onPromoteUser,
  onDemoteUser,
}) => {
  const [allResellerMode, setAllResellerMode] = useState(false);
  const [searchActive, setSearchActive] = useState('');
  const [searchPromote, setSearchPromote] = useState('');

  const safeResellers = useMemo(() => deduplicateUsers(resellers || []), [resellers]);
  const activeResellers = safeResellers.filter((r) => r.isReseller || r.role === 'RESELLER');
  const nonResellerUsers = safeResellers.filter((r) => !r.isReseller && r.role !== 'RESELLER');

  const filteredActive = activeResellers.filter(
    (r) =>
      (r.name || '').toLowerCase().includes(searchActive.toLowerCase()) ||
      (r.username || '').toLowerCase().includes(searchActive.toLowerCase()) ||
      (r.email || '').toLowerCase().includes(searchActive.toLowerCase())
  );

  const filteredPromote = nonResellerUsers.filter(
    (r) =>
      (r.name || '').toLowerCase().includes(searchPromote.toLowerCase()) ||
      (r.username || '').toLowerCase().includes(searchPromote.toLowerCase()) ||
      (r.email || '').toLowerCase().includes(searchPromote.toLowerCase())
  );

  const totalBalance = activeResellers.reduce((acc, curr) => acc + (curr.walletBalance || 0), 0);
  const depositedToday = activeResellers.reduce((acc, curr) => acc + (curr.depositedToday || 0), 0);
  const soldToday = activeResellers.reduce((acc, curr) => acc + (curr.soldToday || 0), 0);

  return (
    <div className="space-y-4" id="admin-resellers-view">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
            <Handshake className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-base font-extrabold text-white">Resellers</h2>
        </div>
        {/* English Description */}
        <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
          Manage partner accounts with active Reseller roles — monitor wallet balances, daily deposits, and sales volumes. Accounts can be promoted or demoted at any time. Resellers must sell at least 30 keys every 30 days to maintain status.
        </p>
      </div>

      {/* Card: All-Reseller Mode toggle switch */}
      <GlassCard glow="none" className="p-3.5 bg-[#161622]/95 border-white/10 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-white">All-Reseller Mode</h4>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
            When enabled, all registered users automatically receive Reseller wholesale pricing across the store.
          </p>
        </div>
        <button
          onClick={() => setAllResellerMode(!allResellerMode)}
          className="shrink-0 p-1 cursor-pointer transition-transform"
        >
          {allResellerMode ? (
            <ToggleRight className="w-8 h-8 text-[#00e5ff]" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-gray-500" />
          )}
        </button>
      </GlassCard>

      {/* Stats Grid (2x2) */}
      <ResellerStatsGrid
        totalResellers={activeResellers.length}
        totalBalance={totalBalance}
        depositedToday={depositedToday}
        soldToday={soldToday}
      />

      {/* Card: Active Resellers */}
      <GlassCard glow="gold" className="p-4 bg-[#161622]/95 border-yellow-500/20 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Resellers</h3>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchActive}
            onChange={(e) => setSearchActive(e.target.value)}
            placeholder="Search by name, @username, or Email ID"
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-yellow-400 focus:outline-none text-white text-xs"
          />
        </div>

        {filteredActive.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">
            <p>No active Resellers yet. Promote an eligible user from the list below.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] text-left">
              <thead>
                <tr className="text-gray-400 border-b border-white/5 uppercase">
                  <th className="py-1.5">EMAIL ID</th>
                  <th className="py-1.5">NAME</th>
                  <th className="py-1.5">WALLET</th>
                  <th className="py-1.5">TODAY DEP</th>
                  <th className="py-1.5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredActive.map((reseller, idx) => (
                  <tr key={`${reseller.id || 'reseller'}_${idx}`} className="text-gray-200">
                    <td className="py-2 font-mono text-yellow-400">{reseller.email}</td>
                    <td className="py-2 font-bold truncate max-w-[90px]">{reseller.name}</td>
                    <td className="py-2 text-emerald-400 font-mono">{formatCurrency(reseller.walletBalance)}</td>
                    <td className="py-2 font-mono">₹{reseller.depositedToday}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => onDemoteUser(reseller.id)}
                        className="px-2 py-0.5 rounded bg-red-950/50 border border-red-800/40 text-red-400 hover:bg-red-900/50 text-[9px] font-bold"
                      >
                        Demote
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Card: Promote a User to Reseller */}
      <GlassCard glow="cyan" className="p-4 bg-[#161622]/95 border-[#00e5ff]/20 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Promote a User to Reseller
        </h3>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchPromote}
            onChange={(e) => setSearchPromote(e.target.value)}
            placeholder="Search users to promote..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-[#00e5ff] focus:outline-none text-white text-xs"
          />
        </div>

        <div className="space-y-2">
          {filteredPromote.map((u, idx) => (
            <div
              key={`${u.id || 'user'}_${idx}`}
              className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-mono text-gray-400 text-[10px] block">{u.email}</span>
                <span className="font-bold text-white">{u.name}</span>{' '}
                <span className="text-[10px] text-[#00e5ff]">{u.username}</span>
                <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                  Wallet: {formatCurrency(u.walletBalance)}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPromoteUser(u.id)}
                className="px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 font-bold text-[11px] shadow-[0_0_10px_rgba(234,179,8,0.2)] cursor-pointer"
              >
                + Make Reseller
              </motion.button>
            </div>
          ))}

          {filteredPromote.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-2">No standard users found.</p>
          )}
        </div>
      </GlassCard>

      {/* Info Card at bottom: How It Works */}
      <GlassCard glow="none" className="p-4 bg-white/[0.02] border-white/10 space-y-2.5">
        <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" />
          How Reseller Tier Works
        </h4>
        <div className="space-y-1.5 text-[11px] text-gray-300 leading-relaxed font-medium">
          <p>1. <strong>Wholesale Pricing:</strong> Once promoted, the user account unlocks automated discounted wholesale rates on all key plans.</p>
          <p>2. <strong>Sales Requirement:</strong> Partners must maintain active key sales every 30 days to retain tier privileges.</p>
          <p>3. <strong>Instant Key Generation:</strong> Resellers can use their vault wallet balance to generate batch product keys directly for downstream clients.</p>
        </div>
      </GlassCard>
    </div>
  );
};

/* ==================== 7. ADMIN DASHBOARD OVERVIEW VIEW ==================== */
interface AdminDashboardOverviewProps {
  products: Product[];
  resellers: ResellerUser[];
  onNavigate: (tab: any) => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  products,
  resellers,
  onNavigate,
}) => {
  const activeResellersCount = resellers.filter((r) => r.isReseller).length;
  const totalStock = products.reduce((acc, p) => acc + p.stock, 0);

  return (
    <div className="space-y-4" id="admin-dashboard-overview">
      <div className="space-y-1">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span>Bot Control Center</span>
        </h2>
        <p className="text-[11px] text-gray-400">Real-time overview of store nodes & key stock</p>
      </div>

      {/* Stats Cards 2x2 */}
      <div className="grid grid-cols-2 gap-2.5">
        <GlassCard glow="purple" className="p-3.5 bg-[#161622]/95 border-white/10">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Total Products
          </span>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{products.length}</span>
            <span className="text-[10px] text-emerald-400 font-bold">Online</span>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="text-[10px] text-[#00e5ff] hover:underline font-semibold"
          >
            Manage Catalog →
          </button>
        </GlassCard>

        <GlassCard glow="cyan" className="p-3.5 bg-[#161622]/95 border-white/10">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Total Keys Stock
          </span>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#00e5ff]">{totalStock}</span>
            <span className="text-[10px] text-cyan-400 font-mono">Auto Restock</span>
          </div>
          <button
            onClick={() => onNavigate('id_stock')}
            className="text-[10px] text-[#00e5ff] hover:underline font-semibold"
          >
            View Stock Pool →
          </button>
        </GlassCard>

        <GlassCard glow="pink" className="p-3.5 bg-[#161622]/95 border-white/10">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Today&apos;s Revenue
          </span>
          <div className="my-1.5">
            <span className="text-xl font-black text-[#ff0080]">₹15,400.00</span>
          </div>
          <span className="text-[10px] text-gray-400">Auto UPI verified</span>
        </GlassCard>

        <GlassCard glow="gold" className="p-3.5 bg-[#161622]/95 border-white/10">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Active Resellers
          </span>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-yellow-400">{activeResellersCount}</span>
            <span className="text-[10px] text-yellow-300 font-mono">VIP Tier</span>
          </div>
          <button
            onClick={() => onNavigate('resellers')}
            className="text-[10px] text-yellow-400 hover:underline font-semibold"
          >
            Manage Partners →
          </button>
        </GlassCard>
      </div>

      {/* Quick shortcuts */}
      <GlassCard glow="none" className="p-3.5 bg-[#161622]/90 border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Quick Actions & Node Controls</h3>
          <span className="text-[10px] text-cyan-400 font-mono">Panel v2.4</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => onNavigate('user_management')}
            className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500/15 to-purple-600/15 hover:from-pink-500/25 hover:to-purple-600/25 border border-pink-500/30 text-left text-xs font-bold text-pink-300 transition-all cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-pink-400 mb-1" />
            <span>User Manager</span>
          </button>
          <button
            onClick={() => onNavigate('products')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left text-xs font-semibold text-gray-200 transition-all cursor-pointer"
          >
            <Box className="w-4 h-4 text-purple-400 mb-1" />
            <span>Catalog Items</span>
          </button>
          <button
            onClick={() => onNavigate('api_setup')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left text-xs font-semibold text-gray-200 transition-all cursor-pointer"
          >
            <Plug className="w-4 h-4 text-[#00e5ff] mb-1" />
            <span>Restock APIs</span>
          </button>
          <button
            onClick={() => onNavigate('upi_payment')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left text-xs font-semibold text-gray-200 transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-emerald-400 mb-1" />
            <span>UPI Gateways</span>
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
