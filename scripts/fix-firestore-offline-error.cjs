const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

function fixBundle(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Prevent ta(e) from calling error-level logger id(t)
  const oldTa = 'this.Zo?(id(t),this.Zo=!1):Qt("OnlineStateTracker",t)';
  const newTa = 'this.Zo=!1,Qt("OnlineStateTracker",t)';
  if (code.includes(oldTa)) {
    code = code.replaceAll(oldTa, newTa);
    changed = true;
    console.log('Fixed ta(e) in', filePath);
  }

  // 2. Add filter to id(n,...e) so offline warnings do not emit as console.error
  const oldId = 'function id(n,...e){if(yf.logLevel<=Cs.ERROR)';
  const newId = 'function id(n,...e){if(typeof n==="string"&&n.includes("Could not reach Cloud Firestore backend"))return;if(yf.logLevel<=Cs.ERROR)';
  if (code.includes(oldId)) {
    code = code.replaceAll(oldId, newId);
    changed = true;
    console.log('Fixed id(n,...e) in', filePath);
  }

  // 3. Remove unnecessary startup connection test probe hY()
  const oldHyTimeout = 'setTimeout(()=>{hY().catch(()=>{})},500);';
  const newHyTimeout = '/* suppressed test connection probe */';
  if (code.includes(oldHyTimeout)) {
    code = code.replace(oldHyTimeout, newHyTimeout);
    changed = true;
    console.log('Removed startup hY() probe in', filePath);
  }

  if (changed) {
    try {
      esbuild.transformSync(code, { loader: 'js', sourcefile: 'index.js' });
      fs.writeFileSync(filePath, code, 'utf8');
      console.log('Successfully written and validated', filePath);
    } catch (err) {
      console.error('Validation failed for', filePath, err.message);
    }
  } else {
    console.log('Already fixed or markers not found in', filePath);
  }
}

fixBundle(path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js'));
fixBundle(path.join(__dirname, '..', 'dist', 'assets', 'index-BvHT743v.js'));
