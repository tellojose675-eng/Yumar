import { useState, useEffect } from 'react';

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
  const [viewMode, setViewMode] = useState('shop'); // 'shop', 'admin' or 'reclamaciones'
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
  const [adminTab, setAdminTab] = useState('productos');
  const [reclamosList, setReclamosList] = useState([]);
  const [pedidosList, setPedidosList] = useState([]);
  const [resenasList, setResenasList] = useState([]);

  // Login State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Checkout State
  const [checkoutForm, setCheckoutForm] = useState({ nombre: '', telefono: '', correo: '' });
  
  // Reseñas State
  const [productResenas, setProductResenas] = useState([]);
  const [resenaForm, setResenaForm] = useState({ autor: '', calificacion: 5, comentario: '' });
  
  // Toast Alert State
  const [toast, setToast] = useState({ show: false, message: '' });

  // WhatsApp Config
  const WHATSAPP_NUMBER = "+51967227469"; // Customizable contact phone number for Yumar Importaciones

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem('yumar_cart', JSON.stringify(cart));
  }, [cart]);

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
    if (!checkoutForm.nombre || !checkoutForm.telefono) {
      showToast("Por favor ingresa tu nombre y teléfono.");
      return;
    }
    
    try {
      // Save order to DB
      await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...checkoutForm,
          total: cartTotal,
          detalles: cart
        })
      });
      
      // WhatsApp message
      let text = `*🛍️ NUEVO PEDIDO - YuMar Importaciones*\n\n`;
      text += `*Cliente:* ${checkoutForm.nombre}\n`;
      text += `*Teléfono:* ${checkoutForm.telefono}\n\n`;
      text += `Hola, quiero realizar un pedido de los siguientes productos:\n\n`;
      
      let subtotal = 0;
      cart.forEach((item, index) => {
        const itemTotal = item.precio * item.quantity;
        subtotal += itemTotal;
        text += `*${index + 1}. ${item.nombre}*\n`;
        text += `   Cant: ${item.quantity} | P. Unit: S/ ${item.precio.toFixed(2)}\n`;
        text += `   Subtotal: *S/ ${itemTotal.toFixed(2)}*\n\n`;
      });
      
      text += `-----------------------------------\n`;
      text += `*💰 TOTAL A PAGAR: S/ ${subtotal.toFixed(2)}*\n\n`;
      text += `Por favor, confírmenme la disponibilidad y los métodos de pago. ¡Gracias!`;
      
      window.open(`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(text)}`, '_blank');
      
      setCart([]);
      setCartOpen(false);
      
      // Refresh inventory so stock updates locally
      fetchProducts();
      fetchAllProducts();
      
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Computed Values
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.precio * item.quantity, 0);
  const categories = ['Todos', 'Tecnología', 'Hogar', 'Belleza', 'Deporte', 'Repostería', 'Ferretería', 'Productos para niños', 'Cocina'];
  const navCategories = categories.filter(c => c !== 'Todos');

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

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white w-full">

      {/* Sticky Header Block */}
      <div className="sticky-header">
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

              {/* MI CUENTA / Admin */}
              <button
                onClick={() => setViewMode(prev => prev === 'shop' ? 'admin' : 'shop')}
                className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6" style={{ color: '#0ea5e9' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <span className="text-xs font-heading font-bold uppercase tracking-wide" style={{ color: '#0ea5e9' }}>
                  {viewMode === 'admin' ? 'Tienda' : 'Mi Cuenta'}
                </span>
              </button>

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

      {/* Promo Banner - estilo tienda Kafi */}
      {viewMode === 'shop' && !selectedProduct && (
        <section className="bg-gradient-to-r from-brand/5 via-pink-50 to-brand/5 border-b border-pink-100">
          <div className="w-full px-4 py-3 md:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <p className="text-xs font-heading font-bold text-brand uppercase tracking-widest">Importaciones directas</p>
              <p className="text-sm md:text-base font-heading font-semibold text-slate-800 mt-0.5">
                Envíos a todo el Perú · Productos con garantía
              </p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Hola,%20quiero%20información%20sobre%20sus%20productos%20importados.`}
              target="_blank"
              rel="noreferrer"
              className="bg-brand hover:bg-brand-hover text-white text-xs font-heading font-bold px-5 py-2.5 rounded transition whitespace-nowrap"
            >
              Consultar por WhatsApp
            </a>
          </div>
        </section>
      )}

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
                        src={selectedProduct.imagen || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&q=80"}
                        alt={selectedProduct.nombre}
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
                        setCartOpen(true);
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
                                src={item.imagen}
                                alt=""
                                className="w-14 h-14 object-cover rounded border border-slate-100 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-[11px] font-heading font-semibold text-slate-700 uppercase line-clamp-2 group-hover:text-brand transition">
                                  {item.nombre}
                                </p>
                                <p className="text-sm font-heading font-bold text-slate-900 mt-0.5">
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
                          className="kafi-card bg-white text-left group"
                        >
                          <div className="aspect-square bg-slate-50 border border-slate-100 rounded overflow-hidden mb-2 relative">
                            {prod.badge && (
                              <span className="absolute top-1 left-1 z-10 bg-brand text-white text-[8px] font-bold uppercase px-1.5 py-0.5">
                                {prod.badge}
                              </span>
                            )}
                            <img src={prod.imagen} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <p className="text-[10px] font-heading font-semibold text-slate-700 uppercase line-clamp-2 leading-tight group-hover:text-brand transition">
                            {prod.nombre}
                          </p>
                          <p className="text-sm font-heading font-bold text-slate-900 mt-1">
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
                      <div key={product.id} className="kafi-card bg-white group">
                        <div
                          className="aspect-square bg-slate-50 border border-slate-100 rounded overflow-hidden relative cursor-pointer"
                          onClick={() => openProduct(product)}
                        >
                          {product.badge && (
                            <span className="absolute top-2 left-2 z-10 bg-brand text-white font-heading font-bold text-[8px] uppercase px-2 py-0.5">
                              {product.badge}
                            </span>
                          )}
                          <img
                            src={product.imagen || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&q=80"}
                            alt={product.nombre}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        <div className="pt-2.5 px-0.5">
                          <h3
                            className="font-heading font-semibold text-slate-800 text-[11px] md:text-xs uppercase line-clamp-2 leading-tight cursor-pointer group-hover:text-brand transition-colors min-h-[2.5em]"
                            onClick={() => openProduct(product)}
                          >
                            {product.nombre}
                          </h3>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-heading font-bold text-sm md:text-base text-slate-900">
                              S/ {product.precio.toFixed(2)}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
                              className="bg-brand hover:bg-brand-hover text-white p-1.5 rounded transition sm:opacity-0 sm:group-hover:opacity-100"
                              title="Agregar al carrito"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                            </button>
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
        <main className="w-full px-4 py-10 flex-1">
          <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900">Panel de Control</h1>
              <p className="text-sm text-slate-500">Administra inventario, pedidos, reclamos y reseñas.</p>
            </div>
            <button 
              onClick={() => { setViewMode('shop'); setIsAdminAuthenticated(false); }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-xs md:text-sm px-4 py-2.5 rounded-lg transition"
            >
              Cerrar Sesión
            </button>
          </div>

          <div className="flex gap-4 mb-6 border-b border-slate-200 overflow-x-auto cat-nav-scroll">
            <button 
              onClick={() => setAdminTab('productos')}
              className={`pb-3 whitespace-nowrap font-heading font-bold text-sm transition-colors border-b-2 ${adminTab === 'productos' ? 'text-brand border-brand' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
            >
              Inventario
            </button>
            <button 
              onClick={() => { setAdminTab('pedidos'); fetchPedidosList(); }}
              className={`pb-3 whitespace-nowrap font-heading font-bold text-sm transition-colors border-b-2 ${adminTab === 'pedidos' ? 'text-brand border-brand' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
            >
              Pedidos
            </button>
            <button 
              onClick={() => { setAdminTab('reclamos'); fetchReclamosList(); }}
              className={`pb-3 whitespace-nowrap font-heading font-bold text-sm transition-colors border-b-2 ${adminTab === 'reclamos' ? 'text-brand border-brand' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
            >
              Reclamos
            </button>
            <button 
              onClick={() => { setAdminTab('resenas'); fetchAdminResenas(); }}
              className={`pb-3 whitespace-nowrap font-heading font-bold text-sm transition-colors border-b-2 ${adminTab === 'resenas' ? 'text-brand border-brand' : 'text-slate-500 border-transparent hover:text-slate-800'}`}
            >
              Reseñas
            </button>
          </div>

          {adminTab === 'productos' ? (
            <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Col: Add Product Form */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
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
                    <option value="Tecnología">Tecnología</option>
                    <option value="Hogar">Hogar</option>
                    <option value="Belleza">Belleza</option>
                    <option value="Deporte">Deporte</option>
                    <option value="Repostería">Repostería</option>
                    <option value="Ferretería">Ferretería</option>
                    <option value="Productos para niños">Productos para niños</option>
                    <option value="Cocina">Cocina</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-heading font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Imagen URL
                  </label>
                  <input 
                    type="url" 
                    name="imagen"
                    value={adminForm.imagen}
                    onChange={handleAdminFormChange}
                    placeholder="https://images.unsplash.com/photo-..." 
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Deja vacío para usar una imagen por defecto.</p>
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
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <span className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider">Total Productos</span>
                  <p className="text-xl md:text-2xl font-heading font-extrabold text-slate-900 mt-1">{products.length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <span className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider">Promedio Precio</span>
                  <p className="text-xl md:text-2xl font-heading font-extrabold text-slate-900 mt-1">
                    S/ {products.length > 0 ? (products.reduce((acc, p) => acc + p.precio, 0) / products.length).toFixed(2) : '0.00'}
                  </p>
                </div>
                <div className="bg-sky-400 border border-sky-300 rounded-xl p-4 shadow-sm">
                  <span className="text-[10px] font-heading font-bold text-white uppercase tracking-wider">Stock Total</span>
                  <p className="text-xl md:text-2xl font-heading font-extrabold text-white mt-1">
                    {products.reduce((acc, p) => acc + (p.stock || 0), 0)}
                  </p>
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-heading font-bold text-slate-900">Listado de Inventario</h3>
                  <button 
                    onClick={() => fetchProducts()}
                    className="text-xs font-heading font-semibold text-slate-500 hover:text-brand flex items-center gap-1"
                  >
                    Actualizar
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-[10px] font-heading font-bold uppercase tracking-wider">
                        <th className="px-6 py-3">Imagen</th>
                        <th className="px-6 py-3">Nombre</th>
                        <th className="px-6 py-3">Categoría</th>
                        <th className="px-6 py-3">Precio</th>
                        <th className="px-6 py-3">Stock</th>
                        <th className="px-6 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {products.map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5">
                            <img 
                              src={prod.imagen} 
                              alt="" 
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                            />
                          </td>
                          <td className="px-6 py-3.5 font-medium text-slate-800">
                            <div className="max-w-[180px] truncate" title={prod.nombre}>
                              {prod.nombre}
                            </div>
                            {prod.badge && (
                              <span className="inline-block bg-pink-100 text-brand text-[8px] font-heading font-bold uppercase px-1.5 py-0.5 rounded-full mt-1">
                                {prod.badge}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-slate-500 font-heading font-medium">
                            {prod.categoria}
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-slate-900">
                            S/ {prod.precio.toFixed(2)}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700">
                              {prod.stock || 0}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right space-x-3">
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
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-slate-400 text-xs font-heading font-medium">
                            No hay productos en inventario.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          ) : adminTab === 'reclamos' ? (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-heading font-bold text-slate-900">Listado de Reclamos y Quejas</h3>
                <button 
                  onClick={() => fetchReclamosList()}
                  className="text-xs font-heading font-semibold text-slate-500 hover:text-brand flex items-center gap-1"
                >
                  Actualizar
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-[10px] font-heading font-bold uppercase tracking-wider">
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Cliente</th>
                      <th className="px-6 py-3">Contacto</th>
                      <th className="px-6 py-3">Tipo</th>
                      <th className="px-6 py-3">Motivo</th>
                      <th className="px-6 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {reclamosList.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors align-top">
                        <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-500">
                          {new Date(rec.fecha).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="font-medium text-slate-800">{rec.nombre}</p>
                          <p className="text-xs text-slate-500">{rec.tipo_doc} {rec.num_doc}</p>
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 text-xs">
                          <p>📱 {rec.telefono}</p>
                          <p>✉️ {rec.correo}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${rec.tipo_reclamo === 'Queja' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'}`}>
                            {rec.tipo_reclamo}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-600 max-w-xs">
                          <p className="line-clamp-2" title={rec.motivo}>{rec.motivo}</p>
                        </td>
                        <td className="px-6 py-3.5">
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
                      </tr>
                    ))}
                    {reclamosList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-400 text-xs font-heading font-medium">
                          No hay reclamos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : adminTab === 'pedidos' ? (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-heading font-bold text-slate-900">Historial de Pedidos</h3>
                <button 
                  onClick={() => fetchPedidosList()}
                  className="text-xs font-heading font-semibold text-slate-500 hover:text-brand flex items-center gap-1"
                >
                  Actualizar
                </button>
              </div>

              {/* Pedidos Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-100">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <span className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider">Ganancias Hoy</span>
                  <p className="text-xl md:text-2xl font-heading font-extrabold text-brand mt-1">
                    S/ {gananciasHoy.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <span className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider">Últimos 7 Días</span>
                  <p className="text-xl md:text-2xl font-heading font-extrabold text-emerald-600 mt-1">
                    S/ {gananciasSemana.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <span className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider">Últimos 30 Días</span>
                  <p className="text-xl md:text-2xl font-heading font-extrabold text-sky-600 mt-1">
                    S/ {gananciasMes.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-[10px] font-heading font-bold uppercase tracking-wider">
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Cliente</th>
                      <th className="px-6 py-3">Monto</th>
                      <th className="px-6 py-3">Detalle</th>
                      <th className="px-6 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {pedidosList.map((ped) => (
                      <tr key={ped.id} className="hover:bg-slate-50/50 transition-colors align-top">
                        <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-500">
                          {new Date(ped.fecha).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="font-medium text-slate-800">{ped.nombre}</p>
                          <p className="text-xs text-slate-500">📱 {ped.telefono}</p>
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-900 text-xs">
                          S/ {ped.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-600">
                          <ul className="list-disc pl-4">
                            {ped.detalles && typeof ped.detalles === 'object' && ped.detalles.length > 0 ? (
                              ped.detalles.map((d, i) => (
                                <li key={i}>{d.quantity}x {d.nombre}</li>
                              ))
                            ) : (
                              <li>Sin detalles</li>
                            )}
                          </ul>
                        </td>
                        <td className="px-6 py-3.5">
                          <select 
                            value={ped.estado || 'Pendiente'}
                            onChange={(e) => updateEstadoPedido(ped.id, e.target.value)}
                            className={`text-xs font-bold rounded px-2 py-1 border-none focus:ring-0 ${
                              ped.estado === 'Entregado' ? 'bg-emerald-100 text-emerald-700' :
                              ped.estado === 'En Camino' ? 'bg-sky-100 text-sky-700' :
                              ped.estado === 'Cancelado' ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="En Camino">En Camino</option>
                            <option value="Entregado">Entregado</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {pedidosList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-400 text-xs font-heading font-medium">
                          No hay pedidos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-heading font-bold text-slate-900">Control de Reseñas</h3>
                <button 
                  onClick={() => fetchAdminResenas()}
                  className="text-xs font-heading font-semibold text-slate-500 hover:text-brand flex items-center gap-1"
                >
                  Actualizar
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-[10px] font-heading font-bold uppercase tracking-wider">
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Autor</th>
                      <th className="px-6 py-3">Calificación</th>
                      <th className="px-6 py-3">Comentario</th>
                      <th className="px-6 py-3">Visibilidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {resenasList.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/50 transition-colors align-top">
                        <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-500">
                          {new Date(res.fecha).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="font-medium text-slate-800">{res.autor}</p>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-amber-500">
                          {'★'.repeat(res.calificacion)}{'☆'.repeat(5 - res.calificacion)}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-600 max-w-xs">
                          {res.comentario}
                        </td>
                        <td className="px-6 py-3.5">
                          <button 
                            onClick={() => updateAprobacionResena(res.id, !res.aprobado)}
                            className={`text-xs font-bold px-3 py-1 rounded-full ${res.aprobado ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}
                          >
                            {res.aprobado ? 'Aprobado (Público)' : 'Oculto'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {resenasList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-400 text-xs font-heading font-medium">
                          No hay reseñas registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Trust Badges - estilo Kafi */}
      {viewMode === 'shop' && (
        <section className="bg-slate-900 py-4 md:py-6">
          <div className="w-full px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-4 gap-x-2 md:gap-x-4">
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
                <span className="text-2xl">{item.icon}</span>
                <div className="flex flex-col items-start">
                  <h4 className="font-heading font-bold text-sm text-brand">{item.title}</h4>
                  <p className="text-xs text-white">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer - estilo Grupo Kafi con fondo negro */}
      <footer className="bg-slate-900 pt-8 md:pt-10 pb-6 mt-auto">
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
            <p className="text-[9px] md:text-[10px] text-slate-400 font-heading">
              © {new Date().getFullYear()} YuMar Importaciones. Todos los derechos reservados. Chiclayo - Perú.
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
                    src={item.imagen} 
                    alt="" 
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
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-heading font-bold text-slate-500 uppercase">Subtotal</span>
                  <span className="font-heading font-extrabold text-slate-950 text-lg">
                    S/ {cartTotal.toFixed(2)}
                  </span>
                </div>
                
                <form onSubmit={handleCheckout} className="space-y-3 mb-4 border-t border-slate-200 pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tus datos para el pedido</p>
                  <input type="text" placeholder="Nombre completo" required value={checkoutForm.nombre} onChange={e => setCheckoutForm({...checkoutForm, nombre: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-brand" />
                  <input type="tel" placeholder="Teléfono / WhatsApp" required value={checkoutForm.telefono} onChange={e => setCheckoutForm({...checkoutForm, telefono: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-brand" />
                  
                  <button type="submit" className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white py-3 rounded-xl font-heading font-bold text-sm shadow-lg shadow-brand/10 transition mt-2">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.446L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.623-1.023-5.086-2.884-6.948C16.59 2.012 14.125.99 11.516.99c-5.44 0-9.864 4.372-9.868 9.8.001 1.93.524 3.818 1.513 5.497L2.122 21.9l5.7-1.494z" />
                    </svg>
                    <span>Pedir por WhatsApp</span>
                  </button>
                </form>
                
                <p className="text-[10px] text-center text-slate-400 mt-3">
                  Te redirigiremos a WhatsApp para finalizar la entrega y el pago con un asesor de Yumar.
                </p>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL - removed, now inline page view */}

      {/* FLOATING WHATSAPP BUTTON con popup */}
      {viewMode === 'shop' && (
        <div className="fixed bottom-5 right-5 z-40 flex flex-row items-center gap-2">

          {/* Burbuja de mensaje - a la izquierda del botón */}
          <div className="relative animate-fade-in">
            <div className="bg-white rounded-2xl rounded-br-sm shadow-xl px-4 py-3 border border-slate-100" style={{ maxWidth: '190px' }}>
              <p className="text-sm text-slate-700 leading-snug">
                ¿Hola, cómo <span className="font-semibold text-[#25D366]">podemos</span> ayudarte?
              </p>
            </div>
            {/* Flecha apuntando a la derecha hacia el botón WhatsApp */}
            <div style={{
              position: 'absolute',
              top: '50%',
              right: '-8px',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderLeft: '9px solid white',
              filter: 'drop-shadow(2px 0 2px rgba(0,0,0,0.06))',
            }} />
          </div>

          {/* Botón WhatsApp - a la derecha */}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Hola,%20¿cómo%20podemos%20ayudarte?`}
            target="_blank"
            rel="noreferrer"
            className="w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full flex items-center justify-center shadow-lg wa-float transition-transform hover:scale-105 flex-shrink-0"
            aria-label="WhatsApp"
          >
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.446L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.623-1.023-5.086-2.884-6.948C16.59 2.012 14.125.99 11.516.99c-5.44 0-9.864 4.372-9.868 9.8.001 1.93.524 3.818 1.513 5.497L2.122 21.9l5.7-1.494z"/></svg>
          </a>

        </div>
      )}

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

export default App;
