import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const DiscoCard = ({ product, showAddButton = true }) => {
  const navigate = useNavigate();
  const { addToCart } = useApp();

  const handleCardClick = () => {
    navigate(`/disco/${product.id}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    const result = addToCart(product, 1);
    if (!result.success) {
      alert(result.message);
    } else {
      // Mostrar feedback visual
      const btn = e.target;
      const originalText = btn.innerText;
      btn.innerText = '✓ AGREGADO';
      setTimeout(() => {
        btn.innerText = originalText;
      }, 1500);
    }
  };

  // Determinar si el producto está agotado
  const isOutOfStock = product.stock === 0 || product.stock < 1;

  return (
    <div 
      className="disco-card cursor-pointer"
      onClick={handleCardClick}
      style={{
        background: '#1a1a2e',
        borderRadius: '15px',
        overflow: 'hidden',
        transition: 'transform 0.3s, box-shadow 0.3s',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,255,136,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Badge de AGOTADO si no hay stock */}
      {isOutOfStock && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: '#dc3545',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 10,
          textTransform: 'uppercase'
        }}>
          AGOTADO
        </div>
      )}
      
      {/* Imagen */}
      <div style={{ height: '250px', overflow: 'hidden' }}>
        <img 
          src={product.image || '/placeholder.jpg'} 
          alt={product.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
      </div>
      
      {/* Contenido */}
      <div style={{ padding: '15px', flex: 1 }}>
        <h5 style={{ 
          color: '#00ff88', 
          fontSize: '1rem', 
          marginBottom: '5px',
          fontFamily: 'Bungee, cursive'
        }}>
          {product.artist}
        </h5>
        <h6 style={{ 
          color: 'white', 
          fontSize: '0.9rem', 
          marginBottom: '10px'
        }}>
          {product.title}
        </h6>
        <p style={{ 
          color: '#888', 
          fontSize: '0.8rem', 
          marginBottom: '5px'
        }}>
          {product.year} • {product.genre}
        </p>
        <p style={{ 
          color: '#888', 
          fontSize: '0.8rem', 
          marginBottom: '10px'
        }}>
          Formato: {product.format || 'Vinilo'}
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto'
        }}>
          <span style={{ 
            color: '#00ff88', 
            fontSize: '1.3rem', 
            fontWeight: 'bold'
          }}>
            ${product.price}
          </span>
          
          {showAddButton && (
            isOutOfStock ? (
              <button 
                disabled
                style={{
                  background: '#555',
                  color: '#999',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '20px',
                  cursor: 'not-allowed',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}
              >
                AGOTADO
              </button>
            ) : (
              <button 
                onClick={handleAddToCart}
                style={{
                  background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                  color: '#0a0a0f',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                AÑADIR
              </button>
            )
          )}
        </div>
        
        {/* Indicador de stock bajo */}
        {!isOutOfStock && product.stock <= 3 && (
          <p style={{
            color: '#ffc107',
            fontSize: '0.7rem',
            marginTop: '8px',
            marginBottom: '0'
          }}>
            ⚡ ¡Últimas {product.stock} unidades!
          </p>
        )}
      </div>
    </div>
  );
};

export default DiscoCard;