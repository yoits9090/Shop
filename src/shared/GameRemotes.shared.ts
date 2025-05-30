import { ReplicatedStorage } from "@rbxts/services";

/**
 * Centralized repository for all game remote events
 * This ensures that all remotes are created once and accessible from both server and client
 */
export class GameRemotes {
	private static _instance: GameRemotes;
	private _folder: Folder;

	// Remote events
	public readonly sprintEnabled: RemoteEvent;
	public readonly applyEffect: RemoteEvent;
	public readonly notifyPurchase: RemoteEvent;
	public readonly noLivesRemaining: RemoteEvent;
	public readonly preventRespawn: RemoteEvent;
	public readonly respawnRequest: RemoteFunction;
	public readonly shopOpen: RemoteEvent;

	private constructor() {
		// Check if remotes folder already exists
		let remotesFolder = ReplicatedStorage.FindFirstChild("GameRemotes") as Folder;

		if (!remotesFolder) {
			// Create a new folder for all game remotes
			remotesFolder = new Instance("Folder");
			remotesFolder.Name = "GameRemotes";
			remotesFolder.Parent = ReplicatedStorage;
		}

		this._folder = remotesFolder;

		// Create or get all remote events
		this.sprintEnabled = this.getOrCreateRemote("SprintEnabled");
		this.applyEffect = this.getOrCreateRemote("ApplyEffect");
		this.notifyPurchase = this.getOrCreateRemote("NotifyPurchase");
		this.noLivesRemaining = this.getOrCreateRemote("NoLivesRemaining");
		this.preventRespawn = this.getOrCreateRemote("PreventAutoRespawn");
		this.respawnRequest = this.getOrCreateFunction("RespawnFunction");
		this.shopOpen = this.getOrCreateRemote("ShopOpen");
	}

	/**
	 * Get existing remote or create a new one if it doesn't exist
	 */
	private getOrCreateRemote(name: string): RemoteEvent {
		let remote = this._folder.FindFirstChild(name) as RemoteEvent;

		if (!remote) {
			remote = new Instance("RemoteEvent");
			remote.Name = name;
			remote.Parent = this._folder;
		}

		return remote;
	}

	/**
	 * Get existing function or create a new one if it doesn't exist
	 */
	private getOrCreateFunction(name: string): RemoteFunction {
		let fn = this._folder.FindFirstChild(name) as RemoteFunction;

		if (!fn) {
			fn = new Instance("RemoteFunction");
			fn.Name = name;
			fn.Parent = this._folder;
		}

		return fn;
	}

	/**
	 * Get the singleton instance of GameRemotes
	 */
	public static getInstance(): GameRemotes {
		if (!GameRemotes._instance) {
			GameRemotes._instance = new GameRemotes();
		}

		return GameRemotes._instance;
	}
}

// Export a convenience function to get remotes
export const getRemotes = (): GameRemotes => {
	return GameRemotes.getInstance();
};
