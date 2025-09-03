// =============================
// AI Diary App - Hugging Face Version
// =============================

let entries = JSON.parse(localStorage.getItem("entries") || "[]");
let settings = JSON.parse(localStorage.getItem("settings") || "{}");

// Save settings
document.getElementById("saveSettings").onclick = () => {
  settings.apiKey = document.getElementById("apiKey").value;
  settings.model = document.getElementById("model").value;
  localStorage.setItem("settings", JSON.stringify(settings));
  alert("✅ Settings saved!");
};

// Load settings into inputs
if (settings.apiKey) document.getElementById("apiKey").value = settings.apiKey;
if (settings.model) document.getElementById("model").value = settings.model;

// Tab navigation
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  };
});

// Save diary entry
document.getElementById("saveEntry").onclick = () => {
  let title = document.getElementById("entryTitle").value;
  let text = document.getElementById("entryText").value;
  let photoFile = document.getElementById("entryPhoto").files[0];
  let date = new Date().toLocaleString();
  let entry = { title, text, date, photo: null };

  if (photoFile) {
    let reader = new FileReader();
    reader.onload = () => {
      entry.photo = reader.result;
      entries.push(entry);
      localStorage.setItem("entries", JSON.stringify(entries));
      alert("✅ Entry saved!");
    };
    reader.readAsDataURL(photoFile);
  } else {
    entries.push(entry);
    localStorage.setItem("entries", JSON.stringify(entries));
    alert("✅ Entry saved!");
  }
};

// Load entries
function loadEntries() {
  let list = document.getElementById("entriesList");
  list.innerHTML = "";
  entries.forEach((e, i) => {
    let li = document.createElement("li");
    li.className = "card";
    li.innerHTML = `<b>${e.title}</b><br>${e.text}<br><span class="ts">${e.date}</span>`;
    if (e.photo) {
      li.innerHTML += `<br><img src="${e.photo}" class="thumb">`;
    }
    list.appendChild(li);
  });
}
loadEntries();

// Search entries
document.getElementById("search").oninput = (e) => {
  let q = e.target.value.toLowerCase();
  let list = document.getElementById("entriesList");
  list.innerHTML = "";
  entries.filter(e => e.title.toLowerCase().includes(q) || e.text.toLowerCase().includes(q))
    .forEach(e => {
      let li = document.createElement("li");
      li.className = "card";
      li.innerHTML = `<b>${e.title}</b><br>${e.text}<br><span class="ts">${e.date}</span>`;
      if (e.photo) {
        li.innerHTML += `<br><img src="${e.photo}" class="thumb">`;
      }
      list.appendChild(li);
    });
};

// =============================
// Hugging Face Chat
// =============================
async function sendToAI(message) {
  if (!settings.apiKey || !settings.model) {
    return "⚠️ Please set API key and model in Settings.";
  }

  try {
    let response = await fetch(`https://api-inference.huggingface.co/models/${settings.model}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${settings.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: message })
    });

    if (!response.ok) {
      return `❌ API Error: ${response.statusText}`;
    }

    let data = await response.json();
    console.log("HF response:", data);

    // Some models return [{ generated_text: "..." }]
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text;
    }

    // Some chat models return { generated_text: "..." }
    if (data.generated_text) {
      return data.generated_text;
    }

    return "🤖 No reply received from model.";
  } catch (err) {
    return "❌ Error: " + err.message;
  }
}

// Handle chat
document.getElementById("sendMsg").onclick = async () => {
  let msg = document.getElementById("chatMsg").value;
  if (!msg) return;

  let chatLog = document.getElementById("chatLog");

  let userDiv = document.createElement("div");
  userDiv.className = "msg user";
  userDiv.textContent = msg;
  chatLog.appendChild(userDiv);

  document.getElementById("chatMsg").value = "";

  let thinkingDiv = document.createElement("div");
  thinkingDiv.className = "msg assistant";
  thinkingDiv.textContent = "⏳ Thinking...";
  chatLog.appendChild(thinkingDiv);

  let reply = await sendToAI(msg);
  thinkingDiv.textContent = reply;

  chatLog.scrollTop = chatLog.scrollHeight;
};


