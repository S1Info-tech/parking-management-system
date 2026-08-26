# 🅿️ ParkEase — Smart Parking & Monthly Subscription System

A modern, responsive, zero-dependency **Parking Management Web Application** featuring daily parking management, **Monthly Parking Subscriptions**, simulated payment processing (UPI, Card, Cash), and comprehensive revenue analytics. Built purely with native **HTML5, CSS3, and Vanilla JavaScript**, persisting all operational state in **browser LocalStorage**.

---

## 📋 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
  - [1. Monthly Parking & Payment Simulation](#1-monthly-parking--payment-simulation)
  - [2. User Panel](#2-user-panel)
  - [3. Admin Dashboard & Revenue Analytics](#3-admin-dashboard--revenue-analytics)
- [Monthly Parking Plans & Pricing](#-monthly-parking-plans--pricing)
- [Demo Payment Interface](#-demo-payment-interface)
- [Demo Admin Credentials](#-demo-admin-credentials)
- [Technologies Used](#-technologies-used)
- [Project Structure](#-project-structure)
- [How to Run the Project Locally](#-how-to-run-the-project-locally)
- [How LocalStorage Persistence Works](#-how-localstorage-persistence-works)
- [Printable Tax Invoice / Receipt](#-printable-tax-invoice--receipt)
- [Author & Repository](#-author--repository)

---

## 🚀 Project Overview

**ParkEase** is an end-to-end client-side web application designed for academic projects, viva presentations, and portfolio showcases. It operates completely inside the browser without requiring any Node.js, PHP, Python, or database backend.

---

## ✨ Key Features

### 1. Monthly Parking & Payment Simulation
- **Monthly Subscription Passes**: 30-day passes with automatic start/expiry date calculation.
- **Simulated Payment Gateway**:
  - Prominent demo warning: *"Demo Payment — No real money will be charged."*
  - Supported methods: **UPI (VPA / QR)**, **Debit Card**, **Credit Card**, and **Cash**.
  - Unique **Payment ID** (`PAY...`) and **Subscription ID** (`SUB...`) generation.
  - Automatic parking bay allocation with status transition to `Occupied (Monthly Pass)`.
- **Subscription Lifecycle & Renewal**:
  - Live status tracking: `Active`, `Expiring Soon` (≤ 5 days), `Expired`, and `Cancelled`.
  - One-click instant 30-day renewal with payment logging.
  - Subscription cancellation with automated slot release.
- **Payment History Ledger**: Comprehensive payment transaction history with search, method filtering, and receipt re-printing.

### 2. User Panel
- **Real-Time Dashboard**: Summary cards for Total Slots, Available Slots, Occupied Slots, and Active Subscriptions.
- **Interactive Visual Parking Grid**: Color-coded parking bays (P-01 to P-12+) displaying live status and vehicle category icons:
  - 🟢 **Green**: Available
  - 🔴 **Red**: Occupied (with vehicle number & pass indicator)
  - ⚪ **Gray**: Disabled / Under Maintenance
- **Daily Vehicle Check-In Form**: Client-side validation, duplicate vehicle checks, and instant receipt generation.
- **Single Page Navigation**: Seamless section transitions (Home, Available Parking, Park Vehicle, Monthly Parking, My Subscriptions, Payment History, About).

### 3. Admin Dashboard & Revenue Analytics
- **Protected Access**: Client-side demo authentication (`admin` / `admin123`).
- **Revenue Dashboard & Financial Analytics**:
  - Real-time counters: **Today's Revenue**, **This Month's Revenue**, **All-Time Revenue**, and **Paid Subscriptions Count**.
  - **Pure CSS/JS Monthly Revenue Bar Chart** with zero external dependencies.
  - Payment method collection breakdown (UPI vs. Cards vs. Cash).
- **Slot Management (Full CRUD)**: Add slots, toggle maintenance status, delete unused bays.
- **Monthly Subscriptions Roster**: Admin search, status filters, manual override renewals, and pass cancellations.
- **Payments Ledger**: Searchable payment audit log with printable receipt viewer.
- **Plan Pricing Editor**: Admin can configure and update subscription plan prices in real time.
- **Factory Reset**: One-click restore to sample default data.

---

## 💵 Monthly Parking Plans & Pricing

| Plan Name | Vehicle Type | Price (₹ / Month) | Duration |
| :--- | :--- | :---: | :---: |
| **Bike Monthly Parking** | 2-Wheeler (Motorcycle/Scooter) | **₹500** | 30 Days |
| **Car Monthly Parking** | 4-Wheeler (Car/SUV) | **₹1,500** | 30 Days |
| **Premium Car Parking** | 4-Wheeler (Prime Front Bay) | **₹2,000** | 30 Days |
| **Heavy Vehicle Monthly** | Heavy Vehicle (Bus/Truck) | **₹3,000** | 30 Days |

*Plan prices are stored in a centralized JavaScript configuration in `storage.js` and can be adjusted by the administrator in the Settings tab.*

---

## 💳 Demo Payment Interface

```
┌──────────────────────────────────────────────────────────┐
│ 💳 Complete Demo Payment                                 │
│ ⚠️ Demo Payment: No real money will be charged.          │
│                                                          │
│ Payable Amount: ₹1,500        Plan: Monthly Car Parking  │
│ [ ⚡ UPI / QR ]  [ 💳 Debit Card ]  [ 💳 Credit Card ]   │
│                                                          │
│ UPI ID: [ user@okhdfcbank                      ]         │
│                                                          │
│ [ 🔒 Pay ₹1,500 & Activate Subscription ]                │
└──────────────────────────────────────────────────────────┘
```

> **Security Note:** This is a simulated frontend payment demonstration. No real credit card or banking information is processed or stored.

---

## 🧾 Printable Tax Invoice / Receipt

Every successful payment generates an official, printable payment receipt with:
- System Header & Brand Logo
- Unique **Payment ID** and **Subscription ID**
- Customer Name & Vehicle Registration Number
- Allocated Parking Bay (e.g. `P-04`)
- Plan Breakdown & Amount Paid
- Validity Date Range (Start Date & Expiry Date)
- Instant Browser Print via `window.print()`

---

## 🔐 Demo Admin Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` |

---

## 🛠️ Technologies Used

- **HTML5**: Semantic markup, accessible form controls, and responsive containers.
- **CSS3**: CSS Custom Variables, CSS Grid, Flexbox, pure CSS bar charts, status pills, and `@media print` rules for receipts.
- **Vanilla JavaScript (ES6+)**: SPA section routing, payment simulation, date math, receipt rendering, and storage synchronization.
- **LocalStorage API**: Full data persistence across reloads and browser tabs.

---

## 📂 Project Structure

```
parking-management/
│
├── index.html              # User Portal (Home, Slots, Park, Monthly, Subscriptions, History)
├── admin.html              # Admin Dashboard (Overview, Slots, Vehicles, Subs, Payments, Revenue)
├── css/
│   └── style.css           # Comprehensive, responsive stylesheet & print styles
├── js/
│   ├── storage.js          # LocalStorage persistence layer, plans config, & revenue analytics
│   ├── app.js              # User interface bindings, checkout simulation, & renewal flows
│   └── admin.js            # Admin authentication, slot CRUD, sub management, & revenue charts
├── assets/
│   └── images/
│       └── logo.svg        # SVG logo asset
├── README.md               # Complete documentation
└── .gitignore              # Standard gitignore
```

---

## 💻 How to Run the Project Locally

Because this is a 100% static client-side web application:

1. **Direct Launch**: Double-click `index.html` in any browser for the User Portal, and `admin.html` for the Admin Dashboard.
2. **VS Code Live Server**: Right-click `index.html` -> **"Open with Live Server"**.
3. **Python Local Server**:
   ```bash
   python -m http.server 8000
   ```
   Then open `http://localhost:8000` in your web browser.

---

## 💾 How LocalStorage Persistence Works

Data is structured in LocalStorage under dedicated keys:
- `pms_parking_slots`: Array of slot configurations and current occupancy.
- `pms_parking_plans`: Configurable monthly subscription plans.
- `pms_subscriptions`: Array of active and historical member subscriptions.
- `pms_payments`: Transaction ledger of all simulated payments.
- `pms_parking_history`: Daily vehicle exit audit log.
- `pms_admin_session`: Administrator session credentials.

---

## 👤 Author & Repository

- **Project**: ParkEase — Parking Management & Monthly Subscription System
- **Repository**: [https://github.com/S1Info-tech/parking-management-system](https://github.com/S1Info-tech/parking-management-system)
- **Live Demo (GitHub Pages)**: [https://s1info-tech.github.io/parking-management-system/](https://s1info-tech.github.io/parking-management-system/)
- **Stack**: HTML5 • CSS3 • Vanilla JavaScript • LocalStorage
- **License**: MIT License — Free to use for academic projects and portfolio showcases.
