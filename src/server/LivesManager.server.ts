import { Players, ReplicatedStorage } from "@rbxts/services";

// Simple logger function
const log = (message: string) => {
    print(`[LivesManager-Server] ${message}`);
};

log("Starting LivesManager server script");

// Constants
const DEFAULT_LIVES = 0; // Players start with 0 extra lives by default - only one life total

// Create remote events for client-server communication
const noLivesRemoteEvent = new Instance("RemoteEvent");
noLivesRemoteEvent.Name = "NoLivesRemaining";
noLivesRemoteEvent.Parent = ReplicatedStorage;

// Create RevivePlayer remote event if it doesn't exist
let revivePlayerEvent = ReplicatedStorage.FindFirstChild("RevivePlayer") as RemoteEvent;
if (!revivePlayerEvent) {
    revivePlayerEvent = new Instance("RemoteEvent");
    revivePlayerEvent.Name = "RevivePlayer";
    revivePlayerEvent.Parent = ReplicatedStorage;
    log("Created RevivePlayer RemoteEvent");
}

// Create TeammateRevive remote event if it doesn't exist
let teammateReviveEvent = ReplicatedStorage.FindFirstChild("TeammateRevive") as RemoteEvent;
if (!teammateReviveEvent) {
    teammateReviveEvent = new Instance("RemoteEvent");
    teammateReviveEvent.Name = "TeammateRevive";
    teammateReviveEvent.Parent = ReplicatedStorage;
    log("Created TeammateRevive RemoteEvent");
}

// Function to handle respawn prevention
const createRespawnPreventer = () => {
    // Create a folder to store our system events
    const livesManagerFolder = new Instance("Folder");
    livesManagerFolder.Name = "LivesManagerSystem";
    livesManagerFolder.Parent = ReplicatedStorage;
    
    return livesManagerFolder;
};

// Create our system folder
createRespawnPreventer();

// Function to initialize a player's lives
const initializePlayerLives = (player: Player) => {
    // Only set if not already set (to avoid overriding existing data)
    if (player.GetAttribute("ExtraLives") === undefined) {
        player.SetAttribute("ExtraLives", DEFAULT_LIVES);
        log(`Initialized ${player.Name} with ${DEFAULT_LIVES} lives`);
    } else {
        const lives = player.GetAttribute("ExtraLives") as number;
        log(`${player.Name} already has ${lives} lives`);
    }
};

// Function to handle player death
const handlePlayerDeath = (player: Player) => {
    const lives = player.GetAttribute("ExtraLives") as number ?? 0;
    
    if (lives > 0) {
        // Decrement lives
        player.SetAttribute("ExtraLives", lives - 1);
        log(`${player.Name} died, ${lives - 1} lives remaining`);
    } else {
        // No lives left
        log(`${player.Name} died with no extra lives remaining`);
        
        // Notify the client they have no lives remaining
        noLivesRemoteEvent.FireClient(player);
        
        // Create a DeadPlayer tag to mark dead players
        const deadTag = new Instance("BoolValue");
        deadTag.Name = "DeadPlayer";
        deadTag.Value = true;
        deadTag.Parent = player;
        
        // Prevent respawn by intercepting the LoadCharacter call
        // We'll use a special event to handle this on the client side
        const preventRespawnEvent = new Instance("RemoteEvent");
        preventRespawnEvent.Name = "PreventAutoRespawn";
        preventRespawnEvent.Parent = player;
        preventRespawnEvent.FireClient(player);
        
        // Kill the current character if it exists
        if (player.Character) {
            const humanoid = player.Character.FindFirstChildOfClass("Humanoid") as Humanoid;
            if (humanoid && humanoid.Health > 0) {
                humanoid.Health = 0;
            }
        }
        
        log(`Prevented respawn for ${player.Name} - out of lives`);
    }
};

// Function to allow a player to respawn
const allowPlayerRespawn = (player: Player) => {
    // Remove DeadPlayer tag
    const deadTag = player.FindFirstChild("DeadPlayer");
    if (deadTag) deadTag.Destroy();
    
    // Remove PreventAutoRespawn event
    const preventEvent = player.FindFirstChild("PreventAutoRespawn");
    if (preventEvent) preventEvent.Destroy();
    
    // Set the allow respawn flag
    player.SetAttribute("AllowRespawn", true);
    
    // Force respawn
    log(`Allowing ${player.Name} to respawn`);
    player.LoadCharacter();
};

// Function to add extra lives to a player
const addExtraLives = (player: Player, amount: number): void => {
    const currentLives = player.GetAttribute("ExtraLives") as number ?? 0;
    const newLives = currentLives + amount;
    
    player.SetAttribute("ExtraLives", newLives);
    log(`Added ${amount} lives to ${player.Name} - now has ${newLives}`);
    
    // If player was dead (had the DeadPlayer tag), revive them
    if (player.FindFirstChild("DeadPlayer")) {
        allowPlayerRespawn(player);
        log(`Revived ${player.Name} after adding lives`);
    }
};

// Create a BindableFunction that other scripts can use to add lives
const addLivesFunction = new Instance("BindableFunction");
addLivesFunction.Name = "AddExtraLives";
addLivesFunction.Parent = ReplicatedStorage;

// Type-safe approach to handle OnInvoke with proper typings
addLivesFunction.OnInvoke = (player?: Player, amount?: number) => {
    if (player && amount !== undefined) {
        addExtraLives(player, amount);
        return true;
    }
    return false;
};

// Handle revive product purchases
revivePlayerEvent.OnServerEvent.Connect((player: Player) => {
    if (player.FindFirstChild("DeadPlayer")) {
        // This is a player trying to use a revive product
        addExtraLives(player, 1); // Add one life to the player
        log(`${player.Name} used a revive product`);
    }
});

// Create a RemoteFunction for other scripts to check if a player can be revived
const canReviveFunction = new Instance("RemoteFunction");
canReviveFunction.Name = "CanRevivePlayer";
canReviveFunction.Parent = ReplicatedStorage;

// Set up the function for checking if player can be revived
const canRevivePlayer = (player: Player, targetPlayerName: string): boolean => {
    // Find the target player
    const targetPlayer = Players.GetPlayers().find((p) => p.Name === targetPlayerName);
    if (!targetPlayer) return false;
    
    // Check if the target player is dead
    return targetPlayer.FindFirstChild("DeadPlayer") !== undefined;
};

// Use type assertion to define the correct signature
canReviveFunction.OnServerInvoke = canRevivePlayer as unknown as (player: Player, ...args: unknown[]) => unknown;

// Handle teammate revive
// Handle teammate revive with simplified implementation
teammateReviveEvent.OnServerEvent.Connect((player: Player) => {
    // Skip revive if no player
    if (!player) return;
    
    // Function to find dead players nearby
    const findDeadTeammates = () => {
        // Get all players
        const allPlayers = Players.GetPlayers();
        // Get players that are dead (have DeadPlayer tag)
        return allPlayers.filter(p => 
            p !== player && // Not the reviver
            p.FindFirstChild("DeadPlayer") !== undefined // Has DeadPlayer tag
        );
    };
    
    // Find players who can be revived
    const revivablePlayers = findDeadTeammates();
    if (revivablePlayers.isEmpty()) {
        log(`No dead teammates found for ${player.Name} to revive`);
        return;
    }
    
    // Get the first dead player (prioritizing nearby ones)
    const targetPlayer = revivablePlayers[0];
    // Revive the target player
    addExtraLives(targetPlayer, 1); // Add one life to the target player
    log(`${player.Name} revived teammate ${targetPlayer.Name}`);
});

// Process existing players
Players.GetPlayers().forEach((player) => {
    initializePlayerLives(player);
    
    // Remove any existing DeadPlayer tag in case of script reloading
    const existingDeadTag = player.FindFirstChild("DeadPlayer");
    if (existingDeadTag) existingDeadTag.Destroy();
    
    // Remove any existing prevention events
    const existingPreventEvent = player.FindFirstChild("PreventAutoRespawn");
    if (existingPreventEvent) existingPreventEvent.Destroy();
    
    // Handle character death for existing player
    if (player.Character) {
        const humanoid = player.Character.FindFirstChildOfClass("Humanoid") as Humanoid;
        if (humanoid) {
            humanoid.Died.Connect(() => {
                handlePlayerDeath(player);
            });
        }
    }
    
    // Handle character respawn
    player.CharacterAdded.Connect((character) => {
        const humanoid = character.WaitForChild("Humanoid") as Humanoid;
        humanoid.Died.Connect(() => {
            handlePlayerDeath(player);
        });
    });
});

// Handle new players
Players.PlayerAdded.Connect((player) => {
    initializePlayerLives(player);
    
    // Handle character spawning
    player.CharacterAdded.Connect((character) => {
        const humanoid = character.WaitForChild("Humanoid") as Humanoid;
        humanoid.Died.Connect(() => {
            handlePlayerDeath(player);
        });
    });
});

// Create a more robust respawn prevention system
const setupRespawnPrevention = () => {
    // Create a RemoteFunction to handle respawn requests
    const respawnFunction = new Instance("RemoteFunction");
    respawnFunction.Name = "RespawnFunction";
    respawnFunction.Parent = ReplicatedStorage;
    
    // Handle respawn request from client
    respawnFunction.OnServerInvoke = (player: Player) => {
        // Only allow respawn if player has the AllowRespawn attribute set to true
        const allowRespawn = player.GetAttribute("AllowRespawn") as boolean ?? true;
        if (!allowRespawn) {
            log(`Blocked respawn request from ${player.Name} - no lives remaining`);
            // Re-notify client
            noLivesRemoteEvent.FireClient(player);
            return false;
        }
        return true;
    };
    
    // Create a monitoring system that constantly checks for unauthorized respawns
    task.spawn(() => {
        while (true) {
            // Check all players
            Players.GetPlayers().forEach((player) => {
                // Get the allow respawn flag
                const allowRespawn = player.GetAttribute("AllowRespawn") as boolean;
                
                // If respawn is not allowed but player has a character, destroy it
                if (allowRespawn === false && player.Character) {
                    log(`Destroying unauthorized character for ${player.Name}`);
                    player.Character.Destroy();
                    
                    // Re-notify client
                    noLivesRemoteEvent.FireClient(player);
                    
                    // Create/update DeadPlayer tag
                    if (!player.FindFirstChild("DeadPlayer")) {
                        const deadTag = new Instance("BoolValue");
                        deadTag.Name = "DeadPlayer";
                        deadTag.Value = true;
                        deadTag.Parent = player;
                    }
                }
            });
            task.wait(0.5); // Check twice per second
        }
    });
};

// Start the respawn prevention system
setupRespawnPrevention();

// Set up handlers for each player to manage respawn prevention
const setupPlayerRespawnPrevention = (player: Player) => {
    // Make sure player has the AllowRespawn attribute
    if (player.GetAttribute("AllowRespawn") === undefined) {
        player.SetAttribute("AllowRespawn", true);
    }
    
    // Handle character added
    player.CharacterAdded.Connect((character) => {
        // If respawn is not allowed, destroy the character
        const allowRespawn = player.GetAttribute("AllowRespawn") as boolean ?? true;
        if (!allowRespawn) {
            log(`Destroying character for ${player.Name} - respawn not allowed`);
            task.delay(0.1, () => {
                character.Destroy();
            });
        }
    });
};

// Set up for all current players
Players.GetPlayers().forEach(setupPlayerRespawnPrevention);

// Set up for new players
Players.PlayerAdded.Connect(setupPlayerRespawnPrevention);

// Handle players leaving
Players.PlayerRemoving.Connect((player) => {
    log(`${player.Name} is leaving the game`);
});

log("LivesManager server script initialized");
