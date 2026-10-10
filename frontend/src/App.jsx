
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
} from "react-router-dom";

import Home from "./pages/Home";

import DocumentAnalysis from "./pages/documents/DocumentAnalysis";
import DocumentQuery from "./pages/documents/DocumentQuery";

import ComplianceSearch from "./pages/compliance/ComplianceSearch";
import ComplianceCheck from "./pages/compliance/ComplianceCheck";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import OfficerArea from "./pages/auth/OfficerArea";
import AdminArea from "./pages/auth/AdminArea";
import Profile from "./pages/auth/Profile";
import ResetPassword from "./pages/auth/ResetPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";

import Dashboard from "./pages/coordinator/Dashboard";
import IncidentCoordinator from "./pages/coordinator/IncidentCoordinator";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute";

import { useAuth } from "./context/AuthContext";

import "./App.css";

// =====================================
// MAIN APPLICATION ROUTER
// =====================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC HOME PAGE */}
        <Route path="/" element={<Home />} />

        {/* AUTHENTICATION */}
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

        {/* PROTECTED APPLICATION */}
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

// =====================================
// AUTHENTICATED APPLICATION LAYOUT
// =====================================

function SeaGuardLayout() {
  const { user, logout, token } = useAuth();

  const navClass = ({ isActive }) =>
    `nav-link ${isActive ? "active" : ""}`;

  return (
    <div className="app-shell">

      {/* HEADER */}
      <header className="main-header">
        <div className="header-inner">

          {/* BRAND */}
          <NavLink to="/dashboard" className="brand">
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

          {/* NAVIGATION */}
          <nav className="main-nav" aria-label="Application navigation">

            <NavLink
              to="/dashboard"
              className={navClass}
            >
              <span>⌂</span>
              Dashboard
            </NavLink>

            <NavLink
              to="/coordinator"
              className={navClass}
            >
              <span>⚡</span>
              Incident Coordinator
            </NavLink>

            <NavLink
              to="/documents"
              end
              className={navClass}
            >
              <span>▣</span>
              Document Analysis
            </NavLink>

            <NavLink
              to="/documents/query"
              className={navClass}
            >
              <span>✦</span>
              Document Q&A
            </NavLink>

            <NavLink
              to="/compliance/search"
              className={navClass}
            >
              <span>⌕</span>
              Compliance Search
            </NavLink>

            <NavLink
              to="/compliance/check"
              className={navClass}
            >
              <span>✓</span>
              Compliance Check
            </NavLink>

            {/* OFFICER ACCESS */}
            {(user?.role === "officer" ||
              user?.role === "admin") && (
              <NavLink
                to="/officer"
                className={navClass}
              >
                <span>⚓</span>
                Officer Area
              </NavLink>
            )}

            {/* ADMIN ACCESS */}
            {user?.role === "admin" && (
              <NavLink
                to="/admin"
                className={navClass}
              >
                <span>🔐</span>
                Admin
              </NavLink>
            )}

            {/* PROFILE */}
            <NavLink
              to="/profile"
              className={navClass}
            >
              <span>◉</span>
              My Profile
            </NavLink>

            {/* USER INFORMATION */}
            <div className="user-nav">
              <div className="user-info">
                <div className="user-name">
                  {user?.username || "User"}
                </div>

                <div className="user-role">
                  {user?.role || "crew"}
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

      {/* MAIN APPLICATION CONTENT */}
      <main className="app-main">
        <Routes>

          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/coordinator"
            element={<IncidentCoordinator />}
          />

          <Route
            path="/documents"
            element={<DocumentAnalysis />}
          />

          <Route
            path="/documents/query"
            element={<DocumentQuery />}
          />

          <Route
            path="/compliance/search"
            element={<ComplianceSearch token={token} />}
          />

          <Route
            path="/compliance/check"
            element={<ComplianceCheck token={token} />}
          />

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

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />

        </Routes>
      </main>

      {/* FOOTER */}
      <footer className="footer">

        <div>
          <strong>SeaGuard AI</strong>
          <span>
            {" "}
            • Maritime Emergency, Security & Incident Management
          </span>
        </div>

        <div className="system-status">
          <span className="status-dot" />
          Secure Session Active
        </div>

      </footer>

    </div>
  );
}

export default App;
