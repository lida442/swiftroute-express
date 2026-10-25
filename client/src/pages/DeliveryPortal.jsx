import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Compass, 
  ExternalLink, 
  CheckSquare, 
  Square, 
  Clock, 
  CheckCircle2, 
  Package, 
  LogOut, 
  Bell, 
  Navigation,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function DeliveryPortal({ onOpenMap }) {
  // Authentication State
  const [partner, setPartner] = useState(() => {
    const saved = localStorage.getItem('swiftroute_delivery_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [nameInput, setNameInput] = useState('Vikram Singh');
  const [passwordInput, setPasswordInput] = useState('deliver123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Deliveries & Status State
  const [deliveries, setDeliveries] = useState([]);
  const [isDelivering, setIsDelivering] = useState(false);
  const [statusNotification, setStatusNotification] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Custom checkpoint text map for quick updates
  const [checkpointInputs, setCheckpointInputs] = useState({});

  useEffect(() => {
    if (partner) {
      loadDeliveries(partner.id);
      setIsDelivering(partner.status === 'DELIVERING');
    }
  }, [partner]);

  const loadDeliveries = async (partnerId) => {
    try {
      const res = await fetch(`/api/delivery/my-deliveries/${partnerId}`);
      const data = await res.json();
      if (data.success) {
        setDeliveries(data.deliveries || []);
        if (data.partner) {
          setIsDelivering(data.partner.status === 'DELIVERING');
        }
      }
    } catch (err) {
      console.error('Error fetching deliveries:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/delivery-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim(), password: passwordInput })
      });
      const data = await res.json();

      if (data.success && data.partner) {
        setPartner(data.partner);
        localStorage.setItem('swiftroute_delivery_user', JSON.stringify(data.partner));
        setIsDelivering(data.partner.status === 'DELIVERING');
        loadDeliveries(data.partner.id);
      } else {
        setLoginError(data.error || 'Invalid credentials.');
      }
    } catch (err) {
      setLoginError('Server connection error. Please make sure backend is running.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setPartner(null);
    localStorage.removeItem('swiftroute_delivery_user');
  };

  // CHECKBOX TOGGLE: Tick when delivering, Untick for free. Automatically notifies Admin!
  const handleToggleStatus = async (newVal) => {
    if (!partner) return;
    setUpdatingStatus(true);
    setStatusNotification('');

    try {
      const res = await fetch('/api/delivery/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          isDelivering: newVal
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsDelivering(newVal);
        setStatusNotification(data.message);
        // Update stored partner status
        const updated = { ...partner, status: data.status };
        setPartner(updated);
        localStorage.setItem('swiftroute_delivery_user', JSON.stringify(updated));
      } else {
        alert(data.error || 'Failed to update status.');
      }
    } catch (err) {
      alert('Error updating availability: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Update Milestone Status
  const handleUpdateMilestone = async (courierId, newStatus) => {
    const customCheckpoint = checkpointInputs[courierId] || '';
    try {
      const res = await fetch('/api/delivery/update-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierId,
          partnerId: partner.id,
          status: newStatus,
          checkpointLocation: customCheckpoint || `${newStatus} by ${partner.name}`
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`Shipment status updated to: ${newStatus}`);
        setCheckpointInputs(prev => ({ ...prev, [courierId]: '' }));
        loadDeliveries(partner.id);
      }
    } catch (err) {
      alert('Error updating milestone: ' + err.message);
    }
  };

  // 1. LOGIN SCREEN (If not authenticated)
  if (!partner) {
    return (
      <div style={{ maxWidth: '520px', margin: '4rem auto', padding: '1rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '24px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <Bike size={30} color="#60a5fa" />
            </div>
            <h2 style={{ fontSize: '1.75rem', color: '#ffffff', margin: '0 0 0.5rem 0' }}>
              Delivery Partner Portal
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
              Authorized delivery riders only. Sign in with your registered Name and Password.
            </p>
          </div>

          {loginError && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '0.75rem',
              color: '#f87171',
              fontSize: '0.82rem',
              marginBottom: '1.25rem'
            }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                Rider Full Name:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Vikram Singh"
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  required
                />
                <User size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                Access Password:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password..."
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  required
                />
                <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '0.85rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
              }}
            >
              {loginLoading ? 'Authenticating...' : 'Sign In as Delivery Rider'}
            </button>
          </form>

          {/* Quick Demo Pickers */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '0.65rem' }}>
              Quick-fill demo rider credentials:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { name: 'Vikram Singh', pass: 'deliver123' },
                { name: 'Rajesh Kumar', pass: 'deliver123' },
                { name: 'Arjun Sharma', pass: 'deliver123' }
              ].map((r) => (
                <button
                  key={r.name}
                  onClick={() => {
                    setNameInput(r.name);
                    setPasswordInput(r.pass);
                  }}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: '#93c5fd',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer'
                  }}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // 2. LOGGED IN DELIVERY RIDER DASHBOARD
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Rider Profile & Status Control Header */}
      <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          
          {/* Rider Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)'
            }}>
              <Bike size={28} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#ffffff' }}>
                  {partner.name}
                </h2>
                <span className={`badge ${isDelivering ? 'badge-amber' : 'badge-emerald'}`}>
                  {isDelivering ? 'Delivering Active' : 'Free & Available'}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Phone: <strong style={{ color: '#e2e8f0' }}>{partner.phone}</strong> • Vehicle: {partner.vehicle_type} ({partner.vehicle_no}) • Rating: ⭐ {partner.rating}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              padding: '0.55rem 1rem',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* REQUIREMENT: CHECKBOX TO TICK WHEN THEY GET A DELIVER AND NO TICK FOR FREE (NOTIFIES ADMIN) */}
        <div style={{
          marginTop: '1.5rem',
          backgroundColor: isDelivering ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
          border: `1.5px solid ${isDelivering ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Clickable Large Checkbox / Switch */}
            <div 
              onClick={() => !updatingStatus && handleToggleStatus(!isDelivering)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: isDelivering ? '#f59e0b' : 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                transition: 'all 0.2s ease'
              }}
            >
              {isDelivering ? <CheckSquare size={24} /> : <Square size={24} color="#94a3b8" />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                  {isDelivering 
                    ? '☑️ Currently On Active Delivery (Checked)' 
                    : '⬜ Free & Available for Orders (No Tick)'
                  }
                </span>
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                  Notifies Admin in Real-Time
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
                {isDelivering
                  ? 'Your status is set to Busy Delivering. Admin dashboard and dispatchers see you are engaged with orders.'
                  : 'You have unticked delivery status. You are marked as FREE and ready to receive fresh order dispatches.'
                }
              </p>
            </div>
          </div>

          <button
            onClick={() => handleToggleStatus(!isDelivering)}
            disabled={updatingStatus}
            style={{
              backgroundColor: isDelivering ? '#d97706' : '#10b981',
              color: '#ffffff',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
            }}
          >
            <span>{updatingStatus ? 'Updating...' : isDelivering ? 'Untick (Mark as Free)' : 'Tick (Mark Delivering)'}</span>
          </button>
        </div>

        {/* Toast Alert when status is toggled */}
        {statusNotification && (
          <div style={{
            marginTop: '0.85rem',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '10px',
            padding: '0.65rem 1rem',
            fontSize: '0.82rem',
            color: '#93c5fd',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Bell size={16} />
            <span>{statusNotification}</span>
          </div>
        )}

      </div>

      {/* ASSIGNED DELIVERIES LIST */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#f8fafc' }}>
              My Assigned Deliveries ({deliveries.length})
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
              Shows to where you are delivering, to whom, their contact number, and customer's route advice.
            </p>
          </div>
        </div>

        {deliveries.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {deliveries.map((delivery) => {
              // Direct Google Maps Universal Directions URL
              const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(delivery.origin)}&destination=${encodeURIComponent(delivery.customer_address)}&travelmode=driving`;

              return (
                <div 
                  key={delivery.id}
                  className="glass-panel"
                  style={{
                    padding: '1.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
                  }}
                >
                  {/* Top Bar of Delivery Card */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Package size={22} color="#60a5fa" />
                      <div>
                        <strong style={{ fontSize: '1.15rem', color: '#ffffff' }}>
                          Shipment #{delivery.tracking_code}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                          ({delivery.package_type} • {delivery.weight_kg}kg)
                        </span>
                      </div>
                    </div>

                    <span className={`badge ${
                      delivery.status === 'Delivered' ? 'badge-emerald' : 
                      delivery.status === 'Out for Delivery' ? 'badge-blue' : 'badge-amber'
                    }`}>
                      {delivery.status}
                    </span>
                  </div>

                  {/* 2-Column Delivery Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    
                    {/* TO WHOM (Customer Name & Customer Personal Phone Number) */}
                    <div style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.7)',
                      borderRadius: '14px',
                      padding: '1.1rem',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                        👤 To Whom (Recipient):
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                        {delivery.customer_name}
                      </div>

                      {/* Clickable Customer Phone Number */}
                      <div style={{
                        marginTop: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'rgba(30, 41, 59, 0.8)',
                        padding: '0.55rem 0.85rem',
                        borderRadius: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Phone size={15} color="#34d399" />
                          <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                            {delivery.customer_phone}
                          </span>
                        </div>
                        <a
                          href={`tel:${delivery.customer_phone}`}
                          style={{
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            padding: '0.3rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          Call Customer
                        </a>
                      </div>
                    </div>

                    {/* TO WHERE (Destination Address & Origin) */}
                    <div style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.7)',
                      borderRadius: '14px',
                      padding: '1.1rem',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                        📍 To Where (Destination):
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4 }}>
                        {delivery.customer_address}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                        Origin: {delivery.origin}
                      </div>
                    </div>

                  </div>

                  {/* REQUIREMENT: CUSTOMER STATED ROUTE & GOOGLE MAPS NAVIGATION */}
                  <div style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1.5px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '14px',
                    padding: '1.1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <Compass size={22} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>
                            Customer's Stated Route Direction:
                          </span>
                          <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>
                            Follow this to avoid confusion
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.92rem', color: '#fef3c7', fontWeight: 500, lineHeight: 1.45 }}>
                          "{delivery.preferred_route || 'Direct delivery via main society gate.'}"
                        </p>
                      </div>
                    </div>

                    {/* Google Map Navigation Buttons - REQUIREMENT */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid rgba(245, 158, 11, 0.2)', paddingTop: '0.85rem' }}>
                      {/* Button 1: Directly Open in Google Maps */}
                      <a
                        href={googleMapsDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          padding: '0.65rem 1.25rem',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          textDecoration: 'none',
                          boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
                        }}
                      >
                        <ExternalLink size={16} />
                        <span>Open in Google Maps GPS Navigation</span>
                      </a>

                      {/* Button 2: In-app Map Preview Modal */}
                      <button
                        onClick={() => onOpenMap(delivery)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: '#cbd5e1',
                          padding: '0.65rem 1.1rem',
                          borderRadius: '10px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Navigation size={16} />
                        <span>Preview Route Map</span>
                      </button>
                    </div>
                  </div>

                  {/* UPDATE MILESTONE & CHECKPOINTS CONSOLE */}
                  <div style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '14px',
                    padding: '1.1rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                        Update Delivery Milestone & Checkpoint:
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                        Current Checkpoint: <strong>{delivery.current_checkpoint}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        placeholder="Type current location (e.g. Near Metro Pillar 188 Gate 3)..."
                        value={checkpointInputs[delivery.id] || ''}
                        onChange={(e) => setCheckpointInputs({ ...checkpointInputs, [delivery.id]: e.target.value })}
                        style={{ flex: 1, minWidth: '220px', fontSize: '0.82rem' }}
                      />

                      <button
                        onClick={() => handleUpdateMilestone(delivery.id, 'Picked Up')}
                        style={{
                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          padding: '0.55rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Mark Picked Up
                      </button>

                      <button
                        onClick={() => handleUpdateMilestone(delivery.id, 'Out for Delivery')}
                        style={{
                          backgroundColor: 'rgba(245, 158, 11, 0.2)',
                          color: '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          padding: '0.55rem 0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Out for Delivery
                      </button>

                      <button
                        onClick={() => handleUpdateMilestone(delivery.id, 'Delivered')}
                        style={{
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          padding: '0.55rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)'
                        }}
                      >
                        ✓ Mark Delivered
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
            <h4 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0' }}>No Active Deliveries Assigned</h4>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              You are currently free or all assigned shipments have been completed.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
