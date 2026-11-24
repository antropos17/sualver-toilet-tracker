// Общий вход в базу трекера (Firestore проекта pyos-tracker) для скриптов kit, импорта и Telegram-бота.
// Ключ сервисного аккаунта ищется так: TRACKER_FIREBASE_KEY → GOOGLE_APPLICATION_CREDENTIALS → kit/firebase-key.json.
// Ключ — секрет: его содержимое никогда не печатается.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const kitDir = path.dirname(fileURLToPath(import.meta.url));
export const repoDir = path.dirname(kitDir);
export const shotsDir = path.join(repoDir, "shots");
export const TRACKER_URL = "https://antropos17.github.io/sualver-toilet-tracker/";
export const REPO = "antropos17/sualver-toilet-tracker";

export function keyPath() {
  return process.env.TRACKER_FIREBASE_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(kitDir, "firebase-key.json");
}

export function loadKey() {
  const p = keyPath();
  if (!fs.existsSync(p) || fs.statSync(p).size === 0)
    throw new Error(`нет ключа сервисного аккаунта: ${p} (пустой или отсутствует). Задай TRACKER_FIREBASE_KEY или положи ключ в kit/firebase-key.json`);
  let key;
  try { key = JSON.parse(fs.readFileSync(p, "utf8")); } catch { throw new Error(`ключ ${p} не читается как JSON`); }
  if (!key.private_key || !key.client_email) throw new Error(`в ${p} не ключ сервисного аккаунта`);
  return key;
}

let app;
export function firebaseApp() {
  if (!app) { const key = loadKey(); app = initializeApp({ credential: cert(key), projectId: key.project_id }); }
  return app;
}
export const openDb = () => getFirestore(firebaseApp());

// Все документы коллекции как [{ id, ...data }].
export async function readAll(db, collection) {
  const snap = await db.collection(collection).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
