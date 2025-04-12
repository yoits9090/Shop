import { Players } from "@rbxts/services";

// Simple logger function
const log = (message: string) => {
    print(`[RegenerationService] ${message}`);
};

log("Starting RegenerationService");

// Constants
const REGENERATION_GAMEPASS_ID = 1150966154; // From ShopManager.client.ts
const REGEN_RATE = 1; // Health points per second
const REGEN_INTERVAL = 1; // Check every 1 second

// Keep track of which players have regeneration
const playersWithRegen = new Map<Player, boolean>();

// Check if a player has the regeneration gamepass
const hasRegenerationGamepass = (player: Player): boolean => {
    // First check our cache
    if (playersWithRegen.has(player)) {
        return playersWithRegen.get(player) as boolean;
    }
    
    // Otherwise, check their gamepass and cache the result
    let ownsPass = false;
    
    try {
        ownsPass = game.GetService("MarketplaceService").UserOwnsGamePassAsync(
            player.UserId,
            REGENERATION_GAMEPASS_ID
        );
        
        // Cache the result
        playersWithRegen.set(player, ownsPass);
        
        if (ownsPass) {
            log(`${player.Name} has the regeneration gamepass`);
        } else {
            log(`${player.Name} does not have the regeneration gamepass`);
        }
    } catch (err) {
        warn(`Error checking regeneration gamepass for ${player.Name}: ${err}`);
    }
    
    return ownsPass;
};

// Update a player's regeneration status
const updateRegenerationStatus = (player: Player): void => {
    const hasPass = hasRegenerationGamepass(player);
    playersWithRegen.set(player, hasPass);
    
    // Set an attribute on the player so other scripts can check
    player.SetAttribute("HasRegeneration", hasPass);
    
    log(`Updated regeneration status for ${player.Name}: ${hasPass}`);
};

// Setup regeneration for a player
const setupPlayerRegeneration = (player: Player): void => {
    // Check if they have the gamepass
    updateRegenerationStatus(player);
    
    // Listen for character added events
    player.CharacterAdded.Connect((character) => {
        // Disable natural regeneration for all players (we'll handle it manually)
        const humanoid = character.WaitForChild("Humanoid") as Humanoid;
        humanoid.Health = humanoid.Health; // Force an update
        
        // We'll handle regeneration in the heartbeat function
    });
};

// Function to apply regeneration to eligible players
const applyRegeneration = (): void => {
    Players.GetPlayers().forEach((player) => {
        // Skip players without the gamepass
        if (!playersWithRegen.get(player)) return;
        
        // Skip players with no character
        if (!player.Character) return;
        
        const humanoid = player.Character.FindFirstChildOfClass("Humanoid") as Humanoid;
        if (!humanoid) return;
        
        // Skip dead players
        if (humanoid.Health <= 0) return;
        
        // Skip players at max health
        if (humanoid.Health >= humanoid.MaxHealth) return;
        
        // Apply regeneration
        const newHealth = math.min(
            humanoid.Health + REGEN_RATE, 
            humanoid.MaxHealth
        );
        
        humanoid.Health = newHealth;
    });
};

// Setup existing players
Players.GetPlayers().forEach(setupPlayerRegeneration);

// Setup new players
Players.PlayerAdded.Connect(setupPlayerRegeneration);

// Remove players from our map when they leave
Players.PlayerRemoving.Connect((player) => {
    playersWithRegen.delete(player);
    log(`Removed ${player.Name} from regeneration tracking`);
});

// Run the regeneration on an interval
const startRegenerationLoop = () => {
    while (true) {
        applyRegeneration();
        task.wait(REGEN_INTERVAL);
    }
};

// Start the regeneration loop
task.spawn(startRegenerationLoop);

log("RegenerationService initialized");
