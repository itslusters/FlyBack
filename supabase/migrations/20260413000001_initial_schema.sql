-- ClaimKit initial schema
-- Privacy model: recall_db and class_actions are public read.
--   users and claims are protected by RLS (users see only their own rows).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ─────────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id  TEXT UNIQUE,
  plan                TEXT NOT NULL DEFAULT 'free'
                        CHECK (plan IN ('free', 'pro')),
  plan_expires_at     TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CLAIMS (polymorphic) ──────────────────────────────────────────────────────
-- payload column holds EU261Payload | RecallPayload | ClassActionPayload
-- discriminated by the `type` column.

CREATE TABLE claims (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT        NOT NULL
                    CHECK (type IN ('EU261', 'RECALL', 'CLASS_ACTION')),
  status          TEXT        NOT NULL DEFAULT 'DISCOVERED'
                    CHECK (status IN (
                      'DISCOVERED', 'EMAIL_DRAFTED', 'SUBMITTED',
                      'PENDING', 'RESOLVED', 'REJECTED'
                    )),
  amount_est_usd  DECIMAL(10,2),
  payload         JSONB       NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claims_user_id ON claims(user_id);
CREATE INDEX idx_claims_type    ON claims(type);
CREATE INDEX idx_claims_status  ON claims(status);
-- GIN index for payload queries (e.g. filter by airline_iata inside EU261 payloads)
CREATE INDEX idx_claims_payload ON claims USING GIN(payload);

-- ─── RECALL DB ─────────────────────────────────────────────────────────────────
-- Synced daily from CPSC API via Vercel Cron job.
-- product_names + brands are arrays to accommodate multiple affected models.

CREATE TABLE recall_db (
  id                    UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  cpsc_recall_id        TEXT    UNIQUE NOT NULL,
  title                 TEXT    NOT NULL,
  product_names         TEXT[]  NOT NULL DEFAULT '{}',
  brands                TEXT[]  NOT NULL DEFAULT '{}',
  category              TEXT    NOT NULL,
  recall_date           DATE    NOT NULL,
  remedy_type           TEXT    NOT NULL
                          CHECK (remedy_type IN ('REFUND','REPLACEMENT','REPAIR','STOP_USE')),
  hazard_description    TEXT,
  claim_url             TEXT,
  estimated_refund_usd  DECIMAL(10,2),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full-text search on product_names and brands arrays
CREATE INDEX idx_recall_product_names  ON recall_db USING GIN(product_names);
CREATE INDEX idx_recall_brands         ON recall_db USING GIN(brands);
CREATE INDEX idx_recall_category       ON recall_db(category);
-- Active recalls sorted by recency (primary query pattern for cron upserts)
CREATE INDEX idx_recall_active_date    ON recall_db(is_active, recall_date DESC)
  WHERE is_active = TRUE;

-- ─── CLASS ACTIONS ─────────────────────────────────────────────────────────────
-- Scraped daily from ClassAction.org / TopClassActions.com.

CREATE TABLE class_actions (
  id                  UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id         TEXT    UNIQUE NOT NULL,
  case_name           TEXT    NOT NULL,
  description         TEXT    NOT NULL,
  affected_products   TEXT[]  NOT NULL DEFAULT '{}',
  affected_brands     TEXT[]  NOT NULL DEFAULT '{}',
  deadline            DATE,
  min_payout_usd      DECIMAL(10,2),
  max_payout_usd      DECIMAL(10,2),
  claim_url           TEXT    NOT NULL,
  -- Array of {type, value} objects, e.g. [{type:"PRODUCT_OWNED",value:"iPhone 12"}]
  eligibility_rules   JSONB   NOT NULL DEFAULT '[]',
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ca_brands    ON class_actions USING GIN(affected_brands);
CREATE INDEX idx_ca_products  ON class_actions USING GIN(affected_products);
-- Open cases with approaching deadlines
CREATE INDEX idx_ca_deadline  ON class_actions(deadline ASC)
  WHERE is_active = TRUE AND deadline IS NOT NULL;

-- ─── TRIGGERS ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────────────────────

ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims        ENABLE ROW LEVEL SECURITY;
ALTER TABLE recall_db     ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_actions ENABLE ROW LEVEL SECURITY;

-- Users: own row only
CREATE POLICY "users_self" ON users
  FOR ALL USING (auth.uid() = id);

-- Claims: own rows only
CREATE POLICY "claims_owner" ON claims
  FOR ALL USING (auth.uid() = user_id);

-- Reference tables: public read, no write from client
CREATE POLICY "recall_db_public_read" ON recall_db
  FOR SELECT USING (TRUE);

CREATE POLICY "class_actions_public_read" ON class_actions
  FOR SELECT USING (TRUE);
