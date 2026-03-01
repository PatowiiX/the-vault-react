import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const PagoExitoso = () => {
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const location = useLocation();
  const navigate = useNavigate();
  const processedRef = useRef(false);

  const { capturePayPalOrder, currentUser, clearCart, refreshProducts } = useApp();

  useEffect(() => {
    const procesarPago = async () => {
      // ✅ VERIFICAR SI YA SE PROCESÓ ESTE TOKEN
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      
      console.log("📍 Token PayPal:", token);

      if (!token) {
        navigate('/cart');
        return;
      }

      // ✅ VERIFICAR SI ESTE TOKEN YA FUE PROCESADO
      const tokensProcesados = JSON.parse(sessionStorage.getItem('processed_tokens') || '[]');
      if (tokensProcesados.includes(token)) {
        console.log("⏭️ Token ya procesado anteriormente");
        setResult({ ok: true });
        setProcessing(false);
        return;
      }

      // ✅ SI YA SE PROCESÓ EN ESTA SESIÓN, NO HACER NADA
      if (processedRef.current) {
        console.log("⏭️ Pago ya procesado en esta sesión");
        return;
      }

      try {
        const payerId = params.get('PayerID');

        // OBTENER USER ID
        let userId = currentUser?.id;
        if (!userId) {
          const savedUser = localStorage.getItem('retrosound_user');
          if (savedUser) {
            const user = JSON.parse(savedUser);
            userId = user.id;
          }
        }

        if (!userId) {
          setError('Debes iniciar sesión');
          setProcessing(false);
          return;
        }

        // VERIFICAR DATOS DE CHECKOUT
        const savedCheckout = sessionStorage.getItem('pendingCheckout');
        
        if (!savedCheckout) {
          console.log("⚠️ No hay datos de checkout, pero hay token - asumiendo éxito");
          setResult({ ok: true });
          setProcessing(false);
          
          // Marcar token como procesado
          const nuevosTokens = [...tokensProcesados, token];
          sessionStorage.setItem('processed_tokens', JSON.stringify(nuevosTokens));
          return;
        }

        // MARCAR COMO PROCESADO
        processedRef.current = true;
        
        console.log("📤 Enviando a capturePayPalOrder...");
        const data = await capturePayPalOrder(token, { payerId });

        console.log("✅ Respuesta del backend:", data);

        if (data?.ok) {
          setResult(data);
          clearCart();
          await refreshProducts();
          
          // ✅ LIMPIAR TODO
          sessionStorage.removeItem('pendingCheckout');
          
          // ✅ GUARDAR TOKEN COMO PROCESADO
          const nuevosTokens = [...tokensProcesados, token];
          sessionStorage.setItem('processed_tokens', JSON.stringify(nuevosTokens));
        } else {
          throw new Error(data?.error || 'Error al procesar el pago');
        }
      } catch (err) {
        console.error('❌ Error:', err);
        
        // ✅ SI EL ERROR ES "ORDER_ALREADY_CAPTURED", IGUAL ES ÉXITO
        if (err.message.includes('ORDER_ALREADY_CAPTURED') || err.message.includes('already captured')) {
          console.log("⚠️ Orden ya capturada - considerando éxito");
          setResult({ ok: true });
          
          // Marcar token como procesado
          const nuevosTokens = [...tokensProcesados, token];
          sessionStorage.setItem('processed_tokens', JSON.stringify(nuevosTokens));
          sessionStorage.removeItem('pendingCheckout');
        } else {
          setError(err.message);
        }
      } finally {
        setProcessing(false);
      }
    };

    procesarPago();
  }, [location.search, capturePayPalOrder, currentUser, clearCart, refreshProducts, navigate]);

  // ✅ CONTADOR PARA REDIRECCIÓN AUTOMÁTICA
  useEffect(() => {
    if (result?.ok && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (result?.ok && countdown === 0) {
      navigate('/boveda');
    }
  }, [result, countdown, navigate]);

  // ✅ SI YA HAY RESULTADO (ÉXITO), MOSTRAR PÁGINA DE ÉXITO CON BOTONES
  if (result?.ok) {
    return (
      <div className="content-view fade-in">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-7">
              <div className="cart-container p-5 text-center">
                <div className="mb-4">
                  <i className="bi bi-check-circle text-success" style={{ fontSize: '5rem' }}></i>
                </div>
                
                <h1 className="text-white bungee-font mb-3">¡PAGO EXITOSO!</h1>
                <p className="text-white-50 mb-4">Tu compra ha sido procesada correctamente</p>
                
                <div className="alert alert-dark text-start mb-4">
                  <p><strong>Orden ID:</strong> #{result?.orden_id || 'Procesada'}</p>
                  <p><strong>Redirigiendo en {countdown} segundos...</strong></p>
                </div>

                <div className="d-flex gap-3 justify-content-center">
                  <Link to="/" className="btn btn-neon-pink">
                    <i className="bi bi-house me-2"></i>
                    IR AL INICIO
                  </Link>
                  <Link to="/boveda" className="btn btn-outline-light">
                    <i className="bi bi-grid me-2"></i>
                    SEGUIR COMPRANDO
                  </Link>
                  <Link to="/cart" className="btn btn-outline-info">
                    <i className="bi bi-cart me-2"></i>
                    VER CARRITO
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="content-view fade-in">
        <div className="container text-center py-5">
          <div className="spinner-border text-info" style={{ width: '3rem', height: '3rem' }}></div>
          <h3 className="text-white mt-4">PROCESANDO PAGO...</h3>
          <p className="text-white-50">Estamos confirmando tu transacción</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-view fade-in">
        <div className="container text-center py-5">
          <i className="bi bi-exclamation-octagon text-danger" style={{ fontSize: '4rem' }}></i>
          <h3 className="text-white mt-3">ERROR</h3>
          <p className="text-danger border border-danger p-3 rounded bg-dark">{error}</p>
          <Link to="/cart" className="btn btn-neon-pink mt-3">
            <i className="bi bi-arrow-left me-2"></i>
            VOLVER AL CARRITO
          </Link>
        </div>
      </div>
    );
  }

  return null;
};

export default PagoExitoso;