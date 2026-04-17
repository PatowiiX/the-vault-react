// src/components/SpotifyPreview.jsx
import React, { useState, useEffect } from 'react';

const SpotifyPreview = ({ albumTitle, artistName }) => {
  const [embedUrl, setEmbedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmbed, setIsEmbed] = useState(false);

  useEffect(() => {
    if (albumTitle && artistName) {
      buscarEnSpotify();
    }
  }, [albumTitle, artistName]);

  const buscarEnSpotify = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔍 Buscando en Spotify:", albumTitle, artistName);
      
      // ✅ CORREGIDO: Usar variable de entorno
      const API_URL = process.env.REACT_APP_API_URL;
      const response = await fetch(
        `${API_URL}/spotify/preview?query=${encodeURIComponent(albumTitle)}&artist=${encodeURIComponent(artistName)}`
      );
      
      const data = await response.json();
      console.log("📦 Respuesta Spotify:", data);
      
      if (data.embedUrl) {
        setEmbedUrl(data.embedUrl);
        setIsEmbed(!data.isSearch && data.found);
      } else {
        setError("No se encontró el álbum en Spotify");
      }
    } catch (err) {
      console.error("❌ Error Spotify:", err);
      setError("Error de conexión con Spotify");
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ 
        marginTop: '30px',
        background: 'rgba(0,0,0,0.3)', 
        borderRadius: '16px', 
        padding: '20px',
        textAlign: 'center'
      }}>
        <div className="spinner-border spinner-border-sm text-success me-2"></div>
        <span className="text-white-50">Cargando preview de Spotify...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        marginTop: '30px',
        background: 'rgba(0,0,0,0.3)', 
        borderRadius: '16px', 
        padding: '20px',
        textAlign: 'center',
        border: '1px solid rgba(255,0,0,0.3)'
      }}>
        <i className="bi bi-spotify text-success" style={{ fontSize: '1.5rem', opacity: 0.5 }}></i>
        <p className="text-white-50 mt-2 mb-0 small">{error}</p>
      </div>
    );
  }

  if (!embedUrl) return null;

  return (
    <div style={{ 
      marginTop: '30px',
      background: 'linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,255,136,0.05))',
      borderRadius: '16px',
      padding: '16px',
      border: '1px solid rgba(0,255,136,0.2)'
    }}>
      <div className="d-flex align-items-center gap-2 mb-2">
        <i className="bi bi-spotify text-success" style={{ fontSize: '1.3rem' }}></i>
        <h5 className="text-white mb-0" style={{ fontFamily: 'Bungee, cursive', fontSize: '0.9rem' }}>
          {isEmbed ? 'ESCUCHA EN SPOTIFY' : 'BUSCAR EN SPOTIFY'}
        </h5>
      </div>
      
      {isEmbed ? (
        <iframe 
          src={embedUrl}
          width="100%" 
          height="352" 
          frameBorder="0" 
          allow="encrypted-media"
          style={{ borderRadius: '12px' }}
          title={`Preview de ${albumTitle}`}
        ></iframe>
      ) : (
        <a 
          href={embedUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-outline-success w-100 py-3"
          style={{ borderRadius: '12px', textDecoration: 'none' }}
        >
          <i className="bi bi-spotify me-2"></i>
          Escuchar "{albumTitle}" en Spotify
        </a>
      )}
    </div>
  );
};

export default SpotifyPreview;