const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

function patchPurchaseRetry(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist:', filePath);
    return;
  }

  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const targetCode = 'let Cn=(await Gr("/api/purchase-key",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:me.id,planId:Ee.id,planDuration:Ee.duration,quantity:ke,stockKeys:Kt,apiConfigs:F,productApi1:me.api1Restock,productApi2:me.api2Restock})})).data;';

  const replacementCode = 'let Cn=null;for(let _att=1;_att<=3;_att++){try{if(_att>1){bt(ns=>ns?{...ns,stage:"REQUESTING_KEY",label:"Retrying Upstream Request",subLabel:`Network glitch detected. Retrying (${_att}/3) with backoff...`,progressPercent:60+(_att*5)}:null);}Cn=(await Gr("/api/purchase-key",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:me.id,planId:Ee.id,planDuration:Ee.duration,quantity:ke,stockKeys:Kt,apiConfigs:F,productApi1:me.api1Restock,productApi2:me.api2Restock})})).data;if(Cn)break;}catch(_netErr){if(_att===3)throw _netErr;const _backoff=Math.min(4000,800*Math.pow(2,_att-1))+Math.floor(Math.random()*200);await new Promise(ns=>setTimeout(ns,_backoff));}}';

  if (code.includes(targetCode)) {
    code = code.replace(targetCode, replacementCode);
    changed = true;
    console.log('Injected client-side exponential backoff retry into purchase flow in', filePath);
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
    console.log('Already patched or target not found in', filePath);
  }
}

const publicBundle = path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js');
const distBundle = path.join(__dirname, '..', 'dist', 'assets', 'index-BvHT743v.js');

patchPurchaseRetry(publicBundle);
patchPurchaseRetry(distBundle);
