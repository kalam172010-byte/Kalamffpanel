import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Power,
  Shield,
  Smartphone,
  Sparkles,
  Sliders,
  Send,
  Info,
  Clock,
  ChevronRight,
  Layers,
  Zap,
  MessageSquare
} from 'lucide-react';

export interface ProductItem {
  id: string;
  productId?: string;
  name: string;
  category?: string;
  device?: string;
  deviceType?: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'DISABLED' | string;
  isMaintenance?: boolean;
  maintenanceReason?: string;
  stock?: number;
  keys?: string[];
  plans?: Array<{
    id?: string;
    duration?: string;
    name?: string;
    price?: number;
    resellerPrice?: number;
  }>;
}

export function ProductMaintenanceDashboard() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'MAINTENANCE' | 'DISABLED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal for editing maintenance reason
  const [reasonModalProduct, setReasonModalProduct] = useState<ProductItem | null>(null);
  const [customReason, setCustomReason] = useState<string>('');
  const [savingReason, setSavingReason] = useState<boolean>(false);

  // Bulk action confirmation
  const [bulkConfirmAction, setBulkConfirmAction] = useState<'ALL_MAINTENANCE' | 'ALL_ACTIVE' | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchProducts = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setRefreshing(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.products || []);
        setProducts(list);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      showToast('Failed to load products list', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Quick Preset Reasons
  const presetReasons = [
    { label: '🎮 Free Fire OB Update Maintenance', text: 'Updating cheat & panel for latest Free Fire OB update. Working on bypass.' },
    { label: '🔑 Key Restocking in Progress', text: 'Fresh batch of license keys being generated. Restock arriving soon.' },
    { label: '⚙️ Server & Injector Patching', text: 'Server backend & injector security patch in progress to ensure 100% anti-ban.' },
    { label: '🛠️ General System Maintenance', text: 'This specific panel is temporarily under maintenance for quality checks.' }
  ];

  // Toggle single product maintenance
  const handleToggleMaintenance = async (product: ProductItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const pid = product.id || product.productId;
    if (!pid) return;

    setUpdatingId(pid);
    const isCurrentlyMaint = (product.status || '').toUpperCase() === 'MAINTENANCE';
    const targetStatus = isCurrentlyMaint ? 'ACTIVE' : 'MAINTENANCE';

    // Optimistic UI Update
    setProducts(prev =>
      prev.map(p => (p.id === pid || p.productId === pid) ? { ...p, status: targetStatus, isMaintenance: !isCurrentlyMaint } : p)
    );

    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(pid)}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isMaintenance: !isCurrentlyMaint,
          status: targetStatus
        })
      });

      if (res.ok) {
        const result = await res.json();
        showToast(
          !isCurrentlyMaint
            ? `🛠️ "${product.name}" is now UNDER MAINTENANCE (Sync'd to Telegram Bot ⚡)`
            : `🟢 "${product.name}" is now ACTIVE & ready for purchases!`,
          'success'
        );
      } else {
        throw new Error('API update failed');
      }
    } catch (err) {
      // Revert on failure
      fetchProducts();
      showToast(`Failed to update maintenance for "${product.name}"`, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Save customized reason & put into maintenance
  const handleSaveReasonAndMaintenance = async () => {
    if (!reasonModalProduct) return;
    const pid = reasonModalProduct.id || reasonModalProduct.productId;
    if (!pid) return;

    setSavingReason(true);
    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(pid)}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isMaintenance: true,
          status: 'MAINTENANCE',
          maintenanceReason: customReason.trim() || undefined,
          reason: customReason.trim() || undefined
        })
      });

      if (res.ok) {
        showToast(`🛠️ "${reasonModalProduct.name}" set to Maintenance with custom notice!`, 'success');
        setReasonModalProduct(null);
        setCustomReason('');
        fetchProducts();
      } else {
        throw new Error('Failed to save reason');
      }
    } catch (err) {
      showToast('Error saving maintenance reason', 'error');
    } finally {
      setSavingReason(false);
    }
  };

  // Bulk set maintenance
  const handleBulkAction = async (action: 'ALL_MAINTENANCE' | 'ALL_ACTIVE') => {
    setIsBulkProcessing(true);
    try {
      const res = await fetch('/api/admin/products/bulk-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          isMaintenance: action === 'ALL_MAINTENANCE'
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(
          action === 'ALL_MAINTENANCE'
            ? `🛑 All ${data.updatedCount || products.length} products placed Under Maintenance!`
            : `🟢 All ${data.updatedCount || products.length} products Activated!`,
          'success'
        );
        setBulkConfirmAction(null);
        fetchProducts();
      } else {
        throw new Error('Bulk API failed');
      }
    } catch (err) {
      showToast('Bulk update failed. Please retry.', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchCat = (p.category || '').toLowerCase().includes(q);
        const matchId = (p.id || p.productId || '').toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchId) return false;
      }

      // Status
      const st = (p.status || 'ACTIVE').toUpperCase();
      if (statusFilter === 'ACTIVE' && st !== 'ACTIVE') return false;
      if (statusFilter === 'MAINTENANCE' && st !== 'MAINTENANCE') return false;
      if (statusFilter === 'DISABLED' && st !== 'DISABLED') return false;

      // Category
      if (categoryFilter !== 'ALL') {
        const cat = (p.category || '').toUpperCase();
        if (categoryFilter === 'NON_ROOT' && !cat.includes('NON-ROOT') && !cat.includes('NONROOT')) return false;
        if (categoryFilter === 'ROOT' && !cat.includes('ROOT') && cat.includes('NON-ROOT')) return false;
        if (categoryFilter === 'IOS' && !cat.includes('IOS') && !cat.includes('IPHONE')) return false;
      }

      return true;
    });
  }, [products, searchQuery, statusFilter, categoryFilter]);

  // Counts
  const activeCount = products.filter(p => (p.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
  const maintenanceCount = products.filter(p => (p.status || '').toUpperCase() === 'MAINTENANCE').length;
  const disabledCount = products.filter(p => (p.status || '').toUpperCase() === 'DISABLED').length;

  return (
    <div className="space-y-6 text-gray-100 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
              : toastMessage.type === 'info'
              ? 'bg-blue-950/90 text-blue-200 border-blue-500/50'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#18122B] via-[#1F1936] to-[#120E24] border border-purple-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-bold tracking-wide uppercase">
              <Wrench className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
              <span>Real-Time Product Maintenance Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Individual Panel Maintenance Manager
            </h1>
            <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
              தனித்தனியாக ஒவ்வொரு பேனலையும் அண்டர் மெயின்டனன்ஸ் போடலாம். When a product update is pending or under maintenance, toggle it here to instantly pause purchases and show a maintenance notice on the Telegram Bot.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchProducts(true)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/50 border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:border-purple-400"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Sync Live'}</span>
            </button>

            <div className="flex items-center gap-2 bg-black/40 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Bot Real-Time Sync: <b>ACTIVE</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-[#1e173b] border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
              : 'bg-[#130f24] border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Panels</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{products.length}</div>
          <div className="text-[11px] text-gray-400 mt-1">Across all categories</div>
        </div>

        <div
          onClick={() => setStatusFilter('ACTIVE')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ACTIVE'
              ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
              : 'bg-[#130f24] border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active (Live)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-300">{activeCount}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Open for instant buy</div>
        </div>

        <div
          onClick={() => setStatusFilter('MAINTENANCE')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'MAINTENANCE'
              ? 'bg-yellow-950/50 border-yellow-500/70 shadow-[0_0_25px_rgba(234,179,8,0.25)]'
              : 'bg-[#130f24] border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-yellow-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Under Maintenance</span>
            <Wrench className="w-4 h-4 text-yellow-400 animate-pulse" />
          </div>
          <div className="text-3xl font-extrabold text-yellow-300">{maintenanceCount}</div>
          <div className="text-[11px] text-yellow-400/80 mt-1">Paused with notice</div>
        </div>

        <div
          onClick={() => setStatusFilter('DISABLED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'DISABLED'
              ? 'bg-gray-800/50 border-gray-500/60 shadow-[0_0_20px_rgba(156,163,175,0.2)]'
              : 'bg-[#130f24] border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Disabled</span>
            <Power className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-3xl font-extrabold text-gray-300">{disabledCount}</div>
          <div className="text-[11px] text-gray-500 mt-1">Hidden from catalog</div>
        </div>
      </div>

      {/* Control Bar: Search, Category Filters, Bulk Actions */}
      <div className="bg-[#140F28] border border-purple-500/20 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search product by name, category, or ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-purple-500/30 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
            />
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'All Categories' },
              { id: 'NON_ROOT', label: '🤖 Non-Root' },
              { id: 'ROOT', label: '⚙️ Root' },
              { id: 'IOS', label: '🍏 iPhone/iOS' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-black/30 hover:bg-white/5 text-gray-400 border border-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Bulk Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkConfirmAction('ALL_MAINTENANCE')}
              className="px-3.5 py-2 rounded-xl bg-yellow-950/40 hover:bg-yellow-900/60 border border-yellow-500/40 text-yellow-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-yellow-400"
            >
              <Wrench className="w-3.5 h-3.5 text-yellow-400" />
              <span>All Maintenance</span>
            </button>
            <button
              onClick={() => setBulkConfirmAction('ALL_ACTIVE')}
              className="px-3.5 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-emerald-400"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Activate All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="bg-[#140F28] border border-purple-500/20 rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div className="text-white font-bold text-base">Loading product catalog & maintenance status...</div>
          <div className="text-gray-400 text-xs">Syncing real-time database records</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#140F28] border border-purple-500/20 rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center mx-auto">
            <Info className="w-6 h-6" />
          </div>
          <div className="text-white font-bold text-base">No products match your filters</div>
          <div className="text-gray-400 text-xs">Try clearing search query or changing status filters.</div>
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setCategoryFilter('ALL'); }}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map(p => {
            const isMaint = (p.status || '').toUpperCase() === 'MAINTENANCE';
            const isActive = (p.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
            const pid = p.id || p.productId || '';
            const isBusy = updatingId === pid;
            const stockCount = Array.isArray(p.keys) ? p.keys.length : (p.stock || 0);

            return (
              <div
                key={pid}
                className={`relative rounded-3xl p-5 transition-all duration-300 border flex flex-col justify-between space-y-4 ${
                  isMaint
                    ? 'bg-gradient-to-b from-[#1c160c] to-[#14100b] border-yellow-500/50 shadow-[0_4px_25px_rgba(234,179,8,0.15)]'
                    : isActive
                    ? 'bg-gradient-to-b from-[#16102e] to-[#0f0b20] border-purple-500/30 hover:border-purple-500/50 shadow-xl'
                    : 'bg-[#120f20] border-white/10 opacity-75'
                }`}
              >
                {/* Card Top: Category & Status Badge */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-black/40 border border-purple-500/30 text-[11px] font-bold text-purple-300 uppercase tracking-wide">
                      {p.category || 'APKMOD / NON-ROOT'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isMaint ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 text-xs font-extrabold animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-yellow-400" />
                          <span>UNDER MAINTENANCE</span>
                        </span>
                      ) : isActive ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>ACTIVE</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-700/40 border border-gray-600/40 text-gray-300 text-xs font-bold">
                          <span>DISABLED</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Title & Info */}
                  <h3 className="text-lg font-extrabold text-white tracking-tight mb-1 flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-xs font-mono font-bold text-gray-400">{stockCount} Keys</span>
                  </h3>

                  {/* Maintenance Reason Notice if set */}
                  {isMaint && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-yellow-950/40 border border-yellow-500/30 text-xs text-yellow-200 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-yellow-300">
                        <Info className="w-3.5 h-3.5" />
                        <span>Maintenance Notice (Bot Display):</span>
                      </div>
                      <p className="text-[11px] text-yellow-200/90 leading-relaxed italic">
                        "{p.maintenanceReason || 'Updating cheat & panel for latest game version. Purchasing paused.'}"
                      </p>
                    </div>
                  )}

                  {/* Plans & Pricing Preview */}
                  {Array.isArray(p.plans) && p.plans.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                      {p.plans.slice(0, 3).map((pl, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-black/40 text-[10px] font-mono text-gray-300 border border-white/5"
                        >
                          {pl.duration || pl.name}: ₹{pl.price}
                          {pl.resellerPrice ? ` (VIP ₹${pl.resellerPrice})` : ''}
                        </span>
                      ))}
                      {p.plans.length > 3 && (
                        <span className="text-[10px] text-gray-400 font-bold">+{p.plans.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  {/* Big 1-Click Maintenance Toggle Button */}
                  <button
                    onClick={(e) => handleToggleMaintenance(p, e)}
                    disabled={isBusy}
                    className={`w-full py-2.5 px-4 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                      isBusy
                        ? 'bg-gray-800 text-gray-400 border border-gray-700 cursor-not-allowed'
                        : isMaint
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                        : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/50 hover:border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)]'
                    }`}
                  >
                    {isBusy ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating Telegram Bot...</span>
                      </>
                    ) : isMaint ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Turn OFF Maintenance (Make Active 🟢)</span>
                      </>
                    ) : (
                      <>
                        <Wrench className="w-4 h-4 text-yellow-400" />
                        <span>Put Under Maintenance (அண்டர் மைனஸ் 🛠️)</span>
                      </>
                    )}
                  </button>

                  {/* Edit Custom Notice Button */}
                  <button
                    onClick={() => {
                      setReasonModalProduct(p);
                      setCustomReason(p.maintenanceReason || '');
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Set Custom Maintenance Reason (காரணம்)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Set Custom Maintenance Reason */}
      {reasonModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#17122e] border border-purple-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-300">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{reasonModalProduct.name}</h3>
                  <span className="text-xs text-yellow-400 font-bold">Custom Maintenance Notice</span>
                </div>
              </div>
              <button
                onClick={() => setReasonModalProduct(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Quick Template Reasons (கிளிக் செய்து தேர்வு செய்க):
              </label>
              <div className="grid grid-cols-1 gap-2">
                {presetReasons.map((pr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomReason(pr.text)}
                    className="p-2.5 rounded-xl bg-black/40 hover:bg-purple-950/50 border border-white/10 hover:border-purple-400/50 text-left transition-all cursor-pointer text-xs space-y-1"
                  >
                    <div className="font-bold text-purple-300">{pr.label}</div>
                    <div className="text-[11px] text-gray-400 italic">"{pr.text}"</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Custom Message / காரணம் (Bot Users Will See This):
              </label>
              <textarea
                rows={3}
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="Enter specific maintenance note (e.g., Free Fire OB46 Update in progress, restock at 7 PM)..."
                className="w-full p-3 rounded-xl bg-black/50 border border-purple-500/30 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setReasonModalProduct(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReasonAndMaintenance}
                disabled={savingReason}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                {savingReason ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Save & Set Maintenance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Action Confirmation */}
      {bulkConfirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#18122e] border border-purple-500/40 rounded-3xl p-6 shadow-2xl text-white space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-white">
                {bulkConfirmAction === 'ALL_MAINTENANCE'
                  ? 'Put All Products Under Maintenance?'
                  : 'Activate All Products?'}
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                {bulkConfirmAction === 'ALL_MAINTENANCE'
                  ? 'This will immediately mark all panels & cheats as UNDER MAINTENANCE on the website and Telegram Bot. Users will not be able to purchase until active.'
                  : 'This will activate all panels & cheats, allowing users to buy keys instantly on the website and Telegram Bot.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setBulkConfirmAction(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkAction(bulkConfirmAction)}
                disabled={isBulkProcessing}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-lg ${
                  bulkConfirmAction === 'ALL_MAINTENANCE'
                    ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isBulkProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Confirm Action</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductMaintenanceDashboard;
