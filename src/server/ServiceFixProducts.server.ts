import { MarketplaceService, Players, ReplicatedStorage } from "@rbxts/services";

// Simple logger function
const log = (message: string) => {
    print(`[ProductFix] ${message}`);
};

log("Starting product fix script");

// Set up remote event for product purchase notification
let notifyRemote: RemoteEvent;
const remoteFolder = ReplicatedStorage.FindFirstChild("GameRemotes") as Folder;
if (remoteFolder) {
    notifyRemote = remoteFolder.FindFirstChild("NotifyPurchase") as RemoteEvent;
    if (!notifyRemote) {
        notifyRemote = new Instance("RemoteEvent");
        notifyRemote.Name = "NotifyPurchase";
        notifyRemote.Parent = remoteFolder;
    }
    log("NotifyPurchase remote event found/created");
} else {
    log("GameRemotes folder not found");
    const folder = new Instance("Folder");
    folder.Name = "GameRemotes";
    folder.Parent = ReplicatedStorage;
    
    notifyRemote = new Instance("RemoteEvent");
    notifyRemote.Name = "NotifyPurchase";
    notifyRemote.Parent = folder;
    log("Created GameRemotes folder and NotifyPurchase remote");
}

// Track processed receipts
const processedReceipts = new Set<string>();

// Product handler function
const processReceipt = (receiptInfo: {
    PlayerId: number;
    PurchaseId: string;
    ProductId: number;
}): Enum.ProductPurchaseDecision => {
    log(`Processing purchase: ${receiptInfo.ProductId}, Receipt: ${receiptInfo.PurchaseId}`);
    
    // Prevent processing the same receipt multiple times
    if (processedReceipts.has(receiptInfo.PurchaseId)) {
        log(`Receipt ${receiptInfo.PurchaseId} already processed`);
        return Enum.ProductPurchaseDecision.PurchaseGranted;
    }
    
    // Get player from receipt
    const player = Players.GetPlayerByUserId(receiptInfo.PlayerId);
    if (!player) {
        log(`Player not found for receipt ${receiptInfo.PurchaseId}`);
        return Enum.ProductPurchaseDecision.NotProcessedYet;
    }
    
    // Process product by ID
    const productId = receiptInfo.ProductId;
    
    let productName = "Unknown Product";
    let success = false;
    
    if (productId === 3261484089) {  // 3x Extra Lives
        // Apply 3x extra lives benefit using the LivesManager system
        log(`Applying 3x extra lives to ${player.Name}`);
        
        // Use the AddExtraLives function if available
        const addLivesFunction = ReplicatedStorage.FindFirstChild("AddExtraLives") as BindableFunction;
        if (addLivesFunction) {
            // Add three lives using the function provided by LivesManager
            addLivesFunction.Invoke(player, 3);
            log(`Used AddExtraLives function to add 3 lives to ${player.Name}`);
        } else {
            // Fallback if function not found
            log(`WARNING: AddExtraLives function not found - using direct attribute`);
            const currentLives = player.GetAttribute("ExtraLives") as number ?? 0;
            player.SetAttribute("ExtraLives", currentLives + 3);
            log(`Added 3 extra lives to ${player.Name}, total: ${currentLives + 3}`);
            
            // If player was dead (had the DeadPlayer tag), revive them
            const deadTag = player.FindFirstChild("DeadPlayer") as BoolValue;
            if (deadTag) {
                deadTag.Destroy();
                
                // Also remove any prevent respawn events
                const preventEvent = player.FindFirstChild("PreventAutoRespawn") as RemoteEvent;
                if (preventEvent) preventEvent.Destroy();
                
                player.LoadCharacter();
                log(`Revived ${player.Name} after adding lives`);
            }
        }
        
        productName = "3x Extra Lives";
        success = true;
    } 
    else if (productId === 3261484228) {  // Revive
        // Apply revive benefit using the LivesManager revive system
        log(`Applying revive to ${player.Name}`);
        
        // Add one life to the player
        const addLivesFunction = ReplicatedStorage.FindFirstChild("AddExtraLives") as BindableFunction;
        if (addLivesFunction) {
            // Add one life using the function provided by LivesManager
            addLivesFunction.Invoke(player, 1);
            log(`Used AddExtraLives function to add 1 life to ${player.Name}`);
        } else {
            // Fallback if function not found
            log(`WARNING: AddExtraLives function not found - using direct attribute`);
            const currentLives = player.GetAttribute("ExtraLives") as number ?? 0;
            player.SetAttribute("ExtraLives", currentLives + 1);
            
            // Check if player has DeadPlayer tag (is permanently dead)
            const deadTag = player.FindFirstChild("DeadPlayer") as BoolValue;
            if (deadTag) {
                deadTag.Destroy();
                
                // Also remove any prevent respawn events
                const preventEvent = player.FindFirstChild("PreventAutoRespawn") as RemoteEvent;
                if (preventEvent) preventEvent.Destroy();
                
                player.LoadCharacter();
                log(`Revived dead player ${player.Name} by removing DeadPlayer tag`);
            } else if (!player.Character) {
                // Player has no character but wasn't marked as permanently dead
                log(`Player ${player.Name} has no character, respawning`);
                player.LoadCharacter();
            }
        }
        
        // Notify client side about revive
        const reviveEvent = ReplicatedStorage.FindFirstChild("RevivePlayer") as RemoteEvent;
        if (reviveEvent) {
            reviveEvent.FireClient(player);
            log(`Notified client that player has been revived`);
        }
        productName = "Revive";
        success = true;
    } 
    else if (productId === 3261490620) {  // Team Revive
        // Apply team revive benefit
        log(`Applying team revive benefit to ${player.Name}`);
        
        // Get all players in the game
        const playersInGame = Players.GetPlayers();
        
        // Setup team revive parameters
        const reviveRadius = 50; // Revive players within 50 studs
        let reviveCount = 0;
        
        // Check if the player has a character
        if (!player.Character || !player.Character.PrimaryPart) {
            log(`Player ${player.Name} has no character or PrimaryPart`);
            return Enum.ProductPurchaseDecision.NotProcessedYet;
        }
        
        // Get the position of the initiating player
        const initiatorPosition = player.Character.PrimaryPart.Position;
        
        for (const teammate of playersInGame) {
            // Skip if it's the same player who initiated the team revive
            if (teammate === player) continue;
            
            // Check if teammate has a character
            if (!teammate.Character) {
                // Teammate has no character, revive them
                log(`Reviving teammate ${teammate.Name} who has no character`);
                teammate.LoadCharacter();
                reviveCount++;
                continue;
            }
            
            // Check if teammate's character has a PrimaryPart to calculate distance
            if (teammate.Character.PrimaryPart) {
                const teammatePosition = teammate.Character.PrimaryPart.Position;
                const distance = (teammatePosition.sub(initiatorPosition)).Magnitude;
                
                // Check if teammate is within revive radius
                if (distance <= reviveRadius) {
                    // Check if teammate is dead
                    const humanoid = teammate.Character.FindFirstChildOfClass("Humanoid") as Humanoid;
                    if (humanoid && humanoid.Health <= 0) {
                        // Teammate is dead and within radius, revive them
                        log(`Reviving dead teammate ${teammate.Name} within ${reviveRadius} radius`);
                        teammate.LoadCharacter();
                        reviveCount++;
                    } else if (humanoid) {
                        // Teammate is not dead but within radius, heal them
                        log(`Healing teammate ${teammate.Name} within ${reviveRadius} radius`);
                        humanoid.Health = humanoid.MaxHealth;
                        reviveCount++;
                    }
                }
            }
        }
        
        log(`Team revive applied by ${player.Name}, revived/healed ${reviveCount} teammates`);
        productName = "Team Revive";
        success = true;
    } 
    else {
        log(`Unknown product ID: ${productId}`);
        return Enum.ProductPurchaseDecision.NotProcessedYet;
    }
    
    // Notify player of successful purchase
    if (success && notifyRemote) {
        log(`Notifying ${player.Name} of successful purchase: ${productName}`);
        try {
            notifyRemote.FireClient(player, "Product", productId);
        } catch (err) {
            log(`Error sending notification: ${err}`);
        }
    }
    
    // Mark receipt as processed
    processedReceipts.add(receiptInfo.PurchaseId);
    log(`Product purchase complete: ${productName} for ${player.Name}`);
    
    return Enum.ProductPurchaseDecision.PurchaseGranted;
};

// Register the receipt processor
MarketplaceService.ProcessReceipt = processReceipt;

log("Product fix initialized and running");
