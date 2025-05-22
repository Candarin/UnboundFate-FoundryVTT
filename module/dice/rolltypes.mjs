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
export async function rollSkillPool({ skillKey, skillRating, abilityKey, abilityValue, modifier, threshold = 0, actor }) {
  const totalPool = skillRating + abilityValue + modifier;
  const formula = `${totalPool}d6cs>=5`;
  const label = `${skillKey.capitalize()} + ${abilityKey ? abilityKey.capitalize() : ''} (${skillRating}+${abilityValue}${modifier ? `+${modifier}` : ''})`;
  const roll = new Roll(formula, actor.getRollData());
  await roll.evaluate({async: true});
  // Count successes (5 or 6) and apply 'success' class
  const dice = roll.dice[0]?.results || [];
  let successes = 0;
  for (const d of dice) {
    if (d.result >= 5) {
      d.classes = d.classes || [];
      //if (!d.classes.includes('success')) d.classes.push('success');
      successes++;
    }
  }
  // Custom roll HTML without total section
  let rollHTML = await roll.render();
  rollHTML = rollHTML.replace(/<div class="dice-total">[\s\S]*?<\/div>/, '');
  const successText = `<strong>Successes:</strong> ${successes} / <strong>Threshold:</strong> ${threshold}`;
  let outcome = '';
  if (threshold > 0) {
    outcome = `<div class="roll-outcome" style="margin-top:0.5em;font-weight:bold;">${successes >= threshold ? '<span style="color:green;">Success</span>' : '<span style="color:red;">Failure</span>'}</div>`;
  }
  roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `${label}<br>${successText}${outcome}`,
    rollMode: game.settings.get('core', 'rollMode'),
    content: rollHTML
  });
}