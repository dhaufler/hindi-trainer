// ── db.js ─────────────────────────────────────────────────────────────────────
// IndexedDB wrapper.  All public functions return Promises.
// Depends on: phrases.js (SEED_PHRASES), srs.js (SRS_DEFAULTS)

const DB_NAME = 'hindi-trainer';
const DB_VERSION = 1;

let _db = null; // module-level singleton

// ── Open / schema ─────────────────────────────────────────────────────────────

function openDB() {
    if (_db) return Promise.resolve(_db);

    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = event => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains('phrases')) {
                const store = db.createObjectStore('phrases', { keyPath: 'id' });
                store.createIndex('next_review', 'next_review', { unique: false });
                store.createIndex('familiarity', 'familiarity', { unique: false });
                store.createIndex('topic', 'topic', { unique: false });
            }

            if (!db.objectStoreNames.contains('review_log')) {
                db.createObjectStore('review_log', { autoIncrement: true });
            }
        };

        req.onsuccess = event => {
            _db = event.target.result;
            resolve(_db);
        };

        req.onerror = event => reject(event.target.error);
    });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _tx(storeName, mode, fn) {
    return new Promise((resolve, reject) => {
        const tx = _db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const req = fn(store);

        if (req) {
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        } else {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        }
    });
}

// ── Phrases ───────────────────────────────────────────────────────────────────

function getAllPhrases() {
    return _tx('phrases', 'readonly', store => store.getAll());
}

function savePhrase(phrase) {
    return _tx('phrases', 'readwrite', store => store.put(phrase));
}

/**
 * Bulk-insert SEED_PHRASES the very first time.
 * Skips gracefully if the store already has data.
 */
const INITIAL_ACTIVE_COUNT = 5; // only this many phrases active on first run

async function seedPhrases() {
    const existing = await getAllPhrases();
    if (existing.length > 0) return;

    const now = Date.now();
    const DORMANT = 8640000000000000; // far-future timestamp — dormant until activated

    return new Promise((resolve, reject) => {
        const tx = _db.transaction('phrases', 'readwrite');
        const store = tx.objectStore('phrases');

        SEED_PHRASES.forEach((phrase, i) => {
            store.put({
                ...phrase,
                ...SRS_DEFAULTS,
                next_review: i < INITIAL_ACTIVE_COUNT ? now : DORMANT,
            });
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ── Review log ────────────────────────────────────────────────────────────────

function logReview(phrase_id, score, result) {
    return new Promise((resolve, reject) => {
        const tx = _db.transaction('review_log', 'readwrite');
        const req = tx.objectStore('review_log').add({
            timestamp: Date.now(),
            phrase_id,
            score,
            result,
        });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

// ── Stats helpers ─────────────────────────────────────────────────────────────

async function getStats() {
    const phrases = await getAllPhrases();
    const now = Date.now();
    return {
        total: phrases.length,
        due: phrases.filter(p => p.next_review <= now).length,
        learned: phrases.filter(p => p.familiarity >= 0.7).length,
        avgFamiliarity: phrases.length
            ? phrases.reduce((s, p) => s + p.familiarity, 0) / phrases.length
            : 0,
    };
}
