require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const bodyParser = require('body-parser');
const { URL } = require('url');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

// In-memory storage
const urls = [];
const idByUrl = new Map();

// Home page
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// POST: Create short URL
app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.json({ error: 'invalid url' });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(parsed.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Reuse if already exists
    if (idByUrl.has(parsed.href)) {
      const id = idByUrl.get(parsed.href);
      return res.json({ original_url: parsed.href, short_url: id });
    }

    const id = urls.length + 1;
    urls[id] = parsed.href;
    idByUrl.set(parsed.href, id);

    res.json({ original_url: parsed.href, short_url: id });
  });
});

// GET: Redirect to original URL
app.get('/api/shorturl/:id', (req, res) => {
  const id = Number(req.params.id);
  const original = urls[id];

  if (!original) {
    return res.json({ error: 'No short URL found for given input' });
  }

  res.redirect(original);
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
