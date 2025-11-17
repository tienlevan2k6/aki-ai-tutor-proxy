<script type='module'>
//<![CDATA[
/*
import { GoogleGenerativeAI } from "@google/generative-ai"; // Không cần import này nữa!

// --- THAY ĐỔI LỚN: KHÔNG CẦN API KEY TỪ CLIENT ---
// let apiKey = localStorage.getItem('gemini_api_key_v2_promax'); // Bỏ
let targetLang = localStorage.getItem('target_language') || 'English';
let starPoints = parseInt(localStorage.getItem('star_points') || '0');
// const MODEL_NAME = "gemini-2.5-flash-lite"; // Bỏ, backend sẽ quản lý

// --- MỚI: ĐỊA CHỈ PROXY CỦA BẠN ---
// !!! THAY THẾ URL NÀY BẰNG URL VERCEL CỦA BẠN !!!
const PROXY_URL = 'https://YOUR_VERCEL_APP_URL.vercel.app/api/proxy';

// Biến cho các tính năng khác
let currentPlaybackRate = 1.0;
let currentDisplayedCardData = null;
const storeScenarios = [
    { id: 'job_interview_pro', title: 'Phỏng vấn (Nâng cao)', desc: 'Đàm phán lương, hỏi về văn hóa công ty.', cost: 50, icon: 'briefcase' },
    { id: 'debate_topic', title: 'Tranh luận', desc: 'Tranh luận về một chủ đề xã hội (ví dụ: AI).', cost: 75, icon: 'messages-square' },
    { id: 'restaurant_order_complex', title: 'Nhà hàng (Phức tạp)', desc: 'Phàn nàn về món ăn, gọi món đặc biệt.', cost: 50, icon: 'utensils' }
];

// --- Point System Functions (Giữ nguyên) ---
function updateStarDisplay() {
    document.getElementById('star-count').textContent = starPoints;
    document.getElementById('star-count-mobile').textContent = starPoints;
}
window.addStars = (points) => {
    starPoints += points;
    localStorage.setItem('star_points', starPoints);
    updateStarDisplay();
};

// --- Logic Cửa hàng (Giữ nguyên) ---
function getUnlockedScenarios() {
    try {
        const defaults = ['default', 'job_interview', 'coffee_shop', 'airport_immigration'];
        const saved = JSON.parse(localStorage.getItem('unlocked_scenarios')) || [];
        return [...new Set([...defaults, ...saved])];
    } catch(e) {
        return ['default', 'job_interview', 'coffee_shop', 'airport_immigration'];
    }
}
window.buyScenario = (scenarioId, cost) => {
    if (starPoints < cost) {
        alert('Không đủ sao! Bạn cần ' + cost + ' sao để mở khóa.');
        return;
    }
    let unlocked = getUnlockedScenarios();
    if (unlocked.includes(scenarioId)) {
        alert('Bạn đã mở khóa kịch bản này rồi!');
        return;
    }
    if (confirm(`Bạn có chắc muốn dùng ${cost} ⭐ để mở khóa kịch bản này?`)) {
        addStars(-cost);
        unlocked.push(scenarioId);
        localStorage.setItem('unlocked_scenarios', JSON.stringify(unlocked));
        alert('Mở khóa thành công!');
        loadStore();
    }
};

// --- Logic Ôn tập (Giữ nguyên) ---
const srsStages = [0, 1, 3, 7, 14, 30, 60];
function getReviewDeck() {
    try { return JSON.parse(localStorage.getItem(`review_deck_${targetLang}`)) || []; } catch(e) { return []; }
}
function saveReviewDeck(deck) {
    localStorage.setItem(`review_deck_${targetLang}`, JSON.stringify(deck));
}
window.addVocabToReview = () => {
    if (!currentDisplayedCardData) {
        alert("Đã xảy ra lỗi. Vui lòng thử lại.");
        return;
    }
    let deck = getReviewDeck();
    if (deck.find(item => item.word.toLowerCase() === currentDisplayedCardData.word.toLowerCase())) {
        alert('Từ này đã có trong bộ ôn tập của bạn.');
        return;
    }
    const newItem = {
        ...currentDisplayedCardData,
        stage: 0,
        nextReviewDate: new Date().toISOString().split('T')[0]
    };
    deck.push(newItem);
    saveReviewDeck(deck);
    alert('Đã thêm "' + newItem.word + '" vào bộ ôn tập!');
};

// --- CẬP NHẬT: Hàm Cài đặt ---
window.saveSettings = (e) => {
    e.preventDefault();
    // const keyInput = document.getElementById('api-key-input').value.trim(); // Bỏ
    const langSelect = document.getElementById('language-select').value;
    // if (keyInput && langSelect) { // Bỏ
    if (langSelect) { // Chỉ cần chọn ngôn ngữ
        // localStorage.setItem('gemini_api_key_v2_promax', keyInput); // Bỏ
        localStorage.setItem('target_language', langSelect);
        // apiKey = keyInput; // Bỏ
        targetLang = langSelect;
        initApp();
    }
};

window.openSettings = () => {
    // document.getElementById('api-key-input').value = apiKey || ''; // Bỏ
    document.getElementById('language-select').value = targetLang;
    document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
};

// --- CẬP NHẬT: Hàm initApp ---
function initApp() {
    // KHÔNG CẦN KIỂM TRA API KEY NỮA
    // if (!apiKey) {
    //     openSettings();
    // } else {
    try {
        // genAI = new GoogleGenerativeAI(apiKey); // Bỏ
        // model = genAI.getGenerativeModel({ model: MODEL_NAME }); // Bỏ
        document.getElementById('settings-modal').classList.add('hidden'); // Vẫn ẩn modal
        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('app-title-lang').textContent = `${targetLang} Tutor`;
        updateStarDisplay();
        renderNav();
        if (!activeTab) switchTab('planner'); else switchTab(activeTab);
    } catch (e) {
        alert("Lỗi khởi tạo ứng dụng: " + e.message);
        // openSettings(); // Không cần mở cài đặt nếu lỗi
    }
    // }
}

// --- CẬP NHẬT HOÀN TOÀN: GeminiService ---
const GeminiService = {
    // Hàm trung gian mới để gọi proxy
    async _fetchProxy(type, payload) {
        try {
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, payload })
            });
            if (!response.ok) {
                const err = await response.json();
                console.error("Proxy Error:", err);
                throw new Error(`Lỗi từ máy chủ: ${err.error || response.statusText}`);
            }
            const data = await response.json();
            
            // Xử lý chat (trả về text)
            if (data.text_response) return data.text_response;
            
            // Xử lý generate (trả về JSON)
            return data;
        } catch (error) {
            console.error("Fetch Error:", error);
            return null; // Trả về null nếu có lỗi mạng hoặc proxy
        }
    },

    // Hàm generate bây giờ gọi _fetchProxy
    async generate(prompt) {
        return this._fetchProxy('generate', { prompt });
    },

    // Tất cả các hàm generate... bên dưới KHÔNG CẦN THAY ĐỔI
    // vì chúng đều gọi this.generate() đã được cập nhật
    generatePlanner(goal, level, duration) {
        return this.generate(`Create a ${targetLang} study plan. User goal: "${goal}", Level: "${level}", Duration: "${duration}". Provide a concise, actionable plan. RESPONSE RAW JSON ONLY: { "title": "Vietnamese Plan Title (e.g., 'Lộ trình ${duration} học ${targetLang}')", "plan_html": "HTML string for the plan (use <ul>, <li>, <strong>, <p>, and <h3> for daily/weekly sections). Make it clear and structured." }`);
    },
    generateFlashcard(kw) { return this.generate(`Generate vocabulary flashcard for: "${kw}" in ${targetLang}. If input is Vietnamese, find ${targetLang} equivalent. If input is ${targetLang}, use directly. RESPONSE RAW JSON ONLY: { "word": "${targetLang} word", "type": "noun/verb...", "ipa": "/IPA/ or romanization", "meaning": "Vietnamese meaning", "example": "Short ${targetLang} example sentence.", "example_vi": "Vietnamese translation of example." }`); },
    explainGrammar(topic) { return this.generate(`Explain ${targetLang} grammar: "${topic}" in Vietnamese. Clear, concise, tutor style. RESPONSE RAW JSON ONLY: { "title": "Topic Title VN", "content": "HTML string (use <b>, <ul>, <li>, <p> for formatting, NO markdown)" }`); },
    generateListening(topic) { return this.generate(`Create short ${targetLang} listening script about "${topic}". 1. Dialogue (4-6 lines, A & B). 2. One multiple-choice question in ${targetLang}. RESPONSE RAW JSON ONLY: { "dialogue": [ {"speaker": "A", "text": "line 1 in ${targetLang}"}, {"speaker": "B", "text": "line 2 in ${targetLang}"} ], "question": "Question in ${targetLang}?", "options": ["Option A (${targetLang})", "Option B", "Option C", "Option D"], "correctIndex": 0 }`); },
    generateReading(topic = 'daily life') {
        return this.generate(`Create a short reading comprehension passage (A2-B1 level) in ${targetLang} about "${topic}". Provide: 1. The passage (3-5 sentences). 2. Three multiple-choice questions in ${targetLang}. 3. Vietnamese translation of the passage. 4. Vietnamese translation of the questions and options. RESPONSE RAW JSON ONLY: { "passage": "Passage text in ${targetLang}", "questions": [ {"q": "Question 1 in ${targetLang}", "options": ["A", "B", "C"], "correct": 0, "q_vi": "Question 1 in VN", "options_vi": ["A_vi", "B_vi", "C_vi"] } ], "passage_vi": "Passage text in VN" }`);
    },
    generateQuiz(topic = '') {
        const topicPrompt = topic ? ` related to the topic "${topic}"` : '';
        return this.generate(`Create ONE random ${targetLang} quiz question (A2-B1 level, vocab/grammar/idiom)${topicPrompt}. RESPONSE RAW JSON ONLY: { "q": "Question text in ${targetLang}", "options": ["A", "B", "C", "D" (all in ${targetLang})], "correct": 0, "explain": "Explanation in Vietnamese." }`);
    },
    evaluateSpeaking(text, topic) { return this.generate(`Act as a ${targetLang} tutor. User was asked about "${topic}" and said: "${text}" (in ${targetLang}). 1. Correct any mistakes. 2. Provide a better version. 3. Explain in Vietnamese. RESPONSE RAW JSON ONLY: { "original": "${text}", "corrected": "Corrected version in ${targetLang}", "better_version": "More natural/advanced version in ${targetLang}", "explanation": "Vietnamese explanation of errors & tips", "score": 8 (1-10 scale based on clarity/grammar) }`); },
    getSpeakingTopic(topic = '') {
        const topicPrompt = topic ? ` related to the topic "${topic}"` : ' about daily life, hobbies, or opinions';
        return this.generate(`Give me ONE interesting, simple question for a ${targetLang} learner to practice speaking${topicPrompt}. RESPONSE RAW JSON ONLY: { "topic": "Question in ${targetLang}", "topic_vi": "Vietnamese translation" }`);
    },
    evaluateWriting(text) { return this.generate(`Act as a ${targetLang} writing tutor. Evaluate this short text: "${text}" (in ${targetLang}). RESPONSE RAW JSON ONLY: { "corrected": "Full text with errors fixed in ${targetLang}", "score": 7, "feedback": "Vietnamese feedback explaining main errors (grammar/vocab) and how to improve. Be encouraging but honest.", "key_improvements": ["Point 1 (in Vietnamese)", "Point 2 (in Vietnamese)"] }`); },
    
    // --- CẬP NHẬT: Logic Chat ---
    async startRoleplayChat(scenario) {
        // chatSession = model.startChat(...) // Bỏ
        
        // Logic định nghĩa prompt (giữ nguyên)
        let systemPrompt = `You are 'Gem', a friendly ${targetLang} tutor. Chat naturally in ${targetLang}.`;
        let firstMessage = `(Translate this greeting to ${targetLang} for the first message: Hi there! How can I help you with ${targetLang} today?)`;

        if (scenario === 'job_interview') {
            systemPrompt = `Act as a strict but fair job interviewer for a generic office role, speaking ${targetLang}. I am the candidate. Ask me standard interview questions one by one. Correct my major mistakes gently at the end of each of your turns in [square brackets] in Vietnamese.`;
            firstMessage = `(Greeting and first question in ${targetLang} for a job interview)`;
        } else if (scenario === 'coffee_shop') {
            systemPrompt = `Act as a busy barista at a coffee shop, speaking ${targetLang}. I am the customer. Take my order. Be casual and fast. Correct major mistakes gently in [square brackets] in Vietnamese.`;
            firstMessage = `(Greeting from a barista in ${targetLang})`;
        } else if (scenario === 'airport_immigration') {
            systemPrompt = `Act as a serious airport immigration officer, speaking ${targetLang}. I am the traveler. Ask standard questions. Correct major mistakes gently in [square brackets] in Vietnamese.`;
            firstMessage = `(Immigration officer greeting and first question in ${targetLang})`;
        }
        else if (scenario === 'job_interview_pro') {
            systemPrompt = `Act as a senior hiring manager in ${targetLang}. I am the candidate. Ask me advanced questions (e.g., about salary negotiation, company culture, handling conflict). Be professional. Correct mistakes gently in [square brackets] in Vietnamese.`;
            firstMessage = `(Greeting and first advanced interview question in ${targetLang})`;
        } else if (scenario === 'debate_topic') {
            systemPrompt = `Act as a debate partner in ${targetLang}. Let's debate the topic 'The Pros and Cons of AI in daily life'. You take the 'Pro' side. I will take the 'Con' side. Start with your first argument. Correct my mistakes gently in [square brackets] in Vietnamese.`;
            firstMessage = `(Your first argument for the 'Pro' side of AI in ${targetLang})`;
        } else if (scenario === 'restaurant_order_complex') {
            systemPrompt = `Act as a waiter in a fancy restaurant, speaking ${targetLang}. I am the customer. I will have a complex order, and possibly a complaint. Be very polite. Correct my mistakes gently in [squareM brackets] in Vietnamese.`;
            firstMessage = `(Polite greeting from a waiter in ${targetLang})`;
        }
        
        // Gọi this.generate (đã trỏ tới proxy) để lấy tin nhắn đầu tiên
        const initRes = await this.generate(`Generate a starting message for this roleplay scenario in ${targetLang}: "${systemPrompt}". The user wants this first message: "${firstMessage}". RESPONSE RAW JSON ONLY: {"message": "string"}`);
        firstMessage = initRes?.message || `Hello! Let's practice ${targetLang}.`;

        // --- MỚI: Khởi tạo lịch sử chat ở phía CLIENT ---
        window.clientChatHistory = [
            { role: "user", parts: [{ text: `SYSTEM INSTRUCTION: ${systemPrompt} Start the roleplay now.` }] },
            { role: "model", parts: [{ text: firstMessage }] }
        ];
        return firstMessage;
    },
    async chat(message) {
        // if (!chatSession) await this.startRoleplayChat('default'); // Bỏ
        if (!window.clientChatHistory) await this.startRoleplayChat('default');
        
        // Thêm tin nhắn của người dùng vào lịch sử client
        window.clientChatHistory.push({ role: "user", parts: [{ text: message }] });
        
        try {
            // const result = await chatSession.sendMessage(message); // Bỏ
            // Gọi proxy với type 'chat' và gửi kèm lịch sử
            const responseText = await this._fetchProxy('chat', {
                history: window.clientChatHistory,
                message: message
            });

            if (!responseText) throw new Error("No response from proxy");

            // Thêm tin nhắn của AI vào lịch sử client
            window.clientChatHistory.push({ role: "model", parts: [{ text: responseText }] });
            
            return responseText; // return result.response.text();
        } catch (e) { 
            console.error("Chat Error:", e); 
            // Xóa tin nhắn cuối của user nếu lỗi, để họ thử gửi lại
            window.clientChatHistory.pop();
            return "Xin lỗi, đã xảy ra lỗi kết nối. Vui lòng thử gửi lại."; 
        }
    }
};

// --- Các hàm UI (showLoading, setBtnLoading, v.v...) (Giữ nguyên) ---
const mainContent = document.getElementById('main-content');
let activeTab = 'planner';
let recognition;

function showLoading(el, isOverlay = false, text = 'Đang xử lý với AI...') {
    const html = `<div class="flex h-full flex-col justify-center items-center space-y-4"><div class="flex space-x-3"><div class="w-4 h-4 bg-purple-600 rounded-full loading-dot"></div><div class="w-4 h-4 bg-fuchsia-600 rounded-full loading-dot"></div><div class="w-4 h-4 bg-pink-600 rounded-full loading-dot"></div></div><p class="text-slate-500 text-sm font-medium animate-pulse loading-text">${text}</p></div>`;
    if (isOverlay) {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10';
        overlay.innerHTML = html;
        el.appendChild(overlay);
    } else { el.innerHTML = html; }
}
function hideLoading(el) { const overlay = el.querySelector('#loading-overlay'); if (overlay) overlay.remove(); }
function setBtnLoading(btn, isLoading) {
    if (isLoading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<svg class="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText;
    }
}

window.setSpeed = (rate, btn) => {
    currentPlaybackRate = rate;
    document.querySelectorAll('.speed-btn').forEach(b => {
        b.classList.remove('bg-purple-600', 'text-white');
        b.classList.add('bg-slate-200', 'text-slate-700');
    });
    btn.classList.add('bg-purple-600', 'text-white');
    btn.classList.remove('bg-slate-200', 'text-slate-700');
}

window.speak = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    const langMap = { 'English': 'en-US', 'Japanese': 'ja-JP', 'Korean': 'ko-KR', 'Chinese': 'zh-CN', 'French': 'fr-FR', 'German': 'de-DE', 'Spanish': 'es-ES' };
    u.lang = langMap[targetLang] || 'en-US';
    u.rate = currentPlaybackRate;
    window.speechSynthesis.speak(u);
};

// --- Vocab History Functions (Giữ nguyên) ---
function getVocabHistory() {
    try { return JSON.parse(localStorage.getItem(`vocab_history_${targetLang}`)) || []; } catch(e) { return []; }
}
function saveVocabToHistory(wordData) {
    let history = getVocabHistory();
    history = history.filter(item => item.word.toLowerCase() !== wordData.word.toLowerCase());
    history.unshift(wordData);
    if (history.length > 30) history.pop();
    localStorage.setItem(`vocab_history_${targetLang}`, JSON.stringify(history));
    renderVocabHistory();
}
function clearVocabHistory() {
    if(confirm("Bạn chắc chắn muốn xóa lịch sử tra từ?")) {
        localStorage.removeItem(`vocab_history_${targetLang}`);
        renderVocabHistory();
    }
}
function renderVocabHistory() {
    const historyEl = document.getElementById('vocab-history-list');
    if (!historyEl) return;
    const history = getVocabHistory();
    if (history.length === 0) {
        historyEl.innerHTML = '<p class="text-slate-400 text-sm text-center italic col-span-full py-4">Chưa có từ vựng nào trong lịch sử.</p>';
        return;
    }
    historyEl.innerHTML = history.map((item, index) => `
        <button onclick="showFlashcardFromHistory(${index})" class="p-3 bg-white border border-slate-200 rounded-xl hover:border-purple-400 hover:shadow-sm transition-all text-left group relative">
            <div class="font-bold text-slate-700 group-hover:text-purple-700 truncate">${item.word}</div>
            <div class="text-xs text-slate-500 truncate">${item.meaning}</div>
        </button>
    `).join('');
}
window.showFlashcardFromHistory = (index) => {
      const history = getVocabHistory();
      const data = history[index];
      if (data) renderFlashcard(data);
};
function renderFlashcard(data) {
      currentDisplayedCardData = data; 
      document.getElementById('card-display').innerHTML = `<div class="relative w-full h-80 cursor-pointer card-inner group" onclick="this.classList.toggle('flipped')">
        <div class="card-front absolute inset-0 bg-white rounded-[2rem] shadow-xl p-6 flex flex-col items-center border border-slate-100">
            <span class="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 uppercase">${data.type}</span>
            <div class="flex-grow flex flex-col justify-center items-center">
                <h3 class="text-4xl md:text-5xl font-black text-slate-800 mb-2 text-center break-words max-w-full">${data.word}</h3>
                <span class="text-lg text-slate-500 font-mono bg-slate-50 px-3 py-1 rounded-lg">${data.ipa}</span>
            </div>
            <button onclick="event.stopPropagation(); addVocabToReview()" class="absolute bottom-6 left-6 p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100" title="Thêm vào bộ ôn tập">
                <i data-lucide="plus-circle" class="w-5 h-5"></i>
            </button>
            <button onclick="event.stopPropagation(); speak('${data.word.replace(/'/g, "\\'")}')" class="absolute bottom-6 right-6 p-3 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100" title="Phát âm">
                <i data-lucide="volume-2" class="w-5 h-5"></i>
            </button>
        </div>
        <div class="card-back absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-500 text-white rounded-[2rem] shadow-xl p-8 flex flex-col justify-center items-center text-center">
            <h3 class="text-2xl md:text-3xl font-bold mb-6 break-words max-w-full">${data.meaning}</h3>
            <p class="text-lg font-medium text-purple-50 mb-2">"${data.example}"</p>
            <p class="text-purple-200 italic">(${data.example_vi})</p>
        </div>
      </div>`;
      lucide.createIcons();
}

// --- Các hàm Load Tab (loadPlanner, loadVocab, loadReview, v.v...) (Giữ nguyên) ---
// (Không dán lại ở đây cho ngắn gọn, nhưng code của chúng giữ nguyên)
// ... (Toàn bộ các hàm `async function loadPlanner()`, `async function loadVocab()`, `async function loadReview()`, 
// `function startReviewSession()`, `window.handleReview = ...`, `async function loadGrammar()`, 
// `async function loadListening()`, `async function loadReading()`, `async function loadQuiz()`, 
// `async function loadSpeaking()`, `async function loadWriting()`, `async function loadChat()`, 
// `async function loadStore()` GIỮ NGUYÊN NHƯ PHIÊN BẢN TRƯỚC) ...

// --- TÔI SẼ DÁN LẠI TOÀN BỘ CÁC HÀM LOAD TAB ĐỂ ĐẢM BẢO TÍNH ĐẦY ĐỦ ---

async function loadPlanner() {
    mainContent.innerHTML = `<div class="flex flex-col h-full">
        <h2 class="text-2xl font-black text-slate-800 mb-6">Lộ Trình Học (${targetLang})</h2>
        <form id="planner-form" class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-6 space-y-4 shrink-0">
            <div class="grid md:grid-cols-2 gap-4">
                <input type="text" id="planner-goal" placeholder="Mục tiêu (ví dụ: 'Du lịch Nhật Bản')" class="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-purple-500 outline-none font-medium" required>
                <input type="text" id="planner-level" placeholder="Trình độ hiện tại (ví dụ: 'Mới bắt đầu')" class="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-purple-500 outline-none font-medium" required>
            </div>
            <input type="text" id="planner-duration" placeholder="Thời gian học (ví dụ: '2 tuần')" class="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-purple-500 outline-none font-medium" required>
            <button type="submit" class="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-purple-200">
                <i data-lucide="send" class="w-5 h-5"></i> Tạo Lộ Trình
            </button>
        </form>
        <div id="planner-result" class="flex-grow bg-white rounded-3xl border border-slate-100 p-6 overflow-y-auto custom-scrollbar shadow-sm relative">
            <div class="h-full flex items-center justify-center text-slate-400">Nhập thông tin mục tiêu của bạn để AI tạo lộ trình học.</div>
        </div>
    </div>`;
    lucide.createIcons();

    document.getElementById('planner-form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const goal = document.getElementById('planner-goal').value;
        const level = document.getElementById('planner-level').value;
        const duration = document.getElementById('planner-duration').value;
        
        setBtnLoading(btn, true);
        const resultArea = document.getElementById('planner-result');
        showLoading(resultArea, true, 'AI đang vạch lộ trình...');
        
        const data = await GeminiService.generatePlanner(goal, level, duration);
        setBtnLoading(btn, false);
        hideLoading(resultArea);
        
        if (data) {
            resultArea.innerHTML = `
                <h3 class="text-2xl font-bold text-purple-700 mb-6 sticky top-0 bg-white py-2">${data.title}</h3>
                <div class="space-y-4 text-slate-700 leading-relaxed">${data.plan_html}</div>
            `;
            addStars(5);
        } else {
            resultArea.innerHTML = `<div class="text-red-500 font-medium text-center p-4">Hệ thống bận. Vui lòng thử lại.</div>`;
        }
    };
}

async function loadVocab() {
      mainContent.innerHTML = `<div class="flex flex-col h-full max-w-xl mx-auto w-full"><h2 class="text-2xl font-black text-slate-800 mb-6 text-center">Flashcard Generator (${targetLang})</h2><form id="vocab-form" class="relative flex items-center w-full mb-6 shrink-0"><input type="text" id="vocab-input" placeholder="Nhập từ vựng ${targetLang} hoặc tiếng Việt..." class="w-full p-4 pr-16 border-2 border-slate-200 rounded-2xl focus:border-purple-500 outline-none font-medium" required><button type="submit" class="absolute right-3 p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"><i data-lucide="wand-2" class="w-5 h-5"></i></button></form><div id="card-display" class="shrink-0 flex items-center justify-center perspective-1000 h-[350px] mb-6"><div class="text-slate-400 border-4 border-dashed border-slate-100 rounded-[2rem] w-full h-80 flex items-center justify-center">Nhập từ để tạo thẻ</div></div><div class="flex-grow flex flex-col overflow-hidden"><div class="flex items-center justify-between mb-2 px-1"><h3 class="font-bold text-slate-700 flex items-center gap-2"><i data-lucide="history" class="w-4 h-4"></i> Lịch sử tra cứu</h3><button onclick="clearVocabHistory()" class="text-xs font-medium text-red-400 hover:text-red-600 transition-colors">Xóa tất cả</button></div><div id="vocab-history-list" class="flex-grow overflow-y-auto custom-scrollbar grid grid-cols-2 md:grid-cols-3 gap-2 p-1"></div></div></div>`;
      lucide.createIcons();
      renderVocabHistory();
      document.getElementById('vocab-form').onsubmit = async (e) => { e.preventDefault(); const btn = e.target.querySelector('button'); setBtnLoading(btn, true); 
          showLoading(document.getElementById('card-display'), false, 'AI đang tạo thẻ...');
          const data = await GeminiService.generateFlashcard(document.getElementById('vocab-input').value); setBtnLoading(btn, false);
          if(data) {
                renderFlashcard(data);
                saveVocabToHistory(data);
                addStars(1);
          }
          else document.getElementById('card-display').innerHTML = `<div class="text-red-500 p-4 bg-red-50 rounded-xl text-center">Hệ thống bận. Thử lại sau.</div>`;
      };
}

async function loadReview() {
    mainContent.innerHTML = `<div class="flex flex-col h-full">
        <h2 class="text-2xl font-black text-slate-800 mb-6">Ôn tập Từ vựng (${targetLang})</h2>
        <div id="review-area" class="flex-grow flex flex-col justify-center items-center perspective-1000">
        </div>
    </div>`;
    
    const today = new Date().toISOString().split('T')[0];
    const deck = getReviewDeck();
    const wordsToReview = deck.filter(item => item.nextReviewDate <= today);
    
    if (wordsToReview.length === 0) {
        document.getElementById('review-area').innerHTML = `<div class="text-center text-slate-500">
            <i data-lucide="check-check" class="w-16 h-16 mx-auto mb-4 text-green-500"></i>
            <h3 class="text-2xl font-bold">Hoàn thành!</h3>
            <p>Bạn đã ôn tập hết từ vựng cho hôm nay. Hãy quay lại sau nhé.</p>
        </div>`;
        lucide.createIcons();
        return;
    }
    
    window.currentReviewDeck = wordsToReview;
    window.currentReviewIndex = 0;
    startReviewSession();
}

function startReviewSession() {
    const reviewArea = document.getElementById('review-area');
    if (window.currentReviewIndex >= window.currentReviewDeck.length) {
        reviewArea.innerHTML = `<div class="text-center text-slate-500">
            <i data-lucide="party-popper" class="w-16 h-16 mx-auto mb-4 text-purple-500"></i>
            <h3 class="text-2xl font-bold">Tuyệt vời!</h3>
            <p>Bạn đã hoàn thành ${window.currentReviewDeck.length} từ vựng hôm nay.</p>
        </div>`;
        lucide.createIcons();
        return;
    }
    
    const item = window.currentReviewDeck[window.currentReviewIndex];
    reviewArea.innerHTML = `
        <p class="text-sm text-slate-500 mb-2">${window.currentReviewIndex + 1} / ${window.currentReviewDeck.length}</p>
        <div class="relative w-full max-w-xl h-80 card-inner mb-6 cursor-pointer" onclick="this.classList.toggle('flipped')">
            <div class="card-front absolute inset-0 bg-white rounded-[2rem] shadow-xl p-6 flex flex-col items-center justify-center border border-slate-100">
                <h3 class="text-4xl md:text-5xl font-black text-slate-800 mb-2 text-center break-words max-w-full">${item.word}</h3>
                <span class="text-lg text-slate-500 font-mono bg-slate-50 px-3 py-1 rounded-lg">${item.ipa}</span>
                <span class="absolute bottom-6 text-sm text-slate-400 italic">Nhấn để xem nghĩa</span>
            </div>
            <div class="card-back absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-500 text-white rounded-[2rem] shadow-xl p-8 flex flex-col justify-center items-center text-center">
                <h3 class="text-2xl md:text-3xl font-bold mb-6 break-words max-w-full">${item.meaning}</h3>
                <p class="text-lg font-medium text-purple-50 mb-2">"${item.example}"</p>
                <p class="text-purple-200 italic">(${item.example_vi})</p>
            </div>
        </div>
        <div class="flex justify-center gap-3 md:gap-4">
            <button onclick="handleReview(0)" class="px-5 py-3 md:px-8 bg-red-100 text-red-700 font-bold rounded-2xl hover:bg-red-200 transition-all text-center">
                Khó<br><span class="text-xs font-normal">(Ôn lại 1 ngày)</span>
            </button>
            <button onclick="handleReview(1)" class="px-5 py-3 md:px-8 bg-blue-100 text-blue-700 font-bold rounded-2xl hover:bg-blue-200 transition-all text-center">
                Nhớ<br><span class="text-xs font-normal">(Tốt)</span>
            </button>
            <button onclick="handleReview(2)" class="px-5 py-3 md:px-8 bg-green-100 text-green-700 font-bold rounded-2xl hover:bg-green-200 transition-all text-center">
                Dễ<br><span class="text-xs font-normal">(Thành thạo)</span>
            </button>
        </div>
    `;
}

window.handleReview = (difficulty) => {
    const item = window.currentReviewDeck[window.currentReviewIndex];
    let newStage = item.stage;
    
    if (difficulty === 0) {
        newStage = Math.max(0, newStage - 1);
    } else if (difficulty === 1) {
        newStage = Math.min(newStage + 1, srsStages.length - 1);
    } else if (difficulty === 2) {
        newStage = Math.min(newStage + 2, srsStages.length - 1);
    }
    
    const daysToAdd = srsStages[newStage];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    
    item.stage = newStage;
    item.nextReviewDate = nextDate.toISOString().split('T')[0];
    
    let mainDeck = getReviewDeck();
    const itemIndex = mainDeck.findIndex(d => d.word.toLowerCase() === item.word.toLowerCase());
    if (itemIndex > -1) {
        mainDeck[itemIndex] = item;
    }
    saveReviewDeck(mainDeck);
    
    window.currentReviewIndex++;
    startReviewSession();
};

async function loadGrammar() {
      mainContent.innerHTML = `<div class="flex flex-col h-full"><h2 class="text-2xl font-black text-slate-800 mb-6">Grammar Tutor (${targetLang})</h2><form id="grammar-form" class="flex gap-3 mb-6"><input type="text" id="grammar-input" placeholder="Hỏi về ngữ pháp ${targetLang}..." class="flex-grow p-4 border-2 border-slate-200 rounded-2xl focus:border-purple-500 outline-none font-medium" required><button type="submit" class="px-6 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-colors flex items-center gap-2">Hỏi <i data-lucide="send" class="w-4 h-4"></i></button></form><div id="grammar-result" class="flex-grow bg-white rounded-3xl border border-slate-100 p-6 overflow-y-auto custom-scrollbar shadow-sm relative"><div class="h-full flex items-center justify-center text-slate-400">Đặt câu hỏi ngữ pháp ở trên</div></div></div>`;
      lucide.createIcons();
      document.getElementById('grammar-form').onsubmit = async (e) => { e.preventDefault(); const btn = e.target.querySelector('button'); setBtnLoading(btn, true); 
          showLoading(document.getElementById('grammar-result'), true, 'AI đang soạn giải thích...');
          const data = await GeminiService.explainGrammar(document.getElementById('grammar-input').value); setBtnLoading(btn, false); hideLoading(document.getElementById('grammar-result'));
          if(data) {
              document.getElementById('grammar-result').innerHTML = `<h3 class="text-2xl font-bold text-purple-700 mb-4 sticky top-0 bg-white py-2">${data.title}</h3><div class="text-slate-700 leading-relaxed space-y-3">${data.content}</div>`;
              addStars(2);
          }
          else document.getElementById('grammar-result').innerHTML = `<div class="text-red-500 font-medium text-center p-4">Hệ thống bận.</div>`;};
}

async function loadListening() {
      mainContent.innerHTML = `<div class="flex flex-col h-full"><h2 class="text-2xl font-black text-slate-800 mb-6">Listening Practice (${targetLang})</h2><div class="flex gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar"><button onclick="startListen('Daily Life', this)" class="topic-btn px-4 py-3 bg-green-100 text-green-700 rounded-xl font-bold whitespace-nowrap hover:bg-green-200 transition-colors">Đời sống</button><button onclick="startListen('Travel', this)" class="topic-btn px-4 py-3 bg-blue-100 text-blue-700 rounded-xl font-bold whitespace-nowrap hover:bg-blue-200 transition-colors">Du lịch</button><button onclick="startListen('Work', this)" class="topic-btn px-4 py-3 bg-purple-100 text-purple-700 rounded-xl font-bold whitespace-nowrap hover:bg-purple-200 transition-colors">Công việc</button></div>
    <div class="flex items-center justify-center gap-2 mb-4" id="speed-controls">
        <span class="text-sm font-medium text-slate-600">Tốc độ nghe:</span>
        <button onclick="setSpeed(0.75, this)" class="speed-btn px-3 py-1 rounded-full text-sm font-semibold ${currentPlaybackRate === 0.75 ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'}">0.75x</button>
        <button onclick="setSpeed(1.0, this)" class="speed-btn px-3 py-1 rounded-full text-sm font-semibold ${currentPlaybackRate === 1.0 ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'}">1x</button>
        <button onclick="setSpeed(1.25, this)" class="speed-btn px-3 py-1 rounded-full text-sm font-semibold ${currentPlaybackRate === 1.25 ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'}">1.25x</button>
    </div>
    <div id="listen-area" class="flex-grow flex flex-col overflow-hidden relative"><div class="h-full flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">Chọn chủ đề để bắt đầu</div></div></div>`;

      window.startListen = async (topic, btn) => { if(btn) setBtnLoading(btn, true); 
          showLoading(document.getElementById('listen-area'), false, 'AI đang tạo bài nghe...');
          const data = await GeminiService.generateListening(topic); if(btn) setBtnLoading(btn, false); window.currentListenData = data;
          if(data) { document.getElementById('listen-area').innerHTML = `<div class="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-6"><div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">${data.dialogue.map(l => `<div class="flex ${l.speaker==='A'?'justify-start':'justify-end'}"><div class="max-w-[85%] p-3 rounded-2xl ${l.speaker==='A'?'bg-slate-100 text-slate-800 rounded-tl-sm':'bg-purple-600 text-white rounded-tr-sm'}"><div class="text-xs font-bold mb-1 opacity-70">${l.speaker}</div><div class="flex items-end gap-2"><span>${l.text}</span><button onclick="speak('${l.text.replace(/'/g,"\\'")}')" class="p-1 bg-black/10 rounded-full hover:bg-black/20 shrink-0"><i data-lucide="volume-2" class="w-4 h-4"></i></button></div></div></div>`).join('')}</div><div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><h3 class="font-bold text-lg text-slate-800 mb-4">${data.question}</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-3">${data.options.map((opt,i) => `<button onclick="checkListen(${i}, this)" class="listen-opt p-4 text-left rounded-xl border-2 border-slate-100 hover:border-purple-300 transition-all font-medium">${opt}</button>`).join('')}</div><div id="listen-feedback" class="mt-4 hidden p-4 rounded-xl font-medium"></div></div></div>`; lucide.createIcons(); }
          else { document.getElementById('listen-area').innerHTML = `<div class="h-full flex items-center justify-center text-red-500 font-medium text-center p-4">Lỗi kết nối.</div>`; } };
      window.checkListen = (idx, btn) => { const isCorrect = idx === window.currentListenData.correctIndex; document.querySelectorAll('.listen-opt').forEach(b => b.disabled = true); btn.classList.remove('border-slate-100', 'hover:border-purple-300'); btn.classList.add(isCorrect ? 'bg-green-100' : 'bg-red-100', isCorrect ? 'border-green-500' : 'border-red-500', isCorrect ? 'text-green-800' : 'text-red-800'); const fb = document.getElementById('listen-feedback'); fb.textContent = isCorrect ? "Chính xác! 🎉 (+3 ⭐)" : "Chưa đúng rồi."; fb.className = `mt-4 p-4 rounded-xl font-medium block ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`; if(isCorrect) addStars(3); }
}

async function loadReading() {
    mainContent.innerHTML = `<div class="flex flex-col h-full"><h2 class="text-2xl font-black text-slate-800 mb-6 shrink-0">Reading Practice (${targetLang})</h2><form id="reading-form" class="flex gap-3 mb-6 shrink-0"><input type="text" id="reading-topic" placeholder="Chủ đề tùy chọn (ví dụ: travel, food...)" class="flex-grow p-4 border-2 border-slate-200 rounded-2xl focus:border-purple-500 outline-none font-medium"><button type="submit" class="px-6 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-colors flex items-center gap-2">Bài đọc mới <i data-lucide="refresh-cw" class="w-4 h-4"></i></button></form><div id="reading-area" class="flex-grow overflow-y-auto custom-scrollbar pr-2 relative"><div class="h-full flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">Nhập chủ đề và nhấn nút để bắt đầu</div></div></div>`;
    lucide.createIcons();
    
    document.getElementById('reading-form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const topic = document.getElementById('reading-topic').value || 'daily life';
        setBtnLoading(btn, true);
        const readingArea = document.getElementById('reading-area');
        showLoading(readingArea, false, 'AI đang tạo bài đọc...');
        const data = await GeminiService.generateReading(topic);
        setBtnLoading(btn, false);
        
        if (data) {
            window.currentReadingData = data;
            readingArea.innerHTML = `
                <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm mb-6">
                    <h3 class="text-xl font-bold text-slate-800 mb-4">Đoạn văn</h3>
                    <p class="text-slate-700 leading-relaxed text-lg">${data.passage}</p>
                    <details class="mt-4">
                        <summary class="text-sm text-purple-600 font-medium cursor-pointer hover:underline">Xem bản dịch tiếng Việt</summary>
                        <p class="mt-2 text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg">${data.passage_vi}</p>
                    </details>
                </div>
                <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 class="text-xl font-bold text-slate-800 mb-6">Câu hỏi</h3>
                    <div id="reading-questions" class="space-y-8">
                        ${data.questions.map((q, qIndex) => `
                            <div class="reading-question" data-correct="${q.correct}">
                                <p class="font-bold text-slate-700 mb-3">${qIndex + 1}. ${q.q}</p>
                                <div class="space-y-2">
                                    ${q.options.map((opt, oIndex) => `
                                        <label class="flex items-center p-4 rounded-xl border-2 border-slate-200 has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50 transition-all cursor-pointer">
                                            <input type="radio" name="q_${qIndex}" value="${oIndex}" class="w-4 h-4 text-purple-600 focus:ring-purple-500 border-slate-300">
                                            <span class="ml-3 font-medium text-slate-700">${opt}</span>
                                        </label>
                                    `).join('')}
                                </div>
                                <details class="mt-2">
                                    <summary class="text-xs text-purple-600 font-medium cursor-pointer hover:underline">Dịch câu hỏi</summary>
                                    <div class="mt-1 text-xs text-slate-500 italic p-2 bg-slate-50 rounded-md">
                                        <p class="font-medium">${q.q_vi}</p>
                                        <ul class="list-disc list-inside ml-2">
                                            ${q.options_vi.map(ov => `<li>${ov}</li>`).join('')}
                                        </ul>
                                    </div>
                                </details>
                            </div>
                        `).join('')}
                    </div>
                    <button onclick="checkReadingAnswers(this)" class="mt-8 w-full py-3 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all">Kiểm tra kết quả</button>
                    <div id="reading-feedback" class="mt-4"></div>
                </div>
            `;
        } else {
            readingArea.innerHTML = '<div class="h-full flex items-center justify-center text-red-500 font-medium text-center p-4">Lỗi kết nối.</div>';
        }
    };

    window.checkReadingAnswers = (btn) => {
        const questions = document.querySelectorAll('.reading-question');
        let correctCount = 0;
        questions.forEach((qDiv, qIndex) => {
            const correctIndex = parseInt(qDiv.dataset.correct);
            const selectedRadio = qDiv.querySelector(`input[name="q_${qIndex}"]:checked`);
            
            qDiv.querySelectorAll('label').forEach((label, oIndex) => {
                label.classList.remove('border-slate-200', 'has-[:checked]:border-purple-500', 'has-[:checked]:bg-purple-50');
                if (oIndex === correctIndex) {
                    label.classList.add('bg-green-100', 'border-green-400');
                }
            });

            if (selectedRadio) {
                const selectedIndex = parseInt(selectedRadio.value);
                const label = selectedRadio.parentElement;
                if (selectedIndex === correctIndex) {
                    correctCount++;
                } else {
                    label.classList.remove('bg-green-100', 'border-green-400');
                    label.classList.add('bg-red-100', 'border-red-400');
                }
            }
        });

        const feedbackEl = document.getElementById('reading-feedback');
        let starsWon = correctCount * 2;
        feedbackEl.innerHTML = `<div class="p-4 rounded-xl bg-purple-100 text-purple-800 font-bold text-center text-lg">Bạn đã đúng ${correctCount} / ${questions.length} câu! (+${starsWon} ⭐)</div>`;
        addStars(starsWon);
        btn.disabled = true;
        btn.textContent = 'Đã kiểm tra';
    };
}

async function loadQuiz() {
      mainContent.innerHTML = `<div class="flex flex-col h-full"><h2 class="text-2xl font-black text-slate-800 mb-6 shrink-0">Quick Quiz (${targetLang})</h2><div id="quiz-area" class="flex-grow flex flex-col overflow-y-auto custom-scrollbar pr-2 relative"><div class="h-full flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl min-h-[300px]">Nhấn nút bên dưới để bắt đầu</div></div><div class="mt-6 shrink-0 flex flex-col gap-3"><input type="text" id="quiz-topic" placeholder="Chủ đề tùy chọn..." class="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-purple-500 outline-none font-medium text-sm"><button onclick="startQuiz(this)" class="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2">Câu hỏi mới <i data-lucide="plus-circle" class="w-5 h-5"></i></button></div></div>`;
      lucide.createIcons();
      window.startQuiz = async (btn) => { setBtnLoading(btn, true); 
          showLoading(document.getElementById('quiz-area'), false, 'AI đang tạo câu hỏi...');
          const topic = document.getElementById('quiz-topic').value; const data = await GeminiService.generateQuiz(topic); setBtnLoading(btn, false); window.currentQuizData = data;
          if(data) { document.getElementById('quiz-area').innerHTML = `<div class="flex flex-col justify-start py-2"><div class="bg-white p-6 md:p-8 rounded-[2rem] shadow-lg mb-6 border-t-8 border-purple-500 shrink-0"><h3 class="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">${data.q}</h3></div><div class="grid grid-cols-1 gap-3 mb-6 shrink-0">${data.options.map((opt,i) => `<button onclick="checkQuiz(${i}, this)" class="quiz-opt p-4 md:p-5 text-left rounded-2xl border-2 border-slate-200 hover:border-purple-400 transition-all font-medium text-base md:text-lg flex items-center"><span class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-4 font-bold text-slate-500 text-sm shrink-0">${String.fromCharCode(65+i)}</span> ${opt}</button>`).join('')}</div><div id="quiz-explain" class="hidden bg-purple-50 p-6 rounded-2xl border border-purple-100 text-purple-900 text-base md:text-lg shrink-0 mb-4"></div></div>`; }
          else { document.getElementById('quiz-area').innerHTML = `<div class="h-full flex items-center justify-center text-red-500 font-medium text-center p-4">Lỗi kết nối.</div>`; } };
      window.checkQuiz = (idx, btn) => { const isCorrect = idx === window.currentQuizData.correct; document.querySelectorAll('.quiz-opt').forEach((b,i) => { b.disabled = true; if(i===window.currentQuizData.correct) b.classList.add('bg-green-100','border-green-500','text-green-800'); else if(i===idx && !isCorrect) b.classList.add('bg-red-100','border-red-500','text-red-800'); else b.classList.add('opacity-50'); }); document.getElementById('quiz-explain').innerHTML = `<strong>Giải thích:</strong> ${window.currentQuizData.explain} ${isCorrect ? '<br><span class="text-green-700 font-bold mt-2 block">+3 ⭐ Star Points!</span>' : ''}`; document.getElementById('quiz-explain').classList.remove('hidden'); document.getElementById('quiz-area').scrollTo({ top: document.getElementById('quiz-area').scrollHeight, behavior: 'smooth' }); if(isCorrect) addStars(3); }
}

async function loadSpeaking() {
      const langMap = { 'English': 'en-US', 'Japanese': 'ja-JP', 'Korean': 'ko-KR', 'Chinese': 'zh-CN', 'French': 'fr-FR', 'German': 'de-DE', 'Spanish': 'es-ES' };
      const speechLang = langMap[targetLang] || 'en-US';
      mainContent.innerHTML = `<div class="flex flex-col h-full"><h2 class="text-2xl font-black text-slate-800 mb-6">Speaking Coach (${targetLang})</h2><div id="speak-topic-area" class="bg-orange-50 p-6 rounded-3xl border border-orange-100 mb-6 text-center relative"><div id="topic-content"><p class="text-slate-500">Nhấn nút bên dưới để nhận chủ đề</p></div></div><div id="speak-feedback-area" class="flex-grow overflow-y-auto custom-scrollbar mb-6 hidden"><div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4"><div id="user-transcript" class="p-4 bg-slate-50 rounded-xl text-slate-600 italic border-l-4 border-slate-300"></div><div id="ai-feedback-content" class="space-y-4"></div></div></div><div class="mt-auto flex flex-col gap-3"><input type="text" id="speak-topic-input" placeholder="Chủ đề tùy chọn..." class="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-orange-500 outline-none font-medium text-sm"><button id="get-topic-btn" onclick="getTopic(this)" class="w-full py-4 bg-orange-100 text-orange-700 font-bold rounded-2xl hover:bg-orange-200 transition-colors flex justify-center items-center gap-2">Lấy chủ đề mới <i data-lucide="lightbulb" class="w-5 h-5"></i></button><button id="record-btn" class="w-full py-6 bg-slate-200 text-slate-400 font-bold rounded-2xl flex justify-center items-center gap-3 text-xl transition-all" disabled>Nhận chủ đề trước <i data-lucide="mic-off" class="w-6 h-6"></i></button></div></div>`;
      lucide.createIcons(); window.currentTopic = "";
      window.getTopic = async (btn) => { setBtnLoading(btn, true); const topic = document.getElementById('speak-topic-input').value; const data = await GeminiService.getSpeakingTopic(topic); setBtnLoading(btn, false);
          if (data) { window.currentTopic = data.topic; document.getElementById('topic-content').innerHTML = `<h3 class="text-xl md:text-2xl font-bold text-orange-800 mb-2">${data.topic}</h3><p class="text-orange-600">${data.topic_vi}</p>`;
                const recBtn = document.getElementById('record-btn'); recBtn.disabled = false; recBtn.className = "w-full py-6 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-all flex justify-center items-center gap-3 text-xl shadow-lg shadow-purple-200"; recBtn.innerHTML = 'Nhấn để trả lời <i data-lucide="mic" class="w-6 h-6"></i>'; lucide.createIcons(); setupRecording(); } };
      function setupRecording() { const recBtn = document.getElementById('record-btn'); if (!('webkitSpeechRecognition' in window)) { alert("Trình duyệt không hỗ trợ ghi âm."); return; }
          recognition = new webkitSpeechRecognition(); recognition.lang = speechLang; recognition.interimResults = false; recognition.maxAlternatives = 1;
          recognition.onstart = () => { recBtn.innerHTML = 'Đang nghe... (Nhấn để dừng) <div class="w-4 h-4 bg-white rounded-full animate-ping"></div>'; recBtn.classList.add('bg-red-500', 'mic-active'); recBtn.classList.remove('bg-purple-600'); };
          recognition.onend = () => { if (!window.isAnalyzing) resetRecBtn(); };
          recognition.onresult = async (event) => { const transcript = event.results[0][0].transcript; window.isAnalyzing = true; recBtn.disabled = true; recBtn.innerHTML = 'Đang phân tích... <i data-lucide="loader-2" class="animate-spin w-6 h-6"></i>'; recBtn.classList.remove('bg-red-500', 'mic-active'); recBtn.classList.add('bg-slate-800', 'text-slate-300'); lucide.createIcons();
                const feedbackArea = document.getElementById('speak-feedback-area'); feedbackArea.classList.remove('hidden'); document.getElementById('user-transcript').textContent = `"${transcript}"`; 
                showLoading(document.getElementById('ai-feedback-content'), false, 'AI đang chấm điểm nói...');
                const data = await GeminiService.evaluateSpeaking(transcript, window.currentTopic); window.isAnalyzing = false; resetRecBtn();
                if(data) { let scoreColor = data.score >= 8 ? 'text-green-600' : (data.score >= 5 ? 'text-orange-500' : 'text-red-500'); document.getElementById('ai-feedback-content').innerHTML = `<div class="flex items-center justify-between mb-4"><div class="flex items-center gap-3"><span class="font-bold text-slate-700">Đánh giá:</span><span class="text-2xl font-black ${scoreColor}">${data.score}/10</span></div><div class="text-yellow-500 font-bold flex items-center gap-1">+5 <i data-lucide="star" class="w-4 h-4 fill-current"></i></div></div><div class="space-y-3"><div class="p-4 bg-green-50 rounded-xl border border-green-100"><h4 class="font-bold text-green-800 mb-1 flex items-center gap-2"><i data-lucide="check-circle-2" class="w-4 h-4"></i> Câu sửa lại:</h4><p class="text-green-900">${data.corrected}</p></div><div class="p-4 bg-blue-50 rounded-xl border border-blue-100"><h4 class="font-bold text-blue-800 mb-1 flex items-center gap-2"><i data-lucide="sparkles" class="w-4 h-4"></i> Cách nói hay hơn:</h4><p class="text-blue-900">${data.better_version}</p></div><div class="p-4 bg-slate-50 rounded-xl"><h4 class="font-bold text-slate-700 mb-1">💡 Góp ý chi tiết:</h4><p class="text-slate-600 text-sm">${data.explanation}</p></div></div>`; lucide.createIcons(); addStars(5); } else { document.getElementById('ai-feedback-content').innerHTML = '<p class="text-red-500 text-center p-4">Lỗi phân tích.</p>'; } };
          recBtn.onclick = () => { if (window.isRecording) { recognition.stop(); window.isRecording = false; } else { recognition.start(); window.isRecording = true; } }; }
      function resetRecBtn() { const recBtn = document.getElementById('record-btn'); window.isRecording = false; recBtn.disabled = false; recBtn.className = "w-full py-6 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-all flex justify-center items-center gap-3 text-xl shadow-lg shadow-purple-200"; recBtn.innerHTML = 'Nhấn để trả lời lại <i data-lucide="rotate-cw" class="w-6 h-6"></i>'; lucide.createIcons(); }
}

async function loadWriting() {
    mainContent.innerHTML = `<div class="flex flex-col h-full"><h2 class="text-2xl font-black text-slate-800 mb-6">Writing Coach (${targetLang})</h2><div class="flex-grow flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2"><textarea id="writing-input" class="w-full h-48 p-5 border-2 border-slate-200 rounded-3xl focus:border-pink-500 outline-none font-medium resize-none shadow-sm" placeholder="Viết một đoạn văn ngắn bằng ${targetLang}..."></textarea><div id="writing-feedback" class="hidden space-y-6"></div></div><div class="mt-4 shrink-0"><button onclick="checkWriting(this)" class="w-full py-4 bg-pink-600 text-white font-bold rounded-2xl hover:bg-pink-700 transition-all flex justify-center items-center gap-2 text-lg shadow-lg shadow-pink-200">Chấm bài viết <i data-lucide="pen-tool" class="w-5 h-5"></i></button></div></div>`;
    lucide.createIcons();
    window.checkWriting = async (btn) => {
        const text = document.getElementById('writing-input').value.trim();
        if (!text || text.length < 10) { alert("Vui lòng viết dài hơn một chút."); return; }
        setBtnLoading(btn, true);
        const feedbackArea = document.getElementById('writing-feedback');
        feedbackArea.classList.remove('hidden');
        showLoading(feedbackArea, false, 'AI đang chấm bài viết...');
        const data = await GeminiService.evaluateWriting(text);
        setBtnLoading(btn, false);
        if (data) {
            let scoreColor = data.score >= 8 ? 'text-green-600' : (data.score >= 5 ? 'text-orange-500' : 'text-red-500');
            feedbackArea.innerHTML = `<div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><div class="flex items-center justify-between mb-6"><div class="flex items-center gap-3"><h3 class="text-xl font-bold text-slate-800">Kết quả đánh giá</h3><span class="text-3xl font-black ${scoreColor}">${data.score}/10</span></div><div class="text-yellow-500 font-bold flex items-center gap-1">+5 <i data-lucide="star" class="w-5 h-5 fill-current"></i></div></div><div class="space-y-4"><div class="p-5 bg-green-50 rounded-2xl border border-green-100"><h4 class="font-bold text-green-800 mb-2 flex items-center gap-2"><i data-lucide="check-circle" class="w-5 h-5"></i> Bài sửa:</h4><p class="text-slate-700 leading-relaxed whitespace-pre-wrap">${data.corrected}</p></div><div class="p-5 bg-slate-50 rounded-2xl"><h4 class="font-bold text-slate-700 mb-2 flex items-center gap-2"><i data-lucide="message-square" class="w-5 h-5"></i> Nhận xét chi tiết:</h4><p class="text-slate-600 leading-relaxed">${data.feedback}</p></div><div class="p-5 bg-pink-50 rounded-2xl border border-pink-100"><h4 class="font-bold text-pink-800 mb-2 flex items-center gap-2"><i data-lucide="list-checks" class="w-5 h-5"></i> Điểm cần cải thiện:</h4><ul class="list-disc list-inside text-slate-700 space-y-1">${data.key_improvements.map(k => `<li>${k}</li>`).join('')}</ul></div></div></div>`;
            lucide.createIcons();
            feedbackArea.parentElement.scrollTo({ top: feedbackArea.offsetTop, behavior: 'smooth' });
            addStars(5);
        } else { feedbackArea.innerHTML = '<div class="text-red-500 text-center p-4">Lỗi kết nối. Vui lòng thử lại.</div>'; }
    }
}

async function loadChat() {
      // chatSession = null; // Bỏ
      window.clientChatHistory = null; // Dùng biến client
      const unlocked = getUnlockedScenarios();
      
      let extraScenariosHTML = storeScenarios.map(item => {
          if (unlocked.includes(item.id)) {
              return `<button onclick="startRoleplay('${item.id}', this)" class="p-6 bg-white border-2 border-green-100 rounded-3xl hover:border-green-400 hover:shadow-lg transition-all flex flex-col items-center gap-3 group">
                <div class="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><i data-lucide="${item.icon}" class="w-8 h-8"></i></div>
                <span class="font-bold text-slate-700">${item.title}</span>
                <span class="text-xs text-green-600 font-medium">Đã mở khóa</span>
              </button>`;
          } else {
              return `<button onclick="switchTab('store')" class="p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl hover:border-yellow-400 hover:shadow-lg transition-all flex flex-col items-center gap-3 group opacity-70">
                <div class="w-16 h-16 bg-slate-200 text-slate-500 rounded-2xl flex items-center justify-center relative group-hover:scale-110 transition-transform">
                    <i data-lucide="lock" class="w-8 h-8"></i>
                    <span class="absolute -top-2 -right-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">${item.cost} ⭐</span>
                </div>
                <span class="font-bold text-slate-500">${item.title}</span>
                <span class="text-xs text-slate-500 font-medium">Đến Cửa hàng</span>
              </button>`;
          }
      }).join('');
      
      mainContent.innerHTML = `<div class="flex flex-col h-full">
        <h2 class="text-2xl font-black text-slate-800 mb-4 shrink-0 flex items-center gap-2">Roleplay Chat (${targetLang}) <span class="text-xs font-normal px-2 py-1 bg-purple-100 text-purple-700 rounded-full">Aki Ultra</span></h2>
        <div id="chat-container" class="flex-grow flex flex-col overflow-hidden">
            <div id="scenario-select" class="flex-grow flex flex-col justify-center items-center space-y-6">
                <h3 class="text-xl font-bold text-slate-600 mb-4">Chọn tình huống để bắt đầu:</h3>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-5xl px-4">
                    <button onclick="startRoleplay('default', this)" class="p-6 bg-white border-2 border-purple-100 rounded-3xl hover:border-purple-400 hover:shadow-lg transition-all flex flex-col items-center gap-3 group">
                        <div class="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><i data-lucide="brain" class="w-8 h-8"></i></div>
                        <span class="font-bold text-slate-700">Chat Gia Sư AI</span>
                    </button>
                    <button onclick="startRoleplay('job_interview', this)" class="p-6 bg-white border-2 border-blue-100 rounded-3xl hover:border-blue-400 hover:shadow-lg transition-all flex flex-col items-center gap-3 group">
                        <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><i data-lucide="briefcase" class="w-8 h-8"></i></div>
                        <span class="font-bold text-slate-700">Phỏng vấn</span>
                    </button>
                    <button onclick="startRoleplay('coffee_shop', this)" class="p-6 bg-white border-2 border-orange-100 rounded-3xl hover:border-orange-400 hover:shadow-lg transition-all flex flex-col items-center gap-3 group">
                        <div class="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><i data-lucide="coffee" class="w-8 h-8"></i></div>
                        <span class="font-bold text-slate-700">Gọi đồ uống</span>
                    </button>
                    <button onclick="startRoleplay('airport_immigration', this)" class="p-6 bg-white border-2 border-indigo-100 rounded-3xl hover:border-indigo-400 hover:shadow-lg transition-all flex flex-col items-center gap-3 group">
                        <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><i data-lucide="plane" class="w-8 h-8"></i></div>
                        <span class="font-bold text-slate-700">Nhập cảnh</span>
                    </button>
                    ${extraScenariosHTML}
                </div>
            </div>
            <div id="chat-interface" class="hidden flex-grow flex-col overflow-hidden">
                <div id="chat-history" class="flex-grow overflow-y-auto custom-scrollbar p-4 bg-slate-50 rounded-3xl border border-slate-200 space-y-4 mb-4"></div>
                <form id="chat-form" class="flex gap-2 shrink-0">
                    <input type="text" id="chat-input" placeholder="Nhập tin nhắn bằng ${targetLang}..." class="flex-grow p-4 border-2 border-slate-200 rounded-2xl focus:border-purple-500 outline-none font-medium" autocomplete="off">
                    <button type="submit" class="p-4 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-colors"><i data-lucide="send-horizontal" class="w-6 h-6"></i></button>
                </form>
            </div>
        </div>
      </div>`;
      lucide.createIcons();
      window.startRoleplay = async (scenario, btn) => {
            document.getElementById('scenario-select').classList.add('hidden');
            document.getElementById('chat-interface').classList.remove('hidden'); document.getElementById('chat-interface').classList.add('flex');
            const history = document.getElementById('chat-history');
            history.innerHTML = '<div class="flex justify-start chat-message"><div class="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex space-x-2"><div class="w-2 h-2 bg-slate-400 rounded-full loading-dot"></div><div class="w-2 h-2 bg-slate-400 rounded-full loading-dot"></div><div class="w-2 h-2 bg-slate-400 rounded-full loading-dot"></div></div></div>';
            const firstMsg = await GeminiService.startRoleplayChat(scenario);
            history.innerHTML = ''; addMsg('model', firstMsg);
      };
      const history = document.getElementById('chat-history');
      const addMsg = (role, text) => { history.innerHTML += `<div class="flex ${role==='user'?'justify-end':'justify-start'} chat-message"><div class="max-w-[85%] p-4 rounded-2xl ${role==='user'?'bg-purple-600 text-white rounded-br-sm':'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-sm'}">${text}</div></div>`; history.scrollTo(0, history.scrollHeight); };
      document.getElementById('chat-form').onsubmit = async (e) => { e.preventDefault(); const input = document.getElementById('chat-input'); const msg = input.value.trim(); if(!msg) return; addMsg('user', msg); input.value = ''; const loadingId = 'chat-loading-' + Date.now(); history.innerHTML += `<div id="${loadingId}" class="flex justify-start chat-message"><div class="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm rounded-bl-sm flex space-x-2"><div class="w-2 h-2 bg-slate-400 rounded-full loading-dot"></div><div class="w-2 h-2 bg-slate-400 rounded-full loading-dot"></div><div class="w-2 h-2 bg-slate-400 rounded-full loading-dot"></div></div></div>`; history.scrollTo(0, history.scrollHeight); const response = await GeminiService.chat(msg); document.getElementById(loadingId).remove(); addMsg('model', response); };
}

async function loadStore() {
    const unlocked = getUnlockedScenarios();
    
    let itemsHTML = storeScenarios.map(item => {
        const isUnlocked = unlocked.includes(item.id);
        return `
            <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4">
                <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                    <i data-lucide="${item.icon}" class="w-6 h-6"></i>
                </div>
                <div class="flex-grow">
                    <h3 class="font-bold text-lg text-slate-800">${item.title}</h3>
                    <p class="text-sm text-slate-500">${item.desc}</p>
                </div>
                ${isUnlocked ? 
                    `<button class="w-full md:w-auto px-6 py-3 bg-green-100 text-green-700 font-bold rounded-xl transition-all" disabled>
                        <i data-lucide="check" class="w-4 h-4 inline-block mr-1"></i> Đã mở khóa
                    </button>` 
                : 
                    `<button onclick="buyScenario('${item.id}', ${item.cost})" class="w-full md:w-auto px-6 py-3 bg-yellow-400 text-yellow-900 font-bold rounded-xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-2">
                        <i data-lucide="star" class="w-4 h-4 fill-current"></i> ${item.cost}
                    </button>`
                }
            </div>
        `;
    }).join('');

    mainContent.innerHTML = `<div class="flex flex-col h-full">
        <h2 class="text-2xl font-black text-slate-800 mb-6 shrink-0">Cửa hàng (Bạn đang có: ${starPoints} ⭐)</h2>
        <div id="store-items" class="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-4">
            ${itemsHTML}
        </div>
    </div>`;
    lucide.createIcons();
}


// --- Mảng Tabs (Giữ nguyên) ---
const tabs = [
    {id:'planner',label:'Lộ trình',icon:'map',render:loadPlanner},
    {id:'vocab',label:'Từ vựng',icon:'sparkles',render:loadVocab},
    {id:'review',label:'Ôn tập',icon:'repeat',render:loadReview},
    {id:'grammar',label:'Ngữ pháp',icon:'book-open',render:loadGrammar},
    {id:'listen',label:'Luyện Nghe',icon:'headphones',render:loadListening},
    {id:'reading',label:'Luyện Đọc',icon:'book-text',render:loadReading},
    {id:'speak',label:'Luyện Nói',icon:'mic',render:loadSpeaking},
    {id:'writing',label:'Luyện Viết ✨',icon:'pen-tool',render:loadWriting},
    {id:'quiz',label:'Kiểm tra',icon:'graduation-cap',render:loadQuiz},
    {id:'chat',label:'Chat AI ✨',icon:'message-circle',render:loadChat},
    {id:'store',label:'Cửa hàng',icon:'store',render:loadStore}
];

// --- Các hàm điều hướng (Giữ nguyên) ---
function renderNav() { document.getElementById('nav-buttons').innerHTML = tabs.map(t => `<button id="tab-${t.id}" onclick="switchTab('${t.id}')" class="flex md:flex-row flex-col items-center md:px-5 md:py-3 p-2 md:w-full w-auto rounded-2xl transition-all font-bold text-xs md:text-base whitespace-nowrap flex-shrink-0 md:justify-start justify-center mb-1 md:mb-0"><i data-lucide="${t.icon}" class="md:mr-3 mb-1 md:mb-0 w-5 h-5 md:w-6 md:h-6"></i> ${t.label}</button>`).join(''); lucide.createIcons(); }
window.switchTab = (id) => { activeTab = id; if (recognition) { try { recognition.stop(); } catch(e) {} }
    tabs.forEach(t => { const b = document.getElementById(`tab-${t.id}`); if(b) b.className = `flex md:flex-row flex-col items-center md:px-5 md:py-3 p-2 md:w-full w-auto rounded-2xl transition-all font-bold text-xs md:text-base whitespace-nowrap flex-shrink-0 md:justify-start justify-center mb-1 md:mb-0 ${t.id===id ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-400 hover:bg-white/10 hover:text-slate-600'}`; });
    const tab = tabs.find(t=>t.id===id); if(tab) tab.render();
}

// Bắt đầu chạy ứng dụng
initApp();

//]]>*/
</script>
    
    <div class='fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center px-4 transition-opacity duration-600 hidden' id='settings-modal'>
        <div class='bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full'>
            <div class='text-center mb-6'>
                <div class='inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-4'><i class='w-8 h-8' data-lucide='settings'/></div>
                <h2 class='text-2xl font-extrabold text-slate-800'>Cài đặt Ngôn ngữ</h2>
                <p class='text-slate-500 mt-2'>Chọn ngôn ngữ bạn muốn học.</p>
            </div>
            <form onsubmit='saveSettings(event)'>
                <div class='mb-6'>
                    <label class='block text-sm font-medium text-slate-700 mb-2' for='language-select'>Ngôn ngữ muốn học</label>
                    <select class='w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-slate-700 appearance-none pr-10 relative' id='language-select' required=''>
                        <option selected='' value='English'>🇬🇧 Tiếng Anh (English)</option>
                        <option value='Japanese'>🇯🇵 Tiếng Nhật (Japanese)</option>
                        <option value='Korean'>🇰🇷 Tiếng Hàn (Korean)</option>
                        <option value='Chinese'>🇨🇳 Tiếng Trung (Chinese)</option>
                        <option value='French'>🇫🇷 Tiếng Pháp (French)</option>
                        <option value='German'>🇩🇪 Tiếng Đức (German)</option>
                        <option value='Spanish'>🇪🇸 Tiếng Tây Ban Nha (Spanish)</option>
                    </select>
                </div>
                <button class='w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center' type='submit'>Lưu &amp; Bắt đầu <i class='ml-2 w-5 h-5' data-lucide='arrow-right'/></button>
            </form>
            </div>
    </div>

    <div class='bg-white w-full max-w-7xl h-[95vh] md:h-[850px] rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200 hidden' id='app-container'>
        <nav class='bg-slate-900 text-slate-300 md:w-72 w-full md:p-6 p-3 flex md:flex-col flex-row justify-between shrink-0 overflow-x-auto md:overflow-visible no-scrollbar relative'>
            <div class='flex md:flex-col flex-row md:w-full w-auto items-center md:items-stretch'>
                <div class='hidden md:flex items-center justify-between mb-8 px-2'>
                    <div class='text-white font-black text-xl tracking-tight flex flex-col'>
                        <span class='gradient-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-500' id='app-title-lang'>AI Tutor</span>
                        <span class='text-xs text-slate-400 font-medium'>Lite Edition</span>
                    </div>
                    <div class='flex items-center bg-white/10 rounded-full px-3 py-1.5 ml-2 star-points' title='Tổng điểm sao của bạn'>
                        <span class='text-yellow-400 font-black text-sm mr-1' id='star-count'>0</span> <i class='w-4 h-4 text-yellow-400 fill-yellow-400' data-lucide='star'/>
                    </div>
                </div>
                <div class='md:hidden flex items-center bg-slate-800 rounded-full px-3 py-1 mr-3 star-points'>
                    <span class='text-yellow-400 font-black text-xs mr-1' id='star-count-mobile'>0</span> <i class='w-3 h-3 text-yellow-400 fill-yellow-400' data-lucide='star'/>
                </div>

                <div class='flex md:flex-col flex-row md:space-y-2 space-y-0 md:space-x-0 space-x-2 w-full' id='nav-buttons'/>
            </div>
            <button class='flex items-center text-sm font-medium text-slate-400 hover:text-purple-400 transition-colors px-4 py-3 rounded-xl hover:bg-white/5 mt-auto md:mt-auto md:w-full w-auto justify-center md:justify-start' onclick='openSettings()'>
    <i class='md:mr-3 w-5 h-5' data-lucide='settings'/>
    <span class='hidden md:inline'>Cài đặt</span>
            </button>
        </nav>
        
        <main class='flex-grow p-4 md:p-8 overflow-y-auto h-full bg-slate-50 relative' id='main-content'>
            <div class='h-full flex items-center justify-center text-slate-400'>
                Đang tải ứng dụng...
            </div>
        </main>
        
    </div>
</body>
</html>