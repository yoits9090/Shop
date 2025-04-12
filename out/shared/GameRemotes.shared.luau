-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local ReplicatedStorage = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").ReplicatedStorage
--[[
	*
	 * Centralized repository for all game remote events
	 * This ensures that all remotes are created once and accessible from both server and client
	 
]]
local GameRemotes
do
	GameRemotes = setmetatable({}, {
		__tostring = function()
			return "GameRemotes"
		end,
	})
	GameRemotes.__index = GameRemotes
	function GameRemotes.new(...)
		local self = setmetatable({}, GameRemotes)
		return self:constructor(...) or self
	end
	function GameRemotes:constructor()
		-- Check if remotes folder already exists
		local remotesFolder = ReplicatedStorage:FindFirstChild("GameRemotes")
		if not remotesFolder then
			-- Create a new folder for all game remotes
			remotesFolder = Instance.new("Folder")
			remotesFolder.Name = "GameRemotes"
			remotesFolder.Parent = ReplicatedStorage
		end
		self._folder = remotesFolder
		-- Create or get all remote events
		self.sprintEnabled = self:getOrCreateRemote("SprintEnabled")
		self.applyEffect = self:getOrCreateRemote("ApplyEffect")
		self.notifyPurchase = self:getOrCreateRemote("NotifyPurchase")
	end
	function GameRemotes:getOrCreateRemote(name)
		local remote = self._folder:FindFirstChild(name)
		if not remote then
			remote = Instance.new("RemoteEvent")
			remote.Name = name
			remote.Parent = self._folder
		end
		return remote
	end
	function GameRemotes:getInstance()
		if not GameRemotes._instance then
			GameRemotes._instance = GameRemotes.new()
		end
		return GameRemotes._instance
	end
end
-- Export a convenience function to get remotes
local getRemotes = function()
	return GameRemotes:getInstance()
end
return {
	GameRemotes = GameRemotes,
	getRemotes = getRemotes,
}
