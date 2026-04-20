import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import UserProfile from '../components/userpanel/UserProfile';
import UserOrders from '../components/userpanel/UserOrders';
import UserPaymentMethods from '../components/userpanel/UserPaymentMethods';
import '../components/userpanel/UserPanel.css';

const MiCuenta = () => {
  const {
    currentUser,
    loading: appLoading,
    logout,
    fetchUserOrders,
    fetchPaymentMethods
  } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [userOrders, setUserOrders] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');

    if (tab === 'orders') {
      setActiveTab('orders');
      return;
    }

    if (tab === 'payment-methods') {
      setActiveTab('payment-methods');
      return;
    }

    setActiveTab('profile');
  }, [location.search]);

  const loadUserData = useCallback(async () => {
    if (!currentUser?.id) {
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'orders') {
        const orders = await fetchUserOrders();
        setUserOrders(orders || []);
      }

      if (activeTab === 'payment-methods') {
        const methods = await fetchPaymentMethods();
        setPaymentMethods(methods || []);
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      setUserOrders([]);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentUser?.id, fetchPaymentMethods, fetchUserOrders]);

  useEffect(() => {
    if (!appLoading && currentUser?.id) {
      loadUserData();
    }
  }, [appLoading, currentUser?.id, loadUserData]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(tab === 'profile' ? '/mi-cuenta' : `/mi-cuenta?tab=${tab}`, { replace: true });
  };

  const handleLogout = () => {
    if (window.confirm('Cerrar sesion?')) {
      logout();
      navigate('/');
    }
  };

  if (appLoading) {
    return (
      <div className="user-panel-container">
        <div className="container text-center py-5">
          <div className="spinner-border text-info"></div>
          <p className="text-white mt-3">Cargando tu cuenta...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="user-panel-container">
      <div className="container">
        <div className="row">
          <div className="col-lg-3 mb-4">
            <div className="user-sidebar">
              <div className="text-center mb-4">
                <div className="avatar-upload">
                  <img
                    src={currentUser.avatar || 'https://via.placeholder.com/120x120?text=User'}
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
                <h5 className="text-white mt-3 mb-0">{currentUser.nombre || currentUser.username}</h5>
                <p className="text-white-50 small">{currentUser.email}</p>
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
                  <i className="bi bi-credit-card"></i> Metodos de Pago
                </button>

                <hr className="border-secondary" />

                <button
                  className="user-nav-item text-danger"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right"></i> Cerrar Sesion
                </button>
              </nav>
            </div>
          </div>

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
                  {activeTab === 'payment-methods' && (
                    <UserPaymentMethods methods={paymentMethods} reloadMethods={loadUserData} />
                  )}
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
