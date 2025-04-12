import { Players } from "@rbxts/services";

// Simple logger function
const log = (message: string) => {
    print(`[HideDeathScreen] ${message}`);
};

log("Starting HideDeathScreen client script");

// Get local player
const player = Players.LocalPlayer;
log(`Script running for player: ${player.Name}`);

// Get PlayerGui
const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;

// Create a whitelist of UI elements that should NEVER be touched by this script
// This is a strong protection against interfering with other UI systems
const PROTECTED_UIS = [
    "GamepassShop",
    "OnFire",
    "ShopUI",
    "GameMenu",
    "Notification"
];

// Create a special attribute to protect UIs from this system
const PROTECTION_ATTRIBUTE = "DeathScreenProtected";

// Safer death screen hiding function that respects protected UIs
const forceHideDeathScreen = () => {
    // Directly check for the DeathScreen
    const deathScreen = playerGui.FindFirstChild("DeathScreen") as ScreenGui;
    if (deathScreen && !isProtectedUI(deathScreen)) {
        // Only hide if player has lives
        const lives = player.GetAttribute("ExtraLives") as number ?? 0;
        
        if (lives > 0) {
            // Force disable the death screen
            if (deathScreen.Enabled) {
                deathScreen.Enabled = false;
                log("FORCED DeathScreen to be disabled - player has lives");
            }
        }
    }
    
    // More selective scan for death screens only
    playerGui.GetChildren().forEach(child => {
        // First check: is this a UI we should never touch?
        if (isProtectedUI(child)) {
            // Skip protected UIs completely
            return;
        }
        
        if (child.IsA("ScreenGui")) {
            // Only target explicit death screen related UIs
            // More specific matching to avoid false positives
            if (child.Name.match("^DeathScreen") || child.Name === "OriginalDeathScreen_Disabled") {
                const screenGui = child as ScreenGui;
                const lives = player.GetAttribute("ExtraLives") as number ?? 0;
                
                if (lives > 0 && screenGui.Enabled) {
                    screenGui.Enabled = false;
                    log(`FORCED ${child.Name} to be disabled - player has lives`);
                }
            }
        }
    });
};

// Check if a UI is protected (should be left alone)
const isProtectedUI = (uiInstance: Instance): boolean => {
    // Check direct name match
    if (PROTECTED_UIS.includes(uiInstance.Name)) {
        return true;
    }
    
    // Check for protection attribute
    if (uiInstance.GetAttribute(PROTECTION_ATTRIBUTE)) {
        return true;
    }
    
    return false;
};

// Run continuous loop to force death screen off - but less aggressively
const FORCE_INTERVAL = 0.5; // Check only twice per second (was 0.1)
task.spawn(() => {
    while (true) {
        forceHideDeathScreen();
        task.wait(FORCE_INTERVAL);
    }
});

// Also check on every attribute change
player.AttributeChanged.Connect((attributeName) => {
    if (attributeName === "ExtraLives") {
        forceHideDeathScreen();
    }
});

// Also check on character added
player.CharacterAdded.Connect(() => {
    // Run multiple times to catch any timing issues
    for (let i = 0; i < 5; i++) {
        task.delay(i * 0.2, forceHideDeathScreen);
    }
});

log("HideDeathScreen script initialized and running");
