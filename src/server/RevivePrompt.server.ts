import { Players, MarketplaceService, Workspace } from "@rbxts/services";

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
// Map to track cloned corpse models
const deadPlayerCorpses = new Map<Player, Model>();
// Ensure a folder for corpses exists
let corpsesFolder = Workspace.FindFirstChild("Corpses") as Folder;
if (!corpsesFolder) {
    corpsesFolder = new Instance("Folder");
    corpsesFolder.Name = "Corpses";
    corpsesFolder.Parent = Workspace;
}

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
    if (prompt && prompt.IsDescendantOf(Workspace)) {
        prompt.Destroy();
    }
    deadPlayerPrompts.delete(player);
    // Clean up cloned corpse
    const corpse = deadPlayerCorpses.get(player);
    if (corpse && corpse.IsDescendantOf(Workspace)) {
        corpse.Destroy();
    }
    deadPlayerCorpses.delete(player);
};

// Function to handle player death
const onPlayerDied = (player: Player, character: Model) => {
    // Ensure character still exists before cloning
    if (!character.Parent) {
        log(`onPlayerDied: character removed before processing for ${player.Name}, skipping`);
        return;
    }
    // Prevent duplicate corpse
    if (deadPlayerCorpses.has(player)) {
        log(`onPlayerDied: corpse already exists for ${player.Name}, skipping duplicate`);
        return;
    }
    log(`Player ${player.Name} died`);
    // Attempt to clone the character safely
    let corpse: Model | undefined;
    const success = pcall(() => {
        corpse = character.Clone() as Model;
    });
    if (!success || !corpse) {
        log(`onPlayerDied: failed to clone character for ${player.Name}`);
        return;
    }
    corpse.Name = `Corpse_${player.UserId}`;
    corpse.Parent = corpsesFolder;
    deadPlayerCorpses.set(player, corpse);
    // Create revive prompt on the cloned corpse
    createRevivePrompt(player, corpse);

    // NOTE: do not auto‑respawn here; prompt will handle revive
};

// Setup death listener for players
const onPlayerAdded = (player: Player) => {
    // Handle existing character
    const currentCharacter = player.Character;
    if (currentCharacter) {
        const humanoid = currentCharacter.FindFirstChildOfClass("Humanoid") as Humanoid;
        if (humanoid) {
            humanoid.Died.Connect(() => {
                onPlayerDied(player, currentCharacter);
            });
        }
    }
    // Listen for future character spawns
    player.CharacterAdded.Connect((character) => {
        const humanoid = character.WaitForChild("Humanoid") as Humanoid;
        humanoid.Died.Connect(() => {
            onPlayerDied(player, character);
        });
    });
};
// Attach to current and future players
Players.PlayerAdded.Connect(onPlayerAdded);
Players.GetPlayers().forEach(onPlayerAdded);

// Handle players leaving
Players.PlayerRemoving.Connect((player) => {
    removeRevivePrompt(player);
});

log("RevivePrompt script initialized and running");
