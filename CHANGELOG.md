# CHANGELOG

## 1.0.0
- Initial creation

## 1.0.1
- Updated Foundry version compatibility

## 1.0.2
- Actor: removed some unnecessary modifiers
- Added actor logging for debug purposes

## 1.0.3
- Actor: updated template.json

## 1.0.4
- Actor: updated template.json. Changes to character sheet
- Item: updated data model

## 1.0.5
- Actor sheet: Added talents and flaws tab. Layout changes

## 1.0.6
- Actor: Sheet rendering fixes

## 1.0.7
- Actor: Added hbs partial to preloader

## 1.0.8
- Actor: updates to sheet

## 1.0.9
- Actor: updates to sheet

## 1.0.10
- System: Updated grid reference to correct deprecation
- Actor: updates to sheet

## 1.0.11
- System: Updated title

## 1.0.12
- Actor: updates to sheet

## 1.0.13
- Actor: updates to sheet
- Skills: Added first bits

## 1.0.14
- Actor: updates to sheet for skills

## 1.0.15
- Actor: updates to sheet for skills

## 1.0.16
- Actor: updates to sheet for skills

## 1.0.17
- Actor: updates to sheet for skills

## 1.0.18
- Actor: updates to sheet for skills
- Item: Added talent item sheet

## 1.0.19
- Actor: updates to sheet for skills
- Added test system settings

## 1.0.20
- Actor: updates to sheet for skills/layout
- Settings: Added import statement

## 1.0.21
- Actor: updates to sheet for skills/layout/localisation

## 1.0.22
- Actor: updates to sheet for skills/layout/localisation

## 1.0.23
- Actor: updates to sheet for skills/layout/localisation

## 1.0.24
- Actor: updates to sheet for skills. Added skill modal

## 1.0.25
- Actor: updates to skill modal process

## 1.0.26
- Actor: updates to skill modal process

## 1.0.27
- Actor: updates to skill modal process

## 1.0.28
- Actor: updates to skill modal process

## 1.0.29
- Actor: updates to skill modal process

## 1.0.30
- Actor: updates to skill roll process

## 1.0.31
- Actor: updates to skill roll process

## 1.0.32
- Added background and thumbnail images
- Actor: updates to skill roll process

## 1.0.33
- Actor: updates to skill roll process
- Actor: Added character creation ribbon
- Shifted skill rolls and dialogs to separate files

## 1.0.34
- Actor: updates to skill roll process
- Added skill definitions

## 1.0.35
- Actor: updates to skill roll process

## 1.0.36
- Actor: updates to skill roll dialog. Added ability selector and specialisation toggle.

## 1.0.37
- Actor: updates to skill roll dialog. Added skill spec roll. Fixes for character creation ribbon.
- Added weapon item sheet

## 1.0.38
- Actor: Shifted skill roll dialog to hbs template. Corrected some logic

## 1.0.39
- Actor: Improved Item sheet
- Weapon: Improvements to sheet
- corrected roll.evaluate call

## 1.0.40
- Added weapon attack dialog and roll logic with targeting support
- Refactored weapon dialog to use Handlebars template
- Grouped actor item lists (weapons, armour, gear) with section headers and add buttons
- Split talents and flaws into separate groups and updated talents tab
- Updated NPC sheet to use the same tab structure/partials as the character sheet
- Improved item/weapon sheet roll handling and UI consistency

## 1.0.41
- Refactored abilities partial: moved code from actor-attributes.hbs to actor-abilities.hbs and deleted the old file.
- Updated both character and NPC sheets to use the new abilities partial for consistency.
- Standardized NPC sheet structure to match the character sheet, including tab layout and use of modular partials for abilities, skills, items, talents/flaws, and effects.
- Improved maintainability and modularity of sheet templates.

## 1.0.42
- Fixed issues with actor sheet layout.

## 1.0.43
- added weapon dodge dialog and roll

## 1.0.44
- Fixed issue on actor sheet rendering

## 1.0.45
- Fixed issue on actor sheet rendering
- Fixed issue with UFRoll registration

## 1.0.46
- Fixed issue on actor sheet rendering

## 1.0.47
- Added dodge roll and weapon damage roll

## 1.0.48
- Corrected some logic in the dodge roll

## 1.0.49 
- Updated weapon dialog

## 1.0.50
- Updated weapon dialog

## 1.0.51
- Updated weapon dialog
- Added skill Blades
- actor sheet layout changes

## 1.0.52
- Updated weapon dialog

## 1.0.53
- Updated weapon dialog

## 1.0.54
- Updated weapon dialog

## 1.0.55
- Updated weapon dialog

## 1.0.56
- Updated weapon dialog

## 1.0.57
- Updated weapon dialog

## 1.0.58
- Updated weapon dialog

## 1.0.59
- Updated weapon dialog

## 1.0.60
- Updated weapon dialog
- Updated weapon item card

## 1.0.61
- Updated weapon dialog (attackType, damage calc by attackType)
- Updated weapon item card
- Added melee and ranged tab toggling based on weapon

## 1.0.62
- Updated weapon and dodge dialogs

## 1.0.63
- Updated weapon dialog and roll
- Added chat-actor hbs

## 1.0.64
- Updated weapon and dodge dialogs and rolls

## 1.0.65
- Updated weapon and dodge dialogs and rolls

## 1.0.66
- Updated weapon and dodge dialogs and rolls
- added actor-utils functions

## 1.0.67
- Remove localization from weapon dialog

## 1.0.68
- Updated dodge dialog and roll
- updated item sheets for armour, shields and weapons
- added more chat hbs templates

## 1.0.69
- Fixed error

## 1.0.70
- Fixed error in handlebars preloader

## 1.0.71
- Fixed another error in handlebars preloader

## 1.0.72
- Changes to dodge roll and chatMessage appearance

## 1.0.73
- Changes to dodge roll and chatMessage appearance
- added chat hbs temlate (success vs target)

## 1.0.74
- Changes to dodge roll and chatMessage appearance

## 1.0.75
- Implemented themes and theme selection settings
- updates to weapondodge roll and dialog

## 1.0.76
- Updated main css selector

## 1.0.77
- added hit point calc
- corrected some template errors
- added some initial css for HP
- minor changes on weapon sheet

## 1.0.78
- Added range hbs helpers
- fixed issue with grit in HP calc

## 1.0.79
- dodge dialog - armour fix
- character sheet layout changes
- weapon changes (skills)

## 1.0.80
- HP updates (layout/css)
- weapon dialog fix

## 1.0.81
- added damage roll
- HP css tweaks

## 1.0.82
- adjustments to damage process
- added first cut of clickable chat actor portraits

## 1.0.83
- chat message css updates
- fixed errors in weapon dialog
- added logging function

## 1.0.84
- Fixed reference errors

## 1.0.85
- Fixed reference errors

## 1.0.86
- css updates
- dialog changes for tokenId

## 1.0.87
- added hp logging (+ datetime handlebars helper)
- shifted damage roll to attack dialog
- updated stat-box-value css

## 1.0.88
- add system setting to toggle HP logging
- remove hp logging toggle from character and just use system setting
- style damage box
- update NPC to be the same as character
- update damage string creation
- add damage to dodge dialog
- add short form damage string

## 1.0.89
- Fixed issue on dodge dialog
- Fixed issue with HP logging
- minor css tweaks

## 1.0.90
- Added Damage class and refactored damage process
- add tooltip to damage string display

## 1.0.91
- Fixed issue in dodge dialog

## 1.0.92
- Fixed issue in damage class

## 1.0.93
- add Handlebars helpers, and adjust weapon dialog damage handling

## 1.0.94
- refactor: update HP log button from button to link for improved UI consistency 
- Fixed import statement on weapon dialog

## 1.0.95
- Fixed issue damage handling
- Updated weapon dodge dialog

## 1.0.96
- Bug fixes in dodge roll and damage class

## 1.0.97
- Added rendering for damage components in chat messages.
- Created a new dialog for editing skills on actors.
- Updated HP log button to improve UI consistency across actor sheets.
- Adjusted damage string formatting and fixed minor UI issues.

## 1.0.98
- Fixed error in damage handling
- Fixed issue in spec bonus on weapon dialog

## 1.0.99
- Add race item template and enhance damage component styling

## 1.0.100
- Refactor weapon dialog layout 
- Fix damage component rendering

## 1.0.101
- Added race selection feature 
- Minor update to damage component styling

## 1.0.102
- Add actor race template registration
- Refactor HP display in character sheets to hbs partial

## 1.0.103
- Add fate points feature for new characters 
- Update templates

## 1.0.104
- Enhance UI component css
- Localizations

## 1.0.105
- Enhance UI and stylings, and fix bindings

## 1.0.106
- Improved weapon attack and dodge dialogs 
- update styles for HP bar and dialog templates

## 1.0.107
- Add Grit feature and update HP bar styles in actor templates

## 1.0.108
- Add actions template and integrate into character sheet

## 1.0.109
- Enhanced ability score management with new styles and calculations
- Added CSS styles for ability containers and inputs.
- Updated template to reflect new structure for ability scores.

## 1.0.110
- Fixed issue on actor-abilities.hbs

## 1.0.111
- Updates to actor-abilities styling

## 1.0.112
- Improved styling for character sheet components

TODO
- add damage to attack message
- Weapon dialog. correct update of skill rating