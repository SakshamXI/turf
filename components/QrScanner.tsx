"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

interface Props {
  onScan: (text: string) => void;
  active: boolean;
}

export default function QrScanner({ onScan, active }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!active) return;
    setError("");

    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      // "ideal" (not a bare/exact value) so it gracefully falls back to
      // whatever camera IS available — laptops usually only have a
      // front-facing camera and have no "environment" camera at all,
      // which otherwise fails even though permission was granted.
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
      } catch (err: any) {
        console.error("getUserMedia failed:", err);
        setError(
          err?.name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access for this site in your browser settings."
            : err?.name === "NotFoundError"
            ? "No camera was found on this device."
            : `Could not access the camera (${err?.name || "unknown error"}).`
        );
        return;
      }

      if (cancelled || !videoRef.current) return;
      videoRef.current.srcObject = stream;

      try {
        await videoRef.current.play();
      } catch (err: any) {
        // Permission was already granted (the stream exists) — this is a
        // separate, usually harmless, autoplay-policy rejection. The video
        // element still has autoPlay set below as a fallback, so scanning
        // can proceed even if this explicit call is blocked.
        console.warn("video.play() was blocked, relying on autoplay:", err);
      }

      tick();
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          if (code && code.data) {
            onScan(code.data);
            return; // stop the loop; parent controls re-enabling via `active`
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active, onScan]);

  return (
    <div className="rounded-lg overflow-hidden bg-pitchDark relative aspect-video">
      <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
      <canvas ref={canvasRef} className="hidden" />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-pitchDark text-cream text-sm text-center p-4">
          {error}
        </div>
      )}
    </div>
  );
}
