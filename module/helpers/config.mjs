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
