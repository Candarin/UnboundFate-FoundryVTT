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
            console.log(`Unbound Fate | Example Setting changed to: ${value}`);
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
            console.log(`Unbound Fate | Enable Feature setting changed to: ${value}`);
        }
    });
};
