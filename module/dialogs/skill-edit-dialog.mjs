// Dialog for editing a skill on an actor
export function launchSkillEditDialog({ actor, skillKey, skill, onSave }) {
  const templateData = {
    skillKey,
    skill,
    skillLabel: game.i18n.localize(CONFIG.UNBOUNDFATE.skills[skillKey] || skillKey)
  };
  renderTemplate('systems/unboundfate/templates/dialogs/skill-edit-dialog.hbs', templateData).then(content => {
    new Dialog({
      title: `Edit Skill: ${templateData.skillLabel}`,
      content,
      buttons: {
        save: {
          label: "Save",
          callback: (html) => {
            const formData = new FormData(html[0].querySelector('form'));
            const updatedSkill = {
              rating: parseInt(formData.get('rating'), 10),
              specialisation: formData.get('specialisation')
            };
            if (onSave) onSave(updatedSkill);
          }
        },
        cancel: {
          label: "Cancel"
        }
      },
      default: 'save'
    }).render(true);
  });
}
