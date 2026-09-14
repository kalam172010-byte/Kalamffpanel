const fs = require('fs');
const path = require('path');

function patchFile(targetPath) {
  if (!fs.existsSync(targetPath)) {
    console.log('[Telegram Bot Patch] File does not exist:', targetPath);
    return false;
  }
  console.log('[Telegram Bot Patch] Processing:', targetPath);
  let code = fs.readFileSync(targetPath, 'utf8');
  let changed = false;

  // 1. Update SD default store settings
  if (code.includes('howToUseBotLink:"https://t.me/yourchannel/3",') && !code.includes('apkDownloadUrl:"https://t.me/kalamffpanel",')) {
    code = code.replace(
      'howToUseBotLink:"https://t.me/yourchannel/3",',
      'howToUseBotLink:"https://t.me/yourchannel/3",apkDownloadUrl:"https://t.me/kalamffpanel",'
    );
    changed = true;
    console.log('[Telegram Bot Patch] Added apkDownloadUrl to SD default store settings');
  }

  // 2. Add tInit prop in tne component signature
  const targetTneSig = 'tne=({settings:n,onSaveSettings:e})=>{const[t,s]=q.useState("branding"),';
  const newTneSig = 'tne=({settings:n,onSaveSettings:e,initialTab:tInit})=>{const[t,s]=q.useState(tInit||"branding"),';
  if (code.includes(targetTneSig)) {
    code = code.replace(targetTneSig, newTneSig);
    changed = true;
    console.log('[Telegram Bot Patch] Updated tne signature with initialTab prop');
  }

  // 3. Add useState variables for Telegram Bot & Proof Bot in tne
  const targetState = '[be,we]=q.useState(n.howToUseBotLink||"https://t.me/yourchannel/3"),[apkLink,setApkLink]=q.useState(n.apkDownloadUrl||"https://t.me/kalamffpanel"),';
  const newTgStates = '[be,we]=q.useState(n.howToUseBotLink||"https://t.me/yourchannel/3"),[apkLink,setApkLink]=q.useState(n.apkDownloadUrl||"https://t.me/kalamffpanel"),[tgBotToken,setTgBotToken]=q.useState(n.telegramBotToken||"8990109048:AAEin2WyZl3pGdKXrPSQftMn8-Yh1g0Gop8"),[tgChatId,setTgChatId]=q.useState(n.telegramChatId||"7768975239"),[tgBotUsername,setTgBotUsername]=q.useState(n.telegramBotUsername||"@kalam_store_bot"),[tgWelcomeMsg,setTgWelcomeMsg]=q.useState(n.telegramWelcomeMsg||"🔥 Welcome to KALAM STORE Bot! Instant Key Delivery & Automated UPI Wallet."),[tgProofToken,setTgProofToken]=q.useState(n.proofBotToken||""),[tgProofChatId,setTgProofChatId]=q.useState(n.proofChatId||""),[tgAutoProof,setTgAutoProof]=q.useState(n.enableAutoProof!==!1),[tgProofChannelLink,setTgProofChannelLink]=q.useState(n.proofChannelLink||n.paymentProofChannel||""),[showTgToken,setShowTgToken]=q.useState(!1),[showProofToken,setShowProofToken]=q.useState(!1),[tgTesting,setTgTesting]=q.useState(!1),[tgTestStatus,setTgTestStatus]=q.useState(null),[tgProofTesting,setTgProofTesting]=q.useState(!1),[tgProofTestStatus,setTgProofTestStatus]=q.useState(null),[tgProofDetecting,setTgProofDetecting]=q.useState(!1),[tgProofDetectHint,setTgProofDetectHint]=q.useState(null),[tgSaving,setTgSaving]=q.useState(!1),[tgSaved,setTgSaved]=q.useState(!1),[tgLiveUpdating,setTgLiveUpdating]=q.useState(!1),[tgLiveStatus,setTgLiveStatus]=q.useState(null),[tgDetecting,setTgDetecting]=q.useState(!1),[tgDetectHint,setTgDetectHint]=q.useState(null),[tgUsers,setTgUsers]=q.useState([]),[tgUsersLoading,setTgUsersLoading]=q.useState(!1),[tgUserSearch,setTgUserSearch]=q.useState(""),[tgCreditUser,setTgCreditUser]=q.useState(null),[tgCreditAmt,setTgCreditAmt]=q.useState(""),[tgCreditReason,setTgCreditReason]=q.useState(""),[tgCreditMsg,setTgCreditMsg]=q.useState(null),[tgCrediting,setTgCrediting]=q.useState(!1),';
  if (code.includes(targetState) && !code.includes('[tgProofDetecting,setTgProofDetecting]')) {
    if (code.includes('[tgBotToken,setTgBotToken]')) {
      const oldStateBlockStart = code.indexOf('[tgBotToken,setTgBotToken]=');
      const oldStateBlockEnd = code.indexOf('[tgCrediting,setTgCrediting]=q.useState(!1),') + '[tgCrediting,setTgCrediting]=q.useState(!1),'.length;
      if (oldStateBlockStart !== -1 && oldStateBlockEnd !== -1) {
        code = code.substring(0, oldStateBlockStart) + newTgStates.replace(targetState, '') + code.substring(oldStateBlockEnd);
        changed = true;
        console.log('[Telegram Bot Patch] Upgraded tgBotToken & proof state variables');
      }
    } else {
      code = code.replace(targetState, newTgStates);
      changed = true;
      console.log('[Telegram Bot Patch] Added tgBotToken & proof state variables in tne');
    }
  }

  // 4. Add initialTab sync & live /api/telegram-config + /api/admin/telegram/users fetch in tne
  const targetConfigLoad = 'Je.welcomeMessage&&setTgWelcomeMsg(Je.welcomeMessage)}}).catch(()=>{});';
  const newConfigLoad = 'Je.welcomeMessage&&setTgWelcomeMsg(Je.welcomeMessage);Je.proofBotToken&&setTgProofToken(Je.proofBotToken);Je.proofChatId&&setTgProofChatId(Je.proofChatId);if(typeof Je.enableAutoProof==="boolean")setTgAutoProof(Je.enableAutoProof);if(Je.proofChannelLink)setTgProofChannelLink(Je.proofChannelLink);}}).catch(()=>{});';
  if (code.includes(targetConfigLoad) && !code.includes('Je.proofBotToken&&setTgProofToken')) {
    code = code.replace(targetConfigLoad, newConfigLoad);
    changed = true;
    console.log('[Telegram Bot Patch] Updated config loader with proof bot fields');
  }

  // 5. Add to kr() return in tne
  const targetKr = 'howToUseBotLink:be.trim(),apkDownloadUrl:apkLink.trim(),';
  const newKr = 'howToUseBotLink:be.trim(),apkDownloadUrl:apkLink.trim(),telegramBotToken:tgBotToken.trim(),telegramChatId:tgChatId.trim(),telegramBotUsername:tgBotUsername.trim(),telegramWelcomeMsg:tgWelcomeMsg.trim(),proofBotToken:tgProofToken.trim(),proofChatId:tgProofChatId.trim(),enableAutoProof:tgAutoProof,proofChannelLink:tgProofChannelLink.trim(),';
  if (code.includes(targetKr)) {
    if (code.includes('telegramBotToken:tgBotToken.trim()')) {
      if (!code.includes('proofBotToken:tgProofToken.trim()')) {
        code = code.replace(
          'telegramWelcomeMsg:tgWelcomeMsg.trim(),',
          'telegramWelcomeMsg:tgWelcomeMsg.trim(),proofBotToken:tgProofToken.trim(),proofChatId:tgProofChatId.trim(),enableAutoProof:tgAutoProof,proofChannelLink:tgProofChannelLink.trim(),'
        );
        changed = true;
        console.log('[Telegram Bot Patch] Added proof properties to kr() return in tne');
      }
    } else {
      code = code.replace(targetKr, newKr);
      changed = true;
      console.log('[Telegram Bot Patch] Added all telegram & proof properties to kr() return in tne');
    }
  }

  // 6. Add Telegram Bot tab button in tne subtab bar if not present
  const targetSecBtn = 'r.jsx(nc,{className:"w-3.5 h-3.5"}),r.jsx("span",{children:"Master Security"})]})';
  const telegramTabBtn = ',r.jsxs("button",{onClick:()=>s("telegram"),className:`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${t==="telegram"?"bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(0,229,255,0.25)]":"text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"}`,children:[r.jsx(zF,{className:"w-3.5 h-3.5"}),r.jsx("span",{children:"🤖 Telegram Bot & APK"})]})';
  if (code.includes(targetSecBtn) && !code.includes('s("telegram")')) {
    code = code.replace(targetSecBtn, targetSecBtn + telegramTabBtn);
    changed = true;
    console.log('[Telegram Bot Patch] Added Telegram Bot & APK subtab button in tne');
  }

  // 7. Add main admin navigation item: {id:"telegram_bot",label:"🤖 Telegram Bot",icon:zF}
  const targetNavStore = '{id:"store_settings",label:"🎨 Store UI/UX Editor",icon:ND}';
  const newNavItems = '{id:"store_settings",label:"🎨 Store UI/UX Editor",icon:ND},{id:"telegram_bot",label:"🤖 Telegram Bot",icon:zF}';
  if (code.includes(targetNavStore) && !code.includes('id:"telegram_bot",label:"🤖 Telegram Bot",icon:zF')) {
    code = code.replace(targetNavStore, newNavItems);
    changed = true;
    console.log('[Telegram Bot Patch] Added telegram_bot to admin tabs list');
  }

  // 8. Add to admin search keywords
  const targetKeywordsStore = '{id:"store_settings",label:"🎨 Store UI/UX Editor",keywords:';
  const newKeywordsStore = '{id:"telegram_bot",label:"🤖 Telegram Bot",keywords:["telegram","bot","token","chatid","apk","update","telegram bot","webhook","proof","proofs","payment proof","group"]},{id:"store_settings",label:"🎨 Store UI/UX Editor",keywords:';
  if (code.includes(targetKeywordsStore) && !code.includes('id:"telegram_bot",label:"🤖 Telegram Bot",keywords:')) {
    code = code.replace(targetKeywordsStore, newKeywordsStore);
    changed = true;
    console.log('[Telegram Bot Patch] Added telegram_bot to admin search keywords');
  }

  // 9. Add to quick navigation buttons
  const targetQuickStore = '{id:"store_settings",label:"🎨 Store UI/UX"}';
  const newQuickStore = '{id:"store_settings",label:"🎨 Store UI/UX"},{id:"telegram_bot",label:"🤖 Telegram Bot"}';
  if (code.includes(targetQuickStore) && !code.includes('{id:"telegram_bot",label:"🤖 Telegram Bot"}')) {
    code = code.replace(targetQuickStore, newQuickStore);
    changed = true;
    console.log('[Telegram Bot Patch] Added telegram_bot to quick navigation buttons');
  }

  // 10. Update admin tab routing so l==="telegram_bot" renders tne with initialTab="telegram"
  const targetAdminRoute = 'l==="store_settings"&&r.jsx(tne,{settings:te,onSaveSettings:Ja})';
  const newAdminRoute = '(l==="store_settings"||l==="telegram_bot")&&r.jsx(tne,{settings:te,onSaveSettings:Ja,initialTab:l==="telegram_bot"?"telegram":"branding"})';
  if (code.includes(targetAdminRoute)) {
    code = code.replace(targetAdminRoute, newAdminRoute);
    changed = true;
    console.log('[Telegram Bot Patch] Updated admin tab routing for telegram_bot');
  }

  // 11. Full comprehensive Telegram Bot & Payment Proof Panel UI inside tne
  const fullTelegramPanel = ',t==="telegram"&&r.jsx("div",{className:"space-y-4",children:r.jsxs("div",{className:"bg-[#12121e] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 space-y-5 shadow-xl shadow-cyan-950/20",children:[' +
    // Top Bar
    'r.jsxs("div",{className:"flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/10 pb-4",children:[' +
      'r.jsxs("div",{className:"flex items-center gap-3",children:[' +
        'r.jsx("div",{className:"w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(0,229,255,0.25)]",children:r.jsx(zF,{className:"w-5 h-5"})}),' +
        'r.jsxs("div",{children:[' +
          'r.jsxs("h3",{className:"text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2",children:[' +
            'r.jsx("span",{children:"🤖 Telegram Bot & APK Control Center"}),' +
            'r.jsx("span",{className:"text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse",children:"● LIVE ENGINE ACTIVE"})' +
          ']}),' +
          'r.jsx("p",{className:"text-xs text-gray-400",children:"Edit your bot token, admin chat alerts, group & channel payment proofs forwarder, APK download channel, tutorials, and welcome messages in real-time."})' +
        ']})' +
      ']}),' +
      'r.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[' +
        'r.jsxs("a",{href:`https://t.me/${(tgBotUsername||"kalam_store_bot").replace("@","")}`,target:"_blank",rel:"noopener noreferrer",className:"px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",children:[' +
          'r.jsx(zF,{className:"w-3.5 h-3.5"}),' +
          'r.jsx("span",{children:"Open Bot ↗"})' +
        ']}),' +
        'r.jsx(Ge.button,{whileHover:{scale:1.02},whileTap:{scale:.98},disabled:tgTesting,onClick:async()=>{' +
          'setTgTesting(!0);setTgTestStatus(null);' +
          'try{' +
            'const He=await fetch("/api/admin/telegram/test",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({botToken:tgBotToken,chatId:tgChatId})});' +
            'const Wt=await He.json();' +
            'if(Wt.success){setTgTestStatus({ok:!0,msg:`✅ Bot Connected: @${Wt.botUsername} (${Wt.botFirstName||"Bot"}) — ${Wt.messageSent?"Test alert sent to Chat ID "+tgChatId+"!":"Verified!"}`});if(Wt.botUsername)setTgBotUsername("@"+Wt.botUsername);}' +
            'else{setTgTestStatus({ok:!1,msg:`❌ ${Wt.error||"Failed to connect to Telegram"}`});}' +
          '}catch(He){setTgTestStatus({ok:!1,msg:"❌ Error connecting to Telegram verification API"});}' +
          'finally{setTgTesting(!1);}' +
        '},className:"px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50",children:[' +
          'r.jsx(Ox,{className:"w-3.5 h-3.5"}),' +
          'r.jsx("span",{children:tgTesting?"Testing Connection...":"⚡ Test Connection & Alert"})' +
        ']}),' +
        'r.jsx(Ge.button,{whileHover:{scale:1.02},whileTap:{scale:.98},disabled:tgSaving,onClick:async()=>{' +
          'setTgSaving(!0);' +
          'try{' +
            'await fetch("/api/telegram-config",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({botToken:tgBotToken,chatId:tgChatId,botUsername:tgBotUsername,apkDownloadUrl:apkLink,howToUseBotLink:be,paymentProofChannel:J,welcomeMessage:tgWelcomeMsg,proofBotToken:tgProofToken,proofChatId:tgProofChatId,enableAutoProof:tgAutoProof,proofChannelLink:tgProofChannelLink})});' +
            'Fs("Telegram Bot & Group Proof settings saved and synchronized!");' +
            'setTgSaved(!0);setTimeout(()=>setTgSaved(!1),2500);' +
          '}catch(He){console.error(He);}' +
          'finally{setTgSaving(!1);}' +
        '},className:"px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50",children:' +
          'tgSaved?r.jsxs(r.Fragment,{children:[r.jsx(Sn,{className:"w-3.5 h-3.5 text-black stroke-[3]"}),r.jsx("span",{children:"Saved & Synced!"})]}):r.jsxs(r.Fragment,{children:[r.jsx(Mc,{className:"w-3.5 h-3.5 text-black"}),r.jsx("span",{children:tgSaving?"Saving...":"Save All Bot Settings"})]})' +
        '})' +
      ']})' +
    ']}),' +

    // Live Feedback Banners
    'tgLiveStatus&&r.jsxs("div",{className:`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border ${tgLiveStatus.ok?"bg-emerald-500/15 border-emerald-500/40 text-emerald-300":"bg-rose-500/15 border-rose-500/40 text-rose-300"}`,children:[' +
      'r.jsx("span",{className:"font-mono",children:tgLiveStatus.msg}),' +
      'r.jsx("button",{onClick:()=>setTgLiveStatus(null),className:"text-gray-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer",children:"✕"})' +
    ']}),' +

    'tgDetectHint&&r.jsxs("div",{className:`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border ${tgDetectHint.ok?"bg-cyan-500/15 border-cyan-500/40 text-cyan-300":"bg-amber-500/15 border-amber-500/40 text-amber-300"}`,children:[' +
      'r.jsx("span",{className:"font-mono",children:tgDetectHint.msg}),' +
      'r.jsx("button",{onClick:()=>setTgDetectHint(null),className:"text-gray-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer",children:"✕"})' +
    ']}),' +

    // Real-Time Test Alert Banner
    'tgTestStatus&&r.jsxs("div",{className:`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border ${tgTestStatus.ok?"bg-emerald-500/15 border-emerald-500/40 text-emerald-300":"bg-rose-500/15 border-rose-500/40 text-rose-300"}`,children:[' +
      'r.jsx("span",{className:"font-mono",children:tgTestStatus.msg}),' +
      'r.jsx("button",{onClick:()=>setTgTestStatus(null),className:"text-gray-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer",children:"✕"})' +
    ']}),' +

    // Section 1: Bot Token & Chat ID
    'r.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[' +
      // Bot Token
      'r.jsxs("div",{className:"bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-2",children:[' +
        'r.jsxs("div",{className:"flex items-center justify-between",children:[' +
          'r.jsxs("label",{className:"text-xs font-bold text-gray-300 flex items-center gap-1.5",children:[' +
            'r.jsx(zF,{className:"w-3.5 h-3.5 text-cyan-400"}),' +
            'r.jsx("span",{children:"Telegram Bot Token (from @BotFather)"})' +
          ']}),' +
          'r.jsx("button",{type:"button",onClick:()=>setShowTgToken(!showTgToken),className:"text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer",children:showTgToken?r.jsxs(r.Fragment,{children:[r.jsx(rf,{className:"w-3 h-3"}),"Hide"]}):r.jsxs(r.Fragment,{children:[r.jsx(Wc,{className:"w-3 h-3"}),"Show"]})})' +
        ']}),' +
        'r.jsx("input",{type:showTgToken?"text":"password",value:tgBotToken,onChange:He=>setTgBotToken(He.target.value),placeholder:"8990109048:AAEin2WyZl3pGdKXrPSQftMn8-Yh1g0Gop8",className:"w-full px-3 py-2 rounded-lg bg-black/70 border border-cyan-500/30 focus:border-cyan-400 focus:outline-none text-white font-mono text-xs shadow-inner"}),' +
        'r.jsx("p",{className:"text-[10px] text-gray-400",children:"Secret HTTP API bot token from @BotFather. This token powers all live bot messaging and alerts."})' +
      ']}),' +

      // Admin Chat ID
      'r.jsxs("div",{className:"bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-2",children:[' +
        'r.jsxs("label",{className:"text-xs font-bold text-gray-300 flex items-center justify-between",children:[' +
          'r.jsxs("span",{className:"flex items-center gap-1.5",children:[' +
            'r.jsx(nc,{className:"w-3.5 h-3.5 text-cyan-400"}),' +
            'r.jsx("span",{children:"Admin Telegram Chat ID (Alert Target)"})' +
          ']}),' +
          'r.jsx("span",{className:"text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",children:"ALERT TARGET"})' +
        ']}),' +
        'r.jsxs("div",{className:"flex gap-2",children:[' +
          'r.jsx("input",{type:"text",value:tgChatId,onChange:He=>setTgChatId(He.target.value),placeholder:"7768975239",className:"w-full px-3 py-2 rounded-lg bg-black/70 border border-cyan-500/30 focus:border-cyan-400 focus:outline-none text-white font-mono text-xs shadow-inner"}),' +
          'r.jsxs("button",{type:"button",disabled:tgDetecting,onClick:async()=>{' +
            'setTgDetecting(!0);setTgDetectHint(null);' +
            'try{' +
              'const res=await fetch("/api/admin/telegram/recent-chats?botToken="+encodeURIComponent(tgBotToken));' +
              'const data=await res.json();' +
              'if(data.success&&data.chats&&data.chats.length>0){' +
                'const topChat=data.chats[0];' +
                'setTgChatId(topChat.chatId);' +
                'setTgDetectHint({ok:!0,msg:`✅ Auto-detected Chat ID: ${topChat.chatId} (${topChat.title||topChat.username||topChat.firstName||"Chat"})`});' +
              '}else{' +
                'setTgDetectHint({ok:!1,msg:`⚠️ No recent chats. Send /start or /myid to @${(tgBotUsername||"bot").replace("@","")} in Telegram, then click Auto-Detect again!`});' +
              '}' +
            '}catch(e){setTgDetectHint({ok:!1,msg:"❌ Failed to query Telegram updates"});}' +
            'finally{setTgDetecting(!1);}' +
          '},className:"px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold whitespace-nowrap flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50",children:[' +
            'r.jsx(Ox,{className:"w-3 h-3"}),' +
            'r.jsx("span",{children:tgDetecting?"Detecting...":"Auto-Detect ID"})' +
          ']})' +
        ']}),' +
        'r.jsx("p",{className:"text-[10px] text-gray-400",children:"Your numeric Telegram ID or Admin group ID. Tip: Send /myid to the bot or click Auto-Detect ID to fill this automatically."})' +
      ']})' +
    ']}),' +

    // Live Credentials Quick-Apply Bar
    'r.jsxs("div",{className:"bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg",children:[' +
      'r.jsxs("div",{className:"space-y-0.5 text-center sm:text-left",children:[' +
        'r.jsxs("div",{className:"text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5",children:[' +
          'r.jsx(zF,{className:"w-3.5 h-3.5 text-cyan-400"}),' +
          'r.jsx("span",{children:"Live Token & Chat ID Synchronizer"}),' +
          'r.jsx("span",{className:"text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30",children:"LIVE RELOAD"})' +
        ']}),' +
        'r.jsx("div",{className:"text-[10px] text-gray-400",children:"Validates token via Telegram API live, links the Chat ID, saves settings, and sends an instant test alert."})' +
      ']}),' +
      'r.jsx(Ge.button,{whileHover:{scale:1.02},whileTap:{scale:.98},disabled:tgLiveUpdating,onClick:async()=>{' +
        'setTgLiveUpdating(!0);setTgLiveStatus(null);' +
        'try{' +
          'const res=await fetch("/api/admin/telegram/live-credentials",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({botToken:tgBotToken,chatId:tgChatId,sendTestAlert:!0})});' +
          'const data=await res.json();' +
          'if(data.success){' +
            'if(data.botUsername)setTgBotUsername(data.botUsername);' +
            'setTgLiveStatus({ok:!0,msg:`✅ Credentials Updated Live! Connected to ${data.botUsername} (${data.botFirstName||"Bot"}) — ${data.testAlertSent?"Test alert sent to Chat ID "+tgChatId+"!":"Verified!"}`});' +
            'Fs("Telegram Bot credentials updated live!");' +
          '}else{' +
            'setTgLiveStatus({ok:!1,msg:`❌ ${data.error||"Failed to update Telegram credentials"}`});' +
          '}' +
        '}catch(e){setTgLiveStatus({ok:!1,msg:"❌ Network error connecting to live credentials endpoint"});}' +
        'finally{setTgLiveUpdating(!1);}' +
      '},className:"px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-black text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/30 whitespace-nowrap disabled:opacity-50",children:[' +
        'r.jsx(Sn,{className:"w-3.5 h-3.5 text-black stroke-[3]"}),' +
        'r.jsx("span",{children:tgLiveUpdating?"Applying Live...":"⚡ Change & Apply Live"})' +
      ']})' +
    ']}),' +

    // Dedicated Section: Secondary Bot & Public Payment Proofs Dispatcher (Works for Channels & Groups)
    'r.jsxs("div",{className:"bg-gradient-to-r from-purple-950/40 via-blue-950/30 to-indigo-950/40 border border-purple-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl shadow-purple-950/25",children:[' +
      'r.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3",children:[' +
        'r.jsxs("div",{className:"flex items-center gap-3",children:[' +
          'r.jsx("div",{className:"w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.25)]",children:r.jsx(Rp,{className:"w-5 h-5"})}),' +
          'r.jsxs("div",{children:[' +
            'r.jsxs("h4",{className:"text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2",children:[' +
              'r.jsx("span",{children:"📢 Group & Channel Payment Proofs Forwarder"}),' +
              'r.jsx("span",{className:"text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30",children:"AUTO-PROOF FOR GROUPS & CHANNELS"})' +
            ']}),' +
            'r.jsx("p",{className:"text-xs text-gray-400",children:"Automatically forwards key purchase details (with keys securely masked like ABCD-****-1234) to your Telegram Group or Channel for customer trust and proof."})' +
          ']})' +
        ']}),' +
        'r.jsxs("button",{type:"button",onClick:()=>setTgAutoProof(!tgAutoProof),className:`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${tgAutoProof?"bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]":"bg-white/5 text-gray-400 border-white/10"}`,children:[' +
          'r.jsx("span",{className:`w-2.5 h-2.5 rounded-full ${tgAutoProof?"bg-emerald-400 animate-pulse":"bg-gray-500"}`}),' +
          'r.jsx("span",{children:tgAutoProof?"Auto-Proofs: ENABLED":"Auto-Proofs: DISABLED"})' +
        ']})' +
      ']}),' +

      // Test Proof Status Banner
      'tgProofTestStatus&&r.jsxs("div",{className:`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border ${tgProofTestStatus.ok?"bg-emerald-500/15 border-emerald-500/40 text-emerald-300":"bg-rose-500/15 border-rose-500/40 text-rose-300"}`,children:[' +
        'r.jsx("span",{className:"font-mono",children:tgProofTestStatus.msg}),' +
        'r.jsx("button",{onClick:()=>setTgProofTestStatus(null),className:"text-gray-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer",children:"✕"})' +
      ']}),' +

      // Group Detect Hint Banner
      'tgProofDetectHint&&r.jsxs("div",{className:`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border ${tgProofDetectHint.ok?"bg-cyan-500/15 border-cyan-500/40 text-cyan-300":"bg-amber-500/15 border-amber-500/40 text-amber-300"}`,children:[' +
        'r.jsx("span",{className:"font-mono",children:tgProofDetectHint.msg}),' +
        'r.jsx("button",{onClick:()=>setTgProofDetectHint(null),className:"text-gray-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer",children:"✕"})' +
      ']}),' +

      // Grid for Proof Bot Token & Proof Group/Channel Chat ID
      'r.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[' +
        // Proof Bot Token
        'r.jsxs("div",{className:"bg-black/40 border border-purple-500/30 rounded-xl p-3.5 space-y-2",children:[' +
          'r.jsxs("div",{className:"flex items-center justify-between",children:[' +
            'r.jsxs("label",{className:"text-xs font-bold text-gray-300 flex items-center gap-1.5",children:[' +
              'r.jsx(zF,{className:"w-3.5 h-3.5 text-purple-400"}),' +
              'r.jsx("span",{children:"Proof Bot Token (from @BotFather)"})' +
            ']}),' +
            'r.jsx("button",{type:"button",onClick:()=>setShowProofToken(!showProofToken),className:"text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer",children:showProofToken?r.jsxs(r.Fragment,{children:[r.jsx(rf,{className:"w-3 h-3"}),"Hide"]}):r.jsxs(r.Fragment,{children:[r.jsx(Wc,{className:"w-3 h-3"}),"Show"]})})' +
          ']}),' +
          'r.jsx("input",{type:showProofToken?"text":"password",value:tgProofToken,onChange:He=>setTgProofToken(He.target.value),placeholder:"Optional: Leave blank to use Main Bot Token",className:"w-full px-3 py-2 rounded-lg bg-black/70 border border-purple-500/30 focus:border-purple-400 focus:outline-none text-white font-mono text-xs shadow-inner"}),' +
          'r.jsx("p",{className:"text-[10px] text-gray-400",children:"Token of bot that posts proofs. If empty, the main bot token will post the receipts automatically."})' +
        ']}),' +

        // Proof Group / Channel Chat ID
        'r.jsxs("div",{className:"bg-black/40 border border-purple-500/30 rounded-xl p-3.5 space-y-2",children:[' +
          'r.jsxs("label",{className:"text-xs font-bold text-gray-300 flex items-center justify-between",children:[' +
            'r.jsxs("span",{className:"flex items-center gap-1.5",children:[' +
              'r.jsx(nc,{className:"w-3.5 h-3.5 text-purple-400"}),' +
              'r.jsx("span",{children:"Proof Group / Channel ID (e.g. -100xxxxxxxxxx or @group)"})' +
            ']}),' +
            'r.jsx("span",{className:"text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30",children:"TARGET GROUP/CHANNEL"})' +
          ']}),' +
          'r.jsxs("div",{className:"flex gap-2",children:[' +
            'r.jsx("input",{type:"text",value:tgProofChatId,onChange:He=>setTgProofChatId(He.target.value),placeholder:"-1002345678901 or @kalam_proofs",className:"w-full px-3 py-2 rounded-lg bg-black/70 border border-purple-500/30 focus:border-purple-400 focus:outline-none text-white font-mono text-xs shadow-inner"}),' +
            'r.jsxs("button",{type:"button",disabled:tgProofDetecting,onClick:async()=>{' +
              'setTgProofDetecting(!0);setTgProofDetectHint(null);' +
              'try{' +
                'const tokenToUse=(tgProofToken&&tgProofToken.trim())||tgBotToken.trim();' +
                'const res=await fetch("/api/admin/telegram/recent-chats?botToken="+encodeURIComponent(tokenToUse));' +
                'const data=await res.json();' +
                'if(data.success&&data.chats&&data.chats.length>0){' +
                  'const groupChat=data.chats.find(c=>c.type==="supergroup"||c.type==="group"||c.type==="channel")||data.chats[0];' +
                  'setTgProofChatId(groupChat.chatId);' +
                  'const name=groupChat.title||groupChat.username||groupChat.firstName||"Chat";' +
                  'setTgProofDetectHint({ok:!0,msg:`✅ Auto-detected ${groupChat.type==="private"?"Chat":"Group/Channel"} ID: ${groupChat.chatId} (${name})`});' +
                '}else{' +
                  'setTgProofDetectHint({ok:!1,msg:"⚠️ No recent messages found. Add your Bot to the Telegram Group/Channel as Admin and send a message (e.g. /test or hi) in the group, then click Auto-Detect again!"});' +
                '}' +
              '}catch(e){setTgProofDetectHint({ok:!1,msg:"❌ Failed to query Telegram updates"});}' +
              'finally{setTgProofDetecting(!1);}' +
            '},className:"px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold whitespace-nowrap flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50",children:[' +
              'r.jsx(Ox,{className:`w-3 h-3 ${tgProofDetecting?"animate-spin":""}`}),' +
              'r.jsx("span",{children:tgProofDetecting?"Detecting...":"Auto-Detect Group ID"})' +
            ']})' +
          ']}),' +
          'r.jsx("p",{className:"text-[10px] text-gray-400",children:"Group ID (e.g. -100xxxxxxxxxx) or @group_username. Make sure the Bot is added to the Group with Admin permissions!"})' +
        ']})' +
      ']}),' +

      // Proof Channel Link & Test Dispatch Action
      'r.jsxs("div",{className:"bg-black/40 border border-purple-500/30 rounded-xl p-3.5 space-y-3",children:[' +
        'r.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-3",children:[' +
          'r.jsxs("div",{className:"flex-1 space-y-1",children:[' +
            'r.jsxs("label",{className:"text-xs font-bold text-gray-300 flex items-center justify-between",children:[' +
              'r.jsxs("span",{className:"flex items-center gap-1.5",children:[' +
                'r.jsx(Rp,{className:"w-3.5 h-3.5 text-purple-400"}),' +
                'r.jsx("span",{children:"Public Payment Proof Group / Channel Link (Website Link)"})' +
              ']}),' +
              'tgProofChannelLink&&r.jsx("a",{href:tgProofChannelLink,target:"_blank",rel:"noopener noreferrer",className:"text-[10px] text-purple-400 hover:underline flex items-center gap-0.5",children:"Open Group ↗"})' +
            ']}),' +
            'r.jsx("input",{type:"text",value:tgProofChannelLink,onChange:He=>setTgProofChannelLink(He.target.value),placeholder:"https://t.me/kalam_vouch_channel or https://t.me/+InviteLink",className:"w-full px-3 py-2 rounded-lg bg-black/70 border border-purple-500/30 focus:border-purple-400 focus:outline-none text-white font-mono text-xs shadow-inner"}),' +
            'r.jsx("p",{className:"text-[10px] text-gray-400",children:"Public or invite link of your group/channel shown to buyers so they can join and view real-time delivery receipts."})' +
          ']}),' +
          'r.jsx("div",{className:"flex items-end sm:pt-4",children:' +
            'r.jsx(Ge.button,{whileHover:{scale:1.02},whileTap:{scale:.98},disabled:tgProofTesting,onClick:async()=>{' +
              'setTgProofTesting(!0);setTgProofTestStatus(null);' +
              'try{' +
                'const res=await fetch("/api/admin/telegram/test-proof",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({proofBotToken:tgProofToken,proofChatId:tgProofChatId,botToken:tgBotToken})});' +
                'const data=await res.json();' +
                'if(data.success){' +
                  'setTgProofTestStatus({ok:!0,msg:`✅ Test Proof Sent Successfully to ${tgProofChatId} via @${data.botUsername}! (Masked Key: KALAM-****-7711)`});' +
                  'Fs("Test payment proof sent to group/channel!");' +
                '}else{' +
                  'setTgProofTestStatus({ok:!1,msg:`❌ ${data.error||"Failed to send test proof to group/channel"}`});' +
                '}' +
              '}catch(e){setTgProofTestStatus({ok:!1,msg:"❌ Network error sending test proof"});}' +
              'finally{setTgProofTesting(!1);}' +
            '},className:"px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-950/40 whitespace-nowrap disabled:opacity-50",children:[' +
              'r.jsx(Ox,{className:`w-3.5 h-3.5 ${tgProofTesting?"animate-spin":""}`}),' +
              'r.jsx("span",{children:tgProofTesting?"Sending Test Proof...":"🧪 Test Send Proof Receipt"})' +
            ']})' +
          '})' +
        ']})' +
      ']})' +
    ']}),' +

    // Section 2: Bot Username & Proofs Channel
    'r.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[' +
      // Bot Username
      'r.jsxs("div",{className:"bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-2",children:[' +
        'r.jsxs("label",{className:"text-xs font-bold text-gray-300 flex items-center justify-between",children:[' +
          'r.jsxs("span",{className:"flex items-center gap-1.5",children:[' +
            'r.jsx(Yp,{className:"w-3.5 h-3.5 text-cyan-400"}),' +
            'r.jsx("span",{children:"Telegram Bot Handle / Username"})' +
          ']}),' +
          'r.jsx("a",{href:`https://t.me/${(tgBotUsername||"kalam_store_bot").replace("@","")}`,target:"_blank",rel:"noopener noreferrer",className:"text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5",children:"Preview ↗"})' +
        ']}),' +
        'r.jsx("input",{type:"text",value:tgBotUsername,onChange:He=>setTgBotUsername(He.target.value),placeholder:"@kalam_store_bot",className:"w-full px-3 py-2 rounded-lg bg-black/70 border border-cyan-500/30 focus:border-cyan-400 focus:outline-none text-white font-mono text-xs shadow-inner"}),' +
        'r.jsx("p",{className:"text-[10px] text-gray-400",children:"The public username of your Telegram Bot. Used for customer redirection buttons on the website."})' +
      ']}),' +

      // Payment Proofs Channel
      'r.jsxs("div",{className:"bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-2",children:[' +
        'r.jsxs("label",{className:"text-xs font-bold text-gray-300 flex items-center justify-between",children:[' +
          'r.jsxs("span",{className:"flex items-center gap-1.5",children:[' +
            'r.jsx(Rp,{className:"w-3.5 h-3.5 text-cyan-400"}),' +
            'r.jsx("span",{children:"Payment Proofs & Vouch Channel Link"})' +
          ']}),' +
          'r.jsx("a",{href:J,target:"_blank",rel:"noopener noreferrer",className:"text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5",children:"Test ↗"})' +
        ']}),' +
        'r.jsx("input",{type:"text",value:J,onChange:He=>xe(He.target.value),placeholder:"https://t.me/yourchannel",className:"w-full px-3 py-2 rounded-lg bg-black/70 border border-cyan-500/30 focus:border-cyan-400 focus:outline-none text-white font-mono text-xs shadow-inner"}),' +
        'r.jsx("p",{className:"text-[10px] text-gray-400",children:"Channel where transaction proofs, receipts, and vouches are publicly posted."})' +
      ']})' +
    ']}),' +

    // Section 3: Live APK Link & Tutorial Link
    'r.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[' +
      // APK Download Link
      'r.jsxs("div",{className:"bg-black/50 border border-cyan-500/40 rounded-xl p-3.5 space-y-2 shadow-inner",children:[' +
        'r.jsxs("label",{className:"text-xs font-black text-cyan-300 flex items-center justify-between",children:[' +
          'r.jsxs("span",{className:"flex items-center gap-1.5",children:[' +
            'r.jsx(io,{className:"w-4 h-4 text-cyan-400"}),' +
            'r.jsx("span",{children:"Live APK Download Link (Bot \'Check Update\' & /apk)"})' +
          ']}),' +
          'r.jsx("span",{className:"text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",children:"LIVE URL"})' +
        ']}),' +
        'r.jsxs("div",{className:"flex gap-2",children:[' +
          'r.jsx("input",{type:"text",value:apkLink,onChange:He=>setApkLink(He.target.value),placeholder:"https://t.me/kalamffpanel",className:"w-full px-3 py-2 rounded-lg bg-black/80 border border-cyan-500/40 focus:border-cyan-400 focus:outline-none text-white font-mono text-xs shadow-inner"}),' +
          'r.jsx("a",{href:apkLink,target:"_blank",rel:"noopener noreferrer",className:"px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold whitespace-nowrap flex items-center gap-1 shrink-0 cursor-pointer",children:"Test ↗"})' +
        ']}),' +
        'r.jsx("p",{className:"text-[10px] text-gray-400",children:"Delivered whenever customers tap \'Check Update\', \'Download APK\' or use commands /apk / /update."})' +
      ']}),' +

      // Tutorial Link
      'r.jsxs("div",{className:"bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-2",children:[' +
        'r.jsxs("label",{className:"text-xs font-bold text-gray-300 flex items-center justify-between",children:[' +
          'r.jsxs("span",{className:"flex items-center gap-1.5",children:[' +
            'r.jsx(Ox,{className:"w-3.5 h-3.5 text-cyan-400"}),' +
            'r.jsx("span",{children:"Bot Tutorial / How-to-Use Video Link"})' +
          ']}),' +
          'r.jsx("a",{href:be,target:"_blank",rel:"noopener noreferrer",className:"text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5",children:"Test ↗"})' +
        ']}),' +
        'r.jsxs("div",{className:"flex gap-2",children:[' +
          'r.jsx("input",{type:"text",value:be,onChange:He=>we(He.target.value),placeholder:"https://t.me/yourchannel/3 or YouTube link",className:"w-full px-3 py-2 rounded-lg bg-black/70 border border-cyan-500/30 focus:border-cyan-400 focus:outline-none text-white font-mono text-xs shadow-inner"}),' +
          'r.jsx("a",{href:be,target:"_blank",rel:"noopener noreferrer",className:"px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold whitespace-nowrap flex items-center gap-1 shrink-0 cursor-pointer",children:"View ↗"})' +
        ']}),' +
        'r.jsx("p",{className:"text-[10px] text-gray-400",children:"Link delivered to users when they request help or installation video guides."})' +
      ']})' +
    ']}),' +

    // Section 4: Welcome Greeting Message Textarea
    'r.jsxs("div",{className:"bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-2",children:[' +
      'r.jsxs("label",{className:"text-xs font-bold text-gray-300 flex items-center justify-between",children:[' +
        'r.jsxs("span",{className:"flex items-center gap-1.5",children:[' +
          'r.jsx(Ox,{className:"w-3.5 h-3.5 text-cyan-400"}),' +
          'r.jsx("span",{children:"Custom Bot Welcome Greeting Message (/start greeting)"})' +
        ']}),' +
        'r.jsx("span",{className:"text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-gray-300",children:"WELCOME PROMPT"})' +
      ']}),' +
      'r.jsx("textarea",{rows:2,value:tgWelcomeMsg,onChange:He=>setTgWelcomeMsg(He.target.value),placeholder:"🔥 Welcome to KALAM STORE Bot! Instant Key Delivery & Automated UPI Wallet.",className:"w-full px-3 py-2 rounded-lg bg-black/70 border border-cyan-500/30 focus:border-cyan-400 focus:outline-none text-white font-sans text-xs shadow-inner resize-none"}),' +
      'r.jsx("p",{className:"text-[10px] text-gray-400",children:"This greeting message is sent to every user when they start the bot or click /start."})' +
    ']}),' +

    // Section 4b: Registered Telegram Bot Users Directory (IDs, Names, Usernames & Balances)
    'r.jsxs("div",{className:"bg-black/50 border border-cyan-500/30 rounded-xl p-3.5 sm:p-4 space-y-3.5 shadow-lg",children:[' +
      'r.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3",children:[' +
        'r.jsxs("div",{className:"flex items-center gap-2",children:[' +
          'r.jsx("div",{className:"w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0",children:r.jsx(Yp,{className:"w-4 h-4"})}),' +
          'r.jsxs("div",{children:[' +
            'r.jsxs("div",{className:"text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2",children:[' +
              'r.jsx("span",{children:"👥 Telegram Bot Users Directory"}),' +
              'r.jsxs("span",{className:"text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",children:[tgUsers.length," USERS"]})' +
            ']}),' +
            'r.jsx("p",{className:"text-[10px] sm:text-xs text-gray-400",children:"Registered Telegram customers with user IDs, names, usernames, and wallet balances."})' +
          ']})' +
        ']}),' +
        'r.jsxs("div",{className:"flex items-center gap-2",children:[' +
          'r.jsx("input",{type:"text",value:tgUserSearch,onChange:He=>setTgUserSearch(He.target.value),placeholder:"🔍 Search ID / name...",className:"px-2.5 py-1.5 rounded-lg bg-black/70 border border-cyan-500/30 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono placeholder:text-gray-500 w-36 sm:w-48"}),' +
          'r.jsxs(Ge.button,{whileHover:{scale:1.02},whileTap:{scale:.98},disabled:tgUsersLoading,onClick:async()=>{' +
            'setTgUsersLoading(!0);' +
            'try{' +
              'const res=await fetch("/api/admin/telegram/users");' +
              'const data=await res.json();' +
              'if(data&&data.users){' +
                'setTgUsers(data.users);' +
                'Fs(`Loaded ${data.users.length} Telegram bot users!`);' +
              '}' +
            '}catch(e){Fs("Failed to load Telegram users");}' +
            'finally{setTgUsersLoading(!1);}' +
          '},className:"px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0",children:[' +
            'r.jsx(Ox,{className:`w-3.5 h-3.5 ${tgUsersLoading?"animate-spin":""}`}),' +
            'r.jsx("span",{children:tgUsersLoading?"Loading...":"Refresh"})' +
          ']})' +
        ']})' +
      ']}),' +

      // Inline Add Balance Modal
      'tgCreditUser&&r.jsxs("div",{className:"p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-2.5 shadow-md",children:[' +
        'r.jsxs("div",{className:"flex items-center justify-between border-b border-white/10 pb-2",children:[' +
          'r.jsxs("div",{className:"flex items-center gap-2",children:[' +
            'r.jsx("span",{className:"text-xs font-black text-cyan-300 uppercase",children:"➕ Add Balance:"}),' +
            'r.jsx("span",{className:"text-xs font-bold text-white",children:tgCreditUser.fullName||tgCreditUser.firstName}),' +
            'r.jsxs("span",{className:"text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-cyan-300 border border-cyan-500/30",children:["ID: ",tgCreditUser.chatId]})' +
          ']}),' +
          'r.jsx("button",{type:"button",onClick:()=>{setTgCreditUser(null);setTgCreditMsg(null);},className:"text-gray-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer",children:"✕ Close"})' +
        ']}),' +
        'tgCreditMsg&&r.jsxs("div",{className:`p-2 rounded-lg text-xs font-medium flex items-center justify-between ${tgCreditMsg.ok?"bg-emerald-500/20 text-emerald-300 border border-emerald-500/30":"bg-rose-500/20 text-rose-300 border border-rose-500/30"}`,children:[' +
          'r.jsx("span",{children:tgCreditMsg.msg}),' +
          'r.jsx("button",{type:"button",onClick:()=>setTgCreditMsg(null),className:"text-xs px-1",children:"✕"})' +
        ']}),' +
        'r.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[' +
          'r.jsxs("div",{className:"space-y-1",children:[' +
            'r.jsx("label",{className:"text-[11px] font-bold text-gray-300",children:"Amount to Add (₹):"}),' +
            'r.jsx("input",{type:"number",value:tgCreditAmt,onChange:He=>setTgCreditAmt(He.target.value),placeholder:"100",className:"w-full px-2.5 py-1.5 rounded-lg bg-black/70 border border-cyan-500/30 focus:border-cyan-400 text-white font-mono text-xs focus:outline-none"}),' +
            'r.jsxs("div",{className:"flex gap-1 pt-1",children:[50,100,200,500].map(amt=>r.jsx("button",{key:amt,type:"button",onClick:()=>setTgCreditAmt(String(amt)),className:"px-2 py-0.5 rounded bg-white/5 hover:bg-cyan-500/20 text-[10px] font-mono text-cyan-300 border border-white/10 cursor-pointer",children:`+₹${amt}`}))})' +
          ']}),' +
          'r.jsxs("div",{className:"space-y-1",children:[' +
            'r.jsx("label",{className:"text-[11px] font-bold text-gray-300",children:"Reason / Note:"}),' +
            'r.jsx("input",{type:"text",value:tgCreditReason,onChange:He=>setTgCreditReason(He.target.value),placeholder:"Manual admin credit via Web Panel",className:"w-full px-2.5 py-1.5 rounded-lg bg-black/70 border border-cyan-500/30 focus:border-cyan-400 text-white text-xs focus:outline-none"}),' +
            'r.jsxs("div",{className:"flex justify-end gap-2 pt-1",children:[' +
              'r.jsx("button",{type:"button",onClick:()=>{setTgCreditUser(null);setTgCreditMsg(null);},className:"px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold cursor-pointer",children:"Cancel"}),' +
              'r.jsx("button",{type:"button",disabled:tgCrediting||!tgCreditAmt||Number(tgCreditAmt)<=0,onClick:async()=>{' +
                'setTgCrediting(!0);setTgCreditMsg(null);' +
                'try{' +
                  'const res=await fetch("/api/admin/telegram/users/add-balance",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:tgCreditUser.userId,chatId:tgCreditUser.chatId,amount:Number(tgCreditAmt),reason:tgCreditReason})});' +
                  'const d=await res.json();' +
                  'if(d.success){' +
                    'setTgCreditMsg({ok:!0,msg:`✅ Added ₹${tgCreditAmt} to ${tgCreditUser.fullName||tgCreditUser.firstName}! (New Balance: ₹${d.newBalance.toFixed(2)})`});' +
                    'Fs(`Added ₹${tgCreditAmt} to ${tgCreditUser.fullName}!`);' +
                    'setTgCreditAmt("");' +
                    'const ures=await fetch("/api/admin/telegram/users");' +
                    'const udata=await ures.json();' +
                    'if(udata&&udata.users)setTgUsers(udata.users);' +
                  '}else{' +
                    'setTgCreditMsg({ok:!1,msg:`❌ ${d.error||"Failed to credit balance"}`});' +
                  '}' +
                '}catch(e){setTgCreditMsg({ok:!1,msg:"❌ Network error while crediting balance"});}' +
                'finally{setTgCrediting(!1);}' +
              '},className:"px-3.5 py-1 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-xs font-extrabold cursor-pointer disabled:opacity-50",children:tgCrediting?"Crediting...":"Confirm & Credit ₹"})' +
            ']})' +
          ']})' +
        ']})' +
      ']}),' +

      // User Cards List
      'r.jsx("div",{className:"space-y-2 max-h-[380px] overflow-y-auto pr-1",children:' +
        '(()=>{' +
          'const filtered=tgUsers.filter(u=>{' +
            'if(!tgUserSearch.trim())return!0;' +
            'const q=tgUserSearch.toLowerCase().trim();' +
            'return String(u.chatId).includes(q)||(u.fullName&&u.fullName.toLowerCase().includes(q))||(u.firstName&&u.firstName.toLowerCase().includes(q))||(u.username&&u.username.toLowerCase().includes(q))||(u.userId&&u.userId.toLowerCase().includes(q));' +
          '});' +
          'if(filtered.length===0){' +
            'return r.jsxs("div",{className:"text-center py-6 px-4 border border-dashed border-white/10 rounded-xl space-y-1.5",children:[' +
              'r.jsx("div",{className:"w-10 h-10 mx-auto rounded-full bg-white/5 flex items-center justify-center text-gray-400",children:r.jsx(Yp,{className:"w-5 h-5"})}),' +
              'r.jsx("div",{className:"text-xs font-bold text-gray-300",children:tgUsers.length===0?"No Telegram bot users registered yet":"No users match your search"}),' +
              'r.jsx("p",{className:"text-[10px] text-gray-500",children:tgUsers.length===0?"Users appear here when they send /start to your bot in Telegram.":"Try searching with a different user ID, name, or handle."})' +
            ']});' +
          '}' +
          'return filtered.map((u,idx)=>{' +
            'const isAdm=String(u.chatId)==="7768975239"||String(u.chatId)===String(tgChatId);' +
            'const userHandle=u.username?`@${u.username}`:"(no handle)";' +
            'const lastActiveStr=u.lastActive?new Date(u.lastActive).toLocaleString("en-IN",{dateStyle:"short",timeStyle:"short"}):"N/A";' +
            'return r.jsxs("div",{key:u.chatId||idx,className:"p-2.5 sm:p-3 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-inner",children:[' +
              'r.jsxs("div",{className:"flex items-center gap-2.5 min-w-0",children:[' +
                'r.jsx("div",{className:`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${isAdm?"bg-amber-500/20 text-amber-300 border-amber-500/40":"bg-cyan-500/20 text-cyan-300 border-cyan-500/40"}`,children:(u.firstName||"U")[0].toUpperCase()}),' +
                'r.jsxs("div",{className:"space-y-0.5 min-w-0",children:[' +
                  'r.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[' +
                    'r.jsx("span",{className:"text-xs font-extrabold text-white truncate",children:u.fullName||u.firstName||"User"}),' +
                    'u.username?r.jsx("a",{href:`https://t.me/${u.username}`,target:"_blank",rel:"noopener noreferrer",className:"text-[11px] font-mono font-medium text-cyan-400 hover:underline",children:userHandle}):r.jsx("span",{className:"text-[11px] text-gray-500",children:userHandle}),' +
                    'isAdm&&r.jsx("span",{className:"text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider",children:"👑 ADMIN"})' +
                  ']}),' +
                  'r.jsxs("div",{className:"flex flex-wrap items-center gap-1.5 text-[10px] font-mono",children:[' +
                    'r.jsxs("button",{type:"button",onClick:()=>{navigator.clipboard.writeText(String(u.chatId));Fs(`Copied Telegram User ID: ${u.chatId}`);},className:"px-1.5 py-0.5 rounded bg-black/60 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono flex items-center gap-1 cursor-pointer",title:"Click to copy ID",children:[' +
                      'r.jsx(nc,{className:"w-2.5 h-2.5"}),' +
                      'r.jsx("span",{children:`ID: ${u.chatId}`}),' +
                      'r.jsx("span",{className:"text-[8px] text-gray-500",children:"(copy)"})' +
                    ']}),' +
                    'r.jsx("span",{className:"text-gray-500",children:"•"}),' +
                    'r.jsx("span",{className:"text-gray-400",children:`Last seen: ${lastActiveStr}`})' +
                  ']})' +
                ']})' +
              ']}),' +
              'r.jsxs("div",{className:"flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-white/5",children:[' +
                'r.jsxs("div",{className:"text-left sm:text-right space-y-0.5",children:[' +
                  'r.jsxs("div",{className:"text-xs font-black text-emerald-400 font-mono",children:["Balance: ₹",(Number(u.balance)||0).toFixed(2)]}),' +
                  'r.jsxs("div",{className:"text-[9px] text-gray-400 font-mono",children:["Spent: ₹",(Number(u.totalSpent)||0).toFixed(2)]})' +
                ']}),' +
                'r.jsxs("div",{className:"flex items-center gap-1.5",children:[' +
                  'r.jsxs("button",{type:"button",onClick:()=>{setTgCreditUser(u);setTgCreditAmt("100");setTgCreditMsg(null);},className:"px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer",children:[' +
                    'r.jsx(Ox,{className:"w-3 h-3 text-emerald-400"}),' +
                    'r.jsx("span",{children:"+ Balance"})' +
                  ']}),' +
                  'u.username&&r.jsx("a",{href:`https://t.me/${u.username}`,target:"_blank",rel:"noopener noreferrer",className:"px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold cursor-pointer",children:"Chat ↗"})' +
                ']})' +
              ']})' +
            ']});' +
          '});' +
        '})()' +
      '}),' +
    ']}),' +

    // Section 5: Tips & Admin Commands Guide
    'r.jsxs("div",{className:"bg-white/[0.03] border border-white/5 rounded-xl p-3.5 text-xs text-gray-300 space-y-2",children:[' +
      'r.jsxs("div",{className:"font-bold text-white flex items-center gap-1.5",children:[' +
        'r.jsx(zF,{className:"w-4 h-4 text-cyan-400"}),' +
        'r.jsx("span",{children:"💡 Telegram Bot Admin Commands & Instant Features:"})' +
      ']}),' +
      'r.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px]",children:[' +
        'r.jsxs("div",{className:"bg-black/40 rounded-lg p-2 border border-white/5",children:[r.jsx("div",{className:"font-bold text-cyan-300",children:"/admin"}),r.jsx("div",{className:"text-gray-400 text-[10px]",children:"Open in-bot control panel"})]}),' +
        'r.jsxs("div",{className:"bg-black/40 rounded-lg p-2 border border-white/5",children:[r.jsxs("div",{className:"font-bold text-cyan-300",children:["/users"]}),r.jsx("div",{className:"text-gray-400 text-[10px]",children:"View all bot users & IDs"})]}),' +
        'r.jsxs("div",{className:"bg-black/40 rounded-lg p-2 border border-white/5",children:[r.jsxs("div",{className:"font-bold text-cyan-300",children:["/setapk ",r.jsx("span",{className:"text-gray-400 text-[9px]",children:"<url>"})]}),r.jsx("div",{className:"text-gray-400 text-[10px]",children:"Change APK link directly via Telegram"})]}),' +
        'r.jsxs("div",{className:"bg-black/40 rounded-lg p-2 border border-white/5",children:[r.jsxs("div",{className:"font-bold text-cyan-300",children:["/broadcast ",r.jsx("span",{className:"text-gray-400 text-[9px]",children:"<msg>"})]}),r.jsx("div",{className:"text-gray-400 text-[10px]",children:"Broadcast message to all bot users"})]}),' +
        'r.jsxs("div",{className:"bg-black/40 rounded-lg p-2 border border-white/5",children:[r.jsx("div",{className:"font-bold text-cyan-300",children:"Instant Alerts"}),r.jsx("div",{className:"text-gray-400 text-[10px]",children:"UPI deposits & key purchase alerts active"})]})' +
      ']})' +
    ']})' +

  ']})})';

  // Replace old telegram panel or append
  const oldTelegramMarker = 't==="telegram"&&r.jsx("div",{className:"space-y-4",children:r.jsxs("div",{className:"bg-[#12121e] border border-cyan-500/30';
  if (code.includes(oldTelegramMarker)) {
    const startIdx = code.indexOf(',t==="telegram"&&');
    const endIdx = code.indexOf(',nne=', startIdx);
    if (startIdx !== -1 && endIdx !== -1) {
      code = code.substring(0, startIdx) + fullTelegramPanel + "]})}" + code.substring(endIdx);
      changed = true;
      console.log('[Telegram Bot Patch] Replaced existing t==="telegram" panel with complete suite');
    }
  } else {
    const secCloseTarget = 'children:Bn?r.jsx(rf,{className:"w-4 h-4"}):r.jsx(Wc,{className:"w-4 h-4"})})]})]})]})]})})';
    if (code.includes(secCloseTarget)) {
      code = code.replace(secCloseTarget, secCloseTarget + fullTelegramPanel);
      changed = true;
      console.log('[Telegram Bot Patch] Appended full Telegram Bot panel after security tab');
    }
  }

  if (changed) {
    fs.writeFileSync(targetPath, code, 'utf8');
    console.log('[Telegram Bot Patch] Successfully saved patched file:', targetPath);
    return true;
  } else {
    console.log('[Telegram Bot Patch] No modifications needed or patterns not found in:', targetPath);
    return false;
  }
}

// Run patch on all target bundle files
const filesToPatch = [
  path.join(__dirname, '../public/assets/index-BvHT743v.js'),
  path.join(__dirname, '../dist/assets/index-BvHT743v.js')
];

for (const f of filesToPatch) {
  patchFile(f);
}
