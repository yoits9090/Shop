import { Players, MarketplaceService, ReplicatedStorage } from "@rbxts/services";

// Simple logger function
const log = (message: string) => {
    print(`[DeathManager-Client] ${message}`);
};

log("Starting DeathManager client script");

// Product ID for revive
const REVIVE_PRODUCT_ID = 3261484228;

// Get local player
const player = Players.LocalPlayer;
log(`Script running for player: ${player.Name}`);

// Get PlayerGui
const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;
log("Found PlayerGui, waiting for DeathScreen to copy from StarterGui...");

// Define a function to get or wait for DeathScreen
let deathScreen: ScreenGui | undefined;

const getDeathScreen = () => {
    // Try to find it now
    deathScreen = playerGui.FindFirstChild("DeathScreen") as ScreenGui;
    
    if (!deathScreen) {
        log("DeathScreen not found initially, will wait and check when needed");
    } else {
        log("Found DeathScreen ScreenGui");
    }
}

// EMERGENCY MEASURE: Create a special version of the death screen we control
let ourControlledDeathScreen: ScreenGui | undefined;

// Function to create a completely controlled death screen
const createControlledDeathScreen = () => {
    // First, remove any existing controlled screen
    if (ourControlledDeathScreen && ourControlledDeathScreen.IsDescendantOf(game)) {
        ourControlledDeathScreen.Destroy();
    }
    
    // Now create our version
    ourControlledDeathScreen = new Instance("ScreenGui");
    ourControlledDeathScreen.Name = "DeathScreen";
    ourControlledDeathScreen.ResetOnSpawn = false; // Important!
    ourControlledDeathScreen.DisplayOrder = 100; // High priority
    ourControlledDeathScreen.Enabled = false; // Start disabled
    
    // Create frame
    const frame = new Instance("Frame");
    frame.Name = "frame";
    frame.Size = new UDim2(0.5, 0, 0.5, 0);
    frame.Position = new UDim2(0.25, 0, 0.25, 0);
    frame.BackgroundColor3 = new Color3(0.1, 0.1, 0.1);
    frame.BackgroundTransparency = 0.3;
    frame.BorderSizePixel = 2;
    frame.Parent = ourControlledDeathScreen;
    
    // Create title
    const title = new Instance("TextLabel");
    title.Name = "title";
    title.Text = "You Died";
    title.TextSize = 30;
    title.TextColor3 = new Color3(1, 0, 0);
    title.Size = new UDim2(0.8, 0, 0.2, 0);
    title.Position = new UDim2(0.1, 0, 0, 0);
    title.BackgroundTransparency = 1;
    title.Parent = frame;
    
    // Create counter
    const counter = new Instance("TextLabel");
    counter.Name = "counter";
    counter.Text = "Extra Lives: 0";
    counter.TextSize = 18;
    counter.TextColor3 = new Color3(1, 1, 1);
    counter.Size = new UDim2(0.8, 0, 0.2, 0);
    counter.Position = new UDim2(0.1, 0, 0.2, 0);
    counter.BackgroundTransparency = 1;
    counter.Parent = frame;
    
    // Create revive button
    const reviveBtn = new Instance("TextButton");
    reviveBtn.Name = "Revive";
    reviveBtn.Text = "REVIVE";
    reviveBtn.TextSize = 20;
    reviveBtn.TextColor3 = new Color3(1, 1, 1);
    reviveBtn.Size = new UDim2(0.6, 0, 0.2, 0);
    reviveBtn.Position = new UDim2(0.2, 0, 0.6, 0);
    reviveBtn.BackgroundColor3 = new Color3(0.8, 0, 0);
    reviveBtn.BorderSizePixel = 0;
    reviveBtn.Parent = frame;
    
    // Connect revive button to purchase product
    reviveBtn.Activated.Connect(() => {
        log("Revive button clicked");
        MarketplaceService.PromptProductPurchase(player, REVIVE_PRODUCT_ID);
    });
    
    // Parent to PlayerGui
    ourControlledDeathScreen.Parent = playerGui;
    log("Created our controlled death screen");
    
    return ourControlledDeathScreen;
};

// Function to force death screen visibility based on player lives and character status
// This is our main control function for death screen visibility
const enforceCorrectDeathScreenState = () => {
    // STEP 1: Force-disable the original death screen if it exists
    const originalDeathScreen = playerGui.FindFirstChild("DeathScreen") as ScreenGui;
    if (originalDeathScreen && originalDeathScreen !== ourControlledDeathScreen) {
        // If we find the original one and it's not our controlled version, disable it
        originalDeathScreen.Enabled = false;
        // And rename it so it doesn't conflict with our screen
        originalDeathScreen.Name = "OriginalDeathScreen_Disabled";
        log("Disabled and renamed original death screen");
    }
    
    // STEP 2: Check if we need to create our controlled screen
    if (!ourControlledDeathScreen || !ourControlledDeathScreen.IsDescendantOf(game)) {
        createControlledDeathScreen();
    }
    
    // STEP 3: Update lives counter on our controlled screen
    if (ourControlledDeathScreen) {
        const frame = ourControlledDeathScreen.FindFirstChild("frame") as Frame;
        if (frame) {
            const counter = frame.FindFirstChild("counter") as TextLabel;
            if (counter) {
                const currentLives = player.GetAttribute("ExtraLives") as number ?? 0;
                if (currentLives <= 0) {
                    counter.Text = "GAME OVER - No Lives Left!";
                    counter.TextColor3 = new Color3(1, 0.2, 0.2);
                } else if (currentLives === 1) {
                    counter.Text = "WARNING! LAST LIFE!";
                    counter.TextColor3 = new Color3(1, 0.8, 0.2);
                } else {
                    counter.Text = `Extra Lives: ${currentLives}`;
                    counter.TextColor3 = new Color3(1, 1, 1);
                }
            }
        }
    }
    
    // STEP 4: Check player lives, character status, and update visibility
    const currentLives = player.GetAttribute("ExtraLives") as number ?? 0;
    const playerHasLives = currentLives > 0;
    
    // CRITICAL CHANGE: Only show death screen if player has no lives AND has no active character
    // This fixes the issue where death screen stays visible after respawning
    const hasActiveCharacter = player.Character !== undefined && 
                               player.Character.FindFirstChild("Humanoid") !== undefined;
    
    // If player has respawned, they shouldn't see the death screen, even with 0 lives
    const shouldShowDeathScreen = !playerHasLives && !hasActiveCharacter;
    
    log(`STRICT enforcement check - Lives: ${currentLives}, HasCharacter: ${hasActiveCharacter}, ShouldShowDeathScreen: ${shouldShowDeathScreen}`);
    
    // ONLY show death screen if player has no lives AND no character
    if (shouldShowDeathScreen) {
        // Player has no lives and no character, death screen should be visible
        if (ourControlledDeathScreen && !ourControlledDeathScreen.Enabled) {
            ourControlledDeathScreen.Enabled = true;
            log("Player has NO LIVES and NO CHARACTER, showing our controlled death screen");
        }
    } else {
        // Player has lives or has a character, death screen should be hidden
        if (ourControlledDeathScreen && ourControlledDeathScreen.Enabled) {
            ourControlledDeathScreen.Enabled = false;
            
            if (hasActiveCharacter) {
                log("Player HAS ACTIVE CHARACTER, hiding our controlled death screen regardless of lives");
            } else {
                log("Player HAS LIVES, hiding our controlled death screen");
            }
        }
    }
    
    // STEP 5: Notify UIStateManager - but don't interfere with Shop state
    const uiStateManager = game.GetService("ReplicatedStorage").FindFirstChild("UIStateManager") as BindableFunction;
    if (uiStateManager) {
        if (shouldShowDeathScreen) {
            // If player is out of lives and has no character, show death screen
            uiStateManager.Invoke("set", "Death");
            log("Player has no lives and no character - requested Death UI state")
        } else {
            // If player has lives or a character, only reset UI state if currently showing death screen
            // Get the current state first
            const currentState = uiStateManager.Invoke("get") as string;
            
            if (currentState === "Death") {
                // Only reset if we're showing the death screen
                uiStateManager.Invoke("set", "None");
                log("Player has either lives or an active character, resetting from Death UI state to None")
            } else if (currentState === "Shop") {
                // Don't interfere with Shop UI if it's currently showing
                log("Shop UI is active - preserving shop state")
            } else {
                log(`Current UI state is: ${currentState} - not changing`)
            }
        }
    }
    
    return playerHasLives; // Return if player has lives for other functions to use
};

// SUPER AGGRESSIVE failsafe - constantly check death screen state
task.spawn(() => {
    while (true) {
        enforceCorrectDeathScreenState();
        task.wait(0.25); // Check 4 times per second
    }
});

// Call the function to initialize or set up a check for DeathScreen
getDeathScreen();

// This function now returns our controlled death screen instead
const ensureDeathScreen = (): ScreenGui | undefined => {
    // We now use our controlled death screen as the primary screen
    if (!ourControlledDeathScreen || !ourControlledDeathScreen.IsDescendantOf(game)) {
        createControlledDeathScreen();
    }
    
    // Also make sure any other death screens are disabled
    const originalDeathScreen = playerGui.FindFirstChild("DeathScreen") as ScreenGui;
    if (originalDeathScreen && originalDeathScreen !== ourControlledDeathScreen) {
        // If it's not our controlled version, disable it
        originalDeathScreen.Enabled = false;
        // And rename it so it doesn't conflict with our screen
        originalDeathScreen.Name = "OriginalDeathScreen_Disabled";
        log("Disabled original death screen during ensureDeathScreen");
    }
    
    return ourControlledDeathScreen;
};

// Function to set up the death screen interface
const setupDeathScreen = () => {
    const ds = ensureDeathScreen();
    if (!ds) {
        log("WARNING: DeathScreen still not available");
        return false;
    }
    
    // IMPORTANT: Make sure death screen is disabled initially
    ds.Enabled = false;
    log("Disabled death screen on setup");
    
    // Double-check UI state via UIStateManager
    const uiStateManager = game.GetService("ReplicatedStorage").FindFirstChild("UIStateManager") as BindableFunction;
    if (uiStateManager) {
        // Only enable death UI if player actually has no lives
        const currentLives = player.GetAttribute("ExtraLives") as number ?? 0;
        if (currentLives <= 0) {
            log("Player has no lives, keeping death screen enabled if needed");
        } else {
            // Force None state for players with lives
            uiStateManager.Invoke("set", "None");
            log("Player has lives, forcing UI state to None");
        }
    }
    
    // Get the frame
    let frame = ds.FindFirstChild("frame") as Frame;
    
    // If frame doesn't exist, try to create it
    if (!frame) {
        log("WARNING: frame not found in DeathScreen, creating one");
        
        // Create a frame if it doesn't exist
        frame = new Instance("Frame");
        frame.Name = "frame";
        frame.Size = new UDim2(0.5, 0, 0.5, 0);
        frame.Position = new UDim2(0.25, 0, 0.25, 0);
        frame.BackgroundColor3 = new Color3(0.1, 0.1, 0.1);
        frame.BackgroundTransparency = 0.3;
        frame.BorderSizePixel = 2;
        frame.Parent = ds;
        
        // Create the counter TextLabel
        const counter = new Instance("TextLabel");
        counter.Name = "counter";
        counter.Text = "Extra Lives: 0";
        counter.TextSize = 18;
        counter.TextColor3 = new Color3(1, 1, 1);
        counter.Size = new UDim2(0.8, 0, 0.2, 0);
        counter.Position = new UDim2(0.1, 0, 0.2, 0);
        counter.BackgroundTransparency = 1;
        counter.Parent = frame;
        
        // Create the Revive button
        const reviveBtn = new Instance("TextButton");
        reviveBtn.Name = "Revive";
        reviveBtn.Text = "REVIVE";
        reviveBtn.TextSize = 20;
        reviveBtn.TextColor3 = new Color3(1, 1, 1);
        reviveBtn.BackgroundColor3 = new Color3(0.7, 0.2, 0.2);
        reviveBtn.Size = new UDim2(0.6, 0, 0.2, 0);
        reviveBtn.Position = new UDim2(0.2, 0, 0.6, 0);
        reviveBtn.Parent = frame;
        
        // Create a title/message TextLabel
        const titleLabel = new Instance("TextLabel");
        titleLabel.Name = "n";
        titleLabel.Text = "YOU DIED";
        titleLabel.TextSize = 24;
        titleLabel.TextColor3 = new Color3(1, 0.2, 0.2);
        titleLabel.Size = new UDim2(0.8, 0, 0.15, 0);
        titleLabel.Position = new UDim2(0.1, 0, 0.05, 0);
        titleLabel.BackgroundTransparency = 1;
        titleLabel.Parent = frame;
        
        log("Created new frame and UI elements for DeathScreen");
    }
    
    // Set up click handler for the Revive button
    const reviveButton = frame.FindFirstChild("Revive") as TextButton;
    if (reviveButton) {
        // Check if we already set up this button
        if (!reviveButton.GetAttribute("SetupComplete")) {
            reviveButton.MouseButton1Click.Connect(() => {
                log("Revive button clicked");
                MarketplaceService.PromptProductPurchase(player, REVIVE_PRODUCT_ID);
            });
            reviveButton.SetAttribute("SetupComplete", true);
            log("Revive button event handler connected");
        }
    } else {
        log("WARNING: Revive button not found in frame");
    }
    
    return true;
};

// Try to set up the death screen right away
setupDeathScreen();

// Run our enforcement check immediately
enforceCorrectDeathScreenState();

// Function to update lives counter
const updateLivesCounter = () => {
    // IMPORTANT: Force checking the attribute from the player
    // This helps avoid any caching issues
    task.wait(0.1); // Small delay to ensure attribute is updated
    const extraLives = player.GetAttribute("ExtraLives") as number ?? 0;
    log(`Player has ${extraLives} extra lives`);
    
    // Find the counter label
    const ds = ensureDeathScreen();
    if (!ds) return;
    
    const frame = ds.FindFirstChild("frame") as Frame;
    if (!frame) {
        log("WARNING: frame not found in DeathScreen");
        return;
    }
    
    // Try to find the counter label, being case-insensitive
    // Check all children of the frame to find a TextLabel that might be our counter
    log("Searching for counter label in frame");
    const frameChildren = frame.GetChildren();
    log(`Found ${frameChildren.size()} children in frame`);
    
    // Debugging: list all children to find the correct name
    frameChildren.forEach((child) => {
        log(`Child found: ${child.Name} (${child.ClassName})`);
    });
    
    // Try exact match first
    let counter = frame.FindFirstChild("counter") as TextLabel;
    
    // If not found, try case-insensitive search
    if (!counter) {
        counter = frameChildren.find(child => 
            child.IsA("TextLabel") && 
            child.Name.lower() === "counter") as TextLabel;
    }
    
    // As a last resort, just look for any TextLabel that might be our counter
    if (!counter) {
        counter = frame.FindFirstChildWhichIsA("TextLabel") as TextLabel;
        if (counter) log(`Found TextLabel with name: ${counter.Name}`);
    }
    
    if (counter) {
        // Different text based on lives remaining
        if (extraLives <= 0) {
            counter.Text = "GAME OVER - No Lives Left!";
            counter.TextColor3 = new Color3(1, 0.2, 0.2);
        } else if (extraLives === 1) {
            counter.Text = `WARNING! LAST LIFE!`;
            counter.TextColor3 = new Color3(1, 0.5, 0);
        } else {
            counter.Text = `Extra Lives: ${extraLives}`;
            counter.TextColor3 = new Color3(1, 1, 1);
        }
        counter.TextSize = 18; // Ensure text size is sufficient
        counter.TextScaled = false; // Make sure scaled text doesn't cause issues
        counter.Visible = true; // Ensure visibility
        log(`Updated ${counter.Name} text to: ${counter.Text}`);
    } else {
        log("ERROR: Could not find any suitable counter label in the frame");
    }
};

// Update lives on script start
updateLivesCounter();

// Force correct death screen state
enforceCorrectDeathScreenState();

// Setup main character handling
const setupCharacter = (character: Model) => {
    // IMPORTANT FIX: Even if player has 0 lives, if they have a character
    // they should not see the death screen - this is a key fix for respawning with 0 lives
    
    // Try to set up the death screen if not already done
    setupDeathScreen();
    
    // Always hide death screen when player has a character, regardless of lives
    const deathScreen = playerGui.FindFirstChild("DeathScreen") as ScreenGui;
    if (deathScreen) {
        deathScreen.Enabled = false;
        const currentLives = player.GetAttribute("ExtraLives") as number ?? 0;
        log(`Hiding death screen during character setup - player has ${currentLives} lives but active character`);
    }
    
    // Use UIStateManager to hide death screen when character spawns
    const uiStateManager = ReplicatedStorage.FindFirstChild("UIStateManager") as BindableFunction;
    if (uiStateManager) {
        uiStateManager.Invoke("set", "None");
        log("Character setup - requested death screen hidden via UIStateManager");
    }
    
    // Get humanoid
    const humanoid = character.FindFirstChildOfClass("Humanoid") as Humanoid;
    if (!humanoid) {
        log("WARNING: Humanoid not found in character");
        return;
    }
    
    // Listen for death
    humanoid.Died.Connect(() => {
        log(`Player died, updating lives counter`);
        
        // Make sure death screen is set up properly
        setupDeathScreen();
        
        // Update the counter
        updateLivesCounter();
        
        // UI visibility is managed by UIStateManager
    });
};

// Listen for NoLivesRemaining event from server
const noLivesEvent = ReplicatedStorage.WaitForChild("NoLivesRemaining") as RemoteEvent;
noLivesEvent.OnClientEvent.Connect(() => {
    log("Received NoLivesRemaining event from server - GAME OVER");
    
    // Set up the death screen contents first
    setupDeathScreen();
    const deathScreen = ensureDeathScreen();
    updateLivesCounter(); // Update counter immediately
    
    // Use UIStateManager to show death screen with priority
    const uiStateManager = ReplicatedStorage.FindFirstChild("UIStateManager") as BindableFunction;
    if (uiStateManager) {
        // First check if shop is currently active
        const currentState = uiStateManager.Invoke("get") as string;
        if (currentState === "Shop") {
            log("Not changing UI state because shop is active, but showing death screen")
            // Directly set our death screen visible without changing UI state
            if (deathScreen) deathScreen.Enabled = true;
        } else {
            uiStateManager.Invoke("set", "Death");
            log("Requested death screen display via UIStateManager");
        }
    }
    
    // Create a safeguard to keep death UI visible
    task.spawn(() => {
        // Keep checking to make sure death screen stays visible
        while (player.GetAttribute("ExtraLives") as number <= 0) {
            // Only force UI state to Death if needed and shop isn't active
            if (uiStateManager) {
                const currentState = uiStateManager.Invoke("get") as string;
                if (currentState !== "Shop") {
                    uiStateManager.Invoke("set", "Death");
                } else {
                    log("Preserving shop state even though player has no lives");
                }
            }
            task.wait(0.5);
        }
        log("Stopped death screen safeguard - player has lives now");
    });
    
    if (deathScreen) {
        // Make sure the Revive button is prominent
        const frame = deathScreen.FindFirstChild("frame") as Frame;
        if (frame) {
            const reviveButton = frame.FindFirstChild("Revive") as TextButton;
            if (reviveButton) {
                // Make the button more noticeable
                reviveButton.TextColor3 = new Color3(1, 1, 1);
                reviveButton.BackgroundColor3 = new Color3(0.8, 0.2, 0.2);
                reviveButton.Text = "REVIVE NOW (PURCHASE)";
                
                // Optional: add a pulsing effect
                task.spawn(() => {
                    while (reviveButton.IsDescendantOf(game)) {
                        reviveButton.TextSize = 20;
                        task.wait(0.6);
                        reviveButton.TextSize = 24;
                        task.wait(0.6);
                    }
                });
            }
            
            // Update lives counter text to indicate no lives left
            const counter = frame.FindFirstChild("counter") as TextLabel;
            if (counter) {
                counter.Text = "GAME OVER - No Lives Left!";
                counter.TextColor3 = new Color3(1, 0.2, 0.2);
            }
        }
    }
});

// Handle player revive from purchase
const reviveEvent = ReplicatedStorage.WaitForChild("RevivePlayer") as RemoteEvent;
reviveEvent.OnClientEvent.Connect(() => {
    log("Player has been revived");
    
    // Give a small delay to ensure lives attribute has been updated
    task.delay(0.2, () => {
        // Check if we actually have lives now
        const lives = player.GetAttribute("ExtraLives") as number ?? 0;
        
        if (lives > 0) {
            // Only hide death screen if we actually have lives
            const uiStateManager = ReplicatedStorage.FindFirstChild("UIStateManager") as BindableFunction;
            if (uiStateManager) {
                uiStateManager.Invoke("set", "None");
                log("Requested death screen hide via UIStateManager - player has lives");
            }
        } else {
            log("Not hiding death screen - player still has no lives");
        }
        
        // Update the counter with new lives
        updateLivesCounter();
    });
});

// Handle current character if it exists
if (player.Character) {
    log("Setting up existing character");
    setupCharacter(player.Character);
}

// Listen for character added
player.CharacterAdded.Connect((character) => {
    log("New character added, setting up");
    
    // CRITICAL FIX: When a character is added, ALWAYS hide the death screen first
    // This ensures the death screen is never showing when the player has an active character
    const ds = ensureDeathScreen();
    if (ds) {
        ds.Enabled = false;
        log("IMMEDIATELY hiding death screen on character spawn regardless of lives");
    }
    
    // Reset UI state if showing death screen
    const uiStateManager = ReplicatedStorage.FindFirstChild("UIStateManager") as BindableFunction;
    if (uiStateManager) {
        const currentState = uiStateManager.Invoke("get") as string;
        if (currentState === "Death") {
            uiStateManager.Invoke("set", "None");
            log("RESET UI state from Death to None on character spawn");
        }
    }
    
    // Use a slight delay before running full setup to ensure all systems are ready
    task.delay(0.1, () => {
        // Run our character setup which will properly configure everything
        // This includes disabling the death screen and setting correct UI states
        setupCharacter(character);
    });
});

// Listen for attribute changes (extra lives)
player.AttributeChanged.Connect((attributeName) => {
    if (attributeName === "ExtraLives") {
        updateLivesCounter();
        // Enforce correct death screen state when lives change
        enforceCorrectDeathScreenState();
    }
});

log("Death manager client script initialized");

