import { Service, OnStart, OnInit, Dependency } from "@flamework/core";
import { Players, MarketplaceService } from "@rbxts/services";
import { AbilitiesService } from "./AbilitiesHandler.server"; // Import the abilities service

// Use a more descriptive logger
const log = (level: "Info" | "Warn" | "Error", message: string) => {
	print(`[PurchaseProcessingService][${level}] ${message}`);
};

// Define the ReceiptInfo interface based on Roblox documentation
interface ReceiptInfo {
	PlayerId: number;
	PurchaseId: string;
	ProductId: number;
	CurrencyType: Enum.CurrencyType;
	CurrencySpent: number;
	PlaceIdWherePurchased: number; // Added based on Roblox API
}

@Service({})
export class PurchaseProcessingService implements OnStart, OnInit {
	// Inject AbilitiesService
	constructor(private abilitiesService: AbilitiesService) {}

	// Track processed developer product receipts to prevent double granting
	private processedReceipts = new Set<string>();

	onInit(): void {
		log("Info", "PurchaseProcessingService initializing...");
		// Initialization logic can go here if needed before OnStart
	}

	onStart() {
		log("Info", "PurchaseProcessingService starting...");

		// --- Connect Event Handlers ---
		this.connectEventHandlers();

		// --- Handle Existing Players ---
		Players.GetPlayers().forEach((player) => {
			log("Info", `Checking existing player ${player.Name} for owned gamepasses`);
			this.checkAndApplyOwnedGamepasses(player);
			// Apply character benefits if character already exists
			if (player.Character) {
				this.abilitiesService.applyCharacterBenefits(player);
			}
		});
	}

	private connectEventHandlers(): void {
		log("Info", "Connecting event handlers...");

		// Handle the result of a gamepass purchase prompt
		MarketplaceService.PromptGamePassPurchaseFinished.Connect(
			(player: Player, gamepassId: number, purchaseSuccess: boolean) => {
				if (purchaseSuccess) {
					log("Info", `Gamepass ${gamepassId} purchase successful for ${player.Name}. Applying benefits.`);
					this.handleGamepassPurchase(player, gamepassId);
					// Optionally apply character benefits immediately
					if (player.Character) {
						this.abilitiesService.applyCharacterBenefits(player); // Re-apply character effects
					}
				} else {
					log("Info", `Player ${player.Name} cancelled or failed purchase for gamepass ${gamepassId}`);
				}
			},
		);
		log("Info", "Connected PromptGamePassPurchaseFinished.");

		// Handle player joining
		Players.PlayerAdded.Connect((player) => {
			log("Info", `Player ${player.Name} joined. Checking owned gamepasses.`);
			this.checkAndApplyOwnedGamepasses(player);

			// Set up character handling for when character loads/respawns
			player.CharacterAdded.Connect((character) => {
				log("Info", `Character loaded for ${player.Name}, applying character-specific benefits`);
				this.abilitiesService.applyCharacterBenefits(player);
			});
		});
		log("Info", "Connected PlayerAdded.");

		// Assign ProcessReceipt using an arrow function to capture 'this' context
		MarketplaceService.ProcessReceipt = (receiptInfo: ReceiptInfo) => {
			return this.processReceiptCallback(receiptInfo);
		};
		log("Info", "Assigned ProcessReceipt callback.");
	}

	// --- Gamepass Handling ---

	/**
	 * Applies benefits for gamepasses a player owns.
	 * IMPORTANT: This function should be called BOTH when a player joins
	 * AND after a successful gamepass purchase.
	 */
	private checkAndApplyOwnedGamepasses(player: Player): void {
		log("Info", `Checking owned gamepasses for ${player.Name}`);
		// Get all possible gamepass IDs that have benefits defined in AbilitiesService
		// For now, we manually list them based on AbilitiesService methods.
		// Ideally, AbilitiesService could provide a list/map of its supported IDs.
		const gamepassIdsToCheck = [
			1150966154, // Regen
			1155692418, // 2x Health
			1151894037, // Sprint
			1149964231, // 2x Speed
		];

		gamepassIdsToCheck.forEach((gamepassId) => {
			const [success, ownsPass] = pcall(() => {
				return MarketplaceService.UserOwnsGamePassAsync(player.UserId, gamepassId);
			});

			if (success && ownsPass) {
				log("Info", `Player ${player.Name} owns gamepass ${gamepassId}. Applying benefit.`);
				// Call the specific benefit function based on ID
				this.handleGamepassPurchase(player, gamepassId, true); // Pass flag to skip notification
			} else if (!success) {
				log("Error", `Error checking ownership for gamepass ${gamepassId}: ${ownsPass}`); // ownsPass is error msg here
			}
		});
	}

	/**
	 * Handles calling the correct ability function for a gamepass.
	 * Can be called on initial check or after purchase.
	 */
	private handleGamepassPurchase(player: Player, gamepassId: number, isInitialCheck = false): void {
		let benefitFunction: ((player: Player) => void) | undefined;

		// Determine which function to call based on ID
		switch (gamepassId) {
			case 1150966154:
				benefitFunction = this.abilitiesService.applyRegenerationBenefit;
				break;
			case 1155692418:
				benefitFunction = this.abilitiesService.apply2xHealthBenefit;
				break;
			case 1151894037:
				benefitFunction = this.abilitiesService.applySprintBenefit;
				break;
			case 1149964231:
				benefitFunction = this.abilitiesService.apply2xSpeedBenefit;
				break;
			default:
				log("Warn", `No benefit function defined for gamepass ${gamepassId}`);
				return;
		}

		log("Info", `Applying benefit for gamepass ${gamepassId} to ${player.Name}`);
		// Correct pcall: Invoke the assigned function directly within the wrapper
		const [success, err] = pcall(() => benefitFunction(player));

		if (success) {
			if (!isInitialCheck) {
				this.notifyPlayer(player, "Gamepass", gamepassId);
			}
		} else {
			log("Error", `Failed to apply gamepass ${gamepassId} benefit to ${player.Name}: ${err}`);
		}
	}

	// --- Developer Product Handling ---

	/**
	 * The actual callback function assigned to MarketplaceService.ProcessReceipt.
	 * It handles logic like checking processed receipts and player existence.
	 */
	private processReceiptCallback(receiptInfo: ReceiptInfo): Enum.ProductPurchaseDecision {
		log(
			"Info",
			`Processing receipt for ProductId: ${receiptInfo.ProductId}, PurchaseId: ${receiptInfo.PurchaseId}`,
		);

		// Check if this receipt has already been processed
		if (this.processedReceipts.has(receiptInfo.PurchaseId)) {
			log("Warn", `Receipt ${receiptInfo.PurchaseId} already processed. Granting purchase.`);
			return Enum.ProductPurchaseDecision.PurchaseGranted;
		}

		// Wrap the core logic in a pcall to catch errors
		const [success, result] = pcall(() => {
			const player = Players.GetPlayerByUserId(receiptInfo.PlayerId);

			// If player is not in the server, Roblox will retry later.
			if (!player) {
				log(
					"Warn",
					`Player ${receiptInfo.PlayerId} not found for receipt ${receiptInfo.PurchaseId}. Will retry.`,
				);
				return Enum.ProductPurchaseDecision.NotProcessedYet;
			}

			log("Info", `Found player ${player.Name} for receipt ${receiptInfo.PurchaseId}`);
			const productId = receiptInfo.ProductId;

			// Call the handler to apply the specific product benefit
			const benefitApplied = this.handleProductPurchase(player, productId);

			if (benefitApplied) {
				log("Info", `Benefit applied successfully for product ${productId}. Granting purchase.`);
				// Mark as processed ONLY after successfully applying the benefit
				this.processedReceipts.add(receiptInfo.PurchaseId);
				return Enum.ProductPurchaseDecision.PurchaseGranted;
			} else {
				log(
					"Error",
					`Failed to apply benefit for product ${productId} to ${player.Name}. Not granting purchase yet.`,
				);
				// If the benefit fails, don't grant. Roblox might retry or refund.
				return Enum.ProductPurchaseDecision.NotProcessedYet;
			}
		});

		// Handle errors during the pcall itself
		if (!success) {
			log("Error", `Error processing receipt ${receiptInfo.PurchaseId}: ${result}. Returning NotProcessedYet.`);
			// An error occurred within the pcall block. Return NotProcessedYet so Roblox retries.
			return Enum.ProductPurchaseDecision.NotProcessedYet;
		}

		// Return the result calculated inside the pcall
		return result as Enum.ProductPurchaseDecision;
	}

	/**
	 * Handles calling the correct ability function for a product purchase.
	 * Returns true if the benefit was applied successfully (or no benefit was defined), false otherwise.
	 */
	private handleProductPurchase(player: Player, productId: number): boolean {
		let benefitFunction: ((player: Player) => void) | undefined;

		// Determine which function to call based on ID
		switch (productId) {
			case 3261484089:
				benefitFunction = this.abilitiesService.applyExtraLivesBenefit;
				break;
			case 3261484228:
				benefitFunction = this.abilitiesService.applyReviveBenefit;
				break;
			case 3261490620:
				benefitFunction = this.abilitiesService.applyTeamReviveBenefit;
				break;
			default:
				log("Warn", `No benefit function defined for product ${productId}. Granting purchase anyway.`);
				// If no benefit is defined, still grant the purchase as Roblox expects a decision.
				// We still return true because the purchase itself should be granted.
				return true;
		}

		log("Info", `Applying benefit for product ${productId} to ${player.Name}`);
		// Correct pcall: Invoke the assigned function directly within the wrapper
		const [success, err] = pcall(() => benefitFunction(player));

		if (success) {
			this.notifyPlayer(player, "Product", productId);
			return true; // Benefit applied successfully
		} else {
			log("Error", `Failed to apply product ${productId} benefit to ${player.Name}: ${err}`);
			return false; // Benefit application failed
		}
	}

	// --- Helper Functions ---
	private notifyPlayer(player: Player, purchaseType: "Gamepass" | "Product", id: number) {
		// Basic notification, implement a proper UI notification system later
		log("Info", `Notifying ${player.Name}: ${purchaseType} ID ${id} benefit applied.`);
		// Example: Fire a RemoteEvent to the client to show a UI popup
		// Remotes.Default.Client.Get("PurchaseNotification")?.Call(player, purchaseType, id);
	}
}
