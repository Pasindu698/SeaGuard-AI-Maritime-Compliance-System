
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import OfficerArea from "./pages/auth/OfficerArea";
import AdminArea from "./pages/auth/AdminArea";
import Profile from "./pages/auth/Profile";
import ResetPassword from "./pages/auth/ResetPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";

import Dashboard from "./pages/coordinator/Dashboard";
import AIWorkspace from "./pages/AIWorkspace/AIWorkspace";
import AIAssistant from "./pages/AIAssistant/AIAssistant";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute";

import { useAuth } from "./context/AuthContext";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Application */}
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
      {/* HEADER */}
      <header className="main-header">
        <div className="header-inner">
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

          {/* MAIN NAVIGATION */}
          <nav className="main-nav">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span>⌂</span>
              Dashboard
            </NavLink>

            <NavLink
              to="/ai-workspace"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span>✦</span>
              AI Workspace
            </NavLink>

            <NavLink
              to="/ai-assistant"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span>✧</span>
              AI Assistant
            </NavLink>

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

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span>◉</span>
              My Profile
            </NavLink>

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

      {/* MAIN APPLICATION */}
      <main>
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route path="/dashboard" element={<Dashboard />} />

          {/* UNIFIED MULTI-AGENT WORKSPACE */}
          <Route
            path="/ai-workspace"
            element={<AIWorkspace />}
          />

          <Route
            path="/ai-assistant"
            element={<AIAssistant />}
          />

          {/* LEGACY ROUTE REDIRECTS */}
          <Route
            path="/coordinator"
            element={<Navigate to="/ai-workspace" replace />}
          />

          <Route
            path="/documents"
            element={<Navigate to="/ai-workspace" replace />}
          />

          <Route
            path="/documents/query"
            element={<Navigate to="/ai-workspace" replace />}
          />

          <Route
            path="/compliance/search"
            element={<Navigate to="/ai-workspace" replace />}
          />

          <Route
            path="/compliance/check"
            element={<Navigate to="/ai-workspace" replace />}
          />

          {/* ROLE PROTECTED ROUTES */}
          <Route
            path="/officer"
            element={
              <RoleProtectedRoute allowedRoles={["officer", "admin"]}>
                <OfficerArea />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <AdminArea />
              </RoleProtectedRoute>
            }
          />

          <Route path="/profile" element={<Profile />} />

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
          <span className="status-dot"></span>
          Secure Session Active
        </div>
      </footer>
    </div>
  );
}

export default App;
