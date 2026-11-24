import type { SemesterBundle } from './tluSchedule';
import {
  DEFAULT_COMPANION_PREFS,
  type CompanionPreferences,
} from './companionScript';

const DB_NAME = 'tlu_lich_hoc_offline_v1';
const DB_VERSION = 1;
const STORE_BUNDLES = 'semesters';
const STORE_META = 'meta';

const FALLBACK_BUNDLES_KEY = 'tlu_lich_hoc_bundles_v1';
const FALLBACK_ACTIVE_KEY = 'tlu_lich_hoc_active_sem_v1';
const FALLBACK_NOTES_KEY = 'tlu_lich_hoc_notes_v1';
const THEME_KEY = 'tlu_lich_hoc_theme_v1';

export type ThemePreference = 'light' | 'dark';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_BUNDLES)) {
        db.createObjectStore(STORE_BUNDLES, { keyPath: 'semesterId' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
  });
}

function readFallbackBundles(): SemesterBundle[] {
  try {
    const raw = localStorage.getItem(FALLBACK_BUNDLES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SemesterBundle[]) : [];
  } catch {
    return [];
  }
}

function writeFallbackBundles(bundles: SemesterBundle[]): void {
  try {
    localStorage.setItem(FALLBACK_BUNDLES_KEY, JSON.stringify(bundles));
  } catch {
    // Ignore storage quota errors in fallback
  }
}

export async function loadOfflineSemesters(): Promise<{
  bundles: SemesterBundle[];
  activeSemesterId: string | null;
  notes: Record<string, string>;
}> {
  try {
    const db = await openDb();
    const tx = db.transaction([STORE_BUNDLES, STORE_META], 'readonly');
    const bundlesReq = tx.objectStore(STORE_BUNDLES).getAll();
    const activeReq = tx.objectStore(STORE_META).get('activeSemesterId');
    const notesReq = tx.objectStore(STORE_META).get('courseNotes');

    const [bundles, activeRecord, notesRecord] = await Promise.all([
      new Promise<SemesterBundle[]>((res, rej) => {
        bundlesReq.onsuccess = () => res((bundlesReq.result as SemesterBundle[]) || []);
        bundlesReq.onerror = () => rej(bundlesReq.error);
      }),
      new Promise<{ key: string; value: string } | undefined>((res, rej) => {
        activeReq.onsuccess = () => res(activeReq.result as { key: string; value: string } | undefined);
        activeReq.onerror = () => rej(activeReq.error);
      }),
      new Promise<{ key: string; value: Record<string, string> } | undefined>((res, rej) => {
        notesReq.onsuccess = () =>
          res(notesReq.result as { key: string; value: Record<string, string> } | undefined);
        notesReq.onerror = () => rej(notesReq.error);
      }),
    ]);

    db.close();
    const sorted = [...bundles].sort((a, b) => b.downloadedAt.localeCompare(a.downloadedAt));
    return {
      bundles: sorted,
      activeSemesterId: activeRecord?.value ?? sorted[0]?.semesterId ?? null,
      notes: notesRecord?.value ?? {},
    };
  } catch {
    const bundles = readFallbackBundles();
    let notes: Record<string, string> = {};
    try {
      notes = JSON.parse(localStorage.getItem(FALLBACK_NOTES_KEY) || '{}') as Record<string, string>;
    } catch {
      notes = {};
    }
    const activeSemesterId = localStorage.getItem(FALLBACK_ACTIVE_KEY) ?? bundles[0]?.semesterId ?? null;
    return { bundles, activeSemesterId, notes };
  }
}

export async function saveOfflineSemester(bundle: SemesterBundle): Promise<void> {
  // Always mirror to localStorage fallback for extra durability
  const existingFallback = readFallbackBundles().filter((b) => b.semesterId !== bundle.semesterId);
  writeFallbackBundles([bundle, ...existingFallback]);
  try {
    localStorage.setItem(FALLBACK_ACTIVE_KEY, bundle.semesterId);
  } catch {
    // Ignore
  }

  try {
    const db = await openDb();
    const tx = db.transaction([STORE_BUNDLES, STORE_META], 'readwrite');
    tx.objectStore(STORE_BUNDLES).put(bundle);
    tx.objectStore(STORE_META).put({ key: 'activeSemesterId', value: bundle.semesterId });
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch {
    // Fallback already saved
  }
}

export async function setActiveOfflineSemester(semesterId: string | null): Promise<void> {
  try {
    if (semesterId) {
      localStorage.setItem(FALLBACK_ACTIVE_KEY, semesterId);
    } else {
      localStorage.removeItem(FALLBACK_ACTIVE_KEY);
    }
  } catch {
    // Ignore
  }

  try {
    const db = await openDb();
    const tx = db.transaction([STORE_META], 'readwrite');
    if (semesterId) {
      tx.objectStore(STORE_META).put({ key: 'activeSemesterId', value: semesterId });
    } else {
      tx.objectStore(STORE_META).delete('activeSemesterId');
    }
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch {
    // Ignore
  }
}

export async function deleteOfflineSemester(semesterId: string): Promise<void> {
  const remaining = readFallbackBundles().filter((b) => b.semesterId !== semesterId);
  writeFallbackBundles(remaining);

  try {
    const db = await openDb();
    const tx = db.transaction([STORE_BUNDLES], 'readwrite');
    tx.objectStore(STORE_BUNDLES).delete(semesterId);
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch {
    // Ignore
  }
}

export async function saveCourseNote(courseKey: string, note: string): Promise<Record<string, string>> {
  const current = (await loadOfflineSemesters()).notes;
  const next = { ...current };
  const trimmed = note.trim();
  if (trimmed) {
    next[courseKey] = trimmed;
  } else {
    delete next[courseKey];
  }

  try {
    localStorage.setItem(FALLBACK_NOTES_KEY, JSON.stringify(next));
  } catch {
    // Ignore
  }

  try {
    const db = await openDb();
    const tx = db.transaction([STORE_META], 'readwrite');
    tx.objectStore(STORE_META).put({ key: 'courseNotes', value: next });
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch {
    // Ignore
  }

  return next;
}

const COMPANION_KEY = 'tlu_lich_hoc_companion_v1';

export function loadThemePreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Ignore
  }
  return 'light';
}

export function saveThemePreference(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore
  }
}

export function loadCompanionPreferences(): CompanionPreferences {
  try {
    const raw = localStorage.getItem(COMPANION_KEY);
    if (!raw) return DEFAULT_COMPANION_PREFS;
    const parsed = JSON.parse(raw) as Partial<CompanionPreferences>;
    return {
      nickname:
        typeof parsed.nickname === 'string' && parsed.nickname.trim()
          ? parsed.nickname
          : DEFAULT_COMPANION_PREFS.nickname,
      companionName:
        typeof parsed.companionName === 'string' && parsed.companionName.trim()
          ? parsed.companionName
          : DEFAULT_COMPANION_PREFS.companionName,
      personality: parsed.personality === 'bestie' ? 'bestie' : 'sweet',
      showStickers: parsed.showStickers !== false,
      heartsCount:
        typeof parsed.heartsCount === 'number' && Number.isFinite(parsed.heartsCount)
          ? Math.max(0, Math.floor(parsed.heartsCount))
          : 0,
    };
  } catch {
    return DEFAULT_COMPANION_PREFS;
  }
}

export function saveCompanionPreferences(prefs: CompanionPreferences): void {
  try {
    localStorage.setItem(COMPANION_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore
  }
}
