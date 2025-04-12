import { Service, OnInit, OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";

// Use a consistent logger format
const log = (level: "Info" | "Warn" | "Error", message: string) => {
	print(`[AbilitiesService][${level}] ${message}`);
};

@Service({})
export class AbilitiesService implements OnStart {
	onStart() {
		log("Info", "AbilitiesService started.");
		// We might connect player joining events here later if needed
		// For now, benefits are applied on purchase or existing checks
	}

	// --- Benefit Implementation Functions ---
	// NOTE: Implement the actual game logic for each benefit.

	applyRegenerationBenefit(player: Player): void {
		log("Info", `Applying regeneration benefit to ${player.Name}`);
		// TODO: Implement game logic for regeneration (e.g., start a health regeneration loop)
		// Example: player.SetAttribute("HasRegen", true);
	}

	apply2xHealthBenefit(player: Player): void {
		log("Info", `Applying 2x health benefit to ${player.Name}`);
		// TODO: Implement game logic for 2x health (e.g., increase MaxHealth and Health)
		// Example: const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		//          if (humanoid) { humanoid.MaxHealth *= 2; humanoid.Health = humanoid.MaxHealth; }
	}

	applySprintBenefit(player: Player): void {
		log("Info", `Applying sprint benefit to ${player.Name}`);
		// TODO: Implement game logic for sprint (e.g., enable a faster walk speed ability)
		// Example: player.SetAttribute("CanSprint", true);
	}

	apply2xSpeedBenefit(player: Player): void {
		log("Info", `Applying 2x speed benefit to ${player.Name}`);
		// TODO: Implement game logic for 2x speed (e.g., increase WalkSpeed)
		// Example: const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		//          if (humanoid) { humanoid.WalkSpeed *= 2; }
	}

	applyExtraLivesBenefit(player: Player): void {
		log("Info", `Applying 3x extra lives benefit to ${player.Name}`);
		// TODO: Implement game logic for extra lives (e.g., increment a lives counter)
		// Example: const currentLives = player.GetAttribute("ExtraLives") as number ?? 0;
		//          player.SetAttribute("ExtraLives", currentLives + 3);
	}

	applyReviveBenefit(player: Player): void {
		log("Info", `Applying revive benefit to ${player.Name}`);
		// TODO: Implement game logic for revive (e.g., respawn the player immediately if dead)
		// Example: const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		//          if (humanoid && humanoid.Health <= 0) { player.LoadCharacter(); }
	}

	applyTeamReviveBenefit(player: Player): void {
		log("Info", `Applying team revive benefit to ${player.Name}`);
		// TODO: Implement game logic for team revive (e.g., find dead teammates and respawn them)
		// Example: Find teammates in a specific radius or on the same team and call player.LoadCharacter() for them.
	}

	// --- Character-Specific Benefit Application ---
	// This function can be called when a player's character loads to apply persistent effects
	applyCharacterBenefits(player: Player) {
		const character = player.Character;
		if (!character) {
			return;
		}
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
