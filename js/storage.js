/**
 * storage.js
 * Lapisan penyimpanan lokal (IndexedDB) untuk GUSERA Maps.
 * Semua data (berkas peta PDF, waypoint, dan sekarang track) disimpan di
 * perangkat, tidak pernah dikirim ke server manapun.
 *
 * Struktur logis:
 *   maps       -> { id, name, sizeBytes, addedAt, pdfBlob, pageNum, numPages,
 *                   pixelWidth, pixelHeight, imageBlob, calibration, geoBounds }
 *                 (V4: diganti dari MBTiles ke PDF — lihat pdfmap.js)
 *   waypoints  -> { id, name, category, color, description, photo, lat, lng, createdAt, updatedAt }
 *   tracks     -> { id, name, points[], distanceM, durationMs, startedAt, endedAt } (baru di V4)
 */
const GuseraStorage = (() => {
  const DB_NAME = 'gusera-maps';
  const DB_VERSION = 3;
  const STORE_MAPS = 'maps';
  const STORE_WAYPOINTS = 'waypoints';
  const STORE_TRACKS = 'tracks';

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_MAPS)) {
          const store = db.createObjectStore(STORE_MAPS, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_WAYPOINTS)) {
          const wpStore = db.createObjectStore(STORE_WAYPOINTS, { keyPath: 'id' });
          wpStore.createIndex('name', 'name', { unique: false });
          wpStore.createIndex('category', 'category', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_TRACKS)) {
          const trStore = db.createObjectStore(STORE_TRACKS, { keyPath: 'id' });
          trStore.createIndex('name', 'name', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function tx(storeName, mode) {
    const db = await openDB();
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  return {
    // ---------- Peta PDF ----------

    /** Simpan sebuah peta (blob PDF + gambar hasil render + metadata). */
    async saveMap(record) {
      const store = await tx(STORE_MAPS, 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.put(record);
        req.onsuccess = () => resolve(record);
        req.onerror = () => reject(req.error);
      });
    },

    /** Ambil daftar semua peta tersimpan (tanpa blob berat, agar ringan ditampilkan di daftar). */
    async listMaps() {
      const store = await tx(STORE_MAPS, 'readonly');
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => {
          const all = req.result || [];
          resolve(all.map(({ pdfBlob, imageBlob, ...meta }) => meta).sort((a, b) => a.name.localeCompare(b.name)));
        };
        req.onerror = () => reject(req.error);
      });
    },

    /** Ambil satu peta lengkap dengan blob-nya, berdasarkan id. */
    async getMap(id) {
      const store = await tx(STORE_MAPS, 'readonly');
      return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    },

    /** Hapus peta dari penyimpanan lokal. */
    async deleteMap(id) {
      const store = await tx(STORE_MAPS, 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    },

    /** Perkiraan total ruang yang dipakai (untuk panel Manajemen Data pada V8). */
    async estimateUsage() {
      if (navigator.storage && navigator.storage.estimate) {
        return navigator.storage.estimate();
      }
      return { usage: null, quota: null };
    },

    // ---------- Waypoint (V3) ----------

    async saveWaypoint(record) {
      const store = await tx(STORE_WAYPOINTS, 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.put(record);
        req.onsuccess = () => resolve(record);
        req.onerror = () => reject(req.error);
      });
    },

    async listWaypoints() {
      const store = await tx(STORE_WAYPOINTS, 'readonly');
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => {
          const all = req.result || [];
          resolve(all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
        };
        req.onerror = () => reject(req.error);
      });
    },

    async getWaypoint(id) {
      const store = await tx(STORE_WAYPOINTS, 'readonly');
      return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    },

    async deleteWaypoint(id) {
      const store = await tx(STORE_WAYPOINTS, 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    },

    // ---------- Track (V4, baru) ----------

    /** Simpan satu hasil rekaman track (rangkaian titik + ringkasannya). */
    async saveTrack(record) {
      const store = await tx(STORE_TRACKS, 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.put(record);
        req.onsuccess = () => resolve(record);
        req.onerror = () => reject(req.error);
      });
    },

    /** Ambil daftar semua track tersimpan, terbaru lebih dulu. */
    async listTracks() {
      const store = await tx(STORE_TRACKS, 'readonly');
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => {
          const all = req.result || [];
          resolve(all.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0)));
        };
        req.onerror = () => reject(req.error);
      });
    },

    async getTrack(id) {
      const store = await tx(STORE_TRACKS, 'readonly');
      return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    },

    async deleteTrack(id) {
      const store = await tx(STORE_TRACKS, 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    }
  };
})();
