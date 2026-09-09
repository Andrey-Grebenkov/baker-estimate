-- Migration: add resend rate-limiting columns to the existing otp_codes table.
-- Run this in the Supabase SQL Editor if you already created otp_codes
-- before the resend-cooldown feature.

ALTER TABLE public.otp_codes
  ADD COLUMN IF NOT EXISTS resend_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now();
