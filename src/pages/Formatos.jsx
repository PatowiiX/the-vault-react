import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Formatos = () => {
  const { addToCart, isLoggedIn } = useApp();
  
  // ESTADO LOCAL PARA PRODUCTOS (CARGA DIRECTA DESDE API)
  const [adminProducts, setAdminProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFormat, setActiveFormat] = useState('All');
  const [genreFilter, setGenreFilter] = useState('all');

  // CARGA DIRECTA DESDE LA API (SIN CACHÉ)
  const cargarProductos = async () => {
    setLoading(true);
    try {
      console.log("🔄 Cargando productos directamente desde API...");
      const response = await fetch('http://localhost:3001/api/discos');
      const data = await response.json();
      
      console.log("📦 Datos recibidos:", data.discos.map(d => ({ titulo: d.titulo, stock: d.stock })));
      
      // Normalizar productos
      const productosNormalizados = data.discos.map(disco => ({
        id: disco.id,
        title: disco.titulo,
        artist: disco.artista,
        year: disco.anio,
        genre: disco.genero,
        format: disco.formato,
        image: disco.imagen_path,
        description: disco.descripcion,
        price: parseFloat(disco.precio) || 25.00,
        stock: disco.stock || 0,
        featured: disco.top === 1,
        heritage: disco.heritage === 1,
        tracks: disco.tracks || 10,
        duration: disco.duration || '45:00',
        sku: disco.sku,
        edition: disco.edition
      }));
      
      setAdminProducts(productosNormalizados);
    } catch (error) {
      console.error("❌ Error cargando productos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos al montar el componente
  useEffect(() => {
    cargarProductos();
  }, []);

  // Refrescar cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Refresco automático cada 30s...");
      cargarProductos();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtrar por formato
  const vinylProducts = adminProducts.filter(p => p.format === 'Vinyl');
  const cdProducts = adminProducts.filter(p => p.format === 'CD');
  const cassetteProducts = adminProducts.filter(p => p.format === 'Cassette');
  
  const existingGenres = [...new Set(adminProducts.map(p => p.genre).filter(g => g))];
  const extraGenres = ["New Wave", "Alternative", "Acid Jazz", "Funk", "Country"];
  const allGenres = [...new Set([...existingGenres, ...extraGenres])].sort();

  const getProductsByFormat = () => {
    let products;
    switch(activeFormat) {
      case 'Vinyl': products = vinylProducts; break;
      case 'CD': products = cdProducts; break;
      case 'Cassette': products = cassetteProducts; break;
      default: products = adminProducts;
    }
    
    if (genreFilter !== 'all') {
      products = products.filter(p => p.genre === genreFilter);
    }
    
    return products;
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoggedIn) {
      alert('⚠️ Debes iniciar sesión para agregar al carrito');
      return;
    }
    
    if (product.stock <= 0) {
      alert(`😔 "${product.title}" está agotado`);
      return;
    }
    
    const result = await addToCart(product);
    if (result.success) {
      alert(`✅ ${product.title} agregado al carrito`);
      await cargarProductos(); // Recargar productos después de agregar
    } else {
      alert(`❌ ${result.message}`);
    }
  };

  const getFormatColor = (format) => {
    switch(format) {
      case 'Vinyl': return '#ff00ff';
      case 'CD': return '#00f2ff';  
      case 'Cassette': return '#d4af37';
      default: return '';
    }
  };

  const getButtonClass = (product) => {
    if (product.stock <= 0) return 'btn-adaptivo btn-sin-stock';
    if (!isLoggedIn) return 'btn-adaptivo btn-sin-sesion';
    return 'btn-adaptivo btn-con-sesion';
  };

  const getStockDisplay = (product) => {
    const stockActual = Number(product.stock) || 0;
    
    if (stockActual <= 0) {
      return <span style={{ color: '#888', fontWeight: 'bold' }}>🔴 NO DISPONIBLE</span>;
    }
    if (stockActual < 5) {
      return <span style={{ color: '#ffaa00' }}>⚠️ ¡Últimas {stockActual}!</span>;
    }
    return <span style={{ color: '#4caf50' }}>✅ {stockActual} disponibles</span>;
  };

  const filteredProducts = getProductsByFormat();

  if (loading) {
    return (
      <div className="content-view fade-in">
        <div className="container text-center py-5">
          <div className="spinner-border text-pink" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-white mt-3">Cargando formatos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-view fade-in">
      <div className="container">
        <div className="text-center mb-5">
          <h1 className="text-white bungee-font display-4 mb-3">
            <i className="bi bi-disc me-3 text-blue"></i>
            FORMATOS DISPONIBLES
          </h1>
          <p className="text-light fs-5">
            Explora nuestra colección por formato
          </p>
        </div>

        {/* FILTRO DE GÉNEROS */}
        <div className="row mb-4">
          <div className="col-md-6">
            <select 
              className="form-select bg-dark text-white border-pink"
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
            >
              <option value="all">Todos los géneros</option>
              {allGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <div className="text-end">
              <span className="badge bg-pink p-2">
                {filteredProducts.length} productos encontrados
              </span>
              {genreFilter !== 'all' && (
                <button 
                  className="btn btn-sm btn-outline-pink ms-2"
                  onClick={() => setGenreFilter('all')}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Limpiar género
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="format-tabs-container mb-5">
          <div className="format-tabs">
            <button 
              className={`format-tab ${activeFormat === 'All' ? 'active' : ''}`}
              onClick={() => setActiveFormat('All')}
            >
              <i className="bi bi-collection"></i>
              TODOS LOS FORMATOS
              <span className="tab-count">{adminProducts.length}</span>
            </button>
            
            <button 
              className={`format-tab ${activeFormat === 'Vinyl' ? 'active' : ''}`}
              onClick={() => setActiveFormat('Vinyl')}
              style={{ color: activeFormat === 'Vinyl' ? getFormatColor('Vinyl') : '' }}
            >
              <i className="bi bi-vinyl"></i>
              VINYL
              <span className="tab-count">{vinylProducts.length}</span>
            </button>
            
            <button 
              className={`format-tab ${activeFormat === 'CD' ? 'active' : ''}`}
              onClick={() => setActiveFormat('CD')}
              style={{ color: activeFormat === 'CD' ? getFormatColor('CD') : '' }}
            >
              <i className="bi bi-cd"></i>
              CD
              <span className="tab-count">{cdProducts.length}</span>
            </button>
            
            <button 
              className={`format-tab ${activeFormat === 'Cassette' ? 'active' : ''}`}
              onClick={() => setActiveFormat('Cassette')}
              style={{ color: activeFormat === 'Cassette' ? getFormatColor('Cassette') : '' }}
            >
              <i className="bi bi-cassette"></i>
              CASSETTE
              <span className="tab-count">{cassetteProducts.length}</span>
            </button>
          </div>
        </div>

        <div className="format-tab-content active">
          <div className="format-header bg-blue p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="bungee-font mb-2">
                  {activeFormat === 'All' ? 'TODOS LOS FORMATOS' : activeFormat.toUpperCase()}
                </h3>
                <p className="mb-0">
                  {activeFormat === 'All' && `Mostrando ${filteredProducts.length} de ${adminProducts.length} productos`}
                  {activeFormat === 'Vinyl' && `${filteredProducts.length} de ${vinylProducts.length} discos de vinilo`}
                  {activeFormat === 'CD' && `${filteredProducts.length} de ${cdProducts.length} CDs`}
                  {activeFormat === 'Cassette' && `${filteredProducts.length} de ${cassetteProducts.length} cassettes`}
                </p>
              </div>
              {genreFilter !== 'all' && (
                <span className="badge bg-gold p-2">
                  <i className="bi bi-music-note-beamed me-1"></i>
                  Género: {genreFilter}
                </span>
              )}
            </div>
          </div>

          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {filteredProducts.map(product => (
              <div key={`${product.id}-${product.stock}`} className="col">
                <Link to={`/album/${product.id}`} className="text-decoration-none">
                  <div 
                    className={`format-item-card clickable-card ${product.stock <= 0 ? 'out-of-stock' : ''}`}
                    style={{
                      opacity: product.stock <= 0 ? 0.6 : 1,
                      filter: product.stock <= 0 ? 'grayscale(0.5)' : 'none',
                      background: product.stock <= 0 ? '#2a2a2a' : '',
                      transition: 'all 0.3s ease',
                      cursor: product.stock <= 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <div 
                      className="format-item-image"
                      style={{
                        background: `url(${product.image}) center/cover`,
                        height: '180px',
                        position: 'relative'
                      }}
                    >
                      <span className={`badge ${
                        product.format === 'Vinyl' ? 'bg-pink' : 
                        product.format === 'CD' ? 'bg-blue' : 'bg-gold'
                      }`}>
                        {product.format}
                      </span>
                      
                      {product.stock <= 0 && (
                        <span className="badge bg-danger position-absolute top-0 end-0 m-2">
                          AGOTADO
                        </span>
                      )}
                    </div>
                    <div className="format-item-info">
                      <h6 className="format-item-title text-white">{product.title}</h6>
                      <p className="format-item-artist text-light">{product.artist}</p>
                      <div className="format-item-meta">
                        <span className="format-item-year">{product.year}</span>
                        <span className="format-item-genre badge bg-dark">{product.genre}</span>
                      </div>
                      <div className="format-item-footer">
                        <div>
                          <span className="format-item-price">${product.price.toFixed(2)}</span>
                          <small className="d-block text-light">
                            {getStockDisplay(product)}
                          </small>
                        </div>
                        <button 
                          className={getButtonClass(product)}
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={product.stock <= 0}
                          style={product.stock <= 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                          {product.stock <= 0 ? (
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
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-disc text-light" style={{ fontSize: '3rem' }}></i>
              <h5 className="text-white mt-3">No se encontraron productos</h5>
              <p className="text-light mb-3">
                {genreFilter !== 'all' 
                  ? `No hay productos en formato ${activeFormat === 'All' ? '' : activeFormat + ' '}con género ${genreFilter}`
                  : `No hay productos en formato ${activeFormat === 'All' ? '' : activeFormat}`}
              </p>
              <button 
                className="btn btn-neon-pink mt-2"
                onClick={() => {
                  setGenreFilter('all');
                  setActiveFormat('All');
                  cargarProductos(); // Recargar productos al limpiar filtros
                }}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Ver todos los productos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Formatos;