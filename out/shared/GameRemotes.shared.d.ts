/**
 * Centralized repository for all game remote events
 * This ensures that all remotes are created once and accessible from both server and client
 */
export declare class GameRemotes {
    private static _instance;
    private _folder;
    readonly sprintEnabled: RemoteEvent;
    readonly applyEffect: RemoteEvent;
    readonly notifyPurchase: RemoteEvent;
    readonly noLivesRemaining: RemoteEvent;
    readonly preventRespawn: RemoteEvent;
    readonly respawnRequest: RemoteFunction;
    readonly shopOpen: RemoteEvent;
    private constructor();
    /**
     * Get existing remote or create a new one if it doesn't exist
     */
    private getOrCreateRemote;
    /**
     * Get existing function or create a new one if it doesn't exist
     */
    private getOrCreateFunction;
    /**
     * Get the singleton instance of GameRemotes
     */
    static getInstance(): GameRemotes;
}
export declare const getRemotes: () => GameRemotes;
