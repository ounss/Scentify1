import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Header from "./components/Header";

// Pages
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import ParfumDetail from "./components/ParfumDetail";

// Loading Component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Chargement...</p>
    </div>
  </div>
);

// Route protégée pour les utilisateurs connectés
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

// Route protégée pour les admins
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
};

// Route publique (redirige si connecté)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

// Layout principal avec header
const Layout = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <main className="flex-1">{children}</main>
  </div>
);

// Composant App principal
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                style: {
                  background: "#059669",
                },
              },
              error: {
                style: {
                  background: "#DC2626",
                },
              },
            }}
          />

          <Routes>
            {/* Routes publiques avec layout */}
            <Route
              path="/"
              element={
                <Layout>
                  <Home />
                </Layout>
              }
            />

            <Route
              path="/parfum/:id"
              element={
                <Layout>
                  <ParfumDetail />
                </Layout>
              }
            />

            <Route
              path="/contact"
              element={
                <Layout>
                  <Contact />
                </Layout>
              }
            />

            {/* Route auth sans layout */}
            <Route
              path="/auth"
              element={
                <PublicRoute>
                  <Auth />
                </PublicRoute>
              }
            />

            {/* Routes privées */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Route admin */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />

            {/* Redirection pour les routes inconnues */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
