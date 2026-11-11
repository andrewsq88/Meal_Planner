import { existsSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';

function requestPath(req: IncomingMessage): string {
  return decodeURIComponent((req.url ?? '').split('?')[0]);
}

/** Accept first-party cookieless beacons in dev and `vite preview`. Do not log the body. */
function cookielessCollectPlugin(): Plugin {
  const handleCollect = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (requestPath(req) !== '/collect' || req.method !== 'POST') {
      next();
      return;
    }
    req.resume();
    res.statusCode = 204;
    res.end();
  };

  const prettyHtml = (outDir: string) => (req: IncomingMessage, _res: ServerResponse, next: () => void) => {
    const urlPath = requestPath(req);
    if (!urlPath || urlPath === '/' || urlPath.includes('.') || (req.method && req.method !== 'GET' && req.method !== 'HEAD')) {
      next();
      return;
    }
    const trimmed = urlPath.replace(/\/$/, '');
    const file = resolvePath(outDir, trimmed.replace(/^\//, ''), 'index.html');
    if (existsSync(file)) {
      const suffix = req.url?.slice(urlPath.length) ?? '';
      req.url = `${trimmed}/index.html${suffix}`;
    }
    next();
  };

  return {
    name: 'cookieless-collect',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(handleCollect);
    },
    configurePreviewServer(server: PreviewServer) {
      const outDir = resolvePath(server.config.root, server.config.build.outDir);
      server.middlewares.use(prettyHtml(outDir));
      server.middlewares.use(handleCollect);
    },
  };
}

export default defineConfig({
  plugins: [react(), cookielessCollectPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
