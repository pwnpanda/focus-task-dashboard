// modules/state.js

const STORAGE_KEY = 'focus-tracker';

export function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveToStorage(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function encodeStateToHash(state) {
  return '#' + btoa(JSON.stringify(state));
}

export function decodeStateFromHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  try {
    return JSON.parse(atob(hash));
  } catch {
    return null;
  }
}

export function clearHash() {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

export function emptyState() {
  return { version: 2, goals: [], archive: [], activeGoalId: null };
}

/**
 * Migrate state from older versions to current schema.
 * v1 -> v2: add archive array and activeGoalId.
 */
export function migrateState(state) {
  if (!state) return null;
  if (state.version === 1) {
    return {
      version: 2,
      goals: state.goals ?? [],
      archive: [],
      activeGoalId: state.goals?.[0]?.id ?? null,
    };
  }
  return state;
}
