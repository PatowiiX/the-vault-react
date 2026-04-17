// src/services/api.js

//  Usar variable de entorno
const API_URL = process.env.REACT_APP_API_URL;

// 📦 SERVICIO DE DISCOS
export const discosService = {
  // Obtener todos los discos
  getAll: async () => {
    try {
      console.log("🔄 Cargando discos desde:", `${API_URL}/discos`);
      const response = await fetch(`${API_URL}/discos`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ Discos cargados:", data.discos?.length || 0);
      
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
      console.error('❌ Error cargando discos:', error);
      return [];
    }
  },
  
  // Obtener un disco por ID
  getById: async (id) => {
    try {
      console.log("🔄 Cargando disco ID:", id);
      const response = await fetch(`${API_URL}/discos/${id}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.disco) {
        console.log("❌ Disco no encontrado");
        return null;
      }
      
      const disco = data.disco;
      console.log("✅ Disco cargado:", disco.titulo);
      
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
      console.error('❌ Error cargando disco:', error);
      return null;
    }
  },
  
  // Crear nuevo disco (admin)
  create: async (productData, admin = true) => {
    try {
      const response = await fetch(`${API_URL}/discos?admin=${admin}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error creando disco:', error);
      return { ok: false, error: error.message };
    }
  },
  
  // Actualizar disco (admin)
  update: async (id, productData, admin = true) => {
    try {
      const response = await fetch(`${API_URL}/discos/${id}?admin=${admin}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error actualizando disco:', error);
      return { ok: false, error: error.message };
    }
  },
  
  // Eliminar disco (admin)
  delete: async (id, admin = true) => {
    try {
      const response = await fetch(`${API_URL}/discos/${id}?admin=${admin}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error eliminando disco:', error);
      return { ok: false, error: error.message };
    }
  }
};

// 📦 SERVICIO DE ÓRDENES
export const ordenesService = {
  // Obtener todas las órdenes (solo admin)
  getAll: async (admin = true) => {
    try {
      console.log("🔄 Cargando órdenes desde:", `${API_URL}/ordenes?admin=${admin}`);
      const response = await fetch(`${API_URL}/ordenes?admin=${admin}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ Órdenes cargadas:", data.ordenes?.length || 0);
      
      const ordenes = (data.ordenes || []).map(orden => ({
        ...orden,
        items: typeof orden.orden_items === 'string' 
          ? JSON.parse(orden.orden_items) 
          : (orden.orden_items || []),
        fecha: orden.created_at || orden.fecha
      }));
      
      return ordenes;
    } catch (error) {
      console.error('❌ Error cargando órdenes:', error);
      return [];
    }
  },
  
  // Obtener órdenes de un usuario específico
  getByUser: async (usuarioId) => {
    try {
      const response = await fetch(`${API_URL}/ordenes/usuario/${usuarioId}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      return data.ordenes || [];
    } catch (error) {
      console.error('❌ Error cargando órdenes del usuario:', error);
      return [];
    }
  },
  
  // Actualizar estado de una orden (admin)
  updateStatus: async (orderId, newStatus, admin = true) => {
    try {
      console.log(`🔄 Actualizando orden ${orderId} a estado: ${newStatus}`);
      
      const response = await fetch(`${API_URL}/ordenes/${orderId}/estado?admin=${admin}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        console.log("✅ Estado actualizado correctamente");
      } else {
        console.log("❌ Error actualizando:", data.error);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error actualizando orden:', error);
      return { ok: false, error: error.message };
    }
  },
  
  // Obtener una orden por ID (con detalles)
  getById: async (orderId) => {
    try {
      const response = await fetch(`${API_URL}/ordenes/${orderId}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.orden) {
        data.orden.items = typeof data.orden.orden_items === 'string'
          ? JSON.parse(data.orden.orden_items)
          : (data.orden.orden_items || []);
      }
      
      return data.orden || null;
    } catch (error) {
      console.error('❌ Error cargando orden:', error);
      return null;
    }
  }
};

// 📦 SERVICIO DE USUARIOS
export const usuariosService = {
  // Login
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error en login:', error);
      return { ok: false, error: error.message };
    }
  },
  
  // Registro
  register: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/usuarios/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error en registro:', error);
      return { ok: false, error: error.message };
    }
  }
};

// Exportar todos los servicios
export default {
  discos: discosService,
  ordenes: ordenesService,
  usuarios: usuariosService
};