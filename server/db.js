import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'courier_system.db');

export const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  // 1. Create Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS delivery_partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      status TEXT CHECK(status IN ('FREE', 'DELIVERING')) DEFAULT 'FREE',
      vehicle_type TEXT DEFAULT 'Motorcycle',
      vehicle_no TEXT,
      current_zone TEXT DEFAULT 'Central City',
      rating REAL DEFAULT 4.9,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      preferred_route TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS couriers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_code TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL,
      delivery_partner_id INTEGER,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      current_checkpoint TEXT NOT NULL,
      status TEXT CHECK(status IN ('Order Placed', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered')) DEFAULT 'In Transit',
      package_type TEXT NOT NULL,
      weight_kg REAL DEFAULT 1.2,
      estimated_delivery TEXT,
      delivered_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (delivery_partner_id) REFERENCES delivery_partners(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS checkpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courier_id INTEGER NOT NULL,
      location TEXT NOT NULL,
      status_label TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      is_completed INTEGER DEFAULT 1,
      FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS problems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courier_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      issue_type TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT CHECK(status IN ('OPEN', 'INVESTIGATING', 'RESOLVED')) DEFAULT 'OPEN',
      admin_reply TEXT,
      replied_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if data is already seeded
  const partnerCount = db.prepare('SELECT COUNT(*) as count FROM delivery_partners').get();
  if (partnerCount.count === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  console.log('Seeding Relational Database with courier logistics records...');

  // 1. Insert Delivery Partners
  const insertPartner = db.prepare(`
    INSERT INTO delivery_partners (name, phone, password, status, vehicle_type, vehicle_no, current_zone, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPartner.run('Vikram Singh', '+91 98765 43210', 'deliver123', 'DELIVERING', 'Yamaha FZ', 'DL-01-AB-4592', 'Connaught Place / Central', 4.9);
  insertPartner.run('Rajesh Kumar', '+91 98112 34567', 'deliver123', 'FREE', 'Honda Activa', 'DL-04-XY-8812', 'South Extension', 4.8);
  insertPartner.run('Arjun Sharma', '+91 97188 99001', 'deliver123', 'DELIVERING', 'Hero Splendor', 'DL-09-CD-3341', 'Aerocity / West', 4.7);
  insertPartner.run('Mohd Adil', '+91 99554 11223', 'deliver123', 'FREE', 'Bajaj Pulsar', 'DL-03-GH-7729', 'Rohini / North', 4.9);

  // 2. Insert Customers
  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, phone, email, address, city, preferred_route)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertCustomer.run(
    'Aarav Mehta',
    '+91 98220 11990',
    'aarav.mehta@gmail.com',
    'Flat 402, Lotus Grandeur, Ring Road, Sector 15',
    'New Delhi',
    'Take Ring Road flyover, exit right at Gate 3 near Metro Pillar 188, enter society lane behind Axis Bank ATM'
  );

  insertCustomer.run(
    'Pooja Sharma',
    '+91 98450 77123',
    'pooja.s@outlook.com',
    'House 28-B, Shanti Niketan, Near Green Park Market',
    'New Delhi',
    'Enter via Green Park Main Market lane, sharp left before Post Office into block B cul-de-sac'
  );

  insertCustomer.run(
    'Rohan Verma',
    '+91 99100 88234',
    'rohan.verma@techcorp.com',
    'Office 604, Cyber Heights, Sector 62',
    'Noida',
    'Follow Express Highway towards Sector 62 exit, turn into Cyber Hub visitor basement gate #2'
  );

  insertCustomer.run(
    'Ananya Iyer',
    '+91 97331 44556',
    'ananya.iyer@gmail.com',
    'Villa 12, Palm Meadows, Greater Kailash II',
    'New Delhi',
    'From M-Block market, take outer perimeter road, 2nd black gate on right with blooming bougainvillea'
  );

  // 3. Insert Couriers
  const insertCourier = db.prepare(`
    INSERT INTO couriers (tracking_code, customer_id, delivery_partner_id, origin, destination, current_checkpoint, status, package_type, weight_kg, estimated_delivery)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCourier.run(
    'TRK-98241',
    1, // Aarav Mehta
    1, // Vikram Singh
    'Central Fulfillment Hub, Okhla Phase 3',
    'Lotus Grandeur, Ring Road, Sector 15, New Delhi',
    'Out for Delivery - Dispatched with Vikram Singh on Yamaha FZ',
    'Out for Delivery',
    'Electronics (iPad Pro 11")',
    0.85,
    'Today, by 4:30 PM'
  );

  insertCourier.run(
    'TRK-54120',
    2, // Pooja Sharma
    3, // Arjun Sharma
    'Mumbai Regional Cargo Hub',
    'House 28-B, Shanti Niketan, Green Park, New Delhi',
    'In Transit - Reached Delhi South Sorting Center',
    'In Transit',
    'Apparel & Fashion Box',
    2.1,
    'Tomorrow, by 12:00 PM'
  );

  insertCourier.run(
    'TRK-77309',
    3, // Rohan Verma
    1, // Vikram Singh
    'Bengaluru Tech Logistics Hub',
    'Office 604, Cyber Heights, Sector 62, Noida',
    'Picked Up - Scanned at Noida Distribution Unit',
    'Picked Up',
    'Confidential Business Documents',
    0.4,
    'Oct 24, 2026, 2:00 PM'
  );

  insertCourier.run(
    'TRK-33891',
    4, // Ananya Iyer
    2, // Rajesh Kumar (Free now, previously completed)
    'Jaipur Handicrafts Depot',
    'Villa 12, Palm Meadows, Greater Kailash II, New Delhi',
    'Delivered - Handed over to Customer with signature',
    'Delivered',
    'Fragile Home Decor Vase',
    3.4,
    'Delivered on Oct 20, 2026'
  );

  // 4. Insert Checkpoints
  const insertCheckpoint = db.prepare(`
    INSERT INTO checkpoints (courier_id, location, status_label, timestamp, is_completed)
    VALUES (?, ?, ?, ?, ?)
  `);

  // TRK-98241 checkpoints
  insertCheckpoint.run(1, 'Central Fulfillment Hub, Okhla Phase 3', 'Package Processed & Packed', '2026-10-21 09:15 AM', 1);
  insertCheckpoint.run(1, 'South Delhi Sorting Facility', 'Arrived at Sort Facility', '2026-10-21 11:30 AM', 1);
  insertCheckpoint.run(1, 'Central City Delivery Hub', 'Assigned to Delivery Partner Vikram Singh', '2026-10-21 01:10 PM', 1);
  insertCheckpoint.run(1, 'Ring Road Sector 15 Local Hub', 'Out for Delivery - En route to customer', '2026-10-21 02:45 PM', 1);
  insertCheckpoint.run(1, 'Destination: Lotus Grandeur', 'Pending Delivery at doorstep', 'Expected: 04:30 PM', 0);

  // TRK-54120 checkpoints
  insertCheckpoint.run(2, 'Mumbai Regional Cargo Hub', 'Dispatched from Origin Hub', '2026-10-20 08:00 PM', 1);
  insertCheckpoint.run(2, 'IGI Airport Cargo Terminal, Delhi', 'Air Freight Clearance Cleared', '2026-10-21 06:20 AM', 1);
  insertCheckpoint.run(2, 'Delhi South Sorting Center', 'Sorted for Last-Mile Routing', '2026-10-21 12:40 PM', 1);
  insertCheckpoint.run(2, 'Green Park Delivery Center', 'Awaiting dispatch', 'Scheduled for Morning', 0);

  // TRK-77309 checkpoints
  insertCheckpoint.run(3, 'Bengaluru Tech Logistics Hub', 'Package Picked Up from Sender', '2026-10-20 03:00 PM', 1);
  insertCheckpoint.run(3, 'Noida Distribution Unit', 'Transferred to Last Mile Agent', '2026-10-21 10:15 AM', 1);

  // TRK-33891 checkpoints
  insertCheckpoint.run(4, 'Jaipur Handicrafts Depot', 'Dispatched', '2026-10-19 10:00 AM', 1);
  insertCheckpoint.run(4, 'Delhi West Distribution Hub', 'Received at Hub', '2026-10-20 07:30 AM', 1);
  insertCheckpoint.run(4, 'Greater Kailash II Branch', 'Out for Delivery with Rajesh Kumar', '2026-10-20 11:00 AM', 1);
  insertCheckpoint.run(4, 'Villa 12, Palm Meadows', 'Delivered & Confirmed by Ananya', '2026-10-20 01:25 PM', 1);

  // 5. Insert Problems
  const insertProblem = db.prepare(`
    INSERT INTO problems (courier_id, customer_id, issue_type, description, status, admin_reply, replied_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertProblem.run(
    1, // TRK-98241
    1, // Aarav Mehta
    'Wrong Route / Gate Confusion',
    'The delivery guy called earlier mentioning he was stuck at Gate 1 which is permanently locked. I had specified to enter via Gate 3 near Metro Pillar 188.',
    'RESOLVED',
    'Dear Aarav, we immediately communicated your route directions to Vikram Singh with the Google Maps pin for Gate 3. He is now on the correct route and arriving shortly!',
    '2026-10-21 03:05 PM'
  );

  insertProblem.run(
    2, // TRK-54120
    2, // Pooja Sharma
    'Urgent Delivery Request',
    'I have an urgent evening event at 7 PM. Could this package be expedited for today if possible instead of tomorrow?',
    'INVESTIGATING',
    'Hello Pooja, Admin team is coordinating with South Sorting Center to see if special dispatch is possible this afternoon.',
    '2026-10-21 01:45 PM'
  );

  // 6. Insert Logs
  const insertLog = db.prepare(`
    INSERT INTO activity_logs (action_type, actor_name, message)
    VALUES (?, ?, ?)
  `);

  insertLog.run('STATUS_UPDATE', 'Vikram Singh', 'Marked courier TRK-98241 as Out for Delivery');
  insertLog.run('PROBLEM_FILED', 'Pooja Sharma', 'Filed problem for shipment TRK-54120');
  insertLog.run('AVAILABILITY_CHANGE', 'Rajesh Kumar', 'Marked status as FREE (Available for deliveries)');
  insertLog.run('REPLY_SENT', 'Admin', 'Replied to problem #1 for customer Aarav Mehta');

  console.log('Database seeded successfully!');
}
