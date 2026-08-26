# 🅿️ ParkEase — Smart Parking Management System

A modern, responsive, zero-dependency **Parking Management Web Application** designed for real-time slot tracking, vehicle check-in/check-out, and facility administration. Built purely with native **HTML5, CSS3, and Vanilla JavaScript**, persisting all operational state in **browser LocalStorage**.

---

## 📋 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
  - [1. User Panel](#1-user-panel)
  - [2. Admin Dashboard](#2-admin-dashboard)
- [Visual Parking Grid](#-visual-parking-grid)
- [Demo Admin Credentials](#-demo-admin-credentials)
- [Technologies Used](#-technologies-used)
- [Project Structure](#-project-structure)
- [How to Run the Project](#-how-to-run-the-project)
- [How LocalStorage Persistence Works](#-how-localstorage-persistence-works)
- [Screenshots & UI Placeholders](#-screenshots--ui-placeholders)
- [Future Improvements](#-future-improvements)
- [Author & License](#-author--license)

---

## 🚀 Project Overview

**ParkEase** is an end-to-end client-side web application suitable for academic projects, viva presentations, and developer portfolios. It operates completely inside the browser without requiring any Node.js, PHP, Python, or database backend.

---

## ✨ Key Features

### 1. User Panel
- **Real-Time Dashboard**: Summary cards displaying Total Slots, Available Slots, Occupied Slots, and Currently Parked Vehicles.
- **Interactive Visual Parking Grid**: Color-coded parking bays (P-01 to P-12+) displaying live status and vehicle category icons:
  - 🟢 **Green**: Available
  - 🔴 **Red**: Occupied
  - ⚪ **Gray**: Disabled / Under Maintenance
- **Slot Directory & Advanced Search**: Filter slots by vehicle type (4-Wheeler, 2-Wheeler, Heavy Vehicle) and operational status.
- **Park Vehicle Form**:
  - Vehicle Registration Number entry with validation.
  - Owner full name.
  - Vehicle Type selection.
  - Dynamic slot selector listing matching, unoccupied slots.
  - Duplicate vehicle number prevention and instant receipt modal.
- **Active Vehicles Directory**: Real-time table of parked vehicles with quick search and one-click **Release** action.
- **Parking History**: Audit log tracking check-in time, check-out time, parking duration, and release source.
- **Single Page Navigation**: Seamless tab navigation without page reloads.

### 2. Admin Dashboard
- **Protected Access**: Client-side demo authentication gating the management portal.
- **Facility Statistics**: Real-time breakdown of slot occupancy, maintenance bays, and total transaction volume.
- **Slot Management (CRUD)**:
  - **Add New Slot**: Specify Slot ID (e.g. `P-13`), Floor/Zone, and Supported Vehicle Type.
  - **Toggle Slot Status**: Enable or disable bays for maintenance (with validation preventing disabling of occupied bays).
  - **Delete Slot**: Remove unused parking bays (protected against deleting occupied slots).
- **Vehicle Roster & Eviction**: Admin release/evict capabilities with automated logging.
- **History Management**: Searchable logs with one-click historical log wipe.
- **Factory Reset**: One-click restore to sample default data.

---

## 🗺️ Visual Parking Grid

The visual layout models real-world parking bays:

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ P-01 (Ground)   │   │ P-02 (Ground)   │   │ P-03 (Ground)   │
│ 🟢 AVAILABLE    │   │ 🟢 AVAILABLE    │   │ 🔴 OCCUPIED     │
│ [ Empty Bay ]   │   │ [ Empty Bay ]   │   │ KA-01-MJ-5021   │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

Clicking on any slot opens a detailed inspection modal with direct actions (**Park Here**, **Release**, or **View Details**).

---

## 🔐 Demo Admin Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` |

> Login authentication is handled purely client-side via JavaScript and persisted in LocalStorage.

---

## 🛠️ Technologies Used

- **HTML5**: Semantic elements, accessible form controls, and responsive containers.
- **CSS3**: Modern CSS Variables, CSS Grid, Flexbox, custom status badges, glassmorphism modal dialogs, and smooth micro-animations.
- **Vanilla JavaScript (ES6+)**: Modular code, DOM event handling, custom event dispatching (`pms-data-updated`), and real-time state synchronization.
- **LocalStorage API**: Zero-configuration client-side data persistence.

---

## 📂 Project Structure

```
parking-management/
│
├── index.html              # Main User Portal (Dashboard, Slots, Park, History, About)
├── admin.html              # Dedicated Admin Dashboard & Management Console
├── css/
│   └── style.css           # Comprehensive, responsive stylesheet
├── js/
│   ├── storage.js          # LocalStorage data access layer & sample seed generator
│   ├── app.js              # User interface bindings, search, & validations
│   └── admin.js            # Admin authentication, slot CRUD, & vehicle management
├── assets/
│   └── images/             # Vector icons & branding assets
│       └── logo.svg
├── README.md               # Project documentation
└── .gitignore              # Git ignore rules
```

---

## 💻 How to Run the Project

Since this is a 100% static web application, no build tools, web servers, or package managers are required!

### Option 1: Direct Browser Launch
1. Double-click `index.html` to open the User Portal in any modern web browser (Chrome, Edge, Firefox, Safari).
2. Open `admin.html` to access the Admin Dashboard.

### Option 2: Using VS Code Live Server
1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension.
3. Right-click `index.html` and select **"Open with Live Server"**.

### Option 3: Using Python Built-in Server
Run the following in your terminal:
```bash
# Python 3
python -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

---

## 💾 How LocalStorage Persistence Works

All data is structured as JSON strings under dedicated storage keys:

1. `pms_parking_slots`: Stores array of slot definitions and current vehicle occupancy.
2. `pms_parking_history`: Stores completed parking sessions and elapsed durations.
3. `pms_admin_session`: Stores current administrative session state.

### Automatic Seed Data
The first time the application is loaded, `storage.js` checks if `pms_parking_slots` exists. If not, it automatically populates initial sample slots (`P-01` through `P-12`), occupied demo vehicles, and sample history logs so the interface is instantly interactive.

### Cross-Tab Synchronization
The application listens to the native `window.addEventListener('storage', ...)` and custom `pms-data-updated` events, ensuring that actions taken in the Admin tab immediately update in the User tab without manual page refreshes.

---

## 📸 Screenshots & UI Placeholders

| Section | Preview |
| :--- | :--- |
| **User Dashboard** | `[ Hero banner with live occupancy counters & visual parking bays ]` |
| **Park Vehicle Form** | `[ Real-time validated entry form with dynamic slot filtering ]` |
| **Admin Slot Manager** | `[ Comprehensive CRUD table with status toggling & modal dialogs ]` |

---

## 🔮 Future Improvements

- Automated parking fee calculator based on customized hourly rates.
- QR Code generation on vehicle entry receipts for paperless check-out.
- Floor-plan SVG visual rendering with multi-level map navigation.
- PDF export of parking audit and revenue reports.
- Dark mode theme toggle.

---

## 👤 Author & License

- **Project**: ParkEase — Parking Management Web Application
- **Stack**: HTML5 • CSS3 • Vanilla JavaScript • LocalStorage
- **License**: MIT License — Free to use for college projects and educational portfolios.
