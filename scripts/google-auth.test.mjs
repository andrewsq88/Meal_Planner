import assert from 'node:assert/strict';
import { isAdRouteBlocked } from '../src/lib/adsterra.ts';
import {
  accountLabel,
  friendlyGoogleAuthError,
  googleProfileNamePatch,
  googleRedirectTo,
  postLoginLocation,
  preservedAuthSearch,
  readOAuthReturn,
  safeInternalPath,
} from '../src/lib/google-auth.ts';
import { AUTH_CALLBACK_PATH, isAuthCallbackPath } from '../src/lib/routes.ts';

assert.equal(AUTH_CALLBACK_PATH, '/auth/callback');
assert.equal(isAuthCallbackPath('/auth/callback'), true);
assert.equal(isAuthCallbackPath('/auth/callback/'), true);
assert.equal(isAuthCallbackPath('/auth'), false);
assert.equal(isAuthCallbackPath('/login'), false);
assert.equal(isAdRouteBlocked('/auth/callback'), true);
assert.equal(isAdRouteBlocked('/login'), true);
assert.equal(isAdRouteBlocked('/signup'), true);
assert.equal(isAdRouteBlocked('/'), false);

const origin = 'https://www.weeklymealplan.space';
assert.equal(
  googleRedirectTo(origin, ''),
  'https://www.weeklymealplan.space/auth/callback',
);
assert.equal(
  googleRedirectTo(`${origin}/`, '?plan=family&utm=ad'),
  'https://www.weeklymealplan.space/auth/callback?plan=family',
);
assert.equal(
  preservedAuthSearch('?plan=family&next=/start&redirect=/login&utm=ad'),
  '?plan=family&next=%2Fstart&redirect=%2Flogin',
);
assert.equal(
  googleRedirectTo(origin, '?next=/week&plan=pro'),
  'https://www.weeklymealplan.space/auth/callback?plan=pro&next=%2Fweek',
);

assert.equal(postLoginLocation(''), '/');
assert.equal(postLoginLocation('?plan=family'), '/?plan=family');
assert.equal(postLoginLocation('?next=/start&plan=family'), '/start?plan=family');
assert.equal(postLoginLocation('?redirect=/login'), '/login');
assert.equal(postLoginLocation('?next=https://evil.example/phish'), '/');
assert.equal(postLoginLocation('?next=//evil.example'), '/');
assert.equal(postLoginLocation('?redirect=%2F%2Fevil.example'), '/');
assert.equal(safeInternalPath('/auth/callback'), '/auth/callback');
assert.equal(safeInternalPath('/start\u0001'), null);
assert.equal(postLoginLocation('?next=/auth/callback&plan=family'), '/?plan=family');

assert.equal(
  friendlyGoogleAuthError('access_denied', 'The user cancelled the sign-in'),
  'Google sign-in was cancelled. You can try again, or continue with email.',
);
assert.equal(
  friendlyGoogleAuthError('', 'Unsupported provider: provider is not enabled'),
  'Google sign-in is not available right now. Continue with email, or try again later.',
);
assert.match(friendlyGoogleAuthError('server_error', 'temporarily unavailable'), /did not finish/);

assert.deepEqual(readOAuthReturn('?error=access_denied&error_description=cancelled', ''), {
  status: 'error',
  message: 'Google sign-in was cancelled. You can try again, or continue with email.',
});
assert.deepEqual(readOAuthReturn('', '#error=access_denied&error_description=User+closed'), {
  status: 'error',
  message: 'Google sign-in was cancelled. You can try again, or continue with email.',
});
assert.deepEqual(readOAuthReturn('?code=abc', ''), { status: 'pending' });
assert.deepEqual(readOAuthReturn('', '#access_token=tok'), { status: 'pending' });
assert.deepEqual(readOAuthReturn('', ''), { status: 'none' });

assert.equal(accountLabel({ email: 'ada@example.com', user_metadata: {} }), 'ada@example.com');
assert.equal(accountLabel({ email: 'ada@example.com', user_metadata: { full_name: 'Ada Lovelace' } }), 'Ada Lovelace');
assert.equal(accountLabel({ email: 'ada@example.com', user_metadata: { name: 'Ada' } }), 'Ada');
assert.equal(accountLabel({ email: null, user_metadata: {} }), '');

assert.equal(googleProfileNamePatch({ app_metadata: { provider: 'email' }, user_metadata: { name: 'Ada' } }), null);
assert.equal(
  googleProfileNamePatch({ app_metadata: { provider: 'google' }, user_metadata: { full_name: 'Ada Lovelace' } }),
  null,
);
assert.deepEqual(
  googleProfileNamePatch({ app_metadata: { provider: 'google' }, user_metadata: { name: 'Ada Lovelace' } }),
  { full_name: 'Ada Lovelace' },
);
assert.equal(
  googleProfileNamePatch({ app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { name: 'Ada' } }),
  null,
);
assert.deepEqual(
  googleProfileNamePatch({ app_metadata: { provider: 'email', providers: ['email', 'google'] }, user_metadata: { name: 'Ada' } }),
  { full_name: 'Ada' },
);
assert.deepEqual(
  googleProfileNamePatch({ app_metadata: { providers: ['google'] }, user_metadata: { name: 'Ada' } }),
  { full_name: 'Ada' },
);
assert.equal(
  googleProfileNamePatch({ app_metadata: { provider: 'google' }, user_metadata: {} }),
  null,
);

console.log('google auth helpers ok');
