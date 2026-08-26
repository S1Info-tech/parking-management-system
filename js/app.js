/**
 * ====================================================================
 * PARK EASE - USER APPLICATION SCRIPT (app.js)
 * ====================================================================
 * Manages all user-facing interactions, SPA section routing, DOM rendering,
 * real-time search & filtering, form validations, and modal dialogs.
 * 
 * Written in simple, clean Vanilla JavaScript with beginner-friendly comments.
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

let currentReleaseSlotId = null;

/**
 * Initializes all user application components.
 */
function initApp() {
    setupNavigation();
    setupMobileMenu();
    setupEventListeners();
    renderAll();

    // Listen for storage changes across tabs or admin actions
    window.addEventListener('pms-data-updated', () => {
        renderAll();
    });

    window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('pms_')) {
            renderAll();
        }
    });

    // Check URL hash for initial section navigation
    const initialHash = window.location.hash.replace('#', '') || 'home';
    navigateToSection(initialHash);
}

/**
 * Re-renders all dynamic UI sections and stat counters.
 */
function renderAll() {
    renderStats();
    renderHomeSlots();
    renderAllSlots();
    populateAvailableSlotsDropdown();
    renderActiveVehicles();
    renderHistory();
}

// ====================================================================
// NAVIGATION & ROUTING
// ====================================================================

function setupNavigation() {
    const navLinks = document.querySelectorAll('[data-nav]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('data-nav');
            if (target) {
                e.preventDefault();
                navigateToSection(target);
            }
        });
    });

    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '') || 'home';
        navigateToSection(hash);
    });
}

function setupMobileMenu() {
    const toggleBtn = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (toggleBtn && navLinks) {
        toggleBtn.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });

        // Close menu when clicking a nav item
        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                navLinks.classList.remove('show');
            });
        });
    }
}

/**
 * Smoothly switches visible sections without page reloads.
 * @param {string} sectionId 
 */
function navigateToSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    const navItems = document.querySelectorAll('.nav-links .nav-item');

    let targetSection = document.getElementById(`section-${sectionId}`);
    if (!targetSection) {
        targetSection = document.getElementById('section-home');
        sectionId = 'home';
    }

    // Update active section
    sections.forEach(sec => sec.classList.remove('active'));
    targetSection.classList.add('active');

    // Update navbar active styling
    navItems.forEach(item => {
        const link = item.querySelector('a');
        if (link && link.getAttribute('data-nav') === sectionId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update URL hash
    window.location.hash = sectionId;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ====================================================================
// STATISTICS CARDS
// ====================================================================

function renderStats() {
    const stats = window.storage.getStats();

    const totalEl = document.getElementById('stat-total-slots');
    const availEl = document.getElementById('stat-available-slots');
    const occEl = document.getElementById('stat-occupied-slots');
    const vehEl = document.getElementById('stat-total-vehicles');

    const quickAvail = document.getElementById('quick-avail-count');
    const quickOcc = document.getElementById('quick-occ-count');

    if (totalEl) totalEl.textContent = stats.totalSlots;
    if (availEl) availEl.textContent = stats.availableSlots;
    if (occEl) occEl.textContent = stats.occupiedSlots;
    if (vehEl) vehEl.textContent = stats.totalVehicles;

    if (quickAvail) quickAvail.textContent = stats.availableSlots;
    if (quickOcc) quickOcc.textContent = stats.occupiedSlots;
}

// ====================================================================
// VISUAL PARKING SLOTS RENDERING
// ====================================================================

/**
 * Returns appropriate vehicle icon based on vehicle type.
 */
function getVehicleIcon(type) {
    if (type === '2-Wheeler') return '🏍️';
    if (type === 'Heavy Vehicle') return '🚌';
    return '🚗';
}

/**
 * Creates HTML for a single parking slot card.
 * @param {Object} slot 
 * @returns {string} HTML string
 */
function createSlotCardHTML(slot) {
    const isAvail = slot.status === 'available';
    const isOcc = slot.status === 'occupied';
    const isDis = slot.status === 'disabled';

    let badgeClass = 'available';
    let badgeText = 'Available';
    let icon = getVehicleIcon(slot.type);

    if (isOcc) {
        badgeClass = 'occupied';
        badgeText = 'Occupied';
    } else if (isDis) {
        badgeClass = 'disabled';
        badgeText = 'Disabled';
        icon = '🚫';
    }

    return `
        <div class="slot-card ${slot.status}" onclick="handleSlotCardClick('${slot.id}')">
            <div class="slot-top">
                <div class="slot-number">
                    <span>${slot.id}</span>
                </div>
                <span class="slot-badge ${badgeClass}">${badgeText}</span>
            </div>

            <div class="slot-bay-visual">
                <div class="slot-vehicle-icon">${icon}</div>
                <div class="slot-vehicle-no">${isOcc ? slot.vehicleNumber : (isDis ? 'Under Maintenance' : 'Empty Bay')}</div>
            </div>

            <div class="slot-meta">
                <span>📍 ${slot.floor}</span>
                <span>🏷️ ${slot.type}</span>
            </div>

            <div class="slot-actions" onclick="event.stopPropagation()">
                ${isAvail ? `
                    <button class="btn btn-sm btn-primary" onclick="quickParkInSlot('${slot.id}')">
                        🚗 Park Here
                    </button>
                ` : ''}
                ${isOcc ? `
                    <button class="btn btn-sm btn-danger" onclick="openReleaseModal('${slot.id}')">
                        🔓 Release
                    </button>
                ` : ''}
                <button class="btn btn-sm btn-outline" onclick="openSlotDetailsModal('${slot.id}')">
                    ℹ️ Details
                </button>
            </div>
        </div>
    `;
}

/**
 * Renders home preview slots.
 */
function renderHomeSlots() {
    const grid = document.getElementById('home-slots-grid');
    if (!grid) return;

    const slots = window.storage.getSlots();
    if (slots.length === 0) {
        grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center;">No parking slots found.</p>';
        return;
    }

    grid.innerHTML = slots.map(createSlotCardHTML).join('');
}

/**
 * Renders all slots with search and filter applied.
 */
function renderAllSlots() {
    const grid = document.getElementById('all-slots-grid');
    if (!grid) return;

    const searchVal = (document.getElementById('slot-search-input')?.value || '').trim().toLowerCase();
    const typeFilter = document.getElementById('slot-type-filter')?.value || 'ALL';
    const statusFilter = document.getElementById('slot-status-filter')?.value || 'ALL';

    let slots = window.storage.getSlots();

    // Apply search filter
    if (searchVal) {
        slots = slots.filter(s => 
            s.id.toLowerCase().includes(searchVal) ||
            s.floor.toLowerCase().includes(searchVal) ||
            (s.vehicleNumber && s.vehicleNumber.toLowerCase().includes(searchVal)) ||
            (s.ownerName && s.ownerName.toLowerCase().includes(searchVal))
        );
    }

    // Apply vehicle type filter
    if (typeFilter !== 'ALL') {
        slots = slots.filter(s => s.type === typeFilter);
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
        slots = slots.filter(s => s.status === statusFilter);
    }

    if (slots.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">🔍</div>
                <h3 class="empty-state-title">No Matching Parking Slots</h3>
                <p class="empty-state-text">Try adjusting your search query or reset the filters.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = slots.map(createSlotCardHTML).join('');
}

// ====================================================================
// PARK VEHICLE FORM & LOGIC
// ====================================================================

function populateAvailableSlotsDropdown() {
    const select = document.getElementById('select-parking-slot');
    const selectedType = document.getElementById('select-vehicle-type')?.value || '4-Wheeler';
    if (!select) return;

    const slots = window.storage.getSlots();
    // Filter available slots
    const availableSlots = slots.filter(s => s.status === 'available');

    if (availableSlots.length === 0) {
        select.innerHTML = '<option value="">-- No Slots Available Currently --</option>';
        return;
    }

    // Prioritize slots matching the chosen vehicle type
    let html = '<option value="">-- Select an Available Slot --</option>';
    
    // Exact type match group
    const exactMatches = availableSlots.filter(s => s.type === selectedType);
    const otherMatches = availableSlots.filter(s => s.type !== selectedType);

    if (exactMatches.length > 0) {
        html += `<optgroup label="Recommended for ${selectedType}">`;
        exactMatches.forEach(s => {
            html += `<option value="${s.id}">${s.id} (${s.floor} - ${s.type})</option>`;
        });
        html += '</optgroup>';
    }

    if (otherMatches.length > 0) {
        html += `<optgroup label="Other Available Slots">`;
        otherMatches.forEach(s => {
            html += `<option value="${s.id}">${s.id} (${s.floor} - ${s.type})</option>`;
        });
        html += '</optgroup>';
    }

    select.innerHTML = html;
}

function handleParkVehicleSubmit(e) {
    e.preventDefault();

    const vehicleNumberInput = document.getElementById('input-vehicle-number');
    const ownerNameInput = document.getElementById('input-owner-name');
    const vehicleTypeSelect = document.getElementById('select-vehicle-type');
    const slotSelect = document.getElementById('select-parking-slot');

    const vehicleNumber = vehicleNumberInput.value.trim();
    const ownerName = ownerNameInput.value.trim();
    const vehicleType = vehicleTypeSelect.value;
    const slotId = slotSelect.value;

    let isValid = true;

    // Reset error displays
    document.querySelectorAll('.form-text-error').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('is-invalid'));

    // Validate Vehicle Number
    if (!vehicleNumber || vehicleNumber.length < 3) {
        showFieldError('input-vehicle-number', 'error-vehicle-number', 'Please enter a valid vehicle registration number.');
        isValid = false;
    }

    // Validate Owner Name
    if (!ownerName || ownerName.length < 2) {
        showFieldError('input-owner-name', 'error-owner-name', 'Please enter the vehicle owner name.');
        isValid = false;
    }

    // Validate Slot Selection
    if (!slotId) {
        showFieldError('select-parking-slot', 'error-parking-slot', 'Please select an available parking slot.');
        isValid = false;
    }

    if (!isValid) return;

    // Attempt to park via storage service
    const result = window.storage.parkVehicle({
        slotId,
        vehicleNumber,
        ownerName,
        vehicleType
    });

    if (result.success) {
        // Reset form
        vehicleNumberInput.value = '';
        ownerNameInput.value = '';

        // Show Toast
        showToast(result.message, 'success');

        // Show Receipt Modal
        showReceiptModal({
            slotId: result.slot.id,
            vehicleNumber: result.slot.vehicleNumber,
            ownerName: result.slot.ownerName,
            vehicleType: result.slot.type,
            parkedAt: result.slot.parkedAt
        });

        // Re-render
        renderAll();
    } else {
        showToast(result.message, 'error');
    }
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

function quickParkInSlot(slotId) {
    navigateToSection('park');
    const slotSelect = document.getElementById('select-parking-slot');
    if (slotSelect) {
        slotSelect.value = slotId;
    }
    const vehInput = document.getElementById('input-vehicle-number');
    if (vehInput) {
        vehInput.focus();
    }
}

// ====================================================================
// ACTIVE PARKED VEHICLES TABLE
// ====================================================================

function renderActiveVehicles() {
    const tbody = document.getElementById('active-vehicles-tbody');
    const emptyMsg = document.getElementById('no-active-vehicles-msg');
    const table = document.getElementById('active-vehicles-table');
    if (!tbody) return;

    const searchVal = (document.getElementById('active-vehicle-search')?.value || '').trim().toLowerCase();
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
        if (table) table.style.display = 'none';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }

    if (table) table.style.display = 'table';
    if (emptyMsg) emptyMsg.style.display = 'none';

    tbody.innerHTML = occupiedSlots.map(s => {
        const icon = getVehicleIcon(s.type);
        return `
            <tr>
                <td><strong>${s.id}</strong></td>
                <td>
                    <span style="font-weight: 700; color: var(--primary-dark); font-size: 0.98rem;">${s.vehicleNumber}</span>
                </td>
                <td>${s.ownerName || 'Unknown'}</td>
                <td>
                    <span class="badge badge-primary">${icon} ${s.type}</span>
                </td>
                <td>📍 ${s.floor}</td>
                <td>${window.storage.formatDateTime(s.parkedAt)}</td>
                <td style="text-align: right;">
                    <button class="btn btn-sm btn-danger" onclick="openReleaseModal('${s.id}')">
                        🔓 Release
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ====================================================================
// PARKING HISTORY TABLE
// ====================================================================

function renderHistory() {
    const tbody = document.getElementById('history-tbody');
    const emptyMsg = document.getElementById('no-history-msg');
    const table = document.getElementById('history-table');
    if (!tbody) return;

    const searchVal = (document.getElementById('history-search-input')?.value || '').trim().toLowerCase();
    const typeFilter = document.getElementById('history-type-filter')?.value || 'ALL';

    let history = window.storage.getHistory();

    if (searchVal) {
        history = history.filter(h => 
            h.vehicleNumber.toLowerCase().includes(searchVal) ||
            h.ownerName.toLowerCase().includes(searchVal) ||
            h.slotId.toLowerCase().includes(searchVal) ||
            h.id.toLowerCase().includes(searchVal)
        );
    }

    if (typeFilter !== 'ALL') {
        history = history.filter(h => h.vehicleType === typeFilter);
    }

    if (history.length === 0) {
        tbody.innerHTML = '';
        if (table) table.style.display = 'none';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }

    if (table) table.style.display = 'table';
    if (emptyMsg) emptyMsg.style.display = 'none';

    tbody.innerHTML = history.map(h => {
        const icon = getVehicleIcon(h.vehicleType);
        return `
            <tr>
                <td><small style="color: var(--text-muted); font-family: monospace;">${h.id}</small></td>
                <td><strong>${h.vehicleNumber}</strong></td>
                <td>${h.ownerName}</td>
                <td><span class="badge badge-primary">${icon} ${h.vehicleType}</span></td>
                <td><strong>${h.slotId}</strong></td>
                <td><small>${window.storage.formatDateTime(h.parkedAt)}</small></td>
                <td><small>${window.storage.formatDateTime(h.releasedAt)}</small></td>
                <td><span class="badge badge-success">⏱️ ${h.duration}</span></td>
                <td><span class="badge badge-secondary">${h.releasedBy || 'User'}</span></td>
            </tr>
        `;
    }).join('');
}

// ====================================================================
// MODAL DIALOGS
// ====================================================================

function handleSlotCardClick(slotId) {
    openSlotDetailsModal(slotId);
}

function openSlotDetailsModal(slotId) {
    const slot = window.storage.getSlotById(slotId);
    if (!slot) return;

    const titleEl = document.getElementById('modal-slot-title');
    const bodyEl = document.getElementById('modal-slot-body');
    const footerEl = document.getElementById('modal-slot-footer');

    if (titleEl) titleEl.textContent = `Parking Slot ${slot.id}`;

    let statusBadge = `<span class="badge badge-success">Available</span>`;
    if (slot.status === 'occupied') statusBadge = `<span class="badge badge-danger">Occupied</span>`;
    if (slot.status === 'disabled') statusBadge = `<span class="badge badge-secondary">Disabled / Maintenance</span>`;

    let contentHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">Slot Identifier</div>
                <div class="detail-value">${slot.id}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Current Status</div>
                <div class="detail-value">${statusBadge}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Floor / Zone</div>
                <div class="detail-value">📍 ${slot.floor}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Supported Type</div>
                <div class="detail-value">${getVehicleIcon(slot.type)} ${slot.type}</div>
            </div>
    `;

    if (slot.status === 'occupied') {
        contentHTML += `
            <div class="detail-item full-width">
                <div class="detail-label">Parked Vehicle Registration</div>
                <div class="detail-value" style="font-size: 1.2rem; color: var(--primary-dark);">${slot.vehicleNumber}</div>
            </div>
            <div class="detail-item full-width">
                <div class="detail-label">Vehicle Owner</div>
                <div class="detail-value">${slot.ownerName || 'Unknown'}</div>
            </div>
            <div class="detail-item full-width">
                <div class="detail-label">Check-in Timestamp</div>
                <div class="detail-value">${window.storage.formatDateTime(slot.parkedAt)}</div>
            </div>
        `;
    }

    contentHTML += `</div>`;
    if (bodyEl) bodyEl.innerHTML = contentHTML;

    // Set dynamic action buttons in modal footer
    let footerHTML = `<button class="btn btn-outline" onclick="closeModal('slotDetailModal')">Close</button>`;
    if (slot.status === 'available') {
        footerHTML += `<button class="btn btn-primary" onclick="closeModal('slotDetailModal'); quickParkInSlot('${slot.id}')">🚗 Park Vehicle Here</button>`;
    } else if (slot.status === 'occupied') {
        footerHTML += `<button class="btn btn-danger" onclick="closeModal('slotDetailModal'); openReleaseModal('${slot.id}')">🔓 Release Vehicle</button>`;
    }

    if (footerEl) footerEl.innerHTML = footerHTML;

    openModal('slotDetailModal');
}

function openReleaseModal(slotId) {
    const slot = window.storage.getSlotById(slotId);
    if (!slot || slot.status !== 'occupied') return;

    currentReleaseSlotId = slot.id;

    document.getElementById('release-modal-veh-no').textContent = slot.vehicleNumber || '--';
    document.getElementById('release-modal-slot-id').textContent = slot.id;
    document.getElementById('release-modal-owner').textContent = slot.ownerName || 'Unknown';
    document.getElementById('release-modal-time').textContent = window.storage.formatDateTime(slot.parkedAt);

    openModal('releaseConfirmModal');
}

function handleConfirmRelease() {
    if (!currentReleaseSlotId) return;

    const result = window.storage.releaseVehicle(currentReleaseSlotId, 'User');
    closeModal('releaseConfirmModal');

    if (result.success) {
        showToast(result.message, 'success');
        renderAll();
    } else {
        showToast(result.message, 'error');
    }

    currentReleaseSlotId = null;
}

function showReceiptModal(data) {
    document.getElementById('receipt-slot-id').textContent = data.slotId;
    document.getElementById('receipt-type').textContent = `${getVehicleIcon(data.vehicleType)} ${data.vehicleType}`;
    document.getElementById('receipt-veh-no').textContent = data.vehicleNumber;
    document.getElementById('receipt-owner').textContent = data.ownerName;
    document.getElementById('receipt-time').textContent = window.storage.formatDateTime(data.parkedAt);

    openModal('receiptModal');
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

// ====================================================================
// TOAST NOTIFICATION SYSTEM
// ====================================================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
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
// EVENT LISTENERS BINDING
// ====================================================================

function setupEventListeners() {
    // Park Form Submit
    const parkForm = document.getElementById('park-vehicle-form');
    if (parkForm) {
        parkForm.addEventListener('submit', handleParkVehicleSubmit);
    }

    // Vehicle Type Change updates available slot dropdown
    const vehTypeSelect = document.getElementById('select-vehicle-type');
    if (vehTypeSelect) {
        vehTypeSelect.addEventListener('change', populateAvailableSlotsDropdown);
    }

    // Search and filters for Slots
    const slotSearch = document.getElementById('slot-search-input');
    const slotTypeFilter = document.getElementById('slot-type-filter');
    const slotStatusFilter = document.getElementById('slot-status-filter');
    const resetSlotFilterBtn = document.getElementById('reset-slot-filter-btn');

    if (slotSearch) slotSearch.addEventListener('input', renderAllSlots);
    if (slotTypeFilter) slotTypeFilter.addEventListener('change', renderAllSlots);
    if (slotStatusFilter) slotStatusFilter.addEventListener('change', renderAllSlots);
    if (resetSlotFilterBtn) {
        resetSlotFilterBtn.addEventListener('click', () => {
            if (slotSearch) slotSearch.value = '';
            if (slotTypeFilter) slotTypeFilter.value = 'ALL';
            if (slotStatusFilter) slotStatusFilter.value = 'ALL';
            renderAllSlots();
        });
    }

    // Active vehicles search
    const activeVehSearch = document.getElementById('active-vehicle-search');
    if (activeVehSearch) activeVehSearch.addEventListener('input', renderActiveVehicles);

    // History search and filter
    const histSearch = document.getElementById('history-search-input');
    const histTypeFilter = document.getElementById('history-type-filter');
    if (histSearch) histSearch.addEventListener('input', renderHistory);
    if (histTypeFilter) histTypeFilter.addEventListener('change', renderHistory);

    // Release confirm button
    const confirmReleaseBtn = document.getElementById('confirm-release-btn');
    if (confirmReleaseBtn) {
        confirmReleaseBtn.addEventListener('click', handleConfirmRelease);
    }

    // Close modal on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.classList.remove('show');
            }
        });
    });
}
