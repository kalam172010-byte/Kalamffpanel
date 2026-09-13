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

  // 3. Add useState variables for Telegram Bot in tne
  const targetState = '[be,we]=q.useState(n.howToUseBotLink||"https://t.me/yourchannel/3"),[apkLink,setApkLink]=q.useState(n.apkDownloadUrl||"https://t.me/kalamffpanel"),';
  const newTgStates = '[be,we]=q.useState(n.howToUseBotLink||"https://t.me/yourchannel/3"),[apkLink,setApkLink]=q.useState(n.apkDownloadUrl||"https://t.me/kalamffpanel"),[tgBotToken,setTgBotToken]=q.useState(n.telegramBotToken||"8990109048:AAEin2WyZl3pGdKXrPSQftMn8-Yh1g0Gop8"),[tgChatId,setTgChatId]=q.useState(n.telegramChatId||"7768975239"),[tgBotUsername,setTgBotUsername]=q.useState(n.telegramBotUsername||"@kalam_store_bot"),[tgWelcomeMsg,setTgWelcomeMsg]=q.useState(n.telegramWelcomeMsg||"🔥 Welcome to KALAM STORE Bot! Instant Key Delivery & Automated UPI Wallet."),[showTgToken,setShowTgToken]=q.useState(!1),[tgTesting,setTgTesting]=q.useState(!1),[tgTestStatus,setTgTestStatus]=q.useState(null),[tgSaving,setTgSaving]=q.useState(!1),[tgSaved,setTgSaved]=q.useState(!1),[tgLiveUpdating,setTgLiveUpdating]=q.useState(!1),[tgLiveStatus,setTgLiveStatus]=q.useState(null),[tgDetecting,setTgDetecting]=q.useState(!1),[tgDetectHint,setTgDetectHint]=q.useState(null),';
  if (code.includes(targetState) && !code.includes('[tgBotToken,setTgBotToken]')) {
    code = code.replace(targetState, newTgStates);
    changed = true;
    console.log('[Telegram Bot Patch] Added tgBotToken & state variables in tne');
  }

  // 3b. If tgBotToken already exists, ensure live updating states exist
  const existingSavedState = '[tgSaved,setTgSaved]=q.useState(!1),';
  const extendedStates = '[tgSaved,setTgSaved]=q.useState(!1),[tgLiveUpdating,setTgLiveUpdating]=q.useState(!1),[tgLiveStatus,setTgLiveStatus]=q.useState(null),[tgDetecting,setTgDetecting]=q.useState(!1),[tgDetectHint,setTgDetectHint]=q.useState(null),';
  if (code.includes(existingSavedState) && !code.includes('[tgLiveUpdating,setTgLiveUpdating]')) {
    code = code.replace(existingSavedState, extendedStates);
    changed = true;
    console.log('[Telegram Bot Patch] Added tgLiveUpdating and tgDetecting state hooks');
  }

  // 4. Add initialTab sync & live /api/telegram-config fetch in tne
  const targetEffectAnchor = 'q.useEffect(()=>{n&&(n.shopName!==void 0&&i(n.shopName),';
  const newEffectInit = 'q.useEffect(()=>{if(tInit)s(tInit);},[tInit]);q.useEffect(()=>{fetch("/api/telegram-config").then(Je=>Je.json()).then(Je=>{if(Je&&Je.success){Je.botToken&&setTgBotToken(Je.botToken);Je.chatId&&setTgChatId(Je.chatId);Je.botUsername&&setTgBotUsername(Je.botUsername);Je.apkDownloadUrl&&setApkLink(Je.apkDownloadUrl);Je.howToUseBotLink&&we(Je.howToUseBotLink);Je.paymentProofChannel&&xe(Je.paymentProofChannel);Je.welcomeMessage&&setTgWelcomeMsg(Je.welcomeMessage)}}).catch(()=>{})},[]);q.useEffect(()=>{n&&(n.shopName!==void 0&&i(n.shopName),';
  if (code.includes(targetEffectAnchor) && !code.includes('if(tInit)s(tInit)')) {
    code = code.replace(targetEffectAnchor, newEffectInit);
    changed = true;
    console.log('[Telegram Bot Patch] Added initialTab & config sync useEffect in tne');
  }

  // 5. Add to kr() return in tne
  const targetKr = 'howToUseBotLink:be.trim(),apkDownloadUrl:apkLink.trim(),';
  const newKr = 'howToUseBotLink:be.trim(),apkDownloadUrl:apkLink.trim(),telegramBotToken:tgBotToken.trim(),telegramChatId:tgChatId.trim(),telegramBotUsername:tgBotUsername.trim(),telegramWelcomeMsg:tgWelcomeMsg.trim(),';
  if (code.includes(targetKr) && !code.includes('telegramBotToken:tgBotToken.trim()')) {
    code = code.replace(targetKr, newKr);
    changed = true;
    console.log('[Telegram Bot Patch] Added telegram properties to kr() return in tne');
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
  const newKeywordsStore = '{id:"telegram_bot",label:"🤖 Telegram Bot",keywords:["telegram","bot","token","chatid","apk","update","telegram bot","webhook"]},{id:"store_settings",label:"🎨 Store UI/UX Editor",keywords:';
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

  // 11. Full comprehensive Telegram Bot Editing Panel UI inside tne
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
          'r.jsx("p",{className:"text-xs text-gray-400",children:"Edit your bot token, admin chat alerts, APK download channel, tutorials, and welcome messages in real-time."})' +
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
            'await fetch("/api/telegram-config",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({botToken:tgBotToken,chatId:tgChatId,botUsername:tgBotUsername,apkDownloadUrl:apkLink,howToUseBotLink:be,paymentProofChannel:J,welcomeMessage:tgWelcomeMsg})});' +
            'Fs("Telegram Bot configuration saved and synchronized!");' +
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
                'setTgDetectHint({ok:!0,msg:`✅ Auto-detected Chat ID: ${topChat.chatId} (${topChat.username||topChat.firstName||"User"})`});' +
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
        'r.jsx("p",{className:"text-[10px] text-gray-400",children:"Your numeric Telegram ID. Tip: Send /myid to the bot or click Auto-Detect ID to fill this automatically."})' +
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

    // Section 5: Tips & Admin Commands Guide
    'r.jsxs("div",{className:"bg-white/[0.03] border border-white/5 rounded-xl p-3.5 text-xs text-gray-300 space-y-2",children:[' +
      'r.jsxs("div",{className:"font-bold text-white flex items-center gap-1.5",children:[' +
        'r.jsx(zF,{className:"w-4 h-4 text-cyan-400"}),' +
        'r.jsx("span",{children:"💡 Telegram Bot Admin Commands & Instant Features:"})' +
      ']}),' +
      'r.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px]",children:[' +
        'r.jsxs("div",{className:"bg-black/40 rounded-lg p-2 border border-white/5",children:[r.jsx("div",{className:"font-bold text-cyan-300",children:"/admin"}),r.jsx("div",{className:"text-gray-400 text-[10px]",children:"Open in-bot control panel"})]}),' +
        'r.jsxs("div",{className:"bg-black/40 rounded-lg p-2 border border-white/5",children:[r.jsxs("div",{className:"font-bold text-cyan-300",children:["/setapk ",r.jsx("span",{className:"text-gray-400 text-[9px]",children:"<url>"})]}),r.jsx("div",{className:"text-gray-400 text-[10px]",children:"Change APK link directly via Telegram"})]}),' +
        'r.jsxs("div",{className:"bg-black/40 rounded-lg p-2 border border-white/5",children:[r.jsxs("div",{className:"font-bold text-cyan-300",children:["/broadcast ",r.jsx("span",{className:"text-gray-400 text-[9px]",children:"<msg>"})]}),r.jsx("div",{className:"text-gray-400 text-[10px]",children:"Broadcast message to all bot users"})]}),' +
        'r.jsxs("div",{className:"bg-black/40 rounded-lg p-2 border border-white/5",children:[r.jsx("div",{className:"font-bold text-cyan-300",children:"Instant Alerts"}),r.jsx("div",{className:"text-gray-400 text-[10px]",children:"UPI deposits & key purchase alerts active"})]})' +
      ']})' +
    ']})' +

  ']})})';

  // Replace old telegram panel or append
  const oldTelegramMarker = 't==="telegram"&&r.jsx("div",{className:"space-y-4",children:r.jsxs("div",{className:"bg-[#12121e] border border-cyan-500/30';
  if (code.includes(oldTelegramMarker)) {
    // Find beginning of t==="telegram" and end
    const startIdx = code.indexOf(',t==="telegram"&&');
    // Find where this block ends (before ,nne= or the next component)
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
