import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Boveda = () => {
  const { adminProducts, addToCart, isLoggedIn, refreshProducts } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  //  REFRESCAR AL ENTRAR Y CADA 30 SEGUNDOS
  useEffect(() => {
    refreshProducts();
    
    const interval = setInterval(() => {
      refreshProducts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refreshProducts]);

  useEffect(() => {
    let filtered = [...adminProducts];
    
    // FILTRAR AGOTADOS SI NO ESTÁ EN MODO "outofstock"
    if (activeFilter !== 'outofstock') {
      filtered = filtered.filter(p => p.stock > 0);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(term) || 
        p.artist.toLowerCase().includes(term) ||
        (p.genre && p.genre.toLowerCase().includes(term))
      );
    }
    
    if (activeFilter === 'featured') {
      filtered = filtered.filter(p => p.featured);
    } else if (activeFilter === 'lowstock') {
      filtered = filtered.filter(p => p.stock > 0 && p.stock < 10);
    } else if (activeFilter === 'vinyl') {
      filtered = filtered.filter(p => p.format === 'Vinyl' && p.stock > 0);
    } else if (activeFilter === 'cd') {
      filtered = filtered.filter(p => p.format === 'CD' && p.stock > 0);
    } else if (activeFilter === 'cassette') {
      filtered = filtered.filter(p => p.format === 'Cassette' && p.stock > 0);
    } else if (activeFilter === 'heritage') {
      filtered = filtered.filter(p => p.heritage && p.stock > 0);
    } else if (activeFilter === 'outofstock') {
      filtered = filtered.filter(p => p.stock === 0);
    }
    
    if (genreFilter !== 'all') {
      filtered = filtered.filter(p => p.genre && p.genre === genreFilter);
    }
    
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'year') {
      filtered.sort((a, b) => b.year - a.year);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'stock') {
      filtered.sort((a, b) => b.stock - a.stock);
    }
    
    setFilteredProducts(filtered);
  }, [adminProducts, searchTerm, activeFilter, genreFilter, sortBy]);

const handleAddToCart = async (e, product) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (!isLoggedIn) {
    alert('⚠️ Debes iniciar sesión para agregar al carrito');
    return;
  }
  
  if (product.stock <= 0) {
    alert(`❌ "${product.title}" está AGOTADO`);
    return;
  }
  
  //  AGREGAR await AQUÍ
  const result = await addToCart(product);
  
  if (result?.success) {
    alert(`✅ ${product.title} agregado al carrito`);
  } else {
    alert(`❌ ${result?.message || 'No se pudo agregar al carrito'}`);
  }
};

  const getButtonClass = (product) => {
    if (product.stock <= 0) return 'btn-adaptivo btn-sin-stock';
    if (!isLoggedIn) return 'btn-adaptivo btn-sin-sesion';
    return 'btn-adaptivo btn-con-sesion';
  };

  const getButtonIcon = (product) => {
    if (product.stock <= 0) return <i className="bi bi-x-circle"></i>;
    if (!isLoggedIn) return <i className="bi bi-lock"></i>;
    return <i className="bi bi-cart-plus"></i>;
  };

  const getStockDisplay = (product) => {
    if (product.stock <= 0) {
      return <span style={{ color: '#ff4444', fontWeight: 'bold' }}>❌ AGOTADO</span>;
    }
    if (product.stock < 5) {
      return (
        <span style={{ color: '#ffaa00' }}>
          ⚠️ ¡Últimas {product.stock}!
        </span>
      );
    }
    return (
      <span style={{ color: '#4caf50' }}>
        ✅ {product.stock} disponibles
      </span>
    );
  };

  const allGenres = [
    "Rock", "Pop", "Jazz", "Hip Hop", "Electronic", "Classical", "Metal", "Indie",
    "New Wave", "Alternative", "Acid Jazz", "Funk", "Country"
  ].sort();

  return (
    <div className="content-view fade-in">
      <div className="container">
        <div className="text-center mb-4">
          <h1 className="text-white bungee-font display-5 mb-2">
            <i className="bi bi-collection-play me-2 text-pink"></i>
            LA BÓVEDA
          </h1>
          <p className="text-light">
            Catálogo completo ({adminProducts.length} productos)
          </p>
        </div>

        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="input-group">
              <span className="input-group-text bg-dark text-white border-pink">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control bg-dark text-white border-pink"
                placeholder="Buscar álbum, artista o género..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="col-md-3 mb-3">
            <select 
              className="form-select bg-dark text-white border-pink"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="all">📀 Todos los productos</option>
              <option value="featured">⭐ Solo destacados</option>
              <option value="heritage">💎 Solo Heritage</option>
              <option value="lowstock">⚠️ Bajo stock (&lt;10)</option>
              <option value="outofstock">❌ Agotados</option>
              <option value="vinyl">🎵 Solo Vinyl</option>
              <option value="cd">💿 Solo CD</option>
              <option value="cassette">📼 Solo Cassette</option>
            </select>
          </div>
          
          <div className="col-md-3 mb-3">
            <select 
              className="form-select bg-dark text-white border-pink"
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
            >
              <option value="all">🎵 Todos los géneros</option>
              {allGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          
          <div className="col-md-2 mb-3">
            <select 
              className="form-select bg-dark text-white border-pink"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">📊 Ordenar por...</option>
              <option value="name">📝 Nombre (A-Z)</option>
              <option value="price-low">💰 Precio (Menor a Mayor)</option>
              <option value="price-high">💰 Precio (Mayor a Menor)</option>
              <option value="year">📅 Año (Nuevos primero)</option>
              <option value="stock">📦 Stock (Mayor primero)</option>
            </select>
          </div>
        </div>

        <div className="mb-3">
          {(searchTerm || activeFilter !== 'all' || genreFilter !== 'all') && (
            <div className="alert alert-dark border-pink d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-funnel me-2"></i>
                <strong>Filtros activos:</strong>
                {searchTerm && <span className="badge bg-pink ms-2">Búsqueda: "{searchTerm}"</span>}
                {activeFilter !== 'all' && <span className="badge bg-blue ms-2">{activeFilter}</span>}
                {genreFilter !== 'all' && <span className="badge bg-gold ms-2">Género: {genreFilter}</span>}
              </div>
              <button 
                className="btn btn-sm btn-outline-pink"
                onClick={() => {
                  setSearchTerm('');
                  setActiveFilter('all');
                  setGenreFilter('all');
                  setSortBy('default');
                }}
              >
                <i className="bi bi-x-circle me-1"></i>
                Limpiar
              </button>
            </div>
          )}
          
          {searchTerm && (
            <p className="text-light">
              <i className="bi bi-search me-1"></i>
              Búsqueda: "{searchTerm}" ({filteredProducts.length} resultados)
            </p>
          )}
          
          <div className="d-flex gap-3 mt-2">
            <small className="text-success">
              ✅ Disponibles: {adminProducts.filter(p => p.stock > 0).length}
            </small>
            <small className="text-danger">
              ❌ Agotados: {adminProducts.filter(p => p.stock <= 0).length}
            </small>
          </div>
        </div>

        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="col">
              <Link to={`/album/${product.id}`} className="text-decoration-none">
                <div className={`format-item-card clickable-card ${product.heritage ? 'heritage-card' : ''} ${product.stock <= 0 ? 'out-of-stock' : ''}`}>
                  <div 
                    className="format-item-image"
                    style={{
                      background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${product.image}) center/cover`,
                      height: '200px',
                      position: 'relative'
                    }}
                  >
                    {product.heritage && (
                      <div className="heritage-badge">
                        <i className="bi bi-gem"></i>
                      </div>
                    )}
                    
                    {product.featured && !product.heritage && (
                      <span className="badge bg-pink position-absolute top-0 start-0 m-2">
                        <i className="bi bi-star-fill me-1"></i>Destacado
                      </span>
                    )}
                    
                    <span className={`badge position-absolute bottom-0 start-0 m-2 ${
                      product.format === 'Vinyl' ? 'bg-pink' : 
                      product.format === 'CD' ? 'bg-blue' : 'bg-gold'
                    }`}>
                      {product.format}
                    </span>
                    
                    <span className="badge bg-dark position-absolute bottom-0 end-0 m-2">
                      {product.year}
                    </span>

                    {product.stock <= 0 && (
                      <span className="badge bg-danger position-absolute top-0 end-0 m-2">
                        ❌ AGOTADO
                      </span>
                    )}
                    
                    {product.stock > 0 && product.stock < 5 && (
                      <span className="badge bg-warning text-dark position-absolute top-0 end-0 m-2">
                        ⚠️ ÚLTIMAS {product.stock}
                      </span>
                    )}
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
                      {product.heritage && (
                        <span className="badge bg-gold">
                          <i className="bi bi-award me-1"></i>Heritage
                        </span>
                      )}
                    </div>
                    
                    <div className="format-item-footer">
                      <div>
                        <span className="format-item-price">
                          ${product.price?.toFixed(2)}
                        </span>
                        <small className="d-block text-light">
                          {getStockDisplay(product)}
                        </small>
                      </div>
                      
                      <button 
                        className={getButtonClass(product)}
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={product.stock <= 0} 
                        style={product.stock <= 0 ? { 
                          opacity: 0.5, 
                          cursor: 'not-allowed',
                          backgroundColor: '#666',
                          pointerEvents: 'none'
                        } : {}}
                        title={product.stock <= 0 ? 'Producto agotado' : 'Agregar al carrito'}
                      >
                        {getButtonIcon(product)}
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
            <i className="bi bi-search text-light" style={{ fontSize: '3rem' }}></i>
            <h5 className="text-white mt-3">No se encontraron productos</h5>
            <p className="text-light mb-3">
              {searchTerm || activeFilter !== 'all' || genreFilter !== 'all' 
                ? "Intenta con otros filtros o limpia los filtros actuales" 
                : "No hay productos en el catálogo"}
            </p>
            <button 
              className="btn btn-neon-pink mt-2"
              onClick={() => {
                setSearchTerm('');
                setActiveFilter('all');
                setGenreFilter('all');
                setSortBy('default');
              }}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Restablecer filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Boveda;