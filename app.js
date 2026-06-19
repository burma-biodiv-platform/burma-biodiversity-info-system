const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DB_PATH = path.join(__dirname, 'bbis.db');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('SQLite connection error:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run('PRAGMA foreign_keys = ON');
  }
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.\-]+/g, '_');
      cb(null, `${Date.now()}_${safe}`);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR));

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
      else resolve(row);
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

function splitCSV(value) {
  return value ? String(value).split(', ').filter(Boolean) : [];
}

function toSpecies(row) {
  return {
    id: row.id,
    kingdom: row.kingdom,
    phylum: row.phylum,
    class: row.class,
    taxon_order: row.taxon_order,
    family: row.family,
    genus: row.genus,
    species: row.species,
    scientific_name: row.scientific_name,
    author: row.author,
    common_name: row.common_name,
    local_name: row.local_name,
    module_id: row.module_id,
    module_code: row.module_code,
    module_name: row.module_name,
    iucn_status: row.iucn_status,
    endemic: !!row.endemic,
    description: row.description,
    observations_count: Number(row.observations_count || 0),
    identifications_count: Number(row.identifications_count || 0),
    habitats: splitCSV(row.habitats),
    regions: splitCSV(row.regions)
  };
}

async function speciesQuery(whereClause = '', params = []) {
  const rows = await all(`
    SELECT
      t.id, t.kingdom, t.phylum, t.class, t.taxon_order, t.family, t.genus, t.species,
      t.scientific_name, t.author, t.common_name, t.local_name, t.module_id,
      m.code AS module_code, m.name AS module_name,
      t.iucn_status, t.endemic, t.description,
      COALESCE((SELECT COUNT(*) FROM observations o WHERE o.taxon_id = t.id), 0) AS observations_count,
      COALESCE((SELECT COUNT(*) FROM identifications i WHERE i.identified_taxon = t.id), 0) AS identifications_count,
      COALESCE((SELECT GROUP_CONCAT(h.name, ', ') FROM taxonomy_habitats th JOIN habitats h ON h.id = th.habitat_id WHERE th.taxon_id = t.id), '') AS habitats,
      COALESCE((SELECT GROUP_CONCAT(r.name, ', ') FROM observations o LEFT JOIN regions r ON r.id = o.region_id WHERE o.taxon_id = t.id AND r.name IS NOT NULL), '') AS regions
    FROM taxonomy t
    JOIN modules m ON m.id = t.module_id
    ${whereClause}
    ORDER BY t.common_name COLLATE NOCASE ASC, t.scientific_name COLLATE NOCASE ASC
  `, params);
  return rows.map(toSpecies);
}

app.get('/api/v1/health', async (_req, res) => {
  try {
    const modules = await get('SELECT COUNT(*) AS count FROM modules');
    res.json({ status: 'ok', database: 'connected', modules: modules?.count || 0 });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/v1/modules', async (_req, res) => {
  try {
    res.json(await all('SELECT * FROM modules ORDER BY id'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/regions', async (_req, res) => {
  try {
    res.json(await all('SELECT * FROM regions ORDER BY name'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/habitats', async (_req, res) => {
  try {
    res.json(await all('SELECT * FROM habitats ORDER BY name'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/species', async (req, res) => {
  try {
    const moduleCode = String(req.query.module || 'birds').toLowerCase();
    const search = String(req.query.search || '').trim().toLowerCase();
    const status = String(req.query.status || '').trim().toLowerCase();
    const region = String(req.query.region || '').trim().toLowerCase();
    const habitat = String(req.query.habitat || '').trim().toLowerCase();

    const moduleRow = await get('SELECT id FROM modules WHERE code = ?', [moduleCode]);
    if (!moduleRow) return res.json([]);

    let where = 'WHERE t.module_id = ?';
    const params = [moduleRow.id];

    if (search) {
      const q = `%${search}%`;
      where += ' AND (LOWER(t.common_name) LIKE ? OR LOWER(t.scientific_name) LIKE ? OR LOWER(t.description) LIKE ? OR LOWER(t.local_name) LIKE ?)';
      params.push(q, q, q, q);
    }

    if (status) {
      where += ' AND LOWER(t.iucn_status) LIKE ?';
      params.push(`%${status}%`);
    }

    if (region) {
      where += ' AND EXISTS (SELECT 1 FROM observations o LEFT JOIN regions r ON r.id = o.region_id WHERE o.taxon_id = t.id AND LOWER(r.name) LIKE ?)';
      params.push(`%${region}%`);
    }

    if (habitat) {
      where += ' AND EXISTS (SELECT 1 FROM taxonomy_habitats th JOIN habitats h ON h.id = th.habitat_id WHERE th.taxon_id = t.id AND LOWER(h.name) LIKE ?)';
      params.push(`%${habitat}%`);
    }

    res.json(await speciesQuery(where, params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/species/:id', async (req, res) => {
  try {
    const row = await get(`
      SELECT t.*, m.code AS module_code, m.name AS module_name,
        COALESCE((SELECT COUNT(*) FROM observations o WHERE o.taxon_id = t.id), 0) AS observations_count,
        COALESCE((SELECT COUNT(*) FROM identifications i WHERE i.identified_taxon = t.id), 0) AS identifications_count,
        COALESCE((SELECT GROUP_CONCAT(h.name, ', ') FROM taxonomy_habitats th JOIN habitats h ON h.id = th.habitat_id WHERE th.taxon_id = t.id), '') AS habitats
      FROM taxonomy t
      JOIN modules m ON m.id = t.module_id
      WHERE t.id = ?
    `, [req.params.id]);

    if (!row) return res.status(404).json({ error: 'Species not found' });

    const media = await all('SELECT * FROM media WHERE taxon_id = ? ORDER BY id DESC', [req.params.id]);
    const documents = await all(`
      SELECT d.*
      FROM documents d
      JOIN taxonomy_documents td ON td.document_id = d.id
      WHERE td.taxon_id = ?
      ORDER BY d.id DESC
    `, [req.params.id]);
    const observations = await all(`
      SELECT o.*, r.name AS region_name
      FROM observations o
      LEFT JOIN regions r ON r.id = o.region_id
      WHERE o.taxon_id = ?
      ORDER BY o.observation_date DESC, o.id DESC
    `, [req.params.id]);

    res.json({ ...toSpecies(row), media, documents, observations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/observations', async (_req, res) => {
  try {
    res.json(await all(`
      SELECT o.*, t.common_name, t.scientific_name, r.name AS region_name
      FROM observations o
      LEFT JOIN taxonomy t ON t.id = o.taxon_id
      LEFT JOIN regions r ON r.id = o.region_id
      ORDER BY o.id DESC
    `));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/observations', upload.single('photo'), async (req, res) => {
  try {
    const result = await run(`
      INSERT INTO observations
      (taxon_id, observer, observation_date, latitude, longitude, region_id, count, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.body.taxon_id ? Number(req.body.taxon_id) : null,
      req.body.observer || null,
      req.body.observation_date || null,
      req.body.latitude !== undefined && req.body.latitude !== '' ? Number(req.body.latitude) : null,
      req.body.longitude !== undefined && req.body.longitude !== '' ? Number(req.body.longitude) : null,
      req.body.region_id ? Number(req.body.region_id) : null,
      req.body.count ? Number(req.body.count) : 1,
      req.body.notes || null
    ]);

    if (req.file && req.body.taxon_id) {
      await run(`
        INSERT INTO media
        (taxon_id, media_type, filename, caption, credit, license)
        VALUES (?, 'photo', ?, ?, ?, ?)
      `, [
        Number(req.body.taxon_id),
        req.file.filename,
        req.body.caption || 'Observation photo',
        req.body.credit || req.body.observer || 'Contributor',
        req.body.license || 'All rights reserved'
      ]);
    }

    res.status(201).json({ id: result.lastID, message: 'Observation saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/identifications', async (_req, res) => {
  try {
    res.json(await all(`
      SELECT i.*, o.observer, o.observation_date,
             t.common_name AS identified_common_name,
             t.scientific_name AS identified_scientific_name
      FROM identifications i
      LEFT JOIN observations o ON o.id = i.observation_id
      LEFT JOIN taxonomy t ON t.id = i.identified_taxon
      ORDER BY i.id DESC
    `));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/identifications', upload.single('photo'), async (req, res) => {
  try {
    const result = await run(`
      INSERT INTO identifications
      (observation_id, identified_taxon, confidence, identified_by, identified_on, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.body.observation_id ? Number(req.body.observation_id) : null,
      req.body.identified_taxon ? Number(req.body.identified_taxon) : null,
      req.body.confidence !== undefined && req.body.confidence !== '' ? Number(req.body.confidence) : null,
      req.body.identified_by || null,
      req.body.identified_on || null,
      req.body.notes || null
    ]);

    if (req.file && req.body.identified_taxon) {
      await run(`
        INSERT INTO media
        (taxon_id, media_type, filename, caption, credit, license)
        VALUES (?, 'photo', ?, ?, ?, ?)
      `, [
        Number(req.body.identified_taxon),
        req.file.filename,
        req.body.caption || 'Identification photo',
        req.body.credit || req.body.identified_by || 'Contributor',
        req.body.license || 'All rights reserved'
      ]);
    }

    res.status(201).json({ id: result.lastID, message: 'Identification saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/documents', async (_req, res) => {
  try {
    res.json(await all('SELECT * FROM documents ORDER BY id DESC'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/documents', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file ? path.join('uploads', req.file.filename) : (req.body.file_path || null);
    const result = await run(`
      INSERT INTO documents
      (title, description, document_type, file_path, publication_year, author)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.body.title || null,
      req.body.description || null,
      req.body.document_type || null,
      filePath,
      req.body.publication_year !== undefined && req.body.publication_year !== '' ? Number(req.body.publication_year) : null,
      req.body.author || null
    ]);

    if (req.body.taxon_id) {
      await run('INSERT OR IGNORE INTO taxonomy_documents (taxon_id, document_id) VALUES (?, ?)', [Number(req.body.taxon_id), result.lastID]);
    }

    res.status(201).json({ id: result.lastID, file_path: filePath, message: 'Document saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    if (!q) return res.json({ species: [], documents: [], observations: [] });

    const like = `%${q}%`;

    const species = await all(`
      SELECT id, common_name, scientific_name, iucn_status, module_id
      FROM taxonomy
      WHERE LOWER(common_name) LIKE ? OR LOWER(scientific_name) LIKE ? OR LOWER(description) LIKE ?
      ORDER BY common_name
    `, [like, like, like]);

    const documents = await all(`
      SELECT id, title, document_type, author
      FROM documents
      WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(author) LIKE ?
      ORDER BY id DESC
    `, [like, like, like]);

    const observations = await all(`
      SELECT o.id, o.observation_date, o.observer, o.notes, t.common_name, t.scientific_name
      FROM observations o
      LEFT JOIN taxonomy t ON t.id = o.taxon_id
      WHERE LOWER(COALESCE(o.notes, '')) LIKE ? OR LOWER(COALESCE(o.observer, '')) LIKE ?
      ORDER BY o.id DESC
    `, [like, like]);

    res.json({ species, documents, observations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/dashboard', async (_req, res) => {
  try {
    const stats = {
      species: (await get('SELECT COUNT(*) AS c FROM taxonomy')).c,
      observations: (await get('SELECT COUNT(*) AS c FROM observations')).c,
      documents: (await get('SELECT COUNT(*) AS c FROM documents')).c,
      modules: (await get('SELECT COUNT(*) AS c FROM modules')).c
    };

    const recentSpecies = await all('SELECT id, common_name, scientific_name, iucn_status FROM taxonomy ORDER BY id DESC LIMIT 6');
    const recentObservations = await all(`
      SELECT o.id, o.observation_date, o.observer, o.count, t.common_name, r.name AS region_name
      FROM observations o
      LEFT JOIN taxonomy t ON t.id = o.taxon_id
      LEFT JOIN regions r ON r.id = o.region_id
      ORDER BY o.id DESC LIMIT 6
    `);
    const latestDocuments = await all('SELECT id, title, document_type, author FROM documents ORDER BY id DESC LIMIT 6');

    res.json({ stats, recentSpecies, recentObservations, latestDocuments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`BBIS API running on http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});
