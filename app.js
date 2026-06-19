const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'bbis.db');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.\-]+/g, '_');
      cb(null, `${Date.now()}_${safe}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR));

function getModuleId(code) {
  const row = db.prepare('SELECT id FROM modules WHERE code = ?').get(code);
  return row ? row.id : null;
}

function speciesRows(where = '', params = []) {
  return db.prepare(`
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
    ${where}
    ORDER BY t.common_name COLLATE NOCASE ASC, t.scientific_name COLLATE NOCASE ASC
  `).all(...params);
}

function formatSpecies(r) {
  return {
    id: r.id,
    kingdom: r.kingdom,
    phylum: r.phylum,
    class: r.class,
    taxon_order: r.taxon_order,
    family: r.family,
    genus: r.genus,
    species: r.species,
    scientific_name: r.scientific_name,
    author: r.author,
    common_name: r.common_name,
    local_name: r.local_name,
    module_id: r.module_id,
    module_code: r.module_code,
    module_name: r.module_name,
    iucn_status: r.iucn_status,
    endemic: !!r.endemic,
    description: r.description,
    observations_count: r.observations_count,
    identifications_count: r.identifications_count,
    habitats: r.habitats ? r.habitats.split(', ').filter(Boolean) : [],
    regions: r.regions ? r.regions.split(', ').filter(Boolean) : [],
  };
}

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

app.get('/api/v1/modules', (_req, res) => {
  res.json(db.prepare('SELECT * FROM modules ORDER BY id').all());
});

app.get('/api/v1/regions', (_req, res) => {
  res.json(db.prepare('SELECT * FROM regions ORDER BY name').all());
});

app.get('/api/v1/habitats', (_req, res) => {
  res.json(db.prepare('SELECT * FROM habitats ORDER BY name').all());
});

app.get('/api/v1/species', (req, res) => {
  const moduleCode = String(req.query.module || 'birds').toLowerCase();
  const search = String(req.query.search || '').trim().toLowerCase();
  const status = String(req.query.status || '').trim().toLowerCase();
  const region = String(req.query.region || '').trim().toLowerCase();
  const habitat = String(req.query.habitat || '').trim().toLowerCase();

  const moduleId = getModuleId(moduleCode);
  if (!moduleId) return res.json([]);

  let where = 'WHERE t.module_id = ?';
  const params = [moduleId];

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

  res.json(speciesRows(where, params).map(formatSpecies));
});

app.get('/api/v1/species/:id', (req, res) => {
  const row = db.prepare(`
    SELECT t.*, m.code AS module_code, m.name AS module_name,
      COALESCE((SELECT COUNT(*) FROM observations o WHERE o.taxon_id = t.id), 0) AS observations_count,
      COALESCE((SELECT COUNT(*) FROM identifications i WHERE i.identified_taxon = t.id), 0) AS identifications_count,
      COALESCE((SELECT GROUP_CONCAT(h.name, ', ') FROM taxonomy_habitats th JOIN habitats h ON h.id = th.habitat_id WHERE th.taxon_id = t.id), '') AS habitats
    FROM taxonomy t
    JOIN modules m ON m.id = t.module_id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!row) return res.status(404).json({ error: 'Species not found' });

  const media = db.prepare('SELECT * FROM media WHERE taxon_id = ? ORDER BY id DESC').all(req.params.id);
  const documents = db.prepare(`
    SELECT d.*
    FROM documents d
    JOIN taxonomy_documents td ON td.document_id = d.id
    WHERE td.taxon_id = ?
    ORDER BY d.id DESC
  `).all(req.params.id);
  const observations = db.prepare(`
    SELECT o.*, r.name AS region_name
    FROM observations o
    LEFT JOIN regions r ON r.id = o.region_id
    WHERE o.taxon_id = ?
    ORDER BY o.observation_date DESC, o.id DESC
  `).all(req.params.id);

  res.json({ ...formatSpecies(row), media, documents, observations });
});

app.get('/api/v1/observations', (_req, res) => {
  res.json(db.prepare(`
    SELECT o.*, t.common_name, t.scientific_name, r.name AS region_name
    FROM observations o
    LEFT JOIN taxonomy t ON t.id = o.taxon_id
    LEFT JOIN regions r ON r.id = o.region_id
    ORDER BY o.id DESC
  `).all());
});

app.post('/api/v1/observations', upload.single('photo'), (req, res) => {
  const info = db.prepare(`
    INSERT INTO observations
    (taxon_id, observer, observation_date, latitude, longitude, region_id, count, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.body.taxon_id ? Number(req.body.taxon_id) : null,
    req.body.observer || null,
    req.body.observation_date || null,
    req.body.latitude !== undefined && req.body.latitude !== '' ? Number(req.body.latitude) : null,
    req.body.longitude !== undefined && req.body.longitude !== '' ? Number(req.body.longitude) : null,
    req.body.region_id ? Number(req.body.region_id) : null,
    req.body.count ? Number(req.body.count) : 1,
    req.body.notes || null
  );

  if (req.file && req.body.taxon_id) {
    db.prepare(`INSERT INTO media (taxon_id, media_type, filename, caption, credit, license) VALUES (?, 'photo', ?, ?, ?, ?)`)
      .run(Number(req.body.taxon_id), req.file.filename, req.body.caption || 'Observation photo', req.body.credit || req.body.observer || 'Contributor', req.body.license || 'All rights reserved');
  }

  res.status(201).json({ id: info.lastInsertRowid, message: 'Observation saved' });
});

app.get('/api/v1/identifications', (_req, res) => {
  res.json(db.prepare(`
    SELECT i.*, o.observer, o.observation_date,
           t.common_name AS identified_common_name,
           t.scientific_name AS identified_scientific_name
    FROM identifications i
    LEFT JOIN observations o ON o.id = i.observation_id
    LEFT JOIN taxonomy t ON t.id = i.identified_taxon
    ORDER BY i.id DESC
  `).all());
});

app.post('/api/v1/identifications', upload.single('photo'), (req, res) => {
  const info = db.prepare(`
    INSERT INTO identifications
    (observation_id, identified_taxon, confidence, identified_by, identified_on, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    req.body.observation_id ? Number(req.body.observation_id) : null,
    req.body.identified_taxon ? Number(req.body.identified_taxon) : null,
    req.body.confidence !== undefined && req.body.confidence !== '' ? Number(req.body.confidence) : null,
    req.body.identified_by || null,
    req.body.identified_on || null,
    req.body.notes || null
  );

  if (req.file && req.body.identified_taxon) {
    db.prepare(`INSERT INTO media (taxon_id, media_type, filename, caption, credit, license) VALUES (?, 'photo', ?, ?, ?, ?)`)
      .run(Number(req.body.identified_taxon), req.file.filename, req.body.caption || 'Identification photo', req.body.credit || req.body.identified_by || 'Contributor', req.body.license || 'All rights reserved');
  }

  res.status(201).json({ id: info.lastInsertRowid, message: 'Identification saved' });
});

app.get('/api/v1/documents', (_req, res) => {
  res.json(db.prepare('SELECT * FROM documents ORDER BY id DESC').all());
});

app.post('/api/v1/documents', upload.single('file'), (req, res) => {
  const filePath = req.file ? path.join('uploads', req.file.filename) : (req.body.file_path || null);
  const info = db.prepare(`
    INSERT INTO documents
    (title, description, document_type, file_path, publication_year, author)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    req.body.title || null,
    req.body.description || null,
    req.body.document_type || null,
    filePath,
    req.body.publication_year !== undefined && req.body.publication_year !== '' ? Number(req.body.publication_year) : null,
    req.body.author || null
  );

  if (req.body.taxon_id) {
    db.prepare('INSERT OR IGNORE INTO taxonomy_documents (taxon_id, document_id) VALUES (?, ?)').run(Number(req.body.taxon_id), info.lastInsertRowid);
  }

  res.status(201).json({ id: info.lastInsertRowid, file_path: filePath, message: 'Document saved' });
});

app.get('/api/v1/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) return res.json({ species: [], documents: [], observations: [] });
  const like = `%${q}%`;

  const species = db.prepare(`
    SELECT id, common_name, scientific_name, iucn_status, module_id
    FROM taxonomy
    WHERE LOWER(common_name) LIKE ? OR LOWER(scientific_name) LIKE ? OR LOWER(description) LIKE ?
    ORDER BY common_name
  `).all(like, like, like);

  const documents = db.prepare(`
    SELECT id, title, document_type, author
    FROM documents
    WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(author) LIKE ?
    ORDER BY id DESC
  `).all(like, like, like);

  const observations = db.prepare(`
    SELECT o.id, o.observation_date, o.observer, o.notes, t.common_name, t.scientific_name
    FROM observations o
    LEFT JOIN taxonomy t ON t.id = o.taxon_id
    WHERE LOWER(COALESCE(o.notes, '')) LIKE ? OR LOWER(COALESCE(o.observer, '')) LIKE ?
    ORDER BY o.id DESC
  `).all(like, like);

  res.json({ species, documents, observations });
});

app.get('/api/v1/dashboard', (_req, res) => {
  res.json({
    stats: {
      species: db.prepare('SELECT COUNT(*) AS c FROM taxonomy').get().c,
      observations: db.prepare('SELECT COUNT(*) AS c FROM observations').get().c,
      documents: db.prepare('SELECT COUNT(*) AS c FROM documents').get().c,
      modules: db.prepare('SELECT COUNT(*) AS c FROM modules').get().c,
    },
    recentSpecies: db.prepare('SELECT id, common_name, scientific_name, iucn_status FROM taxonomy ORDER BY id DESC LIMIT 6').all(),
    recentObservations: db.prepare(`
      SELECT o.id, o.observation_date, o.observer, o.count, t.common_name, r.name AS region_name
      FROM observations o
      LEFT JOIN taxonomy t ON t.id = o.taxon_id
      LEFT JOIN regions r ON r.id = o.region_id
      ORDER BY o.id DESC LIMIT 6
    `).all(),
    latestDocuments: db.prepare('SELECT id, title, document_type, author FROM documents ORDER BY id DESC LIMIT 6').all(),
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`BBIS API running on http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});
