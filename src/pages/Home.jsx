// src/pages/Home.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SearchBar from '../components/SearchBar';

function Home() {
  const { adminProducts, addToCart, isLoggedIn, cart, calculateCartCount } = useApp();
  const navigate = useNavigate();
  
  const [displayProducts, setDisplayProducts] = useState([]);
  const [lastAddedProduct, setLastAddedProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    mensaje: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  const topProducts = useMemo(() => {
    return adminProducts.slice(0, 5);
  }, [adminProducts]);

  useEffect(() => {
    setDisplayProducts(topProducts);
  }, [topProducts]);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoggedIn) {
      alert('DEBES INICIAR SESIÓN\n\nPara agregar productos al carrito, primero inicia sesión.');
      return;
    }
    
    if (product.stock === 0) {
      alert(`AGOTADO\n\n"${product.title}" no está disponible.`);
      return;
    }
    
    const result = addToCart(product, 1);
    
    if (result.success) {
      setLastAddedProduct(product.id);
      setTimeout(() => setLastAddedProduct(null), 1000);
      
      const cartCount = calculateCartCount();
      alert(`AGREGADO AL CARRITO!\n\n"${product.title}"\n${product.artist}\n$${product.price.toFixed(2)}\n\nAhora tienes ${cartCount} productos en el carrito`);
    } else {
      alert(`ERROR\n\n${result.message || 'No se pudo agregar al carrito'}`);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const getButtonClass = (product) => {
    if (product.stock === 0) return 'btn-adaptivo btn-sin-stock';
    if (!isLoggedIn) return 'btn-adaptivo btn-sin-sesion';
    return 'btn-adaptivo btn-con-sesion';
  };

  const handleContactChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (sendStatus) setSendStatus(null);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setSendStatus(null);

    try {
      const response = await fetch('http://localhost:3001/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setSendStatus('success');
        setFormData({ nombre: '', email: '', mensaje: '' });
        setTimeout(() => setSendStatus(null), 5000);
      } else {
        setSendStatus('error');
      }
    } catch (error) {
      console.error('Error:', error);
      setSendStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div id="main-store" className="content-view fade-in">
      <header className="hero-section text-center">
        <h1 className="logo-text-main">THE VAULT</h1>
        <p className="hero-subtitle">A Retrosound Store</p>
      </header>

      <div className="container">
        {/* BARRA DE BÚSQUEDA */}
        <div className="row justify-content-center mb-5">
          <div className="col-lg-6 col-md-8">
            <SearchBar />
          </div>
        </div>

        <div className="main-dashboard">
          {/* TOP 5 */}
          <div className="top-five-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="dashboard-title">
                <i className="bi bi-fire me-2"></i>
                TOP 5 VAULT SELECTIONS
              </h6>
              <div className="text-light" style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                {isLoggedIn ? `${calculateCartCount()} en carrito` : 'Destacados de la semana'}
              </div>
            </div>
            
            <div className="row row-cols-2 row-cols-lg-5 g-3" id="top-discos-container">
              {displayProducts.map((product, index) => (
                <div key={product.id} className="col">
                  <Link to={`/album/${product.id}`} className="text-decoration-none">
                    <div className={`format-item-card clickable-card ${lastAddedProduct === product.id ? 'item-added' : ''} ${product.stock === 0 ? 'out-of-stock' : ''}`}
                         style={{ minHeight: '320px' }}>
                      
                      <div 
                        className="format-item-image" 
                        style={{
                          background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${product.image}) center/cover no-repeat`,
                          height: '150px',
                          position: 'relative',
                          borderRadius: '8px 8px 0 0'
                        }}
                      >
                        {index === 0 && (
                          <span className="format-featured-badge" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                            TOP PICK
                          </span>
                        )}
                        
                        <span className={`badge position-absolute bottom-0 start-0 m-2 ${
                          product.format === 'Vinyl' ? 'bg-pink' : 
                          product.format === 'CD' ? 'bg-blue' : 'bg-gold'
                        }`} style={{ fontSize: '0.65rem' }}>
                          {product.format}
                        </span>
                        
                        <span className="badge bg-dark position-absolute bottom-0 end-0 m-2" style={{ fontSize: '0.65rem' }}>
                          {product.year}
                        </span>
                        
                        {product.stock === 0 && (
                          <span className="badge bg-danger position-absolute top-0 end-0 m-2" style={{ fontSize: '0.7rem' }}>
                            AGOTADO
                          </span>
                        )}
                      </div>
                      
                      <div className="format-item-info p-2">
                        <h6 className="format-item-title mb-1" style={{ 
                          fontSize: '0.85rem',
                          lineHeight: '1.2',
                          height: '2.4rem',
                          overflow: 'hidden',
                          color: '#fff'
                        }}>
                          {product.title.length > 30 ? `${product.title.substring(0, 30)}...` : product.title}
                        </h6>
                        
                        <p className="format-item-artist mb-2" style={{ 
                          color: '#e0e0e0',
                          fontSize: '0.75rem',
                          fontWeight: '300'
                        }}>
                          {product.artist}
                        </p>
                        
                        <div className="mb-2">
                          <span className="badge bg-dark" style={{ fontSize: '0.65rem' }}>
                            {product.genre?.split('/')[0]?.trim() || product.genre}
                          </span>
                          {product.heritage && (
                            <span className="badge bg-gold ms-1" style={{ fontSize: '0.65rem' }}>
                              <i className="bi bi-award me-1"></i>Heritage
                            </span>
                          )}
                        </div>
                        
                        <div className="format-item-footer mt-2">
                          <div>
                            <span className="format-item-price d-block" style={{ fontSize: '0.9rem' }}>
                              ${product.price.toFixed(2)}
                            </span>
                            <small className="text-white" style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                              {product.stock === 0 ? (
                                <span style={{ color: '#ff4444', fontWeight: 'bold' }}>❌ NO DISPONIBLE</span>
                              ) : product.stock < 5 ? (
                                <span style={{ color: '#ffaa00' }}>⚠️ Últimas {product.stock}</span>
                              ) : (
                                <span>✅ Disponible</span>
                              )}
                            </small>
                          </div>
                          
                          <button 
                            className={getButtonClass(product)}
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={product.stock === 0}
                            style={product.stock === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                          >
                            {product.stock === 0 ? (
                              <i className="bi bi-x-circle" style={{ fontSize: '0.8rem', color: '#ff4444' }}></i>
                            ) : !isLoggedIn ? (
                              <i className="bi bi-lock" style={{ fontSize: '0.8rem' }}></i>
                            ) : (
                              <i className="bi bi-cart-plus" style={{ fontSize: '0.8rem' }}></i>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* BOTONES DE NAVEGACIÓN */}
          <div className="nav-side-panel">
            <button 
              className="nav-btn btn-h"
              onClick={() => handleNavigation('/heritage')}
            >
              <i className="bi bi-shield-lock"></i>
              <span>HERITAGE</span>
              <small className="text-white mt-1" style={{ opacity: 0.9, fontWeight: 300 }}>
                Ediciones limitadas
              </small>
            </button>
            
            <button 
              className="nav-btn btn-f"
              onClick={() => handleNavigation('/formatos')}
            >
              <i className="bi bi-disc"></i>
              <span>FORMATOS</span>
              <small className="text-white mt-1" style={{ opacity: 0.9, fontWeight: 300 }}>
                Todos los formatos
              </small>
            </button>
            
            <button 
              className="nav-btn btn-c"
              onClick={() => handleNavigation('/boveda')}
            >
              <i className="bi bi-collection-play"></i>
              <span>BÓVEDA</span>
              <small className="text-white mt-1" style={{ opacity: 0.9, fontWeight: 300 }}>
                Catálogo completo
              </small>
            </button>
          </div>
        </div>

        {/* MISIÓN, VISIÓN, VALORES */}
        <div className="row g-4 my-5 text-center">
          <div className="col-md-4">
            <div className="info-card-white">
              <i className="bi bi-bullseye text-danger fs-1"></i>
              <h4>NUESTRA MISIÓN</h4>
              <p>Preservar la cultura musical física para el coleccionista moderno.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="info-card-white card-border-blue">
              <i className="bi bi-eye text-primary fs-1"></i>
              <h4>NUESTRA VISIÓN</h4>
              <p>Ser la plataforma líder global en formatos físicos.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="info-card-white">
              <i className="bi bi-gem text-warning fs-1"></i>
              <h4>VALORES</h4>
              <p>Autenticidad y pasión inquebrantable por el sonido.</p>
            </div>
          </div>
        </div>

        {/* SECCIÓN DE CONTACTO */}
        <div className="contact-section mb-5 p-4">
          <div className="row align-items-center">
            <div className="col-md-5">
              <h2 className="text-pink bungee-font">CONTACTO</h2>
              <p className="text-white">
                <i className="bi bi-geo-alt-fill text-info me-2"></i> 
                Av. Generica #123, GDL
              </p>
              <p className="text-white">
                <i className="bi bi-envelope-at-fill text-info me-2"></i> 
                hello@retrosound.com
              </p>
            </div>
            <div className="col-md-7">
              <form 
                className="bg-glass-form p-3" 
                onSubmit={handleContactSubmit}
              >
                <input 
                  type="text" 
                  name="nombre"
                  className="form-control-custom mb-2 text-white" 
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={handleContactChange}
                  required
                  disabled={isSending}
                />
                <input 
                  type="email" 
                  name="email"
                  className="form-control-custom mb-2 text-white" 
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleContactChange}
                  required
                  disabled={isSending}
                />
                <textarea 
                  name="mensaje"
                  className="form-control-custom mb-2 text-white" 
                  placeholder="Mensaje"
                  value={formData.mensaje}
                  onChange={handleContactChange}
                  required
                  rows="4"
                  disabled={isSending}
                  style={{ resize: 'none' }}
                ></textarea>
                
                {sendStatus === 'success' && (
                  <div className="alert alert-success mb-2 py-2" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Mensaje enviado! Te contactaremos pronto.
                  </div>
                )}
                {sendStatus === 'error' && (
                  <div className="alert alert-danger mb-2 py-2" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Error al enviar. Intenta de nuevo.
                  </div>
                )}
                
                <button 
                  type="submit"
                  className="btn btn-neon-solid w-100"
                  disabled={isSending}
                  style={{
                    background: isSending 
                      ? 'linear-gradient(45deg, #666, #999)' 
                      : 'linear-gradient(45deg, #ff00ff, #ff007f)',
                    border: '2px solid #ff00ff',
                    color: 'white',
                    fontWeight: 'bold',
                    opacity: isSending ? 0.7 : 1
                  }}
                >
                  {isSending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      ENVIANDO...
                    </>
                  ) : (
                    'ENVIAR'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;