import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// SQLite Database Setup
const dbPath = join(__dirname, 'mi_base.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Check if table exists and has the correct schema
    db.run(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        precio REAL NOT NULL,
        imagen TEXT,
        categoria TEXT,
        descripcion TEXT,
        badge TEXT,
        stock INTEGER DEFAULT 0
      )
    `, (err) => {
      if (err) {
        console.error('Error creating database table:', err.message);
        return;
      }
      
      // Perform a check to see if we need to migrate/re-seed
      db.all("PRAGMA table_info(productos)", (err, columns) => {
        if (err) return;
        
        // If the table doesn't have 'imagen' or 'categoria' column, drop and recreate
        const hasImagen = columns.some(col => col.name === 'imagen');
        if (!hasImagen) {
          console.log("Old schema detected. Migrating database table...");
          db.run("DROP TABLE IF EXISTS productos", () => {
            initializeDatabase();
          });
          return;
        }

        // If the table doesn't have 'stock' column, add it
        const hasStock = columns.some(col => col.name === 'stock');
        if (!hasStock) {
          console.log("Adding stock column to database...");
          db.run("ALTER TABLE productos ADD COLUMN stock INTEGER DEFAULT 0", (err) => {
            if (err) console.error('Error adding stock column:', err.message);
          });
        }

        // Seed products if table is empty
        db.get("SELECT COUNT(*) as count FROM productos", (err, row) => {
          if (err) return;
          if (row.count === 0) {
            console.log("Database empty. Seeding initial products...");
            seedProducts();
          }
        });
      });
    });
  });
}

function seedProducts() {
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

  const stmt = db.prepare("INSERT INTO productos (nombre, precio, imagen, categoria, descripcion, badge, stock) VALUES (?, ?, ?, ?, ?, ?, ?)");
  initialProducts.forEach(prod => {
    stmt.run([prod.nombre, prod.precio, prod.imagen, prod.categoria, prod.descripcion, prod.badge, prod.stock]);
  });
  stmt.finalize();
  console.log("Seeding completed successfully.");
}

// API Routes

// GET /api/productos - Get all products with optional filters
app.get('/api/productos', (req, res) => {
  const { categoria, q } = req.query;
  
  let query = "SELECT * FROM productos";
  let params = [];
  
  if (categoria && q) {
    query += " WHERE categoria = ? AND (nombre LIKE ? OR descripcion LIKE ?)";
    params = [categoria, `%${q}%`, `%${q}%`];
  } else if (categoria) {
    query += " WHERE categoria = ?";
    params = [categoria];
  } else if (q) {
    query += " WHERE nombre LIKE ? OR descripcion LIKE ?";
    params = [`%${q}%`, `%${q}%`];
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET /api/productos/:id - Get a single product
app.get('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM productos WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(row);
  });
});

// POST /api/productos - Add a new product
app.post('/api/productos', (req, res) => {
  const { nombre, precio, imagen, categoria, descripcion, badge, stock } = req.body;

  console.log('Datos recibidos:', { nombre, precio, stock, tipo: typeof stock });

  if (!nombre || precio === undefined) {
    return res.status(400).json({ error: "Nombre and precio are required" });
  }

  const defaultImage = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&q=80"; // Tech placeholder
  const finalImage = imagen || defaultImage;
  const finalCategory = categoria || "Tecnología";
  const finalDesc = descripcion || "Producto importado de alta calidad.";
  const finalBadge = badge || "";
  const finalStock = stock !== undefined && stock !== '' ? parseInt(stock) : 0;

  console.log('Stock final a guardar:', finalStock);

  db.run(
    "INSERT INTO productos (nombre, precio, imagen, categoria, descripcion, badge, stock) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [nombre, precio, finalImage, finalCategory, finalDesc, finalBadge, finalStock],
    function (err) {
      if (err) {
        console.error('Error al guardar:', err);
        return res.status(500).json({ error: err.message });
      }

      console.log('Producto guardado con ID:', this.lastID, 'y stock:', finalStock);

      res.json({
        id: this.lastID,
        nombre,
        precio,
        imagen: finalImage,
        categoria: finalCategory,
        descripcion: finalDesc,
        badge: finalBadge,
        stock: finalStock
      });
    }
  );
});

// DELETE /api/productos/:id - Delete a product
app.delete('/api/productos/:id', (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM productos WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted successfully", id });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});