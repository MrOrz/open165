import { cache } from 'react';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { searchSimilar } from '@/lib/fts';

/** Scam site report */
type Record = {
  id: number;
  name: string;
  url: string;
  count: number;
  startDate: string;
  endDate: string;
  host: string;
}

/** Get records with site name */
export const getRecords = cache(async (name: string) => {
  const db = getRequestContext().env.DB;
  const directHitPromise = db.prepare(`
    SELECT *
    FROM ScamSiteRecord
    WHERE lower(name) = lower(?)
    ORDER BY endDate DESC
  `).bind(name).all<Record>().then(({results}) => results);

  return Promise.all([directHitPromise, searchSimilar(name)]);
});
