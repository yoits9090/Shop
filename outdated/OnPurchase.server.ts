import { Service, OnStart } from "@flamework/core";
import { Players, MarketplaceService } from "@rbxts/services";

/**
 * Handles purchase detection and rewards for gamepasses and developer products
 */
@Service()
export class PurchaseService implements OnStart {
	// Define gamepass benefits
	private readonly gamepassBenefits = new Map<number, (player: Player) => void>([
		[1150966154, (player) => this.applyRegenerationBenefit(player)], // Regeneration
		[1155692418, (player) => this.apply2xHealthBenefit(player)], // 2x Health
		[1151894037, (player) => this.applySprintBenefit(player)], // Sprint
		[1149964231, (player) => this.apply2xSpeedBenefit(player)], // 2x Speed
	]);

	// Define developer product benefits
	private readonly productBenefits = new Map<number, (player: Player) => void>([
		[3261484089, (player) => this.applyExtraLivesBenefit(player)], // 3x Extra Lives
		[3261484228, (player) => this.applyReviveBenefit(player)], // Revive
		[3261490620, (player) => this.applyTeamReviveBenefit(player)], // Revive Teammates
	]);

	// Track processed receipts to prevent duplicate processing
	private processedReceipts = new Set<string>();

	onStart() {
		print("[DEBUG] PurchaseService onStart running");
		print("PurchaseService started");

		// Listen for gamepass purchases
		MarketplaceService.PromptGamePassPurchaseFinished.Connect(
			(player: Player, gamepassId: number, purchased: boolean) => {
				if (purchased) {
					this.handleGamepassPurchase(player, gamepassId);
				}
			},
		);

		// Listen for developer product purchases using ProcessReceipt
		MarketplaceService.ProcessReceipt = (receiptInfo: { PurchaseId: string; ProductId: number; PlayerId: number }) => {
			print(`[DEBUG] ProcessReceipt called with ProductId: ${receiptInfo.ProductId}, PlayerId: ${receiptInfo.PlayerId}`);
			// Check if receipt was already processed
			if (this.processedReceipts.has(receiptInfo.PurchaseId)) {
				return Enum.ProductPurchaseDecision.PurchaseGranted;
			}

			print(`[DEBUG] Looking up player with ID: ${receiptInfo.PlayerId}`);
			const player = Players.GetPlayerByUserId(receiptInfo.PlayerId);
			print(`[DEBUG] Player lookup result: ${player ? player.Name : "Player not found"}`);
			if (player) {
				print(`[DEBUG] About to call handleProductPurchase for ${player.Name}`);
				this.handleProductPurchase(player, receiptInfo.ProductId);
				print(`[DEBUG] handleProductPurchase completed for ${player.Name}`);
				this.processedReceipts.add(receiptInfo.PurchaseId);
				return Enum.ProductPurchaseDecision.PurchaseGranted;
			}

			// If player is not in game, don't process yet
			return Enum.ProductPurchaseDecision.NotProcessedYet;
		};

		print("[DEBUG] ProcessReceipt handler has been set");
	}

	/**
	 * Apply benefits when a gamepass is purchased
	 */
	private handleGamepassPurchase(player: Player, gamepassId: number) {
		print(`Player ${player.Name} purchased gamepass ${gamepassId}`);

		const benefit = this.gamepassBenefits.get(gamepassId);
		if (benefit) {
			benefit(player);
			this.notifyPlayer(player, "Gamepass", gamepassId);
		} else {
			print(`Warning: No benefit defined for gamepass ${gamepassId}`);
		}
	}

	/**
	 * Apply benefits when a developer product is purchased
	 */
	private handleProductPurchase(player: Player, productId: number) {
		print(`[DEBUG] Inside handleProductPurchase with player ${player.Name} and productId ${productId}`);
		print(`Player ${player.Name} purchased product ${productId}`);

		const benefit = this.productBenefits.get(productId);
		if (benefit) {
			benefit(player);
			this.notifyPlayer(player, "Product", productId);
		} else {
			print(`Warning: No benefit defined for product ${productId}`);
		}
	}

	/**
	 * Notify player of successful purchase
	 */
	private notifyPlayer(player: Player, purchaseType: string, id: number) {
		// In a real implementation, you'd use RemoteEvent to communicate with client
		print(`Notifying ${player.Name} of successful ${purchaseType} purchase: ${id}`);
	}

	/**
	 * Benefit implementations
	 */
	private applyRegenerationBenefit(player: Player) {
		// TODO: Implement regeneration benefit
		print(`Applied regeneration benefit to ${player.Name}`);
	}

	private apply2xHealthBenefit(player: Player) {
		// TODO: Implement 2x health benefit
		print(`Applied 2x health benefit to ${player.Name}`);
	}

	private applySprintBenefit(player: Player) {
		// TODO: Implement sprint benefit
		print(`Applied sprint benefit to ${player.Name}`);
	}

	private apply2xSpeedBenefit(player: Player) {
		// TODO: Implement 2x speed benefit
		print(`Applied 2x speed benefit to ${player.Name}`);
	}

	private applyExtraLivesBenefit(player: Player) {
		// TODO: Implement extra lives benefit
		print(`Applied extra lives benefit to ${player.Name}`);
	}

	private applyReviveBenefit(player: Player) {
		// TODO: Implement revive benefit
		print(`Applied revive benefit to ${player.Name}`);
	}

	private applyTeamReviveBenefit(player: Player) {
		// TODO: Implement team revive benefit
		print(`Applied team revive benefit to ${player.Name}`);
	}

	/**
	 * Check if a player owns a gamepass
	 */
	public async checkGamepassOwnership(player: Player, gamepassId: number): Promise<boolean> {
		try {
			return await MarketplaceService.UserOwnsGamePassAsync(player.UserId, gamepassId);
		} catch {
			return false;
		}
	}
}

// Service will be instantiated by Flamework automatically
