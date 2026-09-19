const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

async function buildAndInjectAuditLog() {
  console.log('[Audit Log] Building Audit Log UI bundle...');
  
  const outDirPublic = path.join(__dirname, '../public/assets');
  const outDirDist = path.join(__dirname, '../dist/assets');
  if (!fs.existsSync(outDirPublic)) fs.mkdirSync(outDirPublic, { recursive: true });
  if (!fs.existsSync(outDirDist)) fs.mkdirSync(outDirDist, { recursive: true });

  const bundleDestPublic = path.join(outDirPublic, 'audit-log-bundle.js');
  const bundleDestDist = path.join(outDirDist, 'audit-log-bundle.js');

  // 1. Build the bundle using esbuild
  await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/components/AuditLogDashboard.tsx')],
    bundle: true,
    format: 'iife',
    globalName: 'AuditLogModule',
    outfile: bundleDestPublic,
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
    banner: {
      js: 'var React = window.React || (typeof q !== "undefined" ? q : undefined); var ReactDOM = window.ReactDOM || React;'
    },
    footer: {
      js: 'if (typeof window !== "undefined") { window.AuditLogDashboard = AuditLogModule.AuditLogDashboard || AuditLogModule.default; }'
    },
    external: ['react', 'react-dom'],
    minify: true
  });

  // Copy to dist if dist exists
  if (fs.existsSync(path.dirname(bundleDestDist))) {
    fs.copyFileSync(bundleDestPublic, bundleDestDist);
  }
  console.log('[Audit Log] Bundle generated successfully at:', bundleDestPublic);

  // 2. Ensure index.html loads the bundle
  const indexHtmlPaths = [
    path.join(__dirname, '../index.html'),
    path.join(__dirname, '../dist/index.html')
  ];

  for (const htmlPath of indexHtmlPaths) {
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf8');
      if (!html.includes('/assets/audit-log-bundle.js')) {
        html = html.replace(
          '<script type="module" crossorigin src="/assets/index-BvHT743v.js',
          '<script src="/assets/audit-log-bundle.js"></script>\n    <script type="module" crossorigin src="/assets/index-BvHT743v.js'
        );
        fs.writeFileSync(htmlPath, html, 'utf8');
        console.log('[Audit Log] Injected script tag into:', htmlPath);
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

    // Add Tab button in the tab list if not present
    const tabButtonCode = `r.jsxs("button",{onClick:()=>s("audit_logs"),className:\`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap \${t==="audit_logs"?"bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]":"text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"}\`,children:[r.jsx(AuditIconLive,{className:"w-3.5 h-3.5"}),r.jsx("span",{children:"🛡️ Audit Trail"})]}),`;

    // Ensure AuditIconLive is available
    if (!code.includes('AuditIconLive')) {
      code = 'const AuditIconLive = (props) => r.jsx("svg", { ...props, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24", children: [r.jsx("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }), r.jsx("line", { x1: "12", y1: "8", x2: "12", y2: "12" }), r.jsx("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })] });\n' + code;
    }

    // Ensure AuditLogLive wrapper is available
    if (!code.includes('AuditLogLive')) {
      const wrapperCode = `const AuditLogLive = (props) => {
  if (typeof window !== "undefined" && window.AuditLogDashboard) {
    return q.createElement(window.AuditLogDashboard, props);
  }
  return r.jsxs("div", { className: "bg-[#12121e] border border-cyan-500/30 p-6 rounded-2xl text-center space-y-3", children: [
    r.jsx("div", { className: "w-10 h-10 mx-auto rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 animate-pulse", children: "🛡️" }),
    r.jsx("h3", { className: "text-white font-bold", children: "Loading Audit & Accountability Log..." }),
    r.jsx("p", { className: "text-gray-400 text-xs", children: "Fetching immutable activity and balance history." })
  ]});
};\n`;
      code = wrapperCode + code;
    }

    // Insert Tab Button if not present
    if (!code.includes('s("audit_logs")')) {
      const searchButton = 'r.jsxs("button",{onClick:()=>s("bot_users_management")';
      if (code.includes(searchButton)) {
        code = code.replace(searchButton, tabButtonCode + searchButton);
        console.log('[Audit Log] Inserted Tab Button in:', bundlePath);
      }
    }

    // Insert Tab View Content if not present
    if (!code.includes('t==="audit_logs"')) {
      const searchTabContent = 't==="bot_users_management"';
      if (code.includes(searchTabContent)) {
        code = code.replace(
          searchTabContent,
          't==="audit_logs"&&r.jsx(AuditLogLive,{}),' + searchTabContent
        );
        console.log('[Audit Log] Inserted Tab Content in:', bundlePath);
      }
    }

    fs.writeFileSync(bundlePath, code, 'utf8');
  }

  console.log('[Audit Log] All injection steps completed successfully!');
}

buildAndInjectAuditLog().catch(err => {
  console.error('[Audit Log] Error:', err);
  process.exit(1);
});
