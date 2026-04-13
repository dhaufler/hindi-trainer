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
            interval_days = 0.5;
            error_count += 1;
            break;
        case 'hard':
            familiarity += 0.05;
            interval_days *= 1.2;
            break;
        case 'good':
            familiarity += 0.10;
            interval_days *= 2.0;
            break;
        case 'easy':
            familiarity += 0.15;
            interval_days *= 2.5;
            break;
        default:
            console.warn('updateSRS: unknown result', result);
    }

    // Clamp familiarity to [0, 1]
    familiarity = Math.min(1, Math.max(0, familiarity));

    // Enforce a sensible minimum interval so we don't get stuck
    interval_days = Math.max(0.25, interval_days);

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

/**
 * Returns true when the active set is strong enough to introduce new phrases.
 *
 * Condition: average familiarity of non-zero-familiarity phrases > 0.6,
 * OR there are no active phrases at all.
 *
 * @param {Array} phrases - all phrases (any familiarity)
 */
function shouldIntroduceNew(phrases) {
    if (phrases.length === 0) return true;

    const active = phrases.filter(p => p.familiarity > 0 || p.error_count > 0);
    if (active.length === 0) return false;

    const avg = active.reduce((s, p) => s + p.familiarity, 0) / active.length;
    return avg > 0.6;
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
