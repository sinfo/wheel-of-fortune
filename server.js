const path = require('path');
const Database = require('better-sqlite3');
const express = require('express');

const app = express();
const db = new Database(path.join(__dirname, 'prizes.db'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/confetti.js', (_, res) => res.sendFile(path.join(__dirname, 'node_modules', 'canvas-confetti', 'dist', 'confetti.browser.js')));
db.exec(`
  CREATE TABLE IF NOT EXISTS prizes (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    stock INTEGER NOT NULL,
    color TEXT NOT NULL
  );
`);

app.get('/api/get-prizes', (_, res) => {
  const rows = db.prepare('SELECT id, name, stock, color FROM prizes WHERE stock > 0 ORDER BY id').all();
  res.json(rows);
});

app.post('/api/select-prize', (_, res) => {
  const rows = db.prepare('SELECT id, name, stock, color FROM prizes WHERE stock > 0 ORDER BY id').all();

  const total_row = db.prepare('SELECT SUM(stock) as total FROM prizes WHERE stock > 0').get();
  const total = total_row?.total || 0;
  if (!total) return res.status(400).json({ error: 'No prizes left' });

  const r = Math.floor(Math.random() * total) + 1;

  let accumulated = 0;
  let chosen = null;
  for (const p of rows) {
    accumulated += p.stock;
    if (r <= accumulated) {
      chosen = p;
      break;
    }
  }

  const idx = rows.findIndex(p => p.id === chosen.id);

  res.json({
    id: chosen.id,
    name: chosen.name,
    color: chosen.color,
    stock: chosen.stock,
    index: idx
  });
});

app.post('/api/claim-prize', (req, res) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Missing prize id' });

  try {
    const info = db.prepare('UPDATE prizes SET stock = stock - 1 WHERE id = ? AND stock > 0').run(id);
    if (info.changes === 0) return res.status(400).json({ error: 'No stock remaining' });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Admin Routes
app.get('/api/admin/get-prizes', (_, res) => {
  const rows = db.prepare('SELECT id, name, stock, color FROM prizes ORDER BY id').all();
  res.json(rows);
});

app.post('/api/admin/prizes', (req, res) => {
  const { name, color, stock } = req.body || {};
  if (!name || typeof stock === 'undefined') return res.status(400).json({ error: 'Missing fields' });
  try {
    const info = db.prepare('INSERT INTO prizes (name, stock, color) VALUES (?, ?, ?)').run(name, Number(stock), color || '#cccccc');
    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/prizes/:id', (req, res) => {
  const id = Number(req.params.id);
  const { name, color, stock } = req.body || {};
  if (!name || typeof stock === 'undefined') return res.status(400).json({ error: 'Missing fields' });
  try {
    const info = db.prepare('UPDATE prizes SET name = ?, color = ?, stock = ? WHERE id = ?').run(name, color || '#cccccc', Number(stock), id);
    res.json({ changes: info.changes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/prizes/:id', (req, res) => {
  const id = Number(req.params.id);
  try {
    const info = db.prepare('DELETE FROM prizes WHERE id = ?').run(id);
    res.json({ changes: info.changes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.get('/admin', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Visit: http://localhost:${port}`));
