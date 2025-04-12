-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local Players = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").Players
-- Simple logger function
local log = function(message)
	print(`[RegenerationService] {message}`)
end
log("Starting RegenerationService")
-- Constants
local REGENERATION_GAMEPASS_ID = 1150966154
local REGEN_RATE = 1
local REGEN_INTERVAL = 1
-- Keep track of which players have regeneration
local playersWithRegen = {}
-- Check if a player has the regeneration gamepass
local hasRegenerationGamepass = function(player)
	-- First check our cache
	local _player = player
	if playersWithRegen[_player] ~= nil then
		local _player_1 = player
		return playersWithRegen[_player_1]
	end
	-- Otherwise, check their gamepass and cache the result
	local ownsPass = false
	TS.try(function()
		ownsPass = game:GetService("MarketplaceService"):UserOwnsGamePassAsync(player.UserId, REGENERATION_GAMEPASS_ID)
		-- Cache the result
		local _player_1 = player
		local _ownsPass = ownsPass
		playersWithRegen[_player_1] = _ownsPass
		if ownsPass then
			log(`{player.Name} has the regeneration gamepass`)
		else
			log(`{player.Name} does not have the regeneration gamepass`)
		end
	end, function(err)
		warn(`Error checking regeneration gamepass for {player.Name}: {err}`)
	end)
	return ownsPass
end
-- Update a player's regeneration status
local updateRegenerationStatus = function(player)
	local hasPass = hasRegenerationGamepass(player)
	local _player = player
	playersWithRegen[_player] = hasPass
	-- Set an attribute on the player so other scripts can check
	player:SetAttribute("HasRegeneration", hasPass)
	log(`Updated regeneration status for {player.Name}: {hasPass}`)
end
-- Setup regeneration for a player
local setupPlayerRegeneration = function(player)
	-- Check if they have the gamepass
	updateRegenerationStatus(player)
	-- Listen for character added events
	player.CharacterAdded:Connect(function(character)
		-- Disable natural regeneration for all players (we'll handle it manually)
		local humanoid = character:WaitForChild("Humanoid")
		humanoid.Health = humanoid.Health
		-- We'll handle regeneration in the heartbeat function
	end)
end
-- Function to apply regeneration to eligible players
local applyRegeneration = function()
	local _exp = Players:GetPlayers()
	-- ▼ ReadonlyArray.forEach ▼
	local _callback = function(player)
		-- Skip players without the gamepass
		local _player = player
		if not playersWithRegen[_player] then
			return nil
		end
		-- Skip players with no character
		if not player.Character then
			return nil
		end
		local humanoid = player.Character:FindFirstChildOfClass("Humanoid")
		if not humanoid then
			return nil
		end
		-- Skip dead players
		if humanoid.Health <= 0 then
			return nil
		end
		-- Skip players at max health
		if humanoid.Health >= humanoid.MaxHealth then
			return nil
		end
		-- Apply regeneration
		local newHealth = math.min(humanoid.Health + REGEN_RATE, humanoid.MaxHealth)
		humanoid.Health = newHealth
	end
	for _k, _v in _exp do
		_callback(_v, _k - 1, _exp)
	end
	-- ▲ ReadonlyArray.forEach ▲
end
-- Setup existing players
local _exp = Players:GetPlayers()
for _k, _v in _exp do
	setupPlayerRegeneration(_v, _k - 1, _exp)
end
-- Setup new players
Players.PlayerAdded:Connect(setupPlayerRegeneration)
-- Remove players from our map when they leave
Players.PlayerRemoving:Connect(function(player)
	local _player = player
	playersWithRegen[_player] = nil
	log(`Removed {player.Name} from regeneration tracking`)
end)
-- Run the regeneration on an interval
local startRegenerationLoop = function()
	while true do
		applyRegeneration()
		task.wait(REGEN_INTERVAL)
	end
end
-- Start the regeneration loop
task.spawn(startRegenerationLoop)
log("RegenerationService initialized")
