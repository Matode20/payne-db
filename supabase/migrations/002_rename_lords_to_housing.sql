-- Migration 002: Rename lords_investment column to housing_investment
-- Run this once in your Supabase SQL editor

ALTER TABLE public.balances
  RENAME COLUMN lords_investment TO housing_investment;
