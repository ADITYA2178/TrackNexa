-- Optional: expose type without duplicating onto every stop row
CREATE OR REPLACE VIEW v_train_routes_with_type AS
SELECT
  tr.*,
  tm.train_type,
  tm.classification_status,
  tm.confidence AS train_type_confidence,
  tm.matched_by
FROM train_routes tr
LEFT JOIN train_master tm ON tm.train_no = tr.train_no;

-- UNKNOWN queue for manual review
CREATE OR REPLACE VIEW v_train_names_unknown AS
SELECT
  train_name,
  sample_train_no,
  train_count,
  row_count,
  train_type,
  classification_status,
  confidence,
  matched_by,
  data_quality_flags
FROM train_name_classification
WHERE classification_status IN ('UNKNOWN', 'INVALID_NAME', 'REVIEW')
   OR train_type IN ('UNKNOWN', 'INVALID')
ORDER BY
  CASE classification_status
    WHEN 'INVALID_NAME' THEN 0
    WHEN 'UNKNOWN' THEN 1
    WHEN 'REVIEW' THEN 2
    ELSE 3
  END,
  row_count DESC,
  train_name;
