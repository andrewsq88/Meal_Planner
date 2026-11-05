import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import { setSsrLocation } from './lib/adsterra';
import { CANONICAL_ORIGIN } from './lib/routes';

/** Render one public logged-out route to an HTML string. */
export function render(url: string): string {
  const pathname = new URL(url, `${CANONICAL_ORIGIN}/`).pathname;
  setSsrLocation(pathname);
  try {
    return renderToString(
      <StrictMode>
        <App initialPath={pathname} />
      </StrictMode>,
    );
  } finally {
    setSsrLocation(null);
  }
}
