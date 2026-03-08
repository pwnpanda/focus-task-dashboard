// app.js
import {
  loadFromStorage, decodeStateFromHash, saveToStorage,
  clearHash, emptyState,
} from './modules/state.js';
import { render } from './modules/ui.js';

let state = emptyState();

function init() {
  const hashState = decodeStateFromHash();
  const localState = loadFromStorage();

  if (hashState) {
    const useShared = confirm(
      'A shared goal was found in the URL.\n\nUse it? (Cancel to keep your local state)'
    );
    clearHash();
    state = useShared ? hashState : (localState ?? emptyState());
  } else {
    state = localState ?? emptyState();
  }

  renderApp();
}

export function updateState(newState) {
  state = newState;
  saveToStorage(state);
  renderApp();
}

export function getState() {
  return state;
}

function renderApp() {
  render(document.getElementById('app'), state, updateState);
}

init();
