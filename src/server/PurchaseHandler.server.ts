import { Service, Dependency } from "@flamework/core";
import { MarketplaceService, Players } from "@rbxts/services";

// Use a more descriptive logger
const log = (level: "Info" | "Warn" | "Error" | "Debug", message: string) => {
	// Always print to console for debugging
	print(`[PurchaseProcessingService][${level}] ${message}`);
};

// Define the AbilitiesService interface for type safety
interface AbilitiesService {
	applyBenefitByName?(benefitName: string, player: Player): void;
	[key: string]: ((player: Player) => void) | ((benefitName: string, player: Player) => void) | undefined;
}

// Define the ReceiptInfo interface based on Roblox documentation
interface ReceiptInfo {
	PlayerId: number;
	PurchaseId: string;
	ProductId: number;
	CurrencyType: Enum.CurrencyType;
	CurrencySpent: number;
	PlaceIdWherePurchased: number; // Added based on Roblox API
}

@Service({
	loadOrder: 1,
})
export class PurchaseProcessingService {
	private abilitiesService: AbilitiesService | undefined;

	constructor() {
		// We'll initialize this in onInit to ensure Flamework has registered the service
		log("Info", "PurchaseProcessingService constructor called");
	}

	onInit(): void {
		log("Info", "PurchaseProcessingService initializing...");
		print("[DEBUG-PURCHASE] PurchaseProcessingService.onInit() called");
		
		// Now it's safe to get the dependency
		try {
			print("[DEBUG-PURCHASE] Attempting to resolve AbilitiesService dependency");
			this.abilitiesService = Dependency<AbilitiesService>();
			log("Info", "AbilitiesService dependency resolved");
			print("[DEBUG-PURCHASE] Successfully resolved AbilitiesService dependency");
			print(`[DEBUG-PURCHASE] AbilitiesService type: ${typeOf(this.abilitiesService)}`);
		} catch (err) {
			print(`[DEBUG-PURCHASE] Error resolving dependency: ${err}`);
		}

		// Check for existing gamepass ownership when a player joins
		print("[DEBUG] Setting up PlayerAdded event handler");
		Players.PlayerAdded.Connect((player) => {
			print(`[DEBUG] Player added: ${player.Name}, checking gamepass ownership`);
			this.checkExistingGamepassOwnership(player);
		});
		
		// Check if there are already players in the game
		const existingPlayers = Players.GetPlayers();
		print(`[DEBUG-PURCHASE] Checking existing players: ${existingPlayers.size()}`);
		if (existingPlayers.size() > 0) {
			print(`[DEBUG] Found ${existingPlayers.size()} existing players, checking their gamepass ownership`);
			for (let i = 0; i < existingPlayers.size(); i++) {
				const player = existingPlayers[i];
				this.checkExistingGamepassOwnership(player);
			}
		}

		// Set up event listeners for gamepass and developer product purchases
		MarketplaceService.PromptGamePassPurchaseFinished.Connect(
			(player: Player, gamepassId: number, purchaseSuccess: boolean) => {
				if (purchaseSuccess) {
					this.handleGamepassPurchase(player, gamepassId);
				}
			},
		);

		MarketplaceService.ProcessReceipt = (receiptInfo: ReceiptInfo) => {
			return this.handleProductPurchase(receiptInfo);
		};
	}

	// --- Gamepass Purchase Handling ---
	private checkExistingGamepassOwnership(player: Player): void {
		log("Info", `Checking existing gamepass ownership for ${player.Name}`);
		const gamepassBenefitMap = new Map<number, string>([
			[1150966154, "applyRegenerationBenefit"],
			[1155692418, "apply2xHealthBenefit"],
			[1151894037, "applySprintBenefit"],
			[1149964231, "apply2xSpeedBenefit"],
		]);

		gamepassBenefitMap.forEach((benefitFunctionName, gamepassId) => {
			// Use pcall to safely check ownership
			const [success, ownsGamepass] = pcall(() => {
				return MarketplaceService.UserOwnsGamePassAsync(player.UserId, gamepassId);
			});

			if (success && ownsGamepass) {
				log("Info", `${player.Name} already owns gamepass ${gamepassId}`);
				this.handleGamepassPurchase(player, gamepassId, true);
			} else if (!success) {
				log("Error", `Failed to check gamepass ownership for ${player.Name}: ${ownsGamepass}`);
			}
		});
	}

	private handleGamepassPurchase(player: Player, gamepassId: number, isInitialCheck = false): void {
		log("Info", `Processing gamepass purchase for ${player.Name}, Gamepass ID: ${gamepassId}`);

		// Map gamepass IDs to method names in AbilitiesService
		const gamepassBenefitMap = new Map<number, string>([
			[1150966154, "applyRegenerationBenefit"],
			[1155692418, "apply2xHealthBenefit"],
			[1151894037, "applySprintBenefit"],
			[1149964231, "apply2xSpeedBenefit"],
		]);

		const benefitFunctionName = gamepassBenefitMap.get(gamepassId);

		if (benefitFunctionName !== undefined) {
			log(
				"Info",
				`Attempting to apply benefit [${benefitFunctionName}] for gamepass ${gamepassId} to ${player.Name}`,
			);
			// Use pcall to safely call the method
			const [success, errorMsg] = pcall(() => {
				if (this.abilitiesService) {
					// Prefer using applyBenefitByName if it exists
					if ("applyBenefitByName" in this.abilitiesService && this.abilitiesService.applyBenefitByName) {
						log("Debug", `Using applyBenefitByName for ${benefitFunctionName}`);
						this.abilitiesService.applyBenefitByName(benefitFunctionName, player);
					} else {
						// Fallback: Call the specific method directly
						log("Debug", `Fallback: Directly calling ${benefitFunctionName} on AbilitiesService`);
						if (
							benefitFunctionName in this.abilitiesService &&
							typeIs(this.abilitiesService[benefitFunctionName as keyof AbilitiesService], "function")
						) {
							// Try direct method call - in Luau this must compile to a colon call (obj:method)
							// We can't do this with dynamic property access in TypeScript directly
							// So we need to use applyBenefitByName which handles this for us
							if (this.abilitiesService && this.abilitiesService.applyBenefitByName) {
								this.abilitiesService.applyBenefitByName(benefitFunctionName, player);
							}
						} else {
							log(
								"Error",
								`Fallback: Benefit function ${benefitFunctionName} not found or not callable on AbilitiesService`,
							);
						}
					}
				} else {
					log("Error", "AbilitiesService is not initialized");
					throw "AbilitiesService is not initialized";
				}
			});
			if (!success) {
				log("Error", `Failed to apply benefit ${benefitFunctionName}: ${errorMsg}`);
			}

			if (!isInitialCheck) {
				this.notifyPlayer(player, "Gamepass", gamepassId);
			}
		} else {
			log("Error", `Unknown gamepass ID: ${gamepassId}`);
		}
	}

	// --- Developer Product Purchase Handling ---
	private handleProductPurchase(receiptInfo: ReceiptInfo): Enum.ProductPurchaseDecision {
		print(`[PURCHASE-HANDLER] *** PROCESSING PRODUCT PURCHASE: ${receiptInfo.ProductId}, Receipt: ${receiptInfo.PurchaseId} ***`);
		log("Info", `Processing developer product purchase, Receipt ID: ${receiptInfo.PurchaseId}`);

		// Prevent processing the same receipt multiple times
		if (this.processedReceipts.has(receiptInfo.PurchaseId)) {
			log("Warn", `Receipt ${receiptInfo.PurchaseId} already processed`);
			return Enum.ProductPurchaseDecision.PurchaseGranted;
		}

		// Get player from receipt
		const player = Players.GetPlayerByUserId(receiptInfo.PlayerId);
		if (!player) {
			log("Error", `Player not found for receipt ${receiptInfo.PurchaseId}`);
			return Enum.ProductPurchaseDecision.NotProcessedYet;
		}

		// Map product IDs to method names in AbilitiesService
		const productBenefitMap = new Map<number, string>([
			[3261484089, "applyExtraLivesBenefit"], // 3x extra lives
			[3261484228, "applyReviveBenefit"], // Revive
			[3261490620, "applyTeamReviveBenefit"], // Revive teammates
		]);

		const productId = receiptInfo.ProductId;
		const benefitFunctionName = productBenefitMap.get(productId);

		if (benefitFunctionName !== undefined) {
			print(`[PURCHASE-HANDLER] Attempting to apply benefit [${benefitFunctionName}] for product ${productId} to ${player.Name}`);
			log(
				"Info",
				`Attempting to apply benefit [${benefitFunctionName}] for product ${productId} to ${player.Name}`,
			);
			// Use pcall to safely call the method
			let purchaseDecision: Enum.ProductPurchaseDecision = Enum.ProductPurchaseDecision.NotProcessedYet;
			const [success, errorMsg] = pcall(() => {
				// Direct implementation of product functionality
				print(`[PURCHASE-HANDLER] Directly applying benefit: ${benefitFunctionName}`);
				log("Debug", `Directly applying benefit: ${benefitFunctionName}`);
				
				// Handle each product directly
				switch (benefitFunctionName) {
					case "applyExtraLivesBenefit":
						this.applyExtraLivesBenefit(player);
						break;
					case "applyReviveBenefit":
						this.applyReviveBenefit(player);
						break;
					case "applyTeamReviveBenefit":
						this.applyTeamReviveBenefit(player);
						break;
					default:
						log("Error", `Unknown benefit function: ${benefitFunctionName}`);
						throw `Unknown benefit function: ${benefitFunctionName}`;
				}
				
				// If we reached here without error inside the pcall, grant the purchase
				purchaseDecision = Enum.ProductPurchaseDecision.PurchaseGranted;
				this.processedReceipts.add(receiptInfo.PurchaseId);
				this.notifyPlayer(player, "Product", productId);
			});

			if (!success) {
				print(`[PURCHASE-HANDLER] ERROR: Failed to apply benefit ${benefitFunctionName}: ${errorMsg}`);
				log("Error", `Failed to apply benefit ${benefitFunctionName}: ${errorMsg}`);
				// Keep purchaseDecision as NotProcessedYet if pcall failed
			} else {
				print(`[PURCHASE-HANDLER] SUCCESS: Applied benefit ${benefitFunctionName} to ${player.Name}`);
			}

			print(`[PURCHASE-HANDLER] Returning purchase decision: ${purchaseDecision}`);
			return purchaseDecision;
		} else {
			print(`[PURCHASE-HANDLER] ERROR: Unknown product ID: ${productId}`);
			log("Error", `Unknown product ID: ${productId}`);
			return Enum.ProductPurchaseDecision.NotProcessedYet;
		}
	}

	// --- Notification to Player ---
	private notifyPlayer(player: Player, purchaseType: "Gamepass" | "Product", id: number): void {
		print(`[PURCHASE-HANDLER] Notifying ${player.Name} of ${purchaseType} purchase (ID: ${id})`);
		log("Info", `Notifying ${player.Name} of ${purchaseType} purchase (ID: ${id})`);
		
		try {
			// Direct approach to get and fire the remote event to avoid any errors
			const remoteFolder = game.GetService("ReplicatedStorage").FindFirstChild("GameRemotes") as Folder;
			if (remoteFolder) {
				const notifyRemote = remoteFolder.FindFirstChild("NotifyPurchase") as RemoteEvent;
				if (notifyRemote) {
					print(`[PURCHASE-HANDLER] Found NotifyPurchase remote, firing to client ${player.Name}`);
					notifyRemote.FireClient(player, purchaseType, id);
				} else {
					print(`[PURCHASE-HANDLER] NotifyPurchase remote not found in GameRemotes folder`);
				}
			} else {
				print(`[PURCHASE-HANDLER] GameRemotes folder not found in ReplicatedStorage`);
			}
		} catch (err) {
			print(`[PURCHASE-HANDLER] Error in notifyPlayer: ${err}`);
		}
	}

	private processedReceipts = new Set<string>();

	// --- Direct product implementation ---
	
	// Apply 3x extra lives benefit
	private applyExtraLivesBenefit(player: Player): void {
		print(`[PURCHASE-HANDLER] === APPLYING 3X EXTRA LIVES TO ${player.Name} ===`);
		log("Info", `Applying 3x extra lives benefit to ${player.Name}`);
		
		// Use attributes to store extra lives
		const currentLives = player.GetAttribute("ExtraLives") as number ?? 0;
		player.SetAttribute("ExtraLives", currentLives + 3);
		
		print(`[PURCHASE-HANDLER] Added 3 extra lives to ${player.Name}, total: ${currentLives + 3}`);
		log("Info", `Added 3 extra lives to ${player.Name}, total: ${currentLives + 3}`);
	}
	
	// Apply revive benefit
	private applyReviveBenefit(player: Player): void {
		log("Info", `Applying revive benefit to ${player.Name}`);
		
		// Check if player is dead or needs reviving
		const character = player.Character;
		if (!character) {
			// Player has no character, load a new one
			log("Info", `Player ${player.Name} has no character, respawning`);
			player.LoadCharacter();
			return;
		}
		
		// Check if player's humanoid exists and is dead
		const humanoid = character.FindFirstChildOfClass("Humanoid") as Humanoid;
		if (!humanoid) {
			log("Error", `Humanoid not found for ${player.Name}, respawning`);
			player.LoadCharacter();
			return;
		}
		
		if (humanoid.Health <= 0) {
			// Player is dead, respawn them
			log("Info", `Reviving dead player ${player.Name}`);
			player.LoadCharacter();
		} else {
			// Player is not dead, heal them to full
			log("Info", `Player ${player.Name} is not dead, healing to full health`);
			humanoid.Health = humanoid.MaxHealth;
		}
	}
	
	// Apply team revive benefit
	private applyTeamReviveBenefit(player: Player): void {
		log("Info", `Applying team revive benefit to ${player.Name}`);
		
		// Get all players in the game
		const playersInGame = Players.GetPlayers();
		
		// Setup team revive parameters
		const reviveRadius = 50; // Revive players within 50 studs
		let reviveCount = 0;
		
		// Check if the player has a character
		if (!player.Character || !player.Character.PrimaryPart) {
			log("Error", `Player ${player.Name} has no character or PrimaryPart`);
			return;
		}
		
		// Get the position of the initiating player
		const initiatorPosition = player.Character.PrimaryPart.Position;
		
		for (const teammate of playersInGame) {
			// Skip if it's the same player who initiated the team revive
			if (teammate === player) continue;
			
			// Check if teammate has a character
			if (!teammate.Character) {
				// Teammate has no character, revive them
				log("Info", `Reviving teammate ${teammate.Name} who has no character`);
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
						log("Info", `Reviving dead teammate ${teammate.Name} within ${reviveRadius} radius`);
						teammate.LoadCharacter();
						reviveCount++;
					} else if (humanoid) {
						// Teammate is not dead but within radius, heal them
						log("Info", `Healing teammate ${teammate.Name} within ${reviveRadius} radius`);
						humanoid.Health = humanoid.MaxHealth;
						reviveCount++;
					}
				}
			}
		}
		
		log("Info", `Team revive benefit applied by ${player.Name}, revived/healed ${reviveCount} teammates`);
	}
}
