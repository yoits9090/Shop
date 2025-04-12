-- Compiled with roblox-ts v3.0.0
-- On bindable event, fired by onfire.client.ts, will trigger two different tweens, Close, and Open
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local player = Players.LocalPlayer
print("[OnBindable] Client script running for player:", player.Name)
local playerGui = player:WaitForChild("PlayerGui")
print("[OnBindable] PlayerGui found")
local gamepassShop = playerGui:WaitForChild("GamepassShop")
print("[OnBindable] GamepassShop ScreenGui found")
local gamepassesFrame = gamepassShop:WaitForChild("GamepassesFrame")
print("[OnBindable] GamepassesFrame found")
-- IMPORTANT: Check if the BindableEvent is being looked for in the right place
-- Note: In OnFire.client.ts you're using FindFirstChild on gamepassesFrame
-- But here you're using WaitForChild on gamepassShop
local bindableEvent = gamepassShop:WaitForChild("Tweenservice")
print("[OnBindable] Tweenservice BindableEvent found")
local openInfo = TweenInfo.new(0.5, Enum.EasingStyle.Quint, Enum.EasingDirection.Out)
local closeInfo = TweenInfo.new(0.5, Enum.EasingStyle.Quint, Enum.EasingDirection.In)
local openPosition = UDim2.new(0.5, 0, 0.5, 0)
local closePosition = UDim2.new(0.5, 0, 1.5, 0)
-- Set the anchor point to center the frame
gamepassesFrame.AnchorPoint = Vector2.new(0.5, 0.5)
-- Initial position and visibility
gamepassesFrame.Position = closePosition
gamepassesFrame.Visible = false
gamepassShop.Enabled = false
-- Get access to the UI state manager
local ReplicatedStorage = game:GetService("ReplicatedStorage")
-- Attempt to find or wait for the UIStateManager
local stateManager
-- Function to get the state manager
local getStateManager = function()
	if stateManager then
		return stateManager
	end
	-- Try to find the manager
	stateManager = ReplicatedStorage:FindFirstChild("UIStateManager")
	return stateManager
end
print("[OnBindable] Connected to bindableEvent.Event")
bindableEvent.Event:Connect(function(isEntering)
	print("[OnBindable] BindableEvent fired with isEntering:", isEntering)
	local shouldOpen = isEntering == nil or isEntering
	if shouldOpen then
		print("[OnBindable] Opening shop UI")
		-- Attempt to set the UI state through the state manager
		local manager = getStateManager()
		if manager then
			local result = manager:Invoke("set", "Shop")
			print(`[OnBindable] Set UI state to Shop: {result}`)
			-- If state manager allowed the change, animate the frame
			if result ~= 0 and result == result and result ~= "" and result then
				gamepassesFrame.Visible = true
				local openTween = TweenService:Create(gamepassesFrame, openInfo, {
					Position = openPosition,
				})
				openTween:Play()
				print("[OnBindable] Open tween played")
			end
		else
			-- Fallback if state manager is not available
			print("[OnBindable] UIStateManager not found, using direct control")
			gamepassShop.Enabled = true
			gamepassesFrame.Visible = true
			local openTween = TweenService:Create(gamepassesFrame, openInfo, {
				Position = openPosition,
			})
			openTween:Play()
			print("[OnBindable] Open tween played")
		end
	else
		print("[OnBindable] Closing shop UI")
		-- Animate the closing regardless of state manager
		local closeTween = TweenService:Create(gamepassesFrame, closeInfo, {
			Position = closePosition,
		})
		closeTween:Play()
		print("[OnBindable] Close tween played")
		closeTween.Completed:Connect(function()
			print("[OnBindable] Close tween completed, hiding UI")
			-- Set state to None through the manager
			local manager = getStateManager()
			if manager then
				manager:Invoke("set", "None")
				print("[OnBindable] Set UI state to None")
			else
				-- Fallback if manager not available
				gamepassShop.Enabled = false
				gamepassesFrame.Visible = false
			end
		end)
	end
end)
