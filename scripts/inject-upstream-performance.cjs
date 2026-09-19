const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

async function buildAndInjectUpstreamDashboard() {
  console.log('[Upstream Dashboard] Building Recharts-powered performance bundle...');
  
  const outDirPublic = path.join(__dirname, '../public/assets');
  const outDirDist = path.join(__dirname, '../dist/assets');
  if (!fs.existsSync(outDirPublic)) fs.mkdirSync(outDirPublic, { recursive: true });
  if (!fs.existsSync(outDirDist)) fs.mkdirSync(outDirDist, { recursive: true });

  const bundleDestPublic = path.join(outDirPublic, 'upstream-perf-bundle.js');
  const bundleDestDist = path.join(outDirDist, 'upstream-perf-bundle.js');

  // Build the bundle using esbuild
  await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/components/UpstreamPerformanceDashboard.tsx')],
    bundle: true,
    format: 'iife',
    globalName: 'UpstreamPerfModule',
    outfile: bundleDestPublic,
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
    banner: {
      js: 'var React = window.React || (typeof q !== "undefined" ? q : undefined); var ReactDOM = window.ReactDOM || React;'
    },
    footer: {
      js: 'if (typeof window !== "undefined") { window.UpstreamPerformanceDashboard = UpstreamPerfModule.UpstreamPerformanceDashboard || UpstreamPerfModule.default; }'
    },
    external: ['react', 'react-dom'],
    minify: true
  });

  // Copy to dist if dist exists
  if (fs.existsSync(path.dirname(bundleDestDist))) {
    fs.copyFileSync(bundleDestPublic, bundleDestDist);
  }
  console.log('[Upstream Dashboard] Bundle generated successfully at:', bundleDestPublic);

  // 2. Ensure index.html loads the bundle
  const indexHtmlPaths = [
    path.join(__dirname, '../index.html'),
    path.join(__dirname, '../dist/index.html')
  ];

  for (const htmlPath of indexHtmlPaths) {
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf8');
      if (!html.includes('/assets/upstream-perf-bundle.js')) {
        html = html.replace(
          '<script type="module" crossorigin src="/assets/index-BvHT743v.js',
          '<script src="/assets/upstream-perf-bundle.js"></script>\n    <script type="module" crossorigin src="/assets/index-BvHT743v.js'
        );
        fs.writeFileSync(htmlPath, html, 'utf8');
        console.log('[Upstream Dashboard] Injected script tag into:', htmlPath);
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
    const tabButtonCode = `r.jsxs("button",{onClick:()=>s("upstream_perf"),className:\`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap \${t==="upstream_perf"?"bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]":"text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"}\`,children:[r.jsx(ActivityIconLive,{className:"w-3.5 h-3.5"}),r.jsx("span",{children:"📡 Reseller API Performance"})]}),`;

    // Ensure ActivityIconLive is available
    if (!code.includes('ActivityIconLive')) {
      code = 'const ActivityIconLive = (props) => r.jsx("svg", { ...props, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24", children: r.jsx("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }) });\n' + code;
    }

    // Ensure UpstreamPerformanceDashboardLive wrapper is available
    if (!code.includes('UpstreamPerformanceDashboardLive')) {
      const wrapperCode = `const UpstreamPerformanceDashboardLive = (props) => {
  if (typeof window !== "undefined" && window.UpstreamPerformanceDashboard) {
    return q.createElement(window.UpstreamPerformanceDashboard, props);
  }
  return r.jsxs("div", { className: "bg-[#12121e] border border-cyan-500/30 p-6 rounded-2xl text-center space-y-3", children: [
    r.jsx("div", { className: "w-10 h-10 mx-auto rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 animate-pulse", children: "📡" }),
    r.jsx("h3", { className: "text-white font-bold", children: "Loading Upstream API Performance Metrics..." }),
    r.jsx("p", { className: "text-gray-400 text-xs", children: "Initializing real-time telemetry engine." })
  ]});
};\n`;
      code = wrapperCode + code;
    }

    // Insert Tab Button if not present
    if (!code.includes('s("upstream_perf")')) {
      const searchButton = 'r.jsxs("button",{onClick:()=>s("reels_studio")';
      if (code.includes(searchButton)) {
        code = code.replace(searchButton, tabButtonCode + searchButton);
        console.log('[Upstream Dashboard] Inserted Tab Button in:', bundlePath);
      }
    }

    // Insert Tab View Content if not present
    if (!code.includes('t==="upstream_perf"')) {
      const searchTabContent = 't==="reels_studio"';
      if (code.includes(searchTabContent)) {
        code = code.replace(
          searchTabContent,
          't==="upstream_perf"&&r.jsx(UpstreamPerformanceDashboardLive,{}),' + searchTabContent
        );
        console.log('[Upstream Dashboard] Inserted Tab Content in:', bundlePath);
      }
    }

    fs.writeFileSync(bundlePath, code, 'utf8');
  }

  console.log('[Upstream Dashboard] All injection steps completed successfully!');
}

buildAndInjectUpstreamDashboard().catch(err => {
  console.error('[Upstream Dashboard] Error:', err);
  process.exit(1);
});
