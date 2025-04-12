// On fire, will find in player gui the frame, "GamepassShop" --> GamepassesFrame and trigger a bindable event to another script
const plr = game.GetService("Players").LocalPlayer;
print("[OnFire] Client script running for player:", plr.Name);

const playerGui = plr.WaitForChild("PlayerGui") as PlayerGui;
print("[OnFire] PlayerGui found");

const gamepassShop = playerGui.WaitForChild("GamepassShop") as ScreenGui;
print("[OnFire] GamepassShop ScreenGui found");

// const gamepassesFrame = gamepassShop.WaitForChild("GamepassesFrame") as Frame;
print("[OnFire] GamepassesFrame found");

const bindableEvent = gamepassShop.WaitForChild("Tweenservice") as BindableEvent;
print("[OnFire] Tweenservice BindableEvent found:", bindableEvent !== undefined);

const replicatedStorage = game.GetService("ReplicatedStorage");
const shopOpen = replicatedStorage.WaitForChild("ShopOpen") as RemoteEvent;
print("[OnFire] ShopOpen RemoteEvent found");

print("[OnFire] Connected to OnClientEvent");
shopOpen.OnClientEvent.Connect((isEntering: boolean) => {
	print("[OnFire] OnClientEvent fired with isEntering:", isEntering);
	if (bindableEvent) {
		print("[OnFire] Firing bindableEvent with isEntering:", isEntering);
		// Pass the isEntering parameter to the bindable event
		// This lets OnBindable.client.ts know if we're entering or leaving
		bindableEvent.Fire(isEntering);
	} else {
		print("[OnFire] ERROR: bindableEvent not found when trying to fire");
	}
});
