/**
 * ====================================================================
 * PARK EASE - ADMIN DASHBOARD SCRIPT (admin.js)
 * ====================================================================
 * Handles admin authentication, slot CRUD management, status toggling,
 * vehicle release, historical log management, and system data resets.
 * 
 * Written in simple, clean Vanilla JavaScript with beginner-friendly comments.
 */

document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
});

let pendingAdminAction = null;

/**
 * Initialize Admin App
 */
function initAdmin() {
    checkAuthState();
    setupAdminNavigation();
    setupAdminEventListeners();

    // Listen for storage events (e.g. if user parks/releases in another tab)
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

    // Reset error styles
    document.querySelectorAll('#admin-login-view .form-text-error').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('#admin-login-view .form-control').forEach(el => el.classList.remove('is-invalid'));

    if (!username) {
        showFieldError('admin-username', 'error-admin-username', 'Please enter your username.');
        isValid = false;
    }
    if (!password) {
        showFieldError('admin-password', 'error-admin-password', 'Please enter your password.');
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
// ADMIN NAVIGATION & TABS
// ====================================================================

function setupAdminNavigation() {
    const links = document.querySelectorAll('[data-admin-tab]');
    links.forEach(link => {
        link.addEventListener('click', () => {
            const tabName = link.getAttribute('data-admin-tab');
            switchAdminTab(tabName);
        });
    });

    // Mobile sidebar toggle
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

    // Update active nav link
    links.forEach(link => {
        if (link.getAttribute('data-admin-tab') === tabName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Hide all tab contents and show selected
    contents.forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });

    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active');
    }

    // Set page title
    const titles = {
        overview: 'Dashboard Overview',
        slots: 'Slot Management',
        vehicles: 'Parked Vehicles Management',
        history: 'Parking History & Audit Logs',
        settings: 'System Settings'
    };
    if (titleEl && titles[tabName]) {
        titleEl.textContent = titles[tabName];
    }

    // Close sidebar on mobile
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar && window.innerWidth <= 992) {
        sidebar.classList.remove('open');
    }

    // Refresh data
    renderAdminDashboard();
}

// ====================================================================
// ADMIN DASHBOARD RENDERING
// ====================================================================

function renderAdminDashboard() {
    renderAdminStats();
    renderAdminOverviewGrid();
    renderAdminSlotsTable();
    renderAdminVehiclesTable();
    renderAdminHistoryTable();
}

function renderAdminStats() {
    const stats = window.storage.getStats();

    const totalEl = document.getElementById('adm-stat-total');
    const availEl = document.getElementById('adm-stat-avail');
    const occEl = document.getElementById('adm-stat-occ');
    const disEl = document.getElementById('adm-stat-dis');

    if (totalEl) totalEl.textContent = stats.totalSlots;
    if (availEl) availEl.textContent = stats.availableSlots;
    if (occEl) occEl.textContent = stats.occupiedSlots;
    if (disEl) disEl.textContent = stats.disabledSlots;
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
        let badgeClass = isOcc ? 'occupied' : (isDis ? 'disabled' : 'available');
        let badgeText = isOcc ? 'Occupied' : (isDis ? 'Disabled' : 'Available');
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
                            ${isDis ? '✅ Enable' : '🛠️ Disable'}
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

// ====================================================================
// SLOT MANAGEMENT
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
        if (isOcc) badge = '<span class="badge badge-danger">Occupied</span>';
        if (isDis) badge = '<span class="badge badge-secondary">Disabled</span>';

        return `
            <tr>
                <td><strong>${slot.id}</strong></td>
                <td>📍 ${slot.floor}</td>
                <td>${getVehicleIcon(slot.type)} ${slot.type}</td>
                <td>${badge}</td>
                <td>
                    ${isOcc ? `<strong>${slot.vehicleNumber}</strong> (${slot.ownerName})` : '<span style="color: var(--text-muted);">None</span>'}
                </td>
                <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 6px;">
                        ${!isOcc ? `
                            <button class="btn btn-sm btn-outline" onclick="toggleSlotStatus('${slot.id}')" title="Toggle Active / Maintenance">
                                ${isDis ? 'Enable' : 'Disable'}
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="confirmDeleteSlot('${slot.id}')" title="Delete Slot">
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
    document.getElementById('adm-confirm-message').textContent = `Are you sure you want to permanently remove parking slot ${slot.id}? This action cannot be undone.`;

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
            <td>📍 ${s.floor}</td>
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
    document.getElementById('adm-confirm-message').textContent = `Are you sure you want to release vehicle "${slot.vehicleNumber}" from Slot ${slot.id}? It will be logged to parking history under Admin release.`;

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
    document.getElementById('adm-confirm-title').textContent = 'Clear All Parking History';
    document.getElementById('adm-confirm-message').textContent = 'Are you sure you want to permanently erase all past parking history logs? This action cannot be reversed.';

    pendingAdminAction = () => {
        window.storage.clearHistory();
        showAdminToast('All parking history logs have been cleared.', 'info');
        renderAdminDashboard();
    };

    openModal('adminConfirmModal');
}

// ====================================================================
// SETTINGS & SYSTEM RESET
// ====================================================================

function confirmResetSystemData() {
    document.getElementById('adm-confirm-title').textContent = 'Restore Sample Data';
    document.getElementById('adm-confirm-message').textContent = 'Are you sure you want to reset all slots, vehicles, and history back to initial factory demo values?';

    pendingAdminAction = () => {
        window.storage.resetToDefaultData();
        showAdminToast('System successfully restored to default sample data.', 'success');
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

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

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
// EVENT LISTENERS BINDINGS
// ====================================================================

function setupAdminEventListeners() {
    // Login form
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) loginForm.addEventListener('submit', handleAdminLogin);

    // Logout
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleAdminLogout);

    // Add slot form
    const addSlotForm = document.getElementById('add-slot-form');
    if (addSlotForm) addSlotForm.addEventListener('submit', handleAddSlotSubmit);

    // Slot table search and filter
    const slotSearch = document.getElementById('adm-slot-search');
    const slotTypeFilter = document.getElementById('adm-slot-filter-type');
    if (slotSearch) slotSearch.addEventListener('input', renderAdminSlotsTable);
    if (slotTypeFilter) slotTypeFilter.addEventListener('change', renderAdminSlotsTable);

    // Vehicle search
    const vehSearch = document.getElementById('adm-vehicle-search');
    if (vehSearch) vehSearch.addEventListener('input', renderAdminVehiclesTable);

    // History search
    const histSearch = document.getElementById('adm-history-search');
    if (histSearch) histSearch.addEventListener('input', renderAdminHistoryTable);

    // Clear history button
    const clearHistBtn = document.getElementById('clear-history-btn');
    if (clearHistBtn) clearHistBtn.addEventListener('click', confirmClearHistory);

    // Reset system data
    const resetDataBtn = document.getElementById('reset-system-data-btn');
    if (resetDataBtn) resetDataBtn.addEventListener('click', confirmResetSystemData);

    // Action confirmation button
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

    // Modal backdrop dismissal
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.classList.remove('show');
            }
        });
    });
}
