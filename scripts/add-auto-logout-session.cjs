const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

// 6 Hours Session Duration in milliseconds
const MAX_SESSION_MS = 6 * 60 * 60 * 1000; // 21,600,000 ms

function patchBundle(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('[Auto-Logout] Target file does not exist:', filePath);
    return false;
  }
  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Target 1: w state initialization with 6-hour expiration check
  const oldT1 = `,[w,S]=q.useState(()=>{try{const me=localStorage.getItem("kalam_auth_user");if(me)return JSON.parse(me)}catch{}return null})`;
  const newT1 = `,[w,S]=q.useState(()=>{try{const me=localStorage.getItem("kalam_auth_user");if(me){const _lt=Number(localStorage.getItem("kalam_session_login_time"));if(_lt&&(Date.now()-_lt>=21600000)){localStorage.removeItem("kalam_auth_user"),localStorage.removeItem("kalam_session_login_time"),localStorage.removeItem("kalam_wallet_balance"),sessionStorage.setItem("kalam_session_expired_toast","1");return null}if(!_lt)localStorage.setItem("kalam_session_login_time",Date.now().toString());return JSON.parse(me)}}catch{}return null})`;

  if (code.includes(oldT1)) {
    code = code.replace(oldT1, newT1);
    changed = true;
    console.log(`[Auto-Logout] Patched Target 1 (state init with 6h expiry) in ${filePath}`);
  }

  // Target 2: Tt (sign out) function to clean session timestamps
  const oldT2 = `localStorage.removeItem("kalam_auth_user"),localStorage.removeItem("kalam_wallet_balance"),M(s=>({...s,balance:0})),S(null),x(!1),e("user"),i("dashboard"),Se("Signed out of Firebase session.")}`;
  const newT2 = `localStorage.removeItem("kalam_auth_user"),localStorage.removeItem("kalam_session_login_time"),localStorage.removeItem("kalam_session_last_active"),localStorage.removeItem("kalam_wallet_balance"),M(s=>({...s,balance:0})),S(null),x(!1),e("user"),i("dashboard"),Se("Signed out of session.")}`;

  if (code.includes(oldT2)) {
    code = code.replace(oldT2, newT2);
    changed = true;
    console.log(`[Auto-Logout] Patched Target 2 (Tt signout clean session) in ${filePath}`);
  }

  // Target 3: Firebase onAuthStateChanged listener to respect 6-hour session
  const oldT3 = `q.useEffect(()=>{const me=yG(so,async Ee=>{var ke;if(Ee){const Ke=(Ee.email||"").trim().toLowerCase(),Je=Ke==="kalam172010@gmail.com"`;
  const newT3 = `q.useEffect(()=>{const me=yG(so,async Ee=>{var ke;if(Ee){const _lt=Number(localStorage.getItem("kalam_session_login_time"));if(_lt&&(Date.now()-_lt>=21600000)){try{await bG(so)}catch{}localStorage.removeItem("kalam_auth_user"),localStorage.removeItem("kalam_session_login_time"),localStorage.removeItem("kalam_wallet_balance"),S(null),M(s=>({...s,balance:0}));return}if(!_lt)localStorage.setItem("kalam_session_login_time",Date.now().toString());const Ke=(Ee.email||"").trim().toLowerCase(),Je=Ke==="kalam172010@gmail.com"`;

  if (code.includes(oldT3)) {
    code = code.replace(oldT3, newT3);
    changed = true;
    console.log(`[Auto-Logout] Patched Target 3 (Firebase onAuthStateChanged 6h check) in ${filePath}`);
  }

  // Target 4: Periodic session check effect inside Nne (checks every 15s, auto-logs out when 6 hours reached)
  const oldT4 = `Ot("LOGIN");return}me()},Mn=me=>{if(me==="BUY_KEYS")`;
  const newT4 = `Ot("LOGIN");return}me()};q.useEffect(()=>{const _chk=()=>{try{const _u=localStorage.getItem("kalam_auth_user"),_lt=Number(localStorage.getItem("kalam_session_login_time"));if(_u&&_lt&&(Date.now()-_lt>=21600000)){Tt(),Se("🔒 Session Expired (6 Hours Limit): You have been automatically logged out for account security. Please login again.")}}catch{}};const _ti=setInterval(_chk,15000);try{if(sessionStorage.getItem("kalam_session_expired_toast")){sessionStorage.removeItem("kalam_session_expired_toast"),setTimeout(()=>Se("🔒 Session Expired (6 Hours Limit): You have been automatically logged out for account security. Please login again."),800)}}catch{}return()=>clearInterval(_ti)},[w]);const Mn=me=>{if(me==="BUY_KEYS")`;

  if (code.includes(oldT4)) {
    code = code.replace(oldT4, newT4);
    changed = true;
    console.log(`[Auto-Logout] Patched Target 4 (Periodic 15s session check effect) in ${filePath}`);
  }

  // Target 5: Profile view security card displaying 6-hour auto-logout status
  const oldT5 = `r.jsxs("div",{className:"pt-2 border-t border-white/5 space-y-2",children:[r.jsxs("div",{className:"flex items-center justify-between text-xs",children:[r.jsxs("div",{className:"flex items-center gap-1.5 text-gray-300",children:[r.jsx(Qc,{className:"w-3.5 h-3.5 text-[#00e5ff]"}),r.jsx("span",{className:"font-semibold text-[11px]",children:"Email & Password Security"})]}),r.jsx("button",{onClick:()=>u(!l),className:"text-[11px] text-[#00e5ff] hover:underline font-medium cursor-pointer",children:l?"Cancel":"Change Password"})]})`;
  const newT5 = `r.jsxs("div",{className:"pt-2 border-t border-white/5 space-y-2",children:[s&&r.jsxs("div",{className:"p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-cyan-500/10 border border-amber-500/30 space-y-1.5",children:[r.jsxs("div",{className:"flex items-center justify-between",children:[r.jsxs("div",{className:"flex items-center gap-1.5",children:[r.jsx(Wp,{className:"w-3.5 h-3.5 text-amber-400"}),r.jsx("span",{className:"text-xs font-bold text-amber-300",children:"Session Auto-Logout Security"})]}),r.jsx("span",{className:"px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold",children:"Active (6h Limit)"})]}),r.jsxs("div",{className:"flex items-center justify-between text-[11px] text-gray-300",children:[r.jsx("span",{children:"Auto-logout active for account protection. Login sessions expire after 6 hours."}),r.jsx("span",{className:"text-amber-300 font-mono font-bold shrink-0 ml-2",children:"Max 6h"})]})]}),r.jsxs("div",{className:"flex items-center justify-between text-xs",children:[r.jsxs("div",{className:"flex items-center gap-1.5 text-gray-300",children:[r.jsx(Qc,{className:"w-3.5 h-3.5 text-[#00e5ff]"}),r.jsx("span",{className:"font-semibold text-[11px]",children:"Email & Password Security"})]}),r.jsx("button",{onClick:()=>u(!l),className:"text-[11px] text-[#00e5ff] hover:underline font-medium cursor-pointer",children:l?"Cancel":"Change Password"})]})`;

  if (code.includes(oldT5)) {
    code = code.replace(oldT5, newT5);
    changed = true;
    console.log(`[Auto-Logout] Patched Target 5 (Profile session security badge) in ${filePath}`);
  }

  if (changed) {
    try {
      esbuild.transformSync(code, { loader: 'js' });
      fs.writeFileSync(filePath, code, 'utf8');
      console.log(`[Auto-Logout] Successfully validated and saved ${filePath}`);
      return true;
    } catch (err) {
      console.error(`[Auto-Logout] Validation error for ${filePath}:`, err);
      process.exit(1);
    }
  } else {
    console.log(`[Auto-Logout] No changes needed or already patched in ${filePath}`);
    return false;
  }
}

function patchHtml(htmlPath) {
  if (!fs.existsSync(htmlPath)) return false;
  let html = fs.readFileSync(htmlPath, 'utf8');
  if (html.includes('kalam_session_login_time') || html.includes('MAX_SESSION_MS')) {
    console.log('[Auto-Logout] index.html already contains session manager script.');
    return false;
  }

  const sessionScript = `
    <!-- KALAM Automatic 6-Hour Session Expiration Protection -->
    <script>
      (function() {
        try {
          var MAX_SESSION_MS = 6 * 60 * 60 * 1000; // 6 hours
          var authUser = localStorage.getItem('kalam_auth_user');
          var loginTime = localStorage.getItem('kalam_session_login_time');
          if (authUser) {
            if (!loginTime) {
              localStorage.setItem('kalam_session_login_time', Date.now().toString());
            } else {
              var elapsed = Date.now() - Number(loginTime);
              if (elapsed >= MAX_SESSION_MS || isNaN(elapsed) || elapsed < 0) {
                console.log('[Auth] 6-hour session duration exceeded. Removing active session...');
                localStorage.removeItem('kalam_auth_user');
                localStorage.removeItem('kalam_session_login_time');
                localStorage.removeItem('kalam_wallet_balance');
                sessionStorage.setItem('kalam_session_expired_toast', '1');
              }
            }
          }

          // Hook Storage.prototype to auto-track session start on any login
          var _setItem = Storage.prototype.setItem;
          Storage.prototype.setItem = function(k, v) {
            if (k === 'kalam_auth_user' && v) {
              try {
                var curLogin = localStorage.getItem('kalam_session_login_time');
                var oldUser = localStorage.getItem('kalam_auth_user');
                var oldId = oldUser ? JSON.parse(oldUser).id : null;
                var newId = JSON.parse(v).id;
                if (!curLogin || (oldId && newId && oldId !== newId)) {
                  _setItem.call(this, 'kalam_session_login_time', Date.now().toString());
                }
              } catch(e) {}
            }
            return _setItem.apply(this, arguments);
          };

          var _remItem = Storage.prototype.removeItem;
          Storage.prototype.removeItem = function(k) {
            if (k === 'kalam_auth_user') {
              try {
                _remItem.call(this, 'kalam_session_login_time');
                _remItem.call(this, 'kalam_session_last_active');
              } catch(e) {}
            }
            return _remItem.apply(this, arguments);
          };
        } catch(err) {}
      })();
    </script>
`;

  const headIdx = html.indexOf('<head>');
  if (headIdx !== -1) {
    html = html.substring(0, headIdx + 6) + sessionScript + html.substring(headIdx + 6);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`[Auto-Logout] Injected pre-boot session manager into ${htmlPath}`);
    return true;
  }
  return false;
}

const p1 = path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js');
const p2 = path.join(__dirname, '..', 'dist', 'assets', 'index-BvHT743v.js');
const html1 = path.join(__dirname, '..', 'index.html');
const html2 = path.join(__dirname, '..', 'dist', 'index.html');

patchBundle(p1);
patchBundle(p2);
patchHtml(html1);
patchHtml(html2);
console.log('[Auto-Logout] Session Auto-Logout setup complete!');
