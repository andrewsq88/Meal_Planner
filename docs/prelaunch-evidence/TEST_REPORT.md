# Prelaunch evidence

Local preview of `npm run build` output (`vite preview` on 127.0.0.1:4173). One production build. Flags were unset, so Google sign-in and AI suggestions were off and ads stayed on.

## Screenshots

Desktop 1280×800 and mobile 390×844 for `/`, `/start`, `/signup`, `/login`, `/privacy`, and `/terms`, plus the sign-in modal opened from the header (`signin-modal-desktop.png`, `signin-modal-mobile.png`).

## Checks

| Check | Result |
| --- | --- |
| Horizontal overflow at 360, 390, and 430 | `scrollWidth` equals the viewport. Sign In and Dinner stay inside the viewport. At 390, Sign In is at x=342, width 36. |
| Sign In accessible name | `aria-label="Sign In"` while the text label is hidden below `sm`. |
| `/og-image.png` | 200, `image/png`, 1200×630 PNG (not HTML). |
| `/favicon.ico` | 200, `image/x-icon`, ICO magic `00 00 01 00` (not HTML). |
| `/vite.svg` | 200, `image/svg+xml` (not HTML). |
| Consent banner | Visible on `/` before a choice. |
| Adsterra before Accept | No request to `bicea.org` or the other ad hosts. |
| Adsterra after Accept | Three `bicea.org` requests (native, 300×250, 320×50). |
| Google button | Absent on `/`, `/login`, `/signin`, `/sign-in`, and `/signup`. |
| Sign-in routes | `/login`, `/signin`, and `/sign-in` open the sign-in modal. Forgot password? is visible. No ad slot and no consent banner on `/login` or `/signup`. |
| AI suggestions with the flag off | Opening Add meal and typing "Tomato soup" made zero `suggest-meal-details` calls and showed no "Suggesting…" state. |
| `/start` copy | Says "Open a meal to see the ingredients listed for it." The single-shopping-list sentence is gone. |
| `/start` indexing | No `noindex` in the prerendered HTML. Already present in `sitemap.xml`. |

## Lighthouse (mobile, `/`)

| Category | Score |
| --- | --- |
| Performance | 97 |
| Accessibility | 100 |
| Best practices | 96 |
| SEO | 100 |

`color-contrast`, `heading-order`, and `button-name` passed.

## SEO verification

Canonicals are on `https://www.weeklymealplan.space` (`/` and `/start` checked). Sitemap locs are all on that host and match the public routes: home, `/start`, six guides, `/privacy`, `/terms`, `/cookies`. No auth or payment URLs. Homepage JSON-LD is Organization, WebSite, and WebApplication. `/start` JSON-LD is Organization, WebSite, and WebPage. The organization name is "Weekly Meal Planner".

Previously `/start` was in the sitemap and also `noindex` (an inline script, a client meta tag, and `X-Robots-Tag`). Those noindex signals are removed. The sitemap entry was already there and was left in place.

Left unchanged, and still broader than the product: the homepage meta description, Open Graph and Twitter text, the WebSite and WebApplication JSON-LD descriptions, the noscript fallback, and `llms.txt` still say "build a shopping list." The planner only shows the ingredients on the meal you open. `/start` no longer makes that claim.

## Not verified here

The updated `suggest-meal-details` function (model `MiniMax-M3`, JSON errors, `MINIMAX_API_KEY` from the environment) is in the repo only. It was not deployed. With the client flag off, the browser does not call it.

The forgot-password form calls `resetPasswordForEmail` and the auth listener handles `PASSWORD_RECOVERY`. A live reset email was not sent. The site origin has to be on the Supabase redirect allow list for the link to return; that setting was not changed.
