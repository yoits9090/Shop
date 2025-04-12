-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local RunService = _services.RunService
local ReplicatedStorage = _services.ReplicatedStorage
local UserInputService = _services.UserInputService
-- Simple logger function
local log = function(message)
	print(`[RespawnController] {message}`)
end
log("Starting RespawnController client script")
-- Get local player
local player = Players.LocalPlayer
log(`Script running for player: {player.Name}`)
-- Create a flag to track if player is out of lives
local outOfLives = false
-- Wait for the respawn function from the server
local respawnFunction = ReplicatedStorage:WaitForChild("RespawnFunction")
-- Listen for NoLivesRemaining event
local noLivesEvent = ReplicatedStorage:WaitForChild("NoLivesRemaining")
noLivesEvent.OnClientEvent:Connect(function()
	log("Player has no lives remaining - will prevent auto-respawn")
	outOfLives = true
	-- Enforce UI state to Death
	local uiStateManager = ReplicatedStorage:FindFirstChild("UIStateManager")
	if uiStateManager then
		local result = uiStateManager:Invoke("set", "Death")
		log(`Updated UI state to Death: {result}`)
	end
end)
-- Listen for PreventAutoRespawn event
player.ChildAdded:Connect(function(child)
	if child.Name == "PreventAutoRespawn" and child:IsA("RemoteEvent") then
		log("Received PreventAutoRespawn event")
		outOfLives = true
		-- Connect to prevent spawning
		local preventEvent = child
		preventEvent.OnClientEvent:Connect(function()
			log("Explicit prevent auto-respawn message received")
			outOfLives = true
		end)
	end
end)
-- Listen for DeadPlayer tag removal
player.ChildRemoved:Connect(function(child)
	if child.Name == "DeadPlayer" then
		log("DeadPlayer tag removed - player can respawn again")
		outOfLives = false
	end
	if child.Name == "PreventAutoRespawn" then
		log("PreventAutoRespawn event removed - player can respawn again")
		outOfLives = false
	end
end)
-- Override the built-in respawn button
UserInputService.InputBegan:Connect(function(input)
	if input.KeyCode == Enum.KeyCode.R or input.KeyCode == Enum.KeyCode.ButtonY then
		if outOfLives then
			log("Blocking respawn key press - player has no lives")
			-- Check with server if respawn is allowed
			local canRespawn = respawnFunction:InvokeServer()
			if not canRespawn then
				log("Server confirmed player cannot respawn")
				return nil
			end
		end
	end
end)
-- These are advanced Roblox API hooks that aren't fully supported in roblox-ts typing
-- We're using a more compatible approach instead
log("Using compatible respawn prevention approach")
-- Monitor player's character state
RunService.Heartbeat:Connect(function()
	-- If player is out of lives and tries to respawn, prevent it
	if outOfLives and not player.Character then
		-- Ask server if respawn is allowed
		local canRespawn = respawnFunction:InvokeServer()
		if not canRespawn then
			-- Player shouldn't respawn, make sure UI stays in death state
			local uiStateManager = ReplicatedStorage:FindFirstChild("UIStateManager")
			if uiStateManager then
				uiStateManager:Invoke("set", "Death")
			end
		end
	end
end)
log("RespawnController initialized")
