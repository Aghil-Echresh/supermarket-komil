const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));

// ایجاد جدول در صورت نبودن
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0
    )
  `);
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: لیست
app.get('/api/todos', (req, res) => {
  db.all("SELECT * FROM todos ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API: ایجاد
app.post('/api/todos', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  db.run("INSERT INTO todos (title) VALUES (?)", [title], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get("SELECT * FROM todos WHERE id = ?", [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json(row);
    });
  });
});

// API: بروزرسانی (تغییر وضعیت / ویرایش)
app.put('/api/todos/:id', (req, res) => {
  const id = req.params.id;
  const { title, done } = req.body;
  db.run(
    "UPDATE todos SET title = COALESCE(?, title), done = COALESCE(?, done) WHERE id = ?",
    [title, done, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'not found' });
      db.get("SELECT * FROM todos WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
      });
    }
  );
});

// API: حذف
app.delete('/api/todos/:id', (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM todos WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'not found' });
    res.json({ success: true });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
