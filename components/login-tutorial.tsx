"use client";

export function LoginTutorial({
  embedUrl,
  rawUrl,
}: {
  embedUrl: string | null;
  rawUrl: string;
}) {
  if (!embedUrl && !rawUrl) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-secondary/80 p-5 text-sm text-foreground/70">
        <p className="font-medium text-foreground">App tutorial</p>
        <p className="mt-2">
          Watch how to upload jewelry, pick model or background, choose WhatsApp /
          Instagram formats, and generate. Admin can set the video URL in Settings.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-foreground/60">
          <li>Upload your jewelry photo</li>
          <li>Model shot or background mode</li>
          <li>Formats for WhatsApp &amp; Instagram</li>
          <li>Gold+: custom prompt, brand &amp; festival</li>
          <li>Generate → download or share</li>
        </ul>
      </div>
    );
  }

  const isDirectVideo = embedUrl && /\.(mp4|webm)(\?|$)/i.test(embedUrl);

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/20 bg-secondary shadow-sm">
      <div className="border-b border-primary/15 px-4 py-3">
        <p className="text-sm font-medium text-foreground">
          How to use Jewel Studio
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
            title="Jewel Studio app tutorial"
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
