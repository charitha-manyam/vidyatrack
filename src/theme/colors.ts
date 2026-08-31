// Mirrors the brand tokens already used across admin-portal/parent-portal/
// super-admin-portal/marketing-site (see e.g. admin-portal/src/index.css) —
// same indigo gradient, same warm-neutral approach, just as plain JS
// constants since React Native has no CSS custom properties. The gray/green/
// amber/red scales match the Tailwind defaults the web portals style with.
export const colors = {
  brand50: "#eef2ff",
  brand100: "#e0e4ff",
  brand200: "#c7ccff",
  brand300: "#a8a9fa",
  brand400: "#4f46e5",
  brand500: "#4338ca",
  brand600: "#3525cd",
  brand700: "#2f1fc0",
  brand800: "#281aa3",
  brand900: "#201385",

  gradientStart: "#3525cd",
  gradientEnd: "#4f46e5",
  gradientHoverStart: "#2f1fc0",
  gradientHoverEnd: "#4338ca",

  ink: "#111827",
  inkSoft: "#4b5563",
  inkFaint: "#6b7280",
  inkGhost: "#9ca3af",

  paper: "#f8fafc",
  paperRaised: "#f1f5f9",
  line: "#e5e7eb",
  lineStrong: "#d1d5db",
  surfaceMuted: "#f3f4f6",
  surfaceHover: "#f9fafb",

  white: "#ffffff",
  success: "#16a34a",
  successBg: "#dcfce7",
  warning: "#d97706",
  warningBg: "#fef3c7",
  danger: "#dc2626",
  dangerBg: "#fee2e2",

  chartGrid: "#f0f0f0",
  chartAxis: "#6b7280",
};
