const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

function applyMobileNav(code) {
  const target = 'r.jsx(dQ,{isOpen:_,onClose:()=>P(!1),activeTab:e,onSelectTab:O=>{Zc(),t(O)},onSwitchToAdmin:()=>{Hc(),l()},currentUser:d,storeSettings:u,onOpenAuthModal:h,onLogout:p})]})]})';

  if (!code.includes(target)) {
    console.log('Target for bottom nav already modified or not found');
    return code;
  }

  const navBar = 'r.jsxs("nav",{className:"fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-[#0c0c14]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] shadow-[0_-4px_25px_rgba(0,0,0,0.7)] select-none",children:[r.jsxs("button",{type:"button",onClick:()=>{Zc(),t("dashboard")},className:`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[54px] active:scale-95 ${e==="dashboard"?"text-[#00e5ff] scale-105":"text-gray-400 hover:text-gray-200"}`,children:[r.jsx(yD,{className:`w-5 h-5 transition-transform ${e==="dashboard"?"text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.7)]":"text-gray-400"}`}),r.jsx("span",{className:"text-[10px] font-bold tracking-tight mt-0.5",children:"Home"})]}),r.jsxs("button",{type:"button",onClick:()=>{Zc(),t("buy_keys")},className:`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[54px] active:scale-95 ${e==="buy_keys"?"text-[#00e5ff] scale-105":"text-gray-400 hover:text-gray-200"}`,children:[r.jsx(ff,{className:`w-5 h-5 transition-transform ${e==="buy_keys"?"text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.7)]":"text-gray-400"}`}),r.jsx("span",{className:"text-[10px] font-bold tracking-tight mt-0.5",children:"Store"})]}),r.jsxs("button",{type:"button",onClick:()=>{Hc(),S()},className:"flex flex-col items-center justify-center py-0.5 px-2 rounded-xl transition-all cursor-pointer group -mt-3.5 min-h-[48px] min-w-[58px] active:scale-90",children:[r.jsx("div",{className:"w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00e5ff] via-[#8b5cf6] to-[#ff0080] p-[1.5px] shadow-[0_0_20px_rgba(0,229,255,0.5)] group-active:scale-95 transition-transform flex items-center justify-center",children:r.jsx("div",{className:"w-full h-full rounded-2xl bg-[#0c0c14] flex items-center justify-center",children:r.jsx(_f,{className:"w-5 h-5 text-[#00e5ff]"})})}),r.jsx("span",{className:"text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-[#ff0080] mt-0.5 tracking-tight",children:"Deposit"})]}),r.jsxs("button",{type:"button",onClick:()=>{Zc(),t("my_keys")},className:`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[54px] active:scale-95 ${e==="my_keys"?"text-[#00e5ff] scale-105":"text-gray-400 hover:text-gray-200"}`,children:[r.jsx(fi,{className:`w-5 h-5 transition-transform ${e==="my_keys"?"text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.7)]":"text-gray-400"}`}),r.jsx("span",{className:"text-[10px] font-bold tracking-tight mt-0.5",children:"My Keys"})]}),r.jsxs("button",{type:"button",onClick:()=>{Zc(),P(!0)},className:"flex flex-col items-center justify-center py-1 px-2 rounded-xl text-gray-400 hover:text-gray-200 transition-all cursor-pointer min-h-[44px] min-w-[54px] active:scale-95",children:[r.jsx(H5,{className:"w-5 h-5"}),r.jsx("span",{className:"text-[10px] font-bold tracking-tight mt-0.5",children:"Menu"})]})]}),';

  let updated = code.replace(target, navBar + target);

  // Update container bottom padding from pb-20 to pb-24 for safe bottom bar clearance
  updated = updated.replace('shadow-[0_0_60px_rgba(0,0,0,0.8)] pb-20 smooth-gpu', 'shadow-[0_0_60px_rgba(0,0,0,0.8)] pb-24 smooth-gpu');

  return updated;
}

function processFile(filePath) {
  console.log('Processing for mobile UI:', filePath);
  let code = fs.readFileSync(filePath, 'utf8');

  let modified = applyMobileNav(code);
  try {
    esbuild.transformSync(modified, { loader: 'js' });
    console.log('Syntax check passed for:', filePath);
    fs.writeFileSync(filePath, modified, 'utf8');
    return true;
  } catch (err) {
    console.error('Syntax error:', err);
    return false;
  }
}

const f1 = path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js');
const f2 = path.join(__dirname, '..', 'dist', 'assets', 'index-BvHT743v.js');

const r1 = processFile(f1);
const r2 = processFile(f2);

if (r1 && r2) {
  console.log('MOBILE UI ENHANCEMENTS APPLIED SUCCESSFULLY!');
} else {
  console.error('FAILED TO APPLY MOBILE UI ENHANCEMENTS');
  process.exit(1);
}
