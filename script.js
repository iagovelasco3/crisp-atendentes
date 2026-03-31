'use strict';

const DATA_URL = 'dashboard_data.json';
const REFRESH_INTERVAL_MS = 300000;
const SLIDE_DURATION_MS = 15000;
const TOTAL_SLIDES = 3;

let currentData = null;
let currentSlide = 0;
let slideTimer = null;
let progressAnimation = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  loadData();
  setInterval(loadData, REFRESH_INTERVAL_MS);
  startCarousel();

  $$('.slide-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      goToSlide(parseInt(dot.dataset.slide, 10));
      restartCarousel();
    });
  });
});

/* =========================================
   Live Clock
   ========================================= */

function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  $('#liveClock').textContent = h + ':' + m + ':' + s;
}

/* =========================================
   Carousel
   ========================================= */

function startCarousel() {
  goToSlide(0);
  scheduleNext();
}

function scheduleNext() {
  clearTimeout(slideTimer);
  resetProgress();

  slideTimer = setTimeout(() => {
    const next = (currentSlide + 1) % TOTAL_SLIDES;
    goToSlide(next);
    scheduleNext();
  }, SLIDE_DURATION_MS);
}

function restartCarousel() {
  clearTimeout(slideTimer);
  scheduleNext();
}

function goToSlide(index) {
  currentSlide = index;

  $$('.slide').forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });

  $$('.slide-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
    dot.setAttribute('aria-current', i === index ? 'true' : 'false');
  });
}

function resetProgress() {
  const bar = $('#progressBar');
  bar.style.animation = 'none';
  void bar.offsetHeight;
  bar.style.animation = 'progress ' + (SLIDE_DURATION_MS / 1000) + 's linear';
}

/* =========================================
   Data Loading
   ========================================= */

async function loadData() {
  try {
    const res = await fetch(DATA_URL + '?t=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();
    const isRefresh = currentData !== null;
    currentData = data;

    renderDashboard(data);
    hideError();

    if (isRefresh) showRefreshIndicator();
  } catch (err) {
    console.error('Failed to load data:', err);
    if (!currentData) {
      showError('Nao foi possivel carregar os dados. Verifique se o arquivo dashboard_data.json esta acessivel.');
    }
  }
}

function showError(msg) {
  $('#errorMessage').textContent = msg;
  $('#errorBanner').hidden = false;
}

function hideError() {
  $('#errorBanner').hidden = true;
}

function showRefreshIndicator() {
  const el = $('#refreshIndicator');
  el.hidden = false;
  el.style.animation = 'none';
  void el.offsetHeight;
  el.style.animation = 'fadeInOut 3s ease forwards';
  setTimeout(() => { el.hidden = true; }, 3200);
}

/* =========================================
   Render
   ========================================= */

function renderDashboard(data) {
  renderLastUpdate(data.gerado_em);
  renderOverviewCards(data.visao_geral);
  renderRankingTable(data.ranking_atendentes);
  renderBestServices(data.melhores_atendimentos_recentes);
  renderPraises(data.elogios_recentes);
  renderGrowthPoints(data.pontos_de_crescimento_gerais);
}

function renderLastUpdate(isoDate) {
  const date = new Date(isoDate);
  const formatted = date.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  $('#lastUpdate').textContent = 'Ultima atualizacao: ' + formatted;
}

/* =========================================
   Overview Cards
   ========================================= */

function renderOverviewCards(visao) {
  const cards = [
    {
      label: 'Total Conversas Hoje',
      value: visao.total_conversas_hoje.toLocaleString('pt-BR'),
      iconClass: 'overview-card__icon--blue',
      cardMod: '',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
    },
    {
      label: 'TMA Medio',
      value: visao.tma_medio_minutos + ' min',
      iconClass: 'overview-card__icon--amber',
      cardMod: 'overview-card--amber',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    },
    {
      label: 'FRT Medio',
      value: visao.frt_medio_minutos + ' min',
      iconClass: 'overview-card__icon--blue',
      cardMod: '',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>',
    },
    {
      label: 'Score Medio Geral',
      value: visao.score_medio_geral,
      iconClass: 'overview-card__icon--green',
      cardMod: 'overview-card--green',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
      badge: getScoreBadge(visao.score_medio_geral),
    },
  ];

  $('#overviewCards').innerHTML = cards.map((c) => `
    <div class="overview-card ${c.cardMod}">
      <div class="overview-card__icon ${c.iconClass}">${c.icon}</div>
      <div>
        <div class="overview-card__label">${c.label}</div>
        <div class="overview-card__value">${c.value}${c.badge ? ' ' + c.badge : ''}</div>
      </div>
    </div>`).join('');
}

/* =========================================
   Ranking Table
   ========================================= */

function renderRankingTable(atendentes) {
  const sorted = [...atendentes].sort((a, b) => b.score_geral - a.score_geral);

  $('#rankingBody').innerHTML = sorted.map((a, i) => {
    const pos = i + 1;
    const isRisk = a.status_risco;
    const sentClass = a.sentimento_negativo_percent >= 25 ? 'td-sentiment--high' : '';

    return `
    <tr class="${isRisk ? 'tr--risk' : ''}">
      <td class="td-pos">${getMedalHtml(pos)}</td>
      <td class="td-name">
        ${esc(a.nome)}
        ${a.observacoes ? '<span class="td-name__obs">' + esc(a.observacoes) + '</span>' : ''}
      </td>
      <td class="td-number">${getScoreBadge(a.score_geral)}</td>
      <td class="td-number">${a.tma_minutos}</td>
      <td class="td-number">${a.frt_minutos}</td>
      <td class="td-number">${a.tickets_atendidos}</td>
      <td class="td-sentiment ${sentClass}">${a.sentimento_negativo_percent}%</td>
      <td class="td-number">${a.elogios_recebidos}</td>
      <td>${getStatusBadge(isRisk)}</td>
    </tr>`;
  }).join('');
}

/* =========================================
   Highlights
   ========================================= */

function renderBestServices(items) {
  const list = $('#bestServicesList');
  if (!items || !items.length) {
    list.innerHTML = '<li class="highlight-item highlight-item--star"><span class="highlight-item__text">Nenhum destaque recente.</span></li>';
    return;
  }
  list.innerHTML = items.map((item) => `
    <li class="highlight-item highlight-item--star">
      <span class="highlight-item__agent">${esc(item.agente)}</span>
      <span class="highlight-item__text">${esc(item.resumo)}</span>
      <span class="highlight-item__date">${fmtDate(item.data)}</span>
    </li>`).join('');
}

function renderPraises(items) {
  const list = $('#praiseList');
  if (!items || !items.length) {
    list.innerHTML = '<li class="highlight-item"><span class="highlight-item__text">Nenhum elogio recente.</span></li>';
    return;
  }
  list.innerHTML = items.map((item) => `
    <li class="highlight-item">
      <span class="highlight-item__agent">${esc(item.agente)}</span>
      <span class="highlight-item__text">"${esc(item.elogio)}"</span>
      <span class="highlight-item__date">${fmtDate(item.data)}</span>
    </li>`).join('');
}

/* =========================================
   Growth
   ========================================= */

function renderGrowthPoints(points) {
  const list = $('#growthList');
  if (!points || !points.length) {
    list.innerHTML = '<li class="growth-item">Nenhum ponto de crescimento definido.</li>';
    return;
  }
  list.innerHTML = points.map((p) => '<li class="growth-item">' + esc(p) + '</li>').join('');
}

/* =========================================
   Helpers
   ========================================= */

function getScoreBadge(score) {
  if (score >= 80) return '<span class="score-badge score-badge--excellent">' + score + '</span>';
  if (score >= 60) return '<span class="score-badge score-badge--good">' + score + '</span>';
  return '<span class="score-badge score-badge--attention">' + score + '</span>';
}

function getStatusBadge(isRisk) {
  if (isRisk) {
    return '<span class="status-badge status-badge--risk"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>Em risco</span>';
  }
  return '<span class="status-badge status-badge--ok"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>OK</span>';
}

function getMedalHtml(pos) {
  if (pos <= 3) return '<span class="medal medal--' + pos + '">' + pos + '</span>';
  return pos;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}
