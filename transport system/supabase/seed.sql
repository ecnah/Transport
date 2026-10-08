-- =========================================================
-- CYROO TOURS & SAFARI - SEED DATA SCRIPT
-- =========================================================

-- Insert Destinations
INSERT INTO public.destinations (name, tagline, description, image_url, location) VALUES
('Maasai Mara National Reserve', 'Home of the Great Wildebeest Migration', 'Experience world-renowned game viewing, vast rolling savannahs, lions, leopards, and rich Maasai cultural heritage.', 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80', 'Narok County, Kenya'),
('Amboseli National Park', 'Land of Giants beneath Mount Kilimanjaro', 'Famous for immense herds of free-ranging elephants against the breathtaking backdrop of Africa''s highest peak.', 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80', 'Kajiado County, Kenya'),
('Tsavo National Parks (East & West)', 'The Wild Frontier of Red Elephants', 'Kenya''s largest wilderness area featuring dramatic lava flows, red soil dust elephants, and Mzima Springs.', 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80', 'Taita-Taveta County, Kenya'),
('Lake Nakuru National Park', 'Flamingo Haven & Rhino Sanctuary', 'A spectacular rift valley lake famous for millions of pink flamingos, white rhinos, and endangered Rothschild giraffes.', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80', 'Nakuru County, Kenya'),
('Mount Kenya National Park', 'Africa''s Second Highest Peak & Alpine Wonders', 'UNESCO World Heritage Site offering magnificent mountain vistas, unique alpine flora, trekking, and pristine wilderness.', 'https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&w=800&q=80', 'Central Kenya'),
('Nairobi National Park', 'The World''s Only Wildlife Capital', 'A unique wildlife sanctuary right on the doorstep of Kenya''s bustling capital city with lions, rhinos, and giraffes.', 'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?auto=format&fit=crop&w=800&q=80', 'Nairobi, Kenya'),
('JKIA & Wilson Airports', 'Nairobi International & Domestic Airport Hubs', 'Seamless VIP airport pickups, flight tracking, and bush flight transfers.', 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80', 'Nairobi Terminals');

-- Insert Safari Packages
INSERT INTO public.safari_packages (
  name, destination, category, description, days, price, price_child, image_url,
  accommodation_info, transport_info, meals_info, whats_included, whats_excluded, is_featured
) VALUES
(
  'Maasai Mara Magic Safari',
  'Maasai Mara National Reserve',
  'Safari Parks',
  'Immerse yourself in the world-famous Maasai Mara. Witness the Big Five, vast endless plains, and experience breathtaking game drives guided by expert professional local safari guides.',
  3,
  45000,
  22500,
  'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
  'Luxury Tented Camp / Safari Lodge with private veranda',
  'Customized 4x4 Landcruiser with pop-up roof for optimal game viewing & photo shoots',
  'Full Board (Breakfast, Lunch & Gourmet Dinner with local Kenyan specialties)',
  ARRAY['Park entrance fees', 'All game drives in 4x4 Landcruiser', 'Professional English-speaking guide', 'Full board accommodation', 'Mineral water on game drives', 'Airport / Hotel transfers'],
  ARRAY['International flight tickets', 'Visas', 'Maasai Village entrance fee ($30)', 'Tips & gratuities', 'Personal expenses & souvenirs'],
  true
),
(
  'Amboseli Kilimanjaro Grand Safari',
  'Amboseli National Park',
  'Safari Parks',
  'Capture iconic photo opportunities of colossal elephant herds wandering beneath Mount Kilimanjaro''s snow-capped summit. Includes guided game drives and observation hill visits.',
  3,
  38000,
  19000,
  'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80',
  'Premium Amboseli Safari Lodge overlooking waterholes',
  '4x4 Landcruiser or Safari Tour Van with pop-up roof',
  'Full Board (Breakfast, Picnic Lunches, Dinner)',
  ARRAY['Amboseli Park fees', 'Unlimited game drives', 'Guide fees', 'Lodge accommodation', 'Bottled drinking water'],
  ARRAY['Alcoholic beverages', 'Laundry services', 'Tips', 'Cultural Maasai visit'],
  true
),
(
  'Tsavo Wilderness & Springs Expedition',
  'Tsavo East & West National Parks',
  'Safari Parks',
  'Explore Kenya''s largest eco-system! Discover red elephants in Tsavo East and underwater hippo viewing at Mzima Springs in Tsavo West.',
  4,
  52000,
  26000,
  'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80',
  'Wilderness Lodge & Tented Camps',
  '4x4 Landcruiser with UHF radio communication',
  'Full Board Meals included',
  ARRAY['Park entry permits for East & West', 'Mzima Springs guided walk', 'Full board accommodation', 'All transfers'],
  ARRAY['Personal insurance', 'Tips', 'Items of personal nature'],
  true
),
(
  'Lake Nakuru Pink Flamingo & Rhino Sanctuary',
  'Lake Nakuru National Park',
  'Safari Parks',
  'A stunning rift valley excursion ideal for birdwatchers and rhino lovers. Witness white and black rhinos, endangered Rothschild giraffes, and flamingo flocks.',
  2,
  28000,
  14000,
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
  'Lake Nakuru Eco-Lodge',
  'Safari Tour Van / 4x4 Landcruiser',
  'Breakfast, Lunch & Dinner',
  ARRAY['Park fees', 'Game drives around the lake', 'Guide service', 'Full board meals'],
  ARRAY['Beverages', 'Tips', 'Laundry'],
  false
),
(
  'Mount Kenya Alpine Adventure',
  'Mount Kenya National Park',
  'Mount Kenya',
  'Experience lush mountain rainforests, rare wildlife like bongo antelopes, mountain climbing trails, and serene alpine climate.',
  4,
  60000,
  30000,
  'https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&w=800&q=80',
  'Mountain Lodge & Chalets',
  '4x4 Landcruiser SUV transport',
  'Full Board Mountain Meals',
  ARRAY['National Park entrance', 'Trekking guides & porters', 'Chalet accommodation', 'All meals'],
  ARRAY['Climbing gear rental', 'Tips', 'Personal travel insurance'],
  false
),
(
  'Nairobi Half-Day & Full-Day City Safari',
  'Nairobi National Park',
  'Day Excursions',
  'Perfect for travelers with short stopovers! Experience lions, rhinos, and giraffes against the urban skyline, plus Sheldrick Wildlife Trust & Giraffe Centre.',
  1,
  12000,
  6000,
  'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?auto=format&fit=crop&w=800&q=80',
  'Day Tour (No overnight lodging required)',
  'Comfortable customized safari vehicle',
  'Gourmet lunch at Carnivore Restaurant included',
  ARRAY['Park entry ticket', 'Vehicle entrance', 'Professional guide', 'Carnivore Restaurant lunch'],
  ARRAY['Giraffe Centre entry ($15)', 'Tips'],
  true
),
(
  'JKIA Airport VIP Transfer & Hotel Pickup',
  'Nairobi JKIA Airport / Nairobi Hotels',
  'Airport Services',
  'Stress-free, comfortable private transfer between Jomo Kenyatta International Airport (JKIA) and Nairobi hotels or safari departure points. Includes meet & greet service.',
  1,
  3500,
  1750,
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
  'N/A - Private Executive Vehicle Transfer',
  'Air-conditioned Executive SUV / Minivan with professional chauffeur',
  'Complimentary bottled water & WiFi onboard',
  ARRAY['Meet & greet at arrival hall', 'Flight tracking for delay adjustments', 'Luggage handling', 'Tolls & parking fees', 'Bottled drinking water'],
  ARRAY['Gratuities for driver', 'Hotel room bookings'],
  true
);

-- Insert Sample Customer
INSERT INTO public.customers (full_name, email, phone) VALUES
('John Kiprop', 'john.kiprop@example.com', '0712345678');

-- Insert Sample Booking
INSERT INTO public.bookings (
  booking_reference, customer_id, package_id, travel_date, return_date,
  adults, children, accommodation, transport, airport_service, special_requests,
  subtotal, discount, total_amount, amount_paid, balance, payment_status, booking_status
) VALUES
(
  'CYR-2026-0001',
  (SELECT id FROM public.customers WHERE email = 'john.kiprop@example.com' LIMIT 1),
  (SELECT id FROM public.safari_packages WHERE name = 'Maasai Mara Magic Safari' LIMIT 1),
  '2026-10-20',
  '2026-10-23',
  2,
  0,
  'Luxury Tented Camp',
  '4x4 Safari Landcruiser',
  'JKIA Arrival Pickup',
  'Honeymoon setup with vegetarian dinner option',
  93000.00,
  0.00,
  93000.00,
  30000.00,
  63000.00,
  'Partially Paid',
  'Confirmed'
);
