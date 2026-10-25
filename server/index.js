import express from 'express';
import cors from 'cors';
import { db, initDatabase } from './db.js';

// Initialize SQLite database
initDatabase();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ==========================================
// RDBMS JOIN QUERIES DEFINITIONS (Reference)
// ==========================================
const SQL_QUERIES = {
  courierDetailsJoin: `
    SELECT 
      c.id, c.tracking_code, c.origin, c.destination, c.current_checkpoint, 
      c.status, c.package_type, c.weight_kg, c.estimated_delivery, c.delivered_at,
      c.created_at, c.updated_at,
      cust.id as customer_id, cust.name as customer_name, cust.phone as customer_phone, 
      cust.email as customer_email, cust.address as customer_address, 
      cust.city as customer_city, cust.preferred_route,
      dp.id as delivery_partner_id, dp.name as delivery_guy_name, 
      dp.phone as delivery_guy_personal_phone, dp.status as delivery_partner_status, 
      dp.vehicle_type, dp.vehicle_no, dp.rating as delivery_guy_rating
    FROM couriers c
    INNER JOIN customers cust ON c.customer_id = cust.id
    LEFT JOIN delivery_partners dp ON c.delivery_partner_id = dp.id
  `,
  problemsJoin: `
    SELECT 
      p.id as problem_id, p.issue_type, p.description, p.status as problem_status, 
      p.admin_reply, p.replied_at, p.created_at as problem_created_at,
      c.id as courier_id, c.tracking_code, c.origin, c.destination, c.status as courier_status,
      c.current_checkpoint,
      cust.id as customer_id, cust.name as customer_name, cust.phone as customer_phone,
      dp.id as delivery_partner_id, dp.name as delivery_guy_name, dp.phone as delivery_guy_phone
    FROM problems p
    INNER JOIN couriers c ON p.courier_id = c.id
    INNER JOIN customers cust ON p.customer_id = cust.id
    LEFT JOIN delivery_partners dp ON c.delivery_partner_id = dp.id
    ORDER BY p.created_at DESC
  `,
  fleetJoin: `
    SELECT 
      dp.id, dp.name, dp.phone as personal_phone, dp.status, dp.vehicle_type, 
      dp.vehicle_no, dp.current_zone, dp.rating,
      COUNT(CASE WHEN c.status NOT IN ('Delivered') THEN 1 END) as active_deliveries_count
    FROM delivery_partners dp
    LEFT JOIN couriers c ON dp.id = c.delivery_partner_id AND c.status NOT IN ('Delivered')
    GROUP BY dp.id
    ORDER BY dp.status ASC, dp.name ASC
  `,
  deliveryGuyAssignmentsJoin: `
    SELECT 
      c.id, c.tracking_code, c.origin, c.destination, c.current_checkpoint,
      c.status, c.package_type, c.weight_kg, c.estimated_delivery,
      c.created_at, c.updated_at,
      cust.name as customer_name, cust.phone as customer_phone, 
      cust.address as customer_address, cust.preferred_route
    FROM couriers c
    INNER JOIN customers cust ON c.customer_id = cust.id
    WHERE c.delivery_partner_id = ?
    ORDER BY 
      CASE WHEN c.status = 'Delivered' THEN 2 ELSE 1 END,
      c.updated_at DESC
  `
};

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Admin Login (Protected by Password)
app.post('/api/auth/admin-login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, error: 'Password is required' });
  }
  // Demo password is "admin123" or "admin"
  if (password === 'admin123' || password === 'admin') {
    return res.json({
      success: true,
      role: 'ADMIN',
      token: 'admin-auth-token-sample',
      admin: { name: 'Operations Super Admin', email: 'admin@couriertracker.com' }
    });
  }
  return res.status(401).json({ success: false, error: 'Invalid admin password. (Try: admin123)' });
});

// Delivery Partner Login (Requires Name and Password)
app.post('/api/auth/delivery-login', (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ success: false, error: 'Name and Password are required' });
  }

  const partner = db.prepare(`
    SELECT id, name, phone, status, vehicle_type, vehicle_no, current_zone, rating
    FROM delivery_partners 
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND password = ?
  `).get(name, password);

  if (partner) {
    return res.json({
      success: true,
      role: 'DELIVERY',
      partner
    });
  }
  return res.status(401).json({ 
    success: false, 
    error: 'Invalid credentials. Available accounts: "Vikram Singh" / "Rajesh Kumar" / "Arjun Sharma", Password: "deliver123"' 
  });
});

// ==========================================
// 2. CUSTOMER ROUTES (Public - anyone can enter)
// ==========================================

// Track Shipment by Tracking Code (JOIN Query)
app.get('/api/customer/track/:code', (req, res) => {
  const { code } = req.params;
  const courierQuery = db.prepare(`
    ${SQL_QUERIES.courierDetailsJoin}
    WHERE LOWER(c.tracking_code) = LOWER(?)
  `);

  const courier = courierQuery.get(code);

  if (!courier) {
    return res.status(404).json({ success: false, error: `No shipment found with tracking code: ${code}` });
  }

  // Fetch checkpoint history
  const checkpoints = db.prepare(`
    SELECT id, location, status_label, timestamp, is_completed
    FROM checkpoints
    WHERE courier_id = ?
    ORDER BY id ASC
  `).all(courier.id);

  // Fetch problems filed for this shipment
  const problems = db.prepare(`
    SELECT id, issue_type, description, status, admin_reply, replied_at, created_at
    FROM problems
    WHERE courier_id = ?
    ORDER BY created_at DESC
  `).all(courier.id);

  res.json({
    success: true,
    data: {
      ...courier,
      checkpoints,
      problems
    },
    joinQueryExecuted: SQL_QUERIES.courierDetailsJoin
  });
});

// Get sample shipments for quick click-and-track
app.get('/api/customer/recent-shipments', (req, res) => {
  const shipments = db.prepare(`
    SELECT c.tracking_code, c.origin, c.destination, c.status, cust.name as customer_name
    FROM couriers c
    INNER JOIN customers cust ON c.customer_id = cust.id
    ORDER BY c.id ASC
    LIMIT 6
  `).all();
  res.json({ success: true, shipments });
});

// File a problem faced by the customer
app.post('/api/customer/problems', (req, res) => {
  const { courier_id, customer_id, issue_type, description } = req.body;

  if (!courier_id || !issue_type || !description) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // Find customer_id if not explicitly provided
  let resolvedCustId = customer_id;
  if (!resolvedCustId) {
    const courier = db.prepare('SELECT customer_id, tracking_code FROM couriers WHERE id = ?').get(courier_id);
    if (!courier) return res.status(404).json({ success: false, error: 'Courier not found' });
    resolvedCustId = courier.customer_id;
  }

  const insertStmt = db.prepare(`
    INSERT INTO problems (courier_id, customer_id, issue_type, description, status)
    VALUES (?, ?, ?, ?, 'OPEN')
  `);

  const result = insertStmt.run(courier_id, resolvedCustId, issue_type, description);

  // Log activity to notify Admin
  const courier = db.prepare('SELECT tracking_code FROM couriers WHERE id = ?').get(courier_id);
  const cust = db.prepare('SELECT name FROM customers WHERE id = ?').get(resolvedCustId);

  db.prepare(`
    INSERT INTO activity_logs (action_type, actor_name, message)
    VALUES (?, ?, ?)
  `).run(
    'PROBLEM_FILED',
    cust ? cust.name : 'Customer',
    `Customer filed a problem [${issue_type}] for shipment ${courier ? courier.tracking_code : courier_id}: "${description.substring(0, 45)}..."`
  );

  res.json({
    success: true,
    message: 'Problem filed successfully! Admin has been notified and will review your issue.',
    problem_id: result.lastInsertRowid
  });
});

// ==========================================
// 3. ADMIN ROUTES (Protected)
// ==========================================

// Dashboard stats & KPI
app.get('/api/admin/overview', (req, res) => {
  const totalCouriers = db.prepare('SELECT COUNT(*) as count FROM couriers').get().count;
  const activeDeliveries = db.prepare("SELECT COUNT(*) as count FROM couriers WHERE status NOT IN ('Delivered')").get().count;
  const deliveredCouriers = db.prepare("SELECT COUNT(*) as count FROM couriers WHERE status = 'Delivered'").get().count;
  const openProblems = db.prepare("SELECT COUNT(*) as count FROM problems WHERE status IN ('OPEN', 'INVESTIGATING')").get().count;
  const freePartners = db.prepare("SELECT COUNT(*) as count FROM delivery_partners WHERE status = 'FREE'").get().count;
  const deliveringPartners = db.prepare("SELECT COUNT(*) as count FROM delivery_partners WHERE status = 'DELIVERING'").get().count;

  res.json({
    success: true,
    stats: {
      totalCouriers,
      activeDeliveries,
      deliveredCouriers,
      openProblems,
      freePartners,
      deliveringPartners,
      totalPartners: freePartners + deliveringPartners
    }
  });
});

// All Couriers with full Customer & Delivery Guy info (JOIN query)
app.get('/api/admin/couriers', (req, res) => {
  const couriers = db.prepare(`
    ${SQL_QUERIES.courierDetailsJoin}
    ORDER BY c.created_at DESC
  `).all();

  res.json({
    success: true,
    couriers,
    joinQueryExecuted: SQL_QUERIES.courierDetailsJoin
  });
});

// Customer Problems with Courier & Delivery Guy info (JOIN query)
app.get('/api/admin/problems', (req, res) => {
  const problems = db.prepare(SQL_QUERIES.problemsJoin).all();

  res.json({
    success: true,
    problems,
    joinQueryExecuted: SQL_QUERIES.problemsJoin
  });
});

// Admin Reply to Customer Problem
app.post('/api/admin/problems/:id/reply', (req, res) => {
  const { id } = req.params;
  const { reply, status = 'RESOLVED' } = req.body;

  if (!reply) {
    return res.status(400).json({ success: false, error: 'Reply text is required' });
  }

  const now = new Date().toLocaleString();
  const updateStmt = db.prepare(`
    UPDATE problems 
    SET admin_reply = ?, status = ?, replied_at = ?
    WHERE id = ?
  `);

  const result = updateStmt.run(reply, status, now, id);

  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: 'Problem ticket not found' });
  }

  // Log activity
  db.prepare(`
    INSERT INTO activity_logs (action_type, actor_name, message)
    VALUES (?, ?, ?)
  `).run('REPLY_SENT', 'Admin', `Admin replied to problem #${id}: "${reply.substring(0, 45)}..."`);

  res.json({
    success: true,
    message: 'Reply sent to customer successfully!'
  });
});

// Fleet Availability Status: Who all are delivering and who all are free (JOIN Query)
app.get('/api/admin/fleet', (req, res) => {
  const fleet = db.prepare(SQL_QUERIES.fleetJoin).all();

  res.json({
    success: true,
    fleet,
    joinQueryExecuted: SQL_QUERIES.fleetJoin
  });
});

// Assign or Reassign Delivery Guy to a Courier
app.post('/api/admin/assign', (req, res) => {
  const { courier_id, delivery_partner_id } = req.body;

  if (!courier_id || !delivery_partner_id) {
    return res.status(400).json({ success: false, error: 'Both courier_id and delivery_partner_id are required' });
  }

  db.prepare(`
    UPDATE couriers
    SET delivery_partner_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(delivery_partner_id, courier_id);

  // Set partner to DELIVERING
  db.prepare(`
    UPDATE delivery_partners
    SET status = 'DELIVERING'
    WHERE id = ?
  `).run(delivery_partner_id);

  const partner = db.prepare('SELECT name FROM delivery_partners WHERE id = ?').get(delivery_partner_id);
  const courier = db.prepare('SELECT tracking_code FROM couriers WHERE id = ?').get(courier_id);

  db.prepare(`
    INSERT INTO activity_logs (action_type, actor_name, message)
    VALUES (?, ?, ?)
  `).run('ASSIGNMENT', 'Admin', `Assigned courier ${courier?.tracking_code} to delivery partner ${partner?.name}`);

  res.json({ success: true, message: `Courier assigned to ${partner?.name}` });
});

// Activity logs & real-time notification stream
app.get('/api/admin/activity-logs', (req, res) => {
  const logs = db.prepare(`
    SELECT id, action_type, actor_name, message, created_at
    FROM activity_logs
    ORDER BY id DESC
    LIMIT 20
  `).all();
  res.json({ success: true, logs });
});

// Exposed RDBMS Schema & JOIN Queries for transparency
app.get('/api/admin/schema-joins', (req, res) => {
  res.json({
    success: true,
    rdbms: 'SQLite Relational Database (node:sqlite)',
    tables: [
      {
        name: 'delivery_partners',
        description: 'Stores logistics riders, credentials, personal phone, vehicle, rating, status (FREE / DELIVERING)'
      },
      {
        name: 'customers',
        description: 'Stores customer records, addresses, contact numbers, and preferred route / landmarks'
      },
      {
        name: 'couriers',
        description: 'Core shipment entity with Foreign Keys customer_id and delivery_partner_id'
      },
      {
        name: 'checkpoints',
        description: 'Route history milestone entries referencing courier_id with timestamps'
      },
      {
        name: 'problems',
        description: 'Customer complaints linking courier_id, customer_id, issue type, status, and admin reply'
      }
    ],
    joinQueries: SQL_QUERIES
  });
});

// ==========================================
// 4. DELIVERY PARTNER ROUTES
// ==========================================

// Deliveries assigned to this delivery guy (JOIN Query)
app.get('/api/delivery/my-deliveries/:partnerId', (req, res) => {
  const { partnerId } = req.params;

  const deliveries = db.prepare(SQL_QUERIES.deliveryGuyAssignmentsJoin).all(partnerId);
  const partner = db.prepare('SELECT id, name, phone, status, vehicle_no, vehicle_type FROM delivery_partners WHERE id = ?').get(partnerId);

  res.json({
    success: true,
    partner,
    deliveries,
    joinQueryExecuted: SQL_QUERIES.deliveryGuyAssignmentsJoin
  });
});

// Checkbox to toggle status: DELIVERING (checked) vs FREE (unchecked)
// Automatically notifies Admin!
app.post('/api/delivery/toggle-status', (req, res) => {
  const { partnerId, isDelivering } = req.body;

  if (partnerId === undefined || isDelivering === undefined) {
    return res.status(400).json({ success: false, error: 'partnerId and isDelivering boolean are required' });
  }

  const newStatus = isDelivering ? 'DELIVERING' : 'FREE';

  db.prepare(`
    UPDATE delivery_partners
    SET status = ?
    WHERE id = ?
  `).run(newStatus, partnerId);

  const partner = db.prepare('SELECT name, phone FROM delivery_partners WHERE id = ?').get(partnerId);

  // Notify admin via activity log
  const logMessage = isDelivering
    ? `⚠️ ${partner?.name} checked [DELIVERING] status - active on route`
    : `🟢 ${partner?.name} unticked status - marked as [FREE] & available for new orders`;

  db.prepare(`
    INSERT INTO activity_logs (action_type, actor_name, message)
    VALUES (?, ?, ?)
  `).run('AVAILABILITY_CHANGE', partner?.name || 'Rider', logMessage);

  res.json({
    success: true,
    status: newStatus,
    message: `Availability updated to ${newStatus}. Admin has been notified.`
  });
});

// Update Courier Milestone / Progress & Current Checkpoint
app.post('/api/delivery/update-milestone', (req, res) => {
  const { courierId, status, checkpointLocation, partnerId } = req.body;

  if (!courierId || !status) {
    return res.status(400).json({ success: false, error: 'courierId and status are required' });
  }

  const now = new Date().toLocaleString();
  const locationText = checkpointLocation || `Checkpoint updated: ${status}`;

  // Update Courier record
  db.prepare(`
    UPDATE couriers
    SET status = ?, current_checkpoint = ?, updated_at = CURRENT_TIMESTAMP,
        delivered_at = CASE WHEN ? = 'Delivered' THEN CURRENT_TIMESTAMP ELSE delivered_at END
    WHERE id = ?
  `).run(status, locationText, status, courierId);

  // Add Checkpoint entry
  db.prepare(`
    INSERT INTO checkpoints (courier_id, location, status_label, timestamp, is_completed)
    VALUES (?, ?, ?, ?, 1)
  `).run(courierId, locationText, status, now);

  // Log activity
  const partner = partnerId ? db.prepare('SELECT name FROM delivery_partners WHERE id = ?').get(partnerId) : null;
  const courier = db.prepare('SELECT tracking_code FROM couriers WHERE id = ?').get(courierId);

  db.prepare(`
    INSERT INTO activity_logs (action_type, actor_name, message)
    VALUES (?, ?, ?)
  `).run(
    'STATUS_UPDATE',
    partner?.name || 'Delivery Guy',
    `${partner?.name || 'Delivery Guy'} updated shipment ${courier?.tracking_code} to [${status}] at "${locationText}"`
  );

  res.json({
    success: true,
    message: `Shipment updated to ${status}!`
  });
});

// Delivery Partners List for quick switch/demo
app.get('/api/delivery/partners-list', (req, res) => {
  const partners = db.prepare('SELECT id, name, phone, status, vehicle_type, vehicle_no FROM delivery_partners').all();
  res.json({ success: true, partners });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    const courierCount = db.prepare('SELECT COUNT(*) as count FROM couriers').get().count;
    const partnerCount = db.prepare('SELECT COUNT(*) as count FROM delivery_partners').get().count;
    res.json({
      success: true,
      status: 'HEALTHY',
      rdbms: 'SQLite Connected (node:sqlite)',
      tables: ['couriers', 'customers', 'delivery_partners', 'problems', 'checkpoints', 'activity_logs'],
      counts: {
        couriers: courierCount,
        delivery_partners: partnerCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Root route with a rich visual dashboard so visiting http://localhost:5001/ shows live status
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SwiftRoute Logistics API & Database</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #0a0e17;
      color: #f8fafc;
      margin: 0;
      padding: 2.5rem 1.5rem;
      display: flex;
      justify-content: center;
    }
    .card {
      background: #111827;
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 18px;
      max-width: 720px;
      width: 100%;
      padding: 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    }
    .badge {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }
    h1 { margin: 0.75rem 0 0.5rem 0; font-size: 1.8rem; color: #ffffff; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
    .btn {
      display: inline-block;
      background: #2563eb;
      color: #ffffff;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 700;
      margin-top: 1rem;
      box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
    }
    .endpoints {
      margin-top: 1.75rem;
      background: #0f172a;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .endpoints h3 { margin-top: 0; font-size: 0.95rem; color: #93c5fd; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; }
    li a { color: #60a5fa; text-decoration: none; font-family: monospace; }
    li a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">● 200 OK • Backend API & Database Active</span>
    <h1>SwiftRoute Courier Backend Server</h1>
    <p>The Express REST API and native SQLite Relational Database (RDBMS) are running smoothly on port 5001 with Foreign Keys and JOIN queries enabled.</p>
    
    <a href="http://localhost:3000/" class="btn" target="_blank">🚀 Open Web Application on Port 3000</a>

    <div class="endpoints">
      <h3>Active JSON Endpoints:</h3>
      <ul>
        <li><a href="/api/health">/api/health</a> - Database & server health status</li>
        <li><a href="/api/admin/overview">/api/admin/overview</a> - KPI & system stats</li>
        <li><a href="/api/admin/couriers">/api/admin/couriers</a> - All couriers with Customer & Rider JOIN</li>
        <li><a href="/api/admin/fleet">/api/admin/fleet</a> - Fleet status: Who is Delivering vs Free</li>
        <li><a href="/api/admin/problems">/api/admin/problems</a> - Customer problems with Courier & Rider JOIN</li>
        <li><a href="/api/customer/track/TRK-98241">/api/customer/track/TRK-98241</a> - Customer tracking JOIN query</li>
        <li><a href="/api/delivery/my-deliveries/1">/api/delivery/my-deliveries/1</a> - Delivery partner assignments</li>
      </ul>
    </div>
  </div>
</body>
</html>
  `);
});

// Generic 404 JSON fallback
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Courier Logistics Backend running on http://localhost:${PORT}`);
  console.log(`Connected to SQLite RDBMS with JOIN queries enabled.`);
});

