import { existsSync, readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin, type PreviewServer } from 'vite';
import react from '@vitejs/plugin-react';
import { isKnownPath } from './src/lib/routes';

function requestPath(req: IncomingMessage): string {
  return decodeURIComponent((req.url ?? '').split('?')[0]);
}

const SPA_PREFIXES = [
  '/signup',
  '/sign-up',
  '/login',
  '/signin',
  '/sign-in',
  '/register',
  '/auth',
  '/account',
  '/checkout',
  '/pay',
  '/billing',
  '/stripe',
];

/**
 * Serve prerendered pages as 200. Unknown paths get dist/404.html with
 * status 404, matching the unforced Netlify fallback. Auth and payment
 * shells, including a subpath, stay 200.
 */
function prettyHtmlPlugin(): Plugin {
  const handle = (outDir: string) => (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const urlPath = requestPath(req);
    if (!urlPath || (req.method && req.method !== 'GET' && req.method !== 'HEAD')) {
      next();
      return;
    }

    const suffix = req.url?.slice(urlPath.length) ?? '';
    const trimmed = urlPath.length > 1 ? urlPath.replace(/\/$/, '') : urlPath;

    if (trimmed === '/' || urlPath === '/index.html') {
      next();
      return;
    }

    if (urlPath.includes('.')) {
      const asset = resolvePath(outDir, decodeURIComponent(urlPath.replace(/^\//, '')));
      if (existsSync(asset)) {
        next();
        return;
      }
      sendNotFound(outDir, res);
      return;
    }

    const direct = resolvePath(outDir, trimmed.replace(/^\//, ''), 'index.html');
    if (isKnownPath(trimmed) && existsSync(direct)) {
      req.url = `${trimmed}/index.html${suffix}`;
      next();
      return;
    }

    const prefix = SPA_PREFIXES.find((item) => trimmed === item || trimmed.startsWith(`${item}/`));
    if (prefix) {
      const shell = resolvePath(outDir, prefix.replace(/^\//, ''), 'index.html');
      if (existsSync(shell)) {
        req.url = `${prefix}/index.html${suffix}`;
        next();
        return;
      }
    }

    sendNotFound(outDir, res);
  };

  return {
    name: 'pretty-html',
    configurePreviewServer(server: PreviewServer) {
      const outDir = resolvePath(server.config.root, server.config.build.outDir);
      server.middlewares.use(handle(outDir));
    },
  };
}

function sendNotFound(outDir: string, res: ServerResponse) {
  const file = resolvePath(outDir, '404.html');
  const html = existsSync(file)
    ? readFileSync(file)
    : Buffer.from('<!doctype html><title>Page not found</title><h1>Page not found</h1>');
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
}

export default defineConfig({
  plugins: [react(), prettyHtmlPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
