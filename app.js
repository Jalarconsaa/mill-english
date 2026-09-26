'use strict';
/* ============ Utilidades y almacenamiento ============ */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];

function load(key, def) {
  try { const v = localStorage.getItem(key); return v ? Object.assign(structuredClone(def), JSON.parse(v)) : structuredClone(def); }
  catch { return structuredClone(def); }
}
const S = load('me_settings', { apiKey: '', model: 'gemini-2.5-flash', level: 'A2', goal: 20,
  autoSend: true, autoSpeak: true, rate: 0.95, backupModel: 'gemini-3.5-flash-lite',
  voices: { mattias: '', joel: '', alvaro: '', paul: '', local: '', narrator: '' }, pitch: 0.85, dictAnswer: 'type', spellAnswer: 'type', teamUrl: '' });
if (!S.voices) S.voices = {};
// Migrar voces elegidas con los nombres antiguos
[['lars', 'mattias'], ['mike', 'alvaro'], ['erik', 'paul']].forEach(([o, n]) => { if (S.voices[o] && !S.voices[n]) S.voices[n] = S.voices[o]; delete S.voices[o]; });
delete S.voices.jake;
['mattias', 'joel', 'alvaro', 'paul', 'local', 'narrator'].forEach(r => { if (S.voices[r] === undefined) S.voices[r] = ''; });

/* ---- Usuarios (perfiles) en este teléfono ---- */
const USER_COLORS = ['#F2B705', '#4DA3FF', '#B084F5', '#3DD68C', '#FF8A3D', '#FF6B8B', '#2EC4B6', '#E8E1D0'];
const newId = () => 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
let P = null;
try { P = JSON.parse(localStorage.getItem('me_profiles') || 'null'); } catch { P = null; }
if (!P || !P.list || !P.list.length) {
  // Primera vez con usuarios: el progreso anterior pasa al usuario "Yo"
  const id = newId();
  P = { current: id, list: [{ id, name: 'Yo', role: '', color: 0, level: S.level, goal: S.goal, created: Date.now() }] };
  try {
    const old = localStorage.getItem('me_data');
    if (old) localStorage.setItem('me_data_' + id, old);
    localStorage.setItem('me_profiles', JSON.stringify(P));
  } catch {}
}
if (!P.list.some(u => u.id === P.current)) P.current = P.list[0].id;
const me = () => P.list.find(u => u.id === P.current);
S.level = me().level || S.level; S.goal = me().goal || S.goal;
const D = load('me_data_' + P.current, { stats: {}, notes: [], listened: {} });
if (!D.listened) D.listened = {};

function persist() {
  try {
    const u = me(); u.level = S.level; u.goal = S.goal;
    localStorage.setItem('me_settings', JSON.stringify(S));
    localStorage.setItem('me_data_' + P.current, JSON.stringify(D));
    localStorage.setItem('me_profiles', JSON.stringify(P));
  } catch (e) { console.warn('No se pudo guardar', e); }
  scheduleSync();
}
function dataOf(id) { try { return JSON.parse(localStorage.getItem('me_data_' + id) || '{}'); } catch { return {}; } }
const initials = n => (n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

function dayKey(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function todayStats() {
  const k = dayKey();
  if (!D.stats[k]) D.stats[k] = { secs: 0, dict: 0, spell: 0, talk: 0, notes: 0, listen: 0 };
  if (D.stats[k].listen === undefined) D.stats[k].listen = 0;
  return D.stats[k];
}
function bump(field) { todayStats()[field]++; persist(); updateHome(); }

let toastTimer;
function toast(msg, ms = 2600) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

/* ============ Tiempo de práctica ============ */
let currentView = 'home', lastAct = 0;
function activity() {
  const now = Date.now();
  if (!['home', 'settings'].includes(currentView) && lastAct) {
    const gap = now - lastAct;
    if (gap < 90000) { todayStats().secs += gap / 1000; persist(); updateChip(); }
  }
  lastAct = now;
}
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, activity, { passive: true }));
document.addEventListener('visibilitychange', () => { if (document.hidden) lastAct = 0; });

/* ============ Navegación ============ */
function show(view) {
  activity();
  currentView = view;
  document.body.dataset.view = view;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  $$('.tabbar button').forEach(b => b.classList.toggle('on', b.dataset.view === view));
  $('#main').scrollTop = 0;
  if (view === 'home') updateHome();
  if (view === 'notes') { renderNotes(); if (D.notes.length && !todayStats().notes) bump('notes'); }
  if (view === 'dict' && !dict.items.length) loadDict(dict.cat);
  if (view === 'spell' && !spell.target) newSpell();
  if (view === 'listen') renderListenList();
  if (view === 'users') renderUsers();
}
$$('.tabbar button').forEach(b => b.addEventListener('click', () => show(b.dataset.view)));
$('#btnUser').addEventListener('click', () => show(currentView === 'users' ? 'home' : 'users'));
$('#btnSettings').addEventListener('click', () => show(currentView === 'settings' ? 'home' : 'settings'));
$('#btnCloseSettings').addEventListener('click', () => show('home'));
document.addEventListener('click', e => { if (e.target.closest('[data-open-settings]')) show('settings'); });
$$('.routine li').forEach(li => li.addEventListener('click', () => show(li.dataset.go)));

/* ============ Voz: hablar (TTS) ============ */
let voices = [];
// Heurística para detectar voces masculinas (los nombres varían según el teléfono)
const MALE_RX = /(^|[^a-z])(male|man|guy)([^a-z]|$)|daniel|david|mark|george|james|fred|alex|thomas|oliver|arthur|aaron|ryan|guy|iol|iom|tpd|rjs|gbd|gbg|gbc|male-/i;
const FEMALE_RX = /female|woman|girl|samantha|karen|victoria|susan|zira|hazel|kate|serena|moira|tessa|fiona|libby|sonia|jenny|aria|iob|iog|sfg|tpf|tpc|gba|gbb|fis/i;
const isMale = v => MALE_RX.test(v.name) && !FEMALE_RX.test(v.name);
const ROLE_LANGS = { mattias: ['en-GB', 'en-US'], joel: ['en-GB', 'en-AU', 'en-US'], alvaro: ['en-CA', 'en-US'], paul: ['en-GB', 'en-US'], local: ['en-US', 'en-GB'], narrator: ['en-US', 'en-GB'] };
function normLang(l) { return l.replace('_', '-'); }
function autoVoice(role) {
  const langs = ROLE_LANGS[role] || ['en-US'];
  const byLang = l => voices.filter(v => normLang(v.lang).toLowerCase() === l.toLowerCase());
  const wantMale = role !== 'narrator';
  for (const l of langs) { const m = byLang(l).filter(isMale); if (wantMale && m.length) return m[0]; }
  if (wantMale) { const m = voices.filter(isMale); if (m.length) return m[0]; }
  for (const l of langs) { const any = byLang(l); if (any.length) return any[0]; }
  return voices[0];
}
function voiceFor(role) {
  const name = S.voices[role];
  return voices.find(v => v.name === name) || autoVoice(role);
}
function loadVoices() {
  voices = speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('en'));
  const sorted = voices.slice().sort((a, b) => (isMale(b) - isMale(a)) || normLang(a.lang).localeCompare(normLang(b.lang)) || a.name.localeCompare(b.name));
  $$('.voice-sel').forEach(sel => {
    const role = sel.dataset.role;
    const auto = voices.length ? autoVoice(role) : null;
    sel.innerHTML = `<option value="">Automática${auto ? ' (' + esc(auto.name) + ')' : ''}</option>` +
      sorted.map(v => `<option value="${esc(v.name)}">${isMale(v) ? '♂ ' : ''}${esc(v.name)} (${esc(normLang(v.lang))})</option>`).join('');
    sel.value = voices.some(v => v.name === S.voices[role]) ? S.voices[role] : '';
  });
}
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

// role: 'mattias' | 'joel' | 'alvaro' | 'paul' | 'local' | 'narrator'
function speak(text, rate = S.rate, role = 'narrator') {
  return new Promise(res => {
    if (!('speechSynthesis' in window)) { toast('Este navegador no puede leer en voz alta.'); return res(); }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = voiceFor(role);
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
    u.rate = rate; u.pitch = role === 'narrator' ? 1 : S.pitch;
    u.onend = res; u.onerror = res;
    speechSynthesis.speak(u);
  });
}
async function speakSequence(parts, rate, gap = 250) {
  speechSynthesis.cancel();
  const token = (speakSequence.token = (speakSequence.token || 0) + 1);
  for (const p of parts) {
    if (token !== speakSequence.token) return;
    if (p === ' ') { await new Promise(r => setTimeout(r, gap * 2)); continue; }
    await speak(p, rate);
    await new Promise(r => setTimeout(r, gap));
  }
}

/* ============ Voz: escuchar (reconocimiento) ============ */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let activeRec = null;
function listen({ onInterim, onFinal, button }) {
  if (!SR) { toast('Tu navegador no reconoce voz. Usa Chrome en Android.'); return; }
  if (activeRec) { activeRec.stop(); return; }
  speechSynthesis.cancel();
  const rec = new SR();
  rec.lang = 'en-US'; rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = false;
  let finalText = '';
  rec.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' ';
      else interim += e.results[i][0].transcript;
    }
    onInterim && onInterim((finalText + interim).trim());
  };
  rec.onerror = e => {
    if (e.error === 'not-allowed') toast('Permite el uso del micrófono en los ajustes del navegador.');
    else if (e.error === 'no-speech') toast('No te escuché. Intenta de nuevo, más cerca del teléfono.');
    else if (e.error === 'network') toast('El reconocimiento de voz necesita internet.');
  };
  rec.onend = () => {
    activeRec = null; button && button.classList.remove('listening');
    if (finalText.trim()) onFinal && onFinal(finalText.trim());
  };
  activeRec = rec; button && button.classList.add('listening');
  rec.start();
}

/* ============ IA (Google Gemini, plan gratuito) ============ */
async function callModel(model, system, contents, temperature) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': S.apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature, responseMimeType: 'application/json' }
    })
  });
  if (!res.ok) {
    let detail = ''; try { detail = (await res.json()).error?.message || ''; } catch {}
    const err = new Error(detail || res.statusText); err.status = res.status; throw err;
  }
  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
  if (!text) { const err = new Error('La IA no devolvió respuesta.'); err.status = 500; throw err; }
  return parseJSON(text);
}
const wait = ms => new Promise(r => setTimeout(r, ms));
let fallbackNotified = '';
// Prueba el modelo principal; si Google está saturado (503) reintenta y luego usa el modelo de respaldo.
async function gemini(system, contents, temperature = 0.8) {
  if (!S.apiKey) throw new Error('NOKEY');
  const chain = [...new Set([S.model, S.backupModel, 'gemini-2.5-flash'].filter(Boolean))];
  let lastErr;
  for (const model of chain) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await callModel(model, system, contents, temperature);
        if (model !== S.model && fallbackNotified !== model) {
          fallbackNotified = model;
          toast(`${S.model} está saturado. Usando respaldo: ${model}`, 3500);
        }
        return r;
      } catch (e) {
        lastErr = e;
        if (e.status === 503 || e.status === 500 || e.status === 504) { if (attempt === 0) { await wait(1500); continue; } break; }
        if (e.status === 429 || e.status === 404) break;   // probar el siguiente modelo
        throw e;                                            // clave inválida, sin internet, etc.
      }
    }
  }
  throw lastErr;
}
function parseJSON(text) {
  const clean = text.replace(/```json|```/g, '').trim();
  try { return JSON.parse(clean); }
  catch { const m = clean.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); throw new Error('Respuesta de la IA con formato inválido.'); }
}
function aiErrorMsg(e) {
  if (e.message === 'NOKEY') return 'Primero configura tu clave gratuita de Gemini en Ajustes.';
  if (e.status === 503 || e.status === 500 || e.status === 504) return 'Los servidores de Google están saturados en este momento, incluso el modelo de respaldo. Espera un par de minutos o cambia de modelo en Ajustes.';
  if (e.status === 429) return 'Llegaste al límite gratuito por minuto o por día. Espera un momento y reintenta.';
  if (e.status === 400 && /api key/i.test(e.message)) return 'La clave no es válida. Revísala en Ajustes.';
  if (e.status === 403) return 'La clave no tiene permiso. Crea una nueva en Google AI Studio.';
  if (e.status === 404) return 'El modelo no existe. En Ajustes toca "Buscar modelos" y elige otro.';
  if (e instanceof TypeError) return 'Sin conexión a internet.';
  return 'Error de la IA: ' + e.message;
}

/* ============ Inicio (Hoy) ============ */
function updateChip() {
  const m = Math.floor(todayStats().secs / 60);
  $('#todayChip').textContent = `${m} / ${S.goal} min`;
}
function streak(stats = D.stats, goal = S.goal) {
  let n = 0; const d = new Date();
  const met = k => (stats[k]?.secs || 0) >= goal * 60;
  if (!met(dayKey(d))) d.setDate(d.getDate() - 1);
  while (met(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function updateHome() {
  updateChip();
  const st = todayStats(), m = Math.floor(st.secs / 60);
  const h = new Date().getHours();
  const nm = me().name && me().name !== 'Yo' ? ', ' + me().name.split(' ')[0] : '';
  $('#homeGreeting').textContent = (h < 12 ? 'Good morning' : h < 20 ? 'Good afternoon' : 'Good evening') + nm;
  $('#homeSub').textContent = m >= S.goal ? '¡Meta de hoy cumplida! Cada minuto extra suma.' : `Te faltan ${S.goal - m} min para tu meta de ${S.goal}.`;
  $('#meterFill').style.width = Math.min(100, st.secs / (S.goal * 60) * 100) + '%';
  $('#minsToday').textContent = `${m} min hoy`;
  const s = streak(); $('#streak').textContent = `Racha: ${s} ${s === 1 ? 'día' : 'días'}`;
  $('#r-dict').classList.toggle('done', st.dict >= 5);
  $('#r-spell').classList.toggle('done', st.spell >= 5);
  $('#r-talk').classList.toggle('done', st.talk >= 4);
  $('#r-listen').classList.toggle('done', st.listen >= 1);
  const u = me(); $('#btnUser').textContent = initials(u.name); $('#btnUser').style.setProperty('--uc', USER_COLORS[u.color] || USER_COLORS[0]);
  $('#r-notes').classList.toggle('done', st.notes >= 1);
  const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  let html = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const secs = D.stats[dayKey(d)]?.secs || 0;
    const pct = Math.min(100, secs / (S.goal * 60) * 100);
    html += `<div class="day"><div class="bar ${secs >= S.goal * 60 ? 'met' : ''}" style="height:${Math.max(3, pct * 0.8)}%" title="${Math.round(secs / 60)} min"></div>${i === 0 ? 'Hoy' : days[d.getDay()]}</div>`;
  }
  $('#week').innerHTML = html;
  $('#keyNotice').hidden = !!S.apiKey;
}

/* Botón de instalación */
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); installEvt = e;
  if ($('#btnInstall')) return;
  const b = document.createElement('button');
  b.id = 'btnInstall'; b.className = 'btn primary wide'; b.textContent = 'Instalar en el teléfono';
  b.onclick = async () => { installEvt.prompt(); await installEvt.userChoice; b.remove(); };
  $('#view-home .board').after(b);
});

/* ============ Notas de errores ============ */
function addNote({ original, corrected, explanation, type, sentence, source }) {
  if (!corrected || !original || original.trim().toLowerCase() === corrected.trim().toLowerCase()) return;
  const key = (original + '→' + corrected).toLowerCase().trim();
  const n = D.notes.find(n => n.key === key);
  if (n) { n.count++; n.last = Date.now(); if (sentence) n.sentence = sentence; }
  else D.notes.push({ key, original, corrected, explanation: explanation || '', type: type || 'grammar',
    sentence: sentence || '', source: source || '', count: 1, last: Date.now() });
  persist();
}

/* ============ Conversación ============ */
const talk = { history: [], active: false, busy: false };
const LEVEL_NOTES = {
  A1: 'The learner is a beginner. Use very simple, common words, very short sentences (maximum 8 words), mostly present tense. Ask simple yes/no or either/or questions.',
  A2: 'Use simple vocabulary and short sentences. Speak slowly and clearly. Avoid idioms.',
  B1: 'Use everyday vocabulary with some technical sawmill terms and a few common phrasal verbs.',
  B2: 'Speak naturally, with idioms and phrasal verbs common at work, like a real technician would.',
  C1: 'Speak like a native professional at normal speed: idioms, phrasal verbs, contractions, indirect and polite business language.',
  C2: 'Speak exactly like a native speaker: slang, idioms, humor, fast natural phrasing and cultural references.'
};
const STRICTNESS = {
  A1: 'Correct only the most important error (maximum 1-2). Be very encouraging.',
  A2: 'Correct only clear grammar and vocabulary errors. Be encouraging.',
  B1: 'Correct grammar, vocabulary and clearly unnatural phrases.',
  B2: 'Correct all errors, plus phrases that are correct but not natural.',
  C1: 'Be demanding: correct subtle errors, unnatural collocations, wrong register and tone.',
  C2: 'Be very demanding, like a native editor: flag anything a native speaker would not say, including subtle word choice, rhythm and register.'
};
[...new Set(SCENARIOS.map(s => s.group))].forEach(g => {
  const og = document.createElement('optgroup'); og.label = g;
  SCENARIOS.filter(s => s.group === g).forEach(s => { const o = document.createElement('option'); o.value = s.id; o.textContent = s.es; og.appendChild(o); });
  $('#scenario').appendChild(og);
});
// Sugerir a Paul para temas de jefatura y proyectos
$('#scenario').addEventListener('change', () => {
  const sc = SCENARIOS.find(s => s.id === $('#scenario').value);
  if ((sc.group === 'Supervisión y jefatura' || sc.id === 'upgrade' || sc.id === 'progress') ) $('#persona').value = 'paul';
});

function talkSystem() {
  const sc = SCENARIOS.find(s => s.id === $('#scenario').value), p = PERSONAS[$('#persona').value];
  return `You are ${p.en}
You are visiting a sawmill in Chile.
MILL CONTEXT: ${MILL_CONTEXT}
You are talking with a Chilean sawmill worker who is learning English. Their CEFR level is ${S.level}. Their goal is to communicate confidently with foreign technicians at work.
SCENARIO: ${sc.en}

RULES FOR YOUR REPLY:
- Stay in character. Talk like in a real conversation at the mill, never like a teacher.
- Keep each reply short: 1 to 3 sentences. ${LEVEL_NOTES[S.level]}
- Usually end with a question or something that invites the learner to answer.
- Use real sawmill vocabulary when it fits (saw blades, edger, trimmer, kiln, conveyor, bearings, PLC, lockout, shift, downtime...).

RULES FOR FEEDBACK about the learner's LAST message:
- The learner's text comes from speech recognition: ignore punctuation, capitalization and obvious transcription glitches. Focus on grammar, word choice, missing words, word order and phrases that sound unnatural.
- List only real mistakes, maximum 4, the most important first. If the message is correct, return an empty corrections list.
- Feedback level: ${STRICTNESS[S.level]}
- Explanations in simple Spanish (Chile), maximum 20 words each.
- If the learner writes in Spanish or mixes Spanish, put the English version in "natural" and in praise_es encourage them to say it in English.
- If the learner's message is "[START]", give no feedback and just open the conversation in character.

Respond ONLY with a JSON object, with exactly these keys:
{"corrections":[{"original":"wrong fragment as the learner said it","corrected":"corrected fragment","explanation_es":"...","type":"grammar|vocabulary|natural"}],
"natural":"how a native speaker would say the learner's whole message (empty string for [START])",
"score": integer 0-10 for correctness and naturalness (0 for [START]),
"praise_es":"one short encouraging comment in Spanish (empty for [START])",
"reply":"your in-character reply in English",
"reply_es":"Spanish translation of your reply"}`;
}

function chatAdd(html, cls) {
  const div = document.createElement('div'); div.className = cls; div.innerHTML = html;
  $('#chat').appendChild(div);
  requestAnimationFrame(() => div.scrollIntoView({ behavior: 'smooth', block: 'end' }));
  return div;
}
function addAIMsg(reply, replyEs) {
  const name = PERSONAS[$('#persona').value].name;
  const div = chatAdd(`<div class="who">${esc(name)}</div><div>${esc(reply)}</div>
    <div class="es" hidden>${esc(replyEs)}</div>
    <div class="tools"><button data-a="speak">🔊 Escuchar</button><button data-a="slow">🐢 Lento</button><button data-a="es">Traducir</button></div>`, 'msg ai');
  const role = $('#persona').value;
  if (S.level === 'A1') div.querySelector('.es').hidden = false;
  div.querySelector('[data-a=speak]').onclick = () => speak(reply, S.rate, role);
  div.querySelector('[data-a=slow]').onclick = () => speak(reply, 0.7, role);
  div.querySelector('[data-a=es]').onclick = () => { const e = div.querySelector('.es'); e.hidden = !e.hidden; };
  if (S.autoSpeak) speak(reply, S.rate, role);
}
function addFeedback(r, said) {
  const cs = Array.isArray(r.corrections) ? r.corrections : [];
  const perfect = !cs.length;
  let html = `<span class="score">${Number(r.score) || 0}/10</span><strong>${perfect ? 'Bien dicho' : 'Correcciones'}</strong>`;
  if (r.praise_es) html += `<div>${esc(r.praise_es)}</div>`;
  cs.forEach(c => {
    html += `<div class="fix"><span class="from">${esc(c.original)}</span> → <span class="to">${esc(c.corrected)}</span><span class="why">${esc(c.explanation_es)}</span></div>`;
    addNote({ original: c.original, corrected: c.corrected, explanation: c.explanation_es, type: c.type, sentence: r.natural, source: 'Conversación' });
  });
  if (r.natural && r.natural.trim().toLowerCase().replace(/[^a-z ]/g, '') !== said.trim().toLowerCase().replace(/[^a-z ]/g, '')) {
    html += `<div class="fix">Más natural: <span class="natural">${esc(r.natural)}</span> <button class="btn ghost small" data-a="nat">🔊</button></div>`;
  }
  const div = chatAdd(html, 'feedback' + (perfect ? '' : ' has-errors'));
  const nb = div.querySelector('[data-a=nat]'); if (nb) nb.onclick = () => speak(r.natural, S.rate, 'narrator');
}

async function talkCall(userText) {
  talk.history.push({ role: 'user', parts: [{ text: userText }] });
  if (talk.history.length > 24) { talk.history = talk.history.slice(-22); while (talk.history[0].role !== 'user') talk.history.shift(); }
  talk.busy = true; $('#btnSend').disabled = true;
  const typing = chatAdd('Escribiendo…', 'msg ai typing');
  try {
    const r = await gemini(talkSystem(), talk.history);
    typing.remove();
    if (userText !== '[START]') { addFeedback(r, userText); bump('talk'); }
    addAIMsg(r.reply || '…', r.reply_es || '');
    talk.history.push({ role: 'model', parts: [{ text: r.reply || '' }] });
    activity();
    return true;
  } catch (e) {
    typing.remove(); talk.history.pop();
    chatAdd(esc(aiErrorMsg(e)), 'feedback has-errors');
    return false;
  } finally { talk.busy = false; $('#btnSend').disabled = false; }
}

$('#btnStartTalk').addEventListener('click', async () => {
  if (!S.apiKey) { toast('Primero configura tu clave gratuita de Gemini.'); show('settings'); return; }
  talk.history = []; $('#chat').innerHTML = '';
  $('#talkSetup').hidden = true; $('#composer').hidden = false;
  const sc = SCENARIOS.find(s => s.id === $('#scenario').value);
  chatAdd(`<strong>${esc(sc.es)}</strong> con ${esc(PERSONAS[$('#persona').value].es)}. Responde hablando con el micrófono 🎙 o escribiendo.`, 'hints');
  const ok = await talkCall('[START]');
  if (!ok) { $('#talkSetup').hidden = false; $('#composer').hidden = true; }
});
$('#btnNewTalk').addEventListener('click', () => {
  speechSynthesis.cancel(); $('#chat').innerHTML = ''; talk.history = [];
  $('#talkSetup').hidden = false; $('#composer').hidden = true;
});
async function sendTalk() {
  const text = $('#talkInput').value.trim();
  if (!text || talk.busy) return;
  $('#talkInput').value = '';
  chatAdd(esc(text), 'msg me');
  const ok = await talkCall(text);
  if (!ok) $('#talkInput').value = text;
}
$('#btnSend').addEventListener('click', sendTalk);
$('#talkInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTalk(); } });
$('#btnMic').addEventListener('click', () => listen({
  button: $('#btnMic'),
  onInterim: t => { $('#talkInput').value = t; },
  onFinal: t => { $('#talkInput').value = t; if (S.autoSend) sendTalk(); }
}));
$('#btnHint').addEventListener('click', async () => {
  if (talk.busy) return;
  const btn = $('#btnHint'); btn.disabled = true;
  try {
    const r = await gemini(
      `You help a Chilean sawmill worker (CEFR ${S.level}) practice English conversation. Given the conversation so far, suggest 3 different short replies the learner could say next, natural and appropriate for level ${S.level}. Respond ONLY with JSON: {"suggestions":[{"en":"...","es":"Spanish translation"}]}`,
      [...talk.history, { role: 'user', parts: [{ text: '[HINT] Suggest what I could say next.' }] }], 0.9);
    const box = chatAdd('<strong>Puedes decir algo como:</strong>', 'hints');
    (r.suggestions || []).forEach(s => {
      const b = document.createElement('button');
      b.innerHTML = `${esc(s.en)}<small>${esc(s.es)}</small>`;
      b.onclick = () => { speak(s.en); toast('Escúchala y dila tú con el micrófono 🎙'); };
      box.appendChild(b);
    });
  } catch (e) { toast(aiErrorMsg(e), 4000); }
  finally { btn.disabled = false; }
});

/* ============ Comparación palabra por palabra ============ */
const norm = s => s.toLowerCase().replace(/[’‘`]/g, "'").replace(/[-–—/]/g, ' ').replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ').trim();
function diffWords(target, typed) {
  const A = norm(target).split(' ').filter(Boolean), B = norm(typed).split(' ').filter(Boolean);
  const dp = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0));
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--)
    dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = []; let i = 0, j = 0, segA = [], segB = [];
  const flush = () => {
    const n = Math.max(segA.length, segB.length);
    for (let k = 0; k < n; k++) {
      if (segA[k] !== undefined && segB[k] !== undefined) ops.push({ t: 'sub', a: segA[k], b: segB[k] });
      else if (segA[k] !== undefined) ops.push({ t: 'miss', a: segA[k] });
      else ops.push({ t: 'extra', b: segB[k] });
    }
    segA = []; segB = [];
  };
  while (i < A.length && j < B.length) {
    if (A[i] === B[j]) { flush(); ops.push({ t: 'ok', a: A[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) segA.push(A[i++]);
    else segB.push(B[j++]);
  }
  while (i < A.length) segA.push(A[i++]);
  while (j < B.length) segB.push(B[j++]);
  flush();
  const ok = ops.filter(o => o.t === 'ok').length;
  return { ops, score: A.length ? ok / A.length : 0 };
}
function renderOps(ops) {
  return ops.map(o => o.t === 'ok' ? `<span class="w-ok">${esc(o.a)}</span>`
    : o.t === 'sub' ? `<span class="w-bad">${esc(o.b)}</span><span class="w-fix">${esc(o.a)}</span>`
    : o.t === 'miss' ? `<span class="w-miss">${esc(o.a)}</span>`
    : `<span class="w-bad">${esc(o.b)}</span>`).join(' ');
}

/* ============ Dictado ============ */
const dict = { cat: 'seguridad', items: [], idx: 0, checked: false, total: 0, aiItems: [] };
function renderDictCats() {
  const cats = Object.keys(PHRASES).slice();
  if (D.notes.length) cats.push('errores');
  if (dict.aiItems.length) cats.push('ia');
  $('#dictCats').innerHTML = cats.map(c => `<button class="chip ${c === dict.cat ? 'on' : ''}" data-cat="${c}">${c === 'ia' ? 'Nuevas (IA)' : CATEGORY_NAMES[c]}</button>`).join('');
  $$('#dictCats .chip').forEach(b => b.onclick = () => loadDict(b.dataset.cat));
}
function loadDict(cat) {
  dict.cat = cat;
  if (cat === 'errores') {
    const seen = new Set();
    dict.items = D.notes.slice().sort((a, b) => b.count - a.count).map(n => {
      const en = n.sentence && n.sentence.split(' ').length <= 16 ? n.sentence : n.corrected;
      return { en, es: n.explanation };
    }).filter(it => it.en && !seen.has(it.en) && seen.add(it.en)).slice(0, 8);
    if (!dict.items.length) { toast('Aún no tienes errores guardados.'); return loadDict('seguridad'); }
  } else if (cat === 'ia') dict.items = dict.aiItems.slice();
  else {
    let pool = PHRASES[cat];
    if (S.level === 'A1') { const short = pool.filter(([en]) => en.split(' ').length <= 8); if (short.length >= 4) pool = short; }
    dict.items = shuffle(pool).slice(0, 8).map(([en, es]) => ({ en, es }));
  }
  dict.idx = 0; dict.total = 0; renderDictCats(); showDictItem();
}
function showDictItem() {
  dict.checked = false; dict.scored = false;
  $('#dictInput').value = ''; $('#dictResult').innerHTML = '';
  $('#dictCount').textContent = `${dict.idx + 1} / ${dict.items.length}`;
  $('#dictScore').textContent = dict.idx ? `Promedio ${Math.round(dict.total / dict.idx * 100)}%` : '';
  $('#dictNext').textContent = 'Saltar';
}
const curDict = () => dict.items[dict.idx];
$('#dictPlay').onclick = () => curDict() && speak(curDict().en);
$('#dictSlow').onclick = () => curDict() && speak(curDict().en, 0.65);
function checkDict() {
  if (!curDict()) return loadDict(dict.cat);
  if (dict.checked) return nextDict();
  const voice = S.dictAnswer === 'voice';
  const typed = $('#dictInput').value.trim();
  if (!typed) { toast(voice ? 'Escucha la frase, toca 🎙 y repítela.' : 'Escucha y escribe la frase primero.'); return; }
  const it = curDict(), { ops, score } = diffWords(it.en, typed);
  dict.checked = true; if (!dict.scored) { dict.scored = true; dict.total += score; bump('dict'); }
  const pct = Math.round(score * 100);
  const label = pct === 100 ? (voice ? '¡Se te entendió todo!' : 'Perfecto') : voice ? `Se entendió el ${pct}%` : pct + '% correcto';
  $('#dictResult').innerHTML = `<div class="verdict" style="color:${pct === 100 ? 'var(--ok)' : pct >= 70 ? 'var(--hivis)' : 'var(--bad)'}">${label}</div>
    <div class="line">${renderOps(ops)}</div>
    ${voice ? `<div class="heard">El teléfono escuchó: "${esc(typed)}"</div>` : ''}
    <div class="es">${esc(it.es)}</div>
    ${voice && pct < 100 ? '<p class="muted small">Las palabras marcadas no se entendieron: escúchalas de nuevo en lento y repite.</p>' : ''}`;
  ops.filter(o => o.t === 'sub' && o.b.length > 1).forEach(o =>
    addNote(voice
      ? { original: o.b, corrected: o.a, explanation: 'Pronunciación: el teléfono entendió otra palabra. Escúchala y repítela.', type: 'pronunciation', sentence: it.en, source: 'Dictado hablado' }
      : { original: o.b, corrected: o.a, explanation: 'Escuchaste mal o escribiste mal esta palabra.', type: 'spelling', sentence: it.en, source: 'Dictado' }));
  $('#dictNext').textContent = dict.idx + 1 < dict.items.length ? 'Siguiente' : 'Terminar';
}
function nextDict() {
  if (dict.idx + 1 >= dict.items.length) {
    const avg = Math.round(dict.total / dict.items.length * 100);
    $('#dictResult').innerHTML = `<div class="verdict">Ronda terminada: ${avg}% promedio</div><p class="muted">Elige otra categoría o toca Siguiente para repetir con frases mezcladas.</p>`;
    dict.idx = dict.items.length; dict.checked = false;
    $('#dictNext').onclick = () => { $('#dictNext').onclick = nextDict; loadDict(dict.cat); };
    return;
  }
  dict.idx++; showDictItem(); speak(curDict().en);
}
$('#dictCheck').onclick = checkDict;
function applyDictMode() {
  const voice = S.dictAnswer === 'voice';
  $$('#dictModes button').forEach(b => b.classList.toggle('on', b.dataset.answer === S.dictAnswer));
  $('#dictMic').hidden = !voice;
  $('#dictInput').readOnly = voice;
  $('#dictInput').placeholder = voice ? 'Toca 🎙 y repite la frase' : 'Escribe lo que escuchas';
  $('#dictCheck').hidden = voice;
}
$$('#dictModes button').forEach(b => b.onclick = () => { S.dictAnswer = b.dataset.answer; persist(); applyDictMode(); if (dict.items.length) showDictItem(); });
$('#dictMic').onclick = () => listen({ button: $('#dictMic'),
  onInterim: t => { $('#dictInput').value = t; },
  onFinal: t => { $('#dictInput').value = t; dict.checked = false; checkDict(); } });
$('#dictNext').onclick = nextDict;
$('#dictInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); checkDict(); } });
$('#dictAI').onclick = async () => {
  const btn = $('#dictAI'); btn.disabled = true; btn.textContent = 'Generando…';
  const weak = D.notes.filter(n => n.type === 'spelling').slice(-12).map(n => n.corrected).join(', ');
  const TOPIC_EN = { seguridad: 'safety', mantenimiento: 'maintenance', produccion: 'production', fallas: 'breakdowns and troubleshooting',
    social: 'small talk with visiting technicians', recepcion: 'log yard and log receiving', descortezador: 'ring debarker', resierra: 'resaw',
    trimmer: 'trimmer and optimizer', buzones: 'sorter bins', stacker: 'stacker and stickers', enzunchado: 'package strapping',
    antimancha: 'anti-sapstain dip treatment', pintado: 'package end painting and marking', supervision: 'supervisor and management meetings, KPIs, planning',
    canteadora: 'the new USNR edger with the BioLuma grade scanner and optimizer', proyecto: 'the sawmill upgrade project (remove return line, double infeed, two primary machines, two chipper canters, 28,000 to 45,000 cubic meters)' };
  const topic = TOPIC_EN[dict.cat] || 'mixed sawmill topics';
  try {
    const r = await gemini(
      `You create listening dictation exercises for a Chilean sawmill worker learning English (CEFR ${S.level}).`,
      [{ role: 'user', parts: [{ text: `Create 8 different sentences (6 to 14 words) that USNR service technicians (Swedish or Canadian) or coworkers would really say at a sawmill. Topic: ${topic}. Natural spoken English, level ${S.level}. Write numbers in digits. ${weak ? 'Try to include some of these words the learner got wrong before: ' + weak + '.' : ''} Respond ONLY with JSON: {"items":[{"en":"...","es":"Spanish (Chile) translation"}]}` }] }], 1);
    dict.aiItems = (r.items || []).filter(x => x.en);
    if (!dict.aiItems.length) throw new Error('No llegaron frases.');
    loadDict('ia'); toast('Frases nuevas listas. Toca ▶ Escuchar.');
  } catch (e) { toast(aiErrorMsg(e), 4000); }
  finally { btn.disabled = false; btn.textContent = 'Generar frases nuevas con IA'; }
};

/* ============ Deletreo ============ */
const spell = { mode: 'words', target: null, checked: false };
const SPELL_HELP = {
  words: 'Escucha la palabra técnica y escríbela. Usa "Letra por letra" si la necesitas deletreada.',
  codes: 'Escucha el código deletreado (como un número de parte) y escríbelo. Los guiones y espacios no importan.',
  numbers: 'Escucha la cifra y escríbela solo con números. Ojo con thirteen (13) y thirty (30).',
  nato: 'Di el código en voz alta con el alfabeto fonético (ej: "Sierra Kilo two"). Toca 🎙 o escríbelo.'
};
const SPELL_HELP_VOICE = {
  words: 'Escucha la palabra y deletréala en voz alta, letra por letra (ej: "B, E, A, R, I, N, G"). Toca 🎙 y habla sin pausas largas.',
  codes: 'Lee el código en voz alta, letra por letra, como si se lo dictaras a un técnico por teléfono. Toca 🎙.',
  numbers: 'Di la cifra en voz alta en inglés (ej: "one thousand four hundred fifty"). Toca 🎙.',
  nato: SPELL_HELP.nato
};
const spellVoice = () => S.spellAnswer === 'voice' || spell.mode === 'nato';
const showsTarget = () => spell.mode === 'nato' || (S.spellAnswer === 'voice' && (spell.mode === 'codes' || spell.mode === 'numbers'));
// Nombres de letras como los escribe el reconocimiento de voz
const LETTER_WORDS = { ay: 'a', bee: 'b', be: 'b', see: 'c', sea: 'c', si: 'c', dee: 'd', de: 'd', ee: 'e', ef: 'f', eff: 'f',
  gee: 'g', jee: 'g', aitch: 'h', age: 'h', eich: 'h', eye: 'i', aye: 'i', jay: 'j', kay: 'k', el: 'l', ell: 'l', em: 'm', en: 'n',
  oh: 'o', pee: 'p', pea: 'p', cue: 'q', queue: 'q', are: 'r', ar: 'r', our: 'r', es: 's', ess: 's', tee: 't', tea: 't',
  you: 'u', vee: 'v', ex: 'x', why: 'y', zee: 'z', zed: 'z' };
function parseSpelled(text, mode) {
  let t = text.toLowerCase().replace(/double[\s-]?(u|you)/g, ' w ').replace(/x[\s-]?ray/g, ' xray ')
    .replace(/\b(dash|hyphen|space|minus)\b/g, ' ').replace(/[^a-z0-9 ]/g, ' ');
  let out = '';
  t.split(/\s+/).filter(Boolean).forEach(w => {
    if (/^[0-9]+$/.test(w)) out += w;
    else if (mode === 'codes' && DIGIT_REV[w] && !(w.length === 1 && w !== 'o')) out += DIGIT_REV[w];
    else if (w.length === 1) out += mode === 'codes' && w === 'o' ? '0' : w;
    else if (LETTER_WORDS[w]) out += LETTER_WORDS[w];
    else if (NATO_REV[w]) out += NATO_REV[w].toLowerCase();
    else if (DIGIT_REV[w]) out += DIGIT_REV[w];
    else out += w;   // a veces el teléfono junta las letras en una palabra
  });
  return out;
}
// Convierte una cifra dicha en inglés a número ("one thousand four hundred fifty" → 1450)
function spokenNumber(text) {
  const t = text.toLowerCase().replace(/,/g, '').trim();
  const m = t.match(/\d+(\.\d+)?/);
  if (m) return m[0];
  const U = { zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
    twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
    twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  const [intPart, decPart] = t.split(/\bpoint\b/);
  let total = 0, cur = 0, found = false;
  intPart.split(/[\s-]+/).forEach(w => {
    if (w in U) { cur += U[w]; found = true; }
    else if (w === 'hundred') { cur = (cur || 1) * 100; found = true; }
    else if (w === 'thousand') { total += (cur || 1) * 1000; cur = 0; found = true; }
  });
  if (!found) return t;
  let res = String(total + cur);
  if (decPart) res += '.' + decPart.trim().split(/\s+/).map(w => (w in U ? U[w] : '')).join('');
  return res;
}
const CONFUSING = 'AEIGJBVPDKQYRUHW';
const LETTERS = 'ABCDEFGHIJKLMNPQRSTUVWXYZ' + CONFUSING; // sin O para no confundir con 0
const rl = () => pick(LETTERS), rd = () => String(Math.floor(Math.random() * 10));
function makeCode() {
  const pats = [
    () => rl() + rl() + rl() + '-' + rd() + rd() + rd() + rd(),
    () => rl() + rd() + rd() + '-' + rl() + rl(),
    () => 'SN ' + rd() + rd() + rl() + rd() + rl() + rd(),
    () => rl() + rl() + ' ' + rd() + rd() + rd(),
    () => rd() + rd() + rl() + '-' + rl() + rd() + rl()
  ];
  return pick(pats)();
}
function makeNumber() {
  const units = ['bar', 'RPM', 'millimeters', 'inches', 'logs', 'boards', 'meters', 'degrees', 'percent', 'hours', 'kilos'];
  const kinds = [
    () => pick([13, 14, 15, 16, 17, 18, 19, 30, 40, 50, 60, 70, 80, 90]),
    () => Math.floor(Math.random() * 900 + 100),
    () => Math.floor(Math.random() * 9000 + 1000),
    () => (Math.floor(Math.random() * 99) + 1) / 10,
    () => Math.floor(Math.random() * 80 + 20)
  ];
  const n = pick(kinds)();
  return { value: String(n), unit: pick(units) };
}
function charSpeech(ch) {
  if (/[0-9]/.test(ch)) return DIGIT_WORDS[+ch];
  if (ch === '-') return 'dash';
  if (ch === ' ') return ' ';
  return ch.toUpperCase() + '.';
}
function newSpell() {
  spell.checked = false; spell.scored = false;
  $('#spellInput').value = ''; $('#spellResult').innerHTML = '';
  const isNato = spell.mode === 'nato', voice = spellVoice(), shown = showsTarget();
  $$('#spellAnswer button').forEach(b => b.classList.toggle('on', b.dataset.answer === S.spellAnswer));
  $('#spellAnswer').hidden = isNato;
  $('#spellHelp').textContent = (voice ? SPELL_HELP_VOICE : SPELL_HELP)[spell.mode];
  $('#spellTarget').hidden = !shown; $('#spellMic').hidden = !voice;
  $('#spellPlay').textContent = shown ? '▶ Escuchar respuesta' : '▶ Escuchar';
  $('#spellSlow').hidden = isNato || spell.mode === 'numbers';
  $('#spellSlow').textContent = spell.mode === 'codes' ? '🐢 Más lento' : '🐢 Letra por letra';
  $('#spellInput').readOnly = voice && !isNato;
  $('#spellCheck').hidden = voice && !isNato;
  $('#spellInput').placeholder = isNato ? 'O escribe: Sierra Kilo two…' : voice ? 'Toca 🎙 y habla' : spell.mode === 'numbers' ? 'Solo números, ej: 1450' : 'Escribe aquí';
  $('#spellInput').inputMode = spell.mode === 'numbers' && !voice ? 'decimal' : 'text';
  if (spell.mode === 'words') { const [en, es] = pick(WORDS); spell.target = { text: en, es }; }
  else if (spell.mode === 'codes') spell.target = { text: makeCode() };
  else if (spell.mode === 'numbers') { const n = makeNumber(); spell.target = { text: n.value, unit: n.unit }; }
  else { let c = ''; const len = 4 + Math.floor(Math.random() * 3); for (let i = 0; i < len; i++) c += Math.random() < 0.7 ? rl() : rd(); spell.target = { text: c }; }
  $('#spellTarget').textContent = spell.target.text + (spell.mode === 'numbers' ? ' ' + spell.target.unit : '');
  $('#spellNext').textContent = 'Saltar';
}
function playSpell(slow) {
  const t = spell.target; if (!t) return;
  if (spell.mode === 'words') return slow ? speakSequence(t.text.split('').map(charSpeech), 0.8, 150) : speak(t.text);
  if (spell.mode === 'codes') return speakSequence(t.text.split('').map(charSpeech), slow ? 0.7 : 0.95, slow ? 450 : 200);
  if (spell.mode === 'numbers') return speak(`${t.value || t.text} ${t.unit}`);
  return speakSequence(t.text.split('').map(c => /[0-9]/.test(c) ? DIGIT_WORDS[+c] : NATO[c]), 0.9, 250);
}
$('#spellPlay').onclick = () => playSpell(false);
$('#spellSlow').onclick = () => playSpell(true);

const NATO_REV = Object.fromEntries(Object.entries(NATO).map(([k, v]) => [v.toLowerCase().replace('-', ''), k]));
Object.assign(NATO_REV, { alfa: 'A', juliett: 'J', whisky: 'W', xray: 'X', yanky: 'Y', charly: 'C', hotels: 'H', mic: 'M', papa: 'P', pappa: 'P', kilo: 'K', keylo: 'K' });
const DIGIT_REV = { zero: '0', oh: '0', o: '0', one: '1', won: '1', two: '2', to: '2', too: '2', three: '3', tree: '3', four: '4', for: '4', fore: '4', five: '5', fife: '5', six: '6', seven: '7', eight: '8', ate: '8', nine: '9', niner: '9' };
function parseNato(text) {
  const tokens = text.toLowerCase().replace(/x[\s-]?ray/g, 'xray').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const out = [];
  tokens.forEach(t => {
    if (/^[0-9]+$/.test(t)) t.split('').forEach(d => out.push({ ch: d, word: d }));
    else if (NATO_REV[t]) out.push({ ch: NATO_REV[t], word: t });
    else if (DIGIT_REV[t]) out.push({ ch: DIGIT_REV[t], word: t });
    else out.push({ ch: '?', word: t });
  });
  return out.filter(o => o.ch !== '?' || o.word.length > 1);
}
function charDiffHTML(target, typed) {
  // Marca letra por letra con alineación simple (LCS)
  const A = target.split(''), B = typed.split('');
  const dp = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0));
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--)
    dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  let i = 0, j = 0, out = '';
  while (i < A.length || j < B.length) {
    if (i < A.length && j < B.length && A[i] === B[j]) { out += `<span class="w-ok">${esc(A[i])}</span>`; i++; j++; }
    else if (j < B.length && (i >= A.length || dp[i][j + 1] >= dp[i + 1][j])) { out += `<span class="w-bad">${esc(B[j])}</span>`; j++; }
    else { out += `<span class="w-miss">${esc(A[i])}</span>`; i++; }
  }
  return out;
}
function checkSpell() {
  if (spell.checked) return newSpellAndPlay();
  const raw = $('#spellInput').value.trim();
  const voice = spellVoice();
  if (!raw) { toast(voice ? 'Toca 🎙 y habla.' : 'Escribe tu respuesta primero.'); return; }
  const t = spell.target; let ok = false, html = '';
  const heardLine = voice && spell.mode !== 'nato' ? `<div class="heard">El teléfono escuchó: "${esc(raw)}"</div>` : '';
  if (spell.mode === 'words') {
    const typed = voice ? parseSpelled(raw, 'words') : raw.toLowerCase();
    ok = typed === t.text;
    html = `<div class="line">${ok ? `<span class="w-ok">${esc(t.text)}</span>` : charDiffHTML(t.text, typed)}</div>
      <div class="es">${esc(t.text)} = ${esc(t.es)} · ${t.text.toUpperCase().split('').join(' ')}</div>`;
    if (!ok) addNote({ original: typed, corrected: t.text, explanation: `Deletreo: ${t.text.toUpperCase().split('').join('-')} (${t.es})`, type: 'spelling', source: 'Deletreo' });
  } else if (spell.mode === 'codes') {
    const clean = s => s.toUpperCase().replace(/[\s-]/g, '');
    const got = voice ? parseSpelled(raw, 'codes') : raw;
    ok = clean(got) === clean(t.text);
    html = `<div class="line">${charDiffHTML(clean(t.text), clean(got))}</div><div class="es">Código: ${esc(t.text)}</div>`;
  } else if (spell.mode === 'numbers') {
    const clean = s => { s = s.replace(/\s/g, ''); s = t.text.includes('.') ? s.replace(',', '.') : s.replace(/[.,]/g, ''); return s.replace(/^0+(?=\d)/, ''); };
    const got = voice ? spokenNumber(raw) : raw;
    ok = clean(got) === t.text;
    const note = t.text.includes('.') ? '<div class="es">En inglés el decimal se dice "point" y se escribe con punto.</div>' : '';
    html = `<div class="line">${ok ? `<span class="w-ok">${esc(t.text)}</span>` : `<span class="w-bad">${esc(got)}</span> <span class="w-fix">${esc(t.text)}</span>`} ${esc(t.unit)}</div>${note}`;
  } else {
    const heard = parseNato(raw), want = t.text.split('');
    ok = heard.length === want.length && heard.every((h, k) => h.ch === want[k]);
    html = '<div class="line">' + want.map((c, k) => {
      const h = heard[k]; const good = h && h.ch === c;
      const exp = /[0-9]/.test(c) ? DIGIT_WORDS[+c] : NATO[c];
      return `<span class="${good ? 'w-ok' : 'w-miss'}">${c}: ${esc(exp)}${!good && h ? ` <small class="w-bad">(${esc(h.word)})</small>` : ''}</span>`;
    }).join('<br>') + '</div>';
    if (heard.length > want.length) html += `<div class="es">Dijiste palabras de más: ${esc(heard.slice(want.length).map(h => h.word).join(' '))}</div>`;
  }
  if (!spell.scored) { spell.scored = true; bump('spell'); }
  spell.checked = true;
  $('#spellResult').innerHTML = `<div class="verdict" style="color:${ok ? 'var(--ok)' : 'var(--bad)'}">${ok ? 'Correcto' : 'Revisa las marcas'}</div>${html}${heardLine}
    ${voice && !ok ? '<p class="muted small">Puedes tocar 🎙 otra vez para reintentar.</p>' : ''}`;
  $('#spellNext').textContent = 'Siguiente';
}
function newSpellAndPlay() { newSpell(); if (!showsTarget()) playSpell(false); }
$$('#spellAnswer button').forEach(b => b.onclick = () => { S.spellAnswer = b.dataset.answer; persist(); newSpell(); });
$('#spellCheck').onclick = checkSpell;
$('#spellNext').onclick = newSpellAndPlay;
$('#spellInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); checkSpell(); } });
$('#spellMic').onclick = () => listen({ button: $('#spellMic'), onInterim: t => { $('#spellInput').value = t; }, onFinal: t => { $('#spellInput').value = t; spell.checked = false; checkSpell(); } });
$$('#spellModes .chip').forEach(b => b.onclick = () => {
  $$('#spellModes .chip').forEach(x => x.classList.toggle('on', x === b));
  spell.mode = b.dataset.mode; newSpell();
});
$('#natoGrid').innerHTML = Object.entries(NATO).map(([k, v]) => `<button data-w="${v}"><b>${k}</b>${v}</button>`).join('');
$$('#natoGrid button').forEach(b => b.onclick = () => speak(b.dataset.w));

/* ============ Errores ============ */
function renderNotes() {
  const list = D.notes.slice().sort((a, b) => b.count - a.count || b.last - a.last);
  $('#notesSummary').textContent = list.length ? `${list.length} errores guardados. Los más repetidos aparecen primero.` : '';
  $('#notesPractice').hidden = !list.length;
  if (!list.length) { $('#notesList').innerHTML = '<div class="empty">Aquí se guardan tus errores de conversación, dictado y deletreo para repasarlos. Todavía no hay ninguno: ¡a practicar!</div>'; return; }
  $('#notesList').innerHTML = list.map(n => `<div class="note">
    <button class="del" data-k="${esc(n.key)}" aria-label="Borrar">×</button>
    <span class="from">${esc(n.original)}</span><span class="to">${esc(n.corrected)} <button class="btn ghost small" data-say="${esc(n.sentence || n.corrected)}">🔊</button></span>
    ${n.explanation ? `<div class="why">${esc(n.explanation)}</div>` : ''}
    ${n.sentence ? `<div class="why">Ej: ${esc(n.sentence)}</div>` : ''}
    <div class="meta">${esc(n.source)} · ${n.count} ${n.count === 1 ? 'vez' : 'veces'}</div></div>`).join('');
  $$('#notesList [data-say]').forEach(b => b.onclick = () => speak(b.dataset.say));
  $$('#notesList .del').forEach(b => b.onclick = () => { D.notes = D.notes.filter(n => n.key !== b.dataset.k); persist(); renderNotes(); });
}
$('#notesPractice').onclick = () => { show('dict'); loadDict('errores'); };

/* ============ Ajustes ============ */
function fillModels(list) {
  const set = new Set(list); set.add(S.model); if (S.backupModel) set.add(S.backupModel);
  const opts = [...set].map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
  $('#model').innerHTML = opts; $('#model').value = S.model;
  $('#backupModel').innerHTML = opts; $('#backupModel').value = S.backupModel;
}
function initSettings() {
  $('#apiKey').value = S.apiKey; $('#level').value = S.level; $('#goal').value = String(S.goal);
  $('#autoSend').checked = S.autoSend; $('#autoSpeak').checked = S.autoSpeak;
  $('#rate').value = S.rate; $('#rateVal').textContent = S.rate + 'x';
  $('#pitch').value = S.pitch; $('#pitchVal').textContent = S.pitch;
  fillModels(['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash']);
}
$('#apiKey').addEventListener('change', e => { S.apiKey = e.target.value.trim(); persist(); updateHome(); });
$('#model').addEventListener('change', e => { S.model = e.target.value; fallbackNotified = ''; persist(); });
$('#backupModel').addEventListener('change', e => { S.backupModel = e.target.value; persist(); });
$('#level').addEventListener('change', e => { S.level = e.target.value; persist(); });
$('#goal').addEventListener('change', e => { S.goal = +e.target.value; persist(); updateHome(); });
$('#autoSend').addEventListener('change', e => { S.autoSend = e.target.checked; persist(); });
$('#autoSpeak').addEventListener('change', e => { S.autoSpeak = e.target.checked; persist(); });
$$('.voice-sel').forEach(sel => sel.addEventListener('change', e => { S.voices[sel.dataset.role] = e.target.value; persist(); }));
const TEST_LINES = {
  mattias: ["Hi, I'm Mattias. Let's check the edger together.", 'mattias'],
  joel: ["Hey, I'm Joel. I'll take care of the scanner today.", 'joel'],
  alvaro: ["Hi, I'm Alvaro. How's the trimmer running today?", 'alvaro'],
  paul: ["Good morning, I'm Paul. Let's review the project schedule.", 'paul'],
  local: ["Hi, I'm Carlos, the shift supervisor.", 'local'],
  narrator: ['The saw blades are ready. Please check the tension.', 'narrator']
};
$$('[data-test]').forEach(b => b.onclick = () => { const [line, role] = TEST_LINES[b.dataset.test]; speak(line, S.rate, role); });
$('#pitch').addEventListener('input', e => { S.pitch = +e.target.value; $('#pitchVal').textContent = S.pitch; persist(); });
$('#rate').addEventListener('input', e => { S.rate = +e.target.value; $('#rateVal').textContent = S.rate + 'x'; persist(); });
$('#btnModels').onclick = async () => {
  S.apiKey = $('#apiKey').value.trim(); persist();
  if (!S.apiKey) { toast('Pega tu clave primero.'); return; }
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': S.apiKey } });
    if (!res.ok) throw Object.assign(new Error((await res.json()).error?.message || res.statusText), { status: res.status });
    const data = await res.json();
    const models = (data.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => m.name.replace('models/', ''))
      .filter(n => /^gemini/.test(n) && !/(embed|tts|image|live|audio|vision|exp)/.test(n))
      .sort((a, b) => (b.includes('flash') - a.includes('flash')) || b.localeCompare(a));
    if (!models.length) throw new Error('No se encontraron modelos compatibles.');
    fillModels(models);
    if (!models.includes(S.model)) { S.model = models[0]; $('#model').value = S.model; persist(); }
    toast(`${models.length} modelos encontrados. Recomendado: uno "flash".`);
  } catch (e) { toast(aiErrorMsg(e), 4000); }
};
$('#btnTestKey').onclick = async () => {
  S.apiKey = $('#apiKey').value.trim(); persist(); updateHome();
  $('#keyStatus').textContent = 'Probando…';
  try {
    const r = await gemini('Reply only with JSON.', [{ role: 'user', parts: [{ text: 'Return {"ok":true,"msg":"a short friendly greeting for a sawmill worker"}' }] }], 0.5);
    $('#keyStatus').textContent = '✓ Conexión correcta: ' + (r.msg || 'OK');
  } catch (e) { $('#keyStatus').textContent = aiErrorMsg(e); }
};
$('#btnExport').onclick = () => {
  const { apiKey, ...rest } = S;
  const blob = new Blob([JSON.stringify({ settings: rest, data: D }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `mill-english-respaldo-${dayKey()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
$('#fileImport').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (j.settings) Object.assign(S, j.settings, { apiKey: S.apiKey });
    if (j.data) { D.stats = j.data.stats || {}; D.notes = j.data.notes || []; }
    persist(); initSettings(); updateHome(); toast('Respaldo importado.');
  } catch { toast('Ese archivo no es un respaldo válido.'); }
  e.target.value = '';
});
$('#btnReset').onclick = () => {
  if (!confirm('¿Borrar todo tu progreso y errores guardados? La clave se mantiene.')) return;
  D.stats = {}; D.notes = []; persist(); updateHome(); toast('Progreso borrado.');
};

/* ============ Listening (conversaciones para escuchar) ============ */
const TOPIC_COLORS = { edger: 'var(--c-spell)', upgrade: 'var(--c-talk)', ops: 'var(--c-dict)', social: 'var(--c-notes)', ai: 'var(--c-listen)' };
const SPEAKER_COLORS = ['var(--c-talk)', 'var(--c-home)', 'var(--c-dict)'];
const lst = { topic: 'all', dlg: null, showText: false, showEs: false, answers: {} };
function customDialogs() { try { return JSON.parse(localStorage.getItem('me_dialogs') || '[]'); } catch { return []; } }
function saveCustomDialogs(list) { try { localStorage.setItem('me_dialogs', JSON.stringify(list.slice(0, 40))); } catch {} }
function allDialogs() { return [...customDialogs(), ...DIALOGS]; }
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
function renderListenList() {
  const topics = { all: 'Todas', ...LISTEN_TOPICS, ai: 'Creadas con IA' };
  $('#listenTopics').innerHTML = Object.entries(topics).map(([k, v]) => `<button class="chip ${k === lst.topic ? 'on' : ''}" data-t="${k}">${v}</button>`).join('');
  $$('#listenTopics .chip').forEach(b => b.onclick = () => { lst.topic = b.dataset.t; renderListenList(); });
  const myLvl = LEVEL_ORDER.indexOf(S.level);
  let list = allDialogs().filter(d => lst.topic === 'all' || d.topic === lst.topic);
  // Primero las de tu nivel o cercanas
  list.sort((a, b) => Math.abs(LEVEL_ORDER.indexOf(a.level) - myLvl) - Math.abs(LEVEL_ORDER.indexOf(b.level) - myLvl));
  $('#listenList').innerHTML = list.length ? list.map(d => {
    const done = D.listened[d.id];
    return `<button class="dlg-card" data-id="${esc(d.id)}" style="--tc:${TOPIC_COLORS[d.topic] || 'var(--c-listen)'}">
      <div class="t"><strong>${esc(d.title)}</strong>
      <span class="badge">${esc(LISTEN_TOPICS[d.topic] || 'IA')}</span><span class="badge lvl">${esc(d.level)}</span>
      <small>${esc(d.speakers.A[0])} y ${esc(d.speakers.B[0])}</small></div>
      ${done !== undefined ? `<span class="dlg-score">${done}%</span>` : ''}</button>`;
  }).join('') : '<div class="empty">No hay conversaciones en este tema todavía. Crea una con IA abajo.</div>';
  $$('#listenList .dlg-card').forEach(b => b.onclick = () => openDialog(b.dataset.id));
}
function openDialog(id) {
  const d = allDialogs().find(x => x.id === id); if (!d) return;
  lst.dlg = d; lst.answers = {}; lst.showText = false; lst.showEs = S.level === 'A1';
  $('#listenBrowse').hidden = true; $('#listenPlayer').hidden = false; $('#main').scrollTop = 0;
  $('#lpTitle').textContent = d.title; $('#lpContext').textContent = d.context || '';
  $('#lpResult').innerHTML = '';
  renderTranscript(); renderQuestions();
}
function speakerColor(d, key) { return SPEAKER_COLORS[Object.keys(d.speakers).indexOf(key)] || 'var(--c-listen)'; }
function renderTranscript() {
  const d = lst.dlg;
  $('#lpShowText').textContent = lst.showText ? 'Ocultar texto' : 'Mostrar texto';
  $('#lpShowEs').textContent = lst.showEs ? 'Ocultar traducción' : 'Mostrar traducción';
  $('#lpLines').innerHTML = d.lines.map(([sp, en, es], i) => `<div class="tline" data-i="${i}" style="--sc:${speakerColor(d, sp)}">
    <span class="sp">${esc(d.speakers[sp][0])}:</span> <span class="en ${lst.showText ? '' : 'hide'}">${esc(en)}</span>
    ${lst.showEs ? `<div class="es">${esc(es)}</div>` : ''}</div>`).join('');
  $$('#lpLines .tline').forEach(el => el.onclick = () => playLines(+el.dataset.i, +el.dataset.i, S.rate));
}
function renderQuestions() {
  const d = lst.dlg;
  // Las opciones se muestran en orden aleatorio
  $('#lpQuestions').innerHTML = d.questions.map((q, qi) => `<div class="q" data-q="${qi}"><strong>${qi + 1}. ${esc(q.q)}</strong>
    <div class="qes">${esc(q.es || '')}</div>
    ${shuffle(q.o.map((o, oi) => [o, oi])).map(([o, oi]) => `<button data-o="${oi}">${esc(o)}</button>`).join('')}</div>`).join('');
  $$('#lpQuestions .q').forEach(box => box.querySelectorAll('button').forEach(b => b.onclick = () => answerQ(+box.dataset.q, +b.dataset.o, box)));
}
function answerQ(qi, oi, box) {
  if (lst.answers[qi] !== undefined) return;
  const q = lst.dlg.questions[qi]; lst.answers[qi] = oi === q.a;
  box.querySelectorAll('button').forEach(b => { const i = +b.dataset.o; if (i === q.a) b.classList.add('right'); else if (i === oi) b.classList.add('wrong'); });
  const n = Object.keys(lst.answers).length;
  if (n === lst.dlg.questions.length) {
    const good = Object.values(lst.answers).filter(Boolean).length;
    const pct = Math.round(good / n * 100);
    const first = D.listened[lst.dlg.id] === undefined;
    D.listened[lst.dlg.id] = Math.max(pct, D.listened[lst.dlg.id] || 0);
    if (first || !todayStats().listen) bump('listen'); else persist();
    $('#lpResult').innerHTML = `<div class="verdict" style="color:${pct === 100 ? 'var(--ok)' : pct >= 60 ? 'var(--c-home)' : 'var(--bad)'}">${good} de ${n} correctas</div>
      <p class="muted">${pct === 100 ? '¡Excelente comprensión!' : 'Escucha otra vez con el texto visible para ver lo que se te escapó.'}</p>`;
  }
}
let playToken = 0;
async function playLines(from, to, rate) {
  const d = lst.dlg, token = ++playToken;
  speechSynthesis.cancel();
  const roles = Object.fromEntries(Object.entries(d.speakers).map(([k, v]) => [k, v[1]]));
  // Si los dos hablantes quedan con la misma voz, cambiamos el tono del segundo
  const sameVoice = voiceFor(roles.A)?.name === voiceFor(roles.B)?.name;
  $('#lpPlay').textContent = '■ Detener';
  for (let i = from; i <= to; i++) {
    if (token !== playToken) return;
    $$('#lpLines .tline').forEach(el => el.classList.toggle('now', +el.dataset.i === i));
    const [sp, en] = d.lines[i];
    await speakAs(en, rate, roles[sp], sameVoice && sp === 'B' ? 1.2 : null);
    await wait(350);
  }
  if (token === playToken) { $$('#lpLines .tline').forEach(el => el.classList.remove('now')); $('#lpPlay').textContent = '▶ Escuchar conversación'; }
}
function speakAs(text, rate, role, pitchOverride) {
  return new Promise(res => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = voiceFor(role); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
    u.rate = rate; u.pitch = pitchOverride || (role === 'local' || role === 'narrator' ? 1 : S.pitch);
    u.onend = res; u.onerror = res; speechSynthesis.speak(u);
  });
}
$('#lpPlay').onclick = () => {
  if ($('#lpPlay').textContent.startsWith('■')) { playToken++; speechSynthesis.cancel(); $('#lpPlay').textContent = '▶ Escuchar conversación'; $$('#lpLines .tline').forEach(el => el.classList.remove('now')); return; }
  playLines(0, lst.dlg.lines.length - 1, S.rate);
};
$('#lpSlow').onclick = () => playLines(0, lst.dlg.lines.length - 1, 0.7);
$('#lpShowText').onclick = () => { lst.showText = !lst.showText; renderTranscript(); };
$('#lpShowEs').onclick = () => { lst.showEs = !lst.showEs; renderTranscript(); };
$('#listenBack').onclick = () => { playToken++; speechSynthesis.cancel(); $('#listenPlayer').hidden = true; $('#listenBrowse').hidden = false; renderListenList(); };
$('#listenAI').onclick = async () => {
  const btn = $('#listenAI'); btn.disabled = true; btn.textContent = 'Creando conversación…';
  try {
    const r = await gemini(
      `You write realistic listening-practice dialogues for Chilean sawmill workers learning English. ${MILL_CONTEXT}
Available speakers (use exactly these role ids): "mattias" (Swedish USNR technician), "joel" (Swedish USNR scanner specialist), "alvaro" (Canadian USNR technician), "paul" (Swedish USNR project manager), "local" (a Chilean worker, supervisor or manager: invent a Chilean first name).`,
      [{ role: 'user', parts: [{ text: `Write one dialogue between two speakers about: ${$('#listenAITopic').value}. CEFR level ${S.level}. 8 to 10 lines, natural spoken English as it would really happen at the mill. Then write 3 multiple-choice comprehension questions with 3 options each.
Respond ONLY with JSON:
{"title_es":"short title in Spanish","context_es":"one sentence in Spanish describing the situation","speakers":{"A":{"name":"...","role":"mattias|joel|alvaro|paul|local"},"B":{"name":"...","role":"..."}},"lines":[{"s":"A","en":"...","es":"Spanish (Chile) translation"}],"questions":[{"q":"question in English","es":"question in Spanish","options":["...","...","..."],"answer":0}]}` }] }], 0.9);
    const ok = ['mattias', 'joel', 'alvaro', 'paul', 'local'];
    const sp = k => [r.speakers[k].name, ok.includes(r.speakers[k].role) ? r.speakers[k].role : 'local'];
    const d = { id: 'ai-' + Date.now(), topic: 'ai', level: S.level, title: r.title_es || 'Conversación nueva', context: r.context_es || '',
      speakers: { A: sp('A'), B: sp('B') },
      lines: (r.lines || []).filter(l => l.en && r.speakers[l.s]).map(l => [l.s, l.en, l.es || '']),
      questions: (r.questions || []).filter(q => q.options && q.options.length).map(q => ({ q: q.q, es: q.es, o: q.options, a: Math.min(+q.answer || 0, q.options.length - 1) })) };
    if (d.lines.length < 3) throw new Error('La conversación llegó incompleta. Intenta de nuevo.');
    saveCustomDialogs([d, ...customDialogs()]);
    openDialog(d.id);
    toast('Conversación nueva lista. Toca ▶ para escucharla.');
  } catch (e) { toast(aiErrorMsg(e), 4000); }
  finally { btn.disabled = false; btn.textContent = 'Generar conversación'; }
};

/* ============ Usuarios ============ */
let editingUser = null, pickedColor = 0;
function userSummary(id) {
  const d = id === P.current ? D : dataOf(id), st = d.stats || {};
  const u = P.list.find(x => x.id === id);
  const today = Math.floor((st[dayKey()]?.secs || 0) / 60);
  const total = Math.floor(Object.values(st).reduce((a, x) => a + (x.secs || 0), 0) / 60);
  return { today, total, streak: streak(st, u.goal || 20), notes: (d.notes || []).length };
}
function renderUsers() {
  $('#uLevel').innerHTML = $('#level').innerHTML;
  $('#userList').innerHTML = P.list.map(u => {
    const sm = userSummary(u.id), c = USER_COLORS[u.color] || USER_COLORS[0];
    return `<div class="user-card ${u.id === P.current ? 'current' : ''}" style="--uc:${c}">
      <div class="avatar" style="--uc:${c}">${esc(initials(u.name))}</div>
      <div class="info"><strong>${esc(u.name)}</strong><small>${esc(u.role || 'Sin cargo')} · ${esc(u.level || 'A2')}</small>
      <small>Hoy ${sm.today} min · Racha ${sm.streak} · Total ${sm.total} min</small></div>
      <div class="acts">${u.id === P.current ? '<span class="badge" style="--tc:var(--c-users)">Activo</span>' : `<button class="btn small primary" data-use="${u.id}">Usar</button>`}
      <button class="btn small ghost" data-edit="${u.id}">✎</button></div></div>`;
  }).join('');
  $$('[data-use]').forEach(b => b.onclick = () => switchUser(b.dataset.use));
  $$('[data-edit]').forEach(b => b.onclick = () => openUserForm(b.dataset.edit));
  $('#teamUrl').value = S.teamUrl || '';
  $('#syncStatus').textContent = S.lastSync ? `Última sincronización: ${new Date(S.lastSync).toLocaleString('es-CL')}` : '';
}
function openUserForm(id) {
  editingUser = id || null;
  const u = id ? P.list.find(x => x.id === id) : { name: '', role: '', level: S.level, color: P.list.length % USER_COLORS.length };
  $('#uFormTitle').textContent = id ? 'Editar usuario' : 'Nuevo usuario';
  $('#uName').value = u.name; $('#uRole').value = u.role || ''; $('#uLevel').value = u.level || 'A2';
  pickedColor = u.color || 0; renderColors();
  $('#userForm').hidden = false; $('#btnAddUser').hidden = true;
  let del = $('#uDelete');
  if (id && P.list.length > 1) {
    if (!del) { del = document.createElement('button'); del.id = 'uDelete'; del.className = 'btn danger'; del.textContent = 'Eliminar usuario'; $('#userForm').appendChild(del); }
    del.hidden = false; del.onclick = () => deleteUser(id);
  } else if (del) del.hidden = true;
  $('#uName').focus();
}
function renderColors() {
  $('#uColors').innerHTML = USER_COLORS.map((c, i) => `<button style="background:${c}" class="${i === pickedColor ? 'on' : ''}" data-c="${i}" aria-label="Color ${i + 1}"></button>`).join('');
  $$('#uColors button').forEach(b => b.onclick = () => { pickedColor = +b.dataset.c; renderColors(); });
}
$('#btnAddUser').onclick = () => openUserForm(null);
$('#uCancel').onclick = () => { $('#userForm').hidden = true; $('#btnAddUser').hidden = false; };
$('#uSave').onclick = () => {
  const name = $('#uName').value.trim();
  if (!name) { toast('Escribe un nombre.'); return; }
  if (editingUser) {
    const u = P.list.find(x => x.id === editingUser);
    Object.assign(u, { name, role: $('#uRole').value.trim(), level: $('#uLevel').value, color: pickedColor });
    if (u.id === P.current) S.level = u.level;
    persist(); $('#userForm').hidden = true; $('#btnAddUser').hidden = false; renderUsers(); updateHome(); initSettings();
  } else {
    const u = { id: newId(), name, role: $('#uRole').value.trim(), level: $('#uLevel').value, goal: 20, color: pickedColor, created: Date.now() };
    P.list.push(u); persist();
    switchUser(u.id);
  }
};
function switchUser(id) {
  syncNow(true);
  persist();
  P.current = id;
  try { localStorage.setItem('me_profiles', JSON.stringify(P)); } catch {}
  location.href = location.pathname + '?v=users';
}
function deleteUser(id) {
  const u = P.list.find(x => x.id === id);
  if (!confirm(`¿Eliminar a ${u.name} y todo su progreso en este teléfono?`)) return;
  P.list = P.list.filter(x => x.id !== id);
  try { localStorage.removeItem('me_data_' + id); } catch {}
  if (P.current === id) { P.current = P.list[0].id; try { localStorage.setItem('me_profiles', JSON.stringify(P)); } catch {} location.reload(); return; }
  persist(); $('#userForm').hidden = true; $('#btnAddUser').hidden = false; renderUsers();
}

/* ============ Seguimiento del equipo (Google Sheets) ============ */
var syncTimer = null;
function scheduleSync() {
  if (!S.teamUrl) return;
  clearTimeout(syncTimer); syncTimer = setTimeout(() => syncNow(), 20000);
}
function syncPayload() {
  const u = me(), st = todayStats(), total = Object.values(D.stats).reduce((a, x) => a + (x.secs || 0), 0);
  return { user_id: u.id, name: u.name, role: u.role || '', level: S.level, date: dayKey(),
    minutes: Math.round(st.secs / 60), dict: st.dict, spell: st.spell, talk: st.talk, listen: st.listen || 0,
    notes: D.notes.length, streak: streak(), totalMinutes: Math.round(total / 60) };
}
function syncNow(beacon = false) {
  if (!S.teamUrl || me().name === 'Yo') return false;
  const body = JSON.stringify(syncPayload());
  try {
    if (beacon && navigator.sendBeacon) navigator.sendBeacon(S.teamUrl, new Blob([body], { type: 'text/plain' }));
    else fetch(S.teamUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body });
    S.lastSync = Date.now();
    try { localStorage.setItem('me_settings', JSON.stringify(S)); } catch {}
    return true;
  } catch { return false; }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) syncNow(true); });
$('#teamUrl').addEventListener('change', e => {
  const v = e.target.value.trim();
  if (v && !/^https:\/\/script\.google(usercontent)?\.com\//.test(v)) { toast('El enlace debe empezar con https://script.google.com/…'); return; }
  S.teamUrl = v; persist(); toast(v ? 'Planilla del equipo conectada.' : 'Seguimiento desconectado.');
});
$('#btnSyncNow').onclick = () => {
  if (!S.teamUrl) { toast('Primero pega el enlace de la planilla del equipo.'); return; }
  if (me().name === 'Yo') { toast('Ponle tu nombre a tu usuario (✎) antes de sincronizar.'); return; }
  syncNow(); renderUsers(); toast('Progreso enviado a la planilla del equipo.');
};
$('#btnInvite').onclick = async () => {
  if (!S.teamUrl) { toast('Primero conecta la planilla del equipo.'); return; }
  const link = location.origin + location.pathname + '?equipo=' + encodeURIComponent(S.teamUrl);
  const text = `Te invito a practicar inglés para el aserradero con Mill English. Abre este enlace en Chrome, instala la app y crea tu usuario: ${link}`;
  try {
    if (navigator.share) await navigator.share({ title: 'Mill English', text });
    else { await navigator.clipboard.writeText(text); toast('Invitación copiada. Pégala en WhatsApp o correo.'); }
  } catch {}
};
$('#btnTeamPanel').onclick = async () => {
  if (!S.teamUrl) { toast('Primero conecta la planilla del equipo.'); return; }
  const box = $('#teamPanel'); box.innerHTML = '<p class="muted">Cargando avance del equipo…</p>';
  try {
    const res = await fetch(S.teamUrl);
    const rows = await res.json();
    const since = new Date(); since.setDate(since.getDate() - 6); const sinceKey = dayKey(since);
    const byUser = {};
    rows.forEach(r => {
      const u = byUser[r.id] || (byUser[r.id] = { name: r.usuario, role: r.cargo, level: r.nivel, week: 0, today: 0, streak: 0, last: '' });
      if (r.fecha >= sinceKey) u.week += +r.minutos || 0;
      if (r.fecha === dayKey()) u.today = +r.minutos || 0;
      if (r.fecha >= u.last) { u.last = r.fecha; u.streak = +r.racha || 0; u.name = r.usuario; u.role = r.cargo; u.level = r.nivel; }
    });
    const list = Object.values(byUser).sort((a, b) => b.week - a.week);
    if (!list.length) { box.innerHTML = '<p class="muted">Todavía no hay datos. Cada compañero debe practicar con la planilla conectada.</p>'; return; }
    const max = Math.max(...list.map(u => u.week), 1);
    box.innerHTML = `<p class="muted small">Minutos de práctica en los últimos 7 días</p>` + list.map(u => `<div class="team-row">
      <div class="top"><strong>${esc(u.name)}</strong><span>${u.week} min</span></div>
      <small>${esc(u.role || '')} · ${esc(u.level || '')} · Hoy ${u.today} min · Racha ${u.streak} · Último día ${esc(u.last)}</small>
      <div class="bar"><div style="width:${Math.round(u.week / max * 100)}%"></div></div></div>`).join('');
  } catch {
    box.innerHTML = '<p class="muted">No se pudo leer el panel desde la app. Puedes ver el avance directamente en la planilla de Google Sheets.</p>';
  }
};

/* ============ Inicio de la app ============ */
initSettings();
applyDictMode();
updateHome();
// Invitación de equipo (?equipo=...) y regreso tras cambiar de usuario (?v=users)
(() => {
  const q = new URLSearchParams(location.search);
  const team = q.get('equipo');
  if (team && /^https:\/\/script\.google(usercontent)?\.com\//.test(team)) {
    S.teamUrl = team; persist();
    toast('Te uniste al seguimiento del equipo. Crea tu usuario con tu nombre.', 4500);
    show('users'); if (me().name === 'Yo') openUserForm(me().id);
  } else if (q.get('v') === 'users') show('users');
  if (q.toString()) history.replaceState(null, '', location.pathname);
})();
renderDictCats();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
