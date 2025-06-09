import { ufLog } from '../helpers/system-utils.mjs';

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class UnboundFateActor extends Actor {
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the actor source data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.unboundfate || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);

    // Debug: Log the actor
    ufLog(this);
  }

  
  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;
    const systemData = actorData.system;
    // Ensure specialAbilities.grt exists for characters
    if (!systemData.specialAbilities) systemData.specialAbilities = {};
    if (!systemData.specialAbilities.grt) systemData.specialAbilities.grt = { value: 0, available: 0 };
    this._calculateHitPoints(systemData);

    // Make modifications to data here. For example:
    // Loop through ability scores, and add their modifiers to our sheet output.
    //for (let [key, ability] of Object.entries(systemData.abilities)) {
      // Calculate the modifier using d20 rules.
      //ability.mod = Math.floor((ability.value - 10) / 2);
    //}
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;
    const systemData = actorData.system;
    // Ensure specialAbilities.grt exists for npcs (if needed)
    if (!systemData.specialAbilities) systemData.specialAbilities = {};
    if (!systemData.specialAbilities.grt) systemData.specialAbilities.grt = { value: 0, available: 0 };
    systemData.xp = systemData.cr * systemData.cr * 100;
    this._calculateHitPoints(systemData);

    // Make modifications to data here. For example:
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const data = { ...this.system };

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.abilities) {
      for (let [k, v] of Object.entries(data.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    // Add level for easier access, or fall back to 0.
    if (data.attributes.level) {
      data.lvl = data.attributes.level.value ?? 0;
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }


   /**
   * Calculate and set hit points based on ability scores.
   * This should be called from both character and NPC data prep.
   */
  _calculateHitPoints(systemData) {
    // Current Calculation: maxHP = ((STR + END) x 3) + Grit
    const str = systemData.abilities?.str?.value || 0;
    const end = systemData.abilities?.end?.value || 0;
    const grt = systemData.specialAbilities?.grt?.value || 0;
    if (!systemData.hitPoints) systemData.hitPoints = {};
    systemData.hitPoints.maxHP = ((str + end) * 3) + (grt);
    // Clamp currentHP to maxHP if needed
    if (systemData.hitPoints.currentHP > systemData.hitPoints.maxHP) {
      systemData.hitPoints.currentHP = systemData.hitPoints.maxHP;
    }
  }

}
