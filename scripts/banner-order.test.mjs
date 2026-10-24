import assert from 'node:assert/strict';
import { bannerAtOptions, mountBannersInOrder } from '../src/lib/adsterra.ts';

const banners = [
  {
    slot: 'mp-300x250',
    size: '300x250',
    key: 'order-check-a',
    width: 300,
    height: 250,
    frameClassName: '',
  },
  {
    slot: 'mp-728x90',
    size: '728x90',
    key: 'order-check-b',
    width: 728,
    height: 90,
    frameClassName: 'hidden md:block',
  },
];

const seen = [];
let active = false;

await mountBannersInOrder(banners, async (banner) => {
  assert.equal(active, false);
  active = true;
  const options = bannerAtOptions(banner);
  assert.equal(options.format, 'iframe');
  assert.equal(options.height, banner.height);
  assert.equal(options.width, banner.width);
  assert.deepEqual(options.params, {});
  seen.push(options.key);
  await new Promise((resolve) => setTimeout(resolve, 15));
  active = false;
});

assert.deepEqual(seen, ['order-check-a', 'order-check-b']);
console.log('banner mount order ok');
