const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

function patchBundle(filePath) {
  console.log('Patching file:', filePath);
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Locate Cte boundaries
  const startCte = code.indexOf(',Cte=');
  const endCte = code.indexOf(',vte=', startCte);

  if (startCte === -1 || endCte === -1) {
    console.error('Could not find Cte boundaries in:', filePath);
    return false;
  }

  // 2. Define upgraded Cte component
  const upgradedCte = `,Cte=({transactions:n=[],onViewInvoice:e,userKeys:t=[],currentUser:s,storeSettings:a,onOpenDeposit:mDep,onOpenBuyKeys:mBuy})=>{
  const [stx, setStx] = q.useState([]);
  const [loading, setLoading] = q.useState(!0);
  const [refreshing, setRefreshing] = q.useState(!1);
  const [filter, setFilter] = q.useState("ALL");
  const [search, setSearch] = q.useState("");
  const [copiedId, setCopiedId] = q.useState(null);
  const [checkingId, setCheckingId] = q.useState(null);
  const [toast, setToast] = q.useState(null);

  const fetchHistory = (isManual = !1) => {
    if (isManual) setRefreshing(!0);
    else setLoading(!0);

    fetch("/api/payment-history")
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.transactions)) {
          setStx(data.transactions);
        }
      })
      .catch(err => {
        console.warn("Error fetching payment history:", err);
      })
      .finally(() => {
        setLoading(!1);
        setRefreshing(!1);
      });
  };

  q.useEffect(() => {
    fetchHistory(!1);
    const iv = setInterval(() => fetchHistory(!1), 20000);
    return () => clearInterval(iv);
  }, []);

  const copyText = (txt, id) => {
    if (!txt) return;
    navigator.clipboard.writeText(txt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const checkLiveStatus = async (ord) => {
    const oid = ord.orderId || ord.id;
    if (!oid) return;
    setCheckingId(oid);
    try {
      const resp = await fetch("/api/check-payment/" + encodeURIComponent(oid));
      const result = await resp.json();
      if (result && (result.isPaid || result.status === "SUCCESS")) {
        setToast({ text: "Payment confirmed! ₹" + (result.amount || ord.amount) + " credited.", type: "success" });
        fetchHistory(!0);
      } else {
        setToast({ text: (result && result.message) || "Payment is still pending on gateway.", type: "info" });
      }
    } catch (err) {
      setToast({ text: "Status check error. Please retry.", type: "error" });
    } finally {
      setCheckingId(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  // Merge server transactions and local wallet/key purchase transactions
  const mergedList = q.useMemo(() => {
    const map = new Map();
    // Server transactions (authoritative gateway orders)
    for (const item of stx) {
      if (item && (item.id || item.orderId)) {
        const key = String(item.orderId || item.id).trim();
        map.set(key, {
          id: item.id || key,
          orderId: item.orderId || key,
          type: item.type || "DEPOSIT",
          amount: Number(item.amount) || 0,
          status: (item.status || "PENDING").toUpperCase(),
          gateway: item.gateway || "UPI Payment",
          utr: item.utr || "",
          paymentLink: item.paymentLink || "",
          qrUrl: item.qrUrl || "",
          createdAt: item.createdAt || Date.now(),
          date: item.date || "Recent",
          isServer: !0
        });
      }
    }
    // Local transactions (key purchases, wallet changes)
    for (const item of (n || [])) {
      if (!item) continue;
      const key = String(item.utrOrReference || item.orderId || item.id).trim();
      if (!map.has(key)) {
        map.set(key, {
          id: item.id || key,
          orderId: item.utrOrReference || item.orderId || key,
          type: item.type || "KEY_PURCHASE",
          amount: Number(item.amount) || 0,
          status: (item.status || "SUCCESS").toUpperCase(),
          gateway: item.method || (item.type === "DEPOSIT" ? "UPI Payment" : "Wallet Balance"),
          utr: item.utrOrReference || "",
          paymentLink: "",
          qrUrl: "",
          createdAt: item.createdAt || (Date.now() - 30000),
          date: item.date || "Recent",
          isServer: !1,
          raw: item
        });
      }
    }
    const arr = Array.from(map.values());
    arr.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
    return arr;
  }, [stx, n]);

  // Financial statistics
  const stats = q.useMemo(() => {
    let dep = 0, spent = 0, totalOrders = mergedList.length;
    for (const tx of mergedList) {
      if (tx.type === "DEPOSIT" && (tx.status === "SUCCESS" || tx.status === "PAID")) {
        dep += tx.amount;
      } else if (tx.type === "KEY_PURCHASE") {
        spent += tx.amount;
      }
    }
    return { dep, spent, totalOrders };
  }, [mergedList]);

  // Filter & Search
  const filteredList = q.useMemo(() => {
    return mergedList.filter(item => {
      if (filter === "DEPOSIT" && item.type !== "DEPOSIT") return !1;
      if (filter === "KEY_PURCHASE" && item.type !== "KEY_PURCHASE") return !1;
      if (search.trim()) {
        const qStr = search.toLowerCase();
        const oId = String(item.orderId || "").toLowerCase();
        const utr = String(item.utr || "").toLowerCase();
        const gtw = String(item.gateway || "").toLowerCase();
        const amt = String(item.amount);
        return oId.includes(qStr) || utr.includes(qStr) || gtw.includes(qStr) || amt.includes(qStr);
      }
      return !0;
    });
  }, [mergedList, filter, search]);

  const handleInvoiceClick = (item) => {
    if (!e) return;
    const l = item.raw || item;
    const u = t.find(h => (l.utrOrReference && h.orderId && l.utrOrReference.includes(h.orderId)) || (l.description && h.keyCode && l.description.includes(h.keyCode)) || l.date === h.purchaseDate);
    const d = {
      invoiceNumber: (u == null ? void 0 : u.invoiceNumber) || ("INV-" + (l.id.replace(/\\D/g, "").slice(-6) || "883921")),
      orderId: l.utrOrReference || (u == null ? void 0 : u.orderId) || ("ORD-KEY-" + l.id.slice(-4)),
      date: l.date,
      buyerName: (s == null ? void 0 : s.name) || (s == null ? void 0 : s.username) || "Customer",
      buyerUsername: (s == null ? void 0 : s.username) || "customer",
      buyerEmail: (s == null ? void 0 : s.email) || "",
      productName: (u == null ? void 0 : u.productName) || "VIP Game License Key",
      category: "Digital License",
      game: u == null ? void 0 : u.game,
      deviceType: u == null ? void 0 : u.deviceType,
      planDuration: (u == null ? void 0 : u.planName) || "Key Delivery",
      quantity: 1,
      unitPrice: l.amount,
      totalAmount: l.amount,
      paymentMethod: l.method || "Wallet Balance",
      keys: u ? [u.keyCode] : ["(Stored in My Keys section)"],
      status: "DELIVERED",
      shopName: (a == null ? void 0 : a.shopName) || "KALAM MODS OFFICIAL",
      supportContact: (a == null ? void 0 : a.supportUsername) || "@Kalam_Mods_Official"
    };
    e(d);
  };

  return r.jsxs("div", {
    className: "space-y-4",
    id: "payment-transaction-history-view",
    children: [
      // Header with Title and Action buttons
      r.jsxs("div", {
        className: "flex items-center justify-between gap-2",
        children: [
          r.jsxs("div", {
            children: [
              r.jsxs("h2", {
                className: "text-base font-extrabold text-white flex items-center gap-2",
                children: [
                  r.jsx(ic, { className: "w-4 h-4 text-[#00e5ff]" }),
                  r.jsx("span", { children: "Payment & Transaction History" })
                ]
              }),
              r.jsx("span", {
                className: "text-[11px] text-gray-400 block mt-0.5",
                children: "UPI deposits, gateway orders, and digital key purchases"
              })
            ]
          }),
          r.jsxs("div", {
            className: "flex items-center gap-1.5 shrink-0",
            children: [
              r.jsx("button", {
                onClick: () => fetchHistory(!0),
                disabled: refreshing,
                className: "p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50",
                title: "Refresh Transactions",
                children: r.jsx("svg", {
                  className: "w-3.5 h-3.5 " + (refreshing ? "animate-spin text-[#00e5ff]" : "text-gray-300"),
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                  children: r.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2.5", d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" })
                })
              }),
              mDep && r.jsx("button", {
                onClick: mDep,
                className: "px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95",
                children: "+ Deposit"
              })
            ]
          })
        ]
      }),

      // Toast Feedback
      toast && r.jsx("div", {
        className: "p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 " + (
          toast.type === "success"
            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm"
            : toast.type === "error"
              ? "bg-rose-500/15 border border-rose-500/30 text-rose-300"
              : "bg-cyan-500/15 border border-cyan-500/30 text-cyan-300"
        ),
        children: [
          r.jsx("span", {
            className: "w-2 h-2 rounded-full " + (toast.type === "success" ? "bg-emerald-400" : (toast.type === "error" ? "bg-rose-400" : "bg-cyan-400"))
          }),
          r.jsx("span", { className: "flex-1", children: toast.text })
        ]
      }),

      // Quick Summary 3-Metric Cards
      r.jsxs("div", {
        className: "grid grid-cols-3 gap-2",
        children: [
          r.jsxs("div", {
            className: "p-2.5 rounded-xl bg-[#161622]/90 border border-emerald-500/20 shadow-sm",
            children: [
              r.jsx("span", { className: "text-[10px] text-gray-400 block font-medium", children: "Total Deposited" }),
              r.jsxs("span", { className: "text-xs font-extrabold font-mono text-emerald-400 block mt-0.5", children: ["₹", stats.dep.toFixed(2)] })
            ]
          }),
          r.jsxs("div", {
            className: "p-2.5 rounded-xl bg-[#161622]/90 border border-rose-500/20 shadow-sm",
            children: [
              r.jsx("span", { className: "text-[10px] text-gray-400 block font-medium", children: "Total Spent" }),
              r.jsxs("span", { className: "text-xs font-extrabold font-mono text-rose-400 block mt-0.5", children: ["₹", stats.spent.toFixed(2)] })
            ]
          }),
          r.jsxs("div", {
            className: "p-2.5 rounded-xl bg-[#161622]/90 border border-cyan-500/20 shadow-sm",
            children: [
              r.jsx("span", { className: "text-[10px] text-gray-400 block font-medium", children: "Transactions" }),
              r.jsx("span", { className: "text-xs font-extrabold font-mono text-cyan-300 block mt-0.5", children: stats.totalOrders })
            ]
          })
        ]
      }),

      // Filter Tabs and Search Bar
      r.jsxs("div", {
        className: "space-y-2",
        children: [
          r.jsxs("div", {
            className: "flex items-center gap-1.5 p-1 rounded-xl bg-[#12121c] border border-white/5",
            children: [
              r.jsxs("button", {
                onClick: () => setFilter("ALL"),
                className: "flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all cursor-pointer " + (
                  filter === "ALL" ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:text-white"
                ),
                children: ["All (", mergedList.length, ")"]
              }),
              r.jsxs("button", {
                onClick: () => setFilter("DEPOSIT"),
                className: "flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all cursor-pointer " + (
                  filter === "DEPOSIT" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-gray-400 hover:text-emerald-400"
                ),
                children: ["Deposits (", mergedList.filter(x => x.type === "DEPOSIT").length, ")"]
              }),
              r.jsxs("button", {
                onClick: () => setFilter("KEY_PURCHASE"),
                className: "flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all cursor-pointer " + (
                  filter === "KEY_PURCHASE" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:text-purple-400"
                ),
                children: ["Keys (", mergedList.filter(x => x.type === "KEY_PURCHASE").length, ")"]
              })
            ]
          }),
          r.jsxs("div", {
            className: "relative",
            children: [
              r.jsx("input", {
                type: "text",
                value: search,
                onChange: ev => setSearch(ev.target.value),
                placeholder: "Search by Order ID, UTR, gateway...",
                className: "w-full px-3 py-2 pl-8 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00e5ff]/50"
              }),
              r.jsx("svg", {
                className: "w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                children: r.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" })
              }),
              search && r.jsx("button", {
                onClick: () => setSearch(""),
                className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs cursor-pointer",
                children: "×"
              })
            ]
          })
        ]
      }),

      // Transaction List
      loading && mergedList.length === 0 ? r.jsxs(bn, {
        className: "p-8 text-center space-y-3 bg-[#161622]/90 border-white/10",
        children: [
          r.jsx("div", {
            className: "w-8 h-8 rounded-full border-2 border-[#00e5ff] border-t-transparent animate-spin mx-auto"
          }),
          r.jsx("p", { className: "text-xs text-gray-400", children: "Loading payment history..." })
        ]
      }) : filteredList.length === 0 ? r.jsxs(bn, {
        className: "p-8 text-center space-y-3 bg-[#161622]/90 border-white/10",
        children: [
          r.jsx("div", {
            className: "w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto",
            children: r.jsx(ic, { className: "w-6 h-6" })
          }),
          r.jsx("h3", { className: "text-sm font-bold text-white", children: search ? "No Matching Transactions" : "No Transactions Yet" }),
          r.jsx("p", {
            className: "text-xs text-gray-400 max-w-xs mx-auto",
            children: search ? "Try adjusting your search query or switching filters." : "Your UPI deposits, payment orders, and digital key purchases will be logged here."
          }),
          mDep && r.jsx("button", {
            onClick: mDep,
            className: "mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-lg cursor-pointer",
            children: "Make a Deposit"
          })
        ]
      }) : r.jsx("div", {
        className: "space-y-2.5",
        children: filteredList.map(item => {
          const isDep = item.type === "DEPOSIT";
          const isSuccess = item.status === "SUCCESS" || item.status === "PAID" || item.status === "DELIVERED";
          const isPending = item.status === "PENDING";
          const isChecking = checkingId === (item.orderId || item.id);

          return r.jsxs(bn, {
            glow: "none",
            className: "p-3.5 bg-[#161622]/95 border " + (
              isPending
                ? "border-amber-500/30 bg-gradient-to-r from-[#161622] to-[#1c1a16]"
                : isSuccess
                  ? (isDep ? "border-emerald-500/25" : "border-purple-500/25")
                  : "border-rose-500/25"
            ) + " space-y-2.5 rounded-2xl shadow-sm",
            children: [
              // Top Row: Icon + Type Title + Amount
              r.jsxs("div", {
                className: "flex items-start justify-between gap-2",
                children: [
                  r.jsxs("div", {
                    className: "flex items-center gap-2.5 min-w-0 flex-1",
                    children: [
                      r.jsx("div", {
                        className: "w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 " + (
                          isDep
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                        ),
                        children: isDep ? "+" : r.jsx(fi, { className: "w-4 h-4" })
                      }),
                      r.jsxs("div", {
                        className: "min-w-0 flex-1",
                        children: [
                          r.jsx("h4", {
                            className: "text-xs font-bold text-white truncate",
                            children: isDep ? (item.gateway || "UPI Payment") : "Digital Key Purchase"
                          }),
                          r.jsxs("div", {
                            className: "flex items-center gap-1 text-[10px] text-gray-400 font-mono mt-0.5",
                            children: [
                              r.jsxs("span", {
                                className: "text-gray-300 select-all cursor-pointer hover:text-[#00e5ff]",
                                onClick: () => copyText(item.orderId || item.id, item.id),
                                children: [item.orderId || item.id]
                              }),
                              r.jsx("button", {
                                onClick: () => copyText(item.orderId || item.id, item.id),
                                className: "p-0.5 text-gray-400 hover:text-white cursor-pointer",
                                title: "Copy Order ID",
                                children: copiedId === item.id ? r.jsx(Sn, { className: "w-3 h-3 text-emerald-400" }) : r.jsx(zr, { className: "w-3 h-3" })
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  }),
                  r.jsxs("div", {
                    className: "text-right shrink-0",
                    children: [
                      r.jsxs("span", {
                        className: "text-sm font-extrabold font-mono block " + (
                          isDep ? "text-emerald-400" : "text-gray-200"
                        ),
                        children: [isDep ? "+" : "-", Zs(item.amount)]
                      }),
                      r.jsxs("span", {
                        className: "inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5 " + (
                          isSuccess
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : isPending
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        ),
                        children: [
                          r.jsx("span", {
                            className: "w-1 h-1 rounded-full " + (
                              isSuccess ? "bg-emerald-400" : (isPending ? "bg-amber-400 animate-ping" : "bg-rose-400")
                            )
                          }),
                          item.status
                        ]
                      })
                    ]
                  })
                ]
              }),

              // Details metadata row
              r.jsxs("div", {
                className: "flex items-center justify-between text-[10px] text-gray-400 pt-1.5 border-t border-white/5 flex-wrap gap-1",
                children: [
                  r.jsxs("span", {
                    className: "flex items-center gap-1",
                    children: [
                      r.jsx("svg", {
                        className: "w-3 h-3 text-gray-500",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: r.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" })
                      }),
                      item.date
                    ]
                  }),
                  item.utr && r.jsxs("span", {
                    className: "font-mono text-cyan-300/90 flex items-center gap-1",
                    children: [
                      "UTR: ",
                      item.utr,
                      r.jsx("button", {
                        onClick: () => copyText(item.utr, "utr-" + item.id),
                        className: "text-gray-400 hover:text-white cursor-pointer",
                        children: copiedId === ("utr-" + item.id) ? r.jsx(Sn, { className: "w-2.5 h-2.5 text-emerald-400" }) : r.jsx(zr, { className: "w-2.5 h-2.5" })
                      })
                    ]
                  })
                ]
              }),

              // Action Buttons Row (Check Live Status / Invoice / Pay)
              (isPending || !isDep) && r.jsxs("div", {
                className: "flex items-center justify-end gap-2 pt-1 border-t border-white/5",
                children: [
                  isPending && r.jsxs("button", {
                    onClick: () => checkLiveStatus(item),
                    disabled: isChecking,
                    className: "px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50",
                    children: [
                      r.jsx("svg", {
                        className: "w-3 h-3 " + (isChecking ? "animate-spin text-amber-400" : "text-amber-400"),
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: r.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2.5", d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" })
                      }),
                      r.jsx("span", { children: isChecking ? "Checking..." : "Check Status" })
                    ]
                  }),
                  isPending && item.paymentLink && r.jsxs("a", {
                    href: item.paymentLink,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95",
                    children: [
                      r.jsx("svg", {
                        className: "w-3 h-3",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: r.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" })
                      }),
                      r.jsx("span", { children: "Pay / QR" })
                    ]
                  }),
                  !isDep && e && r.jsxs("button", {
                    onClick: () => handleInvoiceClick(item),
                    className: "px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95",
                    children: [
                      r.jsx(Yc, { className: "w-3 h-3" }),
                      r.jsx("span", { children: "Invoice" })
                    ]
                  })
                ]
              })
            ]
          }, item.id || item.orderId);
        })
      })
    ]
  });
}`;

  // 3. Replace Cte
  code = code.substring(0, startCte) + upgradedCte + code.substring(endCte);
  console.log('Replaced Cte with upgraded Payment Transaction History component.');

  // 4. Update invocation of Cte to pass onOpenDeposit and onOpenBuyKeys
  const oldCall = 'a==="history"&&r.jsx(Cte,{transactions:W,onViewInvoice:me=>wn(me),userKeys:Ce,currentUser:w,storeSettings:te})';
  const newCall = 'a==="history"&&r.jsx(Cte,{transactions:W,onViewInvoice:me=>wn(me),userKeys:Ce,currentUser:w,storeSettings:te,onOpenDeposit:()=>Vt(()=>dt(!0),"Deposit Wallet"),onOpenBuyKeys:()=>Vt(()=>Ut(!0),"Key Store")})';
  if (code.includes(oldCall)) {
    code = code.replace(oldCall, newCall);
    console.log('Updated Cte invocation props.');
  }

  // 5. Update Quick Actions label to PAYMENT HISTORY
  const oldHistoryBtn = '{id:"HISTORY",label:"HISTORY"';
  const newHistoryBtn = '{id:"HISTORY",label:"PAYMENT HISTORY"';
  if (code.includes(oldHistoryBtn)) {
    code = code.replace(oldHistoryBtn, newHistoryBtn);
    console.log('Updated dashboard quick action to PAYMENT HISTORY.');
  }

  // 6. Update uQ menu label
  const oldUqHistory = '{id:"history",label:"History",icon:ic}';
  const newUqHistory = '{id:"history",label:"Payment History",icon:ic}';
  if (code.includes(oldUqHistory)) {
    code = code.replace(oldUqHistory, newUqHistory);
    console.log('Updated uQ sidebar item to Payment History.');
  }

  // 7. Validate syntax with esbuild
  try {
    esbuild.transformSync(code, { loader: 'js' });
    console.log('Syntax check passed for:', filePath);
    fs.writeFileSync(filePath, code, 'utf8');
    return true;
  } catch (err) {
    console.error('Syntax error during patch of', filePath, ':', err);
    return false;
  }
}

const f1 = path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js');
const f2 = path.join(__dirname, '..', 'dist', 'assets', 'index-BvHT743v.js');

const ok1 = patchBundle(f1);
const ok2 = patchBundle(f2);

if (ok1 && ok2) {
  console.log('PAYMENT TRANSACTION HISTORY SUCCESSFULLY ADDED!');
} else {
  console.error('FAILED TO ADD PAYMENT TRANSACTION HISTORY');
  process.exit(1);
}
