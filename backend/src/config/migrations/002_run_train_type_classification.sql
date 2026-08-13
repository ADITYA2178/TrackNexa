-- =============================================================================
-- Classification process + report
-- Safe: writes only to train_master / train_name_classification
-- =============================================================================

BEGIN;

TRUNCATE train_master;
TRUNCATE train_name_classification;

-- ---------------------------------------------------------------------------
-- A) train_master from distinct train_no
-- ---------------------------------------------------------------------------
INSERT INTO train_master (
  train_no, train_name, source_station, source_station_name,
  destination_station, destination_station_name
)
SELECT DISTINCT ON (train_no)
  train_no,
  train_name,
  source_station,
  source_station_name,
  destination_station,
  destination_station_name
FROM train_routes
WHERE train_no IS NOT NULL AND TRIM(train_no) <> ''
ORDER BY train_no, id;

WITH classified AS (
  SELECT
    tm.train_no,
    CASE
      WHEN tm.train_name ~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$' THEN ARRAY['TIME_AS_NAME']
      WHEN tm.train_name ~ '^[A-Z]{1,2}[0-9]{1,3}$' THEN ARRAY['COACH_CODE_AS_NAME']
      WHEN tm.train_no !~ '^[0-9]+$' THEN ARRAY['NON_NUMERIC_TRAIN_NO']
      WHEN LENGTH(TRIM(COALESCE(tm.train_name, ''))) <= 2 THEN ARRAY['TOO_SHORT']
      WHEN LENGTH(tm.train_name) = 12 THEN ARRAY['LIKELY_TRUNCATED']
      ELSE ARRAY[]::TEXT[]
    END AS flags,
    nr.id AS name_rule_id,
    nr.train_type AS name_type,
    nr.confidence AS name_confidence,
    rng.train_type AS range_type,
    rng.confidence AS range_confidence
  FROM train_master tm
  LEFT JOIN LATERAL (
    SELECT r.id, r.train_type, r.confidence
    FROM train_type_rules r
    WHERE r.is_active
      AND r.match_field = 'train_name'
      AND tm.train_name ~* r.pattern
    ORDER BY r.priority ASC, r.confidence DESC
    LIMIT 1
  ) nr ON TRUE
  LEFT JOIN LATERAL (
    SELECT r.train_type, r.confidence
    FROM train_number_type_ranges r
    WHERE tm.train_no ~ '^[0-9]+$'
      AND CAST(tm.train_no AS INTEGER) BETWEEN r.prefix_from AND r.prefix_to
    ORDER BY r.confidence DESC, (r.prefix_to - r.prefix_from) ASC
    LIMIT 1
  ) rng ON TRUE
)
UPDATE train_master tm
SET
  train_type = CASE
    WHEN 'TIME_AS_NAME' = ANY (c.flags) THEN 'INVALID'
    WHEN 'COACH_CODE_AS_NAME' = ANY (c.flags) AND c.name_type IS NULL
      THEN COALESCE(c.range_type, 'UNKNOWN')
    WHEN c.name_type IS NOT NULL THEN c.name_type
    WHEN c.range_type IS NOT NULL THEN c.range_type
    ELSE 'UNKNOWN'
  END,
  classification_status = CASE
    WHEN 'TIME_AS_NAME' = ANY (c.flags) THEN 'INVALID_NAME'
    WHEN 'COACH_CODE_AS_NAME' = ANY (c.flags) AND c.name_type IS NULL AND c.range_type IS NOT NULL THEN 'REVIEW'
    WHEN 'COACH_CODE_AS_NAME' = ANY (c.flags) AND c.name_type IS NULL THEN 'INVALID_NAME'
    WHEN c.name_type IS NOT NULL AND c.name_confidence >= 0.90 THEN 'VALID'
    WHEN c.name_type IS NOT NULL THEN 'REVIEW'
    WHEN c.range_type IS NOT NULL THEN 'REVIEW'
    ELSE 'UNKNOWN'
  END,
  confidence = CASE
    WHEN 'TIME_AS_NAME' = ANY (c.flags) THEN 0.990
    WHEN c.name_type IS NOT NULL THEN c.name_confidence
    WHEN c.range_type IS NOT NULL THEN c.range_confidence
    ELSE 0.100
  END,
  matched_rule_id = c.name_rule_id,
  matched_by = CASE
    WHEN 'TIME_AS_NAME' = ANY (c.flags) THEN 'INVALID_PATTERN'
    WHEN c.name_type IS NOT NULL THEN 'NAME_RULE'
    WHEN c.range_type IS NOT NULL THEN 'NUMBER_RANGE'
    ELSE 'UNMATCHED'
  END,
  updated_at = NOW()
FROM classified c
WHERE tm.train_no = c.train_no;

-- ---------------------------------------------------------------------------
-- B) Unique train_name report (independent classification)
-- ---------------------------------------------------------------------------
INSERT INTO train_name_classification (
  train_name,
  sample_train_no,
  train_count,
  row_count,
  train_type,
  classification_status,
  confidence,
  matched_by,
  matched_rule_id,
  data_quality_flags
)
SELECT
  n.train_name,
  n.sample_train_no,
  n.train_count,
  n.row_count,
  CASE
    WHEN n.train_name ~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$' THEN 'INVALID'
    WHEN n.train_name ~ '^[A-Z]{1,2}[0-9]{1,3}$' THEN COALESCE(rng.train_type, 'UNKNOWN')
    WHEN nr.train_type IS NOT NULL THEN nr.train_type
    WHEN rng.train_type IS NOT NULL THEN rng.train_type
    ELSE 'UNKNOWN'
  END AS train_type,
  CASE
    WHEN n.train_name ~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$' THEN 'INVALID_NAME'
    WHEN n.train_name ~ '^[A-Z]{1,2}[0-9]{1,3}$' AND rng.train_type IS NOT NULL THEN 'REVIEW'
    WHEN n.train_name ~ '^[A-Z]{1,2}[0-9]{1,3}$' THEN 'INVALID_NAME'
    WHEN nr.train_type IS NOT NULL AND nr.confidence >= 0.90 THEN 'VALID'
    WHEN nr.train_type IS NOT NULL THEN 'REVIEW'
    WHEN rng.train_type IS NOT NULL THEN 'REVIEW'
    ELSE 'UNKNOWN'
  END AS classification_status,
  CASE
    WHEN n.train_name ~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$' THEN 0.990
    WHEN nr.train_type IS NOT NULL THEN nr.confidence
    WHEN rng.train_type IS NOT NULL THEN rng.confidence
    ELSE 0.100
  END AS confidence,
  CASE
    WHEN n.train_name ~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$' THEN 'INVALID_PATTERN'
    WHEN nr.train_type IS NOT NULL THEN 'NAME_RULE'
    WHEN rng.train_type IS NOT NULL THEN 'NUMBER_RANGE'
    ELSE 'UNMATCHED'
  END AS matched_by,
  nr.id AS matched_rule_id,
  CASE
    WHEN n.train_name ~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$' THEN ARRAY['TIME_AS_NAME']
    WHEN n.train_name ~ '^[A-Z]{1,2}[0-9]{1,3}$' THEN ARRAY['COACH_CODE_AS_NAME']
    WHEN LENGTH(TRIM(n.train_name)) <= 2 THEN ARRAY['TOO_SHORT']
    WHEN LENGTH(n.train_name) = 12 THEN ARRAY['LIKELY_TRUNCATED']
    WHEN n.train_name ~ '^[A-Z0-9]{2,5}-[A-Z0-9]{2,5}' THEN ARRAY['ROUTE_CODE_STYLE']
    ELSE ARRAY[]::TEXT[]
  END AS data_quality_flags
FROM (
  SELECT
    train_name,
    MIN(train_no) AS sample_train_no,
    COUNT(DISTINCT train_no) AS train_count,
    COUNT(*) AS row_count
  FROM train_routes
  WHERE train_name IS NOT NULL
  GROUP BY train_name
) n
LEFT JOIN LATERAL (
  SELECT r.id, r.train_type, r.confidence
  FROM train_type_rules r
  WHERE r.is_active
    AND r.match_field = 'train_name'
    AND n.train_name ~* r.pattern
  ORDER BY r.priority ASC, r.confidence DESC
  LIMIT 1
) nr ON TRUE
LEFT JOIN LATERAL (
  SELECT r.train_type, r.confidence
  FROM train_number_type_ranges r
  WHERE n.sample_train_no ~ '^[0-9]+$'
    AND CAST(n.sample_train_no AS INTEGER) BETWEEN r.prefix_from AND r.prefix_to
  ORDER BY r.confidence DESC, (r.prefix_to - r.prefix_from) ASC
  LIMIT 1
) rng ON TRUE;

COMMIT;

SELECT classification_status, COUNT(*) AS trains
FROM train_master
GROUP BY classification_status
ORDER BY trains DESC;

SELECT train_type, COUNT(*) AS trains
FROM train_master
GROUP BY train_type
ORDER BY trains DESC;

SELECT classification_status, COUNT(*) AS names
FROM train_name_classification
GROUP BY classification_status
ORDER BY names DESC;
