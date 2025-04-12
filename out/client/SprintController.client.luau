-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local ContextActionService = _services.ContextActionService
local getRemotes = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "GameRemotes.shared").getRemotes
-- Constants
local SPRINT_MULTIPLIER = 1.5
local DEFAULT_WALK_SPEED = 16
local SPRINT_ACTION = "PlayerSprint"
-- Get player
local player = Players.LocalPlayer
local humanoid
local normalWalkSpeed = DEFAULT_WALK_SPEED
local isSprinting = false
local canSprint = false
-- Function to handle sprint input
local function handleSprintAction(actionName, inputState, inputObject)
	-- Only sprint if player has the ability
	if not canSprint then
		return nil
	end
	-- Make sure we have a humanoid
	if not humanoid or not humanoid:IsA("Humanoid") then
		return nil
	end
	if inputState == Enum.UserInputState.Begin then
		-- Start sprinting
		normalWalkSpeed = humanoid.WalkSpeed
		humanoid.WalkSpeed = normalWalkSpeed * SPRINT_MULTIPLIER
		isSprinting = true
		print(`[SprintController] Started sprinting, speed: {humanoid.WalkSpeed}`)
	elseif inputState == Enum.UserInputState.End then
		-- Stop sprinting
		humanoid.WalkSpeed = normalWalkSpeed
		isSprinting = false
		print(`[SprintController] Stopped sprinting, restored speed: {humanoid.WalkSpeed}`)
	end
end
-- Function to initialize the controller
local function initController()
	-- Use the shared GameRemotes system to access sprint remote event
	local remotes = getRemotes()
	-- Connect to the remote to receive sprint ability updates
	remotes.sprintEnabled.OnClientEvent:Connect(function(enabled)
		print(`[SprintController] Received sprint ability status: {if enabled then "enabled" else "disabled"}`)
		canSprint = enabled
		if enabled then
			-- Bind sprint action to Shift key
			ContextActionService:BindAction(SPRINT_ACTION, handleSprintAction, false, Enum.KeyCode.LeftShift, Enum.KeyCode.RightShift)
			print("[SprintController] Sprint action bound to Shift keys")
		else
			-- Unbind if disabled
			ContextActionService:UnbindAction(SPRINT_ACTION)
			print("[SprintController] Sprint action unbound")
		end
	end)
	-- Check if player already has sprint ability (from attribute)
	local _value = player:GetAttribute("CanSprint")
	if _value ~= 0 and _value == _value and _value ~= "" and _value then
		canSprint = true
		-- Bind sprint action to Shift key
		ContextActionService:BindAction(SPRINT_ACTION, handleSprintAction, false, Enum.KeyCode.LeftShift, Enum.KeyCode.RightShift)
		print("[SprintController] Sprint ability detected from attribute, bound to Shift keys")
	end
end
-- Get humanoid when character loads
local function setupCharacter(character)
	humanoid = character:FindFirstChildOfClass("Humanoid")
	if humanoid then
		normalWalkSpeed = humanoid.WalkSpeed
		print(`[SprintController] Character loaded, base walk speed: {normalWalkSpeed}`)
	end
	-- Reset sprint state when character respawns
	if isSprinting and humanoid then
		isSprinting = false
		print("[SprintController] Reset sprint state on respawn")
	end
end
-- Set up for current character
if player.Character then
	setupCharacter(player.Character)
end
-- Connect to character added event
player.CharacterAdded:Connect(setupCharacter)
-- Initialize the controller
initController()
print("[SprintController] Sprint controller initialized")
