-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local Players = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").Players
-- Simple logger function
local log = function(message)
	print(`[HideDeathScreen] {message}`)
end
log("Starting HideDeathScreen client script")
-- Get local player
local player = Players.LocalPlayer
log(`Script running for player: {player.Name}`)
-- Get PlayerGui
local playerGui = player:WaitForChild("PlayerGui")
-- Create a whitelist of UI elements that should NEVER be touched by this script
-- This is a strong protection against interfering with other UI systems
local PROTECTED_UIS = { "GamepassShop", "OnFire", "ShopUI", "GameMenu", "Notification" }
-- Create a special attribute to protect UIs from this system
local PROTECTION_ATTRIBUTE = "DeathScreenProtected"
-- Safer death screen hiding function that respects protected UIs
local isProtectedUI
local forceHideDeathScreen = function()
	-- Directly check for the DeathScreen
	local deathScreen = playerGui:FindFirstChild("DeathScreen")
	if deathScreen and not isProtectedUI(deathScreen) then
		-- Only hide if player has lives
		local _condition = player:GetAttribute("ExtraLives")
		if _condition == nil then
			_condition = 0
		end
		local lives = _condition
		if lives > 0 then
			-- Force disable the death screen
			if deathScreen.Enabled then
				deathScreen.Enabled = false
				log("FORCED DeathScreen to be disabled - player has lives")
			end
		end
	end
	-- More selective scan for death screens only
	local _exp = playerGui:GetChildren()
	-- ▼ ReadonlyArray.forEach ▼
	local _callback = function(child)
		-- First check: is this a UI we should never touch?
		if isProtectedUI(child) then
			-- Skip protected UIs completely
			return nil
		end
		if child:IsA("ScreenGui") then
			-- Only target explicit death screen related UIs
			-- More specific matching to avoid false positives
			if { string.match(child.Name, "^DeathScreen") } or child.Name == "OriginalDeathScreen_Disabled" then
				local screenGui = child
				local _condition = player:GetAttribute("ExtraLives")
				if _condition == nil then
					_condition = 0
				end
				local lives = _condition
				if lives > 0 and screenGui.Enabled then
					screenGui.Enabled = false
					log(`FORCED {child.Name} to be disabled - player has lives`)
				end
			end
		end
	end
	for _k, _v in _exp do
		_callback(_v, _k - 1, _exp)
	end
	-- ▲ ReadonlyArray.forEach ▲
end
-- Check if a UI is protected (should be left alone)
isProtectedUI = function(uiInstance)
	-- Check direct name match
	local _name = uiInstance.Name
	if table.find(PROTECTED_UIS, _name) ~= nil then
		return true
	end
	-- Check for protection attribute
	local _value = uiInstance:GetAttribute(PROTECTION_ATTRIBUTE)
	if _value ~= 0 and _value == _value and _value ~= "" and _value then
		return true
	end
	return false
end
-- Run continuous loop to force death screen off - but less aggressively
local FORCE_INTERVAL = 0.5
task.spawn(function()
	while true do
		forceHideDeathScreen()
		task.wait(FORCE_INTERVAL)
	end
end)
-- Also check on every attribute change
player.AttributeChanged:Connect(function(attributeName)
	if attributeName == "ExtraLives" then
		forceHideDeathScreen()
	end
end)
-- Also check on character added
player.CharacterAdded:Connect(function()
	-- Run multiple times to catch any timing issues
	for i = 0, 4 do
		task.delay(i * 0.2, forceHideDeathScreen)
	end
end)
log("HideDeathScreen script initialized and running")
