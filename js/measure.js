/**
 * measure.js (baru di V5 — Ukur / Measure)
 * Util murni untuk alat ukur di peta: jarak sepanjang polyline, luas & keliling
 * polygon, serta bearing/azimuth antar dua titik. Semua dihitung sepenuhnya
 * di perangkat (tanpa Turf.js / layanan luar) dari rangkaian titik { lat, lng }
 * yang diketuk pengguna di peta.
 *
 * Logika mode ukur (state antar-titik, ganti mode, UI) ada di app.js;
 * penggambaran polyline/polygon/penanda titik di peta ada di map.js.
 */
const GuseraMeasure = (() => {
  const EARTH_RADIUS_M = 6371000;

  function toRad(d) { return (d * Math.PI) / 180; }
  function toDeg(r) { return (r * 180) / Math.PI; }

  /** Jarak dua koordinat (meter), rumus Haversine. */
  function distanceMeters(lat1, lng1, lat2, lng2) {
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /** Jarak total (meter) di sepanjang rangkaian titik { lat, lng } — Polyline, tidak tertutup. */
  function totalDistance(points) {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += distanceMeters(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
    }
    return total;
  }

  /** Keliling Polygon (meter): rangkaian titik ditutup kembali ke titik pertama. */
  function perimeter(points) {
    if (!points || points.length < 3) return totalDistance(points || []);
    return (
      totalDistance(points) +
      distanceMeters(
        points[points.length - 1].lat, points[points.length - 1].lng,
        points[0].lat, points[0].lng
      )
    );
  }

  /**
   * Luas Polygon (m²) dari rangkaian titik { lat, lng }.
   * Memakai proyeksi ekuirektangular sederhana berpusat di lintang rata-rata
   * titik-titiknya, lalu rumus shoelace pada bidang datar hasil proyeksi.
   * Cukup akurat untuk skala lapangan / blok kebun (puluhan m² s.d. ratusan
   * hektare); bukan pengganti pengukuran kadastral resmi.
   */
  function polygonAreaSqm(points) {
    if (!points || points.length < 3) return 0;
    const latRef = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const mPerDegLat = 111320;
    const mPerDegLng = 111320 * Math.cos(toRad(latRef));
    const xy = points.map((p) => ({ x: p.lng * mPerDegLng, y: p.lat * mPerDegLat }));
    let area = 0;
    for (let i = 0; i < xy.length; i++) {
      const j = (i + 1) % xy.length;
      area += xy[i].x * xy[j].y - xy[j].x * xy[i].y;
    }
    return Math.abs(area) / 2;
  }

  /** Azimuth awal dari titik 1 ke titik 2, dalam derajat 0–360° searah jarum jam dari Utara. */
  function azimuthDeg(lat1, lng1, lat2, lng2) {
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const dLng = toRad(lng2 - lng1);
    const y = Math.sin(dLng) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  /** Ubah azimuth (0–360°) menjadi format Bearing kuadran survei, mis. "N 45°30'12" E". */
  function azimuthToQuadrantBearing(az) {
    let ns, ew, angle;
    if (az <= 90) { ns = 'N'; ew = 'E'; angle = az; }
    else if (az <= 180) { ns = 'S'; ew = 'E'; angle = 180 - az; }
    else if (az <= 270) { ns = 'S'; ew = 'W'; angle = az - 180; }
    else { ns = 'N'; ew = 'W'; angle = 360 - az; }
    return ns + ' ' + formatDMS(angle) + ' ' + ew;
  }

  /** 8 mata angin terdekat dari suatu azimuth, mis. "Timur Laut". */
  const COMPASS_POINTS = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
  function compassPointName(az) {
    const idx = Math.round(az / 45) % 8;
    return COMPASS_POINTS[idx];
  }

  /** Format derajat desimal menjadi D°M'S". */
  function formatDMS(deg) {
    const d = Math.floor(deg);
    const minFloat = (deg - d) * 60;
    const m = Math.floor(minFloat);
    const s = Math.round((minFloat - m) * 60);
    return d + '°' + String(m).padStart(2, '0') + "'" + String(s).padStart(2, '0') + '"';
  }

  /** Format meter -> "1.24 km" (>=1000 m) atau "350 m". */
  function formatDistance(meters) {
    if (!meters || meters < 0) meters = 0;
    if (meters >= 1000) return (meters / 1000).toFixed(2) + ' km';
    return Math.round(meters) + ' m';
  }

  /** Format m² -> "2.350 Ha (23.500 m²)" (>=1000 m²) atau "480 m²". */
  function formatArea(sqm) {
    if (!sqm || sqm < 0) sqm = 0;
    if (sqm >= 1000) {
      const ha = sqm / 10000;
      return ha.toFixed(3) + ' Ha (' + Math.round(sqm).toLocaleString('id-ID') + ' m²)';
    }
    return Math.round(sqm) + ' m²';
  }

  return {
    distanceMeters, totalDistance, perimeter, polygonAreaSqm,
    azimuthDeg, azimuthToQuadrantBearing, compassPointName, formatDMS,
    formatDistance, formatArea
  };
})();
