-- Compiled with roblox-ts v3.0.0
-- Detect ontouch part. in game.workshop called (ShopDetect), Fire a remote event.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")
-- dont create remote event
-- const shopRemote = new Instance("RemoteEvent");
-- shopRemote.Name = "ShopDetected";
-- shopRemote.Parent = ReplicatedStorage;
-- Get or wait for the ShopOpen RemoteEvent in GameRemotes folder
local remotesFolder = ReplicatedStorage:WaitForChild("GameRemotes")
local shopRemote = remotesFolder:WaitForChild("ShopOpen")
-- Locate ShopDetect part with debug
print("[OnTouch] Locating ShopDetect part...")
local shopModel = Workspace:FindFirstChild("workshop") or Workspace:FindFirstChild("Workshop")
if shopModel then
	print("[OnTouch] Found workshop model at:", shopModel:GetFullName())
else
	print("[OnTouch] Workshop model not found, skipping direct child lookup")
end
local _result = shopModel
if _result ~= nil then
	_result = _result:FindFirstChild("ShopDetect")
end
local shopDetectPart = _result
if shopDetectPart then
	print("[OnTouch] Found ShopDetect child of workshop at:", shopDetectPart:GetFullName())
else
	print("[OnTouch] ShopDetect not found under workshop, searching all descendants...")
	local _exp = Workspace:GetDescendants()
	-- ▼ ReadonlyArray.find ▼
	local _callback = function(d)
		return d.Name == "ShopDetect" and d:IsA("BasePart")
	end
	local _result_1
	for _i, _v in _exp do
		if _callback(_v, _i - 1, _exp) == true then
			_result_1 = _v
			break
		end
	end
	-- ▲ ReadonlyArray.find ▲
	local fallbackPart = _result_1
	if fallbackPart then
		shopDetectPart = fallbackPart
		print("[OnTouch] Fallback found ShopDetect at:", shopDetectPart:GetFullName())
	else
		warn("[OnTouch] ShopDetect part not found in Workspace")
	end
end
-- Check if RemoteEvent exists
print("ShopOpen RemoteEvent loaded:", shopRemote.Name)
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
