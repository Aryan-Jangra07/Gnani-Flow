import { googleFetch } from './client.js';

const FIELDS = 'names,emailAddresses';

function toContacts(results = []) {
  return results
    .map((r) => r.person)
    .filter((p) => p?.emailAddresses?.length)
    .map((p) => ({
      name: p.names?.[0]?.displayName || p.emailAddresses[0].value,
      email: p.emailAddresses[0].value,
    }));
}

// Searches saved contacts and "other contacts" (people you have emailed before)
export async function searchContacts(session, query) {
  const q = encodeURIComponent(query);

  const [saved, other] = await Promise.all([
    googleFetch(session, `https://people.googleapis.com/v1/people:searchContacts?query=${q}&readMask=${FIELDS}&pageSize=10`),
    googleFetch(session, `https://people.googleapis.com/v1/otherContacts:search?query=${q}&readMask=${FIELDS}&pageSize=10`),
  ]);

  const seen = new Set();
  return [...toContacts(saved?.results), ...toContacts(other?.results)].filter((c) => {
    const key = c.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Google asks for an empty "warmup" search before the first real one
export async function warmupContacts(session) {
  await Promise.allSettled([
    googleFetch(session, `https://people.googleapis.com/v1/people:searchContacts?query=&readMask=${FIELDS}`),
    googleFetch(session, `https://people.googleapis.com/v1/otherContacts:search?query=&readMask=${FIELDS}`),
  ]);
}
