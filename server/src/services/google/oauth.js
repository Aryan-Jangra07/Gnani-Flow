import { config } from '../../config.js';
import { HttpError } from '../../errors.js';

export const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/contacts.other.readonly',
];

export function isConfigured() {
  return Boolean(config.google.clientId && config.google.clientSecret);
}

export function authUrl(state) {
  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function tokenRequest(body) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      ...body,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new HttpError(401, `Google login failed: ${data.error_description || data.error}`);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
}

export function exchangeCode(code) {
  return tokenRequest({ code, grant_type: 'authorization_code', redirect_uri: config.google.redirectUri });
}

export function refresh(refreshToken) {
  return tokenRequest({ refresh_token: refreshToken, grant_type: 'refresh_token' });
}

export async function getProfile(accessToken) {
  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new HttpError(401, 'Could not read Google profile');
  const data = await res.json();
  return { email: data.email, name: data.name, picture: data.picture };
}
