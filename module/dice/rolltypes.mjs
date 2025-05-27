import { UFRoll } from './UFRoll.mjs';
import { launchWeaponDodgeDialog } from '../dialogs/weapondodge-dialog.mjs';

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

/**
 * Rolls a weapon attack and sends the result to chat.
 * @param {object} params
 * @param {object} params.weapon - The weapon item object
 * @param {Actor} params.actor - The attacking actor
 * @param {Array<Token>} params.targets - Array of targeted tokens
 * @param {string} params.totalPool - The total pool of dice to roll (required)
 * @param {string} params.modifierList - A concatenated string of modifiers (optional) to display on the chat message
 */
export async function rollWeaponAttack({ weapon, actor, targets = [], totalPool, modifierList = ''}) {
  // Get weapon and skill info
  const weaponName = weapon.name;
  const damage1H = weapon.system.damage1H || '';
  const damage2H = weapon.system.damage2H || '';
  const weaponType = weapon.system.weaponType || '';
  

  // For now, use 1H damage
  const damage = damage1H;

  // Compose target names for chat
  const targetNames = (targets && targets.length)
    ? targets.map(t => t.name).join(', ')
    : '<em>None</em>';

  
  

  const formula = `${totalPool}d6cs>=5`;
  const roll = new UFRoll(formula, actor.getRollData(), { targetNumber: 0 });
  await roll.evaluate();
  const successes = roll.hits;
  const rollHTML = (await roll.render()).replace(/<div class="dice-total">[\s\S]*?<\/div>/, '');

  // Build chat content with a Dodge button for each target
  let dodgeButtons = '';
  if (targets && targets.length) {
    dodgeButtons = '<div class="dodge-buttons" style="margin-top:0.5em;">';
    for (const t of targets) {
      dodgeButtons += `<button class="dodge-roll" data-token-id="${t.id}" data-actor-id="${t.actor?.id || ''}">Dodge (${t.name})</button> `;
    }
    dodgeButtons += '</div>';
  }

  // Build content for chat message
  let rollContent = `<strong>${weaponName}</strong> Attack Roll<br>`;
  rollContent += `<strong>Weapon Type:</strong> ${weaponType}<br>`;
  rollContent += `${modifierList ? `<div class="modifiers-string">${modifierList}</div>` : ''}`;
  rollContent += `<hr>`;
  rollContent += `<h4>Targets:</h4><br>${targetNames}`;

  // Output to chat
  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `${modifierList}<br><strong>Successes:</strong> ${successes}${dodgeButtons}`,
    content: rollHTML,
    roll: roll
  });
}

/**
 * Rolls a dodge defense against a weapon attack, using dialog for options/modifiers.
 * @param {object} params
 * @param {Actor} params.actor - The defending actor
 * @param {Actor} params.attackingActor - The attacking actor
 * @param {object} params.options - Optional: { attackLabel, successes, weapon, etc. }
 */
export async function rollWeaponDodge({ actor, attackingActor, options = {} }) {
  // Gather dodge pool: ability + parry + modifier
  const abilityKey = options.abilityKey || 'dex';
  const abilityValue = options.abilityValue || (actor.system.abilities?.[abilityKey]?.value ?? 0);
  const parry = options.parry || 0;
  const modifier = options.modifier || 0;
  const totalPool = abilityValue + parry + modifier;
  const formula = `${totalPool}d6cs>=5`;
  const targetNumber = options.targetNumber || options.attackSuccesses || 0;
  const label = options.attackLabel || `Dodge${attackingActor ? ' vs ' + attackingActor.name : ''}`;
  const modifiersHtml = options.modifiersString ? `<div class="modifiers-string" style="margin-bottom:0.5em;">${options.modifiersString}</div>` : '';

  // Roll dodge
  const roll = new UFRoll(formula, actor.getRollData(), { targetNumber });
  await roll.evaluate();
  const successes = roll.hits;
  let rollHTML = await roll.render();
  rollHTML = rollHTML.replace(/<div class="dice-total">[\s\S]*?<\/div>/, '');
  const successText = `<strong>Successes:</strong> ${successes} / <strong>Target Number:</strong> ${targetNumber}`;
  let outcome = '';
  if (targetNumber > 0) {
    outcome = `<div class="roll-outcome" style="margin-top:0.5em;font-weight:bold;">${roll.isSuccess() ? '<span style="color:green;">Success</span>' : '<span style="color:red;">Failure</span>'}</div>`;
  }

  // Output to chat
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `${label}<br>${modifiersHtml}${successText}${outcome}`,
    rollMode: options.rollMode || game.settings.get('core', 'rollMode'),
    content: rollHTML,
    style: CONST.CHAT_MESSAGE_STYLES.ROLL
  });

  // If the dodge failed, roll damage from the attacking actor
  if (targetNumber > 0 && !roll.isSuccess()) {
    const weapon = options.weapon || (options.chatMessageData?.flags?.weapon ?? null);
    const damage = options.damage || weapon?.system?.damage1H || weapon?.system?.damage || '';
    if (attackingActor && weapon && damage) {
      await rollWeaponDamage({ weapon, attacker: attackingActor, target: actor, damage });
    }
  }
}

/**
 * Rolls weapon damage and sends the result to chat.
 * @param {object} params
 * @param {object} params.weapon - The weapon item object
 * @param {Actor} params.attacker - The attacking actor
 * @param {Actor} params.target - The defending actor
 * @param {string} params.damage - The damage formula (e.g., '2d6')
 */
export async function rollWeaponDamage({ weapon, attacker, target, damage }) {
  if (!damage) {
    ui.notifications.warn('No damage formula specified for this weapon.');
    return;
  }
  const label = `<strong>${weapon.name}</strong> Damage to ${target?.name || 'Target'}`;
  const roll = new Roll(damage, attacker.getRollData());
  await roll.evaluate();
  let rollHTML = await roll.render();
  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: attacker }),
    flavor: label,
    content: rollHTML,
    roll: roll,
    style: CONST.CHAT_MESSAGE_STYLES.ROLL
  });
}