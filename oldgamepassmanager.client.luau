local Gamepasses = {12345, 12345} -- GAMEPASS ID's HERE

local Player = game.Players.LocalPlayer
local MarketplaceService = game:GetService("MarketplaceService")

local GamepassFrame = script.Parent.GamepassesFrame
local SampleFrame = GamepassFrame.SampleFrame

local ToggleButton = script.Parent.ToggleButton

function toggleShopGUI()
	if GamepassFrame.Visible == false then
		GamepassFrame.Visible = true
		ToggleButton.Text = "Close"
	else
		GamepassFrame.Visible = false
		ToggleButton.Text = "Gamepass Shop"
	end
end

function setupGamepasses()
	for i = 1, #Gamepasses do
		local GamepassId = Gamepasses[i]
		local GamepassData = MarketplaceService:GetProductInfo(GamepassId, Enum.InfoType.GamePass)
		local GamepassPrice = GamepassData.PriceInRobux
		local GamepassIcon = GamepassData.IconImageAssetId
		
		local GamepassSlot = SampleFrame:Clone()
		local GamepassImage = GamepassSlot.GamepassImage
		local PurchaseButton = GamepassSlot.Purchase
		
		GamepassSlot.Parent = GamepassFrame
		GamepassSlot.Name = GamepassId
		
		PurchaseButton.Text = "Purchase  - $R " .. GamepassPrice
		GamepassImage.Image = "rbxassetid://" .. GamepassIcon
		
		PurchaseButton.MouseButton1Click:Connect(function()
			MarketplaceService:PromptGamePassPurchase(Player, GamepassId)
		end)
	end
	
	SampleFrame:Destroy()
end

ToggleButton.MouseButton1Click:Connect(function()
	toggleShopGUI()
end)

setupGamepasses()