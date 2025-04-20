export declare class DeathService {
    private remotes;
    private readonly DEFAULT_LIVES;
    onInit(): void;
    private initPlayer;
    private onCharacterAdded;
    private handleDeath;
    /**
     * Revive the player by adding lives and allowing respawn
     */
    revive(player: Player, amount?: number): void;
}
