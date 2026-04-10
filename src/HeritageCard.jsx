import React from 'react';
import { useNavigate } from 'react-router-dom';

const HeritageCard = ({ product }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/disco/${product.id}`);
  };

  // Obtener el formato correctamente (priorizar formato del producto)
  const getFormato = () => {
    if (product.formato) return product.formato;
    if (product.format) return product.format;
    return 'Vinilo';
  };

  return (
    <div 
      className="heritage-card"
      onClick={handleClick}
      style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        borderRadius: '15px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: '1px solid rgba(0,255,136,0.2)',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.borderColor = '#00ff88';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,255,136,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(0,255,136,0.2)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Badge de edición especial */}
      {product.edition && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: '#ffc107',
          color: '#000',
          padding: '3px 8px',
          borderRadius: '5px',
          fontSize: '10px',
          fontWeight: 'bold',
          zIndex: 10
        }}>
          {product.edition}
        </div>
      )}
      
      {/* Imagen */}
      <div style={{ height: '200px', overflow: 'hidden' }}>
        <img 
          src={product.image || product.imagen_path || '/placeholder.jpg'} 
          alt={product.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
      </div>
      
      {/* Contenido */}
      <div style={{ padding: '15px' }}>
        <h4 style={{ 
          color: '#00ff88', 
          fontSize: '1rem', 
          marginBottom: '5px',
          fontFamily: 'Bungee, cursive'
        }}>
          {product.artist}
        </h4>
        <h5 style={{ 
          color: 'white', 
          fontSize: '0.9rem', 
          marginBottom: '8px'
        }}>
          {product.title}
        </h5>
        
        {/* FORMATO CORREGIDO - Ya no muestra siempre "Vinilo" */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(0,255,136,0.1)',
          padding: '3px 10px',
          borderRadius: '15px',
          marginBottom: '10px'
        }}>
          <span style={{ 
            color: '#00ff88', 
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }}>
            {getFormato()}
          </span>
        </div>
        
        <p style={{ 
          color: '#888', 
          fontSize: '0.75rem', 
          marginBottom: '5px'
        }}>
          {product.year} • {product.genre}
        </p>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '10px'
        }}>
          <span style={{ 
            color: '#00ff88', 
            fontSize: '1.2rem', 
            fontWeight: 'bold'
          }}>
            ${product.price}
          </span>
          <span style={{ 
            color: '#ffc107', 
            fontSize: '0.7rem'
          }}>
            Edición Limitada
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeritageCard;