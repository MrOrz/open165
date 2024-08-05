-- Migration number: 0002 	 2024-07-25T16:00:25.449Z

CREATE VIRTUAL TABLE IF NOT EXISTS "ScamSiteRecordFTS" USING fts5(
  name,
  host,
  content='ScamSiteRecord',
  tokenize='trigram'
);
