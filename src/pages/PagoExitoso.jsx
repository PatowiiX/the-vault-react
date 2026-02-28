import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const PagoExitoso = () => {
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { capturePayPalOrder, cart } = useApp();

  useEffect(() => {
    const capturePayment = async () => {
      try {
        // Obtener token de la URL
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const payerId = params.get('PayerID');

        if (!token) {
          navigate('/carrito');
          return;
        }

        // Capturar el pago
        const result = await capturePayPalOrder(token, { payerId });
        setResult(result);
        setProcessing(false);
      } catch (error) {
        console.error('Error capturando pago:', error);
        setProcessing(false);
      }
    };

    capturePayment();
  }, [location, navigate, capturePayPalOrder]);

  if (processing) {
    return (
      <div className="content-view fade-in">
        <div className="container text-center py-5">
          <div className="spinner-border text-pink" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Procesando pago...</span>
          </div>
          <h3 className="text-white mt-3">Procesando tu pago...</h3>
          <p className="text-light">Por favor espera, estamos confirmando tu transacción.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-view fade-in">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="cart-container text-center py-5">
              <div className="py-5">
                <div className="mb-4">
                  <div className="checkmark-circle">
                    <div className="background"></div>
                    <div className="checkmark draw"></div>
                  </div>
                </div>
                
                <h1 className="text-white bungee-font mb-3">¡PAGO EXITOSO!</h1>
                <p className="text-white fs-5 mb-4">
                  Tu pago con PayPal ha sido procesado correctamente
                </p>
                
                <div className="d-flex justify-content-center gap-3">
                  <Link 
                    to="/"
                    className="btn"
                    style={{
                      background: 'linear-gradient(45deg, #ff00ff, #ff007f)',
                      border: '2px solid #ff00ff',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '12px 30px'
                    }}
                  >
                    <i className="bi bi-house me-2"></i>
                    VOLVER AL INICIO
                  </Link>
                  
                  <Link 
                    to="/boveda"
                    className="btn btn-outline-light"
                  >
                    <i className="bi bi-collection-play me-2"></i>
                    SEGUIR COMPRANDO
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagoExitoso;