const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 1. Fix CSS files (replace 3.40282e38px with 9999px)
['public', 'dist'].forEach(dir => {
  const assetsDir = path.join(__dirname, '..', dir, 'assets');
  if (fs.existsSync(assetsDir)) {
    fs.readdirSync(assetsDir).filter(f => f.endsWith('.css')).forEach(f => {
      const p = path.join(assetsDir, f);
      let css = fs.readFileSync(p, 'utf8');
      if (css.includes('3.40282e38px')) {
        css = css.replaceAll('3.40282e38px', '9999px');
        fs.writeFileSync(p, css, 'utf8');
        console.log('Fixed rounded-full scientific notation in', p);
      }
    });
  }
});

// 2. Ensure pQ has explicit const declaration and fQ has circular styling
['public', 'dist'].forEach(dir => {
  const p = path.join(__dirname, '..', dir, 'assets', 'index-BvHT743v.js');
  if (fs.existsSync(p)) {
    let code = fs.readFileSync(p, 'utf8');
    let changed = false;

    if (code.includes(';pQ=({onOpenQuickSettings')) {
      code = code.replace(';pQ=({onOpenQuickSettings', ';const pQ=({onOpenQuickSettings');
      changed = true;
    }

    if (changed) {
      try {
        new vm.SourceTextModule(code);
        fs.writeFileSync(p, code, 'utf8');
        console.log('Successfully validated and updated', p);
      } catch (err) {
        console.error('Validation error for', p, err.message);
      }
    } else {
      console.log('Already up to date:', p);
    }
  }
});
