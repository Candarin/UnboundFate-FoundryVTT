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
  const parry = weapon.system.parry || 0;
  const weaponType = weapon.system.weaponType || '';

  // Get current targets
  const targets = Array.from(game.user.targets || []);
  const targetNames = targets.map(t => t.name).join(', ');

  // Prepare data for the template
  const templateData = {
    weaponName,
    damage1H,
    damage2H,
    skillKey,
    skillSpec,
    parry,
    weaponType,
    targetNames
  };

  renderTemplate('systems/unboundfate/templates/dialogs/weapon-dialog.hbs', templateData).then(content => {
    new Dialog({
      title: `Weapon Attack: ${weaponName}`,
      content,
      buttons: {
        roll: {
          label: 'Attack',
          callback: async (html) => {
            await rollWeaponAttack({ weapon, actor, targets });
          }
        },
        cancel: {
          label: 'Cancel'
        }
      }
    }).render(true);
  });
}
