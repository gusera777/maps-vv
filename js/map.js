/**
 * map.js
 * Inisialisasi peta Leaflet. Sejak V4, peta PDF ditampilkan sebagai satu
 * gambar overlay (hasil render PDF.js di pdfmap.js) yang diposisikan lewat
 * batas geografis (bounds) — bukan lagi ubin (tile) dari MBTiles.
 *
 * Dua mode posisi:
 *  - Denah (belum dikalibrasi): bounds sementara, hanya untuk pan/zoom visual.
 *  - Georeferensi (sudah dikalibrasi 2 titik): bounds dihitung dari koordinat
 *    GPS sesungguhnya, sehingga GPS/waypoint/track selaras dengan citra PDF.
 */
const GuseraMap = (() => {
  let map = null;
  let currentOverlay = null;
  let currentOverlayUrl = null;
  let activeRecordMeta = null; // { pixelWidth, pixelHeight, geoBounds } milik overlay yang tampil
  let gpsMarker = null;
  let gpsAccuracyCircle = null;
  let waypointMarkers = {}; // id -> L.Marker

  // ---------- Track (V4) ----------
  let liveTrackLine = null;
  let trackPreviewLine = null;

  const DEFAULT_CENTER = [-2.5, 118]; // titik tengah default: Indonesia
  const DEFAULT_METERS_PER_PIXEL = 1; // asumsi skala sementara sebelum dikalibrasi

  function init(containerEl) {
    map = L.map(containerEl, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 2,
      maxZoom: 24,
      worldCopyJump: false
    }).setView(DEFAULT_CENTER, 4.5);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ position: 'bottomleft', metric: true, imperial: false, maxWidth: 120 }).addTo(map);
    return map;
  }

  /** Hitung bounds "denah" sementara (belum dikalibrasi), berpusat di lokasi acuan. */
  function computePlanBounds(pixelWidth, pixelHeight, center) {
    const c = center || DEFAULT_CENTER;
    const metersPerDegLat = 111320;
    const metersPerDegLng = 111320 * Math.cos((c[0] * Math.PI) / 180) || 111320;
    const halfHeightDeg = (pixelHeight * DEFAULT_METERS_PER_PIXEL) / 2 / metersPerDegLat;
    const halfWidthDeg = (pixelWidth * DEFAULT_METERS_PER_PIXEL) / 2 / metersPerDegLng;
    return [
      [c[0] - halfHeightDeg, c[1] - halfWidthDeg],
      [c[0] + halfHeightDeg, c[1] + halfWidthDeg]
    ];
  }

  /**
   * Hitung bounds georeferensi dari 2 titik kalibrasi { px, py, lat, lng }
   * (pemetaan linear sumbu-sejajar: tanpa rotasi, sesuai peta lapangan yang
   * umumnya sudah utara-atas).
   */
  function computeCalibratedBounds(p1, p2, pixelWidth, pixelHeight) {
    if (p2.px === p1.px || p2.py === p1.py) return null;
    const lngAt = (px) => p1.lng + ((px - p1.px) * (p2.lng - p1.lng)) / (p2.px - p1.px);
    const latAt = (py) => p1.lat + ((py - p1.py) * (p2.lat - p1.lat)) / (p2.py - p1.py);
    const lng0 = lngAt(0);
    const lng1 = lngAt(pixelWidth);
    const lat0 = latAt(0);
    const lat1 = latAt(pixelHeight);
    return [
      [Math.min(lat0, lat1), Math.min(lng0, lng1)],
      [Math.max(lat0, lat1), Math.max(lng0, lng1)]
    ];
  }

  /**
   * Tampilkan record peta PDF (imageBlob) di atas peta.
   * record: { pixelWidth, pixelHeight, imageBlob, geoBounds|null }
   */
  function loadPDFMap(record, { fitBounds = true } = {}) {
    if (currentOverlay) {
      map.removeLayer(currentOverlay);
      currentOverlay = null;
    }
    if (currentOverlayUrl) {
      URL.revokeObjectURL(currentOverlayUrl);
      currentOverlayUrl = null;
    }

    const bounds = record.geoBounds || computePlanBounds(record.pixelWidth, record.pixelHeight, map.getCenter() ? [map.getCenter().lat, map.getCenter().lng] : null);
    currentOverlayUrl = URL.createObjectURL(record.imageBlob);
    currentOverlay = L.imageOverlay(currentOverlayUrl, bounds, { interactive: false }).addTo(map);
    activeRecordMeta = { pixelWidth: record.pixelWidth, pixelHeight: record.pixelHeight, geoBounds: bounds };

    if (fitBounds) {
      map.fitBounds(bounds, { animate: false, padding: [12, 12] });
    }
    return bounds;
  }

  function clear() {
    if (currentOverlay) {
      map.removeLayer(currentOverlay);
      currentOverlay = null;
    }
    if (currentOverlayUrl) {
      URL.revokeObjectURL(currentOverlayUrl);
      currentOverlayUrl = null;
    }
    activeRecordMeta = null;
  }

  function getMap() {
    return map;
  }

  // ---------- Kalibrasi (V4: menggantikan konsep GeoPDF otomatis) ----------

  /** Ubah titik klik (latlng) di peta menjadi koordinat piksel pada citra PDF yang sedang tampil. */
  function pixelForLatLng(latlng) {
    if (!activeRecordMeta) return null;
    const { geoBounds, pixelWidth, pixelHeight } = activeRecordMeta;
    const [[south, west], [north, east]] = geoBounds;
    const px = ((latlng.lng - west) / (east - west)) * pixelWidth;
    const py = ((north - latlng.lat) / (north - south)) * pixelHeight;
    return { px, py };
  }

  function computeBoundsFromCalibration(p1, p2) {
    if (!activeRecordMeta) return null;
    return computeCalibratedBounds(p1, p2, activeRecordMeta.pixelWidth, activeRecordMeta.pixelHeight);
  }

  function getActiveOverlayBounds() {
    return activeRecordMeta ? activeRecordMeta.geoBounds : null;
  }

  /** Terapkan bounds baru (hasil kalibrasi) ke overlay yang sedang tampil, tanpa memuat ulang gambar. */
  function applyCalibratedBounds(newBounds) {
    if (!currentOverlay) return;
    currentOverlay.setBounds(newBounds);
    if (activeRecordMeta) activeRecordMeta.geoBounds = newBounds;
    map.fitBounds(newBounds, { animate: true, padding: [12, 12] });
  }

  // ---------- GPS ----------

  function setGPSPosition(lat, lng, accuracy, headingDeg) {
    const latlng = [lat, lng];
    const radius = accuracy && accuracy > 0 ? accuracy : 8;

    if (!gpsAccuracyCircle) {
      gpsAccuracyCircle = L.circle(latlng, {
        radius, color: '#7C9473', weight: 1, fillColor: '#7C9473', fillOpacity: 0.15
      }).addTo(map);
    } else {
      gpsAccuracyCircle.setLatLng(latlng);
      gpsAccuracyCircle.setRadius(radius);
    }

    const hasHeading = headingDeg != null;
    const html =
      '<div class="gps-pulse"></div>' +
      (hasHeading ? '<div class="gps-heading-arrow" style="transform:rotate(' + headingDeg + 'deg)"></div>' : '') +
      '<div class="gps-dot"></div>';
    const icon = L.divIcon({ className: 'gps-marker-icon', html, iconSize: [26, 26], iconAnchor: [13, 13] });

    if (!gpsMarker) {
      gpsMarker = L.marker(latlng, { icon, zIndexOffset: 1000, interactive: false }).addTo(map);
    } else {
      gpsMarker.setLatLng(latlng);
      gpsMarker.setIcon(icon);
    }
  }

  function clearGPSPosition() {
    if (gpsMarker) { map.removeLayer(gpsMarker); gpsMarker = null; }
    if (gpsAccuracyCircle) { map.removeLayer(gpsAccuracyCircle); gpsAccuracyCircle = null; }
  }

  function panToGPS(lat, lng) {
    map.panTo([lat, lng], { animate: true, duration: 0.4 });
  }

  function centerOnGPS(lat, lng, zoom) {
    map.setView([lat, lng], zoom, { animate: true });
  }

  // ---------- Waypoint ----------

  function buildWaypointIcon(color) {
    const c = color || '#D98A3D';
    const html =
      '<svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M15 1C7.8 1 2 6.8 2 14c0 9.6 13 22.5 13 22.5S28 23.6 28 14C28 6.8 22.2 1 15 1z" fill="' + c + '" stroke="#0F1512" stroke-width="1.4"/>' +
      '<circle cx="15" cy="14" r="5.2" fill="#0F1512" fill-opacity="0.82"/>' +
      '</svg>';
    return L.divIcon({ className: 'wp-marker-icon', html, iconSize: [30, 38], iconAnchor: [15, 36], popupAnchor: [0, -32] });
  }

  function addWaypointMarker(wp, onClick) {
    const marker = L.marker([wp.lat, wp.lng], { icon: buildWaypointIcon(wp.color), riseOnHover: true });
    marker.on('click', () => onClick && onClick(wp.id));
    marker.addTo(map);
    waypointMarkers[wp.id] = marker;
    return marker;
  }

  function updateWaypointMarker(wp) {
    const marker = waypointMarkers[wp.id];
    if (!marker) return;
    marker.setLatLng([wp.lat, wp.lng]);
    marker.setIcon(buildWaypointIcon(wp.color));
  }

  function removeWaypointMarker(id) {
    const marker = waypointMarkers[id];
    if (marker) {
      map.removeLayer(marker);
      delete waypointMarkers[id];
    }
  }

  function clearWaypointMarkers() {
    Object.keys(waypointMarkers).forEach(removeWaypointMarker);
  }

  function setPlacementCursor(active) {
    map.getContainer().classList.toggle('placement-mode', !!active);
  }

  // ---------- Track (V4, baru) ----------

  /** Mulai menggambar polyline langsung ("live") selama rekaman berlangsung. */
  function startLiveTrack() {
    stopLiveTrack();
    liveTrackLine = L.polyline([], { color: '#D98A3D', weight: 4, opacity: 0.9 }).addTo(map);
  }

  function addLiveTrackPoint(lat, lng) {
    if (liveTrackLine) liveTrackLine.addLatLng([lat, lng]);
  }

  function stopLiveTrack() {
    if (liveTrackLine) { map.removeLayer(liveTrackLine); liveTrackLine = null; }
  }

  /** Tampilkan pratinjau track tersimpan (dari daftar sidebar), dan zoom ke jalurnya. */
  function showTrackPreview(points) {
    clearTrackPreview();
    if (!points || !points.length) return;
    trackPreviewLine = L.polyline(points.map((p) => [p.lat, p.lng]), {
      color: '#3D82D9', weight: 4, opacity: 0.85, dashArray: '2 7'
    }).addTo(map);
    map.fitBounds(trackPreviewLine.getBounds(), { animate: true, padding: [28, 28] });
  }

  function clearTrackPreview() {
    if (trackPreviewLine) { map.removeLayer(trackPreviewLine); trackPreviewLine = null; }
  }

  // ---------- Ukur / Measure (V5, baru) ----------
  let measureLayerGroup = null;

  /** Hapus seluruh gambar ukur (penanda titik + garis/polygon) dari peta. */
  function clearMeasure() {
    if (measureLayerGroup) { map.removeLayer(measureLayerGroup); measureLayerGroup = null; }
  }

  /** Gambar ulang penuh alat ukur dari rangkaian titik { lat, lng } sesuai mode aktif. */
  function renderMeasure(points, mode) {
    clearMeasure();
    if (!points || !points.length) return;
    measureLayerGroup = L.layerGroup().addTo(map);

    const latlngs = points.map((p) => [p.lat, p.lng]);

    if (mode === 'area') {
      if (latlngs.length >= 3) {
        L.polygon(latlngs, { color: '#3D82D9', weight: 3, fillColor: '#3D82D9', fillOpacity: 0.18 }).addTo(measureLayerGroup);
      } else if (latlngs.length === 2) {
        L.polyline(latlngs, { color: '#3D82D9', weight: 3, opacity: 0.9, dashArray: '4 6' }).addTo(measureLayerGroup);
      }
    } else {
      // mode "distance" (Polyline) & "bearing" (garis lurus antar 2 titik)
      if (latlngs.length >= 2) {
        L.polyline(latlngs, { color: '#D98A3D', weight: 3.5, opacity: 0.95 }).addTo(measureLayerGroup);
      }
    }

    // Penanda urutan titik, digambar terakhir agar tampil di atas garis/polygon
    latlngs.forEach((ll, i) => {
      const icon = L.divIcon({
        className: 'measure-vertex-icon',
        html: '<span>' + (i + 1) + '</span>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      L.marker(ll, { icon, interactive: false }).addTo(measureLayerGroup);
    });
  }

  return {
    init, loadPDFMap, clear, getMap,
    pixelForLatLng, computeBoundsFromCalibration, getActiveOverlayBounds, applyCalibratedBounds,
    setGPSPosition, clearGPSPosition, panToGPS, centerOnGPS,
    addWaypointMarker, updateWaypointMarker, removeWaypointMarker, clearWaypointMarkers,
    setPlacementCursor,
    startLiveTrack, addLiveTrackPoint, stopLiveTrack, showTrackPreview, clearTrackPreview,
    clearMeasure, renderMeasure
  };
})();
