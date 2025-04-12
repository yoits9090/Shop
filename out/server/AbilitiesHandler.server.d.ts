export declare class AbilitiesService {
    constructor();
    private regenLoopRunning;
    onInit(): void;
    private startRegenerationLoop;
    private applyRegenToCharacter;
    private createRegenerationEffect;
    applyRegenerationBenefit(player: Player): void;
    apply2xHealthBenefit(player: Player): void;
    applySprintBenefit(player: Player): void;
    apply2xSpeedBenefit(player: Player): void;
    applyExtraLivesBenefit(player: Player): void;
    applyReviveBenefit(player: Player): void;
    applyTemporaryShield(player: Player, duration?: number): void;
    private applyShieldToCharacter;
    private removeShieldFromCharacter;
    applyTeamReviveBenefit(player: Player): void;
    applyBenefitByName(benefitName: string, player: Player): void;
    applyCharacterBenefits(player: Player): void;
}
