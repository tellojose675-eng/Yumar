import express from 'express';
import cors from 'cors';
import pg from 'pg';
const { Pool } = pg;
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory (for production)
app.use(express.static(join(__dirname, 'dist')));

// PostgreSQL Database Setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/yumar',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
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

    // Check if table is empty and seed if needed
    const result = await pool.query('SELECT COUNT(*) as count FROM productos');
    if (result.rows[0].count === 0) {
      console.log('Database empty. Seeding initial products...');
      await seedProducts();
    }
  } catch (err) {
    console.error('Error initializing database:', err.message);
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