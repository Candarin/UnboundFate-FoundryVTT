import { rollWeaponDodge } from '../dice/rolltypes.mjs';
import { renderTemplate } from '../helpers/templates.mjs';

/**
 * Launches a dialog for a weapon dodge roll, allowing the user to select ability, weapon, and modifiers.
 * @param {object} params
 * @param {Actor} params.actor - The defending actor
 * @param {Actor} params.attackingActor - The attacking actor
 * @param {object} params.options - Optional: { attackLabel, successes, weapon, etc. }
 * @returns {Promise<object|null>} Resolves with the selected options or null if cancelled
 */
export function launchWeaponDodgeDialog({ actor, attackingActor, options = {} }) {
  // Gather ability options (all abilities)
  const abilityOptions = Object.entries(actor.system.abilities || {}).map(([key, abl]) => ({
    key,
    label: key.capitalize(),
    value: abl.value,
    selected: false
  }));
  if (abilityOptions.length) abilityOptions[0].selected = true;

  // Gather equipped weapons
  const equippedWeapons = actor.items.filter(i => i.type === 'weapon' && i.system.isEquipped);

  // Default targetNumber from options.successes or 0
  const targetNumber = options.successes ?? 0;

  const templateData = {
    skillLabel: skillKey.capitalize(),
    skillRating,
    abilityOptions,
    abilityValue,
    modifier,
    useSpec,
    specialisation,
    // Remove specOptions from templateData
    total,
    targetNumber,
    rollModes: rollModeOptions,
    modifiersString
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
            const abilityValue = Number(actor.system.abilities?.[abilityKey]?.value) || 0;
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
