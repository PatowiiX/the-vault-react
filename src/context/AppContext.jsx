import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { discosService } from '../services/api';

const AppContext = createContext();

// URL base del backend
const API_URL = 'http://localhost:3001/api';

export const AppProvider = ({ children }) => {
  const [adminProducts, setAdminProducts] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [checkoutData, setCheckoutData] = useState(null);
  const [topDestacados, setTopDestacados] = useState([]); // 👈 NUEVO

  // ===== EFECTOS =====
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const data = await discosService.getAll();
        setAdminProducts(data);
        
        const savedUser = localStorage.getItem('retrosound_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setIsLoggedIn(true);
          setCurrentUser(user);
          setIsAdmin(user.isAdmin || false);
        }
        
        const savedCart = localStorage.getItem('retrosound_cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    localStorage.setItem('retrosound_cart', JSON.stringify(cart));
  }, [cart]);

  // ===== FUNCIÓN PARA REFRESCAR PRODUCTOS - MEJORADA =====
  const refreshProducts = useCallback(async () => {
    try {
      console.log("🔄 Refrescando productos desde backend...");
      const data = await discosService.getAll();
      
      // VERIFICAR que los datos tienen el campo 'top' correctamente mapeado
      console.log("📊 Datos recibidos:", data.map(p => ({ 
        id: p.id, 
        title: p.title, 
        top: p.top, 
        featured: p.featured 
      })));
      
      setAdminProducts(data);
      console.log("✅ Productos actualizados:", data.length);
      
      // 👉 NUEVO: Disparar evento personalizado para que Home se entere
      window.dispatchEvent(new Event('productsUpdated'));
      
      return data;
    } catch (error) {
      console.error("❌ Error refrescando productos:", error);
    }
  }, []);

  // ===== NUEVA FUNCIÓN PARA TOP DESTACADOS =====
  const fetchTopDestacados = useCallback(async () => {
    try {
      console.log("🎵 Cargando top 5 destacados...");
      // Esta función la puedes implementar después si quieres
      // un endpoint específico para top 5
      const destacados = adminProducts.filter(p => p.top === 1 || p.featured === true);
      setTopDestacados(destacados.slice(0, 5));
      return destacados.slice(0, 5);
    } catch (error) {
      console.error("❌ Error cargando top 5:", error);
      return [];
    }
  }, [adminProducts]);

  // ===== FUNCIONES DE AUTENTICACIÓN =====
  const login = async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.ok) {
        const user = data.user;
        setIsLoggedIn(true);
        setCurrentUser(user);
        setIsAdmin(user.isAdmin);
        localStorage.setItem('retrosound_user', JSON.stringify(user));
        return { success: true, message: `Bienvenido ${user.username}!` };
      } else {
        return { success: false, message: data.error || "Credenciales incorrectas" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Error de conexión con el servidor" };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_URL}/usuarios/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          nombre: userData.name || userData.username
        })
      });

      const data = await response.json();

      if (data.ok) {
        return { success: true, message: "Cuenta creada! Ahora inicia sesión." };
      } else {
        return { success: false, message: data.error || "Error al registrar" };
      }
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, message: "Error de conexión con el servidor" };
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentUser(null);
    setCart([]);
    localStorage.removeItem('retrosound_user');
    localStorage.removeItem('retrosound_cart');
    return { success: true };
  };

  // ===== FUNCIONES DE PRODUCTOS =====
  const addProduct = async (productData) => {
    try {
      const datosParaDB = {
        titulo: productData.title,
        artista: productData.artist,
        genero: productData.genre,
        formato: productData.format,
        imagen_path: productData.image,
        anio: productData.year,
        descripcion: productData.description,
        top: productData.featured ? 1 : 0,
        precio: productData.price || 25.00,
        stock: productData.stock || 10,
        heritage: productData.heritage ? 1 : 0,
        tracks: productData.tracks || 10,
        duration: productData.duration || '45:00',
        sku: productData.sku || `VAULT-${Date.now()}`,
        edition: productData.edition || null,
        admin: true
      };

      const response = await fetch(`${API_URL}/discos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParaDB), 
      });

      const data = await response.json();

      if (data.ok) {
        await refreshProducts();
        return { success: true };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error("Error en POST:", error);
      return { success: false, message: "Error de conexión" };
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const datosParaDB = {
        titulo: productData.title,
        artista: productData.artist,
        genero: productData.genre,
        formato: productData.format,
        imagen_path: productData.image,
        anio: productData.year,
        descripcion: productData.description,
        top: productData.featured ? 1 : 0,
        precio: productData.price || 25.00,
        stock: productData.stock || 10,
        heritage: productData.heritage ? 1 : 0,
        tracks: productData.tracks || 10,
        duration: productData.duration || '45:00',
        sku: productData.sku || `VAULT-${id}`,
        edition: productData.edition || null,
        admin: true
      };

      const response = await fetch(`${API_URL}/discos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParaDB), 
      });

      const data = await response.json();

      if (data.ok) {
        await refreshProducts();
        return { success: true };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error("Error en PUT:", error);
      return { success: false, message: "Error de conexión" };
    }
  };

  const deleteProduct = async (id) => {
    if(!window.confirm("¿Borrar disco?")) return;
    try {
      const response = await fetch(`${API_URL}/discos/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin: true })
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setAdminProducts(prev => prev.filter(p => p.id !== id));
        await refreshProducts(); // ASEGURAR REFRESH
        return { success: true };
      } else {
        return { success: false, message: data.error };
      }
    } catch (e) { 
      console.error(e); 
      return { success: false, message: "Error de conexión" };
    }
  };

  // ===== FUNCIONES DEL CARRITO =====
  const addToCart = (product, quantity = 1) => {
    if (!isLoggedIn) {
      return { success: false, message: "Debes iniciar sesión" };
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    
    return { success: true };
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prev => 
      prev.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Cálculos del carrito
  const calculateCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const calculateCartTax = useCallback(() => {
    const subtotal = calculateCartTotal();
    return subtotal * 0.16;
  }, [calculateCartTotal]);

  const calculateCartShipping = useCallback(() => {
    const subtotal = calculateCartTotal();
    if (subtotal === 0) return 0;
    if (subtotal > 1000) return 0;
    return 99;
  }, [calculateCartTotal]);

  const calculateCartGrandTotal = useCallback(() => {
    return calculateCartTotal() + calculateCartTax() + calculateCartShipping();
  }, [calculateCartTotal, calculateCartTax, calculateCartShipping]);

  const calculateCartCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  // ===== FUNCIONES DE PEDIDOS =====
  const fetchOrders = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      const response = await fetch(`${API_URL}/ordenes?admin=true`);
      const data = await response.json();
      if (data.ok) {
        setOrders(data.ordenes || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }, [isAdmin]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    if (!isAdmin) return;
    
    try {
      const response = await fetch(`${API_URL}/ordenes/${orderId}/estado?admin=true`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus })
      });
      
      const data = await response.json();
      if (data.ok) {
        await fetchOrders();
        return { success: true };
      }
    } catch (error) {
      console.error('Error updating order:', error);
      return { success: false };
    }
  }, [isAdmin, fetchOrders]);

  // ===== FUNCIÓN PARA GUARDAR DATOS DEL CHECKOUT =====
  const saveCheckoutData = useCallback((data) => {
    console.log("💾 Guardando datos del checkout:", data);
    setCheckoutData(data);
  }, []);

  // ===== FUNCIONES DE PAGO =====
  const processPayment = useCallback(async (paymentDetails) => {
    try {
      const response = await fetch(`${API_URL}/ordenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: currentUser?.id,
          items: cart,
          subtotal: calculateCartTotal(),
          tax: calculateCartTax(),
          shipping: calculateCartShipping(),
          total: calculateCartGrandTotal(),
          direccion_envio: paymentDetails.shippingAddress,
          metodo_pago: paymentDetails.method
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        clearCart();
        return { 
          success: true, 
          orderId: data.orden_id,
          trackingNumber: data.tracking_number,
          total: calculateCartGrandTotal()
        };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error('Error en processPayment:', error);
      return { success: false, message: 'Error al procesar el pago' };
    }
  }, [cart, currentUser, calculateCartTotal, calculateCartTax, calculateCartShipping, calculateCartGrandTotal, clearCart]);

  const createPayPalOrder = useCallback(async (orderData) => {
    try {
      const response = await fetch(`${API_URL}/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: cart,
          subtotal: calculateCartTotal(),
          tax: calculateCartTax(),
          shipping: calculateCartShipping(),
          total: calculateCartGrandTotal(),
          shippingAddress: orderData.shippingAddress,
          usuario_id: currentUser?.id
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      throw error;
    }
  }, [cart, currentUser, calculateCartTotal, calculateCartTax, calculateCartShipping, calculateCartGrandTotal]);

  // ===== CAPTURE PAYPAL ORDER =====
  const capturePayPalOrder = useCallback(async (orderId, paymentDetails) => {
    try {
      const datosParaEnviar = {
        orderId,
        paymentDetails,
        usuario_id: currentUser?.id,
        cart: checkoutData?.cart || cart,
        shippingAddress: checkoutData?.shippingAddress || paymentDetails?.shippingAddress || {},
        total: checkoutData?.total || calculateCartGrandTotal(),
        subtotal: checkoutData?.subtotal || calculateCartTotal(),
        tax: checkoutData?.tax || calculateCartTax(),
        shipping: checkoutData?.shipping || calculateCartShipping()
      };

      console.log("=".repeat(50));
      console.log("🔥 ENVIANDO A CAPTURE-ORDER:");
      console.log("📦 Cart items:", datosParaEnviar.cart?.length || 0);
      console.log("=".repeat(50));

      const response = await fetch(`${API_URL}/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParaEnviar)
      });

      const data = await response.json();
      console.log("✅ Respuesta del backend:", data);
      
      if (data.ok) {
        clearCart();
        setCheckoutData(null);
        await refreshProducts(); // ACTUALIZAR STOCK EN FRONTEND
        return data;
      } else {
        throw new Error(data.error || 'Error al procesar el pago');
      }
    } catch (error) {
      console.error('❌ Error en capturePayPalOrder:', error);
      throw error;
    }
  }, [currentUser, cart, checkoutData, calculateCartTotal, calculateCartTax, calculateCartShipping, calculateCartGrandTotal, clearCart, refreshProducts]);

  // ===== RETURN DEL PROVIDER =====
  return (
    <AppContext.Provider
      value={{
        // Estados
        isLoggedIn,
        currentUser,
        cart,
        adminProducts,
        isAdmin,
        loading,
        orders,
        checkoutData,
        topDestacados, // NUEVO
        
        // Auth
        login,
        logout,
        register,
        
        // Productos
        addProduct,
        updateProduct,
        deleteProduct,
        refreshProducts,
        
        // Carrito
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        
        // Cálculos
        calculateCartTotal,
        calculateCartTax,
        calculateCartShipping,
        calculateCartGrandTotal,
        calculateCartCount,
        
        // Pedidos
        fetchOrders,
        updateOrderStatus,
        
        // Checkout
        saveCheckoutData,
        fetchTopDestacados, // 👈 NUEVO
        
        // Pago
        processPayment,
        createPayPalOrder,
        capturePayPalOrder
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);