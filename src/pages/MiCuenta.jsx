import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import UserProfile from '../components/userpanel/UserProfile';
import UserOrders from '../components/userpanel/UserOrders';
import UserPaymentMethods from '../components/userpanel/UserPaymentMethods';
import '../components/userpanel/UserPanel.css';

const MiCuenta = () => {
  const { currentUser, isLoggedIn, fetchUserOrders, fetchPaymentMethods } = useApp();
  const [activeTab, setActiveTab] = useState('profile');
  const [userOrders, setUserOrders] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // FORZAR lectura del usuario desde localStorage si el contexto no lo tiene
  const [localUser, setLocalUser] = useState(null);
  
  useEffect(() => {
    // Intentar obtener usuario de localStorage si el contexto no lo tiene
    const savedUser = localStorage.getItem('retrosound_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setLocalUser(user);
      console.log("📦 Usuario cargado desde localStorage:", user);
    } else {
      console.log("⚠️ No hay usuario en localStorage");
    }
  }, []);

  // Determinar si hay usuario (de contexto o de localStorage)
  const hasUser = isLoggedIn || localUser !== null;
  const activeUser = currentUser || localUser;

  console.log("🔍 MiCuenta - isLoggedIn:", isLoggedIn);
  console.log("🔍 MiCuenta - currentUser:", currentUser);
  console.log("🔍 MiCuenta - localUser:", localUser);
  console.log("🔍 MiCuenta - hasUser:", hasUser);

  useEffect(() => {
    if (!hasUser) {
      console.log("⚠️ No hay usuario, redirigiendo a /login");
      window.location.href = '/login';
      return;
    }

    loadUserData();
  }, [hasUser, activeTab]);

  const loadUserData = async () => {
    setLoading(true);
    
    if (activeTab === 'orders') {
      try {
        const orders = await fetchUserOrders();
        setUserOrders(orders || []);
      } catch (error) {
        console.error("Error cargando pedidos:", error);
        setUserOrders([]);
      }
    }
    
    if (activeTab === 'payment-methods') {
      try {
        const methods = await fetchPaymentMethods();
        setPaymentMethods(methods || []);
      } catch (error) {
        console.error("Error cargando métodos de pago:", error);
        setPaymentMethods([]);
      }
    }
    
    setLoading(false);
  };

  // Si no hay usuario, mostrar mensaje
  if (!hasUser) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        paddingTop: '100px'
      }}>
        <h1>🔐 No has iniciado sesión</h1>
        <p>Por favor, inicia sesión para ver tu cuenta.</p>
        <a href="/login" style={{ 
          color: '#00ff88', 
          marginTop: '20px',
          padding: '10px 20px',
          border: '1px solid #00ff88',
          borderRadius: '5px',
          textDecoration: 'none'
        }}>
          Ir a login
        </a>
      </div>
    );
  }

  return (
    <div className="user-panel-container">
      <div className="container">
        <div className="row">
          {/* Sidebar */}
          <div className="col-lg-3 mb-4">
            <div className="user-sidebar">
              <div className="text-center mb-4">
                <div className="avatar-upload">
                  <img 
                    src={activeUser?.avatar || 'https://via.placeholder.com/120x120?text=User'} 
                    alt="Avatar" 
                    className="user-avatar"
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #00ff88'
                    }}
                  />
                </div>
                <h5 className="text-white mt-3 mb-0">{activeUser?.nombre || activeUser?.username}</h5>
                <p className="text-white-50 small">{activeUser?.email}</p>
              </div>
              
              <hr className="border-secondary" />
              
              <nav className="user-nav">
                <button 
                  className={`user-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <i className="bi bi-person-circle"></i> Mi Perfil
                </button>
                
                <button 
                  className={`user-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                  onClick={() => setActiveTab('orders')}
                >
                  <i className="bi bi-receipt"></i> Mis Pedidos
                </button>
                
                <button 
                  className={`user-nav-item ${activeTab === 'payment-methods' ? 'active' : ''}`}
                  onClick={() => setActiveTab('payment-methods')}
                >
                  <i className="bi bi-credit-card"></i> Métodos de Pago
                </button>
                
                <hr className="border-secondary" />
                
                <button 
                  className="user-nav-item text-danger"
                  onClick={() => {
                    if (window.confirm('¿Cerrar sesión?')) {
                      localStorage.removeItem('retrosound_user');
                      localStorage.removeItem('retrosound_cart');
                      window.location.href = '/';
                    }
                  }}
                >
                  <i className="bi bi-box-arrow-right"></i> Cerrar Sesión
                </button>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="col-lg-9">
            <div className="user-panel-card p-4">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-info"></div>
                  <p className="text-white mt-3">Cargando...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'profile' && <UserProfile />}
                  {activeTab === 'orders' && <UserOrders orders={userOrders} reloadOrders={loadUserData} />}
                  {activeTab === 'payment-methods' && <UserPaymentMethods methods={paymentMethods} reloadMethods={loadUserData} />}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiCuenta;