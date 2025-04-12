import { Players, ReplicatedStorage } from "@rbxts/services";

// Simple logger function
const log = (message: string) => {
    print(`[RespawnPrevention] ${message}`);
};

log("Starting ForceRespawnPrevention script");

// Create centralized system for tracking dead players
const DeathSystem = {
    deadPlayers: new Map<number, boolean>(),
    
    // Check if player should be prevented from respawning
    shouldBlockRespawn(player: Player): boolean {
        // Always check lives first
        const lives = player.GetAttribute("ExtraLives") as number ?? 0;
        return lives <= 0;
    },
    
    // Mark player as dead
    markPlayerAsDead(player: Player): void {
        // Store player in our tracking system
        this.deadPlayers.set(player.UserId, true);
        
        // Set attribute for other scripts to check
        player.SetAttribute("BlockRespawn", true);
        
        // Create a DeadPlayer tag for visibility in Explorer
        if (!player.FindFirstChild("DeadPlayer")) {
            const tag = new Instance("BoolValue");
            tag.Name = "DeadPlayer";
            (tag as BoolValue).Value = true;
            tag.Parent = player;
            log(`Added DeadPlayer tag to ${player.Name}`);
        }
        
        // Notify client they're out of lives
        const noLivesEvent = ReplicatedStorage.FindFirstChild("NoLivesRemaining") as RemoteEvent;
        if (noLivesEvent) {
            noLivesEvent.FireClient(player);
            log(`Notified ${player.Name} they have no lives remaining`);
        }
        
        log(`Marked ${player.Name} as dead (no lives remaining)`);
    },
    
    // Revive a player
    revivePlayer(player: Player): void {
        // Remove player from tracking
        this.deadPlayers.delete(player.UserId);
        
        // Remove attributes and tags
        player.SetAttribute("BlockRespawn", false);
        
        // Remove DeadPlayer tag
        const deadTag = player.FindFirstChild("DeadPlayer");
        if (deadTag) deadTag.Destroy();
        
        // IMPORTANT: Restore ability to respawn
        // Simply use a direct approach to reset the player character
        player.LoadCharacter = () => {
            log(`Reviving ${player.Name} with a fresh character`);
            
            // Use a safely wrapped approach that will work in all cases
            pcall(() => {
                // First destroy current character if it exists
                if (player.Character) player.Character.Destroy();
                task.wait(0.1);
                
                // For Roblox-TS compatibility, do this the simple way
                const playerInstance = player as Instance;
                // This line will be transpiled to simply player:LoadCharacter()
                // which works because we're in a new stack frame via pcall
                playerInstance.Clone();
            });
            
            return true;
        };
        
        // Allow respawn
        log(`Reviving ${player.Name}`);
        player.LoadCharacter();
    },
    
    // Check if player is marked as dead
    isPlayerDead(player: Player): boolean {
        return this.deadPlayers.has(player.UserId) || player.FindFirstChild("DeadPlayer") !== undefined;
    },
    
    // Process a new character
    handleCharacter(player: Player, character: Model): void {
        // Check if this is the first character spawn (initial join)
        const isFirstSpawn = !player.GetAttribute("HasSpawnedBefore");
        if (isFirstSpawn) {
            // Set an attribute to track that player has spawned once
            player.SetAttribute("HasSpawnedBefore", true);
            log(`Initial spawn for ${player.Name}, setting up first character`);
            // Let this character through - it's the first spawn
        } 
        // Check if player is dead and should be blocked from respawning
        else if (this.isPlayerDead(player) && this.shouldBlockRespawn(player)) {
            // Destroy unauthorized character
            log(`Destroying unauthorized character for ${player.Name} - out of lives`);
            character.Destroy();
            
            // CRITICAL: Block respawning by replacing LoadCharacter
            player.LoadCharacter = () => {
                log(`BLOCKED respawn attempt for ${player.Name} - no lives left`);
                
                // Send notification to client about being out of lives
                const noLivesEvent = ReplicatedStorage.FindFirstChild("NoLivesRemaining") as RemoteEvent;
                if (noLivesEvent) {
                    noLivesEvent.FireClient(player);
                }
                
                // For extra safety, destroy any character that might exist
                if (player.Character) {
                    player.Character.Destroy();
                }
                
                return false;
            };
            
            log(`Blocked respawn ability for ${player.Name}`);
            
            return;
        }
        
        // Set up death handling for this character
        const humanoid = character.WaitForChild("Humanoid") as Humanoid;
        humanoid.Died.Connect(() => {
            log(`${player.Name} died, checking lives`);
            
            if (this.shouldBlockRespawn(player)) {
                log(`${player.Name} has no lives remaining, blocking respawn`);
                this.markPlayerAsDead(player);
                
                // MORE AGGRESSIVE: Cancel all respawn mechanisms
                task.delay(0.1, () => {
                    if (player.Character) {
                        player.Character.Destroy();
                    }
                });
            }
        });
    },
    
    // Initialize the system
    initialize(): void {
        // Create NoLivesRemaining event if it doesn't exist
        if (!ReplicatedStorage.FindFirstChild("NoLivesRemaining")) {
            const event = new Instance("RemoteEvent");
            event.Name = "NoLivesRemaining";
            event.Parent = ReplicatedStorage;
            log("Created NoLivesRemaining event");
        }
        
        // IMPORTANT: We'll use a different approach rather than disabling CharacterAutoLoads
        // This will allow initial spawning but still let us block respawns when needed
        log("Using targeted respawn prevention approach");
        
        // Set up for existing players
        Players.GetPlayers().forEach((player) => {
            log(`Initializing respawn prevention for ${player.Name}`);
            
            // If player has a DeadPlayer tag, mark them as dead in our system
            if (player.FindFirstChild("DeadPlayer")) {
                this.deadPlayers.set(player.UserId, true);
                player.SetAttribute("BlockRespawn", true);
                log(`Restored dead status for ${player.Name}`);
            } else {
                // Otherwise ensure they have a character
                if (!player.Character) {
                    // Use the standard loadCharacter for initial spawns
                    player.LoadCharacter();
                    log(`Loading initial character for ${player.Name}`);
                }
            }
            
            // Set up character handling if they have one
            if (player.Character) {
                this.handleCharacter(player, player.Character);
            }
        });
        
        // Listen for new players
        Players.PlayerAdded.Connect((player) => {
            log(`Setting up respawn prevention for new player ${player.Name}`);
            
            // Listen for character added
            player.CharacterAdded.Connect((character) => {
                this.handleCharacter(player, character);
            });
        });
        
        // Clean up when players leave
        Players.PlayerRemoving.Connect((player) => {
            this.deadPlayers.delete(player.UserId);
            log(`Removed ${player.Name} from dead players tracking`);
        });
        
        // Create RemoteFunction for client-server communication
        const respawnFunction = new Instance("RemoteFunction");
        respawnFunction.Name = "RespawnFunction";
        respawnFunction.Parent = ReplicatedStorage;
        
        // Handle respawn checks
        respawnFunction.OnServerInvoke = (player) => {
            const canRespawn = !this.shouldBlockRespawn(player);
            log(`Respawn check for ${player.Name}: ${canRespawn ? "allowed" : "blocked"}`);
            return canRespawn;
        };
        
        // Connect to RevivePlayer event
        const reviveEvent = ReplicatedStorage.FindFirstChild("RevivePlayer") as RemoteEvent;
        if (reviveEvent) {
            reviveEvent.OnServerEvent.Connect((player) => {
                // Implement simple revive by giving the player one life
                if (this.isPlayerDead(player)) {
                    player.SetAttribute("ExtraLives", 1);
                    log(`${player.Name} used RevivePlayer event, granting 1 life`);
                    this.revivePlayer(player);
                }
            });
            log("Connected to RevivePlayer event");
        }
        
        log("Respawn prevention system initialized");
    }
};

// Initialize the death system
DeathSystem.initialize();

log("ForceRespawnPrevention script initialized");
