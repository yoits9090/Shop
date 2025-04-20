-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
-- Full rewrite: Lean, event-driven DeathController
local Service = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@flamework", "core", "out").Service
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local ReplicatedStorage = _services.ReplicatedStorage
local UserInputService = _services.UserInputService
local RunService = _services.RunService
local MarketplaceService = _services.MarketplaceService
local TeleportService = _services.TeleportService
local getRemotes = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "GameRemotes.shared").getRemotes
local REVIVE_PRODUCT_ID = 3261484228
local LOBBY_PLACE_ID = 100501279549809
local DeathController
do
	DeathController = setmetatable({}, {
		__tostring = function()
			return "DeathController"
		end,
	})
	DeathController.__index = DeathController
	function DeathController.new(...)
		local self = setmetatable({}, DeathController)
		return self:constructor(...) or self
	end
	function DeathController:constructor()
		self.remotes = getRemotes()
		self.player = Players.LocalPlayer
		self.outOfLives = false
		self.uiState = ReplicatedStorage:WaitForChild("UIStateManager")
	end
	function DeathController:onInit()
		self:setupDeathUI()
		self:bindEvents()
	end
	function DeathController:setupDeathUI()
		local gui = Instance.new("ScreenGui")
		gui.Name = "DeathScreen"
		gui.ResetOnSpawn = false
		gui.DisplayOrder = 100
		gui.Enabled = false
		gui.Parent = self.player:WaitForChild("PlayerGui")
		local frame = Instance.new("Frame")
		frame.Size = UDim2.new(0.5, 0, 0.5, 0)
		frame.Position = UDim2.new(0.25, 0, 0.25, 0)
		frame.BackgroundColor3 = Color3.new(0, 0, 0)
		frame.BackgroundTransparency = 0.5
		frame.Parent = gui
		-- Style frame: rounded corners + outline
		local frameUICorner = Instance.new("UICorner")
		frameUICorner.CornerRadius = UDim.new(0, 12)
		frameUICorner.Parent = frame
		local frameStroke = Instance.new("UIStroke")
		frameStroke.Color = Color3.new(1, 1, 1)
		frameStroke.Thickness = 2
		frameStroke.Parent = frame
		local title = Instance.new("TextLabel")
		title.Size = UDim2.new(1, 0, 0.2, 0)
		title.Text = "You Died"
		title.TextSize = 32
		title.TextColor3 = Color3.new(1, 0, 0)
		title.BackgroundTransparency = 1
		title.Parent = frame
		-- Outline title text for readability
		local titleStroke = Instance.new("UIStroke")
		titleStroke.Color = Color3.new(0, 0, 0)
		titleStroke.Thickness = 1
		titleStroke.Parent = title
		self.counterLabel = Instance.new("TextLabel")
		self.counterLabel.Size = UDim2.new(1, 0, 0.2, 0)
		self.counterLabel.Position = UDim2.new(0, 0, 0.2, 0)
		self.counterLabel.TextSize = 24
		self.counterLabel.TextColor3 = Color3.new(1, 1, 1)
		self.counterLabel.BackgroundTransparency = 1
		self.counterLabel.Parent = frame
		-- Outline counter text
		local counterStroke = Instance.new("UIStroke")
		counterStroke.Color = Color3.new(0, 0, 0)
		counterStroke.Thickness = 1
		counterStroke.Parent = self.counterLabel
		self.reviveButton = Instance.new("TextButton")
		self.reviveButton.Size = UDim2.new(0.6, 0, 0.2, 0)
		self.reviveButton.Position = UDim2.new(0.2, 0, 0.7, 0)
		self.reviveButton.Text = "REVIVE"
		self.reviveButton.TextSize = 24
		self.reviveButton.BackgroundColor3 = Color3.new(0.2, 0.6, 0.8)
		self.reviveButton.Parent = frame
		-- Style revive button
		local reviveUICorner = Instance.new("UICorner")
		reviveUICorner.CornerRadius = UDim.new(0, 8)
		reviveUICorner.Parent = self.reviveButton
		local reviveStroke = Instance.new("UIStroke")
		reviveStroke.Color = Color3.new(1, 1, 1)
		reviveStroke.Thickness = 1
		reviveStroke.Parent = self.reviveButton
		self.reviveButton.Activated:Connect(function()
			MarketplaceService:PromptProductPurchase(self.player, REVIVE_PRODUCT_ID)
		end)
		-- Return to Lobby button
		local returnButton = Instance.new("TextButton")
		returnButton.Size = UDim2.new(0.6, 0, 0.2, 0)
		returnButton.Position = UDim2.new(0.2, 0, 0.85, 0)
		returnButton.Text = "GO BACK TO LOBBY"
		returnButton.TextSize = 24
		returnButton.BackgroundColor3 = Color3.new(0.8, 0.2, 0.2)
		returnButton.Parent = frame
		-- Style return button
		local returnUICorner = Instance.new("UICorner")
		returnUICorner.CornerRadius = UDim.new(0, 8)
		returnUICorner.Parent = returnButton
		local returnStroke = Instance.new("UIStroke")
		returnStroke.Color = Color3.new(1, 1, 1)
		returnStroke.Thickness = 1
		returnStroke.Parent = returnButton
		returnButton.Activated:Connect(function()
			TeleportService:Teleport(LOBBY_PLACE_ID, self.player)
		end)
		self.deathScreen = gui
	end
	function DeathController:bindEvents()
		self.player:GetAttributeChangedSignal("ExtraLives"):Connect(function()
			if self.outOfLives then
				self:updateDeathUI()
			else
				self:hideDeathScreen()
			end
		end)
		self.remotes.noLivesRemaining.OnClientEvent:Connect(function()
			self.outOfLives = true
			self:updateDeathUI()
		end)
		self.remotes.preventRespawn.OnClientEvent:Connect(function()
			self.outOfLives = true
			self:updateDeathUI()
		end)
		UserInputService.InputBegan:Connect(function(input)
			if (input.KeyCode == Enum.KeyCode.R or input.KeyCode == Enum.KeyCode.ButtonY) and self.outOfLives then
				local can = self.remotes.respawnRequest:InvokeServer()
				if not can then
					self:updateDeathUI()
				end
			end
		end)
		RunService.RenderStepped:Connect(function()
			if self.outOfLives and not self.player.Character then
				local can = self.remotes.respawnRequest:InvokeServer()
				if not can then
					self:updateDeathUI()
				end
			end
		end)
	end
	function DeathController:updateDeathUI()
		local _condition = (self.player:GetAttribute("ExtraLives"))
		if _condition == nil then
			_condition = 0
		end
		local lives = _condition
		self.counterLabel.Text = `Extra Lives: {lives}`
		self.uiState:Invoke("set", "Death")
		self.deathScreen.Enabled = true
	end
	function DeathController:hideDeathScreen()
		self.deathScreen.Enabled = false
		self.uiState:Invoke("set", "None")
		self.outOfLives = false
	end
	DeathController = Service()(DeathController) or DeathController
end
return {
	DeathController = DeathController,
}
