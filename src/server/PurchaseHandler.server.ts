import { Service, Dependency } from "@flamework/core";
import { MarketplaceService, Players } from "@rbxts/services";

// Use a more descriptive logger
const log = (level: "Info" | "Warn" | "Error" | "Debug", message: string) => {
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
			[3261484089, "applyTemporarySpeedBoost"],
			[3261484228, "applyTemporaryRegeneration"],
			[3261490620, "applyTemporaryShield"],
		]);

		const productId = receiptInfo.ProductId;
		const benefitFunctionName = productBenefitMap.get(productId);

		if (benefitFunctionName !== undefined) {
			log(
				"Info",
				`Attempting to apply benefit [${benefitFunctionName}] for product ${productId} to ${player.Name}`,
			);
			// Use pcall to safely call the method
			let purchaseDecision: Enum.ProductPurchaseDecision = Enum.ProductPurchaseDecision.NotProcessedYet;
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
					// If we reached here without error inside the pcall, grant the purchase
					purchaseDecision = Enum.ProductPurchaseDecision.PurchaseGranted;
					this.processedReceipts.add(receiptInfo.PurchaseId);
					this.notifyPlayer(player, "Product", productId);
				} else {
					log("Error", "AbilitiesService is not initialized");
					throw "AbilitiesService is not initialized";
				}
			});

			if (!success) {
				log("Error", `Failed to apply benefit ${benefitFunctionName}: ${errorMsg}`);
				// Keep purchaseDecision as NotProcessedYet if pcall failed
			}

			return purchaseDecision;
		} else {
			log("Error", `Unknown product ID: ${productId}`);
			return Enum.ProductPurchaseDecision.NotProcessedYet;
		}
	}

	// --- Notification to Player ---
	private notifyPlayer(player: Player, purchaseType: "Gamepass" | "Product", id: number): void {
		log("Info", `Notifying ${player.Name} of ${purchaseType} purchase (ID: ${id})`);
		// Example: Fire a RemoteEvent to the client to show a UI popup
		// Remotes.Default.Client.Get("PurchaseNotification")?.Call(player, purchaseType, id);
	}

	private processedReceipts = new Set<string>();
}
