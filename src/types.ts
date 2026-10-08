export interface Artwork {
  id: number;
  title: string;
  artist_title: string | null;
  artist_display: string | null;
  date_display: string | null;
  date_start: number | null;
  image_id: string | null;
  thumbnail: { alt_text: string | null } | null;
  artwork_type_title: string | null;
  medium_display: string | null;
  dimensions: string | null;
  place_of_origin: string | null;
  department_title: string | null;
  credit_line: string | null;
  main_reference_number: string | null;
  description: string | null;
  is_public_domain: boolean;
  copyright_notice: string | null;
  gallery_title: string | null;
}
export interface Filters {
  q: string;
  types: string[];
  sort: "recommended" | "title" | "date";
  order: "asc" | "desc";
  images: boolean;
  publicDomain: boolean;
  page: number;
}
export interface SearchResult {
  data: Artwork[];
  pagination: { total: number; current_page: number; total_pages: number };
}
export interface Neighbor {
  id: number;
  index: number | null;
}
export interface Navigation {
  notice?: string;
  previous: Neighbor | null;
  next: Neighbor | null;
  total: number;
  contextual: boolean;
}
