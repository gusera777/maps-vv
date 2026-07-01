/**
 * track.js (baru di V4 — Track Recorder)
 * Util murni untuk perekaman jalur: hitung jarak antar titik GPS (Haversine)
 * dan format durasi berjalan. Logika rekam/­pause/resume/stop & penyimpanan
 * ada di app.js (state) + storage.js (object store "tracks", baru di V4).
 */
const GuseraTrack = (() => {
  const EARTH_RADIUS_M = 6371000;

  /** Jarak antara dua koordinat lat/lng dalam meter (rumus Haversine). */
  function distanceMeters(lat1, lng1, lat2, lng2) {
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /** Total jarak (meter) dari rangkaian titik { lat, lng }. */
  function totalDistance(points) {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += distanceMeters(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
    }
    return total;
  }

  /** Format meter -> "1.2 km" atau "350 m". */
  function formatDistance(meters) {
    if (meters >= 1000) return (meters / 1000).toFixed(2) + ' km';
    return Math.round(meters) + ' m';
  }

  /** Format milidetik -> "hh:mm:ss" atau "mm:ss". */
  function formatDuration(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s);
  }

  /** Kecepatan rata-rata (km/h) dari jarak (meter) & durasi (ms). */
  function averageSpeedKmh(meters, ms) {
    if (ms <= 0) return 0;
    const hours = ms / 3600000;
    return meters / 1000 / hours;
  }

  return { distanceMeters, totalDistance, formatDistance, formatDuration, averageSpeedKmh };
})();
