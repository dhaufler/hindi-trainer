// ── app.js ────────────────────────────────────────────────────────────────────
// Main application controller.
// Depends (in load order): phrases.js → scoring.js → srs.js → db.js → app.js

'use strict';

// ── State ─────────────────────────────────────────────────────────────────────

let allPhrases = [];   // all records from IndexedDB
let phraseQueue = [];   // ordered queue for this session
let currentPhrase = null; // the phrase being drilled right now
let recognition = null; // SpeechRecognition instance
let isRecognizing = false;
let currentScore = null; // score from the last recognition result

// ── DOM refs (populated on DOMContentLoaded) ──────────────────────────────────
let $englishPrompt, $hindiAnswer, $userResponse, $feedback,
    $micBtn, $playBtn, $showAnswerBtn, $nextBtn,
    $resultButtons, $topicBadge,
    $statTotal, $statLearned, $statDue,
    $progressFill, $progressLabel, $statusMsg;

// ── Initialisation ────────────────────────────────────────────────────────────

async function init() {
    try {
        showStatus('Loading…', 'info');
        await openDB();
        await seedPhrases();
        allPhrases = await getAllPhrases();
        setupSpeechRecognition();
        buildQueue();
        advanceToNext();
        updateStats();
        hideStatus();
    } catch (err) {
        console.error('Init failed:', err);
        showStatus('⚠ Could not initialise. Please reload.', 'error');
    }
}

// ── Queue management ──────────────────────────────────────────────────────────

const MAX_SESSION_SIZE = 8; // never more than this many in one round

function buildQueue() {
    phraseQueue = selectPhrases(allPhrases);

    // Cap to a focused working set
    if (phraseQueue.length > MAX_SESSION_SIZE) {
        phraseQueue = phraseQueue.slice(0, MAX_SESSION_SIZE);
    }

    // Fallback: if nothing is due, take the few least-familiar active phrases
    if (phraseQueue.length === 0) {
        const active = allPhrases.filter(p => p.next_review < 8640000000000000);
        phraseQueue = [...active]
            .sort((a, b) => a.familiarity - b.familiarity)
            .slice(0, MAX_SESSION_SIZE);
    }
}

// ── Phrase display ────────────────────────────────────────────────────────────

function advanceToNext() {
    if (phraseQueue.length === 0) {
        buildQueue();
    }

    if (phraseQueue.length === 0) {
        showAllCaughtUp();
        return;
    }

    currentPhrase = phraseQueue.shift();
    currentScore = null;

    // Resolve template slot if applicable
    const displayEnglish = resolveTemplate(currentPhrase.english);
    const displayHindi = resolveTemplate(currentPhrase.hindi);
    currentPhrase._resolvedHindi = displayHindi;
    currentPhrase._resolvedEnglish = displayEnglish;

    // Reset UI
    $englishPrompt.textContent = displayEnglish;
    $topicBadge.textContent = currentPhrase.topic;
    $hindiAnswer.textContent = '';
    $hindiAnswer.classList.remove('visible');
    $userResponse.textContent = '';
    $feedback.textContent = '';
    $feedback.className = 'feedback';
    $resultButtons.classList.add('hidden');
    $nextBtn.classList.add('hidden');
    $showAnswerBtn.classList.remove('hidden');
    // Re-enable mic only if it wasn't permanently blocked
    if ($micBtn.querySelector('.mic-label').textContent !== 'Mic blocked') {
        $micBtn.disabled = false;
    }
    $micBtn.classList.remove('recording');
    if ($micBtn.querySelector('.mic-label').textContent !== 'Mic blocked') {
        $micBtn.querySelector('.mic-label').textContent = 'Speak';
    }

    // Familiarity ring on the phrase card
    const pct = Math.round((currentPhrase.familiarity || 0) * 100);
    document.querySelector('.familiarity-ring')
        .style.setProperty('--pct', pct + '%');
    document.querySelector('.familiarity-pct').textContent = pct + '%';

    updateProgressBar();
}

/**
 * If the phrase has a template slot (___), pick a random variant.
 * Returns the resolved string.
 */
function resolveTemplate(text) {
    if (!text.includes('___')) return text;
    if (currentPhrase.variants && currentPhrase.variants.length) {
        const v = currentPhrase.variants[Math.floor(Math.random() * currentPhrase.variants.length)];
        return text.replace('___', v);
    }
    return text; // no variants defined — return raw template
}

// ── Speech recognition ────────────────────────────────────────────────────────

function setupSpeechRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
        $micBtn.disabled = true;
        $micBtn.title = 'Speech recognition unavailable – use Chrome on Android';
        showStatus('ℹ Speech recognition needs Chrome/Android. Use the text input below.', 'info');
        document.getElementById('text-input-row').classList.remove('hidden');
        return;
    }

    recognition = new SR();
    // Try Hindi recognition first; scores are compared after transliteration.
    // Falls back gracefully if hi-IN is unsupported on the device.
    recognition.lang = 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
        isRecognizing = true;
        $micBtn.classList.add('recording');
        $micBtn.querySelector('.mic-label').textContent = 'Listening…';
    };

    recognition.onresult = event => {
        const alts = Array.from(event.results[0]).map(r => r.transcript);
        handleRecognitionResult(alts);
    };

    recognition.onerror = event => {
        isRecognizing = false;
        $micBtn.classList.remove('recording');
        $micBtn.querySelector('.mic-label').textContent = 'Speak';

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            // Mic permission denied — fall back to text input
            showTextInput();
            $micBtn.disabled = true;
            $micBtn.querySelector('.mic-label').textContent = 'Mic blocked';
            showStatus('🎤 Microphone access denied — type your answers below instead.', 'info');
        } else if (event.error === 'language-not-supported') {
            // Re-try with English phonetic mode
            recognition.lang = 'en-US';
            showStatus('ℹ Switched to English phonetic mode for recognition.', 'info');
        } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
            showStatus(`Mic error: ${event.error}`, 'error');
        }
    };

    recognition.onend = () => {
        isRecognizing = false;
        $micBtn.classList.remove('recording');
        $micBtn.querySelector('.mic-label').textContent = 'Speak';
    };
}

function toggleRecognition() {
    if (!recognition) return;
    if (isRecognizing) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch (e) {
            // already started — ignore
        }
    }
}

// ── Scoring & feedback ────────────────────────────────────────────────────────

function handleRecognitionResult(alternatives) {
    if (!currentPhrase) return;

    const match = bestMatch(alternatives, currentPhrase._resolvedHindi);
    currentScore = match.score;

    $userResponse.textContent = `You said: "${match.text}"`;
    showFeedback(match.score, match.result);
}

function handleTextSubmit() {
    const input = document.getElementById('text-input').value.trim();
    if (!input || !currentPhrase) return;
    const score = computeScore(input, currentPhrase._resolvedHindi);
    const result = getResult(score);
    currentScore = score;
    $userResponse.textContent = `You typed: "${input}"`;
    showFeedback(score, result);
    document.getElementById('text-input').value = '';
}

function showFeedback(score, result) {
    // Reveal the correct answer
    $hindiAnswer.textContent = currentPhrase._resolvedHindi;
    $hindiAnswer.classList.add('visible');

    const pct = Math.round(score * 100);
    const labels = {
        correct: `✅ Correct! (${pct}%)`,
        close: `🟡 Close — (${pct}%)`,
        incorrect: `❌ Incorrect (${pct}%)`,
    };

    $feedback.textContent = labels[result];
    $feedback.className = `feedback ${result}`;

    // Speak the answer aloud
    speakHindi(currentPhrase._resolvedHindi);

    // Expose result buttons and disable mic
    $resultButtons.classList.remove('hidden');
    $nextBtn.classList.remove('hidden');
    $showAnswerBtn.classList.add('hidden');
    $micBtn.disabled = true;

    // Re-focus text input for fast keyboard flow
    const ti = document.getElementById('text-input');
    if (ti && !document.getElementById('text-input-row').classList.contains('hidden')) {
        ti.value = '';
    }

    // Pre-select the most likely self-assessment based on score
    highlightSuggestedRating(scoreToResult(score));
}

function highlightSuggestedRating(suggested) {
    document.querySelectorAll('[data-result]').forEach(btn => {
        btn.classList.toggle('suggested', btn.dataset.result === suggested);
    });
}

// ── SRS update & persistence ──────────────────────────────────────────────────

async function submitResult(resultCode) {
    if (!currentPhrase) return;

    const scoreForLog = currentScore ?? (resultCode === 'fail' ? 0.2
        : resultCode === 'hard' ? 0.7
            : resultCode === 'good' ? 0.9 : 1.0);

    const updated = updateSRS(currentPhrase, resultCode);

    // Sync to in-memory list
    const idx = allPhrases.findIndex(p => p.id === currentPhrase.id);
    if (idx >= 0) allPhrases[idx] = updated;

    try {
        await savePhrase(updated);
        await logReview(currentPhrase.id, scoreForLog, resultCode);
    } catch (e) {
        console.warn('Could not persist review:', e);
    }

    // Introduce new phrases if the active set is strong enough
    if (shouldIntroduceNew(allPhrases)) {
        const newBatch = introduceNewPhrases(allPhrases);
        for (const p of newBatch) {
            try { await savePhrase(p); } catch (_) { /* best-effort */ }
        }
        if (newBatch.length > 0) {
            showStatus(`✨ ${newBatch.length} new phrase${newBatch.length > 1 ? 's' : ''} unlocked!`, 'info');
            setTimeout(hideStatus, 3000);
        }
    }

    updateStats();
    advanceToNext();
}

// ── Speech synthesis ──────────────────────────────────────────────────────────

function speakHindi(text) {
    if (!window.speechSynthesis) return;

    speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'hi-IN';
    utter.rate = 0.85;

    // Pick a Hindi voice if available, otherwise fallback is fine
    const voices = speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.startsWith('hi'));
    if (hindiVoice) utter.voice = hindiVoice;

    speechSynthesis.speak(utter);
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function updateStats() {
    const now = Date.now();
    const active = allPhrases.filter(p => p.next_review < 8640000000000000);
    const learned = active.filter(p => p.familiarity >= 0.7).length;
    const due = active.filter(p => p.next_review <= now).length;

    $statTotal.textContent = active.length;
    $statLearned.textContent = learned;
    $statDue.textContent = due;
}

function updateProgressBar() {
    const active = allPhrases.filter(p => p.next_review < 8640000000000000);
    const avg = active.length
        ? active.reduce((s, p) => s + p.familiarity, 0) / active.length
        : 0;
    const pct = Math.round(avg * 100);
    $progressFill.style.width = pct + '%';
    $progressLabel.textContent = `${pct}% · ${active.length} of ${allPhrases.length} phrases active`;
}

function showStatus(msg, type = 'info') {
    $statusMsg.textContent = msg;
    $statusMsg.className = `status-msg ${type}`;
    $statusMsg.style.display = 'block';
}

function hideStatus() {
    $statusMsg.style.display = 'none';
}

function showTextInput() {
    const row = document.getElementById('text-input-row');
    if (row) row.classList.remove('hidden');
    // Auto-focus the text field on desktop so user can start typing
    const input = document.getElementById('text-input');
    if (input) input.focus();
}

function showAllCaughtUp() {
    $englishPrompt.textContent = '🎉 All caught up!';
    $topicBadge.textContent = '';
    $hindiAnswer.textContent = 'Great work. Come back later for more reviews.';
    $hindiAnswer.classList.add('visible');
    $micBtn.disabled = true;
    $showAnswerBtn.classList.add('hidden');
    updateProgressBar();
}

async function resetProgress() {
    if (!confirm('Reset all progress? This will start you over with 5 phrases.')) return;
    _db.close();
    _db = null;
    await new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = resolve;
        req.onerror = reject;
    });
    location.reload();
}

// ── Event wiring ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM refs
    $englishPrompt = document.getElementById('english-prompt');
    $hindiAnswer = document.getElementById('hindi-answer');
    $userResponse = document.getElementById('user-response');
    $feedback = document.getElementById('feedback');
    $micBtn = document.getElementById('mic-btn');
    $playBtn = document.getElementById('play-btn');
    $showAnswerBtn = document.getElementById('show-answer-btn');
    $nextBtn = document.getElementById('next-btn');
    $resultButtons = document.getElementById('result-buttons');
    $topicBadge = document.getElementById('topic-badge');
    $statTotal = document.getElementById('stat-total');
    $statLearned = document.getElementById('stat-learned');
    $statDue = document.getElementById('stat-due');
    $progressFill = document.getElementById('progress-fill');
    $progressLabel = document.getElementById('progress-label');
    $statusMsg = document.getElementById('status-msg');

    // Mic
    $micBtn.addEventListener('click', toggleRecognition);

    // Play audio
    $playBtn.addEventListener('click', () => {
        if (currentPhrase) speakHindi(currentPhrase._resolvedHindi);
    });

    // Show answer manually (without speaking)
    $showAnswerBtn.addEventListener('click', () => {
        if (!currentPhrase) return;
        $hindiAnswer.textContent = currentPhrase._resolvedHindi;
        $hindiAnswer.classList.add('visible');
        $resultButtons.classList.remove('hidden');
        $nextBtn.classList.remove('hidden');
        $showAnswerBtn.classList.add('hidden');
        $micBtn.disabled = true;
        speakHindi(currentPhrase._resolvedHindi);
    });

    // "Next" quick-advance (counts as 'good' if a score was already recorded)
    $nextBtn.addEventListener('click', () => {
        const code = currentScore !== null ? scoreToResult(currentScore) : 'good';
        submitResult(code);
    });

    // Self-assessment rating buttons
    document.querySelectorAll('[data-result]').forEach(btn => {
        btn.addEventListener('click', e => submitResult(e.currentTarget.dataset.result));
    });

    // Text input fallback (submit on Enter or button click)
    const textInput = document.getElementById('text-input');
    const submitText = document.getElementById('submit-text-btn');
    if (textInput) textInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleTextSubmit(); });
    if (submitText) submitText.addEventListener('click', handleTextSubmit);

    // Reset progress
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetProgress);

    // Kick off
    init();
});

// ── Service worker registration ───────────────────────────────────────────────

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('SW registered:', reg.scope))
            .catch(err => console.warn('SW registration failed:', err));
    });
}
