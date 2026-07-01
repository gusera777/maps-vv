/**
 * app.js
 * Menghubungkan storage.js (IndexedDB), pdfmap.js (pembaca & perender PDF),
 * dan map.js (peta Leaflet) ke antarmuka pengguna GUSERA Maps.
 * V4: alur impor MBTiles diganti alur impor PDF (dengan pemilih halaman),
 * ditambah alur kalibrasi 2-titik, dan modul Track Recorder baru.
 */
(function () {
  const mapListEl = document.getElementById('mapList');
  const btnAddMap = document.getElementById('btnAddMap');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalCancel = document.getElementById('modalCancel');
  const modalImport = document.getElementById('modalImport');
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const modalProgress = document.getElementById('modalProgress');
  const pdfPreview = document.getElementById('pdfPreview');
  const pdfPreviewImg = document.getElementById('pdfPreviewImg');
  const pdfPageSelect = document.getElementById('pdfPageSelect');
  const mapPlaceholder = document.getElementById('mapPlaceholder');
  const stLat = document.getElementById('stLat');
  const stLon = document.getElementById('stLon');
  const stZoom = document.getElementById('stZoom');
  const stActiveMap = document.getElementById('stActiveMap');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarScrim = document.getElementById('sidebarScrim');
  const splash = document.getElementById('splash');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const btnGps = document.getElementById('btnGps');
  const btnFollow = document.getElementById('btnFollow');
  const btnCalibrate = document.getElementById('btnCalibrate');
  const calibrateHint = document.getElementById('calibrateHint');
  const calibrateHintText = document.getElementById('calibrateHintText');
  const calibrateCancel = document.getElementById('calibrateCancel');
  const gpsPanel = document.getElementById('gpsPanel');
  const compassNeedle = document.getElementById('compassNeedle');
  const gpsHeadingText = document.getElementById('gpsHeadingText');
  const gpsLat = document.getElementById('gpsLat');
  const gpsLon = document.getElementById('gpsLon');
  const gpsAccuracy = document.getElementById('gpsAccuracy');
  const gpsAltitude = document.getElementById('gpsAltitude');
  const gpsBearing = document.getElementById('gpsBearing');
  const gpsSpeed = document.getElementById('gpsSpeed');
  const gpsStatusMsg = document.getElementById('gpsStatusMsg');

  // ---------- Waypoint DOM refs ----------
  const tabMaps = document.getElementById('tabMaps');
  const tabWaypoints = document.getElementById('tabWaypoints');
  const tabTracks = document.getElementById('tabTracks');
  const paneMaps = document.getElementById('paneMaps');
  const paneWaypoints = document.getElementById('paneWaypoints');
  const paneTracks = document.getElementById('paneTracks');
  const waypointList = document.getElementById('waypointList');
  const wpSearch = document.getElementById('wpSearch');
  const btnAddWaypoint = document.getElementById('btnAddWaypoint');
  const btnAddWaypointFab = document.getElementById('btnAddWaypointFab');
  const placementHint = document.getElementById('placementHint');
  const placementCancel = document.getElementById('placementCancel');
  const stWaypointCount = document.getElementById('stWaypointCount');

  const wpModalBackdrop = document.getElementById('wpModalBackdrop');
  const wpModalTitle = document.getElementById('wpModalTitle');
  const wpLat = document.getElementById('wpLat');
  const wpLon = document.getElementById('wpLon');
  const wpUseGps = document.getElementById('wpUseGps');
  const wpName = document.getElementById('wpName');
  const wpCategoryGrid = document.getElementById('wpCategoryGrid');
  const wpColor = document.getElementById('wpColor');
  const wpDesc = document.getElementById('wpDesc');
  const wpPhotoDrop = document.getElementById('wpPhotoDrop');
  const wpPhotoInput = document.getElementById('wpPhotoInput');
  const wpPhotoPreview = document.getElementById('wpPhotoPreview');
  const wpPhotoPlaceholder = document.getElementById('wpPhotoPlaceholder');
  const wpPhotoRemove = document.getElementById('wpPhotoRemove');
  const wpBtnDelete = document.getElementById('wpBtnDelete');
  const wpCancel = document.getElementById('wpCancel');
  const wpSave = document.getElementById('wpSave');

  // ---------- Kalibrasi (V4) DOM refs ----------
  const calModalBackdrop = document.getElementById('calModalBackdrop');
  const calModalTitle = document.getElementById('calModalTitle');
  const calLat = document.getElementById('calLat');
  const calLon = document.getElementById('calLon');
  const calUseGps = document.getElementById('calUseGps');
  const calCancel = document.getElementById('calCancel');
  const calConfirm = document.getElementById('calConfirm');

  // ---------- Track (V4) DOM refs ----------
  const btnTrack = document.getElementById('btnTrack');
  const trackPanel = document.getElementById('trackPanel');
  const trackStatusPill = document.getElementById('trackStatusPill');
  const trJarak = document.getElementById('trJarak');
  const trWaktu = document.getElementById('trWaktu');
  const trKecepatan = document.getElementById('trKecepatan');
  const trBtnStart = document.getElementById('trBtnStart');
  const trBtnPause = document.getElementById('trBtnPause');
  const trBtnResume = document.getElementById('trBtnResume');
  const trBtnStop = document.getElementById('trBtnStop');
  const trStatusMsg = document.getElementById('trStatusMsg');
  const trModalBackdrop = document.getElementById('trModalBackdrop');
  const trName = document.getElementById('trName');
  const trModalJarak = document.getElementById('trModalJarak');
  const trModalWaktu = document.getElementById('trModalWaktu');
  const trDiscard = document.getElementById('trDiscard');
  const trSave = document.getElementById('trSave');
  const trackList = document.getElementById('trackList');

  // ---------- Ukur / Measure (V5) DOM refs ----------
  const btnMeasure = document.getElementById('btnMeasure');
  const measureHint = document.getElementById('measureHint');
  const measureHintText = document.getElementById('measureHintText');
  const measureCancel = document.getElementById('measureCancel');
  const measurePanel = document.getElementById('measurePanel');
  const measureClose = document.getElementById('measureClose');
  const mModeDistance = document.getElementById('mModeDistance');
  const mModeArea = document.getElementById('mModeArea');
  const mModeBearing = document.getElementById('mModeBearing');
  const measureReadoutDistance = document.getElementById('measureReadoutDistance');
  const measureReadoutArea = document.getElementById('measureReadoutArea');
  const measureReadoutBearing = document.getElementById('measureReadoutBearing');
  const mJarak = document.getElementById('mJarak');
  const mPointCountD = document.getElementById('mPointCountD');
  const mLuas = document.getElementById('mLuas');
  const mKeliling = document.getElementById('mKeliling');
  const mPointCountA = document.getElementById('mPointCountA');
  const mBJarak = document.getElementById('mBJarak');
  const mAzimuth = document.getElementById('mAzimuth');
  const mBearing = document.getElementById('mBearing');
  const mBtnUndo = document.getElementById('mBtnUndo');
  const mBtnClear = document.getElementById('mBtnClear');
  const measureStatusMsg = document.getElementById('measureStatusMsg');

  let gpsActive = false;
  let followMode = false;
  let lastFix = null;
  let currentHeading = null;

  let activeMapId = null;
  let activePdfDoc = null;   // dokumen pdf.js untuk berkas yang sedang dipratinjau di modal impor
  let selectedPageNum = 1;

  let waypoints = [];
  let editingWaypointId = null;
  let pendingPhotoDataUrl = null;
  let selectedCategory = GuseraWaypoint.CATEGORIES[0].id;
  let placementModeActive = false;

  // ---------- Ukur / Measure (V5) state ----------
  const measureState = {
    active: false,
    mode: 'distance', // 'distance' (Polyline) | 'area' (Polygon) | 'bearing' (Azimuth)
    points: []
  };

  const leafletMap = GuseraMap.init(document.getElementById('leafletMap'));
  leafletMap.on('move zoom', updateStatusBar);
  updateStatusBar();

  // ---------- Sidebar mobile ----------
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarScrim.classList.toggle('visible');
  });
  sidebarScrim.addEventListener('click', closeSidebar);
  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarScrim.classList.remove('visible');
  }

  // ---------- Sidebar tabs: Peta / Waypoint / Track ----------
  tabMaps.addEventListener('click', () => switchSidebarTab('maps'));
  tabWaypoints.addEventListener('click', () => switchSidebarTab('waypoints'));
  tabTracks.addEventListener('click', () => switchSidebarTab('tracks'));
  function switchSidebarTab(name) {
    tabMaps.classList.toggle('active', name === 'maps');
    tabWaypoints.classList.toggle('active', name === 'waypoints');
    tabTracks.classList.toggle('active', name === 'tracks');
    paneMaps.classList.toggle('active', name === 'maps');
    paneWaypoints.classList.toggle('active', name === 'waypoints');
    paneTracks.classList.toggle('active', name === 'tracks');
  }

  function updateStatusBar() {
    const c = leafletMap.getCenter();
    stLat.textContent = c.lat.toFixed(5) + '°';
    stLon.textContent = c.lng.toFixed(5) + '°';
    stZoom.textContent = leafletMap.getZoom().toFixed(1);
  }

  function formatSize(bytes) {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? mb.toFixed(1) + ' MB' : (bytes / 1024).toFixed(0) + ' KB';
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
  }

  // =====================================================================
  // Modal impor peta PDF (V4 — menggantikan alur impor MBTiles)
  // =====================================================================
  function openModal() {
    modalBackdrop.classList.add('visible');
    modalProgress.textContent = '';
    pdfPreview.hidden = true;
    modalImport.hidden = true;
    activePdfDoc = null;
    selectedPageNum = 1;
  }
  function closeModal() {
    modalBackdrop.classList.remove('visible');
    fileInput.value = '';
    pdfPreview.hidden = true;
    modalImport.hidden = true;
    activePdfDoc = null;
  }
  btnAddMap.addEventListener('click', openModal);
  modalCancel.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault(); dropzone.classList.remove('dragover');
    const f = e.dataTransfer.files[0];
    if (f) openPdfForPreview(f);
  });
  fileInput.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (f) openPdfForPreview(f);
  });

  let pendingFile = null;

  async function openPdfForPreview(file) {
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    if (!isPdf) { alert('Berkas harus berformat .pdf'); return; }

    pendingFile = file;
    try {
      modalProgress.textContent = 'Membuka berkas PDF…';
      const buf = await file.arrayBuffer();
      const { doc, numPages } = await GuseraPDF.loadDocument(buf);
      activePdfDoc = doc;
      pendingFile._buf = buf; // simpan untuk dipakai lagi saat "Impor Peta" ditekan

      pdfPageSelect.innerHTML = '';
      for (let i = 1; i <= numPages; i++) {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = 'Halaman ' + i + ' dari ' + numPages;
        pdfPageSelect.appendChild(opt);
      }
      pdfPageSelect.parentElement.style.display = numPages > 1 ? 'flex' : 'none';
      selectedPageNum = 1;
      await refreshPdfThumbnail();

      pdfPreview.hidden = false;
      modalImport.hidden = false;
      modalProgress.textContent = 'Siap diimpor.';
    } catch (err) {
      console.error(err);
      modalProgress.textContent = 'Gagal membuka berkas. Pastikan ini berkas .pdf yang valid.';
    }
  }

  pdfPageSelect.addEventListener('change', async () => {
    selectedPageNum = parseInt(pdfPageSelect.value, 10) || 1;
    await refreshPdfThumbnail();
  });

  async function refreshPdfThumbnail() {
    if (!activePdfDoc) return;
    modalProgress.textContent = 'Membuat pratinjau…';
    const url = await GuseraPDF.renderPageThumbnail(activePdfDoc, selectedPageNum, 380);
    pdfPreviewImg.src = url;
    modalProgress.textContent = 'Siap diimpor.';
  }

  modalImport.addEventListener('click', async () => {
    if (!pendingFile || !activePdfDoc) return;
    try {
      modalImport.disabled = true;
      modalProgress.textContent = 'Me-render halaman & menyimpan ke penyimpanan lokal…';
      const { blob, pixelWidth, pixelHeight } = await GuseraPDF.renderPageToBlob(activePdfDoc, selectedPageNum, 2200);

      const record = {
        id: 'map-' + Date.now(),
        name: pendingFile.name.replace(/\.pdf$/i, '') + (activePdfDoc.numPages > 1 ? ' (hal. ' + selectedPageNum + ')' : ''),
        sizeBytes: pendingFile.size,
        addedAt: Date.now(),
        pdfBlob: pendingFile._buf,
        pageNum: selectedPageNum,
        numPages: activePdfDoc.numPages,
        pixelWidth,
        pixelHeight,
        imageBlob: blob,
        calibration: null,
        geoBounds: null
      };
      await GuseraStorage.saveMap(record);

      modalProgress.textContent = 'Selesai.';
      await refreshMapList();
      closeModal();
      loadMap(record.id);
    } catch (err) {
      console.error(err);
      modalProgress.textContent = 'Gagal mengimpor peta. Coba lagi.';
    } finally {
      modalImport.disabled = false;
    }
  });

  // ---------- Daftar peta ----------
  async function refreshMapList() {
    const maps = await GuseraStorage.listMaps();
    mapListEl.innerHTML = '';
    if (!maps.length) {
      const li = document.createElement('li');
      li.className = 'empty-hint';
      li.style.cursor = 'default';
      li.textContent = 'Belum ada peta tersimpan. Gunakan tombol "Tambah Peta" di bawah.';
      mapListEl.appendChild(li);
      return;
    }
    maps.forEach((m) => {
      const li = document.createElement('li');
      li.dataset.id = m.id;
      if (m.id === activeMapId) li.classList.add('active');
      const pageInfo = m.numPages > 1 ? 'hal. ' + m.pageNum + '/' + m.numPages + ' · ' : '';
      const geoInfo = m.calibration ? '📐 Terkalibrasi' : 'Denah (belum dikalibrasi)';
      li.innerHTML =
        '<span class="m-icon">📄</span>' +
        '<span class="m-info">' +
          '<span class="m-name">' + escapeHtml(m.name) + '</span>' +
          '<span class="m-meta">' + formatSize(m.sizeBytes) + ' · ' + pageInfo + geoInfo + '</span>' +
        '</span>' +
        '<button type="button" class="m-del" title="Hapus peta">✕</button>';
      li.addEventListener('click', (e) => {
        if (e.target.closest('.m-del')) return;
        loadMap(m.id);
        closeSidebar();
      });
      li.querySelector('.m-del').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Hapus peta "' + m.name + '" dari penyimpanan lokal?')) return;
        await GuseraStorage.deleteMap(m.id);
        if (activeMapId === m.id) {
          GuseraMap.clear();
          activeMapId = null;
          mapPlaceholder.style.display = 'flex';
          stActiveMap.textContent = '—';
          btnCalibrate.disabled = true;
        }
        refreshMapList();
      });
      mapListEl.appendChild(li);
    });
  }

  async function loadMap(id) {
    const record = await GuseraStorage.getMap(id);
    if (!record) return;

    activeMapId = id;
    GuseraMap.loadPDFMap(record);
    mapPlaceholder.style.display = 'none';
    stActiveMap.textContent = record.name;
    btnCalibrate.disabled = false;
    updateStatusBar();
    refreshMapList();
  }

  // =====================================================================
  // GPS
  // =====================================================================
  btnGps.addEventListener('click', async () => {
    if (!gpsActive) {
      gpsStatusMsg.textContent = '';
      gpsPanel.hidden = false;
      gpsHeadingText.textContent = 'Mencari sinyal…';
      const ok = await GuseraGPS.start({
        onPosition: handleGpsPosition,
        onHeading: handleGpsHeading,
        onError: handleGpsError
      });
      if (ok) {
        gpsActive = true;
        btnGps.classList.add('active');
        btnFollow.disabled = false;
      } else {
        gpsPanel.hidden = true;
      }
    } else {
      stopGps();
    }
  });

  btnFollow.addEventListener('click', () => {
    if (!gpsActive) return;
    followMode = !followMode;
    btnFollow.classList.toggle('active', followMode);
    if (followMode && lastFix) {
      GuseraMap.centerOnGPS(lastFix.lat, lastFix.lng, Math.max(leafletMap.getZoom(), 16));
    }
  });

  leafletMap.on('dragstart', () => {
    if (followMode) {
      followMode = false;
      btnFollow.classList.remove('active');
    }
  });

  function stopGps() {
    if (trackState.status !== 'idle') {
      alert('Hentikan rekaman track terlebih dahulu sebelum mematikan GPS.');
      return;
    }
    GuseraGPS.stop();
    gpsActive = false;
    followMode = false;
    lastFix = null;
    currentHeading = null;
    btnGps.classList.remove('active');
    btnFollow.classList.remove('active');
    btnFollow.disabled = true;
    gpsPanel.hidden = true;
    GuseraMap.clearGPSPosition();
  }

  function handleGpsPosition(data) {
    lastFix = data;
    gpsLat.textContent = data.lat.toFixed(6) + '°';
    gpsLon.textContent = data.lng.toFixed(6) + '°';
    gpsAccuracy.textContent = data.accuracy != null ? '±' + data.accuracy.toFixed(0) + ' m' : '—';
    gpsAltitude.textContent = data.altitude != null ? data.altitude.toFixed(0) + ' m' : '—';
    gpsSpeed.textContent = data.speedKmh != null ? data.speedKmh.toFixed(1) + ' km/h' : '0 km/h';
    gpsStatusMsg.textContent = '';

    GuseraMap.setGPSPosition(data.lat, data.lng, data.accuracy, currentHeading);
    if (followMode) GuseraMap.panToGPS(data.lat, data.lng);

    onTrackGpsUpdate(data);
  }

  function handleGpsHeading(deg, source) {
    currentHeading = deg;
    gpsHeadingText.textContent = Math.round(deg) + '° ' + (source === 'compass' ? '(Kompas)' : '(GPS)');
    gpsBearing.textContent = Math.round(deg) + '°';
    compassNeedle.setAttribute('transform', 'rotate(' + deg + ' 30 30)');
    if (lastFix) GuseraMap.setGPSPosition(lastFix.lat, lastFix.lng, lastFix.accuracy, deg);
  }

  function handleGpsError(err) {
    console.error(err);
    let msg = 'Terjadi kesalahan pada GPS.';
    if (err.code === 1) msg = 'Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini di pengaturan browser.';
    else if (err.code === 2) msg = 'Sinyal GPS tidak tersedia saat ini.';
    else if (err.code === 3) msg = 'Waktu tunggu sinyal GPS habis. Coba lagi di area yang lebih terbuka.';
    else if (err.message) msg = err.message;
    gpsStatusMsg.textContent = msg;
    if (!lastFix) stopGps();
  }

  // =====================================================================
  // Waypoint
  // =====================================================================

  async function loadAllWaypoints() {
    waypoints = await GuseraStorage.listWaypoints();
    GuseraMap.clearWaypointMarkers();
    waypoints.forEach((w) => {
      GuseraMap.addWaypointMarker(w, (id) => {
        const found = waypoints.find((x) => x.id === id);
        if (found) openWaypointModal(found);
      });
    });
    stWaypointCount.textContent = String(waypoints.length);
    refreshWaypointList();
  }

  function refreshWaypointList() {
    const q = wpSearch.value || '';
    waypointList.innerHTML = '';

    if (!waypoints.length) {
      const li = document.createElement('li');
      li.className = 'empty-hint';
      li.style.cursor = 'default';
      li.textContent = 'Belum ada waypoint tersimpan. Ketuk 📍 di peta atau tombol "Tambah Waypoint" di bawah.';
      waypointList.appendChild(li);
      return;
    }

    const filtered = waypoints.filter((w) => GuseraWaypoint.matchesQuery(w, q));
    if (!filtered.length) {
      const li = document.createElement('li');
      li.className = 'empty-hint';
      li.style.cursor = 'default';
      li.textContent = 'Tidak ada waypoint yang cocok dengan pencarian.';
      waypointList.appendChild(li);
      return;
    }

    filtered.forEach((w) => {
      const cat = GuseraWaypoint.getCategory(w.category);
      const li = document.createElement('li');
      li.dataset.id = w.id;
      li.innerHTML =
        '<span class="wp-dot" style="background:' + (w.color || cat.color) + '"></span>' +
        '<span class="m-info">' +
          '<span class="m-name">' + escapeHtml(w.name || 'Tanpa nama') + '</span>' +
          '<span class="m-meta">' + escapeHtml(cat.label) + ' · ' + w.lat.toFixed(5) + ', ' + w.lng.toFixed(5) + '</span>' +
        '</span>' +
        '<button type="button" class="m-del" title="Hapus waypoint">✕</button>';
      li.addEventListener('click', (e) => {
        if (e.target.closest('.m-del')) return;
        leafletMap.setView([w.lat, w.lng], Math.max(leafletMap.getZoom(), 17), { animate: true });
        openWaypointModal(w);
        closeSidebar();
      });
      li.querySelector('.m-del').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Hapus waypoint "' + (w.name || 'ini') + '" dari penyimpanan lokal?')) return;
        await deleteWaypointById(w.id);
      });
      waypointList.appendChild(li);
    });
  }
  wpSearch.addEventListener('input', refreshWaypointList);

  async function deleteWaypointById(id) {
    await GuseraStorage.deleteWaypoint(id);
    GuseraMap.removeWaypointMarker(id);
    await loadAllWaypoints();
  }

  function startPlacementMode() {
    if (placementModeActive) return;
    if (measureState.active) stopMeasure();
    placementModeActive = true;
    btnAddWaypointFab.classList.add('active');
    GuseraMap.setPlacementCursor(true);
    placementHint.hidden = false;
    leafletMap.once('click', onMapClickForWaypoint);
  }
  function cancelPlacementMode() {
    if (!placementModeActive) return;
    placementModeActive = false;
    btnAddWaypointFab.classList.remove('active');
    GuseraMap.setPlacementCursor(false);
    placementHint.hidden = true;
    leafletMap.off('click', onMapClickForWaypoint);
  }
  function onMapClickForWaypoint(e) {
    cancelPlacementMode();
    openWaypointModal(null, e.latlng);
  }
  btnAddWaypointFab.addEventListener('click', () => {
    if (placementModeActive) cancelPlacementMode();
    else startPlacementMode();
  });
  placementCancel.addEventListener('click', cancelPlacementMode);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (placementModeActive) cancelPlacementMode();
      if (calibrateModeActive) cancelCalibrateMode();
      if (measureState.active) stopMeasure();
    }
  });

  btnAddWaypoint.addEventListener('click', () => {
    closeSidebar();
    const c = leafletMap.getCenter();
    openWaypointModal(null, c);
  });

  function renderCategoryGrid() {
    wpCategoryGrid.innerHTML = '';
    GuseraWaypoint.CATEGORIES.forEach((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wp-cat-btn' + (cat.id === selectedCategory ? ' active' : '');
      btn.style.setProperty('--cat-color', cat.color);
      btn.innerHTML = '<span class="wp-cat-dot"></span>' + escapeHtml(cat.label);
      btn.addEventListener('click', () => {
        selectedCategory = cat.id;
        wpColor.value = cat.color;
        renderCategoryGrid();
      });
      wpCategoryGrid.appendChild(btn);
    });
  }

  function renderPhotoPreview() {
    if (pendingPhotoDataUrl) {
      wpPhotoPreview.src = pendingPhotoDataUrl;
      wpPhotoPreview.hidden = false;
      wpPhotoPlaceholder.hidden = true;
      wpPhotoRemove.hidden = false;
    } else {
      wpPhotoPreview.hidden = true;
      wpPhotoPreview.removeAttribute('src');
      wpPhotoPlaceholder.hidden = false;
      wpPhotoRemove.hidden = true;
    }
  }

  function openWaypointModal(waypoint, latlng) {
    editingWaypointId = waypoint ? waypoint.id : null;
    pendingPhotoDataUrl = waypoint ? (waypoint.photo || null) : null;
    selectedCategory = waypoint ? (waypoint.category || GuseraWaypoint.CATEGORIES[0].id) : GuseraWaypoint.CATEGORIES[0].id;

    wpModalTitle.textContent = waypoint ? 'Edit Waypoint' : 'Tambah Waypoint';
    const lat = waypoint ? waypoint.lat : latlng.lat;
    const lng = waypoint ? waypoint.lng : latlng.lng;
    wpLat.value = lat.toFixed(6);
    wpLon.value = lng.toFixed(6);
    wpName.value = waypoint ? (waypoint.name || '') : '';
    wpDesc.value = waypoint ? (waypoint.description || '') : '';
    wpColor.value = waypoint ? (waypoint.color || GuseraWaypoint.getCategory(selectedCategory).color) : GuseraWaypoint.getCategory(selectedCategory).color;
    wpBtnDelete.hidden = !waypoint;
    wpUseGps.hidden = !lastFix;

    renderCategoryGrid();
    renderPhotoPreview();
    wpModalBackdrop.classList.add('visible');
  }

  function closeWaypointModal() {
    wpModalBackdrop.classList.remove('visible');
    editingWaypointId = null;
    pendingPhotoDataUrl = null;
    wpPhotoInput.value = '';
  }

  wpCancel.addEventListener('click', closeWaypointModal);
  wpModalBackdrop.addEventListener('click', (e) => { if (e.target === wpModalBackdrop) closeWaypointModal(); });

  wpUseGps.addEventListener('click', () => {
    if (!lastFix) return;
    wpLat.value = lastFix.lat.toFixed(6);
    wpLon.value = lastFix.lng.toFixed(6);
  });

  wpPhotoDrop.addEventListener('click', (e) => {
    if (e.target === wpPhotoRemove) return;
    wpPhotoInput.click();
  });
  wpPhotoInput.addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      pendingPhotoDataUrl = await GuseraWaypoint.compressPhoto(f);
      renderPhotoPreview();
    } catch (err) {
      console.error(err);
      alert('Gagal memproses foto. Pastikan berkas berupa gambar.');
    }
  });
  wpPhotoRemove.addEventListener('click', (e) => {
    e.stopPropagation();
    pendingPhotoDataUrl = null;
    wpPhotoInput.value = '';
    renderPhotoPreview();
  });

  wpSave.addEventListener('click', async () => {
    const lat = parseFloat(wpLat.value);
    const lng = parseFloat(wpLon.value);
    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Koordinat tidak valid. Periksa nilai Lat/Lon.');
      return;
    }
    const existing = editingWaypointId ? waypoints.find((w) => w.id === editingWaypointId) : null;
    const record = {
      id: editingWaypointId || ('wp-' + Date.now()),
      name: wpName.value.trim(),
      category: selectedCategory,
      color: wpColor.value,
      description: wpDesc.value.trim(),
      photo: pendingPhotoDataUrl,
      lat, lng,
      createdAt: existing ? existing.createdAt : Date.now(),
      updatedAt: Date.now()
    };
    try {
      await GuseraStorage.saveWaypoint(record);
      closeWaypointModal();
      await loadAllWaypoints();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan waypoint. Coba lagi.');
    }
  });

  wpBtnDelete.addEventListener('click', async () => {
    if (!editingWaypointId) return;
    const wp = waypoints.find((w) => w.id === editingWaypointId);
    if (!confirm('Hapus waypoint "' + ((wp && wp.name) || 'ini') + '"?')) return;
    await deleteWaypointById(editingWaypointId);
    closeWaypointModal();
  });

  // =====================================================================
  // Kalibrasi peta PDF (V4, baru — menggantikan konsep GeoPDF otomatis)
  // =====================================================================
  let calibrateModeActive = false;
  let calibrationStep = 0; // 0 = tidak aktif, 1 = menunggu titik 1, 2 = menunggu titik 2
  let calPoint1 = null;
  let calPendingPixel = null;

  btnCalibrate.addEventListener('click', () => {
    if (!activeMapId) return;
    if (calibrateModeActive) cancelCalibrateMode();
    else startCalibrateMode();
  });
  calibrateCancel.addEventListener('click', cancelCalibrateMode);

  function startCalibrateMode() {
    if (measureState.active) stopMeasure();
    calibrateModeActive = true;
    calibrationStep = 1;
    calPoint1 = null;
    btnCalibrate.classList.add('active');
    calibrateHintText.textContent = 'Ketuk titik pertama di peta yang koordinat aslinya Anda ketahui';
    calibrateHint.hidden = false;
    leafletMap.once('click', onMapClickForCalibration);
  }

  function cancelCalibrateMode() {
    calibrateModeActive = false;
    calibrationStep = 0;
    calPoint1 = null;
    btnCalibrate.classList.remove('active');
    calibrateHint.hidden = true;
    leafletMap.off('click', onMapClickForCalibration);
  }

  function onMapClickForCalibration(e) {
    const pixel = GuseraMap.pixelForLatLng(e.latlng);
    if (!pixel) { cancelCalibrateMode(); return; }
    calPendingPixel = pixel;
    openCalModal(calibrationStep);
  }

  function openCalModal(step) {
    calModalTitle.textContent = 'Titik Kalibrasi ' + step;
    calLat.value = '';
    calLon.value = '';
    calUseGps.hidden = !lastFix;
    calModalBackdrop.classList.add('visible');
  }
  function closeCalModal() {
    calModalBackdrop.classList.remove('visible');
  }
  calCancel.addEventListener('click', () => { closeCalModal(); cancelCalibrateMode(); });
  calModalBackdrop.addEventListener('click', (e) => { if (e.target === calModalBackdrop) { closeCalModal(); cancelCalibrateMode(); } });
  calUseGps.addEventListener('click', () => {
    if (!lastFix) return;
    calLat.value = lastFix.lat.toFixed(6);
    calLon.value = lastFix.lng.toFixed(6);
  });

  calConfirm.addEventListener('click', async () => {
    const lat = parseFloat(calLat.value);
    const lng = parseFloat(calLon.value);
    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Koordinat tidak valid. Periksa nilai Lat/Lon.');
      return;
    }
    const point = { px: calPendingPixel.px, py: calPendingPixel.py, lat, lng };
    closeCalModal();

    if (calibrationStep === 1) {
      calPoint1 = point;
      calibrationStep = 2;
      calibrateHintText.textContent = 'Ketuk titik kedua (pilih titik yang jauh dari titik pertama untuk akurasi lebih baik)';
      leafletMap.once('click', onMapClickForCalibration);
    } else if (calibrationStep === 2) {
      const bounds = GuseraMap.computeBoundsFromCalibration(calPoint1, point);
      if (!bounds) {
        alert('Kedua titik terlalu berdekatan atau berada di posisi piksel yang sama. Ulangi kalibrasi dengan dua titik yang lebih terpisah.');
        cancelCalibrateMode();
        return;
      }
      GuseraMap.applyCalibratedBounds(bounds);
      const record = await GuseraStorage.getMap(activeMapId);
      if (record) {
        record.calibration = { p1: calPoint1, p2: point };
        record.geoBounds = bounds;
        await GuseraStorage.saveMap(record);
      }
      cancelCalibrateMode();
      refreshMapList();
    }
  });

  // =====================================================================
  // Track Recorder (V4, baru)
  // =====================================================================
  const trackState = {
    status: 'idle', // idle | recording | paused
    points: [],
    startedAt: null,
    accumulatedMs: 0,
    lastResumeAt: null,
    lastPoint: null,
    distanceM: 0
  };
  let trackTimerId = null;

  function elapsedMs() {
    let ms = trackState.accumulatedMs;
    if (trackState.status === 'recording' && trackState.lastResumeAt) {
      ms += Date.now() - trackState.lastResumeAt;
    }
    return ms;
  }

  function updateTrackReadout() {
    trJarak.textContent = GuseraTrack.formatDistance(trackState.distanceM);
    trWaktu.textContent = GuseraTrack.formatDuration(elapsedMs());
    const kmh = lastFix && lastFix.speedKmh != null ? lastFix.speedKmh : GuseraTrack.averageSpeedKmh(trackState.distanceM, elapsedMs());
    trKecepatan.textContent = kmh.toFixed(1) + ' km/h';
  }

  function setTrackStatusPill(text) {
    trackStatusPill.textContent = text;
  }

  btnTrack.addEventListener('click', () => {
    trackPanel.hidden = !trackPanel.hidden;
    if (!trackPanel.hidden) updateTrackReadout();
  });

  trBtnStart.addEventListener('click', async () => {
    trStatusMsg.textContent = '';
    if (!gpsActive) {
      trStatusMsg.textContent = 'Mengaktifkan GPS…';
      gpsPanel.hidden = false;
      gpsHeadingText.textContent = 'Mencari sinyal…';
      const ok = await GuseraGPS.start({ onPosition: handleGpsPosition, onHeading: handleGpsHeading, onError: handleGpsError });
      if (!ok) { trStatusMsg.textContent = 'GPS tidak dapat diaktifkan. Track tidak bisa direkam.'; gpsPanel.hidden = true; return; }
      gpsActive = true;
      btnGps.classList.add('active');
      btnFollow.disabled = false;
    }

    trackState.status = 'recording';
    trackState.points = [];
    trackState.startedAt = Date.now();
    trackState.accumulatedMs = 0;
    trackState.lastResumeAt = Date.now();
    trackState.lastPoint = null;
    trackState.distanceM = 0;

    GuseraMap.startLiveTrack();
    setTrackStatusPill('Merekam');
    trBtnStart.hidden = true;
    trBtnPause.hidden = false;
    trBtnStop.hidden = false;
    trBtnResume.hidden = true;

    if (lastFix) onTrackGpsUpdate(lastFix);
    trackTimerId = setInterval(updateTrackReadout, 1000);
    updateTrackReadout();
  });

  trBtnPause.addEventListener('click', () => {
    if (trackState.status !== 'recording') return;
    trackState.accumulatedMs += Date.now() - trackState.lastResumeAt;
    trackState.lastResumeAt = null;
    trackState.status = 'paused';
    setTrackStatusPill('Jeda');
    trBtnPause.hidden = true;
    trBtnResume.hidden = false;
  });

  trBtnResume.addEventListener('click', () => {
    if (trackState.status !== 'paused') return;
    trackState.lastResumeAt = Date.now();
    trackState.status = 'recording';
    setTrackStatusPill('Merekam');
    trBtnPause.hidden = false;
    trBtnResume.hidden = true;
  });

  trBtnStop.addEventListener('click', () => {
    if (trackState.status === 'idle') return;
    if (trackState.status === 'recording') {
      trackState.accumulatedMs += Date.now() - trackState.lastResumeAt;
    }
    clearInterval(trackTimerId);
    trackTimerId = null;

    if (trackState.points.length < 2) {
      alert('Track terlalu pendek untuk disimpan (butuh minimal 2 titik posisi).');
      resetTrackUI();
      return;
    }

    trModalJarak.textContent = GuseraTrack.formatDistance(trackState.distanceM);
    trModalWaktu.textContent = GuseraTrack.formatDuration(trackState.accumulatedMs);
    trName.value = 'Track ' + new Date(trackState.startedAt).toLocaleString('id-ID');
    trModalBackdrop.classList.add('visible');
  });

  function resetTrackUI() {
    trackState.status = 'idle';
    GuseraMap.stopLiveTrack();
    setTrackStatusPill('Siap');
    trBtnStart.hidden = false;
    trBtnPause.hidden = true;
    trBtnResume.hidden = true;
    trBtnStop.hidden = true;
    trJarak.textContent = '0 m';
    trWaktu.textContent = '00:00';
    trKecepatan.textContent = '0 km/h';
  }

  trDiscard.addEventListener('click', () => {
    trModalBackdrop.classList.remove('visible');
    resetTrackUI();
  });

  trSave.addEventListener('click', async () => {
    const record = {
      id: 'track-' + Date.now(),
      name: trName.value.trim() || 'Track tanpa nama',
      points: trackState.points,
      distanceM: trackState.distanceM,
      durationMs: trackState.accumulatedMs,
      startedAt: trackState.startedAt,
      endedAt: Date.now()
    };
    try {
      await GuseraStorage.saveTrack(record);
      trModalBackdrop.classList.remove('visible');
      resetTrackUI();
      await refreshTrackList();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan track. Coba lagi.');
    }
  });

  /** Dipanggil setiap posisi GPS baru masuk — menambah titik ke track jika sedang merekam. */
  function onTrackGpsUpdate(data) {
    if (trackState.status !== 'recording') return;
    const point = { lat: data.lat, lng: data.lng, alt: data.altitude, t: data.timestamp || Date.now() };
    if (trackState.lastPoint) {
      const d = GuseraTrack.distanceMeters(trackState.lastPoint.lat, trackState.lastPoint.lng, point.lat, point.lng);
      if (d < 1.5) return; // abaikan noise GPS diam di tempat
      trackState.distanceM += d;
    }
    trackState.lastPoint = point;
    trackState.points.push(point);
    GuseraMap.addLiveTrackPoint(point.lat, point.lng);
    if (!trackPanel.hidden) updateTrackReadout();
  }

  async function refreshTrackList() {
    const tracks = await GuseraStorage.listTracks();
    trackList.innerHTML = '';
    if (!tracks.length) {
      const li = document.createElement('li');
      li.className = 'empty-hint';
      li.style.cursor = 'default';
      li.textContent = 'Belum ada track tersimpan. Rekam jalur baru lewat tombol 🛤 di peta.';
      trackList.appendChild(li);
      return;
    }
    tracks.forEach((t) => {
      const li = document.createElement('li');
      li.dataset.id = t.id;
      li.innerHTML =
        '<span class="m-icon">🛤</span>' +
        '<span class="m-info">' +
          '<span class="m-name">' + escapeHtml(t.name) + '</span>' +
          '<span class="m-meta">' + GuseraTrack.formatDistance(t.distanceM) + ' · ' + GuseraTrack.formatDuration(t.durationMs) + '</span>' +
        '</span>' +
        '<button type="button" class="m-del" title="Hapus track">✕</button>';
      li.addEventListener('click', (e) => {
        if (e.target.closest('.m-del')) return;
        GuseraMap.showTrackPreview(t.points);
        closeSidebar();
      });
      li.querySelector('.m-del').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Hapus track "' + t.name + '" dari penyimpanan lokal?')) return;
        await GuseraStorage.deleteTrack(t.id);
        GuseraMap.clearTrackPreview();
        refreshTrackList();
      });
      trackList.appendChild(li);
    });
  }

  // =====================================================================
  // Ukur / Measure (V5, baru): Jarak (Polyline), Luas (Polygon), Bearing/Azimuth
  // =====================================================================
  const MEASURE_HINTS = {
    distance: 'Ketuk titik-titik di peta untuk mengukur jarak (Polyline).',
    area: 'Ketuk minimal 3 titik di peta untuk mengukur luas (Polygon).',
    bearing: 'Ketuk 2 titik di peta: titik awal lalu titik tujuan, untuk mengukur Bearing & Azimuth.'
  };

  function setMeasureMode(mode) {
    measureState.mode = mode;
    measureState.points = [];
    mModeDistance.classList.toggle('active', mode === 'distance');
    mModeArea.classList.toggle('active', mode === 'area');
    mModeBearing.classList.toggle('active', mode === 'bearing');
    measureReadoutDistance.hidden = mode !== 'distance';
    measureReadoutArea.hidden = mode !== 'area';
    measureReadoutBearing.hidden = mode !== 'bearing';
    GuseraMap.clearMeasure();
    updateMeasureReadout();
    measureHintText.textContent = MEASURE_HINTS[mode];
    measureStatusMsg.textContent = MEASURE_HINTS[mode];
  }

  mModeDistance.addEventListener('click', () => setMeasureMode('distance'));
  mModeArea.addEventListener('click', () => setMeasureMode('area'));
  mModeBearing.addEventListener('click', () => setMeasureMode('bearing'));

  function updateMeasureReadout() {
    const pts = measureState.points;
    if (measureState.mode === 'distance') {
      mJarak.textContent = GuseraMeasure.formatDistance(GuseraMeasure.totalDistance(pts));
      mPointCountD.textContent = String(pts.length);
    } else if (measureState.mode === 'area') {
      mLuas.textContent = GuseraMeasure.formatArea(GuseraMeasure.polygonAreaSqm(pts));
      mKeliling.textContent = GuseraMeasure.formatDistance(pts.length >= 3 ? GuseraMeasure.perimeter(pts) : GuseraMeasure.totalDistance(pts));
      mPointCountA.textContent = String(pts.length);
    } else { // bearing
      if (pts.length === 2) {
        const az = GuseraMeasure.azimuthDeg(pts[0].lat, pts[0].lng, pts[1].lat, pts[1].lng);
        mBJarak.textContent = GuseraMeasure.formatDistance(GuseraMeasure.distanceMeters(pts[0].lat, pts[0].lng, pts[1].lat, pts[1].lng));
        mAzimuth.textContent = az.toFixed(2) + '° (' + GuseraMeasure.compassPointName(az) + ')';
        mBearing.textContent = GuseraMeasure.azimuthToQuadrantBearing(az);
      } else {
        mBJarak.textContent = '—';
        mAzimuth.textContent = '—';
        mBearing.textContent = '—';
      }
    }
  }

  function onMapClickForMeasure(e) {
    if (measureState.mode === 'bearing' && measureState.points.length >= 2) {
      measureState.points = []; // mulai pasangan titik baru
    }
    measureState.points.push({ lat: e.latlng.lat, lng: e.latlng.lng });
    GuseraMap.renderMeasure(measureState.points, measureState.mode);
    updateMeasureReadout();
  }

  btnMeasure.addEventListener('click', () => {
    if (!measureState.active) startMeasure();
    else stopMeasure();
  });

  function startMeasure() {
    if (placementModeActive) cancelPlacementMode();
    if (calibrateModeActive) cancelCalibrateMode();
    measureState.active = true;
    measureState.points = [];
    btnMeasure.classList.add('active');
    measurePanel.hidden = false;
    measureHint.hidden = false;
    setMeasureMode(measureState.mode);
    leafletMap.on('click', onMapClickForMeasure);
  }

  function stopMeasure() {
    measureState.active = false;
    measureState.points = [];
    btnMeasure.classList.remove('active');
    measurePanel.hidden = true;
    measureHint.hidden = true;
    GuseraMap.clearMeasure();
    leafletMap.off('click', onMapClickForMeasure);
  }

  measureClose.addEventListener('click', stopMeasure);
  measureCancel.addEventListener('click', stopMeasure);

  mBtnUndo.addEventListener('click', () => {
    measureState.points.pop();
    GuseraMap.renderMeasure(measureState.points, measureState.mode);
    updateMeasureReadout();
  });

  mBtnClear.addEventListener('click', () => {
    measureState.points = [];
    GuseraMap.clearMeasure();
    updateMeasureReadout();
  });

  // ---------- Fullscreen ----------
  const shellEl = document.querySelector('.app-shell');
  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      (shellEl.requestFullscreen || shellEl.webkitRequestFullscreen || function () {}).call(shellEl);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
    }
  });
  document.addEventListener('fullscreenchange', () => {
    btnFullscreen.classList.toggle('active', !!document.fullscreenElement);
    setTimeout(() => leafletMap.invalidateSize(), 150);
  });

  // ---------- Splash screen ----------
  const splashStart = Date.now();
  Promise.all([refreshMapList(), loadAllWaypoints(), refreshTrackList()]).finally(() => {
    const elapsed = Date.now() - splashStart;
    const minDisplay = 600;
    setTimeout(() => splash.classList.add('hide'), Math.max(0, minDisplay - elapsed));
  });
})();
