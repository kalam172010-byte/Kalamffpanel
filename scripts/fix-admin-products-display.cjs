const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('[Fix Admin Products Display] Running admin panel products display fix...');

const cleanWteJsx = `Wte = ({
  product: n,
  isSelected: e = !1,
  onToggleSelect: t,
  onEdit: s,
  onToggleStatus: a,
  onToggleMaintenance: i,
  onDelete: l
}) => {
  if (!n || !n.id) return null;
  const [u, d] = q.useState(false);
  const [h, p] = q.useState(false);
  const g = n.status === "ACTIVE";
  const b = n.status === "MAINTENANCE";
  const x = n.imageUrl || null;
  const hasVideo = !!(n.videoUrl && String(n.videoUrl).trim().length > 0);

  const j = (P) => {
    if (P && P.stopPropagation) P.stopPropagation();
    if (!u) {
      d(true);
      return;
    }
    d(false);
    if (typeof l === "function") l(n.id);
  };

  const _ = (P) => {
    if (P && P.stopPropagation) P.stopPropagation();
    d(false);
  };

  const keyCount = Array.isArray(n.keys) ? n.keys.length : (typeof n.stock === "number" ? n.stock : 0);

  return (
    <div id={"product-card-" + n.id} className={"p-4 rounded-2xl transition-all space-y-3.5 " + (e ? "bg-[#1b1535] border-2 border-[#a855f7] shadow-[0_0_30px_rgba(168,85,247,0.35)]" : b ? "bg-[#1f1a14] border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)]" : "bg-[#141026] border border-purple-500/25 shadow-[0_4px_25px_rgba(0,0,0,0.5)]")}>
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
              <span className="text-[9px] font-bold bg-pink-600/90 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                <$m className="w-2.5 h-2.5" />Photo
              </span>
              {hasVideo && (
                <span className="text-[9px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                  <io className="w-2.5 h-2.5 fill-white" />Video
                </span>
              )}
            </div>
            <span className="text-[10px] text-white/90 font-bold bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Wc className="w-3 h-3" />View Media
            </span>
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
            <span className="text-xs font-bold text-white font-mono">{keyCount} key(s)</span>
            {g && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE
              </span>
            )}
            {n.status === "DISABLED" && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                DISABLED
              </span>
            )}
            {b && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-yellow-300 bg-yellow-950/60 px-2 py-0.5 rounded border border-yellow-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" />
                MAINTENANCE
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-white/5 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Ge.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => s && s(n)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#231e3d] hover:bg-[#2c264d] border border-purple-500/30 text-gray-200 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Q7 className="w-3.5 h-3.5 text-gray-300" />
            <span>Edit</span>
          </Ge.button>
          <Ge.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => a && a(n)}
            className={"flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm " + (n.status === "ACTIVE" ? "bg-amber-950/50 hover:bg-amber-950/70 border-amber-600/50 text-amber-300" : "bg-emerald-950/50 hover:bg-emerald-950/70 border-emerald-600/50 text-emerald-300")}
          >
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
            <Ge.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={_}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-gray-200 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <hs className="w-3.5 h-3.5 text-gray-300" />
              <span>Cancel</span>
            </Ge.button>
            <Ge.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={j}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-950/80 border border-rose-600/50 text-rose-300 hover:text-rose-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <Fo className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete</span>
            </Ge.button>
          </div>
        ) : (
          <Ge.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={j}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Fo className="w-3.5 h-3.5 text-rose-400" />
            <span>Delete</span>
          </Ge.button>
        )}
      </div>

      {h && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <Ge.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-[#141026] border border-purple-500/40 rounded-3xl p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Wc className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{n.name}</h3>
                  <span className="text-[10px] text-gray-400">Photo & Video Media</span>
                </div>
              </div>
              <button type="button" onClick={() => p(false)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer">
                <hs className="w-4 h-4" />
              </button>
            </div>
            {n.imageUrl && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-pink-400 flex items-center gap-1.5">
                  <$m className="w-3.5 h-3.5" />
                  <span>Product Photo</span>
                </span>
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg">
                  <img src={n.imageUrl} alt={n.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
            )}
            {n.videoUrl && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-red-400 flex items-center gap-1.5">
                  <io className="w-3.5 h-3.5 fill-red-400" />
                  <span>Product Video Link</span>
                </span>
                <a href={n.videoUrl} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 hover:underline break-all">
                  {n.videoUrl}
                </a>
              </div>
            )}
            <button type="button" onClick={() => p(false)} className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer shadow-lg">
              Close Preview
            </button>
          </Ge.div>
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

function patchBundle(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('[Fix Admin Products Display] File not found:', filePath);
    return;
  }

  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Replace Wte with clean, robust version
  const wteMatch = code.match(/Wte\s*=\s*\(\{/);
  if (wteMatch) {
    const wteIdx = wteMatch.index;
    const yteIdx = code.indexOf("Yte=", wteIdx);
    if (wteIdx !== -1 && yteIdx !== -1) {
      code = code.substring(0, wteIdx) + compiledWte + "," + code.substring(yteIdx);
      console.log('[Fix Admin Products Display] Successfully replaced Wte component in', filePath);
    }
  }

  // 2. Fix quoted icon components in JSX if any
  code = code.replace(/r\.jsx\("vD",\s*\{/g, 'r.jsx(vD,{');
  code = code.replace(/r\.jsx\("io",\s*\{/g, 'r.jsx(io,{');
  code = code.replace(/r\.jsx\("hs",\s*\{/g, 'r.jsx(hs,{');
  code = code.replace(/r\.jsx\("nc",\s*\{/g, 'r.jsx(nc,{');
  code = code.replace(/r\.jsx\("fi",\s*\{/g, 'r.jsx(fi,{');
  code = code.replace(/r\.jsx\("iu",\s*\{/g, 'r.jsx(iu,{');
  code = code.replace(/r\.jsx\("qi",\s*\{/g, 'r.jsx(qi,{');
  code = code.replace(/r\.jsx\("zr",\s*\{/g, 'r.jsx(zr,{');

  // 3. Ensure nne is passed onRefreshProducts and isRefreshing in App
  const oldNneCall = 'l==="products"&&r.jsx(nne,{products:A,onOpenAddProduct:()=>{jt(null),yt(!0)},onEditProduct:He,onToggleStatus:Wt,onToggleMaintenance:qn,onDeleteProduct:Ss,onDeleteAllProducts:ts,onBulkToggleStatus:Yt})';
  const newNneCall = 'l==="products"&&r.jsx(nne,{products:A,onOpenAddProduct:()=>{jt(null),yt(!0)},onEditProduct:He,onToggleStatus:Wt,onToggleMaintenance:qn,onDeleteProduct:Ss,onDeleteAllProducts:ts,onBulkToggleStatus:Yt,onRefreshProducts:Dt,isRefreshing:h})';
  if (code.includes(oldNneCall)) {
    code = code.replace(oldNneCall, newNneCall);
    console.log('[Fix Admin Products Display] Patched nne invocation in', filePath);
  }

  // 4. In nne: ensure safe product filtering
  code = code.replace(
    /w\s*=\s*n\.filter\(/g,
    'w=(Array.isArray(n)?n.filter(Boolean):[]).filter('
  );

  // 5. In nne: auto-fetch on mount when products empty
  const nneStart = 'nne=({products:n,onOpenAddProduct:e,onEditProduct:t,onToggleStatus:s,onToggleMaintenance:a,onDeleteProduct:i,onDeleteAllProducts:l,onBulkToggleStatus:u,onRefreshProducts:d,isRefreshing:h=!1})=>{';
  const nneStartWithFetch = 'nne=({products:n,onOpenAddProduct:e,onEditProduct:t,onToggleStatus:s,onToggleMaintenance:a,onDeleteProduct:i,onDeleteAllProducts:l,onBulkToggleStatus:u,onRefreshProducts:d,isRefreshing:h=!1})=>{q.useEffect(()=>{if(!n||n.length===0){fetch("/api/products").then(res=>res.json()).then(data=>{if(data&&data.success&&Array.isArray(data.products)&&data.products.length>0&&typeof d==="function")d();}).catch(()=>{});}},[]);';
  
  if (code.includes(nneStart) && !code.includes(nneStartWithFetch)) {
    code = code.replace(nneStart, nneStartWithFetch);
    console.log('[Fix Admin Products Display] Injected auto-fetch in nne in', filePath);
  }

  // 6. Ensure App boot actively fetches /api/products
  const appBootHook = 'q.useEffect(()=>{const me=Vte(Ee=>{';
  const enhancedAppBootHook = 'q.useEffect(()=>{fetch("/api/products").then(r=>r.json()).then(d=>{if(d&&d.success&&Array.isArray(d.products)&&d.products.length>0){L(d.products);try{localStorage.setItem("kalam_products_db",JSON.stringify(d.products))}catch(e){}}}).catch(()=>{});const me=Vte(Ee=>{';
  
  if (code.includes(appBootHook) && !code.includes('fetch("/api/products").then(r=>r.json())')) {
    code = code.replace(appBootHook, enhancedAppBootHook);
    console.log('[Fix Admin Products Display] Injected App boot product fetch in', filePath);
  }

  // 7. Ensure default initial fallback `qu` has the 3 default products from products_db.json
  try {
    const productsDb = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/products_db.json'), 'utf8'));
    if (Array.isArray(productsDb) && productsDb.length > 0) {
      const quEmptyStr = 'qu=[]';
      const quFullStr = 'qu=' + JSON.stringify(productsDb);
      if (code.includes(quEmptyStr)) {
        code = code.replace(quEmptyStr, quFullStr);
        console.log('[Fix Admin Products Display] Injected seed products into default qu array in', filePath);
      }
    }
  } catch (err) {
    console.warn('[Fix Admin Products Display] Warning loading products_db.json:', err.message);
  }

  try {
    esbuild.transformSync(code, { loader: 'js' });
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('[Fix Admin Products Display] Successfully validated and saved:', filePath);
  } catch (err) {
    console.error('[Fix Admin Products Display] Error validating JavaScript in', filePath, err.message);
  }
}

const publicBundle = path.join(__dirname, '../public/assets/index-BvHT743v.js');
const distBundle = path.join(__dirname, '../dist/assets/index-BvHT743v.js');

patchBundle(publicBundle);
patchBundle(distBundle);

console.log('[Fix Admin Products Display] Complete!');
