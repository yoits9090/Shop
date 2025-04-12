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

print("[OnBindable] Connected to bindableEvent.Event");
bindableEvent.Event.Connect((isEntering?: boolean) => {
	print("[OnBindable] BindableEvent fired with isEntering:", isEntering);
	const shouldOpen = isEntering === undefined || isEntering;

	if (shouldOpen) {
		print("[OnBindable] Opening shop UI");
		gamepassShop.Enabled = true;
		gamepassesFrame.Visible = true;
		const openTween = TweenService.Create(gamepassesFrame, openInfo, { Position: openPosition });
		openTween.Play();
		print("[OnBindable] Open tween played");
	} else {
		print("[OnBindable] Closing shop UI");
		const closeTween = TweenService.Create(gamepassesFrame, closeInfo, { Position: closePosition });
		closeTween.Play();
		print("[OnBindable] Close tween played");
		closeTween.Completed.Connect(() => {
			print("[OnBindable] Close tween completed, hiding GUI");
			gamepassShop.Enabled = false;
			gamepassesFrame.Visible = false;
		});
	}
});
