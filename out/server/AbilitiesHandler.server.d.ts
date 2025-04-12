export declare class AbilitiesService {
    constructor();
    onInit(): void;
    applyRegenerationBenefit(player: Player): void;
    apply2xHealthBenefit(player: Player): void;
    applySprintBenefit(player: Player): void;
    apply2xSpeedBenefit(player: Player): void;
    applyExtraLivesBenefit(player: Player): void;
    applyReviveBenefit(player: Player): void;
    applyTeamReviveBenefit(player: Player): void;
    applyBenefitByName(benefitName: string, player: Player): void;
    applyCharacterBenefits(player: Player): void;
}
