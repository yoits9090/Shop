-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local Players = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").Players
-- Simple logger function
local log = function(message)
	print(`[UIStateManager] {message}`)
end
log("Starting UIStateManager client script")
-- Get local player
local player = Players.LocalPlayer
log(`Script running for player: {player.Name}`)
-- Get UI elements
local playerGui = player:WaitForChild("PlayerGui")
-- Define UI states with priorities (higher number = higher priority)
local UIState
do
	local _inverse = {}
	UIState = setmetatable({}, {
		__index = _inverse,
	})
	UIState.None = 0
	_inverse[0] = "None"
	UIState.Shop = 10
	_inverse[10] = "Shop"
	UIState.Death = 20
	_inverse[20] = "Death"
	UIState.OnFire = 30
	_inverse[30] = "OnFire"
end
-- Track current UI state
local currentState = UIState.None
-- Function to manage UI visibility
local updateUIVisibility
local setUIState = function(newState)
	-- Only update if the new state has higher or equal priority
	if newState >= currentState or newState == UIState.None then
		local oldState = currentState
		currentState = newState
		log(`UI state changed: {UIState[oldState]} -> {UIState[newState]}`)
		-- Update UI visibility based on current state
		updateUIVisibility()
		return true
	end
	log(`UI state change rejected: {UIState[currentState]} -> {UIState[newState]} (lower priority)`)
	return false
end
-- Function to update UI visibility based on current state
updateUIVisibility = function()
	-- Get UI elements - IMPORTANT: Don't require all elements to exist
	local shopUI = playerGui:FindFirstChild("GamepassShop")
	local deathUI = playerGui:FindFirstChild("DeathScreen")
	local disabledOriginalDeathUI = playerGui:FindFirstChild("OriginalDeathScreen_Disabled")
	-- We don't modify the OnFire UI, just check if it exists for logging
	local onFireExists = playerGui:FindFirstChild("OnFire") ~= nil
	-- Handle each UI separately to avoid one missing UI preventing others from updating
	-- This is more resilient than requiring all UIs to be present
	-- Update visibility based on current state
	repeat
		if currentState == (UIState.None) then
			-- Hide UIs except for special ones that should remain visible
			if shopUI then
				shopUI.Enabled = false
			end
			if deathUI then
				deathUI.Enabled = false
			end
			if disabledOriginalDeathUI then
				disabledOriginalDeathUI.Enabled = false
			end
			-- IMPORTANT: Don't touch the OnFire UI - it's controlled by its own system
			log(`All managed UIs hidden (keeping OnFire UI {if onFireExists then "found and" else "not found, but"} state intact)`)
			break
		end
		if currentState == (UIState.Shop) then
			-- Show shop UI, hide death UI
			if shopUI then
				shopUI.Enabled = true
			end
			if deathUI then
				deathUI.Enabled = false
			end
			if disabledOriginalDeathUI then
				disabledOriginalDeathUI.Enabled = false
			end
			-- IMPORTANT: Don't affect the OnFire UI
			log("Shop UI shown (if available), Death UI hidden")
			break
		end
		if currentState == (UIState.Death) then
			-- CRITICAL: Check lives before showing death UI
			local _condition = player:GetAttribute("ExtraLives")
			if _condition == nil then
				_condition = 0
			end
			local currentLives = _condition
			if currentLives <= 0 then
				-- Only show death UI if player has no lives
				if deathUI then
					deathUI.Enabled = true
				end
				if shopUI then
					shopUI.Enabled = false
				end
				-- IMPORTANT: Don't affect the OnFire UI
				log("Death UI shown (if available), Shop UI hidden - Player has no lives")
			else
				-- Player has lives, don't show death screen
				if deathUI then
					deathUI.Enabled = false
				end
				if disabledOriginalDeathUI then
					disabledOriginalDeathUI.Enabled = false
				end
				-- IMPORTANT: Don't affect the OnFire UI
				log("Death UI NOT shown - Player has lives")
				-- Override state back to None
				currentState = UIState.None
			end
			break
		end
	until true
end
-- Create a BindableFunction to expose the state management to other scripts
local stateManager = Instance.new("BindableFunction")
stateManager.Name = "UIStateManager"
-- Set up the function
stateManager.OnInvoke = function(action, state)
	if action == "set" then
		local newState = UIState[state]
		return setUIState(newState)
	elseif action == "get" then
		return UIState[currentState]
	end
	return false
end
-- Parent the function to ReplicatedStorage for other scripts to access
stateManager.Parent = game:GetService("ReplicatedStorage")
-- Track player death to automatically set Death UI state
player.CharacterAdded:Connect(function(character)
	local humanoid = character:WaitForChild("Humanoid")
	-- Handle death - with lives check
	humanoid.Died:Connect(function()
		-- IMPORTANT: Check if player has lives before showing death UI
		local _condition = player:GetAttribute("ExtraLives")
		if _condition == nil then
			_condition = 0
		end
		local currentLives = _condition
		log(`Player died, checking lives before setting UI state. Lives: {currentLives}`)
		if currentLives <= 0 then
			-- Only set Death state if player has no lives left
			setUIState(UIState.Death)
		else
			log("Player still has lives, not showing death screen")
			-- Ensure death screen is hidden
			setUIState(UIState.None)
		end
	end)
	-- Reset state when character spawns
	setUIState(UIState.None)
end)
-- Initialize with current character if it exists
if player.Character then
	local humanoid = player.Character:FindFirstChildOfClass("Humanoid")
	if humanoid then
		-- Reset state
		setUIState(UIState.None)
		-- Set up death handler
		humanoid.Died:Connect(function()
			log("Player died, setting Death UI state")
			setUIState(UIState.Death)
		end)
	end
end
log("UIStateManager initialized")
