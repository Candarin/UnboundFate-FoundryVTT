export const UNBOUNDFATE = {};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
UNBOUNDFATE.abilities = {
  str: 'UNBOUNDFATE.Ability.Str.long',
  agl: 'UNBOUNDFATE.Ability.Agl.long',
  end: 'UNBOUNDFATE.Ability.End.long',
  int: 'UNBOUNDFATE.Ability.Int.long',
  wil: 'UNBOUNDFATE.Ability.Wil.long',
  prs: 'UNBOUNDFATE.Ability.Prs.long',
  awr: 'UNBOUNDFATE.Ability.Awr.long',
};

UNBOUNDFATE.abilityAbbreviations = {
  str: 'UNBOUNDFATE.Ability.Str.abbr',
  agl: 'UNBOUNDFATE.Ability.Agl.abbr',
  end: 'UNBOUNDFATE.Ability.End.abbr',
  int: 'UNBOUNDFATE.Ability.Int.abbr',
  wis: 'UNBOUNDFATE.Ability.Wil.abbr',
  prs: 'UNBOUNDFATE.Ability.Prs.abbr',
  awr: 'UNBOUNDFATE.Ability.Awr.abbr',
};

UNBOUNDFATE.skills = {
  athletics: 'UNBOUNDFATE.Skill.athletics',
  blades: 'UNBOUNDFATE.Skill.blades',
  stealth: 'UNBOUNDFATE.Skill.stealth',
}

UNBOUNDFATE.skillDefinitions = {
  athletics: {
    ability: 'str',
    specOptions: [
      'Climbing',
      'Jumping',
      'Swimming',
      'Running'
    ]
  },
  blades: {
    ability: 'str',
    specOptions: [
      'Longblades',
      'Shortblades',
      'Axes'
    ]
  },
  stealth: {
    ability: 'agl',
    specOptions: [
      'Sneaking',
      'Hiding',
      'Shadowing',
      'Camouflage'
    ]
  },
  // Add other skill definitions here
};

UNBOUNDFATE.attackTypeDefinitions = {
  melee: {
    defaultAbility: 'str',
    name: 'UNBOUNDFATE.AttackType.melee',
  },
  ranged: {
    defaultAbility: 'agl',
    name: 'UNBOUNDFATE.AttackType.ranged',
  },
};

// Theme definitions
export const THEME_CONFIG = {
  'unboundfate-default': {
    label: "Unbound Fate Default",
    css: "css/unboundfate.css",
    class: "theme-unboundfate-default"
  },
  'unboundfate-dark': {
    label: "Unbound Fate Dark",
    css: "css/unboundfate-dark.css",
    class: "theme-unboundfate-dark"
  },
  'unboundfate-cyberpunk': {
    label: "Unbound Fate Cyberpunk",
    css: "css/unboundfate-cyberpunk.css",
    class: "theme-unboundfate-cyberpunk"
  }
};

