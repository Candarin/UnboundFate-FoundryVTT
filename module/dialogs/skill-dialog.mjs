// Dialog logic for skill rolls
import { rollSkillPool } from '../dice/rolltypes.mjs';

/**
 * Launches a dialog for a skill roll and handles the result.
 * @param {object} params - Parameters for the dialog
 * @param {string} params.skillKey - The skill key
 * @param {object} params.skill - The skill object
 * @param {string} params.abilityKey - The ability key
 * @param {object} params.ability - The ability object
 * @param {Actor} params.actor - The actor instance
 */
export function launchSkillDialog({ skillKey, skill, abilityKey, ability, actor, targetNumber = 1, specialisation = '', useSpecDefault = false }) {
  const skillRating = skill.rating || 0;
  const abilityValue = ability?.value || 0;
  const modifier = 0;
  // useSpec is now settable via useSpecDefault
  const useSpec = useSpecDefault;
  const total = skillRating + abilityValue + (useSpec ? 2 : 0);
  const rollModes = [
    { value: 'roll', label: 'Public Roll' },
    { value: 'gmroll', label: 'Private GM Roll' },
    { value: 'blindroll', label: 'Blind GM Roll' },
    { value: 'selfroll', label: 'Self Roll' }
  ];
  const currentRollMode = game.settings.get('core', 'rollMode') || 'roll';

  // Get all abilities from config
  const abilities = CONFIG.UNBOUNDFATE.abilities || {};
  const abilityKeys = Object.keys(abilities);
  const abilityOptions = abilityKeys.map(key => ({
    key,
    label: game.i18n.localize(abilities[key]),
    selected: key === abilityKey
  }));

  const rollModeOptions = rollModes.map(rm => ({
    ...rm,
    selected: rm.value === currentRollMode
  }));

  // Compose a modifiers string for display
  let modifiersText = [];
  // Ability
  if (abilityKey && abilityValue !== 0) {
    modifiersText.push(`${game.i18n.localize(abilities[abilityKey])} ${abilityValue >= 0 ? '+' : ''}${abilityValue}`);
  }
  // Skill
  if (skillKey && skillRating !== 0) {
    modifiersText.push(`${skillKey.capitalize()} ${skillRating >= 0 ? '+' : ''}${skillRating}`);
  }
  // Specialisation (initial state)
  if (useSpec) {
    modifiersText.push(`Specialisation +2`);
  }
  // Modifier (initial state)
  if (modifier !== 0) {
    modifiersText.push(`Modifier ${modifier >= 0 ? '+' : ''}${modifier}`);
  }
  const modifiersString = modifiersText.join(', ');

  // Prepare data for the template
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

  renderTemplate('systems/unboundfate/templates/dialogs/skill-dialog.hbs', templateData).then(content => {
    new Dialog({
      title: `Roll Skill: ${skillKey.capitalize()}`,
      content,
      buttons: {
        roll: {
          label: 'Roll',
          callback: async (html) => {
            const form = html[0].querySelector('form');
            const selectedAbilityKey = form.abilityKey.value;
            const selectedAbility = actor.system.abilities?.[selectedAbilityKey];
            const abilityValue = selectedAbility?.value || 0;
            const modifier = parseInt(form.modifier.value, 10) || 0;
            const targetNumberVal = parseInt(form.targetNumber.value, 10) || 0;
            const rollMode = form.rollMode.value || currentRollMode;
            const useSpec = form.useSpec.checked;
            const spec = form.specialisation.value;
            await rollSkillPool({
              skillKey,
              skillRating,
              abilityKey: selectedAbilityKey,
              abilityValue,
              modifier,
              targetNumber: targetNumberVal,
              actor,
              rollMode,
              useSpec,
              specialisation: spec,
              modifiersString // Pass to chat message
            });
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
          const selectedKey = form.abilityKey.value;
          const abilityValue = actor.system.abilities?.[selectedKey]?.value || 0;
          const modifier = Number(form.modifier.value || 0);
          const useSpec = form.useSpec.checked ? 2 : 0;
          form.total.value = skillRating + abilityValue + modifier + useSpec;
          // Also update the displayed ability value
          const abilityValueSpan = form.querySelector('#ability-value');
          if (abilityValueSpan) abilityValueSpan.textContent = abilityValue;
          // Update modifiers string
          let modifiersText = [];
          if (selectedKey && abilityValue !== 0) {
            modifiersText.push(`${game.i18n.localize(abilities[selectedKey])} ${abilityValue >= 0 ? '+' : ''}${abilityValue}`);
          }
          if (skillKey && skillRating !== 0) {
            modifiersText.push(`${skillKey.capitalize()} ${skillRating >= 0 ? '+' : ''}${skillRating}`);
          }
          if (form.useSpec.checked) {
            modifiersText.push('Specialisation +2');
          }
          if (modifier !== 0) {
            modifiersText.push(`Modifier ${modifier >= 0 ? '+' : ''}${modifier}`);
          }
          const modifiersString = modifiersText.join(', ');
          const modStringElem = form.querySelector('#modifiers-string');
          if (modStringElem) modStringElem.textContent = modifiersString;
        }
        // Ability select
        form.abilityKey.addEventListener('change', function() {
          updateTotal();
        });
        // Modifier input
        form.modifier.addEventListener('input', updateTotal);
        // Specialisation toggle
        form.useSpec.addEventListener('change', function() {
          form.specialisation.disabled = !this.checked;
          updateTotal();
        });
      }
    }).render(true);
  });
}
