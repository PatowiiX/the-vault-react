const express = require("express");
const router = express.Router();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let accessToken = null;
let tokenExpiration = 0;

async function getSpotifyToken() {
  if (accessToken && Date.now() < tokenExpiration) {
    return accessToken;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("❌ Faltan credenciales de Spotify");
    return null;
  }

  try {
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Error Spotify:", data);
      return null;
    }
    
    accessToken = data.access_token;
    tokenExpiration = Date.now() + (data.expires_in * 1000);
    
    console.log("✅ Token Spotify obtenido:", accessToken.substring(0, 20) + "...");
    return accessToken;
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    return null;
  }
}

router.get("/preview", async (req, res) => {
  const { query, artist } = req.query;
  
  console.log(`🎵 Buscando: ${query} - ${artist}`);
  
  if (!query) {
    return res.json({ success: false, found: false, embedUrl: null });
  }
  
  const token = await getSpotifyToken();
  
  if (!token) {
    const searchTerm = encodeURIComponent(artist ? `${query} ${artist}` : query);
    return res.json({
      success: true,
      found: false,
      embedUrl: `https://open.spotify.com/search/${searchTerm}`,
      isSearch: true
    });
  }
  
  try {
    const searchQuery = artist ? `${query} ${artist}` : query;
    
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=album&limit=3&market=MX`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    const data = await response.json();
    const albums = data.albums?.items || [];
    
    console.log(`📦 Encontrados ${albums.length} resultados`);
    
    if (albums.length > 0) {
      const bestMatch = albums[0];
      console.log(`✅ Match: ${bestMatch.name} - ${bestMatch.id}`);
      
      return res.json({
        success: true,
        found: true,
        spotifyId: bestMatch.id,
        embedUrl: `https://open.spotify.com/embed/album/${bestMatch.id}`,
        albumName: bestMatch.name
      });
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
  
  const searchTerm = encodeURIComponent(artist ? `${query} ${artist}` : query);
  res.json({
    success: true,
    found: false,
    embedUrl: `https://open.spotify.com/search/${searchTerm}`,
    isSearch: true
  });
});

module.exports = router;