const fs = require('fs');

const bundlePath = './public/assets/index-BvHT743v.js';
let code = fs.readFileSync(bundlePath, 'utf8');

console.log('Original code length:', code.length);

// 1. Update initial state and useEffect hooks for 10-minute (600s) countdown timer
const oldTimerHookPattern = `[ee,pe]=q.useState(300),
  [M,k]=q.useState(!1),
  [A,L]=q.useState(""),
  [D,O]=q.useState(!1),
  [F,re]=q.useState(0),
  [K,X]=q.useState(!0),
  [te,ue]=q.useState(null),
  Ce=q.useRef(null),
  [ne,W]=q.useState(null),
  R=[10,50,100,250,500,1000],
  V=a.find(tt=>tt.isActive)||a.find(tt=>tt.id==="famgateway-gw")||a.find(tt=>tt.id==="fampay-gw")||a[0];

  Qs.useEffect(()=>{if(n){d("AMOUNT"),W(null),P(null),ue(null)}},[n]);  /* cleared duplicate reset */  Qs.useEffect(()=>{if(n){l(""),P(null),d("AMOUNT")}},[n]);  Qs.useEffect(()=>{
    if(!n||u!=="QR"){pe(300);return}
    const tt=setInterval(()=>{pe(jt=>jt<=1?(clearInterval(tt),0):jt-1)},1e3);
    return()=>clearInterval(tt)
  },[n,u]);

  Qs.useEffect(()=>{
    n&&u==="QR"&&ee===0&&!te&&(ue({status:"EXPIRED",message:"Deposit session timed out (5:00 min). This QR code is no longer valid. Please generate a new QR to proceed."}),w(!1),X(!1),P("Order session expired. Please generate a new QR code."))
  },[n,u,ee,te]);`;

const newTimerHookPattern = `[ee,pe]=q.useState(600),
  [M,k]=q.useState(!1),
  [A,L]=q.useState(""),
  [D,O]=q.useState(!1),
  [F,re]=q.useState(0),
  [K,X]=q.useState(!0),
  [te,ue]=q.useState(null),
  Ce=q.useRef(null),
  [ne,W]=q.useState(null),
  R=[10,50,100,250,500,1000],
  V=a.find(tt=>tt.isActive)||a.find(tt=>tt.id==="famgateway-gw")||a.find(tt=>tt.id==="fampay-gw")||a[0];

  Qs.useEffect(()=>{if(n){d("AMOUNT"),W(null),P(null),ue(null)}},[n]);  /* cleared duplicate reset */  Qs.useEffect(()=>{if(n){l(""),P(null),d("AMOUNT")}},[n]);  Qs.useEffect(()=>{
    if(!n||u!=="QR"){pe(600);return}
    // Calculate remaining seconds if order has expiresAt timestamp
    if(ne&&ne.expiresAt){
      const rem=Math.max(0,Math.floor((ne.expiresAt-Date.now())/1000));
      pe(rem);
    }
    const tt=setInterval(()=>{
      pe(jt=>{
        if(ne&&ne.expiresAt){
          const rem=Math.max(0,Math.floor((ne.expiresAt-Date.now())/1000));
          if(rem<=0){clearInterval(tt);return 0;}
          return rem;
        }
        return jt<=1?(clearInterval(tt),0):jt-1;
      });
    },1e3);
    return()=>clearInterval(tt)
  },[n,u,ne==null?void 0:ne.expiresAt]);

  Qs.useEffect(()=>{
    n&&u==="QR"&&ee===0&&!te&&(ue({status:"EXPIRED",message:"Deposit session timed out (10:00 min). This QR code is no longer valid. Please generate a new QR to proceed."}),w(!1),X(!1),P("Order session expired (10 min limit). Please generate a new QR code."))
  },[n,u,ee,te]);`;

if (!code.includes(oldTimerHookPattern)) {
  console.error('ERROR: oldTimerHookPattern not found!');
  process.exit(1);
}

code = code.replace(oldTimerHookPattern, newTimerHookPattern);
console.log('Successfully updated timer hook pattern to 600s / 10-minute expiry.');

// 2. Update the J handler to reset timer with 600s
const oldJStr = 'pe(300);d("GENERATING");';
const newJStr = 'pe(600);d("GENERATING");';

if (!code.includes(oldJStr)) {
  console.error('ERROR: oldJStr not found!');
  process.exit(1);
}
code = code.replace(oldJStr, newJStr);
console.log('Successfully updated J() function pe(300) -> pe(600).');

// 3. Ensure when order response arrives, pe is set to remaining seconds or 600
const oldWStr = 'W({...gOrd,orderId:realOrderId,amountInPaise:currAmt*100,amountInRupees:currAmt,paymentUrl:gOrd.paymentUrl||gOrd.checkoutUrl||realIntent,checkoutUrl:gOrd.checkoutUrl||gOrd.paymentUrl,upiIntent:realIntent,payeeUpi:realPayee,merchantName:realName,qrUrl:realQr});d("QR");';
const newWStr = 'if(gOrd.expiresAt){const rem=Math.max(0,Math.floor((gOrd.expiresAt-Date.now())/1000));pe(rem);}else{pe(600);}W({...gOrd,orderId:realOrderId,amountInPaise:currAmt*100,amountInRupees:currAmt,paymentUrl:gOrd.paymentUrl||gOrd.checkoutUrl||realIntent,checkoutUrl:gOrd.checkoutUrl||gOrd.paymentUrl,upiIntent:realIntent,payeeUpi:realPayee,merchantName:realName,qrUrl:realQr});d("QR");';

if (!code.includes(oldWStr)) {
  console.error('ERROR: oldWStr not found!');
  process.exit(1);
}
code = code.replace(oldWStr, newWStr);
console.log('Successfully updated order response handler to sync exact expiry timestamp.');

fs.writeFileSync(bundlePath, code, 'utf8');
console.log('Saved patched bundle successfully! New length:', code.length);
