import { useCallback, useEffect, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  filterKey,
  getArtwork,
  getNavigation,
  PAGE_SIZE,
  readFilters,
} from "./api";
import { ArtworkImage, ErrorState, Icon } from "./components";
import { useResource } from "./useResource";
import type { Neighbor } from "./types";

function plainDescription(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  return (
    Array.from(document.querySelectorAll("p"))
      .map((paragraph) => paragraph.textContent || "")
      .filter(Boolean)
      .join("\n\n") ||
    document.body.textContent ||
    ""
  );
}
export default function Detail() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const validId =
    /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
  const indexValue = params.get("index");
  const indexNumber = indexValue === null ? null : Number(indexValue);
  const index =
    indexNumber !== null && Number.isInteger(indexNumber) && indexNumber >= 0
      ? indexNumber
      : null;
  const key = filterKey(readFilters(params));
  const load = useCallback(
    (signal: AbortSignal) =>
      validId
        ? getArtwork(Number(id), signal)
        : Promise.reject(new Error("Invalid artwork")),
    [id, validId],
  );
  const artwork = useResource(id, load);
  const loadNavigation = useCallback(
    (signal: AbortSignal) =>
      validId
        ? getNavigation(Number(id), index, JSON.parse(key), signal)
        : Promise.resolve(null),
    [id, index, key, validId],
  );
  const navigation = useResource(id + ":" + index + ":" + key, loadNavigation);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const item = artwork.data;
  useEffect(() => {
    window.scrollTo(0, 0);
    if (item) {
      document.title = `${item.title} — The Open Collection`;
      titleRef.current?.focus({ preventScroll: true });
    }
  }, [item]);
  const view = params.get("view") === "list" ? "list" : "gallery";
  const backParams = new URLSearchParams(params);
  backParams.delete("index");
  backParams.delete("view");
  if (index !== null)
    backParams.set("page", String(Math.floor(index / PAGE_SIZE) + 1));
  function neighborUrl(neighbor: Neighbor) {
    const query = new URLSearchParams(params);
    if (neighbor.index === null) {
      query.delete("index");
      query.delete("page");
    } else {
      query.set("index", String(neighbor.index));
      query.set("page", String(Math.floor(neighbor.index / PAGE_SIZE) + 1));
    }
    return `/artwork/${neighbor.id}?${query}`;
  }
  const description = item?.description
    ? plainDescription(item.description)
    : "";
  return (
    <section className="detail-page">
      <Link className="back-link" to={`/${view}?${backParams}`}>
        <span aria-hidden="true">←</span> Back to{" "}
        {view === "list" ? "list" : "collection"}
      </Link>
      {!validId ? (
        <div className="message-state">
          <h1>Artwork not found.</h1>
          <p>This artwork address isn’t valid.</p>
        </div>
      ) : artwork.loading ? (
        <div className="detail-loading" role="status">
          <div className="skeleton-image" />
          <span>Preparing a closer look…</span>
        </div>
      ) : artwork.error ? (
        <ErrorState message={artwork.error} retry={artwork.retry} />
      ) : (
        item && (
          <>
            <div className="detail-layout">
              <div className="detail-art">
                <div className="detail-image">
                  <ArtworkImage artwork={item} eager />
                </div>
                <p>
                  {item.is_public_domain
                    ? "Public domain"
                    : item.copyright_notice ||
                      "Image courtesy of the Art Institute of Chicago"}
                  <span>Art Institute of Chicago</span>
                </p>
              </div>
              <div className="detail-copy">
                <span className="eyebrow">
                  {item.artwork_type_title || "From the collection"}
                </span>
                <h1 tabIndex={-1} ref={titleRef}>
                  {item.title}
                </h1>
                <p className="detail-date">
                  {item.date_display || "Date unknown"}
                </p>
                <div className="artist-label">
                  <span className="eyebrow">THE ARTIST</span>
                  <p>
                    {item.artist_display ||
                      item.artist_title ||
                      "Artist unknown"}
                  </p>
                </div>
                <dl>
                  {[
                    ["Origin", item.place_of_origin],
                    ["Medium", item.medium_display],
                    ["Dimensions", item.dimensions],
                    ["Department", item.department_title],
                    ["On view", item.gallery_title],
                    ["Reference", item.main_reference_number],
                  ].map(
                    ([label, value]) =>
                      value && (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ),
                  )}
                </dl>
                <a
                  className="button"
                  href={`https://www.artic.edu/artworks/${item.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View at the museum <Icon name="external" size={17} />
                </a>
              </div>
            </div>
            {description && (
              <section className="artwork-story">
                <span className="eyebrow">A CLOSER LOOK</span>
                <div>
                  <h2>Behind the artwork</h2>
                  {description.split("\n\n").map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </section>
            )}
            {item.credit_line && (
              <p className="credit-line">
                <strong>Credit</strong> {item.credit_line}
              </p>
            )}
            <nav className="artwork-navigation" aria-label="Browse artworks">
              {navigation.data?.previous ? (
                <Link to={neighborUrl(navigation.data.previous)}>
                  <span aria-hidden="true">←</span>
                  <span>Previous artwork</span>
                </Link>
              ) : (
                <button disabled>← Previous artwork</button>
              )}
              <span>
                {navigation.loading
                  ? "Finding neighboring works…"
                  : navigation.data?.contextual && index !== null
                    ? `${index + 1} / ${navigation.data.total.toLocaleString()} in your results`
                    : "Explore the collection"}
              </span>
              {navigation.data?.next ? (
                <Link to={neighborUrl(navigation.data.next)}>
                  <span>Next artwork</span>
                  <Icon name="arrow" />
                </Link>
              ) : (
                <button disabled>Next artwork →</button>
              )}
            </nav>
            {navigation.data?.notice && (
              <p className="limit-note">{navigation.data.notice}</p>
            )}
            {navigation.error && (
              <div className="navigation-error" role="alert">
                <span>{navigation.error}</span>
                <button className="reset" onClick={navigation.retry}>
                  Retry navigation
                </button>
              </div>
            )}
          </>
        )
      )}
    </section>
  );
}
