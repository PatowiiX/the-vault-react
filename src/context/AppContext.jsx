import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { discosService } from '../services/api';

const AppContext = createContext();

// URL base del backend
const API_URL = process.env.REACT_APP_API_URL;
const API_BASE_URL = API_URL?.replace(/\/api\/?$/, '') || '';

const buildAssetUrl = (assetPath) => {
  if (!assetPath) return null;
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  return `${API_BASE_URL}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`;
};

const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    avatar: buildAssetUrl(user.avatar),
    isAdmin: user.isAdmin || user.rol === 'admin'
  };
};

export const AppProvider = ({ children }) => {
  const [adminProducts, setAdminProducts] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [checkoutData, setCheckoutData] = useState(null);
  const [topDestacados, setTopDestacados] = useState([]);

  // ===== EFECTOS =====
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const data = await discosService.getAll();
        setAdminProducts(data);
        
        const savedUser = localStorage.getItem('retrosound_user');
        if (savedUser) {
          const user = normalizeUser(JSON.parse(savedUser));
          setIsLoggedIn(true);
          setCurrentUser(user);
          setIsAdmin(user.isAdmin);
          localStorage.setItem('retrosound_user', JSON.stringify(user));
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

  // ===== REFRESCAR PRODUCTOS =====
  const refreshProducts = useCallback(async () => {
    try {
      console.log("🔄 Refrescando productos desde backend...");
      const data = await discosService.getAll();
      setAdminProducts(data);
      window.dispatchEvent(new CustomEvent('productsUpdated', { detail: data }));
      return data;
    } catch (error) {
      console.error("❌ Error refrescando productos:", error);
    }
  }, []);

  // ===== TOP DESTACADOS =====
  const fetchTopDestacados = useCallback(async () => {
    try {
      const destacados = adminProducts.filter(p => p.top === 1 || p.featured === true);
      setTopDestacados(destacados.slice(0, 5));
      return destacados.slice(0, 5);
    } catch (error) {
      console.error("❌ Error cargando top 5:", error);
      return [];
    }
  }, [adminProducts]);

  // ===== AUTENTICACIÓN =====
  const login = async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.ok) {
        const user = normalizeUser(data.user);
        setIsLoggedIn(true);
        setCurrentUser(user);
        setIsAdmin(user.isAdmin);
        localStorage.setItem('retrosound_user', JSON.stringify(user));
        return { success: true, message: `Bienvenido ${user.username || user.nombre}!` };
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

  // ===== FUNCIONES DE PRODUCTOS (ADMIN) =====
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
        stock: productData.stock !== undefined ? productData.stock : 10,  // ✅ CORREGIDO
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
        stock: productData.stock !== undefined ? productData.stock : 10,  // ✅ CORREGIDO
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
        await refreshProducts();
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

    if (product.stock <= 0) {
      return { success: false, message: `"${product.title}" está agotado` };
    }

    if (product.stock < quantity) {
      return { success: false, message: `Solo hay ${product.stock} unidades disponibles de "${product.title}"` };
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        return { success: false, message: `No puedes agregar más de ${product.stock} unidades de "${product.title}"` };
      }
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
    
    return { success: true, message: "Producto agregado al carrito" };
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    const product = cart.find(item => item.id === productId);
    if (product && newQuantity > product.stock) {
      alert(`Solo hay ${product.stock} unidades disponibles de "${product.title}"`);
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

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // ===== CÁLCULOS DEL CARRITO =====
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
    console.log("💾 Guardando datos del checkout en contexto:", data);
    setCheckoutData(data);
    sessionStorage.setItem('pendingCheckout', JSON.stringify(data));
  }, []);

  // ===== FUNCIONES DE PAGO =====
  const processPayment = useCallback(async (paymentDetails) => {
    try {
      const grandTotal = calculateCartGrandTotal();

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
        await refreshProducts();
        return { 
          success: true, 
          orderId: data.orden_id,
          trackingNumber: data.tracking_number,
          total: grandTotal
        };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error('Error en processPayment:', error);
      return { success: false, message: 'Error al procesar el pago' };
    }
  }, [cart, currentUser, calculateCartTotal, calculateCartTax, calculateCartShipping, calculateCartGrandTotal, clearCart, refreshProducts]);

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
      let cartToUse = checkoutData?.cart;
      let subtotalToUse = checkoutData?.subtotal;
      let taxToUse = checkoutData?.tax;
      let shippingToUse = checkoutData?.shipping;
      let totalToUse = checkoutData?.total;
      
      if (!cartToUse || cartToUse.length === 0) {
        const savedCheckout = sessionStorage.getItem('pendingCheckout');
        if (savedCheckout) {
          const savedData = JSON.parse(savedCheckout);
          cartToUse = savedData.cart;
          subtotalToUse = savedData.subtotal;
          taxToUse = savedData.tax;
          shippingToUse = savedData.shipping;
          totalToUse = savedData.total;
        }
      }
      
      if (!cartToUse || cartToUse.length === 0) {
        cartToUse = cart;
        subtotalToUse = calculateCartTotal();
        taxToUse = calculateCartTax();
        shippingToUse = calculateCartShipping();
        totalToUse = calculateCartGrandTotal();
      }

      if (!cartToUse || cartToUse.length === 0) {
        throw new Error("El carrito está vacío");
      }

      const datosParaEnviar = {
        orderId: orderId,
        usuario_id: currentUser?.id,
        cart: cartToUse,
        total: totalToUse,
        subtotal: subtotalToUse,
        tax: taxToUse,
        shipping: shippingToUse,
        shippingAddress: checkoutData?.shippingAddress || paymentDetails?.shippingAddress || {}
      };

      const response = await fetch(`${API_URL}/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosParaEnviar)
      });

      const data = await response.json();
      
      if (data.ok) {
        clearCart();
        setCheckoutData(null);
        sessionStorage.removeItem('pendingCheckout');
        await refreshProducts();
        return data;
      } else {
        throw new Error(data.error || 'Error al procesar el pago');
      }
    } catch (error) {
      console.error('❌ Error en capturePayPalOrder:', error);
      throw error;
    }
  }, [currentUser, cart, checkoutData, calculateCartTotal, calculateCartTax, calculateCartShipping, calculateCartGrandTotal, clearCart, refreshProducts]);

  // ===== NUEVAS FUNCIONES DE USUARIO =====
  const updateUserProfile = useCallback(async (userData) => {
    try {
      const formData = new FormData();
      formData.append('nombre', userData.nombre);
      formData.append('email', userData.email);
      if (userData.avatar) {
        formData.append('avatar', userData.avatar);
      }

      const response = await fetch(`${API_URL}/usuarios/${currentUser?.id}/perfil`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.ok) {
        const updatedUser = normalizeUser({ ...currentUser, ...data.user });
        setCurrentUser(updatedUser);
        localStorage.setItem('retrosound_user', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      return { success: false, message: 'Error de conexión' };
    }
  }, [currentUser]);

  const fetchUserOrders = useCallback(async () => {
    if (!currentUser?.id) return [];
    
    try {
      const response = await fetch(`${API_URL}/ordenes/usuario/${currentUser.id}`);
      const data = await response.json();
      
      if (data.ok) {
        return data.ordenes;
      }
      return [];
    } catch (error) {
      console.error('Error obteniendo pedidos:', error);
      return [];
    }
  }, [currentUser]);

  const fetchPaymentMethods = useCallback(async () => {
    if (!currentUser?.id) return [];
    
    try {
      const response = await fetch(`${API_URL}/usuarios/${currentUser.id}/payment-methods`);
      const data = await response.json();
      
      if (data.ok) {
        return data.methods;
      }
      return [];
    } catch (error) {
      console.error('Error obteniendo métodos de pago:', error);
      return [];
    }
  }, [currentUser]);

  const addPaymentMethod = useCallback(async (paymentData) => {
    try {
      const response = await fetch(`${API_URL}/usuarios/${currentUser?.id}/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error agregando método de pago:', error);
      return { success: false };
    }
  }, [currentUser]);

  const deletePaymentMethod = useCallback(async (methodId) => {
    try {
      const response = await fetch(`${API_URL}/usuarios/${currentUser?.id}/payment-methods/${methodId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error eliminando método de pago:', error);
      return { success: false };
    }
  }, [currentUser]);

  const verifyProductStock = useCallback(async (productId) => {
    try {
      const response = await fetch(`${API_URL}/discos/${productId}`);
      const data = await response.json();
      if (data.ok && data.disco) {
        return data.disco.stock;
      }
      return 0;
    } catch (error) {
      console.error("Error verificando stock:", error);
      return 0;
    }
  }, []);

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
        topDestacados,
        
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
        fetchTopDestacados,
        
        // Pago
        processPayment,
        createPayPalOrder,
        capturePayPalOrder,
        
        // Utilidades
        verifyProductStock,
        
        // NUEVAS FUNCIONES DE USUARIO
        updateUserProfile,
        fetchUserOrders,
        fetchPaymentMethods,
        addPaymentMethod,
        deletePaymentMethod
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
