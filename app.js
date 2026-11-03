// Aika Market — свой магазин приложений
// Каталог собирается из GitHub Releases: вышел новый релиз с APK — он сам появился в магазине.

const API = 'https://api.github.com/repos';
const OWNER = 'lucifermornngstar52-cell';
const CACHE_KEY = 'hikari_catalog_v2';
const CACHE_TTL = 5 * 60 * 1000;

// ---------- каталог ----------
// repo   — откуда тянуть релизы (пустая строка = только веб-ссылка)
// cat    — game | app | tool | web
// icon   — эмодзи, grad — градиент иконки
const APPS = [
  {
    repo: 'aika-assistant',
    title: 'Aika Assistant',
    cat: 'app',
    icon: 'assets/icons/aika-assistant.png',
    grad: ['#5ef2d6', '#a06bff'],
    desc: 'Моя Айка: голосовой ассистент с Live2D и 3D-аватаром, управлением телефоном через AccessibilityService, чтением уведомлений и умными ответами. Gemini 2.0 Flash и GPT-4o внутри.'
  },
  {
    repo: 'clock-angle-game',
    title: 'Numbra',
    cat: 'game',
    icon: 'assets/icons/numbra.png',
    grad: ['#ffc861', '#ff6b81'],
    desc: 'Игра на углы между стрелками часов: четыре уровня сложности, тысячи вопросов, монеты и достижения. Плюс книга задач «Математика времени» в стиле Рика и Морти.'
  },
  {
    repo: 'aika-world-app',
    title: 'АЙКА МИР',
    cat: 'app',
    icon: 'assets/icons/aika-world.png',
    grad: ['#4fd7ff', '#2b6bff'],
    desc: 'Пиксельная деревня, которая живёт своей жизнью: процедурные жители, погода, циклы дня. Работает офлайн, интернет не нужен.'
  },
  {
    repo: 'neon-strike',
    title: 'NEON STRIKE',
    cat: 'game',
    icon: 'assets/icons/neon-strike.png',
    grad: ['#ff2d95', '#7000ff'],
    desc: 'Неоновый 3D-шутер на Three.js: город, стрельба, мобильное управление. Теперь как приложение — полный экран, без адресной строки.'
  },
  {
    repo: 'zhol-driving-sim',
    title: 'ЖОЛ — симулятор вождения',
    cat: 'game',
    icon: 'assets/icons/zhol.png',
    grad: ['#5ef2d6', '#0f8f6b'],
    desc: 'Симулятор вождения по правилам ПДД Казахстана: знаки, разметка, экзаменационные маршруты. Отдельным приложением, в полный экран.'
  },
  {
    repo: 'rustlite',
    title: 'Rust Lite',
    cat: 'game',
    icon: 'assets/icons/rustlite.png',
    grad: ['#c98b5e', '#7a4a2a'],
    desc: 'Выживание на минималках: собирай, строй, держись подальше от чужих. Лёгкая сборка для слабых телефонов.'
  },
  {
    repo: 'nano-gpt',
    title: 'nanoGPT',
    cat: 'tool',
    icon: 'assets/icons/nanogpt.png',
    grad: ['#a06bff', '#4b1f8f'],
    desc: 'GPT с нуля на чистом NumPy: 350 тысяч параметров, написан вручную, обучается прямо на телефоне.'
  },
  {
    repo: 'zik-os',
    title: 'ZikOS',
    cat: 'tool',
    icon: 'assets/icons/zikos.png',
    grad: ['#5ef2d6', '#0a6a7a'],
    desc: 'Веб-операционная система: окна, приложения, рабочий стол. Собрана в отдельное приложение.'
  },
  {
    repo: 'aika-market',
    title: 'HIKARI store',
    cat: 'tool',
    icon: 'assets/icons/hikari.png',
    grad: ['#5cb8e8', '#2b5f8f'],
    desc: 'Сам магазин как приложение: та же полка, обновления подтягиваются сами.'
  }
];

const CAT_TITLES = { all: 'Все приложения', game: 'Игры', app: 'Приложения', tool: 'Инструменты', web: 'Веб' };

let catalog = [];
let activeCat = 'all';
let query = '';

const $ = (s) => document.querySelector(s);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};

const fmtSize = (b) => {
  if (!b) return '—';
  const mb = b / 1048576;
  return mb >= 1 ? mb.toFixed(1) + ' МБ' : Math.round(b / 1024) + ' КБ';
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const m = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${d.getDate()} ${m[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
};

const ago = (iso) => {
  if (!iso) return '—';
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (days <= 0) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 30) return days + ' дн назад';
  const mo = Math.floor(days / 30);
  return mo + ' мес назад';
};

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 2100);
}

// ---------- загрузка ----------
async function fetchReleases(repo) {
  const r = await fetch(`${API}/${OWNER}/${repo}/releases?per_page=10`);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

async function loadCatalog(force) {
  const btn = $('#refresh');
  btn.classList.add('spin');
  try {
    const cached = !force && JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.ts < CACHE_TTL && Array.isArray(cached.items) && cached.items.length) {
      catalog = cached.items;
      render();
      return;
    }

    // основной путь: готовый catalog.json (его обновляет GitHub Action, лимитов API нет)
    let items = null;
    try {
      const r = await fetch('catalog.json', { cache: 'no-store' });
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j.items) && j.items.length) items = j.items;
      }
    } catch (e) {}

    // запасной путь: напрямую из API GitHub
    if (!items) items = await loadLive();

    if (items && items.length) {
      catalog = items;
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items: catalog }));
      render();
    } else {
      toast('Каталог пуст, попробуй позже');
    }
  } catch (e) {
    toast('Не удалось обновить каталог');
  } finally {
    btn.classList.remove('spin');
  }
}

async function loadLive() {
  const result = [];
  await Promise.all(APPS.map(async (a) => {
    const entry = {
      title: a.title, cat: a.cat, icon: a.icon, grad: a.grad,
      desc: a.desc, web: a.web || '', releases: [], latest: null
    };
    if (a.repo) {
      try {
        const rels = (await fetchReleases(a.repo)).filter((r) => !r.draft);
        entry.releases = rels.map((r) => ({
          tag: r.tag_name,
          name: r.name || r.tag_name,
          notes: (r.body || '').trim(),
          date: r.published_at,
          assets: (r.assets || []).map((x) => ({
            name: x.name, url: x.browser_download_url, size: x.size, downloads: x.download_count || 0
          }))
        }));
        const withApk = entry.releases.filter((r) => r.assets.some((a) => a.name.toLowerCase().endsWith('.apk')));
        entry.latest = withApk[0] || entry.releases[0] || null;
      } catch (e) {
        entry.error = true;
      }
    }
    result.push(entry);
  }));
  return result.filter((a) => a.latest || a.web);
}

// ---------- отрисовка ----------
function apkOf(rel) {
  if (!rel) return null;
  return rel.assets.find((a) => a.name.toLowerCase().endsWith('.apk')) || null;
}

function totalDownloads() {
  let sum = 0;
  catalog.forEach((a) => (a.releases || []).forEach((r) => r.assets.forEach((x) => (sum += x.downloads))));
  return sum;
}

function visible() {
  const q = query.trim().toLowerCase();
  return catalog
    .filter((a) => activeCat === 'all' || a.cat === activeCat)
    .filter((a) => !q || a.title.toLowerCase().includes(q) || (a.desc || '').toLowerCase().includes(q))
    .sort((a, b) => {
      const da = a.latest ? new Date(a.latest.date).getTime() : 0;
      const db = b.latest ? new Date(b.latest.date).getTime() : 0;
      return db - da;
    });
}

function render() {
  const list = $('#list');
  const items = visible();
  list.innerHTML = '';

  if (!items.length) {
    $('#empty').classList.remove('hidden');
  } else {
    $('#empty').classList.add('hidden');
  }

  items.forEach((a) => {
    const card = el('div', 'card');
    const apk = apkOf(a.latest);
    const isNew = a.latest && Date.now() - new Date(a.latest.date) < 7 * 86400000;

    const icEl = el('div', 'icon', a.icon.includes('/') ? `<img src="${a.icon}" alt="" loading="lazy">` : a.icon);
    if (!a.icon.includes('/')) icEl.style.background = `linear-gradient(135deg, ${a.grad[0]}, ${a.grad[1]})`;
    card.appendChild(icEl);

    const main = el('div', 'card-main');
    const titleRow = el('div', 'card-title', `<b>${a.title}</b>`
      + (isNew ? ' <span class="badge new">новое</span>' : '')
      + (apk ? '' : ' <span class="badge">веб</span>'));
    main.appendChild(titleRow);
    main.appendChild(el('div', 'card-sub', apk
      ? `${a.latest.tag} · ${fmtSize(apk.size)} · ${ago(a.latest.date)}`
      : 'открывается в браузере, без установки'));
    const catIcon = a.cat === 'game' ? 'i-game' : a.cat === 'tool' ? 'i-tool' : a.cat === 'web' ? 'i-web' : 'i-app';
    const catName = a.cat === 'game' ? 'игра' : a.cat === 'tool' ? 'инструмент' : a.cat === 'web' ? 'сайт' : 'приложение';
    const meta = el('div', 'card-meta');
    meta.appendChild(el('span', 'm-item', `<svg class="mi"><use href="#${catIcon}"/></svg>${catName}`));
    if (apk) {
      meta.appendChild(el('span', 'm-item', `<svg class="mi"><use href="#i-down"/></svg><em>${apk.downloads}</em>`));
      meta.appendChild(el('span', 'm-item', `<svg class="mi"><use href="#i-size"/></svg>${fmtSize(apk.size)}`));
    }
    main.appendChild(meta);
    if (apk) main.appendChild(el('div', 'card-file', `<svg class="mi"><use href="#i-file"/></svg>${apk.name}`));
    card.appendChild(main);

    const btn = el('button', 'get',
      `<svg class="ti"><use href="#${apk ? 'i-down' : 'i-open'}"/></svg>${apk ? 'скачать' : 'открыть'}`);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (apk) {
        window.location.href = apk.url;
        toast('Загрузка APK началась');
      } else if (a.web) {
        window.open(a.web, '_blank');
      }
    });
    card.appendChild(btn);

    card.addEventListener('click', () => openSheet(a));
    list.appendChild(card);
  });

  // статистика
  $('#stCount').textContent = catalog.length;
  $('#stSize').textContent = totalDownloads();
  const newest = catalog.reduce((acc, a) => {
    const d = a.latest ? new Date(a.latest.date).getTime() : 0;
    return d > acc ? d : acc;
  }, 0);
  $('#stFresh').textContent = newest ? ago(new Date(newest).toISOString()) : '—';
  $('#listTitle').textContent = CAT_TITLES[activeCat] || 'Приложения';
}

// ---------- карточка приложения ----------
function openSheet(a) {
  const apk = apkOf(a.latest);
  const card = $('#sheetCard');
  card.innerHTML = '';

  const head = el('div', 'sheet-head');
  const ic = el('div', 'icon', a.icon.includes('/') ? `<img src="${a.icon}" alt="">` : a.icon);
  if (!a.icon.includes('/')) ic.style.background = `linear-gradient(135deg, ${a.grad[0]}, ${a.grad[1]})`;
  head.appendChild(ic);
  const ht = el('div', '', `<div class="sheet-name">${a.title}</div>
    <div class="sheet-dev">${a.latest ? 'версия ' + a.latest.tag + ' · ' + fmtDate(a.latest.date) : 'веб-версия'}</div>`);
  head.appendChild(ht);
  card.appendChild(head);

  const actions = el('div', 'sheet-actions');
  if (apk) {
    const b = el('button', 'install', `<svg class="ti"><use href="#i-down"/></svg>установить · ${fmtSize(apk.size)}`);
    b.addEventListener('click', () => {
      window.location.href = apk.url;
      toast('Загрузка APK началась');
    });
    actions.appendChild(b);
  } else if (a.web) {
    const b = el('button', 'install', `<svg class="ti"><use href="#i-open"/></svg>открыть в браузере`);
    b.addEventListener('click', () => window.open(a.web, '_blank'));
    actions.appendChild(b);
  }
  if (a.web && apk) {
    const g = el('button', 'ghost', `<svg class="ti"><use href="#i-web"/></svg>веб`);
    g.addEventListener('click', () => window.open(a.web, '_blank'));
    actions.appendChild(g);
  }
  card.appendChild(actions);

  card.appendChild(el('p', 'sheet-desc', a.desc || ''));

  if (a.latest) {
    const facts = el('div', 'facts');
    facts.appendChild(el('div', 'fact', `<span><svg class="fi"><use href="#i-size"/></svg>размер</span><b>${fmtSize(apk ? apk.size : 0)}</b>`));
    facts.appendChild(el('div', 'fact', `<span><svg class="fi"><use href="#i-down"/></svg>скачиваний</span><b>${a.releases[0].assets.reduce((s, x) => s + x.downloads, 0)}</b>`));
    facts.appendChild(el('div', 'fact', `<span><svg class="fi"><use href="#i-refresh"/></svg>обновлено</span><b>${fmtDate(a.latest.date)}</b>`));

    card.appendChild(facts);
  }

  if (a.releases.length) {
    card.appendChild(el('div', 'sect', 'актуальная версия'));
    const r = a.latest;
    const v = el('div', 'ver');
    const apkR = apkOf(r);
    v.appendChild(el('div', 'ver-top',
      `<b>${r.tag}</b><span>${fmtDate(r.date)}${apkR ? ' · ' + fmtSize(apkR.size) : ''}</span>`));
    if (r.notes) v.appendChild(el('div', 'ver-notes', r.notes));
    if (apkR) {
      const g = el('button', 'get', `<svg class="ti"><use href="#i-down"/></svg>скачать · ${apkR.name}`);
      g.addEventListener('click', () => {
        window.location.href = apkR.url;
        toast('Загрузка APK началась');
      });
      v.appendChild(g);
    }
    card.appendChild(v);
  }

  card.appendChild(el('div', 'hint',
    'Android спросит разрешение на установку из этого источника. Разреши один раз: Настройки → Приложения → Особые права → Установка неизвестных приложений.'));

  $('#sheet').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeSheet() {
  $('#sheet').classList.add('hidden');
  document.body.style.overflow = '';
}

// ---------- события ----------
$('#q').addEventListener('input', (e) => {
  query = e.target.value;
  $('#clearQ').classList.toggle('show', !!query);
  render();
});

$('#clearQ').addEventListener('click', () => {
  $('#q').value = '';
  query = '';
  $('#clearQ').classList.remove('show');
  render();
});

$('#chips').addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === b));
  activeCat = b.dataset.cat;
  render();
});

$('#refresh').addEventListener('click', () => loadCatalog(true));

$('#toList').addEventListener('click', () => {
  document.querySelector('.shelf').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function showInstallHelp() {
  const card = $('#sheetCard');
  card.innerHTML = `
    <div class="sheet-head">
      <div class="sheet-name">Как поставить приложение</div>
    </div>
    <p class="sheet-desc">
      Магазин отдаёт обычные APK-файлы. Android по умолчанию не любит ставить их из браузера,
      поэтому один раз нужно разрешить установку.
    </p>
    <div class="ver"><div class="ver-top"><b>1. Скачай</b></div>
      <div class="ver-notes">Нажми «Скачать». Файл появится в загрузках, в шторке будет уведомление.</div></div>
    <div class="ver"><div class="ver-top"><b>2. Разреши</b></div>
      <div class="ver-notes">Android спросит про установку из неизвестных источников. Жми «Разрешить» и вернись назад.</div></div>
    <div class="ver"><div class="ver-top"><b>3. Установи</b></div>
      <div class="ver-notes">Открой файл в загрузках и нажми «Установить». Если играешь в браузере — устанавливать вообще не надо.</div></div>
    <div class="hint">Обновление: скачиваешь новый APK из магазина и ставишь поверх, данные и настройки сохраняются.</div>
  `;
  $('#sheet').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

$('#howto').addEventListener('click', showInstallHelp);

$('#sheet').addEventListener('click', (e) => {
  if (e.target.dataset.close !== undefined || e.target.classList.contains('sheet-backdrop')) closeSheet();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSheet();
});

// оффлайн-кэш каталога, чтобы магазин открывался даже без сети
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  // раз в сутки обновляем регистрацию, чтобы правки доезжали сразу
  navigator.serviceWorker.getRegistration().then((r) => r && r.update()).catch(() => {});
}

loadCatalog(false);
