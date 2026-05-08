import { toEmbedUrl } from "@/lib/youtube"

export function YouTubeEmbed({ url, title }: { url: string | null; title: string }) {
  const embedUrl = toEmbedUrl(url)
  if (!embedUrl) return null
  return (
    <div className="aspect-video w-full max-w-2xl mx-auto rounded-md overflow-hidden border border-border">
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      />
    </div>
  )
}
