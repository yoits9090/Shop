-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local MarketplaceService = _services.MarketplaceService
local ReplicatedStorage = _services.ReplicatedStorage
-- Simple logger function
local log = function(message)
	print(`[DeathManager-Client] {message}`)
end
log("Starting DeathManager client script")
-- Product ID for revive
local REVIVE_PRODUCT_ID = 3261484228
-- Get local player
local player = Players.LocalPlayer
log(`Script running for player: {player.Name}`)
-- Get PlayerGui
local playerGui = player:WaitForChild("PlayerGui")
log("Found PlayerGui, waiting for DeathScreen to copy from StarterGui...")
-- Define a function to get or wait for DeathScreen
local deathScreen
local getDeathScreen = function()
	-- Try to find it now
	deathScreen = playerGui:FindFirstChild("DeathScreen")
	if not deathScreen then
		log("DeathScreen not found initially, will wait and check when needed")
	else
		log("Found DeathScreen ScreenGui")
	end
end
-- EMERGENCY MEASURE: Create a special version of the death screen we control
local ourControlledDeathScreen
-- Function to create a completely controlled death screen
local createControlledDeathScreen = function()
	-- First, remove any existing controlled screen
	if ourControlledDeathScreen and ourControlledDeathScreen:IsDescendantOf(game) then
		ourControlledDeathScreen:Destroy()
	end
	-- Now create our version
	ourControlledDeathScreen = Instance.new("ScreenGui")
	ourControlledDeathScreen.Name = "DeathScreen"
	ourControlledDeathScreen.ResetOnSpawn = false
	ourControlledDeathScreen.DisplayOrder = 100
	ourControlledDeathScreen.Enabled = false
	-- Create frame
	local frame = Instance.new("Frame")
	frame.Name = "frame"
	frame.Size = UDim2.new(0.5, 0, 0.5, 0)
	frame.Position = UDim2.new(0.25, 0, 0.25, 0)
	frame.BackgroundColor3 = Color3.new(0.1, 0.1, 0.1)
	frame.BackgroundTransparency = 0.3
	frame.BorderSizePixel = 2
	frame.Parent = ourControlledDeathScreen
	-- Create title
	local title = Instance.new("TextLabel")
	title.Name = "title"
	title.Text = "You Died"
	title.TextSize = 30
	title.TextColor3 = Color3.new(1, 0, 0)
	title.Size = UDim2.new(0.8, 0, 0.2, 0)
	title.Position = UDim2.new(0.1, 0, 0, 0)
	title.BackgroundTransparency = 1
	title.Parent = frame
	-- Create counter
	local counter = Instance.new("TextLabel")
	counter.Name = "counter"
	counter.Text = "Extra Lives: 0"
	counter.TextSize = 18
	counter.TextColor3 = Color3.new(1, 1, 1)
	counter.Size = UDim2.new(0.8, 0, 0.2, 0)
	counter.Position = UDim2.new(0.1, 0, 0.2, 0)
	counter.BackgroundTransparency = 1
	counter.Parent = frame
	-- Create revive button
	local reviveBtn = Instance.new("TextButton")
	reviveBtn.Name = "Revive"
	reviveBtn.Text = "REVIVE"
	reviveBtn.TextSize = 20
	reviveBtn.TextColor3 = Color3.new(1, 1, 1)
	reviveBtn.Size = UDim2.new(0.6, 0, 0.2, 0)
	reviveBtn.Position = UDim2.new(0.2, 0, 0.6, 0)
	reviveBtn.BackgroundColor3 = Color3.new(0.8, 0, 0)
	reviveBtn.BorderSizePixel = 0
	reviveBtn.Parent = frame
	-- Connect revive button to purchase product
	reviveBtn.Activated:Connect(function()
		log("Revive button clicked")
		MarketplaceService:PromptProductPurchase(player, REVIVE_PRODUCT_ID)
	end)
	-- Parent to PlayerGui
	ourControlledDeathScreen.Parent = playerGui
	log("Created our controlled death screen")
	return ourControlledDeathScreen
end
-- Function to force death screen visibility based on player lives and character status
-- This is our main control function for death screen visibility
local enforceCorrectDeathScreenState = function()
	-- STEP 1: Force-disable the original death screen if it exists
	local originalDeathScreen = playerGui:FindFirstChild("DeathScreen")
	if originalDeathScreen and originalDeathScreen ~= ourControlledDeathScreen then
		-- If we find the original one and it's not our controlled version, disable it
		originalDeathScreen.Enabled = false
		-- And rename it so it doesn't conflict with our screen
		originalDeathScreen.Name = "OriginalDeathScreen_Disabled"
		log("Disabled and renamed original death screen")
	end
	-- STEP 2: Check if we need to create our controlled screen
	if not ourControlledDeathScreen or not ourControlledDeathScreen:IsDescendantOf(game) then
		createControlledDeathScreen()
	end
	-- STEP 3: Update lives counter on our controlled screen
	if ourControlledDeathScreen then
		local frame = ourControlledDeathScreen:FindFirstChild("frame")
		if frame then
			local counter = frame:FindFirstChild("counter")
			if counter then
				local _condition = player:GetAttribute("ExtraLives")
				if _condition == nil then
					_condition = 0
				end
				local currentLives = _condition
				if currentLives <= 0 then
					counter.Text = "GAME OVER - No Lives Left!"
					counter.TextColor3 = Color3.new(1, 0.2, 0.2)
				elseif currentLives == 1 then
					counter.Text = "WARNING! LAST LIFE!"
					counter.TextColor3 = Color3.new(1, 0.8, 0.2)
				else
					counter.Text = `Extra Lives: {currentLives}`
					counter.TextColor3 = Color3.new(1, 1, 1)
				end
			end
		end
	end
	-- STEP 4: Check player lives, character status, and update visibility
	local _condition = player:GetAttribute("ExtraLives")
	if _condition == nil then
		_condition = 0
	end
	local currentLives = _condition
	local playerHasLives = currentLives > 0
	-- CRITICAL CHANGE: Only show death screen if player has no lives AND has no active character
	-- This fixes the issue where death screen stays visible after respawning
	local hasActiveCharacter = player.Character ~= nil and player.Character:FindFirstChild("Humanoid") ~= nil
	-- If player has respawned, they shouldn't see the death screen, even with 0 lives
	local shouldShowDeathScreen = not playerHasLives and not hasActiveCharacter
	log(`STRICT enforcement check - Lives: {currentLives}, HasCharacter: {hasActiveCharacter}, ShouldShowDeathScreen: {shouldShowDeathScreen}`)
	-- ONLY show death screen if player has no lives AND no character
	if shouldShowDeathScreen then
		-- Player has no lives and no character, death screen should be visible
		if ourControlledDeathScreen and not ourControlledDeathScreen.Enabled then
			ourControlledDeathScreen.Enabled = true
			log("Player has NO LIVES and NO CHARACTER, showing our controlled death screen")
		end
	else
		-- Player has lives or has a character, death screen should be hidden
		if ourControlledDeathScreen and ourControlledDeathScreen.Enabled then
			ourControlledDeathScreen.Enabled = false
			if hasActiveCharacter then
				log("Player HAS ACTIVE CHARACTER, hiding our controlled death screen regardless of lives")
			else
				log("Player HAS LIVES, hiding our controlled death screen")
			end
		end
	end
	-- STEP 5: Notify UIStateManager - but don't interfere with Shop state
	local uiStateManager = game:GetService("ReplicatedStorage"):FindFirstChild("UIStateManager")
	if uiStateManager then
		if shouldShowDeathScreen then
			-- If player is out of lives and has no character, show death screen
			uiStateManager:Invoke("set", "Death")
			log("Player has no lives and no character - requested Death UI state")
		else
			-- If player has lives or a character, only reset UI state if currently showing death screen
			-- Get the current state first
			local currentState = uiStateManager:Invoke("get")
			if currentState == "Death" then
				-- Only reset if we're showing the death screen
				uiStateManager:Invoke("set", "None")
				log("Player has either lives or an active character, resetting from Death UI state to None")
			elseif currentState == "Shop" then
				-- Don't interfere with Shop UI if it's currently showing
				log("Shop UI is active - preserving shop state")
			else
				log(`Current UI state is: {currentState} - not changing`)
			end
		end
	end
	return playerHasLives
end
-- SUPER AGGRESSIVE failsafe - constantly check death screen state
task.spawn(function()
	while true do
		enforceCorrectDeathScreenState()
		task.wait(0.25)
	end
end)
-- Call the function to initialize or set up a check for DeathScreen
getDeathScreen()
-- This function now returns our controlled death screen instead
local ensureDeathScreen = function()
	-- We now use our controlled death screen as the primary screen
	if not ourControlledDeathScreen or not ourControlledDeathScreen:IsDescendantOf(game) then
		createControlledDeathScreen()
	end
	-- Also make sure any other death screens are disabled
	local originalDeathScreen = playerGui:FindFirstChild("DeathScreen")
	if originalDeathScreen and originalDeathScreen ~= ourControlledDeathScreen then
		-- If it's not our controlled version, disable it
		originalDeathScreen.Enabled = false
		-- And rename it so it doesn't conflict with our screen
		originalDeathScreen.Name = "OriginalDeathScreen_Disabled"
		log("Disabled original death screen during ensureDeathScreen")
	end
	return ourControlledDeathScreen
end
-- Function to set up the death screen interface
local setupDeathScreen = function()
	local ds = ensureDeathScreen()
	if not ds then
		log("WARNING: DeathScreen still not available")
		return false
	end
	-- IMPORTANT: Make sure death screen is disabled initially
	ds.Enabled = false
	log("Disabled death screen on setup")
	-- Double-check UI state via UIStateManager
	local uiStateManager = game:GetService("ReplicatedStorage"):FindFirstChild("UIStateManager")
	if uiStateManager then
		-- Only enable death UI if player actually has no lives
		local _condition = player:GetAttribute("ExtraLives")
		if _condition == nil then
			_condition = 0
		end
		local currentLives = _condition
		if currentLives <= 0 then
			log("Player has no lives, keeping death screen enabled if needed")
		else
			-- Force None state for players with lives
			uiStateManager:Invoke("set", "None")
			log("Player has lives, forcing UI state to None")
		end
	end
	-- Get the frame
	local frame = ds:FindFirstChild("frame")
	-- If frame doesn't exist, try to create it
	if not frame then
		log("WARNING: frame not found in DeathScreen, creating one")
		-- Create a frame if it doesn't exist
		frame = Instance.new("Frame")
		frame.Name = "frame"
		frame.Size = UDim2.new(0.5, 0, 0.5, 0)
		frame.Position = UDim2.new(0.25, 0, 0.25, 0)
		frame.BackgroundColor3 = Color3.new(0.1, 0.1, 0.1)
		frame.BackgroundTransparency = 0.3
		frame.BorderSizePixel = 2
		frame.Parent = ds
		-- Create the counter TextLabel
		local counter = Instance.new("TextLabel")
		counter.Name = "counter"
		counter.Text = "Extra Lives: 0"
		counter.TextSize = 18
		counter.TextColor3 = Color3.new(1, 1, 1)
		counter.Size = UDim2.new(0.8, 0, 0.2, 0)
		counter.Position = UDim2.new(0.1, 0, 0.2, 0)
		counter.BackgroundTransparency = 1
		counter.Parent = frame
		-- Create the Revive button
		local reviveBtn = Instance.new("TextButton")
		reviveBtn.Name = "Revive"
		reviveBtn.Text = "REVIVE"
		reviveBtn.TextSize = 20
		reviveBtn.TextColor3 = Color3.new(1, 1, 1)
		reviveBtn.BackgroundColor3 = Color3.new(0.7, 0.2, 0.2)
		reviveBtn.Size = UDim2.new(0.6, 0, 0.2, 0)
		reviveBtn.Position = UDim2.new(0.2, 0, 0.6, 0)
		reviveBtn.Parent = frame
		-- Create a title/message TextLabel
		local titleLabel = Instance.new("TextLabel")
		titleLabel.Name = "n"
		titleLabel.Text = "YOU DIED"
		titleLabel.TextSize = 24
		titleLabel.TextColor3 = Color3.new(1, 0.2, 0.2)
		titleLabel.Size = UDim2.new(0.8, 0, 0.15, 0)
		titleLabel.Position = UDim2.new(0.1, 0, 0.05, 0)
		titleLabel.BackgroundTransparency = 1
		titleLabel.Parent = frame
		log("Created new frame and UI elements for DeathScreen")
	end
	-- Set up click handler for the Revive button
	local reviveButton = frame:FindFirstChild("Revive")
	if reviveButton then
		-- Check if we already set up this button
		local _value = reviveButton:GetAttribute("SetupComplete")
		if not (_value ~= 0 and _value == _value and _value ~= "" and _value) then
			reviveButton.MouseButton1Click:Connect(function()
				log("Revive button clicked")
				MarketplaceService:PromptProductPurchase(player, REVIVE_PRODUCT_ID)
			end)
			reviveButton:SetAttribute("SetupComplete", true)
			log("Revive button event handler connected")
		end
	else
		log("WARNING: Revive button not found in frame")
	end
	return true
end
-- Try to set up the death screen right away
setupDeathScreen()
-- Run our enforcement check immediately
enforceCorrectDeathScreenState()
-- Function to update lives counter
local updateLivesCounter = function()
	-- IMPORTANT: Force checking the attribute from the player
	-- This helps avoid any caching issues
	task.wait(0.1)
	local _condition = player:GetAttribute("ExtraLives")
	if _condition == nil then
		_condition = 0
	end
	local extraLives = _condition
	log(`Player has {extraLives} extra lives`)
	-- Find the counter label
	local ds = ensureDeathScreen()
	if not ds then
		return nil
	end
	local frame = ds:FindFirstChild("frame")
	if not frame then
		log("WARNING: frame not found in DeathScreen")
		return nil
	end
	-- Try to find the counter label, being case-insensitive
	-- Check all children of the frame to find a TextLabel that might be our counter
	log("Searching for counter label in frame")
	local frameChildren = frame:GetChildren()
	log(`Found {#frameChildren} children in frame`)
	-- Debugging: list all children to find the correct name
	-- ▼ ReadonlyArray.forEach ▼
	local _callback = function(child)
		log(`Child found: {child.Name} ({child.ClassName})`)
	end
	for _k, _v in frameChildren do
		_callback(_v, _k - 1, frameChildren)
	end
	-- ▲ ReadonlyArray.forEach ▲
	-- Try exact match first
	local counter = frame:FindFirstChild("counter")
	-- If not found, try case-insensitive search
	if not counter then
		-- ▼ ReadonlyArray.find ▼
		local _callback_1 = function(child)
			return child:IsA("TextLabel") and string.lower(child.Name) == "counter"
		end
		local _result
		for _i, _v in frameChildren do
			if _callback_1(_v, _i - 1, frameChildren) == true then
				_result = _v
				break
			end
		end
		-- ▲ ReadonlyArray.find ▲
		counter = _result
	end
	-- As a last resort, just look for any TextLabel that might be our counter
	if not counter then
		counter = frame:FindFirstChildWhichIsA("TextLabel")
		if counter then
			log(`Found TextLabel with name: {counter.Name}`)
		end
	end
	if counter then
		-- Different text based on lives remaining
		if extraLives <= 0 then
			counter.Text = "GAME OVER - No Lives Left!"
			counter.TextColor3 = Color3.new(1, 0.2, 0.2)
		elseif extraLives == 1 then
			counter.Text = `WARNING! LAST LIFE!`
			counter.TextColor3 = Color3.new(1, 0.5, 0)
		else
			counter.Text = `Extra Lives: {extraLives}`
			counter.TextColor3 = Color3.new(1, 1, 1)
		end
		counter.TextSize = 18
		counter.TextScaled = false
		counter.Visible = true
		log(`Updated {counter.Name} text to: {counter.Text}`)
	else
		log("ERROR: Could not find any suitable counter label in the frame")
	end
end
-- Update lives on script start
updateLivesCounter()
-- Force correct death screen state
enforceCorrectDeathScreenState()
-- Setup main character handling
local setupCharacter = function(character)
	-- IMPORTANT FIX: Even if player has 0 lives, if they have a character
	-- they should not see the death screen - this is a key fix for respawning with 0 lives
	-- Try to set up the death screen if not already done
	setupDeathScreen()
	-- Always hide death screen when player has a character, regardless of lives
	local deathScreen = playerGui:FindFirstChild("DeathScreen")
	if deathScreen then
		deathScreen.Enabled = false
		local _condition = player:GetAttribute("ExtraLives")
		if _condition == nil then
			_condition = 0
		end
		local currentLives = _condition
		log(`Hiding death screen during character setup - player has {currentLives} lives but active character`)
	end
	-- Use UIStateManager to hide death screen when character spawns
	local uiStateManager = ReplicatedStorage:FindFirstChild("UIStateManager")
	if uiStateManager then
		uiStateManager:Invoke("set", "None")
		log("Character setup - requested death screen hidden via UIStateManager")
	end
	-- Get humanoid
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if not humanoid then
		log("WARNING: Humanoid not found in character")
		return nil
	end
	-- Listen for death
	humanoid.Died:Connect(function()
		log(`Player died, updating lives counter`)
		-- Make sure death screen is set up properly
		setupDeathScreen()
		-- Update the counter
		updateLivesCounter()
		-- UI visibility is managed by UIStateManager
	end)
end
-- Listen for NoLivesRemaining event from server
local noLivesEvent = ReplicatedStorage:WaitForChild("NoLivesRemaining")
noLivesEvent.OnClientEvent:Connect(function()
	log("Received NoLivesRemaining event from server - GAME OVER")
	-- Set up the death screen contents first
	setupDeathScreen()
	local deathScreen = ensureDeathScreen()
	updateLivesCounter()
	-- Use UIStateManager to show death screen with priority
	local uiStateManager = ReplicatedStorage:FindFirstChild("UIStateManager")
	if uiStateManager then
		-- First check if shop is currently active
		local currentState = uiStateManager:Invoke("get")
		if currentState == "Shop" then
			log("Not changing UI state because shop is active, but showing death screen")
			-- Directly set our death screen visible without changing UI state
			if deathScreen then
				deathScreen.Enabled = true
			end
		else
			uiStateManager:Invoke("set", "Death")
			log("Requested death screen display via UIStateManager")
		end
	end
	-- Create a safeguard to keep death UI visible
	task.spawn(function()
		-- Keep checking to make sure death screen stays visible
		while player:GetAttribute("ExtraLives") <= 0 do
			-- Only force UI state to Death if needed and shop isn't active
			if uiStateManager then
				local currentState = uiStateManager:Invoke("get")
				if currentState ~= "Shop" then
					uiStateManager:Invoke("set", "Death")
				else
					log("Preserving shop state even though player has no lives")
				end
			end
			task.wait(0.5)
		end
		log("Stopped death screen safeguard - player has lives now")
	end)
	if deathScreen then
		-- Make sure the Revive button is prominent
		local frame = deathScreen:FindFirstChild("frame")
		if frame then
			local reviveButton = frame:FindFirstChild("Revive")
			if reviveButton then
				-- Make the button more noticeable
				reviveButton.TextColor3 = Color3.new(1, 1, 1)
				reviveButton.BackgroundColor3 = Color3.new(0.8, 0.2, 0.2)
				reviveButton.Text = "REVIVE NOW (PURCHASE)"
				-- Optional: add a pulsing effect
				task.spawn(function()
					while reviveButton:IsDescendantOf(game) do
						reviveButton.TextSize = 20
						task.wait(0.6)
						reviveButton.TextSize = 24
						task.wait(0.6)
					end
				end)
			end
			-- Update lives counter text to indicate no lives left
			local counter = frame:FindFirstChild("counter")
			if counter then
				counter.Text = "GAME OVER - No Lives Left!"
				counter.TextColor3 = Color3.new(1, 0.2, 0.2)
			end
		end
	end
end)
-- Handle player revive from purchase
local reviveEvent = ReplicatedStorage:WaitForChild("RevivePlayer")
reviveEvent.OnClientEvent:Connect(function()
	log("Player has been revived")
	-- Give a small delay to ensure lives attribute has been updated
	task.delay(0.2, function()
		-- Check if we actually have lives now
		local _condition = player:GetAttribute("ExtraLives")
		if _condition == nil then
			_condition = 0
		end
		local lives = _condition
		if lives > 0 then
			-- Only hide death screen if we actually have lives
			local uiStateManager = ReplicatedStorage:FindFirstChild("UIStateManager")
			if uiStateManager then
				uiStateManager:Invoke("set", "None")
				log("Requested death screen hide via UIStateManager - player has lives")
			end
		else
			log("Not hiding death screen - player still has no lives")
		end
		-- Update the counter with new lives
		updateLivesCounter()
	end)
end)
-- Handle current character if it exists
if player.Character then
	log("Setting up existing character")
	setupCharacter(player.Character)
end
-- Listen for character added
player.CharacterAdded:Connect(function(character)
	log("New character added, setting up")
	-- CRITICAL FIX: When a character is added, ALWAYS hide the death screen first
	-- This ensures the death screen is never showing when the player has an active character
	local ds = ensureDeathScreen()
	if ds then
		ds.Enabled = false
		log("IMMEDIATELY hiding death screen on character spawn regardless of lives")
	end
	-- Reset UI state if showing death screen
	local uiStateManager = ReplicatedStorage:FindFirstChild("UIStateManager")
	if uiStateManager then
		local currentState = uiStateManager:Invoke("get")
		if currentState == "Death" then
			uiStateManager:Invoke("set", "None")
			log("RESET UI state from Death to None on character spawn")
		end
	end
	-- Use a slight delay before running full setup to ensure all systems are ready
	task.delay(0.1, function()
		-- Run our character setup which will properly configure everything
		-- This includes disabling the death screen and setting correct UI states
		setupCharacter(character)
	end)
end)
-- Listen for attribute changes (extra lives)
player.AttributeChanged:Connect(function(attributeName)
	if attributeName == "ExtraLives" then
		updateLivesCounter()
		-- Enforce correct death screen state when lives change
		enforceCorrectDeathScreenState()
	end
end)
log("Death manager client script initialized")
