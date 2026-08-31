/**
 * Presets y baseline de «Hero diseño web completa» en IndexedDB (cuota ~50 MB+ típica),
 * con migración automática desde localStorage para no seguir llenando el techo ~5 MB.
 *
 * Claves LS (mismas que en checkoutVisualPresets.ts).
 */
const LS_KEY_PRESETS = "maikaCheckoutVisualPresets";
const LS_KEY_BASELINE = "maikaCheckoutVisualRestoreBaseline";

const DB_NAME = "maikaCheckoutVisual";
const DB_VERSION = 1;
const STORE = "kv";

const IDB_KEY_PRESETS = "presetsListJson";
const IDB_KEY_BASELINE = "restoreBaselineJson";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB no disponible"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IDB open"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
  return dbPromise;
}

async function idbGet(key: string): Promise<string | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const r = tx.objectStore(STORE).get(key);
    r.onsuccess = () => resolve(r.result as string | undefined);
    r.onerror = () => reject(r.error);
  });
}

async function idbPut(key: string, value: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IDB put"));
  });
}

async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore */
  }
}

let migracionEjecutada = false;

/** Copia datos grandes de LS → IDB y borra las claves en LS para liberar cuota. */
async function migrarDesdeLocalStorageSiHaceFalta(): Promise<void> {
  if (migracionEjecutada) return;
  migracionEjecutada = true;
  if (typeof indexedDB === "undefined") return;
  try {
    const [presetsIdb, baselineIdb] = await Promise.all([
      idbGet(IDB_KEY_PRESETS),
      idbGet(IDB_KEY_BASELINE)
    ]);
    let lsPresets: string | null = null;
    let lsBaseline: string | null = null;
    try {
      lsPresets = localStorage.getItem(LS_KEY_PRESETS);
    } catch {
      /* ignore */
    }
    try {
      lsBaseline = localStorage.getItem(LS_KEY_BASELINE);
    } catch {
      /* ignore */
    }
    if (!presetsIdb && lsPresets) {
      await idbPut(IDB_KEY_PRESETS, lsPresets);
      try {
        localStorage.removeItem(LS_KEY_PRESETS);
      } catch {
        /* ignore */
      }
    }
    if (!baselineIdb && lsBaseline) {
      await idbPut(IDB_KEY_BASELINE, lsBaseline);
      try {
        localStorage.removeItem(LS_KEY_BASELINE);
      } catch {
        /* ignore */
      }
    }
  } catch {
    migracionEjecutada = false;
  }
}

export async function storageLeerPresetsJson(): Promise<string | null> {
  await migrarDesdeLocalStorageSiHaceFalta();
  try {
    if (typeof indexedDB !== "undefined") {
      const v = await idbGet(IDB_KEY_PRESETS);
      if (v != null && v !== "") return v;
    }
  } catch {
    /* fallback LS */
  }
  try {
    return localStorage.getItem(LS_KEY_PRESETS);
  } catch {
    return null;
  }
}

export async function storageEscribirPresetsJson(json: string): Promise<{ ok: true } | { ok: false; error: unknown }> {
  await migrarDesdeLocalStorageSiHaceFalta();
  if (typeof indexedDB !== "undefined") {
    try {
      await idbPut(IDB_KEY_PRESETS, json);
      try {
        localStorage.removeItem(LS_KEY_PRESETS);
      } catch {
        /* ignore */
      }
      return { ok: true };
    } catch {
      try {
        localStorage.setItem(LS_KEY_PRESETS, json);
        return { ok: true };
      } catch (e2) {
        return { ok: false, error: e2 };
      }
    }
  }
  try {
    localStorage.setItem(LS_KEY_PRESETS, json);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

export async function storageLeerBaselineJson(): Promise<string | null> {
  await migrarDesdeLocalStorageSiHaceFalta();
  try {
    if (typeof indexedDB !== "undefined") {
      const v = await idbGet(IDB_KEY_BASELINE);
      if (v != null && v !== "") return v;
    }
  } catch {
    /* fallback */
  }
  try {
    return localStorage.getItem(LS_KEY_BASELINE);
  } catch {
    return null;
  }
}

export async function storageEscribirBaselineJson(json: string): Promise<{ ok: true } | { ok: false; error: unknown }> {
  await migrarDesdeLocalStorageSiHaceFalta();
  if (typeof indexedDB !== "undefined") {
    try {
      await idbPut(IDB_KEY_BASELINE, json);
      try {
        localStorage.removeItem(LS_KEY_BASELINE);
      } catch {
        /* ignore */
      }
      return { ok: true };
    } catch {
      try {
        localStorage.setItem(LS_KEY_BASELINE, json);
        try {
          localStorage.setItem("maikaCheckoutVisualRestoreBaselineMigrated", "1");
        } catch {
          /* ignore */
        }
        return { ok: true };
      } catch (e2) {
        return { ok: false, error: e2 };
      }
    }
  }
  try {
    localStorage.setItem(LS_KEY_BASELINE, json);
    try {
      localStorage.setItem("maikaCheckoutVisualRestoreBaselineMigrated", "1");
    } catch {
      /* ignore */
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

export async function storageBorrarBaseline(): Promise<void> {
  await idbDelete(IDB_KEY_BASELINE);
  try {
    localStorage.removeItem(LS_KEY_BASELINE);
  } catch {
    /* ignore */
  }
}
