const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

function removeHotPromos(code) {
  const idx = code.indexOf('Hot Promos:');
  if (idx === -1) {
    console.log('Hot Promos not found or already removed.');
    return code;
  }

  const parentStart = code.lastIndexOf('r.jsxs("div",', idx);
  const end = code.indexOf('))]})', idx);

  if (parentStart === -1 || end === -1) {
    console.error('Could not locate Hot Promos boundaries.');
    return null;
  }

  // Remove the div and the trailing comma
  let updatedCode = code.substring(0, parentStart) + code.substring(end + 6);

  // Also clean up placeholder if it mentions KALAM50
  updatedCode = updatedCode.replace('placeholder:"Have a promo code? e.g. KALAM50"', 'placeholder:"Have a promo code?"');

  return updatedCode;
}

function processFile(filePath) {
  console.log('Processing:', filePath);
  let code = fs.readFileSync(filePath, 'utf8');

  let modified = removeHotPromos(code);
  if (!modified) {
    console.error('Failed modifying:', filePath);
    return false;
  }

  try {
    esbuild.transformSync(modified, { loader: 'js' });
    console.log('Syntax check passed for:', filePath);
    fs.writeFileSync(filePath, modified, 'utf8');
    return true;
  } catch (err) {
    console.error('Syntax error for:', filePath, err);
    return false;
  }
}

const f1 = path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js');
const f2 = path.join(__dirname, '..', 'dist', 'assets', 'index-BvHT743v.js');

const ok1 = processFile(f1);
const ok2 = processFile(f2);

if (ok1 && ok2) {
  console.log('SUCCESSFULLY REMOVED HOT PROMO CODE ROW FROM BOTH ASSET FILES!');
} else {
  console.error('FAILED TO REMOVE HOT PROMO CODE');
  process.exit(1);
}
