/**
 * Returns the equipped weapon with the highest parry rating for the given actor.
 * @param {Actor} actor - The actor to search for equipped weapons.
 * @returns {Item|null} The equipped weapon with the highest parry, or null if none.
 */
export function getEquippedWeaponWithHighestParry(actor) {
  if (!actor || !actor.items) return null;
  const weapons = actor.items.filter(i => i.type === 'weapon' && i.system.isEquipped);
  if (!weapons.length) return null;
  return weapons.reduce((max, w) => {
    const parry = w.system?.parry ?? 0;
    const maxParry = max.system?.parry ?? 0;
    return parry > maxParry ? w : max;
  }, weapons[0]);
}

/**
 * Returns the equipped shield with the highest block rating for the given actor.
 * @param {Actor} actor - The actor to search for equipped shields.
 * @returns {Item|null} The equipped shield with the highest block, or null if none.
 */
export function getReadiedShieldWithHighestRating(actor) {
  if (!actor || !actor.items) return null;
  const shields = actor.items.filter(i => i.type === 'shield' && i.system.isEquipped && i.system.isReadied);
  if (!shields.length) return null;
  return shields.reduce((max, s) => {
    const block = s.system?.shieldRating ?? 0;
    const maxBlock = max.system?.shieldRating ?? 0;
    return block > maxBlock ? s : max;
  }, shields[0]);
}

/**
 * Converts a damage array to a readable string for display or chat.
 * @param {Array} damageArray - Array of damage objects {label, formula, type, source}
 * @returns {string} - Human-readable damage string
 */
export function damageArrayToString(damageArray) {
  if (!Array.isArray(damageArray) || damageArray.length === 0) return '';
  return damageArray.map(dmg => {
    let str = dmg.formula || '';
    if (dmg.type) str += ` ${dmg.type}`;
    if (dmg.label) str = `${dmg.label}: ${str}`;
    return str;
  }).join(' + ');
}

/**
 * Updates the HP log for an actor, appending a new entry and trimming to the configured max size.
 * @param {Actor} actor - The actor whose HP log to update.
 * @param {number} hpChange - The amount of HP changed (positive or negative).
 * @param {string} message - A message or template describing the change.
 * @param {object} [options] - Optional extra data (e.g., source, timestamp override).
 */
export async function updateHpLog(actor, hpChange, message, options = {}) {
  if (!actor || !actor.system?.logHitpoints?.enabled) return;
  const log = Array.isArray(actor.system.logHitpoints.log) ? [...actor.system.logHitpoints.log] : [];
  const maxEntries = game.settings.get("unboundfate", "hpLogMaxEntries") || 20;
  const entry = {
    timestamp: options.timestamp || Date.now(),
    hpChange,
    message,
    // Prefer explicit newCurrentHP if provided, else use options.currentHP, else actor's currentHP
    currentHP: options.newCurrentHP ?? options.currentHP ?? actor.system.hitPoints?.currentHP ?? null,
    ...options
  };
  log.push(entry);
  while (log.length > maxEntries) log.shift();
  await actor.update({ "system.logHitpoints.log": log });
}

/**
 * Applies rolled damage to an actor and logs the HP change.
 * @param {Actor} actor - The actor to apply damage to.
 * @param {Array} rolledDamageArray - Array of rolled damage objects (must include .total).
 * @param {Actor|null} sourceActor - The source of the damage (optional).
 * @param {string} message - Optional message for the HP log.
 */
export async function applyDamageToActor(actor, rolledDamageArray, sourceActor = null, message = '') {
  if (!actor || !Array.isArray(rolledDamageArray) || rolledDamageArray.length === 0) return;
  const totalDamage = rolledDamageArray.reduce((sum, d) => sum + (typeof d.total === 'number' ? d.total : 0), 0);
  const prevHP = actor.system.hitPoints?.currentHP ?? 0;
  const newHP = Math.max((prevHP - totalDamage), 0);
  await actor.update({ 'system.hitPoints.currentHP': newHP });
  // Log the HP change
  if (actor.system?.logHitpoints?.enabled) {
    await updateHpLog(actor, -totalDamage, message || `Took ${totalDamage} damage`, { newCurrentHP: newHP, sourceActorId: sourceActor?.id });
  }
}
