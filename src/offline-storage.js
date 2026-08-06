const DATABASE_NAME = "facts-offline-v1";
const DATABASE_VERSION = 1;
const BACKGROUND_STORE = "card-backgrounds";
const MAXIMUM_IMAGE_BYTES = 8 * 1024 * 1024;
const IMPORT_TIMEOUT_MS = 15_000;
const DECK_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function saveCardBackground(deckId, blob) {
  validateDeckId(deckId);
  validateImageBlob(blob);
  const database = await openDatabase();
  try {
    await runTransaction(database, "readwrite", (store) => store.put({ deckId, blob, updatedAt: Date.now() }));
  } catch (error) {
    if (error?.name === "QuotaExceededError") throw new Error("The background could not be saved because offline storage is full.");
    throw new Error(`The background could not be saved: ${error?.message ?? "unknown storage error"}`);
  } finally {
    database.close();
  }
}

export async function getCardBackground(deckId) {
  validateDeckId(deckId);
  const database = await openDatabase();
  try {
    const record = await runTransaction(database, "readonly", (store) => store.get(deckId));
    const blob = record?.blob;
    if (!blob) return null;
    validateImageBlob(blob);
    return blob;
  } finally {
    database.close();
  }
}

export async function deleteCardBackground(deckId) {
  validateDeckId(deckId);
  const database = await openDatabase();
  try {
    await runTransaction(database, "readwrite", (store) => store.delete(deckId));
  } finally {
    database.close();
  }
}

export async function importBackgroundFromUrl(deckId, url) {
  validateDeckId(deckId);
  let parsed;
  try {
    parsed = new URL(url, window.location.href);
  } catch {
    throw new Error("Enter a valid image URL.");
  }
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("Use an http or https image URL.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMPORT_TIMEOUT_MS);
  try {
    const response = await fetch(parsed.href, {
      mode: "cors",
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Image request failed with status ${response.status}.`);
    const declaredSize = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredSize) && declaredSize > MAXIMUM_IMAGE_BYTES) {
      throw new Error("The image is larger than the 8 MB offline limit.");
    }
    const blob = await response.blob();
    validateImageBlob(blob);
    await saveCardBackground(deckId, blob);
    return blob;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("The image request timed out.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function validateDeckId(deckId) {
  if (typeof deckId !== "string" || !DECK_ID_PATTERN.test(deckId)) throw new Error("The topic id is invalid.");
}

function validateImageBlob(blob) {
  if (!(blob instanceof Blob)) throw new TypeError("Background must be stored as a Blob.");
  if (!blob.type?.toLowerCase().startsWith("image/")) throw new Error("Choose a valid image file.");
  if (!blob.size) throw new Error("The image file is empty.");
  if (blob.size > MAXIMUM_IMAGE_BYTES) throw new Error("The image is larger than the 8 MB offline limit.");
}

function openDatabase() {
  if (!("indexedDB" in globalThis)) return Promise.reject(new Error("Offline image storage is not supported in this browser."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Offline storage could not be opened."));
    request.onblocked = () => reject(new Error("Offline storage is blocked by another open version of the app."));
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
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
    let request;
    let settled = false;
    const transaction = database.transaction(BACKGROUND_STORE, mode);
    const store = transaction.objectStore(BACKGROUND_STORE);

    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error ?? new Error("Offline storage operation failed."));
    };

    try {
      request = operation(store);
      if (request) request.onerror = () => fail(request.error);
    } catch (error) {
      transaction.abort();
      fail(error);
      return;
    }

    transaction.oncomplete = () => {
      if (settled) return;
      settled = true;
      resolve(request?.result);
    };
    transaction.onerror = () => fail(transaction.error ?? request?.error);
    transaction.onabort = () => fail(transaction.error ?? new Error("Storage transaction was aborted."));
  });
}
