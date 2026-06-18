import fs from 'fs';
import path from 'path';
import { UserInputs, SensitivityProfile } from './ruleEngine';
import { FallbackExplanations } from './fallbacks';

export interface SavedResult {
  slug: string;
  inputs: UserInputs;
  values: SensitivityProfile;
  explanations: FallbackExplanations;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'results.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify({}), 'utf-8');
  }
}

export function saveResult(
  slug: string,
  inputs: UserInputs,
  values: SensitivityProfile,
  explanations: FallbackExplanations
): SavedResult {
  ensureDataFile();
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

export function getResult(slug: string): SavedResult | null {
  ensureDataFile();
  const fileContent = fs.readFileSync(FILE_PATH, 'utf-8');
  const db = JSON.parse(fileContent || '{}');
  return db[slug] || null;
}
