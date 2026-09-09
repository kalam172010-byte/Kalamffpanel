const fs = require('fs');
const path = require('path');

function patchRealtimeWalletSync(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('Target file does not exist:', filePath);
    return false;
  }

  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. LQ Auto-Poller: Add userId and email to /api/check-payment URLSearchParams
  const ftRegex = /const Ft=new URLSearchParams;\s*V!=null&&V\.apiKey&&Ft\.set\("apiKey",V\.apiKey\),\s*Ft\.set\("gateway","famgateway"\),\s*Ft\.set\("amount",String\(ne\.amountInRupees\|\|i\)\);/;
  if (ftRegex.test(code) && !code.includes('Ft.set("userId"')) {
    code = code.replace(ftRegex, 'const Ft=new URLSearchParams;V!=null&&V.apiKey&&Ft.set("apiKey",V.apiKey),Ft.set("gateway","famgateway"),Ft.set("amount",String(ne.amountInRupees||i));try{const _au=JSON.parse(localStorage.getItem("kalam_auth_user")||"{}");if(_au.id)Ft.set("userId",_au.id);if(_au.email)Ft.set("email",_au.email);}catch{}');
    changed = true;
    console.log('[1] Added userId & email to /api/check-payment query');
  }

  // 2. LQ Auto-Poller: Instant balance update on st.isPaid === true
  const stPaidRegex = /const kt=Number\(st\.amount\|\|\(ne==null\?void 0:ne\.amountInRupees\)\|\|i\)\|\|0,he=st\.utr\|\|void 0;\s*try\{t\(kt,he\)\}catch\(_cbErr\)\{console\.error\("Deposit callback error:",_cbErr\)\}\s*d\("SUCCESS"\);/;
  if (stPaidRegex.test(code) && !code.includes('st.balance')) {
    code = code.replace(stPaidRegex, 'const kt=Number(st.amount||(ne==null?void 0:ne.amountInRupees)||i)||0,he=st.utr||void 0;if(typeof st.balance==="number"&&st.balance>0){try{localStorage.setItem("kalam_wallet_balance",String(st.balance))}catch{}try{window.dispatchEvent(new CustomEvent("kalam_wallet_updated",{detail:{balance:st.balance,amount:kt,utr:he}}))}catch{}}try{t(kt,he)}catch(_cbErr){console.error("Deposit callback error:",_cbErr)}d("SUCCESS");');
    changed = true;
    console.log('[2] Patched LQ auto-poller success with instant real-time balance update');
  }

  // 3. LQ Manual UTR: Pass userId & email in /api/verify-utr
  const verifyUtrRegex = /body:JSON\.stringify\(\{\s*orderId:\(ne==null\?void 0:ne\.orderId\)\|\|`FAMPAY_\$\{Date\.now\(\)\}`,\s*amount:\(ne==null\?void 0:ne\.amountInRupees\)\|\|i,\s*utr:jt,/;
  if (verifyUtrRegex.test(code) && !code.includes('userId:(()=>{try{return JSON.parse(localStorage.getItem("kalam_auth_user")||"{}"')) {
    code = code.replace(verifyUtrRegex, 'body:JSON.stringify({userId:(()=>{try{return JSON.parse(localStorage.getItem("kalam_auth_user")||"{}").id||"guest"}catch{return"guest"}})(),email:(()=>{try{return JSON.parse(localStorage.getItem("kalam_auth_user")||"{}").email||""}catch{return""}})(),orderId:(ne==null?void 0:ne.orderId)||`FAMPAY_${Date.now()}`,amount:(ne==null?void 0:ne.amountInRupees)||i,utr:jt,');
    changed = true;
    console.log('[3] Added userId & email to /api/verify-utr POST body');
  }

  // 4. LQ Manual UTR: Instant balance update on he.isPaid === true
  const hePaidRegex = /const et=Number\(\(he==null\?void 0:he\.amount\)\|\|\(ne==null\?void 0:ne\.amountInRupees\)\|\|i\)\|\|0;\s*try\{t\(et,jt\)\}catch\(_cbErr\)\{console\.error\("Manual UTR callback error:",_cbErr\)\}\s*d\("SUCCESS"\);/;
  if (hePaidRegex.test(code) && !code.includes('he.balance')) {
    code = code.replace(hePaidRegex, 'const et=Number((he==null?void 0:he.amount)||(ne==null?void 0:ne.amountInRupees)||i)||0;if(typeof he.balance==="number"&&he.balance>0){try{localStorage.setItem("kalam_wallet_balance",String(he.balance))}catch{}try{window.dispatchEvent(new CustomEvent("kalam_wallet_updated",{detail:{balance:he.balance,amount:et,utr:jt}}))}catch{}}try{t(et,jt)}catch(_cbErr){console.error("Manual UTR callback error:",_cbErr)}d("SUCCESS");');
    changed = true;
    console.log('[4] Patched LQ manual UTR success with instant real-time balance update');
  }

  // 5. LQ Auto-Detect: Pass userId & email in /api/auto-detect-payment
  const autoDetectRegex = /body:JSON\.stringify\(\{\s*orderId:ne\.orderId,\s*amount:ne\.amountInRupees\|\|i,\s*apiKey:V==null\?void 0:V\.apiKey,/;
  if (autoDetectRegex.test(code) && !code.includes('orderId:ne.orderId,userId:')) {
    code = code.replace(autoDetectRegex, 'body:JSON.stringify({userId:(()=>{try{return JSON.parse(localStorage.getItem("kalam_auth_user")||"{}").id||"guest"}catch{return"guest"}})(),email:(()=>{try{return JSON.parse(localStorage.getItem("kalam_auth_user")||"{}").email||""}catch{return""}})(),orderId:ne.orderId,amount:ne.amountInRupees||i,apiKey:V==null?void 0:V.apiKey,');
    changed = true;
    console.log('[5] Added userId & email to /api/auto-detect-payment POST body');
  }

  // 6. LQ Auto-Detect: Instant balance update on kt.isPaid === true
  const oldKtPaid = 'const he=Number((kt==null?void 0:kt.amount)||(ne==null?void 0:ne.amountInRupees)||i)||0;const _u=(kt==null?void 0:kt.utr)||zt;const _prev=Number(localStorage.getItem("kalam_wallet_balance")||0);try{t(he,_u)}catch(_e){console.error("Auto-detect cb error:",_e)}d("SUCCESS");setTimeout(()=>{d("AMOUNT"),W(null),L(""),P(null),e()},2200);';
  const newKtPaid = 'const he=Number((kt==null?void 0:kt.amount)||(ne==null?void 0:ne.amountInRupees)||i)||0;const _u=(kt==null?void 0:kt.utr)||zt;if(typeof kt.balance==="number"&&kt.balance>0){try{localStorage.setItem("kalam_wallet_balance",String(kt.balance))}catch{}try{window.dispatchEvent(new CustomEvent("kalam_wallet_updated",{detail:{balance:kt.balance,amount:he,utr:_u}}))}catch{}}try{t(he,_u)}catch(_e){console.error("Auto-detect cb error:",_e)}d("SUCCESS");setTimeout(()=>{d("AMOUNT"),W(null),L(""),P(null),e()},2200);';
  if (code.includes(oldKtPaid)) {
    code = code.replace(oldKtPaid, newKtPaid);
    changed = true;
    console.log('[6] Patched LQ auto-detect button with instant real-time balance update');
  }

  // 7. Pass user ID and email to /api/create-order
  const oldCreateOrder = 'Gr("/api/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:currAmt,redirect_url:window.location.origin+"/success",apiKey:V==null?void 0:V.apiKey,gatewayUrl:(V==null?void 0:V.baseUrl)||(V==null?void 0:V.gatewayUrl),merchantUpi:mUpi,gateway:gwType})},20000)';
  const newCreateOrder = '(()=>{let _uId="guest",_uEm="";try{const _u=JSON.parse(localStorage.getItem("kalam_auth_user")||"{}");_uId=_u.id||_u.email||"guest";_uEm=_u.email||""}catch{}return Gr("/api/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:currAmt,redirect_url:window.location.origin+"/success",apiKey:V==null?void 0:V.apiKey,gatewayUrl:(V==null?void 0:V.baseUrl)||(V==null?void 0:V.gatewayUrl),merchantUpi:mUpi,gateway:gwType,userId:_uId,email:_uEm})},20000)})()';
  if (code.includes(oldCreateOrder)) {
    code = code.replace(oldCreateOrder, newCreateOrder);
    changed = true;
    console.log('[7] Injected userId & email into /api/create-order call from LQ');
  }

  // 8. CRITICAL: Fix zEffect so it NEVER resets newly deposited balance to 0
  const oldZEffectVariants = [
    'q.useEffect(()=>{if(w){const me=(z||[]).find(Ee=>Ee.id===w.id||Ee.email&&w.email&&Ee.email.toLowerCase()===w.email.toLowerCase());if(me&&typeof me.walletBalance==="number"&&w.walletBalance!==me.walletBalance){const Ee={...w,walletBalance:me.walletBalance};S(Ee);try{localStorage.setItem("kalam_auth_user",JSON.stringify(Ee))}catch{}try{localStorage.setItem("kalam_wallet_balance",String(me.walletBalance))}catch{}M(ke=>({...ke,balance:me.walletBalance}))}}},[z])',
    'q.useEffect(()=>{if(w){const me=(z||[]).find(Ee=>Ee.id===w.id||Ee.email&&w.email&&Ee.email.toLowerCase()===w.email.toLowerCase());const curB=Number(w.walletBalance)||0;const locB=Number(localStorage.getItem("kalam_wallet_balance"))||0;const maxB=Math.max(curB,locB);if(me&&typeof me.walletBalance==="number"&&me.walletBalance>maxB){const Ee={...w,walletBalance:me.walletBalance};S(Ee);try{localStorage.setItem("kalam_auth_user",JSON.stringify(Ee))}catch{}try{localStorage.setItem("kalam_wallet_balance",String(me.walletBalance))}catch{}M(ke=>({...ke,balance:me.walletBalance}))}else if(me&&maxB>0&&me.walletBalance!==maxB){me.walletBalance=maxB;}}},[z])'
  ];
  const safeZEffect = 'q.useEffect(()=>{if(w){const me=(z||[]).find(Ee=>Ee.id===w.id||Ee.email&&w.email&&Ee.email.toLowerCase()===w.email.toLowerCase());const curW=Number(w.walletBalance)||0;if(me&&typeof me.walletBalance==="number"){if(me.walletBalance>curW){const Ee={...w,walletBalance:me.walletBalance};S(Ee);try{localStorage.setItem("kalam_auth_user",JSON.stringify(Ee))}catch{}try{localStorage.setItem("kalam_wallet_balance",String(me.walletBalance))}catch{}M(ke=>({...ke,balance:me.walletBalance}))}else if(curW>me.walletBalance){me.walletBalance=curW}}}},[z])';

  for (const variant of oldZEffectVariants) {
    if (code.includes(variant)) {
      code = code.replace(variant, safeZEffect);
      changed = true;
      console.log('[8] Fixed zEffect: Protected wallet balance from being overwritten/reverted by stale user records');
      break;
    }
  }

  // 9. Startup Hook: Fix _syncSrv so it queries user/guest and never wipes local balance
  const oldSyncSrvVariants = [
    'const _syncSrv=()=>{const curU=localStorage.getItem("kalam_auth_user");let uId="",uEm="";try{if(curU){const p=JSON.parse(curU);uId=p.id||"";uEm=p.email||""}}catch{}if(uId||uEm){fetch(`/api/wallet/balance?userId=${encodeURIComponent(uId)}&email=${encodeURIComponent(uEm)}`).then(r=>r.json()).then(d=>{if(d&&d.success&&typeof d.balance==="number"){const nowU=localStorage.getItem("kalam_auth_user");let nowId="",nowEm="";try{if(nowU){const np=JSON.parse(nowU);nowId=np.id||"";nowEm=np.email||""}}catch{}if((uId&&nowId===uId)||(uEm&&nowEm.toLowerCase()===uEm.toLowerCase())){const finalB=d.balance;localStorage.setItem("kalam_wallet_balance",String(finalB));M(s=>({...s,balance:finalB}));S(u=>u?{...u,walletBalance:finalB}:null)}}}).catch(()=>{})}else{const locB=Number(localStorage.getItem("kalam_wallet_balance")||0);if(locB>0){localStorage.setItem("kalam_wallet_balance","0");M(s=>({...s,balance:0}))}}};',
    'const _syncSrv=()=>{const curU=localStorage.getItem("kalam_auth_user");let uId="",uEm="";try{if(curU){const p=JSON.parse(curU);uId=p.id||"";uEm=p.email||""}}catch{}if(true){fetch(`/api/wallet/balance?userId=${encodeURIComponent(uId)}&email=${encodeURIComponent(uEm)}`).then(r=>r.json()).then(d=>{if(d&&d.success&&typeof d.balance==="number"&&d.balance>0){const localBal=Number(localStorage.getItem("kalam_wallet_balance")||0);const finalB=Math.max(localBal,d.balance);localStorage.setItem("kalam_wallet_balance",String(finalB));M(s=>({...s,balance:finalB}));S(u=>u?{...u,walletBalance:finalB}:null)}}).catch(()=>{})}};'
  ];
  const safeSyncSrv = 'const _syncSrv=()=>{const curU=localStorage.getItem("kalam_auth_user");let uId="",uEm="";try{if(curU){const p=JSON.parse(curU);uId=p.id||"";uEm=p.email||""}}catch{}const targetId=uId||"guest";fetch(`/api/wallet/balance?userId=${encodeURIComponent(targetId)}&email=${encodeURIComponent(uEm)}`).then(r=>r.json()).then(d=>{if(d&&d.success&&typeof d.balance==="number"){const locB=Number(localStorage.getItem("kalam_wallet_balance")||0);const finalB=Math.max(locB,d.balance);if(finalB!==locB||d.balance>locB){try{localStorage.setItem("kalam_wallet_balance",String(finalB))}catch{}}M(s=>s&&s.balance===finalB?s:{...s,balance:finalB});S(u=>u?(u.walletBalance===finalB?u:{...u,walletBalance:finalB}):null)}}).catch(()=>{})};';

  for (const variant of oldSyncSrvVariants) {
    if (code.includes(variant)) {
      code = code.replace(variant, safeSyncSrv);
      changed = true;
      console.log('[9] Safe _syncSrv: Always syncs user-specific balance from server with zero loss or wipe');
      break;
    }
  }

  // 10. In vs (Deposit Handler): Deduplicate by UTR, update localStorage, dispatch event, sync server
  const oldVs = 'vs=(me,Ee)=>{var Xt,Un;const _numDep=Math.max(0,Number(me)||0);const _curBal=Number(w?.walletBalance??pe?.balance??localStorage.getItem("kalam_wallet_balance")??0)||0;';
  const newVs = 'vs=(me,Ee)=>{var Xt,Un;const _numDep=Math.max(0,Number(me)||0);if(_numDep<=0)return;const _uKey=String(Ee||"")+":"+String(_numDep);if(Ee&&window._kalam_dup&&window._kalam_dup[_uKey]){console.log("Blocked duplicate credit for",_uKey);return;}if(!window._kalam_dup)window._kalam_dup={};if(Ee)window._kalam_dup[_uKey]=Date.now();const _curBal=Number(w?.walletBalance??pe?.balance??localStorage.getItem("kalam_wallet_balance")??0)||0;';
  if (code.includes(oldVs)) {
    code = code.replace(oldVs, newVs);
    changed = true;
    console.log('[10] Added UTR deduplication to vs handler');
  }

  // 11. In vs: Ensure /api/wallet/sync response updates state if server balance is greater
  const oldVsSync = 'try{fetch("/api/wallet/sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:w?.id||w?.email||"guest",email:w?.email||"",balance:ke,action:"DEPOSIT",amount:_numDep,reason:"Deposit: ₹"+_numDep+" ("+(Ee||"Auto")+")",utr:Ee||""})}).catch(()=>{})}catch{}';
  const newVsSync = 'try{fetch("/api/wallet/sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:w?.id||w?.email||"guest",email:w?.email||"",balance:ke,action:"DEPOSIT",amount:_numDep,reason:"Deposit: ₹"+_numDep+" ("+(Ee||"Auto")+")",utr:Ee||""})}).then(r=>r.json()).then(d=>{if(d&&d.success&&typeof d.balance==="number"&&d.balance>0){const finalB=Math.max(ke,d.balance);try{localStorage.setItem("kalam_wallet_balance",String(finalB))}catch{}M(sn=>({...sn,balance:finalB}));if(w){S(oldU=>oldU?{...oldU,walletBalance:finalB}:null)}}}).catch(()=>{})}catch{}';
  if (code.includes(oldVsSync)) {
    code = code.replace(oldVsSync, newVsSync);
    changed = true;
    console.log('[11] Ensured vs handler updates balance with /api/wallet/sync response');
  }

  // 12. In vs: Ensure ee($n => ...) adds the user to $n if not already found
  const oldEeInVs = 'ee($n=>$n.map(Cn=>Cn.id===w.id||Cn.email&&w.email&&Cn.email.toLowerCase()===w.email.toLowerCase()?{...Cn,walletBalance:ke,depositedToday:(Number(Cn.depositedToday)||0)+_numDep}:Cn))';
  const newEeInVs = 'ee($n=>{const exists=$n.some(Cn=>Cn.id===w.id||Cn.email&&w.email&&Cn.email.toLowerCase()===w.email.toLowerCase());if(exists){return $n.map(Cn=>Cn.id===w.id||Cn.email&&w.email&&Cn.email.toLowerCase()===w.email.toLowerCase()?{...Cn,walletBalance:ke,depositedToday:(Number(Cn.depositedToday)||0)+_numDep}:Cn)}else{return[...$n,{...w,walletBalance:ke,depositedToday:_numDep}]}})';
  if (code.includes(oldEeInVs)) {
    code = code.replace(oldEeInVs, newEeInVs);
    changed = true;
    console.log('[12] Ensured vs handler adds user to user list if not already present');
  }

  if (changed) {
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Successfully patched:', filePath);
    return true;
  } else {
    console.log('No changes needed (already up-to-date):', filePath);
    return false;
  }
}

// Apply to public and dist assets
const targets = [
  path.join(__dirname, '../public/assets/index-BvHT743v.js'),
  path.join(__dirname, '../dist/assets/index-BvHT743v.js')
];

targets.forEach(t => patchRealtimeWalletSync(t));
