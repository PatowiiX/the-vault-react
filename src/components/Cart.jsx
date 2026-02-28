// src/components/Cart.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Cart = () => {
  const { 
    cart, 
    isLoggedIn, 
    currentUser,
    removeFromCart, 
    updateCartQuantity, 
    clearCart,
    calculateCartTotal,
    calculateCartTax,
    calculateCartShipping,
    calculateCartGrandTotal,
    processPayment,
    createPayPalOrder
  } = useApp();
  
  const navigate = useNavigate();
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [paymentData, setPaymentData] = useState({
    method: 'card',
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [shippingData, setShippingData] = useState({
    address: '',
    city: '',
    zipCode: '',
    country: 'México'
  });
  const [processing, setProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [stockErrors, setStockErrors] = useState([]);

  // Verificar stock antes de checkout
  useEffect(() => {
    if (cart.length > 0) {
      const errors = [];
      cart.forEach(item => {
        if (item.quantity > (item.stock || 0)) {
          errors.push(`"${item.title}" solo tiene ${item.stock} unidades disponibles`);
        }
        if (item.stock === 0) {
          errors.push(`"${item.title}" está AGOTADO y debe ser eliminado`);
        }
      });
      setStockErrors(errors);
    }
  }, [cart]);

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      alert('⚠️ Debes iniciar sesión para proceder al pago');
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    
    // Verificar si hay productos agotados
    const hasOutOfStock = cart.some(item => item.stock === 0);
    if (hasOutOfStock) {
      alert('❌ Hay productos agotados en tu carrito. Elimínalos para continuar.');
      return;
    }
    
    if (stockErrors.length > 0) {
      alert('❌ Hay problemas de stock. Revisa tu carrito.');
      return;
    }
    
    setCheckoutStep('shipping');
  };

  const handleShippingSubmit = () => {
    if (!shippingData.address || !shippingData.city || !shippingData.zipCode) {
      alert('Completa todos los datos de envío');
      return;
    }
    setCheckoutStep('payment');
  };

  const handlePaymentSubmit = async () => {
    if (paymentData.method === 'paypal') {
      setProcessing(true);
      try {
        const paypalOrder = await createPayPalOrder({
          shippingAddress: shippingData,
          cart: cart,
          usuario_id: currentUser?.id
        });
        
        const approvalLink = paypalOrder.links.find(link => link.rel === 'approve').href;
        window.location.href = approvalLink;
      } catch (error) {
        alert('Error al conectar con PayPal: ' + error.message);
        setProcessing(false);
      }
      return;
    }

    if (!paymentData.cardNumber || !paymentData.expiry || !paymentData.cvv) {
      alert('Completa todos los datos de pago');
      return;
    }
    
    const cardNumberClean = paymentData.cardNumber.replace(/\s/g, '');
    if (cardNumberClean.length < 15 || cardNumberClean.length > 16) {
      alert('Número de tarjeta inválido');
      return;
    }

    if (paymentData.cvv.length < 3 || paymentData.cvv.length > 4) {
      alert('CVV inválido');
      return;
    }

    setProcessing(true);
    
    try {
      const result = await processPayment({
        method: 'Tarjeta de crédito',
        last4: cardNumberClean.slice(-4),
        shippingAddress: shippingData,
        cart: cart,
        total: calculateCartGrandTotal(),
        subtotal: calculateCartTotal(),
        tax: calculateCartTax(),
        shipping: calculateCartShipping(),
        usuario_id: currentUser?.id
      });
      
      if (result.success) {
        setOrderResult(result);
        setCheckoutStep('confirmation');
        clearCart();
      } else {
        alert('Error en el pago: ' + result.message);
      }
    } catch (error) {
      alert('Error procesando el pago: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(item.id);
    } else if (item.stock === 0) {
      alert(`"${item.title}" está AGOTADO. Elimínalo del carrito.`);
    } else if (newQuantity > (item.stock || Infinity)) {
      alert(`Solo hay ${item.stock} unidades disponibles de "${item.title}"`);
    } else {
      updateCartQuantity(item.id, newQuantity);
    }
  };

  // Vista de confirmación de pago exitoso
  if (checkoutStep === 'confirmation' && orderResult) {
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
                    Tu orden ha sido procesada correctamente
                  </p>
                  
                  <div className="alert alert-success mb-4">
                    <h4 className="alert-heading">
                      <i className="bi bi-receipt me-2"></i>
                      Orden #{orderResult.orderId || orderResult.orden_id}
                    </h4>
                    <p className="mb-0">
                      Número de seguimiento: <strong>{orderResult.trackingNumber || orderResult.tracking_number}</strong>
                    </p>
                    <hr />
                    <p className="mb-0">
                      Total pagado: <strong>$${(orderResult.total || orderResult.total).toFixed(2)}</strong>
                    </p>
                  </div>
                  
                  <div className="row text-start mb-4">
                    <div className="col-md-6">
                      <h5 className="text-white mb-3">
                        <i className="bi bi-truck me-2"></i>
                        Envío a:
                      </h5>
                      <div className="bg-dark p-3 rounded">
                        <p className="text-white mb-1">
                          <strong>{shippingData.address}</strong>
                        </p>
                        <p className="text-white mb-1">
                          {shippingData.city}, {shippingData.zipCode}
                        </p>
                        <p className="text-white">{shippingData.country}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h5 className="text-white mb-3">
                        <i className="bi bi-clock-history me-2"></i>
                        Estimado de entrega:
                      </h5>
                      <div className="bg-dark p-3 rounded">
                        <p className="text-white">
                          <strong>3-5 días hábiles</strong>
                        </p>
                        <p className="text-white-50 small">
                          Recibirás un correo con actualizaciones
                        </p>
                      </div>
                    </div>
                  </div>
                  
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
                      to={`/orden/${orderResult.orderId || orderResult.orden_id}`}
                      className="btn btn-outline-light"
                    >
                      <i className="bi bi-receipt me-2"></i>
                      VER DETALLES
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de pago
  if (checkoutStep === 'payment') {
    return (
      <div className="content-view fade-in">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="cart-container p-4">
                <div className="d-flex align-items-center mb-4">
                  <button 
                    className="btn btn-link text-white me-3"
                    onClick={() => setCheckoutStep('shipping')}
                  >
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <h2 className="text-white bungee-font mb-0">
                    <i className="bi bi-credit-card me-3"></i>
                    INFORMACIÓN DE PAGO
                  </h2>
                </div>
                
                <div className="row mb-4">
                  <div className="col-md-8">
                    <div className="mb-4">
                      <div className="btn-group w-100" role="group">
                        <button
                          type="button"
                          className={`btn ${paymentData.method === 'card' ? 'btn-pink' : 'btn-outline-pink'}`}
                          onClick={() => setPaymentData({...paymentData, method: 'card'})}
                        >
                          <i className="bi bi-credit-card me-2"></i>
                          Tarjeta
                        </button>
                        <button
                          type="button"
                          className={`btn ${paymentData.method === 'paypal' ? 'btn-pink' : 'btn-outline-pink'}`}
                          onClick={() => setPaymentData({...paymentData, method: 'paypal'})}
                        >
                          <i className="bi bi-paypal me-2"></i>
                          PayPal
                        </button>
                      </div>
                    </div>

                    {paymentData.method === 'card' ? (
                      <div className="card bg-dark text-white border-secondary mb-4">
                        <div className="card-header">
                          <h5 className="mb-0">Detalles de la tarjeta</h5>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label text-white">Número de tarjeta</label>
                            <input 
                              type="text" 
                              className="form-control bg-darker text-white"
                              placeholder="1234 5678 9012 3456"
                              value={paymentData.cardNumber}
                              onChange={(e) => setPaymentData({
                                ...paymentData,
                                cardNumber: formatCardNumber(e.target.value)
                              })}
                              maxLength="19"
                              disabled={processing}
                            />
                          </div>
                          
                          <div className="row">
                            <div className="col-md-6">
                              <label className="form-label text-white">Fecha de expiración</label>
                              <input 
                                type="text" 
                                className="form-control bg-darker text-white"
                                placeholder="MM/AA"
                                value={paymentData.expiry}
                                onChange={(e) => setPaymentData({
                                  ...paymentData,
                                  expiry: e.target.value
                                })}
                                maxLength="5"
                                disabled={processing}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label text-white">CVV</label>
                              <input 
                                type="text" 
                                className="form-control bg-darker text-white"
                                placeholder="123"
                                value={paymentData.cvv}
                                onChange={(e) => setPaymentData({
                                  ...paymentData,
                                  cvv: e.target.value.replace(/\D/g, '')
                                })}
                                maxLength="4"
                                disabled={processing}
                              />
                            </div>
                          </div>
                          
                          <div className="mb-3 mt-3">
                            <label className="form-label text-white">Nombre en la tarjeta</label>
                            <input 
                              type="text" 
                              className="form-control bg-darker text-white"
                              placeholder={currentUser?.nombre || 'Nombre completo'}
                              value={paymentData.name}
                              onChange={(e) => setPaymentData({
                                ...paymentData,
                                name: e.target.value
                              })}
                              disabled={processing}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="card bg-dark text-white border-secondary mb-4">
                        <div className="card-header">
                          <h5 className="mb-0">Pago con PayPal</h5>
                        </div>
                        <div className="card-body text-center py-4">
                          <i className="bi bi-paypal" style={{ fontSize: '4rem', color: '#003087' }}></i>
                          <h5 className="mt-3">Serás redirigido a PayPal</h5>
                          <p className="text-white-50">
                            Al hacer clic en "PAGAR CON PAYPAL" serás redirigido al sitio seguro de PayPal para completar tu pago.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="card bg-dark text-white border-secondary">
                      <div className="card-header">
                        <h5 className="mb-0">
                          <i className="bi bi-shield-check me-2 text-success"></i>
                          Pago seguro
                        </h5>
                      </div>
                      <div className="card-body">
                        <p className="text-white small">
                          <i className="bi bi-lock-fill me-2"></i>
                          Tu información está encriptada y protegida.
                        </p>
                        <div className="d-flex gap-2">
                          <img src="https://img.icons8.com/color/48/000000/visa.png" alt="Visa" height="30" />
                          <img src="https://img.icons8.com/color/48/000000/mastercard.png" alt="Mastercard" height="30" />
                          <img src="https://img.icons8.com/color/48/000000/amex.png" alt="Amex" height="30" />
                          <img src="https://img.icons8.com/color/48/000000/paypal.png" alt="PayPal" height="30" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="cart-total-container p-4 sticky-top">
                      <h4 className="text-white bungee-font mb-4">
                        <i className="bi bi-receipt me-2"></i>
                        RESUMEN
                      </h4>
                      
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-white">Subtotal</span>
                          <span className="text-white">${calculateCartTotal().toFixed(2)}</span>
                        </div>
                        
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-white">Envío</span>
                          <span className="text-white">${calculateCartShipping().toFixed(2)}</span>
                        </div>
                        
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-white">IVA (16%)</span>
                          <span className="text-white">${calculateCartTax().toFixed(2)}</span>
                        </div>
                        
                        <hr className="border-secondary my-3" />
                        
                        <div className="d-flex justify-content-between">
                          <span className="text-white fw-bold fs-5">TOTAL</span>
                          <span className="text-success fw-bold fs-5">
                            ${calculateCartGrandTotal().toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        className="btn w-100 py-3 fw-bold mt-3"
                        onClick={handlePaymentSubmit}
                        disabled={processing}
                        style={{
                          background: processing 
                            ? 'linear-gradient(45deg, #666, #444)' 
                            : paymentData.method === 'paypal'
                              ? 'linear-gradient(45deg, #003087, #009cde)'
                              : 'linear-gradient(45deg, #00ff88, #00cc66)',
                          border: 'none',
                          color: 'white',
                          opacity: processing ? 0.7 : 1
                        }}
                      >
                        {processing ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            PROCESANDO...
                          </>
                        ) : (
                          <>
                            <i className={`bi ${paymentData.method === 'paypal' ? 'bi-paypal' : 'bi-lock-fill'} me-2`}></i>
                            {paymentData.method === 'paypal' ? 'PAGAR CON PAYPAL' : `PAGAR $${calculateCartGrandTotal().toFixed(2)}`}
                          </>
                        )}
                      </button>
                      
                      <p className="text-center text-white-50 small mt-3">
                        <i className="bi bi-info-circle me-1"></i>
                        {paymentData.method === 'paypal' 
                          ? 'Serás redirigido a PayPal para completar el pago'
                          : 'Esta es una simulación. No se realizará ningún cargo real.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de dirección de envío
  if (checkoutStep === 'shipping') {
    return (
      <div className="content-view fade-in">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="cart-container p-4">
                <div className="d-flex align-items-center mb-4">
                  <button 
                    className="btn btn-link text-white me-3"
                    onClick={() => setCheckoutStep('cart')}
                  >
                    <i className="bi bi-arrow-left"></i>
                  </button>
                  <h2 className="text-white bungee-font mb-0">
                    <i className="bi bi-geo-alt me-3"></i>
                    DIRECCIÓN DE ENVÍO
                  </h2>
                </div>
                
                <div className="row">
                  <div className="col-md-8">
                    <div className="card bg-dark text-white border-secondary mb-4">
                      <div className="card-body">
                        <div className="mb-3">
                          <label className="form-label text-white">Dirección</label>
                          <input 
                            type="text" 
                            className="form-control bg-darker text-white"
                            placeholder="Calle y número"
                            value={shippingData.address}
                            onChange={(e) => setShippingData({
                              ...shippingData,
                              address: e.target.value
                            })}
                          />
                        </div>
                        
                        <div className="row">
                          <div className="col-md-6">
                            <label className="form-label text-white">Ciudad</label>
                            <input 
                              type="text" 
                              className="form-control bg-darker text-white"
                              placeholder="Ciudad"
                              value={shippingData.city}
                              onChange={(e) => setShippingData({
                                ...shippingData,
                                city: e.target.value
                              })}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label text-white">Código Postal</label>
                            <input 
                              type="text" 
                              className="form-control bg-darker text-white"
                              placeholder="CP"
                              value={shippingData.zipCode}
                              onChange={(e) => setShippingData({
                                ...shippingData,
                                zipCode: e.target.value.replace(/\D/g, '')
                              })}
                            />
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label text-white">País</label>
                          <select 
                            className="form-select bg-darker text-white"
                            value={shippingData.country}
                            onChange={(e) => setShippingData({
                              ...shippingData,
                              country: e.target.value
                            })}
                          >
                            <option value="México">México</option>
                            <option value="Estados Unidos">Estados Unidos</option>
                            <option value="España">España</option>
                            <option value="Colombia">Colombia</option>
                            <option value="Argentina">Argentina</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="d-flex justify-content-between">
                      <button 
                        className="btn btn-outline-light"
                        onClick={() => setCheckoutStep('cart')}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        VOLVER AL CARRITO
                      </button>
                      
                      <button 
                        className="btn"
                        onClick={handleShippingSubmit}
                        style={{
                          background: 'linear-gradient(45deg, #ff00ff, #ff007f)',
                          border: 'none',
                          color: 'white',
                          padding: '10px 30px'
                        }}
                      >
                        CONTINUAR AL PAGO
                        <i className="bi bi-arrow-right ms-2"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="cart-total-container p-4">
                      <h5 className="text-white mb-3">Resumen del pedido</h5>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-white">Productos</span>
                        <span className="text-white">{cart.length}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-3">
                        <span className="text-white">Total</span>
                        <span className="text-success">${calculateCartGrandTotal().toFixed(2)}</span>
                      </div>
                      
                      <div className="border-top border-secondary pt-3">
                        <p className="text-white small">
                          <i className="bi bi-truck me-2"></i>
                          Envío estándar: 3-5 días
                        </p>
                        <p className="text-white small">
                          <i className="bi bi-shield-check me-2"></i>
                          Garantía de entrega
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista normal del carrito
  return (
    <div className="content-view fade-in">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="text-white bungee-font">
            <i className="bi bi-cart4 me-3 text-pink"></i>
            TU CARRITO
          </h1>
          {cart.length > 0 && (
            <button 
              className="btn btn-outline-danger btn-sm"
              onClick={() => {
                if (window.confirm('¿Estás seguro de vaciar el carrito?')) {
                  clearCart();
                }
              }}
            >
              <i className="bi bi-trash me-2"></i>
              Vaciar Carrito
            </button>
          )}
        </div>
        
        {cart.length === 0 ? (
          <div className="cart-container text-center py-5">
            <div className="py-5">
              <i className="bi bi-cart-x text-white-50" style={{ fontSize: '5rem' }}></i>
              <h3 className="text-white mt-4">Tu carrito está vacío</h3>
              <p className="text-white-50">Agrega algunos productos para comenzar</p>
              
              <Link 
                to="/"
                className="btn mt-4"
                style={{
                  background: 'linear-gradient(45deg, #ff00ff, #ff007f)',
                  border: '2px solid #ff00ff',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '12px 40px',
                  fontSize: '1.1rem',
                  boxShadow: '0 0 20px rgba(255, 0, 255, 0.4)'
                }}
              >
                <i className="bi bi-shop me-2"></i>
                EXPLORAR TIENDA
              </Link>
            </div>
          </div>
        ) : (
          <div className="row">
            {/* Mostrar errores de stock si existen */}
            {stockErrors.length > 0 && (
              <div className="col-12 mb-4">
                <div className="alert alert-danger">
                  <h5><i className="bi bi-exclamation-triangle-fill me-2"></i>Problemas de stock:</h5>
                  <ul className="mb-0">
                    {stockErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Lista de productos */}
            <div className="col-lg-8">
              <div className="cart-container">
                {cart.map(item => (
                  <div key={item.id} className="cart-item border-bottom border-secondary pb-4 mb-4">
                    <div className="row align-items-center">
                      <div className="col-md-2">
                        <div 
                          className="rounded p-2 text-center"
                          style={{ 
                            background: `url(${item.image}) center/cover`,
                            height: '80px',
                            width: '80px'
                          }}
                        />
                      </div>
                      
                      <div className="col-md-5">
                        <h5 className="text-white mb-1" style={item.stock === 0 ? { color: '#ff4444' } : {}}>
                          {item.title} {item.stock === 0 && '❌'}
                        </h5>
                        <p className="text-white-50 mb-1">{item.artist}</p>
                        <span className="badge bg-dark text-info">{item.format}</span>
                        {item.stock === 0 && (
                          <span className="badge bg-danger ms-2">AGOTADO</span>
                        )}
                        {item.stock > 0 && item.stock < 5 && (
                          <span className="badge bg-warning text-dark ms-2">
                            ¡Últimas {item.stock}!
                          </span>
                        )}
                      </div>
                      
                      <div className="col-md-3">
                        {item.stock > 0 ? (
                          <>
                            <div className="input-group input-group-sm" style={{ width: '120px' }}>
                              <button 
                                className="btn btn-outline-secondary"
                                onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <i className="bi bi-dash"></i>
                              </button>
                              
                              <input 
                                type="text" 
                                className="form-control text-center bg-dark text-white border-secondary"
                                value={item.quantity}
                                readOnly
                              />
                              
                              <button 
                                className="btn btn-outline-secondary"
                                onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                disabled={item.quantity >= (item.stock || Infinity)}
                              >
                                <i className="bi bi-plus"></i>
                              </button>
                            </div>
                            <small className="text-white-50 d-block mt-1">
                              Stock: {item.stock} disponible(s)
                            </small>
                          </>
                        ) : (
                          <div className="text-danger fw-bold">NO DISPONIBLE</div>
                        )}
                      </div>
                      
                      <div className="col-md-2 text-end">
                        <h5 className="text-success mb-0">
                          ${(item.price * item.quantity).toFixed(2)}
                        </h5>
                        <small className="text-white-50">
                          ${item.price.toFixed(2)} c/u
                        </small>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-end">
                      <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Resumen */}
            <div className="col-lg-4">
              <div className="cart-total-container p-4 sticky-top">
                <h4 className="text-white bungee-font mb-4">
                  <i className="bi bi-receipt me-2"></i>
                  RESUMEN DEL PEDIDO
                </h4>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-white">Subtotal</span>
                    <span className="text-white">
                      ${calculateCartTotal().toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-white">Envío</span>
                    <span className="text-white">
                      ${calculateCartShipping().toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-white">IVA (16%)</span>
                    <span className="text-white">
                      ${calculateCartTax().toFixed(2)}
                    </span>
                  </div>
                  
                  <hr className="border-secondary my-3" />
                  
                  <div className="d-flex justify-content-between">
                    <span className="text-white fw-bold fs-5">TOTAL</span>
                    <span className="text-success fw-bold fs-5">
                      ${calculateCartGrandTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {!isLoggedIn && (
                  <div className="alert alert-warning mb-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Inicia sesión para pagar</strong>
                    <p className="mb-0 small mt-1">
                      Necesitas una cuenta para completar tu compra.
                    </p>
                  </div>
                )}
                
                {stockErrors.length > 0 && (
                  <div className="alert alert-danger mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Corrige los problemas de stock</strong>
                    <p className="mb-0 small mt-1">
                      Ajusta las cantidades o elimina productos agotados.
                    </p>
                  </div>
                )}
                
                <div className="d-flex flex-column gap-3 mt-4">
                  <Link 
                    to="/"
                    className="btn text-center py-3 fw-bold"
                    style={{
                      background: 'linear-gradient(45deg, #ff00ff, #ff007f)',
                      border: '2px solid #ff00ff',
                      color: 'white',
                      boxShadow: '0 0 15px rgba(255, 0, 255, 0.5)',
                      textDecoration: 'none'
                    }}
                  >
                    <i className="bi bi-shop me-2"></i>
                    SEGUIR EXPLORANDO
                  </Link>
                  
                  <button 
                    className="btn text-center py-3 fw-bold"
                    onClick={handleCheckout}
                    disabled={!isLoggedIn || stockErrors.length > 0}
                    style={{
                      background: !isLoggedIn || stockErrors.length > 0
                        ? 'linear-gradient(45deg, #666, #444)'
                        : 'linear-gradient(45deg, #00ff88, #00cc66)',
                      border: '2px solid #ff00ff',
                      color: 'white',
                      opacity: !isLoggedIn || stockErrors.length > 0 ? 0.5 : 1,
                      cursor: !isLoggedIn || stockErrors.length > 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <i className={`bi ${isLoggedIn ? 'bi-lock-fill' : 'bi-lock'} me-2`}></i>
                    {!isLoggedIn 
                      ? 'INICIA SESIÓN PARA PAGAR'
                      : stockErrors.length > 0
                        ? 'PROBLEMAS DE STOCK'
                        : 'PROCEDER AL PAGO'}
                  </button>
                </div>
                
                <div className="mt-4 text-center">
                  <small className="text-white-50">
                    <i className="bi bi-shield-check me-1"></i>
                    Pago 100% seguro · Envío garantizado
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart; //CORRECCIONES ACA HECHAS 