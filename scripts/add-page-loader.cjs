const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const filePath = path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js');

if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

let code = fs.readFileSync(filePath, 'utf8');

// 1. Replace hQ with enhanced loading method (neon bar + cyber loading pill)
const oldHq = `hQ=({isLoading:n})=>r.jsx(is,{children:n&&r.jsx(Ge.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},className:"fixed top-0 left-0 right-0 z-50 pointer-events-none h-1 bg-transparent overflow-hidden",children:r.jsx(Ge.div,{initial:{x:"-100%"},animate:{x:"100%"},transition:{repeat:1/0,duration:.9,ease:"easeInOut"},className:"w-1/2 h-full bg-gradient-to-r from-transparent via-[#00e5ff] to-[#ff0080] shadow-[0_0_12px_#00e5ff]"})})})`;

const newHq = `hQ=({isLoading:n})=>r.jsx(is,{children:n&&r.jsxs(r.Fragment,{children:[r.jsx(Ge.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},className:"fixed top-0 left-0 right-0 z-[999999] pointer-events-none h-1 bg-transparent overflow-hidden shadow-[0_0_16px_#00e5ff]",children:r.jsx(Ge.div,{initial:{x:"-100%"},animate:{x:"100%"},transition:{repeat:1/0,duration:.75,ease:"easeInOut"},className:"w-3/5 h-full bg-gradient-to-r from-transparent via-[#00e5ff] via-[#8b5cf6] to-[#ff0080]"})}),r.jsxs(Ge.div,{initial:{opacity:0,y:-20,scale:.92},animate:{opacity:1,y:0,scale:1},exit:{opacity:0,y:-12,scale:.95},transition:{duration:.18},className:"fixed top-3.5 left-1/2 -translate-x-1/2 z-[999999] pointer-events-none flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0c0c16]/95 border border-[#00e5ff]/50 text-[#00e5ff] text-[11px] font-black uppercase tracking-wider shadow-[0_0_25px_rgba(0,229,255,0.45)] backdrop-blur-xl",children:[r.jsxs("svg",{className:"w-3.5 h-3.5 animate-spin text-[#00e5ff] shrink-0",viewBox:"0 0 24 24",fill:"none",children:[r.jsx("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),r.jsx("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),r.jsx("span",{children:"Loading Page..."})]})]})})`;

if (!code.includes(oldHq)) {
  console.error('Failed to locate oldHq in bundle');
  process.exit(1);
}
code = code.replace(oldHq, newHq);

// 2. Replace It and add Lt
const oldIt = `It=me=>{if(me!=="dashboard"&&!w){Vt(()=>It(me),me.replace("_"," ").toUpperCase());return}me!==a&&(Zc(),h(!0),i(me),window.scrollTo({top:0,behavior:"smooth"}),setTimeout(()=>{h(!1)},220))}`;

const newIt = `It=me=>{if(me!=="dashboard"&&!w){Vt(()=>It(me),me.replace("_"," ").toUpperCase());return}Zc(),h(!0),i(me),window.scrollTo({top:0,behavior:"smooth"}),setTimeout(()=>{h(!1)},280)},Lt=me=>{h(!0),u(me),window.scrollTo({top:0,behavior:"smooth"}),setTimeout(()=>{h(!1)},280)}`;

if (!code.includes(oldIt)) {
  console.error('Failed to locate oldIt in bundle');
  process.exit(1);
}
code = code.replace(oldIt, newIt);

// 3. Update Mn quick actions
const oldMn = `case"DEPOSIT":dt(!0);break;case"BUY_KEYS":Ut(!0);break;case"MY_KEYS":i("my_keys");break;case"HISTORY":i("history");break;case"REFERRAL":i("referral");break;case"PROFILE":i("profile");break`;

const newMn = `case"DEPOSIT":dt(!0);break;case"BUY_KEYS":It("buy_keys");break;case"MY_KEYS":It("my_keys");break;case"HISTORY":It("history");break;case"REFERRAL":It("referral");break;case"PROFILE":It("profile");break`;

if (!code.includes(oldMn)) {
  console.error('Failed to locate oldMn in bundle');
  process.exit(1);
}
code = code.replace(oldMn, newMn);

// 4. Update root return to include hQ globally across all pages and views
const oldRet = `return r.jsxs("div",{className:"min-h-screen bg-[#0a0a0f] text-white flex flex-col font-sans",children:[r.jsx(is,{children:nn&&`;

const newRet = `return r.jsxs("div",{className:"min-h-screen bg-[#0a0a0f] text-white flex flex-col font-sans",children:[r.jsx(hQ,{isLoading:d||p}),r.jsx(is,{children:nn&&`;

if (!code.includes(oldRet)) {
  console.error('Failed to locate oldRet in bundle');
  process.exit(1);
}
code = code.replace(oldRet, newRet);

// 5. Update admin onSelectTab and onNavigate to use Lt
const oldAdmin = `n==="admin"&&(Bn?r.jsxs(Jte,{activeTab:l,onSelectTab:u,onSwitchToUser:()=>{e("user"),i("dashboard");try{localStorage.setItem("kalam_app_mode","user")}catch{}},storeSettings:te,currentUser:w,onLogout:Tt,products:A,users:z,activities:V,unreadActivityCount:le,soundMuted:we,onToggleSound:Me,onClearActivities:Fe,activeToast:xe,onDismissToast:()=>be(null),children:[l==="dashboard"&&r.jsx(one,{products:A,resellers:z,onNavigate:me=>u(me)})`;

const newAdmin = `n==="admin"&&(Bn?r.jsxs(Jte,{activeTab:l,onSelectTab:Lt,onSwitchToUser:()=>{h(!0),e("user"),i("dashboard");try{localStorage.setItem("kalam_app_mode","user")}catch{}setTimeout(()=>h(!1),280)},storeSettings:te,currentUser:w,onLogout:Tt,products:A,users:z,activities:V,unreadActivityCount:le,soundMuted:we,onToggleSound:Me,onClearActivities:Fe,activeToast:xe,onDismissToast:()=>be(null),children:[l==="dashboard"&&r.jsx(one,{products:A,resellers:z,onNavigate:me=>Lt(me)})`;

if (!code.includes(oldAdmin)) {
  console.error('Failed to locate oldAdmin in bundle');
  process.exit(1);
}
code = code.replace(oldAdmin, newAdmin);

// 6. Update onSwitchToAdmin
const oldSwitch1 = `onSwitchToAdmin:()=>{e("admin"),u("dashboard");try{localStorage.setItem("kalam_app_mode","admin")}catch{}}`;
const newSwitch1 = `onSwitchToAdmin:()=>{h(!0),e("admin"),u("dashboard");try{localStorage.setItem("kalam_app_mode","admin")}catch{}setTimeout(()=>h(!1),280)}`;
code = code.replaceAll(oldSwitch1, newSwitch1);

try {
  esbuild.transformSync(code, { loader: 'js' });
  console.log('esbuild validation passed! Writing file...');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully applied loading method to all pages in index-BvHT743v.js!');
} catch (err) {
  console.error('Failed esbuild syntax check:', err);
  process.exit(1);
}
