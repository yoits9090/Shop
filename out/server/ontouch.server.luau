-- Compiled with roblox-ts v3.0.0
-- Detect ontouch part. in game.workshop called (ShopDetect), Fire a remote event.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")
-- dont create remote event
-- const shopRemote = new Instance("RemoteEvent");
-- shopRemote.Name = "ShopDetected";
-- shopRemote.Parent = ReplicatedStorage;
--finding remote event
local shopRemote = ReplicatedStorage:FindFirstChild("ShopOpen")
-- Get the shop detection part directly from Workspace
local shopDetectPart = Workspace:FindFirstChild("ShopDetect")
print("ShopDetect part found:", shopDetectPart ~= nil)
-- Check if RemoteEvent exists
print("ShopOpen RemoteEvent found:", shopRemote ~= nil)
-- Simple cooldown flag
local canFire = true
local COOLDOWN_TIME = 0.5
if shopDetectPart then
	print("Setting up touch detection for shop part")
	-- When player enters the shop area
	shopDetectPart.Touched:Connect(function(otherPart)
		-- Only process if not on cooldown
		if not canFire then
			return nil
		end
		local character = otherPart.Parent
		local player = Players:GetPlayerFromCharacter(character)
		if player then
			print("Player entered shop area")
			shopRemote:FireClient(player, true)
			-- Set cooldown
			canFire = false
			task.spawn(function()
				task.wait(COOLDOWN_TIME)
				canFire = true
			end)
		end
	end)
	-- When player leaves the shop area
	shopDetectPart.TouchEnded:Connect(function(otherPart)
		-- Only process if not on cooldown
		if not canFire then
			return nil
		end
		local character = otherPart.Parent
		local player = Players:GetPlayerFromCharacter(character)
		if player then
			print("Player left shop area")
			shopRemote:FireClient(player, false)
			-- Set cooldown
			canFire = false
			task.spawn(function()
				task.wait(COOLDOWN_TIME)
				canFire = true
			end)
		end
	end)
end
