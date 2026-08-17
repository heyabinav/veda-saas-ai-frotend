import assert from 'node:assert/strict';
import { readCookieValue, isPostLoginGraceActive, parseSupabaseSessionToken } from '../src/lib/auth-session.js';

assert.equal(readCookieValue('post_login_grace', 'post_login_grace=1755500000000; auth_token=abc'), '1755500000000');
assert.equal(readCookieValue('missing', 'post_login_grace=1755500000000; auth_token=abc'), null);
assert.equal(parseSupabaseSessionToken(encodeURIComponent(JSON.stringify([{ access_token: 'abc123' }]))), 'abc123');
assert.equal(isPostLoginGraceActive('post_login_grace=' + (Date.now() + 60000)), true);
assert.equal(isPostLoginGraceActive('post_login_grace=' + (Date.now() - 60000)), false);

console.log('auth sync guard checks passed');