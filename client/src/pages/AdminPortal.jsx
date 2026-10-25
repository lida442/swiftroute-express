import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Users, 
  Truck, 
  AlertCircle, 
  CheckCircle, 
  MessageSquare, 
  MapPin, 
  Phone, 
  Send, 
  Compass, 
  ExternalLink, 
  Radio, 
  RefreshCw, 
  Bike,
  UserCheck,
  UserX,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  LogOut
} from 'lucide-react';

export default function AdminPortal({ onOpenMap, onOpenSqlInspector }) {
  // Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('swiftroute_admin_auth') === 'true';
  });
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard Data State
  const [activeTab, setActiveTab] = useState('fleet'); // 'fleet' | 'problems' | 'tracking' | 'logs'
  const [stats, setStats] = useState(null);
  const [fleet, setFleet] = useState([]);
  const [problems, setProblems] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Admin Reply Form State
  const [replyTextMap, setReplyTextMap] = useState({});
  const [replyStatusMap, setReplyStatusMap] = useState({});
  const [submittingReplyId, setSubmittingReplyId] = useState(null);

  // Fleet Filter
  const [fleetFilter, setFleetFilter] = useState('ALL'); // 'ALL' | 'FREE' | 'DELIVERING'

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadAllAdminData();
    }
  }, [isAdminAuthenticated]);

  const loadAllAdminData = async () => {
    setLoadingData(true);
    try {
      const [overviewRes, fleetRes, problemsRes, couriersRes, logsRes] = await Promise.all([
        fetch('/api/admin/overview').then(r => r.json()),
        fetch('/api/admin/fleet').then(r => r.json()),
        fetch('/api/admin/problems').then(r => r.json()),
        fetch('/api/admin/couriers').then(r => r.json()),
        fetch('/api/admin/activity-logs').then(r => r.json())
      ]);

      if (overviewRes.success) setStats(overviewRes.stats);
      if (fleetRes.success) setFleet(fleetRes.fleet || []);
      if (problemsRes.success) setProblems(problemsRes.problems || []);
      if (couriersRes.success) setCouriers(couriersRes.couriers || []);
      if (logsRes.success) setActivityLogs(logsRes.logs || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      });
      const data = await res.json();

      if (data.success) {
        setIsAdminAuthenticated(true);
        localStorage.setItem('swiftroute_admin_auth', 'true');
        loadAllAdminData();
      } else {
        setAuthError(data.error || 'Invalid admin password.');
      }
    } catch (err) {
      setAuthError('Failed to communicate with authentication server.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('swiftroute_admin_auth');
  };

  // ADMIN REPLY TO CUSTOMER PROBLEM (REQUIREMENT)
  const handleSendReply = async (problemId) => {
    const replyText = replyTextMap[problemId];
    if (!replyText || !replyText.trim()) {
      alert('Please enter a reply message for the customer.');
      return;
    }

    const status = replyStatusMap[problemId] || 'RESOLVED';
    setSubmittingReplyId(problemId);

    try {
      const res = await fetch(`/api/admin/problems/${problemId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim(), status })
      });

      const data = await res.json();
      if (data.success) {
        alert('Reply successfully sent to customer and status updated to ' + status);
        setReplyTextMap(prev => ({ ...prev, [problemId]: '' }));
        loadAllAdminData();
      } else {
        alert(data.error || 'Failed to send reply.');
      }
    } catch (err) {
      alert('Error sending reply: ' + err.message);
    } finally {
      setSubmittingReplyId(null);
    }
  };

  // 1. PASSWORD AUTHENTICATION SCREEN
  if (!isAdminAuthenticated) {
    return (
      <div style={{ maxWidth: '480px', margin: '4.5rem auto', padding: '1rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem', border: '1px solid rgba(139, 92, 246, 0.35)', borderRadius: '24px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              boxShadow: '0 0 25px rgba(139, 92, 246, 0.5)'
            }}>
              <ShieldCheck size={30} color="#ffffff" />
            </div>
            <h2 style={{ fontSize: '1.75rem', color: '#ffffff', margin: '0 0 0.5rem 0' }}>
              Operations Admin Portal
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
              Restricted management console. Password authentication required.
            </p>
          </div>

          {authError && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '0.75rem',
              color: '#f87171',
              fontSize: '0.82rem',
              marginBottom: '1.25rem'
            }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                Administrator Password:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  required
                />
                <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              style={{
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                padding: '0.85rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)'
              }}
            >
              {authLoading ? 'Verifying Password...' : 'Authenticate Admin Access'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Default Administrator password: <code style={{ color: '#c084fc', background: 'rgba(255,255,255,0.08)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>admin123</code>
            </span>
          </div>

        </div>
      </div>
    );
  }

  // Filtered fleet partners
  const filteredFleet = fleet.filter((partner) => {
    if (fleetFilter === 'FREE') return partner.status === 'FREE';
    if (fleetFilter === 'DELIVERING') return partner.status === 'DELIVERING';
    return true;
  });

  // 2. AUTHENTICATED ADMIN DASHBOARD
  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Banner & Refresh Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#ffffff' }}>
              Logistics Operations Control Tower
            </h1>
            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
              Admin Access Active
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Monitor route tracking, reply to customer problems, and track fleet availability (who is delivering vs free).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={loadAllAdminData}
            disabled={loadingData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} className={loadingData ? 'pulse-dot' : ''} />
            <span>{loadingData ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>

          <button
            onClick={onOpenSqlInspector}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              color: '#c084fc',
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <span>JOIN Query Inspector</span>
          </button>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '0.6rem 0.95rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <LogOut size={15} />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem'
        }}>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Shipments
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
              {stats.totalCouriers}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#60a5fa', marginTop: '0.2rem' }}>
              {stats.activeDeliveries} Active In Transit
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              Open Customer Issues
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stats.openProblems > 0 ? '#f43f5e' : '#34d399', marginTop: '0.2rem' }}>
              {stats.openProblems}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '0.2rem' }}>
              Requires Admin Reply
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>
              🟢 Free Delivery Guys
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
              {stats.freePartners}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Unticked & Available
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '0.72rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700 }}>
              🟠 Delivering Riders
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.2rem' }}>
              {stats.deliveringPartners}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Ticked on active route
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Registered Fleet
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c084fc', marginTop: '0.2rem' }}>
              {stats.totalPartners}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Verified Logistics Partners
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Controls */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'fleet', label: 'Fleet Availability (Who is Delivering vs. Free)', icon: Bike, count: fleet.length },
          { id: 'problems', label: 'Customer Problems & Reply Console', icon: MessageSquare, count: problems.length, badgeColor: problems.length > 0 ? '#f43f5e' : undefined },
          { id: 'tracking', label: 'Route Tracking & Shipments', icon: MapPin, count: couriers.length },
          { id: 'logs', label: 'Live Notifications & Real-Time Logs', icon: Radio, count: activityLogs.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.65rem 1.15rem',
                borderRadius: '12px',
                backgroundColor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: isActive ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                color: isActive ? '#93c5fd' : '#94a3b8',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              <Icon size={17} color={isActive ? '#60a5fa' : 'currentColor'} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{
                  fontSize: '0.7rem',
                  backgroundColor: tab.badgeColor || (isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'),
                  color: '#ffffff',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '999px',
                  fontWeight: 700
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FLEET AVAILABILITY - WHO ALL ARE DELIVERING AND WHO ALL ARE FREE */}
      {/* ========================================================================= */}
      {activeTab === 'fleet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
                Delivery Personnel Fleet Status
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Admin view showing who all are actively delivering (ticked) vs who all are free (unticked).
              </p>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: 'rgba(15, 23, 42, 0.7)', padding: '0.3rem', borderRadius: '10px' }}>
              <button
                onClick={() => setFleetFilter('ALL')}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backgroundColor: fleetFilter === 'ALL' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  color: fleetFilter === 'ALL' ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                All Riders ({fleet.length})
              </button>

              <button
                onClick={() => setFleetFilter('FREE')}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backgroundColor: fleetFilter === 'FREE' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                  color: fleetFilter === 'FREE' ? '#34d399' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                🟢 Free / Available ({fleet.filter(f => f.status === 'FREE').length})
              </button>

              <button
                onClick={() => setFleetFilter('DELIVERING')}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backgroundColor: fleetFilter === 'DELIVERING' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                  color: fleetFilter === 'DELIVERING' ? '#fbbf24' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                🟠 Delivering ({fleet.filter(f => f.status === 'DELIVERING').length})
              </button>
            </div>
          </div>

          {/* Fleet Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filteredFleet.map((rider) => {
              const isFree = rider.status === 'FREE';
              return (
                <div
                  key={rider.id}
                  className="glass-panel"
                  style={{
                    padding: '1.5rem',
                    border: `1.5px solid ${isFree ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Top Status Strip */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`pulse-dot`} style={{ backgroundColor: isFree ? '#10b981' : '#f59e0b' }} />
                      <span className={`badge ${isFree ? 'badge-emerald' : 'badge-amber'}`}>
                        {isFree ? '🟢 FREE & AVAILABLE' : '🟠 CURRENTLY DELIVERING'}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Rating: ⭐ {rider.rating}
                    </span>
                  </div>

                  {/* Rider Identity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: isFree ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isFree ? '#34d399' : '#fbbf24'
                    }}>
                      <Bike size={24} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff' }}>
                        {rider.name}
                      </h4>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {rider.vehicle_type} ({rider.vehicle_no})
                      </div>
                    </div>
                  </div>

                  {/* Contact & Zone Box */}
                  <div style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    borderRadius: '12px',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8' }}>Personal Phone:</span>
                      <a 
                        href={`tel:${rider.personal_phone}`}
                        style={{ color: '#34d399', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
                      >
                        📞 {rider.personal_phone}
                      </a>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8' }}>Assigned Zone:</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{rider.current_zone}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8' }}>Active Orders:</span>
                      <span style={{ color: isFree ? '#94a3b8' : '#fbbf24', fontWeight: 700 }}>
                        {rider.active_deliveries_count || 0} Shipments
                      </span>
                    </div>
                  </div>

                  {/* Rider Status Badge Footnote */}
                  <div style={{
                    fontSize: '0.75rem',
                    color: isFree ? '#34d399' : '#fbbf24',
                    backgroundColor: isFree ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px'
                  }}>
                    {isFree 
                      ? '✓ Unticked delivery checkbox. Ready for immediate assignment.' 
                      : '⚠️ Ticked delivery checkbox. Currently on active delivery route.'}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CUSTOMER PROBLEMS FACED & ADMIN REPLY CONSOLE */}
      {/* ========================================================================= */}
      {activeTab === 'problems' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
              Customer Problem Reports & Resolution Console
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Shows problems faced by customers, who delivered / is delivering, customer contact, and admin reply box.
            </p>
          </div>

          {problems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {problems.map((problem) => (
                <div
                  key={problem.problem_id}
                  className="glass-panel"
                  style={{
                    padding: '1.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
                  }}
                >
                  {/* Top Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <AlertTriangle size={22} color="#f43f5e" />
                      <strong style={{ fontSize: '1.15rem', color: '#ffffff' }}>
                        Issue: {problem.issue_type}
                      </strong>
                      <span className={`badge ${
                        problem.problem_status === 'RESOLVED' ? 'badge-emerald' : 'badge-rose'
                      }`}>
                        {problem.problem_status}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Reported on: {problem.problem_created_at}
                    </span>
                  </div>

                  {/* 3-Column Info Cards: Customer, Courier, Assigned Delivery Guy */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    
                    {/* Customer Info */}
                    <div style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.7)',
                      borderRadius: '12px',
                      padding: '1rem',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                        👤 Customer Facing Problem:
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.2rem' }}>
                        {problem.customer_name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '0.2rem' }}>
                        📞 {problem.customer_phone}
                      </div>
                    </div>

                    {/* Shipment Info */}
                    <div style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.7)',
                      borderRadius: '12px',
                      padding: '1rem',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                        📦 Shipment Details:
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#60a5fa', marginTop: '0.2rem' }}>
                        {problem.tracking_code}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                        Dest: {problem.destination}
                      </div>
                    </div>

                    {/* WHO DELIVERED / IS DELIVERING (REQUIREMENT) */}
                    <div style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.7)',
                      borderRadius: '12px',
                      padding: '1rem',
                      border: '1px solid rgba(139, 92, 246, 0.3)'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 700 }}>
                        🛵 Who Delivered / Delivering:
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#c084fc', marginTop: '0.2rem' }}>
                        {problem.delivery_guy_name || 'Unassigned / Central Depot'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '0.2rem' }}>
                        Personal No: {problem.delivery_guy_phone || 'N/A'}
                      </div>
                    </div>

                  </div>

                  {/* Problem Description as typed by Customer */}
                  <div style={{
                    backgroundColor: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    borderRadius: '12px',
                    padding: '1rem',
                    fontSize: '0.88rem',
                    color: '#fecdd3',
                    lineHeight: 1.5
                  }}>
                    <strong style={{ color: '#fb7185' }}>Customer's Statement: </strong>
                    "{problem.description}"
                  </div>

                  {/* Existing Reply if already replied */}
                  {problem.admin_reply && (
                    <div style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderLeft: '4px solid #3b82f6',
                      padding: '0.85rem 1.25rem',
                      borderRadius: '0 10px 10px 0'
                    }}>
                      <div style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                        Previous Admin Response ({problem.replied_at}):
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#f1f5f9' }}>
                        {problem.admin_reply}
                      </div>
                    </div>
                  )}

                  {/* REQUIREMENT: ADMIN OPTION TO REPLY TO THE CUSTOMERS */}
                  <div style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#93c5fd' }}>
                        💬 Send Official Reply to Customer:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Update Ticket Status:</span>
                        <select
                          value={replyStatusMap[problem.problem_id] || (problem.problem_status === 'OPEN' ? 'RESOLVED' : problem.problem_status)}
                          onChange={(e) => setReplyStatusMap({ ...replyStatusMap, [problem.problem_id]: e.target.value })}
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                        >
                          <option value="INVESTIGATING">INVESTIGATING</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="OPEN">KEEP OPEN</option>
                        </select>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Type reply to customer (e.g. We have instructed the rider to take Gate 3 and he is arriving in 5 minutes)..."
                      value={replyTextMap[problem.problem_id] || ''}
                      onChange={(e) => setReplyTextMap({ ...replyTextMap, [problem.problem_id]: e.target.value })}
                      style={{ width: '100%', fontSize: '0.85rem', resize: 'vertical' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleSendReply(problem.problem_id)}
                        disabled={submittingReplyId === problem.problem_id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          padding: '0.55rem 1.25rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
                        }}
                      >
                        <Send size={14} />
                        <span>{submittingReplyId === problem.problem_id ? 'Sending...' : 'Send Reply to Customer'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0' }}>All Customer Inquiries Resolved</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                There are currently no unresolved customer complaints.
              </p>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ROUTE TRACKING & ALL SHIPMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'tracking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
              Live Route Tracking & Shipments Overview
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Admin route tracking for every parcel, current checkpoint milestones, and customer preferred directions.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {couriers.map((courier) => (
              <div
                key={courier.id}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Truck size={22} color="#60a5fa" />
                    <div>
                      <strong style={{ fontSize: '1.1rem', color: '#ffffff' }}>
                        {courier.tracking_code}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                        Recipient: <strong>{courier.customer_name}</strong> ({courier.customer_phone})
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge ${
                      courier.status === 'Delivered' ? 'badge-emerald' : 
                      courier.status === 'Out for Delivery' ? 'badge-blue' : 'badge-amber'
                    }`}>
                      {courier.status}
                    </span>

                    <button
                      onClick={() => onOpenMap(courier)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.35)',
                        color: '#60a5fa',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Compass size={14} />
                      <span>View Route & Map</span>
                    </button>
                  </div>
                </div>

                {/* Route Points */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.75rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  padding: '0.85rem',
                  borderRadius: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Origin Hub:</div>
                    <div style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>{courier.origin}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Current Checkpoint:</div>
                    <div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 600 }}>{courier.current_checkpoint}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Destination:</div>
                    <div style={{ fontSize: '0.82rem', color: '#4ade80', fontWeight: 600 }}>{courier.destination}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Assigned Rider:</div>
                    <div style={{ fontSize: '0.82rem', color: '#c084fc', fontWeight: 600 }}>
                      {courier.delivery_guy_name ? `${courier.delivery_guy_name} (${courier.delivery_guy_personal_phone})` : 'Unassigned'}
                    </div>
                  </div>
                </div>

                {/* Stated Route advice */}
                {courier.preferred_route && (
                  <div style={{ fontSize: '0.78rem', color: '#fbbf24', backgroundColor: 'rgba(245, 158, 11, 0.08)', padding: '0.5rem 0.85rem', borderRadius: '8px' }}>
                    🗺️ <strong>Customer Stated Route:</strong> "{courier.preferred_route}"
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REAL-TIME NOTIFICATIONS & ACTIVITY FEED */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
              Real-Time Activity & Rider Notification Stream
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Live audit trail of riders ticking/unticking delivery checkboxes, customer complaints, and updates.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span className={`badge ${
                      log.action_type === 'AVAILABILITY_CHANGE' ? 'badge-amber' :
                      log.action_type === 'PROBLEM_FILED' ? 'badge-rose' : 'badge-blue'
                    }`} style={{ fontSize: '0.65rem' }}>
                      {log.action_type}
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: '#f1f5f9' }}>
                      {log.actor_name}:
                    </strong>
                    <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                      {log.message}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {log.created_at}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
