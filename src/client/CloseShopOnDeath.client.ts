import { Players } from "@rbxts/services";

// Get local player
const player = Players.LocalPlayer;
const character = player.Character || player.CharacterAdded.Wait()[0];
const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;

// Function to hide shop UI if visible
function hideShopIfVisible() {
    const gamepassShop = playerGui.FindFirstChild("GamepassShop") as ScreenGui | undefined;
    if (gamepassShop && gamepassShop.Enabled) {
        print("[CloseShopOnDeath] Player died with shop open, closing shop UI");
        gamepassShop.Enabled = false;
        
        // If you have any tweens or animations for closing, you could trigger them here
        // But in this case we'll just immediately hide it on death
    }
}

// Handle current character
if (character) {
    const humanoid = character.FindFirstChildOfClass("Humanoid");
    if (humanoid) {
        humanoid.Died.Connect(() => {
            hideShopIfVisible();
        });
    }
}

// Handle future respawns
player.CharacterAdded.Connect((newCharacter) => {
    const humanoid = newCharacter.WaitForChild("Humanoid") as Humanoid;
    
    humanoid.Died.Connect(() => {
        hideShopIfVisible();
    });
});

print("[CloseShopOnDeath] Script initialized");
