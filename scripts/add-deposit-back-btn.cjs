const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const filePath = path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js');

if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

let code = fs.readFileSync(filePath, 'utf8');

// 1. Header with mobile-responsive Back button in Deposit Window
const oldHeader = `// Luxury Top Header
        u!=="SUCCESS"&&r.jsxs("div",{className:"flex items-center justify-between pb-3.5 border-b border-white/10",children:[r.jsxs("div",{className:"flex items-center gap-2.5",children:[r.jsx("div",{className:"w-8 h-8 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff]",children:r.jsx(Lp,{className:"w-4 h-4"})}),r.jsxs("div",{children:[r.jsx("h3",{className:"text-sm font-bold text-white uppercase tracking-wider",children:"Deposit Wallet Cash"}),r.jsxs("p",{className:"text-[10px] text-gray-400 font-mono",children:["Min: ₹",s.minDeposit||1," • Instant Auto Credit"]})]})]}),r.jsx("button",{onClick:e,className:"w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors",children:r.jsx(hs,{className:"w-4 h-4"})})]}),`;

const newHeader = `// Luxury Top Header with Mobile-Responsive Back Button
        u!=="SUCCESS"&&r.jsxs("div",{className:"flex items-center justify-between pb-3.5 border-b border-white/10 gap-2",children:[
          r.jsxs("div",{className:"flex items-center gap-2 min-w-0",children:[
            r.jsxs("button",{
              type:"button",
              onClick:()=>{if(u==="QR"||u==="GENERATING"){d("AMOUNT")}else{e()}},
              className:"flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 active:scale-95 border border-cyan-400/40 text-cyan-300 hover:text-cyan-200 font-extrabold text-xs shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all cursor-pointer shrink-0 select-none",
              "aria-label":"Go Back",
              children:[
                r.jsx("svg",{className:"w-4 h-4 shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2.5",d:"M15 19l-7-7 7-7"})}),
                r.jsx("span",{children:"Back"})
              ]
            }),
            r.jsxs("div",{className:"flex items-center gap-2 min-w-0",children:[
              r.jsx("div",{className:"w-7 h-7 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff] shrink-0",children:r.jsx(Lp,{className:"w-3.5 h-3.5"})}),
              r.jsxs("div",{className:"min-w-0",children:[
                r.jsx("h3",{className:"text-xs sm:text-sm font-bold text-white uppercase tracking-wider truncate",children:"Deposit Wallet"}),
                r.jsxs("p",{className:"text-[9px] text-gray-400 font-mono truncate",children:["Min: ₹",s.minDeposit||1," • Instant Credit"]})
              ]})
            ]})
          ]}),
          r.jsx("button",{onClick:e,className:"w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors shrink-0",title:"Close (X)",children:r.jsx(hs,{className:"w-4 h-4"})})
        ]}),`;

if (!code.includes(oldHeader)) {
  console.error('Failed to locate oldHeader in bundle');
  process.exit(1);
}
code = code.replace(oldHeader, newHeader);

// 2. Amount step bottom back button
const oldAmountBtn = `r.jsx(Lp,{className:"w-4 h-4 text-cyan-300"}),
              r.jsxs("span",{children:["Generate UPI QR (₹",i,")"]})
            ]
          })
        ]}),

        // ===================== STEP: GENERATING =====================`;

const newAmountBtn = `r.jsx(Lp,{className:"w-4 h-4 text-cyan-300"}),
              r.jsxs("span",{children:["Generate UPI QR (₹",i,")"]})
            ]
          }),
          r.jsxs("button",{
            type:"button",
            onClick:e,
            className:"w-full py-2.5 min-h-[42px] rounded-xl bg-white/5 hover:bg-white/10 active:scale-98 border border-white/10 text-gray-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm",
            children:[
              r.jsx("svg",{className:"w-4 h-4 shrink-0 text-gray-400",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2.5",d:"M15 19l-7-7 7-7"})}),
              r.jsx("span",{children:"Back to Store"})
            ]
          })
        ]}),

        // ===================== STEP: GENERATING =====================`;

if (!code.includes(oldAmountBtn)) {
  console.error('Failed to locate oldAmountBtn in bundle');
  process.exit(1);
}
code = code.replace(oldAmountBtn, newAmountBtn);

// 3. QR step bottom back button
const oldFooterTrust = `// Footer Trust
          r.jsxs("div",{className:"flex items-center justify-center gap-2 text-[10px] text-gray-400 pt-1 text-center font-medium",children:[
            r.jsx(Qc,{className:"w-3.5 h-3.5 text-emerald-400"}),
            r.jsx("span",{children:"100% Secure UPI 2.0 Settlement • Zero Gateway Surcharge"})
          ]})
        ]}),

        `;

const newFooterTrust = `// Footer Trust
          r.jsxs("div",{className:"flex items-center justify-center gap-2 text-[10px] text-gray-400 pt-1 text-center font-medium",children:[
            r.jsx(Qc,{className:"w-3.5 h-3.5 text-emerald-400"}),
            r.jsx("span",{children:"100% Secure UPI 2.0 Settlement • Zero Gateway Surcharge"})
          ]}),
          r.jsxs("button",{
            type:"button",
            onClick:()=>d("AMOUNT"),
            className:"w-full py-2.5 min-h-[42px] rounded-xl bg-white/5 hover:bg-white/10 active:scale-98 border border-white/10 text-gray-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors mt-2 shadow-sm",
            children:[
              r.jsx("svg",{className:"w-4 h-4 shrink-0 text-cyan-400",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2.5",d:"M15 19l-7-7 7-7"})}),
              r.jsx("span",{children:"Back / Change Amount"})
            ]
          })
        ]}),

        `;

if (!code.includes(oldFooterTrust)) {
  console.error('Failed to locate oldFooterTrust in bundle');
  process.exit(1);
}
code = code.replace(oldFooterTrust, newFooterTrust);

// 4. Deposit tab view back button
const oldTab = `a==="deposit"&&r.jsxs("div",{className:"space-y-4",children:[r.jsx("h2",{className:"text-base font-extrabold text-white",children:"Deposit Wallet Cash"}),r.jsxs("div",{className:"p-4 rounded-2xl bg-[#161622] border border-[#00e5ff]/30 text-center space-y-3",children:[r.jsx("p",{className:"text-xs text-gray-300",children:"Open the deposit terminal to generate instant UPI QR code with automated payment verification."}),r.jsx("button",{onClick:()=>Vt(()=>dt(!0),"Deposit Terminal"),className:"px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#00b4d8] text-[#0a0a0f] font-extrabold text-xs shadow-[0_0_20px_rgba(0,229,255,0.4)] cursor-pointer",children:"Open Deposit Window"})]})]})`;

const newTab = `a==="deposit"&&r.jsxs("div",{className:"space-y-4",children:[
  r.jsxs("div",{className:"flex items-center justify-between gap-2",children:[
    r.jsxs("button",{
      type:"button",
      onClick:()=>It("dashboard"),
      className:"flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/20 text-cyan-300 hover:text-cyan-200 text-xs font-bold transition-all cursor-pointer select-none shadow-sm",
      children:[
        r.jsx("svg",{className:"w-4 h-4 shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2.5",d:"M15 19l-7-7 7-7"})}),
        r.jsx("span",{children:"Back to Dashboard"})
      ]
    }),
    r.jsx("h2",{className:"text-sm sm:text-base font-extrabold text-white uppercase tracking-wide",children:"Deposit Wallet"})
  ]}),
  r.jsxs("div",{className:"p-4 rounded-2xl bg-[#161622] border border-[#00e5ff]/30 text-center space-y-3",children:[
    r.jsx("p",{className:"text-xs text-gray-300",children:"Open the deposit terminal to generate instant UPI QR code with automated payment verification."}),
    r.jsx("button",{onClick:()=>Vt(()=>dt(!0),"Deposit Terminal"),className:"px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#00b4d8] text-[#0a0a0f] font-extrabold text-xs shadow-[0_0_20px_rgba(0,229,255,0.4)] cursor-pointer",children:"Open Deposit Window"})
  ]})
]})`;

if (!code.includes(oldTab)) {
  console.error('Failed to locate oldTab in bundle');
  process.exit(1);
}
code = code.replace(oldTab, newTab);

try {
  esbuild.transformSync(code, { loader: 'js' });
  console.log('esbuild check passed! Writing updated bundle...');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully added mobile-responsive Back options to Deposit Window and Deposit Tab!');
} catch (err) {
  console.error('Failed esbuild syntax check:', err);
  process.exit(1);
}
