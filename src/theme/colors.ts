// Mirrors the brand tokens already used across admin-portal/parent-portal/
// super-admin-portal/marketing-site (see e.g. admin-portal/src/index.css) —
// same indigo gradient, same warm-neutral approach, just as plain JS
// constants since React Native has no CSS custom properties. The gray/green/
// amber/red scales match the Tailwind defaults the web portals style with.
export const colors = {
  brand50: "#edf9f7",
  brand100: "#d8f3ee",
  brand200: "#bfe9e1",
  brand300: "#9bd7cf",
  brand400: "#74c0b7",
  brand500: "#5aa7a1",
  brand600: "#3d8d88",
  brand700: "#2f7a76",
  brand800: "#236762",
  brand900: "#1c4f4d",

  gradientStart: "#6ca7a5",
  gradientEnd: "#2f7d7d",
  gradientHoverStart: "#467f7c",
  gradientHoverEnd: "#275d5d",

  ink: "#1f2d2a",
  inkSoft: "#46615d",
  inkFaint: "#6d8380",
  inkGhost: "#97a9a5",

  paper: "#f4f7f6",
  paperRaised: "#edf4f3",
  line: "#dfeae8",
  lineStrong: "#cdded8",
  surfaceMuted: "#f0f5f3",
  surfaceHover: "#edf8f6",

  white: "#ffffff",
  success: "#2e8b57",
  successBg: "#dff5e8",
  warning: "#d98c2b",
  warningBg: "#fff1dc",
  danger: "#d8645a",
  dangerBg: "#fde7e5",

  chartGrid: "#e4efec",
  chartAxis: "#5c7a76",
};
