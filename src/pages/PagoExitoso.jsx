import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const PagoExitoso = () => {
  const [status, setStatus] = useState('processing');
  const [orderId, setOrderId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const location = useLocation();
  const navigate = useNavigate();
  const processedRef = useRef(false);

  const { capturePayPalOrder, clearCart, refreshProducts } = useApp();

  useEffect(() => {
    const procesarPago = async () => {
      if (processedRef.current) return;

      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      
      console.log("📍 Token PayPal:", token);

      if (!token) {
        navigate('/cart');
        return;
      }

      // ✅ VERIFICAR TOKEN YA PROCESADO
      const tokensProcesados = JSON.parse(sessionStorage.getItem('processed_tokens') || '[]');
      if (tokensProcesados.includes(token)) {
        console.log("⏭️ Token ya procesado");
        setStatus('success');
        processedRef.current = true;
        return;
      }

      processedRef.current = true;

      // ✅ OBTENER USERID DIRECTAMENTE DE LOCALSTORAGE
      let userId = null;
      const savedUser = localStorage.getItem('retrosound_user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          userId = user.id;
          console.log("📍 Usuario ID:", userId);
        } catch (e) {
          console.error("Error:", e);
        }
      }

      if (!userId) {
        console.error("❌ No userId");
        setStatus('error');
        setErrorMsg('No se encontró información de usuario. Por favor, inicia sesión nuevamente.');
        return;
      }

      try {
        const payerId = params.get('PayerID');
        
        console.log("📤 Procesando pago...");
        const data = await capturePayPalOrder(token, { 
          payerId, 
          userId,
          usuario_id: userId 
        });

        console.log("✅ Respuesta:", data);

        if (data?.ok) {
          setOrderId(data.orden_id);
          clearCart();
          await refreshProducts();
          sessionStorage.removeItem('pendingCheckout');
          
          const nuevosTokens = [...tokensProcesados, token];
          sessionStorage.setItem('processed_tokens', JSON.stringify(nuevosTokens));
          
          setStatus('success');
        } else {
          throw new Error(data?.error || 'Error al procesar el pago');
        }
      } catch (err) {
        console.error('❌ Error:', err);
        
        if (err.message?.includes('ORDER_ALREADY_CAPTURED') || err.message?.includes('already captured')) {
          setStatus('success');
          const nuevosTokens = [...tokensProcesados, token];
          sessionStorage.setItem('processed_tokens', JSON.stringify(nuevosTokens));
          sessionStorage.removeItem('pendingCheckout');
        } else {
          setStatus('error');
          setErrorMsg(err.message);
        }
      }
    };

    procesarPago();
  }, [location.search, capturePayPalOrder, clearCart, refreshProducts, navigate]);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      navigate('/boveda');
    }
  }, [status, countdown, navigate]);

  if (status === 'processing') {
    return (
      <div className="content-view fade-in">
        <div className="container text-center py-5">
          <div className="spinner-border text-info" style={{ width: '4rem', height: '4rem' }}></div>
          <h3 className="text-white mt-4">PROCESANDO PAGO...</h3>
          <p className="text-white-50">Estamos confirmando tu transacción.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="content-view fade-in">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-7">
              <div className="cart-container p-5 text-center">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '5rem' }}></i>
                <h1 className="text-white bungee-font mb-3">¡PAGO EXITOSO!</h1>
                <p className="text-white-50 mb-4">Tu compra ha sido procesada correctamente.</p>
                <div className="alert alert-dark text-start mb-4">
                  <p><strong>Orden ID:</strong> #{orderId || 'Procesada'}</p>
                  <p><strong>Redirigiendo en {countdown} segundos...</strong></p>
                </div>
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <Link to="/" className="btn btn-neon-pink">IR AL INICIO</Link>
                  <Link to="/boveda" className="btn btn-outline-light">SEGUIR COMPRANDO</Link>
                  <Link to="/mi-cuenta?tab=orders" className="btn btn-outline-info">VER MIS PEDIDOS</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-view fade-in">
      <div className="container text-center py-5">
        <i className="bi bi-exclamation-octagon-fill text-danger" style={{ fontSize: '4rem' }}></i>
        <h3 className="text-white mt-3">ERROR EN EL PAGO</h3>
        <p className="text-danger border border-danger p-3 rounded bg-dark mt-3">{errorMsg || 'Ocurrió un error.'}</p>
        <div className="d-flex gap-3 justify-content-center mt-4">
          <Link to="/cart" className="btn btn-neon-pink">VOLVER AL CARRITO</Link>
          <Link to="/contacto" className="btn btn-outline-light">CONTACTAR SOPORTE</Link>
        </div>
      </div>
    </div>
  );
};

export default PagoExitoso;
