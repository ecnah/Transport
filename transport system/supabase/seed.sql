-- =========================================================
-- CYROO TOURS & SAFARI - SEED DATA SCRIPT
-- =========================================================

-- 1. Insert Destinations with fixed UUIDs
INSERT INTO public.destinations (id, name, tagline, description, image_url, location) VALUES
('d1111111-1111-1111-1111-111111111111', 'Maasai Mara National Reserve', 'Home of the Great Wildebeest Migration', 'Experience world-renowned game viewing, vast rolling savannahs, lions, leopards, and rich Maasai cultural heritage.', 'assets/Amboseli National  (1).png', 'Narok County, Kenya'),
('d2222222-2222-2222-2222-222222222222', 'Amboseli National Park', 'Land of Giants beneath Mount Kilimanjaro', 'Famous for immense herds of free-ranging elephants against the breathtaking backdrop of Africa''s highest peak.', 'assets/Amboseli National  (2).png', 'Kajiado County, Kenya'),
('d3333333-3333-3333-3333-333333333333', 'Tsavo National Parks (East & West)', 'The Wild Frontier of Red Elephants', 'Kenya''s largest wilderness area featuring dramatic lava flows, red soil dust elephants, and Mzima Springs.', 'assets/Amboseli National  (3).png', 'Taita-Taveta County, Kenya'),
('d4444444-4444-4444-4444-444444444444', 'Lake Nakuru National Park', 'Flamingo Haven & Rhino Sanctuary', 'A spectacular rift valley lake famous for millions of pink flamingos, white rhinos, and endangered Rothschild giraffes.', 'assets/wallpaper , HD wallpaper , 4k wallpaper.jfif', 'Nakuru County, Kenya'),
('d5555555-5555-5555-5555-555555555555', 'Mount Kenya National Park', 'Africa''s Second Highest Peak & Alpine Wonders', 'UNESCO World Heritage Site offering magnificent mountain vistas, unique alpine flora, trekking, and pristine wilderness.', 'assets/Amboseli National  (4).png', 'Central Kenya'),
('d6666666-6666-6666-6666-666666666666', 'Nairobi National Park', 'The World''s Only Wildlife Capital', 'A unique wildlife sanctuary right on the doorstep of Kenya''s bustling capital city with lions, rhinos, and giraffes.', 'assets/Amboseli National  (5).png', 'Nairobi, Kenya'),
('d7777777-7777-7777-7777-777777777777', 'JKIA & Wilson Airports', 'Nairobi International & Domestic Airport Hubs', 'Seamless VIP airport pickups, flight tracking, and bush flight transfers.', 'assets/download (2).jfif', 'Nairobi Terminals')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  location = EXCLUDED.location;

-- 2. Insert Safari Packages with fixed UUIDs
INSERT INTO public.safari_packages (
  id, name, destination, category, description, days, price, price_child, image_url,
  accommodation_info, transport_info, meals_info, whats_included, whats_excluded, is_featured
) VALUES
(
  'p1111111-1111-1111-1111-111111111111',
  'Maasai Mara Magic Safari',
  'Maasai Mara National Reserve',
  'Safari Parks',
  'Immerse yourself in the world-famous Maasai Mara. Witness the Big Five, vast endless plains, and experience breathtaking game drives guided by expert professional local safari guides.',
  3,
  450,
  225,
  'assets/Amboseli National  (1).png',
  'Luxury Tented Camp / Safari Lodge with private veranda',
  'Customized 4x4 Landcruiser with pop-up roof for optimal game viewing & photo shoots',
  'Full Board (Breakfast, Lunch & Gourmet Dinner with local Kenyan specialties)',
  ARRAY['Park entrance fees', 'All game drives in 4x4 Landcruiser', 'Professional English-speaking guide', 'Full board accommodation', 'Mineral water on game drives', 'Airport / Hotel transfers'],
  ARRAY['International flight tickets', 'Visas', 'Maasai Village entrance fee ($30)', 'Tips & gratuities', 'Personal expenses & souvenirs'],
  true
),
(
  'p2222222-2222-2222-2222-222222222222',
  'Amboseli Kilimanjaro Grand Safari',
  'Amboseli National Park',
  'Safari Parks',
  'Capture iconic photo opportunities of colossal elephant herds wandering beneath Mount Kilimanjaro''s snow-capped summit. Includes guided game drives and observation hill visits.',
  3,
  380,
  190,
  'assets/Amboseli National  (2).png',
  'Premium Amboseli Safari Lodge overlooking waterholes',
  '4x4 Landcruiser or Safari Tour Van with pop-up roof',
  'Full Board (Breakfast, Picnic Lunches, Dinner)',
  ARRAY['Amboseli Park fees', 'Unlimited game drives', 'Guide fees', 'Lodge accommodation', 'Bottled drinking water'],
  ARRAY['Alcoholic beverages', 'Laundry services', 'Tips', 'Cultural Maasai visit'],
  true
),
(
  'p3333333-3333-3333-3333-333333333333',
  'Tsavo Wilderness & Springs Expedition',
  'Tsavo East & West National Parks',
  'Safari Parks',
  'Explore Kenya''s largest eco-system! Discover red elephants in Tsavo East and underwater hippo viewing at Mzima Springs in Tsavo West.',
  4,
  520,
  260,
  'assets/Amboseli National  (3).png',
  'Wilderness Lodge & Tented Camps',
  '4x4 Landcruiser with UHF radio communication',
  'Full Board Meals included',
  ARRAY['Park entry permits for East & West', 'Mzima Springs guided walk', 'Full board accommodation', 'All transfers'],
  ARRAY['Personal insurance', 'Tips', 'Items of personal nature'],
  true
),
(
  'p4444444-4444-4444-4444-444444444444',
  'Lake Nakuru Pink Flamingo & Rhino Sanctuary',
  'Lake Nakuru National Park',
  'Safari Parks',
  'A stunning rift valley excursion ideal for birdwatchers and rhino lovers. Witness white and black rhinos, endangered Rothschild giraffes, and flamingo flocks.',
  2,
  280,
  140,
  'assets/wallpaper , HD wallpaper , 4k wallpaper.jfif',
  'Lake Nakuru Eco-Lodge',
  'Safari Tour Van / 4x4 Landcruiser',
  'Breakfast, Lunch & Dinner',
  ARRAY['Park fees', 'Game drives around the lake', 'Guide service', 'Full board meals'],
  ARRAY['Beverages', 'Tips', 'Laundry'],
  false
),
(
  'p5555555-5555-5555-5555-555555555555',
  'Mount Kenya Alpine Adventure',
  'Mount Kenya National Park',
  'Mount Kenya',
  'Experience lush mountain rainforests, rare wildlife like bongo antelopes, mountain climbing trails, and serene alpine climate.',
  4,
  600,
  300,
  'assets/Amboseli National  (4).png',
  'Mountain Lodge & Chalets',
  '4x4 Landcruiser SUV transport',
  'Full Board Mountain Meals',
  ARRAY['National Park entrance', 'Trekking guides & porters', 'Chalet accommodation', 'All meals'],
  ARRAY['Climbing gear rental', 'Tips', 'Personal travel insurance'],
  false
),
(
  'p6666666-6666-6666-6666-666666666666',
  'Nairobi Half-Day & Full-Day City Safari',
  'Nairobi National Park',
  'Day Excursions',
  'Perfect for travelers with short stopovers! Experience lions, rhinos, and giraffes against the urban skyline, plus Sheldrick Wildlife Trust & Giraffe Centre.',
  1,
  120,
  60,
  'assets/Amboseli National  (5).png',
  'Day Tour (No overnight lodging required)',
  'Comfortable customized safari vehicle',
  'Gourmet lunch at Carnivore Restaurant included',
  ARRAY['Park entry ticket', 'Vehicle entrance', 'Professional guide', 'Carnivore Restaurant lunch'],
  ARRAY['Giraffe Centre entry ($15)', 'Tips'],
  true
),
(
  'p7777777-7777-7777-7777-777777777777',
  'JKIA Airport VIP Transfer & Hotel Pickup',
  'Nairobi JKIA Airport / Nairobi Hotels',
  'Airport Services',
  'Stress-free, comfortable private transfer between Jomo Kenyatta International Airport (JKIA) and Nairobi hotels or safari departure points. Includes meet & greet service.',
  1,
  35,
  18,
  'assets/download (2).jfif',
  'N/A - Private Executive Vehicle Transfer',
  'Air-conditioned Executive SUV / Minivan with professional chauffeur',
  'Complimentary bottled water & WiFi onboard',
  ARRAY['Meet & greet at arrival hall', 'Flight tracking for delay adjustments', 'Luggage handling', 'Tolls & parking fees', 'Bottled drinking water'],
  ARRAY['Gratuities for driver', 'Hotel room bookings'],
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  destination = EXCLUDED.destination,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  days = EXCLUDED.days,
  price = EXCLUDED.price,
  price_child = EXCLUDED.price_child,
  image_url = EXCLUDED.image_url;

-- 3. Insert Admin User
INSERT INTO public.admins (id, full_name, email, phone, role) VALUES
('a1111111-1111-1111-1111-111111111111', 'Cyroo Super Admin', 'cyrootourssafari@gmail.com', '0726072607', 'Super Admin')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Sample Customers
INSERT INTO public.customers (id, full_name, email, phone) VALUES
('c1111111-1111-1111-1111-111111111111', 'John Kiprop', 'john.kiprop@example.com', '0712345678'),
('c2222222-2222-2222-2222-222222222222', 'Sarah Jenkins', 'sarah.j@example.org', '0722998877')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Sample Bookings
INSERT INTO public.bookings (
  id, booking_reference, customer_id, package_id, destination_id,
  customer_name, customer_phone, customer_email, package_name, destination,
  travel_date, return_date, adults, children, accommodation, transport, airport_service, special_requests,
  subtotal, discount, total_amount, amount_paid, balance, payment_status, booking_status
) VALUES
(
  'b1111111-1111-1111-1111-111111111111',
  'CYR-2026-0001',
  'c1111111-1111-1111-1111-111111111111',
  'p1111111-1111-1111-1111-111111111111',
  'd1111111-1111-1111-1111-111111111111',
  'John Kiprop',
  '0712345678',
  'john.kiprop@example.com',
  'Maasai Mara Magic Safari',
  'Maasai Mara National Reserve',
  '2026-10-20',
  '2026-10-23',
  2,
  0,
  'Luxury Tented Camp',
  '4x4 Safari Landcruiser',
  'JKIA Airport Arrival Pickup & Hotel Transfer',
  'Honeymoon setup with vegetarian dinner option',
  930.00,
  0.00,
  930.00,
  300.00,
  630.00,
  'Partially Paid',
  'Confirmed'
),
(
  'b2222222-2222-2222-2222-222222222222',
  'CYR-2026-0002',
  'c2222222-2222-2222-2222-222222222222',
  'p7777777-7777-7777-7777-777777777777',
  'd7777777-7777-7777-7777-777777777777',
  'Sarah Jenkins',
  '0722998877',
  'sarah.j@example.org',
  'JKIA Airport VIP Transfer & Hotel Pickup',
  'JKIA & Wilson Airports',
  '2026-10-25',
  '2026-10-25',
  2,
  0,
  'N/A - Direct Transfer',
  'Executive Airport Sedan / SUV',
  'JKIA Airport Arrival Pickup & Hotel Transfer',
  'Flight arrival KQ 101 at 06:00 AM',
  35.00,
  0.00,
  35.00,
  35.00,
  0.00,
  'Paid',
  'Confirmed'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Sample Invoices
INSERT INTO public.invoices (
  id, invoice_number, booking_id, booking_reference,
  customer_name, customer_phone, customer_email, package_name, destination,
  travel_date, return_date, adults, children,
  subtotal, discount, total_amount, amount_paid, balance_due, payment_status
) VALUES
(
  'i1111111-1111-1111-1111-111111111111',
  'INV-2026-0001',
  'b1111111-1111-1111-1111-111111111111',
  'CYR-2026-0001',
  'John Kiprop',
  '0712345678',
  'john.kiprop@example.com',
  'Maasai Mara Magic Safari',
  'Maasai Mara National Reserve',
  '2026-10-20',
  '2026-10-23',
  2,
  0,
  930.00,
  0.00,
  930.00,
  300.00,
  630.00,
  'Partially Paid'
),
(
  'i2222222-2222-2222-2222-222222222222',
  'INV-2026-0002',
  'b2222222-2222-2222-2222-222222222222',
  'CYR-2026-0002',
  'Sarah Jenkins',
  '0722998877',
  'sarah.j@example.org',
  'JKIA Airport VIP Transfer & Hotel Pickup',
  'JKIA & Wilson Airports',
  '2026-10-25',
  '2026-10-25',
  2,
  0,
  35.00,
  0.00,
  35.00,
  35.00,
  0.00,
  'Paid'
)
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Sample Payment
INSERT INTO public.payments (
  id, booking_id, booking_reference, customer_name, amount, payment_method, transaction_reference, payment_status, notes
) VALUES
(
  'pay11111-1111-1111-1111-111111111111',
  'b1111111-1111-1111-1111-111111111111',
  'CYR-2026-0001',
  'John Kiprop',
  300.00,
  'Credit Card / USD Transfer',
  'TXN-USD-889911',
  'Completed',
  'Online deposit payment via Credit Card'
)
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Sample Contact Message
INSERT INTO public.contact_messages (
  id, full_name, email, phone, message, status
) VALUES
(
  'm1111111-1111-1111-1111-111111111111',
  'David Miller',
  'david.m@example.org',
  '0733887766',
  'Hi Cyroo Tours, we are a group of 6 planning a 5-day safari to Mara and Nakuru in November. Please send us your group package quote.',
  'Unread'
)
ON CONFLICT (id) DO NOTHING;
