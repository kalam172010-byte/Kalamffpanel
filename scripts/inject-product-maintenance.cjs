const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

async function buildAndInjectProductMaintenance() {
  console.log('[Product Maintenance] Building ProductMaintenanceDashboard bundle...');
  
  const outDirPublic = path.join(__dirname, '../public/assets');
  const outDirDist = path.join(__dirname, '../dist/assets');
  if (!fs.existsSync(outDirPublic)) fs.mkdirSync(outDirPublic, { recursive: true });
  if (!fs.existsSync(outDirDist)) fs.mkdirSync(outDirDist, { recursive: true });

  const bundleDestPublic = path.join(outDirPublic, 'product-maintenance-bundle.js');
  const bundleDestDist = path.join(outDirDist, 'product-maintenance-bundle.js');

  // 1. Build the bundle using esbuild
  await esbuild.build({
    entryPoints: [path.join(__dirname, '../src/components/ProductMaintenanceDashboard.tsx')],
    bundle: true,
    format: 'iife',
    globalName: 'ProductMaintenanceModule',
    outfile: bundleDestPublic,
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
    banner: {
      js: 'var React = window.React || (typeof q !== "undefined" ? q : undefined); var ReactDOM = window.ReactDOM || React;'
    },
    footer: {
      js: 'if (typeof window !== "undefined") { window.ProductMaintenanceDashboard = ProductMaintenanceModule.ProductMaintenanceDashboard || ProductMaintenanceModule.default; }'
    },
    external: ['react', 'react-dom'],
    minify: true
  });

  // Copy to dist if dist exists
  if (fs.existsSync(path.dirname(bundleDestDist))) {
    fs.copyFileSync(bundleDestPublic, bundleDestDist);
  }
  console.log('[Product Maintenance] Bundle generated successfully at:', bundleDestPublic);

  // 2. Ensure index.html loads the bundle
  const indexHtmlPaths = [
    path.join(__dirname, '../index.html'),
    path.join(__dirname, '../dist/index.html')
  ];

  for (const htmlPath of indexHtmlPaths) {
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf8');
      if (!html.includes('/assets/product-maintenance-bundle.js')) {
        html = html.replace(
          '<script type="module" crossorigin src="/assets/index-BvHT743v.js',
          '<script src="/assets/product-maintenance-bundle.js"></script>\n    <script type="module" crossorigin src="/assets/index-BvHT743v.js'
        );
        fs.writeFileSync(htmlPath, html, 'utf8');
        console.log('[Product Maintenance] Injected script tag into:', htmlPath);
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
    const tabButtonCode = `r.jsxs("button",{onClick:()=>s("product_maintenance"),className:\`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap \${t==="product_maintenance"?"bg-gradient-to-r from-yellow-500/25 to-amber-500/25 text-yellow-300 border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.25)]":"text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"}\`,children:[r.jsx(MaintIconLive,{className:"w-3.5 h-3.5"}),r.jsx("span",{children:"🛠️ Maintenance Control"})]}),`;

    // Ensure MaintIconLive is available
    if (!code.includes('const MaintIconLive =')) {
      code = 'const MaintIconLive = (props) => r.jsx("svg", { ...props, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24", children: [r.jsx("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" })] });\n' + code;
    }

    // Ensure ProductMaintenanceLive wrapper is available
    if (!code.includes('ProductMaintenanceLive')) {
      const wrapperCode = `const ProductMaintenanceLive = (props) => {
  if (typeof window !== "undefined" && window.ProductMaintenanceDashboard) {
    return q.createElement(window.ProductMaintenanceDashboard, props);
  }
  return r.jsxs("div", { className: "bg-[#140F28] border border-yellow-500/30 p-6 rounded-2xl text-center space-y-3", children: [
    r.jsx("div", { className: "w-10 h-10 mx-auto rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-300 animate-spin", children: "🛠️" }),
    r.jsx("h3", { className: "text-white font-bold", children: "Loading Product Maintenance Manager..." }),
    r.jsx("p", { className: "text-gray-400 text-xs", children: "Connecting live panel status controls." })
  ]});
};\n`;
      code = wrapperCode + code;
    }

    // Insert Tab Button if not present
    if (!code.includes('s("product_maintenance")')) {
      const searchButton = 'r.jsxs("button",{onClick:()=>s("product")';
      if (code.includes(searchButton)) {
        code = code.replace(searchButton, searchButton + tabButtonCode);
        console.log('[Product Maintenance] Inserted Tab Button in:', bundlePath);
      }
    }

    // Insert Tab View Content if not present
    if (!code.includes('t==="product_maintenance"')) {
      const searchTabContent = 't==="product"';
      if (code.includes(searchTabContent)) {
        code = code.replace(
          searchTabContent,
          't==="product_maintenance"&&r.jsx(ProductMaintenanceLive,{}),' + searchTabContent
        );
        console.log('[Product Maintenance] Inserted Tab Content in:', bundlePath);
      }
    }

    fs.writeFileSync(bundlePath, code, 'utf8');
  }

  console.log('[Product Maintenance] All injection steps completed successfully!');
}

buildAndInjectProductMaintenance().catch(err => {
  console.error('[Product Maintenance] Error:', err);
  process.exit(1);
});
