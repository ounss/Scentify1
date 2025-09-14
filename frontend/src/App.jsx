import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";

// Pages existantes
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import Error from "./pages/Error";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import ParfumDetail from "./components/ParfumDetail";

// Nouvelles pages mobiles
import ParfumForm from "./pages/ParfumForm";
import UserMenu from "./pages/UserMenu";
import FavoritesPage from "./pages/FavoritesPage";
import HistoryPage from "./pages/HistoryPage";

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

  // ⏱️ Timeout plus long pour mobile
  if (loading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    // 🆕 Redirection avec état pour éviter les boucles
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
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
    <Footer />
  </div>
);

// Layout mobile sans footer pour certaines pages
const MobileLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
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
                  background: "#8b3a3a",
                },
              },
            }}
          />

          {/* ✅ TOUTES LES ROUTES DANS UN SEUL COMPOSANT <Routes> */}
          <Routes>
            {/* ✅ Route d'accueil */}
            <Route
              path="/"
              element={
                <Layout>
                  <Home />
                </Layout>
              }
            />
            <Route path="*" element={<Error />} />
            {/* ✅ Route d'authentification */}
            <Route
              path="/auth"
              element={
                <PublicRoute>
                  <Layout>
                    <Auth />
                  </Layout>
                </PublicRoute>
              }
            />

            {/* ✅ Routes de vérification email et reset password (sans layout) */}
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ✅ Routes avec layout standard */}
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

            <Route
              path="/history"
              element={
                <PrivateRoute>
                  <Layout>
                    <HistoryPage />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* ✅ Routes mobiles avec layout mobile */}
            <Route
              path="/parfum/new"
              element={
                <PrivateRoute>
                  <MobileLayout>
                    <ParfumForm />
                  </MobileLayout>
                </PrivateRoute>
              }
            />

            <Route
              path="/parfum/edit/:id"
              element={
                <PrivateRoute>
                  <MobileLayout>
                    <ParfumForm />
                  </MobileLayout>
                </PrivateRoute>
              }
            />

            <Route
              path="/menu"
              element={
                <MobileLayout>
                  <UserMenu />
                </MobileLayout>
              }
            />

            <Route
              path="/favorites"
              element={
                <PrivateRoute>
                  <MobileLayout>
                    <FavoritesPage />
                  </MobileLayout>
                </PrivateRoute>
              }
            />

            {/* ✅ Route admin */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />

            {/* ✅ Redirection pour les routes inconnues */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
