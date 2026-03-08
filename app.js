// app.js
import {
  loadFromStorage, decodeStateFromHash, saveToStorage,
  clearHash, emptyState, migrateState,
} from './modules/state.js';
import { toDateString } from './modules/goal.js';
import { render } from './modules/ui.js';

let state = emptyState();

// Goals finishing today that need a celebration before archiving.
// Managed as transient UI state, not persisted.
let celebrationQueue = [];

function autoArchive() {
  const today = toDateString(new Date());
  const finishing = state.goals.filter(g => today > g.endDate);
  if (finishing.length === 0) return;

  const finishingIds = new Set(finishing.map(g => g.id));
  const remaining = state.goals.filter(g => !finishingIds.has(g.id));
  const newArchive = [...finishing, ...state.archive];

  let newActiveId = state.activeGoalId;
  if (finishingIds.has(newActiveId)) {
    newActiveId = remaining[0]?.id ?? (newArchive.length > 0 ? 'archive' : null);
  }

  state = { ...state, goals: remaining, archive: newArchive, activeGoalId: newActiveId };
}

function queueCelebrations() {
  const today = toDateString(new Date());
  state.goals.forEach(g => {
    if (g.endDate === today && !celebrationQueue.includes(g.id)) {
      celebrationQueue.push(g.id);
    }
  });
  if (celebrationQueue.length > 0) {
    state = { ...state, activeGoalId: celebrationQueue[0] };
  }
}

// Called from ui.js after the celebration animation for goalId completes.
export function onCelebrationDone(goalId) {
  const goal = state.goals.find(g => g.id === goalId);
  if (goal) {
    state = {
      ...state,
      goals: state.goals.filter(g => g.id !== goalId),
      archive: [goal, ...state.archive],
    };
  }
  celebrationQueue = celebrationQueue.filter(id => id !== goalId);
  if (celebrationQueue.length > 0) {
    state = { ...state, activeGoalId: celebrationQueue[0] };
  } else {
    const next = state.goals[0];
    state = { ...state, activeGoalId: next?.id ?? (state.archive.length > 0 ? 'archive' : null) };
  }
  saveToStorage(state);
  renderApp();
}

export function getCelebrationQueue() {
  return [...celebrationQueue];
}

function init() {
  const hashState = decodeStateFromHash();
  const rawLocal = loadFromStorage();

  let loaded;
  if (hashState) {
    const useShared = confirm('A shared goal was found in the URL.\n\nUse it? (Cancel to keep your local state)');
    clearHash();
    loaded = useShared ? hashState : rawLocal;
  } else {
    loaded = rawLocal;
  }

  state = migrateState(loaded) ?? emptyState();
  autoArchive();
  queueCelebrations();
  saveToStorage(state);
  renderApp();
}

export function updateState(newState) {
  state = newState;
  autoArchive();
  queueCelebrations();
  saveToStorage(state);
  renderApp();
}

export function getState() {
  return state;
}

function renderApp() {
  render(document.getElementById('app'), state, updateState, celebrationQueue, onCelebrationDone);
}

init();
