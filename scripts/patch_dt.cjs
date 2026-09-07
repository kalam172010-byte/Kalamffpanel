const fs = require("fs");

const files = ["public/assets/index-BvHT743v.js", "dist/assets/index-BvHT743v.js"];

for (const filePath of files) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, "utf-8");

  const startMarker = 'const we=(ne==null?void 0:ne.payeeUpi)||"8056317218@fam"';
  const endMarker = 'dt=(ne==null?void 0:ne.upiIntent)||`upi://pay?${ie}`';

  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker, start);

  if (start !== -1 && end !== -1) {
    const oldSegment = content.slice(start, end + endMarker.length);
    const newSegment = 'const we=(ne==null?void 0:ne.payeeUpi)||(s==null?void 0:s.upiManualId)||(s==null?void 0:s.upiId)||"8056317218@fam",  ve=(ne==null?void 0:ne.amountInRupees)??(ne==null?void 0:ne.amount)??(Number(i)||100),  Me=()=>{const toCopy=(ne==null?void 0:ne.orderId)||nt;navigator.clipboard.writeText(toCopy);p(!0);setTimeout(()=>p(!1),2e3)},  Fe=()=>{const tt=ve.toString();navigator.clipboard.writeText(tt),b(!0),setTimeout(()=>b(!1),2e3)},  ze=()=>{d("AMOUNT"),W(null),L(""),P(null),ue(null),e()},  nt=(ne==null?void 0:ne.orderId)||"FAM_"+Date.now().toString().slice(-6),  ie=Qs.useMemo(()=>ne!=null&&ne.upiIntent&&ne.upiIntent.includes("?")?ne.upiIntent.split("?")[1]:`pa=${encodeURIComponent(we)}&pn=${encodeURIComponent((s==null?void 0:s.upiMerchantName)||"KALAM FF STORE")}&tr=${encodeURIComponent(nt)}&tn=${encodeURIComponent(`Payment for Order ${nt}`)}&am=${ve}&cu=INR`,[ne,we,ve,nt,s]),  dt=(ne==null?void 0:ne.upiIntent)||`upi://pay?${ie}`';
    content = content.slice(0, start) + newSegment + content.slice(end + endMarker.length);
    fs.writeFileSync(filePath, content, "utf-8");
    console.log("Successfully patched dt segment in", filePath);
  } else {
    console.log("Segment markers not found in", filePath);
  }
}
