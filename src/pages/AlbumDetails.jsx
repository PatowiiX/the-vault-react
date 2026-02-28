// src/pages/AlbumDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const AlbumDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { adminProducts, addToCart, isLoggedIn, refreshProducts } = useApp(); // 👈 AGREGAR refreshProducts
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);

  // 👇 REFRESCAR PRODUCTOS AL CARGAR LA PÁGINA
  useEffect(() => {
    const loadAlbum = async () => {
      setLoading(true);
      // Forzar recarga de productos desde el backend
      await refreshProducts();
      
      // Buscar el álbum actualizado
      const foundAlbum = adminProducts.find(p => p.id === parseInt(id));
      setAlbum(foundAlbum);
      setLoading(false);
    };
    
    loadAlbum();
  }, [id, adminProducts, refreshProducts]); // 👈 DEPENDENCIAS

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      alert('⚠️ Debes iniciar sesión para agregar productos al carrito');
      return;
    }
    
    if (album.stock === 0) {
      alert(`😔 "${album.title}" está agotado`);
      return;
    }
    
    const result = addToCart(album);
    if (result.success) {
      alert(`✅ ${album.title} agregado al carrito`);
    }
  };

  const getButtonClass = () => {
    if (!album) return '';
    
    if (album.stock === 0) return 'btn-adaptivo btn-sin-stock';
    if (!isLoggedIn) return 'btn-adaptivo btn-sin-sesion';
    return 'btn-adaptivo btn-con-sesion';
  };

  const getButtonIcon = () => {
    if (!album) return null;
    
    if (album.stock === 0) return <i className="bi bi-x-circle"></i>;
    if (!isLoggedIn) return <i className="bi bi-lock"></i>;
    return <i className="bi bi-cart-plus"></i>;
  };

  const getButtonText = () => {
    if (!album) return '';
    
    if (album.stock === 0) return 'AGOTADO';
    if (!isLoggedIn) return 'INICIAR SESIÓN PARA COMPRAR';
    return 'AGREGAR AL CARRITO';
  };

  if (loading) return (
    <div className="content-view fade-in">
      <div className="container text-center py-5">
        <div className="spinner-border text-pink" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="text-white mt-3">Cargando álbum...</p>
      </div>
    </div>
  );

  if (!album) return (
    <div className="content-view fade-in">
      <div className="container text-center py-5">
        <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
        <h1 className="text-white mt-3">Álbum no encontrado</h1>
        <button 
          className="btn btn-neon-pink mt-3"
          onClick={() => navigate('/boveda')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Volver a la bóveda
        </button>
      </div>
    </div>
  );

  return (
    <div className="content-view fade-in">
      <div className="container">
        <button 
          className="btn btn-neon-outline mb-4"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left"></i> Volver
        </button>

        <div className="row">
          {/* IMAGEN GRANDE */}
          <div className="col-md-5">
            <div className="album-cover-large mb-4">
              <img 
                src={album.image} 
                alt={album.title}
                className="img-fluid rounded shadow"
                style={{ 
                  width: '100%', 
                  maxHeight: '500px', 
                  objectFit: 'cover',
                  border: album.heritage ? '3px solid #d4af37' : 'none'
                }}
              />
              
              {/* BADGES */}
              <div className="mt-3 d-flex flex-wrap gap-2">
                {album.heritage && (
                  <span className="badge bg-gold">
                    <i className="bi bi-gem me-1"></i>
                    EDICIÓN HERITAGE
                  </span>
                )}
                
                <span className={`badge ${
                  album.format === 'Vinyl' ? 'bg-pink' : 
                  album.format === 'CD' ? 'bg-blue' : 'bg-gold'
                }`}>
                  <i className={`bi ${
                    album.format === 'Vinyl' ? 'bi-vinyl' : 
                    album.format === 'CD' ? 'bi-cd' : 'bi-cassette'
                  } me-1`}></i>
                  {album.format}
                </span>
                
                <span className="badge bg-dark">
                  <i className="bi bi-calendar me-1"></i>
                  {album.year}
                </span>

                {/* BADGE DE STOCK BAJO */}
                {album.stock > 0 && album.stock < 5 && (
                  <span className="badge bg-warning text-dark">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    ¡Últimas {album.stock} unidades!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* INFORMACIÓN DETALLADA */}
          <div className="col-md-7">
            <div className="card bg-dark text-white border-pink p-4 h-100">
              <h1 className="display-5 mb-2">{album.title}</h1>
              <h3 className="text-light mb-4">
                <i className="bi bi-person-circle me-2"></i>
                {album.artist}
              </h3>
              
              {/* INFO BÁSICA */}
              <div className="row mb-4">
                <div className="col-6">
                  <p className="mb-2">
                    <strong><i className="bi bi-calendar3 me-2"></i>Año:</strong> 
                    <span className="ms-2">{album.year}</span>
                  </p>
                  <p className="mb-2">
                    <strong><i className="bi bi-music-note-list me-2"></i>Género:</strong> 
                    <span className="ms-2">{album.genre}</span>
                  </p>
                  <p className="mb-2">
                    <strong><i className="bi bi-disc me-2"></i>Formato:</strong> 
                    <span className="ms-2">{album.format}</span>
                  </p>
                </div>
                <div className="col-6">
                  <p className="mb-2">
                    <strong><i className="bi bi-currency-dollar me-2"></i>Precio:</strong> 
                    <span className="ms-2 text-pink">${album.price.toFixed(2)}</span>
                  </p>
                  <p className="mb-2">
                    <strong><i className="bi bi-box-seam me-2"></i>Stock:</strong> 
                    <span className={`ms-2 ${album.stock === 0 ? 'text-danger fw-bold' : album.stock < 5 ? 'text-warning' : 'text-success'}`}>
                      {album.stock === 0 ? '❌ AGOTADO' : `${album.stock} unidades`}
                    </span>
                  </p>
                  {album.heritage && album.edition && (
                    <p className="mb-2">
                      <strong><i className="bi bi-award me-2"></i>Edición:</strong> 
                      <span className="ms-2">{album.edition}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* DESCRIPCIÓN */}
              <div className="mb-4">
                <h5 className="text-pink">
                  <i className="bi bi-file-text me-2"></i>
                  Descripción
                </h5>
                <p className="text-light">{album.description || 'Sin descripción disponible.'}</p>
              </div>

              {/* DETALLES TÉCNICOS */}
              <div className="row bg-dark-secondary p-3 rounded mb-4">
                <div className="col-4 text-center">
                  <i className="bi bi-music-note-list fs-4 text-pink"></i>
                  <p className="mb-0 mt-2">
                    {album.tracks || album.songs || 'N/A'} canciones
                  </p>
                </div>
                <div className="col-4 text-center">
                  <i className="bi bi-clock fs-4 text-pink"></i>
                  <p className="mb-0 mt-2">
                    {album.duration || album.time || 'N/A'}
                  </p>
                </div>
                <div className="col-4 text-center">
                  <i className="bi bi-upc-scan fs-4 text-pink"></i>
                  <p className="mb-0 mt-2">
                    {album.sku || album.code || 'N/A'}
                  </p>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="d-flex flex-column gap-3 mt-auto">
                <button 
                  className={getButtonClass()}
                  onClick={handleAddToCart}
                  disabled={album.stock === 0}
                  style={{
                    padding: '15px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    opacity: album.stock === 0 ? 0.6 : 1,
                    cursor: album.stock === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <span className="d-flex align-items-center justify-content-center">
                    {getButtonIcon()}
                    <span className="ms-2">{getButtonText()}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumDetails;