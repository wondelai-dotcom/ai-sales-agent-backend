import "./style.css";
const API = (import.meta.env.VITE_API_URL || "https://ai-sales-agent-backend-6ve3.onrender.com").replace(/\/$/, "");
const $ = (selector, root=document) => root.querySelector(selector);
const state = { token: sessionStorage.getItem("asa_access_token"), user: null, page: "overview", busy: false };
const esc = (v="") => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = v => new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(Number(v||0));
const date = v => v ? new Date(v).toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"}) : "—";

async function request(path, options={}) {
  const headers = {"Content-Type":"application/json", ...(options.headers||{})};
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(API+path,{...options,headers});
  if (res.status === 204) return null;
  const data = await res.json().catch(()=>({message:"Risposta non valida dal server"}));
  if (!res.ok) throw new Error(data.message || data.error || `Errore HTTP ${res.status}`);
  return data;
}
function notify(message, error=false) {
  const el=$("#toast"); if(!el) return;
  el.textContent=message; el.className="toast show"+(error?" error":"");
  clearTimeout(notify.timer); notify.timer=setTimeout(()=>el.className="toast",3600);
}
function authView(mode="login") {
  const register=mode==="register";
  $("#app").innerHTML=`
    <main class="auth-shell">
      <section class="auth-brand"><div class="brand-mark">A</div><span class="eyebrow">AI SALES AGENT</span><h1>Le relazioni con i clienti,<br><em>in un unico posto.</em></h1><p>CRM, appuntamenti e assistenza intelligente per far crescere la tua attività.</p><div class="auth-foot">Workspace intelligente · Sicuro · Multi-azienda</div></section>
      <section class="auth-panel"><div class="auth-card"><div class="brand-inline"><div class="brand-mark small">A</div><b>AI Sales Agent</b></div><span class="eyebrow muted">${register?"INIZIA ORA":"BENTORNATO"}</span><h2>${register?"Crea il tuo spazio di lavoro":"Accedi al tuo account"}</h2><p class="sub">${register?"Configura la tua azienda e inizia a organizzare i clienti.":"Inserisci le tue credenziali per continuare."}</p>
      <form id="auth-form" class="form-stack">
        ${register?'<label>Nome<input name="nome" autocomplete="given-name" required /></label><label>Cognome<input name="cognome" autocomplete="family-name" required /></label><label>Nome azienda<input name="ragioneSociale" autocomplete="organization" required /></label>':""}
        <label>Email<input type="email" name="email" autocomplete="email" required /></label>
        <label>Password<input type="password" name="password" autocomplete="${register?"new-password":"current-password"}" minlength="${register?12:1}" required /></label>
        <button class="btn primary wide" type="submit">${register?"Crea account":"Accedi"} <span>→</span></button>
      </form>
      <div class="auth-switch">${register?"Hai già un account?":"Non hai ancora un account?"} <button id="switch-auth" class="text-button">${register?"Accedi":"Crea un account"}</button></div>
      <div id="auth-error" class="form-error" role="alert"></div>
      ${!register?'<button id="forgot-password" class="text-button" type="button">Hai dimenticato la password?</button>':""}
      <p class="legal">Continuando accetti di utilizzare il servizio nel rispetto dei termini e dell'informativa privacy.</p></div></section>
    </main><div id="toast" class="toast"></div>`;
  $("#switch-auth").onclick=()=>authView(register?"login":"register");
  if(!register) $("#forgot-password").onclick=async()=>{
    const email=$('input[name="email"]')?.value?.trim();
    if(!email){$("#auth-error").textContent="Inserisci prima la tua email.";return;}
    try{await request("/api/auth/password-reset/request",{method:"POST",body:JSON.stringify({email})});$("#auth-error").className="form-success";$("#auth-error").textContent="Se l'indirizzo è registrato, riceverai le istruzioni per reimpostare la password.";}
    catch(err){$("#auth-error").textContent=err.message;}
  };
  $("#auth-form").onsubmit=async e=>{
    e.preventDefault(); const button=$("button[type=submit]",e.currentTarget); button.disabled=true; button.textContent="Attendi…";
    const body=Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const result=await request("/api/auth/"+(register?"register":"login"),{method:"POST",body:JSON.stringify(body)});
      if(register){
        $("#auth-error").className="form-success";
        $("#auth-error").textContent="Account creato. Controlla la tua casella email e conferma l'indirizzo prima di accedere.";
        button.disabled=false; button.textContent="Crea account";
        return;
      }
      if(result.accessToken){state.token=result.accessToken;sessionStorage.setItem("asa_access_token",state.token);}
      else throw new Error("Il server non ha restituito un token di accesso.");
      await loadApp();
    } catch(err) { $("#auth-error").textContent=err.message; button.disabled=false; button.textContent=register?"Crea account":"Accedi"; }
  };
}
const nav=[["overview","Panoramica","▦"],["clients","Clienti","♙"],["leads","Opportunità","◈"],["appointments","Appuntamenti","▣"],["quotes","Preventivi","▤"],["assistant","Assistente AI","✳"]];
function shell() {
  $("#app").innerHTML=`
    <div class="app-shell"><aside class="sidebar"><div class="brand-inline"><div class="brand-mark">A</div><div><b>AI Sales Agent</b><small>WORKSPACE</small></div></div><div class="side-label">MENU PRINCIPALE</div><nav>${nav.map(([id,label,ico])=>`<button class="nav-link ${state.page===id?"active":""}" data-page="${id}"><span>${ico}</span>${label}</button>`).join("")}</nav><div class="sidebar-bottom"><div class="status-dot"></div><span>API configurata</span><button id="logout" title="Esci">↗</button></div></aside>
    <main class="main-area"><header class="topbar"><div><span class="crumb">Workspace</span><span class="crumb-sep">/</span><b id="page-title">Panoramica</b></div><div class="top-actions"><span class="online-pill"><i></i> Ambiente online</span><div class="avatar">${esc((state.user?.nome||state.user?.email||"U").slice(0,1).toUpperCase())}</div></div></header><section id="page-content" class="content"></section></main></div><div id="toast" class="toast"></div>`;
  document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{state.page=b.dataset.page;renderPage();});
  $("#logout").onclick=async()=>{try{await request("/api/auth/logout",{method:"POST"});}catch{} state.token=null;sessionStorage.removeItem("asa_access_token");authView();};
}
async function loadApp(){
  try { state.user=await request("/api/auth/me"); shell(); await renderPage(); }
  catch(e){state.token=null;sessionStorage.removeItem("asa_access_token");authView(); if(e.message) notify(e.message,true);}
}
function pageHeader(title,desc,action=""){return `<div class="page-heading"><div><span class="eyebrow muted">IL TUO BUSINESS</span><h1>${title}</h1><p>${desc}</p></div>${action}</div>`;}
function button(label,action="add"){return `<button class="btn primary" data-action="${action}">＋ ${label}</button>`;}
async function renderPage(){
  const titles={overview:"Panoramica",clients:"Clienti",leads:"Opportunità",appointments:"Appuntamenti",quotes:"Preventivi",assistant:"Assistente AI"};
  $("#page-title").textContent=titles[state.page]||"Workspace";
  const target=$("#page-content"); target.innerHTML='<div class="loading"><span class="spinner"></span> Caricamento dati…</div>';
  try{
    if(state.page==="overview") await overview(target);
    else if(state.page==="clients") await clients(target);
    else if(state.page==="leads") await leads(target);
    else if(state.page==="appointments") await appointments(target);
    else if(state.page==="quotes") await quotes(target);
    else await assistant(target);
    bindActions();
  }catch(e){target.innerHTML=`<div class="empty-state"><div class="empty-icon">!</div><h3>Non è stato possibile caricare i dati</h3><p>${esc(e.message)}</p><button class="btn secondary" data-action="reload">Riprova</button></div>`;}
}
async function overview(el){
  const [c,l,a,q]=await Promise.allSettled([request("/api/clients?page=1&pageSize=100"),request("/api/leads"),request("/api/appointments"),request("/api/quotes")]);
  const count=x=>x.status==="fulfilled"?(Array.isArray(x.value)?x.value.length:(x.value?.items?.length??x.value?.total??0)):"—";
  const clientData=c.status==="fulfilled"?(Array.isArray(c.value)?c.value:(c.value?.items||[])):[];
  const recent=clientData.slice(0,5);
  el.innerHTML=pageHeader("Panoramica","Tieni sotto controllo clienti, vendite e attività.",'<button class="btn secondary" data-action="reload">↻ Aggiorna</button>')+`
    <div class="welcome-card"><div><span class="eyebrow">IL TUO BUSINESS, PIÙ SEMPLICE</span><h2>Buongiorno${state.user?.nome?" "+esc(state.user.nome):""}.</h2><p>Qui trovi una visione rapida delle attività del tuo team.</p></div><div class="welcome-orbit">✳</div></div>
    <div class="stat-grid"><article class="stat-card"><span>Clienti</span><strong>${count(c)}</strong><small>Nel tuo CRM</small><b class="stat-icon">♙</b></article><article class="stat-card"><span>Opportunità</span><strong>${count(l)}</strong><small>Pipeline commerciale</small><b class="stat-icon">◈</b></article><article class="stat-card"><span>Appuntamenti</span><strong>${count(a)}</strong><small>In calendario</small><b class="stat-icon">▣</b></article><article class="stat-card"><span>Preventivi</span><strong>${count(q)}</strong><small>Creati dal team</small><b class="stat-icon">▤</b></article></div>
    <div class="section-head"><div><h3>Clienti recenti</h3><p>Gli ultimi contatti del tuo spazio di lavoro</p></div><button class="text-button" data-page="clients">Vedi tutti →</button></div>
    <div class="table-wrap"><table><thead><tr><th>CLIENTE</th><th>EMAIL</th><th>TELEFONO</th><th>STATO</th></tr></thead><tbody>${recent.length?recent.map(x=>`<tr><td><b>${esc(x.nome)} ${esc(x.cognome||"")}</b></td><td>${esc(x.email||"—")}</td><td>${esc(x.telefono||"—")}</td><td><span class="tag">${esc(x.stato||"Attivo")}</span></td></tr>`).join(""):'<tr><td colspan="4" class="table-empty">I clienti che aggiungerai appariranno qui.</td></tr>'}</tbody></table></div>`;
  el.querySelector('[data-page="clients"]').onclick=()=>{state.page="clients";renderPage();};
}
async function clients(el){
 const data=await request("/api/clients?page=1&pageSize=100"); const rows=Array.isArray(data)?data:(data.items||[]);
 el.innerHTML=pageHeader("Clienti","Organizza contatti, aziende e relazioni.",button("Nuovo cliente"))+`
 <div class="toolbar"><input id="search" placeholder="⌕  Cerca per nome, email o azienda…" /><span class="muted small-text">${rows.length} risultati</span></div>
 <div class="table-wrap"><table><thead><tr><th>CLIENTE</th><th>AZIENDA</th><th>CONTATTI</th><th>STATO</th></tr></thead><tbody id="client-rows">${rows.map(x=>`<tr><td><b>${esc(x.nome)} ${esc(x.cognome||"")}</b></td><td>${esc(x.ragioneSociale||"—")}</td><td>${esc(x.email||"—")}<small class="cell-sub">${esc(x.telefono||"")}</small></td><td><span class="tag">${esc(x.stato||"ATTIVO")}</span></td></tr>`).join("")||'<tr><td colspan="4" class="table-empty">Nessun cliente. Aggiungi il primo contatto.</td></tr>'}</tbody></table></div>`;
 $("#search").oninput=e=>{const q=e.target.value.toLowerCase();$("#client-rows").innerHTML=rows.filter(x=>[x.nome,x.cognome,x.email,x.ragioneSociale].join(" ").toLowerCase().includes(q)).map(x=>`<tr><td><b>${esc(x.nome)} ${esc(x.cognome||"")}</b></td><td>${esc(x.ragioneSociale||"—")}</td><td>${esc(x.email||"—")}<small class="cell-sub">${esc(x.telefono||"")}</small></td><td><span class="tag">${esc(x.stato||"ATTIVO")}</span></td></tr>`).join("")||'<tr><td colspan="4" class="table-empty">Nessun risultato.</td></tr>';};
}
async function leads(el){
 const data=await request("/api/leads"); const rows=Array.isArray(data)?data:(data.items||[]);
 el.innerHTML=pageHeader("Opportunità","Segui ogni opportunità lungo il percorso di vendita.")+`<div class="table-wrap"><table><thead><tr><th>CLIENTE</th><th>FONTE</th><th>VALORE</th><th>FASE</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.client?.nome||x.clientId||"Cliente")}</b></td><td>${esc(x.source||"—")}</td><td>${money(x.value)}</td><td><span class="tag">${esc(x.stage||"NUOVO")}</span></td></tr>`).join("")||'<tr><td colspan="4" class="table-empty">Nessuna opportunità presente.</td></tr>'}</tbody></table></div>`;
}
async function appointments(el){
 const data=await request("/api/appointments"); const rows=Array.isArray(data)?data:(data.items||[]);
 el.innerHTML=pageHeader("Appuntamenti","Tutti gli incontri e le attività pianificate.")+`<div class="table-wrap"><table><thead><tr><th>APPUNTAMENTO</th><th>DATA</th><th>DURATA</th><th>STATO</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.titolo||"Appuntamento")}</b></td><td>${date(x.dataOra)}</td><td>${esc(x.durataMin||60)} min</td><td><span class="tag">${esc(x.stato||"PROPOSTO")}</span></td></tr>`).join("")||'<tr><td colspan="4" class="table-empty">Nessun appuntamento programmato.</td></tr>'}</tbody></table></div>`;
}
async function quotes(el){
 const data=await request("/api/quotes"); const rows=Array.isArray(data)?data:(data.items||[]);
 el.innerHTML=pageHeader("Preventivi","Crea e monitora le proposte commerciali.")+`<div class="table-wrap"><table><thead><tr><th>PREVENTIVO</th><th>CLIENTE</th><th>IMPORTO</th><th>STATO</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>#${esc(String(x.id||"").slice(0,8))}</b></td><td>${esc(x.client?.nome||"—")}</td><td>${money(x.total??x.totale)}</td><td><span class="tag">${esc(x.stato||"BOZZA")}</span></td></tr>`).join("")||'<tr><td colspan="4" class="table-empty">Nessun preventivo presente.</td></tr>'}</tbody></table></div>`;
}
function assistant(el){
 el.innerHTML=pageHeader("Assistente AI","Prepara una risposta o un'azione per il tuo cliente.")+`<div class="assistant-card"><div class="assistant-symbol">✳</div><h2>Il tuo assistente commerciale</h2><p>Scrivi un messaggio per iniziare una conversazione. Le azioni operative sono gestite dalle API del backend.</p><form id="ai-form"><textarea name="message" rows="4" placeholder="Es. Aiutami a preparare una risposta per un cliente che chiede un preventivo…" required></textarea><button class="btn primary" type="submit">Invia messaggio →</button></form><div id="ai-response" class="ai-response"></div></div>`;
 $("#ai-form").onsubmit=async e=>{e.preventDefault();const msg=new FormData(e.currentTarget).get("message");const out=$("#ai-response");out.textContent="L'assistente sta elaborando…";try{const r=await request("/api/ai/message",{method:"POST",body:JSON.stringify({message:msg})});out.textContent=r.message||r.reply||JSON.stringify(r,null,2);}catch(err){out.textContent=err.message;}};
}
function bindActions(){
 document.querySelectorAll('[data-action="reload"]').forEach(b=>b.onclick=renderPage);
 document.querySelectorAll('[data-action="add"]').forEach(b=>b.onclick=()=>openClientModal());
 document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{state.page=b.dataset.page;renderPage();});
}
function openClientModal(){
 const modal=document.createElement("div");modal.className="modal-backdrop";modal.innerHTML=`<form class="modal-card" id="client-form"><button type="button" class="modal-close" aria-label="Chiudi">×</button><span class="eyebrow muted">NUOVO CONTATTO</span><h2>Aggiungi cliente</h2><label>Nome<input name="nome" required /></label><label>Cognome<input name="cognome" /></label><label>Email<input name="email" type="email" /></label><label>Telefono<input name="telefono" /></label><label>Azienda<input name="ragioneSociale" /></label><div class="modal-actions"><button type="button" class="btn secondary modal-cancel">Annulla</button><button class="btn primary" type="submit">Salva cliente</button></div><div class="form-error" id="modal-error"></div></form>`;
 document.body.append(modal);const close=()=>modal.remove();$(".modal-close",modal).onclick=close;$(".modal-cancel",modal).onclick=close;modal.onclick=e=>{if(e.target===modal)close();};
 $("#client-form",modal).onsubmit=async e=>{e.preventDefault();const body=Object.fromEntries(new FormData(e.currentTarget).entries());try{await request("/api/clients",{method:"POST",body:JSON.stringify(body)});close();notify("Cliente creato correttamente.");renderPage();}catch(err){$("#modal-error",modal).textContent=err.message;}};
}
if(state.token) loadApp(); else authView();
