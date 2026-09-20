const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

async function buildAndInjectNotificationSettings() {
  console.log('[Notification Settings] Building Telegram Notification UI bundle...');
  
  const outDirPublic = path.join(__dirname, '../public/assets');
  const outDirDist = path.join(__dirname, '../dist/assets');
  if (!fs.existsSync(outDirPublic)) fs.mkdirSync(outDirPublic, { recursive: true });
  if (!fs.existsSync(outDirDist)) fs.mkdirSync(outDirDist, { recursive: true });

  const bundleDestPublic = path.join(outDirPublic, 'notification-settings-bundle.js');
  const bundleDestDist = path.join(outDirDist, 'notification-settings-bundle.js');

  // Build the bundle using esbuild
  await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/components/TelegramNotificationSettings.tsx')],
    bundle: true,
    format: 'iife',
    globalName: 'NotificationSettingsModule',
    outfile: bundleDestPublic,
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
    banner: {
      js: 'var React = window.React || (typeof q !== "undefined" ? q : undefined); var ReactDOM = window.ReactDOM || React;'
    },
    footer: {
      js: 'if (typeof window !== "undefined") { window.TelegramNotificationSettingsCard = NotificationSettingsModule.TelegramNotificationSettingsCard || NotificationSettingsModule.default; }'
    },
    external: ['react', 'react-dom'],
    minify: true
  });

  // Copy to dist if dist exists
  if (fs.existsSync(path.dirname(bundleDestDist))) {
    fs.copyFileSync(bundleDestPublic, bundleDestDist);
  }
  console.log('[Notification Settings] Bundle generated successfully at:', bundleDestPublic);

  // 2. Ensure index.html loads the bundle
  const indexHtmlPaths = [
    path.join(__dirname, '../index.html'),
    path.join(__dirname, '../dist/index.html')
  ];

  for (const htmlPath of indexHtmlPaths) {
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf8');
      if (!html.includes('/assets/notification-settings-bundle.js')) {
        html = html.replace(
          '<script type="module" crossorigin src="/assets/index-BvHT743v.js',
          '<script src="/assets/notification-settings-bundle.js"></script>\n    <script type="module" crossorigin src="/assets/index-BvHT743v.js'
        );
        fs.writeFileSync(htmlPath, html, 'utf8');
        console.log('[Notification Settings] Injected script tag into:', htmlPath);
      }
    }
  }

  // 3. Patch target js bundle to add the Tab button and render the component
  const bundlesToPatch = [
    path.join(__dirname, '../public/assets/index-BvHT743v.js'),
    path.join(__dirname, '../dist/assets/index-BvHT743v.js')
  ];

  for (const bundlePath of bundlesToPatch) {
    if (!fs.existsSync(bundlePath)) continue;
    let code = fs.readFileSync(bundlePath, 'utf8');

    // Add Tab button in tne tab list if not present
    const tabButtonCode = `r.jsxs("button",{onClick:()=>s("notification_settings"),className:\`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap \${t==="notification_settings"?"bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]":"text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"}\`,children:[r.jsx(BellIconLive,{className:"w-3.5 h-3.5"}),r.jsx("span",{children:"🔔 Telegram Notifications"})]}),`;

    // Ensure BellIconLive is available
    if (!code.includes('const BellIconLive =')) {
      code = 'const BellIconLive = (props) => r.jsx("svg", { ...props, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24", children: [r.jsx("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }), r.jsx("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })] });\n' + code;
    }

    // Ensure TelegramNotificationSettingsLive wrapper is available
    if (!code.includes('TelegramNotificationSettingsLive')) {
      const wrapperCode = `const TelegramNotificationSettingsLive = (props) => {
  if (typeof window !== "undefined" && window.TelegramNotificationSettingsCard) {
    return q.createElement(window.TelegramNotificationSettingsCard, props);
  }
  return r.jsxs("div", { className: "bg-[#12121e] border border-amber-500/30 p-6 rounded-2xl text-center space-y-3", children: [
    r.jsx("div", { className: "w-10 h-10 mx-auto rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 animate-pulse", children: "🔔" }),
    r.jsx("h3", { className: "text-white font-bold", children: "Loading Telegram Notification Controls..." }),
    r.jsx("p", { className: "text-gray-400 text-xs", children: "Initializing notification toggles and triggers." })
  ]});
};\n`;
      code = wrapperCode + code;
    }

    // Insert Tab Button if not present
    if (!code.includes('s("notification_settings")')) {
      const searchButton = 'r.jsxs("button",{onClick:()=>s("reels_studio")';
      if (code.includes(searchButton)) {
        code = code.replace(searchButton, tabButtonCode + searchButton);
        console.log('[Notification Settings] Inserted Tab Button in:', bundlePath);
      }
    }

    // Insert Tab View Content if not present
    if (!code.includes('t==="notification_settings"')) {
      const searchTabContent = 't==="reels_studio"';
      if (code.includes(searchTabContent)) {
        code = code.replace(
          searchTabContent,
          't==="notification_settings"&&r.jsx(TelegramNotificationSettingsLive,{}),' + searchTabContent
        );
        console.log('[Notification Settings] Inserted Tab Content in:', bundlePath);
      }
    }

    fs.writeFileSync(bundlePath, code, 'utf8');
  }

  console.log('[Notification Settings] All injection steps completed successfully!');
}

buildAndInjectNotificationSettings().catch(err => {
  console.error('[Notification Settings] Error:', err);
  process.exit(1);
});
