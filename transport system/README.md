# CYROO TOURS & SAFARI - Safari Booking & Management System

A complete, modern, responsive safari booking website and booking management system built for **CYROO TOURS & SAFARI**.

- **Phone**: `0726072607` / `0733185018`
- **Email**: `cyrootourssafari@gmail.com`
- **Design Palette**: Dark Green (`#1b4332`), Safari Brown (`#7f5539`), Gold Accent (`#d4af37`), Warm Beige (`#f7f4ef`), Charcoal (`#121413`) & White.

---

## 🌟 Key Features

### 1. Customer Website (`index.html`)
- **Hero Section**: Lion brand identity, catchphrase *"Explore Kenya. Experience the Wild."*, instant call-to-actions, and live counter statistics.
- **Safari Packages**: Dynamic catalog of packages (Maasai Mara, Amboseli, Tsavo, Lake Nakuru, Mount Kenya, Nairobi National Park, Custom Bespoke Safaris).
- **Interactive Package Details**: Deep-dive popup modals showing detailed itinerary, lodging standards, transport vehicle specs, included & excluded items.
- **Dynamic Price Calculator Booking Form**:
  - Live calculations for adults and children (50% child rate).
  - Vehicle upgrades (Custom 4x4 Landcruisers with pop-up roof vs VIP Landcruiser).
  - Lodging selections.
  - Automatic return date computation based on safari package duration.
  - Validates guest details and generates a unique Booking Reference (`CYR-2026-XXXX`).
- **Automatic PDF Invoice Generation**:
  - Instantly generates professional branded PDF invoice upon booking submission.
  - Options to **View**, **Print**, or **Download PDF** using `html2pdf.js`.
- **"My Booking" Tracking Portal**:
  - Customers can track their booking status and payment balance using their **Booking Reference** and **Phone Number**.
- **WhatsApp Integration**:
  - Floating and direct *"Book via WhatsApp"* buttons pre-filled with formatted safari reservation messages.
  - Official WhatsApp Cloud API integration payload formatted for admin notifications.
- **Contact Us**: Interactive contact form saving messages directly into database.

### 2. Admin Management Dashboard (`admin.html`)
- **Secure Supabase Authentication Login**: Protected access for Cyroo Tours staff.
- **Realtime Booking Updates**: Supabase Realtime subscription listens for new guest bookings and pops up an instant notification toast alert without requiring page refresh.
- **Dashboard Statistics Cards**:
  - Total Bookings
  - Pending Bookings
  - Confirmed Trips
  - Cancelled Trips
  - Total Revenue Collected
  - Outstanding Balance
- **Visual Chart analytics**: Chart.js rendering for booking breakdown and status distribution.
- **Comprehensive Bookings Table**:
  - Advanced multi-filter search (by reference, guest name, phone, booking status, payment status).
  - Action buttons per booking: Confirm, Cancel, Record Payment, View/Download PDF Invoice, WhatsApp Guest directly.
- **Package Management (CRUD)**:
  - Add new safari packages, edit existing details, change prices, days, descriptions, and feature image URLs.
- **Payments Management**: Record M-Pesa, Bank Transfer, or Cash payments, auto-calculating guest balance and updating payment status (*Unpaid*, *Partially Paid*, *Paid*).

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Modern JavaScript (ES6+), FontAwesome Icons, Google Fonts (*Playfair Display* & *Plus Jakarta Sans*), Chart.js, html2pdf.js.
- **Backend & Database**: **Supabase**
  - PostgreSQL Relational Database
  - Row Level Security (RLS)
  - Supabase Auth & Realtime Subscriptions
  - Storage Buckets (`package-images`, `destination-images`, `invoice-files`)
  - Supabase Edge Functions (Deno / TypeScript)
- **Deployment Ready**: Standard static hosting (Vercel, Netlify, GitHub Pages, Apache/Nginx).

---

## 🗄️ Database Architecture (`supabase/schema.sql`)

The database contains 11 structured tables with full foreign key constraints:

1. `admins`: System administrative users linked to `auth.users`.
2. `customers`: Guest contact details.
3. `destinations`: Wildlife reserves and national parks.
4. `safari_packages`: Package details, days, adult & child prices, accommodations, and included/excluded items.
5. `bookings`: Master booking records with auto-generated references (`CYR-YYYY-XXXX`).
6. `booking_items`: Individual items breakdown.
7. `invoices`: Invoice numbers (`INV-YYYY-XXXX`), subtotal, total amount, amount paid, and balance due.
8. `invoice_items`: Granular invoice line items.
9. `payments`: Payment receipts tracking M-Pesa code, bank reference, payment date, and amount.
10. `notifications`: System, WhatsApp, and email dispatch audit log.
11. `contact_messages`: Inquiries from the website contact form.

---

## 🚀 Supabase Deployment Guide

### 1. Database & Schema Setup
1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Execute the contents of [`supabase/schema.sql`](file:///c:/Users/ADMIN/Desktop/fututre%20system/transport%20system/supabase/schema.sql).
4. Execute the seed script in [`supabase/seed.sql`](file:///c:/Users/ADMIN/Desktop/fututre%20system/transport%20system/supabase/seed.sql) to populate initial safari packages and test data.

### 2. Configure Environment Secrets
Add the following Environment Variables under **Project Settings -> Edge Functions -> Secrets** or `.env`:

```env
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
WHATSAPP_CLOUD_API_TOKEN=<your-meta-whatsapp-token>
WHATSAPP_PHONE_ID=<your-whatsapp-phone-id>
ADMIN_WHATSAPP_NUMBER=254726072607
```

### 3. Deploy Supabase Edge Functions
Using Supabase CLI:

```bash
supabase functions deploy create-booking
supabase functions deploy send-whatsapp-notification
```

---

## 💻 Local Testing & Demo Mode

The application includes an automatic **Local Database Engine** (`js/supabase-client.js`).
If Supabase URL is not yet connected, the application automatically uses local state storage so that **all booking, pricing, PDF invoice downloading, and admin dashboard operations work 100% out of the box immediately**.

- **Customer Website**: Open `index.html` in any web browser.
- **Admin Portal**: Open `admin.html`.
  - Demo Admin Email: `cyrootourssafari@gmail.com`
  - Demo Password: `admin123`
