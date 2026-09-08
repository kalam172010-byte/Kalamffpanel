const fs = require('fs');
const path = require('path');

function patchUrlRouting(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('[Router] Target file does not exist:', filePath);
    return false;
  }

  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Target 1: The initial state declarations and popstate listener in function Nne()
  const oldTarget1 = `function Nne(){var ua,Ra,Ya;const[n,e]=q.useState(()=>{try{if(typeof window<"u"&&(window.location.search.includes("admin")||window.location.hash.includes("admin")||localStorage.getItem("kalam_app_mode")==="admin"))return"admin"}catch{}return"user"}),[t,s]=q.useState(()=>{try{if(typeof window<"u"){const me=new URLSearchParams(window.location.search),Ee=me.get("product")||me.get("prod");if(Ee)return Ee;const ke=window.location.hash.match(/#prod(?:uct)?-([a-zA-Z0-9_-]+)/);if(ke)return ke[1]}}catch{}return null}),[a,i]=q.useState(()=>{try{if(typeof window<"u"){const me=new URLSearchParams(window.location.search);if(me.get("product")||me.get("prod")||window.location.hash.includes("prod"))return"buy_keys"}}catch{}return"dashboard"}),[l,u]=q.useState("dashboard"),[d,h]=q.useState(!1),[p,g]=q.useState(!1);q.useEffect(()=>{const me=()=>{try{const Ee=new URLSearchParams(window.location.search),ke=Ee.get("product")||Ee.get("prod"),Ke=window.location.hash.match(/#prod(?:uct)?-([a-zA-Z0-9_-]+)/),Je=ke||(Ke?Ke[1]:null);Je&&(s(Je),i("buy_keys"),e("user"))}catch{}};return window.addEventListener("popstate",me),window.addEventListener("hashchange",me),()=>{window.removeEventListener("popstate",me),window.removeEventListener("hashchange",me)}},[]);const[b,x]=q.useState(!0),[w,S]=q.useState(()=>{try{const me=localStorage.getItem("kalam_auth_user");if(me)return JSON.parse(me)}catch{}return null}),[j,_]=q.useState(!1),[P,H]=q.useState("LOGIN")`;

  const newTarget1 = `function Nne(){var ua,Ra,Ya;const[n,e]=q.useState(()=>{try{if(typeof window<"u"){const p=window.location.pathname.toLowerCase();if(p.startsWith("/admin")||window.location.search.includes("admin")||window.location.hash.includes("admin")||localStorage.getItem("kalam_app_mode")==="admin")return"admin"}}catch{}return"user"}),[t,s]=q.useState(()=>{try{if(typeof window<"u"){const me=new URLSearchParams(window.location.search),Ee=me.get("product")||me.get("prod");if(Ee)return Ee;const m=window.location.pathname.match(/\\/buy-key[s]?\\/([a-zA-Z0-9_-]+)/i);if(m&&m[1])return m[1];const ke=window.location.hash.match(/#prod(?:uct)?-([a-zA-Z0-9_-]+)/);if(ke)return ke[1]}}catch{}return null}),[a,i]=q.useState(()=>{try{if(typeof window<"u"){const p=window.location.pathname.toLowerCase(),me=new URLSearchParams(window.location.search);if(p.startsWith("/buy-key")||p.startsWith("/buy_key")||p.startsWith("/buy-keys")||p==="/store"||p==="/products"||me.get("product")||me.get("prod")||window.location.hash.includes("prod"))return"buy_keys";if(p==="/deposit"||p==="/add-money")return"deposit";if(p==="/my-keys"||p==="/keys")return"my_keys";if(p==="/history"||p==="/orders"||p==="/transactions")return"history";if(p==="/referral"||p==="/referrals")return"referral";if(p==="/tickets"||p==="/support")return"tickets";if(p==="/profile"||p==="/account")return"profile";if(p==="/dashboard"||p==="/home")return"dashboard"}}catch{}return"dashboard"}),[l,u]=q.useState(()=>{try{if(typeof window<"u"){const p=window.location.pathname.toLowerCase();if(p.startsWith("/admin")){if(p.includes("user"))return"user_management";if(p.includes("prod"))return"products";if(p.includes("id-stock")||p.includes("id_stock"))return"id_stock";if(p.includes("key"))return"key_management";if(p.includes("gateway")||p.includes("payment"))return"payment_gateways";if(p.includes("setting")||p.includes("bot"))return"bot_settings";if(p.includes("api"))return"api_management";return"dashboard"}}}catch{}return"dashboard"}),[d,h]=q.useState(!1),[p,g]=q.useState(!1);q.useEffect(()=>{if(typeof window<"u"){const onPop=()=>{try{window._kalam_is_pop=!0;const p=window.location.pathname.toLowerCase(),me=new URLSearchParams(window.location.search),prod=me.get("product")||me.get("prod"),hashM=window.location.hash.match(/#prod(?:uct)?-([a-zA-Z0-9_-]+)/),selProd=prod||(hashM?hashM[1]:null);if(p==="/login"||p==="/auth"){const u=localStorage.getItem("kalam_auth_user");if(!u){x(!1);_(!1)}else{H("LOGIN");_(!0)}}else if(p==="/register"||p==="/signup"){H("REGISTER");_(!0)}else if(p.startsWith("/admin")){e("admin");_(!1);dt(!1);if(p.includes("user"))u("user_management");else if(p.includes("prod"))u("products");else if(p.includes("id-stock")||p.includes("id_stock"))u("id_stock");else if(p.includes("key"))u("key_management");else if(p.includes("gateway")||p.includes("payment"))u("payment_gateways");else if(p.includes("setting")||p.includes("bot"))u("bot_settings");else if(p.includes("api"))u("api_management");else u("dashboard")}else{e("user");_(!1);if(p==="/deposit"||p==="/add-money"){i("deposit");dt(!0)}else{dt(!1);if(p.startsWith("/buy-key")||p.startsWith("/buy_key")||p.startsWith("/buy-keys")||p==="/store"||p==="/products"||selProd){i("buy_keys");if(selProd)s(selProd)}else if(p==="/my-keys"||p==="/keys"){i("my_keys")}else if(p==="/history"||p==="/orders"||p==="/transactions"){i("history")}else if(p==="/referral"||p==="/referrals"){i("referral")}else if(p==="/tickets"||p==="/support"){i("tickets")}else if(p==="/profile"||p==="/account"){i("profile")}else{i("dashboard")}}}}catch(_err){console.warn("[PopState] error:",_err)}};window.addEventListener("popstate",onPop);window.addEventListener("hashchange",onPop);return()=>{window.removeEventListener("popstate",onPop);window.removeEventListener("hashchange",onPop)}}},[]);const[b,x]=q.useState(()=>{try{if(typeof window<"u"){const p=window.location.pathname.toLowerCase();if(p==="/login"||p==="/auth"){const u=localStorage.getItem("kalam_auth_user");if(!u)return !1}}}catch{}return !0}),[w,S]=q.useState(()=>{try{const me=localStorage.getItem("kalam_auth_user");if(me)return JSON.parse(me)}catch{}return null}),[j,_]=q.useState(()=>{try{if(typeof window<"u"){const p=window.location.pathname.toLowerCase();if(p==="/register"||p==="/signup")return !0;if((p==="/login"||p==="/auth")&&localStorage.getItem("kalam_auth_user"))return !0}}catch{}return !1}),[P,H]=q.useState(()=>{try{if(typeof window<"u"){const p=window.location.pathname.toLowerCase();if(p==="/register"||p==="/signup")return"REGISTER"}}catch{}return"LOGIN"})`;

  if (code.includes(oldTarget1)) {
    code = code.replace(oldTarget1, newTarget1);
    changed = true;
    console.log('[Router 1] Injected route-aware state initialization & popstate listener');
  }

  // Target 2: Deposit modal auto-open from /deposit route
  const oldTarget2 = `const[ze,nt]=q.useState(!1),[ie,dt]=q.useState(!1),[Pt,Ut]=q.useState(!1)`;
  const newTarget2 = `const[ze,nt]=q.useState(!1),[ie,dt]=q.useState(()=>{try{if(typeof window<"u"&&(window.location.pathname.toLowerCase()==="/deposit"||window.location.pathname.toLowerCase()==="/add-money"))return !0}catch{}return !1}),[Pt,Ut]=q.useState(!1)`;

  if (code.includes(oldTarget2)) {
    code = code.replace(oldTarget2, newTarget2);
    changed = true;
    console.log('[Router 2] Injected deposit modal auto-open for /deposit path');
  }

  // Target 3: URL Synchronization effect (pushes /dashboard, /buy-key, /login, /admin, /deposit, etc.)
  const oldTarget3 = `[nn,qt]=q.useState(null),ln=((te==null?void 0:te.adminEmail)||"kalam172010@gmail.com").trim().toLowerCase()`;
  const newTarget3 = `[nn,qt]=q.useState(null);q.useEffect(()=>{if(typeof window<"u"){if(window._kalam_is_pop){window._kalam_is_pop=!1;return}try{let target="/dashboard",pageTitle="KALAM FF PANEL - Dashboard";if(j){target=P==="REGISTER"?"/register":"/login";pageTitle=P==="REGISTER"?"KALAM FF PANEL - Register":"KALAM FF PANEL - Login"}else if(!w&&!b){target="/login";pageTitle="KALAM FF PANEL - Login"}else if(n==="admin"){if(l==="user_management"){target="/admin/users";pageTitle="KALAM FF PANEL - Admin Users"}else if(l==="products"){target="/admin/products";pageTitle="KALAM FF PANEL - Admin Products"}else if(l==="id_stock"){target="/admin/id-stock";pageTitle="KALAM FF PANEL - Admin ID Stock"}else if(l==="key_management"){target="/admin/keys";pageTitle="KALAM FF PANEL - Admin Key Management"}else if(l==="payment_gateways"){target="/admin/gateways";pageTitle="KALAM FF PANEL - Admin Gateways"}else if(l==="bot_settings"){target="/admin/settings";pageTitle="KALAM FF PANEL - Admin Settings"}else if(l==="api_management"){target="/admin/api";pageTitle="KALAM FF PANEL - Admin API"}else{target="/admin";pageTitle="KALAM FF PANEL - Admin Dashboard"}}else{if(ie||a==="deposit"){target="/deposit";pageTitle="KALAM FF PANEL - Deposit Wallet"}else if(a==="buy_keys"){target=t?("/buy-key?product="+encodeURIComponent(t)):"/buy-key";pageTitle="KALAM FF PANEL - Buy Key"}else if(a==="my_keys"){target="/my-keys";pageTitle="KALAM FF PANEL - My Keys"}else if(a==="history"){target="/history";pageTitle="KALAM FF PANEL - Orders & History"}else if(a==="referral"){target="/referral";pageTitle="KALAM FF PANEL - Referral Program"}else if(a==="tickets"){target="/tickets";pageTitle="KALAM FF PANEL - Support Tickets"}else if(a==="profile"){target="/profile";pageTitle="KALAM FF PANEL - My Profile"}else{target="/dashboard";pageTitle="KALAM FF PANEL - Dashboard"}}const cur=window.location.pathname+(window.location.search||"");if(cur!==target){if(window.location.pathname==="/"||window.location.pathname==="/index.html"){window.history.replaceState({kalamRoute:!0,path:target},"",target)}else{window.history.pushState({kalamRoute:!0,path:target},"",target)}}if(pageTitle)document.title=pageTitle;try{window.dispatchEvent(new CustomEvent("kalam_route_changed",{detail:{path:target,title:pageTitle}}))}catch{}}catch(_err){console.warn("[RouterSync] error:",_err)}}},[n,a,l,j,P,ie,t,b,!!w]);const ln=((te==null?void 0:te.adminEmail)||"kalam172010@gmail.com").trim().toLowerCase()`;

  if (code.includes(oldTarget3)) {
    code = code.replace(oldTarget3, newTarget3);
    changed = true;
    console.log('[Router 3] Injected two-way URL history sync effect');
  }

  // Target 4: Unblock guest viewing for buy_keys in It()
  const oldTarget4 = `It=me=>{if(me!=="dashboard"&&!w){Vt(()=>It(me),me.replace("_"," ").toUpperCase());return}`;
  const newTarget4 = `It=me=>{if(me!=="dashboard"&&me!=="buy_keys"&&!w){Vt(()=>It(me),me.replace("_"," ").toUpperCase());return}`;
  if (code.includes(oldTarget4)) {
    code = code.replace(oldTarget4, newTarget4);
    changed = true;
    console.log('[Router 4] Allowed guests to navigate to /buy-key catalog without login block');
  }

  // Target 5: Unblock onOpenBuyKeys in top header
  const oldTarget5 = `onOpenBuyKeys:()=>Vt(()=>It("buy_keys"),"Key Store")`;
  const newTarget5 = `onOpenBuyKeys:()=>It("buy_keys")`;
  if (code.includes(oldTarget5)) {
    code = code.replace(oldTarget5, newTarget5);
    changed = true;
    console.log('[Router 5] Enabled direct Key Store navigation in top header');
  }

  // Target 6: Unblock BUY_KEYS in dashboard quick action Mn()
  const oldTarget6 = `Mn=me=>{if(!w){Se("Please sign in first to use this option!"),Ot("LOGIN");return}`;
  const newTarget6 = `Mn=me=>{if(me==="BUY_KEYS"){It("buy_keys");return}if(!w){Se("Please sign in first to use this option!"),Ot("LOGIN");return}`;
  if (code.includes(oldTarget6)) {
    code = code.replace(oldTarget6, newTarget6);
    changed = true;
    console.log('[Router 6] Enabled direct Key Store navigation from dashboard quick action');
  }

  if (changed) {
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`[Router] Successfully patched URL routing into ${filePath}`);
    return true;
  } else {
    console.log(`[Router] No changes applied to ${filePath} (already patched or patterns not found)`);
    return false;
  }
}

// Apply to public and dist
const publicBundle = path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js');
const distBundle = path.join(__dirname, '..', 'dist', 'assets', 'index-BvHT743v.js');

patchUrlRouting(publicBundle);
patchUrlRouting(distBundle);
