-- =====================================================
-- PayneDB – Seeds Cooperative Multipurpose Society Ltd
-- Schema migration 001
-- Run this once in your Supabase SQL editor
-- =====================================================

-- Profiles table (one row per auth user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_number TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  address       TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'member',
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Balances table (one row per member)
CREATE TABLE IF NOT EXISTS public.balances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id         UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  savings           NUMERIC(15,2) NOT NULL DEFAULT 0,
  share_capital     NUMERIC(15,2) NOT NULL DEFAULT 0,
  special_savings   NUMERIC(15,2) NOT NULL DEFAULT 0,
  spf_investment    NUMERIC(15,2) NOT NULL DEFAULT 0,
  mutual_investment NUMERIC(15,2) NOT NULL DEFAULT 0,
  club50_investment NUMERIC(15,2) NOT NULL DEFAULT 0,
  shirmawa          NUMERIC(15,2) NOT NULL DEFAULT 0,
  members_loan      NUMERIC(15,2) NOT NULL DEFAULT 0,
  spf_loan          NUMERIC(15,2) NOT NULL DEFAULT 0,
  product_loan      NUMERIC(15,2) NOT NULL DEFAULT 0,
  lords_investment  NUMERIC(15,2) NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions audit log
CREATE TABLE IF NOT EXISTS public.transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  field            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  balance_before   NUMERIC(15,2) NOT NULL DEFAULT 0,
  balance_after    NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_by_admin UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Row-Level Security ──────────────────────────────

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Members can only read their own rows; service-role bypasses all RLS
CREATE POLICY "profiles_self_read"     ON public.profiles     FOR SELECT USING (auth.uid() = id);
CREATE POLICY "balances_self_read"     ON public.balances     FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "transactions_self_read" ON public.transactions FOR SELECT USING (member_id = auth.uid());

-- ── Auto-create profile + balances on new user ───────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  acct TEXT;
BEGIN
  acct := COALESCE(
    NEW.raw_user_meta_data->>'account_number',
    'SCM' || UPPER(LEFT(REPLACE(NEW.id::TEXT, '-', ''), 8))
  );

  INSERT INTO public.profiles (id, account_number, full_name, email, phone, address, role, status)
  VALUES (
    NEW.id,
    acct,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.balances (member_id)
  VALUES (NEW.id)
  ON CONFLICT (member_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
