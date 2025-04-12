import { Players } from "@rbxts/services";

// Simple logger function
const log = (message: string) => {
    print(`[UIStateManager] ${message}`);
};

log("Starting UIStateManager client script");

// Get local player
const player = Players.LocalPlayer;
log(`Script running for player: ${player.Name}`);

// Get UI elements
const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;

// Define UI states with priorities (higher number = higher priority)
enum UIState {
    None = 0,
    Shop = 10,
    Death = 20, // Death UI takes priority over shop
    // OnFire is managed separately and not affected by this state system
    OnFire = 30 // Highest priority - emergency state
}

// Track current UI state
let currentState = UIState.None;

// Function to manage UI visibility
const setUIState = (newState: UIState) => {
    // Only update if the new state has higher or equal priority
    if (newState >= currentState || newState === UIState.None) {
        const oldState = currentState;
        currentState = newState;
        log(`UI state changed: ${UIState[oldState]} -> ${UIState[newState]}`);
        
        // Update UI visibility based on current state
        updateUIVisibility();
        
        return true;
    }
    
    log(`UI state change rejected: ${UIState[currentState]} -> ${UIState[newState]} (lower priority)`);
    return false;
};

// Function to update UI visibility based on current state
const updateUIVisibility = () => {
    // Get UI elements - IMPORTANT: Don't require all elements to exist
    const shopUI = playerGui.FindFirstChild("GamepassShop") as ScreenGui;
    const deathUI = playerGui.FindFirstChild("DeathScreen") as ScreenGui;
    const disabledOriginalDeathUI = playerGui.FindFirstChild("OriginalDeathScreen_Disabled") as ScreenGui;
    // We don't modify the OnFire UI, just check if it exists for logging
    const onFireExists = playerGui.FindFirstChild("OnFire") !== undefined;
    
    // Handle each UI separately to avoid one missing UI preventing others from updating
    // This is more resilient than requiring all UIs to be present
    
    // Update visibility based on current state
    switch (currentState) {
        case UIState.None:
            // Hide UIs except for special ones that should remain visible
            if (shopUI) shopUI.Enabled = false;
            if (deathUI) deathUI.Enabled = false;
            if (disabledOriginalDeathUI) disabledOriginalDeathUI.Enabled = false;
            // IMPORTANT: Don't touch the OnFire UI - it's controlled by its own system
            log(`All managed UIs hidden (keeping OnFire UI ${onFireExists ? "found and" : "not found, but"} state intact)`);
            break;
        
        case UIState.Shop:
            // Show shop UI, hide death UI
            if (shopUI) shopUI.Enabled = true;
            if (deathUI) deathUI.Enabled = false;
            if (disabledOriginalDeathUI) disabledOriginalDeathUI.Enabled = false;
            // IMPORTANT: Don't affect the OnFire UI
            log("Shop UI shown (if available), Death UI hidden");
            break;
            
        case UIState.Death:
            // CRITICAL: Check lives before showing death UI
            const currentLives = player.GetAttribute("ExtraLives") as number ?? 0;
            
            if (currentLives <= 0) {
                // Only show death UI if player has no lives
                if (deathUI) deathUI.Enabled = true;
                if (shopUI) shopUI.Enabled = false;
                // IMPORTANT: Don't affect the OnFire UI
                log("Death UI shown (if available), Shop UI hidden - Player has no lives");
            } else {
                // Player has lives, don't show death screen
                if (deathUI) deathUI.Enabled = false;
                if (disabledOriginalDeathUI) disabledOriginalDeathUI.Enabled = false;
                // IMPORTANT: Don't affect the OnFire UI
                log("Death UI NOT shown - Player has lives");
                // Override state back to None
                currentState = UIState.None;
            }
            break;
    }
};

// Create a BindableFunction to expose the state management to other scripts
const stateManager = new Instance("BindableFunction");
stateManager.Name = "UIStateManager";

// Set up the function
stateManager.OnInvoke = (action: string, state?: string) => {
    if (action === "set") {
        const newState = UIState[state as keyof typeof UIState] as number;
        return setUIState(newState);
    } else if (action === "get") {
        return UIState[currentState];
    }
    return false;
};

// Parent the function to ReplicatedStorage for other scripts to access
stateManager.Parent = game.GetService("ReplicatedStorage");

// Track player death to automatically set Death UI state
player.CharacterAdded.Connect((character) => {
    const humanoid = character.WaitForChild("Humanoid") as Humanoid;
    
    // Handle death - with lives check
    humanoid.Died.Connect(() => {
        // IMPORTANT: Check if player has lives before showing death UI
        const currentLives = player.GetAttribute("ExtraLives") as number ?? 0;
        log(`Player died, checking lives before setting UI state. Lives: ${currentLives}`);
        
        if (currentLives <= 0) {
            // Only set Death state if player has no lives left
            setUIState(UIState.Death);
        } else {
            log("Player still has lives, not showing death screen");
            // Ensure death screen is hidden
            setUIState(UIState.None);
        }
    });
    
    // Reset state when character spawns
    setUIState(UIState.None);
});

// Initialize with current character if it exists
if (player.Character) {
    const humanoid = player.Character.FindFirstChildOfClass("Humanoid") as Humanoid;
    if (humanoid) {
        // Reset state
        setUIState(UIState.None);
        
        // Set up death handler
        humanoid.Died.Connect(() => {
            log("Player died, setting Death UI state");
            setUIState(UIState.Death);
        });
    }
}

log("UIStateManager initialized");
