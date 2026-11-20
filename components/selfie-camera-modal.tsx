"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type SelfieCameraModalProps = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

async function openCameraStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      "Camera is not available in this browser. Use From gallery instead.",
    );
  }

  const attempts: MediaStreamConstraints[] = [
    {
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
    {
      audio: false,
      video: { facingMode: { ideal: "user" } },
    },
    // Desktop webcams often fail facingMode filters — plain video works.
    { audio: false, video: true },
  ];

  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
    }
  }

  const name =
    lastError && typeof lastError === "object" && "name" in lastError
      ? String((lastError as { name?: string }).name)
      : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    throw new Error(
      "Camera permission was blocked. Allow camera for this site in the browser address bar, then try again.",
    );
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    throw new Error(
      "No camera was found on this computer. Plug in a webcam or use From gallery.",
    );
  }
  throw new Error(
    "Could not open the camera. Allow camera permission, or use From gallery.",
  );
}

export function SelfieCameraModal({
  open,
  onClose,
  onCapture,
}: SelfieCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stopCamera = useCallback(() => {
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
    }
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setReady(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setError(null);
      setCapturing(false);
      return;
    }

    let cancelled = false;
    setError(null);
    setReady(false);

    async function start() {
      try {
        const stream = await openCameraStream();
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        streamRef.current = stream;

        // Wait a frame so the portal video node is mounted.
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }

        const video = videoRef.current;
        if (!video) {
          for (const track of stream.getTracks()) track.stop();
          throw new Error("Camera preview failed to load. Please try again.");
        }

        video.srcObject = stream;
        video.muted = true;
        video.setAttribute("playsinline", "true");
        await video.play();
        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "Could not open the camera. Use From gallery instead.",
          );
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, retryKey, stopCamera]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !ready || capturing) return;
    const width = video.videoWidth || 720;
    const height = video.videoHeight || 720;
    if (!width || !height) {
      setError("Camera is still starting. Wait a second, then tap Capture.");
      return;
    }

    setCapturing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          setCapturing(false);
          if (!blob) {
            setError("Could not capture photo. Try again.");
            return;
          }
          const file = new File([blob], `selfie-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          stopCamera();
          onCapture(file);
          onClose();
        },
        "image/jpeg",
        0.92,
      );
    } catch {
      setCapturing(false);
      setError("Could not capture photo. Try again.");
    }
  }, [ready, capturing, onCapture, onClose, stopCamera]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-foreground/55 p-3 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close camera"
        onClick={() => {
          stopCamera();
          onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Take selfie"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-primary/20 bg-secondary shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-primary/15 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Take selfie</h2>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-xs font-semibold text-primary"
          >
            Close
          </button>
        </div>

        <div className="relative bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="aspect-[4/3] w-full bg-black object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          {!ready && !error ? (
            <p className="absolute inset-0 grid place-items-center text-sm text-white/80">
              Starting camera…
            </p>
          ) : null}
        </div>

        <div className="space-y-3 px-4 py-4">
          {error ? (
            <div className="space-y-2">
              <p className="text-xs leading-relaxed text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => setRetryKey((n) => n + 1)}
                className="text-xs font-semibold text-primary underline"
              >
                Try camera again
              </button>
            </div>
          ) : (
            <p className="text-xs text-foreground/60">
              Center your face, then click Capture. Allow camera access if the
              browser asks.
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="flex-1 rounded-xl border border-primary/25 py-2.5 text-sm font-semibold text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!ready || capturing}
              onClick={handleCapture}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {capturing ? "Saving…" : "Capture"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
