// Gated debug logging. Flip DEBUG to true to re-enable verbose console.log output
// across the app. console.error / console.warn are intentionally NOT gated — real
// failures should always surface.
const DEBUG = false;

export const debugLog = (...args: unknown[]) => {
  if (DEBUG) console["log"](...args);
};
