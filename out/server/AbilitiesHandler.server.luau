-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local Service = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@flamework", "core", "out").Service
local Players = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").Players
local getRemotes = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "GameRemotes.shared").getRemotes
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
		self.regenLoopRunning = false
		log("Info", "AbilitiesService constructor called")
		print("[DEBUG-ABILITIES] AbilitiesService constructor executed")
	end
	function AbilitiesService:onInit()
		log("Info", "AbilitiesService initializing...")
		print("[DEBUG-ABILITIES] AbilitiesService.onInit() called")
		-- Set up player added event for tracking and benefits
		print("[DEBUG-ABILITIES] Setting up PlayerAdded event in AbilitiesService")
		Players.PlayerAdded:Connect(function(player)
			log("Info", `Player {player.Name} added, ready to apply benefits`)
			print(`[DEBUG-ABILITIES] Player {player.Name} added event fired in AbilitiesService`)
			-- Set up character added event to re-apply benefits
			player.CharacterAdded:Connect(function(character)
				self:applyCharacterBenefits(player)
			end)
		end)
		-- Check existing players and apply benefits if needed
		local existingPlayers = Players:GetPlayers()
		print(`[DEBUG-ABILITIES] Found {#existingPlayers} existing players on init`)
		for i = 0, #existingPlayers - 1 do
			local player = existingPlayers[i + 1]
			print(`[DEBUG-ABILITIES] Existing player: {player.Name}`)
			-- Set up character added event
			player.CharacterAdded:Connect(function(character)
				self:applyCharacterBenefits(player)
			end)
			-- Apply to current character if exists
			if player.Character then
				self:applyCharacterBenefits(player)
			end
		end
	end
	function AbilitiesService:startRegenerationLoop()
		if self.regenLoopRunning then
			return nil
		end
		self.regenLoopRunning = true
		log("Info", "Starting regeneration loop for all eligible players")
		-- Create a loop to handle regeneration for all players
		task.spawn(function()
			-- Use regular while loop with task.wait rather than an infinite loop
			while self.regenLoopRunning do
				task.wait(1)
				-- Process all players
				local players = Players:GetPlayers()
				for _, player in players do
					local _value = player:GetAttribute("HasRegeneration")
					if _value ~= 0 and _value == _value and _value ~= "" and _value then
						if player.Character then
							self:applyRegenToCharacter(player, player.Character)
						end
					end
				end
			end
		end)
	end
	function AbilitiesService:applyRegenToCharacter(player, character)
		local humanoid = character:FindFirstChildOfClass("Humanoid")
		if not humanoid then
			return nil
		end
		-- Only regenerate if not at full health
		if humanoid.Health < humanoid.MaxHealth then
			-- Regenerate 1 health per second
			humanoid.Health = math.min(humanoid.Health + 1, humanoid.MaxHealth)
			-- Add visual effect for regeneration (optional)
			self:createRegenerationEffect(character)
		end
	end
	function AbilitiesService:createRegenerationEffect(character)
		-- You could create particles or other visual effects here
		-- This is just a placeholder implementation
		local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
		if not humanoidRootPart then
			return nil
		end
		-- Check if effect already exists to avoid duplication
		if humanoidRootPart:FindFirstChild("RegenEffect") then
			return nil
		end
		-- Create a small visual indicator for debugging
		local effect = Instance.new("Part")
		effect.Name = "RegenEffect"
		effect.Size = Vector3.new(0.2, 0.2, 0.2)
		effect.Shape = Enum.PartType.Ball
		effect.Material = Enum.Material.Neon
		effect.BrickColor = BrickColor.new("Lime green")
		effect.CanCollide = false
		effect.Anchored = false
		-- Weld to character
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = humanoidRootPart
		weld.Part1 = effect
		weld.Parent = effect
		effect.Parent = humanoidRootPart
		-- Remove after a short time
		task.delay(0.5, function()
			effect:Destroy()
		end)
	end
	function AbilitiesService:applyRegenerationBenefit(player)
		log("Info", `Applying regeneration benefit to {player.Name}`)
		-- Set player attribute for regeneration
		player:SetAttribute("HasRegeneration", true)
		-- Begin regeneration loop if not already running
		if not self.regenLoopRunning then
			self:startRegenerationLoop()
		end
		-- Apply to current character if exists
		if player.Character then
			self:applyRegenToCharacter(player, player.Character)
		end
	end
	function AbilitiesService:apply2xHealthBenefit(player)
		log("Info", `Applying 2x health benefit to {player.Name}`)
		-- Set player attribute
		player:SetAttribute("Has2xHealth", true)
		-- Apply to current character if exists
		if player.Character then
			local humanoid = player.Character:FindFirstChildOfClass("Humanoid")
			if humanoid then
				-- To avoid multiplying repeatedly, check if already applied
				local _value = player:GetAttribute("Health2xApplied")
				if not (_value ~= 0 and _value == _value and _value ~= "" and _value) then
					log("Info", `Setting 2x health for {player.Name}'s character`)
					player:SetAttribute("Health2xApplied", true)
					humanoid.MaxHealth *= 2
					humanoid.Health = humanoid.MaxHealth
				end
			end
		end
		-- Setup character added listener for future spawns
		local _value = player:GetAttribute("Health2xListenerSetup")
		if not (_value ~= 0 and _value == _value and _value ~= "" and _value) then
			player:SetAttribute("Health2xListenerSetup", true)
			player.CharacterAdded:Connect(function(character)
				local _value_1 = player:GetAttribute("Has2xHealth")
				if _value_1 ~= 0 and _value_1 == _value_1 and _value_1 ~= "" and _value_1 then
					local humanoid = character:WaitForChild("Humanoid")
					log("Info", `Setting 2x health for {player.Name}'s new character`)
					humanoid.MaxHealth *= 2
					humanoid.Health = humanoid.MaxHealth
				end
			end)
		end
	end
	function AbilitiesService:applySprintBenefit(player)
		log("Info", `Applying sprint benefit to {player.Name}`)
		-- Set player attribute for sprint capability
		player:SetAttribute("CanSprint", true)
		-- Use the GameRemotes system to access the sprint remote event
		local remotes = getRemotes()
		-- Fire the remote to let client know sprint is enabled
		remotes.sprintEnabled:FireClient(player, true)
		log("Info", `Sprint capability enabled for {player.Name} via GameRemotes`)
	end
	function AbilitiesService:apply2xSpeedBenefit(player)
		log("Info", `Applying 2x speed benefit to {player.Name}`)
		-- Set player attribute
		player:SetAttribute("Has2xSpeed", true)
		-- Apply to current character if exists
		if player.Character then
			local humanoid = player.Character:FindFirstChildOfClass("Humanoid")
			if humanoid then
				-- Avoid applying multiple times
				local _value = player:GetAttribute("Speed2xApplied")
				if not (_value ~= 0 and _value == _value and _value ~= "" and _value) then
					log("Info", `Setting 2x speed for {player.Name}'s character`)
					player:SetAttribute("Speed2xApplied", true)
					humanoid.WalkSpeed *= 2
				end
			end
		end
		-- Setup character added listener for future spawns
		local _value = player:GetAttribute("Speed2xListenerSetup")
		if not (_value ~= 0 and _value == _value and _value ~= "" and _value) then
			player:SetAttribute("Speed2xListenerSetup", true)
			player.CharacterAdded:Connect(function(character)
				local _value_1 = player:GetAttribute("Has2xSpeed")
				if _value_1 ~= 0 and _value_1 == _value_1 and _value_1 ~= "" and _value_1 then
					local humanoid = character:WaitForChild("Humanoid")
					log("Info", `Setting 2x speed for {player.Name}'s new character`)
					humanoid.WalkSpeed *= 2
				end
			end)
		end
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
	function AbilitiesService:applyTemporaryShield(player, duration)
		if duration == nil then
			duration = 30
		end
		log("Info", `Applying temporary shield to {player.Name} for {duration} seconds`)
		player:SetAttribute("HasShield", true)
		-- Get the remotes system
		local remotes = getRemotes()
		-- Notify client to show shield effect
		remotes.applyEffect:FireClient(player, "Shield", duration)
		-- Apply shield mechanics to character if it exists
		if player.Character then
			self:applyShieldToCharacter(player.Character)
		end
		-- Setup listener for character respawns during shield duration
		local shieldConnection = player.CharacterAdded:Connect(function(character)
			local _value = player:GetAttribute("HasShield")
			if _value ~= 0 and _value == _value and _value ~= "" and _value then
				self:applyShieldToCharacter(character)
			end
		end)
		-- Remove the shield after duration expires
		task.delay(duration, function()
			player:SetAttribute("HasShield", false)
			shieldConnection:Disconnect()
			log("Info", `Shield expired for {player.Name}`)
			-- Notify client that shield has expired
			remotes.applyEffect:FireClient(player, "ShieldExpired", 0)
			-- Remove shield effect from current character if it exists
			if player.Character then
				self:removeShieldFromCharacter(player.Character)
			end
		end)
	end
	function AbilitiesService:applyShieldToCharacter(character)
		-- Implementation would depend on game mechanics
		-- For example, this could make the character temporarily invulnerable
		-- or create a shield mesh around the character
		local humanoid = character:FindFirstChildOfClass("Humanoid")
		if not humanoid then
			return nil
		end
		-- Apply shield effect - in this example we'll just create a visual indicator
		local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
		if not humanoidRootPart then
			return nil
		end
		-- Check if shield already exists to avoid duplication
		if humanoidRootPart:FindFirstChild("ShieldEffect") then
			return nil
		end
		-- Create a shield visual effect
		local shieldEffect = Instance.new("Part")
		shieldEffect.Name = "ShieldEffect"
		shieldEffect.Shape = Enum.PartType.Ball
		shieldEffect.Size = Vector3.new(8, 8, 8)
		shieldEffect.Transparency = 0.7
		shieldEffect.CanCollide = false
		shieldEffect.Material = Enum.Material.ForceField
		shieldEffect.BrickColor = BrickColor.new("Cyan")
		-- Weld to character
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = humanoidRootPart
		weld.Part1 = shieldEffect
		weld.Parent = shieldEffect
		shieldEffect.Parent = humanoidRootPart
	end
	function AbilitiesService:removeShieldFromCharacter(character)
		local humanoidRootPart = character:FindFirstChild("HumanoidRootPart")
		if not humanoidRootPart then
			return nil
		end
		local shieldEffect = humanoidRootPart:FindFirstChild("ShieldEffect")
		if shieldEffect then
			shieldEffect:Destroy()
		end
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
		-- Re-apply 2x health if player has it
		local _value = player:GetAttribute("Has2xHealth")
		if _value ~= 0 and _value == _value and _value ~= "" and _value then
			self:apply2xHealthBenefit(player)
		end
		-- Re-apply 2x speed if player has it
		local _value_1 = player:GetAttribute("Has2xSpeed")
		if _value_1 ~= 0 and _value_1 == _value_1 and _value_1 ~= "" and _value_1 then
			self:apply2xSpeedBenefit(player)
		end
		-- Re-apply sprint ability if player has it
		local _value_2 = player:GetAttribute("CanSprint")
		if _value_2 ~= 0 and _value_2 == _value_2 and _value_2 ~= "" and _value_2 then
			self:applySprintBenefit(player)
		end
	end
	AbilitiesService = Service({
		loadOrder = 0,
	})(AbilitiesService) or AbilitiesService
end
return {
	AbilitiesService = AbilitiesService,
}
