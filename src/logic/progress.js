/**
 * Progress store — persists game completions to localStorage.
 *
 * Shape: { completions: { [locationId]: string[] } }  (ISO timestamp strings)
 */

const KEY = 'weslo_progress';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { completions: {} };
  } catch {
    return { completions: {} };
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

/** Record a win for a location. */
export function recordWin(locationId) {
  const data = load();
  if (!data.completions[locationId]) data.completions[locationId] = [];
  data.completions[locationId].push(new Date().toISOString());
  save(data);
}

/** Returns true if the location has been completed at least once. */
export function hasCompleted(locationId) {
  return (load().completions[locationId] || []).length > 0;
}

/** Returns the most recent completion timestamp for a location, or null. */
export function lastCompleted(locationId) {
  const times = load().completions[locationId] || [];
  return times.length ? times[times.length - 1] : null;
}
