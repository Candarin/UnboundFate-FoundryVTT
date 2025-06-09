import { UFRoll } from './UFRoll.mjs';
import { launchWeaponDodgeDialog } from '../dialogs/weapondodge-dialog.mjs';
import { damageArrayToString } from '../helpers/actor-utils.mjs';
import { ufLog } from '../helpers/system-utils.mjs';

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
  ufLog('Rolling Skill Pool:', { skillKey, skillRating, abilityKey, abilityValue, modifier, targetNumber, actor, rollMode, useSpec, specialisation, modifiersString });
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
export async function rollWeaponAttack({ weapon, actor, targets = [], totalPool, modifierList = '', attackType, damageArray, attackerTokenId }) {
  ufLog('Rolling Weapon Attack:', { weapon, actor, targets, totalPool, modifierList, attackType, damageArray, attackerTokenId });
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

  
  const damageString = Array.isArray(damageArray) && damageArray.length > 0 ? damageArrayToString(damageArray) : '';

  const formula = `${totalPool}d6cs>=5`;
  const roll = new UFRoll(formula, actor.getRollData(), { targetNumber: 0 });
  await roll.evaluate();
  const successes = roll.hits;
  const rollHTML = (await roll.render()).replace(/<div class="dice-total">[\s\S]*?<\/div>/, '');
  
  // Build chat content with a single Dodge button (global, not per target)
  const dodgeButtons = '<div class="dodge-buttons" style="margin-top:0.5em;"><button class="dodge-roll">Dodge</button></div>';

  // Generate handlebars templates
  // Use attackerTokenId if provided, else fallback to first active token
  const attackerTokenIdFinal = attackerTokenId || actor.getActiveTokens()[0]?.id || null;
  const actorHeader = await renderTemplate('systems/unboundfate/templates/chat/chat-actor.hbs', { actor, actorType: 'attacker', tokenId: attackerTokenIdFinal });
  const weaponHeader = await renderTemplate('systems/unboundfate/templates/chat/chat-weapon.hbs', { weapon });
  // For single target, get their tokenId (if targets is array of tokens)
  let targetContent = '';
  if (targets.length === 1) {
    const targetToken = targets[0];
    let targetActor = targetToken.actor;
    let targetTokenId = targetToken.id || (targetActor?.getActiveTokens?.()[0]?.id) || null;
    targetContent = await renderTemplate('systems/unboundfate/templates/chat/chat-actor.hbs', { actor: targetActor, actorType: 'target', tokenId: targetTokenId });
  }
  
  // Build content for chat message
  let rollContent = `<h3>${attackType} Attack</h3>`; 
  rollContent += actorHeader;
  rollContent += `<hr>`;
  rollContent += weaponHeader;
  rollContent += `${modifierList ? `<div class="modifiers-string">${modifierList}</div>` : ''}`;
  rollContent += `<hr>`;
  rollContent += `<div class="damage-string">Damage:<span>${damageString}</span></div>`;
  rollContent += `<hr>`;
  rollContent += `<h4>Targets:</h4>`;
  rollContent += targets.length > 1 ? `${targetNames}` : targetContent;
  rollContent += `<hr>`;
  rollContent += `<strong>Successes:</strong><span id="successes" name="successes" style="color:${successes > 0 ? 'green' : 'red'};"> ${successes}</span>`;
  rollContent += `${dodgeButtons}`;

  // Output to chat
  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: rollContent,
    content: rollHTML,
    roll: roll,
    flags: {
      weapon,
      damageArray // Pass the array for downstream dialogs (dodge, damage, etc.)
    }
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
  const totalPool = options.totalPool || 0;  
  const modifiersString = options.modifiersString || '';
  const targetNumber = options.targetNumber || options.attackSuccesses || 0;


  // Formula for the dodge roll
  const formula = `${totalPool}d6cs>=5`;

  // Roll dodge
  const roll = new UFRoll(formula, actor.getRollData(), { targetNumber });
  await roll.evaluate();
  const successes = roll.hits;
  let rollHTML = await roll.render();
  rollHTML = rollHTML.replace(/<div class="dice-total">[\s\S]*?<\/div>/, '');
 
  // Determine if the dodge was successful
  const outcome = successes >= targetNumber;
  // Prepare the success template data
  const successMessage = "Dodged!";
  const failMessage = "Failed to dodge!";

  const rollActor = await renderTemplate('systems/unboundfate/templates/chat/chat-actor.hbs', { actor, actorType: 'defender' });
  const rollOutcomeContent = await renderTemplate('systems/unboundfate/templates/chat/chat-success-vs-target.hbs', {
    outcome,
    successMessage,
    failMessage,
    successes,
    targetNumber
  });


  // Roll Content
  let rollContent = `<h3>Dodge Roll</h3>`;
  rollContent += rollActor;
  rollContent += `<hr>`;
  rollContent += `${modifiersString ? `<div class="modifiers-string">${modifiersString}</div>` : ''}`;
  rollContent += `<hr>`;
  rollContent += rollOutcomeContent;


  // Output to chat
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: rollContent,
    rollMode: options.rollMode || game.settings.get('core', 'rollMode'),
    content: rollHTML,
    style: CONST.CHAT_MESSAGE_STYLES.ROLL
  });

  // If the dodge failed, roll damage from the attacking actor
  if (!outcome) {
    const weapon = options.weapon || (options.chatMessageData?.flags?.weapon ?? null);
    // Prefer structured damageArray if present
    const damageArray = options.damageArray || options.chatMessageData?.flags?.damageArray || [];
    const attacker = attackingActor;
    if (attacker && weapon && Array.isArray(damageArray) && damageArray.length > 0) {
      // Create a chat message with a button to roll damage
      const damageString = damageArrayToString(damageArray);
      const label = `<strong>${weapon.name}</strong> Damage to ${actor?.name || 'Target'}`;
      const buttonId = `roll-damage-${randomID()}`;
      const content = `
        <div><strong>Damage:</strong> <span>${damageString}</span></div>
        <button class="roll-damage-btn" id="${buttonId}">Roll Damage</button>
      `;
      const msg = await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: attacker }),
        flavor: label,
        content,
        flags: {
          weapon,
          damageArray,
          attackerId: attacker.id,
          targetId: actor.id
        }
      });
      Hooks.once('renderChatMessage', (chatMsg, html) => {
        if (chatMsg.id !== msg.id) return;
        html.find(`#${buttonId}`).on('click', async () => {
          await rollDamageArray({ weapon, attacker, target: actor, damageArray });
        });
      });
    } else {
      // Fallback to old logic if no array
      const damage = options.damage || weapon?.system?.damage1H || weapon?.system?.damage || '';
      if (attacker && weapon && damage) {
        await rollWeaponDamage({ weapon, attacker, target: actor, damage });
      }
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

/**
 * Rolls a structured damage array and sends the result to chat.
 * @param {object} params
 * @param {object} params.weapon - The weapon item object
 * @param {Actor} params.attacker - The attacking actor
 * @param {Actor} params.target - The defending actor
 * @param {Array} params.damageArray - Array of damage objects {label, formula, type, source}
 */
export async function rollDamageArray({ weapon, attacker, target, damageArray }) {
  if (!Array.isArray(damageArray) || damageArray.length === 0) {
    ui.notifications.warn('No valid damage array provided.');
    return;
  }
  // Import the utility for string conversion
  const damageString = damageArrayToString(damageArray);
  // Combine all formulas for a single roll, or roll each separately as needed
  const formulas = damageArray.map(d => d.formula).join(' + ');
  const roll = new Roll(formulas, attacker.getRollData());
  await roll.evaluate();
  let rollHTML = await roll.render();
  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: attacker }),
    flavor: `<strong>${weapon.name}</strong> Damage Roll to ${target?.name || 'Target'}<br><span>${damageString}</span>`,
    content: rollHTML,
    style: CONST.CHAT_MESSAGE_STYLES.ROLL
  });
}