import { rollWeaponDodge } from '../dice/rolltypes.mjs';
import { getEquippedWeaponWithHighestParry, getReadiedShieldWithHighestRating } from '../helpers/actor-utils.mjs';

/**
 * Launches a dialog for a weapon dodge roll, allowing the user to select ability, weapon, and modifiers.
 * @param {object} params
 * @param {Actor} params.actor - The defending actor
 * @param {Actor} params.attackingActor - The attacking actor
 * @param {object} params.options - Optional: { attackLabel, successes, weapon, etc. }
 * @returns {Promise<object|null>} Resolves with the selected options or null if cancelled
 */
export function launchWeaponDodgeDialog({ actor, attackingActor, options = {} }) {
  

  // Default targetNumber from options.successes or 0
  const attackSuccesses = options.successes ?? 0;
  const targetNumber = options.successes ?? 0;

    // Ability 1: Agility
  const ability1Key = 'agi';
  const ability1Value = actor.system.abilities?.[ability1Key]?.value || 0;

  // Ability 2: Awareness
  const ability2Key = "awa";
  const ability2Value = actor.system.abilities?.[ability2Key]?.value || 0;

  // Ability Options
  const abilities = CONFIG.UNBOUNDFATE.abilities || {};
  const abilityKeys = Object.keys(abilities);
  const ability1Options = abilityKeys.map(key => ({
    key,
    label: game.i18n.localize(abilities[key]),
    selected: key === ability1Key
  }));
  const ability2Options = abilityKeys.map(key => ({
    key,
    label: game.i18n.localize(abilities[key]),
    selected: key === ability2Key
  }));

  // Weapon and Parry
  const actorWeaponList = actor.items.filter(i => i.type === 'weapon' && i.system.isEquipped);
  const actorWeaponEquipped = getEquippedWeaponWithHighestParry(actor);
  const actorWeaponOptions = actorWeaponList.map(weapon => ({
    key: weapon.id,
    label: `${weapon.name} (Parry: ${weapon.system.parry || 0})`,
    selected: weapon.id === actorWeaponEquipped?.id
  }));
  const actorWeaponParry = actorWeaponEquipped?.system?.parry || 0;
  const actorWeaponSkillKey = actorWeaponEquipped?.system?.skill || '';
  const actorWeaponSkillRating = actor.system.skills?.[actorWeaponSkillKey]?.rating || 0; // Use the weapon's skill rating if available
  const actorParry = Math.min(actorWeaponParry, actor.system.skills?.[actorWeaponSkillKey]?.rating || 0); // Use the weapon's parry or the skill rating, whichever is lower

  // Armor (deflect rating from armor items)
  const actorArmorList = actor.items.filter(i => i.type === 'armor' && i.system.isEquipped); 
  const actorArmorDeflect = actorArmorList.reduce((total, armor) => total + (armor.system.deflect || 0), 0);
  const actorArmorListString = actorArmorList.map(armor => `${armor.name} (Deflect: ${armor.system.deflect || 0})`).join(', ');
  
  // Shield
  const actorShieldList = actor.items.filter(i => i.type === 'shield' && i.system.isEquipped);
  const actorShieldReadied = getReadiedShieldWithHighestRating(actor);
  const actorShieldRating = actorShieldReadied?.system?.shieldRating || 0; // Use the highest block rating from readied shields 
  
  // Modifier (default to 0, can be set in dialog)
  const modifier = options.modifier || 0; // Default modifier, can be set in dialog

  // Calculate Modifier String
  let modifierList = '';
  



  // Calculate current total pool
  const totalPool = ability1Value + ability2Value + actorParry + actorArmorDeflect + actorShieldRating + modifier; //


  // Set Template Data
  const templateData = {       
    attackSuccesses,
    targetNumber,
    ability1Key,
    ability1Value,
    ability1Options,
    ability2Key,
    ability2Value,
    ability2Options,
    actorWeaponList,
    actorWeaponEquipped,  
    actorWeaponOptions,
    actorWeaponParry,
    actorWeaponSkillKey,
    actorWeaponSkillRating,
    actorParry,
    actorArmorDeflect,
    actorArmorListString,
    actorShieldList,
    actorShieldReadied,
    actorShieldRating,
    modifier,
    modifierList,
    totalPool
  };

  // Render the dialog template
  renderTemplate('systems/unboundfate/templates/dialogs/weapondodge-dialog.hbs', templateData).then(content => {
    new Dialog({
      title: `Dodge Roll for ${actor.name}`,
      content,
      buttons: {
        roll: {
          icon: '<i class="fas fa-dice-d6"></i>',
          label: 'Roll Dodge',
          callback: async (html) => {
            const form = html[0].querySelector('form');
            const abilityKey = html.find('select[name="abilityKey"]').val();
            const abilityValue = actor.system.abilities?.[abilityKey]?.value || 0;            
            const weaponId = html.find('select[name="weaponId"]').val();
            let parry = 0;
            if (weaponId) {
              const weapon = actor.items.get(weaponId);
              parry = weapon?.system?.parry || 0;
            }
            const modifier = Number(html.find('input[name="modifier"]').val()) || 0;
            const finalTargetNumber = Number(html.find('input[name="targetNumber"]').val()) || 0;
            // Compose modifiers string for chat
            let modifiersString = '';
            if (parry) modifiersString += `Parry: +${parry} `;
            if (modifier) modifiersString += `Modifier: ${modifier} `;
            await rollWeaponDodge({
              abilityKey,
              abilityValue,
              parry,
              modifier,
              targetNumber: finalTargetNumber,
              modifiersString,
              attackLabel: options.attackLabel,
              successes: finalTargetNumber
            });
          }
        },
        cancel: {
          label: 'Cancel',
          callback: () => resolve(null)
        }
      },
      default: 'roll',
      render: (html) => {
        // Optionally, add listeners for dynamic updates here
      }
    }).render(true);
  });
}
