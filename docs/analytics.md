# Cookieless analytics

This site uses a first-party, cookieless pageview beacon. It records path,
referrer, viewport, and time, and does not set cookies or a lasting identifier.

GoatCounter is also wired as an optional hosted destination. GoatCounter.com
is donation-supported and free for reasonable public use, including
small-to-medium businesses, with no card required to open an account.
GoatCounter does not allow automated account registration, so a human must
create the site and then set `VITE_GOATCOUNTER_CODE` to the site code at
build time. Until that variable is set, only the first-party beacon runs.

Do not use a Netlify Function as the collect endpoint: that would consume
Netlify credits on every pageview.
