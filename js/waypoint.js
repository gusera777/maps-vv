/**
 * waypoint.js
 * Modul V3 — Waypoint: definisi kategori & warna default, kompresi foto sebelum
 * disimpan ke IndexedDB, dan util pencarian. Penyimpanan sesungguhnya (CRUD)
 * ada di storage.js; render marker di peta ada di map.js; UI/alur ada di app.js.
 */
const GuseraWaypoint = (() => {
  const CATEGORIES = [
    { id: 'umum', label: 'Umum', color: '#8FA096' },
    { id: 'batas', label: 'Titik Batas', color: '#D98A3D' },
    { id: 'vegetasi', label: 'Pohon / Vegetasi', color: '#4C9A4C' },
    { id: 'sampel', label: 'Titik Sampel', color: '#3D82D9' },
    { id: 'bahaya', label: 'Bahaya', color: '#C1554A' },
    { id: 'camp', label: 'Camp / Basecamp', color: '#B98CD9' },
    { id: 'lainnya', label: 'Lainnya', color: '#7C9473' }
  ];

  function getCategory(id) {
    return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
  }

  /**
   * Ubah berkas foto menjadi data URL JPEG yang sudah dikecilkan, supaya hemat
   * ruang IndexedDB (foto kamera HP bisa 4-8 MB; hasil kompresi umumnya < 150 KB).
   * Semua diproses lokal lewat <canvas>, tidak pernah keluar perangkat.
   */
  function compressPhoto(file, maxDim = 900, quality = 0.72) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type || file.type.indexOf('image/') !== 0) {
        reject(new Error('Berkas bukan gambar.'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('Gagal membaca berkas.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Gagal memuat gambar.'));
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          try {
            resolve(canvas.toDataURL('image/jpeg', quality));
          } catch (e) {
            reject(e);
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /** Cocokkan waypoint dengan kata kunci pencarian (nama, deskripsi, kategori). */
  function matchesQuery(wp, query) {
    if (!query) return true;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (wp.name || '').toLowerCase().includes(q) ||
      (wp.description || '').toLowerCase().includes(q) ||
      getCategory(wp.category).label.toLowerCase().includes(q)
    );
  }

  return { CATEGORIES, getCategory, compressPhoto, matchesQuery };
})();
