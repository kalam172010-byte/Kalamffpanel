const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

function patchDepositAmountInput(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist:', filePath);
    return;
  }

  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Change initial state so deposit amount starts blank (no automatic 1 rupee or 10 rupees)
  const oldStateMatch = code.match(/const\[i,l\]=q\.useState\((10|1|s\.minDeposit\|\|1)\),/);
  if (oldStateMatch) {
    code = code.replace(oldStateMatch[0], 'const[i,l]=q.useState(""),');
    changed = true;
    console.log('Fixed initial state (empty amount by default) in', filePath);
  }

  // 2. Add an effect to reset amount to empty ("") and clear error whenever modal is opened
  const qrEffectMarker = 'Qs.useEffect(()=>{\n    if(!n||u!=="QR"){pe(300);return}';
  const resetOnOpenEffect = 'Qs.useEffect(()=>{if(n){l(""),P(null),d("AMOUNT")}},[n]);  ' + qrEffectMarker;
  if (code.includes(qrEffectMarker) && !code.includes('Qs.useEffect(()=>{if(n){l(""),P(null),d("AMOUNT")}},[n]);')) {
    code = code.replace(qrEffectMarker, resetOnOpenEffect);
    changed = true;
    console.log('Added modal open reset effect in', filePath);
  }

  // 3. Update input element so it allows clearing (empty string) and doesn't force Math.max(1, ...)
  const oldInputStr = 'min:s.minDeposit||1,\n                max:50000,\n                value:i,\n                onChange:tt=>l(Math.max(1,Number(tt.target.value))),\n                className:"w-full bg-transparent text-3xl font-black text-white font-mono tracking-wide focus:outline-none"';
  const newInputStr = 'min:1,\n                max:50000,\n                value:i,\n                placeholder:"0",\n                onChange:tt=>{P(null);const v=tt.target.value;l(v===""?"":Math.max(0,Number(v)||0))},\n                className:"w-full bg-transparent text-3xl font-black text-white font-mono tracking-wide focus:outline-none placeholder:text-gray-600"';
  if (code.includes(oldInputStr)) {
    code = code.replace(oldInputStr, newInputStr);
    changed = true;
    console.log('Fixed input element (free user input, no auto 1 rupee) in', filePath);
  }

  // 4. Update Minus & Plus buttons so minus doesn't force 1
  const oldMinus = 'onClick:()=>l(Math.max(1,i-10)),';
  const newMinus = 'onClick:()=>{P(null);const c=Number(i)||0;const n=Math.max(0,c-10);l(n>0?n:"")},';
  if (code.includes(oldMinus)) {
    code = code.replace(oldMinus, newMinus);
    changed = true;
    console.log('Fixed minus button in', filePath);
  }

  const oldPlus = 'onClick:()=>l(i+50),';
  const newPlus = 'onClick:()=>{P(null);const c=Number(i)||0;l(c+50)},';
  if (code.includes(oldPlus)) {
    code = code.replace(oldPlus, newPlus);
    changed = true;
    console.log('Fixed plus button in', filePath);
  }

  // 5. Update Wallet Credit display so empty string shows 0 instead of blank
  const oldWalletCredit = 'children:["Wallet Credit: ₹",i]';
  const newWalletCredit = 'children:["Wallet Credit: ₹",i?Number(i):0]';
  if (code.includes(oldWalletCredit)) {
    code = code.replace(oldWalletCredit, newWalletCredit);
    changed = true;
    console.log('Fixed wallet credit display in', filePath);
  }

  // 6. Update action button label when amount is empty
  const oldActionLabel = 'children:["Generate UPI QR (₹",i,")"]';
  const newActionLabel = 'children:[i?`Generate UPI QR (₹${i})`:"Enter Deposit Amount"]';
  if (code.includes(oldActionLabel)) {
    code = code.replace(oldActionLabel, newActionLabel);
    changed = true;
    console.log('Fixed action button label in', filePath);
  }

  // 7. Validate amount in J() so if empty or below minDeposit it notifies the user
  const oldIf = 'if(!(i<(s.minDeposit||1))){';
  const newIf = 'if(!i||Number(i)<(s.minDeposit||1)){P("Please enter a valid deposit amount (minimum ₹"+(s.minDeposit||1)+").");return;}if(true){';
  if (code.includes(oldIf)) {
    code = code.replace(oldIf, newIf);
    changed = true;
    console.log('Fixed submit validation in J() in', filePath);
  }

  if (changed) {
    try {
      esbuild.transformSync(code, { loader: 'js', sourcefile: 'bundle.js' });
      fs.writeFileSync(filePath, code, 'utf8');
      console.log('Successfully validated and saved:', filePath);
    } catch (err) {
      console.error('Validation failed for', filePath, err.message);
      process.exit(1);
    }
  } else {
    console.log('All patches already in place in', filePath);
  }
}

const publicBundle = path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js');
const distBundle = path.join(__dirname, '..', 'dist', 'assets', 'index-BvHT743v.js');

patchDepositAmountInput(publicBundle);
patchDepositAmountInput(distBundle);
