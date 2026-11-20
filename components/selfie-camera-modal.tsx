"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SelfieCameraModalProps = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

export function SelfieCameraModal({
  open,
  onClose,
  onCapture,
}: SelfieCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const stopCamera = useCallback(() => {
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
    }
    const video = videoRef.current;
    if (video) video.srcObject = null;
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
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Camera is not available in this browser. Use From gallery instead.",
        );
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "user" },
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
        });
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) {
          setError(
            "Could not open the camera. Allow camera permission, or use From gallery.",
          );
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, stopCamera]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !ready || capturing) return;
    const width = video.videoWidth || 720;
    const height = video.videoHeight || 720;
    if (!width || !height) return;

    setCapturing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      // Mirror selfie so it matches what the user sees.
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-foreground/50 p-3 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close camera"
        onClick={() => {
          stopCamera();
          onClose();
        }}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-primary/20 bg-secondary shadow-xl">
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

        <div className="bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="aspect-square w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
        </div>

        <div className="space-y-3 px-4 py-4">
          {error ? (
            <p className="text-xs leading-relaxed text-red-700">{error}</p>
          ) : (
            <p className="text-xs text-foreground/60">
              Center your face, then tap Capture. Allow camera access if the
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
              disabled={!ready || capturing || Boolean(error)}
              onClick={handleCapture}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {capturing ? "Saving…" : "Capture"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
