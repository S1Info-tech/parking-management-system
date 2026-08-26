/**
 * ====================================================================
 * PARK EASE - USER APPLICATION SCRIPT (ENHANCED app.js)
 * ====================================================================
 * Manages SPA navigation, parking grid rendering, daily vehicle check-in,
 * monthly subscription checkout, payment simulation, receipt printing,
 * and subscription lifecycle renewals/cancellations.
 * 
 * Written in simple, clean Vanilla JavaScript with beginner-friendly comments.
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// State for active monthly subscription flow
let selectedPlanId = 'plan_car';
let pendingPaymentPayload = null;
let pendingCancelSubId = null;
let selectedPaymentMethod = 'UPI';

/**
 * Initializes all user application components.
 */
function initApp() {
    setupNavigation();
    setupMobileMenu();
    setupDatePickers();
    setupEventListeners();
    renderAll();

    // Listen for storage events (e.g. cross-tab sync or admin updates)
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
 * Re-renders all dynamic UI sections and counters.
 */
function renderAll() {
    renderStats();
    renderHomeSlots();
    renderAllSlots();
    populateAvailableSlotsDropdown();
    populateMonthlySlotsDropdown();
    renderMonthlyPlans();
    updateMonthlyOrderSummary();
    renderSubscriptionsTable();
    renderPaymentHistoryTable();
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

        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                navLinks.classList.remove('show');
            });
        });
    }
}

function navigateToSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    const navItems = document.querySelectorAll('.nav-links .nav-item');

    let targetSection = document.getElementById(`section-${sectionId}`);
    if (!targetSection) {
        targetSection = document.getElementById('section-home');
        sectionId = 'home';
    }

    sections.forEach(sec => sec.classList.remove('active'));
    targetSection.classList.add('active');

    navItems.forEach(item => {
        const link = item.querySelector('a');
        if (link && link.getAttribute('data-nav') === sectionId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    window.location.hash = sectionId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ====================================================================
// STATISTICS
// ====================================================================

function renderStats() {
    const stats = window.storage.getStats();

    const totalEl = document.getElementById('stat-total-slots');
    const availEl = document.getElementById('stat-available-slots');
    const occEl = document.getElementById('stat-occupied-slots');
    const subsEl = document.getElementById('stat-active-subs');

    const quickAvail = document.getElementById('quick-avail-count');
    const quickOcc = document.getElementById('quick-occ-count');

    if (totalEl) totalEl.textContent = stats.totalSlots;
    if (availEl) availEl.textContent = stats.availableSlots;
    if (occEl) occEl.textContent = stats.occupiedSlots;
    if (subsEl) subsEl.textContent = stats.activeSubscriptions;

    if (quickAvail) quickAvail.textContent = stats.availableSlots;
    if (quickOcc) quickOcc.textContent = stats.occupiedSlots;
}

// ====================================================================
// PARKING GRID & SLOTS
// ====================================================================

function getVehicleIcon(type) {
    if (type === '2-Wheeler') return '🏍️';
    if (type === 'Heavy Vehicle') return '🚌';
    return '🚗';
}

function createSlotCardHTML(slot) {
    const isAvail = slot.status === 'available';
    const isOcc = slot.status === 'occupied';
    const isDis = slot.status === 'disabled';
    const isSub = !!slot.subscriptionId;

    let badgeClass = 'available';
    let badgeText = 'Available';
    let icon = getVehicleIcon(slot.type);

    if (isOcc) {
        badgeClass = isSub ? 'occupied' : 'occupied';
        badgeText = isSub ? 'Monthly Pass' : 'Occupied';
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
                    <button class="btn btn-sm btn-primary" onclick="quickSelectSlotForMonthly('${slot.id}', '${slot.type}')">
                        💳 Subscribe
                    </button>
                ` : ''}
                ${isOcc ? `
                    <button class="btn btn-sm btn-outline" onclick="openSlotDetailsModal('${slot.id}')">
                        ℹ️ Details
                    </button>
                ` : ''}
                ${isDis ? `
                    <button class="btn btn-sm btn-outline" disabled>
                        Maintenance
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function renderHomeSlots() {
    const grid = document.getElementById('home-slots-grid');
    if (!grid) return;
    const slots = window.storage.getSlots();
    grid.innerHTML = slots.length > 0 ? slots.map(createSlotCardHTML).join('') : '<p class="text-muted">No slots found.</p>';
}

function renderAllSlots() {
    const grid = document.getElementById('all-slots-grid');
    if (!grid) return;

    const searchVal = (document.getElementById('slot-search-input')?.value || '').trim().toLowerCase();
    const typeFilter = document.getElementById('slot-type-filter')?.value || 'ALL';
    const statusFilter = document.getElementById('slot-status-filter')?.value || 'ALL';

    let slots = window.storage.getSlots();

    if (searchVal) {
        slots = slots.filter(s => 
            s.id.toLowerCase().includes(searchVal) ||
            s.floor.toLowerCase().includes(searchVal) ||
            (s.vehicleNumber && s.vehicleNumber.toLowerCase().includes(searchVal)) ||
            (s.ownerName && s.ownerName.toLowerCase().includes(searchVal))
        );
    }

    if (typeFilter !== 'ALL') {
        slots = slots.filter(s => s.type === typeFilter);
    }

    if (statusFilter !== 'ALL') {
        slots = slots.filter(s => s.status === statusFilter);
    }

    if (slots.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">🔍</div>
                <h3 class="empty-state-title">No Matching Parking Slots</h3>
                <p class="empty-state-text">Try adjusting your filters.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = slots.map(createSlotCardHTML).join('');
}

// ====================================================================
// DAILY VEHICLE CHECK-IN FORM
// ====================================================================

function populateAvailableSlotsDropdown() {
    const select = document.getElementById('select-parking-slot');
    const selectedType = document.getElementById('select-vehicle-type')?.value || '4-Wheeler';
    if (!select) return;

    const slots = window.storage.getSlots();
    const availableSlots = slots.filter(s => s.status === 'available');

    if (availableSlots.length === 0) {
        select.innerHTML = '<option value="">-- No Slots Available --</option>';
        return;
    }

    let html = '<option value="">-- Select an Available Slot --</option>';
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
        html += `<optgroup label="Other Available Bays">`;
        otherMatches.forEach(s => {
            html += `<option value="${s.id}">${s.id} (${s.floor} - ${s.type})</option>`;
        });
        html += '</optgroup>';
    }

    select.innerHTML = html;
}

function handleDailyParkSubmit(e) {
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

    document.querySelectorAll('#park-vehicle-form .form-text-error').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('#park-vehicle-form .form-control').forEach(el => el.classList.remove('is-invalid'));

    if (!vehicleNumber || vehicleNumber.length < 3) {
        showFieldError('input-vehicle-number', 'error-vehicle-number', 'Please enter a valid vehicle registration number.');
        isValid = false;
    }

    if (!ownerName || ownerName.length < 2) {
        showFieldError('input-owner-name', 'error-owner-name', 'Please enter owner name.');
        isValid = false;
    }

    if (!slotId) {
        showFieldError('select-parking-slot', 'error-parking-slot', 'Please select an available parking slot.');
        isValid = false;
    }

    if (!isValid) return;

    const result = window.storage.parkVehicle({
        slotId,
        vehicleNumber,
        ownerName,
        vehicleType
    });

    if (result.success) {
        vehicleNumberInput.value = '';
        ownerNameInput.value = '';
        showToast(result.message, 'success');
        renderAll();
    } else {
        showToast(result.message, 'error');
    }
}

// ====================================================================
// MONTHLY PARKING & SUBSCRIPTION FLOW
// ====================================================================

function setupDatePickers() {
    const startInput = document.getElementById('sub-start-date');
    const endInput = document.getElementById('sub-end-date');

    if (startInput && endInput) {
        const todayStr = new Date().toISOString().split('T')[0];
        startInput.value = todayStr;
        startInput.min = todayStr;
        calculateSubscriptionEndDate();

        startInput.addEventListener('change', () => {
            calculateSubscriptionEndDate();
            updateMonthlyOrderSummary();
        });
    }
}

function calculateSubscriptionEndDate() {
    const startInput = document.getElementById('sub-start-date');
    const endInput = document.getElementById('sub-end-date');
    if (!startInput || !endInput || !startInput.value) return;

    const plan = window.storage.getPlanById(selectedPlanId) || { durationDays: 30 };
    const start = new Date(startInput.value);
    const end = new Date(start);
    end.setDate(start.getDate() + (plan.durationDays || 30));

    endInput.value = end.toISOString().split('T')[0];
}

function renderMonthlyPlans() {
    const grid = document.getElementById('monthly-plans-grid');
    if (!grid) return;

    const plans = window.storage.getPlans();
    grid.innerHTML = plans.map(p => `
        <div class="plan-card ${p.id === selectedPlanId ? 'selected' : ''}" onclick="selectMonthlyPlan('${p.id}')">
            <div>
                <div class="plan-icon">${p.icon || '🅿️'}</div>
                <div class="plan-name">${p.name}</div>
                <div class="plan-price">${window.storage.formatCurrency(p.price)} <span>/ month</span></div>
                <p class="plan-desc">${p.description || 'Monthly reserved slot'}</p>
            </div>
            <div style="margin-top: 14px;">
                <span class="badge badge-primary">Vehicle: ${p.vehicleType}</span>
            </div>
        </div>
    `).join('');
}

function selectMonthlyPlan(planId) {
    selectedPlanId = planId;
    const plan = window.storage.getPlanById(planId);

    if (plan) {
        const typeSelect = document.getElementById('sub-vehicle-type');
        if (typeSelect) {
            typeSelect.value = plan.vehicleType;
        }
    }

    renderMonthlyPlans();
    populateMonthlySlotsDropdown();
    calculateSubscriptionEndDate();
    updateMonthlyOrderSummary();
}

function populateMonthlySlotsDropdown() {
    const select = document.getElementById('sub-parking-slot');
    const typeSelect = document.getElementById('sub-vehicle-type');
    if (!select) return;

    const selectedType = typeSelect?.value || '4-Wheeler';
    const slots = window.storage.getSlots();
    const availableSlots = slots.filter(s => s.status === 'available');

    if (availableSlots.length === 0) {
        select.innerHTML = '<option value="">-- No Available Slots in Facility --</option>';
        return;
    }

    let html = '<option value="">-- Choose Parking Slot --</option>';
    const exactMatches = availableSlots.filter(s => s.type === selectedType);
    const otherMatches = availableSlots.filter(s => s.type !== selectedType);

    if (exactMatches.length > 0) {
        html += `<optgroup label="Matching ${selectedType}">`;
        exactMatches.forEach(s => {
            html += `<option value="${s.id}">${s.id} (${s.floor} - ${s.type})</option>`;
        });
        html += '</optgroup>';
    }

    if (otherMatches.length > 0) {
        html += `<optgroup label="Other Available Bays">`;
        otherMatches.forEach(s => {
            html += `<option value="${s.id}">${s.id} (${s.floor} - ${s.type})</option>`;
        });
        html += '</optgroup>';
    }

    select.innerHTML = html;
}

function updateMonthlyOrderSummary() {
    const plan = window.storage.getPlanById(selectedPlanId) || { name: 'Monthly Car Parking', price: 1500 };
    const slotSelect = document.getElementById('sub-parking-slot');
    const slotId = slotSelect?.value || 'P-??';

    const titleEl = document.getElementById('summary-plan-title');
    const amountEl = document.getElementById('summary-amount');
    const btnAmountEl = document.getElementById('btn-pay-amount');
    const rangeEl = document.getElementById('summary-date-range');

    const startVal = document.getElementById('sub-start-date')?.value || 'Today';
    const endVal = document.getElementById('sub-end-date')?.value || '+30 Days';

    if (titleEl) titleEl.textContent = `${plan.name} — Slot ${slotId}`;
    if (amountEl) amountEl.textContent = window.storage.formatCurrency(plan.price);
    if (btnAmountEl) btnAmountEl.textContent = plan.price.toLocaleString('en-IN');
    if (rangeEl) rangeEl.textContent = `Valid from ${startVal} to ${endVal}`;
}

function quickSelectSlotForMonthly(slotId, vehicleType) {
    navigateToSection('monthly-parking');
    
    // Choose appropriate plan
    const plans = window.storage.getPlans();
    const matchingPlan = plans.find(p => p.vehicleType === vehicleType) || plans[0];
    if (matchingPlan) {
        selectMonthlyPlan(matchingPlan.id);
    }

    setTimeout(() => {
        const slotSelect = document.getElementById('sub-parking-slot');
        if (slotSelect) slotSelect.value = slotId;
        updateMonthlyOrderSummary();
        document.getElementById('sub-vehicle-number')?.focus();
    }, 100);
}

function handleMonthlySubscribeSubmit(e) {
    e.preventDefault();

    const vehicleNumberInput = document.getElementById('sub-vehicle-number');
    const ownerNameInput = document.getElementById('sub-owner-name');
    const vehicleTypeSelect = document.getElementById('sub-vehicle-type');
    const slotSelect = document.getElementById('sub-parking-slot');
    const startDateInput = document.getElementById('sub-start-date');

    const vehicleNumber = vehicleNumberInput.value.trim();
    const ownerName = ownerNameInput.value.trim();
    const vehicleType = vehicleTypeSelect.value;
    const parkingSlot = slotSelect.value;
    const startDate = startDateInput.value;

    let isValid = true;
    document.querySelectorAll('#monthly-subscribe-form .form-text-error').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('#monthly-subscribe-form .form-control').forEach(el => el.classList.remove('is-invalid'));

    if (!vehicleNumber || vehicleNumber.length < 3) {
        showFieldError('sub-vehicle-number', 'error-sub-vehicle-number', 'Please enter a valid vehicle registration number.');
        isValid = false;
    }

    if (!ownerName || ownerName.length < 2) {
        showFieldError('sub-owner-name', 'error-sub-owner-name', 'Please enter owner name.');
        isValid = false;
    }

    if (!parkingSlot) {
        showFieldError('sub-parking-slot', 'error-sub-parking-slot', 'Please select an available parking slot.');
        isValid = false;
    }

    if (!isValid) return;

    const plan = window.storage.getPlanById(selectedPlanId);

    // Save pending payload for modal checkout
    pendingPaymentPayload = {
        type: 'new_subscription',
        ownerName,
        vehicleNumber,
        vehicleType,
        parkingSlot,
        planId: selectedPlanId,
        planName: plan.name,
        amount: plan.price,
        startDate
    };

    openPaymentModal(pendingPaymentPayload);
}

// ====================================================================
// DEMO PAYMENT MODAL & PROCESSING
// ====================================================================

function openPaymentModal(payload) {
    document.getElementById('modal-pay-amount').textContent = window.storage.formatCurrency(payload.amount);
    document.getElementById('modal-pay-plan').textContent = payload.planName || payload.plan;
    document.getElementById('modal-btn-amount').textContent = payload.amount.toLocaleString('en-IN');

    // Reset tabs to UPI
    switchPaymentTab('UPI');
    openModal('paymentModal');
}

function switchPaymentTab(method) {
    selectedPaymentMethod = method;

    document.querySelectorAll('.pay-tab-btn').forEach(btn => {
        if (btn.getAttribute('data-pay-method') === method) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.querySelectorAll('.payment-method-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    if (method === 'Debit Card' || method === 'Credit Card') {
        document.getElementById('pay-panel-Card')?.classList.add('active');
    } else {
        document.getElementById(`pay-panel-${method}`)?.classList.add('active');
    }
}

function handleConfirmPayment() {
    if (!pendingPaymentPayload) return;

    closeModal('paymentModal');

    if (pendingPaymentPayload.type === 'new_subscription') {
        const result = window.storage.createSubscription({
            ownerName: pendingPaymentPayload.ownerName,
            vehicleNumber: pendingPaymentPayload.vehicleNumber,
            vehicleType: pendingPaymentPayload.vehicleType,
            parkingSlot: pendingPaymentPayload.parkingSlot,
            planId: pendingPaymentPayload.planId,
            startDate: pendingPaymentPayload.startDate,
            paymentMethod: selectedPaymentMethod
        });

        if (result.success) {
            showToast(result.message, 'success');
            // Clear form
            document.getElementById('sub-vehicle-number').value = '';
            document.getElementById('sub-owner-name').value = '';

            // Show printable receipt
            showReceiptModal(result.payment, result.subscription);
            renderAll();
            navigateToSection('my-subscriptions');
        } else {
            showToast(result.message, 'error');
        }
    } else if (pendingPaymentPayload.type === 'renewal') {
        const result = window.storage.renewSubscription(pendingPaymentPayload.subscriptionId, selectedPaymentMethod);
        if (result.success) {
            showToast(result.message, 'success');
            showReceiptModal(result.payment, result.subscription);
            renderAll();
        } else {
            showToast(result.message, 'error');
        }
    }

    pendingPaymentPayload = null;
}

// ====================================================================
// MY SUBSCRIPTIONS TABLE & ACTIONS
// ====================================================================

function renderSubscriptionsTable() {
    const tbody = document.getElementById('subs-tbody');
    const table = document.getElementById('subs-table');
    const emptyMsg = document.getElementById('no-subs-msg');
    if (!tbody) return;

    const searchVal = (document.getElementById('subs-search-input')?.value || '').trim().toLowerCase();
    const statusFilter = document.getElementById('subs-status-filter')?.value || 'ALL';

    let subs = window.storage.getSubscriptions();

    if (searchVal) {
        subs = subs.filter(s => 
            s.subscriptionId.toLowerCase().includes(searchVal) ||
            s.vehicleNumber.toLowerCase().includes(searchVal) ||
            s.ownerName.toLowerCase().includes(searchVal) ||
            s.parkingSlot.toLowerCase().includes(searchVal)
        );
    }

    if (statusFilter !== 'ALL') {
        subs = subs.filter(s => s.status === statusFilter);
    }

    if (subs.length === 0) {
        tbody.innerHTML = '';
        if (table) table.style.display = 'none';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }

    if (table) table.style.display = 'table';
    if (emptyMsg) emptyMsg.style.display = 'none';

    tbody.innerHTML = subs.map(sub => {
        let badgeClass = 'badge-active';
        if (sub.status === 'Expiring Soon') badgeClass = 'badge-expiring';
        if (sub.status === 'Expired') badgeClass = 'badge-expired';
        if (sub.status === 'Cancelled') badgeClass = 'badge-cancelled';

        return `
            <tr>
                <td><strong style="color: var(--primary-dark); font-family: monospace;">${sub.subscriptionId}</strong></td>
                <td><strong>${sub.vehicleNumber}</strong></td>
                <td>${sub.ownerName}</td>
                <td><span class="badge badge-primary">🅿️ ${sub.parkingSlot}</span></td>
                <td>${sub.plan}</td>
                <td><strong>${window.storage.formatCurrency(sub.amount)}</strong></td>
                <td><small>${window.storage.formatDateOnly(sub.startDate)}</small></td>
                <td><small>${window.storage.formatDateOnly(sub.endDate)}</small></td>
                <td><span class="badge ${badgeClass}">${sub.status}</span></td>
                <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 6px;">
                        ${sub.status !== 'Cancelled' ? `
                            <button class="btn btn-sm btn-primary" onclick="initiateRenewSubscription('${sub.subscriptionId}')">
                                🔄 Renew
                            </button>
                            <button class="btn btn-sm btn-outline" style="color: var(--danger);" onclick="initiateCancelSubscription('${sub.subscriptionId}')">
                                ✕
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline" onclick="viewSubscriptionReceipt('${sub.subscriptionId}')">
                            🧾
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function initiateRenewSubscription(subId) {
    const sub = window.storage.getSubscriptionById(subId);
    if (!sub) return;

    const plan = window.storage.getPlanById(sub.planId) || { price: sub.amount, name: sub.plan };

    pendingPaymentPayload = {
        type: 'renewal',
        subscriptionId: sub.subscriptionId,
        ownerName: sub.ownerName,
        vehicleNumber: sub.vehicleNumber,
        parkingSlot: sub.parkingSlot,
        planName: `${sub.plan} (Renewal)`,
        amount: plan.price
    };

    openPaymentModal(pendingPaymentPayload);
}

function initiateCancelSubscription(subId) {
    pendingCancelSubId = subId;
    document.getElementById('cancel-sub-id-display').textContent = subId;
    openModal('cancelSubModal');
}

function handleConfirmCancelSub() {
    if (!pendingCancelSubId) return;

    const result = window.storage.cancelSubscription(pendingCancelSubId, 'User');
    closeModal('cancelSubModal');

    if (result.success) {
        showToast(result.message, 'success');
        renderAll();
    } else {
        showToast(result.message, 'error');
    }

    pendingCancelSubId = null;
}

function viewSubscriptionReceipt(subId) {
    const sub = window.storage.getSubscriptionById(subId);
    if (!sub) return;

    const payments = window.storage.getPayments();
    const payment = payments.find(p => p.subscriptionId === sub.subscriptionId) || {
        paymentId: 'PAY-ONRECORD',
        amount: sub.amount,
        paymentMethod: 'UPI',
        paymentDate: sub.startDate
    };

    showReceiptModal(payment, sub);
}

// ====================================================================
// PAYMENT HISTORY TABLE
// ====================================================================

function renderPaymentHistoryTable() {
    const tbody = document.getElementById('payments-tbody');
    const table = document.getElementById('payments-table');
    const emptyMsg = document.getElementById('no-payments-msg');
    if (!tbody) return;

    const searchVal = (document.getElementById('pay-search-input')?.value || '').trim().toLowerCase();
    const methodFilter = document.getElementById('pay-method-filter')?.value || 'ALL';
    const statusFilter = document.getElementById('pay-status-filter')?.value || 'ALL';

    let payments = window.storage.getPayments();

    if (searchVal) {
        payments = payments.filter(p => 
            p.paymentId.toLowerCase().includes(searchVal) ||
            p.subscriptionId.toLowerCase().includes(searchVal) ||
            p.vehicleNumber.toLowerCase().includes(searchVal) ||
            p.ownerName.toLowerCase().includes(searchVal) ||
            p.parkingSlot.toLowerCase().includes(searchVal)
        );
    }

    if (methodFilter !== 'ALL') {
        payments = payments.filter(p => p.paymentMethod === methodFilter);
    }

    if (statusFilter !== 'ALL') {
        payments = payments.filter(p => p.status === statusFilter);
    }

    if (payments.length === 0) {
        tbody.innerHTML = '';
        if (table) table.style.display = 'none';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }

    if (table) table.style.display = 'table';
    if (emptyMsg) emptyMsg.style.display = 'none';

    tbody.innerHTML = payments.map(pay => `
        <tr>
            <td><strong style="font-family: monospace; color: var(--primary-dark);">${pay.paymentId}</strong></td>
            <td><small style="font-family: monospace;">${pay.subscriptionId}</small></td>
            <td><strong>${pay.vehicleNumber}</strong></td>
            <td><span class="badge badge-primary">🅿️ ${pay.parkingSlot}</span></td>
            <td>${pay.plan}</td>
            <td><strong style="color: var(--success-text);">${window.storage.formatCurrency(pay.amount)}</strong></td>
            <td><span class="badge badge-secondary">${pay.paymentMethod}</span></td>
            <td><small>${window.storage.formatDateOnly(pay.paymentDate)}</small></td>
            <td><span class="badge badge-success">✓ ${pay.status}</span></td>
            <td style="text-align: right;">
                <button class="btn btn-sm btn-outline" onclick="openReceiptFromPayment('${pay.paymentId}')">
                    🧾 View Receipt
                </button>
            </td>
        </tr>
    `).join('');
}

function openReceiptFromPayment(payId) {
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

    showReceiptModal(payment, sub);
}

// ====================================================================
// RECEIPT MODAL
// ====================================================================

function showReceiptModal(payment, sub) {
    document.getElementById('rcpt-pay-id').textContent = payment.paymentId;
    document.getElementById('rcpt-sub-id').textContent = sub.subscriptionId || payment.subscriptionId;
    document.getElementById('rcpt-owner').textContent = payment.ownerName || sub.ownerName;
    document.getElementById('rcpt-veh-no').textContent = payment.vehicleNumber || sub.vehicleNumber;
    document.getElementById('rcpt-veh-type').textContent = sub.vehicleType || '4-Wheeler';
    document.getElementById('rcpt-slot').textContent = payment.parkingSlot || sub.parkingSlot;
    document.getElementById('rcpt-plan').textContent = payment.plan || sub.plan;
    const rcptDate = document.getElementById('rcpt-date');
    if (rcptDate) rcptDate.textContent = window.storage.formatDateOnly(payment.paymentDate || sub.startDate);
    document.getElementById('rcpt-start').textContent = window.storage.formatDateOnly(sub.startDate || payment.paymentDate);
    document.getElementById('rcpt-end').textContent = window.storage.formatDateOnly(sub.endDate || '--');
    document.getElementById('rcpt-method').textContent = payment.paymentMethod || 'UPI';
    document.getElementById('rcpt-amount').textContent = window.storage.formatCurrency(payment.amount);
    document.getElementById('rcpt-timestamp').textContent = new Date().toLocaleString();

    openModal('receiptModal');
}

// ====================================================================
// SLOT DETAILS MODAL
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
    if (slot.status === 'occupied') statusBadge = `<span class="badge badge-danger">Occupied ${slot.subscriptionId ? '(Monthly Pass)' : ''}</span>`;
    if (slot.status === 'disabled') statusBadge = `<span class="badge badge-secondary">Disabled</span>`;

    let html = `
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">Slot ID</div>
                <div class="detail-value">${slot.id}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">${statusBadge}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Floor</div>
                <div class="detail-value">📍 ${slot.floor}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Supported Type</div>
                <div class="detail-value">${getVehicleIcon(slot.type)} ${slot.type}</div>
            </div>
    `;

    if (slot.status === 'occupied') {
        html += `
            <div class="detail-item full-width">
                <div class="detail-label">Parked Vehicle Number</div>
                <div class="detail-value" style="font-size: 1.2rem; color: var(--primary-dark);">${slot.vehicleNumber}</div>
            </div>
            <div class="detail-item full-width">
                <div class="detail-label">Owner Name</div>
                <div class="detail-value">${slot.ownerName || 'Unknown'}</div>
            </div>
            ${slot.subscriptionId ? `
                <div class="detail-item full-width">
                    <div class="detail-label">Linked Subscription</div>
                    <div class="detail-value" style="color: var(--primary); font-family: monospace;">${slot.subscriptionId}</div>
                </div>
            ` : ''}
        `;
    }

    html += `</div>`;
    if (bodyEl) bodyEl.innerHTML = html;

    let footerHTML = `<button class="btn btn-outline" onclick="closeModal('slotDetailModal')">Close</button>`;
    if (slot.status === 'available') {
        footerHTML += `<button class="btn btn-primary" onclick="closeModal('slotDetailModal'); quickSelectSlotForMonthly('${slot.id}', '${slot.type}')">💳 Monthly Subscribe</button>`;
    }

    if (footerEl) footerEl.innerHTML = footerHTML;
    openModal('slotDetailModal');
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

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
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

function setupEventListeners() {
    // Daily Park form
    const parkForm = document.getElementById('park-vehicle-form');
    if (parkForm) parkForm.addEventListener('submit', handleDailyParkSubmit);

    // Monthly Subscribe form
    const monthlyForm = document.getElementById('monthly-subscribe-form');
    if (monthlyForm) monthlyForm.addEventListener('submit', handleMonthlySubscribeSubmit);

    // Vehicle Type change in daily park
    const vehTypeSelect = document.getElementById('select-vehicle-type');
    if (vehTypeSelect) vehTypeSelect.addEventListener('change', populateAvailableSlotsDropdown);

    // Vehicle Type change in monthly subscribe
    const subVehType = document.getElementById('sub-vehicle-type');
    if (subVehType) {
        subVehType.addEventListener('change', () => {
            populateMonthlySlotsDropdown();
            updateMonthlyOrderSummary();
        });
    }

    // Slot select change in monthly
    const subSlotSelect = document.getElementById('sub-parking-slot');
    if (subSlotSelect) subSlotSelect.addEventListener('change', updateMonthlyOrderSummary);

    // Slot search & filters
    const slotSearch = document.getElementById('slot-search-input');
    const slotTypeFilter = document.getElementById('slot-type-filter');
    const slotStatusFilter = document.getElementById('slot-status-filter');
    const resetSlotFilter = document.getElementById('reset-slot-filter-btn');

    if (slotSearch) slotSearch.addEventListener('input', renderAllSlots);
    if (slotTypeFilter) slotTypeFilter.addEventListener('change', renderAllSlots);
    if (slotStatusFilter) slotStatusFilter.addEventListener('change', renderAllSlots);
    if (resetSlotFilter) {
        resetSlotFilter.addEventListener('click', () => {
            if (slotSearch) slotSearch.value = '';
            if (slotTypeFilter) slotTypeFilter.value = 'ALL';
            if (slotStatusFilter) slotStatusFilter.value = 'ALL';
            renderAllSlots();
        });
    }

    // Subscriptions search & filters
    const subsSearch = document.getElementById('subs-search-input');
    const subsStatusFilter = document.getElementById('subs-status-filter');
    if (subsSearch) subsSearch.addEventListener('input', renderSubscriptionsTable);
    if (subsStatusFilter) subsStatusFilter.addEventListener('change', renderSubscriptionsTable);

    // Payments search & filters
    const paySearch = document.getElementById('pay-search-input');
    const payMethodFilter = document.getElementById('pay-method-filter');
    const payStatusFilter = document.getElementById('pay-status-filter');
    if (paySearch) paySearch.addEventListener('input', renderPaymentHistoryTable);
    if (payMethodFilter) payMethodFilter.addEventListener('change', renderPaymentHistoryTable);
    if (payStatusFilter) payStatusFilter.addEventListener('change', renderPaymentHistoryTable);

    // Payment modal tabs
    document.querySelectorAll('.pay-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const method = btn.getAttribute('data-pay-method');
            if (method) switchPaymentTab(method);
        });
    });

    // Confirm payment button in modal
    const confirmPayBtn = document.getElementById('confirm-payment-btn');
    if (confirmPayBtn) confirmPayBtn.addEventListener('click', handleConfirmPayment);

    // Confirm cancel subscription button
    const confirmCancelBtn = document.getElementById('confirm-cancel-sub-btn');
    if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', handleConfirmCancelSub);

    // Backdrop dismissal
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                backdrop.classList.remove('show');
            }
        });
    });
}
