// ServiceFixSpeed.server.ts - Direct 2x speed enabler for gamepass owners
import { Players, MarketplaceService } from "@rbxts/services";

// This script runs on the server and enables 2x speed only for players with the 2x speed gamepass
print("[SpeedFix] Starting 2x speed fix script");

// 2x Speed gamepass ID
const SPEED_GAMEPASS_ID = 1149964231;

// Function to check if a player owns the 2x speed gamepass and enable it if they do
function checkAndEnable2xSpeed(player: Player): void {
	// Use pcall to safely check ownership
	const [success, ownsGamepass] = pcall(() => {
		return MarketplaceService.UserOwnsGamePassAsync(player.UserId, SPEED_GAMEPASS_ID);
	});

	if (success && ownsGamepass) {
		// Set the attribute that tracks 2x speed ownership
		player.SetAttribute("Has2xSpeed", true);
		
		// Apply to current character if it exists
		if (player.Character) {
			const humanoid = player.Character.FindFirstChildOfClass("Humanoid") as Humanoid;
			if (humanoid) {
				// Avoid applying multiple times
				if (!player.GetAttribute("Speed2xApplied")) {
					player.SetAttribute("Speed2xApplied", true);
					humanoid.WalkSpeed *= 2;
					print(`[SpeedFix] Applied 2x speed to ${player.Name}'s character (base: ${humanoid.WalkSpeed / 2} → ${humanoid.WalkSpeed})`);
				}
			}
		}
		
		print(`[SpeedFix] Enabled 2x speed for ${player.Name} (has gamepass)`);
	} else {
		// Make sure 2x speed is disabled for players without the gamepass
		player.SetAttribute("Has2xSpeed", false);
		player.SetAttribute("Speed2xApplied", false);
		print(`[SpeedFix] 2x speed disabled for ${player.Name} (no gamepass)`);
	}
}

// Function to apply 2x speed to a character
function apply2xSpeedToCharacter(player: Player, character: Model): void {
	// Only apply if player has the attribute
	if (player.GetAttribute("Has2xSpeed")) {
		const humanoid = character.WaitForChild("Humanoid") as Humanoid;
		if (!humanoid) return;
		
		// Always apply the speed multiplier on each new character
		// Store the original/base speed before modifying
		const baseSpeed = 16; // Default Roblox walk speed
		
		// Set speed directly to the 2x value
		humanoid.WalkSpeed = baseSpeed * 2;
		
		// Mark as applied on this character instance
		player.SetAttribute("Speed2xApplied", true);
		
		print(`[SpeedFix] Applied 2x speed to ${player.Name}'s character (base: ${baseSpeed} → ${humanoid.WalkSpeed})`);
	}
}

// Check and enable 2x speed for all existing players
Players.GetPlayers().forEach(checkAndEnable2xSpeed);

// Check and enable 2x speed for any new players who join
Players.PlayerAdded.Connect(checkAndEnable2xSpeed);

// Monitor character respawns to ensure speed is applied every time
Players.GetPlayers().forEach((player) => {
	// Set up for existing characters
	if (player.Character) {
		// Reset the applied flag on each character creation
		player.SetAttribute("Speed2xApplied", false);
		apply2xSpeedToCharacter(player, player.Character);
	}
	
	// Set up for future characters
	player.CharacterAdded.Connect((character) => {
		// Reset the flag for each new character
		player.SetAttribute("Speed2xApplied", false);
		
		// Verify that player still has the gamepass
		const [success, ownsGamepass] = pcall(() => {
			return MarketplaceService.UserOwnsGamePassAsync(player.UserId, SPEED_GAMEPASS_ID);
		});

		if (success && ownsGamepass) {
			// Small delay to ensure humanoid is fully loaded and configured
			task.delay(0.5, () => {
				apply2xSpeedToCharacter(player, character);
				print(`[SpeedFix] Applied 2x speed after respawn for ${player.Name} (has gamepass)`);
			});
		}
	});
});

// Also set up the same monitoring for new players
Players.PlayerAdded.Connect((player) => {
	player.CharacterAdded.Connect((character) => {
		// Reset the flag for each new character
		player.SetAttribute("Speed2xApplied", false);
		
		// Apply speed boost if player has the gamepass
		if (player.GetAttribute("Has2xSpeed")) {
			task.delay(0.5, () => {
				apply2xSpeedToCharacter(player, character);
			});
		}
	});
});

print("[SpeedFix] 2x speed fix initialized and running");

// No need to export anything
export {};
