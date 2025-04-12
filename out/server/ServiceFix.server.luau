-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
-- ServiceFix.server.ts - Direct sprint enabler for gamepass owners
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local MarketplaceService = _services.MarketplaceService
local getRemotes = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "GameRemotes.shared").getRemotes
-- Get the remotes system
local remotes = getRemotes()
-- This script runs on the server and enables sprint only for players with the sprint gamepass
print("[SprintFix] Starting sprint fix script")
-- Sprint gamepass ID
local SPRINT_GAMEPASS_ID = 1151894037
-- Function to check if a player owns the sprint gamepass and enable it if they do
local function checkAndEnableSprint(player)
	-- Use pcall to safely check ownership
	local success, ownsGamepass = pcall(function()
		return MarketplaceService:UserOwnsGamePassAsync(player.UserId, SPRINT_GAMEPASS_ID)
	end)
	if success and ownsGamepass then
		-- Set the attribute that the client checks for
		player:SetAttribute("CanSprint", true)
		-- Tell the client that sprint is enabled
		remotes.sprintEnabled:FireClient(player, true)
		print(`[SprintFix] Enabled sprint for {player.Name} (has gamepass)`)
	else
		-- Make sure sprint is disabled for players without the gamepass
		player:SetAttribute("CanSprint", false)
		remotes.sprintEnabled:FireClient(player, false)
		print(`[SprintFix] Sprint disabled for {player.Name} (no gamepass)`)
	end
end
-- Check and enable sprint for all existing players
local _exp = Players:GetPlayers()
for _k, _v in _exp do
	checkAndEnableSprint(_v, _k - 1, _exp)
end
-- Check and enable sprint for any new players who join
Players.PlayerAdded:Connect(checkAndEnableSprint)
-- Set up character respawn handling
Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(function()
		-- Small delay to ensure client is ready
		task.wait(0.5)
		-- Re-check gamepass ownership and re-enable sprint after respawn if they own it
		local success, ownsGamepass = pcall(function()
			return MarketplaceService:UserOwnsGamePassAsync(player.UserId, SPRINT_GAMEPASS_ID)
		end)
		if success and ownsGamepass then
			-- Re-enable sprint after respawn
			remotes.sprintEnabled:FireClient(player, true)
			print(`[SprintFix] Re-enabled sprint after respawn for {player.Name} (has gamepass)`)
		end
	end)
end)
print("[SprintFix] Sprint fix initialized and running")
-- No need to export anything
