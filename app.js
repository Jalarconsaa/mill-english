'use strict';
const APP_VERSION = '14';
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
const S = load('me_settings', { apiKey: '', model: 'gemini-3.5-flash-lite', level: 'A2', goal: 20,
  autoSend: true, autoSpeak: true, rate: 0.95, backupModel: 'gemini-3.8-flash',
  voices: { mattias: '', joel: '', alvaro: '', paul: '', local: '', narrator: '' }, pitch: 0.85, dictAnswer: 'type', spellAnswer: 'type', teamUrl: '', silence: 5, micMode: 'record',
  groqKey: '', groqModel: 'openai/gpt-oss-120b', groqVoice: true });
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
  if (view === 'notes') applyReviewMode($('#notesPanel').hidden ? 'cards' : 'notes');
  if (view === 'dict' && !dict.items.length) loadDict(dict.cat);
  if (view === 'spell' && !spell.target) newSpell();
  if (view === 'listen') { renderListenList(); renderArticles(); }
  if (view === 'users') renderUsers();
}
$$('.tabbar button').forEach(b => b.addEventListener('click', () => show(b.dataset.view)));
$('#btnUser').addEventListener('click', () => show(currentView === 'users' ? 'home' : 'users'));
$('#btnSettings').addEventListener('click', () => show(currentView === 'settings' ? 'home' : 'settings'));
$('#btnCloseSettings').addEventListener('click', () => show('home'));
document.addEventListener('click', e => { if (e.target.closest('[data-open-settings]')) show('settings'); });
$$('.routine li').forEach(li => li.addEventListener('click', () => show(li.dataset.go)));

/* ============ Voz: hablar (TTS) ============ */
// Selectores de voz según los personajes del tema activo
(() => {
  const box = document.getElementById('voiceSlots'); if (!box) return;
  box.innerHTML = Object.entries(PERSONAS).map(([k, p]) => `<label>${esc(p.name)} (${esc(p.es.split(', ').slice(1).join(', '))})
    <div class="composer-row"><select class="voice-sel" data-role="${p.voice || k}"></select><button class="btn ghost small" data-test="${k}">▶</button></div></label>`).join('');
})();
// Los personajes usan una de las 4 voces configurables
const voiceSlot = role => (PERSONAS[role] && PERSONAS[role].voice) || role;
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
  role = voiceSlot(role);
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
// avEl: avatar (o lista de avatares) que mueve la boca mientras suena la voz
function stopTalking() { $$('.av.talking').forEach(el => el.classList.remove('talking')); }
function speak(text, rate = S.rate, role = 'narrator', avEl = null, pitchOverride = null) {
  return new Promise(res => {
    if (!('speechSynthesis' in window)) { toast('Este navegador no puede leer en voz alta.'); return res(); }
    speechSynthesis.cancel(); stopTalking();
    const u = new SpeechSynthesisUtterance(text);
    const v = voiceFor(role);
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
    u.rate = rate; u.pitch = pitchOverride || (role === 'narrator' || role === 'local' ? 1 : S.pitch);
    const els = avEl ? (avEl.length !== undefined ? Array.from(avEl) : [avEl]) : [];
    u.onstart = () => els.forEach(el => el.classList.add('talking'));
    const done = () => { els.forEach(el => el.classList.remove('talking')); res(); };
    u.onend = done; u.onerror = done;
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
// Micrófono: sigue escuchando hasta que tocas 🎙 de nuevo o hasta un silencio largo (configurable en Ajustes).
// Chrome en Android corta la escucha sola tras pausas cortas: aquí se reinicia automáticamente sin perder lo dicho.
let recSession = null;
function listen({ onInterim, onFinal, button, lang = 'en-US' }) {
  if (!SR) { toast('Tu navegador no reconoce voz. Usa Chrome en Android.'); return; }
  if (recSession) { recSession.finish(); return; }
  speechSynthesis.cancel(); stopTalking();
  const ses = { finals: [], interim: '', stopped: false, done: false, rec: null, started: Date.now(), lastHeard: Date.now(), fatal: false };
  const text = () => [...ses.finals, ses.interim].join(' ').replace(/\s+/g, ' ').trim();
  const low = t => t.toLowerCase();
  function startRec() {
    const rec = new SR(); ses.rec = rec;
    rec.lang = lang; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    const base = ses.finals.length;           // lo dicho en tramos anteriores se conserva
    rec.onresult = e => {
      if (ses.done) return;
      const local = []; let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const t = (e.results[i][0]?.transcript || '').trim(); if (!t) continue;
        if (e.results[i].isFinal) {
          const last = local[local.length - 1];
          // Algunos Android repiten el texto anterior dentro del nuevo resultado: se evita duplicar
          if (last && low(t).startsWith(low(last))) local[local.length - 1] = t;
          else if (!(last && low(last).startsWith(low(t)))) local.push(t);
        } else interim = t;
      }
      const lastF = local[local.length - 1];
      if (lastF && low(interim).startsWith(low(lastF))) interim = interim.slice(lastF.length).trim();
      ses.finals = ses.finals.slice(0, base).concat(local);
      ses.interim = interim; ses.lastHeard = Date.now();
      onInterim && onInterim(text());
    };
    rec.onerror = e => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { toast('Permite el uso del micrófono en los ajustes del navegador.'); ses.fatal = true; ses.stopped = true; }
      else if (e.error === 'network' || e.error === 'audio-capture') {
        ses.errs = (ses.errs || 0) + 1;
        if (ses.errs >= 4) { toast(e.error === 'network' ? 'El reconocimiento de voz necesita internet.' : 'No se pudo usar el micrófono. Revisa el audífono o el permiso.'); ses.fatal = true; ses.stopped = true; }
      }
      // 'no-speech' y 'aborted' no cortan la sesión: se vuelve a escuchar
    };
    rec.onend = () => { if (!ses.stopped) restart(0); else finalize(); };
    try { rec.start(); } catch { restart(1); }
  }
  // Algunos Android rechazan reiniciar de inmediato: se reintenta con pausas antes de rendirse
  function restart(tries) {
    if (ses.stopped) return finalize();
    if (tries > 8) return finalize();
    setTimeout(() => {
      if (ses.stopped) return finalize();
      try { startRec(); } catch { restart(tries + 1); }
    }, 150 + tries * 250);
  }
  function finish() {
    if (ses.stopped && !ses.rec) return finalize();
    ses.stopped = true;
    if (ses.interim) { ses.finals.push(ses.interim); ses.interim = ''; }
    try { ses.rec.stop(); } catch { finalize(); }
    setTimeout(finalize, 1500);             // por si el navegador no avisa el término
  }
  function finalize() {
    if (ses.done) return; ses.done = true;
    clearInterval(ses.timer); recSession = null;
    if (button) { button.classList.remove('listening'); button.removeAttribute('data-secs'); }
    const t = text();
    if (t) onFinal && onFinal(t);
    else if (!ses.fatal) toast('No te escuché. Toca 🎙 y habla más cerca del teléfono.');
  }
  ses.finish = finish;
  // Corte automático por silencio (o solo manual)
  ses.timer = setInterval(() => {
    const now = Date.now(), said = !!text();
    if (button) button.setAttribute('data-secs', Math.floor((now - ses.started) / 1000));
    if (S.silence > 0 && said && now - ses.lastHeard > S.silence * 1000) finish();
    else if (!said && now - ses.started > 15000) finish();
    else if (now - ses.started > 120000) finish();   // máximo 2 minutos
  }, 250);
  recSession = ses;
  if (button) button.classList.add('listening');
  toast(S.silence > 0 ? `🎙 Escuchando… Toca 🎙 otra vez cuando termines (o espera ${S.silence} s en silencio).` : '🎙 Escuchando… Toca 🎙 otra vez cuando termines.', 3500);
  startRec();
}

/* ============ Grabación de voz sin cortes (se transcribe con Gemini) ============ */
let recording = null;
function floatTo16kWav(chunks, inRate) {
  const len = chunks.reduce((a, c) => a + c.length, 0), all = new Float32Array(len);
  let o = 0; chunks.forEach(c => { all.set(c, o); o += c.length; });
  const outRate = 16000, ratio = inRate / outRate, n = Math.floor(len / ratio), pcm = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const st = Math.floor(i * ratio), en = Math.min(len, Math.floor((i + 1) * ratio)); let sum = 0;
    for (let j = st; j < en; j++) sum += all[j];
    const v = Math.max(-1, Math.min(1, sum / Math.max(1, en - st))); pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  const buf = new ArrayBuffer(44 + pcm.length * 2), dv = new DataView(buf);
  const w = (off, str) => { for (let i = 0; i < str.length; i++) dv.setUint8(off + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, outRate, true);
  dv.setUint32(28, outRate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, pcm.length * 2, true);
  new Int16Array(buf, 44).set(pcm);
  return new Blob([buf], { type: 'audio/wav' });
}
const blobToB64 = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(b); });
async function transcribeAudio(b64, lang, blob) {
  // Con Groq configurado, la voz se transcribe con Whisper y se ahorra el límite de Gemini
  if (S.groqKey && blob && (S.groqVoice || !S.apiKey)) {
    try { return await groqTranscribe(blob, lang); }
    catch (e) { if (!S.apiKey) throw e; }
  }
  if (!S.apiKey) throw new Error('NOKEY');
  const spanish = lang.startsWith('es');
  const r = await gemini('You are an accurate speech-to-text engine.', [{ role: 'user', parts: [
    { inlineData: { mimeType: 'audio/wav', data: b64 } },
    { text: `Transcribe exactly what the speaker says. ${spanish ? 'The speaker speaks Spanish (Chile), maybe with some English words.' : 'The speaker is a Chilean learner speaking English (there may be a few Spanish words; keep them).'} Write the words as actually spoken, keeping any grammar mistakes: do NOT correct, improve or complete the sentences. Ignore background machine noise. If nothing intelligible is said, return an empty string. Respond ONLY with JSON: {"text":"..."}` }
  ] }], 0).catch(async e => {
    if (S.groqKey && blob && canFallback(e)) return { text: await groqTranscribe(blob, lang) };
    throw e;
  });
  return (r.text || '').trim();
}
// Graba hasta que tocas 🎙 otra vez (o hasta el silencio elegido en Ajustes) y luego transcribe
async function recordVoice({ button, lang = 'en-US', input, onText }) {
  if (recording) { recording.finish(); return; }
  if (!hasAI() || !navigator.mediaDevices?.getUserMedia) {
    if (!hasAI()) toast('La grabación sin cortes necesita la clave de Gemini o de Groq. Uso el micrófono del teléfono.');
    return listen({ button, lang, onInterim: t => { input.value = t; }, onFinal: onText });
  }
  speechSynthesis.cancel(); stopTalking();
  let stream, ctx;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    await ctx.resume();
  } catch (e) { toast('Permite el uso del micrófono en los ajustes del navegador.'); return; }
  const source = ctx.createMediaStreamSource(stream), proc = ctx.createScriptProcessor(4096, 1, 1);
  const chunks = [], started = Date.now();
  let lastLoud = Date.now(), spoke = false, finished = false;
  const recent = [];                                                      // niveles recientes para estimar el ruido de fondo
  proc.onaudioprocess = e => {
    const d = e.inputBuffer.getChannelData(0); chunks.push(new Float32Array(d));
    let sum = 0; for (let i = 0; i < d.length; i += 4) sum += d[i] * d[i];
    const rms = Math.sqrt(sum / (d.length / 4));
    recent.push(rms); if (recent.length > 40) recent.shift();            // ~4 s
    const noise = Math.min(0.03, Math.min(...recent));                   // el mínimo reciente ≈ ruido de fondo
    const thr = Math.max(0.012, noise * 3);
    if (rms > thr) { lastLoud = Date.now(); spoke = true; }
    button.style.setProperty('--lvl', Math.min(1, rms * 12).toFixed(2));
  };
  source.connect(proc); proc.connect(ctx.destination);
  button.classList.add('listening');
  input.value = ''; input.placeholder = '🎙 Grabando… toca 🎙 otra vez para terminar';
  const timer = setInterval(() => {
    const now = Date.now();
    button.setAttribute('data-secs', Math.floor((now - started) / 1000));
    if (S.silence > 0 && spoke && now - lastLoud > S.silence * 1000) finish();
    else if (!spoke && now - started > 20000) finish();
    else if (now - started > 180000) finish();                            // máximo 3 minutos
  }, 250);
  async function finish() {
    if (finished) return; finished = true; recording = null; clearInterval(timer);
    try { proc.disconnect(); source.disconnect(); } catch {}
    stream.getTracks().forEach(t => t.stop());
    const rate = ctx.sampleRate; try { await ctx.close(); } catch {}
    button.classList.remove('listening'); button.removeAttribute('data-secs'); button.style.removeProperty('--lvl');
    if (Date.now() - started < 800) { input.placeholder = 'Habla o escribe…'; toast('Grabación muy corta. Toca 🎙, habla y vuelve a tocar 🎙 al terminar.'); return; }
    input.placeholder = '✍️ Transcribiendo tu voz…'; button.disabled = true; input.disabled = true;
    try {
      const wav = floatTo16kWav(chunks, rate), b64 = await blobToB64(wav);
      const text = await transcribeAudio(b64, lang, wav);
      if (!text) toast('No logré entender la grabación. Intenta de nuevo.');
      else onText(text);
    } catch (e) { toast(aiErrorMsg(e), 4000); }
    finally { button.disabled = false; input.disabled = false; input.placeholder = 'Habla o escribe…'; }
  }
  recording = { finish };
  toast(S.silence > 0 ? `🎙 Grabando sin límite de pausas. Toca 🎙 al terminar (o ${S.silence} s en silencio).` : '🎙 Grabando sin límite de pausas. Toca 🎙 al terminar.', 3500);
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
const hasAI = () => !!(S.apiKey || S.groqKey);
const hasInline = contents => contents.some(c => (c.parts || []).some(p => p.inlineData));
// Proveedor de respaldo: Groq (API compatible con OpenAI, plan gratuito)
async function groqChat(system, contents, temperature = 0.8) {
  const messages = [{ role: 'system', content: system }].concat(contents.map(c => ({
    role: c.role === 'model' ? 'assistant' : 'user',
    content: (c.parts || []).map(p => p.text || '').join('\n')
  })));
  const body = { model: S.groqModel || 'openai/gpt-oss-120b', messages, temperature, response_format: { type: 'json_object' } };
  if (/gpt-oss/.test(body.model)) body.reasoning_effort = 'low';
  const call = async b => {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + S.groqKey }, body: JSON.stringify(b) });
    if (!res.ok) {
      let detail = ''; try { detail = (await res.json()).error?.message || ''; } catch {}
      const err = new Error(detail || res.statusText); err.status = res.status; err.provider = 'groq'; throw err;
    }
    return res.json();
  };
  let data;
  try { data = await call(body); }
  catch (e) {
    // Algunos modelos no aceptan el formato JSON forzado o el esfuerzo de razonamiento: se reintenta sin ellos
    if (e.status === 400 && /response_format|json|reasoning/i.test(e.message)) { delete body.response_format; delete body.reasoning_effort; data = await call(body); }
    else throw e;
  }
  const text = data.choices?.[0]?.message?.content || '';
  if (!text) { const err = new Error('Groq no devolvió respuesta.'); err.status = 500; err.provider = 'groq'; throw err; }
  return parseJSON(text);
}
async function groqTranscribe(blob, lang) {
  const fd = new FormData();
  fd.append('file', blob, 'voz.wav'); fd.append('model', 'whisper-large-v3-turbo');
  fd.append('language', lang.startsWith('es') ? 'es' : 'en'); fd.append('response_format', 'json'); fd.append('temperature', '0');
  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: 'Bearer ' + S.groqKey }, body: fd });
  if (!res.ok) { let d = ''; try { d = (await res.json()).error?.message || ''; } catch {} const err = new Error(d || res.statusText); err.status = res.status; err.provider = 'groq'; throw err; }
  return ((await res.json()).text || '').trim();
}
let groqNotified = false, geminiPausedUntil = 0;
const canFallback = e => [429, 500, 503, 504, 404].includes(e.status);
let fallbackNotified = '';
// Prueba el modelo principal; si Google está saturado (503) reintenta y luego usa el modelo de respaldo.
async function gemini(system, contents, temperature = 0.8) {
  if (!S.apiKey) {
    if (S.groqKey && !hasInline(contents)) return groqChat(system, contents, temperature);
    throw new Error('NOKEY');
  }
  // Si Gemini se agotó hace poco, se va directo a Groq sin perder tiempo
  if (S.groqKey && !hasInline(contents) && Date.now() < geminiPausedUntil) return groqChat(system, contents, temperature);
  try { return await geminiOnly(system, contents, temperature); }
  catch (e) {
    // Gemini agotado o saturado: se usa Groq si está configurado
    if (S.groqKey && canFallback(e) && !hasInline(contents)) {
      if (e.status === 429) geminiPausedUntil = Date.now() + (/per ?day|PerDay|daily/i.test(e.message) ? 60 : 2) * 60000;
      if (!groqNotified) { groqNotified = true; toast('Gemini llegó a su límite: sigo con Groq (respaldo).', 3500); }
      try { return await groqChat(system, contents, temperature); }
      catch (g) { g.geminiError = e; throw g; }
    }
    throw e;
  }
}
async function geminiOnly(system, contents, temperature) {
  const chain = [...new Set([S.model, S.backupModel].filter(Boolean))];
  const errs = [];
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
        errs.push(e);
        if (e.status === 503 || e.status === 500 || e.status === 504) { if (attempt === 0) { await wait(1500); continue; } break; }
        if (e.status === 429 || e.status === 404) break;   // probar el siguiente modelo
        throw e;                                            // clave inválida, sin internet, etc.
      }
    }
  }
  // Se informa el error más importante: límite gratuito > saturación > otros > modelo inexistente
  const rank = e => e.status === 429 ? 0 : [500, 503, 504].includes(e.status) ? 1 : e.status === 404 ? 3 : 2;
  throw errs.sort((a, b) => rank(a) - rank(b))[0];
}
function parseJSON(text) {
  const clean = text.replace(/```json|```/g, '').trim();
  try { return JSON.parse(clean); }
  catch { const m = clean.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); throw new Error('Respuesta de la IA con formato inválido.'); }
}
function aiErrorMsg(e) {
  if (e.message === 'NOKEY') return 'Primero configura tu clave gratuita de Gemini (o de Groq) en Ajustes.';
  if (e.provider === 'groq') {
    const pre = e.geminiError ? 'Gemini está agotado y el respaldo Groq también falló: ' : 'Groq: ';
    if (e.status === 401 || e.status === 403) return pre + 'la clave de Groq no es válida. Revísala en Ajustes.';
    if (e.status === 429) return pre + 'llegaste al límite gratuito. Espera un minuto (o hasta mañana si es el límite diario).';
    if (e.status === 404 || (e.status === 400 && /model/i.test(e.message))) return pre + 'ese modelo no está disponible. En Ajustes toca "Buscar modelos de Groq".';
    if (e instanceof TypeError) return 'Sin conexión a internet.';
    return pre + e.message;
  }
  if (e.status === 503 || e.status === 500 || e.status === 504) return 'Los servidores de Google están saturados en este momento, incluso el modelo de respaldo. Espera un par de minutos o cambia de modelo en Ajustes.';
  if (e.status === 429) {
    const secs = (String(e.message).match(/retry in ([\d.]+)\s*s/i) || [])[1];
    if (/per ?day|PerDay|daily/i.test(e.message)) return 'Se agotó el límite gratuito de HOY. Se renueva cada día alrededor de las 3 o 4 de la mañana (hora de Chile). Mientras tanto puedes usar dictado, deletreo, tarjetas y listening ya creados.';
    return `Llegaste al límite gratuito por minuto. Espera ${secs ? Math.ceil(+secs) + ' segundos' : 'un minuto'} y vuelve a intentar.`;
  }
  if (e.status === 400 && /api key/i.test(e.message)) return 'La clave no es válida. Revísala en Ajustes.';
  if (e.status === 403) return 'La clave no tiene permiso. Crea una nueva en Google AI Studio.';
  if (e.status === 404) return 'Ese modelo no está disponible para tu clave. En Ajustes toca "Buscar modelos" y elige uno de la lista.';
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
  $('#r-notes').classList.toggle('done', (st.cards || 0) >= 10 || !!st.reviewDone);
  $('#testNotice').hidden = !!me().tested;
  const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  let html = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const secs = D.stats[dayKey(d)]?.secs || 0;
    const pct = Math.min(100, secs / (S.goal * 60) * 100);
    html += `<div class="day"><div class="bar ${secs >= S.goal * 60 ? 'met' : ''}" style="height:${Math.max(3, pct * 0.8)}%" title="${Math.round(secs / 60)} min"></div>${i === 0 ? 'Hoy' : days[d.getDay()]}</div>`;
  }
  $('#week').innerHTML = html;
  $('#keyNotice').hidden = hasAI();
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
const talk = { history: [], active: false, busy: false, turns: [], started: 0 };
const LEVEL_NOTES = {
  A1: 'The learner is a beginner. Use very simple, common words, very short sentences (maximum 8 words), mostly present tense. Ask simple yes/no or either/or questions.',
  A2: 'Use simple vocabulary and short sentences. Speak slowly and clearly. Avoid idioms.',
  B1: 'Use everyday vocabulary with some technical terms of the topic and a few common phrasal verbs.',
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
function renderScenarios() {
  const prev = $('#scenario').value;
  $('#scenario').innerHTML = '';
  [...new Set(SCENARIOS.map(s => s.group))].forEach(g => {
  const og = document.createElement('optgroup'); og.label = g;
  SCENARIOS.filter(s => s.group === g).forEach(s => { const o = document.createElement('option'); o.value = s.id; o.textContent = s.es; og.appendChild(o); });
  $('#scenario').appendChild(og);
  });
  const og = document.createElement('optgroup'); og.label = 'Tema libre';
  og.innerHTML = '<option value="custom">✏️ Escribir mi propia situación…</option>'; $('#scenario').appendChild(og);
  if (prev && [...$('#scenario').options].some(o => o.value === prev)) $('#scenario').value = prev;
}
renderScenarios();
$('#persona').innerHTML = Object.entries(PERSONAS).map(([k, p]) => `<option value="${k}">${esc(p.name)}</option>`).join('');
// Escenario activo (incluye el tema libre)
function currentScenario() {
  const id = $('#scenario').value;
  if (id === 'custom') {
    const t = $('#customScenario').value.trim() || 'Free conversation about the topic.';
    return { id: 'custom', group: 'Tema libre', es: 'Tema libre: ' + t.slice(0, 60), en: 'The learner chose this situation to practice (it may be written in Spanish: understand it and play it in English): ' + t };
  }
  return SCENARIOS.find(s => s.id === id) || SCENARIOS[0];
}
function renderPersonaPick() {
  const cur = $('#persona').value;
  $('#personaPick').innerHTML = Object.entries(PERSONAS).map(([k, p]) => `<button data-p="${k}" class="${k === cur ? 'on' : ''}">
    ${avatarHTML(k, p.name, 'lg')}<strong>${esc(p.name)}</strong><small>${esc(p.es.split(', ').slice(1).join(', '))}</small></button>`).join('');
  $$('#personaPick button').forEach(b => b.onclick = () => {
    $('#persona').value = b.dataset.p; renderPersonaPick();
    const av = b.querySelector('.av'); speak(PERSONAS[b.dataset.p].greet || 'Hello!', S.rate, b.dataset.p, av);
  });
}
// Sugerir a Paul para temas de jefatura y proyectos
$('#scenario').addEventListener('change', () => {
  $('#customScenario').hidden = $('#scenario').value !== 'custom';
  const sc = currentScenario();
  if (PERSONAS.paul && (sc.group === 'Supervisión y jefatura' || sc.id === 'upgrade' || sc.id === 'progress')) { $('#persona').value = 'paul'; renderPersonaPick(); }
});

function talkSystem() {
  const sc = currentScenario(), p = PERSONAS[$('#persona').value];
  return `You are ${p.en}
${TOPIC.setting}
CONTEXT: ${CONTEXT}
You are talking with ${me().name !== 'Yo' ? me().name + ', ' : ''}${TOPIC.learner}${me().role ? ' (job: ' + me().role + ')' : ''} who is learning English. Their CEFR level is ${S.level}. Their goal is to communicate confidently in English about this topic.
SCENARIO: ${sc.en}

RULES FOR YOUR REPLY:
- Stay in character. Talk like in a real conversation at the mill, never like a teacher.
- Keep each reply short: 1 to 3 sentences. ${LEVEL_NOTES[S.level]}
- Usually end with a question or something that invites the learner to answer.
- ${TOPIC.vocabHint}

RULES FOR FEEDBACK about the learner's LAST message:
- The learner's text comes from speech recognition: ignore punctuation, capitalization and obvious transcription glitches. Focus on grammar, word choice, missing words, word order and phrases that sound unnatural.
- List only real mistakes, maximum 4, the most important first. If the message is correct, return an empty corrections list.
- NEVER put a fragment in "corrections" if it is already correct. Do not "correct" punctuation, capitalization, contractions (I'm / I am) or correct alternatives. Better or more natural ways of saying something go ONLY in "natural", never in "corrections".
- "original" must be the SHORTEST wrong fragment exactly as the learner said it (usually 1 to 5 words), never the whole sentence, and "corrected" must be different from "original".
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

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function scrollChatToEnd() {
  const m = $('#main');
  const go = () => m.scrollTo({ top: m.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
  // Se repite para cubrir cambios de altura (traducciones, avatares, teclado del teléfono)
  requestAnimationFrame(go); setTimeout(go, 150); setTimeout(go, 450);
}
// Al abrir el teclado en el teléfono la pantalla se achica: mantener visible el último mensaje
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => {
  if (['talk', 'tutor'].includes(currentView) && ['talkInput', 'tutorInput'].includes(document.activeElement?.id)) scrollChatToEnd();
});
['talkInput', 'tutorInput'].forEach(id => document.getElementById(id).addEventListener('focus', () => setTimeout(scrollChatToEnd, 300)));
function chatAdd(html, cls) {
  const div = document.createElement('div'); div.className = cls; div.innerHTML = html;
  $('#chat').appendChild(div);
  scrollChatToEnd();
  return div;
}
function addAIMsg(reply, replyEs) {
  const role = $('#persona').value, name = PERSONAS[role].name;
  const div = chatAdd(`<div class="who">${avatarHTML(role, name, 'md')}${esc(name)}</div><div>${esc(reply)}</div>
    <div class="es" hidden>${esc(replyEs)}</div>
    <div class="tools"><button data-a="speak">🔊 Escuchar</button><button data-a="slow">🐢 Lento</button><button data-a="es">Traducir</button></div>`, 'msg ai');
  const av = div.querySelector('.av');
  if (S.level === 'A1') div.querySelector('.es').hidden = false;
  div.querySelector('[data-a=speak]').onclick = () => speak(reply, S.rate, role, av);
  div.querySelector('[data-a=slow]').onclick = () => speak(reply, 0.7, role, av);
  div.querySelector('[data-a=es]').onclick = () => { const e = div.querySelector('.es'); e.hidden = !e.hidden; if (!e.hidden && div === $('#chat').lastElementChild) scrollChatToEnd(); };
  if (S.autoSpeak) speak(reply, S.rate, role, av);
}
// Contracciones: "I'm" y "I am" son igual de correctas
const CONTRACTIONS = { "i'm": 'i am', "you're": 'you are', "it's": 'it is', "don't": 'do not', "doesn't": 'does not', "didn't": 'did not',
  "can't": 'cannot', "won't": 'will not', "isn't": 'is not', "aren't": 'are not', "we're": 'we are', "they're": 'they are', "that's": 'that is',
  "there's": 'there is', "i'll": 'i will', "we'll": 'we will', "i've": 'i have', "wasn't": 'was not', "weren't": 'were not', "let's": 'let us',
  "what's": 'what is', "haven't": 'have not', "hasn't": 'has not', "he's": 'he is', "she's": 'she is', "couldn't": 'could not', "shouldn't": 'should not', "wouldn't": 'would not' };
function normFix(t) {
  return String(t || '').toLowerCase().replace(/[’‘`]/g, "'").split(/\s+/).map(w => CONTRACTIONS[w.replace(/[^a-z']/g, '')] || w)
    .join(' ').replace(/cannot/g, 'can not').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
// Solo se aceptan correcciones que de verdad cambian algo
function realCorrections(r) {
  return (Array.isArray(r.corrections) ? r.corrections : []).filter(c => c && c.original && c.corrected && normFix(c.original) !== normFix(c.corrected));
}
// Tu frase con solo los fragmentos equivocados tachados
function markErrors(said, cs) {
  const ranges = [];
  cs.forEach(c => {
    const i = said.toLowerCase().indexOf(String(c.original).toLowerCase().trim());
    if (i >= 0) ranges.push([i, i + String(c.original).trim().length]);
  });
  ranges.sort((x, y) => x[0] - y[0]);
  let out = '', pos = 0;
  ranges.forEach(([st, en]) => { if (st < pos) return; out += esc(said.slice(pos, st)) + `<span class="err">${esc(said.slice(st, en))}</span>`; pos = en; });
  return out + esc(said.slice(pos));
}
function addFeedback(r, said) {
  const cs = realCorrections(r);
  const perfect = !cs.length;
  let html = `<span class="score">${Number(r.score) || 0}/10</span><strong>${perfect ? '✓ ¡Correcto!' : 'Correcciones'}</strong>`;
  if (r.praise_es) html += `<div>${esc(r.praise_es)}</div>`;
  if (!perfect) {
    const wholeWrong = cs.length === 1 && normFix(cs[0].original) === normFix(said);
    if (!wholeWrong) html += `<div class="said">Tu frase: ${markErrors(said, cs)}</div>`;
    cs.forEach(c => {
      html += wholeWrong
        ? `<div class="fix">Mejor dicho: <span class="to">${esc(c.corrected)}</span><span class="why">${esc(c.explanation_es)}</span></div>`
        : `<div class="fix"><span class="from">${esc(c.original)}</span> → <span class="to">${esc(c.corrected)}</span><span class="why">${esc(c.explanation_es)}</span></div>`;
      addNote({ original: c.original, corrected: c.corrected, explanation: c.explanation_es, type: c.type, sentence: r.natural, source: 'Conversación' });
    });
  }
  if (r.natural && normFix(r.natural) !== normFix(said)) {
    html += `<div class="fix">${perfect ? 'Otra forma de decirlo' : 'Más natural'}: <span class="natural">${esc(r.natural)}</span> <button class="btn ghost small" data-a="nat">🔊</button></div>`;
  }
  const div = chatAdd(html, 'feedback' + (perfect ? ' is-correct' : ' has-errors'));
  const nb = div.querySelector('[data-a=nat]'); if (nb) nb.onclick = () => speak(r.natural, S.rate, 'narrator');
  return { perfect, cs };
}

async function talkCall(userText) {
  talk.history.push({ role: 'user', parts: [{ text: userText }] });
  if (talk.history.length > 24) { talk.history = talk.history.slice(-22); while (talk.history[0].role !== 'user') talk.history.shift(); }
  talk.busy = true; $('#btnSend').disabled = true;
  const typing = chatAdd('Escribiendo…', 'msg ai typing');
  try {
    const r = await gemini(talkSystem(), talk.history);
    typing.remove();
    if (userText !== '[START]') {
      const fb = addFeedback(r, userText); bump('talk');
      talk.turns.push({ said: userText, score: Number(r.score) || 0, perfect: fb.perfect, cs: fb.cs });
    }
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
  if (!hasAI()) { toast('Primero configura tu clave gratuita de Gemini.'); show('settings'); return; }
  talk.history = []; talk.turns = []; talk.started = Date.now(); $('#chat').innerHTML = '';
  $('#talkSetup').hidden = true; $('#composer').hidden = false;
  const sc = currentScenario();
  const pr = $('#persona').value;
  chatAdd(`<div class="talk-hero">${avatarHTML(pr, PERSONAS[pr].name, 'lg')}<div><strong>${esc(sc.es)}</strong><br>con ${esc(PERSONAS[pr].es)}.<br><span class="muted small">Responde hablando con el micrófono 🎙 o escribiendo.</span></div></div>`, 'hints');
  const ok = await talkCall('[START]');
  if (!ok) { $('#talkSetup').hidden = false; $('#composer').hidden = true; }
});
function resetTalk() {
  speechSynthesis.cancel(); stopTalking(); $('#chat').innerHTML = ''; talk.history = []; talk.turns = [];
  $('#talkSetup').hidden = false; $('#composer').hidden = true; $('#main').scrollTop = 0;
}
// Resumen al terminar: % de frases correctas, nota promedio y errores de la sesión
function showTalkSummary() {
  speechSynthesis.cancel(); stopTalking();
  if (recording) recording.finish();
  const t = talk.turns || [];
  if (!t.length) { resetTalk(); return; }
  const ok = t.filter(x => x.perfect).length, pct = Math.round(ok / t.length * 100);
  const avg = (t.reduce((a, x) => a + x.score, 0) / t.length).toFixed(1);
  const mins = Math.max(1, Math.round((Date.now() - (talk.started || Date.now())) / 60000));
  const errs = t.flatMap(x => x.cs).slice(0, 8);
  const color = pct >= 80 ? 'var(--ok)' : pct >= 50 ? 'var(--c-home)' : 'var(--bad)';
  const msg = pct >= 80 ? '¡Excelente conversación! Se nota el avance.' : pct >= 50 ? 'Buen trabajo. Repasa los errores y la próxima saldrá mejor.' : 'Cada conversación suma. Repasa estos errores en tus tarjetas.';
  const sc = currentScenario(), pr = $('#persona').value;
  const st = todayStats(); st.talkTurns = (st.talkTurns || 0) + t.length; st.talkOk = (st.talkOk || 0) + ok;
  D.talkSessions = (D.talkSessions || []).concat([{ date: dayKey(), scenario: sc.id, persona: pr, turns: t.length, ok, avg: +avg }]).slice(-60);
  persist();
  $('#composer').hidden = true;
  const div = chatAdd(`<div class="summary">
    <div class="sum-head">${avatarHTML(pr, PERSONAS[pr].name, 'md')}<div><strong>Resumen de la conversación</strong><br><span class="muted small">${esc(sc.es)} · ${esc(PERSONAS[pr].name)} · ${mins} min</span></div></div>
    <div class="sum-ring" style="--p:${pct};--rc:${color}"><div><b>${pct}%</b><small>aciertos</small></div></div>
    <p class="sum-msg">${msg}</p>
    <div class="sum-stats">
      <div><b>${ok} de ${t.length}</b><small>frases correctas</small></div>
      <div><b>${avg}</b><small>nota promedio /10</small></div>
      <div><b>${errs.length}</b><small>errores a repasar</small></div>
    </div>
    ${errs.length ? `<div class="sum-errs"><strong>Para repasar</strong>${errs.map(c => `<div class="fix"><span class="from">${esc(c.original)}</span> → <span class="to">${esc(c.corrected)}</span><span class="why">${esc(c.explanation_es || '')}</span></div>`).join('')}</div>` : ''}
    <div class="row-btns">
      ${errs.length ? '<button class="btn" data-a="cards">🃏 Repasar en tarjetas</button>' : ''}
      <button class="btn primary" data-a="new">Nueva conversación</button>
    </div></div>`, 'feedback summary-card');
  div.querySelector('[data-a=new]').onclick = resetTalk;
  const cb = div.querySelector('[data-a=cards]'); if (cb) cb.onclick = () => { resetTalk(); show('notes'); applyReviewMode('cards'); };
}
$('#btnNewTalk').addEventListener('click', showTalkSummary);
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
$('#btnMic').addEventListener('click', () => {
  const onText = t => { $('#talkInput').value = t; if (S.autoSend) sendTalk(); };
  if (S.micMode === 'record') recordVoice({ button: $('#btnMic'), input: $('#talkInput'), onText });
  else listen({ button: $('#btnMic'), onInterim: t => { $('#talkInput').value = t; }, onFinal: onText });
});
$('#btnHint').addEventListener('click', async () => {
  if (talk.busy) return;
  const btn = $('#btnHint'); btn.disabled = true;
  try {
    const r = await gemini(
      `You help ${TOPIC.learner} (CEFR ${S.level}) practice English conversation. Given the conversation so far, suggest 3 different short replies the learner could say next, natural and appropriate for level ${S.level}. Respond ONLY with JSON: {"suggestions":[{"en":"...","es":"Spanish translation"}]}`,
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
const dict = { cat: Object.keys(PHRASES)[0], items: [], idx: 0, checked: false, total: 0, aiItems: [] };
function renderDictCats() {
  const cats = Object.keys(PHRASES).slice();
  if (D.notes.length) cats.push('errores');
  if (dict.aiItems.length) cats.push('ia');
  $('#dictCats').innerHTML = cats.map(c => `<button class="chip ${c === dict.cat ? 'on' : ''}" data-cat="${c}">${c === 'ia' ? 'Nuevas (IA)' : CATEGORY_NAMES[c]}</button>`).join('');
  $$('#dictCats .chip').forEach(b => b.onclick = () => loadDict(b.dataset.cat));
}
function loadDict(cat) {
  if (!PHRASES[cat] && cat !== 'errores' && cat !== 'ia') cat = Object.keys(PHRASES)[0];
  dict.cat = cat;
  if (cat === 'errores') {
    const seen = new Set();
    dict.items = D.notes.slice().sort((a, b) => b.count - a.count).map(n => {
      const en = n.sentence && n.sentence.split(' ').length <= 16 ? n.sentence : n.corrected;
      return { en, es: n.explanation };
    }).filter(it => it.en && !seen.has(it.en) && seen.add(it.en)).slice(0, 8);
    if (!dict.items.length) { toast('Aún no tienes errores guardados.'); return loadDict(Object.keys(PHRASES)[0]); }
  } else if (cat === 'ia') dict.items = dict.aiItems.slice();
  else {
    let pool = PHRASES[cat];
    if (S.level === 'A1') { const short = pool.filter(([en]) => en.split(' ').length <= 8); if (short.length >= 4) pool = short; }
    dict.items = shuffle(pool).slice(0, 8).map(([en, es]) => ({ en, es }));
  }
  dict.idx = 0; dict.total = 0; dict.results = []; renderDictCats(); showDictItem();
  $('#dictCard').hidden = false; $('#dictSummary').hidden = true;
}
function showDictItem() {
  dict.checked = false; dict.scored = false;
  $('#dictInput').value = ''; $('#dictResult').innerHTML = '';
  $('#dictCount').textContent = `${dict.idx + 1} / ${dict.items.length}`;
  $('#dictScore').textContent = dict.idx ? `Promedio ${Math.round(dict.total / dict.idx * 100)}%` : '';
  $('#dictNext').textContent = 'Saltar';
  // Traducción oculta: solo se muestra si la pides
  $('#dictEs').hidden = true; $('#dictEs').textContent = curDict() ? curDict().es || '' : '';
  $('#dictEsBtn').textContent = '👁 Ver en español';
}
$('#dictEsBtn').onclick = () => {
  const e = $('#dictEs'); e.hidden = !e.hidden;
  $('#dictEsBtn').textContent = e.hidden ? '👁 Ver en español' : '🙈 Ocultar español';
  if (!e.hidden && curDict()) curDict().usedEs = true;
};
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
  dict.checked = true;
  if (!dict.scored) {
    dict.scored = true; dict.total += score; bump('dict');
    dict.results.push({ en: it.en, es: it.es, score, usedEs: !!it.usedEs, wrong: ops.filter(o => o.t === 'sub' || o.t === 'miss').map(o => o.a) });
  }
  const pct = Math.round(score * 100);
  const label = pct === 100 ? (voice ? '¡Se te entendió todo!' : 'Perfecto') : voice ? `Se entendió el ${pct}%` : pct + '% correcto';
  $('#dictResult').innerHTML = `<div class="verdict" style="color:${pct === 100 ? 'var(--ok)' : pct >= 70 ? 'var(--hivis)' : 'var(--bad)'}">${label}</div>
    <div class="line">${renderOps(ops)}</div>
    ${voice ? `<div class="heard">El teléfono escuchó: "${esc(typed)}"</div>` : ''}
    ${voice && pct < 100 ? '<p class="muted small">Las palabras marcadas no se entendieron: escúchalas de nuevo en lento y repite.</p>' : ''}`;
  ops.filter(o => o.t === 'sub' && o.b.length > 1).forEach(o =>
    addNote(voice
      ? { original: o.b, corrected: o.a, explanation: 'Pronunciación: el teléfono entendió otra palabra. Escúchala y repítela.', type: 'pronunciation', sentence: it.en, source: 'Dictado hablado' }
      : { original: o.b, corrected: o.a, explanation: 'Escuchaste mal o escribiste mal esta palabra.', type: 'spelling', sentence: it.en, source: 'Dictado' }));
  $('#dictNext').textContent = dict.idx + 1 < dict.items.length ? 'Siguiente' : 'Terminar';
}
function nextDict() {
  if (dict.idx + 1 >= dict.items.length) { showDictSummary(); return; }
  dict.idx++; showDictItem(); speak(curDict().en);
}
$('#dictCheck').onclick = checkDict;
// Resultado final de la ronda de dictado
function showDictSummary() {
  speechSynthesis.cancel();
  const r = dict.results || [], n = r.length;
  if (!n) { loadDict(dict.cat); return; }
  const avg = Math.round(r.reduce((a, x) => a + x.score, 0) / n * 100);
  const perfect = r.filter(x => x.score === 1).length, withEs = r.filter(x => x.usedEs).length;
  const words = [...new Set(r.flatMap(x => x.wrong))].slice(0, 14);
  const color = avg >= 85 ? 'var(--ok)' : avg >= 60 ? 'var(--c-home)' : 'var(--bad)';
  const msg = avg >= 85 ? '¡Excelente oído!' : avg >= 60 ? 'Vas bien. Repite las frases difíciles en lento.' : 'Sigue practicando: repite esta ronda en modo lento.';
  const failed = r.filter(x => x.score < 1);
  $('#dictCard').hidden = true; $('#dictSummary').hidden = false;
  $('#dictSummary').innerHTML = `<div class="summary">
    <div class="sum-head"><div><strong>Resultado del dictado</strong><br><span class="muted small">${esc(dict.cat === 'ia' ? 'Frases nuevas (IA)' : CATEGORY_NAMES[dict.cat] || '')} · ${S.dictAnswer === 'voice' ? 'respondiendo con voz' : 'escribiendo'}</span></div></div>
    <div class="sum-ring" style="--p:${avg};--rc:${color}"><div><b>${avg}%</b><small>de palabras</small></div></div>
    <p class="sum-msg">${msg}</p>
    <div class="sum-stats">
      <div><b>${perfect} de ${n}</b><small>frases perfectas</small></div>
      <div><b>${words.length}</b><small>palabras falladas</small></div>
      <div><b>${withEs}</b><small>con ayuda en español</small></div>
    </div>
    ${words.length ? `<div class="sum-errs"><strong>Palabras para repasar</strong><p>${words.map(w => `<span class="chip-word">${esc(w)}</span>`).join(' ')}</p></div>` : ''}
    ${failed.length ? `<div class="sum-errs"><strong>Frases con errores</strong>${failed.map(x => `<div class="fix"><span class="to">${esc(x.en)}</span><span class="why">${esc(x.es || '')} · ${Math.round(x.score * 100)}%</span></div>`).join('')}</div>` : ''}
    <div class="row-btns">
      ${failed.length ? '<button class="btn" id="dictRetry">Repetir las difíciles</button>' : ''}
      <button class="btn primary" id="dictAgain">Nueva ronda</button>
    </div></div>`;
  const rt = $('#dictRetry');
  if (rt) rt.onclick = () => { dict.items = failed.map(x => ({ en: x.en, es: x.es })); dict.idx = 0; dict.total = 0; dict.results = []; $('#dictCard').hidden = false; $('#dictSummary').hidden = true; showDictItem(); speak(curDict().en); };
  $('#dictAgain').onclick = () => loadDict(dict.cat);
}
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
  const topic = TOPIC.categoryEn[dict.cat] || (TOPIC_ID === 'mill' && TOPIC_EN[dict.cat]) || TOPIC.nameEn;
  try {
    const r = await gemini(
      `You create listening dictation exercises for ${TOPIC.learner} learning English (CEFR ${S.level}). ${CONTEXT}`,
      [{ role: 'user', parts: [{ text: `Create 8 different sentences (6 to 14 words) that people in this context would really say. Topic: ${topic}. Natural spoken English, level ${S.level}. Write numbers in digits. ${weak ? 'Try to include some of these words the learner got wrong before: ' + weak + '.' : ''} Respond ONLY with JSON: {"items":[{"en":"...","es":"Spanish (Chile) translation"}]}` }] }], 1);
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
  $('#groqKey').value = S.groqKey || ''; $('#groqVoice').checked = S.groqVoice !== false;
  fillGroqModels(['openai/gpt-oss-120b', 'qwen/qwen3.8-27b']);
  $('#autoSend').checked = S.autoSend; $('#autoSpeak').checked = S.autoSpeak;
  $('#silence').value = String(S.silence ?? 5);
  $('#micMode').value = S.micMode || 'record';
  $('#appVersion').textContent = 'My English Practice · versión ' + APP_VERSION;
  $('#rate').value = S.rate; $('#rateVal').textContent = S.rate + 'x';
  $('#pitch').value = S.pitch; $('#pitchVal').textContent = S.pitch;
  fillModels(['gemini-3.5-flash-lite', 'gemini-3.8-flash']);
}
$('#apiKey').addEventListener('change', e => { S.apiKey = e.target.value.trim(); persist(); updateHome(); });
$('#groqKey').addEventListener('change', e => { S.groqKey = e.target.value.trim(); persist(); updateHome(); });
$('#groqModel').addEventListener('change', e => { S.groqModel = e.target.value; persist(); });
$('#groqVoice').addEventListener('change', e => { S.groqVoice = e.target.checked; persist(); });
function fillGroqModels(list) {
  const set = new Set(list); set.add(S.groqModel);
  $('#groqModel').innerHTML = [...set].map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join(''); $('#groqModel').value = S.groqModel;
}
$('#btnGroqModels').onclick = async () => {
  S.groqKey = $('#groqKey').value.trim(); persist();
  if (!S.groqKey) { toast('Pega tu clave de Groq primero.'); return; }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: 'Bearer ' + S.groqKey } });
    if (!res.ok) throw Object.assign(new Error(res.statusText), { status: res.status, provider: 'groq' });
    const ids = ((await res.json()).data || []).map(m => m.id).filter(id => !/whisper|tts|guard|playai|orpheus|prompt|distil|compound/i.test(id)).sort();
    if (!ids.length) throw new Error('No se encontraron modelos.');
    fillGroqModels(ids);
    if (!ids.includes(S.groqModel)) { S.groqModel = ids.find(i => /gpt-oss-120b/.test(i)) || ids[0]; $('#groqModel').value = S.groqModel; persist(); }
    toast(`${ids.length} modelos de Groq encontrados.`);
  } catch (e) { toast(aiErrorMsg(e), 4000); }
};
$('#btnGroqTest').onclick = async () => {
  S.groqKey = $('#groqKey').value.trim(); persist(); updateHome();
  $('#groqStatus').textContent = 'Probando…';
  try {
    const r = await groqChat('Reply only with JSON.', [{ role: 'user', parts: [{ text: 'Return JSON {"ok":true,"msg":"a short friendly greeting for an English learner"}' }] }], 0.5);
    $('#groqStatus').textContent = '✓ Groq conectado: ' + (r.msg || 'OK');
  } catch (e) { $('#groqStatus').textContent = aiErrorMsg(e); }
};
$('#model').addEventListener('change', e => { S.model = e.target.value; fallbackNotified = ''; persist(); });
$('#backupModel').addEventListener('change', e => { S.backupModel = e.target.value; persist(); });
$('#level').addEventListener('change', e => { S.level = e.target.value; persist(); });
$('#goal').addEventListener('change', e => { S.goal = +e.target.value; persist(); updateHome(); });
$('#autoSend').addEventListener('change', e => { S.autoSend = e.target.checked; persist(); });
$('#silence').addEventListener('change', e => { S.silence = +e.target.value; persist(); });
$('#micMode').addEventListener('change', e => { S.micMode = e.target.value; persist(); });
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
$$('[data-test]').forEach(b => b.onclick = () => { const k = b.dataset.test; const line = (PERSONAS[k] && PERSONAS[k].greet) || (TEST_LINES[k] || [])[0] || 'Hello!'; speak(line, S.rate, k); });
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
    const r = await gemini('Reply only with JSON.', [{ role: 'user', parts: [{ text: 'Return {"ok":true,"msg":"a short friendly greeting for an English learner"}' }] }], 0.5);
    $('#keyStatus').textContent = '✓ Conexión correcta: ' + (r.msg || 'OK');
  } catch (e) { $('#keyStatus').textContent = aiErrorMsg(e); }
};
$('#btnExport').onclick = () => {
  const { apiKey, groqKey, ...rest } = S;
  const blob = new Blob([JSON.stringify({ settings: rest, data: D }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `my-english-respaldo-${dayKey()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
$('#fileImport').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (j.settings) Object.assign(S, j.settings, { apiKey: S.apiKey, groqKey: S.groqKey });
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
function allDialogs() { return [...customDialogs().filter(d => (d.theme || 'mill') === TOPIC_ID), ...DIALOGS]; }
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
  $('#lpStage').innerHTML = Object.entries(d.speakers).map(([k, [nm, role]]) =>
    `<div class="actor" data-sp="${k}">${avatarHTML(AVATARS[role] ? role : 'local', nm, 'lg')}<span class="nm" style="color:${speakerColor(d, k)}">${esc(nm)}</span></div>`).join('');
  $('#lpResult').innerHTML = '';
  renderTranscript(); renderQuestions();
}
function speakerColor(d, key) { return SPEAKER_COLORS[Object.keys(d.speakers).indexOf(key)] || 'var(--c-listen)'; }
function renderTranscript() {
  const d = lst.dlg;
  $('#lpShowText').textContent = lst.showText ? 'Ocultar texto' : 'Mostrar texto';
  $('#lpShowEs').textContent = lst.showEs ? 'Ocultar traducción' : 'Mostrar traducción';
  const avKey = sp => AVATARS[d.speakers[sp][1]] ? d.speakers[sp][1] : 'local';
  $('#lpLines').innerHTML = d.lines.map(([sp, en, es], i) => `<div class="tline" data-i="${i}" style="--sc:${speakerColor(d, sp)}">
    ${avatarHTML(avKey(sp), d.speakers[sp][0], 'sm')}<div class="tl-body">
    <span class="sp">${esc(d.speakers[sp][0])}:</span> <span class="en ${lst.showText ? '' : 'hide'}">${esc(en)}</span>
    ${lst.showEs ? `<div class="es">${esc(es)}</div>` : ''}</div></div>`).join('');
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
  $('#lpPlay').textContent = '■ Detener'; $('#lpStage').classList.add('playing');
  for (let i = from; i <= to; i++) {
    if (token !== playToken) return;
    $$('#lpLines .tline').forEach(el => el.classList.toggle('now', +el.dataset.i === i));
    if (from !== to) $(`#lpLines .tline[data-i="${i}"]`)?.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    const [sp, en] = d.lines[i];
    $$('#lpStage .actor').forEach(el => el.classList.toggle('now', el.dataset.sp === sp));
    const avs = [$(`#lpStage .actor[data-sp="${sp}"] .av`), $(`#lpLines .tline[data-i="${i}"] .av`)].filter(Boolean);
    await speak(en, rate, roles[sp], avs, sameVoice && sp === 'B' ? 1.2 : null);
    await wait(350);
  }
  if (token === playToken) { $$('#lpLines .tline').forEach(el => el.classList.remove('now')); $$('#lpStage .actor').forEach(el => el.classList.remove('now')); $('#lpStage').classList.remove('playing'); $('#lpPlay').textContent = '▶ Escuchar conversación'; }
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
  if ($('#lpPlay').textContent.startsWith('■')) { playToken++; speechSynthesis.cancel(); stopTalking(); $('#lpStage').classList.remove('playing'); $('#lpPlay').textContent = '▶ Escuchar conversación'; $$('#lpLines .tline').forEach(el => el.classList.remove('now')); return; }
  playLines(0, lst.dlg.lines.length - 1, S.rate);
};
$('#lpSlow').onclick = () => playLines(0, lst.dlg.lines.length - 1, 0.7);
$('#lpShowText').onclick = () => { lst.showText = !lst.showText; renderTranscript(); };
$('#lpShowEs').onclick = () => { lst.showEs = !lst.showEs; renderTranscript(); };
$('#listenBack').onclick = () => { playToken++; speechSynthesis.cancel(); $('#listenPlayer').hidden = true; $('#listenBrowse').hidden = false; renderListenList(); };
// Genera una conversación de listening sobre cualquier tema (lista, tema escrito o artículo)
async function generateDialog(topicText, btn, label, extra = {}) {
  btn.disabled = true; const old = btn.textContent; btn.textContent = 'Creando conversación…';
  try {
    const r = await gemini(
      `You write realistic listening-practice dialogues for ${TOPIC.learner} learning English. ${CONTEXT}
Available speakers (use exactly these role ids): ${Object.entries(PERSONAS).map(([k, p]) => `"${k}" (${p.en.split('.')[0]})`).join(', ')}, "local" (${TOPIC.locals}).${TOPIC_ID === 'mill' ? ' You may also use the USNR technicians Krim, Lenan, Andrew or Jonathan: in that case use role "mattias" or "alvaro" for their voice.' : ''}`,
      [{ role: 'user', parts: [{ text: `Write one dialogue between two speakers about: ${topicText}
(The topic may be written in Spanish: understand it and write the dialogue in English.) CEFR level ${S.level}. 8 to 10 lines, natural spoken English as it would really happen in real life. Then write 3 multiple-choice comprehension questions with 3 options each.
Respond ONLY with JSON:
{"title_es":"short title in Spanish","context_es":"one sentence in Spanish describing the situation","speakers":{"A":{"name":"...","role":"${Object.keys(PERSONAS).join('|')}|local"},"B":{"name":"...","role":"..."}},"lines":[{"s":"A","en":"...","es":"Spanish (Chile) translation"}],"questions":[{"q":"question in English","es":"question in Spanish","options":["...","...","..."],"answer":0}]}` }] }], 0.9);
    const ok = [...Object.keys(PERSONAS), 'local'];
    const sp = k => [r.speakers[k].name, ok.includes(r.speakers[k].role) ? r.speakers[k].role : 'local'];
    const d = { id: 'ai-' + Date.now(), topic: 'ai', theme: TOPIC_ID, level: S.level, title: r.title_es || 'Conversación nueva', context: r.context_es || '',
      speakers: { A: sp('A'), B: sp('B') },
      lines: (r.lines || []).filter(l => l.en && r.speakers[l.s]).map(l => [l.s, l.en, l.es || '']),
      questions: (r.questions || []).filter(q => q.options && q.options.length).map(q => ({ q: q.q, es: q.es, o: q.options, a: Math.min(+q.answer || 0, q.options.length - 1) })), ...extra };
    if (d.lines.length < 3) throw new Error('La conversación llegó incompleta. Intenta de nuevo.');
    saveCustomDialogs([d, ...customDialogs()]);
    show('listen'); openDialog(d.id);
    toast('Conversación nueva lista. Toca ▶ para escucharla.');
  } catch (e) { toast(aiErrorMsg(e), 4000); }
  finally { btn.disabled = false; btn.textContent = label || old; }
}
$('#listenAITopic').innerHTML = TOPIC.aiTopics.map(([en, es]) => `<option value="${esc(en)}">${esc(es)}</option>`).join('') +
  '<option value="__custom">✏️ Otro tema (escríbelo tú)</option>';
$('#listenAITopic').addEventListener('change', () => { $('#listenAICustom').hidden = $('#listenAITopic').value !== '__custom'; if (!$('#listenAICustom').hidden) $('#listenAICustom').focus(); });
$('#listenAI').onclick = () => {
  let t = $('#listenAITopic').value;
  if (t === '__custom') { t = $('#listenAICustom').value.trim(); if (!t) { toast('Escribe el tema de la conversación.'); $('#listenAICustom').focus(); return; } }
  generateDialog(t, $('#listenAI'), 'Generar conversación');
};

/* ============ Artículos en PDF ============ */
// Extrae el texto del PDF en el propio teléfono (pdf.js), para usarlo con Groq
async function pdfText(file) {
  if (!window.pdfjsLib) {
    await new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'; sc.onload = res; sc.onerror = () => rej(new Error('No se pudo cargar el lector de PDF (revisa tu conexión).')); document.head.appendChild(sc); });
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  let out = '';
  for (let i = 1; i <= Math.min(pdf.numPages, 30) && out.length < 14000; i++) {
    const page = await pdf.getPage(i), tc = await page.getTextContent();
    out += tc.items.map(it => it.str).join(' ') + '\n';
  }
  return out.replace(/\s+/g, ' ').trim();
}
function articles() { try { return JSON.parse(localStorage.getItem('me_articles') || '[]'); } catch { return []; } }
function saveArticles(list) { try { localStorage.setItem('me_articles', JSON.stringify(list.slice(0, 30))); } catch { toast('No queda espacio para más artículos. Borra alguno.'); } }
function articleBrief(a) { return `the article "${a.title_en}". Summary: ${a.summary_en} Key points: ${(a.points || []).join(' | ')}`; }
function renderArticles() {
  const list = articles();
  $('#articleList').innerHTML = list.map(a => `<div class="art" data-id="${a.id}">
    <div class="art-top"><strong>${esc(a.title_es || a.title_en)}</strong><button class="del" data-del="${a.id}" aria-label="Borrar">×</button></div>
    <small class="muted">${esc(TOPICS[a.theme]?.icon || '📄')} ${esc(a.title_en)}</small>
    <details><summary>Resumen y vocabulario</summary><p>${esc(a.summary_es || '')}</p>
      <p class="small">${(a.vocab || []).map(v => `<b>${esc(v.en)}</b> = ${esc(v.es)}`).join(' · ')}</p></details>
    <div class="art-acts">
      <button class="btn small primary" data-listen="${a.id}">🎧 Crear listening</button>
      <button class="btn small" data-talk="${a.id}">🗣 Conversar</button>
      <button class="btn small ghost" data-vocab="${a.id}">🃏 Vocabulario</button>
    </div></div>`).join('');
  $$('#articleList [data-listen]').forEach(b => b.onclick = () => { const a = articles().find(x => x.id === b.dataset.listen); generateDialog(articleBrief(a), b, '🎧 Crear listening', { article: a.id }); });
  $$('#articleList [data-talk]').forEach(b => b.onclick = () => startArticleTalk(b.dataset.talk));
  $$('#articleList [data-vocab]').forEach(b => b.onclick = () => {
    const a = articles().find(x => x.id === b.dataset.vocab), st = srs(); let n = 0;
    (a.vocab || []).forEach(v => { if (!st.custom.some(c => c.en === v.en)) { st.custom.push({ en: v.en, es: v.es }); n++; } });
    persist(); toast(n ? `${n} palabras agregadas a tus tarjetas.` : 'Ese vocabulario ya está en tus tarjetas.');
  });
  $$('#articleList [data-del]').forEach(b => b.onclick = () => { if (confirm('¿Borrar este artículo?')) { saveArticles(articles().filter(x => x.id !== b.dataset.del)); renderArticles(); } });
}
function startArticleTalk(id) {
  const a = articles().find(x => x.id === id); if (!a) return;
  const scId = 'art-' + a.id;
  if (!SCENARIOS.some(s => s.id === scId)) SCENARIOS.push({ group: '📄 Mis artículos', id: scId, es: 'Artículo: ' + (a.title_es || a.title_en),
    en: `You and the learner both read ${articleBrief(a)} Talk about the article naturally: ask what they understood, their opinion, how it applies to their own experience, and use its key vocabulary.` });
  renderScenarios(); $('#scenario').value = scId; $('#customScenario').hidden = true;
  show('talk'); resetTalk(); $('#scenario').value = scId;
  toast('Elige un personaje y toca "Empezar conversación".');
}
// Al iniciar, agregar los artículos como escenarios de conversación
articles().forEach(a => SCENARIOS.push({ group: '📄 Mis artículos', id: 'art-' + a.id, es: 'Artículo: ' + (a.title_es || a.title_en),
  en: `You and the learner both read ${articleBrief(a)} Talk about the article naturally: ask what they understood, their opinion, how it applies to their own experience, and use its key vocabulary.` }));
renderScenarios();
$('#pdfInput').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  if (!hasAI()) { toast('Para leer artículos necesitas la clave gratuita de Gemini o de Groq.'); show('settings'); return; }
  if (f.size > 15 * 1024 * 1024) { toast('El PDF es muy grande (máximo 15 MB). Prueba con un artículo más corto.'); return; }
  if (f.size > 4 * 1024 * 1024 && !confirm('Este PDF es grande y podría gastar de una vez el límite gratuito por minuto de la IA. Lo ideal son artículos de hasta 10–15 páginas. ¿Continuar igual?')) return;
  const btn = $('#pdfBtn'), txt = btn.firstChild; const old = txt.textContent; txt.textContent = '📖 Leyendo el artículo… (puede tardar un poco)';
  btn.classList.add('busy');
  try {
    const sysA = `You help ${TOPIC.learner} learn English with articles they find interesting.`;
    const ask = `Read this article (it may be in English or Spanish). Respond ONLY with JSON:
{"title_en":"short English title","title_es":"short Spanish title","theme":"mill|fire|fit|other (mill = sawmills/wood industry, fire = firefighting/emergencies/rescue/first aid, fit = gym/strength/fitness/nutrition)",
"summary_en":"summary in clear English for CEFR ${S.level}, 150 to 220 words","summary_es":"summary in Spanish (Chile), 60 to 90 words",
"points":["5 to 7 key points in English"],"vocab":[{"en":"key English word or expression from the article","es":"Spanish meaning"}]}
Include 12 to 15 vocab items that are useful to learn.`;
    let r;
    const viaGroq = async () => {
      txt.textContent = '📖 Extrayendo el texto del PDF…';
      const text = await pdfText(f);
      if (text.length < 200) throw new Error('No encontré texto en el PDF (¿es un escaneo?). Los PDF escaneados solo se pueden leer con Gemini.');
      txt.textContent = '📖 Leyendo el artículo con Groq…';
      return groqChat(sysA, [{ role: 'user', parts: [{ text: 'ARTICLE TEXT (may be cut):\n' + text.slice(0, 12000) + '\n\n' + ask }] }], 0.3);
    };
    if (S.apiKey) {
      try { r = await geminiOnly(sysA, [{ role: 'user', parts: [{ inlineData: { mimeType: 'application/pdf', data: await blobToB64(f) } }, { text: ask }] }], 0.3); }
      catch (e) { if (S.groqKey && canFallback(e)) { toast('Gemini llegó a su límite: leo el artículo con Groq.', 3000); r = await viaGroq(); } else throw e; }
    } else r = await viaGroq();
    if (!r.summary_en) throw new Error('No se pudo leer el artículo.');
    const a = { id: 'a' + Date.now().toString(36), theme: TOPICS[r.theme] ? r.theme : TOPIC_ID, title_en: r.title_en || f.name, title_es: r.title_es || '',
      summary_en: r.summary_en, summary_es: r.summary_es || '', points: (r.points || []).slice(0, 8), vocab: (r.vocab || []).filter(v => v.en).slice(0, 16), added: Date.now() };
    saveArticles([a, ...articles()]);
    SCENARIOS.push({ group: '📄 Mis artículos', id: 'art-' + a.id, es: 'Artículo: ' + (a.title_es || a.title_en), en: `You and the learner both read ${articleBrief(a)} Talk about the article naturally: ask what they understood, their opinion, how it applies to their own experience, and use its key vocabulary.` });
    renderScenarios(); renderArticles();
    toast('Artículo listo. Crea un listening, conversa sobre él o guarda su vocabulario.', 4000);
  } catch (err) { toast(aiErrorMsg(err), 4500); }
  finally { txt.textContent = old; btn.classList.remove('busy'); }
});

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
    notes: D.notes.length, cards: st.cards || 0, streak: streak(), totalMinutes: Math.round(total / 60) };
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
  const text = `Te invito a practicar inglés con My English Practice. Abre este enlace en Chrome, instala la app y crea tu usuario: ${link}`;
  try {
    if (navigator.share) await navigator.share({ title: 'My English Practice', text });
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

/* ============ Repaso con tarjetas (repetición espaciada) ============ */
const INTERVALS = [0, 1, 3, 7, 14, 30, 60];   // días según la "caja" de la tarjeta
const NEW_PER_DAY = 10;
function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return dayKey(d); }
function srs() {
  if (!D.srs) D.srs = { cards: {}, custom: [], newDay: '', newCount: 0, extra: 0 };
  if (D.srs.newDay !== dayKey()) { D.srs.newDay = dayKey(); D.srs.newCount = 0; D.srs.extra = 0; }
  return D.srs;
}
function cardSource(key) {
  if (key.startsWith('w:')) { const w = WORDS.find(x => x[0] === key.slice(2)); return w && { kind: TOPIC.wordsLabel, front: w[1], back: w[0], say: w[0] }; }
  if (key.startsWith('n:')) { const n = D.notes.find(x => x.key === key.slice(2)); return n && { kind: 'Tus errores', front: `Corrige: «${n.original}»`, back: n.corrected, sub: n.sentence || n.explanation, say: n.sentence || n.corrected }; }
  if (key.startsWith('c:')) { const c = srs().custom.find(x => 'c:' + x.en === key); return c && { kind: 'Guardada del tutor', front: c.es, back: c.en, say: c.en }; }
  return null;
}
let rq = [], rcur = null;
function buildReviewQueue() {
  const st = srs(), today = dayKey();
  const due = Object.entries(st.cards).filter(([k, c]) => c.due <= today && cardSource(k)).map(([k]) => k);
  const allowNew = Math.max(0, NEW_PER_DAY + st.extra - st.newCount);
  const candidates = [
    ...D.notes.slice().sort((a, b) => b.count - a.count).map(n => 'n:' + n.key),
    ...st.custom.map(c => 'c:' + c.en),
    ...WORDS.map(w => 'w:' + w[0])
  ].filter(k => !st.cards[k]);
  rq = shuffle(due).concat(candidates.slice(0, allowNew));
}
function showCard() {
  const st = srs();
  rcur = rq.shift() || null;
  const dueLeft = rq.length + (rcur ? 1 : 0);
  const known = Object.values(st.cards).filter(c => c.box >= 3).length;
  $('#cardsCount').textContent = rcur ? `Quedan ${dueLeft} hoy` : '';
  $('#cardsStats').textContent = `${Object.keys(st.cards).length} tarjetas · ${known} bien aprendidas`;
  $('#fcBack').hidden = true; $('#fcGrade').hidden = true;
  if (!rcur) {
    const tomorrow = Object.values(st.cards).filter(c => c.due === addDays(1)).length;
    $('#fcKind').textContent = '';
    $('#fcFront').innerHTML = `¡Listo por hoy! 🎉<small class="muted" style="display:block;font-size:15px;font-weight:400;margin-top:8px">Mañana te esperan ${tomorrow} tarjetas.</small>`;
    $('#fcShow').textContent = 'Estudiar 10 tarjetas más';
    const t = todayStats(); if (!t.reviewDone) { t.reviewDone = 1; persist(); updateHome(); }
    return;
  }
  const c = cardSource(rcur);
  $('#fcKind').textContent = c.kind + (st.cards[rcur] ? '' : ' · nueva');
  $('#fcFront').textContent = c.front;
  $('#fcBack').innerHTML = `${esc(c.back)}${c.sub ? `<small>${esc(c.sub)}</small>` : ''}<div><button class="btn ghost small" id="fcSay">🔊 Escuchar</button></div>`;
  $('#fcShow').textContent = 'Mostrar respuesta';
  $('#fcShow').hidden = false;
}
$('#fcShow').onclick = () => {
  if (!rcur) { srs().extra += 10; persist(); buildReviewQueue(); showCard(); return; }
  $('#fcBack').hidden = false; $('#fcGrade').hidden = false; $('#fcShow').hidden = true;
  const c = cardSource(rcur); $('#fcSay').onclick = () => speak(c.say, S.rate, 'narrator'); speak(c.back, S.rate, 'narrator');
};
$$('#fcGrade button').forEach(b => b.onclick = () => {
  const g = +b.dataset.g, st = srs();
  let card = st.cards[rcur];
  if (!card) { card = st.cards[rcur] = { box: 0, due: dayKey() }; st.newCount++; }
  if (g === 0) { card.box = 1; card.due = dayKey(); rq.splice(Math.min(3, rq.length), 0, rcur); }
  else { card.box = Math.min(card.box + (g === 2 ? 2 : 1), INTERVALS.length - 1); card.due = addDays(INTERVALS[card.box]); }
  todayStats().cards = (todayStats().cards || 0) + 1;
  persist(); updateHome(); showCard();
});
function applyReviewMode(mode) {
  $$('#reviewModes button').forEach(b => b.classList.toggle('on', b.dataset.rv === mode));
  $('#cardsPanel').hidden = mode !== 'cards'; $('#notesPanel').hidden = mode !== 'notes';
  if (mode === 'cards') { buildReviewQueue(); showCard(); }
  else { renderNotes(); if (D.notes.length && !todayStats().notes) bump('notes'); }
}
$$('#reviewModes button').forEach(b => b.onclick = () => applyReviewMode(b.dataset.rv));

/* ============ Tutor de dudas ============ */
let tutorHistory = [];
function tutorSystem() {
  const u = me();
  return `You are a friendly, patient English tutor for ${TOPIC.learner}. ${CONTEXT}
The student is ${u.name !== 'Yo' ? u.name : 'a worker'}${u.role ? ', ' + u.role : ''}, CEFR level ${S.level}. They ask questions in Spanish about English: grammar, vocabulary, how to say something at work, pronunciation, or phrases they heard or read.
Answer in simple Chilean Spanish, clear and short (maximum about 120 words). Give 2 or 3 English examples related to this topic when useful. If they ask how to say something, give the most natural option first, and a more formal one if relevant. For pronunciation, explain with Spanish-friendly approximations.
Respond ONLY with JSON: {"answer_es":"...","examples":[{"en":"...","es":"..."}]}`;
}
function tutorAdd(html, cls) {
  const div = document.createElement('div'); div.className = cls; div.innerHTML = html;
  $('#tutorChat').appendChild(div); scrollChatToEnd();
  return div;
}
async function tutorAsk(q) {
  q = (q || '').trim(); if (!q) return;
  if (!hasAI()) { toast('Primero configura tu clave gratuita de Gemini en Ajustes.'); show('settings'); return; }
  $('#tutorInput').value = '';
  tutorAdd(esc(q), 'msg me');
  tutorHistory.push({ role: 'user', parts: [{ text: q }] });
  if (tutorHistory.length > 12) { tutorHistory = tutorHistory.slice(-10); while (tutorHistory[0].role !== 'user') tutorHistory.shift(); }
  const typing = tutorAdd('Pensando…', 'msg ai typing');
  try {
    const r = await gemini(tutorSystem(), tutorHistory, 0.6);
    typing.remove();
    const div = tutorAdd(`<div class="who">${avatarHTML('tutor', 'Tutor', 'md')}Tutor</div><div class="tutor-answer">${esc(r.answer_es || '')}</div>` +
      (r.examples || []).map((ex, i) => `<div class="tutor-ex"><div>${esc(ex.en)}</div><div class="es">${esc(ex.es)}</div>
        <button data-say="${i}">🔊 Escuchar</button> <button data-save="${i}">🃏 Guardar en tarjetas</button></div>`).join(''), 'msg ai');
    const tav = div.querySelector('.av');
    div.querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(r.examples[+b.dataset.say].en, S.rate, 'narrator', tav));
    div.querySelectorAll('[data-save]').forEach(b => b.onclick = () => {
      const ex = r.examples[+b.dataset.save], st = srs();
      if (!st.custom.some(c => c.en === ex.en)) { st.custom.push({ en: ex.en, es: ex.es }); persist(); }
      b.textContent = '✓ Guardada'; b.disabled = true;
    });
    tutorHistory.push({ role: 'model', parts: [{ text: r.answer_es || '' }] });
    activity();
  } catch (e) { typing.remove(); tutorHistory.pop(); tutorAdd(esc(aiErrorMsg(e)), 'feedback has-errors'); $('#tutorInput').value = q; }
}
$('#tutorSend').onclick = () => tutorAsk($('#tutorInput').value);
$('#tutorInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); tutorAsk($('#tutorInput').value); } });
$$('#tutorChips .chip').forEach(b => b.onclick = () => tutorAsk(b.dataset.q));
$('#tutorMic').onclick = () => {
  const onText = t => { $('#tutorInput').value = t; };
  if (S.micMode === 'record') recordVoice({ button: $('#tutorMic'), lang: 'es-CL', input: $('#tutorInput'), onText });
  else listen({ button: $('#tutorMic'), lang: 'es-CL', onInterim: onText, onFinal: onText });
};
$('#btnTutor').onclick = () => show(currentView === 'tutor' ? 'home' : 'tutor');

/* ============ Test de nivel ============ */
const test = { i: 0, answers: [], order: [] };
function startTest() {
  test.i = 0; test.answers = [];
  $('#testIntro').hidden = true; $('#testResult').hidden = true; $('#testBody').hidden = false;
  showTestQ();
}
function showTestQ() {
  const q = TEST_QUESTIONS[test.i];
  $('#testCount').textContent = `Pregunta ${test.i + 1} de ${TEST_QUESTIONS.length}`;
  $('#testLevelTag').textContent = q.audio ? '🔊 Listening' : '';
  $('#testMeter').style.width = (test.i / TEST_QUESTIONS.length * 100) + '%';
  const opts = shuffle(q.o.map((o, i) => [o, i])).concat([['No sé', -1]]);
  $('#testQ').innerHTML = `${q.audio ? '<button class="play" id="testPlay">▶ Escuchar audio</button>' : ''}
    <strong>${esc(q.q)}</strong>${q.es ? `<div class="qes">${esc(q.es)}</div>` : ''}
    ${opts.map(([o, i]) => `<button data-i="${i}">${esc(o)}</button>`).join('')}`;
  if (q.audio) { $('#testPlay').onclick = () => speak(q.audio, 0.95, 'mattias'); setTimeout(() => speak(q.audio, 0.95, 'mattias'), 300); }
  $$('#testQ button[data-i]').forEach(b => b.onclick = () => {
    test.answers.push({ lvl: q.lvl, ok: +b.dataset.i === q.a });
    test.i++;
    if (test.i < TEST_QUESTIONS.length) showTestQ(); else finishTest();
  });
}
function finishTest() {
  speechSynthesis.cancel();
  const lv = ['A1', 'A2', 'B1', 'B2', 'C1'];
  const score = {}; lv.forEach(l => score[l] = test.answers.filter(a => a.lvl === l && a.ok).length);
  // Se aprueba un nivel con 2 de 3; el resultado es el último nivel aprobado de corrido (mínimo A1)
  let result = 'A1';
  for (const l of lv) { if (score[l] >= 2) result = l; else break; }
  $('#testBody').hidden = true; $('#testResult').hidden = false;
  $('#testResult').innerHTML = `<div class="card-plain" style="text-align:center">
    <p class="muted">Tu nivel estimado</p><div class="lvl-big">${result}</div>
    <p>${esc(LEVEL_DESC[result])}</p>
    <p class="muted small">${lv.map(l => `${l}: ${score[l]}/3`).join(' · ')}</p>
    <button class="btn primary wide" id="testApply">Usar nivel ${result}</button>
    <button class="btn ghost wide" id="testAgain">Repetir test</button></div>`;
  $('#testApply').onclick = () => {
    S.level = result; me().level = result; me().tested = dayKey(); persist(); initSettings(); updateHome();
    toast(`Nivel ${result} aplicado. ¡A practicar!`); show('home');
  };
  $('#testAgain').onclick = startTest;
}
$('#testStart').onclick = startTest;
document.addEventListener('click', e => {
  if (e.target.closest('[data-go-test]')) { $('#testIntro').hidden = false; $('#testBody').hidden = true; $('#testResult').hidden = true; show('test'); }
});

/* ============ Tema de práctica ============ */
function renderTopicPick() {
  $('#topicPick').innerHTML = Object.values(TOPICS).map(t => `<button data-t="${t.id}" class="${t.id === TOPIC_ID ? 'on' : ''}"><span>${t.icon}</span>${esc(t.name)}</button>`).join('');
  $$('#topicPick button').forEach(b => b.onclick = () => {
    if (b.dataset.t === TOPIC_ID) return;
    me().topic = b.dataset.t; persist();
    location.href = location.pathname;          // recarga con el contenido del tema elegido
  });
}
renderTopicPick();
document.title = 'My English Practice · ' + TOPIC.name;

/* ============ Inicio de la app ============ */
initSettings();
applyDictMode();
renderPersonaPick();
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
  if (q.get('u')) setTimeout(() => toast('App actualizada a la versión ' + APP_VERSION), 600);
  if (q.toString()) history.replaceState(null, '', location.pathname);
})();
renderDictCats();
// Actualizaciones: busca versión nueva cada vez que se abre la app y recarga una vez cuando llega
if ('serviceWorker' in navigator) {
  let reloaded = false;
  const hadController = !!navigator.serviceWorker.controller, openedAt = Date.now();
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;                  // primera instalación: no hace falta recargar
    if (Date.now() - openedAt < 15000) { reloaded = true; location.reload(); return; }
    // Si ya estás practicando, no se interrumpe: se avisa y actualizas cuando quieras
    const t = $('#toast'); t.textContent = '🔄 Hay una versión nueva. Toca aquí para actualizar.';
    t.classList.add('show', 'clickable'); clearTimeout(toastTimer);
    t.onclick = () => { reloaded = true; location.reload(); };
  });
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
    .then(reg => { reg.update(); document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update(); }); })
    .catch(() => {}));
}
// Botón "Buscar actualización": borra solo los archivos guardados de la app (no tu progreso ni tu clave)
$('#btnUpdate').onclick = async () => {
  $('#btnUpdate').textContent = 'Buscando…';
  try {
    if ('caches' in window) for (const k of await caches.keys()) await caches.delete(k);
    if ('serviceWorker' in navigator) for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
  } catch {}
  location.href = location.pathname + '?u=' + Date.now();
};
