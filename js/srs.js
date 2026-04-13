// ── srs.js ───────────────────────────────────────────────────────────────────
// Adaptive spaced-repetition scheduling.  Pure functions; no DOM, no async.

const SRS_DEFAULTS = {
    familiarity: 0,
    interval_days: 1,
    next_review: 0,   // epoch ms — 0 means "due immediately"
    error_count: 0,
};

// Result codes accepted by updateSRS
// 'fail' | 'hard' | 'good' | 'easy'

/**
 * Apply an SRS update to a phrase object.
 * Returns a NEW object (does not mutate the original).
 *
 * @param {Object} phrase   - phrase record from IndexedDB
 * @param {string} result   - 'fail' | 'hard' | 'good' | 'easy'
 * @returns {Object}        - updated phrase record
 */
function updateSRS(phrase, result) {
    let { familiarity, interval_days, error_count } = phrase;

    switch (result) {
        case 'fail':
            familiarity -= 0.20;
            interval_days = 0.003;   // ~4 minutes — come back very soon
            error_count += 1;
            break;
        case 'hard':
            familiarity += 0.05;
            interval_days = Math.max(0.005, interval_days * 1.2); // ~7 min minimum
            break;
        case 'good':
            familiarity += 0.10;
            interval_days = Math.max(0.007, interval_days * 1.5); // ~10 min minimum
            break;
        case 'easy':
            familiarity += 0.15;
            interval_days = Math.max(0.01, interval_days * 2.0);  // ~15 min minimum
            break;
        default:
            console.warn('updateSRS: unknown result', result);
    }

    // Clamp familiarity to [0, 1]
    familiarity = Math.min(1, Math.max(0, familiarity));

    // Once well-learned (familiarity >= 0.7), allow longer real-day intervals.
    // Below that, keep intervals short so phrases recycle within the session.
    if (familiarity < 0.7) {
        interval_days = Math.min(interval_days, 0.04); // cap at ~1 hour
    }

    const next_review = Date.now() + interval_days * 24 * 60 * 60 * 1000;

    return { ...phrase, familiarity, interval_days, error_count, next_review };
}

/**
 * Select the phrases that should be reviewed in this session.
 *
 * Priority order:
 *   1. Overdue (next_review <= now)
 *   2. Low familiarity (< 0.3) — always include regardless of schedule
 *   3. High error count (> 2)   — always include regardless of schedule
 *
 * Within the set, sort: lowest familiarity first, then highest error_count.
 *
 * @param {Array}  phrases  - full list of phrase records
 * @param {number} [now]    - optional override for current time (epoch ms)
 * @returns {Array}         - ordered array of phrases to review
 */
function selectPhrases(phrases, now = Date.now()) {
    const due = phrases.filter(p => p.next_review <= now);
    const priority = phrases.filter(p => p.familiarity < 0.3 || p.error_count > 2);

    // Merge, deduplicate by id
    const merged = [...new Map(
        [...due, ...priority].map(p => [p.id, p])
    ).values()];

    merged.sort((a, b) => {
        if (a.familiarity !== b.familiarity) return a.familiarity - b.familiarity;
        return b.error_count - a.error_count;
    });

    return merged;
}

const DORMANT_TS = 8640000000000000; // must match db.js
const NEW_BATCH_SIZE = 3;            // how many new phrases per introduction

/**
 * Returns true when the active set is strong enough to introduce new phrases.
 * "Active" = any phrase whose next_review is not the far-future dormant value.
 *
 * Condition: EVERY active phrase must have familiarity >= 0.7
 * (i.e. you've truly learned the whole batch before moving on).
 */
function shouldIntroduceNew(phrases) {
    const active = phrases.filter(p => p.next_review < DORMANT_TS);
    if (active.length === 0) return true;

    // Need at least one review on every active phrase before considering
    const allReviewed = active.every(p => p.familiarity > 0 || p.error_count > 0);
    if (!allReviewed) return false;

    // Every active phrase must be at 0.7+ familiarity
    return active.every(p => p.familiarity >= 0.7);
}

/**
 * Activate the next batch of dormant phrases by setting their
 * next_review to now.  Returns the newly activated phrase objects.
 */
function introduceNewPhrases(allPhrases, count = NEW_BATCH_SIZE) {
    const dormant = allPhrases.filter(p => p.next_review >= DORMANT_TS);
    const batch = dormant.slice(0, count);
    const now = Date.now();

    for (const p of batch) {
        p.next_review = now;
    }
    return batch;
}

/**
 * Map a score + autoResult to an SRS result code.
 * Used when we want to auto-grade instead of asking the user to self-assess.
 */
function scoreToResult(score) {
    if (score > 0.90) return 'easy';
    if (score > 0.75) return 'good';
    if (score >= 0.60) return 'hard';
    return 'fail';
}
