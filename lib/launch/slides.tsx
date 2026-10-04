import type { FounderSpotlight, LaunchProduct } from "@prisma/client";

export const WIDTH = 1080;
export const HEIGHT = 1350;
const BG = "#050505";
const ACCENT = "#818cf8";
const MUTED = "#a1a1aa";

/** Satori renders PNG/JPEG only, so ask imgix for PNG and skip formats it can't draw. */
function renderableImage(url: string | null, size: number): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith("imgix.net")) {
      parsed.searchParams.set("fm", "png");
      parsed.searchParams.set("w", String(size));
      parsed.searchParams.set("h", String(size));
      parsed.searchParams.set("fit", "crop");
      return parsed.toString();
    }
    return /\.(png|jpe?g)$/i.test(parsed.pathname) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

function Frame({ children, slide, total }: { children: React.ReactNode; slide: number; total: number }) {
  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        background: `radial-gradient(circle at 20% 0%, #1e1b4b 0%, ${BG} 55%)`,
        color: "#fafafa",
        padding: 80,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, color: MUTED }}>
        <div style={{ display: "flex", fontWeight: 700, color: "#fafafa" }}>
          100x<span style={{ color: ACCENT }}>Founder</span>
        </div>
        <div style={{ display: "flex" }}>{`${slide + 1}/${total}`}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>{children}</div>
      <div style={{ display: "flex", fontSize: 28, color: MUTED }}>100xfounder.com</div>
    </div>
  );
}

function Logo({ url, name, size }: { url: string | null; name: string; size: number }) {
  const src = renderableImage(url, size * 2);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} width={size} height={size} style={{ borderRadius: size / 5, objectFit: "cover" }} alt="" />;
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 5,
        background: "#27272a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size / 2,
        fontWeight: 700,
      }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function CtaSlide({ slide, total, headline }: { slide: number; total: number; headline: string }) {
  return (
    <Frame slide={slide} total={total}>
      <div style={{ display: "flex", fontSize: 84, fontWeight: 800, lineHeight: 1.1 }}>{headline}</div>
      <div style={{ display: "flex", fontSize: 40, color: MUTED, marginTop: 40, lineHeight: 1.4 }}>
        Launching a startup? Get a free listing and founder spotlight.
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 60,
          fontSize: 40,
          padding: "24px 40px",
          borderRadius: 20,
          background: ACCENT,
          color: BG,
          fontWeight: 700,
          alignSelf: "flex-start",
        }}
      >
        Link in bio → 100xfounder.com
      </div>
    </Frame>
  );
}

export function digestSlide(products: LaunchProduct[], dayLabel: string, slide: number) {
  const total = products.length + 2;
  if (slide === 0) {
    const [year, month, day] = dayLabel.split("-").map(Number);
    const date = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(
      new Date(Date.UTC(year, month - 1, day)),
    );
    return (
      <Frame slide={slide} total={total}>
        <div style={{ display: "flex", fontSize: 36, color: ACCENT, fontWeight: 700 }}>{date.toUpperCase()}</div>
        <div style={{ display: "flex", fontSize: 110, fontWeight: 800, lineHeight: 1.05, marginTop: 24 }}>
          {`Top ${products.length} startup launches of the day`}
        </div>
        <div style={{ display: "flex", fontSize: 40, color: MUTED, marginTop: 40 }}>
          The best of Product Hunt, curated. Swipe →
        </div>
      </Frame>
    );
  }
  if (slide > products.length) {
    return <CtaSlide slide={slide} total={total} headline="Follow for daily launches." />;
  }
  const product = products[slide - 1];
  return (
    <Frame slide={slide} total={total}>
      <div style={{ display: "flex", fontSize: 44, color: ACCENT, fontWeight: 700 }}>{`#${slide}`}</div>
      <div style={{ display: "flex", marginTop: 36 }}>
        <Logo url={product.thumbnailUrl} name={product.name} size={200} />
      </div>
      <div style={{ display: "flex", fontSize: 96, fontWeight: 800, marginTop: 48, lineHeight: 1.05 }}>
        {truncate(product.name, 28)}
      </div>
      <div style={{ display: "flex", fontSize: 48, color: "#e4e4e7", marginTop: 32, lineHeight: 1.3 }}>
        {truncate(product.tagline, 110)}
      </div>
      <div style={{ display: "flex", fontSize: 36, color: MUTED, marginTop: 40 }}>
        {`${product.votesCount} upvotes${product.topics[0] ? ` · ${product.topics[0]}` : ""}`}
      </div>
    </Frame>
  );
}

export function spotlightSlide(spotlight: FounderSpotlight & { product: LaunchProduct }, slide: number) {
  const total = 4;
  if (slide === 0) {
    const photo = renderableImage(spotlight.photoUrl, 640);
    return (
      <Frame slide={slide} total={total}>
        <div style={{ display: "flex", fontSize: 36, color: ACCENT, fontWeight: 700 }}>FOUNDER SPOTLIGHT</div>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            width={420}
            height={420}
            style={{ borderRadius: 210, objectFit: "cover", marginTop: 48 }}
            alt=""
          />
        ) : null}
        <div style={{ display: "flex", fontSize: 96, fontWeight: 800, marginTop: 48, lineHeight: 1.05 }}>
          {truncate(spotlight.founderName, 30)}
        </div>
        <div style={{ display: "flex", fontSize: 44, color: MUTED, marginTop: 24 }}>
          {truncate(`${spotlight.role ? `${spotlight.role}, ` : ""}${spotlight.product.name}`, 60)}
        </div>
      </Frame>
    );
  }
  if (slide === 1 || slide === 2) {
    const heading = slide === 1 ? `Why ${spotlight.product.name}?` : spotlight.storyAdvice ? "Advice for founders" : "The problem";
    const body = slide === 1 ? spotlight.storyOrigin : spotlight.storyAdvice || spotlight.storyProblem;
    return (
      <Frame slide={slide} total={total}>
        <div style={{ display: "flex", fontSize: 44, color: ACCENT, fontWeight: 700 }}>{truncate(heading, 40)}</div>
        <div style={{ display: "flex", fontSize: 60, lineHeight: 1.35, marginTop: 40 }}>
          {`“${truncate(body, 300)}”`}
        </div>
        <div style={{ display: "flex", fontSize: 36, color: MUTED, marginTop: 40 }}>{`— ${spotlight.founderName}`}</div>
      </Frame>
    );
  }
  return <CtaSlide slide={slide} total={total} headline={`Read ${spotlight.founderName.split(" ")[0]}'s full story.`} />;
}
