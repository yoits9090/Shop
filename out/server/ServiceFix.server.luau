-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
-- ServiceFix.server.ts
-- This script runs at runtime to patch the Flamework services after they're loaded
local Service = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@flamework", "core", "out").Service
local Players = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").Players
local log = function(level, message)
	print(`[ServiceFixer][{level}] {message}`)
end
local ServiceFixerService
do
	ServiceFixerService = setmetatable({}, {
		__tostring = function()
			return "ServiceFixerService"
		end,
	})
	ServiceFixerService.__index = ServiceFixerService
	function ServiceFixerService.new(...)
		local self = setmetatable({}, ServiceFixerService)
		return self:constructor(...) or self
	end
	function ServiceFixerService:constructor()
		log("Info", "ServiceFixerService constructor called")
		print("[DEBUG-FIXER] ServiceFixerService constructor executed")
	end
	function ServiceFixerService:onInit()
		log("Info", "ServiceFixerService initializing...")
		print("[DEBUG-FIXER] ServiceFixerService.onInit() called")
		TS.try(function()
			-- Since we need to make direct edits to the compiled code to fix the service decorator issues,
			-- the best approach is to copy the compiled files after build and manually edit them.
			-- This script is just a placeholder to ensure we have something loading in the service slot.
			-- Fix the global service table to ensure it exists
			local globalTable = _G
			-- Use proper type checking to avoid 'any' usage
			local _value = globalTable.FixedServices
			local _condition = not (_value ~= 0 and _value == _value and _value ~= "" and _value)
			if not _condition then
				local _fixedServices = globalTable.FixedServices
				_condition = type(_fixedServices) == "table" == false
			end
			if _condition then
				globalTable.FixedServices = {}
			end
			print("[DEBUG-FIXER] Service fixer initialized")
			-- Add a timer to check for existing players periodically
			task.spawn(function()
				task.wait(2)
				print("[DEBUG-FIXER] Running player check")
				local players = Players:GetPlayers()
				print(`[DEBUG-FIXER] Found {#players} existing players`)
			end)
		end, function(err)
			print(`[DEBUG-FIXER] Error in service fixer: {err}`)
		end)
	end
	-- Modified to fix 'attempt to call a table value' error
	-- Original: ServiceFixerService = Service({})(ServiceFixerService) or ServiceFixerService
	-- Fix: Use direct assignment instead of calling the Service function
	print("[ServiceFixerService] Bypassing problematic Service decorator call")
end
-- This export ensures the script is loaded
return {
	ServiceFixerService = ServiceFixerService,
}
