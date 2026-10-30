import { useState, useEffect, useRef } from 'react';

const optimizeCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (url.includes('/upload/f_auto,q_auto/')) return url;
    return url.replace('/upload/', '/upload/f_auto,q_auto/');
  }
  return url;
};

function App() {
  // Application State
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Navigation & Filter States
  const [currentCategory, setCurrentCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Modals & Views
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('yumar_viewMode') || 'shop';
  });
  const [detailQuantity, setDetailQuantity] = useState(1);

  // Reclamaciones Form State
  const [reclamo, setReclamo] = useState({
    nombre: '', tipoDoc: 'DNI', numDoc: '', direccion: '', departamento: '',
    provincia: '', distrito: '', telefono: '', telefonoFijo: '', correo: '',
    tipoBien: 'Producto', monto: '', descripcion: '',
    tipoReclamo: 'Queja', motivo: '', privacidad: false
  });
  const [reclamoEnviado, setReclamoEnviado] = useState(false);
  
  // Cart State (stored in localStorage)
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('yumar_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Admin Form State
  const [adminForm, setAdminForm] = useState({
    id: null,
    nombre: '',
    precio: '',
    imagen: '',
    categoria: 'Tecnología',
    descripcion: '',
    badge: 'NUEVO INGRESO',
    stock: 0
  });
  const [adminTab, setAdminTab] = useState(() => {
    return localStorage.getItem('yumar_adminTab') || 'analitica';
  });
  const [reclamosList, setReclamosList] = useState([]);
  const [pedidosList, setPedidosList] = useState([]);
  const [resenasList, setResenasList] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Login State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('yumar_adminAuth') === 'true';
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });


  // Checkout State
  const [checkoutForm, setCheckoutForm] = useState({ 
    nombre: '', 
    apellidos: '',
    tipoDoc: 'DNI',
    numDoc: '',
    telefono: '', 
    correo: '', 
    tipoEntrega: 'tienda', // only 'tienda'
    departamento: 'Lima Metropolitana',
    distrito: '',
    direccion: 'Santa Ana',
    metodoPago: 'yape_plin'
  });
  const [completedOrder, setCompletedOrder] = useState(null);
  
  // Reseñas State
  const [productResenas, setProductResenas] = useState([]);
  const [resenaForm, setResenaForm] = useState({ autor: '', calificacion: 5, comentario: '' });
  
  // Toast Alert State
  const [toast, setToast] = useState({ show: false, message: '' });

  // Admin Search & Filter State
  const [adminProductSearch, setAdminProductSearch] = useState('');
  const [adminOrderSearch, setAdminOrderSearch] = useState('');
  const [orderSourceFilter, setOrderSourceFilter] = useState('todos'); // 'todos', 'web', 'pos'

  // POS (Point of Sale) State
  const [posCart, setPosCart] = useState([]);
  const [posClient, setPosClient] = useState('Venta Mostrador');
  const [posPhone, setPosPhone] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState('Efectivo');
  const [posCashReceived, setPosCashReceived] = useState('');
  const [posDiscount, setPosDiscount] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [posCategory, setPosCategory] = useState('Todos');
  const [posActiveVoucher, setPosActiveVoucher] = useState(null);



  // Cloudinary upload state
  const [imageUploading, setImageUploading] = useState(false);

  // Categories State
  const [categoriesList, setCategoriesList] = useState(['Todos', 'Tecnología', 'Hogar', 'Belleza']);

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroBanners = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80",
      tagline: "Yumar Importaciones",
      title: "Descubre\nNuevas Ofertas",
      subtitle: "Encuentra tecnología, hogar y más con los mejores precios del mercado.",
      buttonText: "Comprar Ahora"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1555529771-835f59fc5efe?w=1200&q=80",
      tagline: "Temporada de Descuentos",
      title: "Lo Mejor\nPara tu Hogar",
      subtitle: "Renueva tu espacio con nuestros increíbles productos para el hogar.",
      buttonText: "Ver Catálogo"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80",
      tagline: "Tecnología y Gadgets",
      title: "Accesorios\nPremium",
      subtitle: "Lo último en gadgets y tecnología para tu día a día.",
      buttonText: "Explorar Tecnología"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  // WhatsApp Config
  const WHATSAPP_NUMBER = "+51967227469"; // Customizable contact phone number for Yumar Importaciones
  const YAPE_NUMBER = "967227469";
  const YAPE_NAME = "Yuly Quiroz Romero";

  // Save cart & admin state to local storage
  useEffect(() => {
    localStorage.setItem('yumar_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('yumar_viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('yumar_adminAuth', isAdminAuthenticated ? 'true' : 'false');
  }, [isAdminAuthenticated]);

  useEffect(() => {
    localStorage.setItem('yumar_adminTab', adminTab);
  }, [adminTab]);

  // URL Hash Routing: mantiene la pestaña fija al recargar (ej. #analitica, #pos, #pedidos)
  useEffect(() => {
    const handleHash = () => {
      const hash = (window.location.hash || '').replace('#', '');
      if (['admin', 'analitica', 'pos', 'pedidos', 'productos', 'reclamos', 'resenas', 'categorias'].includes(hash)) {
        setViewMode('admin');
        if (hash !== 'admin') setAdminTab(hash);
      } else if (hash === 'reclamaciones') {
        setViewMode('reclamaciones');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    if (viewMode === 'admin' && isAdminAuthenticated) {
      if (window.location.hash !== `#${adminTab}`) {
        window.history.replaceState(null, '', `#${adminTab}`);
      }
    }
  }, [viewMode, adminTab, isAdminAuthenticated]);


  // Fetch products from API on filter change
  const fetchProducts = async (cat = currentCategory, search = appliedSearch) => {
    setLoading(true);
    try {
      let url = '/api/productos';
      const params = [];
      if (cat !== 'Todos') {
        params.push(`categoria=${encodeURIComponent(cat)}`);
      }
      if (search) {
        params.push(`q=${encodeURIComponent(search)}`);
      }
      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar productos');
      const data = await res.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const res = await fetch('/api/productos');
      if (res.ok) setAllProducts(await res.json());
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentCategory, appliedSearch]);

  useEffect(() => {
    fetchAllProducts();
  }, []);

  // ── Auto-polling: refresca datos sin recargar la página ──
  // Productos del catálogo: cada 30 segundos (solo en vista tienda)
  useEffect(() => {
    if (viewMode !== 'shop' || selectedProduct) return;
    const interval = setInterval(() => {
      fetchProducts(currentCategory, appliedSearch);
      fetchAllProducts();
    }, 30000);
    return () => clearInterval(interval);
  }, [viewMode, selectedProduct, currentCategory, appliedSearch]);

  // Reseñas del producto abierto: cada 20 segundos
  useEffect(() => {
    if (!selectedProduct) return;
    const interval = setInterval(() => {
      fetchProductResenas(selectedProduct.id);
    }, 20000);
    return () => clearInterval(interval);
  }, [selectedProduct]);

  const fetchReclamosList = async () => {
    try {
      const res = await fetch('/api/reclamos');
      if (res.ok) setReclamosList(await res.json());
    } catch { /* ignore */ }
  };

  const fetchPedidosList = async () => {
    try {
      const res = await fetch('/api/pedidos');
      if (res.ok) setPedidosList(await res.json());
    } catch { /* ignore */ }
  };

  const fetchAdminResenas = async () => {
    try {
      const res = await fetch('/api/resenas');
      if (res.ok) setResenasList(await res.json());
    } catch { /* ignore */ }
  };

  const fetchCategorias = async () => {
    try {
      const res = await fetch('/api/categorias');
      if (res.ok) {
        const data = await res.json();
        const names = data.map(c => c.nombre);
        if (names.length > 0) {
          setCategoriesList(['Todos', ...names]);
        }
      }
    } catch { /* ignore */ }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) setAnalyticsData(await res.json());
    } catch { /* ignore */ }
    finally { setAnalyticsLoading(false); }
  };

  useEffect(() => {
    fetchReclamosList();
    fetchPedidosList();
    fetchAdminResenas();
    fetchCategorias();
  }, []);

  const fetchProductResenas = async (id) => {
    try {
      const res = await fetch(`/api/resenas/producto/${id}`);
      if (res.ok) setProductResenas(await res.json());
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (viewMode === 'admin' && isAdminAuthenticated) {
      if (adminTab === 'productos') {
        fetchProducts();
        fetchAllProducts();
      }
      if (adminTab === 'reclamos') fetchReclamosList();
      if (adminTab === 'pedidos') fetchPedidosList();
      if (adminTab === 'resenas') fetchAdminResenas();
    }
  }, [viewMode, isAdminAuthenticated, adminTab]);

  // Admin panel: refresca los pedidos continuamente para el contador en tiempo real en el menú
  useEffect(() => {
    if (viewMode !== 'admin' || !isAdminAuthenticated) return;
    fetchPedidosList(); // Carga inicial al entrar al panel de administración
    const interval = setInterval(() => {
      fetchPedidosList(); // Siempre refresca pedidos para mantener actualizado el contador del menú
      if (adminTab === 'productos') { fetchProducts(); fetchAllProducts(); }
      if (adminTab === 'reclamos') fetchReclamosList();
      if (adminTab === 'resenas') fetchAdminResenas();
    }, 10000);
    return () => clearInterval(interval);
  }, [viewMode, isAdminAuthenticated, adminTab]);

  // Toast triggers
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2500);
  };

  // Cart Management Actions
  const addToCart = (product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      
      if (currentQty + quantity > (product.stock || 0)) {
        showToast(`Stock insuficiente. Solo hay ${product.stock || 0} unidades.`);
        return prevCart;
      }

      if (existingItem) {
        showToast(`Cantidad actualizada de: ${product.nombre}`);
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      showToast(`Agregado al carrito: ${product.nombre}`);
      return [...prevCart, { ...product, quantity }];
    });
  };

  const updateCartQuantity = (id, change) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + change;
            const productInfo = allProducts.find(p => p.id === id);
            const maxStock = productInfo ? (productInfo.stock || 0) : item.stock || 0;
            if (newQty > maxStock) {
              showToast(`Solo quedan ${maxStock} unidades disponibles.`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id, name) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    showToast(`Eliminado del carrito: ${name}`);
  };

  // Search Submit
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setAppliedSearch(searchQuery);
  };

  const clearFilters = () => {
    setCurrentCategory('Todos');
    setSearchQuery('');
    setAppliedSearch('');
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!checkoutForm.nombre || !checkoutForm.apellidos || !checkoutForm.telefono || !checkoutForm.direccion) {
      showToast("Por favor ingresa todos los campos obligatorios.");
      return;
    }
    
    try {
      const metodoEntregaStr = `Recojo en tienda - Sede: ${checkoutForm.direccion} (${checkoutForm.apellidos}, ${checkoutForm.tipoDoc}: ${checkoutForm.numDoc}, Pago: ${checkoutForm.metodoPago === 'yape_plin' ? 'Yape/Plin' : 'Transferencia'})`;

      // Save order to DB
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: `${checkoutForm.nombre} ${checkoutForm.apellidos}`,
          telefono: checkoutForm.telefono,
          correo: checkoutForm.correo,
          total: cartTotal,
          detalles: cart,
          metodo_entrega: metodoEntregaStr,
          metodo_pago: checkoutForm.metodoPago
        })
      });
      
      const savedOrder = await response.json();
      
      setCompletedOrder({
        ...savedOrder,
        clientName: `${checkoutForm.nombre} ${checkoutForm.apellidos}`,
        docType: checkoutForm.tipoDoc,
        docNum: checkoutForm.numDoc,
        telefono: checkoutForm.telefono,
        correo: checkoutForm.correo,
        deliveryType: 'tienda',
        addressInfo: checkoutForm.direccion,
        paymentMethod: checkoutForm.metodoPago === 'yape_plin' ? 'Yape / Plin' : 'Depósito o Transferencia Bancaria',
        items: cart,
        subtotal: cartTotal
      });
      
      setCart([]);
      setCartOpen(false);
      setViewMode('voucher');
      
      // Refresh inventory & orders so stock and admin order count update locally
      fetchProducts();
      fetchAllProducts();
      fetchPedidosList();
      
      // Update local state instantly so UI is responsive
      const updateStockLocally = (productList) => productList.map(p => {
        const cartItem = cart.find(c => c.id === p.id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, (p.stock || 0) - cartItem.quantity) };
        }
        return p;
      });
      setProducts(prev => updateStockLocally(prev));
      setAllProducts(prev => updateStockLocally(prev));
      if (selectedProduct) {
        const cartItem = cart.find(c => c.id === selectedProduct.id);
        if (cartItem) {
          setSelectedProduct(prev => ({ ...prev, stock: Math.max(0, (prev.stock || 0) - cartItem.quantity) }));
        }
      }

      showToast("Pedido registrado correctamente.");
    } catch (err) {
      showToast("Error al procesar el pedido.");
    }
  };

  // Admin Panel Actions
  const handleAdminFormChange = (e) => {
    const { name, value } = e.target;
    setAdminForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!adminForm.nombre || !adminForm.precio) {
      showToast("Nombre y precio son campos obligatorios");
      return;
    }

    try {
      const isEditing = !!adminForm.id;
      const url = isEditing ? `/api/productos/${adminForm.id}` : '/api/productos';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...adminForm,
          precio: parseFloat(adminForm.precio),
          stock: parseInt(adminForm.stock) || 0
        })
      });

      if (!res.ok) throw new Error('Error al guardar producto');
      
      const savedProduct = await res.json();
      
      if (isEditing) {
        setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p));
        showToast(`Producto actualizado: ${savedProduct.nombre}`);
      } else {
        setProducts(prev => [savedProduct, ...prev]);
        showToast(`Producto agregado: ${savedProduct.nombre}`);
      }
      
      fetchAllProducts();
      
      // Reset form
      setAdminForm({
        id: null,
        nombre: '',
        precio: '',
        imagen: '',
        categoria: 'Tecnología',
        descripcion: '',
        badge: 'NUEVO INGRESO',
        stock: 0
      });
    } catch (err) {
      console.error(err);
      showToast("Hubo un error al guardar. Por favor, intenta de nuevo.");
    }
  };

  const handleEditProduct = (product) => {
    setAdminForm({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      imagen: product.imagen || '',
      categoria: product.categoria || 'Tecnología',
      descripcion: product.descripcion || '',
      badge: product.badge || '',
      stock: product.stock || 0
    });
    setAdminTab('productos');
    setTimeout(() => {
      document.getElementById('admin-form-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      showToast('Error: configura VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en .env');
      return;
    }

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) throw new Error('Error al subir a Cloudinary');

      const data = await response.json();
      // Store the optimized Cloudinary URL
      setAdminForm(prev => ({ ...prev, imagen: data.secure_url }));
      showToast('✅ Imagen subida a Cloudinary correctamente');
    } catch (err) {
      console.error(err);
      showToast('❌ Error al subir imagen. Revisa tu preset de Cloudinary.');
    } finally {
      setImageUploading(false);
    }
  };

  const updateStockQuickly = async (id, newStock) => {
    if (newStock < 0) return;
    try {
      const res = await fetch(`/api/productos/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });
      if (!res.ok) throw new Error('Error al actualizar stock');
      
      const updatedProduct = await res.json();
      
      const updateProductList = (list) => list.map(p => p.id === id ? updatedProduct : p);
      setProducts(prev => updateProductList(prev));
      setAllProducts(prev => updateProductList(prev));
      if (selectedProduct && selectedProduct.id === id) {
        setSelectedProduct(updatedProduct);
      }
      
      showToast(`Stock actualizado a ${newStock}`);
    } catch (err) {
      console.error(err);
      showToast("Error al actualizar el stock en el servidor");
    }
  };

  // POS Cart Actions
  const addToPosCart = (product) => {
    const maxStock = product.stock || 0;
    if (maxStock <= 0) {
      showToast("Producto agotado. No se puede vender.");
      return;
    }
    
    setPosCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      
      if (currentQty + 1 > maxStock) {
        showToast(`Stock insuficiente. Solo quedan ${maxStock} unidades.`);
        return prevCart;
      }
      
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      showToast(`Agregado a la venta: ${product.nombre}`);
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updatePosCartQuantity = (id, change) => {
    const productInfo = allProducts.find(p => p.id === id);
    const maxStock = productInfo ? (productInfo.stock || 0) : 0;
    
    setPosCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + change;
            if (newQty > maxStock) {
              showToast(`Stock insuficiente. Solo quedan ${maxStock} unidades.`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromPosCart = (id, name) => {
    setPosCart((prevCart) => prevCart.filter((item) => item.id !== id));
    showToast(`Eliminado de la venta: ${name}`);
  };

  const handlePosCheckout = async (e) => {
    if (e) e.preventDefault();
    if (posCart.length === 0) {
      showToast("El carrito del POS está vacío.");
      return;
    }

    // Verify stock one more time before checkout
    for (const item of posCart) {
      const dbProd = allProducts.find(p => p.id === item.id);
      const currentStock = dbProd ? (dbProd.stock || 0) : 0;
      if (item.quantity > currentStock) {
        showToast(`Error: "${item.nombre}" supera el stock disponible (${currentStock}).`);
        return;
      }
    }

    const discountVal = parseFloat(posDiscount) || 0;
    const posSubtotal = posCart.reduce((sum, item) => sum + item.precio * item.quantity, 0);
    const posTotal = Math.max(0, posSubtotal - discountVal);

    try {
      const metodoEntregaStr = "Venta POS (Presencial)";
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: posClient || 'Venta Mostrador',
          telefono: posPhone || '',
          correo: 'pos@yumar.com',
          total: posTotal,
          detalles: posCart,
          metodo_entrega: metodoEntregaStr,
          metodo_pago: posPaymentMethod,
          estado: 'Entregado'
        })
      });

      if (!response.ok) throw new Error('Error al registrar venta POS');

      const savedPedido = await response.json();

      // Show Voucher Modal
      setPosActiveVoucher({
        id: savedPedido.id,
        fecha: savedPedido.fecha || new Date().toISOString(),
        cliente: posClient || 'Venta Mostrador',
        telefono: posPhone || '',
        detalles: posCart,
        subtotal: posSubtotal,
        descuento: discountVal,
        total: posTotal,
        metodoPago: posPaymentMethod,
        efectivoRecibido: parseFloat(posCashReceived) || 0,
        cambio: posPaymentMethod === 'Efectivo' 
          ? Math.max(0, (parseFloat(posCashReceived) || 0) - posTotal) 
          : 0
      });

      // Clear POS cart and form
      setPosCart([]);
      setPosClient('Venta Mostrador');
      setPosPhone('');
      setPosCashReceived('');
      setPosDiscount('');

      showToast("Venta registrada con éxito.");

      // Refresh product stock list immediately
      fetchProducts();
      fetchAllProducts();
      fetchPedidosList(); // Refresh order history in admin panel
      
      // Update local states instantly so POS UI updates without waiting
      const updateStockLocally = (productList) => productList.map(p => {
        const cartItem = posCart.find(c => c.id === p.id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, (p.stock || 0) - cartItem.quantity) };
        }
        return p;
      });
      setProducts(prev => updateStockLocally(prev));
      setAllProducts(prev => updateStockLocally(prev));
    } catch (err) {
      console.error(err);
      showToast("Error al procesar la venta POS.");
    }
  };


  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${name}"?`)) return;

    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Error al eliminar producto');
      
      setProducts(prev => prev.filter(prod => prod.id !== id));
      fetchAllProducts();
      showToast(`Producto eliminado: ${name}`);
    } catch (err) {
      console.error(err);
      showToast("Error al eliminar del servidor");
    }
  };

  const handleReclamoSubmit = async (e) => {
    e.preventDefault();
    if (!reclamo.privacidad) {
      showToast('Debes aceptar la política de privacidad');
      return;
    }
    
    try {
      // 1. Save to DB
      const res = await fetch('/api/reclamos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reclamo)
      });
      
      if (!res.ok) {
        throw new Error('Error al guardar reclamo en el servidor');
      }

      // 2. Update UI state
      setReclamoEnviado(true);
      
    } catch (err) {
      console.error(err);
      showToast("Hubo un error al procesar el reclamo. Por favor, intenta de nuevo.");
    }
  };

  const handleResenaSubmit = async (e) => {
    e.preventDefault();
    if (!resenaForm.autor || !resenaForm.comentario) return;

    try {
      const res = await fetch('/api/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto_id: selectedProduct.id,
          ...resenaForm
        })
      });
      if (res.ok) {
        showToast("¡Gracias por tu reseña!");
        setResenaForm({ autor: '', calificacion: 5, comentario: '' });
        fetchProductResenas(selectedProduct.id);
      }
    } catch (err) {
      showToast("Error al enviar reseña.");
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      setIsAdminAuthenticated(true);
      setViewMode('admin');
      localStorage.setItem('yumar_adminAuth', 'true');
      localStorage.setItem('yumar_viewMode', 'admin');
      showToast("Bienvenido al Panel de Control");
    } else {
      showToast("Credenciales incorrectas");
    }
  };

  const updateEstadoReclamo = async (id, estado) => {
    try {
      await fetch(`/api/reclamos/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      });
      fetchReclamosList();
      showToast("Estado de reclamo actualizado");
    } catch (err) { showToast("Error al actualizar estado"); }
  };

  const updateEstadoPedido = async (id, estado) => {
    try {
      await fetch(`/api/pedidos/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      });
      fetchPedidosList();
      showToast("Estado de pedido actualizado");
    } catch (err) { showToast("Error al actualizar estado"); }
  };

  const deletePedido = async (id) => {
    const password = prompt("🔒 Confirmación de Seguridad:\nIngrese la contraseña de administrador para eliminar este pedido:");
    if (password === null) return;
    if (password !== 'admin123') {
      showToast("❌ Contraseña incorrecta. No se pudo eliminar el pedido.");
      return;
    }
    if (!confirm("⚠️ ¿Estás seguro de que deseas eliminar este pedido?")) return;
    try {
      const res = await fetch(`/api/pedidos/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast("Pedido eliminado correctamente");
        fetchPedidosList();
      } else {
        showToast("Error al eliminar pedido");
      }
    } catch (err) {
      showToast("Error al eliminar pedido");
    }
  };

  const clearPedidosHistory = async () => {
    const password = prompt("🔒 Confirmación de Seguridad:\nIngrese la contraseña de administrador para vaciar TODO el historial de pedidos:");
    if (password === null) return;
    if (password !== 'admin123') {
      showToast("❌ Contraseña incorrecta. No se vació el historial.");
      return;
    }
    if (!confirm("⚠️ ¿Estás absolutamente seguro de que deseas vaciar TODO el historial de pedidos? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch('/api/pedidos', {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast("Historial de pedidos vaciado");
        fetchPedidosList();
      } else {
        showToast("Error al vaciar historial");
      }
    } catch (err) {
      showToast("Error al vaciar historial");
    }
  };

  const updateAprobacionResena = async (id, aprobado) => {
    try {
      await fetch(`/api/resenas/${id}/aprobado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprobado })
      });
      fetchAdminResenas();
      showToast("Estado de reseña actualizado");
    } catch (err) { showToast("Error al actualizar estado"); }
  };

  const deleteReclamo = async (id) => {
    if (!confirm("¿Eliminar este reclamo?")) return;
    try {
      const res = await fetch(`/api/reclamos/${id}`, { method: 'DELETE' });
      if (res.ok) { showToast("Reclamo eliminado"); fetchReclamosList(); }
      else showToast("Error al eliminar");
    } catch { showToast("Error al eliminar"); }
  };

  const clearReclamosHistory = async () => {
    if (!confirm("⚠️ ¿Vaciar TODOS los reclamos? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch('/api/reclamos', { method: 'DELETE' });
      if (res.ok) { showToast("Reclamos vaciados"); fetchReclamosList(); }
      else showToast("Error al vaciar");
    } catch { showToast("Error al vaciar"); }
  };

  const deleteResena = async (id) => {
    if (!confirm("¿Eliminar esta reseña?")) return;
    try {
      const res = await fetch(`/api/resenas/${id}`, { method: 'DELETE' });
      if (res.ok) { showToast("Reseña eliminada"); fetchAdminResenas(); }
      else showToast("Error al eliminar");
    } catch { showToast("Error al eliminar"); }
  };

  const clearResenasHistory = async () => {
    if (!confirm("⚠️ ¿Vaciar TODAS las reseñas? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch('/api/resenas', { method: 'DELETE' });
      if (res.ok) { showToast("Reseñas vaciadas"); fetchAdminResenas(); }
      else showToast("Error al vaciar");
    } catch { showToast("Error al vaciar"); }
  };

  // Computed Values

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.precio * item.quantity, 0);
  const categories = categoriesList;
  const navCategories = categories.filter(c => c !== 'Todos');

  const filteredAdminProducts = products.filter(p => {
    if (!adminProductSearch) return true;
    const term = adminProductSearch.toLowerCase();
    return p.nombre.toLowerCase().includes(term) || p.categoria.toLowerCase().includes(term);
  });

  const filteredPedidos = pedidosList.filter(p => {
    const isPos = p.metodo_entrega && p.metodo_entrega.toLowerCase().includes('pos');
    if (orderSourceFilter === 'web' && isPos) return false;
    if (orderSourceFilter === 'pos' && !isPos) return false;

    if (!adminOrderSearch) return true;
    const term = adminOrderSearch.toLowerCase();
    return p.nombre.toLowerCase().includes(term) || (p.telefono && p.telefono.toLowerCase().includes(term)) || (p.estado && p.estado.toLowerCase().includes(term));
  });

  const webPedidosList = pedidosList.filter(p => !p.metodo_entrega || !p.metodo_entrega.toLowerCase().includes('pos'));
  const webPedidosCount = webPedidosList.length;
  const webPedidosPendientesCount = webPedidosList.filter(p => !p.estado || p.estado === 'Pendiente').length;

  const bestsellers = allProducts
    .filter(p => p.badge?.includes('VENDIDO') || p.badge?.includes('POPULAR'))
    .slice(0, 5);
  const displayBestsellers = bestsellers.length >= 3 ? bestsellers : allProducts.slice(0, 5);

  const getRelatedProducts = (product) =>
    allProducts.filter(p => p.id !== product.id && p.categoria === product.categoria).slice(0, 8);

  const openProduct = (product) => {
    setSelectedProduct(product);
    setDetailQuantity(1);
    setProductResenas([]);
    fetchProductResenas(product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeProduct = () => setSelectedProduct(null);

  // Financial Metrics
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  
  const hace7Dias = new Date(hoy);
  hace7Dias.setDate(hoy.getDate() - 7);
  
  const hace30Dias = new Date(hoy);
  hace30Dias.setDate(hoy.getDate() - 30);

  const pedidosValidos = pedidosList.filter(p => p.estado !== 'Cancelado');

  const gananciasHoy = pedidosValidos
    .filter(p => new Date(p.fecha) >= hoy)
    .reduce((sum, p) => sum + p.total, 0);

  const gananciasSemana = pedidosValidos
    .filter(p => new Date(p.fecha) >= hace7Dias)
    .reduce((sum, p) => sum + p.total, 0);

  const gananciasMes = pedidosValidos
    .filter(p => new Date(p.fecha) >= hace30Dias)
    .reduce((sum, p) => sum + p.total, 0);

  // Advanced Metrics
  const lowStockProducts = allProducts.filter(p => (p.stock || 0) <= 5);

  const getTopProducts = () => {
    const counts = {};
    pedidosValidos.forEach(ped => {
      if (ped.detalles && typeof ped.detalles === 'object') {
        ped.detalles.forEach(d => {
          if (d.nombre) {
            counts[d.nombre] = (counts[d.nombre] || 0) + (d.quantity || 1);
          }
        });
      }
    });
    return Object.entries(counts)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3);
  };
  const topProducts = getTopProducts();

  const exportOrdersCSV = () => {
    const header = "ID,Fecha,Cliente,Telefono,Metodo Entrega,Total,Estado\n";
    const rows = pedidosList.map(p => {
      const fecha = new Date(p.fecha).toLocaleDateString();
      const entrega = p.metodo_entrega ? p.metodo_entrega.replace(/,/g, ' ') : 'Envío';
      const nombre = p.nombre.replace(/,/g, ' ');
      return `${p.id},${fecha},${nombre},${p.telefono},${entrega},${p.total},${p.estado || 'Pendiente'}`;
    }).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + header + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pedidos_yumar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white w-full">

      {/* Sticky Header Block */}
      <div className="sticky-header print:hidden">
      {/* Top WhatsApp Bar - estilo Grupo Kafi */}
      <div className="bg-brand text-white text-center text-xs md:text-sm py-2 font-medium tracking-wide">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`}
          target="_blank"
          rel="noreferrer"
          className="hover:underline inline-flex items-center gap-1.5"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.446L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.623-1.023-5.086-2.884-6.948C16.59 2.012 14.125.99 11.516.99c-5.44 0-9.864 4.372-9.868 9.8.001 1.93.524 3.818 1.513 5.497L2.122 21.9l5.7-1.494z"/></svg>
          WhatsApp: {WHATSAPP_NUMBER.replace('+51', '')}
        </a>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="w-full px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">

            {/* Left: Social + Mobile menu */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-1.5 text-brand"
                aria-label="Menú"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-slate-600 font-medium">¡Síguenos!</span>
                <a href="https://www.facebook.com/share/1BqZay682t/" target="_blank" rel="noreferrer" className="text-brand hover:opacity-80 transition" aria-label="Facebook">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>

                <a href="https://www.tiktok.com/@yumar.importacion?_r=1&_t=ZS-97QaykM2SKl" target="_blank" rel="noreferrer" className="text-brand hover:opacity-80 transition" aria-label="TikTok">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                </a>
              </div>
            </div>

            {/* Center: Logo */}
            <div
              className="flex-1 flex flex-col items-center cursor-pointer select-none"
              onClick={() => { setViewMode('shop'); closeProduct(); clearFilters(); }}
            >
              <span className="font-cursive text-2xl md:text-[2.75rem] text-brand leading-none">
                YuMar Importaciones
              </span>
              <span className="text-[7px] md:text-[9px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-heading font-semibold text-slate-400 mt-3 md:mt-4 hidden sm:block">
                Tecnología · Hogar · Belleza · Deporte
              </span>
            </div>

            {/* Right: Search, Mi Cuenta, Cart */}
            <div className="flex items-center gap-1 md:gap-3 flex-shrink-0 justify-end">

              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-full hover:bg-pink-50 transition group"
                aria-label="Buscar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6" style={{ color: '#0ea5e9' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
                </svg>
              </button>

              {/* Admin link hidden — accessible via gear icon in footer */}

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-orange-50 transition"
                aria-label="Carrito"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 md:w-7 md:h-7" style={{ color: '#0ea5e9' }}>
                  <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM16.5 18a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM7.5 19.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z" />
                </svg>
                <span className="text-sm font-heading font-bold hidden sm:inline text-slate-700">
                  S/ {cartTotal.toFixed(2)}
                </span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow">
                    {cartCount}
                  </span>
                )}
              </button>

            </div>
          </div>
        </div>

        {/* Search dropdown */}
        {searchOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-4 animate-fade-in">
            <form onSubmit={(e) => { handleSearchSubmit(e); setSearchOpen(false); }} className="max-w-2xl mx-auto flex border border-slate-200 rounded overflow-hidden focus-within:border-brand">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 px-4 py-2.5 text-sm focus:outline-none"
              />
              <button type="submit" className="bg-brand hover:bg-brand-hover text-white px-6 text-sm font-heading font-semibold transition">
                Buscar
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Category Navigation Bar */}
      {viewMode === 'shop' && (
        <nav className="bg-[#f5f5f5] border-b border-slate-200 cat-nav-scroll overflow-x-auto">
          <div className="w-full px-2 flex">
            {navCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCurrentCategory(cat); closeProduct(); }}
                className={`whitespace-nowrap px-3 md:px-5 py-3 text-xs md:text-sm font-heading font-medium transition-colors border-b-2 ${
                  currentCategory === cat
                    ? 'text-brand border-brand bg-white'
                    : 'text-slate-600 border-transparent hover:text-brand hover:bg-white/50'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={() => { clearFilters(); closeProduct(); }}
              className={`whitespace-nowrap px-3 md:px-5 py-3 text-xs md:text-sm font-heading font-medium transition-colors border-b-2 shrink-0 ${
                currentCategory === 'Todos'
                  ? 'text-brand border-brand bg-white'
                  : 'text-slate-600 border-transparent hover:text-brand hover:bg-white/50'
              }`}
            >
              Ver todo
            </button>
          </div>
        </nav>
      )}
      </div>



      {viewMode === 'shop' ? (
        <main className="flex-1 flex flex-col">

          {selectedProduct ? (
            /* ===== PRODUCT DETAIL PAGE - estilo Grupo Kafi ===== */
            <div className="animate-fade-in">
              {/* Breadcrumb */}
              <div className="w-full px-4 py-3 text-xs text-slate-400">
                <button onClick={closeProduct} className="hover:text-brand transition">Inicio</button>
                <span className="mx-2">/</span>
                <button
                  onClick={() => { setCurrentCategory(selectedProduct.categoria); closeProduct(); }}
                  className="hover:text-brand transition uppercase"
                >
                  {selectedProduct.badge || selectedProduct.categoria}
                </button>
              </div>

              {/* Product main layout */}
              <div className="w-full px-4 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                  {/* Product Image */}
                  <div className="lg:col-span-5">
                    <div className="bg-white border border-slate-100 rounded-lg overflow-hidden aspect-square relative">
                      <img
                        src={optimizeCloudinaryUrl(selectedProduct.imagen || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&q=80")}
                        alt={selectedProduct.nombre}
                        loading="lazy"
                        className="w-full h-full object-contain p-4"
                      />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="lg:col-span-4 flex flex-col">
                    <h1 className="text-lg md:text-xl font-heading font-bold text-slate-900 uppercase leading-snug">
                      {selectedProduct.nombre}
                    </h1>

                    <p className="text-2xl md:text-3xl font-heading font-bold text-slate-900 mt-3">
                      S/ {selectedProduct.precio.toFixed(2)}
                    </p>

                    <p className={`text-sm font-medium mt-1 ${(selectedProduct.stock || 0) <= 5 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {selectedProduct.stock || 0} unidades disponibles
                    </p>

                    {selectedProduct.descripcion && (
                      <p className="text-sm text-slate-500 mt-4 leading-relaxed border-t border-slate-100 pt-4">
                        {selectedProduct.descripcion}
                      </p>
                    )}

                    {/* Quantity */}
                    <div className="mt-6 flex items-center gap-3">
                      <div className="flex items-center border border-slate-300 rounded">
                        <button
                          onClick={() => setDetailQuantity(prev => Math.max(1, prev - 1))}
                          className="px-4 py-2.5 text-lg font-light text-slate-600 hover:bg-slate-50 transition"
                        >
                          −
                        </button>
                        <span className="px-4 py-2.5 text-sm font-bold min-w-[40px] text-center border-x border-slate-300">
                          {detailQuantity}
                        </span>
                        <button
                          onClick={() => setDetailQuantity(prev => {
                            if (prev >= (selectedProduct.stock || 0)) {
                              showToast(`Solo quedan ${selectedProduct.stock || 0} unidades disponibles.`);
                              return prev;
                            }
                            return prev + 1;
                          })}
                          className="px-4 py-2.5 text-lg font-light text-slate-600 hover:bg-slate-50 transition"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Comprar ya button */}
                    <button
                      onClick={() => {
                        addToCart(selectedProduct, detailQuantity);
                        setViewMode('checkout');
                        showToast("Por favor, completa tus datos para finalizar la compra.");
                      }}
                      className="mt-4 w-full bg-brand hover:bg-brand-hover text-white font-heading font-bold text-sm py-3.5 rounded transition uppercase tracking-wide"
                    >
                      Comprar ya
                    </button>

                    <button
                      onClick={() => { addToCart(selectedProduct, detailQuantity); showToast(`Agregado: ${selectedProduct.nombre}`); }}
                      className="mt-2 w-full border-2 border-brand text-brand hover:bg-brand hover:text-white font-heading font-semibold text-sm py-3 rounded transition"
                    >
                      Agregar al carrito
                    </button>

                    <p className="text-xs text-slate-400 mt-4">
                      Categoría:{' '}
                      <button
                        onClick={() => { setCurrentCategory(selectedProduct.categoria); closeProduct(); }}
                        className="text-brand hover:underline uppercase"
                      >
                        {selectedProduct.categoria}
                      </button>
                    </p>
                  </div>

                  {/* Bestsellers Sidebar */}
                  <div className="lg:col-span-3">
                    <div className="border border-slate-200 rounded-lg p-4 bg-white">
                      <h3 className="font-heading font-bold text-slate-900 text-sm pb-2 border-b-2 border-brand inline-block mb-4">
                        Más vendidos
                      </h3>
                      <ul className="space-y-3">
                        {displayBestsellers.map((item) => (
                          <li key={item.id}>
                            <button
                              onClick={() => openProduct(item)}
                              className="flex gap-3 w-full text-left group"
                            >
                              <img
                                src={optimizeCloudinaryUrl(item.imagen)}
                                alt=""
                                loading="lazy"
                                className="w-14 h-14 object-cover rounded border border-slate-100 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-heading font-bold text-slate-800 uppercase line-clamp-2 leading-snug group-hover:text-brand transition pr-2">
                                  {item.nombre}
                                </p>
                                <p className="text-sm font-heading font-extrabold text-slate-900 mt-1">
                                  S/ {item.precio.toFixed(2)}
                                </p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Reseñas Section */}
                <section className="mt-12 pt-8 border-t border-slate-200">
                  <h3 className="font-heading font-bold text-slate-900 text-lg mb-6">Calificaciones y Reseñas</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      {productResenas.length > 0 ? (
                        <div className="space-y-4">
                          {productResenas.map(r => (
                            <div key={r.id} className="bg-slate-50 p-4 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-slate-800 text-sm">{r.autor}</span>
                                <span className="text-amber-500 text-xs">{'★'.repeat(r.calificacion)}{'☆'.repeat(5-r.calificacion)}</span>
                              </div>
                              <p className="text-sm text-slate-600">{r.comentario}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Aún no hay reseñas para este producto. ¡Sé el primero en opinar!</p>
                      )}
                    </div>
                    <div>
                      <form onSubmit={handleResenaSubmit} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-sm mb-4">Escribe una reseña</h4>
                        <div className="space-y-3">
                          <input type="text" placeholder="Tu nombre" required value={resenaForm.autor} onChange={e => setResenaForm({...resenaForm, autor: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" />
                          <select value={resenaForm.calificacion} onChange={e => setResenaForm({...resenaForm, calificacion: parseInt(e.target.value)})} className="w-full px-3 py-2 text-sm border rounded-lg bg-white">
                            <option value={5}>⭐⭐⭐⭐⭐ (Excelente)</option>
                            <option value={4}>⭐⭐⭐⭐ (Muy bueno)</option>
                            <option value={3}>⭐⭐⭐ (Bueno)</option>
                            <option value={2}>⭐⭐ (Regular)</option>
                            <option value={1}>⭐ (Malo)</option>
                          </select>
                          <textarea placeholder="Cuéntanos qué te pareció..." required rows={3} value={resenaForm.comentario} onChange={e => setResenaForm({...resenaForm, comentario: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg"></textarea>
                          <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg text-sm">Enviar Reseña</button>
                        </div>
                      </form>
                    </div>
                  </div>
                </section>

                {/* Related Products */}
                {getRelatedProducts(selectedProduct).length > 0 && (
                  <section className="mt-12 pt-8 border-t border-slate-200">
                    <h3 className="text-center font-heading font-bold text-slate-700 uppercase tracking-widest text-sm mb-6">
                      Productos relacionados
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {getRelatedProducts(selectedProduct).map((prod) => (
                        <button
                          key={prod.id}
                          onClick={() => openProduct(prod)}
                          className={`kafi-card bg-white text-left group ${prod.stock <= 0 ? 'opacity-70' : ''}`}
                        >
                          <div className="aspect-square bg-slate-50 border border-slate-100 rounded overflow-hidden mb-2 relative">
                            {prod.stock <= 0 ? (
                              <span className="absolute top-1 left-1 z-10 bg-slate-500 text-white text-[8px] font-bold uppercase px-1.5 py-0.5">
                                AGOTADO
                              </span>
                            ) : prod.badge ? (
                              <span className="absolute top-1 left-1 z-10 bg-brand text-white text-[8px] font-bold uppercase px-1.5 py-0.5">
                                {prod.badge}
                              </span>
                            ) : null}
                            <img src={optimizeCloudinaryUrl(prod.imagen)} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <p className="text-sm font-heading font-bold text-slate-800 uppercase line-clamp-2 leading-snug group-hover:text-brand transition px-1.5 mt-1">
                            {prod.nombre}
                          </p>
                          <p className="text-sm font-heading font-extrabold text-slate-900 mt-1.5 px-1.5 mb-1.5">
                            S/ {prod.precio.toFixed(2)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          ) : (
            /* ===== CATALOG VIEW ===== */
            <>
              {/* Hero Banner / Carousel */}
              {!appliedSearch && currentCategory === 'Todos' && (
                <div className="w-full relative group bg-slate-900 overflow-hidden">
                  <div className="w-full h-[220px] md:h-[400px] lg:h-[500px]">
                    <div 
                      className="w-full h-full flex transition-transform duration-700 ease-in-out" 
                      style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                      {heroBanners.map((banner) => (
                        <div key={banner.id} className="min-w-full h-full relative flex-shrink-0">
                          <img src={banner.image} alt={banner.title} className="w-full h-full object-cover opacity-60" />
                          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-24 max-w-6xl mx-auto text-white bg-gradient-to-r from-black/80 via-black/40 to-transparent">
                            <span className="text-[10px] md:text-sm font-heading font-bold uppercase tracking-[0.2em] text-brand mb-2">{banner.tagline}</span>
                            <h2 className="text-3xl md:text-5xl lg:text-6xl font-heading font-extrabold mb-3 md:mb-5 whitespace-pre-line">{banner.title}</h2>
                            <p className="text-xs md:text-base max-w-xs md:max-w-md text-slate-200 mb-5 md:mb-8 hidden sm:block">{banner.subtitle}</p>
                            <button onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })} className="bg-brand hover:bg-brand-hover text-white text-xs md:text-sm font-heading font-bold px-8 py-3 w-fit rounded-lg shadow-lg shadow-brand/30 transition">
                              {banner.buttonText}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Manual Navigation Arrows */}
                    <button 
                      onClick={() => setCurrentSlide(prev => (prev === 0 ? heroBanners.length - 1 : prev - 1))}
                      className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 md:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                      aria-label="Anterior banner"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setCurrentSlide(prev => (prev + 1) % heroBanners.length)}
                      className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 md:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                      aria-label="Siguiente banner"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>

                    {/* Carousel Navigation Dots */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2.5 z-20">
                      {heroBanners.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'bg-brand scale-150' : 'bg-white/50 hover:bg-white/80'}`}
                          aria-label={`Ir al slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {/* Search results indicator */}
              {(appliedSearch || currentCategory !== 'Todos') && (
                <div className="w-full px-4 pt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {appliedSearch && <>Resultados para: <strong className="text-slate-800">"{appliedSearch}"</strong></>}
                    {currentCategory !== 'Todos' && !appliedSearch && <>Categoría: <strong className="text-slate-800">{currentCategory}</strong></>}
                  </span>
                  <button onClick={clearFilters} className="text-brand hover:underline font-semibold">
                    Ver todos
                  </button>
                </div>
              )}

              {/* Product Grid */}
              <section className="w-full px-4 py-6 md:py-8 flex-1 relative">
                {/* Marca de agua - cubre todo el área de productos */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 0,
                  opacity: 0.22,
                  minHeight: '400px',
                }}>
                  <img src="/logo.png" alt="" style={{ width: '70%', maxWidth: '700px', height: 'auto', objectFit: 'contain' }} />
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-heading font-medium text-slate-500 mt-4">Cargando productos...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-20 bg-white border border-slate-100 rounded-lg p-6">
                    <h3 className="font-heading font-bold text-slate-800 mt-4">Error al conectar</h3>
                    <p className="text-sm text-slate-500 mt-1">{error}</p>
                    <button onClick={() => fetchProducts()} className="mt-4 bg-brand text-white font-heading font-semibold text-xs px-4 py-2 rounded hover:bg-brand-hover transition">
                      Reintentar
                    </button>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-20">
                    <h3 className="font-heading font-bold text-slate-800">No se encontraron productos</h3>
                    <button onClick={clearFilters} className="mt-4 bg-brand text-white font-heading font-semibold text-xs px-5 py-2.5 rounded hover:bg-brand-hover transition">
                      Ver todos los productos
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
                    {products.map((product) => (
                      <div key={product.id} className={`kafi-card bg-white group flex flex-col ${product.stock <= 0 ? 'opacity-75' : ''}`}>
                        <div
                          className="aspect-square bg-slate-50 overflow-hidden relative cursor-pointer"
                          onClick={() => openProduct(product)}
                        >
                          {product.stock <= 0 ? (
                            <span className="absolute top-2 left-2 z-10 bg-slate-500 text-white font-heading font-bold text-[8px] uppercase px-2 py-0.5">
                              AGOTADO
                            </span>
                          ) : product.badge ? (
                            <span className="absolute top-2 left-2 z-10 bg-brand text-white font-heading font-bold text-[8px] uppercase px-2 py-0.5">
                              {product.badge}
                            </span>
                          ) : null}
                          <img
                            src={optimizeCloudinaryUrl(product.imagen || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&q=80")}
                            alt={product.nombre}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        <div className="pt-3 px-2.5 pb-2.5 flex flex-col flex-1">
                          <h3
                            className="font-heading font-bold text-slate-800 text-sm md:text-base uppercase line-clamp-2 leading-snug cursor-pointer group-hover:text-brand transition-colors text-left flex-1"
                            onClick={() => openProduct(product)}
                          >
                            {product.nombre}
                          </h3>
                          <div className="flex items-center justify-between mt-3">
                            <span className="font-heading font-extrabold text-sm md:text-base text-slate-900">
                              S/ {product.precio.toFixed(2)}
                            </span>
                            {product.stock <= 0 ? (
                              <span className="text-[10px] font-heading font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded">
                                Agotado
                              </span>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
                                className="bg-brand hover:bg-brand-hover text-white p-1.5 rounded transition sm:opacity-0 sm:group-hover:opacity-100"
                                title="Agregar al carrito"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </section>
            </>
          )}

        </main>
      ) : viewMode === 'checkout' ? (
        /* ===== CHECKOUT PAGE ===== */
        <main className="w-full max-w-7xl mx-auto px-4 py-8 flex-grow animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-slate-900 uppercase tracking-wide">Finalizar compra</h1>
            <button 
              type="button"
              onClick={() => setViewMode('shop')}
              className="text-brand text-xs md:text-sm font-heading font-semibold hover:underline flex items-center gap-1"
            >
              ← Seguir comprando
            </button>
          </div>

          {/* Coupon Banner Notice */}
          <div className="bg-[#fcfafb] border border-dashed border-[#e6b1c4] rounded-lg p-4 mb-8 text-sm text-slate-600">
            ¿Tienes un cupón? <span className="text-brand font-semibold cursor-pointer hover:underline">Haz clic aquí para introducir tu código</span>
          </div>

          <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Detalles de Facturación */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-base font-heading font-extrabold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
                Detalles de facturación
              </h2>

              {/* Delivery Option Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase">Método de entrega <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 transition text-left border-brand bg-brand/5 text-brand font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19a1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                    </svg>
                    <div>
                      <span className="text-xs uppercase block">Recojo en tienda</span>
                      <span className="text-[10px] text-brand/80 font-normal">Recoge gratis en tienda</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Nombre <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    value={checkoutForm.nombre} 
                    onChange={e => setCheckoutForm({...checkoutForm, nombre: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-brand bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Apellidos <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    value={checkoutForm.apellidos} 
                    onChange={e => setCheckoutForm({...checkoutForm, apellidos: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-brand bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Documento <span className="text-red-500">*</span></label>
                  <select 
                    value={checkoutForm.tipoDoc} 
                    onChange={e => setCheckoutForm({...checkoutForm, tipoDoc: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-brand bg-white font-semibold"
                  >
                    <option value="DNI">DNI</option>
                    <option value="CE">Carnet de Extranjería</option>
                    <option value="RUC">RUC</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">N° de documento <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    placeholder={checkoutForm.tipoDoc === 'DNI' ? '8 dígitos' : 'Número de documento'}
                    value={checkoutForm.numDoc}
                    maxLength={checkoutForm.tipoDoc === 'DNI' ? 8 : checkoutForm.tipoDoc === 'RUC' ? 11 : 20}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCheckoutForm({...checkoutForm, numDoc: val});
                    }}
                    className="w-full px-4 py-3 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-brand bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Teléfono <span className="text-red-500">*</span></label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="9 dígitos"
                    maxLength={9}
                    value={checkoutForm.telefono} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCheckoutForm({...checkoutForm, telefono: val});
                    }}
                    className="w-full px-4 py-3 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-brand bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Correo electrónico <span className="text-slate-400 text-[10px] lowercase normal-case ml-1 tracking-normal font-normal">(Opcional)</span></label>
                  <input 
                    type="email" 
                    value={checkoutForm.correo} 
                    onChange={e => setCheckoutForm({...checkoutForm, correo: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-brand bg-white"
                  />
                </div>
              </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 animate-fade-in">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tienda de recojo</h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Seleccionar Sede <span className="text-red-500">*</span></label>
                    <select 
                      value={checkoutForm.direccion} 
                      onChange={e => setCheckoutForm({...checkoutForm, direccion: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-brand bg-white font-semibold"
                    >
                      <option value="Santa Ana">Santa Ana</option>
                      <option value="Villasol Huaca">Villasol Huaca</option>
                      <option value="Villa Av. Central">Villa Av. Central</option>
                      <option value="Puente Piedra">Puente Piedra</option>
                    </select>
                  </div>
                </div>
            </div>

            {/* Right Column: Tu Pedido */}
            <div className="lg:col-span-5 bg-[#fbfbfb] border border-slate-200 rounded-lg p-6 space-y-6">
              <h2 className="text-base font-heading font-extrabold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-200">
                Tu pedido
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-500 font-semibold">Tu carrito está vacío.</p>
                  <button 
                    type="button"
                    onClick={() => setViewMode('shop')}
                    className="mt-4 bg-brand hover:bg-brand-hover text-white text-xs font-heading font-bold px-4 py-2 rounded-lg transition"
                  >
                    Volver a la tienda
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Table headers */}
                  <div className="flex justify-between text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-200">
                    <span>Producto</span>
                    <span>Subtotal</span>
                  </div>

                  {/* Product items list */}
                  <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-3 gap-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={optimizeCloudinaryUrl(item.imagen)} 
                            alt="" 
                            loading="lazy"
                            className="w-12 h-12 object-cover rounded border border-slate-200 bg-white flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                              {item.nombre} <span className="text-slate-400 font-bold ml-1">× {item.quantity}</span>
                            </p>
                            <button 
                              type="button"
                              onClick={() => removeFromCart(item.id, item.nombre)}
                              className="text-[10px] text-red-500 hover:underline mt-1 flex items-center gap-0.5"
                            >
                              ✕ Eliminar
                            </button>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-950 flex-shrink-0">
                          S/ {(item.precio * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Subtotal & Total */}
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-500">Subtotal</span>
                      <span className="font-bold text-slate-900">S/ {cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base pt-3 border-t border-slate-200">
                      <span className="font-bold text-slate-900">Total</span>
                      <span className="font-extrabold text-brand text-lg">S/ {cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Options */}
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="space-y-2.5">
                      {/* Option 1: Bancaria */}
                      <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:border-slate-350 cursor-pointer transition bg-white">
                        <input 
                          type="radio" 
                          name="metodoPago" 
                          value="transferencia" 
                          checked={checkoutForm.metodoPago === 'transferencia'}
                          onChange={() => setCheckoutForm({...checkoutForm, metodoPago: 'transferencia'})}
                          className="accent-brand mt-1" 
                        />
                        <div className="text-xs">
                          <span className="font-bold text-slate-800 block">Depósito o transferencia bancaria</span>
                          {checkoutForm.metodoPago === 'transferencia' && (
                            <span className="block mt-2 text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100 animate-fade-in">
                              Realiza tu depósito a nombre de: <strong>{YAPE_NAME}</strong>.<br />
                              • <strong>BCP:</strong> 19312966274044<br />
                              Envía la constancia de pago al WhatsApp para procesar tu pedido.
                            </span>
                          )}
                        </div>
                      </label>

                      {/* Option 2: Yape/Plin */}
                      <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:border-slate-350 cursor-pointer transition bg-white">
                        <input 
                          type="radio" 
                          name="metodoPago" 
                          value="yape_plin" 
                          checked={checkoutForm.metodoPago === 'yape_plin'}
                          onChange={() => setCheckoutForm({...checkoutForm, metodoPago: 'yape_plin'})}
                          className="accent-brand mt-1" 
                        />
                        <div className="text-xs flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-800">Pago con Yape</span>
                            <div className="flex gap-1">
                              <span className="bg-[#743484] text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded leading-none">yape</span>
                            </div>
                          </div>
                          
                          {checkoutForm.metodoPago === 'yape_plin' && (
                            <div className="mt-2 text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100 animate-fade-in">
                              Puedes realizar tu pago 100% seguro a través de tu aplicativo Yape registrando el número <strong className="text-slate-800">{YAPE_NUMBER}</strong>.<br />
                              A nombre de: <strong>{YAPE_NAME}</strong>.<br />
                              No olvides confirmar el pago enviando la constancia al <strong className="text-slate-800">{YAPE_NUMBER}</strong>.
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Submission Button */}
                  <button 
                    type="submit" 
                    className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white py-3.5 rounded-xl font-heading font-extrabold text-sm shadow-lg shadow-brand/10 transition mt-6"
                  >
                    <span>Realizar el pedido</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </button>

                  <p className="text-[10px] text-center text-slate-400 leading-relaxed mt-4">
                    Tus datos personales se utilizarán para procesar tu pedido. Serás redirigido a WhatsApp para finalizar la entrega y el pago con un asesor.
                  </p>
                </div>
              )}
            </div>
          </form>
        </main>
      ) : viewMode === 'voucher' && completedOrder ? (
        /* ===== VOUCHER PAGE ===== */
        <main className="w-full max-w-2xl mx-auto px-4 py-12 flex-grow animate-fade-in print:py-0 print:px-0">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm relative overflow-hidden print:border-none print:shadow-none print:p-0">
            {/* Voucher Header */}
            <div className="flex flex-col items-center justify-center text-center mb-8 border-b border-slate-100 pb-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <h1 className="text-2xl font-heading font-extrabold text-slate-900 uppercase">¡Pedido Confirmado!</h1>
              <p className="text-slate-500 mt-2 text-sm">Tu número de orden es <span className="font-bold text-slate-800">#{completedOrder.id || Math.floor(Math.random() * 10000)}</span></p>
              
              <div className="mt-4 inline-block bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 text-left">
                <p className="text-xs text-slate-500 font-medium mb-1">YuMar Importaciones - RUC: <span className="font-bold text-slate-700">20614188465</span></p>
                <p className="text-xs text-slate-500 font-medium">Fecha y hora: <span className="font-bold text-slate-700">{completedOrder.fecha ? new Date(completedOrder.fecha).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' }) : new Date().toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</span></p>
              </div>
            </div>

            {/* Voucher Body */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Cliente</p>
                  <p className="font-semibold text-slate-800">{completedOrder.clientName}</p>
                  <p className="text-slate-600">{completedOrder.docType}: {completedOrder.docNum}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Contacto</p>
                  <p className="text-slate-600">{completedOrder.telefono}</p>
                  <p className="text-slate-600">{completedOrder.correo || 'Sin correo'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Entrega</p>
                  <p className="font-semibold text-slate-800">{completedOrder.deliveryType === 'domicilio' ? 'Envío a domicilio' : 'Recojo en tienda'}</p>
                  <p className="text-slate-600">{completedOrder.addressInfo}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Método de Pago</p>
                  <p className="font-semibold text-slate-800">{completedOrder.paymentMethod}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 font-bold uppercase mb-3">Resumen de Productos</p>
                <div className="space-y-3">
                  {completedOrder.items && completedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-600">{item.quantity}x {item.nombre}</span>
                      <span className="font-semibold text-slate-800">S/ {(item.precio * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="font-heading font-extrabold text-slate-900 uppercase">Total a Pagar</span>
                <span className="text-xl font-heading font-extrabold text-brand">S/ {completedOrder.subtotal?.toFixed(2)}</span>
              </div>
              
              {/* Payment Instructions */}
              <div className="pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-lg text-sm text-slate-600 text-center">
                <p className="font-semibold mb-1">¡Siguiente paso!</p>
                <p>Envía este comprobante por WhatsApp a nuestro asesor para confirmar tu método de pago y programar el despacho.</p>
              </div>
            </div>

            {/* Voucher Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 print:hidden">
              <button
                type="button"
                onClick={() => {
                  let text = `*🛍️ PEDIDO CONFIRMADO #${completedOrder.id || ''} - YuMar Importaciones*\n\n`;
                  text += `*Cliente:* ${completedOrder.clientName}\n`;
                  text += `*Doc:* ${completedOrder.docType} ${completedOrder.docNum}\n`;
                  text += `*Teléfono:* ${completedOrder.telefono}\n`;
                  if (completedOrder.correo) text += `*Correo:* ${completedOrder.correo}\n`;
                  
                  if (completedOrder.deliveryType === 'domicilio') {
                    text += `*Entrega:* Envío a domicilio\n`;
                    text += `*Destino:* ${completedOrder.addressInfo}\n`;
                  } else {
                    text += `*Entrega:* Recojo en tienda\n`;
                    text += `*Sede:* ${completedOrder.addressInfo}\n`;
                  }
                  text += `*Método de Pago:* ${completedOrder.paymentMethod}\n\n`;
                  text += `*Productos:*\n`;
                  
                  completedOrder.items?.forEach((item, index) => {
                    const itemTotal = item.precio * item.quantity;
                    text += `*${index + 1}. ${item.nombre}*\n`;
                    text += `   Cant: ${item.quantity} | P. Unit: S/ ${item.precio.toFixed(2)}\n`;
                    text += `   Subtotal: *S/ ${itemTotal.toFixed(2)}*\n\n`;
                  });
                  
                  text += `-----------------------------------\n`;
                  text += `*💰 TOTAL A PAGAR: S/ ${completedOrder.subtotal?.toFixed(2)}*\n\n`;
                  text += `Adjunto mi voucher. ¡Gracias!`;
                  
                  window.open(`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-heading font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
                </svg>
                Confirmar por WhatsApp
              </button>
              <button
                type="button"
                onClick={() => {
                  const fecha = completedOrder.fecha
                    ? new Date(completedOrder.fecha).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : new Date().toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                  const itemsRows = (completedOrder.items || []).map(item =>
                    `<tr><td style="padding:6px 0;color:#475569;border-bottom:1px solid #f1f5f9">${item.quantity}x ${item.nombre}</td><td style="padding:6px 0;font-weight:700;text-align:right;border-bottom:1px solid #f1f5f9">S/ ${(item.precio * item.quantity).toFixed(2)}</td></tr>`
                  ).join('');
                  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Voucher Pedido #${completedOrder.id || ''} - YuMar Importaciones</title><style>body{font-family:Arial,sans-serif;max-width:600px;margin:40px auto;padding:24px;color:#1e293b;background:#fff}h1{font-size:22px;text-align:center;text-transform:uppercase;margin-bottom:4px}p{margin:4px 0;font-size:13px}table{width:100%;border-collapse:collapse}th{text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;padding-bottom:8px}.total-row td{padding-top:12px;font-size:16px;font-weight:800}.label{font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-top:16px;margin-bottom:2px}.divider{border:none;border-top:1px solid #e2e8f0;margin:16px 0}.brand{color:#e21a83}.footer{text-align:center;font-size:11px;color:#94a3b8;margin-top:24px}</style></head><body><div style="text-align:center;margin-bottom:16px"><div style="display:inline-block;background:#dcfce7;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px">✔</div><h1>¡Pedido Confirmado!</h1><p style="color:#64748b">Orden <strong>#${completedOrder.id || ''}</strong></p><p style="color:#64748b">YuMar Importaciones · RUC: <strong>20614188465</strong></p><p style="color:#64748b">Fecha: <strong>${fecha}</strong></p></div><hr class="divider"><p class="label">Cliente</p><p><strong>${completedOrder.clientName}</strong> · ${completedOrder.docType}: ${completedOrder.docNum}</p><p class="label">Contacto</p><p>${completedOrder.telefono}${completedOrder.correo ? ' · ' + completedOrder.correo : ''}</p><p class="label">Entrega</p><p>${completedOrder.deliveryType === 'domicilio' ? 'Envío a domicilio' : 'Recojo en tienda'} — ${completedOrder.addressInfo}</p><p class="label">Método de Pago</p><p>${completedOrder.paymentMethod}</p><hr class="divider"><table><thead><tr><th>Producto</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>${itemsRows}<tr class="total-row"><td style="padding-top:12px">TOTAL A PAGAR</td><td style="padding-top:12px;text-align:right;color:#e21a83">S/ ${completedOrder.subtotal?.toFixed(2)}</td></tr></tbody></table><hr class="divider"><p class="footer">Envía este comprobante por WhatsApp para confirmar tu pedido. ¡Gracias por comprar en YuMar Importaciones!</p></body></html>`;
                  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `voucher-yumar-pedido-${completedOrder.id || 'nuevo'}.html`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-heading font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Descargar Voucher
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => { setCompletedOrder(null); setViewMode('shop'); }}
              className="mt-4 w-full text-brand text-sm font-semibold hover:underline text-center print:hidden"
            >
              Volver a la tienda
            </button>
            
            {/* Cutout details for visual style */}
            <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#fcfafb] rounded-full border-r border-slate-200 hidden md:block print:hidden"></div>
            <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#fcfafb] rounded-full border-l border-slate-200 hidden md:block print:hidden"></div>
          </div>
        </main>
      ) : viewMode === 'reclamaciones' ? (
        /* ===== LIBRO DE RECLAMACIONES ===== */
        <main className="w-full max-w-3xl mx-auto px-4 py-10 flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 uppercase tracking-wide">Libro de Reclamaciones</h1>
            <button onClick={() => setViewMode('shop')} className="text-brand text-sm font-heading font-semibold hover:underline flex items-center gap-1">
              ← Regresar a la tienda
            </button>
          </div>

          {reclamoEnviado ? (
            <div className="text-center py-20 bg-brand/5 rounded-2xl border border-brand/20">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-heading font-bold text-slate-800">Reclamo enviado correctamente</h2>
              <p className="text-sm text-slate-500 mt-2">Nos comunicaremos contigo en un plazo máximo de 30 días calendario.</p>
              <button onClick={() => { setReclamoEnviado(false); setViewMode('shop'); }} className="mt-6 bg-brand text-white font-heading font-bold px-6 py-2.5 rounded-lg hover:bg-brand-hover transition">
                Volver a la tienda
              </button>
            </div>
          ) : (
            <form onSubmit={handleReclamoSubmit} className="space-y-6">

              {/* Sección 1 */}
              <div>
                <p className="font-heading font-bold text-slate-800 text-sm uppercase tracking-wide mb-3">Datos de la persona que presenta el reclamo:</p>
                <div className="space-y-3">
                  <input required placeholder="Nombre completo / Razón social*" value={reclamo.nombre} onChange={e => setReclamo(p=>({...p, nombre: e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand" />
                  <select value={reclamo.tipoDoc} onChange={e => setReclamo(p=>({...p, tipoDoc: e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:border-brand">
                    <option>DNI</option><option>RUC</option><option>CE</option><option>Pasaporte</option>
                  </select>
                  <input required placeholder="N°" value={reclamo.numDoc} onChange={e => setReclamo(p=>({...p, numDoc: e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand" />
                  <input required placeholder="Dirección*" value={reclamo.direccion} onChange={e => setReclamo(p=>({...p, direccion: e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand" />
                  <input required placeholder="Departamento*" value={reclamo.departamento} onChange={e => setReclamo(p=>({...p, departamento: e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand" />
                  <input required placeholder="Provincia*" value={reclamo.provincia} onChange={e => setReclamo(p=>({...p, provincia: e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand" />
                  <input required placeholder="Distrito*" value={reclamo.distrito} onChange={e => setReclamo(p=>({...p, distrito: e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand" />
                  <input required placeholder="Teléfono*" value={reclamo.telefono} onChange={e => setReclamo(p=>({...p, telefono: e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand" />
                  <input placeholder="Teléfono fijo" value={reclamo.telefonoFijo} onChange={e => setReclamo(p=>({...p, telefonoFijo: e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand" />
                  <input required type="email" placeholder="Correo*" value={reclamo.correo} onChange={e => setReclamo(p=>({...p, correo: e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand" />
                </div>
              </div>

              {/* Sección 2 */}
              <div>
                <p className="font-heading font-bold text-slate-800 text-sm uppercase tracking-wide mb-3">Información General:</p>
                <p className="text-xs text-slate-500 mb-2">Identificación del bien contratado:</p>
                <div className="space-y-3">
                  <select value={reclamo.tipoBien} onChange={e => setReclamo(p=>({...p, tipoBien: e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:border-brand">
                    <option>Producto</option><option>Servicio</option>
                  </select>
                  <input placeholder="Monto reclamado" value={reclamo.monto} onChange={e => setReclamo(p=>({...p, monto: e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand" />
                  <textarea placeholder="Descripción" rows={4} value={reclamo.descripcion} onChange={e => setReclamo(p=>({...p, descripcion: e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand resize-y" />
                </div>
              </div>

              {/* Sección 3 */}
              <div>
                <p className="font-heading font-bold text-slate-800 text-sm uppercase tracking-wide mb-3">Detalle de su reclamo:</p>
                <div className="space-y-3">
                  <select value={reclamo.tipoReclamo} onChange={e => setReclamo(p=>({...p, tipoReclamo: e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:border-brand">
                    <option>Queja</option><option>Reclamo</option>
                  </select>
                  <textarea required placeholder="Detallar motivo*" rows={4} value={reclamo.motivo} onChange={e => setReclamo(p=>({...p, motivo: e.target.value}))} className="w-full px-4 py-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand resize-y" />
                </div>
              </div>

              {/* Política y botón */}
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="privacidad" checked={reclamo.privacidad} onChange={e => setReclamo(p=>({...p, privacidad: e.target.checked}))} className="mt-0.5 accent-brand" />
                  <label htmlFor="privacidad" className="text-sm text-slate-600">
                    <span className="text-brand font-medium cursor-pointer">Política de privacidad</span> — Acepto la política de privacidad
                  </label>
                </div>
                <button type="submit" className="bg-brand hover:bg-brand-hover text-white font-heading font-bold uppercase tracking-wide px-8 py-3 rounded transition">
                  ENVIAR
                </button>
                <div>
                  <button type="button" onClick={() => setViewMode('shop')} className="text-sm text-brand hover:underline flex items-center gap-1">
                    Regresar a la tienda 🛒
                  </button>
                </div>
              </div>

              {/* Texto legal */}
              <div className="border-t border-slate-100 pt-6 space-y-3 text-sm text-slate-600">
                <p><span className="font-bold text-slate-800">RECLAMO:</span> Disconformidad relacionada a los productos o servicios.</p>
                <p><span className="font-bold text-slate-800">QUEJA:</span> Disconformidad no relacionada a los productos o servicios o malestar o descontento respecto a la atención al público.</p>
                <p className="text-xs text-slate-500 leading-relaxed">La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI. El proveedor deberá dar respuesta al reclamo en un plazo no mayor de treinta (30) días calendario, pudiendo ampliar el plazo hasta por treinta (30) días más, previa comunicación al consumidor.</p>
              </div>

            </form>
          )}
        </main>
      ) : !isAdminAuthenticated ? (
        <main className="w-full px-4 py-20 flex-1 flex items-center justify-center bg-slate-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-100">
            <h2 className="text-2xl font-heading font-extrabold text-slate-900 mb-6 text-center">Admin Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Usuario</label>
                <input 
                  type="text" 
                  value={loginForm.username}
                  onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Contraseña</label>
                <input 
                  type="password" 
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-brand"
                />
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg mt-2 transition">
                Ingresar
              </button>
            </form>
            <button onClick={() => setViewMode('shop')} className="w-full text-center text-xs text-slate-500 hover:text-slate-700 mt-6 font-semibold">
              ← Volver a la Tienda
            </button>
          </div>
        </main>
      ) : (
        // BACKEND / ADMIN VIEW
        <main className="w-full px-3 sm:px-4 py-6 sm:py-10 flex-1">
          {/* Admin Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-extrabold text-slate-900">Panel de Control</h1>
                {webPedidosPendientesCount > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] sm:text-xs font-heading font-black px-2.5 py-1 rounded-full border border-rose-700 flex items-center gap-1.5 shadow-md shadow-rose-600/30 animate-pulse">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    🚨 {webPedidosPendientesCount} {webPedidosPendientesCount === 1 ? 'Nueva solicitud' : 'Nuevas solicitudes'}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Administra inventario, pedidos, reclamos y reseñas.</p>
            </div>
            <button 
              onClick={() => { 
                setViewMode('shop'); 
                setIsAdminAuthenticated(false); 
                localStorage.setItem('yumar_viewMode', 'shop');
                localStorage.setItem('yumar_adminAuth', 'false');
                if (window.location.hash) history.replaceState(null, '', window.location.pathname);
              }}
              className="self-start sm:self-auto bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition shadow-md shadow-rose-600/20 flex items-center gap-1.5"
            >
              🚪 Cerrar Sesión
            </button>
          </div>

          {/* Layout Container: sidebar nav arriba en móvil, lateral en lg */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Navigation Menu: scroll horizontal en móvil, vertical en lg */}
            <aside className="w-full lg:w-56 xl:w-64 shrink-0">
              {/* Móvil: tabs scrollables horizontalmente */}
              <div className="lg:hidden bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
                <div className="flex gap-1 p-2 min-w-max">
                  {[
                    { key: 'analitica', icon: '📊', label: 'Analítica', action: () => { setAdminTab('analitica'); fetchAnalytics(); } },
                    { key: 'productos', icon: '📦', label: 'Inventario', action: () => setAdminTab('productos') },
                    { key: 'pos', icon: '🏪', label: 'POS', action: () => { setAdminTab('pos'); fetchProducts(); } },
                    { key: 'pedidos', icon: '🛒', label: 'Pedidos', action: () => { setAdminTab('pedidos'); fetchPedidosList(); } },
                    { key: 'reclamos', icon: '📢', label: 'Reclamos', action: () => { setAdminTab('reclamos'); fetchReclamosList(); } },
                    { key: 'resenas', icon: '⭐', label: 'Reseñas', action: () => { setAdminTab('resenas'); fetchAdminResenas(); } },
                    { key: 'categorias', icon: '🏷️', label: 'Categorías', action: () => { setAdminTab('categorias'); fetchCategorias(); } },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={tab.action}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-heading font-bold text-xs transition whitespace-nowrap relative ${
                        adminTab === tab.key
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                      {tab.key === 'pedidos' && webPedidosPendientesCount > 0 && (
                        <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                          {webPedidosPendientesCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop: sidebar vertical */}
              <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl p-3 shadow-sm space-y-1">
                <p className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider px-3 pb-2 border-b border-slate-100 mb-2">
                  Administración
                </p>

                <button 
                  type="button"
                  onClick={() => { setAdminTab('analitica'); fetchAnalytics(); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-heading font-bold text-sm transition flex items-center gap-2.5 ${adminTab === 'analitica' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span>📊</span> Big Data / Analítica
                </button>

                <button 
                  type="button"
                  onClick={() => setAdminTab('productos')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-heading font-bold text-sm transition flex items-center gap-2.5 ${adminTab === 'productos' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span>📦</span> Inventario
                </button>

                <button 
                  type="button"
                  onClick={() => { setAdminTab('pos'); fetchProducts(); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-heading font-bold text-sm transition flex items-center gap-2.5 ${adminTab === 'pos' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span>🏪</span> Punto de Venta (POS)
                </button>

                <button 
                  type="button"
                  onClick={() => { setAdminTab('pedidos'); fetchPedidosList(); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-heading font-bold text-sm transition flex items-center justify-between gap-2 ${adminTab === 'pedidos' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <span>🛒</span>
                    <span>Pedidos / Ventas</span>
                  </div>
                  {webPedidosPendientesCount > 0 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                      adminTab === 'pedidos' ? 'bg-rose-500 text-white' : 'bg-rose-600 text-white animate-pulse'
                    }`}>
                      {webPedidosPendientesCount}
                    </span>
                  )}
                </button>

                <button 
                  type="button"
                  onClick={() => { setAdminTab('reclamos'); fetchReclamosList(); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-heading font-bold text-sm transition flex items-center gap-2.5 ${adminTab === 'reclamos' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span>📢</span> Reclamos
                </button>

                <button 
                  type="button"
                  onClick={() => { setAdminTab('resenas'); fetchAdminResenas(); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-heading font-bold text-sm transition flex items-center gap-2.5 ${adminTab === 'resenas' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span>⭐</span> Reseñas
                </button>

                <button 
                  type="button"
                  onClick={() => { setAdminTab('categorias'); fetchCategorias(); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-heading font-bold text-sm transition flex items-center gap-2.5 ${adminTab === 'categorias' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span>🏷️</span> Categorías
                </button>
              </div>
            </aside>

            {/* Right Main Content Area */}
            <div className="flex-1 min-w-0">

          {adminTab === 'productos' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
            
            {/* Left Col: Add Product Form */}
            <div id="admin-form-container" className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm h-fit">
              <h2 className="text-lg font-heading font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                {adminForm.id ? "Editar Producto" : "Agregar Nuevo Producto"}
                {adminForm.id && (
                  <button type="button" onClick={() => setAdminForm({ id: null, nombre: '', precio: '', imagen: '', categoria: 'Tecnología', descripcion: '', badge: 'NUEVO INGRESO', stock: 0 })} className="text-xs text-slate-400 hover:text-brand underline">Cancelar</button>
                )}
              </h2>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-heading font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Nombre del Producto *
                  </label>
                  <input 
                    type="text" 
                    name="nombre"
                    required
                    value={adminForm.nombre}
                    onChange={handleAdminFormChange}
                    placeholder="Ej. Smartwatch Ultra Pro" 
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-heading font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Precio (S/) *
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      name="precio"
                      required
                      value={adminForm.precio}
                      onChange={handleAdminFormChange}
                      placeholder="120.00" 
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Stock *
                    </label>
                    <input 
                      type="number" 
                      name="stock"
                      required
                      value={adminForm.stock}
                      onChange={handleAdminFormChange}
                      placeholder="0" 
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-heading font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Categoría
                  </label>
                  <select 
                    name="categoria"
                    value={adminForm.categoria}
                    onChange={handleAdminFormChange}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-brand"
                  >
                    {categoriesList.filter(c => c !== 'Todos').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-heading font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Imagen del Producto
                  </label>

                  {/* Cloudinary Direct Upload */}
                  <div className="p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl mb-3">
                    <p className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wide mb-2">Subir directo a Cloudinary</p>
                    <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-heading font-bold text-sm cursor-pointer transition ${
                      imageUploading
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-brand text-white hover:bg-brand-hover shadow-md shadow-brand/20'
                    }`}>
                      {imageUploading ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                          </svg>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                          </svg>
                          Elegir foto y subir
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={imageUploading}
                        className="hidden"
                      />
                    </label>
                    {adminForm.imagen && adminForm.imagen.includes('cloudinary.com') && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={optimizeCloudinaryUrl(adminForm.imagen)} alt="preview" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                        <p className="text-[10px] text-emerald-600 font-bold">✅ Imagen subida en Cloudinary</p>
                      </div>
                    )}
                  </div>

                  {/* Or paste URL */}
                  <p className="text-[10px] font-heading font-semibold text-slate-400 uppercase tracking-wide mb-1.5">O pega una URL directamente:</p>
                  <input 
                    type="url" 
                    name="imagen"
                    value={adminForm.imagen}
                    onChange={handleAdminFormChange}
                    placeholder="https://res.cloudinary.com/dtptjmj07/image/upload/..." 
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5">Las imágenes de Cloudinary se optimizan automáticamente (f_auto, q_auto).</p>
                </div>

                <div>
                  <label className="block text-xs font-heading font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Etiqueta / Badge (Opcional)
                  </label>
                  <input 
                    type="text" 
                    name="badge"
                    value={adminForm.badge}
                    onChange={handleAdminFormChange}
                    placeholder="Ej. NUEVO, OFERTA, 10% OFF" 
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-heading font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Descripción
                  </label>
                  <textarea 
                    name="descripcion"
                    rows={4}
                    value={adminForm.descripcion}
                    onChange={handleAdminFormChange}
                    placeholder="Escribe características de este producto..." 
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-brand hover:bg-brand-hover text-white font-heading font-bold text-sm py-2.5 rounded-lg transition shadow-md shadow-brand/10"
                >
                  {adminForm.id ? "Actualizar Producto" : "Guardar Producto"}
                </button>
              </form>
            </div>

            {/* Right Col: Products Table & Stats */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Simple Stats Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm">
                  <span className="text-[9px] sm:text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider">Total Productos</span>
                  <p className="text-lg sm:text-xl md:text-2xl font-heading font-extrabold text-slate-900 mt-1">{products.length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm">
                  <span className="text-[9px] sm:text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider">Promedio S/</span>
                  <p className="text-base sm:text-xl md:text-2xl font-heading font-extrabold text-slate-900 mt-1">
                    {products.length > 0 ? (products.reduce((acc, p) => acc + p.precio, 0) / products.length).toFixed(0) : '0'}
                  </p>
                </div>
                <div className="bg-sky-400 border border-sky-300 rounded-xl p-3 sm:p-4 shadow-sm">
                  <span className="text-[9px] sm:text-[10px] font-heading font-bold text-white uppercase tracking-wider">Stock Total</span>
                  <p className="text-lg sm:text-xl md:text-2xl font-heading font-extrabold text-white mt-1">
                    {products.reduce((acc, p) => acc + (p.stock || 0), 0)}
                  </p>
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="font-heading font-bold text-slate-900">Listado de Inventario</h3>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Buscar producto o categoría..."
                      value={adminProductSearch}
                      onChange={(e) => setAdminProductSearch(e.target.value)}
                      className="flex-1 md:w-64 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-brand bg-slate-50"
                    />
                    <button 
                      onClick={() => fetchProducts()}
                      className="text-xs font-heading font-semibold text-slate-500 hover:text-brand flex items-center gap-1 shrink-0"
                    >
                      Actualizar
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-px">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-[10px] font-heading font-bold uppercase tracking-wider">
                        <th className="px-3 sm:px-6 py-3">Imagen</th>
                        <th className="px-3 sm:px-6 py-3">Nombre</th>
                        <th className="px-3 sm:px-6 py-3 hidden sm:table-cell">Categoría</th>
                        <th className="px-3 sm:px-6 py-3">Precio</th>
                        <th className="px-3 sm:px-6 py-3">Stock</th>
                        <th className="px-3 sm:px-6 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredAdminProducts.map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-3 sm:px-6 py-3.5">
                            <img 
                              src={optimizeCloudinaryUrl(prod.imagen)} 
                              alt="" 
                              loading="lazy"
                              className="w-9 h-9 sm:w-10 sm:h-10 object-cover rounded-lg border border-slate-200"
                            />
                          </td>
                          <td className="px-3 sm:px-6 py-3.5 font-medium text-slate-800">
                            <div className="max-w-[120px] sm:max-w-[180px] truncate text-xs sm:text-sm" title={prod.nombre}>
                              {prod.nombre}
                            </div>
                            {prod.badge && (
                              <span className="inline-block bg-pink-100 text-brand text-[8px] font-heading font-bold uppercase px-1.5 py-0.5 rounded-full mt-1">
                                {prod.badge}
                              </span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3.5 text-slate-500 font-heading font-medium text-xs hidden sm:table-cell">
                            {prod.categoria}
                          </td>
                          <td className="px-3 sm:px-6 py-3.5 font-semibold text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                            S/ {prod.precio.toFixed(2)}
                          </td>
                          <td className="px-3 sm:px-6 py-3.5">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <button
                                type="button"
                                onClick={() => updateStockQuickly(prod.id, Math.max(0, (prod.stock || 0) - 1))}
                                className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg font-bold text-xs transition"
                              >
                                -
                              </button>
                              <span className={`inline-flex items-center justify-center px-1.5 py-0.5 min-w-[28px] text-center rounded-full text-xs font-bold ${
                                (prod.stock || 0) === 0
                                  ? 'bg-rose-100 text-rose-700'
                                  : (prod.stock || 0) <= 5
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {prod.stock || 0}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateStockQuickly(prod.id, (prod.stock || 0) + 1)}
                                className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg font-bold text-xs transition"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3.5 text-right">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-1">
                            <button
                              onClick={() => handleEditProduct(prod)}
                              className="text-brand hover:text-brand-hover font-heading font-bold text-xs hover:underline"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.nombre)}
                              className="text-rose-500 hover:text-rose-700 font-heading font-bold text-xs hover:underline"
                            >
                              Eliminar
                            </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredAdminProducts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-slate-400 text-xs font-heading font-medium">
                            No hay productos en inventario que coincidan con la búsqueda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          ) : adminTab === 'pos' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
              {/* Left Column: Product Grid */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h3 className="font-heading font-bold text-slate-900 text-lg">Catálogo de Productos</h3>
                    <div className="flex flex-1 md:flex-initial items-center gap-2">
                      <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={posSearch}
                        onChange={(e) => setPosSearch(e.target.value)}
                        className="flex-1 md:w-64 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-brand bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-3 mb-4 cat-nav-scroll">
                    {categoriesList.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setPosCategory(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-heading font-semibold whitespace-nowrap transition ${
                          posCategory === cat
                            ? 'bg-brand text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* POS Products Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] sm:max-h-[600px] overflow-y-auto pr-1">
                    {allProducts
                      .filter((prod) => {
                        const matchesCategory = posCategory === 'Todos' || prod.categoria === posCategory;
                        const matchesSearch = prod.nombre.toLowerCase().includes(posSearch.toLowerCase());
                        return matchesCategory && matchesSearch;
                      })
                      .map((prod) => {
                        const isOutOfStock = (prod.stock || 0) <= 0;
                        const cartItem = posCart.find(c => c.id === prod.id);
                        const currentQtyInCart = cartItem ? cartItem.quantity : 0;
                        const effectiveStock = Math.max(0, (prod.stock || 0) - currentQtyInCart);
                        
                        return (
                          <div
                            key={prod.id}
                            onClick={() => { if (!isOutOfStock && effectiveStock > 0) addToPosCart(prod); }}
                            className={`border rounded-xl p-3 flex flex-col justify-between transition h-full cursor-pointer select-none ${
                              isOutOfStock 
                                ? 'bg-slate-50 border-slate-200 opacity-60' 
                                : effectiveStock === 0
                                  ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                                  : 'bg-white border-slate-200 hover:border-brand hover:shadow-sm'
                            }`}
                          >
                            <div>
                              <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden relative mb-2">
                                <img
                                  src={optimizeCloudinaryUrl(prod.imagen || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&q=80")}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                                {isOutOfStock ? (
                                  <span className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white font-heading font-extrabold text-[10px] uppercase px-2 py-1">
                                    Agotado
                                  </span>
                                ) : effectiveStock === 0 ? (
                                  <span className="absolute inset-0 bg-amber-900/40 flex items-center justify-center text-white font-heading font-extrabold text-[10px] uppercase px-2 py-1">
                                    En Carrito
                                  </span>
                                ) : null}
                              </div>
                              <h4 className="font-heading font-bold text-slate-800 text-xs line-clamp-2 leading-snug uppercase mb-1">
                                {prod.nombre}
                              </h4>
                            </div>
                            <div className="mt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-900 font-extrabold text-xs">
                                  S/ {prod.precio.toFixed(2)}
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  isOutOfStock
                                    ? 'bg-rose-100 text-rose-700'
                                    : effectiveStock <= 5
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  Stock: {effectiveStock}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Right Column: POS Cart & Checkout */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="font-heading font-bold text-slate-900 text-lg border-b border-slate-100 pb-3 flex justify-between items-center">
                    <span>Detalle de Venta</span>
                    <span className="bg-brand/10 text-brand text-xs px-2 py-0.5 rounded-full font-bold">
                      {posCart.reduce((sum, item) => sum + item.quantity, 0)} items
                    </span>
                  </h3>

                  {/* Cart Items List */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {posCart.map((item) => (
                      <div key={item.id} className="flex gap-3 items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex gap-2 items-center min-w-0">
                          <img
                            src={optimizeCloudinaryUrl(item.imagen)}
                            alt=""
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-heading font-bold text-slate-800 text-xs truncate max-w-[120px]" title={item.nombre}>
                              {item.nombre}
                            </h4>
                            <p className="text-[10px] text-slate-400">S/ {item.precio.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => updatePosCartQuantity(item.id, -1)}
                            className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-slate-800 w-5 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updatePosCartQuantity(item.id, 1)}
                            className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromPosCart(item.id, item.nombre)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 ml-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {posCart.length === 0 && (
                      <p className="text-center py-6 text-slate-400 text-xs font-heading font-medium">
                        Agrega productos del catálogo para iniciar.
                      </p>
                    )}
                  </div>

                  {/* Calculations */}
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 text-xs font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-slate-800">S/ {posCart.reduce((sum, item) => sum + item.precio * item.quantity, 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Descuento (S/)</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={posDiscount}
                        onChange={(e) => setPosDiscount(e.target.value)}
                        className="w-20 px-2 py-0.5 border border-slate-200 rounded text-right focus:outline-none focus:border-brand font-bold"
                      />
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2.5 text-sm font-extrabold text-slate-900">
                      <span>Total a Pagar</span>
                      <span>
                        S/ {Math.max(0, posCart.reduce((sum, item) => sum + item.precio * item.quantity, 0) - (parseFloat(posDiscount) || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Checkout Form */}
                  <form onSubmit={handlePosCheckout} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-[10px] font-heading font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Nombre del Cliente (Opcional)
                      </label>
                      <input
                        type="text"
                        value={posClient}
                        onChange={(e) => setPosClient(e.target.value)}
                        placeholder="Ej. Jose Tello"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-heading font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Teléfono (Opcional)
                      </label>
                      <input
                        type="text"
                        value={posPhone}
                        onChange={(e) => setPosPhone(e.target.value)}
                        placeholder="Ej. 987654321"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-heading font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Método de Pago
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Efectivo', 'Yape/Plin', 'Transferencia', 'Tarjeta'].map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPosPaymentMethod(method)}
                            className={`py-1.5 rounded-lg border text-center font-heading font-bold text-xs transition ${
                              posPaymentMethod === method
                                ? 'bg-brand/10 border-brand text-brand'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cash received calculator */}
                    {posPaymentMethod === 'Efectivo' && (
                      <div className="bg-sky-50/50 border border-sky-100 p-3.5 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-heading font-semibold text-sky-700 uppercase tracking-wide">
                            Importe Recibido (S/)
                          </label>
                          <input
                            type="number"
                            required
                            step="0.01"
                            value={posCashReceived}
                            onChange={(e) => setPosCashReceived(e.target.value)}
                            placeholder="0.00"
                            className="w-24 px-2 py-1 border border-sky-200 rounded text-right focus:outline-none focus:border-brand text-xs font-bold bg-white"
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-sky-800 border-t border-sky-100/50 pt-2">
                          <span>Vuelto (Cambio)</span>
                          <span className="text-sm font-extrabold text-brand-dark">
                            S/ {Math.max(0, (parseFloat(posCashReceived) || 0) - Math.max(0, posCart.reduce((sum, item) => sum + item.precio * item.quantity, 0) - (parseFloat(posDiscount) || 0))).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={posCart.length === 0}
                      className="w-full bg-brand hover:bg-brand-hover text-white font-heading font-bold text-sm py-2.5 rounded-lg transition shadow-md shadow-brand/10 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                      Registrar Venta (Firma Venta)
                    </button>
                  </form>
                </div>
              </div>
            </div>

          ) : adminTab === 'reclamos' ? (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-heading font-bold text-slate-900">Listado de Reclamos y Quejas</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => fetchReclamosList()} className="text-xs font-heading font-semibold text-slate-500 hover:text-brand">Actualizar</button>
                  <button onClick={clearReclamosHistory} className="text-xs font-heading font-bold bg-rose-50 text-rose-600 px-3 py-1.5 rounded hover:bg-rose-100 transition">🗑️ Vaciar todo</button>
                </div>
              </div>

              <div className="overflow-x-auto -mx-px">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-[10px] font-heading font-bold uppercase tracking-wider">
                      <th className="px-3 sm:px-6 py-3 whitespace-nowrap">Fecha</th>
                      <th className="px-3 sm:px-6 py-3">Cliente</th>
                      <th className="px-3 sm:px-6 py-3 hidden md:table-cell">Contacto</th>
                      <th className="px-3 sm:px-6 py-3">Tipo</th>
                      <th className="px-3 sm:px-6 py-3 hidden sm:table-cell">Motivo</th>
                      <th className="px-3 sm:px-6 py-3">Estado</th>
                      <th className="px-3 sm:px-6 py-3">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {reclamosList.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors align-top">
                        <td className="px-3 sm:px-6 py-3.5 whitespace-nowrap text-xs text-slate-500">
                          {new Date(rec.fecha).toLocaleDateString()}
                        </td>
                        <td className="px-3 sm:px-6 py-3.5">
                          <p className="font-medium text-slate-800 text-xs sm:text-sm">{rec.nombre}</p>
                          <p className="text-[10px] text-slate-500">{rec.tipo_doc} {rec.num_doc}</p>
                        </td>
                        <td className="px-3 sm:px-6 py-3.5 text-slate-600 text-xs hidden md:table-cell">
                          <p>📱 {rec.telefono}</p>
                          <p>✉️ {rec.correo}</p>
                        </td>
                        <td className="px-3 sm:px-6 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${rec.tipo_reclamo === 'Queja' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'}`}>
                            {rec.tipo_reclamo}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3.5 text-xs text-slate-600 max-w-[120px] sm:max-w-xs hidden sm:table-cell">
                          <p className="line-clamp-2" title={rec.motivo}>{rec.motivo}</p>
                        </td>
                        <td className="px-3 sm:px-6 py-3.5">
                          <select 
                            value={rec.estado || 'Pendiente'}
                            onChange={(e) => updateEstadoReclamo(rec.id, e.target.value)}
                            className={`text-xs font-bold rounded px-2 py-1 border-none focus:ring-0 ${
                              rec.estado === 'Resuelto' ? 'bg-emerald-100 text-emerald-700' :
                              rec.estado === 'En Proceso' ? 'bg-sky-100 text-sky-700' :
                              'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Resuelto">Resuelto</option>
                          </select>
                        </td>
                        <td className="px-3 sm:px-6 py-3.5">
                          <button onClick={() => deleteReclamo(rec.id)} className="text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition whitespace-nowrap">🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {reclamosList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-400 text-xs font-heading font-medium">
                          No hay reclamos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : adminTab === 'categorias' ? (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-6">
              <h3 className="font-heading font-bold text-slate-900 mb-6">Gestión de Categorías</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <h4 className="text-sm font-heading font-bold text-slate-700 mb-3">Añadir Nueva Categoría</h4>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const val = e.target.catName.value.trim();
                    if (!val) return;
                    try {
                      await fetch('/api/categorias', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre: val })
                      });
                      fetchCategorias();
                      e.target.reset();
                      showToast('Categoría agregada');
                    } catch (err) { showToast('Error al agregar'); }
                  }} className="flex gap-2">
                    <input name="catName" type="text" placeholder="Ej: Herramientas..." required className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-brand" />
                    <button type="submit" className="bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-brand/20 transition">Añadir</button>
                  </form>
                </div>
                <div>
                  <h4 className="text-sm font-heading font-bold text-slate-700 mb-3">Lista de Categorías Activas</h4>
                  <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {categoriesList.filter(c => c !== 'Todos').map((cat, idx) => (
                      <li key={idx} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-slate-50 transition">
                        <span className="font-medium text-slate-700">{cat}</span>
                        <button onClick={async () => {
                          if (!window.confirm(`¿Estás seguro de eliminar la categoría "${cat}"?`)) return;
                          try {
                            const res = await fetch('/api/categorias');
                            const cats = await res.json();
                            const target = cats.find(c => c.nombre === cat);
                            if (target) {
                              await fetch(`/api/categorias/${target.id}`, { method: 'DELETE' });
                              fetchCategorias();
                              showToast('Categoría eliminada');
                            }
                          } catch (err) { showToast('Error al eliminar'); }
                        }} className="text-rose-500 font-bold text-xs hover:underline bg-rose-50 px-2.5 py-1 rounded">Eliminar</button>
                      </li>
                    ))}
                    {categoriesList.filter(c => c !== 'Todos').length === 0 && (
                      <li className="px-5 py-6 text-center text-slate-400 text-xs">No hay categorías configuradas.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : adminTab === 'pedidos' ? (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-heading font-bold text-slate-900 text-lg">Historial de Ventas</h3>
                    <p className="text-xs text-slate-500">Consulta los pedidos filtrados por canal de venta (Web o POS).</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <input type="text" placeholder="Buscar cliente, teléfono o estado..." value={adminOrderSearch} onChange={(e) => setAdminOrderSearch(e.target.value)} className="flex-1 md:w-64 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-brand bg-slate-50" />
                    <button onClick={exportOrdersCSV} className="text-xs font-heading font-bold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded hover:bg-emerald-100 flex items-center gap-1 transition">⬇️ Exportar CSV</button>
                    <button onClick={() => fetchPedidosList()} className="text-xs font-heading font-semibold text-slate-500 hover:text-brand shrink-0">Actualizar</button>
                    <button onClick={clearPedidosHistory} className="text-xs font-heading font-bold bg-rose-50 text-rose-600 px-3 py-1.5 rounded hover:bg-rose-100 flex items-center gap-1 transition">🗑️ Vaciar historial</button>
                  </div>
                </div>

                {/* Sub-Tabs: Historial Tienda Web vs POS */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setOrderSourceFilter('todos')} 
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-heading font-bold transition flex items-center gap-1 ${orderSourceFilter === 'todos' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    📋 Todos ({pedidosList.length})
                  </button>
                  <button 
                    type="button"
                    onClick={() => setOrderSourceFilter('web')} 
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-heading font-bold transition flex items-center gap-1 ${orderSourceFilter === 'web' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    🌐 Web ({pedidosList.filter(p => !p.metodo_entrega || !p.metodo_entrega.toLowerCase().includes('pos')).length})
                  </button>
                  <button 
                    type="button"
                    onClick={() => setOrderSourceFilter('pos')} 
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-heading font-bold transition flex items-center gap-1 ${orderSourceFilter === 'pos' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    🏪 POS ({pedidosList.filter(p => p.metodo_entrega && p.metodo_entrega.toLowerCase().includes('pos')).length})
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto -mx-px">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-[10px] font-heading font-bold uppercase tracking-wider">
                      <th className="px-3 sm:px-6 py-3 whitespace-nowrap">Fecha</th>
                      <th className="px-3 sm:px-6 py-3">Cliente</th>
                      <th className="px-3 sm:px-6 py-3 hidden md:table-cell">Canal</th>
                      <th className="px-3 sm:px-6 py-3 whitespace-nowrap">Monto</th>
                      <th className="px-3 sm:px-6 py-3 hidden sm:table-cell">Detalle</th>
                      <th className="px-3 sm:px-6 py-3">Estado</th>
                      <th className="px-3 sm:px-6 py-3">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredPedidos.map((ped) => (
                      <tr key={ped.id} className="hover:bg-slate-50/50 transition-colors align-top">
                        <td className="px-3 sm:px-6 py-3.5 whitespace-nowrap text-xs text-slate-600 font-mono">
                          {new Date(ped.fecha).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}
                        </td>
                        <td className="px-3 sm:px-6 py-3.5">
                          <p className="font-medium text-slate-800 text-xs sm:text-sm">{ped.nombre}</p>
                          <p className="text-[10px] text-slate-500">📱 {ped.telefono}</p>
                        </td>
                        <td className="px-3 sm:px-6 py-3.5 hidden md:table-cell">
                          <p className="text-[10px] uppercase font-bold text-slate-500">{ped.metodo_entrega ? ped.metodo_entrega.split('-')[0] : 'Envío'}</p>
                          <p className="text-xs text-slate-700 max-w-[140px] truncate">{ped.metodo_entrega ? ped.metodo_entrega.split('-')[1] : 'Sin especificar'}</p>
                        </td>
                        <td className="px-3 sm:px-6 py-3.5 font-bold text-slate-900 text-xs whitespace-nowrap">S/ {ped.total.toFixed(2)}</td>
                        <td className="px-3 sm:px-6 py-3.5 text-xs text-slate-600 hidden sm:table-cell">
                          <ul className="list-disc pl-4">
                            {ped.detalles && ped.detalles.length > 0 ? ped.detalles.map((d, i) => (
                              <li key={i}>{d.quantity}x {d.nombre}</li>
                            )) : <li>Sin detalles</li>}
                          </ul>
                        </td>
                        <td className="px-3 sm:px-6 py-3.5">
                          <select value={ped.estado || 'Pendiente'} onChange={(e) => updateEstadoPedido(ped.id, e.target.value)} className={`text-xs font-bold rounded px-2 py-1 border-none focus:ring-0 ${ped.estado === 'Entregado' ? 'bg-emerald-100 text-emerald-700' : ped.estado === 'En Camino' ? 'bg-sky-100 text-sky-700' : ped.estado === 'Cancelado' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                            <option value="Pendiente">Pendiente</option>
                            <option value="En Camino">En Camino</option>
                            <option value="Entregado">Entregado</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                        </td>
                        <td className="px-3 sm:px-6 py-3.5">
                          <button onClick={() => deletePedido(ped.id)} className="text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition whitespace-nowrap">🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {filteredPedidos.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-slate-400 text-xs font-heading font-medium">No hay pedidos que coincidan con la búsqueda.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : adminTab === 'resenas' ? (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-heading font-bold text-slate-900">Control de Reseñas</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => fetchAdminResenas()} className="text-xs font-heading font-semibold text-slate-500 hover:text-brand">Actualizar</button>
                  <button onClick={clearResenasHistory} className="text-xs font-heading font-bold bg-rose-50 text-rose-600 px-3 py-1.5 rounded hover:bg-rose-100 transition">🗑️ Vaciar todo</button>
                </div>
              </div>

              <div className="overflow-x-auto -mx-px">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-[10px] font-heading font-bold uppercase tracking-wider">
                      <th className="px-3 sm:px-6 py-3 whitespace-nowrap">Fecha</th>
                      <th className="px-3 sm:px-6 py-3">Autor</th>
                      <th className="px-3 sm:px-6 py-3">Rating</th>
                      <th className="px-3 sm:px-6 py-3 hidden sm:table-cell">Comentario</th>
                      <th className="px-3 sm:px-6 py-3">Visible</th>
                      <th className="px-3 sm:px-6 py-3">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {resenasList.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/50 transition-colors align-top">
                        <td className="px-3 sm:px-6 py-3.5 whitespace-nowrap text-xs text-slate-500">
                          {new Date(res.fecha).toLocaleDateString()}
                        </td>
                        <td className="px-3 sm:px-6 py-3.5">
                          <p className="font-medium text-slate-800 text-xs sm:text-sm">{res.autor}</p>
                        </td>
                        <td className="px-3 sm:px-6 py-3.5 text-xs text-amber-500 whitespace-nowrap">
                          {'★'.repeat(res.calificacion)}{'☆'.repeat(5 - res.calificacion)}
                        </td>
                        <td className="px-3 sm:px-6 py-3.5 text-xs text-slate-600 max-w-[150px] sm:max-w-xs hidden sm:table-cell">
                          <p className="line-clamp-2">{res.comentario}</p>
                        </td>
                        <td className="px-3 sm:px-6 py-3.5">
                          <button 
                            onClick={() => updateAprobacionResena(res.id, !res.aprobado)}
                            className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${res.aprobado ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}
                          >
                            {res.aprobado ? '✅ Público' : '🚫 Oculto'}
                          </button>
                        </td>
                        <td className="px-3 sm:px-6 py-3.5">
                          <button onClick={() => deleteResena(res.id)} className="text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition">🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {resenasList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400 text-xs font-heading font-medium">
                          No hay reseñas registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ANALITICA / BIG DATA DASHBOARD */}
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-6 rounded-2xl shadow-lg border border-indigo-500/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="inline-block bg-indigo-500/20 text-indigo-300 font-mono text-xs px-2.5 py-1 rounded-md border border-indigo-400/30 mb-2 font-bold">
                      ⚡ Big Data & Business Intelligence Dashboard
                    </span>
                    <h2 className="text-xl md:text-2xl font-heading font-extrabold tracking-tight">
                      Análisis de Datos Masivos e Indicadores de Negocio
                    </h2>
                    <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
                      Procesamiento de datos en tiempo real sobre transacciones, catálogo, comportamiento de compra y nivel de satisfacción de clientes.
                    </p>
                  </div>
                  <button
                    onClick={fetchAnalytics}
                    disabled={analyticsLoading}
                    className="self-start md:self-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-600/30 shrink-0"
                  >
                    {analyticsLoading ? '⏳ Cargando...' : '🔄 Actualizar Métricas'}
                  </button>
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:border-indigo-300 transition">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-heading font-bold uppercase tracking-wider">Ingresos Totales</span>
                    <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-lg">💰</span>
                  </div>
                  <p className="text-xl md:text-2xl font-extrabold text-slate-900">
                    S/ {analyticsData?.kpis?.totalVentas?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Acumulado ventas confirmadas</p>
                </div>

                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:border-indigo-300 transition">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-heading font-bold uppercase tracking-wider">Total Pedidos</span>
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg text-lg">📦</span>
                  </div>
                  <p className="text-xl md:text-2xl font-extrabold text-slate-900">
                    {analyticsData?.kpis?.totalPedidos || 0}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px]">
                    <span className="text-amber-600 font-bold">⏳ {analyticsData?.kpis?.pedidosPendientes || 0} pendientes</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:border-indigo-300 transition">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-heading font-bold uppercase tracking-wider">Ticket Promedio</span>
                    <span className="p-2 bg-purple-50 text-purple-600 rounded-lg text-lg">🎟️</span>
                  </div>
                  <p className="text-xl md:text-2xl font-extrabold text-slate-900">
                    S/ {analyticsData?.kpis?.ticketPromedio?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Gasto medio por cliente</p>
                </div>

                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:border-indigo-300 transition">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-heading font-bold uppercase tracking-wider">Satisfacción Cliente</span>
                    <span className="p-2 bg-amber-50 text-amber-600 rounded-lg text-lg">⭐</span>
                  </div>
                  <p className="text-xl md:text-2xl font-extrabold text-slate-900">
                    {`${analyticsData?.kpis?.calificacionPromedio || '0.0'} / 5.0`}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">{analyticsData?.kpis?.totalReclamos || 0} reclamo(s) registrados</p>
                </div>
              </div>

              {/* Section 2: Detailed Charts & Distributions */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Sales by Category */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <h3 className="font-heading font-bold text-slate-900 text-base mb-4 flex items-center justify-between">
                    <span>🏷️ Distribución por Categorías</span>
                    <span className="text-xs font-normal text-slate-500">Agregación Big Data</span>
                  </h3>
                  {analyticsData?.ventasPorCategoria?.length > 0 ? (
                    <div className="space-y-4">
                      {analyticsData.ventasPorCategoria.map((cat, i) => {
                        const maxTotal = Math.max(...analyticsData.ventasPorCategoria.map(c => parseFloat(c.total) || 1));
                        const pct = Math.round(((parseFloat(cat.total) || 0) / maxTotal) * 100);
                        return (
                          <div key={i} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-slate-700">
                              <span>{cat.categoria || 'Sin Categoría'}</span>
                              <span className="font-bold text-slate-900">S/ {parseFloat(cat.total || 0).toFixed(2)} ({cat.cantidad} unids)</span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(8, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-8 text-center">Sin suficiente historial para clasificar por categorías.</p>
                  )}
                </div>

                {/* Top Selling Products */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <h3 className="font-heading font-bold text-slate-900 text-base mb-4 flex items-center justify-between">
                    <span>🔥 Top Productos Más Vendidos</span>
                    <span className="text-xs font-normal text-slate-500">Ranking Algorítmico</span>
                  </h3>
                  {analyticsData?.topProductos?.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {analyticsData.topProductos.map((prod, idx) => (
                        <div key={idx} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            {prod.imagen && (
                              <img src={prod.imagen} alt="" className="w-9 h-9 object-cover rounded-lg border border-slate-200 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{prod.nombre}</p>
                              <p className="text-[10px] text-slate-500">{prod.categoria}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="block text-xs font-extrabold text-slate-900">{prod.cantidad_vendida} vendid.</span>
                            <span className="text-[10px] text-emerald-600 font-semibold">S/ {parseFloat(prod.ingreso_total || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-8 text-center">Registra ventas para ver los productos líderes.</p>
                  )}
                </div>
              </div>

              {/* Section 3: Payment Methods & Recent Log */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Payment methods */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs lg:col-span-1">
                  <h3 className="font-heading font-bold text-slate-900 text-base mb-4">💳 Métodos de Pago</h3>
                  {analyticsData?.ventasPorMetodoPago?.length > 0 ? (
                    <div className="space-y-3">
                      {analyticsData.ventasPorMetodoPago.map((m, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800 capitalize">{m.metodo ? m.metodo.replace('_', ' - ') : 'Efectivo'}</p>
                            <p className="text-[10px] text-slate-500">{m.cantidad} transacción(es)</p>
                          </div>
                          <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                            S/ {parseFloat(m.total || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">Sin transacciones procesadas.</p>
                  )}
                </div>

                {/* Real-time Order Stream */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs lg:col-span-2">
                  <h3 className="font-heading font-bold text-slate-900 text-base mb-4 flex items-center justify-between">
                    <span>⚡ Flujo Reciente de Datos (Pedidos)</span>
                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">En Vivo</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[9px]">
                          <th className="p-2">ID</th>
                          <th className="p-2">Fecha y Hora</th>
                          <th className="p-2">Cliente</th>
                          <th className="p-2">Monto</th>
                          <th className="p-2">Pago</th>
                          <th className="p-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analyticsData?.pedidosRecientes?.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="p-2 font-mono text-slate-400">#{p.id}</td>
                            <td className="p-2 font-mono text-[10px] text-slate-500">{new Date(p.fecha).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                            <td className="p-2 font-medium text-slate-800">{p.nombre}</td>
                            <td className="p-2 font-bold text-slate-900">S/ {parseFloat(p.total).toFixed(2)}</td>
                            <td className="p-2 capitalize text-slate-600">{p.metodo_pago ? p.metodo_pago.replace('_', ' ') : 'Efectivo'}</td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                p.estado === 'Entregado' ? 'bg-emerald-100 text-emerald-700' :
                                p.estado === 'Cancelado' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {p.estado || 'Pendiente'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(!analyticsData?.pedidosRecientes || analyticsData.pedidosRecientes.length === 0) && (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-400">Sin datos de pedidos recientes.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )}


      {/* Trust Badges - estilo Kafi */}
      {viewMode === 'shop' && (
        <section className="bg-slate-900 py-4 md:py-6">
          <div className="w-full px-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-4 gap-x-2 md:gap-x-4">
            {[
              { title: 'Delivery', sub: 'a todo el Perú', icon: '🚚' },
              { title: 'Tu compra', sub: '100% segura', icon: '🔒' },
              { title: 'Asistencia', sub: 'personalizada', icon: '💬' },
              { title: 'Clientes', sub: 'satisfechos', icon: '⭐' },
              { title: 'Libro de', sub: 'reclamaciones', icon: '📖' },
            ].map((item) => (
              <div
                key={item.title}
                className={`flex flex-row items-center space-x-2 ${item.title === 'Libro de' ? 'cursor-pointer hover:opacity-80 transition' : ''}`}
                onClick={() => {
                  if (item.title === 'Libro de') {
                    setViewMode('reclamaciones');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                <span className="text-2xl flex-shrink-0 select-none">{item.icon}</span>
                <div className="flex flex-col items-start min-w-0">
                  <h4 className="font-heading font-bold text-sm text-brand">{item.title}</h4>
                  <p className="text-xs text-white">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer - estilo Grupo Kafi con fondo negro */}
      <footer className="bg-slate-900 pt-8 md:pt-10 pb-6 mt-auto print:hidden">
        <div className="w-full px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div>
            <h4 className="font-heading font-bold text-xs md:text-sm text-brand mb-2 md:mb-3">📞 Teléfono</h4>
            <a href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`} className="text-xs md:text-sm text-white hover:text-brand transition">
              +51 967 227 469
            </a>
            <h4 className="font-heading font-bold text-xs md:text-sm text-brand mt-3 md:mt-4 mb-2">📧 Correo electrónico</h4>
            <a href="mailto:Yumarperu@gmail.com" className="text-xs md:text-sm text-white hover:text-brand transition block">
              Yumarperu@gmail.com
            </a>
          </div>

          <div>
            <h4 className="font-heading font-bold text-xs md:text-sm text-brand mb-2 md:mb-3">📦 Nuestras categorías</h4>
            <ul className="text-xs md:text-sm space-y-1.5">
              {navCategories.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => { setViewMode('shop'); setCurrentCategory(cat); closeProduct(); }}
                    className="text-white hover:text-brand transition text-left"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-xs md:text-sm text-brand mb-2 md:mb-3">🔗 Enlaces de interés</h4>
            <ul className="text-xs md:text-sm space-y-1.5 text-white">
              <li><a href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`} className="hover:text-brand transition">Cómo comprar</a></li>
              <li><span className="hover:text-brand cursor-pointer">Políticas de privacidad</span></li>
              <li><span className="hover:text-brand cursor-pointer">Medios de pago</span></li>
              <li><span className="hover:text-brand cursor-pointer">Sobre los envíos</span></li>
              <li>
                <button
                  onClick={() => { setViewMode('reclamaciones'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-brand transition text-left"
                >
                  📖 Libro de reclamaciones
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-xs md:text-sm text-brand mb-2 md:mb-3">💬 Contáctanos</h4>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Hola,%20necesito%20información%20sobre%20sus%20productos.`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-xs font-heading font-bold px-3 md:px-4 py-2 md:py-2.5 rounded transition"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.446L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.623-1.023-5.086-2.884-6.948C16.59 2.012 14.125.99 11.516.99c-5.44 0-9.864 4.372-9.868 9.8.001 1.93.524 3.818 1.513 5.497L2.122 21.9l5.7-1.494z"/></svg>
              WhatsApp
            </a>
            <p className="text-[10px] md:text-xs text-slate-400 mt-2 md:mt-3 leading-relaxed">
              Envíos a nivel nacional vía Olva Courier, Shalom o transportes de confianza.
            </p>
          </div>
        </div>

        <div className="w-full px-4 pt-6 md:pt-8 pb-4 md:pb-6 border-t border-slate-800">
          <div className="text-center">
            <span className="font-cursive text-lg md:text-xl text-brand block mb-2 md:mb-3">YuMar Importaciones</span>
            <p className="text-[9px] md:text-[10px] text-slate-400 font-heading inline-flex items-center gap-1.5 justify-center">
              © {new Date().getFullYear()} YuMar Importaciones. Todos los derechos reservados.
              <button
                onClick={() => { setViewMode('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                title="Panel de administración"
                className="inline-flex items-center text-slate-600 hover:text-slate-300 transition-colors duration-200 group"
                aria-label="Panel de administración"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 group-hover:rotate-45 transition-transform duration-300">
                  <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.855 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
                </svg>
              </button>
            </p>
          </div>
        </div>
      </footer>

      {/* SIDEBAR NAVIGATION DRAWER (LEFT SIDE) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex animate-fade-in">
          {/* Backdrop */}
          <div 
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          ></div>
          
          {/* Drawer Body */}
          <div className="relative w-72 max-w-xs bg-white h-full flex flex-col p-6 shadow-2xl animate-slide-in-left">
            {/* Drawer Close */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Brand Logo in Menu */}
            <div className="mb-8 select-none">
              <span className="font-cursive text-2xl text-brand leading-none">
                YuMar Importaciones
              </span>
              <p className="text-[9px] uppercase tracking-widest font-heading font-bold text-slate-400 mt-1">
                Catálogo Digital
              </p>
            </div>
            
            {/* Search Input inside drawer */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); setSidebarOpen(false); }}
              className="mb-6 flex border border-slate-200 rounded-lg overflow-hidden focus-within:border-brand"
            >
              <input 
                type="text" 
                placeholder="Buscar novedades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 text-xs focus:outline-none bg-slate-50"
              />
              <button className="bg-slate-900 text-white px-3.5 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
                </svg>
              </button>
            </form>
            
            {/* Nav list */}
            <nav className="flex-1">
              <span className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest mb-3">Categorías</span>
              <ul className="space-y-1">
                {categories.map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => {
                        setCurrentCategory(cat);
                        setViewMode('shop');
                        closeProduct();
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 rounded-lg text-sm font-heading font-semibold transition-all ${
                        currentCategory === cat 
                          ? 'bg-pink-50 text-brand' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            
            {/* Footer menu details */}
            <div className="border-t border-slate-100 pt-4 mt-auto">
              <span className="block text-[10px] text-slate-400 font-heading">¿Necesitas ayuda?</span>
              <a 
                href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 mt-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-xs font-heading font-bold transition"
              >
                {/* SVG WhatsApp Logo */}
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.446L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.623-1.023-5.086-2.884-6.948C16.59 2.012 14.125.99 11.516.99c-5.44 0-9.864 4.372-9.868 9.8.001 1.93.524 3.818 1.513 5.497L2.122 21.9l5.7-1.494z" />
                </svg>
                <span>Chatear por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* SHOPPING CART DRAWER (RIGHT SIDE) */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          {/* Backdrop */}
          <div 
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          ></div>
          
          {/* Drawer Body */}
          <div className="relative w-80 max-w-sm bg-white h-full flex flex-col shadow-2xl animate-slide-in-right">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-slate-950 text-base">Carrito de Compras</h3>
                <span className="text-[10px] font-heading font-semibold text-slate-400 uppercase tracking-wider">
                  {cartCount} {cartCount === 1 ? 'Artículo' : 'Artículos'}
                </span>
              </div>
              
              <button 
                onClick={() => setCartOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 animate-fade-in">
                  
                  {/* Thumbnail */}
                  <img 
                    src={optimizeCloudinaryUrl(item.imagen)} 
                    alt="" 
                    loading="lazy"
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200 bg-white"
                  />
                  
                  {/* Info details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-slate-800 text-xs line-clamp-1">
                        {item.nombre}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-heading block mt-0.5">
                        S/ {item.precio.toFixed(2)} c/u
                      </span>
                    </div>
                    
                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-200 rounded-md bg-white">
                        <button 
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="px-2 py-0.5 text-slate-500 hover:bg-slate-50 transition"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="px-2 py-0.5 text-slate-500 hover:bg-slate-50 transition"
                        >
                          +
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.id, item.nombre)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0M4.5 18v.008H4.51V18H4.5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                </div>
              ))}
              
              {cart.length === 0 && (
                <div className="text-center py-20">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>
                  <p className="text-xs font-heading font-medium text-slate-400">Tu carrito está completamente vacío.</p>
                  <button 
                    onClick={() => setCartOpen(false)}
                    className="mt-4 bg-slate-900 text-white text-xs font-heading font-semibold px-4 py-2 rounded-lg"
                  >
                    Seguir explorando
                  </button>
                </div>
              )}
            </div>
            
            {/* Footer Pricing & Actions */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-heading font-bold text-slate-500 uppercase">Subtotal</span>
                  <span className="font-heading font-extrabold text-slate-950 text-lg">
                    S/ {cartTotal.toFixed(2)}
                  </span>
                </div>
                
                <button 
                  onClick={() => {
                    setViewMode('checkout');
                    setCartOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white py-3.5 rounded-xl font-heading font-bold text-sm shadow-lg shadow-brand/10 transition"
                >
                  <span>Finalizar Compra</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
                
                <p className="text-[10px] text-center text-slate-400 mt-4">
                  Completa tu pedido y datos de envío en el siguiente paso.
                </p>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL - removed, now inline page view */}



      {/* POS Voucher Receipt Modal */}
      {posActiveVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl relative border border-slate-100 flex flex-col max-h-[90vh]">
            <button
              onClick={() => setPosActiveVoucher(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
              title="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Printable Area */}
            <div id="pos-voucher-printable" className="flex-1 overflow-y-auto pr-1 py-4 text-center font-mono text-xs text-slate-800">
              <h2 className="font-heading font-extrabold text-lg text-slate-955 tracking-tight">YUMAR IMPORTACIONES</h2>
              <p className="text-[10px] text-slate-400 mb-2">RUC: 20614188465</p>
              <p className="text-[9px] text-slate-400">Lima, Perú</p>
              <p className="text-[9px] text-slate-400">WhatsApp: +51 967 227 469</p>
              
              <div className="border-b border-dashed border-slate-200 my-4"></div>

              <div className="text-left space-y-1 text-[10px]">
                <p><strong>TICKET:</strong> #POS-{posActiveVoucher.id}</p>
                <p><strong>FECHA:</strong> {new Date(posActiveVoucher.fecha).toLocaleString()}</p>
                <p><strong>CLIENTE:</strong> {posActiveVoucher.cliente}</p>
                {posActiveVoucher.telefono && <p><strong>TELÉFONO:</strong> {posActiveVoucher.telefono}</p>}
              </div>

              <div className="border-b border-dashed border-slate-200 my-4"></div>

              {/* Items Table */}
              <table className="w-full text-[10px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 font-bold">
                    <th className="pb-1">Cant. / Producto</th>
                    <th className="text-right pb-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {posActiveVoucher.detalles.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100/50">
                      <td className="py-1.5 pr-2">
                        <div>{item.nombre}</div>
                        <div className="text-[9px] text-slate-400">{item.quantity} x S/ {item.precio.toFixed(2)}</div>
                      </td>
                      <td className="text-right py-1.5 font-bold">S/ {(item.quantity * item.precio).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-b border-dashed border-slate-200 my-4"></div>

              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>S/ {posActiveVoucher.subtotal.toFixed(2)}</span>
                </div>
                {posActiveVoucher.descuento > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>DESCUENTO:</span>
                    <span>- S/ {posActiveVoucher.descuento.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-extrabold text-slate-950 pt-1.5 border-t border-slate-200/50">
                  <span>TOTAL A PAGAR:</span>
                  <span>S/ {posActiveVoucher.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-200 my-4"></div>

              <div className="text-left space-y-1 text-[9px] text-slate-500">
                <p><strong>MÉTODO DE PAGO:</strong> {posActiveVoucher.metodoPago}</p>
                {posActiveVoucher.metodoPago === 'Efectivo' && (
                  <>
                    <p><strong>EFECTIVO RECIBIDO:</strong> S/ {posActiveVoucher.efectivoRecibido.toFixed(2)}</p>
                    <p><strong>CAMBIO:</strong> S/ {posActiveVoucher.cambio.toFixed(2)}</p>
                  </>
                )}
              </div>

              <div className="mt-6 text-center text-[10px] text-slate-400">
                <p>¡Gracias por su compra!</p>
                <p className="mt-1">Yumar Importaciones</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2 pt-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const printContents = document.getElementById('pos-voucher-printable').innerHTML;
                  
                  const win = window.open('', '_blank');
                  win.document.write(`
                    <html>
                      <head>
                        <title>Ticket POS</title>
                        <style>
                          body { font-family: monospace; padding: 20px; width: 300px; margin: 0 auto; color: #333; }
                          table { width: 100%; border-collapse: collapse; }
                          .text-right { text-align: right; }
                          .border-b { border-bottom: 1px solid #ddd; }
                          .border-b-dashed { border-bottom: 1px dashed #ccc; }
                          .my-4 { margin: 15px 0; }
                          .mt-6 { margin-top: 25px; }
                          .text-center { text-align: center; }
                          h2 { margin: 0; font-size: 16px; }
                          p { margin: 3px 0; font-size: 11px; }
                        </style>
                      </head>
                      <body>
                        ${printContents}
                        <script>
                          window.onload = function() {
                            window.print();
                            window.close();
                          }
                        </script>
                      </body>
                    </html>
                  `);
                  win.document.close();
                }}
                className="flex-1 bg-brand hover:bg-brand-hover text-white font-heading font-bold text-xs py-2.5 rounded-lg transition text-center"
              >
                Imprimir Ticket
              </button>
              <button
                type="button"
                onClick={() => setPosActiveVoucher(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-xs py-2.5 rounded-lg transition text-center"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASISTENTE VIRTUAL IA (YumarIA) - Componente Aislado */}
      <AiChatWidget addToCart={addToCart} cartOpen={cartOpen} viewMode={viewMode} />

      {/* FLOATING TOAST SYSTEM */}
      {toast.show && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-heading font-semibold px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-slate-800 animate-scale-up">
          <span className="w-2 h-2 bg-brand rounded-full animate-ping"></span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// COMPONENTE AISLADO PARA EVITAR RE-RENDERS AL ESCRIBIR EN LA IA
function AiChatWidget({ addToCart, cartOpen, viewMode }) {
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    {
      sender: 'bot',
      text: '¡Hola! 👋 Soy **YumarIA**, tu asistente de compras en Yumar Importaciones. ¿En qué te puedo ayudar hoy?'
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (aiChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, aiLoading, aiChatOpen]);

  const handleSpeak = (index, text) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#•📦📂💰📊📝]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendAiMessage = async (e, customMsg = null) => {
    if (e) e.preventDefault();
    const textToSend = customMsg || aiInput.trim();
    if (!textToSend || aiLoading) return;

    const newHistory = [...aiMessages, { sender: 'user', text: textToSend }];
    setAiMessages(newHistory);
    if (!customMsg) setAiInput('');
    setAiLoading(true);

    try {
      const formattedHistory = newHistory.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: formattedHistory.slice(-6)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiMessages(prev => [...prev, { sender: 'bot', text: data.reply, products: data.products }]);
      } else {
        setAiMessages(prev => [...prev, { sender: 'bot', text: 'Lo siento, ocurrió un inconveniente. Intenta de nuevo por favor.' }]);
      }
    } catch (err) {
      setAiMessages(prev => [...prev, { sender: 'bot', text: 'No se pudo conectar con el servidor de IA.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  if (cartOpen || viewMode === 'admin') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Drawer */}
      {aiChatOpen && (
        <div className="w-[92vw] sm:w-96 h-[460px] max-h-[calc(100vh-130px)] mb-3 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scale-up">
          {/* Header */}
          <div className="shrink-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 p-3.5 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-inner">
                <img src="/mascota-yumar.png" alt="YumarIA" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xs sm:text-sm leading-tight flex items-center gap-1.5">
                  YumarIA <span className="text-[9px] bg-emerald-400 text-slate-900 px-2 py-0.5 rounded-full font-bold">En Línea ⚡</span>
                </h3>
                <p className="text-[10px] text-white/80">Asistente de compras interactivo</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAiChatOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition"
            >
              ✕
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 min-h-0 p-3.5 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {aiMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl relative group ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                      : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-slate-200/80'
                  }`}
                >
                  <div className="whitespace-pre-line leading-relaxed pr-5">
                    {msg.text.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
                  </div>

                  {/* Botón de Voz en mensajes de la IA */}
                  {msg.sender === 'bot' && (
                    <button
                      type="button"
                      onClick={() => handleSpeak(index, msg.text)}
                      title="Escuchar respuesta"
                      className="absolute top-2 right-2 text-slate-400 hover:text-indigo-600 transition text-xs p-1 rounded-full hover:bg-slate-100"
                    >
                      {speakingIndex === index ? '⏹️' : '🔊'}
                    </button>
                  )}

                  {/* Tarjetas Interactivas de Producto en Chat */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-slate-100">
                      {msg.products.map((p) => (
                        <div key={p.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/90 flex items-center justify-between gap-2 shadow-xs hover:border-indigo-300 transition">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {p.imagen ? (
                              <img src={p.imagen} alt={p.nombre} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-sm shrink-0">🛍️</div>
                            )}
                            <div className="min-w-0">
                              <h4 className="font-bold text-[11px] text-slate-900 truncate leading-tight">{p.nombre}</h4>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-semibold">{p.categoria || 'General'}</span>
                                <span className="font-bold text-slate-900">S/{parseFloat(p.precio).toFixed(2)}</span>
                              </div>
                              <p className="text-[9px] mt-0.5">
                                {p.stock > 0 ? <span className="text-emerald-600 font-semibold">✅ Stock: {p.stock} unid.</span> : <span className="text-rose-500 font-semibold">❌ Agotado</span>}
                              </p>
                            </div>
                          </div>
                          {p.stock > 0 && (
                            <button
                              type="button"
                              onClick={() => addToCart(p, 1)}
                              className="shrink-0 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold px-2.5 py-1.5 rounded-lg text-[10px] transition shadow-xs flex items-center gap-1"
                            >
                              🛒 Agregar
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Acceso a WhatsApp directo en bot */}
                  {msg.sender === 'bot' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between gap-2">
                      <a
                        href="https://wa.me/51967227469?text=Hola%20Yumar%20Importaciones,%20quisiera%20consultar%20sobre%20sus%20productos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] transition shadow-xs"
                      >
                        💬 Hablar por WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-200 flex items-center gap-2 text-slate-500">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestions Chips */}
          <div className="shrink-0 px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() => handleSendAiMessage(null, "¿Qué productos me recomiendas para gamer?")}
              className="whitespace-nowrap bg-purple-100 hover:bg-purple-200 text-purple-800 px-2.5 py-1 rounded-full border border-purple-300 font-semibold transition"
            >
              🎮 Gamer & Tech
            </button>
            <button
              type="button"
              onClick={() => handleSendAiMessage(null, "Muestra productos de la sección Tecnología")}
              className="whitespace-nowrap bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200/60 font-medium transition"
            >
              💻 Tecnología
            </button>
            <button
              type="button"
              onClick={() => handleSendAiMessage(null, "Ver ofertas y productos con descuento")}
              className="whitespace-nowrap bg-amber-50 hover:bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200/60 font-medium transition"
            >
              🔥 Ofertas
            </button>
            <button
              type="button"
              onClick={() => handleSendAiMessage(null, "¿Qué productos tienen en la sección Hogar?")}
              className="whitespace-nowrap bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200/60 font-medium transition"
            >
              🏠 Hogar
            </button>
            <button
              type="button"
              onClick={() => handleSendAiMessage(null, "¿Cuáles son los medios de pago?")}
              className="whitespace-nowrap bg-cyan-50 hover:bg-cyan-100 text-cyan-700 px-2.5 py-1 rounded-full border border-cyan-200/60 font-medium transition"
            >
              💳 Medios de Pago
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendAiMessage} className="shrink-0 p-2.5 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              placeholder="Escribe tu mensaje a YumarIA..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className="flex-1 bg-slate-100 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-transparent focus:border-indigo-500 focus:bg-white focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={!aiInput.trim() || aiLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center transition shadow-sm"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Button - Mascota */}
      {!aiChatOpen && (
        <div className="animate-bounce-slow flex flex-col items-end gap-1">
          <div className="bg-white text-slate-800 text-sm sm:text-base font-heading font-bold px-4 py-3 rounded-2xl shadow-lg border border-slate-200 relative whitespace-nowrap">
            ¡Hola! 👋 ¿En qué puedo ayudarte?
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r border-b border-slate-200 transform rotate-45"></div>
          </div>
          <button
            type="button"
            onClick={() => setAiChatOpen(true)}
            className="relative hover:scale-110 active:scale-95 transition-all duration-300 group"
          >
            <img
              src="/mascota-yumar.png"
              alt="Asistente Yumar"
              className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-xl"
            />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
            </span>
          </button>
        </div>
      )}
      {aiChatOpen && (
        <button
          type="button"
          onClick={() => setAiChatOpen(false)}
          className="relative hover:scale-110 active:scale-95 transition-all duration-300"
        >
          <img
            src="/mascota-yumar.png"
            alt="Asistente Yumar"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-xl"
          />
        </button>
      )}
    </div>
  );
}

export default App;
