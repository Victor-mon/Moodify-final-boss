/* historial.js — Historial, favoritos y estadísticas */

const MINIMO_STATS_H = 3;

// ── Badges y helpers ──────────────────────────────────────────
const BADGE_CLASSES = {
  solicitud:'hist-badge-solicitud', reporte:'hist-badge-reporte',
  comunicado:'hist-badge-comunicado', queja:'hist-badge-queja',
  aviso:'hist-badge-aviso', pregunta:'hist-badge-pregunta',
};
const TONO_EMOJI = { frustracion:'🔴', urgencia:'⏰', positivo:'✅', neutro:'⚪' };

// Labels bilingues para historial
const HIST_LABELS = {
  es: {
    dipl: '🤝 Diplomático', ejec: '💼 Ejecutivo', casu: '😊 Casual',
    tipos: { solicitud:'solicitud', reporte:'reporte', comunicado:'comunicado', queja:'queja', aviso:'aviso', pregunta:'pregunta', general:'general' },
    empty_hist: 'Aún no has transformado ningún mensaje.',
    empty_fav:  'Aún no tienes favoritos guardados.',
    loading:    'Cargando...',
    err_hist:   'Error al cargar el historial.',
    err_fav:    'Error al cargar favoritos.',
    err_stats:  'Error al cargar estadísticas.',
    stats_coming: 'Estadísticas en camino',
    stats_need:   'Necesitas al menos',
    stats_msgs:   'mensajes transformados',
    stats_left:   'Te faltan',
    stats_more:   'más',
    // Cards principales
    msgs_total:   'Mensajes transformados',
    saved_fav:    'Guardados como favoritos',
    pct_fav:      '% del total',
    emo_dom:      'Emoción dominante',
    tipo_freq:    'Tipo más frecuente',
    // Rachas
    racha_actual: 'Racha actual',
    racha_max:    'Racha máxima',
    dias_consec:  'días seguidos',
    // Actividad
    top_day:      'Día más activo',
    hora_pico:    'Hora pico',
    prom_dia:     'Promedio diario',
    msgs_dia:     'mensajes',
    msgs_hora:    'mensajes',
    // Tendencia
    tendencia_titulo: 'Actividad últimos 7 días',
    semana_tono:      'Tono esta semana',
    semana_tipo:      'Tipo esta semana',
    evolucion:        'Evolución de tono',
    evolucion_mejora: '📈 Mejorando',
    evolucion_declive:'📉 Con más tensión',
    evolucion_estable:'➡️ Estable',
    evolucion_insuf:  '— Pocos datos',
    // Distribuciones
    emo_dist:     'Distribución emocional',
    tipo_dist:    'Tipos de mensaje',
    intens_dist:  'Intensidad emocional',
    // Labels
    emo_labels:   { frustracion:'😤 Frustración', urgencia:'⏰ Urgencia', positivo:'✅ Positivo', neutro:'⚪ Neutro' },
    tipo_labels:  { solicitud:'Solicitud', reporte:'Reporte', comunicado:'Comunicado', queja:'Queja', aviso:'Aviso', pregunta:'Pregunta', general:'General' },
    intens_labels:{ alta:'Alta', media:'Media', baja:'Baja' },
    hora_fmt:     (h) => `${h}:00 – ${h+1}:00 hrs`,
    add_fav:      'Agregar a favoritos',
    rm_fav:       'Quitar de favoritos',
  },
  en: {
    dipl: '🤝 Diplomatic', ejec: '💼 Executive', casu: '😊 Casual',
    tipos: { solicitud:'request', reporte:'report', comunicado:'announcement', queja:'complaint', aviso:'notice', pregunta:'question', general:'general' },
    empty_hist: 'You have not transformed any messages yet.',
    empty_fav:  'You have no saved favorites yet.',
    loading:    'Loading...',
    err_hist:   'Error loading history.',
    err_fav:    'Error loading favorites.',
    err_stats:  'Error loading statistics.',
    stats_coming: 'Statistics on the way',
    stats_need:   'You need at least',
    stats_msgs:   'transformed messages',
    stats_left:   'You need',
    stats_more:   'more',
    msgs_total:   'Transformed messages',
    saved_fav:    'Saved as favorites',
    pct_fav:      '% of total',
    emo_dom:      'Dominant emotion',
    tipo_freq:    'Most frequent type',
    racha_actual: 'Current streak',
    racha_max:    'Longest streak',
    dias_consec:  'consecutive days',
    top_day:      'Most active day',
    hora_pico:    'Peak hour',
    prom_dia:     'Daily average',
    msgs_dia:     'messages',
    msgs_hora:    'messages',
    tendencia_titulo: 'Activity last 7 days',
    semana_tono:      'This week\'s tone',
    semana_tipo:      'This week\'s type',
    evolucion:        'Tone evolution',
    evolucion_mejora: '📈 Improving',
    evolucion_declive:'📉 More tense',
    evolucion_estable:'➡️ Stable',
    evolucion_insuf:  '— Not enough data',
    emo_dist:     'Emotional distribution',
    tipo_dist:    'Message types',
    intens_dist:  'Emotional intensity',
    emo_labels:   { frustracion:'😤 Frustration', urgencia:'⏰ Urgency', positivo:'✅ Positive', neutro:'⚪ Neutral' },
    tipo_labels:  { solicitud:'Request', reporte:'Report', comunicado:'Announcement', queja:'Complaint', aviso:'Notice', pregunta:'Question', general:'General' },
    intens_labels:{ alta:'High', media:'Medium', baja:'Low' },
    hora_fmt:     (h) => `${h}:00 – ${h+1}:00`,
    add_fav:      'Add to favorites',
    rm_fav:       'Remove from favorites',
  }
};

function hl() {
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'es';
  return HIST_LABELS[lang] || HIST_LABELS['es'];
}

function badgeHtml(tipo) {
  const cls = BADGE_CLASSES[tipo] || 'hist-badge-general';
  const label = hl().tipos[tipo] || tipo;
  return `<span class="hist-badge ${cls}">${label}</span>`;
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// ── Render historial / favoritos ──────────────────────────────
function renderItems(items, containerId, soloFavoritos = false) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const L = hl();
  if (!items || !items.length) {
    el.innerHTML = `<div class="empty-state">${soloFavoritos ? L.empty_fav : L.empty_hist}</div>`;
    return;
  }
  el.innerHTML = items.map(it => {
    const esFav  = it.es_favorito || false;
    const id     = it.id || '';
    const fecha  = (it.created_at || '').slice(0, 16).replace('T', ' ');
    const orig   = truncate(it.mensaje_original   || '', 120);
    const dipl   = truncate(it.version_diplomatica || '', 80);
    const ejec   = truncate(it.version_ejecutiva   || '', 80);
    const casu   = truncate(it.version_casual      || '', 80);
    const tipo   = it.tipo_mensaje   || 'general';
    const tono   = it.tono_emocional || 'neutro';
    return `
      <div class="hist-item" id="hist-${id}">
        <div class="hist-meta">
          ${badgeHtml(tipo)}
          <span style="font-size:13px;">${TONO_EMOJI[tono] || '⚪'}</span>
          <span class="hist-time">${fecha}</span>
          <button
            class="hist-fav-btn${esFav ? ' is-fav' : ''}"
            title="${esFav ? L.rm_fav : L.add_fav}"
            onclick="toggleFav('${id}', ${esFav})"
          >${esFav ? '★' : '☆'}</button>
        </div>
        <div class="hist-original">"${escHtml2(orig)}"</div>
        <div class="hist-versions">
          <div class="hist-ver"><div class="hist-ver-label">${L.dipl}</div>${escHtml2(dipl)}</div>
          <div class="hist-ver"><div class="hist-ver-label">${L.ejec}</div>${escHtml2(ejec)}</div>
          <div class="hist-ver"><div class="hist-ver-label">${L.casu}</div>${escHtml2(casu)}</div>
        </div>
      </div>`;
  }).join('');
}

// ── Toggle favorito ───────────────────────────────────────────
async function toggleFav(recordId, estadoActual) {
  try {
    const data = await apiPost(`/api/favorito/${recordId}`, { estado: estadoActual });
    if (!data) return;
    const btn = document.querySelector(`#hist-${recordId} .hist-fav-btn`);
    if (btn) {
      const L = hl();
      const nuevoEstado = data.es_favorito;
      btn.classList.toggle('is-fav', nuevoEstado);
      btn.title       = nuevoEstado ? L.rm_fav : L.add_fav;
      btn.textContent = nuevoEstado ? '★' : '☆';
      btn.setAttribute('onclick', `toggleFav('${recordId}', ${nuevoEstado})`);
    }
  } catch (e) {
    console.error('Toggle fav error:', e);
  }
}

// ── Cargar historial ──────────────────────────────────────────
async function loadHistorial() {
  const el = document.getElementById('historial-content');
  const L  = hl();
  if (el) el.innerHTML = `<div class="empty-state">${L.loading}</div>`;
  try {
    const data = await apiGet('/api/historial');
    renderItems(Array.isArray(data) ? data : [], 'historial-content', false);
  } catch (e) {
    if (el) el.innerHTML = `<div class="empty-state">${L.err_hist}</div>`;
  }
}

// ── Cargar favoritos ──────────────────────────────────────────
async function loadFavoritos() {
  const el = document.getElementById('favoritos-content');
  const L  = hl();
  if (el) el.innerHTML = `<div class="empty-state">${L.loading}</div>`;
  try {
    const data = await apiGet('/api/favoritos');
    renderItems(Array.isArray(data) ? data : [], 'favoritos-content', true);
  } catch (e) {
    if (el) el.innerHTML = `<div class="empty-state">${L.err_fav}</div>`;
  }
}

// ── Cargar estadísticas ───────────────────────────────────────
async function loadEstadisticas() {
  const el = document.getElementById('stats-content');
  const L  = hl();
  if (el) el.innerHTML = `<div class="empty-state">${L.loading}</div>`;
  try {
    const stats = await apiGet('/api/estadisticas');
    if (el) el.innerHTML = renderStats(stats);
  } catch (e) {
    if (el) el.innerHTML = `<div class="empty-state">${L.err_stats}</div>`;
  }
}

// ── Render estadísticas ───────────────────────────────────────
function renderStats(stats) {
  const L     = hl();
  const total = stats.total || 0;

  if (total < MINIMO_STATS_H) {
    const pct = Math.round((total / MINIMO_STATS_H) * 100);
    return `<div class="stats-lock">
      <div class="stats-lock-icon">📊</div>
      <div class="stats-lock-title">${L.stats_coming}</div>
      <div class="stats-lock-sub">${L.stats_need} <strong>${MINIMO_STATS_H} ${L.stats_msgs}</strong>.<br><br>${L.stats_left} <strong>${MINIMO_STATS_H - total}</strong> ${L.stats_more}.</div>
      <div>
        <div class="stats-progress-bar"><div class="stats-progress-fill" style="width:${pct}%"></div></div>
        <div class="stats-progress-label">${total} / ${MINIMO_STATS_H} ${L.stats_msgs}</div>
      </div>
    </div>`;
  }

  const favoritos      = stats.favoritos      || 0;
  const pct_fav        = stats.pct_favoritos  || 0;
  const emociones      = stats.emociones      || {};
  const tipos          = stats.tipos          || {};
  const intensidades   = stats.intensidades   || {};
  const dia_top        = stats.dia_top        || '—';
  const msgs_dia       = stats.msgs_dia_top   || 0;
  const hora_pico      = stats.hora_pico;
  const msgs_hora      = stats.msgs_hora_pico || 0;
  const racha_actual   = stats.racha_actual   || 0;
  const racha_max      = stats.racha_max      || 0;
  const tendencia_7d   = stats.tendencia_7d   || [];
  const tono_semana    = stats.tono_semana    || '—';
  const tipo_semana    = stats.tipo_semana    || '—';
  const prom_dia       = stats.promedio_diario || 0;
  const evolucion      = stats.evolucion_tono || 'insuficiente';

  // Colores
  const COLORES_EMO  = { frustracion:'#FF5555', urgencia:'#D4A000', positivo:'#B8F000', neutro:'#888' };
  const COLORES_TIPO = { solicitud:'#3D7ECC', reporte:'#87C200', comunicado:'#D4820A', queja:'#CC3333', aviso:'#8833CC', pregunta:'#0099BB', general:'#888' };
  const COLORES_INT  = { alta:'#FF5555', media:'#D4A000', baja:'#B8F000' };

  const emoDom  = Object.keys(emociones)[0] || 'neutro';
  const emoPct  = total ? Math.round((emociones[emoDom] || 0) / total * 100) : 0;
  const tipoDom = Object.keys(tipos)[0] || 'general';
  const maxEmo  = Math.max(...Object.values(emociones), 1);
  const maxTipo = Math.max(...Object.values(tipos), 1);
  const maxInt  = Math.max(...Object.values(intensidades), 1);

  // Barras emocionales
  const barrasEmo = Object.entries(emociones).map(([k, v]) => `
    <div class="stat-bar-row">
      <span class="stat-bar-label">${L.emo_labels[k] || k}</span>
      <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${Math.round(v/maxEmo*100)}%;background:${COLORES_EMO[k]||'#888'};"></div></div>
      <span class="stat-bar-val">${v} <span style="color:rgba(255,255,255,0.15);font-size:9px">(${Math.round(v/total*100)}%)</span></span>
    </div>`).join('');

  // Barras de tipos
  const barrasTipo = Object.entries(tipos).map(([k, v]) => `
    <div class="stat-bar-row">
      <span class="stat-bar-label">${L.tipo_labels[k] || k}</span>
      <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${Math.round(v/maxTipo*100)}%;background:${COLORES_TIPO[k]||'#888'};"></div></div>
      <span class="stat-bar-val">${v} <span style="color:rgba(255,255,255,0.15);font-size:9px">(${Math.round(v/total*100)}%)</span></span>
    </div>`).join('');

  // Barras de intensidad
  const barrasInt = Object.entries(intensidades).map(([k, v]) => `
    <div class="stat-bar-row">
      <span class="stat-bar-label">${L.intens_labels[k] || k}</span>
      <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${Math.round(v/maxInt*100)}%;background:${COLORES_INT[k]||'#888'};"></div></div>
      <span class="stat-bar-val">${v} <span style="color:rgba(255,255,255,0.15);font-size:9px">(${Math.round(v/total*100)}%)</span></span>
    </div>`).join('');

  // Mini gráfica de tendencia 7 días
  const maxTend = Math.max(...tendencia_7d.map(d => d.total), 1);
  const tendBars = tendencia_7d.map(d => {
    const pct = Math.round(d.total / maxTend * 100);
    const dayLabel = d.fecha.slice(5); // MM-DD
    return `
      <div class="tend-col">
        <div class="tend-bar-wrap">
          <div class="tend-bar" style="height:${Math.max(pct, d.total > 0 ? 8 : 2)}%;background:${d.total > 0 ? '#B8F000' : 'rgba(255,255,255,0.06)'};"></div>
        </div>
        <div class="tend-label">${dayLabel}</div>
        <div class="tend-count">${d.total || ''}</div>
      </div>`;
  }).join('');

  // Hora pico formateada
  const horaStr = hora_pico !== null && hora_pico !== undefined
    ? L.hora_fmt(hora_pico)
    : '—';

  // Evolución etiqueta
  const evoLabel = {
    mejora:       L.evolucion_mejora,
    declive:      L.evolucion_declive,
    estable:      L.evolucion_estable,
    insuficiente: L.evolucion_insuf,
  }[evolucion] || L.evolucion_insuf;

  const evoColor = {
    mejora:       '#B8F000',
    declive:      '#FF5555',
    estable:      '#888',
    insuficiente: '#555',
  }[evolucion] || '#555';

  return `
  <div class="stats-grid">

    <!-- Fila 1: números principales -->
    <div class="stat-card">
      <div class="stat-num">${total}</div>
      <div class="stat-label">${L.msgs_total}</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${favoritos} <span style="font-size:1rem;color:rgba(255,255,255,0.3)">(${pct_fav}%)</span></div>
      <div class="stat-label">${L.saved_fav}</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="font-size:1.25rem">${L.emo_labels[emoDom]||emoDom}</div>
      <div class="stat-label">${L.emo_dom} · ${emoPct}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="font-size:1.25rem">${L.tipo_labels[tipoDom]||tipoDom}</div>
      <div class="stat-label">${L.tipo_freq}</div>
    </div>

    <!-- Fila 2: actividad y rachas -->
    <div class="stat-card">
      <div class="stat-num">${racha_actual}</div>
      <div class="stat-label">${L.racha_actual} · ${L.dias_consec}</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${racha_max}</div>
      <div class="stat-label">${L.racha_max} · ${L.dias_consec}</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="font-size:1.1rem">${prom_dia}</div>
      <div class="stat-label">${L.prom_dia}</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="font-size:0.85rem">${horaStr}</div>
      <div class="stat-label">${L.hora_pico} · ${msgs_hora} ${L.msgs_hora}</div>
    </div>

    <!-- Tendencia 7 días -->
    <div class="stat-card stat-card-wide">
      <div class="stat-section-title">${L.tendencia_titulo}</div>
      <div class="tend-chart">${tendBars}</div>
      <div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap;">
        <div>
          <span class="stat-bar-label">${L.semana_tono}</span>
          <span style="margin-left:8px;font-size:12px;color:#fff">${L.emo_labels[tono_semana]||tono_semana}</span>
        </div>
        <div>
          <span class="stat-bar-label">${L.semana_tipo}</span>
          <span style="margin-left:8px;font-size:12px;color:#fff">${L.tipo_labels[tipo_semana]||tipo_semana}</span>
        </div>
        <div>
          <span class="stat-bar-label">${L.evolucion}</span>
          <span style="margin-left:8px;font-size:12px;color:${evoColor}">${evoLabel}</span>
        </div>
      </div>
    </div>

    <!-- Distribución emocional -->
    <div class="stat-card stat-card-wide">
      <div class="stat-section-title">${L.emo_dist}</div>
      ${barrasEmo}
    </div>

    <!-- Tipos de mensaje -->
    <div class="stat-card stat-card-wide">
      <div class="stat-section-title">${L.tipo_dist}</div>
      ${barrasTipo}
    </div>

    <!-- Intensidad emocional -->
    <div class="stat-card stat-card-wide">
      <div class="stat-section-title">${L.intens_dist}</div>
      ${barrasInt}
    </div>

    <!-- Día más activo -->
    <div class="stat-card stat-card-wide">
      <div class="stat-num" style="font-size:1.1rem">${dia_top}</div>
      <div class="stat-label">${L.top_day} · ${msgs_dia} ${L.msgs_dia}</div>
    </div>

  </div>`;
}

// ── Escape helper local ────────────────────────────────────────
function escHtml2(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}