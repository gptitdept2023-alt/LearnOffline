/**
 * Thin promise wrapper over IndexedDB. This is the ONLY file that talks to
 * IndexedDB directly; everything else goes through repo.js.
 *
 * Why IndexedDB and not localStorage: it is asynchronous (never blocks the
 * UI), stores structured objects, has indexes for fast range queries, and
 * holds far more data (hundreds of MB vs about 5 MB).
 */

export const DB_NAME = 'learnoffline';
export const DB_VERSION = 1;

/** Store names, in one place so a typo fails loudly. */
export const STORES = Object.freeze({
  profiles: 'profiles',
  attempts: 'attempts',
  mastery: 'mastery',
  rewards: 'rewards',
  sessions: 'sessions',
  settings: 'settings',
});

/**
 * Schema migrations, one function per version. To change the schema later,
 * bump DB_VERSION and add a new entry; existing data is preserved.
 */
const MIGRATIONS = {
  1: (db) => {
    db.createObjectStore(STORES.profiles, { keyPath: 'profileId' });

    // Append-only log of every answer. Indexed for per-child, per-skill and per-day reports.
    const attempts = db.createObjectStore(STORES.attempts, { keyPath: 'attemptId', autoIncrement: true });
    attempts.createIndex('byProfileDate', ['profileId', 'answeredAt']);
    attempts.createIndex('byProfileSkill', ['profileId', 'skillId']);

    // Running totals per child and skill, so reports never scan every attempt.
    const mastery = db.createObjectStore(STORES.mastery, { keyPath: ['profileId', 'skillId'] });
    mastery.createIndex('byProfile', 'profileId');

    db.createObjectStore(STORES.rewards, { keyPath: 'profileId' });

    // One row per finished practice set (for the activity chart and history).
    const sessions = db.createObjectStore(STORES.sessions, { keyPath: 'sessionId' });
    sessions.createIndex('byProfileDate', ['profileId', 'finishedAt']);

    db.createObjectStore(STORES.settings, { keyPath: 'key' });
  },
};

let dbPromise = null;

/** Open (and if needed upgrade) the database once; later calls reuse it. */
export const openDb = () => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) {
      reject(new Error('This browser cannot store data offline (IndexedDB is missing).'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      for (let v = event.oldVersion + 1; v <= DB_VERSION; v += 1) MIGRATIONS[v](db, request.transaction);
    };
    request.onsuccess = () => {
      const db = request.result;
      // If another tab upgrades the schema, close so it can proceed.
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Please close other LearnOffline tabs and reload.'));
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
};

/** Wrap an IDBRequest in a promise. */
const promisify = (request) => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

/**
 * Run work inside one transaction and resolve when it commits.
 * Batching related writes in one transaction is much faster than one
 * transaction per write, and makes the batch all-or-nothing.
 * @template T
 * @param {string|string[]} storeNames
 * @param {'readonly'|'readwrite'} mode
 * @param {(stores: Object<string, IDBObjectStore>) => T|Promise<T>} work
 * @returns {Promise<T>}
 */
export const tx = async (storeNames, mode, work) => {
  const db = await openDb();
  const names = Array.isArray(storeNames) ? storeNames : [storeNames];
  const transaction = db.transaction(names, mode);
  const stores = Object.fromEntries(names.map((n) => [n, transaction.objectStore(n)]));
  const done = new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('Transaction aborted'));
  });
  const result = await work(stores);
  await done;
  return result;
};

/* Convenience helpers for single operations. */

export const get = (store, key) => tx(store, 'readonly', (s) => promisify(s[store].get(key)));

export const getAll = (store, query) => tx(store, 'readonly', (s) => promisify(s[store].getAll(query)));

export const getAllByIndex = (store, indexName, range) =>
  tx(store, 'readonly', (s) => promisify(s[store].index(indexName).getAll(range)));

export const put = (store, value) => tx(store, 'readwrite', (s) => promisify(s[store].put(value)));

export const del = (store, key) => tx(store, 'readwrite', (s) => promisify(s[store].delete(key)));

export { promisify };
