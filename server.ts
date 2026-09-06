import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { app } from './src/server/app';

const PORT = 3000;

async function startServer() {
  // Explicitly serve assets to guarantee instant static delivery in both dev & prod with fresh updates
  const assetsPath = path.join(process.cwd(), 'dist', 'assets');
  app.use('/assets', express.static(assetsPath, {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Digital Key Reselling Platform live at http://localhost:${PORT}`);
  });
}

startServer();
