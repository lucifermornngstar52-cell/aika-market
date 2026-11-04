// Зеркалит APK из релизов прямо в репозиторий сайта,
// чтобы ссылки были обычной статикой GitHub Pages — без редиректов на CDN,
// из-за которых мобильная загрузка висит на 100%.

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';

const TOKEN = process.env.T || process.env.GITHUB_TOKEN || '';
const LIMIT = 90 * 1024 * 1024;   // Pages не отдаёт файлы больше 100 МБ
const DIR = 'apk';

if (!existsSync(DIR)) mkdirSync(DIR);

const catalog = JSON.parse(readFileSync('catalog.json', 'utf8'));
let changed = false;

for (const item of catalog.items) {
  if (!item.latest) continue;
  const apk = item.latest.assets.find((a) => a.name.toLowerCase().endsWith('.apk'));
  if (!apk) continue;

  const safe = apk.name.replace(/[^\w.\-]/g, '_');

  if (apk.size > LIMIT) {
    console.log(`— ${item.title}: ${apk.name} ${(apk.size / 1048576).toFixed(0)} МБ, больше лимита Pages, оставляем ссылку на GitHub`);
    delete item.mirror;
    changed = true;
    continue;
  }

  const path = `${DIR}/${safe}`;
  const exists = existsSync(path) && statSync(path).size === apk.size;

  if (!exists) {
    try {
      execSync(
        `curl -sSL --fail --retry 3 -H "Authorization: token ${TOKEN}" -H "Accept: application/octet-stream" ` +
        `-o "${path}.tmp" "${apk.url}" && mv "${path}.tmp" "${path}"`,
        { stdio: 'inherit', shell: '/bin/bash' }
      );
      const got = statSync(path).size;
      if (got !== apk.size) {
        console.log(`! ${apk.name}: размер ${got} вместо ${apk.size}, отбрасываю`);
        execSync(`rm -f "${path}"`);
        continue;
      }
      console.log(`+ скачал ${apk.name} (${(apk.size / 1024).toFixed(0)} КБ)`);
      changed = true;
    } catch (e) {
      console.log(`! не смог скачать ${apk.name}`);
      continue;
    }
  } else {
    console.log(`= ${apk.name} уже зеркален`);
  }

  item.mirror = path;
  changed = true;
}

// подчищаем зеркала, которых больше нет в актуальных сборках
const keep = new Set(catalog.items.map((i) => i.mirror).filter(Boolean));
for (const f of execSync(`ls ${DIR}`).toString().trim().split('\n').filter(Boolean)) {
  const p = `${DIR}/${f}`;
  if (!keep.has(p)) {
    execSync(`rm -f "${p}"`);
    console.log(`- удалил устаревший ${p}`);
    changed = true;
  }
}

if (changed) {
  writeFileSync('catalog.json', JSON.stringify(catalog, null, 1) + '\n');
  console.log('\nкаталог обновлён зеркалами');
} else {
  console.log('\nвсё уже на месте');
}
