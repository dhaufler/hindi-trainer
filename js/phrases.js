// Seed phrase data — transliteration only, no Devanagari
// template: true phrases use ___ as a slot placeholder
// gloss: word-by-word literal translation to show sentence structure
const SEED_PHRASES = [
    // ── Greetings ────────────────────────────────────────────
    { id: 1, english: "Hello", hindi: "namaste", gloss: "namaste = hello/greetings", topic: "greetings", template: false },
    { id: 2, english: "How are you?", hindi: "aap kaise hain", gloss: "aap = you · kaise = how · hain = are", topic: "greetings", template: false },
    { id: 3, english: "I am fine", hindi: "main theek hoon", gloss: "main = I · theek = fine/okay · hoon = am", topic: "greetings", template: false },
    { id: 4, english: "And you?", hindi: "aur aap", gloss: "aur = and · aap = you", topic: "greetings", template: false },
    { id: 5, english: "Good morning", hindi: "suprabhat", gloss: "suprabhat = good-morning", topic: "greetings", template: false },
    { id: 6, english: "Good night", hindi: "shubh ratri", gloss: "shubh = good · ratri = night", topic: "greetings", template: false },
    { id: 7, english: "See you later", hindi: "phir milenge", gloss: "phir = again · milenge = will-meet", topic: "greetings", template: false },
    { id: 8, english: "Thank you", hindi: "shukriya", gloss: "shukriya = thank-you", topic: "greetings", template: false },
    { id: 9, english: "You're welcome", hindi: "koi baat nahi", gloss: "koi = any · baat = thing/matter · nahi = not", topic: "greetings", template: false },
    { id: 10, english: "Goodbye", hindi: "alvida", gloss: "alvida = goodbye", topic: "greetings", template: false },

    // ── Identity ─────────────────────────────────────────────
    { id: 11, english: "What is your name?", hindi: "aapka naam kya hai", gloss: "aapka = your · naam = name · kya = what · hai = is", topic: "identity", template: false },
    {
        id: 12, english: "My name is ___", hindi: "mera naam ___ hai", gloss: "mera = my · naam = name · ___ · hai = is", topic: "identity", template: true,
        variants: ["darrell"]
    },
    { id: 13, english: "Where are you from?", hindi: "aap kahan se hain", gloss: "aap = you · kahan = where · se = from · hain = are", topic: "identity", template: false },
    { id: 14, english: "I am from America", hindi: "main america se hoon", gloss: "main = I · america · se = from · hoon = am", topic: "identity", template: false },
    { id: 15, english: "I am learning Hindi", hindi: "main hindi seekh raha hoon", gloss: "main = I · hindi · seekh = learn · raha = -ing · hoon = am", topic: "identity", template: false },
    { id: 16, english: "I am a student", hindi: "main ek chhatra hoon", gloss: "main = I · ek = a/one · chhatra = student · hoon = am", topic: "identity", template: false },
    { id: 17, english: "I am happy", hindi: "main khush hoon", gloss: "main = I · khush = happy · hoon = am", topic: "identity", template: false },
    { id: 18, english: "I am tired", hindi: "main thaka hoon", gloss: "main = I · thaka = tired · hoon = am", topic: "identity", template: false },

    // ── Food & Drink ──────────────────────────────────────────
    { id: 19, english: "I like tea", hindi: "mujhe chai pasand hai", gloss: "mujhe = to-me · chai = tea · pasand = liked · hai = is", topic: "food", template: false },
    { id: 20, english: "I like water", hindi: "mujhe paani pasand hai", gloss: "mujhe = to-me · paani = water · pasand = liked · hai = is", topic: "food", template: false },
    { id: 21, english: "I like mangoes", hindi: "mujhe aam pasand hai", gloss: "mujhe = to-me · aam = mango · pasand = liked · hai = is", topic: "food", template: false },
    {
        id: 22, english: "I like ___", hindi: "mujhe ___ pasand hai", gloss: "mujhe = to-me · ___ · pasand = liked · hai = is", topic: "food", template: true,
        variants: ["chai", "paani", "aam", "chawal", "roti"]
    },
    { id: 23, english: "I am hungry", hindi: "mujhe bhookh lagi hai", gloss: "mujhe = to-me · bhookh = hunger · lagi = struck · hai = is", topic: "food", template: false },
    { id: 24, english: "I am thirsty", hindi: "mujhe pyaas lagi hai", gloss: "mujhe = to-me · pyaas = thirst · lagi = struck · hai = is", topic: "food", template: false },
    { id: 25, english: "The food is good", hindi: "khaana accha hai", gloss: "khaana = food · accha = good · hai = is", topic: "food", template: false },
    { id: 26, english: "I want to eat", hindi: "mujhe khaana khaana hai", gloss: "mujhe = to-me · khaana = food · khaana = to-eat · hai = is", topic: "food", template: false },
    { id: 27, english: "The tea is hot", hindi: "chai garam hai", gloss: "chai = tea · garam = hot · hai = is", topic: "food", template: false },
    { id: 28, english: "Give me water, please", hindi: "mujhe paani dijiye", gloss: "mujhe = to-me · paani = water · dijiye = please-give", topic: "food", template: false },

    // ── Questions ─────────────────────────────────────────────
    { id: 29, english: "What is this?", hindi: "yeh kya hai", gloss: "yeh = this · kya = what · hai = is", topic: "questions", template: false },
    { id: 30, english: "Where is this?", hindi: "yeh kahan hai", gloss: "yeh = this · kahan = where · hai = is", topic: "questions", template: false },
    { id: 31, english: "How much does this cost?", hindi: "yeh kitne ka hai", gloss: "yeh = this · kitne = how-much · ka = of · hai = is", topic: "questions", template: false },
    { id: 32, english: "What time is it?", hindi: "kitne baje hain", gloss: "kitne = how-many · baje = o'clock · hain = are", topic: "questions", template: false },
    { id: 33, english: "Where are you going?", hindi: "aap kahan ja rahe hain", gloss: "aap = you · kahan = where · ja = go · rahe = -ing · hain = are", topic: "questions", template: false },
    { id: 34, english: "Why?", hindi: "kyun", gloss: "kyun = why", topic: "questions", template: false },
    { id: 35, english: "How?", hindi: "kaise", gloss: "kaise = how", topic: "questions", template: false },
    { id: 36, english: "Who is this?", hindi: "yeh kaun hai", gloss: "yeh = this · kaun = who · hai = is", topic: "questions", template: false },
    { id: 37, english: "When?", hindi: "kab", gloss: "kab = when", topic: "questions", template: false },

    // ── Daily Actions ─────────────────────────────────────────
    { id: 38, english: "I am going home", hindi: "main ghar ja raha hoon", gloss: "main = I · ghar = home · ja = go · raha = -ing · hoon = am", topic: "daily", template: false },
    { id: 39, english: "I am coming", hindi: "main aa raha hoon", gloss: "main = I · aa = come · raha = -ing · hoon = am", topic: "daily", template: false },
    { id: 40, english: "Wait a moment", hindi: "ek minute ruko", gloss: "ek = one · minute = minute · ruko = wait", topic: "daily", template: false },
    { id: 41, english: "Let's go", hindi: "chalo chalte hain", gloss: "chalo = let's-go · chalte = going · hain = are", topic: "daily", template: false },
    { id: 42, english: "I need help", hindi: "mujhe madad chahiye", gloss: "mujhe = to-me · madad = help · chahiye = is-needed", topic: "daily", template: false },
    { id: 43, english: "That's okay", hindi: "theek hai", gloss: "theek = okay · hai = is", topic: "daily", template: false },
    { id: 44, english: "Very good", hindi: "bahut accha", gloss: "bahut = very · accha = good", topic: "daily", template: false },
    { id: 45, english: "Yes", hindi: "haan", gloss: "haan = yes", topic: "daily", template: false },
    { id: 46, english: "No", hindi: "nahi", gloss: "nahi = no", topic: "daily", template: false },
    { id: 47, english: "Maybe", hindi: "shayad", gloss: "shayad = maybe", topic: "daily", template: false },
    { id: 48, english: "Today", hindi: "aaj", gloss: "aaj = today", topic: "daily", template: false },
    { id: 49, english: "Tomorrow", hindi: "kal", gloss: "kal = tomorrow", topic: "daily", template: false },

    // ── Repair / Clarification ────────────────────────────────
    { id: 50, english: "I don't understand", hindi: "mujhe samajh nahi aaya", gloss: "mujhe = to-me · samajh = understanding · nahi = not · aaya = came", topic: "repair", template: false },
    { id: 51, english: "Please speak slowly", hindi: "please dhire boliye", gloss: "please · dhire = slowly · boliye = please-speak", topic: "repair", template: false },
    { id: 52, english: "Please repeat that", hindi: "phir se boliye", gloss: "phir = again · se = from · boliye = please-speak", topic: "repair", template: false },
    { id: 53, english: "What did you say?", hindi: "aapne kya kaha", gloss: "aapne = you(did) · kya = what · kaha = said", topic: "repair", template: false },
    { id: 54, english: "I don't know", hindi: "mujhe nahi pata", gloss: "mujhe = to-me · nahi = not · pata = known", topic: "repair", template: false },
    { id: 55, english: "Can you help me?", hindi: "kya aap meri madad kar sakte hain", gloss: "kya = (question) · aap = you · meri = my · madad = help · kar = do · sakte = can · hain = are", topic: "repair", template: false },
    { id: 56, english: "Say it again", hindi: "dobara boliye", gloss: "dobara = again · boliye = please-speak", topic: "repair", template: false },
];
