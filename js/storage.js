/**
 * ====================================================================
 * STORAGE SERVICE (storage.js)
 * ====================================================================
 * Handles all data persistence using browser LocalStorage.
 * Manages parking slots, active parked vehicles, monthly subscriptions,
 * simulated payment transactions, parking history, and admin auth.
 * 
 * Written in simple, clean Vanilla JavaScript with beginner-friendly comments.
 */

const STORAGE_KEYS = {
    SLOTS: 'pms_parking_slots',
    HISTORY: 'pms_parking_history',
    PLANS: 'pms_parking_plans',
    SUBSCRIPTIONS: 'pms_subscriptions',
    PAYMENTS: 'pms_payments',
    ADMIN_SESSION: 'pms_admin_session'
};

// Default monthly parking subscription plans
const INITIAL_PLANS = [
    { id: 'plan_bike', name: 'Bike Monthly Parking', vehicleType: '2-Wheeler', price: 500, durationDays: 30, icon: '🏍️', description: 'Dedicated two-wheeler bay with 24/7 access' },
    { id: 'plan_car', name: 'Car Monthly Parking', vehicleType: '4-Wheeler', price: 1500, durationDays: 30, icon: '🚗', description: 'Standard covered car slot with daily security' },
    { id: 'plan_premium', name: 'Premium Car Parking', vehicleType: '4-Wheeler', price: 2000, durationDays: 30, icon: '⭐', description: 'Prime front-row wide bay with priority access' },
    { id: 'plan_heavy', name: 'Heavy Vehicle Monthly', vehicleType: 'Heavy Vehicle', price: 3000, durationDays: 30, icon: '🚌', description: 'Spacious oversized bay for buses, vans & trucks' }
];

// Default sample parking slots
const INITIAL_SLOTS = [
    { id: 'P-01', floor: 'Ground Floor', type: '4-Wheeler', status: 'available', vehicleNumber: null, ownerName: null, parkedAt: null, subscriptionId: null },
    { id: 'P-02', floor: 'Ground Floor', type: '4-Wheeler', status: 'available', vehicleNumber: null, ownerName: null, parkedAt: null, subscriptionId: null },
    { id: 'P-03', floor: 'Ground Floor', type: '4-Wheeler', status: 'occupied', vehicleNumber: 'KA-01-MJ-5021', ownerName: 'Rahul Sharma', parkedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), subscriptionId: null },
    { id: 'P-04', floor: 'Ground Floor', type: '4-Wheeler', status: 'occupied', vehicleNumber: 'MH-12-AB-1234', ownerName: 'John Fernandes', parkedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), subscriptionId: 'SUB202608150001' },
    { id: 'P-05', floor: 'Ground Floor', type: '2-Wheeler', status: 'occupied', vehicleNumber: 'DL-01-BK-9900', ownerName: 'Sneha Kapur', parkedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), subscriptionId: 'SUB202608200002' },
    { id: 'P-06', floor: 'Ground Floor', type: '2-Wheeler', status: 'occupied', vehicleNumber: 'DL-04-TC-8890', ownerName: 'Priya Verma', parkedAt: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(), subscriptionId: null },
    { id: 'P-07', floor: '1st Floor', type: '4-Wheeler', status: 'available', vehicleNumber: null, ownerName: null, parkedAt: null, subscriptionId: null },
    { id: 'P-08', floor: '1st Floor', type: '4-Wheeler', status: 'available', vehicleNumber: null, ownerName: null, parkedAt: null, subscriptionId: null },
    { id: 'P-09', floor: '1st Floor', type: 'Heavy Vehicle', status: 'available', vehicleNumber: null, ownerName: null, parkedAt: null, subscriptionId: null },
    { id: 'P-10', floor: '1st Floor', type: '2-Wheeler', status: 'available', vehicleNumber: null, ownerName: null, parkedAt: null, subscriptionId: null },
    { id: 'P-11', floor: 'Basement', type: '4-Wheeler', status: 'occupied', vehicleNumber: 'MH-12-PQ-9090', ownerName: 'Amit Patel', parkedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), subscriptionId: null },
    { id: 'P-12', floor: 'Basement', type: 'Heavy Vehicle', status: 'disabled', vehicleNumber: null, ownerName: null, parkedAt: null, subscriptionId: null }
];

// Helper to get formatted ISO date YYYY-MM-DD
function getOffsetDateStr(offsetDays) {
    const d = new Date(Date.now() + offsetDays * 24 * 3600 * 1000);
    return d.toISOString().split('T')[0];
}

// Default sample subscriptions
const INITIAL_SUBSCRIPTIONS = [
    {
        subscriptionId: 'SUB202608150001',
        ownerName: 'John Fernandes',
        vehicleNumber: 'MH-12-AB-1234',
        vehicleType: '4-Wheeler',
        parkingSlot: 'P-04',
        plan: 'Monthly Car Parking',
        planId: 'plan_car',
        amount: 1500,
        startDate: getOffsetDateStr(-10),
        endDate: getOffsetDateStr(20), // 20 days left -> Active
        status: 'Active',
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    },
    {
        subscriptionId: 'SUB202608200002',
        ownerName: 'Sneha Kapur',
        vehicleNumber: 'DL-01-BK-9900',
        vehicleType: '2-Wheeler',
        parkingSlot: 'P-05',
        plan: 'Bike Monthly Parking',
        planId: 'plan_bike',
        amount: 500,
        startDate: getOffsetDateStr(-27),
        endDate: getOffsetDateStr(3), // 3 days left -> Expiring Soon
        status: 'Expiring Soon',
        createdAt: new Date(Date.now() - 27 * 24 * 3600 * 1000).toISOString()
    },
    {
        subscriptionId: 'SUB202607100003',
        ownerName: 'Manish Gupta',
        vehicleNumber: 'KA-03-ZZ-4411',
        vehicleType: '4-Wheeler',
        parkingSlot: 'P-07',
        plan: 'Premium Car Parking',
        planId: 'plan_premium',
        amount: 2000,
        startDate: getOffsetDateStr(-45),
        endDate: getOffsetDateStr(-15), // Expired
        status: 'Expired',
        createdAt: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString()
    }
];

// Default sample payments
const INITIAL_PAYMENTS = [
    {
        paymentId: 'PAY202608150001',
        subscriptionId: 'SUB202608150001',
        ownerName: 'John Fernandes',
        vehicleNumber: 'MH-12-AB-1234',
        parkingSlot: 'P-04',
        plan: 'Monthly Car Parking',
        amount: 1500,
        paymentMethod: 'UPI',
        paymentDate: getOffsetDateStr(-10),
        status: 'Successful',
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    },
    {
        paymentId: 'PAY202608200002',
        subscriptionId: 'SUB202608200002',
        ownerName: 'Sneha Kapur',
        vehicleNumber: 'DL-01-BK-9900',
        parkingSlot: 'P-05',
        plan: 'Bike Monthly Parking',
        amount: 500,
        paymentMethod: 'Debit Card',
        paymentDate: getOffsetDateStr(-27),
        status: 'Successful',
        createdAt: new Date(Date.now() - 27 * 24 * 3600 * 1000).toISOString()
    },
    {
        paymentId: 'PAY202607100003',
        subscriptionId: 'SUB202607100003',
        ownerName: 'Manish Gupta',
        vehicleNumber: 'KA-03-ZZ-4411',
        parkingSlot: 'P-07',
        plan: 'Premium Car Parking',
        amount: 2000,
        paymentMethod: 'Credit Card',
        paymentDate: getOffsetDateStr(-45),
        status: 'Successful',
        createdAt: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString()
    },
    {
        paymentId: 'PAY202608260004',
        subscriptionId: 'SUB202608260004',
        ownerName: 'Vikram Singh',
        vehicleNumber: 'MH-02-CD-3321',
        parkingSlot: 'P-01',
        plan: 'Monthly Car Parking',
        amount: 1500,
        paymentMethod: 'UPI',
        paymentDate: getOffsetDateStr(0),
        status: 'Successful',
        createdAt: new Date().toISOString()
    }
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
        if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
            localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS)) {
            localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(INITIAL_SUBSCRIPTIONS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
            localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
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
        localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS));
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(INITIAL_SUBSCRIPTIONS));
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
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
    // PLANS CONFIGURATION
    // ==========================================

    getPlans() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.PLANS);
            return data ? JSON.parse(data) : INITIAL_PLANS;
        } catch (e) {
            return INITIAL_PLANS;
        }
    }

    getPlanById(planId) {
        const plans = this.getPlans();
        return plans.find(p => p.id === planId) || null;
    }

    updatePlanPrice(planId, newPrice) {
        const plans = this.getPlans();
        const plan = plans.find(p => p.id === planId);
        if (plan) {
            plan.price = Number(newPrice);
            localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
            this.dispatchUpdateEvent();
            return { success: true, message: `Plan "${plan.name}" price updated to ₹${plan.price}.` };
        }
        return { success: false, message: 'Plan not found.' };
    }

    // ==========================================
    // PARKING SLOTS
    // ==========================================

    getSlots() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SLOTS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading slots', e);
            return [];
        }
    }

    saveSlots(slots) {
        localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
        this.dispatchUpdateEvent();
    }

    getSlotById(slotId) {
        const slots = this.getSlots();
        return slots.find(s => s.id.toUpperCase() === (slotId || '').toUpperCase()) || null;
    }

    addSlot(slotData) {
        const slots = this.getSlots();
        const cleanId = (slotData.id || '').trim().toUpperCase();

        if (!cleanId) {
            return { success: false, message: 'Slot ID is required (e.g. P-13).' };
        }

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
            parkedAt: null,
            subscriptionId: null
        };

        slots.push(newSlot);
        this.saveSlots(slots);
        return { success: true, message: `Slot ${cleanId} added successfully.`, slot: newSlot };
    }

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
    // VEHICLE PARKING & RELEASE
    // ==========================================

    parkVehicle({ slotId, vehicleNumber, ownerName, vehicleType, subscriptionId = null }) {
        const slots = this.getSlots();

        if (!slotId || !vehicleNumber || !ownerName || !vehicleType) {
            return { success: false, message: 'Please fill in all required fields.' };
        }

        const cleanVehicleNumber = vehicleNumber.trim().toUpperCase();
        const cleanOwnerName = ownerName.trim();
        const cleanSlotId = slotId.trim().toUpperCase();

        // Check if vehicle is already parked in any slot
        const duplicateSlot = slots.find(s => 
            s.status === 'occupied' && 
            s.vehicleNumber && 
            s.vehicleNumber.toUpperCase() === cleanVehicleNumber
        );

        if (duplicateSlot) {
            return { 
                success: false, 
                message: `Vehicle "${cleanVehicleNumber}" is already parked in Slot ${duplicateSlot.id}!` 
            };
        }

        const slotIndex = slots.findIndex(s => s.id.toUpperCase() === cleanSlotId);
        if (slotIndex === -1) {
            return { success: false, message: `Slot "${cleanSlotId}" does not exist.` };
        }

        const targetSlot = slots[slotIndex];

        if (targetSlot.status === 'occupied') {
            return { success: false, message: `Slot ${cleanSlotId} is already occupied by vehicle ${targetSlot.vehicleNumber}!` };
        }
        if (targetSlot.status === 'disabled') {
            return { success: false, message: `Slot ${cleanSlotId} is currently disabled/under maintenance.` };
        }

        const now = new Date().toISOString();
        targetSlot.status = 'occupied';
        targetSlot.vehicleNumber = cleanVehicleNumber;
        targetSlot.ownerName = cleanOwnerName;
        targetSlot.type = vehicleType;
        targetSlot.parkedAt = now;
        targetSlot.subscriptionId = subscriptionId;

        slots[slotIndex] = targetSlot;
        this.saveSlots(slots);

        return { 
            success: true, 
            message: `Vehicle ${cleanVehicleNumber} parked successfully in Slot ${cleanSlotId}!`,
            slot: targetSlot 
        };
    }

    releaseVehicle(slotId, releasedBy = 'User') {
        const slots = this.getSlots();
        const slotIndex = slots.findIndex(s => s.id.toUpperCase() === slotId.toUpperCase());

        if (slotIndex === -1) {
            return { success: false, message: 'Slot not found.' };
        }

        const slot = slots[slotIndex];
        if (slot.status !== 'occupied' || !slot.vehicleNumber) {
            return { success: false, message: `Slot ${slotId} has no parked vehicle to release.` };
        }

        const parkedAtTime = new Date(slot.parkedAt || Date.now());
        const releasedAtTime = new Date();
        const durationMs = Math.max(0, releasedAtTime.getTime() - parkedAtTime.getTime());
        const durationFormatted = this.formatDuration(durationMs);

        const historyRecord = {
            id: 'HIST-' + Math.floor(1000 + Math.random() * 9000),
            vehicleNumber: slot.vehicleNumber,
            ownerName: slot.ownerName || 'Unknown',
            vehicleType: slot.type,
            slotId: slot.id,
            parkedAt: slot.parkedAt,
            releasedAt: releasedAtTime.toISOString(),
            duration: durationFormatted,
            releasedBy: releasedBy,
            subscriptionId: slot.subscriptionId || null
        };

        this.addHistoryRecord(historyRecord);

        const freedVehicleNumber = slot.vehicleNumber;
        slot.status = 'available';
        slot.vehicleNumber = null;
        slot.ownerName = null;
        slot.parkedAt = null;
        slot.subscriptionId = null;

        slots[slotIndex] = slot;
        this.saveSlots(slots);

        return {
            success: true,
            message: `Vehicle ${freedVehicleNumber} released from Slot ${slot.id}.`,
            historyRecord: historyRecord
        };
    }

    // ==========================================
    // SUBSCRIPTION LIFECYCLE & OPERATIONS
    // ==========================================

    /**
     * Determines the live status of a subscription based on its end date and current status.
     * Statuses: 'Active', 'Expiring Soon' (<= 5 days), 'Expired', 'Cancelled'
     */
    computeSubscriptionStatus(sub) {
        if (sub.status === 'Cancelled') {
            return 'Cancelled';
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const end = new Date(sub.endDate);
        end.setHours(0, 0, 0, 0);

        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return 'Expired';
        } else if (diffDays <= 5) {
            return 'Expiring Soon';
        } else {
            return 'Active';
        }
    }

    getSubscriptions() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
            const list = data ? JSON.parse(data) : [];
            // Dynamically refresh status for each subscription
            return list.map(sub => {
                const computed = this.computeSubscriptionStatus(sub);
                return { ...sub, status: computed };
            }).sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));
        } catch (e) {
            console.error('Error reading subscriptions', e);
            return [];
        }
    }

    getSubscriptionById(subId) {
        const subs = this.getSubscriptions();
        return subs.find(s => s.subscriptionId.toUpperCase() === (subId || '').toUpperCase()) || null;
    }

    createSubscription({ ownerName, vehicleNumber, vehicleType, parkingSlot, planId, startDate, paymentMethod }) {
        const plan = this.getPlanById(planId);
        if (!plan) {
            return { success: false, message: 'Invalid subscription plan selected.' };
        }

        const cleanVehicleNumber = vehicleNumber.trim().toUpperCase();
        const cleanOwnerName = ownerName.trim();
        const cleanSlot = parkingSlot.trim().toUpperCase();

        // Generate unique IDs
        const timestampCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const subId = `SUB${timestampCode}${randomNum}`;
        const payId = `PAY${timestampCode}${randomNum}`;

        // Compute end date: 30 days from startDate
        const start = new Date(startDate || Date.now());
        const end = new Date(start);
        end.setDate(start.getDate() + (plan.durationDays || 30));
        const endDateStr = end.toISOString().split('T')[0];
        const startDateStr = start.toISOString().split('T')[0];

        // 1. Park the vehicle in slot
        const parkResult = this.parkVehicle({
            slotId: cleanSlot,
            vehicleNumber: cleanVehicleNumber,
            ownerName: cleanOwnerName,
            vehicleType: vehicleType,
            subscriptionId: subId
        });

        if (!parkResult.success) {
            return parkResult;
        }

        // 2. Create Subscription object
        const newSub = {
            subscriptionId: subId,
            ownerName: cleanOwnerName,
            vehicleNumber: cleanVehicleNumber,
            vehicleType: vehicleType,
            parkingSlot: cleanSlot,
            plan: plan.name,
            planId: plan.id,
            amount: plan.price,
            startDate: startDateStr,
            endDate: endDateStr,
            status: 'Active',
            createdAt: new Date().toISOString()
        };

        const subs = this.getSubscriptions();
        subs.unshift(newSub);
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));

        // 3. Create Payment record
        const newPayment = {
            paymentId: payId,
            subscriptionId: subId,
            ownerName: cleanOwnerName,
            vehicleNumber: cleanVehicleNumber,
            parkingSlot: cleanSlot,
            plan: plan.name,
            amount: plan.price,
            paymentMethod: paymentMethod || 'UPI',
            paymentDate: startDateStr,
            status: 'Successful',
            createdAt: new Date().toISOString()
        };

        this.recordPayment(newPayment);
        this.dispatchUpdateEvent();

        return {
            success: true,
            message: `Monthly Subscription ${subId} activated successfully!`,
            subscription: newSub,
            payment: newPayment
        };
    }

    renewSubscription(subId, paymentMethod = 'UPI') {
        const subs = this.getSubscriptions();
        const index = subs.findIndex(s => s.subscriptionId.toUpperCase() === subId.toUpperCase());

        if (index === -1) {
            return { success: false, message: 'Subscription not found.' };
        }

        const sub = subs[index];
        const plan = this.getPlanById(sub.planId) || { price: sub.amount, durationDays: 30 };

        // Calculate new dates
        let newStart = new Date();
        const currentEnd = new Date(sub.endDate);
        if (currentEnd > newStart) {
            newStart = currentEnd; // extend from current expiry
        }

        const newEnd = new Date(newStart);
        newEnd.setDate(newStart.getDate() + (plan.durationDays || 30));

        const startDateStr = newStart.toISOString().split('T')[0];
        const endDateStr = newEnd.toISOString().split('T')[0];

        // Update subscription
        sub.startDate = startDateStr;
        sub.endDate = endDateStr;
        sub.status = 'Active';
        subs[index] = sub;
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));

        // Re-ensure slot is marked occupied
        const slot = this.getSlotById(sub.parkingSlot);
        if (slot && slot.status === 'available') {
            slot.status = 'occupied';
            slot.vehicleNumber = sub.vehicleNumber;
            slot.ownerName = sub.ownerName;
            slot.type = sub.vehicleType;
            slot.parkedAt = new Date().toISOString();
            slot.subscriptionId = sub.subscriptionId;
            const allSlots = this.getSlots();
            const slotIdx = allSlots.findIndex(s => s.id === slot.id);
            if (slotIdx !== -1) {
                allSlots[slotIdx] = slot;
                this.saveSlots(allSlots);
            }
        }

        // Generate renewal payment record
        const timestampCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const newPayId = `PAY${timestampCode}${randomNum}`;

        const renewalPayment = {
            paymentId: newPayId,
            subscriptionId: sub.subscriptionId,
            ownerName: sub.ownerName,
            vehicleNumber: sub.vehicleNumber,
            parkingSlot: sub.parkingSlot,
            plan: sub.plan,
            amount: plan.price || sub.amount,
            paymentMethod: paymentMethod,
            paymentDate: new Date().toISOString().split('T')[0],
            status: 'Successful',
            createdAt: new Date().toISOString()
        };

        this.recordPayment(renewalPayment);
        this.dispatchUpdateEvent();

        return {
            success: true,
            message: `Subscription ${sub.subscriptionId} renewed until ${endDateStr}!`,
            subscription: sub,
            payment: renewalPayment
        };
    }

    cancelSubscription(subId, cancelledBy = 'User') {
        const subs = this.getSubscriptions();
        const index = subs.findIndex(s => s.subscriptionId.toUpperCase() === subId.toUpperCase());

        if (index === -1) {
            return { success: false, message: 'Subscription not found.' };
        }

        const sub = subs[index];
        sub.status = 'Cancelled';
        subs[index] = sub;
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));

        // Release the assigned slot
        const slot = this.getSlotById(sub.parkingSlot);
        if (slot && slot.status === 'occupied' && slot.vehicleNumber === sub.vehicleNumber) {
            this.releaseVehicle(slot.id, cancelledBy);
        }

        this.dispatchUpdateEvent();
        return {
            success: true,
            message: `Subscription ${sub.subscriptionId} has been cancelled and Slot ${sub.parkingSlot} is now freed.`
        };
    }

    // ==========================================
    // PAYMENTS & REVENUE
    // ==========================================

    getPayments() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
            const list = data ? JSON.parse(data) : [];
            return list.sort((a, b) => new Date(b.createdAt || b.paymentDate) - new Date(a.createdAt || a.paymentDate));
        } catch (e) {
            console.error('Error reading payments', e);
            return [];
        }
    }

    getPaymentById(payId) {
        const payments = this.getPayments();
        return payments.find(p => p.paymentId.toUpperCase() === (payId || '').toUpperCase()) || null;
    }

    recordPayment(payment) {
        const payments = this.getPayments();
        payments.unshift(payment);
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    }

    /**
     * Compute comprehensive revenue metrics and analytics.
     */
    getRevenueMetrics() {
        const payments = this.getPayments();
        const subs = this.getSubscriptions();

        const todayStr = new Date().toISOString().split('T')[0];
        const currentMonthPrefix = todayStr.slice(0, 7); // 'YYYY-MM'

        let totalRevenue = 0;
        let todayRevenue = 0;
        let thisMonthRevenue = 0;

        const methodBreakdown = { UPI: 0, 'Debit Card': 0, 'Credit Card': 0, Cash: 0 };
        const monthlyTrend = {};

        payments.forEach(p => {
            const amt = Number(p.amount) || 0;
            totalRevenue += amt;

            if (p.paymentDate === todayStr) {
                todayRevenue += amt;
            }

            if (p.paymentDate && p.paymentDate.startsWith(currentMonthPrefix)) {
                thisMonthRevenue += amt;
            }

            if (methodBreakdown[p.paymentMethod] !== undefined) {
                methodBreakdown[p.paymentMethod] += amt;
            } else {
                methodBreakdown[p.paymentMethod] = amt;
            }

            // Monthly aggregation
            const mKey = (p.paymentDate || todayStr).slice(0, 7);
            monthlyTrend[mKey] = (monthlyTrend[mKey] || 0) + amt;
        });

        const activeSubs = subs.filter(s => s.status === 'Active' || s.status === 'Expiring Soon').length;
        const expiredSubs = subs.filter(s => s.status === 'Expired').length;
        const cancelledSubs = subs.filter(s => s.status === 'Cancelled').length;

        return {
            totalRevenue,
            todayRevenue,
            thisMonthRevenue,
            totalPayments: payments.length,
            activeSubs,
            expiredSubs,
            cancelledSubs,
            totalSubs: subs.length,
            methodBreakdown,
            monthlyTrend
        };
    }

    // ==========================================
    // PARKING HISTORY
    // ==========================================

    getHistory() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
            const list = data ? JSON.parse(data) : [];
            return list.sort((a, b) => new Date(b.releasedAt) - new Date(a.releasedAt));
        } catch (e) {
            console.error('Error reading history', e);
            return [];
        }
    }

    addHistoryRecord(record) {
        const history = this.getHistory();
        history.unshift(record);
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    }

    clearHistory() {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
        this.dispatchUpdateEvent();
    }

    // ==========================================
    // GENERAL STATISTICS
    // ==========================================

    getStats() {
        const slots = this.getSlots();
        const history = this.getHistory();
        const subs = this.getSubscriptions();
        const rev = this.getRevenueMetrics();

        const totalSlots = slots.length;
        const availableSlots = slots.filter(s => s.status === 'available').length;
        const occupiedSlots = slots.filter(s => s.status === 'occupied').length;
        const disabledSlots = slots.filter(s => s.status === 'disabled').length;

        return {
            totalSlots,
            availableSlots,
            occupiedSlots,
            disabledSlots,
            totalVehicles: occupiedSlots,
            historyCount: history.length,
            totalRevenue: rev.totalRevenue,
            thisMonthRevenue: rev.thisMonthRevenue,
            activeSubscriptions: rev.activeSubs,
            expiredSubscriptions: rev.expiredSubs,
            totalPaymentsCount: rev.totalPayments
        };
    }

    // ==========================================
    // ADMIN AUTHENTICATION
    // ==========================================

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

    isAdminLoggedIn() {
        try {
            const session = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
            return !!session;
        } catch (e) {
            return false;
        }
    }

    adminLogout() {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    }

    // ==========================================
    // FORMATTING UTILITIES
    // ==========================================

    formatCurrency(amount) {
        return '₹' + Number(amount || 0).toLocaleString('en-IN');
    }

    formatDuration(ms) {
        if (!ms || ms < 0) return 'Just now';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        if (hours === 0 && minutes === 0) return '< 1 min';
        if (hours === 0) return `${minutes} min${minutes > 1 ? 's' : ''}`;
        return `${hours} hr${hours > 1 ? 's' : ''} ${minutes.toString().padStart(2, '0')} mins`;
    }

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

    formatDateOnly(dateStr) {
        if (!dateStr) return '--';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }
}

// Global instance
window.storage = new StorageService();
