const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

function patchBuyKeyButton(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist:', filePath);
    return;
  }

  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const oldText = 'r.jsx("span",{children:"BUY RESELLER KEY"})';
  const newText = 'r.jsx("span",{children:"BUY KEY"})';

  if (code.includes(oldText)) {
    code = code.replaceAll(oldText, newText);
    changed = true;
    console.log('Replaced "BUY RESELLER KEY" with "BUY KEY" in', filePath);
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
    console.log('Already up to date in', filePath);
  }
}

const publicBundle = path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js');
const distBundle = path.join(__dirname, '..', 'dist', 'assets', 'index-BvHT743v.js');

patchBuyKeyButton(publicBundle);
patchBuyKeyButton(distBundle);
