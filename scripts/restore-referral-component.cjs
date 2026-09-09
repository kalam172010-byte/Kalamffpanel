const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

function getVteCode() {
  return `,vte=({storeSettings:n,currentUser:e,resellers:t=[],transactions:s=[],onOpenDeposit:a})=>{
  const [copied, setCopied] = q.useState(null);
  const [copiedLink, setCopiedLink] = q.useState(!1);

  const curUser = e || null;
  const username = (curUser && (curUser.username || curUser.name)) || "kalam_friend";
  const refCode = (curUser && (curUser.referralCode || curUser.refCode)) || ("REF" + (curUser && curUser.id ? curUser.id.toString().slice(-4).toUpperCase() : "KALAM77"));
  
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://kalam-ff-panel.com";
  const refLink = siteUrl + "/register?ref=" + encodeURIComponent(refCode);

  const copyCode = () => {
    try {
      navigator.clipboard.writeText(refCode);
      setCopied("code");
      setTimeout(() => setCopied(null), 2000);
    } catch (_err) {}
  };

  const copyLink = () => {
    try {
      navigator.clipboard.writeText(refLink);
      setCopiedLink(!0);
      setTimeout(() => setCopiedLink(!1), 2000);
    } catch (_err) {}
  };

  const shareText = encodeURIComponent("🔥 Get Instant FF Keys & VIP Panel access on KALAM FF PANEL! Register using my referral link for bonus balance: " + refLink);

  const telegramShare = "https://t.me/share/url?url=" + encodeURIComponent(refLink) + "&text=" + encodeURIComponent("🔥 Join KALAM FF PANEL - Instant 24/7 Digital Keys & VIP Mod Panel!");
  const whatsappShare = "https://api.whatsapp.com/send?text=" + shareText;

  // Calculate user referrals if available
  const myReferrals = (t || []).filter(u => u && (u.referredBy === (curUser && curUser.id) || u.refBy === refCode));
  const totalEarned = (s || [])
    .filter(tx => tx && (tx.type === "REFERRAL_BONUS" || tx.type === "COMMISSION") && tx.userId === (curUser && curUser.id))
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const currency = (n && n.currency) || "₹";

  return r.jsxs("div", {
    className: "space-y-4",
    id: "referral-earn-view",
    children: [
      r.jsxs("div", {
        className: "flex items-center justify-between",
        children: [
          r.jsxs("div", {
            children: [
              r.jsxs("h2", {
                className: "text-base font-extrabold text-white flex items-center gap-2",
                children: [
                  r.jsx(Gi, { className: "w-4 h-4 text-[#ff0080]" }),
                  r.jsx("span", { children: "Refer & Earn Money" })
                ]
              }),
              r.jsx("span", {
                className: "text-[11px] text-gray-400",
                children: "Invite your friends & earn instant commission directly into your wallet"
              })
            ]
          }),
          r.jsx("span", {
            className: "px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-[10px]",
            children: "5% - 10% Cash"
          })
        ]
      }),

      r.jsxs(bn, {
        glow: "pink",
        className: "p-4 bg-[#161622]/95 border-[#ff0080]/30 space-y-3.5",
        children: [
          r.jsxs("div", {
            className: "flex items-center justify-between",
            children: [
              r.jsxs("span", {
                className: "text-xs font-bold text-gray-200 flex items-center gap-1.5",
                children: [
                  r.jsx(BD, { className: "w-3.5 h-3.5 text-[#ff0080]" }),
                  r.jsx("span", { children: "Your Exclusive Referral Code" })
                ]
              }),
              copied === "code" && r.jsxs("span", {
                className: "text-[10px] text-emerald-400 font-bold flex items-center gap-1",
                children: [
                  r.jsx(Sn, { className: "w-3 h-3" }),
                  r.jsx("span", { children: "Copied!" })
                ]
              })
            ]
          }),
          r.jsxs("div", {
            className: "flex items-center gap-2",
            children: [
              r.jsx("div", {
                className: "flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-[#ff0080]/40 font-mono text-sm font-black text-[#00e5ff] tracking-wider text-center select-all",
                children: refCode
              }),
              r.jsxs("button", {
                onClick: copyCode,
                className: "px-3.5 py-2.5 rounded-xl bg-[#ff0080] hover:bg-[#ff0080]/80 active:scale-95 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(255,0,128,0.4)] cursor-pointer flex items-center gap-1.5",
                children: [
                  r.jsx(Yc, { className: "w-3.5 h-3.5" }),
                  r.jsx("span", { children: copied === "code" ? "Copied" : "Copy" })
                ]
              })
            ]
          }),

          r.jsxs("div", {
            className: "space-y-1.5 pt-1",
            children: [
              r.jsx("label", {
                className: "block text-[11px] text-gray-400 font-semibold",
                children: "Direct Invitation Link"
              }),
              r.jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                  r.jsx("input", {
                    type: "text",
                    readOnly: !0,
                    value: refLink,
                    className: "flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-300 font-mono truncate select-all focus:outline-none"
                  }),
                  r.jsxs("button", {
                    onClick: copyLink,
                    className: "px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-cyan-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
                    children: [
                      r.jsx(Yc, { className: "w-3 h-3" }),
                      r.jsx("span", { children: copiedLink ? "Copied!" : "Copy Link" })
                    ]
                  })
                ]
              })
            ]
          }),

          r.jsxs("div", {
            className: "grid grid-cols-2 gap-2 pt-1",
            children: [
              r.jsxs("a", {
                href: whatsappShare,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center",
                children: [
                  r.jsx(t3, { className: "w-3.5 h-3.5 text-emerald-400 shrink-0" }),
                  r.jsx("span", { children: "Share on WhatsApp" })
                ]
              }),
              r.jsxs("a", {
                href: telegramShare,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "p-2.5 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center",
                children: [
                  r.jsx(bg, { className: "w-3.5 h-3.5 text-[#229ED9] shrink-0" }),
                  r.jsx("span", { children: "Share on Telegram" })
                ]
              })
            ]
          })
        ]
      }),

      r.jsxs("div", {
        className: "grid grid-cols-3 gap-2",
        children: [
          r.jsxs("div", {
            className: "p-3 rounded-2xl bg-[#161622] border border-white/10 text-center space-y-0.5",
            children: [
              r.jsx("span", { className: "text-[10px] text-gray-400 block", children: "Commission" }),
              r.jsx("span", { className: "text-sm font-extrabold text-[#ff0080]", children: "5% - 10%" }),
              r.jsx("span", { className: "text-[9px] text-emerald-400 block", children: "Lifetime" })
            ]
          }),
          r.jsxs("div", {
            className: "p-3 rounded-2xl bg-[#161622] border border-white/10 text-center space-y-0.5",
            children: [
              r.jsx("span", { className: "text-[10px] text-gray-400 block", children: "Friends Invited" }),
              r.jsx("span", { className: "text-sm font-extrabold text-[#00e5ff]", children: myReferrals.length.toString() }),
              r.jsx("span", { className: "text-[9px] text-gray-400 block", children: "Active Users" })
            ]
          }),
          r.jsxs("div", {
            className: "p-3 rounded-2xl bg-[#161622] border border-white/10 text-center space-y-0.5",
            children: [
              r.jsx("span", { className: "text-[10px] text-gray-400 block", children: "Bonus Earned" }),
              r.jsxs("span", { className: "text-sm font-extrabold text-amber-400", children: [currency, totalEarned.toFixed(2)] }),
              r.jsx("span", { className: "text-[9px] text-emerald-400 block", children: "Auto-Credited" })
            ]
          })
        ]
      }),

      r.jsxs(bn, {
        glow: "cyan",
        className: "p-4 bg-[#161622]/95 border-[#00e5ff]/30 space-y-3",
        children: [
          r.jsxs("h3", {
            className: "text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5",
            children: [
              r.jsx(Sn, { className: "w-3.5 h-3.5 text-[#00e5ff]" }),
              r.jsx("span", { children: "How Referral Rewards Work" })
            ]
          }),
          r.jsxs("div", {
            className: "space-y-2 text-xs",
            children: [
              r.jsxs("div", {
                className: "flex items-start gap-2.5 p-2 rounded-xl bg-black/40 border border-white/5",
                children: [
                  r.jsx("span", { className: "w-5 h-5 rounded-full bg-[#ff0080]/20 text-[#ff0080] font-bold text-[10px] flex items-center justify-center shrink-0", children: "1" }),
                  r.jsxs("div", {
                    children: [
                      r.jsx("span", { className: "font-bold text-white block text-[11px]", children: "Share Your Invite Link" }),
                      r.jsx("span", { className: "text-gray-400 text-[10px]", children: "Send your code or registration link to friends, gaming groups, or communities." })
                    ]
                  })
                ]
              }),
              r.jsxs("div", {
                className: "flex items-start gap-2.5 p-2 rounded-xl bg-black/40 border border-white/5",
                children: [
                  r.jsx("span", { className: "w-5 h-5 rounded-full bg-[#00e5ff]/20 text-[#00e5ff] font-bold text-[10px] flex items-center justify-center shrink-0", children: "2" }),
                  r.jsxs("div", {
                    children: [
                      r.jsx("span", { className: "font-bold text-white block text-[11px]", children: "Friends Add Balance & Buy Keys" }),
                      r.jsx("span", { className: "text-gray-400 text-[10px]", children: "Whenever your referred friends top up wallet or buy game keys, rewards trigger." })
                    ]
                  })
                ]
              }),
              r.jsxs("div", {
                className: "flex items-start gap-2.5 p-2 rounded-xl bg-black/40 border border-white/5",
                children: [
                  r.jsx("span", { className: "w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0", children: "3" }),
                  r.jsxs("div", {
                    children: [
                      r.jsx("span", { className: "font-bold text-white block text-[11px]", children: "Instant Wallet Cashback" }),
                      r.jsx("span", { className: "text-gray-400 text-[10px]", children: "Earn instant bonus cash credited directly to your panel wallet to buy keys for free!" })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }),

      r.jsxs("div", {
        className: "p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3",
        children: [
          r.jsxs("div", {
            className: "space-y-0.5",
            children: [
              r.jsxs("h4", {
                className: "text-xs font-bold text-amber-300 flex items-center gap-1.5",
                children: [
                  r.jsx(Gi, { className: "w-3.5 h-3.5 text-amber-400" }),
                  r.jsx("span", { children: "Want to Become an Official Reseller?" })
                ]
              }),
              r.jsx("p", {
                className: "text-[10px] text-gray-300",
                children: "Get wholesale API keys, panel discount rates, and sub-reseller management."
              })
            ]
          }),
          r.jsxs("a", {
            href: (n && n.telegramSupportUrl) || "https://t.me/Kalam_Mods_Official",
            target: "_blank",
            rel: "noreferrer",
            className: "px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-extrabold text-[10px] transition-all shrink-0 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.3)]",
            children: [
              r.jsx("span", { children: "Apply Reseller" })
            ]
          })
        ]
      })
    ]
  });
}`;
}

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist:', filePath);
    return;
  }
  let code = fs.readFileSync(filePath, 'utf8');

  // Check if vte is already defined
  if (code.includes(',vte=') || code.includes('const vte=') || code.includes('var vte=')) {
    console.log(`vte is already defined in ${filePath}`);
    return;
  }

  // Find insertion point right before `,Nte=`
  const target = ',Nte=';
  const idx = code.indexOf(target);
  if (idx === -1) {
    console.error(`Could not find ${target} in ${filePath}`);
    return;
  }

  const vteCode = getVteCode();
  code = code.substring(0, idx) + vteCode + code.substring(idx);

  try {
    esbuild.transformSync(code, { loader: 'js' });
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`[restore-referral-component] Successfully defined vte in ${filePath}`);
  } catch (err) {
    console.error(`[restore-referral-component] esbuild transform error for ${filePath}:`, err);
    process.exit(1);
  }
}

const f1 = path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js');
const f2 = path.join(__dirname, '..', 'dist', 'assets', 'index-BvHT743v.js');

patchFile(f1);
patchFile(f2);
console.log('[restore-referral-component] Complete!');
