import { UFRoll } from './UFRoll.mjs';

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
export async function rollSkillPool({ skillKey, skillRating, abilityKey, abilityValue, modifier, targetNumber = 0, actor, rollMode, useSpec, specialisation, modifiersString }) {
  const totalPool = skillRating + abilityValue + modifier + (useSpec ? 2 : 0);
  const formula = `${totalPool}d6cs>=5`;
  const label = `${skillKey.capitalize()} + ${abilityKey ? abilityKey.capitalize() : ''} (${skillRating}+${abilityValue}${modifier ? `+${modifier}` : ''})`;
  const roll = new UFRoll(formula, actor.getRollData(), { targetNumber });
  await roll.evaluate();
  // No need to manually count or mark successes, cs>=5 handles it
  let successes = roll.hits;
  // Custom roll HTML without total section
  let rollHTML = await roll.render();
  rollHTML = rollHTML.replace(/<div class="dice-total">[\s\S]*?<\/div>/, '');
  const successText = `<strong>Successes:</strong> ${successes} / <strong>Target Number:</strong> ${targetNumber}`;
  let outcome = '';
  if (targetNumber > 0) {
    outcome = `<div class="roll-outcome" style="margin-top:0.5em;font-weight:bold;">${roll.isSuccess() ? '<span style="color:green;">Success</span>' : '<span style="color:red;">Failure</span>'}</div>`;
  }
  const modifiersHtml = modifiersString ? `<div class="modifiers-string" style="margin-bottom:0.5em;">${modifiersString}</div>` : '';
  roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `${label}<br>${modifiersHtml}${successText}${outcome}`,
    rollMode: rollMode || game.settings.get('core', 'rollMode'),
    content: rollHTML
  });
}