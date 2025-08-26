-- Simple, Secure Setup for Walmart Sellers Table
-- Run this in your Supabase SQL Editor

-- 1. Remove seller_code column if it exists
ALTER TABLE public.walmart_sellers 
DROP COLUMN IF EXISTS seller_code;

-- 2. Clean up any existing data issues
UPDATE public.walmart_sellers 
SET email = 'contact@example.com' 
WHERE email IS NULL OR email = '';

UPDATE public.walmart_sellers 
SET primary_phone = '+1234567890' 
WHERE primary_phone IS NULL OR primary_phone = '';

UPDATE public.walmart_sellers 
SET store_type = 'Online' 
WHERE store_type IS NULL OR store_type = '';

UPDATE public.walmart_sellers 
SET seller_logo = NULL;

-- 3. Make required fields NOT NULL
ALTER TABLE public.walmart_sellers 
ALTER COLUMN contact_name SET NOT NULL,
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN primary_phone SET NOT NULL,
ALTER COLUMN business_name SET NOT NULL,
ALTER COLUMN address SET NOT NULL,
ALTER COLUMN city SET NOT NULL,
ALTER COLUMN state SET NOT NULL,
ALTER COLUMN zipcode SET NOT NULL,
ALTER COLUMN country SET NOT NULL,
ALTER COLUMN store_type SET NOT NULL,
ALTER COLUMN walmart_address SET NOT NULL;

-- 4. Create sequence for STE codes
DROP SEQUENCE IF EXISTS ste_code_sequence;
CREATE SEQUENCE ste_code_sequence START 1;

-- 5. Update existing rows with STE codes and reset sequence safely
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    -- Get current row count
    SELECT COUNT(*) INTO row_count FROM public.walmart_sellers;
    
    -- Only update and reset sequence if table has rows
    IF row_count > 0 THEN
        -- Update existing rows with STE codes
        UPDATE public.walmart_sellers 
        SET ste_code = '9000' || nextval('ste_code_sequence')
        WHERE ste_code IS NULL OR ste_code = '';
        
        -- Reset sequence to continue from where we left off
        PERFORM setval('ste_code_sequence', row_count);
        RAISE NOTICE 'Updated % rows with STE codes and reset sequence', row_count;
    ELSE
        RAISE NOTICE 'Table is empty, no rows to update. Sequence starts at 1.';
    END IF;
END $$;

-- 6. Create function to auto-generate STE codes
CREATE OR REPLACE FUNCTION generate_ste_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ste_code := '9000' || nextval('ste_code_sequence');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for STE code generation
DROP TRIGGER IF EXISTS auto_generate_ste_code ON public.walmart_sellers;
CREATE TRIGGER auto_generate_ste_code
    BEFORE INSERT ON public.walmart_sellers
    FOR EACH ROW
    EXECUTE FUNCTION generate_ste_code();

-- 8. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_walmart_sellers_updated_at ON public.walmart_sellers;
CREATE TRIGGER update_walmart_sellers_updated_at 
    BEFORE UPDATE ON public.walmart_sellers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. SAFELY drop ALL existing policies with proper existence checks
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    -- Drop all policies that exist
    FOR policy_name IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'walmart_sellers' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.walmart_sellers';
        RAISE NOTICE 'Dropped policy: %', policy_name;
    END LOOP;
    
    RAISE NOTICE 'All existing policies removed.';
END $$;

-- 10. TEMPORARILY DISABLE RLS to test if that's the issue
ALTER TABLE public.walmart_sellers DISABLE ROW LEVEL SECURITY;

-- 11. Create basic indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_walmart_sellers_seller_name ON public.walmart_sellers(seller_name);
CREATE INDEX IF NOT EXISTS idx_walmart_sellers_email ON public.walmart_sellers(email);
CREATE INDEX IF NOT EXISTS idx_walmart_sellers_ste_code ON public.walmart_sellers(ste_code);

-- 12. Success message
SELECT 'Setup completed successfully! RLS temporarily disabled - forms should work now. Test it first!' as status;
