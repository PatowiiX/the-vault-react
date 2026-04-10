import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import UserProfile from './UserProfile';
import UserOrders from './UserOrders';
import UserPaymentMethods from './UserPaymentMethods';
import './UserPanel.css';

const UserPanel = () => {
  const { currentUser, isLoggedIn, fetchUserOrders, fetchPaymentMethods } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [userOrders, setUserOrders] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);

  // Leer el tab de la URL (?tab=orders)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'orders') {
      setActiveTab('orders');
    } else if (tab === 'payment-methods') {
      setActiveTab('payment-methods');
    } else {
      setActiveTab('profile');
    }
  }, [location.search]);

  // Verificar autenticación
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/mi-cuenta' } });
    }
  }, [isLoggedIn, navigate]);

  // Cargar datos según el tab activo
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const loadData = async () => {
      setLoading(true);
      
      if (activeTab === 'orders') {
        const orders = await fetchUserOrders();
        setUserOrders(orders);
      }
      
      if (activeTab === 'payment-methods') {
        const methods = await fetchPaymentMethods();
        setPaymentMethods(methods);
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [activeTab, isLoggedIn, fetchUserOrders, fetchPaymentMethods]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Actualizar URL sin recargar la página
    navigate(`/mi-cuenta?tab=${tab}`, { replace: true });
  };

  const handleLogout = () => {
    if (window.confirm('¿Cerrar sesión?')) {
      localStorage.removeItem('retrosound_user');
      localStorage.removeItem('retrosound_cart');
      window.location.href = '/';
    }
  };

  if (!isLoggedIn) {
    return null;
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
                    src={currentUser?.avatar || 'https://via.placeholder.com/120x120?text=User'} 
                    alt="Avatar" 
                    className="user-avatar"
                  />
                </div>
                <h5 className="text-white mt-3 mb-0">{currentUser?.nombre || currentUser?.username}</h5>
                <p className="text-white-50 small">{currentUser?.email}</p>
              </div>
              
              <hr className="border-secondary" />
              
              <nav className="user-nav">
                <button 
                  className={`user-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => handleTabChange('profile')}
                >
                  <i className="bi bi-person-circle"></i> Mi Perfil
                </button>
                
                <button 
                  className={`user-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                  onClick={() => handleTabChange('orders')}
                >
                  <i className="bi bi-receipt"></i> Mis Pedidos
                </button>
                
                <button 
                  className={`user-nav-item ${activeTab === 'payment-methods' ? 'active' : ''}`}
                  onClick={() => handleTabChange('payment-methods')}
                >
                  <i className="bi bi-credit-card"></i> Métodos de Pago
                </button>
                
                <hr className="border-secondary" />
                
                <button 
                  className="user-nav-item text-danger"
                  onClick={handleLogout}
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
                  {activeTab === 'orders' && <UserOrders orders={userOrders} reloadOrders={() => {
                    fetchUserOrders().then(setUserOrders);
                  }} />}
                  {activeTab === 'payment-methods' && <UserPaymentMethods methods={paymentMethods} reloadMethods={() => {
                    fetchPaymentMethods().then(setPaymentMethods);
                  }} />}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPanel;