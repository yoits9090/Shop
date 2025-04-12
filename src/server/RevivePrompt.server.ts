import { Players, MarketplaceService } from "@rbxts/services";

// Simple logger function
const log = (message: string) => {
    print(`[RevivePrompt] ${message}`);
};

log("Starting RevivePrompt script");

// Constants
const TEAM_REVIVE_PRODUCT_ID = 3261490620; // ID for "Revive your teammates" product
const PROXIMITY_PROMPT_RANGE = 8; // Studs

// Map to track which players already have prompts
const deadPlayerPrompts = new Map<Player, ProximityPrompt>();

// Function to create revive prompt on a player's character
const createRevivePrompt = (player: Player, character: Model) => {
    // Don't create if player already has a prompt
    if (deadPlayerPrompts.has(player)) return;
    
    const humanoidRootPart = character.FindFirstChild("HumanoidRootPart") as BasePart;
    if (!humanoidRootPart) {
        log(`No HumanoidRootPart found for ${player.Name}'s character`);
        return;
    }
    
    // Create a proximity prompt
    const prompt = new Instance("ProximityPrompt");
    prompt.ObjectText = player.Name;
    prompt.ActionText = "Revive Teammate";
    prompt.HoldDuration = 1;
    prompt.MaxActivationDistance = PROXIMITY_PROMPT_RANGE;
    prompt.RequiresLineOfSight = false;
    prompt.Enabled = true;
    prompt.ClickablePrompt = true;
    prompt.Parent = humanoidRootPart;
    
    log(`Created revive prompt for ${player.Name}`);
    
    // Store the prompt reference
    deadPlayerPrompts.set(player, prompt);
    
    // Setup prompt triggered event
    prompt.Triggered.Connect((otherPlayer: Player) => {
        // Check if the player trying to revive is the same as the dead player
        if (otherPlayer === player) {
            log(`${player.Name} tried to revive themselves`);
            return;
        }
        
        log(`${otherPlayer.Name} is attempting to revive ${player.Name}`);
        
        // Prompt the player to purchase the team revive product
        MarketplaceService.PromptProductPurchase(otherPlayer, TEAM_REVIVE_PRODUCT_ID);
    });
};

// Function to remove a player's revive prompt
const removeRevivePrompt = (player: Player) => {
    const prompt = deadPlayerPrompts.get(player);
    if (prompt && prompt.IsDescendantOf(game)) {
        prompt.Destroy();
        log(`Removed revive prompt for ${player.Name}`);
    }
    deadPlayerPrompts.delete(player);
};

// Function to handle player death
const onPlayerDied = (player: Player, character: Model) => {
    log(`Player ${player.Name} died`);
    createRevivePrompt(player, character);
    
    // When character is removed, also remove the prompt
    character.AncestryChanged.Connect((_, parent) => {
        if (!parent) {
            removeRevivePrompt(player);
        }
    });
};

// Handle existing players
Players.GetPlayers().forEach((player) => {
    if (player.Character) {
        // Get the humanoid to check if the player is already dead
        const humanoid = player.Character.FindFirstChildOfClass("Humanoid") as Humanoid;
        if (humanoid && humanoid.Health <= 0) {
            onPlayerDied(player, player.Character);
        }
        
        // Connect to death event
        humanoid.Died.Connect(() => {
            onPlayerDied(player, player.Character!);
        });
    }

    // Listen for new characters (respawns)
    player.CharacterAdded.Connect((character) => {
        // Remove any existing prompts when player respawns
        removeRevivePrompt(player);
        
        // Connect to the new character's humanoid died event
        const humanoid = character.WaitForChild("Humanoid") as Humanoid;
        humanoid.Died.Connect(() => {
            onPlayerDied(player, character);
        });
    });
});

// Handle new players
Players.PlayerAdded.Connect((player) => {
    player.CharacterAdded.Connect((character) => {
        // Connect to humanoid died event
        const humanoid = character.WaitForChild("Humanoid") as Humanoid;
        humanoid.Died.Connect(() => {
            onPlayerDied(player, character);
        });
    });
});

// Handle players leaving
Players.PlayerRemoving.Connect((player) => {
    removeRevivePrompt(player);
});

log("RevivePrompt script initialized and running");
