import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const API_URL = 'http://localhost:3001/api';

const AlbumDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { adminProducts, addToCart, isLoggedIn, refreshProducts } = useApp();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [stockRealTime, setStockRealTime] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Cargar álbum inicial desde adminProducts
  useEffect(() => {
    console.log("🔵 AlbumDetails: Cargando ID:", id);
    setLoading(true);
    const foundAlbum = adminProducts.find(p => p.id === parseInt(id));
    console.log("🔵 AlbumDetails: Álbum encontrado:", foundAlbum);
    setAlbum(foundAlbum);
    setLoading(false);
  }, [id, adminProducts]);

  // ✅ VERIFICAR STOCK EN TIEMPO REAL DIRECTAMENTE DE LA BD
  useEffect(() => {
    const verificarStockEnTiempoReal = async () => {
      if (!id) return;
      
      try {
        console.log("🔄 Verificando stock en tiempo real para ID:", id);
        const response = await fetch(`${API_URL}/discos/${id}`);
        const data = await response.json();
        
        if (data.disco) {
          console.log("📦 Stock desde BD:", data.disco.stock);
          setStockRealTime(data.disco.stock);
          
          // Actualizar el album con el stock real
          setAlbum(prev => prev ? { ...prev, stock: data.disco.stock } : null);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error("❌ Error verificando stock:", error);
      }
    };

    // Verificar inmediatamente
    verificarStockEnTiempoReal();

    // Verificar cada 2 segundos mientras la página esté abierta
    const intervalo = setInterval(verificarStockEnTiempoReal, 2000);

    return () => clearInterval(intervalo);
  }, [id]);

  // Escuchar actualizaciones globales de productos
  useEffect(() => {
    const handleProductsUpdate = (event) => {
      console.log("🔄 Productos actualizados globalmente, recargando álbum...");
      const updatedProducts = event.detail || adminProducts;
      const foundAlbum = updatedProducts.find(p => p.id === parseInt(id));
      if (foundAlbum) {
        setAlbum(foundAlbum);
        setLastUpdated(new Date());
      }
    };

    window.addEventListener('productsUpdated', handleProductsUpdate);
    
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdate);
    };
  }, [id, adminProducts]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const handleAddToCart = async () => {
    console.log("🔵 AlbumDetails: handleAddToCart iniciado", album);
    
    if (!isLoggedIn) {
      console.log("🔴 AlbumDetails: Usuario no logueado");
      alert('⚠️ Debes iniciar sesión para agregar productos al carrito');
      navigate('/login', { state: { from: `/album/${id}` } });
      return;
    }
    
    // Usar stock en tiempo real para la verificación
    const stockActual = stockRealTime !== null ? stockRealTime : album?.stock;
    
    if (stockActual <= 0) {
      console.log("🔴 AlbumDetails: Producto agotado, stock:", stockActual);
      alert(`❌ "${album?.title}" está agotado`);
      return;
    }
    
    console.log("🟢 AlbumDetails: Llamando a addToCart");
    setAddingToCart(true);
    const result = await addToCart(album);
    console.log("🟢 AlbumDetails: Resultado de addToCart:", result);
    setAddingToCart(false);
    
    if (result?.success) {
      await refreshProducts();
      // Actualizar el album localmente
      setAlbum(prev => prev ? { ...prev, stock: prev.stock - 1 } : null);
      setLastUpdated(new Date());
    }
  };

  const getButtonClass = () => {
    if (!album) return '';
    const stockActual = stockRealTime !== null ? stockRealTime : album?.stock;
    if (stockActual <= 0) return 'btn-adaptivo btn-sin-stock';
    if (!isLoggedIn) return 'btn-adaptivo btn-sin-sesion';
    return 'btn-adaptivo btn-con-sesion';
  };

  const getButtonIcon = () => {
    if (!album) return null;
    const stockActual = stockRealTime !== null ? stockRealTime : album?.stock;
    if (stockActual <= 0) return <i className="bi bi-x-circle"></i>;
    if (!isLoggedIn) return <i className="bi bi-lock"></i>;
    return <i className="bi bi-cart-plus"></i>;
  };

  const getButtonText = () => {
    if (!album) return '';
    const stockActual = stockRealTime !== null ? stockRealTime : album?.stock;
    if (stockActual <= 0) return '❌ AGOTADO';
    if (!isLoggedIn) return 'INICIAR SESIÓN PARA COMPRAR';
    return addingToCart ? 'AGREGANDO...' : 'AGREGAR AL CARRITO';
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

  const stockActual = stockRealTime !== null ? stockRealTime : album.stock;

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
                  border: album.heritage ? '3px solid #d4af37' : 'none',
                  filter: stockActual <= 0 ? 'grayscale(100%)' : 'none',
                  opacity: stockActual <= 0 ? 0.7 : 1
                }}
              />
              
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

                {stockActual > 0 && stockActual < 5 && (
                  <span className="badge bg-warning text-dark">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    ¡Últimas {stockActual} unidades!
                  </span>
                )}
                
                {stockActual <= 0 && (
                  <span className="badge bg-danger">
                    <i className="bi bi-x-circle me-1"></i>
                    AGOTADO
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-7">
            <div className="card bg-dark text-white border-pink p-4 h-100">
              <h1 className="display-5 mb-2">{album.title}</h1>
              <h3 className="text-light mb-4">
                <i className="bi bi-person-circle me-2"></i>
                {album.artist}
              </h3>
              
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
                    <span className={`ms-2 ${stockActual <= 0 ? 'text-danger fw-bold' : stockActual < 5 ? 'text-warning' : 'text-success'}`}>
                      {stockActual <= 0 ? '❌ AGOTADO' : `${stockActual} unidades`}
                    </span>
                  </p>
                  {/* 👇 TIMESTAMP PARA VER CUÁNDO SE ACTUALIZÓ */}
                  <p className="mb-0">
                    <small className="text-muted">
                      Actualizado: {lastUpdated.toLocaleTimeString()}
                    </small>
                  </p>
                  {album.heritage && album.edition && (
                    <p className="mb-2">
                      <strong><i className="bi bi-award me-2"></i>Edición:</strong> 
                      <span className="ms-2">{album.edition}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h5 className="text-pink">
                  <i className="bi bi-file-text me-2"></i>
                  Descripción
                </h5>
                <p className="text-light">{album.description || 'Sin descripción disponible.'}</p>
              </div>

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

              <div className="d-flex flex-column gap-3 mt-auto">
                <button 
                  className={getButtonClass()}
                  onClick={handleAddToCart}
                  disabled={stockActual <= 0 || addingToCart}
                  style={{
                    padding: '15px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    opacity: stockActual <= 0 ? 0.6 : addingToCart ? 0.8 : 1,
                    cursor: stockActual <= 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <span className="d-flex align-items-center justify-content-center">
                    {addingToCart ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      getButtonIcon()
                    )}
                    <span className="ms-2">{getButtonText()}</span>
                  </span>
                </button>

                {stockActual <= 0 && (
                  <div className="alert alert-danger text-center mb-0">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Este producto está agotado temporalmente
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumDetails;