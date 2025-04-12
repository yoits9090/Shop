-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
-- ServiceFixSpeed.server.ts - Direct 2x speed enabler for gamepass owners
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local MarketplaceService = _services.MarketplaceService
-- This script runs on the server and enables 2x speed only for players with the 2x speed gamepass
print("[SpeedFix] Starting 2x speed fix script")
-- 2x Speed gamepass ID
local SPEED_GAMEPASS_ID = 1149964231
-- Function to check if a player owns the 2x speed gamepass and enable it if they do
local function checkAndEnable2xSpeed(player)
	-- Use pcall to safely check ownership
	local success, ownsGamepass = pcall(function()
		return MarketplaceService:UserOwnsGamePassAsync(player.UserId, SPEED_GAMEPASS_ID)
	end)
	if success and ownsGamepass then
		-- Set the attribute that tracks 2x speed ownership
		player:SetAttribute("Has2xSpeed", true)
		-- Apply to current character if it exists
		if player.Character then
			local humanoid = player.Character:FindFirstChildOfClass("Humanoid")
			if humanoid then
				-- Avoid applying multiple times
				local _value = player:GetAttribute("Speed2xApplied")
				if not (_value ~= 0 and _value == _value and _value ~= "" and _value) then
					player:SetAttribute("Speed2xApplied", true)
					humanoid.WalkSpeed *= 2
					print(`[SpeedFix] Applied 2x speed to {player.Name}'s character (base: {humanoid.WalkSpeed / 2} → {humanoid.WalkSpeed})`)
				end
			end
		end
		print(`[SpeedFix] Enabled 2x speed for {player.Name} (has gamepass)`)
	else
		-- Make sure 2x speed is disabled for players without the gamepass
		player:SetAttribute("Has2xSpeed", false)
		player:SetAttribute("Speed2xApplied", false)
		print(`[SpeedFix] 2x speed disabled for {player.Name} (no gamepass)`)
	end
end
-- Function to apply 2x speed to a character
local function apply2xSpeedToCharacter(player, character)
	-- Only apply if player has the attribute
	local _value = player:GetAttribute("Has2xSpeed")
	if _value ~= 0 and _value == _value and _value ~= "" and _value then
		local humanoid = character:WaitForChild("Humanoid")
		if not humanoid then
			return nil
		end
		-- Always apply the speed multiplier on each new character
		-- Store the original/base speed before modifying
		local baseSpeed = 16
		-- Set speed directly to the 2x value
		humanoid.WalkSpeed = baseSpeed * 2
		-- Mark as applied on this character instance
		player:SetAttribute("Speed2xApplied", true)
		print(`[SpeedFix] Applied 2x speed to {player.Name}'s character (base: {baseSpeed} → {humanoid.WalkSpeed})`)
	end
end
-- Check and enable 2x speed for all existing players
local _exp = Players:GetPlayers()
for _k, _v in _exp do
	checkAndEnable2xSpeed(_v, _k - 1, _exp)
end
-- Check and enable 2x speed for any new players who join
Players.PlayerAdded:Connect(checkAndEnable2xSpeed)
-- Monitor character respawns to ensure speed is applied every time
local _exp_1 = Players:GetPlayers()
-- ▼ ReadonlyArray.forEach ▼
local _callback = function(player)
	-- Set up for existing characters
	if player.Character then
		-- Reset the applied flag on each character creation
		player:SetAttribute("Speed2xApplied", false)
		apply2xSpeedToCharacter(player, player.Character)
	end
	-- Set up for future characters
	player.CharacterAdded:Connect(function(character)
		-- Reset the flag for each new character
		player:SetAttribute("Speed2xApplied", false)
		-- Verify that player still has the gamepass
		local success, ownsGamepass = pcall(function()
			return MarketplaceService:UserOwnsGamePassAsync(player.UserId, SPEED_GAMEPASS_ID)
		end)
		if success and ownsGamepass then
			-- Small delay to ensure humanoid is fully loaded and configured
			task.delay(0.5, function()
				apply2xSpeedToCharacter(player, character)
				print(`[SpeedFix] Applied 2x speed after respawn for {player.Name} (has gamepass)`)
			end)
		end
	end)
end
for _k, _v in _exp_1 do
	_callback(_v, _k - 1, _exp_1)
end
-- ▲ ReadonlyArray.forEach ▲
-- Also set up the same monitoring for new players
Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(function(character)
		-- Reset the flag for each new character
		player:SetAttribute("Speed2xApplied", false)
		-- Apply speed boost if player has the gamepass
		local _value = player:GetAttribute("Has2xSpeed")
		if _value ~= 0 and _value == _value and _value ~= "" and _value then
			task.delay(0.5, function()
				apply2xSpeedToCharacter(player, character)
			end)
		end
	end)
end)
print("[SpeedFix] 2x speed fix initialized and running")
-- No need to export anything
