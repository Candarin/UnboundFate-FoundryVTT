import { rollWeaponDodge } from '../dice/rolltypes.mjs';
import { getEquippedWeaponWithHighestParry, getReadiedShieldWithHighestRating } from '../helpers/actor-utils.mjs';
import { Damage } from '../helpers/damage.mjs';

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
  const dodgeTokenId = options.dodgeTokenId || null;

  // Access damage from options or chatMessageData.flags
  const damage = new Damage(chatMessageData.flags?.damage || options.damage);
  const damageString = damage.toString();
  const damageStringLong = damage.toString(true); // Long form for display

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
  // Refactor weapon label to remove parry rating
  const actorWeaponOptions = actorWeaponList.map(weapon => ({
    key: weapon.id,
    label: weapon.name, // No parry in label
    selected: weapon.id === actorWeaponEquipped?.id
  }));
  const actorWeaponParry = actorWeaponEquipped?.system?.parry || 0;
  const actorWeaponSkillKey = actorWeaponEquipped?.system?.melee?.skill || '';
  const actorWeaponSkillRating = actor.system.skills?.[actorWeaponSkillKey]?.rating || 0; // Use the weapon's skill rating if available
  const actorParry = Math.min(actorWeaponParry, actor.system.skills?.[actorWeaponSkillKey]?.rating || 0); // Use the weapon's parry or the skill rating, whichever is lower

  // Get localized skill label for the equipped weapon's skill
  const skills = CONFIG.UNBOUNDFATE.skills || {};
  const actorWeaponSkillLabel = skills[actorWeaponSkillKey] ? game.i18n.localize(skills[actorWeaponSkillKey]) : '';

  // Armour (deflect rating from armour items)
  const actorArmourList = actor.items.filter(i => i.type === 'armour' && i.system.isEquipped); 
  const actorArmourDeflect = actorArmourList.reduce((total, armour) => total + (armour.system.deflect || 0), 0);
  const actorArmourListString = actorArmourList.map(armour => `${armour.name} (Deflect: ${armour.system.deflect || 0})`).join(', ');
  
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
  if (actorArmourDeflect) {
    modifiersText.push(`Armour Deflect ${actorArmourDeflect >= 0 ? '+' : ''}${actorArmourDeflect}`);
  }
  if (actorShieldRating && actorShieldReadied) {
    modifiersText.push(`Shield Rating ${actorShieldRating >= 0 ? '+' : ''}${actorShieldRating}`);
  }
  if (modifier) {
    modifiersText.push(`Modifier ${modifier >= 0 ? '+' : ''}${modifier}`);
  }
  const modifiersString = modifiersText.join(', ');



  // Calculate current total pool
  const totalPool = ability1Value + ability2Value + actorParry + actorArmourDeflect + actorShieldRating + modifier; //


  // Set Template Data
  const templateData = {       
    attackType: options.attackType || '',
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
    actorWeaponSkillLabel,
    actorWeaponSkillRating,
    actorParry,
    actorArmourDeflect,
    actorArmourListString,
    actorShieldList,
    actorShieldReadied,
    actorShieldRating,
    modifier,
    modifiersString,
    totalPool,
    damage, // Pass the Damage instance for downstream dialogs
    damageString,
    damageStringLong,
    dodgeTokenId // Pass to template for chat-actor.hbs
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
                targetNumber: finalTargetNumber,
                damage, // Pass to dodge roll for later use
                dodgeTokenId // Forward to rollWeaponDodge for chat rendering
              }                            
            });
          }
        },
        cancel: {
          label: 'Cancel'
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
          const ability1Value = Number(actor.system.abilities?.[ability1Key]?.value || 0);
          const ability2Key = form.ability2Key.value;
          const ability2Value = Number(actor.system.abilities?.[ability2Key]?.value || 0);
          const weaponId = html.find('select[name="weaponId"]').val();
          const modifier = Number(html.find('input[name="modifier"]').val()) || 0;
          const actorParry = Number(form.actorParry.value || 0);
          const actorArmourDeflect = Number(form.actorArmourDeflect.value || 0);
          const actorShieldRating = Number(actorShieldReadied?.system?.shieldRating || 0);

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
          if (actorArmourDeflect) {
            modifiersText.push(`Armour Deflect ${actorArmourDeflect >= 0 ? '+' : ''}${actorArmourDeflect}`);
          }
          if (actorShieldRating && actorShieldReadied) {
            modifiersText.push(`Shield Rating ${actorShieldRating >= 0 ? '+' : ''}${actorShieldRating}`);
          }
          if (modifier) {
            modifiersText.push(`Modifier ${modifier >= 0 ? '+' : ''}${modifier}`);
          }
          const modifiersString = modifiersText.join(', ');

          // Calculate total pool
          const totalPool = Number(ability1Value) + Number(ability2Value) + Number(actorParry) + Number(actorArmourDeflect) + Number(actorShieldRating) + Number(modifier);

          // Update total pool and modifier string in the form
          html.find('#totalPool').val(totalPool);
          html.find('#modifiersString').text(modifiersString);
        }

        // Listeners for editable fields
        html.find('select[name="ability1Key"]').on('change', function() {
          const ability1Key = html.find('select[name="ability1Key"]').val();
          const ability1Value = Number(actor.system.abilities?.[ability1Key]?.value || 0);
          html.find('#ability1Value').val(ability1Value);
          updateTotal();
        });
        html.find('select[name="ability2Key"]').on('change', function() {
          const ability2Key = html.find('select[name="ability2Key"]').val();
          const ability2Value = Number(actor.system.abilities?.[ability2Key]?.value || 0);
          html.find('#ability2Value').val(ability2Value);          
          updateTotal();
        });
        html.find('select[name="weaponId"]').on('change', function() {
          // Update linked skill and parry when weapon changes

          // Get values from the selected weapon
          const weaponId = $(this).val();
          const weapon = actor.items.get(weaponId);
          const weaponParry = weapon?.system?.parry || 0;
          const skillKey = weapon?.system?.melee?.skill || '';
          const skillRating = actor.system.skills?.[skillKey]?.rating || 0;
          const actorParry = Math.min(weaponParry, skillRating);

          // Get localized skill label
          const skills = CONFIG.UNBOUNDFATE.skills || {};
          const skillLabel = skillKey && skills[skillKey] ? game.i18n.localize(skills[skillKey]) : '';

          // Update the skill label and rating fields
          html.find('#actorWeaponSkill').val(skillLabel);
          html.find('#actorWeaponSkillRating').val(skillRating);

          // Update the parry fields
          html.find('#actorWeaponParry').val(weaponParry);
          html.find('#actorParry').val(actorParry);

          updateTotal();
        });
        html.find('input[name="modifier"]').on('input', updateTotal);
      }
    }).render(true);
  });
}
