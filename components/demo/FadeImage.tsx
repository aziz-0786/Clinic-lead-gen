"use client";

import { CSSProperties, useRef, useEffect } from "react";

interface FadeImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  loading?: "lazy" | "eager";
}

export function FadeImage({ src, alt, className, style, loading = "lazy" }: FadeImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Cached images fire onLoad before React mounts — complete is already true
    if (imgRef.current?.complete) {
      imgRef.current.style.opacity = "1";
    }
  }, []);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading={loading}
      className={`opacity-0 ${className ?? ""}`}
      style={{ transition: "opacity 0.7s cubic-bezier(0.22,1,0.36,1)", ...style }}
      onLoad={e => { (e.currentTarget as HTMLImageElement).style.opacity = "1"; }}
    />
  );
}
