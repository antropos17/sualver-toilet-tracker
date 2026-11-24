Я {{PERSON_NAME}} (person = `{{PERSON}}`). В трекере я взял в работу проект «{{NAME}}». Владелец: {{OWNER_NAME}}. Подключи его к трекеру. Отвечай по-русски, коротко.

Трекер: {{TRACKER}}
Ключ проекта в трекере: `{{KEY}}`
Общий приватный репозиторий: {{REPO}}
Комплект трекера: https://github.com/antropos17/sualver-toilet-tracker (папка `kit`)

Правила:
- В базу трекера пиши только командами `node "<kit>/tracker.mjs" …` (`<kit>` — папка kit моего клона комплекта). Никаких тестовых и пробных записей. Каждую запись сначала покажи мне и пиши после моего «да».
- Если комплекта или ключа на машине нет (`tracker.mjs goals {{KEY}}` пишет «нет ключа»), остановись и скажи мне: ключ передаёт Руслан лично.
- Если репозиторий не указан или доступа к нему нет, остановись и скажи мне. Новый репозиторий не создавай.
- Коммит и push только после моего «да».

1. Склонируй репозиторий (`gh repo clone <владелец/название>`), прочитай README и код. Оцени коротко: что это, в каком состоянии, что делать дальше.
2. Прочитай проект в трекере: `tracker.mjs get projects {{KEY}}`. Если записи нет, создай её после шага 3 (после моего «да»): `tracker.mjs add-project {{KEY}} "{{NAME}}" --person {{PERSON}} --groups "g1:…,g2:…" --repo <владелец/название> --color {{COLOR}} --show "{{SHOW}}"`. Если есть, не перезаписывай её и бери секции из её `groups` (архивный проект та же команда вернёт в список).
3. Предложи мне 2–5 секций и 5–15 целей. После «да» запиши:
   - на каждую цель: `tracker.mjs add-goal {{KEY}} "<название>" --person {{PERSON}} --group <id секции>`;
   - один пост с оценкой: файл `u-{{KEY}}-start.json` с полями `{"project":"{{KEY}}","person":"{{PERSON}}","group":"g1","title":"Оценка: …","items":["~ …","+ …"],"shots":[],"visual":false,"goalIds":[],"commits":[]}`, затем `tracker.mjs stage u-{{KEY}}-start.json`.
   `group` — только id из `groups`. В `items` 3–6 строк, каждая начинается с `+ `, `~ `, `! ` или `- `.
4. Подключи push к трекеру по разделу «Adding another project» в `kit/README.md` комплекта: `kit/report.mjs` и `kit/README.md` → `tools/tracker/`; `.claude/tracker.json` = `{"project":"{{KEY}}","tracker":"{{TRACKER}}"}` (плюс `preview`, если у проекта есть экран); хук на `git push` в `.claude/settings.json`; строки `.claude/*.local.json` и `.claude/shots/` в `.gitignore`; `.claude/tracker.local.json` = `{"person":"{{PERSON}}"}`; правило из README в `CLAUDE.md` проекта. Покажи дифф и закоммить только эти файлы после моего «да».
5. Проверка: `node tools/tracker/report.mjs draft` показывает проект `{{KEY}}` и person = `{{PERSON}}`. Пробный пост не пиши.
