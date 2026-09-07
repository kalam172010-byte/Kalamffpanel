import fs from 'fs';
import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { app } from './src/server/app';

const PORT = 3000;

async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const publicPath = path.join(process.cwd(), 'public');
  const distAssetsPath = path.join(distPath, 'assets');
  const publicAssetsPath = path.join(publicPath, 'assets');

  const staticOpts = {
    setHeaders: (res: express.Response) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  };

  // Explicitly serve assets from dist/assets or public/assets
  if (fs.existsSync(distAssetsPath)) {
    app.use('/assets', express.static(distAssetsPath, staticOpts));
  }
  if (fs.existsSync(publicAssetsPath)) {
    app.use('/assets', express.static(publicAssetsPath, staticOpts));
  }
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, staticOpts));
    }
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      if (fs.existsSync(path.join(distPath, 'index.html'))) {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        res.sendFile(path.join(process.cwd(), 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Digital Key Reselling Platform live at http://localhost:${PORT}`);
  });
}

startServer();
