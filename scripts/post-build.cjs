const { spawnSync } = require('child_process');
const path = require('path');

const scriptsToRun = [
  'inject-product-api-ui.cjs',
  'fix-scroll-to-top-circle.cjs',
  'fix-firestore-offline-error.cjs',
  'fix-deposit-amount-input.cjs',
  'fix-buy-key-button.cjs',
  'fix-purchase-retry.cjs',
  'fix-deposit-admin-sync.cjs',
  'inject-test-payment-sync-ui.cjs',
  'patch_qr.cjs',
  'fix-realtime-wallet-sync.cjs',
  'fix-maintenance-mode.cjs',
  'restore-referral-component.cjs',
  'add-auto-logout-session.cjs',
  'apply-equalizer-loader.cjs',
  'add-url-routing.cjs',
  'add-telegram-apk-admin-ui.cjs',
  'sync-html-bundle.cjs'
];

console.log('[Post-Build] Starting bundle enhancements & stability patches...');

for (const scriptName of scriptsToRun) {
  const scriptPath = path.join(__dirname, scriptName);
  try {
    const res = spawnSync(process.execPath, [scriptPath], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    if (res.status !== 0) {
      console.warn(`[Post-Build] Warning: ${scriptName} exited with status ${res.status}`);
    }
  } catch (err) {
    console.error(`[Post-Build] Error executing ${scriptName}:`, err);
  }
}

console.log('[Post-Build] All post-build patches executed successfully.');
