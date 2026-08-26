/**
 * ====================================================================
 * STORAGE SERVICE (storage.js)
 * ====================================================================
 * Handles all data persistence using browser LocalStorage.
 * Provides easy-to-use CRUD functions for parking slots, parked
 * vehicles, parking history, and demo admin authentication.
 * 
 * Written in simple, clean Vanilla JavaScript with beginner-friendly comments.
 */

const STORAGE_KEYS = {
    SLOTS: 'pms_parking_slots',
    HISTORY: 'pms_parking_history',
    ADMIN_SESSION: 'pms_admin_session'
};

// Default sample data seeded on the very first run
const INITIAL_SLOTS = [
    { id: 'P-01', floor: 'Ground Floor', type: '4-Wheeler', status: 'available', vehicleNumber: null, ownerName: null, parkedAt: null },
    { id: 'P-02', floor: 'Ground Floor', type: '4-Wheeler', status: 'available', vehicleNumber: null, ownerName: null, parkedAt: null },
    { id: 'P-03', floor: 'Ground Floor', type: '4-Wheeler', status: 'occupied', vehicleNumber: 'KA-01-MJ-5021', ownerName: 'Rahul Sharma', parkedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
    { id: 'P-04', floor: 'Ground Floor', type: '4-Wheeler', status: 'available', vehicleNumber: null, ownerName: null, parkedAt: null },
    { id: 'P-05', floor: 'Ground Floor', type: '2-Wheeler', status: 'available', vehicleNumber: null, ownerName: null, parkedAt: null },
    { id: 'P-06', floor: 'Ground Floor', type: '2-Wheeler', status: 'occupied', vehicleNumber: 'DL-04-TC-8890', ownerName: 'Priya Verma', parkedAt: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString() },
    { id: 'P-07', floor: '1st Floor', type: '4-Wheeler', status: 'available', vehicleNumber: null, ownerName: null, parkedAt: null },
    { id: 'P-08', floor: '1st Floor', type: '4-Wheeler', status: 'available', vehicleNumber: null, ownerName: null, parkedAt: null },
    { id: 'P-09', floor: '1st Floor', type: 'Heavy Vehicle', status: 'available', vehicleNumber: null, ownerName: null, parkedAt: null },
    { id: 'P-10', floor: '1st Floor', type: '2-Wheeler', status: 'available', vehicleNumber: null, ownerName: null, parkedAt: null },
    { id: 'P-11', floor: 'Basement', type: '4-Wheeler', status: 'occupied', vehicleNumber: 'MH-12-PQ-9090', ownerName: 'Amit Patel', parkedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
    { id: 'P-12', floor: 'Basement', type: 'Heavy Vehicle', status: 'disabled', vehicleNumber: null, ownerName: null, parkedAt: null }
];

const INITIAL_HISTORY = [
    {
        id: 'HIST-1001',
        vehicleNumber: 'MH-02-CD-3321',
        ownerName: 'Vikram Singh',
        vehicleType: '4-Wheeler',
        slotId: 'P-01',
        parkedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        releasedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
        duration: '4 hrs 00 mins',
        releasedBy: 'User'
    },
    {
        id: 'HIST-1002',
        vehicleNumber: 'KA-05-AB-1100',
        ownerName: 'Ananya Roy',
        vehicleType: '2-Wheeler',
        slotId: 'P-05',
        parkedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
        releasedAt: new Date(Date.now() - 16.5 * 3600 * 1000).toISOString(),
        duration: '1 hr 30 mins',
        releasedBy: 'Admin'
    },
    {
        id: 'HIST-1003',
        vehicleNumber: 'TS-09-ZX-7865',
        ownerName: 'Suresh Menon',
        vehicleType: 'Heavy Vehicle',
        slotId: 'P-09',
        parkedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
        releasedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        duration: '4 hrs 00 mins',
        releasedBy: 'User'
    }
];

class StorageService {
    constructor() {
        this.initStorage();
    }

    /**
     * Initializes storage with sample data if first time running.
     */
    initStorage() {
        if (!localStorage.getItem(STORAGE_KEYS.SLOTS)) {
            localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(INITIAL_SLOTS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(INITIAL_HISTORY));
        }
    }

    /**
     * Resets data to initial sample dataset.
     */
    resetToDefaultData() {
        localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(INITIAL_SLOTS));
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(INITIAL_HISTORY));
        this.dispatchUpdateEvent();
    }

    /**
     * Dispatches a custom event so other components or tabs can re-render immediately.
     */
    dispatchUpdateEvent() {
        window.dispatchEvent(new CustomEvent('pms-data-updated'));
    }

    // ==========================================
    // PARKING SLOTS METHODS
    // ==========================================

    /**
     * Get all parking slots.
     * @returns {Array} Array of parking slot objects.
     */
    getSlots() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SLOTS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading slots from localStorage', e);
            return [];
        }
    }

    /**
     * Save slots array to localStorage.
     * @param {Array} slots 
     */
    saveSlots(slots) {
        localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
        this.dispatchUpdateEvent();
    }

    /**
     * Get a specific slot by its ID (e.g. 'P-01').
     * @param {string} slotId 
     * @returns {Object|null}
     */
    getSlotById(slotId) {
        const slots = this.getSlots();
        return slots.find(s => s.id.toUpperCase() === slotId.toUpperCase()) || null;
    }

    /**
     * Add a new parking slot.
     * @param {Object} slotData { id, floor, type, status }
     * @returns {Object} { success: boolean, message: string }
     */
    addSlot(slotData) {
        const slots = this.getSlots();
        const cleanId = slotData.id.trim().toUpperCase();

        if (!cleanId) {
            return { success: false, message: 'Slot ID is required (e.g. P-13).' };
        }

        // Check if ID already exists
        const exists = slots.some(s => s.id.toUpperCase() === cleanId);
        if (exists) {
            return { success: false, message: `Slot "${cleanId}" already exists! Please use a unique Slot ID.` };
        }

        const newSlot = {
            id: cleanId,
            floor: slotData.floor || 'Ground Floor',
            type: slotData.type || '4-Wheeler',
            status: slotData.status || 'available',
            vehicleNumber: null,
            ownerName: null,
            parkedAt: null
        };

        slots.push(newSlot);
        this.saveSlots(slots);
        return { success: true, message: `Slot ${cleanId} added successfully.`, slot: newSlot };
    }

    /**
     * Update an existing slot's status (e.g. 'available', 'disabled').
     * @param {string} slotId 
     * @param {string} newStatus 
     * @returns {Object} { success: boolean, message: string }
     */
    updateSlotStatus(slotId, newStatus) {
        const slots = this.getSlots();
        const index = slots.findIndex(s => s.id.toUpperCase() === slotId.toUpperCase());

        if (index === -1) {
            return { success: false, message: 'Slot not found.' };
        }

        if (slots[index].status === 'occupied' && newStatus === 'disabled') {
            return { success: false, message: 'Cannot disable a slot while a vehicle is parked in it! Please release the vehicle first.' };
        }

        slots[index].status = newStatus;
        this.saveSlots(slots);
        return { success: true, message: `Slot ${slotId} status updated to ${newStatus}.` };
    }

    /**
     * Delete a parking slot.
     * @param {string} slotId 
     * @returns {Object} { success: boolean, message: string }
     */
    deleteSlot(slotId) {
        const slots = this.getSlots();
        const index = slots.findIndex(s => s.id.toUpperCase() === slotId.toUpperCase());

        if (index === -1) {
            return { success: false, message: 'Slot not found.' };
        }

        if (slots[index].status === 'occupied') {
            return { success: false, message: 'Cannot delete an occupied slot! Please release the vehicle first.' };
        }

        const deleted = slots.splice(index, 1);
        this.saveSlots(slots);
        return { success: true, message: `Slot ${deleted[0].id} deleted successfully.` };
    }

    // ==========================================
    // VEHICLE PARKING & RELEASE OPERATIONS
    // ==========================================

    /**
     * Park a vehicle in an available slot.
     * @param {Object} param0 { slotId, vehicleNumber, ownerName, vehicleType }
     * @returns {Object} { success: boolean, message: string }
     */
    parkVehicle({ slotId, vehicleNumber, ownerName, vehicleType }) {
        const slots = this.getSlots();

        // 1. Validation
        if (!slotId || !vehicleNumber || !ownerName || !vehicleType) {
            return { success: false, message: 'Please fill in all required fields.' };
        }

        const cleanVehicleNumber = vehicleNumber.trim().toUpperCase();
        const cleanOwnerName = ownerName.trim();
        const cleanSlotId = slotId.trim().toUpperCase();

        // 2. Check if vehicle is already parked in any slot
        const duplicateVehicleSlot = slots.find(s => 
            s.status === 'occupied' && 
            s.vehicleNumber && 
            s.vehicleNumber.toUpperCase() === cleanVehicleNumber
        );

        if (duplicateVehicleSlot) {
            return { 
                success: false, 
                message: `Vehicle "${cleanVehicleNumber}" is already parked in Slot ${duplicateVehicleSlot.id}!` 
            };
        }

        // 3. Find the target slot
        const slotIndex = slots.findIndex(s => s.id.toUpperCase() === cleanSlotId);
        if (slotIndex === -1) {
            return { success: false, message: `Slot "${cleanSlotId}" does not exist.` };
        }

        const targetSlot = slots[slotIndex];

        // 4. Check slot availability
        if (targetSlot.status === 'occupied') {
            return { success: false, message: `Slot ${cleanSlotId} is already occupied by vehicle ${targetSlot.vehicleNumber}!` };
        }
        if (targetSlot.status === 'disabled') {
            return { success: false, message: `Slot ${cleanSlotId} is currently disabled/under maintenance.` };
        }

        // 5. Update slot with vehicle info
        const now = new Date().toISOString();
        targetSlot.status = 'occupied';
        targetSlot.vehicleNumber = cleanVehicleNumber;
        targetSlot.ownerName = cleanOwnerName;
        targetSlot.type = vehicleType; // Match or override with current vehicle type
        targetSlot.parkedAt = now;

        slots[slotIndex] = targetSlot;
        this.saveSlots(slots);

        return { 
            success: true, 
            message: `Vehicle ${cleanVehicleNumber} parked successfully in Slot ${cleanSlotId}!`,
            slot: targetSlot 
        };
    }

    /**
     * Release/remove a parked vehicle from a slot and record history.
     * @param {string} slotId 
     * @param {string} releasedBy 'User' or 'Admin'
     * @returns {Object} { success: boolean, message: string, historyRecord: Object }
     */
    releaseVehicle(slotId, releasedBy = 'User') {
        const slots = this.getSlots();
        const slotIndex = slots.findIndex(s => s.id.toUpperCase() === slotId.toUpperCase());

        if (slotIndex === -1) {
            return { success: false, message: 'Slot not found.' };
        }

        const slot = slots[slotIndex];
        if (slot.status !== 'occupied' || !slot.vehicleNumber) {
            return { success: false, message: `Slot ${slotId} does not have any parked vehicle to release.` };
        }

        const parkedAtTime = new Date(slot.parkedAt || Date.now());
        const releasedAtTime = new Date();
        const durationMs = Math.max(0, releasedAtTime.getTime() - parkedAtTime.getTime());
        const durationFormatted = this.formatDuration(durationMs);

        // Create history record
        const historyRecord = {
            id: 'HIST-' + Math.floor(1000 + Math.random() * 9000),
            vehicleNumber: slot.vehicleNumber,
            ownerName: slot.ownerName || 'Unknown',
            vehicleType: slot.type,
            slotId: slot.id,
            parkedAt: slot.parkedAt,
            releasedAt: releasedAtTime.toISOString(),
            duration: durationFormatted,
            releasedBy: releasedBy
        };

        // Add to history
        this.addHistoryRecord(historyRecord);

        // Reset slot
        const freedVehicleNumber = slot.vehicleNumber;
        slot.status = 'available';
        slot.vehicleNumber = null;
        slot.ownerName = null;
        slot.parkedAt = null;

        slots[slotIndex] = slot;
        this.saveSlots(slots);

        return {
            success: true,
            message: `Vehicle ${freedVehicleNumber} released from Slot ${slot.id}.`,
            historyRecord: historyRecord
        };
    }

    // ==========================================
    // PARKING HISTORY METHODS
    // ==========================================

    /**
     * Get all parking history logs.
     * @returns {Array} Array of history records sorted newest first.
     */
    getHistory() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
            const list = data ? JSON.parse(data) : [];
            return list.sort((a, b) => new Date(b.releasedAt) - new Date(a.releasedAt));
        } catch (e) {
            console.error('Error reading history from localStorage', e);
            return [];
        }
    }

    /**
     * Append a record to history.
     * @param {Object} record 
     */
    addHistoryRecord(record) {
        const history = this.getHistory();
        history.unshift(record);
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    }

    /**
     * Clear all parking history.
     */
    clearHistory() {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
        this.dispatchUpdateEvent();
    }

    // ==========================================
    // STATISTICS & METRICS
    // ==========================================

    /**
     * Compute real-time dashboard statistics.
     * @returns {Object} Stats object
     */
    getStats() {
        const slots = this.getSlots();
        const history = this.getHistory();

        const totalSlots = slots.length;
        const availableSlots = slots.filter(s => s.status === 'available').length;
        const occupiedSlots = slots.filter(s => s.status === 'occupied').length;
        const disabledSlots = slots.filter(s => s.status === 'disabled').length;
        const totalVehicles = occupiedSlots; // Currently parked

        return {
            totalSlots,
            availableSlots,
            occupiedSlots,
            disabledSlots,
            totalVehicles,
            historyCount: history.length
        };
    }

    // ==========================================
    // ADMIN AUTHENTICATION
    // ==========================================

    /**
     * Verify admin credentials.
     * @param {string} username 
     * @param {string} password 
     * @returns {Object} { success: boolean, message: string }
     */
    adminLogin(username, password) {
        const cleanUser = (username || '').trim();
        const cleanPass = (password || '').trim();

        if (cleanUser === 'admin' && cleanPass === 'admin123') {
            const session = {
                username: 'admin',
                role: 'Administrator',
                loggedInAt: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
            return { success: true, message: 'Login successful! Welcome Admin.' };
        }

        return { success: false, message: 'Invalid username or password! (Demo: admin / admin123)' };
    }

    /**
     * Check if admin is currently logged in.
     * @returns {boolean}
     */
    isAdminLoggedIn() {
        try {
            const session = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
            return !!session;
        } catch (e) {
            return false;
        }
    }

    /**
     * Logout admin.
     */
    adminLogout() {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    }

    // ==========================================
    // UTILITY & FORMATTING HELPERS
    // ==========================================

    /**
     * Format milliseconds into human-friendly duration.
     * @param {number} ms 
     * @returns {string}
     */
    formatDuration(ms) {
        if (!ms || ms < 0) return 'Just now';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        if (hours === 0 && minutes === 0) {
            return '< 1 min';
        }
        if (hours === 0) {
            return `${minutes} min${minutes > 1 ? 's' : ''}`;
        }
        return `${hours} hr${hours > 1 ? 's' : ''} ${minutes.toString().padStart(2, '0')} mins`;
    }

    /**
     * Format ISO date string into readable date and time.
     * @param {string} isoString 
     * @returns {string}
     */
    formatDateTime(isoString) {
        if (!isoString) return '--';
        try {
            const date = new Date(isoString);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return isoString;
        }
    }
}

// Global instance accessible in both user and admin scripts
window.storage = new StorageService();
