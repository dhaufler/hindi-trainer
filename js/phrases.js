// Seed phrase data — transliteration only, no Devanagari
// template: true phrases use ___ as a slot placeholder
const SEED_PHRASES = [
    // ── Greetings ────────────────────────────────────────────
    { id: 1, english: "Hello", hindi: "namaste", topic: "greetings", template: false },
    { id: 2, english: "How are you?", hindi: "aap kaise hain", topic: "greetings", template: false },
    { id: 3, english: "I am fine", hindi: "main theek hoon", topic: "greetings", template: false },
    { id: 4, english: "And you?", hindi: "aur aap", topic: "greetings", template: false },
    { id: 5, english: "Good morning", hindi: "suprabhat", topic: "greetings", template: false },
    { id: 6, english: "Good night", hindi: "shubh ratri", topic: "greetings", template: false },
    { id: 7, english: "See you later", hindi: "phir milenge", topic: "greetings", template: false },
    { id: 8, english: "Thank you", hindi: "shukriya", topic: "greetings", template: false },
    { id: 9, english: "You're welcome", hindi: "koi baat nahi", topic: "greetings", template: false },
    { id: 10, english: "Goodbye", hindi: "alvida", topic: "greetings", template: false },

    // ── Identity ─────────────────────────────────────────────
    { id: 11, english: "What is your name?", hindi: "aapka naam kya hai", topic: "identity", template: false },
    {
        id: 12, english: "My name is ___", hindi: "mera naam ___ hai", topic: "identity", template: true,
        variants: ["ravi", "sara", "amir"]
    },
    { id: 13, english: "Where are you from?", hindi: "aap kahan se hain", topic: "identity", template: false },
    { id: 14, english: "I am from America", hindi: "main america se hoon", topic: "identity", template: false },
    { id: 15, english: "I am learning Hindi", hindi: "main hindi seekh raha hoon", topic: "identity", template: false },
    { id: 16, english: "I am a student", hindi: "main ek chhatra hoon", topic: "identity", template: false },
    { id: 17, english: "I am happy", hindi: "main khush hoon", topic: "identity", template: false },
    { id: 18, english: "I am tired", hindi: "main thaka hoon", topic: "identity", template: false },

    // ── Food & Drink ──────────────────────────────────────────
    { id: 19, english: "I like tea", hindi: "mujhe chai pasand hai", topic: "food", template: false },
    { id: 20, english: "I like water", hindi: "mujhe paani pasand hai", topic: "food", template: false },
    { id: 21, english: "I like mangoes", hindi: "mujhe aam pasand hai", topic: "food", template: false },
    {
        id: 22, english: "I like ___", hindi: "mujhe ___ pasand hai", topic: "food", template: true,
        variants: ["chai", "paani", "aam", "chawal", "roti"]
    },
    { id: 23, english: "I am hungry", hindi: "mujhe bhookh lagi hai", topic: "food", template: false },
    { id: 24, english: "I am thirsty", hindi: "mujhe pyaas lagi hai", topic: "food", template: false },
    { id: 25, english: "The food is good", hindi: "khaana accha hai", topic: "food", template: false },
    { id: 26, english: "I want to eat", hindi: "mujhe khaana khaana hai", topic: "food", template: false },
    { id: 27, english: "The tea is hot", hindi: "chai garam hai", topic: "food", template: false },
    { id: 28, english: "Give me water, please", hindi: "mujhe paani dijiye", topic: "food", template: false },

    // ── Questions ─────────────────────────────────────────────
    { id: 29, english: "What is this?", hindi: "yeh kya hai", topic: "questions", template: false },
    { id: 30, english: "Where is this?", hindi: "yeh kahan hai", topic: "questions", template: false },
    { id: 31, english: "How much does this cost?", hindi: "yeh kitne ka hai", topic: "questions", template: false },
    { id: 32, english: "What time is it?", hindi: "kitne baje hain", topic: "questions", template: false },
    { id: 33, english: "Where are you going?", hindi: "aap kahan ja rahe hain", topic: "questions", template: false },
    { id: 34, english: "Why?", hindi: "kyun", topic: "questions", template: false },
    { id: 35, english: "How?", hindi: "kaise", topic: "questions", template: false },
    { id: 36, english: "Who is this?", hindi: "yeh kaun hai", topic: "questions", template: false },
    { id: 37, english: "When?", hindi: "kab", topic: "questions", template: false },

    // ── Daily Actions ─────────────────────────────────────────
    { id: 38, english: "I am going home", hindi: "main ghar ja raha hoon", topic: "daily", template: false },
    { id: 39, english: "I am coming", hindi: "main aa raha hoon", topic: "daily", template: false },
    { id: 40, english: "Wait a moment", hindi: "ek minute ruko", topic: "daily", template: false },
    { id: 41, english: "Let's go", hindi: "chalo chalte hain", topic: "daily", template: false },
    { id: 42, english: "I need help", hindi: "mujhe madad chahiye", topic: "daily", template: false },
    { id: 43, english: "That's okay", hindi: "theek hai", topic: "daily", template: false },
    { id: 44, english: "Very good", hindi: "bahut accha", topic: "daily", template: false },
    { id: 45, english: "Yes", hindi: "haan", topic: "daily", template: false },
    { id: 46, english: "No", hindi: "nahi", topic: "daily", template: false },
    { id: 47, english: "Maybe", hindi: "shayad", topic: "daily", template: false },
    { id: 48, english: "Today", hindi: "aaj", topic: "daily", template: false },
    { id: 49, english: "Tomorrow", hindi: "kal", topic: "daily", template: false },

    // ── Repair / Clarification ────────────────────────────────
    { id: 50, english: "I don't understand", hindi: "mujhe samajh nahi aaya", topic: "repair", template: false },
    { id: 51, english: "Please speak slowly", hindi: "please dhire boliye", topic: "repair", template: false },
    { id: 52, english: "Please repeat that", hindi: "phir se boliye", topic: "repair", template: false },
    { id: 53, english: "What did you say?", hindi: "aapne kya kaha", topic: "repair", template: false },
    { id: 54, english: "I don't know", hindi: "mujhe nahi pata", topic: "repair", template: false },
    { id: 55, english: "Can you help me?", hindi: "kya aap meri madad kar sakte hain", topic: "repair", template: false },
    { id: 56, english: "Say it again", hindi: "dobara boliye", topic: "repair", template: false },
];
