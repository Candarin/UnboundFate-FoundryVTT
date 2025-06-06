import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class UnboundFateItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['unboundfate', 'sheet', 'item'],
      width: 520,
      height: 480,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'description',
        },
      ],
    });
  }

  /** @override */
  get template() {
    const path = 'systems/unboundfate/templates/item';
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.hbs`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.hbs`.
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = this.document.toObject(false);

    // Enrich description info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    context.enrichedDescription = await TextEditor.enrichHTML(
      this.item.system.description,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Necessary in v11, can be removed in v12
        async: true,
        // Data to fill in for inline rolls
        rollData: this.item.getRollData(),
        // Relative UUID resolution
        relativeTo: this.item,
      }
    );

    // Add the item's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;

    // Adding a pointer to CONFIG.UNBOUNDFATE
    context.config = CONFIG.UNBOUNDFATE;

    // Add flags for melee/ranged tab visibility
    context.showMeleeTab = itemData.system.isMelee;
    context.showRangedTab = itemData.system.isRanged;

    // Prepare active effects for easier access
    context.effects = prepareActiveEffectCategories(this.item.effects);

    // Add skill options for melee.skill if this is a weapon
    if (this.item.type === 'weapon') {
      const skillDefs = CONFIG.UNBOUNDFATE.skillDefinitions || {};
      context.skillOptions = Object.keys(skillDefs).map((key) => ({
        key,
        label: game.i18n.localize(CONFIG.UNBOUNDFATE.skills[key] || key),
        selected: itemData.system?.melee?.skill === key,
      }));
    }

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.

    // Add listeners for isMelee and isRanged checkboxes to show/hide matching tabs
    html.find('input[name="system.isMelee"]').on('change', function () {
      const meleeTab = html.find('.tab[data-tab="melee"]');
      if (this.checked) {
        meleeTab.show();
      } else {
        meleeTab.hide();
      }
    });
    html.find('input[name="system.isRanged"]').on('change', function () {
      const rangedTab = html.find('.tab[data-tab="ranged"]');
      if (this.checked) {
        rangedTab.show();
      } else {
        rangedTab.hide();
      }
    });

    // Active Effect management
    html.on('click', '.effect-control', (ev) =>
      onManageActiveEffect(ev, this.item)
    );
  }
}
