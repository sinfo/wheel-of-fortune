const path = require('path');
const database = require('better-sqlite3');
const db = new database(path.join(__dirname, 'prizes.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS prizes (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    stock INTEGER NOT NULL,
    color TEXT NOT NULL
  );
`);

const prizes = [
  { name: 'Black T-shirt', color: '#F53710', stock: 1 },
  { name: 'White T-shirt', color: '#FF9500', stock: 1 },
  { name: 'White Tote', color: '#FFD700', stock: 1 },
  { name: '4 Colors Tote', color: '#32CD32', stock: 1 },
  { name: 'Mug', color: '#008F39', stock: 1 },
  { name: 'Cup', color: '#00CFFF', stock: 1 },
  { name: 'Lanyard', color: '#4169E1', stock: 1 },
  { name: 'Key Holder', color: '#06368F', stock: 1 },
  { name: 'Card Holder', color: '#40E0D0', stock: 1 },
  { name: 'Stress Ball', color: '#8000FF', stock: 1 },
  { name: 'Post-its', color: '#FF1493', stock: 1 },
  { name: 'Webcam Cover', color: '#FF91A4', stock: 1 },
  { name: 'Snacks', color: '#FF00FF', stock: 1 },
  { name: 'Voucher - Cinema City', color: '#ee1e71ff', stock: 2 },
  { name: 'Stickers', color: '#f72727ff', stock: 2 }
];

// Clear any existing data.
db.prepare('DELETE FROM prizes').run();

// Insert initial prizes.
const insert_all = db.transaction((items) => {
  for (const p of items) {
    db.prepare('INSERT INTO prizes (name, color, stock) VALUES (?, ?, ?)').run(p.name, p.color, p.stock);
  }
});
insert_all(prizes);

console.log('Database initialized.');
