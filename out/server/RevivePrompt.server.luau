-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local MarketplaceService = _services.MarketplaceService
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
	if prompt and prompt:IsDescendantOf(game) then
		prompt:Destroy()
		log(`Removed revive prompt for {player.Name}`)
	end
	local _player_1 = player
	deadPlayerPrompts[_player_1] = nil
end
-- Function to handle player death
local onPlayerDied = function(player, character)
	log(`Player {player.Name} died`)
	createRevivePrompt(player, character)
	-- When character is removed, also remove the prompt
	character.AncestryChanged:Connect(function(_, parent)
		if not parent then
			removeRevivePrompt(player)
		end
	end)
end
-- Handle existing players
local _exp = Players:GetPlayers()
-- ▼ ReadonlyArray.forEach ▼
local _callback = function(player)
	if player.Character then
		-- Get the humanoid to check if the player is already dead
		local humanoid = player.Character:FindFirstChildOfClass("Humanoid")
		if humanoid and humanoid.Health <= 0 then
			onPlayerDied(player, player.Character)
		end
		-- Connect to death event
		humanoid.Died:Connect(function()
			onPlayerDied(player, player.Character)
		end)
	end
	-- Listen for new characters (respawns)
	player.CharacterAdded:Connect(function(character)
		-- Remove any existing prompts when player respawns
		removeRevivePrompt(player)
		-- Connect to the new character's humanoid died event
		local humanoid = character:WaitForChild("Humanoid")
		humanoid.Died:Connect(function()
			onPlayerDied(player, character)
		end)
	end)
end
for _k, _v in _exp do
	_callback(_v, _k - 1, _exp)
end
-- ▲ ReadonlyArray.forEach ▲
-- Handle new players
Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(function(character)
		-- Connect to humanoid died event
		local humanoid = character:WaitForChild("Humanoid")
		humanoid.Died:Connect(function()
			onPlayerDied(player, character)
		end)
	end)
end)
-- Handle players leaving
Players.PlayerRemoving:Connect(function(player)
	removeRevivePrompt(player)
end)
log("RevivePrompt script initialized and running")
