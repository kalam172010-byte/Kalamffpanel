const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

function patchPaymentSyncUI(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist:', filePath);
    return false;
  }

  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Add test-payment-sync states and function inside `ane`
  // We locate the return statement of ane:
  // `return r.jsxs("div",{className:"space-y-4",id:"admin-upi-payment-view",children:[`
  const aneReturnSignature = 'return r.jsxs("div",{className:"space-y-4",id:"admin-upi-payment-view",children:[';
  if (!code.includes(aneReturnSignature)) {
    console.error('aneReturnSignature not found in', filePath);
    return false;
  }

  if (!code.includes('runTestPaymentSync=')) {
    const syncLogic = [
      'const[syncTesting,setSyncTesting]=q.useState(!1),',
      '[syncResult,setSyncResult]=q.useState(null),',
      '[syncTab,setSyncTab]=q.useState("matrix"),',
      '[syncAmount,setSyncAmount]=q.useState(10),',
      '[showSyncInspector,setShowSyncInspector]=q.useState(!1);',
      'const runTestPaymentSync=async(amt)=>{',
        'setSyncTesting(!0);setShowSyncInspector(!0);',
        'const targetAmt=Number(amt!==undefined?amt:syncAmount)||10;',
        'const{cleanUrl:cUrl,cleanKey:cKey}=Pt(w,b,d);',
        'try{',
          'const res=await fetch("/api/test-payment-sync",{',
            'method:"POST",',
            'headers:{"Content-Type":"application/json"},',
            'body:JSON.stringify({apiKey:cKey,gatewayUrl:cUrl,merchantUpi:j||"kalamffpanel@fampay",gateway:d,amount:targetAmt})',
          '});',
          'const data=await res.json();',
          'setSyncResult(data);',
        '}catch(err){',
          'setSyncResult({success:!1,overallVerdict:"FAILED",error:err.message||"Failed to run payment sync test",summary:"Error connecting to server: "+(err.message||"Network request failed")});',
        '}finally{',
          'setSyncTesting(!1);',
        '}',
      '};'
    ].join('');

    code = code.replace(aneReturnSignature, syncLogic + aneReturnSignature);
    changed = true;
    console.log('[1] Injected sync state & runTestPaymentSync handler in ane');
  }

  // 2. Replace the 2-button grid in ane with a 3-button grid that includes the "⚡ Test Payment Sync" button
  const targetButtons = 'r.jsxs("div",{className:"grid grid-cols-2 gap-2 pt-1",children:[r.jsx("button",{onClick:Ot,className:"py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-1.5 cursor-pointer transition-all",children:z?r.jsxs(r.Fragment,{children:[r.jsx(Sn,{className:"w-4 h-4"}),r.jsx("span",{children:"Gateway Saved!"})]}):r.jsx("span",{children:"Save Gateway Config"})}),r.jsxs("button",{onClick:Mn,disabled:Ut,className:"py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all",children:[r.jsx(Cr,{className:`w-4 h-4 ${Ut?"animate-spin":""}`}),r.jsx("span",{children:Ut?"Testing...":"Test Connection"})]})]})';

  if (code.includes(targetButtons)) {
    const newButtonsAndInspector = [
      'r.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1",children:[',
        'r.jsx("button",{type:"button",onClick:Ot,className:"py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-1.5 cursor-pointer transition-all",children:z?r.jsxs(r.Fragment,{children:[r.jsx(Sn,{className:"w-4 h-4"}),r.jsx("span",{children:"Gateway Saved!"})]}):r.jsx("span",{children:"Save Gateway Config"})}),',
        'r.jsxs("button",{type:"button",onClick:Mn,disabled:Ut,className:"py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 font-bold text-xs border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all",children:[r.jsx(Cr,{className:`w-4 h-4 ${Ut?"animate-spin":""}`}),r.jsx("span",{children:Ut?"Testing...":"Test Connection"})]}),',
        'r.jsxs("button",{type:"button",id:"btn-test-payment-sync",onClick:()=>runTestPaymentSync(),disabled:syncTesting,className:"py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-xs shadow-[0_0_20px_rgba(147,51,234,0.45)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all border border-purple-400/40",children:[r.jsx(Ms,{className:`w-4 h-4 text-purple-200 ${syncTesting?"animate-spin":""}`}),r.jsx("span",{children:syncTesting?"Testing Live Sync...":"⚡ Test Payment Sync"})]})',
      ']}),',

      // Test Payment Sync Inspector Card
      '(showSyncInspector||syncResult)&&r.jsxs("div",{className:"p-4 rounded-2xl bg-[#110d22]/98 border-2 border-purple-500/40 shadow-[0_0_30px_rgba(147,51,234,0.2)] space-y-3.5 backdrop-blur-md mt-3",id:"test-payment-sync-inspector",children:[',
        // Top row
        'r.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-white/10",children:[',
          'r.jsxs("div",{className:"flex items-center gap-2.5",children:[',
            'r.jsx("div",{className:"w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.25)]",children:r.jsx(Cr,{className:"w-4 h-4 text-purple-400"})}),',
            'r.jsxs("div",{children:[',
              'r.jsxs("div",{className:"flex items-center gap-2",children:[',
                'r.jsx("h3",{className:"text-xs font-black text-white uppercase tracking-wider",children:"Live Payment Sync & Response Parser"}),',
                'r.jsx("span",{className:"px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9.5px] font-mono font-bold",children:"POST /api/test-payment-sync"})',
              ']}),',
              'r.jsx("p",{className:"text-[10px] text-gray-400",children:"Validates configured gateway response parser against a live request and compares with production expected values."})',
            ']})',
          ']}),',
          'r.jsxs("div",{className:"flex items-center gap-2",children:[',
            // Amount pills
            'r.jsxs("div",{className:"flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 text-[10px] font-mono",children:[',
              'r.jsx("span",{className:"text-gray-400 px-1",children:"Test Amt:"}),',
              '[10,50,100].map(amt=>r.jsx("button",{key:amt,type:"button",onClick:()=>{setSyncAmount(amt);runTestPaymentSync(amt)},className:`px-2 py-0.5 rounded cursor-pointer font-bold transition-all ${syncAmount===amt?"bg-purple-600 text-white":"text-gray-300 hover:text-white hover:bg-white/10"}`,children:`₹${amt}`}))',
            ']}),',
            'r.jsxs("button",{type:"button",onClick:()=>runTestPaymentSync(),disabled:syncTesting,className:"px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all",children:[',
              'r.jsx(Ms,{className:`w-3.5 h-3.5 ${syncTesting?"animate-spin":""}`}),',
              'r.jsx("span",{children:syncTesting?"Testing...":"Re-test Sync"})',
            ']}),',
            'r.jsx("button",{type:"button",onClick:()=>setShowSyncInspector(!1),className:"p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer text-xs",title:"Close Inspector",children:"✕"})',
          ']})',
        ']}),',

        // Body content
        'syncTesting?r.jsxs("div",{className:"py-8 flex flex-col items-center justify-center space-y-3",children:[',
          'r.jsx(Ms,{className:"w-8 h-8 text-purple-400 animate-spin"}),',
          'r.jsx("p",{className:"text-xs text-purple-200 font-bold",children:"Sending live order creation request & testing response parser..."}),',
          'r.jsx("p",{className:"text-[10px] text-gray-400 font-mono",children:"Testing upstream gateway API + checkout status sync verification"})',
        ']}):syncResult?r.jsxs("div",{className:"space-y-3",children:[',
          // Verdict Banner
          'r.jsxs("div",{className:`p-3 rounded-xl border flex items-center justify-between flex-wrap gap-2 ${syncResult.overallVerdict==="PRODUCTION_READY"?"bg-emerald-500/15 border-emerald-500/40 text-emerald-300":syncResult.overallVerdict==="PASSED_WITH_WARNINGS"?"bg-yellow-500/15 border-yellow-500/40 text-yellow-300":"bg-red-500/15 border-red-500/40 text-red-300"}`,children:[',
            'r.jsxs("div",{className:"flex items-center gap-2",children:[',
              'syncResult.overallVerdict==="PRODUCTION_READY"?r.jsx(Sn,{className:"w-5 h-5 text-emerald-400 shrink-0"}):r.jsx(Cr,{className:"w-5 h-5 text-yellow-400 shrink-0"}),',
              'r.jsxs("div",{children:[',
                'r.jsx("div",{className:"text-xs font-black tracking-wide",children:syncResult.overallVerdict==="PRODUCTION_READY"?"PRODUCTION READY — PARSER VERIFIED 100%":syncResult.overallVerdict==="PASSED_WITH_WARNINGS"?"LIVE CALL PASSED (ATTENTION TO WARNINGS)":"GATEWAY PARSER TEST FAILED"}),',
                'r.jsx("div",{className:"text-[10.5px] opacity-90 mt-0.5",children:syncResult.summary})',
              ']})',
            ']}),',
            'r.jsxs("div",{className:"flex items-center gap-2 font-mono text-[10px]",children:[',
              'syncResult.durationMs?r.jsxs("span",{className:"px-2 py-0.5 rounded bg-black/40 border border-white/10 text-gray-300",children:["⏱ ",syncResult.durationMs,"ms"]}):null,',
              'syncResult.httpStatus?r.jsxs("span",{className:"px-2 py-0.5 rounded bg-black/40 border border-white/10 text-cyan-300 font-bold",children:["HTTP ",syncResult.httpStatus]}):null',
            ']})',
          ']}),',

          // Tabs Navigation
          'r.jsxs("div",{className:"flex items-center gap-1.5 border-b border-white/10 pb-1 text-xs font-bold",children:[',
            'r.jsxs("button",{type:"button",onClick:()=>setSyncTab("matrix"),className:`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${syncTab==="matrix"?"bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]":"text-gray-400 hover:text-white hover:bg-white/5"}`,children:[',
              'r.jsx("span",{children:"📊 Production Comparison Matrix"}),',
              'syncResult.productionExpectedValues?r.jsx("span",{className:"px-1.5 py-0.2 rounded-full bg-white/20 text-[9px] font-mono",children:syncResult.productionExpectedValues.length}):null',
            ']}),',
            'r.jsx("button",{type:"button",onClick:()=>setSyncTab("parsed"),className:`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${syncTab==="parsed"?"bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]":"text-gray-400 hover:text-white hover:bg-white/5"}`,children:"⚡ Parsed Data"}),',
            'r.jsx("button",{type:"button",onClick:()=>setSyncTab("raw"),className:`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${syncTab==="raw"?"bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]":"text-gray-400 hover:text-white hover:bg-white/5"}`,children:"🌐 Raw Gateway Response"}),',
            'r.jsx("button",{type:"button",onClick:()=>setSyncTab("status"),className:`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${syncTab==="status"?"bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]":"text-gray-400 hover:text-white hover:bg-white/5"}`,children:"🔄 Status Polling Sync"})',
          ']}),',

          // Tab 1: Comparison Matrix
          'syncTab==="matrix"&&r.jsxs("div",{className:"space-y-2",children:[',
            'r.jsx("div",{className:"overflow-x-auto rounded-xl border border-white/10 bg-black/40",children:',
              'r.jsxs("table",{className:"w-full text-left text-xs",children:[',
                'r.jsx("thead",{className:"bg-white/5 text-[10px] text-gray-400 uppercase font-mono border-b border-white/10",children:',
                  'r.jsxs("tr",{children:[',
                    'r.jsx("th",{className:"py-2.5 px-3",children:"Gateway Field"}),',
                    'r.jsx("th",{className:"py-2.5 px-3",children:"Expected Production Schema"}),',
                    'r.jsx("th",{className:"py-2.5 px-3",children:"Actual Live Parsed Value"}),',
                    'r.jsx("th",{className:"py-2.5 px-3 text-center",children:"Parser Status"}),',
                    'r.jsx("th",{className:"py-2.5 px-3",children:"Production Verification"})',
                  ']})',
                '}),',
                'r.jsx("tbody",{className:"divide-y divide-white/5 text-[11px]",children:',
                  '(syncResult.productionExpectedValues||[]).map((row,idx)=>r.jsxs("tr",{key:idx,className:"hover:bg-white/5 transition-colors",children:[',
                    'r.jsxs("td",{className:"py-2.5 px-3 font-bold text-white",children:[',
                      'r.jsx("div",{children:row.label}),',
                      'r.jsx("div",{className:"text-[9px] font-mono text-gray-400",children:row.field})',
                    ']}),',
                    'r.jsx("td",{className:"py-2.5 px-3 font-mono text-[10px] text-gray-300 max-w-xs break-all",children:row.expectedPattern}),',
                    'r.jsx("td",{className:"py-2.5 px-3 font-mono text-[10px] text-purple-300 max-w-xs break-all font-bold",children:row.actualParsedValue!==null&&row.actualParsedValue!==undefined?String(row.actualParsedValue):"null"}),',
                    'r.jsx("td",{className:"py-2.5 px-3 text-center",children:',
                      'row.status==="PASS"?r.jsx("span",{className:"px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9.5px] font-black font-mono",children:"✓ PASS"}):',
                      'row.status==="WARN"?r.jsx("span",{className:"px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-[9.5px] font-black font-mono",children:"⚠ WARN"}):',
                      'r.jsx("span",{className:"px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[9.5px] font-black font-mono",children:"✕ FAIL"})',
                    '}),',
                    'r.jsx("td",{className:"py-2.5 px-3 text-[10px] text-gray-300",children:row.details})',
                  ']}))',
                '})',
              ']})',
            '}),',
          ']}),',

          // Tab 2: Parsed Data
          'syncTab==="parsed"&&r.jsxs("div",{className:"space-y-2",children:[',
            'r.jsx("div",{className:"text-[10px] text-gray-400 font-mono",children:"Data structure emitted by production response parser and used by client deposit modal:"}),',
            'r.jsx("pre",{className:"p-3 rounded-xl bg-black/90 border border-white/10 font-mono text-[10.5px] text-purple-200 overflow-x-auto max-h-72",children:JSON.stringify(syncResult.parsedData,null,2)})',
          ']}),',

          // Tab 3: Raw Gateway Response
          'syncTab==="raw"&&r.jsxs("div",{className:"space-y-2",children:[',
            'r.jsxs("div",{className:"flex items-center justify-between text-[10px] text-gray-400 font-mono",children:[',
              'r.jsx("span",{children:"Exact unadulterated payload received from live upstream gateway:"}),',
              'r.jsxs("span",{className:"text-cyan-300 font-bold",children:["Endpoint: ",syncResult.endpoint]})',
            ']}),',
            'r.jsx("pre",{className:"p-3 rounded-xl bg-black/90 border border-white/10 font-mono text-[10.5px] text-gray-300 overflow-x-auto max-h-72",children:JSON.stringify(syncResult.rawResponse,null,2)})',
          ']}),',

          // Tab 4: Status Polling Sync
          'syncTab==="status"&&r.jsxs("div",{className:"space-y-2",children:[',
            'r.jsx("div",{className:"text-[10px] text-gray-400 font-mono",children:"Auto-detection status verification test (checks checkout-status.php / verify-order.php for this test order):"}),',
            'syncResult.statusSyncResult?r.jsxs("div",{className:"p-3 rounded-xl bg-black/60 border border-white/10 space-y-2",children:[',
              'r.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs",children:[',
                'r.jsxs("div",{className:"p-2 rounded bg-black/50 border border-white/5",children:[r.jsx("div",{className:"text-[9px] text-gray-400 font-mono uppercase",children:"Parsed Status"}),r.jsx("div",{className:"text-cyan-300 font-bold font-mono",children:syncResult.statusSyncResult.parsedStatus})]}),',
                'r.jsxs("div",{className:"p-2 rounded bg-black/50 border border-white/5",children:[r.jsx("div",{className:"text-[9px] text-gray-400 font-mono uppercase",children:"Is Paid Flag"}),r.jsx("div",{className:"text-emerald-400 font-bold font-mono",children:String(syncResult.statusSyncResult.parsedIsPaid)})]}),',
                'r.jsxs("div",{className:"p-2 rounded bg-black/50 border border-white/5",children:[r.jsx("div",{className:"text-[9px] text-gray-400 font-mono uppercase",children:"HTTP Code"}),r.jsx("div",{className:"text-white font-bold font-mono",children:syncResult.statusSyncResult.httpStatus})]}),',
                'r.jsxs("div",{className:"p-2 rounded bg-black/50 border border-white/5",children:[r.jsx("div",{className:"text-[9px] text-gray-400 font-mono uppercase",children:"Verification Time"}),r.jsx("div",{className:"text-yellow-300 font-bold font-mono",children:`${syncResult.statusSyncResult.verificationDurationMs}ms`})]}),',
              ']}),',
              'r.jsx("pre",{className:"p-2.5 rounded bg-black/90 border border-white/5 font-mono text-[10px] text-gray-300 overflow-x-auto max-h-48",children:JSON.stringify(syncResult.statusSyncResult.rawStatusResponse,null,2)})',
            ']}):r.jsx("div",{className:"p-3 rounded-xl bg-black/40 text-gray-400 text-xs italic",children:"Status verification test not triggered (requires order reference from upstream gateway)."})',
          ']})',

        ']}):null',
      ']}),'
    ].join('');

    code = code.replace(targetButtons, newButtonsAndInspector);
    changed = true;
    console.log('[2] Injected 3-button layout and Live Payment Sync Inspector into ane');
  } else {
    console.warn('targetButtons not found in', filePath);
  }

  if (changed) {
    try {
      esbuild.transformSync(code, { loader: 'js', sourcefile: path.basename(filePath) });
      fs.writeFileSync(filePath, code, 'utf8');
      console.log('Successfully validated and saved:', filePath);
      return true;
    } catch (err) {
      console.error('Validation failed for', filePath, err.message);
      process.exit(1);
    }
  } else {
    console.log('No changes made to:', filePath);
    return false;
  }
}

// Apply to public/assets and dist/assets
['public/assets/index-BvHT743v.js', 'dist/assets/index-BvHT743v.js'].forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    patchPaymentSyncUI(fullPath);
  }
});
