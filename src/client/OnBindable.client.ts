// On bindable event, fired by onfire.client.ts, will trigger two different tweens, Close, and Open
const Players = game.GetService("Players");
const TweenService = game.GetService("TweenService");

const player = Players.LocalPlayer;
print("[OnBindable] Client script running for player:", player.Name);

const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;
print("[OnBindable] PlayerGui found");

const gamepassShop = playerGui.WaitForChild("GamepassShop") as ScreenGui;
print("[OnBindable] GamepassShop ScreenGui found");

const gamepassesFrame = gamepassShop.WaitForChild("GamepassesFrame") as Frame;
print("[OnBindable] GamepassesFrame found");

// Close button handler
const closeButton = gamepassShop.WaitForChild("Close") as TextButton;
if (closeButton) {
    closeButton.Activated.Connect(() => {
        print("[OnBindable] Close button clicked");
        const closeTween = TweenService.Create(gamepassesFrame, closeInfo, { Position: closePosition });
        closeTween.Play();
        closeTween.Completed.Connect(() => {
            gamepassShop.Enabled = false;
            gamepassesFrame.Visible = false;
            print("[OnBindable] Closed via close button");
        });
    });
}

// IMPORTANT: Check if the BindableEvent is being looked for in the right place
// Note: In OnFire.client.ts you're using FindFirstChild on gamepassesFrame
// But here you're using WaitForChild on gamepassShop
const bindableEvent = gamepassShop.WaitForChild("Tweenservice") as BindableEvent;
print("[OnBindable] Tweenservice BindableEvent found");

const openInfo = new TweenInfo(0.5, Enum.EasingStyle.Quint, Enum.EasingDirection.Out);
const closeInfo = new TweenInfo(0.5, Enum.EasingStyle.Quint, Enum.EasingDirection.In);

const openPosition = new UDim2(0.5, 0, 0.5, 0);
const closePosition = new UDim2(0.5, 0, 1.5, 0);

// Set the anchor point to center the frame
gamepassesFrame.AnchorPoint = new Vector2(0.5, 0.5);

// Initial position and visibility
gamepassesFrame.Position = closePosition;
gamepassesFrame.Visible = false;
gamepassShop.Enabled = false;

// Get access to the UI state manager
const ReplicatedStorage = game.GetService("ReplicatedStorage");

// Attempt to find or wait for the UIStateManager
let stateManager: BindableFunction | undefined;

// Function to get the state manager
const getStateManager = (): BindableFunction | undefined => {
	if (stateManager) return stateManager;
	
	// Try to find the manager
	stateManager = ReplicatedStorage.FindFirstChild("UIStateManager") as BindableFunction;
	return stateManager;
};

print("[OnBindable] Connected to bindableEvent.Event");
bindableEvent.Event.Connect((isEntering?: boolean) => {
	print("[OnBindable] BindableEvent fired with isEntering:", isEntering);
	const shouldOpen = isEntering === undefined || isEntering;

	if (shouldOpen) {
		print("[OnBindable] Opening shop UI");
		
		// Attempt to set the UI state through the state manager
		const manager = getStateManager();
		if (manager) {
			const result = manager.Invoke("set", "Shop");
			print(`[OnBindable] Set UI state to Shop: ${result}`);
			
			// If state manager allowed the change, animate the frame
			if (result) {
				gamepassesFrame.Visible = true;
				const openTween = TweenService.Create(gamepassesFrame, openInfo, { Position: openPosition });
				openTween.Play();
				print("[OnBindable] Open tween played");
			}
		} else {
			// Fallback if state manager is not available
			print("[OnBindable] UIStateManager not found, using direct control");
			gamepassShop.Enabled = true;
			gamepassesFrame.Visible = true;
			const openTween = TweenService.Create(gamepassesFrame, openInfo, { Position: openPosition });
			openTween.Play();
			print("[OnBindable] Open tween played");
		}
	} else {
		print("[OnBindable] Closing shop UI");
		
		// Animate the closing regardless of state manager
		const closeTween = TweenService.Create(gamepassesFrame, closeInfo, { Position: closePosition });
		closeTween.Play();
		print("[OnBindable] Close tween played");
		
		closeTween.Completed.Connect(() => {
			print("[OnBindable] Close tween completed, hiding UI");
			
			// Set state to None through the manager
			const manager = getStateManager();
			if (manager) {
				manager.Invoke("set", "None");
				print("[OnBindable] Set UI state to None");
			} else {
				// Fallback if manager not available
				gamepassShop.Enabled = false;
				gamepassesFrame.Visible = false;
			}
		});
	}
});
