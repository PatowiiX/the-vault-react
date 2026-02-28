import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const PagoExitoso = () => {
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  //  evitar doble ejecución en React Strict Mode
  const isCapturing = useRef(false);

  const { 
    capturePayPalOrder, 
    currentUser,
    checkoutData,
    clearCart,
    refreshProducts // Importante para ver el nuevo stock
  } = useApp();

  useEffect(() => {
    const capturePayment = async () => {
      // 1. Evitar doble captura
      if (isCapturing.current) return;

      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (!token) {
          navigate('/cart');
          return;
        }

        if (!checkoutData) {
          setError('No se encontraron datos de la compra. Por favor, intenta de nuevo.');
          setProcessing(false);
          return;
        }

        isCapturing.current = true; // Bloquea futuras ejecuciones
        console.log("🚀 Iniciando captura para la orden:", token);

        // 2. Ejecutar captura en el Backend
        const data = await capturePayPalOrder(token);
        
        console.log("✅ Resultado final:", data);

        if (data.ok) {
          setResult(data);
          clearCart(); // Limpiamos el carrito local
          await refreshProducts(); // Actualizamos el stock en la interfaz global
        } else {
          throw new Error(data.error || 'Error al procesar el pedido');
        }

      } catch (err) {
        console.error('❌ Error en PagoExitoso:', err);
        setError(err.message || 'Error crítico al procesar el pago');
      } finally {
        setProcessing(false);
      }
    };

    capturePayment();
  }, [location, navigate, capturePayPalOrder, checkoutData, clearCart, refreshProducts]);

  // VISTA: PROCESANDO
  if (processing) {
    return (
      <div className="content-view fade-in">
        <div className="container text-center py-5">
          <div className="spinner-border text-info" style={{ width: '3rem', height: '3rem' }} role="status"></div>
          <h3 className="text-white mt-4 bungee-font">CONFIRMANDO TU PEDIDO...</h3>
          <p className="text-white-50">Estamos validando tu pago y actualizando nuestro inventario.</p>
        </div>
      </div>
    );
  }

  // VISTA: ERROR
  if (error) {
    return (
      <div className="content-view fade-in">
        <div className="container text-center py-5">
          <i className="bi bi-exclamation-octagon text-danger" style={{ fontSize: '4rem' }}></i>
          <h3 className="text-white mt-3 bungee-font">HUBO UN PROBLEMA</h3>
          <p className="text-danger border border-danger p-3 rounded bg-dark">{error}</p>
          <Link to="/cart" className="btn btn-neon-pink mt-3">VOLVER AL CARRITO</Link>
        </div>
      </div>
    );
  }

  // VISTA: ÉXITO
  return (
    <div className="content-view fade-in">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-7">
            <div className="cart-container p-5 text-center shadow-lg border-neon-green">
              <div className="mb-4">
                <i className="bi bi-check-all text-success" style={{ fontSize: '5rem' }}></i>
              </div>
              
              <h1 className="text-white bungee-font mb-3">¡COMPRA COMPLETADA!</h1>
              <p className="text-white-50 mb-5">Gracias por elegir The Vault. Tu música está en camino.</p>

              <div className="alert alert-dark border-secondary text-start mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-white-50">Orden ID:</span>
                  <span className="text-white">#{result?.orden_id}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-white-50">Tracking:</span>
                  <span className="text-neon-blue">{result?.tracking_number}</span>
                </div>
                <hr className="border-secondary" />
                <div className="d-flex justify-content-between">
                  <span className="text-white-50">Total pagado:</span>
                  <span className="text-success fw-bold">${result?.total?.toFixed(2) || checkoutData?.total?.toFixed(2)} MXN</span>
                </div>
              </div>

              <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
                <Link to="/" className="btn btn-neon-blue px-4 py-2">
                  <i className="bi bi-house-door me-2"></i>INICIO
                </Link>
                <Link to="/boveda" className="btn btn-outline-light px-4 py-2">
                  SEGUIR EXPLORANDO
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagoExitoso;