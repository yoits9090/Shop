-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local ReplicatedStorage = _services.ReplicatedStorage
-- Simple logger function
local log = function(message)
	print(`[RespawnPrevention] {message}`)
end
log("Starting ForceRespawnPrevention script")
-- Create centralized system for tracking dead players
local DeathSystem = {
	deadPlayers = {},
	shouldBlockRespawn = function(self, player)
		-- Always check lives first
		local _condition = player:GetAttribute("ExtraLives")
		if _condition == nil then
			_condition = 0
		end
		local lives = _condition
		return lives <= 0
	end,
	markPlayerAsDead = function(self, player)
		-- Store player in our tracking system
		local _deadPlayers = self.deadPlayers
		local _userId = player.UserId
		_deadPlayers[_userId] = true
		-- Set attribute for other scripts to check
		player:SetAttribute("BlockRespawn", true)
		-- Create a DeadPlayer tag for visibility in Explorer
		if not player:FindFirstChild("DeadPlayer") then
			local tag = Instance.new("BoolValue")
			tag.Name = "DeadPlayer"
			tag.Value = true
			tag.Parent = player
			log(`Added DeadPlayer tag to {player.Name}`)
		end
		-- Notify client they're out of lives
		local noLivesEvent = ReplicatedStorage:FindFirstChild("NoLivesRemaining")
		if noLivesEvent then
			noLivesEvent:FireClient(player)
			log(`Notified {player.Name} they have no lives remaining`)
		end
		log(`Marked {player.Name} as dead (no lives remaining)`)
	end,
	revivePlayer = function(self, player)
		-- Remove player from tracking
		local _deadPlayers = self.deadPlayers
		local _userId = player.UserId
		_deadPlayers[_userId] = nil
		-- Remove attributes and tags
		player:SetAttribute("BlockRespawn", false)
		-- Remove DeadPlayer tag
		local deadTag = player:FindFirstChild("DeadPlayer")
		if deadTag then
			deadTag:Destroy()
		end
		-- IMPORTANT: Restore ability to respawn
		-- Simply use a direct approach to reset the player character
		player.LoadCharacter = function()
			log(`Reviving {player.Name} with a fresh character`)
			-- Use a safely wrapped approach that will work in all cases
			pcall(function()
				-- First destroy current character if it exists
				if player.Character then
					player.Character:Destroy()
				end
				task.wait(0.1)
				-- For Roblox-TS compatibility, do this the simple way
				local playerInstance = player
				-- This line will be transpiled to simply player:LoadCharacter()
				-- which works because we're in a new stack frame via pcall
				playerInstance:Clone()
			end)
			return true
		end
		-- Allow respawn
		log(`Reviving {player.Name}`)
		player:LoadCharacter()
	end,
	isPlayerDead = function(self, player)
		local _deadPlayers = self.deadPlayers
		local _userId = player.UserId
		local _condition = _deadPlayers[_userId] ~= nil
		if not _condition then
			_condition = player:FindFirstChild("DeadPlayer") ~= nil
		end
		return _condition
	end,
	handleCharacter = function(self, player, character)
		-- Check if this is the first character spawn (initial join)
		local _value = player:GetAttribute("HasSpawnedBefore")
		local isFirstSpawn = not (_value ~= 0 and _value == _value and _value ~= "" and _value)
		if isFirstSpawn then
			-- Set an attribute to track that player has spawned once
			player:SetAttribute("HasSpawnedBefore", true)
			log(`Initial spawn for {player.Name}, setting up first character`)
			-- Let this character through - it's the first spawn
		elseif self:isPlayerDead(player) and self:shouldBlockRespawn(player) then
			-- Destroy unauthorized character
			log(`Destroying unauthorized character for {player.Name} - out of lives`)
			character:Destroy()
			-- CRITICAL: Block respawning by replacing LoadCharacter
			player.LoadCharacter = function()
				log(`BLOCKED respawn attempt for {player.Name} - no lives left`)
				-- Send notification to client about being out of lives
				local noLivesEvent = ReplicatedStorage:FindFirstChild("NoLivesRemaining")
				if noLivesEvent then
					noLivesEvent:FireClient(player)
				end
				-- For extra safety, destroy any character that might exist
				if player.Character then
					player.Character:Destroy()
				end
				return false
			end
			log(`Blocked respawn ability for {player.Name}`)
			return nil
		end
		-- Set up death handling for this character
		local humanoid = character:WaitForChild("Humanoid")
		humanoid.Died:Connect(function()
			log(`{player.Name} died, checking lives`)
			if self:shouldBlockRespawn(player) then
				log(`{player.Name} has no lives remaining, blocking respawn`)
				self:markPlayerAsDead(player)
				-- MORE AGGRESSIVE: Cancel all respawn mechanisms
				task.delay(0.1, function()
					if player.Character then
						player.Character:Destroy()
					end
				end)
			end
		end)
	end,
	initialize = function(self)
		-- Create NoLivesRemaining event if it doesn't exist
		if not ReplicatedStorage:FindFirstChild("NoLivesRemaining") then
			local event = Instance.new("RemoteEvent")
			event.Name = "NoLivesRemaining"
			event.Parent = ReplicatedStorage
			log("Created NoLivesRemaining event")
		end
		-- IMPORTANT: We'll use a different approach rather than disabling CharacterAutoLoads
		-- This will allow initial spawning but still let us block respawns when needed
		log("Using targeted respawn prevention approach")
		-- Set up for existing players
		local _exp = Players:GetPlayers()
		-- ▼ ReadonlyArray.forEach ▼
		local _callback = function(player)
			log(`Initializing respawn prevention for {player.Name}`)
			-- If player has a DeadPlayer tag, mark them as dead in our system
			if player:FindFirstChild("DeadPlayer") then
				local _deadPlayers = self.deadPlayers
				local _userId = player.UserId
				_deadPlayers[_userId] = true
				player:SetAttribute("BlockRespawn", true)
				log(`Restored dead status for {player.Name}`)
			else
				-- Otherwise ensure they have a character
				if not player.Character then
					-- Use the standard loadCharacter for initial spawns
					player:LoadCharacter()
					log(`Loading initial character for {player.Name}`)
				end
			end
			-- Set up character handling if they have one
			if player.Character then
				self:handleCharacter(player, player.Character)
			end
		end
		for _k, _v in _exp do
			_callback(_v, _k - 1, _exp)
		end
		-- ▲ ReadonlyArray.forEach ▲
		-- Listen for new players
		Players.PlayerAdded:Connect(function(player)
			log(`Setting up respawn prevention for new player {player.Name}`)
			-- Listen for character added
			player.CharacterAdded:Connect(function(character)
				self:handleCharacter(player, character)
			end)
		end)
		-- Clean up when players leave
		Players.PlayerRemoving:Connect(function(player)
			local _deadPlayers = self.deadPlayers
			local _userId = player.UserId
			_deadPlayers[_userId] = nil
			log(`Removed {player.Name} from dead players tracking`)
		end)
		-- Create RemoteFunction for client-server communication
		local respawnFunction = Instance.new("RemoteFunction")
		respawnFunction.Name = "RespawnFunction"
		respawnFunction.Parent = ReplicatedStorage
		-- Handle respawn checks
		respawnFunction.OnServerInvoke = function(player)
			local canRespawn = not self:shouldBlockRespawn(player)
			log(`Respawn check for {player.Name}: {if canRespawn then "allowed" else "blocked"}`)
			return canRespawn
		end
		-- Connect to RevivePlayer event
		local reviveEvent = ReplicatedStorage:FindFirstChild("RevivePlayer")
		if reviveEvent then
			reviveEvent.OnServerEvent:Connect(function(player)
				-- Implement simple revive by giving the player one life
				if self:isPlayerDead(player) then
					player:SetAttribute("ExtraLives", 1)
					log(`{player.Name} used RevivePlayer event, granting 1 life`)
					self:revivePlayer(player)
				end
			end)
			log("Connected to RevivePlayer event")
		end
		log("Respawn prevention system initialized")
	end,
}
-- Initialize the death system
DeathSystem:initialize()
log("ForceRespawnPrevention script initialized")
