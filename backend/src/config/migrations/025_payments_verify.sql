-- Provider transaction id for verified payments

BEGIN;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS provider_txn_id VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_txn_id
  ON payments (provider_txn_id)
  WHERE provider_txn_id IS NOT NULL;

COMMIT;
