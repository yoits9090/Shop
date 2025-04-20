// Full rewrite: Lean, event-driven DeathController
import { Service } from "@flamework/core";
import { Players, ReplicatedStorage, UserInputService, RunService, MarketplaceService, TeleportService } from "@rbxts/services";
import { getRemotes } from "../shared/GameRemotes.shared";

const REVIVE_PRODUCT_ID = 3261484228;
const LOBBY_PLACE_ID = 100501279549809; // Lobby PlaceId

@Service()
export class DeathController {
    private remotes = getRemotes();
    private player = Players.LocalPlayer;
    private deathScreen!: ScreenGui;
    private counterLabel!: TextLabel;
    private reviveButton!: TextButton;
    private outOfLives = false;
    private uiState = ReplicatedStorage.WaitForChild("UIStateManager") as BindableFunction;

    onInit() {
        this.setupDeathUI();
        this.bindEvents();
    }

    private setupDeathUI() {
        const gui = new Instance("ScreenGui");
        gui.Name = "DeathScreen";
        gui.ResetOnSpawn = false;
        gui.DisplayOrder = 100;
        gui.Enabled = false;
        gui.Parent = this.player.WaitForChild("PlayerGui");

        const frame = new Instance("Frame");
        frame.Size = new UDim2(0.5, 0, 0.5, 0);
        frame.Position = new UDim2(0.25, 0, 0.25, 0);
        frame.BackgroundColor3 = new Color3(0, 0, 0);
        frame.BackgroundTransparency = 0.5;
        frame.Parent = gui;

        // Style frame: rounded corners + outline
        const frameUICorner = new Instance("UICorner");
        frameUICorner.CornerRadius = new UDim(0, 12);
        frameUICorner.Parent = frame;
        const frameStroke = new Instance("UIStroke");
        frameStroke.Color = new Color3(1, 1, 1);
        frameStroke.Thickness = 2;
        frameStroke.Parent = frame;

        const title = new Instance("TextLabel");
        title.Size = new UDim2(1, 0, 0.2, 0);
        title.Text = "You Died";
        title.TextSize = 32;
        title.TextColor3 = new Color3(1, 0, 0);
        title.BackgroundTransparency = 1;
        title.Parent = frame;

        // Outline title text for readability
        const titleStroke = new Instance("UIStroke");
        titleStroke.Color = new Color3(0, 0, 0);
        titleStroke.Thickness = 1;
        titleStroke.Parent = title;

        this.counterLabel = new Instance("TextLabel");
        this.counterLabel.Size = new UDim2(1, 0, 0.2, 0);
        this.counterLabel.Position = new UDim2(0, 0, 0.2, 0);
        this.counterLabel.TextSize = 24;
        this.counterLabel.TextColor3 = new Color3(1, 1, 1);
        this.counterLabel.BackgroundTransparency = 1;
        this.counterLabel.Parent = frame;

        // Outline counter text
        const counterStroke = new Instance("UIStroke");
        counterStroke.Color = new Color3(0, 0, 0);
        counterStroke.Thickness = 1;
        counterStroke.Parent = this.counterLabel;

        this.reviveButton = new Instance("TextButton");
        this.reviveButton.Size = new UDim2(0.6, 0, 0.2, 0);
        this.reviveButton.Position = new UDim2(0.2, 0, 0.7, 0);
        this.reviveButton.Text = "REVIVE";
        this.reviveButton.TextSize = 24;
        this.reviveButton.BackgroundColor3 = new Color3(0.2, 0.6, 0.8);
        this.reviveButton.Parent = frame;

        // Style revive button
        const reviveUICorner = new Instance("UICorner");
        reviveUICorner.CornerRadius = new UDim(0, 8);
        reviveUICorner.Parent = this.reviveButton;
        const reviveStroke = new Instance("UIStroke");
        reviveStroke.Color = new Color3(1, 1, 1);
        reviveStroke.Thickness = 1;
        reviveStroke.Parent = this.reviveButton;
        this.reviveButton.Activated.Connect(() => {
            MarketplaceService.PromptProductPurchase(this.player, REVIVE_PRODUCT_ID);
        });

        // Return to Lobby button
        const returnButton = new Instance("TextButton");
        returnButton.Size = new UDim2(0.6, 0, 0.2, 0);
        returnButton.Position = new UDim2(0.2, 0, 0.85, 0);
        returnButton.Text = "GO BACK TO LOBBY";
        returnButton.TextSize = 24;
        returnButton.BackgroundColor3 = new Color3(0.8, 0.2, 0.2);
        returnButton.Parent = frame;

        // Style return button
        const returnUICorner = new Instance("UICorner");
        returnUICorner.CornerRadius = new UDim(0, 8);
        returnUICorner.Parent = returnButton;
        const returnStroke = new Instance("UIStroke");
        returnStroke.Color = new Color3(1, 1, 1);
        returnStroke.Thickness = 1;
        returnStroke.Parent = returnButton;
        returnButton.Activated.Connect(() => {
            TeleportService.Teleport(LOBBY_PLACE_ID, this.player);
        });

        this.deathScreen = gui;
    }

    private bindEvents() {
        this.player.GetAttributeChangedSignal("ExtraLives").Connect(() => {
            if (this.outOfLives) this.updateDeathUI(); else this.hideDeathScreen();
        });

        this.remotes.noLivesRemaining.OnClientEvent.Connect(() => {
            this.outOfLives = true;
            this.updateDeathUI();
        });
        this.remotes.preventRespawn.OnClientEvent.Connect(() => {
            this.outOfLives = true;
            this.updateDeathUI();
        });

        UserInputService.InputBegan.Connect(input => {
            if ((input.KeyCode === Enum.KeyCode.R || input.KeyCode === Enum.KeyCode.ButtonY) && this.outOfLives) {
                const can = this.remotes.respawnRequest.InvokeServer() as boolean;
                if (!can) this.updateDeathUI();
            }
        });

        RunService.RenderStepped.Connect(() => {
            if (this.outOfLives && !this.player.Character) {
                const can = this.remotes.respawnRequest.InvokeServer() as boolean;
                if (!can) this.updateDeathUI();
            }
        });
    }

    private updateDeathUI() {
        const lives = (this.player.GetAttribute("ExtraLives") as number) ?? 0;
        this.counterLabel.Text = `Extra Lives: ${lives}`;
        this.uiState.Invoke("set", "Death");
        this.deathScreen.Enabled = true;
    }

    private hideDeathScreen() {
        this.deathScreen.Enabled = false;
        this.uiState.Invoke("set", "None");
        this.outOfLives = false;
    }
}
