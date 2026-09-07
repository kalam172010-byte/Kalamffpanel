const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

function patchDepositAdminSync(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist:', filePath);
    return false;
  }

  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Fix K initial state: Stop overriding user admin settings (stop forcing famgateway-gw active)
  const oldKState = '[K,X]=q.useState(()=>{try{const me=localStorage.getItem("kalam_payment_configs_db");if(me){const Ee=JSON.parse(me);if(Array.isArray(Ee)&&Ee.length>0){const fg=Ee.find(c=>c.id==="famgateway-gw");if(fg&&(!fg.isActive||fg.apiKey==="YOUR_API_KEY")){fg.apiKey="fam_a9527c6c2dd4d26ad5223cfc3c4c5fa9289b574e";fg.isActive=!0;const ah=Ee.find(c=>c.id==="adityahost-gw");if(ah)ah.isActive=!1}return Ee}}}catch{}return mw})';
  const cleanKState = '[K,X]=q.useState(()=>{try{const me=localStorage.getItem("kalam_payment_configs_db");if(me){const Ee=JSON.parse(me);if(Array.isArray(Ee)&&Ee.length>0)return Ee}}catch{}return mw})';
  if (code.includes(oldKState)) {
    code = code.replace(oldKState, cleanKState);
    changed = true;
    console.log('[1] Fixed K state initialization (removed forced famgateway reset)');
  }

  // 2. Fix startup useEffect to also fetch /api/settings/store so store branding & UPI syncs immediately
  const oldStartupSync = 'q.useEffect(()=>{try{fetch("/api/settings/payment").then(r=>r.json()).then(d=>{if(d&&d.success&&Array.isArray(d.configs)&&d.configs.length>0){X(d.configs);try{localStorage.setItem("kalam_payment_configs_db",JSON.stringify(d.configs))}catch{}}}).catch(()=>{})}catch{}const me=Fte(Ee=>{Ee&&Ee.length>0&&X(Ee)});return()=>me()},[])';
  const newStartupSync = 'q.useEffect(()=>{try{fetch("/api/settings/payment").then(r=>r.json()).then(d=>{if(d&&d.success&&Array.isArray(d.configs)&&d.configs.length>0){X(d.configs);try{localStorage.setItem("kalam_payment_configs_db",JSON.stringify(d.configs))}catch{}}}).catch(()=>{});fetch("/api/settings/store").then(r=>r.json()).then(d=>{if(d&&d.success&&d.settings&&typeof d.settings==="object"){ue(d.settings);try{localStorage.setItem("kalam_store_settings_db",JSON.stringify(d.settings))}catch{}}}).catch(()=>{})}catch{}const me=Fte(Ee=>{Ee&&Ee.length>0&&X(Ee)});return()=>me()},[])';
  if (code.includes(oldStartupSync)) {
    code = code.replace(oldStartupSync, newStartupSync);
    changed = true;
    console.log('[2] Added /api/settings/store to startup sync useEffect');
  }

  // 3. Remove the premature QR jump effect in LQ that defaulted to 8056317218@fam and FAM_
  const oldOpenEffect = 'Qs.useEffect(()=>{if(n){const ia=(s&&s.minDeposit)?Math.max(10,s.minDeposit):100;l(ia);P(null);const mu=(s==null?void 0:s.upiManualId)||(s==null?void 0:s.upiId)||(V==null?void 0:V.merchantUpi)||"8056317218@fam";const oi="FAM_"+Date.now().toString().slice(-6);const it="upi://pay?pa="+mu+"&pn="+encodeURIComponent((s==null?void 0:s.upiMerchantName)||"KALAM FF STORE")+"&tr="+oi+"&am="+ia+"&cu=INR";W({orderId:oi,amountInPaise:ia*100,amountInRupees:ia,paymentUrl:it,upiIntent:it,payeeUpi:mu,qrUrl:"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data="+encodeURIComponent(it)});d("QR")}},[n]);';
  const cleanOpenEffect = 'Qs.useEffect(()=>{if(n){d("AMOUNT"),W(null),P(null),ue(null)}},[n]);';
  if (code.includes(oldOpenEffect)) {
    code = code.replace(oldOpenEffect, cleanOpenEffect);
    changed = true;
    console.log('[3] Fixed modal open effect in LQ: starts at clean AMOUNT screen with dynamic admin settings');
  }

  // 4. Fix J() function inside LQ so it shows GENERATING while calling /api/create-order and receives the real gateway order ID (e.g. fg_...), real QR URL, real checkout URL, and real UPI intent.
  // CRITICAL: Increased timeout to 20000ms. If upstream fails, do NOT generate a fake FAM_ order ID; report error cleanly.
  const jStart = code.indexOf("const J=()=>{const currAmt=Number(i)||((s==null?void 0:s.minDeposit)||10);");
  const jEnd = jStart !== -1 ? code.indexOf("const xe=async tt=>{", jStart) : -1;
  if (jStart !== -1 && jEnd !== -1) {
    const newJ = 'const J=()=>{const currAmt=Number(i)||((s==null?void 0:s.minDeposit)||10);if(!currAmt||currAmt<((s==null?void 0:s.minDeposit)||1)){P("Please enter a valid deposit amount (minimum ₹"+((s==null?void 0:s.minDeposit)||1)+").");return;}l(currAmt);P(null);ue(null);pe(300);d("GENERATING");const mUpi=(V&&(V.upiId||V.merchantUpi))||(s&&(s.upiManualId||s.upiId||s.merchantUpi))||"kalamffpanel@fampay";const mName=(V&&V.merchantName)||(s&&(s.upiMerchantName||s.shopName))||"KALAM FF PANEL";const gwType=((V==null?void 0:V.baseUrl)||"").includes("famgateway")?"famgateway":((V==null?void 0:V.baseUrl)||"").includes("aditya")?"adityahost":((V==null?void 0:V.baseUrl)||"").includes("zap")?"zapupi":"freepanel";Gr("/api/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:currAmt,redirect_url:window.location.origin+"/success",apiKey:V==null?void 0:V.apiKey,gatewayUrl:(V==null?void 0:V.baseUrl)||(V==null?void 0:V.gatewayUrl),merchantUpi:mUpi,gateway:gwType})},20000).then(st=>{if(st!=null&&st.data&&st.data.order){const gOrd=st.data.order;const realOrderId=gOrd.orderId;const realPayee=gOrd.payeeUpi||gOrd.upi_id||mUpi;const realName=gOrd.merchantName||mName;const realIntent=gOrd.upiIntent||`upi://pay?pa=${encodeURIComponent(realPayee)}&pn=${encodeURIComponent(realName)}&tr=${encodeURIComponent(realOrderId)}&tn=${encodeURIComponent("Payment for Order "+realOrderId)}&am=${currAmt}&cu=INR`;const realQr=(s!=null&&s.customQrUrl)?s.customQrUrl:(gOrd.qrUrl||("https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data="+encodeURIComponent(realIntent)));W({...gOrd,orderId:realOrderId,amountInPaise:currAmt*100,amountInRupees:currAmt,paymentUrl:gOrd.paymentUrl||gOrd.checkoutUrl||realIntent,checkoutUrl:gOrd.checkoutUrl||gOrd.paymentUrl,upiIntent:realIntent,payeeUpi:realPayee,merchantName:realName,qrUrl:realQr});d("QR");}else{const errMsg=(st&&st.data&&st.data.error)||(st&&st.error)||"Failed to generate payment order from gateway. Check API key in Admin.";P(errMsg);d("AMOUNT");}}).catch(err=>{P((err&&err.message)||"Connection to payment gateway failed. Please check internet or gateway API key in Admin.");d("AMOUNT");});};  ';
    code = code.slice(0, jStart) + newJ + code.slice(jEnd);
    changed = true;
    console.log('[4] Fixed J() in LQ to use 20s timeout and strict gateway order ID validation');
  }

  // 5. Fix dt, we, ie in LQ so it dynamically checks V.upiId, V.merchantName, s.upiManualId, and s.shopName
  const weStart = code.indexOf('const we=(ne==null?void 0:ne.payeeUpi)||(s==null?void 0:s.upiManualId)');
  const dtEnd = weStart !== -1 ? code.indexOf(';  return r.jsx(is,{children:n&&', weStart) : -1;
  if (weStart !== -1 && dtEnd !== -1) {
    const newDtBlock = 'const we=(ne&&ne.payeeUpi)||(V&&(V.upiId||V.merchantUpi))||(s&&(s.upiManualId||s.upiId||s.merchantUpi))||"kalamffpanel@fampay",  ve=(ne==null?void 0:ne.amountInRupees)??(ne==null?void 0:ne.amount)??(Number(i)||10),  Me=()=>{const toCopy=(ne==null?void 0:ne.orderId)||nt;navigator.clipboard.writeText(toCopy);p(!0);setTimeout(()=>p(!1),2e3)},  Fe=()=>{const tt=ve.toString();navigator.clipboard.writeText(tt),b(!0),setTimeout(()=>b(!1),2e3)},  ze=()=>{d("AMOUNT"),W(null),L(""),P(null),ue(null),e()},  nt=(ne==null?void 0:ne.orderId)||"ORD_"+Date.now().toString().slice(-6),  ie=Qs.useMemo(()=>ne!=null&&ne.upiIntent&&ne.upiIntent.includes("?")?ne.upiIntent.split("?")[1]:`pa=${encodeURIComponent(we)}&pn=${encodeURIComponent((V&&V.merchantName)||(s&&s.upiMerchantName)||(s&&s.shopName)||"KALAM FF PANEL")}&tr=${encodeURIComponent(nt)}&tn=${encodeURIComponent(`Payment for Order ${nt}`)}&am=${ve}&cu=INR`,[ne,we,ve,nt,s,V]),  dt=(ne==null?void 0:ne.upiIntent)||`upi://pay?${ie}`,  Pt=`tez://upi/pay?${ie}`,  Ut=`phonepe://pay?${ie}`,  Xe=`paytmmp://pay?${ie}`,  yt=`upi://pay?${ie}`';
    code = code.slice(0, weStart) + newDtBlock + code.slice(dtEnd);
    changed = true;
    console.log('[5] Fixed dt, we, and ie in LQ to use active admin settings');
  }

  // 6. Fix Admin panel payment gateway component state defaults so it checks u.upiId
  const oldAdminForm = '_]=q.useState((u==null?void 0:u.merchantUpi)||(t==null?void 0:t.upiManualId)||"8056317218@fam")';
  const newAdminForm = '_]=q.useState((u==null?void 0:u.upiId)||(u==null?void 0:u.merchantUpi)||(t==null?void 0:t.upiManualId)||(t==null?void 0:t.upiId)||"kalamffpanel@fampay")';
  if (code.includes(oldAdminForm)) {
    code = code.replace(oldAdminForm, newAdminForm);
    changed = true;
    console.log('[6] Fixed Admin Panel gateway form initial state to check u.upiId');
  }

  // 7. Fix Admin panel store settings state defaults
  const oldStoreForm = '[te,ue]=q.useState((t==null?void 0:t.upiManualId)||(t==null?void 0:t.upiId)||"8056317218@fam")';
  const newStoreForm = '[te,ue]=q.useState((t==null?void 0:t.upiManualId)||(t==null?void 0:t.upiId)||"kalamffpanel@fampay")';
  if (code.includes(oldStoreForm)) {
    code = code.replace(oldStoreForm, newStoreForm);
    changed = true;
    console.log('[7] Fixed Admin Store Settings form initial state');
  }

  // 8. Fix Admin panel save handlers to save upiId, merchantUpi, and merchantName
  const oldSaveGateway = 'e({...Jn,apiKey:He,baseUrl:ht,merchantUpi:j||"8056317218@fam",isActive:!0})';
  const newSaveGateway = 'e({...Jn,apiKey:He,baseUrl:ht,upiId:j||"kalamffpanel@fampay",merchantUpi:j||"kalamffpanel@fampay",merchantName:Ce||"KALAM FF PANEL",isActive:!0})';
  if (code.includes(oldSaveGateway)) {
    code = code.replace(oldSaveGateway, newSaveGateway);
    changed = true;
    console.log('[8] Fixed Admin Payment Gateway save handler');
  }

  // 9. Fix `la` in App component: When saving payment configs in Admin Panel, POST to /api/settings/payment on the server
  const oldLa = 'la=me=>{X(Ee=>{const Ke=Ee.some(Je=>Je.id===me.id)?Ee.map(Je=>Je.id===me.id?{...Je,...me}:me.isActive?{...Je,isActive:!1}:Je):[{...me},...Ee.map(Je=>me.isActive?{...Je,isActive:!1}:Je)];try{localStorage.setItem("kalam_payment_configs_db",JSON.stringify(Ke))}catch{}return Ute(Ke).catch(console.warn),Ke}),Se(`${me.name} configuration saved successfully.`)}';
  const newLa = 'la=me=>{X(Ee=>{const Ke=Ee.some(Je=>Je.id===me.id)?Ee.map(Je=>Je.id===me.id?{...Je,...me}:me.isActive?{...Je,isActive:!1}:Je):[{...me},...Ee.map(Je=>me.isActive?{...Je,isActive:!1}:Je)];try{localStorage.setItem("kalam_payment_configs_db",JSON.stringify(Ke))}catch{}try{fetch("/api/settings/payment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({configs:Ke})})}catch{}return Ute(Ke).catch(console.warn),Ke}),Se(`${me.name} configuration saved successfully.`)}';
  if (code.includes(oldLa)) {
    code = code.replace(oldLa, newLa);
    changed = true;
    console.log('[9] Added /api/settings/payment POST to la in App component');
  }

  // 10. Fix `Ja` in App component: When saving store settings in Admin Panel, POST to /api/settings/store on the server
  const oldJa = 'Ja=me=>{ue(me);try{localStorage.setItem("kalam_store_settings_db",JSON.stringify(me))}catch{}Ote(me).catch(console.warn),Se("Storefront branding and settings saved successfully!")}';
  const newJa = 'Ja=me=>{ue(me);try{localStorage.setItem("kalam_store_settings_db",JSON.stringify(me))}catch{}try{fetch("/api/settings/store",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({settings:me})})}catch{}Ote(me).catch(console.warn),Se("Storefront branding and settings saved successfully!")}';
  if (code.includes(oldJa)) {
    code = code.replace(oldJa, newJa);
    changed = true;
    console.log('[10] Added /api/settings/store POST to Ja in App component');
  }

  // 11. Add official Payment Gateway checkout URL button in LQ step QR
  const saveQrRegex = /r\.jsx\(Mo,\{className:"w-3\.5 h-3\.5 text-white"\}\),\s*r\.jsx\("span",\{children:M\?"Downloading\.\.\.":"Save QR to Gallery"\}\)\s*\]\s*\}\)\s*\]\}\),/;
  if (saveQrRegex.test(code) && !code.includes('⚡ Open Official Payment Gateway Page')) {
    code = code.replace(saveQrRegex, 'r.jsx(Mo,{className:"w-3.5 h-3.5 text-white"}),r.jsx("span",{children:M?"Downloading...":"Save QR to Gallery"})]}),(ne&&ne.checkoutUrl)&&r.jsxs("a",{href:ne.checkoutUrl,target:"_blank",rel:"noopener noreferrer",className:"w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer transition-all border border-emerald-400/40 mt-2",children:[r.jsx("span",{children:"⚡ Open Official Payment Gateway Page"}),r.jsx(Cr,{className:"w-3.5 h-3.5 text-black"})]})]}),');
    changed = true;
    console.log('[11] Added official gateway checkout URL button to LQ');
  }

  // 12. Only show the manual UTR form if explicitly enabled or in DIRECT_UPI_QR mode
  const oldUtrFormCondition = '(s==null?void 0:s.enableUtrInput)!==!1&&r.jsxs("form",{onSubmit:xe';
  const newUtrFormCondition = 'Boolean((s==null?void 0:s.enableUtrInput)===!0||(s==null?void 0:s.paymentGatewayMode)==="DIRECT_UPI_QR"||(s==null?void 0:s.paymentGatewayMode)==="BOTH")&&r.jsxs("form",{onSubmit:xe';
  if (code.includes(oldUtrFormCondition)) {
    code = code.replace(oldUtrFormCondition, newUtrFormCondition);
    changed = true;
    console.log('[12] Fixed UTR form condition: hidden by default in automated gateway mode');
  }

  // 13. Replace any lingering "8056317218@fam" fallbacks with "kalamffpanel@fampay"
  if (code.includes('"8056317218@fam"')) {
    code = code.replaceAll('"8056317218@fam"', '"kalamffpanel@fampay"');
    changed = true;
    console.log('[13] Replaced lingering "8056317218@fam" references');
  }

  if (changed) {
    try {
      esbuild.transformSync(code, { loader: 'js', sourcefile: path.basename(filePath) });
      fs.writeFileSync(filePath, code, 'utf8');
      console.log('Successfully validated and saved:', filePath);
      return true;
    } catch (err) {
      console.error('Validation failed for', filePath, err.message);
      process.exit(1);
    }
  } else {
    console.log('No changes needed in', filePath);
    return true;
  }
}

// Find all index-*.js files dynamically in public/assets and dist/assets
function findAndPatchAllAssets() {
  const dirs = [
    path.join(__dirname, '..', 'public', 'assets'),
    path.join(__dirname, '..', 'dist', 'assets')
  ];

  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.startsWith('index-') && file.endsWith('.js') && fs.statSync(path.join(dir, file)).size > 500000) {
          console.log(`[Patch Target Found]: ${path.join(dir, file)}`);
          patchDepositAdminSync(path.join(dir, file));
        }
      }
    }
  }
}

findAndPatchAllAssets();
