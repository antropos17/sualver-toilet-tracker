// Открыть трекер в Playwright без живой базы: модули Firebase подменяются заглушками с данными из fixture.json,
// любые запросы к Firestore и входу Google обрываются. Живая страница не меняется — всё делается со стороны проверки.
//
//   const offline = require("<kit>/offline/offline.cjs");
//   const net = await offline(context);            // до page.goto; context = browser.newContext()
//   await page.goto("file:///X:/Туалет/tracker/tracker.html");
//   net.blocked → сколько запросов к базе оборвано (должно быть 0); window.__offline.writes → попытки записи страницы (никуда не уходят)
//   await page.evaluate(() => window.__offline.listens) → какие подписки открыла страница и сколько документов получила
//
// Из командной строки — один снимок:
//   node kit/offline/offline.cjs <страница.html или URL> <снимок.png> [--width 390] [--height 844] [--dark] [--full]
// Playwright ищется как playwright / playwright-core или по пути из PLAYWRIGHT_CORE.
const fs = require("node:fs");
const path = require("node:path");

const FIRESTORE = (data) => `
const DB = ${data};
const S = (window.__offline = { listens: [], writes: [] });
export const getFirestore = () => ({}), initializeFirestore = () => ({});
export const persistentLocalCache = (o = {}) => ({ kind: "persistent", ...o }), persistentMultipleTabManager = () => ({}), memoryLocalCache = () => ({ kind: "memory" });
export const collection = (fs, name) => ({ name, cons: [] });
export const doc = (fs, ...segs) => { const p = segs.join("/").split("/"); return { c: p[0], id: p[1] }; };
export const query = (ref, ...cons) => ({ name: ref.name, cons: [...ref.cons, ...cons] });
export const orderBy = (f, dir = "asc") => ({ t: "o", f, dir }), limit = (n) => ({ t: "l", n });
export function onSnapshot(q, next) {
  let rows = Object.entries(DB[q.name] || {}).map(([id, d]) => ({ id, d }));
  for (const c of q.cons) {
    if (c.t === "o") rows.sort((a, b) => ((a.d[c.f] ?? 0) < (b.d[c.f] ?? 0) ? -1 : (a.d[c.f] ?? 0) > (b.d[c.f] ?? 0) ? 1 : 0) * (c.dir === "desc" ? -1 : 1));
    if (c.t === "l") rows = rows.slice(0, c.n);
  }
  S.listens.push({ name: q.name, limit: (q.cons.find((c) => c.t === "l") || {}).n ?? null, docs: rows.length });
  setTimeout(() => next({ size: rows.length, metadata: { fromCache: false }, docChanges: () => [],
    docs: rows.map((r) => ({ id: r.id, data: () => structuredClone(r.d) })) }));
  return () => {};
}
export const getDoc = async (r) => ({ id: r.id, exists: () => false, data: () => undefined });
const write = (op) => async (r, d) => { S.writes.push({ op, c: r.c ?? r.name, id: r.id ?? null }); return { id: "offline-" + S.writes.length }; };
export const addDoc = write("add"), setDoc = write("set"), updateDoc = write("update"), deleteDoc = write("delete");
`;
const APP = `export const initializeApp = (options) => ({ options });`;
const AUTH = `
export const getAuth = () => ({});
export class GoogleAuthProvider {}
export const signInWithPopup = async () => { throw new Error("offline: вход выключен"); }, signOut = async () => {};
export const onAuthStateChanged = (auth, cb) => { setTimeout(() => cb(null)); return () => {}; };
`;

async function offline(context, { fixture = path.join(__dirname, "fixture.json") } = {}) {
  const net = { blocked: 0, blockedUrls: [] };
  const data = JSON.stringify(JSON.parse(fs.readFileSync(fixture, "utf8")));
  const js = (body) => ({ status: 200, contentType: "text/javascript", headers: { "access-control-allow-origin": "*" }, body });
  const mods = { app: APP, auth: AUTH, firestore: FIRESTORE(data) };
  await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[^/]+\/firebase-(app|auth|firestore)\.js/, (r) =>
    r.fulfill(js(mods[r.request().url().match(/firebase-(app|auth|firestore)\.js/)[1]])));
  await context.route(/firestore\.googleapis\.com|identitytoolkit|securetoken|firebaseinstallations|firebase\.googleapis\.com/, (r) => {
    net.blocked++; net.blockedUrls.push(r.request().url().slice(0, 120)); return r.abort();
  });
  return net;
};

module.exports = offline;

if (require.main === module) {
  (async () => {
    const pw = (() => { for (const m of [process.env.PLAYWRIGHT_CORE, "playwright", "playwright-core"].filter(Boolean)) try { return require(m); } catch {} throw new Error("нет Playwright: задай PLAYWRIGHT_CORE=<путь к playwright-core>"); })();
    const [url, out] = process.argv.slice(2).filter((a, i, all) => !a.startsWith("--") && !(all[i - 1] || "").match(/^--(width|height)$/));
    const opt = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? Number(process.argv[i + 1]) : d; };
    if (!url || !out) { console.log("node offline.cjs <страница.html или URL> <снимок.png> [--width 390] [--height 844] [--dark] [--full]"); process.exit(1); }
    const browser = await pw.chromium.launch({ channel: process.env.PW_CHANNEL || "msedge" });
    const context = await browser.newContext({ viewport: { width: opt("--width", 390), height: opt("--height", 844) }, colorScheme: process.argv.includes("--dark") ? "dark" : "light" });
    const net = await offline(context);
    const page = await context.newPage();
    await page.goto(/^https?:|^file:/.test(url) ? url : "file:///" + path.resolve(url).replace(/\\/g, "/"));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: out, fullPage: process.argv.includes("--full") });
    console.log(JSON.stringify({ out, firestoreRequests: net.blocked, listens: await page.evaluate(() => window.__offline && window.__offline.listens) }));
    await browser.close();
  })().catch((e) => { console.error(e.message); process.exit(1); });
}
