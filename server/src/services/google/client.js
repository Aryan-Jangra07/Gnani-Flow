import { refresh } from './oauth.js';
import { HttpError } from '../../errors.js';

// fetch wrapper for Google APIs. Uses the tokens stored in the session and
// refreshes them when they expire.
export async function googleFetch(session, url, options = {}) {
  const tokens = session.google;
  if (!tokens) throw new HttpError(401, 'Google account not connected');

  if (Date.now() > tokens.expiresAt) {
    if (!tokens.refreshToken) throw new HttpError(401, 'Google session expired, please login again');
    const fresh = await refresh(tokens.refreshToken);
    session.google = { ...tokens, ...fresh, refreshToken: fresh.refreshToken || tokens.refreshToken };
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${session.google.accessToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });

  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.error?.message || res.statusText;
    throw new HttpError(res.status === 401 ? 401 : 502, `Google API: ${message}`);
  }

  return data;
}
