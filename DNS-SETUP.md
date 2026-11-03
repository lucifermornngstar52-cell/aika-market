# Переезд на hikarios.eu.org

`eu.org` выдаёт домены бесплатно, но **не управляет DNS**: он только делегирует зону на твои неймсерверы.
Поэтому порядок такой: сначала DNS-провайдер, потом заявка в eu.org.

## Шаг 1. Свои неймсерверы (Cloudflare, бесплатно)

1. Регистрация на cloudflare.com → Add site → `hikarios.eu.org` (план Free).
2. Cloudflare покажет пару неймсерверов вида `xxx.ns.cloudflare.com` / `yyy.ns.cloudflare.com`. Запиши их.
3. В Cloudflare сразу создай записи:
   - `CNAME` · name `@` · target `lucifermornngstar52-cell.github.io` · Proxy **DNS only** (серое облако)
   - `CNAME` · name `www` · target `lucifermornngstar52-cell.github.io` · Proxy **DNS only**

Прокси Cloudflare (оранжевое облако) для GitHub Pages лучше не включать: ломается выпуск сертификата и часть редиректов.

## Шаг 2. Заявка в eu.org

1. nic.eu.org → «Register» → подтверди email.
2. «New domain» → имя `hikarios`, домен `eu.org`.
3. Nameservers: вписать те две пары из Cloudflare (обязательно оба).
4. Отправить. Дальше ручная модерация волонтёрами: обычно от нескольких дней до нескольких недель.
   Статус видно в личном кабинете: `Pending` → `Delegated`.

## Шаг 3. Включение домена на GitHub Pages

Когда статус стал `Delegated`:

```bash
# файл CNAME в корне репозитория
echo "hikarios.eu.org" > CNAME
git add CNAME && git commit -m "custom domain: hikarios.eu.org" && git push
```

Или через API:

```bash
curl -X PUT -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/lucifermornngstar52-cell/aika-market/pages \
  -d '{"cname":"hikarios.eu.org","source":{"branch":"main","path":"/"}}'
```

Затем Settings → Pages → **Enforce HTTPS** (сертификат Let's Encrypt GitHub выдаёт сам, обычно 5-30 минут).

## Проверка

```bash
curl -sI https://hikarios.eu.org | head -3      # ждём 200 и server: GitHub.com
curl -s "https://dns.google/resolve?name=hikarios.eu.org&type=NS"
```

## Если eu.org тянет слишком долго

Бесплатные альтернативы с быстрым одобрением:
- `is-a.dev` — поддомен через pull request на GitHub, обычно за день
- `js.org` — для JS-проектов, тоже через PR
- `eu.org` — самый «взрослый» вариант, но и самый медленный

## План поддоменов

- `hikarios.eu.org` — главная (витрина HikariOS)
- `market.hikarios.eu.org` — Aika Market
- `aika.hikarios.eu.org` — лендинг Айки
- `admin.hikarios.eu.org` — панель лицензий

Каждый — отдельный `CNAME` в Cloudflare на нужный `*.github.io`.
