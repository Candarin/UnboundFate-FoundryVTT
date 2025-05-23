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
export function launchSkillDialog({ skillKey, skill, abilityKey, ability, actor, threshold = 1, specialisation = '', specOptions = [] }) {
  const skillRating = skill.rating || 0;
  const abilityValue = ability?.value || 0;
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

  let content = `
    <form>
      <div class="form-group">
        <label>Skill: </label>
        <span>${skillKey.capitalize()} (${skillRating})</span>
      </div>
      <div class="form-group">
        <label for="abilityKey">Ability</label>
        <select name="abilityKey">
          ${abilityKeys.map(key => `<option value="${key}"${key === abilityKey ? ' selected' : ''}>${game.i18n.localize(abilities[key])}</option>`).join('')}
        </select>
        <span> (<span id="ability-value">${abilityValue}</span>)</span>
      </div>
      <div class="form-group">
        <label for="modifier">Modifier</label>
        <input type="number" name="modifier" value="0" />
      </div>
      <div class="form-group">
        <input type="checkbox" id="useSpec" name="useSpec" />
        <label for="useSpec">Use Specialisation</label>
      </div>
      <div class="form-group">
        <label for="specialisation">Specialisation</label>
        <input list="specOptions" name="specialisation" value="${specialisation}" disabled />
        <datalist id="specOptions">
          ${(specOptions || []).map(opt => `<option value="${opt}">`).join('')}
        </datalist>
      </div>
      <div class="form-group">
        <label for="total">Total</label>
        <input type="number" name="total" value="${skillRating + abilityValue}" disabled />
      </div>
      <hr>
      <div class="form-group">
        <label for="threshold">Threshold</label>
        <input type="number" name="threshold" value="${threshold}" min="0" />
      </div>
      <hr>
      <div class="form-group">
        <label for="rollMode">Roll Type</label>
        <select name="rollMode">
          ${rollModes.map(rm => `<option value="${rm.value}"${rm.value === currentRollMode ? ' selected' : ''}>${rm.label}</option>`).join('')}
        </select>
      </div>
    </form>
    <script>
      const form = document.currentScript.parentElement.querySelector('form');
      // Enable/disable specialisation field
      form.useSpec.addEventListener('change', function() {
        form.specialisation.disabled = !this.checked;
        updateTotal();
      });
      // Update ability value and total when ability changes
      form.abilityKey.addEventListener('change', function() {
        const selectedKey = this.value;
        const newValue = (window.actorAbilities && window.actorAbilities[selectedKey]) || 0;
        document.getElementById('ability-value').textContent = newValue;
        // Recalculate total using the new ability value
        const skillRating = ${skillRating};
        const selectedKey = form.abilityKey.value;
        const abilityValue = (window.actorAbilities && window.actorAbilities[selectedKey]) || 0;
        const modifier = Number(form.modifier.value || 0);
        const useSpec = form.useSpec.checked ? 2 : 0;
        form.total.value = skillRating + abilityValue + modifier + useSpec;
      });
      // Update total when modifier changes
      form.modifier.addEventListener('input', updateTotal);
      function updateTotal() {
        const skillRating = ${skillRating};
        const selectedKey = form.abilityKey.value;
        const abilityValue = (window.actorAbilities && window.actorAbilities[selectedKey]) || 0;
        const modifier = Number(form.modifier.value || 0);
        const useSpec = form.useSpec.checked ? 2 : 0;
        form.total.value = skillRating + abilityValue + modifier + useSpec;
      }
    </script>
  `;

  // Pass actor abilities to the dialog for JS
  window.actorAbilities = {};
  abilityKeys.forEach(key => {
    window.actorAbilities[key] = actor.system.abilities?.[key]?.value || 0;
  });

  new Dialog({
    title: `Roll Skill: ${skillKey.capitalize()}`,
    content,
    buttons: {
      roll: {
        label: "Roll",
        callback: async (html) => {
          const form = html[0].querySelector('form');
          const selectedAbilityKey = form.abilityKey.value;
          const selectedAbility = actor.system.abilities?.[selectedAbilityKey];
          const abilityValue = selectedAbility?.value || 0;
          const modifier = parseInt(form.modifier.value, 10) || 0;
          const thresholdVal = parseInt(form.threshold.value, 10) || 0;
          const rollMode = form.rollMode.value || currentRollMode;
          const useSpec = form.useSpec.checked;
          const spec = form.specialisation.value;
          await rollSkillPool({
            skillKey,
            skillRating,
            abilityKey: selectedAbilityKey,
            abilityValue,
            modifier,
            threshold: thresholdVal,
            actor,
            rollMode,
            useSpec,
            specialisation: spec
          });
        }
      },
      cancel: {
        label: "Cancel"
      }
    }
  }).render(true);
}
