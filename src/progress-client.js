export const PROGRESS_KEY = "ncf-thesis-checklist";

let progressStatus = { state: "idle", updatedAt: null };
const progressStatusListeners = new Set();
let saveQueue = Promise.resolve();

function setProgressStatus(state, updatedAt = null) {
  progressStatus = { state, updatedAt };
  for (const listener of progressStatusListeners) listener(progressStatus);
}

export function getProgressStatus() {
  return { ...progressStatus };
}

export function subscribeProgressStatus(listener) {
  progressStatusListeners.add(listener);
  return () => progressStatusListeners.delete(listener);
}

function validItems(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length <= 64 &&
    entries.every(([key, checked]) => /^\d{1,2}-\d{1,2}$/.test(key) && typeof checked === "boolean")
  );
}

export async function loadProgress() {
  setProgressStatus("loading");
  try {
    const response = await fetch("/api/progress", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Progress could not be loaded");
    const payload = await response.json();
    if (!payload || !validItems(payload.items)) throw new Error("Invalid progress response");
    setProgressStatus("saved", payload.updatedAt || null);
    return payload.items;
  } catch (error) {
    setProgressStatus("load-error");
    throw error;
  }
}

async function performSave(items) {
  setProgressStatus("saving");
  try {
    const response = await fetch("/api/progress", {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!response.ok) throw new Error("Progress could not be saved");
    const payload = await response.json().catch(() => ({}));
    setProgressStatus("saved", payload.updatedAt || new Date().toISOString());
    return payload;
  } catch (error) {
    setProgressStatus("save-error");
    throw error;
  }
}

export function saveProgress(items) {
  if (!validItems(items)) throw new Error("Invalid progress document");
  const pendingSave = saveQueue.catch(() => {}).then(() => performSave(items));
  saveQueue = pendingSave;
  return pendingSave;
}

export function installProgressSync(storage = localStorage, delay = 400) {
  const nativeSetItem = Storage.prototype.setItem;
  let timer;
  Storage.prototype.setItem = function setItem(key, value) {
    nativeSetItem.call(this, key, value);
    if (this !== storage || key !== PROGRESS_KEY) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        const items = JSON.parse(value);
        void saveProgress(items).catch(() => {});
      } catch {
        // The imported dashboard owns this cache. Invalid cache writes are ignored.
      }
    }, delay);
  };
}
