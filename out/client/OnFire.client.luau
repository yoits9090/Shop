-- Compiled with roblox-ts v3.0.0
-- On fire, will find in player gui the frame, "GamepassShop" --> GamepassesFrame and trigger a bindable event to another script
local plr = game:GetService("Players").LocalPlayer
print("[OnFire] Client script running for player:", plr.Name)
local playerGui = plr:WaitForChild("PlayerGui")
print("[OnFire] PlayerGui found")
local gamepassShop = playerGui:WaitForChild("GamepassShop")
if not gamepassShop then
	warn("[OnFire] GamepassShop GUI not found in PlayerGui; ensure it's placed in StarterGui")
else
	print("[OnFire] GamepassShop ScreenGui found")
	-- const gamepassesFrame = gamepassShop.WaitForChild("GamepassesFrame") as Frame;
	print("[OnFire] GamepassesFrame found")
	local bindableEvent = gamepassShop:WaitForChild("Tweenservice")
	print("[OnFire] Tweenservice BindableEvent found:", bindableEvent ~= nil)
	local replicatedStorage = game:GetService("ReplicatedStorage")
	local remotesFolder = replicatedStorage:WaitForChild("GameRemotes")
	local shopOpen = remotesFolder:WaitForChild("ShopOpen")
	print("[OnFire] ShopOpen RemoteEvent found in GameRemotes")
	print("[OnFire] Connected to OnClientEvent")
	shopOpen.OnClientEvent:Connect(function(isEntering)
		print("[OnFire] OnClientEvent fired with isEntering:", isEntering)
		if bindableEvent then
			print("[OnFire] Firing bindableEvent with isEntering:", isEntering)
			bindableEvent:Fire(isEntering)
		else
			print("[OnFire] ERROR: bindableEvent not found when trying to fire")
		end
	end)
end
