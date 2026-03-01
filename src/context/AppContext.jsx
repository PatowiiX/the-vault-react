import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { discosService } from '../services/api';

const AppContext = createContext();

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
  const [topDestacados, setTopDestacados] = useState([]);

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

  // ✅ REFRESH PRODUCTOS MEJORADO - ACTUALIZA TODO
  const refreshProducts = useCallback(async () => {
    try {
      console.log("🔄 Refrescando productos desde MySQL...");
      const data = await discosService.getAll();
      setAdminProducts(data);
      
      // Actualizar stock en el carrito
      setCart(prevCart => {
        return prevCart.map(cartItem => {
          const updatedProduct = data.find(p => p.id === cartItem.id);
          if (updatedProduct) {
            return { ...cartItem, stock: updatedProduct.stock };
          }
          return cartItem;
        });
      });
      
      // Disparar evento global para que todos los componentes se actualicen
      window.dispatchEvent(new CustomEvent('productsUpdated', { detail: data }));
      
      return data;
    } catch (error) {
      console.error("❌ Error refrescando productos:", error);
    }
  }, []);

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

  // ✅ ADD TO CART CORREGIDO
  const addToCart = async (product, quantity = 1) => {
    console.log("🔵 addToCart iniciado", { product, quantity });
    
    if (!isLoggedIn) {
      alert('⚠️ Debes iniciar sesión');
      return { success: false, message: "Debes iniciar sesión" };
    }

    try {
      // Intentar obtener stock de la BD
      let stockReal = product.stock || 0;
      
      try {
        const response = await fetch(`${API_URL}/discos/${product.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.disco) {
            stockReal = data.disco.stock;
          }
        }
      } catch (error) {
        console.log("⚠️ Usando stock local");
      }

      if (stockReal <= 0) {
        alert(`❌ "${product.title}" está AGOTADO`);
        return { success: false, message: "Producto agotado" };
      }

      const existingItem = cart.find(item => item.id === product.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      
      if (currentQty + quantity > stockReal) {
        alert(`❌ Solo hay ${stockReal - currentQty} disponibles`);
        return { success: false, message: "Stock insuficiente" };
      }

      // Agregar al carrito
      setCart(prev => {
        if (existingItem) {
          return prev.map(item => 
            item.id === product.id 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, { ...product, quantity, stock: stockReal }];
      });

      alert(`✅ "${product.title}" agregado al carrito`);
      return { success: true };
      
    } catch (error) {
      console.error("Error:", error);
      alert('❌ Error al agregar');
      return { success: false };
    }
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

  const clearCart = () => {
    setCart([]);
  };

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

  const saveCheckoutData = useCallback((data) => {
    console.log("💾 Guardando datos del checkout:", data);
    setCheckoutData(data);
    sessionStorage.setItem('pendingCheckout', JSON.stringify(data));
  }, []);

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

  // ✅ CREATE PAYPAL ORDER
  const createPayPalOrder = useCallback(async (orderData) => {
    try {
      const payload = {
        cart: cart,
        subtotal: calculateCartTotal(),
        tax: calculateCartTax(),
        shipping: calculateCartShipping(),
        total: calculateCartGrandTotal(),
        shippingAddress: orderData.shippingAddress,
        usuario_id: currentUser?.id
      };

      console.log("📤 Enviando a create-order:", payload);

      const response = await fetch(`${API_URL}/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ El servidor no devolvió JSON:', text.substring(0, 500));
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}. Verifica que el backend esté corriendo.`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: ${data.message || 'Error desconocido'}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log("✅ Orden de PayPal creada:", data);
      return data;

    } catch (error) {
      console.error('❌ Error creating PayPal order:', error);
      throw error;
    }
  }, [cart, currentUser, calculateCartTotal, calculateCartTax, calculateCartShipping, calculateCartGrandTotal]);

  // ✅ CAPTURE PAYPAL ORDER - CORREGIDO
  const capturePayPalOrder = useCallback(async (orderId, paymentDetails) => {
    try {
      let checkoutInfo = checkoutData;
      
      if (!checkoutInfo || !checkoutInfo.cart || checkoutInfo.cart.length === 0) {
        const savedCheckout = sessionStorage.getItem('pendingCheckout');
        if (savedCheckout) {
          checkoutInfo = JSON.parse(savedCheckout);
          console.log("📦 Recuperando de sessionStorage:", checkoutInfo);
        }
      }

      if (!checkoutInfo || !checkoutInfo.cart || checkoutInfo.cart.length === 0) {
        checkoutInfo = {
          cart: cart,
          subtotal: calculateCartTotal(),
          tax: calculateCartTax(),
          shipping: calculateCartShipping(),
          total: calculateCartGrandTotal()
        };
      }

      // Obtener userId
      let userId = currentUser?.id;
      if (!userId) {
        const savedUser = localStorage.getItem('retrosound_user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          userId = user.id;
        }
      }

      if (!userId) {
        throw new Error('ID de usuario requerido');
      }

      const payload = {
        orderId: orderId,
        usuario_id: userId,
        cart: checkoutInfo.cart,
        total: checkoutInfo.total,
        subtotal: checkoutInfo.subtotal,
        tax: checkoutInfo.tax,
        shipping: checkoutInfo.shipping
      };

      console.log("📤 Enviando a capture-order:", payload);

      const response = await fetch(`${API_URL}/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ El servidor no devolvió JSON:', text.substring(0, 500));
        throw new Error('Error de comunicación con el servidor');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }

      if (!data.ok) {
        throw new Error(data.error || 'Error al procesar el pago');
      }

      console.log("✅ Pago capturado exitosamente:", data);

      clearCart();
      setCheckoutData(null);
      sessionStorage.removeItem('pendingCheckout');
      
      // ✅ FORZAR REFRESH DE PRODUCTOS
      await refreshProducts();
      
      // ✅ FORZAR RECARGA DE PÁGINA PARA ACTUALIZAR TODO
      setTimeout(() => {
        window.location.reload();
      }, 1000);

      return data;

    } catch (error) {
      console.error('❌ Error en capturePayPalOrder:', error);
      throw error;
    }
  }, [currentUser, cart, checkoutData, calculateCartTotal, calculateCartTax, calculateCartShipping, calculateCartGrandTotal, clearCart, refreshProducts]);

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

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        currentUser,
        cart,
        adminProducts,
        isAdmin,
        loading,
        orders,
        checkoutData,
        topDestacados,
        login,
        logout,
        register,
        addProduct,
        updateProduct,
        deleteProduct,
        refreshProducts,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        calculateCartTotal,
        calculateCartTax,
        calculateCartShipping,
        calculateCartGrandTotal,
        calculateCartCount,
        fetchOrders,
        updateOrderStatus,
        saveCheckoutData,
        fetchTopDestacados,
        processPayment,
        createPayPalOrder,
        capturePayPalOrder,
        verifyProductStock
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);