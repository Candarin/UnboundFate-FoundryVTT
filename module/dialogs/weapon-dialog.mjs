import { rollWeaponAttack } from '../dice/rolltypes.mjs';

/**
 * Launches a dialog for a weapon attack roll and handles the result.
 * @param {object} params - Parameters for the dialog
 * @param {object} params.weapon - The weapon item object
 * @param {Actor} params.actor - The attacking actor instance
 */
export function launchWeaponDialog({ weapon, actor }) {
  // Get weapon fields
  const weaponName = weapon.name;
  const damage1H = weapon.system.damage1H || '';
  const damage2H = weapon.system.damage2H || '';
  const skillKey = weapon.system.skill || '';
  const skillSpec = weapon.system.skillSpec || '';  
  const weaponType = weapon.system.weaponType || '';

  // Get current targets
  const targets = Array.from(game.user.targets || []);
  const targetNames = targets.map(t => t.name).join(', ');

  // Determine ability options and selected ability
  const abilities = actor.system.abilities || {};
  const abilityOptions = Object.entries(abilities).map(([key, value]) => ({
    key,
    label: value.label || key.toUpperCase(),
    selected: key === 'str'
  }));
  const abilityKey = 'str';
  const abilityValue = abilities[abilityKey]?.value ?? 0;

  // Determine useSpec and specialisation for the weapon's skill
  let useSpec = false;
  let specialisation = '';
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
    skillSpec,    
    weaponType,
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
          // Get selected ability value
          const abilityKey = form.abilityKey?.value || 'str';
          let abilityValue = 0;
          if (actor.system.abilities && actor.system.abilities[abilityKey]) {
            abilityValue = parseInt(actor.system.abilities[abilityKey].value, 10) || 0;
          }
          // Update ability value display
          const abilityValueElem = form.querySelector('#ability-value');
          if (abilityValueElem) abilityValueElem.textContent = abilityValue;

          // Get modifier
          const modifier = parseInt(form.modifier?.value, 10) || 0;

          // Check if specialisation applies
          const useSpec = form.useSpec?.checked;
          let specBonus = 0;
          let modifiersString = '';
          if (useSpec && form.specialisation?.value) {
            specBonus = 1;
            modifiersString += '+1 Specialisation';
          }
          if (modifier !== 0) {
            if (modifiersString) modifiersString += ', ';
            modifiersString += (modifier > 0 ? '+' : '') + modifier + ' Modifier';
          }
          if (!modifiersString) modifiersString = 'None';

          // Calculate total pool: ability + spec + modifier
          const total = abilityValue + specBonus + modifier;
          // Update totalPool display
          const totalPoolElem = form.querySelector('[name="totalPool"]');
          if (totalPoolElem) totalPoolElem.textContent = total;
          // Update modifiers string
          const modifiersElem = form.querySelector('#modifiers-string');
          if (modifiersElem) modifiersElem.textContent = modifiersString;
        }
        // Add listeners for each editable field, matching skill-dialog style
        form.abilityKey?.addEventListener('change', updateTotal);
        form.modifier?.addEventListener('input', updateTotal);
        form.useSpec?.addEventListener('change', updateTotal);
      }
    }).render(true);
  });
}
