const fs = require('fs');
const path = require('path');

function patchRealtimeWalletSync(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('Target file does not exist:', filePath);
    return false;
  }

  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. In LQ (Deposit Modal): Auto-check success instant balance credit
  const oldAutoCheck = `v.isPaid===!0&&(v.status==="SUCCESS"||v.status==="COMPLETED")&&(t(Number(v.amount||i),v.utr||sUtr),d("SUCCESS"),setTimeout(()=>{d("AMOUNT"),W(null),L(""),P(null),e()},3200))`;
  const newAutoCheck = `v.isPaid===!0&&(v.status==="SUCCESS"||v.status==="COMPLETED")&&((()=>{const _amt=Number(v.amount||i);const _utr=v.utr||sUtr;const _prev=Number(localStorage.getItem("kalam_wallet_balance")||0);const _next=Math.round((_prev+_amt)*100)/100;try{localStorage.setItem("kalam_wallet_balance",String(_next))}catch{}try{window.dispatchEvent(new CustomEvent("kalam_wallet_updated",{detail:{balance:_next,amount:_amt,utr:_utr}}))}catch{}try{t(_amt,_utr)}catch(_e){console.error("Deposit callback error:",_e)}d("SUCCESS");setTimeout(()=>{d("AMOUNT"),W(null),L(""),P(null),e()},2200)})())`;

  if (code.includes(oldAutoCheck)) {
    code = code.replace(oldAutoCheck, newAutoCheck);
    changed = true;
    console.log('[1] Patched LQ auto-check success with instant real-time balance update');
  }

  // 2. In LQ (Deposit Modal): Manual UTR verification instant balance credit
  const oldManualUtr = `n.isPaid&&n.status==="SUCCESS"?(t(Number(n.amount||i),n.utr||sUtr),d("SUCCESS"),setTimeout(()=>{d("AMOUNT"),W(null),L(""),P(null),e()},3200))`;
  const newManualUtr = `n.isPaid&&n.status==="SUCCESS"?((()=>{const _amt=Number(n.amount||i);const _utr=n.utr||sUtr;const _prev=Number(localStorage.getItem("kalam_wallet_balance")||0);const _next=Math.round((_prev+_amt)*100)/100;try{localStorage.setItem("kalam_wallet_balance",String(_next))}catch{}try{window.dispatchEvent(new CustomEvent("kalam_wallet_updated",{detail:{balance:_next,amount:_amt,utr:_utr}}))}catch{}try{t(_amt,_utr)}catch(_e){console.error("Deposit callback error:",_e)}d("SUCCESS");setTimeout(()=>{d("AMOUNT"),W(null),L(""),P(null),e()},2200)})())`;

  if (code.includes(oldManualUtr)) {
    code = code.replace(oldManualUtr, newManualUtr);
    changed = true;
    console.log('[2] Patched LQ manual UTR verification with instant real-time balance update');
  }

  // 3. In LQ (Deposit Modal): Auto-detect button (be) instant balance credit (handles newlines)
  const oldAutoDetect = `if((kt==null?void 0:kt.isPaid)===!0&&(kt==null?void 0:kt.status)==="SUCCESS"){\n          const he=(kt==null?void 0:kt.amount)||ne.amountInRupees||i;\n          t(he,(kt==null?void 0:kt.utr)||zt),\n          d("SUCCESS"),\n          setTimeout(()=>{d("AMOUNT"),W(null),L(""),P(null),e()},3200)\n        }`;
  const newAutoDetect = `if((kt==null?void 0:kt.isPaid)===!0&&(kt==null?void 0:kt.status)==="SUCCESS"){const he=Number((kt==null?void 0:kt.amount)||(ne==null?void 0:ne.amountInRupees)||i)||0;const _u=(kt==null?void 0:kt.utr)||zt;const _prev=Number(localStorage.getItem("kalam_wallet_balance")||0);const _next=Math.round((_prev+he)*100)/100;try{localStorage.setItem("kalam_wallet_balance",String(_next))}catch{}try{window.dispatchEvent(new CustomEvent("kalam_wallet_updated",{detail:{balance:_next,amount:he,utr:_u}}))}catch{}try{t(he,_u)}catch(_e){console.error("Auto-detect cb error:",_e)}d("SUCCESS");setTimeout(()=>{d("AMOUNT"),W(null),L(""),P(null),e()},2200);}`;

  if (code.includes(oldAutoDetect)) {
    code = code.replace(oldAutoDetect, newAutoDetect);
    changed = true;
    console.log('[3] Patched LQ auto-detect button (be) with instant real-time balance update');
  }

  // 4. In LQ: Pass user ID and email to /api/create-order
  const oldCreateOrder = `Gr("/api/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:currAmt,redirect_url:window.location.origin+"/success",apiKey:V==null?void 0:V.apiKey,gatewayUrl:(V==null?void 0:V.baseUrl)||(V==null?void 0:V.gatewayUrl),merchantUpi:mUpi,gateway:gwType})},20000)`;
  const newCreateOrder = `(()=>{let _uId="guest",_uEm="";try{const _u=JSON.parse(localStorage.getItem("kalam_auth_user")||"{}");_uId=_u.id||_u.email||"guest";_uEm=_u.email||""}catch{}return Gr("/api/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:currAmt,redirect_url:window.location.origin+"/success",apiKey:V==null?void 0:V.apiKey,gatewayUrl:(V==null?void 0:V.baseUrl)||(V==null?void 0:V.gatewayUrl),merchantUpi:mUpi,gateway:gwType,userId:_uId,email:_uEm})},20000)})()`;

  if (code.includes(oldCreateOrder)) {
    code = code.replace(oldCreateOrder, newCreateOrder);
    changed = true;
    console.log('[4] Injected userId & email into /api/create-order call from LQ');
  }

  // 5. CRITICAL FIX FOR BALANCE ISOLATION: User-scoped zEffect (prevent admin balance leakage)
  const oldZEffect1 = `q.useEffect(()=>{if(w){const me=(z||[]).find(Ee=>Ee.id===w.id||Ee.email&&w.email&&Ee.email.toLowerCase()===w.email.toLowerCase());const curB=Number(w.walletBalance)||0;const locB=Number(localStorage.getItem("kalam_wallet_balance"))||0;const maxB=Math.max(curB,locB);if(me&&typeof me.walletBalance==="number"&&me.walletBalance>maxB){const Ee={...w,walletBalance:me.walletBalance};S(Ee);try{localStorage.setItem("kalam_auth_user",JSON.stringify(Ee))}catch{}try{localStorage.setItem("kalam_wallet_balance",String(me.walletBalance))}catch{}M(ke=>({...ke,balance:me.walletBalance}))}else if(me&&maxB>0&&me.walletBalance!==maxB){me.walletBalance=maxB;}}},[z])`;
  const isolatedZEffect = `q.useEffect(()=>{if(w){const me=(z||[]).find(Ee=>Ee.id===w.id||Ee.email&&w.email&&Ee.email.toLowerCase()===w.email.toLowerCase());if(me&&typeof me.walletBalance==="number"&&w.walletBalance!==me.walletBalance){const Ee={...w,walletBalance:me.walletBalance};S(Ee);try{localStorage.setItem("kalam_auth_user",JSON.stringify(Ee))}catch{}try{localStorage.setItem("kalam_wallet_balance",String(me.walletBalance))}catch{}M(ke=>({...ke,balance:me.walletBalance}))}}},[z])`;

  if (code.includes(oldZEffect1)) {
    code = code.replace(oldZEffect1, isolatedZEffect);
    changed = true;
    console.log('[5] Isolated zEffect: Stopped stale admin balance from leaking into other user accounts');
  }

  // 6. In Startup Hook: User-scoped _syncSrv that never mixes admin balance with other users
  const oldSyncSrv = `const _syncSrv=()=>{const curU=localStorage.getItem("kalam_auth_user");let uId="",uEm="";try{if(curU){const p=JSON.parse(curU);uId=p.id||"";uEm=p.email||""}}catch{}if(true){fetch(\`/api/wallet/balance?userId=\${encodeURIComponent(uId)}&email=\${encodeURIComponent(uEm)}\`).then(r=>r.json()).then(d=>{if(d&&d.success&&typeof d.balance==="number"&&d.balance>0){const localBal=Number(localStorage.getItem("kalam_wallet_balance")||0);const finalB=Math.max(localBal,d.balance);localStorage.setItem("kalam_wallet_balance",String(finalB));M(s=>({...s,balance:finalB}));S(u=>u?{...u,walletBalance:finalB}:null)}}).catch(()=>{})}};`;
  const newSyncSrv = `const _syncSrv=()=>{const curU=localStorage.getItem("kalam_auth_user");let uId="",uEm="";try{if(curU){const p=JSON.parse(curU);uId=p.id||"";uEm=p.email||""}}catch{}if(uId||uEm){fetch(\`/api/wallet/balance?userId=\${encodeURIComponent(uId)}&email=\${encodeURIComponent(uEm)}\`).then(r=>r.json()).then(d=>{if(d&&d.success&&typeof d.balance==="number"){const nowU=localStorage.getItem("kalam_auth_user");let nowId="",nowEm="";try{if(nowU){const np=JSON.parse(nowU);nowId=np.id||"";nowEm=np.email||""}}catch{}if((uId&&nowId===uId)||(uEm&&nowEm.toLowerCase()===uEm.toLowerCase())){const finalB=d.balance;localStorage.setItem("kalam_wallet_balance",String(finalB));M(s=>({...s,balance:finalB}));S(u=>u?{...u,walletBalance:finalB}:null)}}}).catch(()=>{})}else{const locB=Number(localStorage.getItem("kalam_wallet_balance")||0);if(locB>0){localStorage.setItem("kalam_wallet_balance","0");M(s=>({...s,balance:0}))}}};`;

  if (code.includes(oldSyncSrv)) {
    code = code.replace(oldSyncSrv, newSyncSrv);
    changed = true;
    console.log('[6] User-scoped _syncSrv: Directly syncs user-specific balance from server with zero bleed');
  }

  // 7. In onAuthStateChanged: Isolate auth balance by email/role (Admin gets admin balance, regular user gets their own balance)
  const oldAuthListener = `||xn||Xt;const _locAuthBal=Number(localStorage.getItem("kalam_wallet_balance")||0);const _finAuthBal=Math.max(Number(sn?.walletBalance)||0,_locAuthBal);$n={...Un,walletBalance:_finAuthBal,role:sn.role==="ADMIN"?"ADMIN":sn.isReseller?"RESELLER":"USER",name:sn.name,username:sn.username,joinedDate:Kt};S($n);M(s=>({...s,balance:_finAuthBal}));ee(Cn=>{const Ns=Ei([{...sn,joinedDate:Kt,walletBalance:_finAuthBal},...Cn]);try{localStorage.setItem("kalam_users_db",JSON.stringify(Ns))}catch{}return Ns});try{localStorage.setItem("kalam_auth_user",JSON.stringify($n))}catch{}}catch{const _fb=Number(localStorage.getItem("kalam_wallet_balance")||0);const _safeUn={...Un,walletBalance:Math.max(Un.walletBalance,_fb)};S(_safeUn);M(s=>({...s,balance:_safeUn.walletBalance}))}}`;
  const newAuthListener = `||xn||Xt;const _isAdm=(sn?.email||"").toLowerCase()==="kalam172010@gmail.com"||(sn?.email||"").toLowerCase()==="kalam2000abc@gmail.com";const _finAuthBal=typeof sn?.walletBalance==="number"?sn.walletBalance:(_isAdm?290011.65:0);$n={...Un,walletBalance:_finAuthBal,role:sn.role==="ADMIN"?"ADMIN":sn.isReseller?"RESELLER":"USER",name:sn.name,username:sn.username,joinedDate:Kt};S($n);M(s=>({...s,balance:_finAuthBal}));try{localStorage.setItem("kalam_wallet_balance",String(_finAuthBal))}catch{}ee(Cn=>{const Ns=Ei([{...sn,joinedDate:Kt,walletBalance:_finAuthBal},...Cn]);try{localStorage.setItem("kalam_users_db",JSON.stringify(Ns))}catch{}return Ns});try{localStorage.setItem("kalam_auth_user",JSON.stringify($n))}catch{}}catch{const _isAdmE=(Un?.email||"").toLowerCase()==="kalam172010@gmail.com"||(Un?.email||"").toLowerCase()==="kalam2000abc@gmail.com";const _safeBal=_isAdmE?290011.65:(Number(Un?.walletBalance)||0);const _safeUn={...Un,walletBalance:_safeBal};S(_safeUn);M(s=>({...s,balance:_safeBal}))}}`;

  if (code.includes(oldAuthListener)) {
    code = code.replace(oldAuthListener, newAuthListener);
    changed = true;
    console.log('[7] Isolated onAuthStateChanged: Admin gets admin balance, users get strictly their own balance');
  }

  // 8. In lo calculation (Wallet Balance Display): Do not fallback to global localStorage if user is different
  const oldLo = `lo=Math.max(Number(w?.walletBalance)||0,Number(pe?.balance)||0,Number(localStorage.getItem("kalam_wallet_balance"))||0);`;
  const newLo = `lo=Number(w!=null&&typeof w.walletBalance=="number"?w.walletBalance:typeof pe.balance=="number"?pe.balance:0)||0;`;

  if (code.includes(oldLo)) {
    code = code.replace(oldLo, newLo);
    changed = true;
    console.log('[8] Patched lo display calculation: strictly displays active user balance');
  }

  // 9. In Lte: Stop Firestore from taking admin localStorage balance into other users
  const oldLteBal = `walletBalance:(()=>{const _lb=Number(localStorage.getItem("kalam_wallet_balance"));const _fb=typeof l.walletBalance=="number"?l.walletBalance:((s==null?void 0:s.walletBalance)??(t?290011.65:0));return !isNaN(_lb)&&_lb>0?Math.max(_lb,_fb):_fb})()`;
  const newLteBal = `walletBalance:(()=>{const _fb=typeof l.walletBalance=="number"?l.walletBalance:((s==null?void 0:s.walletBalance)??(t?290011.65:0));return t?_fb:(typeof l.walletBalance=="number"?l.walletBalance:((s==null?void 0:s.walletBalance)??0))})()`;

  if (code.includes(oldLteBal)) {
    code = code.replace(oldLteBal, newLteBal);
    changed = true;
    console.log('[9] Protected Lte Firestore sync from leaking admin balance to regular accounts');
  }

  // 10. In Sign Out (Tt): Fully clear wallet balance and state on logout so next login is 100% clean
  const oldLogout = `localStorage.removeItem("kalam_auth_user"),S(null),x(!1),e("user"),i("dashboard"),Se("Signed out of Firebase session.")`;
  const newLogout = `localStorage.removeItem("kalam_auth_user"),localStorage.removeItem("kalam_wallet_balance"),M(s=>({...s,balance:0})),S(null),x(!1),e("user"),i("dashboard"),Se("Signed out of Firebase session.")`;

  if (code.includes(oldLogout)) {
    code = code.replace(oldLogout, newLogout);
    changed = true;
    console.log('[10] Patched Sign Out (Tt) to purge wallet balance on logout');
  }

  // 11. In pe initialization: Initialize based on auth user, not blind localStorage
  const oldPeInit = `try{const savBal=localStorage.getItem("kalam_wallet_balance");if(savBal!==null&&!isNaN(Number(savBal)))return{...s3,balance:Number(savBal)};const me=localStorage.getItem("kalam_auth_user");if(me){const Ee=JSON.parse(me);if(typeof(Ee==null?void 0:Ee.walletBalance)=="number")return{...s3,balance:Ee.walletBalance};if(Ee!=null&&Ee.walletBalance)return{...s3,balance:Number(Ee.walletBalance)||0}}}catch{}return s3`;
  const newPeInit = `try{const me=localStorage.getItem("kalam_auth_user");if(me){const Ee=JSON.parse(me);const isAdm=(Ee?.email||"").toLowerCase()==="kalam172010@gmail.com"||(Ee?.email||"").toLowerCase()==="kalam2000abc@gmail.com";if(typeof(Ee==null?void 0:Ee.walletBalance)=="number")return{...s3,balance:Ee.walletBalance};if(isAdm)return{...s3,balance:290011.65};const savBal=localStorage.getItem("kalam_wallet_balance");if(savBal!==null&&!isNaN(Number(savBal)))return{...s3,balance:Number(savBal)}}}catch{}return{...s3,balance:0}`;

  if (code.includes(oldPeInit)) {
    code = code.replace(oldPeInit, newPeInit);
    changed = true;
    console.log('[11] Patched pe initialization to tie state strictly to authenticated user');
  }

  // 12. In User Management (vne): Add "Switch User" button on each user row so Admin can test/impersonate
  const oldViewProfileBtn = `title:"View Full User Profile & Purchase History",children:r.jsx(Yc,{className:"w-4 h-4 text-cyan-400"})})`;
  const newViewProfileBtn = `title:"View Full User Profile & Purchase History",children:r.jsx(Yc,{className:"w-4 h-4 text-cyan-400"})}),!Et&&r.jsx("button",{onClick:()=>{try{localStorage.setItem("kalam_auth_user",JSON.stringify(he));localStorage.setItem("kalam_wallet_balance",String(he.walletBalance||0));localStorage.setItem("kalam_app_mode","user");window.location.reload()}catch{}},className:"px-2 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all",title:\`Switch into \${he.name}'s account (Balance: ₹\${he.walletBalance||0})\`,children:"Switch User"})`;

  if (code.includes(oldViewProfileBtn)) {
    code = code.replace(oldViewProfileBtn, newViewProfileBtn);
    changed = true;
    console.log('[12] Added "Switch User" impersonation button in User Management (vne)');
  }

  // 13. In vs (Deposit Handler): Deduplicate by UTR and pass UTR to server sync
  const oldVs = `vs=(me,Ee)=>{var Xt,Un;const _numDep=Math.max(0,Number(me)||0);const _curBal=Number(w?.walletBalance??pe?.balance??localStorage.getItem("kalam_wallet_balance")??0)||0;`;
  const newVs = `vs=(me,Ee)=>{var Xt,Un;const _numDep=Math.max(0,Number(me)||0);if(_numDep<=0)return;const _uKey=String(Ee||"")+":"+String(_numDep);if(Ee&&window._kalam_dup&&window._kalam_dup[_uKey]){console.log("Blocked duplicate credit for",_uKey);return;}if(!window._kalam_dup)window._kalam_dup={};if(Ee)window._kalam_dup[_uKey]=Date.now();const _curBal=Number(w?.walletBalance??pe?.balance??localStorage.getItem("kalam_wallet_balance")??0)||0;`;

  if (code.includes(oldVs)) {
    code = code.replace(oldVs, newVs);
    changed = true;
    console.log('[13] Added UTR deduplication to vs handler');
  }

  // 14. Fix Auto-detect double addition if already present in bundle
  const doubleAddDetect = `const _next=Math.round((_prev+he)*100)/100;try{localStorage.setItem("kalam_wallet_balance",String(_next))}catch{}try{window.dispatchEvent(new CustomEvent("kalam_wallet_updated",{detail:{balance:_next,amount:he,utr:_u}}))}catch{}try{t(he,_u)}catch(_e){console.error("Auto-detect cb error:",_e)}`;
  const singleAddDetect = `try{t(he,_u)}catch(_e){console.error("Auto-detect cb error:",_e)}`;
  if (code.includes(doubleAddDetect)) {
    code = code.replace(doubleAddDetect, singleAddDetect);
    changed = true;
    console.log('[14] Removed double balance addition in auto-detect button');
  }

  // 15. Ensure vs passes utr to /api/wallet/sync
  const oldVsSyncCall = `reason:"Deposit: ₹"+_numDep+" ("+(Ee||"Auto")+")"`;
  const newVsSyncCall = `reason:"Deposit: ₹"+_numDep+" ("+(Ee||"Auto")+")",utr:Ee||""`;
  if (code.includes(oldVsSyncCall) && !code.includes(newVsSyncCall)) {
    code = code.replace(oldVsSyncCall, newVsSyncCall);
    changed = true;
    console.log('[15] Ensured vs passes explicit utr to /api/wallet/sync');
  }

  if (changed) {
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Successfully patched:', filePath);
    return true;
  } else {
    console.log('No changes needed (already patched):', filePath);
    return false;
  }
}

// Apply to public and dist assets
const targets = [
  path.join(__dirname, '../public/assets/index-BvHT743v.js'),
  path.join(__dirname, '../dist/assets/index-BvHT743v.js')
];

targets.forEach(t => patchRealtimeWalletSync(t));
