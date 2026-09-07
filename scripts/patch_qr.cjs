const fs = require("fs");

const files = ["public/assets/index-BvHT743v.js", "dist/assets/index-BvHT743v.js"];

for (const filePath of files) {
  if (!fs.existsSync(filePath)) {
    console.log("File not found:", filePath);
    continue;
  }
  let content = fs.readFileSync(filePath, "utf-8");
  console.log("Patching", filePath, "length:", content.length);

  // 1. Patch dt and amounts
  const oldDt = 'const we=(ne==null?void 0:ne.payeeUpi)||"8056317218@fam",  ve=(ne==null?void 0:ne.amountInRupees)??(ne==null?void 0:ne.amount)??i,  Me=()=>{ne!=null&&ne.orderId&&(navigator.clipboard.writeText(ne.orderId),p(!0),setTimeout(()=>p(!1),2e3))},  Fe=()=>{const tt=ve.toString();navigator.clipboard.writeText(tt),b(!0),setTimeout(()=>b(!1),2e3)},  ze=()=>{d("AMOUNT"),W(null),L(""),P(null),ue(null),e()},  nt=(ne==null?void 0:ne.orderId)||"FAMPAY",  ie=Qs.useMemo(()=>ne!=null&&ne.upiIntent&&ne.upiIntent.includes("?")?ne.upiIntent.split("?")[1]:`pa=${encodeURIComponent(we)}&pn=FamPay&tr=${encodeURIComponent(nt)}&tn=${encodeURIComponent(`Payment for Order ${nt}`)}&am=${ve}&cu=INR`,[ne,we,ve,nt]),  dt=(ne==null?void 0:ne.upiIntent)||`upi://pay?${ie}`;';
  
  const newDt = 'const we=(ne==null?void 0:ne.payeeUpi)||(s==null?void 0:s.upiManualId)||(s==null?void 0:s.upiId)||"8056317218@fam",  ve=(ne==null?void 0:ne.amountInRupees)??(ne==null?void 0:ne.amount)??(Number(i)||100),  Me=()=>{const toCopy=(ne==null?void 0:ne.orderId)||nt;navigator.clipboard.writeText(toCopy);p(!0);setTimeout(()=>p(!1),2e3)},  Fe=()=>{const tt=ve.toString();navigator.clipboard.writeText(tt),b(!0),setTimeout(()=>b(!1),2e3)},  ze=()=>{d("AMOUNT"),W(null),L(""),P(null),ue(null),e()},  nt=(ne==null?void 0:ne.orderId)||"FAM_"+Date.now().toString().slice(-6),  ie=Qs.useMemo(()=>ne!=null&&ne.upiIntent&&ne.upiIntent.includes("?")?ne.upiIntent.split("?")[1]:`pa=${encodeURIComponent(we)}&pn=${encodeURIComponent((s==null?void 0:s.upiMerchantName)||"KALAM FF STORE")}&tr=${encodeURIComponent(nt)}&tn=${encodeURIComponent(`Payment for Order ${nt}`)}&am=${ve}&cu=INR`,[ne,we,ve,nt,s]),  dt=(ne==null?void 0:ne.upiIntent)||`upi://pay?${ie}`;';

  if (content.includes(oldDt)) {
    content = content.replace(oldDt, newDt);
    console.log("Successfully replaced dt definition in", filePath);
  } else {
    console.log("Warning: oldDt not found in", filePath);
  }

  // 2. Patch QR Box to render high-reliability crisp <img> directly
  const oldQrBox = '(s!=null&&s.customQrUrl)?r.jsx("img",{src:s.customQrUrl,alt:"UPI QR Code",className:"w-40 h-40 object-contain mx-auto rounded-lg"}):r.jsxs(r.Fragment,{children:[r.jsx(rv,{value:dt,size:160,level:"M",includeMargin:!1,className:"mx-auto block"}),r.jsx("img",{src:(ne==null?void 0:ne.qrUrl)||"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data="+encodeURIComponent(dt),alt:"UPI QR Code",className:"w-40 h-40 object-contain mx-auto",onError:tt=>{tt.currentTarget.src="https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl="+encodeURIComponent(dt)},style:{display:typeof window!=="undefined"&&window.document?"none":"block"}})]})';

  const newQrBox = 'r.jsx("img",{src:(s!=null&&s.customQrUrl)||(ne==null?void 0:ne.qrUrl)||"https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data="+encodeURIComponent(dt),alt:"UPI QR Code",className:"w-44 h-44 object-contain mx-auto rounded-xl block bg-white shadow-sm",onError:tt=>{tt.currentTarget.src="https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl="+encodeURIComponent(dt)}})';

  if (content.includes(oldQrBox)) {
    content = content.replace(oldQrBox, newQrBox);
    console.log("Successfully replaced QR Box in", filePath);
  } else {
    console.log("Warning: oldQrBox not found in", filePath);
  }

  // 3. Patch J function for instant generation without blocking
  const jStart = content.indexOf("const J=async()=>{");
  const jEnd = content.indexOf("const xe=async tt=>{", jStart);
  if (jStart !== -1 && jEnd !== -1) {
    const oldJ = content.slice(jStart, jEnd);
    const newJ = 'const J=()=>{const currAmt=Number(i)||((s==null?void 0:s.minDeposit)||100);if(!currAmt||currAmt<((s==null?void 0:s.minDeposit)||1)){P("Please enter a valid deposit amount (minimum ₹"+((s==null?void 0:s.minDeposit)||1)+").");return;}l(currAmt);P(null);ue(null);pe(300);const mUpi=(s==null?void 0:s.upiManualId)||(s==null?void 0:s.upiId)||(V==null?void 0:V.merchantUpi)||"8056317218@fam";const mName=(s==null?void 0:s.upiMerchantName)||"KALAM FF STORE";const ordId="FAM_"+Date.now().toString().slice(-6);const upiUrl="upi://pay?pa="+mUpi+"&pn="+encodeURIComponent(mName)+"&tr="+ordId+"&am="+currAmt+"&cu=INR";const qrImg=(s==null?void 0:s.customQrUrl)||("https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data="+encodeURIComponent(upiUrl));W({orderId:ordId,amountInPaise:currAmt*100,amountInRupees:currAmt,paymentUrl:upiUrl,upiIntent:upiUrl,payeeUpi:mUpi,qrUrl:qrImg});d("QR");Gr("/api/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:currAmt,redirect_url:window.location.origin+"/success",apiKey:V==null?void 0:V.apiKey,gatewayUrl:(V==null?void 0:V.baseUrl)||(V==null?void 0:V.gatewayUrl),merchantUpi:mUpi,gateway:(V==null?void 0:V.baseUrl)!=null&&V.baseUrl.includes("famgateway")?"famgateway":"adityahost"})},3000).then(st=>{if(st!=null&&st.data&&st.data.order){const gOrd=st.data.order;W(prev=>({...prev,...gOrd,orderId:gOrd.orderId||prev.orderId,qrUrl:gOrd.qrUrl||prev.qrUrl,upiIntent:gOrd.upiIntent||prev.upiIntent}));}}).catch(()=>{});};  ';
    content = content.slice(0, jStart) + newJ + content.slice(jEnd);
    console.log("Successfully replaced J function in", filePath);
  } else {
    console.log("Warning: jStart or jEnd not found in", filePath);
  }

  fs.writeFileSync(filePath, content, "utf-8");
  console.log("Updated", filePath, "new length:", content.length);
}
