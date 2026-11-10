import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { guideGraph } from '../src/content/guide-model.ts';
import { GUIDE_PAGES } from '../src/content/guides.ts';
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  START_DESCRIPTION,
  START_TITLE,
  siteGraph,
  webApplicationNode,
  webPageNode,
} from '../src/content/site-schema.ts';
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
  ...GUIDE_PAGES.map((guide) => ({
    path: guide.path,
    loc: `${CANONICAL_ORIGIN}${guide.path}`,
    changefreq: 'monthly',
    priority: '0.7',
    guide,
  })),
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

const SHELL_META = {
  '/signup': ['Create your free account | Weekly Meal Planner', 'Create your free account to save your meal plan and favorites.'],
  '/sign-up': ['Sign up | Weekly Meal Planner', 'Sign up to save your meal plan and favorites.'],
  '/register': ['Register | Weekly Meal Planner', 'Register to save your meal plan and favorites.'],
  '/login': ['Sign in | Weekly Meal Planner', 'Sign in to save your meal plan and favorites.'],
  '/signin': ['Sign in to Weekly Meal Planner', 'Sign in to save your meals and favorites.'],
  '/sign-in': ['Sign-in | Weekly Meal Planner', 'Sign in to keep your meal plan and favorites.'],
  '/auth': ['Account access | Weekly Meal Planner', 'Sign in to save your meal plan and favorites to your account.'],
  '/account': ['Your account | Weekly Meal Planner', 'Your account saves your meal plan and favorites.'],
  '/checkout': ['Checkout | Weekly Meal Planner', 'Checkout is not a public Weekly Meal Planner page.'],
  '/pay': ['Pay | Weekly Meal Planner', 'Pay is not a public Weekly Meal Planner page.'],
  '/billing': ['Billing | Weekly Meal Planner', 'Billing is not a public Weekly Meal Planner page.'],
  '/stripe': ['Stripe | Weekly Meal Planner', 'Stripe is not a public Weekly Meal Planner page.'],
};

function countTags(html, pattern) {
  return (html.match(new RegExp(pattern, 'g')) || []).length;
}

function replaceOne(html, pattern, replacement, label) {
  if (countTags(html, pattern) !== 1) {
    throw new Error(`${label} appears ${countTags(html, pattern)} times`);
  }
  return html.replace(new RegExp(pattern), replacement);
}

function applyDocumentHead(html, { title, description, canonical, keepKeywords = false }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  let next = html;
  next = replaceOne(next, '<title>[^<]*</title>', `<title>${safeTitle}</title>`, 'title');
  next = replaceOne(next, '<meta name="description" content="[^"]*" />', `<meta name="description" content="${safeDescription}" />`, 'description');
  next = replaceOne(next, '<link rel="canonical" href="[^"]*" />', `<link rel="canonical" href="${canonical}" />`, 'canonical');
  next = replaceOne(next, '<meta property="og:url" content="[^"]*" />', `<meta property="og:url" content="${canonical}" />`, 'og:url');
  next = replaceOne(next, '<meta property="og:title" content="[^"]*" />', `<meta property="og:title" content="${safeTitle}" />`, 'og:title');
  next = replaceOne(next, '<meta property="og:description" content="[^"]*" />', `<meta property="og:description" content="${safeDescription}" />`, 'og:description');
  next = replaceOne(next, '<meta name="twitter:url" content="[^"]*" />', `<meta name="twitter:url" content="${canonical}" />`, 'twitter:url');
  next = replaceOne(next, '<meta name="twitter:title" content="[^"]*" />', `<meta name="twitter:title" content="${safeTitle}" />`, 'twitter:title');
  next = replaceOne(next, '<meta name="twitter:description" content="[^"]*" />', `<meta name="twitter:description" content="${safeDescription}" />`, 'twitter:description');
  if (!keepKeywords) {
    next = next.replace(/\n\s*<meta name="keywords" content="[^"]*" \/>/, '');
  }
  return next;
}

function replaceJsonLd(html, graph) {
  if (countTags(html, '<script type="application/ld\\+json">') !== 1) {
    throw new Error('expected exactly one JSON-LD script');
  }
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">${json}</script>`,
  );
}

function shellDocument(routePath) {
  const [title, description] = SHELL_META[routePath];
  const canonical = `${CANONICAL_ORIGIN}${routePath}`;
  return replaceJsonLd(
    applyDocumentHead(shell, { title, description, canonical }),
    siteGraph(CANONICAL_ORIGIN),
  );
}

writeFileSync(path.join(dist, 'spa.html'), shell);
writeFileSync(path.join(dist, '404.html'), shell);
for (const routePath of SPA_FALLBACK_ROUTES) {
  writeHtml(routePath, shellDocument(routePath));
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function publicHead(route) {
  if (route.guide) {
    let html = applyDocumentHead(template, {
      title: route.guide.title,
      description: route.guide.description,
      canonical: route.loc,
    });
    html = html.replace(
      /<meta property="og:type" content="[^"]*" \/>/,
      '<meta property="og:type" content="article" />',
    );
    html = replaceJsonLd(html, [...siteGraph(CANONICAL_ORIGIN), ...guideGraph(route.guide, CANONICAL_ORIGIN)]);
    return html.replace(
      '<h1>Weekly Meal Planner</h1>',
      '<p style="font-size:2rem;font-weight:800;margin:0 0 1rem;">Weekly Meal Planner</p>',
    );
  }
  if (route.path === '/start') {
    return replaceJsonLd(
      applyDocumentHead(template, {
        title: START_TITLE,
        description: START_DESCRIPTION,
        canonical: route.loc,
      }),
      [...siteGraph(CANONICAL_ORIGIN), webPageNode(CANONICAL_ORIGIN, '/start', START_TITLE, START_DESCRIPTION)],
    );
  }
  return replaceJsonLd(
    applyDocumentHead(template, {
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      canonical: route.loc,
      keepKeywords: true,
    }),
    [...siteGraph(CANONICAL_ORIGIN), webApplicationNode(CANONICAL_ORIGIN)],
  );
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
  let html = publicHead(route);
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
assert.match(home, /"@type":"Organization"/);
assert.match(home, /"@type":"WebSite"/);
assert.match(home, /"@type":"WebApplication"/);
assert.equal(home.includes('FAQPage'), false);
assert.equal(home.includes('"@type":"Article"'), false);
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
assert.match(home, />LushLands Management</);
assert.match(home, />The Daily Pulse</);
assert.equal(home.includes('Lushlands Management'), false);
assert.equal(/More from Andrew|>Andrew</i.test(home), false);
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
assert.equal(start.includes('Meal planning guides'), false);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function flexText(value) {
  return escapeRegex(value).replace(/'/g, "(?:'|&#x27;)");
}

const guideLeads = {
  '/cheap-weekly-meal-plan': 'Feeding a household on a tight budget is mostly about planning.',
  '/family-of-4-meal-plan': 'Planning meals for four people is a juggling act.',
  '/meal-prep-shopping-list': 'A good meal prep session starts long before you pick up a knife.',
  '/7-day-dinner-plan': 'Dinner is the meal most of us find hardest to plan.',
  '/weekly-breakfast-ideas': 'Breakfast is often the meal that gets left to chance.',
  '/printable-weekly-meal-planner': 'Sometimes the simplest tools work best.',
};

for (const guide of GUIDE_PAGES) {
  assert.match(home, new RegExp(`href="${guide.path}"`));
  assert.match(home, new RegExp(`>${flexText(guide.h1)}<`));
  const pageHtml = rendered.get(guide.path);
  const lead = guideLeads[guide.path];
  assert.ok(pageHtml, guide.path);
  assert.equal((pageHtml.match(/<h1[\s>]/g) || []).length, 1, guide.path);
  assert.match(pageHtml, new RegExp(`<h1[^>]*>${flexText(guide.h1)}</h1>`));
  assert.match(pageHtml, new RegExp(`<title>${flexText(guide.title)}</title>`));
  assert.match(pageHtml, new RegExp(`<meta name="description" content="${flexText(guide.description)}" />`));
  assert.match(pageHtml, new RegExp(`<link rel="canonical" href="${CANONICAL_ORIGIN}${guide.path}" />`));
  assert.match(pageHtml, new RegExp(`<meta property="og:url" content="${CANONICAL_ORIGIN}${guide.path}" />`));
  assert.match(pageHtml, new RegExp(`<meta property="og:title" content="${flexText(guide.title)}" />`));
  assert.match(pageHtml, new RegExp(`<meta property="og:description" content="${flexText(guide.description)}" />`));
  assert.match(pageHtml, /<meta property="og:type" content="article" \/>/);
  assert.match(pageHtml, new RegExp(`<meta name="twitter:title" content="${flexText(guide.title)}" />`));
  assert.match(pageHtml, new RegExp(`<meta name="twitter:description" content="${flexText(guide.description)}" />`));
  assert.match(pageHtml, /"@type":"Article"/);
  assert.equal(pageHtml.includes('"@type":"WebPage"'), false);
  assert.match(pageHtml, /"@type":"BreadcrumbList"/);
  assert.match(pageHtml, /"@type":"HowTo"/);
  assert.match(pageHtml, /"@type":"FAQPage"/);
  const structured = JSON.parse(pageHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(structured, {
    '@context': 'https://schema.org',
    '@graph': [...siteGraph(CANONICAL_ORIGIN), ...guideGraph(guide, CANONICAL_ORIGIN)],
  });
  const decoded = pageHtml.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  const visible = decoded.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.ok(visible.includes(guide.shortAnswer), `${guide.path} short answer`);
  assert.ok(visible.indexOf(guide.h1) < visible.indexOf(guide.shortAnswer), `${guide.path} short answer under h1`);
  assert.ok(visible.indexOf(guide.shortAnswer) < visible.indexOf(guide.buttonLabel), `${guide.path} button after answer`);
  for (const node of structured['@graph']) {
    if (node['@type'] === 'FAQPage') {
      assert.equal(node.mainEntity.length, 5, guide.path);
      for (const question of node.mainEntity) {
        assert.ok(visible.includes(question.name), question.name);
        assert.ok(visible.includes(question.acceptedAnswer.text), question.acceptedAnswer.text);
      }
    }
    if (node['@type'] === 'HowTo') {
      assert.equal(node.name, guide.h1);
      assert.equal(node.description, guide.shortAnswer);
      assert.ok(node.step.length >= 5, guide.path);
      for (const step of node.step) {
        assert.ok(visible.includes(step.name), step.name);
        assert.ok(visible.includes(step.text), step.text);
        assert.equal(Object.hasOwn(step, 'url'), false);
        assert.ok(String(node.url).startsWith('https://www.weeklymealplan.space/'));
      }
    }
    if (node['@type'] === 'BreadcrumbList') {
      assert.equal(node.itemListElement[0].name, 'Weekly Meal Planner');
      assert.equal(node.itemListElement[0].item, 'https://www.weeklymealplan.space/');
      assert.equal(node.itemListElement[1].name, guide.h1);
      assert.equal(node.itemListElement[1].item, `https://www.weeklymealplan.space${guide.path}`);
    }
  }
  assert.equal(/affiliate/i.test(pageHtml), false, guide.path);
  assert.ok(pageHtml.includes(lead), guide.path);
  const buttonAt = pageHtml.search(new RegExp(`>${flexText(guide.buttonLabel)}</a>`));
  const slot1 = pageHtml.indexOf('data-ad-slot="mp-300x250"');
  const slot2 = pageHtml.indexOf('data-ad-slot="mp-728x90"');
  const footerAt = pageHtml.lastIndexOf('<footer');
  assert.ok(pageHtml.indexOf(lead) < buttonAt, `${guide.path} button`);
  assert.ok(buttonAt < slot1 && slot1 < slot2, `${guide.path} ad order`);
  assert.equal((pageHtml.match(/data-ad-slot=/g) || []).length, 2, guide.path);
  assert.equal(pageHtml.includes('mp-native-below'), false, guide.path);
  assert.equal(pageHtml.includes('mp-320x50'), false, guide.path);
  assert.equal((pageHtml.match(/Advertisement/g) || []).length, 2, guide.path);
  assert.equal(pageHtml.slice(footerAt).includes('data-ad-slot'), false, guide.path);
  assert.equal(/<script[^>]*src="https:\/\/bicea\.org/.test(pageHtml), false, guide.path);
  assert.equal(pageHtml.includes('[AD SLOT'), false, guide.path);
  assert.equal(pageHtml.includes('[MAIN BUTTON'), false, guide.path);
  assert.equal(pageHtml.includes('**'), false, guide.path);
  assert.equal(/registerprep/i.test(pageHtml), false, guide.path);
  assert.match(pageHtml, new RegExp(`<a href="/"[^>]*>${flexText(guide.buttonLabel)}</a>`));
  assert.equal(pageHtml.includes('Meal planning guides'), false, guide.path);
}

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

const sitemapLocs = [...builtSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.deepEqual(sitemapLocs, PUBLIC_ROUTES.map((route) => route.loc));
assert.equal(builtSitemap.includes('/signup'), false);
assert.equal(builtSitemap.includes('/checkout'), false);

function parsedJsonLd(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(blocks.length, 1);
  return JSON.parse(blocks[0][1]);
}

function assertAlignedHead(html, { title, description, canonical, keywords }) {
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.equal((html.match(/<link rel="canonical"/g) || []).length, 1);
  assert.equal((html.match(/<meta name="description"/g) || []).length, 1);
  assert.equal((html.match(/property="og:url"/g) || []).length, 1);
  assert.equal((html.match(/property="og:title"/g) || []).length, 1);
  assert.equal((html.match(/property="og:description"/g) || []).length, 1);
  assert.equal((html.match(/name="twitter:url"/g) || []).length, 1);
  assert.equal((html.match(/name="twitter:title"/g) || []).length, 1);
  assert.equal((html.match(/name="twitter:description"/g) || []).length, 1);
  assert.match(html, new RegExp(`<title>${flexText(title)}</title>`));
  assert.match(html, new RegExp(`property="og:title" content="${flexText(title)}"`));
  assert.match(html, new RegExp(`name="twitter:title" content="${flexText(title)}"`));
  assert.match(html, new RegExp(`name="description" content="${flexText(description)}"`));
  assert.match(html, new RegExp(`property="og:description" content="${flexText(description)}"`));
  assert.match(html, new RegExp(`name="twitter:description" content="${flexText(description)}"`));
  assert.match(html, new RegExp(`rel="canonical" href="${canonical}" />`));
  assert.match(html, new RegExp(`property="og:url" content="${canonical}" />`));
  assert.match(html, new RegExp(`name="twitter:url" content="${canonical}" />`));
  assert.equal((html.match(/<meta name="keywords"/g) || []).length, keywords ? 1 : 0);
  assert.equal(html.includes('https://weeklymealplan.space/'), false);
  assert.equal(html.includes('https://weeklymealplan.space"'), false);
}

function assertGraph(data, { article = false, faq = false, howTo = false, webPage = false, webApp = false } = {}) {
  assert.equal(data['@context'], 'https://schema.org');
  const types = data['@graph'].map((node) => node['@type']);
  assert.deepEqual(types.filter((type) => type === 'Organization').length, 1);
  assert.deepEqual(types.filter((type) => type === 'WebSite').length, 1);
  const organization = data['@graph'].find((node) => node['@type'] === 'Organization');
  assert.equal(organization.name, 'Weekly Meal Planner');
  assert.equal(organization['@id'], `${CANONICAL_ORIGIN}/#organization`);
  for (const key of ['logo', 'sameAs', 'email', 'telephone', 'contactPoint', 'address', 'image']) {
    assert.equal(Object.hasOwn(organization, key), false, key);
  }
  const website = data['@graph'].find((node) => node['@type'] === 'WebSite');
  assert.equal(website.name, 'Weekly Meal Planner');
  assert.equal(website.url, `${CANONICAL_ORIGIN}/`);
  assert.equal(website.description, HOME_DESCRIPTION);
  assert.equal(website.publisher['@id'], organization['@id']);
  assert.equal(types.includes('Article'), article);
  assert.equal(types.includes('FAQPage'), faq);
  assert.equal(types.includes('HowTo'), howTo);
  assert.equal(types.includes('WebPage'), webPage);
  assert.equal(types.includes('WebApplication'), webApp);
  if (article) {
    const node = data['@graph'].find((item) => item['@type'] === 'Article');
    assert.ok(node.headline);
    assert.ok(node.description);
    assert.ok(node.url.startsWith(`${CANONICAL_ORIGIN}/`));
    assert.equal(node.mainEntityOfPage, node.url);
    assert.equal(node.author['@id'], organization['@id']);
    assert.equal(node.publisher['@id'], organization['@id']);
    assert.equal(Object.hasOwn(node, 'datePublished'), false);
    assert.equal(Object.hasOwn(node, 'image'), false);
  }
  if (faq) {
    const node = data['@graph'].find((item) => item['@type'] === 'FAQPage');
    assert.ok(node.mainEntity.length > 0);
    for (const question of node.mainEntity) {
      assert.equal(question['@type'], 'Question');
      assert.ok(question.name);
      assert.equal(question.acceptedAnswer['@type'], 'Answer');
      assert.ok(question.acceptedAnswer.text);
    }
  }
  if (howTo) {
    const node = data['@graph'].find((item) => item['@type'] === 'HowTo');
    assert.ok(node.name);
    assert.ok(node.step.length > 0);
    for (const step of node.step) {
      assert.equal(step['@type'], 'HowToStep');
      assert.ok(step.name);
      assert.ok(step.text);
      assert.equal(typeof step.position, 'number');
    }
  }
  const crumbs = data['@graph'].find((item) => item['@type'] === 'BreadcrumbList');
  if (crumbs) {
    crumbs.itemListElement.forEach((item, index) => {
      assert.equal(item['@type'], 'ListItem');
      assert.equal(item.position, index + 1);
      assert.ok(item.name);
      assert.ok(item.item.startsWith(`${CANONICAL_ORIGIN}/`) || item.item === `${CANONICAL_ORIGIN}/`);
    });
  }
}

assertAlignedHead(home, {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  canonical: `${CANONICAL_ORIGIN}/`,
  keywords: true,
});
assertGraph(parsedJsonLd(home), { webApp: true });

assertAlignedHead(start, {
  title: START_TITLE,
  description: START_DESCRIPTION,
  canonical: `${CANONICAL_ORIGIN}/start`,
  keywords: false,
});
assertGraph(parsedJsonLd(start), { webPage: true });
assert.equal(start.includes('FAQPage'), false);
assert.equal(start.includes('"@type":"Article"'), false);

const seenTitles = new Set();
const seenDescriptions = new Set();
for (const route of PUBLIC_ROUTES) {
  const html = rendered.get(route.path);
  const title = route.guide ? route.guide.title : route.path === '/start' ? START_TITLE : HOME_TITLE;
  const description = route.guide ? route.guide.description : route.path === '/start' ? START_DESCRIPTION : HOME_DESCRIPTION;
  assert.equal(seenTitles.has(title), false, title);
  assert.equal(seenDescriptions.has(description), false, description);
  seenTitles.add(title);
  seenDescriptions.add(description);
  assertAlignedHead(html, { title, description, canonical: route.loc, keywords: route.path === '/' });
  const data = parsedJsonLd(html);
  if (route.guide) {
    assertGraph(data, { article: true, faq: true, howTo: true });
    const article = data['@graph'].find((node) => node['@type'] === 'Article');
    assert.equal(article.headline, route.guide.h1);
    assert.equal(article.description, route.guide.description);
  }
}
for (const routePath of SPA_FALLBACK_ROUTES) {
  const html = readFileSync(path.join(dist, routePath.replace(/^\//, ''), 'index.html'), 'utf8');
  const [title, description] = SHELL_META[routePath];
  assert.equal(seenTitles.has(title), false, title);
  assert.equal(seenDescriptions.has(description), false, description);
  seenTitles.add(title);
  seenDescriptions.add(description);
  assertAlignedHead(html, {
    title,
    description,
    canonical: `${CANONICAL_ORIGIN}${routePath}`,
    keywords: false,
  });
  assertGraph(parsedJsonLd(html));
  assert.equal(html.includes('FAQPage'), false, routePath);
  assert.match(html, /data-route-robots="shell"/);
}

assert.match(llms, /Plan your family's weekly meals with ease\. Browse recipe suggestions, save favorites, build a shopping list, and organize breakfast, lunch, and dinner for the whole week\./);
assert.match(llms, /https:\/\/www\.weeklymealplan\.space\//);
assert.equal(llms.includes('https://weeklymealplan.space'), false);

console.log(`Prerendered ${PUBLIC_ROUTES.map((route) => route.path).join(', ')}`);
