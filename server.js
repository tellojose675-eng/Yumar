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

// Health Check Endpoint (Cloud Infrastructure Readiness)
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT 1 AS healthy');
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbResult.rows.length > 0 ? 'CONNECTED' : 'DISCONNECTED',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (err) {
    res.status(503).json({
      status: 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'DISCONNECTED',
      error: err.message
    });
  }
});

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

    // Create usuarios table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        nombre TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'vendedor',
        activo BOOLEAN DEFAULT true,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default admin user if empty
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM usuarios');
    if (usersCount.rows[0].count === '0' || usersCount.rows[0].count === 0) {
      console.log('Seeding initial admin user...');
      await pool.query(`
        INSERT INTO usuarios (username, password, nombre, rol)
        VALUES ('admin', 'admin123', 'Administrador Principal', 'admin')
        ON CONFLICT (username) DO NOTHING
      `);
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

// PATCH /api/productos/:id/stock - Quick update product stock
app.patch('/api/productos/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    
    if (stock === undefined || isNaN(parseInt(stock))) {
      return res.status(400).json({ error: "Stock is required and must be a number" });
    }

    const result = await pool.query(
      "UPDATE productos SET stock = $1 WHERE id = $2 RETURNING *",
      [parseInt(stock), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating stock:', err);
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
    const { nombre, telefono, correo, total, detalles, metodo_entrega, metodo_pago, estado } = req.body;
    
    try {
      await pool.query("ALTER TABLE pedidos ADD COLUMN metodo_entrega TEXT");
    } catch (e) { /* ignore if already exists */ }
    
    try {
      await pool.query("ALTER TABLE pedidos ADD COLUMN metodo_pago TEXT");
    } catch (e) { /* ignore if already exists */ }

    try {
      await pool.query("ALTER TABLE pedidos ADD COLUMN estado TEXT DEFAULT 'Pendiente'");
    } catch (e) { /* ignore if already exists */ }

    const result = await pool.query(
      "INSERT INTO pedidos (nombre, telefono, correo, total, detalles, metodo_entrega, metodo_pago, estado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [nombre, telefono, correo, total, JSON.stringify(detalles), metodo_entrega || '', metodo_pago || '', estado || 'Pendiente']
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

// ==========================================
// USUARIOS Y AUTENTICACIÓN POR ROLES
// ==========================================

// POST /api/auth/login - Autenticación de usuarios por rol (Admin o Vendedor)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Usuario y contraseña requeridos" });
    }

    const trimmedUser = username.trim().toLowerCase();

    // Consultar en la base de datos
    try {
      const result = await pool.query(
        "SELECT id, username, password, nombre, rol, activo FROM usuarios WHERE LOWER(username) = $1",
        [trimmedUser]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];
        if (user.password !== password) {
          return res.status(401).json({ error: "Contraseña incorrecta" });
        }
        if (!user.activo) {
          return res.status(403).json({ error: "Este usuario se encuentra inactivo. Contacte al administrador." });
        }
        return res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            nombre: user.nombre,
            rol: user.rol || 'vendedor'
          }
        });
      }
    } catch (dbErr) {
      console.warn("DB query failed, checking fallback admin:", dbErr.message);
    }

    // Fallback de administrador por defecto si aún no se inicializó en DB
    if (trimmedUser === 'admin' && password === 'admin123') {
      return res.json({
        success: true,
        user: {
          id: 1,
          username: 'admin',
          nombre: 'Administrador Principal',
          rol: 'admin'
        }
      });
    }

    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  } catch (err) {
    console.error("Error en login:", err);
    if (req.body?.username === 'admin' && req.body?.password === 'admin123') {
      return res.json({
        success: true,
        user: { id: 1, username: 'admin', nombre: 'Administrador Principal', rol: 'admin' }
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/usuarios - Listar todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, nombre, rol, activo, creado_en FROM usuarios ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/usuarios - Crear nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  try {
    const { username, password, nombre, rol } = req.body;
    if (!username || !password || !nombre) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }
    const cleanUser = username.trim().toLowerCase();
    const cleanRol = rol === 'admin' ? 'admin' : 'vendedor';

    // Verificar si ya existe
    const exists = await pool.query("SELECT id FROM usuarios WHERE LOWER(username) = $1", [cleanUser]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: "El nombre de usuario ya está registrado" });
    }

    const insertResult = await pool.query(
      "INSERT INTO usuarios (username, password, nombre, rol) VALUES ($1, $2, $3, $4) RETURNING id, username, nombre, rol, activo, creado_en",
      [cleanUser, password, nombre.trim(), cleanRol]
    );

    res.status(201).json(insertResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/usuarios/:id - Eliminar usuario
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userCheck = await pool.query("SELECT username FROM usuarios WHERE id = $1", [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    if (userCheck.rows[0].username === 'admin') {
      return res.status(403).json({ error: "No es posible eliminar al Administrador Principal" });
    }

    await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat - Asistente IA para clientes
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: "El mensaje es requerido" });

    // Fetch product catalog for context
    const productsResult = await pool.query("SELECT id, nombre, precio, categoria, stock, descripcion FROM productos");
    const catalog = productsResult.rows;

    const catalogSummary = catalog.map(p => 
      `- ID ${p.id}: "${p.nombre}" | Categoría: ${p.categoria} | Precio: S/${p.precio} | Stock: ${p.stock} unidades | Desc: ${p.descripcion}`
    ).join('\n');

    const systemPrompt = `Eres YumarIA, la asistente inteligente de la tienda virtual "Yumar Importaciones".
Tu objetivo es ayudar amablemente a los clientes a encontrar productos, responder dudas sobre catálogo, precios, stock, envíos y pagos.

DATOS EN TIEMPO REAL DE YUMAR IMPORTACIONES:
- Ubicación / Recojo en tienda: Santa Ana, Lima.
- Medios de Pago: Yape / Plin (al número 967227469 a nombre de Yuly Quiroz Romero) y Transferencia Bancaria.
- Contacto WhatsApp: +51 967227469.
- Catálogo actual:
${catalogSummary}

REGLAS DE RESPUESTA:
1. Responde de forma cordial, clara y directa en español con emoticonos.
2. Cuando el cliente pregunte por un producto o categoría, DEBES mostrar detalladamente:
   • 📦 **Producto:** Nombre exacto
   • 📂 **Sección / Categoría:** Nombre de la categoría
   • 💰 **Precio:** S/ Precio
   • 📊 **Stock:** Cantidad disponible (ej: "15 unidades disponibles" o "Agotado")
   • 📝 **Descripción:** Breve resumen
3. Respuestas concisas de máximo 2 o 3 párrafos.`;

    const apiKey = process.env.GEMINI_API_KEY;

    let matchedProducts = [];

    // Local matching for products with smart intent keywords
    const lowerMsg = message.toLowerCase();
    
    const isGamerQuery = lowerMsg.includes('gamer') || lowerMsg.includes('juego') || lowerMsg.includes('juegos') || lowerMsg.includes('audifono') || lowerMsg.includes('mouse') || lowerMsg.includes('teclado') || lowerMsg.includes('gaming');
    const isTechQuery = isGamerQuery || lowerMsg.includes('tecnologia') || lowerMsg.includes('tech') || lowerMsg.includes('electronico') || lowerMsg.includes('cable') || lowerMsg.includes('cargador') || lowerMsg.includes('celular') || lowerMsg.includes('luz');
    const isHogarQuery = lowerMsg.includes('hogar') || lowerMsg.includes('casa') || lowerMsg.includes('cocina') || lowerMsg.includes('limpieza') || lowerMsg.includes('foco');
    const isBellezaQuery = lowerMsg.includes('belleza') || lowerMsg.includes('cuidado') || lowerMsg.includes('maquillaje') || lowerMsg.includes('facial');
    const isDeporteQuery = lowerMsg.includes('deporte') || lowerMsg.includes('deportes') || lowerMsg.includes('fitness') || lowerMsg.includes('ejercicio');
    const isJugueteQuery = lowerMsg.includes('juguete') || lowerMsg.includes('juguetes') || lowerMsg.includes('nino') || lowerMsg.includes('niño');

    matchedProducts = catalog.filter(p => {
      const pName = p.nombre ? p.nombre.toLowerCase() : '';
      const pCat = p.categoria ? p.categoria.toLowerCase() : '';
      const pDesc = p.descripcion ? p.descripcion.toLowerCase() : '';

      if (pName && lowerMsg.includes(pName)) return true;
      if (pCat && lowerMsg.includes(pCat)) return true;
      if (pDesc && lowerMsg.includes(pDesc)) return true;

      if (isGamerQuery && (pCat.includes('tecnología') || pCat.includes('tecnologia') || pName.includes('audifono') || pName.includes('mouse') || pName.includes('interruptor') || pName.includes('tomacorriente') || pName.includes('gamer') || pDesc.includes('gamer') || pDesc.includes('led'))) return true;
      if (isTechQuery && (pCat.includes('tecnología') || pCat.includes('tecnologia'))) return true;
      if (isHogarQuery && pCat.includes('hogar')) return true;
      if (isBellezaQuery && pCat.includes('belleza')) return true;
      if (isDeporteQuery && pCat.includes('deporte')) return true;
      if (isJugueteQuery && pCat.includes('juguete')) return true;

      return false;
    });

    // Si busca recomendación general o gamer y no hay filtro específico, mostrar productos con stock
    if (matchedProducts.length === 0 && (isGamerQuery || isTechQuery || lowerMsg.includes('recomiend') || lowerMsg.includes('suger') || lowerMsg.includes('que comprar') || lowerMsg.includes('destacado'))) {
      matchedProducts = catalog.filter(p => p.stock > 0);
    }

    if (apiKey) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: systemPrompt }] },
              { role: 'model', parts: [{ text: '¡Entendido! Mostraré siempre la sección, precio y stock de cada producto.' }] },
              ...(history || []).map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }]
              })),
              { role: 'user', parts: [{ text: message }] }
            ]
          })
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return res.json({ reply: replyText, products: matchedProducts.slice(0, 3) });
          }
        }
      } catch (err) {
        console.error("Error al consultar Gemini API:", err);
      }
    }

    // Smart Local Fallback Engine
    let reply = "";

    if (lowerMsg.includes('hola') || lowerMsg.includes('buenas') || lowerMsg.includes('saludos')) {
      reply = `¡Hola! 👋 Bienvenido a **Yumar Importaciones**. Soy YumarIA, tu asistente virtual. ¿En qué te puedo ayudar hoy? Puedo buscar productos por categoría, informarte sobre su precio, stock actual, envíos o medios de pago.`;
    } else if (lowerMsg.includes('pago') || lowerMsg.includes('yape') || lowerMsg.includes('plin') || lowerMsg.includes('tarjeta') || lowerMsg.includes('banco')) {
      reply = `En **Yumar Importaciones** aceptamos los siguientes métodos de pago:\n\n📱 **Yape / Plin:** 967227469 (Titular: Yuly Quiroz Romero)\n🏦 **Transferencia Bancaria**\n\n¿Deseas ayuda con algún producto?`;
    } else if (lowerMsg.includes('envio') || lowerMsg.includes('entrega') || lowerMsg.includes('donde') || lowerMsg.includes('tienda') || lowerMsg.includes('recojo') || lowerMsg.includes('ubica')) {
      reply = `📍 **Punto de Recojo:** Nuestra sede principal está en **Santa Ana**.\n\nTambién realizamos envíos y coordinaciones por WhatsApp al **+51 967227469**.`;
    } else if (matchedProducts.length > 0) {
      const topProds = matchedProducts.slice(0, 3);
      reply = (isGamerQuery ? `🎮 **Recomendaciones Gamer & Tecnología en Yumar Importaciones:**\n\n` : `¡Claro! Aquí tienes los productos disponibles en nuestro catálogo:\n\n`) +
        topProds.map(p => 
          `📦 **Producto:** ${p.nombre}\n` +
          `📂 **Sección:** ${p.categoria || 'General'}\n` +
          `💰 **Precio:** S/${parseFloat(p.precio).toFixed(2)}\n` +
          `📊 **Stock:** ${p.stock > 0 ? `✅ Disponible (${p.stock} unid.)` : '❌ Agotado'}\n` +
          `📝 **Detalle:** ${p.descripcion || 'Producto importado de alta calidad.'}`
        ).join('\n\n---\n\n') +
        `\n\n¿Te gustaría agregar alguno a tu carrito de compras?`;
    } else if (lowerMsg.includes('oferta') || lowerMsg.includes('descuento') || lowerMsg.includes('recomend') || lowerMsg.includes('mas vendido') || lowerMsg.includes('catalogo')) {
      const inStock = catalog.filter(p => p.stock > 0).slice(0, 3);
      reply = `🔥 **Productos destacados con stock en Yumar Importaciones:**\n\n` +
        inStock.map(p => 
          `📦 **${p.nombre}**\n` +
          `📂 **Sección:** ${p.categoria}\n` +
          `💰 **Precio:** S/${parseFloat(p.precio).toFixed(2)}\n` +
          `📊 **Stock:** ✅ ${p.stock} disponibles`
        ).join('\n\n---\n\n') +
        `\n\n¿Te gustaría más detalles de alguno?`;
    } else {
      const defaultProds = catalog.filter(p => p.stock > 0).slice(0, 2);
      matchedProducts = defaultProds;
      reply = `Gracias por tu consulta. En **Yumar Importaciones** tenemos excelentes productos en **Tecnología**, **Hogar**, **Belleza** y más.\n\nAquí tienes un par de opciones con stock en tienda:\n\n` +
        defaultProds.map(p => `• **${p.nombre}** (S/${parseFloat(p.precio).toFixed(2)}) - ${p.categoria}`).join('\n') +
        `\n\n¡O escríbeme qué tipo de producto buscas y te daré su precio exacto!`;
    }

    res.json({ reply, products: matchedProducts.slice(0, 3) });

  } catch (err) {
    console.error('Error en /api/chat:', err);
    res.status(500).json({ error: "Error procesando la consulta de IA." });
  }
});

// GET /api/analytics - Dashboard de Analítica / Big Data
app.get('/api/analytics', async (req, res) => {
  try {
    const [
      pedidosRes,
      productosRes,
      reclamosRes,
      resenasRes
    ] = await Promise.all([
      pool.query("SELECT * FROM pedidos ORDER BY fecha DESC"),
      pool.query("SELECT * FROM productos"),
      pool.query("SELECT * FROM reclamos"),
      pool.query("SELECT * FROM resenas WHERE aprobado = true")
    ]);

    const pedidos = pedidosRes.rows || [];
    const productos = productosRes.rows || [];
    const reclamos = reclamosRes.rows || [];
    const resenas = resenasRes.rows || [];

    const pedidosValidos = pedidos.filter(p => p.estado !== 'Cancelado');

    const totalVentas = pedidosValidos.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
    const totalPedidos = pedidosValidos.length;
    const pedidosPendientes = pedidos.filter(p => p.estado === 'Pendiente').length;
    const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;
    const totalProductos = productos.length;
    const productosAgotados = productos.filter(p => (p.stock || 0) <= 0).length;
    const totalReclamos = reclamos.length;
    const avgCalificacion = resenas.length > 0 
      ? resenas.reduce((sum, r) => sum + (parseInt(r.calificacion) || 0), 0) / resenas.length 
      : 0;

    const kpis = {
      totalVentas: Math.round(totalVentas * 100) / 100,
      totalPedidos,
      pedidosPendientes,
      ticketPromedio: Math.round(ticketPromedio * 100) / 100,
      totalProductos,
      productosAgotados,
      totalReclamos,
      calificacionPromedio: Math.round(avgCalificacion * 10) / 10
    };

    // Aggregate Sales by Category & Top Products in JS (100% safe)
    const catMap = {};
    const prodMap = {};
    const metodoMap = {};

    pedidosValidos.forEach(p => {
      // Método de pago
      const metodo = p.metodo_pago || 'No especificado';
      metodoMap[metodo] = (metodoMap[metodo] || { total: 0, cantidad: 0 });
      metodoMap[metodo].total += parseFloat(p.total) || 0;
      metodoMap[metodo].cantidad += 1;

      // Detalles
      let items = [];
      if (typeof p.detalles === 'string') {
        try { items = JSON.parse(p.detalles); } catch (e) { items = []; }
      } else if (Array.isArray(p.detalles)) {
        items = p.detalles;
      }

      if (Array.isArray(items)) {
        items.forEach(item => {
          const qty = parseInt(item.quantity) || 1;
          const price = parseFloat(item.precio) || 0;
          const prodId = item.id;
          const prodObj = productos.find(pr => pr.id === prodId) || item;
          const cat = prodObj.categoria || 'General';
          const name = prodObj.nombre || item.nombre || 'Producto';
          const img = prodObj.imagen || item.imagen || '';

          // Categoria
          catMap[cat] = (catMap[cat] || { total: 0, cantidad: 0 });
          catMap[cat].total += price * qty;
          catMap[cat].cantidad += qty;

          // Top productos
          const key = prodId ? `id_${prodId}` : name;
          if (!prodMap[key]) {
            prodMap[key] = { nombre: name, imagen: img, categoria: cat, cantidad_vendida: 0, ingreso_total: 0 };
          }
          prodMap[key].cantidad_vendida += qty;
          prodMap[key].ingreso_total += price * qty;
        });
      }
    });

    // Fallback categorias si no hay compras aún
    let ventasPorCategoria = Object.entries(catMap).map(([categoria, d]) => ({
      categoria,
      total: Math.round(d.total * 100) / 100,
      cantidad: d.cantidad
    })).sort((a, b) => b.total - a.total);

    if (ventasPorCategoria.length === 0) {
      const fallbackCat = {};
      productos.forEach(p => {
        const cat = p.categoria || 'General';
        fallbackCat[cat] = (fallbackCat[cat] || 0) + 1;
      });
      ventasPorCategoria = Object.entries(fallbackCat).map(([categoria, cantidad]) => ({
        categoria,
        total: 0,
        cantidad
      }));
    }

    const topProductos = Object.values(prodMap)
      .sort((a, b) => b.cantidad_vendida - a.cantidad_vendida)
      .slice(0, 5);

    const ventasPorMetodoPago = Object.entries(metodoMap).map(([metodo, d]) => ({
      metodo,
      total: Math.round(d.total * 100) / 100,
      cantidad: d.cantidad
    })).sort((a, b) => b.total - a.total);

    const pedidosRecientes = pedidos.slice(0, 10).map(p => ({
      id: p.id,
      nombre: p.nombre,
      total: parseFloat(p.total) || 0,
      estado: p.estado || 'Pendiente',
      metodo_pago: p.metodo_pago,
      fecha: p.fecha
    }));

    res.json({
      kpis,
      ventasPorCategoria,
      topProductos,
      ventasPorMetodoPago,
      pedidosRecientes
    });

  } catch (err) {
    console.error('Error en /api/analytics:', err);
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