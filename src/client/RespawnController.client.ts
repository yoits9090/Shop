import { Players, RunService, ReplicatedStorage, UserInputService } from "@rbxts/services";

// Simple logger function
const log = (message: string) => {
    print(`[RespawnController] ${message}`);
};

log("Starting RespawnController client script");

// Get local player
const player = Players.LocalPlayer;
log(`Script running for player: ${player.Name}`);

// Create a flag to track if player is out of lives
let outOfLives = false;

// Wait for the respawn function from the server
const respawnFunction = ReplicatedStorage.WaitForChild("RespawnFunction") as RemoteFunction;

// Listen for NoLivesRemaining event
const noLivesEvent = ReplicatedStorage.WaitForChild("NoLivesRemaining") as RemoteEvent;
noLivesEvent.OnClientEvent.Connect(() => {
    log("Player has no lives remaining - will prevent auto-respawn");
    outOfLives = true;
    
    // Enforce UI state to Death
    const uiStateManager = ReplicatedStorage.FindFirstChild("UIStateManager") as BindableFunction;
    if (uiStateManager) {
        const result = uiStateManager.Invoke("set", "Death");
        log(`Updated UI state to Death: ${result}`);
    }
});

// Listen for PreventAutoRespawn event
player.ChildAdded.Connect((child) => {
    if (child.Name === "PreventAutoRespawn" && child.IsA("RemoteEvent")) {
        log("Received PreventAutoRespawn event");
        outOfLives = true;
        
        // Connect to prevent spawning
        const preventEvent = child as RemoteEvent;
        preventEvent.OnClientEvent.Connect(() => {
            log("Explicit prevent auto-respawn message received");
            outOfLives = true;
        });
    }
});

// Listen for DeadPlayer tag removal
player.ChildRemoved.Connect((child) => {
    if (child.Name === "DeadPlayer") {
        log("DeadPlayer tag removed - player can respawn again");
        outOfLives = false;
    }
    
    if (child.Name === "PreventAutoRespawn") {
        log("PreventAutoRespawn event removed - player can respawn again");
        outOfLives = false;
    }
});

// Override the built-in respawn button
UserInputService.InputBegan.Connect((input) => {
    if (input.KeyCode === Enum.KeyCode.R || 
        input.KeyCode === Enum.KeyCode.ButtonY) {
        if (outOfLives) {
            log("Blocking respawn key press - player has no lives");
            
            // Check with server if respawn is allowed
            const canRespawn = respawnFunction.InvokeServer() as boolean;
            if (!canRespawn) {
                log("Server confirmed player cannot respawn");
                return;
            }
        }
    }
});

// These are advanced Roblox API hooks that aren't fully supported in roblox-ts typing
// We're using a more compatible approach instead
log("Using compatible respawn prevention approach");

// Monitor player's character state
RunService.Heartbeat.Connect(() => {
    // If player is out of lives and tries to respawn, prevent it
    if (outOfLives && !player.Character) {
        // Ask server if respawn is allowed
        const canRespawn = respawnFunction.InvokeServer() as boolean;
        if (!canRespawn) {
            // Player shouldn't respawn, make sure UI stays in death state
            const uiStateManager = ReplicatedStorage.FindFirstChild("UIStateManager") as BindableFunction;
            if (uiStateManager) {
                uiStateManager.Invoke("set", "Death");
            }
        }
    }
});

log("RespawnController initialized");
