import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';

// Simple JSON file store. Good enough until we move to Postgres.
const MAX_PER_USER = 50;
let cache = null;
let writing = Promise.resolve();

async function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(config.historyFile, 'utf8'));
  } catch {
    cache = {};
  }
  return cache;
}

function save() {
  const data = JSON.stringify(cache, null, 2);
  writing = writing.then(async () => {
    await fs.mkdir(path.dirname(config.historyFile), { recursive: true });
    await fs.writeFile(config.historyFile, data);
  });
  return writing;
}

export async function addEntry(userEmail, entry) {
  const db = await load();
  const item = { id: randomUUID(), createdAt: new Date().toISOString(), ...entry };
  db[userEmail] = [item, ...(db[userEmail] || [])].slice(0, MAX_PER_USER);
  await save();
  return item;
}

export async function listEntries(userEmail) {
  const db = await load();
  return db[userEmail] || [];
}

export async function updateEntry(userEmail, id, changes) {
  const db = await load();
  const item = (db[userEmail] || []).find((e) => e.id === id);
  if (!item) return null;
  Object.assign(item, changes);
  await save();
  return item;
}
