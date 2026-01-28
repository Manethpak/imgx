import type { ImageData as AppImageData } from "../types/types";

const DB_NAME = "imgx_recents";
const STORE_NAME = "images";
const MAX_RECENTS = 10;

export interface RecentImage {
  id: string;
  name: string;
  dataUrl: string;
  thumbnailDataUrl?: string;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function getRecentImages(): Promise<RecentImage[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
    request.onsuccess = () => {
      db.close();
      const items = (request.result as RecentImage[]).sort(
        (a, b) => b.createdAt - a.createdAt
      );
      resolve(items);
    };
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function createThumbnail(dataUrl: string, maxSize = 120): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function addRecentImage(image: AppImageData): Promise<void> {
  const dataUrl = await fileToDataUrl(image.file);
  const thumbnailDataUrl = await createThumbnail(dataUrl);
  const id = crypto.randomUUID();
  const name = image.file.name || "image";
  const record: RecentImage = {
    id,
    name,
    dataUrl,
    thumbnailDataUrl,
    createdAt: Date.now(),
  };

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.add(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();

  const all = await getRecentImages();
  if (all.length <= MAX_RECENTS) return;
  const toRemove = all.slice(MAX_RECENTS);
  const db2 = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx2 = db2.transaction(STORE_NAME, "readwrite");
    const store2 = tx2.objectStore(STORE_NAME);
    toRemove.forEach((r) => store2.delete(r.id));
    tx2.oncomplete = () => resolve();
    tx2.onerror = () => reject(tx2.error);
  });
  db2.close();
}

export async function clearRecents(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
