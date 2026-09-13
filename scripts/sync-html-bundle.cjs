const fs = require('fs');
const path = require('path');

const version = '20260913-clean-v16';

function cleanHtml(filePath) {
  if (!fs.existsSync(filePath)) return;
  let html = fs.readFileSync(filePath, 'utf8');

  // Remove any secondary injected scripts from vite
  html = html.replace(/<script type="module" crossorigin src="\/assets\/index-(?!BvHT743v)[^"]+\.js"><\/script>\s*/g, '');

  // Update bundle version query
  html = html.replace(
    /\/assets\/index-BvHT743v\.js(?:\?v=[a-zA-Z0-9_-]+)?/g,
    `/assets/index-BvHT743v.js?v=${version}`
  );

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`[sync-html-bundle] Stamped ${filePath} with version ${version}`);
}

cleanHtml(path.join(__dirname, '..', 'index.html'));
cleanHtml(path.join(__dirname, '..', 'dist', 'index.html'));
