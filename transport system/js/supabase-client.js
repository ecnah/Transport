/* 
   CYROO TOURS & SAFARI - Unified Supabase Client & Database Engine
*/

(function(window) {
  const cfg = window.CYROO_CONFIG;
  
  // Check if Supabase CDN SDK is available
  let sbClient = null;

  function initClient() {
    const sbUrl = (localStorage.getItem("cyroo_sb_url") || cfg.supabaseUrl || "").trim();
    const sbKey = (localStorage.getItem("cyroo_sb_key") || cfg.supabaseAnonKey || "").trim();
    const isConfigured = sbUrl && sbUrl.includes(".supabase.co") && sbKey && sbKey !== "your-anon-key";

    if (window.supabase && isConfigured) {
      try {
        sbClient = window.supabase.createClient(sbUrl, sbKey);
        console.log("Supabase Client Initialized Connected to Remote Cloud:", sbUrl);
      } catch (e) {
        console.warn("Failed to initialize Supabase client, falling back to local database mode:", e);
        sbClient = null;
      }
    } else {
      sbClient = null;
      console.log("Operating in Local / Offline Database Mode with LocalStorage persistence.");
    }
    return sbClient;
  }

  initClient();

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

  // Ensure Currency migration to USD in LocalStorage
  if (localStorage.getItem('cyroo_db_currency') !== 'USD') {
    localStorage.removeItem('cyroo_db_packages');
    localStorage.removeItem('cyroo_db_bookings');
    localStorage.setItem('cyroo_db_currency', 'USD');
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
        try {
          const { data, error } = await sbClient.from('safari_packages').select('*').order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            const sanitized = sanitizeAssets(data);
            LocalDB.set('packages', sanitized);
            return sanitized;
          }
        } catch (e) {
          console.warn("Error loading packages from Supabase, using local fallback:", e);
        }
      }
      return sanitizeAssets(LocalDB.get('packages', cfg.seedPackages));
    },

    async savePackage(pkgData) {
      const origId = pkgData.id;
      let savedRecord = null;

      if (sbClient) {
        try {
          const { id, ...updateFields } = pkgData;
          const isUuid = typeof origId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(origId);

          let existingRow = null;
          if (origId && isUuid) {
            const { data: byId } = await sbClient.from('safari_packages').select('id').eq('id', origId).maybeSingle();
            existingRow = byId;
          }
          if (!existingRow && pkgData.name) {
            const { data: byName } = await sbClient.from('safari_packages').select('id').ilike('name', pkgData.name).maybeSingle();
            existingRow = byName;
          }

          if (existingRow && existingRow.id) {
            const { data: updated, error: updateErr } = await sbClient
              .from('safari_packages')
              .update(updateFields)
              .eq('id', existingRow.id)
              .select()
              .single();

            if (updateErr) {
              console.error("Supabase package update error:", updateErr);
            } else {
              savedRecord = updated;
            }
          } else {
            const { data: inserted, error: insertErr } = await sbClient
              .from('safari_packages')
              .insert([updateFields])
              .select()
              .single();

            if (insertErr) {
              console.error("Supabase package insert error:", insertErr);
            } else {
              savedRecord = inserted;
            }
          }
        } catch (e) {
          console.error("Supabase package save exception:", e);
        }
      }

      // Always update LocalDB in-place to keep UI and cache synchronized
      const pkgs = LocalDB.get('packages', cfg.seedPackages);
      const targetId = (savedRecord && savedRecord.id) ? savedRecord.id : origId;
      const targetName = (pkgData.name || '').trim().toLowerCase();

      let index = -1;
      if (origId) {
        index = pkgs.findIndex(p => p.id === origId || (savedRecord && p.id === savedRecord.id));
      }
      if (index === -1 && targetName) {
        index = pkgs.findIndex(p => (p.name || '').trim().toLowerCase() === targetName);
      }

      const mergedPkg = {
        ...pkgData,
        id: targetId || (index !== -1 ? pkgs[index].id : `pkg-local-${Date.now()}`)
      };

      if (index !== -1) {
        pkgs[index] = { ...pkgs[index], ...mergedPkg };
      } else {
        pkgs.unshift(mergedPkg);
      }

      LocalDB.set('packages', pkgs);
      return savedRecord || mergedPkg;
    },

    async deletePackage(pkgId) {
      if (sbClient) {
        try {
          const isUuid = typeof pkgId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pkgId);
          if (isUuid) {
            await sbClient.from('safari_packages').delete().eq('id', pkgId);
          } else {
            const pkgs = LocalDB.get('packages', cfg.seedPackages);
            const found = pkgs.find(p => p.id === pkgId);
            if (found && found.name) {
              await sbClient.from('safari_packages').delete().ilike('name', found.name);
            }
          }
        } catch (e) {
          console.error("Supabase package delete error:", e);
        }
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
        try {
          const { data, error } = await sbClient.from('destinations').select('*').order('name');
          if (!error && data && data.length > 0) {
            const sanitized = sanitizeAssets(data);
            LocalDB.set('destinations', sanitized);
            return sanitized;
          }
        } catch (e) {
          console.warn("Error loading destinations from Supabase, using local fallback:", e);
        }
      }
      return sanitizeAssets(LocalDB.get('destinations', cfg.seedDestinations));
    },

    async saveDestination(destData) {
      const origId = destData.id;
      let savedRecord = null;

      if (sbClient) {
        try {
          const payload = {
            name: destData.name,
            tagline: destData.tagline || '',
            location: destData.location || 'Kenya',
            image_url: destData.image_url || 'assets/download.jfif'
          };
          if (destData.description) payload.description = destData.description;

          const isUuid = typeof origId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(origId);

          let existingRow = null;
          if (origId && isUuid) {
            const { data: byId } = await sbClient.from('destinations').select('id').eq('id', origId).maybeSingle();
            existingRow = byId;
          }
          if (!existingRow && destData.name) {
            const { data: byName } = await sbClient.from('destinations').select('id').ilike('name', destData.name).maybeSingle();
            existingRow = byName;
          }

          if (existingRow && existingRow.id) {
            const { data: updated, error: updateErr } = await sbClient
              .from('destinations')
              .update(payload)
              .eq('id', existingRow.id)
              .select()
              .single();

            if (updateErr) {
              console.error("Supabase destination update error:", updateErr);
            } else {
              savedRecord = updated;
            }
          } else {
            const { data: inserted, error: insertErr } = await sbClient
              .from('destinations')
              .insert([payload])
              .select()
              .single();

            if (insertErr) {
              console.error("Supabase destination insert error:", insertErr);
            } else {
              savedRecord = inserted;
            }
          }
        } catch (e) {
          console.error("Supabase destination save exception:", e);
        }
      }

      // Always update LocalDB in-place so local state is immediately consistent
      const dests = LocalDB.get('destinations', cfg.seedDestinations);
      const targetId = (savedRecord && savedRecord.id) ? savedRecord.id : origId;
      const targetName = (destData.name || '').trim().toLowerCase();

      let index = -1;
      if (origId) {
        index = dests.findIndex(d => d.id === origId || (savedRecord && d.id === savedRecord.id));
      }
      if (index === -1 && targetName) {
        index = dests.findIndex(d => (d.name || '').trim().toLowerCase() === targetName);
      }

      const mergedData = {
        id: targetId || (index !== -1 ? dests[index].id : `dest-local-${Date.now()}`),
        name: destData.name,
        tagline: destData.tagline || '',
        location: destData.location || 'Kenya',
        image_url: destData.image_url || 'assets/download.jfif'
      };

      if (index !== -1) {
        dests[index] = { ...dests[index], ...mergedData };
      } else {
        dests.unshift(mergedData);
      }

      LocalDB.set('destinations', dests);
      return savedRecord || mergedData;
    },

    async deleteDestination(destId) {
      if (sbClient) {
        try {
          const isUuid = typeof destId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(destId);
          if (isUuid) {
            await sbClient.from('destinations').delete().eq('id', destId);
          } else {
            const dests = LocalDB.get('destinations', cfg.seedDestinations);
            const found = dests.find(d => d.id === destId);
            if (found && found.name) {
              await sbClient.from('destinations').delete().ilike('name', found.name);
            }
          }
        } catch (e) {
          console.error("Supabase destination delete error:", e);
        }
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
            customer_name: b.customer_name || b.customers?.full_name || 'Valued Guest',
            customer_phone: b.customer_phone || b.customers?.phone || '',
            customer_email: b.customer_email || b.customers?.email || '',
            package_name: b.package_name || b.safari_packages?.name || 'Safari Package',
            package_category: b.safari_packages?.category || (b.package_name?.includes('Airport') ? 'Airport Services' : 'Safari Parks'),
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
        const matchRef = (b.booking_reference || '').toUpperCase() === cleanRef;
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
        destination: bookingPayload.destination_name || bookingPayload.destination,
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
          // 1. Check or Insert Customer Record
          let custId = null;
          const { data: existingCust } = await sbClient.from('customers').select('id').eq('email', bookingPayload.email).maybeSingle();
          if (existingCust && existingCust.id) {
            custId = existingCust.id;
          } else {
            const { data: newCust } = await sbClient.from('customers').insert([{
              full_name: bookingPayload.full_name,
              email: bookingPayload.email,
              phone: bookingPayload.phone
            }]).select('id').single();
            if (newCust) custId = newCust.id;
          }

          // 2. Determine valid package_id UUID if provided
          let pkgUuid = (bookingPayload.package_id && bookingPayload.package_id.length === 36 && !bookingPayload.package_id.startsWith('pkg-')) 
            ? bookingPayload.package_id 
            : null;

          const sbBookingObj = {
            booking_reference,
            customer_id: custId,
            package_id: pkgUuid,
            customer_name: bookingPayload.full_name,
            customer_phone: bookingPayload.phone,
            customer_email: bookingPayload.email,
            package_name: bookingPayload.package_name,
            destination: bookingPayload.destination_name || bookingPayload.destination,
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
            booking_status: "Pending"
          };

          const { data: insertedSbBooking, error: sbErr } = await sbClient.from('bookings').insert([sbBookingObj]).select().single();
          if (!sbErr && insertedSbBooking) {
            // 3. Insert Invoice
            const invoiceNumber = `INV-${year}-${seq}`;
            await sbClient.from('invoices').insert([{
              invoice_number: invoiceNumber,
              booking_id: insertedSbBooking.id,
              booking_reference,
              customer_name: bookingPayload.full_name,
              customer_phone: bookingPayload.phone,
              customer_email: bookingPayload.email,
              package_name: bookingPayload.package_name,
              destination: bookingPayload.destination_name || bookingPayload.destination,
              travel_date: bookingPayload.travel_date,
              return_date: bookingPayload.return_date,
              adults: parseInt(bookingPayload.adults || 1),
              children: parseInt(bookingPayload.children || 0),
              subtotal: bookingPayload.total_amount,
              discount: 0,
              total_amount: bookingPayload.total_amount,
              amount_paid: 0,
              balance_due: bookingPayload.total_amount,
              payment_status: "Unpaid"
            }]);

            newBooking.id = insertedSbBooking.id;
            newBooking.booking_reference = insertedSbBooking.booking_reference || booking_reference;
          }
        } catch (e) {
          console.warn("Direct Supabase booking insert error, continuing with local sync:", e);
        }
      }

      // Local persistence fallback & sync
      const bookings = LocalDB.get('bookings', cfg.seedBookings);
      bookings.unshift(newBooking);
      LocalDB.set('bookings', bookings);

      // Save user to local users store automatically
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

      // Local Invoice generation
      const invoiceNumber = `INV-${year}-${seq}`;
      const invoice = {
        id: `inv-${Date.now()}`,
        invoice_number: invoiceNumber,
        booking_reference: newBooking.booking_reference,
        customer_name: bookingPayload.full_name,
        customer_phone: bookingPayload.phone,
        customer_email: bookingPayload.email,
        package_name: bookingPayload.package_name,
        destination: bookingPayload.destination_name || bookingPayload.destination,
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

      // Update Booking Balance & Payment Status locally
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

      if (sbClient) {
        try {
          let bUuid = paymentData.booking_id;
          if (bUuid && bUuid.startsWith('b-')) bUuid = null;
          await sbClient.from('payments').insert([{
            booking_id: bUuid,
            booking_reference: paymentData.booking_reference,
            customer_name: paymentData.customer_name || 'Valued Guest',
            amount: paymentData.amount,
            payment_method: paymentData.payment_method || 'M-Pesa',
            transaction_reference: paymentData.transaction_reference || '',
            notes: paymentData.notes || ''
          }]);

          if (bUuid) {
            const newPaid = Number(b?.amount_paid || paymentData.amount);
            const newBal = Math.max(0, Number(b?.total_amount || 0) - newPaid);
            const newPayStatus = newBal === 0 ? 'Paid' : 'Partially Paid';
            await sbClient.from('bookings').update({
              amount_paid: newPaid,
              balance: newBal,
              payment_status: newPayStatus
            }).eq('id', bUuid);
          }
        } catch (e) {
          console.warn("Supabase payment record error:", e);
        }
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
        try {
          const channel = sbClient.channel('realtime_bookings')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, payload => {
              callback(payload.new);
            })
            .subscribe();
          return channel;
        } catch (e) {
          console.warn("Realtime bookings subscription warning:", e);
        }
      }

      // Local broadcast fallback
      const handler = (e) => {
        if (e.detail && e.detail.table === 'bookings') {
          callback(e.detail.data[0]);
        }
      };
      window.addEventListener('cyroo_db_updated', handler);
      return { unsubscribe: () => window.removeEventListener('cyroo_db_updated', handler) };
    },

    subscribeRealtimeDestinations(callback) {
      if (sbClient) {
        try {
          const channel = sbClient.channel('realtime_destinations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'destinations' }, async (payload) => {
              console.log("Realtime destinations change:", payload);
              const { data } = await sbClient.from('destinations').select('*').order('name');
              if (data && data.length > 0) {
                const sanitized = sanitizeAssets(data);
                LocalDB.set('destinations', sanitized);
                if (callback) callback(sanitized);
              }
            })
            .subscribe();
          return channel;
        } catch (e) {
          console.warn("Realtime destinations subscription warning:", e);
        }
      }

      const handler = (e) => {
        if (e.detail && e.detail.table === 'destinations') {
          if (callback) callback(e.detail.data);
        }
      };
      window.addEventListener('cyroo_db_updated', handler);
      return { unsubscribe: () => window.removeEventListener('cyroo_db_updated', handler) };
    },

    subscribeRealtimePackages(callback) {
      if (sbClient) {
        try {
          const channel = sbClient.channel('realtime_packages')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'safari_packages' }, async (payload) => {
              console.log("Realtime packages change:", payload);
              const { data } = await sbClient.from('safari_packages').select('*').order('created_at', { ascending: false });
              if (data && data.length > 0) {
                const sanitized = sanitizeAssets(data);
                LocalDB.set('packages', sanitized);
                if (callback) callback(sanitized);
              }
            })
            .subscribe();
          return channel;
        } catch (e) {
          console.warn("Realtime packages subscription warning:", e);
        }
      }

      const handler = (e) => {
        if (e.detail && e.detail.table === 'packages') {
          if (callback) callback(e.detail.data);
        }
      };
      window.addEventListener('cyroo_db_updated', handler);
      return { unsubscribe: () => window.removeEventListener('cyroo_db_updated', handler) };
    },

    // Cloud Connection & Netlify Management Helpers
    getCloudStatus() {
      const sbUrl = (localStorage.getItem("cyroo_sb_url") || cfg.supabaseUrl || "").trim();
      const sbKey = (localStorage.getItem("cyroo_sb_key") || cfg.supabaseAnonKey || "").trim();
      const isConfigured = !!(sbUrl && sbUrl.includes(".supabase.co") && sbKey && sbKey !== "your-anon-key");
      return {
        isConfigured,
        isConnected: !!sbClient,
        url: sbUrl || "",
        anonKey: sbKey || ""
      };
    },

    setCloudCredentials(url, key) {
      if (url && url.trim()) localStorage.setItem("cyroo_sb_url", url.trim());
      else localStorage.removeItem("cyroo_sb_url");
      if (key && key.trim()) localStorage.setItem("cyroo_sb_key", key.trim());
      else localStorage.removeItem("cyroo_sb_key");

      initClient();
      return !!sbClient;
    },

    async syncAllToCloud() {
      if (!sbClient) throw new Error("Supabase Cloud is not connected. Please save valid Supabase credentials first.");
      
      const dests = LocalDB.get('destinations', cfg.seedDestinations);
      let destCount = 0;
      for (const d of dests) {
        await this.saveDestination(d);
        destCount++;
      }

      const pkgs = LocalDB.get('packages', cfg.seedPackages);
      let pkgCount = 0;
      for (const p of pkgs) {
        await this.savePackage(p);
        pkgCount++;
      }

      return { destinations: destCount, packages: pkgCount };
    }
  };
})(window);
