import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const SearchBar = () => {
  const { adminProducts } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = adminProducts
      .filter(p => 
        p.title.toLowerCase().includes(term) ||
        p.artist.toLowerCase().includes(term) ||
        p.genre?.toLowerCase().includes(term)
      )
      .slice(0, 5); // Solo 5 resultados

    setResults(filtered);
    setShowResults(true);
  }, [searchTerm, adminProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/boveda?search=${encodeURIComponent(searchTerm)}`);
      setShowResults(false);
    }
  };

  const handleProductClick = () => {
    setShowResults(false);
    setSearchTerm('');
  };

  return (
    <div className="search-bar-container" ref={searchRef}>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Buscar álbumes, artistas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
        />
        <button type="submit" className="search-button">
          <i className="bi bi-search"></i>
        </button>
      </form>

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map(product => (
            <Link 
              key={product.id}
              to={`/album/${product.id}`}
              className="search-result-item"
              onClick={handleProductClick}
            >
              <div className="search-result-image">
                <img src={product.image} alt={product.title} />
              </div>
              <div className="search-result-info">
                <h6>{product.title}</h6>
                <p>{product.artist}</p>
                <small>
                  <span className={`badge ${
                    product.format === 'Vinyl' ? 'bg-pink' : 
                    product.format === 'CD' ? 'bg-blue' : 'bg-gold'
                  }`}>
                    {product.format}
                  </span>
                  <span className="ms-2">${product.price.toFixed(2)}</span>
                </small>
              </div>
            </Link>
          ))}
          <Link 
            to={`/boveda?search=${encodeURIComponent(searchTerm)}`}
            className="search-result-all"
            onClick={handleProductClick}
          >
            Ver todos los resultados ({adminProducts.filter(p => 
              p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              p.artist.toLowerCase().includes(searchTerm.toLowerCase())
            ).length})
          </Link>
        </div>
      )}
    </div>
  );
};

export default SearchBar;