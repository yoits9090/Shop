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
print("[OnBindable] Connected to bindableEvent.Event")
bindableEvent.Event:Connect(function(isEntering)
	print("[OnBindable] BindableEvent fired with isEntering:", isEntering)
	local shouldOpen = isEntering == nil or isEntering
	if shouldOpen then
		print("[OnBindable] Opening shop UI")
		gamepassShop.Enabled = true
		gamepassesFrame.Visible = true
		local openTween = TweenService:Create(gamepassesFrame, openInfo, {
			Position = openPosition,
		})
		openTween:Play()
		print("[OnBindable] Open tween played")
	else
		print("[OnBindable] Closing shop UI")
		local closeTween = TweenService:Create(gamepassesFrame, closeInfo, {
			Position = closePosition,
		})
		closeTween:Play()
		print("[OnBindable] Close tween played")
		closeTween.Completed:Connect(function()
			print("[OnBindable] Close tween completed, hiding GUI")
			gamepassShop.Enabled = false
			gamepassesFrame.Visible = false
		end)
	end
end)
