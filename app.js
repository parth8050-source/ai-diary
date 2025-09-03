// Tabs
const tabs = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.tab');
tabs.forEach(btn=>{
  btn.onclick=()=>{
    sections.forEach(s=>s.classList.remove('active'));
    document.getElementById(btn.dataset.tab).classList.add('active');
  };
});

// Save & load entries
const saveEntryBtn = document.getElementById('saveEntry');
const entriesList = document.getElementById('entriesList');
let entries = JSON.parse(localStorage.getItem('entries')||'[]');

function renderEntries(list=entries){
  entriesList.innerHTML='';
  list.forEach((e,i)=>{
    const li=document.createElement('li');
    li.className='card';
    li.innerHTML=`
      <div class="row"><strong>${e.title||'Untitled'}</strong>
      <span class="ts">${new Date(e.date).toLocaleString()}</span></div>
      ${e.photo?`<img class="thumb" src="${e.photo}">`:''}
      <div>${e.text}</div>
    `;
    entriesList.appendChild(li);
  });
}
renderEntries();

saveEntryBtn.onclick=()=>{
  const title=document.getElementById('entryTitle').value;
  const text=document.getElementById('entryText').value;
  const photoInput=document.getElementById('entryPhoto');
  let photo=null;
  if(photoInput.files[0]){
    const reader=new FileReader();
    reader.onload=()=>{
      photo=reader.result;
      addEntry(title,text,photo);
    };
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    addEntry(title,text,null);
  }
};

function addEntry(title,text,photo){
  const entry={title,text,photo,date:Date.now()};
  entries.unshift(entry);
  localStorage.setItem('entries',JSON.stringify(entries));
  renderEntries();
  document.getElementById('entryTitle').value='';
  document.getElementById('entryText').value='';
  document.getElementById('entryPhoto').value='';
}

// Search
document.getElementById('search').oninput=(e)=>{
  const q=e.target.value.toLowerCase();
  renderEntries(entries.filter(en=>
    en.title.toLowerCase().includes(q)||en.text.toLowerCase().includes(q)
  ));
};

// AI Chat (Hugging Face)
const chatLog=document.getElementById('chatLog');
const chatMsg=document.getElementById('chatMsg');
document.getElementById('sendMsg').onclick=sendChat;

function appendMsg(role,text){
  const div=document.createElement('div');
  div.className=`msg ${role}`;
  div.innerHTML=`<div>${text}</div>`;
  chatLog.appendChild(div);
  chatLog.scrollTop=chatLog.scrollHeight;
}

async function sendChat(){
  const msg=chatMsg.value.trim();
  if(!msg) return;
  appendMsg('user',msg);
  chatMsg.value='';

  const key=localStorage.getItem('hf_apiKey');
  const model=localStorage.getItem('hf_model')||'meta-llama/Llama-2-7b-chat-hf';
  if(!key){ appendMsg('assistant','⚠️ Please set your Hugging Face API key in Settings'); return; }

  appendMsg('assistant','⏳ Thinking...');
  try{
    const r=await fetch(`https://api-inference.huggingface.co/models/${model}`,{
      method:"POST",
      headers:{ "Content-Type":"application/json","Authorization":"Bearer "+key },
      body:JSON.stringify({inputs: msg})
    });
    const j=await r.json();

    if (j.error) {
      chatLog.lastChild.innerHTML = `<div>⚠️ API Error: ${j.error}</div>`;
    } else {
      const reply = j[0]?.generated_text || "(no reply)";
      chatLog.lastChild.innerHTML = `<div>${reply}</div>`;
    }
  }catch(e){
    chatLog.lastChild.innerHTML=`<div>⚠️ Error: ${e}</div>`;
  }
}

// Settings
document.getElementById('saveSettings').onclick=()=>{
  const key=document.getElementById('apiKey').value;
  const model=document.getElementById('model').value;
  if(key) localStorage.setItem('hf_apiKey',key);
  localStorage.setItem('hf_model',model);
  alert('✅ Settings saved');
};

// Clear all
document.getElementById('clearAll').onclick=()=>{
  if(confirm('Erase everything?')){
    localStorage.clear(); entries=[]; renderEntries(); chatLog.innerHTML='';
  }
};

// Export/import
document.getElementById('exportData').onclick=()=>{
  const blob=new Blob([JSON.stringify({entries},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='ai-diary.json'; a.click();
};
document.getElementById('importData').onclick=()=>{
  const f=document.getElementById('importFile').files[0];
  if(!f) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{ const j=JSON.parse(reader.result);
      if(j.entries){ entries=j.entries; localStorage.setItem('entries',JSON.stringify(entries)); renderEntries(); }
    }catch(e){ alert('Bad file'); }
  };
  reader.readAsText(f);
};


