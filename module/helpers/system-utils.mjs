// filepath: c:/Users/bryce/VS Code Repos/UnboundFate-FoundryVTT/module/helpers/system-utils.mjs

/**
 * Logs a message to the console with the Unbound Fate system prefix.
 * @param {string} message - The message to log.
 * @param {...any} args - Additional arguments to pass to console.log.
 */
export function ufLog(message, ...args) {
  console.log(`Unbound Fate | ${message}`, ...args);
}
