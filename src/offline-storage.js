const DATABASE_NAME = "facts-offline-v1";
const DATABASE_VERSION = 1;
const BACKGROUND_STORE = "card-backgrounds";

export async function saveCardBackground(deckId, blob) {
  if (!(blob instanceof Blob)) throw new TypeError("Background must be stored as a Blob.");
  const database = await openDatabase();
  await runTransaction(database, "readwrite", (store) => store.put({ deckId, blob, updatedAt: Date.now() }));
}

export async function getCardBackground(deckId) {
  const database = await openDatabase();
  const record = await runTransaction(database, "readonly", (store) => store.get(deckId));
  return record?.blob ?? null;
}

export async function deleteCardBackground(deckId) {
  const database = await openDatabase();
  await runTransaction(database, "readwrite", (store) => store.delete(deckId));
}

export async function importBackgroundFromUrl(deckId, url) {
  const parsed = new URL(url, window.location.href);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("Use an http or https image URL.");
  const response = await fetch(parsed.href, { mode: "cors", cache: "no-store" });
  if (!response.ok) throw new Error(`Image request failed with status ${response.status}.`);
  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) throw new Error("The URL did not return an image.");
  await saveCardBackground(deckId, blob);
  return blob;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(BACKGROUND_STORE)) {
        database.createObjectStore(BACKGROUND_STORE, { keyPath: "deckId" });
      }
    };
  });
}

function runTransaction(database, mode, operation) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(BACKGROUND_STORE, mode);
    const store = transaction.objectStore(BACKGROUND_STORE);
    const request = operation(store);

    transaction.oncomplete = () => resolve(request?.result);
    transaction.onerror = () => reject(transaction.error ?? request?.error);
    transaction.onabort = () => reject(transaction.error ?? new Error("Storage transaction was aborted."));
  });
}
