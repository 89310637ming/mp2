import { useState } from "react";
import type { Artwork } from "./types";
import { imageUrl } from "./api";

export function Icon({
  name,
  size = 20,
}: {
  name: "search" | "grid" | "list" | "arrow" | "close" | "external";
  size?: number;
}) {
  const paths = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="6" height="6" />
        <rect x="15" y="3" width="6" height="6" />
        <rect x="3" y="15" width="6" height="6" />
        <rect x="15" y="15" width="6" height="6" />
      </>
    ),
    list: (
      <>
        <path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    external: <path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export function ArtworkImage({
  artwork,
  eager = false,
}: {
  artwork: Artwork;
  eager?: boolean;
}) {
  const [failedId, setFailedId] = useState<string | null>(null);
  if (!artwork.image_id || failedId === artwork.image_id)
    return (
      <div className="image-placeholder">
        <span aria-hidden="true">▧</span>
        <span>Image unavailable</span>
      </div>
    );
  return (
    <img
      src={imageUrl(artwork.image_id)}
      referrerPolicy="no-referrer"
      alt={artwork.thumbnail?.alt_text || artwork.title}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailedId(artwork.image_id)}
    />
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className="message-state" role="alert">
      <span className="eyebrow">A brief intermission</span>
      <h2>Let’s try that again.</h2>
      <p>{message}</p>
      <button className="button" onClick={retry}>
        Try again <Icon name="arrow" />
      </button>
    </div>
  );
}
export function Skeletons() {
  return (
    <div className="art-grid" aria-label="Loading artworks" role="status">
      {Array.from({ length: 8 }, (_, index) => (
        <div className="skeleton-card" key={index}>
          <div className="skeleton-image" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      ))}
      <span className="sr-only">Loading artworks…</span>
    </div>
  );
}
