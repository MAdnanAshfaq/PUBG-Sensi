import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import { UserInputs, SensitivityProfile } from './ruleEngine';
import { FallbackExplanations } from './fallbacks';

export interface SavedResult {
  slug: string;
  inputs: UserInputs;
  values: SensitivityProfile;
  explanations: FallbackExplanations;
  createdAt: string;
}

// Environment config
const DATABASE_URL = process.env.DATABASE_URL;
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'results.json');

// Helper to initialize PostgreSQL client
const getSql = () => {
  if (!DATABASE_URL) return null;
  return neon(DATABASE_URL);
};

// PostgreSQL Table definition auto-creation
let isTableInitialized = false;
async function ensurePostgresTable() {
  if (isTableInitialized) return;
  const sql = getSql();
  if (!sql) return;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS aimsync_results (
        slug VARCHAR(10) PRIMARY KEY,
        inputs JSONB NOT NULL,
        values JSONB NOT NULL,
        explanations JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    isTableInitialized = true;
  } catch (error) {
    console.error('Failed to initialize PostgreSQL table:', error);
  }
}

// Local filesystem fallback functions
function ensureLocalDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify({}), 'utf-8');
  }
}

export async function saveResult(
  slug: string,
  inputs: UserInputs,
  values: SensitivityProfile,
  explanations: FallbackExplanations
): Promise<SavedResult> {
  const sql = getSql();
  
  if (sql) {
    await ensurePostgresTable();
    const createdAt = new Date().toISOString();
    try {
      await sql`
        INSERT INTO aimsync_results (slug, inputs, values, explanations, created_at)
        VALUES (${slug}, ${inputs as any}, ${values as any}, ${explanations as any}, ${createdAt})
        ON CONFLICT (slug) DO UPDATE SET 
          inputs = ${inputs as any}, 
          values = ${values as any}, 
          explanations = ${explanations as any};
      `;
      return { slug, inputs, values, explanations, createdAt };
    } catch (error) {
      console.error('Failed to save result to PostgreSQL, falling back to disk:', error);
    }
  }

  // Filesystem fallback
  ensureLocalDataFile();
  const fileContent = fs.readFileSync(FILE_PATH, 'utf-8');
  const db = JSON.parse(fileContent || '{}');

  const newResult: SavedResult = {
    slug,
    inputs,
    values,
    explanations,
    createdAt: new Date().toISOString(),
  };

  db[slug] = newResult;
  fs.writeFileSync(FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  return newResult;
}

export async function getResult(slug: string): Promise<SavedResult | null> {
  const sql = getSql();

  if (sql) {
    await ensurePostgresTable();
    try {
      const rows = await sql`
        SELECT slug, inputs, values, explanations, created_at AS "createdAt"
        FROM aimsync_results
        WHERE slug = ${slug}
        LIMIT 1;
      `;
      if (rows.length > 0) {
        const row = rows[0];
        return {
          slug: row.slug,
          inputs: row.inputs as any,
          values: row.values as any,
          explanations: row.explanations as any,
          createdAt: typeof row.createdAt === 'string' ? row.createdAt : new Date(row.createdAt).toISOString(),
        };
      }
    } catch (error) {
      console.error('Failed to read result from PostgreSQL, falling back to disk:', error);
    }
  }

  // Filesystem fallback
  ensureLocalDataFile();
  const fileContent = fs.readFileSync(FILE_PATH, 'utf-8');
  const db = JSON.parse(fileContent || '{}');
  return db[slug] || null;
}
