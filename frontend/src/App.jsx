import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Publish from './pages/Publish.jsx';
import MyOffers from './pages/MyOffers.jsx';
import Admin from './pages/Admin.jsx';
import OfferDetail from './pages/OfferDetail.jsx';
import BusinessProfile from './pages/BusinessProfile.jsx';
import SellerPage from './pages/SellerPage.jsx';
import SellerPreviewPage from './pages/SellerPreviewPage.jsx';
export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/offers/:id" element={<OfferDetail />} />

            {/* Página pública de la tienda de un vendedor */}
            <Route path="/seller/:slug" element={<SellerPage />} />
            <Route path="/seller-preview/:slug" element={<SellerPreviewPage />} />

            <Route
              path="/publish"
              element={
                <ProtectedRoute>
                  <Publish />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-offers"
              element={
                <ProtectedRoute>
                  <MyOffers />
                </ProtectedRoute>
              }
            />
            {/* Perfil de negocio del vendedor (editable) */}
            <Route
              path="/business-profile"
              element={
                <ProtectedRoute>
                  <BusinessProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

function NotFound() {
  return (
    <div className="card" style={{ textAlign: 'center', marginTop: 24 }}>
      <h2 style={{ marginTop: 0 }}>404</h2>
      <p>La página que buscas no existe.</p>
    </div>
  );
}
