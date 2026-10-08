import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";

// GitHub Pages sends unknown paths to public/404.html, which carries the route
// back to index.html. Restore it before BrowserRouter reads the location.
const url = new URL(window.location.href);
const route = url.searchParams.get("__route");
const base = import.meta.env.BASE_URL;
if (route?.startsWith(base) && !route.startsWith("//")) {
  window.history.replaceState(null, "", route);
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={base}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
