// On bindable event, fired by onfire.client.ts, will trigger two different tweens, Close, and Open
const plr = game.GetService("Players").LocalPlayer;
const playerGui = plr.WaitForChild("PlayerGui") as PlayerGui;
const gamepassShop = playerGui.WaitForChild("GamepassShop") as ScreenGui;
const gamepassesFrame = gamepassShop.WaitForChild("GamepassesFrame") as Frame;
const tweenService = game.GetService("TweenService");

// Create bindable event
const bindableEvent = new Instance("BindableEvent");
bindableEvent.Name = "Tweenservice";
bindableEvent.Parent = gamepassesFrame;

// Define tween properties
const openInfo = new TweenInfo(0.5, Enum.EasingStyle.Quint, Enum.EasingDirection.Out);
const closeInfo = new TweenInfo(0.5, Enum.EasingStyle.Quint, Enum.EasingDirection.In);

const openPosition = new UDim2(0.5, 0, 0.5, 0);
const closePosition = new UDim2(0.5, 0, 1.5, 0);

// Set initial position to closed
gamepassesFrame.Position = closePosition;

// Connect to the bindable event
bindableEvent.Event.Connect(() => {
	// Check if the frame is off-screen (closed)
	if (gamepassesFrame.Position.Y.Scale > 1) {
		// Open animation
		const openTween = tweenService.Create(gamepassesFrame, openInfo, { Position: openPosition });
		openTween.Play();
	} else {
		// Close animation
		const closeTween = tweenService.Create(gamepassesFrame, closeInfo, { Position: closePosition });
		closeTween.Play();
	}
});
