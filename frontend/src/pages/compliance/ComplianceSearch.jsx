
import { useState } from "react";
import {
  Search,
  BookOpen,
  FileText,
  ShieldCheck,
  AlertCircle,
  LoaderCircle,
  ArrowRight,
  RotateCcw,
  Ship,
} from "lucide-react";

import { searchCompliance } from "../../services/complianceApi";
import "./Compliance.css";

const suggestedQueries = [
  {
    title: "Fire Emergency",
    query: "What are the emergency procedures for a fire on board?",
  },
  {
    title: "Collision",
    query: "What procedures should be followed after a vessel collision?",
  },
  {
    title: "Person Overboard",
    query: "What are the emergency procedures for person overboard?",
  },
  {
    title: "Security Incident",
    query: "What procedures apply to unauthorized vessel access?",
  },
];

export default function ComplianceSearch({ token }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  const handleSearch = async (searchText = query) => {
    const cleanQuery = searchText.trim();

    if (cleanQuery.length < 2) {
      setError("Please enter a valid search query.");
      return;
    }

    setQuery(cleanQuery);
    setError("");
    setLoading(true);
    setSearched(false);
    setResults([]);

    try {
      const data = await searchCompliance(
        cleanQuery,
        token,
        5
      );

      setResults(data.results || []);
      setLastQuery(cleanQuery);
      setSearched(true);
    } catch (err) {
      setError(err.message || "Unable to search procedures.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuery("");
    setResults([]);
    setError("");
    setSearched(false);
    setLastQuery("");
  };

  return (
    <div className="compliance-page">
      <div className="compliance-container">

        <div className="compliance-hero">
          <div className="compliance-hero-content">
            <span className="compliance-eyebrow">
              <Ship size={16} />
              SEAGUARD AI • COMPLIANCE AGENT
            </span>

            <h1>Maritime Knowledge Search</h1>

            <p>
              Search maritime emergency procedures and
              safety guidance using intelligent hybrid retrieval.
            </p>
          </div>

          <div className="compliance-hero-icon">
            <BookOpen size={42} />
          </div>
        </div>

        <div className="compliance-search-panel">
          <div className="compliance-section-heading">
            <div className="compliance-heading-icon">
              <Search size={21} />
            </div>

            <div>
              <h2>Search Knowledge Base</h2>
              <p>
                Ask a question about maritime safety
                or emergency procedures.
              </p>
            </div>
          </div>

          <form
            className="compliance-search-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
          >
            <div className="compliance-input-wrapper">
              <Search size={20} />

              <input
                type="text"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="e.g. What are the procedures for a fire emergency?"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="compliance-primary-btn"
              disabled={loading}
            >
              {loading ? (
                <LoaderCircle
                  size={18}
                  className="compliance-spin"
                />
              ) : (
                <Search size={18} />
              )}

              {loading ? "Searching..." : "Search"}
            </button>

            <button
              type="button"
              className="compliance-reset-btn"
              onClick={handleReset}
              disabled={loading}
              title="Reset search"
            >
              <RotateCcw size={19} />
            </button>
          </form>

          <div className="compliance-suggestions">
            <span>Quick searches:</span>

            <div className="compliance-suggestion-list">
              {suggestedQueries.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => handleSearch(item.query)}
                  disabled={loading}
                >
                  {item.title}
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="compliance-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="compliance-feedback">
            <LoaderCircle
              size={30}
              className="compliance-spin"
            />
            <h3>Searching maritime knowledge...</h3>
            <p>
              Retrieving relevant procedures and references.
            </p>
          </div>
        )}

        {!loading && searched && (
          <section className="compliance-results-section">
            <div className="compliance-results-header">
              <div>
                <span className="compliance-results-label">
                  KNOWLEDGE RETRIEVAL
                </span>
                <h2>Search Results</h2>
                <p>
                  Results for: <strong>{lastQuery}</strong>
                </p>
              </div>

              <span className="compliance-result-count">
                {results.length} Results
              </span>
            </div>

            {results.length === 0 ? (
              <div className="compliance-feedback">
                <FileText size={30} />
                <h3>No matching procedures found</h3>
                <p>
                  Try another maritime-related search query.
                </p>
              </div>
            ) : (
              <div className="compliance-results-list">
                {results.map((result, index) => (
                  <article
                    className="compliance-result-card"
                    key={`${result.filename}-${result.chunk_id}-${index}`}
                  >
                    <div className="compliance-result-top">
                      <div className="compliance-result-title">
                        <div className="compliance-file-icon">
                          <FileText size={23} />
                        </div>

                        <div>
                          <span className="compliance-source-label">
                            SOURCE DOCUMENT
                          </span>
                          <h3>{result.filename}</h3>
                        </div>
                      </div>

                      <span className="compliance-rank">
                        Result #{index + 1}
                      </span>
                    </div>

                    <p className="compliance-result-content">
                      {result.content}
                    </p>

                    <div className="compliance-result-footer">
                      <span>
                        <BookOpen size={15} />
                        {result.source}
                      </span>

                      <span>
                        <FileText size={15} />
                        Chunk {result.chunk_id}
                      </span>

                      {result.detected_incident && (
                        <span className="compliance-incident-tag">
                          <ShieldCheck size={15} />
                          {result.detected_incident.replace(
                            /_/g,
                            " "
                          )}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="compliance-disclaimer">
          <ShieldCheck size={19} />
          <p>
            SeaGuard AI provides informational retrieval
            assistance. Always verify procedures against
            applicable official maritime regulations and
            vessel-specific safety documentation.
          </p>
        </div>
      </div>
    </div>
  );
}
