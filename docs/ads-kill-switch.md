# Adsterra kill switch

Every Adsterra slot and script is controlled by the build-time flag
`VITE_ADS_ENABLED`.

- Unset, or any value other than `false`, `0`, `off`, or `no`, keeps ads on.
  This is the default, so existing deploys do not change until the flag is set.
- `VITE_ADS_ENABLED=false` (or `0`, `off`, `no`) removes every slot, including
  reserved height, and does not request any ad scripts. The consent banner is
  also hidden, because there are no advertising cookies to accept.

Flip it at build time, then rebuild. Examples:

```bash
# Ads on (default)
npm run build

# Ads off: no slots, no ad requests, no layout gap
VITE_ADS_ENABLED=false npm run build
```

Do not set this variable in the Netlify UI unless you intend the next
production or preview build to pick it up. The flag is read at compile time,
so a rebuild is required to change the live behaviour. GoatCounter remains
unset; this switch does not affect cookieless analytics.
