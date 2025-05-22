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
export function launchSkillDialog({ skillKey, skill, abilityKey, ability, actor }) {
  const skillRating = skill.rating || 0;
  const abilityValue = ability?.value || 0;

  let content = `
    <form>
      <div class="form-group">
        <label>Skill: </label>
        <span>${skillKey.capitalize()} (${skillRating})</span>
      </div>
      <div class="form-group">
        <label>Ability: </label>
        <span>${abilityKey ? abilityKey.capitalize() : 'None'} (${abilityValue})</span>
      </div>          
      <div class="form-group">
        <label for="modifier">Modifier</label>
        <input type="number" name="modifier" value="0" oninput="this.form.total.value = Number(${skillRating} + ${abilityValue}) + Number(this.value || 0)" />
      </div>
      <div class="form-group">
        <label for="total">Total</label>
        <input type="number" name="total" value="${skillRating + abilityValue}" disabled />            
        </div>
    </form>
  `;

  new Dialog({
    title: `Roll Skill: ${skillKey.capitalize()}`,
    content,
    buttons: {
      roll: {
        label: "Roll",
        callback: async (html) => {
          const form = html[0].querySelector('form');
          const modifier = parseInt(form.modifier.value, 10) || 0;
          await rollSkillPool({
            skillKey,
            skillRating,
            abilityKey,
            abilityValue,
            modifier,
            actor
          });
        }
      },
      cancel: {
        label: "Cancel"
      }
    }
  }).render(true);
}
