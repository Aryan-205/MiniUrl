import express from 'express';
import cors from 'cors';
import { hasher } from './helper/hasher.js';
import db from './db/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/**
 * GET /:code
 * Looks up short code and performs a 302 redirect to original URL
 */
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const record = await db.getUrlByCode(code);

    if (!record) {
      return res.status(404).json({ message: 'Short URL not found' });
    }
    console.log(`[SUCCESS] Redirecting "${code}" -> ${record.original_url}`);
    return res.redirect(301, record.original_url);
  } catch (error) {
    console.error('Error handling redirect:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /shorten
 * Generates or retrieves a short code for the target URL
 */
app.post('/shorten', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string' || url.trim() === '') {
      return res.status(400).json({ message: 'URL is required' });
    }

    const shortCode = hasher(url);

    // Check if code already exists in DB
    let record = await db.getUrlByCode(shortCode);

    if (!record) {
      // Create new short URL record
      await db.createUrl(shortCode, url);
    }

    return res.json({
      message: 'Short URL generated successfully',
      shortCode,
      shortUrl: `${req.protocol}://${req.get('host')}/${shortCode}`,
      originalUrl: url,
    });
  } catch (error) {
    console.error('Error creating short URL:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Initialize DB and start server
 */
async function startServer() {
  try {
    await db.initDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server due to DB connection error:', err);
    process.exit(1);
  }
}



startServer();