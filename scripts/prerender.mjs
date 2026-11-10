import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { CANONICAL_ORIGIN } from '../src/lib/routes.ts';

/**
 * Logged-out pages with real content. sitemap.xml is written from this list,
 * including the noindex /start landing page.
 * Auth and payment paths stay on the SPA shell.
 */
const PUBLIC_ROUTES = [
  {
    path: '/',
    loc: `${CANONICAL_ORIGIN}/`,
    changefreq: 'weekly',
    priority: '1.0',
  },
  {
    path: '/start',
    loc: `${CANONICAL_ORIGIN}/start`,
    changefreq: 'monthly',
    priority: '0.4',
    robots: 'noindex',
  },
];

const SPA_FALLBACK_ROUTES = [
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

const dist = path.resolve('dist');
const rootPlaceholder = '<div id="root"></div>';
const template = readFileSync(path.join(dist, 'index.html'), 'utf8');

if (!template.includes(rootPlaceholder)) {
  throw new Error('dist/index.html is missing <div id="root"></div>');
}

const shell = template.replace(
  '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <meta name="robots" content="noindex" data-route-robots="shell" />',
);

function writeHtml(routePath, html) {
  const file = routePath === '/'
    ? path.join(dist, 'index.html')
    : path.join(dist, routePath.replace(/^\//, ''), 'index.html');
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, html);
  return file;
}

writeFileSync(path.join(dist, 'spa.html'), shell);
writeFileSync(path.join(dist, '404.html'), shell);
for (const routePath of SPA_FALLBACK_ROUTES) {
  writeHtml(routePath, shell);
}

function applyPageUrl(html, loc) {
  const next = html
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${loc}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${loc}" />`)
    .replace(/<meta name="twitter:url" content="[^"]*" \/>/, `<meta name="twitter:url" content="${loc}" />`);
  if (!next.includes(`href="${loc}"`) || !next.includes(`content="${loc}"`)) {
    throw new Error(`Failed to set canonical URL for ${loc}`);
  }
  return next;
}

function applyRobots(html, content) {
  if (html.includes('data-route-robots="start"')) return html;
  return html.replace(
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <meta name="robots" content="${content}" data-route-robots="start" />`,
  );
}

const { render } = await import(pathToFileURL(path.resolve('dist-ssr/entry-server.js')).href);

const rendered = new Map();
for (const route of PUBLIC_ROUTES) {
  const appHtml = render(route.path);
  if (!appHtml || !appHtml.includes('<')) {
    throw new Error(`renderToString returned no markup for ${route.path}`);
  }
  let html = applyPageUrl(template, route.loc);
  if (route.robots) html = applyRobots(html, route.robots);
  html = html.replace(rootPlaceholder, `<div id="root">${appHtml}</div>`);
  writeHtml(route.path, html);
  rendered.set(route.path, html);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PUBLIC_ROUTES.map((route) => `  <url>
    <loc>${route.loc}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);

const home = rendered.get('/');
const start = rendered.get('/start');
const signup = readFileSync(path.join(dist, 'signup/index.html'), 'utf8');
const checkout = readFileSync(path.join(dist, 'checkout/index.html'), 'utf8');
const billing = readFileSync(path.join(dist, 'billing/index.html'), 'utf8');
const robots = readFileSync(path.join(dist, 'robots.txt'), 'utf8');
const llms = readFileSync(path.join(dist, 'llms.txt'), 'utf8');
const builtSitemap = readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');

assert.match(home, /Weekly Menu/);
assert.match(home, /Meal Suggestions/);
assert.match(home, /Save your favorite meals/);
assert.match(home, /Breakfast/);
assert.match(home, /data-ad-slot="mp-native-below"/);
assert.match(home, /<link rel="canonical" href="https:\/\/www\.weeklymealplan\.space\/" \/>/);
assert.match(home, /<meta property="og:url" content="https:\/\/www\.weeklymealplan\.space\/" \/>/);
assert.match(home, /<meta name="twitter:url" content="https:\/\/www\.weeklymealplan\.space\/" \/>/);
assert.equal(home.includes('https://weeklymealplan.space'), false);
assert.match(home, /google-site-verification" content="JsSnLl66a4rb7lyreNJ3dlcWuJrBZn02okHSsYhkGGg"/);
assert.match(home, /http-equiv="Content-Security-Policy"/);
assert.match(home, /"@type": "WebSite"/);
assert.match(home, /"@type": "WebApplication"/);
assert.equal(home.includes('FAQPage'), false);
assert.equal(/<script[^>]*src="https:\/\/bicea\.org/.test(home), false);
assert.equal(home.includes('data-route-robots="shell"'), false);
assert.match(home, /Plan your family's meals for the entire week with ease\./);
assert.match(home, /Explore our other sites/);
assert.equal((home.match(/Explore our other sites/g) || []).length, 1);

const otherSiteHrefs = [
  'https://www.lushlandsmanagement.com/?utm_source=mealplan&utm_medium=crosslink&utm_campaign=footer-2026-11',
  'https://thedailypulse.space/?utm_source=mealplan&utm_medium=crosslink&utm_campaign=footer-2026-11',
];

function otherSiteLinks(html) {
  return [...html.matchAll(/href="(https:\/\/(?:www\.lushlandsmanagement\.com|thedailypulse\.space)\/\?[^"]*)"/g)]
    .map((match) => match[1].replace(/&amp;/g, '&'));
}

assert.deepEqual(otherSiteLinks(home), otherSiteHrefs);
assert.equal(/registerprep/i.test(home), false);

assert.match(start, /Plan your family(?:'|&#x27;)s meals for the week/);
assert.match(start, /Create your free account/);
assert.match(start, /<link rel="canonical" href="https:\/\/www\.weeklymealplan\.space\/start" \/>/);
assert.match(start, /<meta property="og:url" content="https:\/\/www\.weeklymealplan\.space\/start" \/>/);
assert.match(start, /<meta name="robots" content="noindex" data-route-robots="start" \/>/);
assert.equal(start.includes('data-ad-slot'), false);
assert.equal(start.includes('Advertisement'), false);
assert.match(start, /Explore our other sites/);
assert.deepEqual(otherSiteLinks(start), otherSiteHrefs);
assert.equal(/registerprep/i.test(start), false);

for (const html of [signup, checkout, billing]) {
  assert.match(html, /<div id="root"><\/div>/);
  assert.equal(html.includes('data-ad-slot'), false);
  assert.equal(html.includes('Advertisement'), false);
  assert.equal(html.includes('Explore our other sites'), false);
  assert.equal(html.includes('lushlandsmanagement.com'), false);
  assert.equal(html.includes('thedailypulse.space'), false);
  assert.equal(/<script[^>]*src="https:\/\/bicea\.org/.test(html), false);
  assert.match(html, /data-route-robots="shell"/);
  assert.match(html, /google-site-verification/);
  assert.match(html, /Content-Security-Policy/);
}

const indexNowKey = 'aa07e5ec709905f895fcccc55555a4c9';
const indexNowFile = readFileSync(path.join(dist, `${indexNowKey}.txt`));
assert.deepEqual(indexNowFile, Buffer.from(indexNowKey));

const redirectLines = readFileSync(path.join(dist, '_redirects'), 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));
const keyRedirect = redirectLines.find((line) => line.startsWith(`/${indexNowKey}.txt`));
const spaRedirect = redirectLines.find((line) => line.startsWith('/*'));
assert.equal(keyRedirect, `/${indexNowKey}.txt  /${indexNowKey}.txt  200`);
assert.equal(spaRedirect, '/*    /spa.html   200');
assert.ok(redirectLines.indexOf(keyRedirect) < redirectLines.indexOf(spaRedirect));
assert.equal(spaRedirect.endsWith('!'), false);
assert.ok(redirectLines.includes('https://weeklymealplan.space/*  https://www.weeklymealplan.space/:splat  301!'));
assert.ok(redirectLines.includes('http://weeklymealplan.space/*  https://www.weeklymealplan.space/:splat  301!'));
assert.ok(redirectLines.indexOf('https://weeklymealplan.space/*  https://www.weeklymealplan.space/:splat  301!') < redirectLines.indexOf(spaRedirect));

const headerText = readFileSync(path.join(dist, '_headers'), 'utf8');
assert.match(headerText, new RegExp(`/${indexNowKey}\\.txt\\n  Content-Type: text/plain; charset=utf-8`));

const netlifyToml = readFileSync(path.resolve('netlify.toml'), 'utf8');
assert.equal(netlifyToml.includes('[[redirects]]'), false);
assert.equal(netlifyToml.includes(indexNowKey), false);
assert.equal(netlifyToml.includes('index.html'), false);

for (const bot of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
  assert.match(robots, new RegExp(`User-agent: ${bot}\\nAllow: /`));
}
assert.match(robots, /Sitemap: https:\/\/www\.weeklymealplan\.space\/sitemap\.xml/);

for (const route of PUBLIC_ROUTES) {
  assert.ok(builtSitemap.includes(`<loc>${route.loc}</loc>`), route.loc);
}
assert.equal(builtSitemap.includes('/signup'), false);
assert.equal(builtSitemap.includes('/checkout'), false);

assert.match(llms, /Plan your family's weekly meals with ease\. Browse recipe suggestions, save favorites, build a shopping list, and organize breakfast, lunch, and dinner for the whole week\./);
assert.match(llms, /https:\/\/www\.weeklymealplan\.space\//);
assert.equal(llms.includes('https://weeklymealplan.space'), false);

console.log(`Prerendered ${PUBLIC_ROUTES.map((route) => route.path).join(', ')}`);
