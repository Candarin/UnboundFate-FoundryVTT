// Import system settings.
import { registerSystemSettings } from './settings.mjs';
// Import document classes.
import { UnboundFateActor } from './documents/actor.mjs';
import { UnboundFateItem } from './documents/item.mjs';
// Import sheet classes.
import { UnboundFateActorSheet } from './sheets/actor-sheet.mjs';
import { UnboundFateItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { UNBOUNDFATE, THEME_CONFIG } from './helpers/config.mjs';
// Import custom rolls
import { UFRoll } from './dice/UFRoll.mjs';
// Import chat listeners
import { registerUnboundFateChatListeners } from './helpers/listeners.mjs';
// Import logging utility
import { ufLog } from '../helpers/system-utils.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.unboundfate = {
    UnboundFateActor,
    UnboundFateItem,
    rollItemMacro,
  };

  // Add custom constants for configuration.
  CONFIG.UNBOUNDFATE = UNBOUNDFATE;

  // Register System Settings
  ufLog("Initializing System settings...");
  registerSystemSettings();

  // Apply the current theme setting on system load
  const themeKey = game.settings?.get("unboundfate", "theme") || "unboundfate-default";
  setUnboundFateTheme(themeKey);
  // Make available globally for settings onChange
  window.setUnboundFateTheme = setUnboundFateTheme;


  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d20 + @abilities.dex.mod',
    decimals: 2,
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = UnboundFateActor;
  CONFIG.Item.documentClass = UnboundFateItem;

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('unboundfate', UnboundFateActorSheet, {
    makeDefault: true,
    label: 'UNBOUNDFATE.SheetLabels.Actor',
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('unboundfate', UnboundFateItemSheet, {
    makeDefault: true,
    label: 'UNBOUNDFATE.SheetLabels.Item',
  });

  // Register UFRoll with CONFIG.Dice.rolls to allow rehydration from chat data
  CONFIG.Dice.rolls.push(UFRoll);

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

// Handlebars helper: range(start, end) => [start, ..., end]
Handlebars.registerHelper('range', function(start, end) {
  start = Number(start);
  end = Number(end);
  let result = [];
  for (let i = start; i <= end; i++) result.push(i);
  return result;
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));

  // Register chat listeners for dodge buttons
  registerUnboundFateChatListeners();
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.unboundfate.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'unboundfate.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}

/**
 * Applies the selected Unbound Fate theme by updating the <body> class.
 * @param {string} themeKey - The key of the selected theme.
 */
function setUnboundFateTheme(themeKey) {
    const themeConfig = THEME_CONFIG[themeKey] || THEME_CONFIG["unboundfate-default"];
    const body = document.body;
    // Remove all Unbound Fate theme classes
    Object.keys(THEME_CONFIG).forEach(key => {
        body.classList.remove(THEME_CONFIG[key].class);
    });
    // Add the selected theme class
    body.classList.add(themeConfig.class);
    // Log the theme change
    ufLog(`Theme changed to: ${themeKey} (${themeConfig.label})`);
}


