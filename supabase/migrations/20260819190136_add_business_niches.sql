-- Adds 3 new niches to the profile_niche enum: personal brands of business
-- owners/founders, corporate/company accounts, and influencers/creators.
-- These weren't covered distinctly by the existing 20 values.
ALTER TYPE public.profile_niche ADD VALUE IF NOT EXISTS 'Empresarios';
ALTER TYPE public.profile_niche ADD VALUE IF NOT EXISTS 'Empresas';
ALTER TYPE public.profile_niche ADD VALUE IF NOT EXISTS 'Influenciadores';
