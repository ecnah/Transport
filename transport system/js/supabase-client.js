/* 
   CYROO TOURS & SAFARI - Unified Supabase Client & Database Engine
*/

(function(window) {
  const cfg = window.CYROO_CONFIG;
  
  // Check if Supabase CDN SDK is available
  let sbClient = null;
  const isSupabaseConfigured = cfg.supabaseUrl && cfg.supabaseUrl.includes(".supabase.co") && cfg.supabaseAnonKey && cfg.supabaseAnonKey !== "your-anon-key";

  if (window.supabase && isSupabaseConfigured) {
    try {
      sbClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      console.log("Supabase Client Initialized Connected to Remote Cloud.");
    } catch (e) {
      console.warn("Failed to initialize Supabase client, falling back to local database mode:", e);
    }
  } else {
    console.log("Operating in Local / Offline Database Mode with LocalStorage persistence.");
  }

  // Initial Seed Users
  const defaultUsers = [
    { id: "usr-1", full_name: "John Kiprop", email: "john.kiprop@example.com", phone: "0712345678", role: "Customer", created_at: "2026-10-01T10:00:00Z" },
    { id: "usr-2", full_name: "Sarah Jenkins", email: "sarah.j@example.org", phone: "0722998877", role: "Customer", created_at: "2026-10-02T14:30:00Z" },
    { id: "admin-1", full_name: "Cyroo Super Admin", email: "cyrootourssafari@gmail.com", phone: "0726072607", role: "Super Admin", created_at: "2026-09-01T08:00:00Z" }
  ];

  // LocalStorage Helper Database Engine
  const LocalDB = {
    get(key, defaultData) {
      const data = localStorage.getItem(`cyroo_db_${key}`);
      if (!data) {
        localStorage.setItem(`cyroo_db_${key}`, JSON.stringify(defaultData));
        return defaultData;
      }
      try {
        return JSON.parse(data);
      } catch (e) {
        return defaultData;
      }
    },
    set(key, data) {
      localStorage.setItem(`cyroo_db_${key}`, JSON.stringify(data));
      // Broadcast change event for multi-tab realtime simulation
      window.dispatchEvent(new CustomEvent('cyroo_db_updated', { detail: { table: key, data } }));
    }
  };

  // Helper to ensure local assets/ images are used for default items
  function sanitizeAssets(list) {
    if (!Array.isArray(list)) return list;
    return list.map(item => {
      if (!item.image_url || item.image_url.includes('unsplash.com')) {
        const name = (item.name || '').toLowerCase();
        if (name.includes('amboseli')) {
          item.image_url = 'assets/Amboseli National  (1).png';
        } else if (name.includes('nairobi')) {
          item.image_url = 'assets/Amboseli National  (5).png';
        } else if (name.includes('tsavo') || name.includes('airport') || name.includes('jkia') || name.includes('wilson')) {
          item.image_url = 'assets/download (2).jfif';
        } else if (name.includes('nakuru') || name.includes('custom') || name.includes('bespoke')) {
          item.image_url = 'assets/wallpaper , HD wallpaper , 4k wallpaper.jfif';
        } else {
          item.image_url = 'assets/download.jfif';
        }
      }
      return item;
    });
  }

  // Initialize Local Mock Stores
  LocalDB.set('packages', sanitizeAssets(LocalDB.get('packages', cfg.seedPackages)));
  LocalDB.set('destinations', sanitizeAssets(LocalDB.get('destinations', cfg.seedDestinations)));
  LocalDB.get('bookings', cfg.seedBookings);
  LocalDB.get('users', defaultUsers);
  LocalDB.get('invoices', []);
  LocalDB.get('payments', []);
  LocalDB.get('messages', []);

  window.CyrooDB = {
    isCloudMode() {
      return !!sbClient;
    },

    // ----------------------------------------------------
    // SAFARI PACKAGES
    // ----------------------------------------------------
    async getPackages() {
      if (sbClient) {
        const { data, error } = await sbClient.from('safari_packages').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return sanitizeAssets(data);
      }
      return sanitizeAssets(LocalDB.get('packages', cfg.seedPackages));
    },

    async savePackage(pkgData) {
      if (sbClient) {
        if (pkgData.id && !pkgData.id.startsWith("pkg-")) {
          const { data, error } = await sbClient.from('safari_packages').update(pkgData).eq('id', pkgData.id).select().single();
          if (!error) return data;
        } else {
          delete pkgData.id;
          const { data, error } = await sbClient.from('safari_packages').insert([pkgData]).select().single();
          if (!error) return data;
        }
      }
      
      const pkgs = LocalDB.get('packages', cfg.seedPackages);
      if (pkgData.id) {
        const index = pkgs.findIndex(p => p.id === pkgData.id);
        if (index !== -1) pkgs[index] = { ...pkgs[index], ...pkgData };
        else pkgs.unshift(pkgData);
      } else {
        pkgData.id = `pkg-local-${Date.now()}`;
        pkgs.unshift(pkgData);
      }
      LocalDB.set('packages', pkgs);
      return pkgData;
    },

    async deletePackage(pkgId) {
      if (sbClient && !pkgId.startsWith("pkg-")) {
        await sbClient.from('safari_packages').delete().eq('id', pkgId);
      }
      const pkgs = LocalDB.get('packages', cfg.seedPackages).filter(p => p.id !== pkgId);
      LocalDB.set('packages', pkgs);
      return true;
    },

    // ----------------------------------------------------
    // DESTINATIONS
    // ----------------------------------------------------
    async getDestinations() {
      if (sbClient) {
        const { data, error } = await sbClient.from('destinations').select('*');
        if (!error && data && data.length > 0) return sanitizeAssets(data);
      }
      return sanitizeAssets(LocalDB.get('destinations', cfg.seedDestinations));
    },

    async saveDestination(destData) {
      if (sbClient) {
        if (destData.id && !destData.id.startsWith("dest-")) {
          const { data, error } = await sbClient.from('destinations').update(destData).eq('id', destData.id).select().single();
          if (!error) return data;
        } else {
          delete destData.id;
          const { data, error } = await sbClient.from('destinations').insert([destData]).select().single();
          if (!error) return data;
        }
      }
      
      const dests = LocalDB.get('destinations', cfg.seedDestinations);
      if (destData.id) {
        const index = dests.findIndex(d => d.id === destData.id);
        if (index !== -1) dests[index] = { ...dests[index], ...destData };
        else dests.unshift(destData);
      } else {
        destData.id = `dest-local-${Date.now()}`;
        dests.unshift(destData);
      }
      LocalDB.set('destinations', dests);
      return destData;
    },

    async deleteDestination(destId) {
      if (sbClient && !destId.startsWith("dest-")) {
        await sbClient.from('destinations').delete().eq('id', destId);
      }
      const dests = LocalDB.get('destinations', cfg.seedDestinations).filter(d => d.id !== destId);
      LocalDB.set('destinations', dests);
      return true;
    },

    // ----------------------------------------------------
    // USER MANAGEMENT (CUSTOMERS & ADMINS)
    // ----------------------------------------------------
    async getUsers() {
      if (sbClient) {
        const { data: custs } = await sbClient.from('customers').select('*');
        const { data: admins } = await sbClient.from('admins').select('*');
        if ((custs && custs.length > 0) || (admins && admins.length > 0)) {
          const formattedCusts = (custs || []).map(c => ({ ...c, role: 'Customer' }));
          const formattedAdmins = (admins || []).map(a => ({ ...a, role: 'Super Admin' }));
          return [...formattedAdmins, ...formattedCusts];
        }
      }
      return LocalDB.get('users', defaultUsers);
    },

    async saveUser(userData) {
      if (sbClient) {
        if (userData.role === 'Super Admin') {
          await sbClient.from('admins').insert([{ full_name: userData.full_name, email: userData.email, phone: userData.phone, role: 'admin' }]);
        } else {
          await sbClient.from('customers').insert([{ full_name: userData.full_name, email: userData.email, phone: userData.phone }]);
        }
      }

      const users = LocalDB.get('users', defaultUsers);
      const newUser = {
        id: `usr-${Date.now()}`,
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role || 'Customer',
        created_at: new Date().toISOString()
      };
      users.unshift(newUser);
      LocalDB.set('users', users);
      return newUser;
    },

    async deleteUser(userId) {
      const users = LocalDB.get('users', defaultUsers).filter(u => u.id !== userId);
      LocalDB.set('users', users);
      return true;
    },

    // ----------------------------------------------------
    // BOOKINGS
    // ----------------------------------------------------
    async getBookings() {
      if (sbClient) {
        const { data, error } = await sbClient
          .from('bookings')
          .select('*, customers(full_name, phone, email), safari_packages(name, category)')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map(b => ({
            id: b.id,
            booking_reference: b.booking_reference,
            customer_name: b.customers?.full_name || b.customer_name || 'Valued Guest',
            customer_phone: b.customers?.phone || b.customer_phone || '',
            customer_email: b.customers?.email || b.customer_email || '',
            package_name: b.safari_packages?.name || b.package_name || 'Safari Package',
            package_category: b.safari_packages?.category || 'Safari Parks',
            destination: b.destination || 'Kenyan Reserve',
            travel_date: b.travel_date,
            return_date: b.return_date,
            adults: b.adults,
            children: b.children,
            accommodation: b.accommodation,
            transport: b.transport,
            airport_service: b.airport_service || 'No Airport Transfer',
            special_requests: b.special_requests,
            subtotal: b.subtotal,
            discount: b.discount,
            total_amount: b.total_amount,
            amount_paid: b.amount_paid,
            balance: b.balance,
            payment_status: b.payment_status,
            booking_status: b.booking_status,
            created_at: b.created_at
          }));
        }
      }
      return LocalDB.get('bookings', cfg.seedBookings);
    },

    async getBookingByRefAndPhone(reference, phone) {
      const allBookings = await this.getBookings();
      const cleanRef = (reference || '').trim().toUpperCase();
      const cleanPhone = (phone || '').trim().replace(/[^0-9]/g, '');

      return allBookings.find(b => {
        const matchRef = b.booking_reference.toUpperCase() === cleanRef;
        const bPhoneClean = (b.customer_phone || '').replace(/[^0-9]/g, '');
        const matchPhone = bPhoneClean.endsWith(cleanPhone.slice(-7)) || cleanPhone.endsWith(bPhoneClean.slice(-7));
        return matchRef && matchPhone;
      });
    },

    async createBooking(bookingPayload) {
      // Generate Unique Reference: CYR-2026-XXXX
      const year = new Date().getFullYear();
      const seq = Math.floor(1000 + Math.random() * 9000);
      const booking_reference = `CYR-${year}-${seq}`;

      const newBooking = {
        id: `b-${Date.now()}`,
        booking_reference,
        customer_name: bookingPayload.full_name,
        customer_phone: bookingPayload.phone,
        customer_email: bookingPayload.email,
        package_name: bookingPayload.package_name,
        destination: bookingPayload.destination_name,
        travel_date: bookingPayload.travel_date,
        return_date: bookingPayload.return_date,
        adults: parseInt(bookingPayload.adults || 1),
        children: parseInt(bookingPayload.children || 0),
        accommodation: bookingPayload.accommodation || "Standard Safari Lodge",
        transport: bookingPayload.transport || "4x4 Safari Landcruiser",
        airport_service: bookingPayload.airport_service || "No Airport Transfer",
        special_requests: bookingPayload.special_requests || "",
        subtotal: bookingPayload.total_amount,
        discount: 0,
        total_amount: bookingPayload.total_amount,
        amount_paid: 0,
        balance: bookingPayload.total_amount,
        payment_status: "Unpaid",
        booking_status: "Pending",
        created_at: new Date().toISOString()
      };

      if (sbClient) {
        try {
          // Attempt edge function invoke
          const { data, error } = await sbClient.functions.invoke('create-booking', {
            body: bookingPayload
          });
          if (!error && data && data.booking) {
            return data.booking;
          }
        } catch (e) {
          console.warn("Edge function fallback, storing directly:", e);
        }
      }

      // Local persistence fallback
      const bookings = LocalDB.get('bookings', cfg.seedBookings);
      bookings.unshift(newBooking);
      LocalDB.set('bookings', bookings);

      // Save user to users store automatically
      const users = LocalDB.get('users', defaultUsers);
      if (!users.find(u => u.email === bookingPayload.email)) {
        users.unshift({
          id: `usr-${Date.now()}`,
          full_name: bookingPayload.full_name,
          email: bookingPayload.email,
          phone: bookingPayload.phone,
          role: "Customer",
          created_at: new Date().toISOString()
        });
        LocalDB.set('users', users);
      }

      // Automatic Invoice generation
      const invoiceNumber = `INV-${year}-${seq}`;
      const invoice = {
        id: `inv-${Date.now()}`,
        invoice_number: invoiceNumber,
        booking_reference,
        customer_name: bookingPayload.full_name,
        customer_phone: bookingPayload.phone,
        customer_email: bookingPayload.email,
        package_name: bookingPayload.package_name,
        destination: bookingPayload.destination_name,
        travel_date: bookingPayload.travel_date,
        return_date: bookingPayload.return_date,
        adults: bookingPayload.adults,
        children: bookingPayload.children,
        subtotal: bookingPayload.total_amount,
        discount: 0,
        total_amount: bookingPayload.total_amount,
        amount_paid: 0,
        balance_due: bookingPayload.total_amount,
        payment_status: "Unpaid",
        invoice_date: new Date().toISOString().split('T')[0]
      };

      const invoices = LocalDB.get('invoices', []);
      invoices.unshift(invoice);
      LocalDB.set('invoices', invoices);

      return newBooking;
    },

    async updateBookingStatus(bookingId, bookingStatus, paymentStatus = null) {
      const bookings = LocalDB.get('bookings', cfg.seedBookings);
      const bIndex = bookings.findIndex(b => b.id === bookingId);
      if (bIndex !== -1) {
        bookings[bIndex].booking_status = bookingStatus;
        if (paymentStatus) bookings[bIndex].payment_status = paymentStatus;
        LocalDB.set('bookings', bookings);
      }

      if (sbClient && !bookingId.startsWith("b-")) {
        const updateObj = { booking_status: bookingStatus };
        if (paymentStatus) updateObj.payment_status = paymentStatus;
        await sbClient.from('bookings').update(updateObj).eq('id', bookingId);
      }
      return true;
    },

    // ----------------------------------------------------
    // PAYMENTS
    // ----------------------------------------------------
    async recordPayment(paymentData) {
      const newPayment = {
        id: `pay-${Date.now()}`,
        ...paymentData,
        created_at: new Date().toISOString()
      };

      const payments = LocalDB.get('payments', []);
      payments.unshift(newPayment);
      LocalDB.set('payments', payments);

      // Update Booking Balance & Payment Status
      const bookings = LocalDB.get('bookings', cfg.seedBookings);
      const b = bookings.find(x => x.id === paymentData.booking_id || x.booking_reference === paymentData.booking_reference);
      if (b) {
        b.amount_paid = Number(b.amount_paid || 0) + Number(paymentData.amount);
        b.balance = Math.max(0, Number(b.total_amount) - b.amount_paid);
        if (b.balance === 0) {
          b.payment_status = "Paid";
        } else if (b.amount_paid > 0) {
          b.payment_status = "Partially Paid";
        }
        LocalDB.set('bookings', bookings);
      }
      return newPayment;
    },

    // ----------------------------------------------------
    // MESSAGES (Contact Form)
    // ----------------------------------------------------
    async saveContactMessage(msg) {
      const newMsg = {
        id: `msg-${Date.now()}`,
        ...msg,
        status: "Unread",
        created_at: new Date().toISOString()
      };
      const msgs = LocalDB.get('messages', []);
      msgs.unshift(newMsg);
      LocalDB.set('messages', msgs);

      if (sbClient) {
        await sbClient.from('contact_messages').insert([msg]);
      }
      return newMsg;
    },

    async getContactMessages() {
      if (sbClient) {
        const { data } = await sbClient.from('contact_messages').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) return data;
      }
      return LocalDB.get('messages', []);
    },

    // Realtime Listener Registration
    subscribeRealtimeBookings(callback) {
      if (sbClient) {
        const channel = sbClient.channel('realtime_bookings')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, payload => {
            callback(payload.new);
          })
          .subscribe();
        return channel;
      }

      // Local broadcast fallback
      const handler = (e) => {
        if (e.detail && e.detail.table === 'bookings') {
          callback(e.detail.data[0]);
        }
      };
      window.addEventListener('cyroo_db_updated', handler);
      return { unsubscribe: () => window.removeEventListener('cyroo_db_updated', handler) };
    }
  };
})(window);
