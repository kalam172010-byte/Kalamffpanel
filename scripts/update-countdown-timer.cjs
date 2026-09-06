const fs = require('fs');
const esbuild = require('esbuild');

const bundlePath = './public/assets/index-BvHT743v.js';
let code = fs.readFileSync(bundlePath, 'utf8');

const startWte = code.indexOf(',wte=');
const endWte = code.indexOf(',Cte=', startWte);

if (startWte === -1 || endWte === -1) {
  console.error('Could not locate wte component in bundle!');
  process.exit(1);
}

const newWte = `,wte=({keys:n,onOpenBuyKeys:e,onViewInvoice:t,currentUser:s,storeSettings:a})=>{
  const[i,l]=q.useState(null),
  [wt,st]=q.useState(()=>Date.now());
  q.useEffect(()=>{
    const iv=setInterval(()=>st(Date.now()),1000);
    return()=>clearInterval(iv);
  },[]);
  const Pk=h=>{
    let hrs=h.durationHours;
    const rDur=(h.planName||h.planDuration||"").toLowerCase();
    if(!hrs){
      if(rDur.includes("permanent")||rDur.includes("lifetime")){
        hrs=999999;
      }else{
        const hm=rDur.match(/(\\d+)\\s*(?:hour|hr|h\\b)/);
        if(hm){
          hrs=parseInt(hm[1],10);
        }else{
          const dm=rDur.match(/(\\d+)\\s*(?:day|d\\b)/);
          if(dm){
            hrs=parseInt(dm[1],10)*24;
          }else{
            const wm=rDur.match(/(\\d+)\\s*(?:week|w\\b)/);
            if(wm){
              hrs=parseInt(wm[1],10)*24*7;
            }else{
              const mm=rDur.match(/(\\d+)\\s*(?:month|m\\b)/);
              if(mm){
                hrs=parseInt(mm[1],10)*24*30;
              }else{
                hrs=24;
              }
            }
          }
        }
      }
    }
    let pT=h.purchaseTimestamp;
    if(!pT){
      const rawP=h.purchaseDate;
      if(rawP){
        const pr=new Date(rawP).getTime();
        pT=isNaN(pr)?Date.now():pr;
      }else{
        pT=Date.now();
      }
    }
    let expT=h.expiryTimestamp;
    if(!expT){
      if(h.expiryDate&&!h.expiryDate.includes("Calculated")&&!isNaN(Date.parse(h.expiryDate))){
        expT=new Date(h.expiryDate).getTime();
      }else{
        expT=hrs===999999?null:pT+hrs*3600*1000;
      }
    }
    const isLife=hrs===999999;
    const isExp=!isLife&&expT!==null&&expT<=wt;
    const diffMs=isLife||expT===null?null:(expT-wt);
    let expFmt="";
    if(isLife){
      expFmt="Lifetime VIP (No Expiry)";
    }else if(expT){
      const d=new Date(expT);
      expFmt=d.toLocaleString("en-IN",{
        day:"2-digit",
        month:"short",
        year:"numeric",
        hour:"2-digit",
        minute:"2-digit",
        hour12:true
      });
    }else{
      expFmt="24 Hours from Activation";
    }
    let days=0,hours=0,mins=0,secs=0,pct=0,remTxt="",bTxt="ACTIVE",bCol="emerald";
    if(isLife){
      remTxt="Lifetime Access";
      bTxt="LIFETIME VIP";
      bCol="cyan";
      pct=100;
    }else if(isExp){
      const agoMs=wt-expT;
      const agoH=Math.floor(agoMs/(1000*60*60));
      remTxt=agoH>0?("Expired "+agoH+"h ago"):"Expired just now";
      bTxt="EXPIRED";
      bCol="rose";
      pct=0;
    }else if(diffMs!==null){
      const totSec=Math.max(0,Math.floor(diffMs/1000));
      days=Math.floor(totSec/86400);
      hours=Math.floor((totSec%86400)/3600);
      mins=Math.floor((totSec%3600)/60);
      secs=totSec%60;
      const totH=Math.floor(diffMs/(1000*60*60));
      const totalPlanMs=hrs*3600*1000;
      pct=Math.max(0,Math.min(100,Math.round((diffMs/totalPlanMs)*100)));
      if(days>0){
        remTxt=days+"d "+hours+"h "+mins+"m "+secs+"s left";
      }else if(hours>0){
        remTxt=hours+"h "+mins+"m "+secs+"s left";
      }else{
        remTxt=mins+"m "+secs+"s left";
      }
      if(totH<3){
        bTxt="EXPIRING SOON";
        bCol="amber";
      }else{
        bTxt="ACTIVE";
        bCol="emerald";
      }
    }
    const padDays=String(days).padStart(2,"0");
    const padHours=String(hours).padStart(2,"0");
    const padMins=String(mins).padStart(2,"0");
    const padSecs=String(secs).padStart(2,"0");
    const hLbl=isLife?"Lifetime":(hrs+" Hours");
    return{
      hours:hrs,
      hoursLabel:hLbl,
      expTime:expT,
      expiryFormatted:expFmt,
      remainingText:remTxt,
      isExpired:isExp,
      isLife:isLife,
      days:days,
      hoursVal:hours,
      minsVal:mins,
      secsVal:secs,
      padDays:padDays,
      padHours:padHours,
      padMins:padMins,
      padSecs:padSecs,
      percentRemaining:pct,
      badgeText:bTxt,
      badgeColor:bCol
    };
  };
  const u=h=>{
    if(!t)return;
    const p={
      invoiceNumber:h.invoiceNumber||("INV-"+(h.id.replace(/\\D/g,"").slice(-6)||Math.floor(1e5+Math.random()*9e5))),
      orderId:h.orderId||("ORD-"+(h.id.replace(/\\D/g,"").slice(-4)||"9241")),
      date:h.purchaseDate,
      buyerName:(s==null?void 0:s.name)||(s==null?void 0:s.username)||"Customer",
      buyerUsername:(s==null?void 0:s.username)||"customer",
      buyerEmail:(s==null?void 0:s.email)||"",
      productName:h.productName,
      category:"Game License",
      game:h.game,
      deviceType:h.deviceType,
      planDuration:h.planName,
      quantity:1,
      unitPrice:h.price,
      totalAmount:h.price,
      paymentMethod:"Wallet Balance",
      keys:[h.keyCode],
      status:"DELIVERED",
      shopName:(a==null?void 0:a.shopName)||"KALAM MODS OFFICIAL",
      supportContact:(a==null?void 0:a.supportUsername)||"@Kalam_Mods_Official"
    };
    t(p);
  },
  d=h=>{
    navigator.clipboard.writeText(h.keyCode);
    l(h.id);
    setTimeout(()=>l(null),2e3);
  };
  return r.jsxs("div",{className:"space-y-4",id:"my-keys-view",children:[
    r.jsxs("div",{className:"flex items-center justify-between",children:[
      r.jsxs("div",{children:[
        r.jsxs("h2",{className:"text-base font-extrabold text-white flex items-center gap-2",children:[
          r.jsx(fi,{className:"w-4 h-4 text-orange-400"}),
          r.jsxs("span",{children:["My Purchased Keys (",n.length,")"]})
        ]}),
        r.jsx("span",{className:"text-[11px] text-gray-400",children:"Live countdown timer & validity tracker for all active digital licenses"})
      ]}),
      r.jsx("div",{className:"flex items-center gap-2",children:
        r.jsx("button",{
          onClick:e,
          className:"px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-400 text-xs font-bold shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all cursor-pointer",
          children:"+ Buy New"
        })
      })
    ]}),
    n.length===0?r.jsxs(bn,{className:"p-8 text-center space-y-3 bg-[#161622]/90 border-white/10",children:[
      r.jsx("div",{className:"w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto",children:r.jsx(fi,{className:"w-6 h-6"})}),
      r.jsx("h3",{className:"text-sm font-bold text-white",children:"No Keys Purchased Yet"}),
      r.jsx("p",{className:"text-xs text-gray-400 max-w-xs mx-auto",children:"Select any product from the catalog to purchase digital mod & bypass keys instantly."}),
      r.jsx("button",{onClick:e,className:"mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs shadow-lg cursor-pointer",children:"Browse Products"})
    ]}):r.jsx("div",{className:"space-y-3",children:n.map(h=>{
      const ki=Pk(h);
      return r.jsxs(bn,{
        glow:ki.badgeColor==="rose"?"none":(ki.badgeColor==="amber"?"gold":"green"),
        className:"p-4 bg-[#161622]/95 "+(ki.badgeColor==="rose"?"border-rose-500/30 opacity-85":(ki.badgeColor==="amber"?"border-amber-500/40":"border-emerald-500/30"))+" space-y-3 rounded-2xl",
        children:[
          // Product header line
          r.jsxs("div",{className:"flex items-start justify-between gap-2",children:[
            r.jsxs("div",{className:"min-w-0",children:[
              r.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap",children:[
                r.jsx("span",{className:"text-[10px] text-orange-400 font-mono font-bold block",children:h.planName}),
                r.jsxs("span",{className:"text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 flex items-center gap-1",children:[
                  r.jsx("svg",{className:"w-2.5 h-2.5 text-cyan-400 shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2.5",d:"M13 10V3L4 14h7v7l9-11h-7z"})}),
                  ki.hoursLabel
                ]})
              ]}),
              r.jsx("h4",{className:"text-sm font-bold text-white truncate",children:h.productName})
            ]}),
            r.jsxs("span",{
              className:"text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shrink-0 "+(
                ki.badgeColor==="rose"
                  ?"bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  :(ki.badgeColor==="amber"
                    ?"bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse"
                    :"bg-emerald-500/15 text-emerald-400 border border-emerald-500/30")
              ),
              children:[
                r.jsx("span",{className:"w-1.5 h-1.5 rounded-full "+(ki.badgeColor==="rose"?"bg-rose-400":(ki.badgeColor==="amber"?"bg-amber-400":"bg-emerald-400 animate-pulse"))}),
                ki.badgeText
              ]
            })
          ]}),

          // Key Code Box
          r.jsxs("div",{className:"flex items-center justify-between p-2.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-[#00e5ff] shadow-inner",children:[
            r.jsx("span",{className:"truncate pr-2 select-all font-bold tracking-wider",children:h.keyCode}),
            r.jsx("button",{
              onClick:()=>d(h),
              className:"p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white shrink-0 cursor-pointer transition-colors",
              title:"Copy Key Code",
              children:i===h.id?r.jsx(Sn,{className:"w-4 h-4 text-emerald-400"}):r.jsx(zr,{className:"w-4 h-4"})
            })
          ]}),

          // Dedicated Countdown Timer Section
          r.jsxs("div",{
            className:"p-3 rounded-xl bg-gradient-to-br from-[#090e1a] via-[#101426] to-[#0c121e] border "+(
              ki.isExpired
                ?"border-rose-500/30 bg-rose-950/15"
                :(ki.badgeColor==="amber"
                  ?"border-amber-500/40 bg-amber-950/15 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                  :"border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]")
            )+" space-y-2.5",
            children:[
              // Timer Header
              r.jsxs("div",{className:"flex items-center justify-between gap-2",children:[
                r.jsxs("div",{className:"flex items-center gap-1.5",children:[
                  r.jsx("svg",{
                    className:"w-4 h-4 "+(ki.isExpired?"text-rose-400":(ki.badgeColor==="amber"?"text-amber-400 animate-pulse":"text-cyan-400")),
                    fill:"none",
                    stroke:"currentColor",
                    viewBox:"0 0 24 24",
                    children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"})
                  }),
                  r.jsx("span",{className:"text-[11px] font-extrabold uppercase tracking-wider text-gray-300",children:"Expiry Countdown"})
                ]}),
                r.jsxs("span",{
                  className:"font-mono text-[10px] font-bold px-2 py-0.5 rounded-full "+(
                    ki.isExpired
                      ?"bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      :(ki.badgeColor==="amber"
                        ?"bg-amber-500/20 text-amber-200 border border-amber-500/40 animate-pulse"
                        :"bg-emerald-500/20 text-emerald-300 border border-emerald-500/30")
                  ),
                  children:[ki.remainingText]
                })
              ]}),

              // Digital Countdown Ticker Boxes (or Lifetime / Expired banner)
              ki.isLife?r.jsxs("div",{
                className:"p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between text-cyan-300",
                children:[
                  r.jsxs("div",{className:"flex items-center gap-2",children:[
                    r.jsx("span",{className:"text-lg font-bold",children:"♾"}),
                    r.jsx("span",{className:"text-xs font-mono font-bold tracking-wide",children:"Permanent Lifetime Key"})
                  ]}),
                  r.jsx("span",{className:"text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40",children:"NO EXPIRATION"})
                ]
              }):(ki.isExpired?r.jsxs("div",{
                className:"p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 flex items-center justify-between text-rose-300",
                children:[
                  r.jsxs("div",{className:"flex items-center gap-2",children:[
                    r.jsx("span",{className:"text-sm",children:"⚠️"}),
                    r.jsx("span",{className:"text-xs font-mono font-bold",children:"Key Expired (00:00:00)"})
                  ]}),
                  r.jsx("span",{className:"text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40",children:"RENEW REQUIRED"})
                ]
              }):r.jsxs("div",{
                className:"grid grid-cols-4 gap-1.5 py-1 px-1 rounded-xl bg-black/50 border border-white/5",
                children:[
                  // Days Box
                  r.jsxs("div",{className:"flex flex-col items-center justify-center p-1.5 rounded-lg bg-[#0e1626] border border-white/10",children:[
                    r.jsx("span",{className:"font-mono text-base md:text-lg font-black tracking-wider text-white",children:ki.padDays}),
                    r.jsx("span",{className:"text-[9px] font-bold uppercase tracking-wider text-gray-400 mt-0.5",children:"Days"})
                  ]}),
                  // Hours Box
                  r.jsxs("div",{className:"flex flex-col items-center justify-center p-1.5 rounded-lg bg-[#0e1626] border border-white/10",children:[
                    r.jsx("span",{className:"font-mono text-base md:text-lg font-black tracking-wider text-white",children:ki.padHours}),
                    r.jsx("span",{className:"text-[9px] font-bold uppercase tracking-wider text-gray-400 mt-0.5",children:"Hours"})
                  ]}),
                  // Mins Box
                  r.jsxs("div",{className:"flex flex-col items-center justify-center p-1.5 rounded-lg bg-[#0e1626] border border-white/10",children:[
                    r.jsx("span",{className:"font-mono text-base md:text-lg font-black tracking-wider text-white",children:ki.padMins}),
                    r.jsx("span",{className:"text-[9px] font-bold uppercase tracking-wider text-gray-400 mt-0.5",children:"Mins"})
                  ]}),
                  // Secs Box (with glowing countdown pulse)
                  r.jsxs("div",{
                    className:"flex flex-col items-center justify-center p-1.5 rounded-lg "+(
                      ki.badgeColor==="amber"
                        ?"bg-amber-500/15 border border-amber-500/40 text-amber-300"
                        :"bg-cyan-500/15 border border-cyan-500/40 text-cyan-300"
                    ),
                    children:[
                      r.jsx("span",{className:"font-mono text-base md:text-lg font-black tracking-wider animate-pulse",children:ki.padSecs}),
                      r.jsx("span",{className:"text-[9px] font-bold uppercase tracking-wider text-cyan-400/90 mt-0.5",children:"Secs"})
                    ]
                  })
                ]
              })),

              // Countdown Progress Bar & Time Meta
              !ki.isLife&&r.jsxs("div",{className:"space-y-1.5 pt-0.5",children:[
                r.jsx("div",{
                  className:"w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5",
                  children:r.jsx("div",{
                    className:"h-full rounded-full transition-all duration-1000 "+(
                      ki.isExpired
                        ?"w-0 bg-rose-500"
                        :(ki.badgeColor==="amber"
                          ?"bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                          :"bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]")
                    ),
                    style:{width:ki.percentRemaining+"%"}
                  })
                }),
                r.jsxs("div",{className:"flex items-center justify-between text-[10px] text-gray-400 font-mono",children:[
                  r.jsxs("span",{className:"flex items-center gap-1",children:[
                    r.jsx("span",{className:"text-gray-500",children:"Expires:"}),
                    r.jsx("span",{className:ki.isExpired?"text-rose-400 font-bold":"text-amber-300 font-bold",children:ki.expiryFormatted})
                  ]}),
                  r.jsxs("span",{className:"font-bold "+(ki.badgeColor==="amber"?"text-amber-300":"text-cyan-300"),children:[ki.percentRemaining,"% time left"]})
                ]})
              ]})
            ]
          }),

          // Footer info with purchase date and invoice button
          r.jsxs("div",{className:"flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-white/5",children:[
            r.jsxs("span",{className:"flex items-center gap-1",children:[
              r.jsx(ic,{className:"w-3 h-3 text-gray-500"}),
              "Purchased: ",
              h.purchaseDate
            ]}),
            r.jsxs("div",{className:"flex items-center gap-2",children:[
              r.jsxs("span",{className:"text-gray-300 font-semibold font-mono",children:["₹",h.price]}),
              t&&r.jsxs("button",{
                onClick:()=>u(h),
                className:"px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all",
                title:"View & Download Invoice",
                children:[r.jsx(Yc,{className:"w-3 h-3"}),r.jsx("span",{children:"Invoice"})]
              })
            ]})
          ]})
        ]
      },h.id);
    })})]})
  }`;

// Test transforming newWte alone
try {
  esbuild.transformSync("var test=" + newWte.slice(1) + ";", { loader: 'js' });
  console.log('newWte isolated check: PASSED!');
} catch (err) {
  console.error('newWte isolated check failed:', err);
  process.exit(1);
}

// Replace in bundle
const updatedCode = code.substring(0, startWte) + newWte + code.substring(endWte);

// Validate entire bundle with esbuild
try {
  esbuild.transformSync(updatedCode, { loader: 'js' });
  console.log('esbuild check passed for entire bundle!');
  fs.writeFileSync(bundlePath, updatedCode, 'utf8');
  if (fs.existsSync('./dist/assets/index-BvHT743v.js')) {
    fs.writeFileSync('./dist/assets/index-BvHT743v.js', updatedCode, 'utf8');
  }
  console.log('Successfully updated My Keys with live Countdown Timer!');
} catch (err) {
  console.error('esbuild syntax check failed on updated bundle:', err);
  process.exit(1);
}
