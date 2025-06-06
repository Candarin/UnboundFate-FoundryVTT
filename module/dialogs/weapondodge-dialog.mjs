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
  
  // Extract options 
  const attackSuccesses = options.successes ?? 0;
  const targetNumber = options.successes ?? 0;
  const chatMessageData = options.chatMessageData || {};

    // Ability 1: Agility
  const ability1Key = 'agl';
  const ability1Value = actor.system.abilities?.[ability1Key]?.value || 0;

  // Ability 2: Awareness
  const ability2Key = "awr";
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
  let modifiersText = [];  
  if (ability1Value) {
    modifiersText.push(`${game.i18n.localize(abilities[ability1Key])} ${ability1Value >= 0 ? '+' : ''}${ability1Value}`);
  }
  if (ability2Value) {
    modifiersText.push(`${game.i18n.localize(abilities[ability2Key])} ${ability2Value >= 0 ? '+' : ''}${ability2Value}`);
  }
  if (actorParry) {
    modifiersText.push(`Parry ${actorParry >= 0 ? '+' : ''}${actorParry}`);
  }
  if (actorArmorDeflect) {
    modifiersText.push(`Armor Deflect ${actorArmorDeflect >= 0 ? '+' : ''}${actorArmorDeflect}`);
  }
  if (actorShieldRating && actorShieldReadied) {
    modifiersText.push(`Shield Rating ${actorShieldRating >= 0 ? '+' : ''}${actorShieldRating}`);
  }
  if (modifier) {
    modifiersText.push(`Modifier ${modifier >= 0 ? '+' : ''}${modifier}`);
  }
  const modifiersString = modifiersText.join(', ');



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
    modifiersString,
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
            const modifiersString = html.find('#modifiersString').text().trim();
            const abilityValue = actor.system.abilities?.[abilityKey]?.value || 0;            
            const weaponId = html.find('select[name="weaponId"]').val();
            
            const modifier = Number(html.find('input[name="modifier"]').val()) || 0;
            const finalTargetNumber = Number(html.find('input[name="targetNumber"]').val()) || 0;          
            
            await rollWeaponDodge({
              actor,
              options: {
                ability1Key,
                ability1Value,
                ability2Key,
                ability2Value,                
                modifier,
                totalPool,
                modifiersString,        
                targetNumber: finalTargetNumber
              }                            
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
        const form = html[0].querySelector('form');
        if (!form) return;
        // Add listeners for editable fields to update linked fields and total
        function updateTotal() {
          // Get current values from the form
          const ability1Key = form.ability1Key.value;
          const ability1Value = actor.system.abilities?.[ability1Key]?.value || 0;
          const ability2Key = form.ability2Key.value;
          const ability2Value = actor.system.abilities?.[ability2Key]?.value || 0;
          const weaponId = html.find('select[name="weaponId"]').val();
          const modifier = Number(html.find('input[name="modifier"]').val()) || 0;
          const actorParry = form.actorParry.value || 0;

          // Get actor data from closure
          const actorData = actor;                 
          

          // Armor deflect          
          const actorArmorDeflect = form.actorArmorDeflect.value || 0; // Use the total deflect from equipped armor
          // Shield rating
          const actorShieldRating = actorShieldReadied?.system?.shieldRating || 0; // Use the highest block rating from readied shields

          // Calcuate Modrifier String
          let modifiersText = [];  
          if (ability1Value) {
            modifiersText.push(`${game.i18n.localize(abilities[ability1Key])} ${ability1Value >= 0 ? '+' : ''}${ability1Value}`);
          }
          if (ability2Value) {
            modifiersText.push(`${game.i18n.localize(abilities[ability2Key])} ${ability2Value >= 0 ? '+' : ''}${ability2Value}`);
          }
          if (actorParry) {
            modifiersText.push(`Parry ${actorParry >= 0 ? '+' : ''}${actorParry}`);
          }
          if (actorArmorDeflect) {
            modifiersText.push(`Armor Deflect ${actorArmorDeflect >= 0 ? '+' : ''}${actorArmorDeflect}`);
          }
          if (actorShieldRating && actorShieldReadied) {
            modifiersText.push(`Shield Rating ${actorShieldRating >= 0 ? '+' : ''}${actorShieldRating}`);
          }
          if (modifier) {
            modifiersText.push(`Modifier ${modifier >= 0 ? '+' : ''}${modifier}`);
          }
          const modifiersString = modifiersText.join(', ');

          // Calculate total pool
          const totalPool = ability1Value + ability2Value + actorParry + actorArmorDeflect + actorShieldRating + modifier;

          // Update total pool and modifier string in the form
          html.find('#totalPool').val(totalPool);
          html.find('#modifiersString').text(modifiersString);
        }

        // Listeners for editable fields
        html.find('select[name="ability1Key"]').on('change', function() {
          const ability1Key = html.find('select[name="ability1Key"]').val();
          const ability1Value = actor.system.abilities?.[ability1Key]?.value || 0;
          html.find('#ability1Value').text(ability1Value);
          updateTotal();
        });
        html.find('select[name="ability2Key"]').on('change', function() {
          const ability2Key = html.find('select[name="ability2Key"]').val();
          const ability2Value = actor.system.abilities?.[ability2Key]?.value || 0;
          html.find('#ability2Value').text(ability2Value);          
          updateTotal();
        });
        html.find('select[name="weaponId"]').on('change', function() {
          // Update linked skill and parry when weapon changes

          // Get values from the selected weapon
          const weaponId = $(this).val();
          const weapon = actor.items.get(weaponId);
          const weaponParry = weapon?.system?.parry || 0;
          const skillKey = weapon?.system?.skill || '';
          const skillRating = actor.system.skills?.[skillKey]?.rating || 0;
          const actorParry = Math.min(weaponParry, skillRating);

          //update the parry and skill rating fields
          form.actorWeaponSkill.value = skillKey ? `${skillKey} (Rating: ${skillRating})` : 'None';
          form.actorParry.value = actorParry || 0;

          html.find('#actorWeaponParry').text(weaponParry);

          updateTotal();
        });
        html.find('input[name="modifier"]').on('input', updateTotal);
      }
    }).render(true);
  });
}
