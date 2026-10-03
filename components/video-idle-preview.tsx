"use client";

/** Calm video-tab preview — not the generating animation. */
export function VideoIdlePreview({
  previewUrl,
  onUpload,
}: {
  previewUrl: string | null;
  onUpload: (file: File | null) => void;
}) {
  return (
    <div className="relative mx-auto flex h-full w-full flex-col items-center justify-center gap-3 bg-[#2a1f33] px-4 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/jwelpixel-emblem-v4.png"
        alt=""
        className="h-16 w-16 object-contain opacity-95"
      />
      {previewUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            className="max-h-36 max-w-[70%] rounded-xl object-contain ring-1 ring-white/20"
          />
          <p className="text-sm font-semibold text-white">Jewelry ready</p>
          <p className="text-xs text-white/70">
            Set options below, then tap Generate video
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-white">No jewelry uploaded</p>
          <p className="text-xs text-white/70">
            Upload a piece first — Generate stays locked until then
          </p>
          <label className="mt-1 cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-bold text-primary">
            Upload jewelry
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
            />
          </label>
        </>
      )}
    </div>
  );
}
