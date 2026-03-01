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
    createPayPalOrder,
    saveCheckoutData
  } = useApp();
  
  const navigate = useNavigate();
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [shippingData, setShippingData] = useState({
    address: '',
    city: '',
    zipCode: '',
    country: 'México'
  });
  const [processing, setProcessing] = useState(false);
  const [stockErrors, setStockErrors] = useState([]);

  // Verificar stock antes de checkout
  useEffect(() => {
    if (cart.length > 0) {
      const errors = [];
      cart.forEach(item => {
        if (item.quantity > (item.stock || 0)) {
          errors.push(`"${item.title}" solo tiene ${item.stock} unidades disponibles`);
        }
        if (item.stock <= 0) {
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
    const hasOutOfStock = cart.some(item => item.stock <= 0);
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
    
    // Ir directamente a PayPal (sin opción de tarjeta)
    handlePayPalPayment();
  };

  // ============================================
  // SOLO PAYPAL - SIN TARJETA
  // ============================================
  const handlePayPalPayment = async () => {
    setProcessing(true);
    try {
      // Guardar datos del checkout antes de ir a PayPal
      saveCheckoutData({
        cart: cart,
        shippingAddress: shippingData,
        total: calculateCartGrandTotal(),
        subtotal: calculateCartTotal(),
        tax: calculateCartTax(),
        shipping: calculateCartShipping()
      });
      
      const paypalOrder = await createPayPalOrder({
        shippingAddress: shippingData,
        usuario_id: currentUser?.id
      });
      
      // Validar respuesta de PayPal
      if (!paypalOrder) {
        throw new Error('No se recibió respuesta de PayPal');
      }
      
      if (!paypalOrder.links) {
        console.error("Respuesta PayPal sin links:", paypalOrder);
        throw new Error(paypalOrder.error || 'Error al crear la orden en PayPal');
      }
      
      const approveLink = paypalOrder.links.find(link => link.rel === 'approve');
      
      if (!approveLink) {
        throw new Error('No se pudo obtener el enlace de aprobación de PayPal');
      }
      
      window.location.href = approveLink.href;
    } catch (error) {
      alert('Error al conectar con PayPal: ' + error.message);
      console.error("Error detallado:", error);
      setProcessing(false);
    }
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(item.id);
    } else if (item.stock <= 0) {
      alert(`"${item.title}" está AGOTADO. Elimínalo del carrito.`);
    } else if (newQuantity > (item.stock || Infinity)) {
      alert(`Solo hay ${item.stock} unidades disponibles de "${item.title}"`);
    } else {
      updateCartQuantity(item.id, newQuantity);
    }
  };

  // Vista de dirección de envío (único paso antes de PayPal)
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

                        {/* Información de PayPal */}
                        <div className="alert alert-info mt-3">
                          <i className="bi bi-paypal me-2"></i>
                          <strong>Pago con PayPal</strong>
                          <p className="mb-0 small mt-1">
                            Serás redirigido a PayPal para completar tu pago de forma segura.
                          </p>
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
                        disabled={processing}
                        style={{
                          background: processing 
                            ? 'linear-gradient(45deg, #666, #444)'
                            : 'linear-gradient(45deg, #003087, #009cde)',
                          border: 'none',
                          color: 'white',
                          padding: '10px 30px',
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
                            <i className="bi bi-paypal me-2"></i>
                            PAGAR CON PAYPAL (${calculateCartGrandTotal().toFixed(2)})
                          </>
                        )}
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
                          Pago seguro con PayPal
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
                        <h5 className="text-white mb-1" style={item.stock <= 0 ? { color: '#ff4444' } : {}}>
                          {item.title} {item.stock <= 0 && '❌'}
                        </h5>
                        <p className="text-white-50 mb-1">{item.artist}</p>
                        <span className="badge bg-dark text-info">{item.format}</span>
                        {item.stock <= 0 && (
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
                        : 'linear-gradient(45deg, #003087, #009cde)',
                      border: '2px solid #003087',
                      color: 'white',
                      opacity: !isLoggedIn || stockErrors.length > 0 ? 0.5 : 1,
                      cursor: !isLoggedIn || stockErrors.length > 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <i className="bi bi-paypal me-2"></i>
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
                    Pago 100% seguro con PayPal
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

export default Cart;