import express from 'express';
import cors from 'cors';
import pg from 'pg';
const { Pool } = pg;
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

// Load .env manually (no dotenv dependency needed)
const __filenameTemp = fileURLToPath(import.meta.url);
const __dirnameTemp = dirname(__filenameTemp);
const envPath = join(__dirnameTemp, '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) process.env[key] = value;
      }
    }
  });
  console.log('✅ .env loaded');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from the dist directory (for production)
app.use(express.static(join(__dirname, 'dist')));

// PostgreSQL Database Setup (Neon compatible)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/yumar',
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

const initializeDatabase = async () => {
  try {
    console.log('Connected to PostgreSQL database.');
    
    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        precio REAL NOT NULL,
        imagen TEXT,
        categoria TEXT,
        descripcion TEXT,
        badge TEXT,
        stock INTEGER DEFAULT 0
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reclamos (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        tipo_doc TEXT,
        num_doc TEXT,
        direccion TEXT,
        departamento TEXT,
        provincia TEXT,
        distrito TEXT,
        telefono TEXT,
        telefono_fijo TEXT,
        correo TEXT,
        tipo_bien TEXT,
        monto TEXT,
        descripcion TEXT,
        tipo_reclamo TEXT,
        motivo TEXT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add estado to reclamos if it doesn't exist (handle it safely)
    try {
      await pool.query(`ALTER TABLE reclamos ADD COLUMN estado TEXT DEFAULT 'Pendiente'`);
    } catch (e) { /* ignore if already exists */ }

    // Create pedidos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        telefono TEXT,
        correo TEXT,
        total REAL NOT NULL,
        detalles JSONB,
        metodo_pago TEXT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        estado TEXT DEFAULT 'Pendiente'
      )
    `);

    // Create resenas table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resenas (
        id SERIAL PRIMARY KEY,
        producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
        autor TEXT NOT NULL,
        calificacion INTEGER NOT NULL,
        comentario TEXT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        aprobado BOOLEAN DEFAULT true
      )
    `);

    // Create categorias table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL UNIQUE
      )
    `);

    // Seed default categories if empty
    const catResult = await pool.query('SELECT COUNT(*) as count FROM categorias');
    if (catResult.rows[0].count === '0' || catResult.rows[0].count === 0) {
      console.log('Seeding initial categories...');
      const defaultCats = ['Tecnología', 'Hogar', 'Belleza', 'Moda', 'Accesorios', 'Juguetes', 'Deportes'];
      for (const c of defaultCats) {
        await pool.query('INSERT INTO categorias (nombre) VALUES ($1) ON CONFLICT DO NOTHING', [c]);
      }
    }

    // Check if table is empty and seed if needed
    const result = await pool.query('SELECT COUNT(*) as count FROM productos');
    if (result.rows[0].count === '0' || result.rows[0].count === 0) {
      console.log('Database empty. Seeding initial products...');
      await seedProducts();
    }
  } catch (err) {
    console.error('Error initializing database:', err.message, err.code, err);
  }
};

async function seedProducts() {
  const initialProducts = [
    {
      nombre: "Audífonos Inalámbricos Pro",
      precio: 89.90,
      imagen: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
      categoria: "Tecnología",
      descripcion: "Audífonos de alta fidelidad con cancelación de ruido activa, bluetooth 5.3 y batería de hasta 30 horas de reproducción.",
      badge: "MÁS VENDIDO",
      stock: 15
    },
    {
      nombre: "Smartwatch Series 9 Ultra",
      precio: 149.90,
      imagen: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=500&q=80",
      categoria: "Tecnología",
      descripcion: "Reloj inteligente con pantalla AMOLED, monitoreo de ritmo cardíaco, GPS integrado, resistente al agua y múltiples modos deportivos.",
      badge: "NUEVO",
      stock: 8
    },
    {
      nombre: "Teclado Mecánico RGB",
      precio: 179.90,
      imagen: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&q=80",
      categoria: "Tecnología",
      descripcion: "Teclado mecánico gamer con interruptores mecánicos (switches blue), retroiluminación RGB personalizable y diseño ergonómico.",
      badge: "15% OFF",
      stock: 12
    },
    {
      nombre: "Cargador Carga Rápida 33W",
      precio: 35.00,
      imagen: "https://images.unsplash.com/photo-1583863788434-e58a36430e04?w=500&q=80",
      categoria: "Tecnología",
      descripcion: "Cargador de pared con doble puerto USB-C y USB-A. Carga súper rápida de 33W compatible con iPhone, Samsung y Xiaomi.",
      badge: "RECOMENDADO",
      stock: 25
    },
    {
      nombre: "Parlante Bluetooth Contra Agua",
      precio: 119.90,
      imagen: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80",
      categoria: "Tecnología",
      descripcion: "Parlante portátil resistente al agua IPX7 con sonido estéreo 3D, bajos reforzados y 12 horas de duración de batería.",
      badge: "OFERTA",
      stock: 10
    },
    {
      nombre: "Humidificador de Aire LED",
      precio: 49.90,
      imagen: "https://images.unsplash.com/photo-1605600659908-0fef4192a3e3?w=500&q=80",
      categoria: "Hogar",
      descripcion: "Humidificador difusor de aromas ultrasónico con luz LED nocturna de 7 colores. Capacidad de 300ml para un ambiente relajante.",
      badge: "HOGAR",
      stock: 18
    },
    {
      nombre: "Organizador de Maquillaje Acrílico",
      precio: 39.90,
      imagen: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80",
      categoria: "Belleza",
      descripcion: "Organizador giratorio de 360 grados para cosméticos y maquillaje. Gran capacidad con bandejas ajustables.",
      badge: "BELLEZA",
      stock: 22
    },
    {
      nombre: "Plancha Alisadora de Cabello",
      precio: 159.90,
      imagen: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80",
      categoria: "Belleza",
      descripcion: "Plancha profesional con placas de titanio y calentamiento rápido hasta 450°F. Cuidado iónico para un cabello sedoso y brillante.",
      badge: "POPULAR",
      stock: 7
    },
    {
      nombre: "Smart Band Deportiva 8",
      precio: 95.00,
      imagen: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&q=80",
      categoria: "Tecnología",
      descripcion: "Pulsera inteligente con contador de pasos, calorías, monitor de sueño, notificaciones de WhatsApp y llamadas. Autonomía de 14 días.",
      badge: "MÁS VENDIDO",
      stock: 20
    },
    {
      nombre: "Afeitadora Eléctrica Recargable",
      precio: 79.90,
      imagen: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=500&q=80",
      categoria: "Belleza",
      descripcion: "Cortadora de cabello y afeitadora profesional con cuchillas de precisión de acero inoxidable y carga rápida USB.",
      badge: "RECOMENDADO",
      stock: 14
    },
    {
      nombre: "Mochila Porta Laptop Impermeable",
      precio: 129.90,
      imagen: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80",
      categoria: "Hogar",
      descripcion: "Mochila ergonómica impermeable con compartimento acolchado para laptop de hasta 15.6 pulgadas y puerto de carga USB integrado.",
      badge: "NUEVO",
      stock: 9
    }
  ];

  try {
    for (const prod of initialProducts) {
      await pool.query(
        "INSERT INTO productos (nombre, precio, imagen, categoria, descripcion, badge, stock) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [prod.nombre, prod.precio, prod.imagen, prod.categoria, prod.descripcion, prod.badge, prod.stock]
      );
    }
    console.log("Seeding completed successfully.");
  } catch (err) {
    console.error('Error seeding products:', err.message);
  }
}

// API Routes

// GET /api/productos - Get all products with optional filters
app.get('/api/productos', async (req, res) => {
  try {
    const { categoria, q } = req.query;
    
    let query = "SELECT * FROM productos";
    let params = [];
    let paramCount = 0;
    
    if (categoria && q) {
      query += ` WHERE categoria = $${++paramCount} AND (nombre LIKE $${++paramCount} OR descripcion LIKE $${++paramCount})`;
      params = [categoria, `%${q}%`, `%${q}%`];
    } else if (categoria) {
      query += ` WHERE categoria = $${++paramCount}`;
      params = [categoria];
    } else if (q) {
      query += ` WHERE nombre LIKE $${++paramCount} OR descripcion LIKE $${++paramCount}`;
      params = [`%${q}%`, `%${q}%`];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/productos/:id - Get a single product
app.get('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM productos WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/productos - Add a new product
app.post('/api/productos', async (req, res) => {
  try {
    const { nombre, precio, imagen, categoria, descripcion, badge, stock } = req.body;

    console.log('Datos recibidos:', { nombre, precio, stock, tipo: typeof stock });

    if (!nombre || precio === undefined) {
      return res.status(400).json({ error: "Nombre and precio are required" });
    }

    const defaultImage = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&q=80";
    const finalImage = imagen || defaultImage;
    const finalCategory = categoria || "Tecnología";
    const finalDesc = descripcion || "Producto importado de alta calidad.";
    const finalBadge = badge || "";
    const finalStock = stock !== undefined && stock !== '' ? parseInt(stock) : 0;

    console.log('Stock final a guardar:', finalStock);

    const result = await pool.query(
      "INSERT INTO productos (nombre, precio, imagen, categoria, descripcion, badge, stock) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [nombre, precio, finalImage, finalCategory, finalDesc, finalBadge, finalStock]
    );

    console.log('Producto guardado con ID:', result.rows[0].id, 'y stock:', finalStock);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al guardar:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/productos/:id - Update an existing product
app.put('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, imagen, categoria, descripcion, badge, stock } = req.body;
    
    if (!nombre || precio === undefined) {
      return res.status(400).json({ error: "Nombre and precio are required" });
    }

    const defaultImage = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&q=80";
    const finalImage = imagen || defaultImage;
    const finalCategory = categoria || "Tecnología";
    const finalDesc = descripcion || "Producto importado de alta calidad.";
    const finalBadge = badge || "";
    const finalStock = stock !== undefined && stock !== '' ? parseInt(stock) : 0;

    const result = await pool.query(
      "UPDATE productos SET nombre = $1, precio = $2, imagen = $3, categoria = $4, descripcion = $5, badge = $6, stock = $7 WHERE id = $8 RETURNING *",
      [nombre, precio, finalImage, finalCategory, finalDesc, finalBadge, finalStock, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/productos/:id - Delete a product
app.delete('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM productos WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted successfully", id });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reclamos - Add a new reclamo
app.post('/api/reclamos', async (req, res) => {
  try {
    const {
      nombre, tipoDoc, numDoc, direccion, departamento, provincia, distrito,
      telefono, telefonoFijo, correo, tipoBien, monto, descripcion, tipoReclamo, motivo
    } = req.body;

    if (!nombre || !numDoc || !correo || !motivo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO reclamos (
        nombre, tipo_doc, num_doc, direccion, departamento, provincia, distrito,
        telefono, telefono_fijo, correo, tipo_bien, monto, descripcion, tipo_reclamo, motivo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        nombre, tipoDoc, numDoc, direccion, departamento, provincia, distrito,
        telefono, telefonoFijo, correo, tipoBien, monto, descripcion, tipoReclamo, motivo
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error saving reclamo:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reclamos - Get all reclamos
app.get('/api/reclamos', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM reclamos ORDER BY fecha DESC");
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reclamos:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/reclamos/:id/estado
app.patch('/api/reclamos/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    // Safety check to ensure column exists before update
    try {
      await pool.query("ALTER TABLE reclamos ADD COLUMN estado TEXT DEFAULT 'Pendiente'");
    } catch (e) { /* ignore if already exists */ }

    const result = await pool.query("UPDATE reclamos SET estado = $1 WHERE id = $2 RETURNING *", [estado, id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM pedidos ORDER BY fecha DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pedidos
app.post('/api/pedidos', async (req, res) => {
  try {
    const { nombre, telefono, correo, total, detalles, metodo_entrega, metodo_pago } = req.body;
    
    try {
      await pool.query("ALTER TABLE pedidos ADD COLUMN metodo_entrega TEXT");
    } catch (e) { /* ignore if already exists */ }
    
    try {
      await pool.query("ALTER TABLE pedidos ADD COLUMN metodo_pago TEXT");
    } catch (e) { /* ignore if already exists */ }

    const result = await pool.query(
      "INSERT INTO pedidos (nombre, telefono, correo, total, detalles, metodo_entrega, metodo_pago) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [nombre, telefono, correo, total, JSON.stringify(detalles), metodo_entrega || '', metodo_pago || '']
    );

    // Decrease stock
    if (detalles && Array.isArray(detalles)) {
      for (const item of detalles) {
        if (item.id && item.quantity) {
          await pool.query("UPDATE productos SET stock = COALESCE(stock, 0) - $1 WHERE id = $2", [item.quantity, item.id]);
        }
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/pedidos/:id/estado
app.patch('/api/pedidos/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Safety check to ensure column exists before update
    try {
      await pool.query("ALTER TABLE pedidos ADD COLUMN estado TEXT DEFAULT 'Pendiente'");
    } catch (e) { /* ignore if already exists */ }

    // Check old state to manage stock
    const oldPedidoResult = await pool.query("SELECT estado, detalles FROM pedidos WHERE id = $1", [id]);
    if (oldPedidoResult.rows.length > 0) {
      const oldState = oldPedidoResult.rows[0].estado || 'Pendiente';
      const detalles = typeof oldPedidoResult.rows[0].detalles === 'string' 
        ? JSON.parse(oldPedidoResult.rows[0].detalles) 
        : oldPedidoResult.rows[0].detalles;
      
      if (oldState === 'Cancelado' && estado !== 'Cancelado') {
        // Was cancelled, now active: decrease stock again
        if (detalles && Array.isArray(detalles)) {
          for (const item of detalles) {
            if (item.id && item.quantity) {
              await pool.query("UPDATE productos SET stock = COALESCE(stock, 0) - $1 WHERE id = $2", [item.quantity, item.id]);
            }
          }
        }
      } else if (oldState !== 'Cancelado' && estado === 'Cancelado') {
        // Was active, now cancelled: return stock
        if (detalles && Array.isArray(detalles)) {
          for (const item of detalles) {
            if (item.id && item.quantity) {
              await pool.query("UPDATE productos SET stock = COALESCE(stock, 0) + $1 WHERE id = $2", [item.quantity, item.id]);
            }
          }
        }
      }
    }

    const result = await pool.query("UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *", [estado, id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/pedidos/:id - Delete a single order
app.delete('/api/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM pedidos WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ message: "Order deleted successfully", id });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/pedidos - Delete/Clear all orders (vaciar historial)
app.delete('/api/pedidos', async (req, res) => {
  try {
    await pool.query("DELETE FROM pedidos");
    res.json({ message: "All orders cleared successfully" });
  } catch (err) {
    console.error('Error clearing orders:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/resenas/producto/:id
app.get('/api/resenas/producto/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM resenas WHERE producto_id = $1 AND aprobado = true ORDER BY fecha DESC", [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/resenas
app.get('/api/resenas', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM resenas ORDER BY fecha DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resenas
app.post('/api/resenas', async (req, res) => {
  try {
    const { producto_id, autor, calificacion, comentario } = req.body;
    const result = await pool.query(
      "INSERT INTO resenas (producto_id, autor, calificacion, comentario) VALUES ($1, $2, $3, $4) RETURNING *",
      [producto_id, autor, calificacion, comentario]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/resenas/:id/aprobado
app.patch('/api/resenas/:id/aprobado', async (req, res) => {
  try {
    const { id } = req.params;
    const { aprobado } = req.body;
    const result = await pool.query("UPDATE resenas SET aprobado = $1 WHERE id = $2 RETURNING *", [aprobado, id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reclamos/:id - Delete a single reclamo
app.delete('/api/reclamos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM reclamos WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Reclamo not found" });
    res.json({ message: "Reclamo deleted", id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reclamos - Clear all reclamos
app.delete('/api/reclamos', async (req, res) => {
  try {
    await pool.query("DELETE FROM reclamos");
    res.json({ message: "All reclamos cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/resenas/:id - Delete a single resena
app.delete('/api/resenas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM resenas WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Resena not found" });
    res.json({ message: "Resena deleted", id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/resenas - Clear all resenas
app.delete('/api/resenas', async (req, res) => {
  try {
    await pool.query("DELETE FROM resenas");
    res.json({ message: "All resenas cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// GET /api/categorias
app.get('/api/categorias', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categorias ORDER BY nombre ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/categorias
app.post('/api/categorias', async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: "Nombre es requerido" });
    const result = await pool.query(
      "INSERT INTO categorias (nombre) VALUES ($1) ON CONFLICT DO NOTHING RETURNING *",
      [nombre]
    );
    res.json(result.rows[0] || { message: "Categoría ya existe" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/categorias/:id
app.delete('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM categorias WHERE id = $1", [id]);
    res.json({ message: "Categoría eliminada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all route for SPA (Single Page Application) - only in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

// Start server
if (!process.env.VERCEL) {
  initializeDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
} else {
  // In Vercel, we just initialize DB asynchronously and export the app
  initializeDatabase().catch(console.error);
}

export default app;