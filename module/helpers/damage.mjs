// filepath: module/helpers/damage.mjs
import { UFRoll } from '../dice/UFRoll.mjs';

/**
 * Represents a single component of damage (e.g., fire, slashing, etc.)
 */
export class DamageComponent {
  /**
   * @param {object} data
   * @param {string} [data.label] - Label for the damage (e.g., 'Fire')
   * @param {string} data.formula - Dice formula (e.g., '2d6')
   * @param {string} [data.type] - Type of damage (e.g., 'fire', 'slashing')
   * @param {string} [data.source] - Source of the damage (e.g., 'spell', 'weapon')
   * @param {number} [data.total] - The rolled total (optional, for rolled damage)
   */
  constructor({ label = '', formula, type = '', source = '', total = null } = {}) {
    this.label = label;
    this.formula = formula;
    this.type = type;
    this.source = source;
    this.total = total;
  }

  /**
   * Returns a short string representation (formula only)
   */
  toShortString() {
    return this.formula || '';
  }

  /**
   * Returns a long string representation (label, formula, type)
   */
  toLongString() {
    let str = this.formula || '';
    if (this.type) str += ` ${this.type}`;
    if (this.label) str = `${this.label}: ${str}`;
    return str;
  }

  /**
   * Returns the rolled total, or 0 if not set
   */
  getTotal() {
    return typeof this.total === 'number' ? this.total : 0;
  }

  /**
   * Create a DamageComponent from a plain object
   */
  static fromObject(obj) {
    return new DamageComponent(obj);
  }
}

/**
 * Represents a full damage instance, which may have multiple components (e.g., fire + slashing)
 */
export class Damage {
  /**
   * @param {Array<object|DamageComponent>|object|Damage|null|undefined} components - Array of damage components, a single component, a Damage instance, or null/undefined
   */
  constructor(components = []) {
    // If already a Damage instance, clone its components
    if (components instanceof Damage) {
      this.components = components.components.map(c => c instanceof DamageComponent ? c : new DamageComponent(c));
    } else if (Array.isArray(components)) {
      this.components = components.map(c => c instanceof DamageComponent ? c : new DamageComponent(c));
    } else if (components && typeof components === 'object') {
      // If it's a plain object (not array), treat as single component or serialized Damage
      if (Array.isArray(components.components)) {
        // Looks like a serialized Damage instance
        this.components = components.components.map(c => c instanceof DamageComponent ? c : new DamageComponent(c));
      } else {
        // Treat as a single component object
        this.components = [new DamageComponent(components)];
      }
    } else {
      this.components = [];
    }
    this.rolled = this.components.some(c => typeof c.total === 'number');
  }

  /**
   * Add a component to this damage instance
   */
  addComponent(component) {
    this.components.push(component instanceof DamageComponent ? component : new DamageComponent(component));
  }

  /**
   * Roll all components that have a formula and no total yet. Sets .total for each.
   * Returns a Promise that resolves when all rolls are complete.
   */
  async rollAll(actor = null) {
    for (let comp of this.components) {
      if (comp.formula && (typeof comp.total !== 'number')) {
        let roll = new UFRoll(comp.formula, actor?.getRollData ? actor.getRollData() : {});
        await roll.evaluate();
        comp.total = roll.total;
        comp.roll = roll;
      }
    }
    this.rolled = true;
    return this;
  }

  /**
   * Returns true if all components have a numeric total (i.e., have been rolled)
   */
  isRolled() {
    return this.components.every(c => typeof c.total === 'number');
  }

  /**
   * Get the total damage (sum of all components)
   */
  getTotal() {
    if (!Array.isArray(this.components)) return 0;
    return this.components.reduce((sum, c) => sum + c.getTotal(), 0);
  }

  /**
   * Get a string representation (short or long form)
   */
  toString(longform = false) {
    return this.components.map(c => longform ? c.toLongString() : c.toShortString()).join(' ');
  }

  /**
   * Create a Damage instance from an array of objects/components
   */
  static fromArray(arr) {
    return new Damage(arr);
  }

  /**
   * Utility to sum totals from an array of DamageComponent or Damage instance
   */
  static sum(components) {
    if (components instanceof Damage) return components.getTotal();
    return (components || []).reduce((sum, c) => sum + (c?.getTotal?.() ?? c?.total ?? 0), 0);
  }

}
