// Servicio para conectar con el backend mas adelante, lo dejo para la entrega final
const API_URL = 'http://localhost:3000/api';

export const discosService = {
  // Obtener todos los discos
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/discos`);
      const data = await response.json();
      return data.discos || [];
    } catch (error) {
      console.error('Error fetching discos:', error);
      return [];
    }
  },

  // Obtener discos destacados
  getTop: async () => {
    try {
      const response = await fetch(`${API_URL}/discos`);
      const data = await response.json();
      const discos = data.discos || [];
      return discos.filter(disco => disco.top === 1).slice(0, 5);
    } catch (error) {
      console.error('Error fetching top discos:', error);
      return [];
    }
  },

  // Obtener discos por género
  getByGenre: async (genre) => {
    try {
      const response = await fetch(`${API_URL}/discos`);
      const data = await response.json();
      const discos = data.discos || [];
      return discos.filter(disco => disco.genero === genre);
    } catch (error) {
      console.error('Error fetching discos by genre:', error);
      return [];
    }
  }
};