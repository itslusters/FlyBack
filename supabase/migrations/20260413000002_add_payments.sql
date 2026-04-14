-- Payment records (Portone / 포트원 결제 내역)
-- imp_uid UNIQUE prevents replay attacks at the DB layer.

CREATE TABLE payments (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  imp_uid      TEXT        UNIQUE NOT NULL,   -- 포트원 거래 고유번호
  merchant_uid TEXT        NOT NULL,          -- 우리 서버 발급 주문번호
  amount       INTEGER     NOT NULL,          -- 실 결제금액 (원 단위)
  currency     TEXT        NOT NULL DEFAULT 'KRW',
  pay_method   TEXT,                          -- 'card' | 'kakaopay' | 'tosspay'
  status       TEXT        NOT NULL,          -- 'paid' | 'cancelled' | 'failed'
  receipt_url  TEXT,
  paid_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own payment records
CREATE POLICY "payments_owner_read" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Only server (service role) may insert/update
-- No client-facing INSERT policy — writes go through verify route only
