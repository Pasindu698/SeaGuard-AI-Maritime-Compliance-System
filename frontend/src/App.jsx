
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
} from "react-router-dom";

import DocumentAnalysis from "./pages/documents/DocumentAnalysis";
import DocumentQuery from "./pages/documents/DocumentQuery";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import OfficerArea from "./pages/auth/OfficerArea";
import AdminArea from "./pages/auth/AdminArea";
import Profile from "./pages/auth/Profile";
import ResetPassword from "./pages/auth/ResetPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute";

import { useAuth } from "./context/AuthContext";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =========================
            PUBLIC ROUTES
        ========================= */}

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* =========================
            PROTECTED APPLICATION
        ========================= */}

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <SeaGuardLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function SeaGuardLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      {/* =========================
          HEADER
      ========================= */}

      <header className="main-header">
        <div className="header-inner">
          {/* SeaGuard Brand */}
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

          {/* Navigation */}
          <nav className="main-nav">
            {/* Document Analysis */}
            <NavLink
              to="/documents"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span>▣</span>
              Document Analysis
            </NavLink>

            {/* Document Q&A */}
            <NavLink
              to="/documents/query"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span>✦</span>
              Document Q&A
            </NavLink>

            {/* Officer Access */}
            {(user?.role === "officer" ||
              user?.role === "admin") && (
              <NavLink
                to="/officer"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span>⚓</span>
                Officer Area
              </NavLink>
            )}

            {/* Admin Access */}
            {user?.role === "admin" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span>🔐</span>
                Admin
              </NavLink>
            )}

            {/* Profile */}
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span>◉</span>
              My Profile
            </NavLink>

            {/* Logged-in User */}
            <div className="user-nav">
              <div className="user-info">
                <div className="user-name">
                  {user?.username}
                </div>

                <div className="user-role">
                  {user?.role}
                </div>
              </div>

              <button
                type="button"
                className="logout-button"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* =========================
          MAIN APPLICATION
      ========================= */}

      <main>
        <Routes>
          {/* Default Route */}
          <Route
            path="/"
            element={
              <Navigate to="/documents" replace />
            }
          />

          {/* Document Analysis */}
          <Route
            path="/documents"
            element={<DocumentAnalysis />}
          />

          {/* Document Q&A */}
          <Route
            path="/documents/query"
            element={<DocumentQuery />}
          />

          {/* Officer + Admin */}
          <Route
            path="/officer"
            element={
              <RoleProtectedRoute
                allowedRoles={["officer", "admin"]}
              >
                <OfficerArea />
              </RoleProtectedRoute>
            }
          />

          {/* Admin Only */}
          <Route
            path="/admin"
            element={
              <RoleProtectedRoute
                allowedRoles={["admin"]}
              >
                <AdminArea />
              </RoleProtectedRoute>
            }
          />

          {/* User Profile */}
          <Route
            path="/profile"
            element={<Profile />}
          />

          {/* Unknown Route */}
          <Route
            path="*"
            element={
              <Navigate to="/documents" replace />
            }
          />
        </Routes>
      </main>

      {/* =========================
          FOOTER
      ========================= */}

      <footer className="footer">
        <div>
          <strong>SeaGuard AI</strong>
          <span>
            {" "}
            • Maritime Emergency, Security & Incident Management
          </span>
        </div>

        <div className="system-status">
          <span className="status-dot"></span>
          Secure Session Active
        </div>
      </footer>
    </div>
  );
}

export default App;
