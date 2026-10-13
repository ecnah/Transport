/* 
   CYROO TOURS & SAFARI - Customer Frontend App Engine
*/

// Mobile Drawer Navigation Controls
window.toggleMobileNav = function() {
  const navMenu = document.getElementById('navMenu');
  const overlay = document.getElementById('navOverlay');
  if (navMenu) {
    const isActive = navMenu.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active', isActive);
    document.body.style.overflow = isActive ? 'hidden' : '';
  }
};

window.closeMobileNav = function() {
  const navMenu = document.getElementById('navMenu');
  const overlay = document.getElementById('navOverlay');
  if (navMenu) navMenu.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
};

document.addEventListener('DOMContentLoaded', async () => {
  // Mobile Menu Toggle Button
  const mobileToggle = document.getElementById('mobileToggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      window.toggleMobileNav();
    });
  }

  // Smooth Scroll & Tab Switcher
  const navLinks = document.querySelectorAll('.nav-link');
  const pageSections = document.querySelectorAll('.page-view');

  window.navigateToTab = function(targetId) {
    pageSections.forEach(sec => {
      if (sec.id === targetId) {
        sec.style.display = 'block';
        sec.scrollIntoView({ behavior: 'smooth' });
      } else {
        sec.style.display = 'none';
      }
    });

    navLinks.forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === `#${targetId}`);
    });

    // Sync Mobile Bottom Navigation Items
    document.querySelectorAll('.mobile-bottom-item[data-target]').forEach(item => {
      item.classList.toggle('active', item.dataset.target === targetId);
    });

    window.closeMobileNav();
  };

  // Mobile Bottom Navigation Bar Click Listeners
  document.querySelectorAll('.mobile-bottom-item[data-target]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.dataset.target;
      if (target) window.navigateToTab(target);
    });
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.replace('#', '');
        navigateToTab(targetId);
      }
    });
  });

  // Load Packages and Destinations
  await loadPackages();
  await loadDestinations();

  // Initialize Package Category Filter Listeners
  initPackageCategoryFilters();

  // Initialize Booking Form Calculators
  initBookingForm();

  // Initialize My Booking Lookup Form
  initBookingTracking();

  // Initialize Contact Form
  initContactForm();

  // Instant Realtime Synchronization for Destinations & Packages (Supabase + Cross-Tab)
  if (window.CyrooDB) {
    if (window.CyrooDB.subscribeRealtimeDestinations) {
      window.CyrooDB.subscribeRealtimeDestinations(() => {
        window.loadDestinations();
      });
    }
    if (window.CyrooDB.subscribeRealtimePackages) {
      window.CyrooDB.subscribeRealtimePackages(() => {
        loadPackages();
      });
    }
  }

  // Cross-Tab and Multi-Window Live Sync via LocalStorage storage events
  window.addEventListener('storage', (e) => {
    if (e.key === 'cyroo_db_destinations') {
      window.loadDestinations();
    }
    if (e.key === 'cyroo_db_packages') {
      loadPackages();
    }
  });

  window.addEventListener('cyroo_db_updated', (e) => {
    if (e.detail && e.detail.table === 'destinations') {
      window.loadDestinations();
    }
    if (e.detail && e.detail.table === 'packages') {
      loadPackages();
    }
  });

  // Handle URL parameter for pre-selected package
  const urlParams = new URLSearchParams(window.location.search);
  const pkgParam = urlParams.get('package') || urlParams.get('pkg');

  // Handle URL hash navigation on load
  const hash = window.location.hash.replace('#', '');
  if (pkgParam || hash === 'book') {
    if (pkgParam) {
      setTimeout(() => {
        const select = document.getElementById('bookingPackageSelect');
        if (select) {
          select.value = pkgParam;
          select.dispatchEvent(new Event('change'));
        }
      }, 200);
    }
    navigateToTab('book');
  } else if (hash && document.getElementById(hash)) {
    navigateToTab(hash);
  } else {
    navigateToTab('home');
  }
});

// Render Packages Cards
async function loadPackages() {
  const allContainer = document.getElementById('allPackagesGrid');
  if (!allContainer) return;

  allContainer.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin fa-2x text-gold"></i><p>Loading safari packages...</p></div>';

  try {
    const packages = await window.CyrooDB.getPackages();
    window.allSafariPackages = packages; // Store globally for filtering

    renderPackagesGrid(packages);

    // If URL contains package param, preselect after packages load
    const urlParams = new URLSearchParams(window.location.search);
    const pkgParam = urlParams.get('package') || urlParams.get('pkg');
    if (pkgParam) {
      window.selectPackageAndBook(pkgParam);
    }
  } catch (err) {
    console.error("Error loading packages:", err);
  }
}

// Render Packages Helper Function
function renderPackagesGrid(packages, categoryFilter = 'all') {
  const allContainer = document.getElementById('allPackagesGrid');
  const selectDropdown = document.getElementById('bookingPackageSelect');

  if (selectDropdown) {
    selectDropdown.innerHTML = '<option value="">-- Select Safari Package --</option>';

    // Filter out Airport Services - Keep only Safari Packages in Safari Selection dropdown
    const safariPackages = packages.filter(pkg => pkg.category !== 'Airport Services');

    safariPackages.forEach(pkg => {
      const opt = document.createElement('option');
      opt.value = pkg.id;
      opt.dataset.price = pkg.price;
      opt.dataset.priceChild = pkg.price_child || Math.round(pkg.price * 0.5);
      opt.dataset.name = pkg.name;
      opt.dataset.days = pkg.days;
      opt.dataset.destination = pkg.destination;
      opt.textContent = `${pkg.name} (${pkg.days} Day${pkg.days > 1 ? 's':''}) - $${Number(pkg.price).toLocaleString()} / person`;
      selectDropdown.appendChild(opt);
    });
  }

  // Populate Airport Transfer Service Option dropdown dynamically from Airport Packages
  const airportServiceDropdown = document.getElementById('bookingAirportService');
  if (airportServiceDropdown) {
    const currentVal = airportServiceDropdown.value;
    airportServiceDropdown.innerHTML = '<option value="No Airport Transfer" data-fee="0">No Airport Service Needed</option>';
    const airportPkgs = packages.filter(p => p.category === 'Airport Services');

    if (airportPkgs.length > 0) {
      airportPkgs.forEach(pkg => {
        const opt = document.createElement('option');
        opt.value = pkg.name;
        opt.dataset.fee = pkg.price;
        opt.textContent = `${pkg.name} (+ $${Number(pkg.price).toLocaleString()})`;
        airportServiceDropdown.appendChild(opt);
      });
    } else {
      const defaultServices = [
        { name: "JKIA Airport Arrival Pickup & Hotel Transfer", price: 30 },
        { name: "Nairobi Hotel to JKIA Departure Drop-off", price: 30 },
        { name: "Both JKIA Airport Pickup & Drop-off Transfer", price: 55 },
        { name: "Wilson Airport Safari Bush Flight Connection", price: 25 },
        { name: "VIP Luxury Executive Airport Chauffeur", price: 80 }
      ];
      defaultServices.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.dataset.fee = s.price;
        opt.textContent = `${s.name} (+ $${Number(s.price).toLocaleString()})`;
        airportServiceDropdown.appendChild(opt);
      });
    }

    // Preserve selected value if valid
    if (currentVal && Array.from(airportServiceDropdown.options).some(o => o.value === currentVal)) {
      airportServiceDropdown.value = currentVal;
    }
  }

  // Populate optional airport transfer add-on dropdown for safari bookings
  const safariAddonDropdown = document.getElementById('bookingSafariAirportAddon');
  if (safariAddonDropdown) {
    const currentAddonVal = safariAddonDropdown.value;
    safariAddonDropdown.innerHTML = '<option value="No Airport Transfer" data-fee="0">No Airport Add-On Needed</option>';
    const airportPkgs = packages.filter(p => p.category === 'Airport Services');

    if (airportPkgs.length > 0) {
      airportPkgs.forEach(pkg => {
        const opt = document.createElement('option');
        opt.value = pkg.name;
        opt.dataset.fee = pkg.price;
        opt.textContent = `${pkg.name} (+ $${Number(pkg.price).toLocaleString()})`;
        safariAddonDropdown.appendChild(opt);
      });
    } else {
      const defaultServices = [
        { name: "JKIA Airport Arrival Pickup & Hotel Transfer", price: 30 },
        { name: "Nairobi Hotel to JKIA Departure Drop-off", price: 30 },
        { name: "Both JKIA Airport Pickup & Drop-off Transfer", price: 55 },
        { name: "Wilson Airport Safari Bush Flight Connection", price: 25 },
        { name: "VIP Luxury Executive Airport Chauffeur", price: 80 }
      ];
      defaultServices.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.dataset.fee = s.price;
        opt.textContent = `${s.name} (+ $${Number(s.price).toLocaleString()})`;
        safariAddonDropdown.appendChild(opt);
      });
    }

    if (currentAddonVal && Array.from(safariAddonDropdown.options).some(o => o.value === currentAddonVal)) {
      safariAddonDropdown.value = currentAddonVal;
    }
  }

  if (allContainer) allContainer.innerHTML = '';

  const filtered = categoryFilter === 'all' 
    ? packages 
    : packages.filter(p => (p.category || '').toLowerCase() === categoryFilter.toLowerCase());

  const displayList = categoryFilter === 'all' ? packages : filtered;

  if (displayList.length === 0 && allContainer) {
    allContainer.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem; color:#888;"><h3>No packages found in this category</h3></div>';
    return;
  }

  displayList.forEach((pkg) => {
    const isAirport = pkg.category === 'Airport Services';
    const badgeIcon = isAirport ? 'fa-plane' : 'fa-sun';
    const badgeText = isAirport ? 'VIP TRANSFER' : `${pkg.days} Days / ${Math.max(1, pkg.days - 1)} Nights`;
    
    const cardHTML = `
      <div class="package-card" data-category="${pkg.category || 'Safari Parks'}">
        <div class="package-img-wrapper">
          <img src="${pkg.image_url}" alt="${pkg.name}" class="package-img" onerror="this.src='assets/download.jfif'">
          <span class="package-badge"><i class="fas ${badgeIcon}"></i> ${badgeText}</span>
        </div>
        <div class="package-content">
          <div class="package-destination"><i class="fas fa-map-marker-alt text-gold"></i> ${pkg.destination}</div>
          <h3 class="package-title">${pkg.name}</h3>
          <div class="package-meta">
            <div class="package-meta-item"><i class="fas ${isAirport ? 'fa-car-side' : 'fa-bus'} text-gold"></i> ${isAirport ? 'Executive Chauffeur' : '4x4 Landcruiser'}</div>
            <div class="package-meta-item"><i class="fas ${isAirport ? 'fa-shield-alt' : 'fa-hotel'} text-gold"></i> ${isAirport ? 'Flight Tracking' : 'Luxury Lodge'}</div>
          </div>
          <p class="package-description">${pkg.description}</p>
          <div class="package-footer">
            <div class="package-price">
              <span class="price-label">Starting From</span>
              <span class="price-val">$${Number(pkg.price).toLocaleString()} <span>/ person</span></span>
            </div>
            <div style="display:flex; gap:0.5rem;">
              <button class="btn btn-outline-gold btn-sm" onclick="openPackageModal('${pkg.id}')">
                <i class="fas fa-eye"></i> Details
              </button>
              <button class="btn btn-gold btn-sm" onclick="selectPackageAndBook('${pkg.id}')">
                <i class="fas fa-calendar-check"></i> Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Append to all packages container on dedicated Packages page
    if (allContainer) {
      allContainer.insertAdjacentHTML('beforeend', cardHTML);
    }
  });
}

// Package Filter Tabs Handler
function initPackageCategoryFilters() {
  const filterBtns = document.querySelectorAll('.pkg-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('btn-gold', 'active');
        b.classList.add('btn-outline-gold');
      });
      btn.classList.remove('btn-outline-gold');
      btn.classList.add('btn-gold', 'active');

      const cat = btn.dataset.cat;
      renderPackagesGrid(window.allSafariPackages || [], cat);
    });
  });
}

// Render Destinations
window.loadDestinations = async function loadDestinations() {
  const grid = document.getElementById('destinationsContainer');
  const allGrid = document.getElementById('allDestinationsGrid');
  if (!grid && !allGrid) return;

  try {
    const destinations = await window.CyrooDB.getDestinations();
    if (grid) grid.innerHTML = '';
    if (allGrid) allGrid.innerHTML = '';

    destinations.forEach(dest => {
      const safeName = (dest.name || '').replace(/'/g, "\\'");
      const cardHTML = `
        <div class="destination-card" onclick="openDestinationPackages('${safeName}')">
          <img src="${dest.image_url}" alt="${dest.name}" class="destination-img" onerror="this.src='assets/download (1).jfif'">
          <div class="destination-overlay">
            <span class="destination-count"><i class="fas fa-compass text-gold"></i> ${dest.location || 'Kenya'}</span>
            <h3 class="destination-title">${dest.name}</h3>
            <p class="destination-tagline">${dest.tagline || 'Kenya Wild Excursion'}</p>
          </div>
        </div>
      `;
      if (grid) grid.insertAdjacentHTML('beforeend', cardHTML);
      if (allGrid) allGrid.insertAdjacentHTML('beforeend', cardHTML);
    });
  } catch (e) {
    console.error("Error loading destinations:", e);
  }
}

// Open Package Details Modal
window.openPackageModal = async function(packageId) {
  const packages = await window.CyrooDB.getPackages();
  const pkg = packages.find(p => p.id === packageId);
  if (!pkg) return;

  const modal = document.getElementById('packageDetailModal');
  const modalBody = document.getElementById('packageModalContent');

  const includedList = (pkg.whats_included || []).map(item => `<li><i class="fas fa-check-circle text-gold"></i> ${item}</li>`).join('');
  const excludedList = (pkg.whats_excluded || []).map(item => `<li><i class="fas fa-times-circle text-danger"></i> ${item}</li>`).join('');

  modalBody.innerHTML = `
    <div style="position:relative; height:280px; margin:-2rem -2rem 1.5rem -2rem; overflow:hidden;">
      <img src="${pkg.image_url}" style="width:100%; height:100%; object-fit:cover;">
      <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(8,28,21,0.9), transparent);"></div>
      <div style="position:absolute; bottom:1.5rem; left:2rem; color:#fff;">
        <span class="badge badge-confirmed" style="background:var(--gold-accent); color:#000; font-weight:700;">${pkg.days} DAYS / ${Math.max(1, pkg.days - 1)} NIGHTS</span>
        <h2 style="font-size:2rem; color:#fff; margin-top:0.5rem;">${pkg.name}</h2>
        <p style="color:var(--gold-accent);"><i class="fas fa-map-marker-alt"></i> ${pkg.destination}</p>
      </div>
    </div>

    <p style="font-size:1.05rem; color:#444; line-height:1.7; margin-bottom:1.5rem;">${pkg.description}</p>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1.25rem; margin-bottom:1.5rem; background:var(--warm-beige); padding:1.25rem; border-radius:var(--radius-md);">
      <div><strong style="color:var(--primary-green-dark);"><i class="fas fa-hotel text-gold"></i> Accommodation:</strong><br>${pkg.accommodation_info || 'Luxury Lodge / Safari Camp'}</div>
      <div><strong style="color:var(--primary-green-dark);"><i class="fas fa-bus text-gold"></i> Transport:</strong><br>${pkg.transport_info || '4x4 Safari Landcruiser with Pop-Up Roof'}</div>
      <div><strong style="color:var(--primary-green-dark);"><i class="fas fa-utensils text-gold"></i> Meals Included:</strong><br>${pkg.meals_info || 'Full Board (Breakfast, Lunch & Dinner)'}</div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-bottom:2rem;">
      <div>
        <h4 style="color:var(--primary-green); margin-bottom:0.75rem;"><i class="fas fa-check-circle text-gold"></i> What's Included</h4>
        <ul style="line-height:2; font-size:0.9rem;">${includedList || '<li>All game drives</li><li>Park fees</li><li>Guide services</li>'}</ul>
      </div>
      <div>
        <h4 style="color:#a94442; margin-bottom:0.75rem;"><i class="fas fa-times-circle"></i> What's Excluded</h4>
        <ul style="line-height:2; font-size:0.9rem;">${excludedList || '<li>Tips & gratuities</li><li>International flights</li>'}</ul>
      </div>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--primary-green-dark); color:#fff; padding:1.25rem; border-radius:var(--radius-md);">
      <div>
        <span style="font-size:0.85rem; color:var(--warm-beige-dark);">Adult Rate:</span>
        <div style="font-family:var(--font-heading); font-size:1.6rem; color:var(--gold-accent); font-weight:800;">$${Number(pkg.price).toLocaleString()}</div>
      </div>
      <button class="btn btn-gold" onclick="selectPackageAndBook('${pkg.id}')">
        <i class="fas fa-calendar-check"></i> Book This Safari Now
      </button>
    </div>
  `;

  modal.classList.add('active');
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
};

// Global Booking Mode Tracker ('safari' | 'airport')
window.currentBookingMode = 'safari';

// Switcher between Safari Package Booking and Standalone Airport Transfer Booking
window.switchBookingType = function(type) {
  const safariBtn = document.getElementById('bookingTabSafariBtn');
  const airportBtn = document.getElementById('bookingTabAirportBtn');
  const safariBlock = document.getElementById('safariBookingBlock');
  const airportBlock = document.getElementById('airportBookingBlock');
  const packageSelect = document.getElementById('bookingPackageSelect');

  if (type === 'safari') {
    if (safariBtn) safariBtn.className = 'btn btn-gold booking-type-btn active';
    if (airportBtn) airportBtn.className = 'btn btn-outline-gold booking-type-btn';
    if (safariBlock) safariBlock.style.display = 'block';
    if (airportBlock) airportBlock.style.display = 'none';
    if (packageSelect) packageSelect.required = true;
    window.currentBookingMode = 'safari';
  } else {
    if (safariBtn) safariBtn.className = 'btn btn-outline-gold booking-type-btn';
    if (airportBtn) airportBtn.className = 'btn btn-gold booking-type-btn active';
    if (safariBlock) safariBlock.style.display = 'none';
    if (airportBlock) airportBlock.style.display = 'block';
    if (packageSelect) {
      packageSelect.required = false;
      packageSelect.value = '';
    }
    window.currentBookingMode = 'airport';
  }

  if (window.updatePriceSummary) window.updatePriceSummary();
};

// Directly Connect Package Selection with Book a Safari / Airport Form
window.selectPackageAndBook = function(pkgId) {
  closeModal('packageDetailModal');
  const packages = window.allSafariPackages || [];
  const targetPkg = packages.find(p => p.id === pkgId);

  if (targetPkg && targetPkg.category === 'Airport Services') {
    window.switchBookingType('airport');
    const airportSelect = document.getElementById('bookingAirportService');
    if (airportSelect) {
      airportSelect.value = targetPkg.name;
      airportSelect.dispatchEvent(new Event('change'));
    }
  } else {
    window.switchBookingType('safari');
    const select = document.getElementById('bookingPackageSelect');
    if (select) {
      select.value = pkgId;
      select.dispatchEvent(new Event('change'));
    }
  }
  // Navigate to book tab
  if (window.navigateToTab) window.navigateToTab('book');
};

window.openDestinationPackages = function(destName) {
  window.switchBookingType('safari');
  const select = document.getElementById('bookingPackageSelect');
  if (select) {
    for (let opt of select.options) {
      if (opt.dataset.destination === destName) {
        select.value = opt.value;
        select.dispatchEvent(new Event('change'));
        break;
      }
    }
  }
  if (window.navigateToTab) window.navigateToTab('book');
};

// Booking Form Logic & Interactive Dynamic Price Calculation
function initBookingForm() {
  const form = document.getElementById('customerBookingForm');
  const packageSelect = document.getElementById('bookingPackageSelect');
  const adultsInput = document.getElementById('bookingAdults');
  const childrenInput = document.getElementById('bookingChildren');
  const travelDateInput = document.getElementById('bookingTravelDate');
  const returnDateInput = document.getElementById('bookingReturnDate');
  const safariAddonSelect = document.getElementById('bookingSafariAirportAddon');
  const vehicleSelect = document.getElementById('bookingTransport');
  const airportSelect = document.getElementById('bookingAirportService');
  const airportPassengersInput = document.getElementById('bookingAirportPassengers');
  const airportDateInput = document.getElementById('bookingAirportDate');
  const airportTimeInput = document.getElementById('bookingAirportTime');

  if (!form) return;

  // Set default travel and airport transfer dates to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];
  if (travelDateInput) travelDateInput.value = defaultDateStr;
  if (airportDateInput) airportDateInput.value = defaultDateStr;

  if (travelDateInput && airportDateInput) {
    travelDateInput.addEventListener('change', () => {
      if (!airportDateInput.value) airportDateInput.value = travelDateInput.value;
    });
  }

  function updatePriceSummary() {
    const isSafariMode = window.currentBookingMode === 'safari';
    const selectedOpt = packageSelect ? packageSelect.options[packageSelect.selectedIndex] : null;
    const hasSafariPkg = isSafariMode && selectedOpt && selectedOpt.value && selectedOpt.value !== "";

    const adultPrice = hasSafariPkg ? parseInt(selectedOpt?.dataset?.price || 0) : 0;
    const childPrice = hasSafariPkg ? parseInt(selectedOpt?.dataset?.priceChild || (adultPrice * 0.5)) : 0;
    const adults = parseInt(adultsInput?.value || 1);
    const children = parseInt(childrenInput?.value || 0);
    const days = hasSafariPkg ? parseInt(selectedOpt?.dataset?.days || 1) : 1;

    // Automatically set return date based on days
    if (travelDateInput && travelDateInput.value) {
      const startDate = new Date(travelDateInput.value);
      startDate.setDate(startDate.getDate() + (days - 1));
      if (returnDateInput) returnDateInput.value = startDate.toISOString().split('T')[0];
    }

    // Vehicle Surcharge calculation
    let vehicleSurcharge = 0;
    if (vehicleSelect && vehicleSelect.value.includes('Landcruiser VIP')) {
      vehicleSurcharge = 150;
    }

    // Airport Service Fee calculation
    let airportFee = 0;
    let airportText = "No Airport Service";

    if (isSafariMode) {
      const addonOpt = safariAddonSelect ? safariAddonSelect.options[safariAddonSelect.selectedIndex] : null;
      if (addonOpt && safariAddonSelect.value) {
        airportFee = parseInt(addonOpt.dataset.fee || 0);
        airportText = safariAddonSelect.value;
      }
    } else {
      const airportOpt = airportSelect ? airportSelect.options[airportSelect.selectedIndex] : null;
      if (airportOpt && airportSelect.value) {
        airportFee = parseInt(airportOpt.dataset.fee || 0);
        airportText = airportSelect.value;
      }
    }

    const safariTotal = isSafariMode ? ((adults * adultPrice) + (children * childPrice)) : 0;
    const totalAmount = safariTotal + vehicleSurcharge + airportFee;

    // Update UI summary
    let summaryPkgTitle = "Select a package or transfer";
    if (isSafariMode && hasSafariPkg) {
      summaryPkgTitle = selectedOpt.dataset.name;
    } else if (!isSafariMode && airportText !== "No Airport Transfer") {
      summaryPkgTitle = `${airportText} (Airport Service Only)`;
    }

    document.getElementById('summaryPkgName').textContent = summaryPkgTitle;
    document.getElementById('summaryAdults').textContent = isSafariMode && hasSafariPkg ? `${adults} x $${adultPrice.toLocaleString()}` : '0 (No Safari)';
    document.getElementById('summaryChildren').textContent = isSafariMode && hasSafariPkg ? `${children} x $${childPrice.toLocaleString()}` : '0';
    document.getElementById('summaryAirport').textContent = airportFee > 0 ? `$${airportFee.toLocaleString()}` : 'No Airport Service';
    document.getElementById('summaryTotal').textContent = `$${totalAmount.toLocaleString()}`;

    const submitTotalSpan = document.getElementById('submitBtnTotal');
    if (submitTotalSpan) {
      submitTotalSpan.textContent = `$${totalAmount.toLocaleString()}`;
    }
  }
  window.updatePriceSummary = updatePriceSummary;

  [packageSelect, adultsInput, childrenInput, travelDateInput, vehicleSelect, airportSelect, safariAddonSelect, airportPassengersInput, airportDateInput, airportTimeInput].forEach(el => {
    if (el) el.addEventListener('change', updatePriceSummary);
    if (el) el.addEventListener('input', updatePriceSummary);
  });

  // Form Submit Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isSafariMode = window.currentBookingMode === 'safari';
    const selectedOpt = packageSelect ? packageSelect.options[packageSelect.selectedIndex] : null;
    const hasSafariPkg = isSafariMode && selectedOpt && selectedOpt.value && selectedOpt.value !== "";

    let airportFee = 0;
    let airportText = "No Airport Transfer";

    if (isSafariMode) {
      const addonOpt = safariAddonSelect ? safariAddonSelect.options[safariAddonSelect.selectedIndex] : null;
      if (addonOpt && safariAddonSelect.value) {
        airportFee = parseInt(addonOpt.dataset.fee || 0);
        airportText = safariAddonSelect.value;
      }
    } else {
      const airportOpt = airportSelect ? airportSelect.options[airportSelect.selectedIndex] : null;
      if (airportOpt && airportSelect.value) {
        airportFee = parseInt(airportOpt.dataset.fee || 0);
        airportText = airportSelect.value;
      }
    }

    if (isSafariMode && !hasSafariPkg) {
      alert("Please select a Safari Package to continue.");
      return;
    }

    if (!isSafariMode && (airportText === "No Airport Transfer" || !airportSelect.value)) {
      alert("Please select an Airport Transfer Service to continue.");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Booking...';

    const adultPrice = isSafariMode && hasSafariPkg ? parseInt(selectedOpt.dataset.price || 0) : 0;
    const childPrice = isSafariMode && hasSafariPkg ? parseInt(selectedOpt.dataset.priceChild || (adultPrice * 0.5)) : 0;
    const adults = parseInt(adultsInput.value || 1);
    const children = parseInt(childrenInput.value || 0);
    const airportPax = parseInt(airportPassengersInput?.value || 2);

    let vehicleSurcharge = 0;
    if (vehicleSelect && vehicleSelect.value.includes('Landcruiser VIP')) {
      vehicleSurcharge = 150;
    }

    const safariTotal = isSafariMode ? ((adults * adultPrice) + (children * childPrice)) : 0;
    const totalAmount = safariTotal + vehicleSurcharge + airportFee;

    const airportDetailsText = (airportText !== "No Airport Transfer")
      ? `${airportText} (${isSafariMode ? adults : airportPax} Pax on ${isSafariMode ? travelDateInput.value : (airportDateInput?.value || travelDateInput.value)} at ${airportTimeInput?.value || '08:00'})`
      : "No Airport Transfer";

    const bookingPayload = {
      full_name: document.getElementById('bookingFullName').value,
      phone: document.getElementById('bookingPhone').value,
      email: document.getElementById('bookingEmail').value,
      package_id: isSafariMode ? packageSelect.value : "pkg-airport-standalone",
      package_name: isSafariMode ? selectedOpt.dataset.name : `${airportText} (Airport Transfer Only)`,
      destination_name: isSafariMode ? (selectedOpt.dataset.destination || "Kenya Safari Park") : "Nairobi JKIA & Airports",
      travel_date: isSafariMode ? travelDateInput.value : (airportDateInput?.value || travelDateInput.value),
      return_date: isSafariMode ? returnDateInput.value : (airportDateInput?.value || travelDateInput.value),
      adults: isSafariMode ? adults : airportPax,
      children: isSafariMode ? children : 0,
      accommodation: isSafariMode ? "Safari Lodge" : "N/A - Direct Transfer",
      transport: vehicleSelect ? vehicleSelect.value : "4x4 Safari Landcruiser",
      airport_service: airportDetailsText,
      special_requests: document.getElementById('bookingSpecialRequests').value,
      safari_fee: safariTotal,
      airport_fee: airportFee,
      vehicle_surcharge: vehicleSurcharge,
      total_amount: totalAmount
    };

    try {
      const booking = await window.CyrooDB.createBooking(bookingPayload);

      // Trigger WhatsApp Notification
      sendAdminWhatsAppAlert(booking);

      // Show Confirmation Modal & Printable PDF Invoice
      showBookingConfirmationModal(booking);

      form.reset();
      updatePriceSummary();
    } catch (err) {
      alert("Booking Error: " + (err.message || "Could not complete booking. Please try again."));
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

// Build Detailed WhatsApp Message for Safari / Airport Bookings
window.buildWhatsAppBookingMessage = function(booking) {
  if (!booking) return '';

  const isAirportOnly = (booking.package_id === 'pkg-airport-standalone') || 
                        (booking.package_name || '').includes('(Airport Transfer Only)') ||
                        (booking.destination_name === 'Nairobi JKIA & Airports');

  const travelersText = (booking.children && Number(booking.children) > 0) 
    ? `${booking.adults || 1} Adults, ${booking.children} Children` 
    : `${booking.adults || 1} Pax`;

  let msg = `🦁 *CYROO TOURS & SAFARI - BOOKING RESERVATION* ✈️\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📌 *Booking Ref:* ${booking.booking_reference}\n`;
  msg += `👤 *Guest Name:* ${booking.customer_name}\n`;
  msg += `📞 *Phone:* ${booking.customer_phone}\n`;
  if (booking.customer_email) msg += `📧 *Email:* ${booking.customer_email}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📋 *BOOKED SERVICE DETAILS:*\n`;

  if (isAirportOnly) {
    msg += `• *Service Type:* ✈️ Standalone Airport Transfer\n`;
    msg += `• *Airport Service:* ${booking.airport_service || booking.package_name || 'Airport Transfer'}\n`;
    msg += `• *Route / Destination:* ${booking.destination || 'Nairobi JKIA / Wilson Airports'}\n`;
    msg += `• *Transfer Date:* ${booking.travel_date || 'As scheduled'}\n`;
    msg += `• *Passengers:* ${booking.adults || 1} Pax\n`;
    msg += `• *Vehicle Type:* ${booking.transport || 'Executive Vehicle'}\n`;
  } else {
    msg += `• *Service Type:* 🦁 Safari Package Expedition\n`;
    msg += `• *Safari Package:* ${booking.package_name || 'Kenyan Safari'}\n`;
    msg += `• *Destination:* ${booking.destination || booking.destination_name || 'Kenyan Game Reserve'}\n`;
    msg += `• *Travel Dates:* ${booking.travel_date || 'N/A'}${booking.return_date && booking.return_date !== booking.travel_date ? ` to ${booking.return_date}` : ''}\n`;
    msg += `• *Travelers:* ${travelersText}\n`;
    msg += `• *Safari Vehicle:* ${booking.transport || '4x4 Safari Landcruiser'}\n`;
    if (booking.airport_service && booking.airport_service !== 'No Airport Transfer' && booking.airport_service !== 'No Airport Service') {
      msg += `• *Airport Transfer Add-On:* ${booking.airport_service}\n`;
    }
  }

  if (booking.special_requests) {
    msg += `• *Flight / Special Notes:* ${booking.special_requests}\n`;
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💰 *TOTAL AMOUNT:* $${Number(booking.total_amount || 0).toLocaleString()}\n`;
  msg += `💳 *Status:* Pending Confirmation\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `Hello Cyroo Tours, I have just completed this booking on your website. Please confirm availability and send payment instructions. Thank you!`;

  return msg;
};

// Send WhatsApp for current active booking in modal
window.sendWhatsAppForCurrentBooking = function() {
  if (!window.currentModalBooking) {
    window.openQuickWhatsAppBooking();
    return;
  }
  const text = window.buildWhatsAppBookingMessage(window.currentModalBooking);
  const url = `https://wa.me/${window.CYROO_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

// Direct WhatsApp trigger for any given booking object
window.sendWhatsAppForBooking = function(booking) {
  if (!booking) return;
  const text = window.buildWhatsAppBookingMessage(booking);
  const url = `https://wa.me/${window.CYROO_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

// WhatsApp Admin Notification Sender
function sendAdminWhatsAppAlert(booking) {
  const text = encodeURIComponent(window.buildWhatsAppBookingMessage(booking));
  console.log(`WhatsApp Alert URL: https://wa.me/${window.CYROO_CONFIG.whatsappNumber}?text=${text}`);
}

// Show Confirmation Modal with Printable PDF Invoice
function showBookingConfirmationModal(booking) {
  window.currentModalBooking = booking;
  const modal = document.getElementById('bookingConfirmationModal');
  const container = document.getElementById('invoiceRenderArea');
  if (!modal || !container) return;

  const year = new Date().getFullYear();
  const invoiceNum = `INV-${year}-${booking.booking_reference.replace(/[^0-9]/g, '').slice(-4)}`;

  const hasSafari = booking.package_id !== 'pkg-airport-standalone' && !(booking.package_name || '').includes('(Airport Transfer Only)');
  const hasAirport = booking.airport_service && booking.airport_service !== 'No Airport Service' && booking.airport_service !== 'No Airport Transfer';
  const hasVIPVehicle = booking.transport && booking.transport.includes('Landcruiser VIP');

  let tableRowsHTML = '';
  
  if (hasSafari) {
    const safariFee = booking.safari_fee || (booking.total_amount - (hasAirport ? (booking.airport_fee || 30) : 0));
    const adultUnitPrice = booking.adults > 0 ? Math.round(safariFee / Math.max(1, (booking.adults + (booking.children * 0.5)))) : 0;
    tableRowsHTML += `
      <tr>
        <td>
          <strong>${booking.package_name}</strong><br>
          <small style="color:#666;">Accommodation: ${booking.accommodation || 'Safari Lodge'} | Vehicle: ${booking.transport}</small>
        </td>
        <td>${booking.adults} Adults</td>
        <td style="text-align:right;">$${adultUnitPrice.toLocaleString()}</td>
        <td style="text-align:right;">$${(adultUnitPrice * booking.adults).toLocaleString()}</td>
      </tr>
    `;
    if (booking.children > 0) {
      const childUnitPrice = Math.round(adultUnitPrice * 0.5);
      tableRowsHTML += `
        <tr>
          <td>Child Safari Rate (50% Discount)</td>
          <td>${booking.children} Children</td>
          <td style="text-align:right;">$${childUnitPrice.toLocaleString()}</td>
          <td style="text-align:right;">$${(childUnitPrice * booking.children).toLocaleString()}</td>
        </tr>
      `;
    }
  }

  if (hasAirport) {
    const fee = booking.airport_fee || (hasSafari ? 30 : booking.total_amount);
    tableRowsHTML += `
      <tr>
        <td>
          <strong><i class="fas fa-plane-arrival text-gold"></i> Airport Transfer Service</strong><br>
          <small style="color:#666;">${booking.airport_service}</small>
        </td>
        <td>1 Transfer Service</td>
        <td style="text-align:right;">$${Number(fee).toLocaleString()}</td>
        <td style="text-align:right;">$${Number(fee).toLocaleString()}</td>
      </tr>
    `;
  }

  if (hasVIPVehicle) {
    tableRowsHTML += `
      <tr>
        <td>
          <strong>4x4 Landcruiser VIP Edition Upgrade</strong><br>
          <small style="color:#666;">Executive Luxury Vehicle Upgrade</small>
        </td>
        <td>1 Vehicle Upgrade</td>
        <td style="text-align:right;">$150</td>
        <td style="text-align:right;">$150</td>
      </tr>
    `;
  }

  container.innerHTML = `
    <div class="invoice-sheet" id="invoicePDFSheet">
      <div class="invoice-header">
        <div class="invoice-company">
          <div class="invoice-logo">
            <img src="assets/1-removebg-preview.png" alt="CYROO TOURS & SAFARI" style="height:95px; margin-bottom:0.5rem;">
          </div>
          <p style="font-size:0.85rem; color:#666;">Explore Kenya. Experience the Wild.</p>
          <p style="font-size:0.85rem; margin-top:0.4rem; color:#444;">
            <i class="fas fa-phone text-gold"></i> Phone: 0726072607 / 0733185018<br>
            <i class="fas fa-envelope text-gold"></i> Email: cyrootourssafari@gmail.com<br>
            <i class="fas fa-map-marker-alt text-gold"></i> Location: Nairobi, Kenya
          </p>
        </div>
        <div class="invoice-details">
          <div class="invoice-number">${invoiceNum}</div>
          <p style="font-size:0.9rem;"><strong>Booking Ref:</strong> <span class="text-gold" style="font-weight:700;">${booking.booking_reference}</span></p>
          <p style="font-size:0.85rem; color:#666;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <span class="badge badge-pending" style="margin-top:0.5rem;">BOOKING PENDING CONFIRMATION</span>
        </div>
      </div>

      <div class="invoice-grid">
        <div>
          <strong style="color:var(--primary-green-dark); text-transform:uppercase; font-size:0.8rem; letter-spacing:1px;">CUSTOMER DETAILS</strong>
          <p style="margin-top:0.4rem;"><strong>Name:</strong> ${booking.customer_name}</p>
          <p><strong>Phone:</strong> ${booking.customer_phone}</p>
          <p style="word-break:break-all;"><strong>Email:</strong> ${booking.customer_email}</p>
        </div>
        <div>
          <strong style="color:var(--primary-green-dark); text-transform:uppercase; font-size:0.8rem; letter-spacing:1px;">SERVICE & TRAVEL DETAILS</strong>
          <p style="margin-top:0.4rem;"><strong>Destination / Route:</strong> ${booking.destination || 'Kenyan Reserve / Nairobi'}</p>
          <p><strong>Travel / Service Date:</strong> ${booking.travel_date}</p>
          <p><strong>Travelers:</strong> ${booking.adults} Adults${booking.children > 0 ? `, ${booking.children} Children` : ''}</p>
        </div>
      </div>

      <div class="invoice-table-wrapper">
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Item Description</th>
              <th>Qty</th>
              <th style="text-align:right;">Unit Price ($)</th>
              <th style="text-align:right;">Total ($)</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHTML}
          </tbody>
        </table>
      </div>

      <div class="invoice-totals">
        <div class="invoice-totals-row">
          <span>Subtotal:</span>
          <span>$${Number(booking.total_amount).toLocaleString()}</span>
        </div>
        <div class="invoice-totals-row">
          <span>Discount:</span>
          <span>$0</span>
        </div>
        <div class="invoice-totals-row grand-total">
          <span>Total Payable:</span>
          <span>$${Number(booking.total_amount).toLocaleString()}</span>
        </div>
        <div class="invoice-totals-row">
          <span>Amount Paid:</span>
          <span style="color:#28a745; font-weight:700;">$${Number(booking.amount_paid || 0).toLocaleString()}</span>
        </div>
        <div class="invoice-totals-row">
          <span>Balance Due:</span>
          <span style="color:#dc3545; font-weight:700;">$${Number(booking.balance || booking.total_amount).toLocaleString()}</span>
        </div>
      </div>

      <div style="margin-top:2.5rem; padding-top:1.5rem; border-top:1px dashed #ccc; font-size:0.85rem; color:#666; display:flex; justify-content:space-between;">
        <div>
          <strong>Payment Method Options:</strong><br>
          M-Pesa Buy Goods Till / Paybill: Contact 0726072607<br>
          Bank Wire Transfer: Cyroo Tours & Safari KCB Bank
        </div>
        <div style="text-align:right;">
          <strong style="color:var(--primary-green-dark);">Thank you for choosing Cyroo Tours & Safari!</strong><br>
          We look forward to hosting your Kenyan Safari Experience.
        </div>
      </div>
    </div>
  `;

  // Store booking reference for PDF export
  modal.dataset.bookingRef = booking.booking_reference;
  modal.classList.add('active');
}

// Download PDF Invoice Generator Function (Fixes Blank Page issue)
window.downloadInvoicePDF = function() {
  const element = document.getElementById('invoicePDFSheet');
  if (!element) {
    alert("Invoice element not found.");
    return;
  }

  if (window.html2pdf) {
    // Clone element into offscreen container to avoid scroll / modal clipping issues
    const clone = element.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0px';
    clone.style.width = '750px';
    clone.style.padding = '30px';
    clone.style.background = '#ffffff';
    clone.style.color = '#333333';
    
    // Ensure all grid columns in PDF clone display side-by-side (2 columns)
    const cloneGrid = clone.querySelector('.invoice-grid');
    if (cloneGrid) {
      cloneGrid.style.display = 'grid';
      cloneGrid.style.gridTemplateColumns = '1fr 1fr';
      cloneGrid.style.gap = '1.25rem';
    }

    document.body.appendChild(clone);

    const bookingRef = element.closest('.modal')?.dataset?.bookingRef || 'Invoice';
    const filename = `Cyroo_Safari_${bookingRef}_${Date.now()}.pdf`;

    const opt = {
      margin:       [0.3, 0.3, 0.3, 0.3],
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true, 
        scrollY: 0, 
        scrollX: 0,
        logging: false 
      },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(clone).save().then(() => {
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    }).catch(err => {
      console.error("PDF Export Error:", err);
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
      window.print();
    });
  } else {
    window.print();
  }
};

// "My Booking" Lookup Engine
function initBookingTracking() {
  const form = document.getElementById('trackBookingForm');
  const resultArea = document.getElementById('bookingTrackResult');
  if (!form || !resultArea) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ref = document.getElementById('trackRef').value;
    const phone = document.getElementById('trackPhone').value;

    resultArea.innerHTML = '<div style="text-align:center; padding:2rem;"><i class="fas fa-spinner fa-spin fa-2x text-gold"></i><p>Searching records...</p></div>';

    const booking = await window.CyrooDB.getBookingByRefAndPhone(ref, phone);

    if (!booking) {
      resultArea.innerHTML = `
        <div style="background:#fff3cd; color:#856404; padding:1.5rem; border-radius:var(--radius-md); text-align:center;">
          <i class="fas fa-exclamation-triangle fa-2x" style="margin-bottom:0.5rem;"></i>
          <h3>No Booking Found</h3>
          <p>Please double check your Booking Reference (e.g. <strong>CYR-2026-0001</strong>) and Phone Number (e.g. <strong>0712345678</strong>).</p>
        </div>
      `;
      return;
    }

    // Status Badges
    const statusClass = booking.booking_status === 'Confirmed' ? 'badge-confirmed' : (booking.booking_status === 'Cancelled' ? 'badge-cancelled' : 'badge-pending');
    const payClass = booking.payment_status === 'Paid' ? 'badge-paid' : (booking.payment_status === 'Partially Paid' ? 'badge-partially' : 'badge-pending');

    resultArea.innerHTML = `
      <div class="booking-card" style="margin-top:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:1rem; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
          <div>
            <span style="font-size:0.85rem; color:var(--text-muted);">BOOKING REFERENCE</span>
            <h2 style="color:var(--primary-green-dark);">${booking.booking_reference}</h2>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <span class="badge ${statusClass}">${booking.booking_status}</span>
            <span class="badge ${payClass}">${booking.payment_status}</span>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1.5rem; margin-bottom:2rem;">
          <div><strong style="color:var(--text-muted); font-size:0.8rem;">GUEST NAME</strong><p style="font-size:1.1rem; font-weight:700;">${booking.customer_name}</p></div>
          <div><strong style="color:var(--text-muted); font-size:0.8rem;">SAFARI PACKAGE</strong><p style="font-size:1.1rem; font-weight:700;">${booking.package_name}</p></div>
          <div><strong style="color:var(--text-muted); font-size:0.8rem;">DESTINATION</strong><p style="font-size:1.1rem; font-weight:700;">${booking.destination}</p></div>
          <div><strong style="color:var(--text-muted); font-size:0.8rem;">TRAVEL DATES</strong><p style="font-size:1.1rem; font-weight:700;">${booking.travel_date} to ${booking.return_date || 'N/A'}</p></div>
          ${booking.airport_service ? `<div><strong style="color:var(--text-muted); font-size:0.8rem;">AIRPORT SERVICE</strong><p style="font-size:1rem; font-weight:600; color:var(--primary-green-dark);"><i class="fas fa-plane"></i> ${booking.airport_service}</p></div>` : ''}
        </div>

        <div class="invoice-totals" style="background:var(--warm-beige); padding:1.5rem; border-radius:var(--radius-md); margin-bottom:2rem;">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
            <span>Total Price:</span>
            <strong>$${Number(booking.total_amount).toLocaleString()}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; color:#28a745;">
            <span>Amount Paid:</span>
            <strong>$${Number(booking.amount_paid || 0).toLocaleString()}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:1.2rem; font-weight:800; color:var(--primary-green-dark); border-top:1px solid #ddd; padding-top:0.5rem;">
            <span>Balance Due:</span>
            <span style="color:${booking.balance > 0 ? '#dc3545' : '#28a745'}">$${Number(booking.balance || (booking.total_amount - (booking.amount_paid||0))).toLocaleString()}</span>
          </div>
        </div>

        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
          <button class="btn btn-gold" onclick='showBookingConfirmationModal(${JSON.stringify(booking)})'>
            <i class="fas fa-file-invoice"></i> View / Download Invoice PDF
          </button>
          <button class="btn btn-whatsapp" onclick='sendWhatsAppForBooking(${JSON.stringify(booking)})'>
            <i class="fab fa-whatsapp"></i> Send Booking to WhatsApp
          </button>
        </div>
      </div>
    `;
  });
}

// Contact Form Handler
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    const msgData = {
      full_name: document.getElementById('contactName').value,
      email: document.getElementById('contactEmail').value,
      phone: document.getElementById('contactPhone').value,
      message: document.getElementById('contactMessage').value
    };

    try {
      await window.CyrooDB.saveContactMessage(msgData);
      alert("Thank you! Your message has been sent successfully. Our team will contact you shortly.");
      form.reset();
    } catch (e) {
      alert("Could not send message. Please try again.");
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
    }
  });
}

// Floating WhatsApp Pre-filled Quick Booking Handler
window.openQuickWhatsAppBooking = function(pkgName = '') {
  const text = encodeURIComponent(
    `Hello Cyroo Tours & Safari,\n\n` +
    `I would like to book a safari / airport service.\n\n` +
    `Name:\n` +
    `Package / Service: ${pkgName || 'Maasai Mara / JKIA Airport Transfer'}\n` +
    `Travel Date:\n` +
    `Number of People:\n\n` +
    `Please assist me with the booking.`
  );
  window.open(`https://wa.me/${window.CYROO_CONFIG.whatsappNumber}?text=${text}`, '_blank');
};
