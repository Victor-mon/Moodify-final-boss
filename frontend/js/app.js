/* app.js — Lógica principal de Moodify */

const API = "http://localhost:8000";
const MINIMO_STATS = 3;

/* ── SISTEMA DE INTERNACIONALIZACIÓN ─────────────────────────── */
const I18N = {
  es: {
    nav_transform:    'Transformar',
    nav_historial:    'Historial',
    nav_favoritos:    '★ Favoritos',
    nav_estadisticas: 'Estadísticas',
    nav_config:       'Configuración',
    btn_transform:    'Transformar',
    btn_translate:    'Traducir ✦',
    lang_output:      '🌐 Salida en',
    outputs_label:    '— VERSIONES ADAPTADAS',
    badge_dipl:       'Diplomático',
    badge_ejec:       'Ejecutivo',
    badge_casu:       'Casual',
    placeholder_dipl: 'La versión diplomática aparecerá aquí...',
    placeholder_ejec: 'La versión ejecutiva aparecerá aquí...',
    placeholder_casu: 'La versión casual aparecerá aquí...',
    textarea_ph:      'Escribe aquí tu mensaje — con groserías, slang, emojis o como salga...',
    sub_title:        'REESCRITURA INTELIGENTE CON IA',
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
    cfg_theme_dark:   'Modo oscuro',
    cfg_theme_light:  'Modo claro',
    cfg_lang_lbl:     'Idioma del agente',
    cfg_lang_sub:     'ES optimizado para México',
    cfg_account:      'Cuenta',
    cfg_username_lbl: 'Usuario',
    cfg_email_lbl:    'Correo',
    cfg_pass_lbl:     'Contraseña',
    cfg_pass_dots:    '••••••••',
    cfg_change:       'Cambiar',
    cfg_session:      'Sesión',
    cfg_logout:       '↩ Cerrar sesión',
    cfg_delete:       '✕ Eliminar cuenta',
    preview_en:       '🇺🇸 Vista previa en inglés',
    preview_es:       '🇲🇽 Vista previa en español',
    dipl_label:       'Diplomático',
    ejec_label:       'Ejecutivo',
    casu_label:       'Casual',
  },
  en: {
    nav_transform:    'Transform',
    nav_historial:    'History',
    nav_favoritos:    'Favorites',
    nav_estadisticas: 'Statistics',
    nav_config:       'Settings',
    btn_transform:    'Transform',
    btn_translate:    'Translate ✦',
    lang_output:      '🌐 Output in',
    outputs_label:    '— ADAPTED VERSIONS',
    badge_dipl:       'Diplomatic',
    badge_ejec:       'Executive',
    badge_casu:       'Casual',
    placeholder_dipl: 'The diplomatic version will appear here...',
    placeholder_ejec: 'The executive version will appear here...',
    placeholder_casu: 'The casual version will appear here...',
    textarea_ph:      'Write your message here — as it comes out...',
    sub_title:        'INTELLIGENT AI REWRITING',
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
    cfg_theme_dark:   'Dark mode',
    cfg_theme_light:  'Light mode',
    cfg_lang_lbl:     'Agent language',
    cfg_lang_sub:     'ES optimized for Mexico',
    cfg_account:      'Account',
    cfg_username_lbl: 'Username',
    cfg_email_lbl:    'Email',
    cfg_pass_lbl:     'Password',
    cfg_pass_dots:    '••••••••',
    cfg_change:       'Change',
    cfg_session:      'Session',
    cfg_logout:       '↩ Sign out',
    cfg_delete:       '✕ Delete account',
    preview_en:       '🇺🇸 English preview',
    preview_es:       '🇲🇽 Spanish preview',
    dipl_label:       'Diplomatic',
    ejec_label:       'Executive',
    casu_label:       'Casual',
  }
};

let currentLang = sessionStorage.getItem('moodify_agent_lang') || 'es';

function t(key) {
  return (I18N[currentLang] || I18N['es'])[key] || key;
}

function applyI18n() {
  // ── Navegación ──────────────────────────────────────────────
  document.querySelectorAll('.nav-tab[data-tab]').forEach(btn => {
    const keyMap = {
      'transformar':  'nav_transform',
      'historial':    'nav_historial',
      'favoritos':    'nav_favoritos',
      'estadisticas': 'nav_estadisticas',
    };
    const key = keyMap[btn.dataset.tab];
    if (key) btn.textContent = t(key);
  });

  const cfgBtn = document.querySelector('.btn-nav-config');
  if (cfgBtn) cfgBtn.textContent = t('nav_config');

  // ── Panel transformar ───────────────────────────────────────
  const btnTr = document.querySelector('.btn-transform');
  if (btnTr) btnTr.textContent = t('btn_transform');

  const btnTl = document.querySelector('.btn-translate');
  if (btnTl) btnTl.textContent = t('btn_translate');

  const langLbl = document.querySelector('.lang-label');
  if (langLbl) langLbl.textContent = t('lang_output');

  const outLbl = document.querySelector('.outputs-label');
  if (outLbl) outLbl.textContent = t('outputs_label');

  document.querySelectorAll('.output-card').forEach(card => {
    const badge = card.querySelector('.tone-badge');
    if (!badge) return;
    if (card.classList.contains('card-dipl')) badge.textContent = t('badge_dipl');
    else if (card.classList.contains('card-ejec')) badge.textContent = t('badge_ejec');
    else if (card.classList.contains('card-casu')) badge.textContent = t('badge_casu');
  });

  ['dipl','ejec','casu'].forEach(k => {
    const el = document.getElementById('out-' + k);
    if (!el) return;
    const ph = el.querySelector('.output-placeholder');
    if (ph) ph.textContent = t('placeholder_' + k);
  });

  const ta = document.getElementById('msg-input');
  if (ta) ta.placeholder = t('textarea_ph');

  const sub = document.querySelector('.moodify-sub');
  if (sub) sub.innerHTML = `<span class="moodify-sub-accent">▸</span> ${t('sub_title')}`;

  const detBox = document.getElementById('detector-box');
  if (detBox) {
    const neutral = detBox.querySelector('.det-neutral');
    if (neutral) neutral.textContent = t('detecting');
  }

  const clippyH = document.querySelector('.clippy-header');
  if (clippyH) {
    clippyH.innerHTML = `<span class="clip-dot"></span> ${t('clippy_header')}`;
  }

  // ── Secciones historial/favoritos/stats ─────────────────────
  const secH = document.querySelector('#panel-historial .section-title');
  if (secH) secH.textContent = t('sec_historial');
  const secF = document.querySelector('#panel-favoritos .section-title');
  if (secF) secF.textContent = t('sec_favoritos');
  const secE = document.querySelector('#panel-estadisticas .section-title');
  if (secE) secE.textContent = t('sec_estadisticas');

  // ── Modal configuración (nuevo diseño compacto) ─────────────
  // Título del modal
  const cfgTitle = document.querySelector('.cfg-title');
  if (cfgTitle) cfgTitle.textContent = t('cfg_title');

  // Títulos de las dos columnas (.cfg-col → .cfg-section-title)
  const cfgColTitles = document.querySelectorAll('.cfg-col .cfg-section-title');
  if (cfgColTitles[0]) cfgColTitles[0].textContent = t('cfg_appearance');
  if (cfgColTitles[1]) cfgColTitles[1].textContent = t('cfg_account');

  // Labels de cada fila (.cfg-pill-label)
  const pillLabels = document.querySelectorAll('.cfg-pill-label');
  const pillKeys = ['cfg_theme_lbl', 'cfg_lang_lbl', 'cfg_username_lbl', 'cfg_email_lbl', 'cfg_pass_lbl'];
  pillLabels.forEach((el, i) => { if (pillKeys[i]) el.textContent = t(pillKeys[i]); });

  // Subtexto del tema (cambia según el estado actual)
  const cfgThemeSub = document.getElementById('cfg-theme-sub');
  if (cfgThemeSub) {
    const isLight = document.body.classList.contains('theme-light');
    cfgThemeSub.textContent = isLight ? t('cfg_theme_light') : t('cfg_theme_dark');
  }

  // Subtexto del idioma
  const cfgLangSub = document.getElementById('cfg-lang-sub');
  if (cfgLangSub) cfgLangSub.textContent = t('cfg_lang_sub');

  // Botones "Cambiar" de cuenta
  document.querySelectorAll('.cfg-btn-inline').forEach(el => {
    el.textContent = t('cfg_change');
  });

  // Botones del footer
  const cfgLogout = document.querySelector('.cfg-btn-logout');
  if (cfgLogout) cfgLogout.textContent = t('cfg_logout');
  const cfgDelete = document.querySelector('.cfg-btn-danger');
  if (cfgDelete) cfgDelete.textContent = t('cfg_delete');

  // Historial i18n si existe
  if (typeof renderHistorialI18n === 'function') renderHistorialI18n();
}

function setLang(lang) {
  currentLang = lang;
  sessionStorage.setItem('moodify_agent_lang', lang);
  applyI18n();

  const activePanel = document.querySelector('.app-panel.active');
  if (activePanel) {
    const tab = activePanel.id.replace('panel-', '');
    if (tab === 'historial') loadHistorial();
    if (tab === 'favoritos') loadFavoritos();
    if (tab === 'estadisticas') loadEstadisticas();
  }
}

/* ── Estado global ─────────────────────────────────────────── */
let token       = sessionStorage.getItem('moodify_token')    || '';
let username    = sessionStorage.getItem('moodify_username') || '';
let textos_es   = {};
let idioma      = 'es';
let loadRunning = false;

/* ── Guard: redirige si no hay sesión ──────────────────────── */
if (!token) { window.location.href = '/'; }

/* ── Init ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = sessionStorage.getItem('moodify_agent_lang');
  if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
    currentLang = savedLang;
  }
  // Nota: cfg-lang-select eliminado — el idioma se controla con cfg-btn-es / cfg-btn-en

  applyI18n();

  if (username) {
    const navU = document.getElementById('nav-username');
    if (navU) navU.textContent = `@${username}`;
  } else {
    apiGet('/api/perfil').then(data => {
      if (data && data.username) {
        username = data.username;
        sessionStorage.setItem('moodify_username', username);
        const navU = document.getElementById('nav-username');
        if (navU) navU.textContent = `@${username}`;
      }
    }).catch(() => {});
  }

  checkStatsTab();

  const initialTab = document.querySelector('.nav-tab.active');
  if (initialTab) updateNavIndicator(initialTab);
});

function checkStatsTab() {
  apiGet('/api/estadisticas').then(data => {
    const total  = data && data.total ? data.total : 0;
    const tabBtn = document.querySelector('[data-tab="estadisticas"]');
    if (tabBtn) {
      if (total >= MINIMO_STATS) {
        tabBtn.classList.remove('locked');
        tabBtn.onclick = () => switchPanel('estadisticas');
      } else {
        tabBtn.classList.add('locked');
        tabBtn.onclick = null;
      }
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

async function apiDelete(endpoint) {
  try {
    const res = await fetch(`${API}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.status === 401) { doLogout(); return null; }
    return res.json();
  } catch (e) {
    console.error('apiDelete error:', e);
    return null;
  }
}

async function apiPut(endpoint, body) {
  try {
    const res = await fetch(`${API}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.status === 401) { doLogout(); return null; }
    return { ok: res.ok, data: await res.json() };
  } catch (e) {
    console.error('apiPut error:', e);
    return null;
  }
}

/* ── Logout ─────────────────────────────────────────────────── */
function doLogout() {
  sessionStorage.removeItem('moodify_token');
  sessionStorage.removeItem('moodify_username');
  window.location.href = '/';
}

/* ── Panel navigation ───────────────────────────────────────── */
// REEMPLAZAR la función switchPanel en app.js:
function switchPanel(tab) {
  const current = document.querySelector('.app-panel.active');
  const next    = document.getElementById(`panel-${tab}`);
  const navTab  = document.querySelector(`[data-tab="${tab}"]`);

  if (current && current !== next) {
    current.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
    current.style.opacity    = '0';
    current.style.transform  = 'translateY(6px)';
    setTimeout(() => {
      current.classList.remove('active');
      current.style.opacity   = '';
      current.style.transform = '';
      current.style.transition = '';
      if (next) {
        next.classList.add('active');
        next.style.opacity   = '0';
        next.style.transform = 'translateY(-6px)';
        void next.offsetWidth;
        next.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
        next.style.opacity   = '1';
        next.style.transform = 'translateY(0)';
        setTimeout(() => {
          next.style.transition = '';
          next.style.opacity    = '';
          next.style.transform  = '';
        }, 240);
      }
    }, 160);
  } else if (next) {
    next.classList.add('active');
  }

  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  if (navTab && !navTab.classList.contains('locked')) navTab.classList.add('active');

  updateNavIndicator(navTab);

  if (tab === 'historial')    loadHistorial();
  if (tab === 'favoritos')    loadFavoritos();
  if (tab === 'estadisticas') loadEstadisticas();
}

function updateNavIndicator(activeEl) {
  let indicator = document.getElementById('nav-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'nav-indicator';
    document.getElementById('nav-tabs').appendChild(indicator);
  }
  if (!activeEl || activeEl.classList.contains('locked')) {
    indicator.style.opacity = '0';
    return;
  }
  const rect    = activeEl.getBoundingClientRect();
  const tabsRect = document.getElementById('nav-tabs').getBoundingClientRect();
  indicator.style.cssText = `
    position:absolute; bottom:6px; height:2px; border-radius:2px;
    background:#B8F000; pointer-events:none;
    transition: left 0.28s cubic-bezier(.4,0,.2,1), width 0.28s cubic-bezier(.4,0,.2,1), opacity 0.2s;
    left:${rect.left - tabsRect.left}px;
    width:${rect.width}px;
    opacity:1;
  `;
}

/* ══════════════════════════════════════════════════════════════
   OVERLAY DE CARGA — streaming real desde el backend
══════════════════════════════════════════════════════════════ */

const STAGE_LABELS_ES = {
  analizando: 'Analizando mensaje...',
  idioma:     'Detectando idioma...',
  preview:    'Generando vista previa...',
  dipl:       'Tono diplomático...',
  ejec:       'Tono ejecutivo...',
  casu:       'Tono casual...',
  guardando:  'Guardando historial...',
};
const STAGE_LABELS_EN = {
  analizando: 'Analyzing message...',
  idioma:     'Detecting language...',
  preview:    'Generating preview...',
  dipl:       'Diplomatic tone...',
  ejec:       'Executive tone...',
  casu:       'Casual tone...',
  guardando:  'Saving to history...',
};

function getStageLabel(stage, label) {
  const map = currentLang === 'en' ? STAGE_LABELS_EN : STAGE_LABELS_ES;
  return map[stage] || label || stage;
}

function setProgress(p, stage, label) {
  const pd = document.getElementById('ov-prog');
  const dd = document.getElementById('ov-dot');
  const ph = document.getElementById('ov-phase');
  const pc = document.getElementById('ov-pct');
  if (pd) pd.style.width = p + '%';
  if (dd) dd.style.left  = p + '%';
  if (ph) ph.textContent = label || stage || '';
  if (pc) pc.textContent = Math.round(p) + '%';
}

function startLoading() {
  if (loadRunning) return;
  loadRunning = true;
  const ov = document.getElementById('moodify-overlay');
  if (ov) ov.classList.add('active');
  setProgress(0, 'analizando', currentLang === 'en' ? 'Starting...' : 'Iniciando...');
}

function stopLoading() {
  setProgress(100, 'done', currentLang === 'en' ? 'Done ✓' : 'Listo ✓');
  setTimeout(() => {
    const ov = document.getElementById('moodify-overlay');
    if (ov) ov.classList.remove('active');
    loadRunning = false;
    setProgress(0, '', '');
  }, 600);
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

/* ── Transformar — SSE streaming ────────────────────────────── */
async function doTransform() {
  const msg = document.getElementById('msg-input').value.trim();
  if (!msg) return;
  if (loadRunning) return;

  startLoading();
  setOutputPlaceholders();

  try {
    const res = await fetch(`${API}/api/transform`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ mensaje: msg }),
    });

    if (res.status === 401) { doLogout(); return; }
    if (!res.ok) { stopLoading(); return; }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));

          if (data.type === 'progress') {
            const label = getStageLabel(data.stage, data.label);
            setProgress(data.pct, data.stage, label);
          }

          if (data.type === 'done') {
            textos_es = data.textos_es || {};
            renderOutputs(data);
            renderDetector(data);
            renderTips(data.tips || []);
            selectLang('es');
            checkStatsTab();
            stopLoading();
          }

        } catch (e) {
          console.warn('SSE parse error:', e);
        }
      }
    }
  } catch (e) {
    console.error('Transform stream error:', e);
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
    el.innerHTML = `<span>${escHtml(text)}</span>`;
    const header = el.closest('.output-card').querySelector('.output-header');
    const oldBtn = header.querySelector('.copy-btn');
    if (oldBtn) oldBtn.remove();
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = t('copy_btn');
    btn.onclick = () => copyText('out-' + key);
    header.appendChild(btn);
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

/* ══════════════════════════════════════════════════════════════
   CLIPPY — mascota animada
══════════════════════════════════════════════════════════════ */

function renderClippyCharacter() {
  return `
    <svg class="clippy-face" viewBox="0 0 80 52" xmlns="http://www.w3.org/2000/svg">
      <!-- Pantalla rectangular redondeada -->
      <rect x="1" y="1" width="78" height="50" rx="10" ry="10"
        fill="#141414" stroke="#2a2a2a" stroke-width="1.2"/>
      <!-- Brillo sutil superior -->
      <rect x="5" y="3" width="70" height="8" rx="5"
        fill="white" opacity="0.035"/>
 
      <!-- Ojo izquierdo -->
      <ellipse id="eye-l" cx="25" cy="26" rx="9" ry="12"
        fill="#00e84a"/>
      <ellipse cx="22" cy="21" rx="2.5" ry="3.2"
        fill="white" opacity="0.3"/>
 
      <!-- Ojo derecho -->
      <ellipse id="eye-r" cx="55" cy="26" rx="9" ry="12"
        fill="#00e84a"/>
      <ellipse cx="52" cy="21" rx="2.5" ry="3.2"
        fill="white" opacity="0.3"/>
 
      <!-- Glow verde suave detrás de los ojos -->
      <ellipse cx="25" cy="26" rx="11" ry="14"
        fill="#00e84a" opacity="0.12"/>
      <ellipse cx="55" cy="26" rx="11" ry="14"
        fill="#00e84a" opacity="0.12"/>
    </svg>
  `;
}
 
// ── Parpadeo de ojos via atributo SVG ────────────────────────
// (sobrescribe el intento CSS ya que ry como propiedad CSS
//  no funciona en todos los navegadores)
let _eyeBlinkState = false;
 
function _doEyeBlink() {
  const eyeL = document.getElementById('eye-l');
  const eyeR = document.getElementById('eye-r');
  if (!eyeL || !eyeR) return;
 
  // Cerrar
  eyeL.setAttribute('ry', '1.5');
  eyeR.setAttribute('ry', '1.5');
 
  // Abrir después de 90ms
  setTimeout(() => {
    if (eyeL) eyeL.setAttribute('ry', '12');
    if (eyeR) eyeR.setAttribute('ry', '12');
  }, 90);
}
 
let clippyBlinkTimer = null;
function startClippyBlink() {
  if (clippyBlinkTimer) clearInterval(clippyBlinkTimer);
  clippyBlinkTimer = setInterval(() => {
    _doEyeBlink();
  }, 2800 + Math.random() * 2200);
}
 
// ── renderTips: un solo mensaje corto y natural ───────────────
function renderTips(tips) {
  const wrap  = document.getElementById('clippy-wrap');
  const items = document.getElementById('clippy-items');
  const face  = document.getElementById('clippy-face-container');
  if (!wrap || !items) return;
 
  if (!tips || !tips.length) {
    wrap.classList.remove('clippy-visible');
    setTimeout(() => { wrap.style.display = 'none'; }, 400);
    return;
  }
 
  // Renderizar el personaje
  if (face) {
    face.innerHTML = renderClippyCharacter();
  }
 
  // Usar solo el texto del primer tip como mensaje único
  const tip = tips[0];
  const mensaje = tip.texto || tip.titulo || '';
 
  items.innerHTML = `
    <div class="clip-single-msg" style="animation: clip-item-in 0.3s ease both;">
      ${escHtml(mensaje)}
    </div>
  `;
 
  wrap.style.display = 'flex';
  requestAnimationFrame(() => {
    wrap.classList.add('clippy-visible');
  });
 
  startClippyBlink();
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
    if (!el) continue;
    el.innerHTML = `<span>${escHtml(text)}</span>`;
    const header = el.closest('.output-card').querySelector('.output-header');
    const oldBtn = header.querySelector('.copy-btn');
    if (oldBtn) oldBtn.remove();
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = t('copy_btn');
    btn.onclick = () => copyText('out-' + key);
    header.appendChild(btn);
  }


  } catch (e) {
    console.error('Translate error:', e);
  } finally {
    stopLoading();
  }
}

/* ── Copiar al portapapeles ─────────────────────────────────── */
function copyText(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  const span = el.querySelector('span');
  const text = span ? span.textContent : '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = el.closest('.output-card').querySelector('.copy-btn');
    if (btn) {
      const orig = t('copy_btn');
      btn.textContent = t('copied_btn');
      setTimeout(() => btn.textContent = orig, 1500);
    }
  });
}

/* ── Config modal ───────────────────────────────────────────── */
function openConfig() {
  const overlay = document.getElementById('cfg-overlay');
  if (overlay) overlay.classList.add('open');

  const uname = sessionStorage.getItem('moodify_username') || username || 'usuario';
  const unameDisplay = document.getElementById('cfg-username-display');
  if (unameDisplay) unameDisplay.textContent = '@' + uname;

  const emailDisplay = document.getElementById('cfg-email-display');
  if (emailDisplay && emailDisplay.textContent === '—') {
    apiGet('/api/perfil').then(data => {
      if (data && data.email) emailDisplay.textContent = data.email;
    }).catch(() => {});
  }

  // Marcar botón de idioma activo en el modal
  ['es','en'].forEach(l => {
    const btn = document.getElementById('cfg-btn-' + l);
    if (btn) btn.classList.toggle('active', l === currentLang);
  });

  applyI18n();
}

function closeConfig() {
  const overlay = document.getElementById('cfg-overlay');
  if (overlay) overlay.classList.remove('open');
}

function closeConfigOutside(e) {
  if (e.target === document.getElementById('cfg-overlay')) closeConfig();
}

function setAgentLang(val) {
  setLang(val);
  // Actualizar estado visual de los botones del modal
  ['es','en'].forEach(l => {
    const btn = document.getElementById('cfg-btn-' + l);
    if (btn) btn.classList.toggle('active', l === val);
  });
}

/* ── Cambio de username ─────────────────────────────────────── */
async function startChangeUsername() {
  const prompt1 = currentLang === 'en'
    ? 'New username (letters, numbers, underscore, min 3 chars):'
    : 'Nuevo nombre de usuario (letras, números, guion bajo, mín 3 caracteres):';
  const newU = prompt(prompt1);
  if (!newU || !newU.trim()) return;

  try {
    const result = await apiPut('/api/perfil/username', { username: newU.trim() });
    if (!result) {
      alert(currentLang === 'en' ? '❌ Connection error. Try again.' : '❌ Error de conexión. Intenta de nuevo.');
      return;
    }
    if (!result.ok) {
      alert(result.data?.detail || (currentLang === 'en' ? '❌ Error updating username.' : '❌ Error al actualizar el nombre de usuario.'));
      return;
    }
    username = newU.trim();
    sessionStorage.setItem('moodify_username', username);
    const navU = document.getElementById('nav-username');
    if (navU) navU.textContent = '@' + username;
    const cfgU = document.getElementById('cfg-username-display');
    if (cfgU) cfgU.textContent = '@' + username;
    alert(currentLang === 'en' ? '✅ Username updated successfully.' : '✅ Nombre de usuario actualizado correctamente.');
  } catch (e) {
    alert(currentLang === 'en' ? '❌ Connection error.' : '❌ Error de conexión.');
  }
}

/* ── Cambio de email ────────────────────────────────────────── */
async function startChangeEmail() {
  const prompt1 = currentLang === 'en' ? 'New email address:' : 'Nuevo correo electrónico:';
  const newEmail = prompt(prompt1);
  if (!newEmail || !newEmail.trim()) return;

  try {
    const result = await apiPut('/api/perfil/email', { email: newEmail.trim() });
    if (!result) {
      alert(currentLang === 'en' ? '❌ Connection error.' : '❌ Error de conexión.');
      return;
    }
    if (!result.ok) {
      alert(result.data?.detail || (currentLang === 'en' ? '❌ Error updating email.' : '❌ Error al actualizar el correo.'));
      return;
    }
    const emailDisplay = document.getElementById('cfg-email-display');
    if (emailDisplay) emailDisplay.textContent = newEmail.trim();
    alert(currentLang === 'en'
      ? '✅ A verification link was sent to your new email. Confirm it to complete the change.'
      : '✅ Se envió un enlace de verificación a tu nuevo correo. Confírmalo para completar el cambio.');
  } catch (e) {
    alert(currentLang === 'en' ? '❌ Connection error.' : '❌ Error de conexión.');
  }
}

/* ── Cambio de contraseña ───────────────────────────────────── */
async function startChangePassword() {
  const oldPass = prompt(currentLang === 'en'
    ? 'Current password:'
    : 'Contraseña actual:');
  if (!oldPass) return;

  const newPass = prompt(currentLang === 'en'
    ? 'New password (min 6 characters):'
    : 'Nueva contraseña (mínimo 6 caracteres):');
  if (!newPass || newPass.trim().length < 6) {
    alert(currentLang === 'en'
      ? '❌ Password must be at least 6 characters.'
      : '❌ La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  try {
    const result = await apiPut('/api/perfil/password', {
      old_password: oldPass,
      new_password: newPass.trim(),
    });
    if (!result) {
      alert(currentLang === 'en' ? '❌ Connection error.' : '❌ Error de conexión.');
      return;
    }
    if (!result.ok) {
      alert(result.data?.detail || (currentLang === 'en'
        ? '❌ Error updating password.'
        : '❌ Error al actualizar la contraseña.'));
      return;
    }
    alert(currentLang === 'en'
      ? '✅ Password updated successfully.'
      : '✅ Contraseña actualizada correctamente.');
  } catch (e) {
    alert(currentLang === 'en' ? '❌ Connection error.' : '❌ Error de conexión.');
  }
}

/* ── Eliminar cuenta ────────────────────────────────────────── */
async function confirmDeleteAccount() {
  const msg1 = currentLang === 'en'
    ? '⚠️ Are you sure you want to delete your account?\n\nThis will permanently delete ALL your messages, history, and favorites. This action cannot be undone.'
    : '⚠️ ¿Estás seguro de que deseas eliminar tu cuenta?\n\nEsto eliminará permanentemente TODOS tus mensajes, historial y favoritos. Esta acción no se puede deshacer.';

  if (!confirm(msg1)) return;

  const confirmWord = currentLang === 'en' ? 'DELETE' : 'ELIMINAR';
  const msg2 = currentLang === 'en'
    ? `Type "${confirmWord}" to confirm permanent deletion:`
    : `Escribe "${confirmWord}" para confirmar la eliminación permanente:`;

  const input = prompt(msg2);
  if (input !== confirmWord) {
    alert(currentLang === 'en' ? 'Action cancelled.' : 'Acción cancelada.');
    return;
  }

  try {
    const result = await apiDelete('/api/cuenta');
    if (result && result.ok === false) {
      alert(result.detail || (currentLang === 'en' ? '❌ Error deleting account.' : '❌ Error al eliminar la cuenta.'));
      return;
    }
    alert(currentLang === 'en' ? '✅ Account deleted successfully.' : '✅ Cuenta eliminada correctamente.');
    doLogout();
  } catch (e) {
    alert(currentLang === 'en' ? '❌ Connection error. Try again.' : '❌ Error de conexión. Intenta de nuevo.');
  }
}

/* ── Utilidades ─────────────────────────────────────────────── */
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}