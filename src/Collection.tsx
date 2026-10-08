import { useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getArtwork,
  getTypes,
  PAGE_SIZE,
  readFilters,
  SEARCH_LIMIT,
  searchArtworks,
} from "./api";
import { ArtworkImage, ErrorState, Icon, Skeletons } from "./components";
import { useResource } from "./useResource";
import type { Artwork } from "./types";

const commonTypes = [
  "Painting",
  "Print",
  "Photograph",
  "Sculpture",
  "Drawing and Watercolor",
  "Textile",
];
const featuredLoader = (signal: AbortSignal) => getArtwork(27992, signal);
const typesLoader = (signal: AbortSignal) => getTypes(signal);

function Hero() {
  const { data } = useResource("featured", featuredLoader);
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="tiny-line" /> Art Institute of Chicago · Online
          collection
        </div>
        <h1 id="hero-title">
          A little curiosity.
          <br />
          <em>A world of art.</em>
        </h1>
        <p>
          Across centuries, cultures, and ways of seeing.
          <br className="desktop-break" /> Find a familiar favorite. Discover
          something unexpected.
        </p>
        <a href="#collection" className="text-link">
          Explore the collection <Icon name="arrow" />
        </a>
        <div className="hero-footnote">
          <span>OPEN TO DISCOVERY</span>
          <span>01 — ∞</span>
        </div>
      </div>
      <div className="hero-art">
        {data ? (
          <>
            <Link
              to={`/artwork/${data.id}`}
              className="featured-image"
              aria-label={`Explore ${data.title}`}
            >
              <ArtworkImage artwork={data} eager />
            </Link>
            <div className="featured-caption">
              <span>
                <strong>Georges Seurat</strong>
                <span>A Sunday on La Grande Jatte — 1884</span>
              </span>
              <Link
                to={`/artwork/${data.id}`}
                aria-label="View featured artwork"
              >
                <Icon name="external" size={18} />
              </Link>
            </div>
          </>
        ) : (
          <div className="hero-art-placeholder">
            <span className="eyebrow">A closer look at the extraordinary</span>
          </div>
        )}
      </div>
    </section>
  );
}
function Card({
  artwork,
  to,
  list,
}: {
  artwork: Artwork;
  to: string;
  list: boolean;
}) {
  return (
    <Link to={to} className={list ? "art-row" : "art-card"}>
      <div className="art-image">
        <ArtworkImage artwork={artwork} />
      </div>
      <div className="art-caption">
        <span className="art-type">
          {artwork.artwork_type_title || "Artwork"}
        </span>
        <h3>{artwork.title}</h3>
        <p>{artwork.artist_title || "Artist unknown"}</p>
        {!list && (
          <span className="art-date">
            {artwork.date_display || "Date unknown"}
          </span>
        )}
      </div>
      {list && (
        <>
          <span className="row-date">
            {artwork.date_display || "Date unknown"}
          </span>
          <span className="row-type">
            {artwork.artwork_type_title || "Artwork"}
          </span>
        </>
      )}
      <span className="card-arrow">
        <Icon name="arrow" size={18} />
      </span>
    </Link>
  );
}
export default function Collection({ view }: { view: "gallery" | "list" }) {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const key = params.toString();
  const loader = useCallback(
    (signal: AbortSignal) =>
      searchArtworks(readFilters(new URLSearchParams(key)), signal),
    [key],
  );
  const result = useResource(key, loader, filters.q ? 300 : 0);
  const types = useResource("types", typesLoader);
  const allTypes = [
    ...new Set([...commonTypes, ...(types.data || []), ...filters.types]),
  ];
  const total = result.data?.pagination.total ?? 0;
  const pages = Math.ceil(Math.min(total, SEARCH_LIMIT) / PAGE_SIZE);
  const start = (filters.page - 1) * PAGE_SIZE;
  function update(name: string, value: string | string[]) {
    const next = new URLSearchParams(params);
    next.delete(name);
    for (const item of Array.isArray(value) ? value : [value])
      if (item) next.append(name, item);
    if (name !== "page") next.delete("page");
    setParams(next, { replace: name === "q", preventScrollReset: true });
  }
  function toggleType(type: string) {
    update(
      "type",
      filters.types.includes(type)
        ? filters.types.filter((value) => value !== type)
        : [...filters.types, type],
    );
  }
  function artworkLink(id: number, index: number) {
    const query = new URLSearchParams(params);
    query.set("view", view);
    query.set("index", String(index));
    return `/artwork/${id}?${query}`;
  }
  const hasFilters =
    filters.q ||
    filters.types.length > 0 ||
    filters.images ||
    filters.publicDomain;
  function changePage(page: number) {
    update("page", String(page));
    document
      .getElementById("collection")
      ?.scrollIntoView({ behavior: "instant" });
  }
  const typeCheckbox = (type: string) => (
    <label className="filter-option" key={type}>
      <input
        type="checkbox"
        checked={filters.types.includes(type)}
        onChange={() => toggleType(type)}
      />
      <span>{type}</span>
    </label>
  );
  return (
    <>
      <Hero />
      <section
        id="collection"
        className="collection"
        aria-labelledby="collection-title"
      >
        <div className="collection-heading">
          <div>
            <span className="eyebrow">Your own way of seeing</span>
            <h2 id="collection-title">
              Explore the collection<span className="accent">.</span>
            </h2>
          </div>
          <p>A new perspective is just a search away.</p>
        </div>
        <div className="search-bar">
          <Icon name="search" size={24} />
          <label className="sr-only" htmlFor="search">
            Search the collection
          </label>
          <input
            id="search"
            type="search"
            value={filters.q}
            onChange={(event) => update("q", event.target.value)}
            placeholder="Search artists, artworks, places, and more…"
            autoComplete="off"
          />
          {filters.q && (
            <button
              aria-label="Clear search"
              className="icon-button"
              onClick={() => update("q", "")}
            >
              <Icon name="close" />
            </button>
          )}
          <span className="search-hint">THE FULL COLLECTION</span>
        </div>
        <div className="collection-layout">
          <aside className="filters" aria-label="Collection filters">
            <div className="filter-heading">
              <h3>Refine your visit</h3>
              {hasFilters && (
                <button className="reset" onClick={() => setParams({})}>
                  Reset
                </button>
              )}
            </div>
            <fieldset>
              <legend>ARTWORK TYPE</legend>
              {commonTypes.map(typeCheckbox)}
              <details
                className="more-types"
                open={
                  filters.types.some((type) => !commonTypes.includes(type)) ||
                  undefined
                }
              >
                <summary>More artwork types</summary>
                {allTypes
                  .filter((type) => !commonTypes.includes(type))
                  .sort()
                  .map(typeCheckbox)}
                {types.error && (
                  <button className="reset" onClick={types.retry}>
                    Retry loading types
                  </button>
                )}
              </details>
            </fieldset>
            <fieldset>
              <legend>AVAILABILITY</legend>
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.images}
                  onChange={(event) =>
                    update("images", event.target.checked ? "1" : "")
                  }
                />
                <span>With images</span>
              </label>
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.publicDomain}
                  onChange={(event) =>
                    update("public", event.target.checked ? "1" : "")
                  }
                />
                <span>Public domain</span>
              </label>
            </fieldset>
            <div className="curiosity-note">
              <span aria-hidden="true">✳</span>
              <h4>Follow your curiosity.</h4>
              <p>
                Try a color, a place, or an artist you’ve always wanted to know.
              </p>
              <button onClick={() => update("q", "Monet")}>
                Start with Monet <Icon name="arrow" size={16} />
              </button>
            </div>
          </aside>
          <div className="results">
            <div className="results-toolbar">
              <p className="result-count" role="status" aria-live="polite">
                {result.loading ? (
                  "Finding your next discovery…"
                ) : result.error ? (
                  "Collection unavailable"
                ) : (
                  <>
                    <strong>{total.toLocaleString()}</strong>{" "}
                    {total === 1 ? "artwork" : "artworks"}
                    {filters.q && <> for “{filters.q}”</>}
                  </>
                )}
              </p>
              <div className="view-switch" aria-label="Collection view">
                <Link
                  className={view === "gallery" ? "active" : ""}
                  to={`/gallery?${params}`}
                  aria-label="Gallery view"
                  aria-current={view === "gallery" ? "page" : undefined}
                >
                  <Icon name="grid" size={17} />
                </Link>
                <Link
                  className={view === "list" ? "active" : ""}
                  to={`/list?${params}`}
                  aria-label="List view"
                  aria-current={view === "list" ? "page" : undefined}
                >
                  <Icon name="list" size={19} />
                </Link>
              </div>
            </div>
            <div className="sorting">
              <label>
                Sort by{" "}
                <select
                  value={filters.sort}
                  onChange={(event) => update("sort", event.target.value)}
                >
                  <option value="recommended">
                    {filters.q ? "Relevance" : "Museum highlights"}
                  </option>
                  <option value="title">Title</option>
                  <option value="date">Date created</option>
                </select>
              </label>
              <label>
                Order{" "}
                <select
                  value={filters.order}
                  disabled={filters.sort === "recommended"}
                  onChange={(event) => update("order", event.target.value)}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </label>
              <span>
                {view === "gallery"
                  ? "A gallery of possibilities"
                  : "The collection, at a glance"}
              </span>
            </div>
            {filters.types.length > 0 && (
              <div className="selected-filters">
                {filters.types.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    aria-label={`Remove ${type} filter`}
                  >
                    {type}
                    <Icon name="close" size={13} />
                  </button>
                ))}
              </div>
            )}
            <div aria-busy={result.loading}>
              {result.loading ? (
                <Skeletons />
              ) : result.error ? (
                <ErrorState message={result.error} retry={result.retry} />
              ) : !result.data?.data.length ? (
                <div className="message-state">
                  <span className="eyebrow">Room for another discovery</span>
                  <h2>
                    {total > 0
                      ? "This page is beyond the results."
                      : "No artworks found."}
                  </h2>
                  <p>
                    {total > 0
                      ? "Return to the first page to explore this collection."
                      : "Try a different search or loosen your filters."}
                  </p>
                  <button
                    className="button"
                    onClick={() =>
                      total > 0 ? update("page", "1") : setParams({})
                    }
                  >
                    {total > 0
                      ? "Go to first page"
                      : "Clear search and filters"}
                    <Icon name="arrow" />
                  </button>
                </div>
              ) : (
                <>
                  {view === "list" && (
                    <div className="list-labels" aria-hidden="true">
                      <span>ARTWORK / ARTIST</span>
                      <span>DATE</span>
                      <span>TYPE</span>
                    </div>
                  )}
                  <div className={view === "gallery" ? "art-grid" : "art-list"}>
                    {result.data.data.map((artwork, index) => (
                      <Card
                        key={artwork.id}
                        artwork={artwork}
                        to={artworkLink(artwork.id, start + index)}
                        list={view === "list"}
                      />
                    ))}
                  </div>
                  <div className="pagination">
                    <span>
                      Showing {start + 1}–{Math.min(start + PAGE_SIZE, total)}{" "}
                      of {total.toLocaleString()}
                    </span>
                    <div>
                      <button
                        className="page-button"
                        disabled={filters.page <= 1}
                        onClick={() => changePage(filters.page - 1)}
                        aria-label="Previous page"
                      >
                        ←
                      </button>
                      <span>
                        Page {filters.page} of {pages.toLocaleString()}
                      </span>
                      <button
                        className="page-button"
                        disabled={filters.page >= pages}
                        onClick={() => changePage(filters.page + 1)}
                        aria-label="Next page"
                      >
                        →
                      </button>
                    </div>
                  </div>
                  {total > SEARCH_LIMIT && (
                    <p className="limit-note">
                      Search covers the full collection. Very broad searches
                      have a limited browsing window; use search or filters to
                      narrow your discoveries.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="closing-note">
        <span className="eyebrow">Art has a way of bringing us together</span>
        <p>
          A collection for everyone.
          <br />
          <em>A discovery that’s yours.</em>
        </p>
        <a
          className="text-link"
          href="https://www.artic.edu/collection"
          target="_blank"
          rel="noreferrer"
        >
          Visit the museum’s collection <Icon name="external" size={17} />
        </a>
      </section>
    </>
  );
}
