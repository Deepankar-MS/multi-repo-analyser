const express = require('express');
const initSqlJs = require('sql.js');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const { errorHandler, logger } = require('@tracker/common');

const app = express();
app.use(express.json());

const DB_PATH = './projects.db';
let db;

function saveDb() { fs.writeFileSync(DB_PATH, Buffer.from(db.export())); }

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

function run(sql, params = []) {
  db.run(sql, params);
  return db.getRowsModified();
}

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    owner TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    createdAt TEXT
  )`);
  saveDb();
}

// List all projects
app.get('/api/projects', (req, res) => {
  res.json(queryAll('SELECT * FROM projects ORDER BY createdAt DESC'));
});

// Get single project
app.get('/api/projects/:id', (req, res) => {
  const row = queryOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Project not found' });
  res.json(row);
});

// Create project
app.post('/api/projects', (req, res) => {
  const { name, description, owner, status } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const id = uuid();
  const createdAt = new Date().toISOString();
  run('INSERT INTO projects (id, name, description, owner, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, description || '', owner || '', status || 'active', createdAt]);
  saveDb();
  res.status(201).json({ id, name, description: description || '', owner: owner || '', status: status || 'active', createdAt });
});

// Update project
app.put('/api/projects/:id', (req, res) => {
  const existing = queryOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Project not found' });
  const { name, description, owner, status } = { ...existing, ...req.body };
  run('UPDATE projects SET name=?, description=?, owner=?, status=? WHERE id=?',
    [name, description, owner, status, req.params.id]);
  saveDb();
  res.json({ ...existing, name, description, owner, status });
});

// Delete project
app.delete('/api/projects/:id', (req, res) => {
  const changes = run('DELETE FROM projects WHERE id = ?', [req.params.id]);
  if (changes === 0) return res.status(404).json({ error: 'Project not found' });
  saveDb();
  res.json({ message: 'Deleted' });
});

app.use(errorHandler);

initDb().then(() => {
  app.listen(3001, () => logger.info('Project service running on port 3001'));
});
