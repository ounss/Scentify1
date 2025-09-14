// frontend/src/App.jsx - VERSION CORRIGÉE ROUTING
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
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

// ✅ LOADING COMPONENT AMÉLIORÉ avec timeout
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Chargement...</p>
    </div>
  </div>
);

// ✅ ROUTE PROTÉGÉE OPTIMISÉE
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // 🔄 Pendant le loading, afficher le spinner (pas de redirection)
  if (loading) {
    return <LoadingSpinner />;
  }

  // 🚫 Seulement après loading, rediriger si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

// ✅ ROUTE ADMIN INCHANGÉE
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
};

// ✅ ROUTE PUBLIQUE OPTIMISÉE (pour /auth uniquement)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // 🔄 Pendant le loading, ne pas rediriger automatiquement
  if (loading) {
    return <LoadingSpinner />;
  }

  // ✅ Si déjà connecté sur /auth, rediriger vers l'accueil
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

          <Routes>
            {/* ✅ ROUTE D'ACCUEIL - PAS DE PROTECTION, PAS DE REDIRECTION AUTO */}
            <Route
              path="/"
              element={
                <Layout>
                  <Home />
                </Layout>
              }
            />

            {/* ✅ ROUTE D'AUTHENTIFICATION - PUBLIQUE AVEC REDIRECTION SI CONNECTÉ */}
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

            {/* ✅ ROUTES PUBLIQUES SANS PROTECTION */}
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ✅ ROUTE PARFUM DÉTAIL - PUBLIQUE (tout le monde peut voir) */}
            <Route
              path="/parfum/:id"
              element={
                <Layout>
                  <ParfumDetail />
                </Layout>
              }
            />

            {/* ✅ ROUTE CONTACT - PUBLIQUE */}
            <Route
              path="/contact"
              element={
                <Layout>
                  <Contact />
                </Layout>
              }
            />

            {/* ✅ ROUTES PRIVÉES - NÉCESSITENT UNE CONNEXION */}
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

            <Route
              path="/menu"
              element={
                <MobileLayout>
                  <UserMenu />
                </MobileLayout>
              }
            />

            {/* ✅ ROUTES PARFUMS - PRIVÉES POUR CRÉER/MODIFIER */}
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

            {/* ✅ ROUTE ADMIN */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />

            {/* ✅ REDIRECTION POUR ROUTES INCONNUES */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
