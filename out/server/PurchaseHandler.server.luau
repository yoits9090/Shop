-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _core = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@flamework", "core", "out")
local Service = _core.Service
local Dependency = _core.Dependency
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local MarketplaceService = _services.MarketplaceService
local Players = _services.Players
-- Use a more descriptive logger
local log = function(level, message)
	-- Always print to console for debugging
	print(`[PurchaseProcessingService][{level}] {message}`)
end
-- Define the AbilitiesService interface for type safety
-- Define the ReceiptInfo interface based on Roblox documentation
local PurchaseProcessingService
do
	PurchaseProcessingService = setmetatable({}, {
		__tostring = function()
			return "PurchaseProcessingService"
		end,
	})
	PurchaseProcessingService.__index = PurchaseProcessingService
	function PurchaseProcessingService.new(...)
		local self = setmetatable({}, PurchaseProcessingService)
		return self:constructor(...) or self
	end
	function PurchaseProcessingService:constructor()
		self.processedReceipts = {}
		-- We'll initialize this in onInit to ensure Flamework has registered the service
		log("Info", "PurchaseProcessingService constructor called")
	end
	function PurchaseProcessingService:onInit()
		log("Info", "PurchaseProcessingService initializing...")
		print("[DEBUG-PURCHASE] PurchaseProcessingService.onInit() called")
		-- Now it's safe to get the dependency
		TS.try(function()
			print("[DEBUG-PURCHASE] Attempting to resolve AbilitiesService dependency")
			self.abilitiesService = Dependency()
			log("Info", "AbilitiesService dependency resolved")
			print("[DEBUG-PURCHASE] Successfully resolved AbilitiesService dependency")
			local _abilitiesService = self.abilitiesService
			print(`[DEBUG-PURCHASE] AbilitiesService type: {typeof(_abilitiesService)}`)
		end, function(err)
			print(`[DEBUG-PURCHASE] Error resolving dependency: {err}`)
		end)
		-- Check for existing gamepass ownership when a player joins
		print("[DEBUG] Setting up PlayerAdded event handler")
		Players.PlayerAdded:Connect(function(player)
			print(`[DEBUG] Player added: {player.Name}, checking gamepass ownership`)
			self:checkExistingGamepassOwnership(player)
		end)
		-- Check if there are already players in the game
		local existingPlayers = Players:GetPlayers()
		print(`[DEBUG-PURCHASE] Checking existing players: {#existingPlayers}`)
		if #existingPlayers > 0 then
			print(`[DEBUG] Found {#existingPlayers} existing players, checking their gamepass ownership`)
			for i = 0, #existingPlayers - 1 do
				local player = existingPlayers[i + 1]
				self:checkExistingGamepassOwnership(player)
			end
		end
		-- Set up event listeners for gamepass and developer product purchases
		MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, gamepassId, purchaseSuccess)
			if purchaseSuccess then
				self:handleGamepassPurchase(player, gamepassId)
			end
		end)
		MarketplaceService.ProcessReceipt = function(receiptInfo)
			return self:handleProductPurchase(receiptInfo)
		end
	end
	function PurchaseProcessingService:checkExistingGamepassOwnership(player)
		log("Info", `Checking existing gamepass ownership for {player.Name}`)
		local gamepassBenefitMap = {
			[1150966154] = "applyRegenerationBenefit",
			[1155692418] = "apply2xHealthBenefit",
			[1151894037] = "applySprintBenefit",
			[1149964231] = "apply2xSpeedBenefit",
		}
		-- ▼ ReadonlyMap.forEach ▼
		local _callback = function(benefitFunctionName, gamepassId)
			-- Use pcall to safely check ownership
			local success, ownsGamepass = pcall(function()
				return MarketplaceService:UserOwnsGamePassAsync(player.UserId, gamepassId)
			end)
			if success and ownsGamepass then
				log("Info", `{player.Name} already owns gamepass {gamepassId}`)
				self:handleGamepassPurchase(player, gamepassId, true)
			elseif not success then
				log("Error", `Failed to check gamepass ownership for {player.Name}: {ownsGamepass}`)
			end
		end
		for _k, _v in gamepassBenefitMap do
			_callback(_v, _k, gamepassBenefitMap)
		end
		-- ▲ ReadonlyMap.forEach ▲
	end
	function PurchaseProcessingService:handleGamepassPurchase(player, gamepassId, isInitialCheck)
		if isInitialCheck == nil then
			isInitialCheck = false
		end
		log("Info", `Processing gamepass purchase for {player.Name}, Gamepass ID: {gamepassId}`)
		-- Map gamepass IDs to method names in AbilitiesService
		local gamepassBenefitMap = {
			[1150966154] = "applyRegenerationBenefit",
			[1155692418] = "apply2xHealthBenefit",
			[1151894037] = "applySprintBenefit",
			[1149964231] = "apply2xSpeedBenefit",
		}
		local _gamepassId = gamepassId
		local benefitFunctionName = gamepassBenefitMap[_gamepassId]
		if benefitFunctionName ~= nil then
			log("Info", `Attempting to apply benefit [{benefitFunctionName}] for gamepass {gamepassId} to {player.Name}`)
			-- Use pcall to safely call the method
			local success, errorMsg = pcall(function()
				if self.abilitiesService then
					-- Prefer using applyBenefitByName if it exists
					if self.abilitiesService.applyBenefitByName ~= nil and self.abilitiesService.applyBenefitByName then
						log("Debug", `Using applyBenefitByName for {benefitFunctionName}`)
						self.abilitiesService:applyBenefitByName(benefitFunctionName, player)
					else
						-- Fallback: Call the specific method directly
						log("Debug", `Fallback: Directly calling {benefitFunctionName} on AbilitiesService`)
						local _condition = self.abilitiesService[benefitFunctionName] ~= nil
						if _condition then
							local _arg0 = self.abilitiesService[benefitFunctionName]
							_condition = type(_arg0) == "function"
						end
						if _condition then
							-- Try direct method call - in Luau this must compile to a colon call (obj:method)
							-- We can't do this with dynamic property access in TypeScript directly
							-- So we need to use applyBenefitByName which handles this for us
							if self.abilitiesService and self.abilitiesService.applyBenefitByName then
								self.abilitiesService:applyBenefitByName(benefitFunctionName, player)
							end
						else
							log("Error", `Fallback: Benefit function {benefitFunctionName} not found or not callable on AbilitiesService`)
						end
					end
				else
					log("Error", "AbilitiesService is not initialized")
					error("AbilitiesService is not initialized")
				end
			end)
			if not success then
				log("Error", `Failed to apply benefit {benefitFunctionName}: {errorMsg}`)
			end
			if not isInitialCheck then
				self:notifyPlayer(player, "Gamepass", gamepassId)
			end
		else
			log("Error", `Unknown gamepass ID: {gamepassId}`)
		end
	end
	function PurchaseProcessingService:handleProductPurchase(receiptInfo)
		print(`[PURCHASE-HANDLER] *** PROCESSING PRODUCT PURCHASE: {receiptInfo.ProductId}, Receipt: {receiptInfo.PurchaseId} ***`)
		log("Info", `Processing developer product purchase, Receipt ID: {receiptInfo.PurchaseId}`)
		-- Prevent processing the same receipt multiple times
		local _processedReceipts = self.processedReceipts
		local _purchaseId = receiptInfo.PurchaseId
		if _processedReceipts[_purchaseId] ~= nil then
			log("Warn", `Receipt {receiptInfo.PurchaseId} already processed`)
			return Enum.ProductPurchaseDecision.PurchaseGranted
		end
		-- Get player from receipt
		local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
		if not player then
			log("Error", `Player not found for receipt {receiptInfo.PurchaseId}`)
			return Enum.ProductPurchaseDecision.NotProcessedYet
		end
		-- Map product IDs to method names in AbilitiesService
		local productBenefitMap = {
			[3261484089] = "applyExtraLivesBenefit",
			[3261484228] = "applyReviveBenefit",
			[3261490620] = "applyTeamReviveBenefit",
		}
		local productId = receiptInfo.ProductId
		local benefitFunctionName = productBenefitMap[productId]
		if benefitFunctionName ~= nil then
			print(`[PURCHASE-HANDLER] Attempting to apply benefit [{benefitFunctionName}] for product {productId} to {player.Name}`)
			log("Info", `Attempting to apply benefit [{benefitFunctionName}] for product {productId} to {player.Name}`)
			-- Use pcall to safely call the method
			local purchaseDecision = Enum.ProductPurchaseDecision.NotProcessedYet
			local success, errorMsg = pcall(function()
				-- Direct implementation of product functionality
				print(`[PURCHASE-HANDLER] Directly applying benefit: {benefitFunctionName}`)
				log("Debug", `Directly applying benefit: {benefitFunctionName}`)
				-- Handle each product directly
				repeat
					if benefitFunctionName == "applyExtraLivesBenefit" then
						self:applyExtraLivesBenefit(player)
						break
					end
					if benefitFunctionName == "applyReviveBenefit" then
						self:applyReviveBenefit(player)
						break
					end
					if benefitFunctionName == "applyTeamReviveBenefit" then
						self:applyTeamReviveBenefit(player)
						break
					end
					log("Error", `Unknown benefit function: {benefitFunctionName}`)
					error(`Unknown benefit function: {benefitFunctionName}`)
				until true
				-- If we reached here without error inside the pcall, grant the purchase
				purchaseDecision = Enum.ProductPurchaseDecision.PurchaseGranted
				local _processedReceipts_1 = self.processedReceipts
				local _purchaseId_1 = receiptInfo.PurchaseId
				_processedReceipts_1[_purchaseId_1] = true
				self:notifyPlayer(player, "Product", productId)
			end)
			if not success then
				print(`[PURCHASE-HANDLER] ERROR: Failed to apply benefit {benefitFunctionName}: {errorMsg}`)
				log("Error", `Failed to apply benefit {benefitFunctionName}: {errorMsg}`)
				-- Keep purchaseDecision as NotProcessedYet if pcall failed
			else
				print(`[PURCHASE-HANDLER] SUCCESS: Applied benefit {benefitFunctionName} to {player.Name}`)
			end
			print(`[PURCHASE-HANDLER] Returning purchase decision: {purchaseDecision}`)
			return purchaseDecision
		else
			print(`[PURCHASE-HANDLER] ERROR: Unknown product ID: {productId}`)
			log("Error", `Unknown product ID: {productId}`)
			return Enum.ProductPurchaseDecision.NotProcessedYet
		end
	end
	function PurchaseProcessingService:notifyPlayer(player, purchaseType, id)
		print(`[PURCHASE-HANDLER] Notifying {player.Name} of {purchaseType} purchase (ID: {id})`)
		log("Info", `Notifying {player.Name} of {purchaseType} purchase (ID: {id})`)
		TS.try(function()
			-- Direct approach to get and fire the remote event to avoid any errors
			local remoteFolder = game:GetService("ReplicatedStorage"):FindFirstChild("GameRemotes")
			if remoteFolder then
				local notifyRemote = remoteFolder:FindFirstChild("NotifyPurchase")
				if notifyRemote then
					print(`[PURCHASE-HANDLER] Found NotifyPurchase remote, firing to client {player.Name}`)
					notifyRemote:FireClient(player, purchaseType, id)
				else
					print(`[PURCHASE-HANDLER] NotifyPurchase remote not found in GameRemotes folder`)
				end
			else
				print(`[PURCHASE-HANDLER] GameRemotes folder not found in ReplicatedStorage`)
			end
		end, function(err)
			print(`[PURCHASE-HANDLER] Error in notifyPlayer: {err}`)
		end)
	end
	function PurchaseProcessingService:applyExtraLivesBenefit(player)
		print(`[PURCHASE-HANDLER] === APPLYING 3X EXTRA LIVES TO {player.Name} ===`)
		log("Info", `Applying 3x extra lives benefit to {player.Name}`)
		-- Use attributes to store extra lives
		local _condition = player:GetAttribute("ExtraLives")
		if _condition == nil then
			_condition = 0
		end
		local currentLives = _condition
		player:SetAttribute("ExtraLives", currentLives + 3)
		print(`[PURCHASE-HANDLER] Added 3 extra lives to {player.Name}, total: {currentLives + 3}`)
		log("Info", `Added 3 extra lives to {player.Name}, total: {currentLives + 3}`)
	end
	function PurchaseProcessingService:applyReviveBenefit(player)
		log("Info", `Applying revive benefit to {player.Name}`)
		-- Check if player is dead or needs reviving
		local character = player.Character
		if not character then
			-- Player has no character, load a new one
			log("Info", `Player {player.Name} has no character, respawning`)
			player:LoadCharacter()
			return nil
		end
		-- Check if player's humanoid exists and is dead
		local humanoid = character:FindFirstChildOfClass("Humanoid")
		if not humanoid then
			log("Error", `Humanoid not found for {player.Name}, respawning`)
			player:LoadCharacter()
			return nil
		end
		if humanoid.Health <= 0 then
			-- Player is dead, respawn them
			log("Info", `Reviving dead player {player.Name}`)
			player:LoadCharacter()
		else
			-- Player is not dead, heal them to full
			log("Info", `Player {player.Name} is not dead, healing to full health`)
			humanoid.Health = humanoid.MaxHealth
		end
	end
	function PurchaseProcessingService:applyTeamReviveBenefit(player)
		log("Info", `Applying team revive benefit to {player.Name}`)
		-- Get all players in the game
		local playersInGame = Players:GetPlayers()
		-- Setup team revive parameters
		local reviveRadius = 50
		local reviveCount = 0
		-- Check if the player has a character
		if not player.Character or not player.Character.PrimaryPart then
			log("Error", `Player {player.Name} has no character or PrimaryPart`)
			return nil
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
				log("Info", `Reviving teammate {teammate.Name} who has no character`)
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
						log("Info", `Reviving dead teammate {teammate.Name} within {reviveRadius} radius`)
						teammate:LoadCharacter()
						reviveCount += 1
					elseif humanoid then
						-- Teammate is not dead but within radius, heal them
						log("Info", `Healing teammate {teammate.Name} within {reviveRadius} radius`)
						humanoid.Health = humanoid.MaxHealth
						reviveCount += 1
					end
				end
			end
		end
		log("Info", `Team revive benefit applied by {player.Name}, revived/healed {reviveCount} teammates`)
	end
	PurchaseProcessingService = Service({
		loadOrder = 1,
	})(PurchaseProcessingService) or PurchaseProcessingService
end
return {
	PurchaseProcessingService = PurchaseProcessingService,
}
