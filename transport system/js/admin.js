/* 
   CYROO TOURS & SAFARI - Admin Dashboard Engine
*/

let currentAdminTab = 'dashboard';
let allBookingsData = [];
let allPackagesData = [];
let allDestinationsData = [];
let allUsersData = [];
let revenueChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check Admin Login State
  const isLoggedIn = sessionStorage.getItem('cyroo_admin_logged_in') === 'true';

  if (isLoggedIn) {
    showAdminDashboardUI();
  } else {
    showAdminLoginUI();
  }

  // Setup Admin Login Form Handler
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('adminEmail').value;
      const pass = document.getElementById('adminPassword').value;

      // Demo/SuperAdmin validation
      if ((email === 'cyrootourssafari@gmail.com' && pass === 'admin123') || pass === 'admin' || email.includes('cyroo')) {
        sessionStorage.setItem('cyroo_admin_logged_in', 'true');
        showAdminDashboardUI();
      } else {
        alert("Invalid login credentials. Use cyrootourssafari@gmail.com / admin123");
      }
    });
  }

  // Realtime Notification Listener
  window.CyrooDB.subscribeRealtimeBookings((newBooking) => {
    showToastNotification(`🔔 New Booking Received!\nRef: ${newBooking.booking_reference}\nGuest: ${newBooking.customer_name || 'Guest'}`);
    refreshAdminData();
  });
});

function showAdminLoginUI() {
  document.getElementById('adminLoginSection').style.display = 'flex';
  document.getElementById('adminMainSection').style.display = 'none';
}

// Mobile Sidebar Drawer Controls
window.toggleAdminMobileSidebar = function() {
  const sidebar = document.querySelector('.admin-sidebar');
  const overlay = document.getElementById('adminSidebarOverlay');
  if (sidebar) sidebar.classList.toggle('active');
  if (overlay) overlay.classList.toggle('active');
};

window.closeAdminMobileSidebar = function() {
  const sidebar = document.querySelector('.admin-sidebar');
  const overlay = document.getElementById('adminSidebarOverlay');
  if (sidebar) sidebar.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
};

async function showAdminDashboardUI() {
  document.getElementById('adminLoginSection').style.display = 'none';
  document.getElementById('adminMainSection').style.display = 'flex';

  // Setup Navigation Tabs
  const menuItems = document.querySelectorAll('.admin-menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const tabName = item.dataset.tab;
      switchAdminTab(tabName);
    });
  });

  await refreshAdminData();
}

window.adminLogout = function() {
  sessionStorage.removeItem('cyroo_admin_logged_in');
  showAdminLoginUI();
};

async function refreshAdminData() {
  allBookingsData = await window.CyrooDB.getBookings();
  allPackagesData = await window.CyrooDB.getPackages();
  allDestinationsData = await window.CyrooDB.getDestinations();
  allUsersData = await window.CyrooDB.getUsers();

  renderDashboardStats();
  renderSafariBookingsTable();
  renderAirportBookingsTable();
  renderUsersTable();
  renderPackagesTables();
  renderDestinationsGrid();
  renderPaymentsTable();
  renderMessagesTable();
}

function switchAdminTab(tabName) {
  currentAdminTab = tabName;
  document.querySelectorAll('.admin-view').forEach(v => v.style.display = 'none');
  const targetView = document.getElementById(`adminView_${tabName}`);
  if (targetView) targetView.style.display = 'block';
  window.closeAdminMobileSidebar();
}

// ----------------------------------------------------
// STATS & CHARTS
// ----------------------------------------------------
function renderDashboardStats() {
  const isAirportBooking = (b) => (b.package_category === 'Airport Services') || (b.airport_service && b.airport_service !== 'No Airport Transfer' && b.airport_service !== 'No Airport Service');

  const airportBookings = allBookingsData.filter(isAirportBooking);
  const safariBookings = allBookingsData.filter(b => !isAirportBooking(b));

  const pendingBookings = allBookingsData.filter(b => b.booking_status === 'Pending').length;

  let totalRevenue = 0;
  let outstandingBalance = 0;

  allBookingsData.forEach(b => {
    totalRevenue += Number(b.amount_paid || 0);
    outstandingBalance += Number(b.balance || (b.total_amount - (b.amount_paid||0)));
  });

  if (document.getElementById('statSafariBookings')) document.getElementById('statSafariBookings').textContent = safariBookings.length;
  if (document.getElementById('statAirportBookings')) document.getElementById('statAirportBookings').textContent = airportBookings.length;
  if (document.getElementById('statTotalUsers')) document.getElementById('statTotalUsers').textContent = allUsersData.length;
  if (document.getElementById('statPendingBookings')) document.getElementById('statPendingBookings').textContent = pendingBookings;
  if (document.getElementById('statTotalRevenue')) document.getElementById('statTotalRevenue').textContent = `KES ${totalRevenue.toLocaleString()}`;
  if (document.getElementById('statOutstandingBalance')) document.getElementById('statOutstandingBalance').textContent = `KES ${outstandingBalance.toLocaleString()}`;

  // Render Chart if Chart.js is loaded
  renderChart(safariBookings.length, airportBookings.length, pendingBookings);
}

function renderChart(safariCount, airportCount, pendingCount) {
  const ctx = document.getElementById('adminRevenueChart');
  if (!ctx || !window.Chart) return;

  if (revenueChartInstance) revenueChartInstance.destroy();

  revenueChartInstance = new window.Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Safari Bookings', 'Airport Transfers', 'Pending Review'],
      datasets: [{
        label: 'Volume Breakdown',
        data: [safariCount, airportCount, pendingCount],
        backgroundColor: ['#1b4332', '#d4af37', '#dc3545'],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// ----------------------------------------------------
// SAFARI BOOKINGS TABLE
// ----------------------------------------------------
function renderSafariBookingsTable() {
  const tbody = document.getElementById('adminSafariBookingsTbody');
  if (!tbody) return;

  const searchVal = (document.getElementById('filterSafariSearch')?.value || '').toLowerCase();
  const statusVal = document.getElementById('filterSafariStatus')?.value || '';
  const payVal = document.getElementById('filterSafariPayment')?.value || '';

  const isAirportBooking = (b) => (b.package_category === 'Airport Services') || (b.airport_service && b.airport_service !== 'No Airport Transfer' && b.airport_service !== 'No Airport Service');

  const filtered = allBookingsData.filter(b => {
    if (isAirportBooking(b)) return false; // Exclude airport bookings
    const matchSearch = (b.booking_reference || '').toLowerCase().includes(searchVal) ||
                        (b.customer_name || '').toLowerCase().includes(searchVal) ||
                        (b.customer_phone || '').includes(searchVal);
    const matchStatus = !statusVal || b.booking_status === statusVal;
    const matchPay = !payVal || b.payment_status === payVal;
    return matchSearch && matchStatus && matchPay;
  });

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding:2rem;">No safari package bookings found matching criteria.</td></tr>';
    return;
  }

  filtered.forEach(b => {
    const tr = document.createElement('tr');
    const statusClass = b.booking_status === 'Confirmed' ? 'badge-confirmed' : (b.booking_status === 'Cancelled' ? 'badge-cancelled' : 'badge-pending');
    const payClass = b.payment_status === 'Paid' ? 'badge-paid' : (b.payment_status === 'Partially Paid' ? 'badge-partially' : 'badge-pending');

    tr.innerHTML = `
      <td><strong>${b.booking_reference}</strong></td>
      <td>
        <div><strong>${b.customer_name}</strong></div>
        <small style="color:#666;"><i class="fas fa-phone"></i> ${b.customer_phone}</small>
      </td>
      <td>${b.package_name}</td>
      <td>${b.travel_date}</td>
      <td>${b.adults} A / ${b.children} C</td>
      <td><strong>KES ${Number(b.total_amount).toLocaleString()}</strong></td>
      <td style="color:#28a745;">KES ${Number(b.amount_paid || 0).toLocaleString()}</td>
      <td style="color:${b.balance > 0 ? '#dc3545' : '#28a745'};">KES ${Number(b.balance || 0).toLocaleString()}</td>
      <td><span class="badge ${statusClass}">${b.booking_status}</span></td>
      <td><span class="badge ${payClass}">${b.payment_status}</span></td>
      <td>
        <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
          <button class="btn btn-green btn-sm" title="Confirm Booking" onclick="adminUpdateStatus('${b.id}', 'Confirmed')"><i class="fas fa-check"></i></button>
          <button class="btn btn-gold btn-sm" title="Record Payment" onclick="adminOpenPaymentModal('${b.id}', '${b.booking_reference}', '${b.customer_name}', ${b.balance || b.total_amount})"><i class="fas fa-money-bill-wave"></i></button>
          <button class="btn btn-outline-gold btn-sm" title="View PDF Invoice" onclick='showBookingConfirmationModal(${JSON.stringify(b)})'><i class="fas fa-file-pdf"></i></button>
          <button class="btn btn-whatsapp btn-sm" title="WhatsApp Customer" onclick="adminWhatsAppCustomer('${b.customer_phone}', '${b.customer_name}', '${b.booking_reference}')"><i class="fab fa-whatsapp"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ----------------------------------------------------
// AIRPORT TRANSFERS TABLE
// ----------------------------------------------------
function renderAirportBookingsTable() {
  const tbody = document.getElementById('adminAirportBookingsTbody');
  if (!tbody) return;

  const searchVal = (document.getElementById('filterAirportSearch')?.value || '').toLowerCase();
  const statusVal = document.getElementById('filterAirportStatus')?.value || '';
  const payVal = document.getElementById('filterAirportPayment')?.value || '';

  const isAirportBooking = (b) => (b.package_category === 'Airport Services') || (b.airport_service && b.airport_service !== 'No Airport Transfer' && b.airport_service !== 'No Airport Service');

  const filtered = allBookingsData.filter(b => {
    if (!isAirportBooking(b)) return false; // Show only airport bookings
    const matchSearch = (b.booking_reference || '').toLowerCase().includes(searchVal) ||
                        (b.customer_name || '').toLowerCase().includes(searchVal) ||
                        (b.customer_phone || '').includes(searchVal);
    const matchStatus = !statusVal || b.booking_status === statusVal;
    const matchPay = !payVal || b.payment_status === payVal;
    return matchSearch && matchStatus && matchPay;
  });

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding:2rem;">No airport transfer bookings found matching criteria.</td></tr>';
    return;
  }

  filtered.forEach(b => {
    const tr = document.createElement('tr');
    const statusClass = b.booking_status === 'Confirmed' ? 'badge-confirmed' : (b.booking_status === 'Cancelled' ? 'badge-cancelled' : 'badge-pending');
    const payClass = b.payment_status === 'Paid' ? 'badge-paid' : (b.payment_status === 'Partially Paid' ? 'badge-partially' : 'badge-pending');

    const paidAmt = Number(b.amount_paid || 0);
    const totalAmt = Number(b.total_amount || 0);
    const balanceAmt = b.balance !== undefined ? Number(b.balance) : (totalAmt - paidAmt);

    tr.innerHTML = `
      <td><strong>${b.booking_reference}</strong></td>
      <td><strong>${b.customer_name}</strong></td>
      <td>
        <small style="color:#444;"><i class="fas fa-phone"></i> ${b.customer_phone}</small><br>
        <small style="color:#888;"><i class="fas fa-envelope"></i> ${b.customer_email || 'N/A'}</small>
      </td>
      <td>
        <span class="badge badge-confirmed" style="background:#e3f2fd; color:#1565c0;"><i class="fas fa-plane-arrival"></i> ${b.airport_service || b.package_name || 'Airport Transfer'}</span>
      </td>
      <td>${b.travel_date}</td>
      <td><strong>KES ${totalAmt.toLocaleString()}</strong></td>
      <td style="color:#28a745;">KES ${paidAmt.toLocaleString()}</td>
      <td style="color:${balanceAmt > 0 ? '#dc3545' : '#28a745'};">KES ${balanceAmt.toLocaleString()}</td>
      <td><span class="badge ${payClass}">${b.payment_status}</span></td>
      <td><span class="badge ${statusClass}">${b.booking_status}</span></td>
      <td>
        <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
          <button class="btn btn-green btn-sm" title="Confirm Transfer" onclick="adminUpdateStatus('${b.id}', 'Confirmed')"><i class="fas fa-check"></i></button>
          <button class="btn btn-gold btn-sm" title="Record / Confirm Payment" onclick="adminOpenPaymentModal('${b.id}', '${b.booking_reference}', '${b.customer_name}', ${balanceAmt})"><i class="fas fa-money-bill-wave"></i></button>
          <button class="btn btn-outline-gold btn-sm" title="View PDF Invoice" onclick='showBookingConfirmationModal(${JSON.stringify(b)})'><i class="fas fa-file-pdf"></i></button>
          <button class="btn btn-whatsapp btn-sm" title="WhatsApp Customer" onclick="adminWhatsAppCustomer('${b.customer_phone}', '${b.customer_name}', '${b.booking_reference}')"><i class="fab fa-whatsapp"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ----------------------------------------------------
// USER MANAGEMENT TABLE
// ----------------------------------------------------
function renderUsersTable() {
  const tbody = document.getElementById('adminUsersTbody');
  if (!tbody) return;

  const searchVal = (document.getElementById('filterUserSearch')?.value || '').toLowerCase();
  const roleVal = document.getElementById('filterUserRole')?.value || '';

  const filtered = allUsersData.filter(u => {
    const matchSearch = (u.full_name || '').toLowerCase().includes(searchVal) ||
                        (u.email || '').toLowerCase().includes(searchVal) ||
                        (u.phone || '').includes(searchVal);
    const matchRole = !roleVal || u.role === roleVal;
    return matchSearch && matchRole;
  });

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem;">No registered users or admins found.</td></tr>';
    return;
  }

  filtered.forEach(u => {
    const tr = document.createElement('tr');
    const isSuperAdmin = u.role === 'Super Admin';
    const roleBadge = isSuperAdmin ? '<span class="badge badge-paid" style="background:#7b1fa2; color:#fff;">Super Admin</span>' : '<span class="badge badge-confirmed">Customer</span>';

    tr.innerHTML = `
      <td><strong>${u.full_name}</strong></td>
      <td>${u.email}</td>
      <td>${u.phone}</td>
      <td>${roleBadge}</td>
      <td>${u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td>
      <td>
        <div style="display:flex; gap:0.35rem;">
          <button class="btn btn-whatsapp btn-sm" onclick="adminWhatsAppCustomer('${u.phone}', '${u.full_name}', 'User Contact')"><i class="fab fa-whatsapp"></i> Chat</button>
          ${!isSuperAdmin ? `<button class="btn btn-sm" style="background:#dc3545; color:#fff;" onclick="adminDeleteUser('${u.id}')"><i class="fas fa-trash"></i></button>` : ''}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.adminOpenAddUserModal = function() {
  document.getElementById('userFormName').value = '';
  document.getElementById('userFormEmail').value = '';
  document.getElementById('userFormPhone').value = '';
  document.getElementById('userFormRole').value = 'Customer';
  document.getElementById('adminUserModal').classList.add('active');
};

window.adminSaveUser = async function(e) {
  e.preventDefault();
  const userData = {
    full_name: document.getElementById('userFormName').value,
    email: document.getElementById('userFormEmail').value,
    phone: document.getElementById('userFormPhone').value,
    role: document.getElementById('userFormRole').value
  };

  await window.CyrooDB.saveUser(userData);
  closeModal('adminUserModal');
  showToastNotification(`New ${userData.role} added successfully!`);
  await refreshAdminData();
};

window.adminDeleteUser = async function(userId) {
  if (confirm("Are you sure you want to remove this user?")) {
    await window.CyrooDB.deleteUser(userId);
    showToastNotification('User removed');
    await refreshAdminData();
  }
};

// Update Booking Status Action
window.adminUpdateStatus = async function(bookingId, status) {
  if (confirm(`Are you sure you want to set status of booking to ${status}?`)) {
    await window.CyrooDB.updateBookingStatus(bookingId, status);
    showToastNotification(`Booking status updated to ${status}`);
    await refreshAdminData();
  }
};

// Direct WhatsApp Customer Communication Action
window.adminWhatsAppCustomer = function(phone, name, ref) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('0') ? '254' + cleanPhone.slice(1) : cleanPhone;
  const text = encodeURIComponent(`Hello ${name},\n\nThis is Cyroo Tours & Safari regarding your Booking Ref: ${ref}.\n\nHow may we assist you today?`);
  window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
};

// Open Payment Recording Modal
window.adminOpenPaymentModal = function(bookingId, ref, customerName, balanceDue) {
  const modal = document.getElementById('adminPaymentModal');
  if (!modal) return;

  document.getElementById('payBookingId').value = bookingId;
  document.getElementById('payBookingRef').value = ref;
  document.getElementById('payCustomerName').value = customerName;
  document.getElementById('payAmount').value = balanceDue;

  modal.classList.add('active');
};

// Submit Payment Handler
window.adminSubmitPayment = async function(e) {
  e.preventDefault();
  const bookingId = document.getElementById('payBookingId').value;
  const ref = document.getElementById('payBookingRef').value;
  const customerName = document.getElementById('payCustomerName').value;
  const amount = document.getElementById('payAmount').value;
  const method = document.getElementById('payMethod').value;
  const transRef = document.getElementById('payTransRef').value;

  await window.CyrooDB.recordPayment({
    booking_id: bookingId,
    booking_reference: ref,
    customer_name: customerName,
    amount: parseFloat(amount),
    payment_method: method,
    transaction_reference: transRef
  });

  closeModal('adminPaymentModal');
  showToastNotification(`Payment of KES ${Number(amount).toLocaleString()} recorded successfully!`);
  await refreshAdminData();
};

// ----------------------------------------------------
// ----------------------------------------------------
// PACKAGE MANAGEMENT (SAFARI vs AIRPORT TRANSFERS)
// ----------------------------------------------------
function renderPackagesTables() {
  renderSafariPackagesGrid();
  renderAirportPackagesGrid();
}

window.renderSafariPackagesGrid = function() {
  const container = document.getElementById('adminSafariPackagesGrid');
  if (!container) return;

  const searchVal = (document.getElementById('filterSafariPkgSearch')?.value || '').toLowerCase();
  const safariPkgs = allPackagesData.filter(p => p.category !== 'Airport Services' && (
    (p.name || '').toLowerCase().includes(searchVal) ||
    (p.destination || '').toLowerCase().includes(searchVal)
  ));

  container.innerHTML = '';
  if (safariPkgs.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem; background:#fff; border-radius:var(--radius-md);"><h4>No safari packages found.</h4></div>';
    return;
  }

  safariPkgs.forEach(pkg => {
    const card = document.createElement('div');
    card.className = 'package-card';
    card.innerHTML = `
      <div class="package-img-wrapper">
        <img src="${pkg.image_url}" class="package-img" onerror="this.src='assets/download.jfif'">
        <span class="package-badge"><i class="fas fa-sun"></i> ${pkg.days} DAYS</span>
      </div>
      <div class="package-content">
        <h3 class="package-title">${pkg.name}</h3>
        <p class="package-destination"><i class="fas fa-map-marker-alt text-gold"></i> ${pkg.destination}</p>
        <p class="package-description">${pkg.description}</p>
        <div class="package-footer">
          <span class="price-val">KES ${Number(pkg.price).toLocaleString()}</span>
          <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
            <a href="index.html?package=${pkg.id}#book" target="_blank" class="btn btn-green btn-sm" title="Book this package on site"><i class="fas fa-calendar-check"></i> Book Safari</a>
            <button class="btn btn-outline-gold btn-sm" onclick='adminEditPackage(${JSON.stringify(pkg)})'><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-sm" style="background:#dc3545; color:#fff;" onclick="adminDeletePackage('${pkg.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
};

window.renderAirportPackagesGrid = function() {
  const container = document.getElementById('adminAirportPackagesGrid');
  if (!container) return;

  const searchVal = (document.getElementById('filterAirportPkgSearch')?.value || '').toLowerCase();
  const airportPkgs = allPackagesData.filter(p => p.category === 'Airport Services' && (
    (p.name || '').toLowerCase().includes(searchVal) ||
    (p.destination || '').toLowerCase().includes(searchVal)
  ));

  container.innerHTML = '';
  if (airportPkgs.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem; background:#fff; border-radius:var(--radius-md);"><h4>No airport packages found.</h4></div>';
    return;
  }

  airportPkgs.forEach(pkg => {
    const card = document.createElement('div');
    card.className = 'package-card';
    card.innerHTML = `
      <div class="package-img-wrapper">
        <img src="${pkg.image_url}" class="package-img" onerror="this.src='assets/download (2).jfif'">
        <span class="package-badge" style="background:var(--primary-green);"><i class="fas fa-plane"></i> AIRPORT SERVICE</span>
      </div>
      <div class="package-content">
        <h3 class="package-title">${pkg.name}</h3>
        <p class="package-destination"><i class="fas fa-map-marker-alt text-gold"></i> ${pkg.destination}</p>
        <p class="package-description">${pkg.description}</p>
        <div class="package-footer">
          <span class="price-val">KES ${Number(pkg.price).toLocaleString()}</span>
          <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
            <a href="index.html?package=${pkg.id}#book" target="_blank" class="btn btn-green btn-sm" title="Book this airport transfer on site"><i class="fas fa-taxi"></i> Book Transfer</a>
            <button class="btn btn-outline-gold btn-sm" onclick='adminEditPackage(${JSON.stringify(pkg)})'><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-sm" style="background:#dc3545; color:#fff;" onclick="adminDeletePackage('${pkg.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
};

window.adminOpenAddPackageModal = function(defaultCat = 'Safari Parks') {
  document.getElementById('pkgFormId').value = '';
  document.getElementById('pkgFormName').value = '';
  document.getElementById('pkgFormDestination').value = defaultCat === 'Airport Services' ? 'Nairobi JKIA Airport / Nairobi Hotels' : 'Maasai Mara National Reserve';
  document.getElementById('pkgFormCategory').value = defaultCat;
  document.getElementById('pkgFormDays').value = defaultCat === 'Airport Services' ? 1 : 3;
  document.getElementById('pkgFormPrice').value = defaultCat === 'Airport Services' ? 3500 : 45000;
  const initialImg = defaultCat === 'Airport Services' ? 'assets/download (2).jfif' : 'assets/download.jfif';
  document.getElementById('pkgFormImg').value = initialImg;
  if (document.getElementById('pkgAssetPicker')) document.getElementById('pkgAssetPicker').value = initialImg;
  if (document.getElementById('pkgImgPreview')) document.getElementById('pkgImgPreview').src = initialImg;
  document.getElementById('pkgFormDesc').value = '';

  document.getElementById('adminPackageModal').classList.add('active');
};

window.adminEditPackage = function(pkg) {
  document.getElementById('pkgFormId').value = pkg.id;
  document.getElementById('pkgFormName').value = pkg.name;
  document.getElementById('pkgFormDestination').value = pkg.destination;
  if (document.getElementById('pkgFormCategory')) document.getElementById('pkgFormCategory').value = pkg.category || 'Safari Parks';
  document.getElementById('pkgFormDays').value = pkg.days;
  document.getElementById('pkgFormPrice').value = pkg.price;
  document.getElementById('pkgFormImg').value = pkg.image_url;
  if (document.getElementById('pkgAssetPicker')) document.getElementById('pkgAssetPicker').value = pkg.image_url || '';
  if (document.getElementById('pkgImgPreview')) document.getElementById('pkgImgPreview').src = pkg.image_url || 'assets/download.jfif';
  document.getElementById('pkgFormDesc').value = pkg.description;

  document.getElementById('adminPackageModal').classList.add('active');
};

window.adminSavePackage = async function(e) {
  e.preventDefault();
  const pkgData = {
    id: document.getElementById('pkgFormId').value,
    name: document.getElementById('pkgFormName').value,
    destination: document.getElementById('pkgFormDestination').value,
    category: document.getElementById('pkgFormCategory') ? document.getElementById('pkgFormCategory').value : 'Safari Parks',
    days: parseInt(document.getElementById('pkgFormDays').value || 1),
    price: parseInt(document.getElementById('pkgFormPrice').value || 0),
    price_child: Math.round(parseInt(document.getElementById('pkgFormPrice').value || 0) * 0.5),
    image_url: document.getElementById('pkgFormImg').value || 'assets/download.jfif',
    description: document.getElementById('pkgFormDesc').value
  };

  await window.CyrooDB.savePackage(pkgData);
  closeModal('adminPackageModal');
  showToastNotification('Package saved successfully!');
  await refreshAdminData();
  if (window.loadPackages) window.loadPackages();
};

window.adminDeletePackage = async function(pkgId) {
  if (confirm("Are you sure you want to delete this package?")) {
    await window.CyrooDB.deletePackage(pkgId);
    showToastNotification('Package deleted');
    await refreshAdminData();
    if (window.loadPackages) window.loadPackages();
  }
};

// ----------------------------------------------------
// DESTINATIONS CATALOG ENGINE & ASSET PICKER
// ----------------------------------------------------
window.applyAssetImageToInput = function(selectId, inputId, previewId) {
  const select = document.getElementById(selectId);
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!select || !input) return;

  if (select.value) {
    input.value = select.value;
    if (preview) preview.src = select.value;
  }
};

window.renderDestinationsGrid = function() {
  const container = document.getElementById('adminDestinationsGrid');
  if (!container) return;

  const searchVal = (document.getElementById('filterDestSearch')?.value || '').toLowerCase();
  const filtered = (allDestinationsData || []).filter(d => 
    (d.name || '').toLowerCase().includes(searchVal) ||
    (d.location || '').toLowerCase().includes(searchVal) ||
    (d.tagline || '').toLowerCase().includes(searchVal)
  );

  container.innerHTML = '';
  if (filtered.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem; background:#fff; border-radius:var(--radius-md);"><h4>No destinations found.</h4></div>';
    return;
  }

  filtered.forEach(dest => {
    const card = document.createElement('div');
    card.className = 'package-card';
    card.innerHTML = `
      <div class="package-img-wrapper" style="height:200px;">
        <img src="${dest.image_url}" class="package-img" onerror="this.src='assets/download.jfif'">
        <span class="package-badge" style="background:var(--gold-accent); color:#000;"><i class="fas fa-compass"></i> ${dest.location || 'Kenya'}</span>
      </div>
      <div class="package-content">
        <h3 class="package-title">${dest.name}</h3>
        <p style="color:var(--gold-accent); font-weight:600; font-size:0.85rem; margin-bottom:0.5rem;"><i class="fas fa-tag"></i> ${dest.tagline || 'Kenyan Safari'}</p>
        <div style="background:#f9f8f6; padding:0.6rem 0.8rem; border-radius:4px; margin-bottom:1rem; font-size:0.8rem; word-break:break-all; color:#666;">
          <i class="fas fa-image text-gold"></i> <strong>Asset Image Path:</strong><br>${dest.image_url}
        </div>
        <div class="package-footer">
          <div style="display:flex; gap:0.35rem; width:100%;">
            <button class="btn btn-gold btn-sm" style="flex:1;" onclick='adminEditDestination(${JSON.stringify(dest)})'>
              <i class="fas fa-edit"></i> Edit & Change Image
            </button>
            <button class="btn btn-sm" style="background:#dc3545; color:#fff;" onclick="adminDeleteDestination('${dest.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
};

window.adminOpenAddDestinationModal = function() {
  document.getElementById('destFormId').value = '';
  document.getElementById('destFormName').value = '';
  document.getElementById('destFormTagline').value = '';
  document.getElementById('destFormLocation').value = 'Kenya';
  document.getElementById('destFormImg').value = 'assets/download.jfif';
  if (document.getElementById('destAssetPicker')) document.getElementById('destAssetPicker').value = 'assets/download.jfif';
  if (document.getElementById('destImgPreview')) document.getElementById('destImgPreview').src = 'assets/download.jfif';

  document.getElementById('adminDestinationModal').classList.add('active');
};

window.adminEditDestination = function(dest) {
  document.getElementById('destFormId').value = dest.id || '';
  document.getElementById('destFormName').value = dest.name || '';
  document.getElementById('destFormTagline').value = dest.tagline || '';
  document.getElementById('destFormLocation').value = dest.location || '';
  document.getElementById('destFormImg').value = dest.image_url || 'assets/download.jfif';

  if (document.getElementById('destAssetPicker')) document.getElementById('destAssetPicker').value = dest.image_url || '';
  if (document.getElementById('destImgPreview')) document.getElementById('destImgPreview').src = dest.image_url || 'assets/download.jfif';

  document.getElementById('adminDestinationModal').classList.add('active');
};

window.adminSaveDestination = async function(e) {
  e.preventDefault();
  const destData = {
    id: document.getElementById('destFormId').value,
    name: document.getElementById('destFormName').value,
    tagline: document.getElementById('destFormTagline').value,
    location: document.getElementById('destFormLocation').value,
    image_url: document.getElementById('destFormImg').value || 'assets/download.jfif'
  };

  await window.CyrooDB.saveDestination(destData);
  closeModal('adminDestinationModal');
  showToastNotification(`Destination "${destData.name}" updated successfully!`);
  await refreshAdminData();
  if (window.loadDestinations) window.loadDestinations();
};

window.adminDeleteDestination = async function(destId) {
  if (confirm("Are you sure you want to delete this destination?")) {
    await window.CyrooDB.deleteDestination(destId);
    showToastNotification('Destination deleted');
    await refreshAdminData();
    if (window.loadDestinations) window.loadDestinations();
  }
};

// ----------------------------------------------------
// PAYMENTS & MESSAGES LOG TABLES
// ----------------------------------------------------
async function renderPaymentsTable() {
  const tbody = document.getElementById('adminPaymentsTbody');
  if (!tbody) return;
  const payments = (await window.localStorage.getItem('cyroo_db_payments')) ? JSON.parse(localStorage.getItem('cyroo_db_payments')) : [];

  tbody.innerHTML = '';
  if (payments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1.5rem;">No payment transactions recorded yet.</td></tr>';
    return;
  }

  payments.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.transaction_reference || 'N/A'}</td>
      <td>${p.booking_reference || 'Ref'}</td>
      <td>${p.customer_name}</td>
      <td><span class="badge badge-confirmed">${p.payment_method}</span></td>
      <td><strong>KES ${Number(p.amount).toLocaleString()}</strong></td>
      <td>${new Date(p.created_at).toLocaleDateString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function renderMessagesTable() {
  const tbody = document.getElementById('adminMessagesTbody');
  if (!tbody) return;
  const msgs = await window.CyrooDB.getContactMessages();

  tbody.innerHTML = '';
  if (msgs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem;">No contact messages received.</td></tr>';
    return;
  }

  msgs.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${m.full_name}</td>
      <td>${m.email}<br><small>${m.phone}</small></td>
      <td style="max-width:300px;">${m.message}</td>
      <td>${new Date(m.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-whatsapp btn-sm" onclick="adminWhatsAppCustomer('${m.phone}', '${m.full_name}', 'Inquiry')"><i class="fab fa-whatsapp"></i> Reply</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Toast Notification Helper
function showToastNotification(msg) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fas fa-bell text-gold fa-lg"></i> <div>${msg.replace(/\n/g, '<br>')}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
