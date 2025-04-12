import { Players, ContextActionService } from "@rbxts/services";
import { getRemotes } from "../shared/GameRemotes.shared";

// Constants
const SPRINT_MULTIPLIER = 1.5;
const DEFAULT_WALK_SPEED = 16;
const SPRINT_ACTION = "PlayerSprint";

// Get player
const player = Players.LocalPlayer;
let humanoid: Humanoid | undefined;
let normalWalkSpeed = DEFAULT_WALK_SPEED;
let isSprinting = false;
let canSprint = false;

// Function to handle sprint input
function handleSprintAction(actionName: string, inputState: Enum.UserInputState, inputObject: InputObject): void {
	// Only sprint if player has the ability
	if (!canSprint) return;

	// Make sure we have a humanoid
	if (!humanoid || !humanoid.IsA("Humanoid")) return;

	if (inputState === Enum.UserInputState.Begin) {
		// Start sprinting
		normalWalkSpeed = humanoid.WalkSpeed; // Store current speed
		humanoid.WalkSpeed = normalWalkSpeed * SPRINT_MULTIPLIER;
		isSprinting = true;
		print(`[SprintController] Started sprinting, speed: ${humanoid.WalkSpeed}`);
	} else if (inputState === Enum.UserInputState.End) {
		// Stop sprinting
		humanoid.WalkSpeed = normalWalkSpeed;
		isSprinting = false;
		print(`[SprintController] Stopped sprinting, restored speed: ${humanoid.WalkSpeed}`);
	}
}

// Function to initialize the controller
function initController(): void {
	// Use the shared GameRemotes system to access sprint remote event
	const remotes = getRemotes();

	// Connect to the remote to receive sprint ability updates
	remotes.sprintEnabled.OnClientEvent.Connect((enabled: boolean) => {
		print(`[SprintController] Received sprint ability status: ${enabled ? "enabled" : "disabled"}`);
		canSprint = enabled;

		if (enabled) {
			// Bind sprint action to Shift key
			ContextActionService.BindAction(
				SPRINT_ACTION,
				handleSprintAction,
				false,
				Enum.KeyCode.LeftShift,
				Enum.KeyCode.RightShift,
			);
			print("[SprintController] Sprint action bound to Shift keys");
		} else {
			// Unbind if disabled
			ContextActionService.UnbindAction(SPRINT_ACTION);
			print("[SprintController] Sprint action unbound");
		}
	});

	// Check if player already has sprint ability (from attribute)
	if (player.GetAttribute("CanSprint")) {
		canSprint = true;
		// Bind sprint action to Shift key
		ContextActionService.BindAction(
			SPRINT_ACTION,
			handleSprintAction,
			false,
			Enum.KeyCode.LeftShift,
			Enum.KeyCode.RightShift,
		);
		print("[SprintController] Sprint ability detected from attribute, bound to Shift keys");
	}
}

// Get humanoid when character loads
function setupCharacter(character: Model): void {
	humanoid = character.FindFirstChildOfClass("Humanoid") as Humanoid;
	if (humanoid) {
		normalWalkSpeed = humanoid.WalkSpeed;
		print(`[SprintController] Character loaded, base walk speed: ${normalWalkSpeed}`);
	}

	// Reset sprint state when character respawns
	if (isSprinting && humanoid) {
		isSprinting = false;
		print("[SprintController] Reset sprint state on respawn");
	}
}

// Set up for current character
if (player.Character) {
	setupCharacter(player.Character);
}

// Connect to character added event
player.CharacterAdded.Connect(setupCharacter);

// Initialize the controller
initController();

print("[SprintController] Sprint controller initialized");
