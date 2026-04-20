const chatBox = document.getElementById("chat-box");

let chats = {};
let currentChat = "";
let chatTitles = {};

// ================= STORAGE =================
function saveToLocal() {
    localStorage.setItem("chats", JSON.stringify(chats));
    localStorage.setItem("titles", JSON.stringify(chatTitles));
}

function loadFromLocal() {
    const savedChats = localStorage.getItem("chats");
    const savedTitles = localStorage.getItem("titles");

    if (savedChats) chats = JSON.parse(savedChats);
    if (savedTitles) chatTitles = JSON.parse(savedTitles);
}

// ================= TYPING EFFECT =================
function typeText(div, text) {
    let i = 0;
    div.innerHTML = "";

    function typing() {
        if (i < text.length) {
            div.innerHTML += text.charAt(i);
            i++;
            setTimeout(typing, 10);
        }
    }
    typing();
}

// ================= MESSAGE =================
function addMessage(text, className) {
    if (!chats[currentChat]) chats[currentChat] = [];

    const div = document.createElement("div");
    div.className = "message " + className;

    chatBox.appendChild(div);

    // ✨ typing effect
    typeText(div, text);

    // save message
    chats[currentChat].push({ text, className });
    saveToLocal();

    // 🧠 auto title
    if (!chatTitles[currentChat]) {
        let lower = text.toLowerCase();

        if (lower.includes("science")) chatTitles[currentChat] = "🌱 Science";
        else if (lower.includes("arduino")) chatTitles[currentChat] = "🔧 Arduino";
        else if (lower.includes("ai")) chatTitles[currentChat] = "🤖 AI";
        else chatTitles[currentChat] = "💬 Chat";
    }

    renderHistory();

    // scroll
    chatBox.scrollTop = chatBox.scrollHeight;

    // 📋 right click menu
    div.addEventListener("contextmenu", (e) => {
        e.preventDefault();

        let action = prompt("1 = Copy\n2 = Delete");

        if (action == "1") {
            navigator.clipboard.writeText(text);
        }

        if (action == "2") {
            div.remove();
            chats[currentChat] = chats[currentChat].filter(m => m.text !== text);
            saveToLocal();
        }
    });
}

// ================= SEND =================
function sendMessage() {
    const input = document.getElementById("input");
    const message = input.value.trim();

    if (!message) return;

    addMessage(message, "user");

    // 🤖 thinking
    const thinking = document.createElement("div");
    thinking.className = "message bot";
    thinking.innerHTML = "🤖 <span class='dot'>.</span><span class='dot'>.</span><span class='dot'>.</span>";
    chatBox.appendChild(thinking);
    chatBox.scrollTop = chatBox.scrollHeight;

    fetch("/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ message })
    })
    .then(res => res.text())
    .then(data => {
        thinking.remove();
        addMessage(data, "bot");
    })
    .catch(() => {
        thinking.innerHTML = "⚠️ Error aa gaya";
    });

    input.value = "";
}

// ================= HISTORY =================
function renderHistory() {
    const history = document.getElementById("history");
    history.innerHTML = "";

    Object.keys(chats).forEach(id => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerText = chatTitles[id] || "💬 Chat";

        div.onclick = () => loadChat(id);

        history.appendChild(div);
    });
}

function loadChat(id) {
    currentChat = id;
    chatBox.innerHTML = "";

    chats[id].forEach(msg => {
        const div = document.createElement("div");
        div.className = "message " + msg.className;
        div.innerHTML = msg.text;
        chatBox.appendChild(div);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
}

// ================= NEW CHAT =================
function newChat() {
    currentChat = "chat_" + Date.now();
    chats[currentChat] = [];
    chatBox.innerHTML = "";
    renderHistory();
    saveToLocal();
}

// ================= CLEAR CHAT =================
function clearChat() {
    chatBox.innerHTML = "";
    chats[currentChat] = [];
    saveToLocal();
}

// ================= SAVE CHAT FILE =================
function saveChat() {
    const text = chats[currentChat]
        .map(m => `${m.className.toUpperCase()}: ${m.text}`)
        .join("\n\n");

    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "chat.txt";
    a.click();
}

// ================= VOICE =================
function startMic() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Voice not supported");
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-IN";

    recognition.onresult = function(e) {
        document.getElementById("input").value =
            e.results[0][0].transcript;
    };

    recognition.start();
}

// ================= ENTER KEY =================
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("input");

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    });
});

// ================= INIT =================
loadFromLocal();

if (Object.keys(chats).length === 0) {
    newChat();
} else {
    currentChat = Object.keys(chats)[0];
}

renderHistory();