// Official Launch Target: September 4, 2026 at 00:00:00 IST (UTC+05:30)
export const LAUNCH_DATE_ISO = '2026-09-04T00:00:00+05:30';
export const LAUNCH_TIMESTAMP = new Date(LAUNCH_DATE_ISO).getTime();

/**
 * Calculates remaining time until launch timestamp
 * @param {number} targetMs Optional target timestamp, defaults to LAUNCH_TIMESTAMP
 * @returns {object} { days, hours, minutes, seconds, totalMs, isLaunched }
 */
export function getTimeRemaining(targetMs = LAUNCH_TIMESTAMP) {
  const now = Date.now();
  const diff = targetMs - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isLaunched: true,
    };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diff,
    isLaunched: false,
  };
}

/**
 * Checks if current time is past official launch date (or if developer override parameter is present)
 */
export function isLaunched() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('launched') === 'true' || params.get('override') === 'true') {
      return true;
    }
  }
  return Date.now() >= LAUNCH_TIMESTAMP;
}
