import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import './styles/custom.css';

// Importar componentes
import Header from './components/Header';
import Home from './pages/Home';
import Cart from './components/Cart';
import AdminPanel from './components/admin/AdminPanel';

// Importar nuevas páginas
import Heritage from './pages/Heritage';
import Formatos from './pages/Formatos';
import Boveda from './pages/Boveda';
import AlbumDetails from './pages/AlbumDetails';
import PagoExitoso from './pages/PagoExitoso';
import ForgotPassword from './components/ForgotPassword'; 
import ResetPassword from './components/ResetPassword'; 

// Componente de debug de rutas
const RouteDebugger = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('📍 RUTA ACTUAL:', location.pathname);
    console.log('🔄 Componente a renderizar:', location.pathname);
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
};

// Componentes de protección
const RequireAuth = ({ children }) => {
  const { isLoggedIn } = useApp();
  return isLoggedIn ? children : <Navigate to="/" />;
};

const RequireAdmin = ({ children }) => {
  const { isAdmin } = useApp();
  return isAdmin ? children : <Navigate to="/" />;
};

// Componente de contenido principal
function AppContent() {
  return (
    <>
      <RouteDebugger />
      <Header />
      <main className="main-content">
        <Routes>
          {/* RUTA PRINCIPAL */}
          <Route path="/" element={<Home />} />
          
          {/* PÁGINAS PÚBLICAS */}
          <Route path="/heritage" element={<Heritage />} />
          <Route path="/formatos" element={<Formatos />} />
          <Route path="/boveda" element={<Boveda />} />
          
          {/* DETALLES DE ÁLBUM */}
          <Route path="/album/:id" element={<AlbumDetails />} />
          
          {/* CARRITO */}
          <Route path="/cart" element={<Cart />} />
          
          {/*  RUTAS DE RECUPERACIÓN DE CONTRASEÑA */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* RUTA PARA PAGO EXITOSO */}
          <Route path="/pago-exitoso" element={<PagoExitoso />} />
          
          {/* ADMIN - PROTEGIDO */}
          <Route 
            path="/admin" 
            element={
              <RequireAuth>
                <RequireAdmin>
                  <AdminPanel />
                </RequireAdmin>
              </RequireAuth>
            } 
          />
          
          {/* RUTA POR DEFECTO - 404 */}
          <Route path="*" element={
            <div className="content-view fade-in">
              <div className="container text-center py-5">
                <h1 className="text-white bungee-font">404</h1>
                <p className="text-white-50">Página no encontrada</p>
                <a href="/" className="btn btn-neon-pink mt-3">
                  Volver al inicio
                </a>
              </div>
            </div>
          } />
        </Routes>
      </main>
    </>
  );
}

export default AppContent;