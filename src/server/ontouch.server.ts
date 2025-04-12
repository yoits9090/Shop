// Detect ontouch part. in game.workshop called (ShopDetect), Fire a remote event.
const Players = game.GetService("Players");
const ReplicatedStorage = game.GetService("ReplicatedStorage");
const Workspace = game.GetService("Workspace");

// dont create remote event
// const shopRemote = new Instance("RemoteEvent");
// shopRemote.Name = "ShopDetected";
// shopRemote.Parent = ReplicatedStorage;

//finding remote event
const shopRemote = ReplicatedStorage.FindFirstChild("ShopDetected") as RemoteEvent;

// Get the shop detection part
const workshop = Workspace.FindFirstChild("workshop") as Folder;
const shopDetectPart = workshop?.FindFirstChild("ShopDetect") as BasePart;

if (shopDetectPart) {
	shopDetectPart.Touched.Connect((otherPart) => {
		const character = otherPart.Parent;
		const player = Players.GetPlayerFromCharacter(character);

		if (player) {
			shopRemote.FireClient(player);
		}
	});
}
