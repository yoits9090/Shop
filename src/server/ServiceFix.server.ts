// ServiceFix.server.ts
// This script runs at runtime to patch the Flamework services after they're loaded

import { Service } from "@flamework/core";
import { Players } from "@rbxts/services";

const log = (level: "Info" | "Warn" | "Error" | "Debug", message: string) => {
	print(`[ServiceFixer][${level}] ${message}`);
};

@Service({})
class ServiceFixerService {
	constructor() {
		log("Info", "ServiceFixerService constructor called");
		print("[DEBUG-FIXER] ServiceFixerService constructor executed");
	}

	onInit(): void {
		log("Info", "ServiceFixerService initializing...");
		print("[DEBUG-FIXER] ServiceFixerService.onInit() called");
		
		try {
			// Since we need to make direct edits to the compiled code to fix the service decorator issues,
			// the best approach is to copy the compiled files after build and manually edit them.
			// This script is just a placeholder to ensure we have something loading in the service slot.
			
			// Fix the global service table to ensure it exists
			const globalTable = _G as unknown as Record<string, unknown>;
			
			// Use proper type checking to avoid 'any' usage
			if (!globalTable.FixedServices || typeIs(globalTable.FixedServices, "table") === false) {
				globalTable.FixedServices = {} as unknown;
			}
			
			print("[DEBUG-FIXER] Service fixer initialized");
			
			// Add a timer to check for existing players periodically
			task.spawn(() => {
				task.wait(2); // Give time for other services to initialize
				print("[DEBUG-FIXER] Running player check");
				const players = Players.GetPlayers();
				print(`[DEBUG-FIXER] Found ${players.size()} existing players`);
			});
		} catch (err) {
			print(`[DEBUG-FIXER] Error in service fixer: ${err}`);
		}
	}
}

// This export ensures the script is loaded
export { ServiceFixerService };
