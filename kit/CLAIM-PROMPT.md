Я {{PERSON_NAME}} (person = `{{PERSON}}`). В трекере я взял в работу проект «{{NAME}}», чей он: {{OWNER_NAME}}. Подключи его к трекеру. Отвечай по-русски, коротко.

Трекер: {{TRACKER}}
Ключ проекта в трекере: `{{KEY}}`
Общий приватный репозиторий: {{REPO}}
Комплект трекера: https://github.com/antropos17/sualver-toilet-tracker (папка `kit`)

Правила:
- В базу трекера пиши только инструментом Artifact: `action: "write_db"`, `url` = ссылка трекера. Никаких тестовых и пробных записей. Каждый batch сначала покажи мне и пиши после моего «да».
- Если репозиторий не указан или доступа к нему нет, остановись и скажи мне. Новый репозиторий не создавай.
- Прочитай трекер (`action: "read"`). Если в ответе нет «writer», скажи: «Попроси Руслана открыть Share с правом редактирования», и жди.
- Коммит и push только после моего «да».

1. Склонируй репозиторий (`gh repo clone <владелец/название>`), прочитай README и код. Оцени коротко: что это, в каком состоянии, что делать дальше.
2. Прочитай `projects/{{KEY}}`: `action: "read_db"`, `db_op: "get"`, `collection: "projects"`, `doc_id: "{{KEY}}"`. Если записи нет, создай её первой записью в batch из шага 3. Если есть, не перезаписывай её и бери секции из её `groups`; если в ней `archived: true`, добавь в batch `{"op":"update","collection":"projects","doc_id":"{{KEY}}","data":{"archived":false}}`.
3. Предложи мне 2–5 секций и 5–15 целей. После «да» запиши всё одним вызовом `write_db`, `db_op: "batch"` (`<ms>` — текущее время в миллисекундах, одно на весь batch):
   - если записи нет: `{"op":"set","collection":"projects","doc_id":"{{KEY}}","data":{"name":"{{NAME}}","repo":"<владелец/название>","color":"{{COLOR}}","groups":[{"id":"g1","name":"…"},{"id":"g2","name":"…"}],"show":"{{SHOW}}","createdAt":<ms>,"createdBy":"{{PERSON}}","archived":false}}`
   - на каждую цель: `{"op":"set","collection":"goals","doc_id":"g-{{KEY}}-<n>","data":{"project":"{{KEY}}","group":"g1","title":"…","done":false,"removed":false,"order":<ms + n>,"createdAt":<ms>,"createdBy":"{{PERSON}}","doneAt":0,"doneBy":""}}`
   - на каждую цель: `{"op":"set","collection":"events","doc_id":"e-<ms>-g-{{KEY}}-<n>","data":{"type":"goal_added","goalId":"g-{{KEY}}-<n>","title":"…","project":"{{KEY}}","person":"{{PERSON}}","via":"claude","at":<ms>}}`
   - один пост с оценкой: `{"op":"set","collection":"updates","doc_id":"u-{{KEY}}-start","data":{"project":"{{KEY}}","person":"{{PERSON}}","via":"claude","group":"g1","title":"Оценка: …","items":["~ …","+ …"],"shots":[],"visual":false,"goalIds":[],"commits":[],"createdAt":<ms>}}`
   `group` — только id из `groups`. В `items` 3–6 строк, каждая начинается с `+ `, `~ `, `! ` или `- `. В batch не больше 50 записей.
4. Подключи push к трекеру по разделу «Adding another project» в `kit/README.md` комплекта: `kit/report.mjs` и `kit/README.md` → `tools/tracker/`; `.claude/tracker.json` = `{"project":"{{KEY}}","artifact":"{{TRACKER}}"}` (плюс `preview`, если у проекта есть экран); хук на `git push` в `.claude/settings.json`; строки `.claude/*.local.json` и `.claude/shots/` в `.gitignore`; `.claude/tracker.local.json` = `{"person":"{{PERSON}}"}`; правило из README в `CLAUDE.md` проекта. Покажи дифф и закоммить только эти файлы после моего «да».
5. Проверка: `node tools/tracker/report.mjs draft` показывает проект `{{KEY}}` и person = `{{PERSON}}`. Пробный пост не пиши.
