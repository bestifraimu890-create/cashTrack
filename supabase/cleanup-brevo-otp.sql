-- Cleanup: removes the old Brevo/pg_net OTP objects (no longer used)
-- Run this in the Supabase SQL Editor.
drop function if exists public.request_otp(text, text);
drop function if exists public.verify_otp(text, text, text, text, text, text, text);
drop table if exists public.otp_codes;
drop table if exists public.app_config;