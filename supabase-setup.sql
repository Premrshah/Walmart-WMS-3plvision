-- Create the walmart_sellers table
CREATE TABLE walmart_sellers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_name VARCHAR(255) NOT NULL,
    ste_code VARCHAR(50) GENERATED ALWAYS AS ('9000' || (ROW_NUMBER() OVER (ORDER BY created_at))::TEXT) STORED,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    primary_phone VARCHAR(20) NOT NULL,
    seller_logo TEXT, -- URL or base64 string (optional)
    business_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zipcode VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    store_type VARCHAR(100) NOT NULL,
    comments TEXT, -- Optional
    walmart_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on seller_name for faster lookups
CREATE INDEX idx_walmart_sellers_seller_name ON walmart_sellers(seller_name);

-- Create an index on email for faster lookups
CREATE INDEX idx_walmart_sellers_email ON walmart_sellers(email);

-- Create an index on ste_code for faster lookups
CREATE INDEX idx_walmart_sellers_ste_code ON walmart_sellers(ste_code);

-- Enable Row Level Security (RLS)
ALTER TABLE walmart_sellers ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (you can modify this based on your needs)
CREATE POLICY "Allow all operations for authenticated users" ON walmart_sellers
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_walmart_sellers_updated_at 
    BEFORE UPDATE ON walmart_sellers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO walmart_sellers (
    seller_name, 
    contact_name, 
    email, 
    primary_phone, 
    business_name, 
    address, 
    city, 
    state, 
    zipcode, 
    country, 
    store_type, 
    comments, 
    walmart_address
) VALUES (
    'Vikas Online',
    'Vikas',
    'vikas@example.com',
    '+918198962026',
    'Vikas Online Store',
    '123 Business Street',
    'Mumbai',
    'Maharashtra',
    '400001',
    'India',
    'Online',
    'Sample seller for testing',
    'Seller Name - WMT Returns - STE-99999\n295 Whitehead Road\nHamilton NJ 08619'
);
