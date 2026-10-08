import { useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import Collection from "./Collection";
import Detail from "./Detail";
import { Icon } from "./components";

function App() {
  const location = useLocation();
  const isDetail = location.pathname.startsWith("/artwork/");
  const cleanParams = new URLSearchParams(location.search);
  cleanParams.delete("index");
  cleanParams.delete("view");
  useEffect(() => {
    if (!isDetail)
      document.title = "The Open Collection — Art Institute of Chicago";
  }, [isDetail]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <Link to="/" className="brand" aria-label="The Open Collection home">
          <span className="brand-mark" aria-hidden="true">
            oc<span>↗</span>
          </span>
          <span>
            <strong>The Open Collection</strong>
            <span>ART INSTITUTE OF CHICAGO</span>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <Link
            to={`/gallery?${cleanParams}`}
            className={
              !isDetail && location.pathname !== "/list" ? "selected" : ""
            }
          >
            Gallery
          </Link>
          <Link
            to={`/list?${cleanParams}`}
            className={location.pathname === "/list" ? "selected" : ""}
          >
            List view
          </Link>
          <a
            href="https://www.artic.edu"
            target="_blank"
            rel="noreferrer"
            className="museum-link"
          >
            The museum <Icon name="external" size={14} />
          </a>
        </nav>
      </header>
      <main id="main">
        <Routes>
          <Route path="/" element={<Collection view="gallery" />} />
          <Route path="/gallery" element={<Collection view="gallery" />} />
          <Route path="/list" element={<Collection view="list" />} />
          <Route path="/artwork/:id" element={<Detail />} />
          <Route
            path="*"
            element={
              <section className="message-state not-found">
                <span className="eyebrow">A wrong turn, a new beginning</span>
                <h1>This room doesn’t exist.</h1>
                <Link to="/gallery" className="button">
                  Return to the collection <Icon name="arrow" />
                </Link>
              </section>
            }
          />
        </Routes>
      </main>
      <footer className="site-footer">
        <Link to="/" className="footer-brand">
          The Open Collection<span>Art, for the curious.</span>
        </Link>
        <p>
          An independent student project.
          <br />
          Artworks and collection data from the{" "}
          <a href="https://www.artic.edu" target="_blank" rel="noreferrer">
            Art Institute of Chicago
          </a>
          .
        </p>
        <a href="https://api.artic.edu/docs/" target="_blank" rel="noreferrer">
          Powered by the museum’s API <Icon name="external" size={14} />
        </a>
      </footer>
    </>
  );
}
export default App;
