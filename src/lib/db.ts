import type { D1Database } from './d1-adapter';

export interface State {
  state: string;
  state_name: string;
  licensing_required: number;
  licensing_board_name: string;
  licensing_board_url: string;
  verification_url: string;
  complaint_url: string;
  trades_licensed: number;
  data_source: string;
  last_updated: string;
}

export interface Trade {
  trade_slug: string;
  trade_name: string;
  description: string;
  states_requiring_license: number;
}

export interface LicensingRequirement {
  state: string;
  trade_slug: string;
  required: number;
  license_type: string;
  exam_required: number;
  experience_years: number;
  bond_required: number;
  bond_amount: number | null;
  insurance_required: number;
  insurance_min: number | null;
  ce_required: number;
  ce_hours: number | null;
  fee_range: string;
  notes: string;
}

export interface StateRanking {
  state: string;
  ranking_type: string;
  rank: number;
  score: number;
  notes?: string;
}

export interface ConsumerTip {
  id: number;
  state: string | null;
  title: string;
  content: string;
  category: string;
}

export interface FAQ {
  id: number;
  state: string | null;
  trade_slug: string | null;
  question: string;
  answer: string;
}

// ---- Query cache ----
interface CacheEntry { value: unknown; ts: number }
const queryCache = new Map<string, CacheEntry>();
const CACHE_TTL = 300_000; // 5 min
const MAX_CACHE_ENTRIES = 500;

function fromCache<T>(key: string): T | null {
  const e = queryCache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) { queryCache.delete(key); return null; }
  return e.value as T;
}

function toCache(key: string, value: unknown) {
  if (queryCache.size >= MAX_CACHE_ENTRIES) {
    const first = queryCache.keys().next().value;
    if (first) queryCache.delete(first);
  }
  queryCache.set(key, { value, ts: Date.now() });
}

export function getQueryCacheSize() { return queryCache.size; }

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = fromCache<T>(key);
  if (hit !== null) return Promise.resolve(hit);
  return fn().then(v => { toCache(key, v); return v; });
}

// ---- Queries ----

export async function getAllStates(db: D1Database): Promise<State[]> {
  return cached('states:all', async () => {
    const r = await db.prepare('SELECT * FROM states ORDER BY state_name COLLATE NOCASE').all<State>();
    return r.results;
  });
}

export async function getState(db: D1Database, state: string): Promise<State | null> {
  return cached(`state:${state}`, async () => {
    return db.prepare('SELECT * FROM states WHERE state = ?').bind(state.toUpperCase()).first<State>();
  });
}

export async function getAllTrades(db: D1Database): Promise<Trade[]> {
  return cached('trades:all', async () => {
    const r = await db.prepare('SELECT * FROM trades ORDER BY trade_name COLLATE NOCASE').all<Trade>();
    return r.results;
  });
}

export async function getTrade(db: D1Database, slug: string): Promise<Trade | null> {
  return cached(`trade:${slug}`, async () => {
    return db.prepare('SELECT * FROM trades WHERE trade_slug = ?').bind(slug).first<Trade>();
  });
}

export async function getRequirement(db: D1Database, state: string, tradeSlug: string): Promise<LicensingRequirement | null> {
  return cached(`req:${state}:${tradeSlug}`, async () => {
    return db.prepare('SELECT * FROM licensing_requirements WHERE state = ? AND trade_slug = ?')
      .bind(state.toUpperCase(), tradeSlug).first<LicensingRequirement>();
  });
}

export async function getRequirementsByState(db: D1Database, state: string): Promise<LicensingRequirement[]> {
  return cached(`reqs:state:${state}`, async () => {
    const r = await db.prepare('SELECT lr.*, t.trade_name FROM licensing_requirements lr JOIN trades t ON lr.trade_slug = t.trade_slug WHERE lr.state = ? ORDER BY t.trade_name COLLATE NOCASE')
      .bind(state.toUpperCase()).all<LicensingRequirement & { trade_name: string }>();
    return r.results;
  });
}

export async function getRequirementsByTrade(db: D1Database, tradeSlug: string): Promise<(LicensingRequirement & { state_name: string })[]> {
  return cached(`reqs:trade:${tradeSlug}`, async () => {
    const r = await db.prepare('SELECT lr.*, s.state_name FROM licensing_requirements lr JOIN states s ON lr.state = s.state WHERE lr.trade_slug = ? ORDER BY s.state_name COLLATE NOCASE')
      .bind(tradeSlug).all<LicensingRequirement & { state_name: string }>();
    return r.results;
  });
}

export async function getRankings(db: D1Database, rankingType: string): Promise<(StateRanking & { state_name: string })[]> {
  return cached(`rankings:${rankingType}`, async () => {
    const r = await db.prepare('SELECT sr.*, s.state_name FROM state_rankings sr JOIN states s ON sr.state = s.state WHERE sr.ranking_type = ? ORDER BY sr.rank')
      .bind(rankingType).all<StateRanking & { state_name: string }>();
    return r.results;
  });
}

export async function getAllRankingTypes(db: D1Database): Promise<string[]> {
  return cached('rankings:types', async () => {
    const r = await db.prepare('SELECT DISTINCT ranking_type FROM state_rankings ORDER BY ranking_type').all<{ ranking_type: string }>();
    return r.results.map(row => row.ranking_type);
  });
}

export async function getConsumerTips(db: D1Database, state?: string): Promise<ConsumerTip[]> {
  const key = `tips:${state || 'global'}`;
  return cached(key, async () => {
    if (state) {
      const r = await db.prepare("SELECT * FROM consumer_tips WHERE state = ? OR state IS NULL OR state = '' ORDER BY id")
        .bind(state.toUpperCase()).all<ConsumerTip>();
      return r.results;
    }
    const r = await db.prepare("SELECT * FROM consumer_tips WHERE state IS NULL OR state = '' ORDER BY id").all<ConsumerTip>();
    return r.results;
  });
}

export async function getFAQs(db: D1Database, state?: string, tradeSlug?: string): Promise<FAQ[]> {
  const key = `faqs:${state || ''}:${tradeSlug || ''}`;
  return cached(key, async () => {
    if (tradeSlug) {
      const r = await db.prepare("SELECT * FROM faqs WHERE (trade_slug = ? OR (trade_slug IS NULL OR trade_slug = '')) AND (state IS NULL OR state = '') ORDER BY id")
        .bind(tradeSlug).all<FAQ>();
      return r.results;
    }
    if (state) {
      const r = await db.prepare("SELECT * FROM faqs WHERE (state = ? OR (state IS NULL OR state = '')) ORDER BY id")
        .bind(state.toUpperCase()).all<FAQ>();
      return r.results;
    }
    const r = await db.prepare("SELECT * FROM faqs WHERE (state IS NULL OR state = '') AND (trade_slug IS NULL OR trade_slug = '') ORDER BY id").all<FAQ>();
    return r.results;
  });
}

export async function getStateSummary(db: D1Database): Promise<{ total: number; requiring: number; not_requiring: number }> {
  return cached('states:summary', async () => {
    const r = await db.prepare('SELECT COUNT(*) as total, SUM(licensing_required) as requiring FROM states').first<{ total: number; requiring: number }>();
    return { total: r?.total || 0, requiring: r?.requiring || 0, not_requiring: (r?.total || 0) - (r?.requiring || 0) };
  });
}

// Warm cache on startup
export async function warmQueryCache(db: D1Database, batchSize = 10, pauseMs = 500): Promise<void> {
  await getAllStates(db);
  await new Promise(r => setTimeout(r, pauseMs));
  await getAllTrades(db);
  await new Promise(r => setTimeout(r, pauseMs));
  await getStateSummary(db);
  await new Promise(r => setTimeout(r, pauseMs));
  await getFAQs(db);
  await new Promise(r => setTimeout(r, pauseMs));
  await getConsumerTips(db);
  await new Promise(r => setTimeout(r, pauseMs));
  await getRankings(db, 'strictness');
  await new Promise(r => setTimeout(r, pauseMs));
  await getRankings(db, 'consumer_friendly');
}
