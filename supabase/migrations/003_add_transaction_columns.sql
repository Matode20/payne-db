-- Migration 003: Add double-entry bookkeeping columns to transactions table
-- Run this in Supabase SQL editor

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS reference_number  TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS transaction_type  TEXT          DEFAULT 'credit',
  ADD COLUMN IF NOT EXISTS category          TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS amount            NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transaction_date  DATE          DEFAULT CURRENT_DATE;

-- Back-fill existing rows from old schema
UPDATE public.transactions
SET
  category         = field,
  transaction_date = created_at::date,
  amount           = ABS(balance_after - balance_before),
  transaction_type = CASE
    WHEN balance_after >= balance_before THEN 'credit'
    ELSE 'debit'
  END
WHERE amount = 0 OR amount IS NULL;

-- Helper function: balance for a member/category from transactions
CREATE OR REPLACE FUNCTION get_member_balance(p_member_id UUID, p_category TEXT)
RETURNS NUMERIC AS $$
  SELECT COALESCE(
    SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE -amount END),
    0
  )
  FROM public.transactions
  WHERE member_id = p_member_id
    AND (category = p_category OR field = p_category)
    AND amount > 0;
$$ LANGUAGE sql STABLE;

-- RLS policy: admin can insert transactions for any member
CREATE POLICY IF NOT EXISTS "admin_insert_transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
