// The access token lives ONLY in memory (a module-level variable), never in
// localStorage. This is deliberate: localStorage is readable by any script on
// the page, so a successful XSS attack can steal a token sitting there.
// A page refresh loses this variable — that's fine, AuthContext re-fetches
// a fresh access token on mount using the httpOnly refresh cookie.
let accessToken = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}
