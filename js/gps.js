/**
 * gps.js
 * Sumber posisi & arah realtime untuk GUSERA Maps.
 *  - Posisi, akurasi, altitude, kecepatan: Geolocation API (navigator.geolocation.watchPosition)
 *  - Arah hadap (heading): DeviceOrientation API (kompas magnetometer perangkat),
 *    dengan fallback ke "course" dari GPS (coords.heading) bila kompas perangkat
 *    tidak tersedia — course GPS hanya valid saat perangkat bergerak.
 * Semua berjalan di perangkat; tidak ada data yang dikirim ke server manapun.
 */
const GuseraGPS = (() => {
  let watchId = null;
  let orientationHandler = null;
  let active = false;
  let hasCompass = false;

  function toKmh(metersPerSecond) {
    return metersPerSecond == null ? null : metersPerSecond * 3.6;
  }

  /** Di iOS 13+, akses sensor orientasi butuh izin eksplisit lewat gesture pengguna. */
  async function requestCompassPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const result = await DeviceOrientationEvent.requestPermission();
        return result === 'granted';
      } catch (e) {
        return false;
      }
    }
    return true; // Android & browser lain umumnya tidak perlu izin eksplisit
  }

  function attachCompass(onHeading) {
    const handler = (e) => {
      let heading = null;
      if (typeof e.webkitCompassHeading === 'number') {
        heading = e.webkitCompassHeading; // Safari iOS: sudah searah jarum jam dari Utara
      } else if (e.absolute === true && e.alpha != null) {
        heading = 360 - e.alpha; // Chrome/Android: alpha berlawanan arah jarum jam
      }
      if (heading != null) {
        hasCompass = true;
        onHeading(((heading % 360) + 360) % 360, 'compass');
      }
    };
    orientationHandler = handler;
    window.addEventListener('deviceorientationabsolute', handler, true);
    window.addEventListener('deviceorientation', handler, true);
  }

  function detachCompass() {
    if (orientationHandler) {
      window.removeEventListener('deviceorientationabsolute', orientationHandler, true);
      window.removeEventListener('deviceorientation', orientationHandler, true);
      orientationHandler = null;
    }
    hasCompass = false;
  }

  /**
   * Mulai pelacakan GPS + kompas.
   * callbacks: { onPosition(data), onHeading(deg, source), onError(err) }
   */
  async function start({ onPosition, onHeading, onError }) {
    if (!('geolocation' in navigator)) {
      onError && onError(new Error('Perangkat/browser ini tidak mendukung Geolocation API.'));
      return false;
    }

    await requestCompassPermission();
    attachCompass((deg, source) => onHeading && onHeading(deg, source));

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const c = pos.coords;
        // Course dari GPS dipakai sebagai arah hadap hanya jika kompas perangkat belum pernah terbaca.
        if (!hasCompass && c.heading != null && !Number.isNaN(c.heading)) {
          onHeading && onHeading(c.heading, 'gps');
        }
        onPosition && onPosition({
          lat: c.latitude,
          lng: c.longitude,
          accuracy: c.accuracy,
          altitude: c.altitude,
          altitudeAccuracy: c.altitudeAccuracy,
          speedKmh: toKmh(c.speed),
          timestamp: pos.timestamp
        });
      },
      (err) => onError && onError(err),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );

    active = true;
    return true;
  }

  function stop() {
    if (watchId != null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    detachCompass();
    active = false;
  }

  function isActive() {
    return active;
  }

  return { start, stop, isActive };
})();
