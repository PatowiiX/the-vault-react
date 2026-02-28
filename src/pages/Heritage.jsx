// src/pages/Heritage.jsx - VERSIÓN FINAL
import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Heritage = () => {
  const { adminProducts, addToCart, isLoggedIn } = useApp();
  
  const heritageProducts = adminProducts.filter(product => product.heritage);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoggedIn) {
      alert('⚠️ Debes iniciar sesión para agregar al carrito');
      return;
    }
    
    if (product.stock === 0) {
      alert(`😔 "${product.title}" está agotado`);
      return;
    }
    
    const result = addToCart(product);
    if (result.success) {
      alert(`✅ ${product.title} agregado al carrito`);
    }
  };

  // Determinar clase del botón
  const getButtonClass = (product) => {
    if (product.stock === 0) return 'btn-adaptivo btn-sin-stock';
    if (!isLoggedIn) return 'btn-adaptivo btn-sin-sesion';
    return 'btn-adaptivo btn-con-sesion';
  };

  return (
    <div className="content-view fade-in">
      <div className="container">
        <div className="text-center mb-5">
          <div className="heritage-badge-large mb-4">
            <i className="bi bi-gem text-gold" style={{ fontSize: '4rem' }}></i>
          </div>
          <h1 className="text-white bungee-font display-4 mb-3">
            <i className="bi bi-shield-lock me-3 text-gold"></i>
            HERITAGE COLLECTION
          </h1>
          <p className="text-light fs-5">
            Ediciones limitadas con certificado de autenticidad
          </p>
        </div>

        <div className="row mb-5">
          <div className="col-lg-8 mx-auto">
            <div className="card bg-dark text-white border-gold p-4">
              <div className="card-body text-center">
                <h4 className="text-gold bungee-font mb-3">
                  <i className="bi bi-award me-2"></i>
                  COLECCIÓN DE LEGADO CERTIFICADO
                </h4>
                <p className="mb-3 text-light">
                  Cada edición Heritage incluye:
                </p>
                <div className="row text-center">
                  <div className="col-md-3 mb-3">
                    <i className="bi bi-123 text-gold" style={{ fontSize: '2rem' }}></i>
                    <p className="mb-0 mt-2 text-light">Numerada</p>
                  </div>
                  <div className="col-md-3 mb-3">
                    <i className="bi bi-file-text text-gold" style={{ fontSize: '2rem' }}></i>
                    <p className="mb-0 mt-2 text-light">Certificado</p>
                  </div>
                  <div className="col-md-3 mb-3">
                    <i className="bi bi-palette text-gold" style={{ fontSize: '2rem' }}></i>
                    <p className="mb-0 mt-2 text-light">Arte exclusivo</p>
                  </div>
                  <div className="col-md-3 mb-3">
                    <i className="bi bi-music-note-beamed text-gold" style={{ fontSize: '2rem' }}></i>
                    <p className="mb-0 mt-2 text-light">Remasterizado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-white bungee-font mb-4">
          <i className="bi bi-vinyl-fill me-2 text-gold"></i>
          EDICIONES HERITAGE DISPONIBLES
        </h3>
        
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
          {heritageProducts.map(product => (
            <div key={product.id} className="col">
              <Link to={`/album/${product.id}`} className="text-decoration-none">
                <div className="format-item-card heritage-card clickable-card">
                  <div 
                    className="format-item-image"
                    style={{
                      background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${product.image}) center/cover`,
                      height: '200px',
                      position: 'relative'
                    }}
                  >
                    <div className="heritage-badge">
                      <i className="bi bi-gem"></i>
                    </div>
                    
                    <span className="badge bg-gold position-absolute top-0 end-0 m-2">
                      <i className="bi bi-shield-lock me-1"></i>LIMITADO
                    </span>
                    
                    <span className="badge bg-pink position-absolute bottom-0 start-0 m-2">
                      <i className="bi bi-vinyl me-1"></i>Vinyl
                    </span>
                    
                    <span className="badge bg-dark position-absolute bottom-0 end-0 m-2">
                      {product.originalYear || product.year}
                    </span>
                  </div>
                  
                  <div className="format-item-info">
                    <h6 className="format-item-title" title={product.title}>
                      {product.title}
                    </h6>
                    
                    <p className="format-item-artist text-light">
                      {product.artist}
                    </p>
                    
                    <div className="format-item-meta mb-3">
                      <span className="badge bg-dark me-1">
                        {product.genre?.split('/')[0]?.trim() || product.genre}
                      </span>
                      <span className="badge bg-gold">
                        <i className="bi bi-award me-1"></i>
                        {product.edition}
                      </span>
                    </div>
                    
                    <div className="format-item-footer">
                      <div>
                        <span className="format-item-price">
                          ${product.price.toFixed(2)}
                        </span>
                        <small className="d-block text-light">
                          Stock: <span className={product.stock < 3 ? 'text-danger' : 'text-success'}>
                            {product.stock} unidades
                          </span>
                        </small>
                      </div>
                      
                      <button 
                        className={getButtonClass(product)}
                        onClick={(e) => handleAddToCart(e, product)}
                      >
                        {product.stock === 0 ? (
                          <i className="bi bi-x-circle"></i>
                        ) : !isLoggedIn ? (
                          <i className="bi bi-lock"></i>
                        ) : (
                          <i className="bi bi-cart-plus"></i>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {heritageProducts.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-gem text-gold" style={{ fontSize: '3rem' }}></i>
            <h5 className="text-white mt-3">No hay ediciones Heritage disponibles</h5>
            <p className="text-light">Próximamente más ediciones limitadas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Heritage;