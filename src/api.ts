import axios from "axios";
import type { Artwork, Filters, Navigation, SearchResult } from "./types";

export const PAGE_SIZE = 20;
export const SEARCH_LIMIT = 10_000;
const api = axios.create({
  baseURL: "https://api.artic.edu/api/v1",
  timeout: 20_000,
});
const fields =
  "id,title,artist_title,artist_display,date_display,date_start,image_id,thumbnail,artwork_type_title,medium_display,dimensions,place_of_origin,department_title,credit_line,main_reference_number,description,is_public_domain,copyright_notice,gallery_title";
const cache = new Map<string, { at: number; value: unknown }>();

async function request<T>(
  path: string,
  params: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const key = path + JSON.stringify(params);
  const found = cache.get(key);
  if (found && Date.now() - found.at < 5 * 60_000) return found.value as T;
  const { data } = await api.get<T>(path, { params, signal });
  if (cache.size >= 80) cache.delete(cache.keys().next().value!);
  cache.set(key, { at: Date.now(), value: data });
  return data;
}
export function readFilters(params: URLSearchParams): Filters {
  const sort = params.get("sort");
  const page = Number(params.get("page"));
  return {
    q: params.get("q") ?? "",
    types: [...new Set(params.getAll("type"))].sort(),
    sort: sort === "title" || sort === "date" ? sort : "recommended",
    order: params.get("order") === "desc" ? "desc" : "asc",
    images: params.get("images") === "1",
    publicDomain: params.get("public") === "1",
    page:
      Number.isInteger(page) && page > 0
        ? Math.min(page, SEARCH_LIMIT / PAGE_SIZE)
        : 1,
  };
}
export const filterKey = (filters: Filters) => JSON.stringify(filters);
export function searchArtworks(
  filters: Filters,
  signal?: AbortSignal,
): Promise<SearchResult> {
  const filter: unknown[] = [];
  if (filters.types.length)
    filter.push({ terms: { "artwork_type_title.keyword": filters.types } });
  if (filters.images) filter.push({ exists: { field: "image_id" } });
  if (filters.publicDomain) filter.push({ term: { is_public_domain: true } });
  const must = filters.q.trim()
    ? {
        multi_match: {
          query: filters.q.trim(),
          fields: [
            "title^3",
            "artist_title^2",
            "description",
            "place_of_origin",
            "medium_display",
          ],
          operator: "and",
        },
      }
    : { match_all: { boost: 1 } };
  const sort =
    filters.sort === "recommended"
      ? [
          { [filters.q.trim() ? "_score" : "is_boosted"]: "desc" },
          { id: "asc" },
        ]
      : [
          {
            [filters.sort === "title" ? "title.keyword" : "date_start"]: {
              order: filters.order,
              missing: "_last",
            },
          },
          { id: "asc" },
        ];
  return request(
    "/artworks/search",
    {
      params: JSON.stringify({
        query: { bool: { must: [must], ...(filter.length ? { filter } : {}) } },
        sort,
        page: filters.page,
        limit: PAGE_SIZE,
        fields: fields.split(","),
      }),
    },
    signal,
  );
}
export async function getArtwork(
  id: number,
  signal?: AbortSignal,
): Promise<Artwork> {
  return (
    await request<{ data: Artwork }>(`/artworks/${id}`, { fields }, signal)
  ).data;
}
export async function getTypes(signal?: AbortSignal): Promise<string[]> {
  const data = await request<{
    aggregations: { types: { buckets: { key: string }[] } };
  }>(
    "/artworks/search",
    {
      params: JSON.stringify({
        limit: 0,
        aggs: {
          types: { terms: { field: "artwork_type_title.keyword", size: 100 } },
        },
      }),
    },
    signal,
  );
  return data.aggregations.types.buckets.map((bucket) => bucket.key);
}
export const imageUrl = (id: string) =>
  `https://www.artic.edu/iiif/2/${id}/full/843,/0/default.jpg`;

// URLs carry the search and position, so navigation also works after a refresh.
export async function getNavigation(
  id: number,
  index: number | null,
  filters: Filters,
  signal?: AbortSignal,
): Promise<Navigation> {
  if (index !== null && index >= 0 && index < SEARCH_LIMIT) {
    const page = Math.floor(index / PAGE_SIZE) + 1;
    const result = await searchArtworks({ ...filters, page }, signal);
    const total = Math.min(result.pagination.total, SEARCH_LIMIT);
    if (result.data[index % PAGE_SIZE]?.id === id) {
      if (total < 2)
        return { previous: null, next: null, total, contextual: true };
      const neighbor = async (position: number) => {
        const targetPage = Math.floor(position / PAGE_SIZE) + 1;
        const target =
          targetPage === page
            ? result
            : await searchArtworks({ ...filters, page: targetPage }, signal);
        const artwork = target.data[position % PAGE_SIZE];
        return artwork ? { id: artwork.id, index: position } : null;
      };
      const neighbors = await Promise.allSettled([
        index > 0 ? neighbor(index - 1) : Promise.resolve(null),
        index + 1 < total ? neighbor(index + 1) : Promise.resolve(null),
      ]);
      for (const result of neighbors) {
        if (result.status === "rejected" && !isSearchLimitError(result.reason))
          throw result.reason;
      }
      return {
        previous:
          neighbors[0].status === "fulfilled" ? neighbors[0].value : null,
        next: neighbors[1].status === "fulfilled" ? neighbors[1].value : null,
        total,
        contextual: true,
        notice: neighbors.some((result) => result.status === "rejected")
          ? "You’ve reached the museum’s browsing limit for this search. Narrow your search or filters to explore further."
          : undefined,
      };
    }
  }
  // A standalone /artwork/:id URL browses by collection ID, without invented search context.
  const adjacent = async (direction: "asc" | "desc") => {
    const lookup = (wrap: boolean) =>
      request<SearchResult>(
        "/artworks/search",
        {
          params: JSON.stringify({
            query: wrap
              ? { match_all: { boost: 1 } }
              : { range: { id: { [direction === "asc" ? "gt" : "lt"]: id } } },
            sort: [{ id: direction }],
            limit: 1,
            fields: ["id"],
          }),
        },
        signal,
      );
    let result = await lookup(false);
    if (!result.data.length) result = await lookup(true);
    return result.data[0] && result.data[0].id !== id
      ? { id: result.data[0].id, index: null }
      : null;
  };
  const [previous, next] = await Promise.all([
    adjacent("desc"),
    adjacent("asc"),
  ]);
  return { previous, next, total: 0, contextual: false };
}
function isSearchLimitError(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    error.response?.status === 403 &&
    error.response.data?.error === "Invalid number of results"
  );
}
export function errorMessage(error: unknown): string {
  if (isSearchLimitError(error))
    return "You’ve reached the museum’s browsing limit for this search. Narrow your search or filters to explore further.";
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404)
      return "We couldn’t find this artwork. It may no longer be in the online collection.";
    if (error.response?.status === 429)
      return "The museum is receiving too many requests. Please wait a moment and try again.";
    if (!error.response)
      return "We couldn’t reach the museum. Check your connection and try again.";
  }
  return "The collection is temporarily unavailable. Please try again in a moment.";
}
