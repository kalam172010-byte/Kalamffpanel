const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

function getPremiumDepositTabCode() {
  return `a==="deposit"&&r.jsxs("div",{className:"space-y-4 max-w-2xl mx-auto",children:[
  // Top Hero Card with Balance & Instant Launch
  r.jsxs("div",{className:"relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#120d28] via-[#0b0818] to-[#06040e] border border-cyan-500/35 shadow-[0_0_50px_rgba(0,229,255,0.15)] space-y-4",children:[
    // Ambient light flare
    r.jsx("div",{className:"absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"}),
    r.jsx("div",{className:"absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"}),
    
    // Header row
    r.jsxs("div",{className:"flex items-center justify-between relative z-10",children:[
      r.jsxs("div",{className:"flex items-center gap-2.5",children:[
        r.jsx("div",{className:"w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 p-[1px] shadow-[0_0_15px_rgba(0,229,255,0.3)]",children:[
          r.jsx("div",{className:"w-full h-full rounded-2xl bg-[#0e0a20] flex items-center justify-center text-lg",children:"👑"})
        ]}),
        r.jsxs("div",{children:[
          r.jsx("h2",{className:"text-base font-black text-white uppercase tracking-wider",children:"VIP Instant Deposit Hub"}),
          r.jsx("p",{className:"text-[10.5px] text-cyan-300 font-medium",children:"Direct NPCI UPI 2.0 Webhook Settlement"})
        ]})
      ]}),
      r.jsxs("div",{className:"flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 font-mono text-[10px] text-emerald-300 font-bold",children:[
        r.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"}),
        r.jsx("span",{children:"2.4s AUTO-CREDIT"})
      ]})
    ]}),

    // Balance Display box
    r.jsxs("div",{className:"p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10",children:[
      r.jsxs("div",{className:"space-y-0.5",children:[
        r.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider text-gray-400",children:"Current Wallet Balance"}),
        r.jsxs("div",{className:"text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] via-white to-[#c084fc] tracking-tight",children:[
          "₹",typeof lo==="number"?lo.toFixed(2):lo
        ]}),
        r.jsx("p",{className:"text-[10px] text-emerald-400 font-medium",children:"100% Value Guarantee • 0% Extra Fees on all deposits"})
      ]}),
      r.jsxs("button",{
        onClick:()=>Vt(()=>dt(!0),"Deposit Terminal"),
        className:"px-5 py-3 rounded-xl bg-gradient-to-r from-[#00e5ff] via-[#8b5cf6] to-[#ff0080] text-white font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,229,255,0.4)] hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 border border-white/20",
        children:[
          r.jsx("span",{children:"⚡"}),
          r.jsx("span",{children:"Open Deposit Window"})
        ]
      })
    ]})
  ]}),

  // 3-Step Process Guide
  r.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-2.5",children:[
    r.jsxs("div",{className:"p-3.5 rounded-2xl bg-[#0f0b20] border border-white/10 space-y-1.5 relative overflow-hidden",children:[
      r.jsxs("div",{className:"flex items-center justify-between",children:[
        r.jsx("span",{className:"text-lg",children:"1️⃣"}),
        r.jsx("span",{className:"text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold",children:"STEP 1"})
      ]}),
      r.jsx("h4",{className:"text-xs font-bold text-white",children:"Set Deposit Amount"}),
      r.jsx("p",{className:"text-[10.5px] text-gray-400 leading-relaxed",children:"Choose any amount from ₹1 to ₹50,000 with zero processing commission."})
    ]}),
    r.jsxs("div",{className:"p-3.5 rounded-2xl bg-[#0f0b20] border border-white/10 space-y-1.5 relative overflow-hidden",children:[
      r.jsxs("div",{className:"flex items-center justify-between",children:[
        r.jsx("span",{className:"text-lg",children:"2️⃣"}),
        r.jsx("span",{className:"text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold",children:"STEP 2"})
      ]}),
      r.jsx("h4",{className:"text-xs font-bold text-white",children:"Scan Dynamic UPI QR"}),
      r.jsx("p",{className:"text-[10.5px] text-gray-400 leading-relaxed",children:"Pay instantly using Google Pay, PhonePe, Paytm, BHIM, or any UPI app."})
    ]}),
    r.jsxs("div",{className:"p-3.5 rounded-2xl bg-[#0f0b20] border border-white/10 space-y-1.5 relative overflow-hidden",children:[
      r.jsxs("div",{className:"flex items-center justify-between",children:[
        r.jsx("span",{className:"text-lg",children:"3️⃣"}),
        r.jsx("span",{className:"text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold",children:"STEP 3"})
      ]}),
      r.jsx("h4",{className:"text-xs font-bold text-white",children:"Instant Auto-Credit"}),
      r.jsx("p",{className:"text-[10.5px] text-gray-400 leading-relaxed",children:"Funds appear in your wallet in < 3 seconds via real-time bank webhooks."})
    ]})
  ]}),

  // Trust Badges Grid
  r.jsxs("div",{className:"p-4 rounded-2xl bg-black/40 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center",children:[
    r.jsxs("div",{className:"space-y-1",children:[
      r.jsx("div",{className:"text-base",children:"🛡️"}),
      r.jsx("div",{className:"text-[11px] font-bold text-white",children:"NPCI UPI 2.0"}),
      r.jsx("div",{className:"text-[9px] text-gray-400",children:"RBI Regulated Gateway"})
    ]}),
    r.jsxs("div",{className:"space-y-1",children:[
      r.jsx("div",{className:"text-base",children:"⚡"}),
      r.jsx("div",{className:"text-[11px] font-bold text-white",children:"2.4s Speed"}),
      r.jsx("div",{className:"text-[9px] text-gray-400",children:"Automated Bank Webhook"})
    ]}),
    r.jsxs("div",{className:"space-y-1",children:[
      r.jsx("div",{className:"text-base",children:"💎"}),
      r.jsx("div",{className:"text-[11px] font-bold text-white",children:"0% Extra Fees"}),
      r.jsx("div",{className:"text-[9px] text-gray-400",children:"Exact 1:1 Value Added"})
    ]}),
    r.jsxs("div",{className:"space-y-1",children:[
      r.jsx("div",{className:"text-base",children:"🔄"}),
      r.jsx("div",{className:"text-[11px] font-bold text-white",children:"Instant UTR Claim"}),
      r.jsx("div",{className:"text-[9px] text-gray-400",children:"Self-Service Recovery"})
    ]})
  ]}),

  // Big Glowing Launch Action
  r.jsxs("button",{
    onClick:()=>Vt(()=>dt(!0),"Deposit Terminal"),
    className:"w-full py-4 rounded-2xl bg-gradient-to-r from-[#00e5ff] via-[#8b5cf6] to-[#ff0080] text-white font-black text-sm uppercase tracking-wider shadow-[0_0_35px_rgba(0,229,255,0.45)] hover:shadow-[0_0_45px_rgba(124,58,237,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20",
    children:[
      r.jsx("span",{children:"⚡"}),
      r.jsx("span",{children:"Launch VIP Deposit Terminal Now ➔"})
    ]
  })
]})`;
}

function updateDepositTab(filePath) {
  console.log('Processing deposit tab in:', filePath);
  let code = fs.readFileSync(filePath, 'utf8');

  const target = `a==="deposit"&&r.jsxs("div",{className:"space-y-4",children:[r.jsx("h2",{className:"text-base font-extrabold text-white",children:"Deposit Wallet Cash"}),r.jsxs("div",{className:"p-4 rounded-2xl bg-[#161622] border border-[#00e5ff]/30 text-center space-y-3",children:[r.jsx("p",{className:"text-xs text-gray-300",children:"Open the deposit terminal to generate instant UPI QR code with automated payment verification."}),r.jsx("button",{onClick:()=>Vt(()=>dt(!0),"Deposit Terminal"),className:"px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#00b4d8] text-[#0a0a0f] font-extrabold text-xs shadow-[0_0_20px_rgba(0,229,255,0.4)] cursor-pointer",children:"Open Deposit Window"})]})]})`;

  if (!code.includes(target)) {
    console.error('Target not found in', filePath);
    return false;
  }

  const replacement = getPremiumDepositTabCode();
  const finalCode = code.replace(target, replacement);

  try {
    esbuild.transformSync(finalCode, { loader: 'js' });
    console.log('Validation PASSED for deposit tab in', filePath);
    fs.writeFileSync(filePath, finalCode, 'utf8');
    return true;
  } catch (err) {
    console.error('Validation FAILED for deposit tab in', filePath, err);
    return false;
  }
}

const p1 = updateDepositTab(path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js'));
const p2 = updateDepositTab(path.join(__dirname, '..', 'dist', 'assets', 'index-BvHT743v.js'));

if (p1 && p2) {
  console.log('SUCCESSFULLY UPGRADED DEPOSIT TAB TO ADVANCE LEVEL PREMIUM!');
} else {
  console.error('FAILED TO UPDATE DEPOSIT TAB');
  process.exit(1);
}
