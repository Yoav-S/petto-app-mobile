/** Figma frame 375×812 — welcome onboarding screen */
export const ONBOARDING_DESIGN_WIDTH = 375;
export const ONBOARDING_DESIGN_HEIGHT = 812;

export const ONBOARDING_COVER_TOP = 486;
export const ONBOARDING_PANEL_HEIGHT = 326;
export const ONBOARDING_PANEL_RADIUS = 38;

export const ONBOARDING_LOGO = {
  top: 60,
  fontSize: 68.73,
  lineHeight: 84,
} as const;

/** Panel title — same typography as logo, color #1F2937 */
export const ONBOARDING_TITLE = {
  fontSize: 68.73,
  lineHeight: 84,
  color: '#1F2937',
} as const;

export const ONBOARDING_COPY = {
  blockTop: 38,
  blockWidth: 218,
  blockHeight: 96,
  gap: 8,
  titleSize: 24,
  titleLine: 28,
  subtitleSize: 12,
  subtitleLine: 16,
} as const;

export const ONBOARDING_BUTTON = {
  top: 184,
  left: 20,
  width: 335,
  height: 48,
  radius: 12,
  paddingV: 12,
  paddingH: 16,
  bg: '#004741',
} as const;

export const ONBOARDING_LEGAL = {
  size: 12,
  line: 16,
  color: '#6B7280',
  boldColor: '#6B7280',
} as const;
