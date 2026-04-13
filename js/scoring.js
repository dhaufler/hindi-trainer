// ── scoring.js ───────────────────────────────────────────────────────────────
// Levenshtein-based similarity scoring + Devanagari → Latin transliteration.
// All logic is pure/synchronous — no DOM, no async.

// ── Devanagari → Latin ───────────────────────────────────────────────────────
// Used when the Web Speech API returns हिन्दी text (hi-IN mode).

const _CONSONANTS = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'f', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'ळ': 'l',
    'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'ड़': 'r', 'ढ़': 'rh',
};

const _VOWELS = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee',
    'उ': 'u', 'ऊ': 'oo', 'ए': 'e', 'ऐ': 'ai',
    'ओ': 'o', 'औ': 'au', 'ऋ': 'ri', 'ऍ': 'e', 'ऑ': 'o',
};

const _MATRAS = {
    'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u',
    'ू': 'oo', 'ृ': 'ri', 'े': 'e', 'ै': 'ai',
    'ो': 'o', 'ौ': 'au',
    'ं': 'n', 'ँ': 'n', 'ः': 'h',
};

const _HALANT = '्';

/**
 * Convert a Devanagari string to a Latin transliteration suitable for
 * comparison with our stored transliteration strings.
 */
function devanagariToLatin(text) {
    const chars = [...text]; // split by codepoint so surrogate pairs are fine
    let result = '';
    let i = 0;

    while (i < chars.length) {
        const ch = chars[i];

        if (ch in _CONSONANTS) {
            result += _CONSONANTS[ch];
            const next = chars[i + 1];
            if (next === _HALANT) {
                // Halant → suppress inherent vowel; skip both consonant+halant
                i += 2;
                continue;
            } else if (next in _MATRAS) {
                result += _MATRAS[next];
                i += 2;
                continue;
            } else {
                // Inherent 'a' — but drop at word boundary / end of string
                const afterNext = chars[i + 1];
                if (afterNext !== undefined && afterNext !== ' ') {
                    result += 'a';
                }
            }
        } else if (ch in _VOWELS) {
            result += _VOWELS[ch];
        } else if (ch in _MATRAS) {
            // Orphaned matra (shouldn't happen in well-formed text, but be safe)
            result += _MATRAS[ch];
        } else if (ch === _HALANT) {
            // skip
        } else if (ch === ' ') {
            result += ' ';
        } else if (/[a-z0-9]/i.test(ch)) {
            result += ch.toLowerCase();
        }
        // Unknown/punctuation characters are silently dropped

        i++;
    }

    return result.trim().replace(/\s+/g, ' ');
}

/**
 * Returns true if the string contains any Devanagari characters.
 */
function isDevanagari(str) {
    return /[\u0900-\u097F]/.test(str);
}

// ── Normalisation ─────────────────────────────────────────────────────────────

function normalize(str) {
    if (isDevanagari(str)) {
        str = devanagariToLatin(str);
    }
    return str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, '')   // strip punctuation
        .replace(/\s+/g, ' ');          // collapse whitespace
}

// ── Levenshtein distance ──────────────────────────────────────────────────────

function levenshteinDistance(a, b) {
    const m = a.length, n = b.length;
    // Use two-row rolling array to keep memory O(n)
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    let curr = new Array(n + 1);

    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                curr[j] = prev[j - 1];
            } else {
                curr[j] = 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
            }
        }
        [prev, curr] = [curr, prev];
    }
    return prev[n];
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compute a similarity score in [0, 1] between userInput and target.
 * Accepts both Latin transliteration and Devanagari input.
 *
 * score = 1 − (levenshtein / max_length)
 */
function computeScore(userInput, target) {
    const a = normalize(userInput);
    const b = normalize(target);

    if (a === b) return 1.0;

    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1.0;

    const dist = levenshteinDistance(a, b);
    return Math.max(0, 1 - dist / maxLen);
}

/**
 * Map a numeric score to a result category.
 * Returns: 'correct' | 'close' | 'incorrect'
 */
function getResult(score) {
    if (score > 0.85) return 'correct';
    if (score >= 0.60) return 'close';
    return 'incorrect';
}

/**
 * Given an array of recognition alternatives (strings), return the best
 * {score, text, result} against the target phrase.
 */
function bestMatch(alternatives, target) {
    let best = { score: -1, text: '', result: 'incorrect' };
    for (const alt of alternatives) {
        const score = computeScore(alt, target);
        if (score > best.score) {
            best = { score, text: alt, result: getResult(score) };
        }
    }
    return best;
}
