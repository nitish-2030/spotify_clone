// Spotify login: Authorization Code + PKCE (frontend only, no client secret needed)
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
export const hasSpotifyConfig = Boolean(CLIENT_ID);

// This EXACT value must be added to the Redirect URIs in the Spotify Dashboard (with the trailing "/")
export const REDIRECT_URI =
  import.meta.env.VITE_SPOTIFY_REDIRECT_URI || `${window.location.origin}/`;

const SCOPES = [
  "streaming", "user-read-email", "user-read-private",
  "user-read-playback-state", "user-modify-playback-state",
  "user-top-read", "user-read-recently-played", "user-library-read",
  "playlist-read-private", "playlist-read-collaborative",
].join(" ");

const K = { token: "sp_token", verifier: "sp_verifier", state: "sp_state" };
const TOKEN_URL = "https://accounts.spotify.com/api/token";

const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function randomString(len = 64) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return [...bytes].map((b) => chars[b % chars.length]).join("");
}

function saveToken(data) {
  const prev = readToken();
  localStorage.setItem(K.token, JSON.stringify({
    access: data.access_token,
    refresh: data.refresh_token || prev?.refresh,
    expires: Date.now() + (data.expires_in - 60) * 1000,
  }));
}
const readToken = () => {
  try { return JSON.parse(localStorage.getItem(K.token)); } catch { return null; }
};

export const isConnected = () => Boolean(readToken()?.refresh);

export async function startLogin() {
  const verifier = randomString(64);
  const state = randomString(16);
  sessionStorage.setItem(K.verifier, verifier);
  sessionStorage.setItem(K.state, state);
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const params = new URLSearchParams({
    client_id: CLIENT_ID, response_type: "code", redirect_uri: REDIRECT_URI,
    scope: SCOPES, state, code_challenge_method: "S256", code_challenge: challenge,
  });
  window.location.assign(`https://accounts.spotify.com/authorize?${params}`);
}

async function tokenRequest(body) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...body }),
  });
  if (!res.ok) throw new Error(`token error ${res.status}`);
  return res.json();
}

// Runs once when we come back from the redirect. The promise is cached so
// React StrictMode (double effects in dev) never exchanges the code twice.
let callbackPromise = null;
export function handleAuthCallback() {
  callbackPromise ??= (async () => {
    const q = new URLSearchParams(window.location.search);
    if (!q.has("code") && !q.has("error")) return { status: "none" };
    window.history.replaceState({}, "", window.location.pathname);
    if (q.get("error")) return { status: "error", message: `Spotify login was cancelled or failed: ${q.get("error")}` };
    if (q.get("state") !== sessionStorage.getItem(K.state)) return { status: "error", message: "Login check failed. Please try again" };
    try {
      saveToken(await tokenRequest({
        grant_type: "authorization_code", code: q.get("code"),
        redirect_uri: REDIRECT_URI, code_verifier: sessionStorage.getItem(K.verifier),
      }));
      return { status: "ok" };
    } catch (e) {
      return { status: "error", message: `Spotify login failed: ${e.message}` };
    }
  })();
  return callbackPromise;
}

export async function getAccessToken() {
  const t = readToken();
  if (!t) return null;
  if (Date.now() < t.expires) return t.access;
  if (!t.refresh) return null;
  try {
    saveToken(await tokenRequest({ grant_type: "refresh_token", refresh_token: t.refresh }));
    return readToken().access;
  } catch {
    logout();
    return null;
  }
}

export function logout() {
  localStorage.removeItem(K.token);
}