const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8000;
const DB_PATH = path.join(__dirname, "bbis.db");
const UPLOAD_DIR = path.join(__dirname, "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Connect to SQLite Database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("SQLite connection error:", err.message);
  } else {
    console.log("Connected to SQLite database.");
    db.run("PRAGMA foreign_keys = ON", (fkErr) => {
      if (fkErr) console.error("Failed to enable foreign keys:", fkErr.message);
      else initializeDatabase();
    });
  }
});

// Promise-based Database Helpers to prevent callback hell & unhandled rejections
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || { c: 0 }); // Fallback safe object
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// Multer Config for Safe File Uploading
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/[^\w.\-]+/g, "_");
      cb(null, `${Date.now()}_${safeName}`);
    }
  }),
  limits: { fileSize: 25 * 1024 * 1024 } // Limit: 25MB
});

// Express Middleware Stack
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use("/uploads", express.static(UPLOAD_DIR));

// Create Tables & Seed Starting Historical Data
async function initializeDatabase() {
  try {
    // 1. Create Regions Table
    await run(`
      CREATE TABLE IF NOT EXISTS regions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        description TEXT
      )
    `);

    // 2. Create Taxonomy Table
    await run(`
      CREATE TABLE IF NOT EXISTS taxonomy (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        common_name TEXT NOT NULL,
        scientific_name TEXT NOT NULL UNIQUE,
        myanmar_name TEXT,
        family TEXT,
        iucn_status TEXT,
        historical_status TEXT,
        smythies_quote TEXT,
        harington_quote TEXT,
        description TEXT,
        colors TEXT,
        size TEXT,
        habitat TEXT,
        diet TEXT
      )
    `);

    // 3. Create Observations Table
    await run(`
      CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taxon_id INTEGER,
        region_id INTEGER,
        observation_date TEXT,
        observer TEXT,
        count INTEGER DEFAULT 1,
        notes TEXT,
        photo_path TEXT,
        latitude REAL,
        longitude REAL,
        FOREIGN KEY(taxon_id) REFERENCES taxonomy(id),
        FOREIGN KEY(region_id) REFERENCES regions(id)
      )
    `);

    // 4. Create Documents Table
    await run(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        document_type TEXT,
        publication_year INTEGER,
        author TEXT,
        file_path TEXT,
        uploaded_at TEXT
      )
    `);

    // 5. Create Modules Table (Critical for the dashboard stats query)
    await run(`
      CREATE TABLE IF NOT EXISTS modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    // Seed Modules if empty
    const moduleCount = await get("SELECT COUNT(*) AS count FROM modules");
    if (moduleCount.count === 0 || !moduleCount.count) {
      const activeModules = [
        "Species Explorer",
        "Biogeographical Range Maps",
        "Bird ID Wizard",
        "Document Registry"
      ];
      for (const m of activeModules) {
        await run("INSERT INTO modules (name) VALUES (?)", [m]);
      }
      console.log("Seeded system modules successfully.");
    }

    // Seed regions if empty
    const regionCount = await get("SELECT COUNT(*) AS count FROM regions");
    if (regionCount.count === 0 || !regionCount.count) {
      const regionsList = [
        { name: "Kachin State", code: "MM-11", desc: "Northern highlands, pristine alpine heights, evergreen forests, and rich bird diversity." },
        { name: "Sagaing Region", code: "MM-01", desc: "North-western plains, dry deciduous valleys, and major river systems." },
        { name: "Shan State", code: "MM-14", desc: "Eastern plateau, sweeping pine woodlands, limestone karst hills, and Inle lake wetlands." },
        { name: "Chin State", code: "MM-12", desc: "Western mountain ranges, high altitudinal montane forests, and extreme bird endemism." },
        { name: "Mandalay Region", code: "MM-04", desc: "Central arid zone, historical scrubland plains, and Ayeyarwady flyways." },
        { name: "Magway Region", code: "MM-03", desc: "Arid plains and dry forest landscapes." },
        { name: "Rakhine State", code: "MM-13", desc: "Coastal mudflats, dense mangrove networks, and western evergreen foothills." },
        { name: "Bago Region", code: "MM-02", desc: "Central valley basin, home to deciduous teak forests and dense bamboo woodlands." },
        { name: "Ayeyarwady Region", code: "MM-05", desc: "Sarus Crane delta swamplands, coastal estuaries, and flooded rice cultivation." },
        { name: "Yangon Region", code: "MM-06", desc: "Urban gardens, secondary forests, and wetlands supporting migratory species." },
        { name: "Kayah State", code: "MM-15", desc: "Southeastern limestone hills and dry-deciduous mix." },
        { name: "Kayin State", code: "MM-16", desc: "Karst limestone towers, evergreen rainforest blocks, and rich river valleys." },
        { name: "Mon State", code: "MM-17", desc: "Coastal mudflats and evergreen foothills bordering the Andaman sea." },
        { name: "Tanintharyi Region", code: "MM-07", desc: "Southern dipterocarp tropical rainforest corridor with unique Sundaic avifauna." }
      ];
      for (const r of regionsList) {
        await run("INSERT OR IGNORE INTO regions (name, code, description) VALUES (?, ?, ?)", [r.name, r.code, r.desc]);
      }
      console.log("Seeded Myanmar administrative regions.");
    }

    // Seed bird taxonomy table if empty
    const taxonCount = await get("SELECT COUNT(*) AS count FROM taxonomy");
    if (taxonCount.count === 0 || !taxonCount.count) {
      const birdSeedData = [
        {
          common_name: "Great Hornbill",
          scientific_name: "Buceros bicornis",
          myanmar_name: "အောက်ချင်းငှက်",
          family: "Bucerotidae",
          iucn_status: "Vulnerable",
          historical_status: "Abundant and widely distributed in primary evergreen forests",
          smythies_quote: "A remarkable bird, famous for its heavy, deep resonant calling and spectacular nesting habits. The female is sealed inside tree hollows with mud during incubation.",
          harington_quote: "Frequently met with in the high forests of Tenasserim and Upper Burma, where its loud grunting baritones echo across the valley.",
          description: "An iconic forest canopy species of Myanmar, celebrated by the Chin people as a cultural symbol of fidelity. Highly threatened by primary forest loss.",
          colors: "Yellow, Black, White",
          size: "Large",
          habitat: "Primary Canopy Forest",
          diet: "Frugivorous"
        },
        {
          common_name: "Green Peafowl",
          scientific_name: "Pavo muticus",
          myanmar_name: "မြန်မာ့ဒေါင်း",
          family: "Phasianidae",
          iucn_status: "Endangered",
          historical_status: "Very common throughout all low hills and riverbanks",
          smythies_quote: "A magnificent bird of the forest edges and river gravels. Famously cautious, it is the national symbol of Myanmar and can be heard calling 'kay-yaw' at dawn.",
          harington_quote: "Commonly found in open dry deciduous forests. They gather in small parties and are extremely wary, taking flight at the slightest alarm.",
          description: "Historically celebrated across Burma's flags and royal insignia. Today under heavy threat from agricultural expansion and poaching.",
          colors: "Green, Blue, Gold",
          size: "Large",
          habitat: "Deciduous Forest",
          diet: "Omnivorous"
        },
        {
          common_name: "Red-headed Vulture",
          scientific_name: "Sarcogyps calvus",
          myanmar_name: "လင်းတခေါင်းနီ",
          family: "Accipitridae",
          iucn_status: "Critically Endangered",
          historical_status: "A common resident throughout the plains and open country",
          smythies_quote: "Instantly recognized by its brilliant red naked head and neck. It usually dominates other vultures at carcasses despite its slightly smaller size.",
          harington_quote: "May be seen soaring over the dry plains of Meiktila and central Burma, keeping watch for livestock mortalities.",
          description: "Also called the King Vulture. Facing rapid declines due to ecosystem changes and ingestion of chemical compounds.",
          colors: "Red, Black, White",
          size: "Large",
          habitat: "Deciduous Forest",
          diet: "Scavenger"
        },
        {
          common_name: "Sarus Crane",
          scientific_name: "Antigone antigone",
          myanmar_name: "ဂျိုးဂျာ",
          family: "Gruidae",
          iucn_status: "Vulnerable",
          historical_status: "Extremely common in the delta swamplands and flooded plains",
          smythies_quote: "The tallest flying bird in the world. Its trumpeting calls carry for miles across the Ayeyarwady Delta, where they nest in marshes.",
          harington_quote: "Commonly seen in pairs in the paddy fields during the rains, dancing gracefully with wings outspread.",
          description: "Revered in local Buddhist traditions for their lifelong pairing commitment. Protected by delta community nesting guardians.",
          colors: "Grey, Red, White",
          size: "Large",
          habitat: "Wetlands",
          diet: "Omnivorous"
        },
        {
          common_name: "Great Argus",
          scientific_name: "Argusianus argus",
          myanmar_name: "မင်းဒေါင်း",
          family: "Phasianidae",
          iucn_status: "Vulnerable",
          historical_status: "Confined to the dense evergreen forests of extreme southern Tenasserim",
          smythies_quote: "The display arenas of the male Argus are cleared circular patches of forest floor. The enormous wing feathers decorated with eyespots are raised in an incredible fan display.",
          harington_quote: "Extremely difficult to see, though its loud double-note 'how-how' call is one of the standard sounds of the deep southern jungles.",
          description: "Inhabitant of pristine southern evergreen dipterocarp rainforests. Threatened by conversion to industrial agricultural plantations.",
          colors: "Brown, Beige, Black",
          size: "Large",
          habitat: "Deep Rainforest",
          diet: "Frugivorous"
        },
        {
          common_name: "White-rumped Shama",
          scientific_name: "Copsychus malabaricus",
          myanmar_name: "တောသာလိကာ",
          family: "Muscicapidae",
          iucn_status: "Least Concern",
          historical_status: "Widely distributed in bamboo forests and deep ravines",
          smythies_quote: "Arguably the finest songster in the East. Its rich, melodic, and varied notes are delivered from dense undergrowth, punctuated by a characteristic tail flick.",
          harington_quote: "Prefers dense bamboo thickets. It is rarely seen in the open but its beautiful flute-like melody instantly gives away its location.",
          description: "One of Myanmar's most famous forest songbirds, sought after by collectors for its incredible mimicry and songs.",
          colors: "Black, Orange, White",
          size: "Small",
          habitat: "Bamboo Jungle",
          diet: "Insectivorous"
        }
      ];

      for (const bird of birdSeedData) {
        await run(`
          INSERT OR IGNORE INTO taxonomy 
          (common_name, scientific_name, myanmar_name, family, iucn_status, historical_status, smythies_quote, harington_quote, description, colors, size, habitat, diet)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          bird.common_name, bird.scientific_name, bird.myanmar_name, bird.family, bird.iucn_status,
          bird.historical_status, bird.smythies_quote, bird.harington_quote, bird.description,
          bird.colors, bird.size, bird.habitat, bird.diet
        ]);
      }
      console.log("Seeded bird taxonomy records successfully.");
    }
  } catch (err) {
    console.error("Database schema/seeding error:", err);
  }
}

// API ROUTING

// GET: All Species/Taxons
app.get("/api/v1/species", async (_req, res) => {
  try {
    const list = await all("SELECT * FROM taxonomy ORDER BY common_name ASC");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Add new species
app.post("/api/v1/species", async (req, res) => {
  try {
    const { common_name, scientific_name, myanmar_name, family, iucn_status, historical_status, description, colors, size, habitat, diet } = req.body;
    if (!common_name || !scientific_name) {
      return res.status(400).json({ error: "Common name and Scientific name are required." });
    }
    const result = await run(`
      INSERT INTO taxonomy (common_name, scientific_name, myanmar_name, family, iucn_status, historical_status, description, colors, size, habitat, diet)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [common_name, scientific_name, myanmar_name, family, iucn_status, historical_status, description, colors, size, habitat, diet]);
    res.status(201).json({ id: result.lastID, message: "Taxon added successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Regions list
app.get("/api/v1/regions", async (_req, res) => {
  try {
    const list = await all("SELECT * FROM regions ORDER BY name ASC");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: All observations with joined data
app.get("/api/v1/observations", async (_req, res) => {
  try {
    const list = await all(`
      SELECT o.*, t.common_name, t.scientific_name, t.iucn_status, r.name AS region_name 
      FROM observations o
      LEFT JOIN taxonomy t ON o.taxon_id = t.id
      LEFT JOIN regions r ON o.region_id = r.id
      ORDER BY o.observation_date DESC, o.id DESC
    `);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Add observation
app.post("/api/v1/observations", upload.single("photo"), async (req, res) => {
  try {
    const { taxon_id, region_id, observation_date, observer, count, notes, latitude, longitude } = req.body;
    if (!taxon_id || !region_id || !observation_date) {
      return res.status(400).json({ error: "Missing required fields: taxon_id, region_id, and observation_date are required." });
    }
    const photo_path = req.file ? `/uploads/${req.file.filename}` : null;
    const result = await run(`
      INSERT INTO observations (taxon_id, region_id, observation_date, observer, count, notes, photo_path, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [taxon_id, region_id, observation_date, observer, count || 1, notes, photo_path, latitude, longitude]);
    res.status(201).json({ id: result.lastID, message: "Observation added successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Documents list
app.get("/api/v1/documents", async (_req, res) => {
  try {
    const list = await all("SELECT * FROM documents ORDER BY uploaded_at DESC");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Upload document
app.post("/api/v1/documents", upload.single("file"), async (req, res) => {
  try {
    const { title, description, document_type, publication_year, author } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Document title is required." });
    }
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;
    const uploaded_at = new Date().toISOString();
    const result = await run(`
      INSERT INTO documents (title, description, document_type, publication_year, author, file_path, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [title, description, document_type, publication_year, author, file_path, uploaded_at]);
    res.status(201).json({ id: result.lastID, message: "Document uploaded successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Unified Search
app.get("/api/v1/search", async (req, res) => {
  try {
    const q = req.query.q || "";
    const like = `%${q.toLowerCase()}%`;
    const species = await all(`
      SELECT * FROM taxonomy 
      WHERE LOWER(common_name) LIKE ? OR LOWER(scientific_name) LIKE ? OR LOWER(myanmar_name) LIKE ?
    `, [like, like, like]);
    const documents = await all(`
      SELECT * FROM documents 
      WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(author) LIKE ?
    `, [like, like, like]);
    const observations = await all(`
      SELECT o.*, t.common_name, r.name AS region_name 
      FROM observations o
      LEFT JOIN taxonomy t ON o.taxon_id = t.id
      LEFT JOIN regions r ON o.region_id = r.id
      WHERE LOWER(COALESCE(o.notes, '')) LIKE ? OR LOWER(COALESCE(o.observer, '')) LIKE ?
    `, [like, like]);
    res.json({ species, documents, observations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Dashboard Stats
app.get("/api/v1/dashboard", async (_req, res) => {
  try {
    const speciesCount = await get("SELECT COUNT(*) AS c FROM taxonomy");
    const obsCount = await get("SELECT COUNT(*) AS c FROM observations");
    const docsCount = await get("SELECT COUNT(*) AS c FROM documents");
    const modulesCount = await get("SELECT COUNT(*) AS c FROM modules");
    
    const stats = {
      species: speciesCount.c || 0,
      observations: obsCount.c || 0,
      documents: docsCount.c || 0,
      modules: modulesCount.c || 4
    };

    const recentSpecies = await all("SELECT id, common_name, scientific_name, iucn_status, family FROM taxonomy ORDER BY id DESC LIMIT 6");
    const recentObservations = await all(`
      SELECT o.id, o.observation_date, o.observer, o.count, t.common_name, r.name AS region_name 
      FROM observations o 
      LEFT JOIN taxonomy t ON t.id = o.taxon_id 
      LEFT JOIN regions r ON r.id = o.region_id 
      ORDER BY o.id DESC LIMIT 6
    `);
    const latestDocuments = await all("SELECT id, title, document_type, author FROM documents ORDER BY id DESC LIMIT 6");
    
    res.json({ stats, recentSpecies, recentObservations, latestDocuments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled Server Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`BBIS Server listening on port ${PORT}`);
});