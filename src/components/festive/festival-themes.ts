export type FestivalThemeKey =
  | "diwali"
  | "holi"
  | "eid"
  | "onam"
  | "christmas"
  | "pongal"
  | "navratri"
  | "ganesh"
  | "rakhi"
  | "tricolour"
  | "newyear"
  | "default";

export type FestivalDecoration =
  | "diyas"
  | "colour-splash"
  | "crescent"
  | "pookalam"
  | "ornaments"
  | "harvest"
  | "garba"
  | "marigold"
  | "rakhi"
  | "tricolour"
  | "fireworks"
  | "sparkles";

export type FestivalTheme = {
  key: FestivalThemeKey;
  label: string;
  tagline: string;
  /** CSS background for the hero canvas. */
  background: string;
  /** Repeating pattern drawn over the hero background. */
  pattern: string;
  /** Main heading colour on the hero. */
  ink: string;
  /** Secondary text colour on the hero. */
  inkMuted: string;
  /** Primary accent (CTA / badges). */
  accent: string;
  /** Text colour used on top of `accent`. */
  accentInk: string;
  /** Secondary accent used for highlights and decorations. */
  highlight: string;
  /** Accent that stays readable on the light page background. */
  pageAccent: string;
  /** Soft tint used for section backgrounds on the page. */
  soft: string;
  /** Border tint used on soft surfaces. */
  softBorder: string;
  decoration: FestivalDecoration;
};

const dots = (color: string, size = 22) =>
  `radial-gradient(${color} 1.2px, transparent 1.4px) 0 0 / ${size}px ${size}px`;

export const FESTIVAL_THEMES: Record<FestivalThemeKey, FestivalTheme> = {
  diwali: {
    key: "diwali",
    label: "Festival of Lights",
    tagline: "Light up every corner of your home",
    background:
      "radial-gradient(120% 120% at 85% 10%, #9b1c31 0%, #6a0f24 45%, #3d0714 100%)",
    pattern: dots("rgba(255,215,128,0.22)"),
    ink: "#fff6e0",
    inkMuted: "rgba(255,240,210,0.82)",
    accent: "#f6c453",
    accentInk: "#4a0a17",
    highlight: "#ffb347",
    pageAccent: "#9b1c31",
    soft: "#fff6e6",
    softBorder: "#f3dcae",
    decoration: "diyas",
  },
  holi: {
    key: "holi",
    label: "Festival of Colours",
    tagline: "Splash into a season of colour",
    background:
      "linear-gradient(120deg, #ff3d7f 0%, #ff8a3d 30%, #ffd23f 55%, #3ddc97 78%, #3d8bff 100%)",
    pattern: dots("rgba(255,255,255,0.35)", 18),
    ink: "#ffffff",
    inkMuted: "rgba(255,255,255,0.9)",
    accent: "#1f1147",
    accentInk: "#ffffff",
    highlight: "#ffffff",
    pageAccent: "#db2777",
    soft: "#fff1f6",
    softBorder: "#ffd0e1",
    decoration: "colour-splash",
  },
  eid: {
    key: "eid",
    label: "Eid Mubarak",
    tagline: "Celebrate togetherness and joy",
    background:
      "radial-gradient(120% 120% at 80% 0%, #0f7a5a 0%, #0a5641 50%, #06372a 100%)",
    pattern:
      "repeating-linear-gradient(45deg, rgba(232,199,112,0.10) 0 2px, transparent 2px 26px), repeating-linear-gradient(-45deg, rgba(232,199,112,0.10) 0 2px, transparent 2px 26px)",
    ink: "#fdf7e4",
    inkMuted: "rgba(253,247,228,0.82)",
    accent: "#e8c770",
    accentInk: "#06372a",
    highlight: "#f5dc95",
    pageAccent: "#0f7a5a",
    soft: "#eef8f3",
    softBorder: "#c7e6d7",
    decoration: "crescent",
  },
  onam: {
    key: "onam",
    label: "Onam Ponnonam",
    tagline: "Harvest happiness, Kerala style",
    background:
      "linear-gradient(135deg, #fffaf0 0%, #fbefd2 55%, #f4dfa9 100%)",
    pattern: dots("rgba(194,134,22,0.20)"),
    ink: "#2e4a12",
    inkMuted: "rgba(46,74,18,0.78)",
    accent: "#c8102e",
    accentInk: "#ffffff",
    highlight: "#d4a017",
    pageAccent: "#c8102e",
    soft: "#fffaf0",
    softBorder: "#efdcae",
    decoration: "pookalam",
  },
  christmas: {
    key: "christmas",
    label: "Season's Greetings",
    tagline: "Wrap up joy this holiday season",
    background:
      "radial-gradient(120% 120% at 80% 0%, #1f6b3a 0%, #134a28 55%, #0b2f19 100%)",
    pattern: dots("rgba(255,255,255,0.18)", 26),
    ink: "#ffffff",
    inkMuted: "rgba(255,255,255,0.84)",
    accent: "#d62f3a",
    accentInk: "#ffffff",
    highlight: "#f2c94c",
    pageAccent: "#c0262f",
    soft: "#f3f8f4",
    softBorder: "#cfe3d5",
    decoration: "ornaments",
  },
  pongal: {
    key: "pongal",
    label: "Harvest Festival",
    tagline: "Celebrate the season of abundance",
    background:
      "linear-gradient(135deg, #ffe9b8 0%, #ffcf6b 45%, #f59f2d 100%)",
    pattern: dots("rgba(122,62,0,0.16)"),
    ink: "#4a2300",
    inkMuted: "rgba(74,35,0,0.78)",
    accent: "#2f7d32",
    accentInk: "#ffffff",
    highlight: "#c2410c",
    pageAccent: "#c2410c",
    soft: "#fff7e6",
    softBorder: "#f6d9a3",
    decoration: "harvest",
  },
  navratri: {
    key: "navratri",
    label: "Nine Nights of Celebration",
    tagline: "Dance, dress up and celebrate",
    background:
      "linear-gradient(130deg, #b3123d 0%, #e2452b 50%, #f59e0b 100%)",
    pattern: dots("rgba(255,236,179,0.25)", 20),
    ink: "#fff8e7",
    inkMuted: "rgba(255,248,231,0.86)",
    accent: "#fde047",
    accentInk: "#7a0c26",
    highlight: "#fde68a",
    pageAccent: "#b3123d",
    soft: "#fff3ef",
    softBorder: "#fbd2c4",
    decoration: "garba",
  },
  ganesh: {
    key: "ganesh",
    label: "Ganpati Bappa Morya",
    tagline: "Welcome prosperity home",
    background:
      "linear-gradient(135deg, #ff9933 0%, #f97316 50%, #c2410c 100%)",
    pattern: dots("rgba(255,244,214,0.28)"),
    ink: "#fffaf0",
    inkMuted: "rgba(255,250,240,0.88)",
    accent: "#7f1d1d",
    accentInk: "#fff7ed",
    highlight: "#fde047",
    pageAccent: "#c2410c",
    soft: "#fff5eb",
    softBorder: "#fcd9b6",
    decoration: "marigold",
  },
  rakhi: {
    key: "rakhi",
    label: "Raksha Bandhan",
    tagline: "Gifts for the bond that matters",
    background:
      "linear-gradient(135deg, #fbcfe8 0%, #f472b6 50%, #9d174d 100%)",
    pattern: dots("rgba(255,255,255,0.3)", 20),
    ink: "#ffffff",
    inkMuted: "rgba(255,255,255,0.9)",
    accent: "#fbbf24",
    accentInk: "#500724",
    highlight: "#fde68a",
    pageAccent: "#be185d",
    soft: "#fdf2f8",
    softBorder: "#f9cfe5",
    decoration: "rakhi",
  },
  tricolour: {
    key: "tricolour",
    label: "Celebrate India",
    tagline: "Proudly Indian savings",
    background:
      "linear-gradient(180deg, #ff9933 0%, #ffd9a8 30%, #ffffff 50%, #c9f0cf 70%, #138808 100%)",
    pattern: dots("rgba(0,0,128,0.10)", 24),
    ink: "#0b1f5c",
    inkMuted: "rgba(11,31,92,0.8)",
    accent: "#000080",
    accentInk: "#ffffff",
    highlight: "#138808",
    pageAccent: "#000080",
    soft: "#f4f8ff",
    softBorder: "#d5e1f7",
    decoration: "tricolour",
  },
  newyear: {
    key: "newyear",
    label: "Happy New Year",
    tagline: "Fresh starts, fresh savings",
    background:
      "radial-gradient(120% 120% at 80% 0%, #312e81 0%, #1e1b4b 55%, #0b0a24 100%)",
    pattern: dots("rgba(255,255,255,0.18)", 24),
    ink: "#ffffff",
    inkMuted: "rgba(255,255,255,0.82)",
    accent: "#facc15",
    accentInk: "#1e1b4b",
    highlight: "#a5b4fc",
    pageAccent: "#4338ca",
    soft: "#f3f4ff",
    softBorder: "#d9dcfb",
    decoration: "fireworks",
  },
  default: {
    key: "default",
    label: "Festive Sale",
    tagline: "Celebrate more, shop smarter",
    background:
      "linear-gradient(135deg, #fff1db 0%, #ffe0b8 55%, #ffc98f 100%)",
    pattern: dots("rgba(216,90,26,0.16)"),
    ink: "#3b1d0a",
    inkMuted: "rgba(59,29,10,0.78)",
    accent: "#d85a1a",
    accentInk: "#ffffff",
    highlight: "#0e5c63",
    pageAccent: "#d85a1a",
    soft: "#fff6ec",
    softBorder: "#f6dcc2",
    decoration: "sparkles",
  },
};

const NAME_MATCHERS: { key: FestivalThemeKey; pattern: RegExp }[] = [
  { key: "diwali", pattern: /diwali|deepavali|deepawali|dhanteras|bhai\s*dooj|kali\s*puja|tihar/ },
  { key: "holi", pattern: /holi|rangpanchami|rang\s*panchami|basant|vasant/ },
  { key: "eid", pattern: /eid|ramadan|ramzan|bakrid|bakri|muharram|milad/ },
  { key: "onam", pattern: /onam|vishu|thiruvonam/ },
  { key: "christmas", pattern: /christmas|xmas|x-mas|noel/ },
  { key: "pongal", pattern: /pongal|sankranti|sankranthi|lohri|bihu|baisakhi|vaisakhi|ugadi|gudi\s*padwa|harvest|chhath/ },
  { key: "navratri", pattern: /navratri|navaratri|durga|dussehra|dasara|dussera|garba|vijayadashami|puja/ },
  { key: "ganesh", pattern: /ganesh|ganesha|ganpati|ganapati|vinayaka|chaturthi/ },
  { key: "rakhi", pattern: /rakhi|raksha|bandhan|karva|karwa|teej|mother'?s\s*day|valentine/ },
  { key: "tricolour", pattern: /independence|republic|gandhi\s*jayanti|azadi|swatantra/ },
  { key: "newyear", pattern: /new\s*year|nye/ },
];

export function resolveFestivalTheme(input: {
  theme?: string | null;
  festival_name?: string | null;
  campaign_name?: string | null;
}): FestivalTheme {
  const themeKey = (input.theme || "").trim().toLowerCase();

  if (themeKey && themeKey !== "default" && themeKey in FESTIVAL_THEMES) {
    return FESTIVAL_THEMES[themeKey as FestivalThemeKey];
  }

  const haystack = `${input.festival_name || ""} ${input.campaign_name || ""}`.toLowerCase();
  const match = NAME_MATCHERS.find(({ pattern }) => pattern.test(haystack));

  return FESTIVAL_THEMES[match?.key ?? "default"];
}

/**
 * The generic theme can be tinted with the campaign's own background colour,
 * so admin-chosen colours still show for festivals without a dedicated theme.
 */
export function themeBackground(
  theme: FestivalTheme,
  backgroundColor?: string | null,
) {
  if (theme.key === "default" && backgroundColor && /^#[0-9a-f]{3,8}$/i.test(backgroundColor)) {
    return `linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundColor} 45%, #ffc98f 140%)`;
  }
  return theme.background;
}
