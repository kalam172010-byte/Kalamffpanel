const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist:', filePath);
    return;
  }
  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Update mw default configs: set FamGateway active and live key, AdityaHost inactive
  const oldMw = `mw=[{id:"famgateway-gw",name:"FamGateway (famgateway.in)",isActive:!1,apiKey:"YOUR_API_KEY",apiKey2:"",baseUrl:"https://famgateway.in/api/create-order.php",isLockedUrl:!1,upiId:"kalamffpanel@fampay",merchantName:"KALAM FF PANEL"},{id:"adityahost-gw",name:"AdityaHost UPI Gateway (adityahost.in)",isActive:!0,apiKey:"AH_LIVE_sk_89218a091c4920b78",apiKey2:"",baseUrl:"https://adityahost.in/api/qr.php",isLockedUrl:!1,upiId:"kalamffpanel@fampay",merchantName:"KALAM FF PANEL"}`;
  const newMw = `mw=[{id:"famgateway-gw",name:"FamGateway (famgateway.in)",isActive:!0,apiKey:"fam_a9527c6c2dd4d26ad5223cfc3c4c5fa9289b574e",apiKey2:"",baseUrl:"https://famgateway.in/api/create-order.php",isLockedUrl:!1,upiId:"kalamffpanel@fampay",merchantName:"KALAM FF PANEL"},{id:"adityahost-gw",name:"AdityaHost UPI Gateway (adityahost.in)",isActive:!1,apiKey:"AH_LIVE_sk_89218a091c4920b78",apiKey2:"",baseUrl:"https://adityahost.in/api/qr.php",isLockedUrl:!1,upiId:"kalamffpanel@fampay",merchantName:"KALAM FF PANEL"}`;
  if (code.includes(oldMw)) {
    code = code.replace(oldMw, newMw);
    changed = true;
    console.log('Updated mw default configs in', filePath);
  }

  // 2. Update K state initialization to sanitize stale localStorage
  const oldState = `[K,X]=q.useState(()=>{try{const me=localStorage.getItem("kalam_payment_configs_db");if(me){const Ee=JSON.parse(me);if(Array.isArray(Ee)&&Ee.length>0)return Ee}}catch{}return mw})`;
  const newState = `[K,X]=q.useState(()=>{try{const me=localStorage.getItem("kalam_payment_configs_db");if(me){const Ee=JSON.parse(me);if(Array.isArray(Ee)&&Ee.length>0){const fg=Ee.find(c=>c.id==="famgateway-gw");if(fg&&(!fg.isActive||fg.apiKey==="YOUR_API_KEY")){fg.apiKey="fam_a9527c6c2dd4d26ad5223cfc3c4c5fa9289b574e";fg.isActive=!0;const ah=Ee.find(c=>c.id==="adityahost-gw");if(ah)ah.isActive=!1}return Ee}}}catch{}return mw})`;
  if (code.includes(oldState)) {
    code = code.replace(oldState, newState);
    changed = true;
    console.log('Updated K state initialization in', filePath);
  }

  // 3. Add auto-fetch from /api/settings/payment in startup useEffect
  const oldFteEffect = `q.useEffect(()=>{const me=Fte(Ee=>{Ee&&Ee.length>0&&X(Ee)});return()=>me()},[])`;
  const newFteEffect = `q.useEffect(()=>{try{fetch("/api/settings/payment").then(r=>r.json()).then(d=>{if(d&&d.success&&Array.isArray(d.configs)&&d.configs.length>0){X(d.configs);try{localStorage.setItem("kalam_payment_configs_db",JSON.stringify(d.configs))}catch{}}}).catch(()=>{})}catch{}const me=Fte(Ee=>{Ee&&Ee.length>0&&X(Ee)});return()=>me()},[])`;
  if (code.includes(oldFteEffect)) {
    code = code.replace(oldFteEffect, newFteEffect);
    changed = true;
    console.log('Added /api/settings/payment sync in', filePath);
  }

  // 4. Update V fallback in LQ deposit modal
  const oldV = `V=a.find(tt=>tt.isActive)||a.find(tt=>tt.id==="fampay-gw")||a[0];`;
  const newV = `V=a.find(tt=>tt.isActive)||a.find(tt=>tt.id==="famgateway-gw")||a.find(tt=>tt.id==="fampay-gw")||a[0];`;
  if (code.includes(oldV)) {
    code = code.replace(oldV, newV);
    changed = true;
    console.log('Updated V fallback in', filePath);
  }

  // 5. Update orderId fallback generation in LQ deposit modal
  const oldEt = "const et=st.order.orderId||`FAMPAY_${Date.now()}`,";
  const newEt = "const et=st.order.orderId||(((V==null?void 0:V.id)===\"famgateway-gw\"||((V==null?void 0:V.baseUrl)||\"\").includes(\"famgateway\"))?`FAM_${Date.now()}_${Math.floor(Math.random()*899+100)}`:`FAMPAY_${Date.now()}`),";
  if (code.includes(oldEt)) {
    code = code.replace(oldEt, newEt);
    changed = true;
    console.log('Updated et orderId fallback in', filePath);
  }

  const s1 = "const kt=`FAMPAY_${Date.now()}`,";
  const newS1 = "const kt=(((V==null?void 0:V.id)===\"famgateway-gw\"||((V==null?void 0:V.baseUrl)||\"\").includes(\"famgateway\"))?`FAM_${Date.now()}_${Math.floor(Math.random()*899+100)}`:`FAMPAY_${Date.now()}`),";
  if (code.includes(s1)) {
    code = code.replace(s1, newS1);
    changed = true;
    console.log('Updated kt orderId fallback in', filePath);
  }

  const s2 = "const st=`FAMPAY_${Date.now()}`,";
  const newS2 = "const st=(((V==null?void 0:V.id)===\"famgateway-gw\"||((V==null?void 0:V.baseUrl)||\"\").includes(\"famgateway\"))?`FAM_${Date.now()}_${Math.floor(Math.random()*899+100)}`:`FAMPAY_${Date.now()}`),";
  if (code.includes(s2)) {
    code = code.replace(s2, newS2);
    changed = true;
    console.log('Updated st orderId fallback in', filePath);
  }

  if (changed) {
    try {
      esbuild.transformSync(code, { loader: 'js', sourcefile: 'index.js' });
      fs.writeFileSync(filePath, code, 'utf8');
      console.log('Successfully validated and saved', filePath);
    } catch (err) {
      console.error('Validation error for', filePath, err.message);
      process.exit(1);
    }
  } else {
    console.log('No changes needed or markers not found in', filePath);
  }
}

patchFile(path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js'));
patchFile(path.join(__dirname, '..', 'dist', 'assets', 'index-BvHT743v.js'));
