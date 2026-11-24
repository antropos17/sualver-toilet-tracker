# Rule «кто что делает»

This is the rule each person keeps in their own global `~/.claude/CLAUDE.md`, so that their Claude marks in the tracker which goal it is working on. Installation and version check: steps 8 and 9 of «Adding another project» in `kit/README.md`.

Placeholders: `{{PERSON}}` and `{{PERSON_NAME}}` are the person who installs it (`ruslan` / Руслан or `seymur` / Сеймур), `{{OTHER}}` and `{{OTHER_NAME}}` are the other one.

The same text is embedded in `tracker.html` (`<script id="rules-prompt">`, block «Правила для Claude» in the profile). After editing it here, copy it there too and raise the version in both places.

The text to insert (everything between the lines):

---

## Трекер: кто что делает (все проекты из списка ниже)

Версия правил: 1 (25.11.2026)

Трекер «Sualver.az + Туалет»: https://claude.ai/code/artifact/3e6b0ef1-7a3a-43c9-8ed8-7edf927228c5
В нём я ({{PERSON_NAME}}, `{{PERSON}}`) и {{OTHER_NAME}} (`{{OTHER}}`) видим, кто какую задачу взял, чтобы не делать одно и то же.

Ключи проектов в трекере: Sualver — `sual`, Смыв — `toilet`, Воксель Бокс — `voxel-boxing`,
Кусь — `kus`, «30 дней» — `glowup`, Прототипы — `prototypes`. Для других проектов правило не действует.

1. Перед началом задачи прочитай цели проекта в трекере (`read_db`, коллекция `goals`).
   Если подходящую цель уже делает {{OTHER_NAME}} (`takenBy: "{{OTHER}}"`), остановись и скажи мне об этом.
2. Если цель свободна, поставь на ней `takenBy: "{{PERSON}}"`. Если цели нет, создай её и сразу возьми.
   Название цели короткое и понятное человеку: «Меню выбора бойца», а не имя файла.
3. Когда задача готова и проверена, закрой цель, запиши этап в трекер и отправь пост в канал.
4. Если задачу бросили, сними отметку с цели.

Как именно писать в базу и слать пост: `README.md` в папке kit репозитория antropos17/sualver-toilet-tracker.
Мелкие правки (опечатка, один цвет) в трекер не пиши. Вопросы и обсуждение без правок кода тоже.
Если инструмента Artifact в сессии нет, скажи об этом одной строкой и работай дальше.

---
