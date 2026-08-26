/**
 * ====================================================================
 * PARK EASE - ADMIN DASHBOARD SCRIPT (ENHANCED admin.js)
 * ====================================================================
 * Handles admin authentication, slot CRUD, monthly subscriptions,
 * payment logs, pure CSS/JS revenue analytics, and plan pricing config.
 * 
 * Written in simple, clean Vanilla JavaScript with beginner-friendly comments.
 */

document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
});

let pendingAdminAction = null;

function initAdmin() {
    checkAuthState();
    setupAdminNavigation();
    setupAdminEventListeners();

    window.addEventListener('pms-data-updated', () => {
        if (window.storage.isAdminLoggedIn()) {
            renderAdminDashboard();
        }
    });

    window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('pms_')) {
            if (window.storage.isAdminLoggedIn()) {
                renderAdminDashboard();
            }
        }
    });
}

// ====================================================================
// AUTHENTICATION & ACCESS CONTROL
// ====================================================================

function checkAuthState() {
    const isLoggedIn = window.storage.isAdminLoggedIn();
    const loginView = document.getElementById('admin-login-view');
    const dashboardView = document.getElementById('admin-dashboard-view');

    if (isLoggedIn) {
        if (loginView) loginView.style.display = 'none';
        if (dashboardView) dashboardView.style.display = 'flex';
        renderAdminDashboard();
    } else {
        if (loginView) loginView.style.display = 'flex';
        if (dashboardView) dashboardView.style.display = 'none';
    }
}

function handleAdminLogin(e) {
    e.preventDefault();

    const usernameInput = document.getElementById('admin-username');
    const passwordInput = document.getElementById('admin-password');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    let isValid = true;
    document.querySelectorAll('#admin-login-view .form-text-error').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('#admin-login-view .form-control').forEach(el => el.classList.remove('is-invalid'));

    if (!username) {
        showFieldError('admin-username', 'error-admin-username', 'Please enter username.');
        isValid = false;
    }
    if (!password) {
        showFieldError('admin-password', 'error-admin-password', 'Please enter password.');
        isValid = false;
    }

    if (!isValid) return;

    const result = window.storage.adminLogin(username, password);

    if (result.success) {
        showAdminToast(result.message, 'success');
        checkAuthState();
    } else {
        showAdminToast(result.message, 'error');
    }
}

function handleAdminLogout() {
    window.storage.adminLogout();
    showAdminToast('You have been logged out successfully.', 'info');
    checkAuthState();
}

// ====================================================================
// ADMIN NAVIGATION
// ====================================================================

function setupAdminNavigation() {
    const links = document.querySelectorAll('[data-admin-tab]');
    links.forEach(link => {
        link.addEventListener('click', () => {
            const tabName = link.getAttribute('data-admin-tab');
            switchAdminTab(tabName);
        });
    });

    const menuToggle = document.getElementById('adminMenuToggle');
    const sidebar = document.getElementById('adminSidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
}

function switchAdminTab(tabName) {
    const links = document.querySelectorAll('[data-admin-tab]');
    const contents = document.querySelectorAll('.admin-tab-content');
    const titleEl = document.getElementById('admin-current-page-title');

    links.forEach(link => {
        if (link.getAttribute('data-admin-tab') === tabName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    contents.forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });

    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active');
    }

    const titles = {
        overview: 'Dashboard Overview',
        slots: 'Parking Slots Management',
        vehicles: 'Currently Parked Vehicles',
        subscriptions: 'Monthly Subscriptions',
        payments: 'Payment Ledger',
        revenue: 'Revenue & Financial Analytics',
        history: 'Parking History Logs',
        settings: 'System Settings & Pricing'
    };
    if (titleEl && titles[tabName]) {
        titleEl.textContent = titles[tabName];
    }

    const sidebar = document.getElementById('adminSidebar');
    if (sidebar && window.innerWidth <= 992) {
        sidebar.classList.remove('open');
    }

    renderAdminDashboard();
}

// ====================================================================
// DASHBOARD RENDERING
// ====================================================================

function renderAdminDashboard() {
    renderAdminOverviewStats();
    renderAdminOverviewGrid();
    renderAdminSlotsTable();
    renderAdminVehiclesTable();
    renderAdminSubscriptionsTable();
    renderAdminPaymentsTable();
    renderRevenueAnalytics();
    renderAdminHistoryTable();
    renderPlanPricingEditor();
}

function renderAdminOverviewStats() {
    const stats = window.storage.getStats();

    const totalSlotsEl = document.getElementById('adm-stat-total-slots');
    const availSlotsEl = document.getElementById('adm-stat-avail-slots');
    const occSlotsEl = document.getElementById('adm-stat-occ-slots');
    const totalVehEl = document.getElementById('adm-stat-total-veh');
    const activeSubsEl = document.getElementById('adm-stat-active-subs');
    const expiredSubsEl = document.getElementById('adm-stat-expired-subs');
    const totalPaymentsEl = document.getElementById('adm-stat-total-payments');
    const revEl = document.getElementById('adm-stat-revenue');
    const mRevEl = document.getElementById('adm-stat-month-revenue');

    if (totalSlotsEl) totalSlotsEl.textContent = stats.totalSlots;
    if (availSlotsEl) availSlotsEl.textContent = stats.availableSlots;
    if (occSlotsEl) occSlotsEl.textContent = stats.occupiedSlots;
    if (totalVehEl) totalVehEl.textContent = stats.totalVehicles;
    if (activeSubsEl) activeSubsEl.textContent = stats.activeSubscriptions;
    if (expiredSubsEl) expiredSubsEl.textContent = stats.expiredSubscriptions;
    if (totalPaymentsEl) totalPaymentsEl.textContent = stats.totalPaymentsCount;
    if (revEl) revEl.textContent = window.storage.formatCurrency(stats.totalRevenue);
    if (mRevEl) mRevEl.textContent = window.storage.formatCurrency(stats.thisMonthRevenue);
}

function getVehicleIcon(type) {
    if (type === '2-Wheeler') return '🏍️';
    if (type === 'Heavy Vehicle') return '🚌';
    return '🚗';
}

function renderAdminOverviewGrid() {
    const grid = document.getElementById('admin-overview-grid');
    if (!grid) return;

    const slots = window.storage.getSlots();
    if (slots.length === 0) {
        grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1;">No slots configured.</p>';
        return;
    }

    grid.innerHTML = slots.map(slot => {
        const isOcc = slot.status === 'occupied';
        const isDis = slot.status === 'disabled';
        const isSub = !!slot.subscriptionId;

        let badgeClass = isOcc ? 'occupied' : (isDis ? 'disabled' : 'available');
        let badgeText = isOcc ? (isSub ? 'Pass Holder' : 'Occupied') : (isDis ? 'Disabled' : 'Available');
        let icon = isDis ? '🚫' : getVehicleIcon(slot.type);

        return `
            <div class="slot-card ${slot.status}">
                <div class="slot-top">
                    <div class="slot-number">
                        <span>${slot.id}</span>
                    </div>
                    <span class="slot-badge ${badgeClass}">${badgeText}</span>
                </div>

                <div class="slot-bay-visual">
                    <div class="slot-vehicle-icon">${icon}</div>
                    <div class="slot-vehicle-no">${isOcc ? slot.vehicleNumber : (isDis ? 'Maintenance' : 'Empty')}</div>
                </div>

                <div class="slot-meta">
                    <span>📍 ${slot.floor}</span>
                    <span>🏷️ ${slot.type}</span>
                </div>

                <div class="slot-actions">
                    ${isOcc ? `
                        <button class="btn btn-sm btn-danger" onclick="confirmAdminReleaseVehicle('${slot.id}')">
                            🔓 Release
                        </button>
                    ` : `
                        <button class="btn btn-sm ${isDis ? 'btn-success' : 'btn-outline'}" onclick="toggleSlotStatus('${slot.id}')">
                            ${isDis ? 'Enable' : 'Disable'}
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

// ====================================================================
// SLOTS MANAGEMENT
// ====================================================================

function renderAdminSlotsTable() {
    const tbody = document.getElementById('adm-slots-tbody');
    if (!tbody) return;

    const searchVal = (document.getElementById('adm-slot-search')?.value || '').trim().toLowerCase();
    const typeFilter = document.getElementById('adm-slot-filter-type')?.value || 'ALL';

    let slots = window.storage.getSlots();

    if (searchVal) {
        slots = slots.filter(s => 
            s.id.toLowerCase().includes(searchVal) ||
            s.floor.toLowerCase().includes(searchVal) ||
            s.status.toLowerCase().includes(searchVal) ||
            (s.vehicleNumber && s.vehicleNumber.toLowerCase().includes(searchVal))
        );
    }

    if (typeFilter !== 'ALL') {
        slots = slots.filter(s => s.type === typeFilter);
    }

    if (slots.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color: var(--text-muted);">No parking slots found.</td></tr>`;
        return;
    }

    tbody.innerHTML = slots.map(slot => {
        const isOcc = slot.status === 'occupied';
        const isDis = slot.status === 'disabled';

        let badge = '<span class="badge badge-success">Available</span>';
        if (isOcc) badge = `<span class="badge badge-danger">Occupied ${slot.subscriptionId ? '(Pass)' : ''}</span>`;
        if (isDis) badge = '<span class="badge badge-secondary">Disabled</span>';

        return `
            <tr>
                <td><strong>${slot.id}</strong></td>
                <td>📍 ${slot.floor}</td>
                <td>${getVehicleIcon(slot.type)} ${slot.type}</td>
                <td>${badge}</td>
                <td>
                    ${isOcc ? `<strong>${slot.vehicleNumber}</strong> (${slot.ownerName || 'User'})` : '<span style="color: var(--text-muted);">None</span>'}
                </td>
                <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 6px;">
                        ${!isOcc ? `
                            <button class="btn btn-sm btn-outline" onclick="toggleSlotStatus('${slot.id}')">
                                ${isDis ? 'Enable' : 'Disable'}
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="confirmDeleteSlot('${slot.id}')">
                                🗑️
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-danger" onclick="confirmAdminReleaseVehicle('${slot.id}')">
                                🔓 Release
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openAddSlotModal() {
    const form = document.getElementById('add-slot-form');
    if (form) form.reset();
    document.querySelectorAll('#addSlotModal .form-text-error').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('#addSlotModal .form-control').forEach(el => el.classList.remove('is-invalid'));
    openModal('addSlotModal');
}

function handleAddSlotSubmit(e) {
    e.preventDefault();

    const idInput = document.getElementById('new-slot-id');
    const floorSelect = document.getElementById('new-slot-floor');
    const typeSelect = document.getElementById('new-slot-type');
    const statusSelect = document.getElementById('new-slot-status');

    const slotId = idInput.value.trim().toUpperCase();
    const floor = floorSelect.value;
    const type = typeSelect.value;
    const status = statusSelect.value;

    if (!slotId) {
        showFieldError('new-slot-id', 'error-new-slot-id', 'Please enter a valid slot ID.');
        return;
    }

    const result = window.storage.addSlot({
        id: slotId,
        floor,
        type,
        status
    });

    if (result.success) {
        closeModal('addSlotModal');
        showAdminToast(result.message, 'success');
        renderAdminDashboard();
    } else {
        showFieldError('new-slot-id', 'error-new-slot-id', result.message);
        showAdminToast(result.message, 'error');
    }
}

function toggleSlotStatus(slotId) {
    const slot = window.storage.getSlotById(slotId);
    if (!slot) return;

    if (slot.status === 'occupied') {
        showAdminToast('Cannot disable an occupied slot! Please release the vehicle first.', 'warning');
        return;
    }

    const newStatus = slot.status === 'disabled' ? 'available' : 'disabled';
    const result = window.storage.updateSlotStatus(slotId, newStatus);

    if (result.success) {
        showAdminToast(result.message, 'success');
        renderAdminDashboard();
    } else {
        showAdminToast(result.message, 'error');
    }
}

function confirmDeleteSlot(slotId) {
    const slot = window.storage.getSlotById(slotId);
    if (!slot) return;

    if (slot.status === 'occupied') {
        showAdminToast('Cannot delete an occupied slot! Release the vehicle first.', 'error');
        return;
    }

    document.getElementById('adm-confirm-title').textContent = `Delete Slot ${slot.id}`;
    document.getElementById('adm-confirm-message').textContent = `Are you sure you want to permanently remove parking slot ${slot.id}?`;

    pendingAdminAction = () => {
        const result = window.storage.deleteSlot(slot.id);
        if (result.success) {
            showAdminToast(result.message, 'success');
            renderAdminDashboard();
        } else {
            showAdminToast(result.message, 'error');
        }
    };

    openModal('adminConfirmModal');
}

// ====================================================================
// ACTIVE VEHICLES MANAGEMENT
// ====================================================================

function renderAdminVehiclesTable() {
    const tbody = document.getElementById('adm-vehicles-tbody');
    const emptyMsg = document.getElementById('adm-no-vehicles-msg');
    if (!tbody) return;

    const searchVal = (document.getElementById('adm-vehicle-search')?.value || '').trim().toLowerCase();
    const slots = window.storage.getSlots();
    let occupiedSlots = slots.filter(s => s.status === 'occupied');

    if (searchVal) {
        occupiedSlots = occupiedSlots.filter(s => 
            (s.vehicleNumber && s.vehicleNumber.toLowerCase().includes(searchVal)) ||
            (s.ownerName && s.ownerName.toLowerCase().includes(searchVal)) ||
            s.id.toLowerCase().includes(searchVal)
        );
    }

    if (occupiedSlots.length === 0) {
        tbody.innerHTML = '';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';

    tbody.innerHTML = occupiedSlots.map(s => `
        <tr>
            <td><strong>${s.id}</strong></td>
            <td><strong style="color: var(--primary-dark); font-size: 0.98rem;">${s.vehicleNumber}</strong></td>
            <td>${s.ownerName || 'Unknown'}</td>
            <td><span class="badge badge-primary">${getVehicleIcon(s.type)} ${s.type}</span></td>
            <td><span class="badge ${s.subscriptionId ? 'badge-primary' : 'badge-secondary'}">${s.subscriptionId ? 'Monthly Pass' : 'Daily Ticket'}</span></td>
            <td><small>${window.storage.formatDateTime(s.parkedAt)}</small></td>
            <td style="text-align: right;">
                <button class="btn btn-sm btn-danger" onclick="confirmAdminReleaseVehicle('${s.id}')">
                    🔓 Evict / Release
                </button>
            </td>
        </tr>
    `).join('');
}

function confirmAdminReleaseVehicle(slotId) {
    const slot = window.storage.getSlotById(slotId);
    if (!slot || slot.status !== 'occupied') return;

    document.getElementById('adm-confirm-title').textContent = `Release Vehicle (${slot.vehicleNumber})`;
    document.getElementById('adm-confirm-message').textContent = `Release vehicle "${slot.vehicleNumber}" from Slot ${slot.id}? It will be logged to parking history under Admin release.`;

    pendingAdminAction = () => {
        const result = window.storage.releaseVehicle(slot.id, 'Admin');
        if (result.success) {
            showAdminToast(result.message, 'success');
            renderAdminDashboard();
        } else {
            showAdminToast(result.message, 'error');
        }
    };

    openModal('adminConfirmModal');
}

// ====================================================================
// MONTHLY SUBSCRIPTIONS MANAGEMENT
// ====================================================================

function renderAdminSubscriptionsTable() {
    const tbody = document.getElementById('adm-subscriptions-tbody');
    const emptyMsg = document.getElementById('adm-no-subs-msg');
    if (!tbody) return;

    const searchVal = (document.getElementById('adm-sub-search')?.value || '').trim().toLowerCase();
    const statusFilter = document.getElementById('adm-sub-status-filter')?.value || 'ALL';

    let subs = window.storage.getSubscriptions();

    if (searchVal) {
        subs = subs.filter(s => 
            s.subscriptionId.toLowerCase().includes(searchVal) ||
            s.ownerName.toLowerCase().includes(searchVal) ||
            s.vehicleNumber.toLowerCase().includes(searchVal) ||
            s.parkingSlot.toLowerCase().includes(searchVal)
        );
    }

    if (statusFilter !== 'ALL') {
        subs = subs.filter(s => s.status === statusFilter);
    }

    if (subs.length === 0) {
        tbody.innerHTML = '';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';

    tbody.innerHTML = subs.map(sub => {
        let badgeClass = 'badge-active';
        if (sub.status === 'Expiring Soon') badgeClass = 'badge-expiring';
        if (sub.status === 'Expired') badgeClass = 'badge-expired';
        if (sub.status === 'Cancelled') badgeClass = 'badge-cancelled';

        return `
            <tr>
                <td><strong style="color: var(--primary-dark); font-family: monospace;">${sub.subscriptionId}</strong></td>
                <td><strong>${sub.ownerName}</strong></td>
                <td>${sub.vehicleNumber}</td>
                <td><span class="badge badge-primary">🅿️ ${sub.parkingSlot}</span></td>
                <td>${sub.plan}</td>
                <td><strong>${window.storage.formatCurrency(sub.amount)}</strong></td>
                <td><small>${window.storage.formatDateOnly(sub.startDate)}</small></td>
                <td><small>${window.storage.formatDateOnly(sub.endDate)}</small></td>
                <td><span class="badge ${badgeClass}">${sub.status}</span></td>
                <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 6px;">
                        ${sub.status !== 'Cancelled' ? `
                            <button class="btn btn-sm btn-primary" onclick="adminRenewSub('${sub.subscriptionId}')" title="Renew 30 Days">
                                🔄 Renew
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="adminCancelSub('${sub.subscriptionId}')" title="Cancel Pass">
                                ✕ Cancel
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="openAdminReceiptFromSub('${sub.subscriptionId}')" title="View Receipt">
                            🧾
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function adminRenewSub(subId) {
    document.getElementById('adm-confirm-title').textContent = `Renew Subscription ${subId}`;
    document.getElementById('adm-confirm-message').textContent = `Renew this subscription for an additional 30 days? A payment record will be logged.`;

    pendingAdminAction = () => {
        const result = window.storage.renewSubscription(subId, 'Admin Override (Cash)');
        if (result.success) {
            showAdminToast(result.message, 'success');
            renderAdminDashboard();
        } else {
            showAdminToast(result.message, 'error');
        }
    };

    openModal('adminConfirmModal');
}

function adminCancelSub(subId) {
    document.getElementById('adm-confirm-title').textContent = `Cancel Subscription ${subId}`;
    document.getElementById('adm-confirm-message').textContent = `Cancel this subscription? The allocated parking slot will be immediately released.`;

    pendingAdminAction = () => {
        const result = window.storage.cancelSubscription(subId, 'Admin');
        if (result.success) {
            showAdminToast(result.message, 'success');
            renderAdminDashboard();
        } else {
            showAdminToast(result.message, 'error');
        }
    };

    openModal('adminConfirmModal');
}

// ====================================================================
// PAYMENTS LEDGER
// ====================================================================

function renderAdminPaymentsTable() {
    const tbody = document.getElementById('adm-payments-tbody');
    const emptyMsg = document.getElementById('adm-no-pays-msg');
    if (!tbody) return;

    const searchVal = (document.getElementById('adm-pay-search')?.value || '').trim().toLowerCase();
    const methodFilter = document.getElementById('adm-pay-method-filter')?.value || 'ALL';

    let payments = window.storage.getPayments();

    if (searchVal) {
        payments = payments.filter(p => 
            p.paymentId.toLowerCase().includes(searchVal) ||
            p.subscriptionId.toLowerCase().includes(searchVal) ||
            p.ownerName.toLowerCase().includes(searchVal) ||
            p.vehicleNumber.toLowerCase().includes(searchVal) ||
            p.parkingSlot.toLowerCase().includes(searchVal)
        );
    }

    if (methodFilter !== 'ALL') {
        payments = payments.filter(p => p.paymentMethod === methodFilter);
    }

    if (payments.length === 0) {
        tbody.innerHTML = '';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';

    tbody.innerHTML = payments.map(pay => `
        <tr>
            <td><strong style="color: var(--primary-dark); font-family: monospace;">${pay.paymentId}</strong></td>
            <td><small style="font-family: monospace;">${pay.subscriptionId}</small></td>
            <td><strong>${pay.ownerName}</strong></td>
            <td>${pay.vehicleNumber}</td>
            <td><span class="badge badge-primary">🅿️ ${pay.parkingSlot}</span></td>
            <td>${pay.plan}</td>
            <td><strong style="color: var(--success-text);">${window.storage.formatCurrency(pay.amount)}</strong></td>
            <td><span class="badge badge-secondary">${pay.paymentMethod}</span></td>
            <td><small>${window.storage.formatDateOnly(pay.paymentDate)}</small></td>
            <td><span class="badge badge-success">✓ ${pay.status}</span></td>
            <td style="text-align: right;">
                <div style="display: inline-flex; gap: 6px;">
                    <button class="btn btn-sm btn-outline" onclick="openAdminReceiptModal('${pay.paymentId}')" title="View Receipt">
                        🧾
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="adminRenewSub('${pay.subscriptionId}')" title="Renew Subscription">
                        🔄
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminCancelSub('${pay.subscriptionId}')" title="Cancel Subscription">
                        ✕
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ====================================================================
// REVENUE ANALYTICS & PURE CSS BAR CHART
// ====================================================================

function renderRevenueAnalytics() {
    const rev = window.storage.getRevenueMetrics();

    document.getElementById('rev-stat-today').textContent = window.storage.formatCurrency(rev.todayRevenue);
    document.getElementById('rev-stat-month').textContent = window.storage.formatCurrency(rev.thisMonthRevenue);
    document.getElementById('rev-stat-total').textContent = window.storage.formatCurrency(rev.totalRevenue);
    document.getElementById('rev-stat-paid-count').textContent = rev.totalPayments;

    // Render Pure CSS Bar Chart
    const chartEl = document.getElementById('revenue-bar-chart');
    if (chartEl) {
        const trendKeys = Object.keys(rev.monthlyTrend);
        if (trendKeys.length === 0) {
            chartEl.innerHTML = '<p class="text-muted" style="width: 100%; text-align: center;">No revenue data recorded yet.</p>';
        } else {
            const maxVal = Math.max(...Object.values(rev.monthlyTrend), 1000);
            chartEl.innerHTML = trendKeys.map(k => {
                const val = rev.monthlyTrend[k];
                const heightPercent = Math.max(10, Math.min(100, Math.round((val / maxVal) * 100)));
                return `
                    <div class="chart-bar-group">
                        <div class="chart-bar-val">${window.storage.formatCurrency(val)}</div>
                        <div class="chart-bar" style="height: ${heightPercent}%;"></div>
                        <div class="chart-bar-label">${k}</div>
                    </div>
                `;
            }).join('');
        }
    }

    // Render Methods Breakdown Grid
    const methodsGrid = document.getElementById('revenue-methods-grid');
    if (methodsGrid) {
        methodsGrid.innerHTML = Object.entries(rev.methodBreakdown).map(([method, amount]) => `
            <div style="background: var(--bg-main); border: 1px solid var(--border-color); padding: 14px; border-radius: var(--radius-md);">
                <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">${method}</div>
                <div style="font-size: 1.4rem; font-weight: 800; color: var(--primary-dark); margin-top: 4px;">${window.storage.formatCurrency(amount)}</div>
            </div>
        `).join('');
    }
}

// ====================================================================
// SETTINGS & PLAN PRICING EDITOR
// ====================================================================

function renderPlanPricingEditor() {
    const editor = document.getElementById('admin-plan-pricing-editor');
    if (!editor) return;

    const plans = window.storage.getPlans();
    editor.innerHTML = plans.map(p => `
        <div style="background: var(--bg-main); border: 1px solid var(--border-color); padding: 18px; border-radius: var(--radius-md);">
            <div style="font-size: 1.5rem; margin-bottom: 4px;">${p.icon || '🅿️'}</div>
            <div style="font-weight: 700; color: var(--text-main);">${p.name}</div>
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 12px;">Type: ${p.vehicleType}</div>
            
            <div class="form-group" style="margin-bottom: 10px;">
                <label class="form-label" style="font-size: 0.8rem;">Price (₹ / Month)</label>
                <input type="number" id="price-input-${p.id}" class="form-control" value="${p.price}" min="100" step="50">
            </div>

            <button class="btn btn-sm btn-primary" onclick="savePlanPrice('${p.id}')" style="width: 100%;">
                Save Price
            </button>
        </div>
    `).join('');
}

function savePlanPrice(planId) {
    const input = document.getElementById(`price-input-${planId}`);
    if (!input) return;

    const newPrice = Number(input.value);
    if (!newPrice || newPrice <= 0) {
        showAdminToast('Please enter a valid price.', 'error');
        return;
    }

    const result = window.storage.updatePlanPrice(planId, newPrice);
    if (result.success) {
        showAdminToast(result.message, 'success');
        renderAdminDashboard();
    } else {
        showAdminToast(result.message, 'error');
    }
}

// ====================================================================
// RECEIPT MODAL (ADMIN)
// ====================================================================

function openAdminReceiptModal(payId) {
    const payment = window.storage.getPaymentById(payId);
    if (!payment) return;

    const sub = window.storage.getSubscriptionById(payment.subscriptionId) || {
        subscriptionId: payment.subscriptionId,
        ownerName: payment.ownerName,
        vehicleNumber: payment.vehicleNumber,
        vehicleType: 'Vehicle',
        parkingSlot: payment.parkingSlot,
        plan: payment.plan,
        startDate: payment.paymentDate,
        endDate: '+30 Days'
    };

    renderAdminReceiptContent(payment, sub);
    openModal('adminReceiptModal');
}

function openAdminReceiptFromSub(subId) {
    const sub = window.storage.getSubscriptionById(subId);
    if (!sub) return;

    const payments = window.storage.getPayments();
    const payment = payments.find(p => p.subscriptionId === sub.subscriptionId) || {
        paymentId: 'PAY-RECORD',
        amount: sub.amount,
        paymentMethod: 'UPI',
        paymentDate: sub.startDate
    };

    renderAdminReceiptContent(payment, sub);
    openModal('adminReceiptModal');
}

function renderAdminReceiptContent(payment, sub) {
    const container = document.getElementById('admin-receipt-content');
    if (!container) return;

    container.innerHTML = `
        <div class="receipt-watermark">PAID</div>
        <div class="receipt-header">
            <div style="font-size: 1.6rem; margin-bottom: 2px;">🅿️</div>
            <div class="receipt-title">PARKING MANAGEMENT SYSTEM</div>
            <div class="receipt-subtitle">Official Payment Receipt & Tax Invoice</div>
        </div>

        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">Payment ID</div>
                <div class="detail-value" style="color: var(--primary-dark);">${payment.paymentId}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Subscription ID</div>
                <div class="detail-value">${sub.subscriptionId || payment.subscriptionId}</div>
            </div>
            <div class="detail-item full-width">
                <div class="detail-label">Owner Name</div>
                <div class="detail-value">${payment.ownerName || sub.ownerName}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Vehicle Number</div>
                <div class="detail-value">${payment.vehicleNumber || sub.vehicleNumber}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Vehicle Type</div>
                <div class="detail-value">${sub.vehicleType || '4-Wheeler'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Parking Slot</div>
                <div class="detail-value" style="color: var(--primary); font-size: 1.1rem;">${payment.parkingSlot || sub.parkingSlot}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Monthly Plan</div>
                <div class="detail-value">${payment.plan || sub.plan}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Payment Method</div>
                <div class="detail-value">${payment.paymentMethod || 'UPI'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Payment Date</div>
                <div class="detail-value">${window.storage.formatDateOnly(payment.paymentDate)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Subscription Start</div>
                <div class="detail-value">${window.storage.formatDateOnly(sub.startDate || payment.paymentDate)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Subscription Expiry</div>
                <div class="detail-value" style="color: var(--danger-text);">${window.storage.formatDateOnly(sub.endDate || '--')}</div>
            </div>
            <div class="detail-item full-width">
                <div class="detail-label">Payment Status</div>
                <div class="detail-value"><span class="badge badge-success">✓ Successful</span></div>
            </div>
            <div class="detail-item full-width" style="background: var(--primary-light); border-color: #bfdbfe;">
                <div class="detail-label" style="color: var(--primary-dark);">Amount Paid</div>
                <div class="detail-value" style="font-size: 1.4rem; color: var(--primary-dark);">${window.storage.formatCurrency(payment.amount)}</div>
            </div>
        </div>

        <div style="text-align: center; font-size: 0.78rem; color: var(--text-muted); margin-top: 14px; border-top: 1px dashed var(--border-color); padding-top: 10px;">
            Generated on ${new Date().toLocaleString()} • Authorized Receipt.
        </div>
    `;
}

// ====================================================================
// PARKING HISTORY LOGS
// ====================================================================

function renderAdminHistoryTable() {
    const tbody = document.getElementById('adm-history-tbody');
    const emptyMsg = document.getElementById('adm-no-history-msg');
    if (!tbody) return;

    const searchVal = (document.getElementById('adm-history-search')?.value || '').trim().toLowerCase();
    let history = window.storage.getHistory();

    if (searchVal) {
        history = history.filter(h => 
            h.vehicleNumber.toLowerCase().includes(searchVal) ||
            h.ownerName.toLowerCase().includes(searchVal) ||
            h.slotId.toLowerCase().includes(searchVal) ||
            h.id.toLowerCase().includes(searchVal)
        );
    }

    if (history.length === 0) {
        tbody.innerHTML = '';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';

    tbody.innerHTML = history.map(h => `
        <tr>
            <td><small style="color: var(--text-muted); font-family: monospace;">${h.id}</small></td>
            <td><strong>${h.vehicleNumber}</strong></td>
            <td>${h.ownerName}</td>
            <td><span class="badge badge-primary">${getVehicleIcon(h.vehicleType)} ${h.vehicleType}</span></td>
            <td><strong>${h.slotId}</strong></td>
            <td><small>${window.storage.formatDateTime(h.parkedAt)}</small></td>
            <td><small>${window.storage.formatDateTime(h.releasedAt)}</small></td>
            <td><span class="badge badge-success">⏱️ ${h.duration}</span></td>
            <td><span class="badge badge-secondary">${h.releasedBy || 'Admin'}</span></td>
        </tr>
    `).join('');
}

function confirmClearHistory() {
    document.getElementById('adm-confirm-title').textContent = 'Clear All History';
    document.getElementById('adm-confirm-message').textContent = 'Are you sure you want to permanently erase all past exit history logs?';

    pendingAdminAction = () => {
        window.storage.clearHistory();
        showAdminToast('All parking history logs cleared.', 'info');
        renderAdminDashboard();
    };

    openModal('adminConfirmModal');
}

function confirmResetSystemData() {
    document.getElementById('adm-confirm-title').textContent = 'Restore Sample Dataset';
    document.getElementById('adm-confirm-message').textContent = 'Reset all slots, subscriptions, payments, and history to factory sample values?';

    pendingAdminAction = () => {
        window.storage.resetToDefaultData();
        showAdminToast('System restored to default sample data.', 'success');
        renderAdminDashboard();
    };

    openModal('adminConfirmModal');
}

// ====================================================================
// MODAL & TOAST HELPERS
// ====================================================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

function showFieldError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (input) input.classList.add('is-invalid');
    if (error) {
        if (message) error.textContent = message;
        error.classList.add('show');
    }
}

function showAdminToast(message, type = 'info') {
    const container = document.getElementById('adminToastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ====================================================================
// EVENT LISTENERS
// ====================================================================

function setupAdminEventListeners() {
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) loginForm.addEventListener('submit', handleAdminLogin);

    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleAdminLogout);

    const addSlotForm = document.getElementById('add-slot-form');
    if (addSlotForm) addSlotForm.addEventListener('submit', handleAddSlotSubmit);

    const slotSearch = document.getElementById('adm-slot-search');
    const slotTypeFilter = document.getElementById('adm-slot-filter-type');
    if (slotSearch) slotSearch.addEventListener('input', renderAdminSlotsTable);
    if (slotTypeFilter) slotTypeFilter.addEventListener('change', renderAdminSlotsTable);

    const vehSearch = document.getElementById('adm-vehicle-search');
    if (vehSearch) vehSearch.addEventListener('input', renderAdminVehiclesTable);

    const subSearch = document.getElementById('adm-sub-search');
    const subStatusFilter = document.getElementById('adm-sub-status-filter');
    if (subSearch) subSearch.addEventListener('input', renderAdminSubscriptionsTable);
    if (subStatusFilter) subStatusFilter.addEventListener('change', renderAdminSubscriptionsTable);

    const paySearch = document.getElementById('adm-pay-search');
    const payMethodFilter = document.getElementById('adm-pay-method-filter');
    if (paySearch) paySearch.addEventListener('input', renderAdminPaymentsTable);
    if (payMethodFilter) payMethodFilter.addEventListener('change', renderAdminPaymentsTable);

    const histSearch = document.getElementById('adm-history-search');
    if (histSearch) histSearch.addEventListener('input', renderAdminHistoryTable);

    const clearHistBtn = document.getElementById('clear-history-btn');
    if (clearHistBtn) clearHistBtn.addEventListener('click', confirmClearHistory);

    const resetDataBtn = document.getElementById('reset-system-data-btn');
    if (resetDataBtn) resetDataBtn.addEventListener('click', confirmResetSystemData);

    const confirmActionBtn = document.getElementById('adm-confirm-btn');
    if (confirmActionBtn) {
        confirmActionBtn.addEventListener('click', () => {
            if (typeof pendingAdminAction === 'function') {
                pendingAdminAction();
            }
            closeModal('adminConfirmModal');
            pendingAdminAction = null;
        });
    }

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.classList.remove('show');
            }
        });
    });
}
