-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local ReplicatedStorage = _services.ReplicatedStorage
-- Simple logger function
local log = function(message)
	print(`[LivesManager-Server] {message}`)
end
log("Starting LivesManager server script")
-- Constants
local DEFAULT_LIVES = 0
-- Create remote events for client-server communication
local noLivesRemoteEvent = Instance.new("RemoteEvent")
noLivesRemoteEvent.Name = "NoLivesRemaining"
noLivesRemoteEvent.Parent = ReplicatedStorage
-- Create RevivePlayer remote event if it doesn't exist
local revivePlayerEvent = ReplicatedStorage:FindFirstChild("RevivePlayer")
if not revivePlayerEvent then
	revivePlayerEvent = Instance.new("RemoteEvent")
	revivePlayerEvent.Name = "RevivePlayer"
	revivePlayerEvent.Parent = ReplicatedStorage
	log("Created RevivePlayer RemoteEvent")
end
-- Create TeammateRevive remote event if it doesn't exist
local teammateReviveEvent = ReplicatedStorage:FindFirstChild("TeammateRevive")
if not teammateReviveEvent then
	teammateReviveEvent = Instance.new("RemoteEvent")
	teammateReviveEvent.Name = "TeammateRevive"
	teammateReviveEvent.Parent = ReplicatedStorage
	log("Created TeammateRevive RemoteEvent")
end
-- Function to handle respawn prevention
local createRespawnPreventer = function()
	-- Create a folder to store our system events
	local livesManagerFolder = Instance.new("Folder")
	livesManagerFolder.Name = "LivesManagerSystem"
	livesManagerFolder.Parent = ReplicatedStorage
	return livesManagerFolder
end
-- Create our system folder
createRespawnPreventer()
-- Function to initialize a player's lives
local initializePlayerLives = function(player)
	-- Only set if not already set (to avoid overriding existing data)
	if player:GetAttribute("ExtraLives") == nil then
		player:SetAttribute("ExtraLives", DEFAULT_LIVES)
		log(`Initialized {player.Name} with {DEFAULT_LIVES} lives`)
	else
		local lives = player:GetAttribute("ExtraLives")
		log(`{player.Name} already has {lives} lives`)
	end
end
-- Function to handle player death
local handlePlayerDeath = function(player)
	local _condition = player:GetAttribute("ExtraLives")
	if _condition == nil then
		_condition = 0
	end
	local lives = _condition
	if lives > 0 then
		-- Decrement lives
		player:SetAttribute("ExtraLives", lives - 1)
		log(`{player.Name} died, {lives - 1} lives remaining`)
	else
		-- No lives left
		log(`{player.Name} died with no extra lives remaining`)
		-- Notify the client they have no lives remaining
		noLivesRemoteEvent:FireClient(player)
		-- Create a DeadPlayer tag to mark dead players
		local deadTag = Instance.new("BoolValue")
		deadTag.Name = "DeadPlayer"
		deadTag.Value = true
		deadTag.Parent = player
		-- Prevent respawn by intercepting the LoadCharacter call
		-- We'll use a special event to handle this on the client side
		local preventRespawnEvent = Instance.new("RemoteEvent")
		preventRespawnEvent.Name = "PreventAutoRespawn"
		preventRespawnEvent.Parent = player
		preventRespawnEvent:FireClient(player)
		-- Kill the current character if it exists
		if player.Character then
			local humanoid = player.Character:FindFirstChildOfClass("Humanoid")
			if humanoid and humanoid.Health > 0 then
				humanoid.Health = 0
			end
		end
		log(`Prevented respawn for {player.Name} - out of lives`)
	end
end
-- Function to allow a player to respawn
local allowPlayerRespawn = function(player)
	-- Remove DeadPlayer tag
	local deadTag = player:FindFirstChild("DeadPlayer")
	if deadTag then
		deadTag:Destroy()
	end
	-- Remove PreventAutoRespawn event
	local preventEvent = player:FindFirstChild("PreventAutoRespawn")
	if preventEvent then
		preventEvent:Destroy()
	end
	-- Set the allow respawn flag
	player:SetAttribute("AllowRespawn", true)
	-- Force respawn
	log(`Allowing {player.Name} to respawn`)
	player:LoadCharacter()
end
-- Function to add extra lives to a player
local addExtraLives = function(player, amount)
	local _condition = player:GetAttribute("ExtraLives")
	if _condition == nil then
		_condition = 0
	end
	local currentLives = _condition
	local newLives = currentLives + amount
	player:SetAttribute("ExtraLives", newLives)
	log(`Added {amount} lives to {player.Name} - now has {newLives}`)
	-- If player was dead (had the DeadPlayer tag), revive them
	if player:FindFirstChild("DeadPlayer") then
		allowPlayerRespawn(player)
		log(`Revived {player.Name} after adding lives`)
	end
end
-- Create a BindableFunction that other scripts can use to add lives
local addLivesFunction = Instance.new("BindableFunction")
addLivesFunction.Name = "AddExtraLives"
addLivesFunction.Parent = ReplicatedStorage
-- Type-safe approach to handle OnInvoke with proper typings
addLivesFunction.OnInvoke = function(player, amount)
	if player and amount ~= nil then
		addExtraLives(player, amount)
		return true
	end
	return false
end
-- Handle revive product purchases
revivePlayerEvent.OnServerEvent:Connect(function(player)
	if player:FindFirstChild("DeadPlayer") then
		-- This is a player trying to use a revive product
		addExtraLives(player, 1)
		log(`{player.Name} used a revive product`)
	end
end)
-- Create a RemoteFunction for other scripts to check if a player can be revived
local canReviveFunction = Instance.new("RemoteFunction")
canReviveFunction.Name = "CanRevivePlayer"
canReviveFunction.Parent = ReplicatedStorage
-- Set up the function for checking if player can be revived
local canRevivePlayer = function(player, targetPlayerName)
	-- Find the target player
	local _exp = Players:GetPlayers()
	-- ▼ ReadonlyArray.find ▼
	local _callback = function(p)
		return p.Name == targetPlayerName
	end
	local _result
	for _i, _v in _exp do
		if _callback(_v, _i - 1, _exp) == true then
			_result = _v
			break
		end
	end
	-- ▲ ReadonlyArray.find ▲
	local targetPlayer = _result
	if not targetPlayer then
		return false
	end
	-- Check if the target player is dead
	return targetPlayer:FindFirstChild("DeadPlayer") ~= nil
end
-- Use type assertion to define the correct signature
canReviveFunction.OnServerInvoke = canRevivePlayer
-- Handle teammate revive
-- Handle teammate revive with simplified implementation
teammateReviveEvent.OnServerEvent:Connect(function(player)
	-- Skip revive if no player
	if not player then
		return nil
	end
	-- Function to find dead players nearby
	local findDeadTeammates = function()
		-- Get all players
		local allPlayers = Players:GetPlayers()
		-- Get players that are dead (have DeadPlayer tag)
		-- ▼ ReadonlyArray.filter ▼
		local _newValue = {}
		local _callback = function(p)
			return p ~= player and p:FindFirstChild("DeadPlayer") ~= nil
		end
		local _length = 0
		for _k, _v in allPlayers do
			if _callback(_v, _k - 1, allPlayers) == true then
				_length += 1
				_newValue[_length] = _v
			end
		end
		-- ▲ ReadonlyArray.filter ▲
		return _newValue
	end
	-- Find players who can be revived
	local revivablePlayers = findDeadTeammates()
	if #revivablePlayers == 0 then
		log(`No dead teammates found for {player.Name} to revive`)
		return nil
	end
	-- Get the first dead player (prioritizing nearby ones)
	local targetPlayer = revivablePlayers[1]
	-- Revive the target player
	addExtraLives(targetPlayer, 1)
	log(`{player.Name} revived teammate {targetPlayer.Name}`)
end)
-- Process existing players
local _exp = Players:GetPlayers()
-- ▼ ReadonlyArray.forEach ▼
local _callback = function(player)
	initializePlayerLives(player)
	-- Remove any existing DeadPlayer tag in case of script reloading
	local existingDeadTag = player:FindFirstChild("DeadPlayer")
	if existingDeadTag then
		existingDeadTag:Destroy()
	end
	-- Remove any existing prevention events
	local existingPreventEvent = player:FindFirstChild("PreventAutoRespawn")
	if existingPreventEvent then
		existingPreventEvent:Destroy()
	end
	-- Handle character death for existing player
	if player.Character then
		local humanoid = player.Character:FindFirstChildOfClass("Humanoid")
		if humanoid then
			humanoid.Died:Connect(function()
				handlePlayerDeath(player)
			end)
		end
	end
	-- Handle character respawn
	player.CharacterAdded:Connect(function(character)
		local humanoid = character:WaitForChild("Humanoid")
		humanoid.Died:Connect(function()
			handlePlayerDeath(player)
		end)
	end)
end
for _k, _v in _exp do
	_callback(_v, _k - 1, _exp)
end
-- ▲ ReadonlyArray.forEach ▲
-- Handle new players
Players.PlayerAdded:Connect(function(player)
	initializePlayerLives(player)
	-- Handle character spawning
	player.CharacterAdded:Connect(function(character)
		local humanoid = character:WaitForChild("Humanoid")
		humanoid.Died:Connect(function()
			handlePlayerDeath(player)
		end)
	end)
end)
-- Create a more robust respawn prevention system
local setupRespawnPrevention = function()
	-- Create a RemoteFunction to handle respawn requests
	local respawnFunction = Instance.new("RemoteFunction")
	respawnFunction.Name = "RespawnFunction"
	respawnFunction.Parent = ReplicatedStorage
	-- Handle respawn request from client
	respawnFunction.OnServerInvoke = function(player)
		-- Only allow respawn if player has the AllowRespawn attribute set to true
		local _condition = player:GetAttribute("AllowRespawn")
		if _condition == nil then
			_condition = true
		end
		local allowRespawn = _condition
		if not allowRespawn then
			log(`Blocked respawn request from {player.Name} - no lives remaining`)
			-- Re-notify client
			noLivesRemoteEvent:FireClient(player)
			return false
		end
		return true
	end
	-- Create a monitoring system that constantly checks for unauthorized respawns
	task.spawn(function()
		while true do
			-- Check all players
			local _exp_1 = Players:GetPlayers()
			-- ▼ ReadonlyArray.forEach ▼
			local _callback_1 = function(player)
				-- Get the allow respawn flag
				local allowRespawn = player:GetAttribute("AllowRespawn")
				-- If respawn is not allowed but player has a character, destroy it
				if allowRespawn == false and player.Character then
					log(`Destroying unauthorized character for {player.Name}`)
					player.Character:Destroy()
					-- Re-notify client
					noLivesRemoteEvent:FireClient(player)
					-- Create/update DeadPlayer tag
					if not player:FindFirstChild("DeadPlayer") then
						local deadTag = Instance.new("BoolValue")
						deadTag.Name = "DeadPlayer"
						deadTag.Value = true
						deadTag.Parent = player
					end
				end
			end
			for _k, _v in _exp_1 do
				_callback_1(_v, _k - 1, _exp_1)
			end
			-- ▲ ReadonlyArray.forEach ▲
			task.wait(0.5)
		end
	end)
end
-- Start the respawn prevention system
setupRespawnPrevention()
-- Set up handlers for each player to manage respawn prevention
local setupPlayerRespawnPrevention = function(player)
	-- Make sure player has the AllowRespawn attribute
	if player:GetAttribute("AllowRespawn") == nil then
		player:SetAttribute("AllowRespawn", true)
	end
	-- Handle character added
	player.CharacterAdded:Connect(function(character)
		-- If respawn is not allowed, destroy the character
		local _condition = player:GetAttribute("AllowRespawn")
		if _condition == nil then
			_condition = true
		end
		local allowRespawn = _condition
		if not allowRespawn then
			log(`Destroying character for {player.Name} - respawn not allowed`)
			task.delay(0.1, function()
				character:Destroy()
			end)
		end
	end)
end
-- Set up for all current players
local _exp_1 = Players:GetPlayers()
for _k, _v in _exp_1 do
	setupPlayerRespawnPrevention(_v, _k - 1, _exp_1)
end
-- Set up for new players
Players.PlayerAdded:Connect(setupPlayerRespawnPrevention)
-- Handle players leaving
Players.PlayerRemoving:Connect(function(player)
	log(`{player.Name} is leaving the game`)
end)
log("LivesManager server script initialized")
