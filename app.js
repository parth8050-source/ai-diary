// ---------- AI Chat ----------
async function sendMessage() {
    const input = document.getElementById("userInput").value;
    const chatBox = document.getElementById("chatBox");

    if (!input.trim()) return;

    // Show user message
    chatBox.innerHTML += `<div><b>You:</b> ${input}</div>`;

    try {
        // Call Hugging Face Space API
        const response = await fetch("https://atharva-8050-my-diary-ai.hf.space/run/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: [input] })
        });

        const result = await response.json();
        const botReply = result.data[0];

        // Show bot reply
        chatBox.innerHTML += `<div><b>Diary AI:</b> ${botReply}</div>`;
    } catch (error) {
        chatBox.innerHTML += `<div><b>Diary AI:</b> (Error connecting to AI)</div>`;
    }

    chatBox.scrollTop = chatBox.scrollHeight; // auto-scroll
    document.getElementById("userInput").value = "";
}

// ---------- Diary Entries ----------
function saveEntry() {
    const entryText = document.getElementById("entryText").value.trim();
    if (entryText === "") {
        alert("Please write something before saving!");
        return;
    }

    // Load existing entries
    let entries = JSON.parse(localStorage.getItem("diaryEntries")) || [];

    // Add new entry with timestamp
    const now = new Date().toLocaleString();
    entries.push({ text: entryText, date: now });

    // Save back to localStorage
    localStorage.setItem("diaryEntries", JSON.stringify(entries));

    // Clear text area
    document.getElementById("entryText").value = "";

    // Refresh the list
    loadEntries();
}

function loadEntries() {
    const entriesList = document.getElementById("entriesList");
    entriesList.innerHTML = "";

    let entries = JSON.parse(localStorage.getItem("diaryEntries")) || [];

    entries.forEach(entry => {
        const li = document.createElement("li");
        li.textContent = `${entry.date}: ${entry.text}`;
        entriesList.appendChild(li);
    });
}

// Load saved entries when app opens
window.onload = loadEntries;




