# Responsive layout verification

Test on these logical sizes (Expo dev tools or simulators):

| Size | Role |
|------|------|
| 360×800 | Minimum / stress test |
| 375×812 | Figma reference |
| 390×844 | Larger iPhone |
| 393×852 | Larger iPhone |
| 430×932 | Large iPhone |

## Pass criteria

- No horizontal scrolling on standard screens
- No clipped text (long pet name, breed, locale strings)
- No overlapping header / FAB / toast / sticky footer
- Typography, icon glyphs, and control text stay at design tokens (not scaled with width)
- Cards, lists, and inputs use fluid width (screen − 32px); no 335pt phone cap
- Welcome collage cover-fills the screen (no side gutters)
- Home cover / FAB / card heights use bounded structural scale (1.0–1.12)

## Scenarios

1. **Home** — cover, cards row, health card, FAB menu, profile toggle, pet switcher
2. **Lists** — reminders, topics, vaccines empty + populated
3. **Forms** — add vaccine/topic/reminder/pet; keyboard + Done chip + save footer
4. **Onboarding** — all 4 steps; short height (800) and wide (430)
5. **Auth** — welcome marquee + sign-in
6. **Settings / subscription** — scroll, headers aligned
7. **Dark mode** — spot-check home + one form

## Implementation notes

- Shared hook: `hooks/useResponsiveLayout.ts` (`contentWidth`, `structuralScale`)
- Layout tokens: `constants/layout.ts`
- Welcome cover-scale: `components/auth/WelcomePhotoMarquee.tsx`
- Fixed header band: `utils/headerLayout.ts`
- No global `scaleX` / `scaleY` on typography
