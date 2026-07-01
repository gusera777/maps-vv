/**
 * pdfmap.js (V4 — menggantikan mbtiles.js)
 * Membaca berkas .pdf peta lapangan langsung di browser memakai PDF.js,
 * lalu me-render halaman terpilih menjadi gambar raster (PNG) yang dipakai
 * sebagai overlay di atas peta Leaflet. Tidak ada data yang dikirim keluar
 * perangkat — semua rendering terjadi lokal lewat <canvas>.
 *
 * Konsep "GeoPDF": jika PDF sudah memiliki georeferensi asli, parsingnya
 * kompleks dan berbeda-beda tiap penerbit. Untuk kesederhanaan & keandalan
 * offline, GUSERA Maps memakai pendekatan kalibrasi 2-titik manual (lihat
 * map.js: pixelForLatLng / applyCalibration di app.js) — pengguna menandai
 * dua titik pada citra PDF dan memasukkan koordinat GPS sesungguhnya.
 * Setelah dikalibrasi, PDF berperilaku seperti GeoPDF sesungguhnya.
 */
const GuseraPDF = (() => {
  let libReady = null;

  /** Pastikan pdf.js sudah siap (worker terpasang) sebelum dipakai. */
  function ensureLib() {
    if (!libReady) {
      libReady = new Promise((resolve, reject) => {
        if (!window.pdfjsLib) {
          reject(new Error('Pustaka PDF.js gagal dimuat.'));
          return;
        }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      });
    }
    return libReady;
  }

  /** Muat dokumen PDF dari ArrayBuffer. Mengembalikan { doc, numPages }. */
  async function loadDocument(arrayBuffer) {
    const pdfjsLib = await ensureLib();
    const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return { doc, numPages: doc.numPages };
  }

  /**
   * Render satu halaman PDF menjadi PNG blob + ukuran pikselnya.
   * targetMaxDim membatasi resolusi terpanjang (menjaga ukuran berkas &
   * performa render tetap wajar untuk peta lapangan di HP/tablet).
   */
  async function renderPageToBlob(doc, pageNum, targetMaxDim = 2200) {
    const page = await doc.getPage(pageNum);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(targetMaxDim / Math.max(base.width, base.height), 4);
    const viewport = page.getViewport({ scale: Math.max(scale, 0.1) });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');
    // Latar putih dulu — banyak PDF peta punya area transparan di tepi.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    return { blob, pixelWidth: canvas.width, pixelHeight: canvas.height };
  }

  /** Render thumbnail kecil untuk pratinjau di modal impor / pemilih halaman. */
  async function renderPageThumbnail(doc, pageNum, maxDim = 380) {
    const { blob } = await renderPageToBlob(doc, pageNum, maxDim);
    return URL.createObjectURL(blob);
  }

  return { loadDocument, renderPageToBlob, renderPageThumbnail };
})();
