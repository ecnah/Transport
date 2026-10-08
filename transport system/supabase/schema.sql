-- =========================================================
-- CYROO TOURS & SAFARI - SUPABASE DATABASE SCHEMA (PostgreSQL)
-- =========================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ADMINS TABLE
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. DESTINATIONS TABLE
CREATE TABLE IF NOT EXISTS public.destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    description TEXT,
    image_url TEXT,
    location VARCHAR(255) DEFAULT 'Kenya',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. SAFARI PACKAGES TABLE
CREATE TABLE IF NOT EXISTS public.safari_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Safari Parks',
    description TEXT NOT NULL,
    days INT NOT NULL DEFAULT 3,
    price INT NOT NULL DEFAULT 0, -- KES per adult
    price_child INT DEFAULT 0, -- KES per child
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.safari_packages(id) ON DELETE SET NULL,
    destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    item_description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE SEQUENCE IF NOT EXISTS booking_ref_seq START 1;

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

-- 1. Safari Packages & Destinations (Public Read, Admin Write)
CREATE POLICY "Public Read Packages" ON public.safari_packages FOR SELECT USING (true);
CREATE POLICY "Admin All Packages" ON public.safari_packages FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Destinations" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Admin All Destinations" ON public.destinations FOR ALL USING (auth.role() = 'authenticated');

-- 2. Customers Policy (Public Insert, Authenticated/Admin Read-Write)
CREATE POLICY "Public Insert Customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Select Customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Admin All Customers" ON public.customers FOR ALL USING (auth.role() = 'authenticated');

-- 3. Bookings Policy (Public Insert & Lookup by Reference/Phone, Admin Full Access)
CREATE POLICY "Public Insert Bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Select Bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Admin All Bookings" ON public.bookings FOR ALL USING (auth.role() = 'authenticated');

-- 4. Booking Items & Invoices (Public Select & Insert for their booking, Admin Full Access)
CREATE POLICY "Public Insert Booking Items" ON public.booking_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Select Booking Items" ON public.booking_items FOR SELECT USING (true);
CREATE POLICY "Admin All Booking Items" ON public.booking_items FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Insert Invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Select Invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Admin All Invoices" ON public.invoices FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Insert Invoice Items" ON public.invoice_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Select Invoice Items" ON public.invoice_items FOR SELECT USING (true);
CREATE POLICY "Admin All Invoice Items" ON public.invoice_items FOR ALL USING (auth.role() = 'authenticated');

-- 5. Payments, Notifications & Messages
CREATE POLICY "Public Insert Payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Select Payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Admin All Payments" ON public.payments FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Insert Contact Messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin All Contact Messages" ON public.contact_messages FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin All Notifications" ON public.notifications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Admins" ON public.admins FOR ALL USING (auth.role() = 'authenticated');

-- =========================================================
-- REALTIME PUBLICATION ENABLEMENT
-- =========================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.bookings, public.notifications, public.payments, public.contact_messages;
COMMIT;
