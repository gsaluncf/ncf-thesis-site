export const PROGRESS_KEY = "ncf-thesis-checklist";

function validItems(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length <= 64 &&
    entries.every(([key, checked]) => /^\d{1,2}-\d{1,2}$/.test(key) && typeof checked === "boolean")
  );
}

export async function loadProgress() {
  const response = await fetch("/api/progress", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Progress could not be loaded");
  const payload = await response.json();
  if (!payload || !validItems(payload.items)) throw new Error("Invalid progress response");
  return payload.items;
}

export async function saveProgress(items) {
  if (!validItems(items)) throw new Error("Invalid progress document");
  const response = await fetch("/api/progress", {
    method: "PUT",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!response.ok) throw new Error("Progress could not be saved");
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
