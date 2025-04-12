import { Service } from "@flamework/core";
import { Players } from "@rbxts/services";

// Use a more descriptive logger
const log = (level: "Info" | "Warn" | "Error" | "Debug", message: string) => {
	print(`[AbilitiesService][${level}] ${message}`);
};

@Service({
	loadOrder: 0, // Load before other services that might depend on it
})
export class AbilitiesService {
	constructor() {
		log("Info", "AbilitiesService constructor called");
	}

	onInit(): void {
		log("Info", "AbilitiesService initializing...");
		// Any initialization logic can go here
		Players.PlayerAdded.Connect((player) => {
			log("Info", `Player ${player.Name} added, ready to apply benefits`);
		});
	}

	// --- Benefit Implementation Functions ---
	// NOTE: Implement the actual game logic for each benefit.

	public applyRegenerationBenefit(player: Player): void {
		log("Info", `Applying regeneration benefit to ${player.Name}`);
		// TODO: Implement game logic for regeneration (e.g., start a health regeneration loop)
		// Example: player.SetAttribute("HasRegen", true);
	}

	public apply2xHealthBenefit(player: Player): void {
		log("Info", `Applying 2x health benefit to ${player.Name}`);
		// TODO: Implement game logic for 2x health (e.g., increase MaxHealth and Health)
		// Example: const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		//          if (humanoid) { humanoid.MaxHealth *= 2; humanoid.Health = humanoid.MaxHealth; }
	}

	public applySprintBenefit(player: Player): void {
		log("Info", `Applying sprint benefit to ${player.Name}`);
		// TODO: Implement game logic for sprint (e.g., enable a faster walk speed ability)
		// Example: player.SetAttribute("CanSprint", true);
	}

	public apply2xSpeedBenefit(player: Player): void {
		log("Info", `Applying 2x speed benefit to ${player.Name}`);
		// TODO: Implement game logic for 2x speed (e.g., increase WalkSpeed)
		// Example: const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		//          if (humanoid) { humanoid.WalkSpeed *= 2; }
	}

	public applyExtraLivesBenefit(player: Player): void {
		log("Info", `Applying 3x extra lives benefit to ${player.Name}`);
		// TODO: Implement game logic for extra lives (e.g., increment a lives counter)
		// Example: const currentLives = player.GetAttribute("ExtraLives") as number ?? 0;
		//          player.SetAttribute("ExtraLives", currentLives + 3);
	}

	public applyReviveBenefit(player: Player): void {
		log("Info", `Applying revive benefit to ${player.Name}`);
		// TODO: Implement game logic for revive (e.g., respawn the player immediately if dead)
		// Example: const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		//          if (humanoid && humanoid.Health <= 0) { player.LoadCharacter(); }
	}

	public applyTeamReviveBenefit(player: Player): void {
		log("Info", `Applying team revive benefit to ${player.Name}`);
		// TODO: Implement game logic for team revive (e.g., find dead teammates and respawn them)
		// Example: Find teammates in a specific radius or on the same team and call player.LoadCharacter() for them.
	}

	// Wrapper method to call benefit functions by name, ensuring correct 'this' context
	public applyBenefitByName(benefitName: string, player: Player): void {
		log("Info", `Applying benefit ${benefitName} to ${player.Name}`);
		if (benefitName in this) {
			log("Debug", `Found method ${benefitName}, calling it for ${player.Name}`);
			const method = this[benefitName as keyof this];
			const [success, errorMsg] = pcall(() => {
				(method as (player: Player) => void)(player);
			});
			if (!success) {
				log("Error", `Error applying benefit ${benefitName}: ${errorMsg}`);
			}
		} else {
			log("Error", `Benefit method ${benefitName} not found in AbilitiesService`);
		}
	}

	// --- Character-Specific Benefit Application ---
	// This function can be called when a player's character loads to apply persistent effects
	public applyCharacterBenefits(player: Player): void {
		log("Info", `Applying character-specific benefits for ${player.Name}`);

		// Example: Re-apply 2x speed if the player owns the gamepass
		// We need MarketplaceService here if we check ownership within this service
		// Alternatively, the calling service (like PurchaseService or a PlayerJoin service)
		// could perform the check and then call the specific ability function.

		// const MarketplaceService = game.GetService("MarketplaceService");
		// const speedPassId = 1149964231;
		// pcall(() => {
		// 	const ownsPass = MarketplaceService.UserOwnsGamePassAsync(player.UserId, speedPassId);
		// 	if (ownsPass) {
		// 		const humanoid = character.FindFirstChildOfClass("Humanoid");
		// 		if (humanoid) {
		// 			log("Info", `Applying 2x speed to ${player.Name}'s character (on spawn)`);
		// 			humanoid.WalkSpeed *= 2; // Be careful with repeated multiplication!
		// 		}
		// 	}
		// });
	}
}
