# The Open Collection

A React + TypeScript collection explorer using the Art Institute of Chicago API.

## Run locally

Use Node.js 22.12+ (or a supported newer LTS release).

```sh
npm install
npm run dev
```

Open http://localhost:5173/mp2/.

```sh
npm run lint
npm run build
npm run preview
```

## Assignment features

- `/gallery`: artwork media, live search, multiple artwork-type filters, image availability and public-domain filters.
- `/list`: live search; title and creation-date sorting in both directions. Sorting and filtering apply to the full API result set before pagination.
- `/artwork/:id`: artwork attributes and previous/next navigation, including across page boundaries. At the start/end of results, the corresponding button is disabled. Standalone detail URLs cycle by collection ID.
- React Router with `basename={import.meta.env.BASE_URL}`; internal navigation uses `Link`.
- Axios requests with cancellation, timeouts, a bounded five-minute memory cache, 300 ms search debounce, and retryable loading/error/empty states.
- Responsive ivory museum design, labeled controls, keyboard focus states, descriptive image alternatives, reduced-motion support, and missing-image fallbacks.

Search, sorting, filters, and page are kept in the URL. Detail links also retain the result position so refreshing and sharing preserve navigation context. A bare detail URL browses neighboring collection IDs.

Search covers the full museum collection, not a local sample. The app caps browsing at the documented maximum of 10,000 results per query, while handling stricter live API limits gracefully; the UI reports the full match count and prompts users to narrow broad searches. Artwork types are loaded from API aggregations. Multiple selected types are ORed; other filters are ANDed. Artwork descriptions are converted to plain text rather than injecting API HTML.

## GitHub Pages

- Vite base: `/mp2/`.
- `public/404.html` redirects deep links back to the entry page and `main.tsx` restores the original path before mounting the router.
- If you rename the GitHub repository, update the base in both `vite.config.ts` and `public/404.html`.
- Keep `package-lock.json` committed; the provided workflow uses `npm ci`.
- Set repository Settings → Pages → Source to **GitHub Actions**, then push to `main`.
- Expected deployment: https://89310637ming.github.io/mp2/.
- After deployment, verify a direct artwork link and refresh it.

## Demo checklist (under 3 minutes)

1. Show the deployed URL.
2. Open List view and search for Monet while typing.
3. Sort by Title ascending/descending, then Date created ascending/descending.
4. Open an artwork from List view; show metadata, Previous, and Next.
5. Return to Gallery; select and remove artwork-type filters.
6. Open an artwork from Gallery; show its unique URL and refresh.
7. Upload the demo to Drive, share with the instructor, and submit the form from the assignment README.

## Data and attribution

[Art Institute API documentation](https://api.artic.edu/docs/). No API key is needed. Artwork descriptions are provided under CC BY 4.0, and other API metadata under CC0, subject to the museum's terms. Images have individual rights statements; public-domain status and credit lines are shown on detail pages. This is an independent student project, not an official museum site. Fonts are served by Google Fonts, with system fallbacks.

The assignment also requires submitting AI chatlogs with the source and answering the LLM-use survey in the grading form. Include this conversation when preparing the submission.

## Working copies

The active development copy is `/Users/ming/CS409_mp2/mp2`, outside Desktop’s iCloud sync. An updated source copy is also kept at `/Users/ming/Desktop/CS409_mp2/mp2`. Run development commands from the active copy to avoid cloud-offloaded dependency delays.
