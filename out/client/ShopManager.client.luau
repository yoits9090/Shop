-- Compiled with roblox-ts v3.0.0
-- Define product IDs here
local Gamepasses = { 1150966154, 1155692418, 1151894037, 1149964231 }
local DevProducts = { 3261484089, 3261484228, 3261490620 }
print("[ShopManager] Script starting")
local Players = game:GetService("Players")
local MarketplaceService = game:GetService("MarketplaceService")
local player = Players.LocalPlayer
print("[ShopManager] Player found:", player.Name)
local playerGui = player:WaitForChild("PlayerGui")
print("[ShopManager] PlayerGui found")
local gamepassShop = playerGui:WaitForChild("GamepassShop")
print("[ShopManager] GamepassShop ScreenGui found")
local gamepassesFrame = gamepassShop:WaitForChild("GamepassesFrame")
print("[ShopManager] GamepassesFrame found")
local sampleFrame = gamepassesFrame:WaitForChild("SampleFrame")
print("[ShopManager] SampleFrame found")
-- No toggle button in this UI structure
-- Make the sample frame initially invisible
sampleFrame.Visible = false
--[[
	*
	 * Set up the gamepass shop UI
	 
]]
local function setupGamepasses()
	print("[ShopManager] Setting up gamepasses, count:", #Gamepasses)
	-- In roblox-ts, arrays are actually special objects
	-- ▼ ReadonlyArray.forEach ▼
	local _callback = function(gamepassId)
		print("[ShopManager] Setting up gamepass ID:", gamepassId)
		local gamepassInfo = MarketplaceService:GetProductInfo(gamepassId, Enum.InfoType.GamePass)
		local gamepassPrice = gamepassInfo.PriceInRobux
		local gamepassIcon = gamepassInfo.IconImageAssetId
		-- Clone the sample frame
		local gamepassSlot = sampleFrame:Clone()
		local gamepassImage = gamepassSlot:FindFirstChild("GamepassImage")
		local purchaseButton = gamepassSlot:FindFirstChild("Purchase")
		-- Configure and show the gamepass slot
		gamepassSlot.Parent = gamepassesFrame
		gamepassSlot.Name = `{gamepassId}`
		gamepassSlot.Visible = true
		-- Update the UI elements
		purchaseButton.Text = `Purchase - $R {gamepassPrice}`
		gamepassImage.Image = `rbxassetid://{gamepassIcon}`
		print("[ShopManager] Gamepass setup complete for ID:", gamepassId, "Price:", gamepassPrice)
		-- Connect purchase button click
		purchaseButton.MouseButton1Click:Connect(function()
			MarketplaceService:PromptGamePassPurchase(player, gamepassId)
		end)
	end
	for _k, _v in Gamepasses do
		_callback(_v, _k - 1, Gamepasses)
	end
	-- ▲ ReadonlyArray.forEach ▲
end
--[[
	*
	 * Set up the shop with both gamepasses and developer products
	 
]]
local function setupShop()
	print("[ShopManager] Setting up complete shop")
	-- Set up gamepasses
	setupGamepasses()
	-- Set up developer products
	print("[ShopManager] Setting up developer products, count:", #DevProducts)
	-- ▼ ReadonlyArray.forEach ▼
	local _callback = function(productId)
		print("[ShopManager] Setting up developer product ID:", productId)
		local productInfo = MarketplaceService:GetProductInfo(productId, Enum.InfoType.Product)
		local price = productInfo.PriceInRobux
		local icon = productInfo.IconImageAssetId
		-- Clone the sample frame
		local productSlot = sampleFrame:Clone()
		local productImage = productSlot:FindFirstChild("GamepassImage")
		local purchaseButton = productSlot:FindFirstChild("Purchase")
		-- Configure and show the product slot
		productSlot.Parent = gamepassesFrame
		productSlot.Name = `DP_{productId}`
		productSlot.Visible = true
		-- Update the UI elements
		purchaseButton.Text = `Product - $R {price}`
		productImage.Image = `rbxassetid://{icon}`
		-- Connect purchase button click
		purchaseButton.MouseButton1Click:Connect(function()
			MarketplaceService:PromptProductPurchase(player, productId)
		end)
	end
	for _k, _v in DevProducts do
		_callback(_v, _k - 1, DevProducts)
	end
	-- ▲ ReadonlyArray.forEach ▲
end
print("[ShopManager] Starting shop setup process")
-- Setup the shop with both gamepasses and developer products when script loads
setupShop()
print("[ShopManager] Shop setup complete")
