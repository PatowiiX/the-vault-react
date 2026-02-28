// src/services/api.js
const API_URL = 'http://localhost:3001/api';//Correccion hecha de la direccion de enrutamiento, revisen las otras funciones para evitar errores//

export const discosService = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/discos`);
      const data = await response.json();
      
      return (data.discos || []).map(disco => ({
        id: disco.id,
        title: disco.titulo,
        artist: disco.artista,
        year: disco.anio,
        genre: disco.genero,
        format: disco.formato,
        image: disco.imagen_path,
        description: disco.descripcion,
        price: parseFloat(disco.precio) || 25.00,
        stock: disco.stock || 10,
        featured: disco.top === 1,
        heritage: disco.heritage === 1,
        tracks: disco.tracks || 10,
        duration: disco.duration || '45:00',
        sku: disco.sku || `VAULT-${disco.id}`,
        edition: disco.edition
      }));
    } catch (error) {
      console.error('Error cargando discos:', error);
      return [];
    }
  },
  
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/discos/${id}`);
      const data = await response.json();
      if (!data.disco) return null;
      
      const disco = data.disco;
      return {
        id: disco.id,
        title: disco.titulo,
        artist: disco.artista,
        year: disco.anio,
        genre: disco.genero,
        format: disco.formato,
        image: disco.imagen_path,
        description: disco.descripcion,
        price: parseFloat(disco.precio) || 25.00,
        stock: disco.stock || 10,
        featured: disco.top === 1,
        heritage: disco.heritage === 1,
        tracks: disco.tracks || 10,
        duration: disco.duration || '45:00',
        sku: disco.sku || `VAULT-${disco.id}`,
        edition: disco.edition
      };
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }
};