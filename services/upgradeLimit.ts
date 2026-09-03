export type UpgradeKind = 'pet' | 'reminder' | 'pet_switch';

export type UpgradeLimitOptions = {
  onBeforeNavigate?: () => void;
};

type Presenter = (kind: UpgradeKind, options?: UpgradeLimitOptions) => void;

let presenter: Presenter | null = null;

export function setUpgradeLimitPresenter(fn: Presenter | null): void {
  presenter = fn;
}

export function presentUpgradeLimit(kind: UpgradeKind, options?: UpgradeLimitOptions): void {
  presenter?.(kind, options);
}
