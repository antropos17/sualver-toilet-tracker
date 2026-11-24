#!/usr/bin/env node
// Запись в трекер «Sualver.az + Туалет» (Firestore) ключом сервисного аккаунта. Вызывается из любого проекта
// по абсолютному пути: node "<путь к kit>/tracker.mjs" <команда> …
//
//   goals <project> [--all]                     открытые цели проекта (с --all и закрытые): id, раздел, кто делает
//   get <collection> <id>                       документ как JSON (например projects/<project> → groups)
//   take <goalId> --person <p>                  взять цель: takenBy/takenAt + событие goal_taken
//   release <goalId>                            отпустить цель: takenBy "", takenAt 0, без события
//   add-goal <project> "<title>" --person <p> [--group <id>] [--take]
//                                               новая цель g-<project>-<ms> + событие goal_added (с --take сразу взять)
//   add-project <key> "<name>" --person <p> --groups "g1:…,g2:…" [--repo o/r] [--color c] [--show id]
//                                               новый проект (если его нет; архивный — вернуть)
//   close <goalId> --person <p>                 закрыть цель + событие goal_done
//   stage <file.json>                           записать этап в updates (id = поле id или имя файла) и закрыть его goalIds
//   upload-shot <file.png> [--name <name>]      положить снимок в shots/ репозитория трекера через GitHub (gh api) и вывести имя
//
// Ключ: TRACKER_FIREBASE_KEY, иначе GOOGLE_APPLICATION_CREDENTIALS, иначе kit/firebase-key.json.
// --dry печатает, что было бы записано, и ничего не пишет.
// TRACKER_COLLECTION_PREFIX=_selftest_ пишет в коллекции-песочницы (_selftest_goals …) — только для проверки скрипта.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { openDb, REPO } from "./fire.mjs";

const argv = process.argv.slice(2);
const dry = argv.includes("--dry");
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const pos = argv.filter((x, i) => !x.startsWith("--") && !(argv[i - 1] || "").match(/^--(person|group|name|groups|repo|color|show)$/));
const [cmd, ...rest] = pos;
const PFX = process.env.TRACKER_COLLECTION_PREFIX || "";
const C = (name) => PFX + name;
const PEOPLE = ["ruslan", "seymur"];
const now = Date.now();
const die = (m) => { console.error("Ошибка: " + m); process.exit(1); };
const person = () => { const p = opt("--person"); if (!PEOPLE.includes(p)) die("нужен --person ruslan или --person seymur"); return p; };

let db;
const getDb = () => (db ||= openDb());
async function commit(writes) {
  // writes: [[op, collection, id, data]]
  for (const [op, c, id, data] of writes) console.log(`${dry ? "[dry] " : ""}${op} ${C(c)}/${id}${data ? " " + JSON.stringify(data) : ""}`);
  if (dry) return;
  const b = getDb().batch();
  for (const [op, c, id, data] of writes) {
    const ref = getDb().collection(C(c)).doc(id);
    if (op === "set") b.set(ref, data); else if (op === "update") b.update(ref, data); else b.delete(ref);
  }
  await b.commit();
  console.log("Записано.");
}
async function goal(id) {
  const s = await getDb().collection(C("goals")).doc(id).get();
  if (!s.exists) die(`нет цели ${id}`);
  return { id, ...s.data() };
}
const ev = (type, g, p, at, suffix = "") => ["set", "events", `e-${at}-${g.id}${suffix}`, { type, goalId: g.id, title: g.title, project: g.project, person: p, via: "claude", at }];

const commands = {
  async goals([project]) {
    if (!project) die("укажи проект: goals <project>");
    const snap = await getDb().collection(C("goals")).where("project", "==", project).get();
    const all = argv.includes("--all");
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((g) => !g.removed && (all || !g.done))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    if (!list.length) return console.log(`У проекта ${project} нет ${all ? "" : "открытых "}целей.`);
    for (const g of list) console.log(`${g.id}\t${g.group || "-"}\t${g.done ? "готово" : g.takenBy ? "делает " + g.takenBy : "свободна"}\t${g.title}`);
  },
  async get([c, id]) {
    if (!c || !id) die("get <collection> <id>");
    const s = await getDb().collection(C(c)).doc(id).get();
    if (!s.exists) die(`нет документа ${c}/${id}`);
    console.log(JSON.stringify({ id, ...s.data() }, null, 2));
  },
  async take([id]) {
    const p = person(), g = await goal(id);
    if (g.done) die(`цель ${id} уже закрыта`);
    if (g.takenBy && g.takenBy !== p) die(`цель ${id} уже делает ${g.takenBy}. Не беру — спроси пользователя.`);
    await commit([["update", "goals", id, { takenBy: p, takenAt: now }], ev("goal_taken", g, p, now, "-t")]);
  },
  async release([id]) {
    await goal(id);
    await commit([["update", "goals", id, { takenBy: "", takenAt: 0 }]]);
  },
  async "add-goal"([project, title]) {
    if (!project || !title) die('add-goal <project> "<title>" --person <p>');
    const p = person(), id = `g-${project}-${now}`;
    const g = { project, group: opt("--group") || "", title, done: false, removed: false, order: now, createdAt: now, createdBy: p, doneAt: 0, doneBy: "",
      takenBy: argv.includes("--take") ? p : "", takenAt: argv.includes("--take") ? now : 0 };
    const w = [["set", "goals", id, g], ev("goal_added", { id, ...g }, p, now, "-a")];
    if (argv.includes("--take")) w.push(ev("goal_taken", { id, ...g }, p, now, "-t"));
    await commit(w);
    console.log("id цели: " + id);
  },
  async "add-project"([key, name]) {
    if (!key || !name) die('add-project <key> "<name>" --person <p> --groups "g1:Название,g2:Название" [--repo o/r] [--color c] [--show id]');
    const p = person(), ref = getDb().collection(C("projects")).doc(key), s = await ref.get();
    if (s.exists) {
      if (s.get("archived")) return commit([["update", "projects", key, { archived: false }]]);
      return console.log(`Проект ${key} уже есть, не трогаю. Секции: ${JSON.stringify(s.get("groups") || [])}`);
    }
    const groups = (opt("--groups") || "").split(",").map((x) => x.split(":")).filter((x) => x[0] && x[1]).map(([id, n]) => ({ id: id.trim(), name: n.trim() }));
    if (!groups.length) die('нужны секции: --groups "g1:Название,g2:Название"');
    await commit([["set", "projects", key, { name, repo: opt("--repo") || "", color: opt("--color") || "violet", groups, show: opt("--show") || "", createdAt: now, createdBy: p, archived: false }]]);
  },
  async close([id]) {
    const p = person(), g = await goal(id);
    if (g.done) return console.log(`Цель ${id} уже закрыта.`);
    await commit([["update", "goals", id, { done: true, doneAt: now, doneBy: p, takenBy: "", takenAt: 0 }], ev("goal_done", g, p, now)]);
  },
  async stage([file]) {
    if (!file) die("stage <file.json>");
    const rec = JSON.parse(fs.readFileSync(file, "utf8"));
    const id = rec.id || path.basename(file, ".json");
    const data = { ...rec };
    for (const k of ["id", "groupName", "goalTitles"]) delete data[k]; // локальные поля для Telegram, в базу не идут
    if (!PEOPLE.includes(data.person)) die("в записи нужен person: ruslan или seymur");
    if (!data.project || !data.title) die("в записи нужны project и title");
    data.createdAt ??= now; data.goalIds ??= []; data.shots ??= []; data.visual ??= data.shots.length > 0; data.via ??= "claude";
    for (const s of data.shots) if (!/^[\w.-]+\.(png|jpe?g|webp)$/i.test(s.id || "")) die(`shots[].id должен быть именем файла в shots/ (сначала upload-shot): ${s.id}`);
    const w = [["set", "updates", id, data]];
    for (const gid of data.goalIds) {
      const g = await goal(gid);
      if (!g.done) w.push(["update", "goals", gid, { done: true, doneAt: now, doneBy: data.person, takenBy: "", takenAt: 0 }], ev("goal_done", g, data.person, now));
    }
    await commit(w);
  },
  async "upload-shot"([file]) {
    if (!file || !fs.existsSync(file)) die("upload-shot <file.png>: файла нет");
    const buf = fs.readFileSync(file), ext = path.extname(file).toLowerCase().replace(".jpeg", ".jpg");
    if (![".png", ".jpg", ".webp"].includes(ext)) die("снимок должен быть png, jpg или webp");
    if (buf.length > 5 * 1048576) die("снимок больше 5 МБ: уменьши его");
    // Имя по содержимому: один и тот же файл не ляжет дважды.
    const name = (opt("--name") || crypto.createHash("sha256").update(buf).digest("hex").slice(0, 32)) + ext;
    if (dry) return console.log(`[dry] загрузил бы shots/${name} в ${REPO}`);
    const exists = (() => { try { execFileSync("gh", ["api", `repos/${REPO}/contents/shots/${name}`, "--silent"], { stdio: "ignore" }); return true; } catch { return false; } })();
    if (!exists) {
      const body = path.join(os.tmpdir(), `shot-${process.pid}.json`);
      fs.writeFileSync(body, JSON.stringify({ message: `Shot ${name}`, content: buf.toString("base64") }));
      try { execFileSync("gh", ["api", "-X", "PUT", `repos/${REPO}/contents/shots/${name}`, "--input", body, "--silent"], { stdio: ["ignore", "ignore", "inherit"] }); }
      catch { die("GitHub не принял файл. Проверь `gh auth status` и право записи в " + REPO); }
      finally { fs.rmSync(body, { force: true }); }
    }
    console.log(name);
  },
};

if (!commands[cmd]) {
  console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 19).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  process.exit(cmd ? 1 : 0);
}
await commands[cmd](rest);
process.exit(0);
