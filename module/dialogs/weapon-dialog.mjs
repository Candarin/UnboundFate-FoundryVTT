import { rollWeaponAttack } from '../dice/rolltypes.mjs';

/**
 * Launches a dialog for a weapon attack roll and handles the result.
 * @param {object} params - Parameters for the dialog
 * @param {object} params.weapon - The weapon item object
 * @param {string} params.attackType - The type of attack (e.g., 'melee', 'ranged')
 * @param {Actor} params.actor - The attacking actor instance
 */
export function launchWeaponDialog({ weapon, attackType, actor }) {
  const attackTypeText = game.i18n.localize(`UNBOUNDFATE.AttackType.${attackType}`) || attackType;

  // Weapon fields
  const weaponName = weapon.name;
  const weaponType = weapon.system.weaponType || '';
  const weaponSkillKey = weapon.system[attackType]?.skill || '';               // The skill key associated with the weapon for this attack type 
  const weaponSkillSpec = weapon.system[attackType]?.skillSpec || '';          // The skill specialisation associated with the weapon for this attack type
  // Actor fields
  const skillKey = actor.system.skills[weaponSkillKey] ? weaponSkillKey : '';                                                  // The selected skill key, default to empty string
  const skillRating = actor.system.skills[weaponSkillKey]?.rating ?? 0;     // The skill rating of the actor for the weapon's skill
  const skillSpec = actor.system.skills[weaponSkillKey]?.specialisation || '';                                                  // The skill specialisation of the actor for the weapon's skill, default to empty string  
  const abilityKey = CONFIG.UNBOUNDFATE.AttackType?.[attackType]?.defaultAbility || 'str';                    // The ability key associated with the attack type, default to 'str' 
  const abilityValue = actor.system.abilities[abilityKey]?.value || 0;  // The value of the selected ability
  // Roll fields
  const modifier = 0; // Default modifier, can be set in dialog

  // Get current targets
  const targets = Array.from(game.user.targets || []);
  const targetNames = targets.map(t => t.name).join(', ');

  // Get all abilities from config
  const abilities = CONFIG.UNBOUNDFATE.abilities || {};
  const abilityKeys = Object.keys(abilities);
  const abilityOptions = abilityKeys.map(key => ({
    key,
    label: game.i18n.localize(abilities[key]),
    selected: key === abilityKey
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
  if (actor.system.skills[skillKey]?.specialisation === weapon.system[attackType]?.skillSpec && skillKey === weapon.system[attackType]?.skill) {
    useSpec = true;
  }

  // Calculate initial total pool
  const totalPool = abilityValue + skillRating + (useSpec ? 2 : 0) + modifier;

  // Calculate modifiers string
  let modifiersText = [];
  if (abilityKey && abilityValue !== 0) {
    modifiersText.push(`${game.i18n.localize(abilities[abilityKey])} ${abilityValue >= 0 ? '+' : ''}${abilityValue}`);
  }
  if (skillKey && skillRating !== 0) {           
    modifiersText.push(`${game.i18n.localize(skills[skillKey])} ${skillRating >= 0 ? '+' : ''}${skillRating}`);
  } 
  if (useSpec) {
    modifiersText.push('Specialisation +2');
  }
  if (modifier !== 0) {
    modifiersText.push(`Modifier ${modifier >= 0 ? '+' : ''}${modifier}`);
  }
  const modifiersString = modifiersText.join(', ');

  // Determine weaponDamage based on attackType and held2H (for melee)
  let weaponDamage = '';
  if (attackType === 'melee') {
    const held2H = weapon.system.melee?.held2H || false;
    weaponDamage = held2H ? (weapon.system.melee?.damage2H || weapon.system.melee?.damage1H || '') : (weapon.system.melee?.damage1H || '');
  } else if (attackType === 'ranged') {
    weaponDamage = weapon.system.ranged?.damage || '';
  }

  // Prepare data for the template
  const templateData = {
    weaponName,
    weaponDamage,
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
    modifier,
    modifiersString
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
          const skillKey = form.skillKey?.value || '';          
          let skillRating = actor.system.skills[skillKey]?.value ?? 0;
          
          // Get selected ability value
          const abilityKey = form.abilityKey?.value || 'str';
          let abilityValue = 0;
          if (actor.system.abilities[abilityKey]) {
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
            modifiersText.push(`${game.i18n.localize(abilities[abilityKey])} ${abilityValue >= 0 ? '+' : ''}${abilityValue}`);
          }
          if (skillKey && skillRating !== 0) {           
            modifiersText.push(`${game.i18n.localize(skills[skillKey])} ${skillRating >= 0 ? '+' : ''}${skillRating}`);
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
          const selectedSkillKey = form.skillKey?.value || '';
          // update the skill specialisation field based on the selected skill
          const specElem = form.querySelector('#skillSpec');
          specElem.value = actor.system.skills[selectedSkillKey]?.specialisation || '';
          // Does the actors Specilisation match the weapon's skill spec?          
          if (actor.system.skills[selectedSkillKey]?.specialisation === weapon.system[attackType]?.skillSpec && selectedSkillKey === weapon.system[attackType]?.skill) {
            form.useSpec.checked = true;
          } 
          else {
            form.useSpec.checked = false;
          }
          // Update skill rating for selected skill
          const skillRatingElem = form.querySelector('#skill-rating');    
          if (skillRatingElem) {
            skillRatingElem.textContent = actor.system.skills[selectedSkillKey]?.rating || 0;
          }

          updateTotal();
        });
        form.modifier.addEventListener('input', updateTotal);
        form.useSpec.addEventListener('change', function() {
          
          updateTotal();
        });
      }
    }).render(true);
  });
}
