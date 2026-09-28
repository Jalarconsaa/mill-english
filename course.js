'use strict';
/* =====================================================================
   CURSO POR ETAPAS · VOCABULARIO · ESCUCHA CONTINUA
   Usa el contenido del tema activo (frases, vocabulario, listening y escenarios).
   ===================================================================== */

/* ---------- Vocabulario ampliado (base del tema + palabras nuevas creadas con IA) ---------- */
function vocabExtra() {
  D.vocabExtra = D.vocabExtra || {};
  return (D.vocabExtra[TOPIC_ID] = D.vocabExtra[TOPIC_ID] || []);
}
function allWords() {
  const seen = new Set(WORDS.map(w => w[0].toLowerCase()));
  const extra = ((D.vocabExtra || {})[TOPIC_ID] || []).filter(w => !seen.has(w[0].toLowerCase()));
  return WORDS.concat(extra);
}
function wordStatus(en) {
  const c = srs().cards['w:' + en];
  if (!c) return 'new';
  return c.box >= 3 ? 'known' : 'learning';
}
function markWord(en, ok) {
  const st = srs(), k = 'w:' + en;
  if (!ok) st.cards[k] = { box: 1, due: dayKey() };                       // vuelve pronto en las tarjetas
  else if (!st.cards[k]) st.cards[k] = { box: 1, due: addDays(1) };
  else if (st.cards[k].due <= dayKey()) { st.cards[k].box = Math.min(st.cards[k].box + 1, 6); st.cards[k].due = addDays([0, 1, 3, 7, 14, 30, 60][st.cards[k].box]); }
}
const normWord = t => String(t || '').toLowerCase().replace(/[’']/g, "'").replace(/[-_/]/g, ' ').replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ').trim();

/* ---------- Motor de quiz de vocabulario ---------- */
const qz = { items: [], i: 0, good: 0, title: '', onDone: null, answered: false };
const QUIZ_PROMPTS = {
  'es-en': '¿Cómo se dice en inglés?',
  'en-es': '¿Qué significa?',
  'listen': 'Escucha y elige la palabra',
  'type': 'Escribe en inglés'
};
function buildQuiz(words, modes) {
  const pool = allWords();
  return modes.map((mode, i) => {
    const w = words[i % words.length];
    const field = mode === 'en-es' ? 1 : 0;
    const others = shuffle(pool.filter(x => x[0] !== w[0] && x[field] !== w[field])).slice(0, 3).map(x => x[field]);
    return { mode, w, opts: shuffle([w[field], ...others]) };
  });
}
function startQuiz({ title, words, modes, onDone }) {
  if (!words.length) { toast('No hay palabras para practicar.'); return; }
  Object.assign(qz, { items: buildQuiz(shuffle(words), modes), i: 0, good: 0, title, onDone, results: [] });
  show('quiz'); renderQuizQ();
}
function renderQuizQ() {
  const q = qz.items[qz.i], n = qz.items.length;
  qz.answered = false;
  $('#qzCount').textContent = `${qz.title} · ${qz.i + 1} de ${n}`;
  $('#qzScore').textContent = `✓ ${qz.good}`;
  $('#qzMeter').style.width = (qz.i / n * 100) + '%';
  const [en, es] = q.w;
  let prompt = '';
  if (q.mode === 'es-en' || q.mode === 'type') prompt = `<div class="qz-word">${esc(es)}</div>`;
  if (q.mode === 'en-es') prompt = `<div class="qz-word">${esc(en)} <button class="btn ghost small" id="qzSay">🔊</button></div>`;
  if (q.mode === 'listen') prompt = `<button class="play" id="qzSay">🔊 Escuchar</button>`;
  const answer = q.mode === 'type'
    ? `<input id="qzInput" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Escribe la palabra en inglés">
       <button class="btn primary wide" id="qzCheck">Revisar</button>`
    : q.opts.map(o => `<button class="qz-opt" data-o="${esc(o)}">${esc(o)}</button>`).join('');
  $('#qzBody').innerHTML = `<div class="card-plain qz-card"><p class="muted">${QUIZ_PROMPTS[q.mode]}</p>${prompt}<div class="qz-answers">${answer}</div><div id="qzFeedback"></div></div>`;
  const say = () => speak(en, S.rate, 'narrator');
  if ($('#qzSay')) $('#qzSay').onclick = say;
  if (q.mode === 'listen' || q.mode === 'en-es') setTimeout(say, 250);
  $$('#qzBody .qz-opt').forEach(b => b.onclick = () => answerQuiz(b.dataset.o === (q.mode === 'en-es' ? es : en), b));
  if (q.mode === 'type') {
    const check = () => { const v = $('#qzInput').value.trim(); if (!v) return; answerQuiz(normWord(v) === normWord(en), null, v); };
    $('#qzCheck').onclick = check;
    $('#qzInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    setTimeout(() => { const el = $('#qzInput'); if (el) el.focus(); }, 100);
  }
}
function answerQuiz(ok, btn, typed) {
  if (qz.answered) return; qz.answered = true;
  const q = qz.items[qz.i], [en, es] = q.w, right = q.mode === 'en-es' ? es : en;
  if (ok) qz.good++;
  qz.results.push({ en, es, ok });
  markWord(en, ok); persist();
  $$('#qzBody .qz-opt').forEach(b => { if (b.dataset.o === right) b.classList.add('right'); else if (b === btn) b.classList.add('wrong'); b.disabled = true; });
  $('#qzFeedback').innerHTML = `<div class="qz-fb ${ok ? 'ok' : 'bad'}"><strong>${ok ? '✓ ¡Correcto!' : '✗ Respuesta correcta:'}</strong>
    <div><b>${esc(en)}</b> = ${esc(es)} <button class="btn ghost small" id="qzSay2">🔊</button></div>
    ${!ok && typed ? `<small>Escribiste: ${esc(typed)}</small>` : ''}</div>
    <button class="btn primary wide" id="qzNext">Continuar</button>`;
  $('#qzSay2').onclick = () => speak(en, S.rate, 'narrator');
  speak(en, S.rate, 'narrator');
  $('#qzNext').onclick = () => { qz.i++; if (qz.i < qz.items.length) renderQuizQ(); else finishQuiz(); };
  activity();
}
function finishQuiz() {
  const n = qz.items.length, pct = Math.round(qz.good / n * 100);
  $('#qzMeter').style.width = '100%';
  const color = pct >= 85 ? 'var(--ok)' : pct >= 70 ? 'var(--c-home)' : 'var(--bad)';
  const wrong = qz.results.filter(r => !r.ok);
  $('#qzBody').innerHTML = `<div class="card-plain"><div class="summary">
    <strong>${esc(qz.title)}</strong>
    <div class="sum-ring" style="--p:${pct};--rc:${color}"><div><b>${pct}%</b><small>aciertos</small></div></div>
    <p class="sum-msg">${pct >= 85 ? '¡Excelente vocabulario!' : pct >= 70 ? '¡Bien! Ya casi las dominas.' : 'Estas palabras volverán en tus tarjetas para que las repases.'}</p>
    ${wrong.length ? `<div class="sum-errs"><strong>Para repasar</strong>${wrong.map(r => `<div class="fix"><span class="to">${esc(r.en)}</span><span class="why">${esc(r.es)}</span></div>`).join('')}</div>` : ''}
    <div class="row-btns"><button class="btn" id="qzAgain">Repetir</button><button class="btn primary" id="qzDone">Continuar</button></div>
  </div></div>`;
  const words = qz.items.map(x => x.w), modes = qz.items.map(x => x.mode), title = qz.title, onDone = qz.onDone;
  $('#qzAgain').onclick = () => startQuiz({ title, words, modes, onDone });
  $('#qzDone').onclick = () => { if (onDone) onDone(); else show('notes'); };
  if (typeof lessonHook === 'function') lessonHook('vocab', qz.good / n);
}

/* ---------- Panel de vocabulario (Repaso → Vocabulario) ---------- */
let vocabFilter = '';
function renderVocab() {
  const words = allWords();
  const counts = { known: 0, learning: 0, new: 0 };
  words.forEach(w => counts[wordStatus(w[0])]++);
  const q = normWord(vocabFilter);
  const list = words.filter(w => !q || normWord(w[0]).includes(q) || normWord(w[1]).includes(q));
  $('#vocabPanel').innerHTML = `
    <div class="vocab-stats">
      <div><b>${counts.known}</b><small>aprendidas</small></div>
      <div><b>${counts.learning}</b><small>en repaso</small></div>
      <div><b>${counts.new}</b><small>nuevas</small></div>
    </div>
    <div class="meter"><div class="meter-fill" style="width:${words.length ? Math.round(counts.known / words.length * 100) : 0}%"></div></div>
    <p class="muted small">${words.length} palabras de ${esc(TOPIC.name)}. Una palabra queda "aprendida" cuando la aciertas varias veces en días distintos.</p>
    <div class="vocab-modes">
      <button class="btn primary" data-vq="mix">⚡ Quiz rápido</button>
      <button class="btn" data-vq="listen">🎧 Escucha y elige</button>
      <button class="btn" data-vq="type">✍️ Escribe</button>
    </div>
    <div class="card-plain ai-box">
      <strong>✨ Palabras nuevas con IA</strong>
      <input id="vocabAITopic" type="text" maxlength="120" placeholder="Tema (opcional), ej: herramientas del taller de sierras">
      <button class="btn wide" id="vocabAI">Crear 15 palabras nuevas</button>
    </div>
    <input id="vocabSearch" type="text" placeholder="🔎 Buscar palabra (inglés o español)" value="${esc(vocabFilter)}">
    <div class="vocab-list">${list.slice(0, 250).map(w => {
      const st = wordStatus(w[0]);
      return `<div class="vrow" data-w="${esc(w[0])}">
        <span class="vdot ${st}" title="${st === 'known' ? 'Aprendida' : st === 'learning' ? 'En repaso' : 'Nueva'}"></span>
        <div class="vtext"><b>${esc(w[0])}</b><small>${esc(w[1])}</small></div>
        <button class="btn ghost small" data-say>🔊</button>
        <button class="btn ghost small" data-ex>Ejemplo</button>
        <div class="vex" hidden></div></div>`;
    }).join('')}</div>`;
  $('#vocabSearch').addEventListener('input', e => {
    vocabFilter = e.target.value;
    clearTimeout(renderVocab.t); renderVocab.t = setTimeout(() => { renderVocab(); const el = $('#vocabSearch'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }, 250);
  });
  $$('#vocabPanel [data-vq]').forEach(b => b.onclick = () => vocabQuiz(b.dataset.vq));
  $$('#vocabPanel .vrow').forEach(r => {
    const en = r.dataset.w;
    r.querySelector('[data-say]').onclick = () => speak(en, S.rate, 'narrator');
    r.querySelector('[data-ex]').onclick = () => showExample(en, r.querySelector('.vex'), r.querySelector('[data-ex]'));
  });
  $('#vocabAI').onclick = aiNewWords;
}
function vocabQuiz(kind) {
  const words = allWords();
  // Primero las que no dominas
  const pick = shuffle(words.filter(w => wordStatus(w[0]) !== 'known')).concat(shuffle(words.filter(w => wordStatus(w[0]) === 'known'))).slice(0, 10);
  const modes = kind === 'listen' ? Array(10).fill('listen') : kind === 'type' ? Array(10).fill('type')
    : ['es-en', 'listen', 'en-es', 'es-en', 'type', 'listen', 'en-es', 'es-en', 'listen', 'type'];
  startQuiz({ title: kind === 'listen' ? 'Escucha y elige' : kind === 'type' ? 'Escribe la palabra' : 'Quiz rápido', words: pick, modes: modes.slice(0, pick.length),
    onDone: () => { show('notes'); applyReviewMode('vocab'); } });
}
async function showExample(en, box, btn) {
  if (!box.hidden) { box.hidden = true; return; }
  D.vocabEx = D.vocabEx || {};
  let ex = D.vocabEx[en];
  if (!ex) {
    // Primero se busca una frase del propio tema que use la palabra
    const found = Object.values(PHRASES).flat().filter(([p]) => normWord(p).includes(normWord(en))).slice(0, 2);
    if (found.length) ex = found.map(([e, s]) => ({ en: e, es: s }));
    else if (hasAI()) {
      btn.textContent = '…';
      try {
        const r = await gemini(`You write short, natural example sentences for ${TOPIC.learner} learning English. ${CONTEXT}`,
          [{ role: 'user', parts: [{ text: `Write 2 short example sentences (CEFR ${S.level}) using "${en}" in the context of the topic. Respond ONLY with JSON: {"examples":[{"en":"...","es":"Spanish (Chile) translation"}]}` }] }], 0.7);
        ex = (r.examples || []).filter(x => x.en).slice(0, 2);
      } catch (e) { toast(aiErrorMsg(e), 3500); }
      btn.textContent = 'Ejemplo';
    } else { toast('No hay ejemplos guardados para esta palabra. Configura la IA para generarlos.'); return; }
    if (ex && ex.length) { D.vocabEx[en] = ex; persist(); }
  }
  if (!ex || !ex.length) return;
  box.innerHTML = ex.map((x, i) => `<div class="vex-line"><span>${esc(x.en)}</span><small>${esc(x.es)}</small><button class="btn ghost small" data-i="${i}">🔊</button></div>`).join('');
  box.querySelectorAll('button').forEach(b => b.onclick = () => speak(ex[+b.dataset.i].en, S.rate, 'narrator'));
  box.hidden = false;
}
async function aiNewWords() {
  if (!hasAI()) { toast('Configura la clave de Gemini o Groq en Ajustes.'); return; }
  const btn = $('#vocabAI'), theme = $('#vocabAITopic').value.trim() || TOPIC.nameEn;
  btn.disabled = true; btn.textContent = 'Creando palabras…';
  try {
    const known = allWords().map(w => w[0]).slice(0, 160).join(', ');
    const r = await gemini(`You create vocabulary lists for ${TOPIC.learner} learning English. ${CONTEXT}`,
      [{ role: 'user', parts: [{ text: `Give 15 useful English words or short expressions (CEFR ${S.level}) about: ${theme}. The topic may be written in Spanish. Do NOT repeat any of these: ${known}. Respond ONLY with JSON: {"words":[{"en":"...","es":"Spanish (Chile) meaning"}]}` }] }], 0.8);
    const have = new Set(allWords().map(w => w[0].toLowerCase()));
    const add = (r.words || []).filter(w => w.en && w.es && !have.has(w.en.toLowerCase())).map(w => [w.en.trim(), w.es.trim()]);
    vocabExtra().push(...add); persist();
    toast(add.length ? `${add.length} palabras nuevas agregadas. Aparecerán en tus tarjetas y quizzes.` : 'No llegaron palabras nuevas. Prueba con otro tema.', 3500);
    renderVocab();
  } catch (e) { toast(aiErrorMsg(e), 4000); btn.disabled = false; btn.textContent = 'Crear 15 palabras nuevas'; }
}

/* ---------- Curso por etapas (camino con desbloqueo) ---------- */
const LESSON_TYPES = [
  { t: 'vocab', icon: '🃏', name: 'Vocabulario' },
  { t: 'dict', icon: '🎧', name: 'Dictado' },
  { t: 'listen', icon: '👂', name: 'Listening' },
  { t: 'talk', icon: '🗣', name: 'Conversación' }
];
const LEVEL_NAMES = { A1: 'Principiante', A2: 'Básico', B1: 'Intermedio', B2: 'Intermedio alto', C1: 'Avanzado', C2: 'Casi nativo' };
let COURSE = null;
function buildCourse() {
  const cats = Object.keys(PHRASES);
  const dlgs = DIALOGS.slice().sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
  const scen = SCENARIOS.filter(s => !s.id.startsWith('art-'));
  const per = Math.max(5, Math.ceil(WORDS.length / cats.length));
  return cats.map((c, i) => {
    const d = dlgs[Math.min(i, dlgs.length - 1)];
    const words = []; for (let k = 0; k < per; k++) words.push(WORDS[(i * per + k) % WORDS.length]);
    return { i, cat: c, name: CATEGORY_NAMES[c] || c, level: d.level, dialog: d.id, scenario: scen[i % scen.length].id, words };
  });
}
function cp() { D.course = D.course || {}; return (D.course[TOPIC_ID] = D.course[TOPIC_ID] || { l: {}, skip: -1 }); }
const lessonId = idx => `${TOPIC_ID}:${Math.floor(idx / 4)}:${LESSON_TYPES[idx % 4].t}`;
const isDone = idx => !!(cp().l[lessonId(idx)] || {}).done;
const isOpen = idx => idx === 0 || isDone(idx - 1) || idx <= cp().skip;
function nextLessonIdx() {
  const total = COURSE.length * 4;
  for (let i = 0; i < total; i++) if (!isDone(i) && isOpen(i)) return i;
  return -1;
}
const starsTxt = n => '★'.repeat(n) + '☆'.repeat(3 - n);
function renderPath() {
  if (!COURSE) COURSE = buildCourse();
  const total = COURSE.length * 4, done = Array.from({ length: total }, (_, i) => isDone(i)).filter(Boolean).length;
  const next = nextLessonIdx();
  const myLvl = LEVEL_ORDER.indexOf(S.level), canSkip = cp().skip < 0 && done === 0 && COURSE.some(s => LEVEL_ORDER.indexOf(s.level) < myLvl);
  let html = `<h2 class="section-title">Tu camino · ${esc(TOPIC.name)}</h2>
    <div class="path-head">
      <span class="xp-chip">⭐ ${D.xp || 0} XP</span>
      <span class="muted small">${done} de ${total} lecciones</span>
    </div>
    <div class="meter"><div class="meter-fill" style="width:${Math.round(done / total * 100)}%"></div></div>`;
  if (next >= 0) {
    const st = COURSE[Math.floor(next / 4)], lt = LESSON_TYPES[next % 4];
    html += `<button class="btn primary wide path-continue" data-lesson="${next}">▶ ${done ? 'Continuar' : 'Empezar'}: ${lt.icon} ${lt.name} · Etapa ${st.i + 1}</button>`;
  } else html += `<p class="sum-msg">🏆 ¡Completaste todo el camino de ${esc(TOPIC.name)}! Sigue repasando para mejorar tus estrellas.</p>`;
  if (canSkip) html += `<button class="btn ghost wide" id="pathSkip">⏩ Desbloquear hasta mi nivel (${esc(S.level)})</button>`;
  let lastLevel = '';
  COURSE.forEach(st => {
    if (st.level !== lastLevel) { lastLevel = st.level; html += `<div class="level-head">Nivel ${esc(st.level)} · ${esc(LEVEL_NAMES[st.level] || '')}</div>`; }
    const base = st.i * 4, stageOpen = isOpen(base);
    const stars = LESSON_TYPES.reduce((a, _, k) => a + ((cp().l[lessonId(base + k)] || {}).stars || 0), 0);
    const stageDone = LESSON_TYPES.every((_, k) => isDone(base + k));
    html += `<div class="stage-card ${stageOpen ? '' : 'locked'} ${stageDone ? 'done' : ''}">
      <div class="st-head"><b>${stageOpen ? '' : '🔒 '}Etapa ${st.i + 1}: ${esc(st.name)}</b><span class="st-stars">★ ${stars}/12</span></div>
      <div class="st-lessons">${LESSON_TYPES.map((lt, k) => {
        const idx = base + k, rec = cp().l[lessonId(idx)] || {};
        const state = rec.done ? 'done' : isOpen(idx) ? 'open' : 'locked';
        return `<button class="lesson ${state} ${idx === next ? 'next' : ''}" data-lesson="${idx}" ${state === 'locked' ? 'aria-disabled="true"' : ''}>
          <span class="l-ic">${state === 'locked' ? '🔒' : lt.icon}</span><span class="l-nm">${lt.name}</span>
          <span class="l-st">${rec.done ? starsTxt(rec.stars || 0) : state === 'open' ? 'Disponible' : ''}</span></button>`;
      }).join('')}</div></div>`;
  });
  $('#pathBox').innerHTML = html;
  $$('#pathBox [data-lesson]').forEach(b => b.onclick = () => {
    const idx = +b.dataset.lesson;
    if (!isOpen(idx)) { toast('Completa la lección anterior para desbloquear esta.'); return; }
    startLesson(idx);
  });
  const sk = $('#pathSkip');
  if (sk) sk.onclick = () => {
    const first = COURSE.findIndex(s => LEVEL_ORDER.indexOf(s.level) >= myLvl);
    cp().skip = (first < 0 ? COURSE.length - 1 : first) * 4; persist(); renderPath();
    toast('Etapas desbloqueadas hasta tu nivel. Puedes hacer las anteriores cuando quieras.');
  };
}

/* ---------- Lecciones ---------- */
let lessonCtx = null;
// Al volver al camino, el listening queda en su lista (no en la conversación de la lección)
function backToPath() {
  lessonCtx = null; lessonBanner(null);
  if (!radio.on) { playToken++; speechSynthesis.cancel(); $('#listenPlayer').hidden = true; $('#listenBrowse').hidden = false; }
  show('home');
  setTimeout(() => { const n = document.querySelector('#pathBox .lesson.next'); if (n) n.scrollIntoView({ block: 'center' }); }, 150);
}
function lessonBanner(html) {
  const b = $('#lessonBanner');
  if (!html) { b.hidden = true; b.innerHTML = ''; document.body.classList.remove('has-banner'); return; }
  b.innerHTML = html; b.hidden = false; document.body.classList.add('has-banner');
}
function startLesson(idx) {
  const st = COURSE[Math.floor(idx / 4)], lt = LESSON_TYPES[idx % 4];
  lessonCtx = { idx, id: lessonId(idx), type: lt.t, st };
  const label = `${lt.icon} Lección: ${lt.name} · Etapa ${st.i + 1}`;
  lessonBanner(`<span>${esc(label)}</span><button class="btn ghost small" id="lbExit">Salir</button>`);
  $('#lbExit').onclick = backToPath;
  if (lt.t === 'vocab') {
    startQuiz({ title: `Etapa ${st.i + 1} · Vocabulario`, words: st.words,
      modes: ['es-en', 'listen', 'en-es', 'es-en', 'listen', 'type', 'en-es', 'es-en'], onDone: () => show('home') });
  } else if (lt.t === 'dict') {
    show('dict'); loadDict(st.cat);
    dict.items = dict.items.slice(0, 6); dict.idx = 0; dict.results = []; showDictItem();
    toast('Escucha cada frase y escríbela (o repítela). Aprueba con 70%.', 3500);
  } else if (lt.t === 'listen') {
    stopRadio(true); show('listen'); openDialog(st.dialog);
    toast('Escucha la conversación y responde las 3 preguntas. Aprueba con 2 de 3.', 3500);
  } else if (lt.t === 'talk') {
    if (!hasAI()) {
      if (confirm('La conversación necesita la clave de Gemini o Groq. ¿Quieres saltar esta lección por ahora?')) lessonHook('talk', 0.6, { turns: 4, skipped: true });
      else { lessonCtx = null; lessonBanner(null); }
      return;
    }
    show('talk'); resetTalk();
    $('#scenario').value = st.scenario; $('#customScenario').hidden = true; renderPersonaPick();
    toast('Toca "Empezar conversación". Responde al menos 4 veces y luego toca "Terminar y ver resumen".', 4500);
  }
}
// Recibe el resultado de dictado, listening, conversación o vocabulario
function lessonHook(type, score, meta = {}) {
  if (!lessonCtx || lessonCtx.type !== type) return;
  let stars;
  if (type === 'talk') {
    if ((meta.turns || 0) < 4) { toast('Para completar la lección responde al menos 4 veces en la conversación.', 4000); return; }
    stars = meta.skipped ? 1 : score >= 0.8 ? 3 : score >= 0.6 ? 2 : 1;
  } else if (type === 'listen') stars = score >= 0.99 ? 3 : score >= 0.66 ? 2 : 0;
  else stars = score >= 0.95 ? 3 : score >= 0.85 ? 2 : score >= 0.7 ? 1 : 0;
  const ctx = lessonCtx, rec = cp().l[ctx.id] || {};
  if (!stars) {
    lessonBanner(`<span>✗ Aún no apruebas (${Math.round(score * 100)}%). ¡Inténtalo otra vez!</span>
      <button class="btn small primary" id="lbRetry">Reintentar</button><button class="btn ghost small" id="lbBack">Camino</button>`);
    $('#lbRetry').onclick = () => startLesson(ctx.idx);
    $('#lbBack').onclick = backToPath;
    return;
  }
  const first = !rec.done, prev = rec.stars || 0;
  const gain = first ? 10 + stars * 5 : Math.max(0, stars - prev) * 5 + 2;
  cp().l[ctx.id] = { done: true, stars: Math.max(prev, stars), best: Math.max(rec.best || 0, score) };
  D.xp = (D.xp || 0) + gain; todayStats().xp = (todayStats().xp || 0) + gain;
  persist();
  lessonCtx = null;
  const stageIdx = Math.floor(ctx.idx / 4);
  const stageDone = LESSON_TYPES.every((_, k) => isDone(stageIdx * 4 + k));
  lessonBanner(`<span>✓ ${starsTxt(stars)} · +${gain} XP${stageDone && first && ctx.idx % 4 === 3 ? ' · 🎉 ¡Etapa completada!' : ''}</span>
    <button class="btn small primary" id="lbBack">Volver al camino</button>`);
  $('#lbBack').onclick = backToPath;
  if (stageDone && first && ctx.idx % 4 === 3 && COURSE[stageIdx + 1]) toast(`🎉 Desbloqueaste la Etapa ${stageIdx + 2}: ${COURSE[stageIdx + 1].name}`, 4000);
}

/* ---------- Escucha continua (modo radio, sin preguntas) ---------- */
const radio = { on: false, paused: false, queue: [], i: 0, slow: false, skip: false, wake: null, resume: null, line: 0 };
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) radio.wake = await navigator.wakeLock.request('screen');
    else if (!on && radio.wake) { await radio.wake.release(); radio.wake = null; }
  } catch {}
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && radio.on && !radio.wake) keepAwake(true); });
function radioUI(on) {
  $('#radioBar').hidden = !on; $('#lpQBox').hidden = on; $('#lpPlayRow').hidden = on;
  $('#lpResult').hidden = on;
}
function startRadio() {
  const list = allDialogs().filter(d => lst.topic === 'all' || d.topic === lst.topic);
  if (!list.length) { toast('No hay conversaciones en este tema.'); return; }
  Object.assign(radio, { on: true, paused: false, queue: shuffle(list), i: 0, skip: false, line: 0 });
  lessonCtx = lessonCtx && lessonCtx.type === 'listen' ? null : lessonCtx;
  keepAwake(true);
  $('#radioPause').textContent = '⏸ Pausa';
  runRadio();
}
async function runRadio() {
  while (radio.on) {
    const d = radio.queue[radio.i % radio.queue.length];
    if (!lst.dlg || lst.dlg.id !== d.id) {
      const keepText = lst.showText, keepEs = lst.showEs;          // se mantiene tu preferencia de texto visible
      openDialog(d.id); radio.line = 0;
      if (keepText || keepEs) { lst.showText = keepText; lst.showEs = keepEs; renderTranscript(); }
    }
    radioUI(true);
    $('#radioInfo').innerHTML = `📻 <b>${esc(d.title)}</b> <small>(${radio.i % radio.queue.length + 1} de ${radio.queue.length}${radio.i >= radio.queue.length ? ', repitiendo' : ''})</small>`;
    const complete = await playLines(radio.line, d.lines.length - 1, radio.slow ? 0.72 : S.rate);
    if (!radio.on) break;
    if (radio.paused) { await new Promise(r => { radio.resume = r; }); continue; }
    if (complete || radio.skip) {
      radio.skip = false; radio.i++; radio.line = 0;
      if (complete) await wait(1800);                 // pausa entre conversaciones
      if (radio.i % radio.queue.length === 0) radio.queue = shuffle(radio.queue);
    }
  }
}
function stopRadio(silent) {
  if (!radio.on) return;
  radio.on = false; radio.paused = false; playToken++; speechSynthesis.cancel(); stopTalking();
  if (radio.resume) { radio.resume(); radio.resume = null; }
  keepAwake(false); radioUI(false);
  if (!silent) { $('#listenPlayer').hidden = true; $('#listenBrowse').hidden = false; renderListenList(); }
}
$('#radioStart').onclick = startRadio;
$('#radioPause').onclick = () => {
  if (!radio.paused) {
    radio.paused = true;
    const now = $('#lpLines .tline.now'); radio.line = now ? +now.dataset.i : 0;
    playToken++; speechSynthesis.cancel(); stopTalking();
    $('#radioPause').textContent = '▶ Seguir';
  } else {
    radio.paused = false; $('#radioPause').textContent = '⏸ Pausa';
    if (radio.resume) { const r = radio.resume; radio.resume = null; r(); }
  }
};
$('#radioNext').onclick = () => {
  radio.skip = true; radio.line = 0;
  if (radio.paused) { radio.paused = false; $('#radioPause').textContent = '⏸ Pausa'; radio.i++; radio.skip = false; if (radio.resume) { const r = radio.resume; radio.resume = null; r(); } }
  else { playToken++; speechSynthesis.cancel(); }
};
$('#radioSlow').onclick = () => { radio.slow = !radio.slow; $('#radioSlow').textContent = radio.slow ? '🐢 Lento: sí' : '🐢 Lento: no'; };
$('#radioStop').onclick = () => stopRadio();
// Salir del reproductor también detiene la radio
$('#listenBack').addEventListener('click', () => stopRadio(true));

/* ---------- Inicio ---------- */
COURSE = buildCourse();
renderPath();
