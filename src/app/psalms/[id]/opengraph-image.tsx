import { ImageResponse } from "next/og"
import { fetchPsalmDetail } from "@/db/queries/psalms"
import { parseSlug } from "@/lib/psalm-slugs"

export const runtime = "edge"
export const alt = "CPRC Psalter"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

interface Props {
  params: Promise<{ id: string }>
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s
}

export default async function Image({ params }: Props) {
  const { id: slug } = await params
  const parsed = parseSlug(slug)
  const psalmId = parsed?.psalmId
  const psalm = psalmId ? await fetchPsalmDetail(psalmId) : null

  const titleNumber = psalm?.id ?? psalmId ?? "?"
  const title = parsed?.versionLetter
    ? `Psalm ${titleNumber}${parsed.versionLetter}`
    : `Psalm ${titleNumber}`

  // Subtitle: first verse line of the first version (per UI-SPEC §2).
  // Truncate to 100 chars per UI-SPEC §2.
  const subtitle =
    truncate(psalm?.psalmVersions?.[0]?.firstLine ?? "", 100)

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
