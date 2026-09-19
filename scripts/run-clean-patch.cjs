const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

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

const compiledLne = esbuild.transformSync(cleanLneJsx, {
  loader: "jsx",
  jsxFactory: "r.jsx",
  jsxFragment: "r.Fragment"
}).code.trim().replace(/;$/, "");

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, "utf8");

  // Find where lne starts and une starts
  const lneStartIdx = code.indexOf("lne = (");
  const altLneStartIdx = code.indexOf("lne=({products:");
  const actualStart = lneStartIdx !== -1 ? lneStartIdx : altLneStartIdx;

  const uneTarget = ",une=({soldKeys:n=[],transactions:e=[]";
  const uneIdx = code.indexOf(uneTarget);

  console.log(filePath, "actualStart:", actualStart, "uneIdx:", uneIdx);

  if (actualStart !== -1 && uneIdx !== -1) {
    code = code.substring(0, actualStart) + compiledLne + code.substring(uneIdx);
  }

  try {
    esbuild.transformSync(code, { loader: "js" });
    console.log(filePath, "is 100% VALID JAVASCRIPT!");
    fs.writeFileSync(filePath, code, "utf8");
  } catch (err) {
    console.error(filePath, "Syntax error:", err.message);
  }
}

patchFile(path.join(__dirname, "../public/assets/index-BvHT743v.js"));
patchFile(path.join(__dirname, "../dist/assets/index-BvHT743v.js"));
