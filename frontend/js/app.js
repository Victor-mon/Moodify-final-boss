/* app.js — Lógica principal de Moodify */

/* ── DETECCIÓN AUTOMÁTICA DE API URL ─────────────────────────
   Evita hardcodear el puerto. Usa el mismo origin que sirve la página.
   Si el frontend lo sirve FastAPI en :8000, esta variable apunta a :8000.
   Si en algún momento cambia el puerto, no hay que tocar nada aquí.
─────────────────────────────────────────────────────────────── */


const API = window.location.origin;

const MINIMO_STATS = 10;

/* ── SISTEMA DE INTERNACIONALIZACIÓN ─────────────────────────── */
const I18N = {
  es: {
    nav_transform:    '✦ Transformar',
    nav_historial:    '📋 Historial',
    nav_favoritos:    '★ Favoritos',
    nav_estadisticas: '📊 Estadísticas',
    nav_config:       '⚙ Configuración',
    btn_transform:    'Transformar ✦',
    btn_translate:    'Traducir ✦',
    lang_output:      '🌐 Salida en',
    outputs_label:    '— VERSIONES ADAPTADAS',
    badge_dipl:       '🤝 Diplomático',
    badge_ejec:       '💼 Ejecutivo',
    badge_casu:       '😊 Casual',
    placeholder_dipl: 'La versión diplomática aparecerá aquí...',
    placeholder_ejec: 'La versión ejecutiva aparecerá aquí...',
    placeholder_casu: 'La versión casual aparecerá aquí...',
    textarea_ph:      'Escribe aquí tu mensaje — con groserías, slang, emojis o como salga...',
    sub_title:        '▸ REESCRITURA INTELIGENTE CON IA',
    copy_btn:         'Copiar',
    copied_btn:       '✓ Copiado',
    generating:       'Generando...',
    detecting:        '🌐 Idioma — Escribe para detectar',
    clippy_header:    'MOODIFY DICE',
    sec_historial:    '— HISTORIAL DE MENSAJES',
    sec_favoritos:    '— FAVORITOS',
    sec_estadisticas: '— TUS ESTADÍSTICAS',
    loading:          'Cargando...',
    error_historial:  'Error al cargar el historial.',
    error_favoritos:  'Error al cargar favoritos.',
    empty_historial:  'Aún no has transformado ningún mensaje.',
    empty_favoritos:  'Aún no tienes favoritos guardados.',
    cfg_title:        'Configuración',
    cfg_appearance:   'Apariencia',
    cfg_theme_lbl:    'Tema',
    cfg_theme_dark:   'Modo oscuro activo',
    cfg_theme_light:  'Modo claro activo',
    cfg_lang_lbl:     'Idioma del agente',
    cfg_lang_sub:     'Español está optimizado para México',
    cfg_account:      'Cuenta',
    cfg_username_lbl: 'Nombre de usuario',
    cfg_email_lbl:    'Correo electrónico',
    cfg_pass_lbl:     'Contraseña',
    cfg_pass_dots:    '••••••••',
    cfg_change:       'Cambiar',
    cfg_session:      'Sesión',
    cfg_logout:       '↩ Cerrar sesión',
    cfg_delete:       '✕ Eliminar cuenta',
    preview_en:       '🇺🇸 Vista previa en inglés',
    preview_es:       '🇲🇽 Vista previa en español',
  },
  en: {
    nav_transform:    '✦ Transform',
    nav_historial:    '📋 History',
    nav_favoritos:    '★ Favorites',
    nav_estadisticas: '📊 Statistics',
    nav_config:       '⚙ Settings',
    btn_transform:    'Transform ✦',
    btn_translate:    'Translate ✦',
    lang_output:      '🌐 Output in',
    outputs_label:    '— ADAPTED VERSIONS',
    badge_dipl:       '🤝 Diplomatic',
    badge_ejec:       '💼 Executive',
    badge_casu:       '😊 Casual',
    placeholder_dipl: 'The diplomatic version will appear here...',
    placeholder_ejec: 'The executive version will appear here...',
    placeholder_casu: 'The casual version will appear here...',
    textarea_ph:      'Write your message here — as it comes out...',
    sub_title:        '▸ INTELLIGENT AI REWRITING',
    copy_btn:         'Copy',
    copied_btn:       '✓ Copied',
    generating:       'Generating...',
    detecting:        '🌐 Language — Start typing to detect',
    clippy_header:    'MOODIFY SAYS',
    sec_historial:    '— MESSAGE HISTORY',
    sec_favoritos:    '— FAVORITES',
    sec_estadisticas: '— YOUR STATISTICS',
    loading:          'Loading...',
    error_historial:  'Error loading history.',
    error_favoritos:  'Error loading favorites.',
    empty_historial:  'You have not transformed any messages yet.',
    empty_favoritos:  'You have no saved favorites yet.',
    cfg_title:        'Settings',
    cfg_appearance:   'Appearance',
    cfg_theme_lbl:    'Theme',
    cfg_theme_dark:   'Dark mode active',
    cfg_theme_light:  'Light mode active',
    cfg_lang_lbl:     'Agent language',
    cfg_lang_sub:     'Spanish is optimized for Mexico',
    cfg_account:      'Account',
    cfg_username_lbl: 'Username',
    cfg_email_lbl:    'Email address',
    cfg_pass_lbl:     'Password',
    cfg_pass_dots:    '••••••••',
    cfg_change:       'Change',
    cfg_session:      'Session',
    cfg_logout:       '↩ Sign out',
    cfg_delete:       '✕ Delete account',
    preview_en:       '🇺🇸 English preview',
    preview_es:       '🇲🇽 Spanish preview',
  }
};

let currentLang = localStorage.getItem('moodify_agent_lang') || 'es';

function t(key) {
  return (I18N[currentLang] || I18N['es'])[key] || key;
}

function applyI18n() {
  /* Nav tabs */
  const navMap = {
    'transformar':    'nav_transform',
    'historial':      'nav_historial',
    'favoritos':      'nav_favoritos',
    'estadisticas':   'nav_estadisticas',
  };
  document.querySelectorAll('.nav-tab[data-tab]').forEach(btn => {
    const key = navMap[btn.dataset.tab];
    if (key) btn.textContent = t(key);
  });

  /* Botón configuración */
  const cfgBtn = document.querySelector('.btn-nav-config');
  if (cfgBtn) cfgBtn.textContent = t('nav_config');

  /* Botón transformar */
  const btnTr = document.querySelector('.btn-transform');
  if (btnTr) btnTr.textContent = t('btn_transform');

  /* Botón traducir */
  const btnTl = document.querySelector('.btn-translate');
  if (btnTl) btnTl.textContent = t('btn_translate');

  /* Lang label */
  const langLbl = document.querySelector('.lang-label');
  if (langLbl) langLbl.textContent = t('lang_output');

  /* Outputs label */
  const outLbl = document.querySelector('.outputs-label');
  if (outLbl) outLbl.textContent = t('outputs_label');

  /* Badges */
  const bdMap = { 'out-dipl': 'badge_dipl', 'out-ejec': 'badge_ejec', 'out-casu': 'badge_casu' };
  document.querySelectorAll('.tone-badge').forEach(el => {
    const card = el.closest('.output-card');
    if (!card) return;
    if (card.classList.contains('card-dipl')) el.textContent = t('badge_dipl');
    else if (card.classList.contains('card-ejec')) el.textContent = t('badge_ejec');
    else if (card.classList.contains('card-casu')) el.textContent = t('badge_casu');
  });

  /* Placeholders outputs */
  ['dipl','ejec','casu'].forEach(k => {
    const el = document.getElementById('out-'+k);
    if (el) {
      const ph = el.querySelector('.output-placeholder');
      if (ph) ph.textContent = t('placeholder_'+k);
    }
  });

  /* Textarea */
  const ta = document.getElementById('msg-input');
  if (ta) ta.placeholder = t('textarea_ph');

  /* Sub title */
  const sub = document.querySelector('.moodify-sub');
  if (sub) sub.innerHTML = `<span class="moodify-sub-accent">▸</span> ${t('sub_title').replace('▸ ','').replace('▸ ','')}`;

  /* Detector */
  const det = document.getElementById('detector-box');
  if (det) {
    const neutral = det.querySelector('.det-neutral');
    if (neutral) neutral.textContent = t('detecting');
  }

  /* Clippy header */
  const clippyH = document.querySelector('.clippy-header');
  if (clippyH) {
    const dot = clippyH.querySelector('.clip-dot');
    clippyH.innerHTML = '';
    if (dot) clippyH.appendChild(dot);
    clippyH.appendChild(document.createTextNode(' ' + t('clippy_header')));
  }

  /* Section titles */
  const secH = document.querySelector('#panel-historial .section-title');
  if (secH) secH.textContent = t('sec_historial');
  const secF = document.querySelector('#panel-favoritos .section-title');
  if (secF) secF.textContent = t('sec_favoritos');
  const secE = document.querySelector('#panel-estadisticas .section-title');
  if (secE) secE.textContent = t('sec_estadisticas');

  /* Config modal texts */
  const cfgTitle = document.querySelector('.cfg-title');
  if (cfgTitle) cfgTitle.textContent = t('cfg_title');

  document.querySelectorAll('.cfg-section-title').forEach((el, i) => {
    const keys = ['cfg_appearance','cfg_account','cfg_session'];
    if (keys[i]) el.textContent = t(keys[i]);
  });

  const cfgRows = document.querySelectorAll('.cfg-row-label');
  const cfgLabelKeys = ['cfg_theme_lbl','cfg_lang_lbl','cfg_username_lbl','cfg_email_lbl','cfg_pass_lbl'];
  cfgRows.forEach((el, i) => { if (cfgLabelKeys[i]) el.textContent = t(cfgLabelKeys[i]); });

  const cfgLangSub = document.getElementById('cfg-lang-sub');
  if (cfgLangSub) cfgLangSub.textContent = t('cfg_lang_sub');

  const cfgLogout = document.querySelector('.cfg-btn-logout');
  if (cfgLogout) cfgLogout.textContent = t('cfg_logout');
  const cfgDelete = document.querySelector('.cfg-btn-danger');
  if (cfgDelete) cfgDelete.textContent = t('cfg_delete');

  document.querySelectorAll('.cfg-btn-inline').forEach(el => {
    el.textContent = t('cfg_change');
  });
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('moodify_agent_lang', lang);
  applyI18n();
  /* Re-render historial/favoritos si están activos */
  const activePanel = document.querySelector('.app-panel.active');
  if (activePanel) {
    const tab = activePanel.id.replace('panel-', '');
    if (tab === 'historial') loadHistorial();
    if (tab === 'favoritos') loadFavoritos();
    if (tab === 'estadisticas') loadEstadisticas();
  }
}

/* ── Estado global ─────────────────────────────────────────── */
let token      = localStorage.getItem('moodify_token')    || '';
let username   = localStorage.getItem('moodify_username') || '';
let textos_es  = {};
let idioma     = 'es';
let loadTimer  = null;
let loadRunning = false;
let loadProg   = 0;

/* ── Guard: redirige si no hay sesión ──────────────────────── */
if (!token) { window.location.href = '/'; }

/* ── Init ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  /* Restaurar idioma antes de todo */
  const savedLang = localStorage.getItem('moodify_agent_lang');
  if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
    currentLang = savedLang;
    const sel = document.getElementById('cfg-lang-select');
    if (sel) sel.value = savedLang;
  }

  applyI18n();

  if (username) {
    document.getElementById('nav-username').textContent = `@${username}`;
  } else {
    apiGet('/api/perfil').then(data => {
      if (data && data.username) {
        username = data.username;
        localStorage.setItem('moodify_username', username);
        document.getElementById('nav-username').textContent = `@${username}`;
      }
    }).catch(() => {});
  }
  checkStatsTab();
});

function checkStatsTab() {
  apiGet('/api/estadisticas').then(data => {
    const total   = data.total || 0;
    const tabBtn  = document.querySelector('[data-tab="estadisticas"]');
    if (total >= MINIMO_STATS && tabBtn) {
      tabBtn.classList.remove('locked');
      tabBtn.setAttribute('onclick', "switchPanel('estadisticas')");
    }
  }).catch(() => {});
}

/* ── Fetch helpers ──────────────────────────────────────────── */
async function apiPost(endpoint, body) {
  try {
    const res = await fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.status === 401) { doLogout(); return null; }
    return res.json();
  } catch (e) {
    console.error('apiPost error:', e);
    return null;
  }
}

async function apiGet(endpoint) {
  try {
    const res = await fetch(`${API}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.status === 401) { doLogout(); return {}; }
    return res.json();
  } catch (e) {
    console.error('apiGet error:', e);
    return {};
  }
}

/* ── Logout ─────────────────────────────────────────────────── */
function doLogout() {
  localStorage.removeItem('moodify_token');
  localStorage.removeItem('moodify_username');
  window.location.href = '/';
}

/* ── Panel navigation ───────────────────────────────────────── */
function switchPanel(tab) {
  document.querySelectorAll('.app-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab:not(.locked)').forEach(b => b.classList.remove('active'));

  const panel   = document.getElementById(`panel-${tab}`);
  const navTab  = document.querySelector(`[data-tab="${tab}"]`);
  if (panel)  panel.classList.add('active');
  if (navTab) navTab.classList.add('active');

  if (tab === 'historial')    loadHistorial();
  if (tab === 'favoritos')    loadFavoritos();
  if (tab === 'estadisticas') loadEstadisticas();
}

/* ── Overlay de carga ───────────────────────────────────────── */
const PHASES = [
  [0,10,'ANALIZANDO'],[10,18,'DETECTANDO IDIOMA'],[18,22,'VISTA PREVIA'],
  [22,45,'TONO DIPLOMÁTICO'],[45,68,'TONO EJECUTIVO'],[68,88,'TONO CASUAL'],[88,98,'FINALIZANDO']
];
function getPhase(p) {
  for (const [a, b, l] of PHASES) if (p >= a && p < b) return l;
  return 'LISTO ✓';
}
function setProgress(p) {
  loadProg = p;
  const pd = document.getElementById('ov-prog');
  const dd = document.getElementById('ov-dot');
  const ph = document.getElementById('ov-phase');
  const pc = document.getElementById('ov-pct');
  if (pd) pd.style.width  = p + '%';
  if (dd) dd.style.left   = p + '%';
  if (ph) ph.textContent  = getPhase(p);
  if (pc) pc.textContent  = Math.round(p) + '%';
}
function startLoading() {
  if (loadRunning) return;
  loadRunning = true; loadProg = 0;
  document.getElementById('moodify-overlay').classList.add('active');
  setProgress(0); clearInterval(loadTimer);
  loadTimer = setInterval(() => {
    if (loadProg < 88) {
      const step = loadProg < 22 ? 2.5 : loadProg < 68 ? 1.0 : 0.4;
      setProgress(Math.min(88, loadProg + step));
    }
  }, 100);
}
function stopLoading() {
  if (!loadRunning) return;
  clearInterval(loadTimer); setProgress(100);
  setTimeout(() => {
    document.getElementById('moodify-overlay').classList.remove('active');
    loadRunning = false; setProgress(0);
  }, 700);
}

/* ── Detector de idioma (en vivo) ───────────────────────────── */
const ES_RE = /\b(que|de|en|es|una?|por|con|para|como|pero|todo|más|también|cuando|donde|esto|eso|aquí|ahí|hay|muy|bien|ahora|ya|si|no|los|las|del|al|le|les|se|me|te|nos|su|sus|mi|mis|tu|tus|tengo|necesito|solicito|pido|informo|comunico|hola|buenas|gracias|favor|día|días|semana|junta|reunión|equipo|trabajo|empresa|área|proyecto|reporte|porque|aunque|además|entonces|así|siguiente|próximo|wey|güey|bro|papu|cuate|mano|compa|carnal)\b/gi;
const EN_RE = /\b(the|and|for|are|but|not|you|all|can|her|was|one|our|out|day|get|has|him|his|how|its|may|new|now|old|see|two|who|will|with|from|they|this|that|have|been|said|each|she|which|their|there|were|your|what|when|would|about|could|please|thanks|hello|meeting|team|update|feedback|deadline|regarding|attached|kindly|schedule|review|report|project)\b/gi;
const ES_FUERTE = /[áéíóúüñÁÉÍÓÚÜÑ]|¿|¡|\b(estimad[ao]s?|saludos|atentamente)\b/gi;

function detectarIdioma(msg) {
  if (!msg || !msg.trim()) return { idioma:'desconocido', emoji:'🌐', confianza:0 };
  const tw  = Math.max(msg.split(/\s+/).length, 1);
  const es  = (msg.match(ES_RE) || []).length + (msg.match(ES_FUERTE) || []).length * 2;
  const en  = (msg.match(EN_RE) || []).length;
  const ses = es / tw, sen = en / tw;
  if (ses === 0 && sen === 0) return { idioma:'desconocido', emoji:'🌐', confianza:0 };
  if (ses >= sen * 1.5) return { idioma:'Español', emoji:'🇲🇽', confianza: Math.min(100, Math.round(ses/(ses+sen)*100)) };
  if (sen >= ses * 1.5) return { idioma:'Inglés',  emoji:'🇺🇸', confianza: Math.min(100, Math.round(sen/(ses+sen)*100)) };
  return { idioma:'Mixto (Spanglish)', emoji:'🌐', confianza:50 };
}

function onInputChange() {
  const msg  = document.getElementById('msg-input').value;
  const det  = detectarIdioma(msg);
  const box  = document.getElementById('detector-box');
  if (!box) return;
  if (det.idioma === 'desconocido') {
    box.innerHTML = `<div class="det-neutral">${t('detecting')}</div>`;
    return;
  }
  const color = det.idioma === 'Español' ? '#B8F000' : det.idioma === 'Inglés' ? '#3D7ECC' : '#E8800A';
  const prevLbl = det.idioma === 'Español' ? t('preview_en') : t('preview_es');
  box.innerHTML = `
    <div class="det-row">
      <span class="det-label">🌐 ${currentLang === 'en' ? 'Language' : 'Idioma'}</span>
      <span class="det-idioma">${det.emoji} ${det.idioma}</span>
    </div>
    <div class="det-barra-bg"><div class="det-barra-fill" style="width:${det.confianza}%;background:${color};"></div></div>
    <div class="det-conf">${currentLang === 'en' ? 'Confidence' : 'Confianza'}: ${det.confianza}%</div>
    <div class="det-prev-label">${prevLbl}</div>
    <div class="det-placeholder det-conf">${currentLang === 'en' ? 'Will appear after transforming ✦' : 'Aparecerá al transformar ✦'}</div>
  `;
}

/* ── Transformar ────────────────────────────────────────────── */
async function doTransform() {
  const msg = document.getElementById('msg-input').value.trim();
  if (!msg) return;
  startLoading();
  setOutputPlaceholders();
  try {
    const data = await apiPost('/api/transform', { mensaje: msg });
    if (!data) return;
    textos_es = data.textos_es || {};
    renderOutputs(data);
    renderDetector(data);
    renderTips(data.tips || []);
    selectLang('es');
    checkStatsTab();
  } catch (e) {
    console.error('Transform error:', e);
  } finally {
    stopLoading();
  }
}

function setOutputPlaceholders() {
  ['dipl','ejec','casu'].forEach(k => {
    const el = document.getElementById(`out-${k}`);
    if (el) el.innerHTML = `<span class="output-placeholder">${t('generating')}</span>`;
  });
}

function renderOutputs(data) {
  const map = { dipl: data.diplomatico, ejec: data.ejecutivo, casu: data.casual };
  for (const [key, text] of Object.entries(map)) {
    const el = document.getElementById(`out-${key}`);
    if (!el) continue;
    el.innerHTML = `<span>${escHtml(text)}</span><button class="copy-btn" onclick="copyText('out-${key}')">${t('copy_btn')}</button>`;
  }
}

function renderDetector(data) {
  const det = data.detector || {};
  const box = document.getElementById('detector-box');
  if (!box) return;
  if (!det.idioma || det.idioma === 'desconocido') {
    box.innerHTML = `<div class="det-neutral">🌐 ${currentLang === 'en' ? 'Language — unknown' : 'Idioma — desconocido'}</div>`;
    return;
  }
  const color = det.idioma === 'Español' ? '#B8F000' : det.idioma === 'Inglés' ? '#3D7ECC' : '#E8800A';
  const prevLbl = det.idioma === 'Español' ? t('preview_en') : t('preview_es');
  const prevHtml = data.preview
    ? `<div class="det-prev-box">${escHtml(data.preview)}</div>`
    : `<div class="det-placeholder det-conf">${currentLang === 'en' ? 'Not available' : 'No disponible'}</div>`;
  box.innerHTML = `
    <div class="det-row">
      <span class="det-label">🌐 ${currentLang === 'en' ? 'Language' : 'Idioma'}</span>
      <span class="det-idioma">${det.emoji} ${det.idioma}</span>
    </div>
    <div class="det-barra-bg"><div class="det-barra-fill" style="width:${det.confianza}%;background:${color};"></div></div>
    <div class="det-conf">${currentLang === 'en' ? 'Confidence' : 'Confianza'}: ${det.confianza}%</div>
    <div class="det-prev-label">${prevLbl}</div>
    ${prevHtml}
  `;
}

function renderTips(tips) {
  const wrap  = document.getElementById('clippy-wrap');
  const items = document.getElementById('clippy-items');
  if (!wrap || !items) return;
  if (!tips.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  items.innerHTML = tips.map(tip => `
    <div class="clip-item">
      <span class="clip-icon">${tip.icono}</span>
      <div>
        <div class="clip-title">${escHtml(tip.titulo)}</div>
        <div class="clip-text">${escHtml(tip.texto)}</div>
      </div>
    </div>
  `).join('');
}

/* ── Seleccionar idioma de salida ───────────────────────────── */
function selectLang(lang) {
  idioma = lang;
  const btnEs = document.getElementById('btn-es');
  const btnEn = document.getElementById('btn-en');
  if (btnEs) { btnEs.textContent = lang === 'es' ? '✓ ES 🇲🇽' : 'ES 🇲🇽'; btnEs.className = `lang-btn${lang==='es'?' on':''}`; }
  if (btnEn) { btnEn.textContent = lang === 'en' ? '✓ EN 🇺🇸' : 'EN 🇺🇸'; btnEn.className = `lang-btn${lang==='en'?' on':''}`; }
}

/* ── Traducir ───────────────────────────────────────────────── */
async function doTranslate() {
  if (!Object.keys(textos_es).length) return;
  startLoading();
  try {
    const data = await apiPost('/api/translate', { textos_es, idioma });
    if (!data) return;
    const map = { dipl: data.diplomatico, ejec: data.ejecutivo, casu: data.casual };
    for (const [key, text] of Object.entries(map)) {
      const el = document.getElementById(`out-${key}`);
      if (el) el.innerHTML = `<span>${escHtml(text)}</span><button class="copy-btn" onclick="copyText('out-${key}')">${t('copy_btn')}</button>`;
    }
  } catch (e) {
    console.error('Translate error:', e);
  } finally {
    stopLoading();
  }
}

/* ── Copiar al portapapeles ─────────────────────────────────── */
function copyText(elId) {
  const el   = document.getElementById(elId);
  if (!el) return;
  const span = el.querySelector('span');
  const text = span ? span.textContent : '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = el.querySelector('.copy-btn');
    if (btn) {
      const orig = t('copy_btn');
      btn.textContent = t('copied_btn');
      setTimeout(() => btn.textContent = orig, 1500);
    }
  });
}

/* ── Config modal ───────────────────────────────────────────── */
function openConfig() {
  document.getElementById('cfg-overlay').classList.add('open');
  const uname = localStorage.getItem('moodify_username') || username || 'usuario';
  const emailDisplay = document.getElementById('cfg-email-display');
  const unameDisplay = document.getElementById('cfg-username-display');
  if (unameDisplay) unameDisplay.textContent = '@' + uname;
  /* Intentar obtener email del perfil */
  if (emailDisplay && emailDisplay.textContent === '—') {
    apiGet('/api/perfil').then(data => {
      if (data && data.email) emailDisplay.textContent = data.email;
    }).catch(() => {});
  }
}

function closeConfig() {
  document.getElementById('cfg-overlay').classList.remove('open');
}

function closeConfigOutside(e) {
  if (e.target === document.getElementById('cfg-overlay')) closeConfig();
}

function setAgentLang(val) {
  setLang(val);
}

/* ── Cambio de username ─────────────────────────────────────── */
async function startChangeUsername() {
  const newU = prompt(currentLang === 'en' ? 'New username (letters, numbers, underscore):' : 'Nuevo nombre de usuario (letras, números, guion bajo):');
  if (!newU || !newU.trim()) return;
  try {
    const res = await fetch(`${API}/api/perfil/username`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ username: newU.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.detail || (currentLang === 'en' ? 'Error updating username.' : 'Error al actualizar el usuario.'));
      return;
    }
    username = newU.trim();
    localStorage.setItem('moodify_username', username);
    document.getElementById('nav-username').textContent = '@' + username;
    document.getElementById('cfg-username-display').textContent = '@' + username;
    alert(currentLang === 'en' ? '✅ Username updated successfully.' : '✅ Usuario actualizado correctamente.');
  } catch (e) {
    alert(currentLang === 'en' ? 'Connection error. Try again.' : 'Error de conexión. Intenta de nuevo.');
  }
}

/* ── Cambio de email ────────────────────────────────────────── */
async function startChangeEmail() {
  const newEmail = prompt(currentLang === 'en' ? 'New email address:' : 'Nuevo correo electrónico:');
  if (!newEmail || !newEmail.trim()) return;
  try {
    const res = await fetch(`${API}/api/perfil/email`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ email: newEmail.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.detail || (currentLang === 'en' ? 'Error updating email.' : 'Error al actualizar el correo.'));
      return;
    }
    document.getElementById('cfg-email-display').textContent = newEmail.trim();
    alert(currentLang === 'en'
      ? '✅ A verification link was sent to your new email. Confirm it to complete the change.'
      : '✅ Se envió un enlace de verificación a tu nuevo correo. Confírmalo para completar el cambio.');
  } catch (e) {
    alert(currentLang === 'en' ? 'Connection error. Try again.' : 'Error de conexión. Intenta de nuevo.');
  }
}

/* ── Cambio de contraseña ───────────────────────────────────── */
async function startChangePassword() {
  const email = localStorage.getItem('moodify_email') || document.getElementById('cfg-email-display')?.textContent || '';
  const cleanEmail = email.replace('@','') !== '—' ? email : '';
  if (!cleanEmail) {
    /* Pedir email si no está guardado */
    const inputEmail = prompt(currentLang === 'en' ? 'Enter your email to receive a reset link:' : 'Ingresa tu correo para recibir el enlace de restablecimiento:');
    if (!inputEmail || !inputEmail.trim()) return;
    await sendPasswordReset(inputEmail.trim());
    return;
  }
  await sendPasswordReset(cleanEmail);
}

async function sendPasswordReset(email) {
  try {
    const res = await fetch(`${API}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    alert(currentLang === 'en'
      ? '✅ If an account exists with that email, you will receive a reset link.'
      : '✅ Si existe una cuenta con ese correo, recibirás un enlace de restablecimiento.');
  } catch (e) {
    alert(currentLang === 'en' ? 'Connection error. Try again.' : 'Error de conexión. Intenta de nuevo.');
  }
}

/* ── Eliminar cuenta ────────────────────────────────────────── */
async function confirmDeleteAccount() {
  const msg1 = currentLang === 'en'
    ? '⚠️ Are you sure you want to delete your account?\n\nThis will permanently delete all your messages, history, and favorites.'
    : '⚠️ ¿Estás seguro de que deseas eliminar tu cuenta?\n\nEsto eliminará permanentemente todos tus mensajes, historial y favoritos.';
  if (!confirm(msg1)) return;

  const msg2 = currentLang === 'en'
    ? 'This action CANNOT be undone. Type "DELETE" to confirm:'
    : 'Esta acción NO se puede deshacer. Escribe "ELIMINAR" para confirmar:';
  const confirmWord = currentLang === 'en' ? 'DELETE' : 'ELIMINAR';
  const input = prompt(msg2);
  if (input !== confirmWord) {
    alert(currentLang === 'en' ? 'Action cancelled.' : 'Acción cancelada.');
    return;
  }

  try {
    const res = await fetch(`${API}/api/cuenta`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.detail || (currentLang === 'en' ? 'Error deleting account.' : 'Error al eliminar la cuenta.'));
      return;
    }
    alert(currentLang === 'en' ? '✅ Account deleted.' : '✅ Cuenta eliminada.');
    doLogout();
  } catch (e) {
    alert(currentLang === 'en' ? 'Connection error. Try again.' : 'Error de conexión. Intenta de nuevo.');
  }
}

/* ── Utilidades ─────────────────────────────────────────────── */
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}