/**
 * Rolls a skill pool and sends the result to chat.
 * @param {object} params
 * @param {string} params.skillKey
 * @param {number} params.skillRating
 * @param {string} params.abilityKey
 * @param {number} params.abilityValue
 * @param {number} params.modifier
 * @param {Actor} params.actor
 */
export async function rollSkillPool({ skillKey, skillRating, abilityKey, abilityValue, modifier, actor }) {
  const totalPool = skillRating + abilityValue + modifier;
  const formula = `${totalPool}d6`;
  const label = `${skillKey.capitalize()} + ${abilityKey ? abilityKey.capitalize() : ''} (${skillRating}+${abilityValue}${modifier ? `+${modifier}` : ''})`;
  const roll = new Roll(formula, actor.getRollData());
  await roll.evaluate({async: true});
  // Count successes (5 or 6)
  const dice = roll.dice[0]?.results || [];
  const successes = dice.filter(d => d.result >= 5).length;
  const successText = `<strong>Successes:</strong> ${successes}`;
  roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `${label}<br>${successText}`,
    rollMode: game.settings.get('core', 'rollMode'),
  });
}