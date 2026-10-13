-- =========================================================
-- CYROO TOURS & SAFARI - SUPABASE DATABASE SCHEMA (PostgreSQL)
-- =========================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ADMINS TABLE
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'Super Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. DESTINATIONS TABLE
CREATE TABLE IF NOT EXISTS public.destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    description TEXT,
    image_url TEXT,
    location VARCHAR(255) DEFAULT 'Kenya',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. SAFARI PACKAGES TABLE
CREATE TABLE IF NOT EXISTS public.safari_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Safari Parks',
    description TEXT NOT NULL,
    days INT NOT NULL DEFAULT 3,
    price INT NOT NULL DEFAULT 0, -- USD ($) per adult
    price_child INT DEFAULT 0, -- USD ($) per child
    image_url TEXT,
    accommodation_info TEXT,
    transport_info TEXT,
    meals_info TEXT,
    whats_included TEXT[],
    whats_excluded TEXT[],
    is_featured BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    package_id UUID REFERENCES public.safari_packages(id) ON DELETE SET NULL,
    destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    package_name VARCHAR(255),
    destination VARCHAR(255),
    travel_date DATE NOT NULL,
    return_date DATE NOT NULL,
    adults INT NOT NULL DEFAULT 1,
    children INT NOT NULL DEFAULT 0,
    accommodation VARCHAR(255) DEFAULT 'Standard Safari Lodge',
    transport VARCHAR(255) DEFAULT '4x4 Safari Landcruiser',
    airport_service VARCHAR(255) DEFAULT 'No Airport Transfer',
    special_requests TEXT,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'Unpaid', -- Unpaid, Partially Paid, Paid, Refunded
    booking_status VARCHAR(50) DEFAULT 'Pending', -- Pending, Confirmed, Completed, Cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. BOOKING ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.booking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    booking_reference VARCHAR(50),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    package_name VARCHAR(255),
    destination VARCHAR(255),
    travel_date DATE,
    return_date DATE,
    adults INT DEFAULT 1,
    children INT DEFAULT 0,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    amount_paid NUMERIC(12, 2) DEFAULT 0,
    balance_due NUMERIC(12, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Unpaid',
    pdf_url TEXT,
    invoice_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. INVOICE ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    item_description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    booking_reference VARCHAR(50),
    customer_name VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- M-Pesa, Bank Transfer, Cash, Card
    transaction_reference VARCHAR(100),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Completed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- WhatsApp, Email, System
    recipient VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================
-- AUTOMATIC BOOKING REFERENCE GENERATOR TRIGGER
-- =========================================================
CREATE SEQUENCE IF NOT EXISTS booking_ref_seq START 1000;

CREATE OR REPLACE FUNCTION generate_booking_ref()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_reference IS NULL OR NEW.booking_reference = '' THEN
        NEW.booking_reference := 'CYR-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('booking_ref_seq')::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_booking_ref ON public.bookings;
CREATE TRIGGER trigger_generate_booking_ref
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION generate_booking_ref();

-- =========================================================
-- UPDATED_AT TRIGGER FOR BOOKINGS
-- =========================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_booking_timestamp ON public.bookings;
CREATE TRIGGER trigger_update_booking_timestamp
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

-- Enable RLS on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safari_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting existing policies
DROP POLICY IF EXISTS "Allow all public access safari_packages" ON public.safari_packages;
DROP POLICY IF EXISTS "Allow all public access destinations" ON public.destinations;
DROP POLICY IF EXISTS "Allow all public access customers" ON public.customers;
DROP POLICY IF EXISTS "Allow all public access bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow all public access booking_items" ON public.booking_items;
DROP POLICY IF EXISTS "Allow all public access invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow all public access invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Allow all public access payments" ON public.payments;
DROP POLICY IF EXISTS "Allow all public access notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow all public access contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow all public access admins" ON public.admins;

-- Grant Full Permissive Policies for Web App Operations
CREATE POLICY "Allow all public access safari_packages" ON public.safari_packages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access destinations" ON public.destinations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access booking_items" ON public.booking_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access invoice_items" ON public.invoice_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access contact_messages" ON public.contact_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all public access admins" ON public.admins FOR ALL USING (true) WITH CHECK (true);

-- =========================================================
-- REALTIME PUBLICATION ENABLEMENT
-- =========================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.bookings, public.notifications, public.payments, public.contact_messages, public.destinations, public.safari_packages;
COMMIT;
