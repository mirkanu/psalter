import { ImageResponse } from "next/og"
import { fetchTuneBySlug } from "@/db/queries/tunes"
import { fetchTuneDetail } from "@/db/queries/tunes"
import { isNumericTuneSlug } from "@/lib/tune-slug"

export const runtime = "nodejs"
export const alt = "CPRC Psalter"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

interface Props {
  params: Promise<{ slug: string }>
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s
}

export default async function Image({ params }: Props) {
  const { slug } = await params

  // Mirror src/app/tunes/[slug]/page.tsx exactly:
  //   numeric slug -> legacy id lookup, name slug -> name lookup
  // Use fetchTuneDetail directly for numeric slugs (mirrors generateMetadata).
  const tune = isNumericTuneSlug(slug)
    ? await fetchTuneDetail(Number(slug))
    : await fetchTuneBySlug(slug)

  const title = tune?.name ?? "Tune"

  // Subtitle is the raw DB meter string — never abbreviated to "LM" alone
  // (UI-SPEC §2 explicitly: "exact DB string, never abbreviated to 'LM' alone").
  // Examples of valid DB strings: "Common Meter (CM)", "LM (long meter, 88 88)",
  // "SM (short meter, 66 86)", "CMD (common meter double, 86 86 88 88)".
  const subtitle = truncate(tune?.meter ?? "", 100)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "oklch(0.205 0 0)",
          color: "#ffffff",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 72, fontWeight: 600, lineHeight: 1.1 }}>{title}</div>
          {subtitle && (
            <div
              style={{
                fontSize: 36,
                fontWeight: 400,
                color: "oklch(0.85 0 0)",
                marginTop: 24,
                lineHeight: 1.3,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: "oklch(0.708 0 0)",
          }}
        >
          <span>CPRC Psalter</span>
          <span>psalter.gsdlabs.dev</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
