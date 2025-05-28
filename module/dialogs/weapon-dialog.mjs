import { rollWeaponAttack } from '../dice/rolltypes.mjs';

/**
 * Launches a dialog for a weapon attack roll and handles the result.
 * @param {object} params - Parameters for the dialog
 * @param {object} params.weapon - The weapon item object
 * @param {Actor} params.actor - The attacking actor instance
 */
export function launchWeaponDialog({ weapon, actor }) {
  // Weapon fields
  const weaponName = weapon.name;
  const damage1H = weapon.system.damage1H || '';
  const damage2H = weapon.system.damage2H || '';
  const weaponSkillKey = weapon.system.skill || '';                     // The skill key associated with the weapon
  const weaponType = weapon.system.weaponType || '';
  const weaponSkillSpec = weapon.system.skillSpec || '';                // The skill specialisation associated with the weapon
  // Actor fields
  const skillKey = actor.system.skills[weaponSkillKey] ? weaponSkillKey : '';                                                  // The selected skill key, default to empty string
  const skillRating = actor.system.skills[weaponSkillKey]?.value ?? 0;  // The skill rating of the actor for the weapon's skill
  const skillSpec = '';     
  const abilityKey = weapon.system.ability || 'str';                    // The ability key associated with the weapon  
  // Roll fields
  const totalPool = 0;

  // Get current targets
  const targets = Array.from(game.user.targets || []);
  const targetNames = targets.map(t => t.name).join(', ');

  // Get all abilities from config
  const abilities = CONFIG.UNBOUNDFATE.abilities || {};
  const abilityKeys = Object.keys(abilities);
  const abilityOptions = abilityKeys.map(key => ({
    key,
    label: game.i18n.localize(abilities[key]),
    selected: key === abilityKey ? abilityKey : 'str' // Default to 'str' if no abilityKey is set
  }));

  // Determine skill options
  const skills = CONFIG.UNBOUNDFATE.skills || {};
  const skillKeys = Object.keys(skills);
  const skillOptions = skillKeys.map(key => ({
    key,
    label: game.i18n.localize(skills[key]),
    selected: key === skillKey
  }));

  // Determine useSpec and specialisation for the weapon's skill
  let useSpec = false;
  const canUseSpec = actor.system.skills[skillKey]?.specialisation == weapon.system.skillSpec
  const specialisation = '';
  if (skillKey && actor.system.skills && actor.system.skills[skillKey]) {
    specialisation = actor.system.skills[skillKey].specialisation || '';
    useSpec = !!specialisation;
  }

  // Prepare data for the template
  const templateData = {
    weaponName,
    damage1H,
    damage2H,
    skillKey,
    skillRating,
    skillSpec,
    skillOptions,    
    weaponType,
    weaponSkillKey,
    weaponSkillSpec,
    targetNames,
    totalPool,
    abilityOptions,
    abilityKey,
    abilityValue,
    useSpec,
    specialisation
  };

  renderTemplate('systems/unboundfate/templates/dialogs/weapon-dialog.hbs', templateData).then(content => {
    new Dialog({
      title: `Weapon Attack: ${weaponName}`,
      content,
      buttons: {
        roll: {
          label: 'Attack',
          callback: async (html) => {
            const form = html[0].querySelector('form');
            // Extract values by name attribute
            const totalPool = parseInt(form.totalPool.value, 10) || 0;
            const modifier = parseInt(form.modifier.value, 10) || 0;
            const modifierList = form.querySelector('#modifiers-string')?.textContent || '';
            // You can extract other fields similarly if needed
            await rollWeaponAttack({ weapon, actor, targets, totalPool, modifierList });
          }
        },
        cancel: {
          label: 'Cancel'
        }
      },
      render: (html) => {
        const form = html[0].querySelector('form');
        if (!form) return;
        // Helper to update total and ability value
        function updateTotal() {

          // Get selected skill key and value
          const skillKey = form.skillKey?.value || 'str';
          let skillRating = 0;
          if (actor.system.skills && actor.system.skills[skillKey]) {
            skillRating = parseInt(actor.system.skills[skillKey].value, 10) || 0;
          } else {
            // If skill not found, default to 0
            skillRating = 0;
          }

          // Get selected ability value
          const abilityKey = form.abilityKey?.value || 'str';
          let abilityValue = 0;
          if (actor.system.abilities && actor.system.abilities[abilityKey]) {
            abilityValue = parseInt(actor.system.abilities[abilityKey].value, 10) || 0;
          }         
          // Get modifier
          const modifier = parseInt(form.modifier?.value, 10) || 0;
          // Check if specialisation applies
          const useSpec = form.useSpec.checked ? 2 : 0;          

           // Calculate total pool: ability + skill + spec + modifier
          const total = abilityValue + skillRating + useSpec + modifier;
          // Update totalPool display
          form.totalPool.value = total;


          // Update displayed ability value display
          const abilityValueElem = form.querySelector('#ability-value');
          if (abilityValueElem) abilityValueElem.textContent = abilityValue;


          // Update displayed Skill Rating
          const skillRatingElem = form.querySelector('#skill-rating');
          if (skillRatingElem) skillRatingElem.textContent = skillRating;

          // Calculate modifiers string
          let modifiersText = [];
          if (abilityKey && abilityValue !== 0) {
            modifiersText.push(`${game.i18n.localize(`UNBOUNDFATE.Ability.${abilityKey}`)} ${abilityValue >= 0 ? '+' : ''}${abilityValue}`);
          }
          if (skillKey && skillRating !== 0) {           
            modifiersText.push(`${game.i18n.localize(`UNBOUNDFATE.Skills.${skillKey}`)} ${skillRating >= 0 ? '+' : ''}${skillRating}`);
          }
          if (form.useSpec.checked) {
            modifiersText.push('Specialisation +2');
          }
          if (modifier !== 0) {
            modifiersText.push(`Modifier ${modifier >= 0 ? '+' : ''}${modifier}`);
          }
          const modifiersString = modifiersText.join(', ');
          
          // Update modifiers string
          const modifiersElem = form.querySelector('#modifiers-string');
          if (modifiersElem) modifiersElem.textContent = modifiersString;         
        }
        // Add listeners for each editable field, matching skill-dialog style
        form.abilityKey.addEventListener('change', updateTotal);
        form.skillKey.addEventListener('change', function() {
          // update the skill specialisation field based on the selected skill

          // 

          // Does the actors Specilisation match the weapon's skill spec?
          const selectedSkillKey = this.value;
          const skillSpec = actor.system.skills[selectedSkillKey]?.specialisation || '';
          updateTotal();
        });
        form.modifier.addEventListener('input', updateTotal);
        form.useSpec.addEventListener('change', function() {
          form.specialisation.disabled = !this.checked;



          updateTotal();
        });
      }
    }).render(true);
  });
}
