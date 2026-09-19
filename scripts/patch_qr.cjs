const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const dirs = [
  path.join(__dirname, "..", "public", "assets"),
  path.join(__dirname, "..", "dist", "assets")
];

const filesToPatch = [];
for (const dir of dirs) {
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      if (file.startsWith("index-") && file.endsWith(".js") && fs.statSync(path.join(dir, file)).size > 500000) {
        filesToPatch.push(path.join(dir, file));
      }
    }
  }
}

for (const filePath of filesToPatch) {
  let content = fs.readFileSync(filePath, "utf-8");
  console.log("Patching QR in", filePath, "length:", content.length);
  let changed = false;

  // 1. Patch we, ie, dt definition so it dynamically uses active gateway or store settings + automatically preloads QR image in browser memory
  const weIdx = content.indexOf("const we=");
  if (weIdx !== -1) {
    const endPt = content.indexOf(",  Pt=`tez://upi/pay?", weIdx);
    if (endPt !== -1) {
      const dynamicDt = 'const we=(ne&&ne.payeeUpi)||(V&&(V.upiId||V.merchantUpi))||(s&&(s.upiManualId||s.upiId||s.merchantUpi))||"kalamffpanel@fampay",  ve=(ne==null?void 0:ne.amountInRupees)??(ne==null?void 0:ne.amount)??(Number(i)||10),  Me=()=>{const toCopy=(ne==null?void 0:ne.orderId)||nt;navigator.clipboard.writeText(toCopy);p(!0);setTimeout(()=>p(!1),2e3)},  Fe=()=>{const tt=ve.toString();navigator.clipboard.writeText(tt),b(!0),setTimeout(()=>b(!1),2e3)},  ze=()=>{d("AMOUNT"),W(null),L(""),P(null),ue(null),e()},  nt=(ne==null?void 0:ne.orderId)||"ORD_"+Date.now().toString().slice(-6),  ie=Qs.useMemo(()=>ne!=null&&ne.upiIntent&&ne.upiIntent.includes("?")?ne.upiIntent.split("?")[1]:`pa=${encodeURIComponent(we)}&pn=${encodeURIComponent((V&&V.merchantName)||(s&&s.upiMerchantName)||(s&&s.shopName)||"KALAM FF PANEL")}&tr=${encodeURIComponent(nt)}&tn=${encodeURIComponent(`Payment for Order ${nt}`)}&am=${ve}&cu=INR`,[ne,we,ve,nt,s,V]),  dt=(ne==null?void 0:ne.upiIntent)||`upi://pay?${ie}`; Qs.useEffect(()=>{try{const qrSrc=(s!=null&&s.customQrUrl)||(ne==null?void 0:ne.qrUrl)||"https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data="+encodeURIComponent(dt);const qrP=new Image();qrP.decoding="sync";qrP.src=qrSrc;if(typeof document!=="undefined"){const lk=document.createElement("link");lk.rel="preload";lk.as="image";lk.href=qrSrc;document.head.appendChild(lk)}}catch{}},[dt,ne,s]);';
      content = content.slice(0, weIdx) + dynamicDt + content.slice(endPt);
      changed = true;
      console.log("Successfully replaced dt, we, ie block with preloading hook in", filePath);
    }
  }

  // 2. Patch QR Box to render high-reliability crisp <img> directly with eager loading and zero wait time
  const oldQrBox = '(s!=null&&s.customQrUrl)?r.jsx("img",{src:s.customQrUrl,alt:"UPI QR Code",className:"w-40 h-40 object-contain mx-auto rounded-lg"}):r.jsxs(r.Fragment,{children:[r.jsx(rv,{value:dt,size:160,level:"M",includeMargin:!1,className:"mx-auto block"}),r.jsx("img",{src:(ne==null?void 0:ne.qrUrl)||"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data="+encodeURIComponent(dt),alt:"UPI QR Code",className:"w-40 h-40 object-contain mx-auto",onError:tt=>{tt.currentTarget.src="https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl="+encodeURIComponent(dt)},style:{display:typeof window!=="undefined"&&window.document?"none":"block"}})]})';
  const existingNewQrBox = 'r.jsx("img",{src:(s!=null&&s.customQrUrl)||(ne==null?void 0:ne.qrUrl)||"https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data="+encodeURIComponent(dt),alt:"UPI QR Code",className:"w-44 h-44 object-contain mx-auto rounded-xl block bg-white shadow-sm",onError:tt=>{tt.currentTarget.src="https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl="+encodeURIComponent(dt)}})';
  const optimizedQrBox = 'r.jsx("img",{src:(s!=null&&s.customQrUrl)||(ne==null?void 0:ne.qrUrl)||"https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data="+encodeURIComponent(dt),alt:"UPI QR Code",loading:"eager",decoding:"sync",className:"w-44 h-44 object-contain mx-auto rounded-xl block bg-white shadow-sm",onError:tt=>{tt.currentTarget.src="https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl="+encodeURIComponent(dt)}})';

  if (content.includes(oldQrBox)) {
    content = content.replace(oldQrBox, optimizedQrBox);
    changed = true;
    console.log("Successfully replaced oldQrBox in", filePath);
  } else if (content.includes(existingNewQrBox)) {
    content = content.replace(existingNewQrBox, optimizedQrBox);
    changed = true;
    console.log("Successfully upgraded existingNewQrBox with eager loading in", filePath);
  }

  if (changed) {
    try {
      esbuild.transformSync(content, { loader: "js" });
      fs.writeFileSync(filePath, content, "utf-8");
      console.log("Updated", filePath, "new length:", content.length);
    } catch (err) {
      console.error("Syntax check failed on", filePath, err.message);
    }
  }
}
