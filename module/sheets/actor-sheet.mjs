import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';
import { launchSkillDialog } from '../dialogs/skill-dialog.mjs';
import { UNBOUNDFATE as CONFIG_UNBOUNDFATE } from '../helpers/config.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class UnboundFateActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['unboundfate', 'sheet', 'actor'],
      width: 700,
      height: 600,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'skills',
        },
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/unboundfate/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.document.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Adding a pointer to CONFIG.UNBOUNDFATE
    context.config = CONFIG.UNBOUNDFATE;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
      // No _prepareCharacterData for NPCs, but ensure talents, flaws, skills, etc. are available
    }

    // Enrich biography info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    context.enrichedBiography = await TextEditor.enrichHTML(
      this.actor.system.biography,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Necessary in v11, can be removed in v12
        async: true,
        // Data to fill in for inline rolls
        rollData: this.actor.getRollData(),
        // Relative UUID resolution
        relativeTo: this.actor,
      }
    );

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );

    return context;
  }

  /**
   * Character-specific context modifications
   *
   * @param {object} context The context object to mutate
   */
  _prepareCharacterData(context) {
    // This is where you can enrich character-specific editor fields
    // or setup anything else that's specific to this type
  }

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    // Initialize containers for each group.
    const weapons = [];
    const armour = [];
    const gear = [];
    const talents = [];
    const flaws = [];
    const spells = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: []
    };
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      if (i.type === 'weapon') {
        weapons.push(i);
      } else if (i.type === 'armour') {
        armour.push(i);
      } else if (i.type === 'item') {
        gear.push(i);
      } else if (i.type === 'talent') {
        talents.push(i);
      } else if (i.type === 'flaw') {
        flaws.push(i);
      } else if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          spells[i.system.spellLevel].push(i);
        }
      }
      // You can add more types/groups here as needed
    }
    context.weapons = weapons;
    context.armour = armour;
    context.gear = gear;
    context.talents = talents;
    context.flaws = flaws;
    context.spells = spells;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });
    
    // Skill modal
    html.on('click', '.skill-edit', (ev) => {
      console.log("Unbound Fate | Skill Edit");

      // Launch a custom dialog for editing skills
      const li = $(ev.currentTarget).parents('.item');
      const skillKey = li.data('itemId');
      //const skillKey = $(ev.currentTarget).data('skill');  
      console.log(ev);      
      const skill = this.actor.system.skills[skillKey];

      if (!skill) {
        console.error(`Unbound Fate | Skill ${skillKey} not found on actor.`);
        return;
      }

      // Create a custom dialog
      new Dialog({
        title: `Edit Skill: ${skillKey}`,
        content: `
          <form>
            <div class="form-group">
              <label for="skill-name">Name</label>              
            </div>
            <div class="form-group">
              <label for="skill-rating">Rating</label>
              <input type="number" id="skill-rating" name="rating" value="${skill.rating}" />
            </div>
            <div class="form-group">
              <label for="skill-specialisation">Specialisation</label>
              <input type="text" id="skill-specialisation" name="specialisation" value="${skill.specialisation}" />
            </div>                 
          </form>
        `,
        buttons: {
          save: {
            label: "Save",
            callback: (html) => {
              const formData = new FormData(html[0].querySelector('form'));
              const updatedSkill = {              
                rating: parseInt(formData.get('rating'), 10),     
                specialisation: formData.get('specialisation')           
              };

              // Update the actor's skill data
              const updateData = { [`system.skills.${skillKey}`]: updatedSkill };
              this.actor.update(updateData);
            },
          },
          cancel: {
            label: "Cancel",
          },
        },
      }).render(true);

    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.on('click', '.item-create', this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.on('click', '.effect-control', (ev) => {
      const row = ev.currentTarget.closest('li');
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    // Rollable abilities and items.
    html.on('click', '.rollable', async (ev) => {
      const element = ev.currentTarget;
      const dataset = element.dataset;
      // Handle item rolls (including weapon attacks)
      if (dataset.rollType === 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) {
          if (item.type === 'weapon') {
            const { launchWeaponDialog } = await import('../dialogs/weapon-dialog.mjs');
            launchWeaponDialog({ weapon: item, actor: this.actor });
            return;
          } else {
            return item.roll();
          }
        }
      }

      // Handle skill rolls.
      if (dataset.rollType === 'skill') {
        const skillKey = element.closest('.item').dataset.itemId;
        const skill = this.actor.system.skills[skillKey];
        if (!skill) {
          ui.notifications.warn(`Skill "${skillKey}" not found.`);
          return;
        }
        // Lookup abilityKey from config.skillDefinitions, not from skill data
        const abilityKey = CONFIG_UNBOUNDFATE.skillDefinitions[skillKey]?.ability;
        const ability = this.actor.system.abilities?.[abilityKey];
        launchSkillDialog({ skillKey, skill, abilityKey, ability, actor: this.actor, useSpecDefault: false });
        return;
      }

      // Handle skill specialisation rolls.
      if (dataset.rollType === 'skill-spec') {
        const skillKey = element.closest('.item').dataset.itemId;
        const skill = this.actor.system.skills[skillKey];
        if (!skill) {
          ui.notifications.warn(`Skill "${skillKey}" not found.`);
          return;
        }
        // Lookup abilityKey and specOptions from config.skillDefinitions
        const skillDef = CONFIG_UNBOUNDFATE.skillDefinitions[skillKey] || {};
        const abilityKey = skillDef.ability;
        const ability = this.actor.system.abilities?.[abilityKey];
        // Pre-populate the specialisation from the actor's skill data
        const specialisation = skill.specialisation || '';
        launchSkillDialog({
          skillKey,
          skill,
          abilityKey,
          ability,
          actor: this.actor,
          rollType: 'skill-spec',
          specialisation,
          useSpecDefault: true
        });
        return;
      }
      
      // Handle rolls that supply the formula directly.
      if (dataset.roll) {
        let label = dataset.label ? `[ability] ${dataset.label}` : '';
        let roll = new Roll(dataset.roll, this.actor.getRollData());
        roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label,
          rollMode: game.settings.get('core', 'rollMode'),
        });
        return roll;
      }
    });

    // Equipped checkbox handler for items
    html.on('change', 'input[type="checkbox"][name="system.isEquipped"]', (ev) => {
      const checkbox = ev.currentTarget;
      const li = $(checkbox).closest('li.item');
      const itemId = li.data('itemId');
      const item = this.actor.items.get(itemId);
      if (item) {
        item.update({ 'system.isEquipped': checkbox.checked });
        // Toggle equipped class for styling
        li.toggleClass('equipped', checkbox.checked);
      }
    });

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    console.log("Unbound Fate | _onItemCreate");
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = foundry.utils.duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system['type'];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    console.log("Unbound Fate | _onRoll");
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle skill rolls.
    if (dataset.rollType === 'skill') {
      const skillKey = element.closest('.item').dataset.itemId;
      const skill = this.actor.system.skills[skillKey];
      if (!skill) {
        ui.notifications.warn(`Skill "${skillKey}" not found.`);
        return;
      }
      // Lookup abilityKey from config.skillDefinitions, not from skill data
      const abilityKey = CONFIG_UNBOUNDFATE.skillDefinitions[skillKey]?.ability;
      const ability = this.actor.system.abilities?.[abilityKey];
      launchSkillDialog({ skillKey, skill, abilityKey, ability, actor: this.actor, useSpecDefault: false });
      return;
    }

    // Handle skill specialisation rolls.
    if (dataset.rollType === 'skill-spec') {
      const skillKey = element.closest('.item').dataset.itemId;
      const skill = this.actor.system.skills[skillKey];
      if (!skill) {
        ui.notifications.warn(`Skill "${skillKey}" not found.`);
        return;
      }
      // Lookup abilityKey and specOptions from config.skillDefinitions
      const skillDef = CONFIG_UNBOUNDFATE.skillDefinitions[skillKey] || {};
      const abilityKey = skillDef.ability;
      const ability = this.actor.system.abilities?.[abilityKey];
      // Pre-populate the specialisation from the actor's skill data
      const specialisation = skill.specialisation || '';
      launchSkillDialog({
        skillKey,
        skill,
        abilityKey,
        ability,
        actor: this.actor,
        rollType: 'skill-spec',
        specialisation,
        useSpecDefault: true
      });
      return;
    }
    
    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }
}
