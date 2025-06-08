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
