-- OTP soft-verification tables for the Vercel backend.
-- Run this script in the Supabase SQL Editor.
-- Row Level Security (RLS) is enabled and locked down: only the
-- service_role (Vercel backend with SUPABASE_SERVICE_ROLE_KEY) can
-- read or write these tables. anon and authenticated roles are denied
-- every operation by explicit restrictive policies.

-- -----------------------------------------------------------------------------
-- 1. otp_codes: temporary 6-digit codes, expiration and brute-force counter
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.otp_codes (
  email         TEXT PRIMARY KEY,
  code          TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  attempts      INT NOT NULL DEFAULT 0,
  resend_count  INT NOT NULL DEFAULT 0,
  last_sent_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.otp_codes IS 'One-time password codes for soft email verification. Managed exclusively by the Vercel backend.';

-- -----------------------------------------------------------------------------
-- 2. verified_emails: durable record of a successfully verified address
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verified_emails (
  email        TEXT PRIMARY KEY,
  verified_at  TIMESTAMPTZ NOT NULL
);

COMMENT ON TABLE public.verified_emails IS 'Emails that have passed the custom OTP gate. Managed exclusively by the Vercel backend.';

-- -----------------------------------------------------------------------------
-- 3. Enable Row Level Security on both tables
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verified_emails ENABLE ROW LEVEL SECURITY;

-- Force RLS even for the table owner (postgres) when using the table directly.
-- This does not affect the service_role key used by the Vercel backend because
-- the service role bypasses RLS by default in Supabase.
ALTER TABLE IF EXISTS public.otp_codes FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verified_emails FORCE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 4. Explicitly DENY all access from anon and authenticated roles
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Deny all to anon and authenticated" ON public.otp_codes;
CREATE POLICY "Deny all to anon and authenticated"
  ON public.otp_codes
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Deny all to anon and authenticated" ON public.verified_emails;
CREATE POLICY "Deny all to anon and authenticated"
  ON public.verified_emails
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
