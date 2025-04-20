// Detect ontouch part. in game.workshop called (ShopDetect), Fire a remote event.
const Players = game.GetService("Players");
const ReplicatedStorage = game.GetService("ReplicatedStorage");
const Workspace = game.GetService("Workspace");

// dont create remote event
// const shopRemote = new Instance("RemoteEvent");
// shopRemote.Name = "ShopDetected";
// shopRemote.Parent = ReplicatedStorage;

// Get or wait for the ShopOpen RemoteEvent in GameRemotes folder
const remotesFolder = ReplicatedStorage.WaitForChild("GameRemotes") as Folder;
const shopRemote = remotesFolder.WaitForChild("ShopOpen") as RemoteEvent;

// Locate ShopDetect part with debug
print("[OnTouch] Locating ShopDetect part...");
const shopModel = Workspace.FindFirstChild("workshop") as Model ?? Workspace.FindFirstChild("Workshop") as Model;
if (shopModel) {
    print("[OnTouch] Found workshop model at:", shopModel.GetFullName());
} else {
    print("[OnTouch] Workshop model not found, skipping direct child lookup");
}
let shopDetectPart = shopModel?.FindFirstChild("ShopDetect") as BasePart;
if (shopDetectPart) {
    print("[OnTouch] Found ShopDetect child of workshop at:", shopDetectPart.GetFullName());
} else {
    print("[OnTouch] ShopDetect not found under workshop, searching all descendants...");
    const fallbackPart = Workspace.GetDescendants().find(d => d.Name === "ShopDetect" && d.IsA("BasePart")) as BasePart;
    if (fallbackPart) {
        shopDetectPart = fallbackPart;
        print("[OnTouch] Fallback found ShopDetect at:", shopDetectPart.GetFullName());
    } else {
        warn("[OnTouch] ShopDetect part not found in Workspace");
    }
}

// Check if RemoteEvent exists
print("ShopOpen RemoteEvent loaded:", shopRemote.Name);

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
