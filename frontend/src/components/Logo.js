// The Wolbi "W" mark — two navy chevrons framing a gold peak and a
// green diamond — reproduced as inline SVG from the brand kit's symbol
// artwork so it renders crisply at every size without a raster request.
// Used wherever the brand appears: nav, footer, favicons, OG image.

const NAVY = "#0D182A";
const GOLD = "#D4A23A";
const GREEN = "#3A7A44";

export function LogoMark({ size = 36, light = false, style }) {
  const navy = light ? "#FFFFFF" : NAVY;
  const halo = light ? "#0D182A" : "#FFFFFF";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Wolbi Royal Enterprise"
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      <path
        d="M 13,14 L 37,80 L 50,53 L 63,80 L 87,14"
        fill="none"
        stroke={navy}
        strokeWidth="15"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
      <polygon points="50,22 34,65 66,65" fill="none" stroke={halo} strokeWidth="3.6" />
      <polygon points="50,27 38,61 62,61" fill={GOLD} />
      <polygon points="50,60 59.5,70 50,80 40.5,70" fill="none" stroke={halo} strokeWidth="3.4" />
      <polygon points="50,60 59.5,70 50,80 40.5,70" fill={GREEN} />
    </svg>
  );
}

export function Logo({ size = 34, light = false, stacked = false, className, style }) {
  const nameColor = light ? "#ffffff" : "var(--foreground)";
  const subColor = light ? "var(--accent-light, #e0b457)" : "var(--accent)";
  return (
    <span
      className={className}
      style={{ display: "flex", alignItems: "center", gap: stacked ? 0 : 10, flexDirection: stacked ? "column" : "row", ...style }}
    >
      <LogoMark size={size} light={light} />
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.05, ...(stacked ? { alignItems: "center", marginTop: 6 } : {}) }}>
        <span style={{ fontSize: size * 0.44, fontWeight: 800, letterSpacing: "0.5px", color: nameColor }}>WOLBI</span>
        <span style={{ fontSize: size * 0.2, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: subColor }}>
          Royal Enterprise
        </span>
      </span>
    </span>
  );
}

export default Logo;
