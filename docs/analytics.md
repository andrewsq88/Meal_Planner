# Analytics

This site does not run analytics unless GoatCounter is enabled at build time.

GoatCounter.com is donation-supported and free for reasonable public use,
including small-to-medium businesses, with no card required to open an
account. Automated account registration is not allowed, so a human must
create the site and then set `VITE_GOATCOUNTER_CODE` to the site code at
build time. Until that variable is set, no analytics script is loaded and
no analytics pageviews are sent.

There is no first-party `/collect` beacon and no Netlify Function for
analytics.
