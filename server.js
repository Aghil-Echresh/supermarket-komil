const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const db = new sqlite3.Database(process.env.DB_PATH || path.join(__dirname, 'db.sqlite'));

const BALE_API = 'https://tapi.bale.ai/bot';
const BALE_TOKEN = process.env.BALE_BOT_TOKEN || '';
const BALE_WEBHOOK_SECRET = process.env.BALE_WEBHOOK_SECRET || '';

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bale_users (
      chat_id TEXT PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      username TEXT,
      updated_at TEXT NOT NULL
    )
  `);
});

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'supermarket-komil',
    bale: Boolean(BALE_TOKEN),
    time: new Date().toISOString()
  });
});

// -------------------- Existing Todo API --------------------

app.get('/api/todos', (req, res) => {
  db.all('SELECT * FROM todos ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/todos', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  db.run('INSERT INTO todos (title) VALUES (?)', [title], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    db.get('SELECT * FROM todos WHERE id = ?', [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json(row);
    });
  });
});

app.put('/api/todos/:id', (req, res) => {
  const id = req.params.id;
  const { title, done } = req.body;

  db.run(
    'UPDATE todos SET title = COALESCE(?, title), done = COALESCE(?, done) WHERE id = ?',
    [title, done, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'not found' });

      db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
      });
    }
  );
});

app.delete('/api/todos/:id', (req, res) => {
  const id = req.params.id;

  db.run('DELETE FROM todos WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'not found' });
    res.json({ success: true });
  });
});

// -------------------- Bale Bot --------------------

async function baleApi(method, payload = {}) {
  if (!BALE_TOKEN) throw new Error('BALE_BOT_TOKEN is not configured');

  const response = await fetch(
    `${BALE_API}${BALE_TOKEN}/${method}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );

  const data = await response.json();

  if (!response.ok || data.ok === false) {
    throw new Error(data.description || `Bale API HTTP ${response.status}`);
  }

  return data;
}

async function sendBaleMessage(chatId, text, replyMarkup) {
  return baleApi('sendMessage', {
    chat_id: chatId,
    text,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {})
  });
}

const mainKeyboard = {
  keyboard: [
    [{ text: '🛒 محصولات' }, { text: '🧾 ثبت سفارش' }],
    [{ text: '📦 پیگیری سفارش' }, { text: '💰 حساب من' }],
    [{ text: '📍 آدرس فروشگاه' }, { text: '☎️ تماس با ما' }]
  ],
  resize_keyboard: true,
  is_persistent: true
};

function menuText(firstName = '') {
  const name = firstName ? ` ${firstName}` : '';
  return `سلام${name} 👋
به ربات *سوپرمارکت کمیل* خوش اومدی 🌿

از منوی پایین انتخاب کن تا راهنماییت کنم.`;
}

function normalize(text = '') {
  return text.trim().replace(/ي/g, 'ی').replace(/ك/g, 'ک');
}

async function handleBaleUpdate(update) {
  const message = update?.message;
  if (!message?.chat?.id) return;

  const chatId = String(message.chat.id);
  const user = message.from || {};
  const text = normalize(message.text || '');

  db.run(
    `INSERT INTO bale_users (chat_id, first_name, last_name, username, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(chat_id) DO UPDATE SET
       first_name = excluded.first_name,
       last_name = excluded.last_name,
       username = excluded.username,
       updated_at = excluded.updated_at`,
    [
      chatId,
      user.first_name || '',
      user.last_name || '',
      user.username || '',
      new Date().toISOString()
    ]
  );

  if (text === '/start' || text.startsWith('/start ')) {
    return sendBaleMessage(chatId, menuText(user.first_name), mainKeyboard);
  }

  if (text === '🛒 محصولات' || text === 'محصولات' || text === '/products') {
    return sendBaleMessage(
      chatId,
      `🛒 *محصولات سوپرمارکت کمیل*

فعلاً فهرست کالاها در حال تکمیل است.
برای سفارش می‌تونی همین‌جا پیام بدی یا گزینه «🧾 ثبت سفارش» رو بزن.`,
      mainKeyboard
    );
  }

  if (text === '🧾 ثبت سفارش' || text === 'ثبت سفارش' || text === '/order') {
    return sendBaleMessage(
      chatId,
      `🧾 *ثبت سفارش*

لطفاً نام کالاها و تعدادشان را در یک پیام بفرست.
مثلاً:
شیر ۲ عدد
چیپس ۱ عدد
ماست ۲ عدد

بعد سفارش را بررسی می‌کنیم و نتیجه را بهت اعلام می‌کنیم. 🙏`,
      mainKeyboard
    );
  }

  if (text === '📦 پیگیری سفارش' || text === 'پیگیری سفارش') {
    return sendBaleMessage(
      chatId,
      '📦 برای پیگیری سفارش، شماره سفارش را ارسال کن.',
      mainKeyboard
    );
  }

  if (text === '💰 حساب من' || text === 'حساب من') {
    return sendBaleMessage(
      chatId,
      '💰 اطلاعات حساب مشتری در نسخه بعدی ربات فعال می‌شود.',
      mainKeyboard
    );
  }

  if (text === '📍 آدرس فروشگاه' || text === 'آدرس فروشگاه') {
    return sendBaleMessage(
      chatId,
      `📍 *سوپرمارکت کمیل*
کوی ابوذر، خیابان نشان، بین فرعی ۳ و ۴

☎️ ۰۹۰۳۰۶۳۵۶۴۸`,
      mainKeyboard
    );
  }

  if (text === '☎️ تماس با ما' || text === 'تماس با ما') {
    return sendBaleMessage(
      chatId,
      '☎️ مدیریت: عقیل عچرش\n۰۹۰۳۰۶۳۵۶۴۸',
      mainKeyboard
    );
  }

  return sendBaleMessage(
    chatId,
    'پیامت دریافت شد 🌱 برای ادامه از منوی پایین استفاده کن.',
    mainKeyboard
  );
}

// Bale sends POST updates to this HTTPS endpoint.
app.post('/bale/webhook/:secret', async (req, res) => {
  if (!BALE_WEBHOOK_SECRET || req.params.secret !== BALE_WEBHOOK_SECRET) {
    return res.sendStatus(404);
  }

  // Acknowledge immediately so Bale does not retry while we process the update.
  res.sendStatus(200);

  try {
    await handleBaleUpdate(req.body);
  } catch (error) {
    console.error('Bale update error:', error.message);
  }
});

// Optional protected endpoint for configuring the webhook after deployment.
app.post('/api/bale/set-webhook', async (req, res) => {
  const adminSecret = process.env.BALE_ADMIN_SECRET;

  if (!adminSecret || req.headers['x-admin-secret'] !== adminSecret) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const baseUrl = String(req.body?.base_url || '').replace(/\/$/, '');

  if (!baseUrl || !BALE_WEBHOOK_SECRET) {
    return res.status(400).json({
      ok: false,
      error: 'base_url and BALE_WEBHOOK_SECRET are required'
    });
  }

  const webhookUrl = `${baseUrl}/bale/webhook/${BALE_WEBHOOK_SECRET}`;

  try {
    const result = await baleApi('setWebhook', { url: webhookUrl });
    res.json({ ...result, webhook_url: webhookUrl });
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message });
  }
});

app.get('/api/bale/webhook-info', async (req, res) => {
  const adminSecret = process.env.BALE_ADMIN_SECRET;

  if (!adminSecret || req.headers['x-admin-secret'] !== adminSecret) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  try {
    const result = await baleApi('getWebhookInfo');
    res.json(result);
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

async function configureBaleWebhookOnStartup() {
  const publicUrl = process.env.RENDER_EXTERNAL_URL || process.env.BALE_PUBLIC_URL;

  if (!BALE_TOKEN || !BALE_WEBHOOK_SECRET || !publicUrl) {
    return;
  }

  const webhookUrl = `${String(publicUrl).replace(/\\/$/, '')}/bale/webhook/${BALE_WEBHOOK_SECRET}`;

  try {
    await baleApi('setWebhook', { url: webhookUrl });
    console.log(`Bale webhook configured: ${webhookUrl}`);
  } catch (error) {
    console.error('Bale webhook configuration failed:', error.message);
  }
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Bale bot configured: ${Boolean(BALE_TOKEN)}`);
  await configureBaleWebhookOnStartup();
});
