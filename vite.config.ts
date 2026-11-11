import { existsSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin, type PreviewServer } from 'vite';
import react from '@vitejs/plugin-react';

function requestPath(req: IncomingMessage): string {
  return decodeURIComponent((req.url ?? '').split('?')[0]);
}

/** Serve prerendered /privacy (and other pretty routes) in `vite preview`. */
function prettyHtmlPlugin(): Plugin {
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
    name: 'pretty-html',
    configurePreviewServer(server: PreviewServer) {
      const outDir = resolvePath(server.config.root, server.config.build.outDir);
      server.middlewares.use(prettyHtml(outDir));
    },
  };
}

export default defineConfig({
  plugins: [react(), prettyHtmlPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
