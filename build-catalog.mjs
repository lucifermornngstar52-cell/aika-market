// Собирает catalog.json из GitHub Releases, чтобы сайт не зависел от лимитов API.
// Запускается GitHub Action'ом по расписанию и вручную.
import { writeFileSync } from 'node:fs';

const OWNER = 'lucifermornngstar52-cell';
const TOKEN = process.env.T || process.env.GITHUB_TOKEN || '';

// зеркало конфига из app.js
const APPS = [
  { repo: 'aika-market', title: 'HIKARI store', cat: 'tool', icon: 'assets/icons/hikari.png', grad: ['#5cb8e8', '#2b5f8f'],
    web: 'https://lucifermornngstar52-cell.github.io/aika-market/',
    desc: 'Этот самый магазин, но как приложение: та же полка, тот же каталог, установка в один тап.' },
  { repo: 'aika-assistant', title: 'Aika Assistant', cat: 'app', icon: 'assets/icons/aika-assistant.png', grad: ['#5ef2d6', '#a06bff'],
    desc: 'Моя Айка: голосовой ассистент с Live2D и 3D-аватаром, управлением телефоном через AccessibilityService, чтением уведомлений и умными ответами. Gemini 2.0 Flash и GPT-4o внутри.' },
  { repo: 'clock-angle-game', title: 'Numbra', cat: 'game', icon: 'assets/icons/numbra.png', grad: ['#ffc861', '#ff6b81'],
    web: 'https://lucifermornngstar52-cell.github.io/clock-angle-game/',
    desc: 'Игра на углы между стрелками часов: четыре уровня сложности, тысячи вопросов, монеты и достижения. Плюс книга задач «Математика времени» в стиле Рика и Морти.' },
  { repo: 'rustlite', title: 'Rust Lite', cat: 'game', icon: 'assets/icons/rustlite.png', grad: ['#c98b5e', '#7a4a2a'],
    desc: 'Выживание на минималках: собирай, строй, держись подальше от чужих. Лёгкая сборка для слабых телефонов.' },
  { repo: 'aika-world-app', title: 'АЙКА МИР', cat: 'app', icon: 'assets/icons/aika-world.png', grad: ['#4fd7ff', '#2b6bff'],
    web: 'https://lucifermornngstar52-cell.github.io/aika-world/',
    desc: 'Пиксельная деревня, которая живёт своей жизнью: процедурные жители, погода, циклы дня. APK-обёртка онлайн-мира.' },
  { repo: '', title: 'NEON STRIKE', cat: 'game', icon: 'assets/icons/neon-strike.png', grad: ['#ff2d95', '#7000ff'],
    web: 'https://lucifermornngstar52-cell.github.io/neon-strike/',
    desc: 'Браузерный 3D-шутер на Three.js: неоновый город, стрельба, мобильное управление. Открывается прямо в браузере.' },
  { repo: '', title: 'ЖОЛ — симулятор вождения', cat: 'game', icon: 'assets/icons/zhol.png', grad: ['#5ef2d6', '#0f8f6b'],
    web: 'https://lucifermornngstar52-cell.github.io/zhol-driving-sim/',
    desc: 'Симулятор вождения по правилам ПДД Казахстана: знаки, разметка, экзаменационные маршруты.' },
  { repo: '', title: 'PenkovBank', cat: 'tool', icon: 'assets/icons/penkovbank.png', grad: ['#8ad4ff', '#2452ff'],
    web: 'https://lucifermornngstar52-cell.github.io/penkov-bank/',
    desc: 'Цифровой банк нового поколения: карты, переводы, интерфейс как у настоящего банка.' },
  { repo: '', title: 'nanoGPT', cat: 'tool', icon: 'assets/icons/nanogpt.png', grad: ['#a06bff', '#4b1f8f'],
    web: 'https://lucifermornngstar52-cell.github.io/nano-gpt/',
    desc: 'GPT с нуля на чистом NumPy: 350 тысяч параметров, написан вручную, обучается прямо в браузере.' },
  { repo: '', title: 'История Новомихайловки', cat: 'web', icon: 'assets/icons/novomihaylovka.png', grad: ['#e0b98a', '#8a5a2b'],
    web: 'https://lucifermornngstar52-cell.github.io/novomihaylovka/',
    desc: 'История села Новомихайловка с 1895 по 2026 год: архивные материалы, фотографии, хронология.' },
  { repo: '', title: 'ZikOS', cat: 'tool', icon: 'assets/icons/zikos.png', grad: ['#5ef2d6', '#0a6a7a'],
    web: 'https://lucifermornngstar52-cell.github.io/zik-os/',
    desc: 'Веб-операционная система в браузере: окна, приложения, рабочий стол.' }
];

const headers = { 'User-Agent': 'aika-market-catalog' };
if (TOKEN) headers.Authorization = `token ${TOKEN}`;

async function releases(repo) {
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${repo}/releases?per_page=10`, { headers });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

const items = [];
for (const a of APPS) {
  const entry = {
    title: a.title, cat: a.cat, icon: a.icon, grad: a.grad,
    desc: a.desc, web: a.web || '', releases: [], latest: null
  };
  if (a.repo) {
    try {
      const rels = (await releases(a.repo)).filter((x) => !x.draft);
      entry.releases = rels.map((x) => ({
        tag: x.tag_name,
        name: x.name || x.tag_name,
        notes: (x.body || '').trim(),
        date: x.published_at,
        assets: (x.assets || []).map((f) => ({
          name: f.name, url: f.browser_download_url, size: f.size, downloads: f.download_count || 0
        }))
      }));
      entry.latest = entry.releases[0] || null;
    } catch (e) {
      entry.error = String(e);
    }
  }
  if (entry.latest || entry.web) items.push(entry);
  console.log(entry.title.padEnd(26), entry.latest ? entry.latest.tag : (entry.web ? 'веб' : 'пусто'));
}

const out = { generated: new Date().toISOString(), items };
writeFileSync('catalog.json', JSON.stringify(out, null, 1) + '\n');
console.log('\ncatalog.json:', items.length, 'записей');
