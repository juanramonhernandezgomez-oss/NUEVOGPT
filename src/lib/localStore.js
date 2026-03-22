const memoryStore = new Map();
const hasWindow = typeof window !== 'undefined';

function getStorage() {
  if (hasWindow && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: (key) => memoryStore.get(key) ?? null,
    setItem: (key, value) => memoryStore.set(key, value),
    removeItem: (key) => memoryStore.delete(key),
  };
}

const storage = getStorage();

export function readCollection(key, fallback = []) {
  const raw = storage.getItem(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeCollection(key, value) {
  storage.setItem(key, JSON.stringify(value));
  return value;
}

export function createRecord(collectionKey, data) {
  const records = readCollection(collectionKey, []);
  const now = new Date().toISOString();
  const record = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    created_date: now,
    updated_date: now,
    ...data,
  };
  records.unshift(record);
  writeCollection(collectionKey, records);
  return record;
}

export function deleteRecord(collectionKey, id) {
  const records = readCollection(collectionKey, []);
  const next = records.filter((record) => record.id !== id);
  writeCollection(collectionKey, next);
}
