"use client";

import { AppJourneyDemo } from "@/components/app-journey-demo";

export function LoginTutorial({
  embedUrl,
  rawUrl,
}: {
  embedUrl: string | null;
  rawUrl: string;
}) {
  if (!embedUrl && !rawUrl) {
    return <AppJourneyDemo />;
  }

  const isDirectVideo = embedUrl && /\.(mp4|webm)(\?|$)/i.test(embedUrl);

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/20 bg-secondary shadow-sm">
      <div className="border-b border-primary/15 px-4 py-3">
        <p className="text-sm font-medium text-foreground">
          How to use Jwelpixel
        </p>
        <p className="text-xs text-foreground/55">
          Features overview — not a login tutorial
        </p>
      </div>
      <div className="aspect-video w-full bg-black/90">
        {isDirectVideo ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={embedUrl!}
            controls
            playsInline
            className="h-full w-full object-contain"
          />
        ) : embedUrl ? (
          <iframe
            title="Jwelpixel app tutorial"
            src={embedUrl}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : null}
      </div>
    </div>
  );
}
