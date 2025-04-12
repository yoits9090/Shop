-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local MarketplaceService = _services.MarketplaceService
local Players = _services.Players
local ReplicatedStorage = _services.ReplicatedStorage
-- Simple logger function
local log = function(message)
	print(`[ProductFix] {message}`)
end
log("Starting product fix script")
-- Set up remote event for product purchase notification
local notifyRemote
local remoteFolder = ReplicatedStorage:FindFirstChild("GameRemotes")
if remoteFolder then
	notifyRemote = remoteFolder:FindFirstChild("NotifyPurchase")
	if not notifyRemote then
		notifyRemote = Instance.new("RemoteEvent")
		notifyRemote.Name = "NotifyPurchase"
		notifyRemote.Parent = remoteFolder
	end
	log("NotifyPurchase remote event found/created")
else
	log("GameRemotes folder not found")
	local folder = Instance.new("Folder")
	folder.Name = "GameRemotes"
	folder.Parent = ReplicatedStorage
	notifyRemote = Instance.new("RemoteEvent")
	notifyRemote.Name = "NotifyPurchase"
	notifyRemote.Parent = folder
	log("Created GameRemotes folder and NotifyPurchase remote")
end
-- Track processed receipts
local processedReceipts = {}
-- Product handler function
local processReceipt = function(receiptInfo)
	log(`Processing purchase: {receiptInfo.ProductId}, Receipt: {receiptInfo.PurchaseId}`)
	-- Prevent processing the same receipt multiple times
	local _purchaseId = receiptInfo.PurchaseId
	if processedReceipts[_purchaseId] ~= nil then
		log(`Receipt {receiptInfo.PurchaseId} already processed`)
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end
	-- Get player from receipt
	local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
	if not player then
		log(`Player not found for receipt {receiptInfo.PurchaseId}`)
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	-- Process product by ID
	local productId = receiptInfo.ProductId
	local productName = "Unknown Product"
	local success = false
	if productId == 3261484089 then
		-- Apply 3x extra lives benefit using the LivesManager system
		log(`Applying 3x extra lives to {player.Name}`)
		-- Use the AddExtraLives function if available
		local addLivesFunction = ReplicatedStorage:FindFirstChild("AddExtraLives")
		if addLivesFunction then
			-- Add three lives using the function provided by LivesManager
			addLivesFunction:Invoke(player, 3)
			log(`Used AddExtraLives function to add 3 lives to {player.Name}`)
		else
			-- Fallback if function not found
			log(`WARNING: AddExtraLives function not found - using direct attribute`)
			local _condition = player:GetAttribute("ExtraLives")
			if _condition == nil then
				_condition = 0
			end
			local currentLives = _condition
			player:SetAttribute("ExtraLives", currentLives + 3)
			log(`Added 3 extra lives to {player.Name}, total: {currentLives + 3}`)
			-- If player was dead (had the DeadPlayer tag), revive them
			local deadTag = player:FindFirstChild("DeadPlayer")
			if deadTag then
				deadTag:Destroy()
				-- Also remove any prevent respawn events
				local preventEvent = player:FindFirstChild("PreventAutoRespawn")
				if preventEvent then
					preventEvent:Destroy()
				end
				player:LoadCharacter()
				log(`Revived {player.Name} after adding lives`)
			end
		end
		productName = "3x Extra Lives"
		success = true
	elseif productId == 3261484228 then
		-- Apply revive benefit using the LivesManager revive system
		log(`Applying revive to {player.Name}`)
		-- Add one life to the player
		local addLivesFunction = ReplicatedStorage:FindFirstChild("AddExtraLives")
		if addLivesFunction then
			-- Add one life using the function provided by LivesManager
			addLivesFunction:Invoke(player, 1)
			log(`Used AddExtraLives function to add 1 life to {player.Name}`)
		else
			-- Fallback if function not found
			log(`WARNING: AddExtraLives function not found - using direct attribute`)
			local _condition = player:GetAttribute("ExtraLives")
			if _condition == nil then
				_condition = 0
			end
			local currentLives = _condition
			player:SetAttribute("ExtraLives", currentLives + 1)
			-- Check if player has DeadPlayer tag (is permanently dead)
			local deadTag = player:FindFirstChild("DeadPlayer")
			if deadTag then
				deadTag:Destroy()
				-- Also remove any prevent respawn events
				local preventEvent = player:FindFirstChild("PreventAutoRespawn")
				if preventEvent then
					preventEvent:Destroy()
				end
				player:LoadCharacter()
				log(`Revived dead player {player.Name} by removing DeadPlayer tag`)
			elseif not player.Character then
				-- Player has no character but wasn't marked as permanently dead
				log(`Player {player.Name} has no character, respawning`)
				player:LoadCharacter()
			end
		end
		-- Notify client side about revive
		local reviveEvent = ReplicatedStorage:FindFirstChild("RevivePlayer")
		if reviveEvent then
			reviveEvent:FireClient(player)
			log(`Notified client that player has been revived`)
		end
		productName = "Revive"
		success = true
	elseif productId == 3261490620 then
		-- Apply team revive benefit
		log(`Applying team revive benefit to {player.Name}`)
		-- Get all players in the game
		local playersInGame = Players:GetPlayers()
		-- Setup team revive parameters
		local reviveRadius = 50
		local reviveCount = 0
		-- Check if the player has a character
		if not player.Character or not player.Character.PrimaryPart then
			log(`Player {player.Name} has no character or PrimaryPart`)
			return Enum.ProductPurchaseDecision.NotProcessedYet
		end
		-- Get the position of the initiating player
		local initiatorPosition = player.Character.PrimaryPart.Position
		for _, teammate in playersInGame do
			-- Skip if it's the same player who initiated the team revive
			if teammate == player then
				continue
			end
			-- Check if teammate has a character
			if not teammate.Character then
				-- Teammate has no character, revive them
				log(`Reviving teammate {teammate.Name} who has no character`)
				teammate:LoadCharacter()
				reviveCount += 1
				continue
			end
			-- Check if teammate's character has a PrimaryPart to calculate distance
			if teammate.Character.PrimaryPart then
				local teammatePosition = teammate.Character.PrimaryPart.Position
				local distance = (teammatePosition - initiatorPosition).Magnitude
				-- Check if teammate is within revive radius
				if distance <= reviveRadius then
					-- Check if teammate is dead
					local humanoid = teammate.Character:FindFirstChildOfClass("Humanoid")
					if humanoid and humanoid.Health <= 0 then
						-- Teammate is dead and within radius, revive them
						log(`Reviving dead teammate {teammate.Name} within {reviveRadius} radius`)
						teammate:LoadCharacter()
						reviveCount += 1
					elseif humanoid then
						-- Teammate is not dead but within radius, heal them
						log(`Healing teammate {teammate.Name} within {reviveRadius} radius`)
						humanoid.Health = humanoid.MaxHealth
						reviveCount += 1
					end
				end
			end
		end
		log(`Team revive applied by {player.Name}, revived/healed {reviveCount} teammates`)
		productName = "Team Revive"
		success = true
	else
		log(`Unknown product ID: {productId}`)
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	-- Notify player of successful purchase
	if success and notifyRemote then
		log(`Notifying {player.Name} of successful purchase: {productName}`)
		TS.try(function()
			notifyRemote:FireClient(player, "Product", productId)
		end, function(err)
			log(`Error sending notification: {err}`)
		end)
	end
	-- Mark receipt as processed
	local _purchaseId_1 = receiptInfo.PurchaseId
	processedReceipts[_purchaseId_1] = true
	log(`Product purchase complete: {productName} for {player.Name}`)
	return Enum.ProductPurchaseDecision.PurchaseGranted
end
-- Register the receipt processor
MarketplaceService.ProcessReceipt = processReceipt
log("Product fix initialized and running")
