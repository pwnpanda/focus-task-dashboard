// modules/logger.js
// Set DEBUG = false before deploying to production to silence all debug output.
export const DEBUG = true;

const P = '[FocusTracker]';

export const debug = (...a) => { if (DEBUG) console.debug(P, ...a); };
export const info  = (...a) => { if (DEBUG) console.info(P,  ...a); };
export const warn  = (...a) => { if (DEBUG) console.warn(P,  ...a); };
export const error = (...a) => console.error(P, ...a); // always on
