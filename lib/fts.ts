import { trigram } from 'n-gram';
import { getRequestContext } from '@cloudflare/next-on-pages';

export type FTSRecord = {
  rowid: number;
  /** Strings with odd index are matched tokens */
  nameTokens: string[];
  /** Strings with odd index are matched tokens */
  hostTokens: string[];
  rank: number;

  /** Total number of reports */
  count: number;

  /** Start date of the first report */
  startDate: string;
  /** End date of the last report */
  endDate: string;
}

const SEP = ['{{', '}}'];
const SEP_RE = new RegExp(String.raw`${SEP[0]}(.*?)${SEP[1]}`);

/**
 * @param queryInput - Search query to look for in both `name` and `url` fields
 * @param limit - Max number of results to return
 * @returns Documents as FTSRecord[] that partially match the query
 */
export async function searchSimilar(queryInput: string, limit=20): Promise<FTSRecord[]> {
  const query = queryInput.trim();
  const db = getRequestContext().env.DB;
  const shouldUseFts = query.length > 2; // ScamSiteRecordFTS is a trigram index, only support queries with 3 or more characters
  const whereClause = shouldUseFts ?
    `ScamSiteRecordFTS MATCH '${trigram(query).map(g => `"${g.replaceAll('"', '""')}"`).join(' OR ')}'` :
    `(name LIKE ? OR host LIKE ?)`;
  const values = shouldUseFts ? [] : [`%${query}%`, `%${query}%`];

  /** Select similar with full-text search, but reject 100% match */
  const sql = `
    SELECT
      max(rowid) AS rowid,
      ranked.name AS name,
      ranked.host AS host,
      max(rank) AS rank,
      sum(count) AS count,
      min(startDate) AS startDate,
      max(endDate) AS endDate
    FROM (
      SELECT
        rowid,
        highlight(ScamSiteRecordFTS,0,'${SEP[0]}','${SEP[1]}') AS name,
        highlight(ScamSiteRecordFTS,1,'${SEP[0]}','${SEP[1]}') AS host,
        rank
      FROM ScamSiteRecordFTS
      WHERE ${whereClause}
        AND lower(name) != lower(?)
        AND lower(host) != lower(?)
      ORDER BY rank
      LIMIT ${limit*2 /* Not sure query it would fail without LIMIT. Enlarge limit for grouping in the next phase */}
    ) AS ranked
    LEFT JOIN ScamSiteRecord ON rowid = ScamSiteRecord.id
    GROUP BY ranked.name, ranked.host
    ORDER BY rank
    LIMIT ${limit}
  `;

  const { results } = await db.prepare(sql).bind(...values, query, query).all<Omit<FTSRecord, 'nameTokens' | 'hostTokens'> & {name: string; host: string}>();

  if(!shouldUseFts) {
    // Modify result name and url to wrap matched tokens with SEP
    results.forEach(record => {
      record.name = record.name.replaceAll(query, `${SEP[0]}$&${SEP[1]}`);
      record.host = record.host.replaceAll(query, `${SEP[0]}$&${SEP[1]}`);
    });
  }

  return results.map(({name, host, ...record}) => ({
    ...record,
    nameTokens: name.split(SEP_RE),
    hostTokens: host.split(SEP_RE),
  }));
}

