const fs = require('fs');
const path = require('path');

function patchRealtimeKeyPurchaseBalance(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return false;
  }

  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Fix global displayed balance `lo` calculation
  const oldLoPatterns = [
    'lo=Number(w!=null&&typeof w.walletBalance=="number"?w.walletBalance:typeof pe.balance=="number"?pe.balance:0)||0;',
    'lo=Number(w!=null&&typeof w.walletBalance=="number"?w.walletBalance:typeof pe.balance=="number"?pe.balance:0);'
  ];
  const newLo = 'lo=Math.max(Number(w?.walletBalance)||0,Number(pe?.balance)||0,Number(localStorage.getItem("kalam_wallet_balance"))||0);';
  
  for (const oldLo of oldLoPatterns) {
    if (code.includes(oldLo)) {
      code = code.replace(oldLo, newLo);
      changed = true;
      console.log('[1] Fixed global displayed balance `lo` calculation to always use real-time maximum balance');
      break;
    }
  }

  // 2. Fix key purchase balance verification in `rs`
  // Make sure `rs` checks real-time server balance if local balance is below required amount
  const oldRsBalCheck = 'const sn=Math.max(0,Math.round((Xt-Un)*100)/100);if(Je<sn){Se(`Insufficient balance! You need ₹${(sn-Je).toFixed(2)} more. Opening Deposit...`),dt(!0);return}';
  const newRsBalCheck = 'const sn=Math.max(0,Math.round((Xt-Un)*100)/100);let _realB=Math.max(Number(Je)||0,Number(w?.walletBalance)||0,Number(pe?.balance)||0,Number(localStorage.getItem("kalam_wallet_balance"))||0);if(_realB<sn){try{const _curAuth=localStorage.getItem("kalam_auth_user");let _uId=w?.id||"",_uEm=w?.email||"";if(!_uId&&!_uEm&&_curAuth){try{const _p=JSON.parse(_curAuth);_uId=_p.id||"";_uEm=_p.email||""}catch{}}const _targetId=_uId||_uEm||"guest";const _rRes=await fetch(`/api/wallet/balance?userId=${encodeURIComponent(_targetId)}&email=${encodeURIComponent(_uEm)}`);if(_rRes.ok){const _rData=await _rRes.json();if(_rData&&_rData.success&&typeof _rData.balance==="number"){_realB=Math.max(_realB,_rData.balance);if(_realB>=sn){try{localStorage.setItem("kalam_wallet_balance",String(_realB))}catch{}M(_s=>({..._s,balance:_realB}));if(w){S(_u=>_u?{..._u,walletBalance:_realB}:null)}try{window.dispatchEvent(new CustomEvent("kalam_wallet_updated",{detail:{balance:_realB}}))}catch{}}}}}catch{}}if(_realB<sn){Se(`Insufficient balance! You need ₹${(sn-_realB).toFixed(2)} more. Opening Deposit...`),dt(!0);return}';

  if (code.includes(oldRsBalCheck)) {
    code = code.replace(oldRsBalCheck, newRsBalCheck);
    changed = true;
    console.log('[2] Enhanced `rs` with asynchronous real-time server balance validation before purchase');
  }

  // 3. In `er` (Website Admin Add/Deduct Balance):
  // Ensure changes immediately call /api/wallet/sync and /api/admin/telegram/users/add-balance (for TG users)
  const oldErSyncPattern = 'er=(me,Ee,ke,Ke)=>{if(!Ee||Ee<=0){Se("Please enter a valid amount greater than 0");return}const Je=me.trim().toLowerCase();let Ht=Je.includes("@")?Je.split("@")[0].toUpperCase():"User";';
  const newErSyncPattern = 'er=(me,Ee,ke,Ke)=>{if(!Ee||Ee<=0){Se("Please enter a valid amount greater than 0");return}const Je=me.trim().toLowerCase();let Ht=Je.includes("@")?Je.split("@")[0].toUpperCase():"User";try{fetch("/api/wallet/sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:Je,email:Je.includes("@")?Je:undefined,action:ke==="ADD"?"DEPOSIT":"DEDUCT",amount:Ee,reason:Ke||`Admin Manual ${ke==="ADD"?"Credit":"Deduct"}`})}).then(r=>r.json()).then(d=>{if(d&&d.success&&typeof d.balance==="number"){const _tgt=d.balance;const _curU=localStorage.getItem("kalam_auth_user");let _uId="",_uEm="";try{if(_curU){const _p=JSON.parse(_curU);_uId=(_p.id||"").toLowerCase();_uEm=(_p.email||"").toLowerCase()}}catch{}if(Je===_uId||Je===_uEm||Je==="guest"){try{localStorage.setItem("kalam_wallet_balance",String(_tgt))}catch{}M(s=>({...s,balance:_tgt}));S(u=>u?{...u,walletBalance:_tgt}:null);try{window.dispatchEvent(new CustomEvent("kalam_wallet_updated",{detail:{balance:_tgt}}))}catch{}}}}).catch(()=>{});if(!Je.includes("@")||Je.startsWith("tg_")){fetch("/api/admin/telegram/users/add-balance",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chatId:Je.replace(/^tg_/,""),amount:ke==="ADD"?Ee:-Ee})}).catch(()=>{})}}catch{}';

  if (code.includes(oldErSyncPattern)) {
    code = code.replace(oldErSyncPattern, newErSyncPattern);
    changed = true;
    console.log('[3] Enhanced Admin `er` handler to immediately sync balance to server and notify Telegram bot in real time');
  }

  // 4. In `rs`: Ensure balance deduction uses real-time updated balance and dispatches updates
  const oldRsDeduct = 'const _curBalD=Number(w?.walletBalance??pe?.balance??localStorage.getItem("kalam_wallet_balance")??0)||0;';
  const newRsDeduct = 'const _curBalD=Math.max(Number(Je)||0,Number(w?.walletBalance)||0,Number(pe?.balance)||0,Number(localStorage.getItem("kalam_wallet_balance"))||0);';
  if (code.includes(oldRsDeduct)) {
    code = code.replace(oldRsDeduct, newRsDeduct);
    changed = true;
    console.log('[4] Updated `rs` deduction calculation to use highest authoritative balance');
  }

  if (changed) {
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Successfully applied patches to:', filePath);
    return true;
  } else {
    console.log('No modifications needed for:', filePath);
    return false;
  }
}

const targets = [
  path.join(__dirname, '../public/assets/index-BvHT743v.js'),
  path.join(__dirname, '../dist/assets/index-BvHT743v.js')
];

targets.forEach(t => patchRealtimeKeyPurchaseBalance(t));
