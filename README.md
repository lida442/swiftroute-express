# SwiftRoute Express - Courier Logistics & Live Tracking System

A full-stack, enterprise-grade courier and logistics web application built with **React**, **React Router v7**, **Node.js Express**, and **SQLite Relational Database (RDBMS)** with multi-table **SQL JOIN Queries**.

---

## 🌟 3 Portals Architecture

### 1. Customer Tracking Portal (Public Access)
- **Open Access**: Anyone can enter and track shipments without barrier.
- **Assigned Rider Identification**: Displays **Delivery Rider Name** and direct **Personal Contact Number** with click-to-call (`tel:`) and WhatsApp integration.
- **Where He Has Reached**: Real-time current checkpoint milestone, ETA, and progress history.
- **Zero Route Confusion**: Displays customer's specified route directions and landmarks with a 1-click **Open Google Map Route** button.
- **File a Problem Faced by Customer**: Dedicated space for customers to report issues (e.g. wrong route/gate confusion, delayed package, driver unreachable, damaged parcel).
- **Admin Reply Viewer**: Live view of Admin's official replies and ticket status updates (`OPEN`, `INVESTIGATING`, `RESOLVED`).

### 2. Delivery Rider Portal (Name & Password Protected)
- **Login Credentials**:
  - **Vikram Singh** / `deliver123`
  - **Rajesh Kumar** / `deliver123`
  - **Arjun Sharma** / `deliver123`
- **Delivery Details**:
  - **To Whom**: Customer recipient name and recipient phone number (with one-click dialer).
  - **To Where**: Destination address, city, and landmarks.
- **Active Delivery Checkbox / Toggle**:
  - **[✓] Ticked**: Status set to `DELIVERING` (busy on active route).
  - **[ ] Unticked**: Status set to `FREE` (available for dispatch).
  - **Real-Time Admin Notification**: Automatically alerts the Operations Admin whenever status changes.
- **Google Maps GPS Navigation**:
  - Prominent **"Open in Google Maps"** navigation button with direct GPS turn-by-turn routing based on customer's stated directions.
  - Interactive route preview embedded in-app.
- **Milestone Updates**: Buttons to mark "Picked Up", "Out for Delivery", and "Delivered" with custom checkpoint location logging.

### 3. Operations Admin Portal (Password Protected)
- **Password**: `admin123`
- **Fleet Availability (Who is Delivering vs. Free)**:
  - Live grid showing all delivery riders.
  - Filter by `All`, `🟢 Free / Available`, or `🟠 Currently Delivering`.
  - Displays rider personal phone, vehicle number, rating, and active delivery counts.
- **Customer Problems & Reply Console**:
  - Comprehensive view of all complaints reported by customers.
  - Identifies **Who Delivered / Is Delivering** the package (rider name and personal number).
  - Built-in **Admin Reply Box** allowing operations managers to send direct solutions to customers and update ticket status.
- **Live Route Tracking**:
  - Monitor all courier shipments from origin to destination.
  - Interactive Google Maps route visualizer.
- **Live Notifications & Real-Time Audit Log**:
  - Real-time stream of rider checkbox updates and customer reports.

---

## 🗄️ Relational Database (RDBMS) & SQL JOIN Queries

The database uses SQLite with Foreign Key constraints enabled (`PRAGMA foreign_keys = ON;`).

### Relational Schema Tables:
1. `delivery_partners` (id, name, phone, password, status ['FREE', 'DELIVERING'], vehicle_no, rating)
2. `customers` (id, name, phone, address, preferred_route)
3. `couriers` (id, tracking_code, customer_id, delivery_partner_id, origin, destination, current_checkpoint, status)
4. `checkpoints` (id, courier_id, location, status_label, timestamp)
5. `problems` (id, courier_id, customer_id, issue_type, description, status, admin_reply)
6. `activity_logs` (id, action_type, actor_name, message, created_at)

### Key SQL JOIN Queries:
- **Courier Full Tracking JOIN**:
  ```sql
  SELECT c.*, cust.name as customer_name, cust.phone as customer_phone, 
         cust.address as customer_address, cust.preferred_route,
         dp.name as delivery_guy_name, dp.phone as delivery_guy_personal_phone
  FROM couriers c
  INNER JOIN customers cust ON c.customer_id = cust.id
  LEFT JOIN delivery_partners dp ON c.delivery_partner_id = dp.id
  ```
- **Customer Problems with Assigned Rider JOIN**:
  ```sql
  SELECT p.*, c.tracking_code, cust.name as customer_name,
         dp.name as delivery_guy_name, dp.phone as delivery_guy_phone
  FROM problems p
  INNER JOIN couriers c ON p.courier_id = c.id
  INNER JOIN customers cust ON p.customer_id = cust.id
  LEFT JOIN delivery_partners dp ON c.delivery_partner_id = dp.id
  ```
- **Fleet Workload JOIN**:
  ```sql
  SELECT dp.*, COUNT(CASE WHEN c.status != 'Delivered' THEN 1 END) as active_deliveries_count
  FROM delivery_partners dp
  LEFT JOIN couriers c ON dp.id = c.delivery_partner_id AND c.status != 'Delivered'
  GROUP BY dp.id
  ```

---

## 🚀 How to Run Locally

### 1. Start the Backend Server (Port 5001)
```bash
cd server
npm start
```

### 2. Start the Frontend Client (Port 3000)
```bash
cd client
npm run dev
```

Open your browser at **`http://localhost:3000/`**.
