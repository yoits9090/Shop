import { Service } from "@flamework/core";
import { Players } from "@rbxts/services";
import { getRemotes } from "../shared/GameRemotes.shared";

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
		print("[DEBUG-ABILITIES] AbilitiesService constructor executed");
	}

	// Properties for regeneration and other ability states
	private regenLoopRunning = false;

	onInit(): void {
		log("Info", "AbilitiesService initializing...");
		print("[DEBUG-ABILITIES] AbilitiesService.onInit() called");

		// Set up player added event for tracking and benefits
		print("[DEBUG-ABILITIES] Setting up PlayerAdded event in AbilitiesService");
		Players.PlayerAdded.Connect((player) => {
			log("Info", `Player ${player.Name} added, ready to apply benefits`);
			print(`[DEBUG-ABILITIES] Player ${player.Name} added event fired in AbilitiesService`);

			// Set up character added event to re-apply benefits
			player.CharacterAdded.Connect((character) => {
				this.applyCharacterBenefits(player);
			});
		});

		// Check existing players and apply benefits if needed
		const existingPlayers = Players.GetPlayers();
		print(`[DEBUG-ABILITIES] Found ${existingPlayers.size()} existing players on init`);
		for (let i = 0; i < existingPlayers.size(); i++) {
			const player = existingPlayers[i];
			print(`[DEBUG-ABILITIES] Existing player: ${player.Name}`);

			// Set up character added event
			player.CharacterAdded.Connect((character) => {
				this.applyCharacterBenefits(player);
			});

			// Apply to current character if exists
			if (player.Character) {
				this.applyCharacterBenefits(player);
			}
		}
	}

	// --- Benefit Implementation Functions ---
	// NOTE: Implement the actual game logic for each benefit.

	// Start regeneration loop for all players with regeneration
	private startRegenerationLoop(): void {
		if (this.regenLoopRunning) return;

		this.regenLoopRunning = true;
		log("Info", "Starting regeneration loop for all eligible players");

		// Create a loop to handle regeneration for all players
		task.spawn(() => {
			// Use regular while loop with task.wait rather than an infinite loop
			while (this.regenLoopRunning) {
				task.wait(1); // Regenerate every second

				// Process all players
				const players = Players.GetPlayers();
				for (const player of players) {
					if (player.GetAttribute("HasRegeneration")) {
						if (player.Character) {
							this.applyRegenToCharacter(player, player.Character);
						}
					}
				}
			}
		});
	}

	// Apply regeneration to a specific character
	private applyRegenToCharacter(player: Player, character: Model): void {
		const humanoid = character.FindFirstChildOfClass("Humanoid") as Humanoid;
		if (!humanoid) return;

		// Only regenerate if not at full health
		if (humanoid.Health < humanoid.MaxHealth) {
			// Regenerate 1 health per second
			humanoid.Health = math.min(humanoid.Health + 1, humanoid.MaxHealth);

			// Add visual effect for regeneration (optional)
			this.createRegenerationEffect(character);
		}
	}

	// Create a visual effect for regeneration (particles, etc.)
	private createRegenerationEffect(character: Model): void {
		// You could create particles or other visual effects here
		// This is just a placeholder implementation
		const humanoidRootPart = character.FindFirstChild("HumanoidRootPart") as BasePart;
		if (!humanoidRootPart) return;

		// Check if effect already exists to avoid duplication
		if (humanoidRootPart.FindFirstChild("RegenEffect")) return;

		// Create a small visual indicator for debugging
		const effect = new Instance("Part") as Part;
		effect.Name = "RegenEffect";
		effect.Size = new Vector3(0.2, 0.2, 0.2);
		effect.Shape = Enum.PartType.Ball;
		effect.Material = Enum.Material.Neon;
		effect.BrickColor = new BrickColor("Lime green");
		effect.CanCollide = false;
		effect.Anchored = false;

		// Weld to character
		const weld = new Instance("WeldConstraint") as WeldConstraint;
		weld.Part0 = humanoidRootPart;
		weld.Part1 = effect;
		weld.Parent = effect;

		effect.Parent = humanoidRootPart;

		// Remove after a short time
		task.delay(0.5, () => {
			effect.Destroy();
		});
	}

	public applyRegenerationBenefit(player: Player): void {
		log("Info", `Applying regeneration benefit to ${player.Name}`);
		// Set player attribute for regeneration
		player.SetAttribute("HasRegeneration", true);

		// Begin regeneration loop if not already running
		if (!this.regenLoopRunning) {
			this.startRegenerationLoop();
		}

		// Apply to current character if exists
		if (player.Character) {
			this.applyRegenToCharacter(player, player.Character);
		}
	}

	public apply2xHealthBenefit(player: Player): void {
		log("Info", `Applying 2x health benefit to ${player.Name}`);
		// Set player attribute
		player.SetAttribute("Has2xHealth", true);

		// Apply to current character if exists
		if (player.Character) {
			const humanoid = player.Character.FindFirstChildOfClass("Humanoid") as Humanoid;
			if (humanoid) {
				// To avoid multiplying repeatedly, check if already applied
				if (!player.GetAttribute("Health2xApplied")) {
					log("Info", `Setting 2x health for ${player.Name}'s character`);
					player.SetAttribute("Health2xApplied", true);
					humanoid.MaxHealth *= 2;
					humanoid.Health = humanoid.MaxHealth;
				}
			}
		}

		// Setup character added listener for future spawns
		if (!player.GetAttribute("Health2xListenerSetup")) {
			player.SetAttribute("Health2xListenerSetup", true);
			player.CharacterAdded.Connect((character) => {
				if (player.GetAttribute("Has2xHealth")) {
					const humanoid = character.WaitForChild("Humanoid") as Humanoid;
					log("Info", `Setting 2x health for ${player.Name}'s new character`);
					humanoid.MaxHealth *= 2;
					humanoid.Health = humanoid.MaxHealth;
				}
			});
		}
	}

	public applySprintBenefit(player: Player): void {
		log("Info", `Applying sprint benefit to ${player.Name}`);
		// Set player attribute for sprint capability
		player.SetAttribute("CanSprint", true);

		// Use the GameRemotes system to access the sprint remote event
		const remotes = getRemotes();

		// Fire the remote to let client know sprint is enabled
		remotes.sprintEnabled.FireClient(player, true);
		log("Info", `Sprint capability enabled for ${player.Name} via GameRemotes`);
	}

	public apply2xSpeedBenefit(player: Player): void {
		log("Info", `Applying 2x speed benefit to ${player.Name}`);
		// Set player attribute
		player.SetAttribute("Has2xSpeed", true);

		// Apply to current character if exists
		if (player.Character) {
			const humanoid = player.Character.FindFirstChildOfClass("Humanoid") as Humanoid;
			if (humanoid) {
				// Avoid applying multiple times
				if (!player.GetAttribute("Speed2xApplied")) {
					log("Info", `Setting 2x speed for ${player.Name}'s character`);
					player.SetAttribute("Speed2xApplied", true);
					humanoid.WalkSpeed *= 2;
				}
			}
		}

		// Setup character added listener for future spawns
		if (!player.GetAttribute("Speed2xListenerSetup")) {
			player.SetAttribute("Speed2xListenerSetup", true);
			player.CharacterAdded.Connect((character) => {
				if (player.GetAttribute("Has2xSpeed")) {
					const humanoid = character.WaitForChild("Humanoid") as Humanoid;
					log("Info", `Setting 2x speed for ${player.Name}'s new character`);
					humanoid.WalkSpeed *= 2;
				}
			});
		}
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

	public applyTemporaryShield(player: Player, duration: number = 30): void {
		log("Info", `Applying temporary shield to ${player.Name} for ${duration} seconds`);
		player.SetAttribute("HasShield", true);

		// Get the remotes system
		const remotes = getRemotes();

		// Notify client to show shield effect
		remotes.applyEffect.FireClient(player, "Shield", duration);

		// Apply shield mechanics to character if it exists
		if (player.Character) {
			this.applyShieldToCharacter(player.Character);
		}

		// Setup listener for character respawns during shield duration
		const shieldConnection = player.CharacterAdded.Connect((character) => {
			if (player.GetAttribute("HasShield")) {
				this.applyShieldToCharacter(character);
			}
		});

		// Remove the shield after duration expires
		task.delay(duration, () => {
			player.SetAttribute("HasShield", false);
			shieldConnection.Disconnect(); // Clean up the connection
			log("Info", `Shield expired for ${player.Name}`);

			// Notify client that shield has expired
			remotes.applyEffect.FireClient(player, "ShieldExpired", 0);

			// Remove shield effect from current character if it exists
			if (player.Character) {
				this.removeShieldFromCharacter(player.Character);
			}
		});
	}

	private applyShieldToCharacter(character: Model): void {
		// Implementation would depend on game mechanics
		// For example, this could make the character temporarily invulnerable
		// or create a shield mesh around the character

		const humanoid = character.FindFirstChildOfClass("Humanoid") as Humanoid;
		if (!humanoid) return;

		// Apply shield effect - in this example we'll just create a visual indicator
		const humanoidRootPart = character.FindFirstChild("HumanoidRootPart") as BasePart;
		if (!humanoidRootPart) return;

		// Check if shield already exists to avoid duplication
		if (humanoidRootPart.FindFirstChild("ShieldEffect")) return;

		// Create a shield visual effect
		const shieldEffect = new Instance("Part") as Part;
		shieldEffect.Name = "ShieldEffect";
		shieldEffect.Shape = Enum.PartType.Ball;
		shieldEffect.Size = new Vector3(8, 8, 8);
		shieldEffect.Transparency = 0.7;
		shieldEffect.CanCollide = false;
		shieldEffect.Material = Enum.Material.ForceField;
		shieldEffect.BrickColor = new BrickColor("Cyan");

		// Weld to character
		const weld = new Instance("WeldConstraint") as WeldConstraint;
		weld.Part0 = humanoidRootPart;
		weld.Part1 = shieldEffect;
		weld.Parent = shieldEffect;

		shieldEffect.Parent = humanoidRootPart;
	}

	private removeShieldFromCharacter(character: Model): void {
		const humanoidRootPart = character.FindFirstChild("HumanoidRootPart") as BasePart;
		if (!humanoidRootPart) return;

		const shieldEffect = humanoidRootPart.FindFirstChild("ShieldEffect");
		if (shieldEffect) {
			shieldEffect.Destroy();
		}
	}

	public applyTeamReviveBenefit(player: Player): void {
		log("Info", `Applying team revive benefit to ${player.Name}`);
		// TODO: Implement game logic for team revive (e.g., find dead teammates and respawn them)
		// Example: Find teammates in a specific radius or on the same team and call player.LoadCharacter() for them.
	}

	// Wrapper method to call benefit functions by name, ensuring correct 'this' context
	public applyBenefitByName(benefitName: string, player: Player): void {
		print(`[DEBUG-ABILITIES] applyBenefitByName called with benefit: ${benefitName}, player: ${player.Name}`);
		log("Info", `Applying benefit ${benefitName} to ${player.Name} via applyBenefitByName`);

		const [success, errorMsg] = pcall(() => {
			switch (benefitName) {
				case "applyRegenerationBenefit":
					this.applyRegenerationBenefit(player);
					break;
				case "apply2xHealthBenefit":
					this.apply2xHealthBenefit(player);
					break;
				case "applySprintBenefit":
					this.applySprintBenefit(player);
					break;
				case "apply2xSpeedBenefit":
					this.apply2xSpeedBenefit(player);
					break;
				case "applyExtraLivesBenefit":
					this.applyExtraLivesBenefit(player);
					break;
				case "applyReviveBenefit":
					this.applyReviveBenefit(player);
					break;
				case "applyTeamReviveBenefit":
					this.applyTeamReviveBenefit(player);
					break;
				// Add cases for developer product benefits if they are distinct methods
				// case "applyTemporarySpeedBoost": this.applyTemporarySpeedBoost(player); break;
				// case "applyTemporaryRegeneration": this.applyTemporaryRegeneration(player); break;
				// case "applyTemporaryShield": this.applyTemporaryShield(player); break;
				default:
					log(
						"Error",
						`Benefit method ${benefitName} not found or handled in AbilitiesService.applyBenefitByName`,
					);
					return; // Exit the pcall function body
			}
			log("Debug", `Successfully called ${benefitName} for ${player.Name} via applyBenefitByName`);
		});

		if (!success) {
			log("Error", `Error applying benefit ${benefitName} via applyBenefitByName: ${errorMsg}`);
		}
	}

	// --- Character-Specific Benefit Application ---
	// This function can be called when a player's character loads to apply persistent effects
	public applyCharacterBenefits(player: Player): void {
		log("Info", `Applying character-specific benefits for ${player.Name}`);

		// Re-apply 2x health if player has it
		if (player.GetAttribute("Has2xHealth")) {
			this.apply2xHealthBenefit(player);
		}

		// Re-apply 2x speed if player has it
		if (player.GetAttribute("Has2xSpeed")) {
			this.apply2xSpeedBenefit(player);
		}

		// Re-apply sprint ability if player has it
		if (player.GetAttribute("CanSprint")) {
			this.applySprintBenefit(player);
		}
	}
}
