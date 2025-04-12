-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local Players = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").Players
-- Get local player
local player = Players.LocalPlayer
local character = player.Character or (player.CharacterAdded:Wait())
local playerGui = player:WaitForChild("PlayerGui")
-- Function to hide shop UI if visible
local function hideShopIfVisible()
	local gamepassShop = playerGui:FindFirstChild("GamepassShop")
	if gamepassShop and gamepassShop.Enabled then
		print("[CloseShopOnDeath] Player died with shop open, closing shop UI")
		gamepassShop.Enabled = false
		-- If you have any tweens or animations for closing, you could trigger them here
		-- But in this case we'll just immediately hide it on death
	end
end
-- Handle current character
if character then
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if humanoid then
		humanoid.Died:Connect(function()
			hideShopIfVisible()
		end)
	end
end
-- Handle future respawns
player.CharacterAdded:Connect(function(newCharacter)
	local humanoid = newCharacter:WaitForChild("Humanoid")
	humanoid.Died:Connect(function()
		hideShopIfVisible()
	end)
end)
print("[CloseShopOnDeath] Script initialized")
