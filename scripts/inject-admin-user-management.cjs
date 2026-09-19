const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

async function buildAndInjectAdminUserManagement() {
  console.log('[Admin User Management] Building Admin User Management UI bundle...');
  
  const outDirPublic = path.join(__dirname, '../public/assets');
  const outDirDist = path.join(__dirname, '../dist/assets');
  if (!fs.existsSync(outDirPublic)) fs.mkdirSync(outDirPublic, { recursive: true });
  if (!fs.existsSync(outDirDist)) fs.mkdirSync(outDirDist, { recursive: true });

  const bundleDestPublic = path.join(outDirPublic, 'admin-user-management-bundle.js');
  const bundleDestDist = path.join(outDirDist, 'admin-user-management-bundle.js');

  // Build the bundle using esbuild
  await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/components/AdminUserManagement.tsx')],
    bundle: true,
    format: 'iife',
    globalName: 'AdminUserManagementModule',
    outfile: bundleDestPublic,
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
    banner: {
      js: 'var React = window.React || (typeof q !== "undefined" ? q : undefined); var ReactDOM = window.ReactDOM || React;'
    },
    footer: {
      js: 'if (typeof window !== "undefined") { window.AdminUserManagement = AdminUserManagementModule.AdminUserManagement || AdminUserManagementModule.default; }'
    },
    external: ['react', 'react-dom'],
    minify: true
  });

  // Copy to dist if dist exists
  if (fs.existsSync(path.dirname(bundleDestDist))) {
    fs.copyFileSync(bundleDestPublic, bundleDestDist);
  }
  console.log('[Admin User Management] Bundle generated successfully at:', bundleDestPublic);

  // 2. Ensure index.html loads the bundle
  const indexHtmlPaths = [
    path.join(__dirname, '../index.html'),
    path.join(__dirname, '../dist/index.html')
  ];

  for (const htmlPath of indexHtmlPaths) {
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf8');
      if (!html.includes('/assets/admin-user-management-bundle.js')) {
        html = html.replace(
          '<script type="module" crossorigin src="/assets/index-BvHT743v.js',
          '<script src="/assets/admin-user-management-bundle.js"></script>\n    <script type="module" crossorigin src="/assets/index-BvHT743v.js'
        );
        fs.writeFileSync(htmlPath, html, 'utf8');
        console.log('[Admin User Management] Injected script tag into:', htmlPath);
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
    const tabButtonCode = `r.jsxs("button",{onClick:()=>s("bot_users_management"),className:\`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap \${t==="bot_users_management"?"bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]":"text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"}\`,children:[r.jsx(UsersIconLive,{className:"w-3.5 h-3.5"}),r.jsx("span",{children:"👥 Bot Users & Resellers"})]}),`;

    // Ensure UsersIconLive is available
    if (!code.includes('UsersIconLive')) {
      code = 'const UsersIconLive = (props) => r.jsx("svg", { ...props, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24", children: [r.jsx("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }), r.jsx("circle", { cx: "9", cy: "7", r: "4" }), r.jsx("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }), r.jsx("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })] });\n' + code;
    }

    // Ensure AdminUserManagementLive wrapper is available
    if (!code.includes('AdminUserManagementLive')) {
      const wrapperCode = `const AdminUserManagementLive = (props) => {
  if (typeof window !== "undefined" && window.AdminUserManagement) {
    return q.createElement(window.AdminUserManagement, props);
  }
  return r.jsxs("div", { className: "bg-[#12121e] border border-cyan-500/30 p-6 rounded-2xl text-center space-y-3", children: [
    r.jsx("div", { className: "w-10 h-10 mx-auto rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 animate-pulse", children: "👥" }),
    r.jsx("h3", { className: "text-white font-bold", children: "Loading Bot Users & Reseller Management..." }),
    r.jsx("p", { className: "text-gray-400 text-xs", children: "Fetching user directory and wallet balances." })
  ]});
};\n`;
      code = wrapperCode + code;
    }

    // Insert Tab Button if not present
    if (!code.includes('s("bot_users_management")')) {
      const searchButton = 'r.jsxs("button",{onClick:()=>s("notification_settings")';
      if (code.includes(searchButton)) {
        code = code.replace(searchButton, tabButtonCode + searchButton);
        console.log('[Admin User Management] Inserted Tab Button in:', bundlePath);
      }
    }

    // Insert Tab View Content if not present
    if (!code.includes('t==="bot_users_management"')) {
      const searchTabContent = 't==="notification_settings"';
      if (code.includes(searchTabContent)) {
        code = code.replace(
          searchTabContent,
          't==="bot_users_management"&&r.jsx(AdminUserManagementLive,{}),' + searchTabContent
        );
        console.log('[Admin User Management] Inserted Tab Content in:', bundlePath);
      }
    }

    fs.writeFileSync(bundlePath, code, 'utf8');
  }

  console.log('[Admin User Management] All injection steps completed successfully!');
}

buildAndInjectAdminUserManagement().catch(err => {
  console.error('[Admin User Management] Error:', err);
  process.exit(1);
});
