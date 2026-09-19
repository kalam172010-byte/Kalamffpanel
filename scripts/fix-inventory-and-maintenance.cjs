const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('[Inventory & Maintenance Patch] Updating bundle components...');

const cleanWteJsx = `Wte=({product:n,isSelected:e=!1,onToggleSelect:t,onEdit:s,onToggleStatus:a,onToggleMaintenance:i,onDelete:l})=>{
  if (!n) return null;
  const [u, d] = q.useState(false);
  const [h, p] = q.useState(false);
  const g = n.status === "ACTIVE";
  const b = n.status === "MAINTENANCE";
  const x = n.imageUrl || (n.videoUrl && typeof l0 === "function" && l0(n.videoUrl) ? g1(n.videoUrl, "hq") : null);
  const w = !!(n.videoUrl && typeof l0 === "function" && l0(n.videoUrl));
  const S = n.videoUrl && typeof ry === "function" ? ry(n.videoUrl) : null;

  const j = (P) => {
    P.stopPropagation();
    if (!u) {
      d(true);
      return;
    }
    d(false);
    l(n.id);
  };

  const _ = (P) => {
    P.stopPropagation();
    d(false);
  };

  return (
    <r.Fragment>
      <div className={"p-4 rounded-2xl transition-all space-y-3.5 " + (e ? "bg-[#1b1535] border-2 border-[#a855f7] shadow-[0_0_30px_rgba(168,85,247,0.35)]" : b ? "bg-[#1f1a14] border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)]" : "bg-[#141026] border border-purple-500/25 shadow-[0_4px_25px_rgba(0,0,0,0.5)]")}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {t && (
              <button
                type="button"
                onClick={(P) => { P.stopPropagation(); t(n.id); }}
                className={"w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer " + (e ? "bg-[#a855f7] text-white border-2 border-[#c084fc] shadow-[0_0_12px_rgba(168,85,247,0.6)]" : "bg-white/5 hover:bg-white/10 text-transparent border border-white/20 hover:border-purple-400/50")}
                title={e ? "Deselect product" : "Select product for bulk action"}
              >
                <Sn className={"w-4 h-4 stroke-[3] " + (e ? "text-white opacity-100" : "opacity-0")} />
              </button>
            )}
            <div className="w-8 h-8 rounded-lg bg-yellow-500/15 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
              <H5 className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-500/50 text-amber-400 text-[11px] font-bold tracking-wide uppercase shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            <Sn className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
            <span>{n.category || "NON-ROOT MOBILE"}</span>
          </div>
        </div>

        {x && (
          <div onClick={() => p(true)} className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/60 border border-purple-500/20 group cursor-pointer shadow-inner">
            <img src={x} alt={n.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-2.5">
              <div className="flex items-center gap-1.5">
                {n.imageUrl && <span className="text-[9px] font-bold bg-pink-600/90 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow"><$m className="w-2.5 h-2.5" />Photo</span>}
                {w && <span className="text-[9px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow"><io className="w-2.5 h-2.5 fill-white" />YouTube</span>}
              </div>
              <span className="text-[10px] text-white/90 font-bold bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Wc className="w-3 h-3" />View Media</span>
            </div>
          </div>
        )}

        <div className="flex items-end justify-between pt-1">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">PRODUCT</span>
            <h3 className="text-base font-bold text-white tracking-tight">{n.name}</h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">STOCK</span>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs font-bold text-white font-mono">{Array.isArray(n.keys) ? n.keys.length : (n.stock || 0)} key(s)</span>
              {g && <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />ACTIVE</span>}
              {n.status === "DISABLED" && <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />DISABLED</span>}
              {b && <span className="flex items-center gap-1 text-[11px] font-bold text-yellow-300 bg-yellow-950/60 px-2 py-0.5 rounded border border-yellow-500/40"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" />MAINTENANCE</span>}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Ge.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => s(n)} className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#231e3d] hover:bg-[#2c264d] border border-purple-500/30 text-gray-200 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm">
              <Q7 className="w-3.5 h-3.5 text-gray-300" />
              <span>Edit</span>
            </Ge.button>
            <Ge.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => a(n)} className={"flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm " + (n.status === "ACTIVE" ? "bg-amber-950/50 hover:bg-amber-950/70 border-amber-600/50 text-amber-300" : "bg-emerald-950/50 hover:bg-emerald-950/70 border-emerald-600/50 text-emerald-300")}>
              {n.status === "ACTIVE" ? (
                <r.Fragment>
                  <vD className="w-3.5 h-3.5 text-amber-400" />
                  <span>Disable</span>
                </r.Fragment>
              ) : (
                <r.Fragment>
                  <io className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enable</span>
                </r.Fragment>
              )}
            </Ge.button>
          </div>

          <Ge.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(P) => { P.stopPropagation(); if (i) { i(n); } else if (a) { a(n); } }}
            className={"w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm " + (b ? "bg-yellow-500/30 hover:bg-yellow-500/40 border-yellow-400 text-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.3)]" : "bg-yellow-950/30 hover:bg-yellow-950/50 border-yellow-600/40 text-yellow-300 hover:border-yellow-400")}
          >
            <vD className="w-3.5 h-3.5 text-yellow-400" />
            <span>{b ? "🛠️ Under Maintenance (ON) - Click to Deactivate" : "🛠️ Put Under Maintenance (அண்டர் மைனஸ்)"}</span>
          </Ge.button>

          {u ? (
            <div className="grid grid-cols-2 gap-2">
              <Ge.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={_} className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-gray-200 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm">
                <hs className="w-3.5 h-3.5 text-gray-300" />
                <span>Cancel</span>
              </Ge.button>
              <Ge.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={j} className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-950/80 border border-rose-600/50 text-rose-300 hover:text-rose-200 text-xs font-semibold transition-all cursor-pointer shadow-sm">
                <Fo className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete</span>
              </Ge.button>
            </div>
          ) : (
            <Ge.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={j} className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm">
              <Fo className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete</span>
            </Ge.button>
          )}
        </div>
      </div>

      {h && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <Ge.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-[#141026] border border-purple-500/40 rounded-3xl p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400"><Wc className="w-4 h-4" /></div>
                <div>
                  <h3 className="text-sm font-bold text-white">{n.name}</h3>
                  <span className="text-[10px] text-gray-400">Photo & Video Media</span>
                </div>
              </div>
              <button type="button" onClick={() => p(false)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"><hs className="w-4 h-4" /></button>
            </div>
            {n.imageUrl && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-pink-400 flex items-center gap-1.5"><$m className="w-3.5 h-3.5" /><span>Product Photo</span></span>
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg">
                  <img src={n.imageUrl} alt={n.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
            )}
            {S && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-red-400 flex items-center gap-1.5"><io className="w-3.5 h-3.5 fill-red-400" /><span>YouTube Video</span></span>
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-red-500/40 shadow-lg">
                  <iframe src={S} title={n.name + " Video"} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                </div>
              </div>
            )}
            <button type="button" onClick={() => p(false)} className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer shadow-lg">Close Preview</button>
          </Ge.div>
        </div>
      )}
    </r.Fragment>
  );
};`;

const cleanLneJsx = `lne=({products: initialProducts = [], apiConfigs = [], onUpdateProductKeys: updateKeysCb, onToggleMaintenance: toggleMaintCb, onToggleStatus: toggleStatusCb}) => {
  const [prodsList, setProdsList] = q.useState(initialProducts);
  const [selectedProdId, setSelectedProdId] = q.useState("");
  const [selectedPlan, setSelectedPlan] = q.useState("all");
  const [isAddKeyModalOpen, setIsAddKeyModalOpen] = q.useState(false);
  const [bulkKeyText, setBulkKeyText] = q.useState("");
  const [copiedKey, setCopiedKey] = q.useState(null);
  const [searchTerm, setSearchTerm] = q.useState("");
  const [statusFilter, setStatusFilter] = q.useState("all");
  const [feedbackMsg, setFeedbackMsg] = q.useState(null);
  const [expandedKeysProdId, setExpandedKeysProdId] = q.useState(null);

  q.useEffect(() => {
    if (Array.isArray(initialProducts) && initialProducts.length > 0) {
      setProdsList(initialProducts);
    }
  }, [initialProducts]);

  const showToast = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const getProdKeys = (prod) => {
    if (!prod) return [];
    if (Array.isArray(prod.keys)) return prod.keys;
    return [];
  };

  const handleToggleMaintenance = async (prod, ev) => {
    if (ev) ev.stopPropagation();
    const curStatus = (prod.status || "ACTIVE").toUpperCase();
    const nextStatus = curStatus === "MAINTENANCE" ? "ACTIVE" : "MAINTENANCE";
    const isMaint = nextStatus === "MAINTENANCE";

    const updated = prodsList.map(p => p.id === prod.id ? { ...p, status: nextStatus } : p);
    setProdsList(updated);
    try { localStorage.setItem("kalam_products_db", JSON.stringify(updated)); } catch(err) {}

    if (toggleMaintCb) {
      toggleMaintCb(prod);
    }

    try {
      await fetch("/api/admin/products/" + encodeURIComponent(prod.id) + "/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenance: isMaint, status: nextStatus })
      });
    } catch(err) {}

    showToast("Product " + prod.name + " is now " + (isMaint ? "🟡 UNDER MAINTENANCE (அண்டர் மைனஸ்)" : "🟢 ACTIVE"));
  };

  const handleSetStatus = async (prod, targetStatus, ev) => {
    if (ev) ev.stopPropagation();
    const updated = prodsList.map(p => p.id === prod.id ? { ...p, status: targetStatus } : p);
    setProdsList(updated);
    try { localStorage.setItem("kalam_products_db", JSON.stringify(updated)); } catch(err) {}

    if (toggleStatusCb) {
      toggleStatusCb(prod);
    }

    try {
      await fetch("/api/admin/products/" + encodeURIComponent(prod.id) + "/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus })
      });
    } catch(err) {}

    showToast("Product " + prod.name + " status set to " + targetStatus);
  };

  const handleDecrementStock = async (prod, ev) => {
    if (ev) ev.stopPropagation();
    const currentKeys = getProdKeys(prod);
    let newKeys = [];
    let newStock = 0;

    if (currentKeys.length > 0) {
      newKeys = [...currentKeys];
      newKeys.pop();
      newStock = newKeys.length;
    } else {
      newStock = Math.max(0, (Number(prod.stock) || 0) - 1);
    }

    const updated = prodsList.map(p => p.id === prod.id ? { ...p, keys: newKeys, stock: newStock } : p);
    setProdsList(updated);
    try { localStorage.setItem("kalam_products_db", JSON.stringify(updated)); } catch(err) {}

    if (updateKeysCb) {
      updateKeysCb(prod.id, "all", newKeys);
    }

    try {
      await fetch("/api/admin/products/" + encodeURIComponent(prod.id) + "/stock/decrement", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
    } catch(err) {}

    showToast("Stock decremented for " + prod.name + ". Remaining keys: " + newStock);
  };

  const handleClearStock = async (prod, ev) => {
    if (ev) ev.stopPropagation();
    if (!confirm("Are you sure you want to clear all stock keys for " + prod.name + "?")) return;

    const updated = prodsList.map(p => p.id === prod.id ? { ...p, keys: [], stock: 0 } : p);
    setProdsList(updated);
    try { localStorage.setItem("kalam_products_db", JSON.stringify(updated)); } catch(err) {}

    if (updateKeysCb) {
      updateKeysCb(prod.id, "all", []);
    }

    try {
      await fetch("/api/admin/products/" + encodeURIComponent(prod.id) + "/stock/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
    } catch(err) {}

    showToast("Cleared all keys for " + prod.name + ". Status: OUT OF STOCK (0 Keys)");
  };

  const handleOpenAddKeyModal = (prod, ev) => {
    if (ev) ev.stopPropagation();
    setSelectedProdId(prod.id);
    setIsAddKeyModalOpen(true);
  };

  const handleSaveImportedKeys = async () => {
    const target = prodsList.find(p => p.id === selectedProdId) || prodsList[0];
    if (!target || !bulkKeyText.trim()) return;

    const rawKeys = bulkKeyText.split("\\n").map(k => k.trim()).filter(k => k.length > 0);
    if (rawKeys.length === 0) return;

    const existing = getProdKeys(target);
    const combined = [...rawKeys, ...existing];

    const updated = prodsList.map(p => p.id === target.id ? { ...p, keys: combined, stock: combined.length, status: p.status === "DISABLED" ? "ACTIVE" : p.status } : p);
    setProdsList(updated);
    try { localStorage.setItem("kalam_products_db", JSON.stringify(updated)); } catch(err) {}

    if (updateKeysCb) {
      updateKeysCb(target.id, selectedPlan || "all", combined);
    }

    try {
      await fetch("/api/admin/products/" + encodeURIComponent(target.id) + "/stock/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: rawKeys })
      });
    } catch(err) {}

    showToast("Successfully added " + rawKeys.length + " real key(s) to " + target.name + "!");
    setBulkKeyText("");
    setIsAddKeyModalOpen(false);
  };

  const handleCopyKey = (keyStr, ev) => {
    if (ev) ev.stopPropagation();
    navigator.clipboard.writeText(keyStr);
    setCopiedKey(keyStr);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDeleteSingleKey = async (prod, keyToDelete, ev) => {
    if (ev) ev.stopPropagation();
    const currentKeys = getProdKeys(prod);
    const remaining = currentKeys.filter(k => k !== keyToDelete);

    const updated = prodsList.map(p => p.id === prod.id ? { ...p, keys: remaining, stock: remaining.length } : p);
    setProdsList(updated);
    try { localStorage.setItem("kalam_products_db", JSON.stringify(updated)); } catch(err) {}

    if (updateKeysCb) {
      updateKeysCb(prod.id, "all", remaining);
    }

    showToast("Deleted 1 key from " + prod.name + ". Remaining: " + remaining.length);
  };

  const totalProducts = prodsList.length;
  const totalKeys = prodsList.reduce((acc, p) => acc + (getProdKeys(p).length || 0), 0);
  const maintenanceCount = prodsList.filter(p => (p.status || "").toUpperCase() === "MAINTENANCE").length;
  const outOfStockCount = prodsList.filter(p => getProdKeys(p).length === 0 && !p.api1Restock?.remoteProductId && !p.api2Restock?.remoteProductId).length;
  const activeCount = prodsList.filter(p => (p.status || "ACTIVE").toUpperCase() === "ACTIVE" && (getProdKeys(p).length > 0 || p.api1Restock?.remoteProductId || p.api2Restock?.remoteProductId)).length;

  const filteredProds = prodsList.filter(p => {
    const nameMatch = !searchTerm.trim() || 
      (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.id && p.id.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!nameMatch) return false;

    const pStatus = (p.status || "ACTIVE").toUpperCase();
    const kCount = getProdKeys(p).length;

    if (statusFilter === "active") return pStatus === "ACTIVE";
    if (statusFilter === "maintenance") return pStatus === "MAINTENANCE";
    if (statusFilter === "out_of_stock") return kCount === 0 && pStatus !== "MAINTENANCE";
    return true;
  });

  const currentModalTarget = prodsList.find(p => p.id === selectedProdId) || prodsList[0] || null;

  return (
    <div className="space-y-4" id="admin-inventory-management-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#161622]/90 border border-cyan-500/20 p-4 rounded-2xl shadow-[0_0_25px_rgba(0,229,255,0.08)]">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <nc className="w-5 h-5 text-cyan-400" />
            <span>📦 Inventory & Stock Management (இன்வென்டரி மேனேஜ்மென்ட்)</span>
          </h2>
          <p className="text-[11px] text-gray-300">
            Manage stock keys, decrement counts, and toggle individual product Under Maintenance (அண்டர் மைனஸ்) mode separately.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (prodsList.length > 0) {
                setSelectedProdId(prodsList[0].id);
                setIsAddKeyModalOpen(true);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Aa className="w-4 h-4" />
            <span>+ Add Keys to Product</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-[#161622]/95 border border-cyan-500/30 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <fi className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Total Stored Keys</span>
            <span className="text-base font-black text-white font-mono">{totalKeys} Keys</span>
          </div>
        </div>

        <div className="p-3 bg-[#161622]/95 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Sn className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Active In-Stock</span>
            <span className="text-base font-black text-emerald-400 font-mono">{activeCount} Products</span>
          </div>
        </div>

        <div className="p-3 bg-[#161622]/95 border border-yellow-500/40 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-yellow-400 shrink-0">
            <vD className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Under Maintenance</span>
            <span className="text-base font-black text-yellow-400 font-mono">{maintenanceCount} Items</span>
          </div>
        </div>

        <div className="p-3 bg-[#161622]/95 border border-rose-500/30 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <iu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Out of Stock</span>
            <span className="text-base font-black text-rose-400 font-mono">{outOfStockCount} Items</span>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <Ge.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-cyan-950/70 border border-cyan-400 text-cyan-200 text-xs font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.2)]"
        >
          <qi className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </Ge.div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#161622]/80 p-3 rounded-2xl border border-white/10">
        <div className="relative flex-1">
          <Vo className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by name, ID, or category..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none placeholder-gray-500"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={"px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer shrink-0 " + (statusFilter === "all" ? "bg-cyan-500 text-black border-cyan-400 font-black shadow-[0_0_12px_rgba(0,229,255,0.4)]" : "bg-black/40 text-gray-400 border-white/5 hover:text-white")}
          >
            All ({totalProducts})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={"px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer shrink-0 " + (statusFilter === "active" ? "bg-emerald-500 text-black border-emerald-400 font-black shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "bg-black/40 text-gray-400 border-white/5 hover:text-emerald-300")}
          >
            🟢 Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("maintenance")}
            className={"px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer shrink-0 " + (statusFilter === "maintenance" ? "bg-yellow-500 text-black border-yellow-400 font-black shadow-[0_0_12px_rgba(234,179,8,0.4)]" : "bg-black/40 text-gray-400 border-white/5 hover:text-yellow-300")}
          >
            🟡 Under Maintenance ({maintenanceCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("out_of_stock")}
            className={"px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer shrink-0 " + (statusFilter === "out_of_stock" ? "bg-rose-500 text-white border-rose-400 font-black shadow-[0_0_12px_rgba(244,63,94,0.4)]" : "bg-black/40 text-gray-400 border-white/5 hover:text-rose-300")}
          >
            🔴 Out of Stock ({outOfStockCount})
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredProds.length === 0 ? (
          <div className="p-8 text-center bg-[#161622]/90 rounded-2xl border border-white/10 space-y-2">
            <Vo className="w-8 h-8 text-gray-500 mx-auto" />
            <h4 className="text-xs font-bold text-white">No Products Found</h4>
            <p className="text-[10px] text-gray-400">Try changing your search term or status filter.</p>
          </div>
        ) : (
          filteredProds.map((prod, idx) => {
            const keys = getProdKeys(prod);
            const isMaintenance = (prod.status || "").toUpperCase() === "MAINTENANCE";
            const isOutOfStock = keys.length === 0 && !prod.api1Restock?.remoteProductId && !prod.api2Restock?.remoteProductId;
            const isActive = (prod.status || "ACTIVE").toUpperCase() === "ACTIVE" && !isMaintenance;
            const isExpanded = expandedKeysProdId === prod.id;
            const hasApiRestock = !!(prod.api1Restock?.remoteProductId || prod.api2Restock?.remoteProductId);

            return (
              <div
                key={prod.id || idx}
                className={"p-4 rounded-2xl border transition-all space-y-3 " + (
                  isMaintenance
                    ? "bg-[#1f1a14] border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)]"
                    : isOutOfStock
                    ? "bg-[#1c1417] border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.12)]"
                    : "bg-[#141224] border-purple-500/25 hover:border-purple-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-500/30">
                        #{idx + 1} {prod.id}
                      </span>
                      <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                        {prod.name}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 uppercase">
                        {prod.category || "NON-ROOT"}
                      </span>
                      {prod.game && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 uppercase">
                          {prod.game}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-300 flex-wrap">
                      <span>
                        Plans:{" "}
                        <strong className="text-white font-mono">
                          {(prod.plans || []).map((pl) => pl.duration + ": ₹" + pl.price).join(" | ") || "1 Day: ₹99"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <div className={"px-2.5 py-1 rounded-xl font-mono text-xs font-bold border flex items-center gap-1.5 " + (
                      keys.length > 0
                        ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-300"
                        : hasApiRestock
                        ? "bg-purple-950/70 border-purple-500/50 text-purple-300"
                        : "bg-rose-950/70 border-rose-500/50 text-rose-300"
                    )}>
                      {keys.length > 0 ? (
                        <r.Fragment>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{keys.length} Keys in Stock</span>
                        </r.Fragment>
                      ) : hasApiRestock ? (
                        <r.Fragment>
                          <Cr className="w-3.5 h-3.5 text-purple-400" />
                          <span>Live API Restock</span>
                        </r.Fragment>
                      ) : (
                        <r.Fragment>
                          <iu className="w-3.5 h-3.5 text-rose-400" />
                          <span>0 Keys (OUT OF STOCK)</span>
                        </r.Fragment>
                      )}
                    </div>

                    {isMaintenance ? (
                      <span className="px-2.5 py-1 rounded-xl bg-yellow-500/25 border border-yellow-500/60 text-yellow-300 text-xs font-black flex items-center gap-1 shadow-[0_0_12px_rgba(234,179,8,0.3)]">
                        <vD className="w-3.5 h-3.5 text-yellow-400" />
                        <span>🛠️ UNDER MAINTENANCE (அண்டர் மைனஸ்)</span>
                      </span>
                    ) : isActive ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>🟢 ACTIVE & LIVE</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-gray-800 border border-gray-600 text-gray-300 text-xs font-bold">
                        ⚪ DISABLED
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(e) => handleToggleMaintenance(prod, e)}
                    className={"py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm " + (
                      isMaintenance
                        ? "bg-yellow-500/30 hover:bg-yellow-500/40 border-yellow-400 text-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                        : "bg-yellow-950/40 hover:bg-yellow-950/60 border-yellow-600/50 text-yellow-300 hover:border-yellow-400"
                    )}
                    title="Toggle Under Maintenance mode for this product only"
                  >
                    <vD className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <span className="truncate">
                      {isMaintenance ? "🟡 Deactivate Maint." : "🛠️ Under Maintenance (அண்டர் மைனஸ்)"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleSetStatus(prod, "ACTIVE", e)}
                    className={"py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm " + (
                      isActive && !isMaintenance
                        ? "bg-emerald-600/30 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                        : "bg-emerald-950/30 hover:bg-emerald-950/50 border-emerald-600/40 text-emerald-300 hover:border-emerald-400"
                    )}
                  >
                    <Sn className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">🟢 Make Active</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDecrementStock(prod, e)}
                    disabled={keys.length === 0 && (!prod.stock || prod.stock <= 0)}
                    className="py-2 px-3 rounded-xl bg-orange-950/40 hover:bg-orange-950/60 disabled:opacity-40 disabled:cursor-not-allowed border border-orange-600/50 hover:border-orange-400 text-orange-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    title="Decrement 1 key from this product's pool"
                  >
                    <Fo className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="truncate">➖ Stock -1 (மைனஸ்)</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleOpenAddKeyModal(prod, e)}
                    className="py-2 px-3 rounded-xl bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Aa className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">➕ Add Keys</span>
                  </button>

                  <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setExpandedKeysProdId(isExpanded ? null : prod.id)}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-gray-200 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <zr className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{isExpanded ? "Hide Keys" : "Keys (" + keys.length + ")"}</span>
                    </button>
                    {keys.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => handleClearStock(prod, e)}
                        className="py-2 px-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:text-rose-200 text-xs transition-all cursor-pointer"
                        title="Clear all keys / Set to 0"
                      >
                        <Fo className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <span className="font-bold">Loaded Real Keys ({keys.length}):</span>
                      <span className="text-[10px] text-gray-400">Click copy button to copy key to clipboard</span>
                    </div>
                    {keys.length === 0 ? (
                      <div className="p-3 text-center bg-black/40 rounded-xl border border-white/5 text-[11px] text-gray-400">
                        No keys currently loaded for this product. Click "➕ Add Keys" to paste keys.
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
                        {keys.map((kStr, kIdx) => (
                          <div
                            key={kIdx}
                            className="p-1.5 px-2 rounded-lg bg-black/50 border border-white/5 flex items-center justify-between gap-2 text-white hover:border-cyan-500/30"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-[10px] text-gray-500">#{kIdx + 1}</span>
                              <span className="text-cyan-300 font-semibold truncate select-all">{kStr}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleCopyKey(kStr, e)}
                                className="p-1 rounded bg-white/5 hover:bg-white/15 text-gray-300"
                                title="Copy Key"
                              >
                                {copiedKey === kStr ? (
                                  <Sn className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <zr className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSingleKey(prod, kStr, e)}
                                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                                title="Delete key"
                              >
                                <Fo className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isAddKeyModalOpen && currentModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsAddKeyModalOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />
          <div className="relative z-50 w-full max-w-md bg-[#161622] border border-cyan-500/50 rounded-3xl p-5 shadow-[0_0_40px_rgba(0,229,255,0.25)] text-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <fi className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Import Real Activation Keys</h3>
                  <span className="text-[10px] text-gray-400">
                    Target Product: <strong className="text-cyan-300">{currentModalTarget.name}</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddKeyModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <Fo className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-[11px] text-gray-300 block font-semibold">
                Paste Real Keys (One Key per line)
              </label>
              <textarea
                value={bulkKeyText}
                onChange={(e) => setBulkKeyText(e.target.value)}
                placeholder={"KLM-VIP-991823-XYZ\\nKLM-VIP-881290-ABC\\nKLM-VIP-773819-DEF"}
                rows={6}
                className="w-full p-3 rounded-2xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
              />
              <span className="text-[10px] text-gray-400 block">
                Each line will be added as 1 available key in the product inventory pool.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsAddKeyModalOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveImportedKeys}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(0,229,255,0.4)] cursor-pointer"
              >
                Save & Import Keys
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};`;

function compileJsxToReactRuntime(jsxString) {
  const out = esbuild.transformSync(jsxString, {
    loader: "jsx",
    jsx: "automatic"
  });
  return out.code
    .replace(/import\s*\{\s*jsx\s*as\s*_jsx,\s*jsxs\s*as\s*_jsxs,\s*Fragment\s*as\s*_Fragment\s*\}\s*from\s*"react\/jsx-runtime";?/g, "")
    .replace(/import\s*\{\s*jsx\s*as\s*_jsx,\s*jsxs\s*as\s*_jsxs\s*\}\s*from\s*"react\/jsx-runtime";?/g, "")
    .replace(/import\s*\{\s*jsx,\s*jsxs,\s*Fragment\s*\}\s*from\s*"react\/jsx-runtime";?/g, "")
    .replace(/import\s*\{\s*jsx,\s*jsxs\s*\}\s*from\s*"react\/jsx-runtime";?/g, "")
    .replace(/\b_jsx\(/g, "r.jsx(")
    .replace(/\b_jsxs\(/g, "r.jsxs(")
    .replace(/\b_Fragment\b/g, "r.Fragment")
    .replace(/\bjsx\(/g, "r.jsx(")
    .replace(/\bjsxs\(/g, "r.jsxs(")
    .trim()
    .replace(/;$/, "");
}

const compiledWte = compileJsxToReactRuntime(cleanWteJsx);
const compiledLne = compileJsxToReactRuntime(cleanLneJsx);

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, "utf8");

  // 0. Patch React 19 jsx runtime helper (bL) to safely handle null/undefined props (a)
  if (code.includes('function t(s,a,i){var l=null;')) {
    code = code.replace('function t(s,a,i){var l=null;', 'function t(s,a,i){if(!a)a={};var l=null;');
  }

  // 1. Patch Wte
  const wteIdx = code.indexOf("Wte=");
  const yteIdx = code.indexOf("Yte=", wteIdx);
  if (wteIdx !== -1 && yteIdx !== -1) {
    code = code.substring(0, wteIdx) + compiledWte + "," + code.substring(yteIdx);
  }

  // 2. Patch lne
  const lneStartIdx = code.indexOf("lne = (");
  const altLneStartIdx = code.indexOf("lne=({products:");
  const altLneStartIdx2 = code.indexOf("lne=({");
  let actualStart = -1;
  if (lneStartIdx !== -1) actualStart = lneStartIdx;
  else if (altLneStartIdx !== -1) actualStart = altLneStartIdx;
  else if (altLneStartIdx2 !== -1) actualStart = altLneStartIdx2;

  const uneTarget = ",une=({soldKeys:n=[],transactions:e=[]";
  const uneIdx = code.indexOf(uneTarget);

  if (actualStart !== -1 && uneIdx !== -1) {
    code = code.substring(0, actualStart) + compiledLne + code.substring(uneIdx);
  }

  // 3. Ensure invocation passes callbacks
  const oldCall = 'l==="id_stock"&&r.jsx(lne,{products:A,apiConfigs:F,onUpdateProductKeys:zs})';
  const newCall = 'l==="id_stock"&&r.jsx(lne,{products:A,apiConfigs:F,onUpdateProductKeys:zs,onToggleMaintenance:qn,onToggleStatus:Wt})';
  if (code.includes(oldCall)) {
    code = code.replace(oldCall, newCall);
  }

  // 4. Safe product filtering in nne
  code = code.replace(
    /w\s*=\s*n\.filter\(/g,
    'w=(Array.isArray(n)?n.filter(Boolean):[]).filter('
  );

  try {
    esbuild.transformSync(code, { loader: "js" });
    console.log("[Inventory & Maintenance Patch]", filePath, "is 100% VALID JAVASCRIPT!");
    fs.writeFileSync(filePath, code, "utf8");
  } catch (err) {
    console.error("[Inventory & Maintenance Patch]", filePath, "Syntax error:", err.message);
  }
}

patchFile(path.join(__dirname, "../public/assets/index-BvHT743v.js"));
patchFile(path.join(__dirname, "../dist/assets/index-BvHT743v.js"));
