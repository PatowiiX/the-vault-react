import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';

import Header from './components/Header';
import Home from './pages/Home';
import Boveda from './pages/Boveda';
import Heritage from './pages/Heritage';
import Formatos from './pages/Formatos';
import AlbumDetails from './pages/AlbumDetails';
import MiCuenta from './pages/MiCuenta';
import PagoExitoso from './pages/PagoExitoso';
import Cart from './components/Cart';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import SearchBar from './components/SearchBar';
import AdminPanel from './components/admin/AdminPanel';
import OrdersPanel from './components/admin/OrdersPanel';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isLoggedIn, isAdmin, loading } = useApp();
  const location = useLocation();

  if (loading) {
    return (
      <div className="content-view fade-in">
        <div className="container text-center py-5">
          <div className="spinner-border text-pink" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Home />} />
    <Route path="/boveda" element={<Boveda />} />
    <Route path="/heritage" element={<Heritage />} />
    <Route path="/formatos" element={<Formatos />} />
    <Route path="/album/:id" element={<AlbumDetails />} />
    <Route path="/buscar" element={<SearchBar />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/reset-password/:token" element={<ResetPassword />} />
    <Route path="/pago-exitoso" element={<PagoExitoso />} />

    <Route
      path="/cart"
      element={
        <ProtectedRoute>
          <Cart />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mi-cuenta"
      element={
        <ProtectedRoute>
          <MiCuenta />
        </ProtectedRoute>
      }
    />

    <Route
      path="/admin"
      element={
        <ProtectedRoute adminOnly={true}>
          <AdminPanel />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/ordenes"
      element={
        <ProtectedRoute adminOnly={true}>
          <OrdersPanel />
        </ProtectedRoute>
      }
    />

    <Route
      path="*"
      element={
        <div className="content-view fade-in">
          <div className="container text-center py-5">
            <h1 className="text-white display-1">404</h1>
            <p className="text-white-50">Pagina no encontrada</p>
            <a href="/" className="btn btn-neon-pink mt-3">Volver al inicio</a>
          </div>
        </div>
      }
    />
  </Routes>
);

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
