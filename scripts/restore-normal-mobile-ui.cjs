const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

function patchBundle(filePath) {
  console.log('Patching file:', filePath);
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Revert hQ to clean slim top line (remove intrusive floating Loading Page pill)
  const currentHqPill = 'hQ=({isLoading:n})=>r.jsx(is,{children:n&&r.jsxs(r.Fragment,{children:[r.jsx(Ge.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},className:"fixed top-0 left-0 right-0 z-[999999] pointer-events-none h-1 bg-transparent overflow-hidden shadow-[0_0_16px_#00e5ff]",children:r.jsx(Ge.div,{initial:{x:"-100%"},animate:{x:"100%"},transition:{repeat:1/0,duration:.75,ease:"easeInOut"},className:"w-3/5 h-full bg-gradient-to-r from-transparent via-[#00e5ff] via-[#8b5cf6] to-[#ff0080]"})}),r.jsxs(Ge.div,{initial:{opacity:0,y:-20,scale:.92},animate:{opacity:1,y:0,scale:1},exit:{opacity:0,y:-12,scale:.95},transition:{duration:.18},className:"fixed top-3.5 left-1/2 -translate-x-1/2 z-[999999] pointer-events-none flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0c0c16]/95 border border-[#00e5ff]/50 text-[#00e5ff] text-[11px] font-black uppercase tracking-wider shadow-[0_0_25px_rgba(0,229,255,0.45)] backdrop-blur-xl",children:[r.jsxs("svg",{className:"w-3.5 h-3.5 animate-spin text-[#00e5ff] shrink-0",viewBox:"0 0 24 24",fill:"none",children:[r.jsx("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),r.jsx("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]}),r.jsx("span",{children:"Loading Page..."})]})]})})';
  const cleanHq = 'hQ=({isLoading:n})=>r.jsx(is,{children:n&&r.jsx(Ge.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},className:"fixed top-0 left-0 right-0 z-50 pointer-events-none h-1 bg-transparent overflow-hidden",children:r.jsx(Ge.div,{initial:{x:"-100%"},animate:{x:"100%"},transition:{repeat:1/0,duration:.9,ease:"easeInOut"},className:"w-1/2 h-full bg-gradient-to-r from-transparent via-[#00e5ff] to-[#ff0080] shadow-[0_0_12px_#00e5ff]"})})})';

  if (code.includes(currentHqPill)) {
    code = code.replace(currentHqPill, cleanHq);
    console.log('Reverted hQ to clean slim indicator.');
  }

  // 2. Normal mobile container: remove fake phone borders on mobile devices
  const oldContainer = 'className:"w-full max-w-md min-h-screen bg-[#0a0a0f] flex flex-col relative border-x border-white/5 shadow-[0_0_60px_rgba(0,0,0,0.8)] pb-20 smooth-gpu"';
  const normalContainer = 'className:"w-full max-w-md min-h-screen bg-[#0a0a0f] flex flex-col relative border-x-0 sm:border-x border-white/5 shadow-none sm:shadow-[0_0_60px_rgba(0,0,0,0.8)] pb-16"';

  if (code.includes(oldContainer)) {
    code = code.replace(oldContainer, normalContainer);
    console.log('Updated container to normal mobile styling.');
  }

  // 3. Clean, normal My Keys (wte) component with live second-by-second countdown
  const startWte = code.indexOf(',wte=');
  const endWte = code.indexOf(',Cte=', startWte);

  if (startWte === -1 || endWte === -1) {
    console.error('Could not locate wte boundaries!');
    return false;
  }

  const normalWte = `,wte=({keys:n,onOpenBuyKeys:e,onViewInvoice:t,currentUser:s,storeSettings:a})=>{
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

    let remTxt="";
    let bTxt="ACTIVE";
    let bCol="emerald";

    if(isLife){
      remTxt="Lifetime Access";
      bTxt="LIFETIME VIP";
      bCol="cyan";
    }else if(isExp){
      const agoMs=wt-expT;
      const agoH=Math.floor(agoMs/(1000*60*60));
      remTxt=agoH>0?("Expired "+agoH+"h ago"):"Expired just now";
      bTxt="EXPIRED";
      bCol="rose";
    }else if(diffMs!==null){
      const totSec=Math.max(0,Math.floor(diffMs/1000));
      const days=Math.floor(totSec/86400);
      const hours=Math.floor((totSec%86400)/3600);
      const mins=Math.floor((totSec%3600)/60);
      const secs=totSec%60;
      const totH=Math.floor(diffMs/(1000*60*60));

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

    const hLbl=isLife?"Lifetime":(hrs+" Hours");

    return{
      hours:hrs,
      hoursLabel:hLbl,
      expTime:expT,
      expiryFormatted:expFmt,
      remainingText:remTxt,
      isExpired:isExp,
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
        r.jsx("span",{className:"text-[11px] text-gray-400",children:"Active license keys & live validity countdown"})
      ]}),
      r.jsx("div",{className:"flex items-center gap-2",children:
        r.jsx("button",{
          onClick:e,
          className:"px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-400 text-xs font-bold shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all cursor-pointer active:scale-95",
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
          r.jsxs("div",{className:"flex items-start justify-between gap-2",children:[
            r.jsxs("div",{className:"min-w-0 flex-1",children:[
              r.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap",children:[
                r.jsx("span",{className:"text-[10px] text-orange-400 font-mono font-bold block",children:h.planName}),
                r.jsxs("span",{className:"text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 flex items-center gap-1",children:[
                  r.jsx("svg",{className:"w-2.5 h-2.5 text-cyan-400 shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2.5",d:"M13 10V3L4 14h7v7l9-11h-7z"})}),
                  ki.hoursLabel
                ]})
              ]}),
              r.jsx("h4",{className:"text-sm font-bold text-white truncate mt-0.5",children:h.productName})
            ]}),
            r.jsxs("span",{
              className:"text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shrink-0 "+(
                ki.badgeColor==="rose"
                  ?"bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  :(ki.badgeColor==="amber"
                    ?"bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse"
                    :(ki.badgeColor==="cyan"
                      ?"bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                      :"bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"))
              ),
              children:[
                r.jsx("span",{className:"w-1.5 h-1.5 rounded-full "+(ki.badgeColor==="rose"?"bg-rose-400":(ki.badgeColor==="amber"?"bg-amber-400":(ki.badgeColor==="cyan"?"bg-cyan-400":"bg-emerald-400 animate-pulse")))}),
                ki.badgeText
              ]
            })
          ]}),

          r.jsxs("div",{className:"flex items-center justify-between p-2.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-[#00e5ff] shadow-inner",children:[
            r.jsx("span",{className:"truncate pr-2 select-all font-bold tracking-wider",children:h.keyCode}),
            r.jsx("button",{
              onClick:()=>d(h),
              className:"p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white shrink-0 cursor-pointer transition-colors active:scale-95",
              title:"Copy Key Code",
              children:i===h.id?r.jsx(Sn,{className:"w-4 h-4 text-emerald-400"}):r.jsx(zr,{className:"w-4 h-4"})
            })
          ]}),

          r.jsxs("div",{className:"p-2.5 rounded-xl bg-gradient-to-r from-[#0b101c] via-[#121124] to-[#0c1420] border border-cyan-500/20 text-xs space-y-2 shadow-sm",children:[
            r.jsxs("div",{className:"flex items-center justify-between gap-2 text-[11px]",children:[
              r.jsxs("div",{className:"flex items-center gap-1.5 font-bold text-cyan-300",children:[
                r.jsx("svg",{className:"w-3.5 h-3.5 text-cyan-400 shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"})}),
                r.jsxs("span",{children:["Key Validity: ",ki.hoursLabel]})
              ]}),
              r.jsxs("span",{
                className:"font-mono text-[10px] font-bold px-2 py-0.5 rounded-full "+(
                  ki.isExpired
                    ?"bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    :(ki.badgeColor==="amber"
                      ?"bg-amber-500/20 text-amber-200 border border-amber-500/40 animate-pulse"
                      :(ki.badgeColor==="cyan"
                        ?"bg-cyan-500/20 text-cyan-200 border border-cyan-500/30"
                        :"bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"))
                ),
                children:[ki.remainingText]
              })
            ]}),
            r.jsxs("div",{className:"flex items-center justify-between text-[11px] text-gray-300 pt-1 border-t border-white/5",children:[
              r.jsxs("span",{className:"flex items-center gap-1 text-gray-400",children:[
                r.jsx("svg",{className:"w-3.5 h-3.5 text-amber-400 shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2",d:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"})}),
                r.jsx("span",{children:"Expiry Time:"})
              ]}),
              r.jsx("span",{
                className:"font-mono font-bold text-[11px] "+(ki.isExpired?"text-rose-400 line-through":"text-amber-300"),
                children:ki.expiryFormatted
              })
            ]})
          ]}),

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
                className:"px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all active:scale-95",
                title:"View & Download Invoice",
                children:[r.jsx(Yc,{className:"w-3 h-3"}),r.jsx("span",{children:"Invoice"})]
              })
            ]})
          ]})
        ]
      },h.id);
    })})]})
  }`;

  code = code.substring(0, startWte) + normalWte + code.substring(endWte);
  console.log('Replaced wte with normal mobile-proportioned key card.');

  try {
    esbuild.transformSync(code, { loader: 'js' });
    console.log('Syntax check passed for:', filePath);
    fs.writeFileSync(filePath, code, 'utf8');
    return true;
  } catch (err) {
    console.error('Syntax error during patch:', err);
    return false;
  }
}

const f1 = path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js');
const f2 = path.join(__dirname, '..', 'dist', 'assets', 'index-BvHT743v.js');

const r1 = patchBundle(f1);
const r2 = patchBundle(f2);

if (r1 && r2) {
  console.log('NORMAL MOBILE UI RESTORED SUCCESSFULLY!');
} else {
  console.error('FAILED TO RESTORE NORMAL MOBILE UI');
  process.exit(1);
}
