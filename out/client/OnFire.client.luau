-- Compiled with roblox-ts v3.0.0
-- On fire, will find in player gui the frame, "GamepassShop" --> GamepassesFrame and trigger a bindable event to another script
local plr = game:GetService("Players").LocalPlayer
print("[OnFire] Client script running for player:", plr.Name)
local playerGui = plr:WaitForChild("PlayerGui")
print("[OnFire] PlayerGui found")
local gamepassShop = playerGui:WaitForChild("GamepassShop")
print("[OnFire] GamepassShop ScreenGui found")
-- const gamepassesFrame = gamepassShop.WaitForChild("GamepassesFrame") as Frame;
print("[OnFire] GamepassesFrame found")
local bindableEvent = gamepassShop:WaitForChild("Tweenservice")
print("[OnFire] Tweenservice BindableEvent found:", bindableEvent ~= nil)
local replicatedStorage = game:GetService("ReplicatedStorage")
local shopOpen = replicatedStorage:WaitForChild("ShopOpen")
print("[OnFire] ShopOpen RemoteEvent found")
print("[OnFire] Connected to OnClientEvent")
shopOpen.OnClientEvent:Connect(function(isEntering)
	print("[OnFire] OnClientEvent fired with isEntering:", isEntering)
	if bindableEvent then
		print("[OnFire] Firing bindableEvent with isEntering:", isEntering)
		-- Pass the isEntering parameter to the bindable event
		-- This lets OnBindable.client.ts know if we're entering or leaving
		bindableEvent:Fire(isEntering)
	else
		print("[OnFire] ERROR: bindableEvent not found when trying to fire")
	end
end)
