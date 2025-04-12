// ServiceFix.server.ts - Direct sprint enabler for gamepass owners
import { Players, MarketplaceService } from "@rbxts/services";
import { getRemotes } from "../shared/GameRemotes.shared";

// Get the remotes system
const remotes = getRemotes();

// This script runs on the server and enables sprint only for players with the sprint gamepass
print("[SprintFix] Starting sprint fix script");

// Sprint gamepass ID
const SPRINT_GAMEPASS_ID = 1151894037;

// Function to check if a player owns the sprint gamepass and enable it if they do
function checkAndEnableSprint(player: Player): void {
	// Use pcall to safely check ownership
	const [success, ownsGamepass] = pcall(() => {
		return MarketplaceService.UserOwnsGamePassAsync(player.UserId, SPRINT_GAMEPASS_ID);
	});

	if (success && ownsGamepass) {
		// Set the attribute that the client checks for
		player.SetAttribute("CanSprint", true);

		// Tell the client that sprint is enabled
		remotes.sprintEnabled.FireClient(player, true);
		print(`[SprintFix] Enabled sprint for ${player.Name} (has gamepass)`);
	} else {
		// Make sure sprint is disabled for players without the gamepass
		player.SetAttribute("CanSprint", false);
		remotes.sprintEnabled.FireClient(player, false);
		print(`[SprintFix] Sprint disabled for ${player.Name} (no gamepass)`);
	}
}

// Check and enable sprint for all existing players
Players.GetPlayers().forEach(checkAndEnableSprint);

// Check and enable sprint for any new players who join
Players.PlayerAdded.Connect(checkAndEnableSprint);

// Set up character respawn handling
Players.PlayerAdded.Connect((player) => {
	player.CharacterAdded.Connect(() => {
		// Small delay to ensure client is ready
		task.wait(0.5);
		// Re-check gamepass ownership and re-enable sprint after respawn if they own it
		const [success, ownsGamepass] = pcall(() => {
			return MarketplaceService.UserOwnsGamePassAsync(player.UserId, SPRINT_GAMEPASS_ID);
		});

		if (success && ownsGamepass) {
			// Re-enable sprint after respawn
			remotes.sprintEnabled.FireClient(player, true);
			print(`[SprintFix] Re-enabled sprint after respawn for ${player.Name} (has gamepass)`);
		}
	});
});

print("[SprintFix] Sprint fix initialized and running");

// No need to export anything
export {};
