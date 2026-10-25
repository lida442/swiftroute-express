import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Truck, 
  ShieldCheck, 
  Bike, 
  Database, 
  Bell, 
  Activity, 
  Radio, 
  Sparkles 
} from 'lucide-react';

export default function Navbar({ onOpenSqlInspector, unreadLogsCount }) {
  const location = useLocation();
  const [serverOnline, setServerOnline] = useState(true);

  useEffect(() => {
    // Quick check if server is responsive
    fetch('/api/health')
      .then(res => setServerOnline(res.ok))
      .catch(() => setServerOnline(false));
  }, [location.pathname]);

  const navItems = [
    { 
      path: '/', 
      label: 'Customer Tracking', 
      icon: Truck, 
      sub: 'Public Access' 
    },
    { 
      path: '/delivery', 
      label: 'Delivery Portal', 
      icon: Bike, 
      sub: 'Rider Login' 
    },
    { 
      path: '/admin', 
      label: 'Admin Operations', 
      icon: ShieldCheck, 
      sub: 'Password Protected' 
    }
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(10, 14, 23, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '0.85rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      {/* Brand Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
        }}>
          <Truck size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: '1.25rem', 
              fontWeight: 800, 
              background: 'linear-gradient(90deg, #60a5fa, #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              SwiftRoute
            </span>
            <span style={{ 
              fontSize: '0.65rem', 
              padding: '0.15rem 0.45rem', 
              borderRadius: '6px', 
              background: 'rgba(59, 130, 246, 0.2)', 
              color: '#93c5fd', 
              fontWeight: 700 
            }}>
              RDBMS v2.0
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
            Live Courier Logistics & Fleet Network
          </p>
        </div>
      </Link>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === '/' && location.pathname === '/customer');

          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '12px',
                backgroundColor: isActive ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
                border: isActive ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                color: isActive ? '#93c5fd' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={17} color={isActive ? '#60a5fa' : 'currentColor'} />
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.sub}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Action Badges & SQL Inspector Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* RDBMS & JOIN Query Inspector Button */}
        <button
          onClick={onOpenSqlInspector}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 0.95rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            color: '#c084fc',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Inspect SQLite Relational Database & JOIN Queries"
        >
          <Database size={16} />
          <span>JOIN Query & RDBMS</span>
          <span style={{
            fontSize: '0.65rem',
            backgroundColor: '#8b5cf6',
            color: '#ffffff',
            padding: '0.1rem 0.4rem',
            borderRadius: '999px',
            fontWeight: 700
          }}>
            SQL
          </span>
        </button>

        {/* Live Server Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.75rem',
          borderRadius: '999px',
          backgroundColor: serverOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${serverOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          fontSize: '0.72rem',
          color: serverOnline ? '#34d399' : '#f87171',
          fontWeight: 600
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: serverOnline ? '#10b981' : '#ef4444',
            boxShadow: serverOnline ? '0 0 8px #10b981' : 'none'
          }} />
          <span>{serverOnline ? 'RDBMS Online (5001)' : 'Connecting...'}</span>
        </div>
      </div>
    </header>
  );
}
