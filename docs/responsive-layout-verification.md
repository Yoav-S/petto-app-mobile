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
- Typography, icon, and button sizes stay fixed (not growing with width)
- Cards and inputs widen fluidly with 16px page padding

## Scenarios

1. **Home** — cover, cards row, health card, FAB menu, profile toggle, pet switcher
2. **Lists** — reminders, topics, vaccines empty + populated
3. **Forms** — add vaccine/topic/reminder/pet; keyboard + Done chip + save footer
4. **Onboarding** — all 4 steps; short height (800) and wide (430)
5. **Auth** — welcome marquee + sign-in
6. **Settings / subscription** — scroll, headers aligned
7. **Dark mode** — spot-check home + one form

## Implementation notes

- Shared hook: `hooks/useResponsiveLayout.ts`
- Layout tokens: `constants/layout.ts`
- Fixed header band: `utils/headerLayout.ts`
- No global `scaleX` / `scaleY` on typography or controls
