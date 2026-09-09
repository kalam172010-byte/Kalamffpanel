const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const publicBundle = path.join(__dirname, '..', 'public', 'assets', 'index-BvHT743v.js');
const distBundle = path.join(__dirname, '..', 'dist', 'assets', 'index-BvHT743v.js');
const rootHtml = path.join(__dirname, '..', 'index.html');
const distHtml = path.join(__dirname, '..', 'dist', 'index.html');

const eqCss = `
    /* Fullscreen Equalizer Wave Page Loader (matching user video) */
    .kalam-page-loader {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: #0a0a0f !important;
      z-index: 2147483647 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      pointer-events: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      transition: opacity 0.16s ease-out, visibility 0.16s ease-out !important;
      user-select: none !important;
    }
    .kalam-page-loader.active {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: all !important;
    }
    .kalam-loader-topbar {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      height: 2px !important;
      background: linear-gradient(90deg, transparent, #ff0080, #00e5ff, transparent) !important;
      box-shadow: 0 0 14px rgba(255, 0, 128, 0.85) !important;
    }
    .kalam-equalizer-container {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      height: 52px !important;
    }
    @keyframes kalam-eq-pulse {
      0%, 100% {
        transform: scaleY(0.25);
        opacity: 0.4;
      }
      50% {
        transform: scaleY(1.35);
        opacity: 1;
        box-shadow: 0 0 22px rgba(255, 0, 128, 1);
      }
    }
    .kalam-eq-bar {
      display: inline-block !important;
      width: 5.5px !important;
      height: 32px !important;
      border-radius: 9999px !important;
      background: linear-gradient(180deg, #ff0080, #e11d48, #ff4081) !important;
      box-shadow: 0 0 16px rgba(255, 0, 128, 0.85) !important;
      transform-origin: center center !important;
      animation: kalam-eq-pulse 0.72s ease-in-out infinite !important;
    }
    .kalam-eq-bar:nth-child(1) { animation-delay: 0s !important; }
    .kalam-eq-bar:nth-child(2) { animation-delay: 0.13s !important; }
    .kalam-eq-bar:nth-child(3) { animation-delay: 0.26s !important; }
    .kalam-eq-bar:nth-child(4) { animation-delay: 0.39s !important; }
    .kalam-eq-bar:nth-child(5) { animation-delay: 0.52s !important; }
`;

const loaderDom = `
    <!-- Dedicated Equalizer Wave Page Loader Overlay -->
    <div id="kalam-page-loader" class="kalam-page-loader active" aria-hidden="true">
      <div class="kalam-loader-topbar"></div>
      <div class="kalam-equalizer-container">
        <div class="kalam-eq-bar"></div>
        <div class="kalam-eq-bar"></div>
        <div class="kalam-eq-bar"></div>
        <div class="kalam-eq-bar"></div>
        <div class="kalam-eq-bar"></div>
      </div>
    </div>
`;

const loaderScript = `
    <script>
      (function() {
        var loader = document.getElementById('kalam-page-loader');
        var timer = null;

        window.showPageLoader = function(ms) {
          if (!loader) loader = document.getElementById('kalam-page-loader');
          if (!loader) return;
          if (timer) clearTimeout(timer);
          loader.classList.add('active');
          var duration = typeof ms === 'number' ? ms : 450;
          timer = setTimeout(function() {
            if (loader) loader.classList.remove('active');
          }, duration);
        };

        window.hidePageLoader = function() {
          if (!loader) loader = document.getElementById('kalam-page-loader');
          if (!loader) return;
          if (timer) clearTimeout(timer);
          loader.classList.remove('active');
        };

        // Auto-hide initial page load once bundle loads
        setTimeout(function() {
          if (loader) loader.classList.remove('active');
        }, 550);

        // Global listeners for popstate & hashchange
        window.addEventListener('popstate', function() {
          window.showPageLoader(450);
        });
        window.addEventListener('hashchange', function() {
          window.showPageLoader(450);
        });

        // Intercept navigation clicks across the whole platform
        document.addEventListener('click', function(e) {
          var target = e.target;
          var btn = target ? target.closest('button, a, [role="button"]') : null;
          if (!btn) return;
          var text = (btn.textContent || '').trim().toLowerCase();
          var href = btn.getAttribute('href') || '';
          if (
            text.includes('dashboard') ||
            text.includes('deposit') ||
            text.includes('buy keys') ||
            text.includes('my keys') ||
            text.includes('payment history') ||
            text.includes('history') ||
            text.includes('refer') ||
            text.includes('profile') ||
            text.includes('tickets') ||
            text.includes('admin') ||
            text.includes('users') ||
            text.includes('products') ||
            text.includes('stock') ||
            text.includes('gateways') ||
            text.includes('settings') ||
            (href && (href.startsWith('/') || href.startsWith('#')))
          ) {
            window.showPageLoader(450);
          }
        }, true);
      })();
    </script>
`;

function patchHtmlFile(htmlPath) {
  if (!fs.existsSync(htmlPath)) return;
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Inject CSS
  if (!html.includes('kalam-page-loader')) {
    html = html.replace('</style>', `${eqCss}\n    </style>`);
  }

  // Inject DOM
  if (!html.includes('id="kalam-page-loader"')) {
    html = html.replace('<div id="root"></div>', `${loaderDom}\n    <div id="root"></div>`);
  }

  // Inject script
  if (!html.includes('window.showPageLoader')) {
    html = html.replace('</body>', `${loaderScript}\n  </body>`);
  }

  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`[apply-equalizer-loader] Updated HTML at ${htmlPath}`);
}

patchHtmlFile(rootHtml);
patchHtmlFile(distHtml);

// Patch bundle files
function patchBundle(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  let code = fs.readFileSync(targetPath, 'utf8');

  // Exact replacement for It
  const oldIt = `It=me=>{if(me!=="dashboard"&&me!=="buy_keys"&&!w){Vt(()=>It(me),me.replace("_"," ").toUpperCase());return}Zc(),h(!0),i(me),window.scrollTo({top:0,behavior:"smooth"}),setTimeout(()=>{h(!1)},420)}`;
  const newIt = `It=me=>{try{window.showPageLoader&&window.showPageLoader(450)}catch(e){}if(me!=="dashboard"&&me!=="buy_keys"&&me!=="deposit"&&!w){Vt(()=>It(me),me.replace("_"," ").toUpperCase());return}Zc(),h(!0),i(me),window.scrollTo({top:0,behavior:"smooth"}),setTimeout(()=>{h(!1)},450)}`;

  if (code.includes(oldIt)) {
    code = code.replace(oldIt, newIt);
    console.log(`[apply-equalizer-loader] Replaced It in ${targetPath}`);
  }

  // Exact replacement for Lt
  const oldLt = `Lt=me=>{h(!0),u(me),window.scrollTo({top:0,behavior:"smooth"}),setTimeout(()=>{h(!1)},420)}`;
  const newLt = `Lt=me=>{try{window.showPageLoader&&window.showPageLoader(450)}catch(e){}h(!0),u(me),window.scrollTo({top:0,behavior:"smooth"}),setTimeout(()=>{h(!1)},450)}`;

  if (code.includes(oldLt)) {
    code = code.replace(oldLt, newLt);
    console.log(`[apply-equalizer-loader] Replaced Lt in ${targetPath}`);
  }

  // Update onSwitchToAdmin and onSwitchToUser to call showPageLoader
  code = code.replaceAll(
    'onSwitchToAdmin:()=>{h(!0),e("admin"),u("dashboard");try{localStorage.setItem("kalam_app_mode","admin")}catch{}setTimeout(()=>h(!1),420)}',
    'onSwitchToAdmin:()=>{try{window.showPageLoader&&window.showPageLoader(480)}catch(e){}h(!0),e("admin"),u("dashboard");try{localStorage.setItem("kalam_app_mode","admin")}catch{}setTimeout(()=>h(!1),480)}'
  );
  code = code.replaceAll(
    'onSwitchToUser:()=>{h(!0),e("user"),i("dashboard");try{localStorage.setItem("kalam_app_mode","user")}catch{}setTimeout(()=>h(!1),420)}',
    'onSwitchToUser:()=>{try{window.showPageLoader&&window.showPageLoader(480)}catch(e){}h(!0),e("user"),i("dashboard");try{localStorage.setItem("kalam_app_mode","user")}catch{}setTimeout(()=>h(!1),480)}'
  );

  // Validate with esbuild
  try {
    esbuild.transformSync(code, { loader: 'js' });
    fs.writeFileSync(targetPath, code, 'utf8');
    console.log(`[apply-equalizer-loader] Successfully saved valid bundle at ${targetPath}`);
  } catch (err) {
    console.error(`[apply-equalizer-loader] esbuild error for ${targetPath}:`, err);
    process.exit(1);
  }
}

patchBundle(publicBundle);
patchBundle(distBundle);

console.log('[apply-equalizer-loader] Fully configured equalizer loading animation on all pages!');
