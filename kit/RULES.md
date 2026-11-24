# Rule «кто что делает»

This is the rule each person keeps in their own global `~/.claude/CLAUDE.md`, so that their Claude marks in the tracker which goal it is working on. Installation and version check: steps 8 and 9 of «Adding another project» in `kit/README.md`.

Placeholders: `{{PERSON}}` and `{{PERSON_NAME}}` are the person who installs it (`ruslan` / Руслан or `seymur` / Сеймур), `{{OTHER}}` and `{{OTHER_NAME}}` are the other one. When installing, also replace `<kit>` with the absolute path to the person's `kit` folder.

The same text is embedded in `tracker.html` (`<script id="rules-prompt">`, block «Правила для Claude» in the profile). After editing it here, copy it there too and raise the version in both places.

The text to insert (everything between the lines):

---

## Трекер: кто что делает (все проекты из списка ниже)

Версия правил: 2 (25.11.2026)

Трекер «Sualver.az + Туалет»: https://antropos17.github.io/sualver-toilet-tracker/
В нём я ({{PERSON_NAME}}, `{{PERSON}}`) и {{OTHER_NAME}} (`{{OTHER}}`) видим, кто какую задачу взял, чтобы не делать одно и то же.
Команды ниже: `node "<kit>/tracker.mjs" …`, где `<kit>` — папка kit моего клона antropos17/sualver-toilet-tracker.

Ключи проектов в трекере: Sualver — `sual`, Смыв — `toilet`, Воксель Бокс — `voxel-boxing`,
Кусь — `kus`, «30 дней» — `glowup`, Прототипы — `prototypes`. Для других проектов правило не действует.

1. Перед началом задачи прочитай цели проекта: `tracker.mjs goals <проект>`.
   Если подходящую цель уже делает {{OTHER_NAME}} («делает {{OTHER}}»), остановись и скажи мне об этом.
2. Если цель свободна, возьми её: `tracker.mjs take <id> --person {{PERSON}}`. Если цели нет, создай и сразу возьми:
   `tracker.mjs add-goal <проект> "<название>" --person {{PERSON}} --take`.
   Название цели короткое и понятное человеку: «Меню выбора бойца», а не имя файла.
3. Когда задача готова и проверена, запиши этап с закрытием цели (`tracker.mjs stage <файл>`, в `goalIds` — id цели) и отправь пост в канал.
4. Если задачу бросили, сними отметку: `tracker.mjs release <id>`.

Как именно писать этап, снимки и пост: `README.md` в папке kit.
Мелкие правки (опечатка, один цвет) в трекер не пиши. Вопросы и обсуждение без правок кода тоже.
Если kit или ключа на машине нет (`tracker.mjs goals` пишет «нет ключа»), скажи об этом одной строкой и работай дальше.

---
