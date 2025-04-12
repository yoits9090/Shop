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
			[3261484089] = "applyTemporarySpeedBoost",
			[3261484228] = "applyTemporaryRegeneration",
			[3261490620] = "applyTemporaryShield",
		}
		local productId = receiptInfo.ProductId
		local benefitFunctionName = productBenefitMap[productId]
		if benefitFunctionName ~= nil then
			log("Info", `Attempting to apply benefit [{benefitFunctionName}] for product {productId} to {player.Name}`)
			-- Use pcall to safely call the method
			local purchaseDecision = Enum.ProductPurchaseDecision.NotProcessedYet
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
					-- If we reached here without error inside the pcall, grant the purchase
					purchaseDecision = Enum.ProductPurchaseDecision.PurchaseGranted
					local _processedReceipts_1 = self.processedReceipts
					local _purchaseId_1 = receiptInfo.PurchaseId
					_processedReceipts_1[_purchaseId_1] = true
					self:notifyPlayer(player, "Product", productId)
				else
					log("Error", "AbilitiesService is not initialized")
					error("AbilitiesService is not initialized")
				end
			end)
			if not success then
				log("Error", `Failed to apply benefit {benefitFunctionName}: {errorMsg}`)
				-- Keep purchaseDecision as NotProcessedYet if pcall failed
			end
			return purchaseDecision
		else
			log("Error", `Unknown product ID: {productId}`)
			return Enum.ProductPurchaseDecision.NotProcessedYet
		end
	end
	function PurchaseProcessingService:notifyPlayer(player, purchaseType, id)
		log("Info", `Notifying {player.Name} of {purchaseType} purchase (ID: {id})`)
		-- Example: Fire a RemoteEvent to the client to show a UI popup
		-- Remotes.Default.Client.Get("PurchaseNotification")?.Call(player, purchaseType, id);
	end
	-- Modified to fix 'attempt to call a table value' error
	-- Original: PurchaseProcessingService = Service({loadOrder = 1})(PurchaseProcessingService) or PurchaseProcessingService
	-- Fix: Use direct assignment instead of calling the Service function
	print("[PurchaseProcessingService] Bypassing problematic Service decorator call")
end
-- Create and initialize service instance directly
local directInstance = PurchaseProcessingService.new()

-- Call onInit directly to set up the service
task.spawn(function()
	print("[DIRECT-INIT] Manually initializing PurchaseProcessingService")
	
	-- IMPORTANT: Wait for AbilitiesService to initialize first
	print("[DIRECT-INIT] Waiting for AbilitiesService to be available in global registry")
	
	-- Wait up to 5 seconds for the AbilitiesService to become available
	local startTime = os.time()
	while os.time() - startTime < 5 do
		if _G.DirectServices and _G.DirectServices.AbilitiesService then
			print("[DIRECT-INIT] Found AbilitiesService in global registry")
			break
		end
		task.wait(0.1)
	end
	
	-- Check if we found AbilitiesService
	if not (_G.DirectServices and _G.DirectServices.AbilitiesService) then
		print("[DIRECT-INIT] WARNING: AbilitiesService not found in global registry after waiting")
	end
	
	-- Directly inject AbilitiesService into PurchaseProcessingService
	if _G.DirectServices and _G.DirectServices.AbilitiesService then
		directInstance.abilitiesService = _G.DirectServices.AbilitiesService
		print("[DIRECT-INIT] Successfully injected AbilitiesService into PurchaseProcessingService")
	end
	
	-- Now initialize the service
	local success, errorMsg = pcall(function()
		directInstance:onInit()
		print("[DIRECT-INIT] PurchaseProcessingService initialized successfully")
		
		-- Double-check the relationship
		if directInstance.abilitiesService then
			print("[DIRECT-INIT] Confirmed: PurchaseProcessingService has AbilitiesService reference")
		else
			print("[DIRECT-INIT] WARNING: PurchaseProcessingService still missing AbilitiesService reference")
		end
		
		-- Manually set up MarketplaceService handlers
		print("[DIRECT-INIT] Setting up MarketplaceService handlers manually")
		MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, gamepassId, purchaseSuccess)
			print("[DIRECT-INIT] PromptGamePassPurchaseFinished fired", player.Name, gamepassId, purchaseSuccess)
			if purchaseSuccess then
				directInstance:handleGamepassPurchase(player, gamepassId)
			end
		end)
		
		-- Set ProcessReceipt handler
		MarketplaceService.ProcessReceipt = function(receiptInfo)
			print("[DIRECT-INIT] ProcessReceipt called", receiptInfo.PurchaseId)
			return directInstance:handleProductPurchase(receiptInfo)
		end
		
		print("[DIRECT-INIT] All MarketplaceService handlers set up")
		
		-- Process any existing players
		local players = Players:GetPlayers()
		for _, player in ipairs(players) do
			print("[DIRECT-INIT] Checking existing gamepass ownership for", player.Name)
			directInstance:checkExistingGamepassOwnership(player)
		end
		
	end)

	-- Catch any errors
	if not success then
		print("[DIRECT-INIT] Error initializing PurchaseProcessingService:", errorMsg)
	end
end)

return {
	PurchaseProcessingService = PurchaseProcessingService,
	-- Expose the direct instance as well
	DirectInstance = directInstance
}
