/* ===== Local storage helpers ===== */
const LS = {
  get(k, d=null){ try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); },
  del(k){ localStorage.removeItem(k); }
};

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* ===== Tabs ===== */
$$('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $$('.tab').forEach(t=>t.classList.remove('active'));
    $('#'+btn.dataset.tab).classList.add('active');
  });
});

/* ===== Settings ===== */
const apiKeyEl = $('#apiKey');
const modelEl  = $('#model');

function loadSettings(){
  apiKeyEl.value = LS.get('openai_key','') || '';
  modelEl.value  = LS.get('openai_model','gpt-4o-mini') || 'gpt-4o-mini';
}
function saveSettings(){
  if(apiKeyEl.value.trim()) LS.set('openai_key', apiKeyEl.value.trim());
  LS.set('openai_model', modelEl.value);
  alert('Saved!');
}
$('#saveSettings').addEventListener('click', saveSettings);
$('#clearAll').addEventListener('click', ()=>{
  if(confirm('Delete ALL diary entries and chat history from this iPad?')){
    LS.del('entries'); LS.del('chat'); alert('Cleared.');
  }
});
loadSettings();

/* ===== Diary ===== */
const entries = LS.get('entries', []); // [{id, ts, title, text, photoDataUrl}]
const entriesList = $('#entriesList');
const photoInput = $('#entryPhoto');

let currentPhoto = null;
photoInput.addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => currentPhoto = reader.result; // base64 data URL
  reader.readAsDataURL(file);
});

function renderEntries(list = entries){
  const q = $('#search').value.toLowerCase();
  const items = list
    .filter(e => e.title.toLowerCase().includes(q) || e.text.toLowerCase().includes(q))
    .sort((a,b)=> b.ts - a.ts);

  entriesList.innerHTML = items.map(e=>`
    <li class="card">
      <div class="row">
        <strong>${e.title || '(no title)'}</strong>
        <span class="ts">${new Date(e.ts).toLocaleString()}</span>
      </div>
      ${e.photoDataUrl ? `<img class="thumb" src="${e.photoDataUrl}" alt="photo">` : ''}
      <p>${e.text.replace(/\n/g,'<br>')}</p>
      <div class="row">
        <button data-act="delete" data-id="${e.id}" class="danger small">Delete</button>
      </div>
    </li>
  `).join('');
}
renderEntries();
$('#search').addEventListener('input', ()=>renderEntries());

$('#saveEntry').addEventListener('click', ()=>{
  const title = $('#entryTitle').value.trim();
  const text  = $('#entryText').value.trim();
  if(!title && !text && !currentPhoto){ alert('Write something first 🙂'); return; }
  entries.push({ id: crypto.randomUUID(), ts: Date.now(), title, text, photoDataUrl: currentPhoto });
  LS.set('entries', entries);
  $('#entryTitle').value=''; $('#entryText').value=''; photoInput.value=''; currentPhoto=null;
  renderEntries();
});

entriesList.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-act="delete"]');
  if(!btn) return;
  const id = btn.dataset.id;
  const i = entries.findIndex(x=>x.id===id);
  if(i>-1 && confirm('Delete this entry?')){
    entries.splice(i,1); LS.set('entries', entries); renderEntries();
  }
});

/* ===== Chat ===== */
const chatLog = $('#chatLog');
const chatMsg = $('#chatMsg');
const saveChatToggle = $('#saveChat');
let chat = LS.get('chat', []); // [{role:'user'|'assistant', content:'...'}]

function renderChat(){
  chatLog.innerHTML = chat.map(m => `
    <div class="msg ${m.role}">
      <div>${m.content.replace(/\n/g,'<br>')}</div>
    </div>
  `).join('');
  chatLog.scrollTop = chatLog.scrollHeight;
}
renderChat();

async function sendMessage(){
  const text = chatMsg.value.trim();
  if(!text) return;
  chat.push({role:'user', content:text});
  chatMsg.value = '';
  renderChat();

  const key = LS.get('openai_key','');
  const model = LS.get('openai_model','gpt-4o-mini');
  if(!key){ alert('Go to Settings and paste your OpenAI API key first.'); return; }

  // show typing bubble
  chat.push({role:'assistant', content:'…thinking…'}); renderChat();

  try{
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':`Bearer ${key}`
      },
      body: JSON.stringify({
        model,
        messages: [{role:'system', content:'You are a kind, concise diary assistant.'}, ...chat.filter(m=>m.content!=='…thinking…')]
      })
    });
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '(no reply)';
    // replace typing bubble
    const idx = chat.findIndex(m=>m.content==='…thinking…' && m.role==='assistant');
    if(idx>-1) chat.splice(idx,1,{role:'assistant', content: reply});
  }catch(err){
    const idx = chat.findIndex(m=>m.content==='…thinking…' && m.role==='assistant');
    if(idx>-1) chat.splice(idx,1,{role:'assistant', content: 'Network error. Try again.'});
  }
  if(saveChatToggle.checked) LS.set('chat', chat);
  renderChat();
}
$('#sendMsg').addEventListener('click', sendMessage);
chatMsg.addEventListener('keydown', e=>{ if(e.key==='Enter') sendMessage(); });

/* ===== Backup/restore ===== */
$('#exportData').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify({entries, chat}, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ai-diary-backup.json';
  a.click();
});
$('#importData').addEventListener('click', ()=>{
  const f = $('#importFile').files[0];
  if(!f) return alert('Choose a file first');
  const r = new FileReader();
  r.onload = ()=>{
    try{
      const obj = JSON.parse(r.result);
      if(Array.isArray(obj.entries)) { entries.splice(0, entries.length, ...obj.entries); LS.set('entries', entries); }
      if(Array.isArray(obj.chat))    { chat = obj.chat; LS.set('chat', chat); }
      renderEntries(); renderChat(); alert('Imported!');
    }catch{ alert('Bad file'); }
  };
  r.readAsText(f);
});
