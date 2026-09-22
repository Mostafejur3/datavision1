// Media Storage Abstraction Layer
// Currently uses localStorage + base64. When you connect your own database,
// swap this layer to use your API endpoints. All components use this interface.

export interface MediaItem {
  id: string;
  type: "image" | "video" | "file";
  name: string;
  url: string; // base64 data URI now, will be server URL later
  thumbnail?: string;
  size: number;
  createdAt: string;
}

export interface MediaCollection {
  entityType: "service" | "portfolio";
  entityId: string;
  items: MediaItem[];
}

const STORAGE_KEY = "media_collections";

function getAll(): MediaCollection[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveAll(collections: MediaCollection[]): boolean {
  try {
    const data = JSON.stringify(collections);
    localStorage.setItem(STORAGE_KEY, data);
    return true;
  } catch (e) {
    console.error("Failed to save media (storage full):", e);
    return false;
  }
}

export function getMedia(entityType: string, entityId: string): MediaItem[] {
  const collections = getAll();
  const found = collections.find(c => c.entityType === entityType && c.entityId === entityId);
  return found?.items || [];
}

export function saveMedia(entityType: string, entityId: string, items: MediaItem[]): boolean {
  const collections = getAll();
  const idx = collections.findIndex(c => c.entityType === entityType && c.entityId === entityId);
  const entry: MediaCollection = { entityType: entityType as "service" | "portfolio", entityId, items };
  if (idx >= 0) {
    collections[idx] = entry;
  } else {
    collections.push(entry);
  }
  return saveAll(collections);
}

export function deleteMediaCollection(entityType: string, entityId: string) {
  const collections = getAll().filter(c => !(c.entityType === entityType && c.entityId === entityId));
  saveAll(collections);
}

export function fileToMediaItem(file: File): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const type: MediaItem["type"] = file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("image/")
        ? "image"
        : "file";
      resolve({
        id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        name: file.name,
        url: reader.result as string,
        size: file.size,
        createdAt: new Date().toISOString(),
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
