-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local Service = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@flamework", "core", "out").Service
local Players = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").Players
local getRemotes = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "GameRemotes.shared").getRemotes
-- Player type is global; no import needed
local DeathService
do
	DeathService = setmetatable({}, {
		__tostring = function()
			return "DeathService"
		end,
	})
	DeathService.__index = DeathService
	function DeathService.new(...)
		local self = setmetatable({}, DeathService)
		return self:constructor(...) or self
	end
	function DeathService:constructor()
		self.remotes = getRemotes()
		self.DEFAULT_LIVES = 0
	end
	function DeathService:onInit()
		-- Initialize existing players
		local _exp = Players:GetPlayers()
		-- ▼ ReadonlyArray.forEach ▼
		local _callback = function(player)
			return self:initPlayer(player)
		end
		for _k, _v in _exp do
			_callback(_v, _k - 1, _exp)
		end
		-- ▲ ReadonlyArray.forEach ▲
		Players.PlayerAdded:Connect(function(player)
			return self:initPlayer(player)
		end)
		-- Handle respawn requests from client
		self.remotes.respawnRequest.OnServerInvoke = function(player)
			local _condition = player:GetAttribute("AllowRespawn")
			if _condition == nil then
				_condition = true
			end
			local allow = _condition
			if not allow then
				-- remind client they're out of lives
				self.remotes.noLivesRemaining:FireClient(player)
			end
			return allow
		end
	end
	function DeathService:initPlayer(player)
		-- Set defaults if not present
		if player:GetAttribute("ExtraLives") == nil then
			player:SetAttribute("ExtraLives", self.DEFAULT_LIVES)
		end
		if player:GetAttribute("AllowRespawn") == nil then
			player:SetAttribute("AllowRespawn", true)
		end
		-- Hook death on each character
		player.CharacterAdded:Connect(function(character)
			return self:onCharacterAdded(player, character)
		end)
	end
	function DeathService:onCharacterAdded(player, character)
		local humanoid = character:WaitForChild("Humanoid")
		humanoid.Died:Connect(function()
			return self:handleDeath(player)
		end)
	end
	function DeathService:handleDeath(player)
		local _condition = (player:GetAttribute("ExtraLives"))
		if _condition == nil then
			_condition = 0
		end
		local lives = _condition
		if lives > 0 then
			-- Consume a life
			player:SetAttribute("ExtraLives", lives - 1)
		else
			-- No lives: block respawn and notify client
			player:SetAttribute("AllowRespawn", false)
			self.remotes.noLivesRemaining:FireClient(player)
			self.remotes.preventRespawn:FireClient(player)
		end
	end
	function DeathService:revive(player, amount)
		if amount == nil then
			amount = 1
		end
		local _condition = (player:GetAttribute("ExtraLives"))
		if _condition == nil then
			_condition = 0
		end
		local current = _condition
		player:SetAttribute("ExtraLives", current + amount)
		player:SetAttribute("AllowRespawn", true)
		-- Force respawn
		player:LoadCharacter()
	end
	DeathService = Service()(DeathService) or DeathService
end
return {
	DeathService = DeathService,
}
