rne=({apiConfigs:n,onSaveApiConfig:e,onAddApiConfig:t,onDeleteApiConfig:s})=>{const[wpMode,setWpMode]=q.useState("website_api"),
[wpKey,setWpKey]=q.useState("kalam_live_master_ff_2026"),
[showWpKey,setShowWpKey]=q.useState(!1),
[wpKeyCopied,setWpKeyCopied]=q.useState(!1),
[wpCurlCopied,setWpCurlCopied]=q.useState(!1),
[wpCurlTab,setWpCurlTab]=q.useState("buy"),
[wpProdId,setWpProdId]=q.useState("prod-1788620078944"),
[wpTesting,setWpTesting]=q.useState(!1),
[wpTestResult,setWpTestResult]=q.useState(null),
[wpTestLatency,setWpTestLatency]=q.useState(null),
[wpTestStatus,setWpTestStatus]=q.useState(null);
const runWpTest=async(endpointType)=>{
  setWpTesting(!0);setWpTestResult(null);setWpTestStatus(null);const t0=Date.now();
  try{
    let res,url,method="GET",headers={"Authorization":"Bearer "+wpKey},body=null;
    if(endpointType==="buy"){
      url="/api/v1/order/create";method="POST";headers["Content-Type"]="application/json";
      body=JSON.stringify({productId:wpProdId||"prod-1788620078944",duration:"1 day",quantity:1,externalOrderId:"TEST_"+Date.now().toString().slice(-4)});
    }else if(endpointType==="products"){
      url="/api/v1/products";
    }else if(endpointType==="status"){
      url="/api/v1/order/status?orderId=ORD_API_SAMPLE";
    }else if(endpointType==="balance"){
      url="/api/v1/user/balance";
    }else{
      url="/api/v1/ping";
    }
    res=await fetch(url,{method,headers,body});
    const data=await res.json();
    setWpTestLatency(Date.now()-t0);
    setWpTestStatus(res.status+" "+res.statusText);
    setWpTestResult(JSON.stringify(data,null,2));
  }catch(err){
    setWpTestLatency(Date.now()-t0);
    setWpTestStatus("500 Error");
    setWpTestResult(JSON.stringify({error:err.message},null,2));
  }finally{setWpTesting(!1);}
};
const generateNewWpKey=()=>{
  const newK="kalam_live_"+Math.random().toString(36).substring(2,8)+"_"+Math.random().toString(36).substring(2,8);
  setWpKey(newK);setWpKeyCopied(!0);
  if(typeof navigator!=="undefined"&&navigator.clipboard){navigator.clipboard.writeText(newK);}
  fetch("/api/admin/website-api/keys",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:"Admin Key",key:newK})}).catch(()=>{});
  setTimeout(()=>setWpKeyCopied(!1),2500);
};
const copyWpKey=()=>{
  if(typeof navigator!=="undefined"&&navigator.clipboard){navigator.clipboard.writeText(wpKey);}
  setWpKeyCopied(!0);setTimeout(()=>setWpKeyCopied(!1),2500);
};
const getCurlSnippet=(type)=>{
  const origin=(typeof window!=="undefined"&&window.location.origin)?window.location.origin:"https://kalam-ff.com";
  if(type==="buy"){
    return "curl -X POST \""+origin+"/api/v1/order/create\" \\\n  -H \"Authorization: Bearer "+wpKey+"\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"productId\": \""+wpProdId+"\",\n    \"duration\": \"1 day\",\n    \"quantity\": 1,\n    \"externalOrderId\": \"TXN_CLIENT_9901\"\n  }'";
  }else if(type==="products"){
    return "curl -X GET \""+origin+"/api/v1/products\" \\\n  -H \"Authorization: Bearer "+wpKey+"\"";
  }else if(type==="status"){
    return "curl -X GET \""+origin+"/api/v1/order/status?orderId=ORD_API_1788623741846_KRVJ\" \\\n  -H \"Authorization: Bearer "+wpKey+"\"";
  }else if(type==="balance"){
    return "curl -X GET \""+origin+"/api/v1/user/balance\" \\\n  -H \"Authorization: Bearer "+wpKey+"\"";
  }else{
    return "curl -X GET \""+origin+"/api/v1/ping\"";
  }
};
const copyWpCurl=(cmd)=>{
  if(typeof navigator!=="undefined"&&navigator.clipboard){navigator.clipboard.writeText(cmd);}
  setWpCurlCopied(!0);setTimeout(()=>setWpCurlCopied(!1),2500);
};const[a,i]=q.useState(!1),[l,u]=q.useState(!1),[d,h]=q.useState(""),[p,g]=q.useState(""),[b,x]=q.useState(""),[w,S]=q.useState("adminpanels"),j=_=>{if(_.preventDefault(),!t)return;const H={id:`api_custom_${Date.now()}`,name:d.trim()||`Reseller API #${n.length+1}`,subtitle:w==="adminpanels"?"PHP Master Key API":w==="hkmodz"?"X-API-Token Bearer":"Custom REST API",type:w,apiUrl:p.trim(),apiKey:b.trim(),status:"CONNECTED",lastTested:"Just created"};t(H),i(!1),h(""),g(""),x("")};return r.jsxs("div",{className:"space-y-4",id:"admin-api-setup-view",children:[r.jsxs("div",{className:"space-y-4 mb-2",children:[
r.jsxs("div",{className:"p-1.5 rounded-2xl bg-[#12121e] border border-white/10 flex items-center gap-2",children:[
  r.jsxs("button",{type:"button",onClick:()=>setWpMode("website_api"),className:"flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer "+(wpMode==="website_api"?"bg-gradient-to-r from-[#ff0080] via-[#8b5cf6] to-[#00e5ff] text-white shadow-[0_0_20px_rgba(255,0,128,0.35)]":"text-gray-400 hover:text-white hover:bg-white/5"),children:[
    r.jsx("span",{children:"⚡"}),
    r.jsx("span",{children:"Product API Key, Endpoints & cURL"}),
    r.jsx("span",{className:"text-[9px] px-1.5 py-0.5 rounded-full bg-black/40 text-emerald-300 font-mono font-black",children:"LIVE GATEWAY"})
  ]}),
  r.jsxs("button",{type:"button",onClick:()=>setWpMode("reseller_api"),className:"flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer "+(wpMode==="reseller_api"?"bg-gradient-to-r from-[#00e5ff] to-[#8b5cf6] text-black font-extrabold shadow-[0_0_15px_rgba(0,229,255,0.4)]":"text-gray-400 hover:text-white hover:bg-white/5"),children:[
    r.jsx("span",{children:"🌐"}),
    r.jsx("span",{children:"Upstream Reseller Providers"}),
    r.jsx("span",{className:"text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-gray-300 font-mono font-semibold",children:"OUTBOUND"})
  ]})
]}),
wpMode==="website_api"&&r.jsxs("div",{className:"space-y-4",children:[
  r.jsxs("div",{className:"p-4 rounded-2xl bg-gradient-to-r from-[#171728] via-[#1a1435] to-[#121b2d] border border-cyan-500/30 shadow-[0_0_25px_rgba(0,229,255,0.1)] space-y-2",children:[
    r.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[
      r.jsxs("div",{className:"flex items-center gap-2",children:[
        r.jsx("div",{className:"w-7 h-7 rounded-lg bg-[#ff0080]/20 border border-[#ff0080]/50 flex items-center justify-center text-sm",children:"🔑"}),
        r.jsxs("div",{children:[
          r.jsx("h3",{className:"text-sm font-black text-white",children:"Product API Key System & Endpoints"}),
          r.jsx("p",{className:"text-[10px] text-gray-400",children:"Allow partner websites, child panels, and automated bots to buy Free Fire keys via your website."})
        ]})
      ]}),
      r.jsx("div",{className:"flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold",children:"● ONLINE: /api/v1 Active"})
    ]}),
    r.jsxs("div",{className:"flex flex-wrap items-center gap-2 pt-1 text-[11px]",children:[
      r.jsx("span",{className:"text-gray-400",children:"Website Base URL:"}),
      r.jsx("code",{className:"px-2 py-0.5 rounded-md bg-black/50 border border-white/10 text-cyan-300 font-mono font-bold text-[10px]",children:(typeof window!=="undefined"&&window.location.origin)?window.location.origin:"https://kalam-ff.com"})
    ]})
  ]}),
  r.jsxs("div",{className:"p-4 rounded-2xl bg-[#11111d] border border-white/10 space-y-3",children:[
    r.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[
      r.jsxs("div",{className:"space-y-0.5",children:[
        r.jsx("h4",{className:"text-xs font-bold text-white uppercase tracking-wider",children:"1. Your Website Product API Key"}),
        r.jsx("p",{className:"text-[10px] text-gray-400",children:"Clients and bots must send this key in the HTTP Header (Authorization: Bearer <KEY>) or query ?api_key=<KEY>"})
      ]}),
      r.jsxs("div",{className:"flex items-center gap-2",children:[
        r.jsxs("button",{type:"button",onClick:generateNewWpKey,className:"px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-gray-300 font-bold transition-all cursor-pointer flex items-center gap-1",children:[
          r.jsx("span",{children:"🔄"}),r.jsx("span",{children:"Generate New Key"})
        ]}),
        r.jsxs("button",{type:"button",onClick:copyWpKey,className:"px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 "+(wpKeyCopied?"bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]":"bg-gradient-to-r from-[#ff0080] to-[#8b5cf6] text-white shadow-[0_0_15px_rgba(255,0,128,0.3)]"),children:[
          r.jsx("span",{children:wpKeyCopied?"✓":"📋"}),
          r.jsx("span",{children:wpKeyCopied?"Copied!":"Copy API Key"})
        ]})
      ]})
    ]}),
    r.jsxs("div",{className:"flex items-center gap-2",children:[
      r.jsx("div",{className:"flex-1 relative",children:
        r.jsx("input",{type:showWpKey?"text":"password",readOnly:!0,value:wpKey,className:"w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold tracking-wider select-all"})
      }),
      r.jsx("button",{type:"button",onClick:()=>setShowWpKey(!showWpKey),className:"px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold cursor-pointer transition-all",children:showWpKey?"Hide":"Show"}),
      r.jsx("button",{type:"button",onClick:copyWpKey,className:"px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-400 text-xs font-bold cursor-pointer transition-all",children:wpKeyCopied?"✓ Copied":"Copy"})
    ]}),
    r.jsxs("div",{className:"flex flex-wrap items-center gap-2 pt-1",children:[
      r.jsx("span",{className:"text-[10px] text-gray-400 font-bold",children:"Active Permissions:"}),
      r.jsx("span",{className:"text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-semibold",children:"✓ order_keys (Buy Keys)"}),
      r.jsx("span",{className:"text-[9px] px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono font-semibold",children:"✓ read_products (Catalog)"}),
      r.jsx("span",{className:"text-[9px] px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono font-semibold",children:"✓ check_orders (Order Status)"}),
      r.jsx("span",{className:"text-[9px] px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-semibold",children:"✓ read_balance (Wallet)"})
    ]})
  ]}),
  r.jsxs("div",{className:"p-4 rounded-2xl bg-[#11111d] border border-white/10 space-y-2.5",children:[
    r.jsx("h4",{className:"text-xs font-bold text-white uppercase tracking-wider",children:"2. Website API Endpoints"}),
    r.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-2 text-xs",children:[
      r.jsxs("div",{onClick:()=>setWpCurlTab("buy"),className:"p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 "+(wpCurlTab==="buy"?"bg-[#ff0080]/10 border-[#ff0080]/50 text-white":"bg-black/40 border-white/5 text-gray-300 hover:border-white/20"),children:[
        r.jsxs("div",{className:"space-y-0.5",children:[
          r.jsxs("div",{className:"flex items-center gap-1.5",children:[
            r.jsx("span",{className:"px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-emerald-500/20 text-emerald-400",children:"POST"}),
            r.jsx("span",{className:"font-mono font-bold text-xs text-white",children:"/api/v1/order/create"})
          ]}),
          r.jsx("p",{className:"text-[10px] text-gray-400",children:"Buy / Deliver key for a product plan"})
        ]}),
        r.jsx("span",{className:"text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#ff0080] font-bold",children:"Select cURL"})
      ]}),
      r.jsxs("div",{onClick:()=>setWpCurlTab("products"),className:"p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 "+(wpCurlTab==="products"?"bg-[#8b5cf6]/10 border-[#8b5cf6]/50 text-white":"bg-black/40 border-white/5 text-gray-300 hover:border-white/20"),children:[
        r.jsxs("div",{className:"space-y-0.5",children:[
          r.jsxs("div",{className:"flex items-center gap-1.5",children:[
            r.jsx("span",{className:"px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-cyan-500/20 text-cyan-400",children:"GET"}),
            r.jsx("span",{className:"font-mono font-bold text-xs text-white",children:"/api/v1/products"})
          ]}),
          r.jsx("p",{className:"text-[10px] text-gray-400",children:"Fetch real-time products, plans & prices"})
        ]}),
        r.jsx("span",{className:"text-[10px] px-2 py-0.5 rounded bg-white/5 text-purple-400 font-bold",children:"Select cURL"})
      ]}),
      r.jsxs("div",{onClick:()=>setWpCurlTab("status"),className:"p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 "+(wpCurlTab==="status"?"bg-[#00e5ff]/10 border-[#00e5ff]/50 text-white":"bg-black/40 border-white/5 text-gray-300 hover:border-white/20"),children:[
        r.jsxs("div",{className:"space-y-0.5",children:[
          r.jsxs("div",{className:"flex items-center gap-1.5",children:[
            r.jsx("span",{className:"px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-cyan-500/20 text-cyan-400",children:"GET"}),
            r.jsx("span",{className:"font-mono font-bold text-xs text-white",children:"/api/v1/order/status"})
          ]}),
          r.jsx("p",{className:"text-[10px] text-gray-400",children:"Verify order status & retrieve delivered key"})
        ]}),
        r.jsx("span",{className:"text-[10px] px-2 py-0.5 rounded bg-white/5 text-cyan-400 font-bold",children:"Select cURL"})
      ]}),
      r.jsxs("div",{onClick:()=>setWpCurlTab("balance"),className:"p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 "+(wpCurlTab==="balance"?"bg-amber-500/10 border-amber-500/50 text-white":"bg-black/40 border-white/5 text-gray-300 hover:border-white/20"),children:[
        r.jsxs("div",{className:"space-y-0.5",children:[
          r.jsxs("div",{className:"flex items-center gap-1.5",children:[
            r.jsx("span",{className:"px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-amber-500/20 text-amber-400",children:"GET"}),
            r.jsx("span",{className:"font-mono font-bold text-xs text-white",children:"/api/v1/user/balance"})
          ]}),
          r.jsx("p",{className:"text-[10px] text-gray-400",children:"Query store wallet balance & currency"})
        ]}),
        r.jsx("span",{className:"text-[10px] px-2 py-0.5 rounded bg-white/5 text-amber-400 font-bold",children:"Select cURL"})
      ]})
    ]})
  ]}),
  r.jsxs("div",{className:"p-4 rounded-2xl bg-[#0d0d16] border border-cyan-500/40 shadow-[0_0_30px_rgba(0,229,255,0.15)] space-y-3",children:[
    r.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[
      r.jsxs("div",{className:"space-y-0.5",children:[
        r.jsxs("div",{className:"flex items-center gap-2",children:[
          r.jsx("h4",{className:"text-xs font-bold text-white uppercase tracking-wider",children:"3. Copyable cURL Command"}),
          r.jsx("span",{className:"px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-bold",children:"Ready to Run"})
        ]}),
        r.jsx("p",{className:"text-[10px] text-gray-400",children:"Copy and execute directly in bash, terminal, Postman, Python, or PHP."})
      ]}),
      r.jsxs("div",{className:"flex items-center gap-2",children:[
        r.jsxs("button",{type:"button",disabled:wpTesting,onClick:()=>runWpTest(wpCurlTab),className:"px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 "+(wpTesting?"bg-gray-700 text-gray-400 cursor-not-allowed":"bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]"),children:[
          r.jsx("span",{children:wpTesting?"⏳":"▶"}),
          r.jsx("span",{children:wpTesting?"Testing...":"Run Live Test"})
        ]}),
        r.jsxs("button",{type:"button",onClick:()=>copyWpCurl(getCurlSnippet(wpCurlTab)),className:"px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 "+(wpCurlCopied?"bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]":"bg-gradient-to-r from-[#ff0080] to-[#8b5cf6] text-white shadow-[0_0_15px_rgba(255,0,128,0.3)]"),children:[
          r.jsx("span",{children:wpCurlCopied?"✓":"📋"}),
          r.jsx("span",{children:wpCurlCopied?"cURL Copied!":"Copy cURL"})
        ]})
      ]})
    ]}),
    r.jsxs("div",{className:"flex flex-wrap gap-1.5 pt-1",children:[
      r.jsx("button",{type:"button",onClick:()=>setWpCurlTab("buy"),className:"px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer "+(wpCurlTab==="buy"?"bg-[#ff0080] text-white shadow-[0_0_12px_rgba(255,0,128,0.4)]":"bg-white/5 text-gray-400 hover:text-white"),children:"🛒 Buy Key cURL"}),
      r.jsx("button",{type:"button",onClick:()=>setWpCurlTab("products"),className:"px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer "+(wpCurlTab==="products"?"bg-[#8b5cf6] text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]":"bg-white/5 text-gray-400 hover:text-white"),children:"📦 Products List cURL"}),
      r.jsx("button",{type:"button",onClick:()=>setWpCurlTab("status"),className:"px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer "+(wpCurlTab==="status"?"bg-[#00e5ff] text-black font-extrabold shadow-[0_0_12px_rgba(0,229,255,0.4)]":"bg-white/5 text-gray-400 hover:text-white"),children:"🔍 Order Status cURL"}),
      r.jsx("button",{type:"button",onClick:()=>setWpCurlTab("balance"),className:"px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer "+(wpCurlTab==="balance"?"bg-amber-500 text-black font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.4)]":"bg-white/5 text-gray-400 hover:text-white"),children:"💰 Balance cURL"}),
      r.jsx("button",{type:"button",onClick:()=>setWpCurlTab("ping"),className:"px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer "+(wpCurlTab==="ping"?"bg-emerald-500 text-black font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.4)]":"bg-white/5 text-gray-400 hover:text-white"),children:"⚡ Ping cURL"})
    ]}),
    r.jsx("div",{className:"relative group",children:
      r.jsx("pre",{className:"p-3.5 rounded-xl bg-[#05050a] border border-white/10 text-cyan-300 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre select-all shadow-inner",children:getCurlSnippet(wpCurlTab)})
    }),
    (wpTesting||wpTestResult)&&r.jsxs("div",{className:"p-3.5 rounded-xl bg-[#06060c] border border-emerald-500/40 space-y-2",children:[
      r.jsxs("div",{className:"flex items-center justify-between text-xs",children:[
        r.jsxs("div",{className:"flex items-center gap-2",children:[
          r.jsx("span",{className:"w-2 h-2 rounded-full bg-emerald-400 animate-pulse"}),
          r.jsx("span",{className:"font-bold text-white",children:"Live Server Response:"}),
          wpTestStatus&&r.jsx("span",{className:"px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]",children:wpTestStatus})
        ]}),
        wpTestLatency&&r.jsxs("span",{className:"text-[10px] text-gray-400 font-mono",children:[wpTestLatency," ms latency"]})
      ]}),
      r.jsx("pre",{className:"p-2.5 rounded-lg bg-black/60 border border-white/5 text-emerald-300 font-mono text-[11px] max-h-48 overflow-y-auto whitespace-pre",children:wpTesting?"Executing request to /api/v1 gateway...":wpTestResult})
    ]})
  ]})
  ]})
]}),
wpMode==="reseller_api"&&r.jsxs(r.Fragment,{children:[r.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-2",children:[r.jsxs("div",{className:"space-y-1",children:[r.jsxs("div",{className:"flex items-center gap-2",children:[r.jsx("div",{className:"w-6 h-6 rounded-lg bg-[#00e5ff]/20 border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff]",children:r.jsx(T1,{className:"w-3.5 h-3.5"})}),r.jsx("h2",{className:"text-base font-extrabold text-white",children:"Reseller Admin API Setup"})]}),r.jsx("p",{className:"text-[11px] text-gray-300 leading-relaxed font-medium",children:"Configure upstream reseller APIs anytime. You can edit credentials, switch API protocols, test live connections, or add new servers."})]}),r.jsxs("div",{className:"flex items-center gap-2 self-start sm:self-auto flex-wrap",children:[r.jsxs("button",{onClick:()=>u(!0),className:"px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all",children:[r.jsx(jl,{className:"w-3.5 h-3.5 text-purple-400"}),r.jsx("span",{children:"Webhook URL"})]}),t&&r.jsxs("button",{onClick:()=>i(!a),className:"px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00e5ff]/20 to-[#8b5cf6]/20 border border-[#00e5ff]/40 hover:border-[#00e5ff] text-[#00e5ff] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all",children:[r.jsx(Aa,{className:"w-3.5 h-3.5"}),r.jsx("span",{children:a?"Cancel":"Add New Reseller API"})]})]})]}),a&&r.jsxs(Ge.form,{initial:{opacity:0,y:-8},animate:{opacity:1,y:0},onSubmit:j,className:"p-4 rounded-2xl bg-[#1a103c]/90 border border-purple-500/40 space-y-3",children:[r.jsxs("div",{className:"flex items-center justify-between",children:[r.jsxs("div",{className:"flex items-center gap-2 text-white text-xs font-bold",children:[r.jsx(Aa,{className:"w-4 h-4 text-purple-400"}),r.jsx("span",{children:"Connect New Reseller Provider"})]}),r.jsx("button",{type:"button",onClick:()=>i(!1),className:"text-gray-400 hover:text-white text-xs",children:"Close"})]}),r.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs",children:[r.jsxs("div",{children:[r.jsx("label",{className:"text-[10px] text-gray-400 block mb-1",children:"API Provider Name"}),r.jsx("input",{type:"text",value:d,onChange:_=>h(_.target.value),placeholder:"e.g. Modz Reseller Server #3",className:"w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white",required:!0})]}),r.jsxs("div",{children:[r.jsx("label",{className:"text-[10px] text-gray-400 block mb-1",children:"API Type / Protocol"}),r.jsxs("select",{value:w,onChange:_=>S(_.target.value),className:"w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white",children:[r.jsx("option",{value:"adminpanels",children:"AdminPanels.shop (PHP Master Key)"}),r.jsx("option",{value:"hkmodz",children:"HK MODZ (X-API-Token Bearer)"}),r.jsx("option",{value:"freepanel",children:"FreePanel Instant API"}),r.jsx("option",{value:"custom",children:"Custom Universal REST API"})]})]})]}),r.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs",children:[r.jsxs("div",{children:[r.jsx("label",{className:"text-[10px] text-gray-400 block mb-1",children:"Endpoint URL"}),r.jsx("input",{type:"text",value:p,onChange:_=>g(_.target.value),placeholder:"https://api.yourprovider.com/reseller",className:"w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono",required:!0})]}),r.jsxs("div",{children:[r.jsx("label",{className:"text-[10px] text-gray-400 block mb-1",children:"API Key / Token"}),r.jsx("input",{type:"text",value:b,onChange:_=>x(_.target.value),placeholder:"Enter reseller API secret key",className:"w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono",required:!0})]})]}),r.jsxs("div",{className:"flex justify-end gap-2 pt-1",children:[r.jsx("button",{type:"button",onClick:()=>i(!1),className:"px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-semibold",children:"Cancel"}),r.jsx("button",{type:"submit",className:"px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-md cursor-pointer",children:"Add API Endpoint"})]})]}),r.jsx("div",{className:"space-y-3.5",children:n.map(_=>r.jsxs("div",{className:"relative",children:[r.jsx(Qte,{config:_,onSave:e}),s&&n.length>1&&r.jsx("div",{className:"flex justify-end pt-1 pr-1",children:r.jsxs("button",{onClick:()=>s(_.id),className:"text-[10px] text-rose-400/80 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors",children:[r.jsx(Fo,{className:"w-3 h-3"}),r.jsx("span",{children:"Remove this API endpoint"})]})})]},_.id))}),r.jsxs("div",{className:"p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2",children:[r.jsxs("div",{className:"flex items-center gap-2 text-xs font-bold text-gray-200",children:[r.jsx(Sr,{className:"w-3.5 h-3.5 text-yellow-400"}),r.jsx("span",{children:"Upstream Error Troubleshooting Guide"})]}),r.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-gray-400",children:[r.jsxs("div",{className:"p-2 rounded-xl bg-white/5 border border-white/5 space-y-1",children:[r.jsx("span",{className:"text-rose-400 font-mono font-bold block text-[10px]",children:'"Invalid API Key / Access Denied"'}),r.jsx("p",{className:"leading-snug",children:"Verify your reseller key in your upstream account profile (e.g. adminpanels.shop) and check that API privileges are enabled."})]}),r.jsxs("div",{className:"p-2 rounded-xl bg-white/5 border border-white/5 space-y-1",children:[r.jsx("span",{className:"text-amber-400 font-mono font-bold block text-[10px]",children:'"Insufficient Balance / 0 Credits"'}),r.jsx("p",{className:"leading-snug",children:"Your upstream reseller portal wallet is empty. Top up credits on the provider website to generate new keys."})]})]})]}),r.jsx(cR,{isOpen:l,onClose:()=>u(!1)})]})]})}