# Follow-up evidence

Local preview of the production build (`vite preview` on 127.0.0.1:4173). `npm ci` once. The tested build is the successful `npm run build`. An earlier build stopped in prerender because a Node import had no `.ts` extension; that import was removed and the build was run again.

## Screenshots

Desktop 1280×800 and mobile 390×844 for `/`, `/start`, `/signup`, `/sign-up`, `/login`, `/signin`, `/sign-in`, `/privacy`, `/terms`, `/cookies`, the six guide pages, and `/this-does-not-exist`.

## Checks

| Check | Result |
| --- | --- |
| Unknown route | HTTP 404. After JS, the heading is "Page not found", `robots` is `noindex`, there is no canonical, and there are no `[data-ad-slot]` elements. A link back to `/` is present. |
| Known routes | HTTP 200, including `/signup`, `/sign-up`, `/login`, `/signin`, `/sign-in`, and `/auth/callback`. |
| Overflow at 390 | `scrollWidth` is 390 on every route above. |
| Static files | `/og-image.png` is `image/png`, `/favicon.ico` is `image/x-icon`, `/vite.svg` is `image/svg+xml`. None are HTML. |
| Consent | Banner visible on `/` before a choice. No ad-host request before Accept. Three `bicea.org` requests after Accept. |
| Shopping-list claim | Gone from the homepage meta description, Open Graph description, Twitter description, JSON-LD, and `<noscript>` text. |
| Bolt badge | `https://bolt.new/badge.js` is not in the repo source or the built homepage. |

## Lighthouse (mobile, `/`)

| Category | Score |
| --- | --- |
| Performance | 97 |
| Accessibility | 100 |
| Best practices | 96 |
| SEO | 100 |

`color-contrast` passed. The logged-out preview has no suggestion cards, so this run did not render the "♥ Save" control. That control's text is now `text-rose-900` on `bg-rose-50`.

## 404 on Netlify

`public/_redirects` ends with an unforced `/* /404.html 404`. Real files still win, so prerendered pages stay 200. Explicit 200 rules before that line keep the signup, login, auth, account, and payment shells, including a subpath such as `/auth/callback`. `vite preview` uses the same split.
