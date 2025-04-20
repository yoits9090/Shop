-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local MarketplaceService = _services.MarketplaceService
local Workspace = _services.Workspace
-- Simple logger function
local log = function(message)
	print(`[RevivePrompt] {message}`)
end
log("Starting RevivePrompt script")
-- Constants
local TEAM_REVIVE_PRODUCT_ID = 3261490620
local PROXIMITY_PROMPT_RANGE = 8
-- Map to track which players already have prompts
local deadPlayerPrompts = {}
-- Map to track cloned corpse models
local deadPlayerCorpses = {}
-- Ensure a folder for corpses exists
local corpsesFolder = Workspace:FindFirstChild("Corpses")
if not corpsesFolder then
	corpsesFolder = Instance.new("Folder")
	corpsesFolder.Name = "Corpses"
	corpsesFolder.Parent = Workspace
end
-- Function to create revive prompt on a player's character
local createRevivePrompt = function(player, character)
	-- Don't create if player already has a prompt
	local _player = player
	if deadPlayerPrompts[_player] ~= nil then
		return nil
	end
	local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
	if not humanoidRootPart then
		log(`No HumanoidRootPart found for {player.Name}'s character`)
		return nil
	end
	-- Create a proximity prompt
	local prompt = Instance.new("ProximityPrompt")
	prompt.ObjectText = player.Name
	prompt.ActionText = "Revive Teammate"
	prompt.HoldDuration = 1
	prompt.MaxActivationDistance = PROXIMITY_PROMPT_RANGE
	prompt.RequiresLineOfSight = false
	prompt.Enabled = true
	prompt.ClickablePrompt = true
	prompt.Parent = humanoidRootPart
	log(`Created revive prompt for {player.Name}`)
	-- Store the prompt reference
	local _player_1 = player
	deadPlayerPrompts[_player_1] = prompt
	-- Setup prompt triggered event
	prompt.Triggered:Connect(function(otherPlayer)
		-- Check if the player trying to revive is the same as the dead player
		if otherPlayer == player then
			log(`{player.Name} tried to revive themselves`)
			return nil
		end
		log(`{otherPlayer.Name} is attempting to revive {player.Name}`)
		-- Prompt the player to purchase the team revive product
		MarketplaceService:PromptProductPurchase(otherPlayer, TEAM_REVIVE_PRODUCT_ID)
	end)
end
-- Function to remove a player's revive prompt
local removeRevivePrompt = function(player)
	local _player = player
	local prompt = deadPlayerPrompts[_player]
	if prompt and prompt:IsDescendantOf(Workspace) then
		prompt:Destroy()
	end
	local _player_1 = player
	deadPlayerPrompts[_player_1] = nil
	-- Clean up cloned corpse
	local _player_2 = player
	local corpse = deadPlayerCorpses[_player_2]
	if corpse and corpse:IsDescendantOf(Workspace) then
		corpse:Destroy()
	end
	local _player_3 = player
	deadPlayerCorpses[_player_3] = nil
end
-- Function to handle player death
local onPlayerDied = function(player, character)
	-- Ensure character still exists before cloning
	if not character.Parent then
		log(`onPlayerDied: character removed before processing for {player.Name}, skipping`)
		return nil
	end
	-- Prevent duplicate corpse
	local _player = player
	if deadPlayerCorpses[_player] ~= nil then
		log(`onPlayerDied: corpse already exists for {player.Name}, skipping duplicate`)
		return nil
	end
	log(`Player {player.Name} died`)
	-- Attempt to clone the character safely
	local corpse
	local success = { pcall(function()
		corpse = character:Clone()
	end) }
	if not success or not corpse then
		log(`onPlayerDied: failed to clone character for {player.Name}`)
		return nil
	end
	corpse.Name = `Corpse_{player.UserId}`
	corpse.Parent = corpsesFolder
	local _player_1 = player
	local _corpse = corpse
	deadPlayerCorpses[_player_1] = _corpse
	-- Create revive prompt on the cloned corpse
	createRevivePrompt(player, corpse)
	-- NOTE: do not auto‑respawn here; prompt will handle revive
end
-- Setup death listener for players
local onPlayerAdded = function(player)
	-- Handle existing character
	local currentCharacter = player.Character
	if currentCharacter then
		local humanoid = currentCharacter:FindFirstChildOfClass("Humanoid")
		if humanoid then
			humanoid.Died:Connect(function()
				onPlayerDied(player, currentCharacter)
			end)
		end
	end
	-- Listen for future character spawns
	player.CharacterAdded:Connect(function(character)
		local humanoid = character:WaitForChild("Humanoid")
		humanoid.Died:Connect(function()
			onPlayerDied(player, character)
		end)
	end)
end
-- Attach to current and future players
Players.PlayerAdded:Connect(onPlayerAdded)
local _exp = Players:GetPlayers()
for _k, _v in _exp do
	onPlayerAdded(_v, _k - 1, _exp)
end
-- Handle players leaving
Players.PlayerRemoving:Connect(function(player)
	removeRevivePrompt(player)
end)
log("RevivePrompt script initialized and running")
