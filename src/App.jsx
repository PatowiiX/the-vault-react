import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // ← Solo Routes, no BrowserRouter
import { AppProvider, useApp } from './context/AppContext';

// Layout Components
import Header from './components/Header';

// Pages (están en ./pages/)
import Home from './pages/Home';
import Boveda from './pages/Boveda';
import Heritage from './pages/Heritage';
import Formatos from './pages/Formatos';
import AlbumDetails from './pages/AlbumDetails';
import MiCuenta from './pages/MiCuenta';

// Components (los que SÍ existen en ./components/)
import Cart from './components/Cart';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import SearchBar from './components/SearchBar';

// Admin Pages
import AdminPanel from './components/admin/AdminPanel';
import OrdersPanel from './components/admin/OrdersPanel';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isLoggedIn, isAdmin } = useApp();
  
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Main App Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/boveda" element={<Boveda />} />
      <Route path="/heritage" element={<Heritage />} />
      <Route path="/formatos" element={<Formatos />} />
      <Route path="/album/:id" element={<AlbumDetails />} />
      <Route path="/buscar" element={<SearchBar />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      {/* Protected Routes (require login) */}
      <Route path="/cart" element={
        <ProtectedRoute>
          <Cart />
        </ProtectedRoute>
      } />
      <Route path="/mi-cuenta" element={
        <ProtectedRoute>
          <MiCuenta />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute adminOnly={true}>
          <AdminPanel />
        </ProtectedRoute>
      } />
      <Route path="/admin/ordenes" element={
        <ProtectedRoute adminOnly={true}>
          <OrdersPanel />
        </ProtectedRoute>
      } />
      
      {/* 404 Page */}
      <Route path="*" element={
        <div className="content-view fade-in">
          <div className="container text-center py-5">
            <h1 className="text-white display-1">404</h1>
            <p className="text-white-50">Página no encontrada</p>
            <a href="/" className="btn btn-neon-pink mt-3">Volver al inicio</a>
          </div>
        </div>
      } />
    </Routes>
  );
};

function App() {
  return (
    <AppProvider>
      <div className="app">
        <Header />
        <main className="main-content">
          <AppRoutes />
        </main>
      </div>
    </AppProvider>
  );
}

export default App;