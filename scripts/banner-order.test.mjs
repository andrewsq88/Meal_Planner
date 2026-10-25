import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BANNER_300X250,
  BANNER_320X50,
  BANNER_728X90,
  NATIVE_SLOT,
  bannerAtOptions,
  bannerInvokeSrc,
  bannersForViewport,
  isAdRouteBlocked,
  mountBannersInOrder,
  reservedSlotHeight,
  slotsForViewport,
} from '../src/lib/adsterra.ts';
import { isSignupPath, isStartPath } from '../src/lib/routes.ts';

const banners = [
  {
    slot: 'mp-300x250',
    unitId: '31892842',
    size: '300x250',
    key: 'order-check-a',
    width: 300,
    height: 250,
  },
  {
    slot: 'mp-728x90',
    unitId: '31892844',
    size: '728x90',
    key: 'order-check-b',
    width: 728,
    height: 90,
  },
];

const seen = [];
let active = false;

await mountBannersInOrder(banners, async (banner) => {
  assert.equal(active, false);
  active = true;
  const options = bannerAtOptions(banner);
  assert.equal(options.format, 'iframe');
  assert.equal(options.key, banner.key);
  assert.equal(options.height, banner.height);
  assert.equal(options.width, banner.width);
  assert.deepEqual(options.params, {});
  assert.equal(bannerInvokeSrc(banner.key), `https://bicea.org/22/${banner.key}`);
  seen.push(options.key);
  await new Promise((resolve) => setTimeout(resolve, 15));
  active = false;
});

assert.deepEqual(seen, ['order-check-a', 'order-check-b']);

const mobile = bannersForViewport(true);
const desktop = bannersForViewport(false);
assert.deepEqual(mobile.map((banner) => banner.slot), ['mp-300x250', 'mp-320x50']);
assert.deepEqual(desktop.map((banner) => banner.slot), ['mp-300x250', 'mp-728x90']);
assert.equal(mobile.some((banner) => banner.slot === 'mp-728x90'), false);
assert.equal(desktop.some((banner) => banner.slot === 'mp-320x50'), false);
assert.deepEqual(slotsForViewport(true), ['mp-native-below', 'mp-300x250', 'mp-320x50']);
assert.deepEqual(slotsForViewport(false), ['mp-native-below', 'mp-300x250', 'mp-728x90']);
assert.equal(new Set(slotsForViewport(true)).size, 3);
assert.equal(new Set(slotsForViewport(false)).size, 3);

assert.equal(BANNER_300X250.unitId, '31892842');
assert.equal(BANNER_300X250.key, '34e44129251709530029981c3e745180');
assert.equal(BANNER_300X250.width, 300);
assert.equal(BANNER_300X250.height, 250);
assert.equal(BANNER_320X50.unitId, '31892843');
assert.equal(BANNER_320X50.key, 'fa50c1f9cb5dc4192c4b02fe37c56461');
assert.equal(BANNER_320X50.width, 320);
assert.equal(BANNER_320X50.height, 50);
assert.equal(BANNER_728X90.unitId, '31892844');
assert.equal(BANNER_728X90.key, 'd61b3b0f54ad245ef88499d87e516a9a');
assert.equal(BANNER_728X90.width, 728);
assert.equal(BANNER_728X90.height, 90);
assert.equal(bannerInvokeSrc(BANNER_300X250.key), 'https://bicea.org/22/34e44129251709530029981c3e745180');
assert.equal(reservedSlotHeight(BANNER_300X250.height), 270);
assert.equal(reservedSlotHeight(BANNER_320X50.height), 70);
assert.equal(reservedSlotHeight(BANNER_728X90.height), 110);
assert.equal(reservedSlotHeight(NATIVE_SLOT.frameHeight), 202);

for (const path of ['/checkout', '/pay', '/billing', '/stripe/return', '/auth', '/login', '/sign-in', '/signup', '/sign-up', '/register', '/account', '/start', '/start/', '/start#plan']) {
  assert.equal(isAdRouteBlocked(path), true, path);
}
assert.equal(isAdRouteBlocked('/'), false);
assert.equal(isAdRouteBlocked('/starting'), false);
assert.equal(isAdRouteBlocked('/#/checkout'), true);
assert.equal(isStartPath('/start'), true);
assert.equal(isStartPath('/start/'), true);
assert.equal(isStartPath('/'), false);
assert.equal(isStartPath('/starting'), false);
assert.equal(isSignupPath('/signup'), true);
assert.equal(isSignupPath('/signup/'), true);
assert.equal(isSignupPath('/sign-up'), true);
assert.equal(isSignupPath('/'), false);

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const meta = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);
assert.ok(meta, 'CSP meta tag');
const policy = meta[1];

function directive(name) {
  const match = policy.match(new RegExp(`(?:^|; )${name} [^;]*`));
  assert.ok(match, name);
  return match[0];
}

const scriptSrc = directive('script-src');
assert.equal(scriptSrc.includes('sha256-'), false);
assert.match(scriptSrc, /'unsafe-inline'/);
for (const name of ['script-src', 'frame-src', 'connect-src']) {
  assert.match(directive(name), /https:\/\/bicea\.org(?:\s|$)/, name);
}

assert.equal(html.includes('bicea.org/14/'), false);
assert.equal(html.includes('713c984856a716ba373916bd1e593b99'), false);
assert.equal(html.includes('injectSocialBar'), false);
assert.equal(/<script>\s*\(function/.test(html), false);
assert.equal(/<meta\s+name="robots"\s+content="noindex"/.test(html), false);
assert.match(html, /location\.pathname === "\/start"/);
assert.match(html, /startRobots\.setAttribute\("content", "noindex"\)/);

console.log('banner mount order ok');
