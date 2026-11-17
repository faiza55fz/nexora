import type { CSSProperties, ReactNode } from "react";
import type { FestivalTheme } from "./festival-themes";

type ArtProps = { theme: FestivalTheme; className?: string };

function Svg({
  children,
  className,
  viewBox = "0 0 100 100",
  style,
}: {
  children: ReactNode;
  className?: string;
  viewBox?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function petalRing(
  cx: number,
  cy: number,
  count: number,
  rx: number,
  ry: number,
  distance: number,
  fill: string,
  rotate = 0,
) {
  return Array.from({ length: count }).map((_, i) => {
    const angle = (360 / count) * i + rotate;
    return (
      <ellipse
        key={`${fill}-${i}`}
        cx={cx}
        cy={cy - distance}
        rx={rx}
        ry={ry}
        fill={fill}
        transform={`rotate(${angle} ${cx} ${cy})`}
      />
    );
  });
}

export function Diya({ flame = "#ffb347", body = "#b45309", rim = "#f6c453" }) {
  return (
    <g>
      <ellipse cx="50" cy="40" rx="9" ry="16" fill={flame} opacity="0.35" />
      <path d="M50 22 C56 32 56 40 50 46 C44 40 44 32 50 22 Z" fill={flame} />
      <path d="M50 30 C53 36 53 40 50 44 C47 40 47 36 50 30 Z" fill="#fff4c2" />
      <path d="M18 50 Q50 52 82 50 Q76 76 50 78 Q24 76 18 50 Z" fill={body} />
      <path d="M18 50 Q50 56 82 50" stroke={rim} strokeWidth="3" fill="none" />
      <path d="M30 62 Q50 68 70 62" stroke={rim} strokeWidth="1.6" strokeDasharray="2 3" fill="none" />
    </g>
  );
}

function Crescent({ color }: { color: string }) {
  return (
    <g>
      <circle cx="50" cy="50" r="34" fill={color} />
      <circle cx="64" cy="42" r="30" fill="currentColor" />
    </g>
  );
}

function Star({
  cx,
  cy,
  r,
  fill,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
}) {
  const points = Array.from({ length: 10 })
    .map((_, i) => {
      const radius = i % 2 === 0 ? r : r * 0.45;
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
    })
    .join(" ");
  return <polygon points={points} fill={fill} />;
}

function Lantern({ body, glow }: { body: string; glow: string }) {
  return (
    <g>
      <line x1="50" y1="0" x2="50" y2="18" stroke={body} strokeWidth="1.5" />
      <path d="M40 18 H60 L56 24 H44 Z" fill={body} />
      <path d="M42 24 H58 Q66 44 58 64 H42 Q34 44 42 24 Z" fill={glow} opacity="0.95" />
      <path d="M50 24 V64 M44 26 Q40 44 44 62 M56 26 Q60 44 56 62" stroke={body} strokeWidth="1.2" fill="none" />
      <path d="M42 64 H58 L54 70 H46 Z" fill={body} />
      <line x1="50" y1="70" x2="50" y2="80" stroke={body} strokeWidth="1.5" />
      <circle cx="50" cy="82" r="2" fill={body} />
    </g>
  );
}

function Flower({
  cx = 50,
  cy = 50,
  scale = 1,
  colors,
}: {
  cx?: number;
  cy?: number;
  scale?: number;
  colors: string[];
}) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale}) translate(-50 -50)`}>
      {colors.map((color, index) => {
        const distance = 36 - index * 9;
        const count = 16 - index * 3;
        return (
          <g key={color + index}>
            {petalRing(50, 50, count, 6 - index, 12 - index * 2, distance, color, index * 11)}
          </g>
        );
      })}
      <circle cx="50" cy="50" r="7" fill={colors[colors.length - 1]} />
      <circle cx="50" cy="50" r="3" fill="#fff8e1" />
    </g>
  );
}

function Burst({ color, cx = 50, cy = 50, r = 40 }: { color: string; cx?: number; cy?: number; r?: number }) {
  return (
    <g>
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / 16;
        const inner = r * 0.3;
        return (
          <g key={i}>
            <line
              x1={cx + inner * Math.cos(angle)}
              y1={cy + inner * Math.sin(angle)}
              x2={cx + r * Math.cos(angle)}
              y2={cy + r * Math.sin(angle)}
              stroke={color}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle
              cx={cx + (r + 5) * Math.cos(angle)}
              cy={cy + (r + 5) * Math.sin(angle)}
              r="1.8"
              fill={color}
            />
          </g>
        );
      })}
    </g>
  );
}

function Bauble({ fill, cap }: { fill: string; cap: string }) {
  return (
    <g>
      <line x1="50" y1="0" x2="50" y2="22" stroke={cap} strokeWidth="1.4" />
      <rect x="44" y="22" width="12" height="8" rx="2" fill={cap} />
      <circle cx="50" cy="56" r="26" fill={fill} />
      <path d="M26 52 Q50 62 74 52" stroke="#fff" strokeOpacity="0.55" strokeWidth="3" fill="none" />
      <circle cx="40" cy="46" r="5" fill="#fff" opacity="0.4" />
    </g>
  );
}

function Snowflake({ color }: { color: string }) {
  return (
    <g stroke={color} strokeWidth="3" strokeLinecap="round">
      {[0, 60, 120].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 50 50)`}>
          <line x1="50" y1="14" x2="50" y2="86" />
          <path d="M50 26 L42 18 M50 26 L58 18 M50 74 L42 82 M50 74 L58 82" fill="none" />
        </g>
      ))}
    </g>
  );
}

function PongalPot({ pot, rim, rice }: { pot: string; rim: string; rice: string }) {
  return (
    <g>
      <path d="M30 34 Q50 14 70 34 Q62 30 50 32 Q38 30 30 34 Z" fill={rice} />
      <circle cx="38" cy="26" r="3" fill={rice} />
      <circle cx="60" cy="24" r="3.5" fill={rice} />
      <circle cx="50" cy="20" r="3" fill={rice} />
      <rect x="32" y="32" width="36" height="8" rx="3" fill={rim} />
      <path d="M30 40 H70 Q86 60 70 82 H30 Q14 60 30 40 Z" fill={pot} />
      <path d="M24 56 Q50 64 76 56" stroke={rim} strokeWidth="3" fill="none" />
      <path d="M26 66 Q50 74 74 66" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
    </g>
  );
}

function Sugarcane({ color }: { color: string }) {
  return (
    <g>
      <rect x="47" y="10" width="6" height="84" rx="3" fill={color} />
      {[24, 40, 56, 72].map((y) => (
        <rect key={y} x="46" y={y} width="8" height="2" fill="#000" opacity="0.18" />
      ))}
      <path d="M50 12 Q30 0 22 6 Q38 8 50 16 Z M50 12 Q70 -2 80 4 Q62 8 50 16 Z" fill="#4d7c0f" />
    </g>
  );
}

function Dandiya({ color, tip }: { color: string; tip: string }) {
  return (
    <g>
      <g transform="rotate(35 50 50)">
        <rect x="47" y="8" width="6" height="84" rx="3" fill={color} />
        <rect x="46" y="30" width="8" height="4" fill={tip} />
        <rect x="46" y="66" width="8" height="4" fill={tip} />
      </g>
      <g transform="rotate(-35 50 50)">
        <rect x="47" y="8" width="6" height="84" rx="3" fill={color} />
        <rect x="46" y="30" width="8" height="4" fill={tip} />
        <rect x="46" y="66" width="8" height="4" fill={tip} />
      </g>
    </g>
  );
}

function Chakra({ color }: { color: string }) {
  return (
    <g stroke={color} fill="none">
      <circle cx="50" cy="50" r="36" strokeWidth="4" />
      <circle cx="50" cy="50" r="6" fill={color} />
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / 24;
        return (
          <line
            key={i}
            x1={50 + 6 * Math.cos(angle)}
            y1={50 + 6 * Math.sin(angle)}
            x2={50 + 36 * Math.cos(angle)}
            y2={50 + 36 * Math.sin(angle)}
            strokeWidth="1.5"
          />
        );
      })}
    </g>
  );
}

function Gift({ box, ribbon }: { box: string; ribbon: string }) {
  return (
    <g>
      <rect x="22" y="42" width="56" height="44" rx="4" fill={box} />
      <rect x="18" y="32" width="64" height="14" rx="3" fill={box} />
      <rect x="46" y="32" width="8" height="54" fill={ribbon} />
      <path d="M50 32 Q34 12 28 24 Q30 32 50 32 Q66 32 72 24 Q66 12 50 32 Z" fill={ribbon} />
    </g>
  );
}

function RakhiThread({ thread, bloom }: { thread: string; bloom: string[] }) {
  return (
    <g>
      <path d="M2 50 Q25 40 40 50 M60 50 Q75 60 98 50" stroke={thread} strokeWidth="3" fill="none" />
      <Flower cx={50} cy={50} scale={0.42} colors={bloom} />
    </g>
  );
}

/** Large, festival-specific centrepiece artwork. */
export function FestivalArtwork({ theme, className }: ArtProps) {
  const { accent, highlight } = theme;

  switch (theme.decoration) {
    case "diyas":
      return (
        <Svg className={className} viewBox="0 0 200 160">
          <circle cx="100" cy="70" r="64" fill={accent} opacity="0.12" />
          <g transform="translate(55 30) scale(0.9)">
            <Diya flame={highlight} rim={accent} />
          </g>
          <g transform="translate(10 62) scale(0.6)">
            <Diya flame={highlight} rim={accent} body="#92400e" />
          </g>
          <g transform="translate(130 62) scale(0.6)">
            <Diya flame={highlight} rim={accent} body="#92400e" />
          </g>
          <g opacity="0.85">
            <Flower cx={100} cy={142} scale={0.32} colors={["#f97316", "#facc15", "#dc2626"]} />
          </g>
        </Svg>
      );
    case "crescent":
      return (
        <Svg className={className} viewBox="0 0 200 160">
          <g transform="translate(60 20) scale(0.9)" style={{ color: "#0a5641" }}>
            <Crescent color={accent} />
          </g>
          <Star cx={140} cy={42} r={10} fill={highlight} />
          <Star cx={40} cy={110} r={6} fill={highlight} />
          <g transform="translate(-8 0) scale(0.55)">
            <Lantern body={accent} glow="#fde68a" />
          </g>
          <g transform="translate(140 10) scale(0.6)">
            <Lantern body={accent} glow="#fef3c7" />
          </g>
        </Svg>
      );
    case "colour-splash":
      return (
        <Svg className={className} viewBox="0 0 200 160">
          {[
            ["#ff3d7f", 70, 70, 44],
            ["#ffd23f", 120, 60, 36],
            ["#3d8bff", 140, 110, 30],
            ["#3ddc97", 80, 120, 28],
            ["#a855f7", 40, 40, 20],
          ].map(([fill, cx, cy, r]) => (
            <g key={String(fill)}>
              <circle cx={Number(cx)} cy={Number(cy)} r={Number(r)} fill={String(fill)} opacity="0.85" />
              <circle cx={Number(cx) + Number(r) * 0.8} cy={Number(cy) - Number(r) * 0.6} r={Number(r) * 0.25} fill={String(fill)} />
              <circle cx={Number(cx) - Number(r) * 0.9} cy={Number(cy) + Number(r) * 0.4} r={Number(r) * 0.15} fill={String(fill)} />
            </g>
          ))}
        </Svg>
      );
    case "pookalam":
      return (
        <Svg className={className} viewBox="0 0 200 160">
          <Flower cx={100} cy={80} scale={1.5} colors={["#c8102e", "#f97316", "#facc15", "#ffffff"]} />
          <Flower cx={30} cy={130} scale={0.4} colors={["#f97316", "#facc15"]} />
          <Flower cx={172} cy={28} scale={0.35} colors={["#c8102e", "#facc15"]} />
        </Svg>
      );
    case "ornaments":
      return (
        <Svg className={className} viewBox="0 0 200 160">
          <g transform="translate(20 0) scale(0.8)">
            <Bauble fill={accent} cap={highlight} />
          </g>
          <g transform="translate(78 10) scale(1)">
            <Bauble fill={highlight} cap={accent} />
          </g>
          <g transform="translate(140 -4) scale(0.7)">
            <Bauble fill="#ffffff" cap={highlight} />
          </g>
          <Star cx={100} cy={140} r={12} fill={highlight} />
          <g transform="translate(10 110) scale(0.35)">
            <Snowflake color="#ffffff" />
          </g>
          <g transform="translate(160 110) scale(0.3)">
            <Snowflake color="#ffffff" />
          </g>
        </Svg>
      );
    case "harvest":
      return (
        <Svg className={className} viewBox="0 0 200 160">
          <circle cx="150" cy="40" r="28" fill="#fde047" />
          <Burst color="#f59e0b" cx={150} cy={40} r={40} />
          <g transform="translate(10 30) scale(1.2)">
            <Sugarcane color="#65a30d" />
          </g>
          <g transform="translate(55 40) scale(1.15)">
            <PongalPot pot="#b45309" rim="#facc15" rice="#fffbeb" />
          </g>
        </Svg>
      );
    case "garba":
      return (
        <Svg className={className} viewBox="0 0 200 160">
          <Flower cx={100} cy={80} scale={1.2} colors={["#fde047", "#f97316", "#b3123d"]} />
          <g transform="translate(110 40) scale(1)">
            <Dandiya color={accent} tip="#16a34a" />
          </g>
          <g transform="translate(-10 40) scale(0.8)">
            <Dandiya color={highlight} tip="#2563eb" />
          </g>
        </Svg>
      );
    case "marigold":
      return (
        <Svg className={className} viewBox="0 0 200 160">
          {Array.from({ length: 9 }).map((_, i) => (
            <Flower
              key={i}
              cx={20 + i * 20}
              cy={20 + Math.sin((i / 8) * Math.PI) * 40}
              scale={0.24}
              colors={i % 2 ? ["#f97316", "#fbbf24"] : ["#facc15", "#f59e0b"]}
            />
          ))}
          <Flower cx={100} cy={115} scale={0.8} colors={["#facc15", "#f97316", "#b91c1c"]} />
        </Svg>
      );
    case "rakhi":
      return (
        <Svg className={className} viewBox="0 0 200 160">
          <g transform="translate(0 30) scale(2 1.2)">
            <RakhiThread thread={accent} bloom={["#fbbf24", "#ef4444", "#fde68a"]} />
          </g>
          <g transform="translate(120 90) scale(0.6)">
            <Gift box="#ffffff" ribbon={accent} />
          </g>
        </Svg>
      );
    case "tricolour":
      return (
        <Svg className={className} viewBox="0 0 200 160">
          <g transform="translate(50 30) scale(1)">
            <Chakra color="#000080" />
          </g>
          <path d="M10 140 L40 110 L70 140 Z" fill="#ff9933" opacity="0.9" />
          <path d="M140 30 L170 0 L200 30 L170 60 Z" fill="#138808" opacity="0.85" />
        </Svg>
      );
    case "fireworks":
      return (
        <Svg className={className} viewBox="0 0 200 160">
          <Burst color={accent} cx={70} cy={60} r={42} />
          <Burst color={highlight} cx={150} cy={50} r={28} />
          <Burst color="#f472b6" cx={140} cy={120} r={22} />
          <Star cx={40} cy={130} r={8} fill={accent} />
        </Svg>
      );
    default:
      return (
        <Svg className={className} viewBox="0 0 200 160">
          <g transform="translate(40 20) scale(1.1)">
            <Gift box={accent} ribbon={highlight} />
          </g>
          <Star cx={160} cy={30} r={12} fill={accent} />
          <Star cx={30} cy={40} r={8} fill={highlight} />
          <Star cx={170} cy={120} r={7} fill={highlight} />
        </Svg>
      );
  }
}

/** Small decorative elements scattered across the hero background. */
export function FestivalOrnaments({ theme }: { theme: FestivalTheme }) {
  const { accent, highlight } = theme;
  const float = "festive-float";
  const twinkle = "festive-twinkle";

  const sparkle = (style: CSSProperties, size: number, fill: string, cls = twinkle) => (
    <Svg className={`absolute ${cls}`} style={{ ...style, width: size, height: size }}>
      <Star cx={50} cy={50} r={48} fill={fill} />
    </Svg>
  );

  let garland: ReactNode = null;

  if (theme.decoration === "diyas" || theme.decoration === "marigold" || theme.decoration === "garba") {
    garland = (
      <Svg className="absolute inset-x-0 top-0 h-10 w-full sm:h-12" viewBox="0 0 400 40" style={{}}>
        <path d="M0 4 Q50 30 100 4 Q150 30 200 4 Q250 30 300 4 Q350 30 400 4" stroke={accent} strokeWidth="1.5" fill="none" opacity="0.7" />
        {Array.from({ length: 17 }).map((_, i) => {
          const x = i * 25;
          const phase = (x % 100) / 100;
          const y = 4 + Math.sin(phase * Math.PI) * 26 * 0.5 + 4;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i % 2 ? 3 : 4}
              fill={i % 2 ? highlight : accent}
              className={twinkle}
              style={{ animationDelay: `${(i % 5) * 0.4}s` }}
            />
          );
        })}
      </Svg>
    );
  } else if (theme.decoration === "crescent") {
    garland = (
      <div className="absolute inset-x-0 top-0 flex justify-around opacity-80">
        {[0, 1, 2, 3, 4].map((i) => (
          <Svg
            key={i}
            className={`h-14 w-6 sm:h-20 sm:w-8 ${float} ${i % 2 ? "hidden sm:block" : ""}`}
            viewBox="0 0 100 100"
            style={{ animationDelay: `${i * 0.5}s` }}
          >
            <Lantern body={accent} glow={i % 2 ? "#fef3c7" : "#fde68a"} />
          </Svg>
        ))}
      </div>
    );
  } else if (theme.decoration === "ornaments") {
    garland = (
      <>
        {[8, 22, 48, 70, 88].map((left, i) => (
          <Svg
            key={left}
            className={`absolute ${twinkle}`}
            style={{ left: `${left}%`, top: `${10 + (i % 3) * 20}%`, width: 14, height: 14, animationDelay: `${i * 0.3}s` }}
          >
            <Snowflake color="#ffffff" />
          </Svg>
        ))}
      </>
    );
  } else if (theme.decoration === "colour-splash") {
    garland = (
      <>
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/25 blur-2xl" />
        <div className="absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-fuchsia-500/30 blur-2xl" />
      </>
    );
  } else if (theme.decoration === "pookalam" || theme.decoration === "harvest") {
    garland = (
      <Svg className="absolute inset-x-0 bottom-0 h-3 w-full" viewBox="0 0 400 10" style={{}}>
        {Array.from({ length: 40 }).map((_, i) => (
          <rect key={i} x={i * 10} y="0" width="10" height="10" fill={i % 3 === 0 ? accent : i % 3 === 1 ? highlight : "#ffffff"} />
        ))}
      </Svg>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <style href="nexora-festive-animations" precedence="default">{`
        @keyframes festive-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes festive-twinkle { 0%,100% { opacity: .35; transform: scale(.85) } 50% { opacity: 1; transform: scale(1) } }
        .festive-float { animation: festive-float 4s ease-in-out infinite; }
        .festive-twinkle { animation: festive-twinkle 2.6s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        @media (prefers-reduced-motion: reduce) { .festive-float, .festive-twinkle { animation: none; } }
      `}</style>
      {garland}
      {sparkle({ left: "46%", top: "14%" }, 12, highlight)}
      {sparkle({ left: "6%", bottom: "14%", animationDelay: "0.8s" }, 10, accent)}
      {sparkle({ right: "4%", top: "40%", animationDelay: "1.4s" }, 9, highlight)}
      {sparkle({ left: "38%", bottom: "8%", animationDelay: "2s" }, 8, accent)}
    </div>
  );
}
