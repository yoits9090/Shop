-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local Service = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@flamework", "core", "out").Service
local Players = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").Players
-- Use a more descriptive logger
local log = function(level, message)
	print(`[AbilitiesService][{level}] {message}`)
end
local AbilitiesService
do
	AbilitiesService = setmetatable({}, {
		__tostring = function()
			return "AbilitiesService"
		end,
	})
	AbilitiesService.__index = AbilitiesService
	function AbilitiesService.new(...)
		local self = setmetatable({}, AbilitiesService)
		return self:constructor(...) or self
	end
	function AbilitiesService:constructor()
		log("Info", "AbilitiesService constructor called")
		print("[DEBUG-ABILITIES] AbilitiesService constructor executed")
	end
	function AbilitiesService:onInit()
		log("Info", "AbilitiesService initializing...")
		print("[DEBUG-ABILITIES] AbilitiesService.onInit() called")
		-- Any initialization logic can go here
		print("[DEBUG-ABILITIES] Setting up PlayerAdded event in AbilitiesService")
		Players.PlayerAdded:Connect(function(player)
			log("Info", `Player {player.Name} added, ready to apply benefits`)
			print(`[DEBUG-ABILITIES] Player {player.Name} added event fired in AbilitiesService`)
		end)
		-- Check existing players
		local existingPlayers = Players:GetPlayers()
		print(`[DEBUG-ABILITIES] Found {#existingPlayers} existing players on init`)
		for i = 0, #existingPlayers - 1 do
			print(`[DEBUG-ABILITIES] Existing player: {existingPlayers[i + 1].Name}`)
		end
	end
	function AbilitiesService:applyRegenerationBenefit(player)
		log("Info", `Applying regeneration benefit to {player.Name}`)
		-- TODO: Implement game logic for regeneration (e.g., start a health regeneration loop)
		-- Example: player.SetAttribute("HasRegen", true);
	end
	function AbilitiesService:apply2xHealthBenefit(player)
		log("Info", `Applying 2x health benefit to {player.Name}`)
		-- TODO: Implement game logic for 2x health (e.g., increase MaxHealth and Health)
		-- Example: const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		--          if (humanoid) { humanoid.MaxHealth *= 2; humanoid.Health = humanoid.MaxHealth; }
	end
	function AbilitiesService:applySprintBenefit(player)
		log("Info", `Applying sprint benefit to {player.Name}`)
		-- TODO: Implement game logic for sprint (e.g., enable a faster walk speed ability)
		-- Example: player.SetAttribute("CanSprint", true);
	end
	function AbilitiesService:apply2xSpeedBenefit(player)
		log("Info", `Applying 2x speed benefit to {player.Name}`)
		-- TODO: Implement game logic for 2x speed (e.g., increase WalkSpeed)
		-- Example: const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		--          if (humanoid) { humanoid.WalkSpeed *= 2; }
	end
	function AbilitiesService:applyExtraLivesBenefit(player)
		log("Info", `Applying 3x extra lives benefit to {player.Name}`)
		-- TODO: Implement game logic for extra lives (e.g., increment a lives counter)
		-- Example: const currentLives = player.GetAttribute("ExtraLives") as number ?? 0;
		--          player.SetAttribute("ExtraLives", currentLives + 3);
	end
	function AbilitiesService:applyReviveBenefit(player)
		log("Info", `Applying revive benefit to {player.Name}`)
		-- TODO: Implement game logic for revive (e.g., respawn the player immediately if dead)
		-- Example: const humanoid = player.Character?.FindFirstChildOfClass("Humanoid");
		--          if (humanoid && humanoid.Health <= 0) { player.LoadCharacter(); }
	end
	function AbilitiesService:applyTeamReviveBenefit(player)
		log("Info", `Applying team revive benefit to {player.Name}`)
		-- TODO: Implement game logic for team revive (e.g., find dead teammates and respawn them)
		-- Example: Find teammates in a specific radius or on the same team and call player.LoadCharacter() for them.
	end
	function AbilitiesService:applyBenefitByName(benefitName, player)
		print(`[DEBUG-ABILITIES] applyBenefitByName called with benefit: {benefitName}, player: {player.Name}`)
		log("Info", `Applying benefit {benefitName} to {player.Name} via applyBenefitByName`)
		local success, errorMsg = pcall(function()
			repeat
				if benefitName == "applyRegenerationBenefit" then
					self:applyRegenerationBenefit(player)
					break
				end
				if benefitName == "apply2xHealthBenefit" then
					self:apply2xHealthBenefit(player)
					break
				end
				if benefitName == "applySprintBenefit" then
					self:applySprintBenefit(player)
					break
				end
				if benefitName == "apply2xSpeedBenefit" then
					self:apply2xSpeedBenefit(player)
					break
				end
				if benefitName == "applyExtraLivesBenefit" then
					self:applyExtraLivesBenefit(player)
					break
				end
				if benefitName == "applyReviveBenefit" then
					self:applyReviveBenefit(player)
					break
				end
				if benefitName == "applyTeamReviveBenefit" then
					self:applyTeamReviveBenefit(player)
					break
				end
				log("Error", `Benefit method {benefitName} not found or handled in AbilitiesService.applyBenefitByName`)
				return nil
			until true
			log("Debug", `Successfully called {benefitName} for {player.Name} via applyBenefitByName`)
		end)
		if not success then
			log("Error", `Error applying benefit {benefitName} via applyBenefitByName: {errorMsg}`)
		end
	end
	function AbilitiesService:applyCharacterBenefits(player)
		log("Info", `Applying character-specific benefits for {player.Name}`)
		-- Example: Re-apply 2x speed if the player owns the gamepass
		-- We need MarketplaceService here if we check ownership within this service
		-- Alternatively, the calling service (like PurchaseService or a PlayerJoin service)
		-- could perform the check and then call the specific ability function.
		-- const MarketplaceService = game.GetService("MarketplaceService");
		-- const speedPassId = 1149964231;
		-- pcall(() => {
		-- 	const ownsPass = MarketplaceService.UserOwnsGamePassAsync(player.UserId, speedPassId);
		-- 	if (ownsPass) {
		-- 		const humanoid = character.FindFirstChildOfClass("Humanoid");
		-- 		if (humanoid) {
		-- 			log("Info", `Applying 2x speed to ${player.Name}'s character (on spawn)`);
		-- 			humanoid.WalkSpeed *= 2; // Be careful with repeated multiplication!
		-- 		}
		-- 	}
		-- });
	end
	-- Modified to fix 'attempt to call a table value' error
	-- Original: AbilitiesService = Service({loadOrder = 0})(AbilitiesService) or AbilitiesService
	-- Fix: Use direct assignment instead of calling the Service function
	print("[AbilitiesService] Bypassing problematic Service decorator call")
end
-- Create a direct instance that can be accessed globally
local directInstance = AbilitiesService.new()

-- Initialize it directly
task.spawn(function()
	print("[DIRECT-INIT] Manually initializing AbilitiesService")
	local success, errorMsg = pcall(function()
		directInstance:onInit()
		print("[DIRECT-INIT] AbilitiesService initialized successfully")
		
		-- Make it accessible globally so PurchaseHandler can find it
		_G.DirectServices = _G.DirectServices or {}
		_G.DirectServices.AbilitiesService = directInstance
		print("[DIRECT-INIT] AbilitiesService registered globally")
	end)
	
	-- Catch any errors
	if not success then
		print("[DIRECT-INIT] Error initializing AbilitiesService:", errorMsg)
	end
end)

return {
	AbilitiesService = AbilitiesService,
	-- Also expose the direct instance
	DirectInstance = directInstance
}
