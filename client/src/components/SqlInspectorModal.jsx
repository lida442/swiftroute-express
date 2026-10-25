import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Code2, 
  Play, 
  Layers, 
  Table, 
  CheckCircle, 
  Key, 
  ArrowRight,
  Terminal,
  Sparkles
} from 'lucide-react';

export default function SqlInspectorModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('joins');
  const [queryResult, setQueryResult] = useState(null);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [selectedJoinIndex, setSelectedJoinIndex] = useState(0);

  const sqlJoins = [
    {
      title: '1. Courier Full Details JOIN (Couriers + Customers + Delivery Partners)',
      type: 'INNER JOIN & LEFT JOIN',
      purpose: 'Retrieves complete shipment tracking, customer personal info, preferred route, and assigned delivery guy personal phone.',
      sql: `SELECT 
  c.id, c.tracking_code, c.origin, c.destination, c.current_checkpoint, 
  c.status, c.package_type, c.weight_kg, c.estimated_delivery,
  cust.id as customer_id, cust.name as customer_name, cust.phone as customer_phone, 
  cust.address as customer_address, cust.preferred_route,
  dp.id as delivery_partner_id, dp.name as delivery_guy_name, 
  dp.phone as delivery_guy_personal_phone, dp.status as delivery_partner_status, 
  dp.vehicle_no, dp.rating as delivery_guy_rating
FROM couriers c
INNER JOIN customers cust ON c.customer_id = cust.id
LEFT JOIN delivery_partners dp ON c.delivery_partner_id = dp.id
ORDER BY c.created_at DESC;`,
      endpoint: '/api/admin/couriers',
      resultKey: 'couriers'
    },
    {
      title: '2. Customer Problem Reports JOIN (Problems + Couriers + Customers + Delivery Partners)',
      type: '3-WAY RELATIONAL JOIN',
      purpose: 'Enables Admin to review customer complaints, the specific package involved, and which delivery guy was assigned.',
      sql: `SELECT 
  p.id as problem_id, p.issue_type, p.description, p.status as problem_status, 
  p.admin_reply, p.replied_at, p.created_at as problem_created_at,
  c.id as courier_id, c.tracking_code, c.origin, c.destination, c.status as courier_status,
  cust.id as customer_id, cust.name as customer_name, cust.phone as customer_phone,
  dp.id as delivery_partner_id, dp.name as delivery_guy_name, dp.phone as delivery_guy_phone
FROM problems p
INNER JOIN couriers c ON p.courier_id = c.id
INNER JOIN customers cust ON p.customer_id = cust.id
LEFT JOIN delivery_partners dp ON c.delivery_partner_id = dp.id
ORDER BY p.created_at DESC;`,
      endpoint: '/api/admin/problems',
      resultKey: 'problems'
    },
    {
      title: '3. Fleet Workload & Availability JOIN (Delivery Partners + Active Couriers Count)',
      type: 'LEFT JOIN with AGGREGATE COUNT & GROUP BY',
      purpose: 'Admin view to determine who all are currently Delivering vs. who all are Free (idle).',
      sql: `SELECT 
  dp.id, dp.name, dp.phone as personal_phone, dp.status, dp.vehicle_type, 
  dp.vehicle_no, dp.current_zone, dp.rating,
  COUNT(CASE WHEN c.status NOT IN ('Delivered') THEN 1 END) as active_deliveries_count
FROM delivery_partners dp
LEFT JOIN couriers c ON dp.id = c.delivery_partner_id AND c.status NOT IN ('Delivered')
GROUP BY dp.id
ORDER BY dp.status ASC, dp.name ASC;`,
      endpoint: '/api/admin/fleet',
      resultKey: 'fleet'
    },
    {
      title: '4. Delivery Guy Active Assignments JOIN (Couriers + Customers)',
      type: 'INNER JOIN with Parameterized Filter',
      purpose: 'Displays to the delivery rider where they are delivering, to whom, customer phone number, and preferred route instructions.',
      sql: `SELECT 
  c.id, c.tracking_code, c.origin, c.destination, c.current_checkpoint,
  c.status, c.package_type, c.weight_kg, c.estimated_delivery,
  cust.name as customer_name, cust.phone as customer_phone, 
  cust.address as customer_address, cust.preferred_route
FROM couriers c
INNER JOIN customers cust ON c.customer_id = cust.id
WHERE c.delivery_partner_id = 1
ORDER BY c.updated_at DESC;`,
      endpoint: '/api/delivery/my-deliveries/1',
      resultKey: 'deliveries'
    }
  ];

  const tables = [
    {
      name: 'couriers',
      primaryKey: 'id',
      foreignKeys: ['customer_id -> customers(id)', 'delivery_partner_id -> delivery_partners(id)'],
      columns: ['id (PK)', 'tracking_code (UNIQUE)', 'customer_id (FK)', 'delivery_partner_id (FK)', 'origin', 'destination', 'current_checkpoint', 'status', 'package_type', 'weight_kg', 'estimated_delivery', 'delivered_at', 'created_at', 'updated_at']
    },
    {
      name: 'customers',
      primaryKey: 'id',
      foreignKeys: [],
      columns: ['id (PK)', 'name', 'phone', 'email', 'address', 'city', 'preferred_route', 'created_at']
    },
    {
      name: 'delivery_partners',
      primaryKey: 'id',
      foreignKeys: [],
      columns: ['id (PK)', 'name', 'phone (UNIQUE)', 'password', 'status (FREE | DELIVERING)', 'vehicle_type', 'vehicle_no', 'current_zone', 'rating', 'created_at']
    },
    {
      name: 'problems',
      primaryKey: 'id',
      foreignKeys: ['courier_id -> couriers(id)', 'customer_id -> customers(id)'],
      columns: ['id (PK)', 'courier_id (FK)', 'customer_id (FK)', 'issue_type', 'description', 'status (OPEN | INVESTIGATING | RESOLVED)', 'admin_reply', 'replied_at', 'created_at']
    },
    {
      name: 'checkpoints',
      primaryKey: 'id',
      foreignKeys: ['courier_id -> couriers(id)'],
      columns: ['id (PK)', 'courier_id (FK)', 'location', 'status_label', 'timestamp', 'is_completed']
    }
  ];

  const runLiveTest = async (index) => {
    setSelectedJoinIndex(index);
    setLoadingQuery(true);
    setQueryResult(null);
    try {
      const target = sqlJoins[index];
      const res = await fetch(target.endpoint);
      const json = await res.json();
      setQueryResult({
        rows: json[target.resultKey] || json.data || [],
        count: (json[target.resultKey] || json.data || []).length,
        executedSql: target.sql
      });
    } catch (err) {
      setQueryResult({ error: err.message });
    } finally {
      setLoadingQuery(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 8, 15, 0.88)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '1.25rem'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          backgroundColor: '#0a0f1d',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Top Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Database size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>
                  RDBMS & SQL JOIN Query Architecture
                </h3>
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                  SQLite Native Engine
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                Relational Foreign Keys, Normalization & Multi-Table SQL JOINs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              padding: '0.5rem',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Controls */}
        <div style={{
          display: 'flex',
          padding: '0.75rem 1.75rem',
          gap: '0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          backgroundColor: 'rgba(15, 23, 42, 0.6)'
        }}>
          <button
            onClick={() => setActiveTab('joins')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              backgroundColor: activeTab === 'joins' ? '#8b5cf6' : 'transparent',
              color: activeTab === 'joins' ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <Code2 size={16} />
            <span>SQL JOIN Queries ({sqlJoins.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              backgroundColor: activeTab === 'schema' ? '#8b5cf6' : 'transparent',
              color: activeTab === 'schema' ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <Table size={16} />
            <span>Relational Schema & Foreign Keys ({tables.length} Tables)</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {activeTab === 'joins' && (
            <>
              <div style={{
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '12px',
                padding: '0.85rem 1.25rem',
                fontSize: '0.82rem',
                color: '#93c5fd',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Sparkles size={18} color="#60a5fa" />
                <span>
                  All courier, rider, customer, and complaint relationships are managed via native SQL Relational JOIN queries. Click <strong>"Execute Live Query"</strong> below to test live execution in SQLite!
                </span>
              </div>

              {/* Joins Accordion / List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {sqlJoins.map((join, idx) => (
                  <div 
                    key={idx}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: selectedJoinIndex === idx ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                          {join.type}
                        </span>
                        <strong style={{ fontSize: '0.95rem', color: '#f1f5f9' }}>
                          {join.title}
                        </strong>
                      </div>

                      <button
                        onClick={() => runLiveTest(idx)}
                        disabled={loadingQuery && selectedJoinIndex === idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          padding: '0.4rem 0.9rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Play size={14} fill="#ffffff" />
                        <span>{loadingQuery && selectedJoinIndex === idx ? 'Executing...' : 'Execute Live Query'}</span>
                      </button>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                      {join.purpose}
                    </p>

                    {/* SQL Code Box */}
                    <pre style={{
                      margin: 0,
                      backgroundColor: '#050811',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      color: '#a5b4fc',
                      overflowX: 'auto',
                      lineHeight: 1.45
                    }}>
                      {join.sql}
                    </pre>
                  </div>
                ))}
              </div>

              {/* Live Query Results Table */}
              {queryResult && (
                <div style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={18} color="#10b981" />
                      <strong style={{ fontSize: '0.92rem', color: '#34d399' }}>
                        Live SQLite Query Executed Successfully ({queryResult.count} records returned)
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      RDBMS: node:sqlite DB
                    </span>
                  </div>

                  <div style={{ maxHeight: '240px', overflow: 'auto', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}>
                    {queryResult.rows && queryResult.rows.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', color: '#94a3b8' }}>
                            {Object.keys(queryResult.rows[0]).slice(0, 7).map((col) => (
                              <th key={col} style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.rows.map((row, rIdx) => (
                            <tr 
                              key={rIdx} 
                              style={{ 
                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
                              }}
                            >
                              {Object.keys(queryResult.rows[0]).slice(0, 7).map((col) => (
                                <td key={col} style={{ padding: '0.5rem 0.75rem', color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                                  {String(row[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center' }}>
                        No records found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'schema' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {tables.map((tbl) => (
                <div 
                  key={tbl.name}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '1rem', color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                      {tbl.name}
                    </strong>
                    <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                      Table
                    </span>
                  </div>

                  {tbl.foreignKeys.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase' }}>
                        Foreign Keys:
                      </div>
                      {tbl.foreignKeys.map((fk, fIdx) => (
                        <div 
                          key={fIdx} 
                          style={{ 
                            fontSize: '0.72rem', 
                            color: '#fbbf24', 
                            fontFamily: 'var(--font-mono)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem' 
                          }}
                        >
                          <Key size={11} />
                          <span>{fk}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Columns:
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {tbl.columns.map((col) => (
                      <span 
                        key={col}
                        style={{
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          backgroundColor: col.includes('PK') ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          color: col.includes('PK') ? '#c084fc' : '#cbd5e1',
                          padding: '0.2rem 0.45rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: '#0a0f1d'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.6rem 1.4rem',
              borderRadius: '10px',
              backgroundColor: '#8b5cf6',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}
