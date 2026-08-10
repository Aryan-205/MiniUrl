import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Initialize the PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  ssl: {
    rejectUnauthorized: false,
  },
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/**
 * Initialize Tables and Indexes on startup
 */
async function initDB() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS urls (
      id BIGSERIAL PRIMARY KEY,
      code VARCHAR(16) UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_urls_code ON urls(code);
  `;

  try {
    await pool.query(queryText);
    console.log('PostgreSQL database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
}

const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),

  // Insert a new shortened URL
  async createUrl(code: string, originalUrl: string) {
    const queryText = `
      INSERT INTO urls (code, original_url)
      VALUES ($1, $2)
      ON CONFLICT (code) DO NOTHING
      RETURNING code, original_url, created_at;
    `;
    const res = await pool.query(queryText, [code, originalUrl]);
    return res.rows[0] || null;
  },

  // Lookup URL by short code
  async getUrlByCode(code: string) {
    const queryText = `
      SELECT original_url
      FROM urls
      WHERE code = $1;
    `;
    const res = await pool.query(queryText, [code]);
    return res.rows[0] || null;
  },

  initDB,
  pool,
};

export default db;