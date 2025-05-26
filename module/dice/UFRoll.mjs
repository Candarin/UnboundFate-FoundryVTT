// import { Roll } from "../../../../../resources/app/node_modules/foundry.js"; // Adjust import as needed for your setup

/**
 * Unbound Fate specific Roll class.
 */
export class UFRoll extends Roll {
    static SERIALIZE = true;

    /**
     * @param {string} formula - The dice formula (e.g., "5d6").
     * @param {object} data - Roll data, including Unbound Fate specific options.
     * @param {object} options - Additional roll options.
     *   options.targetNumber: The minimum die value to count as a hit (default 5).
     */
    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);
        // Store targetNumber in options, defaulting to 5 if not present
        this.options.targetNumber = options.targetNumber ?? 5;
    }

    /**
     * The number of dice that meet or exceed the hit targetNumber.
     * @returns {number}
     */
    get hits() {
        let hits = 0;
        for (const term of this.terms) {
            if (term.results) {
                hits += term.results.filter(r => !r.discarded && r.result >= 5).length;
            }
        }
        return hits;
    }

    /**
     * The number of dice that rolled a 1 (fumble).
     * @returns {number}
     */
    get fumbles() {
        let fumbles = 0;
        for (const term of this.terms) {
            if (term.results) {
                fumbles += term.results.filter(r => !r.discarded && r.result === 1).length;
            }
        }
        return fumbles;
    }

    /**
     * The hit targetNumber for this roll.
     * @returns {number}
     */
    get targetNumber() {
        return this.options.targetNumber;
    }

    /**
     * Returns Unbound Fate specific roll data.
     * @returns {object}
     */
    getUFData() {
        return { targetNumber: this.options.targetNumber };
    }

    /**
     * Determines if the roll is a success (hits >= targetNumber)
     * @returns {boolean}
     */
    isSuccess() {
        return this.hits >= this.targetNumber;
    }

    /**
     * Determines if the roll is a failure (hits < targetNumber)
     * @returns {boolean}
     */
    isFailure() {
        return this.hits < this.targetNumber;
    }
}