'use strict';

const DATA_URL = 'dashboard_data.json';
const REFRESH_MS = 600000;
const SLIDE_MS = 15000;
const SLIDES = 4;

let data = null;
let slide = 0;
let timer = null;

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  loadData();
  setInterval(loadData, REFRESH_MS);
  startCarousel();
  $$('.dot').forEach((d) => {
    d.addEventListener('click', () => { goTo(+d.dataset.slide); restart(); });
  });
});

function startClock() { tick(); setInterval(tick, 1000); }

function tick() {
  const n = new Date();
  $('#liveClock').textContent =
    String(n.getHours()).padStart(2,'0') + ':' +
    String(n.getMinutes()).padStart(2,'0') + ':' +
    String(n.getSeconds()).padStart(2,'0');
}

function startCarousel() { goTo(0); schedule(); }

function schedule() {
  clearTimeout(timer);
  resetProgress();
  timer = setTimeout(() => { goTo((slide + 1) % SLIDES); schedule(); }, SLIDE_MS);
}

function restart() { clearTimeout(timer); schedule(); }

function goTo(i) {
  slide = i;
  $$('.slide').forEach((s, idx) => s.classList.toggle('active', idx === i));
  $$('.dot').forEach((d, idx) => d.classList.toggle('active', idx === i));
}

function resetProgress() {
  const b = $('#progressBar');
  b.style.animation = 'none';
  void b.offsetHeight;
  b.style.animation = 'progressAnim ' + (SLIDE_MS / 1000) + 's linear';
}

async function loadData() {
  try {
    const r = await fetch(DATA_URL + '?t=' + Date.now());
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    const isRefresh = data !== null;
    data = d;
    render(d);
    $('#errorBanner').hidden = true;
    if (isRefresh) flashStatus();
  } catch (e) {
    console.error(e);
    if (!data) {
      $('#errorMessage').textContent = 'Erro ao carregar dashboard_data.json';
      $('#errorBanner').hidden = false;
    }
  }
}

function flashStatus() {
  const el = $('#refreshIndicator');
  el.hidden = false;
  el.style.animation = 'none';
  void el.offsetHeight;
  el.style.animation = 'statusFade 3s ease forwards';
  setTimeout(() => { el.hidden = true; }, 3200);
}

function render(d) {
  renderUpdate(d.gerado_em);
  renderKPIs(d.visao_geral);
  renderRanking(d.ranking_atendentes);
  if (d.arena_gamificacao) renderArena(d.arena_gamificacao);
  renderFeed('bestServicesList', d.melhores_atendimentos_recentes);
  renderFeed('praiseList', d.elogios_recentes);
  renderGrowth(d.pontos_de_crescimento_gerais);
}

function renderUpdate(iso) {
  const d = new Date(iso);
  const f = d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  $('#lastUpdate').textContent = 'Atualizado: ' + f;
}

function renderKPIs(v) {
  const items = [
    { label:'Conversas Hoje', value:v.total_conversas_hoje.toLocaleString('pt-BR'), mod:'', icon:msgIcon() },
    { label:'TMA Medio', value:v.tma_medio_minutos+'<span style="font-size:0.5em;opacity:0.6"> min</span>', mod:'kpi--gold', icon:clockIcon() },
    { label:'FRT Medio', value:v.frt_medio_minutos+'<span style="font-size:0.5em;opacity:0.6"> min</span>', mod:'', icon:hourglassIcon() },
    { label:'Score Geral', value:v.score_medio_geral, mod:'kpi--green', icon:trendIcon(), badge:scoreBadge(v.score_medio_geral) },
  ];
  $('#overviewCards').innerHTML = items.map((c) => `
    <div class="kpi ${c.mod}">
      <div class="kpi__icon">${c.icon}</div>
      <div>
        <div class="kpi__label">${c.label}</div>
        <div class="kpi__value">${c.value}${c.badge||''}</div>
      </div>
    </div>`).join('');
}

function renderRanking(agents) {
  const sorted = [...agents].sort((a,b) => b.score - a.score);
  $('#rankingList').innerHTML = sorted.map((a,i) => {
    const pos = i + 1;
    return `
    <div class="rank-row">
      <div class="rank-row__pos">${pos<=3 ? '<span class="rank-medal rank-medal--'+pos+'">'+pos+'</span>' : pos}</div>
      <div class="rank-row__name">${esc(a.nome)}</div>
      <div class="rank-row__stat"><span class="rank-row__stat-label">Score</span><span class="score-pill ${scorePillClass(a.score)}">${a.score}</span></div>
      <div class="rank-row__stat"><span class="rank-row__stat-label">TMA</span>${a.tma_minutos} min</div>
      <div class="rank-row__stat"><span class="rank-row__stat-label">Tickets</span>${a.tickets_atendidos}</div>
    </div>`;
  }).join('');
}

/* ════════════════════════════════════
   ARENA DE GAMIFICAÇÃO
   ════════════════════════════════════ */
function renderArena(arena) {
  renderKing(arena.rei_da_colina);
  renderFire(arena.maior_ofensiva_invicta);
  renderRadar(arena.radar_de_ultrapassagem);
  renderMedals(arena.medalhas_do_dia);
}

function renderKing(king) {
  if (!king) return;
  $('#kingCard').innerHTML = `
    <div class="king__crown">👑</div>
    <div class="king__info">
      <div class="king__label">Rei da Colina</div>
      <div class="king__name">${esc(king.nome)}</div>
      <div class="king__status">${esc(king.status)}</div>
    </div>
    <div class="king__score-box">
      <div class="king__score">${king.score}</div>
      <div class="king__score-label">Score</div>
    </div>`;
}

function renderFire(fire) {
  if (!fire) return;
  $('#fireCard').innerHTML = `
    <div class="fire__emoji">🔥</div>
    <div class="fire__info">
      <div class="fire__label">Maior Ofensiva Invicta</div>
      <div class="fire__name">${esc(fire.atendente)}</div>
    </div>
    <div>
      <div class="fire__streak">${fire.tickets_perfeitos_seguidos}</div>
      <div class="fire__streak-label">Tickets Perfeitos</div>
    </div>`;
}

function renderRadar(radar) {
  if (!radar) return;
  const text = esc(radar).replace(/([A-Z][a-záéíóúãõç]+ [A-Z][a-záéíóúãõç]+)/g, '<strong>$1</strong>');
  $('#radarCard').innerHTML = `
    <div class="radar__emoji">👀</div>
    <div class="radar__text">${text}</div>`;
}

function renderMedals(medals) {
  if (!medals || !medals.length) return;
  $('#medalsRow').innerHTML = medals.map((m) => `
    <div class="medal-card">
      <div class="medal__top">
        <div class="medal__emoji">${m.icone}</div>
        <div class="medal__title-group">
          <div class="medal__title">${esc(m.titulo)}</div>
          <div class="medal__winner">${esc(m.ganhador)}</div>
        </div>
      </div>
      <div class="medal__reason">${esc(m.motivo)}</div>
    </div>`).join('');
}

function renderFeed(containerId, items) {
  const el = document.getElementById(containerId);
  if (!items || !items.length) { el.innerHTML = '<div class="feed-item">Nenhum registro.</div>'; return; }
  el.innerHTML = items.map((t) => '<div class="feed-item">'+esc(t)+'</div>').join('');
}

function renderGrowth(points) {
  const el = $('#growthList');
  if (!points || !points.length) { el.innerHTML = '<div class="growth-row">Nenhum ponto.</div>'; return; }
  el.innerHTML = points.map((p,i) => `
    <div class="growth-row">
      <div class="growth-row__num">${i+1}</div>
      <div>${esc(p)}</div>
    </div>`).join('');
}

function scoreBadge(s) {
  const c = s>=70?'green':s>=40?'yellow':'red';
  return '<span class="kpi__badge kpi__badge--'+c+'">'+s+'</span>';
}
function scorePillClass(s) { return s>=70?'score-pill--green':s>=40?'score-pill--yellow':'score-pill--red'; }

function msgIcon() { return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>'; }
function clockIcon() { return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'; }
function hourglassIcon() { return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>'; }
function trendIcon() { return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>'; }

function esc(s) { if(!s) return ''; const d=document.createElement('div'); d.textContent=String(s); return d.innerHTML; }
