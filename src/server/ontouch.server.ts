// Detect ontouch part. in game.workshop called (ShopDetect), Fire a remote event.
const Players = game.GetService("Players");
const ReplicatedStorage = game.GetService("ReplicatedStorage");
const Workspace = game.GetService("Workspace");

// dont create remote event
// const shopRemote = new Instance("RemoteEvent");
// shopRemote.Name = "ShopDetected";
// shopRemote.Parent = ReplicatedStorage;

//finding remote event
const shopRemote = ReplicatedStorage.FindFirstChild("ShopOpen") as RemoteEvent;

// Get the shop detection part directly from Workspace
const shopDetectPart = Workspace.FindFirstChild("ShopDetect") as BasePart;
print("ShopDetect part found:", shopDetectPart !== undefined);

// Check if RemoteEvent exists
print("ShopOpen RemoteEvent found:", shopRemote !== undefined);

// Simple cooldown flag
let canFire = true;
const COOLDOWN_TIME = 0.5; // Half-second cooldown

if (shopDetectPart) {
	print("Setting up touch detection for shop part");
	// When player enters the shop area
	shopDetectPart.Touched.Connect((otherPart) => {
		// Only process if not on cooldown
		if (!canFire) return;

		const character = otherPart.Parent;
		const player = Players.GetPlayerFromCharacter(character) as Player;

		if (player) {
			print("Player entered shop area");
			shopRemote.FireClient(player, true); // true = entering shop

			// Set cooldown
			canFire = false;
			task.spawn(() => {
				task.wait(COOLDOWN_TIME);
				canFire = true;
			});
		}
	});

	// When player leaves the shop area
	shopDetectPart.TouchEnded.Connect((otherPart) => {
		// Only process if not on cooldown
		if (!canFire) return;

		const character = otherPart.Parent;
		const player = Players.GetPlayerFromCharacter(character);

		if (player) {
			print("Player left shop area");
			shopRemote.FireClient(player, false); // false = leaving shop

			// Set cooldown
			canFire = false;
			task.spawn(() => {
				task.wait(COOLDOWN_TIME);
				canFire = true;
			});
		}
	});
}
