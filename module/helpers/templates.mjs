/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Actor partials.
    // Features are not used in the current system, so they are commented out.
    // 'systems/unboundfate/templates/actor/parts/actor-features.hbs', 

    'systems/unboundfate/templates/actor/parts/actor-items.hbs',
    'systems/unboundfate/templates/actor/parts/actor-spells.hbs',
    'systems/unboundfate/templates/actor/parts/actor-talents.hbs',
    'systems/unboundfate/templates/actor/parts/actor-effects.hbs',
    'systems/unboundfate/templates/actor/parts/actor-skills.hbs',
    'systems/unboundfate/templates/actor/parts/actor-abilities.hbs',
    // Item partials
    'systems/unboundfate/templates/item/parts/item-effects.hbs',    
    // Chat partials
    'systems/unboundfate/templates/chat/chat-actor.hbs',
    'systems/unboundfate/templates/chat/chat-weapon.hbs',
  ]);
};
