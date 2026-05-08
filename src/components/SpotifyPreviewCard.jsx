// src/components/SpotifyPreviewCard.jsx
import React, { useState, useEffect } from 'react';

const SpotifyPreviewCard = ({ albumTitle, artistName }) => {
  const [embedUrl, setEmbedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (albumTitle && artistName) {
      buscarEnSpotify();
    }
  }, [albumTitle, artistName]);

  const buscarEnSpotify = async () => {
    setLoading(true);
    setError(false);
    
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const response = await fetch(
        `${API_URL}/spotify/preview?query=${encodeURIComponent(albumTitle)}&artist=${encodeURIComponent(artistName)}`
      );
      const data = await response.json();
      
      if (data.embedUrl && !data.isSearch) {
        setEmbedUrl(data.embedUrl);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="spotify-card">
        <div className="spotify-header">
          <i className="bi bi-spotify text-success"></i>
          <span className="spotify-badge">PREVIEW</span>
        </div>
        <div className="spotify-loading">
          <div className="spinner-border spinner-border-sm text-success me-2" role="status"></div>
          <span className="text-white-50">Buscando en Spotify...</span>
        </div>
      </div>
    );
  }

  if (error || !embedUrl) {
    return null;
  }

  return (
    <div className="spotify-card">
      <div className="spotify-header">
        <i className="bi bi-spotify text-success"></i>
        <span className="spotify-badge">PREVIEW</span>
        <button 
          className="spotify-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          <i className={`bi bi-chevron-${collapsed ? 'down' : 'up'}`}></i>
        </button>
      </div>
      
      {!collapsed && (
        <iframe 
          src={embedUrl}
          width="100%" 
          height="152" 
          frameBorder="0" 
          allow="encrypted-media"
          title={`Preview de ${albumTitle}`}
          className="spotify-player"
        ></iframe>
      )}
    </div>
  );
};

export default SpotifyPreviewCard;