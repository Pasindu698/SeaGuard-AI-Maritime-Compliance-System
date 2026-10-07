import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import DocumentAnalysis from "./pages/documents/DocumentAnalysis";
import DocumentQuery from "./pages/documents/DocumentQuery";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">

        <header className="main-header">
          <div className="header-inner">

            <NavLink to="/documents" className="brand">
              <div className="brand-icon">⚓</div>

              <div>
                <div className="brand-title">
                  SeaGuard <span>AI</span>
                </div>

                <div className="brand-subtitle">
                  Maritime Safety & Intelligence
                </div>
              </div>
            </NavLink>

            <nav className="main-nav">
              <NavLink
                to="/documents"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span>▣</span>
                Document Analysis
              </NavLink>

              <NavLink
                to="/documents/query"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span>✦</span>
                Document Q&A
              </NavLink>
            </nav>

          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<DocumentAnalysis />} />

            <Route
              path="/documents"
              element={<DocumentAnalysis />}
            />

            <Route
              path="/documents/query"
              element={<DocumentQuery />}
            />
          </Routes>
        </main>

        <footer className="footer">
          <div>
            <strong>SeaGuard AI</strong>
            <span> • Maritime Emergency, Security & Incident Management</span>
          </div>

          <div className="system-status">
            <span className="status-dot"></span>
            AI System Active
          </div>
        </footer>

      </div>
    </BrowserRouter>
  );
}

export default App;