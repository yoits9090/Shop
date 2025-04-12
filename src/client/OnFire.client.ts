// On fire, will find in player gui the frame, "GamepassShop" --> GamepassesFrame and trigger a bindable event to another script
const plr = game.GetService("Players").LocalPlayer;
const playerGui = plr.WaitForChild("PlayerGui") as PlayerGui;
const gamepassShop = playerGui.WaitForChild("GamepassShop") as ScreenGui;
const gamepassesFrame = gamepassShop.WaitForChild("GamepassesFrame") as Frame;
const bindableEvent = gamepassesFrame.FindFirstChild("Tweenservice") as BindableEvent;
const replicatedStorage = game.GetService("ReplicatedStorage");
const shopdetect = replicatedStorage.WaitForChild("ShopDetected") as RemoteEvent;

shopdetect.OnClientEvent.Connect(() => {
	if (bindableEvent) {
		bindableEvent.Fire();
	}
});
