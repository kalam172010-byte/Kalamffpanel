const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

function updateBundle(targetPath) {
  console.log('Processing:', targetPath);
  let code = fs.readFileSync(targetPath, 'utf8');

  const rnePreamble = 'rne=({apiConfigs:n,onSaveApiConfig:e,onAddApiConfig:t,onDeleteApiConfig:s})=>{';
  const rneRet = 'return r.jsxs("div",{className:"space-y-4",id:"admin-api-setup-view",children:[';

  const preambleIndex = code.indexOf(rnePreamble);
  if (preambleIndex === -1) {
    console.error('Could not find rne preamble in', targetPath);
    return false;
  }

  const retIndex = code.indexOf(rneRet, preambleIndex);
  if (retIndex === -1) {
    console.error('Could not find rne return in', targetPath);
    return false;
  }

  // Find original children and original hooks
  let originalChildren = '';
  let origHooks = '';

  const marker = 'wpMode==="reseller_api"&&r.jsxs(r.Fragment,{children:[';
  const markerIdx = code.indexOf(marker, retIndex);

  if (markerIdx !== -1) {
    // Bundle was already modified, extract originalChildren from fragment
    const fragStart = markerIdx + marker.length;
    let depth = 1, pos = fragStart;
    while (pos < code.length && depth > 0) {
      if (code[pos] === '[') depth++;
      else if (code[pos] === ']') depth--;
      pos++;
    }
    originalChildren = code.substring(fragStart, pos - 1);

    // Extract original hooks from between preamble and retIndex
    const between = code.substring(preambleIndex + rnePreamble.length, retIndex);
    const origHookIdx = between.indexOf('const[a,i]=q.useState');
    if (origHookIdx !== -1) {
      origHooks = between.substring(origHookIdx);
    } else {
      origHooks = between;
    }
  } else {
    // Unmodified bundle
    const childrenStart = retIndex + rneRet.length;
    let depth = 1, pos = childrenStart;
    while (pos < code.length && depth > 0) {
      if (code[pos] === '[') depth++;
      else if (code[pos] === ']') depth--;
      pos++;
    }
    originalChildren = code.substring(childrenStart, pos - 1);
    origHooks = code.substring(preambleIndex + rnePreamble.length, retIndex);
  }

  // Find where the entire rne children block ends (matching rneRet)
  const afterRetStart = retIndex + rneRet.length;
  let rneDepth = 1, rnePos = afterRetStart;
  while (rnePos < code.length && rneDepth > 0) {
    if (code[rnePos] === '[') rneDepth++;
    else if (code[rnePos] === ']') rneDepth--;
    rnePos++;
  }
  const entireChildrenEnd = rnePos - 1;

  // Define new state hooks
  const extraStates = [
    'const[wpMode,setWpMode]=q.useState("website_api"),',
    '[wpKey,setWpKey]=q.useState("kalam_live_master_ff_2026"),',
    '[showWpKey,setShowWpKey]=q.useState(!1),',
    '[wpKeyCopied,setWpKeyCopied]=q.useState(!1),',
    '[wpCurlCopied,setWpCurlCopied]=q.useState(!1),',
    '[wpPidCopied,setWpPidCopied]=q.useState(null),',
    '[wpCurlTab,setWpCurlTab]=q.useState("buy"),',
    '[wpProdId,setWpProdId]=q.useState("prod-1788620078944"),',
    '[wpDuration,setWpDuration]=q.useState("1 hours"),',
    '[wpQuantity,setWpQuantity]=q.useState(1),',
    '[wpExtOrderId,setWpExtOrderId]=q.useState("TXN_CLIENT_9901"),',
    '[wpTesting,setWpTesting]=q.useState(!1),',
    '[wpTestResult,setWpTestResult]=q.useState(null),',
    '[wpTestLatency,setWpTestLatency]=q.useState(null),',
    '[wpTestStatus,setWpTestStatus]=q.useState(null);',
    'const runWpTest=async(endpointType)=>{',
    '  setWpTesting(!0);setWpTestResult(null);setWpTestStatus(null);const t0=Date.now();',
    '  try{',
    '    let res,url,method="GET",headers={"Authorization":"Bearer "+wpKey},body=null;',
    '    if(endpointType==="buy"){',
    '      url="/api/v1/order/create";method="POST";headers["Content-Type"]="application/json";',
    '      body=JSON.stringify({pid:wpProdId||"prod-1788620078944",duration:wpDuration||"1 hours",quantity:Number(wpQuantity)||1,externalOrderId:wpExtOrderId||("TEST_"+Date.now().toString().slice(-4))});',
    '    }else if(endpointType==="pids"){',
    '      url="/api/v1/pids";',
    '    }else if(endpointType==="products"){',
    '      url="/api/v1/products";',
    '    }else if(endpointType==="status"){',
    '      url="/api/v1/order/status?orderId=ORD_API_SAMPLE";',
    '    }else if(endpointType==="balance"){',
    '      url="/api/v1/user/balance";',
    '    }else{',
    '      url="/api/v1/ping";',
    '    }',
    '    res=await fetch(url,{method,headers,body});',
    '    const data=await res.json();',
    '    setWpTestLatency(Date.now()-t0);',
    '    setWpTestStatus(res.status+" "+res.statusText);',
    '    setWpTestResult(JSON.stringify(data,null,2));',
    '  }catch(err){',
    '    setWpTestLatency(Date.now()-t0);',
    '    setWpTestStatus("500 Error");',
    '    setWpTestResult(JSON.stringify({error:err.message},null,2));',
    '  }finally{setWpTesting(!1);}',
    '};',
    'const generateNewWpKey=()=>{',
    '  const newK="kalam_live_"+Math.random().toString(36).substring(2,8)+"_"+Math.random().toString(36).substring(2,8);',
    '  setWpKey(newK);setWpKeyCopied(!0);',
    '  if(typeof navigator!=="undefined"&&navigator.clipboard){navigator.clipboard.writeText(newK);}',
    '  fetch("/api/admin/website-api/keys",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:"Admin Key",key:newK})}).catch(()=>{});',
    '  setTimeout(()=>setWpKeyCopied(!1),2500);',
    '};',
    'const copyWpKey=()=>{',
    '  if(typeof navigator!=="undefined"&&navigator.clipboard){navigator.clipboard.writeText(wpKey);}',
    '  setWpKeyCopied(!0);setTimeout(()=>setWpKeyCopied(!1),2500);',
    '};',
    'const copyTextSnippet=(txt,tag)=>{',
    '  if(typeof navigator!=="undefined"&&navigator.clipboard){navigator.clipboard.writeText(txt);}',
    '  if(tag==="pid"){setWpPidCopied(txt);setTimeout(()=>setWpPidCopied(null),2500);}',
    '  else if(tag==="curl"){setWpCurlCopied(!0);setTimeout(()=>setWpCurlCopied(!1),2500);}',
    '};',
    'const selectProductAndDuration=(targetPid,targetDur)=>{',
    '  setWpProdId(targetPid);',
    '  setWpDuration(targetDur);',
    '  setWpCurlTab("buy");',
    '};',
    'const getCurlSnippet=(type)=>{',
    '  const origin=(typeof window!=="undefined"&&window.location.origin)?window.location.origin:"https://kalam-ff.com";',
    '  if(type==="buy"){',
    '    return "curl -X POST \\""+origin+"/api/v1/order/create\\" \\\\\\n  -H \\"Authorization: Bearer "+wpKey+"\\" \\\\\\n  -H \\"Content-Type: application/json\\" \\\\\\n  -d \'{\\n    \\"pid\\": \\""+wpProdId+"\\",\\n    \\"duration\\": \\""+wpDuration+"\\",\\n    \\"quantity\\": "+(Number(wpQuantity)||1)+",\\n    \\"externalOrderId\\": \\""+(wpExtOrderId||"TXN_CLIENT_9901")+"\\"\\n  }\'";',
    '  }else if(type==="pids"){',
    '    return "curl -X GET \\""+origin+"/api/v1/pids\\" \\\\\\n  -H \\"Authorization: Bearer "+wpKey+"\\"";',
    '  }else if(type==="products"){',
    '    return "curl -X GET \\""+origin+"/api/v1/products\\" \\\\\\n  -H \\"Authorization: Bearer "+wpKey+"\\"";',
    '  }else if(type==="status"){',
    '    return "curl -X GET \\""+origin+"/api/v1/order/status?orderId=ORD_API_1788623741846_KRVJ\\" \\\\\\n  -H \\"Authorization: Bearer "+wpKey+"\\"";',
    '  }else if(type==="balance"){',
    '    return "curl -X GET \\""+origin+"/api/v1/user/balance\\" \\\\\\n  -H \\"Authorization: Bearer "+wpKey+"\\"";',
    '  }else{',
    '    return "curl -X GET \\""+origin+"/api/v1/ping\\"";',
    '  }',
    '};'
  ].join('\n');

  // Build the new children as regular string concatenations
  const newChildren = [
    'r.jsxs("div",{className:"space-y-4 mb-2",children:[',
    'r.jsxs("div",{className:"p-1.5 rounded-2xl bg-[#12121e] border border-white/10 flex items-center gap-2",children:[',
    '  r.jsxs("button",{type:"button",onClick:()=>setWpMode("website_api"),className:"flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer "+(wpMode==="website_api"?"bg-gradient-to-r from-[#ff0080] via-[#8b5cf6] to-[#00e5ff] text-white shadow-[0_0_20px_rgba(255,0,128,0.35)]":"text-gray-400 hover:text-white hover:bg-white/5"),children:[',
    '    r.jsx("span",{children:"⚡"}),',
    '    r.jsx("span",{children:"Product API (PID & Duration)"}),',
    '    r.jsx("span",{className:"text-[9px] px-1.5 py-0.5 rounded-full bg-black/40 text-emerald-300 font-mono font-black",children:"LIVE GATEWAY"})',
    '  ]}),',
    '  r.jsxs("button",{type:"button",onClick:()=>setWpMode("reseller_api"),className:"flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer "+(wpMode==="reseller_api"?"bg-gradient-to-r from-[#00e5ff] to-[#8b5cf6] text-black font-extrabold shadow-[0_0_15px_rgba(0,229,255,0.4)]":"text-gray-400 hover:text-white hover:bg-white/5"),children:[',
    '    r.jsx("span",{children:"🌐"}),',
    '    r.jsx("span",{children:"Upstream Reseller Providers"}),',
    '    r.jsx("span",{className:"text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-gray-300 font-mono font-semibold",children:"OUTBOUND"})',
    '  ]})',
    ']}),',

    // Product API Box
    'wpMode==="website_api"&&r.jsxs("div",{className:"space-y-4",children:[',
    // Banner
    '  r.jsxs("div",{className:"p-4 rounded-2xl bg-gradient-to-r from-[#171728] via-[#1a1435] to-[#121b2d] border border-cyan-500/30 shadow-[0_0_25px_rgba(0,229,255,0.1)] space-y-2",children:[',
    '    r.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[',
    '      r.jsxs("div",{className:"flex items-center gap-2",children:[',
    '        r.jsx("div",{className:"w-7 h-7 rounded-lg bg-[#ff0080]/20 border border-[#ff0080]/50 flex items-center justify-center text-sm",children:"🔑"}),',
    '        r.jsxs("div",{children:[',
    '          r.jsx("h3",{className:"text-sm font-black text-white",children:"Product API System (PID & Duration Support)"}),',
    '          r.jsx("p",{className:"text-[10px] text-gray-400",children:"Automated bots and client websites can buy keys directly using product PID and duration."})',
    '        ]})',
    '      ]}),',
    '      r.jsx("div",{className:"flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold",children:"● ONLINE: /api/v1 Active"})',
    '    ]}),',
    '    r.jsxs("div",{className:"flex flex-wrap items-center gap-2 pt-1 text-[11px]",children:[',
    '      r.jsx("span",{className:"text-gray-400",children:"Website Base URL:"}),',
    '      r.jsx("code",{className:"px-2 py-0.5 rounded-md bg-black/50 border border-white/10 text-cyan-300 font-mono font-bold text-[10px]",children:(typeof window!=="undefined"&&window.location.origin)?window.location.origin:"https://kalam-ff.com"})',
    '    ]})',
    '  ]}),',

    // Key Manager
    '  r.jsxs("div",{className:"p-4 rounded-2xl bg-[#11111d] border border-white/10 space-y-3",children:[',
    '    r.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[',
    '      r.jsxs("div",{className:"space-y-0.5",children:[',
    '        r.jsx("h4",{className:"text-xs font-bold text-white uppercase tracking-wider",children:"1. Your Website Product API Key"}),',
    '        r.jsx("p",{className:"text-[10px] text-gray-400",children:"Clients and bots must send this key in Authorization: Bearer <KEY> or ?api_key=<KEY>"})',
    '      ]}),',
    '      r.jsxs("div",{className:"flex items-center gap-2",children:[',
    '        r.jsxs("button",{type:"button",onClick:generateNewWpKey,className:"px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-gray-300 font-bold transition-all cursor-pointer flex items-center gap-1",children:[',
    '          r.jsx("span",{children:"🔄"}),r.jsx("span",{children:"Generate New Key"})',
    '        ]}),',
    '        r.jsxs("button",{type:"button",onClick:copyWpKey,className:"px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 "+(wpKeyCopied?"bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]":"bg-gradient-to-r from-[#ff0080] to-[#8b5cf6] text-white shadow-[0_0_15px_rgba(255,0,128,0.3)]"),children:[',
    '          r.jsx("span",{children:wpKeyCopied?"✓":"📋"}),',
    '          r.jsx("span",{children:wpKeyCopied?"Copied!":"Copy API Key"})',
    '        ]})',
    '      ]})',
    '    ]}),',
    '    r.jsxs("div",{className:"flex items-center gap-2",children:[',
    '      r.jsx("div",{className:"flex-1 relative",children:',
    '        r.jsx("input",{type:showWpKey?"text":"password",readOnly:!0,value:wpKey,className:"w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold tracking-wider select-all"})',
    '      }),',
    '      r.jsx("button",{type:"button",onClick:()=>setShowWpKey(!showWpKey),className:"px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold cursor-pointer transition-all",children:showWpKey?"Hide":"Show"}),',
    '      r.jsx("button",{type:"button",onClick:copyWpKey,className:"px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-400 text-xs font-bold cursor-pointer transition-all",children:wpKeyCopied?"✓ Copied":"Copy"})',
    '    ]}),',
    '    r.jsxs("div",{className:"flex flex-wrap items-center gap-2 pt-1",children:[',
    '      r.jsx("span",{className:"text-[10px] text-gray-400 font-bold",children:"Active Permissions:"}),',
    '      r.jsx("span",{className:"text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-semibold",children:"✓ order_keys (Buy Keys via PID & Duration)"}),',
    '      r.jsx("span",{className:"text-[9px] px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono font-semibold",children:"✓ read_products (/api/v1/pids & /products)"}),',
    '      r.jsx("span",{className:"text-[9px] px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono font-semibold",children:"✓ check_orders (Order Status)"}),',
    '      r.jsx("span",{className:"text-[9px] px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-semibold",children:"✓ read_balance (Store Balance)"})',
    '    ]})',
    '  ]}),',

    // PID and Duration Parameter Configurator
    '  r.jsxs("div",{className:"p-4 rounded-2xl bg-[#11111d] border border-cyan-500/20 space-y-3",children:[',
    '    r.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[',
    '      r.jsxs("div",{className:"space-y-0.5",children:[',
    '        r.jsx("h4",{className:"text-xs font-bold text-white uppercase tracking-wider",children:"2. Interactive Product PID & Duration Builder"}),',
    '        r.jsx("p",{className:"text-[10px] text-gray-400",children:"Select or customize the target Product PID and Duration to test orders and auto-generate cURL commands."})',
    '      ]}),',
    '      r.jsx("span",{className:"text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold",children:"LIVE SYNC"})',
    '    ]}),',
    '    r.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3",children:[',
    // PID Input
    '      r.jsxs("div",{className:"space-y-1.5",children:[',
    '        r.jsxs("label",{className:"text-[10px] text-gray-400 font-bold flex items-center justify-between",children:[',
    '          r.jsx("span",{children:"Product PID (pid):"}),',
    '          r.jsx("span",{className:"text-cyan-400 font-mono text-[9px]",children:"REQUIRED"})',
    '        ]}),',
    '        r.jsx("input",{type:"text",value:wpProdId,onChange:(e)=>setWpProdId(e.target.value),placeholder:"prod-1788620078944",className:"w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-cyan-400 outline-none"}),',
    '        r.jsxs("div",{className:"flex flex-wrap gap-1 pt-1",children:[',
    '          r.jsx("button",{type:"button",onClick:()=>setWpProdId("prod-1788620078944"),className:"px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer "+(wpProdId==="prod-1788620078944"?"bg-cyan-500 text-black font-black":"bg-white/5 text-gray-400 hover:text-white"),children:"XYZ CHEATS"}),',
    '          r.jsx("button",{type:"button",onClick:()=>setWpProdId("prod-1788447756032"),className:"px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer "+(wpProdId==="prod-1788447756032"?"bg-cyan-500 text-black font-black":"bg-white/5 text-gray-400 hover:text-white"),children:"BALA MODS"})',
    '        ]})',
    '      ]}),',
    // Duration Input
    '      r.jsxs("div",{className:"space-y-1.5",children:[',
    '        r.jsxs("label",{className:"text-[10px] text-gray-400 font-bold flex items-center justify-between",children:[',
    '          r.jsx("span",{children:"Plan Duration (duration):"}),',
    '          r.jsx("span",{className:"text-purple-400 font-mono text-[9px]",children:"REQUIRED"})',
    '        ]}),',
    '        r.jsx("input",{type:"text",value:wpDuration,onChange:(e)=>setWpDuration(e.target.value),placeholder:"1 hours / 1 day",className:"w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-purple-400 outline-none"}),',
    '        r.jsxs("div",{className:"flex flex-wrap gap-1 pt-1",children:[',
    '          r.jsx("button",{type:"button",onClick:()=>setWpDuration("1 hours"),className:"px-1.5 py-0.5 rounded text-[9px] font-mono transition-all cursor-pointer "+(wpDuration==="1 hours"?"bg-[#ff0080] text-white font-bold":"bg-white/5 text-gray-400 hover:text-white"),children:"1h"}),',
    '          r.jsx("button",{type:"button",onClick:()=>setWpDuration("3 hours"),className:"px-1.5 py-0.5 rounded text-[9px] font-mono transition-all cursor-pointer "+(wpDuration==="3 hours"?"bg-[#ff0080] text-white font-bold":"bg-white/5 text-gray-400 hover:text-white"),children:"3h"}),',
    '          r.jsx("button",{type:"button",onClick:()=>setWpDuration("6 hours"),className:"px-1.5 py-0.5 rounded text-[9px] font-mono transition-all cursor-pointer "+(wpDuration==="6 hours"?"bg-[#ff0080] text-white font-bold":"bg-white/5 text-gray-400 hover:text-white"),children:"6h"}),',
    '          r.jsx("button",{type:"button",onClick:()=>setWpDuration("12 hours"),className:"px-1.5 py-0.5 rounded text-[9px] font-mono transition-all cursor-pointer "+(wpDuration==="12 hours"?"bg-[#ff0080] text-white font-bold":"bg-white/5 text-gray-400 hover:text-white"),children:"12h"}),',
    '          r.jsx("button",{type:"button",onClick:()=>setWpDuration("1 day"),className:"px-1.5 py-0.5 rounded text-[9px] font-mono transition-all cursor-pointer "+(wpDuration==="1 day"?"bg-[#ff0080] text-white font-bold":"bg-white/5 text-gray-400 hover:text-white"),children:"1d"})',
    '        ]})',
    '      ]}),',
    // Quantity Input
    '      r.jsxs("div",{className:"space-y-1.5",children:[',
    '        r.jsx("label",{className:"text-[10px] text-gray-400 font-bold",children:"Quantity (quantity):"}),',
    '        r.jsx("input",{type:"number",min:1,max:50,value:wpQuantity,onChange:(e)=>setWpQuantity(parseInt(e.target.value)||1),className:"w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-cyan-400 outline-none"}),',
    '        r.jsx("p",{className:"text-[9px] text-gray-500",children:"Number of keys to deliver (1-50)"})',
    '      ]}),',
    // External Order ID
    '      r.jsxs("div",{className:"space-y-1.5",children:[',
    '        r.jsx("label",{className:"text-[10px] text-gray-400 font-bold",children:"Client Order ID (externalOrderId):"}),',
    '        r.jsx("input",{type:"text",value:wpExtOrderId,onChange:(e)=>setWpExtOrderId(e.target.value),placeholder:"TXN_CLIENT_9901",className:"w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-cyan-400 outline-none"}),',
    '        r.jsx("p",{className:"text-[9px] text-gray-500",children:"Optional reference from your bot"})',
    '      ]})',
    '    ]})',
    '  ]}),',

    // Endpoints Directory
    '  r.jsxs("div",{className:"p-4 rounded-2xl bg-[#11111d] border border-white/10 space-y-2.5",children:[',
    '    r.jsx("h4",{className:"text-xs font-bold text-white uppercase tracking-wider",children:"3. Website API Endpoints Directory"}),',
    '    r.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs",children:[',
    '      r.jsxs("div",{onClick:()=>setWpCurlTab("buy"),className:"p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 "+(wpCurlTab==="buy"?"bg-[#ff0080]/10 border-[#ff0080]/50 text-white":"bg-black/40 border-white/5 text-gray-300 hover:border-white/20"),children:[',
    '        r.jsxs("div",{className:"space-y-0.5",children:[',
    '          r.jsxs("div",{className:"flex items-center gap-1.5",children:[',
    '            r.jsx("span",{className:"px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-emerald-500/20 text-emerald-400",children:"POST"}),',
    '            r.jsx("span",{className:"font-mono font-bold text-xs text-white",children:"/api/v1/order/create"})',
    '          ]}),',
    '          r.jsx("p",{className:"text-[10px] text-gray-400",children:"Buy & deliver key using PID & duration"})',
    '        ]}),',
    '        r.jsx("span",{className:"text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#ff0080] font-bold",children:"Select"})',
    '      ]}),',
    '      r.jsxs("div",{onClick:()=>setWpCurlTab("pids"),className:"p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 "+(wpCurlTab==="pids"?"bg-[#00e5ff]/10 border-[#00e5ff]/50 text-white":"bg-black/40 border-white/5 text-gray-300 hover:border-white/20"),children:[',
    '        r.jsxs("div",{className:"space-y-0.5",children:[',
    '          r.jsxs("div",{className:"flex items-center gap-1.5",children:[',
    '            r.jsx("span",{className:"px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-cyan-500/20 text-cyan-400",children:"GET"}),',
    '            r.jsx("span",{className:"font-mono font-bold text-xs text-white",children:"/api/v1/pids"})',
    '          ]}),',
    '          r.jsx("p",{className:"text-[10px] text-gray-400",children:"List all active PIDs & duration plans"})',
    '        ]}),',
    '        r.jsx("span",{className:"text-[10px] px-2 py-0.5 rounded bg-white/5 text-cyan-400 font-bold",children:"Select"})',
    '      ]}),',
    '      r.jsxs("div",{onClick:()=>setWpCurlTab("products"),className:"p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 "+(wpCurlTab==="products"?"bg-[#8b5cf6]/10 border-[#8b5cf6]/50 text-white":"bg-black/40 border-white/5 text-gray-300 hover:border-white/20"),children:[',
    '        r.jsxs("div",{className:"space-y-0.5",children:[',
    '          r.jsxs("div",{className:"flex items-center gap-1.5",children:[',
    '            r.jsx("span",{className:"px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-purple-500/20 text-purple-400",children:"GET"}),',
    '            r.jsx("span",{className:"font-mono font-bold text-xs text-white",children:"/api/v1/products"})',
    '          ]}),',
    '          r.jsx("p",{className:"text-[10px] text-gray-400",children:"Full products catalog with plans"})',
    '        ]}),',
    '        r.jsx("span",{className:"text-[10px] px-2 py-0.5 rounded bg-white/5 text-purple-400 font-bold",children:"Select"})',
    '      ]}),',
    '      r.jsxs("div",{onClick:()=>setWpCurlTab("status"),className:"p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 "+(wpCurlTab==="status"?"bg-blue-500/10 border-blue-500/50 text-white":"bg-black/40 border-white/5 text-gray-300 hover:border-white/20"),children:[',
    '        r.jsxs("div",{className:"space-y-0.5",children:[',
    '          r.jsxs("div",{className:"flex items-center gap-1.5",children:[',
    '            r.jsx("span",{className:"px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-blue-500/20 text-blue-400",children:"GET"}),',
    '            r.jsx("span",{className:"font-mono font-bold text-xs text-white",children:"/api/v1/order/status"})',
    '          ]}),',
    '          r.jsx("p",{className:"text-[10px] text-gray-400",children:"Verify order status & key details"})',
    '        ]}),',
    '        r.jsx("span",{className:"text-[10px] px-2 py-0.5 rounded bg-white/5 text-blue-400 font-bold",children:"Select"})',
    '      ]}),',
    '      r.jsxs("div",{onClick:()=>setWpCurlTab("balance"),className:"p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 "+(wpCurlTab==="balance"?"bg-amber-500/10 border-amber-500/50 text-white":"bg-black/40 border-white/5 text-gray-300 hover:border-white/20"),children:[',
    '        r.jsxs("div",{className:"space-y-0.5",children:[',
    '          r.jsxs("div",{className:"flex items-center gap-1.5",children:[',
    '            r.jsx("span",{className:"px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-amber-500/20 text-amber-400",children:"GET"}),',
    '            r.jsx("span",{className:"font-mono font-bold text-xs text-white",children:"/api/v1/user/balance"})',
    '          ]}),',
    '          r.jsx("p",{className:"text-[10px] text-gray-400",children:"Check wallet balance & currency"})',
    '        ]}),',
    '        r.jsx("span",{className:"text-[10px] px-2 py-0.5 rounded bg-white/5 text-amber-400 font-bold",children:"Select"})',
    '      ]}),',
    '      r.jsxs("div",{onClick:()=>setWpCurlTab("ping"),className:"p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 "+(wpCurlTab==="ping"?"bg-emerald-500/10 border-emerald-500/50 text-white":"bg-black/40 border-white/5 text-gray-300 hover:border-white/20"),children:[',
    '        r.jsxs("div",{className:"space-y-0.5",children:[',
    '          r.jsxs("div",{className:"flex items-center gap-1.5",children:[',
    '            r.jsx("span",{className:"px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-emerald-500/20 text-emerald-400",children:"GET"}),',
    '            r.jsx("span",{className:"font-mono font-bold text-xs text-white",children:"/api/v1/ping"})',
    '          ]}),',
    '          r.jsx("p",{className:"text-[10px] text-gray-400",children:"Health & connection ping test"})',
    '        ]}),',
    '        r.jsx("span",{className:"text-[10px] px-2 py-0.5 rounded bg-white/5 text-emerald-400 font-bold",children:"Select"})',
    '      ]})',
    '    ]})',
    '  ]}),',

    // Interactive cURL Box
    '  r.jsxs("div",{className:"p-4 rounded-2xl bg-[#0d0d16] border border-cyan-500/40 shadow-[0_0_30px_rgba(0,229,255,0.15)] space-y-3",children:[',
    '    r.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[',
    '      r.jsxs("div",{className:"space-y-0.5",children:[',
    '        r.jsxs("div",{className:"flex items-center gap-2",children:[',
    '          r.jsx("h4",{className:"text-xs font-bold text-white uppercase tracking-wider",children:"4. Copyable cURL Command"}),',
    '          r.jsx("span",{className:"px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-bold",children:"Ready to Run"})',
    '        ]}),',
    '        r.jsx("p",{className:"text-[10px] text-gray-400",children:"Copy and execute directly in bash, terminal, Postman, Python, or PHP."})',
    '      ]}),',
    '      r.jsxs("div",{className:"flex items-center gap-2",children:[',
    '        r.jsxs("button",{type:"button",disabled:wpTesting,onClick:()=>runWpTest(wpCurlTab),className:"px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 "+(wpTesting?"bg-gray-700 text-gray-400 cursor-not-allowed":"bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]"),children:[',
    '          r.jsx("span",{children:wpTesting?"⏳":"▶"}),',
    '          r.jsx("span",{children:wpTesting?"Testing...":"Run Live Test"})',
    '        ]}),',
    '        r.jsxs("button",{type:"button",onClick:()=>copyTextSnippet(getCurlSnippet(wpCurlTab),"curl"),className:"px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 "+(wpCurlCopied?"bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]":"bg-gradient-to-r from-[#ff0080] to-[#8b5cf6] text-white shadow-[0_0_15px_rgba(255,0,128,0.3)]"),children:[',
    '          r.jsx("span",{children:wpCurlCopied?"✓":"📋"}),',
    '          r.jsx("span",{children:wpCurlCopied?"cURL Copied!":"Copy cURL"})',
    '        ]})',
    '      ]})',
    '    ]}),',

    // Endpoint selector tabs
    '    r.jsxs("div",{className:"flex flex-wrap gap-1.5 pt-1",children:[',
    '      r.jsx("button",{type:"button",onClick:()=>setWpCurlTab("buy"),className:"px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer "+(wpCurlTab==="buy"?"bg-[#ff0080] text-white shadow-[0_0_12px_rgba(255,0,128,0.4)]":"bg-white/5 text-gray-400 hover:text-white"),children:"🛒 Buy Key (PID & Duration)"}),',
    '      r.jsx("button",{type:"button",onClick:()=>setWpCurlTab("pids"),className:"px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer "+(wpCurlTab==="pids"?"bg-[#00e5ff] text-black font-extrabold shadow-[0_0_12px_rgba(0,229,255,0.4)]":"bg-white/5 text-gray-400 hover:text-white"),children:"📋 PIDs & Durations List"}),',
    '      r.jsx("button",{type:"button",onClick:()=>setWpCurlTab("products"),className:"px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer "+(wpCurlTab==="products"?"bg-[#8b5cf6] text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]":"bg-white/5 text-gray-400 hover:text-white"),children:"📦 Products Catalog"}),',
    '      r.jsx("button",{type:"button",onClick:()=>setWpCurlTab("status"),className:"px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer "+(wpCurlTab==="status"?"bg-blue-500 text-white font-extrabold shadow-[0_0_12px_rgba(59,130,246,0.4)]":"bg-white/5 text-gray-400 hover:text-white"),children:"🔍 Order Status"}),',
    '      r.jsx("button",{type:"button",onClick:()=>setWpCurlTab("balance"),className:"px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer "+(wpCurlTab==="balance"?"bg-amber-500 text-black font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.4)]":"bg-white/5 text-gray-400 hover:text-white"),children:"💰 Balance"}),',
    '      r.jsx("button",{type:"button",onClick:()=>setWpCurlTab("ping"),className:"px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer "+(wpCurlTab==="ping"?"bg-emerald-500 text-black font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.4)]":"bg-white/5 text-gray-400 hover:text-white"),children:"⚡ Ping"})',
    '    ]}),',

    // cURL Display Box
    '    r.jsx("div",{className:"relative group",children:',
    '      r.jsx("pre",{className:"p-3.5 rounded-xl bg-[#05050a] border border-white/10 text-cyan-300 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre select-all shadow-inner",children:getCurlSnippet(wpCurlTab)})',
    '    }),',

    // Live Test Output Console
    '    (wpTesting||wpTestResult)&&r.jsxs("div",{className:"p-3.5 rounded-xl bg-[#06060c] border border-emerald-500/40 space-y-2",children:[',
    '      r.jsxs("div",{className:"flex items-center justify-between text-xs",children:[',
    '        r.jsxs("div",{className:"flex items-center gap-2",children:[',
    '          r.jsx("span",{className:"w-2 h-2 rounded-full bg-emerald-400 animate-pulse"}),',
    '          r.jsx("span",{className:"font-bold text-white",children:"Live Server Response:"}),',
    '          wpTestStatus&&r.jsx("span",{className:"px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]",children:wpTestStatus})',
    '        ]}),',
    '        wpTestLatency&&r.jsxs("span",{className:"text-[10px] text-gray-400 font-mono",children:[wpTestLatency," ms latency"]})',
    '      ]}),',
    '      r.jsx("pre",{className:"p-2.5 rounded-lg bg-black/60 border border-white/5 text-emerald-300 font-mono text-[11px] max-h-48 overflow-y-auto whitespace-pre",children:wpTesting?"Executing request to /api/v1 gateway...":wpTestResult})',
    '    ]})',
    '  ]}),',

    // Dedicated Product PID and Duration Reference Catalog Card
    '  r.jsxs("div",{className:"p-4 rounded-2xl bg-[#11111d] border border-white/10 space-y-3",children:[',
    '    r.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[',
    '      r.jsxs("div",{className:"space-y-0.5",children:[',
    '        r.jsx("h4",{className:"text-xs font-bold text-white uppercase tracking-wider",children:"5. Active Product PID & Duration Reference Guide"}),',
    '        r.jsx("p",{className:"text-[10px] text-gray-400",children:"Click any duration button to automatically load the product PID and duration into the API cURL builder."})',
    '      ]}),',
    '      r.jsx("span",{className:"text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold",children:"2 STORE PRODUCTS"})',
    '    ]}),',
    '    r.jsxs("div",{className:"space-y-3 pt-1",children:[',
    // Product 1 Card
    '      r.jsxs("div",{className:"p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-2.5",children:[',
    '        r.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[',
    '          r.jsxs("div",{className:"flex items-center gap-2",children:[',
    '            r.jsx("div",{className:"w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-300",children:"1"}),',
    '            r.jsxs("div",{children:[',
    '              r.jsx("h5",{className:"text-xs font-black text-white",children:"XYZ CHEATS CONFIG PROXY FF NONROOT"}),',
    '              r.jsx("span",{className:"text-[9px] text-gray-400",children:"FREEFIRE • Non-Root Mobile"})',
    '            ]})',
    '          ]}),',
    '          r.jsxs("div",{className:"flex items-center gap-2",children:[',
    '            r.jsxs("div",{className:"flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-cyan-500/30 text-[10px] font-mono",children:[',
    '              r.jsx("span",{className:"text-gray-400",children:"pid:"}),',
    '              r.jsx("span",{className:"text-cyan-300 font-bold",children:"prod-1788620078944"})',
    '            ]}),',
    '            r.jsx("button",{type:"button",onClick:()=>copyTextSnippet("prod-1788620078944","pid"),className:"px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-gray-300 transition-all cursor-pointer",children:wpPidCopied==="prod-1788620078944"?"✓ Copied":"Copy PID"})',
    '          ]})',
    '        ]}),',
    '        r.jsxs("div",{className:"flex flex-wrap items-center gap-2 pt-1",children:[',
    '          r.jsx("span",{className:"text-[10px] text-gray-400 font-bold",children:"Supported Durations:"}),',
    '          r.jsxs("button",{type:"button",onClick:()=>selectProductAndDuration("prod-1788620078944","1 hours"),className:"px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 "+(wpProdId==="prod-1788620078944"&&wpDuration==="1 hours"?"bg-cyan-400 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]":"bg-white/5 border-white/10 text-cyan-300 hover:border-cyan-400/50"),children:[',
    '            r.jsx("span",{children:"1 hours"}),',
    '            r.jsx("span",{className:"text-[9px] opacity-75",children:"(₹15)"})',
    '          ]}),',
    '          r.jsxs("button",{type:"button",onClick:()=>selectProductAndDuration("prod-1788620078944","3 hours"),className:"px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 "+(wpProdId==="prod-1788620078944"&&wpDuration==="3 hours"?"bg-cyan-400 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]":"bg-white/5 border-white/10 text-cyan-300 hover:border-cyan-400/50"),children:[',
    '            r.jsx("span",{children:"3 hours"}),',
    '            r.jsx("span",{className:"text-[9px] opacity-75",children:"(₹35)"})',
    '          ]}),',
    '          r.jsxs("button",{type:"button",onClick:()=>selectProductAndDuration("prod-1788620078944","6 hours"),className:"px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 "+(wpProdId==="prod-1788620078944"&&wpDuration==="6 hours"?"bg-cyan-400 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]":"bg-white/5 border-white/10 text-cyan-300 hover:border-cyan-400/50"),children:[',
    '            r.jsx("span",{children:"6 hours"}),',
    '            r.jsx("span",{className:"text-[9px] opacity-75",children:"(₹60)"})',
    '          ]}),',
    '          r.jsxs("button",{type:"button",onClick:()=>selectProductAndDuration("prod-1788620078944","12 hours"),className:"px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 "+(wpProdId==="prod-1788620078944"&&wpDuration==="12 hours"?"bg-cyan-400 text-black border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]":"bg-white/5 border-white/10 text-cyan-300 hover:border-cyan-400/50"),children:[',
    '            r.jsx("span",{children:"12 hours"}),',
    '            r.jsx("span",{className:"text-[9px] opacity-75",children:"(₹100)"})',
    '          ]}),',
    '          r.jsxs("button",{type:"button",onClick:()=>selectProductAndDuration("prod-1788620078944","1 day"),className:"px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 "+(wpProdId==="prod-1788620078944"&&wpDuration==="1 day"?"bg-[#ff0080] text-white border-[#ff0080] shadow-[0_0_10px_rgba(255,0,128,0.4)]":"bg-white/5 border-white/10 text-pink-300 hover:border-[#ff0080]/50"),children:[',
    '            r.jsx("span",{children:"1 day"}),',
    '            r.jsx("span",{className:"text-[9px] opacity-75",children:"(₹160)"})',
    '          ]})',
    '        ]})',
    '      ]}),',
    // Product 2 Card
    '      r.jsxs("div",{className:"p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-2.5",children:[',
    '        r.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[',
    '          r.jsxs("div",{className:"flex items-center gap-2",children:[',
    '            r.jsx("div",{className:"w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-300",children:"2"}),',
    '            r.jsxs("div",{children:[',
    '              r.jsx("h5",{className:"text-xs font-black text-white",children:"BALA MODS NONROOT APKMOD 🔥"}),',
    '              r.jsx("span",{className:"text-[9px] text-gray-400",children:"FREEFIRE • Non-Root Mobile"})',
    '            ]})',
    '          ]}),',
    '          r.jsxs("div",{className:"flex items-center gap-2",children:[',
    '            r.jsxs("div",{className:"flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-purple-500/30 text-[10px] font-mono",children:[',
    '              r.jsx("span",{className:"text-gray-400",children:"pid:"}),',
    '              r.jsx("span",{className:"text-purple-300 font-bold",children:"prod-1788447756032"})',
    '            ]}),',
    '            r.jsx("button",{type:"button",onClick:()=>copyTextSnippet("prod-1788447756032","pid"),className:"px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-gray-300 transition-all cursor-pointer",children:wpPidCopied==="prod-1788447756032"?"✓ Copied":"Copy PID"})',
    '          ]})',
    '        ]}),',
    '        r.jsxs("div",{className:"flex flex-wrap items-center gap-2 pt-1",children:[',
    '          r.jsx("span",{className:"text-[10px] text-gray-400 font-bold",children:"Supported Durations:"}),',
    '          r.jsxs("button",{type:"button",onClick:()=>selectProductAndDuration("prod-1788447756032","1 hours"),className:"px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 "+(wpProdId==="prod-1788447756032"&&wpDuration==="1 hours"?"bg-purple-500 text-white border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]":"bg-white/5 border-white/10 text-purple-300 hover:border-purple-400/50"),children:[',
    '            r.jsx("span",{children:"1 hours"}),',
    '            r.jsx("span",{className:"text-[9px] opacity-75",children:"(₹20)"})',
    '          ]}),',
    '          r.jsxs("button",{type:"button",onClick:()=>selectProductAndDuration("prod-1788447756032","3 hours"),className:"px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 "+(wpProdId==="prod-1788447756032"&&wpDuration==="3 hours"?"bg-purple-500 text-white border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]":"bg-white/5 border-white/10 text-purple-300 hover:border-purple-400/50"),children:[',
    '            r.jsx("span",{children:"3 hours"}),',
    '            r.jsx("span",{className:"text-[9px] opacity-75",children:"(₹35)"})',
    '          ]})',
    '        ]})',
    '      ]})',
    '    ]})',
    '  ]})',
    '  ]})',
    ']}),',
    'wpMode==="reseller_api"&&r.jsxs(r.Fragment,{children:[' + originalChildren + ']})'
  ].join('\n');

  // Assemble the new code:
  const part1 = code.substring(0, preambleIndex + rnePreamble.length);
  const part3 = code.substring(entireChildrenEnd);

  const finalCode = part1 + extraStates + origHooks + rneRet + newChildren + part3;

  // Validate with esbuild
  try {
    esbuild.transformSync(finalCode, { loader: 'js' });
    console.log('Validation SUCCESS for', targetPath);
    fs.writeFileSync(targetPath, finalCode, 'utf8');
    return true;
  } catch (err) {
    console.error('Validation FAILED for', targetPath);
    if (err.errors && err.errors[0]) {
      console.error('Location:', err.errors[0].location);
    }
    return false;
  }
}

// Update both bundles
const pubSuccess = updateBundle(path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js'));
const distSuccess = updateBundle(path.join(__dirname, '..', 'dist', 'assets', 'index-BvHT743v.js'));

if (pubSuccess && distSuccess) {
  console.log('ALL BUNDLES SUCCESSFULLY UPDATED WITH PRODUCT PID & DURATION!');
} else {
  console.error('BUNDLE UPDATE FAILED');
  process.exit(1);
}
