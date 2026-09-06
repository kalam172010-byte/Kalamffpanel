const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

function removeBottomNav(code) {
  const idx = code.indexOf('fixed bottom-0 left-0 right-0 max-w-md');
  if (idx === -1) {
    console.log('Bottom nav not found or already removed.');
    return code;
  }

  const navStart = code.lastIndexOf('r.jsxs("nav",', idx);
  const navEnd = code.indexOf(')]}),r.jsx(dQ,', idx);

  if (navStart === -1 || navEnd === -1) {
    console.error('Could not locate nav element boundaries.');
    return null;
  }

  let updated = code.substring(0, navStart) + code.substring(navEnd + 5);
  updated = updated.replace('shadow-[0_0_60px_rgba(0,0,0,0.8)] pb-24 smooth-gpu', 'shadow-[0_0_60px_rgba(0,0,0,0.8)] pb-20 smooth-gpu');

  return updated;
}

function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('Skipping non-existent file:', filePath);
    return true;
  }

  console.log('Processing:', filePath);
  let code = fs.readFileSync(filePath, 'utf8');

  let modified = removeBottomNav(code);
  if (!modified) {
    console.error('Modification failed for:', filePath);
    return false;
  }

  try {
    esbuild.transformSync(modified, { loader: 'js' });
    console.log('Syntax check passed for:', filePath);
    fs.writeFileSync(filePath, modified, 'utf8');
    return true;
  } catch (err) {
    console.error('Syntax error:', err);
    return false;
  }
}

const f1 = path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js');
const f2 = path.join(__dirname, '..', 'dist', 'assets', 'index-BvHT743v.js');

const r1 = processFile(f1);
const r2 = processFile(f2);

if (r1 && r2) {
  console.log('BOTTOM NAVIGATION BAR REMOVED SUCCESSFULLY!');
} else {
  console.error('FAILED TO REMOVE BOTTOM NAVIGATION BAR');
  process.exit(1);
}
