import { Service } from "@flamework/core";
import { Players } from "@rbxts/services";
import { getRemotes } from "../shared/GameRemotes.shared";

// Player type is global; no import needed

@Service()
export class DeathService {
    private remotes = getRemotes();
    private readonly DEFAULT_LIVES = 0;

    onInit(): void {
        // Initialize existing players
        Players.GetPlayers().forEach((player) => this.initPlayer(player));
        Players.PlayerAdded.Connect((player) => this.initPlayer(player));

        // Handle respawn requests from client
        this.remotes.respawnRequest.OnServerInvoke = (player) => {
            const allow = player.GetAttribute("AllowRespawn") as boolean ?? true;
            if (!allow) {
                // remind client they're out of lives
                this.remotes.noLivesRemaining.FireClient(player);
            }
            return allow;
        };
    }

    private initPlayer(player: Player) {
        // Set defaults if not present
        if (player.GetAttribute("ExtraLives") === undefined) {
            player.SetAttribute("ExtraLives", this.DEFAULT_LIVES);
        }
        if (player.GetAttribute("AllowRespawn") === undefined) {
            player.SetAttribute("AllowRespawn", true);
        }

        // Hook death on each character
        player.CharacterAdded.Connect((character: Model) => this.onCharacterAdded(player, character));
    }

    private onCharacterAdded(player: Player, character: Model) {
        const humanoid = character.WaitForChild("Humanoid") as Humanoid;
        humanoid.Died.Connect(() => this.handleDeath(player));
    }

    private handleDeath(player: Player) {
        const lives = (player.GetAttribute("ExtraLives") as number) ?? 0;
        if (lives > 0) {
            // Consume a life
            player.SetAttribute("ExtraLives", lives - 1);
        } else {
            // No lives: block respawn and notify client
            player.SetAttribute("AllowRespawn", false);
            this.remotes.noLivesRemaining.FireClient(player);
            this.remotes.preventRespawn.FireClient(player);
        }
    }

    /**
     * Revive the player by adding lives and allowing respawn
     */
    public revive(player: Player, amount = 1) {
        const current = (player.GetAttribute("ExtraLives") as number) ?? 0;
        player.SetAttribute("ExtraLives", current + amount);
        player.SetAttribute("AllowRespawn", true);
        // Force respawn
        player.LoadCharacter();
    }
}
