import { THEME_CONFIG } from './helpers/config.mjs';
import { ufLog } from './helpers/system-utils.mjs';

// Register module settings for Foundry VTT
export const registerSystemSettings = () => {
    game.settings.register("unboundfate", "exampleSetting", {
        name: "Example Setting",
        hint: "This is an example setting for the Unbound Fate module.",
        scope: "world", // "world" for global settings, "client" for per-user settings
        config: true, // Display in the settings menu
        type: String, // Data type: String, Number, Boolean, etc.
        default: "default value", // Default value
        onChange: value => {
            ufLog(`Example Setting changed to: ${value}`);
        }
    });

    game.settings.register("unboundfate", "enableFeature", {
        name: "Enable Feature",
        hint: "Toggle to enable or disable a specific feature.",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: value => {
            ufLog(`Enable Feature setting changed to: ${value}`);
        }
    });

    game.settings.register("unboundfate", "theme", {
        name: "Theme",
        hint: "Select your preferred UI theme.",
        scope: "client",
        config: true,
        type: String,
        choices: Object.fromEntries(Object.entries(THEME_CONFIG).map(([k, v]) => [k, v.label])),
        default: "unboundfate-default",
        onChange: value => {
            if (window.setUnboundFateTheme) window.setUnboundFateTheme(value);
        }
    });

    game.settings.register("unboundfate", "hpLogMaxEntries", {
        name: "HP Log Maximum Entries",
        hint: "Maximum number of HP log entries to keep per actor/NPC. Older entries will be trimmed.",
        scope: "world",
        config: true,
        type: Number,
        default: 20,
        range: { min: 1, max: 100, step: 1 },
        onChange: value => {
            ufLog(`HP Log max entries changed to: ${value}`);
        }
    });
};
