// Define product IDs here
const Gamepasses = [1150966154, 1155692418, 1151894037, 1149964231]; // regeneration , 2x health, sprint, 2x speed
const DevProducts = [3261484089, 3261484228, 3261490620]; // 3x extra lives, Revive, Revive your teammates

print("[ShopManager] Script starting");

const Players = game.GetService("Players");
const MarketplaceService = game.GetService("MarketplaceService");

const player = Players.LocalPlayer;
print("[ShopManager] Player found:", player.Name);

const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;
print("[ShopManager] PlayerGui found");

const gamepassShop = playerGui.WaitForChild("GamepassShop") as ScreenGui;
print("[ShopManager] GamepassShop ScreenGui found");

const gamepassesFrame = gamepassShop.WaitForChild("GamepassesFrame") as Frame;
print("[ShopManager] GamepassesFrame found");

const sampleFrame = gamepassesFrame.WaitForChild("SampleFrame") as Frame;
print("[ShopManager] SampleFrame found");

// No toggle button in this UI structure

// Make the sample frame initially invisible
sampleFrame.Visible = false;

/**
 * Set up the gamepass shop UI
 */
function setupGamepasses(): void {
	print("[ShopManager] Setting up gamepasses, count:", Gamepasses.size());
	// In roblox-ts, arrays are actually special objects
	Gamepasses.forEach((gamepassId) => {
		print("[ShopManager] Setting up gamepass ID:", gamepassId);
		const gamepassInfo = MarketplaceService.GetProductInfo(gamepassId, Enum.InfoType.GamePass);
		const gamepassPrice = gamepassInfo.PriceInRobux;
		const gamepassIcon = gamepassInfo.IconImageAssetId;

		// Clone the sample frame
		const gamepassSlot = sampleFrame.Clone() as Frame;
		const gamepassImage = gamepassSlot.FindFirstChild("GamepassImage") as ImageLabel;
		const purchaseButton = gamepassSlot.FindFirstChild("Purchase") as TextButton;

		// Configure and show the gamepass slot
		gamepassSlot.Parent = gamepassesFrame;
		gamepassSlot.Name = `${gamepassId}`;
		gamepassSlot.Visible = true;

		// Update the UI elements
		purchaseButton.Text = `Purchase - $R ${gamepassPrice}`;
		gamepassImage.Image = `rbxassetid://${gamepassIcon}`;
		print("[ShopManager] Gamepass setup complete for ID:", gamepassId, "Price:", gamepassPrice);

		// Connect purchase button click
		purchaseButton.MouseButton1Click.Connect(() => {
			MarketplaceService.PromptGamePassPurchase(player, gamepassId);
		});
	});
}

/**
 * Set up the shop with both gamepasses and developer products
 */
function setupShop(): void {
	print("[ShopManager] Setting up complete shop");
	// Set up gamepasses
	setupGamepasses();

	// Set up developer products
	print("[ShopManager] Setting up developer products, count:", DevProducts.size());
	DevProducts.forEach((productId) => {
		print("[ShopManager] Setting up developer product ID:", productId);
		const productInfo = MarketplaceService.GetProductInfo(productId, Enum.InfoType.Product);
		const price = productInfo.PriceInRobux;
		const icon = productInfo.IconImageAssetId;

		// Clone the sample frame
		const productSlot = sampleFrame.Clone() as Frame;
		const productImage = productSlot.FindFirstChild("GamepassImage") as ImageLabel;
		const purchaseButton = productSlot.FindFirstChild("Purchase") as TextButton;

		// Configure and show the product slot
		productSlot.Parent = gamepassesFrame;
		productSlot.Name = `DP_${productId}`;
		productSlot.Visible = true;

		// Update the UI elements
		purchaseButton.Text = `Product - $R ${price}`;
		productImage.Image = `rbxassetid://${icon}`;

		// Connect purchase button click
		purchaseButton.MouseButton1Click.Connect(() => {
			MarketplaceService.PromptProductPurchase(player, productId);
		});
	});
}

print("[ShopManager] Starting shop setup process");
// Setup the shop with both gamepasses and developer products when script loads
setupShop();
print("[ShopManager] Shop setup complete");
